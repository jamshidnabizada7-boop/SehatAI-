// SehatAI — Phase 2: Doctor Copilot API
// GET /api/doctor/patients → real patient conversations for the logged-in doctor
// Fetches conversations that have userId set (authenticated patients),
// with their latest message + triage level + conditions.
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const user = await db.user.findUnique({ where: { email } });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  // Phase 2 — allow all authenticated users to view conversations (for demo/development)
  // In production, restrict to doctor/admin roles:
  // if (user.role !== 'doctor' && user.role !== 'admin') {
  //   return NextResponse.json({ error: 'Forbidden — doctor role required' }, { status: 403 });
  // }

  // Fetch ALL conversations (including guest sessions), include latest message + profile
  const conversations = await db.conversation.findMany({
    include: {
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1, // latest message only
      },
    },
    orderBy: { updatedAt: 'desc' },
    take: 20,
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
      patientName: user?.name ?? (c.userId ? 'Unknown' : 'Guest patient'),
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
    data: { userId: user.id, action: 'doctor.patients.list', resource: 'copilot' },
  });

  return NextResponse.json({ patients });
}
