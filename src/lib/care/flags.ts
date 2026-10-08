// ============================================================
// Care Connect §2 — feature flags.
// Env vars provide the DEFAULT; DB FeatureFlag rows (global or
// country-scoped) override at runtime. Nothing regulatory is
// hardcoded: prescribing etc. resolves through JurisdictionPolicy.
//
// Rollout stages (§95): stage 1 internal team → stage 6 global.
// CARE_ROLLOUT_STAGE gates who can see commercial surfaces.
// ============================================================
import { db } from '@/lib/db';

export const CARE_FLAG_KEYS = [
  'CARE_ENABLED',
  'CARE_PAYMENTS_ENABLED',
  'CARE_MESSAGING_ENABLED',
  'CARE_AUDIO_ENABLED',
  'CARE_VIDEO_ENABLED',
  'CARE_TRANSLATION_ENABLED',
  'CARE_PRESCRIPTIONS_ENABLED',
  'CARE_DOCTOR_PAYOUTS_ENABLED',
  'CARE_REVIEWS_ENABLED',
  'CARE_INSTANT_ENABLED',
  'CARE_FAVORITES_ENABLED',
] as const;
export type CareFlagKey = (typeof CARE_FLAG_KEYS)[number];

// Env defaults — safe/falsy for everything that touches money or media.
export const ENV_DEFAULTS: Record<CareFlagKey, boolean> = {
  CARE_ENABLED: true, // code ships, but rollout stage gates visibility
  CARE_PAYMENTS_ENABLED: false,
  CARE_MESSAGING_ENABLED: true,
  CARE_AUDIO_ENABLED: true,
  CARE_VIDEO_ENABLED: true,
  CARE_TRANSLATION_ENABLED: true,
  CARE_PRESCRIPTIONS_ENABLED: false, // §39: jurisdiction-gated; off by default
  CARE_DOCTOR_PAYOUTS_ENABLED: false,
  CARE_REVIEWS_ENABLED: true,
  CARE_INSTANT_ENABLED: false,
  CARE_FAVORITES_ENABLED: true,
};

// DB-backed flags are cached briefly so per-request reads stay cheap
// while still allowing runtime admin toggles.
const CACHE_TTL_MS = 15_000;
let cache: { at: number; map: Map<string, boolean> } | null = null;

function envFlag(key: CareFlagKey): boolean {
  const raw = process.env[key];
  if (raw === undefined || raw === '') return ENV_DEFAULTS[key];
  return raw === 'true' || raw === '1';
}

async function loadDbFlags(): Promise<Map<string, boolean>> {
  if (cache && Date.now() - cache.at < CACHE_TTL_MS) return cache.map;
  const map = new Map<string, boolean>();
  try {
    const rows = await db.featureFlag.findMany({ where: { enabled: { not: undefined } } });
    for (const row of rows) map.set(row.scope === 'global' ? row.key : `${row.key}@${row.scope}`, row.enabled);
  } catch {
    // DB unavailable → env defaults only (never crash the app for flags)
  }
  cache = { at: Date.now(), map };
  return map;
}

export async function careFlag(key: CareFlagKey, countryCode?: string | null): Promise<boolean> {
  const map = await loadDbFlags();
  if (countryCode) {
    const scoped = map.get(`${key}@country:${countryCode.toUpperCase()}`);
    if (scoped !== undefined) return scoped;
  }
  const global = map.get(key);
  if (global !== undefined) return global;
  return envFlag(key);
}

export function careRolloutStage(): number {
  const raw = Number(process.env.CARE_ROLLOUT_STAGE ?? '1');
  return Number.isInteger(raw) && raw >= 1 && raw <= 6 ? raw : 1;
}

/** §95 stage gates: who may see Care Connect surfaces at all. */
export function rolloutAllowsStage(stage: number, opts: { isStaff: boolean }): boolean {
  if (stage <= 1) return opts.isStaff; // internal team only
  return true; // stages 2+ open to invited/public users; doctor-patient invites handled per-flow
}

export function clearFlagCache(): void {
  cache = null;
}

export interface CareFlags {
  enabled: boolean;
  payments: boolean;
  messaging: boolean;
  audio: boolean;
  video: boolean;
  translation: boolean;
  prescriptions: boolean;
  payouts: boolean;
  reviews: boolean;
  instant: boolean;
  favorites: boolean;
  rolloutStage: number;
}

export async function careFlags(countryCode?: string | null): Promise<CareFlags> {
  const f = (k: CareFlagKey) => careFlag(k, countryCode);
  return {
    enabled: await f('CARE_ENABLED'),
    payments: await f('CARE_PAYMENTS_ENABLED'),
    messaging: await f('CARE_MESSAGING_ENABLED'),
    audio: await f('CARE_AUDIO_ENABLED'),
    video: await f('CARE_VIDEO_ENABLED'),
    translation: await f('CARE_TRANSLATION_ENABLED'),
    prescriptions: await f('CARE_PRESCRIPTIONS_ENABLED'),
    payouts: await f('CARE_DOCTOR_PAYOUTS_ENABLED'),
    reviews: await f('CARE_REVIEWS_ENABLED'),
    instant: await f('CARE_INSTANT_ENABLED'),
    favorites: await f('CARE_FAVORITES_ENABLED'),
    rolloutStage: careRolloutStage(),
  };
}
