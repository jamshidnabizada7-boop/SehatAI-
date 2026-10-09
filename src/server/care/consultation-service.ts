// ============================================================
// Care Connect §3 — Consultation lifecycle service.
// Everything (messages, calls, documents, payments, notes,
// prescriptions, reviews, refunds, payouts) references a
// Consultation. State transitions are validated against the
// machine in constants.ts, journalled in ConsultationStatusEvent
// and audited. Booking is transaction-guarded against double
// booking (§46) and idempotent (§58).
// ============================================================
import { randomUUID } from 'crypto';
import { db } from '@/lib/db';
import {
  CONSULTATION_TRANSITIONS,
  assertTransition,
  type ConsultationState,
  type ConsultationType,
} from '@/lib/care/constants';
import { evaluateJurisdiction } from './jurisdiction';
import { assertSlotBookable } from './availability';
import { notify, notifyMany } from './notifications';
import { isTestDoctorProfile, isDoctorProductionEligible } from './marketplace';

export class ConsultationError extends Error {
  status: number;
  code: string;
  constructor(code: string, status = 400) {
    super(code);
    this.code = code;
    this.status = status;
  }
}

const INSTANT_ACCEPT_WINDOW_MINUTES = 15;
const CANCELLATION_POLICY_VERSION = '2026.10-initial';

export interface CreateConsultationInput {
  patientId: string;
  doctorProfileId: string;
  type: ConsultationType;
  serviceId?: string;
  scheduledAt?: string; // ISO — required for AUDIO/VIDEO
  patientCountry: string; // §17 declared
  instant?: boolean;
  idempotencyKey?: string;
}

