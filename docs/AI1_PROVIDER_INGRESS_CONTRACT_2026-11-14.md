# AI 1 Provider Ingress Contract — Prepared, Not Deployed
Date: 2026-11-14

## Why this exists
Before Nurgat Tours connects its authorized existing WhatsApp Business automation, we need a strict server-side contract that rejects customer PII in the flight research path and converts trusted upstream provider event IDs into stable, opaque idempotency identifiers.

This repository now contains:
- `src/handoff-contract.mjs`: server-side-only validation and safe-result helpers.
- `scripts/test-handoff-contract.mjs`: offline Node regression suite, added to `.github/workflows/flight-research-static-ci.yml`.

## Rules encoded
- Flight search contains exactly 10 approved fields; unknown fields (customer name, phone, email, chat history, passport) fail closed.
- IATA-like 3-letter airport codes, valid future dates no more than 18 months ahead, strict one-way/round-trip return logic, supported cabins/preferences and passenger count limits.
- A stable `ev_` request ID is derived from a **verified** provider event ID and a **server-only HMAC signing key**.
- AI 2 output must explicitly declare GDS is disconnected and customer sending, booking and ticketing are disabled. Unsupported supplier/booking claims fail closed.

## Important integration security requirements
1. **Do not use this directly in the browser or LLM prompt.** The signing key must be stored in server-side managed secrets.
2. **Authenticate the official provider webhook first.** Verify its signature, timestamp and replay window; use the *provider-generated* event ID, not arbitrary user text.
3. Bind a trusted agency/tenant identity to the event; in a multi-client product, include tenant identity in the HMAC domain.
4. Confirm uncle's approval and exact integration access **before** modifying his WhatsApp setup.
5. Authorize the downstream request through a trusted backend; do not put an employee JWT into WhatsApp events.
6. Implement rate limiting and concurrency checks at ingress, and run a real authenticated end-to-end test before publishing n8n.
7. Never claim demo research is real availability or pricing. No automatic customer messaging/booking.

## Verification status
- Source and test script JavaScript syntax checked.
- 18 isolated contract scenarios passed in the development environment, using a **deterministic HMAC stub**, not actual Node cryptography.
- GitHub Actions has been configured to run the complete Node script with real `node:crypto` on pushes. **A successful Actions run has not yet been verified here.**
- This module is **not connected** to the unpublished n8n workflow or live WhatsApp system. It is an integration-ready component, not a working production webhook.

## Remaining blockers
- Business/owner authorization for the existing WhatsApp agent
- Official WhatsApp provider verification details and test webhook
- Managed backend secrets, provider signature verification and edge rate-limiting
- Authenticated n8n/Supabase integration and concurrent-event test
- Licensed GDS API credentials, fare-validation process and owner-approved pricing policy
