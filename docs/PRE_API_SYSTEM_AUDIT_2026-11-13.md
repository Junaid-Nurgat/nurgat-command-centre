# Nurgat Tours — Pre-API System Audit
**Date:** 2026-11-13  
**Scope:** Connected n8n project, Supabase project, and public GitHub Pages dashboard repository.  
**Outcome:** Demo/offline test paths verified. **Not** clearance for live customer operations or GDS bookings.

## Verified automatically in this audit

### n8n
- Active production-mode demo workflows inspected: CEO AI Bridge (`5gtdDG3vq2JBFQxB`), AI Flight Specialist (`Kt0upu2aOsMeANhV`), Flight Comparison Lab (`V69aHXxrdbp9u436`), Global Failure Logger (`ZAxm8dI81QMZYT8u`), Daily Reliability Snapshots (`OiuR7XhPWq6GSh0J`), Pending Failure Alert Recovery (`ID2H2sN9gEwuFvKp`).
- All three business-facing demo workflows have `errorWorkflow` set to the central failure logger. Daily reporting and six-hour alert recovery also have error logging now.
- Incident history contains three intentional `TEST_EVENT` failures; **zero** `NEEDS_REVIEW` failures at audit time. The absence of recorded failures is **not** proof that all systems are healthy.
- Existing authorized Gmail OAuth alert path was verified previously through production-mode controlled failure: CEO AI Bridge execution **79** → Logger **80** → Gmail message receipt stored. Did **not** send a new production email in this audit.
- Six-hour recovery workflow is active, and no pending delivery attempted when queue empty (execution **91**).
- Offline flight request gate reran **22/22 PASS** (execution **84**); supplier response contracts **18/18 PASS** (execution **86**); usage threshold contracts **18/18 PASS** (execution **88**).
- Manual health report reran successfully (execution **90**). Stale health report wording implying Gmail alerts were not configured was **fixed** in both manual and daily reports; retests **92** and **93** passed. New daily snapshot saved.
- Six-hour recovery workflow lacked `errorWorkflow` and was updated to report its own failures to `ZAxm8dI81QMZYT8u`; changes published. Note: if Gmail itself is down, central logging may succeed but email delivery can still fail.

### Supabase
- All six `public` application tables have row-level security **enabled**.
- `nurgat-ceo-ai-process` Edge Function is ACTIVE (v2) with JWT verification on.
- Read-only counts: 4 fictional approval quotes; 1 reviewer; 1 CEO special request; 1 AI proposal.
- Three privileged authenticated approval/request functions deny anonymous EXECUTE and reference `auth.uid()`. This is a **static authorization check**, not a complete penetration test or logged-in browser test.
- Security Advisor reports: 2 intentional audit tables with RLS enabled and no policies; 3 intentionally authenticated SECURITY DEFINER RPCs; leaked-password protection disabled. Review the last item with administrator before real production.
- Advisor reference: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

### GitHub Pages dashboard
- Public repository `Junaid-Nurgat/nurgat-command-centre`, `index.html` (static demo), inspected from connected GitHub.
- Static source contains references to auth, approval RPCs, and AI Edge Function; static scan did not find literal `sb_secret_` or `service_role` strings. This does **not** constitute a full secret scanner.
- No edits to the dashboard were needed for this audit.

## NOT fully tested — do not label production-ready
- **Full owner browser experience:** no authenticated interactive login, quote review, complete AI proposal creation and visual dashboard click-through performed in this audit. Prior CEO AI webhook execution **54** succeeded, but it is not a fresh live browser transaction.
- **Actual Amadeus or Travelport GDS:** no credentials or verified API contract connected; offline fixtures are invented.
- **Live credit consumption / n8n quota:** no verified billing allowance or source to fetch balances. Threshold tests are offline only and do not shut off live spending.
- **Independent platform uptime and Gmail mailbox delivery/bounce:** not yet monitored. Gmail API accepting a message is not proof that a human saw it.
- **Commercial readiness:** hosting suitability, privacy, customer messaging, real bookings/ticketing, payments and agency legal signoff remain separate.
- **Flight Specialist:** existing extra unconnected Code node was observed on the active canvas. Left unchanged because changing it could alter a working demo without a tested replacement; review when deploying real API integration.
- **Error logger:** no guaranteed exactly-once email semantics when Gmail send succeeds but receipt write fails; recovery digest may duplicate notification in that rare case.

## Approval/dependency checkpoint
1. Uncle/authorized operator confirms sandbox account and credentials for selected GDS provider.
2. Administrator verifies actual n8n billing cycle and execution allowance, AI Gateway credits and budget API/usage dashboard access.
3. Administrator performs authenticated browser walkthrough and leaked-password protection review, including hosting/compliance choices.
4. Only after these pass, authorize real fare search, repricing and eventually any customer send/booking/ticketing actions.

**No live flight search, booking, customer message or payment was performed during this audit.**
