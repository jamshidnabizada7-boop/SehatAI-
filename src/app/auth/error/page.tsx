import Link from 'next/link';
import { TriangleAlert } from 'lucide-react';
import { AuthBrandHeading, AuthShell } from '@/components/auth/auth-shell';
import { Tri, TriStack } from '@/components/auth/trilingual';

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
        <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-warning-soft">
          <TriangleAlert className="h-6 w-6 text-warning" aria-hidden />
        </span>
        <h1 className="mx-auto max-w-sm text-lg font-semibold tracking-tight text-foreground">
          <TriStack strings={T.title} size="sm" />
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          <Tri strings={T.desc} />
        </p>
        <Link
          href="/auth/signin"
          className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
        >
          <Tri strings={T.back} />
        </Link>
      </div>
    </AuthShell>
  );
}
