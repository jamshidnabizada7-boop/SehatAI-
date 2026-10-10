// SehatAI — Video Call API
// GET /api/video-call?appointmentId=xxx → get room info + check if call is active
// POST /api/video-call { appointmentId, action: 'start' | 'end' } → start/end a video call
//
// The signaling server runs on port 3004. The room ID is derived from the
// appointment ID so both doctor and patient join the same room.
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { liveKitConfigured, generateLiveKitToken } from '@/server/care/video-service';

export const runtime = 'nodejs';

const SIGNAL_PORT = 3004;

export async function GET(req: NextRequest) {
  let user;
  try { user = await requireUser(); } catch (e: any) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: e.status ?? 401 });
  }
  const url = new URL(req.url);
  const appointmentId = url.searchParams.get('appointmentId');
  if (!appointmentId) return NextResponse.json({ error: 'appointmentId is required' }, { status: 400 });

  // Verify the user is part of this appointment
  const appt = await db.appointment.findUnique({ where: { id: appointmentId } });
  if (!appt) return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });

  // Check if user is the patient or the doctor
  const isPatient = appt.patientId === user.id;
  const doctorProfile = await db.doctorProfile.findUnique({ where: { userId: user.id } });
  const isDoctor = doctorProfile && appt.doctorProfileId === doctorProfile.id;
  if (!isPatient && !isDoctor) {
    return NextResponse.json({ error: 'Not authorized for this appointment' }, { status: 403 });
  }

  const role = isDoctor ? 'DOCTOR' : 'PATIENT';
  const roomId = `appt-${appointmentId}`;
  let liveKitToken: string | null = null;
  let liveKitUrl: string | null = null;

  if (liveKitConfigured() && process.env.CARE_VIDEO_PROVIDER === 'livekit') {
    liveKitUrl = process.env.LIVEKIT_URL ?? null;
    liveKitToken = generateLiveKitToken({
      roomId,
      userId: user.id,
      role,
      consultationId: appointmentId,
      apiKey: process.env.LIVEKIT_API_KEY!,
      apiSecret: process.env.LIVEKIT_API_SECRET!,
    });
  }

  return NextResponse.json({
    roomId,
    signalPort: SIGNAL_PORT,
    role: isDoctor ? 'doctor' : 'patient',
    appointmentStatus: appt.status,
    provider: liveKitToken ? 'livekit' : 'webrtc-local',
    token: liveKitToken,
    signalingUrl: liveKitUrl,
  });
}

export async function POST(req: NextRequest) {
  let user;
  try { user = await requireUser(); } catch (e: any) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: e.status ?? 401 });
  }
  let body: { appointmentId?: string; action?: string };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const appointmentId = body.appointmentId ?? '';
  const action = body.action === 'end' ? 'end' : 'start';
  if (!appointmentId) return NextResponse.json({ error: 'appointmentId is required' }, { status: 400 });

  const appt = await db.appointment.findUnique({ where: { id: appointmentId } });
  if (!appt) return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });

  // Verify authorization
  const isPatient = appt.patientId === user.id;
  const doctorProfile = await db.doctorProfile.findUnique({ where: { userId: user.id } });
  const isDoctor = doctorProfile && appt.doctorProfileId === doctorProfile.id;
  if (!isPatient && !isDoctor) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  // Only allow calls for confirmed appointments
  if (appt.status !== 'confirmed') {
    return NextResponse.json({ error: `Appointment must be confirmed to start a call (current: ${appt.status})` }, { status: 400 });
  }

  await db.auditLog.create({
    data: {
      userId: user.id,
      action: action === 'start' ? 'video.call.started' : 'video.call.ended',
      resource: appointmentId,
      meta: JSON.stringify({ roomId: `appt-${appointmentId}` }),
    },
  });

  let liveKitToken: string | null = null;
  let liveKitUrl: string | null = null;
  if (liveKitConfigured() && process.env.CARE_VIDEO_PROVIDER === 'livekit') {
    liveKitUrl = process.env.LIVEKIT_URL ?? null;
    liveKitToken = generateLiveKitToken({
      roomId: `appt-${appointmentId}`,
      userId: user.id,
      role: isDoctor ? 'DOCTOR' : 'PATIENT',
      consultationId: appointmentId,
      apiKey: process.env.LIVEKIT_API_KEY!,
      apiSecret: process.env.LIVEKIT_API_SECRET!,
    });
  }

  return NextResponse.json({
    ok: true,
    roomId: `appt-${appointmentId}`,
    signalPort: SIGNAL_PORT,
    action,
    provider: liveKitToken ? 'livekit' : 'webrtc-local',
    token: liveKitToken,
    signalingUrl: liveKitUrl,
  });
}
