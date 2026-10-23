// ============================================================
// Care Connect §39/§40/§41 — prescriptions (jurisdiction-gated).
// The doctor manually approves/signs; AI NEVER issues a prescription.
// Before signing (§40): patient allergies, known interactions,
// duplicates, pregnancy concerns, dose-format errors, dangerous
// combinations — using the EXISTING drug-interaction engine. The
// doctor's decision (including overrides) is logged.
// §41: controlled drugs disabled until jurisdictional requirements
// are implemented (controlledDrugsEnabled = false default).
// ============================================================
import { db } from '@/lib/db';
import { checkDrugSafety } from '@/lib/drug-interactions';
import { evaluateJurisdiction } from './jurisdiction';
import { ConsultationError } from './consultation-service';
import { auditCare } from './audit';

const CONTROLLED_MARKERS = [
  'tramadol', 'morphine', 'oxycodone', 'fentanyl', 'methadone', 'buprenorphine',
  'alprazolam', 'diazepam', 'lorazepam', 'clonazepam', 'methylphenidate', 'amphetamine',
];

export interface PrescriptionDraftInput {
  consultationId: string;
  items: Array<{
    medicine: string;
    form?: string;
    strength?: string;
    frequency?: string;
    durationDays?: number;
    instructions?: string;
  }>;
  indication?: string;
  instructions?: string;
}

export class PrescriptionError extends Error {
  status: number;
  code: string;
  constructor(code: string, status = 400) {
    super(code);
    this.code = code;
    this.status = status;
  }
}

/** §39 — prescribing permission is resolved per consultation, never hardcoded. */
async function assertPrescribingAllowed(consultationId: string) {
  const c = await db.consultation.findUnique({
    where: { id: consultationId },
    select: { patientCountry: true, doctorCountry: true, doctorProfileId: true, status: true, jurisdictionKey: true, policyVersion: true },
  });
  if (!c) throw new PrescriptionError('CONSULTATION_NOT_FOUND', 404);
  if (!['WAITING', 'IN_PROGRESS'].includes(c.status)) {
    throw new PrescriptionError(`PRESCRIBING_STATE_BLOCKED:${c.status}`, 409);
  }
  const decision = await evaluateJurisdiction({
    patientCountry: c.patientCountry ?? 'PK',
    doctorCountry: c.doctorCountry ?? 'PK',
    type: 'TEXT', // prescribing rides on any permitted consultation mode
    doctorProfileId: c.doctorProfileId,
    isPrescribingRequested: true,
  });
  if (!decision.allowed || !decision.prescribingAllowed) {
    throw new PrescriptionError('PRESCRIBING_NOT_ALLOWED_IN_JURISDICTION', 403);
  }
  return decision;
}

/** §40 — pre-sign safety check reusing the existing engine. */
export async function runPrescriptionSafetyCheck(opts: { consultationId: string; items: PrescriptionDraftInput['items'] }) {
  const c = await db.consultation.findUnique({
    where: { id: opts.consultationId },
    include: { patient: { include: { profiles: true } } },
  });
  if (!c) throw new PrescriptionError('CONSULTATION_NOT_FOUND', 404);
  const profileRow = c.patient.profiles[0];
  const parse = (v: string | null | undefined, fallback: string[]) => {
    try {
      return (JSON.parse(v ?? '') as string[]) ?? fallback;
    } catch {
      return fallback;
    }
  };
  const allergies = parse(profileRow?.allergies, []);
  const currentMedications = parse(profileRow?.medications, []);
  const pregnant = profileRow?.pregnant === true;

  const text = opts.items
    .map((i) => `${i.medicine} ${i.strength ?? ''} ${i.frequency ?? ''} ${i.instructions ?? ''}`)
    .join(', ');
  const result = checkDrugSafety({
    text,
    allergies,
    currentMedications: [...currentMedications, ...opts.items.map((i) => i.medicine)],
    pregnant,
    breastfeeding: false,
    ageBand: 'middle-adult',
    conditions: [],
  });

  const duplicateMeds = opts.items
    .map((i) => i.medicine.toLowerCase())
    .filter((m, idx, arr) => arr.indexOf(m) !== idx);
  const controlled = opts.items.filter((i) =>
    CONTROLLED_MARKERS.some((marker) => i.medicine.toLowerCase().includes(marker)),
  );

  return {
    drugCheck: result,
    duplicates: duplicateMeds,
    controlledItems: controlled.map((i) => i.medicine),
    pregnancyFlag: pregnant,
    doseFormatIssues: opts.items
      .filter((i) => i.strength && !/^\d+(\.\d+)?\s*(mg|ml|mcg|g|iu)$/i.test(i.strength.trim()))
      .map((i) => i.medicine),
  };
}

