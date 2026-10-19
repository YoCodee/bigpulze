import { ExpenseCategory, EXPENSE_CATEGORIES } from '@/lib/validators/expenses';

export interface ParsedVoiceExpense {
  raw_transcript: string;
  category: ExpenseCategory;
  amount: number;
  description: string;
  confidence: number;
  category_matched_by: 'explicit' | 'keyword' | 'default';
  matched_keyword?: string;
  explanation: string;
}

const CATEGORY_KEYWORDS: Record<ExpenseCategory, string[]> = {
  Utilitas: [
    'listrik',
    'pln',
    'token',
    'air',
    'pdam',
    'wifi',
    'internet',
    'indihome',
    'biznet',
    'telkom',
    'gas',
    'elpiji',
    'lpg',
    'galon',
    'aqua',
  ],
  Gaji: [
    'gaji',
    'upah',
    'honor',
    'bonus',
    'thr',
    'kasbon',
    'barista',
    'karyawan',
    'pegawai',
    'lembur',
    'uang makan',
    'gaji harian',
    'gaji bulanan',
  ],
  Sewa: [
    'sewa',
    'kontrak',
    'lapak',
    'ruko',
    'outlet',
    'retribusi',
    'gedung',
    'lahan',
    'sewa tempat',
  ],
  Transportasi: [
    'bensin',
    'pertalite',
    'pertamax',
    'solar',
    'ongkir',
    'ongkos kirim',
    'grab',
    'gojek',
    'kurir',
    'parkir',
    'tol',
    'antar',
    'ekspedisi',
    'jne',
    'jnt',
    'j&t',
  ],
  Pemasaran: [
    'iklan',
    'promosi',
    'promo',
    'brosur',
    'flyer',
    'spanduk',
    'banner',
    'endorse',
    'endorsement',
    'instagram',
    'fb ads',
    'facebook ads',
    'tiktok',
    'voucher',
    'ads',
  ],
  Perawatan: [
    'servis',
    'service',
    'perbaikan',
    'bengkel',
    'teknisi',
    'bongkar',
    'sparepart',
    'onderdil',
    'ac',
    'kulkas',
    'mesin kopi',
    'grinder',
    'blender',
    'mesin',
    'kompresor',
  ],
  'Perlengkapan Operasional': [
    'cup',
    'sedotan',
    'kresek',
    'plastik',
    'kantong',
    'tissue',
    'tisu',
    'sabun',
    'spons',
    'sarung tangan',
    'lakban',
    'pulpen',
    'nota',
    'kertas',
    'thermal',
    'alat tulis',
    'pembersih',
    'karbol',
    'lap',
    'trash bag',
    'plastik sampah',
    'cup sealer',
    'sedotan boba',
  ],
  Lainnya: [
    'kebersihan',
    'sampah',
    'iuran',
    'satpam',
    'keamanan',
    'sumbangan',
    'lain',
    'lainnya',
  ],
};

const INDO_DIGITS: Record<string, number> = {
  nol: 0,
  kosong: 0,
  satu: 1,
  se: 1,
  dua: 2,
  tiga: 3,
  empat: 4,
  lima: 5,
  enam: 6,
  tujuh: 7,
  delapan: 8,
  sembilan: 9,
  sepuluh: 10,
  sebelas: 11,
};

/**
 * Converts a small phrase (up to hundreds) like "tiga ratus lima puluh", "dua puluh lima", "tujuh puluh" into integer.
 */
