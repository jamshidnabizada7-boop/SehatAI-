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
        messages: { orderBy: { createdAt: 'asc' } },
      },
    })) as unknown as (ConversationRow & { messages: MessageRow[] }) | null;

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
      const doctorProfile = await db.doctorProfile.findUnique({ where: { userId: sessionUserId } });
      if (doctorProfile?.pmdcVerifiedAt && conv.userId) {
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

    if (!isOwnerUser && !isGuestOwner && !isAdmin && !isAuthorizedDoctor) {
      return NextResponse.json({ error: 'conversation not found' }, { status: 404 });
    }

    const messages: ChatMessageDto[] = conv.messages.map((m) => ({
      id: m.id,
      role: (m.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
      content: m.content,
      language: m.language,
      triageLevel: m.triageLevel,
      emergency: m.emergency,
      createdAt: m.createdAt.getTime(),
    }));

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

