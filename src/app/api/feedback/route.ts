import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const runtime = 'nodejs';

/** POST /api/feedback {messageId, rating: 1|0, comment?} → {ok} */
export async function POST(req: NextRequest) {
  let body: { messageId?: unknown; rating?: unknown; comment?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const messageId = typeof body.messageId === 'string' ? body.messageId.trim() : '';
  const rating = body.rating === 1 || body.rating === 0 ? body.rating : null;
  const comment = typeof body.comment === 'string' ? body.comment.trim().slice(0, 1000) : null;

  if (!messageId) {
    return NextResponse.json({ error: 'messageId is required' }, { status: 400 });
  }
  if (rating === null) {
    return NextResponse.json({ error: 'rating must be 1 (helpful) or 0 (not helpful)' }, { status: 400 });
  }

  try {
    await db.feedback.create({ data: { messageId, rating, comment } });
    return NextResponse.json({ ok: true });
  } catch {
    // most likely a foreign-key violation (unknown messageId)
    return NextResponse.json({ ok: false, error: 'could not save feedback' }, { status: 400 });
  }
}
