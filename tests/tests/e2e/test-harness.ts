/**
 * SehatAI E2E Test Harness
 * 
 * Provides an opaque-box, zero-dependency test runner and assertion framework
 * compatible with Node.js, TypeScript (via tsx), and Windows environments.
 * 
 * Tracks metrics across:
 * - 4 Tiers (Tier 1: Feature, Tier 2: Boundary, Tier 3: Combinations, Tier 4: Scenarios)
 * - 4 Universal Invariants (Structural, Citation, Triage, Performance & Failover)
 */

export type InvariantType = 'structural' | 'citation' | 'triage' | 'performance_failover';
export type TierType = 'tier1_feature' | 'tier2_boundary' | 'tier3_combination' | 'tier4_scenario';

export interface TestCaseOptions {
  invariant?: InvariantType;
  tier?: TierType;
  timeoutMs?: number;
}

export interface TestCaseResult {
  suiteName: string;
  testName: string;
  passed: boolean;
  error?: Error | string;
  durationMs: number;
  invariant?: InvariantType;
  tier?: TierType;
}

export interface SuiteStats {
  total: number;
  passed: number;
  failed: number;
  durationMs: number;
  avgLatencyMs: number;
  p50LatencyMs: number;
  p95LatencyMs: number;
  tierBreakdown: Record<TierType, { total: number; passed: number; failed: number }>;
  invariantBreakdown: Record<InvariantType, { total: number; passed: number; failed: number }>;
  results: TestCaseResult[];
}

type TestFn = () => void | Promise<void>;
type HookFn = () => void | Promise<void>;

interface RegisteredSuite {
  name: string;
  fn: () => void | Promise<void>;
  tests: { name: string; fn: TestFn; options?: TestCaseOptions }[];
  beforeAllHooks: HookFn[];
  afterAllHooks: HookFn[];
  beforeEachHooks: HookFn[];
  afterEachHooks: HookFn[];
}

const registeredSuites: RegisteredSuite[] = [];
let currentSuite: RegisteredSuite | null = null;

export function describe(name: string, fn: () => void | Promise<void>) {
  const suite: RegisteredSuite = {
    name,
    fn,
    tests: [],
    beforeAllHooks: [],
    afterAllHooks: [],
    beforeEachHooks: [],
    afterEachHooks: [],
  };
  registeredSuites.push(suite);
  currentSuite = suite;
  fn();
  currentSuite = null;
}

export function test(name: string, fn: TestFn, options?: TestCaseOptions) {
  if (!currentSuite) {
    // Top-level test
    describe('Default Suite', () => {
      currentSuite!.tests.push({ name, fn, options });
    });
  } else {
    currentSuite.tests.push({ name, fn, options });
  }
}

export const it = test;

export function beforeAll(fn: HookFn) {
  if (currentSuite) currentSuite.beforeAllHooks.push(fn);
}

export function afterAll(fn: HookFn) {
  if (currentSuite) currentSuite.afterAllHooks.push(fn);
}

export function beforeEach(fn: HookFn) {
  if (currentSuite) currentSuite.beforeEachHooks.push(fn);
}

export function afterEach(fn: HookFn) {
  if (currentSuite) currentSuite.afterEachHooks.push(fn);
}

class Expectation<T> {
  private isNot = false;

  constructor(private actual: T) {}

  get not(): Expectation<T> {
    const exp = new Expectation(this.actual);
    exp.isNot = !this.isNot;
    return exp;
  }

  toBe(expected: unknown) {
    const pass = Object.is(this.actual, expected);
    if (this.isNot ? pass : !pass) {
      throw new Error(
        `Assertion Failed:\n  Expected: ${this.isNot ? 'NOT ' : ''}${JSON.stringify(expected)}\n  Received: ${JSON.stringify(this.actual)}`
      );
    }
  }

  toEqual(expected: unknown) {
    const pass = deepEqual(this.actual, expected);
    if (this.isNot ? pass : !pass) {
      throw new Error(
        `Assertion Failed (toEqual):\n  Expected: ${this.isNot ? 'NOT ' : ''}${JSON.stringify(expected, null, 2)}\n  Received: ${JSON.stringify(this.actual, null, 2)}`
      );
    }
  }

