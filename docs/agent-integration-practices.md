# Agent-built integrations: practices as of October 2026

Researched 2026-10-17 with web search. Most sources are practitioner blogs and vendor posts, not official n8n documentation, so treat them as advice and confirm anything that matters on your own instance and version. Where sources disagreed or I found nothing, it says so.

## What the sources agree on, and where this repo stands

| Practice | What sources say | This repo today |
|---|---|---|
| Least privilege | Give each agent, MCP server and credential only the tools and scopes its task needs. n8n's built-in MCP server needs instance-level enabling, then each workflow is enabled one by one; every connected client sees every enabled workflow. | Met. Builder is repo-first with no n8n access. Direct push stays optional and off (docs/connect-n8n.md). When enabled, enable only showcase workflows. |
| Human approval on high-impact actions | Customer-facing or irreversible actions pause for a person. | Met by design. Low confidence, bad AI output and the daily cap go to a Slack review message. Nothing auto-sends to customers. |
| Prompt injection | Treat inbound text as untrusted; validate inputs and outputs; model output must not choose actions. | Met by design (delimited text, fixed answer schema, 7 checks, channels from Settings, cleaned Slack text). Test cases 4 and 5 will show whether it holds. |
| Limits on agent runs | Cap iterations, timeouts and retries; watch for loops and cost. One source cites a default of 10 max iterations on the AI Agent node (unverified). | Met differently: a fixed AI chain, not an agent. At most 3 AI calls per lead, 3-minute timeout, daily cap, spend limit at the provider. |
| Observability | Keep execution logs, review them on a schedule, trace cost and latency (Langfuse and Helicone are named). | Partial. Log table and saved executions exist. No tracing tool. Consider one only if volume grows. |
| Workflows as code | Keep workflows in Git as the source of truth. n8n's own source control is Enterprise-only, is not full version control, has no pull-request review, and does not sync credentials or variable values. | Met without Enterprise: the repo holds the JSON. Gap: edits made in the n8n editor do not flow back. |
| Modularity | Split big workflows; keep a shared error handler. | Met. Shared error-alert workflow. The qualifier is large (44 steps); consider splitting the scorer into a sub-workflow if it is reused. |
| Secrets | Keep keys out of workflow JSON and out of the model's context; external secret managers for larger setups. | Met for this size: credentials by name only, lint blocks pasted secrets. A secret manager is not needed for a showcase. |
| Kill switch and cost control | A per-workflow off switch and spend limits. | Met: workflows ship inactive; provider spend limit is on the setup checklist. |
| Vet third-party MCP servers | Review and approve servers before connecting; run in sandboxes; log agent actions. | N/A until a server is connected. Treat community n8n MCP packages as untrusted until reviewed. |

## Practical rules to adopt

1. **Repo is the source of truth.** After any change made in the n8n editor, export the workflow, re-run `scripts/lint-workflow.mjs`, and commit it. Never leave a live workflow that differs from the repo.
2. **Test mode is not production.** The Test URL catches one request and stops. Production URLs only work on an active workflow. The test script already accounts for this.
3. **Builder never tests its own work.** Keep the separate reviewer and tester. This matches every source's advice on independent checks.
4. **Version prompts apart from logic.** Keep `prompt_version` and `rubric_version` in the Settings step and in every log row.
5. **Check your n8n version before trusting any guide.** Sources conflict on when the MCP build-and-edit features arrived (one says 2.13 onward, another gives different numbers). Check the version on your instance.
6. **Read the OWASP MCP Top 10 before connecting any MCP server.** It is the most authoritative reference that came up.

## Not found
No source covered Claude Code specifically connecting to n8n's MCP server; n8n's docs describe other clients. Verify the Claude Code connection steps yourself before relying on it.

## Sources
- [HatchWorks: n8n best practices](https://hatchworks.com/blog/ai-agents/n8n-best-practices/)
- [Automation Atlas: building AI agents with n8n in 2026](https://automationatlas.io/guides/building-ai-agents-with-n8n-2026/)
- [DEV: scalable n8n workflows in 2026](https://dev.to/bitpixelcoders/building-smarter-automation-with-n8n-best-practices-for-scalable-workflows-in-2026-277k)
- [n8n docs: connect to the n8n MCP server](https://docs.n8n.io/connect/connect-to-n8n-mcp-server)
- [n8n docs: source control and environments](https://docs.n8n.io/source-control-environments)
- [n8n docs: use Git in n8n](https://docs.n8n.io/administer/use-source-control-and-environments/use-git-in-n8n)
- [Pomerium: MCP server security risks in 2026](https://www.pomerium.com/blog/mcp-server-security-risks-what-development-teams-need-to-know-in-2026)
- [Cloud Security Alliance research note on agentic AI, sandboxing and least privilege (May 2026, AI-assisted draft, not formally reviewed)](https://labs.cloudsecurityalliance.org/wp-content/uploads/2026/05/CSA_research_note_agentic_ai_sandbox_least_privilege_mcp_20260530-csa-styled.pdf)
