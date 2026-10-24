import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { buildDoctorSummary, SUMMARY_INSUFFICIENT } from '@/lib/doctor-summary';
import { canReadConversation } from '@/server/conversation-access';
import type { Lang } from '@/lib/types';

export const runtime = 'nodejs';

/** Saved summary: no external model transmission, no inference from assistant metadata. */
export async function POST(req: NextRequest) {
  let body: { conversationId?: unknown; language?: unknown; sessionId?: unknown };
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }); }
  const conversationId = typeof body.conversationId === 'string' ? body.conversationId.trim() : '';
  if (!conversationId) return NextResponse.json({ error: 'conversationId is required' }, { status: 400 });
  const lang: Lang = ['en', 'ur', 'roman'].includes(String(body.language)) ? body.language as Lang : 'en';
  try {
    const conv = await db.conversation.findUnique({ where: { id: conversationId } });
    const guestId = typeof body.sessionId === 'string' ? body.sessionId : '';
    if (!conv || !await canReadConversation(conv, guestId)) return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    const messages = await db.message.findMany({ where: { conversationId }, orderBy: { createdAt: 'asc' } });
    const summary = buildDoctorSummary(conversationId, messages, lang);
    if (!summary) return NextResponse.json({ error: SUMMARY_INSUFFICIENT[lang], code: 'INSUFFICIENT_MEDICAL_INFORMATION' }, { status: 422 });
    return NextResponse.json({ summary }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    const status = (error as { status?: number }).status;
    return NextResponse.json({ error: 'Summary is unavailable. You can create a local summary from the open conversation.' }, { status: status === 401 || status === 403 ? status : 503 });
  }
}