  toBeDefined() {
    const pass = this.actual !== undefined;
    if (this.isNot ? pass : !pass) {
      throw new Error(`Assertion Failed: Expected ${JSON.stringify(this.actual)} ${this.isNot ? 'to be undefined' : 'to be defined'}`);
    }
  }

  toBeUndefined() {
    const pass = this.actual === undefined;
    if (this.isNot ? pass : !pass) {
      throw new Error(`Assertion Failed: Expected ${JSON.stringify(this.actual)} ${this.isNot ? 'to NOT be undefined' : 'to be undefined'}`);
    }
  }

  toBeNull() {
    const pass = this.actual === null;
    if (this.isNot ? pass : !pass) {
      throw new Error(`Assertion Failed: Expected ${JSON.stringify(this.actual)} ${this.isNot ? 'to NOT be null' : 'to be null'}`);
    }
  }

  toBeTruthy() {
    const pass = Boolean(this.actual);
    if (this.isNot ? pass : !pass) {
      throw new Error(`Assertion Failed: Expected ${JSON.stringify(this.actual)} ${this.isNot ? 'to be falsy' : 'to be truthy'}`);
    }
  }

  toBeFalsy() {
    const pass = !Boolean(this.actual);
    if (this.isNot ? pass : !pass) {
      throw new Error(`Assertion Failed: Expected ${JSON.stringify(this.actual)} ${this.isNot ? 'to be truthy' : 'to be falsy'}`);
    }
  }

  toContain(item: unknown) {
    let pass = false;
    if (typeof this.actual === 'string' && typeof item === 'string') {
      pass = this.actual.includes(item);
    } else if (Array.isArray(this.actual)) {
      pass = this.actual.includes(item);
    } else if (this.actual instanceof Set) {
      pass = this.actual.has(item);
    }
    if (this.isNot ? pass : !pass) {
      throw new Error(
        `Assertion Failed (toContain):\n  Target: ${JSON.stringify(this.actual)}\n  Expected ${this.isNot ? 'NOT ' : ''}to contain: ${JSON.stringify(item)}`
      );
    }
  }

  toMatch(pattern: RegExp | string) {
    let pass = false;
    if (typeof this.actual === 'string') {
      if (typeof pattern === 'string') {
        pass = this.actual.includes(pattern);
      } else if (pattern instanceof RegExp) {
        pass = pattern.test(this.actual);
      }
    }
    if (this.isNot ? pass : !pass) {
      throw new Error(
        `Assertion Failed (toMatch):\n  Target: ${JSON.stringify(this.actual)}\n  Expected ${this.isNot ? 'NOT ' : ''}to match pattern: ${pattern.toString()}`
      );
    }
  }

  toBeGreaterThan(num: number) {
    const pass = typeof this.actual === 'number' && this.actual > num;
    if (this.isNot ? pass : !pass) {
      throw new Error(`Assertion Failed: Expected ${this.actual} ${this.isNot ? '<=' : '>'} ${num}`);
    }
  }

  toBeGreaterThanOrEqual(num: number) {
    const pass = typeof this.actual === 'number' && this.actual >= num;
    if (this.isNot ? pass : !pass) {
      throw new Error(`Assertion Failed: Expected ${this.actual} ${this.isNot ? '<' : '>='} ${num}`);
    }
  }

  toBeLessThan(num: number) {
    const pass = typeof this.actual === 'number' && this.actual < num;
    if (this.isNot ? pass : !pass) {
      throw new Error(`Assertion Failed: Expected ${this.actual} ${this.isNot ? '>=' : '<'} ${num}`);
    }
  }

  toBeLessThanOrEqual(num: number) {
    const pass = typeof this.actual === 'number' && this.actual <= num;
    if (this.isNot ? pass : !pass) {
      throw new Error(`Assertion Failed: Expected ${this.actual} ${this.isNot ? '>' : '<='} ${num}`);
    }
  }

  toHaveLength(length: number) {
    const actualLen = (this.actual as any)?.length ?? (this.actual as any)?.size;
    const pass = actualLen === length;
    if (this.isNot ? pass : !pass) {
      throw new Error(
        `Assertion Failed (toHaveLength):\n  Target length: ${actualLen}\n  Expected length ${this.isNot ? 'NOT ' : ''}to be: ${length}`
      );
    }
  }

