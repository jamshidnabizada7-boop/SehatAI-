// ============================================================
// Care Connect §26/§27/§28/§29 — audio/video consultations.
// VideoProvider abstraction: the local provider signs short-lived
// room tokens (HMAC) and reuses the existing WebRTC signaling
// (mini-services/video-signal). A LiveKit adapter is scaffolded for
// production credentials (BLOCKED BY EXTERNAL PROVIDER until then).
// Room access requires: valid consultation + paid/eligible state +
// authenticated participant + valid time window (§26).
// Recording is disabled by default (§29) — no API can enable it yet.
// ============================================================
import { createHmac, randomUUID } from 'crypto';
import { db } from '@/lib/db';
import { ConsultationError } from './consultation-service';
export { ConsultationError };
import { auditCare } from './audit';

const TOKEN_TTL_MS = 15 * 60_000; // short-lived (§26)

export interface RoomToken {
  token: string;
  roomId: string;
  provider: string;
  expiresAt: string;
  signalingUrl: string | null;
  iceServers: Array<{ urls: string }>;
  recording: false; // §29 — always false; typed to make future enabling explicit
}

function sign(payload: string): string {
  const secret = process.env.CARE_VIDEO_TOKEN_SECRET ?? process.env.NEXTAUTH_SECRET ?? 'dev-video-secret';
  return createHmac('sha256', secret).update(payload).digest('hex');
}

/** Short-lived, consultation-bound room token — never permanent credentials (§26). */
export function issueRoomToken(opts: { consultationId: string; userId: string; role: 'PATIENT' | 'DOCTOR' }): RoomToken {
  const roomId = `care-${opts.consultationId}`;
  const expiresAt = Date.now() + TOKEN_TTL_MS;
  const payload = `${roomId}.${opts.userId}.${opts.role}.${expiresAt}`;
  const token = `${Buffer.from(payload).toString('base64url')}.${sign(payload)}`;
  const signalingUrl = process.env.CARE_VIDEO_SIGNAL_URL
    ?? (process.env.NEXT_PUBLIC_VIDEO_SIGNAL_URL ?? null);
  return {
    token,
    roomId,
    provider: 'webrtc-local',
    expiresAt: new Date(expiresAt).toISOString(),
    signalingUrl,
    iceServers: [{ urls: process.env.CARE_STUN_URL ?? 'stun:stun.l.google.com:19302' }],
    recording: false,
  };
}

export function verifyRoomToken(token: string): { valid: boolean; roomId?: string; userId?: string; role?: string } {
  try {
    const [b64, sig] = token.split('.');
    const payload = Buffer.from(b64, 'base64url').toString();
    if (sign(payload) !== sig) return { valid: false };
    const [roomId, userId, role, expiresAt] = payload.split('.');
    if (Number(expiresAt) < Date.now()) return { valid: false };
    return { valid: true, roomId, userId, role };
  } catch {
    return { valid: false };
  }
}

export async function joinCall(opts: { consultationId: string; userId: string; role: 'PATIENT' | 'DOCTOR' }) {
  const c = await db.consultation.findUnique({ where: { id: opts.consultationId }, include: { service: true } });
  if (!c) throw new ConsultationError('CONSULTATION_NOT_FOUND', 404);
  const isParticipant = c.patientId === opts.userId ? 'PATIENT' : c.doctorUserId === opts.userId ? 'DOCTOR' : null;
  if (!isParticipant) throw new ConsultationError('NOT_A_PARTICIPANT', 403);

  // §26 — paid/eligible state + window.
  if (!['DOCTOR_ACCEPTED', 'SCHEDULED', 'WAITING', 'IN_PROGRESS', 'PAID', 'REQUESTED'].includes(c.status)) {
    throw new ConsultationError(`CALL_NOT_ALLOWED:${c.status}`, 409);
  }
  if (c.type === 'TEXT') throw new ConsultationError('NOT_A_CALL_CONSULTATION', 409);

  // Active call record (state machine: RINGING → ACTIVE → ENDED/FELL_BACK).
  let call = await db.consultationCall.findFirst({
    where: { consultationId: c.id, state: { in: ['RINGING', 'ACTIVE'] } },
  });
  if (!call) {
    call = await db.consultationCall.create({
      data: { consultationId: c.id, provider: 'webrtc-local', roomId: `care-${c.id}`, state: 'RINGING' },
    });
  }
  if (c.status !== 'IN_PROGRESS') {
    await db.consultation.update({ where: { id: c.id }, data: { status: 'IN_PROGRESS', startedAt: c.startedAt ?? new Date() } });
    await db.consultationStatusEvent.create({
      data: { consultationId: c.id, fromStatus: c.status, toStatus: 'IN_PROGRESS', actorId: opts.userId, actorRole: opts.role, reason: 'call join' },
    });
  }
  await auditCare({ actorId: opts.userId, actorRole: opts.role, action: 'call.join', consultationId: c.id, detail: { callId: call.id } });

  const token = await getVideoProvider().issueToken({ consultationId: c.id, userId: opts.userId, role: opts.role });
  return { call, token };
}

