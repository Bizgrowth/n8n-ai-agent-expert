# Step card: Per-invoice approval sub-workflow (Execute Sub-workflow + waiting execution)

**Workflow:** W2 calls W3 · **Type:** ops / trigger · **Specialist:** ops (with triggers) · **n8n version assumed:** UNKNOWN
**Prepared:** 2026-10-28 by the architect in the ops-specialist role, from docs.n8n.io. **Revised 2026-10-30** after `reviews/ops-review.md`, `reviews/triggers-review.md` and `reviews/data-review.md`.

## What it does (plain English)
Each overdue invoice gets its own small run (W3) that asks the owner for approval and waits. This way one unanswered approval cannot hold up the daily scan or the other invoices, and each reminder has its own clear record in Executions. After the owner responds, W3 re-reads the log row and the invoice before doing anything.

## Fields
| Direction | Field | Type | Rule or example (synthetic) |
|---|---|---|---|
| In (W3 trigger) | `invoice_no` | string | `INV-1007` |
| In | `tier` | string | `t1`, `t2` or `t3` |
| In | `log_key` | string | `INV-1007\|t2` |
| Not passed | amounts, names, emails | | W3 re-reads the invoice from the source so it never trusts stale or passed data. The balance the owner is shown is stored on the log row (`balance_shown`) before the approval email, so the final check does not depend on data surviving the wait |

## Connection
- Nodes: **Execute Sub-workflow** (in W2, mode **"Run once for each item"**), **Execute Workflow Trigger** "Define using fields below" (in W3). typeVersions: verify on import. No credentials.
- W2 option **"Wait For Sub-Workflow Completion": Off**, so W2 finishes in seconds and does not itself wait days for approvals. Each W3 is its own execution.
- **W3 must import with no errors** (a sub-workflow with errors cannot be triggered by its parent). Its setting "This workflow can be called by" should allow only W2 (wording: verify). Its Error Workflow is left blank in the JSON; the owner sets the shared alert after import.
- W3 Timeout Workflow: **unset** (may cancel waiting executions; unverified).

## Order inside W3 after the owner responds
1. Re-read the log row and the invoice.
2. Row not `pending`, or older than `approval_wait_hours + 2`? End with **no write**. A late Decline cannot overwrite `timed_out`; a late Approve sends nothing.
3. `approved` not exactly true? Update the row (`declined`, or `timed_out`/`declined_or_timeout`), then optional separate Gmail Create a draft node, END.
4. Approved: invoice still collectable AND `balance` equals `balance_shown` AND tier unchanged? If not, `stopped_paid` / `stopped_changed`, no send. Otherwise send, then log `sent`.

## If it fails
| Failure | What n8n does | What our design does | Alert |
|---|---|---|---|
| W3 has an error at import | Parent cannot trigger a sub-workflow that contains errors (verified) | Fix before import; QA T32 confirms W3 imports clean | n/a |
| W3 fails to start from W2 | W2's error output (Continue using error output) | Claim row marked `send_failed`, note `child_not_started`, Stop and Error | Run ends in Error; shared alert on scheduled runs |
| W3 crashes after starting | **Not visible to W2** (Wait is off). W3's own Error Workflow setting handles it (whether it fires for a sub-workflow run: verify) | Claim row stays `pending` and is swept to `timed_out` | Slack, if W3's error workflow fires |
| W3 waits for a long time | Execution data is offloaded to the database and reloaded on resume (verified for the Wait node) | Wait limit `approval_wait_hours` **if the Gmail node offers one**; otherwise the unanswered W3 run stays in status Waiting until stopped by hand or pruned by retention. The late-click link still works but the post-click guard makes it harmless. QA records the count of Waiting executions after T17 | none |
| Owner forwards the approval email | Each run has its own resume link; anyone holding the email can use it | Showcase is owner-only; note "do not forward the approval email"; the guards still re-check everything | none |

## Limits and cost
One extra execution per reminder drafted. On Cloud, per docs.n8n.io/workflows/executions/ (2026-10-30) only top-level production executions count, so sub-workflow runs are not counted; self-hosted has no per-run fee. A waiting execution holds a database row until it ends.

## Verified facts
| Fact | Source | Date | n8n version |
|---|---|---|---|
| Execute Sub-workflow: Source options, Workflow Inputs, option Wait For Sub-Workflow Completion, Mode (once with all items, or once per item), "View sub-execution" link | https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.executeworkflow/ | 2026-10-30 | page current |
| Sub-workflow trigger input modes: define using fields, define using JSON example, accept all data; parent cannot trigger a sub-workflow with errors | .../n8n-nodes-base.executeworkflowtrigger/ | 2026-10-30 | page current |
| Wait node: waiting executions offload data to the database; Limit Wait Time (After Time Interval or At Specified Time) exists on the Wait node; it does not state what status is set when the limit is hit | https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.wait/ | 2026-10-30 | page current |
| Gmail send-and-wait docs list no Limit Wait Time (see Gmail card) | https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.gmail/message-operations/ | 2026-10-30 | page current |
| Timeout Workflow cancels "the current workflow execution"; applicability to waiting executions not stated | https://docs.n8n.io/workflows/settings/ | 2026-10-30 | page current |

## UNVERIFIED (never guessed)
- Whether the Gmail approval node has Limit Wait Time, accepts an expression, and what it outputs at the limit.
- Whether "each item" mode starts all children without waiting, and whether a start failure reaches the error output.
- Whether a manual (editor) run of W2 starts W3 children that pause and resume correctly, and how child executions are saved.
- Whether W3's own Error Workflow fires when W3 fails while called as a sub-workflow.
- Caller-policy wording to restrict W3 to W2.

## How to prove it
Tests T15 to T19, T32, T39, T42. Evidence: parent and child executions linked ("View sub-execution"), child paused status, log rows, the Waiting-execution count after T17. For T17 set `approval_wait_hours` to a few minutes so the test does not take two days.

## Owner decisions needed
- Accept one sub-workflow (decided; reusable for the later Xero/QuickBooks swap) vs a single workflow with a loop.