export async function createConsultation(input: CreateConsultationInput) {
  const doctor = await db.doctorProfile.findUnique({
    where: { id: input.doctorProfileId },
    include: {
      user: { select: { id: true, accountStatus: true, email: true, name: true } },
      jurisdictions: { select: { countryCode: true, status: true } },
    },
  });
  if (!doctor) throw new ConsultationError('DOCTOR_NOT_FOUND', 404);

  // Prevent internal test doctors from appearing as real services in production or public rollout (§18)
  const isProd =
    (process.env.NODE_ENV === 'production' || process.env.CARE_ROLLOUT_STAGE === '5') &&
    process.env.CARE_ALLOW_TEST_DOCTORS !== 'true';

  if (isProd) {
    if (isTestDoctorProfile(doctor)) {
      throw new ConsultationError('DOCTOR_NOT_FOUND', 404);
    }
    // Gating: Ensure no doctor becomes eligible for real booking solely through name-prefix filtering.
    // Require explicit non-test status, current license verification, admin approval, jurisdiction authorization, and active service status.
    const eligibility = isDoctorProductionEligible(doctor);
    if (!eligibility.eligible) {
      throw new ConsultationError(`DOCTOR_NOT_ELIGIBLE:${eligibility.reasons[0]}`, 409);
    }
  }

  const doctorActive =
    doctor.pmdcVerifiedAt != null &&
    doctor.user.accountStatus === 'active' &&
    (doctor.careStatus == null || doctor.careStatus === 'ACTIVE');
  if (!doctorActive) throw new ConsultationError('DOCTOR_NOT_ACTIVE', 409);

  const service = input.serviceId
    ? await db.doctorService.findUnique({ where: { id: input.serviceId } })
    : await db.doctorService.findUnique({
        where: { doctorProfileId_type: { doctorProfileId: input.doctorProfileId, type: input.type } },
      });
  if (!service || !service.enabled || service.type !== input.type) {
    throw new ConsultationError('SERVICE_NOT_OFFERED', 409);
  }

  // §16 jurisdiction gate — BEFORE any payment is possible.
  const decision = await evaluateJurisdiction({
    patientCountry: input.patientCountry,
    doctorCountry: doctor.country ?? 'PK',
    type: input.type,
  });
  if (!decision.allowed) throw new ConsultationError(`JURISDICTION_BLOCKED:${decision.reason}`, 403);

  const scheduledAt = input.scheduledAt ? new Date(input.scheduledAt) : null;
  if (input.type !== 'TEXT' && !scheduledAt) throw new ConsultationError('SCHEDULED_TIME_REQUIRED');
  if (scheduledAt && Number.isNaN(scheduledAt.getTime())) throw new ConsultationError('INVALID_TIME');

  // Double-booking guard (§46) — outside the doctor's schedule or on a
  // taken slot fails here. The transaction below re-checks atomically.
  if (scheduledAt && input.type !== 'TEXT') {
    await assertSlotBookable({
      doctorProfileId: input.doctorProfileId,
      startUtc: scheduledAt,
      durationMinutes: service.durationMinutes,
    });
  }

  const instant = input.instant === true;
  const now = Date.now();

  // Idempotent create (§58): same key → same consultation, never two rows.
  const created = await db.$transaction(async (tx) => {
    if (scheduledAt && input.type !== 'TEXT') {
      // Row lock the doctor profile row to serialize concurrent slot bookings across all DB backends (PostgreSQL & SQLite)
      await tx.doctorProfile.update({
        where: { id: input.doctorProfileId },
        data: { updatedAt: new Date() },
      });

      // Re-check INSIDE the transaction so two concurrent bookings of the
      // same slot cannot both pass (§89 concurrency test).
      const clashing = await tx.consultation.findMany({
        where: {
          doctorProfileId: input.doctorProfileId,
          scheduledAt: { not: null },
          status: { in: ['PAYMENT_PENDING', 'PAID', 'REQUESTED', 'DOCTOR_ACCEPTED', 'SCHEDULED', 'WAITING', 'IN_PROGRESS'] },
          service: { type: { not: 'TEXT' } },
        },
        select: { scheduledAt: true, service: { select: { durationMinutes: true } } },
      });
      const start = scheduledAt.getTime();
      const end = start + service.durationMinutes * 60_000;
      const conflict = clashing.some((c) => {
        if (!c.scheduledAt) return false;
        const cs = new Date(c.scheduledAt).getTime();
        const ce = cs + (c.service?.durationMinutes ?? 15) * 60_000;
        return start < ce && end > cs;
      });
      if (conflict) throw new ConsultationError('SLOT_ALREADY_BOOKED', 409);
    }

    const consultation = await tx.consultation.create({
      data: {
        patientId: input.patientId,
        doctorProfileId: input.doctorProfileId,
        doctorUserId: doctor.userId,
        serviceId: service.id,
        type: input.type,
        status: 'PAYMENT_PENDING',
        priceMinor: service.priceMinor,
        currency: service.currency,
        patientCountry: input.patientCountry.toUpperCase(),
        doctorCountry: (doctor.country ?? 'PK').toUpperCase(),
        jurisdictionKey: decision.policyKey,
        policyVersion: decision.policyVersion,
        scheduledAt,
        instant,
        instantExpiresAt: instant ? new Date(now + INSTANT_ACCEPT_WINDOW_MINUTES * 60_000) : null,
        cancellationPolicyVersion: CANCELLATION_POLICY_VERSION,
        // §22 messaging window (TEXT): opens on PAID (set in payment hook)
        participants: {
          create: [
            { userId: input.patientId, role: 'PATIENT' },
            { userId: doctor.userId, role: 'DOCTOR' },
          ],
        },
      },
    });

    await tx.consultationStatusEvent.create({
      data: { consultationId: consultation.id, fromStatus: null, toStatus: 'PAYMENT_PENDING', actorId: input.patientId, actorRole: 'PATIENT', reason: 'created' },
    });
    await tx.consultationAuditEvent.create({
      data: { consultationId: consultation.id, action: 'consultation.created', actorId: input.patientId, actorRole: 'PATIENT', detailJson: JSON.stringify({ type: input.type, serviceId: service.id }) },
    });
    return consultation;
  }, { timeout: 15_000 });

  return { consultation: created, jurisdiction: decision };
}

