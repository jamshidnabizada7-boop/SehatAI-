'use client';

import { useState, useSyncExternalStore } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
  LogIn,
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
import { SosButton } from '@/components/chat/sos-button';

/** Role badge — quiet pill showing the user's role + verification state. */
function RoleBadge() {
  const { data: session, status } = useSession();
  if (status !== 'authenticated' || !session?.user) return null;
  const role = (session.user as { role?: string }).role ?? 'user';
  const accountStatus = (session.user as { accountStatus?: string }).accountStatus ?? 'active';

  const base = 'hidden items-center gap-1 rounded-full px-2 py-0.5 text-2xs font-semibold lg:inline-flex';

  if (role === 'doctor') {
    if (accountStatus === 'pending_verification') {
      return (
        <span className={cn(base, 'bg-warning-soft text-warning')}>
          <Clock className="h-3 w-3" aria-hidden /> Doctor · pending
        </span>
      );
    }
    if (accountStatus === 'suspended' || accountStatus === 'deleted') {
      return (
        <span className={cn(base, 'bg-danger-soft text-danger')}>
          <ShieldAlert className="h-3 w-3" aria-hidden /> Doctor · suspended
        </span>
      );
    }
    return (
      <span className={cn(base, 'bg-success-soft text-success')}>
        <ShieldCheck className="h-3 w-3" aria-hidden /> Doctor
      </span>
    );
  }
  if (role === 'admin') {
    return (
      <span className={cn(base, 'bg-muted text-muted-foreground')}>
        <ShieldCheck className="h-3 w-3" aria-hidden /> Admin
      </span>
    );
  }
  return null;
}

