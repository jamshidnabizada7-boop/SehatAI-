import { NextResponse } from 'next/server';
import { CORPUS } from '@/data/corpus';
import { RED_FLAG_PATTERNS } from '@/data/lexicon';
import { EMERGENCY_TEMPLATES } from '@/data/emergency-templates';

export const runtime = 'nodejs';

/** GET /api/knowledge/pack — full offline knowledge pack (corpus + lexicon + templates) */
export async function GET() {
  return NextResponse.json({
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    corpusChecksum: 'seed-v1',
    corpus: CORPUS,
    lexicon: RED_FLAG_PATTERNS,
    emergencyTemplates: EMERGENCY_TEMPLATES,
  });
}
