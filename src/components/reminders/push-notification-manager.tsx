'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, BellOff, BellRing, Check, X, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/lib/store/app-store';
import { resolveUiLang } from '@/lib/i18n';
import { cn } from '@/lib/utils';

// ============================================================
// SehatAI — Push Notification Manager (Phase 2)
// Manages browser notification permission for medication reminders.
//
// This is a permission + local-notification manager. The full
// Web Push API (server-side push when the app is closed) requires
// VAPID keys + a push service subscription — that's Phase 3.
//
// For now, we:
//   1. Request Notification.permission
//   2. Show permission status (granted / denied / default)
//   3. Send a test local notification
//   4. Explain the fallback (in-app alerts when permission denied)
// ============================================================

type PermState = 'default' | 'granted' | 'denied' | 'unsupported';

function getPerm(): PermState {
  if (typeof window === 'undefined' || typeof Notification === 'undefined') return 'unsupported';
  return Notification.permission as PermState;
}

/** Phase 2 — Fetch VAPID public key from server + convert to Uint8Array for pushManager.subscribe */
async function fetchVapidKey(): Promise<Uint8Array> {
  try {
    const res = await fetch('/api/push/vapid');
    const data = await res.json();
    const key = data.publicKey as string;
    // Convert base64url to Uint8Array
    const padding = '='.repeat((4 - (key.length % 4)) % 4);
    const base64 = (key + padding).replace(/-/g, '+').replace(/_/g, '/');
    const raw = atob(base64);
    const arr = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
    return arr;
  } catch {
    throw new Error('Failed to fetch VAPID key');
  }
}

