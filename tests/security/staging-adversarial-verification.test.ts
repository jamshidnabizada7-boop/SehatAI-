// tests/security/staging-adversarial-verification.test.ts
// Empirical Adversarial Verification & Remediation Test Suite
// Run via: bun test tests/security/staging-adversarial-verification.test.ts

import { describe, expect, test } from 'bun:test';
import fs from 'node:fs';
import path from 'node:path';
import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { isTestDoctorProfile } from '../../src/server/care/marketplace';
import { generateLiveKitToken } from '../../src/server/care/video-service';
import { getPaymentProvider } from '../../src/server/care/payments/registry';
import { ProviderNotConfiguredError } from '../../src/server/care/payments/provider';
import { proxy as middleware } from '../../src/proxy';
import { verifySyntheticDatabase } from '../../scripts/verify-synthetic-db';

describe('Adversarial Stress-Test 1: Payment Hard-Blocks', () => {
  test('Real payment adapters unconditionally reject checkout in production or staging', async () => {
    // Test all real provider scaffolds
    const realProviders = ['hesabpay', 'pk-local', 'card'];
    for (const p of realProviders) {
      const provider = getPaymentProvider(p);
      expect(provider.name).toBe(p);
      await expect(
        provider.createCheckout({
          amountMinor: 50000,
          currency: 'PKR',
          reference: 'test-ref-1',
          description: 'Consultation Fee',
          successUrl: 'http://localhost:3000/success',
          cancelUrl: 'http://localhost:3000/cancel',
        })
      ).rejects.toThrow(ProviderNotConfiguredError);
    }
  });

  test('Mock provider is strictly barred in production mode unless explicitly allowed', () => {
    const origEnv = process.env.NODE_ENV;
    const origAllow = process.env.CARE_ALLOW_MOCK_PAYMENTS;
    try {
      (process.env as Record<string, string | undefined>).NODE_ENV = 'production';
      delete process.env.CARE_ALLOW_MOCK_PAYMENTS;
      expect(() => getPaymentProvider('mock')).toThrow(ProviderNotConfiguredError);
    } finally {
      (process.env as Record<string, string | undefined>).NODE_ENV = origEnv;
      if (origAllow !== undefined) process.env.CARE_ALLOW_MOCK_PAYMENTS = origAllow;
      else delete process.env.CARE_ALLOW_MOCK_PAYMENTS;
    }
  });
});

describe('Adversarial Stress-Test 2: Public Booking & Synthetic Doctor Profile Bypass', () => {
  test('REMEDIATED: Synthetic doctors proposed in Section 8.4.2 are correctly classified as test fixtures by isTestDoctorProfile', () => {
    // Deliverable specifies: Dr. Ayesha Khan, PMDC-SYNTH-001, dr.ayesha@sehatai.local
    const syntheticDoctor = {
      pmdcNumber: 'PMDC-SYNTH-001',
      facilityName: 'Alkhidmat Hospital Lahore',
      bio: 'Consultant Cardiologist with verified license',
      user: {
        email: 'dr.ayesha@sehatai.local',
        name: 'Dr. Ayesha Khan',
      },
    };

    // isTestDoctorProfile is the gatekeeper in createConsultation.
    // When true, the clinical safety engine correctly identifies this synthetic doctor as an internal test fixture.
    const isTest = isTestDoctorProfile(syntheticDoctor);
    expect(isTest).toBe(true);
  });

  test('REMEDIATED: src/proxy.ts contains STAGING_BLOCK_BOOKING guard', () => {
    const proxyContent = fs.readFileSync(path.join(process.cwd(), 'src', 'proxy.ts'), 'utf-8');
    expect(proxyContent.includes('STAGING_BLOCK_BOOKING')).toBe(true);
    expect(proxyContent.includes('/api/appointments')).toBe(true);
    expect(proxyContent.includes('/api/care/consultations')).toBe(true);
  });

  test('BEHAVIORAL: proxy actively blocks POST /api/appointments when STAGING_BLOCK_BOOKING=true', async () => {
    const orig = process.env.STAGING_BLOCK_BOOKING;
    try {
      process.env.STAGING_BLOCK_BOOKING = 'true';
      const req = new NextRequest('http://localhost:4000/api/appointments', { method: 'POST' });
      const res = middleware(req);
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toBe('BOOKING_HARD_BLOCKED_IN_STAGING');
    } finally {
      if (orig !== undefined) process.env.STAGING_BLOCK_BOOKING = orig;
      else delete process.env.STAGING_BLOCK_BOOKING;
    }
  });
});

