// SehatAI — Phase 0: current user info (for auth UI state)
// GET /api/user/me -> { user: { id, email, name, consented, retentionDays, role, accountStatus, doctorProfile? } | null }
// Lightweight, unauthenticated reads return 200 with { user: null } so the
// client can probe session state without triggering error toasts.
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET() {
  let user;
  try {
    user = await requireUser();
  } catch {
    return NextResponse.json({ user: null });
  }
  const row = await db.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      email: true,
      name: true,
      consentAt: true,
      retentionDays: true,
      role: true,
      accountStatus: true,
    },
  });
  if (!row) return NextResponse.json({ user: null });

  // Fetch doctor profile if applicable
  let doctorProfile: { pmdcNumber: string; specialty: string; pmdcVerifiedAt: string | null } | null = null;
  if (row.role === 'doctor') {
    const dp = await db.doctorProfile.findUnique({ where: { userId: row.id } });
    if (dp) {
      doctorProfile = {
        pmdcNumber: dp.pmdcNumber,
        specialty: dp.specialty,
        pmdcVerifiedAt: dp.pmdcVerifiedAt?.toISOString() ?? null,
      };
    }
  }

  return NextResponse.json({
    user: {
      id: row.id,
      email: row.email,
      name: row.name,
      consented: !!row.consentAt,
      retentionDays: row.retentionDays,
      role: row.role,
      accountStatus: row.accountStatus,
      doctorProfile,
    },
  });
}
