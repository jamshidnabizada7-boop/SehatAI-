// SehatAI — Doctor Portal: WHO SMART DAK decision tables reference
// GET /api/doctor/who-dak → returns the 14 decision tables from src/data/who-smart-dak.ts
import { NextResponse } from 'next/server';
import { requireDoctor } from '@/lib/auth';
import * as whoDak from '@/data/who-smart-dak';

export const runtime = 'nodejs';

export async function GET() {
  try { await requireDoctor(); } catch (e: unknown) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: (e as { status?: number }).status ?? 401 });
  }
  // Surface all exported arrays / objects as a structured reference
  const tables: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(whoDak)) {
    if (Array.isArray(val) || (typeof val === 'object' && val !== null)) {
      tables[key] = val;
    }
  }
  return NextResponse.json({ tables, count: Object.keys(tables).length });
}
