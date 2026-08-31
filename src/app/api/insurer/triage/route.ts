// SehatAI — Phase 3: Insurer Triage API (B2B payer surface)
// POST /api/insurer/triage { symptoms, age, sex, conditions[] }
// Returns: triage level, recommended care setting, estimated cost tier
// API key required (X-Insurer-Key header)
import { NextRequest, NextResponse } from 'next/server';
import { runL0Triage, matchRedFlags } from '@/lib/engine/safety-engine';

export const runtime = 'nodejs';

// Simple API key check (in production, store keys in DB)
const VALID_KEYS = new Set([
  'sehatai-insurer-demo-key-001',
  'sehatai-insurer-demo-key-002',
]);

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get('x-insurer-key');
  if (!apiKey || !VALID_KEYS.has(apiKey)) {
    return NextResponse.json({ error: 'Invalid or missing API key' }, { status: 401 });
  }

  let body: {
    symptoms?: string;
    age?: number;
    sex?: string;
    conditions?: string[];
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const symptoms = body.symptoms || '';
  if (!symptoms) {
    return NextResponse.json({ error: 'symptoms is required' }, { status: 400 });
  }

  // Run L0 triage (deterministic, fast)
  const l0Result = runL0Triage(symptoms, 'auto');
  const redFlags = matchRedFlags(symptoms);

  // Determine triage level
  const triageLevel = l0Result.level;
  const hasRedFlags = redFlags.length > 0;

  // Map to care setting + cost tier
  const careSettings: Record<string, { setting: string; costTier: string; urgency: string }> = {
    EMERGENCY: { setting: 'ER / Emergency Department', costTier: 'high', urgency: 'Immediate (within 1 hour)' },
    URGENT: { setting: 'Urgent care / OPD within 24h', costTier: 'medium', urgency: 'Within 24 hours' },
    ROUTINE: { setting: 'Routine OPD visit', costTier: 'low', urgency: 'Within 2-3 days' },
    SELF_CARE: { setting: 'Home care / Pharmacy consultation', costTier: 'minimal', urgency: 'Self-manage' },
  };

  const setting = careSettings[triageLevel] || careSettings.ROUTINE;

  return NextResponse.json({
    triage: {
      level: triageLevel,
      engine: l0Result.engine,
      shortCircuited: l0Result.shortCircuited,
      signals: l0Result.signals,
      hasRedFlags,
      redFlagCategories: redFlags.map((r) => r.category),
    },
    recommendation: {
      careSetting: setting.setting,
      urgency: setting.urgency,
      costTier: setting.costTier,
    },
    patient: {
      age: body.age,
      sex: body.sex,
      conditions: body.conditions || [],
    },
    disclaimer: 'This is an AI-generated triage suggestion, not a medical diagnosis. Final disposition determined by treating clinician.',
    timestamp: new Date().toISOString(),
  });
}

export async function GET() {
  return NextResponse.json({
    service: 'SehatAI Insurer Triage API',
    version: '1.0',
    description: 'B2B triage API for health insurance providers',
    auth: 'Send X-Insurer-Key header',
    endpoints: {
      triage: 'POST /api/insurer/triage { symptoms, age?, sex?, conditions?[] }',
    },
  });
}
