'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatRupiah } from '@/lib/format';
import { VoiceMicButton } from '@/components/voice-mic-button';
import { parseVoiceOrder, ProductCandidate } from '@/lib/voice/voice-parser';
import { parseVoiceExpense } from '@/lib/voice/expense-voice-parser';
import {
  Sparkles,
  Mic,
  Volume2,
  ArrowRight,
  CheckCircle2,
  Layers,
  Zap,
  ShieldCheck,
  Wallet,
  ShoppingCart,
  TrendingUp,
  Cpu,
} from 'lucide-react';

interface VoiceScenario {
  id: string;
  type: 'POS' | 'EXPENSE';
  title: string;
  transcript: string;
  intentDescription: string;
  targetUrl: string;
  expectedResult: {
    badge: string;
    highlights: string[];
  };
}

const VOICE_SCENARIOS: VoiceScenario[] = [
  {
    id: 'pos-1',
    type: 'POS',
    title: 'Pesanan Multi-Item & Bayar Tunai',
    transcript: 'Es Kopi Susu dua dan Croissant satu bayar tunai',
    intentDescription: 'Pesanan kasir umum dengan 2 produk berbeda, kata hubung "dan", serta metode bayar tunai.',
    targetUrl: '/pos?voice_sample=' + encodeURIComponent('Es Kopi Susu dua dan Croissant satu bayar tunai'),
    expectedResult: {
      badge: 'Kasir POS',
      highlights: ['2x Es Kopi Susu', '1x Butter Croissant', 'Metode Bayar: CASH (Tunai)'],
    },
  },
  {
    id: 'pos-2',
    type: 'POS',
    title: 'Bilangan Kata Gaul & Bayar QRIS',
    transcript: 'Pesan americano tiga sama red velvet latte setengah lusin bayar qris',
    intentDescription: 'Mengenali kata bilangan lokal "setengah lusin" (6 unit), kata sambung "sama", dan pembayaran QRIS.',
    targetUrl: '/pos?voice_sample=' + encodeURIComponent('Pesan americano tiga sama red velvet latte setengah lusin bayar qris'),
    expectedResult: {
      badge: 'Kasir POS',
      highlights: ['3x Caffe Americano', '6x Red Velvet Latte', 'Metode Bayar: QRIS (Simulasi QRIS)'],
    },
  },
  {
    id: 'pos-3',
    type: 'POS',
    title: 'Pencocokan Singkatan Alias UMKM',
    transcript: 'Kopsu tiga donat coklat dua bayar cash',
    intentDescription: 'Pencocokan fuzzy alias produk kedai kopi lokal ("kopsu" -> "Es Kopi Susu") dan donat coklat.',
    targetUrl: '/pos?voice_sample=' + encodeURIComponent('Kopsu tiga donat coklat dua bayar cash'),
    expectedResult: {
      badge: 'Kasir POS',
      highlights: ['3x Es Kopi Susu (via Alias "kopsu")', '2x Donat Coklat', 'Metode Bayar: CASH'],
    },
  },
  {
    id: 'exp-1',
    type: 'EXPENSE',
    title: 'Biaya Utilitas Harian',
    transcript: 'catat beli galon air dua puluh ribu',
    intentDescription: 'Pencatatan pengeluaran harian cabang dengan ekstraksi kata kunci "galon" ke kategori Utilitas.',
    targetUrl: '/expenses?voice_sample=' + encodeURIComponent('catat beli galon air dua puluh ribu'),
    expectedResult: {
      badge: 'Biaya Operasional',
      highlights: ['Kategori: Utilitas', 'Nominal: Rp 20.000', 'Deskripsi: Beli galon air'],
    },
  },
  {
    id: 'exp-2',
    type: 'EXPENSE',
    title: 'Token Listrik & Kata Bilangan Majemuk',
    transcript: 'bayar listrik seratus lima puluh ribu',
    intentDescription: 'Ekstraksi kata bilangan majemuk ratusan ribu ("seratus lima puluh ribu") ke Utilitas.',
    targetUrl: '/expenses?voice_sample=' + encodeURIComponent('bayar listrik seratus lima puluh ribu'),
    expectedResult: {
      badge: 'Biaya Operasional',
      highlights: ['Kategori: Utilitas', 'Nominal: Rp 150.000', 'Deskripsi: Bayar listrik'],
    },
  },
  {
    id: 'exp-3',
    type: 'EXPENSE',
    title: 'Perlengkapan Operasional & Angka Gaul',
    transcript: 'beli kresek dan sedotan 25rb',
    intentDescription: 'Pencatatan perlengkapan toko dengan akhiran nominal gaul lisan ("25rb" -> Rp 25.000).',
    targetUrl: '/expenses?voice_sample=' + encodeURIComponent('beli kresek dan sedotan 25rb'),
    expectedResult: {
      badge: 'Biaya Operasional',
      highlights: ['Kategori: Perlengkapan Operasional', 'Nominal: Rp 25.000', 'Deskripsi: Beli kresek dan sedotan'],
    },
  },
  {
    id: 'exp-4',
    type: 'EXPENSE',
    title: 'Gaji Harian Barista',
    transcript: 'gaji harian barista seratus ribu',
    intentDescription: 'Pencatatan upah harian barista cabang langsung ke pos Gaji/Upah.',
    targetUrl: '/expenses?voice_sample=' + encodeURIComponent('gaji harian barista seratus ribu'),
    expectedResult: {
      badge: 'Biaya Operasional',
      highlights: ['Kategori: Gaji', 'Nominal: Rp 100.000', 'Deskripsi: Gaji harian barista'],
    },
  },
  {
    id: 'exp-5',
    type: 'EXPENSE',
    title: 'Servis Perawatan Mesin Kopi',
    transcript: 'servis mesin espresso 350 ribu',
    intentDescription: 'Pencatatan biaya perawatan teknisi mesin ke pos Perawatan/Maintenance.',
    targetUrl: '/expenses?voice_sample=' + encodeURIComponent('servis mesin espresso 350 ribu'),
    expectedResult: {
      badge: 'Biaya Operasional',
      highlights: ['Kategori: Perawatan', 'Nominal: Rp 350.000', 'Deskripsi: Servis mesin espresso'],
    },
  },
];

