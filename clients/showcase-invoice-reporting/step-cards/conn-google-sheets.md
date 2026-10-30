# Step card: Google Sheets (stand-in accounting source, report output, reminder log)

**Workflow:** W1, W2, W3 · **Type:** connection / app · **Specialist:** connections · **n8n version assumed:** UNKNOWN
**Prepared:** 2026-10-28 by the architect in the connections-specialist role, from docs.n8n.io. **Revised 2026-10-30** after `reviews/connections-review.md` and `reviews/data-review.md`.

## What it does (plain English)
One Google spreadsheet plays three roles: the pretend accounting system (invoices and sales), the place the weekly report is written, and the memory of which reminders were already handled.

## Fields
| Direction | Field | Type | Rule or example (synthetic) |
|---|---|---|---|
| In | Tab `invoices` | rows | invoice_no (unique), doc_type, customer_name, customer_email, issue_date, due_date, currency, amount, amount_paid, balance, status, paid_date (full definition in design section 6) |
| In | Tab `sales_lines` | rows | line_id, invoice_no, sale_date, customer_name, currency, line_total |
| In | Tabs `control_sales_week`, `control_open` | rows | Totals calculated by sheet formulas, read-only for the workflow. `control_open` counts only `doc_type = invoice` and `status = open` |
| Out | Tabs `weekly_report`, `top_customers`, `report_runs`, `reminder_log` | rows | Written by the workflows (design section 6; `report_runs` also holds confidence, reason and commentary output; `reminder_log` also holds `balance_shown`) |

## Connection
- Node and version: Google Sheets, Sheet Within Document. typeVersion: verify on import.
- Credential name: `Google Sheets - AI Ops Expert showcase`. Type: Google OAuth2 (docs recommend OAuth2). Service account is also supported for Sheets. Scopes: UNVERIFIED (docs page does not list them); the credential setup screen asks for them.
- Where the owner creates it: Credentials tab in the Personal project. Self-hosted needs the owner's own Google Cloud OAuth app (managed sign-in is Cloud-only, verified). **Both the Google Sheets API and the Google Drive API must be enabled** in that project.
- **OAuth app status.** If the app is "External" and in "Testing", consent and tokens expire after 7 days and the schedules stop with an auth error (same for Gmail). Owner decision: publish to Production, use Internal (Workspace account), or accept a weekly reconnect.

## Setup rules
- **Lock the header row of all seven tabs before the build.** Column names are frozen into the node; if headers change later the node errors until Mapping Column Mode is re-selected. Appends need one item per row (Split Out first for arrays).
- Reads use **unformatted values** (exact option label: verify) so money never arrives as `$1,234.50` and dates never as serial numbers. Date columns are plain-text format `YYYY-MM-DD`.
- Writes use raw text, not "user entered", so a name starting with `=` stays text (verify the option); timestamps are ISO with offset.
- Retry On Fail on Sheets calls sets a **wait of a few seconds** between tries (a quota error retried at once fails again). Claim writes (`report_runs`, `reminder_log`) use Append or Update keyed on `run_key` / `log_key` where the match column works, or no retry; a retried plain append can write a row twice.

## If it fails
| Failure | What n8n does | What our design does | Alert |
|---|---|---|---|
| Read fails (outage, quota, auth) | Node errors | Retry On Fail (3 tries with wait, proposal) then stop. A report or scan on missing data is worse than no report | Shared error alert |
| Write fails (report, log) | Node errors | Retry On Fail with wait, then Stop Workflow (a missing log row is loud, never silent) | Shared error alert |
| Empty read (no rows) | A Get Row(s) with no match returns no items and ends that branch | Always Output Data on lookups that must continue (probably a node Settings toggle; verify). It then emits one blank item, so "empty" tests count rows with a non-empty key | n/a |
| Sheet edited by hand mid-run | Reads can see a half-edited sheet | Control-total check catches totals drift (data card) | Run ends in Error |
| Burst of up to 10 simultaneous W3 runs | Several Sheets calls at once | Wait between retries; confirm in T28 that none fail | n/a |

## Limits and cost
Google API quotas apply (values are in Google's Sheets API docs, not n8n's; not verified). Demo volume (about 50 invoices, 100 lines) is far under any normal quota. Each read or write is one node call, no per-run fee on self-hosted. Sheets is not a transactional database: no atomic "insert if not exists". Design uses claim, re-read and confirm exactly one row (see the dedupe card).

## Verified facts
| Fact | Source | Date | n8n version |
|---|---|---|---|
| Sheet operations: Append Row, Append or Update Row, Clear, Create, Delete, Delete Rows or Columns, Get Row(s), Update Row | https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.googlesheets/ | 2026-10-30 | page current |
| Get Row(s): Filters (Column + Value), option "When Filter Has Multiple Matches" (set Return All Matches, otherwise only the first match returns), Data Location on Sheet, Output Formatting incl. Date Formatting | .../googlesheets/sheet-operations/ | 2026-10-30 | page current |
| Append Row / Append or Update / Update Row: Mapping Column Mode; option "Data Location on Sheet" | same | 2026-10-30 | page current |
| Update Row updates existing rows only (how the row is identified is not stated) | same | 2026-10-30 | page current |
| Column headers changed after setup make the node error until Mapping Column Mode is re-selected; appends need key-value items | .../googlesheets/common-issues/ | 2026-10-30 | page current |
| Credentials: OAuth2 recommended; Sheets supports OAuth2 and service account; self-hosted must create its own Google OAuth app; Drive API also enabled; External app in Testing expires tokens after 7 days | https://docs.n8n.io/integrations/builtin/credentials/google/ and .../google/oauth-single-service/ | 2026-10-30 | page current |

## UNVERIFIED (never guessed)
- How Append or Update Row picks the matching column (the docs list no "Column to Match On" for it; the Append Row page mentions it, which looks like a copy error). Fallback: Get Row(s) then Update Row or Append Row as two steps. Confirm Update Row can match on `log_key` / `run_key`, and what happens when two rows match (only the first updates).
- "Always Output Data" is not a documented Sheets option; expected under the node Settings tab.
- Exact scopes the Google credential requests.
- Output formatting: unformatted-values option label, and whether dates arrive as text or serial numbers.
- Whether a re-read right after an append sees the new row (read-after-write delay).
- Quota numbers.

## How to prove it
Test cases T1, T9, T22, T27, T28, T41. Evidence: execution log showing item counts out of each read, screenshots of the written tabs (synthetic), failure test by revoking the credential on the Sandbox.

## Owner decisions needed
- Create the spreadsheet with the tabs in design section 6 (header rows locked) and the OAuth2 credential. One file with separate tabs (recommended; Google credentials are per account, so a second file gives no extra access control).
- Google OAuth app status (Production / Internal / weekly reconnect).
