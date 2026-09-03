// ============================================================
// Conversation history list shaping — pure data transformation
// used by GET /api/conversations. Extracted so the safety test
// suite can verify the deterministic invariants without a live
// server: newest-first ordering, last-user preview, highest
// triage aggregation, emergency flag, ownership/scoping checks.
// ============================================================

import {
  createDialogueStreams,
  type PatientDialogueMessage,
  type PatientDialogueStream,
  type AssistantDialogueMessage,
  type DialogueHistoryMessage,
  type DialogueHistoryStream,
} from '@/lib/types';

export {
  createDialogueStreams,
  type PatientDialogueMessage,
  type PatientDialogueStream,
  type AssistantDialogueMessage,
  type DialogueHistoryMessage,
  type DialogueHistoryStream,
};

export interface ConvRow {
  id: string;
  sessionToken: string;
  language: string;
  offline: boolean;
  startedAt: Date | string;
  updatedAt: Date | string;
  messages: ConvMessageRow[];
}

export interface ConvMessageRow {
  id: string;
  role: string; // 'user' | 'assistant'
  content: string;
  triageLevel: string | null;
  emergency: boolean;
  createdAt: Date | string;
}

export interface ConversationListItem {
  id: string;
  language: string;
  offline: boolean;
  startedAt: string;
  updatedAt: string;
  messageCount: number;
  preview: string;
  triageLevel: string | null;
  emergency: boolean;
}

const TRIAGE_ORDER: Record<string, number> = {
  EMERGENCY: 3,
  URGENT: 2,
  ROUTINE: 1,
  SELF_CARE: 0,
};

function toIso(d: Date | string): string {
  return d instanceof Date ? d.toISOString() : String(d);
}

/**
 * Shape a single conversation row into the list-item DTO.
 * Pure function — no I/O, deterministic given the input.
 */
export function shapeConversationListItem(c: ConvRow): ConversationListItem {
  const lastUser = [...c.messages].reverse().find((m) => m.role === 'user');
  const preview = lastUser ? lastUser.content.replace(/\s+/g, ' ').slice(0, 140) : '';
  let top: string | null = null;
  let emergency = false;
  for (const m of c.messages) {
    if (m.emergency) emergency = true;
    if (m.triageLevel && (top === null || (TRIAGE_ORDER[m.triageLevel] ?? -1) > (TRIAGE_ORDER[top] ?? -1))) {
      top = m.triageLevel;
    }
  }
  return {
    id: c.id,
    language: c.language,
    offline: c.offline,
    startedAt: toIso(c.startedAt),
    updatedAt: toIso(c.updatedAt),
    messageCount: c.messages.length,
    preview,
    triageLevel: top,
    emergency,
  };
}

/**
 * Sort conversations newest-first by updatedAt. Ties broken by startedAt.
 * Stable so equal timestamps preserve insertion order.
 */
export function sortConversationsNewestFirst(items: ConversationListItem[]): ConversationListItem[] {
  return [...items].sort((a, b) => {
    const t = b.updatedAt.localeCompare(a.updatedAt);
    if (t !== 0) return t;
    return b.startedAt.localeCompare(a.startedAt);
  });
}

/**
 * Filter conversations by session ownership. Used to scope the list
 * endpoint to the caller's session — never leak another session's
 * conversation ids, previews, or triage levels.
 */
export function scopeToSession(rows: ConvRow[], sessionId: string): ConvRow[] {
  return rows.filter((c) => c.sessionToken === sessionId);
}
