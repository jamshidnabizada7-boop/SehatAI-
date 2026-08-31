import { NextResponse } from 'next/server';
import { CORPUS } from '@/data/corpus';
import { RED_FLAG_PATTERNS } from '@/data/lexicon';
import type { KnowledgeManifest } from '@/lib/types';

export const runtime = 'nodejs';

/** GET /api/knowledge/manifest — offline pack manifest */
export async function GET() {
  const manifest: KnowledgeManifest = {
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    items: CORPUS.length,
    lexiconPatterns: RED_FLAG_PATTERNS.length,
    corpusChecksum: 'seed-v1',
  };
  return NextResponse.json(manifest);
}
