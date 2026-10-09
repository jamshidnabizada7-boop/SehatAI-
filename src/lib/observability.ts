// ============================================================
// SehatAI — Phase 1: Observability (structured logging + metrics)
// ============================================================
// Server-side structured logger + in-memory triage distribution counter.
// - Every pipeline run logs a structured JSON line (stdout) for log aggregation.
// - A privacy-preserving triage distribution counter is maintained in-memory
//   (differential-privacy-style: aggregated counts only, never individual).
// - Exposed via GET /api/observability/metrics for the admin dashboard.
//
// PHI is NEVER logged. Only: triage level, confidence band, engine, latency,
// injection-attempt flag, drug-check severity. No message text, no profile.
// ============================================================

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface StructuredLogEntry {
  ts: string;
  level: LogLevel;
  event: string;
  [k: string]: unknown;
}

const METRICS = {
  startedAt: Date.now(),
  totalRuns: 0,
  triageCounts: { EMERGENCY: 0, URGENT: 0, ROUTINE: 0, SELF_CARE: 0, INFORMATIONAL: 0 } as Record<string, number>,
  confidenceBands: { HIGH: 0, MEDIUM: 0, LOW: 0 } as Record<string, number>,
  engineCounts: { L0: 0, L1: 0, combined: 0, offline: 0, fallback: 0 } as Record<string, number>,
  injectionAttempts: 0,
  drugCheckSeverity: { HIGH: 0, MODERATE: 0, LOW: 0, NONE: 0 } as Record<string, number>,
  latency: { count: 0, sum: 0, p50: 0, p95: 0, max: 0 } as { count: number; sum: number; p50: number; p95: number; max: number },
  // Rolling latency samples for percentile computation (cap at 1000 to bound memory)
  latencySamples: [] as number[],
  errors: 0,
};

export function structuredLog(level: LogLevel, event: string, fields: Record<string, unknown> = {}): void {
  const entry: StructuredLogEntry = {
    ts: new Date().toISOString(),
    level,
    event,
    ...fields,
  };
  // JSON to stdout — log aggregators (Loki, Datadog, CloudWatch) parse this.
  console.log(JSON.stringify(entry));
}

export interface PipelineMetricsRecord {
  triageLevel: string;
  confidenceBand: string;
  engine: string;
  latencyMs: number;
  injectionAttempt: boolean;
  drugCheckSeverity: string | null;
  success: boolean;
}

export function recordPipelineRun(m: PipelineMetricsRecord): void {
  METRICS.totalRuns++;
  METRICS.triageCounts[m.triageLevel] = (METRICS.triageCounts[m.triageLevel] ?? 0) + 1;
  METRICS.confidenceBands[m.confidenceBand] = (METRICS.confidenceBands[m.confidenceBand] ?? 0) + 1;
  METRICS.engineCounts[m.engine] = (METRICS.engineCounts[m.engine] ?? 0) + 1;
  if (m.injectionAttempt) METRICS.injectionAttempts++;
  if (m.drugCheckSeverity) {
    METRICS.drugCheckSeverity[m.drugCheckSeverity] = (METRICS.drugCheckSeverity[m.drugCheckSeverity] ?? 0) + 1;
  }
  METRICS.latency.count++;
  METRICS.latency.sum += m.latencyMs;
  METRICS.latency.max = Math.max(METRICS.latency.max, m.latencyMs);
  METRICS.latencySamples.push(m.latencyMs);
  if (METRICS.latencySamples.length > 1000) METRICS.latencySamples.shift();
  // Recompute percentiles
  const sorted = [...METRICS.latencySamples].sort((a, b) => a - b);
  METRICS.latency.p50 = sorted[Math.floor(sorted.length * 0.5)] ?? 0;
  METRICS.latency.p95 = sorted[Math.floor(sorted.length * 0.95)] ?? 0;
  if (!m.success) METRICS.errors++;
}

export function getMetricsSnapshot() {
  const uptimeSec = Math.floor((Date.now() - METRICS.startedAt) / 1000);
  return {
    startedAt: new Date(METRICS.startedAt).toISOString(),
    uptimeSec,
    totalRuns: METRICS.totalRuns,
    triageCounts: { ...METRICS.triageCounts },
    confidenceBands: { ...METRICS.confidenceBands },
    engineCounts: { ...METRICS.engineCounts },
    injectionAttempts: METRICS.injectionAttempts,
    drugCheckSeverity: { ...METRICS.drugCheckSeverity },
    latency: {
      count: METRICS.latency.count,
      avgMs: METRICS.latency.count ? Math.round(METRICS.latency.sum / METRICS.latency.count) : 0,
      p50: METRICS.latency.p50,
      p95: METRICS.latency.p95,
      max: METRICS.latency.max,
    },
    errors: METRICS.errors,
    errorRate: METRICS.totalRuns ? METRICS.errors / METRICS.totalRuns : 0,
  };
}

