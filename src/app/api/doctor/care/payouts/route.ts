// Care Connect §13 — doctor payout request + list.
import { NextRequest, NextResponse } from 'next/server';
import { requireCapability, CareAuthzError } from '@/lib/care/care-auth';
import { requestPayout, PayoutError } from '@/server/care/payout-service';
import { db } from '@/lib/db';
import { rateLimit, RATE_LIMITS } from '@/lib/care/rate-limit';
import { careFlag } from '@/lib/care/flags';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const session = await requireCapability('payout.request');
    if (!session.doctorProfileId) return NextResponse.json({ payouts: [] });
    const payouts = await db.payout.findMany({
      where: { doctorProfileId: session.doctorProfileId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return NextResponse.json({ payouts });
  } catch (e) {
    if (e instanceof CareAuthzError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: 'ERROR' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!(await careFlag('CARE_DOCTOR_PAYOUTS_ENABLED'))) {
      return NextResponse.json({ error: 'PAYOUTS_DISABLED_BY_FLAG' }, { status: 403 });
    }
    const session = await requireCapability('payout.request');
    if (!session.doctorProfileId) return NextResponse.json({ error: 'DOCTOR_PROFILE_REQUIRED' }, { status: 400 });
    const rl = await rateLimit(`care-payout:${session.id}`, 3, 3600);
    if (!rl.allowed) return NextResponse.json({ error: 'RATE_LIMITED' }, { status: 429 });

    const body = await req.json().catch(() => ({}));
    const payout = await requestPayout({
      doctorProfileId: session.doctorProfileId,
      doctorUserId: session.id,
      currency: body.currency ? String(body.currency) : undefined,
    });
    return NextResponse.json({ payout }, { status: 201 });
  } catch (e) {
    if (e instanceof CareAuthzError) return NextResponse.json({ error: e.message }, { status: e.status });
    if (e instanceof PayoutError) return NextResponse.json({ error: e.code }, { status: e.status });
    return NextResponse.json({ error: 'ERROR' }, { status: 500 });
  }
}
