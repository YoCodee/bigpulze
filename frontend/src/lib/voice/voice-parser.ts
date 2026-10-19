export interface ProductCandidate {
  id: string;
  name: string;
  sku: string;
  category?: string;
  aliases: string[];
  selling_price: number;
  cost_price?: number;
  stock: number;
}

export interface ParsedVoiceItem {
  product_id: string;
  product_name: string;
  sku: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  matched_by: 'name' | 'sku' | 'alias' | 'fuzzy';
}

export interface VoiceParseResult {
  raw_transcript: string;
  items: ParsedVoiceItem[];
  payment_method: 'CASH' | 'QRIS_SIM' | null;
  unmatched_phrases: string[];
  confidence: number;
}

// Indonesian words to numbers mapping
const INDO_NUMBERS: Record<string, number> = {
  nol: 0,
  kosong: 0,
  satu: 1,
  se: 1,
  sebutir: 1,
  sebuah: 1,
  segelas: 1,
  sebiji: 1,
  seporsi: 1,
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
  'dua belas': 12,
  'tiga belas': 13,
  'empat belas': 14,
  'lima belas': 15,
  'enam belas': 16,
  'tujuh belas': 17,
  'delapan belas': 18,
  'sembilan belas': 19,
  'dua puluh': 20,
  'tiga puluh': 30,
  'empat puluh': 40,
  'lima puluh': 50,
  'enam puluh': 60,
  'tujuh puluh': 70,
  'delapan puluh': 80,
  'sembilan puluh': 90,
  seratus: 100,
  'setengah lusin': 6,
  selusin: 12,
  'satu lusin': 12,
  'dua lusin': 24,
};

/**
 * Normalizes an Indonesian number expression or numeric string to an integer.
 */
export function parseIndonesianNumber(input: string): number | null {
  const trimmed = input.trim().toLowerCase();
  if (!trimmed) return null;

  // Direct integer check
  const num = parseInt(trimmed, 10);
  if (!isNaN(num) && num.toString() === trimmed) {
    return num;
  }

  // Direct word check
  if (INDO_NUMBERS[trimmed] !== undefined) {
    return INDO_NUMBERS[trimmed];
  }

  // Multi-word check (e.g., "dua puluh lima" = 25)
  const words = trimmed.split(/\s+/);
  if (words.length === 3 && words[1] === 'puluh') {
    const tens = INDO_NUMBERS[words[0]];
    const ones = INDO_NUMBERS[words[2]];
    if (tens !== undefined && ones !== undefined) {
      return tens * 10 + ones;
    }
  }

  if (words.length === 2) {
    if (words[1] === 'belas') {
      const base = INDO_NUMBERS[words[0]];
      if (base !== undefined) return 10 + base;
    }
    if (words[1] === 'puluh') {
      const base = INDO_NUMBERS[words[0]];
      if (base !== undefined) return base * 10;
    }
  }

  return null;
}

/**
 * Clean string for comparison: lowercase, trim, remove excess whitespace & common punctuation.
 */
export function cleanText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extracts payment method from transcript text.
 */
export function extractPaymentMethod(text: string): {
  payment_method: 'CASH' | 'QRIS_SIM' | null;
  remainingText: string;
} {
  const lower = text.toLowerCase();

  // QRIS detection
  const qrisRegex = /\b(bayar\s+)?(qris|scan\s+qris|simulasi\s+qris|non\s*tunai|transfer)\b/i;
  if (qrisRegex.test(lower)) {
    return {
      payment_method: 'QRIS_SIM',
      remainingText: lower.replace(qrisRegex, ' ').trim(),
    };
  }

  // CASH detection
  const cashRegex = /\b(bayar\s+)?(tunai|cash|uang\s+pas|uang\s+tunai)\b/i;
  if (cashRegex.test(lower)) {
    return {
      payment_method: 'CASH',
      remainingText: lower.replace(cashRegex, ' ').trim(),
    };
  }

  return { payment_method: null, remainingText: text };
}

/**
 * Matches a clause against available product candidates.
 */
