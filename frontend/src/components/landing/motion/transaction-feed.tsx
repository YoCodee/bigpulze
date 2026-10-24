'use client';

import React, { useRef, useEffect } from 'react';
import { Receipt, CheckCircle2 } from 'lucide-react';
import { gsap, useGSAP, ScrollTrigger } from '@/lib/gsap';
import { MOTION_CONFIG } from '@/lib/motion.config';

export interface TransactionItem {
  id: string;
  item: string;
  time: string;
  status: 'done' | 'syncing';
}

/**
 * Data transaksi deterministik (konstan, tanpa Math.random)
 * Menjamin 0 hydration mismatch dan konsistensi lintas perangkat.
 */
export const DEMO_TRANSACTIONS: TransactionItem[] = [
  { id: 'TRX-0842', item: '• Kopi Senja 2x', time: 'Hari ini, 11:32 WIB', status: 'done' },
  { id: 'TRX-0841', item: '• Roti Bakar Keju', time: 'Hari ini, 11:28 WIB', status: 'done' },
  { id: 'TRX-0840', item: '• Es Teh Manis 3x', time: 'Hari ini, 11:25 WIB', status: 'syncing' },
  { id: 'TRX-0843', item: '• Croissant Cokelat', time: 'Hari ini, 11:35 WIB', status: 'syncing' },
  { id: 'TRX-0844', item: '• Matcha Latte 1x', time: 'Hari ini, 11:38 WIB', status: 'syncing' },
  { id: 'TRX-0845', item: '• Americano Dingin 2x', time: 'Hari ini, 11:41 WIB', status: 'syncing' },
  { id: 'TRX-0846', item: '• Nasi Goreng Spesial', time: 'Hari ini, 11:45 WIB', status: 'syncing' },
  { id: 'TRX-0847', item: '• Kopi Susu Aren 2x', time: 'Hari ini, 11:48 WIB', status: 'syncing' },
  { id: 'TRX-0848', item: '• Roti Canai Kari', time: 'Hari ini, 11:52 WIB', status: 'syncing' },
];

const ROW_HEIGHT = 38; // px

/**
 * Helper untuk merender markup status baris transaksi
 */
function renderStatusHTML(status: 'done' | 'syncing'): string {
  if (status === 'syncing') {
    return `
      <span class="inline-flex items-center gap-1 text-brand-700 font-medium">
        Sinkronisasi <span class="animate-spin text-xs">⟳</span>
      </span>
    `;
  }
  return `
    <span class="inline-flex items-center gap-1 text-emerald-700 font-semibold">
      Selesai
      <svg class="h-3.5 w-3.5 text-emerald-700 stroke-emerald-700 inline-block" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="6.5" stroke="currentColor" stroke-width="1.5" class="opacity-90" />
        <path d="M5 8.2L7 10.2L11.5 5.8" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" class="checkmark-path" />
      </svg>
    </span>
  `;
}

/**
 * Helper untuk merender isi baris transaksi
 */
function renderRowContent(trx: TransactionItem): string {
  return `
    <div class="flex items-center space-x-2 truncate">
      <span class="text-slate-500">${trx.id}</span>
      <span class="hidden sm:inline text-slate-600">${trx.item}</span>
    </div>
    <span class="text-slate-500 text-[11px] shrink-0 mx-2">${trx.time}</span>
    <div class="status-slot shrink-0">
      ${renderStatusHTML(trx.status)}
    </div>
  `;
}

/**
 * Komponen Pilot Bento Card 1: Live Transaction Feed
 * Menampilkan 3 baris transaksi dengan loop animasi pelan setiap ±3.5s:
 * - Baris baru masuk dari atas (y: -ROW_HEIGHT -> 0, fade in)
 * - Baris sebelumnya bergeser turun
 * - Baris paling bawah fade out
 * - Status baris baru awalnya 'Sinkronisasi', lalu beralih ke 'Selesai' dengan centang tergambar
 * - Ikon struk oranye berdenyut sangat halus
 * - Otomatis PAUSE saat card keluar dari viewport pengguna (ScrollTrigger onToggle)
 * - Mematuhi preferensi prefers-reduced-motion (tampil statis tanpa gerak)
 */
