'use client';

import React, { useRef } from 'react';
import { gsap, useGSAP, ScrollTrigger } from '@/lib/gsap';
import { MOTION_CONFIG } from '@/lib/motion.config';

/**
 * Komponen pembungkus animasi Section CTA Banner Penutup:
 * 1. Urutan masuk berurutan saat banner masuk viewport (ScrollTrigger once):
 *    - Headline H2
 *    - Subtitle Paragraf
 *    - Dual Action Buttons
 *    - Pita Ribbon 4 Pilar di bagian bawah
 * 2. 4 Kotak dekoratif mengambang mengapung sangat pelan (floating sinusoidal 2-3px)
 * 3. Otomatis pause saat keluar layar
 * 4. Mematuhi preferensi prefers-reduced-motion
 */
export function CtaBannerMotion({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!containerRef.current) return;

      const mm = gsap.matchMedia();

      // Kasus Reduced Motion
      mm.add(MOTION_CONFIG.mediaQueries.reducedMotion, () => {
        const items = containerRef.current?.querySelectorAll('.cta-animate-item');
        const floaters = containerRef.current?.querySelectorAll('.cta-floater');

        if (items) gsap.set(items, { opacity: 1, y: 0, clearProps: 'all' });
        if (floaters) gsap.set(floaters, { opacity: 0.3, y: 0, clearProps: 'all' });
      });

      // Kasus Normal Motion
      mm.add(MOTION_CONFIG.mediaQueries.noReducedMotion, () => {
        const items = containerRef.current?.querySelectorAll('.cta-animate-item');
        const floaters = containerRef.current?.querySelectorAll('.cta-floater');

        // 1. Entrance Reveal (Sekali saat masuk viewport)
        if (items && items.length > 0) {
          gsap.fromTo(
            items,
            { opacity: 0, y: 16 },
            {
              opacity: 1,
              y: 0,
              duration: MOTION_CONFIG.durations.normal,
              stagger: 0.1,
              ease: MOTION_CONFIG.easings.out,
              scrollTrigger: {
                trigger: containerRef.current,
                start: 'top 85%',
                once: true,
              },
            }
          );
        }

        // 2. Loop Pelan Floating Boxes
        let floatTl: gsap.core.Timeline | null = null;
        if (floaters && floaters.length > 0) {
          floatTl = gsap.timeline({ repeat: -1, paused: true });

          floaters.forEach((el, idx) => {
            gsap.to(el, {
              y: idx % 2 === 0 ? -3 : 3,
              duration: 2.8 + idx * 0.4,
              ease: 'sine.inOut',
              yoyo: true,
              repeat: -1,
            });
          });
        }

        // 3. ScrollTrigger Pause/Play
        const st = ScrollTrigger.create({
          trigger: containerRef.current,
          start: 'top bottom',
          end: 'bottom top',
          onToggle: (self) => {
            if (floatTl) {
              if (self.isActive) floatTl.play();
              else floatTl.pause();
            }
          },
        });

        return () => {
          st.kill();
          if (floatTl) floatTl.kill();
        };
      });
    },
    { scope: containerRef }
  );

  return (
    <div ref={containerRef} className="w-full">
      {children}
    </div>
  );
}
