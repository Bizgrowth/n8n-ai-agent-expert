# Step card: Weekly and daily schedule triggers

**Workflow:** W1 weekly report, W2 daily overdue scan · **Type:** trigger · **Specialist:** triggers · **n8n version assumed:** UNKNOWN (owner to confirm)
**Prepared:** 2026-10-28 by the architect in the triggers-specialist role, from docs.n8n.io. A specialist review pass is still recommended before build.

## What it does (plain English)
Two clocks. One starts the weekly report on Monday morning. The other starts the overdue check every morning. Neither needs anything from outside n8n.

## Fields
| Direction | Field | Type | Rule or example (synthetic) |
|---|---|---|---|
| Config | W1 rule | Weeks interval | Every 1 week, Monday, 07:00 (proposal) |
| Config | W2 rule | Days interval | Every 1 day, 08:00 (proposal) |
| Config | Workflow time zone | Setting | Set explicitly on both workflows (owner supplies the zone) |
| Out | Trigger item | timestamp fields | Used only to start the run; business dates are computed in the Settings step, not taken from the trigger |

## Connection
- Node and version: Schedule Trigger. typeVersion: verify on import.
- Credential: none.
- Where the owner creates it: nothing to create.

## If it fails
| Failure | What n8n does | What our design does | Alert |
|---|---|---|---|
| Server down at trigger time | Default "Don't Run Missed Executions" (verified). A missed run is skipped | W1: owner re-runs manually (idempotent, see data card). W2: next day's scan picks up everything still overdue | None automatic (nothing ran). Owner sees the gap in Executions |
| Workflow error after trigger | Error workflow fires | Shared error alert | Slack |

## Limits and cost
One execution per fire. Webhook not used: no inbound event exists, so schedule is the right trigger (a polling or webhook design would add nothing).

## Verified facts
| Fact | Source | Date | n8n version |
|---|---|---|---|
| Rules: Weeks has Trigger on Weekdays, Hour, Minute; Days has Hour, Minute; Custom Cron exists | https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.scheduletrigger/ | 2026-10-28 | page current |
| Workflow time zone is used if set; otherwise instance zone; self-hosted default America/New York | same | 2026-10-28 | page current |
| A schedule runs only when the workflow is published/active. Owner-only action | same | 2026-10-28 | page current |
| Missed-run options: Don't Run Missed Executions (default), Run Most Recent Missed, Run Most Recent Missed Per Rule; need durable scheduler (default on from 2.45.0) | same | 2026-10-28 | 2.45.0+ |
| Variables in a cron expression are evaluated only at publish time | same | 2026-10-28 | page current |
| Workflow Settings has Timezone, Timeout Workflow, Error Workflow, Save execution settings, Estimated time saved | https://docs.n8n.io/workflows/settings/ | 2026-10-28 | page current |

## UNVERIFIED (never guessed)
- How daylight saving changes affect the fire time (page is silent). Mitigation: avoid 01:00 to 03:00 slots; 07:00 and 08:00 chosen.
- Instance version (decides whether the missed-run options exist).
- Whether a manual test run of a Schedule Trigger needs anything special: use "Execute workflow" in the editor (verify on instance).

## How to prove it
QA runs W1 and W2 manually (Execute workflow) with synthetic data. The real schedule can only be proven after the owner activates, so QA reports "schedule rule inspected, not fired". Evidence: screenshot of the trigger rule and the workflow time zone setting.

## Owner decisions needed
- Workflow time zone.
- Report day and time (proposal Monday 07:00 for the previous Monday to Sunday week) and scan time (proposal 08:00 daily).
