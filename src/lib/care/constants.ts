// ============================================================
// Care Connect — canonical state machines (plan §3, §11, §13, §14)
// Single source of truth for consultation / payment / payout /
// doctor status lifecycles. All transitions must go through
// assertTransition() so illegal jumps fail loudly.
// ============================================================

export const CONSULTATION_STATES = [
  'DRAFT',
  'PAYMENT_PENDING',
  'PAID',
  'REQUESTED',
  'DOCTOR_ACCEPTED',
  'SCHEDULED',
  'WAITING',
  'IN_PROGRESS',
  'COMPLETED',
  // alternate / terminal states
  'DOCTOR_DECLINED',
  'PATIENT_CANCELLED',
  'DOCTOR_CANCELLED',
  'EXPIRED',
  'NO_SHOW_PATIENT',
  'NO_SHOW_DOCTOR',
  'PAYMENT_FAILED',
  'REFUND_PENDING',
  'REFUNDED',
  'DISPUTED',
] as const;
export type ConsultationState = (typeof CONSULTATION_STATES)[number];

// Happy path: DRAFT → PAYMENT_PENDING → PAID → REQUESTED → DOCTOR_ACCEPTED
//   → SCHEDULED → WAITING → IN_PROGRESS → COMPLETED
// Instant path: PAYMENT_PENDING → PAID → REQUESTED → DOCTOR_ACCEPTED → IN_PROGRESS
export const CONSULTATION_TRANSITIONS: Record<ConsultationState, ConsultationState[]> = {
  DRAFT: ['PAYMENT_PENDING'],
  PAYMENT_PENDING: ['PAID', 'PAYMENT_FAILED', 'PATIENT_CANCELLED', 'EXPIRED'],
  PAID: ['REQUESTED', 'REFUND_PENDING'],
  REQUESTED: ['DOCTOR_ACCEPTED', 'DOCTOR_DECLINED', 'PATIENT_CANCELLED', 'EXPIRED', 'REFUND_PENDING'],
  DOCTOR_ACCEPTED: ['SCHEDULED', 'WAITING', 'IN_PROGRESS', 'DOCTOR_CANCELLED', 'REFUND_PENDING'],
  SCHEDULED: ['WAITING', 'IN_PROGRESS', 'DOCTOR_CANCELLED', 'PATIENT_CANCELLED', 'NO_SHOW_DOCTOR', 'NO_SHOW_PATIENT', 'EXPIRED', 'REFUND_PENDING'],
  WAITING: ['IN_PROGRESS', 'COMPLETED', 'NO_SHOW_DOCTOR', 'NO_SHOW_PATIENT', 'DOCTOR_CANCELLED', 'PATIENT_CANCELLED', 'EXPIRED', 'REFUND_PENDING'],
  IN_PROGRESS: ['COMPLETED', 'DOCTOR_CANCELLED', 'PATIENT_CANCELLED', 'REFUND_PENDING', 'DISPUTED'],
  COMPLETED: ['DISPUTED', 'REFUND_PENDING'],
  DOCTOR_DECLINED: ['REFUND_PENDING', 'REFUNDED'],
  PATIENT_CANCELLED: ['REFUND_PENDING', 'REFUNDED'],
  DOCTOR_CANCELLED: ['REFUND_PENDING', 'REFUNDED'],
  EXPIRED: ['REFUND_PENDING', 'REFUNDED'],
  NO_SHOW_PATIENT: ['REFUND_PENDING', 'REFUNDED'],
  NO_SHOW_DOCTOR: ['REFUND_PENDING', 'REFUNDED'],
  PAYMENT_FAILED: ['PAYMENT_PENDING'], // retry allowed
  REFUND_PENDING: ['REFUNDED', 'DISPUTED'],
  REFUNDED: ['DISPUTED'],
  DISPUTED: ['REFUND_PENDING', 'REFUNDED', 'COMPLETED'],
};

export const PAYMENT_STATES = [
  'CREATED',
  'PENDING',
  'AUTHORIZED',
  'PAID',
  'FAILED',
  'CANCELLED',
  'REFUND_PENDING',
  'PARTIALLY_REFUNDED',
  'REFUNDED',
  'DISPUTED',
  'CHARGEDBACK',
] as const;
export type PaymentState = (typeof PAYMENT_STATES)[number];

