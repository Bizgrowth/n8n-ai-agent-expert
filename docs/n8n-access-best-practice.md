# Giving the agent access to n8n: best practice, October 2026

Researched 2026-10-17 from n8n's documentation and community sources. n8n docs differ between versions, so every item below has to be re-checked against the owner's n8n version, which is still unknown. Nothing here has been tested on the owner's instance.

## Three different keys (the usual confusion)
| Key | What it lets happen | Who creates it | Where it lives |
|---|---|---|---|
| **AI provider key** (Anthropic) | n8n calls Claude. Used by the Chat model steps in our workflows, and by n8n's own AI features such as Chat hub providers (Settings, Chat) | Owner, at the provider | An n8n credential |
| **n8n API key** (Settings, n8n API) | An outside tool calls n8n's REST API | Owner, in n8n | The agent's environment secrets |
| **MCP access** (Settings, Instance-level MCP) | An outside AI client reads, runs and builds workflows through MCP | Owner, in n8n | OAuth sign-in, or a token held as a secret |

How the built-in Assistant authenticates was not verified. It is a separate feature from the outside access above.

## What the sources say
- **MCP is the purpose-built route.** Settings, Instance-level MCP. OAuth is the recommended sign-in; a bearer access token is the alternative. The token is tied to the user account that created it, and generating a new one revokes the old one. Server URL ends in `/mcp-server/http`. Docs give a `claude mcp add --transport http` example for Claude Code.
- **Least privilege is built in.** MCP is enabled for the instance, then each workflow is switched on individually ("Available in MCP"). `search_workflows` can still preview every workflow the user may view. New-workflow auto-expose exists and is off by default.
- **Build and edit** through MCP arrived in n8n 2.13.0; partial `update_workflow` edits in 2.20.0; the per-client connect dialog needs 2.33.0 or later. Version history tools (`get_workflow_history`, `get_workflow_version`, `get_workflow_versions_diff`, `restore_workflow_version`) give a built-in undo.
- **Execution evidence.** The execution lookup returns metadata by default and run data only when asked. Its name differs by version (`get_execution` or `get_workflow_execution`). `execute_workflow` has a production mode (published version) and a manual mode (current draft).
- **The API key route is weaker unless you are on Enterprise.** Scoped API keys (for example `workflow:read`, `workflow:create`, `workflow:activate`) are Enterprise-only. On other plans a key has full access, including activating workflows.
- **Roles.** Custom project roles are documented. No documentation was found for a dedicated "service account".
- **Audit trail.** The n8n execution log shows what ran, not why an agent acted or who approved it. Tamper-evident agent audit logs are bring-your-own (community and vendor sources, informal). Log streaming and OpenTelemetry exist but are paid or self-hosted features.
- **Reachability (unverified).** A cloud session reaches your n8n only if the network allows that host, and OAuth-based connectors normally need a public HTTPS address. No source confirmed whether Claude's custom connectors accept plain HTTP or a raw IP. Treat HTTPS as likely required for the MCP and OAuth route.
- **Not found:** an MCP tool for publishing or activating. Docs searches did not mention one, but that is not proof it does not exist. List the tools before trusting that.

## Recommended setup (my recommendation, partly beyond the sources)
1. **Use MCP, not a raw API key**, unless the owner is on Enterprise with scoped keys.
2. **Sandbox only.** Connect the agent to the showcase instance and project. Client production instances never get an agent connection; clients receive importable files (delivery model A).
3. **A separate n8n user for the agent**, limited to the showcase project, if the edition allows extra users and project roles. Otherwise the token carries the owner's full permissions, which is the main risk of connecting.
4. **Enable only the showcase workflows for MCP.** Leave auto-expose off.
5. **Stage the access.**
   - Stage 0: repo only. This is where we are.
   - Stage 1: read-only (list workflows, read details and execution results, version history).
   - Stage 2: create and update inactive drafts, and run workflows in manual mode only, with synthetic data and sandbox accounts.
   - Never: publish or activate, delete, restore over a live version, production-mode runs, credential values.
