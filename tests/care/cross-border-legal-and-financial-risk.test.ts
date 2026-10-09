// ============================================================
// SehatAI Care Connect — Cross-Border Architecture, Legal Gating & Financial Risk Tests
// Tasks 2, 3, 5 Verification Suite:
// 1. Cross-border clinical corridor fail-closed protection (PK<->AF)
// 2. Env variable alone cannot activate cross-border corridor
// 3. Versioned JurisdictionPolicy validation (effective date, expiration, legal source, human admin approval)
// 4. Individual doctor cross-border authorization verification
// 5. Pakistani doctor PM&DC eligibility (positive and negative)
// 6. Afghan doctor MoPH eligibility (positive and negative)
// 7. Post-payout refunds and negative balance creation
// 8. Doctor who stops using marketplace & receivable tracking
// 9. Post-settlement chargebacks with compensating ledger legs
// 10. Platform loss allocation (debt write-off) with balanced ledger
// 11. No duplicate debt recovery
// 12. Doctor payout reserve holding policy
// 13. Strict double-entry ledger balance invariant
// ============================================================
import { describe, expect, test, beforeAll, afterAll } from 'bun:test';
import { PrismaClient } from '@prisma/client';
import { evaluateJurisdiction } from '../../src/server/care/jurisdiction';
import { isDoctorProductionEligible, listMarketplaceDoctors } from '../../src/server/care/marketplace';
import { createConsultation } from '../../src/server/care/consultation-service';
import {
  requestRefund,
  processChargeback,
  getDoctorReceivableBalance,
  allocatePlatformLoss,
} from '../../src/server/care/refund-service';
import {
  requestPayout,
  processPayout,
  promoteDueEarnings,
} from '../../src/server/care/payout-service';
import { postTransaction, doctorWallet } from '../../src/server/care/ledger';

const db = new PrismaClient();
const stamp = `cb_${Date.now()}`;
let testPatientId: string;

beforeAll(async () => {
  const patient = await db.user.create({
    data: {
      email: `${stamp}-patient@test.local`,
      name: 'Cross-Border Test Patient',
      role: 'user',
      accountStatus: 'active',
      passwordHash: 'dummy',
    },
  });
  testPatientId = patient.id;
});

afterAll(async () => {
  const users = await db.user.findMany({
    where: { email: { contains: stamp } },
    select: { id: true },
  });
  for (const u of users) {
    await db.user.delete({ where: { id: u.id } }).catch(() => undefined);
  }
  await db.jurisdictionPolicy.deleteMany({
    where: { policyVersion: { contains: stamp } },
  }).catch(() => undefined);
  await db.ledgerEntry.deleteMany({
    where: { reference: { contains: stamp } },
  }).catch(() => undefined);
  await db.$disconnect();
});

