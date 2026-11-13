# Nurgat Tours — GDS Command-Automation Handoff (API-WAITING)
**Date:** 2026-11-13  
**Status:** Pre-integration interface and AI research-plan pathway deployed; real GDS command automation **not** connected.

## What is built
1. Staff enters route (IATA codes), trip dates, adults/children/infants, cabin and comparison preference in existing Command Centre.
2. Staff clicks **Prepare GDS Research Plan**. The public web app does **not** call n8n directly.
3. Supabase Edge Function `nurgat-gds-planner-demo` (v1 ACTIVE; `verify_jwt=true`) verifies the logged-in user with Supabase Auth and checks active `approval_reviewers` under RLS.
4. That gateway validates the structured flight-search schema server-side and sends only an authorized request plus the short-lived user JWT to n8n. It does not pass the optional reference, markup slider, customer personal data or supplier prices.
5. n8n `TuqFlp60RxvorLfv` **Nurgat Tours — GDS Research Planner (API-WAITING)** independently checks reviewer authorization, builds a safe request context, calls gpt-5-mini via the n8n AI Gateway, and filters the answer.
6. The Command Centre renders only a structured **AWAITING_GDS_CONNECTION** plan if the gateway reports `providerConnected:false`, `commandExecutionAllowed:false`, `customerSendAllowed:false`, `bookingAvailable:false`, and `customerQuoteAvailable:false`.
7. AI plans focus on preparing search requirements, comparing suitable verified itineraries when available, checking fare and baggage rules, and seeking staff approval. **No executable Amadeus/Travelport cryptic commands are generated or sent.**

## Existing AI work
- `e6JXhYsU20QTPRQd` provides the separate real-model **Ask Flight AI** chat for fictional travel comparisons only.
- Old `Kt0upu2aOsMeANhV` Flight Specialist is retained as a legacy prototype; it is not the live command integration, and it should not be used for actual GDS operations.
- The airline provider adapters/normalizer remain offline prototypes. Fictional comparison fixtures must never be mistaken for real inventory.

## What is intentionally blocked
- No Amadeus or Travelport API credentials/terminal connectivity yet.
- No real flight availability, live pricing, reservation, PNR, ticket issuance, payment, or WhatsApp output.
- No internal supplier net fare or markup figures flow to the AI.
- No automatic customer communication or real booking.
- No secret GDS credentials in GitHub, public JavaScript, chat prompts, or model input.

## Test evidence
- Edge Function deployment ACTIVE, JWT verification enabled.
- n8n workflow published, 7 nodes; model credential assigned by n8n gateway.
- Frontend JavaScript syntax PASS.
- Isolated gateway simulated scenarios: valid structured route (200 AWAITING_GDS_CONNECTION); same-airport error (400); unexpected customer data field (400); missing bearer token (401); unapproved Origin (403). **5/5 passed**.
- n8n output guard simulation: safe plan passes; example with `TTP` and bogus ticket-issuance claim is replaced with safe fallback.
- **Not yet tested**: real signed-in end-to-end browser call, live AI completion, actual GDS/provider connectivity, or real command authorization.
- GitHub CI regression workflow updated with planner UI checks. A green run is not yet independently confirmed.

## Waiting on uncle/provider
1. Exact installed GDS product: Amadeus Selling Platform Connect / Travelport Smartpoint, or other.
2. Official API or sanctioned supported integration documentation for the actual agency account; verify the access permissions and any provider/consolidator limitations. An agent terminal login is not equal to API access.
3. Agency-approved pricing policy, markup limits/fees/taxes, who may approve quotes, and who may book/ticket.
4. Authorized test credentials **delivered only through secured provider/agency credential settings, never pasted in chat**.
5. Staff can then test in provider sandbox/test mode before any authorized controlled production pilot.

## Production implementation after authorization
- Replace dry-run planner with a provider-specific, credential-protected n8n adapter; no raw AI-generated commands execute directly.
- Map AI's structured **search intent** to allowlisted supported vendor operations (not arbitrary command text), with validated parameter types.
- Return actual inventory with timestamps, fare rules and baggage provenance; reprice and revalidate before quote/booking.
- Server-side only: apply approved pricing and build an allowlisted customer output object that excludes net costs and internal margin.
- Operator approval before any external customer quote; separate explicit authorization and safety tests before booking or ticketing.
- Preserve error logging, backup/restore tests, monitoring, rate limits and audit trail.

## Owner validation
Open https://junaid-nurgat.github.io/nurgat-command-centre/ as authorized reviewer, go to AI Flight Research, enter LUN → DXB for future dates, click **Prepare GDS Research Plan**. A result must contain `GDS RESEARCH PLAN — NOT CONNECTED`, no commands, no prices and no booking claim. If error occurs, inspect the error; never silently fall back to pretending the provider was searched.