  toThrow(expectedMsg?: string | RegExp) {
    if (typeof this.actual !== 'function') {
      throw new Error(`toThrow requires a function target, received ${typeof this.actual}`);
    }
    let threw = false;
    let caughtErr: any = null;
    try {
      (this.actual as any)();
    } catch (err) {
      threw = true;
      caughtErr = err;
    }

    if (!threw && !this.isNot) {
      throw new Error('Assertion Failed: Expected function to throw an error, but it did not throw.');
    }
    if (threw && this.isNot) {
      throw new Error(`Assertion Failed: Expected function NOT to throw, but it threw: ${caughtErr?.message || caughtErr}`);
    }
    if (threw && expectedMsg && !this.isNot) {
      const msg = caughtErr?.message || String(caughtErr);
      const matches = expectedMsg instanceof RegExp ? expectedMsg.test(msg) : msg.includes(expectedMsg);
      if (!matches) {
        throw new Error(
          `Assertion Failed: Expected thrown message to match ${expectedMsg.toString()}, got: "${msg}"`
        );
      }
    }
  }
}

export function expect<T>(actual: T): Expectation<T> {
  return new Expectation(actual);
}

function deepEqual(a: any, b: any): boolean {
  if (Object.is(a, b)) return true;
  if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object') return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;

  if (Array.isArray(a)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false;
    }
    return true;
  }

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (!Object.prototype.hasOwnProperty.call(b, key)) return false;
    if (!deepEqual(a[key], b[key])) return false;
  }
  return true;
}

export async function runAllRegisteredSuites(): Promise<SuiteStats> {
  const startTime = Date.now();
  const results: TestCaseResult[] = [];

  const tierBreakdown: Record<TierType, { total: number; passed: number; failed: number }> = {
    tier1_feature: { total: 0, passed: 0, failed: 0 },
    tier2_boundary: { total: 0, passed: 0, failed: 0 },
    tier3_combination: { total: 0, passed: 0, failed: 0 },
    tier4_scenario: { total: 0, passed: 0, failed: 0 },
  };

  const invariantBreakdown: Record<InvariantType, { total: number; passed: number; failed: number }> = {
    structural: { total: 0, passed: 0, failed: 0 },
    citation: { total: 0, passed: 0, failed: 0 },
    triage: { total: 0, passed: 0, failed: 0 },
    performance_failover: { total: 0, passed: 0, failed: 0 },
  };

  console.log('\n' + '='.repeat(70));
  console.log('  SehatAI — Universal Invariants & 4-Tier Automated Test Runner');
  console.log('='.repeat(70) + '\n');

  for (const suite of registeredSuites) {
    console.log(`\x1b[36m▶ Suite: ${suite.name}\x1b[0m`);

    for (const hook of suite.beforeAllHooks) {
      await hook();
    }

    for (const tc of suite.tests) {
      for (const hook of suite.beforeEachHooks) {
        await hook();
      }

      const tStart = Date.now();
      let passed = true;
      let error: Error | string | undefined;

      try {
        const timeoutMs = tc.options?.timeoutMs ?? 50000;
        await Promise.race([
          Promise.resolve(tc.fn()),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error(`Test timed out after ${timeoutMs}ms`)), timeoutMs)
          ),
        ]);
      } catch (err: any) {
        passed = false;
        error = err;
      }

      const durationMs = Date.now() - tStart;

      const result: TestCaseResult = {
        suiteName: suite.name,
        testName: tc.name,
        passed,
        error,
        durationMs,
        invariant: tc.options?.invariant,
        tier: tc.options?.tier,
      };

      results.push(result);

      if (tc.options?.tier) {
        tierBreakdown[tc.options.tier].total++;
        if (passed) tierBreakdown[tc.options.tier].passed++;
        else tierBreakdown[tc.options.tier].failed++;
      }

      if (tc.options?.invariant) {
        invariantBreakdown[tc.options.invariant].total++;
        if (passed) invariantBreakdown[tc.options.invariant].passed++;
        else invariantBreakdown[tc.options.invariant].failed++;
      }

      const statusIcon = passed ? '\x1b[32m✔ PASS\x1b[0m' : '\x1b[31m✖ FAIL\x1b[0m';
      const meta = [
        tc.options?.tier ? `[${tc.options.tier.toUpperCase()}]` : '',
        tc.options?.invariant ? `[INV:${tc.options.invariant}]` : '',
        `(${durationMs}ms)`,
      ]
        .filter(Boolean)
        .join(' ');

      console.log(`  ${statusIcon} ${tc.name} \x1b[90m${meta}\x1b[0m`);

      if (!passed) {
        console.error(`     \x1b[31mError:\x1b[0m ${error instanceof Error ? error.stack || error.message : String(error)}`);
      }

      for (const hook of suite.afterEachHooks) {
        await hook();
      }
    }

    for (const hook of suite.afterAllHooks) {
      await hook();
    }
    console.log('');
  }

  const totalDurationMs = Date.now() - startTime;
  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.filter((r) => !r.passed).length;

  const latencies = results.map((r) => r.durationMs).sort((a, b) => a - b);
  const avgLatencyMs = latencies.length > 0 ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 0;
  const p50LatencyMs = latencies[Math.floor(latencies.length * 0.5)] ?? 0;
  const p95LatencyMs = latencies[Math.floor(latencies.length * 0.95)] ?? 0;

  const stats: SuiteStats = {
    total: results.length,
    passed: passedCount,
    failed: failedCount,
    durationMs: totalDurationMs,
    avgLatencyMs,
    p50LatencyMs,
    p95LatencyMs,
    tierBreakdown,
    invariantBreakdown,
    results,
  };

  printReport(stats);
  return stats;
}

