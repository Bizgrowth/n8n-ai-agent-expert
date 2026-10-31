# Test Evidence Report: Invoice & Reporting (Showcase, SHOW-002)

**Client:** Internal showcase (SHOW-002) · **Workflow files:** `workflows/showcase-invoice-reporting-w1-weekly-report.json` (W1), `workflows/showcase-invoice-chase-w2-daily-scan.json` (W2), `workflows/showcase-invoice-chase-w3-approve-and-send.json` (W3); shared alert `clients/showcase-ai-lead-qualifier/workflows/shared-error-alert.json` (n8n IDs: not yet supplied)
**Tested by:** qa-tester (owner runs the cases in n8n and supplies evidence) · **Date:** 2026-10-31 (script issued; **no evidence received yet**)
**Environment:** Showcase n8n, owner's instance, synthetic data only, test mailbox and test Slack channel only (owner to confirm in Part 0) · **Workflow state:** all three inactive, manual runs only · **n8n version:** not yet supplied (V1)
**Test script:** `clients/showcase-invoice-reporting/test-script.md` · **Design cases:** `design.md` section 14 (T1 to T42, C1 to C13, 14.5) · **Review basis:** `review.md` re-review (APPROVE FOR QA) · **Test date used:** ______ (frozen date in the data is Monday 2026-11-02) · **Control tabs:** formulas / fixed numbers (circle one)

## Summary
- Design cases T1 to T42 (42): Run with evidence: 0 · Passed: 0 · Failed: 0 · **NOT RUN: 42**
- AI commentary set C1 to C13 (13): Passed: 0 · Failed: 0 · **NOT RUN: 13** · pass rate: __ of 13
- Extra checks X1 to X14: Passed: 0 · Failed: 0 · **NOT RUN: 14**
- Verify-on-import items V1 to V17: Answered: 0 · **NOT RUN: 17**
- Acceptance gate (design 14.3: T1, T2, T3, T15, T19, T23, T24, T32, T39 must all pass): **0 of 9 passed**
- Executions used (sub-workflows included): actual W1 __ · W2 __ · W3 __ · shared alert __ vs design estimate about 40 to 60 a month (W1 4 to 5, W2 about 30, W3 5 to 20, alert under 5). Per run: W1 = 1; W2 = 1 plus 1 W3 per claimed invoice. Measured: __
- AI step: accuracy on labelled set (C1 to C7): __ of 7 matched the owner's label · real model calls expected: one per W1 run that reaches the AI, at most 3; C8 to C13 add none (pinned) · cost per run: __ vs design method (input tokens x price + output tokens x price; no prices quoted) · provider usage before __ / after __
- **Recommendation: Not ready.** Nothing has been run or verified. This changes only when evidence is received and checked. A case without evidence stays NOT RUN, never pass.

## Result key
**Pass** = evidence received and matches expected. **Fail** = evidence received and does not match (reported under Open defects). **Not verified** = evidence incomplete or unreadable. **NOT RUN** = no evidence received yet. **Observation** = documented behaviour recorded, no pass or fail (X2).

## Prerequisites (script Part 0)
| # | Item | Owner answer or evidence | Result |
|---|---|---|---|
| P1 | n8n version and edition | | NOT RUN |
| P2 | Imported in order W3, W2, W1; warnings noted | | NOT RUN |
| P3 | Four credentials created by name and attached | | NOT RUN |
| P4 | Google OAuth app status (Production / Internal / Testing) | | NOT RUN |
| P5 | Spreadsheet with 8 tabs, headers locked | | NOT RUN |
| P6 | Test data loaded; text dates, numeric money, `=` name is text | | NOT RUN |
| P7 | Control tabs built as formulas, equal to the CSV values | | NOT RUN |
| P8 | Placeholders filled; test channel; two different test addresses | | NOT RUN |
| P9 | Frozen test date set (Plan A or B) | | NOT RUN |
| P10 | Time zone set on W1, W2, W3 and on the spreadsheet | | NOT RUN |
| P11 | Error Workflow = shared alert on **all three**; timeouts; W3 called-by W2 only | | NOT RUN |
| P12 | Three hostile invoice names set (INV-1002, INV-1003, INV-1007) | | NOT RUN |
| P13 | Provider spend limit and short retention set | | NOT RUN |
| P14 | Cost "before" figure recorded | | NOT RUN |
| P15 | Approval link reachable from the browser | | NOT RUN |
| P16 | All three workflows inactive (screenshot) | | NOT RUN |

