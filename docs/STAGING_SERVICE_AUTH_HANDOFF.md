# Nurgat Tours — staff-to-n8n service authentication (STAGING ONLY)

Prepared 16 November 2026. **Not deployed, not activated, no real customer data.**

## Current demo vs. planned secure path

Existing demo: browser → authenticated Supabase Edge → existing n8n demo webhook. The current demo passes a reusable staff JWT inside its request to n8n, where downstream nodes use it for reviewer verification. The live demo and existing published n8n workflows have **not** been modified.

Proposed staging path:
1. Staff sends a valid signed-in Supabase session JWT to a dedicated staging Edge Function in the Authorization header.
2. Supabase verifies the session via Auth and checks the active reviewer row under that user's RLS permissions.
3. Edge validates **only** the fictional LUN → DXB, one-way, single-adult staging request and stable request ID.
4. Edge calls a **new, separately authenticated n8n staging webhook** using a different server-only service credential in `x-nurgat-service-key`. Only trusted `actorId`, request ID and fictional itinerary fields go in the body; **never** the staff access or refresh token.
5. n8n Webhook **Header Auth** must reject unmatched callers **before** executing any workflow. A separate n8n credential should hold the exact header name/value; don't implement a plaintext IF-node comparison.
6. The staging response is validated and returned with `providerConnected=false`, `customerSendAllowed=false`, `bookingAvailable=false` and `ticketIssuanceAllowed=false`.

Supabase code locations (not deployed):
- `supabase/functions/_shared/staging-handoff.mjs` — isolated authorization/allowlist/sanitization contract.
- `supabase/functions/nurgat-service-handoff-staging/index.ts` — draft Deno Edge entrypoint, reviewer verification using Supabase Auth and RLS, outgoing n8n Header Auth.
- `tests/staging-service-auth.test.mjs` — 14 offline defensive contract cases, no network.
- `.github/workflows/staging-service-auth.yml` — automatic PR checks.

## Verified staging workflow checks — 16 November 2026

We executed **real n8n manual workflow tests using only pinned fictional Webhook input**, not public HTTP calls:

- Execution `156` — **PASS**: accepted the fixed fictional single-adult LUN → DXB one-way request and returned `GDS RESEARCH PLAN — NOT CONNECTED` with all customer, booking and ticketing controls false.
- Execution `157` — **PASS (expected rejection)**: identical request with `bookingAvailable:true` failed with `Unsafe service flags`.
- Verified the workflow is **unpublished** and its Webhook node has `authentication: headerAuth`, but **no Header Auth credential is assigned yet**.
- Applied and confirmed execution settings: `saveExecutionProgress:false`, `saveManualExecutions:false`, `saveDataErrorExecution:none`, `saveDataSuccessExecution:none`, `executionTimeout:30` seconds.

**Important limitation:** Pinned manual tests bypass inbound Webhook Header Auth and do not confirm a network-level secure connection. A separate credential setup and real authorized staging HTTP test are still required. They do not prove n8n published-service behavior or production readiness.

## Configuration after agency-owner authorization

**Never put secrets into GitHub, chat, JavaScript served by GitHub Pages, spreadsheet rows, screenshots or logs.**

A new **unpublished** two-node n8n staging workflow was created for this design:
- **Name:** `Nurgat Tours — Service-Authenticated Staging Handoff (UNPUBLISHED)`
- **Workflow ID:** `Gbufqf35yLG8aHl1`
- **Editor:** https://nurgattourszm.app.n8n.cloud/workflow/Gbufqf35yLG8aHl1
- **Location:** personal project `Junaid nurgat <nurgattourszm@gmail.com>`
- **Status:** Not active, Header Auth configured on webhook node, **no credential assigned**. The mock-only Code node validates exactly the fictional staging fixture and returns a locked GDS plan. The new workflow does not call external tools or connect to the GDS.

An authorized n8n administrator must create a **Webhook Header Auth credential**, name `x-nurgat-service-key`, value a fresh independent high-entropy string (at least 32 characters). Configure it on a NEW, unpublished staging webhook with path:

`nurgat-staff-service-auth-staging-v1`

The draft Edge Function uses the **test** endpoint only:

`https://nurgattourszm.app.n8n.cloud/webhook-test/nurgat-staff-service-auth-staging-v1`

An authorized Supabase project administrator must configure **server-side Edge Function secrets**:
- `NURGAT_STAGING_SERVICE_KEY` — EXACTLY the same high-entropy value as the n8n Header Auth credential.
- `NURGAT_STAGING_N8N_TEST_URL` — the approved exact `webhook-test` URL above.

These are *future setup steps*, not completed work. Do not deploy or activate the staging workflow until they are done; the function fails closed if the credential is missing. Preserve Supabase Edge `verify_jwt = true` and the in-function reviewer check.

**Important:** Existing unpublished "Original Staff Login Handoff (STAGING ONLY)" expects a JWT in the n8n payload and runs RLS-backed RPCs using it. It CANNOT be reused unchanged with the new service credential. Use a separate fixture-only staging workflow first; redesign per-user idempotency and data access before incorporating existing AI1/AI2 logic. The new staging boundary must not call booking, ticketing, real GDS, WhatsApp, or payment tools.

## Testing gates

Offline code contract (GitHub Actions):
- Approved reviewer, denied/revoked/failed auth and browser origin.
- Exact fictional fixture and no customer personal details.
- Missing service credential fails closed.
- Staff JWT is never forwarded to n8n.
- Generic errors don't disclose secrets.
- Unexpected upstream capability flags are rejected.
- Server response strips any unexpected upstream fields.

Still required in real, authorized staging before calling the integration complete:
- Provision the matched service credential safely in the two services.
- Test good and bad Header Auth credentials against the **test webhook** (no real customer data).
- Verify expected reviewer access, rejected unauthorized users, disconnected network, request tampering, duplicates, rate limits, replay control, and bounded execution logs.
- Complete idempotency with atomic persistence and staff ownership checks **before** adding any side-effecting workflow steps.
- Confirm actual Edge Function code is deployed only to the authorized test environment with `verify_jwt=true`.
- Keep all production or customer-facing features disabled.

Official references:
- https://docs.n8n.io/integrations/builtin/credentials/webhook/
- https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/
- https://supabase.com/docs/guides/functions/auth
- https://supabase.com/docs/guides/functions/secrets

## Owner decision pending

The API provider's identity remains unknown ahead of the agency's meeting during the week of 16–22 November 2026. This security hardening is independent of provider selection. It does not mean a real airline API or n8n production connection is available.
