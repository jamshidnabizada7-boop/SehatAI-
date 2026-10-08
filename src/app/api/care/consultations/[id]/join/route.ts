// Care Connect §26 — join audio/video call (short-lived signed room token).
import { NextRequest, NextResponse } from 'next/server';
import { authorizeConsultationAccess, CareAuthzError } from '@/lib/care/care-auth';
import { joinCall, ConsultationError } from '@/server/care/video-service';
import { rateLimit, RATE_LIMITS } from '@/lib/care/rate-limit';
export const runtime = 'nodejs';

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { access } = await authorizeConsultationAccess(id, 'call.token');
    if (access.kind !== 'participant') return NextResponse.json({ error: 'REQUIRES_PARTICIPANT' }, { status: 403 });
    const rl = await rateLimit(`care-call:${access.session.id}`, RATE_LIMITS.videoToken.limit, RATE_LIMITS.videoToken.windowSeconds);
    if (!rl.allowed) return NextResponse.json({ error: 'RATE_LIMITED' }, { status: 429 });

    const { call, token } = await joinCall({
      consultationId: id,
      userId: access.session.id,
      role: access.role,
    });
    return NextResponse.json({
      callId: call.id,
      roomId: token.roomId,
      provider: token.provider,
      token: token.token,
      expiresAt: token.expiresAt,
      signalingUrl: token.signalingUrl,
      iceServers: token.iceServers,
      recording: token.recording,
    });
  } catch (e) {
    if (e instanceof CareAuthzError) return NextResponse.json({ error: e.message }, { status: e.status });
    if (e instanceof ConsultationError) return NextResponse.json({ error: e.code }, { status: e.status });
    return NextResponse.json({ error: 'ERROR' }, { status: 500 });
  }
}