## Cases T1 to T42 (design section 14.2)
Evidence expected for every case: execution ID, canvas screenshot, the sheet tab shots named in the script, mailbox and Slack evidence. "Actual" and "Execution ID" are filled when evidence arrives. Script part in brackets.

| # | Case | Input | Expected | Actual | Execution ID | Result |
|---|---|---|---|---|---|---|
| T1 | Happy path weekly (smoke test, run first) [3] | Base data, commentary on | Totals equal `expected-figures.md` (USD 8509.00 / 23 lines, EUR 2490.00 / 7, open 16595.50 / 18 and 2730.00 / 4); report and top-customer rows written; 1 email, 1 Slack post; run `sent` | | | NOT RUN |
| T2 | Mismatch: bad row [4] | Variant A (`N/A` in amount) | Error "Report blocked..."; run `blocked_mismatch`; nothing written or sent; no crash on the text cell | | | NOT RUN |
| T3 | Mismatch: control off 0.01 [4] | Variant B | Same as T2; detail shows USD sales and a one-cent difference | | | NOT RUN |
| T4 | Empty data [3, 4] | Variant C; variant D | C: zero report published because control also says 0. D: Error "Source returned no rows", run `failed`, a repeat with good data then runs | | | NOT RUN |
| T5 | Multi-currency [3] | Base (same run as T1) | USD and EUR in separate rows, never summed | | | NOT RUN |
| T6 | Duplicate run [3] | W1 twice, same week | Second run logs `duplicate_run` with `run_key` containing `\|dup\|`; no second email, Slack or rows | | | NOT RUN |
| T7 | Date boundaries [3, 6] | Week-edge lines (10-25, 10-26, 11-01, 11-02); tier boundary invoices; clock-change week | Lines in the right week (T1 totals); days past due right at 0, 1, 7, 8, 30, 31; DST part verified only on the real date | | | NOT RUN |
| T8 | Trend edge [3] | EUR prior = 0; a falling currency (variant C) | `change_pct` `n/a` for prior 0; negative change shown correctly | | | NOT RUN |
| T9 | W1 source read failure [9] | Wrong spreadsheet ID in W1 Settings | Retries with wait, stops; nothing published; Error | | | NOT RUN |
| T10 | Summary content [3] | Base | Slack: aggregates only, no names, no AI commentary; email: no customer emails; both agree with the sheet | | | NOT RUN |
| T11 | AI commentary happy [3] | Base, commentary on | Valid, no digits, directions match, labelled AI; AI input shows only labels and numbers | | | NOT RUN |
| T12 | AI invalid [5] | Pinned bad replies (C8 to C13) | One repair, then omitted; report still sent; `omitted_invalid` | | | NOT RUN |
| T13 | AI provider failure [9] | Wrong LLM credential on both model nodes | Retry, repair fails, omitted, report sent, `omitted_error` | | | NOT RUN |
| T14 | Tier assignment [6] | Boundary invoices | 0 days none; 1 and 7 t1; 8 and 30 t2; 31 t3 | | | NOT RUN |
| T15 | Approve [6] | Approve INV-1004 (t2) | Exactly one reminder, demo address only; log `sent` | | | NOT RUN |
| T16 | Decline [6] | Decline INV-1006 | Nothing sent; `declined`; draft in Gmail drafts | | | NOT RUN |
| T17 | No answer [8] | `approval_wait_hours` -1.9 in W2 and W3 (6 minute window), no response, then late Approve and late Decline | `timed_out`; late Approve sends nothing; late Decline does not overwrite; Waiting count recorded (X8) | | | NOT RUN |
| T18 | Paid before the approval email [7] | Manual W3 with INV-1012 paid | `stopped_paid`; no approval email | | | NOT RUN |
| T19 | Paid after approval [6] | INV-1011 flipped to paid while waiting, then Approve | `stopped_paid`; nothing sent | | | NOT RUN |
| T20 | Dedupe [6] | First-ever run with empty log; second run same day; next-day repeat | No second approval for any key; empty log (and blank item) does not break the compare; all invoices pass as "In A only" on the first run; next-day part only if run on a later day | | | NOT RUN |
| T21 | Overlap and open approval [6] | W2 run while INV-1003 t1 is pending | No new approval for that invoice | | | NOT RUN |
| T22 | Dates and empty reads from Sheets [3, 4] | Real Date cell, formula cell, `2026-02-30`, empty read | Parsed correctly or rejected loudly; `2026-02-30` fails; empty lookups end cleanly | | | NOT RUN |
| T23 | Send failure [7] | Wrong Gmail credential on the Send node (manual W3) | One attempt, no retry; `send_failed`; Error; no duplicate | | | NOT RUN |
| T24 | Garbled approval response [7] | Pinned `approved` = `maybe` (manual W3) | Treated as not approved; nothing sent | | | NOT RUN |
| T25 | Log write failure after the send [7] | Bad document ID on "Log sent" (manual W3) | Reminder sent once; log write retries then stops loudly; Error | | | NOT RUN |
| T26 | Slack failure [9] | Wrong Slack credential on "Slack summary" | Email sent; `slack_sent` no; Error | | | NOT RUN |
| T27 | Bad rows in W1 and W2 [4, 8] | Variants E, F, J; plus several eligible invoices with one bad row | W1 blocked; W2 skips bad rows, all approvals exist, then Error with counts (see X1) | | | NOT RUN |
| T28 | Blast cap [6, 8] | Cap 2 with eligible invoices; second run | 2 claimed and asked, next 2 on the next run; no Sheets call fails in the burst (D1 ten-at-once burst also recorded) | | | NOT RUN |
| T29 | Hostile text [3, 6] | INV-1015 instruction name | No effect on routing; not in AI input; shown only as plain text in the reminder | | | NOT RUN |
| T30 | Error alert (owner-run) [9] | A scheduled failure in W1 or W2, and one inside W3 | Slack alert: workflow, step, link, no customer data. Only a real scheduled failure proves it | | | NOT RUN |
| T31 | W2 source outage [8] | Wrong spreadsheet ID in W2 Settings | Scan stops, no approvals, Error | | | NOT RUN |
| T32 | Structural [1] | Inspect canvas and JSON | One inbound connection to the Send node (from "Still unpaid and unchanged?" true output); customer email never a recipient; W3 imports clean; Error Workflow placeholder replaced; sticky notes present; lint output attached | | | NOT RUN |
| T33 | Partial payment [6] | INV-1010 (400 paid) | Reminder shows 600.00, not 1000.00 | | | NOT RUN |
| T34 | Credit note and void [6] | CN-2001, INV-1023 | Never chased; credit note netted in sales | | | NOT RUN |
| T35 | Missing / bad email [6] | INV-1013, 1014, 1104 | `skipped_no_email` logged once each; no approval; counted in the weekly report (overdue no-email: USD 2, EUR 1) | | | NOT RUN |
| T36 | Escalation [6] | INV-1003 t1 pending, moved to 8 days | Blocked while t1 pending; new t2 reminder allowed after t1 is declined | | | NOT RUN |
| T37 | Currency with no rows [3] | Variant I | Passes with a zero EUR row; not blocked | | | NOT RUN |
| T38 | Ageing split bug [3] | Variant H | Control passes; ageing figures wrong against `expected-figures.md` (USD 1-7 becomes 5300.50, 8-30 becomes 4205.00) | | | NOT RUN |
| T39 | Change during the wait [6] | INV-1008 part-paid; INV-1005 moved to 31 days; then Approve | `stopped_changed`; nothing sent | | | NOT RUN |
| T40 | Duplicates [4, 8] | Variant G (W1 and W2); two W2 scans started together | Duplicate rows counted as bad, not claimed; one claim only (or both stop safely); no second approval | | | NOT RUN |
| T41 | Formula text in a name [3, 6] | `=` names (INV-1016; renamed sales rows) | Stored as text, not run as a formula; plain text in emails | | | NOT RUN |
| T42 | Approval email preview [6] | Receive and preview INV-1002's email, no click | No Approve recorded; W3 run stays Waiting; log row stays `pending` | | | NOT RUN |

