# Nurgat Tours — Pre-Launch Risk Register (Research)
**Prepared:** 2026-11-13  
**Purpose:** Replace scattered “what if?” questions with a single prioritized launch checklist. This is research and planning, **not proof of production readiness**.

## Priority 0 — Before real customer booking or payment

| Risk | Required control | Current Nurgat status | Release gate |
| --- | --- | --- | --- |
| Unverified airline fare or availability | Authoritative search and repricing for selected itinerary before commitment | Offline provider fixtures only; no production GDS | Live authorized provider test and fare revalidation |
| Supplier price / markup leak | Keep confidential net fare and markup in internal data only; customer quote is constructed from an explicit approved final price allowlist | Demo instruction + output filter tested (9/9); no live customer quote formatter | Build and test server-side price/approval boundary; do not give AI raw provider response |
| Duplicate booking/payment after retries | Stable idempotency keys and transaction status reconciliation; never blindly retry unknown side effects | Booking and payment disabled | Duplicate-request and uncertain-result tests |
| No ticketing authority | Confirm commercial provider contract / consolidator or accreditation; distinguish reservation from actual ticket issuance | Awaiting uncle/provider decision | Documentary ticketing arrangement and operational approval |
| Personal/passport/payment data exposure | Minimal collection, restricted access, encryption, retention/deletion, legal privacy review | RLS enabled on Supabase demo tables; not a complete compliance audit | Adult operator/agency counsel review Zambia Data Protection Act responsibilities; explicit privacy notices and vendor arrangements |
| Customer-facing AI error or prompt injection | Verified sources, limited model privileges, separated internal vs customer data, human escalation | Demo receptionist inactive; internal pricing controls added | End-to-end adversarial tests and live content sourcing |
| Refund/change fee misstatements | Supplier fare rules, clear authorized service fees and agent support | Not implemented | Confirm accurate rules and escalation workflow |
| Fraud or incorrect booking details | Staff review identity-sensitive changes, verify passenger names/dates, authorized payment handling | No real payments | Manual approval and audit trail |
| Taxes/fees transparency | Customer sees accurate final payable amount plus any legally required disclosures | Live quote formatting not implemented | Review local/market requirements and provider contract |

## Priority 1 — Before unattended operations
| Risk | Required control | Current Nurgat status | Release gate |
| --- | --- | --- | --- |
| Automation failure | Internal failure logging and email alert with recovery process | Active, tested with controlled failure | Schedule review and notification delivery tests |
| Whole n8n outage | Independent monitoring not hosted on n8n | GitHub Actions reachability workflow tested manually after 401 fix | Verify scheduled run and authorized recipient alerts |
| Lost n8n access / expired plan | Owner credentials/2FA, off-platform encrypted workflow export, recovery drill | Owner reports ZIP backup secured; runbook prepared; restore not tested | Backup verification and separate non-production restore |
| n8n execution allowance or AI credit depletion | Real usage/credit sources, alerts and cost stop policy | Offline threshold suite only | Confirm real plan, verify usage metrics and budgets |
| Provider downtime / rate limits | Backoff, circuit breaker, no false booking promises, queue unresolved requests | No live provider | Simulated outage tests against approved integration |
| Gmail alerts failing | Independent alert channel or escalation; incident delivery reconciliation | Gmail send+receipt tested; six-hour recovery | Monitor Gmail bounce and alternate notification |
| Customer service unavailable | Human handoff with ownership, response hours, emergency escalation | Not launched | Uncle sets staff support schedule |

## Priority 2 — When provider and operations are ready
| Risk | Next step |
| --- | --- |
| Baggage allowance changes | Link answers to carrier and fare-specific official source; never guess |
| Visa/travel rules change | Refer to current official government/airline rules and qualified human assistance |
| Schedule change, cancellation or missed connection | Track provider notifications, contact client, follow fare rules and human handling |
| AI responds to irrelevant/general question | Ground common answers and clarify when information is missing |
| Poor logging privacy | Log only necessary error metadata, redact personal data, set retention policy |
| Unclear quote expiry | Include quote validity; revalidate before customer commitment |
| Scaling/10K n8n executions | Measure actual enquiries, messages, workflows and retry rates before upgrade |

## Source-derived observations
1. Amadeus says Flight Offers Price confirms availability and final price before booking. For production booking, a consolidator or ticket-issuing accreditation may be needed: https://github.com/amadeus4dev/developer-guides/blob/master/docs/resources/flights.md
2. Travelport TripServices AirPrice confirms itinerary price, and fare rules can include change/cancellation conditions: https://developer.travelport.com/docs/flights/guides/flights-pricing-guide and https://support.travelport.com/webhelp/JSONAPIs/Airv11/Content/Air11/Price/FareRulesGuide.htm
3. OWASP LLM threats include prompt injection, sensitive-information disclosure and unsafe downstream handling: https://genai.owasp.org/llmrisk/llm01-prompt-injection/ and https://owasp.org/projects/top-10-for-large-language-model-applications
4. n8n supports shared Error Trigger workflows but their scope depends on workflow execution failures: https://docs.n8n.io/build/flow-logic/handle-errors-gracefully
5. n8n Cloud workflow exports aren't full backups of credentials and external dependencies: https://support.n8n.io/article/migrating-from-cloud-to-self-hosted
6. Zambia's Data Protection Act 2021 regulates personal data processing and controller/processor duties. Determine applicability and compliance requirements with the authorized agency operator: https://zambialii.org/akn/zm/act/2021/3/eng%402021-03-24

## What is already built, versus what is still assumed
- Built and tested: offline flight validation (22), provider normalization (18), budget decision contract (18), demo pricing-output safety filter (9), error logging, Gmail alerts, six-hour recovery and daily snapshots.
- External monitoring: corrected Supabase 401 false-positive; manually passing run shown by user, not ongoing uptime guarantee.
- Not built: real GDS fares, verified customer quote rendering, live payments, production bookings, ticket issuance, general-information knowledge base, live cost quota enforcement, end-to-end owner browser test, independent full restoration.
- Neither this register nor a green unit test constitutes authorization to process live customer payments or issue tickets.

**Decision:** Do not build arbitrary new features while waiting for genuine API/provider dependencies. On GDS arrival, work from Priority 0 in order; keep real customer sending and ticketing disabled until the associated controls are verified.
