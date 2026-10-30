'use client';

import React from 'react';
import {
  MarkdownBlock,
  parseMarkdownBlocks,
  splitBoldSegments,
  TableAlign,
} from '@/lib/assistant/markdown-blocks';
import { cn } from '@/lib/utils';

function renderInline(text: string): React.ReactNode[] {
  return splitBoldSegments(text).map((segment, i) =>
    segment.bold ? <strong key={i}>{segment.text}</strong> : segment.text
  );
}

const ALIGN_CLASS: Record<TableAlign, string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
};

function TableBlock({ block }: { block: Extract<MarkdownBlock, { type: 'table' }> }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr className="bg-slate-50">
            {block.header.map((cell, i) => (
              <th
                key={i}
                className={cn(
                  'border-b border-slate-200 px-2 py-1.5 font-semibold text-slate-700 whitespace-nowrap',
                  ALIGN_CLASS[block.align[i] || 'left']
                )}
              >
                {renderInline(cell)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {block.rows.map((row, r) => (
            <tr key={r} className="even:bg-slate-50/60">
              {row.map((cell, c) => (
                <td
                  key={c}
                  className={cn(
                    'border-b border-slate-100 px-2 py-1.5 text-slate-800',
                    ALIGN_CLASS[block.align[c] || 'left']
                  )}
                >
                  {renderInline(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Renders an assistant reply: paragraphs with **bold** plus pipe tables. */
export function MessageContent({ content }: { content: string }) {
  if (content.trim().length === 0) return null;

  return (
    <>
      {parseMarkdownBlocks(content).map((block, i) =>
        block.type === 'table' ? (
          <TableBlock key={i} block={block} />
        ) : (
          <p key={i} className="whitespace-pre-wrap">
            {renderInline(block.content)}
          </p>
        )
      )}
    </>
  );
}
