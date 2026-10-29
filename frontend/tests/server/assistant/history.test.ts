import {
  deriveSessionTitle,
  rowsToHistory,
  toGeminiContents,
  trimHistory,
} from '@/server/assistant/history';
import { describe, expect, it } from 'vitest';

describe('trimHistory', () => {
  it('returns an empty list when there is no user message', () => {
    const result = trimHistory([
      { role: 'ASSISTANT', content: 'Halo' },
    ]);
    expect(result).toEqual([]);
  });

  it('removes leading assistant messages so the slice starts with USER', () => {
    const result = trimHistory([
      { role: 'ASSISTANT', content: 'greeting' },
      { role: 'USER', content: 'q1' },
      { role: 'ASSISTANT', content: 'a1' },
      { role: 'USER', content: 'q2' },
    ]);
    expect(result.map((m) => m.role)).toEqual(['USER', 'ASSISTANT', 'USER']);
  });

  it('keeps only the most recent messages', () => {
    const many = Array.from({ length: 20 }, (_, index) => ({
      role: (index % 2 === 0 ? 'USER' : 'ASSISTANT') as 'USER' | 'ASSISTANT',
      content: `m${index}`,
    }));
    const result = trimHistory(many);
    expect(result.length).toBeLessThanOrEqual(20);
    expect(result[result.length - 1].content).toBe('m19');
    expect(result[0].role).toBe('USER');
  });
});

describe('toGeminiContents', () => {
  it('maps USER to user and ASSISTANT to model with text parts', () => {
    const contents = toGeminiContents([
      { role: 'USER', content: 'omzet?' },
      { role: 'ASSISTANT', content: 'jawaban' },
    ]);
    expect(contents).toEqual([
      { role: 'user', parts: [{ text: 'omzet?' }] },
      { role: 'model', parts: [{ text: 'jawaban' }] },
    ]);
  });

  it('drops empty contents and unknown roles', () => {
    const contents = toGeminiContents([
      { role: 'USER', content: '   ' },
      { role: 'SYSTEM' as 'USER', content: 'noise' },
      { role: 'USER', content: 'halo' },
    ]);
    expect(contents.length).toBe(1);
    expect(contents[0].role).toBe('user');
  });
});

describe('deriveSessionTitle', () => {
  it('collapses whitespace and keeps short questions as is', () => {
    expect(deriveSessionTitle('  bagaimana   laba\nbesok? ')).toBe('bagaimana laba besok?');
  });

  it('truncates long questions with an ellipsis', () => {
    const title = deriveSessionTitle('a'.repeat(80), 60);
    expect(title.length).toBe(61);
    expect(title.endsWith('…')).toBe(true);
  });

  it('falls back to the default title for empty input', () => {
    expect(deriveSessionTitle('   ')).toBe('Percakapan Baru');
  });
});

describe('rowsToHistory', () => {
  it('normalizes DB rows and ignores unknown roles', () => {
    const history = rowsToHistory([
      { role: 'USER', content: 'q' },
      { role: 'ASSISTANT', content: 'a' },
      { role: 'TOOL', content: 'noise' },
    ]);
    expect(history).toEqual([
      { role: 'USER', content: 'q' },
      { role: 'ASSISTANT', content: 'a' },
    ]);
  });
});
