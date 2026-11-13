# Nurgat Tours — Account Loss, Backup & Recovery Runbook
**Prepared:** 2026-11-13. **Status:** Recovery documentation complete; external reachability workflow installed; **owner-held export and restoration drill still required**.

> Keep this document free of authentication tokens, credentials, customer records, and nonpublic webhook payloads. This is a PUBLIC GitHub repository. Do NOT commit complete n8n exports, secrets, credential configuration, or real customer data here.

## Ownership and first response

**Authorized adult operator / uncle** must control official n8n Cloud and Google business account ownership, recovery contacts, 2FA, billing and access permissions. Keep recovery codes in a dedicated secure password manager, **not** GitHub or n8n. Check that at least one other authorized recovery path exists where vendor policy permits.

If an automation stops: (1) check the external reachability workflow status in GitHub Actions; (2) log in to n8n and inspect failed executions; (3) confirm Gmail credential and notifications; (4) pause only affected operations when needed; (5) restore from the most recent verified safe backup; (6) run controlled non-customer test cases before reactivation. Do not assume failed bookings, messages or payments can be blindly retried: first check if the external side effect actually occurred.

If account access is lost: use official account recovery through the owner, not a shared password. Contact n8n Cloud Support when needed. While access is unavailable, inform the agency operator that automatic workflow-based monitoring may also be unavailable. Our GitHub reachability checker is independent of n8n but cannot repair it.

## Owner action — obtain a real workflow backup

The n8n Cloud **instance owner** can use **Cloud console → Export → select available backup date → Download workflows**. The n8n Cloud Help Center confirms workflow backup JSON can be downloaded even if the instance itself is stopped. Individual workflows can also be downloaded from the editor menu. Source: https://support.n8n.io/article/how-to-export-workflows-from-the-n-8-n-cloud-admin-panel .

**Important:** this MCP connection can inspect workflow metadata and definitions but has no supported owner-level bulk backup/export function. A workflow list in this runbook is **NOT** a usable restoration archive. We have **not** downloaded an owner-held export in this step.

Owner securely store **two independently controlled encrypted copies** of the actual exported JSON outside n8n, verify the backup's date and workflow count, and schedule periodic new exports (for example, after major workflow edits). The public GitHub repository is NOT an appropriate place for these copies. Downloaded backups may not include changes made since the selected backup.

n8n notes that moving workflows to another environment also requires credentials and environment configuration to be recreated. Do **not** expect Gmail OAuth, Google Sheets OAuth, n8n internal Data Tables, executions, webhook base URLs, Supabase connections, or stored AI Gateway state to be restored automatically from workflow JSON. Source: https://support.n8n.io/article/migrating-from-cloud-to-self-hosted .

## Current recovery inventory (2026-11-13)

n8n instance: `https://nurgattourszm.app.n8n.cloud`  
n8n project: `QAMemlGB8a2W38dU`  
Detected workflow count: **21** (includes inactive/offline demo/test workflows; archived workflows may not appear in this listing).

| Workflow | n8n ID | Audit state |
|---|---|---|
| Nurgat Tours — AI Customer Receptionist | `wrL9GFoE4I9YObIa` | Inactive / offline |
| Nurgat Tours — AI Flight Specialist | `Kt0upu2aOsMeANhV` | Active |
| Nurgat Tours — Amadeus Self-Service Safety Tests (OFFLINE) | `EYwrZT4WjPwEiVoF` | Inactive / offline |
| Nurgat Tours — Approval Policy Lab (OFFLINE) | `VwmNsiq5TDYPNk4O` | Inactive / offline |
| Nurgat Tours — CEO AI Bridge (DEMO ONLY) | `5gtdDG3vq2JBFQxB` | Active |
| Nurgat Tours — CEO AI Special Requests (OFFLINE) | `d1tgjYsIAZN43LBa` | Inactive / offline |
| Nurgat Tours — Daily Reliability Snapshots | `OiuR7XhPWq6GSh0J` | Active |
| Nurgat Tours — Failure Email Draft Preview (NO SEND) | `XZpnL5Acte3wbkx1` | Inactive / offline |
| Nurgat Tours — Flight Comparison Lab | `V69aHXxrdbp9u436` | Active |
| Nurgat Tours — Flight Intake Safety Tests (OFFLINE) | `BM5L4LLM24HcvSy9` | Inactive / offline |
| Nurgat Tours — Flight Request Validation Gate (DEMO ONLY) | `PiXTI0iGQc3J1hqi` | Inactive / offline |
| Nurgat Tours — GDS API Preparation Lab | `7J5iq2NxS3SYvcBu` | Inactive / offline |
| Nurgat Tours — GDS Safety Contract Tests | `4H2V18uo1iiVATt7` | Inactive / offline |
| Nurgat Tours — Global Failure Logger | `ZAxm8dI81QMZYT8u` | Active |
| Nurgat Tours — Integration Test | `eAh9JW1q2UUs99OQ` | Inactive / offline |
| Nurgat Tours — Pending Failure Alert Recovery | `ID2H2sN9gEwuFvKp` | Active |
| Nurgat Tours — Provider Adapter Contract (INTERNAL DEMO ONLY) | `D8fNN8td7kHKeUNK` | Inactive / offline |
| Nurgat Tours — Reliability Health Check (MANUAL) | `LsCEPhu6meQ5uuAe` | Inactive / offline |
| Nurgat Tours — Universal Flight Provider Normalizer (OFFLINE) | `EWUXSBU141ftPm6y` | Inactive / offline |
| Nurgat Tours — Usage Budget Decision Gate (OFFLINE) | `p5Y1c8LtdkUdfnrA` | Inactive / offline |
| Nurgat Tours — Usage Budget Threshold Tests (OFFLINE) | `Rc1QgmHkXJa3xyxK` | Inactive / offline |

