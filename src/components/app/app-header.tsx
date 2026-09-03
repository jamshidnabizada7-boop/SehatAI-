'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useTheme } from 'next-themes';
import { Globe2, HeartPulse, Moon, Search, Sun, Wifi, WifiOff, Stethoscope, ShieldCheck, Clock, ShieldAlert } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/lib/store/app-store';
import { resolveUiLang, t } from '@/lib/i18n';
import type { LangPref } from '@/lib/i18n';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { LanguageSettings } from '@/components/settings/language-settings';
import { Badge } from '@/components/ui/badge';

/** Role badge — small pill showing the user's role + verification state. */
function RoleBadge() {
  const { data: session, status } = useSession();
  if (status !== 'authenticated' || !session?.user) return null;
  const role = (session.user as { role?: string }).role ?? 'user';
  const accountStatus = (session.user as { accountStatus?: string }).accountStatus ?? 'active';

  if (role === 'doctor') {
    if (accountStatus === 'pending_verification') {
      return (
        <Badge className="hidden items-center gap-1 bg-amber-500/15 text-[10px] font-bold text-amber-700 sm:inline-flex dark:text-amber-400">
          <Clock className="h-3 w-3" /> DOCTOR · PENDING
        </Badge>
      );
    }
    if (accountStatus === 'suspended' || accountStatus === 'deleted') {
      return (
        <Badge className="hidden items-center gap-1 bg-red-500/15 text-[10px] font-bold text-red-700 sm:inline-flex dark:text-red-400">
          <ShieldAlert className="h-3 w-3" /> DOCTOR · SUSPENDED
        </Badge>
      );
    }
    return (
      <Badge className="hidden items-center gap-1 bg-emerald-500/15 text-[10px] font-bold text-emerald-700 sm:inline-flex dark:text-emerald-400">
        <ShieldCheck className="h-3 w-3" /> DOCTOR
      </Badge>
    );
  }
  if (role === 'admin') {
    return (
      <Badge className="hidden items-center gap-1 bg-slate-500/15 text-[10px] font-bold text-slate-700 sm:inline-flex dark:text-slate-300">
        <ShieldCheck className="h-3 w-3" /> ADMIN
      </Badge>
    );
  }
  if (role === 'user') {
    return (
      <Badge className="hidden items-center gap-1 bg-primary/15 text-[10px] font-bold text-primary sm:inline-flex">
        <HeartPulse className="h-3 w-3" /> PATIENT
      </Badge>
    );
  }
  return null;
}

export function AppHeader() {
  const langPref = useAppStore((s) => s.langPref);
  const [langSettingsOpen, setLangSettingsOpen] = useState(false);
  const setLangPref = useAppStore((s) => s.setLangPref);
  const simulatedOffline = useAppStore((s) => s.simulatedOffline);
  const setSimulatedOffline = useAppStore((s) => s.setSimulatedOffline);
  const setSearchOpen = useAppStore((s) => s.setSearchOpen);
  const uiLang = resolveUiLang(langPref);
  const { toast } = useToast();

  const { theme, setTheme, resolvedTheme } = useTheme();

  const toggleTheme = () => {
    const isDarkNow =
      document.documentElement.classList.contains('dark') ||
      (resolvedTheme ?? theme) === 'dark';
    setTheme(isDarkNow ? 'light' : 'dark');
  };

  const langOptions: { value: LangPref; label: string }[] = [
    { value: 'auto', label: t(uiLang, 'header.languageAuto') },
    { value: 'en', label: t(uiLang, 'header.english') },
    { value: 'ur', label: t(uiLang, 'header.urdu') },
    { value: 'roman', label: t(uiLang, 'header.romanUrdu') },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="flex h-14 items-center gap-2 px-3 sm:px-4">
        {/* logo */}
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-sm">
            <HeartPulse className="h-5 w-5 text-primary-foreground" aria-hidden />
          </span>
          <span className="flex flex-col leading-none">
            <span className="flex items-center gap-1.5 text-base font-extrabold tracking-tight text-foreground">
              Sehat<span className="text-primary">AI</span>
            </span>
            <span className="hidden text-[10px] font-medium text-muted-foreground sm:block">
              {t(uiLang, 'app.tagline')}
            </span>
          </span>
        </div>

        {/* role badge */}
        <RoleBadge />

        <div className="ms-auto flex items-center gap-1.5">
          {/* global search — one box for first aid, glossary and topics */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSearchOpen(true)}
            className="h-10 w-10 rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground"
            aria-label={t(uiLang, 'header.search')}
          >
            <Search className="h-5 w-5" aria-hidden />
          </Button>

          {/* language switcher */}
          <Select value={langPref} onValueChange={(v) => setLangPref(v as LangPref)}>
            <SelectTrigger
              className="h-10 min-h-10 w-auto gap-1 rounded-xl border-border px-2.5 text-xs font-semibold"
              aria-label={t(uiLang, 'header.language')}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              {langOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Phase 2 — full language settings (Pakistan 6+ languages, with coming-soon stubs) */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLangSettingsOpen(true)}
            className="h-10 w-10 rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground"
            aria-label={uiLang === 'ur' ? 'تمام زبانیں' : uiLang === 'roman' ? 'Tamam zubanein' : 'All languages'}
          >
            <Globe2 className="h-5 w-5" aria-hidden />
          </Button>
          <LanguageSettings open={langSettingsOpen} onOpenChange={setLangSettingsOpen} />

          {/* theme toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="h-10 w-10 rounded-xl hover:bg-accent"
            aria-label={t(uiLang, 'header.toggleTheme')}
          >
            <Sun className="hidden h-5 w-5 dark:block" aria-hidden />
            <Moon className="block h-5 w-5 dark:hidden" aria-hidden />
          </Button>

          {/* simulate offline toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              const next = !simulatedOffline;
              setSimulatedOffline(next);
              toast({
                description: t(
                  uiLang,
                  next ? 'toast.offlineOn' : 'toast.offlineOff',
                ),
              });
            }}
            className={cn(
              'h-10 w-10 rounded-xl',
              simulatedOffline
                ? 'bg-amber-500/15 text-amber-700 hover:bg-amber-500/25 dark:text-amber-400'
                : 'text-muted-foreground hover:bg-accent',
            )}
            aria-label={t(
              uiLang,
              simulatedOffline ? 'header.offlineOn' : 'header.simulateOffline',
            )}
            aria-pressed={simulatedOffline}
          >
            {simulatedOffline ? (
              <WifiOff className="h-5 w-5" aria-hidden />
            ) : (
              <Wifi className="h-5 w-5" aria-hidden />
            )}
          </Button>
        </div>
      </div>
    </header>
  );
}
