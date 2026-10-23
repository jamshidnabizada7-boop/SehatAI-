import { getServerSession, requireActiveDoctor, requireUser } from '@/lib/auth';
import { db } from '@/lib/db';

export async function canReadPatient(patientId: string, scope: 'read_history' | 'soap_draft' = 'read_history'): Promise<boolean> {
  const actor = await requireUser();
  if (actor.id === patientId) return true;
  if (actor.role !== 'doctor') return false;
  const doctor = await requireActiveDoctor();
  return Boolean(await db.patientConsentForDoctor.findFirst({ where: { doctorId: doctor.doctorProfile.id, patientId, scope, revokedAt: null } }));
}

export async function canManageConversation(conv: { userId: string | null; sessionToken: string }, guestSessionId: string): Promise<boolean> {
  const session = await getServerSession();
  if (!session?.user) return !conv.userId && Boolean(guestSessionId) && conv.sessionToken === guestSessionId;
  const actor = await requireUser();
  return conv.userId === actor.id;
}

/** An old appointment never grants open-ended access to every health conversation. */
export async function canReadConversation(conv: { userId: string | null; sessionToken: string }, guestSessionId: string, scope: 'read_history' | 'soap_draft' = 'read_history'): Promise<boolean> {
  const session = await getServerSession();
  if (!session?.user) return !conv.userId && Boolean(guestSessionId) && conv.sessionToken === guestSessionId;
  return conv.userId ? canReadPatient(conv.userId, scope) : false;
}
