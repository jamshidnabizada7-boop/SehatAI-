'use client';

import { useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { t } from '@/lib/i18n';
import type { Lang, Reminder } from '@/lib/types';

const FIRED_KEY = 'sehatai.reminderFired';

type FiredMap = Record<string, true>;

function loadFired(): FiredMap {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(window.localStorage.getItem(FIRED_KEY) ?? '{}') as FiredMap;
  } catch {
    return {};
  }
}

function saveFired(map: FiredMap) {
  try {
    // keep only today's entries
    const today = new Date().toISOString().slice(0, 10);
    const pruned: FiredMap = {};
    for (const key of Object.keys(map)) {
      if (key.endsWith(today)) pruned[key] = true;
    }
    window.localStorage.setItem(FIRED_KEY, JSON.stringify(pruned));
  } catch {
    // storage unavailable — alerts may repeat, acceptable
  }
}

/**
 * Client-side reminder alerts: every 30s, check whether any ACTIVE reminder's
 * timeOfDay matches the current HH:MM (and its weekday applies), then fire a
 * Notification (if permitted) + an in-app toast. Deduped per reminder+date.
 */
export function useReminderAlerts(reminders: Reminder[], lang: Lang) {
  const { toast } = useToast();
  const remindersRef = useRef(reminders);

  useEffect(() => {
    remindersRef.current = reminders;
  }, [reminders]);

  useEffect(() => {
    const check = () => {
      const now = new Date();
      const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const weekday = now.getDay();
      const today = now.toISOString().slice(0, 10);
      const fired = loadFired();

      for (const r of remindersRef.current) {
        if (r.status !== 'active') continue;
        const dayApplies = !r.days || r.days.length === 0 || r.days.includes(weekday);
        if (!dayApplies || r.timeOfDay !== hhmm) continue;
        const dedupeKey = `${r.id}:${today}`;
        if (fired[dedupeKey]) continue;

        fired[dedupeKey] = true;
        saveFired(fired);

        const body = `${t(lang, 'reminders.notifyBody')}${r.title} — ${r.timeOfDay}`;
        toast({ title: t(lang, 'reminders.notifyTitle'), description: body });
        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
          try {
            new Notification(t(lang, 'reminders.notifyTitle'), { body, tag: r.id });
          } catch {
            // some browsers restrict constructor usage — in-app toast already fired
          }
        }
      }
    };

    check();
    const interval = setInterval(check, 30_000);
    return () => clearInterval(interval);
  }, [lang, toast]);
}

/** Ask for Notification permission (called after the first reminder is added). */
export function requestNotificationPermission(lang: Lang) {
  if (typeof Notification === 'undefined' || Notification.permission !== 'default') return;
  try {
    Notification.requestPermission().then((permission) => {
      if (permission === 'denied') {
        // user declined — in-app toasts still work
        void lang;
      }
    });
  } catch {
    // ignore
  }
}
