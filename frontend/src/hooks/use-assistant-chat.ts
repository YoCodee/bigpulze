'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export interface AssistantSession {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface AssistantChatMessage {
  id: string;
  role: 'USER' | 'ASSISTANT';
  content: string;
  tool_trace: string[];
  /** Marks a message currently being streamed from the server. */
  streaming?: boolean;
}

const MAX_MESSAGE_LENGTH = 4000;

async function fetchJson<T>(input: string): Promise<T> {
  const res = await fetch(input);
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.data) {
    const message =
      json?.error?.message || 'Gagal memuat data percakapan. Silakan coba lagi.';
    throw new Error(message);
  }
  return json.data as T;
}

/**
 * Client state machine for the /asisten page: session list, transcript, and
 * streaming send. SSE lines use the same event shapes the chat route emits
 * (start | text | tool_start | tool_done | done | error).
 */
export function useAssistantChat() {
  const [sessions, setSessions] = useState<AssistantSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AssistantChatMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  /** Send/stream failure of the LAST question; shown with a retry action. */
  const [chatError, setChatError] = useState<string | null>(null);

  const activeRequestRef = useRef(false);
  const lastSentRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const refreshSessions = useCallback(async () => {
    try {
      const data = await fetchJson<{ sessions: AssistantSession[] }>(
        '/api/assistant/sessions'
      );
      setSessions(data.sessions);
    } catch (error) {
      setPageError(error instanceof Error ? error.message : 'Gagal memuat percakapan.');
    } finally {
      setSessionsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshSessions();
  }, [refreshSessions]);

  const selectSession = useCallback(async (sessionId: string) => {
    setActiveSessionId(sessionId);
    setMessages([]);
    setMessagesLoading(true);
    setPageError(null);
    try {
      const data = await fetchJson<{
        messages: Array<AssistantChatMessage>;
      }>(`/api/assistant/sessions/${sessionId}/messages`);
      setMessages(data.messages);
    } catch (error) {
      setPageError(error instanceof Error ? error.message : 'Gagal memuat pesan.');
    } finally {
      setMessagesLoading(false);
    }
  }, []);

  const startNewChat = useCallback(() => {
    setActiveSessionId(null);
    setMessages([]);
    setPageError(null);
  }, []);

  const deleteSession = useCallback(
    async (sessionId: string) => {
      const res = await fetch(`/api/assistant/sessions/${sessionId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setSessions((prev) => prev.filter((session) => session.id !== sessionId));
        if (activeSessionId === sessionId) {
          startNewChat();
        }
      } else {
        setPageError('Gagal menghapus percakapan. Silakan coba lagi.');
      }
    },
    [activeSessionId, startNewChat]
  );

  const renameSession = useCallback(
    async (sessionId: string, rawTitle: string) => {
      const title = rawTitle.trim();
      if (!title || title.length > 150) return;
      // Optimistic: show the new title immediately; roll back on failure.
      const previous = sessions;
      setSessions((prev) =>
        prev.map((session) => (session.id === sessionId ? { ...session, title } : session))
      );
      const res = await fetch(`/api/assistant/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });
      if (!res.ok) {
        setSessions(previous);
        setPageError('Gagal mengubah judul percakapan. Silakan coba lagi.');
      }
    },
    [sessions]
  );

  const sendMessage = useCallback(
    async (rawMessage: string) => {
      const message = rawMessage.trim();
      if (!message || message.length > MAX_MESSAGE_LENGTH) return;
      if (activeRequestRef.current) return;
      activeRequestRef.current = true;

      const userMessageId = `local-user-${Date.now()}`;
      const assistantMessageId = `local-assistant-${Date.now()}`;
      const requestedSessionId = activeSessionId;
      lastSentRef.current = message;

      setChatError(null);

      setMessages((prev) => [
        ...prev,
        { id: userMessageId, role: 'USER', content: message, tool_trace: [] },
        {
          id: assistantMessageId,
          role: 'ASSISTANT',
          content: '',
          tool_trace: [],
          streaming: true,
        },
      ]);
      setSending(true);
      setPageError(null);

      try {
        const controller = new AbortController();
        abortRef.current = controller;
        const res = await fetch('/api/assistant/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message,
            ...(requestedSessionId ? { session_id: requestedSessionId } : {}),
          }),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) {
          const json = await res.json().catch(() => null);
          throw new Error(json?.error?.message || 'Gagal mengirim pertanyaan. Silakan coba lagi.');
        }

        // Manual SSE reading: POST streaming cannot use EventSource.
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let sessionId = requestedSessionId;

        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          let boundary = buffer.indexOf('\n\n');
          while (boundary !== -1) {
            const rawEvent = buffer.slice(0, boundary);
            buffer = buffer.slice(boundary + 2);
            boundary = buffer.indexOf('\n\n');

            const dataLine = rawEvent
              .split('\n')
              .find((line) => line.startsWith('data:'));
            if (!dataLine) continue;

            let event: Record<string, unknown> = {};
            try {
              event = JSON.parse(dataLine.slice(5).trim());
            } catch {
              continue;
            }

            const eventType = event.type as string;
            if (eventType === 'start' || eventType === 'done') {
              sessionId = (event.session_id as string) || sessionId;
            }
            if (eventType === 'text') {
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMessageId
                    ? { ...msg, content: msg.content + (event.text as string) }
                    : msg
                )
              );
            }
            if (eventType === 'tool_start') {
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMessageId
                    ? {
                        ...msg,
                        tool_trace: [...msg.tool_trace, event.name as string],
                      }
                    : msg
                )
              );
            }
            if (eventType === 'error') {
              // Never write the error into the assistant bubble: it must not
              // impersonate the assistant or erase a partially streamed answer.
              setChatError((event.message as string) || 'Terjadi kesalahan. Silakan coba lagi.');
              setMessages((prev) => {
                const assistant = prev.find((msg) => msg.id === assistantMessageId);
                let next = prev.map((msg) =>
                  msg.id === assistantMessageId ? { ...msg, streaming: false } : msg
                );
                if (assistant && assistant.content.trim().length === 0) {
                  next = next.filter((msg) => msg.id !== assistantMessageId);
                }
                return next;
              });
            }
            if (eventType === 'done') {
              setMessages((prev) => {
                const next = prev.map((msg) =>
                  msg.id === assistantMessageId
                    ? {
                        ...msg,
                        streaming: false,
                        tool_trace: (event.tool_trace as string[]) || msg.tool_trace,
                      }
                    : msg
                );
                // Remove an assistant bubble that never received any content.
                const assistant = next.find((msg) => msg.id === assistantMessageId);
                if (assistant && assistant.content.trim().length === 0) {
                  return next.filter((msg) => msg.id !== assistantMessageId);
                }
                return next;
              });
            }
          }
        }

        if (sessionId !== activeSessionId || requestedSessionId === null) {
          setActiveSessionId(sessionId);
        }
        void refreshSessions();
      } catch (error) {
        // User pressed stop: keep the partial answer, show no error bar.
        const aborted =
          (error instanceof DOMException && error.name === 'AbortError') ||
          (error instanceof Error && error.name === 'AbortError');
        if (aborted) {
          setMessages((prev) => {
            const assistant = prev.find((msg) => msg.id === assistantMessageId);
            let next = prev.map((msg) =>
              msg.id === assistantMessageId ? { ...msg, streaming: false } : msg
            );
            if (assistant && assistant.content.trim().length === 0) {
              next = next.filter((msg) => msg.id !== assistantMessageId);
            }
            return next;
          });
          return;
        }
        // Keep any partially streamed content; surface a retryable error bar.
        setChatError(
          error instanceof Error
            ? error.message
            : 'Terjadi kesalahan. Silakan coba lagi.'
        );
        setMessages((prev) => {
          const assistant = prev.find((msg) => msg.id === assistantMessageId);
          let next = prev.map((msg) =>
            msg.id === assistantMessageId ? { ...msg, streaming: false } : msg
          );
          if (assistant && assistant.content.trim().length === 0) {
            next = next.filter((msg) => msg.id !== assistantMessageId);
          }
          return next;
        });
        setPageError(null);
      } finally {
        setSending(false);
        activeRequestRef.current = false;
        abortRef.current = null;
      }
    },
    [activeSessionId, refreshSessions]
  );

  const dismissChatError = useCallback(() => setChatError(null), []);

  /** Stops the in-flight generation; the partial answer stays in the panel. */
  const stopGeneration = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const retryLast = useCallback(() => {
    const last = lastSentRef.current;
    if (last && !activeRequestRef.current) void sendMessage(last);
  }, [sendMessage]);

  return {
    sessions,
    sessionsLoading,
    activeSessionId,
    messages,
    messagesLoading,
    sending,
    pageError,
    chatError,
    maxMessageLength: MAX_MESSAGE_LENGTH,
    selectSession,
    startNewChat,
    deleteSession,
    renameSession,
    sendMessage,
    retryLast,
    dismissChatError,
    stopGeneration,
  };
}
