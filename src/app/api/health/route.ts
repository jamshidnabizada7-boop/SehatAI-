import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { CORPUS } from '@/data/corpus';
import { RED_FLAG_PATTERNS } from '@/data/lexicon';

export const runtime = 'nodejs';

/** GET /api/health — service + data layer heartbeat */
export async function GET() {
  let dbStatus = 'connected';
  try {
    await db.facility.count();
  } catch {
    dbStatus = 'error';
  }
  return NextResponse.json({
    status: dbStatus === 'connected' ? 'ok' : 'degraded',
    db: dbStatus,
    corpus: CORPUS.length,
    lexicon: RED_FLAG_PATTERNS.length,
    time: new Date().toISOString(),
  });
}
