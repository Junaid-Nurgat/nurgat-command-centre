# Nurgat Tours — Automatic Enquiry Intake (Safe Demo)

Updated: 16 November 2026

## What is available in the Command Centre

A clearly labeled **Mock Inbox** displays two built-in fictional flight enquiries:

- Sample 1: LUN → DXB, one adult, one-way, economy.
- Sample 2: LUN → JNB, two adults, round-trip, economy.

Clicking **Process fictional example (1 click)** fills the itinerary, checks the existing fictional flight-search backend, selects its best-ranked sample based on the preset preference, prepares an unreviewed test quotation and auto-saves the fictional request snapshot to the authenticated staff account.

The **Process all remaining fictional examples (1 click)** button executes the same fictional-only flow **sequentially**, one sample at a time. Staff can leave the batch alone while it completes. If a search or save fails or cannot be confirmed, the batch stops instead of skipping the failure or falsely marking a sample completed. Only successfully confirmed samples are marked processed during that browser session; clicking again attempts only the remaining samples. The last draft remains unreviewed, and the Saved tab contains the individual test snapshots. This is not scheduled/background automation and does not run after the browser is closed.

The button is disabled for a successfully processed fixture for the remainder of that browser session. Staff can still manually use the existing search/quote/save workflow. If the search or save fails, the sample stays available for retry and the draft is not falsely reported saved.

**No real inbound channel exists.** These examples are hardcoded into the demo. They do not ingest messages, contact information, real fares, provider inventory or personal records. The demo does not contact customers and cannot book or issue tickets.

## What is needed for a real automatic enquiry inbox

The agency owner must first approve an inbound channel (for example a business email mailbox or an approved WhatsApp Business solution) and its data-handling terms. The specific provider, credentials, permissions and message-delivery rules are **not yet selected**.

Future production intake should be a separate server-side authenticated service, never implemented with customer messages or credentials in public GitHub Pages source. It will need:

1. **Verified source authenticity** using the provider's supported server-side authentication or signature verification.
2. **Consent and data minimization** for any real personal/customer information; don't store raw messages unnecessarily.
3. **Per-client access control**, safe logging with redaction and a clear retention/deletion policy.
4. **Idempotent event IDs** and deduplication across retries, message replay and multiple staff sessions.
5. **Clear staff exception handling** for ambiguous or incomplete dates, routes, traveler counts and fare rules.
6. **A non-booking workflow** until real flight API access, verified offer pricing, commercial approvals and any required provider certification are complete.
7. **Explicit staff approval** of a specific verified quotation before any separately approved customer delivery. Never authorize the AI to book, pay or issue tickets automatically.

## Separation of environments

- **Mock inbox (current):** two known synthetic requests in the training UI. Backend returns explicitly fictional sample offers. Internal snapshots remain demo-only.
- **Provider sandbox (future):** requires approved GDS API access and official sandbox documentation.
- **Live customer intake (future):** requires approved inbound channel, agreements, secure backend, privacy and role checks. Not part of the current demo.
- **Production quotations/bookings (future):** separate approvals and controlled rollout; no automatic customer sends or ticket issuance.

## Tests

`tests/lite-fictional-inbox-browser.test.cjs` exercises the actual browser UI with intercepted Supabase requests and fake staff tokens. It checks no personal fields, locked sending and booking, both trip types, safe failure handling, retry deduplication and stale-request cancellation. These tests **do not verify a live messaging provider or a real GDS integration**.
