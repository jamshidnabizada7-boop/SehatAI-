#!/usr/bin/env bun
// ============================================================
// Secret scanner for tracked and untracked-but-not-ignored files.
// Reports file:line and rule only; it never prints the matched value.
//
//   bun scripts/scan-secrets.ts                    # exit 1 on any finding not in the baseline
//   bun scripts/scan-secrets.ts --update-baseline  # accept the current findings
//
// scripts/secret-scan-baseline.json holds SHA-256 hashes of already-reviewed
// lines (file + trimmed line), so it exposes no secret values. Editing a
// baselined line changes its hash and it is reported again.
// ============================================================
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dir, '..');
const BASELINE_PATH = path.join(ROOT, 'scripts', 'secret-scan-baseline.json');

const SKIP_EXT = /\.(md|lock|png|jpe?g|gif|webp|ico|svg|pdf|gz|tgz|zip|bundle|patch|sha256|woff2?|ttf|db|sqlite3?)$/i;
const SKIP_FILE = /(^|\/)(bun\.lock|batch-slides\.json|\.env\.(production\.|staging\.)?example|secret-scan-baseline\.json|scan-secrets\.ts)$/;

const RULES: { id: string; re: RegExp }[] = [
  { id: 'key-literal', re: /(password|passwd|secret|token|api[_-]?key|private[_-]?key|bearer|credential)\w*['"]?\s*[:=]\s*['"`][^'"`${}\s]{12,}['"`]/i },
  { id: 'sql-password-literal', re: /\bPASSWORD\s+'[^'$]{8,}'/i },
  { id: 'url-with-password', re: /[a-z][a-z0-9+.-]*:\/\/[^:/\s'"`@]+:[^@\s'"`$]{6,}@/i },
  { id: 'token-prefix', re: /\b(sk-[A-Za-z0-9]{20,}|gsk_[A-Za-z0-9]{20,}|AIza[A-Za-z0-9_-]{30,}|ghp_[A-Za-z0-9]{30,}|xox[bp]-[A-Za-z0-9-]{20,})/ },
  { id: 'private-key-block', re: /-----BEGIN [A-Z ]*PRIVATE KEY-----/ },
  { id: 'env-fallback-literal', re: /process\.env\.[A-Z0-9_]*(PASSWORD|SECRET|KEY|TOKEN)[A-Z0-9_]*\s*(\|\||\?\?)\s*['"`][^'"`\s]{12,}['"`]/ },
];

const hashLine = (file: string, line: string) =>
  createHash('sha256').update(`${file}\n${line.trim()}`).digest('hex');

function listFiles(): string[] {
  const out = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });
  return out.split('\n').map((s) => s.trim()).filter(Boolean);
}

const updating = process.argv.includes('--update-baseline');
const baseline = new Set<string>(
  fs.existsSync(BASELINE_PATH) ? (JSON.parse(fs.readFileSync(BASELINE_PATH, 'utf8')).accepted as string[]) : [],
);

const findings: { file: string; line: number; rule: string; hash: string }[] = [];
for (const file of listFiles()) {
  if (SKIP_EXT.test(file) || SKIP_FILE.test(file)) continue;
  const full = path.join(ROOT, file);
  let text: string;
  try {
    if (fs.statSync(full).size > 2 * 1024 * 1024) continue;
    text = fs.readFileSync(full, 'utf8');
  } catch {
    continue;
  }
  text.split(/\r?\n/).forEach((line, i) => {
    for (const rule of RULES) {
      if (rule.re.test(line)) {
        findings.push({ file, line: i + 1, rule: rule.id, hash: hashLine(file, line) });
        break;
      }
    }
  });
}

if (updating) {
  const accepted = [...new Set(findings.map((f) => f.hash))].sort();
  fs.writeFileSync(
    BASELINE_PATH,
    JSON.stringify({ note: 'SHA-256 of reviewed lines (file + trimmed line). Contains no secret values.', accepted }, null, 2) + '\n',
  );
  console.log(`Baseline updated: ${accepted.length} accepted line(s) from ${findings.length} finding(s).`);
  process.exit(0);
}

const fresh = findings.filter((f) => !baseline.has(f.hash));
if (fresh.length) {
  console.error(`Possible hardcoded secrets (${fresh.length}). Values are not printed:`);
  for (const f of fresh) console.error(`  ${f.file}:${f.line}  [${f.rule}]`);
  console.error('Move the value to an environment variable. If it is a harmless fixture, review it and run with --update-baseline.');
  process.exit(1);
}
console.log(`No new hardcoded secrets (${findings.length} baselined line(s) skipped).`);
