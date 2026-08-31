// ============================================================
// R. Conversation history — regression tests for the pure data
// shaping logic used by GET /api/conversations.
//
// Invariants tested:
//  - List is sorted newest-first by updatedAt (ties → startedAt).
//  - Preview = last user message, whitespace-collapsed, capped at 140 chars.
//  - triageLevel = highest level across assistant messages
//    (EMERGENCY > URGENT > ROUTINE > SELF_CARE).
//  - emergency flag is set if ANY message was an emergency.
//  - Unknown triage levels are ignored (no crash, no override).
//  - session scoping never leaks another session's conversations.
//  - Empty conversation → empty preview, null triageLevel, false emergency.
// ============================================================

import { describe, expect, test } from 'bun:test';
import {
  shapeConversationListItem,
  sortConversationsNewestFirst,
  scopeToSession,
  createDialogueStreams,
  type ConvRow,
} from '@/server/conversation-history';

function row(
  id: string,
  sessionToken: string,
  overrides: Partial<ConvRow> = {},
): ConvRow {
  const base: ConvRow = {
    id,
    sessionToken,
    language: 'en',
    offline: false,
    startedAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    messages: [],
  };
  return { ...base, ...overrides };
}

describe('R. conversation history — list shaping', () => {
  test('preview is the LAST user message, not the first', () => {
    const r = row('c1', 's1', {
      messages: [
        { id: 'm1', role: 'user', content: 'first question', triageLevel: null, emergency: false, createdAt: '2025-01-01T00:00:00.000Z' },
        { id: 'm2', role: 'assistant', content: 'first answer', triageLevel: 'SELF_CARE', emergency: false, createdAt: '2025-01-01T00:00:01.000Z' },
        { id: 'm3', role: 'user', content: 'follow-up about fever', triageLevel: null, emergency: false, createdAt: '2025-01-01T00:00:02.000Z' },
        { id: 'm4', role: 'assistant', content: 'follow-up answer', triageLevel: 'ROUTINE', emergency: false, createdAt: '2025-01-01T00:00:03.000Z' },
      ],
    });
    const item = shapeConversationListItem(r);
    expect(item.preview).toBe('follow-up about fever');
    expect(item.messageCount).toBe(4);
  });

  test('preview collapses whitespace and caps at 140 chars', () => {
    const longContent = 'a'.repeat(200) + '\n\n  ' + 'b'.repeat(50);
    const r = row('c1', 's1', {
      messages: [
        { id: 'm1', role: 'user', content: longContent, triageLevel: null, emergency: false, createdAt: '2025-01-01T00:00:00.000Z' },
      ],
    });
    const item = shapeConversationListItem(r);
    expect(item.preview.length).toBe(140);
    expect(item.preview.includes('\n')).toBe(false);
    expect(item.preview.startsWith('a')).toBe(true);
  });

  test('triageLevel is the highest across assistant messages', () => {
    const r = row('c1', 's1', {
      messages: [
        { id: 'm1', role: 'user', content: 'q', triageLevel: null, emergency: false, createdAt: '2025-01-01T00:00:00.000Z' },
        { id: 'm2', role: 'assistant', content: 'a1', triageLevel: 'SELF_CARE', emergency: false, createdAt: '2025-01-01T00:00:01.000Z' },
        { id: 'm3', role: 'assistant', content: 'a2', triageLevel: 'URGENT', emergency: false, createdAt: '2025-01-01T00:00:02.000Z' },
        { id: 'm4', role: 'assistant', content: 'a3', triageLevel: 'ROUTINE', emergency: false, createdAt: '2025-01-01T00:00:03.000Z' },
      ],
    });
    expect(shapeConversationListItem(r).triageLevel).toBe('URGENT');
  });

  test('EMERGENCY beats URGENT/ROUTINE/SELF_CARE even if it appears first', () => {
    const r = row('c1', 's1', {
      messages: [
        { id: 'm1', role: 'assistant', content: 'a1', triageLevel: 'EMERGENCY', emergency: true, createdAt: '2025-01-01T00:00:00.000Z' },
        { id: 'm2', role: 'assistant', content: 'a2', triageLevel: 'SELF_CARE', emergency: false, createdAt: '2025-01-01T00:00:01.000Z' },
      ],
    });
    const item = shapeConversationListItem(r);
    expect(item.triageLevel).toBe('EMERGENCY');
    expect(item.emergency).toBe(true);
  });

  test('emergency flag is true if ANY message is flagged emergency (even when triage is lower)', () => {
    const r = row('c1', 's1', {
      messages: [
        { id: 'm1', role: 'assistant', content: 'a1', triageLevel: 'ROUTINE', emergency: true, createdAt: '2025-01-01T00:00:00.000Z' },
        { id: 'm2', role: 'assistant', content: 'a2', triageLevel: null, emergency: false, createdAt: '2025-01-01T00:00:01.000Z' },
      ],
    });
    const item = shapeConversationListItem(r);
    expect(item.emergency).toBe(true);
  });

  test('unknown triage levels are ignored, not treated as highest', () => {
    const r = row('c1', 's1', {
      messages: [
        { id: 'm1', role: 'assistant', content: 'a1', triageLevel: 'GARBAGE_LEVEL', emergency: false, createdAt: '2025-01-01T00:00:00.000Z' },
        { id: 'm2', role: 'assistant', content: 'a2', triageLevel: 'ROUTINE', emergency: false, createdAt: '2025-01-01T00:00:01.000Z' },
      ],
    });
    expect(shapeConversationListItem(r).triageLevel).toBe('ROUTINE');
  });

  test('empty conversation → empty preview, null triage, false emergency', () => {
    const r = row('c1', 's1');
    const item = shapeConversationListItem(r);
    expect(item.preview).toBe('');
    expect(item.triageLevel).toBeNull();
    expect(item.emergency).toBe(false);
    expect(item.messageCount).toBe(0);
  });

  test('conversation with only assistant messages has empty preview', () => {
    const r = row('c1', 's1', {
      messages: [
        { id: 'm1', role: 'assistant', content: 'orphan assistant reply', triageLevel: 'SELF_CARE', emergency: false, createdAt: '2025-01-01T00:00:00.000Z' },
      ],
    });
    expect(shapeConversationListItem(r).preview).toBe('');
  });
});

