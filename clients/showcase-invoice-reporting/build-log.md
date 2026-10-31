# Build Log: Invoice & Reporting (Showcase, SHOW-002)

**Date:** 2026-10-31 · **Stage:** 3 Build · **Target:** Sandbox/Showcase on the owner's own n8n (instance/project not named in the request; confirm on import), synthetic data only
**Design built:** `design.md` as revised, Gate 1b approved 2026-10-31, plus the nine step cards and the five reviews.
**n8n version assumed:** UNKNOWN (`PLACEHOLDER_N8N_VERSION_AND_EDITION`). The n8n MCP is not connected and no instance was reachable, so **no `typeVersion` was verified against an instance or the docs in this build**. Versions were chosen from the builder's knowledge of the n8n source (same method as SHOW-001) and every node says "Verify on import" in its notes. Take the real version from the node panel on your instance.
**Status: ALL THREE workflows are INACTIVE (`"active": false`). No pinData. No secrets. Nothing was pushed to n8n; delivered as files only. Not reviewed and not tested by the builder.**

## 1. Files created
| File | Workflow | Nodes |
|---|---|---|
| `clients/showcase-invoice-reporting/workflows/showcase-invoice-reporting-w1-weekly-report.json` | W1 `SHOWCASE \| Invoice & Reporting \| Schedule → Weekly report + summary \| v1` | 90 (incl. 1 sticky note) |
| `clients/showcase-invoice-reporting/workflows/showcase-invoice-chase-w2-daily-scan.json` | W2 `SHOWCASE \| Invoice Chase \| Schedule → Overdue scan + approval requests \| v1` | 44 |
| `clients/showcase-invoice-reporting/workflows/showcase-invoice-chase-w3-approve-and-send.json` | W3 `SHOWCASE \| Invoice Chase \| Execute Workflow → Approve and send one reminder \| v1` | 25 |
| `clients/showcase-invoice-reporting/test-data/` | synthetic data set (see section 9) | 9 CSV files, 12 variant CSV files, README, expected figures |

The shared error alert is **reused, not duplicated**: `clients/showcase-ai-lead-qualifier/workflows/shared-error-alert.json` (`SHARED | Error Alert | Error Trigger → Slack alert | v1`) is the only alert workflow. No file for it was created here.

## 2. Credentials the owner must create in n8n (names must match; values only inside n8n)
| Credential name | Type | Used by |
|---|---|---|
| `Google Sheets - AI Ops Expert showcase` | Google Sheets OAuth2 (needs the Google Sheets API **and** Drive API enabled in your own Google Cloud project on self-hosted) | all Sheets nodes in W1, W2, W3 |
| `Gmail - AI Ops Expert showcase` | Gmail OAuth2 (Gmail API enabled) | W1 report email; W3 approval request, reminder send, decline draft |
| `Slack - AI Ops Expert` | **Existing** (SHOW-001). The JSON uses access-token authentication like SHOW-001; if your credential is OAuth2, change the Authentication field on the Slack node | W1 summary (and the shared alert) |
| `LLM - Showcase` | **Existing** Anthropic credential (SHOW-001). Select your existing credential even if its name differs | W1 two Anthropic model nodes |

Google OAuth app status (decision still open, see section 8): "External" + "Testing" tokens expire after 7 days and both schedules would then fail with an auth error.

