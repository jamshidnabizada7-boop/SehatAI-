import { describe, test, expect, beforeAll } from 'bun:test';
import { db } from '../../src/lib/db';
import { createConsultation } from '../../src/server/care/consultation-service';
import { createCheckoutForConsultation, processWebhook } from '../../src/server/care/payments/payment-service';
import { MockPaymentProvider } from '../../src/server/care/payments/mock-provider';
import { postTransaction, balanceOf, LedgerError } from '../../src/server/care/ledger';
import { requestRefund } from '../../src/server/care/refund-service';
import { requestPayout } from '../../src/server/care/payout-service';

describe('PostgreSQL Advanced Concurrency, Isolation & Financial Invariants (P3)', () => {
  const stamp = Date.now();
  let patientId: string;
  let doctorProfileId: string;
  let doctorUserId: string;
  let serviceVideoId: string;

  beforeAll(async () => {
    process.env.CARE_PAYMENTS_ENABLED = 'true';

    // Create test patient
    const patient = await db.user.create({
      data: {
        email: `pg_patient_${stamp}@test.local`,
        role: 'user',
        accountStatus: 'active',
      },
    });
    patientId = patient.id;

    // Consent
    await db.consentRecord.create({
      data: {
        userId: patientId,
        type: 'TELEMEDICINE',
        policyVersion: '2026.10-draft',
        jurisdiction: 'PK',
      },
    });

    // Create test doctor
    const doctorUser = await db.user.create({
      data: {
        email: `pg_doc_${stamp}@test.local`,
        role: 'doctor',
        accountStatus: 'active',
      },
    });
    doctorUserId = doctorUser.id;

    const docProfile = await db.doctorProfile.create({
      data: {
        userId: doctorUser.id,
        pmdcNumber: `PG-${stamp}`,
        pmdcVerifiedAt: new Date(),
        specialty: 'Cardiology',
        country: 'PK',
        careStatus: 'ACTIVE',
        payoutMethod: 'bank_transfer',
      },
    });
    doctorProfileId = docProfile.id;

    // Doctor availability (all 7 days, 24h)
    for (let day = 0; day < 7; day++) {
      await db.doctorAvailability.create({
        data: {
          doctorProfileId,
          weekday: day,
          startMinute: 0,
          endMinute: 1440,
          slotMinutes: 15,
        },
      });
    }

    const service = await db.doctorService.create({
      data: {
        doctorProfileId,
        type: 'VIDEO',
        title: 'Video Consult',
        priceMinor: 200000,
        currency: 'PKR',
        durationMinutes: 15,
      },
    });
    serviceVideoId = service.id;
  });

  test('1. Simultaneous booking of exact same slot (3-way race): exactly 1 succeeds, 2 fail with 409', async () => {
    const at = new Date(Date.now() + 7 * 24 * 3600_000);
    at.setUTCHours(10, 0, 0, 0);

    const makeBooking = () =>
      createConsultation({
        patientId,
        doctorProfileId,
        serviceId: serviceVideoId,
        type: 'VIDEO',
        patientCountry: 'PK',
        scheduledAt: at.toISOString(),
      });

    const results = await Promise.allSettled([makeBooking(), makeBooking(), makeBooking()]);

    const succeeded = results.filter((r) => r.status === 'fulfilled');
    const failed = results.filter((r) => r.status === 'rejected');

    expect(succeeded.length).toBe(1);
    expect(failed.length).toBe(2);

    for (const f of failed) {
      const err = (f as PromiseRejectedResult).reason;
      expect(err.message).toContain('SLOT_ALREADY_BOOKED');
    }
  });

  test('2. Concurrent duplicate webhook processing is strictly serialized and idempotent', async () => {
    const { consultation } = await createConsultation({
      patientId,
      doctorProfileId,
      serviceId: serviceVideoId,
      type: 'VIDEO',
      scheduledAt: new Date(Date.now() + 8 * 24 * 3600_000).toISOString(),
      patientCountry: 'PK',
    });

    const { payment } = await createCheckoutForConsultation({
      consultationId: consultation.id,
      patientId,
      idempotencyKey: `idem_checkout_${stamp}`,
    });

    const eventId = `evt_pg_race_${stamp}`;
    const payload = {
      eventId,
      type: 'payment.succeeded',
      reference: payment.id,
      amountMinor: payment.amountMinor,
      currency: payment.currency,
    };
    const signed = MockPaymentProvider.buildSignedWebhook(payload);

    const callWebhook = () =>
      processWebhook({
        provider: 'mock',
        rawBody: signed.body,
        headers: new Headers(signed.headers),
      });

    // Fire 4 identical webhooks in parallel
    const results = await Promise.all([callWebhook(), callWebhook(), callWebhook(), callWebhook()]);

    const originals = results.filter((r) => !r.duplicate);
    const duplicates = results.filter((r) => r.duplicate);

    expect(originals.length).toBe(1);
    expect(duplicates.length).toBe(3);

    const count = await db.paymentWebhook.count({
      where: { provider: 'mock', eventId },
    });
    expect(count).toBe(1);
  });

  test('3. Concurrent ledger transactions with identical idempotencyKey: exactly 1 posts', async () => {
    const key = `idem_pg_${stamp}`;
    const postLeg = () =>
      postTransaction({
        reference: `ref_pg_${stamp}`,
        idempotencyKey: key,
        legs: [
          { accountKind: 'PLATFORM_CASH', direction: 'DEBIT', amountMinor: 10000, currency: 'PKR' },
          { accountKind: 'SUSPENSE', direction: 'CREDIT', amountMinor: 10000, currency: 'PKR' },
        ],
      });

    const results = await Promise.all([postLeg(), postLeg(), postLeg()]);
    const posted = results.filter((r) => r.posted);
    const idempotent = results.filter((r) => !r.posted);

    expect(posted.length).toBe(1);
    expect(idempotent.length).toBe(2);

    const entries = await db.ledgerEntry.findMany({
      where: { idempotencyKey: `${key}:0` },
    });
    expect(entries.length).toBe(1);
  });

  test('4. Concurrent refunds on same payment: exactly 1 succeeds, 2 fail with 409', async () => {
    // Setup a paid consultation
    const { consultation } = await createConsultation({
      patientId,
      doctorProfileId,
      serviceId: serviceVideoId,
      type: 'VIDEO',
      scheduledAt: new Date(Date.now() + 9 * 24 * 3600_000).toISOString(),
      patientCountry: 'PK',
    });

    const { payment } = await createCheckoutForConsultation({
      consultationId: consultation.id,
      patientId,
      idempotencyKey: `idem_checkout_refund_${stamp}`,
    });

    // Mark payment PAID
    await db.payment.update({
      where: { id: payment.id },
      data: { status: 'PAID', capturedAt: new Date() },
    });

    // 3 concurrent refund requests
    const fireRefund = () =>
      requestRefund({
        consultationId: consultation.id,
        actorId: patientId,
        actorRole: 'PATIENT',
        reason: 'patient_cancelled',
      });

    const results = await Promise.allSettled([fireRefund(), fireRefund(), fireRefund()]);
    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');

    expect(fulfilled.length).toBe(1);
    expect(rejected.length).toBe(2);

    for (const r of rejected) {
      const err = (r as PromiseRejectedResult).reason;
      expect(err.code).toBe('REFUND_EXCEEDS_PAYMENT');
      expect(err.status).toBe(409);
    }

    // Verify exactly 1 refund row exists in database
    const totalRefunds = await db.refund.count({
      where: { paymentId: payment.id },
    });
    expect(totalRefunds).toBe(1);
  });

  test('5. Concurrent payout requests for same doctor: exactly 1 succeeds, 2 fail with 409', async () => {
    const { consultation } = await createConsultation({
      patientId,
      doctorProfileId,
      serviceId: serviceVideoId,
      type: 'VIDEO',
      scheduledAt: new Date(Date.now() + 10 * 24 * 3600_000).toISOString(),
      patientCountry: 'PK',
    });

    // Seed an available doctor earning tied to this consultation
    const earning = await db.doctorEarning.create({
      data: {
        doctorProfileId,
        consultationId: consultation.id,
        grossMinor: 150000,
        commissionMinor: 30000,
        netMinor: 120000,
        currency: 'PKR',
        state: 'AVAILABLE',
        availableAt: new Date(Date.now() - 3600_000),
      },
    });

    // Post matching available credit to the ledger
    await postTransaction({
      reference: `earning:credit:${earning.id}`,
      idempotencyKey: `earning:credit:${earning.id}`,
      legs: [
        { accountKind: 'PLATFORM_CASH', direction: 'DEBIT', amountMinor: 120000, currency: 'PKR' },
        { accountKind: 'DOCTOR_AVAILABLE', ownerDoctorProfileId: doctorProfileId, direction: 'CREDIT', amountMinor: 120000, currency: 'PKR' },
      ],
    });

    // Fire 3 simultaneous payout requests
    const firePayout = () =>
      requestPayout({
        doctorProfileId,
        doctorUserId,
        currency: 'PKR',
      });

    const results = await Promise.allSettled([firePayout(), firePayout(), firePayout()]);
    const succeeded = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');

    expect(succeeded.length).toBe(1);
    expect(rejected.length).toBe(2);

    for (const r of rejected) {
      const err = (r as PromiseRejectedResult).reason;
      expect(err.code).toBe('NOTHING_AVAILABLE');
      expect(err.status).toBe(409);
    }
  });

  test('6. Ledger replay preserves balances and returns posted: false', async () => {
    const replayKey = `idem_replay_${stamp}`;
    const initialBal = await balanceOf('platform:cash:PKR');
    const debitBefore = initialBal?.debitMinor ?? 0;

    const post1 = await postTransaction({
      reference: `ref_replay_${stamp}`,
      idempotencyKey: replayKey,
      legs: [
        { accountKind: 'PLATFORM_CASH', direction: 'DEBIT', amountMinor: 50000, currency: 'PKR' },
        { accountKind: 'SUSPENSE', direction: 'CREDIT', amountMinor: 50000, currency: 'PKR' },
      ],
    });
    expect(post1.posted).toBe(true);

    const balAfterFirst = await balanceOf('platform:cash:PKR');
    expect(balAfterFirst?.debitMinor).toBe(debitBefore + 50000);

    // Replay 1
    const post2 = await postTransaction({
      reference: `ref_replay_${stamp}`,
      idempotencyKey: replayKey,
      legs: [
        { accountKind: 'PLATFORM_CASH', direction: 'DEBIT', amountMinor: 50000, currency: 'PKR' },
        { accountKind: 'SUSPENSE', direction: 'CREDIT', amountMinor: 50000, currency: 'PKR' },
      ],
    });
    expect(post2.posted).toBe(false);

    // Replay 2
    const post3 = await postTransaction({
      reference: `ref_replay_${stamp}`,
      idempotencyKey: replayKey,
      legs: [
        { accountKind: 'PLATFORM_CASH', direction: 'DEBIT', amountMinor: 50000, currency: 'PKR' },
        { accountKind: 'SUSPENSE', direction: 'CREDIT', amountMinor: 50000, currency: 'PKR' },
      ],
    });
    expect(post3.posted).toBe(false);

    // Balance must NOT increase
    const balAfterReplays = await balanceOf('platform:cash:PKR');
    expect(balAfterReplays?.debitMinor).toBe(debitBefore + 50000);
  });

  test('7. Wrong currency / cross-currency mismatch strictly rejected with LedgerError', async () => {
    expect(
      postTransaction({
        reference: `ref_ccy_mismatch_${stamp}`,
        idempotencyKey: `idem_ccy_${stamp}`,
        legs: [
          { accountKind: 'PLATFORM_CASH', direction: 'DEBIT', amountMinor: 10000, currency: 'USD' },
          { accountKind: 'SUSPENSE', direction: 'CREDIT', amountMinor: 10000, currency: 'PKR' },
        ],
      }),
    ).rejects.toThrow(LedgerError);
  });

  test('8. Amount mismatch (debit != credit) strictly rejected with LedgerError', async () => {
    expect(
      postTransaction({
        reference: `ref_amt_mismatch_${stamp}`,
        idempotencyKey: `idem_amt_${stamp}`,
        legs: [
          { accountKind: 'PLATFORM_CASH', direction: 'DEBIT', amountMinor: 10000, currency: 'PKR' },
          { accountKind: 'SUSPENSE', direction: 'CREDIT', amountMinor: 9000, currency: 'PKR' },
        ],
      }),
    ).rejects.toThrow(/UNBALANCED: PKR debits 10000 != credits 9000/);
  });

  test('9. Handling P2002 does NOT suppress unrelated unique constraint violations', async () => {
    // Pre-create an account code
    const uniqueCode = `test:unique:code:${stamp}`;
    await db.ledgerAccount.create({
      data: {
        code: uniqueCode,
        kind: 'SUSPENSE',
        currency: 'PKR',
      },
    });

    // Attempting to create another account with the identical code produces P2002 on `code`
    let caughtError: unknown = null;
    try {
      await db.ledgerAccount.create({
        data: {
          code: uniqueCode,
          kind: 'SUSPENSE',
          currency: 'PKR',
        },
      });
    } catch (err) {
      caughtError = err;
    }

    expect(caughtError).toBeDefined();
    expect((caughtError as { code: string }).code).toBe('P2002');
    // Ensure this unrelated P2002 was not swallowed
    expect((caughtError as { meta: { target: string[] | string } }).meta.target).toBeDefined();

    // Verify postTransaction does NOT swallow P2002 if the target is unrelated or entry does not exist
    const unrelatedP2002 = new Error('Unique constraint failed on the fields: (`code`)');
    (unrelatedP2002 as any).code = 'P2002';
    (unrelatedP2002 as any).meta = { target: ['code'] };

    const origTx = db.$transaction;
    try {
      (db as any).$transaction = async () => { throw unrelatedP2002; };
      await expect(
        postTransaction({
          reference: `ref_unrelated_p2002_${stamp}`,
          idempotencyKey: `idem_unrelated_p2002_${stamp}`,
          legs: [
            { accountKind: 'PLATFORM_CASH', direction: 'DEBIT', amountMinor: 500, currency: 'PKR' },
            { accountKind: 'SUSPENSE', direction: 'CREDIT', amountMinor: 500, currency: 'PKR' },
          ],
        }),
      ).rejects.toThrow();
    } finally {
      (db as any).$transaction = origTx;
    }
  });

  test('10. Repeated concurrency & deadlock resistance: 10 parallel transactions execute without hang', async () => {
    const tasks = Array.from({ length: 10 }, (_, i) =>
      postTransaction({
        reference: `ref_stress_${stamp}_${i}`,
        idempotencyKey: `idem_stress_${stamp}_${i}`,
        legs: [
          { accountKind: 'PLATFORM_CASH', direction: 'DEBIT', amountMinor: 1000 * (i + 1), currency: 'PKR' },
          { accountKind: 'SUSPENSE', direction: 'CREDIT', amountMinor: 1000 * (i + 1), currency: 'PKR' },
        ],
      }),
    );

    const results = await Promise.all(tasks);
    expect(results.every((r) => r.posted)).toBe(true);
  });

  test('11. Concurrent new account creation during postTransaction commits without PostgreSQL 25P02 abort', async () => {
    const ccy = `RACE_${Date.now()}`;
    const t1 = postTransaction({
      idempotencyKey: `idem_race_acc_1_${stamp}`,
      reference: `ref_race_acc_1_${stamp}`,
      legs: [
        { accountKind: 'PLATFORM_CASH', direction: 'DEBIT', amountMinor: 5000, currency: ccy },
        { accountKind: 'SUSPENSE', direction: 'CREDIT', amountMinor: 5000, currency: ccy },
      ],
    });
    const t2 = postTransaction({
      idempotencyKey: `idem_race_acc_2_${stamp}`,
      reference: `ref_race_acc_2_${stamp}`,
      legs: [
        { accountKind: 'PLATFORM_CASH', direction: 'DEBIT', amountMinor: 7500, currency: ccy },
        { accountKind: 'SUSPENSE', direction: 'CREDIT', amountMinor: 7500, currency: ccy },
      ],
    });
    const t3 = postTransaction({
      idempotencyKey: `idem_race_acc_3_${stamp}`,
      reference: `ref_race_acc_3_${stamp}`,
      legs: [
        { accountKind: 'PLATFORM_CASH', direction: 'DEBIT', amountMinor: 2500, currency: ccy },
        { accountKind: 'SUSPENSE', direction: 'CREDIT', amountMinor: 2500, currency: ccy },
      ],
    });

    const results = await Promise.all([t1, t2, t3]);
    expect(results.every((r) => r.posted)).toBe(true);

    const balCash = await balanceOf(`platform:cash:${ccy}`);
    expect(balCash?.debitMinor).toBe(15000);

    const balSuspense = await balanceOf(`suspense:${ccy}`);
    expect(balSuspense?.creditMinor).toBe(15000);
  });
});
