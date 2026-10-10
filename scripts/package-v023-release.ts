// scripts/package-v023-release.ts
// Packages standalone release v0.2.3 for ARM64 Linux deployment.
// 1. Copies .next/static into .next/standalone/.next/static
// 2. Copies public into .next/standalone/public
// 3. Verifies Linux ARM64 Prisma query engine
// 4. Purges all sensitive files (.env, certs, temp, backups) from standalone folder
// 5. Compresses into deploy/sehatai-staging-v0.2.3-arm64-standalone.tar.gz
// 6. Computes SHA256 checksum into deploy/sehatai-staging-v0.2.3-arm64-standalone.tar.gz.sha256

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execSync } from 'node:child_process';

const ROOT = process.cwd();
const STANDALONE = path.join(ROOT, '.next', 'standalone');
const DEPLOY_DIR = path.join(ROOT, 'deploy');
const TAR_NAME = 'sehatai-staging-v0.2.3-arm64-standalone.tar.gz';
const TAR_PATH = path.join(DEPLOY_DIR, TAR_NAME);
const SHA_PATH = `${TAR_PATH}.sha256`;

console.log('======================================================================');
console.log('==> PACKAGING SEHATAI STAGING v0.2.3 ARM64 STANDALONE RELEASE');
console.log('======================================================================\n');

if (!fs.existsSync(STANDALONE)) {
  throw new Error(`Standalone directory does not exist: ${STANDALONE}`);
}

// 1. Copy .next/static to .next/standalone/.next/static
const staticSrc = path.join(ROOT, '.next', 'static');
const staticDst = path.join(STANDALONE, '.next', 'static');
console.log('==> Copying static assets (.next/static -> .next/standalone/.next/static)...');
fs.cpSync(staticSrc, staticDst, { recursive: true });
console.log('✓ Static assets copied.');

// 2. Copy public to .next/standalone/public
const publicSrc = path.join(ROOT, 'public');
const publicDst = path.join(STANDALONE, 'public');
console.log('==> Copying public directory (public -> .next/standalone/public)...');
fs.cpSync(publicSrc, publicDst, { recursive: true });
console.log('✓ Public directory copied.');

// 3. Verify Linux ARM64 engine
const arm64Engine = path.join(STANDALONE, 'node_modules', '.prisma', 'client', 'libquery_engine-linux-arm64-openssl-3.0.x.so.node');
if (!fs.existsSync(arm64Engine)) {
  const srcEngine = path.join(ROOT, 'node_modules', 'prisma', 'libquery_engine-linux-arm64-openssl-3.0.x.so.node');
  if (fs.existsSync(srcEngine)) {
    console.log('==> Copying ARM64 query engine from node_modules/prisma...');
    fs.mkdirSync(path.dirname(arm64Engine), { recursive: true });
    fs.copyFileSync(srcEngine, arm64Engine);
  } else {
    throw new Error('Linux ARM64 Prisma engine not found!');
  }
}
const engineStat = fs.statSync(arm64Engine);
console.log(`✓ Linux ARM64 Prisma query engine verified: ${engineStat.size} bytes.`);

// 4. Scrub sensitive files, temp dirs, certs, backups, and .env files from standalone folder
console.log('\n==> Scrubbing sensitive files & extraneous directories from standalone folder...');
const sensitiveEntries = [
  path.join(STANDALONE, '.env'),
  path.join(STANDALONE, '.env.local'),
  path.join(STANDALONE, '.env.staging'),
  path.join(STANDALONE, '.env.production'),
  path.join(STANDALONE, 'certs'),
  path.join(STANDALONE, 'temp'),
  path.join(STANDALONE, 'backups'),
  path.join(STANDALONE, 'deploy'),
];

for (const p of sensitiveEntries) {
  if (fs.existsSync(p)) {
    console.log(`  - Removing: ${path.relative(STANDALONE, p)}`);
    fs.rmSync(p, { recursive: true, force: true });
  }
}

// Recursive scan to remove any nested .env, .key, .pem, .crt, .csr files
function cleanLeaks(dir: string) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      cleanLeaks(full);
    } else {
      const lower = entry.name.toLowerCase();
      if (
        lower.startsWith('.env') ||
        lower.endsWith('.key') ||
        lower.endsWith('.pem') ||
        lower.endsWith('.crt') ||
        lower.endsWith('.csr')
      ) {
        console.log(`  - Removing leaked file: ${path.relative(STANDALONE, full)}`);
        fs.rmSync(full, { force: true });
      }
    }
  }
}
cleanLeaks(STANDALONE);
console.log('✓ Sensitive scrubbing complete.');

// 5. Ensure deploy directory exists
if (!fs.existsSync(DEPLOY_DIR)) {
  fs.mkdirSync(DEPLOY_DIR, { recursive: true });
}

// 6. Create tar.gz archive
console.log(`\n==> Creating tarball: ${TAR_PATH}...`);
if (fs.existsSync(TAR_PATH)) {
  fs.rmSync(TAR_PATH, { force: true });
}

// Use bsdtar with standard flags
execSync(`tar -czf "${TAR_PATH}" -C "${STANDALONE}" .`, { stdio: 'inherit' });
const tarStat = fs.statSync(TAR_PATH);
console.log(`✓ Release archive created: ${tarStat.size} bytes (${(tarStat.size / 1024 / 1024).toFixed(2)} MB).`);

// 7. Compute SHA256 checksum
console.log('\n==> Computing SHA256 checksum...');
const fileBuffer = fs.readFileSync(TAR_PATH);
const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
const checksumContent = `${hash}  ${TAR_NAME}\n`;
fs.writeFileSync(SHA_PATH, checksumContent, 'utf8');
console.log(`✓ SHA256: ${hash}`);
console.log(`✓ Written to: ${SHA_PATH}\n`);

console.log('======================================================================');
console.log('==> RELEASE PACKAGING COMPLETE: PASSED');
console.log('======================================================================');
