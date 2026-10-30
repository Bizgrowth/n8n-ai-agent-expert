# Step card: Gmail (report email, approval request, reminder send, optional draft)

**Workflow:** W1 (report email), W3 (approval, reminder, draft) · **Type:** connection / app · **Specialist:** connections · **n8n version assumed:** UNKNOWN
**Prepared:** 2026-10-28 by the architect in the connections-specialist role, from docs.n8n.io. **Revised 2026-10-30** after `reviews/connections-review.md` and `reviews/ops-review.md`.

## What it does (plain English)
Gmail sends the weekly summary to the owner, asks the owner "send this reminder? Approve / Decline" with one-click buttons, and only after Approve sends the reminder, to a test address in the showcase. A separate step saves a draft when the owner declines.

## Fields
| Direction | Field | Type | Rule or example (synthetic) |
|---|---|---|---|
| Out (report) | To, Subject, Message | text | To = owner's own address (Settings). Aggregates only. Email Type plain text |
| Out (approval) | To, Subject, Message, Type of Approval | text | To = owner. Message shows the exact draft, invoice no, balance, tier. Type of Approval = Approve and Disapprove (Disapprove label default "Decline"). **Do not forward this email** (each run has its own resume link) |
| Out (reminder) | To, Subject, Message | text | To = `demo_recipient` (owner's own test address). Never the invoice's customer_email in the showcase. There is no demo on/off switch; do not add one. Email Type plain text |
| Out (draft on Decline) | Draft: Subject, Message | text | Made by a **separate Gmail node, Draft > Create a draft**, on the not-approved branch (W3 step 9d). The approval node has no draft or edit option |
| In (approval) | `approved` | boolean | Only an explicit true allows sending. Output field name for Gmail UNVERIFIED (run once and look at the output before wiring the IF) |

## Connection
- Node and version: Gmail. Operations used: Message > Send a message; Message > **Send a message and wait for approval**; Draft > Create a draft. typeVersion: verify on import.
- Credential name: `Gmail - AI Ops Expert showcase`. Type: Google OAuth2 (docs: OAuth2 recommended; service account only with domain-wide delegation, discouraged). Scopes: UNVERIFIED, shown on the credential screen.
- Where the owner creates it: Credentials tab; self-hosted needs the owner's Google Cloud OAuth app with the Gmail API enabled. The 7-day token expiry for an External app in Testing applies here too (see the Sheets card).

## If it fails
| Failure | What n8n does | What our design does | Alert |
|---|---|---|---|
| Report email fails | Node errors | Retry On Fail (2 tries). A duplicate is harmless (owner's own inbox). Then Stop | Shared error alert |
| Approval email fails to send | Node errors | Retry On Fail (2 tries), then Stop; log row stays `pending`, swept to `timed_out`. If a send succeeded but reported failure, the owner gets two approval emails for one invoice: harmless, because W3 re-checks the log row | Shared error alert |
| Owner never responds | Execution waits (offloaded to database). Timeout behaviour for this operation not documented | Stale-pending sweep and the post-click guard (design 9.3). Without a node wait limit the W3 run stays Waiting until stopped by hand or pruned by retention; QA records the Waiting count after T17 | None; logged `timed_out` |
| Late Decline after the sweep | n/a | W3 only updates a row that is still `pending` and not expired; otherwise ends with no write | none |
| Reminder send fails | Node errors | **No Retry On Fail** (a retry after a timeout could send the customer message twice). On Error: Continue (using error output) to log `send_failed` and Stop and Error | Shared error alert |
| Customer-facing send with no approval | Not possible: the send node is reachable only from the pending + approved + unpaid + unchanged branch | n/a | n/a |
| Draft step fails | Node errors | Retry 2, then continue to END (the log row is already written) | none |

## Limits and cost
Gmail sending limits exist (Google's docs, not n8n's; not verified); demo volume is a handful of messages. Waiting executions are stored in the database while they wait (verified for the Wait node).

## Verified facts
| Fact | Source | Date | n8n version |
|---|---|---|---|
| Gmail Message operations: Add/Remove Label, Delete, Get, Get Many, Mark as Read/Unread, Reply, Send a message, Send and Wait for Approval. Draft operations: Create, Delete, Get, Get Many (no Create parameters given) | https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.gmail/ | 2026-10-30 | page current |
| The wait operation is named **Send a message and wait for approval**. Parameters: To, Subject, Message. Options: Type of Approval (Approve Only default, or Approve and Disapprove), Approve Button Label/Style, Disapprove Button Label (default Decline)/Style | https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.gmail/message-operations/ | 2026-10-30 | page current |
| Send options: Email Type, Append n8n attribution, Attachments, BCC, CC, Sender Name, Send Replies To, Reply to Sender Only | same | 2026-10-30 | page current |
| No free-text reply for the approval operation; docs suggest the Wait node for complex flows. The page lists **no Limit Wait Time** and no timeout output | same | 2026-10-30 | page current |
| Each Wait execution gets its own resume URL generated at runtime | https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.wait/ | 2026-10-30 | page current |
| Human-in-the-loop page lists Gmail as an approval channel | https://docs.n8n.io/advanced-ai/human-in-the-loop-tools/ | 2026-10-30 | page current |
| Credentials: OAuth2 recommended for Gmail | https://docs.n8n.io/integrations/builtin/credentials/google/ | 2026-10-30 | page current |

## UNVERIFIED (never guessed)
- **Limit Wait Time** on the Gmail approval operation (not in docs; expected to be visible on the instance, from memory only). What happens at the limit and what the node outputs. Whether it accepts an expression so tests can shorten the wait.
- What the node outputs on approve, decline and (if supported) timeout; how to tell Decline from Timeout. The field name `approved`.
- Draft > Create a draft parameters, and whether the test address can be set as the draft recipient (if not, the draft body says "send to: <test address>").
- **Preview safety:** whether merely receiving or previewing the approval email counts as Approve (T42). If it can, tell the owner before the showcase.
- The approval link needs the instance's public URL (Webhook URL) correct and reachable from the owner's browser over the owner's plain-HTTP connection; confirm the link opens without a browser block.
- The approval email arrives in the inbox (not hidden as a sent-only item).
- Gmail scopes and sending limits.

## How to prove it
Tests T14 to T19, T23, T24, T39, T42. Evidence: screenshot of the approval email, the execution paused at the wait step, the post-click execution, the test inbox showing the single delivered reminder, the log row.

## Owner decisions needed
- Option A (Approve/Decline, chosen 2026-10-30) vs Option B (Slack form with edit), design section 9.
- A test address for `demo_recipient` (your own, never a customer's).
