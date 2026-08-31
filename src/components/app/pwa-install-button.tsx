'use client';

import { useEffect, useState } from 'react';
import { Download, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/lib/store/app-store';
import { resolveUiLang, t } from '@/lib/i18n';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/**
 * "Install app" button driven by the browser's beforeinstallprompt
 * event. Hidden when the browser cannot install PWAs (e.g. iOS
 * Safari, already-installed). Zero-risk no-op elsewhere.
 */
export function PwaInstallButton() {
  const langPref = useAppStore((s) => s.langPref);
  const uiLang = resolveUiLang(langPref);
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (!installEvent) return null;

  const install = async () => {
    try {
      await installEvent.prompt();
    } finally {
      setInstallEvent(null);
    }
  };

  return (
    <Button
      onClick={() => void install()}
      className="min-h-11 gap-2 rounded-xl bg-primary px-4 text-xs font-bold text-primary-foreground shadow-sm hover:bg-primary/90"
      aria-label={t(uiLang, 'about.installApp')}
    >
      <Download className="h-4 w-4" aria-hidden />
      {t(uiLang, 'about.installApp')}
      <Smartphone className="h-3.5 w-3.5 opacity-70" aria-hidden />
    </Button>
  );
}
