'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { HeartPulse, Stethoscope, ArrowRight, ShieldCheck } from 'lucide-react';

/**
 * Landing chooser — shown when the user is unauthenticated and lands on `/`.
 * Two large cards: "I am a patient" and "I am a doctor".
 *
 * When the user IS authenticated, this returns null and the main app renders.
 */
export function LandingChooser() {
  const { status } = useSession();

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
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
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
          className="group relative flex flex-col gap-3 overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-b from-primary/8 to-background p-6 transition-all hover:border-primary/60 hover:shadow-lg focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-sm">
            <HeartPulse className="h-7 w-7 text-primary-foreground" aria-hidden />
          </span>
          <div>
            <h2 className="text-lg font-bold text-foreground">I am a patient</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              میں مریض ہوں · Main mareez hoon
            </p>
          </div>
          <p className="text-sm leading-relaxed text-foreground/85">
            Chat with SehatAI for trilingual health guidance, track your medications, set reminders, and find nearby facilities.
          </p>
          <span className="mt-2 inline-flex items-center gap-1 text-sm font-bold text-primary">
            Continue as patient
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </span>
        </Link>

        {/* Doctor card */}
        <Link
          href="/auth/doctor/signin"
          className="group relative flex flex-col gap-3 overflow-hidden rounded-2xl border border-emerald-500/40 bg-gradient-to-b from-emerald-50/60 to-background p-6 transition-all hover:border-emerald-500 hover:shadow-lg focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring dark:from-emerald-950/20"
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 shadow-sm">
            <Stethoscope className="h-7 w-7 text-white" aria-hidden />
          </span>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-foreground">I am a doctor</h2>
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-400">
              <ShieldCheck className="h-3 w-3" /> PMDC verified
            </span>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">میں ڈاکٹر ہوں · Main doctor hoon</p>
          <p className="text-sm leading-relaxed text-foreground/85">
            Access the Doctor Portal: patient intake summaries, AI-drafted SOAP notes, drug-interaction alerts, and follow-up tracking.
          </p>
          <span className="mt-2 inline-flex items-center gap-1 text-sm font-bold text-emerald-700 dark:text-emerald-400">
            Continue as doctor
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </span>
        </Link>
      </div>

      <div className="mt-6 flex items-center justify-center gap-4 text-xs text-muted-foreground">
        <Link href="/" className="font-semibold text-primary hover:underline">
          Continue as guest
        </Link>
        <span aria-hidden>·</span>
        <Link href="/about" className="font-semibold text-muted-foreground hover:underline">
          Learn more
        </Link>
      </div>
    </motion.section>
  );
}
