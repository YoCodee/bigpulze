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

export function useMorningBriefing(): UseMorningBriefingReturn {
  const [status, setStatus] = useState<BriefingStatus>('idle');
  const [script, setScript] = useState<BriefingScript | null>(null);
  const [currentSectionIndex, setCurrentSectionIndex] = useState<number>(0);
  const [progress, setProgress] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [supported, setSupported] = useState<boolean>(true);
  const [selectedVoiceName, setSelectedVoiceName] = useState<string | null>(null);

  const synthRef = useRef<SpeechSynthesis | null>(null);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const activeVoiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const sectionQueueRef = useRef<number>(0);
  const isPlayingRef = useRef<boolean>(false);

  // Check Web Speech API support & load Indonesian voices
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setSupported(false);
      setStatus('unsupported');
      return;
    }

    synthRef.current = window.speechSynthesis;

    const findIndonesianVoice = () => {
      if (!synthRef.current) return;
      const voices = synthRef.current.getVoices();
      // Look for id-ID voice, or fallback to default
      const idVoice = voices.find(
        (v) =>
          v.lang.toLowerCase() === 'id-id' ||
          v.lang.toLowerCase().startsWith('id') ||
          v.name.toLowerCase().includes('indonesia')
      );
      if (idVoice) {
        activeVoiceRef.current = idVoice;
        setSelectedVoiceName(idVoice.name);
      } else if (voices.length > 0) {
        activeVoiceRef.current = voices[0];
        setSelectedVoiceName(voices[0].name);
      }
    };

    findIndonesianVoice();

    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = findIndonesianVoice;
    }

    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  // Speak a specific section by index
  const speakSection = useCallback(
    (index: number, briefingScript: BriefingScript) => {
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

      currentUtteranceRef.current = utterance;
      setCurrentSectionIndex(index);
      sectionQueueRef.current = index;

      // Update progress
      const totalSections = briefingScript.sections.length;
      const progressPercent = Math.round(((index + 0.5) / totalSections) * 100);
      setProgress(progressPercent);

      utterance.onstart = () => {
        setStatus('speaking');
        isPlayingRef.current = true;
      };

      utterance.onend = () => {
        if (!isPlayingRef.current) return;

        const nextIndex = index + 1;
        if (nextIndex < briefingScript.sections.length) {
          sectionQueueRef.current = nextIndex;
          speakSection(nextIndex, briefingScript);
        } else {
          // Finished all sections
          setStatus('done');
          setProgress(100);
          isPlayingRef.current = false;
        }
      };

      utterance.onerror = (evt) => {
        // 'interrupted' or 'canceled' are normal when user pauses or cancels
        if (evt.error === 'interrupted' || evt.error === 'canceled') {
          return;
        }
        console.error('Speech synthesis error:', evt);
        setErrorMessage('Gagal memutar audio pengucapan.');
        setStatus('error');
        isPlayingRef.current = false;
      };

      synthRef.current.speak(utterance);
    },
    []
  );

  // Play / Start briefing
  const play = useCallback(async () => {
    setErrorMessage(null);

    // If unsupported, we still fetch script for readable text view
    if (typeof window !== 'undefined' && !('speechSynthesis' in window)) {
      setSupported(false);
    }

    try {
      let currentScript = script;

      // If we don't have script yet, fetch it
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

      if (!('speechSynthesis' in window) || !synthRef.current) {
        setStatus('unsupported');
        return;
      }

      isPlayingRef.current = true;
      speakSection(0, currentScript);
    } catch (err: unknown) {
      console.error('Briefing error:', err);
      setErrorMessage(err instanceof Error ? err.message : 'Terjadi kesalahan sistem.');
      setStatus('error');
      isPlayingRef.current = false;
    }
  }, [script, speakSection]);

  const pause = useCallback(() => {
    if (synthRef.current && status === 'speaking') {
      isPlayingRef.current = false;
      synthRef.current.pause();
      setStatus('paused');
    }
  }, [status]);

  const resume = useCallback(() => {
    if (synthRef.current && status === 'paused') {
      isPlayingRef.current = true;
      synthRef.current.resume();
      setStatus('speaking');
    }
  }, [status]);

  const stop = useCallback(() => {
    if (synthRef.current) {
      isPlayingRef.current = false;
      synthRef.current.cancel();
    }
    setStatus('idle');
    setCurrentSectionIndex(0);
    setProgress(0);
  }, []);

  const replay = useCallback(() => {
    if (script) {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
      isPlayingRef.current = true;
      speakSection(0, script);
    } else {
      play();
    }
  }, [script, speakSection, play]);

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