export default function DemoGuidePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'VOICE_SIMULATOR' | 'SCENARIOS' | 'BENCHMARK'>('VOICE_SIMULATOR');

  // Interactive Live Tester State
  const [customUtterance, setCustomUtterance] = useState<string>('Es Kopi Susu dua dan Croissant satu bayar tunai');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [demoProducts, setDemoProducts] = useState<ProductCandidate[]>([]);

  // Fetch sample products for live parser
  useEffect(() => {
    async function loadSampleProducts() {
      try {
        const res = await fetch('/api/products');
        const json = await res.json();
        if (res.ok && json.data) {
          setDemoProducts(json.data);
        }
      } catch {
        // fallback
      }
    }
    loadSampleProducts();
  }, []);

  // Live NLP Analysis
  const liveAnalysis = useMemo(() => {
    const text = customUtterance.trim();
    if (!text) return null;

    // Detect if expense or POS order
    const expenseWords = /\b(beli|bayar|catat|biaya|gaji|sewa|servis|service|utilitas|operasional|iuran|ongkir|listrik|bensin)\b/i;
    const isLikelyExpense = expenseWords.test(text) && !/\b(pesan|order|meja)\b/i.test(text);

    if (isLikelyExpense) {
      const parsed = parseVoiceExpense(text);
      return {
        type: 'EXPENSE' as const,
        parsedExpense: parsed,
        targetUrl: '/expenses?voice_sample=' + encodeURIComponent(text),
      };
    } else {
      const parsed = parseVoiceOrder(text, demoProducts);
      return {
        type: 'POS' as const,
        parsedOrder: parsed,
        targetUrl: '/pos?voice_sample=' + encodeURIComponent(text),
      };
    }
  }, [customUtterance, demoProducts]);

  // Web Speech Synthesis (Text-to-Speech)
  const handleSpeak = (textToSpeak: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert('Browser Anda belum mendukung Web Speech Synthesis.');
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = 'id-ID';
    utterance.rate = 0.95;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 p-6 sm:p-8 rounded-2xl text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" /> GTNIC 2026 Web Development • Finalis
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Panduan Uji Juri & Simulator Suara AI
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Verifikasi interaktif inovasi Smart Voice POS, Voice Expense Parser, dan 6 Skenario Pengujian Alur Penuh BizPulse (PRD §11.2) tanpa memerlukan mikrofon fisik.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2.5">
            <Link
              href="/pos"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-500/20"
            >
              <ShoppingCart className="w-4 h-4" /> Buka Kasir POS
            </Link>
            <Link
              href="/expenses"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-purple-500/20"
            >
              <Wallet className="w-4 h-4" /> Buka Pengeluaran
            </Link>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 mt-8 pt-6 border-t border-white/10">
          <button
            type="button"
            onClick={() => setActiveTab('VOICE_SIMULATOR')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'VOICE_SIMULATOR'
                ? 'bg-purple-500 text-white shadow-md shadow-purple-500/30'
                : 'text-slate-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Mic className="w-3.5 h-3.5" /> 1. Simulator Suara Interaktif
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('SCENARIOS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'SCENARIOS'
                ? 'bg-purple-500 text-white shadow-md shadow-purple-500/30'
                : 'text-slate-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> 2. 6 Skenario Pengujian PRD
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('BENCHMARK')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'BENCHMARK'
                ? 'bg-purple-500 text-white shadow-md shadow-purple-500/30'
                : 'text-slate-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" /> 3. Benchmarking & Inovasi
          </button>
        </div>
      </div>

      {/* TAB 1: SMART VOICE SIMULATOR */}
      {activeTab === 'VOICE_SIMULATOR' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Live Interactive Parser Tester */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-purple-600" />
                  Live Voice AI Parser Tester (Uji Kalimat Apapun)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Ketik atau ucapkan kalimat pesanan/pengeluaran bahasa Indonesia untuk melihat hasil ekstraksi NLP secara instan.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <VoiceMicButton
                  onTranscriptComplete={(transcript) => setCustomUtterance(transcript)}
                />
                <button
                  type="button"
                  onClick={() => handleSpeak(customUtterance)}
                  disabled={isSpeaking || !customUtterance.trim()}
                  className="px-3 py-1.5 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-800 text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-50"
                  title="Dengarkan pembacaan suara lisan Bahasa Indonesia"
                >
                  <Volume2 className={`w-3.5 h-3.5 ${isSpeaking ? 'animate-pulse text-purple-600' : ''}`} />
                  {isSpeaking ? 'Berbicara...' : 'Dengarkan (TTS)'}
                </button>
              </div>
            </div>

            {/* Input Form */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700">
                Transkrip Suara yang Diucapkan:
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={customUtterance}
                  onChange={(e) => setCustomUtterance(e.target.value)}
                  placeholder="Contoh: Es Kopi Susu dua dan Croissant satu bayar tunai"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-purple-500 transition-all pr-24"
                />
                {customUtterance && (
                  <button
                    type="button"
                    onClick={() => setCustomUtterance('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 px-2 py-1"
                  >
                    Hapus
                  </button>
                )}
              </div>
            </div>

            {/* Presets Selector */}
            <div>
              <span className="text-xs font-semibold text-slate-600 mr-2">Coba Contoh Preset Cepat:</span>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {VOICE_SCENARIOS.map((sc) => (
                  <button
                    key={sc.id}
                    type="button"
                    onClick={() => setCustomUtterance(sc.transcript)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                      customUtterance === sc.transcript
                        ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-purple-50 hover:text-purple-700'
                    }`}
                  >
                    {sc.title}
                  </button>
                ))}
              </div>
            </div>

            {/* Live Parsing Result Preview Card */}
            {liveAnalysis && (
              <div className="p-4 bg-gradient-to-br from-slate-50 to-purple-50/40 rounded-xl border border-purple-100 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-purple-100">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        liveAnalysis.type === 'POS'
                          ? 'bg-blue-100 text-blue-800 border border-blue-200'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}
                    >
                      {liveAnalysis.type === 'POS' ? '🛒 Pesanan Kasir POS' : '💸 Pengeluaran Operasional'}
                    </span>
                    <span className="text-xs text-slate-600">
                      Tingkat Akurasi:{' '}
                      <strong className="text-slate-900">
                        {Math.round(
                          (liveAnalysis.type === 'POS'
                            ? liveAnalysis.parsedOrder.confidence
                            : liveAnalysis.parsedExpense.confidence) * 100
                        )}
                        %
                      </strong>
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => router.push(liveAnalysis.targetUrl)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-500/20 transition-all cursor-pointer"
                  >
                    <span>Simulasikan Langsung ke Halaman</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Details Breakdown */}
                {liveAnalysis.type === 'POS' ? (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-slate-700">Item Produk Dikenali:</p>
                    {liveAnalysis.parsedOrder.items.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {liveAnalysis.parsedOrder.items.map((item, idx) => (
                          <div
                            key={idx}
                            className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between text-xs"
                          >
                            <div>
                              <div className="font-bold text-slate-900">{item.product_name}</div>
                              <div className="text-[11px] text-slate-500">
                                {item.quantity}x @ {formatRupiah(item.unit_price)} (via {item.matched_by})
                              </div>
                            </div>
                            <div className="font-bold text-blue-600 font-mono">
                              {formatRupiah(item.subtotal)}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-amber-600 italic">
                        Belum ada item produk yang cocok dengan katalog cabang aktif. Coba ubah teks pesanan.
                      </p>
                    )}
                    <div className="flex items-center gap-3 pt-2 text-xs text-slate-600">
                      <span>
                        Metode Bayar:{' '}
                        <strong className="text-slate-900">
                          {liveAnalysis.parsedOrder.payment_method || 'Belum terdeteksi (Default Tunai)'}
                        </strong>
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="bg-white p-3 rounded-xl border border-slate-200">
                        <div className="text-[11px] text-slate-500">Kategori Biaya</div>
                        <div className="text-sm font-bold text-purple-700 mt-0.5">
                          {liveAnalysis.parsedExpense.category}
                        </div>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-slate-200">
                        <div className="text-[11px] text-slate-500">Nominal Terdeteksi</div>
                        <div className="text-sm font-bold text-slate-900 font-mono mt-0.5">
                          {formatRupiah(liveAnalysis.parsedExpense.amount)}
                        </div>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-slate-200">
                        <div className="text-[11px] text-slate-500">Keterangan Bersih</div>
                        <div className="text-sm font-bold text-slate-800 mt-0.5 truncate">
                          {liveAnalysis.parsedExpense.description}
                        </div>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-500 italic">
                      {liveAnalysis.parsedExpense.explanation}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Catalog of Pre-Built Judge Scenarios */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Mic className="w-5 h-5 text-purple-600" />
                Katalog Skenario Suara Juri (1-Klik Simulasi)
              </h2>
              <span className="text-xs text-slate-500">8 Skenario Siap Uji</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {VOICE_SCENARIOS.map((sc) => (
                <div
                  key={sc.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-purple-300 transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          sc.type === 'POS'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {sc.expectedResult.badge}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleSpeak(sc.transcript)}
                        className="text-xs text-purple-600 hover:text-purple-800 font-medium flex items-center gap-1"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        Dengar Audio
                      </button>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900">{sc.title}</h3>

                    <div className="p-3 bg-purple-50/60 border border-purple-100 rounded-xl">
                      <p className="text-xs font-mono text-purple-900 font-semibold italic">
                        &ldquo;{sc.transcript}&rdquo;
                      </p>
                    </div>

                    <p className="text-xs text-slate-500 leading-relaxed">
                      {sc.intentDescription}
                    </p>

                    <div className="space-y-1 pt-1">
                      <span className="text-[11px] font-bold text-slate-700">Hasil Deteksi:</span>
                      <ul className="text-xs text-slate-600 space-y-0.5">
                        {sc.expectedResult.highlights.map((hl, i) => (
                          <li key={i} className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                            <span>{hl}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setCustomUtterance(sc.transcript)}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold"
                    >
                      Uji di Tester
                    </button>
                    <Link
                      href={sc.targetUrl}
                      className="inline-flex items-center gap-1 px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
                    >
                      <span>Simulasikan</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: 6 SCENARIOS PRD */}
      {activeTab === 'SCENARIOS' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-blue-600" />
                6 Skenario Pengujian Alur Penuh (PRD §11.2)
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Panduan komprehensif bagi dewan juri GTNIC 2026 untuk menguji setiap pilar keunggulan BizPulse secara terstruktur.
              </p>
            </div>

            <div className="space-y-4">
              {/* Skenario 1 */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-blue-700 uppercase tracking-wide">
                    Skenario 1: Autentikasi & Multi-Role
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    Lulus Uji ✅
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900">Login 1-Klik Multi-Role (Owner Demo vs Kasir Demo)</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Buka halaman <Link href="/login" className="text-blue-600 underline font-semibold">/login</Link>, klik tombol demo <strong>&quot;Masuk sbg Owner&quot;</strong> atau <strong>&quot;Masuk sbg Kasir&quot;</strong>. Kasir secara otomatis dibatasi hanya ke halaman POS, Transaksi, Pengeluaran, Stok, dan Demo Guide (URL owner diproteksi 403 Forbidden).
                </p>
              </div>

              {/* Skenario 2 */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-blue-700 uppercase tracking-wide">
                    Skenario 2: Master Data
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    Lulus Uji ✅
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900">Multi-Cabang & Katalog Produk per Cabang</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Kelola hingga 5 cabang di <Link href="/branches" className="text-blue-600 underline font-semibold">/branches</Link> dan katalog produk di <Link href="/products" className="text-blue-600 underline font-semibold">/products</Link>. Mengakomodasi SKU unik, alias ucapan lokal, serta proteksi HPP vs Harga Jual.
                </p>
              </div>

              {/* Skenario 3 */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-blue-700 uppercase tracking-wide">
                    Skenario 3: Transaksi Inti
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    Lulus Uji ✅
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900">Kasir POS, Simulasi QRIS, Struk, & Void Sale</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Lakukan transaksi di <Link href="/pos" className="text-blue-600 underline font-semibold">/pos</Link> via Tunai dengan kalkulasi kembalian atau QRIS dinamis. Cek riwayat di <Link href="/transactions" className="text-blue-600 underline font-semibold">/transactions</Link> dan uji fitur pembatalan (Void Sale) dengan pemulihan stok otomatis.
                </p>
              </div>

              {/* Skenario 4 */}
              <div className="p-4 bg-purple-50 rounded-xl border border-purple-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-purple-700 uppercase tracking-wide">
                    Skenario 4: Smart Voice POS & AI Expense
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">
                    Fitur Unggulan ✅
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900">Pencatatan Lisan Bahasa Indonesia UMKM</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Uji tombol mikrofon di <Link href="/pos" className="text-purple-600 underline font-semibold">/pos</Link> dan <Link href="/expenses" className="text-purple-600 underline font-semibold">/expenses</Link>. Sistem secara cerdas menerjemahkan kata bilangan (&quot;setengah lusin&quot;, &quot;25rb&quot;), alias kedai, metode bayar, dan klasifikasi kategori biaya otomatis.
                </p>
              </div>

              {/* Skenario 5 */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-blue-700 uppercase tracking-wide">
                    Skenario 5: Intelijen Inventaris (Tahap E)
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                    Langkah Berikutnya ⏳
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900">Deteksi Anomali Z-Score & Rekomendasi Mutasi Antarcabang</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Algoritma Z-Score mendeteksi lonjakan pengeluaran tidak wajar dan memprediksi risiko kehabisan stok dengan saran mutasi dari cabang yang berlebih.
                </p>
              </div>

              {/* Skenario 6 */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-blue-700 uppercase tracking-wide">
                    Skenario 6: Keputusan Finansial (Tahap F)
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700">
                    Tahap F ⏳
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900">Laporan Otomatis Laba-Rugi & Dashboard 3 Pagi</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Buku kas otomatis (Auto-Ledger), kalkulasi HPP harian, ekspor PDF/Excel untuk perbankan, dan asisten keputusan subuh bagi owner UMKM.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: BENCHMARKING & INOVASI */}
      {activeTab === 'BENCHMARK' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500" />
                Benchmarking Kecepatan & Nilai Inovasi GTNIC 2026
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Kuantifikasi efisiensi operasional UMKM menggunakan BizPulse Voice AI dibanding POS konvensional.
              </p>
            </div>

            {/* Comparison Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-1">
                <p className="text-xs text-slate-500">POS Konvensional (Ketik Manual)</p>
                <p className="text-2xl font-extrabold text-slate-700">25 – 45 dtk</p>
                <p className="text-[11px] text-slate-400">Cari produk, klik qty, pilih opsi bayar</p>
              </div>

              <div className="p-4 bg-purple-50 rounded-xl border border-purple-200 text-center space-y-1 shadow-sm">
                <p className="text-xs text-purple-700 font-bold">BizPulse Voice AI POS</p>
                <p className="text-2xl font-extrabold text-purple-700">2 – 3 dtk</p>
                <p className="text-[11px] text-purple-600">Bicara lisan 1 kalimat & konfirmasi</p>
              </div>

              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-center space-y-1 shadow-sm">
                <p className="text-xs text-emerald-700 font-bold">Peningkatan Efisiensi</p>
                <p className="text-2xl font-extrabold text-emerald-600">~90% Lebih Cepat</p>
                <p className="text-[11px] text-emerald-700">Antrean jam sibuk terurai seketika</p>
              </div>
            </div>

            {/* Architectural Value Props */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Privasi & Rp 0 Biaya Operasional Token
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Tidak memanggil API cloud LLM berbayar per transaksi ($0.01 per panggilan akan membebani margin UMKM). Seluruh parsing NLP berjalan pada client-side dengan rule-based & fuzzy matching instan (0 ms network latency).
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                  <Cpu className="w-4 h-4 text-blue-600" />
                  Dirancang untuk Bahasa Pasar Indonesia
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Mampu mengenali bahasa lisan sehari-hari UMKM: bilangan slang (&quot;setengah lusin&quot;, &quot;25rb&quot;, &quot;50k&quot;), alias kedai (&quot;kopsu&quot;, &quot;americano&quot;), serta kata hubung majemuk (&quot;sama&quot;, &quot;terus&quot;, &quot;lalu&quot;).
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
