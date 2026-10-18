# Push to the n8n instance (2026-10-18)

Pushed as inactive drafts to the owner's personal project. Nothing was published or activated.

| Item | n8n ID | State |
|---|---|---|
| SHARED \| Error Alert \| Error Trigger → Slack alert \| v1 | `1ZpaprQSkOzGuuWv` | Created, inactive, settings applied (UTC, 120 s timeout, save all executions). Not published. |
| SHOWCASE \| AI Lead Qualifier \| Webhook → HubSpot + Slack \| v1 | `e2RDk3RM3YgwnHyI` | Created, inactive. 48 nodes + sticky note, all 61 connections wired from the repo JSON, settings applied (UTC, 180 s timeout, save all executions). Error Workflow not set (see below). |
| Data table `showcase_lead_log` | `9A8t6mQGHxKti1Xj` | Created with the 19 columns from design.md section 13. Placeholder table ID replaced in the six Data Table nodes. |

The repo JSON files are unchanged and remain the source of truth. The instance copy differs only in the data table ID and the Error Workflow setting.

## Test run 1 (manual mode, synthetic data): unusable lead

Execution `1`, status Success. Path: Receive lead, Settings, Clean the lead, Is the lead usable? (false), Log rejected lead.
- Row written to `showcase_lead_log`: status `rejected`, reason `invalid_email`, `ai_calls_used` 0. This synthetic row (id 1) is still in the table; delete it before real use.
- `.hash('sha256')` works on this n8n version (64-character `dedupe_key`). This closes open point E3 in test-report.md.
- The Data Table insert with an empty column schema works (row written, columns mapped).

## Test run 2 (manual mode, synthetic data): repeat submission

A synthetic `processing` row (lead `L-QA-SEED-01`, id 2) was seeded in the data table with the fingerprint of `qa-repeat-01@example.com`. Execution `2` then submitted that email.
- Status Success. Path: Receive lead, Settings, Clean the lead, Is the lead usable? (true), Seen this email recently?, Is it a repeat? (true), Log duplicate.
- The lookup found the seeded row, so the table filter on the fingerprint (`eq`) and the 24-hour window (`gte`) both work on real rows. Row id 3 (status `duplicate`) was written. No AI, Slack or HubSpot node ran.
- Still untested: `limit 1` with two rows per key, and the text value "0" filter on `ai_calls_used` (the daily cap).

These are builder smoke tests, not the independent QA sign-off. The qa-tester still owns test-report.md and Gate 2.

Synthetic rows to delete before real use: ids 1, 2 and 3 in `showcase_lead_log`.

Not yet run: every path that needs the AI model, Slack or HubSpot. These need the credentials below.

## Open items

1. **Webhook authentication.** n8n reports "No credentials required for this webhook" for Receive lead, because the credential "Showcase Lead Webhook Header" does not exist yet. After creating it, open the Receive lead node and select it. Do not activate before this is done.
2. **Credentials (owner creates in n8n):** Showcase Lead Webhook Header, Slack - AI Ops Expert, HubSpot - AI Ops Expert showcase, LLM - Showcase. Then fill the PLACEHOLDER values in build-log.md section 3.
3. **Error Workflow (owner decision).** n8n will not accept the shared Error Alert as the Error Workflow until it has a published version. Publishing is the owner's step. After that, set it under the lead qualifier's Settings > Error Workflow.
4. **Remaining test cases** from test-script.md, once credentials exist.