## AI commentary set (design 14.4)
Owner labels expected directions for C1 to C7 **before** each run. C8 to C13 must end as "omitted".

| # | Case | Setup | Expected | Owner label | Actual | Execution ID | Result |
|---|---|---|---|---|---|---|---|
| C1 | Sales up, overdue down | USD seed overdue 20000.00 / 20 | USD sales up, overdue amount and count down | | | | NOT RUN |
| C2 | Sales down, overdue up | Variant C | USD sales down, overdue up | | | | NOT RUN |
| C3 | Flat | Seed equal to this week | Overdue flat; USD sales cannot be made flat with shipped data (partly not coverable) | | | | NOT RUN |
| C4 | Prior week zero | Base (T1 run) | No EUR `sales` item offered | | | | NOT RUN |
| C5 | Two currencies opposite ways | C1 setup | Each item names its currency; USD down, EUR up | | | | NOT RUN |
| C6 | One customer dominating | All current-week USD lines renamed to one customer | Nothing about concentration appears | | | | NOT RUN |
| C7 | All zero | Custom setup (optional) | Zero report; `off_no_metrics` or flat statements only | | | | NOT RUN |
| C8 | Forced reply with digits | Pinned both AI steps | Omitted; report sent | | | | NOT RUN |
| C9 | Forced wrong direction | Pinned | Omitted | | | | NOT RUN |
| C10 | Forced low confidence / missing field | Pinned (two runs) | Omitted | | | | NOT RUN |
| C11 | Forced link or markdown (and a bare domain) | Pinned (two runs) | Omitted; bare domain is a known weak spot, record what happens | | | | NOT RUN |
| C12 | Forced spelled-out number ("doubled") | Pinned | Omitted | | | | NOT RUN |
| C13 | Prior zero with forced `up` | Pinned (EUR sales up) | Omitted | | | | NOT RUN |

