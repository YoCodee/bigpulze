/**
 * Thin REST client for the Google Gemini API (v1beta, no SDK dependency).
 * Uses the streaming endpoint (streamGenerateContent with SSE) so answers
 * can be relayed to the browser progressively.
 */

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
/**
 * gemini-2.5-flash is no longer available for new API users (HTTP 404);
 * gemini-3.8-flash accepts the same v1beta streamGenerateContent + tools shape.
 */
const DEFAULT_MODEL = 'gemini-3.8-flash';

export interface GeminiFunctionCall {
  name: string;
  args: Record<string, unknown>;
}

export type GeminiPart =
  | { text: string }
  | { functionCall: GeminiFunctionCall }
  | {
      functionResponse: {
        name: string;
        response: Record<string, unknown>;
      };
    };

export interface GeminiContent {
  role: 'user' | 'model';
  parts: GeminiPart[];
}

export interface GeminiToolDeclarationEnvelope {
  functionDeclarations: Array<{
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  }>;
}

export interface GeminiRequestBody {
  contents: GeminiContent[];
  systemInstruction: { parts: Array<{ text: string }> };
  tools?: GeminiToolDeclarationEnvelope;
  generationConfig?: { temperature?: number; maxOutputTokens?: number };
}

export interface GeminiConfig {
  apiKey: string;
  model: string;
}

/** Reads Gemini settings; throws a named error the route can map to HTTP 500. */
export function requireGeminiConfig(): GeminiConfig {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('MISSING_GEMINI_API_KEY');
  }
  return { apiKey, model: process.env.GEMINI_MODEL || DEFAULT_MODEL };
}

/** Statuses worth a transparent retry: transient capacity/quota hiccups. */
const RETRYABLE_STATUS = new Set([429, 500, 503]);
const RETRY_ATTEMPTS = 3;
const RETRY_BASE_DELAY_MS = 700;
/** Kill a fetch that never returns headers (server-side hang). */
const CONNECT_TIMEOUT_MS = 20_000;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Starts a streaming Gemini generateContent request.
 * - Retries transient failures (429/500/503) with short backoff.
 * - Aborts and retries when headers never arrive (GEMINI_CONNECT_TIMEOUT).
 * The connect timer is cleared as soon as headers arrive, so the streaming
 * body itself is never aborted by it; mid-stream stalls are handled by
 * parseGeminiSseStream's idle timeout instead.
 */
export async function streamGemini(
  config: GeminiConfig,
  body: GeminiRequestBody
): Promise<Response> {
  const url = `${GEMINI_API_BASE}/${config.model}:streamGenerateContent?alt=sse`;
  const bodyJson = JSON.stringify(body);
  let lastStatusResponse: Response | null = null;
  let lastError: unknown = new Error('GEMINI_CONNECT_TIMEOUT');

  for (let attempt = 0; attempt < RETRY_ATTEMPTS; attempt += 1) {
    if (attempt > 0) {
      await delay(RETRY_BASE_DELAY_MS * attempt);
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), CONNECT_TIMEOUT_MS);
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': config.apiKey,
        },
        body: bodyJson,
        signal: controller.signal,
      });

      if (!RETRYABLE_STATUS.has(response.status)) {
        return response;
      }
      lastStatusResponse = response;
      lastError = null;
    } catch (error) {
      lastError =
        error instanceof Error && error.name === 'AbortError'
          ? new Error('GEMINI_CONNECT_TIMEOUT')
          : error;
    } finally {
      clearTimeout(timer);
    }
  }

  if (lastStatusResponse) {
    return lastStatusResponse;
  }
  throw lastError;
}

interface GeminiPayload {
  candidates?: Array<{
    content?: { role?: string; parts?: Array<Record<string, unknown>> };
    finishReason?: string;
  }>;
  promptFeedback?: { blockReason?: string };
}

/**
 * Extracts incremental text and function calls from one SSE payload.
 * Pure helper: text is concatenated by the caller.
 */
export function extractPartsFromPayload(payload: unknown): {
  text: string;
  functionCalls: GeminiFunctionCall[];
  blockedReason: string | null;
} {
  const result = { text: '', functionCalls: [] as GeminiFunctionCall[], blockedReason: null as string | null };
  const typed = payload as GeminiPayload;

  if (typed?.promptFeedback?.blockReason) {
    result.blockedReason = typed.promptFeedback.blockReason;
  }

  const candidate = typed?.candidates?.[0];
  const parts = candidate?.content?.parts || [];
  for (const part of parts) {
    if (typeof part.text === 'string') {
      result.text += part.text;
    } else if (
      part.functionCall &&
      typeof part.functionCall === 'object' &&
      typeof (part.functionCall as GeminiFunctionCall).name === 'string'
    ) {
      const call = part.functionCall as GeminiFunctionCall;
      result.functionCalls.push({
        name: call.name,
        args: (call.args || {}) as Record<string, unknown>,
      });
    }
  }
  return result;
}

const DEFAULT_IDLE_TIMEOUT_MS = 30_000;

/**
 * Rejects when a promise does not settle within the deadline.
 * Used so a stalled SSE connection cannot freeze a chat turn forever.
 */
function withIdleTimeout<T>(
  promise: Promise<T>,
  idleTimeoutMs: number
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('GEMINI_STALL_TIMEOUT'));
    }, idleTimeoutMs);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}

/**
 * Parses the SSE response body of streamGenerateContent, yielding payloads.
 * Bails out (GEMINI_STALL_TIMEOUT) when no bytes arrive within idleTimeoutMs,
 * and yields nothing for non-data lines (event boundaries are ignored).
 */
export async function* parseGeminiSseStream(
  body: ReadableStream<Uint8Array>,
  idleTimeoutMs: number = DEFAULT_IDLE_TIMEOUT_MS
): AsyncGenerator<unknown, void, unknown> {
  const decoder = new TextDecoder();
  const reader = body.getReader();
  let buffer = '';

  for (;;) {
    const { done, value } = await withIdleTimeout(reader.read(), idleTimeoutMs);
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let newlineIndex = buffer.indexOf('\n');
    while (newlineIndex !== -1) {
      const line = buffer.slice(0, newlineIndex).trim();
      buffer = buffer.slice(newlineIndex + 1);
      newlineIndex = buffer.indexOf('\n');
      if (!line.startsWith('data:')) continue;
      const jsonText = line.slice(5).trim();
      if (!jsonText || jsonText === '[DONE]') continue;
      try {
        yield JSON.parse(jsonText);
      } catch {
        // Skip malformed SSE chunks; the stream continues.
      }
    }
  }
}
