// Care Connect — audit helper. Every staff/financial/clinical action
// lands in ConsultationAuditEvent (when consultation-scoped) and the
// global AuditLog (always). Never log PHI content.
import { db } from '@/lib/db';

export async function auditCare(opts: {
  actorId?: string;
  actorRole?: string;
  action: string;
  consultationId?: string;
  detail?: Record<string, unknown>;
  ip?: string;
}): Promise<void> {
  const meta = opts.detail ? JSON.stringify(opts.detail) : undefined;
  await Promise.all([
    db.auditLog.create({
      data: {
        userId: opts.actorId,
        action: opts.action,
        resource: opts.consultationId,
        meta,
        ip: opts.ip,
      },
    }).catch(() => undefined),
    opts.consultationId
      ? db.consultationAuditEvent.create({
          data: {
            consultationId: opts.consultationId,
            action: opts.action,
            actorId: opts.actorId,
            actorRole: opts.actorRole,
            detailJson: meta,
          },
        }).catch(() => undefined)
      : Promise.resolve(),
  ]);
}
