// scripts/test-standalone-http.ts
// Real HTTP Verification Test Suite against actual Next.js 16 Standalone Server
// Verifies proxy interception, tester auth, and staging hard-blocks.

import { spawn } from 'node:child_process';
import path from 'node:path';

const PORT = 4099; // Use port 4099 to avoid any potential collision
const BASE_URL = `http://127.0.0.1:${PORT}`;
const SECRET = 'test-secret-pilot-2026';

console.log('======================================================================');
console.log('==> STARTING REAL HTTP VERIFICATION ON NEXT.JS 16 STANDALONE BUILD');
console.log('======================================================================');

const env = {
  ...process.env,
  PORT: String(PORT),
  HOSTNAME: '127.0.0.1',
  NODE_ENV: 'production',
  STAGING_AUTH_REQUIRED: 'true',
  STAGING_ACCESS_SECRET: SECRET,
  STAGING_BLOCK_BOOKING: 'true',
  STAGING_BLOCK_PAYMENTS: 'true',
  STAGING_BLOCK_UPLOADS: 'true',
  NEXTAUTH_SECRET: '32-character-secret-for-testing-only-12345',
  NEXTAUTH_URL: BASE_URL,
};

const serverProcess = spawn('node', ['.next/standalone/server.js'], {
  cwd: path.resolve(process.cwd()),
  env,
  stdio: ['ignore', 'pipe', 'pipe'],
});

serverProcess.stdout.on('data', (d) => {
  const line = d.toString().trim();
  if (line) console.log(`[STANDALONE-STDOUT] ${line}`);
});

serverProcess.stderr.on('data', (d) => {
  const line = d.toString().trim();
  if (line) console.error(`[STANDALONE-STDERR] ${line}`);
});

async function waitForServer(retries = 30): Promise<boolean> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(`${BASE_URL}/api/care/health`);
      if (res.ok) {
        console.log(`✓ Standalone server initialized and healthy on ${BASE_URL} (attempt ${i + 1})`);
        return true;
      } else {
        console.log(`Poll attempt ${i + 1}: status ${res.status}`);
        const text = await res.text();
        console.log(`Poll body: ${text.slice(0, 100)}`);
      }
    } catch (err: any) {
      // console.log(`Poll error: ${err.message}`);
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  return false;
}

