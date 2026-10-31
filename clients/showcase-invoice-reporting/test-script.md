# Test Script: Invoice & Reporting (Showcase, SHOW-002)

**Stage:** 5 Test · **Written by:** qa-tester (did not build or review it) · **Date written:** 2026-10-31
**For:** the owner. **You run each case in n8n and send me the evidence. I check it against `design.md` section 14 and fill in `test-report.md`.** Until evidence arrives, every case is NOT RUN. Nothing in this script has been run by me: I have no access to your n8n.
**Where:** your Showcase n8n. Synthetic data only. Test mailbox only. **All three workflows stay switched off the whole time. You run everything with the manual "Execute workflow" button.** The only exception is the optional T30, which uses throwaway copies and needs your decision (Part 9).

**Basis:** `design.md` (T1 to T42, C1 to C13, 14.5), `build-log.md` (incl. fix pass), `review.md` (incl. re-review, section 8 notes, N1 to N3), the three workflow files, `test-data/`.

**Read this first, in four lines**
- **Never paste credentials, tokens or API keys into chat or screenshots.** Crop out the browser address bar (it shows your spreadsheet ID and instance address).
- **Test mailbox only.** The approval emails go to `owner_email`. The reminders go to `demo_recipient`. Both must be addresses you control. Do not click anything in an email that you did not expect.
- **Do not forward any approval email.** Each one carries its own approve link.
- **Anything that goes wrong is evidence, not a problem to hide.** Tell me exactly what you saw, even if it looks like your mistake.

---

## What I found while preparing this script (read before you start)

1. **The "few minutes" setting for T17 will not work on its own.** Both W2 (the sweep) and W3 (the expiry guard) treat a pending approval as expired when it is older than `approval_wait_hours` **plus 2 hours**. Setting the value to 0.1 still leaves a 2 hour window. To get a short window, set `approval_wait_hours` to **-1.9** in **both** W2 and W3 (the window is then 6 minutes). Part 6 (T17) says exactly how. I am reporting this to the orchestrator as a design/test-plan note, not a workflow defect.
2. **Frozen test date.** The data is written for **Monday 2026-11-02**. Today is 2026-10-31, so the best plan is to run the date-sensitive cases (W2/W3 and the weekly report) on **2026-11-02**. Part 0 step P9 explains the alternative (shifting every date by a whole number of weeks) and what you lose.
3. **Control tabs are fixed numbers.** Several W2/W3 cases change invoices (paid, part-paid). After that the "open balance" control will no longer match and W1 will (correctly) block. **So all W1 cases come first (Parts 3 and 4), and the invoices tab is restored before any W1 case after that.**
4. **Changes to W3 only reach runs that W2 starts if you save W3.** Where I need a W3 change, I use a manual run of W3 instead (Part 7), so nothing needs saving. The one exception is T17, which needs the changed `approval_wait_hours` saved in both W2 and W3 (and saved back afterwards).
5. **Every sent weekly run blocks a repeat of that week.** Between W1 cases you must clear the week's rows (reset recipe R1 below).

---

## Part 0: One-time prerequisites (tick each, send me "Part 0 done" plus the answers marked ?)

### Evidence conventions (used everywhere)
- **Exec ID** = the number in the workflow's Executions tab. For W2 cases also give the W3 (child) execution IDs; open the W2 run, click the "Start approval run (W3)" node and use "View sub-execution", or look in W3's Executions tab.
- **Canvas** = screenshot of the whole canvas after the run (green and red nodes visible).
- **Tab shot** = screenshot of the named Sheet tab after the run (all columns; use two shots if wide).
- **Mailbox** = screenshot of the test inbox list (subjects, times) and the opened message where named.
- **Slack** = the pasted text (or screenshot) of the post, or "nothing posted".
- Write the **time** you ran each case. I use it to match rows.

### Reset recipes (used many times)
- **R1 (reset the weekly report):** in `report_runs` delete every row under the header. In `weekly_report` delete every row whose `week_start` is `2026-10-26` (**keep the two seed rows for `2026-10-19`**). In `top_customers` delete every row under the header.
- **R2 (reset the reminder log):** in `reminder_log` delete every row under the header.
- **R3 (restore base data):** re-paste `test-data/invoices.csv`, `sales_lines.csv`, `control_sales_week.csv`, `control_open.csv` over the four source tabs (header row stays), then re-apply the three invoice name changes from step P12. Check dates are still text and the name beginning with `=` is still text.
- **R4 (clear stuck approvals):** open W3's Executions tab, filter by status **Waiting**, note how many there are (write the number down), then stop or delete each one.

### P1 to P16
- [ ] **P1. n8n version and edition** (Settings > About). Version: ______ ?
- [ ] **P2. Import order: W3 first, then W2, then W1.** Files are in `clients/showcase-invoice-reporting/workflows/`. W3 must import with no errors, or W2 cannot start it. After each import, write down any warning n8n shows (screenshot).
- [ ] **P3. Create the credentials inside n8n, with exactly these names** (never send me the values): `Google Sheets - AI Ops Expert showcase`, `Gmail - AI Ops Expert showcase`, `Slack - AI Ops Expert` (already exists from SHOW-001), `LLM - Showcase` (already exists). Select them on every node that shows a warning. Google needs both the Sheets API and the Drive API switched on in your Google Cloud project.
- [ ] **P4. Google OAuth app status?** Production / Internal / Testing (a Testing app expires after 7 days; fine for a one-week test). Status: ______ ?
- [ ] **P5. Create the spreadsheet with the 8 tabs** named `invoices`, `sales_lines`, `control_sales_week`, `control_open`, `weekly_report`, `top_customers`, `report_runs`, `reminder_log`. Paste the header rows, **lock them**, format date and key columns as Plain text and money columns as Number. Follow `test-data/README.md`.
- [ ] **P6. Load the test data:** the four source tabs from the CSVs, the two seed rows into `weekly_report` (`weekly_report_seed_prior_week.csv`), header only into `top_customers`, `report_runs`, `reminder_log`. Check: dates are left-aligned text (`2026-11-02`), money is right-aligned numbers, and the name that begins with `=` shows as text. Send me a screenshot of the first rows of `invoices` and of `control_open`.
- [ ] **P7. Control formulas (recommended).** Replace the fixed numbers in `control_sales_week` and `control_open` with the formulas in `test-data/README.md`, then check they give the same numbers as the CSV (USD sales 8509.00 / 23 lines; prior 7791.00 / 21; EUR 2490.00 / 7; open USD 16595.50 / 18, EUR 2730.00 / 4). With formulas, name-only edits and paid/part-paid changes also change the control, so W1 stays in step. If you keep fixed numbers, follow the order in this script exactly. Formula or fixed? ______ ?
- [ ] **P8. Fill the placeholders** (search each workflow for `PLACEHOLDER`): spreadsheet ID and URL; `owner_email` and `demo_recipient` (use two different addresses of yours, for example `you@gmail.com` and `you+demo@gmail.com`, so approvals and reminders are easy to tell apart); sender name; Slack summary channel ID (**a test channel**, and the Slack app invited to it); model name in both Anthropic model nodes and `model_label` in W1 Settings (must match); W2 node "Start approval run (W3)" pointed at W3.
- [ ] **P9. Set the frozen test date.** Plan A (preferred): do the date-sensitive cases on **Monday 2026-11-02**. Plan B: if you test on another day, shift every date in `invoices`, `sales_lines` and the `week_start` column of `control_sales_week` by the same number of days, **and that number must be a multiple of 7** so Monday stays Monday; run only on the Monday. You then lose the real clock-change week (T7 DST part becomes Not verified). Test date used: ______ . Plan A or B: ______ ?
- [ ] **P10. Time zone.** In each of W1, W2, W3: Workflow Settings > Timezone = your zone (the file ships with UTC). Set the spreadsheet zone (File > Settings) to the same zone. Zone: ______ ?
- [ ] **P11. Settings on each workflow:** Error Workflow = `SHARED | Error Alert ...` on **all three** (tick this before anything else; a missing one means failures are silent); "Save failed production executions" On; "Save manual executions" On; W1 and W2 timeout 5 minutes, **W3 timeout left empty**; W3 "This workflow can be called by" = W2 only (wording may differ). Send me a Settings screenshot for each of the three.
- [ ] **P12. Hostile names, before the first W2 run.** In the `invoices` tab change only `customer_name` on three rows: **INV-1002** to `Smith & Sons`; **INV-1003** to `<a href="http://example.com">Click here</a> Ltd`; **INV-1007** to `Dollar $& Sons`. (INV-1015 already holds the instruction text and INV-1016 the `=` name.) Keep the column Plain text so none of them turns into a formula or link. Do **not** do this until Part 4 is finished (it changes W1 only through names, but keep the W1 phase clean).
- [ ] **P13. Set a spend limit at the AI provider** and a short execution retention in n8n. Limit: ______ ?
- [ ] **P14. Cost "before" figure:** open the provider usage page (the account behind `LLM - Showcase`). Write down today's requests, tokens in and out, and cost so far. Screenshot (crop account details). Time: ______
- [ ] **P15. Instance address.** Make sure the approval link in the emails opens in your browser (the instance address must be reachable from where you read email). Reachable? ______ ?
- [ ] **P16. Nothing is activated.** Screenshot of the workflow list showing all three as inactive.

