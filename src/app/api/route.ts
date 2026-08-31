import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

/** GET /api — endpoint index (replaces the scaffold hello-world route) */
export async function GET() {
  return NextResponse.json({
    name: 'SehatAI API',
    description: 'Safety-first health guidance API for Pakistan (Alibaba Cloud Pakistan Hackathon).',
    endpoints: [
      { method: 'POST', path: '/api/chat', description: 'SSE streaming safety pipeline (L0 → L1 → RAG → L2 validation)' },
      { method: 'POST', path: '/api/voice/transcribe', description: 'Speech-to-text (ASR)' },
      { method: 'GET', path: '/api/facilities', description: 'Nearby health facilities (lat/lng/city/type/radiusKm)' },
      { method: 'GET|POST', path: '/api/reminders', description: 'Medicine / vaccine / ANC reminders' },
      { method: 'PUT|DELETE', path: '/api/reminders/[id]', description: 'Update or delete a reminder' },
      { method: 'POST', path: '/api/summary', description: 'Doctor handover summary for a conversation' },
      { method: 'POST', path: '/api/feedback', description: 'Rate an assistant message' },
      { method: 'GET', path: '/api/knowledge/manifest', description: 'Offline pack manifest' },
      { method: 'GET', path: '/api/knowledge/pack', description: 'Full verified knowledge pack' },
      { method: 'POST', path: '/api/eval/run', description: 'Start eval harness run (golden set, background)' },
      { method: 'GET', path: '/api/eval/results', description: 'Eval runs + latest results' },
      { method: 'GET', path: '/api/health', description: 'Service heartbeat' },
    ],
  });
}
