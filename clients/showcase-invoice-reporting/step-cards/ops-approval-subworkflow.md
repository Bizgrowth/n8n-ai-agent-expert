# Step card: Per-invoice approval sub-workflow (Execute Workflow + waiting execution)

**Workflow:** W2 calls W3 · **Type:** ops / trigger · **Specialist:** ops (with triggers) · **n8n version assumed:** UNKNOWN
**Prepared:** 2026-10-28 by the architect in the ops-specialist role, from docs.n8n.io. Specialist review pass recommended before build.

## What it does (plain English)
Each overdue invoice gets its own small run (W3) that asks the owner for approval and waits. This way one unanswered approval cannot hold up the daily scan or the other invoices, and each reminder has its own clear record in Executions.

## Fields
| Direction | Field | Type | Rule or example (synthetic) |
|---|---|---|---|
| In (W3 trigger) | `invoice_no` | string | `INV-1007` |
| In | `tier` | string | `t1`, `t2` or `t3` |
| In | `log_key` | string | `INV-1007\|t2` |
| Not passed | amounts, names, emails | | W3 re-reads the invoice from the source so it never trusts stale or passed data |

## Connection
- Nodes: Execute Workflow (in W2), Execute Workflow Trigger "Define using fields below" (in W3). typeVersions: verify on import. No credentials.
- W2 option "Wait For Sub-Workflow Completion": **Off** (recommended), so W2 finishes in seconds and does not itself wait days for approvals. Each W3 is its own execution.

## If it fails
| Failure | What n8n does | What our design does | Alert |
|---|---|---|---|
| W3 has an error | Parent cannot trigger a sub-workflow that contains errors (verified) | Fix before import; QA T32 confirms | n/a |
| W3 fails mid-run | W3 error workflow fires | Shared alert; claim row stays `pending` and is swept to `timed_out` | Slack |
| W3 waits for a long time | Execution data is offloaded to the database and reloaded on resume (verified for Wait node) | Wait limit `approval_wait_hours`; re-check log row and invoice after resume | none |

## Limits and cost
One extra execution per reminder drafted. The docs reached do not say how sub-workflow executions are counted on Cloud (UNVERIFIED); self-hosted has no per-run fee. A waiting execution holds a database row until it ends.

## Verified facts
| Fact | Source | Date | n8n version |
|---|---|---|---|
| Execute Sub-workflow: Source options, Workflow Inputs, option Wait For Sub-Workflow Completion, Mode (once with all items, or once per item) | https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.executeworkflow/ | 2026-10-28 | page current |
| Sub-workflow trigger input modes: define using fields, define using JSON example, accept all data; parent cannot trigger a sub-workflow with errors | .../n8n-nodes-base.executeworkflowtrigger/ | 2026-10-28 | page current |
| Wait node: waiting executions offload data to the database; Limit Wait Time exists for form and webhook resumes | https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.wait/ | 2026-10-28 | page current |

## UNVERIFIED (never guessed)
- Execution counting on Cloud for sub-workflow runs.
- Whether "each item" mode starts all children without waiting.
- Caller-policy wording to restrict W3 to W2.

## How to prove it
Tests T15 to T19, T32. Evidence: parent and child executions linked ("View sub-execution"), child paused status, log rows.

## Owner decisions needed
- Accept one sub-workflow (recommended, reuse for the later Xero/QuickBooks swap) vs a single workflow with a loop.
