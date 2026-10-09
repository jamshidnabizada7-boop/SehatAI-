// ============================================================
// Care Connect §16 — Jurisdiction engine (mandatory for production).
// Evaluates patient physical jurisdiction + doctor licensing
// jurisdiction + consultation type + applicable policy BEFORE booking.
// If no policy permits the service → booking blocked.
// Nothing regulatory is hardcoded: all rules live in JurisdictionPolicy
// rows (versioned, effective-dated). Absent row = BLOCKED.
//
// Cross-border safeguards:
// 1. Both Pakistan–Afghanistan clinical corridors remain DISABLED by default.
// 2. Corridors CANNOT be activated through an ordinary environment variable alone.
// 3. Activation requires a versioned JurisdictionPolicy row with:
//    - Verified legal/regulatory approval source
//    - Valid effective date and non-expired clearance
//    - Human administrative activation with audit trail
//    - Explicit cross-border scope
//    - Individual doctor authorization for the patient's jurisdiction
// ============================================================
import { db } from '@/lib/db';
import type { ConsultationType } from '@/lib/care/constants';

export interface JurisdictionEvaluationOptions {
  patientCountry: string;   // §17 DECLARED physical location, never IP-inferred
  doctorCountry: string;    // doctor's licensing jurisdiction
  type: ConsultationType;
  isMinor?: boolean;
  doctorProfileId?: string; // doctor ID to verify individual doctor credential & authorization
  isPrescribingRequested?: boolean; // whether prescribing authorization is evaluated
}

export interface JurisdictionDecision {
  allowed: boolean;
  policyKey: string | null;
  policyVersion: string | null;
  reason: string;
  prescribingAllowed: boolean;
  controlledDrugAllowed: boolean;
  medicalCertificateAllowed: boolean;
  requiresGuardian: boolean;
  requiresLocalDoctor: boolean;
  scope?: string | null;
  legalApprovalSource?: string | null;
  approvalExpiresAt?: Date | null;
  humanApprovedById?: string | null;
  humanApprovedAt?: Date | null;
}

