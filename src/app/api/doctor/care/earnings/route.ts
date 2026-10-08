// Care Connect §13 — doctor earnings dashboard (ledger-derived wallet).
import { NextResponse } from 'next/server';
import { requireCapability, CareAuthzError } from '@/lib/care/care-auth';
import { doctorEarningsView } from '@/server/care/payout-service';
import { db } from '@/lib/db';
export const runtime = 'nodejs';

export async function GET(req: Request) {
  try {
    const session = await requireCapability('payout.request');
    if (!session.doctorProfileId) return NextResponse.json({ error: 'DOCTOR_PROFILE_REQUIRED' }, { status: 400 });
    const url = new URL(req.url);
    const currency = (url.searchParams.get('currency') ?? 'PKR').toUpperCase();
    const earnings = await doctorEarningsView({ doctorProfileId: session.doctorProfileId, currency });
    const payouts = await db.payout.findMany({
      where: { doctorProfileId: session.doctorProfileId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    const recentEarnings = await db.doctorEarning.findMany({
      where: { doctorProfileId: session.doctorProfileId },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: { consultation: { select: { id: true, type: true, completedAt: true } } },
    });
    return NextResponse.json({ earnings, payouts, recentEarnings });
  } catch (e) {
    if (e instanceof CareAuthzError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: 'ERROR' }, { status: 500 });
  }
}