## Extra checks from the review notes and the brief (X)
| # | Check | Related | Evidence needed | Actual | Execution ID | Result |
|---|---|---|---|---|---|---|
| X1 | T27: several eligible invoices plus one bad row: all approvals exist, then the execution ends in Error with counts (M2) | T27 | W2 Exec ID, Canvas, ten approval emails, log | | | NOT RUN |
| X2 | N1: a day with one bad row and nothing overdue: expected to end green with no alert (known gap) | N1 | Exec ID, Canvas, status. **Observation**, not pass or fail | | | NOT RUN |
| X3 | "Start approval run (W3)" output 0 emits items when "wait for sub-workflow" is off; manual W2 starts W3 runs that pause and resume | V13, N1 | Output panel screenshot, Waiting runs | | | NOT RUN |
| X4 | T6: the duplicate row has the `\|dup\|` key | L2 | `report_runs` shot | | | NOT RUN |
| X5 | T4 variant D: `failed` row, immediate repeat runs; stuck `running` row blocks under 30 minutes and is reclaimed after | M1 | Exec IDs, `report_runs` shots | | | NOT RUN |
| X6 | Hostile names: `&`, `<a href>`, `$&`, `=` in approval page and reminder (readable, no live link, no template text pasted in, no literal `&amp;`) | N3, L1, T29, T41 | Screenshots of approval emails and reminders | | | NOT RUN |
| X7 | Gmail Limit Wait Time exists? Status shown at the limit; decline versus timeout output | V9, design 9.3 | Screenshot of node options and execution status | | | NOT RUN |
| X8 | Count of Waiting executions after T17 (and the count left at each reset) | design 14.5 | Executions tab filter shots; count: __ | | | NOT RUN |
| X9 | A failure inside W3 reaches the shared alert (scheduled W2 calling a failing W3 copy) | V13, T30 | Slack alert text | | | NOT RUN |
| X10 | Duplicate invoice row stops W3 (`found` false, `row_count` 2) | M3 | Exec ID, "Check invoice now" output | | | NOT RUN |
| X11 | Only a real scheduled failure proves the Slack alert; manual runs prove only Error status and the log row | T30, 14.5 | Statement in this report once T30 is run or marked skipped | | | NOT RUN |
| X12 | Late Approve and Decline after the guard cut-off: log row stays `timed_out` | T17 | Log shots | | | NOT RUN |
| X13 | Approve sends exactly one email; demo address only; none to owner or customer addresses | T15 | Mailbox shots | | | NOT RUN |
| X14 | Real model calls versus provider usage (hidden retries in the Anthropic node, L3) | design 11 | Provider usage before and after | | | NOT RUN |

