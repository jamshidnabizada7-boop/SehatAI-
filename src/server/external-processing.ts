import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { rateLimit, RATE_LIMITS } from '@/lib/care/rate-limit';

/** Shared authorization before sensitive media leaves the service. */
export async function requireExternalProcessingUser() {
  const actor = await requireUser();
  const user = await db.user.findUnique({ where: { id: actor.id }, select: { consentAt: true } });
  if (!user?.consentAt) throw Object.assign(new Error('Explicit data-processing consent is required.'), { status: 403 });
  const limit = await rateLimit(`external-media:${actor.id}`, RATE_LIMITS.aiEndpoints.limit, RATE_LIMITS.aiEndpoints.windowSeconds);
  if (!limit.allowed) throw Object.assign(new Error('Please wait before trying again.'), { status: 429 });
  return actor;
}
