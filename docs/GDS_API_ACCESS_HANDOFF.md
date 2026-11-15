# Nurgat Tours — Flight API Access Handoff

Updated: 15 November 2026

## Current position

**Stage: sandbox API enquiry ready to prepare; not yet submitted.**
The Lite Command Centre is an internal training tool, **not** an operational ticketing system.
- GitHub pull requests #3–#5 established automated browser QA, including 14/14 passing browser tests with mocked Supabase.
- Staff login and fictional flight search exist in the training interface.
- Real flight inventory, fares, payments, bookings, ticket issuance and customer delivery are **disabled**.
- Production staff permissions, end-to-end authenticated n8n integration, provider-specific contracts and live data policies still require separate validation.

## Candidate provider: Travelport TripServices (trial / pre-production first)

Official starting points:
- Trial-access page: https://my.travelport.com/v2/get-trial
- Getting started: https://developer.travelport.com/docs/getting-started
- Authentication: https://developer.travelport.com/docs/getting-started/authentication
- Developer toolkits: https://developer.travelport.com/resources/devkits-and-downloads
- Sales enquiry: https://www.travelport.com/get-travelport
- Certification before production: https://developer.travelport.com/docs/getting-started/ready-to-certify

Travelport states trial credentials can be requested, and provisioned customers receive credentials with point-of-sale/access-group information. Real-time calls need provider-issued credentials. Production access is contracted and certified, not automatic.

**Alternative:** Amadeus Enterprise API access is request-based. The old Amadeus self-service portal was shut down on 17 July 2026. See https://developers.amadeus.com/api-catalog .

## What the agency owner/authorized adult needs to decide

1. Confirm that Nurgat Tours wants to evaluate **Travelport TripServices** (rather than an existing GDS provider).
2. Identify the authorized agency contact who may apply and handle provider agreements.
3. Confirm whether Nurgat Tours already has a Travelport/other GDS account, PCC, and applicable supplier relationships; ask the provider what is required if not.
4. Identify the intended scope: **flight search + pricing first**. Booking and ticketing remain off until explicit approval, business arrangements, and certification.
5. Review trial terms, costs, allowed use, response limits, regions and data-handling requirements.
6. Submit the provider trial or sales enquiry **only with the agency owner's authorization**. Do not enter personal, payment or customer credentials in GitHub or chat.

## Technical work while API access is pending

- Document adapter fields: itinerary input, offer ID, totals/currency, availability, conditions, quote expiry and supplier provenance.
- Keep distinct environments: fictional training, provider sandbox/pre-production, production.
- Store provider credentials server-side only (for example, secured backend configuration); never in a public GitHub Pages frontend, commits or screenshots.
- Implement read-only test-mode search and pricing first. Enforce rate limits, retries, structured errors, trace IDs and logs with redacted sensitive information.
- Require a real provider-confirmed fare and supplier rules before any customer quotation.
- Human approval must be linked to the exact quote revision. No AI-initiated bookings, payments, ticket issuance, or customer messaging before separate contractual approval and production tests.
- Complete end-to-end authorization/tenant segregation and n8n handoff tests before expanding.
- Preserve the existing **CUSTOMER DELIVERY: LOCKED / BOOKING: DISABLED** controls until every production gate is met.

## Handoff status

| Milestone | Status |
| --- | --- |
| Lite training-mode reliability QA | **14/14 mocked-browser tests passed** |
| GitHub browser QA workflow | Implemented |
| Agency owner selects provider / approves enquiry | **Pending** |
| Trial request submitted | **Not submitted** |
| Trial or pre-production credentials received | **Not received** |
| Provider integration in a non-production backend | **Not started** |
| Real customer bookings / ticket issuance | **Disabled** |

**Next external action:** Agency owner or nominated authorized staff should review Travelport's trial page and sales/contact options, then decide whether to apply. An API response or credentials must not be pasted into chat or committed to source control.

References reviewed 15 November 2026: Travelport official Getting Started, Authentication, DevKits, Certification; Amadeus Enterprise portal.
