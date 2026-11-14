# Nurgat Tours — CEO Command Centre

Private source repository for the Nurgat Tours internal CEO quotation approval dashboard.

## Current status
- AI-connected dashboard uploaded to `index.html` on `main`.
- **Demo hosted on GitHub Pages** at https://junaid-nurgat.github.io/nurgat-command-centre/ (user confirmed it loads; authenticated flows require separate browser verification). **Not approved as the production commercial operations host.**
- Backend: Supabase authentication, row-level-security quotation approval, and CEO special-request tables.
- AI: n8n-generated CEO-only draft proposals through a Supabase Edge Function.
- Fictional test quotes only. Customer sending, payment, real bookings, and ticket issuance remain disabled.

## Security
- Repository is currently **public** for the demo GitHub Pages site; keep access business-owned, enable two-factor authentication, and assume all committed source is publicly readable.
- Never commit passwords, customer personal data, Supabase service-role/secret keys, or n8n credentials.
- A Supabase *publishable key* is intended for browser use. Real data access depends on Supabase Auth and Row Level Security, **not repository privacy**.
- Before any **commercial** deployment, use an appropriate host and verify login, allowed redirects/CORS, access control, and proper error handling on the final address.

## Changes
Test sign-in, fictional quote approvals, and CEO AI proposals before publishing any change. The GitHub Pages demo is available, but commercial operations require a compliant permanent host and authorization.

## Flight provider integration

See [Flight Provider Integration — Architecture & Release Gates](docs/FLIGHT_PROVIDER_INTEGRATION.md) for the Amadeus/Travelport adapter, offline test results, and requirements before any live API use.

## Pre-approval automation work

See [Pre-Approval Build Handoff](docs/PRE_APPROVAL_HANDOFF.md) for verified n8n flight request tests, dual-provider fixtures, budget-threshold checks, failure reports, and exact tasks requiring business authorization.

## Latest independent pre-API audit

[Pre-API System Audit — 2026-11-13](docs/PRE_API_SYSTEM_AUDIT_2026-11-13.md) summarizes verified offline tests, email monitoring fixes, security findings, and remaining authorization gates. It does not certify production readiness.

## Backup, Recovery and External Monitoring

- [Account-loss, Backup & Recovery Runbook](docs/ACCOUNT_LOSS_BACKUP_RECOVERY.md) — includes the current workflow inventory and owner actions required to secure actual n8n backups. **Documentation is not a substitute for a private workflow export.**
- [External Reachability Check](.github/workflows/external-reachability.yml) — GitHub Actions job scheduled every 30 minutes outside n8n. Checks basic public service reachability; **scheduled runs and email notifications still need owner verification**.

## Internal AI Flight Research workspace (November 13, 2026)

- The existing signed-in Command Centre now has an **AI Flight Research** navigation tab with a staff-only demonstration form and three fictional flight comparison cards. Form fields include IATA airports, travel dates, passenger counts, cabin and search preference.
- The interface uses **local fictitious sample data only** and performs no live GDS search, customer contact, payments, bookings or ticket issuance. It must not be used to quote customers.
- Version 1.1 adds selectable flight cards, a selected-flight staff review panel, and a quick comparison table. Selection is **temporary, local to the page**, and cannot approve, send or issue tickets.
- Version 1.2 adds an **offline, deterministic research helper**: cheapest, fastest, fewest stops, selected option, baggage, fare conditions, and availability questions. It uses only local fictional results, never external AI/GDS tools or unverified rules. Unsupported requests receive an explicit limitation, not invented guidance. Tested the helper function against eight categories and validated dashboard JavaScript syntax; a full authenticated browser verification is still needed. JavaScript source passed syntax validation, but full signed-in browser testing still requires the authorized operator.
- Actual flights, prices, baggage and fare rules remain **unverified** until the authorized Amadeus or Travelport provider API is connected and tested.
- **Current phase:** guided staff UI demo; **next phase:** secure backend search contract, real provider integration, price verification, supplier-cost isolation, and operator approval.
- [Revised scope: internal AI Flight Researcher](docs/AI_FLIGHT_RESEARCHER_REVISED_SCOPE_2026-11-13.md).

## Secure staff flight search demo backend (November 13, 2026)

