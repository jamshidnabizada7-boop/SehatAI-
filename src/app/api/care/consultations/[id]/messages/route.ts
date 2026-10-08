// Care Connect §21 — consultation messages API.
// GET: participant (or audited staff) list with cursor.
// POST: send — window open + not read-only + participant + state ok.
import { NextRequest, NextResponse } from 'next/server';
import { authorizeConsultationAccess, CareAuthzError } from '@/lib/care/care-auth';
import { sendMessage, listMessages, markRead, correctMessage, ConsultationError } from '@/server/care/messaging-service';
import { rateLimit, RATE_LIMITS } from '@/lib/care/rate-limit';
export const runtime = 'nodejs';

function err(e: unknown) {
  if (e instanceof CareAuthzError) return NextResponse.json({ error: e.message }, { status: e.status });
  if (e instanceof ConsultationError) return NextResponse.json({ error: e.code }, { status: e.status });
  return NextResponse.json({ error: e instanceof Error ? e.message : 'ERROR' }, { status: 500 });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { access } = await authorizeConsultationAccess(id, 'consultation.view');
    const url = new URL(req.url);
    const viewerRole = access.kind === 'participant' ? access.role : 'STAFF';
    const messages = await listMessages({
      consultationId: id,
      viewerRole,
      before: url.searchParams.get('before') ?? undefined,
      limit: Number(url.searchParams.get('limit') ?? '50'),
    });
    if (access.kind === 'participant') await markRead({ consultationId: id, userId: access.session.id });
    return NextResponse.json({ messages, viewerRole });
  } catch (e) {
    return err(e);
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { access } = await authorizeConsultationAccess(id, 'consultation.message');
    if (access.kind !== 'participant') return NextResponse.json({ error: 'REQUIRES_PARTICIPANT' }, { status: 403 });

    const rl = await rateLimit(`care-msg:${access.session.id}`, RATE_LIMITS.chat.limit, RATE_LIMITS.chat.windowSeconds);
    if (!rl.allowed) return NextResponse.json({ error: 'RATE_LIMITED' }, { status: 429 });

    const body = await req.json();
    if (body.correctsMessageId) {
      const correction = await correctMessage({
        messageId: String(body.correctsMessageId),
        senderId: access.session.id,
        newBody: String(body.body ?? ''),
      });
      return NextResponse.json({ message: correction }, { status: 201 });
    }
    const message = await sendMessage({
      consultationId: id,
      senderId: access.session.id,
      senderRole: access.role,
      body: String(body.body ?? ''),
      language: body.language ? String(body.language) : undefined,
      kind: body.kind === 'voice' ? 'voice' : 'text',
    });
    return NextResponse.json({ message }, { status: 201 });
  } catch (e) {
    return err(e);
  }
}