export function matchProductInClause(
  clause: string,
  products: ProductCandidate[]
): {
  product: ProductCandidate | null;
  quantity: number;
  matchedBy: 'name' | 'sku' | 'alias' | 'fuzzy' | null;
  residualText: string;
} {
  const normalizedClause = cleanText(clause);
  if (!normalizedClause) {
    return { product: null, quantity: 1, matchedBy: null, residualText: clause };
  }

  let bestProduct: ProductCandidate | null = null;
  let bestMatchScore = 0;
  let matchedBy: 'name' | 'sku' | 'alias' | 'fuzzy' | null = null;
  let matchedToken = '';

  for (const prod of products) {
    const cleanProdName = cleanText(prod.name);
    const cleanSku = cleanText(prod.sku);

    // 1. Exact Name match
    if (normalizedClause.includes(cleanProdName)) {
      if (cleanProdName.length > bestMatchScore) {
        bestProduct = prod;
        bestMatchScore = cleanProdName.length;
        matchedBy = 'name';
        matchedToken = cleanProdName;
      }
    }

    // 2. Exact SKU match
    if (cleanSku && normalizedClause.includes(cleanSku)) {
      if (cleanSku.length > bestMatchScore) {
        bestProduct = prod;
        bestMatchScore = cleanSku.length;
        matchedBy = 'sku';
        matchedToken = cleanSku;
      }
    }

    // 3. Alias matches
    for (const alias of prod.aliases) {
      const cleanAlias = cleanText(alias);
      if (cleanAlias && normalizedClause.includes(cleanAlias)) {
        if (cleanAlias.length > bestMatchScore) {
          bestProduct = prod;
          bestMatchScore = cleanAlias.length;
          matchedBy = 'alias';
          matchedToken = cleanAlias;
        }
      }
    }
  }

  // If no exact substring matched, try word token overlap (fuzzy)
  if (!bestProduct) {
    const clauseTokens = normalizedClause.split(/\s+/);
    for (const prod of products) {
      const nameTokens = cleanText(prod.name).split(/\s+/);
      const matches = nameTokens.filter((t) => t.length > 2 && clauseTokens.includes(t));
      if (matches.length >= 1 && matches.length / nameTokens.length >= 0.5) {
        const score = matches.length * 10;
        if (score > bestMatchScore) {
          bestProduct = prod;
          bestMatchScore = score;
          matchedBy = 'fuzzy';
          matchedToken = matches.join(' ');
        }
      }
    }
  }

  if (!bestProduct) {
    return { product: null, quantity: 1, matchedBy: null, residualText: clause };
  }

  // Extract quantity from the remaining part of the clause
  let residual = normalizedClause;
  if (matchedToken) {
    residual = residual.replace(matchedToken, ' ').trim();
  }

  let quantity = 1;

  // Look for numbers in residual
  const numberTokens = residual.split(/\s+/).filter(Boolean);
  for (let i = 0; i < numberTokens.length; i++) {
    // Check 2-word numbers first (e.g. "dua puluh", "lima belas")
    if (i + 1 < numberTokens.length) {
      const twoWords = `${numberTokens[i]} ${numberTokens[i + 1]}`;
      const parsedTwo = parseIndonesianNumber(twoWords);
      if (parsedTwo !== null && parsedTwo > 0) {
        quantity = parsedTwo;
        residual = residual.replace(twoWords, ' ').trim();
        break;
      }
    }

    const singleParsed = parseIndonesianNumber(numberTokens[i]);
    if (singleParsed !== null && singleParsed > 0) {
      quantity = singleParsed;
      residual = residual.replace(numberTokens[i], ' ').trim();
      break;
    }
  }

  return {
    product: bestProduct,
    quantity,
    matchedBy,
    residualText: residual.trim(),
  };
}

/**
 * Main parser function: converts an Indonesian voice transcript into cart items and payment method.
 */
export function parseVoiceOrder(
  transcript: string,
  products: ProductCandidate[]
): VoiceParseResult {
  const raw_transcript = transcript.trim();
  if (!raw_transcript) {
    return {
      raw_transcript: '',
      items: [],
      payment_method: null,
      unmatched_phrases: [],
      confidence: 0,
    };
  }

  // 1. Extract payment method
  const { payment_method, remainingText } = extractPaymentMethod(raw_transcript);

  // 2. Split into order clauses by conjunctions: "dan", "sama", "lalu", "terus", "serta", commas
  const clauses = remainingText
    .split(/\s+(?:dan|sama|lalu|terus|serta)\s+|[,;.\n]+/i)
    .map((c) => c.trim())
    .filter((c) => c.length > 0);

  const parsedItems: ParsedVoiceItem[] = [];
  const unmatched_phrases: string[] = [];

  for (const clause of clauses) {
    const { product, quantity, matchedBy, residualText } = matchProductInClause(clause, products);

    if (product) {
      // Check if product is already in parsedItems, aggregate quantity
      const existing = parsedItems.find((p) => p.product_id === product.id);
      if (existing) {
        existing.quantity += quantity;
        existing.subtotal = existing.quantity * existing.unit_price;
      } else {
        parsedItems.push({
          product_id: product.id,
          product_name: product.name,
          sku: product.sku,
          quantity,
          unit_price: product.selling_price,
          subtotal: quantity * product.selling_price,
          matched_by: matchedBy || 'name',
        });
      }

      if (residualText && residualText.length > 3) {
        // Any lingering unrecognized words
        const cleanResidual = cleanText(residualText);
        // ignore filler words like "tolong", "minta", "pesan", "nya"
        const filtered = cleanResidual
          .split(/\s+/)
          .filter((w) => !['tolong', 'minta', 'pesan', 'nya', 'porsi', 'gelas', 'cup', 'biji'].includes(w))
          .join(' ');
        if (filtered.length > 2) {
          unmatched_phrases.push(filtered);
        }
      }
    } else {
      unmatched_phrases.push(clause);
    }
  }

  // Calculate confidence score (0.0 to 1.0)
  let confidence = 0;
  if (parsedItems.length > 0) {
    const totalClauses = parsedItems.length + unmatched_phrases.length;
    confidence = Math.round((parsedItems.length / totalClauses) * 100) / 100;
  }

  return {
    raw_transcript,
    items: parsedItems,
    payment_method,
    unmatched_phrases,
    confidence,
  };
}
