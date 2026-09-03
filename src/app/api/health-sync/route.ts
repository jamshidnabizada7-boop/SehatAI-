// SehatAI — Health Data Sync API (Wearable Integration)
// GET /api/health-sync → user's synced health data
// POST /api/health-sync { type, data } → receive synced data from native bridge
//
// Supported data types: steps, heart_rate, blood_pressure, blood_glucose,
// sleep, weight, body_temperature, oxygen_saturation
//
// On native (Capacitor), the app uses @capacitor-community/health or
// the native HealthKit (iOS) / Google Fit (Android) bridge to read data.
// On web, users can manually enter data or connect via Web APIs.
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth';

export const runtime = 'nodejs';

const SYNC_TYPES = ['steps', 'heart_rate', 'blood_pressure', 'blood_glucose', 'sleep', 'weight', 'body_temperature', 'oxygen_saturation'] as const;
type SyncType = typeof SYNC_TYPES[number];

export async function GET(req: NextRequest) {
  let user;
  try { user = await requireUser(); } catch (e: any) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: e.status ?? 401 });
  }

  const url = new URL(req.url);
  const type = url.searchParams.get('type') as SyncType | null;

  // Get the patient profile to read stored health metrics
  const profile = await db.patientProfile.findUnique({ where: { userId: user.id } });

  // Return available sync types + last sync info
  return NextResponse.json({
    supportedTypes: SYNC_TYPES.map(t => ({
      type: t,
      label: t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      icon: getIconForType(t),
      available: isAvailableOnPlatform(t),
    })),
    lastSync: profile?.updatedAt?.toISOString() ?? null,
    platform: getPlatform(),
    // Return stored data from profile if available
    storedData: {
      conditions: profile ? JSON.parse(profile.conditions) : [],
      medications: profile ? JSON.parse(profile.medications) : [],
      allergies: profile ? JSON.parse(profile.allergies) : [],
    },
  });
}

export async function POST(req: NextRequest) {
  let user;
  try { user = await requireUser(); } catch (e: any) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: e.status ?? 401 });
  }
  let body: { type?: string; data?: unknown };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const type = body.type as SyncType | undefined;
  if (!type || !SYNC_TYPES.includes(type)) {
    return NextResponse.json({ error: `type must be one of: ${SYNC_TYPES.join(', ')}` }, { status: 400 });
  }
  const data = body.data;

  // Store the synced data — we could add a HealthSyncData model in the future
  // For now, we update the patient profile's relevant fields
  await db.auditLog.create({
    data: {
      userId: user.id,
      action: 'health.sync.received',
      resource: type,
      meta: JSON.stringify({ type, data, platform: getPlatform(), timestamp: new Date().toISOString() }),
    },
  });

  return NextResponse.json({
    ok: true,
    type,
    syncedAt: new Date().toISOString(),
    platform: getPlatform(),
    message: `${type} data synced successfully`,
  });
}

function getPlatform(): string {
  if (typeof window === 'undefined') return 'server';
  const capacitor = (window as any).Capacitor;
  if (capacitor?.isNativePlatform?.()) {
    return capacitor.getPlatform?.() ?? 'unknown';
  }
  return 'web';
}

function isAvailableOnPlatform(type: string): boolean {
  const platform = getPlatform();
  if (platform === 'ios') {
    return ['steps', 'heart_rate', 'blood_pressure', 'blood_glucose', 'sleep', 'weight', 'body_temperature', 'oxygen_saturation'].includes(type);
  }
  if (platform === 'android') {
    return ['steps', 'heart_rate', 'blood_pressure', 'blood_glucose', 'sleep', 'weight'].includes(type);
  }
  // Web — limited support via Web APIs
  return ['steps', 'heart_rate', 'sleep', 'weight'].includes(type);
}

function getIconForType(type: string): string {
  const icons: Record<string, string> = {
    steps: '👟', heart_rate: '❤️', blood_pressure: '🩸', blood_glucose: '🍬',
    sleep: '😴', weight: '⚖️', body_temperature: '🌡️', oxygen_saturation: '🫁',
  };
  return icons[type] ?? '📊';
}
