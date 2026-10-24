'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { gsap, useGSAP } from '@/lib/gsap';
import { MOTION_CONFIG } from '@/lib/motion.config';

/**
 * 1. CornerMarks:
 * Kotak kecil (8px x 8px) di setiap sudut grid/kartu seperti selection handle di CAD/Figma.
 * Menganimasikan pop-in (scale: 0 -> 1) berurutan saat elemen masuk viewport.
 */
export interface CornerMarksProps {
  className?: string;
  size?: number; // default 8px
  borderClass?: string;
  bgClass?: string;
}

export function CornerMarks({
  className,
  borderClass = 'border-slate-300',
  bgClass = 'bg-white',
}: CornerMarksProps) {
  const ref = React.useRef<(HTMLSpanElement | null)[]>([]);

  useGSAP(() => {
    const elements = ref.current.filter((el): el is HTMLSpanElement => Boolean(el));
    if (elements.length === 0) return;

    const mm = gsap.matchMedia();
    mm.add(MOTION_CONFIG.mediaQueries.reducedMotion, () => {
      gsap.set(elements, { scale: 1, opacity: 1, clearProps: 'transform,opacity' });
    });
    mm.add(MOTION_CONFIG.mediaQueries.noReducedMotion, () => {
      gsap.fromTo(
        elements,
        { scale: 0, opacity: 0 },
        {
          scale: 1,
          opacity: 1,
          duration: 0.35,
          stagger: 0.05,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: elements[0]?.parentElement || elements[0],
            start: 'top 88%',
            once: true,
          },
        }
      );
    });
  });

  return (
    <>
      {/* Top Left */}
      <span
        ref={(el) => { ref.current[0] = el; }}
        aria-hidden="true"
        className={cn(
          'absolute -top-1 -left-1 h-2 w-2 border z-10 pointer-events-none transition-colors origin-center',
          borderClass,
          bgClass,
          className
        )}
      />
      {/* Top Right */}
      <span
        ref={(el) => { ref.current[1] = el; }}
        aria-hidden="true"
        className={cn(
          'absolute -top-1 -right-1 h-2 w-2 border z-10 pointer-events-none transition-colors origin-center',
          borderClass,
          bgClass,
          className
        )}
      />
      {/* Bottom Left */}
      <span
        ref={(el) => { ref.current[2] = el; }}
        aria-hidden="true"
        className={cn(
          'absolute -bottom-1 -left-1 h-2 w-2 border z-10 pointer-events-none transition-colors origin-center',
          borderClass,
          bgClass,
          className
        )}
      />
      {/* Bottom Right */}
      <span
        ref={(el) => { ref.current[3] = el; }}
        aria-hidden="true"
        className={cn(
          'absolute -bottom-1 -right-1 h-2 w-2 border z-10 pointer-events-none transition-colors origin-center',
          borderClass,
          bgClass,
          className
        )}
      />
    </>
  );
}

/**
 * 2. DashedRule:
 * Garis putus-putus horizontal selebar layar (full-bleed) yang memotong garis pandu vertikal.
 * Tergambar dari tengah ke samping (scaleX: 0 -> 1) saat masuk viewport.
 */
export function DashedRule({
  className,
  accent = false,
}: {
  className?: string;
  accent?: boolean;
}) {
  const lineRef = React.useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!lineRef.current) return;

    const mm = gsap.matchMedia();
    mm.add(MOTION_CONFIG.mediaQueries.reducedMotion, () => {
      gsap.set(lineRef.current, { scaleX: 1, opacity: 1, clearProps: 'transform,opacity' });
    });
    mm.add(MOTION_CONFIG.mediaQueries.noReducedMotion, () => {
      gsap.fromTo(
        lineRef.current,
        { scaleX: 0, opacity: 0 },
        {
          scaleX: 1,
          opacity: 1,
          duration: MOTION_CONFIG.durations.slow,
          ease: MOTION_CONFIG.easings.out,
          scrollTrigger: {
            trigger: lineRef.current,
            start: 'top 92%',
            once: true,
          },
        }
      );
    });
  }, { scope: lineRef });

  return (
    <div
      ref={lineRef}
      aria-hidden="true"
      style={{ transformOrigin: 'center' }}
      className={cn(
        'w-full border-b border-dashed select-none pointer-events-none origin-center',
        accent ? 'border-brand-500/60' : 'border-slate-200',
        className
      )}
    />
  );
}

