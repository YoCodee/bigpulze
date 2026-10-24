/**
 * BizPulse Morning Briefing Script Builder
 *
 * Pure functions that convert structured financial data into a natural
 * Bahasa Indonesia narration script for Web Speech Synthesis (TTS).
 *
 * No side-effects, no browser APIs — fully testable.
 */

// ---------------------------------------------------------------------------
// Input / Output Interfaces
// ---------------------------------------------------------------------------

export interface BriefingPnlData {
  net_profit: number;
  total_revenue: number;
  total_cogs: number;
  total_expenses: number;
  net_margin_percent: number;
  vs_previous_day_percent: number | null;
  branch_count: number;
  top_branch?: { name: string; revenue: number } | null;
}

export interface BriefingAnomalyItem {
  title: string;
  branch_name: string;
  severity: string;
  metric_value: number;
}

export interface BriefingAnomalyData {
  total_open: number;
  critical_count: number;
  items: BriefingAnomalyItem[];
}

export interface BriefingRecommendationData {
  transfer_count: number;
  restock_count: number;
  total_net_benefit: number;
  top_transfer?: {
    product_name: string;
    from_branch: string;
    to_branch: string;
    quantity: number;
  } | null;
  top_restock?: {
    product_name: string;
    branch_name: string;
    quantity: number;
  } | null;
}

export interface BriefingData {
  owner_name: string;
  org_name: string;
  date_label: string;
  pnl: BriefingPnlData;
  anomalies: BriefingAnomalyData;
  recommendations: BriefingRecommendationData;
}

export interface BriefingSection {
  id: 'greeting' | 'profit' | 'attention' | 'action' | 'closing';
  label: string;
  text: string;
}

export interface BriefingScript {
  full_text: string;
  sections: BriefingSection[];
  estimated_duration_seconds: number;
}

// ---------------------------------------------------------------------------
// Number-to-Words (Bahasa Indonesia) for TTS
// ---------------------------------------------------------------------------

const SATUAN = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan'];
const BELASAN = ['sepuluh', 'sebelas', 'dua belas', 'tiga belas', 'empat belas', 'lima belas',
  'enam belas', 'tujuh belas', 'delapan belas', 'sembilan belas'];

/**
 * Convert an integer to Bahasa Indonesia words.
 * Handles values up to trillions.
 */
export function numberToWords(n: number): string {
  if (n === 0) return 'nol';

  const isNegative = n < 0;
  const num = Math.abs(Math.round(n));

  if (num >= 1_000_000_000_000) {
    const triliun = Math.floor(num / 1_000_000_000_000);
    const sisa = num % 1_000_000_000_000;
    const parts = [numberToWords(triliun) + ' triliun'];
    if (sisa > 0) parts.push(numberToWords(sisa));
    return (isNegative ? 'minus ' : '') + parts.join(' ');
  }

  if (num >= 1_000_000_000) {
    const miliar = Math.floor(num / 1_000_000_000);
    const sisa = num % 1_000_000_000;
    const parts = [numberToWords(miliar) + ' miliar'];
    if (sisa > 0) parts.push(numberToWords(sisa));
    return (isNegative ? 'minus ' : '') + parts.join(' ');
  }

  if (num >= 1_000_000) {
    const juta = Math.floor(num / 1_000_000);
    const sisa = num % 1_000_000;
    const parts = [numberToWords(juta) + ' juta'];
    if (sisa > 0) parts.push(numberToWords(sisa));
    return (isNegative ? 'minus ' : '') + parts.join(' ');
  }

  if (num >= 1_000) {
    const ribu = Math.floor(num / 1_000);
    const sisa = num % 1_000;
    const prefix = ribu === 1 ? 'seribu' : numberToWords(ribu) + ' ribu';
    const parts = [prefix];
    if (sisa > 0) parts.push(numberToWords(sisa));
    return (isNegative ? 'minus ' : '') + parts.join(' ');
  }

  if (num >= 100) {
    const ratus = Math.floor(num / 100);
    const sisa = num % 100;
    const prefix = ratus === 1 ? 'seratus' : SATUAN[ratus] + ' ratus';
    const parts = [prefix];
    if (sisa > 0) parts.push(numberToWords(sisa));
    return (isNegative ? 'minus ' : '') + parts.join(' ');
  }

  if (num >= 20) {
    const puluhan = Math.floor(num / 10);
    const sisa = num % 10;
    const parts = [SATUAN[puluhan] + ' puluh'];
    if (sisa > 0) parts.push(SATUAN[sisa]);
    return (isNegative ? 'minus ' : '') + parts.join(' ');
  }

  if (num >= 10) {
    return (isNegative ? 'minus ' : '') + BELASAN[num - 10];
  }

  return (isNegative ? 'minus ' : '') + SATUAN[num];
}

