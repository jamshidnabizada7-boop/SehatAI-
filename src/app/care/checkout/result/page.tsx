'use client';

// Care Connect §10 — checkout result page.
// Hosted checkout providers redirect here after payment completion or cancellation.
import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, ArrowRight, Loader2, AlertCircle } from 'lucide-react';

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
      <Card className="w-full max-w-md text-center shadow-lg">
        <CardHeader>
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400">
            {confirming ? (
              <Loader2 className="h-8 w-8 animate-spin" />
            ) : confirmError ? (
              <AlertCircle className="h-8 w-8 text-destructive" />
            ) : (
              <CheckCircle2 className="h-8 w-8" />
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
            <Link href="/">
              Return to Care Connect <ArrowRight className="ml-2 h-4 w-4" />
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
