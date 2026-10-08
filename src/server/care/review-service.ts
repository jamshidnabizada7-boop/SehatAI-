// ============================================================
// Care Connect §44/§45 — consultation-scoped reviews.
// Only COMPLETED consultations can create a review; one per
// consultation; self-review and duplicate prevention enforced.
// Robust ranking lives in marketplace.ts (§45 Bayesian + recency).
// ============================================================
import { db } from '@/lib/db';
import { auditCare } from './audit';

export class ReviewError extends Error {
  status: number;
  code: string;
  constructor(code: string, status = 400) {
    super(code);
    this.code = code;
    this.status = status;
  }
}

export async function createReview(opts: {
  consultationId: string;
  patientId: string;
  overall: number;
  communication?: number;
  helpfulness?: number;
  waitTime?: number;
  comment?: string;
}) {
  const consultation = await db.consultation.findUnique({ where: { id: opts.consultationId } });
  if (!consultation) throw new ReviewError('CONSULTATION_NOT_FOUND', 404);
  if (consultation.patientId !== opts.patientId) throw new ReviewError('NOT_YOUR_CONSULTATION', 403);
  if (consultation.status !== 'COMPLETED') {
    throw new ReviewError('ONLY_COMPLETED_CONSULTATIONS_REVIEWABLE', 409);
  }
  // §44 — no self-review (actor property, checked first).
  if (consultation.doctorUserId === opts.patientId) throw new ReviewError('SELF_REVIEW_FORBIDDEN', 403);
  // §44 — one review per consultation, enforced atomically.
  const existing = await db.review.findUnique({ where: { consultationId: opts.consultationId } });
  if (existing) throw new ReviewError('ALREADY_REVIEWED', 409);

  const clamp = (n: number | undefined) =>
    n == null ? null : Math.min(5, Math.max(1, Math.round(n)));

  const review = await db.review.create({
    data: {
      consultationId: opts.consultationId,
      patientId: opts.patientId,
      doctorProfileId: consultation.doctorProfileId,
      overall: clamp(opts.overall) ?? 3,
      communication: clamp(opts.communication),
      helpfulness: clamp(opts.helpfulness),
      waitTime: clamp(opts.waitTime),
      comment: opts.comment?.slice(0, 2000),
    },
  });
  await auditCare({ actorId: opts.patientId, actorRole: 'PATIENT', action: 'review.created', consultationId: opts.consultationId, detail: { reviewId: review.id } });
  return review;
}

/** §44 — moderation: flag/hide via clinical admin (audited). */
export async function moderateReview(opts: { reviewId: string; moderatorId: string; state: 'PUBLISHED' | 'HIDDEN' | 'FLAGGED'; note?: string }) {
  const review = await db.review.findUnique({ where: { id: opts.reviewId } });
  if (!review) throw new ReviewError('REVIEW_NOT_FOUND', 404);
  const updated = await db.review.update({
    where: { id: opts.reviewId },
    data: { state: opts.state, moderatedById: opts.moderatorId, moderatedAt: new Date() },
  });
  await auditCare({ actorId: opts.moderatorId, actorRole: 'CLINICAL_ADMIN', action: 'review.moderated', detail: { reviewId: opts.reviewId, state: opts.state, note: opts.note } });
  return updated;
}
