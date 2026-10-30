# Step card: Slack (weekly summary message)

**Workflow:** W1 (and the shared error alert, already built for SHOW-001) · **Type:** connection / app · **Specialist:** connections · **n8n version assumed:** UNKNOWN
**Prepared:** 2026-10-28 by the architect in the connections-specialist role, from docs.n8n.io. **Revised 2026-10-30** after `reviews/connections-review.md`.

## What it does (plain English)
Posts a short weekly summary (totals, overdue amount and count, change vs last week) in one Slack channel. It never carries customer names, customer emails or the AI commentary. Figures come from the workflow. By default the AI commentary goes in the owner's email only.

## Fields
| Direction | Field | Type | Rule or example (synthetic) |
|---|---|---|---|
| Out | Channel | ID from Settings | Owner supplies the channel. Placeholder until then |
| Out | Text | text | Per currency: sales, change %, overdue amount and count, link to the sheet. No customer names, no emails, **no AI commentary** |

## Connection
- Node and version: Slack, Message > Send. typeVersion: verify on import (docs mention versions 2.5 to 2.7 for various options).
- Credential name: `Slack - AI Ops Expert` (already created for SHOW-001; reuse). Type: **OAuth2 is the type the docs recommend for the Slack node**; an access token (Bot User OAuth Token) works but is "not recommended" for the node (it is the type the Slack Trigger needs, which we do not use). Check which type SHOW-001 used; an access token still works for Send.
- Scope: **`chat:write`** for posting (verified in the Slack credentials docs). The bot must be a member of the channel (kept as the safe instruction; the docs are silent on whether it is a hard rule), and also in the alert channel used by the shared alert.
- Options: do **not** use "Custom Bot Profile Photo" (from node 2.6 it only works with an access token, not OAuth2). Switch off any option that appends a link to the workflow or "sent automatically by n8n" text, if one exists on this version (not in the docs reached), so the instance URL is not posted.
- Where the owner creates it: Credentials tab.

## If it fails
| Failure | What n8n does | What our design does | Alert |
|---|---|---|---|
| Slack down or bot not in channel | Node errors | Retry On Fail (3 tries with wait), then Continue (using error output) to a log update (`slack_sent = no`) and Stop and Error. The email already went; the run row says so | Shared error alert |
| Duplicate post on re-run | Possible | Prevented by the report-run claim and its re-read (design section 7) | n/a |

## Limits and cost
Slack rate limits for Send are not given in the docs reached; one message per week. No cost on self-hosted.

## Verified facts
| Fact | Source | Date | n8n version |
|---|---|---|---|
| Message ops: Delete, Get permalink, Search, Send, Send and Wait for Response, Update | https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.slack/ | 2026-10-30 | page current |
| Credential methods: OAuth2 recommended for the node; access token works but is not recommended for the node and is needed for the Slack Trigger | https://docs.n8n.io/integrations/builtin/credentials/slack/ | 2026-10-30 | page current |
| `chat:write` is the bot scope for sending messages | same | 2026-10-30 | page current |
| Slack Send and Wait for Response: Response Type options Approval, Free Text, Custom Form; outputs `approved`, `respondedAt`, `channel`, `messageId`, `responder` (Option B only, not chosen) | https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.slack/approvals/ | 2026-10-28 | page current |

## UNVERIFIED (never guessed)
- Channel selection by ID works with the Settings value.
- Whether the Send node has an option that appends a link or attribution (see Options above).
- Bot membership as a hard rule.
- Slack Send and Wait: Limit Wait Time, timeout behaviour, Custom Form field definition (Option B only, parked).
- Channel name or ID (owner supplies).

## How to prove it
Test T10 (summary content), T26 (Slack failure). Evidence: screenshot of the posted message (synthetic) and the log row `slack_sent`.

## Owner decisions needed
- Channel for the summary (can be the same as SHOW-001's alert channel).
- Default is no AI commentary in Slack; say so if you want it there.
