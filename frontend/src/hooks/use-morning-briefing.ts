'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { BriefingScript } from '@/lib/briefing/script-builder';

export type BriefingStatus =
  | 'idle'
  | 'loading'
  | 'speaking'
  | 'paused'
  | 'done'
  | 'error'
  | 'unsupported';

export interface UseMorningBriefingReturn {
  status: BriefingStatus;
  script: BriefingScript | null;
  currentSectionIndex: number;
  currentSectionId: string | null;
  progress: number;
  errorMessage: string | null;
  supported: boolean;
  selectedVoiceName: string | null;
  play: () => Promise<void>;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  replay: () => void;
}

const NEURAL_VOICE_LABEL = 'Ardi (Neural)';

export function useMorningBriefing(): UseMorningBriefingReturn {
  const [status, setStatus] = useState<BriefingStatus>('idle');
  const [script, setScript] = useState<BriefingScript | null>(null);
  const [currentSectionIndex, setCurrentSectionIndex] = useState<number>(0);
  const [progress, setProgress] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // Server-side neural TTS works in any modern browser (plain HTMLAudio);
  // the Web Speech check no longer gates support. Kept for interface stability.
  const [supported] = useState<boolean>(true);
  const [selectedVoiceName, setSelectedVoiceName] = useState<string | null>(
    NEURAL_VOICE_LABEL
  );

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const prefetchedRef = useRef<Map<number, string>>(new Map());
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const activeVoiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const sectionQueueRef = useRef<number>(0);
  const isPlayingRef = useRef<boolean>(false);
  // Sticky engine: after the first neural-TTS failure we stay on the
  // browser's Web Speech voice so the briefing never dies mid-way.
  const neuralDisabledRef = useRef<boolean>(false);

  // Load fallback (Web Speech) voices once.
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }
    synthRef.current = window.speechSynthesis;

    const findIndonesianVoice = () => {
      if (!synthRef.current) return;
      const voices = synthRef.current.getVoices();
      const idVoice = voices.find(
        (v) =>
          v.lang.toLowerCase() === 'id-id' ||
          v.lang.toLowerCase().startsWith('id') ||
          v.name.toLowerCase().includes('indonesia')
      );
      if (idVoice) {
        activeVoiceRef.current = idVoice;
        if (neuralDisabledRef.current) setSelectedVoiceName(idVoice.name);
      } else if (voices.length > 0 && neuralDisabledRef.current) {
        activeVoiceRef.current = voices[0];
        setSelectedVoiceName(voices[0].name);
      }
    };

    findIndonesianVoice();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = findIndonesianVoice;
    }

    const prefetched = prefetchedRef.current;
    return () => {
      synthRef.current?.cancel();
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = null;
      }
      prefetched.forEach((url) => URL.revokeObjectURL(url));
      prefetched.clear();
    };
  }, []);

  const getAudio = useCallback((): HTMLAudioElement => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }
    return audioRef.current;
  }, []);

  const cleanupAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeAttribute('src');
    }
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
  }, []);

  /** Drops every prefetched section audio (stop/refresh of the session). */
  const clearPrefetch = useCallback(() => {
    prefetchedRef.current.forEach((url) => URL.revokeObjectURL(url));
    prefetchedRef.current.clear();
  }, []);

  // Self-reference so sections can chain into the next one.
  const playSectionRef = useRef<(index: number, briefingScript: BriefingScript) => Promise<void>>(
    async () => {}
  );

  // Fallback engine: browser Web Speech (the old, more robotic voice).
  const speakLegacy = useCallback((index: number, briefingScript: BriefingScript) => {
    if (!synthRef.current || !briefingScript.sections[index]) {
      return;
    }
    synthRef.current.cancel();

    const sec = briefingScript.sections[index];
    const utterance = new SpeechSynthesisUtterance(sec.text);
    utterance.lang = 'id-ID';
    utterance.rate = 0.96;
    utterance.pitch = 1.0;
    if (activeVoiceRef.current) {
      utterance.voice = activeVoiceRef.current;
    }

    setCurrentSectionIndex(index);
    sectionQueueRef.current = index;
    setProgress(Math.round(((index + 0.5) / briefingScript.sections.length) * 100));

    utterance.onstart = () => {
      setStatus('speaking');
      isPlayingRef.current = true;
    };

    utterance.onend = () => {
      if (!isPlayingRef.current) return;
      const nextIndex = index + 1;
      if (nextIndex < briefingScript.sections.length) {
        sectionQueueRef.current = nextIndex;
        void playSectionRef.current(nextIndex, briefingScript);
      } else {
        setStatus('done');
        setProgress(100);
        isPlayingRef.current = false;
      }
    };

    utterance.onerror = (evt) => {
      if (evt.error === 'interrupted' || evt.error === 'canceled') return;
      console.error('Speech synthesis error:', evt);
      setErrorMessage('Gagal memutar audio pengucapan.');
      setStatus('error');
      isPlayingRef.current = false;
    };

    synthRef.current.speak(utterance);
  }, []);

  // Pre-generate remaining sections in the background so section changes
  // play instantly (server cache + blob URLs = zero perceived gap).
  const prefetchAhead = useCallback(
    (currentIndex: number, briefingScript: BriefingScript) => {
      for (let i = currentIndex + 1; i < briefingScript.sections.length; i++) {
        const target = i;
        if (prefetchedRef.current.has(target)) continue;
        void (async () => {
          try {
            const res = await fetch('/api/tts', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ text: briefingScript.sections[target].text }),
            });
            if (!res.ok) return; // playback path will retry + fall back
            const blob = await res.blob();
            prefetchedRef.current.set(target, URL.createObjectURL(blob));
          } catch {
            // Ignore: the playback path re-fetches and falls back if needed.
          }
        })();
      }
    },
    []
  );

  // Primary engine: neural TTS from /api/tts (Microsoft Edge voice).
  const playSection = useCallback(
    async (index: number, briefingScript: BriefingScript) => {
      if (!briefingScript.sections[index]) {
        return;
      }
      cleanupAudio();
      setCurrentSectionIndex(index);
      sectionQueueRef.current = index;
      setProgress(Math.round(((index + 0.5) / briefingScript.sections.length) * 100));
      isPlayingRef.current = true;

      const sec = briefingScript.sections[index];

      const startPlayback = async (url: string) => {
        const audio = getAudio();
        audio.src = url;
        audio.onended = () => {
          if (!isPlayingRef.current) return;
          const nextIndex = index + 1;
          if (nextIndex < briefingScript.sections.length) {
            sectionQueueRef.current = nextIndex;
            void playSectionRef.current(nextIndex, briefingScript);
          } else {
            setStatus('done');
            setProgress(100);
            isPlayingRef.current = false;
          }
        };
        audio.onerror = () => {
          neuralDisabledRef.current = true;
          const legacyVoice = activeVoiceRef.current?.name || 'Suara Browser';
          setSelectedVoiceName(legacyVoice);
          speakLegacy(index, briefingScript);
        };
        await audio.play();
        setStatus('speaking');
        setSelectedVoiceName(NEURAL_VOICE_LABEL);
        // While this section is being read, warm up the rest.
        prefetchAhead(index, briefingScript);
      };

      if (!neuralDisabledRef.current) {
        // Instant: this section was prefetched while an earlier one played.
        const readyUrl = prefetchedRef.current.get(index);
        if (readyUrl) {
          void startPlayback(readyUrl);
          return;
        }

        try {
          setStatus('loading');
          const res = await fetch('/api/tts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: sec.text }),
          });
          if (!res.ok) {
            const json = await res.json().catch(() => null);
            throw new Error(json?.error?.message || 'Gagal membuat suara.');
          }
          if (!isPlayingRef.current) return; // stopped while fetching

          const blob = await res.blob();
          const url = URL.createObjectURL(blob);
          audioUrlRef.current = url;

          await startPlayback(url);
          return;
        } catch (err) {
          if (err instanceof DOMException && err.name === 'AbortError') return;
          if (!isPlayingRef.current) return; // stopped while fetching
          // Endpoint down / rate limited: stick to the browser voice.
          console.error('Neural TTS failed, falling back to Web Speech:', err);
          neuralDisabledRef.current = true;
          const legacyVoice = activeVoiceRef.current?.name || 'Suara Browser';
          setSelectedVoiceName(legacyVoice);
        }
      }

      speakLegacy(index, briefingScript);
    },
    [cleanupAudio, getAudio, prefetchAhead, speakLegacy]
  );
  playSectionRef.current = playSection;

  // Play / Start briefing
  const play = useCallback(async () => {
    setErrorMessage(null);

    try {
      let currentScript = script;

      if (!currentScript) {
        setStatus('loading');
        const res = await fetch('/api/briefing/morning');
        const json = await res.json();

        if (!res.ok || !json.data?.script) {
          throw new Error(json.error?.message || 'Gagal memuat briefing pagi.');
        }

        currentScript = json.data.script as BriefingScript;
        setScript(currentScript);
      }

      isPlayingRef.current = true;
      void playSectionRef.current(0, currentScript);
    } catch (err: unknown) {
      console.error('Briefing error:', err);
      setErrorMessage(err instanceof Error ? err.message : 'Terjadi kesalahan sistem.');
      setStatus('error');
      isPlayingRef.current = false;
    }
  }, [script]);

  const pause = useCallback(() => {
    if (status !== 'speaking') return;
    isPlayingRef.current = false;
    audioRef.current?.pause();
    synthRef.current?.pause();
    setStatus('paused');
  }, [status]);

  const resume = useCallback(() => {
    if (status !== 'paused') return;
    isPlayingRef.current = true;
    if (audioRef.current && audioUrlRef.current) {
      void audioRef.current.play();
    } else {
      synthRef.current?.resume();
    }
    setStatus('speaking');
  }, [status]);

  const stop = useCallback(() => {
    isPlayingRef.current = false;
    cleanupAudio();
    clearPrefetch();
    synthRef.current?.cancel();
    setStatus('idle');
    setCurrentSectionIndex(0);
    setProgress(0);
  }, [cleanupAudio, clearPrefetch]);

  const replay = useCallback(() => {
    if (script) {
      cleanupAudio();
      synthRef.current?.cancel();
      isPlayingRef.current = true;
      void playSectionRef.current(0, script);
    } else {
      void play();
    }
  }, [script, play, cleanupAudio]);

  const currentSectionId =
    script && script.sections[currentSectionIndex]
      ? script.sections[currentSectionIndex].id
      : null;

  return {
    status,
    script,
    currentSectionIndex,
    currentSectionId,
    progress,
    errorMessage,
    supported,
    selectedVoiceName,
    play,
    pause,
    resume,
    stop,
    replay,
  };
}
