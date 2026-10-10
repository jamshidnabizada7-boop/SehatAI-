// tests/security/staging-adversarial-challenger3.test.ts
// Challenger 3 Independent Adversarial Stress-Test Suite
// Run via: bun test tests/security/staging-adversarial-challenger3.test.ts

import { describe, expect, test } from 'bun:test';
import fs from 'node:fs';
import path from 'node:path';
import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { isTestDoctorProfile } from '../../src/server/care/marketplace';
import { proxy, middleware } from '../../src/proxy';
import { verifySyntheticDatabase } from '../../scripts/verify-synthetic-db';

describe('Challenger 3 Adversarial Challenge 1: isTestDoctorProfile Precision & Bypass Resistance', () => {
  test('Detects synthetic doctor profiles regardless of casing or formatting', () => {
    // Variations of SYNTH in PMDC license
    expect(isTestDoctorProfile({ pmdcNumber: 'PMDC-SYNTH-001' })).toBe(true);
    expect(isTestDoctorProfile({ pmdcNumber: 'pmdc-synth-001' })).toBe(true);
    expect(isTestDoctorProfile({ pmdcNumber: 'SYNTH-999-PK' })).toBe(true);
    expect(isTestDoctorProfile({ pmdcNumber: 'PMC-SYNTH' })).toBe(true);

    // Variations of @sehatai.local in User.email
    expect(isTestDoctorProfile({ user: { email: 'dr.ayesha@sehatai.local' } })).toBe(true);
    expect(isTestDoctorProfile({ user: { email: 'DR.AYESHA@SEHATAI.LOCAL' } })).toBe(true);
    expect(isTestDoctorProfile({ user: { email: 'test.doctor@sehatai.local' } })).toBe(true);
  });

  test('Rejects spoofing attempts trying to disguise as synthetic or real', () => {
    // Suffix domain spoofing: should NOT match @sehatai.local
    expect(
      isTestDoctorProfile({
        pmdcNumber: '12345-P',
        user: { email: 'attacker@sehatai.local.evil.com', name: 'Dr. Fake' },
      })
    ).toBe(false);

    expect(
      isTestDoctorProfile({
        pmdcNumber: '12345-P',
        user: { email: 'attacker@notsehatai.local', name: 'Dr. Fake' },
      })
    ).toBe(false);

    // Legitimate production clinician must NOT be classified as test fixture
    expect(
      isTestDoctorProfile({
        pmdcNumber: '98765-N',
        user: { email: 'dr.tariq@shifa.com.pk', name: 'Dr. Tariq Mahmood' },
        facilityName: 'Shifa International Hospital',
      })
    ).toBe(false);
  });

  test('Handles null, undefined, and empty objects without crashing', () => {
    expect(isTestDoctorProfile({})).toBe(false);
    expect(isTestDoctorProfile({ pmdcNumber: null, user: null })).toBe(false);
    expect(isTestDoctorProfile({ pmdcNumber: undefined, user: { email: undefined, name: undefined } })).toBe(false);
  });
});

