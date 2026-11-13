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
