# AI 1 → AI 2 automatic handoff — demo integration

Status: **Created in n8n, UNPUBLISHED for safety and E2E testing.** Date: 2026-11-13.

## Implemented today
- New n8n workflow: [AI1 to AI2 Secure Handoff (DEMO ONLY)](https://nurgattourszm.app.n8n.cloud/workflow/Ovchtd30RvioSeL7).
- Located in Nurgat Tours' personal n8n project (project ID `QAMemlGB8a2W38dU`).
- Four nodes:
  1. **Protected AI1 Staff Handoff**: internal POST webhook route, expects an authorized reviewer JWT and structured travel request. Has no official WhatsApp trigger.
  2. **Allowlist AI1 Request**: enforces exact trip schema (no names, phone numbers, emails, chat history, passport info, pricing or arbitrary fields); rejects malformed dates, airport codes, passenger counts and missing JWT.
  3. **Forward to Existing AI2 GDS Planner**: calls the existing n8n GDS research planning webhook and forwards the session for the planner's active-reviewer RLS authorization check. Does not call a live provider.
  4. **Enforce AI2 Read-Only Safety Gate**: requires disabled GDS execution, customer sending, booking and ticketing flags; rejects unsafe planner output and returns an internal-only plan.

## Security controls
- Reviewer JWT required; actual reviewer membership re-verified in the existing AI2 workflow using Supabase RLS. The webhook itself is not credential-authenticated, so **do not publish or reveal its URL as an open integration** without completing the authenticated E2E test, rate limiting, and ingress controls.
- No customer personal data accepted or forwarded.
- Successful/failed execution-data saving disabled; manual execution saving disabled. 45-second timeout, errors routed to existing Nurgat workflow error handler.
- No real WhatsApp inbound webhook, customer reply, supplier fare, pricing, confirmed availability, booking, or quotation.
- **The workflow is intentionally UNPUBLISHED**, so no production endpoint is live yet.

## Actual simulated n8n workflow execution tests
- n8n workflow test execution **99**: **SUCCESS** for a valid LUN → DXB one-way request. External AI2 HTTP call pinned/simulated; internal validator and final response gate executed normally.
- n8n workflow test execution **100**: **EXPECTED FAILURE** for request with `customerPhone` field.
- n8n workflow test execution **101**: **EXPECTED FAILURE** for missing reviewer JWT.
- n8n workflow test execution **102**: **EXPECTED FAILURE** for AI2 response claiming `customerSendAllowed:true`.
- The three failure executions returned an error with details hidden by redaction; the negative scenarios were rejected, but these are **simulation tests, not live Supabase membership or live AI2 calls**.

## Isolated code checks completed
- Valid structured route passed.
- PII field rejected.
- Missing reviewer JWT rejected.
- Same origin/destination rejected.
- Safe planner response accepted.
- Response with customer sending enabled rejected.
- These tests are isolated function checks, **not** authenticated end-to-end n8n execution.

## Next integration steps
1. Confirm the existing WhatsApp Business Agent's provider, control points and API permissions; **do not replace, disconnect, or modify it**.
2. Agree with uncle on what AI 1 can send to AI 2, consent/retention policy, and rate limits; include an agent ownership and escalation protocol.
3. Add server-side trusted ingress (e.g. authorized Supabase Edge Function), replay/duplicate protection, reviewer-bound authorization, and request status tracking. Never expose an n8n production webhook or JWT in browser source.
4. Test the handoff end-to-end using **test-only records**. Publish the workflow only after its authentication and abuse controls are validated.
5. At the API meeting, establish actual licensed GDS access, sandbox and permitted operations. Real offers, rules, taxes and price checks remain pending.
6. Create server-side customer-safe quotation workflow with approval of each verified offer/revision and controlled official WhatsApp delivery; all disabled until permission and live tests.

## Important distinction
The new n8n flow is a **real automatic inter-workflow transfer** for structured internal research planning once safely activated; it is **not yet** the promised end-to-end automatic WhatsApp → real GDS → quotation → customer messaging product.


## Day 2 — Durable request deduplication and execution tests (14 November 2026)

A new isolated table `public.ai_handoff_dedupe` stores:
- Agency reviewer ID, **stable request ID**, MD5 fingerprint of a validated travel-only payload
- State (`PROCESSING` or `COMPLETED`), lease and completion timestamps
- **No customer identity, WhatsApp messages, flight supplier costs or JWT tokens**

New RPCs:
- `claim_ai_handoff(p_request_id text,p_payload jsonb)` — atomic reviewer-scoped claim.
- `complete_ai_handoff(p_request_id text)` — mark a successful internal plan handoff complete.
- Both require an authenticated JWT and the account to exist as an **active reviewer**; direct table grants were revoked from `anon` and `authenticated`, and RLS is enabled.
- Reused ID with identical payload: `DUPLICATE_IN_PROGRESS` (if within 2-minute lease) or `DUPLICATE_COMPLETED`. **No repeat AI2 call.**
- Reused ID with different payload fingerprint: `CONFLICT`. **No AI2 call.**
- Failed/incomplete attempt can be reclaimed after 2 minutes; completion state prevents repeat processing. This is a demo lease, not a production distributed lock guarantee without concurrent tests.

n8n `Ovchtd30RvioSeL7` expanded from four to **nine nodes**:
`Webhook → Strict input allowlist → Supabase atomic claim → IF`
- `PROCESS` branch → AI2 planner → read-only safety gate → mark complete → final safe response.
- Duplicate/conflict branch → status response, **without contacting AI2**.
- Stable `requestId` (12–64 alphanumeric, underscore, or hyphen characters) is now mandatory with `jwt` and `request`.

**n8n pinned simulation results:**
| Case | Execution | Outcome |
|---|---:|---|
| New structured request | 104 | Success |
| Already completed | 105 | Success; stopped without AI2 |
| Duplicate in progress | 106 | Success; stopped without AI2 |
| Conflicting ID and payload | 107 | Success; conflict response without AI2 |
| Added customer email (PII) | 108 | Expected validation error |
| Missing request ID | 109 | Expected validation error |
| AI2 claims customer sending is enabled | 110 | Expected safety error |
| Completion persistence returns false | 111 | Expected error |

**Verification and security caveats:**
- This tested actual n8n logic nodes using pinned **simulated** HTTP results. It did **not** test real JWT verification, real PostgREST RPC calls, concurrency, lease refresh, or real AI2 output. Do not equate these tests with a production-ready integration.
- Supabase table RLS was verified on, direct `anon` and `authenticated` table read and insert grants verified off. RPC execute grants are limited to `authenticated`.
- The Supabase security advisor warns that two `SECURITY DEFINER` functions in `public` are executable by authenticated users. We intentionally included `auth.uid()` and active reviewer checks with restricted function grants, but **the warning remains open** for final architecture/security review. Preferred future migration: trusted Edge Function or private schema function with tighter server-only access.
- n8n validator warns that the **publishable** Supabase `apikey` header is statically configured in the two new HTTP nodes. It is a public browser key, not a service-role secret; move it to managed credentials/config before publishing.
- Existing older Supabase security advisor findings outside this feature were not changed.
- Workflow stays **unpublished** pending authenticated E2E, replay/concurrency/rate-limit tests, and approval for WhatsApp integration. No customer messages, GDS searches, bookings or payments.

**Idempotency handoff contract (for future authorized AI1):**
```json
{
  "requestId": "wa_event_20261114_abc001",
  "jwt": "<server-authorized-reviewer-session>",
  "request": {
    "origin": "LUN",
    "destination": "DXB",
    "departureDate": "2026-12-15",
    "returnDate": null,
    "tripType": "ONE_WAY",
    "adults": 1,
    "children": 0,
    "infants": 0,
    "cabin": "ECONOMY",
    "preference": "BEST"
  }
}
```
**Important:** This is a *test contract*, not a proposal to embed staff JWTs in WhatsApp messages. A production WhatsApp agent should authenticate server-to-server to a trusted ingress which assigns and verifies the agency identity, manages credentials, derives a stable WhatsApp event ID and sends the minimized request onward. The browser/AI prompt must not contain credentials or staff JWTs.



## Day 2 security hardening — lease ownership and direct database verification

**Implemented:**
- Added `lease_token uuid` and `attempt_count` to the reviewer-scoped deduplication store.
- Strengthened payload fingerprinting to SHA-256 (instead of MD5) and fixed the date-pattern issue in the database validation.
- Each fresh claim or retry receives a **different lease token**.
- `complete_ai_handoff` now requires `p_request_id` **and the matching `p_lease_token`**, so an old attempt cannot mark a newer retry complete.
- Max **three** attempts per request ID. Additional retry requests return `RETRY_LIMIT_REACHED` and require staff investigation.
- Updated the unpublished n8n workflow to **10 nodes**, including a lease-token check before AI2 and a completion call bound to the lease token.

**n8n simulation executions (112–119):**
- 112: new claim + valid lease + safe plan + completed write → success
- 113–114: already complete / in progress → duplicate response without AI2
- 115: conflicting ID → conflict response without AI2
- 116: retry limit reached → blocked response without AI2
- 117: missing/invalid lease → expected failure
- 118: unsafe AI output → expected failure
- 119: completion RPC returns false → expected failure

**Direct Supabase SQL transaction assertions (all rolled back):**
1. Fresh claim returns `PROCESS` plus a new lease token.
2. Duplicate while running returns `DUPLICATE_IN_PROGRESS`.
3. Same ID with modified route returns `CONFLICT`.
4. Completion with wrong token is rejected, correct token succeeds.
5. After completion the duplicate returns `DUPLICATE_COMPLETED`.
6. Forced stale lease permits retry and rotates token.
7. Older token cannot complete the newer lease.
8. Third attempt is last; fourth claim yields `RETRY_LIMIT_REACHED`.
9. A post-test query confirmed zero persisted test rows.

**Scope and remaining risks:** Tests directly exercised the database functions using a transaction-scoped simulated reviewer identity; they did **not** authenticate through the real external Supabase REST or live n8n HTTP call, and did not test concurrent cross-worker timing. We still need rate limiting, verified server-to-server ingress, production credential management, documented incident retry policy, and external-service E2E testing. Elevated `SECURITY DEFINER` functions remain subject to the security advisor warning (reviewer checks are present). The n8n workflow remains **unpublished**. No WhatsApp/GDS/customer messages were triggered.
