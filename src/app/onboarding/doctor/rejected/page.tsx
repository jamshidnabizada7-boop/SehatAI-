'use client';

import { useEffect, useState } from 'react';
import { signOut } from 'next-auth/react';
import Link from 'next/link';
import { AlertCircle, LogOut, Upload, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AuthShell, AuthBrandHeading } from '@/components/auth/auth-shell';
import { Badge } from '@/components/ui/badge';

interface DoctorInfo {
  name?: string | null;
  doctorProfile?: { pmdcNumber: string; specialty: string } | null;
  accountStatus?: string;
}

export default function DoctorRejectedPage() {
  const [info, setInfo] = useState<DoctorInfo | null>(null);

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
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <AuthShell variant="doctor">
      <AuthBrandHeading variant="doctor" />

      <Card className="border-red-500/40 bg-card/70 shadow-sm">
        <CardContent className="flex flex-col items-center gap-4 px-5 py-8 text-center sm:px-6">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/15">
            <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
          </span>

          <div>
            <h1 className="text-xl font-extrabold text-foreground">Verification could not be completed</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Dr. {info?.name ?? 'Doctor'}, your PMDC registration could not be verified at this time.
            </p>
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
                  <Badge className="mt-0.5 bg-red-500/15 text-[10px] font-bold text-red-700 dark:text-red-400">
                    {(info.accountStatus ?? 'suspended').toUpperCase()}
                  </Badge>
                </div>
              </div>
            </div>
          ) : null}

          <div className="flex w-full flex-col gap-2 rounded-xl border border-amber-500/30 bg-amber-50/50 p-3 text-left dark:bg-amber-950/10">
            <p className="text-xs leading-relaxed text-amber-900 dark:text-amber-200">
              <span className="font-bold">Next steps:</span>
            </p>
            <ul className="ml-4 list-disc space-y-1 text-xs text-amber-800 dark:text-amber-300">
              <li>Re-upload clearer photos of your PMDC card and CNIC.</li>
              <li>Make sure your PMDC number matches the card exactly.</li>
              <li>Contact PMDC if your registration has lapsed.</li>
            </ul>
          </div>

          <div className="flex w-full flex-col gap-2 sm:flex-row">
            <Button
              asChild
              variant="outline"
              className="min-h-11 flex-1 gap-1.5 rounded-xl"
            >
              <Link href="/auth/doctor/signup">
                <Upload className="h-4 w-4" /> Re-upload documents
              </Link>
            </Button>
            <Button
              onClick={() => signOut({ callbackUrl: '/' })}
              variant="ghost"
              className="min-h-11 flex-1 gap-1.5 rounded-xl"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </Button>
          </div>

          <p className="flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
            <Mail className="h-3 w-3" /> Questions? Email{' '}
            <span className="font-semibold text-foreground">support@sehatai.pk</span>
          </p>
        </CardContent>
      </Card>
    </AuthShell>
  );
}
