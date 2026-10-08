// Care Connect §46 — Availability slots for a doctor's service.
// GET /api/care/availability?doctorId=&type=AUDIO&days=14
// Returns UTC slots; the client renders them in the viewer's timezone.
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAvailableSlots } from '@/server/care/availability';
import { rateLimit, clientIpFrom, RATE_LIMITS } from '@/lib/care/rate-limit';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const rl = await rateLimit(`care-avail:${clientIpFrom(req)}`, RATE_LIMITS.doctorSearch.limit, RATE_LIMITS.doctorSearch.windowSeconds);
  if (!rl.allowed) return NextResponse.json({ error: 'RATE_LIMITED' }, { status: 429 });

  const url = new URL(req.url);
  const doctorId = url.searchParams.get('doctorId')?.trim();
  const type = (url.searchParams.get('type') ?? 'VIDEO').toUpperCase();
  const days = Math.min(30, Math.max(1, Number(url.searchParams.get('days') ?? '14')));
  if (!doctorId) return NextResponse.json({ error: 'doctorId required' }, { status: 400 });
  if (!['AUDIO', 'VIDEO'].includes(type)) {
    return NextResponse.json({ error: 'availability applies to AUDIO/VIDEO; TEXT uses messaging windows' }, { status: 400 });
  }

  const service = await db.doctorService.findUnique({
    where: { doctorProfileId_type: { doctorProfileId: doctorId, type } },
  });
  if (!service || !service.enabled) return NextResponse.json({ error: 'SERVICE_NOT_OFFERED' }, { status: 404 });

  const result = await getAvailableSlots({
    doctorProfileId: doctorId,
    serviceType: type as 'AUDIO' | 'VIDEO',
    durationMinutes: service.durationMinutes,
    fromUtc: new Date(),
    days,
  });

  return NextResponse.json({
    slots: result.slots,
    offlineDays: result.offlineDays,
    durationMinutes: service.durationMinutes,
    timezone: 'UTC', // stored UTC; render client-side in local tz
  });
}
