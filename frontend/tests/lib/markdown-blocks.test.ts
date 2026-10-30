import { parseMarkdownBlocks, splitBoldSegments } from '@/lib/assistant/markdown-blocks';
import { describe, expect, it } from 'vitest';

const SAMPLE = `Berikut perbandingan cabang 7 hari terakhir:

| Cabang | Omzet (Rp) | Laba Bersih (Rp) | Transaksi |
| :--- | :--- | :--- | :--- |
| **Malioboro** | 24.760.000 | 12.549.000 | 219 |
| **Condongcatur** | 21.515.000 | 10.442.000 | 209 |
| **Bantul** | 18.805.000 | 170 | 170 |`;

describe('parseMarkdownBlocks', () => {
  it('parses the exact owner-facing table sample', () => {
    const blocks = parseMarkdownBlocks(SAMPLE);
    expect(blocks.length).toBe(2);

    expect(blocks[0].type).toBe('text');
    expect((blocks[0] as { content: string }).content).toContain('Berikut perbandingan');

    const table = blocks[1];
    expect(table.type).toBe('table');
    if (table.type !== 'table') return;
    expect(table.header).toEqual(['Cabang', 'Omzet (Rp)', 'Laba Bersih (Rp)', 'Transaksi']);
    expect(table.align).toEqual(['left', 'left', 'left', 'left']);
    expect(table.rows.length).toBe(3);
    expect(table.rows[0]).toEqual(['**Malioboro**', '24.760.000', '12.549.000', '219']);
    expect(table.rows[2][2]).toBe('170');
  });

  it('reads column alignment from the separator row', () => {
    const blocks = parseMarkdownBlocks(
      '| A | B | C |\n| :--- | :---: | ---: |\n| 1 | 2 | 3 |'
    );
    const table = blocks[0];
    if (table.type !== 'table') return;
    expect(table.align).toEqual(['left', 'center', 'right']);
  });

  it('keeps a table without separator row (mid-stream tolerant)', () => {
    const blocks = parseMarkdownBlocks('| Cabang | Omzet |\n| Bantul | 1.000 |');
    const table = blocks[0];
    if (table.type !== 'table') return;
    expect(table.header).toEqual(['Cabang', 'Omzet']);
    expect(table.rows).toEqual([['Bantul', '1.000']]);
  });

  it('leaves plain multiline text untouched', () => {
    const blocks = parseMarkdownBlocks('Baris 1\n- poin a\n- poin b');
    expect(blocks.length).toBe(1);
    expect(blocks[0].type).toBe('text');
    expect((blocks[0] as { content: string }).content).toBe('Baris 1\n- poin a\n- poin b');
  });

  it('renders a partially streamed table row as received', () => {
    const blocks = parseMarkdownBlocks('| Cabang | Omzet (Rp) |\n| :--- | :--- |\n| Malioboro');
    const table = blocks[0];
    if (table.type !== 'table') return;
    expect(table.rows[0]).toEqual(['Malioboro']);
  });

  it('returns empty for empty content', () => {
    expect(parseMarkdownBlocks('   ')).toEqual([{ type: 'text', content: '   ' }]);
  });
});

describe('splitBoldSegments', () => {
  it('extracts bold segments around plain text', () => {
    expect(splitBoldSegments('**Malioboro** unggul')).toEqual([
      { bold: true, text: 'Malioboro' },
      { bold: false, text: ' unggul' },
    ]);
  });

  it('keeps lone asterisks as plain text', () => {
    expect(splitBoldSegments('a ** b')).toEqual([{ bold: false, text: 'a ** b' }]);
  });
});
