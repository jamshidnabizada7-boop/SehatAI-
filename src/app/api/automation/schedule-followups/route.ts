// SehatAI — Phase 4: Agentic Automation — Auto Follow-up Scheduler
// GET /api/automation/schedule-followups — admin only
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const user = await db.user.findUnique({ where: { email: session.user.email } });
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const messagesNeedingFollowUp = await db.message.findMany({
    where: {
      triageLevel: { in: ['URGENT', 'ROUTINE'] },
      role: 'assistant',
    },
    take: 20,
    include: { conversation: true },
  });

  let scheduled = 0;
  for (const msg of messagesNeedingFollowUp) {
    if (!msg.conversation.userId) continue;

    const existing = await db.outcomeEntry.findFirst({
      where: { messageId: msg.id },
    });
    if (existing) continue;

    const delay = msg.triageLevel === 'URGENT' ? 24 : 72;
    await db.outcomeEntry.create({
      data: {
        userId: msg.conversation.userId,
        messageId: msg.id,
        conversationId: msg.conversationId,
        scheduledFor: new Date(Date.now() + delay * 60 * 60 * 1000),
        status: 'pending',
      },
    });
    scheduled++;
  }

  return NextResponse.json({
    checked: messagesNeedingFollowUp.length,
    scheduled,
    timestamp: new Date().toISOString(),
  });
}
