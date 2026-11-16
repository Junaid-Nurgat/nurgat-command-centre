# Nurgat Tours — Flight API Access Handoff

**Updated:** 16 November 2026  
**Stage:** Waiting for an **already-arranged API team meeting** (expected during 16–22 November 2026). The API provider/product is **not yet confirmed**. Do not initiate a duplicate trial application without agreement from the agency owner.

**Useful meeting guide:** [API Team Meeting Worksheet](GDS_PROVIDER_MEETING_WORKSHEET.md)

## What is working today

- A staff-only **Command Centre Lite** training interface with fictional flights, fares and saved requests.
- Offline browser checks and an internal **provider-neutral read-only flight-search adapter** with tests.
- A separate, unpublished service-authenticated staging handoff has been developed. Some steps reached n8n successfully, but the complete HTTP response test was **not verified**; its troubleshooting is intentionally **paused** to prioritize API readiness.
- All real supplier search, customer quotations, payment, messaging, bookings, PNR creation and ticket issuance remain **disabled**.

## What the agency has — and does not yet have

- **Confirmed:** Staff use Amadeus Selling Platform Connect and Travelport Smartpoint desktop software.
- **Not confirmed:** Supplier flight API access, credentials, permission to run automated searches, rate limits, or production certification.
- **Already in motion:** The agency contact has arranged an API discussion in the week of 16 November 2026.
- **Unknown:** Which API team/product will actually provide integration, the meeting date, costs and timeline.

**Important:** A staff login to desktop GDS tools does not by itself authorize an API integration.

## What to do at the meeting

Use [the one-page-style question worksheet](GDS_PROVIDER_MEETING_WORKSHEET.md). Prioritize:

1. Confirm the **provider/product name** and official developer documentation.
2. Ask whether Nurgat Tours can obtain **authorized sandbox/test API access** and which existing agency agreements are required.
3. Confirm which **read-only flight search and pricing operations** are supported, including fare expiry, baggage, taxes, currency and repricing.
4. Request **secure instructions for credentials**, usage limits and troubleshooting; **never email or paste actual credentials into a public repository or chat**.
5. Review **fees, contract terms, allowed regions, certification and security obligations**.
6. Record the next owner-approved action, technical contact and expected access timeline **in private agency records**.

An API meeting is an information-gathering step, not authorization to turn on bookings or customer communication.

## After the meeting — proposed implementation

**Stage 1: Sandbox and read-only search.** Agency owner approves chosen provider and terms. Connect one provider-specific sandbox transport to `api/flight-search-adapter.mjs` inside an authenticated server environment (not the public GitHub Pages UI). Normalize sample provider offers using official docs; test errors, timeouts, allowed data and rate limits.

**Stage 2: Verification and internal review.** Establish price/availability revalidation, currency/taxes, supplier rules, trace IDs, redacted monitoring, approval of each quote version and stable staff permissions. Confirm end-to-end authentication and monitoring. Previously paused staging response diagnostics can be revisited when the chosen API integration requires it.

**Stage 3: Operational use only after a new approval.** The agency and provider must separately approve any live production use, contractual fees, certification, customer-data handling, customer messaging or ticketing. Do not equate a sandbox result with a bookable fare.

## Status ledger

| Item | Status |
| --- | --- |
| Training-mode staff UI | Built; fictional-only |
| Provider-neutral backend search adapter | Built and offline-tested; not connected |
| Agency API-team meeting | Arranged, expected 16–22 Nov 2026 |
| Specific provider/product | **Not confirmed** |
| Provider documentation and sandbox credentials | **Not received** |
| Commercial terms and approval | **Not confirmed** |
| Isolated staging handoff | Built; final response validation not completed; paused |
| Live flight search | **Disabled** |
| Customer messages / bookings / ticket issuance | **Disabled** |

## Provider references — background only

Existing agency systems suggest two possible companies, but **neither has been selected as the API supplier**:

- Travelport Developer Centre: https://developer.travelport.com/docs/getting-started
- Travelport authentication: https://developer.travelport.com/docs/getting-started/authentication
- Amadeus developer catalogue: https://developers.amadeus.com/api-catalog

Do **not** apply for a separate trial solely because these links are listed. First use the agency's scheduled API-team meeting and verify the current, official terms.

## Security rules that stay in place

- Do not use real passenger details during development or tests.
- Store supplier secrets only in authorized, secure backend credential storage.
- Do not paste tokens, provider account identifiers, contracts or staff login credentials into GitHub, screenshots or chat.
- Do not silently convert the training demo's invented prices to real customer quotations.
- The customer delivery and booking controls remain locked until a separately authorized production review.

**Next action:** Attend the scheduled provider meeting. Gather a safe, non-sensitive summary of the provider name, documentation, allowed sandbox scope, costs and timeline. The developer can then choose the correct implementation steps without guessing.