function parseSmallIndoNumber(phrase: string): number | null {
  const words = phrase.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return null;

  // Single word
  if (words.length === 1) {
    const w = words[0];
    if (/^\d+$/.test(w)) return parseInt(w, 10);
    if (w === 'seratus') return 100;
    if (INDO_DIGITS[w] !== undefined) return INDO_DIGITS[w];
    return null;
  }

  // e.g., "dua belas", "lima belas"
  if (words.length === 2 && words[1] === 'belas') {
    const base = INDO_DIGITS[words[0]];
    if (base !== undefined) return 10 + base;
  }

  // e.g., "dua puluh", "lima puluh", "50"
  if (words.length === 2 && words[1] === 'puluh') {
    const base = INDO_DIGITS[words[0]];
    if (base !== undefined) return base * 10;
  }

  // e.g., "dua puluh lima", "tiga puluh lima"
  if (words.length === 3 && words[1] === 'puluh') {
    const tens = INDO_DIGITS[words[0]];
    const ones = INDO_DIGITS[words[2]];
    if (tens !== undefined && ones !== undefined) return tens * 10 + ones;
  }

  // e.g., "seratus lima puluh"
  if (words[0] === 'seratus') {
    if (words.length === 2 && INDO_DIGITS[words[1]] !== undefined) {
      return 100 + INDO_DIGITS[words[1]];
    }
    if (words.length === 3 && words[2] === 'puluh') {
      const tens = INDO_DIGITS[words[1]];
      if (tens !== undefined) return 100 + tens * 10;
    }
    if (words.length === 4 && words[2] === 'puluh') {
      const tens = INDO_DIGITS[words[1]];
      const ones = INDO_DIGITS[words[3]];
      if (tens !== undefined && ones !== undefined) return 100 + tens * 10 + ones;
    }
    if (words.length === 3 && words[2] === 'belas') {
      const base = INDO_DIGITS[words[1]];
      if (base !== undefined) return 100 + 10 + base;
    }
  }

  // e.g., "dua ratus", "tiga ratus lima puluh"
  if (words[1] === 'ratus') {
    const hundreds = INDO_DIGITS[words[0]] ?? 0;
    if (hundreds > 0) {
      const remainderWords = words.slice(2);
      if (remainderWords.length === 0) return hundreds * 100;
      const rem = parseSmallIndoNumber(remainderWords.join(' '));
      if (rem !== null) return hundreds * 100 + rem;
    }
  }

  return null;
}

/**
 * Extracts Rupiah currency amount and the matched text chunk from spoken text.
 */
