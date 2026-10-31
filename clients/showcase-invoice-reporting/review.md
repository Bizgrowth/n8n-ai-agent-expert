# Review: Invoice & Reporting (Showcase, SHOW-002)

**Stage:** 4 Review · **Reviewer:** best-practice-reviewer (did not build this) · **Date:** 2026-10-31
**Files reviewed:** `workflows/showcase-invoice-reporting-w1-weekly-report.json` (90 nodes incl. 1 sticky), `workflows/showcase-invoice-chase-w2-daily-scan.json` (44), `workflows/showcase-invoice-chase-w3-approve-and-send.json` (25), against `design.md` (revised, Gate 1b approved 2026-10-31), `build-log.md`, `design-changes.md`, the five specialist reviews (must-fix sections read in full), `playbooks/n8n-best-practices.md` and `playbooks/ai-guardrails.md`. The nine step cards were checked through the design and the reviews, not line by line. The test-data README and `expected-figures.md` were read; the control CSVs were re-added independently (see 3).
**Nothing was modified, imported, activated or pushed.** The build log was not trusted: every claim below was checked in the JSON.

## Verdict: APPROVE FOR QA

No must-fix item fails, and none of the design's safety invariants is broken. The structure that stops an unapproved reminder is correct in the file, not just in the notes. Three medium findings (M1 to M3) and eight low ones are listed with concrete fixes. M1 and M2 are small edits and are worth doing before QA starts, because they change what the tester will see (a stuck weekly run, and a daily alert that may fire too early). If the owner prefers to start QA now, the tester must write them into the test plan (section 8).

**Plain-language summary for the owner:** The money safety is sound. A reminder can only go out through one path: your Approve click, on a row that is still waiting, for an invoice that is still unpaid with the same balance and level you were shown. Reminders can only go to your test address. The weekly report cannot be written, emailed or posted unless all seven control checks pass. The AI sees only currency codes, directions and size words, and if it fails the report still goes out. What is weaker is the housekeeping: if the weekly run fails part way, a repeat run for the same week is silently refused (M1), and one bad invoice row might stop the day's approvals (M2). Both fail safe (nothing wrong is sent) but would waste your time in the demo.

---

## 1. Lint results

| File | Result |
|---|---|
| W1 weekly report | OK, 0 must-fix, 0 warnings (13 of 13 PASS) |
| W2 daily scan | OK, 0 must-fix, 0 warnings (13 of 13 PASS) |
| W3 approve and send | OK, 0 must-fix, **1 warning**: "Workflow timeout is set". Deliberate (design 9.3: a timeout may cancel waiting approvals). Accepted. |

Lint limits to keep in mind: it counts `PLACEHOLDER_ERROR_ALERT_WORKFLOW_ID` as "Error Workflow set", it does not look inside expressions, and it cannot see logic or graph errors. Everything in sections 2 to 5 is beyond lint.

## 2. Checks I ran myself (throwaway scripts in /tmp, not saved in the repo)

- All three files parse; `active: false`; no `pinData` key; node ids unique; every connection source and target exists; every `$('Node name')` reference points to a real node (0 bad); every node has notes.
- **All 273 expressions compile as JavaScript** (155 in W1, 62 in W2, 56 in W3), 0 syntax errors.
- **Graph reachability** (remove one gate, ask if the target is still reachable). Results are in section 3.
- **AI validator run on canned replies** (the real expression with stub inputs): a valid reply passes; digits (including full-width), a link with a slash, a leading `=`, `<b>` HTML, a newline, "doubled", a wrong direction, an unoffered pair, a duplicate pair, low confidence, an extra key, a missing or non-object reply are all rejected with the right code. Two known gaps pass (see L3).
- **Test data**: I recomputed USD/EUR sales for both weeks and the open balance and count from `sales_lines.csv` and `invoices.csv`. They equal `expected-figures.md` and the control CSVs (USD 8,509.00 / 23 lines, prior 7,791.00 / 21; EUR 2,490.00 / 7, prior 0; open 16,595.50 / 18 and 2,730.00 / 4).
- No credential values: only `{name}` references (4 credential names, as listed in the build log). No tokens, keys or e-mail addresses in any file. No webhook, no Code node, no AI Agent node, no Auto-fixing parser.

## 3. Design safety invariants, checked structurally (T32 and friends)

