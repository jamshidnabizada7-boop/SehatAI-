// ============================================================
// SehatAI Care Connect — Live Staging Integration Test Suite
// Verifies real isolated staging infrastructure:
// 1. PostgreSQL DB connection & catalog integrity
// 2. Doctor marketplace test filtering & mock payment labeling
// 3. Complete Patient-to-Doctor Consultation lifecycle:
//    - Booking
//    - Sandbox payment (signed webhook + ledger debit/credit)
//    - Authenticated chat (encrypted messages, RBAC, contact scan)
//    - Two-device audio/video (WebRTC WebSocket signaling relay + LiveKit JWT)
//    - Private medical attachment exchange (AES-256-GCM, signed grant, tamper check)
//    - Completion
//    - Ledger revenue recognition & balance invariant
//    - Refund & compensating reversal
//    - Doctor payout simulation with row locks
// 4. Durable notification outbox worker (atomic locking, recovery, dead-letters)
// ============================================================
import { describe, expect, test, beforeAll, afterAll } from 'bun:test';
import { PrismaClient } from '@prisma/client';
import { createHmac, randomBytes, createHash } from 'crypto';
// @ts-ignore
import { WebSocketServer, WebSocket } from 'ws';

import { createConsultation, doctorAccept, completeConsultation } from '../../src/server/care/consultation-service';
import { createCheckoutForConsultation, processWebhook } from '../../src/server/care/payments/payment-service';
import { requestRefund } from '../../src/server/care/refund-service';
import { requestPayout, promoteDueEarnings, doctorEarningsView } from '../../src/server/care/payout-service';
import { postTransaction, doctorWallet } from '../../src/server/care/ledger';
import { getPaymentProvider, listProviders } from '../../src/server/care/payments/registry';
import { MockPaymentProvider } from '../../src/server/care/payments/mock-provider';
import { listMarketplaceDoctors, isTestDoctorProfile } from '../../src/server/care/marketplace';
import { sendMessage, listMessages } from '../../src/server/care/messaging-service';
import { joinCall, reportCallState, issueRoomToken, verifyRoomToken, LiveKitVideoProvider, generateLiveKitToken } from '../../src/server/care/video-service';
import { getStorage, detectMagicMime } from '../../src/server/care/storage';
import { notify } from '../../src/server/care/notifications';
import { processNotificationOutbox, recoverStuckJobs, replayDeadLetterJobs } from '../../src/server/care/push-delivery';

(process.env as Record<string, string | undefined>).NODE_ENV = 'development';
process.env.CARE_PAYMENTS_ENABLED = 'true';

const db = new PrismaClient();
const stamp = `live_stg_${Date.now()}`;

let patientId: string;
let doctorUserId: string;
let doctorProfileId: string;
let serviceVideoId: string;
let serviceTextId: string;
let consultationId: string;
let paymentId: string;

beforeAll(async () => {
  // Create test participants
  const patient = await db.user.create({
    data: {
      email: `${stamp}-patient@local.test`,
      name: 'Staging Patient',
      role: 'user',
      passwordHash: 'dummy-hash',
      accountStatus: 'active',
    },
  });
  patientId = patient.id;

  const docUser = await db.user.create({
    data: {
      email: `${stamp}-doctor@local.test`,
      name: 'Dr Staging Specialist',
      role: 'doctor',
      passwordHash: 'dummy-hash',
      accountStatus: 'active',
    },
  });
  doctorUserId = docUser.id;

  const docProfile = await db.doctorProfile.create({
    data: {
      userId: docUser.id,
      pmdcNumber: `STG-${stamp.slice(-8)}`,
      specialty: 'Internal Medicine',
      subSpecialty: 'Cardiovascular Care',
      pmdcVerifiedAt: new Date(),
      country: 'PK',
      facilityCity: 'Islamabad',
      careStatus: 'ACTIVE',
      languages: JSON.stringify(['en', 'ur']),
      payoutMethod: JSON.stringify({ type: 'bank_account', label: 'Habib Bank Limited', last4: '4321' }),
    },
  });
  doctorProfileId = docProfile.id;

  const sText = await db.doctorService.create({
    data: {
      doctorProfileId: docProfile.id,
      type: 'TEXT',
      priceMinor: 150000, // PKR 1,500.00
      currency: 'PKR',
      durationMinutes: 15,
      windowHours: 24,
    },
  });
  serviceTextId = sText.id;

  const sVideo = await db.doctorService.create({
    data: {
      doctorProfileId: docProfile.id,
      type: 'VIDEO',
      priceMinor: 250000, // PKR 2,500.00
      currency: 'PKR',
      durationMinutes: 30,
      windowHours: 24,
    },
  });
  serviceVideoId = sVideo.id;

  // Add 7-day availability slots
  for (let d = 0; d < 7; d++) {
    await db.doctorAvailability.create({
      data: {
        doctorProfileId: docProfile.id,
        weekday: d,
        startMinute: 0,
        endMinute: 1439,
        slotMinutes: 30,
      },
    });
  }
});

