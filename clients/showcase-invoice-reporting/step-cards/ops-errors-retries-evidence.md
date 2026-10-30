# Step card: Errors, retries, timeouts, the shared error alert and test evidence

**Workflow:** W1, W2, W3 and the shared error alert · **Type:** ops · **Specialist:** ops · **n8n version assumed:** UNKNOWN
**Prepared:** 2026-10-28 by the architect in the ops-specialist role, from docs.n8n.io. **Revised 2026-10-30** after `reviews/ops-review.md` (3 must-fix and 3 small items applied).

## What it does (plain English)
Every step that talks to an outside service has a deliberate failure rule. Anything that crashes or is stopped on purpose (for example a total mismatch) ends the run in an Error. On a scheduled run, the shared alert then sends the owner a Slack message with the workflow name, the failing step and a link. Nothing fails silently, and no reminder is ever sent when a check fails.

## Fields
| Direction | Field | Type | Rule or example |
|---|---|---|---|
| In | Error Trigger output | object | workflow.name, workflow.id, execution.id, execution.url, execution.lastNodeExecuted, execution.error.message, execution.mode. If the trigger node itself failed the data is under `trigger.*` |
| Out | Slack alert | text | Workflow name, failing step, link, first line of the error. No customer data |

## Connection
- Reuse the existing `SHARED | Error Alert | Error Trigger → Slack alert | v1` (built for SHOW-001, workflow file `clients/showcase-ai-lead-qualifier/workflows/shared-error-alert.json`). No new alert workflow.
- **W1, W2 and W3 each need Settings > Error Workflow set to it, but the exported JSON leaves it blank** (the setting holds a workflow ID that differs per instance). A sticky note on each workflow tells the owner to set it after import. QA checks all three.
- Credential: `Slack - AI Ops Expert` (existing).

## Failure rules (per external node; counts are proposals, ranges UNVERIFIED; Google calls add a few seconds' wait between tries)
| Node | Retry On Fail | On Error | Why |
|---|---|---|---|
| Sheets reads | 3 tries with wait | Stop Workflow | Missing data is worse than no run |
| Sheets writes (report, log) | 3 tries with wait | Stop Workflow | Missing log is loud |
| Sheets **claim** writes (`report_runs`, `reminder_log`) | Append or Update keyed on `run_key` / `log_key`: 3 tries with wait. If keyed matching is not possible: plain Append, **Retry Off** | Stop Workflow (before any approval email) | A retry after a saved-but-timed-out append would write a second row; the re-read guard also catches it |
| LLM chain, try 1 | 2 tries total | Continue (using error output) to the **repair step** | Bad format must reach the repair |
| LLM repair | Off | Continue (using error output) to "omit commentary" | Report must not depend on AI |
| Gmail report email | 2 tries | Stop Workflow | Duplicate to the owner is harmless |
| Gmail approval request | 2 tries | Stop Workflow | Pending row swept later. A retry after a partial failure may put two approval emails in the inbox: harmless, W3 re-checks the log row |
| Gmail decline draft | 2 tries | Continue (using error output) to END | Log already written |
| Gmail customer reminder | **Off** | Continue (using error output) to log `send_failed` then Stop and Error | A retry could double-send to a customer |
| Slack summary | 3 tries with wait | Continue (using error output) to log `slack_sent = no` then Stop and Error | Email already delivered |
| Execute Sub-workflow (W2 to W3) | Off | Continue (using error output), mark the claim row `send_failed` / note `child_not_started`, Stop and Error | **Catches only a failure to start the child.** With Wait off, W2 never sees the child's result: a crash inside W3 is caught by W3's own Error Workflow setting, and the claim row stays `pending` until swept |

## Workflow settings
| Setting | W1 | W2 | W3 |
|---|---|---|---|
| Time zone | explicit | explicit | explicit |
| Timeout Workflow | 5 minutes | 5 minutes | **Unset.** Docs say it cancels "the current workflow execution" and do not say whether that includes waiting ones; a short value could cancel approvals. Ask the admin about any instance-wide timeout |
| Save failed production executions | On | On | On |
| Save successful production executions | On, short retention | On, short retention | On, short retention |
| Save manual executions | On while testing | On | On |
| Error Workflow | blank in JSON; owner sets shared alert | same | same |
| "This workflow can be called by" | default | default | allow only W2 (verify option wording) |

## Limits and cost
Error workflow runs only on failures (expect under 5 a month). The Error Trigger cannot be tested with a manual run and does not need to be published (verified). Execution data holds invoice figures and names, so retention should be short. Cloud counting: only top-level production executions count; error-workflow runs and sub-workflow runs do not (docs.n8n.io/workflows/executions/, 2026-10-30).

## Verified facts
| Fact | Source | Date | n8n version |
|---|---|---|---|
| Error Trigger fields; `execution.id`/`url` exist only if the execution is saved; trigger-node errors have a different shape; **runs only for automatic executions: "You can't test error workflows when running workflows manually"**; error workflow need not be published | https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.errortrigger/ | 2026-10-30 | page current |
| One error workflow can serve several workflows; Stop and Error forces a failure that triggers it; the page says nothing on Retry/On Error | https://docs.n8n.io/flow-logic/error-handling/ | 2026-10-30 | page current |
| Workflow Settings: Error Workflow, Timezone, Timeout Workflow, Save execution settings, Estimated time saved, "This workflow can be called by" | https://docs.n8n.io/workflows/settings/ | 2026-10-30 | page current |
| On Error options: Stop Workflow, Continue, Continue (using error output). Retry On Fail "reruns until it succeeds". Always Output Data returns an empty item when a node returns nothing (the page warns against using it on IF nodes). **No Max Tries / Wait numbers on the page** | https://docs.n8n.io/workflows/components/nodes/ | 2026-10-30 | page current |
| Wait node: waiting executions offload data to the database; Limit Wait Time exists; each execution has its own resume URL | https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.wait/ | 2026-10-30 | page current |
| Only top-level production executions count toward quota; error-workflow runs do not | https://docs.n8n.io/workflows/executions/ | 2026-10-30 | page current |

## UNVERIFIED (never guessed)
- Allowed Max Tries and Wait Between Tries ranges, and whether Max Tries counts the first attempt. Numbers above are proposals; the builder sets them in the node Settings and confirms on import.
- Whether Timeout Workflow applies to a paused (waiting) execution (test only on the Sandbox with a tiny value).
- Whether W3's own Error Workflow fires when W3 fails while called as a sub-workflow.
- Whether "Estimated time saved" should be filled: leave blank until a real figure exists (Insights counts production runs only).
- Instance-wide timeout variables and retention.

## How to prove it (evidence plan)
**Only a real scheduled failure proves the Slack alert (T30, owner-arranged, including one that fails inside W3).** Every manual-run case is proven by: the execution ends in status Error, the Stop and Error message shown in Executions, and the log row. Cases that earlier said "alert received" (T2, T3, T4 Variant D, T9, T23, T25, T26, T27, T31) now read "ends in Error with this message". Timeout test T17: set `approval_wait_hours` to a few minutes, then record the count of Waiting executions afterwards. Insights and time saved: not evidence (production runs only). Full table: design section 14.5.

## Owner decisions needed
- Confirm the shared alert's Slack channel (set in SHOW-001) is also right for invoice alerts.
- After import, set Error Workflow on W1, W2, W3.