describe('Challenger 3 Adversarial Challenge 2: Middleware Defensive Guard Invariants', () => {
  test('STAGING_BLOCK_BOOKING blocks booking POST requests, allows GET requests', async () => {
    const orig = process.env.STAGING_BLOCK_BOOKING;
    try {
      process.env.STAGING_BLOCK_BOOKING = 'true';

      // POST /api/appointments must be blocked with 403
      const postApt = new NextRequest('http://localhost:4000/api/appointments', { method: 'POST' });
      const resApt = middleware(postApt);
      expect(resApt.status).toBe(403);
      const dataApt = await resApt.json();
      expect(dataApt.error).toBe('BOOKING_HARD_BLOCKED_IN_STAGING');

      // POST /api/care/consultations must be blocked with 403
      const postCons = new NextRequest('http://localhost:4000/api/care/consultations', { method: 'POST' });
      const resCons = middleware(postCons);
      expect(resCons.status).toBe(403);
      const dataCons = await resCons.json();
      expect(dataCons.error).toBe('BOOKING_HARD_BLOCKED_IN_STAGING');

      // GET /api/care/consultations should pass middleware
      const getCons = new NextRequest('http://localhost:4000/api/care/consultations', { method: 'GET' });
      const resGet = middleware(getCons);
      expect(resGet.status).toBe(200);
    } finally {
      if (orig !== undefined) process.env.STAGING_BLOCK_BOOKING = orig;
      else delete process.env.STAGING_BLOCK_BOOKING;
    }
  });

  test('STAGING_BLOCK_UPLOADS blocks doctor uploads, vlm-analyze, and attachments', async () => {
    const orig = process.env.STAGING_BLOCK_UPLOADS;
    try {
      process.env.STAGING_BLOCK_UPLOADS = 'true';

      // POST /api/doctor/upload-doc -> 403
      const reqDoc = new NextRequest('http://localhost:4000/api/doctor/upload-doc', { method: 'POST' });
      const resDoc = middleware(reqDoc);
      expect(resDoc.status).toBe(403);
      const dataDoc = await resDoc.json();
      expect(dataDoc.error).toBe('PHI_UPLOADS_HARD_BLOCKED_IN_STAGING');

      // POST /api/vlm-analyze -> 403
      const reqVlm = new NextRequest('http://localhost:4000/api/vlm-analyze', { method: 'POST' });
      const resVlm = middleware(reqVlm);
      expect(resVlm.status).toBe(403);
      const dataVlm = await resVlm.json();
      expect(dataVlm.error).toBe('PHI_UPLOADS_HARD_BLOCKED_IN_STAGING');

      // POST /api/care/consultations/c-uuid-999/attachments -> 403
      const reqAtt = new NextRequest('http://localhost:4000/api/care/consultations/c-uuid-999/attachments', { method: 'POST' });
      const resAtt = middleware(reqAtt);
      expect(resAtt.status).toBe(403);
      const dataAtt = await resAtt.json();
      expect(dataAtt.error).toBe('PHI_UPLOADS_HARD_BLOCKED_IN_STAGING');

      // Non-upload POST routes are unaffected
      const reqOther = new NextRequest('http://localhost:4000/api/chat', { method: 'POST' });
      const resOther = middleware(reqOther);
      expect(resOther.status).toBe(200);
    } finally {
      if (orig !== undefined) process.env.STAGING_BLOCK_UPLOADS = orig;
      else delete process.env.STAGING_BLOCK_UPLOADS;
    }
  });

  test('STAGING_BLOCK_PAYMENTS blocks payment ingress routes', async () => {
    const orig = process.env.STAGING_BLOCK_PAYMENTS;
    try {
      process.env.STAGING_BLOCK_PAYMENTS = 'true';

      const paymentRoutes = [
        'http://localhost:4000/api/care/payments',
        'http://localhost:4000/api/care/checkout/start',
        'http://localhost:4000/api/care/refunds',
        'http://localhost:4000/api/doctor/care/payouts',
      ];

      for (const route of paymentRoutes) {
        const req = new NextRequest(route, { method: 'POST' });
        const res = middleware(req);
        expect(res.status).toBe(403);
        const data = await res.json();
        expect(data.error).toBe('PAYMENTS_HARD_BLOCKED_IN_STAGING');
      }
    } finally {
      if (orig !== undefined) process.env.STAGING_BLOCK_PAYMENTS = orig;
      else delete process.env.STAGING_BLOCK_PAYMENTS;
    }
  });
});