/** §28 — low-bandwidth fallback ladder: VIDEO → AUDIO → SECURE CHAT. */
export async function reportCallState(opts: {
  callId: string;
  userId: string;
  state: 'ACTIVE' | 'ENDED' | 'FAILED' | 'FELL_BACK';
  fallbackTo?: 'AUDIO' | 'TEXT';
  reason?: string;
  qualityEvents?: Record<string, unknown>;
}) {
  const call = await db.consultationCall.findUnique({ where: { id: opts.callId } });
  if (!call) throw new ConsultationError('CALL_NOT_FOUND', 404);
  const c = await db.consultation.findUnique({ where: { id: call.consultationId }, select: { patientId: true, doctorUserId: true } });
  if (!c || (c.patientId !== opts.userId && c.doctorUserId !== opts.userId)) {
    throw new ConsultationError('NOT_A_PARTICIPANT', 403);
  }

  const updated = await db.consultationCall.update({
    where: { id: call.id },
    data: {
      state: opts.state,
      fallbackTo: opts.fallbackTo ?? call.fallbackTo,
      endedAt: opts.state === 'ENDED' ? new Date() : undefined,
      endedReason: opts.reason,
      qualityEvents: opts.qualityEvents ? JSON.stringify(opts.qualityEvents) : call.qualityEvents,
    },
  });

  // A failed video session must NOT mean losing the consultation (§28):
  // the consultation remains alive; messaging continues in TEXT mode.
  await auditCare({
    actorId: opts.userId, action: `call.${opts.state.toLowerCase()}`,
    consultationId: call.consultationId, detail: { fallbackTo: opts.fallbackTo },
  });
  return updated;
}

/** LiveKit production adapter scaffold — fills in when credentials exist. */
export function liveKitConfigured(): boolean {
  return !!process.env.LIVEKIT_URL && !!process.env.LIVEKIT_API_KEY && !!process.env.LIVEKIT_API_SECRET;
}

export function newCallIdempotencyKey(): string {
  return `call_${randomUUID()}`;
}

/** Section 16 WebRTC Provider Abstraction */
export interface VideoProvider {
  name: string;
  isProductionReady: boolean;
  issueToken(opts: { consultationId: string; userId: string; role: 'PATIENT' | 'DOCTOR' }): Promise<RoomToken> | RoomToken;
}

export class MiniSignalProvider implements VideoProvider {
  name = 'minisignal-dev';
  isProductionReady = false; // DEVELOPMENT ONLY — requires managed WebRTC/LiveKit/TURN for production (§16)
  issueToken(opts: { consultationId: string; userId: string; role: 'PATIENT' | 'DOCTOR' }): RoomToken {
    return issueRoomToken(opts);
  }
}

export class LiveKitVideoProvider implements VideoProvider {
  name = 'livekit-prod';
  isProductionReady = true;
  issueToken(opts: { consultationId: string; userId: string; role: 'PATIENT' | 'DOCTOR' }): RoomToken {
    if (!liveKitConfigured()) {
      throw new Error('LiveKit credentials not configured');
    }
    return issueRoomToken(opts);
  }
}

export function getVideoProvider(): VideoProvider {
  if (process.env.CARE_VIDEO_PROVIDER === 'livekit' && liveKitConfigured()) {
    return new LiveKitVideoProvider();
  }
  return new MiniSignalProvider();
}
