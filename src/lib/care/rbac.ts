// ============================================================
// Care Connect §52/53 — roles + least-privilege authorization.
// Additive over the existing auth layer (src/lib/auth.ts):
//   existing values user|doctor|admin keep working; SUPPORT,
//   FINANCE, CLINICAL_ADMIN, SUPER_ADMIN are new string values.
// RBAC answers "can this role do X"; ownership/participant checks
// are separate (careAuth.ts) and always required for PHI.
// ============================================================

import type { CareRole } from './constants';

// Maps a NextAuth User.role string to a CareRole.
export function toCareRole(role: string | null | undefined): CareRole {
  switch (role?.toLowerCase()) {
    case 'admin':
    case 'super_admin':
      return 'SUPER_ADMIN';
    case 'doctor':
      return 'DOCTOR';
    case 'support':
      return 'SUPPORT';
    case 'finance':
      return 'FINANCE';
    case 'clinical_admin':
      return 'CLINICAL_ADMIN';
    default:
      return 'PATIENT';
  }
}

// Capabilities — checked by API routes via requireCapability().
export type CareCapability =
  | 'consultation.view' // own consultations (patient/doctor) — participant check applies
  | 'consultation.viewAny' // support/admin can list across users (audited)
  | 'consultation.message' // send messages in a consultation they participate in
  | 'consultation.complete' // doctor completes a consultation
  | 'consultation.cancel'
  | 'consultation.dispute'
  | 'payment.create'
  | 'payment.viewAny' // finance/admin
  | 'refund.create'
  | 'refund.decide' // finance/admin
  | 'payout.request'
  | 'payout.process' // finance/admin
  | 'prescription.sign'
  | 'prescription.view' // own (patient) / authored (doctor)
  | 'prescription.viewAny' // clinical admin (audited)
  | 'note.write'
  | 'note.viewPrivate'
  | 'handoff.review'
  | 'review.create'
  | 'review.moderate'
  | 'doctor.verify' // admin/clinical_admin
  | 'jurisdiction.manage'
  | 'commission.manage'
  | 'fraud.review'
  | 'flags.manage'
  | 'translation.confirm'
  | 'attachment.upload'
  | 'attachment.download'
  | 'call.token' // join audio/video
  | 'admin.audit.view';

const ROLE_CAPABILITIES: Record<CareRole, CareCapability[]> = {
  PATIENT: [
    'consultation.view',
    'consultation.message',
    'consultation.cancel',
    'consultation.dispute',
    'payment.create',
    'review.create',
    'prescription.view',
    'attachment.upload',
    'attachment.download',
    'payout.request', // n/a for patients (route gates by doctor ownership) — harmless
  ],
  DOCTOR: [
    'consultation.view',
    'consultation.message',
    'consultation.complete',
    'consultation.cancel',
    'prescription.sign',
    'prescription.view',
    'note.write',
    'note.viewPrivate',
    'handoff.review',
    'translation.confirm',
    'attachment.upload',
    'attachment.download',
    'call.token',
    'payout.request',
  ],
  SUPPORT: [
    'consultation.viewAny',
    'consultation.view',
    'consultation.dispute',
    'refund.create',
    'fraud.review',
  ],
  FINANCE: [
    'payment.viewAny',
    'refund.create',
    'refund.decide',
    'payout.process',
    'admin.audit.view',
  ],
  CLINICAL_ADMIN: [
    'consultation.viewAny',
    'consultation.view',
    'prescription.viewAny',
    'review.moderate',
    'doctor.verify',
    'admin.audit.view',
  ],
  ADMIN: [
    'consultation.viewAny',
    'consultation.view',
    'payment.viewAny',
    'refund.create',
    'refund.decide',
    'payout.process',
    'prescription.viewAny',
    'review.moderate',
    'doctor.verify',
    'jurisdiction.manage',
    'commission.manage',
    'fraud.review',
    'flags.manage',
    'admin.audit.view',
  ],
  SUPER_ADMIN: [
    'consultation.viewAny',
    'consultation.view',
    'payment.viewAny',
    'refund.create',
    'refund.decide',
    'payout.process',
    'prescription.viewAny',
    'note.viewPrivate',
    'handoff.review',
    'review.moderate',
    'doctor.verify',
    'jurisdiction.manage',
    'commission.manage',
    'fraud.review',
    'flags.manage',
    'admin.audit.view',
    'consultation.complete',
    'consultation.message',
  ],
};

export function hasCapability(role: string | null | undefined, cap: CareCapability): boolean {
  return ROLE_CAPABILITIES[toCareRole(role)].includes(cap);
}

export function capabilitiesFor(role: string | null | undefined): CareCapability[] {
  return ROLE_CAPABILITIES[toCareRole(role)];
}

export class CareAuthzError extends Error {
  status: number;
  constructor(message: string, status = 403) {
    super(message);
    this.name = 'CareAuthzError';
    this.status = status;
  }
}
