// Care Connect §83 — Consent management route.
// Captures, retrieves, and revokes versioned patient consents (TELEMEDICINE, TERMS, etc.)
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCareSession, CareAuthzError } from '@/lib/care/care-auth';
import { clientIpFrom } from '@/lib/care/rate-limit';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const session = await getCareSession();
    if (!session) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });

    const body = await req.json();
    const type = String(body.type ?? '').trim();
    const policyVersion = String(body.policyVersion ?? '').trim();

    if (!type || !policyVersion) {
      return NextResponse.json({ error: 'MISSING_FIELDS' }, { status: 400 });
    }

    const ip = clientIpFrom(req);
    const consent = await db.consentRecord.create({
      data: {
        userId: session.id,
        type,
        policyVersion,
        jurisdiction: body.jurisdiction ? String(body.jurisdiction) : null,
        consultationId: body.consultationId ? String(body.consultationId) : null,
        ip,
      },
    });

    return NextResponse.json({ ok: true, consent }, { status: 201 });
  } catch (e) {
    if (e instanceof CareAuthzError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: e instanceof Error ? e.message : 'ERROR' }, { status: 500 });
  }
}

export async function GET(_req: NextRequest) {
  try {
    const session = await getCareSession();
    if (!session) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });

    const consents = await db.consentRecord.findMany({
      where: { userId: session.id, revokedAt: null },
      orderBy: { grantedAt: 'desc' },
    });

    return NextResponse.json({ consents });
  } catch (e) {
    if (e instanceof CareAuthzError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: e instanceof Error ? e.message : 'ERROR' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getCareSession();
    if (!session) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });

    const type = new URL(req.url).searchParams.get('type') ?? 'TELEMEDICINE';
    await db.consentRecord.updateMany({
      where: { userId: session.id, type, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    return NextResponse.json({ ok: true, revoked: type });
  } catch (e) {
    if (e instanceof CareAuthzError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: e instanceof Error ? e.message : 'ERROR' }, { status: 500 });
  }
}
