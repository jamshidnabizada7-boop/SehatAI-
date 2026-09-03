import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  shapeConversationListItem,
  sortConversationsNewestFirst,
} from '@/server/conversation-history';

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
  triageLevel: string | null;
  emergency: boolean;
  createdAt: Date;
}

/**
 * GET /api/conversations?sessionId=X&limit=50
 * Lists conversations for a session, newest first, with a preview of the
 * last user message + the highest triage level reached.
 */
export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const sessionId = (sp.get('sessionId') ?? '').trim();
    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
    }
    const limitRaw = parseInt(sp.get('limit') ?? '50', 10);
    const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, 100) : 50;

    const rows = (await db.conversation.findMany({
      where: { sessionToken: sessionId },
      orderBy: { updatedAt: 'desc' },
      take: limit,
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          select: { id: true, role: true, content: true, triageLevel: true, emergency: true, createdAt: true },
        },
      },
    })) as unknown as (ConversationRow & { messages: MessageRow[] })[];

    const items = sortConversationsNewestFirst(rows.map(shapeConversationListItem));

    return NextResponse.json({ conversations: items, count: items.length });
  } catch {
    return NextResponse.json({ conversations: [], count: 0, error: 'failed to load conversations' }, { status: 200 });
  }
}
