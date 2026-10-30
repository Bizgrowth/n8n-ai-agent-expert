# Ops specialist review: SHOW-002 (errors/retries/evidence card and approval sub-workflow card)

**Reviewed:** 2026-10-30 · **Reviewer:** n8n-ops-expert · **Instance version:** UNKNOWN (probe not used; docs only)
**Files reviewed:** `design.md` (sections 7 to 9, 12, 13, 14), `ops-errors-retries-evidence.md`, `ops-approval-subworkflow.md`. Nothing was edited.

## Verdicts

| Card | Verdict |
|---|---|
| `ops-errors-retries-evidence.md` | **Fix needed** (3 must-fix, 3 small) |
| `ops-approval-subworkflow.md` | **Fix needed** (2 must-fix, 2 small) |

Overall: the structure is sound. The "no send unless approved + still pending + still unpaid" design holds. The fixes below are about what n8n can and cannot prove, and two places where the cards promise more than n8n does.

## Corrections: errors/retries/evidence card

**Must fix**

1. **Alert evidence list is too short (business impact: QA will claim an alert test it cannot run).** The card says the alert is proven by T9, T25, T26, T30, T31. But design cases T2, T3, T4 (variant D), T23 and T27 also say "alert received". The Error Trigger runs only for automatic executions: "You can't test error workflows when running workflows manually" and "only runs when an automatic workflow errors" (docs.n8n.io Error Trigger page, read 2026-10-30). So for every manual-run case, the evidence is: execution status = Error, the Stop and Error message in the Executions list, and the log row. The Slack alert itself is proven only by T30 (a real scheduled failure, which only the owner can arrange because it needs the workflow on a schedule). Reword the T2, T3, T4, T9, T23, T25, T26, T27, T31 expectations to "execution ends in Error with this message" and keep "Slack alert arrives" for T30 only.
2. **Execute Workflow "Continue (using error output)" row is overstated.** With "Wait For Sub-Workflow Completion" off, the parent does not see the child's result, so a child that starts and then crashes will not reach W2's error output. That output only catches a failure to start the child. A child crash is reported by W3's own Error Workflow setting. Change the card text ("Child failure must not lose the claim") to: "start failure is caught in W2; a crash inside W3 is caught by W3's error workflow, and the claim row stays pending until swept." (Docs: Execute Sub-workflow page says only that the parent cannot trigger a sub-workflow with errors.)
3. **Claim write retries can create duplicate rows.** "Retry 3" on a Sheets Append Row means a call that succeeded but timed out is repeated. Result: two `pending` rows for one `log_key` (same for the `report_runs` claim). Use Append or Update keyed on `log_key` / `run_key` for claims, or accept and write down that the duplicate check treats any row as a block. Also note that the Retry On Fail doc page gives no count range (see items to verify).

**Small**

4. The "Verified facts" row for Retry On Fail / On Error cites our own app map, not docs. Replace with https://docs.n8n.io/workflows/components/nodes/ (read 2026-10-30): On Error options are Stop Workflow, Continue, Continue (using error output); Retry On Fail "reruns until it succeeds"; Always Output Data returns an empty item when a node returns nothing (the page warns against using it on IF nodes). The page gives no Max Tries / Wait numbers.
5. The Gmail approval request has "Retry 2". If a send succeeds but reports failure, the owner gets two approval emails for one invoice. Harmless in a showcase because step 10 re-checks the log row, but say so on the card.
6. Add: the error workflow does not count toward Cloud quota, and sub-workflow runs do not count (docs.n8n.io/workflows/executions/, 2026-10-30). This closes the card's and design 15's "UNVERIFIED" on counting: only the parent (top-level) execution counts, and only production runs. Design section 15 can drop item 13 in section 17 (still check it if on Cloud).

## Corrections: approval sub-workflow card

**Must fix**

1. **A late "Decline" can overwrite a `timed_out` row.** Design W3 step 8 writes `declined` without checking the row is still `pending`. If the sweep already set `timed_out` and the owner clicks Decline on day 3, the log would flip to `declined`. Make step 8 update only if status is still `pending` (same guard as step 10). Approve-late is already safe.
2. **Waiting W3 executions are never cleaned up if the Gmail node has no wait limit.** The sweep (layer 2) only fixes the log row. The paused execution stays in the database, and the late-click link still works. That is acceptable (layer 3 blocks the send) but the card must say so. Add to the card: "Without a node wait limit, unanswered W3 runs stay in Waiting until manually stopped or pruned by retention." Add a check to the QA evidence: count of Waiting executions after T17.

**Small**

