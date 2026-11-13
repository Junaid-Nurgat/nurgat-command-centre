# Customer Price Confidentiality — Nurgat Tours
Date: 2026-11-13
Status: **DEMO-ONLY GUARD IMPLEMENTED AND TESTED; LIVE GDS QUOTE PIPELINE NOT YET CONNECTED**.

## Owner requirement
Customer-facing AI and messages must **never disclose or discuss supplier acquisition costs, original/net fare, internal base cost, markup, commission, or profit calculations**. A customer can be shown only the authorized, verified **final selling total** and any legally required customer-facing fee/tax breakdown. Do not misrepresent required taxes, mandatory charges, or the final payable amount.

## Implemented
- AI Customer Receptionist (`wrL9GFoE4I9YObIa`, **inactive**) now has a confidential-pricing instruction and output filter.
- AI Flight Specialist (`Kt0upu2aOsMeANhV`, **active demo**) has the same instruction and output filter, with a published updated version.
- Both new `Customer Price Confidentiality Gate` code nodes accept only answer text and return a small, sanitized object; they **remove every extra input field** (such as supplierTotal or agencyMarkup).
- Until live verified quotation data and approval exist, the filter blocks all currency-marked amounts and internal cost/markup terminology and substitutes a safe enquiry response. This is intentionally **fail-closed** rather than allowing an AI to guess fares.
- Flight Comparison Lab (`V69aHXxrdbp9u436`) remains blocked from customer messaging and uses fictional fixtures. Any internal supplier/margin calculations must remain restricted to authorized reviewer-facing systems.

## Test evidence
Offline `Nurgat Tours — Pricing Confidentiality Tests (OFFLINE)` workflow `yd58RoUrPGJXy51t`: execution **94**, **9/9 PASS**, six blocked sample leaks, three allowed normal samples. Tests include supplier cost and markup language, direct USD and $ amounts, original/net prices, missing answer, ordinary greetings, baggage questions, and unwanted internal structured fields. No customer messages or real fare quotes sent.

## Go-live condition — important
**Do not simply relax the monetary blocker after connecting GDS.** Implement a dedicated customer quote output object, created after verified live supplier availability/pricing, final selling total calculation, all legally required disclosures, authorization/approval, and repricing/expiry checks:
```json
{
  "currency": "USD",
  "approvedCustomerTotal": "<verified authorized total>",
  "customerFacingTaxesAndFees": "<required disclosed components>",
  "quoteId": "<approved quote reference>",
  "fareVerified": true,
  "approvedForCustomer": true
}
```
Only a server-side formatting component should convert this allowlisted object into customer communication. **Never send the raw provider API response or internal quote database row to the receptionist model.** Keep supplier totals and markup in a private internal pricing context, not model prompts or customer-message payloads.

## Known limits
- This is a defense-in-depth rule plus a heuristic output guard, not an infallible leak-prevention guarantee. Unmarked numerical amounts or indirect descriptions can evade pattern matching; strict allowlisted structured customer quote formatting is required before live quote sending.
- The chatbot is not currently published to customers, and real final-price behavior has not been end-to-end tested against GDS or WhatsApp.
- Staff authorization and customer messaging approvals remain required before any real quote.
