# Showcase Template: Invoice & Reporting Automation

**Category:** Back-office · **Status:** Idea

## Pitch
Weekly cash and sales reports build themselves, and overdue invoices get reminder drafts for your one-click approval.

## Flow (draft)
Schedule Trigger → pull invoices/sales from accounting or Sheets → aggregate (totals, overdue, top customers) → build report (Sheet/PDF) → email/Slack summary; branch: overdue scan → tiered reminder drafts → "Send and Wait for Response" approval → send → log.

## Guardrails
Totals cross-checked against source, currency/time zone handling, no duplicate reminders, stop on payment, human approval on any message to a customer.

## Typical apps
Accounting tool or Google Sheets, Gmail, Slack, optional Claude/OpenAI for report commentary.

## Open decisions for design
Which accounting source to demo, report layout, reminder tiers.