/**
 * Format a Rupiah amount as spoken words.
 * e.g. 2730000 → "dua juta tujuh ratus tiga puluh ribu rupiah"
 */
export function formatRupiahSpeech(amount: number): string {
  if (amount === 0) return 'nol rupiah';
  const abs = Math.abs(Math.round(amount));
  const words = numberToWords(abs);
  const prefix = amount < 0 ? 'minus ' : '';
  return `${prefix}${words} rupiah`;
}

/**
 * Format a percentage as spoken words.
 * e.g. 70.9 → "tujuh puluh koma sembilan persen"
 */
export function formatPercentSpeech(value: number): string {
  const abs = Math.abs(value);
  const intPart = Math.floor(abs);
  const decPart = Math.round((abs - intPart) * 10);
  const prefix = value < 0 ? 'minus ' : '';

  if (decPart === 0) {
    return `${prefix}${numberToWords(intPart)} persen`;
  }

  return `${prefix}${numberToWords(intPart)} koma ${numberToWords(decPart)} persen`;
}

// ---------------------------------------------------------------------------
// Section Builders
// ---------------------------------------------------------------------------

function buildGreeting(data: BriefingData): string {
  const hour = new Date().getHours();
  let salam = 'Selamat pagi';
  if (hour >= 11 && hour < 15) salam = 'Selamat siang';
  else if (hour >= 15 && hour < 18) salam = 'Selamat sore';
  else if (hour >= 18 || hour < 4) salam = 'Selamat malam';

  return `${salam}, ${data.owner_name}! Berikut ringkasan bisnis ${data.org_name} untuk hari ini, ${data.date_label}.`;
}

function buildProfitSection(data: BriefingData): string {
  const { pnl } = data;
  const parts: string[] = [];

  if (pnl.net_profit >= 0) {
    parts.push(
      `Pertanyaan satu, kemarin untung atau rugi? Kabar baik! Usaha Anda membukukan laba bersih ${formatRupiahSpeech(pnl.net_profit)}, dengan margin ${formatPercentSpeech(pnl.net_margin_percent)}.`
    );
  } else {
    parts.push(
      `Pertanyaan satu, kemarin untung atau rugi? Perhatian, kemarin usaha Anda mencatat kerugian sebesar ${formatRupiahSpeech(Math.abs(pnl.net_profit))}. Margin bersih ${formatPercentSpeech(pnl.net_margin_percent)}.`
    );
  }

  if (pnl.vs_previous_day_percent !== null && pnl.vs_previous_day_percent !== 0) {
    if (pnl.vs_previous_day_percent > 0) {
      parts.push(`Naik ${formatPercentSpeech(pnl.vs_previous_day_percent)} dibanding hari sebelumnya.`);
    } else {
      parts.push(`Turun ${formatPercentSpeech(Math.abs(pnl.vs_previous_day_percent))} dibanding hari sebelumnya.`);
    }
  }

  if (pnl.top_branch) {
    parts.push(`Cabang terbaik adalah ${pnl.top_branch.name} dengan omzet ${formatRupiahSpeech(pnl.top_branch.revenue)}.`);
  }

  return parts.join(' ');
}