---

## Part 1: Look-and-see checks, no runs needed (T32 and verify-on-import)

### T32. Structural check
**Do:** open W3 on the canvas. Click "Send reminder to test address". Look at the connections going into it. Open W2 and look for any Gmail or Slack node. Search W3 for the word `customer_email`. Check the sticky note on each workflow is present.
**Expect:** the Send node has exactly **one** line coming in, from the **top (true) output** of "Still unpaid and unchanged? (false = stop)". W2 has no Gmail or Slack node. `customer_email` does not appear in W3. Each workflow has its "read me first" sticky note. The Error Workflow shows a real workflow (the file holds a placeholder; you replaced it in P11).
**Evidence:** screenshot of W3 canvas with the Send node's incoming line visible; screenshot of the Search result; screenshot of the W2 canvas overview.
**Pass if:** all four hold. Also ask the orchestrator to attach the lint output (`node scripts/lint-workflow.mjs`) for the report; I treat lint as separate evidence.
Result: [ ] pass [ ] fail [ ] not run · Notes: ______

### V-list: record these as you go (they decide pass or fail later)
Write the answer in the table in `test-report.md` section "Verify-on-import". For each, a short answer plus a screenshot where named.
- V1 n8n version and edition. V2 all three imported without errors or red nodes (screenshot of any warning). V3 credentials attached by name. V4 Error Workflow set on all three. V5 time zone on all three and on the sheet.
- V6 W3 "can be called by" option wording. V7 Schedule Trigger: shows the missed-run option? Does the manual "Execute workflow" start it? V8 the node versions n8n reports for any node it upgraded or flagged.
- V9 Gmail "Ask owner to approve": does it have **Limit Wait Time** (X7)? V10 Gmail "Create decline draft": parameters accepted, test address settable as recipient.
- V11 Google Sheets: Append or Update matches on `run_key`, `log_key`, `report_key`; Update Row when two rows match; unformatted-values option present; raw write option present; Always Output Data present on the read nodes.
- V12 Retry settings accepted (3 tries, 3 second wait). V13 Execute Sub-workflow: "run once for each item", waiting off; does a manual W2 run start W3 runs that pause and resume (X3)?
- V14 AI chain output shape (look at a real run's "AI commentary, try 1" output: is the result under `output`?); hidden retries in the Anthropic node; model accepts temperature 0.2.
- V15 Slack posts to the channel by ID; no appended link or "sent automatically" text.
- V16 Instance-wide execution timeout and retention (ask the admin). V17 Does the daylight-saving change shift the 07:00 and 08:00 schedule fires (docs are silent; only observable after a clock change; mark Not verified if you cannot see it).

---

## Part 2: Safe run order (overview)

| Order | Part | What | Why here |
|---|---|---|---|
| 1 | 1 | T32 and V-list (no runs) | Free, finds import problems first |
| 2 | 3 | W1 normal runs: **T1 first (smoke test, stop if it fails)**, then T6 and the AI direction cases | Needs the untouched base data |
| 3 | 4 | W1 mismatch, empty, odd-data and bad-row cases | Same reason; each case ends by restoring the data |
| 4 | 5 | AI forced-reply cases C8 to C13 (T12) | W1 with pinned fake replies |
| 5 | 6 | W2 and W3: P12 renames, then the first scan and its follow-ups (T14 to T21, T29, T33 to T36, T39, T41, T42) | Changes invoices, so after all W1 cases |
| 6 | 7 | Manual W3 runs (T18, T24, T23, T25, X10) | Needs hand-made log rows |
| 7 | 8 | T17 timeout, T28 cap, T40 duplicates, T27 W2 and N1, T31 | Change settings; restore after each |
| 8 | 9 | Failure injections in W1 (T9, T13, T26) and the optional scheduled-failure test (T30) | Last, because they break things on purpose |
| 9 | 10 | Cost, executions, restore, cleanup | Close-out |

**Stop rule.** If T1 fails (any red node, no report row, no email or no Slack post), stop and send me the evidence. Do not run anything else until I reply.

---

## Part 3: W1, the weekly report, normal runs

**How to run W1:** open W1, click **Execute workflow** (it starts at "Weekly start"). The AI step can take up to a minute. On a manual run you do not have to wait for Monday 07:00; the report week is worked out from today (Monday 2026-11-02 gives 2026-10-26 to 2026-11-01).

### Before any W1 case: write down your expected directions
For the AI cases (C1 to C7) write what you expect **before** running: for each currency, is sales up/down/flat, overdue amount up/down/flat, overdue count up/down/flat? The tool computes the true direction itself; I compare the commentary with it and with your label.

### T1 happy path, with T5, T8, T10, T11 and C4 in the same run (SMOKE TEST)
**Setup:** base data, seed rows as shipped, R1 done. Commentary on.
**Your expected directions (write before):** USD sales ______ overdue amount ______ overdue count ______ · EUR overdue amount ______ count ______ (EUR sales should not be offered because the prior week is zero).
**Do:** run W1.
**Expect (T1):** execution Success. Figures equal `expected-figures.md`: USD sales 8509.00 in 23 lines (prior 7791.00 in 21), open balance 16595.50 in 18 invoices, ageing 2490.00 / 3100.50 / 6405.00 / 4600.00; EUR sales 2490.00 in 7 lines, open 2730.00 in 4. Two `weekly_report` rows, `top_customers` rows (5 per currency), `report_runs` row `sent`, one email in the owner inbox, one Slack post.
**Expect (T5):** USD and EUR in separate rows, never added together.
**Expect (T8):** EUR `change_pct` shows `n/a` (prior is 0). Where a currency falls, the change is negative and shown correctly (USD does not fall in the base data, so note "no falling currency in this run": a falling case comes from the variant C run in T4).
**Expect (T10):** Slack text has totals only, no customer names, **no AI commentary**. Email has no customer email addresses. Email and Slack numbers agree with the sheet.
**Expect (T11 / C4):** commentary is valid, contains **no digits**, each direction equals the computed direction, it is labelled as AI-written, and the "Prepare aggregates for AI" output shows only field labels and numbers (no names). **No EUR `sales` item** appears (C4).
**Evidence:** Exec ID; Canvas; Tab shots of `weekly_report`, `top_customers`, `report_runs`; the email (open it and screenshot); Slack text; screenshot of the output of "Compare with control totals" and "Build figures"; screenshot of "Prepare aggregates for AI" output and "Set commentary text" output; the `report_runs` row (shows `commentary_status`, `confidence`, `model`, `prompt_version`).
**Pass if:** every figure matches `expected-figures.md` to the cent and the items above hold.
- T1 Result: [ ] pass [ ] fail [ ] not run · Exec ID: ______
- T5 / T8 / T10 / T11 / C4: [ ] pass [ ] fail [ ] not run (same Exec ID)

### T6 duplicate run (and the duplicate-row key)
**Do:** straight after T1 (do **not** reset), run W1 again.
**Expect:** execution Success (green) but nothing new is sent: no second email, no second Slack post, no new rows in `weekly_report` or `top_customers`. `report_runs` gets one extra row with status `duplicate_run` and a `run_key` that looks like `2026-10-26|dup|<execution id>` (the fix-pass change). The original `sent` row is unchanged.
**Evidence:** Exec ID; Canvas (ends at "Log duplicate run"); Tab shot of `report_runs` (both rows, `run_key` column visible); mailbox showing still one report email; Slack unchanged.
**Pass if:** all of the above, and the `run_key` of the new row contains `|dup|`.
Result: [ ] pass [ ] fail [ ] not run · Exec ID: ______

**Now do R1.**

### C1 and C5: sales up, overdue down; two currencies moving opposite ways
**Setup:** in `weekly_report` change the seed row `2026-10-19|USD`: `overdue_balance` to `20000.00`, `overdue_count` to `20`. Leave the EUR seed row as shipped (EUR overdue was 500.00 / 1, now 2280.00 / 3, so up).
**Your expected directions (write before):** ______
**Do:** run W1.
**Expect:** USD: sales up, overdue amount down, overdue count down. EUR: overdue amount up, count up, no sales item. Each commentary item names its currency (C5). No concentration remark (that metric is dropped by design).
**Evidence:** Exec ID; "Prepare aggregates for AI" output; "AI commentary, try 1" output; "Set commentary text" output; the email; `report_runs` row.
**Pass if:** commentary directions equal the computed ones and your labels, no digits, status `ok`.
C1: [ ] pass [ ] fail [ ] not run · C5: [ ] pass [ ] fail [ ] not run · Exec ID: ______
**Then R1. Put the USD seed row back to `4000.00` / `8`.**

### C2 and T4 variant C: sales down, overdue up; empty week
**Setup:** replace `sales_lines` with `variants/C_empty_week_sales_lines.csv` and `control_sales_week` with `variants/C_empty_week_control_sales.csv`. (If you built formulas, only replace `sales_lines`.)
**Expect:** a zero-value report **is** published, because the control also says 0. USD sales 0.00 in 0 lines, prior week 7791.00, so sales **down** (100 percent); EUR sales flat (0 and 0). Open balances unchanged. The commentary says USD sales fell and overdue rose; a top-customers placeholder row `(no sales)` with rank 0 appears for a currency without sales (known behaviour; it is not a customer).
**Evidence:** Exec ID; Canvas; Tab shot of `weekly_report`, `top_customers`; the email; "Prepare aggregates for AI" output.
**Pass if:** published with zero sales, control did not block, directions match.
T4 (C): [ ] pass [ ] fail [ ] not run · C2: [ ] pass [ ] fail [ ] not run · Exec ID: ______
**Then R1 and R3 (sales_lines and control_sales_week back to base).**

### C3 flat
**Setup:** in the two seed rows set USD `overdue_balance` `14105.50`, `overdue_count` `15`; EUR `overdue_balance` `2280.00`, `overdue_count` `3` (equal to this week).
**Expect:** overdue amount and count **flat** for both currencies. USD sales stays up (the shipped data cannot make USD sales flat); note this limit in your message. EUR sales not offered.
**Evidence:** as C1.
C3: [ ] pass [ ] fail [ ] not run · Exec ID: ______ · Note: sales-flat for USD is not reachable with the shipped data (part of C3 therefore **not verified** unless you build a custom week).
**Then R1 and restore the seed rows to the shipped values.**

### C6 one customer dominates (nothing about concentration may appear)
**Setup:** in `sales_lines` change `customer_name` to `Sample Customer D` on **every** current-week USD row (dates 2026-10-26 to 2026-11-01). Names only; do not touch amounts. (With formula control tabs nothing else changes.)
**Expect:** run succeeds; the commentary says nothing about one customer or concentration; top customers shows D with the whole week.
**Evidence:** Exec ID; "AI commentary, try 1" output; the email; `top_customers` shot.
C6: [ ] pass [ ] fail [ ] not run · Exec ID: ______
**Then R1 and R3.**

### C7 all zero (custom setup, optional)
**Setup:** `sales_lines` and `control_sales_week` from variant C; in `invoices` keep **only the paid rows** (delete every open row; credit note too); set both `control_open` rows to `0.00` and `0`; both seed rows' `overdue_balance` and `overdue_count` to `0`.
**Expect:** a zero report; commentary either `off_no_metrics` (no call) or flat statements only; no crash.
**Evidence:** Exec ID; `report_runs` row; the email.
C7: [ ] pass [ ] fail [ ] not run (skip allowed: tell me) · Exec ID: ______
**Then R1 and R3 and restore the seed rows.**

### T37 currency with no rows (variant I)
**Setup:** replace `sales_lines` and `control_sales_week` with the two `variants/I_eur_no_sales_this_week_*` files.
**Expect:** report passes with a zero EUR sales row (not blocked by the currency rule); EUR sales 0.00 in 0 lines.
**Evidence:** Exec ID; Canvas; `weekly_report` shot (EUR row zero); "Control totals match?" output.
Result: [ ] pass [ ] fail [ ] not run · Exec ID: ______
**Then R1 and R3.**

### T38 ageing split bug (variant H)
**Setup:** replace `invoices` with `variants/H_tier_shift_invoices_INV-1004_due_7_days_ago.csv`. (If your control tabs are formulas they follow the invoices; the open total and count are unchanged anyway.)
**Expect:** the control **passes** (it cannot see the split) and the report is published, but the ageing figures differ from `expected-figures.md`: USD 1-7 becomes 5300.50 and 8-30 becomes 4205.00 (INV-1004, 2200.00, moved from the 8-30 bucket into the 1-7 bucket). The check that catches it is the hand comparison, which is what this case documents.
**Evidence:** Exec ID; `weekly_report` shot (ageing columns); your hand comparison against `expected-figures.md`.
**Pass if:** control passed, report sent, and the ageing difference is what I describe. (The case proves the live control does not cover the split; it is not a defect.)
Result: [ ] pass [ ] fail [ ] not run · Exec ID: ______
**Then R1 and R3.**

### T7 (W1 part) week edges
**No extra run.** Use the T1 run: lines dated 2026-10-25 (Sun), 10-26 (Mon), 11-01 (Sun), 11-02 (Mon) must land in the right week, and the T1 totals matching `expected-figures.md` proves it. T7's tier boundary and clock-change parts are in Part 6.
T7 (W1 part): [ ] pass [ ] fail [ ] not run (same Exec ID as T1)

### T41 and T29, W1 side: hostile customer names in the weekly report
**Setup:** in `sales_lines` rename **all** rows of `Sample Customer D` to `=SUM(1+1) Hostile D`, and all rows of `Sample Customer F` to `Smith & Sons <a href="http://example.com">x</a>`. Keep the column Plain text so the sheet does not convert them. (Names only; totals are unchanged.)
**Expect:** run succeeds. In `top_customers` the `=SUM(...)` name is stored and shown as **text**, not as a formula result (cell shows `=SUM(1+1) Hostile D`, not `2`). The email (plain text) shows the names as plain text. The Slack post has no names at all. The AI input has no names.
**Evidence:** Exec ID; `top_customers` shot with the cell clicked (formula bar shows text starting with an apostrophe or plain text); the email; the Slack text; "Prepare aggregates for AI" output.
T41 (W1 part): [ ] pass [ ] fail [ ] not run · T29 (W1 part): [ ] pass [ ] fail [ ] not run · Exec ID: ______
**Then R1 and R3.**

### T22 odd cell types
**Setup (three small edits in `invoices`, base data otherwise):** (a) on **INV-1018** format `due_date` as a real **Date** cell (still showing 2026-11-22); (b) on **INV-1017** replace `balance` with a formula `=H18-I18` (amount minus paid, matching your row numbers); (c) leave the rest.
**Expect:** the workflow reads unformatted values. The formula balance reads as a number. The Date cell either reads correctly or is **rejected as bad data and the control then blocks the run with "Report blocked"** (safe and loud). Record which. It must not crash with an unhandled error. `2026-02-30` (variant F, in the bad-row cases below) must fail validation.
**Evidence:** Exec ID; Canvas; `report_runs` row; which of the two outcomes happened.
T22: [ ] pass [ ] fail [ ] not run · Exec ID: ______ · Outcome seen: ______
**Then R1 and R3. (An empty read is covered by T4 variant D.)**

---

## Part 4: W1, bad data and mismatches (each must end in Error with the right message)

For each: set up the data, run W1, expect the execution status **Error**, the stop message **"Report blocked: control total mismatch (<currency>, <metric>)"** (no customer names in it), `report_runs` row `blocked_mismatch` with metric and difference only, **no rows** written to `weekly_report` or `top_customers`, **no email**, **no Slack post**. A manual run does **not** send the Slack alert; that is T30.
**Evidence for each:** Exec ID (status Error); Canvas; the "Report blocked" node's error text; `report_runs` row; Tab shot showing `weekly_report` and `top_customers` unchanged; mailbox and Slack unchanged.
After each case: restore with R3, and the `blocked_mismatch` row does not block a repeat, so R1 is only needed after a case that sent.

- **T2 (variant A):** replace `invoices` with `variants/A_invoices_text_in_amount.csv` (one `amount` cell holds `N/A`). Also confirm the run did not crash on the text cell (it is counted as a bad row). Result: [ ] pass [ ] fail [ ] not run · Exec ID: ______
- **T3 (variant B):** replace `control_sales_week` with `variants/B_control_sales_off_by_0.01.csv`. The detail names the metric (USD sales) and a difference of one cent. Result: [ ] pass [ ] fail [ ] not run · Exec ID: ______ (if your control is a formula, edit the USD `sales_total` for 2026-10-26 by hand by 0.01)
- **T27 W1 part (three runs):** (a) `E_unknown_currency_invoices.csv` (GBP row); (b) `F_malformed_date_invoices.csv` (`2026-02-30`); (c) `J_negative_balance_invoices.csv`. Each is blocked. Results: E [ ] pass [ ] fail [ ] not run · F [ ] pass [ ] fail [ ] not run · J [ ] pass [ ] fail [ ] not run · Exec IDs: ______ / ______ / ______
- **T40 W1 part (variant G):** `G_duplicate_invoice_no_invoices.csv` (INV-1005 twice). Both rows are bad data, so the run is blocked. Result: [ ] pass [ ] fail [ ] not run · Exec ID: ______

### T4 variant D, plus the stuck-run rule (M1)
**Setup:** replace `invoices` with `variants/D_empty_source_invoices_header_only.csv` (header only). R1 done.
**Do 1:** run W1.
**Expect 1:** Error "Source returned no rows" (the empty read must not slip through as a blank row). `report_runs` row for the week now shows status **`failed`** (fix pass: "Mark run failed (no source rows)"). Nothing written, nothing sent.
**Do 2:** restore `invoices` (R3) **without** touching `report_runs`, run W1 again **straight away**.
**Expect 2:** the repeat runs normally (a `failed` row does not block): a full report, `report_runs` one row `sent`. This is the "re-run after a failed week" proof.
**Do 3 (stale `running` rule, N-free):** R1. Add one row by hand in `report_runs`: `run_key` `2026-10-26`, `status` `running`, `started_at` = **now** as text like `2026-11-02T09:15:00+00:00` (your zone offset). Run W1. **Expect:** blocked as already running: a `duplicate_run` row, nothing sent. Now edit that row's `started_at` to **at least 31 minutes earlier** and run W1 again. **Expect:** the week is claimed again and a full report is produced (the old `running` row is treated as dead). If you prefer the literal version, leave the first row for 30 minutes and run again.
**Evidence:** Exec IDs for each run; `report_runs` shots after each step; Canvas of each.
T4 (D): [ ] pass [ ] fail [ ] not run · Exec IDs: ______ / ______
Stuck-run rule (X5): [ ] pass [ ] fail [ ] not run · Exec IDs: ______ / ______
**Then R1.**

---

## Part 5: AI forced replies, C8 to C13 (this is T12)

**What this is:** the model is never asked for these bad answers. You force them by "pinning" a fake reply on the AI step, so my check can be shown to reject them. Pinned data replaces what the node returns. **Never press Save on W1 while anything is pinned. Unpin after each case.**

**First get the real shape.** From the T1 or C1 run, open "AI commentary, try 1", copy its output shape (the parsed object sits under `output`; V14 says whether that is right). Use that same shape for the fake replies below. Replace only the fields I list. If the real shape differs from what I describe, use the real shape and tell me.

**Setup for every case:** base data, seed rows as shipped, R1 done, commentary on. Pin **both** "AI commentary, try 1" and "AI commentary, repair try" with the same bad reply (so the repair also fails). Run W1. Then unpin both and do R1.

**Expect for every case:** the report is still sent (1 email, 1 Slack post, rows written), the email says "AI commentary not available this week", `report_runs.commentary_status` is `omitted_invalid` (or `omitted_low_confidence` for C10; record which you see), `commentary_output` holds the rejected text, no crash. Because the nodes are pinned, **no real model call is made**.

**Evidence for each:** Exec ID; Canvas (shows the repair path was taken); output of "Check commentary 1" and "Check commentary 2" (the reason code); `report_runs` row; the email text.

Fake replies, change the listed field in an otherwise valid reply (a valid reply has `headline`, `items` of 1 to 4 with `currency`, `metric_key`, `direction`, `note`, plus `confidence` 0 to 1 and `reason`):
| Case | Change |
|---|---|
| C8 digits | `note`: `Sales rose by 12 this week.` |
| C9 wrong direction | an item `USD`, `sales`, `direction` `down` (the true direction is up) |
| C10 low confidence or missing field | `confidence` `0.30`; run it, then run again after removing the `reason` field (two runs) |
| C11 link or markdown | `note`: `See http://evil.example/x for details.`; then a second run with `Visit evil.com now` (known weak spot: the review expects this to pass; record what happens) |
| C12 spelled-out numbers | `note`: `Sales doubled compared with last week.` |
| C13 prior week zero with a forced up | an item `EUR`, `sales`, `direction` `up` (EUR sales was not offered because the prior week is zero) |

Results (one line each): C8 [ ] pass [ ] fail [ ] not run Exec ______ · C9 [ ] pass [ ] fail [ ] not run Exec ______ · C10 [ ] pass [ ] fail [ ] not run Exec ______ / ______ · C11 [ ] pass [ ] fail [ ] not run Exec ______ / ______ · C12 [ ] pass [ ] fail [ ] not run Exec ______ · C13 [ ] pass [ ] fail [ ] not run Exec ______
**T12 (AI invalid, report still sent, one repair):** [ ] pass [ ] fail [ ] not run (judged from C8 to C13; also confirm a bad format reaches the repair step)

**Pass rate for the commentary set:** I record C1 to C13 as x of 13 matched; C3 and C7 may be partly covered (see notes above).

---

## Part 6: W2 and W3, the daily scan and the approvals

**Before this part:** all W1 cases are done (or you accept losing them). Do **P12** (the three renames). Do **R2** (empty reminder log) and **R4** (no Waiting runs; note how many were there). Leave `max_drafts_per_run` at 10 and `approval_wait_hours` at 48 in both W2 and W3. Test date must be the frozen date (P9). Open the test mailbox in a window you can watch.

**How to run W2:** open W2, click **Execute workflow**. The scan finishes in seconds; the approvals then wait as separate W3 runs (status **Waiting** in W3's Executions tab). Each approval email has subject `Approve reminder for invoice INV-xxxx` and buttons Approve and Decline. The email shows the invoice, balance still owed, days past due, level, the test address and the reminder text.

### Run D1: the first scan ever (empty log), T20 first-run part, T14, T7, T35, T34, T28 burst, X3
**Do:** run W2 once. Do not click anything in the emails yet.
**Expect:**
- No error on the empty log; every overdue invoice passes "Already handled this level?" as "In A only" (T20 first-run part).
- `reminder_log` gets **three `skipped_no_email` rows** (INV-1013, INV-1014, INV-1104) written once (T35), no approval for them.
- **Ten** claim rows `pending` (the first ten eligible in sheet order): INV-1002 t1, 1003 t1, 1004 t2, 1005 t2, 1006 t3, 1007 t3, 1008 t2, 1009 t1, 1010 t2, 1011 t1. INV-1001 (0 days) has no row. INV-1017, 1018 and 1102 (not yet due) have no row. The credit note CN-2001 and void INV-1023 have no row (T34). INV-1012, 1015, 1016, 1101, 1105 have no row yet (cap of 10; they wait for the next scan, T28 burst part).
- Tiers (T14, T7): 0 days none; 1 and 7 days t1; 8 and 30 days t2; 31 days t3 (1002/1003 t1; 1004/1005 t2; 1006 t3).
- Ten approval emails arrive. **None of the ten simultaneous W3 starts fail with a Sheets error** (burst check).
- Ten W3 runs show status Waiting.
- The W2 execution ends in **Success** (no bad rows in the base data).
- **X3:** click "Start approval run (W3)" and look at its output panel: does it show items (one per started invoice)? Record yes or no. (If it shows nothing, the end-of-run alert only fires when a duplicate claim happens; N1.)
**Evidence:** W2 Exec ID; Canvas; Tab shot of `reminder_log` (all rows, columns `log_key`, `status`, `tier`, `days_past_due_at_claim`, `claimed_at`, `scan_execution_id`, `note`); screenshot of the "Days past due and level" output; mailbox list (ten approval emails); W3 Executions tab filtered to Waiting (count); the "Start approval run (W3)" output panel; the ten W3 execution IDs (or the list screenshot).
T20 (first-run part): [ ] pass [ ] fail [ ] not run · T14: [ ] pass [ ] fail [ ] not run · T7 (tier part): [ ] pass [ ] fail [ ] not run · T35: [ ] pass [ ] fail [ ] not run · T34: [ ] pass [ ] fail [ ] not run · T28 (burst part): [ ] pass [ ] fail [ ] not run · X3: [ ] yes [ ] no [ ] not run
Exec IDs: W2 ______ · W3 children ______

**T7 clock-change note:** the clock-change week is the report week in W1 (date 2026-11-01). Record whether the T1 weekly figures were right on the frozen date (T7 W1 part) and whether the day counts above are right. The shift between daylight and standard time is not otherwise testable. Mark the DST part **Not verified** if you used Plan B.

### The ten approvals: what to do with each (do them in this order)
| Invoice | Level | Do | Expect |
|---|---|---|---|
| 1002 | t1 | **T42:** open the email in the Gmail list/preview only, do not click a button. Wait 5 minutes. Look at W3's execution for 1002 and the log row. Then click **Approve** | During the wait: run still **Waiting**, log row still `pending`. After Approve: exactly one reminder arrives at the **demo** address; the body shows `Smith & Sons` correctly (not `&amp;`); log `sent` |
| 1004 | t2 | **T15:** click **Approve** | Exactly **one** reminder at the demo address, none at the owner address, none to the customer address (`customer.b@example.com`/`customer.d@example.com` are never used); child Success; log `sent`, `approver_decision` approved |
| 1006 | t3 | **T16:** click **Decline** | Nothing sent; log `declined`; a draft appears in Gmail drafts, made by "Create decline draft", states the test address; the child ends Success |
| 1007 | t3 | **L1 check:** click **Approve** | One reminder; body shows `Dollar $& Sons` exactly (no template text pasted in); log `sent` |
| 1010 | t2 | **T33:** click **Approve** | Reminder shows **600.00** (balance), not 1000.00 (amount) |
| 1005 | t2 | **T39 (tier move):** first, in `invoices` change INV-1005 `due_date` from `2026-10-03` to `2026-10-02` (31 days past due). Then click **Approve** | Nothing sent; log `stopped_changed` |
| 1008 | t2 | **T39 (partial payment):** first, in `invoices` set INV-1008 `amount_paid` to `100.00` and `balance` to `880.00`. Then click **Approve** | Nothing sent; log `stopped_changed` |
| 1011 | t1 | **T19 (paid after approval):** first set INV-1011 `status` to `paid`, `amount_paid` `700.00`, `balance` `0.00`, `paid_date` `2026-11-02`. Then click **Approve** | Nothing sent; log `stopped_paid` |
| 1003 | t1 | **Leave unanswered for now** (used for T36 below) | Stays `pending`, Waiting |
| 1009 | t1 | **Leave unanswered for now** (used for T20 and T21 below) | Stays `pending`, Waiting |

**Evidence per answered invoice:** the child Exec ID (and its Canvas showing the path taken); the `reminder_log` row after; the mailbox (reminder or nothing); for 1006 the draft; for 1002 the preview screenshot plus the W3 status before clicking. For the four invoices with names (1002, 1003, 1007, and later 1015/1016) **also screenshot the approval email text and the reminder text** (N3: the approval page must show the text readably, with no literal `&amp;`, no live link for 1003; the reminder is plain text).
**Totals to check at the end of this table:** exactly **4 reminders** sent (1002, 1004, 1007, 1010).
T15 [ ] pass [ ] fail [ ] not run · T16 [ ] pass [ ] fail [ ] not run · T19 [ ] pass [ ] fail [ ] not run · T33 [ ] pass [ ] fail [ ] not run · T39 (partial) [ ] pass [ ] fail [ ] not run · T39 (tier move) [ ] pass [ ] fail [ ] not run · T42 [ ] pass [ ] fail [ ] not run
N3 approval page readable (&, link, $&): [ ] pass [ ] fail [ ] not run · L1 `$&` correct in reminder: [ ] pass [ ] fail [ ] not run

### Run D2: second scan, same day (T20, T21, T36, T29, T41)
**Do 1 (T36 part 1, T21, T20 repeat):** in `invoices` change INV-1003 `due_date` from `2026-10-26` to `2026-10-25` (8 days past due, so level t2). Run W2.
**Expect 1:** **no** new approval for the ten D1 keys (no second email for them); INV-1003 is **not** asked again at t2 because its t1 approval is still pending (no new `INV-1003|t2` row); INV-1009 and the other pending ones are not duplicated. The five unclaimed invoices (1012, 1015, 1016, 1101, 1105) **are** now claimed: five new approval emails. The three `skipped_no_email` rows are **not** written again (still exactly three). No duplicate `log_key` anywhere in the log.
**Evidence 1:** W2 Exec ID; Canvas; `reminder_log` shot (count rows per `log_key`); the mailbox (five new approvals, none for D1 invoices).
T20 (same-day repeat): [ ] pass [ ] fail [ ] not run · T21: [ ] pass [ ] fail [ ] not run · T35 (once only): [ ] pass [ ] fail [ ] not run · Exec ID: ______

**Do 2 (T36 part 2):** click **Decline** on the INV-1003 t1 email. Run W2 again.
**Expect 2:** a new `INV-1003|t2` row `pending` and one new approval email (escalation allowed after t1 is resolved); nothing else new. Decline that email too.
T36: [ ] pass [ ] fail [ ] not run · Exec ID: ______

**Answer the new approvals:**
| Invoice | Do | Expect |
|---|---|---|
| 1015 (instruction name) | **T29:** Approve | One reminder to the demo address; the name appears only as plain text; no other effect; routing unchanged; the name is **not** in any AI input (W1 evidence) |
| 1016 (`=` name) | **T41:** Approve | Reminder shows the name as text; the log has no names; the sheet cell (if you look in `invoices`) is still text |
| 1012, 1101, 1105 | Decline | `declined`; drafts created |

**Left pending on purpose for the stop test in Part 8:** INV-1009 (pending). Everything else is resolved.
T29 (W2/W3 part): [ ] pass [ ] fail [ ] not run · T41 (W3 part): [ ] pass [ ] fail [ ] not run · Exec IDs: ______

**Waiting runs at this point:** open W3 Executions filtered to Waiting. Expect one (INV-1009). Write the number: ______

**Check the log by eye (T20 final):** `reminder_log` has exactly one row per `log_key` and every status is one of the allowed ones. T20 "next day" repeat: only if you can run again on the next calendar day (tiers will have moved by a day; re-derive them). Otherwise write "next-day part not verified".

---

## Part 7: Manual W3 runs (T18, T24, X10, T23, T25)

**How:** these test W3 alone. For each, do two things: (1) add a hand-made row in `reminder_log` (the "claim" W2 would have made): `log_key` like `INV-1012|t2`, `invoice_no`, `tier`, `status` `pending`, `claimed_at` = **now** as text like `2026-11-02T09:15:00+00:00`, `currency`, `balance_at_claim`; (2) open W3, click the first node "Start from daily scan", and type the test input `invoice_no`, `tier`, `log_key` (the same values as the row), then **Execute workflow**. Do not save W3. If the editor does not let you run W3 alone with typed input, or a waiting approval cannot pause and resume in a manual run, stop and tell me; the affected cases are then **Not verified** (V13). Use invoices that have been resolved already (the pending-row guard needs a fresh hand-made row).
Pinned data: if you pin anything here, unpin after, and never save W3 while pinned.

### T18 paid before the approval email
**Do:** set INV-1012 `status` `paid`, `amount_paid` `900.00`, `balance` `0.00`, `paid_date` `2026-11-02`. Add the pending log row `INV-1012|t2`. Run W3 with `INV-1012`, `t2`, `INV-1012|t2`.
**Expect:** no approval email; log `stopped_paid`; path ends at "Log stop before asking".
**Evidence:** Exec ID; Canvas; `reminder_log` row; mailbox (no new approval).
Result: [ ] pass [ ] fail [ ] not run · Exec ID: ______
**Then restore INV-1012 to open (`amount_paid` 0, `balance` 900.00, status open, empty paid_date).**

### T24 garbled approval response
**Do:** add a fresh pending row for `INV-1012|t2` (delete the old row first). Run W3 until it waits for the approval. Then (using a second run) pin the output of "Ask owner to approve" with the real output shape but with the field `approved` set to the text `maybe` (look at a real approval output from a T15 child to copy the shape). Run again.
**Expect:** treated as **not approved**: "Approved? (false = declined or no answer)" takes the false path; nothing sent; log `declined` (or `timed_out`/`declined_or_timeout`).
**Evidence:** Exec ID; Canvas; "Approved?" output; mailbox (no reminder); log row.
Result: [ ] pass [ ] fail [ ] not run · Exec ID: ______ · **Unpin afterwards.**

### X10 duplicate invoice row stops W3 (M3)
**Do:** add a second row to `invoices` with the same `invoice_no` as INV-1012 (copy the row). Delete the old log row, add a fresh pending row `INV-1012|t2`. Run W3.
**Expect:** the invoice is judged "not found" (not exactly one row): no approval email; log `stopped_changed` or `stopped_paid` (record which); path ends at "Log stop before asking".
**Evidence:** Exec ID; "Check invoice now" output (`found` false, `row_count` 2); log row; mailbox.
Result: [ ] pass [ ] fail [ ] not run · Exec ID: ______ · **Then delete the duplicate row.**

### T23 send failure (no retry, no double send)
**Do:** create a Gmail credential named `Gmail - WRONG TEST` (do not connect it, or connect and then revoke it). Fresh pending row `INV-1012|t2`. In W3, on the node **"Send reminder to test address"** only, select the wrong credential (leave "Ask owner to approve" on the real one). Run W3, click **Approve** in the email.
**Expect:** the send fails **once** (no retry), log `send_failed`, "Reminder send failed" ends the run in **Error**. No reminder in the demo inbox. Exactly one failed attempt shown.
**Evidence:** Exec ID; Canvas (red at the Send node, then "Log send failure", then "Reminder send failed"); log row; mailbox.
Result: [ ] pass [ ] fail [ ] not run · Exec ID: ______
**Then put the real credential back on the Send node (do not save).**

### T25 log write failure after the send
**Do:** fresh pending row. In W3, on the node **"Log sent"** only, replace the document ID with the text `NOT-A-REAL-ID` (do not save). Run W3 and click **Approve**.
**Expect:** the reminder **is** sent (one email); "Log sent" retries with a wait and then stops loudly: run ends in **Error**; the log row still says `pending` (owner reconciles).
**Evidence:** Exec ID; Canvas; the demo inbox (one reminder); `reminder_log` (still pending); the error text.
Result: [ ] pass [ ] fail [ ] not run · Exec ID: ______
**Then undo the change (do not save). Fix the log row by hand (set it to `sent`) so it does not confuse later cases.**

---

## Part 8: Settings-change cases (each ends with a restore)

### T17 no answer / timeout, X7, X8 (Waiting count)
**Do (setup):** do R2 and R4 (note the Waiting count it started with). Restore INV-1012, 1011, 1008 to open as in base data (`amount_paid` 0, balance equals amount, status open) and INV-1005 `due_date` `2026-10-03`, INV-1003 `due_date` `2026-10-26` (R3 does this). In **W2 and W3 Settings** set `approval_wait_hours` to **-1.9** in **both**, and in W2 set `max_drafts_per_run` to **2**. **Save W2 and W3** (still inactive). If the Gmail node has **Limit Wait Time**, also set it to 5 minutes for this test only (a fixed value, not the expression) (X7).
**Do 1:** run W2. Two approvals (INV-1002 and INV-1003 at t1). Do not click. Wait **at least 8 minutes**.
**Do 2:** run W2 again. Its sweep should mark both timed out and it claims two new ones (1004, 1005).
**Expect 2:** `INV-1002|t1` and `INV-1003|t1` now `timed_out`. Record the log.
**Do 3 (X8, before clicking anything):** open W3 Executions filtered to **Waiting**. Count. Expect the unanswered runs from both W2 runs are still Waiting (4, unless the Gmail node's Limit Wait Time ended some; record what you see and the status they show at the limit, X7).
**Do 4:** click **Approve** on the old INV-1002 email, and **Decline** on the old INV-1003 email. Wait a minute.
**Expect 4:** the late Approve sends **nothing** (no reminder); the late Decline does **not** overwrite `timed_out` and creates no draft; both W3 runs finish Success at "End: closed, nothing written".
**Do 5:** decline the two newer emails.
**Evidence:** Exec IDs (both W2 runs, the four children); `reminder_log` after Do 2 and after Do 4; the Waiting count shots (before the clicks and after); mailbox (no reminder for 1002 or 1003); drafts (none for 1003).
**Pass if:** `timed_out` stays, nothing sent, Waiting count recorded.
T17: [ ] pass [ ] fail [ ] not run · X8 Waiting count after T17: ______ · X7 Gmail wait limit behaviour: ______
**Restore:** `approval_wait_hours` back to **48 in both W2 and W3**, `max_drafts_per_run` back to **10**, Limit Wait Time back to 48 hours (or removed if you added it), **save both**. R4 (stop remaining Waiting runs), R2.
Restore done: [ ] W2 hours 48 [ ] W3 hours 48 [ ] cap 10 [ ] limit wait reset [ ] saved

### T28 blast cap
**Setup:** R2, R4, R3. W2 `max_drafts_per_run` = **2** (save W2).
**Do:** run W2; then run W2 again (stands in for the next day).
**Expect:** the first run claims 2 invoices (INV-1002, 1003) and asks twice; the second run claims the next 2 (INV-1004, 1005) and does not re-ask the first two. No Sheets call fails in the burst.
**Evidence:** both W2 Exec IDs; `reminder_log` after each run; mailbox.
Result: [ ] pass [ ] fail [ ] not run · Exec IDs: ______ / ______
**Restore:** decline all four emails; `max_drafts_per_run` back to 10 and save; R4; R2.

### T40 duplicates (variant G, and two scans together)
**Do 1:** R2, R3, replace `invoices` with `variants/G_duplicate_invoice_no_invoices.csv`. Run W2.
**Expect 1:** INV-1005 (both rows) is counted as bad data and is **not claimed**; the other eligible invoices are claimed and asked (up to the cap); no second approval for any invoice; after the approvals are started the run ends in **Error** with "n source rows skipped: bad data, m duplicate claims" (counts only). Decline all approvals afterwards.
**Do 2:** R2, R3 (base invoices). Open W2 in **two browser tabs**. Click **Execute workflow** in both within a second or two.
**Expect 2:** one claim per invoice (or both runs stop safely); no invoice gets two approval emails; the log has one row per `log_key`. If you see duplicates, report the exact rows (a rare residual window is stated in the design).
**Evidence:** Exec IDs; `reminder_log`; mailbox count per invoice.
T40 (G): [ ] pass [ ] fail [ ] not run · T40 (two scans): [ ] pass [ ] fail [ ] not run · Exec IDs: ______
**Then decline all approvals, R4, R2, R3.**

### T27 W2 part: several eligible invoices plus one bad row (X1)
**Do:** R2, R4, R3. Replace `invoices` with `variants/F_malformed_date_invoices.csv` (one bad date). Run W2. Wait for the run to finish.
**Expect:** **all** eligible approvals exist first (ten approval emails, W3 runs Waiting), and only then the W2 execution ends in **Error** "n source rows skipped...". The bad row is skipped, not claimed. This also proves what "Start approval run (W3)" emits (X3).
**Evidence:** W2 Exec ID (status Error); Canvas (shows approvals started before the Error); mailbox (ten approvals); `reminder_log`.
Result: [ ] pass [ ] fail [ ] not run · X1 [ ] pass [ ] fail [ ] not run · Exec ID: ______
Repeat quickly for variant E (GBP) and J (negative balance) if you have time; record each: E [ ] pass [ ] fail [ ] not run · J [ ] pass [ ] fail [ ] not run
**Then decline all approvals, R4, R2, R3.**

### N1 quiet day: a bad row and nothing overdue (X2)
**Setup:** R2. Replace `invoices` with this two-row tab (header stays):
```
invoice_no,doc_type,customer_name,customer_email,issue_date,due_date,currency,amount,amount_paid,balance,status,paid_date
INV-1001,invoice,Sample Customer A,customer.a@example.com,2026-10-03,2026-11-02,USD,1200.00,0.00,1200.00,open,
INV-9001,invoice,Sample Customer Z,customer.z@example.com,2026-09-01,2026-10-01,USD,N/A,0.00,100.00,open,
```
**Do:** run W2.
**Expect (as documented by the reviewer):** the run ends **green (Success)** with **no alert**, no claim, no email. The bad row is excluded silently. This is the known gap N1. If it instead ends in Error with the counts message, record that.
**Evidence:** Exec ID; Canvas; `reminder_log` (empty); the run status.
Observed: [ ] green, no alert (known gap, documented) [ ] Error with counts message [ ] not run · Exec ID: ______
**Then R3.** Result for the report: this is an **observation**, not a pass or fail; the owner decides whether to accept the gap.

### T31 W2 source outage
**Do:** R2, R3. In W2 **Settings** change the spreadsheet ID to `NOT-A-REAL-ID` (do not save). Run W2.
**Expect:** the scan stops at the first read after retries, **no approvals**, execution ends in Error.
**Evidence:** Exec ID; Canvas (red at "Read invoices"); mailbox (nothing); `reminder_log` (empty).
Result: [ ] pass [ ] fail [ ] not run · Exec ID: ______ · **Then reload W2 without saving (spreadsheet ID back).**

---

## Part 9: W1 failure injections and the real alert

### T9 W1 source read failure
**Do:** R1. In W1 **Settings** change the spreadsheet ID to `NOT-A-REAL-ID` (do not save). Run W1.
**Expect:** retries with a wait, then stops with an Error; nothing published, nothing sent. (The first read fails before any claim, so no `running` row is left.)
**Evidence:** Exec ID; Canvas; `report_runs` unchanged; mailbox and Slack unchanged.
Result: [ ] pass [ ] fail [ ] not run · Exec ID: ______ · **Then reload W1 without saving.**

### T13 AI provider failure
**Do:** R1. Create a credential `LLM - WRONG TEST` with a made-up key (`not-a-real-key`, never a real one). On **both** "Anthropic model 1" and "Anthropic model 2" select it (do not save). Run W1.
**Expect:** try 1 fails (2 tries), the repair try fails, commentary omitted, the **report is still sent**, `commentary_status` `omitted_error`.
**Evidence:** Exec ID; Canvas; error output of both AI nodes; `report_runs` row; the email ("AI commentary not available this week").
Result: [ ] pass [ ] fail [ ] not run · Exec ID: ______ · **Then restore both model nodes to `LLM - Showcase` (reload without saving), R1.**

### T26 Slack failure
**Do:** R1. Create `Slack - WRONG TEST` with a made-up token. On node **"Slack summary"** select it (do not save). Run W1.
**Expect:** the email **is** sent; the Slack post fails after retries; `report_runs` `slack_sent` = `no`; run ends in Error ("Slack summary failed after the email was sent").
**Evidence:** Exec ID; Canvas; `report_runs` row; the email; Slack unchanged.
Result: [ ] pass [ ] fail [ ] not run · Exec ID: ______ · **Then restore, delete the wrong credentials, R1.**

### T30 error alert (only a real scheduled failure proves it) - your decision
**Why separate:** a manual run **never** sends the Slack alert. The alert is proven only by a real scheduled failure. It needs briefly switching on **throwaway copies**. The real three workflows stay off. **If you would rather not, tell me and I record T30 as Not verified.**
**Do (about 15 minutes, W1 copy):** duplicate W1 and name the copy `ZZ TEST W1 copy`. In the copy: Error Workflow = the shared alert; Settings spreadsheet ID = `NOT-A-REAL-ID`; set the Schedule Trigger to fire a few minutes from now. Switch the copy **on**, wait for the fire, then switch it **off** and delete it.
**Do (W3-inside-W2 copy):** duplicate W3 as `ZZ TEST W3 copy` (Error Workflow = shared alert; "Fetch invoice now" document ID = `NOT-A-REAL-ID`, so it fails before any email). Duplicate W2 as `ZZ TEST W2 copy` (Error Workflow = shared alert; its "Start approval run (W3)" pointing at the W3 copy; schedule a few minutes ahead; R2 first). Switch the W2 copy on, wait for the fire, switch off, delete both copies. Then R2.
**Expect:** a Slack alert for each failure: workflow name, failing step, a link to the execution, first line of the error, **no customer data**. For the W3 copy, the alert names the **W3 copy** (proves a failure inside a sub-workflow reaches the shared alert, V13/X9). If only the W2 copy alerts, say so.
**Evidence:** Slack text (or screenshot) of each alert; screenshot that the copies are switched off and deleted.
T30 (W1 or W2 scheduled failure): [ ] pass [ ] fail [ ] not run / skipped by owner · X9 (failure inside W3 reaches the alert): [ ] pass [ ] fail [ ] not run

---

## Part 10: Cost, executions, restore, cleanup

### Cost check, part 2 (X14)
1. Provider usage page again (wait a few minutes for it to catch up). Write today's requests, tokens in/out and cost so far. Screenshot. Send before (P14) and after.
2. **Expected real model calls:** one call per W1 run that reaches the AI (T1, C1, C2, C3, C6, C7 if run, T37, T38, T41, T22, the T4 D repeat, the stale-running proof, plus a second call only if a repair is needed), plus up to 2 for T13 (retries, which fail). C8 to C13 add **none** (pinned). Maximum 3 per run. Count: ______ . If the provider shows more requests than my expected number, the Anthropic node may be adding hidden retries (L3): tell me.
3. Cost per run = (input tokens x input price) + (output tokens x output price). Give me the tokens per run from the provider page or the node; I do not quote prices.

### Executions used (compare with the design estimate)
In each workflow's Executions tab count: W1 ______ · W2 ______ · W3 ______ · shared alert ______ . Design estimate is about 40 to 60 a month (W1 4 to 5, W2 about 30, W3 5 to 20, alert under 5); this script is a burst of test runs, so I compare **per run**: W1 = 1 execution; W2 = 1 plus 1 W3 per claimed invoice. I report the actual counts.

### Restore checklist (tick each, send "restore done")
- [ ] `approval_wait_hours` = 48 in **both** W2 and W3, saved. `max_drafts_per_run` = 10, saved.
- [ ] Nothing pinned anywhere (pin icons off) on W1 and W3. W1, W2, W3 reopened without unsaved changes.
- [ ] Spreadsheet ID in the three Settings is the real one. Both AI model nodes on `LLM - Showcase`. "Send reminder to test address" on the real Gmail credential. "Log sent" document ID real.
- [ ] Wrong credentials deleted (`Gmail - WRONG TEST`, `LLM - WRONG TEST`, `Slack - WRONG TEST`). Throwaway copies deleted.
- [ ] No Waiting executions left (R4). All three workflows still **inactive** (screenshot of the list).
- [ ] Spreadsheet back to base data (R3) or deleted; hostile-name rows removed or kept only as test data.

### Cleanup (after I say the evidence is complete)
Delete the test executions (they hold invoice figures and names), clear the test inbox of approvals, reminders and drafts, clear the Slack test messages, delete the spreadsheet or keep it labelled as test data.

---

## What to send back, as a quick list
Per case: **Exec ID(s)**, **Canvas**, the **Tab shots** named, **Mailbox** and **Slack** evidence, and the time you ran it. Also: Part 0 answers, the V-list answers, cost before/after, execution counts, the restore checklist. Never include credentials, tokens, keys or the address bar.

## Wrap-up
**What was done:** wrote the owner test script for T1 to T42 and C1 to C13, with one-time prerequisites, reset recipes, a safe run order (W1 first, W2/W3 after, failure injections and the optional scheduled-failure test last), the extra checks (T27 with several eligible invoices, quiet-day bad row, T6 duplicate key, T4 variant D re-run, hostile names, W3 start output, Gmail wait limit, Waiting count, T30), a restore checklist and a cost check. Nothing was run and nothing in the workflows was changed.
**What needs your decision:** (1) whether you will run T30 with throwaway copies (briefly switched on) or record it Not verified; (2) the test date: Monday 2026-11-02 (Plan A) or a week-shifted date (Plan B); (3) whether to build the control tabs as formulas (P7); (4) your expected directions for C1 to C7, written before each run; (5) whether the quiet-day gap (N1) is acceptable once you see the result.
**Next step:** do Part 0 and Part 1 and send me "Part 0 done" with the V-list answers and the T32 screenshots. Then run T1 only and send the evidence. I stop there until I reply.
