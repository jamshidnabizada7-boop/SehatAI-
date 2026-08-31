// ============================================================
// Q. PWA service worker + glossary browser — regression tests
//  - sw.js contract: /api/* never intercepted, network-first
//    navigations, cache limited to same-origin static assets.
//  - Glossary data integrity: trilingual completeness, unique
//    terms, no dose/diagnosis language.
// ============================================================

import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { GLOSSARY } from '@/data/glossary';

const SW_PATH = join(import.meta.dir, '../../public/sw.js');

describe('Q. service worker — safety contract', () => {
  const sw = readFileSync(SW_PATH, 'utf8');

  test('sw.js exists and parses as a script (no template placeholders)', () => {
    expect(sw.length).toBeGreaterThan(200);
    expect(sw.includes('${')).toBe(false);
  });

  test('API routes are explicitly excluded from interception', () => {
    expect(sw.includes("url.pathname.startsWith('/api/')")).toBe(true);
  });

  test('only GET requests are handled (POST/SSE untouched)', () => {
    expect(sw.includes("req.method !== 'GET'")).toBe(true);
  });

  test('cross-origin requests bypass the SW', () => {
    expect(sw.includes('url.origin !== self.location.origin')).toBe(true);
  });

  test('navigations are network-first (no stale HTML while online)', () => {
    expect(sw.includes('req.mode === \'navigate\'')).toBe(true);
    // network-first: fetch attempted before caches.match fallback
    const navBlock = sw.slice(sw.indexOf("req.mode === 'navigate'"));
    expect(navBlock.indexOf('fetch(req)')).toBeLessThan(navBlock.indexOf('caches'));
  });

  test('cache is versioned so stale shells are evicted on activate', () => {
    expect(sw.includes('sehatai-shell-')).toBe(true);
    expect(sw.includes("keys.filter((k) => k !== CACHE)")).toBe(true);
  });

  test('precache list contains only safe static shell URLs', () => {
    // extract SHELL_URLS array
    const match = sw.match(/SHELL_URLS = \[(.*?)\]/s);
    expect(match).not.toBeNull();
    const entries = match![1]
      .split(',')
      .map((s) => s.trim().replace(/^'|'$/g, ''))
      .filter(Boolean);
    expect(entries.length).toBeGreaterThanOrEqual(4);
    for (const entry of entries) {
      expect(entry.startsWith('/api/')).toBe(false);
      expect(entry.startsWith('http')).toBe(false); // same-origin only
      expect(entry.startsWith('/')).toBe(true);
    }
    expect(entries).toContain('/');
    expect(entries).toContain('/manifest.json');
  });
});

describe('Q. glossary — data integrity', () => {
  test('glossary is non-trivial (>= 100 terms)', () => {
    expect(GLOSSARY.length).toBeGreaterThanOrEqual(100);
  });

  test('every term has non-empty en/ur/roman', () => {
    for (const term of GLOSSARY) {
      expect(term.en.trim().length).toBeGreaterThan(1);
      expect(term.ur.trim().length).toBeGreaterThan(1);
      expect(term.roman.trim().length).toBeGreaterThan(1);
    }
  });

  test('English terms are unique', () => {
    const en = GLOSSARY.map((t) => t.en.toLowerCase());
    expect(new Set(en).size).toBe(en.length);
  });

  test('Urdu fields contain actual Urdu script', () => {
    const urduRe = /[\u0600-\u06FF]/;
    for (const term of GLOSSARY) {
      expect(urduRe.test(term.ur)).toBe(true);
    }
  });

  test('no term contains dose-like instructions (dictionary, not prescriptions)', () => {
    const doseRe = /\b\d+\s*(mg|ml|tablet|goli|capsule)\b/i;
    for (const term of GLOSSARY) {
      const all = `${term.en} ${term.ur} ${term.roman}`;
      expect(doseRe.test(all)).toBe(false);
    }
  });
});

describe('Q. glossary — search behavior contract (mirrors glossary-section.tsx)', () => {
  const search = (query: string) => {
    const q = query.trim().toLowerCase();
    if (!q) return GLOSSARY;
    const qRaw = query.trim();
    return GLOSSARY.filter(
      (term) =>
        term.en.toLowerCase().includes(q) ||
        term.ur.includes(qRaw) ||
        term.roman.toLowerCase().includes(q),
    );
  };

  test('empty query returns the full pack', () => {
    expect(search('').length).toBe(GLOSSARY.length);
  });

  test('English search matches (fever)', () => {
    const hits = search('fever');
    expect(hits.length).toBeGreaterThanOrEqual(1);
    expect(hits.some((t) => t.en === 'fever')).toBe(true);
  });

  test('Urdu script search matches (بخار)', () => {
    const hits = search('بخار');
    expect(hits.length).toBeGreaterThanOrEqual(1);
    expect(hits.some((t) => t.ur.includes('بخار'))).toBe(true);
  });

  test('Roman Urdu search matches (bukhar)', () => {
    const hits = search('bukhar');
    expect(hits.length).toBeGreaterThanOrEqual(1);
    expect(hits.some((t) => t.roman.includes('bukhar'))).toBe(true);
  });

  test('search is case-insensitive', () => {
    expect(search('FEVER').length).toBe(search('fever').length);
  });

  test('gibberish query returns zero results (honest empty state)', () => {
    expect(search('zzzqqqxxx')).toHaveLength(0);
  });
});
