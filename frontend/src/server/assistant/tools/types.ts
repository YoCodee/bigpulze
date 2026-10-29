import { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import type { GeminiToolDeclaration } from './gemini-schema';

/**
 * Shared contracts for assistant business data tools.
 * Every tool queries Supabase with the signed-in owner's client so Row Level
 * Security stays enforced. Tools are read-only by design.
 */

export interface ToolContext {
  supabase: SupabaseClient;
  orgId: string;
}

/**
 * Loose payload returned by tools. Values must be JSON-serializable because
 * they are sent to the LLM as function-call responses.
 */
export interface ToolResult {
  [key: string]: unknown;
}

export interface ToolDefinition {
  declaration: GeminiToolDeclaration;
  /** Zod schema validating the model-provided arguments. */
  schema: z.ZodTypeAny;
  execute(context: ToolContext, args: Record<string, unknown>): Promise<ToolResult>;
}