export async function createPrescriptionDraft(opts: { consultationId: string; doctorUserId: string; input: PrescriptionDraftInput }) {
  const decision = await assertPrescribingAllowed(opts.consultationId);
  const c = await db.consultation.findUnique({
    where: { id: opts.consultationId },
    include: { doctorProfile: true },
  });
  if (!c || !c.doctorProfile) throw new PrescriptionError('CONSULTATION_NOT_FOUND', 404);
  if (c.doctorUserId !== opts.doctorUserId) throw new PrescriptionError('NOT_YOUR_CONSULTATION', 403);

  const safety = await runPrescriptionSafetyCheck({ consultationId: opts.consultationId, items: opts.input.items });
  if (safety.controlledItems.length > 0) {
    // §41 — hard block until jurisdiction requirements are implemented.
    throw new PrescriptionError('CONTROLLED_DRUGS_DISABLED', 403);
  }

  const prescription = await db.prescription.create({
    data: {
      consultationId: opts.consultationId,
      doctorProfileId: c.doctorProfileId,
      patientId: c.patientId,
      jurisdiction: c.patientCountry ?? 'PK',
      status: 'DRAFT',
      indication: opts.input.indication?.slice(0, 500),
      instructions: opts.input.instructions?.slice(0, 2000),
      doctorRegistrationNumber: c.doctorProfile.pmdcNumber,
      doctorNameSnapshot: (await db.user.findUnique({ where: { id: opts.doctorUserId }, select: { name: true } }))?.name ?? 'Doctor',
      safetyCheckJson: JSON.stringify({ ...safety, jurisdictionKey: decision.policyKey }),
      expiresAt: new Date(Date.now() + 30 * 24 * 3600_000),
      items: {
        create: opts.input.items.map((i) => ({
          medicine: i.medicine.slice(0, 200),
          form: i.form?.slice(0, 50),
          strength: i.strength?.slice(0, 50),
          frequency: i.frequency?.slice(0, 100),
          durationDays: i.durationDays ?? null,
          instructions: i.instructions?.slice(0, 500),
        })),
      },
    },
    include: { items: true },
  });
  return { prescription, safety };
}

/** §39 — only the doctor signs; the signature event is audited. */
export async function signPrescription(opts: { prescriptionId: string; doctorUserId: string; overrideReason?: string }) {
  const prescription = await db.prescription.findUnique({
    where: { id: opts.prescriptionId },
    include: { consultation: { select: { doctorUserId: true } }, items: true },
  });
  if (!prescription) throw new PrescriptionError('PRESCRIPTION_NOT_FOUND', 404);
  if (prescription.consultation.doctorUserId !== opts.doctorUserId) {
    throw new PrescriptionError('NOT_YOUR_PRESCRIPTION', 403);
  }
  if (prescription.status !== 'DRAFT') throw new PrescriptionError('ALREADY_SIGNED_OR_CANCELLED', 409);
  await assertPrescribingAllowed(prescription.consultationId);

  // Re-run safety at signing time (patient data may have changed).
  const safety = await runPrescriptionSafetyCheck({
    consultationId: prescription.consultationId,
    items: prescription.items.map((i) => ({
      medicine: i.medicine, form: i.form ?? undefined, strength: i.strength ?? undefined,
      frequency: i.frequency ?? undefined, durationDays: i.durationDays ?? undefined,
      instructions: i.instructions ?? undefined,
    })),
  });
  const highSeverity = safety.drugCheck.overallSeverity === 'HIGH';
  if (safety.controlledItems.length) throw new PrescriptionError('CONTROLLED_DRUGS_DISABLED', 403);
  if (highSeverity && !opts.overrideReason?.trim()) {
    throw new PrescriptionError('SAFETY_OVERRIDE_REASON_REQUIRED', 409);
  }

  const signed = await db.prescription.update({
    where: { id: opts.prescriptionId },
    data: {
      status: 'SIGNED',
      issuedAt: new Date(),
      signatureRef: `sig_${opts.prescriptionId}`,
      safetyOverrideReason: highSeverity ? opts.overrideReason?.slice(0, 500) : null,
      safetyCheckJson: JSON.stringify({ signedAtSafety: safety }),
    },
  });
  await auditCare({
    actorId: opts.doctorUserId, actorRole: 'DOCTOR', action: 'prescription.signed',
    consultationId: prescription.consultationId,
    detail: { prescriptionId: signed.id, override: highSeverity || undefined },
  });
  return signed;
}

export async function cancelPrescription(opts: { prescriptionId: string; doctorUserId: string }) {
  const prescription = await db.prescription.findUnique({
    where: { id: opts.prescriptionId },
    include: { consultation: { select: { doctorUserId: true } } },
  });
  if (!prescription) throw new PrescriptionError('PRESCRIPTION_NOT_FOUND', 404);
  if (prescription.consultation.doctorUserId !== opts.doctorUserId) {
    throw new PrescriptionError('NOT_YOUR_PRESCRIPTION', 403);
  }
  return db.prescription.update({ where: { id: opts.prescriptionId }, data: { status: 'CANCELLED' } });
}

void ConsultationError;