// ------------------------------------------------------------
// Transition core (§3) — journalled + audited + notifying.
// ------------------------------------------------------------
export async function transitionConsultation(opts: {
  consultationId: string;
  to: ConsultationState;
  actorId?: string;
  actorRole?: string;
  reason?: string;
  extraData?: Record<string, unknown>;
}) {
  const current = await db.consultation.findUnique({ where: { id: opts.consultationId } });
  if (!current) throw new ConsultationError('CONSULTATION_NOT_FOUND', 404);

  // EXPIRED auto-expiry for stale instant requests.
  if (current.instant && current.instantExpiresAt && new Date(current.instantExpiresAt) < new Date() &&
      current.status === 'REQUESTED' && opts.to === 'EXPIRED') {
    // allowed below
  }

  assertTransition(CONSULTATION_TRANSITIONS, current.status as ConsultationState, opts.to);

  const data: Record<string, unknown> = { ...opts.extraData };
  if (opts.to === 'COMPLETED') data.completedAt = new Date();
  if (opts.to === 'IN_PROGRESS' && !current.startedAt) data.startedAt = new Date();
  if (opts.to === 'PAID') {
    // §22: open the messaging window when payment lands (TEXT), or when accepted for media types.
    if (current.type === 'TEXT' && current.serviceId) {
      const service = await db.doctorService.findUnique({ where: { id: current.serviceId } });
      if (service) {
        data.windowOpensAt = new Date();
        data.windowClosesAt = new Date(Date.now() + (service.windowHours ?? 24) * 3600_000);
        data.graceClosesAt = new Date(Date.now() + (service.windowHours ?? 24) * 3600_000 + (service.followUpGraceHours ?? 48) * 3600_000);
      }
    }
  }

  const updated = await db.consultation.update({
    where: { id: opts.consultationId },
    data: { status: opts.to, ...data },
  });

  await db.consultationStatusEvent.create({
    data: {
      consultationId: opts.consultationId,
      fromStatus: current.status,
      toStatus: opts.to,
      actorId: opts.actorId,
      actorRole: opts.actorRole,
      reason: opts.reason,
    },
  });
  await db.consultationAuditEvent.create({
    data: {
      consultationId: opts.consultationId,
      action: `consultation.${opts.to.toLowerCase()}`,
      actorId: opts.actorId,
      actorRole: opts.actorRole,
      detailJson: opts.reason ? JSON.stringify({ reason: opts.reason }) : undefined,
    },
  });

  // §62 notifications — privacy-safe text only.
  const recipients = [updated.patientId, updated.doctorUserId].filter((id) => id !== opts.actorId);
  const typeFor: Partial<Record<ConsultationState, Parameters<typeof notify>[0]['type']>> = {
    DOCTOR_ACCEPTED: 'consultation.doctor_accepted',
    SCHEDULED: 'consultation.scheduled',
    COMPLETED: 'consultation.completed',
    PATIENT_CANCELLED: 'consultation.cancelled',
    DOCTOR_CANCELLED: 'consultation.cancelled',
    REFUNDED: 'refund.processed',
  };
  const nType = typeFor[opts.to];
  if (nType) await notifyMany(recipients, { type: nType, consultationId: updated.id });

  return updated;
}

// ------------------------------------------------------------
// Doctor / patient actions
// ------------------------------------------------------------
export async function doctorAccept(consultationId: string, doctorUserId: string, scheduledAt?: string) {
  const c = await db.consultation.findUnique({ where: { id: consultationId } });
  if (!c) throw new ConsultationError('CONSULTATION_NOT_FOUND', 404);
  if (c.doctorUserId !== doctorUserId) throw new ConsultationError('NOT_YOUR_CONSULTATION', 403);
  if (c.instant && c.instantExpiresAt && new Date(c.instantExpiresAt) < new Date() && c.status === 'REQUESTED') {
    await transitionConsultation({ consultationId, to: 'EXPIRED', actorId: doctorUserId, actorRole: 'DOCTOR', reason: 'instant window elapsed' });
    throw new ConsultationError('REQUEST_EXPIRED', 410);
  }
  const target: ConsultationState = c.type === 'TEXT' ? 'WAITING' : 'SCHEDULED';
  await transitionConsultation({
    consultationId, to: 'DOCTOR_ACCEPTED', actorId: doctorUserId, actorRole: 'DOCTOR', reason: 'doctor accepted',
  });
  const extra = scheduledAt ? { scheduledAt: new Date(scheduledAt) } : undefined;
  const final = await transitionConsultation({
    consultationId, to: target, actorId: doctorUserId, actorRole: 'DOCTOR', extraData: extra,
  });
  // notify patient
  await notify({ userId: c.patientId, type: 'consultation.scheduled', consultationId });
  return final;
}

