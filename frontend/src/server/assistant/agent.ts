import {
  GeminiContent,
  GeminiFunctionCall,
  GeminiPart,
  GeminiRequestBody,
  extractPartsFromPayload,
  parseGeminiSseStream,
  requireGeminiConfig,
  streamGemini,
} from './gemini';
import { toGeminiContents, ChatHistoryMessage } from './history';
import { ToolContext, ToolDefinition, ToolResult } from './tools/types';

/** How many model/tool roundtrips a single user question may take. */
export const MAX_TOOL_ROUNDS = 4;

export type AssistantEvent =
  | { type: 'text'; text: string }
  | { type: 'tool_start'; name: string }
  | { type: 'tool_done'; name: string }
  | { type: 'error'; message: string };

export interface AssistantTurnInput {
  systemPrompt: string;
  history: ChatHistoryMessage[];
  tools: ToolDefinition[];
  toolContext: ToolContext;
  /** Client stop button: aborting cancels the Gemini request mid-flight. */
  signal?: AbortSignal;
  emit: (event: AssistantEvent) => void;
}

export interface AssistantTurnResult {
  replyText: string;
  toolTrace: string[];
}

type Emit = AssistantTurnInput['emit'];

/**
 * Runs one assistant turn: replay history, stream the answer, and execute
 * any requested tools (bounded rounds) before producing the final reply.
 */
export async function runAssistantTurn(input: AssistantTurnInput): Promise<AssistantTurnResult> {
  const config = requireGeminiConfig();
  const contents: GeminiContent[] = toGeminiContents(input.history);
  const toolTrace: string[] = [];
  let streamedText = '';

  for (let round = 0; round < MAX_TOOL_ROUNDS; round += 1) {
    const { text, functionCalls, modelParts } = await streamModelRound(input, config, contents, input.signal);

    if (functionCalls.length === 0) {
      return { replyText: text || 'Maaf, saya tidak dapat menjawab saat ini.', toolTrace };
    }

    if (text) {
      streamedText = text;
    }

    // Hand the requested tools back to the model and continue the loop.
    contents.push({ role: 'model', parts: modelParts });
    const responses = await executeToolCalls(input, functionCalls, toolTrace);
    contents.push({ role: 'user', parts: responses });
  }

  return {
    replyText:
      streamedText ||
      'Batas langkah analisis tercapai. Coba ajukan pertanyaan yang lebih ringkas.',
    toolTrace,
  };
}

/**
 * Streams one model round: relays text through `emit` and returns the
 * accumulated text plus any function calls.
 */
async function streamModelRound(
  input: AssistantTurnInput,
  config: { apiKey: string; model: string },
  contents: GeminiContent[],
  signal?: AbortSignal
): Promise<{ text: string; functionCalls: GeminiFunctionCall[]; modelParts: GeminiPart[] }> {
  const requestBody: GeminiRequestBody = {
    contents,
    systemInstruction: { parts: [{ text: input.systemPrompt }] },
    generationConfig: { temperature: 0.4 },
  };
  if (input.tools.length > 0) {
    requestBody.tools = {
      functionDeclarations: input.tools.map((tool) => ({
        name: tool.declaration.name,
        description: tool.declaration.description,
        parameters: tool.declaration.parameters as unknown as Record<string, unknown>,
      })),
    };
  }

  const response = await streamGemini(config, requestBody, signal);
  if (!response.ok || !response.body) {
    const detail = await response.text().catch(() => '');
    console.error(`Gemini HTTP ${response.status}: ${detail.slice(0, 500)}`);
    throw new Error(
      `GEMINI_HTTP_${response.status}${detail ? `: ${detail.slice(0, 300)}` : ''}`
    );
  }

  let text = '';
  const functionCalls: GeminiFunctionCall[] = [];
  const modelParts: GeminiPart[] = [];

  try {
    for await (const payload of parseGeminiSseStream(response.body)) {
      const extracted = extractPartsFromPayload(payload);
      if (extracted.blockedReason) {
        throw new Error(`GEMINI_BLOCKED_${extracted.blockedReason}`);
      }
      if (extracted.text) {
        text += extracted.text;
        input.emit({ type: 'text', text: extracted.text });
      }
      // Push the RAW parts: they carry the model's thought_signature, which
      // Gemini 3.x requires verbatim when replaying this turn with tool results.
      modelParts.push(...extracted.rawParts);
      for (const call of extracted.functionCalls) {
        functionCalls.push(call);
      }
    }
  } catch (error) {
    // Release the connection on stalls so the HTTP pool is not exhausted.
    await response.body.cancel().catch(() => undefined);
    console.error('Gemini stream failed:', error instanceof Error ? error.message : error);
    throw error;
  }

  return { text, functionCalls, modelParts };
}

/**
 * Validates and executes each requested tool, returning Gemini function
 * response parts (always including errors as data so the model can explain).
 */
async function executeToolCalls(
  input: AssistantTurnInput,
  functionCalls: GeminiFunctionCall[],
  toolTrace: string[]
): Promise<GeminiPart[]> {
  const emit: Emit = input.emit;
  const parts: GeminiPart[] = [];

  for (const call of functionCalls) {
    emit({ type: 'tool_start', name: call.name });

    const tool = input.tools.find((candidate) => candidate.declaration.name === call.name);
    let response: ToolResult;
    if (!tool) {
      response = { error: `TOOL_TIDAK_DIKENAL: ${call.name}` };
    } else {
      const parsed = tool.schema.safeParse(call.args ?? {});
      if (!parsed.success) {
        const issues = parsed.error.issues.map((issue) => issue.message).join('; ');
        response = { error: `PARAM_TIDAK_VALID: ${issues}` };
      } else {
        try {
          response = await tool.execute(input.toolContext, parsed.data as Record<string, unknown>);
        } catch (error) {
          response = {
            error: error instanceof Error ? error.message : 'Tool gagal dijalankan.',
          };
        }
      }
    }

    emit({ type: 'tool_done', name: call.name });
    if (!toolTrace.includes(call.name)) {
      toolTrace.push(call.name);
    }
    parts.push({ functionResponse: { name: call.name, response: { result: response } } });
  }

  return parts;
}
