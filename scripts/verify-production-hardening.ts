/** Production runtime verification using synthetic records in an explicitly disposable DB.
 * Run after `bun run build`. Install Playwright separately or supply PLAYWRIGHT_MODULE
 * as an absolute module path. No real accounts, providers, or infrastructure are used.
 */
import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import { createWriteStream } from 'node:fs';
import { mkdir, writeFile, readFile, cp, readdir } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { PrismaClient } from '@prisma/client';
import { encode } from 'next-auth/jwt';

const target = new URL(process.env.DATABASE_URL ?? '');
assert(['localhost', '127.0.0.1', '[::1]'].includes(target.hostname) && /test/i.test(target.pathname), 'Use a disposable loopback database with test in its name');
const db = new PrismaClient();
const port = Number(process.env.HARDENING_TEST_PORT ?? 3200);
const base = `http://127.0.0.1:${port}`;
const secret = randomBytes(48).toString('hex');
const tag = randomUUID();
const checks: { name: string; passed: boolean; detail?: string }[] = [];
await mkdir('work', { recursive: true });
const runtimeLog = createWriteStream('work/production-runtime.log');
let browser: any;
let page: any;
let server: ReturnType<typeof spawn> | undefined;
const pass = (name: string) => { checks.push({ name, passed: true }); console.log(`PASS ${name}`); };
const pause = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const cookieName = 'next-auth.session-token';
const tokenFor = (user: { id: string; email: string; role: string; accountStatus: string }) => encode({ secret, token: { id: user.id, sub: user.id, email: user.email, role: user.role, accountStatus: user.accountStatus }, maxAge: 3600 });
async function request(route: string, token?: string, body?: unknown, method?: string) {
  return fetch(base + route, { method: method ?? (body === undefined ? 'GET' : 'POST'), headers: { ...(token ? { Cookie: `${cookieName}=${token}` } : {}), ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) }, body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(45000) });
}
async function status(route: string, expected: number, token?: string, body?: unknown, method?: string) {
  const response = await request(route, token, body, method);
  assert.equal(response.status, expected, `${method ?? (body ? 'POST' : 'GET')} ${route}`);
  return response;
}
try {
  // Refuse to replace an unrelated process occupying the requested port.
  let occupied = false;
  try { await fetch(base, { signal: AbortSignal.timeout(1200) }); occupied = true; } catch { /* expected */ }
  assert(!occupied, 'Verification port is already occupied');
  const a = await db.user.create({ data: { email: `browser-a-${tag}@synthetic.test`, name: 'SYNTHETIC A' } });
  const b = await db.user.create({ data: { email: `browser-b-${tag}@synthetic.test`, name: 'SYNTHETIC B' } });
  const doctor = await db.user.create({ data: { email: `browser-doctor-${tag}@synthetic.test`, role: 'doctor' } });
  const admin = await db.user.create({ data: { email: `browser-admin-${tag}@synthetic.test`, role: 'admin' } });
  const profile = await db.doctorProfile.create({ data: { userId: doctor.id, pmdcNumber: `SYNTHETIC-${tag}`, specialty: 'General', pmdcVerifiedAt: new Date() } });
  await db.patientProfile.create({ data: { userId: a.id, ageBand: 'adult', sex: 'undisclosed' } });
  const [tokenA, tokenB, tokenDoctor, tokenAdmin] = await Promise.all([a, b, doctor, admin].map(tokenFor));
  const childEnv = { ...process.env, NEXTAUTH_URL: base, NEXTAUTH_SECRET: secret, ENABLE_INTERNAL_DIAGNOSTICS: 'true', NODE_ENV: 'production' };
  // Do not allow inherited provider credentials to transmit synthetic medical text.
  for (const key of Object.keys(childEnv)) if (/GROQ|GOOGLE|GEMINI|OPENAI|ANTHROPIC|SMTP|TWILIO|LIVEKIT|STRIPE|WEB_PUSH|VAPID/.test(key)) delete (childEnv as Record<string, string | undefined>)[key];
  await cp('.next/static', '.next/standalone/.next/static', { recursive: true });
  await cp('public', '.next/standalone/public', { recursive: true });
  const packaged = await readdir('.next/standalone');
  assert(!packaged.includes('storage') && !packaged.includes('work') && !packaged.some(name => name.startsWith('.env')), 'Standalone package excludes medical uploads, scratch logs and environment files');
  pass('standalone package excludes runtime private data');
  server = spawn('node', ['.next/standalone/server.js'], { cwd: process.cwd(), env: { ...childEnv, PORT: String(port), HOSTNAME: '127.0.0.1' }, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
  server.stdout?.pipe(runtimeLog); server.stderr?.pipe(runtimeLog);
  let ready = false;
  for (let attempt = 0; attempt < 90; attempt++) {
    if (server.exitCode !== null) throw new Error('Production server exited; inspect work/production-runtime.log');
    try { if ((await request('/api/auth/session')).ok) { ready = true; break; } } catch { /* still starting */ }
    await pause(500);
  }
  assert(ready, 'Production server startup'); pass('production server starts');
  await status('/api/observability/metrics', 401);
  await status('/api/observability/metrics', 403, tokenA);
  await status('/api/observability/metrics', 200, tokenAdmin);
  await status('/api/eval/run', 401, undefined, {});
  await status('/api/eval/run', 403, tokenA, {});
  for (const route of ['/api/eval/results', '/api/admin/dataset-stats', '/api/eval/access']) await status(route, 200);
  pass('diagnostics require fresh admin; dashboard reads retained');

  const history: Array<{ id?: string; role: string; content: string }> = [];
  let conversationId = '';
  let lastMessageId = '';
  for (const [index, message] of ['hello', 'hi', 'how are u', 'i am not good', 'i am unwell', 'i am sick', 'i have chest pain', 'i like to die', 'what is my status now'].entries()) {
    const response = await status('/api/chat', 200, tokenA, { message, sessionId: tag, conversationId: conversationId || undefined, language: 'en', history });
    const events = (await response.text()).split('\n').filter(line => line.startsWith('data: ')).map(line => JSON.parse(line.slice(6)));
    const done = events.findLast(event => event.stage === 'done')?.data;
    assert(done?.content && done.conversationId && done.messageId, `Turn ${index + 1} persisted`);
    assert(!JSON.stringify(events).match(/pipelineMeta|differential.*established|"engine":"L[012]"/), 'No diagnostic metadata in SSE');
    assert.equal(done.confidence, null);
    assert(!/nice to meet you, (?:not|unwell|sick)/i.test(done.content));
    if (index === 1) assert.notEqual(done.content, history[1].content);
    if (index >= 6) assert.equal(done.triage.level, 'EMERGENCY');
    if (index === 8) assert(/chest pain/.test(done.content) && /like to die/.test(done.content) && /immediate danger/.test(done.content));
    conversationId = done.conversationId; lastMessageId = done.messageId;
    history.push({ role: 'user', content: message }, { role: 'assistant', content: done.content, id: done.messageId });
  }
  const stored = await db.message.findMany({ where: { conversationId }, orderBy: { createdAt: 'asc' } });
  assert.equal(stored.length, 18); assert.equal(stored.at(-1)?.content, history.at(-1)?.content);
  pass('nine turns through real SSE and PostgreSQL preserve both unresolved risks');
  const summaryResponse = await status('/api/summary', 200, tokenA, { conversationId, language: 'en' });
  assert.match(summaryResponse.headers.get('cache-control') ?? '', /no-store/);
  const summary = (await summaryResponse.json()).summary;
  assert.equal(summary.triageLevel, 'EMERGENCY'); assert(summary.redFlagsObserved.length >= 2); assert.equal(summary.confidence, null);
  const greeting = await db.conversation.create({ data: { userId: a.id, sessionToken: tag, messages: { create: { role: 'user', content: 'hello', language: 'en' } } } });
  await status('/api/summary', 422, tokenA, { conversationId: greeting.id });
  pass('saved summaries contain facts and reject greetings-only transcripts');
  const convPath = `/api/conversations/${conversationId}`;
  await status(convPath, 200, tokenA); await status(convPath, 404, tokenB); await status(convPath, 404, tokenAdmin); await status(convPath, 404, tokenDoctor);
  await status('/api/summary', 404, tokenB, { conversationId });
  await status('/api/feedback', 404, tokenB, { messageId: lastMessageId, rating: 1 });
  const isolatedResponse = await status('/api/chat', 200, tokenB, { message: 'hello', sessionId: randomUUID(), conversationId, language: 'en' });
  const isolatedEvents = (await isolatedResponse.text()).split('\n').filter(line => line.startsWith('data: ')).map(line => JSON.parse(line.slice(6)));
  const isolated = isolatedEvents.findLast(event => event.stage === 'done').data;
  assert.notEqual(isolated.conversationId, conversationId); assert(!/chest pain|like to die/.test(isolated.content));
  const guestToken = randomBytes(32).toString('hex');
  const guest = await db.conversation.create({ data: { sessionToken: guestToken, messages: { create: { role: 'user', content: 'I have a fever', language: 'en' } } } });
  await status(`/api/conversations/${guest.id}?sessionId=${guestToken}`, 200);
  await status(`/api/conversations/${guest.id}?sessionId=wrong-session`, 404);
  await status(`/api/conversations/${guest.id}?sessionId=${guestToken}`, 404, tokenB);
  await status('/api/fhir/Patient?id=' + a.id, 401);
  await status('/api/fhir/Patient?id=' + a.id, 404, tokenB);
  await status('/api/fhir/Patient?id=' + a.id, 200, tokenA);
  const consent = await db.patientConsentForDoctor.create({ data: { patientId: a.id, doctorId: profile.id, scope: 'read_history' } });
  await status(convPath, 200, tokenDoctor);
  await status('/api/doctor/soap-note', 404, tokenDoctor, { conversationId });
  const soapConsent = await db.patientConsentForDoctor.create({ data: { patientId: a.id, doctorId: profile.id, scope: 'soap_draft' } });
  await status('/api/doctor/soap-note', 200, tokenDoctor, { conversationId });
  await db.patientConsentForDoctor.update({ where: { id: consent.id }, data: { revokedAt: new Date() } });
  await db.patientConsentForDoctor.update({ where: { id: soapConsent.id }, data: { revokedAt: new Date() } });
  await status(convPath, 404, tokenDoctor);
  await status('/api/doctor/soap-note', 404, tokenDoctor, { conversationId });
  const schedule = { patientId: a.id, conversationId, scheduledFor: new Date(Date.now() + 3600000).toISOString() };
  await status('/api/doctor/followups', 403, tokenDoctor, schedule);
  assert.equal(await db.patientConsentForDoctor.count({ where: { patientId: a.id, doctorId: profile.id, scope: 'follow_up' } }), 0, 'Doctor cannot self-grant consent');
  const followUpConsent = await db.patientConsentForDoctor.create({ data: { patientId: a.id, doctorId: profile.id, scope: 'follow_up' } });
  await status(convPath, 404, tokenDoctor);
  await status('/api/doctor/followups', 200, tokenDoctor, schedule);
  await status('/api/doctor/followups', 404, tokenDoctor, { ...schedule, conversationId: 'unowned-missing' });
  await db.patientConsentForDoctor.update({ where: { id: followUpConsent.id }, data: { revokedAt: new Date() } });
  const analytics = await status('/api/doctor/analytics', 200, tokenDoctor);
  assert.equal((await analytics.json()).overview.totalPatients, 0, 'Analytics must not count unrelated patients');
  await db.user.update({ where: { id: b.id }, data: { accountStatus: 'suspended' } });
  await status('/api/conversations', 403, tokenB);
  await db.user.update({ where: { id: b.id }, data: { accountStatus: 'active' } });
  pass('cross-patient access, consent scope and revocation, no self-granted consent, scoped analytics, FHIR and stale suspension enforced');

  const moduleName = process.env.PLAYWRIGHT_MODULE;
  const playwright = await import(moduleName ? pathToFileURL(path.resolve(moduleName)).href : 'playwright');
  browser = await playwright.chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_CHANNEL ? { channel: process.env.PLAYWRIGHT_CHANNEL } : {}) });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, serviceWorkers: 'allow' });
  await context.addCookies([{ name: cookieName, value: tokenA, url: base }]);
  page = await context.newPage();
  const pageErrors: string[] = [];
  page.on('pageerror', (error: Error) => pageErrors.push(error.message));
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.locator('textarea').waitFor();
  const snapshot = () => page.evaluate(() => JSON.parse(sessionStorage.getItem('sehatai.activeConversation.v1') ?? '{}'));
  async function send(message: string, online = true) {
    const before = (await snapshot()).messages?.length ?? 0;
    const response = online ? page.waitForResponse((r: any) => r.url().endsWith('/api/chat') && r.request().method() === 'POST') : null;
    await page.locator('textarea').fill(message);
    await page.getByRole('button', { name: 'Send message', exact: true }).click();
    if (response) await (await response).finished();
    await page.waitForFunction((count: number) => {
      const saved = JSON.parse(sessionStorage.getItem('sehatai.activeConversation.v1') ?? '{}');
      return saved.messages?.length > count && saved.messages.at(-1)?.role === 'assistant' && !saved.messages.at(-1)?.streaming && saved.messages.at(-1)?.content;
    }, before, { timeout: 45000 });
    return (await snapshot()).messages.at(-1);
  }
  async function dismissEmergency() {
    const overlay = page.getByRole('alertdialog');
    if (await overlay.isVisible()) {
      await overlay.getByRole('button', { name: 'Close', exact: true }).first().click();
      await overlay.getByRole('button', { name: 'Close', exact: true }).last().click();
      await overlay.waitFor({ state: 'hidden' });
    }
  }
  for (const message of ['hello', 'hi', 'how are u', 'i am not good', 'i am unwell', 'i am sick']) {
    const answer = await send(message);
    assert(!/nice to meet you, (?:not|unwell|sick)/i.test(answer.content));
    assert.equal(await page.getByRole('button', { name: /Book a doctor|Nearby facilities|Find a doctor/ }).count(), 0, 'No irrelevant referral buttons');
    if (message === 'hello') await page.screenshot({ path: 'work/greeting-clean.png', fullPage: true });
  }
  await send('i have chest pain'); await dismissEmergency();
  await page.reload({ waitUntil: 'networkidle' });
  assert((await snapshot()).messages.some((m: any) => m.content === 'i have chest pain'));
  await send('i like to die'); await dismissEmergency();
  const final = await send('what is my status now');
  assert.equal(final.triage.level, 'EMERGENCY'); assert.match(final.content, /chest pain/); assert.match(final.content, /like to die/);
  const overlay = page.getByRole('alertdialog');
  await overlay.waitFor();
  // Keyboard focus remains in the emergency dialog, including after repeated Tab.
  for (let i = 0; i < 12; i++) await page.keyboard.press('Tab');
  assert(await overlay.evaluate((element: HTMLElement) => element.contains(document.activeElement)));
  await dismissEmergency();
  assert(!/HIGH CONFIDENCE|MEDIUM CONFIDENCE|Technical Inspector|Judge Mode/.test(await page.locator('body').innerText()));
  pass('browser nine-turn journey, reload, emergency focus and contextual actions');
  await page.evaluate(async () => {
    await Promise.race([navigator.serviceWorker.ready, new Promise((_, reject) => setTimeout(() => reject(new Error('Offline shell service worker did not activate')), 15000))]);
  });
  await context.setOffline(true);
  await page.reload({ waitUntil: 'load' }); await page.locator('textarea').waitFor();
  assert((await snapshot()).messages.some((m: any) => m.content === 'i have chest pain'), 'Offline reload preserves prior risk');
  const offline = await send('what should I do next?', false);
  assert.equal(offline.triage.level, 'EMERGENCY'); assert.match(offline.content, /chest pain/);
  await dismissEmergency();
  await page.getByRole('button', { name: 'Doctor Summary', exact: true }).click();
  const dialog = page.getByRole('dialog'); await dialog.waitFor();
  assert.match(await dialog.innerText(), /chest pain/); assert.match(await dialog.innerText(), /like to die/);
  const downloadWait = page.waitForEvent('download');
  await dialog.getByRole('button', { name: 'Export Summary JSON', exact: true }).click();
  const download = await downloadWait; const downloadPath = await download.path();
  const exported = JSON.parse(await readFile(downloadPath, 'utf8'));
  assert.equal(exported.format, 'sehatai-transcript-summary-v1'); assert.equal(exported.summary.triageLevel, 'EMERGENCY');
  await page.screenshot({ path: 'work/offline-summary-desktop.png', fullPage: true });
  await page.keyboard.press('Escape');
  await context.setOffline(false);
  await page.locator('textarea').waitFor();
  const recovered = await send('what is my status now'); await dismissEmergency();
  assert.equal(recovered.triage.level, 'EMERGENCY'); assert.match(recovered.content, /like to die/);
  const recoveredId = (await snapshot()).conversationId;
  const recoveredMessages = await db.message.findMany({ where: { conversationId: recoveredId } });
  assert.equal(recoveredMessages.length, 22, 'Reconnect persists offline turns once alongside the new answer');
  assert(recoveredMessages.some(m => m.role === 'user' && m.content === 'what should I do next?'));
  await page.getByRole('button', { name: 'Language', exact: true }).click();
  await page.getByRole('menuitem', { name: 'اردو (Urdu)', exact: true }).click();
  assert.equal(await page.locator('html').getAttribute('dir'), 'rtl');
  for (const [label, width, height] of [['mobile', 390, 844], ['tablet', 768, 1024], ['desktop', 1440, 1000]] as const) {
    await page.setViewportSize({ width, height });
    await page.screenshot({ path: `work/chat-urdu-${label}.png`, fullPage: true });
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 2), `${label}: no page overflow`);
  }
  pass('offline safety, local factual summary, JSON export and three RTL viewports');
  // A new signed-in identity must never restore A's tab-scoped transcript.
  await context.addCookies([{ name: cookieName, value: tokenB, url: base }]);
  await page.goto(base, { waitUntil: 'networkidle' }); await page.locator('textarea').waitFor();
  assert.equal((await snapshot()).messages?.length ?? 0, 0);
  assert(!/i have chest pain/.test(await page.locator('body').innerText()));
  pass('account switch clears previous patient transcript');
  await page.goto(base + '/?view=dashboard', { waitUntil: 'networkidle' });
  await page.getByRole('heading', { name: /Clinical Safety|Safety.*Dashboard|Dashboard/i }).first().waitFor();
  await page.screenshot({ path: 'work/preserved-dashboard.png', fullPage: true });
  assert.equal(pageErrors.length, 0, pageErrors.join('\n'));
  pass('dashboard remains accessible and browser has no uncaught errors');
  await context.close();
} catch (error) {
  if (page && !page.isClosed()) {
    await page.screenshot({ path: 'work/browser-failure.png', fullPage: true }).catch(() => {});
    console.error('Browser failure state:', await page.evaluate(() => ({ text: document.body.innerText.slice(0, 1200), online: navigator.onLine, savedOwner: JSON.parse(sessionStorage.getItem('sehatai.activeConversation.v1') ?? '{}').owner })).catch(() => null));
  }
  checks.push({ name: 'verification', passed: false, detail: error instanceof Error ? error.stack : String(error) });
  console.error(error); process.exitCode = 1;
} finally {
  await browser?.close();
  server?.kill(); runtimeLog.end();
  await db.$disconnect();
  await writeFile('work/production-verification.json', JSON.stringify({ createdAt: new Date().toISOString(), checks }, null, 2));
}
