import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const runtime = 'nodejs';

interface ConversationRow {
  id: string;
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
 * Returns the conversation messages (verifies ownership via sessionId).
 * Triage/citation metadata is loaded but content is returned verbatim.
 */
export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await ctx.params;
    const sp = req.nextUrl.searchParams;
    const sessionId = (sp.get('sessionId') ?? '').trim();
    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
    }

    const conv = (await db.conversation.findUnique({
      where: { id },
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
      },
    })) as unknown as (ConversationRow & { messages: MessageRow[] }) | null;

    if (!conv) {
      return NextResponse.json({ error: 'conversation not found' }, { status: 404 });
    }
    if (conv.sessionToken !== sessionId) {
      // don't leak other sessions' content
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
 */
export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await ctx.params;
    const sp = req.nextUrl.searchParams;
    const sessionId = (sp.get('sessionId') ?? '').trim();
    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
    }

    const existing = await db.conversation.findUnique({
      where: { id },
      select: { sessionToken: true },
    });
    if (!existing || existing.sessionToken !== sessionId) {
      return NextResponse.json({ error: 'conversation not found' }, { status: 404 });
    }

    await db.conversation.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'failed to delete conversation' }, { status: 500 });
  }
}
