# Nurgat Tours — Pre-Approval Build Handoff
Updated November 13, 2026.

## Why this exists
The internal CEO Command Centre and demo automation suite can be inspected before the agency obtains external authorizations. All providers, booking and customer messaging remain blocked. No private keys or actual customer content is stored in this document.

## Implemented and verified in n8n
### Already operating (test/demo)
- CEO AI Bridge `5gtdDG3vq2JBFQxB` — active, verified successful webhook processing earlier.
- Global Failure Logger `ZAxm8dI81QMZYT8u` — active, verified failure-to-log execution 56 → 57.
- Reliability Health Check `LsCEPhu6meQ5uuAe` — manual, execution 68 verified.
- Daily Reliability Snapshots `OiuR7XhPWq6GSh0J` — active, scheduled 08:00 Africa/Lusaka, outputs to private n8n table. Executions 66, 69 verified; zero-row handling configured with `alwaysOutputData`; errors routed to Global Failure Logger.

### New safe reusable modules (not active publicly)
- Flight Request Validation Gate (DEMO ONLY): `PiXTI0iGQc3J1hqi`.
- Flight Intake Safety Tests (OFFLINE): `BM5L4LLM24HcvSy9`. **22/22 passing, execution 70**. 3 valid fixture requests become internal search drafts; 19 are blocked. Personal email/phone fields dropped; no live API calls or customer actions.
- Universal Flight Provider Normalizer (OFFLINE): `EWUXSBU141ftPm6y`. **18/18 passing, execution 64**, using reusable Provider Adapter Contract `D8fNN8td7kHKeUNK`. Fares not ranked without comparable travel requirements and validated fare scope.
- Usage Budget Decision Gate (OFFLINE): `p5Y1c8LtdkUdfnrA`.
- Usage Budget Threshold Tests (OFFLINE): `Rc1QgmHkXJa3xyxK`. **18/18 passing, execution 72**. Checks 70/85/95/100-percent thresholds; refuses to assume credit allowance for unverified data. This **does not enforce budgets in live AI workflows yet**.
- Failure Email Draft Preview (NO SEND): `XZpnL5Acte3wbkx1`. **Execution 74** found zero legitimate incidents and sent nothing.

## What the modules protect
- Requests: reject invalid IATA format, past/invalid departure dates, invalid return trips, unreasonable passenger counts, unsupported cabins/currencies/providers, or any input not explicitly tagged as fictional test data.
- Credentials: all offline workflows do not require GDS keys; never place production secrets in browser JavaScript or GitHub.
- Costs: unknown balances mean manual review, not assumed unlimited credits.
- Messages: all new modules disable customer sending, payments, reservations and ticket issuance.

## Explicit external approval boundary
1. **Business decision**: agency owner confirms Amadeus and/or Travelport product, account ownership, API terms, authorized credentials, and flight booking/ticketing arrangement (including consolidator requirements if applicable).
2. **Notification authorization**: agency admin chooses business notification destination and grants permitted Gmail/SMTP service connection. The email preview must not be enabled for delivery until authorized and tested.
3. **Billing visibility**: agency owner confirms n8n plan, billing cycle, remaining executions, n8n AI Gateway allowance, and whether an agency-owned OpenAI API account is needed. Without verified balances, live spend alerts and automatic budget enforcement cannot be truthfully enabled.
4. **Production infrastructure**: agency selects hosting permitted for commercial use, confirms authentication/password-protection policies, operating SLA, adult administrator responsibilities, privacy/legal compliance, and customer communication approval.
5. **Production go-live**: perform authenticated real API sandbox verification, end-to-end integration and price/reprice tests, monitoring/alert testing, and explicit owner signoff for each action category. No assumptions that live flight results are automatically safe/bookable.

## Notes for reviewer
- The **GitHub repository is PUBLIC** and currently contains static demo code. The publishable Supabase browser key is not secret; do not commit service role or private API keys.
- GitHub Pages is being used as a demo; review hosting terms and move the commercial operations app to compliant hosting before handling real customer data.
- Existing demo customer data and client approval flows remain blocked from real communication.
- Saved snapshots are not email alerts. n8n/Gateway balances are **not** available from these workflows.
- The shared normalizer currently accepts only test fixtures. Do not mistake the synthetic Travelport-shaped payloads for a provider-certified live parser.

