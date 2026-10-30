# Connections review: SHOW-002 (Google Sheets, Gmail, Slack cards)

**Reviewer:** n8n-connections-expert · **Date:** 2026-10-30 · **n8n version:** UNKNOWN (instance not read; docs.n8n.io pages current on the review date)
**Scope:** read-only review. The cards and the design were not edited. Nothing was run in n8n.

## Verdicts

| Card | Verdict | One-line reason |
|---|---|---|
| `conn-google-sheets.md` | OK, with 4 small additions | Operations and options match the docs. Two setup facts are missing (Drive API, 7-day token expiry) |
| `conn-gmail-send-and-wait.md` | Fix needed (small) | One wording clash with the design (`demo_mode`), and the decline-to-draft path needs to be stated plainly. Approval facts are right |
| `conn-slack.md` | OK, with 3 small additions | `chat:write` is now verified. Credential type advice and one option to switch off |

Business impact: none of these block the build. The Gmail fix prevents confusion about where the reminder goes. The Google setup facts prevent the schedules from silently failing after a week.

## 1. Google Sheets

**Confirmed against docs (2026-10-30)**
- Operations: Append Row, Append or Update Row, Clear, Create, Delete, Delete Rows or Columns, Get Row(s), Update Row. Card is correct. [Sheets node](https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.googlesheets/)
- Get Row(s) options are Data Location on Sheet, Output Formatting, When Filter Has Multiple Matches (set to Return All Matches, otherwise only the first match comes back). Card and design are correct. [Sheet operations](https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.googlesheets/sheet-operations/)
- Update Row "only updates existing rows". The page does not say how the row is identified. Card is right to keep this UNVERIFIED.
- "Always Output Data" is NOT on the Sheets operations page. It is not a Sheets option in the docs I reached. UNVERIFIED: I expect it under the node's Settings tab (general node setting), not Options. Check on import.
- Scopes are not listed on the Google credentials page. Card is right.