3. The card's "Wait limit" row says the limit exists. Docs for the Gmail node (https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.gmail/message-operations/, read 2026-10-30) list only credential, To, Subject, Message, Type of Approval (Approve Only / Approve and Disapprove) and button labels and styles. No Limit Wait Time, no timeout output. The Wait node page documents Limit Wait Time (After Time Interval or At Specified Time) but says nothing about the status when the limit is hit. Keep it as "verify on import" and do not state it as fact.
4. Resume link: the Wait node page says each execution gets its own resume URL generated at runtime. The approve/decline links in the email therefore work for anyone who has the email. Fine for the owner-only showcase; note "do not forward the approval email".

## Three-layer timeout: assessment

Design is sound and fails safe (every path that is not an explicit approve on a pending, unpaid row ends in skip + log). Notes:
- Layer 1 (node limit): unverified, may not exist on Gmail. Design already handles that.
- Layer 2 (sweep at 48 + 2 hours): works only while W2 keeps running daily. If W2 is stopped, rows stay `pending` and block that invoice's tier. Note it.
- Layer 3 (post-click guard): the key safety layer. Keep it exactly as designed.
- **Workflow-level Timeout on W3: leave unset.** The Workflow Settings page (https://docs.n8n.io/workflows/settings/) says Timeout Workflow cancels "the current workflow execution" after a set time and does not say if it applies to waiting executions. Cloud enforces plan maximums. Setting any short value on W3 risks cancelling approvals. Recommend: unset, and record why. (Self-hosted instance-wide timeout variables may also exist; from memory, not checked in docs: check with the admin.)
- Design 13's W3 row says "must exceed approval_wait_hours or stay unset". Prefer "stay unset" as the default.

## Evidence plan for QA (what proves each thing)

| Claim | Evidence | Can a manual run prove it? |
|---|---|---|
| Report totals correct | Execution Success + report rows + hand calculation | Yes |
| Mismatch blocks report | Execution Error with "Report blocked..." message; run row `blocked_mismatch`; no rows in `weekly_report`; no email or Slack | Yes (not the alert) |
| Slack alert arrives | Alert text in Slack | **No.** Only T30 on a scheduled run |
| Approval waits | W3 execution status Waiting in Executions, linked from W2 ("View sub-execution") | Verify on import: whether a manual W2 run produces a W3 that pauses and resumes |
| Approve sends exactly one email | Child execution Success; one mail in test inbox; log `sent` | Yes, with the above caveat |
| Timeout | Set `approval_wait_hours` small for the test (for example a few minutes) so T17 does not take 2 days; evidence is log row + late click sends nothing | Yes |
| No unapproved send | T32: inspect JSON connections; run-history shows no Send node executed on declined/timed-out runs | Yes |
| Insights/time saved | Nothing. Insights counts production runs only; leave "Estimated time saved" blank | No |

Also: "Save failed production executions" must be On, or the Error Trigger has no `execution.id` / `url` (Error Trigger page). Cards already say On.

## Items to verify on import

1. Gmail send-and-wait: does it offer Limit Wait Time? What does it output on approve, decline and timeout (is `approved` false or missing on timeout)? Can decline and timeout be told apart?
2. Can the wait limit read `approval_wait_hours` from Settings (expression allowed) so tests can shorten it?
3. Retry On Fail: allowed Max Tries and Wait Between Tries ranges, and whether "Max Tries" counts the first attempt (docs reached give no numbers; "3 tries" in the cards is a proposal).
4. Does Timeout Workflow cancel a Waiting execution? Test only on Sandbox with a tiny value.
5. Does a manual (editor) run of W2 start W3 children that pause and resume correctly, and how are the child executions saved (successful-production-saves setting vs manual)?
6. "Each item" mode with Wait off: do all children start? Does a start failure reach the error output?
7. Does W3's own Error Workflow setting fire when W3 fails while called as a sub-workflow? (The Error Trigger page is silent on sub-workflow executions.)
8. Caller policy option wording to restrict W3 to W2 (the settings page names the setting but lists no options).
9. Sheets Append or Update: matching column behaviour, so claims can be made idempotent.
10. Instance URL / webhook URL is reachable from the owner's browser (approval buttons depend on it).
11. Retention setting on the instance (executions hold invoice figures and names).

## Sources (all read 2026-10-30, page versions current, instance version unknown)
- https://docs.n8n.io/flow-logic/error-handling/ (error workflow starts with Error Trigger; Stop and Error forces a failure; page says nothing on Retry/On Error)
- https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.errortrigger/ (automatic executions only; cannot test manually)
- https://docs.n8n.io/workflows/settings/ (Timeout Workflow, Error Workflow, Caller policy, save settings)
- https://docs.n8n.io/workflows/components/nodes/ (Retry On Fail, On Error options, Always Output Data)
- https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.wait/ (offload to database, 65-second threshold, Limit Wait Time, per-execution resume URL)
- https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.executeworkflow/ (Wait For Sub-Workflow Completion, modes, View sub-execution)
- https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.gmail/message-operations/ (Send and Wait for Approval options)
- https://docs.n8n.io/workflows/executions/ (only top-level production executions count toward quota; error workflow runs do not)
