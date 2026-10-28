# Showcase Template: Inbox & Inquiry Triage

**Category:** AI / back-office · **Status:** Idea

## Pitch
Every incoming customer email is read, categorised and prioritised in seconds. Routine questions get a ready-to-send draft reply; anything sensitive goes to a person.

## Flow (draft)
Gmail/Outlook trigger → strip signatures and quoted text → LLM classifies (category, urgency, language, confidence as JSON) → validate → Switch (routine / sales / complaint / review) → draft reply from approved FAQ and tone guide → "Send and Wait for Response" approval → send → log to data table; sales emails also create a CRM lead.

## Guardrails
Never auto-send; fixed category list; confidence threshold sends low-confidence mail to a review queue; complaints, legal and refund wording always escalate; injection-safe handling of email text; PII minimised in the prompt; cost cap per day.

## Typical apps
Gmail or Outlook, Slack, Claude/OpenAI, data table, optional CRM.

## Open decisions for design
Which mailbox to demo, FAQ source (Sheet or Notion), category list, escalation rules.
