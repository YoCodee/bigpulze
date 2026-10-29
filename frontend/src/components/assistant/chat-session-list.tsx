'use client';

import React from 'react';
import { MessageSquarePlus, Trash2, Loader2, MessagesSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AssistantSession } from '@/hooks/use-assistant-chat';

interface ChatSessionListProps {
  sessions: AssistantSession[];
  loading: boolean;
  activeSessionId: string | null;
  onNewChat: () => void;
  onSelect: (sessionId: string) => void;
  onDelete: (sessionId: string) => void;
}

export function ChatSessionList({
  sessions,
  loading,
  activeSessionId,
  onNewChat,
  onSelect,
  onDelete,
}: ChatSessionListProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="p-2 border-b border-slate-200 shrink-0">
        <button
          type="button"
          onClick={onNewChat}
          className="w-full h-8 inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand-500 px-2.5 text-xs font-semibold text-white transition-colors hover:bg-brand-600"
        >
          <MessageSquarePlus className="h-3.5 w-3.5" />
          Percakapan Baru
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {loading && (
          <div className="flex items-center justify-center py-6 text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        )}

        {!loading && sessions.length === 0 && (
          <div className="flex flex-col items-center gap-1.5 py-6 text-center px-2">
            <MessagesSquare className="h-5 w-5 text-slate-300" />
            <p className="text-[11px] text-slate-500">Belum ada percakapan tersimpan.</p>
          </div>
        )}

        {sessions.map((session) => (
          <div
            key={session.id}
            className={cn(
              'group flex items-center justify-between gap-1 px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors',
              session.id === activeSessionId
                ? 'bg-slate-100/90'
                : 'hover:bg-slate-50'
            )}
            onClick={() => onSelect(session.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') onSelect(session.id);
            }}
          >
            <span
              className={cn(
                'truncate text-xs',
                session.id === activeSessionId
                  ? 'font-semibold text-slate-900'
                  : 'text-slate-600'
              )}
            >
              {session.title}
            </span>
            <button
              type="button"
              className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-rose-600"
              onClick={(event) => {
                event.stopPropagation();
                onDelete(session.id);
              }}
              aria-label="Hapus percakapan"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
