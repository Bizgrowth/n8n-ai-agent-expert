# SHOW-002: what changed after the specialist review

**Date:** 2026-10-30 · **Files updated:** `design.md` and all nine step cards · **Gate 1b:** still pending (nothing built, nothing activated)

## What changed, in plain words

**The weekly report numbers**
- A currency with no sales this week (for example EUR) now shows as zero instead of wrongly blocking the report.
- A seventh check was added: last week's sales are also proven against the spreadsheet, so the "change vs last week" figure is trustworthy.
- Money is converted to whole cents per row before adding, and cells with more than two decimals are rejected, so a one-cent drift cannot hide.
- Bad cells (text like "N/A", impossible dates, the same invoice number twice) are caught as bad data instead of crashing the run.
- The "source is empty" check now counts real rows, so an empty sheet really does stop the run.
- The open-balance control now uses the same definition as the workflow (real invoices only, not credit notes).
- Said openly: the live check does not prove the ageing split (not due, 1 to 7, 8 to 30, over 30). Tests cover that.

**Duplicates and stale approvals**
- The weekly run and the daily scan now claim first, then re-read the sheet to confirm exactly one claim is theirs. If it cannot confirm, it stops (no send). This is honest about Google Sheets not being a true database.
- A reminder is no longer sent if the balance or level changed while you waited. The approval step stores what you were shown and compares it before sending.
- A late Decline can no longer overwrite a timed-out row, and a late Approve still sends nothing.
- A crash inside the per-invoice workflow is caught by its own error setting, not by the daily scan.
- Unanswered approvals can stay in a "Waiting" state in n8n without a node time limit; QA now counts them.
- Added: do not forward the approval email.

**The AI commentary**
- A badly formatted AI reply now goes to the repair step instead of being dropped.
- Each AI note names its currency. Rules now say when a direction is not offered (for example prior week is zero). "Concentration" was dropped because there is nothing to compare it with.
- Stricter text checks: digits in any script, an allow-list of plain characters (no links), and a few banned words like "doubled". The AI input is built from a fixed list of fields so a name cannot slip in.
- A short `reason` field is back, and confidence, reason and the AI text are all logged.

**Setup and connections**
- Google Drive API must be enabled; header rows of all tabs must be locked; retries wait a few seconds.
- Gmail: the Decline draft is made by a separate "Create a draft" step; the "demo mode" wording was removed (reminders always go to your test address); a test checks that previewing the approval email does not count as Approve.
- Slack: the send scope is `chat:write`; OAuth2 preferred; no appended links; the AI commentary goes in the email only, not Slack.
- The Error Workflow setting is left blank in the exported workflows. Each has a note telling you to set it to the shared alert after import. Each workflow must import with no errors.

**Tests and evidence**
- New tests T37 to T42 and AI cases C11 to C13.
- Evidence rules corrected: only a real scheduled failure proves the Slack alert. Manual runs prove the Error status, the message and the log row.
- The test for a missed approval uses a short wait (a few minutes) so it does not take two days.
- Section 17 (verify on import) was rewritten to 20 items.

## Needs your decision

1. **Is it OK that a failed AI commentary is left out (and logged) instead of sent to a review queue?** This departs from the AI guardrails. Recommended: yes, because it is only your own email and the figures are unaffected. Alternative: hold the whole report for you to review.
2. **Google OAuth app status.** If it is in "Testing", sign-in expires every 7 days and both schedules would stop. Choose Production, Internal (Workspace account) or a weekly reconnect.
3. **Ageing split.** Accept the honest note for the showcase (recommended), or add per-bucket columns to the control sheet so it is proven live.

Smaller, optional: for the weekly report, whether to use "Run the most recent missed execution" if your n8n version supports it (default is not to).

Still needed from you, unchanged: Slack channel, time zone, n8n version and edition, test mailbox address, model choice, and your plain-words approval for Gate 1b.