- Supabase Edge Function `nurgat-flight-research-demo` **v1 ACTIVE**, with JWT verification and a second active-reviewer membership check against `approval_reviewers` under RLS.
- Default checked **Use secure demo backend** sends a validated flight request containing only route, dates, passenger counts, cabin and preference; it never sends optional customer/staff reference or PII.
- Returns three **fictional** options only, with strict `FICTIONAL_DEMO_ONLY` and no-booking/no-customer-send flags. No provider, payment or n8n execution is called.
- If the authenticated endpoint fails, the UI **fails visibly**. It does not silently invent a live search. Staff can deliberately switch off backend mode to test local fixtures.
- Source JS syntax checked and Edge Function deployed; **authorized signed-in browser/CORS testing is still required**.
- [Secure flight-search API contract and browser verification checklist](docs/SECURE_STAFF_FLIGHT_RESEARCH_CONTRACT_2026-11-13.md).
- [Automated UI regression checks](scripts/test-flight-ui.mjs) via [GitHub Actions](.github/workflows/flight-research-static-ci.yml). CI workflow added; first green CI run not yet confirmed.

## Internal markup preview (v1.3)
- The AI Flight Research **internal markup simulator** has a USD slider and exact-number input (fictional USD 0–500 adjustment per itinerary); card totals, comparison table, selection details and offline helper update automatically.
- Markup and starting fare figures are **fictional training figures**. They are not saved, sent to a customer or eligible for use in live quotes. The limit is a UI demo limit, **not** an authorized business policy.
- A real markup policy and final-quote allowlist will require owner approval and server-side enforcement after the genuine GDS integration.
- [Implementation and security details](docs/STAFF_MARKUP_CONTROL_2026-11-13.md).

## Staff flight research AI (v1.4)
- A real **gpt-5-mini** language-model demo is now wired into the signed-in Command Centre using a separate `Ask Flight AI` form.
- Supabase `nurgat-staff-flight-ai-demo` v1 (JWT + active reviewer) proxies to n8n `e6JXhYsU20QTPRQd` (separate reviewer check, model and output filter). No GDS provider, ticketing or customer messaging is connected.
- The AI gets **only fictional durations/stops and selected sample ID**, never supplier/net fare, markup values, personal information, real customer enquiries or live availability. The offline deterministic helper remains available.
- The AI model may use Gateway credits on each explicit click. Frontend and gateway code tests passed in isolation; **authorized signed-in end-to-end test is still outstanding**.
- [AI integration contract and test checklist](docs/STAFF_FLIGHT_AI_INTEGRATION_2026-11-13.md).

## GDS coding AI — API-waiting integration stage (November 13, 2026)
- Command Centre **Prepare GDS Research Plan** connects via the authorized Supabase `nurgat-gds-planner-demo` Edge Function to published n8n workflow `TuqFlp60RxvorLfv` (gpt-5-mini, strict request validation and restricted output).
- Generates a **non-executable AI research plan** from structured flight form values. No provider-specific cryptic commands or real GDS interface calls are generated while exact Amadeus/Travelport product and API remain unconfirmed.
- Real coding/command automation requires the licensed provider's supported API or authorized integration method, verified documentation/permissions and the operator's pricing/booking approval rules. No credentials should be pasted into public GitHub/AI chat.
- Deployment and isolated checks verified; actual signed-in browser response still needs the authorized account. [Complete handoff and remaining gates](docs/GDS_COMMAND_AUTOMATION_API_WAITING_HANDOFF_2026-11-13.md).

## Internal quotation & customer handoff rehearsal (v1.6)
- The Flight Research workspace now includes a **Quotation preparation & handoff** section: create fictional, watermarked internal draft; mark demo reviewed; copy internal test-only text; discard.
- Changing itinerary, travel dates, passengers, sample markup, or signing out invalidates the demo draft. **This is not a real customer quote or a customer sending service.**
- The interface lists the exact remaining release gates: licensed GDS, verified fare/rules/expiry, owner-approved markup, staff approval, approved delivery channel and auditable status tracking.
- [Customer quote workflow and production handoff contract](docs/CUSTOMER_QUOTATION_HANDOFF_2026-11-13.md).