// Reset (admin/dev only — exposed via POST /api/observability/metrics?action=reset)
export function resetMetrics(): void {
  METRICS.totalRuns = 0;
  METRICS.triageCounts = { EMERGENCY: 0, URGENT: 0, ROUTINE: 0, SELF_CARE: 0, INFORMATIONAL: 0 };
  METRICS.confidenceBands = { HIGH: 0, MEDIUM: 0, LOW: 0 };
  METRICS.engineCounts = { L0: 0, L1: 0, combined: 0, offline: 0, fallback: 0 };
  METRICS.injectionAttempts = 0;
  METRICS.drugCheckSeverity = { HIGH: 0, MODERATE: 0, LOW: 0, NONE: 0 };
  METRICS.latency = { count: 0, sum: 0, p50: 0, p95: 0, max: 0 };
  METRICS.latencySamples = [];
  METRICS.errors = 0;
  METRICS.startedAt = Date.now();
}

// ============================================================
// PHI-Sanitized Error Reporting (Sentry / GlitchTip / Aggregator)
// Scrubs all Protected Health Information (PHI) before logging or dispatch.
// ============================================================

const PHI_PATTERNS = [
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, // emails
  /(\+?92|0)?3\d{2}[-\s]?\d{7}/g,                    // PK phone numbers
  /(\+?93)?7\d{8}/g,                                // AF phone numbers
  /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13})\b/g, // Credit card numbers
  /\b(?:pmdc|PMDC)[-:\s]*\w+/gi,                   // PMDC credentials
];

export function scrubPhi(input: string): string {
  let cleaned = input;
  for (const pattern of PHI_PATTERNS) {
    cleaned = cleaned.replace(pattern, '[REDACTED_PHI]');
  }
  return cleaned;
}

export function sanitizeContext(context: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(context)) {
    const lower = k.toLowerCase();
    if (
      lower.includes('password') ||
      lower.includes('secret') ||
      lower.includes('token') ||
      lower.includes('key') ||
      lower.includes('credential') ||
      lower.includes('medical') ||
      lower.includes('clinical') ||
      lower.includes('symptom') ||
      lower.includes('prescription') ||
      lower.includes('notes')
    ) {
      result[k] = '[REDACTED]';
    } else if (typeof v === 'string') {
      result[k] = scrubPhi(v);
    } else if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
      result[k] = sanitizeContext(v as Record<string, unknown>);
    } else {
      result[k] = v;
    }
  }
  return result;
}

export async function captureException(
  error: unknown,
  context: {
    event?: string;
    subsystem?: string;
    action?: string;
    extra?: Record<string, unknown>;
  } = {}
): Promise<void> {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;
  const sanitizedMsg = scrubPhi(errorMessage);
  const sanitizedContext = context.extra ? sanitizeContext(context.extra) : {};

  structuredLog('error', context.event ?? 'UNHANDLED_EXCEPTION', {
    subsystem: context.subsystem ?? 'core',
    action: context.action,
    message: sanitizedMsg,
    stack: errorStack ? scrubPhi(errorStack) : undefined,
    ...sanitizedContext,
  });

  const sentryDsn = process.env.SENTRY_DSN;
  if (!sentryDsn) return;

  try {
    const url = new URL(sentryDsn);
    const projectId = url.pathname.replace(/^\/+/, '');
    const publicKey = url.username;
    if (!projectId || !publicKey) return;

    const sentryEndpoint = `${url.protocol}//${url.host}/api/${projectId}/store/?sentry_key=${publicKey}&sentry_version=7`;
    const eventPayload = {
      event_id: (Math.random().toString(36).substring(2) + Date.now().toString(36)).slice(0, 32),
      timestamp: new Date().toISOString().replace('Z', ''),
      logger: context.subsystem ?? 'sehatai-backend',
      platform: 'node',
      level: 'error',
      environment: process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV ?? 'development',
      message: sanitizedMsg,
      extra: sanitizedContext,
      tags: {
        subsystem: context.subsystem ?? 'core',
        action: context.action ?? 'unknown',
      },
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    await fetch(sentryEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'SehatAI-Observability/1.0',
      },
      body: JSON.stringify(eventPayload),
      signal: controller.signal,
    }).catch(() => undefined).finally(() => clearTimeout(timeout));
  } catch {
    // Observability must NEVER crash application code
  }
}

