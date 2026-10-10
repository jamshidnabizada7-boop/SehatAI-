// scripts/test-call-token-auth.ts
// Audits patient call.token authorization, IDOR isolation, and suspension guards on real Next.js API endpoints.

import { spawn } from 'node:child_process';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';
import { encode } from 'next-auth/jwt';
import { verifyRoomToken, issueRoomToken } from '../src/server/care/video-service';

const prisma = new PrismaClient();
const PORT = 4096;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const SECRET = 'test-secret-pilot-2026';
const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || '32-character-secret-for-testing-only-12345';

console.log('======================================================================');
console.log('==> STARTING PATIENT CALL.TOKEN & IDOR AUTHORIZATION AUDIT');
console.log('======================================================================');

async function main() {
  // 1. Fetch synthetic consultation A with ACTIVE doctor
  let consultA = await prisma.consultation.findUnique({
    where: { id: 'cmv23jtrc0009ub14q006nm64' },
    include: { patient: true, doctorUser: true, doctorProfile: true },
  });

  if (!consultA) {
    consultA = await prisma.consultation.findFirst({
      where: {
        status: { in: ['DOCTOR_ACCEPTED', 'IN_PROGRESS', 'SCHEDULED'] },
        doctorProfile: { careStatus: 'ACTIVE' },
      },
      include: { patient: true, doctorUser: true, doctorProfile: true },
    });
  }

  if (!consultA) {
    throw new Error('No active consultation with verified active doctor found in database.');
  }

  // Ensure consultation is in valid call state
  if (consultA.status === 'COMPLETED' || consultA.status === 'CANCELLED') {
    await prisma.consultation.update({
      where: { id: consultA.id },
      data: { status: 'DOCTOR_ACCEPTED', type: 'VIDEO' },
    });
  }

  // 2. Fetch or create a distinct Patient B (attacker / other patient)
  let patientB = await prisma.user.findFirst({
    where: {
      role: 'user',
      id: { not: consultA.patientId },
      accountStatus: 'active',
    },
  });

  if (!patientB) {
    patientB = await prisma.user.create({
      data: {
        id: 'patient-b-synthetic-test',
        email: 'patient-b@sehatai.local',
        name: 'Patient B (Distinct User)',
        role: 'user',
        accountStatus: 'active',
      },
    });
  }

  // 3. Find a consultation with a SUSPENDED doctor for suspension test
  const suspendedDocConsult = await prisma.consultation.findFirst({
    where: {
      doctorProfile: { careStatus: 'SUSPENDED' },
    },
    include: { patient: true, doctorProfile: true },
  });

  console.log(`✓ Consultation A (Active): ${consultA.id} (Status: ${consultA.status})`);
  console.log(`✓ Authorized Patient A:    ${consultA.patient.email} (${consultA.patient.id})`);
  console.log(`✓ Unauthorized Patient B:  ${patientB.email} (${patientB.id})`);
  if (suspendedDocConsult) {
    console.log(`✓ Suspended Doctor Consult: ${suspendedDocConsult.id} (Doctor status: ${suspendedDocConsult.doctorProfile?.careStatus})`);
  }

  // Start Standalone Next.js server on port 4096
  console.log(`\n==> Spawning Standalone Next.js server on ${BASE_URL}...`);
  const serverEnv = {
    ...process.env,
    PORT: String(PORT),
    HOSTNAME: '127.0.0.1',
    NODE_ENV: 'production',
    STAGING_AUTH_REQUIRED: 'true',
    STAGING_ACCESS_SECRET: SECRET,
    STAGING_BLOCK_BOOKING: 'true',
    STAGING_BLOCK_PAYMENTS: 'true',
    STAGING_BLOCK_UPLOADS: 'true',
    CARE_VIDEO_PROVIDER: 'livekit',
    NEXTAUTH_SECRET,
    NEXTAUTH_URL: BASE_URL,
  };

  const serverProc = spawn('node', ['.next/standalone/server.js'], {
    cwd: path.resolve(process.cwd()),
    env: serverEnv,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  // Wait for health
  let healthy = false;
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch(`${BASE_URL}/api/care/health`);
      if (res.ok) {
        healthy = true;
        break;
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 400));
  }
  if (!healthy) {
    serverProc.kill();
    throw new Error(`Standalone server failed to initialize on port ${PORT}`);
  }
  console.log(`✓ Standalone server operational on ${BASE_URL}`);

  try {
    // Generate auth tokens
    const tokenPatientA = await encode({
      token: {
        id: consultA.patient.id,
        sub: consultA.patient.id,
        email: consultA.patient.email,
        name: consultA.patient.name,
        role: 'user',
        accountStatus: 'active',
      },
      secret: NEXTAUTH_SECRET,
    });

    const tokenPatientB = await encode({
      token: {
        id: patientB.id,
        sub: patientB.id,
        email: patientB.email,
        name: patientB.name,
        role: 'user',
        accountStatus: 'active',
      },
      secret: NEXTAUTH_SECRET,
    });

    const results: { test: string; status: number; expected: number; passed: boolean; detail?: any }[] = [];

    function record(test: string, status: number, expected: number, detail?: any) {
      const passed = status === expected;
      results.push({ test, status, expected, passed, detail });
      const mark = passed ? '✓ PASS' : '✗ FAIL';
      console.log(`  [${mark}] ${test} -> HTTP ${status} (expected ${expected})`);
    }

    console.log('\n--- Executing Authorization & IDOR Battery ---');

    // Test 1: Unauthenticated request (no session token) -> 401 Unauthorized
    {
      const res = await fetch(`${BASE_URL}/api/care/consultations/${consultA.id}/join`, {
        method: 'POST',
        headers: {
          'x-staging-access-key': SECRET,
        },
      });
      const data = await res.json().catch(() => ({}));
      record('1. Unauthenticated request without session cookie', res.status, 401, data);
    }

    // Test 2: Authorized Patient A requesting own consultation room token -> 200 OK
    {
      const res = await fetch(`${BASE_URL}/api/care/consultations/${consultA.id}/join`, {
        method: 'POST',
        headers: {
          'x-staging-access-key': SECRET,
          cookie: `next-auth.session-token=${tokenPatientA}`,
        },
      });
      const data = await res.json().catch(() => ({}));
      const hasToken = Boolean(data.token && data.roomId);
      record('2. Authorized Patient A joining own consultation', res.status, 200, { hasToken, provider: data.provider });
    }

    // Test 3: Cross-Patient IDOR Attack: Patient B attempting to join Consultation A -> 403 Forbidden
    {
      const res = await fetch(`${BASE_URL}/api/care/consultations/${consultA.id}/join`, {
        method: 'POST',
        headers: {
          'x-staging-access-key': SECRET,
          cookie: `next-auth.session-token=${tokenPatientB}`,
        },
      });
      const data = await res.json().catch(() => ({}));
      record('3. Cross-patient IDOR attempt (Patient B -> Consultation A)', res.status, 403, data);
    }

    // Test 4: Forged Consultation ID: Non-existent ID -> 404 Not Found
    {
      const res = await fetch(`${BASE_URL}/api/care/consultations/forged-nonexistent-id-99999/join`, {
        method: 'POST',
        headers: {
          'x-staging-access-key': SECRET,
          cookie: `next-auth.session-token=${tokenPatientA}`,
        },
      });
      const data = await res.json().catch(() => ({}));
      record('4. Forged/non-existent consultation ID', res.status, 404, data);
    }

    // Test 5: Rejoining COMPLETED consultation is blocked -> 409 Conflict
    {
      // Create a temporary completed consultation
      const completedConsult = await prisma.consultation.create({
        data: {
          id: 'temp-completed-consult-' + Date.now(),
          patientId: consultA.patientId,
          doctorProfileId: consultA.doctorProfileId,
          doctorUserId: consultA.doctorUserId,
          type: 'VIDEO',
          status: 'COMPLETED',
          priceMinor: 2000,
          currency: 'PKR',
          patientCountry: 'PK',
          doctorCountry: 'PK',
          jurisdictionKey: 'PK:PK',
          policyVersion: '2026.10-draft',
          cancellationPolicyVersion: '2026.10-draft',
        },
      });

      const res = await fetch(`${BASE_URL}/api/care/consultations/${completedConsult.id}/join`, {
        method: 'POST',
        headers: {
          'x-staging-access-key': SECRET,
          cookie: `next-auth.session-token=${tokenPatientA}`,
        },
      });
      const data = await res.json().catch(() => ({}));
      record('5. Rejoining COMPLETED consultation blocked', res.status, 409, data);

      // Clean up temp consultation
      await prisma.consultation.delete({ where: { id: completedConsult.id } });
    }

    // Test 5b: Suspended Doctor consultation joining blocked -> 403 Forbidden
    if (suspendedDocConsult) {
      const patientSuspToken = await encode({
        token: {
          id: suspendedDocConsult.patientId,
          sub: suspendedDocConsult.patientId,
          email: suspendedDocConsult.patient.email,
          name: suspendedDocConsult.patient.name,
          role: 'user',
          accountStatus: 'active',
        },
        secret: NEXTAUTH_SECRET,
      });

      const res = await fetch(`${BASE_URL}/api/care/consultations/${suspendedDocConsult.id}/join`, {
        method: 'POST',
        headers: {
          'x-staging-access-key': SECRET,
          cookie: `next-auth.session-token=${patientSuspToken}`,
        },
      });
      const data = await res.json().catch(() => ({}));
      record('5b. Consultation with SUSPENDED doctor blocked from call join', res.status, 403, data);
    }

    // Test 6: Room Token Cryptographic Verification & Expiration
    console.log('\n--- Room Token Cryptographic Verification & Expiration ---');
    const validTokenObj = issueRoomToken({
      consultationId: consultA.id,
      userId: consultA.patientId,
      role: 'PATIENT',
    });

    // 6a. Valid token passes
    const v1 = verifyRoomToken(validTokenObj.token);
    record('6a. Valid server-issued room token passes verification', v1.valid ? 200 : 500, 200, v1);

    // 6b. Tampered signature rejected
    const tamperedSigToken = validTokenObj.token.slice(0, -6) + 'abcdef';
    const v2 = verifyRoomToken(tamperedSigToken);
    record('6b. Tampered token signature rejected', v2.valid ? 500 : 200, 200, v2);

    // 6c. Tampered payload rejected
    const [b64, sig] = validTokenObj.token.split('.');
    const decoded = Buffer.from(b64, 'base64url').toString();
    const tamperedPayload = decoded.replace(consultA.patientId, patientB.id);
    const tamperedPayloadToken = `${Buffer.from(tamperedPayload).toString('base64url')}.${sig}`;
    const v3 = verifyRoomToken(tamperedPayloadToken);
    record('6c. Tampered token payload rejected', v3.valid ? 500 : 200, 200, v3);

    // 6d. Expired token rejected
    const pastTimestamp = Date.now() - 3600_000; // 1 hour ago
    const expiredPayload = `care-${consultA.id}.${consultA.patientId}.PATIENT.${pastTimestamp}`;
    const { createHmac } = await import('crypto');
    const secret = process.env.CARE_VIDEO_TOKEN_SECRET ?? NEXTAUTH_SECRET;
    const expiredSig = createHmac('sha256', secret).update(expiredPayload).digest('hex');
    const expiredToken = `${Buffer.from(expiredPayload).toString('base64url')}.${expiredSig}`;
    const v4 = verifyRoomToken(expiredToken);
    record('6d. Expired token timestamp rejected', v4.valid ? 500 : 200, 200, v4);

    const allPassed = results.every((r) => r.passed);
    console.log('\n======================================================================');
    console.log(`==> AUTHORIZATION BATTERY RESULT: ${allPassed ? `ALL PASSED (${results.length}/${results.length})` : 'FAILED'}`);
    console.log('======================================================================');

    if (!allPassed) process.exit(1);
  } finally {
    serverProc.kill();
  }
}

main().catch((err) => {
  console.error('Fatal error during authorization audit:', err);
  process.exit(1);
});
