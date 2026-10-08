# SehatAI Care Connect — Incident Response Runbooks (§100)

> **Document Type:** Production Incident Response & Emergency Operational Procedures  
> **Target Audience:** On-Call Engineers, Site Reliability Engineers, Support Escalation Teams

---

## 1. RUNBOOK 1: Payment Webhook Outage & Replay Recovery

### 1.1 Symptoms & Trigger Conditions
- Patients report that checkouts succeeded on the gateway, but consultation status remains stuck in `PAYMENT_PENDING`.
- Spikes in HTTP 5xx errors on `/api/care/payments/webhooks/*` or gateway webhook delivery failures.

### 1.2 Immediate Mitigation Steps
1. **Verify Webhook Intake Health:**
   Check server logs for signature verification failures or database connection pool exhaustion.
2. **Inspect the `PaymentWebhook` Table:**
   Query recent incoming webhook rows:
   ```sql
   SELECT id, provider, eventId, signatureValid, createdAt
   FROM PaymentWebhook
   ORDER BY createdAt DESC LIMIT 50;
   ```
3. **Manual Replay of Missed Webhooks:**
   - Retrieve failed event IDs from the payment processor dashboard (JazzCash/HesabPay/Stripe).
   - In Care Connect, webhooks are completely replay-safe: `processWebhook()` is idempotent.
   - Re-send the signed raw webhook payload to `/api/care/payments/webhooks/[provider]`.
   - The engine verifies the signature, confirms that no duplicate ledger entry exists, transitions `Payment` to `PAID`, credits `DOCTOR_PENDING`, and advances `Consultation` to `REQUESTED`.
4. **Direct Provider Status Fallback:**
   If the webhook endpoint was down, run the status reconciliation job for stuck `PENDING` payments using `provider.getPaymentStatus(payment.providerRef)`.

---

## 2. RUNBOOK 2: Emergency Doctor Suspension

### 2.1 Trigger Conditions
- Report of severe medical negligence, sexual misconduct, intoxication during consultation, or fraudulent PM&DC credentials.
- Automatic alert of controlled substance prescription attempts.

### 2.2 Immediate Execution Procedure
1. **Instant Suspension via Admin API:**
   An administrator or clinical lead executes:
   ```bash
   POST /api/care/admin
   Content-Type: application/json
   {
     "action": "doctor.suspend",
     "doctorProfileId": "cuid_doctor_id",
     "suspend": true
   }
   ```
2. **Systemic Effects Enforced Immediately:**
   - Updates `DoctorProfile.careStatus = 'SUSPENDED'`.
   - Sets `DoctorProfile.onlineNow = false`.
   - The doctor is instantly hidden from directory search results (`/api/care/doctors`).
   - Active WebRTC tokens for current calls are immediately invalidated upon expiration.
   - All pending and requested consultations assigned to the doctor are queued for administrative reassignment or 100% full cancellation refund to patients.
   - Payout requests are frozen in `HOLD` status.
3. **Regulatory Reporting:**
   Prepare formal dossier containing chat logs, audio metadata, and audit records for transmission to the PM&DC ethics committee.

---

## 3. RUNBOOK 3: Patient Refund Dispute Resolution

### 3.1 Trigger Conditions
- Patient files a formal grievance (`/api/care/consultations/[id]/dispute`) regarding no-show, audio/video degradation, or incomplete medical consultation.

### 3.2 Investigation Workflow
1. Open the dispute record in the administrative console:
   `GET /api/care/admin?resource=disputes`.
2. Inspect the objective telemetry:
   - Check `ConsultationCall` telemetry: verify connection state history (`ACTIVE`, `FELL_BACK`, `FAILED`, duration in minutes).
   - Check chat log timestamps to verify whether doctor attended within the window.
3. Update Dispute Status:
   - Mark as `INVESTIGATING`:
     `POST /api/care/admin { action: "dispute.update", disputeId: "<id>", status: "INVESTIGATING" }`.
4. Decision & Execution:
   - **Case A: Patient Claim Upheld (Technical Failure / No-Show):**
     Execute refund under reason `technical_failure` or `doctor_no_show`. The refund service dispatches a 100% reimbursement, debits the doctor pending account, and updates dispute to `RESOLVED_REFUND`.
   - **Case B: Claim Rejected (Full Service Delivered):**
     Update dispute to `RESOLVED_REJECTED` with detailed notes.

---

## 4. RUNBOOK 4: Data-Subject Deletion Request ("Delete My Data") (§82)

### 4.1 Trigger Conditions
- Patient submits account deletion request via profile settings or `DELETE /api/user/delete`.

### 4.2 Five-State Deletion Execution Ladder
When a deletion request is initiated:
1. **Immediate State: `DELETION_REQUESTED`:**
   - Account credentials invalidated; user logged out across all devices.
   - Profile removed from directory matching and community visibility.
2. **Audit & Hold Evaluation:**
   - Script checks for active legal holds or pending financial transactions:
     - Open disputes or chargebacks?
     - Pending payouts within statutory 72-hour delay?
   - If hold exists, transition to `RETENTION_HOLD`. PII is locked and restricted to compliance review.
3. **Anonymization Stage: `ANONYMIZED`:**
   - Direct personal identifiers (Name, Email, Phone, IP logs) are overwritten with cryptographic hashes (`deleted_user_<hash>`).
   - Ledger records retain monetary totals to ensure balance invariants remain intact (without PII).
   - Clinical consultation notes and prescriptions are archived to encrypted offline storage to comply with statutory medical malpractice retention laws (5 years).
4. **Final Destruction: `DELETED`:**
   - Upon expiration of the 5-year medical statutory limit, the underlying encryption keys for archived records are permanently destroyed.
