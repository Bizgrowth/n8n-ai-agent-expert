# Triggers review: SHOW-002 (trigger-schedules card + design trigger/sub-workflow/error-workflow claims)

**Reviewer:** n8n-triggers-expert · **Date:** 2026-10-30 · **n8n version:** UNKNOWN (owner has not confirmed) · **Files reviewed:** `design.md`, `step-cards/trigger-schedules.md` (neither edited)

## Verdict: OK, with 5 small fixes

The schedule choice is right: nothing outside n8n starts these jobs, so a webhook or polling trigger would add nothing. Facts on the card match the docs. The fixes below are wording and gaps, none change the design.

## Corrections

1. **Missed-run options: version wording is incomplete.** Card says they "need durable scheduler (default on from 2.45.0)". The docs give two conditions: the options exist from **n8n 2.36, on Schedule Trigger nodes added from that version onward**, and they need the durable scheduler (on by default from 2.45.0; off if `N8N_SCHEDULER_ENABLED=false`). So an imported node of an older version may not show them. Business point: for the weekly report, "Run the Most Recent Missed Execution" is safe because the run claim blocks duplicates. Offer it to the owner as a choice if the version supports it; default stays "Don't Run Missed".
   Source: https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.scheduletrigger/ (read 2026-10-30).
2. **"Publish" wording.** The Schedule Trigger page says "save and publish the workflow" and never says "activate". Card says "published/active", which is fine. Design section 2 item 8 can stay open until the instance shows its button.
3. **Execute Workflow terms in the design (W2 step 16).** Docs name the node **Execute Sub-workflow**, mode **"Run once for each item"** (design says "each item"), and the option **"Wait for Sub-Workflow Completion"** (On/Off). Use these exact labels in the builder brief. Source: https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.executeworkflow/
4. **W3 trigger.** "Define using fields below" is a real mode (the other two are "Define using JSON example" and "Accept all data"). Fine as designed. Note the docs: a sub-workflow that has errors **cannot be triggered by its parent**, so W3 must import clean before W2 can start it. Source: https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.executeworkflowtrigger/
5. **Caller policy.** Setting is labelled **"This workflow can be called by"** ("Choose which other workflows can call this workflow"). The docs do not list its choices, so "only W2" stays verify-on-import. Source: https://docs.n8n.io/workflows/settings/

## Checked and correct

- Rules: Weeks (weekday, hour, minute) and Days (hour, minute) exist. Cron has a 6-field form; not needed here.
- Time zone: workflow zone is used if set, else instance zone; self-hosted default America/New York. The design's "set explicitly, never rely on New York" is right.
- Error workflow: set per workflow in Settings ("Select a workflow to trigger if the current workflow fails"); the target must start with an Error Trigger. One error workflow can serve several workflows, so reusing the SHOW-001 alert is valid.
- "Shared alert fires only on automatic runs; manual run cannot prove it": confirmed by the Error Trigger page ("The Error Trigger only runs when an automatic workflow errors"; "You can't test error workflows when running workflows manually"). Source: https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.errortrigger/. The general error-handling page is vaguer (its sample shows `mode: manual`); I chose the Error Trigger page because it is explicit. T30 stays as designed.
- Timeout Workflow cancels an execution after a set time. Whether it cancels a waiting W3 run is still unverified (docs do not say).

## Verify on import (cannot be settled from docs)

1. n8n version and edition, then whether the Schedule Trigger shows the missed-run option.
2. Daylight saving: docs are silent. 07:00 and 08:00 avoid the risky night hours; keep that. Owner may check the first run after a clock change.
3. Imported JSON carries the workflow **time zone** setting: open Settings on W1, W2, W3 and confirm the zone is the owner's, not New York.
4. **Error Workflow setting does not travel safely in JSON.** It points to a workflow ID, and IDs differ per instance (my inference, not stated in docs). Builder should leave it blank with a sticky-note instruction; owner picks `SHARED | Error Alert` in Settings after import, on all three workflows.
5. Does a failure inside W3 (started by W2 with "Wait" off) fire the error workflow when W2 ran on schedule? Docs do not say. Prove with one owner-run scheduled failure after activation (extends T30 to W3).
6. Manual test of a Schedule Trigger: docs are silent. Expected: "Execute workflow" in the editor starts it. Confirm once.
7. W3 child workflows start for every item when Wait is Off (already item 7 in design section 17).

## Does not change gate status
Advisory only. Nothing was built, activated or changed in n8n.
