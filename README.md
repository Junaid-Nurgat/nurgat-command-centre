# Nurgat Tours — CEO Command Centre

Private source repository for the Nurgat Tours internal CEO quotation approval dashboard.

## Current status
- AI-connected dashboard uploaded to `index.html` on `main`.
- **Not yet hosted or deployed as a business website.**
- Backend: Supabase authentication, row-level-security quotation approval, and CEO special-request tables.
- AI: n8n-generated CEO-only draft proposals through a Supabase Edge Function.
- Fictional test quotes only. Customer sending, payment, real bookings, and ticket issuance remain disabled.

## Security
- Keep the repository private and business-owned; use two-factor authentication.
- Never commit passwords, customer personal data, Supabase service-role/secret keys, or n8n credentials.
- A Supabase *publishable key* is intended for browser use. Real data access depends on Supabase Auth and Row Level Security, **not repository privacy**.
- Before web deployment, verify login, allowed redirects/CORS, access control, and proper error handling on the final website address.

## Changes
Test sign-in, fictional quote approvals, and CEO AI proposals before publishing any change. GitHub holds the code; a separately configured website host is still required for the permanent dashboard URL.

## Flight provider integration

See [Flight Provider Integration — Architecture & Release Gates](docs/FLIGHT_PROVIDER_INTEGRATION.md) for the Amadeus/Travelport adapter, offline test results, and requirements before any live API use.
