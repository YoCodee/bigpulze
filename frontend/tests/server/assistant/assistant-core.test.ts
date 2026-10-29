import { MAX_RANGE_DAYS, resolveDateRange, shiftWibDate } from '@/server/assistant/tools/range';
import { buildSystemPrompt } from '@/server/assistant/prompt';
import { extractPartsFromPayload } from '@/server/assistant/gemini';
import { describe, expect, it } from 'vitest';

describe('resolveDateRange', () => {
  it('swaps a reversed range', () => {
    const range = resolveDateRange({ date_from: '2026-01-20', date_to: '2026-01-10' });
    expect(range.date_from).toBe('2026-01-10');
    expect(range.date_to).toBe('2026-01-20');
  });

  it('clamps windows wider than the maximum', () => {
    const range = resolveDateRange({
      date_from: '2025-01-01',
      date_to: '2026-01-10',
    });
    expect(range.date_to).toBe('2026-01-10');
    const days =
      Math.round(
        (Date.parse(range.date_to) - Date.parse(range.date_from)) / 86_400_000
      ) + 1;
    expect(days).toBe(MAX_RANGE_DAYS);
  });

  it('falls back to a 7-day window ending today when dates are missing', () => {
    const range = resolveDateRange(undefined);
    expect(new Date(range.date_to).getTime()).not.toBeNaN();
    const days =
      Math.round(
        (Date.parse(range.date_to) - Date.parse(range.date_from)) / 86_400_000
      ) + 1;
    expect(days).toBe(7);
  });
});

describe('shiftWibDate', () => {
  it('shifts plain dates and keeps month boundaries honest', () => {
    expect(shiftWibDate('2026-03-01', -1)).toBe('2026-02-28');
    expect(shiftWibDate('2026-01-01', -1)).toBe('2025-12-31');
    expect(shiftWibDate('2026-02-28', 1)).toBe('2026-03-01');
  });
});

describe('buildSystemPrompt', () => {
  const input = {
    ownerName: 'Pak Budi',
    orgName: 'Kopi Senja',
    branchNames: ['Malioboro', 'Bantul'],
    todayLabel: 'Kamis, 29 Oktober 2026',
  };

  it('embeds business context', () => {
    const prompt = buildSystemPrompt(input);
    expect(prompt).toContain('Kopi Senja');
    expect(prompt).toContain('Malioboro, Bantul');
    expect(prompt).toContain('Pak Budi');
    expect(prompt).toContain('29 Oktober 2026');
  });

  it('contains the anti-hallucination and read-only rules', () => {
    const prompt = buildSystemPrompt(input);
    expect(prompt).toContain('WAJIB berasal dari hasil pemanggilan tool');
    expect(prompt).toContain('read-only');
  });

  it('handles the no-branch case', () => {
    const prompt = buildSystemPrompt({ ...input, branchNames: [] });
    expect(prompt).toContain('-');
  });
});

describe('extractPartsFromPayload', () => {
  it('extracts incremental text', () => {
    const payload = {
      candidates: [{ content: { role: 'model', parts: [{ text: 'Halo, ' }] } }],
    };
    expect(extractPartsFromPayload(payload).text).toBe('Halo, ');
  });

  it('extracts function calls with args', () => {
    const payload = {
      candidates: [
        {
          content: {
            parts: [
              {
                functionCall: {
                  name: 'get_pnl_summary',
                  args: { date_from: '2026-01-01' },
                },
              },
            ],
          },
        },
      ],
    };
    const result = extractPartsFromPayload(payload);
    expect(result.functionCalls.length).toBe(1);
    expect(result.functionCalls[0].name).toBe('get_pnl_summary');
    expect(result.functionCalls[0].args).toEqual({ date_from: '2026-01-01' });
  });

  it('preserves thought_signature on all parts for replay (Gemini 3.x requirement)', () => {
    const payload = {
      candidates: [
        {
          content: {
            parts: [
              { text: 'Saya cek data dulu.', thoughtSignature: 'sig_text' },
              {
                functionCall: { name: 'get_pnl_summary', args: {} },
                thoughtSignature: 'sig_call',
              },
            ],
          },
        },
      ],
    };
    const result = extractPartsFromPayload(payload);
    expect(result.rawParts).toEqual([
      { text: 'Saya cek data dulu.', thoughtSignature: 'sig_text' },
      {
        functionCall: { name: 'get_pnl_summary', args: {} },
        thoughtSignature: 'sig_call',
      },
    ]);
  });

  it('reports prompt block reasons', () => {
    const payload = { promptFeedback: { blockReason: 'SAFETY' } };
    expect(extractPartsFromPayload(payload).blockedReason).toBe('SAFETY');
  });

  it('is tolerant to null-ish payloads', () => {
    expect(extractPartsFromPayload(null).rawParts).toEqual([]);
    expect(extractPartsFromPayload(null).text).toBe('');
    expect(extractPartsFromPayload(null).functionCalls).toEqual([]);
    expect(extractPartsFromPayload(null).blockedReason).toBeNull();
  });
});