async function runTests() {
  const results: { name: string; pass: boolean; status: number; expectedStatus: number; body?: any }[] = [];

  function record(name: string, status: number, expectedStatus: number, body: any) {
    const pass = status === expectedStatus;
    results.push({ name, pass, status, expectedStatus, body });
    const mark = pass ? '✓ PASS' : '✗ FAIL';
    console.log(`[${mark}] ${name} -> Got HTTP ${status} (expected ${expectedStatus})`);
  }

  // 1. Health check bypass (unauthenticated request must return 200)
  {
    const res = await fetch(`${BASE_URL}/api/care/health`);
    const data = await res.json();
    record('1. Health check exemption (/api/care/health)', res.status, 200, data);
  }

  // 2. Unauthorized request denied (401)
  {
    const res = await fetch(`${BASE_URL}/care/checkout/result`);
    const data = await res.json();
    record('2. Unauthorized request without credentials rejected (/care/checkout/result)', res.status, 401, data);
  }

  // 3. Query parameter secret strictly rejected (401) - Invariant: No query secrets
  {
    const res = await fetch(`${BASE_URL}/care/checkout/result?staging_key=${SECRET}`);
    const data = await res.json();
    record('3. Query param secret strictly rejected (no URL secrets)', res.status, 401, data);
  }

  // 4. Header-authenticated request allowed (200)
  {
    const res = await fetch(`${BASE_URL}/care/checkout/result`, {
      headers: { 'x-staging-access-key': SECRET },
    });
    record('4. Header-authenticated request allowed (x-staging-access-key)', res.status, 200, { html: res.statusText });
  }

  // 4b. Staging Unlock Web UI page is accessible without prior authentication (200)
  {
    const res = await fetch(`${BASE_URL}/staging/unlock`);
    record('4b. Staging Unlock UI page accessible (/staging/unlock)', res.status, 200, { html: res.statusText });
  }

  // 4c. Query parameter secret strictly rejected even on health check (401)
  {
    const res = await fetch(`${BASE_URL}/api/care/health?staging_key=${SECRET}`);
    const data = await res.json();
    record('4c. Query param secret strictly rejected on all routes (/api/care/health?staging_key=...)', res.status, 401, data);
  }

  // 5. Unlock endpoint (/api/staging/unlock) establishes cookie session
  let authCookie = '';
  {
    const res = await fetch(`${BASE_URL}/api/staging/unlock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stagingKey: SECRET }),
    });
    const setCookie = res.headers.get('set-cookie');
    if (setCookie && setCookie.includes('sehatai_staging_key=')) {
      authCookie = setCookie.split(';')[0];
    }
    const data = await res.json();
    record('5. Unlock endpoint sets sehatai_staging_key cookie (/api/staging/unlock)', res.status, 200, { data, hasCookie: Boolean(authCookie) });
  }

  // 6. Cookie-authenticated request allowed (200)
  {
    const res = await fetch(`${BASE_URL}/care/checkout/result`, {
      headers: { cookie: authCookie },
    });
    record('6. Cookie-authenticated request allowed (sehatai_staging_key cookie)', res.status, 200, { html: res.statusText });
  }

  // 7. Booking route hard-blocked (403)
  {
    const res = await fetch(`${BASE_URL}/api/appointments`, {
      method: 'POST',
      headers: { 'x-staging-access-key': SECRET, 'Content-Type': 'application/json' },
      body: JSON.stringify({ slotId: '123' }),
    });
    const data = await res.json();
    record('7. Legacy appointment booking hard-blocked (POST /api/appointments)', res.status, 403, data);
  }

  // 8. Care consultation booking hard-blocked (403)
  {
    const res = await fetch(`${BASE_URL}/api/care/consultations`, {
      method: 'POST',
      headers: { 'x-staging-access-key': SECRET, 'Content-Type': 'application/json' },
      body: JSON.stringify({ doctorProfileId: '123' }),
    });
    const data = await res.json();
    record('8. Consultation booking hard-blocked (POST /api/care/consultations)', res.status, 403, data);
  }

  // 9. Payment checkout route hard-blocked (403)
  {
    const res = await fetch(`${BASE_URL}/api/care/payments`, {
      method: 'POST',
      headers: { 'x-staging-access-key': SECRET, 'Content-Type': 'application/json' },
      body: JSON.stringify({ consultationId: '123' }),
    });
    const data = await res.json();
    record('9. Payment processing hard-blocked (POST /api/care/payments)', res.status, 403, data);
  }

  // 10. Doctor document upload hard-blocked (403)
  {
    const res = await fetch(`${BASE_URL}/api/doctor/upload-doc`, {
      method: 'POST',
      headers: { 'x-staging-access-key': SECRET, 'Content-Type': 'application/json' },
      body: JSON.stringify({ test: 'upload' }),
    });
    const data = await res.json();
    record('10. Doctor document upload hard-blocked (POST /api/doctor/upload-doc)', res.status, 403, data);
  }

  // 11. Vision model upload hard-blocked (403)
  {
    const res = await fetch(`${BASE_URL}/api/vlm-analyze`, {
      method: 'POST',
      headers: { 'x-staging-access-key': SECRET, 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: 'base64...' }),
    });
    const data = await res.json();
    record('11. Vision model upload hard-blocked (POST /api/vlm-analyze)', res.status, 403, data);
  }

  const allPassed = results.every((r) => r.pass);
  console.log('======================================================================');
  console.log(`==> REAL HTTP TEST RESULTS: ${results.filter((r) => r.pass).length}/${results.length} PASSED`);
  console.log('======================================================================');

  return allPassed;
}

async function main() {
  try {
    const ready = await waitForServer();
    if (!ready) {
      console.error('FATAL: Standalone server failed to start within timeout.');
      process.exit(1);
    }

    const success = await runTests();
    if (!success) {
      console.error('FATAL: One or more HTTP verification checks failed!');
      process.exit(1);
    }
    console.log('ALL REAL HTTP INTERCEPTION CHECKS ON NEXT.JS 16 STANDALONE PASSED.');
  } finally {
    console.log('Shutting down standalone test server...');
    serverProcess.kill('SIGTERM');
  }
}

main().catch((e) => {
  console.error('Execution error:', e);
  serverProcess.kill('SIGKILL');
  process.exit(1);
});
