# Step card: Report aggregation, date handling and control-total check

**Workflow:** W1 weekly report (ageing logic is shared with W2) · **Type:** data · **Specialist:** data · **n8n version assumed:** UNKNOWN
**Prepared:** 2026-10-28 by the architect in the data-specialist role, from docs.n8n.io. **Revised 2026-10-30** after `reviews/data-review.md` (all 8 must-fix items and the small points applied).

## What it does (plain English)
Cleans the invoice and sales rows, adds them up per currency, ranks the top customers, and then proves the sales and open-balance totals are right by comparing them with totals the spreadsheet calculated by itself. If any number differs by even one cent, the report is not published. The control does **not** prove how open money is split across the ageing buckets (see "What the control does not prove").

## Fields
| Direction | Field | Type | Rule or example (synthetic) |
|---|---|---|---|
| In | invoices row | object | amount, amount_paid, balance: numbers with at most 2 decimals; issue_date, due_date, paid_date as `YYYY-MM-DD` and a real date; currency in the allowed list; status in `open/paid/void`; doc_type in `invoice/credit_note`; `invoice_no` unique |
| In | sales_lines row | object | line_total number (credit notes negative); sale_date `YYYY-MM-DD`; currency |
| Derived | bucket | string | `current` (report week), `prior` (week before), else dropped. Dropped lines are **valid** (count in `rows_valid`) |
| Derived | days_past_due | integer | whole calendar days from due_date to run date, both date-only text parsed in UTC (no 23 or 25-hour days). Due today = 0 = not overdue |
| Derived | ageing_bucket | string | `not_due` (<=0), `d1_7`, `d8_30`, `d31_plus` |
| Derived | amounts in minor units | integer | `Math.round(Number(x) * 100)` **per row, before any summing**. All sums and comparisons use whole numbers. Cells with more than 2 decimals are rejected, not rounded. Factor 100 is right for USD and EUR only; any other currency (JPY, KWD...) needs its own factor before it is added to the allowed list. Control-tab values get the same conversion. `change_pct` and display rounding come last and never feed a control check |
| Derived | customer key | string | customer_name trimmed and spaces collapsed (no customer ID exists in the data) |
| Out | one item per **allowed** currency | object | sales_total, sales_count, prior_sales_total, prior_sales_count, change_abs, change_pct (null if prior is 0), open_balance, overdue_balance, overdue_count, ageing buckets, overdue_no_email_count, computed directions (for the AI card) |
| Out | top customers | list | Top 5 per currency by current-week sales, ties broken by customer name |
| Control in | control_sales_week | row | week_start, currency, sales_total, sales_line_count (sheet formulas; zero rows for empty currencies) |
| Control in | control_open | row | currency, open_balance_total, open_invoice_count (sheet formulas over `doc_type = invoice` and `status = open`, the workflow's own definition) |

## Connection
- Nodes: Edit Fields (Set), Filter, IF, Date & Time, Summarize, Aggregate, Merge, Sort, Limit, Stop and Error. typeVersions: verify on import. No credentials.
- Expressions after an Aggregate use `$('Settings').first().json.x` and `.all()` explicitly, never `.item`, for Settings, the week values and the packed sources (item pairing is lost when many items become one). Highest risk: W1 step 14, which pulls from several branches.

## How the pieces are built
1. **Validity first, on the raw cell.** Test the raw value with an IF (regex or `isNaN(Number(x))`, loose type validation on), route failures to "invalid", and only then convert. Do not assign text such as `N/A` to a Number field: it may raise a type error and stop the run instead of routing to invalid (verify with Variant A).
2. **Zero-filled currencies.** Summarize returns only groups that exist. Build the currency list from Settings allowed currencies, then **Merge > Combine by Matching Fields > Enrich Input 1 (left join)** with the currency list as Input 1, so a missing group becomes 0. Do not use Combine by Position (Input 1 sets the item count, unpaired items are dropped). Do the same for open balance across currency x four buckets.
3. **Empty source test** counts rows with a non-empty `invoice_no` / `line_id`; it does not test "list is empty" (Always Output Data gives one blank item).
4. **Top N per currency** by expression slice after Aggregate (Limit works on the whole list); Sort by total, then customer name.

## Control-total rules (all must hold, per allowed currency, whole minor units)
1. Workflow sales_total == control sales_total for `week_start`.
2. Workflow sales_count == control sales_line_count.
3. Workflow open_balance (sum of ageing buckets: not_due + d1_7 + d8_30 + d31_plus) == control open_balance_total.
4. Workflow open_count == control open_invoice_count.
5. Rows read == rows valid on both source tabs (a bad cell, bad date or duplicate invoice_no is a failed check, never silently ignored).
6. Every allowed currency has a row in each control tab and no control row has a non-allowed currency. A currency with no data shows as 0 and must match a control row of 0.
7. **Prior week:** workflow prior-week sales total and count == the `control_sales_week` row for `prior_week_start`, per currency.
Any failure: write a `blocked_mismatch` row in `report_runs` (figures only, no customer data), end with Stop and Error carrying "Report blocked: control total mismatch in <currency> (<metric>)". Nothing is written to `weekly_report`, nothing is emailed.

## What the control does not prove
Rule 3 sums all four buckets, so a date or tier bug that moves money between buckets still passes, as would `overdue_balance` and `overdue_count`. The live control does not cover them; tests T7, T14 and T38 do. Upgrade path (owner decision): per-bucket columns in `control_open`, with the spreadsheet time zone set equal to the workflow zone (TODAY() uses the sheet's own zone).

## If it fails
| Failure | What n8n does | What our design does | Alert |
|---|---|---|---|
| Summarize on missing field | Errors unless "Continue if Field Not Found" is on (verified default off) | Leave it OFF: a missing field must fail loudly | Run ends in Error |
| Empty week (no sales lines) | Summarize returns no group | Left join gives 0; passes only if the control row also says 0; if the whole source is empty, stop | Error on stop |
| Text in a number column | May raise a type error or give NaN (UNVERIFIED) | Raw-cell test routes the row to "invalid"; rule 5 then fails | Report blocked |
| Prior week = 0 | Division by zero | change_pct = null, shown as "n/a"; sales commentary not offered for it | none |
| Credit notes | Would inflate overdue | doc_type credit_note excluded from overdue and reminders; included (negative) in sales totals; `control_open` excludes them too | none |
| Customer name starting with `=` | Formula risk on write | Written as raw text; escape names in HTML email | none |

## Limits and cost
No external calls, no cost. Data is small. Expressions with array `find()` after Aggregate can get long; if unreadable, one Code node is allowed with a comment (best practice), but first try Summarize with split fields.

## Verified facts
| Fact | Source | Date | n8n version |
|---|---|---|---|
| Summarize: aggregations Append, Concatenate, Average, Count, Count Unique, Max, Min, Sum; "Fields to Split By"; output "Each Split in a Separate Item" or single item; "Continue if Field Not Found" off by default | https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.summarize/ | 2026-10-28 | page current |
| Aggregate: Individual Fields or All Item Data (Put Output in Field); zero-input behaviour not documented | .../n8n-nodes-base.aggregate/ | 2026-10-30 | page current |
| Merge: modes include Combine by Matching Fields with Output Type options (Enrich Input 1 etc.); Combine by Position: Input 1 sets the item count, unpaired dropped by default; behaviour with an empty input not documented for matching fields | https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.merge/ | 2026-10-30 | page current |
| Date & Time ops: Add, Subtract, Extract, Format, Get Current Date, Get Time Between Dates, Round; uses workflow time zone, else instance zone (default America/New York) | .../n8n-nodes-base.datetime/ | 2026-10-28 | page current |
| Filter Date & Time comparisons: is equal to, is after, is before, is after or equal to, is before or equal to, exists, is empty | .../n8n-nodes-base.filter/ | 2026-10-28 | page current |
| Sort: Simple, Random, Code. Limit: Max Items, Keep First/Last Items | .../n8n-nodes-base.sort/ and .../n8n-nodes-base.limit/ | 2026-10-28 | page current |
| Stop and Error throws a custom error that triggers the error workflow | https://docs.n8n.io/flow-logic/error-handling/ | 2026-10-28 | page current |

## UNVERIFIED (never guessed)
- Edit Fields / IF behaviour on a text cell in a number field (error vs routed to invalid).
- Aggregate with zero items and with one blank item; Merge matching-fields behaviour with an empty input.
- Summarize "Each Split in a Separate Item" key names; Merge left join gives zero-filled rows.
- Whether Sheets returns formatted text or serial numbers (unformatted-values option label).
- Luxon expression for "Monday of last week" in the workflow zone (Luxon weeks start Monday; builder uses the current Luxon page from the docs index; the URL tried in review gave 404); `$now` uses the workflow zone; the zone is actually set.
- Spreadsheet time zone equals workflow zone.
- Sheets formulas: the owner builds `control_*` tabs with SUMIFS/COUNTIFS style formulas; the workflow only reads their results.

## How to prove it
Tests T1 to T8, T27, T29, T37, T38, T41. Evidence: execution views of each node's item counts, the written `weekly_report` rows beside a hand-calculated spreadsheet total, and the blocked run's `report_runs` row for the mismatch cases. Include one test week containing a DST change.

## Owner decisions needed
- Per-currency reporting with no conversion (decided).
- Report week = previous full Monday to Sunday (decided).
- Ageing split: accept the honest note, or add per-bucket control columns.
