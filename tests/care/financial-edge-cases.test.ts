// ============================================================
// SehatAI Care Connect — Financial Edge Cases & Production Gating Test Suite
// Verifies:
// 1. Successful positive-value doctor payouts
// 2. Refunds before payout (pending earning reversal)
// 3. Refunds after earning maturity (available earning reversal)
// 4. Refunds after confirmed payout (negative-balance liability clawback)
// 5. Negative-balance recovery from subsequent consultation earnings
// 6. Chargebacks and commission reversal
// 7. Failed settlement and payout retries
// 8. Failed settlement permanent cancellation and wallet restoration
// 9. Production doctor eligibility corrections (no name-prefix bypass)
// 10. Pakistan-Afghanistan cross-border clinical corridors disabled by default
// 11. Strict double-entry ledger invariants across all transactions
// ============================================================
import { describe, expect, test, beforeAll, afterAll } from 'bun:test';
import { PrismaClient } from '@prisma/client';
import { createConsultation } from '../../src/server/care/consultation-service';
import { requestRefund, processChargeback } from '../../src/server/care/refund-service';
import { requestPayout, processPayout, retryPayout, revertFailedPayout, promoteDueEarnings } from '../../src/server/care/payout-service';
import { postTransaction, doctorWallet } from '../../src/server/care/ledger';
import { evaluateJurisdiction } from '../../src/server/care/jurisdiction';
import { isDoctorProductionEligible } from '../../src/server/care/marketplace';

(process.env as Record<string, string | undefined>).NODE_ENV = 'development';
process.env.CARE_PAYMENTS_ENABLED = 'true';

const db = new PrismaClient();
const stamp = `fin_${Date.now()}`;

let patientId: string;

async function createDoctorFixture(tag: string) {
  const docUser = await db.user.create({
    data: {
      email: `${stamp}-${tag}-doc@local.test`,
      name: `Dr ${tag} Specialist`,
      role: 'doctor',
      accountStatus: 'active',
      passwordHash: 'dummy',
    },
  });

  const docProfile = await db.doctorProfile.create({
    data: {
      userId: docUser.id,
      pmdcNumber: `FIN-${tag.toUpperCase()}-${stamp.slice(-6)}`,
      specialty: 'Cardiology',
      country: 'PK',
      facilityCity: 'Lahore',
      careStatus: 'ACTIVE',
      pmdcVerifiedAt: new Date(),
      pmdcVerifiedBy: 'admin-auditor-id',
      languages: JSON.stringify(['en', 'ur']),
      payoutMethod: JSON.stringify({ type: 'bank_account', label: 'Standard Chartered', last4: '9988' }),
    },
  });

  const service = await db.doctorService.create({
    data: {
      doctorProfileId: docProfile.id,
      type: 'TEXT',
      priceMinor: 200000,
      currency: 'PKR',
      durationMinutes: 15,
      windowHours: 24,
    },
  });

  return { docUser, docProfile, service };
}

beforeAll(async () => {
  const patient = await db.user.create({
    data: {
      email: `${stamp}-patient@local.test`,
      name: 'Financial Test Patient',
      role: 'user',
      accountStatus: 'active',
      passwordHash: 'dummy',
    },
  });
  patientId = patient.id;
});

afterAll(async () => {
  const users = await db.user.findMany({
    where: { email: { contains: stamp } },
    select: { id: true },
  });
  for (const u of users) {
    await db.user.delete({ where: { id: u.id } }).catch(() => undefined);
  }
  await db.ledgerEntry.deleteMany({ where: { reference: { contains: stamp } } }).catch(() => undefined);
  await db.paymentWebhook.deleteMany({ where: { eventId: { contains: stamp } } }).catch(() => undefined);
  await db.$disconnect();
});

