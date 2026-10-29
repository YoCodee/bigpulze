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

  const activeRequestRef = useRef(false);

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

  const sendMessage = useCallback(
    async (rawMessage: string) => {
      const message = rawMessage.trim();
      if (!message || message.length > MAX_MESSAGE_LENGTH) return;
      if (activeRequestRef.current) return;
      activeRequestRef.current = true;

      const userMessageId = `local-user-${Date.now()}`;
      const assistantMessageId = `local-assistant-${Date.now()}`;
      const requestedSessionId = activeSessionId;

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
        const res = await fetch('/api/assistant/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message,
            ...(requestedSessionId ? { session_id: requestedSessionId } : {}),
          }),
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
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMessageId
                    ? { ...msg, content: event.message as string, streaming: false }
                    : msg
                )
              );
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
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? {
                  ...msg,
                  streaming: false,
                  content:
                    error instanceof Error
                      ? error.message
                      : 'Terjadi kesalahan. Silakan coba lagi.',
                }
              : msg
          )
        );
        setPageError(null);
      } finally {
        setSending(false);
        activeRequestRef.current = false;
      }
    },
    [activeSessionId, refreshSessions]
  );

  return {
    sessions,
    sessionsLoading,
    activeSessionId,
    messages,
    messagesLoading,
    sending,
    pageError,
    maxMessageLength: MAX_MESSAGE_LENGTH,
    selectSession,
    startNewChat,
    deleteSession,
    sendMessage,
  };
}
