# Nurgat Tours — Provider-Neutral Flight Search Adapter

**Status: pre-integration building block.** Created before the agency's scheduled API-provider meeting (week of 16 November 2026). **The provider is still unknown.** This is not an active airline connection.

## Purpose

Prepare a backend-only, read-only connection interface that can accept a specific airline/GDS provider transport later without modifying the current Command Centre training UI or relying on provider-specific data formats.

Files:
- `api/flight-search-adapter.mjs`: input validation, provider result normalization, timeout, controlled errors, read-only safety flags.
- `tests/flight-search-adapter.test.mjs`: offline Node.js contract and failure tests.
- `.github/workflows/provider-adapter-qa.yml`: automatic checks for future changes.

No credentials, hostnames, API endpoints, real passenger details, supplier contracts, payment details or ticketing permissions are included.

## Request contract

```json
{
  "origin": "LUN",
  "destination": "DXB",
  "departureDate": "2027-08-10",
  "returnDate": "2027-08-22",
  "tripType": "ROUND_TRIP",
  "adults": 2,
  "children": 0,
  "infants": 0,
  "cabin": "ECONOMY",
  "preference": "BEST"
}
```

Input validation rejects invalid airport codes, invalid dates, passenger-count violations and unsupported cabin/preference selections.

## Provider-specific transport shape

After a provider is confirmed and approved, an authorized backend integration implements:

```js
async function providerSpecificSearch(normalizedRequest, { signal }) {
  // To be implemented in an authenticated server environment only.
  // Fetch a provider's SANDBOX/TEST search using approved server-side credentials.
  // Map the provider response to { offers: [...] } in the format below.
  return { offers: [] };
}
```

Each normalized offer requires `providerOfferId`, `carrier`, `currency` (3-letter code), `totalMinorUnits` (nonnegative safe integer), `stops`, and `durationMinutes`. `expiresAt` is optional. Do not guess field mappings before receiving actual provider documentation. Currency conversion, taxes, fare validity, offers, itinerary segments, pricing markup and supplier terms are **not yet implemented**.

## Response and safety behavior

The adapter **always** reports:
- `fareVerified: false`
- `customerSendAllowed: false`
- `bookingAvailable: false`
- `ticketIssuanceAllowed: false`
- `humanApprovalRequired: true`

It intentionally has **no payment, booking or ticket-issuance method** and rejects a `PRODUCTION` environment. It accepts only `MOCK` and `SANDBOX` transports. Provider exceptions are converted to safe, generic error messages so secrets cannot leak to frontend logs or the browser.

## Current limitations / next gates

- The adapter is **not connected to the GitHub Pages UI, Supabase Edge Functions, n8n, Travelport, Amadeus, or any other live provider**.
- The current demo frontend still uses its existing fictional-flight research function and existing 14-test browser suite.
- Before deployment, decide which backend hosts the adapter, implement service-level authorization and rate limiting, add sensitive-data redaction/monitoring, and verify the actual provider contract and sandbox.
- The current JSON response schema is an internal proposed contract, not a provider guarantee.
- Provider sandbox responses are **not necessarily bookable or valid customer quotations**.
- Never paste keys into chat, include them in a browser, or commit them to GitHub.

## Meeting handoff

Ask the API team: provider name, technical documentation, approved sandbox access, credentials delivery process, authentication and rate limits, travel agency account/PCC requirements, pricing/repricing workflow, offer expiration, supplier restrictions, certification, and estimated timeline.

Keep the real flight booking and ticket issuance paths disabled until the agency owner and provider separately approve the commercial, security and certification stages.