| # | Invariant | Result | Evidence |
|---|---|---|---|
| 1 | No connection reaches the customer Send except via approved + still pending + still unpaid + balance and level unchanged | **PASS** | W3 "Send reminder to test address" has exactly one inbound connection: output 0 of "Still unpaid and unchanged?". Removing any one of the three gates ("Still pending and not expired?" out 0, "Approved?" out 0, "Still unpaid and unchanged?" out 0) makes the Send unreachable from the trigger. That last IF requires `collectable` AND a stored `balance_shown` that parses AND balance equal to it (in whole minor units) AND recomputed level equal to the claimed level. W2 contains no Gmail or Slack node at all. |
| 2 | Customer email is never a recipient | **PASS** | `customer_email` does not occur anywhere in W3. W2 uses it only to test the address pattern and does not pass it on (W3 receives `invoice_no`, `tier`, `log_key`). Recipients: approval request = `owner_email`; reminder = `demo_recipient`; decline draft `sendTo` = `demo_recipient`; weekly email = `owner_email`. |
| 3 | Claim-then-re-read in W1 | **PASS** | "Claim this week" (keyed Append or Update on `run_key`) then "Re-read the claim" then "Exactly one claim and it is ours?" (exactly 1 row in running/sending/sent and its `execution_id` equals this execution). "Not ours" goes to Stop and Error. Without that gate nothing downstream of the claim is reachable. Caveat M1 (stuck rows). |
| 4 | Claim-then-re-read in W2 | **PASS** | "Claim reminders" (keyed on `log_key`), then "Re-read log after claim" (`executeOnce`, so one read, not one per invoice), then per item "Exactly one row for this level and it is ours?". "Not ours" goes to a counted no-op, never to W3. Without that gate W3 is unreachable. |
| 5 | Control-total rules 1 to 7 | **PASS** | All seven are in "Build figures" and "Compare with control totals", on whole minor units, tolerance from Settings (0): (1) sales total, (2) line count, (3) open balance = sum of the four buckets, (4) open count, (5) rows read vs rows valid for both source tabs (bad cell, bad date, duplicate `invoice_no` all make a row invalid; out-of-window sales lines count as valid), (6) exactly one control row per allowed currency in each tab and no non-allowed currency in either control tab, (7) prior-week total and count. An unreadable control value fails, it does not pass. "Write report rows", "Write top customers", the AI steps, the e-mail, Slack and "Mark run sent" are all unreachable without output 0 of "Control totals match?". The blocked path writes `blocked_mismatch` (metric and difference only, no names) and ends in Stop and Error. |
| 6 | Late Decline cannot overwrite `timed_out`; late Approve sends nothing | **PASS** | "Re-read log row" then "Still pending and not expired?" (status exactly `pending` AND `claimed_at` valid AND not older than `approval_wait_hours + 2`, the same cut-off as the W2 sweep). Anything else goes to a no-op with no write. A blank or missing row also fails the test (safe). |
| 7 | AI gets aggregates only; AI failure never blocks the report | **PASS** | "Prepare aggregates for AI" outputs only `offered` and `ai_input` (text lines of `currency; metric; direction; size`), `includeOtherFields: false`. No names, no invoice numbers, no free text. Try 1 error output goes to the repair step; the repair step's error output goes to "Mark: commentary omitted (error)"; invalid replies go to the omit marks; all four paths converge on "Set commentary text" and then the writes. The validator and mark expressions are null-safe (checked by running them), so a strange reply cannot stop the workflow. Worst case 3 model calls (try 1 twice, repair once), 400 output tokens, temperature 0.2. |
| 8 | Inactive, no pinData, no secrets, credentials by name only | **PASS** | See section 2. `tags` is an empty array (left to the owner, deviation 14). |

## 4. Findings, ranked by risk

No blockers. No high findings.

### M1 [MEDIUM] A weekly run that fails after the claim blocks a repeat of that week, and the repeat looks like success
- **Where:** W1 "Claim this week" sets the week to `running`. Every later failure except a control mismatch (source returned no rows, a Sheets outage, a duplicate-claim stop, a crash) leaves the row at `running`. "Already running or sent?" counts `running` as done, so when the owner fixes the problem and runs W1 again for the same week, the run writes a `duplicate_run` row and ends with a green Success. No report, no error. Design says this is deliberate for `sending` (after the e-mail). For `running` it is a trap: the weekly report is silently not produced, and the QA cases T4 (variant D), T9, T27 will each leave the week stuck, so the next case seems to "do nothing".
- **Change (preferred):** (a) in "Already running or sent?" count `running` only when `started_at` is less than 30 minutes old (W1 has a 5 minute timeout, so an older `running` row is dead). Keep `sending` and `sent` as permanent blocks. The claim is keyed on `run_key`, so a re-claim updates the same row and "Exactly one claim" still holds. (b) Optional: add a small "Mark run failed" Update (status `failed`, not counted as a block) before "Source returned no rows" and "Duplicate claim for the week".
- **Fallback:** keep the build, and add to the test plan and handoff: "after any failed W1 run, set that week's `report_runs` row by hand before repeating".

