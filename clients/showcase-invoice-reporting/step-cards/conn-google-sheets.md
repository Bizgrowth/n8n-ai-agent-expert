# Step card: Google Sheets (stand-in accounting source, report output, reminder log)

**Workflow:** W1, W2, W3 · **Type:** connection / app · **Specialist:** connections · **n8n version assumed:** UNKNOWN
**Prepared:** 2026-10-28 by the architect in the connections-specialist role, from docs.n8n.io. Specialist review pass recommended before build.

## What it does (plain English)
One Google spreadsheet plays three roles: the pretend accounting system (invoices and sales), the place the weekly report is written, and the memory of which reminders were already handled.

## Fields
| Direction | Field | Type | Rule or example (synthetic) |
|---|---|---|---|
| In | Tab `invoices` | rows | invoice_no, doc_type, customer_name, customer_email, issue_date, due_date, currency, amount, amount_paid, balance, status, paid_date (full definition in design section 6) |
| In | Tab `sales_lines` | rows | line_id, invoice_no, sale_date, customer_name, currency, line_total |
| In | Tabs `control_sales_week`, `control_open` | rows | Totals calculated by sheet formulas, read-only for the workflow |
| Out | Tabs `weekly_report`, `top_customers`, `report_runs`, `reminder_log` | rows | Written by the workflows (design section 6) |

## Connection
- Node and version: Google Sheets, Sheet Within Document. typeVersion: verify on import.
- Credential name: `Google Sheets - AI Ops Expert showcase`. Type: Google OAuth2 (docs recommend OAuth2). Service account is also supported for Sheets. Scopes: UNVERIFIED (docs page does not list them); the credential setup screen asks for them.
- Where the owner creates it: Credentials tab in the Personal project. Self-hosted needs the owner's own Google Cloud OAuth app (managed sign-in is Cloud-only, verified).

## If it fails
| Failure | What n8n does | What our design does | Alert |
|---|---|---|---|
| Read fails (outage, quota, auth) | Node errors | Retry On Fail (3 tries, proposal) then stop. A report or scan on missing data is worse than no report | Shared error alert |
| Write fails (report, log) | Node errors | Retry On Fail, then Stop Workflow (a missing log row is loud, never silent) | Shared error alert |
| Empty read (no rows) | A Get Row(s) with no match returns no items and ends that branch | Set "Always Output Data" on lookups that must continue (verify on import), then test for empty | n/a |
| Sheet edited by hand mid-run | Reads can see a half-edited sheet | Control-total check catches totals drift (data card) | Report blocked, alert |

## Limits and cost
Google API quotas apply (values not quoted, not verified). Demo volume (about 50 invoices, 100 lines) is far under any normal quota. Each read or write is one node call, no per-run fee on self-hosted. Sheets is not a transactional database: no atomic "insert if not exists". Design avoids concurrent writers by claiming rows in a single sequential step.

## Verified facts
| Fact | Source | Date | n8n version |
|---|---|---|---|
| Sheet operations: Append Row, Append or Update Row, Clear, Create, Delete, Delete Rows or Columns, Get Row(s), Update Row | https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.googlesheets/ | 2026-10-28 | page current |
| Get Row(s): Filters (Column + Value), option "When Filter Has Multiple Matches" (Return All Matches), Data Location on Sheet, Output Formatting incl. Date Formatting | .../googlesheets/sheet-operations/ | 2026-10-28 | page current |
| Append Row / Append or Update / Update Row: Mapping Column Mode (Map Each Column Manually, Map Automatically, Nothing); option "Data Location on Sheet" (Header Row, First Data Row) | same | 2026-10-28 | page current |
| Update Row updates existing rows only | same | 2026-10-28 | page current |
| Credentials: OAuth2 recommended; Sheets supports OAuth2 and service account; self-hosted must create its own Google OAuth app | https://docs.n8n.io/integrations/builtin/credentials/google/ | 2026-10-28 | page current |

## UNVERIFIED (never guessed)
- How Append or Update Row picks the matching column (the docs page lists no "Column to Match On" for it). Verify on import. Fallback: Get Row(s) then Update Row or Append Row as two steps.
- Exact scopes the Google credential requests.
- "Always Output Data" behaviour for empty Get Row(s) on this version.
- Sheets date cells: whether dates arrive as text or serial numbers depends on Output Formatting. Builder must set "Values formatted" or serial deliberately and test with the synthetic boundary dates.
- Practical row limits for a Get Row(s) of the whole tab at larger sizes (not needed at demo size).

## How to prove it
Test cases T1, T9, T22, T27. Evidence: execution log showing item counts out of each read, screenshots of the written tabs (synthetic), failure test by revoking the credential on the Sandbox.

## Owner decisions needed
- Create the spreadsheet with the tabs in design section 6 and the OAuth2 credential. One file with separate tabs (recommended; Google credentials are per account, so a second file gives no extra access control).
