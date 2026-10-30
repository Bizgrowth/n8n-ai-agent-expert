# Data specialist review: SHOW-002

**Reviewer:** n8n-data-expert · **Date:** 2026-10-30 · **n8n version:** UNKNOWN (not read from the instance)
**Reviewed:** `design.md` (sections 6 to 10, 14), `step-cards/data-report-and-control-total.md`, `step-cards/data-reminder-log-dedupe.md`
**Not changed:** the cards and the design. Fixes below are for the architect to apply.

## Verdicts

| Card | Verdict | One line |
|---|---|---|
| data-report-and-control-total | **Fix needed** | Sound idea. Four gaps could give a false "all clear" or a false block: empty currencies, ageing not controlled, prior week not controlled, bad-cell handling |
| data-reminder-log-dedupe | **Fix needed** | The design says "claim-then-check" but actually does check-then-claim. Also the approved message can go out stale if the balance or tier changes during the wait |

Business meaning: neither card is unsafe to build on, but without the fixes the report could be blocked for no reason, or pass while ageing is wrong. A reminder could also say a different amount than the one you approved.

---

## Card 1: report and control total

### Corrections (must fix)

1. **Empty currency groups.** Summarize only returns groups that exist. If EUR has no sales lines this week but `control_sales_week` has a prefilled EUR row of 0, rule 6 ("currencies equal") fails and the report is blocked wrongly (design test T4 variant C expects a pass).
   Fix: start from a currency list built from the Settings allowed currencies, then join the Summarize results onto it so a missing group becomes 0. Use **Merge > Combine by Matching Fields > Enrich Input 1 (left join)** with the currency list as Input 1. Avoid Combine by Position: Input 1 sets the item count and unpaired items are dropped by default.
   Ref: Merge page (modes, Output Type), https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.merge/ (read 2026-10-30). Compare each source's own currency set to its own control tab (sales to `control_sales_week`, open balance to `control_open`).