describe('R. conversation history — sort order', () => {
  test('newest-first by updatedAt', () => {
    const items = [
      shapeConversationListItem(row('c1', 's1', { updatedAt: '2025-01-01T00:00:00.000Z' })),
      shapeConversationListItem(row('c2', 's1', { updatedAt: '2025-01-02T00:00:00.000Z' })),
      shapeConversationListItem(row('c3', 's1', { updatedAt: '2025-01-01T12:00:00.000Z' })),
    ];
    const sorted = sortConversationsNewestFirst(items);
    expect(sorted.map((i) => i.id)).toEqual(['c2', 'c3', 'c1']);
  });

  test('ties broken by startedAt descending', () => {
    const items = [
      shapeConversationListItem(row('c1', 's1', { startedAt: '2025-01-01T00:00:00.000Z', updatedAt: '2025-01-05T00:00:00.000Z' })),
      shapeConversationListItem(row('c2', 's1', { startedAt: '2025-01-03T00:00:00.000Z', updatedAt: '2025-01-05T00:00:00.000Z' })),
      shapeConversationListItem(row('c3', 's1', { startedAt: '2025-01-02T00:00:00.000Z', updatedAt: '2025-01-05T00:00:00.000Z' })),
    ];
    const sorted = sortConversationsNewestFirst(items);
    expect(sorted.map((i) => i.id)).toEqual(['c2', 'c3', 'c1']);
  });

  test('sort is stable for identical timestamps (preserves insertion order)', () => {
    const items = [
      shapeConversationListItem(row('c1', 's1', { startedAt: '2025-01-01T00:00:00.000Z', updatedAt: '2025-01-05T00:00:00.000Z' })),
      shapeConversationListItem(row('c2', 's1', { startedAt: '2025-01-01T00:00:00.000Z', updatedAt: '2025-01-05T00:00:00.000Z' })),
      shapeConversationListItem(row('c3', 's1', { startedAt: '2025-01-01T00:00:00.000Z', updatedAt: '2025-01-05T00:00:00.000Z' })),
    ];
    const sorted = sortConversationsNewestFirst(items);
    expect(sorted.map((i) => i.id)).toEqual(['c1', 'c2', 'c3']);
  });

  test('does not mutate the input array', () => {
    const items = [
      shapeConversationListItem(row('c1', 's1', { updatedAt: '2025-01-01T00:00:00.000Z' })),
      shapeConversationListItem(row('c2', 's1', { updatedAt: '2025-01-02T00:00:00.000Z' })),
    ];
    const inputIds = items.map((i) => i.id);
    sortConversationsNewestFirst(items);
    expect(items.map((i) => i.id)).toEqual(inputIds);
  });
});

