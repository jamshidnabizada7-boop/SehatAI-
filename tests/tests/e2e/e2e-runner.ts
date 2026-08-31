/**
 * SehatAI E2E Master Test Runner
 * 
 * Executes all 4 Tiers and Universal Invariants suites:
 * - Tier 1: Feature Coverage (R1, R2, R3, R4)
 * - Tier 2: Boundary & Corner Cases (empty, extreme, non-corpus, 429, timeouts)
 * - Tier 3: Cross-Feature Combinations (pairwise & multi-turn combinations)
 * - Tier 4: Real-World Application Scenarios (10 canonical scenarios)
 * - Master Suite: Universal Invariants Verification
 * 
 * Execution:
 *   npx tsx tests/e2e/e2e-runner.ts
 */

import { runAllRegisteredSuites } from './test-harness';
import { registerTier1Tests } from './tier1-feature-coverage.test';
import { registerTier2Tests } from './tier2-boundary-corner.test';
import { registerTier3Tests } from './tier3-cross-combinations.test';
import { registerTier4Tests } from './tier4-application-scenarios.test';
import { registerUniversalInvariantsTests } from './universal-invariants.test';

async function main() {
  console.log('\n[SehatAI E2E] Initializing Test Suites...');

  registerTier1Tests();
  registerTier2Tests();
  registerTier3Tests();
  registerTier4Tests();
  registerUniversalInvariantsTests();

  const stats = await runAllRegisteredSuites();

  if (stats.failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('\n[SehatAI E2E] Fatal runner error:', err);
  process.exit(1);
});
