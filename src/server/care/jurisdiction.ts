// ============================================================
// Care Connect §16 — Jurisdiction engine (mandatory for production).
// Evaluates patient physical jurisdiction + doctor licensing
// jurisdiction + consultation type + applicable policy BEFORE booking.
// If no policy permits the service → booking blocked.
// Nothing regulatory is hardcoded: all rules live in JurisdictionPolicy
// rows (versioned, effective-dated). Absent row = BLOCKED.
// ============================================================
import { db } from '@/lib/db';
import type { ConsultationType } from '@/lib/care/constants';

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
}

export async function evaluateJurisdiction(opts: {
  patientCountry: string;   // §17 DECLARED physical location, never IP-inferred
  doctorCountry: string;    // doctor's licensing jurisdiction
  type: ConsultationType;
  isMinor?: boolean;
}): Promise<JurisdictionDecision> {
  const blocked: JurisdictionDecision = {
    allowed: false, policyKey: null, policyVersion: null,
    reason: 'NO_POLICY_FOR_CORRIDOR',
    prescribingAllowed: false, controlledDrugAllowed: false,
    medicalCertificateAllowed: false, requiresGuardian: false, requiresLocalDoctor: false,
  };
  const pc = opts.patientCountry.toUpperCase();
  const dc = opts.doctorCountry.toUpperCase();

  const policy = await db.jurisdictionPolicy.findFirst({
    where: { countryCode: pc, doctorCountry: dc },
    orderBy: { effectiveDate: 'desc' },
  });
  if (!policy) return blocked;

  if (!policy.consultationAllowed) {
    return { ...base(policy), allowed: false, reason: 'CONSULTATION_NOT_ALLOWED' };
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
  };
}
