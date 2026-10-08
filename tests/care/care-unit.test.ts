// Care Connect Phase 18 — pure unit tests (no DB).
// Run: bun test tests/care/care-unit.test.ts
import { describe, expect, test } from 'bun:test';
import { toMinor, toMajor, splitMoney, formatMoney, assertSameCurrency, addMoney, isPositiveIntegerMinor } from '../../src/lib/care/money';
import { CONSULTATION_TRANSITIONS, PAYMENT_TRANSITIONS, PAYOUT_TRANSITIONS, REFUND_TRANSITIONS, DOCTOR_CARE_TRANSITIONS, assertTransition, isTerminal } from '../../src/lib/care/constants';
import { hasCapability, toCareRole, capabilitiesFor } from '../../src/lib/care/rbac';
import { classifySpecialty, classifyFromPipelineSignals, CARE_SPECIALTIES } from '../../src/lib/care/specialties';
import { robustRating } from '../../src/server/care/marketplace';
import { scanContactInfo } from '../../src/server/care/messaging-service';
import { scanRiskTerms } from '../../src/server/care/translation-service';
import { verifyTotp, generateTotpSecret, totpCode } from '../../src/lib/care/totp';
import { verifyRoomToken, issueRoomToken } from '../../src/server/care/video-service';
import { careRolloutStage, rolloutAllowsStage, ENV_DEFAULTS } from '../../src/lib/care/flags';

describe('§6 money — integer minor units', () => {
  test('toMinor/toMajor roundtrip for 2-decimal currencies', () => {
    expect(toMinor(10.99, 'USD')).toBe(1099);
    expect(toMajor(1099, 'USD')).toBe(10.99);
    expect(toMinor(500, 'PKR')).toBe(50000);
  });
  test('zero-decimal and 3-decimal currencies', () => {
    expect(toMinor(5, 'JPY')).toBe(5);
    expect(toMinor(1.234, 'BHD')).toBe(1234);
  });
  test('splitMoney: 20% of 1000 = 200/800, never loses a unit', () => {
    expect(splitMoney(1000, 2000)).toEqual({ partMinor: 200, restMinor: 800 });
    expect(splitMoney(999, 2000)).toEqual({ partMinor: 199, restMinor: 800 }); // 199+800=999
    expect(splitMoney(1, 2000)).toEqual({ partMinor: 0, restMinor: 1 });
  });
  test('bps bounds enforced', () => {
    expect(() => splitMoney(100, 10001)).toThrow('INVALID_BPS');
    expect(() => splitMoney(100, -1)).toThrow('INVALID_BPS');
  });
  test('currency mismatch throws; formatting stable', () => {
    expect(() => assertSameCurrency({ amountMinor: 1, currency: 'PKR' }, { amountMinor: 1, currency: 'USD' })).toThrow('CURRENCY_MISMATCH');
    expect(addMoney({ amountMinor: 100, currency: 'PKR' }, { amountMinor: 50, currency: 'PKR' }).amountMinor).toBe(150);
    expect(formatMoney({ amountMinor: 1099, currency: 'USD' })).toContain('10.99');
    expect(isPositiveIntegerMinor(5)).toBe(true);
    expect(isPositiveIntegerMinor(5.5)).toBe(false);
    expect(isPositiveIntegerMinor(-5)).toBe(false);
  });
});

