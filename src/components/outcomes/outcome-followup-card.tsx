'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { HeartPulse } from 'lucide-react';
import { useAppStore } from '@/lib/store/app-store';
import { useChatStore } from '@/lib/store/chat-store';
import { resolveUiLang, t } from '@/lib/i18n';
import { cn } from '@/lib/utils';

interface PendingOutcome {
  id: string;
  scheduledFor: string;
  status: string;
}

type OutcomeValue = 'better' | 'same' | 'worse' | 'saw_doctor';

/**
 * Closed-loop outcome follow-up card ("How are you feeling?").
 * Rendered at the top of the chat view after a response triaged URGENT or
 * ROUTINE, when the signed-in user has pending outcome entries.
 * "Worse" / "Saw a doctor" escalate → toast with a re-check CTA that
 * pre-fills the chat input via the existing pendingChatDraft mechanism.
 */
export function OutcomeFollowupCard({ refreshKey, active }: { refreshKey: number; active: boolean }) {
  const { status } = useSession();
  const langPref = useAppStore((s) => s.langPref);
  const uiLang = resolveUiLang(langPref);
  const isRtl = uiLang === 'ur';
  const setPendingChatDraft = useChatStore((s) => s.setPendingChatDraft);

  const [pending, setPending] = useState<PendingOutcome[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (status !== 'authenticated') {
      setPending([]);
      return;
    }
    let cancelled = false;
    fetch('/api/outcomes', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { pending?: PendingOutcome[] } | null) => {
        if (!cancelled && data && Array.isArray(data.pending)) {
          setPending(data.pending);
        }
      })
      .catch(() => {
        // silent — the card simply stays hidden
      });
    return () => {
      cancelled = true;
    };
  }, [status, refreshKey]);

  const record = useCallback(
    async (outcome: OutcomeValue) => {
      const entry = pending[0];
      if (!entry || submitting) return;
      setSubmitting(true);
      try {
        const res = await fetch('/api/outcomes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ outcomeEntryId: entry.id, outcome }),
        });
        if (!res.ok) throw new Error('outcome failed');
        setPending((list) => list.filter((e) => e.id !== entry.id));
        if (outcome === 'worse' || outcome === 'saw_doctor') {
          // Escalated: offer a symptom re-check through the chat draft.
          toast.success(t(uiLang, 'outcome.escalatedToast'), {
            duration: 9000,
            action: {
              label: t(uiLang, 'outcome.escalatedCta'),
              onClick: () => setPendingChatDraft(t(uiLang, 'outcome.recheckPrompt')),
            },
          });
        } else {
          toast.success(t(uiLang, 'outcome.recorded'));
        }
      } catch {
        toast.error(t(uiLang, 'outcome.recordFailed'));
      } finally {
        setSubmitting(false);
      }
    },
    [pending, setPendingChatDraft, submitting, uiLang],
  );

  if (status !== 'authenticated' || !active || pending.length === 0) return null;

  const buttons: { value: OutcomeValue; key: 'outcome.better' | 'outcome.same' | 'outcome.worse' | 'outcome.sawDoctor'; danger?: boolean }[] = [
    { value: 'better', key: 'outcome.better' },
    { value: 'same', key: 'outcome.same' },
    { value: 'worse', key: 'outcome.worse', danger: true },
    { value: 'saw_doctor', key: 'outcome.sawDoctor' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      role="status"
      aria-live="polite"
      className={cn(
        'rounded-2xl border border-amber-500/30 bg-amber-500/8 p-3.5 shadow-sm',
        isRtl && 'font-urdu',
      )}
    >
      <div className="flex items-start gap-2.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-400">
          <HeartPulse className="h-4.5 w-4.5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-foreground">{t(uiLang, 'outcome.heading')}</p>
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            {t(uiLang, 'outcome.subheading')}
          </p>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {buttons.map((b) => (
              <button
                key={b.value}
                type="button"
                disabled={submitting}
                onClick={() => void record(b.value)}
                className={cn(
                  'inline-flex min-h-11 items-center rounded-full border px-3.5 text-xs font-bold transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring disabled:opacity-60',
                  b.danger
                    ? 'border-red-500/30 bg-red-500/10 text-red-700 hover:bg-red-500/20 dark:text-red-400'
                    : 'border-border bg-background text-foreground/90 hover:bg-accent',
                )}
              >
                {t(uiLang, b.key)}
              </button>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
