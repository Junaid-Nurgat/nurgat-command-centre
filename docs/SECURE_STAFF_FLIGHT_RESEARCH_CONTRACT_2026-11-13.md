# Nurgat Tours — Secure Staff Flight Search Contract v1
Date: 2026-11-13  
Status: **Deployed secure fictional demo endpoint; staff-session browser test required**

## Architecture now
1. Existing Command Centre on GitHub Pages: authenticated staff user opens AI Flight Research.
2. Form validates IATA-format origin/destination, dates, adult/child/infant counts and preferences.
3. Default checked **Use secure demo backend** sends the structured fields to `/functions/v1/nurgat-flight-research-demo` on the existing Supabase project.
4. Edge Function verifies a JWT via platform verification and Auth `/auth/v1/user`; checks user belongs to `approval_reviewers` with `active = true`, honoring existing RLS.
5. Server validates the request again and returns only clearly marked fictional offers; no name, email, WhatsApp number, supplier cost, markup, payment data or customer reference is sent.
6. UI checks that the endpoint response is demo-only, no provider connected, no fare verified, no customer sending and no booking/ticketing, before showing any results.
7. The local-only form option remains available for offline demonstrations and is labeled as such.

## Security boundary
- `verify_jwt = true`, **plus** server-side Auth getUser and active reviewer membership.
- Browser Origin limited to the existing GitHub Pages site (not a substitute for authentication).
- Only JSON POST permitted for research; body length limited to 5000; input fields allowlisted.
- No store, no side effects, no GDS credentials, no paid provider calls, no n8n execution triggered, no booking or WhatsApp interaction.
- No real price quote is approved and results are non-bookable, non-exportable mock data.
- Never send an actual customer enquiry or real customer personal details to the demo endpoint; `UNEXPECTED_FIELDS` rejects extra fields.
- `frReference` input is **not** sent to the API.
- Do not use demo prices for actual customers.

## Request schema
```json
{
  "origin": "LUN",
  "destination": "DXB",
  "departureDate": "2026-12-15",
  "returnDate": "2026-12-30",
  "tripType": "ROUND_TRIP",
  "adults": 1,
  "children": 0,
  "infants": 0,
  "cabin": "ECONOMY",
  "preference": "BEST"
}
```

## Response schema
```json
{
  "ok": true,
  "mode": "FICTIONAL_DEMO_ONLY",
  "schemaVersion": "1",
  "providerConnected": false,
  "fareVerified": false,
  "customerSendAllowed": false,
  "bookingAvailable": false,
  "ticketIssuanceAllowed": false,
  "route": {"origin": "LUN", "destination": "DXB"},
  "offers": [
    {"id": "DEMO-A", "airline": "Sample Air A", "durationMinutes": 785, "stops": 1, "currency": "USD", "illustrativeTotal": 890}
  ],
  "warning": "All examples are fictional. No real GDS search, fare verification, customer messaging, or booking occurred."
}
```
Three fixture offers are returned; the above response shows one only to illustrate shape.

## Integration tests not yet run live
- [ ] Signed-in active reviewer sees three clearly fictional offers in default backend mode.
- [ ] Sign out; no backend research can run.
- [ ] Invalid route/date or excessive passengers are denied.
- [ ] Unauthorized signed-in account receives 403.
- [ ] Browser CORS preflight succeeds using authorized GitHub Pages Origin.
- [ ] If backend is down, UI shows explicit error and never silently falls back to fabricated offers (user may consciously uncheck backend to choose local demo).
- [ ] Different comparison preferences reorder the safe demo options.
- [ ] Sample flight selection and offline helper continue working.

## Production integration gates
- Confirm uncle's actual authorized Amadeus/Travelport provider product and API permissions.
- Replace mock provider with a credential-protected adapter (no credentials or provider payload in public JavaScript).
- Prove search and pricing validation, expiration handling, baggage/fare-rule source provenance, rate-limits, concurrency and provider outage behavior.
- Separate internal provider costs/agency markup from customer quote allowlist; only approved final customer-facing total (with required fees/taxes) leaves the internal quote component.
- Require staff revalidation and explicit authorization before booking/payment/ticket issuance.
- Confirm full browser, integration and security tests before real agency use.

## Verification notes
- Supabase `nurgat-flight-research-demo` version 1 reports ACTIVE and `verify_jwt:true` via connector.
- Frontend GitHub code saved and JavaScript passed syntax evaluation.
- Actual cross-origin signed-in fetch was **not** executed by ChatGPT, so full end-to-end success is not claimed.
- Supabase security advisor still reports preexisting demo authorization RPC and leaked-password alerts; review before commercial operations.

## Synthetic Edge Function checks — completed
Evaluated the deployed function source in an isolated JavaScript harness using simulated Auth and reviewer-table responses (not real network calls). **9/9 checks passed**:
- Authorized, structured demo search returns `FICTIONAL_DEMO_ONLY` with no supplier cost/markup fields.
- Same-airport route rejected.
- Past departure date rejected.
- Extra customer name field rejected.
- Excess infants rejected.
- One-way trip with return date rejected.
- Unsupported cabin rejected.
- Missing Authorization token rejected.
- Unapproved browser Origin rejected.

The live gateway JWT enforcement, CORS browser preflight, actual reviewer identity lookup, and actual HTTPS integration remain **unverified until an authorized signed-in browser test**. This harness tests function logic, not the deployed network path.
