/**
 * Thin REST client for the Google Gemini API (v1beta, no SDK dependency).
 * Uses the streaming endpoint (streamGenerateContent with SSE) so answers
 * can be relayed to the browser progressively.
 */

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const DEFAULT_MODEL = 'gemini-2.5-flash';

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

/** Starts a streaming Gemini generateContent request. */
export async function streamGemini(
  config: GeminiConfig,
  body: GeminiRequestBody
): Promise<Response> {
  const url = `${GEMINI_API_BASE}/${config.model}:streamGenerateContent?alt=sse`;
  return fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': config.apiKey,
    },
    body: JSON.stringify(body),
  });
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

/**
 * Parses the SSE response body of streamGenerateContent, yielding payloads.
 * Yields nothing for non-data lines (event boundaries are ignored).
 */
export async function* parseGeminiSseStream(
  body: ReadableStream<Uint8Array>
): AsyncGenerator<unknown, void, unknown> {
  const decoder = new TextDecoder();
  const reader = body.getReader();
  let buffer = '';

  for (;;) {
    const { done, value } = await reader.read();
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