## Command Centre Lite — separate phone-first version
- **[Launch Lite](https://junaid-nurgat.github.io/nurgat-command-centre/lite.html)** — a simple mobile-first interface with Search, Flights, Quote, and AI tools.
- **[Launch original](https://junaid-nurgat.github.io/nurgat-command-centre/)** — the existing dashboard remains unchanged. Lite is maintained in `lite.html`, separate from `index.html`.
- Same authorized reviewer login and existing secure demo APIs. All prices are fictional, AI cannot view confidential supplier pricing, and customer delivery is disabled.
- [Lite design, safeguards and mobile test checklist](docs/COMMAND_CENTRE_LITE_2026-11-13.md).

## AI 1 → AI 2 handoff work
- New [internal n8n AI-to-AI handoff workflow](https://nurgattourszm.app.n8n.cloud/workflow/Ovchtd30RvioSeL7) created; **unpublished** pending E2E authorization and ingress hardening.
- Validated structured flight details can flow from AI 1 into the existing read-only AI 2 planner; no WhatsApp, GDS pricing, bookings or customer sending are active.
- [Architecture, security and activation checklist](docs/AI1_AI2_HANDOFF_DEMO_2026-11-13.md).

## GDS API meeting preparation
- [API meeting readiness pack](docs/GDS_API_MEETING_READINESS_PACK_2026-11-13.md) covers provider licensing/entitlements, sandbox access, permitted operations, fare rules, agency approval, WhatsApp ownership, security and next actions.
- AI1→AI2 n8n simulated workflow tests: valid dry-run succeeded (execution 99); invalid personal-data/missing-JWT/unsafe-output cases rejected (100–102). Workflow remains **unpublished** pending live authenticated end-to-end tests and replay controls.

## Day 2 AI handoff reliability (14 November 2026)
- Created a reviewer-scoped **atomic request-id claim/completion store** in Supabase (`public.ai_handoff_dedupe`) with RLS and no direct client table access.
- Updated unpublished n8n AI1→AI2 handoff to **9 nodes**: validate immutable request ID, check atomic claim, stop duplicate/conflicting requests before AI2, persist completion for safe future retries.
- **Eight n8n pinned simulation runs (104–111):** four valid/duplicate/conflict branches completed; four unsafe or failed-completion cases rejected.
- See [detailed evidence and open security gates](docs/AI1_AI2_HANDOFF_DEMO_2026-11-13.md). **Not published or integrated with WhatsApp.** Authenticated end-to-end, concurrent requests, rate limiting, provider permissions and API test remain outstanding.

- **Lease-fenced retry hardening complete (14 Nov):** 10-node handoff, SHA-256 request fingerprint, 2-minute lease, max 3 processing attempts, and a matching per-attempt completion token. n8n simulations 112–119 passed expected outcomes; transactional SQL tests of duplicate, conflict, stale-token and retry-limit behavior passed and were rolled back. Still unpublished pending ingress/E2E security approval.

## Pre-API security checkpoint — 14 November 2026
- Strengthened `claim_ai_handoff` database validation (date/calendar/18-month window, passengers, one-way/round-trip, strict allowlist). Direct transaction tests confirmed expected acceptance/rejection and were rolled back with no test records remaining.
- [Evidence, limits and next integration requirements](docs/AI1_AI2_HANDOFF_DEMO_2026-11-13.md).
- AI1→AI2 handoff remains **unpublished** pending real authenticated ingress, rate-limit/abuse protections, security review and external end-to-end verification. Neither WhatsApp nor real GDS integration has been activated.

## Future WhatsApp ingress test contract
- [Server-side request validator, opaque event ID generation and offline tests](docs/AI1_PROVIDER_INGRESS_CONTRACT_2026-11-14.md) added. **Not deployed or integrated with WhatsApp.** CI includes `node scripts/test-handoff-contract.mjs`; green remote run not yet confirmed.

## Mission 1 — CI and authentication readiness audit (14 Nov 2026)
- [Read the CI and authorization findings](docs/MISSION1_CI_AUTH_AUDIT_2026-11-14.md). All three GitHub Actions tests are configured but a green remote run is **not yet verified**.
- Database RLS and restricted RPC grants were independently checked. Two public-schema `SECURITY DEFINER` functions still need security review and live authenticated testing.
- The 10-node AI-to-AI n8n handoff remains **unpublished**; no customer-facing operations are active.