/**
 * 3. DotGutter:
 * Koridor gutter berisi tekstur dot matrix 8px x 8px
 */
export function DotGutter({
  className,
}: {
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'hidden md:block w-12 xl:w-[105px] h-full bg-dot-matrix-light pointer-events-none shrink-0',
        className
      )}
    />
  );
}

/**
 * 4. Callout:
 * Kotak keterangan berborder putus-putus berwarna aksen oranye, teks terstandarisasi
 */
export function Callout({
  children,
  className,
  title,
}: {
  children: React.ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <div
      className={cn(
        'rounded-none border border-dashed border-brand-500/40 bg-brand-50/70 px-3.5 py-2.5 text-left text-brand-700 backdrop-blur-xs',
        className
      )}
    >
      {title && (
        <p className="text-xs font-bold text-brand-700 uppercase tracking-wider mb-1">
          {title}
        </p>
      )}
      <div className="text-xs sm:text-sm leading-relaxed text-slate-700">
        {children}
      </div>
    </div>
  );
}

/**
 * 5. FeatureGrid & FeatureCell:
 * Grid bersudut siku tajam (rounded-none), bergaris 1px tipis, dilengkapi CornerMarks
 */
export function FeatureGrid({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const gridRef = React.useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!gridRef.current) return;
      const cells = gridRef.current.querySelectorAll('.landing-card-hover');
      if (!cells || cells.length === 0) return;

      const mm = gsap.matchMedia();
      mm.add(MOTION_CONFIG.mediaQueries.reducedMotion, () => {
        gsap.set(cells, { opacity: 1, y: 0, clearProps: 'transform,opacity' });
      });
      mm.add(MOTION_CONFIG.mediaQueries.noReducedMotion, () => {
        gsap.fromTo(
          cells,
          { opacity: 0, y: 14 },
          {
            opacity: 1,
            y: 0,
            duration: MOTION_CONFIG.durations.normal,
            stagger: 0.1,
            ease: MOTION_CONFIG.easings.out,
            scrollTrigger: {
              trigger: gridRef.current,
              start: 'top 85%',
              once: true,
            },
          }
        );
      });
    },
    { scope: gridRef }
  );

  return (
    <div
      ref={gridRef}
      className={cn(
        'relative rounded-none border border-slate-200 bg-white shadow-none overflow-visible',
        className
      )}
    >
      <CornerMarks />
      <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-200">
        {children}
      </div>
    </div>
  );
}

export function FeatureCell({
  icon: Icon,
  title,
  description,
  className,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  className?: string;
}) {
  return (
    <div className={cn('landing-card-hover p-6 sm:p-7 text-left space-y-2.5 bg-white hover:bg-slate-50/50', className)}>
      {Icon && (
        <div className="text-slate-600 mb-3 card-hover-icon">
          <Icon className="h-5 w-5 stroke-[1.5]" />
        </div>
      )}
      <h4 className="text-sm sm:text-base font-semibold text-slate-900 tracking-tight">
        {title}
      </h4>
      <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed">
        {description}
      </p>
    </div>
  );
}

/**
 * 6. BlueprintCanvas:
 * Pembungkus kontainer kontinu untuk seluruh landing page:
 * - Garis pandu vertikal luar (1120px)
 * - Koridor dot-gutter 105px di kiri dan kanan
 * - Garis pandu vertikal dalam (910px) pembatas konten utama
 * - Menembus kontinu dari atas sampai bawah tanpa terputus
 * - Garis vertikal tergambar dari atas ke bawah (scaleY: 0 -> 1) dan dot gutter fade-in
 */