/** ⌘K on Apple devices, Ctrl K elsewhere (the handler accepts both). */
const noopSubscribe = () => () => {};
function useShortcutLabel() {
  return useSyncExternalStore(
    noopSubscribe,
    () => (/Mac|iPhone|iPad/i.test(navigator.platform || navigator.userAgent) ? '⌘K' : 'Ctrl K'),
    () => 'Ctrl K',
  );
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
  const shortcut = useShortcutLabel();
  // On /auth/* the page itself is the sign-in form; a second button is noise.
  const onAuthPage = (usePathname() ?? '').startsWith('/auth');

  const { theme, setTheme, resolvedTheme } = useTheme();

  const toggleTheme = () => {
    const isDarkNow =
      document.documentElement.classList.contains('dark') ||
      (resolvedTheme ?? theme) === 'dark';
    setTheme(isDarkNow ? 'light' : 'dark');
  };

  const langLabels: Record<LangPref, string> = {
    auto: t(uiLang, 'header.languageAuto'),
    en: 'EN',
    ur: 'اردو',
    roman: 'Roman',
  };

  const userName = (session?.user as { name?: string | null })?.name ?? null;
  const userEmail = (session?.user as { email?: string | null })?.email ?? null;

  const langOptions: { value: LangPref; label: string; urdu?: boolean }[] = [
    { value: 'auto', label: t(uiLang, 'header.languageAuto') },
    { value: 'en', label: 'English' },
    { value: 'ur', label: 'اردو', urdu: true },
    { value: 'roman', label: 'Roman Urdu' },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85">
      <div className="flex h-14 items-center gap-2 px-2 sm:gap-3 sm:px-4">
        {/* Start cluster: mobile drawer trigger + logo */}
        <div className="flex min-w-0 items-center gap-1.5 sm:gap-2.5">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setNavOpen(true)}
            className="h-10 w-10 shrink-0 rounded-xl text-muted-foreground hover:text-foreground md:hidden"
            aria-label={t(uiLang, 'ui.openMenu')}
          >
            <Menu className="h-5 w-5" aria-hidden />
          </Button>

          <Link
            href="/"
            className="flex min-w-0 items-center gap-2 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <HeartPulse className="h-4.5 w-4.5" aria-hidden />
            </span>
            <span className="flex min-w-0 flex-col leading-none">
              <span className="text-[15px] font-bold tracking-tight text-foreground">
                Sehat<span className="text-primary">AI</span>
              </span>
              <span className="mt-0.5 hidden truncate text-2xs text-muted-foreground xl:block">
                {t(uiLang, 'app.tagline')}
              </span>
            </span>
          </Link>

          <RoleBadge />
        </div>

        {/* Centre: search (desktop) */}
        <div className="mx-auto hidden max-w-md flex-1 md:flex">
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="flex h-9 w-full items-center gap-2.5 rounded-xl border border-border bg-card px-3 text-start text-xs text-muted-foreground transition-colors hover:border-input hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <Search className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <span className="truncate">{t(uiLang, 'search.placeholder')}</span>
            <kbd className="ms-auto rounded-md border border-border bg-muted px-1.5 py-0.5 font-sans text-2xs text-muted-foreground" dir="ltr">
              {shortcut}
            </kbd>
          </button>
        </div>

        {/* End cluster */}
        <div className="ms-auto flex shrink-0 items-center gap-1 sm:gap-1.5 md:ms-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSearchOpen(true)}
            className="h-10 w-10 rounded-xl text-muted-foreground hover:text-foreground md:hidden"
            aria-label={t(uiLang, 'header.search')}
          >
            <Search className="h-4.5 w-4.5" aria-hidden />
          </Button>

          {/* Language */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 gap-1 rounded-xl px-2 text-xs font-semibold text-muted-foreground hover:text-foreground sm:px-2.5"
                aria-label={`${t(uiLang, 'header.language')}: ${langLabels[langPref] ?? ''}`}
              >
                <Globe2 className="h-4 w-4 shrink-0" aria-hidden />
                <span className={cn('hidden sm:inline', uiLang === 'ur' && 'font-urdu')}>
                  {langLabels[langPref] ?? langLabels.auto}
                </span>
                <ChevronDown className="hidden h-3 w-3 sm:block" aria-hidden />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 rounded-xl">
              <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
                {t(uiLang, 'header.language')}
              </DropdownMenuLabel>
              {langOptions.map((o) => (
                <DropdownMenuItem
                  key={o.value}
                  onClick={() => setLangPref(o.value)}
                  className={cn('flex cursor-pointer items-center justify-between text-sm', o.urdu && 'font-urdu')}
                >
                  <span>{o.label}</span>
                  {langPref === o.value ? <Check className="h-4 w-4 text-primary" aria-hidden /> : null}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setLangSettingsOpen(true)}
                className="flex cursor-pointer items-center gap-2 text-sm"
              >
                <Globe2 className="h-4 w-4" aria-hidden />
                <span>{uiLang === 'ur' ? 'تمام پاکستانی زبانیں…' : uiLang === 'roman' ? 'Tamam Pakistani zubanein…' : 'All regional languages…'}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <LanguageSettings open={langSettingsOpen} onOpenChange={setLangSettingsOpen} />

          {/* Theme (desktop; mobile has it in the drawer) */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="hidden h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground md:inline-flex"
            aria-label={t(uiLang, 'header.toggleTheme')}
          >
            <Sun className="hidden h-4 w-4 dark:block" aria-hidden />
            <Moon className="block h-4 w-4 dark:hidden" aria-hidden />
          </Button>

          {/* Emergency SOS — same place on every screen */}
          <SosButton />

          {/* Account */}
          {status === 'authenticated' && session?.user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-10 gap-2 rounded-xl px-1.5 sm:h-9"
                  aria-label={t(uiLang, 'ui.account')}
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground">
                    {(userName ?? userEmail ?? 'U').slice(0, 1).toUpperCase()}
                  </span>
                  <span className="hidden max-w-[110px] truncate text-start text-xs font-semibold text-foreground xl:block">
                    {userName ?? 'User'}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60 rounded-xl">
                <div className="px-2 py-1.5">
                  <p className="truncate text-sm font-semibold text-foreground">{userName ?? 'User'}</p>
                  {userEmail ? (
                    <p className="truncate text-xs text-muted-foreground">{userEmail}</p>
                  ) : null}
                </div>
                <DropdownMenuSeparator />
                {/* Offline simulation (demo tool) */}
                <DropdownMenuItem
                  onClick={() => {
                    const next = !simulatedOffline;
                    setSimulatedOffline(next);
                    toast({
                      description: t(uiLang, next ? 'toast.offlineOn' : 'toast.offlineOff'),
                    });
                  }}
                  className="flex cursor-pointer items-center justify-between text-sm"
                >
                  <span className="flex items-center gap-2">
                    {simulatedOffline ? (
                      <WifiOff className="h-4 w-4 text-warning" aria-hidden />
                    ) : (
                      <Wifi className="h-4 w-4" aria-hidden />
                    )}
                    <span>{t(uiLang, 'header.simulateOffline')}</span>
                  </span>
                  {simulatedOffline ? <Check className="h-4 w-4 text-warning" aria-hidden /> : null}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => void signOut({ callbackUrl: '/' })}
                  className="flex cursor-pointer items-center gap-2 text-sm text-danger focus:text-danger"
                >
                  <LogOut className="h-4 w-4" aria-hidden />
                  <span>{t(uiLang, 'settings.signOutLabel')}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : status === 'unauthenticated' && !onAuthPage ? (
            <Link
              href="/auth/signin"
              aria-label={t(uiLang, 'auth.bannerCta')}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-xs font-semibold text-foreground transition-colors hover:border-input sm:h-9 sm:w-auto sm:gap-1.5 sm:px-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <LogIn className="h-4 w-4" aria-hidden />
              <span className="hidden sm:inline">{t(uiLang, 'auth.bannerCta')}</span>
            </Link>
          ) : null}
        </div>
      </div>
    </header>
  );
}
