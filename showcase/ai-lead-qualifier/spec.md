# Showcase Template: AI Lead Qualifier → CRM

**Category:** Lead gen / CRM + AI · **Status:** Idea (needs intake → design → build on the Sandbox instance)

## Pitch
Every new lead is scored and routed in seconds: hot leads reach you instantly with context, cold leads get nurtured, nothing falls through the cracks.

## Flow (draft)
Webhook/form → validate + dedupe → enrich → LLM scores fit against a rubric (JSON: score, tier, reason, confidence) → validation → Switch (hot / warm / cold / review) → CRM contact + deal + task → Slack/email alert for hot leads → log to data table.

## Guardrails
Fixed rubric in a config node, confidence threshold → human review queue, cost cap, PII minimization, injection-safe handling of free-text form fields.

## Typical apps
Form tool or webhook, CRM (HubSpot or similar), Slack/Gmail, Claude/OpenAI, data table.

## Open decisions for design
Which CRM to demo, scoring rubric inputs, hot-lead SLA.