## 3. Placeholders to fill
| Placeholder | Where |
|---|---|
| `PLACEHOLDER_ERROR_ALERT_WORKFLOW_ID` | Settings > Error Workflow on **W1, W2 and W3** (choose `SHARED \| Error Alert ...` from the list) |
| `PLACEHOLDER_TIMEZONE` | Settings node label in all three. The workflow Timezone itself holds `UTC` (see deviation 2): set your zone in Workflow Settings and make the spreadsheet zone equal |
| `PLACEHOLDER_N8N_VERSION_AND_EDITION` | Sticky note in each workflow |
| `PLACEHOLDER_SPREADSHEET_ID` | Settings node in W1, W2, W3; `PLACEHOLDER_SPREADSHEET_URL` in W1 (link in email and Slack) |
| `PLACEHOLDER_OWNER_EMAIL` | W1 Settings, W3 Settings |
| `PLACEHOLDER_DEMO_RECIPIENT` | W3 Settings (the owner's own test mailbox; the customer email is never a recipient) |
| `PLACEHOLDER_SENDER_NAME` | W3 Settings, the three reminder templates |
| `PLACEHOLDER_SLACK_SUMMARY_CHANNEL_ID` | W1 Settings (bot must be a member of the channel) |
| `PLACEHOLDER_MODEL_NAME` | W1: both Anthropic model nodes (the real choice) and `model_label` in Settings (must match the chosen model; it is what gets logged) |
| `PLACEHOLDER_W3_WORKFLOW_ID` | W2 node "Start approval run (W3)": select W3 after importing it |

## 4. Import order and manual steps
1. Make sure `SHARED | Error Alert ...` is already imported (SHOW-001). Note it exists.
2. Create the spreadsheet with the 8 tabs from `test-data/README.md`, paste the header rows and **lock them**. (The design says seven tabs; it lists eight.) Load the synthetic data (README has the import checks). Spreadsheet time zone = workflow time zone.
3. Create the four credentials (section 2) inside n8n.
4. Import **W3 first** (W2 needs its ID, and W3 must import with no errors). Open it, select credentials on the nodes that show a warning, fill its Settings placeholders.
5. Import **W2**, open "Start approval run (W3)", select W3, select credentials, fill placeholders.
6. Import **W1**, select credentials (Sheets, Gmail, Slack, both Anthropic nodes), pick the model in both model nodes, fill placeholders.
7. On **each** of the three: Workflow Settings > Error Workflow = the shared alert; Timezone = your zone; confirm "Save failed production executions" is On. W1 and W2 have a 5 minute timeout; W3 has none on purpose (a timeout may cancel waiting approvals).
8. On W3 set "This workflow can be called by" to W2 only (option wording: verify). Not set in the JSON.
9. On W3 "Ask owner to approve": if the Gmail node offers **Limit Wait Time**, set it to `approval_wait_hours` (48; QA shortens it for T17). The Gmail docs list no such option, so the JSON does not set it.
10. Add tags by hand on all three: `showcase`, `SHOW-002`, `draft` (tags need IDs that only exist on the instance; same as SHOW-001).
11. Set a spend limit at the AI provider and a short execution-data retention (executions hold invoice figures and names).
12. Do not activate. Separate reviewer, then QA, run next.

## 5. How the build follows the design
- **W1** follows design section 7 step by step: schedule, Settings, report week (Luxon, workflow zone), run lookup and claim-then-re-read (exactly one claim, ours), five packed reads, empty-source stop, raw-cell validation with minor units, zero-filled sales and ageing through Summarize + Merge left joins, top customers per currency, figures per currency with the computed directions, seven control rules (one "Compare with control totals" step, then the IF), blocked path (run marked `blocked_mismatch`, then Stop and Error with currency and metric only), optional AI commentary (try 1 with 2 tries, error output to the single repair, n8n validation twice, omit and log on failure), writes, `sending` before the sends, owner email (plain text), Slack summary (aggregates only, no AI commentary), `sent`.
- **W2** follows section 8: stale sweep (side branch), raw-cell validation, collectable filter, day maths in UTC date-only text, tiers 1-7 / 8-30 / 31+, two Compare Datasets steps (log key, open approval), email check with `skipped_no_email`, Remove Duplicates, cap, keyed claim, re-read, "exactly one row and ours", Execute Sub-workflow once per item with waiting off and an error output, end-of-run alert with counts only.
- **W3** follows section 9: fetch fresh, re-check 1, template text (no AI), `balance_shown` stored on the log row, Gmail Approve/Decline, re-read of log row and invoice, expiry guard (no write when closed), explicit-true check, log + optional separate draft, re-check 2 (collectable AND balance = balance_shown AND tier unchanged), send with **no retry**, `sent`. The only connection into "Send reminder to test address" is output 1 of "Still unpaid and unchanged?". The recipient is `demo_recipient` only.
- Retry On Fail with a 3 second wait on every Google call (3 tries; claim writes are keyed Append or Update), Gmail report/approval/draft 2 tries, customer send none, Slack 3 tries with error output, AI try 1 two tries, repair none. No Code node, no AI Agent node, no Auto-fixing Output Parser.
- Every non-sticky node carries notes naming what to verify; every uncertain point from design section 17 is marked.

## 6. Deviations from design.md (for the reviewer and the owner)
1. **Error Workflow is not blank in the JSON.** Design section 12 says blank; the lint rule is [must] "Error Workflow is set". I set the placeholder `PLACEHOLDER_ERROR_ALERT_WORKFLOW_ID` (as in SHOW-001) plus a sticky note. The owner replaces it on all three. QA T32's "Error Workflow blank in the JSON" should read "placeholder, sticky note present".
2. **Workflow time zone is `UTC` in the file**, not an invalid placeholder string that could break import (same choice as SHOW-001, deviation 5). `PLACEHOLDER_TIMEZONE` appears in the Settings node and the sticky note. Until the owner sets the zone, report week and tiers use UTC.
3. **Raw-cell validation uses one Edit Fields step (JSON mode) that sets a `row_valid` flag and a `bad_reason` code**, followed by a Filter, instead of an IF that routes rows to an "invalid" branch. Same rules (design section 6), tested on the raw cell before conversion; invalid rows are counted (rows read vs rows valid; `invalid_count`), not dropped.
4. **"Include Selected Fields" for the AI input** is done as a whitelist by construction: "Prepare aggregates for AI" outputs only `offered` and `ai_input` (includeOtherFields off). Same guarantee, no names can slip in.
5. **Control rules 1 to 7 are evaluated in one Edit Fields step ("Build figures" per currency, then "Compare with control totals")** and a single IF. Tolerance is `control_tolerance_minor` (0).
6. **Top customers: a currency with no sales gets one placeholder row (rank 0, "(no sales)")** so the list is never empty and the run does not dead-end. It is written to `top_customers`.
7. **Commentary paths end in four "Mark: commentary ..." steps and one "Set commentary text" step** (step 21 of the design) so every path converges.
8. **Split Out + Flatten steps.** Split Out is used with an explicit destination field and the next step reads either shape (nested or spread), because the exact output shape for arrays of objects is not verified.
9. **Execution-order dependencies (verify on import).** W2's B-inputs for the two Compare Datasets steps are placed above the main branch, and the end-of-run alert hangs below it, relying on execution order v1 (upper branch first, depth first). If n8n orders them differently the alert could fire before approvals start (it would end the run in Error before any approval email, fail-safe but noisy). W1's two left joins rely on Merge running when one input is empty.
10. **W2 stale sweep and the log-list branches are side branches** of "Pack reminder log"; the sweep does not hold up the scan.
11. **Builder interpretations of silent points:** a `void` row is exempt from the `balance = amount - amount_paid` check; an `invoice` with a negative balance is bad data; an empty invoices tab in W2 shows up as one bad row (loud). W1's empty-source test fails if invoices **or** sales_lines are empty.
12. **Missed-run option and Gmail Limit Wait Time are not set** (unverified on this version). **"This workflow can be called by" on W3 is not set** (needs W2's ID).
13. **AI schema enum lists `USD`, `EUR`** (matching the Settings default). Change it with the allowed currencies. The system prompt is stored in W1 Settings (`commentary_system_prompt`).
14. **Tags are left out** of the JSON (SHOW-001 precedent).
15. **W3 has no Timeout Workflow** (design 9.3), so lint shows one warning for W3.

## 7. UNVERIFIED items (confirm on import; also in each node's notes)
All `typeVersion`s: Schedule Trigger 1.2, Edit Fields 3.4, IF/Filter 2.2, Google Sheets 4.7, Gmail 2.1, Slack 2.3, Aggregate 1, Split Out 1, Summarize 1.1, Merge 3, Sort 1, Limit 1, Remove Duplicates 2, Compare Datasets 2.3, Execute Workflow 1.2, Execute Workflow Trigger 1.1, Stop and Error 1, Basic LLM Chain 1.7, Anthropic Chat Model 1.3, Structured Output Parser 1.3, Sticky Note 1. Beyond versions, the items in design section 17, specifically:
- Gmail send-and-wait: parameter names (`responseType`, `approvalOptions`), output field (`data.approved`), decline vs timeout, Limit Wait Time, preview safety (T42), and Create a draft parameters including `options.sendTo`.
- Google Sheets: operation names, Append or Update matching on `run_key`, `log_key`, `report_key` (and on two columns for `top_customers`), Update Row matching, unformatted-values and raw-write option names, Always Output Data as a Settings toggle, read-after-write.
- Edit Fields JSON mode, Split Out destination option and object shape, Summarize output key names (`sum_line_total_minor`, `count_line_total_minor`, `sum_balance_minor`, `count_balance_minor`), Merge "Enrich Input 1" and its behaviour with an empty input, Compare Datasets output order and empty Input B, Aggregate with zero/blank items.
- Expression pieces: `node.isExecuted`, `.all(1)` for the second output, the Unicode regexes `\p{Nd}` / `\p{L}`, Luxon `startOf('week')` in the workflow zone and across a DST week, `DateTime` as an expression global.
- Execute Workflow "Run once for each item" with waiting off, the error output, whether a manual run of W2 makes W3 pause and resume, whether W3's Error Workflow fires when called as a sub-workflow.
- Basic LLM Chain behaviour when the parser rejects a reply, whether the Anthropic node adds hidden retries, whether the chosen model accepts temperature 0.2, and the system-message type string.
- Slack: channel by ID, bot membership, auth type, no appended link.

## 8. Needs the owner's decision (carried from the design, none blocks the files)
1. Values for every placeholder in section 3 (Slack channel, time zone, test mailbox, model, n8n version/edition, spreadsheet).
2. Google OAuth app status: Production, Internal, or weekly reconnect.
3. Approve deviation 1 (placeholder Error Workflow in the file) and deviation 2 (UTC default) as the working method.
4. Missed-run option for W1 if the version supports it (default kept).

## 9. Synthetic data set (`test-data/`)
Built per design section 14.1: 41 invoices, 66 sales lines over three weeks, fictional "Sample Customer A to F" on `example.com`, frozen to the test date **2026-11-02**. Covers tier boundaries (0, 1, 7, 8, 30, 31 days), partial payment, invoices for QA to flip to paid or part-pay, credit note and void, USD and EUR (EUR prior week = 0), blank and `not-an-email` addresses, one customer with three overdue invoices, week-edge sales lines (Sunday/Monday), a report week containing the US clock change, hostile names (an instruction and one starting with `=`). Control tabs hold values from an independent calculation; formulas to build them in the sheet are in `test-data/README.md`. Header-only files exist for the four output tabs. Variants A to J (section 14.1) are in `test-data/variants/`. `expected-figures.md` has hand-calculated totals, ageing, top customers and the level of each open invoice. No real customer data.

## 10. Lint output (`node scripts/lint-workflow.mjs` on every workflow)
- W1: **0 must-fix, 0 warnings** (13 of 13 checks PASS).
- W2: **0 must-fix, 0 warnings** (13 of 13 PASS).
- W3: **0 must-fix, 1 warning**: "Workflow timeout is set". Deliberate (design 9.3: a timeout may cancel waiting approvals).

## 11. Checks the builder ran (not testing, not review)
- Throwaway scripts in `/tmp` (not in the repo): all three files parse as JSON; every connection source and target exists; every `$('Node name')` reference points to an existing node; every expression compiles as JavaScript; no `}}` inside an expression body.
- Simulation of the real expressions with stubs (a simple date stub, not Luxon, and hand-written Summarize/Merge): the base data gives exactly the figures in `expected-figures.md` (USD sales 8,509.00 in 23 lines, prior week 7,791.00 in 21 lines, EUR 2,490.00 in 7 lines with prior 0, open balances, ageing split, top customers) and the control check passes. Variants A (text in amount), B (off by 0.01), E (GBP), F (bad date), G (duplicate invoice number) and J (negative balance) are blocked; C (empty week) and I (EUR no sales) pass; H (tier shift) passes the totals control, as the design says. The commentary validation rejects digits, full-width digits, links, a leading `-` or `=`, a banned word, a wrong direction, a low confidence, extra fields, an unoffered pair and a duplicate pair, and accepts a valid reply. Tier boundaries 0/1/7/8/30/31 give none/t1/t1/t2/t2/t3.
- **Not run:** anything in n8n (no instance access by design). The simulation proves expressions and data flow, not the n8n nodes. The qa-tester runs design section 14.

## 12. Confirmation
All three workflows are **inactive** (`"active": false`). No pinData, no secrets, credentials by name only, no Code node, no webhook. The builder did not activate, publish or call any n8n API or any client system, and did not review or sign off its own work. Note: the repository already holds a commit `d3b12b8` ("Add SHOW-002 workflow JSON (build in progress...)") made by the session environment while this build was in progress; the files it contains were superseded by the final versions in the working tree (not committed by the builder).

## 13. Change log
- 2026-10-31: v1 built (W1, W2, W3, test data). Goes to the best-practice-reviewer, then the qa-tester.