export function extractExpenseAmount(text: string): {
  amount: number | null;
  matchedText: string;
} {
  const lower = text.toLowerCase();

  // Pattern 0: "setengah juta" -> 500.000
  const halfJutaMatch = lower.match(/\b(setengah\s+juta)\b/);
  if (halfJutaMatch) {
    return {
      amount: 500000,
      matchedText: halfJutaMatch[1],
    };
  }

  // Valid Indonesian number word pattern
  const NUMBER_WORD =
    '(?:seratus|se|satu|dua|tiga|empat|lima|enam|tujuh|delapan|sembilan|sepuluh|sebelas|setengah|\\d+)';
  const MODIFIERS = '(?:belas|puluh|ratus)';

  // Pattern 1: Spoken words with millions and thousands, e.g. "satu juta lima ratus ribu"
  const spokenJutaRibuRegex = new RegExp(
    `\\b(${NUMBER_WORD}(?:\\s+${MODIFIERS})?\\s+juta\\s+${NUMBER_WORD}(?:\\s+(?:${MODIFIERS}|${NUMBER_WORD}))*\\s+ribu)\\b`,
    'i'
  );
  const spokenJutaRibuMatch = lower.match(spokenJutaRibuRegex);
  if (spokenJutaRibuMatch) {
    const fullMatch = spokenJutaRibuMatch[1];
    const [jutaPart, ribuPart] = fullMatch.split(/\bjuta\b/);
    const jutaNum = parseSmallIndoNumber(jutaPart) ?? (parseInt(jutaPart.trim(), 10) || 0);
    let ribuNum = 0;
    if (ribuPart && ribuPart.includes('ribu')) {
      const beforeRibu = ribuPart.replace(/\bribu\b/, '').trim();
      if (beforeRibu) {
        ribuNum = parseSmallIndoNumber(beforeRibu) ?? (parseInt(beforeRibu, 10) || 0);
      }
    }
    const total = jutaNum * 1000000 + ribuNum * 1000;
    if (total > 0) {
      return { amount: total, matchedText: fullMatch };
    }
  }

  // Pattern 2: Spoken words with millions only, e.g. "satu juta", "dua juta", "5 juta"
  const spokenJutaRegex = new RegExp(
    `\\b(${NUMBER_WORD}(?:\\s+${MODIFIERS})?\\s+juta)\\b`,
    'i'
  );
  const spokenJutaMatch = lower.match(spokenJutaRegex);
  if (spokenJutaMatch) {
    const fullMatch = spokenJutaMatch[1];
    const beforeJuta = fullMatch.replace(/\bjuta\b/, '').trim();
    if (beforeJuta.includes(',') || beforeJuta.includes('.')) {
      const val = parseFloat(beforeJuta.replace(',', '.'));
      if (!isNaN(val)) {
        return { amount: Math.round(val * 1000000), matchedText: fullMatch };
      }
    }
    const jutaNum = parseSmallIndoNumber(beforeJuta) ?? (parseInt(beforeJuta, 10) || 0);
    if (jutaNum > 0) {
      return { amount: jutaNum * 1000000, matchedText: fullMatch };
    }
  }

  // Pattern 3: Spoken words with thousands, e.g. "dua puluh lima ribu", "seratus lima puluh ribu", "seribu", "dua ratus ribu"
  const spokenRibuRegex = new RegExp(
    `\\b(seribu|${NUMBER_WORD}(?:\\s+(?:${MODIFIERS}|${NUMBER_WORD}))*\\s+ribu)\\b`,
    'i'
  );
  const spokenRibuMatch = lower.match(spokenRibuRegex);
  if (spokenRibuMatch) {
    const fullMatch = spokenRibuMatch[1];
    if (fullMatch === 'seribu') {
      return { amount: 1000, matchedText: 'seribu' };
    }
    const beforeRibu = fullMatch.replace(/\bribu\b/, '').trim();
    const ribuNum = parseSmallIndoNumber(beforeRibu) ?? (parseInt(beforeRibu, 10) || 0);
    if (ribuNum > 0) {
      return { amount: ribuNum * 1000, matchedText: fullMatch };
    }
  }

  // Pattern 4: Numeric with suffix: e.g. "50rb", "50k", "150 k", "25 rb", "1.5jt", "2 jt"
  const numSuffixRegex =
    /\b(?:rp\.?\s*)?(\d+(?:[.,]\d+)?)\s*(k|rb|ribu|jt|juta)\b/i;
  const numSuffixMatch = lower.match(numSuffixRegex);
  if (numSuffixMatch) {
    const rawVal = numSuffixMatch[1].replace(',', '.');
    const suffix = numSuffixMatch[2].toLowerCase();
    const val = parseFloat(rawVal);
    if (!isNaN(val)) {
      const multiplier = suffix === 'jt' || suffix === 'juta' ? 1000000 : 1000;
      return {
        amount: Math.round(val * multiplier),
        matchedText: numSuffixMatch[0],
      };
    }
  }

  // Pattern 5: Standard formatted number e.g. "Rp 25.000", "25000", "1.500.000"
  const formattedNumRegex =
    /\b(?:rp\.?\s*)?(\d{1,3}(?:\.\d{3})+|\d{4,9})\b/i;
  const formattedNumMatch = lower.match(formattedNumRegex);
  if (formattedNumMatch) {
    const cleanNumStr = formattedNumMatch[1].replace(/\./g, '');
    const num = parseInt(cleanNumStr, 10);
    if (!isNaN(num) && num > 0) {
      return {
        amount: num,
        matchedText: formattedNumMatch[0],
      };
    }
  }

  return { amount: null, matchedText: '' };
}

/**
 * Categorizes an expense based on explicit category names or contextual keywords.
 */
