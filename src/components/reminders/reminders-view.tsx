'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Baby,
  Bell,
  CalendarClock,
  CheckCircle2,
  Pill,
  Plus,
  RotateCcw,
  Share2,
  Syringe,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAppStore } from '@/lib/store/app-store';
import { useChatStore } from '@/lib/store/chat-store';
import { useReminderAlerts, requestNotificationPermission } from '@/hooks/use-reminder-alerts';
import { resolveUiLang, t } from '@/lib/i18n';
import type { Lang, Reminder, Reminder as ReminderType } from '@/lib/types';
import { cn } from '@/lib/utils';
import { ReminderDialog, type ReminderDraft } from './reminder-dialog';

const DAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const TYPE_ICONS: Record<Reminder['type'], React.ComponentType<{ className?: string }>> = {
  med: Pill,
  vax: Syringe,
  anc: Baby,
  other: Bell,
};

const TYPE_STYLES: Record<Reminder['type'], string> = {
  med: 'bg-emerald-600/10 text-emerald-700 dark:text-emerald-400',
  vax: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
  anc: 'bg-pink-500/10 text-pink-600 dark:text-pink-400',
  other: 'bg-stone-500/10 text-stone-600 dark:text-stone-400',
};

function formatNextDue(iso: string, lang: Lang): string {
  try {
    const date = new Date(iso);
    return new Intl.DateTimeFormat(lang === 'ur' ? 'ur-PK' : undefined, {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return iso;
  }
}

/** Share a reminder with family — WhatsApp compose link (the default
 *  forwarding channel in Pakistan). Falls back to the native share sheet
 *  first when the device supports it. */
function shareReminder(reminder: ReminderType, uiLang: Lang) {
  const daysLabel =
    reminder.days.length === 0
      ? t(uiLang, 'reminders.everyday')
      : reminder.days
          .slice()
          .sort((a, b) => a - b)
          .map((d) => DAY_LETTERS[d])
          .join(' ');
  const text = [
    `${t(uiLang, 'app.name')} — ${t(uiLang, 'reminders.title')}`,
    '',
    `⏰ ${reminder.title}`,
    `🕐 ${reminder.timeOfDay} · ${daysLabel}`,
    `📅 ${t(uiLang, 'reminders.nextDue')}: ${formatNextDue(reminder.nextDue, uiLang)}`,
    reminder.notes ? `📝 ${reminder.notes}` : null,
  ]
    .filter(Boolean)
    .join('\n');
  try {
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
  } catch {
    // popups blocked — nothing more we can do here
  }
}

export function RemindersView() {
  const { toast } = useToast();
  const langPref = useAppStore((s) => s.langPref);
  const ensureSession = useAppStore((s) => s.ensureSession);
  const uiLang = resolveUiLang(langPref);

  const pendingDraft = useChatStore((s) => s.pendingReminderDraft);
  const setPendingDraft = useChatStore((s) => s.setPendingReminderDraft);

  const [reminders, setReminders] = useState<ReminderType[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loadError, setLoadError] = useState(false);

  useReminderAlerts(reminders, uiLang);

  // When a "Save as reminder" quick action sets a pending draft, open the
  // dialog. The dialog itself reads the draft and applies it via an internal
  // effect, then calls onDraftConsumed to clear this state.
  useEffect(() => {
    if (pendingDraft) {
      setDialogOpen(true);
    }
  }, [pendingDraft]);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const sessionId = ensureSession();
      const res = await fetch(`/api/reminders?sessionId=${encodeURIComponent(sessionId)}`);
      if (!res.ok) throw new Error(`reminders ${res.status}`);
      const data = (await res.json()) as { reminders?: ReminderType[] };
      setReminders(data.reminders ?? []);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [ensureSession]);

  useEffect(() => {
    void load();
  }, [load]);

  const createReminder = useCallback(
    async (draft: ReminderDraft): Promise<boolean> => {
      const sessionId = ensureSession();
      const tempId = `temp-${Date.now()}`;
      const optimistic: ReminderType = {
        id: tempId,
        sessionToken: sessionId,
        type: draft.type,
        title: draft.title,
        notes: draft.notes,
        timeOfDay: draft.timeOfDay,
        days: draft.days,
        nextDue: new Date().toISOString(),
        status: 'active',
        createdAt: new Date().toISOString(),
      };
      setReminders((prev) => [optimistic, ...prev]);
      try {
        const res = await fetch('/api/reminders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            type: draft.type,
            title: draft.title,
            notes: draft.notes,
            timeOfDay: draft.timeOfDay,
            days: draft.days,
          }),
        });
        if (!res.ok) throw new Error(`create ${res.status}`);
        const data = (await res.json()) as { reminder?: ReminderType };
        const created = data.reminder;
        setReminders((prev) =>
          created ? prev.map((r) => (r.id === tempId ? created : r)) : prev,
        );
        toast({ description: t(uiLang, 'reminders.saved') });
        requestNotificationPermission(uiLang);
        return true;
      } catch {
        setReminders((prev) => prev.filter((r) => r.id !== tempId));
        toast({ description: t(uiLang, 'reminders.failed'), variant: 'destructive' });
        return false;
      }
    },
    [ensureSession, toast, uiLang],
  );

  const toggleStatus = useCallback(
    async (reminder: ReminderType) => {
      const nextStatus: Reminder['status'] = reminder.status === 'active' ? 'done' : 'active';
      const prev = reminders;
      setReminders((rs) =>
        rs.map((r) => (r.id === reminder.id ? { ...r, status: nextStatus } : r)),
      );
      try {
        const res = await fetch(`/api/reminders/${encodeURIComponent(reminder.id)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: nextStatus }),
        });
        if (!res.ok) throw new Error(`update ${res.status}`);
      } catch {
        setReminders(prev);
        toast({ description: t(uiLang, 'reminders.failed'), variant: 'destructive' });
      }
    },
    [reminders, toast, uiLang],
  );

  const remove = useCallback(
    async (reminder: ReminderType) => {
      const prev = reminders;
      setReminders((rs) => rs.filter((r) => r.id !== reminder.id));
      try {
        const res = await fetch(`/api/reminders/${encodeURIComponent(reminder.id)}`, {
          method: 'DELETE',
        });
        if (!res.ok) throw new Error(`delete ${res.status}`);
        toast({ description: t(uiLang, 'reminders.deleted') });
      } catch {
        setReminders(prev);
        toast({ description: t(uiLang, 'reminders.failed'), variant: 'destructive' });
      }
    },
    [reminders, toast, uiLang],
  );

  const sorted = useMemo(() => {
    return [...reminders].sort((a, b) => {
      if (a.status === 'active' && b.status !== 'active') return -1;
      if (a.status !== 'active' && b.status === 'active') return 1;
      return a.timeOfDay.localeCompare(b.timeOfDay);
    });
  }, [reminders]);

  return (
    <div className="custom-scrollbar h-full overflow-y-auto px-4 py-4 sm:px-6">
      <div className="mx-auto max-w-2xl space-y-4">
        {/* header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-foreground sm:text-2xl">
              {t(uiLang, 'reminders.title')}
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {t(uiLang, 'reminders.subtitle')}
            </p>
          </div>
          <Button
            onClick={() => setDialogOpen(true)}
            className="min-h-11 shrink-0 gap-1.5 rounded-xl bg-primary font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
            aria-label={t(uiLang, 'reminders.add')}
          >
            <Plus className="h-4 w-4" aria-hidden />
            <span className="hidden sm:inline">{t(uiLang, 'reminders.add')}</span>
          </Button>
        </div>

        {/* list */}
        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-24 w-full rounded-2xl" />
            ))}
          </div>
        ) : loadError ? (
          <div className="rounded-2xl border border-destructive/30 bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
            {t(uiLang, 'reminders.loadFailed')}
            <Button
              variant="outline"
              size="sm"
              onClick={() => void load()}
              className="ms-2 h-8 border-red-300 text-red-700 hover:bg-red-100 dark:border-red-800 dark:text-red-300"
            >
              {t(uiLang, 'facilities.retry')}
            </Button>
          </div>
        ) : sorted.length === 0 ? (
          <div className="relative flex flex-col items-center gap-3 overflow-hidden rounded-2xl border border-dashed border-border bg-card/50 px-6 py-12 text-center">
            {/* soft gradient halo behind the icon — premium, not wireframe-y */}
            <span
              className="pointer-events-none absolute -top-12 left-1/2 h-32 w-32 -translate-x-1/2 rounded-full bg-primary/12 blur-2xl"
              aria-hidden
            />
            <span className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
              <CalendarClock className="h-8 w-8 text-primary" aria-hidden />
            </span>
            <p className="text-base font-semibold text-foreground">
              {t(uiLang, 'reminders.empty')}
            </p>
            <p className="max-w-sm text-sm text-muted-foreground">
              {t(uiLang, 'reminders.emptyDesc')}
            </p>
            {/* quick examples — what kinds of reminders work */}
            <ul className="mt-1 flex flex-wrap items-center justify-center gap-1.5 text-[11px] font-medium text-muted-foreground">
              {[
                t(uiLang, 'reminders.typeMed'),
                t(uiLang, 'reminders.typeVax'),
                t(uiLang, 'reminders.typeAnc'),
                t(uiLang, 'reminders.typeOther'),
              ].map((label) => (
                <li
                  key={label}
                  className="rounded-full border border-border bg-background/80 px-2.5 py-1"
                >
                  {label}
                </li>
              ))}
            </ul>
            <Button
              onClick={() => setDialogOpen(true)}
              className="mt-2 min-h-11 gap-1.5 rounded-xl bg-primary font-semibold text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" aria-hidden />
              {t(uiLang, 'reminders.add')}
            </Button>
          </div>
        ) : (
          <ul className="custom-scrollbar max-h-96 space-y-3 overflow-y-auto pe-1" aria-label={t(uiLang, 'reminders.title')}>
            {sorted.map((reminder, idx) => {
              const Icon = TYPE_ICONS[reminder.type];
              const isDone = reminder.status === 'done';
              return (
                <motion.li
                  key={reminder.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: Math.min(idx * 0.03, 0.2) }}
                >
                  <div
                    className={cn(
                      'rounded-2xl border border-border bg-card p-4 shadow-sm transition-opacity',
                      isDone && 'opacity-60',
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={cn(
                          'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                          TYPE_STYLES[reminder.type],
                        )}
                        aria-hidden
                      >
                        <Icon className="h-5 w-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p
                            className={cn(
                              'text-sm font-semibold text-foreground',
                              isDone && 'line-through',
                            )}
                          >
                            {reminder.title}
                          </p>
                          <span
                            className={cn(
                              'rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase',
                              reminder.status === 'active'
                                ? 'bg-emerald-600/10 text-emerald-700 dark:text-emerald-400'
                                : 'bg-secondary text-muted-foreground',
                            )}
                          >
                            {t(uiLang, `reminders.${reminder.status}`)}
                          </span>
                        </div>
                        {reminder.notes ? (
                          <p className="mt-0.5 truncate text-xs text-muted-foreground">
                            {reminder.notes}
                          </p>
                        ) : null}
                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
                          <span className="font-semibold text-foreground">
                            {reminder.timeOfDay}
                          </span>
                          <span className="flex gap-1">
                            {reminder.days.length === 0 ? (
                              <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium">
                                {t(uiLang, 'reminders.everyday')}
                              </span>
                            ) : (
                              reminder.days
                                .slice()
                                .sort((a, b) => a - b)
                                .map((d) => (
                                  <span
                                    key={d}
                                    className="flex h-5 w-5 items-center justify-center rounded-md bg-secondary text-[10px] font-bold"
                                  >
                                    {DAY_LETTERS[d]}
                                  </span>
                                ))
                            )}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <CalendarClock className="h-3.5 w-3.5" aria-hidden />
                            {t(uiLang, 'reminders.nextDue')}:{' '}
                            {formatNextDue(reminder.nextDue, uiLang)}
                          </span>
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-col gap-1">
                        <button
                          type="button"
                          onClick={() => void toggleStatus(reminder)}
                          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
                          aria-label={isDone ? t(uiLang, 'reminders.reactivate') : t(uiLang, 'reminders.markDone')}
                        >
                          {isDone ? (
                            <RotateCcw className="h-4 w-4" aria-hidden />
                          ) : (
                            <CheckCircle2 className="h-4 w-4" aria-hidden />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => shareReminder(reminder, uiLang)}
                          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-emerald-500/10 hover:text-emerald-600 focus-visible:outline-2 focus-visible:outline-ring dark:hover:text-emerald-400"
                          aria-label={t(uiLang, 'reminders.share')}
                        >
                          <Share2 className="h-4 w-4" aria-hidden />
                        </button>
                        <button
                          type="button"
                          onClick={() => void remove(reminder)}
                          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600 focus-visible:outline-2 focus-visible:outline-ring dark:hover:bg-red-950/50"
                          aria-label={t(uiLang, 'reminders.delete')}
                        >
                          <Trash2 className="h-4 w-4" aria-hidden />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.li>
              );
            })}
          </ul>
        )}
      </div>

      <ReminderDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        lang={uiLang}
        onSave={createReminder}
        initialDraft={pendingDraft}
        onDraftConsumed={() => setPendingDraft(null)}
      />
    </div>
  );
}
