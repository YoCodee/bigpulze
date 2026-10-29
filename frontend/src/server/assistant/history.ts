import { GeminiContent, GeminiPart } from './gemini';

/** How many recent messages are replayed to the model each turn. */
export const MAX_HISTORY_MESSAGES = 14;

export interface ChatHistoryMessage {
  role: 'USER' | 'ASSISTANT';
  content: string;
}

/** Property names are snake_case to match the RoL, DB and API layer. */
export interface ChatMessageRow {
  role: string;
  content: string;
}

/**
 * Keeps only the most recent MAX_HISTORY_MESSAGES messages and guarantees the
 * trimmed slice starts with a USER message (a model-only opening would break
 * strict alternation for the API).
 */
export function trimHistory(messages: ChatHistoryMessage[]): ChatHistoryMessage[] {
  const recent = [...messages].slice(-MAX_HISTORY_MESSAGES);
  const firstUserIndex = recent.findIndex((message) => message.role === 'USER');
  return firstUserIndex === -1 ? [] : recent.slice(firstUserIndex);
}

/**
 * Maps stored DB rows (role in USER|ASSISTANT, tool_trace jsonb ignored)
 * into Gemini contents: user -> user, assistant -> model.
 */
export function toGeminiContents(messages: ChatHistoryMessage[]): GeminiContent[] {
  return messages
    .filter((message) => message.role === 'USER' || message.role === 'ASSISTANT')
    .filter((message) => message.content.trim().length > 0)
    .map((message) => ({
      role: message.role === 'USER' ? ('user' as const) : ('model' as const),
      parts: [{ text: message.content }] as GeminiPart[],
    }));
}

/** Builds a short session title from the first user question. */
export function deriveSessionTitle(question: string, maxLength = 60): string {
  const collapsed = question.replace(/\s+/g, ' ').trim();
  if (collapsed.length <= maxLength) {
    return collapsed.length > 0 ? collapsed : 'Percakapan Baru';
  }
  const cut = collapsed.slice(0, maxLength).trimEnd();
  return `${cut}…`;
}

/**
 * Normalizes stored rows into history messages, dropping unknown roles.
 * Pure helper used when loading a session's transcript.
 */
export function rowsToHistory(rows: ChatMessageRow[]): ChatHistoryMessage[] {
  return rows
    .filter((row) => row.role === 'USER' || row.role === 'ASSISTANT')
    .map((row) => ({
      role: row.role === 'USER' ? ('USER' as const) : ('ASSISTANT' as const),
      content: row.content,
    }));
}