### M2 [MEDIUM] W2 end-of-run alert depends on canvas order, and if it runs first one bad row stops every approval that day
- **Where:** "Bad rows or duplicate claims seen?" is fed from "Check invoice row" (output 0 goes to both "Keep valid rows" and this IF). The design placed the alert after the approvals have started. In the build it is a parallel branch, positioned 1,800 pixels lower so that n8n's v1 execution order (top branch first, to completion) runs the approvals first. That is deviation 9 in the build log. I could not prove the order from the file. If the order is the other way round, "Source rows skipped or duplicate claims" (Stop and Error) fires first, the execution stops, **no reminder approval starts that day** (fail-safe but defeats "skip bad rows and continue", T27), and the duplicate-claim count it reports is always 0 because the claim step has not run.
- **Change:** make the order independent of position. Feed the IF from the end of the approvals branch instead: connect it from the output 0 of "Start approval run (W3)" and from "Duplicate claim skipped (counted)", and add a second feed from the "nothing to claim" case so a day with bad rows but no eligible invoice still alerts (for example from "Not overdue (no action)" and the false output of "Email usable?"; keep `executeOnce`). If that is more rework than wanted, keep the build and make QA prove it: run W2 manually with one bad row (variant G or J) and four eligible invoices and confirm that all four approval emails exist before the execution ends in Error.

