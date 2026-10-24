'use client';

// Care Connect §10 — checkout result page.
// Hosted checkout providers redirect here after payment completion or cancellation.
import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, ArrowRight, Loader2, AlertCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

function CheckoutResultContent() {
  const params = useSearchParams();
  const status = params.get('status') ?? 'complete';
  const mockPaymentId = params.get('mock_payment');

  const [confirming, setConfirming] = useState(Boolean(mockPaymentId));
  const [confirmError, setConfirmError] = useState<string | null>(null);

  useEffect(() => {
    if (mockPaymentId) {
      void fetch('/api/care/payments/mock/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId: mockPaymentId, outcome: 'succeeded' }),
      })
        .then(async (res) => {
          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            setConfirmError(data.error ?? 'CONFIRMATION_FAILED');
          }
        })
        .catch(() => {
          setConfirmError('NETWORK');
        })
        .finally(() => {
          setConfirming(false);
        });
    }
  }, [mockPaymentId]);

  return (
    <main className="flex min-h-[70vh] items-center justify-center p-4">
      <Card className="w-full max-w-md text-center shadow-[var(--raised-shadow)]">
        <CardHeader>
          {/* Icon and tone follow the actual outcome; a cancelled checkout is not a success. */}
          <div
            className={cn(
              'mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full',
              confirming
                ? 'bg-muted text-muted-foreground'
                : confirmError
                ? 'bg-danger-soft text-danger'
                : status === 'cancelled'
                ? 'bg-warning-soft text-warning'
                : 'bg-success-soft text-success',
            )}
          >
            {confirming ? (
              <Loader2 className="h-8 w-8 animate-spin" aria-hidden />
            ) : confirmError ? (
              <AlertCircle className="h-8 w-8" aria-hidden />
            ) : status === 'cancelled' ? (
              <XCircle className="h-8 w-8" aria-hidden />
            ) : (
              <CheckCircle2 className="h-8 w-8" aria-hidden />
            )}
          </div>
          <CardTitle className="text-xl">
            {confirming
              ? 'Finalizing Payment…'
              : confirmError
              ? 'Payment Finalization Issue'
              : `Checkout ${status === 'cancelled' ? 'Cancelled' : 'Processed'}`}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {confirming
              ? 'Confirming test transaction with the verification webhook…'
              : confirmError
              ? `There was an issue finalizing the checkout: ${confirmError}. Please return to Care Connect to verify.`
              : status === 'cancelled'
              ? 'Your checkout process was cancelled. You can return to Care Connect to try again.'
              : 'Your payment was received. Return to Care Connect to access your consultation.'}
          </p>
          <Button asChild className="min-h-11 w-full" disabled={confirming}>
            <Link href="/?view=care">
              Return to Care Connect <ArrowRight className="ms-2 h-4 w-4 rtl:-scale-x-100" aria-hidden />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}

export default function CheckoutResultPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-muted-foreground">Loading checkout result…</div>}>
      <CheckoutResultContent />
    </Suspense>
  );
}
