// Care Connect §25 — realtime stream for a consultation (SSE transport).
// Events: message | typing | presence | status | read. Participant-only.
import { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { authorizeConsultationAccess, CareAuthzError } from '@/lib/care/care-auth';
import { getRealtime, latestEventAt } from '@/server/care/realtime';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await authorizeConsultationAccess(id, 'consultation.view');
    const since = new URL(req.url).searchParams.get('since') ?? (await latestEventAt(id));
    const realtime = getRealtime();

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        const send = (event: unknown) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        };
        send({ kind: 'connected', since });
        const unsubscribe = realtime.subscribe(id, since, (event) => send(event));
        const heartbeat = setInterval(() => {
          try {
            controller.enqueue(encoder.encode(`: ping\n\n`));
          } catch {
            /* closed */
          }
        }, 25_000);
        req.signal.addEventListener('abort', () => {
          clearInterval(heartbeat);
          unsubscribe();
          try {
            controller.close();
          } catch {
            /* already closed */
          }
        });
      },
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (e) {
    if (e instanceof CareAuthzError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: 'ERROR' }, { status: 500 });
  }
}
