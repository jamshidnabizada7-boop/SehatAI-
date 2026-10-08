// Care Connect §44 — consultation review (completed-only, once, no self-review).
import { NextRequest, NextResponse } from 'next/server';
import { authorizeConsultationAccess, CareAuthzError } from '@/lib/care/care-auth';
import { createReview, ReviewError } from '@/server/care/review-service';
import { careFlag } from '@/lib/care/flags';
import { rateLimit, RATE_LIMITS } from '@/lib/care/rate-limit';
export const runtime = 'nodejs';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!(await careFlag('CARE_REVIEWS_ENABLED'))) return NextResponse.json({ error: 'CARE_DISABLED' }, { status: 404 });
    const { id } = await params;
    const { access } = await authorizeConsultationAccess(id, 'review.create');
    if (access.kind !== 'participant' || access.role !== 'PATIENT') {
      return NextResponse.json({ error: 'PATIENT_ONLY' }, { status: 403 });
    }
    const rl = await rateLimit(`care-review:${access.session.id}`, RATE_LIMITS.reviews.limit, RATE_LIMITS.reviews.windowSeconds);
    if (!rl.allowed) return NextResponse.json({ error: 'RATE_LIMITED' }, { status: 429 });

    const body = await req.json();
    const review = await createReview({
      consultationId: id,
      patientId: access.session.id,
      overall: Number(body.overall ?? 0),
      communication: body.communication != null ? Number(body.communication) : undefined,
      helpfulness: body.helpfulness != null ? Number(body.helpfulness) : undefined,
      waitTime: body.waitTime != null ? Number(body.waitTime) : undefined,
      comment: body.comment ? String(body.comment) : undefined,
    });
    return NextResponse.json({ review: { id: review.id, overall: review.overall } }, { status: 201 });
  } catch (e) {
    if (e instanceof CareAuthzError) return NextResponse.json({ error: e.message }, { status: e.status });
    if (e instanceof ReviewError) return NextResponse.json({ error: e.code }, { status: e.status });
    return NextResponse.json({ error: 'ERROR' }, { status: 500 });
  }
}