**Additions needed**
1. **Google Drive API must also be enabled** for the Sheets credential, besides the Sheets API. The card and design section 13 only mention the Gmail API. Source: [Google OAuth single service](https://docs.n8n.io/integrations/builtin/credentials/google/oauth-single-service/).
2. **Seven-day token expiry.** If the Google OAuth app is "External" and in "Testing" status, consent and tokens expire after 7 days. For a weekly and a daily schedule, this would stop everything after a week with an auth error. Owner decision: publish the OAuth app to Production (or use Internal on a Workspace account), or accept a weekly reconnect. Same source. This also affects Gmail.
3. **Column names are frozen into the node.** Docs common issues: if column headers change after setup, the node errors until Mapping Column Mode is re-selected. Tell the owner to lock the header rows of the seven tabs before the build. Source: [Sheets common issues](https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.googlesheets/common-issues/). The same page notes appends need key-value items (Split Out first if the data is an array).
4. **Retry wait.** Design says "Retry 3" on Sheets calls. Set a wait between tries (a few seconds), because a quota error retried instantly will fail again. Quota numbers are not in the n8n docs (UNVERIFIED; they live in Google's Sheets API docs). Demo volume is far below any limit. Note W2 starts up to 10 W3 runs at once, each making several Sheets calls, so a short burst is possible: verify in the T28 test that none fail.

**Items to verify on import (Sheets)**
- Append or Update Row: which column it matches on. Docs name no such setting for this operation (the Append Row page even mentions "Column to Match On", which looks like a copy error). Fallback already in the design (Get Row(s) then Update or Append) is right.
- Update Row: confirm a match column can be chosen (use `log_key` or `run_key`). If not, use the fallback.
- Number columns: choose unformatted values for money so "1,234.50" text does not arrive. Exact option labels: verify. Dates stay as plain text `YYYY-MM-DD` (design already says this).
- Empty Get Row(s): confirm the branch ends cleanly (T22).

## 2. Gmail (send and wait)

**Confirmed against docs**
- Operation is called **Send a message and wait for approval** (Resource Message, Operation "Send and Wait for Approval"). Parameters: To, Subject, Message. [Gmail message operations](https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.gmail/message-operations/)
- **Approval types:** "Approve Only" (default) or "Approve and Disapprove". Buttons: Approve Button Label (default Approve) and Style (Primary or Secondary); Disapprove Button Label (default **Decline**) and Style, shown only with Approve and Disapprove. Design choice (Approve and Disapprove) is valid.
- **Limit Wait Time: not documented for Gmail.** I searched the Gmail node pages, the Slack node page and the human-in-the-loop page. None mentions it, and none describes timeout behaviour or the output fields. The card's UNVERIFIED stands. Note: I believe the product shows a Limit Wait Time option on send-and-wait nodes, but that is from memory, not a docs source, so it stays UNVERIFIED until seen on the instance.
- **Output field:** the Gmail docs do not name it. The Slack approvals page lists `approved` (card cites this). For Gmail treat `approved` as UNVERIFIED; run once and look at the output before wiring the IF.
- **Draft on Decline:** the approval operation has no draft or edit option. Saving a draft **needs a separate Gmail node** (Draft > Create a draft) on the not-approved branch. The design already does this (W3 step 8b). Correct. Docs list Draft operations Create, Delete, Get, Get Many but give no parameters for Create. [Gmail node](https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.gmail/)
- Decline and timeout cannot be told apart from the docs. The design handles it with the fallback `declined_or_timeout` note and the stale sweep. Good.
- Credentials: OAuth2; Gmail API must be enabled in the same Google Cloud project. Scopes are not listed in docs (card right).

**Fixes needed**
1. **`demo_mode` is not in the design.** The card (Fields table, reminder row) says "while `demo_mode` is true". The design has no such setting; it says the customer email is never used and the recipient is always `demo_recipient`. Remove the `demo_mode` wording from the card so the builder does not add a switch that could point reminders at real customers.
2. **State the decline path in the card:** Decline gives no draft by itself. A second node (Create a draft, on the Decline/not-approved branch) makes it. Right now the card says "Created on Decline" without saying which node does it.
3. **Draft recipient.** Create a draft parameters are unknown. Verify the test address can be set as the draft's recipient. If not, the draft body states "send to: <test address>" and the owner edits it.

**Items to verify on import (Gmail)**
- Does a Limit Wait Time option exist on this operation, and what happens at the limit (does the run continue, and with what output)?
- Output on Approve, on Decline, and after a timeout (pin the output from a test).
- **Link-preview safety (new, matters for "zero unapproved sends").** Email security tools and Gmail itself sometimes open links automatically. Test once that merely receiving or previewing the approval email does not count as an Approve. If it can, tell the owner before the showcase.
- The Approve and Decline links open a page served by n8n, so the instance's public URL (Webhook URL setting) must be correct and reachable from the owner's browser. The owner connects over plain HTTP (CLAUDE.md decision 2026-10-17), so confirm the link opens without a browser block. Not a new risk raise, just a functional check.
- Set Email Type to plain text on the reminder send (Send options list Email Type), matching the design's "plain text only".
- The approval node also sends from the owner's mailbox to the owner's own address. Confirm it arrives in the inbox and is not hidden as a sent-only item.
- Gmail sending limits: not in n8n docs (UNVERIFIED, Google's docs). Handful of messages in the demo, no concern.
- Retry 2 on the approval send: a retry after a partial failure could put two approval emails in the owner's inbox. Harmless (owner only) but expect it in T23-style tests.

## 3. Slack

**Confirmed against docs**
- Message operations: Delete, Get permalink, Search, Send, Send and Wait for Response, Update. Card right. [Slack node](https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.slack/)
- **`chat:write` is the scope for sending messages** (bot scope in the docs manifests). The card lists it as "expected"; it can now be marked verified. [Slack credentials](https://docs.n8n.io/integrations/builtin/credentials/slack/)
- Credential types: **OAuth2 is the recommended method** for the Slack node; an access token (Bot User OAuth Token) works but is "not recommended" for the node and is the one the Slack Trigger needs. The card lists "Access Token (bot) or OAuth2" without that advice. We use no Slack Trigger here, so OAuth2 is preferred. Check which type the existing SHOW-001 credential is; if it is an access token, it still works for Send.
- Rate limits: the Slack node page gives none for Send (only for Search, which we do not use). One post a week is far below any limit.
- Channel membership: the credentials page is silent. Keep the card's "bot must be a member of the channel" as the safe instruction (UNVERIFIED as a hard rule).
- Send and Wait for Response (Option B only): the Slack page does not mention Limit Wait Time. Not re-checked on the approvals page this pass. Option B was not chosen, so this is parked.

**Additions needed**
1. Add the credential-type advice above (OAuth2 preferred; check what SHOW-001 used).
2. The Send node version note is fine, but add: do **not** use the "Custom Bot Profile Photo" option (from node 2.6 it only works with an access token, not OAuth2).
3. The card says the message "never carries ... the AI commentary's raw numbers", which is confusing. Design step 26 says aggregates only and does not say whether the AI commentary is posted to Slack. Decide and write it down; the safe default is no commentary in Slack.

**Items to verify on import (Slack)**
- Channel selection by ID works with the Settings value (the card says "ID from Settings").
- The Send node may have an option that appends a link to the workflow or "sent automatically by n8n" text (not in the docs I reached; UNVERIFIED). If present, switch it off so the instance URL is not posted.
- The shared alert workflow (SHOW-001) uses the same bot; confirm it is also in the alert channel.

## 4. Data that leaves n8n (for the owner)

- Google Sheets: the whole synthetic invoice tab, including fake customer emails, is read from and written back to Google. Synthetic data only.
- Gmail: report (aggregates) and approval/reminder text, all to the owner's own addresses.
- Slack: aggregates only.
- Nothing customer-real leaves. Matches the design.

## 5. Sources (all checked 2026-10-30, n8n version not known)
- https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.googlesheets/ and /sheet-operations/ and /common-issues/
- https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.gmail/ and /message-operations/
- https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.slack/
- https://docs.n8n.io/integrations/builtin/credentials/google/oauth-single-service/
- https://docs.n8n.io/integrations/builtin/credentials/slack/
- https://docs.n8n.io/advanced-ai/human-in-the-loop-tools/ (confirms Gmail and Slack as approval channels; no timeout or output details)
- The Slack message-operations sub-page returned "not found", so Slack Send details come from the main node page.

## Next
Architect: apply the three Gmail fixes and the Sheets/Slack additions to the cards, and add the Drive API and 7-day expiry notes to design section 13. Owner: decide the OAuth app status (Production vs Testing) before the first schedule is switched on.
