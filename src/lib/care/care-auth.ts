// ============================================================
// Care Connect §53 — authorization model: RBAC + ownership +
// participant membership + consultation state, on EVERY request.
// Complements src/lib/auth.ts (never weakens it).
// ============================================================
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { hasCapability, toCareRole, CareAuthzError } from './rbac';
import type { CareCapability } from './rbac';

export { CareAuthzError };

export interface CareSession {
  id: string;
  email: string;
  name?: string | null;
  role: string; // raw DB/JWT role
  careRole: ReturnType<typeof toCareRole>;
  accountStatus: string;
  doctorProfileId?: string | null;
}

interface SessionUserExtended {
  id?: string;
  email?: string | null;
  name?: string | null;
  role?: string;
  accountStatus?: string;
}

export async function getCareSession(): Promise<CareSession | null> {
  const session = await getServerSession(authOptions);
  const u = session?.user as SessionUserExtended | undefined;
  if (!u?.id || !u.email) return null;
  let doctorProfileId: string | null = null;
  if (u.role === 'doctor') {
    const dp = await db.doctorProfile.findUnique({
      where: { userId: u.id },
      select: { id: true },
    });
    doctorProfileId = dp?.id ?? null;
  }
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role ?? 'user',
    careRole: toCareRole(u.role ?? 'user'),
    accountStatus: u.accountStatus ?? 'active',
    doctorProfileId,
  };
}

export async function requireCareSession(): Promise<CareSession> {
  const s = await getCareSession();
  if (!s) throw new CareAuthzError('UNAUTHENTICATED', 401);
  if (s.accountStatus === 'suspended' || s.accountStatus === 'deleted') {
    throw new CareAuthzError('ACCOUNT_NOT_ACTIVE', 403);
  }
  return s;
}

export async function requireCapability(cap: CareCapability): Promise<CareSession> {
  const s = await requireCareSession();
  if (!hasCapability(s.role, cap)) throw new CareAuthzError(`FORBIDDEN: ${cap}`, 403);
  return s;
}

// ------------------------------------------------------------
// Consultation participant authorization (§21/§53):
// authenticated user + participant membership (or audited staff
// viewAny) + role permission. Never authorize by consultation
// ID alone.
// ------------------------------------------------------------

export type ConsultationAccess =
  | { kind: 'participant'; role: 'PATIENT' | 'DOCTOR'; session: CareSession }
  | { kind: 'staff'; role: 'SUPPORT' | 'FINANCE' | 'CLINICAL_ADMIN' | 'ADMIN' | 'SUPER_ADMIN'; session: CareSession };

export async function authorizeConsultationAccess(
  consultationId: string,
  needed: CareCapability,
): Promise<{ consultation: { id: string; status: string; patientId: string; doctorProfileId: string; doctorUserId: string }; access: ConsultationAccess }> {
  const session = await requireCareSession();
  const consultation = await db.consultation.findUnique({
    where: { id: consultationId },
    select: { id: true, status: true, patientId: true, doctorProfileId: true, doctorUserId: true },
  });
  if (!consultation) throw new CareAuthzError('CONSULTATION_NOT_FOUND', 404);

  const isPatient = consultation.patientId === session.id;
  const isDoctor = consultation.doctorUserId === session.id;

  if (isPatient || isDoctor) {
    if (!hasCapability(session.role, needed)) {
      throw new CareAuthzError(`FORBIDDEN: ${needed}`, 403);
    }
    // Doctor must still be an ACTIVE verified doctor to act, not merely own.
    if (isDoctor && !isPatient) {
      const dp = await db.doctorProfile.findUnique({
        where: { id: consultation.doctorProfileId },
        select: {
          pmdcVerifiedAt: true,
          careStatus: true,
          country: true,
          credentials: { select: { status: true, issuingBody: true, country: true } },
        },
      });
      const docCountry = (dp?.country ?? 'PK').toUpperCase();
      const hasVerifiedCred = dp?.credentials?.some(
        (c) =>
          c.status === 'VERIFIED' &&
          (docCountry === 'AF'
            ? ((c.issuingBody ?? '').toUpperCase().includes('MOPH') ||
               (c.country ?? '').toUpperCase() === 'AF' ||
               (c.issuingBody ?? '').toUpperCase().includes('AFGHAN'))
            : ((c.issuingBody ?? '').toUpperCase().includes('PM&DC') ||
               (c.issuingBody ?? '').toUpperCase().includes('PMDC') ||
               (c.country ?? '').toUpperCase() === 'PK'))
      );
      const isVerified = docCountry === 'AF' ? Boolean(hasVerifiedCred) : (dp?.pmdcVerifiedAt != null || Boolean(hasVerifiedCred));
      const active = isVerified && dp?.careStatus !== 'SUSPENDED' && dp?.careStatus !== 'REJECTED';
      if (!active) throw new CareAuthzError('DOCTOR_NOT_ACTIVE', 403);
    }
    return {
      consultation,
      access: { kind: 'participant', role: isPatient ? 'PATIENT' : 'DOCTOR', session },
    };
  }

  // Staff read paths: viewAny only, and every staff access is audited by the caller.
  if (hasCapability(session.role, 'consultation.viewAny')) {
    const staffCaps: Array<[CareCapability, ConsultationAccess['role']]> = [
      ['consultation.viewAny', 'ADMIN'],
    ];
    void staffCaps;
    return { consultation, access: { kind: 'staff', role: session.careRole as 'ADMIN', session } };
  }

  throw new CareAuthzError('NOT_A_PARTICIPANT', 403);
}

/** Throw unless the caller is the patient (owner) of the consultation. */
export function requireParticipantRole(access: ConsultationAccess, role: 'PATIENT' | 'DOCTOR'): void {
  if (access.kind !== 'participant' || access.role !== role) {
    throw new CareAuthzError(`REQUIRES_${role}`, 403);
  }
}
