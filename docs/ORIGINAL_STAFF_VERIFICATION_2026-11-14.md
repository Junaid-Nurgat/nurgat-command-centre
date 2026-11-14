# Approved original staff account: controlled verification

Date: 14 November 2026 (Africa/Lusaka). Status: prepared and partially verified; **genuine sign-in and authenticated handoff still pending**.

The owner approved use of the original account. This supersedes earlier recommendations to obtain approval for a separate test reviewer. No additional account, password reset, impersonated token, admin-generated sign-in link, permission change or session extraction is needed. Uncle must sign in personally.

## Verified against current services

- Main n8n handoff `Ovchtd30RvioSeL7` is inactive, with no active version. Its ten-node graph was inspected and left unchanged.
- Supabase has one active reviewer linked to an existing, email-confirmed auth user with a prior sign-in. Only these booleans were queried; no password hashes, session tokens or refresh tokens were retrieved. This is configuration evidence, not evidence of a new login by Uncle.
- All seven public tables have RLS enabled. The reviewer SELECT policy compares `user_id` with `auth.uid()` for the authenticated role.
- Neither anon nor PUBLIC has EXECUTE grants on `claim_ai_handoff`/`complete_ai_handoff`. Both functions require active reviewer membership. Completion checks reviewer, request ID, processing state and lease token.
- Re-ran isolated n8n authentication contract: execution **127**, success, four simulated cases. This does not validate real tokens.
- A follow-up database count found zero anonymous-probe rows and zero `ORIGINAL_STAFF_TEST_` rows. No positive test was performed.
- Re-ran live n8n anonymous RPC probe: execution **128**, success, actual HTTP **401**. No signed-in token was involved.
- Local Node suites for original UI, Lite UI and ingress contract passed. New verifier and staging-gate tests also passed. Additionally, remote PR CI run [43632187856](https://github.com/Junaid-Nurgat/nurgat-command-centre/actions/runs/43632187856) completed successfully for commit `aafc0c1e9cbfa288bd2241af1f355f10f0e2723c`, running all four suites.

## New isolated staging workflow

[Original Staff Login Handoff (STAGING ONLY)](https://nurgattourszm.app.n8n.cloud/workflow/QXDFhIqT9N1Ha0Tw), ID `QXDFhIqT9N1Ha0Tw`, is **unpublished** in the personal project **Junaid nurgat**, project root (no folder).

Its 14 nodes reuse the main handoff's claim, duplicate, lease, safety and completion logic. AI2's reviewer check and research-planner nodes are included directly, so it does not call the existing published AI2 webhook and cannot trigger that workflow's admin-email error route. The model uses Gateway credits; an explicit positive test can incur AI usage.

Staging additionally requires `ORIGINAL_STAFF_TEST_` request IDs and the fixed fictional LUN–DXB one-way, one-adult, economy/BEST fixture. It has no messaging, booking, payment, ticketing, provider tool or child-workflow nodes. Its only HTTP nodes call the existing Supabase handoff RPCs and reviewer table. The model receives travel fields only, not the session token.

All execution saving is disabled: manual, progress, success and error. No error workflow is assigned. Webhook CORS is restricted to `http://127.0.0.1:8765`. This is an origin restriction, not authentication. Keep the workflow unpublished and arm its temporary test listener only for the controlled check.

Cloud simulations **129** (completion branch) and **130** (duplicate-completed branch) succeeded. HTTP responses, reviewer identity and AI output were pinned synthetic fixtures; these runs prove branching, not genuine login, live AI or an end-to-end handoff. The local snapshot test executes the actual exported Code-node gates and checks the no-external-operations graph. The snapshot is evidence of this version, not a continuously synchronized copy.

Validator warnings on three literal `apikey` headers refer to the existing Supabase **publishable** key, not a secret/service-role key. Bearer authorization comes from the user's session at runtime. No private credential is embedded in source. The warnings were reviewed and retained for this controlled fixture.

## Uncle's personal sign-in procedure

1. From this repository run `node scripts/serve-reviewer-verification.mjs`. Open **http://127.0.0.1:8765/** on the same trusted computer. The server only serves two fixed files, binds to loopback, sends no-store headers and never receives/proxies login details. This page deliberately disables itself on the public GitHub Pages host.
2. Uncle enters his original staff email/password himself. Do not paste them into chat, a terminal, GitHub or n8n. If MFA or a different login method is required, stop and adapt the flow; do not bypass it.
3. The page calls Supabase Auth directly over HTTPS, verifies `/auth/v1/user`, then checks the same user's active reviewer row under RLS. Success shows only `GENUINE_REVIEWER_LOGIN_VERIFIED`. It retains the access token only in page memory; no storage, console output, token export or refresh-token persistence is used. The password field is cleared immediately on submission.
4. In the **staging** workflow, ensure there is no pinned test data and confirm execution saving is still off and no error workflow is assigned. Select the webhook's **Listen for test event**. Do not publish either workflow. Keep n8n node data and browser network tools private: execution data necessarily exists transiently in the browser/n8n while a request runs, even when persistence is disabled. Never capture or share it.
5. Click **Run fictional handoff** once. It rechecks the current reviewer and posts only the fixed fixture and in-memory token to the fixed staging **webhook-test** URL. Success must show `STAGING_HANDOFF_COMPLETED`. The rendered result contains only status and the non-secret test request ID, never raw server responses or the plan.
6. Re-arm the test listener and click again without reloading/signing in again. The immutable ID and payload are reused. Require `DUPLICATE_COMPLETED_WITHOUT_AI_CALL`. The workflow's duplicate branch must not reach the model. A network failure is inconclusive: no automatic retries or new IDs are generated.
7. Use the displayed test request ID to verify one COMPLETED row with attempt count 1 in the database. Read only request ID, state, attempt count and completion timestamp; do not query the lease token, payload hash or reviewer identity. Do not use a blanket deletion. Retain the clearly labeled test row for evidence or remove that exact row after review.
8. Click **Sign out**, close the page, stop the local server and stop any remaining test listener. Sign-out requests local-session scope, preserving other sessions. An unconfirmed server logout is shown explicitly; clearing browser memory alone is not proof that a token was revoked.

The expected positive test writes one reviewer-scoped deduplication row in the existing Supabase project and may use AI credits. It is a controlled staging rehearsal, not an isolated database. No customer records or account permissions should change.

## Still unverified / release gates

- Uncle's fresh sign-in, real bearer-token authorization, browser CORS, live AI model result, authenticated claim/completion and replay behavior all remain pending until the steps above are actually performed.
- This staging graph embeds AI2 rather than traversing the main workflow's HTTP call to the published AI2 endpoint. A staging pass does **not** certify that exact main-workflow transport path.
- No genuine inactive/non-reviewer user session or expired-token HTTP case was exercised. No second account was created or existing role altered for negative testing.
- Trusted production ingress, rate limiting, concurrency, provider authorization and a full review of privileged RPCs remain release gates. No WhatsApp or GDS integration was activated or changed by this task; existing unrelated automation was not disabled or otherwise modified.
- Supabase advisors still report public SECURITY DEFINER RPC exposure (five functions), leaked-password protection disabled, and three informational RLS-without-policy findings. The handoff functions' reviewer checks and lack of direct table access do not resolve all privileged-function risks. No schema/auth setting changes were made.

References: [Supabase server-confirmed getUser](https://supabase.com/docs/reference/javascript/auth-getuser), [privileged RPC advisor](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable), [password protection](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection), [RLS without policy](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy).
