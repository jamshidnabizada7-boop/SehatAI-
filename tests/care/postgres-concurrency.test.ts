import { describe, test, expect, beforeAll } from 'bun:test';
import { db } from '../../src/lib/db';
import { createConsultation } from '../../src/server/care/consultation-service';
import { createCheckoutForConsultation, processWebhook } from '../../src/server/care/payments/payment-service';
import { MockPaymentProvider } from '../../src/server/care/payments/mock-provider';
import { postTransaction } from '../../src/server/care/ledger';

describe('PostgreSQL Advanced Concurrency & Isolation Suite', () => {
  const stamp = Date.now();
  let patientId: string;
  let doctorProfileId: string;
  let serviceVideoId: string;

  beforeAll(async () => {
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

    const docProfile = await db.doctorProfile.create({
      data: {
        userId: doctorUser.id,
        pmdcNumber: `PG-${stamp}`,
        pmdcVerifiedAt: new Date(),
        specialty: 'Cardiology',
        country: 'PK',
        careStatus: 'ACTIVE',
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
    // Create consultation and checkout first
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

    // Exactly one should be the original processor, 3 should report duplicate: true
    const originals = results.filter((r) => !r.duplicate);
    const duplicates = results.filter((r) => r.duplicate);

    expect(originals.length).toBe(1);
    expect(duplicates.length).toBe(3);

    // Verify DB has only 1 record
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
});
