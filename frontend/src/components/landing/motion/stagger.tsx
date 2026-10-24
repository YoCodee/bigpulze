'use client';

import React, { useRef } from 'react';
import { gsap, useGSAP } from '@/lib/gsap';
import { MOTION_CONFIG } from '@/lib/motion.config';

export interface StaggerProps {
  children: React.ReactNode;
  className?: string;
  itemSelector?: string;
  stagger?: number;
  duration?: number;
  distance?: number;
  delay?: number;
  once?: boolean;
}

/**
 * Komponen pembungkus untuk memunculkan anak elemen secara berurutan (staggered cascade).
 */
export function Stagger({
  children,
  className = '',
  itemSelector = ':scope > *',
  stagger = MOTION_CONFIG.staggers.normal,
  duration = MOTION_CONFIG.durations.normal,
  distance = MOTION_CONFIG.distances.md,
  delay = 0,
  once = true,
}: StaggerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!containerRef.current) return;

      const items = containerRef.current.querySelectorAll(itemSelector);
      if (!items || items.length === 0) return;

      const mm = gsap.matchMedia();

      // Kasus Reduced Motion
      mm.add(MOTION_CONFIG.mediaQueries.reducedMotion, () => {
        gsap.set(items, {
          opacity: 1,
          y: 0,
          clearProps: 'transform,opacity',
        });
      });

      // Kasus Normal
      mm.add(MOTION_CONFIG.mediaQueries.noReducedMotion, () => {
        gsap.fromTo(
          items,
          {
            opacity: 0,
            y: distance,
          },
          {
            opacity: 1,
            y: 0,
            duration,
            delay,
            stagger,
            ease: MOTION_CONFIG.easings.out,
            scrollTrigger: {
              trigger: containerRef.current,
              start: 'top 85%',
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