describe('R. conversation history — session scoping (ownership check)', () => {
  test('only conversations matching the session are returned', () => {
    const rows = [
      row('c1', 's1'),
      row('c2', 's2'),
      row('c3', 's1'),
      row('c4', 's3'),
    ];
    const scoped = scopeToSession(rows, 's1');
    expect(scoped.map((r) => r.id)).toEqual(['c1', 'c3']);
  });

  test('empty session id returns nothing (no leak)', () => {
    const rows = [row('c1', 's1'), row('c2', 's2')];
    expect(scopeToSession(rows, '')).toEqual([]);
  });

  test('unknown session id returns nothing (no leak)', () => {
    const rows = [row('c1', 's1'), row('c2', 's2')];
    expect(scopeToSession(rows, 'unknown')).toEqual([]);
  });

  test('cannot retrieve another session\'s conversation metadata via the list', () => {
    // Even with many conversations, only the caller's session appears.
    const rows = [
      row('c1', 's1', { updatedAt: '2025-01-10T00:00:00.000Z' }),
      row('c2', 's2', { updatedAt: '2025-01-11T00:00:00.000Z' }),
      row('c3', 's1', { updatedAt: '2025-01-09T00:00:00.000Z' }),
    ];
    const scoped = scopeToSession(rows, 's1');
    const items = sortConversationsNewestFirst(scoped.map(shapeConversationListItem));
    expect(items.map((i) => i.id)).toEqual(['c1', 'c3']);
    expect(items.some((i) => i.id === 'c2')).toBe(false);
  });
});

describe('R1. Structural Role Isolation — Dialogue Streams', () => {
  test('createDialogueStreams separates user and assistant messages into isolated streams', () => {
    const raw = [
      { role: 'user', content: 'I have a mild runny nose', createdAt: '2026-01-01T10:00:00Z' },
      { role: 'assistant', content: 'Drink warm fluids. Call 1122 if you develop severe chest pain or breathing difficulty.', triageLevel: 'SELF_CARE', emergency: false, createdAt: '2026-01-01T10:00:05Z' },
    ];
    const current = 'Thank you, can I take tea?';

    const { patientStream, historyStream } = createDialogueStreams(raw, current, 'en');

    // patientStream must contain ONLY user turns + current message
    expect(patientStream.length).toBe(2);
    expect(patientStream.every((m) => m.role === 'user')).toBe(true);
    expect(patientStream[0].content).toBe('I have a mild runny nose');
    expect(patientStream[1].content).toBe('Thank you, can I take tea?');

    // historyStream contains all turns
    expect(historyStream.length).toBe(3);
    expect(historyStream[0].role).toBe('user');
    expect(historyStream[1].role).toBe('assistant');
    expect(historyStream[2].role).toBe('user');
  });

  test('assistant emergency disclaimers never leak into patientStream', () => {
    const raw = [
      {
        role: 'assistant',
        content: '🚨 EMERGENCY ALERT: Patient collapsed. Call 1122 immediately for cardiac arrest, severe hemorrhage, and stroke.',
        emergency: true,
        triageLevel: 'EMERGENCY',
      },
    ];
    const current = 'I just have a headache';

    const { patientStream } = createDialogueStreams(raw, current);

    // Absolutely zero assistant disclaimer in patientStream
    expect(patientStream.length).toBe(1);
    expect(patientStream[0].content).toBe('I just have a headache');
    const combinedPatientText = patientStream.map((m) => m.content).join(' ');
    expect(combinedPatientText.includes('1122')).toBe(false);
    expect(combinedPatientText.includes('cardiac arrest')).toBe(false);
    expect(combinedPatientText.includes('EMERGENCY ALERT')).toBe(false);
  });

  test('streams are deeply frozen to prevent in-place mutation', () => {
    const raw = [{ role: 'user', content: 'Turn 1' }];
    const { patientStream, historyStream } = createDialogueStreams(raw, 'Turn 2');

    expect(Object.isFrozen(patientStream)).toBe(true);
    expect(Object.isFrozen(historyStream)).toBe(true);
  });

  test('empty history creates single-item streams with current message', () => {
    const { patientStream, historyStream } = createDialogueStreams([], 'Hello doctor', 'ur');

    expect(patientStream.length).toBe(1);
    expect(patientStream[0].role).toBe('user');
    expect(patientStream[0].content).toBe('Hello doctor');
    expect(patientStream[0].language).toBe('ur');

    expect(historyStream.length).toBe(1);
    expect(historyStream[0].role).toBe('user');
    expect(historyStream[0].content).toBe('Hello doctor');
  });
});

