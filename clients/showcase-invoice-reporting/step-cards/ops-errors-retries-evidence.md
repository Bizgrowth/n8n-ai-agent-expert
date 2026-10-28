# Step card: Errors, retries, timeouts, the shared error alert and test evidence

**Workflow:** W1, W2, W3 and the shared error alert · **Type:** ops · **Specialist:** ops · **n8n version assumed:** UNKNOWN
**Prepared:** 2026-10-28 by the architect in the ops-specialist role, from docs.n8n.io. Specialist review pass recommended before build.

## What it does (plain English)
Every step that talks to an outside service has a deliberate failure rule. Anything that crashes or is stopped on purpose (for example a total mismatch) sends the owner an alert with the workflow name, the failing step and a link. Nothing fails silently, and no reminder is ever sent when a check fails.

## Fields
| Direction | Field | Type | Rule or example |
|---|---|---|---|
| In | Error Trigger output | object | workflow.name, workflow.id, execution.id, execution.url, execution.lastNodeExecuted, execution.error.message, execution.mode. If the trigger node itself failed the data is under `trigger.*` |
| Out | Slack alert | text | Workflow name, failing step, link, first line of the error. No customer data |

## Connection
- Reuse the existing `SHARED | Error Alert | Error Trigger → Slack alert | v1` (built for SHOW-001, workflow file `clients/showcase-ai-lead-qualifier/workflows/shared-error-alert.json`). No new alert workflow. W1, W2 and W3 each set Settings > Error Workflow to it.
- Credential: `Slack - AI Ops Expert` (existing).

## Failure rules (per external node; counts are proposals, ranges UNVERIFIED)
| Node | Retry On Fail | On Error | Why |
|---|---|---|---|
| Sheets reads | 3 tries | Stop Workflow | Missing data is worse than no run |
| Sheets writes (report, log) | 3 tries | Stop Workflow | Missing log is loud |
| Sheets claim write (W2) | 3 tries | Stop Workflow | Before any approval email |
| LLM chain | 2 tries | Continue (using error output) to "omit commentary" | Report must not depend on AI |
| Gmail report email | 2 tries | Stop Workflow | Duplicate to the owner is harmless |
| Gmail approval request | 2 tries | Stop Workflow | Pending row swept later |
| Gmail customer reminder | **Off** | Continue (using error output) to log `send_failed` then Stop and Error | A retry could double-send to a customer |
| Slack summary | 3 tries | Continue (using error output) to log `slack_sent = no` then Stop and Error | Email already delivered |
| Execute Workflow (W2 to W3) | Off | Continue (using error output), mark the claim row `send_failed`/note, Stop and Error | Child failure must not lose the claim |

## Workflow settings
| Setting | W1 | W2 | W3 |
|---|---|---|---|
| Time zone | explicit | explicit | explicit |
| Timeout Workflow | 5 minutes | 5 minutes | **UNVERIFIED**: a short timeout may cancel a waiting execution. Set it to longer than `approval_wait_hours` if the instance allows, else leave unset and record why |
| Save failed production executions | On | On | On |
| Save successful production executions | On, short retention | On, short retention | On, short retention |
| Save manual executions | On while testing | On | On |
| Error Workflow | shared alert | shared alert | shared alert |
| Caller policy | default | default | allow only W2 (verify option wording) |

## Limits and cost
Error workflow runs only on failures (expect under 5 a month). The Error Trigger cannot be tested with a manual run and does not need to be published (verified). Execution data holds invoice figures and names, so retention should be short.

## Verified facts
| Fact | Source | Date | n8n version |
|---|---|---|---|
| Error Trigger fields; `execution.id`/`url` exist only if the execution is saved; trigger-node errors have a different shape; cannot be tested by manual run; error workflow need not be published | https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.errortrigger/ | 2026-10-28 | page current |
| One error workflow can serve several workflows; Stop and Error forces a failure that triggers it | https://docs.n8n.io/flow-logic/error-handling/ | 2026-10-28 | page current |
| Workflow Settings: Error Workflow, Timezone, Timeout Workflow, Save execution settings (failed, successful, manual, progress), Estimated time saved, Caller policy | https://docs.n8n.io/workflows/settings/ | 2026-10-28 | page current |
| Node settings Retry On Fail and On Error choices are standard in our rules | `docs/n8n-app-map.md` section 4 | 2026-10-28 | n/a |

## UNVERIFIED (never guessed)
- Allowed Max Tries and Wait Between Tries ranges (docs pages reached do not state them). Numbers above are proposals; builder sets them in the node Settings and confirms on import.
- Whether Timeout Workflow applies to a paused (waiting) execution.
- Whether Estimated time saved should be filled: leave blank until a real figure exists (Insights counts production runs only).

## How to prove it
Test T9, T25, T26, T30, T31. Evidence per case: execution status, the Slack alert text (workflow, failing step, link, no customer data), and the log row. The shared alert only fires on an automatic (scheduled) failure, so QA needs the owner to run the Sandbox workflow once from the schedule or accept "fired on a real failed run" evidence from the Executions list; manual runs cannot prove it.

## Owner decisions needed
- Confirm the shared alert's Slack channel (set in SHOW-001) is also right for invoice alerts.