describe('§3/§11/§13/§14 state machines', () => {
  test('happy path is walkable', () => {
    const path = ['DRAFT', 'PAYMENT_PENDING', 'PAID', 'REQUESTED', 'DOCTOR_ACCEPTED', 'SCHEDULED', 'WAITING', 'IN_PROGRESS', 'COMPLETED'] as const;
    for (let i = 0; i < path.length - 1; i++) {
      expect(() => assertTransition(CONSULTATION_TRANSITIONS, path[i], path[i + 1])).not.toThrow();
    }
  });
  test('illegal jumps rejected', () => {
    expect(() => assertTransition(CONSULTATION_TRANSITIONS, 'DRAFT', 'COMPLETED')).toThrow('ILLEGAL_TRANSITION');
    expect(() => assertTransition(CONSULTATION_TRANSITIONS, 'COMPLETED', 'DRAFT')).toThrow();
    expect(() => assertTransition(PAYMENT_TRANSITIONS, 'CREATED', 'PAID')).toThrow();
    expect(() => assertTransition(PAYOUT_TRANSITIONS, 'PENDING', 'PAID')).toThrow(); // must pass PROCESSING
  });
  test('cancellation and refund paths', () => {
    expect(() => assertTransition(CONSULTATION_TRANSITIONS, 'REQUESTED', 'PATIENT_CANCELLED')).not.toThrow();
    expect(() => assertTransition(CONSULTATION_TRANSITIONS, 'PATIENT_CANCELLED', 'REFUND_PENDING')).not.toThrow();
    expect(() => assertTransition(REFUND_TRANSITIONS, 'REQUESTED', 'REFUNDED')).toThrow(); // must pass REFUND_PENDING
  });
  test('TEXT consultation can complete from WAITING', () => {
    expect(() => assertTransition(CONSULTATION_TRANSITIONS, 'WAITING', 'COMPLETED')).not.toThrow();
  });
  test('terminal states', () => {
    expect(isTerminal(PAYOUT_TRANSITIONS, 'REVERSED')).toBe(true);
    expect(isTerminal(REFUND_TRANSITIONS, 'REFUNDED')).toBe(true);
    expect(isTerminal(PAYMENT_TRANSITIONS, 'CHARGEDBACK')).toBe(true);
  });
  test('doctor care states gate patient flow', () => {
    expect(() => assertTransition(DOCTOR_CARE_TRANSITIONS, 'PENDING_VERIFICATION', 'ACTIVE')).toThrow();
    expect(() => assertTransition(DOCTOR_CARE_TRANSITIONS, 'VERIFIED', 'ACTIVE')).not.toThrow();
    expect(() => assertTransition(DOCTOR_CARE_TRANSITIONS, 'ACTIVE', 'SUSPENDED')).not.toThrow();
  });
});

describe('§52/§53 RBAC least privilege', () => {
  test('patients cannot process payouts or sign prescriptions', () => {
    expect(hasCapability('user', 'payout.process')).toBe(false);
    expect(hasCapability('user', 'prescription.sign')).toBe(false);
    expect(hasCapability('user', 'payment.create')).toBe(true);
    expect(hasCapability('user', 'review.create')).toBe(true);
  });
  test('doctors sign prescriptions and complete consultations, cannot process refunds', () => {
    expect(hasCapability('doctor', 'prescription.sign')).toBe(true);
    expect(hasCapability('doctor', 'consultation.complete')).toBe(true);
    expect(hasCapability('doctor', 'refund.decide')).toBe(false);
  });
  test('finance handles money, not clinical content', () => {
    expect(hasCapability('finance', 'refund.decide')).toBe(true);
    expect(hasCapability('finance', 'payout.process')).toBe(true);
    expect(hasCapability('finance', 'prescription.viewAny')).toBe(false);
    expect(hasCapability('finance', 'note.viewPrivate')).toBe(false);
  });
  test('support has viewAny but no clinical or financial decision rights', () => {
    expect(hasCapability('support', 'consultation.viewAny')).toBe(true);
    expect(hasCapability('support', 'refund.decide')).toBe(false);
    expect(hasCapability('support', 'prescription.viewAny')).toBe(false);
  });
  test('role mapping is additive (legacy roles keep working)', () => {
    expect(toCareRole('admin')).toBe('SUPER_ADMIN');
    expect(toCareRole('doctor')).toBe('DOCTOR');
    expect(toCareRole('user')).toBe('PATIENT');
    expect(toCareRole('finance')).toBe('FINANCE');
    expect(capabilitiesFor('unknown-role').length).toBeGreaterThan(0); // defaults to PATIENT
  });
});

describe('§19 specialty classifier (deterministic)', () => {
  test('cardiac symptoms → Cardiology', () => {
    expect(classifySpecialty('chest pain and palpitations since morning')[0].specialty).toBe('Cardiology');
  });
  test('child fever → Pediatrics', () => {
    expect(classifySpecialty('my baby has fever and is not drinking')[0].specialty).toBe('Pediatrics');
  });
  test('Roman Urdu stomach pain → Gastroenterology', () => {
    expect(classifySpecialty('pait dard for 2 days, dast bhi')[0].specialty).toBe('Gastroenterology');
  });
  test('unknown → Family Medicine fallback', () => {
    expect(classifySpecialty('hello there')[0].specialty).toBe('Family Medicine');
  });
  test('pipeline signals boost correct specialties', () => {
    const result = classifyFromPipelineSignals({ intakeText: 'feeling weak', redFlagCategories: ['cardiac'] });
    expect(result[0].specialty).toBe('Cardiology');
    expect(CARE_SPECIALTIES.length).toBe(22);
  });
});

