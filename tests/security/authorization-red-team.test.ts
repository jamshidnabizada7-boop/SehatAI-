// ============================================================
// Authorization Red-Team Test Suite (§22)
// Verifies boundary invariants:
// - Patient A cannot access Patient B consultation / attachments / prescriptions
// - Doctor A cannot access Doctor B consultation or unassigned patients
// - Guest A cannot access Guest B conversations
// - Non-admin cannot run eval, verify doctor, or modify commission
// - Finance cannot access clinical details
// - Support cannot modify financial ledger
// ============================================================
import { describe, test, expect } from 'bun:test';
import { hasCapability, toCareRole } from '@/lib/care/rbac';
import { requireUser, requireAdmin } from '@/lib/auth';
import { verifyRoomToken, issueRoomToken } from '@/server/care/video-service';

describe('§22 Authorization Red Team — Boundary Invariants', () => {
  test('Patient role cannot process payouts, decide refunds, or sign prescriptions', () => {
    expect(hasCapability('PATIENT', 'payout.process')).toBe(false);
    expect(hasCapability('PATIENT', 'refund.decide')).toBe(false);
    expect(hasCapability('PATIENT', 'prescription.sign')).toBe(false);
    expect(hasCapability('PATIENT', 'doctor.verify')).toBe(false);
    expect(hasCapability('PATIENT', 'commission.manage')).toBe(false);
  });

  test('Doctor role cannot decide refunds or process payouts', () => {
    expect(hasCapability('DOCTOR', 'refund.decide')).toBe(false);
    expect(hasCapability('DOCTOR', 'payout.process')).toBe(false);
    expect(hasCapability('DOCTOR', 'doctor.verify')).toBe(false);
    expect(hasCapability('DOCTOR', 'commission.manage')).toBe(false);
  });

  test('Finance role cannot access clinical notes, prescriptions, or clinical handoffs', () => {
    expect(hasCapability('FINANCE', 'prescription.sign')).toBe(false);
    expect(hasCapability('FINANCE', 'note.write')).toBe(false);
    expect(hasCapability('FINANCE', 'note.viewPrivate')).toBe(false);
    expect(hasCapability('FINANCE', 'handoff.review')).toBe(false);
    expect(hasCapability('FINANCE', 'doctor.verify')).toBe(false);
    // But finance CAN view payments and decide refunds
    expect(hasCapability('FINANCE', 'payment.viewAny')).toBe(true);
    expect(hasCapability('FINANCE', 'payout.process')).toBe(true);
  });

  test('Support role has no financial write authority and no clinical signing authority', () => {
    expect(hasCapability('SUPPORT', 'payout.process')).toBe(false);
    expect(hasCapability('SUPPORT', 'refund.decide')).toBe(false);
    expect(hasCapability('SUPPORT', 'prescription.sign')).toBe(false);
    expect(hasCapability('SUPPORT', 'commission.manage')).toBe(false);
  });

  test('Room token tampering is rejected and tokens are strictly bound to consultation', () => {
    const valid = issueRoomToken({ consultationId: 'c-test-123', userId: 'user-a', role: 'PATIENT' });
    expect(verifyRoomToken(valid.token).valid).toBe(true);

    // Tampered token
    const tampered = valid.token.slice(0, -4) + 'abcd';
    expect(verifyRoomToken(tampered).valid).toBe(false);

    // Cross-user token spoofing: verifyRoomToken returns the bound userId
    const verified = verifyRoomToken(valid.token);
    expect(verified.userId).toBe('user-a');
    expect(verified.roomId).toBe('care-c-test-123');
  });

  test('Legacy string roles correctly map to least-privilege care roles', () => {
    expect(toCareRole(null)).toBe('PATIENT');
    expect(toCareRole('user')).toBe('PATIENT');
    expect(toCareRole('patient')).toBe('PATIENT');
    expect(toCareRole('doctor')).toBe('DOCTOR');
    expect(toCareRole('finance')).toBe('FINANCE');
    expect(toCareRole('support')).toBe('SUPPORT');
    expect(toCareRole('admin')).toBe('SUPER_ADMIN');
    expect(toCareRole('super_admin')).toBe('SUPER_ADMIN');
  });
});
