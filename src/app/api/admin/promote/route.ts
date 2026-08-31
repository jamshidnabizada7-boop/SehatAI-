// SehatAI — Admin role assignment API
// POST /api/admin/promote { email, role, pmdcNumber?, specialty? }
// Admin-only endpoint for assigning doctor/admin roles to users.
//
// When promoting to 'doctor':
//   - if the user has no DoctorProfile, one is created with pmdcNumber + specialty
//   - accountStatus is set to 'active' (legacy backfill path — admin takes responsibility)
//   - pmdcVerifiedAt + pmdcVerifiedBy are set (admin vouches for the legacy doctor)
// Sessions are invalidated so the user re-logs in with the new role.
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin, invalidateUserSessions } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  let admin;
  try { admin = await requireAdmin(); } catch (e: unknown) {
    return NextResponse.json({ error: 'Forbidden — admin role required' }, { status: (e as { status?: number }).status ?? 401 });
  }

  let body: { email?: unknown; role?: unknown; pmdcNumber?: unknown; specialty?: unknown };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const targetEmail = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const role = typeof body.role === 'string' ? body.role : '';
  const pmdcNumber = typeof body.pmdcNumber === 'string' ? body.pmdcNumber.trim().toUpperCase() : '';
  const specialty = typeof body.specialty === 'string' ? body.specialty.trim() : '';

  if (!targetEmail) return NextResponse.json({ error: 'email is required' }, { status: 400 });
  if (!['user', 'doctor', 'admin'].includes(role)) {
    return NextResponse.json({ error: 'role must be user | doctor | admin' }, { status: 400 });
  }
  // When promoting to doctor, require pmdcNumber + specialty if no profile exists yet
  const target = await db.user.findUnique({ where: { email: targetEmail }, include: { doctorProfile: true } });
  if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  if (role === 'doctor' && !target.doctorProfile) {
    if (!pmdcNumber) return NextResponse.json({ error: 'pmdcNumber is required when promoting to doctor' }, { status: 400 });
    if (!specialty) return NextResponse.json({ error: 'specialty is required when promoting to doctor' }, { status: 400 });
    // Check PMDC uniqueness
    const existingPmdc = await db.doctorProfile.findUnique({ where: { pmdcNumber } });
    if (existingPmdc && existingPmdc.userId !== target.id) {
      return NextResponse.json({ error: 'PMDC number already in use by another doctor' }, { status: 409 });
    }
  }

  // Update the user role + status
  await db.user.update({
    where: { id: target.id },
    data: {
      role,
      // When promoting to doctor via admin, mark as active (admin vouches)
      // When demoting from doctor to user, set back to active too
      accountStatus: role === 'doctor' ? 'active' : 'active',
    },
  });

  // If promoting to doctor and no profile exists, create one (legacy backfill)
  if (role === 'doctor' && !target.doctorProfile) {
    await db.doctorProfile.create({
      data: {
        userId: target.id,
        pmdcNumber,
        specialty,
        pmdcVerifiedAt: new Date(),
        pmdcVerifiedBy: admin.id,
      },
    });
  } else if (role === 'doctor' && target.doctorProfile && !target.doctorProfile.pmdcVerifiedAt) {
    // Backfill: legacy doctor with unverified PMDC — admin vouches
    await db.doctorProfile.update({
      where: { id: target.doctorProfile.id },
      data: { pmdcVerifiedAt: new Date(), pmdcVerifiedBy: admin.id },
    });
  }

  // Audit log
  await db.auditLog.create({
    data: {
      userId: admin.id,
      action: 'admin.promote',
      resource: targetEmail,
      meta: JSON.stringify({ targetUserId: target.id, newRole: role, pmdcNumber: pmdcNumber || undefined }),
    },
  });

  // Invalidate the target's sessions so they re-login with the new role
  await invalidateUserSessions(target.id);

  return NextResponse.json({ ok: true, userEmail: targetEmail, role });
}
