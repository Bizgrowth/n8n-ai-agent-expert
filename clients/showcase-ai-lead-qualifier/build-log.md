# Build Log: AI Lead Qualifier -> CRM (Showcase, SHOW-001)

**Date:** 2026-10-17 · **Stage:** 3 Build · **Target:** Sandbox/Showcase, owner's Personal project, synthetic data only
**n8n version assumed:** UNKNOWN (not confirmed). Node versions were chosen from the public n8n source on GitHub; confirm on import.
**Status: BOTH workflows are INACTIVE (`"active": false`). No pinData. No secrets. Nothing was pushed to n8n; delivered as files only.**

## 1. Files created
| File | Workflow |
|---|---|
| `clients/showcase-ai-lead-qualifier/workflows/showcase-ai-lead-qualifier.json` | `SHOWCASE \| AI Lead Qualifier \| Webhook → HubSpot + Slack \| v1` (44 nodes incl. sticky note) |
| `clients/showcase-ai-lead-qualifier/workflows/shared-error-alert.json` | `SHARED \| Error Alert \| Error Trigger → Slack alert \| v1` (4 nodes) |

## 2. Credentials the owner must create in n8n (names must match)
| Credential name | Type | Used by |
|---|---|---|
| `Showcase Lead Webhook Header` | Header Auth | Receive lead |
| `HubSpot - AI Ops Expert showcase` | HubSpot (Service Key / App Token) | Find contact, Create or update contact, Create follow-up task |
| `Slack - AI Ops Expert` | Slack (access token) | all Slack nodes in both workflows |
| `LLM - Showcase` | Anthropic API (default; swappable) | Chat model 1, Chat model 2 |

The files hold credential names only. After import, open each node that shows a credential warning and select the credential.

## 3. Placeholders to fill
| Placeholder | Where |
|---|---|
| `PLACEHOLDER_ERROR_ALERT_WORKFLOW_ID` | Workflow 1 > Settings > Error Workflow (set to workflow 2 after importing it) |
| `PLACEHOLDER_RANDOM_WEBHOOK_PATH` | Receive lead > Path (use a long random string) |
| `PLACEHOLDER_SLACK_HOT_CHANNEL_ID`, `PLACEHOLDER_SLACK_REVIEW_CHANNEL_ID`, `PLACEHOLDER_HUBSPOT_PORTAL_ID`, `PLACEHOLDER_MODEL_NAME` (label only) | Workflow 1 > Settings node |
| `PLACEHOLDER_MODEL_NAME` | The two Chat model nodes (the real model choice) |
| `PLACEHOLDER_SLACK_ALERT_CHANNEL_ID` | Workflow 2 > Prepare alert text |
| `PLACEHOLDER_SHOWCASE_LEAD_LOG_TABLE_ID` | Choose the table `showcase_lead_log` in each of the 5 Data Table nodes |
| Time zone | Both workflows are set to `UTC` (Workflow Settings > Timezone). Owner changes it to their local zone. |

## 4. Manual import and setup steps (plain language)
1. In n8n, import `shared-error-alert.json` first (Import from file). Create the Slack credential, select it on the Slack node, enter the alert channel ID in "Prepare alert text". Save. Do not activate; an Error Workflow works without it.
2. Note the ID of workflow 2 (the number at the end of its address in the browser).
3. Create the data table `showcase_lead_log` (Personal project > Data tables) with these columns: `lead_id` text, `received_at` date, `dedupe_key` text, `source` text, `status` text, `reject_reason` text, `model` text, `prompt_version` text, `rubric_version` text, `ai_calls_used` number, `score` number, `tier` text, `confidence` number, `reason` text, `decision_path` text, `hubspot_contact_id` text, `hubspot_task_created` text, `slack_sent` text, `execution_id` text.
4. In HubSpot, create contact properties as single-line text: `demo_record`, `ai_score`, `ai_tier`, `ai_reason`, `ai_confidence`, `ai_prompt_version`, `ai_status`. (If your existing DEMO property has a different internal name, edit it in "Create or update contact".) Text type is used so empty values on review cases are accepted.
5. Import `showcase-ai-lead-qualifier.json`. Create the four credentials and select them on the nodes.
6. Fill the placeholders in section 3. Pick the model in both Chat model nodes (cheapest that passes your test set). Choose the data table in the five Data Table nodes. Set Settings > Error Workflow to workflow 2.
7. Add tags by hand: workflow 1 `showcase`, `SHOW-001`, `draft`; workflow 2 `shared`, `SHOW-001`, `draft`. (Tags were left out of the JSON on purpose; they need IDs that only exist on the instance.)
8. Set a monthly spend limit at the AI provider, and a short execution-data retention on the instance.
9. Do not activate. QA (separate tester) runs next.