export async function evaluateJurisdiction(opts: JurisdictionEvaluationOptions): Promise<JurisdictionDecision> {
  const blocked: JurisdictionDecision = {
    allowed: false,
    policyKey: null,
    policyVersion: null,
    reason: 'NO_POLICY_FOR_CORRIDOR',
    prescribingAllowed: false,
    controlledDrugAllowed: false,
    medicalCertificateAllowed: false,
    requiresGuardian: false,
    requiresLocalDoctor: false,
  };

  const pc = (opts.patientCountry ?? '').trim().toUpperCase();
  const dc = (opts.doctorCountry ?? '').trim().toUpperCase();

  if (!pc || !dc || pc.length !== 2 || dc.length !== 2) {
    return {
      ...blocked,
      reason: 'INVALID_JURISDICTION_CODE',
    };
  }

  const isCrossBorder = pc !== dc;
  const isPakAfghanCorridor = (pc === 'PK' && dc === 'AF') || (pc === 'AF' && dc === 'PK');
  const now = new Date();

  // Fail-closed corridor policy lookup (versioned, effective-dated)
  const policy = await db.jurisdictionPolicy.findFirst({
    where: { countryCode: pc, doctorCountry: dc },
    orderBy: { effectiveDate: 'desc' },
  });

  if (!policy) {
    return {
      ...blocked,
      policyKey: `${pc}>${dc}`,
      reason: isPakAfghanCorridor
        ? 'CROSS_BORDER_CORRIDOR_DISABLED_PENDING_APPROVAL'
        : 'NO_POLICY_FOR_CORRIDOR',
    };
  }

  // Cross-border corridors are DISABLED by default pending verified regulatory approval.
  // Neither Pakistan–Afghanistan corridor can be activated through an environment variable alone.
  if (!policy.consultationAllowed) {
    return {
      ...base(policy),
      allowed: false,
      reason: isPakAfghanCorridor
        ? 'CROSS_BORDER_CORRIDOR_DISABLED_PENDING_APPROVAL'
        : 'CONSULTATION_NOT_ALLOWED',
    };
  }

  // Cross-border stringent regulatory prerequisites
  if (isCrossBorder) {
    // 1. Effective date check
    if (policy.effectiveDate > now) {
      return { ...base(policy), allowed: false, reason: 'POLICY_NOT_YET_EFFECTIVE' };
    }

    // 2. Expiration check
    if (policy.approvalExpiresAt && policy.approvalExpiresAt <= now) {
      return { ...base(policy), allowed: false, reason: 'POLICY_APPROVAL_EXPIRED' };
    }

    // 3. Documented source of legal approval required
    if (!policy.legalApprovalSource || policy.legalApprovalSource.trim().length === 0) {
      return { ...base(policy), allowed: false, reason: 'LEGAL_APPROVAL_SOURCE_REQUIRED' };
    }

    // 4. Human administrative activation with audit trail required
    if (!policy.humanApprovedById || policy.humanApprovedById.trim().length === 0) {
      return { ...base(policy), allowed: false, reason: 'HUMAN_ADMIN_ACTIVATION_REQUIRED' };
    }

    // 5. Authorized scope verification
    const scope = (policy.scope ?? '').toUpperCase();
    if (scope !== 'CROSS_BORDER' && scope !== 'SECOND_OPINION') {
      return { ...base(policy), allowed: false, reason: 'CROSS_BORDER_SCOPE_UNAUTHORIZED' };
    }
  }

  // Individual doctor authorization & credential verification on cross-border corridors
  if (isCrossBorder && opts.doctorProfileId) {
    const doctor = await db.doctorProfile.findUnique({
      where: { id: opts.doctorProfileId },
      include: {
        user: { select: { email: true, name: true, accountStatus: true } },
        jurisdictions: { select: { countryCode: true, status: true, verifiedAt: true, verifiedById: true } },
        credentials: true,
      },
    });

    if (!doctor) {
      return { ...base(policy), allowed: false, reason: 'DOCTOR_NOT_FOUND' };
    }

    const { isDoctorProductionEligible } = await import('./marketplace');
    const eligibility = isDoctorProductionEligible(doctor);
    if (!eligibility.eligible) {
      return { ...base(policy), allowed: false, reason: `DOCTOR_INELIGIBLE:${eligibility.reasons[0]}` };
    }

    const patientCountryAuth = doctor.jurisdictions.find(
      (j) => (j.countryCode ?? '').toUpperCase() === pc
    );
    if (
      !patientCountryAuth ||
      patientCountryAuth.status !== 'LICENSED' ||
      !patientCountryAuth.verifiedAt ||
      !patientCountryAuth.verifiedById
    ) {
      return {
        ...base(policy),
        allowed: false,
        reason: 'DOCTOR_NOT_AUTHORIZED_FOR_PATIENT_JURISDICTION',
      };
    }
  }

  const modeAllowed =
    (opts.type === 'TEXT' && policy.messagingAllowed) ||
    (opts.type === 'AUDIO' && policy.audioAllowed) ||
    (opts.type === 'VIDEO' && policy.videoAllowed);
  if (!modeAllowed) {
    return { ...base(policy), allowed: false, reason: `MODE_NOT_ALLOWED_${opts.type}` };
  }

  if (opts.isMinor && !policy.minorConsultationAllowed) {
    return { ...base(policy), allowed: false, reason: 'MINOR_NOT_ALLOWED' };
  }

  if (opts.isPrescribingRequested && !policy.prescribingAllowed) {
    return { ...base(policy), allowed: false, reason: 'PRESCRIBING_NOT_ALLOWED_IN_JURISDICTION' };
  }

  return {
    ...base(policy),
    allowed: true,
    reason: 'ALLOWED',
  };
}

function base(p: NonNullable<Awaited<ReturnType<typeof db.jurisdictionPolicy.findFirst>>>): JurisdictionDecision {
  return {
    allowed: false,
    policyKey: `${p.countryCode}>${p.doctorCountry}@${p.policyVersion}`,
    policyVersion: p.policyVersion,
    reason: '',
    prescribingAllowed: p.prescribingAllowed,
    controlledDrugAllowed: p.controlledDrugAllowed,
    medicalCertificateAllowed: p.medicalCertificateAllowed,
    requiresGuardian: p.requiresGuardian,
    requiresLocalDoctor: p.requiresLocalDoctor,
    scope: p.scope,
    legalApprovalSource: p.legalApprovalSource,
    approvalExpiresAt: p.approvalExpiresAt,
    humanApprovedById: p.humanApprovedById,
    humanApprovedAt: p.humanApprovedAt,
  };
}
