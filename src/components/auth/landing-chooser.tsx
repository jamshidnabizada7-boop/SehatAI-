'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { HeartPulse, Stethoscope, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAppStore } from '@/lib/store/app-store';

/**
 * Landing chooser — shown when the user is unauthenticated and lands on `/`.
 * Two large cards: "I am a patient" and "I am a doctor".
 *
 * When the user IS authenticated (or chose guest mode), this returns null
 * and the main app renders.
 */
export function LandingChooser() {
  const { status } = useSession();
  const setGuestMode = useAppStore((s) => s.setGuestMode);
  const setView = useAppStore((s) => s.setView);

  if (status !== 'unauthenticated') return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-12"
      aria-label="Choose your account type"
    >
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Welcome to Sehat<span className="text-primary">AI</span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Trilingual health guidance for Pakistan. Are you a patient or a doctor?
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Patient card */}
        <Link
          href="/auth/signin"
          className="group relative flex flex-col gap-3 overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-[var(--soft-shadow)] transition-[border-color,box-shadow] hover:border-primary/50 hover:shadow-[var(--raised-shadow)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent">
              <HeartPulse className="h-5 w-5 text-primary" aria-hidden />
            </span>
            <h2 className="text-lg font-semibold text-foreground">I am a patient</h2>
          </div>
          <div>
            <p className="mt-0.5 text-sm text-muted-foreground">
              <span dir="rtl" lang="ur" className="font-urdu">میں مریض ہوں</span> · Main mareez hoon
            </p>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground [text-wrap:pretty]">
            Chat with SehatAI for trilingual health guidance, track your medications, set reminders, and find nearby facilities.
          </p>
          <span className="mt-auto inline-flex items-center gap-1 pt-2 text-sm font-semibold text-primary">
            Continue as patient
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 rtl:-scale-x-100" aria-hidden />
          </span>
        </Link>

        {/* Doctor card */}
        <Link
          href="/auth/doctor/signin"
          className="group relative flex flex-col gap-3 overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-[var(--soft-shadow)] transition-[border-color,box-shadow] hover:border-primary/50 hover:shadow-[var(--raised-shadow)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent">
              <Stethoscope className="h-5 w-5 text-primary" aria-hidden />
            </span>
            <h2 className="text-lg font-semibold text-foreground">I am a doctor</h2>
            <span className="chip">
              <ShieldCheck className="h-3 w-3" aria-hidden /> PMDC verification required
            </span>
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">
            <span dir="rtl" lang="ur" className="font-urdu">میں ڈاکٹر ہوں</span> · Main doctor hoon
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground [text-wrap:pretty]">
            Access the Doctor Portal: patient intake summaries, AI-drafted SOAP notes, drug-interaction alerts, and follow-up tracking.
          </p>
          <span className="mt-auto inline-flex items-center gap-1 pt-2 text-sm font-semibold text-primary">
            Continue as doctor
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 rtl:-scale-x-100" aria-hidden />
          </span>
        </Link>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-sm">
        <button
          type="button"
          onClick={() => setGuestMode(true)}
          className="inline-flex min-h-11 items-center rounded-xl border border-border bg-card px-4 font-semibold text-foreground transition-colors hover:border-input hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          Continue as guest
        </button>
        <button
          type="button"
          onClick={() => {
            setGuestMode(true);
            setView('about');
          }}
          className="inline-flex min-h-11 items-center rounded-xl px-4 font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          Learn more
        </button>
      </div>
    </motion.section>
  );
}
