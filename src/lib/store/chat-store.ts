'use client';

import { create } from 'zustand';
import type {
  ChatMessage,
  Citation,
  Differential,
  DrugCheckSummary,
  EmergencyStageData,
  Lang,
  PipelineStage,
  ResponseConfidence,
  TriageStageData,
  ValidationStageData,
} from '@/lib/types';

interface ChatState {
  messages: ChatMessage[];
  streaming: boolean;
  /** stages completed for the in-flight response (drives the pipeline ticker) */
  completedStages: PipelineStage[];
  currentStage: PipelineStage | null;
  emergency: EmergencyStageData | null;
  emergencyLang: Lang;
  /** urduVersion content per message id (for the Roman↔script toggle) */
  urduVersions: Record<string, string>;
  /** user feedback already submitted: messageId → 1 | 0 */
  feedbackGiven: Record<string, 1 | 0>;
  /** stream error note per message id (rendered as a small red note) */
  streamErrors: Record<string, string>;
  /** conversation history drawer open state */
  historyOpen: boolean;
  /** pending draft for the Reminders view — set by the "Save as reminder"
   *  quick action on assistant chat messages. */
  pendingReminderDraft: { title: string; notes?: string } | null;
  /** pending text to pre-fill the chat input — set by the global search
   *  dialog when the user picks a topic result ("Ask in chat"). */
  pendingChatDraft: string | null;

  setMessages: (messages: ChatMessage[]) => void;
  addMessage: (message: ChatMessage) => void;
  updateMessage: (id: string, patch: Partial<ChatMessage>) => void;
  appendDelta: (id: string, delta: string) => void;
  markStage: (stage: PipelineStage) => void;
  startStream: () => void;
  finishStream: (
    assistantId: string,
    patch: {
      id?: string;
      content?: string;
      language?: Lang;
      triage?: TriageStageData;
      citations?: Citation[];
      validation?: ValidationStageData | null;
      offline?: boolean;
      confidence?: ResponseConfidence | null;
      drugCheck?: DrugCheckSummary | null;
      differential?: Differential | null;
      error?: boolean;
    },
  ) => void;
  resetChat: () => void;
  setEmergency: (data: EmergencyStageData | null, lang: Lang) => void;
  setUrduVersion: (messageId: string, content: string) => void;
  setFeedback: (messageId: string, rating: 1 | 0) => void;
  setStreamError: (messageId: string, message: string) => void;
  setHistoryOpen: (open: boolean) => void;
  setPendingReminderDraft: (draft: { title: string; notes?: string } | null) => void;
  setPendingChatDraft: (draft: string | null) => void;
  /** Restore a previously-loaded conversation into the chat view (no LLM call).
   *  The caller is responsible for also updating app-store.conversationId. */
  loadConversation: (messages: ChatMessage[], conversationId: string, lang: Lang) => void;
  /** Remove a message AND everything after it (used by "Regenerate" to
   *  replace an assistant answer with a fresh one). Returns the remaining
   *  messages so the caller can find the preceding user message. */
  truncateFrom: (messageId: string) => ChatMessage[];
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  streaming: false,
  completedStages: [],
  currentStage: null,
  emergency: null,
  emergencyLang: 'en',
  urduVersions: {},
  feedbackGiven: {},
  streamErrors: {},
  historyOpen: false,
  pendingReminderDraft: null,
  pendingChatDraft: null,

  setMessages: (messages) => set({ messages }),
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  updateMessage: (id, patch) =>
    set((state) => ({
      messages: state.messages.map((m) => (m.id === id ? { ...m, ...patch } : m)),
    })),
  appendDelta: (id, delta) =>
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === id ? { ...m, content: m.content + delta } : m,
      ),
    })),
  markStage: (stage) =>
    set((state) => ({
      currentStage: stage,
      completedStages: state.completedStages.includes(stage)
        ? state.completedStages
        : [...state.completedStages, stage],
    })),
  startStream: () =>
    set({ streaming: true, completedStages: [], currentStage: 'safety' }),
  finishStream: (assistantId, patch) =>
    set((state) => ({
      streaming: false,
      currentStage: null,
      messages: state.messages.map((m) =>
        m.id === assistantId ? { ...m, ...patch, streaming: false } : m,
      ),
    })),
  resetChat: () =>
    set({
      messages: [],
      streaming: false,
      completedStages: [],
      currentStage: null,
      emergency: null,
      urduVersions: {},
      streamErrors: {},
    }),
  setEmergency: (emergency, emergencyLang) => set({ emergency, emergencyLang }),
  setUrduVersion: (messageId, content) =>
    set((state) => ({
      urduVersions: { ...state.urduVersions, [messageId]: content },
    })),
  setFeedback: (messageId, rating) =>
    set((state) => ({
      feedbackGiven: { ...state.feedbackGiven, [messageId]: rating },
    })),
  setStreamError: (messageId, message) =>
    set((state) => ({
      streamErrors: { ...state.streamErrors, [messageId]: message },
    })),
  setHistoryOpen: (historyOpen) => set({ historyOpen }),
  setPendingReminderDraft: (pendingReminderDraft) => set({ pendingReminderDraft }),
  setPendingChatDraft: (pendingChatDraft) => set({ pendingChatDraft }),
  /** Restore a previously-loaded conversation into the chat view (no LLM call).
   *  The caller is responsible for also updating app-store.conversationId. */
  loadConversation: (messages, _conversationId, lang) =>
    set(() => ({
      messages,
      streaming: false,
      completedStages: [],
      currentStage: null,
      emergency: null,
      emergencyLang: lang,
      urduVersions: {},
      streamErrors: {},
      feedbackGiven: {},
      historyOpen: false,
    })),
  truncateFrom: (messageId) => {
    let remaining: ChatMessage[] = [];
    set((state) => {
      const idx = state.messages.findIndex((m) => m.id === messageId);
      if (idx === -1) {
        remaining = state.messages;
        return state;
      }
      remaining = state.messages.slice(0, idx);
      const removedIds = new Set(state.messages.slice(idx).map((m) => m.id));
      const urduVersions = Object.fromEntries(
        Object.entries(state.urduVersions).filter(([id]) => !removedIds.has(id)),
      );
      const streamErrors = Object.fromEntries(
        Object.entries(state.streamErrors).filter(([id]) => !removedIds.has(id)),
      );
      const feedbackGiven = Object.fromEntries(
        Object.entries(state.feedbackGiven).filter(([id]) => !removedIds.has(id)),
      );
      return { messages: remaining, urduVersions, streamErrors, feedbackGiven };
    });
    return remaining;
  },
}));
