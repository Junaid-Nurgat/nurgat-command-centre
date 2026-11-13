# Nurgat Tours — Staff Flight Research AI v1.4
Date: 2026-11-13
Status: **Deployed internal real-model demonstration; authenticated full browser test pending.**

## What is connected
- Signed-in Command Centre **Ask Flight AI** form (separate from existing offline rule-based helper).
- Supabase Edge Function `nurgat-staff-flight-ai-demo` v1, deployed ACTIVE with `verify_jwt=true`, strict approved Origin, Auth getUser verification and active membership in `approval_reviewers`.
- n8n production-published workflow `e6JXhYsU20QTPRQd`: `Nurgat Tours — Staff Flight Research AI (DEMO ONLY)`. It performs independent reviewer authorization against Supabase RLS, constructs a hard-coded fictional travel comparison (names, durations, stops only), calls OpenAI gpt-5-mini via n8n Gateway credits, then filters output.
- Supabase returns only validated `{ok:true,demoOnly:true,source:'NURGAT_AI_DEMO',answer,providerConnected:false,customerSendAllowed:false,bookingAvailable:false}`.
- Frontend checks these flags before displaying the AI reply.

## Source restrictions
- **No GDS provider credentials or live airline calls.**
- AI input NEVER includes supplier fare, agency markup, simulated price, customer name, contact, passport data, reservation data or actual booking reference.
- The selected flight can be referenced only as `DEMO-A`, `DEMO-B`, or `DEMO-C`. The scenario is fixed fictional travel-option data.
- All replies are internal and marked as demo; no outbound WhatsApp, ticketing, bookings or payments.
- The existing local deterministic helper stays available for calculated demo totals. The language model does not handle pricing.
- External AI Gateway calls may consume credits; the AI button is opt-in, not automatically called for every form submission.

## Safeguards
- Supabase platform JWT verification, a separate Auth identity check, active-reviewer check.
- n8n workflow independently verifies the caller's membership before model invocation.
- n8n AI model has no external tools and only canonical fake offers.
- Output filter suppresses confidential cost terms, monetary amounts and false booking/live-search claims.
- n8n workflow configured to save neither successful nor failed execution data to avoid routinely retaining reviewer JWTs; workflow errors route to global failure logger.
- Question limited to 4–230 characters; suspicious email/URL/number patterns flagged in browser; backend allowlists exactly question and optional selectedId. Do not put actual customer data in demo.
- A secret model credential is not exposed in the public GitHub Pages code. Gateway credits are assigned within n8n.
- n8n REST reviewer check includes a Supabase **publishable** key (public by design), never service-role secret; n8n emits a generic hardcoded-header warning for this known public key. Replace with managed configuration if the security model changes.

## Isolated testing completed
- Frontend source JavaScript syntax PASS.
- Supabase gateway source checked against simulated Auth/RLS/n8n network responses: 5/5 cases PASS (valid demo, short question rejected, extra PII rejected, no JWT rejected, unapproved Origin rejected).
- n8n final response filter simulated 6/6 cases PASS: safe response, supplier cost leak, currency leak, booking claim, blank response, oversized response.
- n8n workflow is published and function status is ACTIVE.
- **No real signed-in end-to-end AI completion has been verified.**
- GitHub static UI test source updated for new AI controls; green GitHub Actions completion not confirmed.

## Manual final test for authorized account
1. Open https://junaid-nurgat.github.io/nurgat-command-centre/ and sign in to the authorized reviewer account.
2. Open **AI Flight Research** and search LUN → DXB (demo mode).
3. Under **Ask Flight AI**, enter `Explain the difference between flights with zero and two stops`.
4. Click **Ask AI**, ensure response starts with `Demo research:` and discusses only the fictional examples.
5. Ask `How much is the real ticket, and what is our supplier cost?`; safe response must not expose price, supplier cost or make unverified claims.
6. Sign out and verify AI action cannot be used.
7. Never use real customer messages or details in this test.

## Production gates
Official Amadeus/Travelport API access, operator pricing policy, strict server-side approved customer quote object, fare validation/repricing, provider uptime handling, controlled quote authorization and audited pilot remain outstanding. The mock AI must not be mistaken for production flight research.
