# Nurgat Tours — Secured n8n Daily Snapshot Bridge

**Prepared:** 16 November 2026  
**State:** Code is implemented and tested independently. **Live access requires agency-approved, server-only n8n API credentials.** Do not interpret an unavailable connection as zero incidents.

## Goal

Let an **active approved staff reviewer** see a recent, safely projected n8n daily reliability summary from inside the Nurgat Tours Command Centre, without accessing n8n's raw workflow failures or operating n8n directly.

## Connection flow

1. Staff signs into the existing Command Centre with their own reviewer account.
2. Opening the **Issues** tab attempts a read-only GET against the isolated Supabase Edge Function `nurgat-monitor-readonly` (at most once per minute unless manually refreshed).
3. The Edge Function checks the exact permitted website origin, JWT user identity, and active membership in `approval_reviewers` using the staff JWT under existing RLS.
4. **Only after authorization**, the Edge Function can query the existing n8n **Daily Reliability Snapshots** table using a separately approved **server-only** API key.
5. The Edge Function returns **only** latest snapshot time, 24-hour recorded failure count, unreviewed incident count, known test count, and a stale/fresh indicator.

The fixed n8n table is `Nurgat Tours — Daily Reliability Snapshots`. No raw failure log, error messages, workflow name, customer information, API key, email address or incident narrative is returned. The key is never sent to GitHub Pages.

## Important: Not connected until agency approves a key

The new Edge Function reads an optional private environment variable:

- `NURGAT_MONITOR_N8N_API_KEY` — a key created by the agency's authorized administrator, ideally with **dataTableRow:read** scope only if the n8n plan supports scoped API keys.

**Never paste the key in GitHub, a browser, chat, screenshots or public documentation.** Arrange server-side secret entry through the agency's private Supabase project console by an authorized adult. No key has been created, provided, or configured by this repository change.

The upstream endpoint is fixed in server code to the agency's existing daily snapshot table; staff cannot enter an arbitrary URL. The n8n API supports `GET /api/v1/data-tables/{dataTableId}/rows`, with read-only scope. The Edge function never calls a write API.

If the key is missing, the function responds with `503 MONITOR_NOT_CONNECTED`. If the source is unavailable, malformed or unverified, the UI gives a safe warning, **never a green success badge**.

## Status interpretation

- **Latest snapshot available, fresh**: staff can see **last recorded counts** and timestamp, not a guarantee that all agency systems are healthy.
- **Stale snapshot**: dated older than 30 hours (or clock-skewed). Status warns staff not to assume health.
- **No snapshot**: bridge may be connected but no n8n daily summary has been recorded.
- **Not connected / unauthorized**: displays a neutral or error state without counts.

The separate **Issues** list remains a browser-session-only tracker for fictional search/save errors, not a live n8n incident feed.

## Security contract

- `GET` and narrow `OPTIONS` only; no mutation/booking.
- Requires allowed GitHub Pages origin **and** valid approved staff identity.
- No service-role key in the browser; no secrets in logs, requests or responses.
- Upstream key stays server-side in the isolated Supabase function.
- No raw n8n error strings or headers in the browser, regardless of upstream failure.
- Source responses are size-limited and timeout-bound.
- No customer messages, invoices, bookings, or tickets are processed.

## Verification

- `node tests/monitoring-readonly.test.mjs`: direct security and sanitization contract tests (mocked auth and n8n).
- `node tests/lite-monitor-readonly-browser.test.cjs`: real Chromium tests for UI, **mocked Supabase only**.
- Existing fictional UI and staging tests continue in the combined GitHub Actions QA workflow.

**What's not verified until credentials exist:** an actual n8n HTTP API response accepted by the Edge Function, live-network connectivity, key scope and expiration, and end-to-end freshness across outages. These require the authorized agency administrator's secure setup.

## References

- n8n API authentication: https://docs.n8n.io/api/authentication
- n8n Data Table API: https://docs.n8n.io/build/work-with-data/data-tables/
- Supabase Edge Function authentication: https://supabase.com/docs/guides/functions/auth
