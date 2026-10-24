'use client';

import React, { useRef } from 'react';
import { gsap, useGSAP, ScrollTrigger } from '@/lib/gsap';
import { MOTION_CONFIG } from '@/lib/motion.config';

/**
 * Komponen pembungkus animasi Section Jaringan Radar Multi-Cabang:
 * 1. Simpul cabang (Hub Pusat, Bandung, Surabaya) muncul pop-in bertahap (scale: 0.85 -> 1, opacity: 0 -> 1).
 * 2. Kotak callout kiri & kanan meluncur dari samping.
 * 3. Garis lengkung SVG (dashed arcs) mengalirkan data (animasi strokeDashoffset kontinu).
 * 4. Otomatis pause saat card berada di luar viewport layar.
 * 5. Mematuhi preferensi prefers-reduced-motion.
 */
export function NetworkRadarMotion({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!containerRef.current) return;

      const mm = gsap.matchMedia();

      // Kasus Reduced Motion
      mm.add(MOTION_CONFIG.mediaQueries.reducedMotion, () => {
        const nodes = containerRef.current?.querySelectorAll('.radar-node');
        const callouts = containerRef.current?.querySelectorAll('.radar-callout');
        const arcs = containerRef.current?.querySelectorAll('.radar-arc');

        if (nodes) gsap.set(nodes, { opacity: 1, scale: 1, clearProps: 'all' });
        if (callouts) gsap.set(callouts, { opacity: 1, x: 0, clearProps: 'all' });
        if (arcs) gsap.set(arcs, { opacity: 1, strokeDashoffset: 0 });
      });

      // Kasus Normal Motion
      mm.add(MOTION_CONFIG.mediaQueries.noReducedMotion, () => {
        const nodes = containerRef.current?.querySelectorAll('.radar-node');
        const calloutLeft = containerRef.current?.querySelector('.radar-callout-left');
        const calloutRight = containerRef.current?.querySelector('.radar-callout-right');
        const arcs = containerRef.current?.querySelectorAll('.radar-arc');

        // 1. Entrance Reveal (Sekali saat masuk viewport)
        const entranceTl = gsap.timeline({
          scrollTrigger: {
            trigger: containerRef.current,
            start: 'top 80%',
            once: true,
          },
        });

        if (nodes && nodes.length > 0) {
          entranceTl.fromTo(
            nodes,
            { opacity: 0, scale: 0.85, y: 10 },
            {
              opacity: 1,
              scale: 1,
              y: 0,
              duration: 0.5,
              stagger: 0.12,
              ease: MOTION_CONFIG.easings.out,
            }
          );
        }

        if (calloutLeft) {
          entranceTl.fromTo(
            calloutLeft,
            { opacity: 0, x: -20 },
            {
              opacity: 1,
              x: 0,
              duration: 0.5,
              ease: MOTION_CONFIG.easings.out,
            },
            '-=0.2'
          );
        }

        if (calloutRight) {
          entranceTl.fromTo(
            calloutRight,
            { opacity: 0, x: 20 },
            {
              opacity: 1,
              x: 0,
              duration: 0.5,
              ease: MOTION_CONFIG.easings.out,
            },
            '-=0.3'
          );
        }

        // 2. Loop Aliran Data pada Garis Lengkung (Continuous dashed arc flow)
        let arcLoopTl: gsap.core.Timeline | null = null;
        if (arcs && arcs.length > 0) {
          arcLoopTl = gsap.timeline({ repeat: -1, paused: true });
          arcLoopTl.fromTo(
            arcs,
            { strokeDashoffset: 0 },
            {
              strokeDashoffset: -24,
              duration: 1.6,
              ease: 'none',
            }
          );
        }

        // 3. ScrollTrigger Pause/Play saat in-view / out-of-view
        const st = ScrollTrigger.create({
          trigger: containerRef.current,
          start: 'top bottom',
          end: 'bottom top',
          onToggle: (self) => {
            if (arcLoopTl) {
              if (self.isActive) arcLoopTl.play();
              else arcLoopTl.pause();
            }
          },
        });

        return () => {
          st.kill();
          if (arcLoopTl) arcLoopTl.kill();
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
