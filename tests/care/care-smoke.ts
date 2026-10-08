// Care Connect smoke test — full commercial loop against the local DB.
// Run: npx tsx tests/care/care-smoke.ts
// Validates: consultation create (jurisdiction+availability) → mock
// checkout → SIGNED webhook → PAID → ledger balance → earning → refund
// → compensating ledger. Deterministic; cleans its own rows.
import { PrismaClient } from '@prisma/client';
import { createConsultation } from '../../src/server/care/consultation-service';
import { createCheckoutForConsultation, markPaymentPaid } from '../../src/server/care/payments/payment-service';
import { requestRefund } from '../../src/server/care/refund-service';
import { MockPaymentProvider } from '../../src/server/care/payments/mock-provider';
import { processWebhook } from '../../src/server/care/payments/payment-service';
import { doctorWallet } from '../../src/server/care/ledger';
import { doctorAccept, completeConsultation } from '../../src/server/care/consultation-service';

process.env.CARE_PAYMENTS_ENABLED = 'true';
process.env.NODE_ENV = 'development';

const db = new PrismaClient();
const stamp = `smoke_${Date.now()}`;

function assert(cond: unknown, label: string): void {
  if (!cond) {
    console.error(`✗ ${label}`);
    process.exitCode = 1;
    throw new Error(label);
  }
  console.log(`✓ ${label}`);
}

async function main() {
  // fixtures
  const patient = await db.user.create({
    data: { email: `${stamp}-p@local.test`, name: 'Smoke Patient', role: 'user', passwordHash: 'x' },
  });
  const doctorUser = await db.user.create({
    data: { email: `${stamp}-d@local.test`, name: 'Dr Smoke', role: 'doctor', passwordHash: 'x', accountStatus: 'active' },
  });
  const doctor = await db.doctorProfile.create({
    data: { userId: doctorUser.id, pmdcNumber: `SMOKE-${stamp.slice(-6)}`, specialty: 'Cardiology', pmdcVerifiedAt: new Date(), country: 'PK', careStatus: 'ACTIVE' },
  });
  const service = await db.doctorService.create({
    data: { doctorProfileId: doctor.id, type: 'TEXT', priceMinor: 1000, currency: 'PKR', durationMinutes: 15, windowHours: 24, followUpGraceHours: 48 },
  });
  // availability rows not needed for TEXT.

  // 1. create consultation
  const { consultation } = await createConsultation({
    patientId: patient.id,
    doctorProfileId: doctor.id,
    type: 'TEXT',
    serviceId: service.id,
    patientCountry: 'PK',
    idempotencyKey: `${stamp}-create`,
  });
  assert(consultation.status === 'PAYMENT_PENDING', 'consultation created as PAYMENT_PENDING');

  // 2. checkout
  process.env.CARE_PAYMENTS_ENABLED = 'true';
  const { payment, checkoutUrl } = await createCheckoutForConsultation({
    consultationId: consultation.id, patientId: patient.id, idempotencyKey: `${stamp}-pay`,
  });
  assert(payment.status === 'PENDING', 'payment created PENDING');
  assert(!!checkoutUrl, 'checkout url returned');

  // 3. signed webhook (the ONLY trust path)
  const event = {
    eventId: `evt_${stamp}`, type: 'payment.succeeded', reference: payment.id,
    amountMinor: 1000, currency: 'PKR',
  };
  const signed = MockPaymentProvider.buildSignedWebhook(event);
  await processWebhook({ provider: 'mock', rawBody: signed.body, headers: new Headers(signed.headers) });
  const paid = await db.payment.findUnique({ where: { id: payment.id } });
  assert(paid?.status === 'PAID', 'webhook marked payment PAID');
  const afterPaid = await db.consultation.findUnique({ where: { id: consultation.id } });
  assert(afterPaid?.status === 'REQUESTED', 'consultation → REQUESTED');

  // replay same webhook — must be idempotent
  const signedReplay = { ...signed, headers: { ...signed.headers, 'x-mock-timestamp': String(Date.now()), 'x-mock-signature': '' } };
  const rebuilt = MockPaymentProvider.buildSignedWebhook({ ...event, eventId: `evt_${stamp}` });
  const replay = await processWebhook({ provider: 'mock', rawBody: rebuilt.body, headers: new Headers(rebuilt.headers) });
  assert(replay.duplicate === true, 'webhook replay is idempotent (duplicate ack)');

  // 4. ledger balanced
  const wallet = await doctorWallet(doctor.id, 'PKR');
  assert(wallet.pendingMinor === 800, `doctor pending = 800 (20% commission) — got ${wallet.pendingMinor}`);

  // 5. earning row
  const earning = await db.doctorEarning.findUnique({ where: { consultationId: consultation.id } });
  assert(earning?.state === 'PENDING' && earning.netMinor === 800, 'earning PENDING 800');

  // 6. doctor accepts (TEXT → WAITING), adds note, completes
  await doctorAccept(consultation.id, doctorUser.id);
  const afterAccept = await db.consultation.findUnique({ where: { id: consultation.id } });
  assert(afterAccept?.status === 'WAITING', 'TEXT consultation → WAITING after accept');
  await db.clinicalNote.create({
    data: { consultationId: consultation.id, type: 'SOAP', visibility: 'PRIVATE_NOTE', content: 'Smoke note', authoredById: doctorUser.id },
  });
  await completeConsultation(consultation.id, doctorUser.id);
  const afterComplete = await db.consultation.findUnique({ where: { id: consultation.id } });
  assert(afterComplete?.status === 'COMPLETED', 'consultation COMPLETED');

  // 7. refund (doctor-side cancellation policy n/a post-completion → patient
  // refund of a completed consult is 0; use technical_failure = full)
  const { refund } = await requestRefund({
    consultationId: consultation.id, actorId: patient.id, actorRole: 'PATIENT',
    reason: 'technical_failure', idempotencyKey: `${stamp}-refund`,
  });
  const refundRow = await db.refund.findUnique({ where: { id: refund.id } });
  assert(refundRow?.state === 'REFUNDED', 'refund provider-confirmed → REFUNDED');
  const walletAfterRefund = await doctorWallet(doctor.id, 'PKR');
  assert(walletAfterRefund.pendingMinor === 0, `doctor pending reversed to 0 — got ${walletAfterRefund.pendingMinor}`);
  const earningAfter = await db.doctorEarning.findUnique({ where: { consultationId: consultation.id } });
  assert(earningAfter?.state === 'REVERSED', 'earning REVERSED after full refund');

  console.log('\nSMOKE OK');
}

main()
  .catch((e) => { console.error('SMOKE FAILED:', e.message); process.exit(1); })
  .finally(async () => {
    // cleanup smoke data (order matters)
    try {
      await db.ledgerEntry.deleteMany({ where: { reference: { contains: stamp } } });
      await db.ledgerAccount.deleteMany({ where: { code: { contains: stamp } } }).catch(() => undefined);
      const users = await db.user.findMany({ where: { email: { contains: `${stamp}-` } }, select: { id: true } });
      for (const u of users) await db.user.delete({ where: { id: u.id } }).catch(() => undefined);
      await db.payment.deleteMany({ where: { idempotencyKey: { contains: stamp } } }).catch(() => undefined);
      await db.paymentWebhook.deleteMany({ where: { eventId: { contains: stamp } } }).catch(() => undefined);
    } catch { /* best effort */ }
    await db.$disconnect();
  });
