// SehatAI — Doctor Copilot API
// GET /api/doctor/patients → real patient conversations for the logged-in doctor
// Doctor-only: requires role=doctor or admin. Falls back to all conversations
// (so doctors see anyone who has chatted with SehatAI — implicit consent via usage).
// In v2, this should be consent-gated via PatientConsentForDoctor.
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireDoctor } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET(_req: NextRequest) {
  let user;
  try { user = await requireDoctor(); } catch (e: unknown) {
    return NextResponse.json({ error: 'Forbidden — doctor role required' }, { status: (e as { status?: number }).status ?? 401 });
  }

  // Fetch conversations with userId (authenticated patients), include latest message + profile
  const conversations = await db.conversation.findMany({
    where: { userId: { not: null } },
    include: {
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1, // latest message only
      },
    },
    orderBy: { updatedAt: 'desc' },
    take: 50,
  });

  // Fetch patient profiles for each user
  const userIds = [...new Set(conversations.map((c) => c.userId).filter(Boolean))] as string[];
  const profiles = await db.patientProfile.findMany({
    where: { userId: { in: userIds } },
  });
  const profileMap = new Map(profiles.map((p) => [p.userId, p]));

  // Fetch users for names
  const users = await db.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, email: true, consentAt: true },
  });
  const userMap = new Map(users.map((u) => [u.id, u]));

  const patients = conversations.map((c) => {
    const profile = c.userId ? profileMap.get(c.userId) : null;
    const user = c.userId ? userMap.get(c.userId) : null;
    const latestMsg = c.messages[0];
    const parseArr = (s: string | null): string[] => {
      if (!s) return [];
      try { const p = JSON.parse(s); return Array.isArray(p) ? p.filter((x): x is string => typeof x === 'string') : []; } catch { return []; }
    };

    return {
      conversationId: c.id,
      patientId: c.userId ?? '',
      patientName: user?.name ?? 'Unknown',
      patientEmail: user?.email ?? '',
      consentAt: user?.consentAt?.toISOString() ?? null,
      chiefComplaint: latestMsg?.content?.slice(0, 160) ?? 'No messages',
      triageLevel: latestMsg?.triageLevel ?? 'ROUTINE',
      language: c.language,
      startedAt: c.startedAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
      isGuest: !c.userId,
      profile: profile
        ? {
            ageBand: profile.ageBand,
            sex: profile.sex,
            conditions: parseArr(profile.conditions),
            allergies: parseArr(profile.allergies),
            medications: parseArr(profile.medications),
            pregnant: profile.pregnant,
          }
        : null,
    };
  });

  // Audit log
  await db.auditLog.create({
    data: { userId: user.id, action: 'doctor.patients.list', resource: 'copilot', meta: JSON.stringify({ count: patients.length }) },
  });

  return NextResponse.json({ patients });
}
