# Mission 1 — Static CI and Authentication Gate Audit
**Date:** 14 November 2026
**Status:** Verification in progress; workflow remains unpublished.

## Scope inspected
- GitHub Actions: `.github/workflows/flight-research-static-ci.yml`
- Original app static suite: `scripts/test-flight-ui.mjs`
- Lite app static suite: `scripts/test-lite-ui.mjs`
- Future ingress contract: `src/handoff-contract.mjs`
- Future ingress unit suite: `scripts/test-handoff-contract.mjs`
- n8n handoff: `Ovchtd30RvioSeL7`
- Supabase project: `ysakhagnlmhwbbmetjjc`, handoff RPCs and deduplication table

## Verified results
1. The GitHub Actions configuration **includes all three Node tests** on main branch pushes affecting the relevant files or on manual dispatch.
2. Both new handoff JavaScript source and its test source were syntactically checked in an isolated JS parser in prior work; **18 isolated handoff logic scenarios passed**, with a simulated HMAC implementation. This does **not** verify the real Node `crypto` execution.
3. GitHub commit status API returned an empty status list for a recent commit; the available commit-run listing returned no PR-triggered runs. Neither establishes that GitHub Actions ran or passed. **Remote CI status remains UNKNOWN.**
4. n8n handoff is still **unpublished**, at **10 nodes**.
5. Supabase `public.ai_handoff_dedupe` has RLS enabled and **no direct SELECT/INSERT** access for the `authenticated` role; `anon` has no direct SELECT.
6. Anonymous role cannot execute `claim_ai_handoff` or `complete_ai_handoff`. The `authenticated` role can execute both and the functions include active-reviewer checks. **Actual external Supabase JWT and reviewer session testing is still pending.**
7. Supabase security advisor continues to flag the two `public` `SECURITY DEFINER` functions as potentially risky. They are not marked resolved merely because role and reviewer checks exist.

## Follow-up gates in strict order
- [ ] Confirm green GitHub Actions run for all three Node tests. If red, inspect GitHub Actions job logs and fix.
- [ ] Establish an authorized, controlled test reviewer account and perform actual Supabase REST authentication; do not share passwords or JWTs in tickets, GitHub or chat.
- [ ] Verify the `claim_ai_handoff` and `complete_ai_handoff` HTTP calls with real reviewer authorization, negative role cases and failure messages.
- [ ] Review public-schema `SECURITY DEFINER` exposure and consider moving privileged mutations behind a trusted server function/private schema with least privilege.
- [ ] Add provider-signed webhook verification, per-tenant rate limiting, replay protection and concurrency/load tests at trusted ingress.
- [ ] Confirm the approved WhatsApp provider and owner permission. No changes to existing WhatsApp until authorized.
- [ ] Only then authorize a controlled internal demonstration; live GDS needs provider entitlements and sandbox/API access.

## Privacy and non-production guarantees
All checks were read-only. This audit did not enable production n8n, modify WhatsApp, book flights, send customer messages, enable payments, access real customer records or change the two dashboards.

## Key correction
The n8n handoff includes a webhook with `authentication: none` and later reviewer JWT checks in Supabase. This is **not sufficient for public production ingress** without per-request provider authentication, abuse limits, protected credential handling and a verified end-to-end route.


## Follow-up verification — 14 November 2026

**Local Node.js:** Reconstructed the exact contents of GitHub `src/handoff-contract.mjs` and `scripts/test-handoff-contract.mjs` in an isolated local directory. Both passed `node --check`; the entire handoff test script **passed on Node v22.16.0 using the real built-in `node:crypto` HMAC**:
```
PASS: server-side handoff schema, no-PII, stable dedupe IDs and AI2 safety contract.
```
This verifies the standalone handoff regression suite, **not** the original/Lite dashboard tests, browser auth, remote GitHub Actions, or live n8n HTTP integration.

**GitHub CI visibility:** Commit status lookup returned no status entries and the GitHub connector's commit workflow-runs endpoint returned an empty list. The latter lists only pull-request-triggered runs; it cannot verify this push-triggered workflow. A direct public GitHub Actions/API lookup was unavailable. **Remote CI remains unverified.**

**n8n controlled negative authentication attempt:** Manually submitted fictional travel data and an invalid, fabricated JWT (not a real user token) to the *unpublished draft* trigger via the n8n execution tool. It returned execution ID **121** / `started`. Retrieving its result returned `Execution '121' not found`, consistent with the configured `saveManualExecutions: false`. Therefore **this run is inconclusive**; do not claim real auth rejection from it. No customer/real JWT used.

**Auth review:** n8n webhook authentication is `none` and protected only by downstream request/JWT validation, so it must not be published as a publicly callable entrypoint. A trusted, provider-verified server ingress and a test run with outcome visibility are still required. Do not enable customer sending or real GDS to test this.

**Next test design:** Use a dedicated **isolated** staging workflow with (1) fictional input only, (2) explicit outcome output visible from the test executor, (3) authorization denial checks without exposing credentials, and (4) no published public endpoint. For authenticated positive tests, use the approved business test account and the platform's secret management; never paste JWTs into GitHub/chat.


## Isolated n8n staging verification — 14 November 2026
- **Created unpublished** 3-node n8n workflow `gThD3QJgZM3yUfaM`, **Nurgat Tours — Isolated Authentication Contract Tests (NO LIVE IO)**. Project: `Junaid nurgat <nurgattourszm@gmail.com>`, personal project `QAMemlGB8a2W38dU`.
- Workflow has **manual trigger → four synthetic auth-shape cases → safety assertions**, with **no HTTP requests, webhook trigger, secrets, AI calls, customer messages, provider access, or GDS calls**.
- n8n `test_workflow` with pinned manual trigger returned `success`, execution **122**; logic nodes executed normally.
- Synthetic cases: missing JWT denied, malformed JWT denied, inactive simulated reviewer denied, correct-looking JWT with active simulated reviewer **NOT authenticated** (reported `SHAPE_ONLY_NOT_AUTHENTICATED`, never claimed live authorization).
- Direct Supabase SQL transaction (rolled back): both **no identity** and **non-reviewer identity** calls to `claim_ai_handoff` were rejected, checked by assertions inside one transaction. This did not validate real signed tokens or API HTTP permissions.
- These are **pre-production test harness results**. Do not publish staging or production workflows or claim end-to-end auth has passed.

**Next: authorized real login and JWT bearer verification through Supabase REST and the exact n8n request path, with safe test account and redacted logs. This is a mandatory release gate.**
