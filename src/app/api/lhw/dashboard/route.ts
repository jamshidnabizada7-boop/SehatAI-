// SehatAI — Phase 3: LHW (Lady Health Worker) Dashboard API
// GET /api/lhw/dashboard → patients + reminders for community health workers
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const conversations = await db.conversation.findMany({
    where: { userId: { not: null } },
    include: { messages: { orderBy: { createdAt: 'desc' }, take: 1 } },
    take: 50,
  });

  const patients = conversations.map((c) => {
    const latest = c.messages[0];
    return {
      id: c.userId, conversationId: c.id,
      lastTriage: latest?.triageLevel || 'ROUTINE',
      lastContact: c.updatedAt.toISOString(),
      needsFollowUp: latest?.triageLevel === 'URGENT' || latest?.triageLevel === 'EMERGENCY',
    };
  });

  const reminders = await db.reminder.findMany({
    where: { status: 'active', nextDue: { lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) } },
    take: 20,
  });

  return NextResponse.json({
    summary: { totalPatients: patients.length, needFollowUp: patients.filter((p) => p.needsFollowUp).length, urgentReminders: reminders.length },
    patients,
    reminders: reminders.map((r) => ({ id: r.id, title: r.title, type: r.type, nextDue: r.nextDue.toISOString(), isOverdue: r.nextDue < new Date() })),
  });
}
