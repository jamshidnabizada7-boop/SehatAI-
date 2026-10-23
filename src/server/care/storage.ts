import { careSecret } from './secrets';
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
function storageKeyMaterial() {
  return createHash('sha256').update(careSecret('CARE_STORAGE_KEY', 'dev-storage-secret-change-me')).digest();
}

function encrypt(data: Buffer): Buffer {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', storageKeyMaterial(), iv);
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
  const decipher = createDecipheriv('aes-256-gcm', storageKeyMaterial(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(body), decipher.final()]);
}

function signReadImpl(storageKey: string, ttlSeconds: number): string {
  const expiresAtMs = Date.now() + ttlSeconds * 1000;
  const sig = createHmac('sha256', storageKeyMaterial()).update(`${storageKey}.${expiresAtMs}`).digest('hex');
  return `${expiresAtMs}.${sig}`;
}

function verifySignedReadImpl(storageKey: string, signature: string, expiresAtMs: number): boolean {
  if (expiresAtMs < Date.now()) return false;
  const expected = createHmac('sha256', storageKeyMaterial()).update(`${storageKey}.${expiresAtMs}`).digest('hex');
  return expected.length === signature.length && expected === signature;
}

export class LocalPrivateStorage implements StorageProvider {
  readonly name = 'local-private';

