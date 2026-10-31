# SHOW-002 synthetic test data

All data is invented. Customers are "Sample Customer A to F" (plus two deliberately hostile names), emails are on the reserved `example.com` domain, nothing is real. Amounts are plain numbers with at most two decimals, dates are plain text `YYYY-MM-DD`.

**Frozen test date: 2026-11-02 (Monday).** Every due date in `invoices.csv` is written relative to that day (0, 1, 7, 8, 30, 31 days ago and so on), so the tiers in `expected-figures.md` hold only if W1/W2 run on that date. To test on another day, shift every date in `invoices.csv`, `sales_lines.csv` and the `week_start` column of `control_sales_week.csv` by the same number of days (keep the week starting on a Monday), or work out the tiers by hand. QA records the test date used in the test report.

## Tabs to create (one spreadsheet, header row locked before the build)
| Tab | File | Role |
|---|---|---|
| `invoices` | `invoices.csv` | source (41 rows) |
| `sales_lines` | `sales_lines.csv` | source (66 rows over three weeks, one week outside the report window) |
| `control_sales_week` | `control_sales_week.csv` | control totals, 12 Mondays x USD/EUR, including zero rows |
| `control_open` | `control_open.csv` | control totals, one row per currency |
| `weekly_report` | `weekly_report_header.csv` (headers only) | written by W1; optional seed `weekly_report_seed_prior_week.csv` (two synthetic rows for 2026-10-19) so the overdue directions can be offered to the AI |
| `top_customers` | `top_customers_header.csv` | written by W1 |
| `report_runs` | `report_runs_header.csv` | written by W1 |
| `reminder_log` | `reminder_log_header.csv` | written by W2 and W3 (starts empty; also test the first-ever run with an empty log, T20) |

## Importing
1. Create each tab and paste the header row first; lock it. Format the date columns, `invoice_no`, `customer_*` and key columns as **Plain text** before pasting data, and money columns as **Number**.
2. Paste or import the CSV data under the headers. After import check: dates read `2026-11-02` (text, left-aligned), money is a number (right-aligned), and the name that begins with `=` shows as text, not as a formula (type it with a leading apostrophe or keep the column Plain text). If anything converted, fix it before testing; the workflows read unformatted values.
3. Set the spreadsheet time zone (File > Settings) equal to the workflow time zone.

## Control tabs
The CSVs hold values calculated separately from the workflow (plain date arithmetic). The design wants the control tabs to be **sheet formulas** (a different calculation path from the n8n Summarize node). Suggested formulas, to be reviewed once by the owner (row 2 shown; fill down). Column letters assume the layouts in the CSVs.
- `control_sales_week!C2` (sales_total): `=SUMPRODUCT((sales_lines!$E$2:$E=$B2)*(sales_lines!$C$2:$C>=$A2)*(sales_lines!$C$2:$C<=TEXT(DATEVALUE($A2)+6,"yyyy-mm-dd"))*sales_lines!$F$2:$F)`
- `control_sales_week!D2` (sales_line_count): the same without the last factor.
- `control_open!B2` (open_balance_total): `=SUMIFS(invoices!$J:$J,invoices!$G:$G,$A2,invoices!$B:$B,"invoice",invoices!$K:$K,"open")`
- `control_open!C2` (open_invoice_count): `=COUNTIFS(invoices!$G:$G,$A2,invoices!$B:$B,"invoice",invoices!$K:$K,"open")`
These are suggestions, not tested in Google Sheets by the builder. If a formula and the CSV value disagree, find out why before trusting either.

## Variants (`variants/`, each replaces the named tab)
| File | Replaces | Use |
|---|---|---|
| `A_invoices_text_in_amount.csv` | `invoices` | T2/T27: one `amount` cell holds `N/A` |
| `B_control_sales_off_by_0.01.csv` | `control_sales_week` | T3: USD sales total for the report week off by 0.01 |
| `C_empty_week_sales_lines.csv` + `C_empty_week_control_sales.csv` | `sales_lines`, `control_sales_week` | T4 variant C: no lines in the report week, control says 0 |
| `D_empty_source_invoices_header_only.csv` | `invoices` | T4 variant D: empty source |
| `E_unknown_currency_invoices.csv` | `invoices` | T27: a `GBP` row |
| `F_malformed_date_invoices.csv` | `invoices` | T22/T27: `2026-02-30` |
| `G_duplicate_invoice_no_invoices.csv` | `invoices` | T40: `INV-1005` twice |
| `H_tier_shift_invoices_INV-1004_due_7_days_ago.csv` | `invoices` | T38: `INV-1004` moved from 8 to 7 days (totals unchanged, ageing split changes) |
| `I_eur_no_sales_this_week_*.csv` | `sales_lines`, `control_sales_week` | T37: EUR has no sales this week (and none last week) |
| `J_negative_balance_invoices.csv` | `invoices` | T27: a negative balance |

## Things the base data is built to exercise
Tier boundaries with usable emails (INV-1001 at 0 days, INV-1002 at 1, INV-1003 at 7, INV-1004 at 8, INV-1005 at 30, INV-1006 at 31), one customer with three overdue invoices (A: INV-1007/1008/1009), partial payment (INV-1010), invoices for QA to flip to paid or part-pay during a wait (INV-1011, INV-1012), blank and malformed email (customer E has a blank address and customer F has `not-an-email`, so INV-1013, INV-1014 and INV-1104 log `skipped_no_email`), hostile text (INV-1015 customer name is an instruction; INV-1016 name begins with `=`), a credit note (CN-2001, negative sales line) and a void invoice (INV-1023), USD and EUR with EUR prior-week sales = 0, sales lines on the Sunday and Monday edges (2026-10-25, 10-26, 11-01, 11-02), and a report week that contains the US clock change (2026-11-01). `expected-figures.md` holds the hand-calculated totals.

