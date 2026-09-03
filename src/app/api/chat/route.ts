import { NextRequest, NextResponse } from 'next/server';
import { runPipeline } from '@/server/pipeline/run';
import { db } from '@/lib/db';
import { getServerSession } from '@/lib/auth';
import { sanitizeProfileServer, type ServerHealthProfile } from '@/lib/profile-server';
import type { Lang, PipelineStage } from '@/lib/types';

export const runtime = 'nodejs';

/**
 * POST /api/chat — SSE streaming pipeline.
 * Each event is a single `data: {stage, data}\n\n` line pair.
 * NEVER returns a raw 500 mid-stream: on failure the stream still ends
 * with error + done events carrying safe fallback content.
 *
 * Phase 1: resolves the session user + their stored patient profile and
 * passes both into the pipeline (profile-aware triage W1, drug checks W4).
 * Guests proceed exactly as before (profile = null).
 */
async function resolveUserAndProfile(): Promise<{ userId?: string; profile?: ServerHealthProfile }> {
  try {
    const session = await getServerSession();
    const sessionUserId = (session?.user as { id?: string } | undefined)?.id;
    if (!sessionUserId) return {};
    const row = await db.patientProfile.findUnique({ where: { userId: sessionUserId } });
    const profile = row
      ? sanitizeProfileServer({
          ageBand: row.ageBand as ServerHealthProfile['ageBand'],
          sex: row.sex as ServerHealthProfile['sex'],
          conditions: safeParseArr(row.conditions) as string[],
          allergies: safeParseArr(row.allergies) as string[],
          medications: safeParseArr(row.medications) as string[],
          pregnant: row.pregnant,
          iceContacts: safeParseArr(row.iceContacts) as ServerHealthProfile['iceContacts'],
          updatedAt: row.updatedAt.getTime(),
        })
      : undefined;
    return { userId: sessionUserId, profile };
  } catch {
    return {}; // guest / demo mode — pipeline must not depend on auth
  }
}

function safeParseArr(s: string | null | undefined): unknown[] {
  if (!s) return [];
  try {
    const p = JSON.parse(s);
    return Array.isArray(p) ? p : [];
  } catch {
    return [];
  }
}

export async function POST(req: NextRequest) {
  let body: { message?: unknown; language?: unknown; sessionId?: unknown; conversationId?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const message = typeof body.message === 'string' ? body.message.trim() : '';
  const sessionId = typeof body.sessionId === 'string' && body.sessionId.trim() ? body.sessionId.trim() : '';
  const language = (['en', 'ur', 'roman', 'auto'] as const).includes(body.language as never)
    ? (body.language as Lang | 'auto')
    : 'auto';
  const conversationId =
    typeof body.conversationId === 'string' && body.conversationId.trim() ? body.conversationId.trim() : undefined;

  if (!message) {
    return NextResponse.json({ error: 'message is required' }, { status: 400 });
  }
  if (!sessionId) {
    return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let closed = false;
      const send = (stage: PipelineStage, data: unknown) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ stage, data })}\n\n`));
        } catch {
          // client disconnected — stop writing
          closed = true;
        }
      };

      try {
        const { userId, profile } = await resolveUserAndProfile();
        await runPipeline({ message, language, sessionId, conversationId, userId, profile }, send);
      } catch {
        // Absolute guard: the pipeline itself never throws, but if it somehow
        // does, still close the stream gracefully with error + done.
        const fallbackContent =
          '⚠️ An unexpected error occurred. If this is an emergency, call 1122 (Rescue) or 1166 (Health Helpline) now. Otherwise, please try again or visit your nearest health facility.';
        send('error', { message: 'An unexpected error occurred.', fallbackContent });
        send('done', {
          messageId: '',
          conversationId: conversationId ?? '',
          content: fallbackContent,
          language: 'en',
          triage: {
            level: 'ROUTINE',
            reason: 'Service error — please retry or see a doctor.',
            signals: [],
            engine: 'offline',
            shortCircuited: false,
          },
          citations: [],
          validation: { verdict: 'fallback', checks: [{ name: 'serviceError', passed: false }], latencyMs: 0 },
          offline: false,
          latencyMs: 0,
        });
      } finally {
        if (!closed) {
          try {
            controller.close();
          } catch {
            // already closed
          }
        }
        closed = true;
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