describe('Task 2 — Cross-Border Corridor Architecture & Fail-Closed Gating', () => {
  test('1. PK<->AF corridors are DISABLED by default in database', async () => {
    const afToPk = await evaluateJurisdiction({
      patientCountry: 'AF',
      doctorCountry: 'PK',
      type: 'TEXT',
    });
    expect(afToPk.allowed).toBe(false);
    expect(afToPk.reason).toBe('CROSS_BORDER_CORRIDOR_DISABLED_PENDING_APPROVAL');

    const pkToAf = await evaluateJurisdiction({
      patientCountry: 'PK',
      doctorCountry: 'AF',
      type: 'TEXT',
    });
    expect(pkToAf.allowed).toBe(false);
    expect(pkToAf.reason).toBe('CROSS_BORDER_CORRIDOR_DISABLED_PENDING_APPROVAL');
  });

  test('2. Ordinary environment variable alone CANNOT activate cross-border corridors', async () => {
    const origEnv = process.env.CARE_CROSS_BORDER_CORRIDOR_APPROVED;
    try {
      process.env.CARE_CROSS_BORDER_CORRIDOR_APPROVED = 'true';

      const res = await evaluateJurisdiction({
        patientCountry: 'AF',
        doctorCountry: 'PK',
        type: 'VIDEO',
      });
      // Must remain fail-closed because DB policy has consultationAllowed=false
      expect(res.allowed).toBe(false);
      expect(res.reason).toBe('CROSS_BORDER_CORRIDOR_DISABLED_PENDING_APPROVAL');
    } finally {
      process.env.CARE_CROSS_BORDER_CORRIDOR_APPROVED = origEnv;
    }
  });

  test('3. Cross-border policy without legal approval source is blocked', async () => {
    const policyVersion = `${stamp}-no-source`;
    await db.jurisdictionPolicy.create({
      data: {
        countryCode: 'AF',
        doctorCountry: 'PK',
        consultationAllowed: true,
        messagingAllowed: true,
        audioAllowed: true,
        videoAllowed: true,
        policyVersion,
        scope: 'CROSS_BORDER',
        legalApprovalSource: null, // Missing legal source
        humanApprovedById: 'admin-auditor-1',
        effectiveDate: new Date(Date.now() - 3600000),
      },
    });

    const res = await evaluateJurisdiction({
      patientCountry: 'AF',
      doctorCountry: 'PK',
      type: 'TEXT',
    });
    expect(res.allowed).toBe(false);
    expect(res.reason).toBe('LEGAL_APPROVAL_SOURCE_REQUIRED');

    await db.jurisdictionPolicy.deleteMany({ where: { policyVersion } });
  });

  test('4. Cross-border policy without human administrative activation is blocked', async () => {
    const policyVersion = `${stamp}-no-admin`;
    await db.jurisdictionPolicy.create({
      data: {
        countryCode: 'AF',
        doctorCountry: 'PK',
        consultationAllowed: true,
        messagingAllowed: true,
        audioAllowed: true,
        videoAllowed: true,
        policyVersion,
        scope: 'CROSS_BORDER',
        legalApprovalSource: 'MoPH-Directive-2026-CB',
        humanApprovedById: null, // Missing human admin approval
        effectiveDate: new Date(Date.now() - 3600000),
      },
    });

    const res = await evaluateJurisdiction({
      patientCountry: 'AF',
      doctorCountry: 'PK',
      type: 'TEXT',
    });
    expect(res.allowed).toBe(false);
    expect(res.reason).toBe('HUMAN_ADMIN_ACTIVATION_REQUIRED');

    await db.jurisdictionPolicy.deleteMany({ where: { policyVersion } });
  });

  test('5. Expired cross-border policy is blocked', async () => {
    const policyVersion = `${stamp}-expired`;
    await db.jurisdictionPolicy.create({
      data: {
        countryCode: 'AF',
        doctorCountry: 'PK',
        consultationAllowed: true,
        messagingAllowed: true,
        audioAllowed: true,
        videoAllowed: true,
        policyVersion,
        scope: 'CROSS_BORDER',
        legalApprovalSource: 'MoPH-Directive-2026-CB',
        humanApprovedById: 'admin-auditor-1',
        effectiveDate: new Date(Date.now() - 7200000),
        approvalExpiresAt: new Date(Date.now() - 3600000), // Expired 1 hour ago
      },
    });

    const res = await evaluateJurisdiction({
      patientCountry: 'AF',
      doctorCountry: 'PK',
      type: 'TEXT',
    });
    expect(res.allowed).toBe(false);
    expect(res.reason).toBe('POLICY_APPROVAL_EXPIRED');

    await db.jurisdictionPolicy.deleteMany({ where: { policyVersion } });
  });

  test('6. Doctor not authorized in patient jurisdiction is blocked even with active corridor policy', async () => {
    const policyVersion = `${stamp}-active-corridor`;
    await db.jurisdictionPolicy.create({
      data: {
        countryCode: 'AF',
        doctorCountry: 'PK',
        consultationAllowed: true,
        messagingAllowed: true,
        audioAllowed: true,
        videoAllowed: true,
        prescribingAllowed: false,
        policyVersion,
        scope: 'CROSS_BORDER',
        legalApprovalSource: 'Bilateral-Telehealth-Framework-2026',
        humanApprovedById: 'admin-super-auditor',
        effectiveDate: new Date(Date.now() - 3600000),
      },
    });

    // Create Pakistani doctor who only has PK jurisdiction, NOT AF jurisdiction
    const docUser = await db.user.create({
      data: {
        email: `${stamp}-doc-pk-only@aku.edu`,
        name: 'Dr Pakistani Specialist',
        role: 'doctor',
        accountStatus: 'active',
        passwordHash: 'dummy',
      },
    });
    const docProfile = await db.doctorProfile.create({
      data: {
        userId: docUser.id,
        pmdcNumber: `PK-LIC-${stamp.slice(-6)}`,
        specialty: 'Cardiology',
        facilityName: 'Aga Khan University Hospital',
        bio: 'Senior Consultant Cardiologist',
        country: 'PK',
        careStatus: 'ACTIVE',
        pmdcVerifiedAt: new Date(),
        pmdcVerifiedBy: 'admin-verif-1',
      },
    });
    await db.doctorJurisdiction.create({
      data: {
        doctorProfileId: docProfile.id,
        countryCode: 'PK',
        status: 'LICENSED',
        verifiedAt: new Date(),
        verifiedById: 'admin-verif-1',
      },
    });

    // Evaluation with doctorProfileId for patient in AF must fail because doctor lacks AF license
    const res = await evaluateJurisdiction({
      patientCountry: 'AF',
      doctorCountry: 'PK',
      type: 'TEXT',
      doctorProfileId: docProfile.id,
    });
    expect(res.allowed).toBe(false);
    expect(res.reason).toBe('DOCTOR_NOT_AUTHORIZED_FOR_PATIENT_JURISDICTION');

    // Now authorize the doctor for AF jurisdiction
    await db.doctorJurisdiction.create({
      data: {
        doctorProfileId: docProfile.id,
        countryCode: 'AF',
        status: 'LICENSED',
        verifiedAt: new Date(),
        verifiedById: 'admin-super-auditor',
      },
    });

    // Re-evaluate: Now doctor has explicit AF jurisdiction authorization
    const resAuthorized = await evaluateJurisdiction({
      patientCountry: 'AF',
      doctorCountry: 'PK',
      type: 'TEXT',
      doctorProfileId: docProfile.id,
    });
    expect(resAuthorized.allowed).toBe(true);
    expect(resAuthorized.reason).toBe('ALLOWED');
    expect(resAuthorized.prescribingAllowed).toBe(false); // Prescribing stays fail-closed

    await db.jurisdictionPolicy.deleteMany({ where: { policyVersion } });
  });
});

