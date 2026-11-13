# AI 1 → AI 2 automatic handoff — demo integration

Status: **Created in n8n, UNPUBLISHED for safety and E2E testing.** Date: 2026-11-13.

## Implemented today
- New n8n workflow: [AI1 to AI2 Secure Handoff (DEMO ONLY)](https://nurgattourszm.app.n8n.cloud/workflow/Ovchtd30RvioSeL7).
- Located in Nurgat Tours' personal n8n project (project ID `QAMemlGB8a2W38dU`).
- Four nodes:
  1. **Protected AI1 Staff Handoff**: internal POST webhook route, expects an authorized reviewer JWT and structured travel request. Has no official WhatsApp trigger.
  2. **Allowlist AI1 Request**: enforces exact trip schema (no names, phone numbers, emails, chat history, passport info, pricing or arbitrary fields); rejects malformed dates, airport codes, passenger counts and missing JWT.
  3. **Forward to Existing AI2 GDS Planner**: calls the existing n8n GDS research planning webhook and forwards the session for the planner's active-reviewer RLS authorization check. Does not call a live provider.
  4. **Enforce AI2 Read-Only Safety Gate**: requires disabled GDS execution, customer sending, booking and ticketing flags; rejects unsafe planner output and returns an internal-only plan.

## Security controls
- Reviewer JWT required; actual reviewer membership re-verified in the existing AI2 workflow using Supabase RLS. The webhook itself is not credential-authenticated, so **do not publish or reveal its URL as an open integration** without completing the authenticated E2E test, rate limiting, and ingress controls.
- No customer personal data accepted or forwarded.
- Successful/failed execution-data saving disabled; manual execution saving disabled. 45-second timeout, errors routed to existing Nurgat workflow error handler.
- No real WhatsApp inbound webhook, customer reply, supplier fare, pricing, confirmed availability, booking, or quotation.
- **The workflow is intentionally UNPUBLISHED**, so no production endpoint is live yet.

## Isolated code checks completed
- Valid structured route passed.
- PII field rejected.
- Missing reviewer JWT rejected.
- Same origin/destination rejected.
- Safe planner response accepted.
- Response with customer sending enabled rejected.
- These tests are isolated function checks, **not** authenticated end-to-end n8n execution.

## Next integration steps
1. Confirm the existing WhatsApp Business Agent's provider, control points and API permissions; **do not replace, disconnect, or modify it**.
2. Agree with uncle on what AI 1 can send to AI 2, consent/retention policy, and rate limits; include an agent ownership and escalation protocol.
3. Add server-side trusted ingress (e.g. authorized Supabase Edge Function), replay/duplicate protection, reviewer-bound authorization, and request status tracking. Never expose an n8n production webhook or JWT in browser source.
4. Test the handoff end-to-end using **test-only records**. Publish the workflow only after its authentication and abuse controls are validated.
5. At the API meeting, establish actual licensed GDS access, sandbox and permitted operations. Real offers, rules, taxes and price checks remain pending.
6. Create server-side customer-safe quotation workflow with approval of each verified offer/revision and controlled official WhatsApp delivery; all disabled until permission and live tests.

## Important distinction
The new n8n flow is a **real automatic inter-workflow transfer** for structured internal research planning once safely activated; it is **not yet** the promised end-to-end automatic WhatsApp → real GDS → quotation → customer messaging product.
