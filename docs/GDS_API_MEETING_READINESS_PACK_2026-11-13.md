# Nurgat Tours — GDS API Meeting Readiness Pack
**Prepared:** 13 November 2026  
**Expected discussion window:** Week of 16–22 November 2026 (meeting time not yet confirmed)  
**Audience:** Uncle / Nurgat Tours owner, supplier integration team and technical implementer

## One-minute project explanation
Nurgat Tours wants its authorized WhatsApp assistant (AI 1) to collect a customer's flight search requirements and pass them to a research component (AI 2). AI 2 will use a licensed provider's official API to find and verify suitable offers. The Command Centre will display the staff-safe results, approved selling prices, fare rules and any quotations requiring review. Staff authorization and explicit business rules will control communication with the customer. Nothing should book, charge, issue tickets or contact a customer merely because an AI recommends it.

## The eight things to clarify with the API provider
1. **Exact GDS system and product/version.** Amadeus Selling Platform Connect, Amadeus Web Services/Self-Service/Enterprise, Travelport Smartpoint, Travelport Universal API / JSON APIs, or something else? Do not assume terminal rights include API rights.
2. **Who holds API entitlement?** Nurgat Tours directly, a consolidator, or another licensed agency? Who signs the terms, pays usage fees and authorizes our automation?
3. **Sandbox access.** Is there a non-production endpoint and test account with fixtures? Are there usage limits, costs, timeouts or IP allowlisting requirements?
4. **Operations permitted.** Search, pricing/repricing, fare conditions, baggage, offer/order creation, PNR, reservations, payments and ticketing? Which are restricted or separately approved?
5. **Price composition and currency.** What fare, taxes, fees, commissions and supplier conditions are returned? How are multi-passenger pricing, child/infant fares, currency, fees and time limits represented?
6. **Availability and validity.** How long are search results valid? Can we reprice/recheck immediately before quotation approval? What changes force a fresh offer?
7. **Integration and security.** Official API references, authentication process, credential expiry/rotation, webhook callbacks, quotas, audit and data retention rules, and data-hosting restrictions.
8. **Support and commercial onboarding.** Provider technical contact, account activation steps, API cost breakdown, approval timeline, test-to-production sign-off requirements and support arrangements.

## Business rules Nurgat Tours must approve
- Who can view supplier costs and set customer selling prices? What markup and discount rules are allowed?
- Which staff member approves a customer quotation? Can different staff create vs approve?
- Does the existing WhatsApp Business agent collect passenger details? What disclosures, consent and retention policies apply?
- Is the first version a manually approved quotation sent by staff, or owner-approved official API delivery? **Default: human approves before sending.**
- Who handles fare expiration, reprice changes, customer corrections, refund requests and escalations?
- Confirm whether the integration provider permits sending AI-generated offers to third-party customers.

## What is already built
- Original Command Centre plus separate phone-first Lite, both demo-only.
- Secured fictional flight research backend and staff AI assistance.
- Internal GDS research planner (not real airline search).
- Fictional markup, selection, quotation preparation and review rehearsal.
- **AI 1 → AI 2 internal structured handoff workflow**, created but unpublished. Four n8n simulation executions completed: one valid test passed, three unsafe scenarios rejected.

## Explicit current blockers
- **No authorized live GDS API, no verified airline offers or fare calculation.**
- **No WhatsApp provider/agent handoff**, no verified permission to modify its existing integration.
- **No customer-safe production quotation object**, signed approval, expiry/reprice logic, business pricing policy or authorized send pathway.
- Handoff webhook is **unpublished** pending ingress hardening, authenticated end-to-end testing and duplicate detection.
- Full signed-in browser/device testing and green CI confirmation remain outstanding.

## Technical target architecture
`Official WhatsApp ingress → customer identity & consent → AI1 structured extraction → authenticated ingress & idempotency → AI2 provider search + fare validation → staff-safe quote draft → human revision-specific approval → authorized official messaging channel → delivery log`

- API credentials and private data live in secure server-side credential storage, never in the browser or AI prompt.
- Split customer identifiers from the minimal flight research payload. Do not send customer phone numbers/passports to the research model.
- Strict schema, validation, idempotency key, rate limits, least-privilege service identity and immutable audit history.
- External customer action is always separately permissioned and traceable. AI never autonomously books or issues tickets.

## Meeting exit checklist
- [ ] Exact provider/product identified
- [ ] Technical documentation and sandbox offered or access process explained
- [ ] Search, pricing/reprice, baggage and fare-rule capabilities confirmed
- [ ] API authority and commercial terms clarified
- [ ] Provider technical contact named
- [ ] Agency approval/markup and sending responsibilities recorded
- [ ] Next action and responsible party agreed

**Security note:** Never paste live API keys, passwords, access tokens or passenger personal documents into ChatGPT or a meeting chat. Arrange an approved secret-storage and transfer method once issued.
