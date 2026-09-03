// SehatAI — Doctor Reviews API
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth';
export const runtime = 'nodejs';
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const doctorProfileId = url.searchParams.get('doctorProfileId');
  if (!doctorProfileId) return NextResponse.json({ error: 'doctorProfileId is required' }, { status: 400 });
  const reviews = await db.doctorReview.findMany({ where: { doctorProfileId }, include: { patient: { select: { name: true } } }, orderBy: { createdAt: 'desc' } });
  const avgRating = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  return NextResponse.json({ reviews: reviews.map(r => ({ id: r.id, rating: r.rating, comment: r.comment, patientName: r.patient.name ?? 'Anonymous', createdAt: r.createdAt.toISOString() })), avgRating: Math.round(avgRating * 10) / 10, count: reviews.length });
}
export async function POST(req: NextRequest) {
  let user;
  try { user = await requireUser(); } catch (e: any) { return NextResponse.json({ error: 'Unauthorized' }, { status: e.status ?? 401 }); }
  let body: { doctorProfileId?: string; rating?: number; comment?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }
  const doctorProfileId = body.doctorProfileId ?? '';
  const rating = Number(body.rating);
  if (!doctorProfileId) return NextResponse.json({ error: 'doctorProfileId is required' }, { status: 400 });
  if (rating < 1 || rating > 5) return NextResponse.json({ error: 'rating must be 1-5' }, { status: 400 });
  const doctor = await db.doctorProfile.findUnique({ where: { id: doctorProfileId }, include: { user: { select: { accountStatus: true } } } });
  if (!doctor || !doctor.pmdcVerifiedAt || doctor.user.accountStatus !== 'active') return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
  const review = await db.doctorReview.upsert({ where: { doctorProfileId_patientId: { doctorProfileId, patientId: user.id } }, update: { rating, comment: body.comment ?? null }, create: { doctorProfileId, patientId: user.id, rating, comment: body.comment ?? null } });
  await db.auditLog.create({ data: { userId: user.id, action: 'patient.review.submitted', resource: doctorProfileId, meta: JSON.stringify({ rating }) } });
  return NextResponse.json({ ok: true, reviewId: review.id, rating });
}