6. **Allow-list the tools by name after connecting.** Look at the tool list the server actually exposes, add only read, create and update tools to the builder, read tools to the tester and ops specialist, and leave out anything that publishes, deletes or runs in production.
7. **Keep our own audit trail.** For every n8n change the builder writes to `build-log.md`: tool, workflow ID, version ID before and after, and why. The version history is the undo.
8. **Token hygiene.** Store the token or OAuth grant as a secret outside chat and the repo. Regenerate it after any exposure and when a project ends.
9. **Check the n8n version first.** Build and edit needs 2.13.0 or later; the tool names change by version.

## What the owner does, in order
1. Read the n8n version (Help menu or Settings, Usage and plan) and tell the agent the number and edition.
2. Decide whether to connect now (needs a public HTTPS address) or stay at stage 0.
3. In n8n: Settings, Instance-level MCP, enable it; enable only the showcase workflows.
4. Add the connection to Claude yourself (claude.ai connector settings for OAuth, or the environment settings for a token) and add your n8n address to the environment's allowed network hosts.
5. Start a new session and ask the agent to list the n8n tools it can see. Do not skip that check.

## Owner's instance facts (reported 2026-10-17; no IP, SSH or key details stored here)
- Self-hosted n8n **Community edition with a license key activated**, running in Docker on a cloud VM, alongside Open WebUI. Version still unknown.
- n8n's AI Assistant is enabled and uses Claude. An Anthropic credential already exists in n8n (the owner's note says it is stored for the Assistant and AI nodes). A Daytona code-sandbox key is also stored; what that feature does was not verified and nothing here relies on it.
- The instance is served over plain HTTP. n8n's docs allow `http://` for a plain-HTTP instance; that settles whether n8n works, not whether it is safe to send an access token over the internet.

### What that changes
1. **No scoped keys expected.** Scoped API keys are Enterprise-only in the docs, so assume an API key or MCP token carries owner-level power. n8n will not enforce "read-only". The read-only stage must be enforced on the Claude side with a deny list of MCP tools, set by the owner after the tool list is known.
2. **Use the URL n8n shows, not a guessed one.** The docs say the server URL ends in `/mcp-server/http`. An example ending only in `/mcp` is unlikely to work. Copy the URL from Settings, Instance-level MCP, Connect.
3. **Plain HTTP means the token travels unencrypted.** Anyone on the path could capture it and gain owner-level access: build workflows that use stored credentials (including the Anthropic key), or read workflow data. Whether Claude's connectors accept `http://` addresses is unverified. The owner has chosen to defer HTTPS, so the mitigations if connecting anyway are: showcase workflows only enabled for MCP, no client data or client credentials on this instance, a token that is regenerated after each working session (n8n revokes the old one), the tool deny list, and revoking access when not in use.
4. **SSH is not an agent access method.** SSH to the VM controls Docker, every service on it and all stored data. It is never given to the agent, the key file is never shared, and nothing in this repo may ask for it.
5. **Credentials.** The agent never reads credential values. Workflows reference an existing credential by selecting it; the builder names it in the build log. The Chat model steps of SHOW-001 must select the existing Anthropic credential (the name `LLM - Showcase` is only a suggestion).

## Sources
- [n8n docs: connect to the n8n MCP server](https://docs.n8n.io/connect/connect-to-n8n-mcp-server)
- [n8n docs: MCP server tools reference](https://docs.n8n.io/connect/connect-to-n8n-mcp-server/mcp-server-tools-reference)
- [n8n docs: MCP client connection examples](https://docs.n8n.io/connect/connect-to-n8n-mcp-server/mcp-client-examples)
- [n8n docs: API authentication and key scopes](https://docs.n8n.io/connect/n8n-api/authentication)
- [n8n docs: custom project roles](https://docs.n8n.io/user-management/rbac/custom-roles/)
- [Claude Code docs: MCP servers](https://code.claude.com/docs/en/mcp-servers)
- [n8n community: human approval steps for AI agents](https://community.n8n.io/t/n8n-users-running-ai-agents-where-do-you-still-keep-a-human-approval-step/303282) (informal)
