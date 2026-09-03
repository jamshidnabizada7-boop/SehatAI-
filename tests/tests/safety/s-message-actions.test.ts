// ============================================================
// S. Message actions — regression tests for the pure helpers
// behind the chat message action row (read-aloud, copy,
// regenerate) and the new chronic-disease corpus documents.
//
// Invariants tested:
//  - stripMarkdownForSpeech removes markdown noise but keeps all
//    spoken words (links → label, [n] citations dropped, bullets
//    dropped, bold/italic markers unwrapped).
//  - chunkTextForSpeech never splits mid-word, respects maxLen,
//    returns [] for empty input, keeps Urdu sentence punctuation.
//  - pickVoiceForLang prefers exact > prefix > default, and local
//    voices over remote within a tier.
//  - hasVoiceForLang: Roman Urdu may fall back to English voices,
//    Urdu script may not.
//  - resolveSpeechTag falls back to en-US for Roman Urdu only
//    when no Urdu voice exists.
//  - answerPlainText keeps structure but strips markdown syntax.
//  - chat-store.truncateFrom removes the target message and every
//    later one, and prunes per-message maps (urduVersions,
//    streamErrors, feedbackGiven); unknown id is a no-op.
//  - New corpus docs retrieve for their target phrasings AND the
//    existing diabetes/asthma rankings do not regress.
// ============================================================

import { describe, expect, test } from 'bun:test';
import {
  chunkTextForSpeech,
  hasVoiceForLang,
  pickVoiceForLang,
  resolveSpeechTag,
  stripMarkdownForSpeech,
  answerPlainText,
} from '@/lib/speech';
import { retrieveCorpus, runOfflineEngine } from '@/lib/engine/safety-engine';
import { CORPUS } from '@/data/corpus';
import { useChatStore } from '@/lib/store/chat-store';
import type { ChatMessage } from '@/lib/types';

// ---------- speech text preparation ----------

describe('S. read-aloud — markdown stripping', () => {
  test('links keep their label but drop the URL', () => {
    const out = stripMarkdownForSpeech('Read the [WHO fact sheet](https://who.int/x) now.');
    expect(out).toContain('WHO fact sheet');
    expect(out).not.toContain('https://');
    expect(out).not.toContain('](');
  });

  test('numeric citation markers are removed', () => {
    const out = stripMarkdownForSpeech('Drink fluids [1] and rest [2].');
    expect(out).toBe('Drink fluids  and rest .');
  });

  test('bullets and bold/italic markers are unwrapped', () => {
    const out = stripMarkdownForSpeech('• **Rest** and *fluids* are key');
    expect(out).toContain('Rest');
    expect(out).not.toContain('**');
    expect(out).not.toContain('*');
    expect(out).not.toMatch(/^\s*•/);
  });

  test('heading hashes are removed', () => {
    const out = stripMarkdownForSpeech('## Fever guidance\nRest.');
    expect(out).not.toContain('#');
    expect(out).toContain('Fever guidance');
  });

  test('empty input → empty string, never throws', () => {
    expect(stripMarkdownForSpeech('')).toBe('');
    expect(stripMarkdownForSpeech(null as unknown as string)).toBe('');
  });

  test('Urdu text passes through untouched (no latin-only assumptions)', () => {
    const ur = 'اردو میں ہدایت — آرام کریں';
    expect(stripMarkdownForSpeech(ur)).toBe(ur);
  });
});

describe('S. read-aloud — chunking', () => {
  test('short text → single chunk', () => {
    expect(chunkTextForSpeech('Drink water.')).toEqual(['Drink water.']);
  });

  test('empty input → no chunks', () => {
    expect(chunkTextForSpeech('')).toEqual([]);
    expect(chunkTextForSpeech('   ')).toEqual([]);
  });

  test('chunks never exceed maxLen', () => {
    const long = Array.from({ length: 60 }, (_, i) => `word${i}`).join(' ');
    const chunks = chunkTextForSpeech(long, 100);
    expect(chunks.length).toBeGreaterThan(1);
    for (const c of chunks) expect(c.length).toBeLessThanOrEqual(100);
  });

  test('never splits mid-word (hard-split respects word boundaries)', () => {
    const words = Array.from({ length: 40 }, (_, i) => `supercalifragilistic${i}`);
    const long = words.join(' ');
    const chunks = chunkTextForSpeech(long, 120);
    expect(chunks.length).toBeGreaterThan(1);
    // every chunk starts and ends on a full word
    const allWords = new Set(words);
    for (const c of chunks) {
      for (const w of c.split(' ')) expect(allWords.has(w)).toBe(true);
    }
    // no word is duplicated or lost
    const reassembled = chunks.join(' ');
    expect(reassembled.split(' ').sort()).toEqual(words.slice().sort());
  });

  test('sentence boundaries preferred over max packing', () => {
    const text = 'First sentence here. Second sentence follows!';
    const chunks = chunkTextForSpeech(text, 250);
    expect(chunks).toEqual([text]);
  });

  test('Urdu sentence punctuation splits sentences', () => {
    const text = 'پہلا جملہ۔ دوسرا جملہ۔';
    const chunks = chunkTextForSpeech(text, 200);
    expect(chunks).toEqual([text]);
    expect(chunks[0]).toContain('دوسرا جملہ');
  });
});

