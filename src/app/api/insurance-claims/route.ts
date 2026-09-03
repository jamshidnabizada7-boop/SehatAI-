// SehatAI — Insurance Claims API
// GET /api/insurance-claims → user's claims
// POST /api/insurance-claims { provider, policyNumber?, claimType, amount, notes? } → submit claim
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth';

export const runtime = 'nodejs';

const INSURANCE_PROVIDERS = [
  { name: 'Jubilee Health Insurance', coverage: { consultation: 80, 'lab-test': 70, medicine: 60, procedure: 50 } },
  { name: 'Adamjee Insurance', coverage: { consultation: 75, 'lab-test': 65, medicine: 55, procedure: 45 } },
  { name: 'EFU Health', coverage: { consultation: 70, 'lab-test': 60, medicine: 50, procedure: 40 } },
  { name: 'IGI Health Insurance', coverage: { consultation: 85, 'lab-test': 75, medicine: 65, procedure: 55 } },
  { name: 'Sehat Sahulat Program (Govt)', coverage: { consultation: 100, 'lab-test': 100, medicine: 100, procedure: 100 } },
];

export async function GET() {
  let user;
  try { user = await requireUser(); } catch (e: unknown) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: (e as { status?: number }).status ?? 401 });
  }
  const claims = await db.insuranceClaim.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });
  return NextResponse.json({
    claims: claims.map(c => ({ ...c, createdAt: c.createdAt.toISOString() })),
    providers: INSURANCE_PROVIDERS,
  });
}

export async function POST(req: NextRequest) {
  let user;
  try { user = await requireUser(); } catch (e: unknown) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: (e as { status?: number }).status ?? 401 });
  }
  let body: { provider?: string; policyNumber?: string; claimType?: string; amount?: number; notes?: string; appointmentId?: string };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  if (!body.provider || !body.claimType || !body.amount) {
    return NextResponse.json({ error: 'provider, claimType, and amount are required' }, { status: 400 });
  }
  const claim = await db.insuranceClaim.create({
    data: {
      userId: user.id,
      provider: body.provider,
      policyNumber: body.policyNumber ?? null,
      claimType: body.claimType,
      amount: body.amount,
      notes: body.notes ?? null,
      appointmentId: body.appointmentId ?? null,
    },
  });
  // Calculate expected coverage
  const provider = INSURANCE_PROVIDERS.find(p => p.name === body.provider);
  const coveragePct = provider?.coverage[body.claimType as keyof typeof provider.coverage] ?? 0;
  const expectedReimbursement = Math.round(body.amount * coveragePct / 100);

  await db.auditLog.create({
    data: { userId: user.id, action: 'patient.insurance.claim', resource: claim.id, meta: JSON.stringify({ provider: body.provider, amount: body.amount, coveragePct }) },
  });

  return NextResponse.json({
    ok: true,
    claimId: claim.id,
    status: 'submitted',
    expectedReimbursement,
    coveragePercent: coveragePct,
  });
}
