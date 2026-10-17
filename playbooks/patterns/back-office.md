# Pattern Library: Back-Office Ops

| Pattern | Flow | Key safeguards |
|---|---|---|
| Invoice & reporting | Schedule Trigger → pull sales/invoice data → aggregate → build report (Sheet/PDF) → email/Slack summary | Time zone and currency handling, totals cross-check, no duplicate sends |
| Invoice chase | Overdue scan → tiered reminder drafts → owner approval → send → log | Human approval on tone/amounts, stop on payment |
| Client onboarding | Signed deal/form → create folders, tasks, access requests, welcome email → checklist tracker | Idempotency, per-client naming convention |
| Data sync | App A ↔ App B via IDs in a data table; change detection by updated-at | Conflict rule defined, loop prevention, dry-run first |
| Document filing | Incoming email/attachments → classify → name by convention → file in Drive/SharePoint → log row | Naming rules, duplicate check |
| Approvals | Request form → route to approver (Send and Wait) → reminders → outcome written back | Timeouts and escalation path |
