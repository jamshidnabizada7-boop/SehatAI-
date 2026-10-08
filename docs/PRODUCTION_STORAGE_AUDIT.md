# SehatAI Care Connect Production Storage & File Security Audit

**Document ID:** STR-AUDIT-2026-10-08-03  
**Target Module:** `src/server/care/storage.ts` & Document Routes  
**Classification:** INFRASTRUCTURE SECURITY SPECIFICATION  
**Date:** October 8, 2026  

---

## 1. Executive Storage Policy (§37 & §38)

**Fundamental Invariant:** Protected Health Information (PHI), patient uploaded medical files (lab reports, imaging, voice memos), and clinician verification documents (PMDC licenses, CNICs, degrees) must **NEVER be stored in or served from `/public` or static web directories**.

All storage operations flow through the encrypted `StorageProvider` abstraction.

---

## 2. Storage Architecture & Provider Implementations

```
                     StorageProvider Interface
                     ┌───────────┴───────────┐
                     ▼                       ▼
           LocalPrivateStorage     PrivateObjectStorageProvider
            (Encrypted Local)       (S3 / Alibaba OSS / R2)
                     │                       │
                     ▼                       ▼
            AES-256-GCM Envelope     AES-256-GCM Envelope
             Keyed by Master Secret  Keyed by Master Secret
                     │                       │
                     ▼                       ▼
             storage/care/bucket/    Encrypted Cloud Object
             (Outside /public)       (Private ACL + SSE)
```

### 1. `LocalPrivateStorage` (Default Local & Staging Engine)
- Stores files under `storage/care/` strictly outside the Next.js static asset root.
- Two-tier directory partitioning prevents directory bloat (`storage/care/xx/filename`).
- Path-traversal sanitization flattens keys and rejects `..` sequences.

### 2. `PrivateObjectStorageProvider` (Production Enterprise Engine)
- Compatible with AWS S3, Alibaba Cloud OSS, Cloudflare R2, and self-hosted MinIO.
- Implements dependency-free AWS Signature Version 4 (SigV4) request signing via native Node.js `crypto`.
- Enforces private ACLs (`x-amz-acl: private`) and server-side encryption (`x-amz-server-side-encryption: AES256`).
- Automatic failure cleanup: partial or failed PUT requests automatically issue cleanup DELETE requests to prevent orphan storage costs.

---

## 3. Cryptography & Encryption at Rest

Every stored payload is envelope-encrypted before being committed to disk or cloud storage:
- **Cipher Algorithm:** AES-256-GCM (Galois/Counter Mode).
- **Blob Layout:**
  ```
  [12 Bytes: Cryptographic IV] [16 Bytes: GCM Auth Tag] [Ciphertext Body...]
  ```
- **Key Derivation:** Master key derived via SHA-256 from `CARE_STORAGE_KEY` (falling back to `NEXTAUTH_SECRET` in local dev).
- **Zero-Knowledge Guarantee:** Even if cloud storage buckets (S3/OSS) suffer unauthorized read access, the raw stored blobs are encrypted ciphertext that cannot be decrypted without the application's server-side key.

---

## 4. Authorization-Gated Signed Downloads (§38)

Direct S3 pre-signed URLs are not issued to client browsers because raw cloud objects are encrypted ciphertext. Instead, downloads flow through an authorized decryption proxy:

1. Requester calls `/api/care/consultations/[id]/attachments?attachmentId=...`.
2. Server verifies participant membership (patient ID matches consultation or doctor ID matches consultation).
3. If authorized, server issues a short-lived HMAC-SHA256 read grant with 300-second TTL:
   ```
   grant = ${expiresAtMs}.${hmacSha256(KEY_MATERIAL, `${storageKey}.${expiresAtMs}`)}
   ```
4. Client requests `/api/care/attachments/download?key=...&expiresAt=...&signature=...`.
5. Server verifies signature, checks timestamp expiration, decrypts the blob in memory, and streams bytes with:
   - `Content-Type: application/octet-stream`
   - `X-Content-Type-Options: nosniff`
   - `Cache-Control: private, no-store`

---

## 5. Doctor Document Verification Hardening

Historically, doctor identity documents were saved via raw filesystem writes to `storage/doctor-docs/`. This has been reconciled:
- **Upload Route (`/api/doctor/upload-doc`):**
  - Validates MIME type against whitelist (`pdf`, `jpeg`, `png`, `webp`).
  - Verifies file magic bytes (e.g. `%PDF-`, JPEG SOI `FF D8 FF`, PNG header `89 50 4E 47`).
  - Calls `getStorage().put(...)` to encrypt and store documents under `doctor-docs/${userId}/...`.
- **Admin Review Route (`/api/admin/doctor-doc`):**
  - Requires active `admin` role.
  - Retrieves and decrypts document via `getStorage().get(...)`.
  - Maintains backward compatibility with legacy disk paths.

---

## 6. Production Storage Configuration Boundaries

| Variable | Description | Required in Production |
| :--- | :--- | :--- |
| `CARE_STORAGE_PROVIDER` | `local` \| `s3` \| `oss` | Optional (defaults to `s3` if credentials exist) |
| `CARE_STORAGE_KEY` | 256-bit AES master key material | **YES** |
| `CARE_S3_BUCKET` | Production bucket name | **YES** (if using S3) |
| `CARE_S3_REGION` | Cloud region (e.g., `ap-south-1`) | **YES** (if using S3) |
| `CARE_S3_KEY` | IAM Access Key ID | **YES** (if using S3) |
| `CARE_S3_SECRET` | IAM Secret Access Key | **YES** (if using S3) |
| `CARE_OSS_BUCKET` | Alibaba Cloud OSS bucket name | **YES** (if using OSS) |
| `CARE_OSS_ACCESS_KEY_ID` | Alibaba Cloud AccessKeyId | **YES** (if using OSS) |
| `CARE_OSS_ACCESS_KEY_SECRET`| Alibaba Cloud AccessKeySecret | **YES** (if using OSS) |
