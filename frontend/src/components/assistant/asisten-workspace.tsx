'use client';

import React, { useEffect, useRef, useState } from 'react';
import { X, Menu, Sparkles, SendHorizontal, Loader2, AlertTriangle } from 'lucide-react';
import { useAssistantChat } from '@/hooks/use-assistant-chat';
import { ChatMessageBubble } from './chat-message';
import { ChatSessionList } from './chat-session-list';

const SUGGESTIONS = [
  'Bagaimana laba sehari terakhir?',
  'Produk apa yang stoknya kritis?',
  'Bandingkan performa cabang 7 hari terakhir',
  'Pengeluaran mana yang paling menguras laba minggu ini?',
];

export function AsistenWorkspace() {
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

  const [draft, setDraft] = useState('');
  const [sessionsPanelOpen, setSessionsPanelOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Keep the newest message in view.
  useEffect(() => {
    const element = scrollRef.current;
    if (element) element.scrollTop = element.scrollHeight;
  }, [messages]);

  const canSend =
    !sending && draft.trim().length > 0 && draft.trim().length <= maxMessageLength;

  function handleSend(text?: string) {
    const message = text ?? draft;
    if (!canSend && text === undefined) return;
    if (message.trim().length === 0) return;
    setDraft('');
    void sendMessage(message);
  }

  return (
    <div className="flex flex-col h-[calc(100vh-52px)] bg-slate-50">
      {/* Header */}
      <div className="h-13 shrink-0 border-b border-slate-200 bg-white px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            className="md:hidden p-1.5 rounded-md text-slate-600 hover:bg-slate-100"
            onClick={() => setSessionsPanelOpen((prev) => !prev)}
            aria-label="Buka daftar percakapan"
          >
            {sessionsPanelOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <div className="h-7 w-7 rounded-lg bg-brand-500 text-white flex items-center justify-center shadow-xs shrink-0">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-slate-900">Asisten AI</h1>
            <p className="text-[10px] text-slate-500 truncate">
              Tanya kondisi bisnis, brainstorming, dan langkah terbaik berikutnya
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Session list panel */}
        <aside className="hidden md:flex md:w-64 md:flex-col border-r border-slate-200 bg-white">
          <ChatSessionList
            sessions={sessions}
            loading={sessionsLoading}
            activeSessionId={activeSessionId}
            onNewChat={startNewChat}
            onSelect={selectSession}
            onDelete={(id) => void deleteSession(id)}
          />
        </aside>

        {sessionsPanelOpen && (
          <aside className="absolute inset-y-[52px] left-0 z-10 w-72 bg-white border-r border-slate-200 shadow-lg md:hidden">
            <ChatSessionList
              sessions={sessions}
              loading={sessionsLoading}
              activeSessionId={activeSessionId}
              onNewChat={() => {
                setSessionsPanelOpen(false);
                startNewChat();
              }}
              onSelect={(id) => {
                setSessionsPanelOpen(false);
                void selectSession(id);
              }}
              onDelete={(id) => void deleteSession(id)}
            />
          </aside>
        )}

        {/* Chat panel */}
        <section className="flex flex-1 min-w-0 flex-col">
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
            {messagesLoading ? (
              <div className="flex h-full items-center justify-center text-slate-400">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : messages.length === 0 ? (
              <Greeting onSuggestion={(text) => handleSend(text)} disabled={sending} />
            ) : (
              <div className="mx-auto max-w-3xl space-y-3">
                {messages.map((message) => (
                  <ChatMessageBubble key={message.id} message={message} />
                ))}
              </div>
            )}
          </div>

          {pageError && (
            <div className="mx-4 mb-2 flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {pageError}
            </div>
          )}

          {/* Composer */}
          <div className="shrink-0 border-t border-slate-200 bg-white px-4 py-3">
            <div className="mx-auto max-w-3xl flex items-end gap-2">
              <textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    if (canSend) handleSend();
                  }
                }}
                rows={1}
                maxLength={maxMessageLength}
                placeholder="Tulis pertanyaan tentang bisnis Anda..."
                className="flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50/75 px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-enterprise-600 focus:outline-none focus:ring-1 focus:ring-enterprise-500/20 max-h-32"
              />
              <button
                type="button"
                disabled={!canSend}
                onClick={() => handleSend()}
                className="h-9 w-9 shrink-0 rounded-xl bg-brand-500 text-white flex items-center justify-center transition-colors hover:bg-brand-600 disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Kirim pertanyaan"
              >
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <SendHorizontal className="h-4 w-4" />
                )}
              </button>
            </div>
            <p className="mx-auto max-w-3xl mt-1.5 text-[10px] text-slate-400">
              Asisten menjawab berdasarkan data bisnis Anda. Periksa kembali angka penting sebelum
              mengambil keputusan.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

function Greeting({
  onSuggestion,
  disabled,
}: {
  onSuggestion: (text: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="mx-auto max-w-xl flex flex-col items-center text-center py-10">
      <div className="h-12 w-12 rounded-2xl bg-brand-500 text-white flex items-center justify-center shadow-sm mb-3">
        <Sparkles className="h-6 w-6" />
      </div>
      <h2 className="text-base font-bold text-slate-900">Ada yang bisa dibantu hari ini?</h2>
      <p className="mt-1 text-xs text-slate-500 max-w-sm">
        Gali data bisnis Anda, minta analisis, atau ajak brainstorming langkah berikutnya.
      </p>
      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
        {SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            disabled={disabled}
            onClick={() => onSuggestion(suggestion)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left text-xs text-slate-700 transition-colors hover:border-enterprise-300 hover:bg-enterprise-50 disabled:opacity-50"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}