## 5. Notes on how the build follows the design
- Review message is a plain Slack message (owner choice). No Send and Wait.
- AI step is a fixed chain: Basic LLM Chain + Structured Output Parser, one repair attempt (attempt 2), temperature 0.1, max 300 output tokens, no agent, no memory, no tools. Anthropic is a **swappable default** because the owner has not chosen a provider.
- Only role, company size, budget, timeline, source and the truncated message go to the model. No name, email, phone or company name.
- Slack text never contains the raw message or the email. The AI reason is cut to 200 characters with links and @ mentions removed using an expression (no Code node). Company and role text is cleaned the same way (80 chars).
- Every Data Table, Slack, HubSpot and AI node has Retry On Fail and/or an On Error choice; every error output is wired (to the repair attempt, to review, to a "Slack: HubSpot save failed" message, to Stop and Error alerts, or to a harmless "Ignore log failure" end for log-only writes).
- **No Code node is used.**

### Deviations from design.md (small, for the reviewer)
1. Step 5 uses Data Table **Get + IF ("Is it a repeat?")** instead of "If Row Exists", so both outcomes (repeat / new) can be routed.
2. The AI-limit Slack notice (6b) is merged into "Slack: needs your review" (message says "Daily AI limit reached"); there is no separate once-per-day notice.
3. Added helper nodes: "Combine today's rows" (Aggregate), "Accept answer 1/2", "Mark: ..." and "Decision record" (Edit Fields) so every path produces one record that the later steps read.
4. HubSpot failure sends a "HubSpot save failed" Slack message, then still writes the log row.
5. Time zone is `UTC` at workflow level, not a placeholder (an invalid zone name could break import). The owner changes it.
6. Dedupe key is a SHA-256 hash made with an expression; rejected and duplicate log rows store no dedupe key (so a rejected lead is not later mistaken for a repeat).
7. "Find contact by email" is informational (the Create or update step also matches by email).

## 6. UNVERIFIED items (confirm on import; also marked "UNVERIFIED - confirm on import" in the node's notes)
Verified from n8n's public GitHub source: node type strings and version arrays for Data Table (1/1.1), Basic LLM Chain (1 to 1.9), Anthropic chat model (1 to 1.6), Structured Output Parser (1 to 1.3, manual schema), Slack (2 to 2.7), HubSpot (2 to 2.2), Slack send parameters (`select`, `channelId`, `text`, `otherOptions`), HubSpot credential `hubspotAppToken`, contact upsert `email` and `additionalFields` names. Everything below could not be fully verified. Count: **19 nodes** carry the note (18 in workflow 1, 1 in workflow 2); several have more than one open point.
| Node | Open point |
|---|---|
| Clean the lead | `.hash('sha256')` expression helper (fallback: Crypto node, or store lowercase email for synthetic data) |
| Log rejected lead, Log duplicate, Log decision | Data Table insert column mapping with empty schema (select the table to refresh columns), ISO string into a date column; `isExecuted` expression property (Log decision) |
| Seen this email recently?, Count today's AI calls | Data Table filter structure and operators (`eq`, `gt`, `gte`), date comparison |
| AI score, attempt 1 and 2 | Chain typeVersion 1.7 and the system-message type string `SystemMessagePromptTemplate` |
| Chat model 1, Chat model 2 | Model name; typeVersion 1.3; Anthropic as default provider |
| Answer format 1, 2 | Manual schema mode; strictness not relied on (Check nodes re-validate) |
| Slack nodes (4 in WF1, 1 in WF2) | Slack typeVersion 2.3; channel ID passed as `mode: id` |
| Find contact by email | HubSpot search filter syntax |
| Create or update contact | Custom property parameter name and matching by email; properties must exist |
| Create follow-up task | Engagement > Create as task, metadata fields, due date (not set), task scopes; fallback: HTTP Request with the same credential |
Also not individually checked against docs (assembled from n8n's standard export format): IF 2.2, Edit Fields 3.4, Switch 3, Aggregate 1, Stop and Error 1, Error Trigger 1, Webhook 2 parameters. Import will show any mismatch.

## 7. Lint and structure checks
- `node scripts/lint-workflow.mjs` on both files: **0 must-fix, 0 warnings** (all [must] pass, including Error Workflow placeholder in workflow 1).
- Throwaway check (not in repo): both files parse as JSON, every connection target exists, every node is reachable, every error output is wired, all expressions are valid JavaScript syntax. Passed.
- Not run: any test in n8n (no instance access by design). Tester runs cases in design.md section 15.

## 8. Confirmation
Both workflows are **inactive**. The builder did not activate, publish or call any n8n API.

## 9. Change log
- 2026-10-17: v1 built.