describe('§45 robust rating', () => {
  test('one 5-star review does not outrank hundreds of 4.9s', () => {
    const few = robustRating([{ overall: 5, createdAt: new Date() }]);
    const many = robustRating(
      Array.from({ length: 200 }, (_, i) => ({ overall: i % 10 === 0 ? 4 : 5, createdAt: new Date(Date.now() - i * 86400000) })),
    );
    expect(few.robustScore).toBeLessThan(many.robustScore);
    expect(few.count).toBe(1);
  });
  test('empty rating sits below prior (unknown doctor)', () => {
    expect(robustRating([]).robustScore).toBeLessThan(4.0);
  });
  test('old reviews decay but still count', () => {
    const old = robustRating([{ overall: 5, createdAt: new Date(Date.now() - 5 * 365 * 86400000) }]);
    expect(old.robustScore).toBeGreaterThan(3.5);
    expect(old.robustScore).toBeLessThan(5);
  });
});

describe('§61 contact-info leakage (flag, not censor)', () => {
  test('phone numbers flagged', () => {
    expect(scanContactInfo('call me at 03001234567').flagged).toBe(true);
    expect(scanContactInfo('my whatsapp is +92 300 1234567').flagged).toBe(true);
  });
  test('emails and messaging apps flagged', () => {
    expect(scanContactInfo('email me at doctor@clinic.pk').flagged).toBe(true);
    expect(scanContactInfo('find me on telegram @doc').flagged).toBe(true);
  });
  test('ordinary medical talk is NOT flagged', () => {
    expect(scanContactInfo('I have chest pain when climbing stairs').flagged).toBe(false);
    expect(scanContactInfo('the dosage is written on the pack').flagged).toBe(false);
  });
});

describe('§35 high-risk translation terms', () => {
  test('dose values and medicine names flagged', () => {
    const risks = scanRiskTerms('Take warfarin 15 mg twice a day for 7 days');
    expect(risks).toContain('dose_value');
    expect(risks).toContain('medicine_name');
    expect(risks).toContain('frequency');
    expect(risks).toContain('duration');
  });
  test('pregnancy and allergies flagged', () => {
    const risks = scanRiskTerms('I am pregnant and allergic to penicillin');
    expect(risks).toContain('pregnancy');
    expect(risks).toContain('allergy');
  });
  test('plain conversation not flagged', () => {
    expect(scanRiskTerms('thank you doctor, I feel better today')).toEqual([]);
  });
});

describe('§55 TOTP', () => {
  test('generate + verify roundtrip', () => {
    const secret = generateTotpSecret();
    const code = totpCode(secret);
    expect(verifyTotp(secret, code)).toBe(true);
  });
  test('wrong code rejected', () => {
    const secret = generateTotpSecret();
    expect(verifyTotp(secret, '000000')).toBe(false);
    expect(verifyTotp(secret, 'abc')).toBe(false);
  });
  test('drift tolerance ±30s', () => {
    const secret = generateTotpSecret();
    const future = totpCode(secret, 30, Date.now() + 30_000);
    expect(verifyTotp(secret, future)).toBe(true);
  });
});

describe('§26 room tokens (short-lived, signed)', () => {
  test('issue + verify', () => {
    const token = issueRoomToken({ consultationId: 'c1', userId: 'u1', role: 'DOCTOR' });
    const verified = verifyRoomToken(token.token);
    expect(verified.valid).toBe(true);
    expect(verified.roomId).toBe('care-c1');
    expect(verified.role).toBe('DOCTOR');
    expect(token.recording).toBe(false); // §29 recording always off
  });
  test('tampered token rejected', () => {
    const token = issueRoomToken({ consultationId: 'c1', userId: 'u1', role: 'DOCTOR' });
    expect(verifyRoomToken(token.token.slice(0, -2) + 'xx').valid).toBe(false);
  });
});

describe('§95 rollout stages', () => {
  test('stage 1 = internal team only', () => {
    expect(rolloutAllowsStage(1, { isStaff: false })).toBe(false);
    expect(rolloutAllowsStage(1, { isStaff: true })).toBe(true);
    expect(rolloutAllowsStage(3, { isStaff: false })).toBe(true);
  });
  test('default env flags keep commerce off', () => {
    expect(ENV_DEFAULTS.CARE_PAYMENTS_ENABLED).toBe(false);
    expect(ENV_DEFAULTS.CARE_PRESCRIPTIONS_ENABLED).toBe(false);
    expect(ENV_DEFAULTS.CARE_DOCTOR_PAYOUTS_ENABLED).toBe(false);
    expect(careRolloutStage()).toBe(1);
  });
});
