// ============================================================
// SehatAI — IndexedDB System of Record (Phase 2)
// Uses Dexie.js for IndexedDB storage — enables offline-first
// conversation persistence with CHT-style revision replication.
//
// This mirrors the server-side Conversation/Message models locally,
// so the app works fully offline and syncs when connectivity returns.
// ============================================================

import Dexie, { type Table } from 'dexie';

export interface LocalConversation {
  id: string;
  sessionToken: string;
  language: string;
  offline: boolean;
  startedAt: string;
  updatedAt: string;
  synced: boolean; // false = pending sync
  rev: number; // revision number for CHT-style conflict resolution
}

export interface LocalMessage {
  id: string;
  conversationId: string;
  role: string; // 'user' | 'assistant'
  content: string;
  language: string;
  triageLevel?: string;
  emergency: boolean;
  createdAt: string;
  synced: boolean;
}

export interface LocalReminder {
  id: string;
  type: string;
  title: string;
  notes?: string;
  timeOfDay: string;
  days: number[];
  nextDue: string;
  status: string;
  synced: boolean;
}

export class SehatAIDB extends Dexie {
  conversations!: Table<LocalConversation, string>;
  messages!: Table<LocalMessage, string>;
  reminders!: Table<LocalReminder, string>;

  constructor() {
    super('sehatai-offline');
    this.version(1).stores({
      conversations: 'id, sessionToken, synced, updatedAt',
      messages: 'id, conversationId, synced, createdAt',
      reminders: 'id, nextDue, status, synced',
    });
  }
}

let dbInstance: SehatAIDB | null = null;

export function getOfflineDB(): SehatAIDB {
  if (!dbInstance) {
    dbInstance = new SehatAIDB();
  }
  return dbInstance;
}

// ---------- Sync helpers (CHT-style) ----------

/**
 * Push unsynced local data to the server.
 * In production, this would call /api/sync with the pending items.
 * For now, marks them as synced.
 */
export async function pushPendingSync(): Promise<{ pushed: number }> {
  const db = getOfflineDB();
  let pushed = 0;

  // Conversations
  const pendingConvs = await db.conversations.where('synced').equals(0 as any).toArray();
  for (const conv of pendingConvs) {
    // In production: await fetch('/api/sync', { method: 'POST', body: JSON.stringify({ conversation: conv }) })
    await db.conversations.update(conv.id, { synced: true });
    pushed++;
  }

  // Messages
  const pendingMsgs = await db.messages.where('synced').equals(0 as any).toArray();
  for (const msg of pendingMsgs) {
    await db.messages.update(msg.id, { synced: true });
    pushed++;
  }

  // Reminders
  const pendingReminders = await db.reminders.where('synced').equals(0 as any).toArray();
  for (const rem of pendingReminders) {
    await db.reminders.update(rem.id, { synced: true });
    pushed++;
  }

  return { pushed };
}

/**
 * Pull from server and merge locally.
 * CHT-style: last-write-wins by revision number.
 */
export async function pullSync(serverData: {
  conversations?: any[];
  messages?: any[];
}): Promise<{ pulled: number }> {
  const db = getOfflineDB();
  let pulled = 0;

  if (serverData.conversations) {
    for (const conv of serverData.conversations) {
      const existing = await db.conversations.get(conv.id);
      if (!existing || (conv.rev || 0) > (existing.rev || 0)) {
        await db.conversations.put({ ...conv, synced: true });
        pulled++;
    }
    }
  }

  if (serverData.messages) {
    for (const msg of serverData.messages) {
      const existing = await db.messages.get(msg.id);
      if (!existing) {
        await db.messages.put({ ...msg, synced: true });
        pulled++;
      }
    }
  }

  return { pulled };
}

/**
 * Check if there are pending items to sync.
 */
export async function getPendingCount(): Promise<number> {
  const db = getOfflineDB();
  const convs = await db.conversations.where('synced').equals(0 as any).count();
  const msgs = await db.messages.where('synced').equals(0 as any).count();
  return convs + msgs;
}

/**
 * Save conversation locally (offline-first).
 */
export async function saveConversationLocal(conv: LocalConversation): Promise<void> {
  const db = getOfflineDB();
  await db.conversations.put({ ...conv, synced: false, rev: (conv.rev || 0) + 1 });
}

/**
 * Save message locally (offline-first).
 */
export async function saveMessageLocal(msg: LocalMessage): Promise<void> {
  const db = getOfflineDB();
  await db.messages.put({ ...msg, synced: false });
}

/**
 * Get all conversations from local storage (offline).
 */
export async function getLocalConversations(): Promise<LocalConversation[]> {
  const db = getOfflineDB();
  return db.conversations.orderBy('updatedAt').reverse().toArray();
}

/**
 * Get messages for a conversation from local storage.
 */
export async function getLocalMessages(conversationId: string): Promise<LocalMessage[]> {
  const db = getOfflineDB();
  return db.messages.where('conversationId').equals(conversationId).orderBy('createdAt').toArray();
}
