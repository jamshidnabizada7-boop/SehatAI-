'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { toast } from 'sonner';
import { BadgeCheck, Clock, LogOut, ScrollText, ShieldCheck, Trash2, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppStore } from '@/lib/store/app-store';
import { resolveUiLang, t } from '@/lib/i18n';
import { clearJournal, clearProfile } from '@/lib/profile';
import { cn } from '@/lib/utils';

interface MeInfo {
  email: string;
  name: string | null;
  consented: boolean;
  retentionDays: number | null;
}

interface AuditEvent {
  id: string;
  action: string;
  resource: string | null;
  createdAt: string;
}

const RETENTION_OPTIONS = [
  { value: '30', labelKey: 'retention30' },
  { value: '90', labelKey: 'retention90' },
  { value: '365', labelKey: 'retention365' },
  { value: '1825', labelKey: 'retention1825' },
  { value: '0', labelKey: 'retentionIndefinite' },
] as const;

function retentionLabel(days: number | null): string {
  switch (days) {
    case 30:
      return '30';
    case 90:
      return '90';
    case 365:
      return '365';
    case 1825:
      return '1825';
    case null:
      return '0';
    default:
      return '365';
  }
}

function retentionText(days: number | null, lang: 'en' | 'ur' | 'roman'): string {
  if (days === null) {
    return lang === 'ur' ? 'جب تک میں مٹا نہ دوں' : lang === 'roman' ? 'Jab tak main mita na doon' : 'Until I delete it';
  }
  if (lang === 'ur') {
    return days === 365 ? '1 سال' : days === 1825 ? '5 سال' : `${days} دن`;
  }
  if (lang === 'roman') {
    return days === 365 ? '1 saal' : days === 1825 ? '5 saal' : `${days} din`;
  }
  return days === 365 ? '1 year' : days === 1825 ? '5 years' : `${days} days`;
}

function formatWhen(iso: string): string {
  try {
    const d = new Date(iso);
    const date = d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    const time = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    return `${date} · ${time}`;
  } catch {
    return iso;
  }
}

/**
 * Account & data settings: retention preference, audit-log viewer,
 * sign-out and "delete all my data" (with confirmation).
 * Signed-out users get a sign-in prompt instead.
 */