export function TransactionFeedDemo() {
  const rootRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Slot references (0: incoming di atas, 1: baris atas, 2: baris tengah, 3: baris bawah)
  const slot0Ref = useRef<HTMLDivElement>(null);
  const slot1Ref = useRef<HTMLDivElement>(null);
  const slot2Ref = useRef<HTMLDivElement>(null);
  const slot3Ref = useRef<HTMLDivElement>(null);

  // Indeks transaksi demo berikutnya
  const nextPoolIndexRef = useRef(3);
  const isPausedRef = useRef(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useGSAP(
    () => {
      if (!rootRef.current || !wrapperRef.current) return;

      const mm = gsap.matchMedia();

      // Kasus Reduced Motion (aksesibilitas)
      mm.add(MOTION_CONFIG.mediaQueries.reducedMotion, () => {
        gsap.set(wrapperRef.current, { y: -ROW_HEIGHT, clearProps: 'opacity' });
      });

      // Kasus Motion Normal
      mm.add(MOTION_CONFIG.mediaQueries.noReducedMotion, () => {
        // Initial reveal saat card pertama kali masuk viewport
        const initialSlots = [slot1Ref.current, slot2Ref.current, slot3Ref.current];
        gsap.fromTo(
          initialSlots,
          { opacity: 0, y: 10 },
          {
            opacity: 1,
            y: 0,
            duration: MOTION_CONFIG.durations.normal,
            stagger: MOTION_CONFIG.staggers.normal,
            ease: MOTION_CONFIG.easings.out,
            scrollTrigger: {
              trigger: rootRef.current,
              start: 'top 85%',
              once: true,
            },
          }
        );

        // ScrollTrigger kontrol pause/play saat card in-view/out-of-view
        const st = ScrollTrigger.create({
          trigger: rootRef.current,
          start: 'top bottom',
          end: 'bottom top',
          onToggle: (self) => {
            isPausedRef.current = !self.isActive;
          },
        });

        // Fungsi siklus loop setiap ±3.5 detik
        const triggerNextTransaction = () => {
          if (isPausedRef.current) return;

          const poolIndex = nextPoolIndexRef.current;
          const nextTrx = DEMO_TRANSACTIONS[poolIndex];
          nextPoolIndexRef.current = (poolIndex + 1) % DEMO_TRANSACTIONS.length;

          const slot0 = slot0Ref.current;
          const slot1 = slot1Ref.current;
          const slot2 = slot2Ref.current;
          const slot3 = slot3Ref.current;
          const wrapper = wrapperRef.current;
          const icon = iconRef.current;

          if (!slot0 || !slot1 || !slot2 || !slot3 || !wrapper) return;

          // Isi Slot 0 dengan transaksi baru berstatus 'Sinkronisasi'
          slot0.innerHTML = renderRowContent({ ...nextTrx, status: 'syncing' });

          // 1. Ikon struk berdenyut sangat halus
          if (icon) {
            gsap.fromTo(
              icon,
              { scale: 1 },
              { scale: 1.07, duration: 0.22, yoyo: true, repeat: 1, ease: 'power2.out' }
            );
          }

          // 2. Geser wrapper ke bawah (y: -ROW_HEIGHT -> 0)
          gsap.fromTo(
            wrapper,
            { y: -ROW_HEIGHT },
            {
              y: 0,
              duration: 0.55,
              ease: 'power2.out',
              onStart: () => {
                gsap.fromTo(slot0, { opacity: 0 }, { opacity: 1, duration: 0.4 });
                gsap.to(slot3, { opacity: 0, duration: 0.35 });
              },
              onComplete: () => {
                // 3. Setelah ~0.9 detik, ubah status baris baru dari 'Sinkronisasi' ke 'Selesai'
                gsap.delayedCall(0.9, () => {
                  const statusSlot = slot0.querySelector('.status-slot');
                  if (statusSlot) {
                    statusSlot.innerHTML = renderStatusHTML('done');

                    // Stroke draw checkmark icon
                    const checkmarkPath = statusSlot.querySelector('.checkmark-path');
                    if (checkmarkPath) {
                      gsap.fromTo(
                        checkmarkPath,
                        { strokeDasharray: 20, strokeDashoffset: 20 },
                        { strokeDashoffset: 0, duration: 0.35, ease: 'power2.out' }
                      );
                    }
                  }

                  // 4. Setelah selesai tampil sejenak, reset posisi slot tanpa kedipan
                  gsap.delayedCall(1.8, () => {
                    // Pindahkan konten baris ke slot bawahnya
                    slot3.innerHTML = slot2.innerHTML;
                    slot2.innerHTML = slot1.innerHTML;
                    slot1.innerHTML = slot0.innerHTML;

                    // Kembalikan wrapper ke posisi awal (-ROW_HEIGHT) secara instan
                    gsap.set(wrapper, { y: -ROW_HEIGHT });
                    gsap.set(slot3, { opacity: 1 });
                  });
                });
              },
            }
          );
        };

        // Jalankan loop berulang setiap 3.6 detik
        const interval = setInterval(triggerNextTransaction, 3600);
        timerRef.current = interval;

        return () => {
          st.kill();
          if (interval) clearInterval(interval);
        };
      });
    },
    { scope: rootRef }
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return (
    <div ref={rootRef} className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
      {/* Left Orange Icon Pill */}
      <div
        ref={iconRef}
        className="h-12 w-12 rounded-xl bg-hero-gradient flex items-center justify-center text-white shadow-md shadow-brand-500/20 shrink-0 origin-center"
      >
        <Receipt className="h-6 w-6" />
      </div>

      {/* Transaction Status Table / Rows (Fixed height 114px, 3 rows visible) */}
      <div
        ref={containerRef}
        className="flex-1 w-full bg-slate-50 border border-slate-200 font-mono text-xs overflow-hidden relative"
        style={{ height: `${ROW_HEIGHT * 3}px` }}
      >
        <div
          ref={wrapperRef}
          className="divide-y divide-slate-200 will-change-transform"
          style={{ transform: `translateY(-${ROW_HEIGHT}px)` }}
        >
          {/* Slot 0: Hidden incoming row above container */}
          <div
            ref={slot0Ref}
            aria-hidden="true"
            className="px-3.5 flex items-center justify-between text-slate-700 select-none"
            style={{ height: `${ROW_HEIGHT}px` }}
            dangerouslySetInnerHTML={{
              __html: renderRowContent({
                id: 'TRX-0843',
                item: '• Croissant Cokelat',
                time: 'Hari ini, 11:35 WIB',
                status: 'syncing',
              }),
            }}
          />

          {/* Slot 1: Visible Row 1 (SSR Default) */}
          <div
            ref={slot1Ref}
            className="px-3.5 flex items-center justify-between text-slate-700"
            style={{ height: `${ROW_HEIGHT}px` }}
          >
            <div className="flex items-center space-x-2 truncate">
              <span className="text-slate-500">TRX-0842</span>
              <span className="hidden sm:inline text-slate-600">• Kopi Senja 2x</span>
            </div>
            <span className="text-slate-500 text-[11px] shrink-0 mx-2">Hari ini, 11:32 WIB</span>
            <div className="status-slot shrink-0">
              <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                Selesai <CheckCircle2 className="h-3.5 w-3.5" />
              </span>
            </div>
          </div>

          {/* Slot 2: Visible Row 2 (SSR Default) */}
          <div
            ref={slot2Ref}
            className="px-3.5 flex items-center justify-between text-slate-700"
            style={{ height: `${ROW_HEIGHT}px` }}
          >
            <div className="flex items-center space-x-2 truncate">
              <span className="text-slate-500">TRX-0841</span>
              <span className="hidden sm:inline text-slate-600">• Roti Bakar Keju</span>
            </div>
            <span className="text-slate-500 text-[11px] shrink-0 mx-2">Hari ini, 11:28 WIB</span>
            <div className="status-slot shrink-0">
              <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                Selesai <CheckCircle2 className="h-3.5 w-3.5" />
              </span>
            </div>
          </div>

          {/* Slot 3: Visible Row 3 (SSR Default) */}
          <div
            ref={slot3Ref}
            className="px-3.5 flex items-center justify-between text-slate-600"
            style={{ height: `${ROW_HEIGHT}px` }}
          >
            <div className="flex items-center space-x-2 truncate">
              <span className="text-slate-500">TRX-0840</span>
              <span className="hidden sm:inline text-slate-600">• Es Teh Manis 3x</span>
            </div>
            <span className="text-slate-500 text-[11px] shrink-0 mx-2">Hari ini, 11:25 WIB</span>
            <div className="status-slot shrink-0">
              <span className="inline-flex items-center gap-1 text-brand-700 font-medium">
                Sinkronisasi <span className="animate-spin text-xs">⟳</span>
              </span>
            </div>
          </div>
        </div>

        {/* Fallback noscript untuk peramban tanpa JavaScript */}
        <noscript>
          <div className="divide-y divide-slate-200">
            <div className="px-3.5 py-2.5 flex items-center justify-between text-slate-700">
              <span>TRX-0842 • Kopi Senja 2x</span>
              <span>Selesai</span>
            </div>
            <div className="px-3.5 py-2.5 flex items-center justify-between text-slate-700">
              <span>TRX-0841 • Roti Bakar Keju</span>
              <span>Selesai</span>
            </div>
            <div className="px-3.5 py-2.5 flex items-center justify-between text-slate-600">
              <span>TRX-0840 • Es Teh Manis 3x</span>
              <span>Sinkronisasi</span>
            </div>
          </div>
        </noscript>
      </div>
    </div>
  );
}
