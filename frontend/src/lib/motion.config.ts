/**
 * Konfigurasi Terpadu Animasi GSAP Landing Page Alur
 * Memastikan durasi, easing, stagger, dan jarak gerak konsisten di seluruh komponen.
 */

export const MOTION_CONFIG = {
  // Durasi gerak (0.4s s.d. 0.8s sesuai prinsip PRD)
  durations: {
    fast: 0.4,
    normal: 0.6,
    slow: 0.8,
  },

  // Easing standar (tanpa efek bounce/overshoot)
  easings: {
    out: 'power2.out',
    smooth: 'power3.out',
    ambient: 'sine.inOut',
  },

  // Stagger kemunculan anak elemen
  staggers: {
    tight: 0.06,
    normal: 0.08,
    relaxed: 0.12,
  },

  // Jarak pergeseran transform (Y/X) dalam pixel
  distances: {
    sm: 8,
    md: 14,
    lg: 20,
    mobile: 8, // Jarak lebih pendek pada perangkat bergerak
  },

  // Batas lebar layar mobile
  breakpoints: {
    mobile: 768,
  },

  // Media query untuk aksesibilitas vestibular
  mediaQueries: {
    reducedMotion: '(prefers-reduced-motion: reduce)',
    noReducedMotion: '(prefers-reduced-motion: no-preference)',
  },
} as const;
