'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { ShieldCheck, Loader2, Clock, FileText, LogOut, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AuthShell, AuthBrandHeading } from '@/components/auth/auth-shell';
import { Badge } from '@/components/ui/badge';

interface DoctorInfo {
  name?: string | null;
  email?: string | null;
  doctorProfile?: { pmdcNumber: string; specialty: string; pmdcVerifiedAt: string | null } | null;
  accountStatus?: string;
}

export default function DoctorPendingPage() {
  const router = useRouter();
  const [info, setInfo] = useState<DoctorInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/user/me', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) setInfo(data.user ?? null);
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const checkAgain = () => {
    // Force a reload of the session
    router.refresh();
    window.location.reload();
  };

  return (
    <AuthShell variant="doctor">
      <AuthBrandHeading variant="doctor" />

      <Card className="border-amber-500/40 bg-card/70 shadow-sm">
        <CardContent className="flex flex-col items-center gap-4 px-5 py-8 text-center sm:px-6">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/15">
            <Clock className="h-8 w-8 text-amber-600 dark:text-amber-400" />
          </span>

          <div>
            <h1 className="text-xl font-extrabold text-foreground">
              {loading ? 'Checking your account…' : `Thank you, Dr. ${info?.name ?? 'Doctor'}.`}
            </h1>
            {loading ? (
              <Loader2 className="mx-auto mt-2 h-4 w-4 animate-spin text-muted-foreground" />
            ) : (
              <p className="mt-1 text-sm text-muted-foreground">
                We&apos;re verifying your PMDC registration. This typically takes <span className="font-bold text-foreground">24–48 hours</span>.
              </p>
            )}
          </div>

          {info?.doctorProfile ? (
            <div className="w-full rounded-xl border border-border bg-background p-4 text-left">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-muted-foreground">PMDC #</p>
                  <p className="font-bold text-foreground">{info.doctorProfile.pmdcNumber}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Specialty</p>
                  <p className="font-bold text-foreground">{info.doctorProfile.specialty}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground">Status</p>
                  <Badge className="mt-0.5 bg-amber-500/15 text-[10px] font-bold text-amber-700 dark:text-amber-400">
                    {info.accountStatus === 'pending_verification' ? 'PENDING VERIFICATION' : (info.accountStatus ?? 'PENDING').toUpperCase()}
                  </Badge>
                </div>
              </div>
            </div>
          ) : null}

          <div className="flex w-full flex-col gap-2 rounded-xl border border-primary/20 bg-primary/5 p-3 text-left">
            <div className="flex items-start gap-2">
              <FileText className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <p className="text-xs leading-relaxed text-foreground/85">
                <span className="font-bold">While you wait:</span> You can upload additional verification documents (CNIC, medical degree) to speed up the review.
              </p>
            </div>
          </div>

          <div className="flex w-full flex-col gap-2 sm:flex-row">
            <Button onClick={checkAgain} variant="outline" className="min-h-11 flex-1 gap-1.5 rounded-xl">
              <RefreshCw className="h-4 w-4" /> Check again
            </Button>
            <Button
              onClick={() => signOut({ callbackUrl: '/' })}
              variant="ghost"
              className="min-h-11 flex-1 gap-1.5 rounded-xl"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </Button>
          </div>

          <p className="text-[11px] text-muted-foreground">
            Questions? Contact <span className="font-semibold text-foreground">support@sehatai.pk</span> with your PMDC number.
          </p>
        </CardContent>
      </Card>
    </AuthShell>
  );
}
