'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  X,
  SendHorizontal,
  Loader2,
  AlertTriangle,
  MessageSquarePlus,
  MessagesSquare,
  Trash2,
  Bot,
  User,
  Database,
} from 'lucide-react';
import { useAssistantChat } from '@/hooks/use-assistant-chat';
import { cn } from '@/lib/utils';

/** Brand mark: the BizPulse pulse polyline (same as the app sidebar logo). */
function PulseMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}

const SUGGESTIONS = [
  'Bagaimana laba sehari terakhir?',
  'Produk apa yang stoknya kritis?',
  'Bandingkan performa cabang 7 hari terakhir',
  'Pengeluaran mana yang paling menguras laba minggu ini?',
];

const TOOL_LABELS: Record<string, string> = {
  get_pnl_summary: 'Laba-rugi',
  get_top_products: 'Produk terlaris',
  get_branch_comparison: 'Perbandingan cabang',
  get_stock_status: 'Kondisi stok',
  get_forecasts: 'Proyeksi',
  get_expense_breakdown: 'Pengeluaran',
  get_open_recommendations: 'Rekomendasi terbuka',
};

function toolLabel(name: string): string {
  return TOOL_LABELS[name] || name.replace(/_/g, ' ');
}

// ── Dot animation (calm stagger, honors reduced motion) ─────────────────────
function Dot({ delay }: { delay: string }) {
  return (
    <span
      className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-pulse motion-reduce:animate-none"
      style={{ animationDelay: delay }}
      aria-hidden="true"
    />
  );
}

// ── Message bubble ────────────────────────────────────────────────────────────
function MessageBubble({
  message,
}: {
  message: {
    id: string;
    role: 'USER' | 'ASSISTANT';
    content: string;
    tool_trace: string[];
    streaming?: boolean;
  };
}) {
  const isUser = message.role === 'USER';
  return (
    <div className={cn('flex w-full gap-2', isUser ? 'justify-end' : 'justify-start')}>
      {!isUser && (
        <div className="h-6 w-6 rounded-lg bg-brand-600 text-white flex items-center justify-center shadow-xs shrink-0 mt-0.5">
          <Bot className="h-3.5 w-3.5" aria-hidden="true" />
        </div>
      )}

      <div className={cn('max-w-[80%]', isUser && 'flex flex-col items-end')}>
        {!isUser && message.tool_trace.length > 0 && (
          <div className="mb-1 flex flex-wrap gap-1 justify-start">
            {message.tool_trace.map((tool) => (
              <span
                key={`${message.id}-${tool}`}
                className="inline-flex items-center gap-1 rounded-md border border-enterprise-200 bg-enterprise-50 px-1.5 py-0.5 text-[10px] font-medium text-enterprise-700"
                title="Data ditarik langsung dari database bisnis (read-only)"
              >
                <Database className="h-3 w-3" aria-hidden="true" />
                {toolLabel(tool)}
              </span>
            ))}
          </div>
        )}

        <div
          className={cn(
            'rounded-2xl px-3 py-2 text-xs leading-relaxed whitespace-pre-wrap shadow-xs',
            isUser
              ? 'bg-enterprise-600 text-white rounded-br-sm'
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
            <span
              className="ml-0.5 inline-block h-3 w-1.5 animate-pulse motion-reduce:animate-none rounded-sm bg-slate-400 align-middle"
              aria-hidden="true"
            />
          )}
        </div>

        {isUser && (
          <div className="mt-1 h-6 w-6 rounded-lg bg-slate-200 text-slate-600 flex items-center justify-center shadow-xs">
            <User className="h-3.5 w-3.5" aria-hidden="true" />
          </div>
        )}
      </div>
    </div>
  );
}

