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
