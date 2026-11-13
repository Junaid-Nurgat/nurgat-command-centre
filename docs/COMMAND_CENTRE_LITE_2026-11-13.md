# Command Centre Lite — phone-first alternative (2026-11-13)

## Two separate versions
- **Original:** https://junaid-nurgat.github.io/nurgat-command-centre/
- **Lite:** https://junaid-nurgat.github.io/nurgat-command-centre/lite.html
- Original `index.html` was not edited for this project. Lite exists as a **separate `lite.html` file** in the same GitHub Pages site.

## Lite design
- Designed mobile-first with four simple tabs: **Search, Flights, Quote, AI tools**.
- Big finger-friendly buttons, readable cards, minimal scrolling and one core task per section; scales up for laptop viewing.
- No dense desktop quote tables or crowded sidebar. Easy switch back to the original.
- Reuses the same Supabase user session key `nurgat-auth-v2` and additionally requires active agency reviewer membership in `approval_reviewers` before showing the workspace.
- Existing secured endpoints: `nurgat-flight-research-demo`, `nurgat-staff-flight-ai-demo`, `nurgat-gds-planner-demo`.
- All backend responses require explicit demo and disabled booking/customer-send flags.

## Staff flow
1. Sign in to the authorized reviewer account.
2. Enter test trip details in **Search** and call the secured fictional flight-demo endpoint.
3. Compare 3 strictly fictional cards in **Flights**, adjust a demo-only USD markup slider/exact entry, and select one.
4. Prepare a clearly watermarked internal test draft in **Quote**. Demo-review and internal test-only clipboard copy are available, but there is no customer delivery button.
5. Optionally use **AI tools** for fictional route guidance and a non-executable GDS research plan.

## Protections
- Never claims a real GDS query, reservation, quote, booking or ticket issuance.
- No customer data fields or supplier prices are submitted to AI endpoints. No automatic customer messages.
- Editing search inputs invalidates old results and the quote; changing the selected flight or markup invalidates the quote.
- Quotes are temporary, not durable database approvals, and remain customer-send locked even when marked reviewed.
- The Lite UI uses safe text insertion instead of placing untrusted AI responses into `innerHTML`.
- Live GDS API integration remains dependent on agency authorization, provider documentation and sandbox tests.

## Technical validation
- Standalone Lite JS passed syntax verification.
- Both old and Lite file identities checked after deployment commit; original SHA unchanged at creation.
- `scripts/test-lite-ui.mjs` checks interface elements, demo safety flags, blocked delivery and watermarked sample math.
- GitHub static CI workflow includes both `scripts/test-flight-ui.mjs` and `scripts/test-lite-ui.mjs`.
- **Actual signed-in browser/device testing and confirmation of green CI run remain pending.**

## Manual mobile acceptance check
1. Open Lite URL on Android or iOS and sign in with an authorized staff reviewer account.
2. Check that the four bottom tabs are easily tappable without horizontal scrolling.
3. Search LUN → DXB using future dates.
4. Select fictional Sample Air B, set markup to USD 125 and make a test quote; adjusted amount should be USD 860.
5. Mark it reviewed; verify copying remains labeled internal test and never has a customer-send action.
6. Change markup or date; verify quote is discarded immediately.
7. Try AI question and dry-run GDS plan (both use paid/limited gateway credits); no real provider claims permitted.
8. Switch to Original from the top header; confirm original dashboard still works.