describe('Challenger 3 Adversarial Challenge 3: verifySyntheticDatabase Precision & Boundary Conditions', () => {
  const origPay = process.env.CARE_PAYMENTS_ENABLED;
  const origMock = process.env.CARE_ALLOW_MOCK_PAYMENTS;

  test('Valid synthetic mock client passes all checks without error', async () => {
    delete process.env.CARE_PAYMENTS_ENABLED;
    delete process.env.CARE_ALLOW_MOCK_PAYMENTS;

    const cleanMock = {
      user: {
        findMany: async () => [
          { id: 'u1', email: 'dr.ayesha@sehatai.local' },
          { id: 'u2', email: 'test.patient@example.com' },
          { id: 'u3', email: 'qa@test.local' },
        ],
      },
      doctorProfile: {
        findMany: async () => [
          { id: 'd1', pmdcNumber: 'PMDC-SYNTH-001' },
          { id: 'd2', pmdcNumber: '00000-0000000-0' }, // Mock CNIC starting with 00000 allowed
        ],
      },
      doctorVerificationDoc: {
        findMany: async () => [
          { id: 'v1', docType: 'pmdc_certificate', fileName: 'sample.pdf', fileUrl: '/uploads/sample.pdf', notes: 'mock doc' },
        ],
      },
    } as unknown as PrismaClient;

    const result = await verifySyntheticDatabase(cleanMock);
    expect(result.usersChecked).toBe(3);
    expect(result.doctorsChecked).toBe(2);
    expect(result.docsChecked).toBe(1);

    if (origPay !== undefined) process.env.CARE_PAYMENTS_ENABLED = origPay;
    if (origMock !== undefined) process.env.CARE_ALLOW_MOCK_PAYMENTS = origMock;
  });

  test('Catches real unhyphenated 13-digit CNIC in PMDC number or Verification Docs', async () => {
    delete process.env.CARE_PAYMENTS_ENABLED;
    delete process.env.CARE_ALLOW_MOCK_PAYMENTS;

    // Real CNIC in DoctorProfile.pmdcNumber
    const badPmdcMock = {
      user: { findMany: async () => [{ id: 'u1', email: 'dr.test@sehatai.local' }] },
      doctorProfile: { findMany: async () => [{ id: 'd1', pmdcNumber: '3520112345671' }] },
      doctorVerificationDoc: { findMany: async () => [] },
    } as unknown as PrismaClient;

    await expect(verifySyntheticDatabase(badPmdcMock)).rejects.toThrow(/PII VIOLATION/);

    // Real hyphenated CNIC in DoctorVerificationDoc.notes
    const badNotesMock = {
      user: { findMany: async () => [{ id: 'u1', email: 'dr.test@sehatai.local' }] },
      doctorProfile: { findMany: async () => [{ id: 'd1', pmdcNumber: 'PMDC-SYNTH-001' }] },
      doctorVerificationDoc: {
        findMany: async () => [
          { id: 'v1', docType: 'cnic', fileName: 'doc.pdf', fileUrl: '/doc.pdf', notes: 'Patient CNIC is 61101-1234567-3 verified' },
        ],
      },
    } as unknown as PrismaClient;

    await expect(verifySyntheticDatabase(badNotesMock)).rejects.toThrow(/PII VIOLATION/);

    if (origPay !== undefined) process.env.CARE_PAYMENTS_ENABLED = origPay;
    if (origMock !== undefined) process.env.CARE_ALLOW_MOCK_PAYMENTS = origMock;
  });

  test('Fails immediately if CARE_PAYMENTS_ENABLED=true', async () => {
    process.env.CARE_PAYMENTS_ENABLED = 'true';
    delete process.env.CARE_ALLOW_MOCK_PAYMENTS;

    const emptyMock = {
      user: { findMany: async () => [] },
      doctorProfile: { findMany: async () => [] },
      doctorVerificationDoc: { findMany: async () => [] },
    } as unknown as PrismaClient;

    await expect(verifySyntheticDatabase(emptyMock)).rejects.toThrow(/SECURITY VIOLATION/);

    if (origPay !== undefined) process.env.CARE_PAYMENTS_ENABLED = origPay;
    else delete process.env.CARE_PAYMENTS_ENABLED;
  });
});

describe('Challenger 3 Adversarial Challenge 4: Prisma ARM64 Engine Artifacts & Schema Compatibility', () => {
  test('Prisma schema contains binaryTargets with linux-arm64-openssl-3.0.x and native', () => {
    const schema = fs.readFileSync(path.join(process.cwd(), 'prisma', 'schema.prisma'), 'utf-8');
    expect(schema).toMatch(/binaryTargets\s*=\s*\[.*"linux-arm64-openssl-3\.0\.x".*\]/);
    expect(schema).toMatch(/binaryTargets\s*=\s*\[.*"native".*\]/);
  });

  test('libquery_engine-linux-arm64-openssl-3.0.x.so.node exists on disk in node_modules/.prisma/client', () => {
    const enginePath = path.join(process.cwd(), 'node_modules', '.prisma', 'client', 'libquery_engine-linux-arm64-openssl-3.0.x.so.node');
    expect(fs.existsSync(enginePath)).toBe(true);
    const stat = fs.statSync(enginePath);
    expect(stat.size).toBeGreaterThan(10000000); // ~15 MB
  });
});

