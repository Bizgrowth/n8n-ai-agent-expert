# Step card: Slack (weekly summary message)

**Workflow:** W1 (and the shared error alert, already built for SHOW-001) · **Type:** connection / app · **Specialist:** connections · **n8n version assumed:** UNKNOWN
**Prepared:** 2026-10-28 by the architect in the connections-specialist role, from docs.n8n.io. Specialist review pass recommended before build.

## What it does (plain English)
Posts a short weekly summary (totals, overdue amount and count, change vs last week) in one Slack channel. It never carries customer emails or the AI commentary's raw numbers; figures come from the workflow.

## Fields
| Direction | Field | Type | Rule or example (synthetic) |
|---|---|---|---|
| Out | Channel | ID from Settings | Owner supplies the channel. Placeholder until then |
| Out | Text | text | Per currency: sales, change %, overdue amount and count, link to the sheet. No customer names, no emails |

## Connection
- Node and version: Slack, Message > Send. typeVersion: verify on import (docs mention versions 2.5 to 2.7 for various options).
- Credential name: `Slack - AI Ops Expert` (already created for SHOW-001; reuse). Type: Access Token (bot) or OAuth2. Scope: `chat:write` expected for posting (docs point to Slack's method docs rather than listing it; verify at credential setup). The bot must be a member of the channel.
- Where the owner creates it: Credentials tab.

## If it fails
| Failure | What n8n does | What our design does | Alert |
|---|---|---|---|
| Slack down or bot not in channel | Node errors | Retry On Fail (3 tries), then Continue (using error output) to a log update (`slack_sent = no`) and Stop and Error. The email already went; the run row says so | Shared error alert |
| Duplicate post on re-run | Possible | Prevented by the report-run claim (design section 7) | n/a |

## Limits and cost
Slack rate limits not verified; one message per week. No cost on self-hosted.

## Verified facts
| Fact | Source | Date | n8n version |
|---|---|---|---|
| Message ops: Delete, Get permalink, Search, Send, Send and Wait for Response, Update | https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.slack/ | 2026-10-28 | page current |
| Credential methods: OAuth2 (user token), Access Token (user or bot token) | same | 2026-10-28 | page current |
| Slack Send and Wait for Response: Response Type options Approval, Free Text, Custom Form; Approval has Advanced Interactivity (Capture Who Responded, Restrict Who Can Approve, After Decision). Outputs `approved`, `respondedAt`, `channel`, `messageId`, `responder` | https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.slack/approvals/ | 2026-10-28 | page current |

## UNVERIFIED (never guessed)
- Required bot scopes for Send.
- Slack Send and Wait: Limit Wait Time and timeout behaviour (approvals page silent). Only relevant if the owner picks Option B.
- Custom Form field definition for an "edited text" field (Option B only).
- Channel name or ID.

## How to prove it
Test T10 (summary content), T26 (Slack failure). Evidence: screenshot of the posted message (synthetic) and the log row `slack_sent`.

## Owner decisions needed
- Channel for the summary (can be the same as SHOW-001's alert channel).
