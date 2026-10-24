'use client';

import React from 'react';
import {
  Volume2,
  Play,
  Pause,
  RotateCcw,
  Square,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Clock,
  X,
  Info,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UseMorningBriefingReturn } from '@/hooks/use-morning-briefing';

interface MorningBriefingPlayerProps {
  briefing: UseMorningBriefingReturn;
  onClose?: () => void;
}

export function MorningBriefingPlayer({ briefing, onClose }: MorningBriefingPlayerProps) {
  const {
    status,
    script,
    currentSectionIndex,
    progress,
    errorMessage,
    supported,
    selectedVoiceName,
    play,
    pause,
    resume,
    stop,
    replay,
  } = briefing;

  const isSpeaking = status === 'speaking';
  const isPaused = status === 'paused';
  const isLoading = status === 'loading';
  const isDone = status === 'done';

  const currentSection = script?.sections[currentSectionIndex];

  return (
    <Card className="overflow-hidden border-enterprise-200 bg-linear-to-br from-enterprise-50/60 via-white to-slate-50 shadow-sm relative transition-all">
      {/* Top Banner Bar */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-enterprise-100/80 bg-white/80 backdrop-blur-xs">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
              isSpeaking
                ? 'bg-enterprise-600 text-white shadow-md shadow-enterprise-500/20 ring-2 ring-enterprise-400 ring-offset-1'
                : 'bg-enterprise-100 text-enterprise-700'
            }`}
          >
            <Volume2 className={`w-4 h-4 ${isSpeaking ? 'animate-pulse' : ''}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Briefing Suara Pagi
              </h3>
              <Badge
                variant={isSpeaking ? 'brand' : isDone ? 'success' : 'neutral'}
                dot={isSpeaking}
              >
                {isLoading
                  ? 'Menyiapkan...'
                  : isSpeaking
                  ? 'Sedang Berbicara'
                  : isPaused
                  ? 'Dijeda'
                  : isDone
                  ? 'Selesai'
                  : 'Siap Diputar'}
              </Badge>
            </div>
            <p className="text-xs text-slate-500">
              {script
                ? `Ringkasan 3 Pertanyaan Pagi • Est. ~${script.estimated_duration_seconds} detik`
                : 'Ringkasan kondisi 3 pertanyaan pagi'}
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1.5">
          {status === 'idle' && (
            <Button
              variant="primary"
              size="sm"
              onClick={play}
              disabled={isLoading}
              className="gap-1.5 bg-enterprise-600 hover:bg-enterprise-700"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{isLoading ? 'Memuat...' : 'Mulai Briefing'}</span>
            </Button>
          )}

          {isSpeaking && (
            <>
              <Button variant="secondary" size="sm" onClick={pause} className="gap-1.5">
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>Jeda</span>
              </Button>
              <Button variant="ghost" size="sm" onClick={stop} className="text-slate-500">
                <Square className="w-3.5 h-3.5 fill-current" />
              </Button>
            </>
          )}

          {isPaused && (
            <>
              <Button
                variant="primary"
                size="sm"
                onClick={resume}
                className="gap-1.5 bg-enterprise-600 hover:bg-enterprise-700"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Lanjutkan</span>
              </Button>
              <Button variant="ghost" size="sm" onClick={stop} className="text-slate-500">
                <Square className="w-3.5 h-3.5 fill-current" />
              </Button>
            </>
          )}

          {isDone && (
            <Button variant="secondary" size="sm" onClick={replay} className="gap-1.5">
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Putar Ulang</span>
            </Button>
          )}

          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 ml-1 transition-colors"
              title="Tutup Panel"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Unsupported Warning */}
      {!supported && (
        <div className="p-4 mx-5 my-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <strong className="font-semibold">Browser tidak mendukung audio speech synthesis.</strong>
            <p className="mt-0.5 text-amber-700">
              Anda tetap dapat membaca transkrip briefing tertulis di bawah ini.
            </p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="p-3 mx-5 my-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Body: Stepper & Active Subtitle */}
      {script && (
        <div className="p-5 space-y-4">
          {/* Stepper Dots / Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {script.sections.map((section, idx) => {
              const isCurrent = idx === currentSectionIndex && (isSpeaking || isPaused);
              const isPast = idx < currentSectionIndex || isDone;

              return (
                <div
                  key={section.id}
                  className={`px-3 py-2 rounded-lg border text-xs transition-all flex flex-col gap-1 ${
                    isCurrent
                      ? 'border-enterprise-500 bg-enterprise-50 text-enterprise-900 ring-2 ring-enterprise-200 font-semibold shadow-xs'
                      : isPast
                      ? 'border-emerald-200 bg-emerald-50/50 text-emerald-800 font-medium'
                      : 'border-slate-200 bg-white text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-wider">
                      {section.label}
                    </span>
                    {isPast ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    ) : isCurrent ? (
                      <div className="flex gap-0.5 items-center">
                        <span className="w-1 h-3 bg-enterprise-600 rounded-full animate-bounce" />
                        <span className="w-1 h-2 bg-enterprise-500 rounded-full animate-bounce [animation-delay:0.15s]" />
                        <span className="w-1 h-3.5 bg-enterprise-600 rounded-full animate-bounce [animation-delay:0.3s]" />
                      </div>
                    ) : (
                      <Clock className="w-3 h-3 text-slate-300" />
                    )}
                  </div>
                  <span className="text-xs truncate font-medium">
                    {section.id === 'greeting'
                      ? 'Salam Pagi'
                      : section.id === 'profit'
                      ? 'Laba Kemarin'
                      : section.id === 'attention'
                      ? 'Anomali Biaya'
                      : section.id === 'action'
                      ? 'Aksi Stok'
                      : 'Penutup'}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Active Narration Box (Spoken Subtitle) */}
          <div className="p-4 rounded-xl bg-slate-900 text-white relative overflow-hidden shadow-inner">
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5 border-b border-slate-800 pb-1">
              <span className="flex items-center gap-1.5 text-enterprise-300 font-semibold">
                <Sparkles className="w-3 h-3" />
                {currentSection?.label || 'Narasi Briefing'}
              </span>
              <span className="text-slate-400 font-mono text-[10px]">
                {Math.round(progress)}% Selesai
              </span>
            </div>

            <p className="text-sm sm:text-base leading-relaxed font-normal text-slate-100 min-h-12">
              &ldquo;{currentSection?.text || script.sections[0]?.text}&rdquo;
            </p>

            {/* Ambient waveform gradient at bottom */}
            {isSpeaking && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-linear-to-r from-enterprise-500 via-teal-400 to-indigo-500 animate-pulse" />
            )}
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-enterprise-600 h-full transition-all duration-300 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Footer Voice Metadata */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
            <span className="flex items-center gap-1">
              <Info className="w-3 h-3" />
              Suara:{' '}
              <strong className="text-slate-600 font-medium">
                {selectedVoiceName || 'Standar Bahasa Indonesia'}
              </strong>
            </span>
            <span>Pemutar Suara Lokal</span>
          </div>
        </div>
      )}

      {/* If script hasn't loaded yet and status is idle */}
      {!script && status === 'idle' && (
        <div className="p-6 text-center space-y-2">
          <p className="text-sm text-slate-600">
            Dengarkan ringkasan eksekutif 3 Pertanyaan Pagi secara otomatis dalam 35 detik.
          </p>
          <Button
            variant="primary"
            size="sm"
            onClick={play}
            disabled={isLoading}
            className="gap-2 bg-enterprise-600 hover:bg-enterprise-700"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>{isLoading ? 'Menyiapkan Suara...' : 'Putar Briefing Sekarang'}</span>
          </Button>
        </div>
      )}
    </Card>
  );
}