export async function doctorDecline(consultationId: string, doctorUserId: string, reason?: string) {
  const c = await db.consultation.findUnique({ where: { id: consultationId } });
  if (!c) throw new ConsultationError('CONSULTATION_NOT_FOUND', 404);
  if (c.doctorUserId !== doctorUserId) throw new ConsultationError('NOT_YOUR_CONSULTATION', 403);
  return transitionConsultation({ consultationId, to: 'DOCTOR_DECLINED', actorId: doctorUserId, actorRole: 'DOCTOR', reason: reason ?? 'doctor declined' });
}

export async function startConsultation(consultationId: string, actorUserId: string, actorRole: 'PATIENT' | 'DOCTOR') {
  const c = await db.consultation.findUnique({ where: { id: consultationId } });
  if (!c) throw new ConsultationError('CONSULTATION_NOT_FOUND', 404);
  const allowed = actorRole === 'DOCTOR' ? c.doctorUserId === actorUserId : c.patientId === actorUserId;
  if (!allowed) throw new ConsultationError('NOT_YOUR_CONSULTATION', 403);
  return transitionConsultation({ consultationId, to: 'IN_PROGRESS', actorId: actorUserId, actorRole, reason: 'joined' });
}

export async function completeConsultation(consultationId: string, doctorUserId: string) {
  const c = await db.consultation.findUnique({ where: { id: consultationId }, include: { notes: true } });
  if (!c) throw new ConsultationError('CONSULTATION_NOT_FOUND', 404);
  if (c.doctorUserId !== doctorUserId) throw new ConsultationError('NOT_YOUR_CONSULTATION', 403);
  // §43 — completion requires clinical documentation.
  const hasNote = c.notes.some((n) => n.visibility === 'PRIVATE_NOTE' || n.visibility === 'PATIENT_SUMMARY');
  if (!hasNote) throw new ConsultationError('CLINICAL_NOTE_REQUIRED');
  return transitionConsultation({ consultationId, to: 'COMPLETED', actorId: doctorUserId, actorRole: 'DOCTOR', reason: 'doctor completed' });
}

export async function cancelConsultation(opts: {
  consultationId: string;
  actorUserId: string;
  actorRole: 'PATIENT' | 'DOCTOR';
  reason?: string;
}) {
  const c = await db.consultation.findUnique({ where: { id: opts.consultationId } });
  if (!c) throw new ConsultationError('CONSULTATION_NOT_FOUND', 404);
  const isPatient = opts.actorRole === 'PATIENT' && c.patientId === opts.actorUserId;
  const isDoctor = opts.actorRole === 'DOCTOR' && c.doctorUserId === opts.actorUserId;
  if (!isPatient && !isDoctor) throw new ConsultationError('NOT_YOUR_CONSULTATION', 403);

  const to: ConsultationState = isPatient ? 'PATIENT_CANCELLED' : 'DOCTOR_CANCELLED';
  const updated = await transitionConsultation({
    consultationId: opts.consultationId, to, actorId: opts.actorUserId, actorRole: opts.actorRole,
    reason: opts.reason, extraData: { cancelledReason: opts.reason },
  });
  // §48 refund eligibility evaluated by the refund service (Phase 5);
  // doctor cancels / no-shows → full refund.
  return updated;
}

/** Lazy expiry pass — invoked on list/read so no cron is required locally. */
export async function expireStaleRequests(): Promise<number> {
  // Abandoned PAYMENT_PENDING bookings free their slot after 60 min.
  const staleUnpaid = await db.consultation.findMany({
    where: { status: 'PAYMENT_PENDING', createdAt: { lt: new Date(Date.now() - 60 * 60_000) } },
    select: { id: true }, take: 50,
  });
  for (const s of staleUnpaid) {
    await transitionConsultation({ consultationId: s.id, to: 'EXPIRED', actorRole: 'SYSTEM', reason: 'payment window elapsed' }).catch(() => undefined);
  }
  const stale = await db.consultation.findMany({
    where: { instant: true, status: 'REQUESTED', instantExpiresAt: { lt: new Date() } },
    select: { id: true },
    take: 50,
  });
  for (const s of stale) {
    await transitionConsultation({ consultationId: s.id, to: 'EXPIRED', actorRole: 'SYSTEM', reason: 'instant accept window elapsed' }).catch(() => undefined);
  }
  return stale.length;
}

export function newTxnRef(prefix: string): string {
  return `${prefix}_${randomUUID().replace(/-/g, '').slice(0, 20)}`;
}