describe('Task 3 — Support Both Pakistani and Afghan Doctors', () => {
  test('1. Pakistani doctor with valid PM&DC credentials passes production eligibility', () => {
    const doc = {
      pmdcNumber: 'PMC-99882-P',
      pmdcVerifiedAt: new Date('2026-01-15'),
      pmdcVerifiedBy: 'admin-pmdc-auditor',
      country: 'PK',
      careStatus: 'ACTIVE',
      facilityName: 'Aga Khan University Hospital',
      bio: 'Consultant Cardiologist with 12 years experience',
      user: {
        email: 'dr.ali@aku.edu',
        name: 'Dr Ali Khan',
        accountStatus: 'active',
      },
      jurisdictions: [{ countryCode: 'PK', status: 'LICENSED' }],
    };

    const res = isDoctorProductionEligible(doc);
    expect(res.eligible).toBe(true);
    expect(res.reasons.length).toBe(0);
  });

  test('2. Pakistani doctor with negative criteria is rejected with specific reasons', () => {
    // Missing PM&DC number
    const noPmdc = {
      pmdcNumber: '',
      pmdcVerifiedAt: new Date('2026-01-15'),
      pmdcVerifiedBy: 'admin-1',
      country: 'PK',
      careStatus: 'ACTIVE',
      user: { email: 'dr.ali@hospital.pk', accountStatus: 'active' },
    };
    expect(isDoctorProductionEligible(noPmdc).eligible).toBe(false);
    expect(isDoctorProductionEligible(noPmdc).reasons).toContain('INVALID_OR_MISSING_LICENSE_NUMBER');

    // Unverified license
    const unverified = {
      pmdcNumber: 'PMC-12345-P',
      pmdcVerifiedAt: null,
      pmdcVerifiedBy: 'admin-1',
      country: 'PK',
      careStatus: 'ACTIVE',
      user: { email: 'dr.ali@hospital.pk', accountStatus: 'active' },
    };
    expect(isDoctorProductionEligible(unverified).eligible).toBe(false);
    expect(isDoctorProductionEligible(unverified).reasons).toContain('LICENSE_NOT_VERIFIED');

    // Unapproved (missing admin ID)
    const unapproved = {
      pmdcNumber: 'PMC-12345-P',
      pmdcVerifiedAt: new Date('2026-01-15'),
      pmdcVerifiedBy: null,
      country: 'PK',
      careStatus: 'ACTIVE',
      user: { email: 'dr.ali@hospital.pk', accountStatus: 'active' },
    };
    expect(isDoctorProductionEligible(unapproved).eligible).toBe(false);
    expect(isDoctorProductionEligible(unapproved).reasons).toContain('ADMIN_APPROVAL_REQUIRED');

    // Test profile prefix
    const testDoc = {
      pmdcNumber: 'TEST-PMC-12345',
      pmdcVerifiedAt: new Date('2026-01-15'),
      pmdcVerifiedBy: 'admin-1',
      country: 'PK',
      careStatus: 'ACTIVE',
      user: { email: 'dr.test@hospital.pk', accountStatus: 'active' },
    };
    expect(isDoctorProductionEligible(testDoc).eligible).toBe(false);
    expect(isDoctorProductionEligible(testDoc).reasons).toContain('TEST_PROFILE_NOT_ELIGIBLE');

    // Suspended account
    const suspended = {
      pmdcNumber: 'PMC-12345-P',
      pmdcVerifiedAt: new Date('2026-01-15'),
      pmdcVerifiedBy: 'admin-1',
      country: 'PK',
      careStatus: 'SUSPENDED',
      user: { email: 'dr.ali@hospital.pk', accountStatus: 'active' },
    };
    expect(isDoctorProductionEligible(suspended).eligible).toBe(false);
    expect(isDoctorProductionEligible(suspended).reasons).toContain('CARE_STATUS_NOT_ACTIVE');
  });

  test('3. Afghan doctor with valid MoPH credentials passes production eligibility without PM&DC', () => {
    const afDoc = {
      pmdcNumber: 'MOPH-KBL-7762', // Registered under Afghan registration format
      pmdcVerifiedAt: new Date('2026-02-10'),
      pmdcVerifiedBy: 'moph-admin-auditor',
      country: 'AF',
      careStatus: 'ACTIVE',
      facilityName: 'Jamhuriat Hospital Kabul',
      bio: 'Internal Medicine specialist in Kabul',
      user: {
        email: 'dr.ahmad@jamhuriat.af',
        name: 'Dr Ahmad Rahimi',
        accountStatus: 'active',
      },
      jurisdictions: [{ countryCode: 'AF', status: 'LICENSED' }],
      credentials: [
        {
          kind: 'MEDICAL_LICENSE',
          registrationNumber: 'MOPH-KBL-7762',
          issuingBody: 'Ministry of Public Health (MoPH)',
          country: 'AF',
          status: 'VERIFIED',
          verifiedAt: new Date('2026-02-10'),
          verifiedById: 'moph-admin-auditor',
        },
      ],
    };

    const res = isDoctorProductionEligible(afDoc);
    expect(res.eligible).toBe(true);
    expect(res.reasons.length).toBe(0);
  });

  test('4. Afghan doctor with negative criteria is rejected with specific reasons', () => {
    // Missing Afghan license number
    const noAfLic = {
      pmdcNumber: null,
      pmdcVerifiedAt: new Date('2026-02-10'),
      pmdcVerifiedBy: 'moph-admin',
      country: 'AF',
      careStatus: 'ACTIVE',
      user: { email: 'dr.kabul@hospital.af', accountStatus: 'active' },
    };
    expect(isDoctorProductionEligible(noAfLic).eligible).toBe(false);
    expect(isDoctorProductionEligible(noAfLic).reasons).toContain('INVALID_OR_MISSING_LICENSE_NUMBER');

    // Future verification date
    const futureDate = {
      pmdcNumber: 'MOPH-KBL-1234',
      pmdcVerifiedAt: new Date(Date.now() + 86400000),
      pmdcVerifiedBy: 'moph-admin',
      country: 'AF',
      careStatus: 'ACTIVE',
      user: { email: 'dr.kabul@hospital.af', accountStatus: 'active' },
    };
    expect(isDoctorProductionEligible(futureDate).eligible).toBe(false);
    expect(isDoctorProductionEligible(futureDate).reasons).toContain('INVALID_LICENSE_VERIFICATION_DATE');

    // Test profile
    const afTestDoc = {
      pmdcNumber: 'MOCK-MOPH-9988',
      pmdcVerifiedAt: new Date('2026-02-10'),
      pmdcVerifiedBy: 'moph-admin',
      country: 'AF',
      careStatus: 'ACTIVE',
      user: { email: 'mock-doc@kabul.af', accountStatus: 'active' },
    };
    expect(isDoctorProductionEligible(afTestDoc).eligible).toBe(false);
    expect(isDoctorProductionEligible(afTestDoc).reasons).toContain('TEST_PROFILE_NOT_ELIGIBLE');

    // Revoked jurisdiction
    const revokedDoc = {
      pmdcNumber: 'MOPH-KBL-1234',
      pmdcVerifiedAt: new Date('2026-02-10'),
      pmdcVerifiedBy: 'moph-admin',
      country: 'AF',
      careStatus: 'ACTIVE',
      user: { email: 'dr.kabul@hospital.af', accountStatus: 'active' },
      jurisdictions: [{ countryCode: 'AF', status: 'REVOKED' }],
    };
    expect(isDoctorProductionEligible(revokedDoc).eligible).toBe(false);
    expect(isDoctorProductionEligible(revokedDoc).reasons).toContain('JURISDICTION_REVOKED');
  });

  test('5. Afghan doctor with null pmdcVerifiedAt and verified DoctorCredential is discovered in marketplace and booked in consultation', async () => {
    const afDocUser = await db.user.create({
      data: {
        email: `${stamp}-af-doc@jamhuriat.af`,
        name: 'Dr Mohammad Afghan',
        role: 'doctor',
        accountStatus: 'active',
        passwordHash: 'dummy',
      },
    });

    const afDocProfile = await db.doctorProfile.create({
      data: {
        userId: afDocUser.id,
        pmdcNumber: `MOPH-${stamp.slice(-6)}`,
        pmdcVerifiedAt: null, // No PM&DC verification timestamp
        pmdcVerifiedBy: null,
        country: 'AF',
        careStatus: 'ACTIVE',
        specialty: 'Internal Medicine',
        facilityName: 'Jamhuriat Hospital Kabul',
        facilityCity: 'Kabul',
        consultationFee: 50000,
        services: {
          create: {
            type: 'TEXT',
            priceMinor: 50000,
            currency: 'AFN',
            durationMinutes: 30,
            enabled: true,
          },
        },
        credentials: {
          create: {
            kind: 'MEDICAL_LICENSE',
            registrationNumber: `AF-LIC-${stamp.slice(-6)}`,
            issuingBody: 'Ministry of Public Health (MoPH)',
            country: 'AF',
            status: 'VERIFIED',
            verifiedAt: new Date('2026-02-01'),
            verifiedById: 'admin-af-compliance',
            expiresAt: new Date('2028-02-01'),
          },
        },
      },
      include: { credentials: true, user: true },
    });

    // 1. isDoctorProductionEligible passes with credential verification alone
    const elig = isDoctorProductionEligible(afDocProfile);
    expect(elig.eligible).toBe(true);

    // 2. Marketplace listings include this Afghan doctor and verify authority-neutral licenseVerified=true while pmdcVerified=false
    const marketDocs = await listMarketplaceDoctors({
      country: 'AF',
      specialty: 'Internal Medicine',
    });
    const foundDoc = marketDocs.find((d) => d.doctorProfileId === afDocProfile.id);
    expect(foundDoc).toBeDefined();
    expect(foundDoc?.pmdcVerified).toBe(false);
    expect(foundDoc?.licenseVerified).toBe(true);
    expect(foundDoc?.licensingAuthority).toContain('MoPH');

    // 3. createConsultation succeeds for this Afghan doctor on domestic AF corridor
    const res = await createConsultation({
      patientId: testPatientId,
      doctorProfileId: afDocProfile.id,
      type: 'TEXT',
      patientCountry: 'AF',
    });
    expect(res.consultation.id).toBeDefined();
    expect(res.consultation.doctorProfileId).toBe(afDocProfile.id);
    expect(res.consultation.status).toBe('PAYMENT_PENDING');
    expect(res.jurisdiction.allowed).toBe(true);

    // 4. Foreign practice rights blocked: Afghan doctor cannot treat Pakistani patient without corridor policy
    await expect(
      createConsultation({
        patientId: testPatientId,
        doctorProfileId: afDocProfile.id,
        type: 'TEXT',
        patientCountry: 'PK',
      })
    ).rejects.toThrow('JURISDICTION_BLOCKED');

    // 5. Pakistani doctor without PM&DC verification is not production eligible in PK
    const unverifiedPkDoc = {
      ...afDocProfile,
      country: 'PK',
      pmdcNumber: null,
      pmdcVerifiedAt: null,
      pmdcVerifiedBy: null,
    };
    const pkElig = isDoctorProductionEligible(unverifiedPkDoc);
    expect(pkElig.eligible).toBe(false);
    expect(pkElig.reasons).toContain('LICENSE_NOT_VERIFIED');

    // 6. Afghan doctor with null license number is rejected with INVALID_OR_MISSING_LICENSE_NUMBER
    const afDocNoLic = {
      ...afDocProfile,
      pmdcNumber: null,
      credentials: [],
    };
    const afElig = isDoctorProductionEligible(afDocNoLic);
    expect(afElig.eligible).toBe(false);
    expect(afElig.reasons).toContain('INVALID_OR_MISSING_LICENSE_NUMBER');
  });
});

