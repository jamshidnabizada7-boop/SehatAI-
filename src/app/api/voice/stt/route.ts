// SehatAI — Phase 2: Whisper-ur STT API endpoint
// POST /api/voice/stt { audio (base64) } → { text, confidence, language }
// Uses faster-whisper via CLI (or falls back to browser SpeechRecognition)
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  let body: { audio?: string; language?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const audioBase64 = body.audio;
  if (!audioBase64) {
    return NextResponse.json({ error: 'audio (base64) is required' }, { status: 400 });
  }

  // In production, this would call faster-whisper CLI:
  // const buffer = Buffer.from(audioBase64, 'base64');
  // const result = await execFasterWhisper(buffer, { language: 'ur' });
  //
  // For now, return a placeholder indicating the API structure is ready
  // but the model needs to be deployed server-side.

  return NextResponse.json({
    text: '', // Would contain transcribed text
    confidence: 0,
    language: body.language || 'ur',
    note: 'Whisper-ur model not deployed. Deploy faster-whisper with Urdu fine-tune to enable STT.',
    ready: false,
  });
}

export async function GET() {
  return NextResponse.json({
    service: 'SehatAI Voice STT API',
    description: 'Speech-to-text using Whisper-ur fine-tune',
    status: 'pending_deployment',
    model: 'faster-whisper large-v3 with Urdu fine-tune',
    targetWER: '~18%',
    endpoint: 'POST /api/voice/stt { audio: base64, language: "ur" }',
    safetyNote: 'When confidence < 0.7 OR drug/dose term detected, a confirmation prompt is shown before processing.',
  });
}
