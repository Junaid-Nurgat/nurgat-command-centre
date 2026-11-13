# Internal Markup Control — Nurgat Tours Flight Researcher

**Created:** 2026-11-13  
**Status:** Staff-only UI simulation implemented. **No real supplier prices, no live GDS, no authorized pricing policy yet.**

## Purpose
The operator needs a quick slider for rough adjustments and an exact-number field for precision. Both operate on the fictional demonstration results inside the signed-in Command Centre.

## Implemented
- Fixed USD adjustment per **complete example itinerary** (not per passenger).
- A slider in increments of USD 10, with a separate numeric input accepting whole-dollar values.
- Demonstration range 0–500 USD, solely an interface-testing limit; **not** an approved agency pricing rule.
- Derived total = fictional starting amount + the chosen demonstration adjustment.
- The selected flight panel, comparison table, flight cards, and research helper report consistent adjusted fictional totals.
- Input outside the allowed range is rejected without changing the previously valid amount.
- Reset clears the adjustment; it isn't persisted in Supabase and isn't submitted to the demo search endpoint.
- Flight cards and selected-review view remain *non-bookable*, unapproved and explicitly fictional. No customer message or quote export exists.

## Customer confidentiality
Supplier/wholesale/net fares, provider responses, commission and internal margin analysis must not enter the customer AI prompt or any customer-facing payload. **Only a separately generated, verified, authorized final selling total** may be included in customer material, with required customer-visible tax and fee disclosures. Staff-only access is not sufficient protection by itself: enforce the output allowlist in the backend.

## Go-live design (not implemented)
1. Connect an approved GDS provider through a server-side credential-protected integration.
2. Verify fare currency, tax/fee breakdown, passenger mix, restrictions, and provider quotation expiry.
3. Load a configurable, authorized price rule from restricted server-side configuration, not the browser.
4. Apply the chosen operator adjustment subject to owner-defined approval limits and audit trail. The operator must authorize policies on absolute markups, percentages, per-person vs per-booking and currency conversion.
5. Round appropriately for the currency and show the exact **total payable** including mandatory fees.
6. Reprice with the provider immediately before any booking.
7. Produce a customer-quote object containing only the final authorized payable amount and legally required customer-facing disclosures; never pass provider cost or markup to customer AI.
8. Require human authorization before quote sharing, payments, ticket issuance or bookings.

## Tests and limitations
- Browser code syntax checked.
- Isolated pricing arithmetic checked with example base USD 735 and markup 0, 125, and 500; invalid -1, 501, empty, and fractional inputs rejected. This is **isolated logic testing**, not actual browser end-to-end testing.
- GitHub static regression-test file was updated to cover the new controls and helper-price arithmetic; a passing GitHub Actions run is not yet verified.
- Existing authenticated demo API still sends fictitious illustration prices; it does not receive or save markup, and cannot send customer quotes.
- Nothing in this document constitutes permission to set real prices or transact.

## Manual signed-in browser tests
- [ ] Run demo search using secure backend; ensure three fictional flight cards appear.
- [ ] Drag slider from 0 to 100. All cards, comparison table and selected panel update by exactly USD 100.
- [ ] Set exact markup USD 125; a fictional base 735 shows adjusted USD 860.
- [ ] Try 501 or negative; previous valid adjustment remains and an error appears.
- [ ] Ask helper for cheapest and selected options; numbers reflect adjustment.
- [ ] Reset form; slider and input return to zero, results close.
- [ ] Browser network inspection confirms no markup is sent to the research-demo endpoint and no customer delivery endpoint exists.
