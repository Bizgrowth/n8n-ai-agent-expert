# n8n app map: every area the agent must know

Built from the owner's screenshots (2026-10-17) and n8n's own docs (docs.n8n.io, searched 2026-10-17).
Tags: **[docs]** = described in n8n documentation. **[screenshot]** = visible in the owner's n8n but its function was not verified here. Never treat a **[screenshot]** row as knowledge; the specialist must look it up before relying on it.
Plan and version matter: several areas are paid-tier or depend on the n8n version. The owner's version is still unknown.

**Access key:** API = n8n public REST API (`/api/v1`, header `X-N8N-API-KEY`). MCP = instance-level MCP server. UI = owner only, in the browser. None = no access path found.
**Standing rules in every area:** never activate or publish, never read or write credential values, never touch real customer data, and say UNVERIFIED when unsure. "Publish" in the new n8n wording means "activate" in our rules.

## 1. Left sidebar

| Area | What it is | Agent may | Agent never | Access | Specialist |
|---|---|---|---|---|---|
| Logo, **+**, search, sidebar toggle | Create menu, search, collapse panel **[screenshot]** | Describe only after lookup | n/a | UI | ops |
| **Assistant (Preview)** | n8n's built-in AI helper in the editor **[screenshot]**. Not this agent. | Tell the owner when it is the right quick tool | Rely on its output as verified | None | ai |
| **Overview** | Main workspace listing workflows, credentials and executions, with the Insights summary banner at the top **[docs]** | Read lists via API when connected | Change anything from here | API (read) | ops |
| **Personal** | The owner's personal project: workflows, agents, credentials, executions, variables, data tables **[screenshot]**. Other projects and roles depend on edition **[docs]** | Read; recommend per-client separation | Move or share items | API (projects) | admin |
| **Chats**, New conversation | Chat hub conversations **[screenshot]**. Admin controls live in Settings, Chat. Plan-limited per docs **[docs]** | Explain | Enable it without the owner | None | ai |
| **Templates** | Template library; start a workflow from a template; self-hosted can point to its own library **[docs]** | Suggest a template as a starting point, then rebuild to our standard | Import unreviewed templates into client work | UI | triggers |
| **Insights** | Performance over time: summary banner, dashboard, time saved. Production runs only (no test or sub-workflow runs). Plan availability differs between doc pages **[docs]** | Use as the source for time-saved claims once real runs exist | Quote figures without data | UI | ops |
| **Help** | **[screenshot]** | none | | UI | ops |
| **Settings** | Opens the menu in section 3 | | | UI | admin |

## 2. Inside the Personal project (tabs)

| Tab | What it is | Agent may | Agent never | Access | Specialist |
|---|---|---|---|---|---|
| **Workflows** | The workflow list. Create via the orange button (empty or from a template) **[docs]** | List and read; propose inactive drafts | Activate, delete | API, MCP | triggers |
| **Agents (Preview)** | n8n Agents: build, test and publish. Settings: model, instructions, tools, skills, knowledge, memory, sub-agents. Drafts autosave; publishing snapshots a version; channels and schedules run only the published version **[docs]** | Advise on instructions and skills | Publish | None found | ai |
| **Credentials** | Stored logins for apps and AI providers **[screenshot]**. The public API has credential endpoints, with per-key scopes on Enterprise **[docs]** | Name the credentials a workflow needs | Read, create or change values | UI (owner) | connections |
| **Executions** | Run history **[screenshot]**. Execution lookup exists in the API and MCP **[docs]** | Read status and errors for evidence | Re-run production executions | API, MCP | ops |
| **Variables** | Instance variables **[screenshot]**. API resource exists **[docs]** | List key names | Read values aloud or store secrets in them | API | data |
| **Data tables** | Built-in tables. API covers tables, columns and rows **[docs]**; one source gives a 200 MiB default limit and an 80% warning | Design columns; read rows of test tables | Write to real client tables | API | data |

## 3. Settings menu

| Item | What it is | Agent may | Agent never | Access | Specialist |
|---|---|---|---|---|---|
| Usage and plan | Plan and limits **[screenshot]** | Ask owner for the plan before costing | | UI | admin |
| Personal | Profile **[screenshot]** | | | UI | admin |
| Users | User list. The API user endpoints are instance-owner only **[docs]** | Recommend least privilege | Invite or remove | API (owner key) | admin |
| Roles (New) | Instance and project roles are referenced by SSO provisioning **[docs]**; custom role detail not verified | Explain after lookup | Change roles | UI | admin |
| n8n API | Create API keys. Key goes in `X-N8N-API-KEY`. Per-key scopes such as `workflow:activate` exist on Enterprise **[docs]** | Say which scopes to give | See or store the key in chat | UI (owner) | admin |
| External secrets | Vault integrations: 1Password, AWS, Azure, GCP, HashiCorp Vault, Infisical. Paid tier **[docs]** | Advise for client work | Configure | UI | admin |
| Environments | Git-based source control, Enterprise-only; credentials and variable values are not synced **[docs]** | Recommend the repo-as-truth habit instead | Push or pull | API (2.39+) | admin |
| SSO / LDAP | Self-hosted SSO is Business/Enterprise; LDAP endpoints from 2.34 **[docs]** | Explain | Change | UI | admin |
| Security & policies | Policy examples: enforce MFA, disable personal-space publishing and sharing **[docs]**; the rest is unverified | Advise | Change | UI | admin |
| Log streaming | Send logs to external systems; env-managed from 2.19.0; paid tier **[docs]** | Advise | Configure | UI | ops |
| Community nodes | Third-party nodes. With env management on, the list is reconciled at startup and others are uninstalled **[docs]** | Warn: vet before use | Install | UI | admin |
| Migration report | **[screenshot]** function not verified | Look up first | | UI | admin |
| Instance-level MCP | Lets MCP clients run and (from 2.13.0) build or edit workflows. Needs instance enabling plus per-workflow enabling; `search_workflows` previews every viewable workflow. Doc pages differ by version (2.35, 2.36 changes) **[docs]** | Use only if the owner enables it, read tools first | Enable it | UI (owner) | admin |
| Context (Preview) | **[screenshot]** no documentation found | Look up first | | UI | ai |
| Chat | Enable Chat, providers and models per provider, default credentials **[docs]**. Currently off in the owner's instance **[screenshot]** | Explain | Enable it | UI | ai |
| Assistant (Preview) | **[screenshot]** | | | UI | ai |
| Agents (Preview) | Agents settings **[screenshot]** | | | UI | ai |
| OpenTelemetry | Workflow and node run tracing; self-hosted; configurable in Settings; marked under development **[docs]** | Advise | Configure | UI | ops |

## 4. Inside the workflow editor **[screenshot]**
| Area | Notes | Specialist |
|---|---|---|
| Editor / Executions / Evaluations tabs | Evaluations: light (hand-picked cases) and metric-based (quality in production); the Evaluation node writes results and metrics **[docs]**. Use it for the 10-case AI test set. | ops |
| Publish button and menu | Treat as activation. Owner only. | admin |
| Logs panel (bottom) | Run log for the open workflow | ops |
| Right toolbar and canvas controls | Add node, search, notes, assistant; zoom, fit **[screenshot]** | triggers |
| Node settings: Retry On Fail, On Error, notes | Standard in our rules **[docs]** | ops |

## 5. Gaps this map still has
Overview details beyond the Insights banner, Help, Migration report, Context (Preview), the Roles detail, Security & policies detail, exact API paths for Variables, Projects, Tags and Executions, and what the Usage and plan page shows. Each specialist must close its own gaps from docs or a read-only probe, then update this file.
