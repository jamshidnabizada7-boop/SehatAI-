'use client';

import { useEffect, useMemo } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import {
  Activity,
  BarChart3,
  Bell,
  Info,
  LogIn,
  LogOut,
  MapPin,
  MessageCircle,
  ClipboardList,
  Stethoscope,
  X,
} from 'lucide-react';
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
  | 'nav.doctorCopilot';

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

const NAV_ITEMS: NavItem[] = [
  { view: 'chat', icon: MessageCircle, labelKey: 'nav.chat' },
  { view: 'reminders', icon: Bell, labelKey: 'nav.reminders', patientOnly: true },
  { view: 'facilities', icon: MapPin, labelKey: 'nav.facilities' },
  { view: 'my-health', icon: ClipboardList, labelKey: 'nav.myHealth', patientOnly: true },
  { view: 'doctor-copilot', icon: Stethoscope, labelKey: 'nav.doctorCopilot', doctorOnly: true, requireActiveDoctor: true },
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
    <ul className="flex flex-col gap-1 p-3">
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
                'flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring',
                active
                  ? 'bg-primary/12 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground',
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" aria-hidden />
              {t(uiLang, item.labelKey)}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/** Left sidebar rail (desktop). */
export function SidebarNav() {
  const langPref = useAppStore((s) => s.langPref);
  const uiLang = resolveUiLang(langPref);
  const items = useVisibleNavItems();

  return (
    <nav
      aria-label={t(uiLang, 'app.name')}
      className="hidden w-52 shrink-0 border-e border-border bg-card/50 md:block"
    >
      <NavList items={items} />
    </nav>
  );
}

/**
 * Mobile side navigation drawer (ChatGPT-style).
 * Slides in from the start edge over an overlay; holds the same nav items
 * as the desktop rail plus sign-in / sign-out at the bottom.
 */
export function MobileNavDrawer() {
  const navOpen = useAppStore((s) => s.navOpen);
  const setNavOpen = useAppStore((s) => s.setNavOpen);
  const langPref = useAppStore((s) => s.langPref);
  const uiLang = resolveUiLang(langPref);
  const items = useVisibleNavItems();
  const { data: session, status } = useSession();
  const isRtl = uiLang === 'ur';

  // close on Escape
  useEffect(() => {
    if (!navOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setNavOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [navOpen, setNavOpen]);

  // lock body scroll while open
  useEffect(() => {
    if (!navOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [navOpen]);

  if (!navOpen) return null;

  const userName = (session?.user as { name?: string | null } | undefined)?.name ?? null;
  const userEmail = (session?.user as { email?: string | null } | undefined)?.email ?? null;

  return (
    <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label={t(uiLang, 'app.name')}>
      {/* overlay */}
      <button
        type="button"
        aria-label={uiLang === 'ur' ? 'بند کریں' : uiLang === 'roman' ? 'Band karein' : 'Close menu'}
        onClick={() => setNavOpen(false)}
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
      />
      {/* panel */}
      <div
        className={cn(
          'absolute bottom-0 top-0 flex w-72 max-w-[82vw] flex-col border-e border-border bg-background shadow-xl',
          isRtl ? 'right-0' : 'left-0',
        )}
      >
        {/* panel header */}
        <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
          <span className="flex items-center gap-1.5 text-base font-extrabold tracking-tight text-foreground">
            Sehat<span className="text-primary">AI</span>
          </span>
          <button
            type="button"
            onClick={() => setNavOpen(false)}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground"
            aria-label={uiLang === 'ur' ? 'بند کریں' : uiLang === 'roman' ? 'Band karein' : 'Close menu'}
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        {/* nav items */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          <NavList items={items} onNavigate={() => setNavOpen(false)} />
        </div>

        {/* account footer — sign in / sign out */}
        <div className="border-t border-border p-3">
          {status === 'authenticated' ? (
            <div className="flex flex-col gap-2">
              <div className="flex min-w-0 items-center gap-2.5 rounded-xl bg-muted/40 px-3 py-2">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                  {(userName ?? userEmail ?? 'U').slice(0, 1).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold text-foreground">{userName ?? 'User'}</span>
                  {userEmail ? (
                    <span className="block truncate text-[11px] text-muted-foreground">{userEmail}</span>
                  ) : null}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setNavOpen(false);
                  void signOut({ callbackUrl: '/' });
                }}
                className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-500/10 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring dark:text-red-400"
              >
                <LogOut className="h-5 w-5 shrink-0" aria-hidden />
                {t(uiLang, 'settings.signOutLabel')}
              </button>
            </div>
          ) : (
            <Link
              href="/auth/signin"
              onClick={() => setNavOpen(false)}
              className="flex min-h-11 w-full items-center gap-3 rounded-xl bg-primary px-3 py-2.5 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
            >
              <LogIn className="h-5 w-5 shrink-0" aria-hidden />
              {t(uiLang, 'auth.bannerCta')}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