  async put(key: string, data: Buffer): Promise<StoredObject> {
    if (process.env.STAGING_BLOCK_UPLOADS === 'true') {
      throw new Error('PHI_UPLOADS_HARD_BLOCKED_IN_STAGING: Medical document and attachment uploads are prohibited in staging environment');
    }
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

function hmacSha256(key: string | Buffer, data: string): Buffer {
  return createHmac('sha256', key).update(data).digest();
}

function sha256Hex(data: string | Buffer): string {
  return createHash('sha256').update(data).digest('hex');
}

export interface PrivateObjectStorageOptions {
  bucket?: string;
  region?: string;
  endpoint?: string;
  accessKey?: string;
  secretKey?: string;
  name?: string;
}

export class PrivateObjectStorageProvider implements StorageProvider {
  readonly name: string;
  private readonly bucket: string;
  private readonly region: string;
  private readonly endpoint: string;
  private readonly accessKey: string;
  private readonly secretKey: string;

  constructor(opts?: PrivateObjectStorageOptions) {
    this.name = opts?.name ?? (process.env.CARE_STORAGE_PROVIDER === 'oss' ? 'oss-private' : 's3-private');
    this.bucket = opts?.bucket ?? process.env.CARE_S3_BUCKET ?? process.env.CARE_OSS_BUCKET ?? '';
    this.region = opts?.region ?? process.env.CARE_S3_REGION ?? process.env.CARE_OSS_REGION ?? 'us-east-1';
    this.accessKey = opts?.accessKey ?? process.env.CARE_S3_KEY ?? process.env.CARE_OSS_ACCESS_KEY_ID ?? '';
    this.secretKey = opts?.secretKey ?? process.env.CARE_S3_SECRET ?? process.env.CARE_OSS_ACCESS_KEY_SECRET ?? '';

    const defaultEndpoint = process.env.CARE_STORAGE_PROVIDER === 'oss'
      ? `https://${this.bucket}.oss-${this.region}.aliyuncs.com`
      : `https://${this.bucket}.s3.${this.region}.amazonaws.com`;
    this.endpoint = (opts?.endpoint ?? process.env.CARE_S3_ENDPOINT ?? process.env.CARE_OSS_ENDPOINT ?? defaultEndpoint).replace(/\/+$/, '');

    if (!this.bucket || !this.accessKey || !this.secretKey) {
      throw new Error('PROVIDER_NOT_CONFIGURED: S3/OSS storage requires CARE_S3_BUCKET, CARE_S3_KEY, and CARE_S3_SECRET');
    }
  }

  private signHeaders(method: string, path: string, headers: Record<string, string>, payloadSha256: string): Record<string, string> {
    const url = new URL(`${this.endpoint}${path.startsWith('/') ? path : `/${path}`}`);
    const host = url.host;
    const now = new Date();
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
    const dateStamp = amzDate.slice(0, 8);

    const canonicalHeadersMap: Record<string, string> = {
      host,
      'x-amz-content-sha256': payloadSha256,
      'x-amz-date': amzDate,
    };
    for (const [k, v] of Object.entries(headers)) {
      canonicalHeadersMap[k.toLowerCase()] = v;
    }

    const sortedHeaderKeys = Object.keys(canonicalHeadersMap).sort();
    const canonicalHeadersStr = sortedHeaderKeys.map((k) => `${k}:${canonicalHeadersMap[k].trim()}\n`).join('');
    const signedHeaders = sortedHeaderKeys.join(';');

    const canonicalRequest = [
      method,
      url.pathname,
      url.search ? url.search.slice(1) : '',
      canonicalHeadersStr,
      signedHeaders,
      payloadSha256,
    ].join('\n');

    const credentialScope = `${dateStamp}/${this.region}/s3/aws4_request`;
    const stringToSign = [
      'AWS4-HMAC-SHA256',
      amzDate,
      credentialScope,
      sha256Hex(canonicalRequest),
    ].join('\n');

    const kDate = hmacSha256(`AWS4${this.secretKey}`, dateStamp);
    const kRegion = hmacSha256(kDate, this.region);
    const kService = hmacSha256(kRegion, 's3');
    const kSigning = hmacSha256(kService, 'aws4_request');
    const signature = createHmac('sha256', kSigning).update(stringToSign).digest('hex');

    const authorization = `AWS4-HMAC-SHA256 Credential=${this.accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

    return {
      ...canonicalHeadersMap,
      authorization,
    };
  }

  async put(key: string, data: Buffer): Promise<StoredObject> {
    if (process.env.STAGING_BLOCK_UPLOADS === 'true') {
      throw new Error('PHI_UPLOADS_HARD_BLOCKED_IN_STAGING: Medical document and attachment uploads are prohibited in staging environment');
    }
    const safeKey = key.replace(/[^a-zA-Z0-9._/-]/g, '_');
    const checksumSha256 = createHash('sha256').update(data).digest('hex');
    const encryptedBlob = encrypt(data);
    const payloadSha256 = sha256Hex(encryptedBlob);

    const targetPath = `/${safeKey}`;
    const signedHeaders = this.signHeaders(
      'PUT',
      targetPath,
      {
        'content-type': 'application/octet-stream',
        'x-amz-acl': 'private',
        'x-amz-server-side-encryption': 'AES256',
      },
      payloadSha256,
    );

    const putUrl = `${this.endpoint}${targetPath}`;
    const res = await fetch(putUrl, {
      method: 'PUT',
      headers: signedHeaders,
      body: new Uint8Array(encryptedBlob),
    });

    if (!res.ok) {
      await this.delete(safeKey).catch(() => undefined);
      throw new Error(`STORAGE_PUT_FAILED: HTTP ${res.status} ${res.statusText}`);
    }

    return {
      storageKey: safeKey,
      checksumSha256,
      sizeBytes: data.length,
    };
  }

  async get(storageKey: string): Promise<Buffer> {
    const cleanKey = storageKey.replace(/^[/\\]+/, '');
    if (cleanKey.includes('..')) throw new Error('INVALID_STORAGE_KEY');
    const targetPath = `/${cleanKey}`;
    const emptySha256 = sha256Hex('');
    const signedHeaders = this.signHeaders('GET', targetPath, {}, emptySha256);

    const getUrl = `${this.endpoint}${targetPath}`;
    const res = await fetch(getUrl, {
      method: 'GET',
      headers: signedHeaders,
    });

    if (res.status === 404) {
      throw new Error('OBJECT_NOT_FOUND');
    }
    if (!res.ok) {
      throw new Error(`STORAGE_GET_FAILED: HTTP ${res.status} ${res.statusText}`);
    }

    const encryptedBlob = Buffer.from(await res.arrayBuffer());
    return decrypt(encryptedBlob);
  }

  async delete(storageKey: string): Promise<void> {
    const cleanKey = storageKey.replace(/^[/\\]+/, '');
    if (cleanKey.includes('..')) throw new Error('INVALID_STORAGE_KEY');
    const targetPath = `/${cleanKey}`;
    const emptySha256 = sha256Hex('');
    const signedHeaders = this.signHeaders('DELETE', targetPath, {}, emptySha256);

    const delUrl = `${this.endpoint}${targetPath}`;
    await fetch(delUrl, {
      method: 'DELETE',
      headers: signedHeaders,
    }).catch(() => undefined);
  }

  signRead(storageKey: string, ttlSeconds = 300): string {
    return signReadImpl(storageKey, ttlSeconds);
  }

  verifySignedRead(storageKey: string, signature: string, expiresAtMs: number): boolean {
    return verifySignedReadImpl(storageKey, signature, expiresAtMs);
  }
}

export function getStorage(): StorageProvider {
  const provider = process.env.CARE_STORAGE_PROVIDER;
  const hasCloudConfig = Boolean(
    (process.env.CARE_S3_BUCKET || process.env.CARE_OSS_BUCKET) &&
    (process.env.CARE_S3_KEY || process.env.CARE_OSS_ACCESS_KEY_ID)
  );

  if (provider === 's3' || provider === 'oss') {
    return new PrivateObjectStorageProvider();
  }
  if (hasCloudConfig && provider !== 'local') {
    return new PrivateObjectStorageProvider();
  }
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
