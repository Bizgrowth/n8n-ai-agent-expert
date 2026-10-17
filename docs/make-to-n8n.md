# Make → n8n translation guide

Why this exists: the process is identical, the vocabulary and the cost model are not.

| Make | n8n | What changes for the business |
|---|---|---|
| Scenario | Workflow | Same idea |
| Team / folder | Project / folder / tags (edition-dependent) | Confirm client separation per `docs/connect-n8n.md` |
| Module | Node | Node versions vary by n8n version; verify before use |
| Connection | Credential | Created in n8n by the owner; never in the repo |
| Bundle / operation | Item / execution | Cost is not per operation (see below) |
| Instant webhook trigger | Webhook node (Production URL) | Test URL only works while the editor is listening |
| Router | Switch or IF node | Always keep a fallback output |
| Iterator / Aggregator | Loop Over Items / Split Out / Aggregate | Items flow in lists automatically; loops are often unnecessary |
| Data store | Data table, database, Google Sheet/Airtable | Pick per client; do not rely on workflow static data for important state |
| Data structure | Typed Edit Fields (Set) node, JSON schema in parser | Validate at the start |
| Error handler routes (Resume/Ignore/Break/Rollback/Commit) | Node setting "On Error" + "Retry On Fail" + Error Trigger workflow | See best practices |
| Incomplete executions | Failed-execution saving + manual retry from the executions list | Turn on saving of failed executions |
| Failure alert | Error workflow (Error Trigger → Slack/email) | One shared alert workflow per instance |
| Sub-scenario | Sub-workflow (Execute Workflow node) | Same |
| Make AI Agent | AI Agent node with tools and memory | Cap steps and scope tools |
| `scenarios_activate` (never used) | Active toggle / activate via API (never used) | Same prime directive |
| Operations estimate | Executions + LLM cost + server load | See below |

## Cost model: the biggest difference
- **Make:** each module run costs an operation. Estimate = ops per run × runs per month vs the plan.
- **n8n Cloud:** billed by workflow executions (one whole run counts once, regardless of node count). Check the client's current plan limits; do not quote from memory.
- **n8n self-hosted:** no per-run fee. Real costs are the server, backups, your maintenance time and LLM tokens.
- Either way the design must state: runs per month, estimated LLM cost per run, and server/plan impact.