### M3 [LOW-MEDIUM] W3 assumes exactly one sheet row at each re-read; a second row would multiply the approval or the send
- **Where:** "Fetch invoice now", "Re-read log row" and "Re-read invoice" use Return All Matches and then run per item. W2 keeps duplicate `invoice_no` rows out of the flow and confirms exactly one log row, so in normal use there is one item. But if a duplicate invoice row (or a duplicate pending log row) appears after W2's check, for example a manual W3 run or an edit while an approval waits, the chain carries two items: two approval e-mails at step 6, or, after one Approve click, **two items through "Send reminder"** (Retry is off, but two items are two sends). Still only to the test address, and still one reminder level, but it breaks "one reminder per invoice per level".
- **Change:** put a "Limit" node (keep first 1) after "Re-read invoice" and after "Re-read log row", and make "Check invoice now" / "Check invoice again" set `found = false` when more than one row came back (read the count from the sheet node's `.all().length`). Cheap and keeps the invariant independent of upstream checks.

### L1 [LOW] Customer name is spliced into text without clean-up
- **Where:** (a) "Write reminder from template" builds the body with `replaceAll('[customer_name]', name)`. JavaScript treats `$&`, `` $` `` and `$'` in the replacement as patterns. I ran it: a name containing `$&` or `` $` `` pulls pieces of the template into the reminder. Only the test address sees it, but it also corrupts a legitimate name that contains a dollar sign. (b) The approval e-mail (Gmail send-and-wait) shows the same text inside the node's HTML page; a name containing HTML or a link is not escaped by this build, and a fake link inside the owner's approval e-mail is worse than odd text. Synthetic hostile names (T29, T41) exist but are an instruction and a leading `=`, not HTML.
- **Change:** use a replacer function (`replaceAll('[customer_name]', () => name)`) for every placeholder, and in "Check invoice now"/"Check invoice again" strip `< > & $ "` from `customer_name` before it is used anywhere. Add one hostile name with `<a href=...>` and one with `$&` to the data and to T29.

### L2 [LOW] Duplicate-run rows share the claim's `run_key`
- **Where:** "Log duplicate run" appends a row with `run_key = week_start`, the same key the claim, "Mark run sending" and "Mark run sent" update on. If n8n's Update Row hits every matching row (design section 17, item 4: unverified), those updates overwrite the duplicate rows too, the audit trail is lost, and a later "Exactly one claim" test could count two rows. If it hits only the first match it works, because the claim row is always the oldest.
- **Change:** write duplicates with a different key, for example `run_key = week_start + '|dup|' + execution id`, so every update and lookup by `week_start` sees one row. T6 is the proof.

### L3 [LOW] Known AI validator gaps and one cost question
- A bare domain (`Visit evil.com now`) passes the letters-and-punctuation allow-list because a full stop is allowed; Gmail may turn it into a link in the plain-text e-mail. The model sees no untrusted text, so this is theoretical. Optional: reject a full stop followed by a letter and no space.
- A sentence that contradicts its `direction` ("sales fell sharply" next to `up`) passes, because only the `direction` field is checked. This is the gap the design states openly (section 11).
- The Anthropic model nodes set no retry option. If the node or client retries by itself (design section 17 item 16), the real call count is above 3. The provider spend limit is the backstop. Check on import; set the node's own retries to 0 if it offers it.
- The enum in both "Answer format" nodes is `USD, EUR`; if `allowed_currencies` changes, the schema must change too or every reply for a new currency is rejected and the commentary is omitted (safe, but silent). Noted in the node notes.
- **Change:** none required for QA. The tester runs the C1 to C13 set (design 14.4); C11 should include a bare domain.

### L4 [LOW] `approval_wait_hours` lives in two places
W2 (sweep cut-off) and W3 (expiry guard) each have their own copy, and they must be equal. T17 says "set it to a few minutes": if the tester changes only W3, the guard closes quickly but the sweep waits 50 hours, so the log row stays `pending` and the expected `timed_out` never appears; if only W2, the reverse. **Change:** say "change it in W2 and in W3, then change both back" in the T17 step and in the handoff.

### L5 [LOW] First-run empty log and empty reads rely on unverified Aggregate behaviour
W2 expressions read `$('Pack reminder log').first().json.logrows` and call `.map` or `.filter` on it with no fallback. If Aggregate returns `{}` (no `logrows` key) for a header-only tab, the first-ever scan stops with a type error (loud, fail-safe, and exactly what T20 tests). **Change:** append `?? []` in the four places ("Stale pending rows", "Log rows list", "Open approvals list", and the matching reads of `rows` in "Gather invoices"). W1 already uses `|| []` in "Build figures".

### L6 [LOW] Maintainability for someone who did not write it
The lint rule "no Code nodes" is met, but a great deal of logic sits in long expression strings: "Build figures" (about 60 lines), "Compare with control totals", two copies of the AI check, and the invoice check pasted into W1, W2 and W3 with small differences (three places to change a rule). W1 is 90 nodes across about 18,700 pixels with one sticky note. Per-node notes exist on every node, which helps, but they are not visible on the canvas. **Change (optional, before handoff):** add four to five section sticky notes in W1 (Claim and guard, Read and check, Figures and joins, Control, AI commentary, Write and send); note in the handoff that the invoice check is deliberately repeated in three workflows. Moving the shared check into one sub-workflow is a v2 idea.

### L7 [LOW] Error Workflow is a placeholder in all three files
Accepted (deviation 1), but lint cannot tell a placeholder from a real ID. If the owner forgets step 7 of the import list, nothing alerts and the run just fails quietly in Executions. QA T30 is the only proof. **Change:** none in the file. Put "Error Workflow = shared alert, on all three" first on the QA checklist and tick it before any other test. Also: the T32 wording "blank in the JSON" should read "placeholder with sticky note" (the build log already says this).

### L8 [LOW] Test-data and QA notes
- The control CSVs hold fixed numbers. T18, T19 and T39 flip or part-pay invoices; after that `control_open` no longer equals the invoice tab and W1 will (correctly) block. Run the W1 cases before the payment flips, or build the control tabs as the README's formulas.
- The frozen test date is Monday 2026-11-02 and the workflows use `$now`; the tester must run on that day or shift every date by the same number of days (README says so).
- "Create decline draft" has `continueRegularOutput`; if the draft fails the decline is already logged and nothing tells the owner the draft is missing. Acceptable for the showcase; mention in the T16 notes.

## 5. The 15 deviations in the build log

| # | Deviation | Judgment |
|---|---|---|
| 1 | Error Workflow is a placeholder, not blank | **Accept.** Required by the lint [must]. Owner sets it on all three (L7). |
| 2 | Workflow zone `UTC` in the file | **Accept.** Until the owner sets the zone, "Monday 07:00", the report week and the reminder levels use UTC; spreadsheet zone must equal workflow zone. |
| 3 | Raw-cell validation in one Edit Fields step plus Filter, not an IF routing to "invalid" | **Accept.** Every rule is tested on the raw text with a regex before conversion (so a text cell cannot crash it); bad rows are counted, and rule 5 / the W2 end alert make them loud. |
| 4 | "Include selected fields" done as a whitelist by construction | **Accept.** Verified: output has only `offered` and `ai_input`. Stronger than the setting. |
| 5 | Seven control rules in one step plus one IF | **Accept.** Verified rule by rule (section 3). |
| 6 | Top customers: placeholder row "(no sales)", rank 0 | **Accept.** The row is written to `top_customers`; mention it in the handoff so it is not read as a customer. |
| 7 | Four "Mark: commentary ..." steps and one "Set commentary text" | **Accept.** Gives every AI path one shape; checked. |
| 8 | Split Out + Flatten, reading nested or spread shape | **Accept.** Every flatten reads `row ?? $json`. |
| 9 | Execution-order dependencies (W2 compare inputs, end alert; W1 joins) | **Accept for the compare inputs and the W1 joins** (they wait for both inputs). **Not accepted as built for the W2 end alert**: see M2. |
| 10 | W2 stale sweep and log lists as side branches | **Accept.** The sweep reads the log taken at the start, so it cannot touch rows claimed today. |
| 11 | Builder interpretations (void exempt from balance check; negative invoice balance is bad data; empty invoices tab = one bad row; W1 stops if invoices or sales are empty) | **Accept.** Each is loud, not silent. |
| 12 | Missed-run option, Gmail Limit Wait Time, "called by" not set | **Accept** (unverified on this version). Without a wait limit, unanswered W3 runs stay in Waiting; layer 3 (the pending/expiry guard) makes a late click harmless. QA counts Waiting runs after T17 as designed. |
| 13 | AI schema enum lists `USD`, `EUR` | **Accept** (L3). |
| 14 | Tags left out | **Accept.** Owner adds `showcase`, `SHOW-002`, `draft` after import (same as SHOW-001). |
| 15 | W3 has no Timeout Workflow | **Accept.** Matches design 9.3 and the lint warning. |

**Deviations not listed by the builder:** the W2 end alert is fed from the start of the flow, not the end (M2, partly covered by 9); duplicate-run rows share the claim's key (L2); no check that exactly one sheet row came back in W3 (M3); approval e-mail and reminder text are not cleaned for HTML or `$` patterns (L1).

## 6. Best-practice and guardrail checklist

| Area | Result | Note |
|---|---|---|
| Naming, plain-English node names, version in name | **Pass** | Lint plus my read. Names carry the branch meaning ("false = stop"). Tags by hand (deviation 14). |
| Trigger choice | **Pass** | Schedules fit "report Monday, scan daily". Weekly: Monday 07:00 (`triggerAtDay` 1, hour 7), daily 08:00. Missed-run option left at the default. |
| Webhook authentication | **N/A** | No webhook. The approval link is served by n8n (do not forward the e-mail; T42 checks preview safety). |
| Retry On Fail / On Error on every external node | **Pass** | Sheets 3 tries with a 3 second wait; Gmail report, approval and draft 2 tries; customer Send **no retry** with an error output; Slack 3 tries with an error output; AI try 1 two tries to the repair step, repair no retry; Execute Workflow error output. Claim writes are keyed Append or Update. Logging failures stop loudly. |
| Error Workflow | **Conditional pass** | Placeholder on all three (L7). Stop and Error messages carry counts, currencies and metrics only. |
| Idempotency | **Pass with M1** | Week claim, reminder claim and re-read, keyed writes, `log_key` blocks repeats, Remove Duplicates, duplicate `invoice_no` is bad data. Sheets is not atomic; the residual window is stated in the design. |
| Filters and branches | **Pass** | Every IF has both outputs wired or an intentional end; labels say what each output means. |
| Data validation | **Pass** | Raw-cell checks, minor units per row before summing, 2-decimal limit, real-calendar dates, currency/status/type sets, balance = amount - paid in minor units. |
| Secrets and security | **Pass** | Section 2. Plain text e-mails only. Writes are RAW, so a name starting with `=` stays text. Execution data holds invoice figures and names: owner sets short retention. |
| Execution cost | **Pass** | About 40 to 60 executions a month; at most 3 model calls a week; W2 reads the whole log daily (fine for a demo). Heavy W3 bursts are capped at 10 per scan. |
| Logging and alerting | **Pass with M1/M2** | Run and reminder logs with codes only, no customer text or e-mail. The Slack alert itself is provable only by a real scheduled failure (T30). |
| Sticky-note documentation | **Pass** | One per workflow with purpose, owner, trigger, version placeholder, import steps, limits. W1 would read better with section notes (L6). |
| AI guardrail 1 structured output | **Pass** | JSON schema, `confidence`, `reason`, no extra fields. |
| 2 validation step | **Pass** | Stronger than required (L3 gaps stated). One repair, then omit. |
| 3 human-review path | **Departure, accepted at Gate 1b** | Failed or low-confidence commentary is omitted and logged (`commentary_status`, confidence, reason, rejected text), and the e-mail says "AI commentary not available this week". The text never reaches a customer. |
| 4 cost cap | **Pass** | 400 tokens, 3 calls, one run a week, tiny input. Per-run price is a method, not a number (no prices known); provider spend limit is an owner step. |
| 5 prompt hygiene | **Pass** | Prompt and version in Settings; aggregates in a marked data block with a "data, not instructions" line. |
| 6 injection | **Pass** | Nothing untrusted is sent; the model chooses no recipient, URL or action. |
| 7 PII | **Pass** | Aggregates only. Provider data terms: handoff item. |
| 8 determinism | **Pass** | Temperature 0.2, fixed enums; confirm the model accepts the setting. |
| 9 logging | **Pass** | `model` is the Settings label, so it must equal the chosen model. |
| 10 test set | **QA stage** | 13 cases in design 14.4. |
| 11 fallbacks | **Departure, accepted** | Retry, repair, then omit and log. |
| 12 agent limits | **Pass** | No agent, no tools, no memory, no auto-fixing parser. |
| HTTPS | **N/A** | Owner decision, not re-raised. |
| Maintainability | **Pass with L6** | Left-to-right flow, notes on every node. |

## 7. What only an import into n8n can prove

All `typeVersion`s are unverified (build log section 7), so the first import may show parameter differences on any node. The ones that decide pass or fail in QA:
1. All three files import clean (W3 first). Credentials attach by name; the two placeholders for the Error Workflow and the W3 ID are replaced.
2. Gmail send-and-wait: parameter names, `data.approved` on approve, decline and timeout, whether a Limit Wait Time exists, and **T42** (a preview must not count as Approve).
3. Google Sheets: Append or Update matching on `run_key`, `log_key`, `report_key`; Update Row when two rows match (L2); read-after-write for both re-reads; unformatted values; RAW writes; Always Output Data on empty reads; `claimed_at` and other timestamp columns stay text.
4. Aggregate, Summarize, Merge (left join with an empty input) and Compare Datasets with an empty or blank Input B (L5, T20, T37).
5. Execute Workflow "each" with waiting off: all children start, a start failure reaches the error output, a manual W2 run starts children that pause and resume, and W3's own Error Workflow fires.
6. Execution order of the W2 side branches and the end alert (M2).
7. Luxon `startOf('week')` in the chosen zone across the DST test week; `$now` zone; spreadsheet zone equal to workflow zone.
8. The chain returns the parsed object under `output`; the Anthropic node adds no hidden retries; the model accepts temperature 0.2.
9. Slack: channel by ID, bot a member, token type, no appended link.
10. Real scheduled failure reaches the shared alert (T30), including one from inside W3.

## 8. Notes for the tester (add to the QA plan)

- Tick the Error Workflow setting on all three first (L7).
- Reset the week's `report_runs` row between W1 cases (M1) unless the builder has applied the fix; confirm after T4 variant D, T9 and T27.
- T17: change `approval_wait_hours` in W2 **and** W3, then change both back (L4). Record the count of Waiting executions.
- T27 on W2: one bad row plus several eligible invoices; the approvals must all exist before the execution ends in Error (M2).
- T29 and T41: add a name with HTML and one with `$&` (L1).
- Control tabs are static in the CSV; do the W1 cases before the payment flips, or use formulas (L8).
- Structural proof for T32 is in section 3; the tester should still look at the canvas once.

## 9. Wrap-up

**What was done:** Linted all three files (clean; one deliberate warning on W3), proved the safety gates by graph reachability, read every node that touches money, recipients, the claim, the control rules and the AI, ran the AI validator on 16 canned replies, compiled all 273 expressions, re-added the test data, and judged the 15 deviations.

**What needs the owner's decision:** (1) M1: add the stale-`running` rule (recommended) or accept a manual reset of the week's row; (2) M2 and M3: have the builder apply the small edits before QA, or let QA prove the order and note the risk; (3) confirm the Gate 1b acceptance of "AI commentary omitted, not queued" still stands (it is recorded at Gate 1b).

**Next step:** the builder may apply M1 to M3 and L1, L2, L5 in one short pass and re-lint (a quick re-review of those nodes is enough). Then the tester (not the builder) runs design section 14 with the notes in section 8. Nothing was activated; the owner activates only after sign-off.

**Verdict: APPROVE FOR QA**

---

# Re-review after fix pass (2026-10-31)

**Reviewer:** best-practice-reviewer (did not build the fix pass). **Scope:** M1, M2, M3, L1, L2, L5 and the safety invariants. Everything below was checked in the three JSON files (connections and expressions), not taken from `build-log.md` section 14. Nothing was modified, imported, activated or pushed. L3, L4, L6, L7, L8 were deliberately left open by the builder and are unchanged; they stay as QA or owner notes.

## Verdict: APPROVE FOR QA

All six fixes are in the files and work as intended. No must-fix and no safety problem. Three new low findings (N1 to N3) are QA checks or optional polish; none blocks QA.

**Plain-language summary:** A week that failed halfway can now be re-run after 30 minutes (or at once if it failed for "no source rows"), and a week that is really still running or already emailed stays blocked. The daily scan's "some rows were bad" alert now waits until the approval requests have been started, so one bad row can no longer block the day's approvals. A duplicated invoice row now stops the reminder instead of doubling it. Customer names can no longer break the reminder text or put a link into your approval email. The reminder still can only reach your test address, and only through your Approve click.

## 1. Lint

| File | Result |
|---|---|
| W1 | OK, 0 must-fix, 0 warnings |
| W2 | OK, 0 must-fix, 0 warnings |
| W3 | OK, 0 must-fix, 1 warning (workflow timeout, deliberate, unchanged) |

All three: `active: false`, no `pinData`, credentials by name only (4 names), no key or token values (the one word "token" in W1 is inside a note about auth type). Node counts W1 91, W2 44, W3 28. Lint still cannot see logic; the rest is by reading the graph.

## 2. Per finding

| Finding | Result | Evidence |
|---|---|---|
| **M1** stale running rule + Mark run failed | **PASS** | "Already running or sent?" is true if any row is `sending` or `sent` (permanent), or `running` with `started_at` under 30 minutes old, or `running` with an unreadable `started_at` (blocks, safe). Anything else (`failed`, `blocked_mismatch`, old `running`) goes to "Claim this week". W1 has a 300 second timeout, so a `running` row older than 30 minutes cannot belong to a live run: a genuinely running week stays blocked, and `sending`/`sent` can never be reclaimed. The lookup and the claim use `run_key = week_start`; duplicate rows now use a different key (L2), so a re-claim updates the one row and "Exactly one claim and it is ours?" (exactly one row in running/sending/sent whose `execution_id` is this run) still holds. "Mark run failed (no source rows)" is an Update on `run_key = week_start`, wired only from output 0 of "Source empty?" (after the claim was confirmed ours) to "Source returned no rows"; it is on continue-on-error, so a failed write cannot hide the stop, and the 30 minute rule covers it. It is correctly not on the duplicate-claim path (that row belongs to someone else). |
| **M2** W2 end alert | **PASS, with a known gap (N1)** | "Bad rows or duplicate claims seen?" now has exactly two inbound connections: output 0 of "Start approval run (W3)" and "Duplicate claim skipped (counted)". It no longer connects from "Check invoice row". Its test reads the claim check's two outputs, which are complete before either feeder runs, and is true only when `Start approval run (W3)` has executed (or no row passed the claim check) AND bad rows or duplicate claims exist. If the duplicate branch happens to run first, the test is false and the IF is called again when the W3 start finishes, so the order no longer matters. Worst case with bad rows: all approval runs are started, then the execution ends in Error. If every W3 start fails, "Mark start failure" and "W3 could not be started" alert instead. |
| **M3** Limit 1 and exactly-one checks, W3 | **PASS (invoice), partial (log row, see N2)** | Wiring: Fetch invoice now -> Keep one invoice row (now) -> Check invoice now; Re-read log row -> Keep one log row -> Re-read invoice -> Keep one invoice row (again) -> Check invoice again. Both checks count rows from the sheet node itself (`$('Fetch invoice now').all()`, `$('Re-read invoice').all()`, rows with an invoice number), not from the Limit, and set `found = false` unless the count is exactly 1. `collectable` requires `found`. So a duplicate row before asking ends in "Log stop before asking" (no approval email), and a duplicate that appears while waiting fails "Still unpaid and unchanged?" and goes to "Log late stop" (no send). The three read nodes have Always Output Data on, so zero rows gives an empty item, `found = false`, and a safe stop. |
| **L1** escaping and replacer | **PASS** | "Write reminder from template" fills subject and body with one `replace(/\[(...)\]/g, (m, k) => map[k])` pass. A function replacer means `$&`, `` $` `` and `$'` are inserted as plain text, and a name that itself contains `[invoice_no]` is not substituted again. "Ask owner to approve" HTML-escapes the entire text (`& < > " '`) including the customer name; the real reminder is plain text (`emailType: text`), so it is not escaped and "Smith & Sons" stays correct there. The builder's stub test agrees with what the code does. One thing only QA can prove: that Gmail's approval page shows the escaped text as intended and does not double-escape (N3). |
| **L2** run_key | **PASS** | "Log duplicate run" writes `week_start|dup|<execution id>` (append, no matching column). Nothing looks up or updates by that key, and the claim lookup filters on exactly `week_start`. |
| **L5** guards | **PASS** | `?? []` present in "Gather invoices", "Stale pending rows", "Log rows list", "Open approvals list". One unguarded read remains (`Pack log after claim`.logrows in the claim check) but that tab always contains at least our own claim row, and a failure there is loud and safe. |
| **T32 invariant** | **PASS** | W3 "Send reminder to test address" has exactly one inbound connection: output 0 of "Still unpaid and unchanged?". The path is a single chain (trigger -> Settings -> Fetch -> Keep one -> Check -> Still collectable (out 0) -> Write reminder -> Record what the owner is shown -> Ask owner to approve -> Re-read log -> Keep one -> Re-read invoice -> Keep one -> Check again -> Still pending (out 0) -> Approved? (out 0) -> Still unpaid and unchanged? (out 0) -> Send), so removing any of the three gates cuts it. The new Limit nodes sit only upstream of the gates and add no path. `customer_email` does not appear anywhere in W3. Gmail recipients: approval = `owner_email`, send and decline draft = `demo_recipient`. W2 has no Gmail or Slack node and starts W3 only from output 0 of its claim check. |

## 3. New findings

### N1 [LOW-MEDIUM] W2 alert still silent on some days; depends on one unverified behaviour
The builder already flagged the first part. What produces **no alert** (the run ends green) when there are bad source rows or duplicates but nothing reaches the claim check, or when the W3 start emits nothing:
- no invoice is overdue ("Not overdue (no action)"), or all overdue invoices were filtered out;
- every overdue invoice is already handled at its level ("Already handled this level?") or has an open approval ("Open approval on this invoice?");
- invoices with no usable e-mail ("Log no-email skip": logged to the sheet, but no alert);
- invoices dropped by "Remove duplicate claims" or beyond the daily cap ("Cap per run");
- no valid rows at all after "Keep valid rows";
- the claim step returns nothing.
Also, the alert fires after the approvals only if "Start approval run (W3)" output 0 emits items while "Wait for sub-workflow" is off. That is unverified on this n8n version. If it emits nothing, the alert fires only when some claim was a duplicate.
- **Impact:** a bad source row can be missed on a quiet day. Nothing unsafe is sent; the bad row is still excluded.
- **Fix (optional, later pass):** also feed the same IF from "Not overdue (no action)", the false output of "Email usable?", and the end of the "Keep valid rows" empty case, with `executeOnce`; or accept it and tell the owner in the handoff.
- **QA:** T27 as the builder wrote it (one bad row plus several eligible invoices: all approvals exist, then Error) proves the W3 start output. Add a day with one bad row and nothing overdue and record that it ends green by design (or that it alerts, if the owner chooses the fix).

### N2 [LOW] W3 has no "exactly one" check on the log row
The invoice rows are now checked by count; the reminder-log row is only cut to the first one by "Keep one log row". If a duplicate log row for the same `log_key` appeared, "Still pending and not expired?" would judge the first row only, and "Log sent" or "Log not approved" would update by `log_key`. It cannot cause a second send (one item, one send), only a wrong log or a send decided by an old row. W2 already confirms exactly one log row at claim time, so this needs a manual edit to happen.
- **Fix (optional):** in the "Still pending and not expired?" test also require `$('Re-read log row').all().filter(r => r.json.log_key).length === 1`.

### N3 [LOW] Approval page rendering of the escaped text
The whole approval message is escaped, so any literal `&amp;` or similar would show wrongly if Gmail's approval page already escapes it, and line breaks may collapse. Unverified on this version. **QA:** T29/T41 should include a name with `&`, one with `<a href=...>` and one with `$&`, and look at the approval page and the real reminder. If the approval page shows `&amp;` literally, drop the escape for `&` only or escape the name only.

## 4. Verdict

**APPROVE FOR QA.** The fixes are structurally sound, the T32 invariant holds, all three workflows are inactive with no test data or secrets. N1 to N3 do not need a builder pass; they go into the test plan. Still open for QA and the owner (unchanged): Error Workflow placeholder on all three (tick it first), L3 validator gaps and model-node retries, L4 `approval_wait_hours` in two places, L8 control CSVs and frozen test date, and the import-time checks (typeVersions, W3 workflow ID, Gmail wait limit, Update Row matching one row).
