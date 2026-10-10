import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from '@/lib/auth';

export const runtime = 'nodejs';

interface ConversationRow {
  id: string;
  userId: string | null;
  sessionToken: string;
  language: string;
  offline: boolean;
  startedAt: Date;
  updatedAt: Date;
}

interface MessageRow {
  id: string;
  conversationId: string;
  role: string;
  content: string;
  language: string;
  triageLevel: string | null;
  redFlags: string | null;
  citations: string | null;
  pipelineMeta: string | null;
  emergency: boolean;
  createdAt: Date;
}

interface ChatMessageDto {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  language: string;
  triageLevel: string | null;
  emergency: boolean;
  createdAt: number;
}

/**
 * GET /api/conversations/[id]?sessionId=X
 * Returns the conversation messages.
 * Authorized for conversation owner, guest creator (matching sessionId when userId is null),
 * admin, or active doctor with patient consent/appointment.
 */
export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await ctx.params;
    const sp = req.nextUrl.searchParams;
    const sessionId = (sp.get('sessionId') ?? '').trim();

    const conv = (await db.conversation.findUnique({
      where: { id },
      include: {
        messages: {
          include: { triageEvents: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    })) as unknown as (ConversationRow & { messages: (MessageRow & { triageEvents?: Array<{ level: string; engine: string; shortCircuited: boolean; signals: string }> })[] }) | null;

    if (!conv) {
      return NextResponse.json({ error: 'conversation not found' }, { status: 404 });
    }

    const session = await getServerSession();
    const sessionUserId = session?.user && (session.user as { id?: string }).id;
    const isOwnerUser = Boolean(sessionUserId && conv.userId === sessionUserId);
    const isAdmin = session?.user && (session.user as { role?: string }).role === 'admin';
    const isGuestOwner = Boolean(!conv.userId && sessionId && conv.sessionToken === sessionId);

    let isAuthorizedDoctor = false;
    if (session?.user && (session.user as { role?: string }).role === 'doctor' && sessionUserId) {
      // 1. Check Care Connect consultation where doctor is assigned to this patient
      if (conv.userId) {
        const careConsult = await db.consultation.findFirst({
          where: {
            doctorUserId: sessionUserId,
            patientId: conv.userId,
          },
        });
        if (careConsult) {
          isAuthorizedDoctor = true;
        }
      }

      // 2. Check legacy consent / appointment
      if (!isAuthorizedDoctor) {
        const doctorProfile = await db.doctorProfile.findUnique({ where: { userId: sessionUserId } });
        if (doctorProfile && conv.userId) {
          const consent = await db.patientConsentForDoctor.findFirst({
            where: { doctorId: doctorProfile.id, patientId: conv.userId, revokedAt: null },
          });
          const appointment = await db.appointment.findFirst({
            where: { doctorProfileId: doctorProfile.id, patientId: conv.userId },
          });
          if (consent || appointment) {
            isAuthorizedDoctor = true;
          }
        }
      }
    }

    if (!isOwnerUser && !isGuestOwner && !isAdmin && !isAuthorizedDoctor) {
      return NextResponse.json({ error: 'conversation not found' }, { status: 404 });
    }

    const messages = conv.messages.map((m) => {
      let meta: Record<string, unknown> | null = null;
      if (m.pipelineMeta) {
        try { meta = JSON.parse(m.pipelineMeta); } catch {}
      }
      let citations: unknown[] = [];
      if (m.citations) {
        try { citations = JSON.parse(m.citations); } catch {}
      }
      let redFlags: unknown[] = [];
      if (m.redFlags) {
        try { redFlags = JSON.parse(m.redFlags); } catch {}
      }

      const latestTriageEvent = m.triageEvents?.[m.triageEvents.length - 1];
      const isShortCircuited =
        latestTriageEvent?.shortCircuited ??
        (meta?.path === 'emergency-short-circuit' || Boolean((meta?.l0 as Record<string, unknown> | undefined)?.shortCircuited) || m.emergency);

      const triage = m.triageLevel ? {
        level: m.triageLevel,
        engine: latestTriageEvent?.engine ?? (meta?.engine as string) ?? (m.emergency ? 'L0' : 'L1'),
        shortCircuited: Boolean(isShortCircuited),
        reason: (meta?.templateCategory as string) ?? '',
        signals: latestTriageEvent?.signals ? JSON.parse(latestTriageEvent.signals) : (meta?.l0 as Record<string, unknown> | undefined)?.signals ?? [],
      } : undefined;

      return {
        id: m.id,
        role: (m.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
        content: m.content,
        language: m.language,
        triageLevel: m.triageLevel,
        emergency: m.emergency,
        triage,
        pipelineMeta: meta,
        citations,
        redFlags,
        latencyMs: (meta?.latencies as Record<string, unknown> | undefined)?.total ?? (meta?.latencies as Record<string, unknown> | undefined)?.l0,
        createdAt: m.createdAt.getTime(),
      };
    });

    return NextResponse.json({
      conversation: {
        id: conv.id,
        language: conv.language,
        offline: conv.offline,
        startedAt: conv.startedAt.toISOString(),
        updatedAt: conv.updatedAt.toISOString(),
        messages,
      },
    });
  } catch {
    return NextResponse.json({ error: 'failed to load conversation' }, { status: 500 });
  }
}

/**
 * DELETE /api/conversations/[id]?sessionId=X
 * Permanently deletes a conversation and all its messages (cascade).
 * Allowed for conversation owner, guest creator (matching sessionId when userId is null), or admin.
 */
export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await ctx.params;
    const sp = req.nextUrl.searchParams;
    const sessionId = (sp.get('sessionId') ?? '').trim();

    const existing = await db.conversation.findUnique({
      where: { id },
      select: { sessionToken: true, userId: true },
    });
    if (!existing) {
      return NextResponse.json({ error: 'conversation not found' }, { status: 404 });
    }

    const session = await getServerSession();
    const sessionUserId = session?.user && (session.user as { id?: string }).id;
    const isOwnerUser = Boolean(sessionUserId && existing.userId === sessionUserId);
    const isAdmin = session?.user && (session.user as { role?: string }).role === 'admin';
    const isGuestOwner = Boolean(!existing.userId && sessionId && existing.sessionToken === sessionId);

    if (!isOwnerUser && !isGuestOwner && !isAdmin) {
      return NextResponse.json({ error: 'conversation not found' }, { status: 404 });
    }

    await db.conversation.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'failed to delete conversation' }, { status: 500 });
  }
}