describe('SehatAI Financial Edge Cases & Ledger Invariants', () => {
  test('1. Successful positive-value doctor payout lifecycle with balanced ledger legs', async () => {
    const { docUser, docProfile } = await createDoctorFixture('payout');

    // 0. Zero-dollar available balance payout request is strictly rejected
    await expect(
      requestPayout({
        doctorProfileId: docProfile.id,
        doctorUserId: docUser.id,
        currency: 'PKR',
      })
    ).rejects.toThrow('NOTHING_AVAILABLE');

    // Consultation with PKR 2,500 gross, 500 platform fee, 2,000 doctor net
    const c = await db.consultation.create({
      data: {
        patientId,
        doctorProfileId: docProfile.id,
        doctorUserId: docUser.id,
        type: 'TEXT',
        status: 'COMPLETED',
        priceMinor: 250000,
        currency: 'PKR',
      },
    });

    const p = await db.payment.create({
      data: {
        consultationId: c.id,
        patientId,
        provider: 'mock',
        status: 'PAID',
        amountMinor: 250000,
        currency: 'PKR',
        breakdownJson: JSON.stringify({ doctorFeeMinor: 200000, platformFeeMinor: 50000 }),
        idempotencyKey: `${stamp}-pay-1`,
      },
    });

    await db.doctorEarning.create({
      data: {
        doctorProfileId: docProfile.id,
        consultationId: c.id,
        grossMinor: 250000,
        commissionMinor: 50000,
        processorFeeMinor: 0,
        netMinor: 200000,
        currency: 'PKR',
        state: 'PENDING',
        availableAt: new Date(Date.now() - 5000), // Matured
      },
    });

    await postTransaction({
      reference: `${stamp}-initial-pay-1`,
      idempotencyKey: `${stamp}-initial-pay-1`,
      consultationId: c.id,
      paymentId: p.id,
      legs: [
        { accountKind: 'PLATFORM_CASH', direction: 'DEBIT', amountMinor: 250000, currency: 'PKR' },
        { accountKind: 'DOCTOR_PENDING', ownerDoctorProfileId: docProfile.id, direction: 'CREDIT', amountMinor: 200000, currency: 'PKR' },
        { accountKind: 'PLATFORM_FEE', direction: 'CREDIT', amountMinor: 50000, currency: 'PKR' },
      ],
    });

    // 1. Promote due earnings
    await promoteDueEarnings();
    let wallet = await doctorWallet(docProfile.id, 'PKR');
    expect(wallet.availableMinor).toBe(200000);

    // 2. Doctor requests payout
    const payout = await requestPayout({
      doctorProfileId: docProfile.id,
      doctorUserId: docUser.id,
      currency: 'PKR',
    });
    expect(payout.id).toBeDefined();
    expect(payout.state).toBe('PENDING');
    expect(payout.amountMinor).toBe(200000);

    // 3. Process payout to provider
    const processed = await processPayout({ payoutId: payout.id });
    expect(processed?.state).toBe('PAID');

    // 4. Verify doctor wallet available is 0
    wallet = await doctorWallet(docProfile.id, 'PKR');
    expect(wallet.availableMinor).toBe(0);

    // 5. Verify ledger double-entry invariants
    const payoutEntries = await db.ledgerEntry.findMany({ where: { payoutId: payout.id } });
    const debits = payoutEntries.filter((e) => e.direction === 'DEBIT').reduce((s, e) => s + e.amountMinor, 0);
    const credits = payoutEntries.filter((e) => e.direction === 'CREDIT').reduce((s, e) => s + e.amountMinor, 0);
    expect(debits).toBe(credits);
  });

  test('2. Refund before payout (pending earning) with commission reversal', async () => {
    const { docUser, docProfile } = await createDoctorFixture('ref-pend');

    const c = await db.consultation.create({
      data: {
        patientId,
        doctorProfileId: docProfile.id,
        doctorUserId: docUser.id,
        type: 'TEXT',
        status: 'PAID',
        priceMinor: 150000, // PKR 1,500.00
        currency: 'PKR',
      },
    });

    const p = await db.payment.create({
      data: {
        consultationId: c.id,
        patientId,
        provider: 'mock',
        status: 'PAID',
        amountMinor: 150000,
        currency: 'PKR',
        breakdownJson: JSON.stringify({ doctorFeeMinor: 120000, platformFeeMinor: 30000 }),
        idempotencyKey: `${stamp}-pay-2`,
      },
    });

    await db.doctorEarning.create({
      data: {
        doctorProfileId: docProfile.id,
        consultationId: c.id,
        grossMinor: 150000,
        commissionMinor: 30000,
        processorFeeMinor: 0,
        netMinor: 120000,
        currency: 'PKR',
        state: 'PENDING',
        availableAt: new Date(Date.now() + 72 * 3600_000), // Not matured
      },
    });

    await postTransaction({
      reference: `${stamp}-pay-2`,
      idempotencyKey: `${stamp}-pay-2`,
      consultationId: c.id,
      paymentId: p.id,
      legs: [
        { accountKind: 'PLATFORM_CASH', direction: 'DEBIT', amountMinor: 150000, currency: 'PKR' },
        { accountKind: 'DOCTOR_PENDING', ownerDoctorProfileId: docProfile.id, direction: 'CREDIT', amountMinor: 120000, currency: 'PKR' },
        { accountKind: 'PLATFORM_FEE', direction: 'CREDIT', amountMinor: 30000, currency: 'PKR' },
      ],
    });

    // Request and confirm refund
    const refundRes = await requestRefund({
      consultationId: c.id,
      actorId: patientId,
      actorRole: 'PATIENT',
      reason: 'patient_cancelled',
    });
    const refundRecord = await db.refund.findUnique({ where: { id: refundRes.refund.id } });
    expect(refundRecord?.state).toBe('REFUNDED');

    // Earning marked REVERSED
    const earning = await db.doctorEarning.findUnique({ where: { consultationId: c.id } });
    expect(earning?.state).toBe('REVERSED');

    // Doctor wallet pending balance should be 0
    const wallet = await doctorWallet(docProfile.id, 'PKR');
    expect(wallet.pendingMinor).toBe(0);

    // Ledger double-entry check for refund
    const refundEntries = await db.ledgerEntry.findMany({ where: { refundId: refundRes.refund.id } });
    const debits = refundEntries.filter((e) => e.direction === 'DEBIT').reduce((s, e) => s + e.amountMinor, 0);
    const credits = refundEntries.filter((e) => e.direction === 'CREDIT').reduce((s, e) => s + e.amountMinor, 0);
    expect(debits).toBe(credits);
    expect(debits).toBe(150000);

    // Chargeback on already refunded payment is strictly rejected
    await expect(
      processChargeback({ paymentId: p.id, reason: 'unauthorized chargeback after refund' })
    ).rejects.toThrow('CANNOT_CHARGEBACK_ALREADY_REFUNDED');
  });

  test('3. Refund after earning maturity (available earning) with commission reversal', async () => {
    const { docUser, docProfile } = await createDoctorFixture('ref-avail');

    const c = await db.consultation.create({
      data: {
        patientId,
        doctorProfileId: docProfile.id,
        doctorUserId: docUser.id,
        type: 'TEXT',
        status: 'COMPLETED',
        priceMinor: 100000, // PKR 1,000.00
        currency: 'PKR',
      },
    });

    const p = await db.payment.create({
      data: {
        consultationId: c.id,
        patientId,
        provider: 'mock',
        status: 'PAID',
        amountMinor: 100000,
        currency: 'PKR',
        breakdownJson: JSON.stringify({ doctorFeeMinor: 80000, platformFeeMinor: 20000 }),
        idempotencyKey: `${stamp}-pay-3`,
      },
    });

    await db.doctorEarning.create({
      data: {
        doctorProfileId: docProfile.id,
        consultationId: c.id,
        grossMinor: 100000,
        commissionMinor: 20000,
        processorFeeMinor: 0,
        netMinor: 80000,
        currency: 'PKR',
        state: 'PENDING',
        availableAt: new Date(Date.now() - 1000), // Matured
      },
    });

    await postTransaction({
      reference: `${stamp}-pay-3`,
      idempotencyKey: `${stamp}-pay-3`,
      consultationId: c.id,
      paymentId: p.id,
      legs: [
        { accountKind: 'PLATFORM_CASH', direction: 'DEBIT', amountMinor: 100000, currency: 'PKR' },
        { accountKind: 'DOCTOR_PENDING', ownerDoctorProfileId: docProfile.id, direction: 'CREDIT', amountMinor: 80000, currency: 'PKR' },
        { accountKind: 'PLATFORM_FEE', direction: 'CREDIT', amountMinor: 20000, currency: 'PKR' },
      ],
    });

    await promoteDueEarnings();
    let wallet = await doctorWallet(docProfile.id, 'PKR');
    expect(wallet.availableMinor).toBe(80000);

    // Support processes full refund for technical failure
    const refundRes = await requestRefund({
      consultationId: c.id,
      actorId: patientId,
      actorRole: 'SUPPORT',
      reason: 'technical_failure',
    });
    const refundRecord = await db.refund.findUnique({ where: { id: refundRes.refund.id } });
    expect(refundRecord?.state).toBe('REFUNDED');

    // Available balance reversed to 0
    wallet = await doctorWallet(docProfile.id, 'PKR');
    expect(wallet.availableMinor).toBe(0);

    const refundEntries = await db.ledgerEntry.findMany({ where: { refundId: refundRes.refund.id } });
    const debits = refundEntries.filter((e) => e.direction === 'DEBIT').reduce((s, e) => s + e.amountMinor, 0);
    const credits = refundEntries.filter((e) => e.direction === 'CREDIT').reduce((s, e) => s + e.amountMinor, 0);
    expect(debits).toBe(credits);
    expect(debits).toBe(100000);
  });

  test('4. Refund after confirmed payout creates negative doctor balance and blocks subsequent payouts', async () => {
    const { docUser, docProfile } = await createDoctorFixture('clawback');

    // 1. Create and pay consultation
    const c = await db.consultation.create({
      data: {
        patientId,
        doctorProfileId: docProfile.id,
        doctorUserId: docUser.id,
        type: 'TEXT',
        status: 'COMPLETED',
        priceMinor: 200000, // PKR 2,000.00
        currency: 'PKR',
      },
    });

    const p = await db.payment.create({
      data: {
        consultationId: c.id,
        patientId,
        provider: 'mock',
        status: 'PAID',
        amountMinor: 200000,
        currency: 'PKR',
        breakdownJson: JSON.stringify({ doctorFeeMinor: 160000, platformFeeMinor: 40000 }),
        idempotencyKey: `${stamp}-pay-4`,
      },
    });

    await db.doctorEarning.create({
      data: {
        doctorProfileId: docProfile.id,
        consultationId: c.id,
        grossMinor: 200000,
        commissionMinor: 40000,
        processorFeeMinor: 0,
        netMinor: 160000,
        currency: 'PKR',
        state: 'AVAILABLE',
        availableAt: new Date(Date.now() - 3600000),
      },
    });

    await postTransaction({
      reference: `${stamp}-pay-4`,
      idempotencyKey: `${stamp}-pay-4`,
      consultationId: c.id,
      paymentId: p.id,
      legs: [
        { accountKind: 'PLATFORM_CASH', direction: 'DEBIT', amountMinor: 200000, currency: 'PKR' },
        { accountKind: 'DOCTOR_AVAILABLE', ownerDoctorProfileId: docProfile.id, direction: 'CREDIT', amountMinor: 160000, currency: 'PKR' },
        { accountKind: 'PLATFORM_FEE', direction: 'CREDIT', amountMinor: 40000, currency: 'PKR' },
      ],
    });

    // 2. Doctor requests and receives payout
    const payout = await requestPayout({
      doctorProfileId: docProfile.id,
      doctorUserId: docUser.id,
      currency: 'PKR',
    });
    await processPayout({ payoutId: payout.id });

    // Doctor wallet is now 0
    let wallet = await doctorWallet(docProfile.id, 'PKR');
    expect(wallet.availableMinor).toBe(0);

    // 3. Post-payout refund is initiated
    const refundRes = await requestRefund({
      consultationId: c.id,
      actorId: patientId,
      actorRole: 'SUPPORT',
      reason: 'technical_failure',
    });
    const refundRecord = await db.refund.findUnique({ where: { id: refundRes.refund.id } });
    expect(refundRecord?.state).toBe('REFUNDED');

    // 4. Doctor available balance is now NEGATIVE (-160,000 minor)
    wallet = await doctorWallet(docProfile.id, 'PKR');
    expect(wallet.availableMinor).toBe(-160000);

    // 5. Subsequent payout request must be blocked
    await expect(
      requestPayout({
        doctorProfileId: docProfile.id,
        doctorUserId: docUser.id,
        currency: 'PKR',
      })
    ).rejects.toThrow('NOTHING_AVAILABLE');

    // 6. Verify ledger entries for post-payout refund balance
    const refundEntries = await db.ledgerEntry.findMany({ where: { refundId: refundRes.refund.id } });
    const debits = refundEntries.filter((e) => e.direction === 'DEBIT').reduce((s, e) => s + e.amountMinor, 0);
    const credits = refundEntries.filter((e) => e.direction === 'CREDIT').reduce((s, e) => s + e.amountMinor, 0);
    expect(debits).toBe(credits);
  });

  test('5. Negative-balance recovery: future mature earnings automatically offset debt before allowing payouts', async () => {
    const { docUser, docProfile } = await createDoctorFixture('neg-recov');

    // 1. Initial consultation & payout of 160,000
    const c1 = await db.consultation.create({
      data: { patientId, doctorProfileId: docProfile.id, doctorUserId: docUser.id, type: 'TEXT', status: 'COMPLETED', priceMinor: 200000, currency: 'PKR' },
    });
    const p1 = await db.payment.create({
      data: { consultationId: c1.id, patientId, provider: 'mock', status: 'PAID', amountMinor: 200000, currency: 'PKR', breakdownJson: JSON.stringify({ doctorFeeMinor: 160000, platformFeeMinor: 40000 }), idempotencyKey: `${stamp}-p1` },
    });
    await db.doctorEarning.create({
      data: { doctorProfileId: docProfile.id, consultationId: c1.id, grossMinor: 200000, commissionMinor: 40000, netMinor: 160000, currency: 'PKR', state: 'AVAILABLE', availableAt: new Date(Date.now() - 3600000) },
    });
    await postTransaction({
      reference: `${stamp}-p1-tx`,
      idempotencyKey: `${stamp}-p1-tx`,
      consultationId: c1.id,
      paymentId: p1.id,
      legs: [
        { accountKind: 'PLATFORM_CASH', direction: 'DEBIT', amountMinor: 200000, currency: 'PKR' },
        { accountKind: 'DOCTOR_AVAILABLE', ownerDoctorProfileId: docProfile.id, direction: 'CREDIT', amountMinor: 160000, currency: 'PKR' },
        { accountKind: 'PLATFORM_FEE', direction: 'CREDIT', amountMinor: 40000, currency: 'PKR' },
      ],
    });

    const payout1 = await requestPayout({ doctorProfileId: docProfile.id, doctorUserId: docUser.id, currency: 'PKR' });
    await processPayout({ payoutId: payout1.id });

    // 2. Refund claws back 160,000 -> wallet becomes -160,000
    await requestRefund({ consultationId: c1.id, actorId: patientId, actorRole: 'SUPPORT', reason: 'technical_failure' });
    let wallet = await doctorWallet(docProfile.id, 'PKR');
    expect(wallet.availableMinor).toBe(-160000);

    // 3. Doctor conducts a new consultation for PKR 3,000 (doctor net PKR 240,000)
    const cNew = await db.consultation.create({
      data: { patientId, doctorProfileId: docProfile.id, doctorUserId: docUser.id, type: 'TEXT', status: 'COMPLETED', priceMinor: 300000, currency: 'PKR' },
    });
    const pNew = await db.payment.create({
      data: { consultationId: cNew.id, patientId, provider: 'mock', status: 'PAID', amountMinor: 300000, currency: 'PKR', breakdownJson: JSON.stringify({ doctorFeeMinor: 240000, platformFeeMinor: 60000 }), idempotencyKey: `${stamp}-pay-5` },
    });
    await db.doctorEarning.create({
      data: { doctorProfileId: docProfile.id, consultationId: cNew.id, grossMinor: 300000, commissionMinor: 60000, netMinor: 240000, currency: 'PKR', state: 'PENDING', availableAt: new Date(Date.now() - 1000) },
    });
    await postTransaction({
      reference: `${stamp}-pay-5`,
      idempotencyKey: `${stamp}-pay-5`,
      consultationId: cNew.id,
      paymentId: pNew.id,
      legs: [
        { accountKind: 'PLATFORM_CASH', direction: 'DEBIT', amountMinor: 300000, currency: 'PKR' },
        { accountKind: 'DOCTOR_PENDING', ownerDoctorProfileId: docProfile.id, direction: 'CREDIT', amountMinor: 240000, currency: 'PKR' },
        { accountKind: 'PLATFORM_FEE', direction: 'CREDIT', amountMinor: 60000, currency: 'PKR' },
      ],
    });

    // 4. Promote new earnings to available
    await promoteDueEarnings();

    // Available balance after recovery: -160,000 + 240,000 = +80,000 minor
    wallet = await doctorWallet(docProfile.id, 'PKR');
    expect(wallet.availableMinor).toBe(80000);

    // Doctor can now request payout, and only for the positive remaining amount (+80,000)
    const payout = await requestPayout({
      doctorProfileId: docProfile.id,
      doctorUserId: docUser.id,
      currency: 'PKR',
    });
    expect(payout.amountMinor).toBe(80000);

    await processPayout({ payoutId: payout.id });
    wallet = await doctorWallet(docProfile.id, 'PKR');
    expect(wallet.availableMinor).toBe(0);
  });

  test('6. Payment chargeback with full commission reversal and doctor clawback', async () => {
    const { docUser, docProfile } = await createDoctorFixture('chgback');

    const c = await db.consultation.create({
      data: { patientId, doctorProfileId: docProfile.id, doctorUserId: docUser.id, type: 'TEXT', status: 'COMPLETED', priceMinor: 200000, currency: 'PKR' },
    });

    const p = await db.payment.create({
      data: { consultationId: c.id, patientId, provider: 'mock', status: 'PAID', amountMinor: 200000, currency: 'PKR', breakdownJson: JSON.stringify({ doctorFeeMinor: 160000, platformFeeMinor: 40000 }), idempotencyKey: `${stamp}-pay-6` },
    });

    await db.doctorEarning.create({
      data: { doctorProfileId: docProfile.id, consultationId: c.id, grossMinor: 200000, commissionMinor: 40000, processorFeeMinor: 0, netMinor: 160000, currency: 'PKR', state: 'PENDING', availableAt: new Date(Date.now() + 72 * 3600_000) },
    });

    await postTransaction({
      reference: `${stamp}-pay-6`,
      idempotencyKey: `${stamp}-pay-6`,
      consultationId: c.id,
      paymentId: p.id,
      legs: [
        { accountKind: 'PLATFORM_CASH', direction: 'DEBIT', amountMinor: 200000, currency: 'PKR' },
        { accountKind: 'DOCTOR_PENDING', ownerDoctorProfileId: docProfile.id, direction: 'CREDIT', amountMinor: 160000, currency: 'PKR' },
        { accountKind: 'PLATFORM_FEE', direction: 'CREDIT', amountMinor: 40000, currency: 'PKR' },
      ],
    });

    // Processor sends chargeback event
    const cbRes = await processChargeback({
      paymentId: p.id,
      reason: 'fraudulent_transaction',
      actorRole: 'FINANCE',
    });
    expect(cbRes.success).toBe(true);

    const updatedPayment = await db.payment.findUnique({ where: { id: p.id } });
    expect(updatedPayment?.status).toBe('CHARGEDBACK');

    const updatedConsultation = await db.consultation.findUnique({ where: { id: c.id } });
    expect(updatedConsultation?.status).toBe('DISPUTED');

    // Verify chargeback ledger balance
    const cbEntries = await db.ledgerEntry.findMany({ where: { reference: `chargeback:${p.id}` } });
    const debits = cbEntries.filter((e) => e.direction === 'DEBIT').reduce((s, e) => s + e.amountMinor, 0);
    const credits = cbEntries.filter((e) => e.direction === 'CREDIT').reduce((s, e) => s + e.amountMinor, 0);
    expect(debits).toBe(credits);
    expect(debits).toBe(200000);
  });

  test('7. Failed settlement and payout retry advances to PAID', async () => {
    const { docUser, docProfile } = await createDoctorFixture('payout-retry');

    // Setup available funds
    const c = await db.consultation.create({
      data: { patientId, doctorProfileId: docProfile.id, doctorUserId: docUser.id, type: 'TEXT', status: 'COMPLETED' },
    });
    await db.doctorEarning.create({
      data: {
        doctorProfileId: docProfile.id,
        consultationId: c.id,
        grossMinor: 100000,
        commissionMinor: 20000,
        processorFeeMinor: 0,
        netMinor: 80000,
        currency: 'PKR',
        state: 'AVAILABLE',
        availableAt: new Date(Date.now() - 1000),
      },
    });

    await postTransaction({
      reference: `${stamp}-pay-7`,
      idempotencyKey: `${stamp}-pay-7`,
      legs: [
        { accountKind: 'PLATFORM_CASH', direction: 'DEBIT', amountMinor: 80000, currency: 'PKR' },
        { accountKind: 'DOCTOR_AVAILABLE', ownerDoctorProfileId: docProfile.id, direction: 'CREDIT', amountMinor: 80000, currency: 'PKR' },
      ],
    });

    const payout = await requestPayout({ doctorProfileId: docProfile.id, doctorUserId: docUser.id, currency: 'PKR' });

    // Simulate provider failure
    await db.payout.update({
      where: { id: payout.id },
      data: { state: 'FAILED', failureReason: 'Bank switch network timeout' },
    });

    // Payout is in FAILED state
    let check = await db.payout.findUnique({ where: { id: payout.id } });
    expect(check?.state).toBe('FAILED');

    // Retry payout
    const retried = await retryPayout({ payoutId: payout.id });
    expect(retried?.state).toBe('PAID');

    // Clearing entries balance
    const pEntries = await db.ledgerEntry.findMany({ where: { payoutId: payout.id } });
    const debits = pEntries.filter((e) => e.direction === 'DEBIT').reduce((s, e) => s + e.amountMinor, 0);
    const credits = pEntries.filter((e) => e.direction === 'CREDIT').reduce((s, e) => s + e.amountMinor, 0);
    expect(debits).toBe(credits);
  });

  test('8. Failed settlement permanent cancellation restores doctor available balance', async () => {
    const { docUser, docProfile } = await createDoctorFixture('payout-revert');

    const c = await db.consultation.create({
      data: { patientId, doctorProfileId: docProfile.id, doctorUserId: docUser.id, type: 'TEXT', status: 'COMPLETED' },
    });
    await db.doctorEarning.create({
      data: {
        doctorProfileId: docProfile.id,
        consultationId: c.id,
        grossMinor: 100000,
        commissionMinor: 20000,
        processorFeeMinor: 0,
        netMinor: 80000,
        currency: 'PKR',
        state: 'AVAILABLE',
        availableAt: new Date(Date.now() - 1000),
      },
    });

    await postTransaction({
      reference: `${stamp}-pay-8`,
      idempotencyKey: `${stamp}-pay-8`,
      legs: [
        { accountKind: 'PLATFORM_CASH', direction: 'DEBIT', amountMinor: 80000, currency: 'PKR' },
        { accountKind: 'DOCTOR_AVAILABLE', ownerDoctorProfileId: docProfile.id, direction: 'CREDIT', amountMinor: 80000, currency: 'PKR' },
      ],
    });

    const payout = await requestPayout({ doctorProfileId: docProfile.id, doctorUserId: docUser.id, currency: 'PKR' });

    // Mark failed
    await db.payout.update({
      where: { id: payout.id },
      data: { state: 'FAILED', failureReason: 'Account closed at recipient bank' },
    });

    // Operator cancels and reverts failed payout
    const reverted = await revertFailedPayout({
      payoutId: payout.id,
      reason: 'Recipient account invalid; funds returned to wallet',
    });
    expect(reverted?.state).toBe('REVERSED');

    // Doctor available balance restored
    const wallet = await doctorWallet(docProfile.id, 'PKR');
    expect(wallet.availableMinor).toBe(80000);

    // Earning state returned to AVAILABLE
    const earning = await db.doctorEarning.findUnique({ where: { consultationId: c.id } });
    expect(earning?.state).toBe('AVAILABLE');
  });

  test('9. Doctor production eligibility requires 5 explicit criteria (no name-prefix bypass)', () => {
    // 1. Profile with non-test name but lacking admin approval
    const unapprovedDoc = {
      pmdcNumber: '12345-P',
      pmdcVerifiedAt: new Date(),
      pmdcVerifiedBy: null, // Missing admin approval
      country: 'PK',
      careStatus: 'ACTIVE',
      user: { email: 'doctor@hospital.pk', name: 'Dr Aslam Khan', accountStatus: 'active' },
    };
    const res1 = isDoctorProductionEligible(unapprovedDoc);
    expect(res1.eligible).toBe(false);
    expect(res1.reasons).toContain('ADMIN_APPROVAL_REQUIRED');

    // 2. Profile with non-active careStatus
    const suspendedDoc = {
      pmdcNumber: '12345-P',
      pmdcVerifiedAt: new Date(),
      pmdcVerifiedBy: 'admin-001',
      country: 'PK',
      careStatus: 'SUSPENDED',
      user: { email: 'doctor@hospital.pk', name: 'Dr Aslam Khan', accountStatus: 'active' },
    };
    const res2 = isDoctorProductionEligible(suspendedDoc);
    expect(res2.eligible).toBe(false);
    expect(res2.reasons).toContain('CARE_STATUS_NOT_ACTIVE');

    // 3. Profile with revoked jurisdiction
    const revokedDoc = {
      pmdcNumber: '12345-P',
      pmdcVerifiedAt: new Date(),
      pmdcVerifiedBy: 'admin-001',
      country: 'PK',
      careStatus: 'ACTIVE',
      user: { email: 'doctor@hospital.pk', name: 'Dr Aslam Khan', accountStatus: 'active' },
      jurisdictions: [{ countryCode: 'PK', status: 'REVOKED' }],
    };
    const res3 = isDoctorProductionEligible(revokedDoc);
    expect(res3.eligible).toBe(false);
    expect(res3.reasons).toContain('JURISDICTION_REVOKED');

    // 4. Fully compliant doctor profile
    const validDoc = {
      pmdcNumber: '12345-P',
      pmdcVerifiedAt: new Date(),
      pmdcVerifiedBy: 'admin-001',
      country: 'PK',
      careStatus: 'ACTIVE',
      user: { email: 'doctor@hospital.pk', name: 'Dr Aslam Khan', accountStatus: 'active' },
      jurisdictions: [{ countryCode: 'PK', status: 'LICENSED' }],
    };
    const res4 = isDoctorProductionEligible(validDoc);
    expect(res4.eligible).toBe(true);
    expect(res4.reasons.length).toBe(0);

    // 5. Profile with pending (unlicensed) jurisdiction
    const pendingDoc = {
      pmdcNumber: '12345-P',
      pmdcVerifiedAt: new Date(),
      pmdcVerifiedBy: 'admin-001',
      country: 'PK',
      careStatus: 'ACTIVE',
      user: { email: 'doctor@hospital.pk', name: 'Dr Aslam Khan', accountStatus: 'active' },
      jurisdictions: [{ countryCode: 'PK', status: 'PENDING' }],
    };
    const res5 = isDoctorProductionEligible(pendingDoc);
    expect(res5.eligible).toBe(false);
    expect(res5.reasons).toContain('JURISDICTION_NOT_LICENSED');
  });

  test('10. Pakistan-Afghanistan cross-border clinical corridors disabled by default pending verified approval', async () => {
    // Corridors between PK and AF must be unconditionally blocked without explicit approved flag
    const resAfToPk = await evaluateJurisdiction({
      patientCountry: 'AF',
      doctorCountry: 'PK',
      type: 'TEXT',
    });
    expect(resAfToPk.allowed).toBe(false);
    expect(resAfToPk.reason).toBe('CROSS_BORDER_CORRIDOR_DISABLED_PENDING_APPROVAL');

    const resPkToAf = await evaluateJurisdiction({
      patientCountry: 'PK',
      doctorCountry: 'AF',
      type: 'TEXT',
    });
    expect(resPkToAf.allowed).toBe(false);
    expect(resPkToAf.reason).toBe('CROSS_BORDER_CORRIDOR_DISABLED_PENDING_APPROVAL');
  });

  test('11. Global mathematical zero-imbalance ledger invariant preserved across entire suite', async () => {
    const allEntries = await db.ledgerEntry.findMany();
    const debitsByCurrency: Record<string, number> = {};
    const creditsByCurrency: Record<string, number> = {};

    for (const e of allEntries) {
      if (e.direction === 'DEBIT') {
        debitsByCurrency[e.currency] = (debitsByCurrency[e.currency] ?? 0) + e.amountMinor;
      } else {
        creditsByCurrency[e.currency] = (creditsByCurrency[e.currency] ?? 0) + e.amountMinor;
      }
    }

    for (const curr of Object.keys(debitsByCurrency)) {
      expect(debitsByCurrency[curr]).toBe(creditsByCurrency[curr]);
    }
  });
});