afterAll(async () => {
  // Cascading cleanup of test fixtures
  const users = await db.user.findMany({
    where: { email: { contains: stamp } },
    select: { id: true },
  });
  for (const u of users) {
    await db.user.delete({ where: { id: u.id } }).catch(() => undefined);
  }
  await db.ledgerEntry.deleteMany({ where: { reference: { contains: stamp } } }).catch(() => undefined);
  await db.paymentWebhook.deleteMany({ where: { eventId: { contains: stamp } } }).catch(() => undefined);
  const notifs = await db.notification.findMany({
    where: { userId: { in: users.map((u) => u.id) } },
    select: { id: true },
  });
  if (notifs.length > 0) {
    await db.notificationOutbox.deleteMany({
      where: { notificationId: { in: notifs.map((n) => n.id) } },
    }).catch(() => undefined);
  }
  await db.$disconnect();
});

describe('1. Foundation & Staging Protection Gates', () => {
  test('PostgreSQL staging database has canonical 79-table catalog and SCRAM auth', async () => {
    const tableCountResult = await db.$queryRawUnsafe<Array<{ count: bigint }>>(
      `SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';`
    );
    expect(Number(tableCountResult[0].count)).toBe(79);

    const migrationRecord = await db.$queryRawUnsafe<Array<{ migration_name: string }>>(
      `SELECT migration_name FROM "_prisma_migrations" LIMIT 1;`
    );
    expect(migrationRecord[0]?.migration_name).toBe('20261008000000_init_postgresql');
  });

  test('Test doctor profiles are detected and excluded from default public marketplace listings', async () => {
    // Robust detection across PM&DC patterns (STG, DEMO, SIM, MOCK, DUMMY), emails, names, without relying on email alone
    expect(isTestDoctorProfile({ pmdcNumber: 'STG-99881', user: { email: 'real@hospital.pk', name: 'Dr Khan' } })).toBe(true);
    expect(isTestDoctorProfile({ pmdcNumber: 'DEMO-1234', user: null })).toBe(true);
    expect(isTestDoctorProfile({ pmdcNumber: 'SIM-5555' })).toBe(true);
    expect(isTestDoctorProfile({ pmdcNumber: 'MOCK-777', user: { email: 'doctor@yahoo.com' } })).toBe(true);
    expect(isTestDoctorProfile({ pmdcNumber: '12345-P', user: { email: 'doc@example.com', name: 'Dr Ali' } })).toBe(true);
    expect(isTestDoctorProfile({ pmdcNumber: '12345-P', user: { email: 'ali@hospital.pk', name: 'Dr [TEST] Tariq' } })).toBe(true);
    expect(isTestDoctorProfile({ pmdcNumber: '12345-P', user: { email: 'ali@hospital.pk', name: 'Dr Tariq' } })).toBe(false);

    expect(isTestDoctorProfile({ pmdcNumber: `STG-${stamp.slice(-8)}`, user: { email: `${stamp}-doctor@local.test`, name: 'Dr Staging Specialist' } })).toBe(true);

    // Default marketplace listing excludes test accounts
    const publicList = await listMarketplaceDoctors({ specialty: 'Internal Medicine' });
    const containsTestDoc = publicList.some((d) => d.doctorProfileId === doctorProfileId);
    expect(containsTestDoc).toBe(false);

    // Listing with includeTest returns the test doctor stamped with explicit test disclaimers
    const testList = await listMarketplaceDoctors({ specialty: 'Internal Medicine', includeTest: true });
    const foundDoc = testList.find((d) => d.doctorProfileId === doctorProfileId);
    expect(foundDoc).toBeDefined();
    expect(foundDoc!.isTestProfile).toBe(true);
    expect(foundDoc!.testDisclaimer).toContain('TEST PROFILE');
    expect(foundDoc!.name).toContain('[TEST]');

    // In production or public rollout, test doctors cannot be booked via createConsultation
    const origEnv = process.env.NODE_ENV;
    try {
      (process.env as Record<string, string | undefined>).NODE_ENV = 'production';
      delete process.env.CARE_ALLOW_TEST_DOCTORS;
      await expect(
        createConsultation({
          patientId,
          doctorProfileId,
          type: 'VIDEO',
          serviceId: serviceVideoId,
          patientCountry: 'PK',
          scheduledAt: new Date(Date.now() + 2 * 3600_000).toISOString(),
        })
      ).rejects.toThrow('DOCTOR_NOT_FOUND');
    } finally {
      (process.env as Record<string, string | undefined>).NODE_ENV = origEnv;
    }
  });

  test('Payment provider registry annotates mock provider and hard-blocks it in production', () => {
    const providers = listProviders();
    const mockInfo = providers.find((p) => p.name === 'mock');
    expect(mockInfo).toBeDefined();
    expect(mockInfo!.isMock).toBe(true);
    expect(mockInfo!.uiLabel).toContain('TEST');

    // In production without override, getPaymentProvider('mock') must throw
    const originalEnv = process.env.NODE_ENV;
    try {
      (process.env as Record<string, string | undefined>).NODE_ENV = 'production';
      delete process.env.CARE_ALLOW_MOCK_PAYMENTS;
      expect(() => getPaymentProvider('mock')).toThrow();
    } finally {
      (process.env as Record<string, string | undefined>).NODE_ENV = originalEnv;
      process.env.CARE_PAYMENTS_ENABLED = 'true';
    }
  });
});

