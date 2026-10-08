// ============================================================
// Care Connect §6 — money must use integer minor units.
// NEVER store monetary value as floating point. All arithmetic
// on minor units happens here so rounding policy is explicit
// (banker's-free: integer floor at allocation boundaries).
// ============================================================

export interface Money {
  amountMinor: number;
  currency: string;
}

// Known zero-decimal and 2-decimal currencies used by target markets.
const ZERO_DECIMAL = new Set(['JPY', 'KRW', 'VND', 'CLP']);
const THREE_DECIMAL = new Set(['BHD', 'JOD', 'KWD', 'OMR', 'TND']);

export function minorUnitsFor(currency: string): number {
  const c = currency.toUpperCase();
  if (ZERO_DECIMAL.has(c)) return 1;
  if (THREE_DECIMAL.has(c)) return 1000;
  return 100;
}

export function toMinor(major: number, currency: string): number {
  if (!Number.isFinite(major)) throw new Error('INVALID_AMOUNT');
  return Math.round(major * minorUnitsFor(currency));
}

export function toMajor(amountMinor: number, currency: string): number {
  return amountMinor / minorUnitsFor(currency);
}

export function formatMoney(money: Money): string {
  const major = toMajor(money.amountMinor, money.currency);
  const decimals = minorUnitsFor(money.currency) === 1 ? 0 : minorUnitsFor(money.currency) === 1000 ? 3 : 2;
  return `${money.currency} ${major.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

export function assertSameCurrency(a: Money, b: Money): void {
  if (a.currency.toUpperCase() !== b.currency.toUpperCase()) {
    throw new Error(`CURRENCY_MISMATCH: ${a.currency} vs ${b.currency}`);
  }
}

export function addMoney(a: Money, b: Money): Money {
  assertSameCurrency(a, b);
  return { amountMinor: a.amountMinor + b.amountMinor, currency: a.currency };
}

export function subMoney(a: Money, b: Money): Money {
  assertSameCurrency(a, b);
  return { amountMinor: a.amountMinor - b.amountMinor, currency: a.currency };
}

/**
 * Split `total` into `parts` integer minor units without losing or
 * creating a single minor unit (largest-remainder on the last part).
 * Used for commission splits; fee goes to the platform, remainder to doctor.
 */
export function splitMoney(total: number, bps: number): { partMinor: number; restMinor: number } {
  if (bps < 0 || bps > 10000) throw new Error('INVALID_BPS');
  const partMinor = Math.floor((total * bps) / 10000);
  return { partMinor, restMinor: total - partMinor };
}

export function isPositiveIntegerMinor(n: unknown): n is number {
  return typeof n === 'number' && Number.isInteger(n) && n > 0;
}
