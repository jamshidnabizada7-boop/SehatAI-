'use client';

import { useEffect } from 'react';
import { useNetworkOnline } from './use-network-online';
import { useChatStore } from '@/lib/store/chat-store';
import { useAppStore } from '@/lib/store/app-store';
import type { ChatMessage } from '@/lib/types';

const KEY = 'sehatai.activeConversation.v1';

/** Tab-scoped health data: survives reload, cleared on account changes and sign-out. */
export function useConversationPersistence(status: string, userId?: string): boolean {
  const online = useNetworkOnline();
  const owner = status === 'loading' ? null : status === 'authenticated' && userId ? `user:${userId}` : 'guest';
  const boundOwner = useChatStore(s => s.ownerKey);
  useEffect(() => {
    if (!owner) return;
    useChatStore.getState().resetChat();
    useAppStore.getState().setConversationId(null);
    let localOwner = owner;
    try {
      const raw = sessionStorage.getItem(KEY);
      const saved = raw ? JSON.parse(raw) : null;
      // Network failure is not a sign-out. This private tab's transcript remains
      // usable offline, including its unresolved safety reports, after a reload.
      if (!online && owner === 'guest' && typeof saved?.owner === 'string') localOwner = saved.owner;
      if (saved?.owner === localOwner && Array.isArray(saved.messages)) {
        const messages: ChatMessage[] = saved.messages.filter((m: ChatMessage) => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string');
        useChatStore.getState().loadConversation(messages.map(m => ({ ...m, streaming: false })), saved.conversationId ?? '', 'en');
        useAppStore.getState().setConversationId(typeof saved.conversationId === 'string' ? saved.conversationId : null);
      } else sessionStorage.removeItem(KEY);
    } catch { /* Storage unavailable: keep the current transcript in memory. */ }
    useChatStore.setState({ ownerKey: localOwner });
    const save = () => {
      const messages = useChatStore.getState().messages;
      try {
        sessionStorage.setItem(KEY, JSON.stringify({ owner: localOwner, messages, conversationId: useAppStore.getState().conversationId }));
      } catch { useChatStore.setState({ storageUnavailable: true }); }
    };
    const unsubscribeChat = useChatStore.subscribe((state, previous) => {
      if (state.messages !== previous.messages) save();
    });
    const unsubscribeApp = useAppStore.subscribe((state, previous) => {
      if (state.conversationId !== previous.conversationId) save();
    });
    return () => { unsubscribeChat(); unsubscribeApp(); };
  }, [owner, online]);
  return owner !== null && (boundOwner === owner || !online && boundOwner !== null);
}
