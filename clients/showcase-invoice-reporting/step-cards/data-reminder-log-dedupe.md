# Step card: Overdue scan, reminder log, dedupe and payment re-check

**Workflow:** W2 daily scan, W3 per-invoice approval · **Type:** data · **Specialist:** data · **n8n version assumed:** UNKNOWN
**Prepared:** 2026-10-28 by the architect in the data-specialist role, from docs.n8n.io. Specialist review pass recommended before build.

## What it does (plain English)
Finds invoices that are overdue, works out which of the three reminder levels each one is at, and skips any that already have a reminder for that level or have been paid. The log remembers what happened to each reminder so nobody is chased twice for the same level.

## Fields
| Direction | Field | Type | Rule or example (synthetic) |
|---|---|---|---|
| Key | `log_key` | string | `invoice_no\|tier`, e.g. `INV-1007\|t2`. The dedupe key |
| In | invoices row | object | same shape as the report card |
| Derived | tier | string | `t1` days_past_due 1 to 7, `t2` 8 to 30, `t3` 31 and over, else `not_overdue` (labelled fallback) |
| Out | `reminder_log` row | object | log_key, invoice_no, tier, status, approver_decision, days_past_due_at_claim, currency, balance_at_claim, claimed_at, decided_at, sent_at, scan_execution_id, child_execution_id, note |
| Not stored | email, name, message text | | Minimization: the log holds invoice number and money only |

## Status values (`reminder_log.status`)
`pending` (claimed, waiting for approval) , `sent`, `declined`, `timed_out`, `stopped_paid`, `stopped_changed`, `skipped_no_email`, `send_failed`.
Any existing row with the same `log_key`, in any status, blocks a new draft for that tier (one reminder per invoice per tier). A `pending` row on any tier of the same invoice also blocks new drafts for that invoice until it is resolved (one open approval per invoice).

## Connection
- Nodes: Google Sheets (Get Row(s), Append Row, Update Row), Compare Datasets, Filter, IF, Switch, Limit, Execute Workflow. typeVersions: verify on import. Credential: see Google Sheets card.
- Log lives in the `reminder_log` tab (brief decision: Sheets holds the reminder log). Alternative: a Data table (see UNVERIFIED).

## Dedupe and re-check order (W2 then W3)
1. W2 reads invoices and the log once (no lookups in a loop).
2. Keep only doc_type invoice, status open, balance > 0, valid dates.
3. Compare Datasets: invoices-with-key (Input A) against log keys (Input B), using "In A only" so already-logged keys drop out.
4. Drop invoices that have any `pending` log row.
5. Limit to `max_drafts_per_run` (proposal 10). The rest wait for tomorrow because they are not yet in the log.
6. Missing or malformed customer email: write a `skipped_no_email` row (so it is not retried daily) and stop for that invoice.
7. Append the `pending` claim row for each remaining invoice, then call W3 per invoice.
8. W3 re-reads that single invoice fresh: payment re-check 1 (before the approval email). It also checks the tier is unchanged.
9. After the owner approves, W3 re-reads the log row (must still be `pending`) and the invoice again: payment re-check 2 (immediately before the send).
10. Stale sweep at the start of each W2 run: `pending` rows older than `approval_wait_hours + 2` hours become `timed_out`.

## If it fails
| Failure | What n8n does | What our design does | Alert |
|---|---|---|---|
| Log read fails | Node errors | Stop Workflow. Never scan without the log (duplicates are worse than a missed day) | Shared alert |
| Claim write fails | Node errors | Retry On Fail, then Stop before any approval email | Shared alert |
| Overlapping or re-run scan | Second run reads the log | Claim rows from the first run block duplicates | none |
| Invoice paid mid-flow | Source row changes | Re-checks 1 and 2 stop the send, log `stopped_paid` | none (logged) |
| Invoice deleted or renamed in source | Lookup returns nothing | Treat as `stopped_changed`, no send | none (logged) |

## Limits and cost
Sheets is not atomic; the single sequential claim step plus the "In A only" filter is the guard. One scan per day, so a race needs two scans at the same moment (a manual run during the scheduled run); T21 covers a double run. Data table alternative has a 200 MiB default shared limit with 80% warning (verified), and Code nodes cannot read data tables (verified).

## Verified facts
| Fact | Source | Date | n8n version |
|---|---|---|---|
| Compare Datasets outputs In A only, Same, Different, In B only; match on Input A Field and Input B Field, extra pairs via Add Fields to Match; Fuzzy Compare tolerates 3 vs "3" | https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.comparedatasets/ | 2026-10-28 | page current |
| Data Table row ops: Insert, Get, Update, Upsert, Delete, If Row Exists, If Row Does Not Exist | https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.datatable/ | 2026-10-28 | page current |
| Data tables: 200 MiB default shared limit, warning near 80%, Code node cannot access them | https://docs.n8n.io/data/data-tables/ | 2026-10-28 | page current |
| Execute Sub-workflow: modes (all items once / each item), option Wait For Sub-Workflow Completion, input fields defined on the sub-workflow trigger | https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.executeworkflow/ and .../executeworkflowtrigger/ | 2026-10-28 | page current |
| Loop Over Items: Batch Size, loop and done outputs | .../n8n-nodes-base.splitinbatches/ | 2026-10-28 | page current |

## UNVERIFIED (never guessed)
- Compare Datasets with an empty Input B (first-ever run, empty log): confirm it passes everything as "In A only" (test T20 first-run variant).
- Data Table node column types and filter syntax (docs page silent). Sheets chosen for the log per the brief; Data table is an owner option.
- Whether Execute Workflow "each item" mode with Wait For Sub-Workflow Completion off starts all children immediately.
- Date-only comparison details in Sheets (text vs serial dates), see Sheets card.

## How to prove it
Tests T14 to T24, T28. Evidence: log rows before and after each scenario, execution counts, no extra emails in the test inbox.

## Owner decisions needed
- Skipped/declined/timed-out tier is final for that tier (recommended, avoids daily nagging) vs re-ask daily.
- `max_drafts_per_run` = 10 and `approval_wait_hours` = 48 (proposals).