// ---------- voice selection ----------

describe('S. read-aloud — voice selection', () => {
  const voices = [
    { lang: 'en-US', name: 'Sam', localService: true },
    { lang: 'ur-PK', name: 'Urdu Voice', localService: false },
    { lang: 'hi-IN', name: 'Hindi Voice', localService: true },
  ];

  test('exact language match wins', () => {
    const v = pickVoiceForLang(voices, 'ur-PK');
    expect(v?.name).toBe('Urdu Voice');
  });

  test('prefix match used when no exact match', () => {
    const v = pickVoiceForLang([{ lang: 'ur-IN', name: 'Urdu India' }], 'ur-PK');
    expect(v?.name).toBe('Urdu India');
  });

  test('falls back to default voice, then any voice', () => {
    expect(pickVoiceForLang([{ lang: 'fr-FR', name: 'Default', default: true }, { lang: 'de-DE', name: 'Other' }], 'ur-PK')?.name).toBe('Default');
    expect(pickVoiceForLang([{ lang: 'de-DE', name: 'Other' }], 'ur-PK')?.name).toBe('Other');
  });

  test('local (offline) voice preferred within the same tier', () => {
    const v = pickVoiceForLang([
      { lang: 'en-GB', name: 'Remote EN', localService: false },
      { lang: 'en-US', name: 'Local EN', localService: true },
    ], 'en-US');
    expect(v?.name).toBe('Local EN');
  });

  test('empty voice list → null', () => {
    expect(pickVoiceForLang([], 'en-US')).toBeNull();
  });

  test('hasVoiceForLang: English needs an en* voice', () => {
    expect(hasVoiceForLang(voices, 'en')).toBe(true);
    expect(hasVoiceForLang([voices[1]], 'en')).toBe(false);
  });

  test('hasVoiceForLang: Urdu script requires an ur* voice (no English fallback)', () => {
    expect(hasVoiceForLang([{ lang: 'en-US' }], 'ur')).toBe(false);
    expect(hasVoiceForLang(voices, 'ur')).toBe(true);
  });

  test('hasVoiceForLang: Roman Urdu may fall back to English voices', () => {
    expect(hasVoiceForLang([{ lang: 'en-US' }], 'roman')).toBe(true);
    expect(hasVoiceForLang([{ lang: 'fr-FR' }], 'roman')).toBe(false);
  });

  test('resolveSpeechTag: roman keeps ur-PK when Urdu voice exists, else en-US', () => {
    expect(resolveSpeechTag(voices, 'roman')).toBe('ur-PK');
    expect(resolveSpeechTag([{ lang: 'en-US' }], 'roman')).toBe('en-US');
    expect(resolveSpeechTag(voices, 'en')).toBe('en-US');
    expect(resolveSpeechTag(voices, 'ur')).toBe('ur-PK');
  });
});

// ---------- copy answer ----------

describe('S. copy answer — plain text formatting', () => {
  test('markdown syntax stripped, structure kept', () => {
    const out = answerPlainText('**Rest** well\n\n• Drink fluids\n[fever-adult]');
    expect(out).toContain('Rest');
    expect(out).toContain('Drink fluids');
    expect(out).not.toContain('**');
  });

  test('empty input → empty string', () => {
    expect(answerPlainText('')).toBe('');
  });
});

// ---------- chat-store truncateFrom (regenerate core) ----------

describe('S. regenerate — chat store truncateFrom', () => {
  function msg(id: string, role: 'user' | 'assistant'): ChatMessage {
    return { id, role, content: `${id} content`, createdAt: Date.now() };
  }

  function seedStore(): void {
    useChatStore.setState({
      messages: [msg('u1', 'user'), msg('a1', 'assistant'), msg('u2', 'user'), msg('a2', 'assistant')],
      streaming: false,
      completedStages: [],
      currentStage: null,
      emergency: null,
      emergencyLang: 'en',
      urduVersions: { a1: 'urdu a1', a2: 'urdu a2' },
      feedbackGiven: { a1: 1, a2: 0 },
      streamErrors: { a1: 'err' },
      historyOpen: false,
      pendingReminderDraft: null,
    });
  }

  test('removes the target message and everything after it', () => {
    seedStore();
    const remaining = useChatStore.getState().truncateFrom('a2');
    expect(remaining.map((m) => m.id)).toEqual(['u1', 'a1', 'u2']);
    expect(useChatStore.getState().messages.map((m) => m.id)).toEqual(['u1', 'a1', 'u2']);
  });

  test('prunes per-message maps for removed ids only', () => {
    seedStore();
    useChatStore.getState().truncateFrom('a2');
    const s = useChatStore.getState();
    expect(s.urduVersions).toEqual({ a1: 'urdu a1' });
    expect(s.feedbackGiven).toEqual({ a1: 1 });
    expect(s.streamErrors).toEqual({ a1: 'err' });
  });

  test('truncating the first message empties the thread and maps', () => {
    seedStore();
    useChatStore.getState().truncateFrom('u1');
    const s = useChatStore.getState();
    expect(s.messages).toEqual([]);
    expect(s.urduVersions).toEqual({});
    expect(s.feedbackGiven).toEqual({});
  });

  test('unknown id is a safe no-op returning current messages', () => {
    seedStore();
    const remaining = useChatStore.getState().truncateFrom('nope');
    expect(remaining).toHaveLength(4);
    expect(useChatStore.getState().messages).toHaveLength(4);
  });

  test('consecutive truncation simulates the regenerate flow (assistant then user)', () => {
    seedStore();
    useChatStore.getState().truncateFrom('a2');
    const after = useChatStore.getState().messages;
    expect(after[after.length - 1].role).toBe('user');
    expect(after[after.length - 1].id).toBe('u2');
    useChatStore.getState().truncateFrom('u2');
    expect(useChatStore.getState().messages.map((m) => m.id)).toEqual(['u1', 'a1']);
  });
});

