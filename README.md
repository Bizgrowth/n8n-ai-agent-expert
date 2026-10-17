# n8n AI Agent Expert

A personal Claude Code agent that designs, builds, reviews, tests and documents n8n workflows to a consistent best-practice standard. Human in the loop at every gate; never client-facing; never activates a workflow.

It is the n8n twin of `make-ai-agent-expert`: same 7-stage process and approval gates, rewritten for n8n's nodes, error handling and AI features.

## Two different helpers
| | n8n built-in Assistant | This agent |
|---|---|---|
| Lives | Inside the n8n editor (Preview) | Claude Code, this repo |
| Good for | Quick help and starter workflows while you are in n8n | Repeatable client builds to your standard |
| Enforces your gates and standards | No | Yes |

They complement each other. Use the built-in Assistant for quick questions; use this agent for anything you will sell or hand to a client.

## How to use
1. Open this repo in Claude Code.
2. Say: "New gig" and paste the client request. The agent asks which client and which n8n instance/project, then runs intake.
3. Approve at each gate (see `checklists/approval-gates.md`). Final sign-off and client delivery are yours.
4. Workflows arrive as importable JSON in `clients/<client>/workflows/`. Import, connect credentials in n8n, test, then activate yourself.

## First-time setup
Read `docs/connect-n8n.md`. The main point: put your n8n VPS behind HTTPS on a domain before any client work touches it.

## Layout
- `CLAUDE.md` — orchestrator rules and workflow
- `.claude/agents/` — 7 specialist sub-agents (intake-brief, architect, builder, best-practice-reviewer, qa-tester, handoff-writer, template-showcase)
- `playbooks/` — n8n best practices, AI guardrails, pricing/scoping, pattern libraries
- `templates/` — brief, process doc, test report, Loom script
- `checklists/` — approval gates
- `clients/` — per-client working files
- `showcase/` — reusable templates for Upwork, social media and the website
- `scripts/lint-workflow.mjs` — automatic standards check on an exported workflow (needs Node, no installs)
- `scripts/build-explorer.mjs` — builds a read-only map page (flow, steps, connections, fields, setup checklist) from a client's workflow files: `node scripts/build-explorer.mjs clients/<client> out.html`
- `docs/` — n8n connection setup, Make-to-n8n translation guide, agent-integration practices (Oct 2026)

## Notion
Mirror the Clients tracker, Gigs & Briefs and Template Library to Notion when you ask.
