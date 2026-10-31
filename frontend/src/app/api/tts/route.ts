import { NextRequest } from 'next/server';
import { createHash } from 'crypto';
import { z } from 'zod';
import { apiError, handleApiError } from '@/lib/api-response';
import { createClient } from '@/lib/supabase/server';
import { isRateLimited } from '@/server/assistant/rate-limit';
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';

export const dynamic = 'force-dynamic';

/**
 * Neural TTS endpoint (Microsoft Edge voices — free, no API key).
 * Used by the Morning Briefing player; the browser's Web Speech API remains
 * the client-side fallback when this endpoint is unreachable.
 *
 * Voice via TTS_VOICE env (default: id-ID-ArdiNeural).
 */

const ttsRequestSchema = z
  .object({
    text: z.string().trim().min(1, 'Teks tidak boleh kosong').max(2000, 'Teks maksimal 2000 karakter'),
  })
  .strict();

const TTS_VOICE = process.env.TTS_VOICE || 'id-ID-ArdiNeural';
const MAX_CACHE_ENTRIES = 100;

// In-memory cache keyed by voice+text hash: replays skip re-synthesis.
// Per-instance only (resets on deploy) — acceptable for briefing replay.
const cache = new Map<string, Buffer>();

async function synthesize(text: string): Promise<Buffer> {
  const hash = createHash('sha1').update(`${TTS_VOICE}:${text}`).digest('hex');
  const cached = cache.get(hash);
  if (cached) return cached;

  const tts = new MsEdgeTTS({ enableLogger: false });
  try {
    await tts.setMetadata(TTS_VOICE, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
    const { audioStream } = tts.toStream(text);

    const chunks: Buffer[] = [];
    for await (const chunk of audioStream) {
      chunks.push(chunk as Buffer);
    }
    const audio = Buffer.concat(chunks);
    if (audio.length === 0) {
      throw new Error('TTS_EMPTY_AUDIO');
    }

    if (cache.size >= MAX_CACHE_ENTRIES) {
      const oldest = Array.from(cache.keys())[0];
      cache.delete(oldest);
    }
    cache.set(hash, audio);
    return audio;
  } finally {
    tts.close();
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authenticated users only — the endpoint is a free proxy to Microsoft
    // and must not be open to anonymous abuse.
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return apiError('UNAUTHENTICATED', 'Silakan masuk terlebih dahulu.', 401);
    }
    if (isRateLimited(user.id)) {
      return apiError('RATE_LIMITED', 'Terlalu banyak permintaan suara. Tunggu sebentar.', 429);
    }

    const json = await request.json().catch(() => null);
    const parsed = ttsRequestSchema.safeParse(json);
    if (!parsed.success) {
      return apiError('VALIDATION_ERROR', 'Teks suara tidak valid (1–2000 karakter).', 400);
    }

    const audio = await synthesize(parsed.data.text);
    return new Response(new Uint8Array(audio), {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch (error) {
    console.error('TTS synthesis failed:', error);
    return handleApiError(error);
  }
}
