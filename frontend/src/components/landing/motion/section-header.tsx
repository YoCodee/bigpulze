'use client';

import React, { useRef } from 'react';
import { gsap, useGSAP } from '@/lib/gsap';
import { MOTION_CONFIG } from '@/lib/motion.config';

export interface SectionHeaderProps {
  children: React.ReactNode;
  className?: string;
  distance?: number;
  stagger?: number;
}

/**
 * Komponen pembungkus judul & subjudul section landing page:
 * Menganimasikan baris anak (badge, H2, paragraf deskripsi) secara berurutan:
 * - y: 14px -> 0
 * - opacity: 0 -> 1
 * - stagger: 0.08s
 * - Sekali saja saat masuk viewport (ScrollTrigger once: true)
 * - Mematuhi preferensi reduced motion (instan tampil tanpa gerak)
 */
export function SectionHeader({
  children,
  className = 'text-center max-w-2xl mx-auto space-y-2.5',
  distance = MOTION_CONFIG.distances.md,
  stagger = MOTION_CONFIG.staggers.normal,
}: SectionHeaderProps) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!ref.current) return;
      const childrenElements = ref.current.children;
      if (!childrenElements || childrenElements.length === 0) return;

      const mm = gsap.matchMedia();

      // Kasus Reduced Motion (Aksesibilitas)
      mm.add(MOTION_CONFIG.mediaQueries.reducedMotion, () => {
        gsap.set(childrenElements, { opacity: 1, y: 0, clearProps: 'all' });
      });

      // Kasus Normal
      mm.add(MOTION_CONFIG.mediaQueries.noReducedMotion, () => {
        gsap.fromTo(
          childrenElements,
          {
            opacity: 0,
            y: distance,
          },
          {
            opacity: 1,
            y: 0,
            duration: MOTION_CONFIG.durations.normal,
            stagger,
            ease: MOTION_CONFIG.easings.out,
            scrollTrigger: {
              trigger: ref.current,
              start: 'top 85%',
              once: true,
            },
          }
        );
      });
    },
    { scope: ref }
  );

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
