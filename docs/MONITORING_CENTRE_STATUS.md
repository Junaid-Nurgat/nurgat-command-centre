# Nurgat Tours — Monitoring Centre: Current Prototype and Next Steps

Updated: 16 November 2026. This document contains no credentials or passenger records.

## Already running in n8n (separate from this public website)

The existing agency n8n instance has three active monitoring workflows:

- **Global Failure Logger** — uses an n8n error trigger, stores a safe failure summary in an internal data table, and has an internal Gmail alert path.
- **Daily Reliability Snapshots** — scheduled for 08:00 Africa/Lusaka, reads internal failure records and records a compact summary.
- **Pending Failure Alert Recovery** — scheduled every six hours to check for unsent internal admin alerts and retry delivery.

Connector execution metadata verified on 16 November 2026 showed the daily and six-hour workflows completing successfully on schedule. **A successful scheduled run does not prove that every failure is captured or that any particular alert was delivered.** Production delivery, escalation and recovery require separate tests. No production credentials or incident contents belong in this public repository.

The previously paused service-authenticated staging handoff is still paused. Monitoring improvements do not depend on resolving that unrelated JSON response issue.

## Staff Command Centre's new Issues tab

The Command Centre training UI now shows a **session-only fictional workflow issue monitor**:

1. A failed or rejected fictional flight search creates a safe `SEARCH` notice.
2. A failed or unconfirmed fictional snapshot save creates a safe `SAVE` notice.
3. A prominent banner appears automatically while the staff session is open.
4. Staff may open **Issues** to see the short, predetermined troubleshooting description, or clear local notices.

This client-side view records **only an allowed issue category and the local time**; it never copies error details, access tokens, headers, contact information, raw messages or passenger data. The list is capped at 15 notices and cleared on logout or page reload.

**Scope limitation:** These notices are **not** a secure, live n8n incident feed; clearing them does not fix the failing workflow. They cannot detect problems happening in n8n when the staff dashboard is closed. Existing backend n8n email and scheduled checks remain separate.

## Before a real monitoring feed

A future cross-client/production command centre needs agency-owner approval for a **server-side read-only incident-status endpoint** with:

- Authentication and active staff authorization at the backend (not just in browser code)
- Clear per-client separation and least-privilege permissions
- Safe status categories, time, aggregate counts and stable incident IDs only
- Strict redaction and retention limits; never transmit provider keys, headers or personal messages
- Rate limiting, reliable idempotent incident transitions and tested alert-delivery acknowledgements
- Monitoring of the monitor itself, including failures to deliver alert email
- Human approval for changes that affect bookings, customer messages, suppliers or payments

No API credentials, raw failure records or private n8n URLs should be embedded into a public GitHub Pages frontend. Do not treat the UI's session-only notices as a live production health indicator.

## Safe browser QA

`tests/lite-monitor-browser.test.cjs` verifies simulated search and save failures, visible attention banner, exact prewritten issue summaries, no raw error content, manual save retry and logout clearing. All Supabase requests are mocked.
