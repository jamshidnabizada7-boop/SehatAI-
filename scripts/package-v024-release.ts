// scripts/package-v024-release.ts
// Packages standalone release v0.2.4 for ARM64 Linux deployment.
// Fixes Next.js/Prisma standalone external module resolution by staging:
// 1. .next/static into .next/standalone/.next/static
// 2. public into .next/standalone/public
// 3. Linux ARM64 Prisma query engine into .prisma/client, @prisma/client, and @prisma/engines
// 4. Staging any Turbopack-hashed @prisma/client-<hash> directories directly so no runtime symlinks are needed
// 5. Purging Windows .dll query engines and all sensitive files (.env, certs, temp, backups, sql, keys)
// 6. Compressing into deploy/sehatai-staging-v0.2.4-arm64-standalone.tar.gz
// 7. Computing SHA256 checksum into deploy/sehatai-staging-v0.2.4-arm64-standalone.tar.gz.sha256

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execSync } from 'node:child_process';

const ROOT = process.cwd();
const STANDALONE = path.join(ROOT, '.next', 'standalone');
const DEPLOY_DIR = path.join(ROOT, 'deploy');
const TAR_NAME = 'sehatai-staging-v0.2.4-arm64-standalone.tar.gz';
const TAR_PATH = path.join(DEPLOY_DIR, TAR_NAME);
const SHA_PATH = `${TAR_PATH}.sha256`;

console.log('======================================================================');
console.log('==> PACKAGING SEHATAI STAGING v0.2.4 ARM64 STANDALONE RELEASE');
console.log('======================================================================\n');

if (!fs.existsSync(STANDALONE)) {
  throw new Error(`Standalone directory does not exist: ${STANDALONE}. Run 'bun run build' first.`);
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

// 3. Locate Linux ARM64 engine
const srcEngine = path.join(ROOT, 'node_modules', 'prisma', 'libquery_engine-linux-arm64-openssl-3.0.x.so.node');
if (!fs.existsSync(srcEngine)) {
  throw new Error(`Linux ARM64 Prisma engine not found at: ${srcEngine}`);
}
const engineBuffer = fs.readFileSync(srcEngine);
console.log(`✓ Linux ARM64 source engine found: ${engineBuffer.length} bytes.`);

// Stage into .prisma/client
const dotPrismaClient = path.join(STANDALONE, 'node_modules', '.prisma', 'client');
fs.mkdirSync(dotPrismaClient, { recursive: true });
fs.writeFileSync(path.join(dotPrismaClient, 'libquery_engine-linux-arm64-openssl-3.0.x.so.node'), engineBuffer);

// Stage into @prisma/client
const atPrismaClient = path.join(STANDALONE, 'node_modules', '@prisma', 'client');
fs.mkdirSync(atPrismaClient, { recursive: true });
fs.writeFileSync(path.join(atPrismaClient, 'libquery_engine-linux-arm64-openssl-3.0.x.so.node'), engineBuffer);

// Stage into @prisma/engines
const atPrismaEngines = path.join(STANDALONE, 'node_modules', '@prisma', 'engines');
fs.mkdirSync(atPrismaEngines, { recursive: true });
fs.writeFileSync(path.join(atPrismaEngines, 'libquery_engine-linux-arm64-openssl-3.0.x.so.node'), engineBuffer);
console.log('✓ Linux ARM64 engine staged across .prisma/client, @prisma/client, and @prisma/engines.');

// 4. Resolve and stage any Turbopack-hashed @prisma/client-<hash> directories
console.log('==> Scanning for Turbopack-hashed @prisma/client-<hash> references...');
const hashedClientNames = new Set<string>();

function findClientHashes(dir: string) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      findClientHashes(full);
    } else if (entry.name.endsWith('.js') || entry.name.endsWith('.json')) {
      try {
        const text = fs.readFileSync(full, 'utf8');
        const matches = text.match(/@prisma\/client-[a-f0-9]{8,16}/g);
        if (matches) {
          for (const m of matches) {
            const rel = m.replace('@prisma/', '');
            hashedClientNames.add(rel);
          }
        }
      } catch {}
    }
  }
}

findClientHashes(path.join(ROOT, '.next', 'server'));

console.log(`Found ${hashedClientNames.size} hashed client reference(s):`, Array.from(hashedClientNames));

for (const hashedName of hashedClientNames) {
  const targetDir = path.join(STANDALONE, 'node_modules', '@prisma', hashedName);
  console.log(`  -> Staging standalone copy: node_modules/@prisma/${hashedName}`);
  fs.cpSync(atPrismaClient, targetDir, { recursive: true });
  fs.writeFileSync(path.join(targetDir, 'libquery_engine-linux-arm64-openssl-3.0.x.so.node'), engineBuffer);
}
console.log('✓ Turbopack-hashed client module staging complete (runtime symlinks eliminated).');

// 5. Remove any Windows-specific .dll engines from standalone to reduce size and eliminate OS mismatch
console.log('\n==> Removing extraneous Windows binaries (.dll.node)...');
function removeWindowsEngines(dir: string) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      removeWindowsEngines(full);
    } else if (entry.name.endsWith('.dll.node')) {
      console.log(`  - Removing Windows binary: ${path.relative(STANDALONE, full)}`);
      fs.rmSync(full, { force: true });
    }
  }
}
removeWindowsEngines(STANDALONE);

// 6. Scrub sensitive files, temp dirs, certs, backups, and .env files from standalone folder
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
  path.join(STANDALONE, 'storage'),
  path.join(STANDALONE, 'tests'),
  path.join(STANDALONE, 'docs'),
  path.join(STANDALONE, 'examples'),
  path.join(STANDALONE, 'submission'),
];

for (const p of sensitiveEntries) {
  if (fs.existsSync(p)) {
    console.log(`  - Removing: ${path.relative(STANDALONE, p)}`);
    fs.rmSync(p, { recursive: true, force: true });
  }
}

// Recursive scan to remove any nested .env, .key, .pem, .crt, .csr, .sql, .pdf files
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
        lower.endsWith('.csr') ||
        lower.endsWith('.sql') ||
        lower.endsWith('.pdf')
      ) {
        console.log(`  - Removing leaked/extraneous file: ${path.relative(STANDALONE, full)}`);
        fs.rmSync(full, { force: true });
      }
    }
  }
}
cleanLeaks(STANDALONE);
console.log('✓ Sensitive scrubbing complete.');

// 7. Ensure deploy directory exists
if (!fs.existsSync(DEPLOY_DIR)) {
  fs.mkdirSync(DEPLOY_DIR, { recursive: true });
}

// 8. Create tar.gz archive
console.log(`\n==> Creating tarball: ${TAR_PATH}...`);
if (fs.existsSync(TAR_PATH)) {
  fs.rmSync(TAR_PATH, { force: true });
}

// Use bsdtar with standard flags
execSync(`tar -czf "${TAR_PATH}" -C "${STANDALONE}" .`, { stdio: 'inherit' });
const tarStat = fs.statSync(TAR_PATH);
console.log(`✓ Release archive created: ${tarStat.size} bytes (${(tarStat.size / 1024 / 1024).toFixed(2)} MB).`);

// 9. Compute SHA256 checksum
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