## Post-approval work — November 13, 2026

The agency owner has reportedly approved continuing with internal reliability preparation, but the necessary third-party account access is not present in the connected n8n project.

- **Prepared:** `Nurgat Tours — CEO Failure Alerts (AWAITING EMAIL AUTH)`, workflow `qJgu6yWM9hH3yLWi`. It reads pending private error records and creates a sanitized incident email. The Gmail send node is deliberately **disabled** and the workflow is **inactive**. Test executions **75** (no incident) and **76** (synthetic incident) succeeded; **no email was sent**.
- **Business Gmail OAuth needed:** n8n currently lists a `Google Sheets account` credential only. This is **not** a Gmail send credential. A separate authorized agency Gmail OAuth connection must be completed by the agency administrator in n8n. The connected ChatGPT Gmail account is a different personal account and was not used to send business alerts.
- **Billing/quota still blocked:** no tool-connected actual n8n account execution limits or remaining AI Gateway credits are available. The offline threshold gate is tested, but not wired to real balances; it must not be described as active credit protection.
- **GDS still blocked:** no Amadeus Self-Service or Travelport credentials are available or verified.

After agency Gmail OAuth is connected, verify sender/recipient, perform one approved non-customer test message, add deduplication and delivery audit, and only then enable scheduled or immediate email delivery. Do not simply activate the current disabled node.

## Gmail alert integration VERIFIED — November 13, 2026

The agency n8n project now has a `gmailOAuth2` credential (Gmail account). Only the credential **reference** is used by n8n workflows; the credential secret is not stored in this repository.

### Active automation
- **Global Failure Logger** `ZAxm8dI81QMZYT8u` (ACTIVE): persists sanitized failure metadata first, skips events marked `TEST_EVENT`, then emails the Nurgat Tours administrator inbox `nurgattourszm@gmail.com` through authenticated Gmail. After a successful Gmail API response, it saves `notification_state=SENT`, message ID and timestamp to the private internal failure log.
- **Pending Failure Alert Recovery** `ID2H2sN9gEwuFvKp` (ACTIVE): checks every six hours in `Africa/Lusaka`. It looks only for failure rows still marked `NEEDS_REVIEW` and `notification_state=PENDING`, sends a sanitized digest, and records Gmail receipts. When there are no pending alerts it sends nothing. As with any email+database two-system workflow, a crash after sending and before saving the receipt can yield a duplicate; the digest warns of this.
- **Daily Reliability Snapshots** `OiuR7XhPWq6GSh0J` stays ACTIVE, with an 08:00 Zambia schedule.

### Verified executions
- `77`: one-time actual Gmail API send to `nurgattourszm@gmail.com`, succeeded and returned Gmail message ID. Test workflow archived.
- `78`: synthetic event persisted with `notification_state=SKIPPED_TEST`; no email sent.
- `79` + `80`: controlled invalid request caused production-mode CEO AI Bridge error, ran the global error logger, sent the administrator alert, and persisted the Gmail message receipt. That log row has been reclassified to `TEST_EVENT` while preserving the sent receipt.
- `82`: recovery workflow with empty pending queue, completed without email.
- `83`: recovery branch tested using pinned synthetic input and synthetic Gmail receipt, no external email sent.
- One-time test workflows and the superseded no-send alert draft were archived.

### Remaining external dependencies
- **GDS**: provider API credentials and commercial authorization still pending. No live flight data, bookings or customer communications.
- **Usage & billing**: n8n monthly execution quota, remaining AI Gateway credits and API budget are not accessible through connected tools. The existing usage budget gates are *offline logic*, not enforced against production billing.
- **Production hosting & compliance**: CEO dashboard public GitHub Pages demo isn't approved as the live commercial operations host; perform hosted login/access audits and move to a compliant environment before real customer data.
- **Operational hardening**: validate admin escalation, mail bounce/delivery monitoring, external uptime monitoring and permission reviews before production.

## Latest independent pre-API audit

[Pre-API System Audit — 2026-11-13](PRE_API_SYSTEM_AUDIT_2026-11-13.md) summarizes verified offline tests, email monitoring fixes, security findings, and remaining authorization gates. It does not certify production readiness.