function printReport(stats: SuiteStats) {
  console.log('='.repeat(70));
  console.log('                     EXECUTION SUMMARY REPORT');
  console.log('='.repeat(70));
  console.log(`Total Tests:    ${stats.total}`);
  console.log(`Passed:         \x1b[32m${stats.passed}\x1b[0m`);
  console.log(`Failed:         ${stats.failed > 0 ? `\x1b[31m${stats.failed}\x1b[0m` : '\x1b[32m0\x1b[0m'}`);
  console.log(`Total Runtime:  ${stats.durationMs}ms`);
  console.log(`Latency Stats:  Avg=${stats.avgLatencyMs.toFixed(1)}ms | P50=${stats.p50LatencyMs}ms | P95=${stats.p95LatencyMs}ms`);
  console.log('-'.repeat(70));
  console.log('4-TIER COVERAGE BREAKDOWN:');
  console.log(`  Tier 1 (Feature Coverage):        ${stats.tierBreakdown.tier1_feature.passed}/${stats.tierBreakdown.tier1_feature.total} passed`);
  console.log(`  Tier 2 (Boundary & Corner Cases): ${stats.tierBreakdown.tier2_boundary.passed}/${stats.tierBreakdown.tier2_boundary.total} passed`);
  console.log(`  Tier 3 (Cross-Combinations):     ${stats.tierBreakdown.tier3_combination.passed}/${stats.tierBreakdown.tier3_combination.total} passed`);
  console.log(`  Tier 4 (Real-World Scenarios):   ${stats.tierBreakdown.tier4_scenario.passed}/${stats.tierBreakdown.tier4_scenario.total} passed`);
  console.log('-'.repeat(70));
  console.log('4 UNIVERSAL INVARIANTS STATUS:');
  console.log(`  1. Structural Role Isolation:     ${stats.invariantBreakdown.structural.passed}/${stats.invariantBreakdown.structural.total} passed`);
  console.log(`  2. Strict Token-Boundary RAG:     ${stats.invariantBreakdown.citation.passed}/${stats.invariantBreakdown.citation.total} passed`);
  console.log(`  3. Chief Complaint vs Danger:     ${stats.invariantBreakdown.triage.passed}/${stats.invariantBreakdown.triage.total} passed`);
  console.log(`  4. Multi-Provider & Failover:     ${stats.invariantBreakdown.performance_failover.passed}/${stats.invariantBreakdown.performance_failover.total} passed`);
  console.log('='.repeat(70));

  if (stats.failed === 0) {
    console.log('\x1b[32m🎉 ALL UNIVERSAL INVARIANTS AND TIERS VERIFIED SUCCESSFULLY!\x1b[0m\n');
  } else {
    console.log(`\x1b[31m❌ VERIFICATION FAILED: ${stats.failed} test(s) encountered defects.\x1b[0m\n`);
  }
}
