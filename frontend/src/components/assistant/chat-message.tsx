'use client';

import React from 'react';
import { ShieldAlert, User, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AssistantChatMessage } from '@/hooks/use-assistant-chat';

const TOOL_LABELS: Record<string, string> = {
  get_pnl_summary: 'Laba-rugi',
  get_top_products: 'Produk terlaris',
  get_branch_comparison: 'Perbandingan cabang',
  get_stock_status: 'Kondisi stok',
  get_forecasts: 'Forecast',
  get_expense_breakdown: 'Pengeluaran',
  get_open_recommendations: 'Rekomendasi terbuka',
};

function toolLabel(name: string): string {
  return TOOL_LABELS[name] || name.replace(/_/g, ' ');
}

export function ChatMessageBubble({ message }: { message: AssistantChatMessage }) {
  const isUser = message.role === 'USER';

  return (
    <div className={cn('flex w-full gap-2.5', isUser ? 'justify-end' : 'justify-start')}>
      {!isUser && (
        <div className="h-7 w-7 rounded-lg bg-brand-500 text-white flex items-center justify-center shadow-xs shrink-0 mt-0.5">
          <Bot className="h-4 w-4" />
        </div>
      )}

      <div className={cn('max-w-[85%] md:max-w-[70%]', isUser && 'flex flex-col items-end')}>
        {!isUser && message.tool_trace.length > 0 && (
          <div className="mb-1 flex flex-wrap gap-1 justify-start">
            {message.tool_trace.map((tool) => (
              <span
                key={tool}
                className="inline-flex items-center gap-1 rounded-md border border-enterprise-200 bg-enterprise-50 px-1.5 py-0.5 text-[10px] font-medium text-enterprise-700"
                title="Data ditarik langsung dari database bisnis (read-only)"
              >
                <ShieldAlert className="h-3 w-3" />
                {toolLabel(tool)}
              </span>
            ))}
          </div>
        )}

        <div
          className={cn(
            'rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed whitespace-pre-wrap shadow-xs',
            isUser
              ? 'bg-brand-500 text-white rounded-br-sm'
              : 'bg-white border border-slate-200 text-slate-900 rounded-bl-sm'
          )}
        >
          {message.content}
          {message.streaming && message.content.length === 0 && (
            <span className="inline-flex gap-1 items-center pl-1 pt-1" aria-label="Mengetik">
              <Dot delay="0s" />
              <Dot delay="0.15s" />
              <Dot delay="0.3s" />
            </span>
          )}
          {message.streaming && message.content.length > 0 && (
            <span className="ml-0.5 inline-block h-3 w-1.5 animate-pulse rounded-sm bg-slate-400 align-middle" />
          )}
        </div>

        {isUser && (
          <div className="mt-1 h-7 w-7 rounded-lg bg-slate-200 text-slate-600 flex items-center justify-center shadow-xs">
            <User className="h-4 w-4" />
          </div>
        )}
      </div>
    </div>
  );
}

function Dot({ delay }: { delay: string }) {
  return (
    <span
      className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce"
      style={{ animationDelay: delay }}
    />
  );
}
