import Link from 'next/link';
import { TriangleAlert } from 'lucide-react';
import { AuthBrandHeading, AuthShell } from '@/components/auth/auth-shell';
import { TriStack } from '@/components/auth/trilingual';

const T = {
  title: {
    en: 'Something went wrong with sign-in',
    ur: 'سائن ان میں مسئلہ پیش آیا',
    roman: 'Sign in mein masla pesh aaya',
  },
  desc: {
    en: 'Please try again.',
    ur: 'براہ کرم دوبارہ کوشش کریں۔',
    roman: 'Barah-e-karam dobara koshish karein.',
  },
  back: {
    en: 'Back to sign-in',
    ur: 'واپس سائن ان پر',
    roman: 'Wapas sign in par',
  },
};

export default function AuthErrorPage() {
  return (
    <AuthShell>
      <AuthBrandHeading />
      <div className="rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
        <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/12 ring-1 ring-amber-500/25">
          <TriangleAlert className="h-7 w-7 text-amber-600 dark:text-amber-400" aria-hidden />
        </span>
        <h1 className="mx-auto max-w-sm text-lg font-extrabold tracking-tight text-foreground">
          <TriStack strings={T.title} size="sm" />
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          {T.desc.en}
          <span dir="rtl" className="mt-1 block font-urdu">
            {T.desc.ur}
          </span>
          <span className="mt-1 block italic">{T.desc.roman}</span>
        </p>
        <Link
          href="/auth/signin"
          className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
        >
          {T.back.en} · <span dir="rtl" className="font-urdu">{T.back.ur}</span> · {T.back.roman}
        </Link>
      </div>
    </AuthShell>
  );
}