export function AccountSection() {
  const { status, data: session } = useSession();
  const langPref = useAppStore((s) => s.langPref);
  const uiLang = resolveUiLang(langPref);
  const isRtl = uiLang === 'ur';

  const [me, setMe] = useState<MeInfo | null>(null);
  const [retention, setRetention] = useState<string>('365');
  const [retentionSaving, setRetentionSaving] = useState(false);
  const [events, setEvents] = useState<AuditEvent[] | null>(null);
  const [eventsFailed, setEventsFailed] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const loadedOnce = useRef(false);

  useEffect(() => {
    if (status !== 'authenticated') {
      setMe(null);
      setEvents(null);
      loadedOnce.current = false;
      return;
    }
    if (loadedOnce.current) return;
    loadedOnce.current = true;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/user/me', { cache: 'no-store' });
        if (!res.ok) throw new Error('me failed');
        const data = (await res.json()) as { user?: MeInfo | null };
        if (cancelled || !data.user) return;
        setMe(data.user);
        setRetention(retentionLabel(data.user.retentionDays));
      } catch {
        // keep nulls — section degrades gracefully
      }
      try {
        const res = await fetch('/api/audit', { cache: 'no-store' });
        if (!res.ok) throw new Error('audit failed');
        const data = (await res.json()) as { events?: AuditEvent[] };
        if (!cancelled) setEvents(data.events ?? []);
      } catch {
        if (!cancelled) setEventsFailed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [status]);

  const saveRetention = useCallback(
    async (value: string) => {
      setRetention(value);
      setRetentionSaving(true);
      try {
        const res = await fetch('/api/user/consent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            consent: me?.consented ?? true,
            retentionDays: value === '0' ? 0 : Number(value),
          }),
        });
        if (!res.ok) throw new Error('consent failed');
        toast.success(t(uiLang, 'settings.retentionSaved'));
      } catch {
        toast.error(t(uiLang, 'settings.retentionFailed'));
      } finally {
        setRetentionSaving(false);
      }
    },
    [me?.consented, uiLang],
  );

  const handleDelete = useCallback(async () => {
    if (deleting) return;
    setDeleting(true);
    try {
      const res = await fetch('/api/user/delete', { method: 'DELETE' });
      if (!res.ok) throw new Error('delete failed');
      toast.success(t(uiLang, 'settings.deleteSuccess'));
      setDeleteOpen(false);
      // also wipe the device-local profile + journal mirrors
      clearProfile();
      clearJournal();
      // sign out (clears the orphaned JWT) and land on the guest home
      await signOut({ redirect: false });
      window.location.href = '/';
    } catch {
      toast.error(t(uiLang, 'settings.deleteFailed'));
      setDeleting(false);
    }
  }, [deleting, uiLang]);

  // ---- signed out: prompt ----
  if (status !== 'authenticated') {
    return (
      <section aria-labelledby="account-heading" className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="account-heading" className="text-lg font-bold tracking-tight text-foreground">
            {t(uiLang, 'settings.title')}
          </h2>
        </div>
        <Card className="border-dashed border-border bg-card/40">
          <CardContent className="flex flex-col items-start gap-3 px-4 py-5 sm:px-6">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/12 text-primary">
              <UserRound className="h-5 w-5" aria-hidden />
            </span>
            <div className="flex flex-col gap-0.5">
              <p className="text-sm font-bold text-foreground">{t(uiLang, 'settings.notSignedInTitle')}</p>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {t(uiLang, 'settings.notSignedInBody')}
              </p>
            </div>
            <Button asChild className="h-10 rounded-xl px-4 text-sm font-bold">
              <Link href="/auth/signin">{t(uiLang, 'settings.notSignedInCta')}</Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    );
  }

  // ---- signed in: settings ----
  return (
    <section aria-labelledby="account-heading" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="account-heading" className="text-lg font-bold tracking-tight text-foreground">
          {t(uiLang, 'settings.title')}
        </h2>
        {me ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
            <BadgeCheck className="h-3 w-3" aria-hidden />
            {t(uiLang, 'settings.signedInAs')} {me.email}
          </span>
        ) : null}
      </div>

      <Card className="border-border bg-card/60 shadow-sm">
        <CardHeader className="gap-1 border-b border-border bg-card/40 px-4 py-3 sm:px-6">
          <CardTitle className="text-sm font-bold text-foreground">
            {t(uiLang, 'settings.subtitle')}
          </CardTitle>
          {me ? (
            <CardDescription className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <ShieldCheck className="h-3 w-3" aria-hidden />
              {me.consented
                ? t(uiLang, 'settings.consentGiven')
                : t(uiLang, 'settings.consentNotGiven')}
            </CardDescription>
          ) : null}
        </CardHeader>
        <CardContent className="flex flex-col gap-5 px-4 py-4 sm:px-6">
          {/* retention preference */}
          <div className="flex flex-col gap-2">
            <label
              htmlFor="account-retention"
              className="flex items-center gap-1.5 text-sm font-bold text-foreground"
            >
              <Clock className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
              {t(uiLang, 'settings.retentionLabel')}
            </label>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {t(uiLang, 'settings.retentionHint')}
            </p>
            <Select
              value={retention}
              onValueChange={(v) => void saveRetention(v)}
              disabled={retentionSaving || !me}
            >
              <SelectTrigger
                id="account-retention"
                className="h-10 min-h-10 w-full max-w-xs rounded-xl border-border text-sm"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RETENTION_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {retentionText(
                      opt.value === '0' ? null : Number(opt.value),
                      uiLang,
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* audit log viewer */}
          <div className="flex flex-col gap-2">
            <p className="flex items-center gap-1.5 text-sm font-bold text-foreground">
              <ScrollText className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
              {t(uiLang, 'settings.auditLabel')}
            </p>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {t(uiLang, 'settings.auditHint')}
            </p>
            {eventsFailed ? (
              <p className="text-xs font-medium text-red-700 dark:text-red-400">
                {t(uiLang, 'settings.auditFailed')}
              </p>
            ) : events === null ? (
              <div className="h-16 animate-pulse rounded-xl bg-muted" />
            ) : events.length === 0 ? (
              <p className="rounded-xl bg-muted/40 px-3 py-2.5 text-xs text-muted-foreground">
                {t(uiLang, 'settings.auditEmpty')}
              </p>
            ) : (
              <ol
                className={cn(
                  'custom-scrollbar max-h-44 overflow-y-auto rounded-xl border border-border bg-background/60',
                  isRtl && 'font-urdu',
                )}
                dir={isRtl ? 'rtl' : 'ltr'}
              >
                {events.map((e, i) => (
                  <li
                    key={e.id}
                    className={cn(
                      'flex items-center justify-between gap-3 px-3 py-2 text-xs',
                      i > 0 && 'border-t border-border/60',
                    )}
                  >
                    <span className="min-w-0">
                      <span dir="ltr" className="font-mono text-[11px] font-semibold text-foreground">
                        {e.action}
                      </span>
                      {e.resource ? (
                        <span className="ms-1.5 text-muted-foreground">({e.resource})</span>
                      ) : null}
                    </span>
                    <span className="shrink-0 text-[10px] text-muted-foreground" dir="ltr">
                      {formatWhen(e.createdAt)}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </div>

          {/* sign out */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
            <div className="flex flex-col">
              <p className="text-sm font-bold text-foreground">{t(uiLang, 'settings.signOutLabel')}</p>
              <p className="text-xs text-muted-foreground">{t(uiLang, 'settings.signOutHint')}</p>
            </div>
            <Button
              variant="outline"
              className="h-10 gap-1.5 rounded-xl border-border px-4 text-sm font-semibold"
              onClick={() => void signOut({ callbackUrl: '/' })}
            >
              <LogOut className="h-4 w-4" aria-hidden />
              {t(uiLang, 'settings.signOutLabel')}
            </Button>
          </div>

          {/* delete all my data */}
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-red-500/25 bg-red-500/5 p-3">
            <div className="flex min-w-0 flex-col">
              <p className="flex items-center gap-1.5 text-sm font-bold text-red-700 dark:text-red-400">
                <Trash2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
                {t(uiLang, 'settings.deleteLabel')}
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                {t(uiLang, 'settings.deleteHint')}
              </p>
            </div>
            <Button
              variant="destructive"
              className="h-10 shrink-0 gap-1.5 rounded-xl px-4 text-sm font-bold"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="h-4 w-4" aria-hidden />
              {t(uiLang, 'settings.deleteLabel')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* delete confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t(uiLang, 'settings.deleteConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t(uiLang, 'settings.deleteConfirmBody')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <button
                className="h-10 rounded-md border border-border bg-background px-4 text-sm font-semibold text-foreground transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
                disabled={deleting}
              >
                {t(uiLang, 'chat.cancel')}
              </button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <button
                onClick={(e) => {
                  e.preventDefault(); // keep the dialog open while deleting
                  void handleDelete();
                }}
                disabled={deleting}
                className="h-10 rounded-md bg-destructive px-4 text-sm font-semibold text-destructive-foreground transition-colors hover:bg-destructive/90 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring disabled:opacity-60"
              >
                {deleting ? '…' : t(uiLang, 'settings.deleteConfirmButton')}
              </button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