export const PAYMENT_TRANSITIONS: Record<PaymentState, PaymentState[]> = {
  CREATED: ['PENDING', 'FAILED', 'CANCELLED'],
  PENDING: ['AUTHORIZED', 'PAID', 'FAILED', 'CANCELLED'],
  AUTHORIZED: ['PAID', 'FAILED', 'CANCELLED'],
  PAID: ['REFUND_PENDING', 'PARTIALLY_REFUNDED', 'REFUNDED', 'DISPUTED'],
  FAILED: ['PENDING'], // retry creates a fresh attempt
  CANCELLED: ['PENDING'],
  REFUND_PENDING: ['PARTIALLY_REFUNDED', 'REFUNDED', 'FAILED'],
  PARTIALLY_REFUNDED: ['REFUND_PENDING', 'REFUNDED', 'DISPUTED'],
  REFUNDED: ['DISPUTED', 'CHARGEDBACK'],
  DISPUTED: ['CHARGEDBACK', 'PARTIALLY_REFUNDED', 'REFUNDED'],
  CHARGEDBACK: [],
};

export const PAYOUT_STATES = ['PENDING', 'PROCESSING', 'PAID', 'FAILED', 'REVERSED'] as const;
export type PayoutState = (typeof PAYOUT_STATES)[number];
export const PAYOUT_TRANSITIONS: Record<PayoutState, PayoutState[]> = {
  PENDING: ['PROCESSING', 'FAILED'],
  PROCESSING: ['PAID', 'FAILED'],
  PAID: ['REVERSED'],
  FAILED: ['PENDING', 'PROCESSING', 'REVERSED'],
  REVERSED: [],
};

export const REFUND_STATES = ['REQUESTED', 'REFUND_PENDING', 'REFUNDED', 'FAILED', 'REJECTED'] as const;
export type RefundState = (typeof REFUND_STATES)[number];
export const REFUND_TRANSITIONS: Record<RefundState, RefundState[]> = {
  REQUESTED: ['REFUND_PENDING', 'REJECTED'],
  REFUND_PENDING: ['REFUNDED', 'FAILED'],
  REFUNDED: [],
  FAILED: ['REFUND_PENDING'],
  REJECTED: [],
};

// §14 doctor onboarding status (careStatus; null = legacy derived state)
export const DOCTOR_CARE_STATES = [
  'DRAFT',
  'PENDING_VERIFICATION',
  'MORE_INFO_REQUIRED',
  'VERIFIED',
  'ACTIVE',
  'SUSPENDED',
  'REJECTED',
  'EXPIRED',
] as const;
export type DoctorCareState = (typeof DOCTOR_CARE_STATES)[number];
export const DOCTOR_CARE_TRANSITIONS: Record<DoctorCareState, DoctorCareState[]> = {
  DRAFT: ['PENDING_VERIFICATION'],
  PENDING_VERIFICATION: ['VERIFIED', 'MORE_INFO_REQUIRED', 'REJECTED'],
  MORE_INFO_REQUIRED: ['PENDING_VERIFICATION', 'REJECTED'],
  VERIFIED: ['ACTIVE', 'SUSPENDED', 'EXPIRED'],
  ACTIVE: ['SUSPENDED', 'EXPIRED'],
  SUSPENDED: ['ACTIVE', 'REJECTED'],
  REJECTED: ['PENDING_VERIFICATION'],
  EXPIRED: ['PENDING_VERIFICATION'],
};

export function assertTransition<S extends string>(
  machine: Record<S, S[]>,
  from: S,
  to: S,
): void {
  if (from === to) return; // idempotent no-op (e.g. repeated webhook)
  const allowed = machine[from];
  if (!allowed || !allowed.includes(to)) {
    throw new Error(`ILLEGAL_TRANSITION: ${from} → ${to}`);
  }
}

export function isTerminal<S extends string>(machine: Record<S, S[]>, state: S): boolean {
  return (machine[state] ?? []).length === 0;
}

// Consultation types (§4)
export const CONSULTATION_TYPES = ['TEXT', 'AUDIO', 'VIDEO'] as const;
export type ConsultationType = (typeof CONSULTATION_TYPES)[number];

// Roles (§52) — additive over the existing user|doctor|admin values
export const CARE_ROLES = [
  'PATIENT',
  'DOCTOR',
  'SUPPORT',
  'FINANCE',
  'CLINICAL_ADMIN',
  'ADMIN',
  'SUPER_ADMIN',
] as const;
export type CareRole = (typeof CARE_ROLES)[number];
