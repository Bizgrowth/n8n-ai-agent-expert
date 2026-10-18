# Push to the n8n instance (2026-10-18)

Pushed as inactive drafts to the owner's personal project. Nothing was published or activated.

| Item | n8n ID | State |
|---|---|---|
| SHARED \| Error Alert \| Error Trigger → Slack alert \| v1 | `1ZpaprQSkOzGuuWv` | Created, inactive. Settings applied (UTC, 120 s timeout, save all executions). Not published. |
| SHOWCASE \| AI Lead Qualifier \| Webhook → HubSpot + Slack \| v1 | `e2RDk3RM3YgwnHyI` | Created, inactive, 48 nodes plus the sticky note. **Connections not wired yet and workflow settings not applied** (the n8n connection dropped before that step). |
| Data table `showcase_lead_log` | `9A8t6mQGHxKti1Xj` | Created with the 19 columns from design.md section 13. Placeholder table ID replaced in the six Data Table nodes. |

## Why it is not finished

1. The instance would not accept the first create because the data table did not exist. Fixed by creating it.
2. The instance refuses to set the shared Error Alert as the Error Workflow until that workflow has a published version. Publishing is the owner's step, so the Error Workflow is left unset.
3. The n8n connection dropped (502) before the wiring step.

## Steps still to do

1. Apply `instance-wiring-ops.json` (61 `addConnection` operations, copied from the repo JSON) to workflow `e2RDk3RM3YgwnHyI`, together with these settings: executionOrder v1, timezone UTC, executionTimeout 180, save data on error and success = all, save manual executions = true, save execution progress = false.
2. Owner: create the credentials (Showcase Lead Webhook Header, Slack - AI Ops Expert, HubSpot - AI Ops Expert showcase, LLM - Showcase) and fill the PLACEHOLDER values listed in build-log.md section 3.
3. Owner decision: publish the shared Error Alert, then set it as the Error Workflow of the lead qualifier.
4. Clean test run in manual mode with synthetic data. The unusable-lead path needs no app credentials, so it can run first: it goes Receive lead, Settings, Clean the lead, Is the lead usable? (false), Log rejected lead.

The repo JSON files are unchanged and remain the source of truth.
