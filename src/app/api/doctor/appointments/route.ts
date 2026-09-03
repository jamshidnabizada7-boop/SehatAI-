// SehatAI — Doctor Appointments API
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireDoctor } from '@/lib/auth';
export const runtime = 'nodejs';
export async function GET(req: NextRequest) {
  let user;
  try { user = await requireDoctor(); } catch (e: any) { return NextResponse.json({ error: 'Forbidden' }, { status: e.status ?? 401 }); }
  const profile = await db.doctorProfile.findUnique({ where: { userId: user.id } });
  if (!profile) return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 });
  const url = new URL(req.url);
  const statusFilter = url.searchParams.get('status') ?? 'all';
  const where: any = { doctorProfileId: profile.id };
  if (statusFilter !== 'all' && ['requested', 'confirmed', 'declined', 'cancelled', 'completed'].includes(statusFilter)) where.status = statusFilter;
  const appts = await db.appointment.findMany({ where, include: { patient: { select: { id: true, name: true, email: true } } }, orderBy: { scheduledAt: 'asc' }, take: 50 });
  return NextResponse.json({ appointments: appts.map(a => ({ id: a.id, patientId: a.patientId, patientName: a.patient.name ?? 'Unknown', patientEmail: a.patient.email, scheduledAt: a.scheduledAt.toISOString(), reason: a.reason, status: a.status, doctorNotes: a.doctorNotes, createdAt: a.createdAt.toISOString() })) });
}
export async function PATCH(req: NextRequest) {
  let user;
  try { user = await requireDoctor(); } catch (e: any) { return NextResponse.json({ error: 'Forbidden' }, { status: e.status ?? 401 }); }
  const profile = await db.doctorProfile.findUnique({ where: { userId: user.id } });
  if (!profile) return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 });
  let body: { id?: string; action?: string; notes?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }
  const id = body.id ?? '';
  const action = body.action ?? '';
  const validActions: Record<string, string> = { confirm: 'confirmed', decline: 'declined', complete: 'completed', cancel: 'cancelled' };
  if (!id || !validActions[action]) return NextResponse.json({ error: 'id and valid action required' }, { status: 400 });
  const appt = await db.appointment.findUnique({ where: { id } });
  if (!appt || appt.doctorProfileId !== profile.id) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const newStatus = validActions[action];
  await db.appointment.update({ where: { id }, data: { status: newStatus, doctorNotes: body.notes ?? undefined } });
  await db.auditLog.create({ data: { userId: user.id, action: `doctor.appointment.${action}`, resource: id, meta: JSON.stringify({ patientId: appt.patientId }) } });
  return NextResponse.json({ ok: true, id, status: newStatus });
}
