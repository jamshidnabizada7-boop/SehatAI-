// SehatAI — Patient Appointments API
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth';
export const runtime = 'nodejs';
export async function GET() {
  let user;
  try { user = await requireUser(); } catch (e: any) { return NextResponse.json({ error: 'Unauthorized' }, { status: e.status ?? 401 }); }
  const appts = await db.appointment.findMany({ where: { patientId: user.id }, include: { doctorProfile: { include: { user: { select: { name: true } } } } }, orderBy: { scheduledAt: 'asc' }, take: 50 });
  return NextResponse.json({ appointments: appts.map(a => ({ id: a.id, doctorProfileId: a.doctorProfileId, doctorName: a.doctorProfile.user.name ?? 'Unknown', doctorSpecialty: a.doctorProfile.specialty, doctorFacilityName: a.doctorProfile.facilityName, doctorFacilityCity: a.doctorProfile.facilityCity, scheduledAt: a.scheduledAt.toISOString(), reason: a.reason, status: a.status, doctorNotes: a.doctorNotes, createdAt: a.createdAt.toISOString() })) });
}
export async function POST(req: NextRequest) {
  let user;
  try { user = await requireUser(); } catch (e: any) { return NextResponse.json({ error: 'Unauthorized' }, { status: e.status ?? 401 }); }
  let body: { doctorProfileId?: string; scheduledAt?: string; reason?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }
  const doctorProfileId = body.doctorProfileId ?? '';
  const scheduledAt = new Date(body.scheduledAt ?? '');
  if (!doctorProfileId || Number.isNaN(scheduledAt.getTime())) return NextResponse.json({ error: 'doctorProfileId and valid scheduledAt are required' }, { status: 400 });
  if (scheduledAt.getTime() < Date.now() - 3600000) return NextResponse.json({ error: 'Cannot book in the past' }, { status: 400 });
  const doctor = await db.doctorProfile.findUnique({ where: { id: doctorProfileId }, include: { user: { select: { accountStatus: true } } } });
  if (!doctor || !doctor.pmdcVerifiedAt || doctor.user.accountStatus !== 'active') return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
  const conflict = await db.appointment.findFirst({ where: { doctorProfileId, scheduledAt, status: { in: ['requested', 'confirmed'] } } });
  if (conflict) return NextResponse.json({ error: 'Time slot already booked' }, { status: 409 });
  const appt = await db.appointment.create({ data: { doctorProfileId, patientId: user.id, scheduledAt, reason: body.reason ?? null } });
  await db.auditLog.create({ data: { userId: user.id, action: 'patient.appointment.requested', resource: appt.id, meta: JSON.stringify({ doctorProfileId, scheduledAt: scheduledAt.toISOString() }) } });
  return NextResponse.json({ ok: true, appointmentId: appt.id, status: 'requested' });
}
export async function PATCH(req: NextRequest) {
  let user;
  try { user = await requireUser(); } catch (e: any) { return NextResponse.json({ error: 'Unauthorized' }, { status: e.status ?? 401 }); }
  let body: { id?: string; action?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }
  if (!body.id || body.action !== 'cancel') return NextResponse.json({ error: 'id and action=cancel required' }, { status: 400 });
  const appt = await db.appointment.findUnique({ where: { id: body.id } });
  if (!appt || appt.patientId !== user.id) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (['completed', 'cancelled'].includes(appt.status)) return NextResponse.json({ error: `Cannot cancel ${appt.status} appointment` }, { status: 400 });
  await db.appointment.update({ where: { id: body.id }, data: { status: 'cancelled' } });
  return NextResponse.json({ ok: true, id: body.id, status: 'cancelled' });
}
