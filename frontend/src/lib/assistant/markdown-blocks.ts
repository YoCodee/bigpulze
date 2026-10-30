/**
 * Minimal block parser for assistant chat replies: plain text (with
 * `**bold**` handled at render time) and GFM-style pipe tables.
 *
 * The system prompt keeps answers to these two shapes, so a full markdown
 * parser is unnecessary. Robust to mid-stream content: a partially received
 * table still renders the rows received so far.
 */

export type TableAlign = 'left' | 'center' | 'right';

export type MarkdownBlock =
  | { type: 'text'; content: string }
  | {
      type: 'table';
      align: TableAlign[];
      header: string[];
      rows: string[][];
    };

/** `:---`, `:---:`, `---:` etc. — GFM alignment row cells. */
const SEPARATOR_CELL = /^:?-{2,}:?$/;

function isTableRow(line: string): boolean {
  return line.trim().startsWith('|');
}

function splitRow(line: string): string[] {
  let cell = line.trim();
  if (cell.startsWith('|')) cell = cell.slice(1);
  if (cell.endsWith('|')) cell = cell.slice(0, -1);
  return cell.split('|').map((part) => part.trim());
}

function parseAlign(separatorCells: string[], columnCount: number): TableAlign[] {
  return Array.from({ length: columnCount }, (_, i) => {
    const cell = separatorCells[i] || '';
    if (cell.startsWith(':') && cell.endsWith(':')) return 'center';
    if (cell.endsWith(':')) return 'right';
    return 'left';
  });
}

export function parseMarkdownBlocks(content: string): MarkdownBlock[] {
  const blocks: MarkdownBlock[] = [];
  let textBuffer: string[] = [];
  let tableLines: string[] = [];

  function flushText() {
    if (textBuffer.length > 0) {
      blocks.push({ type: 'text', content: textBuffer.join('\n') });
      textBuffer = [];
    }
  }

  function flushTable() {
    if (tableLines.length === 0) return;

    const header = splitRow(tableLines[0]);
    let align = header.map(() => 'left' as TableAlign);
    let rowsStart = 1;

    if (tableLines.length > 1) {
      const secondRow = splitRow(tableLines[1]);
      const isSeparator =
        secondRow.length > 0 && secondRow.every((cell) => SEPARATOR_CELL.test(cell));
      if (isSeparator) {
        align = parseAlign(secondRow, header.length);
        rowsStart = 2;
      }
    }

    blocks.push({
      type: 'table',
      align,
      header,
      rows: tableLines.slice(rowsStart).map(splitRow),
    });
    tableLines = [];
  }

  for (const line of content.split('\n')) {
    if (isTableRow(line)) {
      flushText();
      tableLines.push(line);
    } else {
      flushTable();
      textBuffer.push(line);
    }
  }
  flushText();
  flushTable();

  return blocks;
}

/** Splits `**bold**` segments; everything else stays plain text. */
export function splitBoldSegments(text: string): Array<{ bold: boolean; text: string }> {
  return text
    .split(/(\*\*[^*]+\*\*)/g)
    .filter((segment) => segment.length > 0)
    .map((segment) =>
      segment.startsWith('**') && segment.endsWith('**') && segment.length > 4
        ? { bold: true, text: segment.slice(2, -2) }
        : { bold: false, text: segment }
    );
}
