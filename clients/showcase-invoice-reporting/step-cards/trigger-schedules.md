# Step card: Weekly and daily schedule triggers

**Workflow:** W1 weekly report, W2 daily overdue scan · **Type:** trigger · **Specialist:** triggers · **n8n version assumed:** UNKNOWN (owner to confirm)
**Prepared:** 2026-10-28 by the architect in the triggers-specialist role, from docs.n8n.io. **Revised 2026-10-30** after `reviews/triggers-review.md` (all 5 corrections applied).

## What it does (plain English)
Two clocks. One starts the weekly report on Monday morning. The other starts the overdue check every morning. Neither needs anything from outside n8n.

## Fields
| Direction | Field | Type | Rule or example (synthetic) |
|---|---|---|---|
| Config | W1 rule | Weeks interval | Every 1 week, Monday, 07:00 (accepted) |
| Config | W2 rule | Days interval | Every 1 day, 08:00 (accepted) |
| Config | Workflow time zone | Setting | Set explicitly on both workflows (owner supplies the zone). The setting travels in the exported JSON: confirm it on import |
| Config | Missed-run option | Node option | Default "Don't Run Missed Executions". For W1, "Run the Most Recent Missed Execution" is safe (the run claim blocks duplicates) and is an owner choice if the version supports it |
| Out | Trigger item | timestamp fields | Used only to start the run; business dates are computed in the Settings step, not taken from the trigger |

## Connection
- Node and version: Schedule Trigger (node label "Weekly start" in W1, "Daily start" in W2). typeVersion: verify on import.
- Credential: none.
- Where the owner creates it: nothing to create.
- Error Workflow (Settings) is **left blank in the exported JSON** with a sticky note: the setting points to a workflow ID, and IDs differ per instance (inference, not stated in docs). The owner picks `SHARED | Error Alert` on W1, W2 and W3 after import.
- W2 starts W3 with the node **Execute Sub-workflow**, mode **"Run once for each item"**, option **"Wait For Sub-Workflow Completion"** off. W3's trigger is Execute Workflow Trigger with "Define using fields below". **W3 must import with no errors**: a sub-workflow with errors cannot be triggered by its parent. W3's setting "This workflow can be called by" should allow only W2 (option wording: verify on import).

## If it fails
| Failure | What n8n does | What our design does | Alert |
|---|---|---|---|
| Server down at trigger time | Default "Don't Run Missed Executions" (verified). A missed run is skipped | W1: owner re-runs manually (idempotent, see data card). W2: next day's scan picks up everything still overdue | None automatic (nothing ran). Owner sees the gap in Executions |
| Workflow error after trigger | Error workflow fires (once set by the owner) | Shared error alert | Slack |
| Failure inside W3 started by a scheduled W2 | Whether W3's error workflow fires is not documented | W3 sets its own Error Workflow; prove with an owner-run scheduled failure (T30 extended) | Slack, if it fires |

## Limits and cost
One execution per fire. Webhook not used: no inbound event exists, so schedule is the right trigger (a polling or webhook design would add nothing).

## Verified facts
| Fact | Source | Date | n8n version |
|---|---|---|---|
| Rules: Weeks has Trigger on Weekdays, Hour, Minute; Days has Hour, Minute; Custom Cron exists | https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.scheduletrigger/ | 2026-10-30 | page current |
| Workflow time zone is used if set; otherwise instance zone; self-hosted default America/New York | same | 2026-10-30 | page current |
| A schedule runs only when the workflow is saved and published (page never says "activate"). Owner-only action | same | 2026-10-30 | page current |
| Missed-run options (Don't Run Missed default; Run Most Recent Missed; Run Most Recent Missed Per Rule) exist from n8n 2.36 **on Schedule Trigger nodes added from that version onward**, and need the durable scheduler (default on from 2.45.0; off if `N8N_SCHEDULER_ENABLED=false`) | same | 2026-10-30 | 2.36+ |
| Variables in a cron expression are evaluated only at publish time | same | 2026-10-30 | page current |
| Error workflow is set per workflow (Settings); target must start with an Error Trigger; one error workflow can serve several workflows | https://docs.n8n.io/workflows/settings/ and https://docs.n8n.io/flow-logic/error-handling/ | 2026-10-30 | page current |
| The Error Trigger only runs for automatic executions; error workflows cannot be tested from a manual run | https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.errortrigger/ | 2026-10-30 | page current |
| Execute Sub-workflow: modes, "Wait For Sub-Workflow Completion"; trigger input modes (fields / JSON example / accept all); a sub-workflow with errors cannot be triggered by its parent | https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.executeworkflow/ and .../executeworkflowtrigger/ | 2026-10-30 | page current |
| Setting is labelled "This workflow can be called by"; its choices are not listed in docs | https://docs.n8n.io/workflows/settings/ | 2026-10-30 | page current |

## UNVERIFIED (never guessed)
- How daylight saving changes affect the fire time (page is silent). Mitigation: 07:00 and 08:00 avoid the risky night hours; owner checks the first run after a clock change.
- Instance version (decides whether the missed-run options exist on the node).
- Whether a manual test run of a Schedule Trigger needs anything special: expected "Execute workflow" in the editor (confirm once).
- Whether a failure inside W3 fires the error workflow when W2 ran on schedule.
- Whether Timeout Workflow cancels a waiting execution (W3 leaves it unset).
- Caller policy option wording.

## How to prove it
QA runs W1 and W2 manually (Execute workflow) with synthetic data. The real schedule can only be proven after the owner activates, so QA reports "schedule rule inspected, not fired". Evidence: screenshot of the trigger rule and the workflow time zone setting on each of the three workflows.

## Owner decisions needed
- Workflow time zone.
- Optionally the W1 missed-run choice (if the version supports it).
- After import: set Error Workflow on W1, W2, W3.