// ---------- new corpus documents ----------

describe('S. new chronic-disease corpus docs — retrieval', () => {
  test('all four new docs exist with full trilingual content + sources', () => {
    const ids = ['diabetes-low-sugar', 'diabetes-ramadan-fasting', 'stroke-fast', 'asthma-child'];
    for (const id of ids) {
      const doc = CORPUS.find((c) => c.id === id);
      expect(doc).toBeDefined();
      expect(doc!.content.en.length).toBeGreaterThan(200);
      expect(doc!.content.ur.length).toBeGreaterThan(200);
      expect(doc!.content.roman.length).toBeGreaterThan(200);
      expect(doc!.source.url).toMatch(/^https:\/\//);
      expect(doc!.tags.length).toBeGreaterThan(5);
    }
  });

  test('hypoglycaemia phrasings rank the hypo doc FIRST (over diabetes-basics)', () => {
    const queries = [
      'meri sugar kam ho rahi hai, kanp raha hoon',
      'sugar gir rahi hai, pasina aa raha hai',
      'mujhe pasina aa raha hai aur haath kanp rahe hain, sugar patient hoon',
    ];
    for (const q of queries) {
      const hits = retrieveCorpus(q, 3);
      expect(hits[0]?.item.id).toBe('diabetes-low-sugar');
    }
  });

  test('hypoglycaemia statement triages URGENT or higher (never SELF_CARE/ROUTINE-only)', () => {
    // the offline engine is the deterministic floor — it must not
    // de-triage an active low-sugar complaint
    const result = runOfflineEngine('meri sugar kam ho rahi hai, kanp raha hoon', 'roman');
    expect(['URGENT', 'EMERGENCY']).toContain(result.triage.level);
  });

  test('established-diabetes queries still rank diabetes-basics first (no steal)', () => {
    const hits = retrieveCorpus('mujhe sugar hai, kya karun?', 3);
    expect(hits[0]?.item.id).toBe('diabetes-basics');
    const info = retrieveCorpus('sugar ki bimari ke khatray ki alamaat kaun si hain?', 3);
    expect(info[0]?.item.id).toBe('diabetes-basics');
  });

  test('Ramadan fasting query ranks the Ramadan doc first', () => {
    const hits = retrieveCorpus('main sugar ka mareez hoon, ramzan mein roza rakh sakta hoon?', 3);
    expect(hits[0]?.item.id).toBe('diabetes-ramadan-fasting');
  });

  test('faalij/stroke query retrieves the stroke doc (L0 handles live emergencies)', () => {
    const hits = retrieveCorpus('faalij ke baare mein batayein, bachao ke tareeqay', 3);
    expect(hits.map((h) => h.item.id)).toContain('stroke-fast');
  });

  test('child night-cough query ranks asthma-child first (over TB and adult asthma)', () => {
    const hits = retrieveCorpus('mera 5 saal ka bacha raat ko khansi karta hai aur seeti jaisi aawaz aati hai', 3);
    expect(hits[0]?.item.id).toBe('asthma-child');
  });

  test('adult wheeze query still ranks the adult asthma doc first', () => {
    const hits = retrieveCorpus('mujhe saans mein seeti jaisi aawaz aati hai', 3);
    expect(hits[0]?.item.id).toBe('asthma');
  });

  test('TB golden query still ranks tuberculosis first (no regression)', () => {
    const hits = retrieveCorpus('mujhe do haftay se khansi hai, raat ko paseena aata hai', 3);
    expect(hits[0]?.item.id).toBe('tuberculosis');
  });

  test('stroke doc baseLevel is EMERGENCY (education doc, live detection via L0)', () => {
    const doc = CORPUS.find((c) => c.id === 'stroke-fast');
    expect(doc?.baseLevel).toBe('EMERGENCY');
    expect(doc?.baseLevel).toBe('EMERGENCY');
  });
});
