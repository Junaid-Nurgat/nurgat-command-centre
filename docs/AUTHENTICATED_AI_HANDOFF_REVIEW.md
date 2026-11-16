# Nurgat Tours — Authenticated AI Handoff Review (November 2026)

**Stage:** Fictional-only, provider waiting. Review of the **existing** Command Centre → Supabase Edge → n8n flow.
This is not an announcement of production readiness or proof of a live end-to-end test.

## What already exists (reviewed 16 November 2026)

The GitHub Pages Command Centre already sends staff AI and GDS planning requests to its **Supabase Edge Functions**, not directly to an n8n URL.

1. The browser holds a staff sign-in session and sends the access token in the `Authorization` header to Supabase.
2. Active Edge Functions `nurgat-staff-flight-ai-demo` and `nurgat-gds-planner-demo` have JWT verification enabled and separately check the caller against the active reviewer list.
3. Those functions validate an allowlisted fictional request and forward it to published **n8n demo AI workflows**.
4. The Edge Functions validate the response and return limited, non-bookable data to the browser.
5. The browser checks mandatory safety fields and displays internal-only results. Customer delivery, flight booking and ticket issuance remain disabled.

The instance also has an **unpublished** `AI1 to AI2 Secure Handoff (DEMO ONLY)` workflow and an **unpublished** `Original Staff Login Handoff (STAGING ONLY)` workflow. Neither is the same thing as a completed production integration. The staging flow is restricted to a fictional fixture.

## What GitHub Actions now checks

File: `tests/lite-ai-handoff-browser.test.cjs`

Uses the real `index.html` inside Chromium with **every Supabase call intercepted and mocked**, including authorization and Edge responses:

1. Approved staff session opens workspace.
2. Fictional staff AI request reaches only the authenticated Supabase Edge route with a restricted request body.
3. GDS planner receives the exact structured flight request, not a token in the JSON body.
4. Browser rejects a response falsely claiming booking is enabled.
5. Browser rejects a response falsely claiming a real provider is connected.
6. Backend errors cannot be treated as successful AI answers.
7. A question with contact information is rejected before being forwarded.
8. A revoked reviewer cannot open the staff workspace or trigger AI requests.

The existing 14 Chromium tests for saved-request reliability continue to run as well.

**These are isolated browser-contract tests only.** They do not prove that the live n8n ↔ Edge handoff works with a real staff JWT, and do not make any production calls.

## Security concern discovered (needs work before production)

Current Supabase Edge Functions forward the staff's JWT **inside the JSON request to n8n**. Existing n8n webhooks have `authentication: none` and instead verify requests downstream using the supplied session. This works as a layered demo pattern, but staff tokens can potentially be retained in n8n execution data or logs if execution recording is enabled.

Before enabling the larger AI1 → AI2 handoff or handling real customer data:

- Change the Edge → n8n boundary to **server-to-server authentication** (for example an authenticated private gateway or a properly verified signed short-lived request). Keep the real staff session verification **at the Edge**, and do not forward reusable staff JWTs to workflow execution payloads.
- Bind every request to a verified staff identity and an unguessable request ID; enforce strict field allowlists and idempotency with atomic database checks.
- Restrict n8n webhook exposure and logging, redact credentials and customer data, and enforce timeouts and rate limits.
- Verify revoked staff access, cross-user isolation, duplicate requests, stale tokens, upstream error handling and failures at the actual Edge and n8n boundary.
- Confirm backend-only secrets, no secrets or signing keys in the browser or public GitHub repository.
- Keep the sandbox and production environments separate.
- Preserve `providerConnected:false`, `customerSendAllowed:false`, `bookingAvailable:false` and `ticketIssuanceAllowed:false` through all internal demo interfaces.

These are requirements for the **next security hardening stage**, not features claimed to exist now.

## What we deliberately did not change

- No live n8n workflow published or edited.
- No Supabase Edge Function, authentication provider, RLS policy or database schema changed.
- No airline/GDS API calls, customer communications, payment or ticket issuance.
- No staff access tokens or provider credentials added to GitHub.

## Meeting handoff

The uncle's API-team meeting is expected in the week of **16–22 November 2026**. Ask about the provider name, test environment, credentials issuance, API documentation, authentication, allowable operations, API pricing, production certification, and how provider access should be secured.

**Next engineering milestone:** implement and test the secure Edge → n8n service boundary in staging only, then test the end-to-end fictional handoff with an authorized account and safe logging settings.
