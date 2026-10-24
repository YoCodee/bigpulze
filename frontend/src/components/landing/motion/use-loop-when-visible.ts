'use client';

import { useRef, useEffect } from 'react';
import { ScrollTrigger } from '@/lib/gsap';

export interface UseLoopWhenVisibleOptions {
  triggerRef: React.RefObject<HTMLElement>;
  onPlay?: () => void;
  onPause?: () => void;
  timeline?: gsap.core.Animation | null;
}

/**
 * Hook untuk menjalankan loop animasi HANYA ketika elemen berada di dalam viewport pengguna.
 * Otomatis menghentikan (pause) loop saat elemen keluar layar untuk menghemat CPU & baterai.
 */
export function useLoopWhenVisible({
  triggerRef,
  onPlay,
  onPause,
  timeline,
}: UseLoopWhenVisibleOptions) {
  const triggerInstanceRef = useRef<ScrollTrigger | null>(null);

  useEffect(() => {
    if (!triggerRef.current || typeof window === 'undefined') return;

    // Periksa apakah pengguna mengaktifkan prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    if (prefersReducedMotion) {
      if (timeline) {
        timeline.pause(0);
      }
      if (onPause) {
        onPause();
      }
      return;
    }

    const st = ScrollTrigger.create({
      trigger: triggerRef.current,
      start: 'top bottom', // Aktif segera saat bagian atas elemen masuk viewport bawah
      end: 'bottom top',   // Nonaktif saat bagian bawah elemen keluar viewport atas
      onToggle: (self) => {
        if (self.isActive) {
          if (timeline) timeline.play();
          if (onPlay) onPlay();
        } else {
          if (timeline) timeline.pause();
          if (onPause) onPause();
        }
      },
    });

    triggerInstanceRef.current = st;

    return () => {
      st.kill();
      if (timeline) {
        timeline.kill();
      }
    };
  }, [triggerRef, onPlay, onPause, timeline]);

  return triggerInstanceRef;
}
