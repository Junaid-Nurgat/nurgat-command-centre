# Flight Provider Integration — Architecture & Release Gates

**Status:** Internal fictional-data architecture implemented. **No live flight search, booking, ticket issuance, or customer quote sending is authorized or connected.**

## Provider-neutral pipeline

1. Authorized agency search request (origin, destination, dates, traveler types/counts, cabin, currency, trip type).
2. Provider-specific credentialed connector (future: Amadeus Self-Service and/or Travelport TripServices V11).
3. Provider-specific adapter validates the provider response and keeps the original provider offer reference.
4. Normalized internal flight candidates and provider-specific terms.
5. Validate itinerary, traveler mix, route, travel dates, cabin, included baggage, currencies and total fare scope before comparing.
6. CEO review draft, with explicit source, search timestamp, limitations and independently verified repricing.
7. Authorized staff approval — separate from **booking**, **payment** and **ticket issuance**.

## Existing n8n workflows

- **Universal Flight Provider Normalizer (OFFLINE)** — `EWUXSBU141ftPm6y`; 18 fictional contract tests. Runs the shared adapter and asserts all safety outputs. Last verified execution **64**.
- **Provider Adapter Contract (INTERNAL DEMO ONLY)** — `D8fNN8td7kHKeUNK`; reusable Execute Sub-workflow receiver, normalizes guarded test inputs only. Last verified execution **63**.
- **Amadeus Self-Service Safety Tests (OFFLINE)** — `EYwrZT4WjPwEiVoF`; 12 fictional response validation cases, execution **59**.
- **Global Failure Logger** — `ZAxm8dI81QMZYT8u`; records production errors for three configured active agency workflows.
- **Reliability Health Check (MANUAL)** — `LsCEPhu6meQ5uuAe`; read-only error report, not API usage/billing monitoring.

All tests use invented response data. **Test fixture prices never become customer-facing quotes.**

## Critical comparison safety

**Do not rank fares from two providers based solely on route and currency.** An apparent cheaper price could correspond to different travel dates, passengers, itinerary, fare conditions, cabin, baggage, fees or incomplete round-trip pricing.

- The offline test intentionally **blocks cross-provider ranking** until context parity and valid fare conditions can be established.
- Travelport v11 has leg-specific `CatalogProductOffering` results; `BestCombinablePrice` may describe the **combined journey price** when products share a `CombinabilityCode`. Never add or compare arbitrary leg totals to an Amadeus round-trip fare.
- Travelport content may require an additional AirPrice step depending on airline/content; a search result is not permission to book.
- Amadeus Self-Service test results are not validated live commercial offers.
- No currency conversion without a documented FX source and conversion time.
- Missing a required field means **blocked / manual review**, never a guessed value.
- No provider credentials in GitHub Pages, browser JavaScript, or public GitHub files.

## Minimum gates before real API use

- [ ] Uncle confirms authorized provider(s), plan and available API products.
- [ ] Credentials set in protected n8n credentials or another secure backend, never the public repository.
- [ ] Provider sandbox authentication tested, quota/rate limit handling added, and error logs inspected.
- [ ] End-to-end searches tested for one-way, round-trip, connections, cancellations and failed searches.
- [ ] Complete itinerary and passenger data validated (including timestamps and time zones).
- [ ] Fare conditions, baggage, taxes, itinerary scope, price currency, carrier and validity sourced from actual response.
- [ ] Multi-provider results compared **only** when equivalent, and repriced before customer quotation.
- [ ] CEO approval and quote revision/audit enforced server-side.
- [ ] Retry/backoff, idempotency, monitoring and usage budgets tested.
- [ ] Agency confirms ticketing/consolidator arrangements and payment-compliance requirements.
- [ ] Separate explicit business authorization before customer messaging, booking or ticket issuance.

## Reference documentation

- [Travelport TripServices V11 Search response reference](https://support.travelport.com/webhelp/JSONAPIs/Airv11/Content/Air11/Search/APIRef_Search.htm)
- [Travelport Flights Search Guide](https://support.travelport.com/webhelp/JSONAPIs/Airv11/Content/Air11/Search/AirShoppingGuide.htm)

This file contains no private keys or personal customer information.
