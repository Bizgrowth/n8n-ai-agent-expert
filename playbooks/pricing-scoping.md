# Scoping & Pricing Guide (for freelance gigs)

Use during intake to size a gig and draft a quote. These are starting heuristics for the owner to adjust; they are not market data.

## Complexity tiers
| Tier | Typical shape | Build effort guide |
|---|---|---|
| Simple | 1 trigger, 2–4 nodes, 1–2 apps, no AI | few hours |
| Standard | 5–12 nodes, switch/filter, 2–4 apps, error handling + alerts | 1–2 days |
| Advanced | AI step with guardrails, multiple workflows, data table, review queue | 2–5 days |
| Complex | Multi-system sync, high volume, custom API calls, approvals | 1+ week |

## Add-ons (price separately)
Loom walkthrough, extended testing, monitoring retainer, extra integrations, revisions beyond the agreed rounds, training session, **hosting on your own n8n instance** (retainer, backups, updates).

## Delivery and hosting (decide in intake)
- **A. Client's own n8n.** You build, test and hand over importable workflows. The client pays their own n8n costs. Default.
- **B. Hosted by you.** Only on an HTTPS instance with per-client separation (see `docs/connect-n8n.md`). Quote a monthly hosting fee, state backup/uptime expectations in plain words, and state who owns the data.

## Cost check
Self-hosted n8n has no per-run fee; real costs are server, backups, your time and LLM tokens. n8n Cloud is billed by executions: check the client's current plan on their account, never quote from memory. Always state executions per month and estimated LLM cost per run in the quote (see `docs/make-to-n8n.md`).

## Quote must state
Scope in/out, number of revision rounds, what the client provides (access, sample data, approvals), timeline, test-evidence deliverable, support window, delivery model (A or B), and that the automation is delivered inactive until sign-off.
