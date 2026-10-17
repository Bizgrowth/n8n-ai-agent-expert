# Owner Approval Gates

The agent stops at each gate and waits for an explicit "approved" from the owner.

## Gate 1 — Brief (and 1b — Design)
- [ ] Goal, trigger, apps and data are correct
- [ ] Open client questions answered or accepted as risks
- [ ] Volume, executions estimate and LLM cost per run are acceptable
- [ ] AI risk level and human-review rule agreed
- [ ] Delivery model chosen (client's own n8n, or hosted by you) and the instance is on HTTPS if it touches client work
- [ ] Price/scope matches the quote
- [ ] Design reviewed: node list, error handling, cost estimate, test cases

## Gate 2 — Build + test evidence
- [ ] Workflow is in the correct client project/instance and **inactive**
- [ ] `lint-workflow` output has no failed "must" items
- [ ] Best-practice review has no open "must" items
- [ ] Test report: all cases pass, executions and LLM cost within estimate
- [ ] Alerts go to the right people; failure path verified (error workflow fires)
- [ ] No secrets, pinned test data or real customer data in the workflow file, notes or logs

## Gate 3 — Final sign-off (owner → client)
- [ ] Process doc reads clearly for a non-technical client
- [ ] Loom script ready (only if ticked)
- [ ] Client has connected their own accounts (credentials created in n8n) and approved go-live
- [ ] Owner activates the workflow and watches the first live execution
- [ ] Support window and monitoring offer communicated