export function BlueprintCanvas({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const canvasRef = React.useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!canvasRef.current) return;

    const verticalLines = canvasRef.current.querySelectorAll('.blueprint-v-line');
    const dotGutters = canvasRef.current.querySelectorAll('.blueprint-gutter');

    const mm = gsap.matchMedia();
    mm.add(MOTION_CONFIG.mediaQueries.reducedMotion, () => {
      gsap.set([...Array.from(verticalLines), ...Array.from(dotGutters)], {
        scaleY: 1,
        opacity: 1,
        clearProps: 'transform,opacity',
      });
    });
    mm.add(MOTION_CONFIG.mediaQueries.noReducedMotion, () => {
      if (verticalLines.length > 0) {
        gsap.fromTo(
          verticalLines,
          { scaleY: 0 },
          {
            scaleY: 1,
            duration: MOTION_CONFIG.durations.slow,
            stagger: 0.08,
            ease: MOTION_CONFIG.easings.out,
            transformOrigin: 'top',
          }
        );
      }
      if (dotGutters.length > 0) {
        gsap.fromTo(
          dotGutters,
          { opacity: 0 },
          {
            opacity: 1,
            duration: MOTION_CONFIG.durations.slow,
            delay: 0.2,
            ease: MOTION_CONFIG.easings.out,
          }
        );
      }
    });
  }, { scope: canvasRef });

  return (
    <div ref={canvasRef} className={cn('relative w-full overflow-x-clip bg-white', className)}>
      {/* Continuous Vertical Guides Layer (Fixed in background spanning full height) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-1/2 -translate-x-1/2 w-full max-w-[1120px] z-0 flex justify-between"
      >
        {/* Sisi Kiri: Garis Luar + Gutter 105px + Garis Dalam */}
        <div className="hidden md:flex h-full">
          {/* Garis Vertikal Luar Kiri */}
          <div className="blueprint-v-line h-full border-r border-dashed border-slate-200" style={{ transformOrigin: 'top' }} />
          {/* Koridor Dot Matrix Gutter Kiri (105px pada xl, 48px pada md) */}
          <div className="blueprint-gutter w-12 xl:w-[105px] h-full bg-dot-matrix-light" />
          {/* Garis Vertikal Dalam Kiri */}
          <div className="blueprint-v-line h-full border-r border-dashed border-slate-200" style={{ transformOrigin: 'top' }} />
        </div>

        {/* Kolom Konten Dalam (±910px) dibiarkan transparan bersih di tengah */}
        <div className="flex-1 max-w-[910px] h-full" />

        {/* Sisi Kanan: Garis Dalam + Gutter 105px + Garis Luar */}
        <div className="hidden md:flex h-full">
          {/* Garis Vertikal Dalam Kanan */}
          <div className="blueprint-v-line h-full border-l border-dashed border-slate-200" style={{ transformOrigin: 'top' }} />
          {/* Koridor Dot Matrix Gutter Kanan (105px pada xl, 48px pada md) */}
          <div className="blueprint-gutter w-12 xl:w-[105px] h-full bg-dot-matrix-light" />
          {/* Garis Vertikal Luar Kanan */}
          <div className="blueprint-v-line h-full border-l border-dashed border-slate-200" style={{ transformOrigin: 'top' }} />
        </div>
      </div>

      {/* Konten Halaman Aktif di atas grid pandu */}
      <div className="relative z-10 w-full">{children}</div>
    </div>
  );
}

/**
 * 7. BlueprintSection:
 * Section dengan garis pemisah horizontal putus-putus dan kolom konten 910px terpusat
 */
export function BlueprintSection({
  children,
  className,
  id,
  withRule = true,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
  withRule?: boolean;
}) {
  return (
    <section id={id} className={cn('relative w-full', className)}>
      {withRule && <DashedRule />}
      <div className="max-w-[910px] mx-auto px-4 sm:px-6 py-16 sm:py-24">
        {children}
      </div>
      {withRule && <DashedRule />}
    </section>
  );
}
