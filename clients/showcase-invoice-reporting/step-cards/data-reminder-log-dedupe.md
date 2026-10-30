# Step card: Overdue scan, reminder log, dedupe and payment re-check

**Workflow:** W2 daily scan, W3 per-invoice approval · **Type:** data · **Specialist:** data · **n8n version assumed:** UNKNOWN
**Prepared:** 2026-10-28 by the architect in the data-specialist role, from docs.n8n.io. **Revised 2026-10-30** after `reviews/data-review.md` and `reviews/ops-review.md`.

## What it does (plain English)
Finds invoices that are overdue, works out which of the three reminder levels each one is at, and skips any that already have a reminder for that level or have been paid. The log remembers what happened to each reminder so nobody is chased twice for the same level. Just before sending, it also checks that the invoice still says what the owner approved.

## Fields
| Direction | Field | Type | Rule or example (synthetic) |
|---|---|---|---|
| Key | `log_key` | string | `invoice_no\|tier`, e.g. `INV-1007\|t2`. The dedupe key. `invoice_no` is converted to text on both sides of every compare |
| In | invoices row | object | same shape and validity rules as the report card; a repeated `invoice_no` marks those rows as bad data |
| Derived | tier | string | `t1` days_past_due 1 to 7, `t2` 8 to 30, `t3` 31 and over, else `not_overdue` (labelled fallback) |
| Out | `reminder_log` row | object | log_key, invoice_no, tier, status, approver_decision, days_past_due_at_claim, currency, balance_at_claim, **balance_shown**, claimed_at, decided_at, sent_at, scan_execution_id, child_execution_id, note |
| Not stored | email, name, message text | | Minimization: the log holds invoice number and money only. `note` holds codes only (`child_not_started`, `declined_or_timeout`), never exception text |

## Status values (`reminder_log.status`)
`pending` (claimed, waiting for approval), `sent`, `declined`, `timed_out`, `stopped_paid`, `stopped_changed`, `skipped_no_email`, `send_failed`.
Any existing row with the same `log_key`, in any status, blocks a new draft for that tier (one reminder per invoice per tier). A `pending` row on any tier of the same invoice also blocks new drafts for that invoice until it is resolved (one open approval per invoice). `skipped_no_email` is final for that tier: fixing the address later does not re-ask at that tier.

## Connection
- Nodes: Google Sheets (Get Row(s), Append or Update Row / Append Row, Update Row), Compare Datasets, Remove Duplicates, Filter, IF, Limit, Execute Sub-workflow. typeVersions: verify on import. Credential: see Google Sheets card.
- Log lives in the `reminder_log` tab (brief decision: Sheets holds the reminder log). A Data table would not give an atomic claim either (no uniqueness constraint documented).

## Dedupe and re-check order (W2 then W3)
1. W2 reads invoices and the log once (no lookups in a loop).
2. Sweep: `pending` rows older than `approval_wait_hours + 2` hours become `timed_out`. Step 12 below uses the same timestamp cut-off, not the swept status (the log was read before the sweep).
3. Keep only doc_type invoice, status open, balance > 0, valid dates, unique invoice_no.
4. Compare Datasets: invoices-with-key (Input A) against log keys (Input B), match `log_key`, take **In A only**. Settings: Fuzzy Compare **off** (keys are text; 3 is not "3" otherwise), Multiple Matches set deliberately (default is Include All Matches). A blank item in B (Always Output Data on an empty log) must have an empty `log_key` that matches nothing; the first run must pass every invoice as In A only. If the node does not run on an empty Input B, add an explicit "log is empty" bypass.
5. Drop invoices with a `pending` (not stale) row, by `invoice_no`, same Compare settings.
6. Missing or malformed customer email: write a `skipped_no_email` row (so it is not retried daily) and stop for that invoice.
7. **Remove Duplicates on `log_key`**, then Limit to `max_drafts_per_run` (proposal 10). The rest wait for tomorrow because they are not yet in the log.
8. **Claim, then re-read.** Append or Update Row keyed on `log_key` (`pending`, `claimed_at`, scan execution id). If keyed matching is not possible, plain Append with **Retry Off**. Then re-read the log and confirm **exactly one row exists for this `log_key` and it is this scan's**. If not, skip that invoice (counted, alerted at the end). Honest wording: Sheets has no atomic insert-if-absent, so this narrows the race but does not remove it; when it cannot confirm it stops that invoice (fails safe). A retried plain append that saved twice is also caught here; the stale sweep later turns the extra `pending` rows into `timed_out`, which closes that tier until the owner deletes the rows by hand.
9. Start W3 per invoice (Execute Sub-workflow, "Run once for each item", Wait off).
10. W3 re-reads that single invoice fresh: payment re-check 1 (before the approval email), also checking the tier is unchanged. It then stores `balance_shown` on the log row.
11. After the owner responds, W3 re-reads the log row (must still be `pending` and not past the cut-off; otherwise end with no write, so a late Decline cannot overwrite `timed_out`) and the invoice. On Approve: payment re-check 2 requires the invoice still collectable **and `balance` equals `balance_shown` and the recomputed tier equals `tier`**; otherwise `stopped_paid` / `stopped_changed` and no send. This stops a stale message going out after a partial payment or tier change during the wait.