export function categorizeExpense(text: string): {
  category: ExpenseCategory;
  category_matched_by: 'explicit' | 'keyword' | 'default';
  matched_keyword?: string;
} {
  const lower = text.toLowerCase();

  // 1. Explicit Category Mention check
  for (const cat of EXPENSE_CATEGORIES) {
    const catLower = cat.toLowerCase();
    const explicitRegex = new RegExp(`\\b(kategori|masuk|pos)\\s+${catLower}\\b`, 'i');
    if (explicitRegex.test(lower) || lower.includes(`kategori ${catLower}`)) {
      return {
        category: cat,
        category_matched_by: 'explicit',
        matched_keyword: cat,
      };
    }
  }

  // 2. Keyword Matching across all 8 categories
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS) as [
    ExpenseCategory,
    string[],
  ][]) {
    for (const kw of keywords) {
      const kwRegex = new RegExp(`\\b${kw.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}\\b`, 'i');
      if (kwRegex.test(lower)) {
        return {
          category: cat,
          category_matched_by: 'keyword',
          matched_keyword: kw,
        };
      }
    }
  }

  // 3. Fallback / Default
  return {
    category: 'Lainnya',
    category_matched_by: 'default',
  };
}

/**
 * Extracts and cleans description from transcript by removing voice command prefixes,
 * category directives, and the detected currency amount text.
 */
export function cleanExpenseDescription(
  text: string,
  matchedAmountText: string
): string {
  let cleaned = text;

  // Remove matched amount text
  if (matchedAmountText) {
    cleaned = cleaned.replace(matchedAmountText, ' ');
  }

  // Remove common speech prefixes
  const prefixRegex =
    /^(?:tolong\s+)?(?:catat(?:kan)?|tambah(?:kan)?|masukkan|input)\s+(?:pengeluaran|biaya)?\s*/i;
  cleaned = cleaned.replace(prefixRegex, ' ');

  // Remove explicit category words like "kategori utilitas", "kategori gaji"
  for (const cat of EXPENSE_CATEGORIES) {
    const catRegex = new RegExp(`\\b(kategori|masuk|pos)\\s+${cat.toLowerCase()}\\b`, 'gi');
    cleaned = cleaned.replace(catRegex, ' ');
  }

  // Remove leading/trailing symbols, excess spaces
  cleaned = cleaned
    .replace(/[^a-zA-Z0-9\s/.,&-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // If empty after cleaning, provide a fallback
  if (!cleaned) {
    return 'Pengeluaran operasional';
  }

  // Capitalize first letter
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

/**
 * Main NLP function for Indonesian voice expense parsing.
 */
export function parseVoiceExpense(transcript: string): ParsedVoiceExpense {
  const trimmed = transcript.trim();
  if (!trimmed) {
    return {
      raw_transcript: '',
      category: 'Lainnya',
      amount: 0,
      description: 'Pengeluaran tanpa keterangan',
      confidence: 0,
      category_matched_by: 'default',
      explanation: 'Transkrip suara kosong.',
    };
  }

  // 1. Extract Amount
  const { amount, matchedText: amountMatchedText } = extractExpenseAmount(trimmed);

  // 2. Determine Category
  const { category, category_matched_by, matched_keyword } = categorizeExpense(trimmed);

  // 3. Clean Description
  const description = cleanExpenseDescription(trimmed, amountMatchedText);

  // 4. Calculate Confidence Score
  let confidence = 0.5;
  if (amount !== null && amount > 0) {
    confidence += 0.3;
  }
  if (category_matched_by === 'explicit') {
    confidence += 0.2;
  } else if (category_matched_by === 'keyword') {
    confidence += 0.15;
  }
  if (description.length >= 5) {
    confidence += 0.05;
  }
  confidence = Math.min(1.0, Math.round(confidence * 100) / 100);

  // 5. Generate human-readable explanation
  let explanation = '';
  if (amount && category_matched_by !== 'default') {
    explanation = `Berhasil mengenali pengeluaran ${category} sebesar Rp ${amount.toLocaleString('id-ID')} dengan kata kunci "${matched_keyword}".`;
  } else if (amount) {
    explanation = `Nominal Rp ${amount.toLocaleString('id-ID')} terdeteksi. Kategori diarahkan ke ${category}.`;
  } else {
    explanation = `Nominal belum terdeteksi secara jelas. Mohon periksa kembali transkrip: "${trimmed}".`;
  }

  return {
    raw_transcript: trimmed,
    category,
    amount: amount ?? 0,
    description,
    confidence,
    category_matched_by,
    matched_keyword,
    explanation,
  };
}
