'use client';

import React, { useRef } from 'react';
import { gsap, useGSAP } from '@/lib/gsap';
import { MOTION_CONFIG } from '@/lib/motion.config';

export interface RevealProps {
  children: React.ReactNode;
  className?: string;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  delay?: number;
  duration?: number;
  distance?: number;
  once?: boolean;
}

/**
 * Komponen pembungkus untuk animasi kemunculan (fade-up/fade-in) sekali saat masuk viewport.
 * Mematuhi preferensi reduced motion dan otomatis membersihkan instance saat unmount.
 */
export function Reveal({
  children,
  className = '',
  direction = 'up',
  delay = 0,
  duration = MOTION_CONFIG.durations.normal,
  distance = MOTION_CONFIG.distances.md,
  once = true,
}: RevealProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!containerRef.current) return;

      const mm = gsap.matchMedia();

      // Kasus 1: Pengguna mengaktifkan prefers-reduced-motion (Aksesibilitas)
      mm.add(MOTION_CONFIG.mediaQueries.reducedMotion, () => {
        gsap.set(containerRef.current, {
          opacity: 1,
          x: 0,
          y: 0,
          clearProps: 'transform,opacity',
        });
      });

      // Kasus 2: Tampilan normal dengan animasi halus
      mm.add(MOTION_CONFIG.mediaQueries.noReducedMotion, (context) => {
        const isMobile = (context.conditions as { isMobile?: boolean })?.isMobile ?? false;
        const actualDistance = isMobile ? MOTION_CONFIG.distances.mobile : distance;

        let fromX = 0;
        let fromY = 0;

        if (direction === 'up') fromY = actualDistance;
        else if (direction === 'down') fromY = -actualDistance;
        else if (direction === 'left') fromX = actualDistance;
        else if (direction === 'right') fromX = -actualDistance;

        gsap.fromTo(
          containerRef.current,
          {
            opacity: 0,
            x: fromX,
            y: fromY,
          },
          {
            opacity: 1,
            x: 0,
            y: 0,
            duration,
            delay,
            ease: MOTION_CONFIG.easings.out,
            scrollTrigger: {
              trigger: containerRef.current,
              start: 'top 88%',
              once,
            },
          }
        );
      });
    },
    { scope: containerRef }
  );

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
}
