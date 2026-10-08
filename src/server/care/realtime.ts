// ============================================================
// Care Connect §25 — RealtimeProvider abstraction.
// Serverless (Vercel) cannot hold long-lived WebSockets, so the
// default transport is SSE + database watermark polling, which
// works everywhere. A self-hosted WebSocket adapter is scaffolded
// for the dedicated realtime service path. Transport choice is
// env-driven; callers only publish/subscribe.
// ============================================================
import { db } from '@/lib/db';

export interface RealtimeEvent {
  kind: 'message' | 'typing' | 'presence' | 'status' | 'read';
  consultationId: string;
  data: unknown;
  at?: string;
}

// ---- In-process fan-out (single-instance dev; SSE loops poll the DB
// watermark so multi-instance deployments stay correct regardless). ----
type Subscriber = (event: RealtimeEvent) => void;
const channels = new Map<string, Set<Subscriber>>();

function subscribeLocal(consultationId: string, fn: Subscriber): () => void {
  const set = channels.get(consultationId) ?? new Set<Subscriber>();
  set.add(fn);
  channels.set(consultationId, set);
  return () => {
    set.delete(fn);
    if (set.size === 0) channels.delete(consultationId);
  };
}

function publishLocal(event: RealtimeEvent): void {
  const set = channels.get(event.consultationId);
  if (!set) return;
  for (const fn of set) {
    try {
      fn(event);
    } catch {
      /* subscriber errors never break the publisher */
    }
  }
}

export interface RealtimeProvider {
  readonly transport: 'sse-poll' | 'websocket';
  publish(event: RealtimeEvent): Promise<void>;
  /** Returns a cancel function. `since` is an ISO watermark. */
  subscribe(consultationId: string, since: string, fn: Subscriber): () => void;
}

class SsePollingRealtime implements RealtimeProvider {
  readonly transport = 'sse-poll' as const;

  async publish(event: RealtimeEvent): Promise<void> {
    publishLocal(event); // instant on the same instance
    // Watermark in DB makes events durable for pollers on other instances.
    await db.consultationAuditEvent
      .create({
        data: {
          consultationId: event.consultationId,
          action: `realtime.${event.kind}`,
          detailJson: JSON.stringify(event.data ?? {}),
        },
      })
      .catch(() => undefined);
  }

  subscribe(consultationId: string, since: string, fn: Subscriber): () => void {
    const unsubscribeLocal = subscribeLocal(consultationId, fn);
    let cursor = since;
    const timer = setInterval(async () => {
      try {
        const events = await db.consultationAuditEvent.findMany({
          where: {
            consultationId,
            action: { startsWith: 'realtime.' },
            createdAt: { gt: new Date(cursor) },
          },
          orderBy: { createdAt: 'asc' },
          take: 50,
        });
        for (const ev of events) {
          cursor = ev.createdAt.toISOString();
          fn({
            kind: ev.action.replace('realtime.', '') as RealtimeEvent['kind'],
            consultationId,
            data: ev.detailJson ? JSON.parse(ev.detailJson) : null,
            at: ev.createdAt.toISOString(),
          });
        }
      } catch {
        /* transient DB errors: keep polling */
      }
    }, 2000);
    return () => {
      clearInterval(timer);
      unsubscribeLocal();
    };
  }
}

/**
 * Self-hosted WebSocket adapter (§25): used when a dedicated realtime
 * service is deployed (mini-services/video-signal pattern). Signaling
 * relay is provider-side; the app only publishes through its HTTP API.
 */
class WebSocketRealtimeAdapter implements RealtimeProvider {
  readonly transport = 'websocket' as const;
  constructor(private readonly relayUrl: string) {}

  async publish(event: RealtimeEvent): Promise<void> {
    publishLocal(event);
    // POST to the relay service; the relay fans out to connected sockets.
    await fetch(`${this.relayUrl}/publish`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(event),
    }).catch(() => undefined);
  }

  subscribe(consultationId: string, since: string, fn: Subscriber): () => void {
    // Fallback to DB polling for missed events; live push arrives via relay.
    return new SsePollingRealtime().subscribe(consultationId, since, fn);
  }
}

export function getRealtime(): RealtimeProvider {
  const wsUrl = process.env.CARE_REALTIME_WS_URL;
  if (wsUrl) return new WebSocketRealtimeAdapter(wsUrl);
  return new SsePollingRealtime();
}

/** Durable watermark for `since` cursors: last event the client saw. */
export async function latestEventAt(consultationId: string): Promise<string> {
  const last = await db.consultationAuditEvent.findFirst({
    where: { consultationId, action: { startsWith: 'realtime.' } },
    orderBy: { createdAt: 'desc' },
    select: { createdAt: true },
  });
  return (last?.createdAt ?? new Date(0)).toISOString();
}