function buildAttentionSection(data: BriefingData): string {
  const { anomalies } = data;

  if (anomalies.total_open === 0) {
    return 'Pertanyaan dua, apa yang harus diperhatikan? Kabar baik, tidak ditemukan anomali biaya di seluruh cabang Anda. Bisnis beroperasi normal.';
  }

  const parts: string[] = [];
  const countText = anomalies.total_open === 1
    ? 'satu anomali'
    : `${numberToWords(anomalies.total_open)} anomali`;

  parts.push(`Pertanyaan dua, apa yang harus diperhatikan? Ditemukan ${countText} terbuka yang perlu Anda tinjau.`);

  if (anomalies.critical_count > 0) {
    parts.push(`${numberToWords(anomalies.critical_count)} di antaranya berstatus kritis.`);
  }

  // Describe top 2 anomalies briefly
  const topItems = anomalies.items.slice(0, 2);
  topItems.forEach((item) => {
    parts.push(`${item.title} di ${item.branch_name}.`);
  });

  return parts.join(' ');
}

function buildActionSection(data: BriefingData): string {
  const { recommendations } = data;
  const totalRecs = recommendations.transfer_count + recommendations.restock_count;

  if (totalRecs === 0) {
    return 'Pertanyaan tiga, apa yang harus dilakukan hari ini? Saat ini tidak ada rekomendasi tindakan mendesak. Seluruh persediaan cabang dalam kondisi aman.';
  }

  const parts: string[] = [];

  parts.push(`Pertanyaan tiga, apa yang harus dilakukan hari ini?`);

  if (recommendations.transfer_count > 0) {
    parts.push(
      `Ada ${numberToWords(recommendations.transfer_count)} rekomendasi mutasi stok antar cabang`
      + (recommendations.total_net_benefit > 0
        ? ` yang bisa menyelamatkan potensi laba ${formatRupiahSpeech(recommendations.total_net_benefit)}.`
        : '.')
    );

    if (recommendations.top_transfer) {
      const t = recommendations.top_transfer;
      parts.push(
        `Prioritas utama: pindahkan ${numberToWords(t.quantity)} unit ${t.product_name} dari ${t.from_branch} ke ${t.to_branch}.`
      );
    }
  }

  if (recommendations.restock_count > 0) {
    parts.push(`Ada ${numberToWords(recommendations.restock_count)} produk yang perlu di-restock.`);

    if (recommendations.top_restock) {
      const r = recommendations.top_restock;
      parts.push(
        `Yang paling mendesak: restock ${numberToWords(r.quantity)} unit ${r.product_name} untuk ${r.branch_name}.`
      );
    }
  }

  return parts.join(' ');
}

function buildClosing(data: BriefingData): string {
  return `Demikian briefing pagi untuk ${data.org_name}. Selamat menjalani hari, ${data.owner_name}!`;
}

// ---------------------------------------------------------------------------
// Main Builder
// ---------------------------------------------------------------------------

/**
 * Estimate TTS duration in seconds based on word count.
 * Indonesian TTS speaks at roughly 140-160 words per minute.
 */
function estimateDuration(text: string): number {
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  return Math.ceil((wordCount / 150) * 60);
}

/**
 * Build a complete morning briefing script from structured data.
 */
export function buildBriefingScript(data: BriefingData): BriefingScript {
  const sections: BriefingSection[] = [
    {
      id: 'greeting',
      label: 'Salam Pembuka',
      text: buildGreeting(data),
    },
    {
      id: 'profit',
      label: 'Pertanyaan 1: Untung / Rugi',
      text: buildProfitSection(data),
    },
    {
      id: 'attention',
      label: 'Pertanyaan 2: Perhatian',
      text: buildAttentionSection(data),
    },
    {
      id: 'action',
      label: 'Pertanyaan 3: Tindakan',
      text: buildActionSection(data),
    },
    {
      id: 'closing',
      label: 'Penutup',
      text: buildClosing(data),
    },
  ];

  const full_text = sections.map((s) => s.text).join(' ');
  const estimated_duration_seconds = estimateDuration(full_text);

  return {
    full_text,
    sections,
    estimated_duration_seconds,
  };
}
