'use client';

import { useMemo } from 'react';
import { useSession } from 'next-auth/react';
import {
  Activity,
  BarChart3,
  Bell,
  Info,
  MapPin,
  MessageCircle,
  ClipboardList,
  Stethoscope,
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

/** Bottom tab navigation (mobile). 44px+ touch targets. */
export function BottomNav() {
  const view = useAppStore((s) => s.view);
  const setView = useAppStore((s) => s.setView);
  const langPref = useAppStore((s) => s.langPref);
  const uiLang = resolveUiLang(langPref);
  const items = useVisibleNavItems();

  return (
    <nav
      aria-label={t(uiLang, 'app.name')}
      className="border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <ul
        className="grid"
        style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
      >
        {items.map((item) => {
          const active = view === item.view;
          return (
            <li key={item.view}>
              <button
                type="button"
                onClick={() => setView(item.view)}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex min-h-[60px] w-full flex-col items-center justify-center gap-0.5 px-0.5 py-2 transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring',
                  active ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <span
                  className={cn(
                    'flex h-7 w-11 items-center justify-center rounded-full transition-colors',
                    active && 'bg-primary/12',
                  )}
                >
                  <item.icon className="h-5 w-5" aria-hidden />
                </span>
                <span className="text-[10px] font-semibold leading-none">
                  {t(uiLang, item.labelKey)}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Left sidebar rail (desktop). */
export function SidebarNav() {
  const view = useAppStore((s) => s.view);
  const setView = useAppStore((s) => s.setView);
  const langPref = useAppStore((s) => s.langPref);
  const uiLang = resolveUiLang(langPref);
  const items = useVisibleNavItems();

  return (
    <nav
      aria-label={t(uiLang, 'app.name')}
      className="hidden w-52 shrink-0 border-e border-border bg-card/50 md:block"
    >
      <ul className="flex flex-col gap-1 p-3">
        {items.map((item) => {
          const active = view === item.view;
          return (
            <li key={item.view}>
              <button
                type="button"
                onClick={() => setView(item.view)}
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
    </nav>
  );
}