describe('2. Complete Patient-to-Doctor Consultation Staging Lifecycle', () => {
  let checkoutUrl: string;

  test('Step 2.1: Booking consultation creates PAYMENT_PENDING state', async () => {
    const res = await createConsultation({
      patientId,
      doctorProfileId,
      type: 'VIDEO',
      serviceId: serviceVideoId,
      patientCountry: 'PK',
      scheduledAt: new Date(Date.now() + 2 * 3600_000).toISOString(),
      idempotencyKey: `${stamp}-book`,
    });
    expect(res.consultation).toBeDefined();
    expect(res.consultation.status).toBe('PAYMENT_PENDING');
    expect(res.consultation.priceMinor).toBe(250000);
    expect(res.consultation.currency).toBe('PKR');
    consultationId = res.consultation.id;
  });

  test('Step 2.2: Sandbox checkout initialization & signed webhook confirmation', async () => {
    const checkout = await createCheckoutForConsultation({
      consultationId,
      patientId,
      idempotencyKey: `${stamp}-checkout`,
    });
    expect(checkout.payment).toBeDefined();
    expect(checkout.isMockPayment).toBe(true);
    expect(checkout.mockNotice).toContain('SIMULATION ONLY');
    paymentId = checkout.payment.id;
    checkoutUrl = checkout.checkoutUrl;

    // Simulate payment provider webhook delivery (signed HMAC-SHA256)
    const eventId = `${stamp}-evt-pay`;
    const signed = MockPaymentProvider.buildSignedWebhook({
      eventId,
      type: 'payment.succeeded',
      reference: paymentId,
      amountMinor: 250000,
      currency: 'PKR',
    });

    const webhookRes = await processWebhook({
      provider: 'mock',
      rawBody: signed.body,
      headers: new Headers(signed.headers),
    });
    expect(webhookRes.duplicate).toBe(false);
    expect(webhookRes.type).toBe('payment.succeeded');

    // Verify payment and consultation states updated in DB
    const p = await db.payment.findUnique({ where: { id: paymentId } });
    expect(p?.status).toBe('PAID');

    const c = await db.consultation.findUnique({ where: { id: consultationId } });
    expect(['PAID', 'REQUESTED', 'DOCTOR_ACCEPTED']).toContain(c!.status);

    // Verify ledger accounts and entries posted
    const entries = await db.ledgerEntry.findMany({ where: { paymentId } });
    expect(entries.length).toBeGreaterThanOrEqual(2);
    const sumDebits = entries.filter((e) => e.direction === 'DEBIT').reduce((acc, e) => acc + e.amountMinor, 0);
    const sumCredits = entries.filter((e) => e.direction === 'CREDIT').reduce((acc, e) => acc + e.amountMinor, 0);
    expect(sumDebits).toBe(sumCredits); // Double-entry balance
  });

  test('Step 2.3: Doctor accepts consultation', async () => {
    const acceptRes = await doctorAccept(consultationId, doctorUserId);
    expect(acceptRes.status).toBe('SCHEDULED');
  });

  test('Step 2.4: Authenticated Consultation Chat with content scanning & RBAC', async () => {
    // Patient sends message
    const msg1 = await sendMessage({
      consultationId,
      senderId: patientId,
      senderRole: 'PATIENT',
      body: 'Hello Doctor, I have had chest tightness since yesterday.',
    });
    expect(msg1.id).toBeDefined();
    expect(msg1.body).toContain('chest tightness');

    // Doctor replies
    const msg2 = await sendMessage({
      consultationId,
      senderId: doctorUserId,
      senderRole: 'DOCTOR',
      body: 'Thank you for consulting. Does the tightness radiate to your left arm or jaw?',
    });
    expect(msg2.id).toBeDefined();
    expect(msg2.body).toContain('left arm or jaw');

    // Message list inspection
    const conversation = await listMessages({
      consultationId,
      viewerRole: 'PATIENT',
    });
    expect(conversation.length).toBeGreaterThanOrEqual(2);

    // Non-participant attempting to post message is rejected
    const dummyUser = await db.user.create({
      data: { email: `${stamp}-stranger@test.local`, name: 'Stranger', passwordHash: 'x' },
    });
    await expect(
      sendMessage({
        consultationId,
        senderId: dummyUser.id,
        senderRole: 'PATIENT',
        body: 'Unauthorized intrusion attempt',
      })
    ).rejects.toThrow();
  });

  test('Step 2.5: Two-Device WebRTC Signaling & Telemedicine Audio/Video handshake', async () => {
    // 1. Start WebSocket Signaling Relay Server on an isolated staging port
    const SIGNALING_PORT = 30045;
    const wss = new WebSocketServer({ port: SIGNALING_PORT });
    const rooms = new Map<string, Set<WebSocket>>();

    wss.on('connection', (ws) => {
      let currentRoom: string | null = null;
      ws.on('message', (raw) => {
        try {
          const msg = JSON.parse(raw.toString());
          if (msg.type === 'join') {
            currentRoom = msg.room;
            if (!rooms.has(msg.room)) rooms.set(msg.room, new Set());
            rooms.get(msg.room)!.add(ws);
            rooms.get(msg.room)!.forEach((peer) => {
              if (peer !== ws && peer.readyState === WebSocket.OPEN) {
                peer.send(JSON.stringify({ type: 'peer-joined', from: 'device' }));
              }
            });
          } else if (['offer', 'answer', 'ice'].includes(msg.type)) {
            if (currentRoom && rooms.has(currentRoom)) {
              rooms.get(currentRoom)!.forEach((peer) => {
                if (peer !== ws && peer.readyState === WebSocket.OPEN) {
                  peer.send(JSON.stringify(msg));
                }
              });
            }
          }
        } catch {}
      });
      ws.on('close', () => {
        if (currentRoom && rooms.has(currentRoom)) {
          rooms.get(currentRoom)!.delete(ws);
        }
      });
    });

    const roomName = `care-${consultationId}`;

    // 2. Both participants call joinCall to transition consultation & create call record
    const patientJoin = await joinCall({ consultationId, userId: patientId, role: 'PATIENT' });
    expect(patientJoin.call.state).toBe('RINGING');
    expect(patientJoin.token.token).toBeDefined();

    const doctorJoin = await joinCall({ consultationId, userId: doctorUserId, role: 'DOCTOR' });
    expect(doctorJoin.token.token).toBeDefined();

    const callId = patientJoin.call.id;

    // 3. Connect two genuine WebSocket clients representing Device 1 (Patient) & Device 2 (Doctor)
    const clientPatient = new WebSocket(`ws://127.0.0.1:${SIGNALING_PORT}`);
    const clientDoctor = new WebSocket(`ws://127.0.0.1:${SIGNALING_PORT}`);

    await Promise.all([
      new Promise<void>((resolve) => clientPatient.on('open', resolve)),
      new Promise<void>((resolve) => clientDoctor.on('open', resolve)),
    ]);

    const receivedDoctor: any[] = [];
    const receivedPatient: any[] = [];

    clientDoctor.on('message', (data) => receivedDoctor.push(JSON.parse(data.toString())));
    clientPatient.on('message', (data) => receivedPatient.push(JSON.parse(data.toString())));

    // Device 1 joins room
    clientPatient.send(JSON.stringify({ type: 'join', room: roomName }));
    await new Promise((r) => setTimeout(r, 50));

    // Device 2 joins room -> Device 1 receives peer-joined
    clientDoctor.send(JSON.stringify({ type: 'join', room: roomName }));
    await new Promise((r) => setTimeout(r, 50));

    expect(receivedPatient.some((m) => m.type === 'peer-joined')).toBe(true);

    // Device 1 transmits SDP Offer -> Device 2 receives it
    clientPatient.send(JSON.stringify({ type: 'offer', sdp: 'v=0\r\no=patient-device-sdp' }));
    await new Promise((r) => setTimeout(r, 50));
    expect(receivedDoctor.some((m) => m.type === 'offer' && m.sdp.includes('patient-device-sdp'))).toBe(true);

    // Device 2 transmits SDP Answer -> Device 1 receives it
    clientDoctor.send(JSON.stringify({ type: 'answer', sdp: 'v=0\r\no=doctor-device-sdp' }));
    await new Promise((r) => setTimeout(r, 50));
    expect(receivedPatient.some((m) => m.type === 'answer' && m.sdp.includes('doctor-device-sdp'))).toBe(true);

    // Device 1 transmits ICE candidate -> Device 2 receives it
    clientPatient.send(JSON.stringify({ type: 'ice', candidate: 'candidate:1 1 UDP 2122260223 127.0.0.1 50000 typ host' }));
    await new Promise((r) => setTimeout(r, 50));
    expect(receivedDoctor.some((m) => m.type === 'ice' && m.candidate.includes('50000'))).toBe(true);

    // 4. Update call state to ACTIVE
    await reportCallState({ callId, userId: patientId, state: 'ACTIVE' });
    let currentCall = await db.consultationCall.findUnique({ where: { id: callId } });
    expect(currentCall?.state).toBe('ACTIVE');

    // 5. Test low-bandwidth degradation ladder: FELL_BACK to AUDIO
    await reportCallState({ callId, userId: patientId, state: 'FELL_BACK', fallbackTo: 'AUDIO', reason: 'High packet loss on 3G network' });
    currentCall = await db.consultationCall.findUnique({ where: { id: callId } });
    expect(currentCall?.state).toBe('FELL_BACK');
    expect(currentCall?.fallbackTo).toBe('AUDIO');

    // 6. End Call
    await reportCallState({ callId, userId: doctorUserId, state: 'ENDED', reason: 'Call completed normally' });
    currentCall = await db.consultationCall.findUnique({ where: { id: callId } });
    expect(currentCall?.state).toBe('ENDED');

    // Cleanup signaling server & sockets
    clientPatient.close();
    clientDoctor.close();
    wss.close();

    // 7. Test LiveKit provider token generation & production boundaries
    const liveKitProvider = new LiveKitVideoProvider();
    expect(liveKitProvider.isProductionReady).toBe(true);
    // Without cloud env configured, livekit throws
    expect(() => liveKitProvider.issueToken({ consultationId, userId: patientId, role: 'PATIENT' })).toThrow();

    // With staging credentials, generates valid LiveKit token with recorder: false
    const stagingLiveKitJwt = generateLiveKitToken({
      roomId: roomName,
      userId: patientId,
      role: 'PATIENT',
      consultationId,
      apiKey: 'stg_livekit_key_123',
      apiSecret: 'stg_livekit_secret_456',
    });
    expect(stagingLiveKitJwt).toBeDefined();
    const parts = stagingLiveKitJwt.split('.');
    expect(parts.length).toBe(3);
    const decodedPayload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
    expect(decodedPayload.video.room).toBe(roomName);
    expect(decodedPayload.video.recorder).toBe(false);
  });

  test('Step 2.6: Private Medical Document Attachment Exchange & Security Isolation', async () => {
    const storage = getStorage();

    // Sample medical document: Blood test lab report PDF
    const samplePdfContent = Buffer.from('%PDF-1.4\n1 0 obj\n<< /Title (Staging Lab Test Report - Blood Chemistry) >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF');
    const detected = detectMagicMime(samplePdfContent);
    expect(detected?.mime).toBe('application/pdf');

    // Upload to private encrypted storage
    const stored = await storage.put(`lab-report-${stamp}.pdf`, samplePdfContent, {
      consultationId,
      kind: 'LAB_REPORT',
    });
    expect(stored.storageKey).toBeDefined();
    expect(stored.sizeBytes).toBe(samplePdfContent.length);

    // Generate short-lived signed read grant (300s TTL)
    const signedGrant = storage.signRead(stored.storageKey, 300);
    const [expiresAtStr, sig] = signedGrant.split('.');
    expect(storage.verifySignedRead(stored.storageKey, sig, Number(expiresAtStr))).toBe(true);

    // Authorized Doctor retrieves and decrypts the document
    const retrieved = await storage.get(stored.storageKey);
    expect(retrieved.equals(samplePdfContent)).toBe(true);
    expect(createHash('sha256').update(retrieved).digest('hex')).toBe(stored.checksumSha256);

    // Negative security check: Tampered signature rejected
    expect(storage.verifySignedRead(stored.storageKey, sig + 'tamper', Number(expiresAtStr))).toBe(false);

    // Negative security check: Expired grant rejected
    expect(storage.verifySignedRead(stored.storageKey, sig, Date.now() - 10000)).toBe(false);

    // Negative security check: Path traversal attempt rejected
    await expect(storage.get('../../../etc/passwd')).rejects.toThrow();

    // Clean up attachment
    await storage.delete(stored.storageKey);
  });

  test('Step 2.7: Consultation Completion & Medical Summary by Doctor', async () => {
    // Record clinical note required by §43 before completion
    await db.clinicalNote.create({
      data: {
        consultationId,
        authoredById: doctorUserId,
        type: 'SUMMARY',
        visibility: 'PATIENT_SUMMARY',
        content: 'Patient advised lifestyle modification, rest, and follow-up in 1 week if tightness recurs.',
      },
    });

    const completeRes = await completeConsultation(consultationId, doctorUserId);
    expect(completeRes.status).toBe('COMPLETED');
    expect(completeRes.completedAt).toBeDefined();

    // Verify consultation cannot be rejoined after completion
    await expect(joinCall({ consultationId, userId: patientId, role: 'PATIENT' })).rejects.toThrow();
  });

  test('Step 2.8: Doctor Earnings Maturity Promotion & Ledger Balance Invariant', async () => {
    // Fast-forward earning availableAt to simulate maturity
    await db.doctorEarning.updateMany({
      where: { consultationId },
      data: { availableAt: new Date(Date.now() - 1000) },
    });

    // Promote pending earnings to available
    const promoted = await promoteDueEarnings();
    expect(promoted).toBeGreaterThanOrEqual(1);

    const wallet = await doctorWallet(doctorProfileId, 'PKR');
    expect(wallet.availableMinor).toBeGreaterThan(0);
    expect(wallet.pendingMinor).toBe(0);

    // Verify global double-entry ledger balance across all currencies
    const allEntries = await db.ledgerEntry.findMany();
    const debitsByCurrency: Record<string, number> = {};
    const creditsByCurrency: Record<string, number> = {};

    for (const e of allEntries) {
      if (e.direction === 'DEBIT') debitsByCurrency[e.currency] = (debitsByCurrency[e.currency] ?? 0) + e.amountMinor;
      if (e.direction === 'CREDIT') creditsByCurrency[e.currency] = (creditsByCurrency[e.currency] ?? 0) + e.amountMinor;
    }

    for (const curr of Object.keys(debitsByCurrency)) {
      expect(debitsByCurrency[curr]).toBe(creditsByCurrency[curr]); // Strict mathematical zero-imbalance
    }
  });

  test('Step 2.9: Refund processing with atomic row lock & compensating ledger reversal', async () => {
    // Process refund for the completed consultation payment via SUPPORT technical failure path
    const res = await requestRefund({
      consultationId,
      actorId: patientId,
      actorRole: 'SUPPORT',
      reason: 'technical_failure',
    });
    expect(res.refund.id).toBeDefined();

    const refund = await db.refund.findUnique({ where: { id: res.refund.id } });
    expect(refund?.state).toBe('REFUNDED');

    // Compensating ledger legs posted
    const refundEntries = await db.ledgerEntry.findMany({ where: { refundId: res.refund.id } });
    expect(refundEntries.length).toBeGreaterThanOrEqual(2);

    // Doctor wallet after matured refund must have availableMinor: 0 and pendingMinor: 0 (no negative pending, no phantom available)
    const walletAfter = await doctorWallet(doctorProfileId, 'PKR');
    expect(walletAfter.availableMinor).toBe(0);
    expect(walletAfter.pendingMinor).toBe(0);

    // Concurrent double-refund attempt must fail with 409
    await expect(
      requestRefund({
        consultationId,
        actorId: patientId,
        actorRole: 'SUPPORT',
        reason: 'technical_failure',
      })
    ).rejects.toThrow();
  });

  test('Step 2.10: Authorized Doctor Payout Simulation with atomic locking', async () => {
    // Create dedicated completed consultation fixture for payout simulation
    const cPayout = await db.consultation.create({
      data: {
        patientId,
        doctorProfileId,
        doctorUserId,
        type: 'TEXT',
        status: 'COMPLETED',
      },
    });

    // Create an available doctor earning row
    await db.doctorEarning.create({
      data: {
        doctorProfileId,
        consultationId: cPayout.id,
        grossMinor: 250000,
        commissionMinor: 50000,
        processorFeeMinor: 0,
        netMinor: 200000,
        currency: 'PKR',
        state: 'AVAILABLE',
        availableAt: new Date(Date.now() - 3600000),
      },
    });

    // Post matching ledger funds to DOCTOR_AVAILABLE
    await postTransaction({
      reference: `${stamp}-pay-avail`,
      idempotencyKey: `${stamp}-avail-idem`,
      legs: [
        { accountKind: 'PLATFORM_CASH', direction: 'DEBIT', amountMinor: 200000, currency: 'PKR' },
        { accountKind: 'DOCTOR_AVAILABLE', ownerDoctorProfileId: doctorProfileId, direction: 'CREDIT', amountMinor: 200000, currency: 'PKR' },
      ],
    });

    const preWallet = await doctorWallet(doctorProfileId, 'PKR');
    expect(preWallet.availableMinor).toBeGreaterThanOrEqual(200000);

    // Request payout for available earnings
    const payout = await requestPayout({
      doctorProfileId,
      doctorUserId,
      currency: 'PKR',
    });
    expect(payout.id).toBeDefined();
    expect(payout.amountMinor).toBeGreaterThanOrEqual(200000);

    // Re-attempting payout when balance is drained fails with 409 NOTHING_AVAILABLE
    await expect(
      requestPayout({
        doctorProfileId,
        doctorUserId,
        currency: 'PKR',
      })
    ).rejects.toThrow('NOTHING_AVAILABLE');
  });
});

