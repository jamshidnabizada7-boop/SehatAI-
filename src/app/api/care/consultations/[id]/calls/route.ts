// Care Connect §28 — call state reporting (fallback ladder VIDEO→AUDIO→TEXT).
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authorizeConsultationAccess, CareAuthzError } from '@/lib/care/care-auth';
import { reportCallState, ConsultationError } from '@/server/care/video-service';
export const runtime = 'nodejs';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { access } = await authorizeConsultationAccess(id, 'call.token');
    if (access.kind !== 'participant') return NextResponse.json({ error: 'REQUIRES_PARTICIPANT' }, { status: 403 });
    const body = await req.json();
    const callId = String(body.callId ?? '');
    const call = await db.consultationCall.findUnique({ where: { id: callId }, select: { consultationId: true } });
    if (!call || call.consultationId !== id) return NextResponse.json({ error: 'CALL_NOT_FOUND' }, { status: 404 });

    const updated = await reportCallState({
      callId,
      userId: access.session.id,
      state: (['ACTIVE', 'ENDED', 'FAILED', 'FELL_BACK'].includes(body.state) ? body.state : 'FAILED') as 'ACTIVE' | 'ENDED' | 'FAILED' | 'FELL_BACK',
      fallbackTo: body.fallbackTo === 'AUDIO' || body.fallbackTo === 'TEXT' ? body.fallbackTo : undefined,
      reason: body.reason ? String(body.reason).slice(0, 300) : undefined,
      qualityEvents: typeof body.qualityEvents === 'object' && body.qualityEvents != null ? body.qualityEvents : undefined,
    });
    return NextResponse.json({ call: { id: updated.id, state: updated.state, fallbackTo: updated.fallbackTo } });
  } catch (e) {
    if (e instanceof CareAuthzError) return NextResponse.json({ error: e.message }, { status: e.status });
    if (e instanceof ConsultationError) return NextResponse.json({ error: e.code }, { status: e.status });
    return NextResponse.json({ error: 'ERROR' }, { status: 500 });
  }
}
