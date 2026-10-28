# Step card: Gmail (report email, approval request, reminder send, optional draft)

**Workflow:** W1 (report email), W3 (approval, reminder, draft) · **Type:** connection / app · **Specialist:** connections · **n8n version assumed:** UNKNOWN
**Prepared:** 2026-10-28 by the architect in the connections-specialist role, from docs.n8n.io. Specialist review pass recommended before build.

## What it does (plain English)
Gmail sends the weekly summary to the owner, asks the owner "send this reminder? Approve / Decline" with one-click buttons, and only after Approve sends the reminder, to a test address in the showcase.

## Fields
| Direction | Field | Type | Rule or example (synthetic) |
|---|---|---|---|
| Out (report) | To, Subject, Message | text | To = owner's own address (Settings). Aggregates only. |
| Out (approval) | To, Subject, Message, Type of Approval | text | To = owner. Message shows the exact draft, invoice no, amount, tier. Type of Approval = Approve and Disapprove |
| Out (reminder) | To, Subject, Message | text | To = `demo_recipient` (owner's own test address) while `demo_mode` is true. Never the invoice's customer_email in the showcase |
| Out (optional) | Draft: Subject, Message | text | Created on Decline so the owner can edit and send by hand (option, see design) |
| In (approval) | `approved` | boolean | Only an explicit true allows sending. Output field name for Gmail UNVERIFIED (see below) |

## Connection
- Node and version: Gmail. Operations used: Message > Send a message; Message > Send a message and wait for approval; Draft > Create a draft. typeVersion: verify on import.
- Credential name: `Gmail - AI Ops Expert showcase`. Type: Google OAuth2 (docs: OAuth2 recommended; service account only with domain-wide delegation, discouraged). Scopes: UNVERIFIED, shown on the credential screen.
- Where the owner creates it: Credentials tab; self-hosted needs the owner's Google Cloud OAuth app with the Gmail API enabled.

## If it fails
| Failure | What n8n does | What our design does | Alert |
|---|---|---|---|
| Report email fails | Node errors | Retry On Fail (2 tries). A duplicate is harmless (owner's own inbox). Then Stop | Shared error alert |
| Approval email fails to send | Node errors | Retry On Fail (2 tries), then Stop; log row stays `pending`, swept to `timed_out` | Shared error alert |
| Owner never responds | Execution waits (offloaded to database). Timeout behaviour for this operation not documented | Stale-pending sweep and "still pending?" re-check before sending (design section 9) so a late click can never send an expired reminder | None; logged `timed_out` |
| Reminder send fails | Node errors | **No Retry On Fail** (a retry after a timeout could send the customer message twice). On Error: Continue (using error output) to log `send_failed` and Stop and Error | Shared error alert |
| Customer-facing send with no approval | Not possible: the send node is reachable only from the approved branch | n/a | n/a |

## Limits and cost
Gmail sending limits exist (values not verified here); demo volume is a handful of messages. Waiting executions are stored in the database while they wait (verified for the Wait node); keep the wait limit short.

## Verified facts
| Fact | Source | Date | n8n version |
|---|---|---|---|
| Gmail Message operations: Add/Remove Label, Delete, Get, Get Many, Mark as Read/Unread, Reply, Send a message. Draft operations: Create, Delete, Get, Get Many | https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.gmail/ | 2026-10-28 | page current |
| Gmail's wait operation is named **Send a message and wait for approval** (not "response"). Parameters: To, Subject, Message. Options: Type of Approval (Approve Only default, or Approve and Disapprove), Approve Button Label/Style, Disapprove Button Label/Style | https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.gmail/message-operations/ | 2026-10-28 | page current |
| Send options: Email Type, Append n8n attribution, Attachments, BCC, CC, Sender Name, Send Replies To, Reply to Sender Only | same | 2026-10-28 | page current |
| Gmail node docs state no free-text reply for the approval operation; they suggest the Wait node for complex flows | same | 2026-10-28 | page current |
| Human-in-the-loop page lists Gmail as an approval channel ("send approval requests via email") | https://docs.n8n.io/advanced-ai/human-in-the-loop-tools/ | 2026-10-28 | page current |
| Credentials: OAuth2 recommended for Gmail | https://docs.n8n.io/integrations/builtin/credentials/google/ | 2026-10-28 | page current |

## UNVERIFIED (never guessed)
- **Limit Wait Time** on the Gmail approval operation. The Gmail docs page does not mention it. The Wait node documents Limit Wait Time for form and webhook resumes only. Verify on the instance whether the Gmail node shows a "Limit Wait Time" option. Fallback: design section 9 (re-check log row is still `pending` after the click plus the stale sweep), which gives a safe skip even if the node waits forever.
- What the node outputs on approve, decline and (if supported) timeout; how to tell Decline from Timeout.
- Whether the owner can edit the text (docs imply no). Design treats "edit" as decline plus manual edit from the saved draft.
- Draft > Create a draft parameters (the page names the operation only).
- Whether the approval link needs the instance's public URL set correctly (it resumes through a link served by n8n). Owner confirms the Webhook/Production URL setting, as flagged in SHOW-001.
- Gmail scopes.

## How to prove it
Tests T14 to T19, T23, T24. Evidence: screenshot of the approval email, the execution paused at the wait step, the post-click execution, the test inbox showing the single delivered reminder, the log row.

## Owner decisions needed
- Option A (Approve/Decline) vs Option B (Slack form with edit), design section 9.
- A test address for `demo_recipient` (your own, never a customer's).
