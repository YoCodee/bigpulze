/**
 * Gemini function-calling declaration schema types (v1beta REST).
 * Note: Gemini uses UPPER_CASE type names (OBJECT, STRING, ...).
 */

export type GeminiSchemaType =
  | 'STRING'
  | 'NUMBER'
  | 'INTEGER'
  | 'BOOLEAN'
  | 'OBJECT'
  | 'ARRAY';

export interface GeminiToolParameter {
  type: GeminiSchemaType;
  description: string;
  items?: GeminiToolParameter;
  enum?: string[];
  properties?: Record<string, GeminiToolParameter>;
  required?: string[];
}

export interface GeminiToolDeclaration {
  name: string;
  description: string;
  parameters: GeminiToolParameter;
}
