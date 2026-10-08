// ============================================================
// Care Connect §37/§38 — private object storage.
// StorageProvider abstraction. LocalPrivateProvider writes under
// `storage/care/` OUTSIDE /public (never statically served), with
// authorization-checked short-lived signed read URLs. Files are
// encrypted at rest with AES-256-GCM using a server-side key.
// The S3 adapter is scaffolded for production (external provider).
// NEVER store health documents in /public (§37).
// ============================================================
import { createCipheriv, createDecipheriv, createHash, randomBytes, createHmac } from 'crypto';
import { mkdir, readFile, writeFile, stat } from 'fs/promises';
import path from 'path';

export interface StoredObject {
  storageKey: string; // opaque key — never a filesystem path to the client
  checksumSha256: string;
  sizeBytes: number;
}

export interface StorageProvider {
  readonly name: string;
  put(key: string, data: Buffer, context: { consultationId?: string; kind: string }): Promise<StoredObject>;
  get(storageKey: string): Promise<Buffer>;
  delete(storageKey: string): Promise<void>;
  /** Short-lived signed read grant (authorization checked by caller BEFORE signing, §38). */
  signRead(storageKey: string, ttlSeconds?: number): string;
  verifySignedRead(storageKey: string, signature: string, expiresAtMs: number): boolean;
}

const ROOT = path.join(process.cwd(), 'storage', 'care');
const KEY_MATERIAL = createHash('sha256')
  .update(process.env.CARE_STORAGE_KEY ?? process.env.NEXTAUTH_SECRET ?? 'dev-storage-secret-change-me')
  .digest();

function encrypt(data: Buffer): Buffer {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', KEY_MATERIAL, iv);
  const enc = Buffer.concat([cipher.update(data), cipher.final()]);
  const tag = cipher.getAuthTag();
  // Blob layout: [12B iv][16B auth tag][ciphertext]
  return Buffer.concat([iv, tag, enc]);
}

// Blob layout: [12B iv][16B auth tag][ciphertext]
function decrypt(blob: Buffer): Buffer {
  const iv = blob.subarray(0, 12);
  const tag = blob.subarray(12, 28);
  const body = blob.subarray(28);
  const decipher = createDecipheriv('aes-256-gcm', KEY_MATERIAL, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(body), decipher.final()]);
}

function signReadImpl(storageKey: string, ttlSeconds: number): string {
  const expiresAtMs = Date.now() + ttlSeconds * 1000;
  const sig = createHmac('sha256', KEY_MATERIAL).update(`${storageKey}.${expiresAtMs}`).digest('hex');
  return `${expiresAtMs}.${sig}`;
}

function verifySignedReadImpl(storageKey: string, signature: string, expiresAtMs: number): boolean {
  if (expiresAtMs < Date.now()) return false;
  const expected = createHmac('sha256', KEY_MATERIAL).update(`${storageKey}.${expiresAtMs}`).digest('hex');
  return expected.length === signature.length && expected === signature;
}

export class LocalPrivateStorage implements StorageProvider {
  readonly name = 'local-private';

  async put(key: string, data: Buffer): Promise<StoredObject> {
    // Path-traversal hardening (§87 file traversal): flatten the key.
    const safeKey = key.replace(/[^a-zA-Z0-9._-]/g, '_');
    const bucket = safeKey.slice(0, 2);
    const dir = path.join(ROOT, bucket);
    await mkdir(dir, { recursive: true });
    const blob = encrypt(data);
    await writeFile(path.join(dir, safeKey), blob);
    return {
      storageKey: `${bucket}/${safeKey}`,
      checksumSha256: createHash('sha256').update(data).digest('hex'),
      sizeBytes: data.length,
    };
  }

  async get(storageKey: string): Promise<Buffer> {
    const [bucket, name] = storageKey.split('/');
    if (!bucket || !name || name.includes('..')) throw new Error('INVALID_STORAGE_KEY');
    const file = await readFile(path.join(ROOT, bucket, name));
    return decrypt(file);
  }

  async delete(storageKey: string): Promise<void> {
    const [bucket, name] = storageKey.split('/');
    await import('fs/promises').then((f) => f.rm(path.join(ROOT, bucket, name), { force: true }));
  }

  signRead(storageKey: string, ttlSeconds = 300): string {
    return signReadImpl(storageKey, ttlSeconds);
  }

  verifySignedRead(storageKey: string, signature: string, expiresAtMs: number): boolean {
    return verifySignedReadImpl(storageKey, signature, expiresAtMs);
  }
}

class S3Storage implements StorageProvider {
  readonly name = 's3';
  constructor() {
    if (!process.env.CARE_S3_BUCKET || !process.env.CARE_S3_REGION) {
      throw new Error('PROVIDER_NOT_CONFIGURED: S3 storage requires CARE_S3_BUCKET/REGION + credentials');
    }
  }
  async put(): Promise<StoredObject> { throw new Error('PROVIDER_NOT_CONFIGURED: S3 adapter pending credentials'); }
  async get(): Promise<Buffer> { throw new Error('PROVIDER_NOT_CONFIGURED: S3 adapter pending credentials'); }
  async delete(): Promise<void> { throw new Error('PROVIDER_NOT_CONFIGURED: S3 adapter pending credentials'); }
  signRead(): string { throw new Error('PROVIDER_NOT_CONFIGURED: S3 adapter pending credentials'); }
  verifySignedRead(): boolean { return false; }
}

export function getStorage(): StorageProvider {
  if (process.env.CARE_S3_BUCKET) return new S3Storage();
  return new LocalPrivateStorage();
}

// §37 — magic-byte verification for allowed medical file types.
const MAGIC: Array<{ mime: string; ext: string; test: (b: Buffer) => boolean }> = [
  { mime: 'application/pdf', ext: 'pdf', test: (b) => b.subarray(0, 5).toString() === '%PDF-' },
  { mime: 'image/jpeg', ext: 'jpg', test: (b) => b[0] === 0xff && b[1] === 0xd8 },
  { mime: 'image/png', ext: 'png', test: (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 },
  { mime: 'image/webp', ext: 'webp', test: (b) => b.subarray(0, 4).toString() === 'RIFF' && b.subarray(8, 12).toString() === 'WEBP' },
];

export function detectMagicMime(bytes: Buffer): { mime: string; ext: string } | null {
  return MAGIC.find((m) => m.test(bytes)) ?? null;
}

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB
export const MAX_VOICE_SECONDS = 120;

export async function fileExists(p: string): Promise<boolean> {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
}
