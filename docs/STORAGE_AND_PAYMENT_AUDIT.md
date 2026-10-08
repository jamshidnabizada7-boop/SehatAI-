# Storage & Payment Implementation Audit

## TASK C — Private Object-Storage Validation

### Overview
The `StorageProvider` interface (`src/server/care/storage.ts`) defines how the system interacts with underlying storage backends for Care Connect §37/§38 features. Two main implementations exist:
- `LocalPrivateStorage` for local testing/development.
- `PrivateObjectStorageProvider` for cloud environments supporting S3/OSS.

### Current Implementation Assessment
- **What providers are implemented?** Local file system (`local-private`) and an S3-compatible/Aliyun OSS compatible provider (`s3-private` or `oss-private`).
- **Does it use an established provider SDK or custom crypto signing?** It relies on **custom crypto signing** (`signHeaders`) rather than an established provider SDK (like the AWS SDK or Aliyun SDK). It implements an AWS Signature Version 4 authentication algorithm to securely sign raw HTTP `fetch` requests.
- **How are signed URLs generated?** S3 presigned URLs are **NOT** generated. Instead, short-lived URLs are generated using local custom signing (`createHmac` using `KEY_MATERIAL` and timestamp logic in `signReadImpl`). Clients hit a local Next.js route, and the backend performs a proxied fetch to the cloud provider on behalf of the authenticated client.
- **Is there path traversal protection?** Yes. Local limits allowed characters and strips directory traversal inputs, while both implementations enforce strict rejection of `..` in object keys. (Our local script verified `INVALID_STORAGE_KEY` is correctly thrown during path traversal attacks).
- **Is there encryption at rest?** Yes, both implementations apply server-side AES-256-GCM encryption natively before saving. S3 explicitly sets `x-amz-server-side-encryption: AES256` as an added layer of native infrastructure encryption.
- **How are object keys validated?** Handled directly by regex validation replacements ensuring opaque and safe file naming (`/[^a-zA-Z0-9._-]/g`).
- **Is deletion properly implemented?** Yes, local uses `fs.rm({ force: true })` and remote performs standard HTTP `DELETE` requests with AWS V4 signed authorization headers.
- **Are ACLs/permissions checked?** Yes, S3 sets `x-amz-acl: private`. Authorization is checked by the caller *before* yielding a signed Read URL.

### BLOCKED: Cloud Storage Configuration
Local storage passes unit and local security tests. However, cloud staging is **BLOCKED** since there are no live cloud credentials set up yet. 

**Steps the Project Owner Must Take:**
1. Provision a strictly private Object Storage bucket (AWS S3 or Aliyun OSS).
2. Generate API Access Keys with `PutObject`, `GetObject`, and `DeleteObject` privileges.
3. Configure the following environment variables:
   - `CARE_STORAGE_PROVIDER` (set to `s3` or `oss`)
   - `CARE_S3_BUCKET` or `CARE_OSS_BUCKET`
   - `CARE_S3_REGION` or `CARE_OSS_REGION`
   - `CARE_S3_KEY` or `CARE_OSS_ACCESS_KEY_ID`
   - `CARE_S3_SECRET` or `CARE_OSS_ACCESS_KEY_SECRET`
   - `CARE_S3_ENDPOINT` (optional if overriding default URL schemas)

---

## TASK E — Payment Provider Implementation Audit

### Overview
Payment flow implements a double-entry ledger architecture (`src/server/care/ledger.ts`), isolating provider-specific logic in `adapters.ts`. Features robust webhook verification, idempotent processing, and refund lifecycle support.

### Provider Classification Status
1. **Mock Provider** (`mock`): **IMPLEMENTED AND TESTED**
   - Implements full end-to-end integration simulation.
   - **Production-Blocked**: Safely gated via `NODE_ENV` and `CARE_ALLOW_MOCK_PAYMENTS`.
2. **HesabPay** (`hesabpay`): **NOT IMPLEMENTED** / **STUB**
3. **Pakistan Gateway** (`pk-local`): **NOT IMPLEMENTED** / **STUB**
4. **Card Payment** (`card`): **NOT IMPLEMENTED** / **STUB**

### Core Logic Verification
- **Mock provider is production-blocked:** PASS. The `MockPaymentProvider` checks `process.env.NODE_ENV === 'production'` and immediately throws if used.
- **Ledger uses integer minor units:** PASS. All ledger amounts specify `amountMinor` and enforce `Number.isInteger(leg.amountMinor)` inside the `postTransaction` engine.
- **Idempotency keys work:** PASS. Webhooks avoid dual processing via database constraints (`PaymentWebhook`), and ledger transactions prevent replication via strict `idempotencyKey` indices checking.
- **Webhook signature verification exists:** PASS. Verifications are processed in `verifyWebhook` leveraging `timingSafeEqual(createHmac(...))`.
- **Refund lifecycle is correct:** PASS. Properly spans `requestRefund` -> `REFUND_PENDING` -> `provider.refundPayment` -> `confirmRefund` -> `REFUNDED` accompanied by a waterfall compensating ledger transaction that reverses matching doctor earnings and platform fees.
- **Doctor earnings calculation is correct:** PASS. Doctor Net is computed as `grossMinor - commission - processorFee`. Earning rows transition from `PENDING` to `AVAILABLE` upon the predefined lifecycle delay (`CARE_EARNING_DELAY_HOURS`).
- **Commission splits use basis points:** PASS. Implemented via the `splitMoney(opts.priceMinor, opts.percentageBps)` pure mathematical function ensuring exact fractional division before limits.

### BLOCKED: Payment Gateway Provider Access
Testing real transaction routes is **BLOCKED** due to stub implementations of the actual merchant gateways in `adapters.ts`.

**Steps the Project Owner Must Take:**
1. Establish legal merchant agreements with HesabPay, a supported local Pakistani Gateway (like JazzCash or PayFast), and/or an international card provider (like Stripe).
2. Fully implement the adapter methods (`createCheckout`, `refundPayment`, `createPayout`, `verifyWebhook`) inside `src/server/care/payments/adapters.ts`. 
3. Configure these environment credentials into the secure deployment configuration:
   - *HesabPay:* `HESABPAY_API_KEY`, `HESABPAY_MERCHANT_ID`
   - *Pakistan Gateway:* `CARE_PK_GATEWAY_KEY`, `CARE_PK_GATEWAY_SECRET`
   - *Card Processing:* `CARE_CARD_GATEWAY_KEY`
