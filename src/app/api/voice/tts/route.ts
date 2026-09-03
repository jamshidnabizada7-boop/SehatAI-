// SehatAI — Phase 2: XTTS Urdu TTS API endpoint
// POST /api/voice/tts { text, language } → { audio (base64) }
// Uses XTTS-v2 for Urdu voice synthesis
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  let body: { text?: string; language?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const text = body.text;
  if (!text) {
    return NextResponse.json({ error: 'text is required' }, { status: 400 });
  }

  // In production, this would call XTTS-v2:
  // const audioBuffer = await generateSpeech(text, { language: 'ur', voice: 'urdu-female' });
  // const audioBase64 = audioBuffer.toString('base64');
  //
  // For now, return a placeholder

  return NextResponse.json({
    audio: '', // Would contain base64 audio
    duration: 0,
    language: body.language || 'ur',
    note: 'XTTS-v2 model not deployed. Deploy XTTS-v2 with Urdu voice to enable TTS.',
    ready: false,
  });
}

export async function GET() {
  return NextResponse.json({
    service: 'SehatAI Voice TTS API',
    description: 'Text-to-speech using XTTS-v2 Urdu voice',
    status: 'pending_deployment',
    model: 'XTTS-v2 with Urdu voice',
    cachedPhrases: '50 pre-cached Urdu medical phrase MP3s for offline use',
    endpoint: 'POST /api/voice/tts { text: string, language: "ur" }',
  });
}
