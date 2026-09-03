// SehatAI — Patient Consent Management API
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth';
export const runtime = 'nodejs';
export async function GET() {
  let user;
  try { user = await requireUser(); } catch (e: any) { return NextResponse.json({ error: 'Unauthorized' }, { status: e.status ?? 401 }); }
  const consents = await db.patientConsentForDoctor.findMany({ where: { patientId: user.id }, include: { doctorProfile: { include: { user: { select: { name: true } } } } }, orderBy: { grantedAt: 'desc' } });
  return NextResponse.json({ consents: consents.map(c => ({ id: c.id, doctorProfileId: c.doctorId, doctorName: c.doctorProfile.user.name ?? 'Unknown', pmdcNumber: c.doctorProfile.pmdcNumber, specialty: c.doctorProfile.specialty, facilityName: c.doctorProfile.facilityName, facilityCity: c.doctorProfile.facilityCity, scope: c.scope, grantedAt: c.grantedAt.toISOString(), revokedAt: c.revokedAt?.toISOString() ?? null, isActive: c.revokedAt === null })) });
}
export async function POST(req: NextRequest) {
  let user;
  try { user = await requireUser(); } catch (e: any) { return NextResponse.json({ error: 'Unauthorized' }, { status: e.status ?? 401 }); }
  let body: { doctorProfileId?: string; scope?: string; action?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }
  const doctorProfileId = body.doctorProfileId ?? '';
  const scope = ['read_history', 'soap_draft', 'follow_up'].includes(body.scope ?? '') ? body.scope! : 'read_history';
  const action = body.action === 'revoke' ? 'revoke' : 'grant';
  if (!doctorProfileId) return NextResponse.json({ error: 'doctorProfileId is required' }, { status: 400 });
  const doctor = await db.doctorProfile.findUnique({ where: { id: doctorProfileId }, include: { user: { select: { accountStatus: true } } } });
  if (!doctor || !doctor.pmdcVerifiedAt || doctor.user.accountStatus !== 'active') return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
  if (action === 'grant') {
    await db.patientConsentForDoctor.upsert({ where: { patientId_doctorId_scope: { patientId: user.id, doctorId: doctorProfileId, scope } }, update: { revokedAt: null }, create: { patientId: user.id, doctorId: doctorProfileId, scope } });
    await db.auditLog.create({ data: { userId: user.id, action: 'patient.consent.granted', resource: doctorProfileId, meta: JSON.stringify({ scope }) } });
  } else {
    await db.patientConsentForDoctor.updateMany({ where: { patientId: user.id, doctorId: doctorProfileId, scope, revokedAt: null }, data: { revokedAt: new Date() } });
    await db.auditLog.create({ data: { userId: user.id, action: 'patient.consent.revoked', resource: doctorProfileId, meta: JSON.stringify({ scope }) } });
  }
  return NextResponse.json({ ok: true, action, doctorProfileId, scope });
}