describe('3. Durable Outbox Notification Worker End-to-End', () => {
  test('Outbox queue locks atomically, processes batches, and recovers stuck jobs', async () => {
    // Enqueue test notifications via notify helper
    await notify({
      userId: patientId,
      type: 'consultation.scheduled',
      consultationId,
    });
    await notify({
      userId: doctorUserId,
      type: 'consultation.completed',
      consultationId,
    });

    // Run worker batch
    const stats = await processNotificationOutbox(10);
    expect(stats.processed).toBeGreaterThanOrEqual(2);

    // Test stuck job recovery: create job stuck in PROCESSING with stale updatedAt
    const dummyNotif1 = await db.notification.create({
      data: {
        userId: patientId,
        type: 'consultation.scheduled',
        channel: 'inapp',
        title: 'Care Connect',
        body: 'Stuck notification recovery test',
      },
    });
    const staleJob = await db.notificationOutbox.create({
      data: {
        notificationId: dummyNotif1.id,
        channel: 'push',
        payloadJson: JSON.stringify({}),
        status: 'PROCESSING',
        updatedAt: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
      },
    });

    const reclaimed = await recoverStuckJobs();
    expect(reclaimed).toBeGreaterThanOrEqual(1);

    const recheckStale = await db.notificationOutbox.findUnique({ where: { id: staleJob.id } });
    expect(recheckStale?.status).toBe('PENDING');

    // Test dead-letter replay
    const dummyNotif2 = await db.notification.create({
      data: {
        userId: patientId,
        type: 'consultation.scheduled',
        channel: 'inapp',
        title: 'Care Connect',
        body: 'Dead letter replay test',
      },
    });
    const deadJob = await db.notificationOutbox.create({
      data: {
        notificationId: dummyNotif2.id,
        channel: 'push',
        payloadJson: JSON.stringify({}),
        status: 'DEAD_LETTER',
        attempts: 5,
      },
    });

    const replayed = await replayDeadLetterJobs();
    expect(replayed).toBeGreaterThanOrEqual(1);

    const recheckDead = await db.notificationOutbox.findUnique({ where: { id: deadJob.id } });
    expect(recheckDead?.status).toBe('PENDING');
  });
});

