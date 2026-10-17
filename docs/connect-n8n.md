# Connecting this agent to n8n

Plain-language setup. Nothing here is required to start: the agent works repo-first (it writes workflow files you import). Connecting n8n only adds the option of pushing an **inactive** draft straight into your instance.

## Step 0 — Secure the VPS (do this before any client work)
Your n8n currently runs on plain HTTP at a raw IP address (the browser shows "Not secure"). Anything typed in, including logins, credentials and webhook data, travels unencrypted.

Business risk: a client's data or a connected account could be exposed. It is also a bad look if a client checks your setup.

What to do (ask your VPS provider or a developer, about an hour of work):
1. Point a domain or subdomain (e.g. `automations.yourdomain.com`) at the VPS.
2. Put a reverse proxy with a free HTTPS certificate in front of n8n (Caddy and Nginx with Let's Encrypt are common choices).
3. Tell n8n its public address by setting its `WEBHOOK_URL` setting to the new `https://` address, then restart n8n.
4. Close direct public access to port 5678 so only HTTPS gets through.
5. Back up the n8n encryption key and the database. Losing the key means saved credentials cannot be decrypted.

Until this is done: Sandbox/Showcase only, synthetic data only.

## Step 1 — Know your edition
Ask in n8n: Settings and the sidebar. The screenshot shows **Overview** and **Personal** only. Features such as multiple projects, folders and user roles depend on your plan/edition. Record the answer in `clients/README.md` so the agent knows whether it can give each client their own project.

## Step 2 — Keep clients apart
Business advice: one self-hosted instance holds every client's credentials and execution history in one place. Pick one of these and record it per client in the brief:
- **A. Client's own n8n** (their cloud or server). You build and hand over. Safest, simplest liability. Recommended default.
- **B. Hosted on your instance** (a hosting retainer). Needs HTTPS, backups, a project per client, and a clear data-processing note in the quote.

## Step 3 (optional) — Let the agent push inactive drafts
1. In n8n, the owner creates an API key (Settings, n8n API) or enables the instance-level MCP access, whichever your version offers. Give it the minimum access.
2. Add the connection to Claude Code yourself. Never paste the key into chat or this repo.
3. In `.claude/agents/builder.md`, add the connected create/read tool names to the `tools:` line. **Do not add any activate, publish, or run-in-production tool.** (Tool names depend on the server you connect, so they are left blank here on purpose.)

## What stays human
- Creating credentials inside n8n and authorizing apps.
- Activating a workflow.
- Anything sent to a real customer.


## Decided 2026-10-17: connect over HTTP with MCP
The owner chose to connect the agent to their own n8n over plain HTTP using Instance-level MCP, and authorized work on any workflow they enable. The connection file is `.mcp.json` in the repo root. It holds no address and no token: both come from environment variables.

Owner steps:
1. n8n, Settings, Instance-level MCP: enable it, choose the access token method, copy the server URL (the docs say it ends in `/mcp-server/http`; copy exactly what n8n shows) and the token. Enable "Available in MCP" for the workflows the agent may touch.
2. Cloud environment menu in the session title bar, Edit: add `N8N_MCP_URL` (the URL) and `N8N_MCP_TOKEN` (the token) as environment secrets, and add the n8n server address to the allowed network hosts. Never paste the token in chat. Do not name the token variable like a Claude credential (for example `ANTHROPIC_AUTH_TOKEN`): the docs say such variables are read as empty in remote server settings.
3. Start a new session and approve the project server called `n8n` when asked (project servers show as pending until approved).
4. Ask the agent to list the n8n tools it can see. It then proposes a tool deny list for the owner to set and runs the read-only audit.

Token hygiene: regenerate the token after a working session; n8n revokes the previous one.
