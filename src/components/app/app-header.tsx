'use client';

import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import {
  Globe2,
  HeartPulse,
  Menu,
  Moon,
  Search,
  Sun,
  Wifi,
  WifiOff,
  ShieldCheck,
  Clock,
  ShieldAlert,
  ChevronDown,
  LogOut,
  User,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAppStore } from '@/lib/store/app-store';
import { resolveUiLang, t } from '@/lib/i18n';
import type { LangPref } from '@/lib/i18n';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { LanguageSettings } from '@/components/settings/language-settings';
import { Badge } from '@/components/ui/badge';

/** Role badge — clean pill showing the user's role + verification state. */
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
  const setLangPref = useAppStore((s) => s.setLangPref);
  const [langSettingsOpen, setLangSettingsOpen] = useState(false);
  const simulatedOffline = useAppStore((s) => s.simulatedOffline);
  const setSimulatedOffline = useAppStore((s) => s.setSimulatedOffline);
  const setSearchOpen = useAppStore((s) => s.setSearchOpen);
  const setNavOpen = useAppStore((s) => s.setNavOpen);
  const uiLang = resolveUiLang(langPref);
  const { toast } = useToast();
  const { data: session, status } = useSession();

  const { theme, setTheme, resolvedTheme } = useTheme();

  const toggleTheme = () => {
    const isDarkNow =
      document.documentElement.classList.contains('dark') ||
      (resolvedTheme ?? theme) === 'dark';
    setTheme(isDarkNow ? 'light' : 'dark');
  };

  const langLabels: Record<LangPref, { short: string; full: string }> = {
    auto: { short: 'Auto', full: t(uiLang, 'header.languageAuto') },
    en: { short: 'EN', full: t(uiLang, 'header.english') },
    ur: { short: 'اردو', full: t(uiLang, 'header.urdu') },
    roman: { short: 'Roman', full: t(uiLang, 'header.romanUrdu') },
  };

  const userName = (session?.user as { name?: string | null })?.name ?? null;
  const userEmail = (session?.user as { email?: string | null })?.email ?? null;

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="flex h-14 items-center justify-between gap-3 px-3 sm:px-5">
        {/* Left cluster: Mobile drawer trigger + Logo */}
        <div className="flex items-center gap-2.5">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setNavOpen(true)}
            className="h-9 w-9 shrink-0 rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground md:hidden"
            aria-label={uiLang === 'ur' ? 'مینو کھولیں' : uiLang === 'roman' ? 'Menu kholein' : 'Open menu'}
          >
            <Menu className="h-5 w-5" aria-hidden />
          </Button>

          <Link href="/" className="flex items-center gap-2 group">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-2xs transition-transform group-hover:scale-105">
              <HeartPulse className="h-4.5 w-4.5" aria-hidden />
            </span>
            <span className="flex flex-col leading-none">
              <span className="flex items-center gap-1 text-base font-extrabold tracking-tight text-foreground">
                Sehat<span className="text-primary">AI</span>
              </span>
              <span className="hidden text-[10px] font-medium text-muted-foreground sm:block">
                {t(uiLang, 'app.tagline')}
              </span>
            </span>
          </Link>

          <RoleBadge />
        </div>

        {/* Center: Global Quick Search Pill (Desktop) */}
        <div className="hidden md:flex flex-1 justify-center max-w-md mx-2">
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="flex w-full items-center gap-2.5 rounded-xl border border-border/80 bg-muted/40 px-3.5 py-1.5 text-xs text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-all focus-visible:outline-2 focus-visible:outline-ring"
            aria-label={t(uiLang, 'header.search')}
          >
            <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />
            <span className="truncate">{t(uiLang, 'header.search')} topics, first aid, medicines...</span>
            <kbd className="ms-auto rounded bg-background px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground/80 shadow-2xs border border-border">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right cluster: Mobile search icon + Unified Language Dropdown + Theme + User Menu */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Mobile search trigger */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSearchOpen(true)}
            className="h-9 w-9 rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground md:hidden"
            aria-label={t(uiLang, 'header.search')}
          >
            <Search className="h-4.5 w-4.5" aria-hidden />
          </Button>

          {/* Unified Language Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 gap-1.5 rounded-xl border border-border/70 px-2.5 text-xs font-semibold hover:bg-accent"
                aria-label={t(uiLang, 'header.language')}
              >
                <Globe2 className="h-3.5 w-3.5 text-primary shrink-0" />
                <span className={cn(uiLang === 'ur' && 'font-urdu font-bold')}>
                  {langLabels[langPref]?.short ?? 'Auto'}
                </span>
                <ChevronDown className="h-3 w-3 text-muted-foreground/70" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 rounded-xl">
              <DropdownMenuLabel className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                {t(uiLang, 'header.language')}
              </DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => setLangPref('auto')}
                className="flex items-center justify-between text-xs cursor-pointer"
              >
                <span>{t(uiLang, 'header.languageAuto')}</span>
                {langPref === 'auto' ? <Check className="h-3.5 w-3.5 text-primary" /> : null}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setLangPref('en')}
                className="flex items-center justify-between text-xs cursor-pointer"
              >
                <span>English</span>
                {langPref === 'en' ? <Check className="h-3.5 w-3.5 text-primary" /> : null}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setLangPref('ur')}
                className="flex items-center justify-between text-xs cursor-pointer font-urdu"
              >
                <span>اردو (Urdu)</span>
                {langPref === 'ur' ? <Check className="h-3.5 w-3.5 text-primary" /> : null}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setLangPref('roman')}
                className="flex items-center justify-between text-xs cursor-pointer"
              >
                <span>Roman Urdu</span>
                {langPref === 'roman' ? <Check className="h-3.5 w-3.5 text-primary" /> : null}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setLangSettingsOpen(true)}
                className="flex items-center gap-2 text-xs font-medium text-primary cursor-pointer"
              >
                <Globe2 className="h-3.5 w-3.5" />
                <span>{uiLang === 'ur' ? 'تمام پاکستانی زبانیں...' : 'All regional languages...'}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <LanguageSettings open={langSettingsOpen} onOpenChange={setLangSettingsOpen} />

          {/* Theme Toggle Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="h-9 w-9 rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground"
            aria-label={t(uiLang, 'header.toggleTheme')}
          >
            <Sun className="hidden h-4 w-4 dark:block" aria-hidden />
            <Moon className="block h-4 w-4 dark:hidden" aria-hidden />
          </Button>

          {/* User Account Avatar / Menu */}
          {status === 'authenticated' && session?.user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-9 gap-2 rounded-xl px-1.5 hover:bg-accent"
                  aria-label="User account menu"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary ring-1 ring-primary/25">
                    {(userName ?? userEmail ?? 'U').slice(0, 1).toUpperCase()}
                  </span>
                  <span className="hidden lg:block text-xs font-semibold text-foreground max-w-[90px] truncate text-start">
                    {userName ?? 'User'}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-xl">
                <div className="p-2">
                  <p className="text-xs font-bold text-foreground truncate">{userName ?? 'User'}</p>
                  {userEmail ? (
                    <p className="text-[11px] text-muted-foreground truncate">{userEmail}</p>
                  ) : null}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => void signOut({ callbackUrl: '/' })}
                  className="flex items-center gap-2 text-xs font-semibold text-red-600 dark:text-red-400 cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>{t(uiLang, 'settings.signOutLabel')}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link
              href="/auth/signin"
              className="inline-flex h-9 items-center justify-center rounded-xl bg-primary px-3 text-xs font-bold text-primary-foreground shadow-2xs hover:bg-primary/90 transition-colors"
            >
              <User className="h-3.5 w-3.5 me-1.5" />
              <span>{t(uiLang, 'auth.bannerCta')}</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
