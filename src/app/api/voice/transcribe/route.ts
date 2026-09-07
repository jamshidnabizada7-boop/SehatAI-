import { NextRequest, NextResponse } from 'next/server';
import { getGroq } from '@/server/llm';
import { toFile } from 'groq-sdk';
import { detectLanguage } from '@/lib/engine/safety-engine';

export const runtime = 'nodejs';

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('asr timeout')), ms);
    promise.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (e) => {
        clearTimeout(timer);
        reject(e);
      },
    );
  });
}

/**
 * POST /api/voice/transcribe — {audioBase64, mimeType?} → {text, language}
 * Always answers 200; on failure returns {text:'', error} so the frontend
 * can show a toast instead of a hard failure.
 */
export async function POST(req: NextRequest) {
  let body: { audioBase64?: unknown; mimeType?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ text: '', error: 'transcription failed' });
  }

  let audioBase64 = typeof body.audioBase64 === 'string' ? body.audioBase64 : '';
  // strip data URL prefix if present (e.g. "data:audio/webm;codecs=opus;base64,")
  const commaIdx = audioBase64.indexOf(',');
  if (audioBase64.startsWith('data:') && commaIdx !== -1) {
    audioBase64 = audioBase64.slice(commaIdx + 1);
  }
  audioBase64 = audioBase64.replace(/\s/g, '');

  if (!audioBase64) {
    return NextResponse.json({ text: '', error: 'transcription failed — no audio data' });
  }

  try {
    const groq = getGroq();
    if (!groq) {
      return NextResponse.json({ text: '', error: 'transcription provider unavailable' });
    }

    const buffer = Buffer.from(audioBase64, 'base64');
    const mimeType = typeof body.mimeType === 'string' && body.mimeType ? body.mimeType : 'audio/webm';
    const ext = mimeType.includes('mp4') || mimeType.includes('m4a') ? 'm4a' : mimeType.includes('wav') ? 'wav' : 'webm';
    const file = await toFile(buffer, `audio.${ext}`, { type: mimeType });

    const resp = (await withTimeout(
      groq.audio.transcriptions.create({
        file,
        model: 'whisper-large-v3',
      }),
      45000,
    )) as { text?: string } | null;

    const text = typeof resp?.text === 'string' ? resp.text.trim() : '';
    if (!text) {
      return NextResponse.json({ text: '', error: 'transcription failed' });
    }
    return NextResponse.json({ text, language: detectLanguage(text).language });
  } catch {
    return NextResponse.json({ text: '', error: 'transcription failed' });
  }
}
