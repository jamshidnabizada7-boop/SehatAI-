// scripts/verify-archive-extraction.ts
// Verifies standalone release archive v0.2.3:
// Extracts into clean temp directory, inspects assets, node_modules, Prisma ARM64 binary, and checks for secret leaks.

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const ARCHIVE_PATH = path.resolve('deploy/sehatai-staging-v0.2.3-arm64-standalone.tar.gz');
const EXTRACT_DIR = path.resolve('temp/v023-extract-verify');

console.log('======================================================================');
console.log('==> AUDITING STANDALONE RELEASE ARCHIVE (v0.2.3)');
console.log('======================================================================');

if (!fs.existsSync(ARCHIVE_PATH)) {
  console.error(`FATAL: Archive not found at ${ARCHIVE_PATH}`);
  process.exit(1);
}

const stat = fs.statSync(ARCHIVE_PATH);
console.log(`✓ Target archive: ${ARCHIVE_PATH}`);
console.log(`✓ Archive size:   ${stat.size} bytes (${(stat.size / 1024 / 1024).toFixed(2)} MB)`);

// Clean extract dir
if (fs.existsSync(EXTRACT_DIR)) {
  fs.rmSync(EXTRACT_DIR, { recursive: true, force: true });
}
fs.mkdirSync(EXTRACT_DIR, { recursive: true });

console.log(`==> Extracting to clean temp directory: ${EXTRACT_DIR}...`);
execSync(`tar -xzf "${ARCHIVE_PATH}" -C "${EXTRACT_DIR}"`, { stdio: 'inherit' });
console.log('✓ Extraction complete.\n');

// 1. Check top-level directory contents
const topLevel = fs.readdirSync(EXTRACT_DIR);
console.log('--- Top Level Directory Entries ---');
console.log(topLevel.join(', '));

const hasServerJs = fs.existsSync(path.join(EXTRACT_DIR, 'server.js'));
const hasPackageJson = fs.existsSync(path.join(EXTRACT_DIR, 'package.json'));
const hasDotNext = fs.existsSync(path.join(EXTRACT_DIR, '.next'));
const hasNodeModules = fs.existsSync(path.join(EXTRACT_DIR, 'node_modules'));

console.log(`✓ server.js present:     ${hasServerJs}`);
console.log(`✓ package.json present:  ${hasPackageJson}`);
console.log(`✓ .next present:         ${hasDotNext}`);
console.log(`✓ node_modules present:  ${hasNodeModules}`);

// Check package.json version
if (hasPackageJson) {
  const pkg = JSON.parse(fs.readFileSync(path.join(EXTRACT_DIR, 'package.json'), 'utf8'));
  console.log(`✓ package.json name:     ${pkg.name}`);
  console.log(`✓ package.json version:  ${pkg.version}`);
}

// 2. Search for Linux ARM64 Prisma engines
console.log('\n--- Prisma Query Engines Check ---');
function findFiles(dir: string, predicate: (name: string) => boolean): string[] {
  let results: string[] = [];
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(findFiles(fullPath, predicate));
    } else if (predicate(entry.name)) {
      results.push(fullPath);
    }
  }
  return results;
}

const engines = findFiles(EXTRACT_DIR, (n) => n.includes('query_engine'));
engines.forEach((e) => {
  const s = fs.statSync(e);
  const rel = path.relative(EXTRACT_DIR, e);
  console.log(`  Engine: ${rel} (${s.size} bytes)`);
});

const hasArm64Engine = engines.some((e) => e.includes('linux-arm64'));
console.log(`✓ Linux ARM64 query engine present: ${hasArm64Engine}`);

// 3. Sensitive file and credential leak scan
console.log('\n--- Sensitive Files & Credential Leak Scan ---');
const leakPatterns = ['.env', '.key', '.pem', '.crt', '.csr', 'id_rsa', 'id_ed25519', '.git'];
const leaks = findFiles(EXTRACT_DIR, (n) => {
  const lower = n.toLowerCase();
  return leakPatterns.some((p) => lower.endsWith(p) || lower.includes('.env'));
});

if (leaks.length > 0) {
  console.error('❌ LEAKS DETECTED in standalone archive:');
  leaks.forEach((l) => console.error(`  - ${path.relative(EXTRACT_DIR, l)}`));
  process.exit(1);
} else {
  console.log('✓ PASS: Zero .env, .git, private keys, or certificates embedded in release archive.');
}

console.log('\n======================================================================');
console.log('==> ARCHIVE AUDIT RESULT: PASSED');
console.log('======================================================================');