**Important private n8n Data Tables (contents need separate authorized export):**
- `AhWaVJFhPS7Non4Y` — Automation Failure Log; columns: detected_at, workflow_id, workflow_name, execution_id, error_type, error_summary, status, notification_state, notification_message_id, notification_sent_at.
- `vFF80c81c9xNM3LK` — Daily Reliability Snapshots; columns: checked_at, status, total_recorded, failures_24h, open_incidents, known_tests, monitoring_scope.
- `JmX49Qxw2ZfOcfk7` — Approval Queue (DEMO ONLY): contains business-process schema, keep data private.

Credentials observed by **type only:** `gmailOAuth2` and `googleSheetsOAuth2Api`. Actual secrets inaccessible and intentionally not included. Reauthorize with each account owner after restore.

**Separate Supabase project:** `ysakhagnlmhwbbmetjjc`. Its database, authentication, RLS policies, Edge Function and data must be recovered with a **separate Supabase owner-approved backup and recovery plan**; the GitHub static site is not a database backup.

**Static CEO demo:** `https://junaid-nurgat.github.io/nurgat-command-centre/`; source: `Junaid-Nurgat/nurgat-command-centre`. Public repository contains demo source and documentation only.

## External reachability monitor (outside n8n)

GitHub Actions workflow: `.github/workflows/external-reachability.yml`, manually runnable or intended for every **30 minutes** (minute 17 and 47, UTC). It checks:
1. Public n8n Cloud web interface URL (platform reachability only).
2. Public CEO GitHub Pages website.
3. Public Supabase Auth health endpoint.

A failed curl causes a **failed GitHub Actions run**, visible in the repository **Actions** tab. Configure **GitHub Actions failure notifications** for the authorized adult operator and verify with a deliberate controlled failure on a separate test configuration. This workflow cannot confirm actual login, internal workflow success, Gmail delivery, AI accuracy, remaining credits, or real GDS availability.

**Not yet verified:** a completed scheduled GitHub Actions run or a human receiving GitHub's failure notification. Scheduled jobs can be delayed/dropped and are disabled after inactivity in a public repository. GitHub's own outages or disabled Actions also stop this independent monitor. It is a supplementary early-warning layer, not an SLA-grade service. Sources: https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows and https://docs.github.com/en/actions/how-tos/troubleshoot-workflows .

## Controlled restoration drill checklist (owner supervision)

1. Confirm **written authorization**, test environment and backup restore date; never overwrite existing live data.
2. Verify JSON parses and expected workflow IDs/names are present. Restore to a **separate empty test environment** where available, not directly into live production.
3. Establish the required table definitions and safe test data, **without** importing production personal information.
4. Reconnect Google OAuth credentials with approved agency accounts; record where new credential IDs differ.
5. Validate Supabase project, protected RPCs, RLS, Edge Function authorization and approved origin configuration.
6. Update callback URLs/webhook addresses and secrets using authorized secure configuration, never public source.
7. Run offline test suites: flight intake **22**, provider normalization **18**, budget threshold **18**. Check central failure logging and Gmail **without** triggering customer messages.
8. Enable only intended workflows after validation, confirm one safe test alert, and sign off together with the authorized operator.
9. Document restoration duration, unresolved blockers and next backup date.

## Remaining limitations

- Owner-held workflow export: **not performed**, requires n8n Cloud owner.
- Independent external monitor: **file committed**, but scheduled execution and notification delivery unverified.
- True automated off-platform, encrypted workflow+credential backup: **not built**; requires a private authorized destination and owner-grade export permissions.
- Real Amadeus/Travelport access and production authorization: **pending**.
- Credit and usage limit enforcement: **pending verified billing integrations**.
