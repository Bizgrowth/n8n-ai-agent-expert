# Step card: Report aggregation, date handling and control-total check

**Workflow:** W1 weekly report (ageing logic is shared with W2) · **Type:** data · **Specialist:** data · **n8n version assumed:** UNKNOWN
**Prepared:** 2026-10-28 by the architect in the data-specialist role, from docs.n8n.io. Specialist review pass recommended before build.

## What it does (plain English)
Cleans the invoice and sales rows, adds them up per currency, ranks the top customers, and then proves the totals are right by comparing them with totals the spreadsheet calculated by itself. If any number differs by even one cent, the report is not published.

## Fields
| Direction | Field | Type | Rule or example (synthetic) |
|---|---|---|---|
| In | invoices row | object | amount, amount_paid, balance numbers; issue_date, due_date, paid_date as `YYYY-MM-DD`; currency 3 letters; status in `open/paid/void`; doc_type in `invoice/credit_note` |
| In | sales_lines row | object | line_total number (credit notes negative); sale_date `YYYY-MM-DD`; currency |
| Derived | bucket | string | `current` (report week), `prior` (week before), else dropped. Computed from sale_date in the workflow time zone |
| Derived | days_past_due | integer | whole calendar days from due_date to run date, both date-only in the workflow time zone. Due today = 0 = not overdue |
| Derived | ageing_bucket | string | `not_due` (<=0), `d1_7`, `d8_30`, `d31_plus` |
| Derived | amounts in minor units | integer | Round(amount x 100) before comparing, to avoid decimal drift |
| Out | one item per currency | object | sales_total, sales_count, prior_sales_total, change_abs, change_pct (null if prior is 0), open_balance, overdue_balance, overdue_count, ageing buckets, no_email_overdue_count |
| Out | top customers | list | Top 5 per currency by current-week sales |
| Control in | control_sales_week | row | week_start, currency, sales_total, sales_line_count (sheet formulas) |
| Control in | control_open | row | currency, open_balance_total, open_invoice_count (sheet formulas) |

## Connection
- Nodes: Edit Fields (Set), Filter, IF, Date & Time, Summarize, Aggregate, Sort, Limit, Stop and Error. typeVersions: verify on import. No credentials.

## Control-total rules (all must hold, per currency)
1. Workflow sales_total (minor units) == control sales_total (minor units).
2. Workflow sales_count == control sales_line_count.
3. Workflow open_balance (sum of ageing buckets: not_due + d1_7 + d8_30 + d31_plus) == control open_balance_total.
4. Workflow open_count == control open_invoice_count.
5. Rows read == rows valid (a row dropped by validation is a failed check, never silently ignored).
6. Currencies found in the data == currencies present in the control tabs (no missing or extra currency).
Any failure: write a `blocked_mismatch` row in `report_runs` (figures only, no customer data), end with Stop and Error carrying "Report blocked: control total mismatch in <currency> (<metric>)", so the shared error alert reaches the owner. Nothing is written to `weekly_report`, nothing is emailed.

## If it fails
| Failure | What n8n does | What our design does | Alert |
|---|---|---|---|
| Summarize on missing field | Errors unless "Continue if Field Not Found" is on (verified default off) | Leave it OFF: a missing field must fail loudly | Shared alert |
| Empty week (no sales lines) | Summarize may return nothing | Treated as zero totals only if the control row also says 0 lines; if the whole source is empty, stop | Alert on stop |
| Text in a number column | Expression returns NaN | Validation routes the row to "invalid", check 5 then fails | Report blocked, alert |
| Prior week = 0 | Division by zero | change_pct = null, shown as "n/a" | none |
| Credit notes | Would inflate overdue | doc_type credit_note excluded from overdue and reminders; included (negative) in sales totals | none |

## Limits and cost
No external calls, no cost. Data is small. Expressions with array `find()` after Aggregate can get long; if unreadable, one Code node is allowed with a comment (best practice), but first try Summarize with split fields.

## Verified facts
| Fact | Source | Date | n8n version |
|---|---|---|---|
| Summarize: aggregations Append, Concatenate, Average, Count, Count Unique, Max, Min, Sum; "Fields to Split By" (GROUP BY); output "Each Split in a Separate Item" or single item; "Continue if Field Not Found" off by default | https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.summarize/ | 2026-10-28 | page current |
| Aggregate: Individual Fields or All Item Data (Put Output in Field) | .../n8n-nodes-base.aggregate/ | 2026-10-28 | page current |
| Date & Time ops: Add, Subtract, Extract, Format, Get Current Date, Get Time Between Dates (units years to milliseconds), Round; uses workflow time zone, else instance zone (default America/New York) | .../n8n-nodes-base.datetime/ | 2026-10-28 | page current |
| Filter Date & Time comparisons: is equal to, is after, is before, is after or equal to, is before or equal to, exists, is empty | .../n8n-nodes-base.filter/ | 2026-10-28 | page current |
| Sort: Simple (field + ascending/descending), Random, Code. Limit: Max Items, Keep First/Last Items | .../n8n-nodes-base.sort/ and .../n8n-nodes-base.limit/ | 2026-10-28 | page current |
| Stop and Error throws a custom error that triggers the error workflow | https://docs.n8n.io/flow-logic/error-handling/ | 2026-10-28 | page current |

## UNVERIFIED (never guessed)
- Whether "Get Time Between Dates" rounds or truncates partial days. Safer plan: convert both dates to date-only strings first and diff those (test T7).
- Whether Summarize "Each Split in a Separate Item" keeps split-by keys in a form that is easy to look up; verify on first run.
- Luxon expression syntax for "start of previous week Monday" in the workflow zone: builder tests on the instance with boundary dates.
- Sheets formulas: the owner builds `control_*` tabs with SUMIFS/COUNTIFS style formulas over the source tabs; the workflow only reads their results.

## How to prove it
Tests T1 to T8, T27, T29. Evidence: execution views of each node's item counts, the written `weekly_report` rows beside a hand-calculated spreadsheet total, and the blocked run's `report_runs` row for the mismatch cases.

## Owner decisions needed
- Per-currency reporting with no conversion (recommended; avoids an exchange-rate source) vs one converted currency.
- Report week = previous full Monday to Sunday.
