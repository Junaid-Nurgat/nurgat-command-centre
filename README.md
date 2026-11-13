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
