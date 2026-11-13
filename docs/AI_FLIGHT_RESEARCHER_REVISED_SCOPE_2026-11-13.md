# Nurgat Tours — AI Flight Researcher: Revised Project Scope
**Decision date:** 2026-11-13  
**Source:** Agency owner/uncle clarification conveyed by project team.  
**Status:** New scope agreed; no live GDS integration or booking automation is authorized or completed yet.

## Business problem
The Nurgat Tours operator currently types Amadeus/Travelport GDS commands manually and wants an **internal AI flight research and quotation assistant** to reduce repetitive search and comparison work. Existing **Meta Business Agent** handles WhatsApp customer enquiries; do not build a duplicate receptionist or alter Meta WhatsApp automations.

## Product mission
1. Uncle/staff submits structured flight requests in a secure staff-facing interface.
2. Validate origin/destination, dates, adult/child/infant passengers, cabin, flexibility and constraints.
3. Authorized GDS integration searches current flight availability; where the provider supports it, retrieve baggage/fare rules and reprice candidate itineraries.
4. Normalize and rank real offers by total selling price, itinerary quality, stops, duration, baggage and change rules.
5. Internal, server-side agency-pricing logic adds the authorized markup; **original provider/supplier cost and markup must never appear in customer-facing quote content**.
6. Present the internal staff dashboard with supporting facts and optionally privileged internal cost/margin breakdown. The customer-facing quote contains only verified and approved final selling prices and legally required fare/tax/fee disclosures.
7. The operator selects, checks, and approves any quote/booking; booking and ticket issuance remain disabled until explicit operator approval, provider authority, payment verification and dedicated go-live tests.

## Out of scope
- AI receptionist replacing Meta Business Agent.
- Directly replying to customer WhatsApp chats.
- Fully autonomous ticket issuance, payment processing or booking commits.
- Automatically driving the existing GDS terminal by guessing credentials or automating its UI without separately verified permission and integration support.
- Treating fictional test offers as live airline availability.

## Existing assets to preserve and repurpose
- `Kt0upu2aOsMeANhV`: AI Flight Specialist: **internal prototype; remove old receptionist-context assumptions when refactoring**.
- `V69aHXxrdbp9u436`: fictional Flight Comparison Lab: retain as test-only.
- `PiXTI0iGQc3J1hqi`: offline flight validation.
- `D8fNN8td7kHKeUNK`, `EWUXSBU141ftPm6y`: offline provider adapters.
- `5gtdDG3vq2JBFQxB`: CEO AI Bridge: internal-only CEO review proposal.
- `ZAxm8dI81QMZYT8u`, `ID2H2sN9gEwuFvKp`, `OiuR7XhPWq6GSh0J`: failure logging, retries and snapshots.
- Existing account-loss backup and recovery runbook.
- `wrL9GFoE4I9YObIa` and `yd58RoUrPGJXy51t`: **archived** because they were receptionist-specific. No original workflows deleted.

## Next implementation milestones
**M1: Staff-facing search contract** — define structured flight request, expected response and comparison scoring. Build a frictionless UI suitable for actual agency staff.
**M2: Real GDS access decision** — uncle identifies whether currently used system is Amadeus Selling Platform/cryptic, Travelport Smartpoint/cryptic, API-enabled account via airline/consolidator, or other supported interface. Confirm legal access and scope, API availability, ticketing permissions and pricing. An existing terminal login is NOT necessarily an API subscription.
**M3: Authorized provider adapter** — connect one provider in an approved test environment, obtain real (or provider-sandbox-labeled) flight offers, reprice as supported, handle rate limits and outages.
**M4: Internal research results** — show best flights, baggage/fare rules, source timestamp, fare validity and flexible alternatives.
**M5: Agency pricing separation** — isolate supplier cost and markup from customer-ready output, verify taxes, fee transparency and approvals.
**M6: Controlled staff pilot** — test with operator against a range of real searches, handle exceptions, and track time saved and usage before production.

## Non-negotiable conditions
- Meta Business Agent remains unchanged.
- **No real bookings, payments or customer messaging** before explicit owner authorization.
- Search results are not guaranteed availability; reprice/revalidate ahead of purchase.
- Model-generated narratives cannot override provider data or invent fares.
- Only the agency owner can authorize GDS credentials, payment and live business operations.
- Keep trial expiry and owner-held workflow backup on the operational checklist.

## Immediate decision
Do **not** purchase or provision WhatsApp Business API solely for this project. Prioritize identification of the agency's actual GDS product and supported integration method, then build the internal flight-search workflow.