## Verify-on-import results (design section 17, review section 7)
Owner answers these during Part 0 and Part 1 of the script. Fill "Answer" with what n8n showed.

| # | Item | Answer | Evidence | Result |
|---|---|---|---|---|
| V1 | n8n version and edition; node versions reported | | | NOT RUN |
| V2 | All three files import without errors or red nodes (W3 first) | | | NOT RUN |
| V3 | Credentials attach by name (Sheets, Gmail, Slack, LLM) | | | NOT RUN |
| V4 | Error Workflow set on all three | | | NOT RUN |
| V5 | Time zone set on all three; spreadsheet zone equal | | | NOT RUN |
| V6 | W3 "This workflow can be called by" option wording | | | NOT RUN |
| V7 | Schedule Trigger: missed-run option shown; manual Execute works | | | NOT RUN |
| V8 | Node version differences or flagged nodes | | | NOT RUN |
| V9 | Gmail send-and-wait: parameters, Limit Wait Time, output on approve / decline / timeout | | | NOT RUN |
| V10 | Gmail Create a draft: parameters, test address settable | | | NOT RUN |
| V11 | Sheets: Append or Update matching on `run_key`, `log_key`, `report_key`; Update Row with two matches; unformatted values; raw write; Always Output Data | | | NOT RUN |
| V12 | Retry On Fail ranges accepted (3 tries, 3 second wait) | | | NOT RUN |
| V13 | Execute Sub-workflow "each" with waiting off; manual W2 starts W3 runs that pause and resume; W3's own Error Workflow fires when called as a sub-workflow | | | NOT RUN |
| V14 | AI chain output shape (`output`); hidden Anthropic retries; temperature 0.2 accepted; model name | | | NOT RUN |
| V15 | Slack: channel by ID, bot a member, no appended text | | | NOT RUN |
| V16 | Instance-wide execution timeout and retention | | | NOT RUN |
| V17 | Daylight saving effect on 07:00 and 08:00 schedule fires (observable only after a clock change) | | | NOT RUN |

## Open defects
| # | Description | Severity | Owner |
|---|---|---|---|
| (none recorded; no evidence received) | | | |

## Notes (known before testing, not defects)
- **Test plan change, reported to the orchestrator:** the expiry cut-off is `approval_wait_hours + 2` hours in both W2 (sweep) and W3 (guard), so T17 needs `approval_wait_hours` = -1.9 in **both** (6 minute window) rather than "a few minutes". Alternative: back-date the log row's `claimed_at` by more than 50 hours.
- The control tabs are fixed numbers unless built as formulas (P7); W1 cases run before any invoice is paid, part-paid or renamed with changed amounts.
- N1 (quiet-day bad row, no alert) and the `(no sales)` top-customer placeholder row are documented behaviours, not defects, unless the owner decides otherwise.
- Known AI validator gaps (L3): a bare domain and a sentence that contradicts its direction can pass.
- Changes to W3 reach W2-started runs only if saved; the script uses manual W3 runs for failure injections so nothing needs saving, except T17.
- The Slack alert is proven only by a real scheduled failure (T30); manual runs prove the Error status and the log row.

**Gate 2: Owner review:** [ ] approved on ____