## If it fails
| Failure | What n8n does | What our design does | Alert |
|---|---|---|---|
| Log read fails | Node errors | Stop Workflow. Never scan without the log (duplicates are worse than a missed day) | Run ends in Error; shared alert on scheduled runs |
| Claim write fails | Node errors | Retry (keyed) or none (plain append), then Stop before any approval email | same |
| Overlapping or re-run scan | Second run reads the log | Claim rows from the first run block duplicates; the re-read guard catches simultaneous claims | none or count alert |
| Invoice paid or changed mid-flow | Source row changes | Re-checks 1 and 2 stop the send, log `stopped_paid` / `stopped_changed` | none (logged) |
| Invoice deleted or renamed in source | Lookup returns nothing | Treat as `stopped_changed`, no send | none (logged) |
| Same invoice_no twice in source | Compare keeps both | Treated as bad data; Remove Duplicates as a safety net | count alert |
| W2 switched off | Sweep does not run | `pending` rows stay and block that invoice's tier until W2 runs again | none |

## Limits and cost
Sheets is not atomic; the claim, re-read and exactly-one-row guard is the mitigation. One scan per day, so a race needs two scans at the same moment (a manual run during the scheduled run); T21 and T40 cover it. The whole log is read daily: fine for a demo; a real client needs a monthly archive tab. Data tables: 200 MiB default shared limit with 80% warning, Code node cannot access them (verified 2026-10-30).

## Verified facts
| Fact | Source | Date | n8n version |
|---|---|---|---|
| Compare Datasets outputs In A only, Same, Different, In B only; match on Input A Field and Input B Field, extra pairs via Add Fields to Match; Fuzzy Compare tolerates 3 vs "3"; Multiple Matches option; empty-Input-B behaviour not documented | https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.comparedatasets/ | 2026-10-30 | page current |
| Data Table row ops: Insert, Get, Update, Upsert, Delete, If Row Exists, If Row Does Not Exist | https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.datatable/ | 2026-10-28 | page current |
| Data tables: 200 MiB default shared limit, warning near 80%, workflow writes fail past the limit, Code node cannot access them; no column types or uniqueness constraint documented | https://docs.n8n.io/data/data-tables/ | 2026-10-30 | page current |
| Execute Sub-workflow: modes, Wait For Sub-Workflow Completion; trigger input modes | https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.executeworkflow/ and .../executeworkflowtrigger/ | 2026-10-30 | page current |

## UNVERIFIED (never guessed)
- Compare Datasets with an empty Input B and with a blank item in B (T20 first-run variant).
- Whether Update Row picks the first match when two rows share a key, and whether Append or Update can match on `log_key`.
- Whether a re-read right after an append sees the new row.
- Whether data from earlier W3 nodes is available after the wait (design avoids needing it by storing `balance_shown` on the log row).
- Whether "each item" mode with Wait off starts all children immediately.
- Date-only comparison details in Sheets (text vs serial), see Sheets card.

## How to prove it
Tests T14 to T24, T28, T33, T36, T39, T40. Evidence: log rows before and after each scenario, execution counts, no extra emails in the test inbox.

## Owner decisions needed
- Skipped/declined/timed-out tier is final for that tier, including `skipped_no_email` (decided).
- `max_drafts_per_run` = 10 and `approval_wait_hours` = 48 (accepted).
