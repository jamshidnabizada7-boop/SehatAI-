// ============================================================
// Category L — RAG / source grounding
// Retrieved sources must exist; citations must correspond to
// retrieved content; invented IDs are stripped, never shown.
// ============================================================
import { describe, expect, test } from 'bun:test';
import { retrieveCorpus } from '@/lib/engine/safety-engine';
import { extractCitations } from '@/server/pipeline/run';
import { CORPUS } from '@/data/corpus';

describe('L. retrieval quality', () => {
  test('classic symptoms find the right verified doc', () => {
    const fever = retrieveCorpus('mujhe do din se bukhar hai aur sar dard', 3);
    // fever + headache both match — the fever doc must be in the top results
    expect(fever.map((h) => h.item.id)).toContain('fever-adult');
    const dengue = retrieveCorpus('I have fever since 5 days with pain behind my eyes and body ache', 3);
    expect(dengue.map((h) => h.item.id)).toContain('dengue');
  });

  test('misspellings still retrieve (synonym expansion)', () => {
    const r = retrieveCorpus('I have diabetis', 3);
    expect(r.map((h) => h.item.id)).toContain('diabetes-basics');
  });

  test('antibiotic questions retrieve the medication-safety doc', () => {
    const r = retrieveCorpus('which antibiotic should I take for fever', 3);
    expect(r.map((h) => h.item.id)).toContain('antibiotic-awareness');
  });

  test('every corpus item has a real source with license + verification date', () => {
    for (const item of CORPUS) {
      expect(item.source.publisher.length).toBeGreaterThan(1);
      expect(item.source.url).toMatch(/^https:\/\//);
      expect(item.source.verifiedAt).toMatch(/^\d{4}-\d{2}$/);
    }
  });
});

describe('L. citation grounding', () => {
  test('cited IDs resolve to real corpus documents', () => {
    const { citations } = extractCitations('drink fluids [fever-adult] and rest [diarrhea-ors]');
    expect(citations.map((c) => c.id)).toEqual(['fever-adult', 'diarrhea-ors']);
    for (const c of citations) {
      expect(CORPUS.find((i) => i.id === c.id)).toBeDefined();
      expect(c.publisher.length).toBeGreaterThan(1);
    }
  });

  test('invented IDs are stripped from content and never cited', () => {
    const { citations, stripped, sanitized } = extractCitations(
      'fever needs fluids [fever-adult] per the famous study [made-up-study-99]',
    );
    expect(stripped).toContain('made-up-study-99');
    expect(citations.map((c) => c.id)).not.toContain('made-up-study-99');
    expect(sanitized).not.toContain('made-up-study-99');
  });

  test('retrieval-restricted citations: non-retrieved real docs are also stripped', () => {
    const allowed = new Set(['fever-adult']);
    const { citations, stripped } = extractCitations('guidance [fever-adult] and more [dengue]', allowed);
    expect(citations.map((c) => c.id)).toEqual(['fever-adult']);
    expect(stripped).toContain('dengue');
  });

  test('citation carries the true source metadata (no fabricated URLs)', () => {
    const { citations } = extractCitations('guidance [fever-adult]');
    const c = citations[0];
    const item = CORPUS.find((i) => i.id === 'fever-adult')!;
    expect(c.url).toBe(item.source.url);
    expect(c.publisher).toBe(item.source.publisher);
  });
});
