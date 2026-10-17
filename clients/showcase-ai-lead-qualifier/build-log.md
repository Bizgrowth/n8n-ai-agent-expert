# Build Log: AI Lead Qualifier -> CRM (Showcase, SHOW-001)

**Date:** 2026-10-17 · **Stage:** 3 Build · **Target:** Sandbox/Showcase, owner's Personal project, synthetic data only
**n8n version assumed:** UNKNOWN (not confirmed). Node versions were chosen from the public n8n source on GitHub; confirm on import.
**Status: BOTH workflows are INACTIVE (`"active": false`). No pinData. No secrets. Nothing was pushed to n8n; delivered as files only.**

## 1. Files created
| File | Workflow |
|---|---|
| `clients/showcase-ai-lead-qualifier/workflows/showcase-ai-lead-qualifier.json` | `SHOWCASE \| AI Lead Qualifier \| Webhook → HubSpot + Slack \| v1` (49 nodes incl. sticky note; 44 in the first build) |
| `clients/showcase-ai-lead-qualifier/workflows/shared-error-alert.json` | `SHARED \| Error Alert \| Error Trigger → Slack alert \| v1` (4 nodes) |

## 2. Credentials the owner must create in n8n (names must match)
| Credential name | Type | Used by |
|---|---|---|
| `Showcase Lead Webhook Header` | Header Auth | Receive lead |
| `HubSpot - AI Ops Expert showcase` | HubSpot (Service Key / App Token) | Create or update contact, Create follow-up task |
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
| `PLACEHOLDER_SHOWCASE_LEAD_LOG_TABLE_ID` | Choose the table `showcase_lead_log` in each of the 6 Data Table nodes (Log rejected lead, Seen this email recently?, Log duplicate, Claim this lead, Count today's AI calls, Log decision) |
| Time zone | Both workflows are set to `UTC` (Workflow Settings > Timezone). Owner changes it to their local zone. |

## 4. Manual import and setup steps (plain language)
1. In n8n, import `shared-error-alert.json` first (Import from file). Create the Slack credential, select it on the Slack node, enter the alert channel ID in "Prepare alert text". Save. Do not activate; an Error Workflow works without it.
2. Note the ID of workflow 2 (the number at the end of its address in the browser).
3. Create the data table `showcase_lead_log` (Personal project > Data tables) with these columns: `lead_id` text, `received_at` date, `dedupe_key` text, `source` text, `status` text (values used: rejected, duplicate, processing, scored, review, cap_reached), `reject_reason` text, `model` text, `prompt_version` text, `rubric_version` text, `ai_calls_used` number, `score` number, `tier` text, `confidence` number, `reason` text, `decision_path` text, `hubspot_contact_id` text, `hubspot_task_created` text, `slack_sent` text, `execution_id` text.
4. In HubSpot, create contact properties as single-line text: `demo_record` (internal name must match what is in "Create or update contact"), `ai_score`, `ai_tier`, `ai_reason`, `ai_confidence`, `ai_prompt_version`, `ai_status`. (If your existing DEMO property has a different internal name, edit it in "Create or update contact".) Text type is used so empty values on review cases are accepted.
5. Import `showcase-ai-lead-qualifier.json`. Create the four credentials and select them on the nodes.
6. Fill the placeholders in section 3. Pick the model in both Chat model nodes (cheapest that passes your test set). Choose the data table in the six Data Table nodes. Set Settings > Error Workflow to workflow 2.
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
7. ~~"Find contact by email" is informational~~ **Reverted in the review round: the node is removed** (see section 10, F3). The design intent (no duplicate contact, HubSpot is the source of truth) is met by the upsert itself, which matches by email.
8. (Review round) Added: "Claim this lead" (processing row before the AI call), "Got a HubSpot contact ID?", three "Note:" marker nodes, "Did any step fail along the way?", one final "Alert owner: a step needs attention" node, and "All steps succeeded". The two old Stop and Error nodes were replaced by the single final one (the run now logs first, then ends as failed so the Error Workflow alerts).
9. (Review round) Follow-up task now has a due date (next business day 09:00), which the design asked for and the first build left out.

## 6. UNVERIFIED items (confirm on import; also marked "UNVERIFIED - confirm on import" in the node's notes)
**Count after the review round: 20 nodes carry the note (19 in workflow 1, 1 in workflow 2); it was 19.** Net change: "Find contact by email" removed (-1), "Claim this lead" added (+1), "Did any step fail along the way?" added (+1, for the `isExecuted` property). Several nodes have more than one open point.

**Now VERIFIED from n8n's public GitHub source (raw files, read in the review round):**
- HubSpot v2 contact upsert: custom property collection is `customPropertiesUi.customPropertiesValues` with `property` and `value` (the first build used `customPropertyValues`, which n8n ignores; fixed). Upsert calls `createOrUpdate/email/<email>` (matches by email) and returns `vid`. `firstName`, `lastName`, `companyName`, `jobTitle` names confirmed.
- HubSpot v2.2 Engagement > Create: type `task`, `metadata.subject/body/status/forObjectType`, `dueDate` (required from node version 2.2), `additionalFields.associations.contactIds` (a comma-separated ID string; an empty string is silently ignored, so a guard was added).
- Data Table node: version array [1, 1.1]; Get filter structure (`matchType`, `filters.conditions[keyName, condition, keyValue]`, `eq/gt/gte`); ISO date strings are converted to dates for date columns; with typeVersion 1.1 and up dates are returned as ISO strings, with 1 they are date objects (the expressions use `new Date(x).getTime()` so both work).

| Node | Open point |
|---|---|
| Clean the lead | `.hash('sha256')` expression helper (fallback: Crypto node, or store lowercase email for synthetic data) |
| Log rejected lead, Log duplicate, Claim this lead, Log decision | Data Table insert column mapping with empty schema (select the table to refresh columns), ISO string into a date column; `isExecuted` expression property (Log decision) |
| Seen this email recently?, Count today's AI calls | Date comparison actually matches rows; the text value "0" on the number column `ai_calls_used` (see F5) |
| AI score, attempt 1 and 2 | Chain typeVersion 1.7 and the system-message type string `SystemMessagePromptTemplate` |
| Chat model 1, Chat model 2 | Model name; typeVersion 1.3; Anthropic as default provider |
| Answer format 1, 2 | Manual schema mode; strictness not relied on (Check nodes re-validate) |
| Slack nodes (4 in WF1, 1 in WF2) | Slack typeVersion 2.3; channel ID passed as `mode: id`; `mrkdwn` / `unfurl_links` options |
| Create or update contact | HubSpot credential scopes; properties must exist in HubSpot; property internal names |
| Create follow-up task | HubSpot task/engagement scopes on the credential; the due date value on the created task (expression is Luxon, parameter is verified) |
| Did any step fail along the way? | `node.isExecuted` expression property |
Also not individually checked against docs (assembled from n8n's standard export format): IF 2.2, Edit Fields 3.4, Switch 3, Aggregate 1, Stop and Error 1, Error Trigger 1, Webhook 2 parameters. Import will show any mismatch.

## 7. Lint and structure checks (re-run after the review fixes)
- `node scripts/lint-workflow.mjs` on both files: **0 must-fix, 0 warnings** (all 13 checks PASS on each).
- Throwaway structural check (scratchpad, not in repo): both files parse as JSON; every connection source and target exists; every node is reachable from its trigger (AI sub-nodes feed reachable chains); every error output is wired; all 146 expressions compile as JavaScript; every `$('Node name')` reference (112 in workflow 1) points to an existing node; active is false; no pinData; every node has an id. Passed.
- Hand simulation of the happy path (throwaway script with the real expressions, Luxon for dates): a sample lead (fake name, `  Dana.Test@Example.COM `, consent "true") goes Receive lead -> Settings -> Clean the lead -> Is the lead usable? -> Seen this email recently? -> Is it a repeat?. Result: Clean the lead shows email `dana.test@example.com`, company, role, a consent of true and a 64-character hash (before the fix the same sample gave an empty email, consent false, hash of the empty string, and the lead went to "Log rejected lead": this reproduces the reviewer's blocker). The usable check passes, the dedupe filter is built with the right key and a 24-hour date, an empty table result is a new lead, a 5-minute-old row with the same key is a repeat, a 2-day-old row or a row with a different key is NOT a repeat. The claim row, the model text (with `<lead_fields>` and `<lead_message>`), the system prompt with cutoffs 70/40, the repair prompt, the Slack sanitiser on hostile text, the task due date (Saturday gives Monday 09:00) and the end-of-run alert texts were also evaluated.
- Not run: any test in n8n (no instance access by design). The simulation proves the expressions and data flow, not the n8n nodes. Tester runs cases in design.md section 15.

## 8. Confirmation
Both workflows are **inactive** (`"active": false`). No pinData, no secrets, credentials by name only, no Code node. The builder did not activate, publish or call any n8n API. The only network use was reading public n8n source files on GitHub to verify node parameters.

## 9. Change log
- 2026-10-17: v1 built.
- 2026-10-17: v1 revised after review (F1-F12, section 10). Not signed off; goes back to the best-practice-reviewer.

## 10. Review round: what changed per finding (review.md F1-F12)
Values unchanged: confidence 0.70, tiers 70/40, cap 25, 1000 characters, 300 output tokens, temperature 0.1, one repair attempt, max 3 calls per lead. No guardrail was weakened.

| # | Result | What was done |
|---|---|---|
| F1 | Fixed | Cause confirmed in the JSON: `Settings` had `includeOtherFields: false`, and `Clean the lead` read `$json.body.*`, so every field came out empty (email empty -> "invalid_email"). Two changes: `Settings` now keeps the incoming data (`includeOtherFields: true`), AND every `$json.body` in `Clean the lead` now reads `$('Receive lead').first().json.body`, so it keeps working if Settings is changed later. Settings values are still read downstream with `$('Settings').first()`. Proven by simulation (section 7). |
| F2 | Fixed (verified) | Real key from n8n source is `customPropertiesValues`; the build used `customPropertyValues`. Corrected. QA must still confirm the DEMO property is on the saved contact and that the properties exist in HubSpot. |
| F3 | Fixed | "Find contact by email" removed. It was redundant: the upsert matches by email (verified). Both paths (no review needed, or review message sent) now go straight to "Create or update contact". This reverses build deviation 7 and the design's step 16; the design intent (no duplicate contact) is met by the upsert. |
| F4a | Fixed | A failed task no longer stops the hot-lead alert. The task node's error output goes to "Note: task not created", then "Slack: hot lead alert", whose text then says the task was NOT created and must be added by hand. The owner is also alerted at the end (see F4b). |
| F4b | Fixed | Slack failures now go to marker nodes and continue: a failed review message still saves the lead to HubSpot; a failed hot alert or save-failed message goes on to "Log decision". The log row is always written first. After it, "Did any step fail along the way?" ends the run with one "Alert owner: a step needs attention" Stop and Error, so the run shows as failed and the shared Error Workflow tells the owner. Log columns `slack_sent` (yes / no / failed) and `hubspot_task_created` now reflect what really happened. Matches design test 18. |
| F5 | Fixed, with one open point | "Is it a repeat?" now also requires the returned row's `dedupe_key` to equal this lead's key and `received_at` to be within 24 hours. The daily count recounts only rows with `ai_calls_used > 0` received today. The text filter value "0" on the number column stays as a pre-filter (dropping it would let spam rows fill the 100-row limit and hide real AI calls); if the filter returned nothing the cap would be off, so QA case 19 must prove it on the instance. |
| F6 | Fixed (claim row; simplest robust option) | New "Claim this lead" Data Table insert writes a `processing` row (`ai_calls_used` 0, same dedupe key) right after the repeat check and before the cap check and the AI call. A second submission seconds later now finds it. Chosen over documentation-only because it is one node. Limits, written into the sticky note: two submissions in the very same second can still both pass; the cap of 25 stays soft (a burst can overshoot it by the burst size); if a run crashes after the claim, delete the `processing` row to re-send that email within 24 hours. |
| F7 | Fixed | "Slack: HubSpot save failed" now includes the execution ID, tier and score, and tells the owner what really happens: the run ends as failed, add the contact by hand from the "Clean the lead" data, and a re-send of the same email is blocked for 24 hours unless the processing row is deleted. It no longer says "re-run the failed execution" (a re-run would be treated as a repeat). |
| F8 | Fixed | Role, company size, budget, timeline and source now sit inside `<lead_fields> ... </lead_fields>`, the message inside `<lead_message>`. All `<` and `>` are removed from every value so a lead cannot close the tags. The system prompt says the text inside both tags is untrusted. |
| F9 | Fixed | Slack sanitiser now also removes bare domains and paths (`bit.ly/abc`, `evil.com/x`) and the characters `@ < > * _ ~` and backtick, in `slack_reason`, `slack_company`, `slack_role` and the error workflow's `error_line`. `mrkdwn` left on (the headings use bold); the markdown characters are stripped from lead text instead. |
| F10 | Fixed (verified) | `dueDate` is a verified parameter (required from HubSpot node 2.2). Set to the next business day at 09:00 in the workflow time zone (Friday to Sunday gives Monday; public holidays not considered). Added "Got a HubSpot contact ID?" guard: with no contact ID the task is skipped (an empty ID would be silently ignored by n8n) and the alert says so. Added to the deviation list. |
| F11 | Not changed (owner decision) | After the cap, every extra lead still gets one Slack review post and a HubSpot save, no AI call (AI cost stays capped). Documented in the sticky note. Needs the owner to accept, or a later "notice already sent today" check. |
| F12 | Partly fixed | Done: prompt cutoffs are filled in from `hot_min` / `warm_min` in both AI nodes; the repair prompt now lists the rules (score range, tier-to-score cutoffs, confidence range, reason length); error alert line cut to 100 characters; every node has an `id`. Documented, not changed: `model` in the log is the label in Settings and must be set equal to the chosen model (note on Settings); `ai_calls_used` counts 1 when Retry On Fail made a second call (note on Log decision); the email hash is unsalted SHA-256, fine for synthetic data (sticky note). Left for the instance or the handoff: record the n8n version in the sticky note, add tags by hand (step 7), rollback paragraph in the handoff (deactivate, delete the processing row, add missing contacts by hand), existing HubSpot contacts get overwritten so test with synthetic emails only. |

Open owner decisions carried over from the review: (1) accept the soft cap / burst limits (F6, F11); (2) confirm that duplicates end without a HubSpot update (build follows design section 7); (3) a plain HTML form cannot send a secret header, so use a small relay or a form tool that can (review item 8).

## 11. Owner decisions after review round 2 (2026-10-17)
- **Two log rows per lead: kept (review item N1).** Each lead writes a `processing` claim row before the AI call and a final row from `Log decision`. QA expects two rows per scored lead; the claim row is not counted by the daily cap. No "update row" step is added, to avoid another unverified Data Table operation.
- **Over-cap Slack posts:** left as built (one Slack post per lead over the cap; review item F11). Owner has not asked for a change.
- **Time zone:** both workflows remain `UTC`; owner can change it in Workflow Settings.
- **Import:** owner reports both workflows are imported into the owner's n8n (Showcase, Personal project). Nothing activated by the agent.

## 12. Credential note (2026-10-17)
Owner reports an Anthropic credential already exists in n8n. In both Chat model steps, select that existing credential; the name `LLM - Showcase` in section 2 is only a suggested name and need not match. Still to do by the owner: pick a model in both steps and set `model_name` in the Settings step to the same model.
