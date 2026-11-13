# Nurgat Tours — Pre-Approval Build Handoff
Updated November 13, 2026.

## Why this exists
The internal CEO Command Centre and demo automation suite can be inspected before the agency obtains external authorizations. All providers, booking and customer messaging remain blocked. No private keys or actual customer content is stored in this document.

## Implemented and verified in n8n
### Already operating (test/demo)
- CEO AI Bridge `5gtdDG3vq2JBFQxB` — active, verified successful webhook processing earlier.
- Global Failure Logger `ZAxm8dI81QMZYT8u` — active, verified failure-to-log execution 56 → 57.
- Reliability Health Check `LsCEPhu6meQ5uuAe` — manual, execution 68 verified.
- Daily Reliability Snapshots `OiuR7XhPWq6GSh0J` — active, scheduled 08:00 Africa/Lusaka, outputs to private n8n table. Executions 66, 69 verified; zero-row handling configured with `alwaysOutputData`; errors routed to Global Failure Logger.

### New safe reusable modules (not active publicly)
- Flight Request Validation Gate (DEMO ONLY): `PiXTI0iGQc3J1hqi`.
- Flight Intake Safety Tests (OFFLINE): `BM5L4LLM24HcvSy9`. **22/22 passing, execution 70**. 3 valid fixture requests become internal search drafts; 19 are blocked. Personal email/phone fields dropped; no live API calls or customer actions.
- Universal Flight Provider Normalizer (OFFLINE): `EWUXSBU141ftPm6y`. **18/18 passing, execution 64**, using reusable Provider Adapter Contract `D8fNN8td7kHKeUNK`. Fares not ranked without comparable travel requirements and validated fare scope.
- Usage Budget Decision Gate (OFFLINE): `p5Y1c8LtdkUdfnrA`.
- Usage Budget Threshold Tests (OFFLINE): `Rc1QgmHkXJa3xyxK`. **18/18 passing, execution 72**. Checks 70/85/95/100-percent thresholds; refuses to assume credit allowance for unverified data. This **does not enforce budgets in live AI workflows yet**.
- Failure Email Draft Preview (NO SEND): `XZpnL5Acte3wbkx1`. **Execution 74** found zero legitimate incidents and sent nothing.

## What the modules protect
- Requests: reject invalid IATA format, past/invalid departure dates, invalid return trips, unreasonable passenger counts, unsupported cabins/currencies/providers, or any input not explicitly tagged as fictional test data.
- Credentials: all offline workflows do not require GDS keys; never place production secrets in browser JavaScript or GitHub.
- Costs: unknown balances mean manual review, not assumed unlimited credits.
- Messages: all new modules disable customer sending, payments, reservations and ticket issuance.

## Explicit external approval boundary
1. **Business decision**: agency owner confirms Amadeus and/or Travelport product, account ownership, API terms, authorized credentials, and flight booking/ticketing arrangement (including consolidator requirements if applicable).
2. **Notification authorization**: agency admin chooses business notification destination and grants permitted Gmail/SMTP service connection. The email preview must not be enabled for delivery until authorized and tested.
3. **Billing visibility**: agency owner confirms n8n plan, billing cycle, remaining executions, n8n AI Gateway allowance, and whether an agency-owned OpenAI API account is needed. Without verified balances, live spend alerts and automatic budget enforcement cannot be truthfully enabled.
4. **Production infrastructure**: agency selects hosting permitted for commercial use, confirms authentication/password-protection policies, operating SLA, adult administrator responsibilities, privacy/legal compliance, and customer communication approval.
5. **Production go-live**: perform authenticated real API sandbox verification, end-to-end integration and price/reprice tests, monitoring/alert testing, and explicit owner signoff for each action category. No assumptions that live flight results are automatically safe/bookable.

## Notes for reviewer
- The **GitHub repository is PUBLIC** and currently contains static demo code. The publishable Supabase browser key is not secret; do not commit service role or private API keys.
- GitHub Pages is being used as a demo; review hosting terms and move the commercial operations app to compliant hosting before handling real customer data.
- Existing demo customer data and client approval flows remain blocked from real communication.
- Saved snapshots are not email alerts. n8n/Gateway balances are **not** available from these workflows.
- The shared normalizer currently accepts only test fixtures. Do not mistake the synthetic Travelport-shaped payloads for a provider-certified live parser.