describe('Challenger 3 Adversarial Challenge 5: In-Depth Server-Side Defense & Private Tester Access', () => {
  test('Private staging access control gates unauthorized visitors with 401', async () => {
    const origSecret = process.env.STAGING_ACCESS_SECRET;
    const origAuth = process.env.STAGING_AUTH_REQUIRED;

    try {
      process.env.STAGING_ACCESS_SECRET = 'tester-token-xyz-123';
      process.env.STAGING_AUTH_REQUIRED = 'true';

      // 1. Unauthorized request to protected app route -> 401
      const reqUnauth = new NextRequest('http://localhost:4000/care');
      const resUnauth = middleware(reqUnauth);
      expect(resUnauth.status).toBe(401);
      const dataUnauth = await resUnauth.json();
      expect(dataUnauth.error).toBe('STAGING_ACCESS_DENIED');

      // 2. Health check remains open -> 200
      const reqHealth = new NextRequest('http://localhost:4000/api/care/health');
      const resHealth = middleware(reqHealth);
      expect(resHealth.status).toBe(200);

      // 3. Authorized via x-staging-access-key header -> 200
      const reqHeader = new NextRequest('http://localhost:4000/care', {
        headers: { 'x-staging-access-key': 'tester-token-xyz-123' },
      });
      const resHeader = middleware(reqHeader);
      expect(resHeader.status).toBe(200);

      // 4. Authorized via cookie -> 200
      const reqCookie = new NextRequest('http://localhost:4000/care', {
        headers: { cookie: 'sehatai_staging_key=tester-token-xyz-123' },
      });
      const resCookie = middleware(reqCookie);
      expect(resCookie.status).toBe(200);

      // 5. Query parameter authentication is STRICTLY REJECTED -> 401 (no secrets in URL)
      const reqQuery = new NextRequest('http://localhost:4000/care?staging_key=tester-token-xyz-123');
      const resQuery = middleware(reqQuery);
      expect(resQuery.status).toBe(401);
      const dataQuery = await resQuery.json();
      expect(dataQuery.error).toBe('STAGING_ACCESS_DENIED');

      // 6. Unlock route /api/staging/unlock and UI /staging/unlock are exempt from 401 gate
      const reqUnlock = new NextRequest('http://localhost:4000/api/staging/unlock', { method: 'POST' });
      const resUnlock = middleware(reqUnlock);
      expect(resUnlock.status).toBe(200);

      const reqUnlockUI = new NextRequest('http://localhost:4000/staging/unlock');
      const resUnlockUI = middleware(reqUnlockUI);
      expect(resUnlockUI.status).toBe(200);

      // 7. Global query parameter rejection even on exempt routes
      const reqHealthWithQuery = new NextRequest('http://localhost:4000/api/care/health?staging_key=secret');
      const resHealthWithQuery = middleware(reqHealthWithQuery);
      expect(resHealthWithQuery.status).toBe(401);

      // 8. Fail-closed: if STAGING_AUTH_REQUIRED=true but STAGING_ACCESS_SECRET is missing
      delete process.env.STAGING_ACCESS_SECRET;
      const reqFailClosed = new NextRequest('http://localhost:4000/care');
      const resFailClosed = middleware(reqFailClosed);
      expect(resFailClosed.status).toBe(500);
      const dataFailClosed = await resFailClosed.json();
      expect(dataFailClosed.error).toBe('STAGING_AUTH_MISCONFIGURED');
    } finally {
      if (origSecret !== undefined) process.env.STAGING_ACCESS_SECRET = origSecret;
      else delete process.env.STAGING_ACCESS_SECRET;
      if (origAuth !== undefined) process.env.STAGING_AUTH_REQUIRED = origAuth;
      else delete process.env.STAGING_AUTH_REQUIRED;
    }
  });

  test('Server-side LocalPrivateStorage.put rejects uploads when STAGING_BLOCK_UPLOADS=true', async () => {
    const orig = process.env.STAGING_BLOCK_UPLOADS;
    try {
      process.env.STAGING_BLOCK_UPLOADS = 'true';
      const { LocalPrivateStorage } = await import('../../src/server/care/storage');
      const storage = new LocalPrivateStorage();
      await expect(storage.put('test-key.pdf', Buffer.from('test data'))).rejects.toThrow(
        /PHI_UPLOADS_HARD_BLOCKED_IN_STAGING/
      );
    } finally {
      if (orig !== undefined) process.env.STAGING_BLOCK_UPLOADS = orig;
      else delete process.env.STAGING_BLOCK_UPLOADS;
    }
  });

  test('Server-side createCheckoutForConsultation rejects checkouts when STAGING_BLOCK_PAYMENTS=true', async () => {
    const orig = process.env.STAGING_BLOCK_PAYMENTS;
    try {
      process.env.STAGING_BLOCK_PAYMENTS = 'true';
      const { createCheckoutForConsultation } = await import('../../src/server/care/payments/payment-service');
      await expect(
        createCheckoutForConsultation({
          consultationId: 'c-test-1',
          patientId: 'p-test-1',
          idempotencyKey: 'idemp-1',
        })
      ).rejects.toThrow(/PAYMENTS_HARD_BLOCKED_IN_STAGING/);
    } finally {
      if (orig !== undefined) process.env.STAGING_BLOCK_PAYMENTS = orig;
      else delete process.env.STAGING_BLOCK_PAYMENTS;
    }
  });

  test('Server-side createConsultation rejects booking when STAGING_BLOCK_BOOKING=true', async () => {
    const orig = process.env.STAGING_BLOCK_BOOKING;
    try {
      process.env.STAGING_BLOCK_BOOKING = 'true';
      const { createConsultation } = await import('../../src/server/care/consultation-service');
      await expect(
        createConsultation({
          patientId: 'p-1',
          doctorProfileId: 'd-1',
          type: 'TEXT',
          patientCountry: 'PK',
        })
      ).rejects.toThrow(/BOOKING_HARD_BLOCKED_IN_STAGING/);
    } finally {
      if (orig !== undefined) process.env.STAGING_BLOCK_BOOKING = orig;
      else delete process.env.STAGING_BLOCK_BOOKING;
    }
  });
});

