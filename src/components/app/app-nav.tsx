'use client';

import { useMemo } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import {
  Activity,
  BarChart3,
  Bell,
  HeartPulse,
  Info,
  LogIn,
  LogOut,
  MapPin,
  MessageCircle,
  ClipboardList,
  Moon,
  Stethoscope,
  Sun,
  PhoneCall,
  BriefcaseMedical,
} from 'lucide-react';
import { Sheet, SheetContent, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { useAppStore, type View } from '@/lib/store/app-store';
import { resolveUiLang, t } from '@/lib/i18n';
import { cn } from '@/lib/utils';

type LabelKey =
  | 'nav.chat'
  | 'nav.reminders'
  | 'nav.facilities'
  | 'nav.dashboard'
  | 'nav.about'
  | 'nav.myHealth'
  | 'nav.observability'
  | 'nav.doctorCopilot'
  | 'nav.careConnect';

interface NavItem {
  view: View;
  icon: React.ComponentType<{ className?: string }>;
  labelKey: LabelKey;
  /** when true the item is only rendered for admin sessions */
  adminOnly?: boolean;
  /** when true the item is only rendered for doctor+ sessions */
  doctorOnly?: boolean;
  /** when true the item is hidden for doctor sessions */
  patientOnly?: boolean;
  /** when true, requires role=doctor AND accountStatus=active (PMDC verified) */
  requireActiveDoctor?: boolean;
}

// Care Connect and Doctor Copilot used the same stethoscope icon; Copilot
// now has its own so the two can be told apart at a glance.
const NAV_ITEMS: NavItem[] = [
  { view: 'chat', icon: MessageCircle, labelKey: 'nav.chat' },
  { view: 'care', icon: Stethoscope, labelKey: 'nav.careConnect' },
  { view: 'my-health', icon: ClipboardList, labelKey: 'nav.myHealth', patientOnly: true },
  { view: 'facilities', icon: MapPin, labelKey: 'nav.facilities' },
  { view: 'reminders', icon: Bell, labelKey: 'nav.reminders', patientOnly: true },
  { view: 'doctor-copilot', icon: BriefcaseMedical, labelKey: 'nav.doctorCopilot', doctorOnly: true, requireActiveDoctor: true },
  { view: 'dashboard', icon: BarChart3, labelKey: 'nav.dashboard', adminOnly: true },
  { view: 'observability', icon: Activity, labelKey: 'nav.observability', adminOnly: true },
  { view: 'about', icon: Info, labelKey: 'nav.about' },
];

/** Compute the visible nav items for a given session. */
function useVisibleNavItems() {
  const { data: session, status } = useSession();
  return useMemo(() => {
    const role = status === 'authenticated' ? ((session?.user as { role?: string } | undefined)?.role ?? 'guest') : 'guest';
    const accountStatus = status === 'authenticated' ? ((session?.user as { accountStatus?: string } | undefined)?.accountStatus ?? 'active') : 'active';
    const isDoctorActive = role === 'doctor' && accountStatus === 'active';
    const isAdmin = role === 'admin';
    return NAV_ITEMS.filter((it) => {
      // admin sees everything (preview)
      if (it.adminOnly) return isAdmin;
      if (it.doctorOnly) return isDoctorActive || isAdmin;
      if (it.patientOnly) return role === 'user' || role === 'guest' || !role;
      return true;
    });
  }, [session, status]);
}

interface NavListProps {
  onNavigate?: () => void;
}

/** Shared nav item list (used by the desktop rail and the mobile drawer). */
function NavList({ onNavigate, items }: NavListProps & { items: NavItem[] }) {
  const view = useAppStore((s) => s.view);
  const setView = useAppStore((s) => s.setView);
  const langPref = useAppStore((s) => s.langPref);
  const uiLang = resolveUiLang(langPref);

  return (
    <ul className="flex flex-col gap-0.5 p-3">
      {items.map((item) => {
        const active = view === item.view;
        return (
          <li key={item.view}>
            <button
              type="button"
              onClick={() => {
                setView(item.view);
                onNavigate?.();
              }}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring md:min-h-10',
                active
                  ? 'bg-accent font-semibold text-accent-foreground'
                  : 'font-medium text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <item.icon className={cn('h-4 w-4 shrink-0', active ? 'text-primary' : 'text-muted-foreground')} aria-hidden />
              <span className="truncate">{t(uiLang, item.labelKey)}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/** Left sidebar rail (desktop). Emergency access lives in the header SOS. */
export function SidebarNav() {
  const langPref = useAppStore((s) => s.langPref);
  const uiLang = resolveUiLang(langPref);
  const items = useVisibleNavItems();

  return (
    <nav
      aria-label={t(uiLang, 'app.name')}
      className="hidden w-56 shrink-0 flex-col border-e border-border bg-sidebar md:flex"
    >
      <div className="min-h-0 flex-1 overflow-y-auto custom-scrollbar">
        <NavList items={items} />
      </div>
      <a
        href="tel:1122"
        className="m-3 flex items-center gap-2.5 rounded-xl border border-danger/20 bg-danger-soft px-3 py-2.5 text-start transition-colors hover:border-danger/40 focus-visible:outline-2 focus-visible:outline-danger"
      >
        <PhoneCall className="h-4 w-4 shrink-0 text-danger" aria-hidden />
        <span className="min-w-0">
          <span className="block text-xs font-bold text-danger">{t(uiLang, 'ui.callRescue')}</span>
          <span className="block text-2xs text-muted-foreground">{t(uiLang, 'ui.emergencyHint')}</span>
        </span>
      </a>
    </nav>
  );
}

/**
 * Mobile navigation drawer. Built on the Sheet primitive so it gets a focus
 * trap, Escape-to-close, scroll lock and focus return for free. Opens from
 * the reading start edge (left in LTR, right in Urdu).
 */
export function MobileNavDrawer() {
  const navOpen = useAppStore((s) => s.navOpen);
  const setNavOpen = useAppStore((s) => s.setNavOpen);
  const langPref = useAppStore((s) => s.langPref);
  const uiLang = resolveUiLang(langPref);
  const items = useVisibleNavItems();
  const { data: session, status } = useSession();
  const { resolvedTheme, setTheme } = useTheme();
  const isRtl = uiLang === 'ur';
  const isDark = resolvedTheme === 'dark';

  const userName = (session?.user as { name?: string | null } | undefined)?.name ?? null;
  const userEmail = (session?.user as { email?: string | null } | undefined)?.email ?? null;

  return (
    <Sheet open={navOpen} onOpenChange={setNavOpen}>
      <SheetContent
        side={isRtl ? 'right' : 'left'}
        closeLabel={t(uiLang, 'ui.close')}
        className={cn('w-[19rem] max-w-[85vw] gap-0 p-0 md:hidden', isRtl && 'font-urdu')}
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        <div className="flex h-14 items-center gap-2 border-b border-border px-4">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <HeartPulse className="h-4.5 w-4.5" aria-hidden />
          </span>
          <SheetTitle className="text-[15px] font-bold tracking-tight">
            Sehat<span className="text-primary">AI</span>
          </SheetTitle>
          <SheetDescription className="sr-only">{t(uiLang, 'app.tagline')}</SheetDescription>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto custom-scrollbar">
          <NavList items={items} onNavigate={() => setNavOpen(false)} />
        </div>

        <div className="space-y-2 border-t border-border p-3">
          <a
            href="tel:1122"
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-red-700 px-3 text-sm font-bold text-white transition-colors hover:bg-red-800"
          >
            <PhoneCall className="h-4 w-4" aria-hidden />
            {t(uiLang, 'ui.callRescue')}
          </a>

          <button
            type="button"
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            {isDark ? <Sun className="h-4 w-4" aria-hidden /> : <Moon className="h-4 w-4" aria-hidden />}
            {t(uiLang, 'ui.theme')}: {isDark ? t(uiLang, 'ui.darkMode') : t(uiLang, 'ui.lightMode')}
          </button>

          {status === 'authenticated' ? (
            <>
              <div className="flex min-w-0 items-center gap-2.5 rounded-xl bg-muted/60 px-3 py-2">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground">
                  {(userName ?? userEmail ?? 'U').slice(0, 1).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-foreground">{userName ?? 'User'}</span>
                  {userEmail ? (
                    <span className="block truncate text-xs text-muted-foreground">{userEmail}</span>
                  ) : null}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setNavOpen(false);
                  void signOut({ callbackUrl: '/' });
                }}
                className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-medium text-danger transition-colors hover:bg-danger-soft"
              >
                <LogOut className="h-4 w-4 shrink-0" aria-hidden />
                {t(uiLang, 'settings.signOutLabel')}
              </button>
            </>
          ) : (
            <Link
              href="/auth/signin"
              onClick={() => setNavOpen(false)}
              className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <LogIn className="h-4 w-4 shrink-0" aria-hidden />
              {t(uiLang, 'auth.bannerCta')}
            </Link>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
