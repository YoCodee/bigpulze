'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export interface UseVoiceRecognitionOptions {
  lang?: string;
  continuous?: boolean;
  interimResults?: boolean;
}

export interface UseVoiceRecognitionReturn {
  isSupported: boolean;
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  error: string | null;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
}

interface SpeechRecognitionItem {
  transcript: string;
}

interface SpeechRecognitionResultItem {
  isFinal: boolean;
  [index: number]: SpeechRecognitionItem;
  length: number;
}

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: SpeechRecognitionResultItem;
  };
}

interface SpeechRecognitionErrorEventLike {
  error: string;
  message?: string;
}

interface SpeechRecognitionInstance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

interface WindowWithSpeech extends Window {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
}

export function useVoiceRecognition(
  options: UseVoiceRecognitionOptions = {}
): UseVoiceRecognitionReturn {
  const { lang = 'id-ID', continuous = false, interimResults = true } = options;

  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>('');
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const win = window as unknown as WindowWithSpeech;
      const SpeechRecognitionClass = win.SpeechRecognition || win.webkitSpeechRecognition;

      if (SpeechRecognitionClass) {
        setIsSupported(true);
        const recognition = new SpeechRecognitionClass();
        recognition.lang = lang;
        recognition.continuous = continuous;
        recognition.interimResults = interimResults;

        recognition.onstart = () => {
          setIsListening(true);
          setError(null);
        };

        recognition.onresult = (event: SpeechRecognitionEventLike) => {
          let currentInterim = '';
          let currentFinal = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const item = event.results[i];
            const text = item[0]?.transcript || '';
            if (item.isFinal) {
              currentFinal += text;
            } else {
              currentInterim += text;
            }
          }

          if (currentFinal) {
            setTranscript((prev) => (prev ? `${prev} ${currentFinal}` : currentFinal).trim());
            setInterimTranscript('');
          } else {
            setInterimTranscript(currentInterim);
          }
        };

        recognition.onerror = (event: SpeechRecognitionErrorEventLike) => {
          let errMsg = 'Terjadi kesalahan pada mikrofon';
          if (event.error === 'not-allowed') {
            errMsg = 'Izin akses mikrofon ditolak oleh browser. Mohon izinkan mikrofon.';
          } else if (event.error === 'no-speech') {
            errMsg = 'Tidak ada suara yang terdeteksi. Silakan coba bicara lebih dekat ke mikrofon.';
          } else if (event.error === 'network') {
            errMsg = 'Gagal menghubungkan ke layanan pengenalan suara (Speech API).';
          }
          setError(errMsg);
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
          setInterimTranscript('');
        };

        recognitionRef.current = recognition;
      } else {
        setIsSupported(false);
      }
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore cleanup abort error
        }
      }
    };
  }, [lang, continuous, interimResults]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) {
      setError('Browser Anda belum mendukung Web Speech API.');
      return;
    }
    setError(null);
    setInterimTranscript('');
    try {
      recognitionRef.current.start();
    } catch {
      // In case already started
      try {
        recognitionRef.current.stop();
        setTimeout(() => recognitionRef.current?.start(), 150);
      } catch {
        // Fallback
      }
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    setError(null);
  }, []);

  return {
    isSupported,
    isListening,
    transcript,
    interimTranscript,
    error,
    startListening,
    stopListening,
    resetTranscript,
  };
}