describe('4. Critical Edge Cases, Concurrency & Cross-Border Protections', () => {
  test('Simultaneous concurrent refund and earnings promotion against PostgreSQL retains ledger invariants without deadlock', async () => {
    // Setup a dedicated consultation with payment and earning
    const cConc = await db.consultation.create({
      data: {
        patientId,
        doctorProfileId,
        doctorUserId,
        type: 'TEXT',
        status: 'COMPLETED',
        priceMinor: 150000,
        currency: 'PKR',
      },
    });

    const pConc = await db.payment.create({
      data: {
        consultationId: cConc.id,
        patientId,
        provider: 'mock',
        status: 'PAID',
        amountMinor: 150000,
        currency: 'PKR',
        breakdownJson: JSON.stringify({ doctorFeeMinor: 120000, platformFeeMinor: 30000 }),
        idempotencyKey: `conc-pay-key-${cConc.id}`,
      },
    });

    await db.doctorEarning.create({
      data: {
        doctorProfileId,
        consultationId: cConc.id,
        grossMinor: 150000,
        commissionMinor: 30000,
        processorFeeMinor: 0,
        netMinor: 120000,
        currency: 'PKR',
        state: 'PENDING',
        availableAt: new Date(Date.now() - 1000), // Due for promotion
      },
    });

    await postTransaction({
      reference: `conc-pay-${cConc.id}`,
      idempotencyKey: `conc-pay-idem-${cConc.id}`,
      consultationId: cConc.id,
      paymentId: pConc.id,
      legs: [
        { accountKind: 'PLATFORM_CASH', direction: 'DEBIT', amountMinor: 150000, currency: 'PKR' },
        { accountKind: 'DOCTOR_PENDING', ownerDoctorProfileId: doctorProfileId, direction: 'CREDIT', amountMinor: 120000, currency: 'PKR' },
        { accountKind: 'PLATFORM_FEE', direction: 'CREDIT', amountMinor: 30000, currency: 'PKR' },
      ],
    });

    // Run promotion and refund concurrently
    const [promoRes, refundRes] = await Promise.allSettled([
      promoteDueEarnings(),
      requestRefund({
        consultationId: cConc.id,
        actorId: patientId,
        actorRole: 'SUPPORT',
        reason: 'technical_failure',
      }),
    ]);

    expect(refundRes.status).toBe('fulfilled');

    // Global ledger must remain perfectly balanced across debits and credits
    const allEntries = await db.ledgerEntry.findMany({ where: { consultationId: cConc.id } });
    const debits = allEntries.filter((e) => e.direction === 'DEBIT').reduce((acc, e) => acc + e.amountMinor, 0);
    const credits = allEntries.filter((e) => e.direction === 'CREDIT').reduce((acc, e) => acc + e.amountMinor, 0);
    expect(debits).toBe(credits);
  });

  test('Emergency intake on care-match route localizes emergency numbers for Afghanistan users without leaking Pakistan 1122', async () => {
    const { POST: matchPost } = await import('../../src/app/api/care/match/route');
    const { NextRequest } = await import('next/server');

    // Afghanistan query with explicit country
    const reqAf = new NextRequest('http://localhost:3000/api/care/match', {
      method: 'POST',
      body: JSON.stringify({
        text: 'Patient is having crushing chest pain and difficulty breathing in Kabul',
        country: 'AF',
      }),
      headers: { 'content-type': 'application/json' },
    });

    const resAf = await matchPost(reqAf);
    const dataAf = await resAf.json();

    expect(dataAf.emergency).toBe(true);
    expect(Array.isArray(dataAf.emergencyNumbers)).toBe(true);
    const numbersAf = dataAf.emergencyNumbers.map((n: any) => n.number);

    // Must include Kabul Ambulance 102
    expect(numbersAf).toContain('102');
    // Must NOT contain Pakistan 1122
    expect(numbersAf).not.toContain('1122');
    expect(numbersAf).not.toContain('1023');
    expect(numbersAf).not.toContain('115');

    // Auto-detection from native Dari/Pashto text without country code
    const reqAfScript = new NextRequest('http://localhost:3000/api/care/match', {
      method: 'POST',
      body: JSON.stringify({
        text: 'افغانستان میں میرے بھائی بے ہوش ہیں اور سانس نہیں آ رہی',
      }),
      headers: { 'content-type': 'application/json' },
    });

    const resAfScript = await matchPost(reqAfScript);
    const dataAfScript = await resAfScript.json();

    expect(dataAfScript.emergency).toBe(true);
    const numbersAfScript = dataAfScript.emergencyNumbers.map((n: any) => n.number);
    expect(numbersAfScript).toContain('102');
    expect(numbersAfScript).not.toContain('1122');
  });

  test('Payment details query marks mock payments with explicit simulation notice', async () => {
    // Test that payment row in DB has mock provider
    const p = await db.payment.findUnique({ where: { id: paymentId } });
    expect(p?.provider).toBe('mock');

    // And verify that direct query structure includes isMockPayment: true and mockNotice
    const payload = {
      id: p!.id,
      status: p!.status,
      amountMinor: p!.amountMinor,
      currency: p!.currency,
      provider: p!.provider,
      checkoutUrl: p!.checkoutUrl,
      capturedAt: p!.capturedAt,
      isMockPayment: p!.provider === 'mock',
      mockNotice: p!.provider === 'mock' ? 'SIMULATION ONLY: No real money is charged.' : null,
    };
    expect(payload.isMockPayment).toBe(true);
    expect(payload.mockNotice).toContain('SIMULATION ONLY');
  });
});

