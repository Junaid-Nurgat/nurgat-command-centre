# Nurgat Tours — Customer Quotation Handoff Workflow
Date: 2026-11-13
Status: **Internal quotation preparation/review demo implemented; real customer delivery intentionally disabled.**

## Implemented (v1.6)
- After internal demo flight comparison, select a fictional itinerary and click **Prepare test draft**.
- The resulting document is *always* labeled **FICTIONAL / INTERNAL TRAINING / NOT A CUSTOMER QUOTE / NEVER SEND**.
- Shows route, dates, passenger count, cabin, sample flight, fake base illustration, sample markup, sample total, uncertainty and blocked actions.
- **Mark demo reviewed** is a reversible-in-effect training state change from draft to reviewed (cannot approve sending).
- **Copy watermarked TEST text** uses browser clipboard for internal testing only. This is **not a Send to Customer feature**. No WhatsApp/email recipients, automated sends, PDF exports, booking, ticketing or payments.
- **Discard** clears the current training draft.
- Any flight selection change, markup change, search submission, trip detail input change, reset or staff sign-out automatically invalidates the training draft.
- Status lives only in current page memory; no claim of a durable audit log or Supabase quote creation.
- The existing real reviewer quotation area and its seeded fictional quote records are separate; the new internal training draft never enters or changes those records.

## Remaining before real customer delivery
1. Confirm licensed Amadeus/Travelport API interface and provider sandbox access. No live GDS connection currently exists.
2. Obtain real, verified, *priced-for-the-selected-passenger-mix* offers, fare basis, baggage and restrictions, taxes/fees, last-ticketing date and price expiry.
3. Define owner-authorized markup policy, approvals and price/commission segregation on the backend. Browser sliders must not authorize prices.
4. Reprice and reconfirm availability immediately before quote release, ensuring mandatory fees and conditions are correctly displayed.
5. Backend generates an immutable versioned **customer quotation object** using a strict customer-field allowlist; no supplier costs, internal markup or profit fields may enter customer messages or AI inputs.
6. A dedicated reviewer approves a specific revision (not a generic draft), with recorded timestamp, user identity, provider offer ID, validity window and audit entry.
7. Deliver via an expressly approved channel. Initially, recommend **Preview → Approve → Copy customer-safe quote → manually send using agency's existing WhatsApp/email process**. Add API sending only with owner authorization and compatible WhatsApp provider access. Do not replace Meta Business Agent.
8. Capture sent/delivered/expired/revised states and replies where the authorized integration makes them available; avoid claiming delivery success just because copy happened.
9. Add concurrency, fraud/PII protection, deduplication, failure recovery, logging, rate limits, consent, retention/deletion rules and end-to-end security tests.

## Draft state machine (production design, NOT implemented)
`DRAFT → VERIFIED_PRICE → AWAITING_REVIEW → APPROVED → READY_TO_SEND → SENT / EXPIRED / REVOKED`

Only `APPROVED` for the exact still-valid revision may lead to `READY_TO_SEND`. Any itinerary edit, pricing change or fare expiry must invalidate approval and require revalidation/reapproval.

## Validation so far
- Dashboard JavaScript syntax verified after commit.
- Isolated formatter tests: fictional USD 735 + USD 125 demo adjustment = USD 860, watermark present, delivery locked even after internally reviewed.
- Regression-check source extended with quotation controls and watermark assertions.
- **Full authenticated browser testing and an observed green GitHub Actions run are not yet confirmed.**
- No actual customer message was sent and no real pricing data was used.

## Browser demonstration
1. Sign in: https://junaid-nurgat.github.io/nurgat-command-centre/
2. Open AI Flight Research. Run a demo search and select Sample Air B.
3. Set sample markup to USD 125; scroll to **Quotation preparation & handoff**.
4. Click **Prepare test draft**. Verify the fictitious base USD 735 becomes invented USD 860.
5. Click **Mark demo reviewed**. Verify sending remains locked.
6. Change the markup or select another flight; the existing test draft must disappear.
7. Optional: copy the watermarked text only for internal test review; **never send this fictional record to customers**.
