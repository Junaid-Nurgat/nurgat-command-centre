# Nurgat Tours — API Team Meeting Worksheet

**Prepared:** 16 November 2026  
**Meeting:** Expected during 16–22 November 2026; exact date not confirmed  
**Status:** Meeting scheduled by the agency contact; API provider and terms still unknown  
**Purpose:** Find out how Nurgat Tours can safely test *real flight search and pricing* later. This is **not** an application for credentials or permission to book tickets.

> **Privacy:** This file is a public, blank question sheet. Keep completed meeting notes in the agency's private records, **not in this public GitHub repo**. Never paste passwords, API keys, passenger details, contracts, or account identifiers into GitHub or chat.

## 60-second opening script (simple English)

"Hello, we're preparing a staff-only flight search tool for Nurgat Tours. We already have an internal training demo, but it does not connect to live flights or issue tickets. We want to understand our authorized API options, start with a safe test environment, and know the costs and steps needed before going live. Can you explain the process?"

## Questions to ask the API team

| # | What to ask | Why we need the answer |
|---|---|---|
| 1 | **Which company and product/API** will provide flight search? | So we build for the correct service instead of guessing. |
| 2 | Does our existing agency setup qualify for **API access**, and is any agency account/PCC or contract needed? | Desktop GDS login access does not automatically mean API access. |
| 3 | Can we get a **sandbox or pre-production test environment**? Who is allowed to use it? | We must test without real customers or bookings. |
| 4 | Can you share **official technical documentation and sample read-only flight search requests**? | So we can map the API correctly. |
| 5 | How does **authentication** work, and how are credentials securely delivered and rotated? | So we can keep credentials on the server, never in the website. |
| 6 | Does the API support **flight availability, detailed pricing, taxes, baggage rules, currency and offer expiry**? | These are needed for future trustworthy quotations. |
| 7 | Must a result be **repriced or revalidated** before staff can use it? | Prices and availability can change. |
| 8 | What are the **sandbox limits, rate limits, timeouts, supported regions and error formats**? | To avoid broken automation or accidental API overuse. |
| 9 | What are **setup fees, monthly fees, usage charges or minimum volumes**, if any? | So the agency can decide whether the integration is affordable. |
| 10 | What **security, data protection, audit and certification requirements** apply? | Required before any operational service. |
| 11 | Who is our **technical contact**, and where do we raise integration problems? | To resolve issues directly with the right team. |
| 12 | What are the **next steps, expected decision date and test-access timeline**? | So development can proceed in the right order. |

## Decisions to record **privately** after the meeting

- [ ] Provider and exact API product confirmed
- [ ] Official documentation link received
- [ ] Eligibility and contract requirements understood
- [ ] Sandbox/test access approved or next action assigned
- [ ] Authentication method and secure credential-delivery process explained
- [ ] Read-only search and pricing endpoints confirmed
- [ ] Charges and usage limits reviewed by the agency decision-maker
- [ ] Repricing, fare validity and supplier rules explained
- [ ] Technical contact and follow-up date agreed
- [ ] No real customer or booking access granted by assumption

## What our team can build after the meeting

**Phase A — Read-only sandbox (first):** Add an approved provider-specific transport to `api/flight-search-adapter.mjs`, test with provider-issued sandbox credentials kept in the backend, check mapped fare fields and errors, and keep customer messaging, bookings and ticketing disabled.

**Phase B — Controlled internal review:** Verify operator permissions, price revalidation, supplier terms, audit logs, monitoring, retries and a secure staff approval process. No real customer sending without explicit commercial and security approval.

**Phase C — Operational release (separate decision):** Only after agreements, provider authorization, testing and any certification. This meeting alone does not authorize it.

## Known project facts (no assumptions)

- Nurgat Tours has a **fictional flight Command Centre demo**.
- A **provider-neutral, backend-only read-only adapter** exists in `api/flight-search-adapter.mjs` but is **not connected** to any real GDS.
- The current agency software includes Amadeus Selling Platform Connect and Travelport Smartpoint **desktop access**, not confirmed API credentials.
- The agency contact has arranged an API-team meeting during the week of 16 November 2026; **provider details are not yet known**.
- Existing customer messaging, booking and ticket issuance remain **disabled**.

**After the meeting:** Send only a non-sensitive summary to the development team: provider/product name, official docs URL, sandbox availability, approved scope, rough costs and agreed next steps. Never send keys, passwords or customer information.
