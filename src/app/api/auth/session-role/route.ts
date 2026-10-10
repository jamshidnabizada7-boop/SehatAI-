// SehatAI — Doctor/Patient identity separation
// GET /api/auth/session-role -> { role, accountStatus, pmdcVerified, name, email }
// Used by the client to filter nav items by role + verification state.
// Gracefully handles database disconnection with HTTP 503 without leaking database internals.
import { NextResponse } from 'next/server';
import { db, isDatabaseDisconnectionError, databaseUnavailableResponse } from '@/lib/db';
import { requireUser } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET() {
  try {
    let user;
    try {
      user = await requireUser();
    } catch (e: any) {
      if (isDatabaseDisconnectionError(e) || e?.status === 503) {
        return databaseUnavailableResponse();
      }
      return NextResponse.json({ role: null, accountStatus: null, pmdcVerified: false });
    }
    const row = await db.user.findUnique({
      where: { id: user.id },
      select: { id: true, name: true, email: true, role: true, accountStatus: true },
    });
    if (!row) return NextResponse.json({ role: null, accountStatus: null, pmdcVerified: false });

    let pmdcVerified = false;
    if (row.role === 'doctor') {
      const dp = await db.doctorProfile.findUnique({ where: { userId: row.id } });
      pmdcVerified = !!dp?.pmdcVerifiedAt;
    }

    return NextResponse.json({
      role: row.role,
      accountStatus: row.accountStatus,
      pmdcVerified,
      name: row.name,
      email: row.email,
    });
  } catch (err: any) {
    if (isDatabaseDisconnectionError(err) || err?.status === 503) {
      return databaseUnavailableResponse();
    }
    return NextResponse.json({ role: null, accountStatus: null, pmdcVerified: false });
  }
}