2. **The control does not prove the ageing split.** Rule 3 sums all four buckets, so a date or tier bug that moves money between buckets still passes. Same for `overdue_balance`, `overdue_count`.
   Fix: either (a) add per-bucket columns to `control_open` (sheet formulas; note TODAY() uses the spreadsheet's own time zone, set it equal to the workflow zone), or (b) state plainly in the card and to the owner that ageing is covered by tests T7 and T14 only, not by the live control. Option (b) is acceptable for the showcase if said openly.

3. **Prior week is not controlled.** `change_abs` and `change_pct` depend on `prior_sales_total`, but no rule checks it. `control_sales_week` already has about 12 weeks of rows.
   Fix: add rule 7: prior-week sales total and count equal the control row for `prior_week_start`.

4. **Bad cells may crash instead of routing to "invalid".** The card says text in a number column "returns NaN". In Edit Fields, assigning a Number-type field from text like `N/A` may raise a type error that stops the run, not a NaN. I could not confirm this from the docs pages I reached. Same for IF with strict type checking.
   Fix: test validity on the raw cell first (regex or `isNaN(Number(x))` inside an IF, with the IF's loose type validation option on), and only then convert. Verify on import with Variant A.

5. **Minor-unit wording is ambiguous.** Card line 17 says "Round(amount x 100) before comparing". It must be rounded **per row, before any summing**, then sums and comparisons are done on whole numbers. Rounding a float sum at the end can hide a 0.01 drift. Also:
   - The validity rule `balance = amount - amount_paid` must be checked in minor units (floats: 0.1 + 0.2 is not 0.3).
   - Reject any cell with more than 2 decimals instead of rounding it (otherwise 1.005 silently becomes 1.00).
   - The factor 100 is right for USD and EUR only. If JPY or KWD are ever allowed, the factor changes; write that next to the allowed-currency list.
   - Control-tab values go through the same conversion (`Math.round(Number(x) * 100)`).
   - `change_pct` and any display rounding are computed last, from minor units, and never feed a control check.

6. **Sheets values come back as formatted text or serial numbers (UNVERIFIED).** The Google Sheets page I reached does not describe Get Row(s) output formatting; it points to a separate operations page. Formula results such as `$1,234.50` or a date shown as `46000` would break the checks.
   Fix: set the output to unformatted values if the node offers it, keep date columns as plain-text format, and validate dates with `^\d{4}-\d{2}-\d{2}$` plus a real-calendar check (2026-02-30 must fail). Verify on import with T22.

7. **"Source empty?" may never fire.** With **Always Output Data** on, an empty Sheets read emits one empty item `{}`, and the Aggregate then holds a list with one blank object, so "pack empty" is false. The Aggregate docs are silent on zero input items (https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.aggregate/).
   Fix: test "number of rows with a non-empty `invoice_no` / `line_id` is 0", not "list is empty". Verify T4 Variant D on import.

8. **Control definitions must match.** `control_open` says "where status is open"; the workflow counts "doc_type invoice, status open". If any open credit note exists, they disagree. Write `doc_type = invoice` into the control formula too.

### Smaller points

- **Expression pairing.** After an Aggregate, many items become one, so item links are lost. Use `$('Settings').first().json.x` and `.all()` explicitly, not `.item`, for Settings, the week values, and the four packed sources. Same in W3 (`$('Settings').first()`). Wrong-reference risk is highest where W1 step 14 pulls from three branches.
- **Dates.** Do day maths on date-only text parsed in UTC (for example `DateTime.fromISO(d, {zone:'utc'})`, difference in days). Parsing in a DST zone can give 23 or 25-hour days and fractional days. Run date: today's date in the workflow zone (`$now` is documented to use the workflow zone; confirm, and confirm the zone is actually set, since the default is America/New York). Last Monday: Luxon weeks start Monday, so `.minus({weeks:1}).startOf('week')`. The Luxon doc URL I tried does not exist (404); builder should use the current Luxon page from the docs index. Add one test week containing a DST change.
- **Top N per currency.** Limit works on the whole list, not per currency, so the card's "expression slice" plan is right. Add a second sort key (customer name) so ties are stable. Normalize customer name (trim, collapse spaces) before grouping or "Sample Customer A " splits into two customers. There is no customer ID in the data; say so.
- **"dropped" bucket.** Sales lines outside the two weeks are valid, not failures. State that `rows_valid` counts them as valid so rule 5 does not trip.
- **Sheet text injection.** A customer name starting with `=` or `+` written into `weekly_report` / `top_customers` can run as a formula if the write uses "user entered" mode. Write as raw text if the node allows (or prefix with `'`). Also escape names if the report email is HTML.
- **Timestamps.** Store `generated_at` and `claimed_at` as ISO with offset, so the stale sweep compares correctly.

### Doc references (read 2026-10-30, page current, version not stated)
- Aggregate options (Merge Lists, Keep Missing And Null Values, etc.): .../n8n-nodes-base.aggregate/. Zero-item behaviour not documented.
- Merge modes and Output Types: .../n8n-nodes-base.merge/. Behaviour with an empty input not documented for the matching-fields mode.
- Existing card facts on Summarize, Date & Time, Sort, Limit, Stop and Error were not re-read; I take them as stated and they are consistent with what I know.

---

## Card 2: reminder log and dedupe

### Corrections (must fix)

1. **It is check-then-claim, not claim-then-check.** The design (section 10.2) and risks table call it "claim-then-check", but W2 checks the log (steps 11 and 12) and then appends the claim (step 15). Two scans in the same minute can both pass the check. A true guard appends the claim, then **re-reads the log and confirms exactly one row exists for that `log_key`** (or that ours is the first one); if not, stop that invoice. Same for W1: after step 6 (claim week), re-read `report_runs` and confirm only one `running` row for the week. Sheets has no atomic insert-if-absent, so this narrows the window but does not remove it; keep the honest wording.

2. **Retry on an Append can create a duplicate row.** If Google saves the row but the answer is lost, "Retry 3" appends again. Then `Update Row` by `log_key` hits only the first match and the duplicate stays `pending`. Fix: after any claim append, the re-read in point 1 also catches this; the stale sweep should handle duplicates; Update steps must key on a column and the card should say what happens when two rows match. Verify the Update Row match behaviour on import.

3. **The approved message can be stale.** W3 builds the text at step 5, then waits up to 48 hours. If the customer pays part of it, or the invoice moves from t1 to t2 during the wait, step 10 only checks "still open and balance > 0", so the owner's approved text (old balance, old tier, old days) is sent.
   Fix: in step 10 also require `balance` equals the balance the owner was shown (`balance_at_claim`, or a value passed through the wait) and recomputed tier equals `tier`. If not, log `stopped_changed` and do not send. Add a test: partial payment during the wait.

4. **Duplicates inside one scan.** If the source lists the same `invoice_no` twice, Compare Datasets "In A only" keeps both, and two claims are written for one `log_key`. Fix: remove duplicates on `log_key` (Remove Duplicates node) before the cap and the claim; and treat a duplicate `invoice_no` in the source as bad data.

5. **Empty log on first run (verify).** The Compare Datasets docs list the four outputs and field matching but do not say what happens with an empty Input B (https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.comparedatasets/). With Always Output Data you also get one blank item in B; make sure a blank `log_key` cannot match anything and that the first run (T20 variant) passes every invoice as "In A only". If the node does not run at all on an empty input, add an explicit "log is empty" bypass.

6. **Match types.** Compare Datasets is strict about types unless **Fuzzy Compare** is on (3 is not "3"). `log_key` is text on both sides, so leave it off, but make sure `invoice_no` that looks like a number is converted to text on both sides. Also the option **Multiple Matches** defaults to "Include All Matches"; for a many-rows-per-invoice log set it deliberately (it matters for step 12, "open approval on this invoice"), and use "In A only" so extra matches do not multiply output.

### Smaller points

- **Stale sweep order.** W2 reads the log (step 5) before the sweep (step 6). Step 12 must exclude stale `pending` by timestamp (it does say "not stale"); make sure the Compare uses the same cut-off, not the swept status.
- **Late approval after the sweep** is covered by W3 step 10 (log row no longer `pending`). Good.
- **`skipped_no_email` is final for that tier.** If the owner later fixes the address, the invoice is not asked again at that tier. State this in the owner-decision section (it is a consequence of "any row blocks").
- **Log size.** The whole tab is read daily. Fine for a demo; for a real client plan a monthly archive tab. Sheets limits not checked.
- **Don't log free text.** `note` should hold codes only (`child_not_started`, `declined_or_timeout`), never exception text, which could contain names.

### Data table alternative (card's statement is correct)
Re-checked 2026-10-30 at https://docs.n8n.io/data/data-tables/: 200 MiB default total across the instance, changeable on self-hosted with `N8N_DATA_TABLES_MAX_SIZE_BYTES`, warning at 80% and again at the limit, workflow inserts and updates fail once exceeded, Code node cannot access data tables. The page gives no column types, no uniqueness constraint and no version availability. So a data table would not give an atomic claim either (UNVERIFIED: a unique constraint); staying with Sheets is fine. The card's table of Data Table operations (Insert, Upsert, If Row Exists and others) I did not re-read.

---

## Items to verify on import (for builder and reviewer)

1. Compare Datasets with empty Input B and with a blank item in B (first run).
2. Aggregate (All Item Data) with zero items and with one blank item.
3. Edit Fields and IF behaviour on a text cell in a number field (Variant A): error or routed to invalid.
4. Sheets Get Row(s): unformatted values option, date type returned (text vs serial), Always Output Data, and Update Row behaviour when two rows match.
5. Sheets writes: raw vs "user entered" so `=` in a customer name stays text.
6. Merge enrich (left join) gives 0-filled currency rows; confirm key names after Summarize "Each Split in a Separate Item".
7. `$now` / workflow time zone value and the Monday-of-last-week expression, tested with a DST week and a Sunday/Monday boundary.
8. Spreadsheet time zone equals workflow time zone (control formulas using TODAY()).
9. Re-read-after-claim step: confirm it sees the just-appended row (Google read-after-write delay).
10. W3 step 10 compares balance and tier to the values the owner approved.

## Suggested extra tests
- T37: EUR has no sales this week, control says 0: report passes with a zero EUR row.
- T38: tier bug that shifts money between ageing buckets (shows what the control does and does not catch).
- T39: partial payment or tier change during the approval wait: nothing sent, `stopped_changed`.
- T40: the same invoice twice in source, and two scans started together: one claim only.
- T41: customer name beginning with `=`: stored as text.
