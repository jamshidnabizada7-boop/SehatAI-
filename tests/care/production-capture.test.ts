import { describe, expect, test } from 'bun:test';
import { randomUUID } from 'node:crypto';
import { db } from '@/lib/db';
import { markPaymentPaid, processWebhook, transitionPayment } from '@/server/care/payments/payment-service';
import { MockPaymentProvider } from '@/server/care/payments/mock-provider';

/** Synthetic fixtures in a disposable database only; never run against a live ledger. */
async function fixture(breakdown = { doctorFeeMinor: 800, platformFeeMinor: 200, processorFeeMinor: 0 }, provider = 'mock') {
  const target = new URL(process.env.DATABASE_URL ?? '');
  if (!['localhost', '127.0.0.1', '[::1]'].includes(target.hostname) || !/test/i.test(target.pathname)) throw new Error('Capture tests require a disposable loopback test database.');
  const tag = randomUUID();
  const patient = await db.user.create({ data: { email: `capture-p-${tag}@synthetic.test`, name: 'SYNTHETIC Patient', role: 'user' } });
  const doctor = await db.user.create({ data: { email: `capture-d-${tag}@synthetic.test`, name: 'SYNTHETIC Doctor', role: 'doctor' } });
  const profile = await db.doctorProfile.create({ data: { userId: doctor.id, pmdcNumber: `TEST-${tag}`, specialty: 'General', pmdcVerifiedAt: new Date() } });
  const c = await db.consultation.create({ data: { patientId: patient.id, doctorUserId: doctor.id, doctorProfileId: profile.id, type: 'TEXT', status: 'PAYMENT_PENDING', patientCountry: 'PK', doctorCountry: 'PK' } });
  const payment = await db.payment.create({ data: { consultationId: c.id, patientId: patient.id, provider, status: 'PENDING', amountMinor: 1000, currency: 'PKR', idempotencyKey: tag, breakdownJson: JSON.stringify(breakdown) } });
  return { payment, c };
}
const capture = (id: string) => markPaymentPaid({ paymentId: id, amountMinor: 1000, currency: 'PKR', providerRef: 'synthetic-reference' });

describe('Atomic capture and recoverable webhook delivery', () => {
  test('a concurrent failure cannot overwrite a captured payment while leaving charge records', async () => {
    for (let attempt = 0; attempt < 4; attempt++) {
      const { payment } = await fixture();
      await Promise.allSettled([capture(payment.id), transitionPayment(payment.id, 'FAILED')]);
      const updated = await db.payment.findUniqueOrThrow({ where: { id: payment.id } });
      const entries = await db.ledgerEntry.count({ where: { paymentId: payment.id } });
      if (entries > 0) expect(updated.status).toBe('PAID');
      else expect(updated.status).toBe('FAILED');
    }
  });
  test('ledger validation failure rolls back paid status and every dependent record', async () => {
    const { payment, c } = await fixture({ doctorFeeMinor: 800, platformFeeMinor: 300, processorFeeMinor: 0 });
    await expect(capture(payment.id)).rejects.toThrow('UNBALANCED');
    expect((await db.payment.findUniqueOrThrow({ where: { id: payment.id } })).status).toBe('PENDING');
    expect((await db.consultation.findUniqueOrThrow({ where: { id: c.id } })).status).toBe('PAYMENT_PENDING');
    expect(await db.ledgerEntry.count({ where: { paymentId: payment.id } })).toBe(0);
    expect(await db.doctorEarning.count({ where: { consultationId: c.id } })).toBe(0);
    expect(await db.platformFee.count({ where: { paymentId: payment.id } })).toBe(0);
    expect(await db.notification.count({ where: { consultationId: c.id } })).toBe(0);
  });
  test('status transition failure after ledger posting rolls back the entire capture', async () => {
    const { payment, c } = await fixture();
    await db.consultation.update({ where: { id: c.id }, data: { status: 'PATIENT_CANCELLED' } });
    await expect(capture(payment.id)).rejects.toThrow();
    expect((await db.payment.findUniqueOrThrow({ where: { id: payment.id } })).status).toBe('PENDING');
    expect(await db.ledgerEntry.count({ where: { paymentId: payment.id } })).toBe(0);
    expect(await db.doctorEarning.count({ where: { consultationId: c.id } })).toBe(0);
  });
  test('concurrent confirmations produce one balanced charge, earning, fee, and notification set', async () => {
    const { payment, c } = await fixture();
    const results = await Promise.all(Array.from({ length: 4 }, () => capture(payment.id)));
    expect(results.filter(r => !r.already).length).toBe(1);
    const entries = await db.ledgerEntry.findMany({ where: { paymentId: payment.id } });
    const sum = (direction: string) => entries.filter(e => e.direction === direction).reduce((s, e) => s + e.amountMinor, 0);
    expect(sum('DEBIT')).toBe(1000);
    expect(sum('CREDIT')).toBe(1000);
    expect(await db.doctorEarning.count({ where: { consultationId: c.id } })).toBe(1);
    expect(await db.platformFee.count({ where: { paymentId: payment.id } })).toBe(1);
    expect(await db.notification.count({ where: { consultationId: c.id } })).toBe(2);
    const notifications = await db.notification.findMany({ where: { consultationId: c.id }, select: { id: true } });
    expect(await db.notificationOutbox.count({ where: { notificationId: { in: notifications.map(n => n.id) } } })).toBe(2);
    expect((await db.consultation.findUniqueOrThrow({ where: { id: c.id } })).status).toBe('REQUESTED');
  });
  test('an authentic failed delivery can be retried after repair without losing the payment', async () => {
    const { payment, c } = await fixture();
    await db.consultation.update({ where: { id: c.id }, data: { status: 'DRAFT' } });
    const signed = MockPaymentProvider.buildSignedWebhook({ eventId: `retry-${payment.id}`, type: 'payment.succeeded', reference: payment.id, amountMinor: 1000, currency: 'PKR' });
    const deliver = () => processWebhook({ provider: 'mock', rawBody: signed.body, headers: new Headers(signed.headers) });
    await expect(deliver()).rejects.toThrow();
    expect((await db.paymentWebhook.findUniqueOrThrow({ where: { provider_eventId: { provider: 'mock', eventId: `retry-${payment.id}` } } })).processed).toBe(false);
    await db.consultation.update({ where: { id: c.id }, data: { status: 'PAYMENT_PENDING' } });
    expect((await deliver()).duplicate).toBe(false);
    expect((await deliver()).duplicate).toBe(true);
    expect((await db.payment.findUniqueOrThrow({ where: { id: payment.id } })).status).toBe('PAID');
  });
  test('a correctly signed mock event cannot capture another provider’s payment', async () => {
    const { payment } = await fixture(undefined, 'card');
    const signed = MockPaymentProvider.buildSignedWebhook({ eventId: `wrong-provider-${payment.id}`, type: 'payment.succeeded', reference: payment.id, amountMinor: 1000, currency: 'PKR' });
    await expect(processWebhook({ provider: 'mock', rawBody: signed.body, headers: new Headers(signed.headers) })).rejects.toThrow('PAYMENT_PROVIDER_MISMATCH');
    expect((await db.payment.findUniqueOrThrow({ where: { id: payment.id } })).status).toBe('PENDING');
  });
});
