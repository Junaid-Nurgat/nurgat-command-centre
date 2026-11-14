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
