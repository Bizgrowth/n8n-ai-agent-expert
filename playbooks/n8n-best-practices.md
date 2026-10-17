# n8n Best Practices (build standard)

Every workflow is reviewed against this list. Items marked **[must]** block approval. Items tagged `(lint)` are checked automatically by `scripts/lint-workflow.mjs`.

## Organization
- **[must] (lint)** Name: `<CLIENT> | <Process> | <Trigger> → <Outcome> | vN`. One folder/project per client where the edition allows; tags: client slug, gig ID, status (`draft`, `qa`, `live`).
- Name every node in plain English (e.g. "Find contact by email"), not the default ("HTTP Request1"). (lint)
- Add a sticky note on the canvas: purpose, owner, trigger, last change. (lint)
- One responsibility per workflow. Split reusable logic into a sub-workflow (Execute Workflow node).

## Triggers
- Prefer **webhook / app triggers** over polling when the app supports them (lower latency, fewer wasted runs).
- Polling: lowest frequency that meets the business need; limit results per run.
- Webhooks: use the Production URL in live use (the Test URL only works while the editor is listening). Add authentication (header or basic auth credential). (lint, warn)
- **[must]** Dedupe: choose a unique key (email, order ID) and check it before creating records (Remove Duplicates node for a batch; a lookup in the destination or a data table for repeats across runs).

## Flow control
- Filter early (Filter or IF node right after the trigger) so irrelevant items stop immediately.
- Every Switch/IF has a labelled fallback output. Label every branch.
- Aggregate before writing when many items go to one place (one email/summary, batch API call).
- n8n runs a node once per item by default; use Loop Over Items only for rate limits or batching, not as a habit.
- Use the Code node only where nodes cannot do it; comment it. (lint, warn)

## Error handling
- **[must] (lint)** Every node that calls an external service (HTTP Request, app nodes with credentials, AI nodes) sets **Retry On Fail** or an **On Error** choice deliberately:
  - *Retry On Fail* (e.g. 3 tries, increasing wait) for rate limits and temporary outages.
  - *On Error → Continue (using error output)* for steps where you want a fallback or review route.
  - *On Error → Stop Workflow* (the default) only when failing loudly is the right result.
- **[must] (lint)** Failure alert: set the workflow's **Error Workflow** to a shared handler (Error Trigger → Slack/email to the owner with workflow name, failing node, execution link). Never silent failures.
- For money or customer data, save failed executions and test the manual retry path.
- Use Stop And Error to fail on purpose when validation fails and no review route exists.

## Data
- Validate required fields right after the trigger; normalize early (trim, lowercase emails, standard dates and time zone).
- Set the workflow time zone explicitly. (lint, warn)
- Never hard-code IDs or secrets that vary by environment; use credentials, and variables or a config node at the top.
- Treat missing fields as an expected case, not an exception.

## Security
- **[must] (lint)** No secrets in node parameters, sticky notes or logs; use n8n credentials only. Workflow JSON must contain credential references, never values.
- **[must] (lint)** No `pinData` and no real customer data in saved workflow files. Exports include pinned test data; strip it.
- Least-privilege scopes on every credential.
- Never echo sensitive payloads into alert messages.
- Minimize personal data stored; set execution data retention (pruning) on the instance.
- **[must]** Client work only on an HTTPS instance (`docs/connect-n8n.md`).

## Efficiency & cost
- Estimate executions per month, LLM cost per run, and server/plan impact; record them in the design and the process doc (see `docs/make-to-n8n.md`).
- Avoid lookups inside loops; fetch once, then match in memory (Merge or Aggregate).
- Schedule heavy jobs off-peak. Set a workflow timeout. (lint, warn)

## Maintainability
- Another person must understand it in 10 minutes: logical left-to-right flow, grouped nodes, notes at tricky logic.
- Version bump the name on material changes; keep a change log in `clients/<client>/build-log.md`.
- Keep a documented rollback: how to deactivate and how to re-run failed executions.
- Record the n8n version the workflow was built and tested on.
