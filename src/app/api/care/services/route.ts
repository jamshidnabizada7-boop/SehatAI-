// Care Connect §4/§14 — Doctor service configuration (types, price,
// duration, messaging window). Doctor-controlled; never hardcoded prices.
// PUT upserts one service type; GET lists own services.
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireCapability, CareAuthzError } from '@/lib/care/care-auth';
import { toMinor, isPositiveIntegerMinor } from '@/lib/care/money';
import { CONSULTATION_TYPES } from '@/lib/care/constants';
export const runtime = 'nodejs';

function err(e: unknown) {
  if (e instanceof CareAuthzError) return NextResponse.json({ error: e.message }, { status: e.status });
  const msg = e instanceof Error ? e.message : 'ERROR';
  const status = /OUT_OF_SCHEDULE|INVALID|REQUIRED|MISMATCH/.test(msg) ? 400 : 500;
  return NextResponse.json({ error: msg }, { status });
}

export async function GET() {
  try {
    const session = await requireCapability('consultation.view');
    if (!session.doctorProfileId) return NextResponse.json({ services: [] });
    const services = await db.doctorService.findMany({
      where: { doctorProfileId: session.doctorProfileId },
      orderBy: { type: 'asc' },
    });
    return NextResponse.json({ services });
  } catch (e) {
    return err(e);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await requireCapability('consultation.view');
    if (!session.doctorProfileId) return NextResponse.json({ error: 'DOCTOR_PROFILE_REQUIRED' }, { status: 400 });

    const body = await req.json();
    const type = String(body.type ?? '').toUpperCase();
    if (!(CONSULTATION_TYPES as readonly string[]).includes(type)) return NextResponse.json({ error: 'INVALID_TYPE' }, { status: 400 });

    const major = Number(body.priceMajor);
    const currency = String(body.currency ?? 'PKR').toUpperCase();
    if (!Number.isFinite(major) || major <= 0) return NextResponse.json({ error: 'INVALID_PRICE' }, { status: 400 });
    const priceMinor = toMinor(major, currency);

    const durationMinutes = Math.min(120, Math.max(5, Number(body.durationMinutes ?? 15)));
    const windowHours = type === 'TEXT' ? Math.min(168, Math.max(1, Number(body.windowHours ?? 24))) : null;
    const followUpGraceHours = type === 'TEXT' ? Math.min(336, Math.max(0, Number(body.followUpGraceHours ?? 48))) : null;

    const service = await db.doctorService.upsert({
      where: { doctorProfileId_type: { doctorProfileId: session.doctorProfileId, type } },
      create: {
        doctorProfileId: session.doctorProfileId,
        type,
        title: body.title ? String(body.title).slice(0, 120) : null,
        priceMinor,
        currency,
        durationMinutes,
        windowHours,
        followUpGraceHours,
        enabled: body.enabled !== false,
      },
      update: {
        title: body.title !== undefined ? (body.title ? String(body.title).slice(0, 120) : null) : undefined,
        priceMinor,
        currency,
        durationMinutes,
        windowHours,
        followUpGraceHours,
        enabled: body.enabled !== false,
      },
    });
    return NextResponse.json({ service });
  } catch (e) {
    return err(e);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await requireCapability('consultation.view');
    const url = new URL(req.url);
    const type = (url.searchParams.get('type') ?? '').toUpperCase();
    if (!session.doctorProfileId || !CONSULTATION_TYPES.includes(type as (typeof CONSULTATION_TYPES)[number])) {
      return NextResponse.json({ error: 'INVALID' }, { status: 400 });
    }
    await db.doctorService.update({
      where: { doctorProfileId_type: { doctorProfileId: session.doctorProfileId, type } },
      data: { enabled: false },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return err(e);
  }
}

void isPositiveIntegerMinor;
