// SehatAI — Admin Dataset Stats API
// GET /api/admin/dataset-stats → live counts of the offline knowledge base.
// Admin-only. Powers the "Current Dataset Stats" panel on the eval Dashboard.
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { EXPANDED_CORPUS } from '@/data/expanded';
import { DRUG_DATABASE, DRUG_INTERACTION_RULES } from '@/lib/drug-interactions';
import { HEALTH_TIPS } from '@/data/health-tips';
import { GLOSSARY } from '@/data/glossary';

export const runtime = 'nodejs';

export async function GET() {
  let admin;
  try { admin = await requireAdmin(); } catch (e: unknown) {
    return NextResponse.json({ error: 'Forbidden — admin role required' }, { status: (e as { status?: number }).status ?? 401 });
  }
  void admin;

  let blogArticles = 0;
  try {
    blogArticles = await db.blogPost.count();
  } catch {
    // BlogPost table may not exist yet if migrations are pending
    blogArticles = 0;
  }

  const corpus = EXPANDED_CORPUS.length;
  const drugs = DRUG_DATABASE.length;
  const interactionRules = DRUG_INTERACTION_RULES.length;

  return NextResponse.json({
    corpus,
    drugs,
    interactionRules,
    blogArticles,
    healthTips: HEALTH_TIPS.length,
    glossaryTerms: GLOSSARY.length,
    total: corpus + drugs + interactionRules + blogArticles,
  });
}
