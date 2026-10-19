'use client';

import React, { useEffect, useState } from 'react';
import { useVoiceRecognition } from '@/lib/voice/speech-recognition';
import { Mic, Square, AlertCircle, Sparkles } from 'lucide-react';

interface VoiceMicButtonProps {
  onTranscriptComplete: (transcript: string) => void;
  onInterimChange?: (interim: string) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}

export function VoiceMicButton({
  onTranscriptComplete,
  onInterimChange,
  className = '',
  disabled = false,
}: VoiceMicButtonProps) {
  const {
    isSupported,
    isListening,
    transcript,
    interimTranscript,
    error,
    startListening,
    stopListening,
    resetTranscript,
  } = useVoiceRecognition({
    lang: 'id-ID',
    continuous: false,
    interimResults: true,
  });

  const [fallbackInputOpen, setFallbackInputOpen] = useState(false);
  const [fallbackText, setFallbackText] = useState('');

  // Notify parent on interim change
  useEffect(() => {
    if (onInterimChange) {
      onInterimChange(interimTranscript);
    }
  }, [interimTranscript, onInterimChange]);

  // When speech recognition produces a final transcript
  useEffect(() => {
    if (transcript && !isListening) {
      onTranscriptComplete(transcript);
      resetTranscript();
    }
  }, [transcript, isListening, onTranscriptComplete, resetTranscript]);

  const toggleListening = () => {
    if (disabled) return;
    if (isListening) {
      stopListening();
    } else {
      if (!isSupported) {
        setFallbackInputOpen(true);
      } else {
        resetTranscript();
        startListening();
      }
    }
  };

  const handleFallbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (fallbackText.trim()) {
      onTranscriptComplete(fallbackText.trim());
      setFallbackText('');
      setFallbackInputOpen(false);
    }
  };

  return (
    <div className={`relative inline-block ${className}`}>
      {/* Mic Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={toggleListening}
        title={
          isListening
            ? 'Klik untuk berhenti merekam'
            : isSupported
            ? 'Bicara untuk memesan (Smart Voice POS)'
            : 'Browser tidak mendukung rekaman suara langsung (klik untuk simulasi teks)'
        }
        className={`relative flex items-center justify-center p-2.5 rounded-xl font-bold transition-all shadow-sm ${
          isListening
            ? 'bg-rose-600 text-white shadow-rose-500/30 ring-4 ring-rose-500/30 animate-pulse'
            : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-indigo-500/20'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {isListening ? (
          <div className="flex items-center gap-2">
            <Square className="w-4 h-4 fill-white" />
            <span className="text-xs font-bold uppercase tracking-wider pr-1">Merekam...</span>
            {/* Visualizer Sound Waves */}
            <div className="flex items-center gap-0.5 h-3">
              <span className="w-1 bg-white rounded-full animate-bounce h-2" style={{ animationDelay: '0ms' }} />
              <span className="w-1 bg-white rounded-full animate-bounce h-3" style={{ animationDelay: '150ms' }} />
              <span className="w-1 bg-white rounded-full animate-bounce h-2" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-1">
            <Mic className="w-4 h-4" />
            <span className="text-xs font-semibold hidden sm:inline">Perintah Suara</span>
          </div>
        )}
      </button>

      {/* Live Interim Caption Bubble */}
      {isListening && (
        <div className="absolute left-0 sm:left-auto sm:right-0 top-full mt-2 z-50 bg-slate-900/95 backdrop-blur-md text-white px-3.5 py-2 rounded-xl text-xs shadow-xl border border-slate-700 min-w-[220px] max-w-sm animate-in fade-in slide-in-from-top-1">
          <div className="flex items-center gap-1.5 text-[10px] text-purple-300 font-semibold uppercase mb-1">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            Mendengarkan Bahasa Indonesia:
          </div>
          <p className="italic text-slate-200">
            {interimTranscript ? `"${interimTranscript}"` : 'Silakan sebutkan pesanan... (cth: "kopi susu dua, donat satu")'}
          </p>
        </div>
      )}

      {/* Error Badge */}
      {error && !isListening && (
        <div className="absolute left-0 sm:left-auto sm:right-0 top-full mt-2 z-50 bg-rose-50 border border-rose-200 text-rose-800 p-2.5 rounded-xl text-xs shadow-lg min-w-[240px] flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-[11px] leading-snug">{error}</p>
            <button
              type="button"
              onClick={() => setFallbackInputOpen(true)}
              className="text-[10px] text-blue-600 font-bold hover:underline block"
            >
              Gunakan Simulasi Input Teks Suara &rarr;
            </button>
          </div>
        </div>
      )}

      {/* Fallback Simulation Dialog (If Web Speech API is unsupported in current browser environment) */}
      {fallbackInputOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 bg-purple-50 border-b border-purple-100 flex items-center justify-between text-purple-900">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <div>
                  <h3 className="text-sm font-bold">Simulasi Perintah Suara</h3>
                  <p className="text-[11px] text-purple-700">
                    Input kalimat pesanan seolah diucapkan kasir
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFallbackInputOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFallbackSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kalimat Pesanan Bahasa Indonesia:
                </label>
                <textarea
                  required
                  rows={3}
                  value={fallbackText}
                  onChange={(e) => setFallbackText(e.target.value)}
                  placeholder="Contoh: kopi susu dua, donat satu, bayar tunai"
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              {/* Sample quick pills */}
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-slate-400">
                  Contoh Cepat Skenario:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setFallbackText('kopi susu dua dan donat satu')}
                    className="px-2 py-1 rounded bg-slate-100 text-slate-700 text-[10px] hover:bg-slate-200"
                  >
                    kopi susu 2, donat 1
                  </button>
                  <button
                    type="button"
                    onClick={() => setFallbackText('es kopi gula aren satu')}
                    className="px-2 py-1 rounded bg-slate-100 text-slate-700 text-[10px] hover:bg-slate-200"
                  >
                    es kopi gula aren 1
                  </button>
                  <button
                    type="button"
                    onClick={() => setFallbackText('beli token listrik seratus ribu')}
                    className="px-2 py-1 rounded bg-slate-100 text-slate-700 text-[10px] hover:bg-slate-200"
                  >
                    beli token listrik 100k
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setFallbackInputOpen(false)}
                  className="px-3 py-1.5 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-50 text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-500/20"
                >
                  Kirim Perintah Suara
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
