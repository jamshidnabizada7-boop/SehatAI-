import { NextRequest, NextResponse } from 'next/server';
import { runPipeline } from '@/server/pipeline/run';
import { db } from '@/lib/db';
import { getServerSession, requireUser } from '@/lib/auth';
import { runOfflineEngine } from '@/lib/engine/safety-engine';
import { publicPipelineEvent } from '@/server/public-pipeline-event';
import { rateLimit, RATE_LIMITS, clientIpFrom } from '@/lib/care/rate-limit';
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
async function resolveUserAndProfile(): Promise<{ userId?: string; profile?: ServerHealthProfile; allowExternalAI?: boolean }> {
  try {
    const session = await getServerSession();
    // Guests get full AI answers (product decision 2026-10-24). Signed-in users
    // follow their recorded data-processing consent, so a revocation is honored.
    if (!(session?.user as { id?: string } | undefined)?.id) return { allowExternalAI: true };
    const actor = await requireUser();
    const sessionUserId = actor.id;
    const [row, user] = await Promise.all([db.patientProfile.findUnique({ where: { userId: sessionUserId } }), db.user.findUnique({ where: { id: sessionUserId }, select: { consentAt: true } })]);
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
    return { userId: sessionUserId, profile, allowExternalAI: Boolean(user?.consentAt) };
  } catch (error) {
    throw error;
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
  let body: { message?: unknown; language?: unknown; sessionId?: unknown; conversationId?: unknown; history?: unknown };
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
  if (message.length > 4000 || (Array.isArray(body.history) && body.history.length > 2000)) return NextResponse.json({ error: 'Conversation is too large for this request; use local guidance or start a new conversation.' }, { status: 413 });
  const clientHistory = Array.isArray(body.history) ? body.history.filter((m): m is { id?: string; role: string; content: string; createdAt?: string } => Boolean(m && typeof m === 'object' && ['user', 'assistant'].includes(m.role) && typeof m.content === 'string' && m.content.length <= 4000)).map(m => ({ id: typeof m.id === 'string' ? m.id : undefined, role: m.role, content: m.content })) : [];
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
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ stage, data: publicPipelineEvent(stage, data) })}\n\n`));
        } catch {
          // client disconnected — stop writing
          closed = true;
        }
      };

      try {
        const { userId, profile, allowExternalAI = false } = await resolveUserAndProfile();
        const rl = await rateLimit(`chat:${userId ?? clientIpFrom(req)}`, RATE_LIMITS.chat.limit, RATE_LIMITS.chat.windowSeconds);
        await runPipeline({ message, language, sessionId, conversationId, userId, profile, clientHistory, allowExternalAI: allowExternalAI && rl.allowed, localGuidanceReason: rl.allowed ? 'consent' : 'rate-limit' }, send);
      } catch {
        // Absolute guard: the pipeline itself never throws, but if it somehow
        // does, still close the stream gracefully with error + done.
        const local = runOfflineEngine(message, language === 'auto' ? undefined : language, clientHistory);
        const fallbackContent = local.content;
        send('error', { message: 'An unexpected error occurred.', fallbackContent });
        send('done', {
          messageId: '',
          conversationId: conversationId ?? '',
          content: fallbackContent,
          language: language === 'auto' ? 'en' : language,
          triage: local.triage,
          citations: [],
          validation: { verdict: 'fallback', checks: [{ name: 'serviceError', passed: false }], latencyMs: 0 },
          offline: true,
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