export function PushNotificationManager() {
  const langPref = useAppStore((s) => s.langPref);
  const uiLang = resolveUiLang(langPref);
  const [perm, setPerm] = useState<PermState>(() => getPerm());
  const [testSent, setTestSent] = useState(false);
  const [pushSubscribed, setPushSubscribed] = useState(false);

  const requestPermission = useCallback(async () => {
    if (typeof Notification === 'undefined') return;
    try {
      const result = await Notification.requestPermission();
      setPerm(result as PermState);
      // Phase 2 — subscribe to push service when permission granted
      if (result === 'granted' && 'serviceWorker' in navigator && 'PushManager' in window) {
        try {
          const reg = await navigator.serviceWorker.ready;
          const sub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: await fetchVapidKey(),
          });
          // Store subscription on server
          await fetch('/api/push/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ subscription: sub }),
          });
          setPushSubscribed(true);
        } catch {
          // Push subscription failed — local notifications still work
        }
      }
    } catch {
      setPerm('denied');
    }
  }, []);

  const sendTest = useCallback(() => {
    if (perm !== 'granted' || typeof Notification === 'undefined') return;
    try {
      const notif = new Notification(
        uiLang === 'ur' ? 'سی ایچ اے آئی — یاد دہانی' : uiLang === 'roman' ? 'SehatAI — Yaad-dahani' : 'SehatAI — Reminder',
        {
          body:
            uiLang === 'ur'
              ? 'یہ ایک ٹیسٹ نوٹیفکیشن ہے۔ آپ کی دوائی کی یاد دہانی اسی طرح ظاہر ہوگی۔'
              : uiLang === 'roman'
                ? 'Yeh ek test notification hai. Aap ki dawai ki yaad-dahani isi tarah zahir hogi.'
                : 'This is a test notification. Your medication reminders will appear like this.',
          icon: '/icon.svg',
          tag: 'sehatai-test',
        },
      );
      notif.onclick = () => {
        window.focus();
        notif.close();
      };
      setTestSent(true);
      setTimeout(() => setTestSent(false), 4000);
    } catch {
      // ignore
    }
  }, [perm, uiLang]);

  if (perm === 'unsupported') {
    return (
      <div className="rounded-xl border border-border bg-card p-3 shadow-sm">
        <div className="flex items-center gap-2">
          <BellOff className="h-4 w-4 text-muted-foreground" aria-hidden />
          <p className="text-xs font-semibold text-foreground">
            {uiLang === 'ur' ? 'نوٹیفکیشنز اس ڈیوائس پر دستیاب نہیں' : uiLang === 'roman' ? 'Notifications is device par dastiyab nahin' : 'Notifications unavailable on this device'}
          </p>
        </div>
      </div>
    );
  }

  const config = {
    granted: {
      icon: BellRing,
      color: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
      label: { en: 'Notifications on', ur: 'نوٹیفکیشنز آن', roman: 'Notifications on' },
    },
    denied: {
      icon: BellOff,
      color: 'bg-red-500/15 text-red-700 dark:text-red-400',
      label: { en: 'Blocked', ur: 'بلاک شدہ', roman: 'Blocked' },
    },
    default: {
      icon: Bell,
      color: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
      label: { en: 'Not enabled', ur: 'فعال نہیں', roman: 'Not enabled' },
    },
    unsupported: {
      icon: BellOff,
      color: 'bg-muted text-muted-foreground',
      label: { en: 'Unsupported', ur: 'غیر معاون', roman: 'Unsupported' },
    },
  }[perm];

  const Icon = config.icon;

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={cn('flex h-8 w-8 items-center justify-center rounded-lg', config.color)}>
            <Icon className="h-4 w-4" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-bold text-foreground">
              {uiLang === 'ur' ? 'دوائی کی یاد دہانی' : uiLang === 'roman' ? 'Dawai ki yaad-dahani' : 'Medication reminders'}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {uiLang === 'ur' ? 'براؤزر نوٹیفکیشنز' : uiLang === 'roman' ? 'Browser notifications' : 'Browser notifications'}
            </p>
          </div>
        </div>
        <Badge variant="secondary" className={cn('gap-1 text-[10px] font-bold', config.color)}>
          <Icon className="h-2.5 w-2.5" aria-hidden />
          {config.label[uiLang]}
        </Badge>
      </div>

      <p className="mb-3 text-[11px] leading-relaxed text-muted-foreground">
        {perm === 'granted'
          ? uiLang === 'ur'
            ? 'آپ کی دوائی کی یاد دہانی اب آپ کی اسکرین پر ظاہر ہوگی، چاہے ایپ کھلی ہو یا نہیں۔'
            : uiLang === 'roman'
              ? 'Aap ki dawai ki yaad-dahani ab aap ki screen par zahir hogi, chahey app khuli ho ya nahin.'
              : 'Your medication reminders will now appear on your screen, even when the app is not open.'
          : perm === 'denied'
            ? uiLang === 'ur'
              ? 'آپ نے نوٹیفکیشنز بلاک کر رکھی ہیں۔ براؤزر کی سیٹنگز سے اجازت دیں، یا ایپ کے اندر الرٹس کا استعمال کریں۔'
              : uiLang === 'roman'
                ? 'Aap ne notifications block kar rakhi hain. Browser ki settings se ijazat dein, ya app ke andar alerts ka istemal karein.'
                : 'You have blocked notifications. Enable them in your browser settings, or use in-app alerts as a fallback.'
            : uiLang === 'ur'
              ? 'یاد دہانی کے لیے نوٹیفکیشنز فعال کریں۔ آپ کی رازداری محفوظ ہے — کوئی ڈیٹا سرور پر نہیں جاتا۔'
              : uiLang === 'roman'
                ? 'Yaad-dahani ke liye notifications faal karein. Aap ki razdari mehfooz hai — koi data server par nahin jata.'
                : 'Enable notifications for reminders. Your privacy is protected — no data leaves your device.'}
      </p>

      <div className="flex flex-wrap gap-2">
        {perm !== 'granted' ? (
          <Button
            onClick={() => void requestPermission()}
            disabled={perm === 'denied'}
            size="sm"
            className="min-h-10 gap-1.5 rounded-xl bg-primary text-xs font-semibold text-primary-foreground hover:bg-primary/90"
          >
            <Bell className="h-3.5 w-3.5" aria-hidden />
            {uiLang === 'ur' ? 'اجازت دیں' : uiLang === 'roman' ? 'Ijazat dein' : 'Enable'}
          </Button>
        ) : null}
        {perm === 'granted' ? (
          <Button
            onClick={sendTest}
            variant="outline"
            size="sm"
            className="min-h-10 gap-1.5 rounded-xl border-primary/40 text-xs font-semibold text-primary hover:bg-primary/10"
          >
            {testSent ? <Check className="h-3.5 w-3.5" aria-hidden /> : <BellRing className="h-3.5 w-3.5" aria-hidden />}
            {testSent
              ? (uiLang === 'ur' ? 'بھیجیا' : uiLang === 'roman' ? 'Bheja' : 'Sent')
              : (uiLang === 'ur' ? 'ٹیسٹ بھیجیں' : uiLang === 'roman' ? 'Test bhejein' : 'Send test')}
          </Button>
        ) : null}
      </div>

      {perm === 'denied' ? (
        <div className="mt-2 flex items-start gap-1.5 rounded-lg border border-amber-500/30 bg-amber-50/50 p-2 text-[10px] leading-relaxed text-amber-800 dark:bg-amber-950/20 dark:text-amber-300">
          <ShieldCheck className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />
          <span>
            {uiLang === 'ur'
              ? 'ایپ کے اندر الرٹس اب بھی کام کریں گے — سیٹنگز → سائٹ کی اجازتیں → نوٹیفکیشنز'
              : uiLang === 'roman'
                ? 'App ke andar alerts abhi bhi kaam karenge — Settings → Site permissions → Notifications'
                : 'In-app alerts still work — Settings → Site permissions → Notifications'}
          </span>
        </div>
      ) : null}
    </div>
  );
}