describe('Adversarial Stress-Test 3: PHI & Document Upload Hard-Blocks', () => {
  test('REMEDIATED: src/proxy.ts contains STAGING_BLOCK_UPLOADS guard', () => {
    const proxyContent = fs.readFileSync(path.join(process.cwd(), 'src', 'proxy.ts'), 'utf-8');
    expect(proxyContent.includes('STAGING_BLOCK_UPLOADS')).toBe(true);
    expect(proxyContent.includes('/api/doctor/upload-doc')).toBe(true);
    expect(proxyContent.includes('/attachments')).toBe(true);
  });

  test('BEHAVIORAL: middleware actively blocks upload endpoints when STAGING_BLOCK_UPLOADS=true', async () => {
    const orig = process.env.STAGING_BLOCK_UPLOADS;
    try {
      process.env.STAGING_BLOCK_UPLOADS = 'true';
      const uploadReq = new NextRequest('http://localhost:4000/api/doctor/upload-doc', { method: 'POST' });
      const uploadRes = middleware(uploadReq);
      expect(uploadRes.status).toBe(403);
      const uploadData = await uploadRes.json();
      expect(uploadData.error).toBe('PHI_UPLOADS_HARD_BLOCKED_IN_STAGING');

      const attachReq = new NextRequest('http://localhost:4000/api/care/consultations/c123/attachments', { method: 'POST' });
      const attachRes = middleware(attachReq);
      expect(attachRes.status).toBe(403);
      const attachData = await attachRes.json();
      expect(attachData.error).toBe('PHI_UPLOADS_HARD_BLOCKED_IN_STAGING');
    } finally {
      if (orig !== undefined) process.env.STAGING_BLOCK_UPLOADS = orig;
      else delete process.env.STAGING_BLOCK_UPLOADS;
    }
  });
});

describe('Adversarial Stress-Test 4: Synthetic DB & PII Verification Script Audit', () => {
  test('REMEDIATED: scripts/verify-synthetic-db.ts exists on disk', () => {
    const scriptPath = path.join(process.cwd(), 'scripts', 'verify-synthetic-db.ts');
    expect(fs.existsSync(scriptPath)).toBe(true);
  });

  test('SCHEMA VERIFICATION: Prisma PatientProfile model does NOT contain phone or cnic fields', () => {
    const prisma = new PrismaClient();
    // @ts-ignore
    const fields = Object.keys(prisma.patientProfile.fields || {});
    expect(fields.includes('phone')).toBe(false);
    expect(fields.includes('cnic')).toBe(false);
  });

  test('BEHAVIORAL: verifySyntheticDatabase audits mock client and flags un-mocked CNIC', async () => {
    // Mock Prisma client to verify CNIC detection logic
    const mockClient = {
      user: {
        findMany: async () => [{ id: 'u1', email: 'test.user@sehatai.local' }],
      },
      doctorProfile: {
        findMany: async () => [{ id: 'd1', pmdcNumber: 'PMDC-SYNTH-001' }],
      },
      doctorVerificationDoc: {
        findMany: async () => [{ id: 'v1', docType: 'cnic', fileName: '4210112345671.pdf', fileUrl: '/uploads/4210112345671.pdf', notes: null }],
      },
    } as unknown as PrismaClient;

    const origPay = process.env.CARE_PAYMENTS_ENABLED;
    const origMock = process.env.CARE_ALLOW_MOCK_PAYMENTS;
    delete process.env.CARE_PAYMENTS_ENABLED;
    delete process.env.CARE_ALLOW_MOCK_PAYMENTS;

    try {
      await expect(verifySyntheticDatabase(mockClient)).rejects.toThrow(/PII VIOLATION/);
    } finally {
      if (origPay !== undefined) process.env.CARE_PAYMENTS_ENABLED = origPay;
      if (origMock !== undefined) process.env.CARE_ALLOW_MOCK_PAYMENTS = origMock;
    }
  });
});

describe('Adversarial Stress-Test 5: LiveKit Cloud Zero-Transcoding Performance & CPU Overhead', () => {
  test('LiveKit token generation takes minimal CPU time and produces valid HS256 JWT without media stream creation', () => {
    // Warm up JIT / crypto initialization
    generateLiveKitToken({
      roomId: 'warmup',
      userId: 'usr-warmup',
      role: 'PATIENT',
      consultationId: 'c-warmup',
      apiKey: 'API_TEST_KEY',
      apiSecret: 'SECRET_TEST_KEY_MUST_BE_SECURE',
    });

    const start = performance.now();
    const token = generateLiveKitToken({
      roomId: 'care-test-consultation-1',
      userId: 'usr-patient-123',
      role: 'PATIENT',
      consultationId: 'c-test-456',
      apiKey: 'API_TEST_KEY',
      apiSecret: 'SECRET_TEST_KEY_MUST_BE_SECURE',
    });
    const elapsed = performance.now() - start;

    expect(token).toBeDefined();
    expect(token.split('.').length).toBe(3);
    expect(elapsed).toBeLessThan(20);
  });
});

describe('Adversarial Stress-Test 6: Prisma Native ARM64 Engine Target', () => {
  test('REMEDIATED: prisma/schema.prisma includes linux-arm64-openssl-3.0.x binaryTarget', () => {
    const schemaContent = fs.readFileSync(path.join(process.cwd(), 'prisma', 'schema.prisma'), 'utf-8');
    expect(schemaContent.includes('linux-arm64-openssl-3.0.x')).toBe(true);
    expect(schemaContent.includes('binaryTargets')).toBe(true);
  });
});