// ── Greeting screen ───────────────────────────────────────────────────────────
function Greeting({
  onSuggestion,
  disabled,
}: {
  onSuggestion: (text: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="flex flex-col items-center text-center py-6 px-4">
      <div className="h-10 w-10 rounded-2xl bg-brand-600 text-white flex items-center justify-center shadow-sm mb-3">
        <PulseMark className="h-5 w-5" />
      </div>
      <h2 className="text-sm font-bold text-slate-900">Ada yang bisa dibantu?</h2>
      <p className="mt-1 text-[11px] text-slate-500 max-w-[260px]">
        Gali data bisnis Anda, minta analisis, atau ajak brainstorming.
      </p>
      <div className="mt-4 grid grid-cols-1 gap-1.5 w-full">
        {SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            disabled={disabled}
            onClick={() => onSuggestion(suggestion)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-[11px] text-slate-700 transition-colors hover:border-enterprise-300 hover:bg-enterprise-50 disabled:opacity-50"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Session list panel ────────────────────────────────────────────────────────
function SessionPanel({
  sessions,
  loading,
  activeSessionId,
  onNewChat,
  onSelect,
  onDelete,
  onClose,
}: {
  sessions: { id: string; title: string }[];
  loading: boolean;
  activeSessionId: string | null;
  onNewChat: () => void;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}) {
  return (
    <div className="flex flex-col h-full">
      <div className="p-2 border-b border-slate-200 shrink-0 flex items-center gap-2">
        <button
          type="button"
          onClick={onNewChat}
          className="flex-1 h-9 inline-flex items-center justify-center gap-1.5 rounded-lg bg-enterprise-600 px-2.5 text-xs font-semibold text-white transition-colors hover:bg-enterprise-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-enterprise-500"
        >
          <MessageSquarePlus className="h-3.5 w-3.5" aria-hidden="true" />
          Percakapan Baru
        </button>
        <button
          type="button"
          onClick={onClose}
          className="h-9 w-9 shrink-0 inline-flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-enterprise-500"
          aria-label="Tutup daftar percakapan"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
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
              'group flex items-stretch gap-0.5 pl-1 pr-1 py-1 rounded-lg transition-colors',
              session.id === activeSessionId ? 'bg-slate-100/90' : 'hover:bg-slate-50'
            )}
          >
            <button
              type="button"
              onClick={() => onSelect(session.id)}
              className={cn(
                'flex-1 min-w-0 text-left px-1.5 py-1 rounded-md text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-enterprise-500',
                session.id === activeSessionId ? 'font-semibold text-slate-900' : 'text-slate-600'
              )}
            >
              {session.title}
            </button>
            <button
              type="button"
              className="w-9 shrink-0 inline-flex items-center justify-center rounded-md text-slate-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(session.id);
              }}
              aria-label={`Hapus percakapan: ${session.title}`}
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main floating chat ────────────────────────────────────────────────────────
export function AIFloatingChat() {
  const {
    sessions,
    sessionsLoading,
    activeSessionId,
    messages,
    messagesLoading,
    sending,
    pageError,
    maxMessageLength,
    selectSession,
    startNewChat,
    deleteSession,
    sendMessage,
  } = useAssistantChat();

  const [isOpen, setIsOpen] = useState(false);
  const [showSessions, setShowSessions] = useState(false);
  const [draft, setDraft] = useState('');
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const fabRef = useRef<HTMLButtonElement | null>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  // Focus textarea when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => textareaRef.current?.focus(), 150);
    }
  }, [isOpen]);

  // Close on Escape, return focus to the launcher
  function closePanel() {
    setIsOpen(false);
    fabRef.current?.focus();
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) closePanel();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen]);

  // Keep Tab cycling inside the open dialog
  function handlePanelKeyDown(e: React.KeyboardEvent) {
    if (e.key !== 'Tab' || !panelRef.current) return;
    const focusables = Array.from(
      panelRef.current.querySelectorAll<HTMLElement>(
        'button:not(:disabled), [href], textarea:not(:disabled), input:not(:disabled), [tabindex]:not([tabindex="-1"])'
      )
    ).filter((el) => el.offsetParent !== null);
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  const canSend =
    !sending && draft.trim().length > 0 && draft.trim().length <= maxMessageLength;

  function handleSend(text?: string) {
    const msg = text ?? draft;
    if (msg.trim().length === 0) return;
    if (text === undefined && !canSend) return;
    setDraft('');
    void sendMessage(msg);
  }

  // Active session title for header display
  const activeSession = sessions.find((s) => s.id === activeSessionId);

  return (
    <>
      {/* ── Backdrop for session panel (mobile) ── */}
      {isOpen && showSessions && (
        <div
          className="fixed inset-0 z-[59] bg-black/20 md:hidden"
          onClick={() => setShowSessions(false)}
        />
      )}

      {/* ── Chat Panel ── */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Asisten AI"
        onKeyDown={handlePanelKeyDown}
        className={cn(
          'fixed z-[60] bg-white border border-slate-200 shadow-2xl flex flex-col overflow-hidden transition-all duration-300',
          // Desktop: floating panel bottom-right
          'md:bottom-24 md:right-6 md:w-[400px] md:h-[580px] md:rounded-2xl',
          // Mobile: bottom sheet
          'bottom-0 left-0 right-0 md:left-auto rounded-t-2xl',
          isOpen
            ? 'opacity-100 translate-y-0 pointer-events-auto h-[580px] max-h-[85vh]'
            : 'opacity-0 translate-y-4 pointer-events-none h-0'
        )}
      >
        {/* ── Session panel overlay ── */}
        {showSessions && (
          <div className="absolute inset-0 z-10 bg-white rounded-2xl flex flex-col overflow-hidden">
            <SessionPanel
              sessions={sessions}
              loading={sessionsLoading}
              activeSessionId={activeSessionId}
              onNewChat={() => {
                startNewChat();
                setShowSessions(false);
              }}
              onSelect={(id) => {
                void selectSession(id);
                setShowSessions(false);
              }}
              onDelete={(id) => void deleteSession(id)}
              onClose={() => setShowSessions(false)}
            />
          </div>
        )}

        {/* ── Header ── */}
        <div className="shrink-0 border-b border-slate-200 bg-white px-3 py-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-8 w-8 rounded-lg bg-brand-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <PulseMark className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900 leading-tight">Asisten AI</p>
              {activeSession ? (
                <p className="text-[10px] text-slate-500 truncate max-w-[180px]">
                  {activeSession.title}
                </p>
              ) : (
                <p className="text-[10px] text-slate-500">Percakapan baru</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {/* Toggle session list */}
            <button
              type="button"
              onClick={() => setShowSessions((p) => !p)}
              className="h-9 w-9 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 inline-flex items-center justify-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-enterprise-500"
              title="Riwayat percakapan"
              aria-label="Riwayat percakapan"
              aria-expanded={showSessions}
            >
              <MessagesSquare className="h-4 w-4" aria-hidden="true" />
            </button>

            {/* New chat */}
            <button
              type="button"
              onClick={startNewChat}
              className="h-9 w-9 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 inline-flex items-center justify-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-enterprise-500"
              title="Percakapan baru"
              aria-label="Percakapan baru"
            >
              <MessageSquarePlus className="h-4 w-4" aria-hidden="true" />
            </button>

            {/* Close panel */}
            <button
              type="button"
              onClick={closePanel}
              className="h-9 w-9 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-500 inline-flex items-center justify-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
              title="Tutup"
              aria-label="Tutup asisten"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* ── Messages area ── */}
        <div
          ref={scrollRef}
          role="log"
          aria-live="polite"
          aria-label="Transkrip percakapan"
          className="flex-1 overflow-y-auto px-3 py-3 space-y-3 bg-slate-50/50"
        >
          {messagesLoading ? (
            <div className="flex h-full items-center justify-center text-slate-400">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <Greeting onSuggestion={(text) => handleSend(text)} disabled={sending} />
          ) : (
            <div className="space-y-3">
              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
            </div>
          )}
        </div>

        {/* ── Error bar ── */}
        {pageError && (
          <div className="mx-3 mb-2 flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 shrink-0">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {pageError}
          </div>
        )}

        {/* ── Composer ── */}
        <div className="shrink-0 border-t border-slate-200 bg-white px-3 py-2.5">
          <div className="flex items-end gap-2">
            <textarea
              ref={textareaRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (canSend) handleSend();
                }
              }}
              rows={1}
              maxLength={maxMessageLength}
              placeholder="Tulis pertanyaan bisnis Anda..."
              className="flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50/75 px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-enterprise-600 focus:outline-none focus:ring-1 focus:ring-enterprise-500/20 max-h-28"
            />
            <button
              type="button"
              disabled={!canSend}
              onClick={() => handleSend()}
              className="h-9 w-9 shrink-0 rounded-xl bg-enterprise-600 text-white flex items-center justify-center transition-colors hover:bg-enterprise-700 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-enterprise-500"
              aria-label="Kirim pertanyaan"
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <SendHorizontal className="h-4 w-4" />
              )}
            </button>
          </div>
          <p className="mt-1.5 text-[10px] text-slate-400">
            Periksa kembali angka penting sebelum mengambil keputusan.
          </p>
        </div>
      </div>

      {/* ── Floating Action Button (hidden on mobile while the sheet is open,
           so it never covers the composer's send button) ── */}
      <button
        ref={fabRef}
        type="button"
        onClick={() => setIsOpen((p) => !p)}
        className={cn(
          'fixed bottom-6 right-6 z-[60] h-14 w-14 rounded-full shadow-lg items-center justify-center transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 motion-reduce:transition-none motion-reduce:hover:scale-100',
          isOpen
            ? 'hidden md:flex bg-slate-700 hover:bg-slate-800 rotate-[20deg]'
            : 'flex bg-brand-600 hover:bg-brand-700 md:hover:scale-110'
        )}
        aria-label={isOpen ? 'Tutup Asisten AI' : 'Buka Asisten AI'}
        aria-expanded={isOpen}
        title={isOpen ? 'Tutup Asisten AI' : 'Buka Asisten AI'}
      >
        <PulseMark className="h-6 w-6 text-white" />
      </button>
    </>
  );
}
