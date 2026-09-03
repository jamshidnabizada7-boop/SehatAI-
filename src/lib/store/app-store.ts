'use client';

import { create } from 'zustand';
import type { LangPref } from '@/lib/i18n';

export type View = 'chat' | 'reminders' | 'facilities' | 'dashboard' | 'about' | 'my-health' | 'observability' | 'doctor-copilot';

const SESSION_KEY = 'sehatai.sessionId';
const GUEST_MODE_KEY = 'sehatai.guestMode';

function loadGuestMode(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(GUEST_MODE_KEY) === '1';
  } catch {
    return false;
  }
}

interface AppState {
  view: View;
  langPref: LangPref;
  simulatedOffline: boolean;
  sessionId: string;
  conversationId: string | null;
  /** user chose "Continue as guest" on the landing chooser — skips it on
   *  this device until they sign out */
  guestMode: boolean;
  /** global search dialog open state */
  searchOpen: boolean;
  /** pending search query for the About view — set by the global search
   *  dialog when the user picks a first-aid or glossary result. The
   *  consuming section reads it once and clears it. */
  pendingAboutQuery: { firstAid?: string; glossary?: string } | null;

  setView: (view: View) => void;
  setGuestMode: (value: boolean) => void;
  setLangPref: (pref: LangPref) => void;
  setSimulatedOffline: (value: boolean) => void;
  ensureSession: () => string;
  setConversationId: (id: string | null) => void;
  setSearchOpen: (open: boolean) => void;
  setPendingAboutQuery: (query: { firstAid?: string; glossary?: string } | null) => void;
}

function loadSessionId(): string {
  if (typeof window === 'undefined') return '';
  try {
    const existing = window.localStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const id =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `sess-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    window.localStorage.setItem(SESSION_KEY, id);
    return id;
  } catch {
    return `sess-${Date.now()}`;
  }
}

export const useAppStore = create<AppState>((set, get) => ({
  view: 'chat',
  langPref: 'auto',
  simulatedOffline: false,
  sessionId: '',
  conversationId: null,
  guestMode: loadGuestMode(),
  searchOpen: false,
  pendingAboutQuery: null,

  setView: (view) => set({ view }),
  setGuestMode: (guestMode) => {
    try {
      if (typeof window !== 'undefined') {
        if (guestMode) window.localStorage.setItem(GUEST_MODE_KEY, '1');
        else window.localStorage.removeItem(GUEST_MODE_KEY);
      }
    } catch {
      // localStorage unavailable — in-memory state still works
    }
    set({ guestMode });
  },
  setLangPref: (langPref) => set({ langPref }),
  setSimulatedOffline: (simulatedOffline) => set({ simulatedOffline }),
  ensureSession: () => {
    const current = get().sessionId;
    if (current) return current;
    const id = loadSessionId();
    set({ sessionId: id });
    return id;
  },
  setConversationId: (conversationId) => set({ conversationId }),
  setSearchOpen: (searchOpen) => set({ searchOpen }),
  setPendingAboutQuery: (pendingAboutQuery) => set({ pendingAboutQuery }),
}));
