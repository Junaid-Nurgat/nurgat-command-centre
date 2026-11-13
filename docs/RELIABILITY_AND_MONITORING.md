# Nurgat Tours — Reliability and Monitoring Status

Updated: 2026-11-13. Internal demo operations only.

## Working now
- Active Global Failure Logger n8n workflow `ZAxm8dI81QMZYT8u`.
- Configured active workflows:
  - CEO AI Bridge `5gtdDG3vq2JBFQxB`
  - AI Flight Specialist `Kt0upu2aOsMeANhV`
  - Flight Comparison Lab `V69aHXxrdbp9u436`
- Private n8n Data Table `Nurgat Tours — Automation Failure Log` stores workflow identifiers, execution identifiers, timestamps and sanitized error summaries without customer payloads.
- Manual Reliability Health Check `LsCEPhu6meQ5uuAe` verifies open incidents and known test failures.
- Active scheduled Daily Reliability Snapshots `OiuR7XhPWq6GSh0J`, daily **08:00 Africa/Lusaka**; stores snapshots in the private `Nurgat Tours — Daily Reliability Snapshots` table. Confirmed manual execution `69` successfully saved a row.
- Intentional invalid-token test run `56` has been correctly tagged `TEST_EVENT`; neither the manual nor scheduled report needs any hard-coded test execution ID. Last manual report execution `68` shows 0 unreviewed recorded incidents.

## Important limitations
- Reports cover **only workflow errors emitted by the three connected n8n production workflows**. Not a global incident detection system.
- No email or WhatsApp notification is configured. A saved failure or daily snapshot does **not** deliver a real-time alert to anyone.
- No direct read of n8n account execution quota, AI Gateway credit balance or API billing. These values **cannot** be inferred from workflow error logs. No automatic 70/85/95% usage alerts are active.
- A sudden total n8n service outage could prevent the scheduled monitor from running, so the system is not a substitute for provider status monitoring.
- The daily snapshot uses one execution/day (plus any follow-on executions); check actual account limits before operational use.
- Do not treat this monitoring system as production-ready until validated notifications, account quotas, alert ownership, and response procedures are configured.

## Required next steps
1. Confirm the agency-admin email and an authorized, dedicated notification credential; send an alert to that address only after authorization and a safe test.
2. Confirm n8n subscription execution allocation, billing cycle, available API for checking usage, and AI Gateway credit allowance; set verified thresholds and an operational fallback.
3. Connect external uptime monitoring for n8n and Supabase if production service continuity matters.
4. Record a response procedure for failure events and assign incident responsibility to adult business administrators.
5. Review upstream workflow validation warnings and test recoverability in an authorized sandbox.

No real customer data, payment credentials, GDS keys, or private API keys are contained in this document.

## Update — November 13, 2026: Active Gmail alerts

The earlier statement that email delivery was not configured is superseded by this update:

- A Gmail OAuth credential is connected in the n8n project. The Global Failure Logger now sends sanitized administrator-only failure emails after recording the error, and stores Gmail message receipt IDs in the private failure log.
- Actual agency-inbox email send verified in execution **77**. Production-mode failure-to-log-to-email-to-receipt verified by CEO AI Bridge execution **79** and logger execution **80**. Both are controlled tests, not actual service incidents.
- A separate active Pending Failure Alert Recovery workflow (`ID2H2sN9gEwuFvKp`) checks every six hours for failure rows with `notification_state=PENDING`; empty queue verified in execution **82** and synthetic recovery logic in **83**.
- Daily Reliability Snapshots remain active at 08:00 Africa/Lusaka.
- **Still not enabled:** real n8n plan execution quota reads, AI Gateway credit tracking, spending enforcement, bounced-mail alerting, and general platform outage monitoring.

For full audit, see [Pre-Approval Build Handoff](PRE_APPROVAL_HANDOFF.md).