describe('Task 5 — Post-Payout Financial Risk, Debt Tracking & Loss Allocation', () => {
  async function setupFundedDoctor(tag: string, amountMinor = 200000) {
    const docUser = await db.user.create({
      data: {
        email: `${stamp}-${tag}-doc@test.local`,
        name: `Dr ${tag} Payout`,
        role: 'doctor',
        accountStatus: 'active',
        passwordHash: 'dummy',
      },
    });
    const docProfile = await db.doctorProfile.create({
      data: {
        userId: docUser.id,
        pmdcNumber: `FIN-${tag.toUpperCase()}-${stamp.slice(-6)}`,
        specialty: 'Internal Medicine',
        country: 'PK',
        careStatus: 'ACTIVE',
        pmdcVerifiedAt: new Date(),
        pmdcVerifiedBy: 'admin-verif',
        payoutMethod: JSON.stringify({ type: 'bank_account', label: 'Meezan Bank', last4: '1234' }),
      },
    });

    const c = await db.consultation.create({
      data: {
        patientId: testPatientId,
        doctorProfileId: docProfile.id,
        doctorUserId: docUser.id,
        type: 'TEXT',
        status: 'COMPLETED',
        priceMinor: amountMinor,
        currency: 'PKR',
      },
    });

    const docFee = Math.round(amountMinor * 0.8);
    const platFee = amountMinor - docFee;

    const payment = await db.payment.create({
      data: {
        consultationId: c.id,
        patientId: testPatientId,
        provider: 'mock',
        status: 'PAID',
        amountMinor,
        currency: 'PKR',
        breakdownJson: JSON.stringify({ doctorFeeMinor: docFee, platformFeeMinor: platFee }),
        idempotencyKey: `${stamp}-${tag}-pay`,
      },
    });

    await db.doctorEarning.create({
      data: {
        doctorProfileId: docProfile.id,
        consultationId: c.id,
        grossMinor: amountMinor,
        commissionMinor: platFee,
        netMinor: docFee,
        currency: 'PKR',
        state: 'AVAILABLE',
        availableAt: new Date(Date.now() - 3600000),
      },
    });

    await postTransaction({
      reference: `${stamp}-${tag}-init`,
      idempotencyKey: `${stamp}-${tag}-init`,
      consultationId: c.id,
      paymentId: payment.id,
      legs: [
        { accountKind: 'PLATFORM_CASH', direction: 'DEBIT', amountMinor, currency: 'PKR' },
        { accountKind: 'DOCTOR_AVAILABLE', ownerDoctorProfileId: docProfile.id, direction: 'CREDIT', amountMinor: docFee, currency: 'PKR' },
        { accountKind: 'PLATFORM_FEE', direction: 'CREDIT', amountMinor: platFee, currency: 'PKR' },
      ],
    });

    return { docUser, docProfile, consultation: c, payment, docFee, platFee };
  }

  test('1. Doctor with insufficient available balance during post-payout refund gets negative balance', async () => {
    const { docUser, docProfile, consultation, docFee } = await setupFundedDoctor('insuff-bal', 100000);

    // Doctor cashes out entire available balance
    const payout = await requestPayout({
      doctorProfileId: docProfile.id,
      doctorUserId: docUser.id,
      currency: 'PKR',
    });
    await processPayout({ payoutId: payout.id });

    // Balance is now 0
    let wallet = await doctorWallet(docProfile.id, 'PKR');
    expect(wallet.availableMinor).toBe(0);

    // Patient requests refund post-payout
    const refundRes = await requestRefund({
      consultationId: consultation.id,
      actorId: testPatientId,
      actorRole: 'SUPPORT',
      reason: 'technical_failure',
    });
    expect(refundRes.refund.state).toBe('REFUNDED');

    // Doctor available balance is now negative (-docFee)
    wallet = await doctorWallet(docProfile.id, 'PKR');
    expect(wallet.availableMinor).toBe(-docFee);

    // Receivable query reflects the deficit
    const rec = await getDoctorReceivableBalance(docProfile.id, 'PKR');
    expect(rec.hasDeficit).toBe(true);
    expect(rec.receivableMinor).toBe(docFee);
  });

  test('2. Doctor who stops using marketplace: receivable is tracked and payouts blocked', async () => {
    const { docUser, docProfile, consultation, docFee } = await setupFundedDoctor('inactive-doc', 150000);

    // Cash out
    const payout = await requestPayout({ doctorProfileId: docProfile.id, doctorUserId: docUser.id, currency: 'PKR' });
    await processPayout({ payoutId: payout.id });

    // Clawback creates debt
    await requestRefund({
      consultationId: consultation.id,
      actorId: testPatientId,
      actorRole: 'SUPPORT',
      reason: 'technical_failure',
    });

    // Inactive doctor never takes another consultation. Payout must be blocked with NOTHING_AVAILABLE
    await expect(
      requestPayout({ doctorProfileId: docProfile.id, doctorUserId: docUser.id, currency: 'PKR' })
    ).rejects.toThrow('NOTHING_AVAILABLE');

    // System accurately tracks the receivable
    const deficitInfo = await getDoctorReceivableBalance(docProfile.id, 'PKR');
    expect(deficitInfo.hasDeficit).toBe(true);
    expect(deficitInfo.receivableMinor).toBe(docFee);
  });

  test('3. Chargebacks after completed bank settlement: ledger remains balanced and clawback debited', async () => {
    const { docUser, docProfile, payment, docFee, platFee } = await setupFundedDoctor('cb-settled', 200000);

    // Payout requested & bank transfer completed (settled)
    const payout = await requestPayout({ doctorProfileId: docProfile.id, doctorUserId: docUser.id, currency: 'PKR' });
    await processPayout({ payoutId: payout.id });

    // Payment processor sends chargeback after settlement
    const cbRes = await processChargeback({
      paymentId: payment.id,
      reason: 'chargeback_after_settlement',
      actorRole: 'FINANCE',
    });
    expect(cbRes.success).toBe(true);

    // Doctor wallet is now negative (-docFee)
    const wallet = await doctorWallet(docProfile.id, 'PKR');
    expect(wallet.availableMinor).toBe(-docFee);

    // Verify double-entry ledger balance on chargeback reference
    const cbEntries = await db.ledgerEntry.findMany({ where: { reference: `chargeback:${payment.id}` } });
    const debits = cbEntries.filter((e) => e.direction === 'DEBIT').reduce((s, e) => s + e.amountMinor, 0);
    const credits = cbEntries.filter((e) => e.direction === 'CREDIT').reduce((s, e) => s + e.amountMinor, 0);
    expect(debits).toBe(credits);
    expect(debits).toBe(200000); // docFee (160000) + platFee (40000) = 200000
  });

  test('4. Platform loss allocation: clears abandoned doctor receivable deficit with balanced ledger', async () => {
    const { docUser, docProfile, consultation, docFee } = await setupFundedDoctor('loss-alloc', 100000);

    // Payout and clawback creates deficit
    const payout = await requestPayout({ doctorProfileId: docProfile.id, doctorUserId: docUser.id, currency: 'PKR' });
    await processPayout({ payoutId: payout.id });
    await requestRefund({ consultationId: consultation.id, actorId: testPatientId, actorRole: 'SUPPORT', reason: 'technical_failure' });

    let rec = await getDoctorReceivableBalance(docProfile.id, 'PKR');
    expect(rec.hasDeficit).toBe(true);
    expect(rec.receivableMinor).toBe(docFee);

    // Finance writes off the uncollectible receivable to platform loss
    const lossRes = await allocatePlatformLoss({
      doctorProfileId: docProfile.id,
      currency: 'PKR',
      reason: 'doctor_abandoned_platform_uncollectible',
      actorRole: 'FINANCE',
    });
    expect(lossRes.success).toBe(true);
    expect(lossRes.allocatedMinor).toBe(docFee);
    expect(lossRes.newAvailableMinor).toBe(0);

    // Wallet is restored to 0
    const wallet = await doctorWallet(docProfile.id, 'PKR');
    expect(wallet.availableMinor).toBe(0);

    // Receivable query is now zero
    rec = await getDoctorReceivableBalance(docProfile.id, 'PKR');
    expect(rec.hasDeficit).toBe(false);
    expect(rec.receivableMinor).toBe(0);

    // Verify loss allocation ledger entries balanced
    const lossEntries = await db.ledgerEntry.findMany({
      where: { reference: lossRes.transactionReference },
      include: { account: true },
    });
    const debits = lossEntries.filter((e) => e.direction === 'DEBIT').reduce((s, e) => s + e.amountMinor, 0);
    const credits = lossEntries.filter((e) => e.direction === 'CREDIT').reduce((s, e) => s + e.amountMinor, 0);
    expect(debits).toBe(credits);
    expect(debits).toBe(docFee);

    // Verify bad debt / platform loss write-off expense account debited (NOT platform fee revenue)
    const debitLeg = lossEntries.find((e) => e.direction === 'DEBIT');
    expect(debitLeg?.account.kind).toBe('PLATFORM_LOSS');
    expect(debitLeg?.account.code).toBe('platform:loss:PKR');
  });

  test('5. No duplicate recovery: cannot allocate loss when no deficit exists', async () => {
    const { docProfile } = await setupFundedDoctor('no-dup', 100000);

    // Doctor has positive balance (no deficit)
    await expect(
      allocatePlatformLoss({
        doctorProfileId: docProfile.id,
        currency: 'PKR',
        reason: 'premature_allocation',
      })
    ).rejects.toThrow('NO_RECEIVABLE_TO_ALLOCATE');
  });

  test('6. Doctor payout reserve policies: pending delay prevents payout before dispute window', async () => {
    const { docProfile } = await setupFundedDoctor('reserve-hold', 100000);

    // Create a second consultation for the reserve holding test
    const cHold = await db.consultation.create({
      data: {
        patientId: testPatientId,
        doctorProfileId: docProfile.id,
        doctorUserId: docProfile.userId,
        type: 'TEXT',
        status: 'COMPLETED',
        priceMinor: 100000,
        currency: 'PKR',
      },
    });

    const pHold = await db.payment.create({
      data: {
        consultationId: cHold.id,
        patientId: testPatientId,
        provider: 'mock',
        status: 'PAID',
        amountMinor: 100000,
        currency: 'PKR',
        breakdownJson: JSON.stringify({ doctorFeeMinor: 80000, platformFeeMinor: 20000 }),
        idempotencyKey: `${stamp}-hold-pay`,
      },
    });

    await db.doctorEarning.create({
      data: {
        doctorProfileId: docProfile.id,
        consultationId: cHold.id,
        grossMinor: 100000,
        commissionMinor: 20000,
        netMinor: 80000,
        currency: 'PKR',
        state: 'PENDING',
        availableAt: new Date(Date.now() + 72 * 3600000), // 72-hour reserve window
      },
    });

    await postTransaction({
      reference: `${stamp}-reserve-hold`,
      idempotencyKey: `${stamp}-reserve-hold`,
      consultationId: cHold.id,
      paymentId: pHold.id,
      legs: [
        { accountKind: 'PLATFORM_CASH', direction: 'DEBIT', amountMinor: 100000, currency: 'PKR' },
        { accountKind: 'DOCTOR_PENDING', ownerDoctorProfileId: docProfile.id, direction: 'CREDIT', amountMinor: 80000, currency: 'PKR' },
        { accountKind: 'PLATFORM_FEE', direction: 'CREDIT', amountMinor: 20000, currency: 'PKR' },
      ],
    });

    // Earnings promotion must NOT promote funds inside holding delay
    const promoted = await promoteDueEarnings();
    expect(promoted).toBe(0);

    // Doctor wallet reflects funds held in pending reserve
    const wallet = await doctorWallet(docProfile.id, 'PKR');
    expect(wallet.pendingMinor).toBeGreaterThanOrEqual(80000);
  });

  test('7. Concurrency protection: concurrent allocatePlatformLoss calls serialize and prevent double write-off', async () => {
    const { docUser, docProfile, consultation, docFee } = await setupFundedDoctor('race-loss', 100000);

    // Payout and refund creates deficit
    const payout = await requestPayout({ doctorProfileId: docProfile.id, doctorUserId: docUser.id, currency: 'PKR' });
    await processPayout({ payoutId: payout.id });
    await requestRefund({ consultationId: consultation.id, actorId: testPatientId, actorRole: 'SUPPORT', reason: 'technical_failure' });

    const rec = await getDoctorReceivableBalance(docProfile.id, 'PKR');
    expect(rec.hasDeficit).toBe(true);
    expect(rec.receivableMinor).toBe(docFee);

    // Concurrently fire two write-off requests for the full deficit
    const [res1, res2] = await Promise.allSettled([
      allocatePlatformLoss({
        doctorProfileId: docProfile.id,
        currency: 'PKR',
        reason: 'concurrent_claim_attempt_1',
        actorRole: 'FINANCE',
      }),
      allocatePlatformLoss({
        doctorProfileId: docProfile.id,
        currency: 'PKR',
        reason: 'concurrent_claim_attempt_2',
        actorRole: 'FINANCE',
      }),
    ]);

    // Exactly one must succeed and one must be rejected with NO_RECEIVABLE_TO_ALLOCATE
    const successes = [res1, res2].filter((r) => r.status === 'fulfilled');
    const rejections = [res1, res2].filter((r) => r.status === 'rejected');
    expect(successes.length).toBe(1);
    expect(rejections.length).toBe(1);

    const rejReason = (rejections[0] as PromiseRejectedResult).reason;
    expect(rejReason?.message).toContain('NO_RECEIVABLE_TO_ALLOCATE');

    // Doctor available balance must be exactly 0 (no over-crediting / double write-off)
    const wallet = await doctorWallet(docProfile.id, 'PKR');
    expect(wallet.availableMinor).toBe(0);

    const afterRec = await getDoctorReceivableBalance(docProfile.id, 'PKR');
    expect(afterRec.hasDeficit).toBe(false);
    expect(afterRec.receivableMinor).toBe(0);
  });

  test('8. Global mathematical zero-imbalance ledger invariant preserved across suite', async () => {
    const allEntries = await db.ledgerEntry.findMany({
      where: { reference: { contains: stamp } },
    });
    const debitsByCcy: Record<string, number> = {};
    const creditsByCcy: Record<string, number> = {};

    for (const e of allEntries) {
      if (e.direction === 'DEBIT') {
        debitsByCcy[e.currency] = (debitsByCcy[e.currency] ?? 0) + e.amountMinor;
      } else {
        creditsByCcy[e.currency] = (creditsByCcy[e.currency] ?? 0) + e.amountMinor;
      }
    }

    for (const ccy of Object.keys(debitsByCcy)) {
      expect(debitsByCcy[ccy]).toBe(creditsByCcy[ccy]);
    }
  });
});
