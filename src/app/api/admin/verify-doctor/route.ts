// SehatAI — Admin: approve or reject a doctor's PMDC verification
// POST /api/admin/verify-doctor { doctorProfileId, action: 'approve' | 'reject', notes? }
// - approve: sets user.accountStatus = 'active', doctorProfile.pmdcVerifiedAt = now, pmdcVerifiedBy = admin.id
//           and marks all verification docs as approved
// - reject:  sets user.accountStatus = 'suspended', marks all docs as rejected
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin, invalidateUserSessions } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  let admin;
  try { admin = await requireAdmin(); } catch (e: unknown) {
    return NextResponse.json({ error: 'Forbidden — admin role required' }, { status: (e as { status?: number }).status ?? 401 });
  }
  let body: { doctorProfileId?: unknown; action?: unknown; notes?: unknown };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const doctorProfileId = typeof body.doctorProfileId === 'string' ? body.doctorProfileId : '';
  const action = body.action === 'approve' ? 'approve' : body.action === 'reject' ? 'reject' : '';
  const notes = typeof body.notes === 'string' ? body.notes.slice(0, 500) : null;

  if (!doctorProfileId) return NextResponse.json({ error: 'doctorProfileId is required' }, { status: 400 });
  if (!action) return NextResponse.json({ error: 'action must be approve or reject' }, { status: 400 });

  const profile = await db.doctorProfile.findUnique({
    where: { id: doctorProfileId },
    include: { user: true },
  });
  if (!profile) return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 });

  if (action === 'approve') {
    await db.user.update({
      where: { id: profile.userId },
      data: { accountStatus: 'active' },
    });
    await db.doctorProfile.update({
      where: { id: profile.id },
      data: { pmdcVerifiedAt: new Date(), pmdcVerifiedBy: admin.id },
    });
    await db.doctorVerificationDoc.updateMany({
      where: { doctorProfileId: profile.id },
      data: { status: 'approved', reviewedAt: new Date(), reviewedBy: admin.id, notes },
    });
    await db.auditLog.create({
      data: {
        userId: admin.id,
        action: 'doctor.verified',
        resource: profile.id,
        meta: JSON.stringify({ pmdcNumber: profile.pmdcNumber, doctorUserId: profile.userId, notes }),
      },
    });
    // Invalidate the doctor's sessions so they need to re-login (now active)
    await invalidateUserSessions(profile.userId);
    return NextResponse.json({ ok: true, action: 'approve', doctorUserId: profile.userId });
  } else {
    await db.user.update({
      where: { id: profile.userId },
      data: { accountStatus: 'suspended' },
    });
    await db.doctorVerificationDoc.updateMany({
      where: { doctorProfileId: profile.id },
      data: { status: 'rejected', reviewedAt: new Date(), reviewedBy: admin.id, notes },
    });
    await db.auditLog.create({
      data: {
        userId: admin.id,
        action: 'doctor.rejected',
        resource: profile.id,
        meta: JSON.stringify({ pmdcNumber: profile.pmdcNumber, doctorUserId: profile.userId, notes }),
      },
    });
    await invalidateUserSessions(profile.userId);
    return NextResponse.json({ ok: true, action: 'reject', doctorUserId: profile.userId });
  }
}
