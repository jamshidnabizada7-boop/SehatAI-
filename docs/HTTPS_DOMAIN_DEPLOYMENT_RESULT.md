# SehatAI HTTPS deployment result

Executed October 11, 2026 (Asia/Karachi). Deployment: **WORKING**. Full application verification: **incomplete**, with the specific limits below.

| Requested result | Verified outcome |
| --- | --- |
| Final URL | https://sehatai.myariahub.com |
| Website status | HTTPS route and staging unlock work without SSH forwarding. First-time visitors should open https://sehatai.myariahub.com/staging/unlock. |
| Cloudflare Access status | **NOT PROTECTED BY CLOUDFLARE ACCESS**, as explicitly authorized in the owner's revised instruction. SehatAI's existing staging gate remains required. |
| Approved login email | Cloudflare account identified as `ja***@gmail.com`. No email allow policy applies; the revised configuration uses the staging key. |
| DNS and tunnel | Proxied CNAME to isolated `sehatai-staging` tunnel; four healthy connector connections; dedicated `sehatai-tunnel.service`. |
| Login and unlock | Real synthetic patient and doctor password login succeeded through the HTTPS UI and APIs. Unlock succeeded; invalid and previous staging keys returned 401. Logout cleared the NextAuth user session. |
| Video calling | **UNVERIFIED**. Single-browser attempt reached the call dialog but failed with an unsupported `RTCPeerConnection.setConfiguration` operation. The UI subsequently reported a direct-WebRTC fallback; no media exchange was demonstrated. Isolated Edge was unavailable. Token issuance is not counted as a successful call. |
| Desktop/mobile browsers | Desktop landing, patient login, doctor portal, consultation workspace, messaging, and legal consent page verified. Mobile viewport requests did not apply: measured widths stayed 939 or 1280 pixels, rather than 390. Mobile rendering and real print preview remain unverified. |
| Credential rotation | Staging gate and NextAuth signing secrets rotated; old key and old signed session rejected over HTTPS. No additional current Supabase/LiveKit credential exposure was confirmed in the inspected transcripts. Their connectivity credentials were preserved. |
| ARIA Hub health | All six existing production/test hostnames returned HTTP 200 after redirects. Original tunnel, web, candidate, and worker services remained running; Docker containers remained running, with PostgreSQL healthy. Root disk retained 8.6 GB free. |
| Owner actions remaining | Use the rotated `STAGING_ACCESS_SECRET` entry in the local `.env.staging` to unlock each new device. A separate two-device media test, mobile rendering check, and print-preview check remain required. Normal assistant behavior also needs correction/configuration before full functional acceptance. |

## Executed infrastructure changes

- Created tunnel `sehatai-staging`, ID `59f9a943-db3f-42c9-b8ec-6b0194772cd2`.
- Created only `sehatai.myariahub.com` DNS record, ID `f34a3dc5f633781a3583c880f52bdf88`; target `59f9a943-db3f-42c9-b8ec-6b0194772cd2.cfargotunnel.com`.
- Added isolated configuration `/etc/cloudflared-sehatai/config.yml` and service `/etc/systemd/system/sehatai-tunnel.service`. Tunnel credentials are readable only by root and the dedicated service group.
- Origin remains `http://127.0.0.1:4000`. No Oracle public port was opened.
- Set `NEXTAUTH_URL` and `NEXT_PUBLIC_APP_URL` to the HTTPS hostname and `NEXTAUTH_URL_INTERNAL` to the loopback origin. Preserved deployed release v0.2.4; no application rebuild or source deployment occurred.
- Backed up the original service environment under root-only `/etc/sehatai/backups/20261011T074236Z` before rotation. Restarted SehatAI and the new SehatAI tunnel only.
- Secured local SehatAI `.env`, `.env.local`, and `.env.staging` ACLs to the owner, SYSTEM, and Administrators. Restricted the old SehatAI release's environment file to mode 0600.
- Added exact-host cache rule `SehatAI staging — bypass shared and browser cache`, ID `1af9d8eff4e24bb79ab1a6fcc4dc87e6`, after the four existing ARIA rules. The existing shared HOME rule had cached SehatAI's authenticated landing shell; the new rule corrected that bypass. Anonymous requests were retested after authenticated visits and returned 401 with `cf-cache-status: DYNAMIC`.
- No Cloudflare subscription was activated and no billing commitment was accepted.

## Verification evidence

- **28/28 HTTPS/API checks passed**: anonymous application/API denial, invalid key rejection, secure unlock and session cookies, CSRF rejection, real patient/doctor login, landing page, 20 static assets, directory, three legal documents, consultation details, doctor receipt of the synthetic browser message, prescription issuance block, booking/payment/payout/upload blocks, role enforcement, cache isolation, and signout.
- Separately verified the revoked gate secret and revoked signing secret; HTTPS certificate validation passed and covers the hostname. Issuer: Let's Encrypt; expires January 2, 2027.
- Explicit synthetic chest-pain emergency test displayed the reviewed emergency template and alert.
- **Assistant limitation:** a mild sore-throat query received an emergency fallback despite a self-care banner. The staging AI-provider keys are placeholders. This result is not counted as a normal assistant pass, and the deployment does not resolve that existing behavior.
- Synthetic consultation messages remain labeled as deployment tests and contain no patient information. Existing prescription fixtures visibly show “DEMO — NOT VALID FOR DISPENSING.”
- `STAGING_AUTH_REQUIRED`, booking/payment/upload blocks, synthetic-only requirements, and external-delivery block remain enabled. Payments, doctor payouts, and prescription issuance remain disabled.

Machine-readable checks: [https-domain-verification.json](../temp/https-domain-verification.json).

Screenshots: [desktop consultation](../temp/sehatai-desktop-consultation.png), [Cloudflare cache rule](../temp/cloudflare-sehatai-cache-rule.png).

All secrets are omitted from this report and the check results.
