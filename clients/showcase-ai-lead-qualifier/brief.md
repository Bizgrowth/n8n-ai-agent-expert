# Automation Brief — AI Lead Qualifier → CRM (Showcase)

**Client:** Internal showcase (AI Ops Expert) · **n8n instance/project:** Owner's n8n, Personal project (Sandbox/Showcase only; instance is not yet on HTTPS) · **Gig ID:** SHOW-001 · **Source:** Website / Upwork / Social (marketing template)
**Date:** 2026-10-17 · **Loom walkthrough?** [ ] yes [ ] no — TBD (owner to tick)
**Delivery model:** Showcase only. Template is exported as workflow JSON; no hosting for clients.

## 1. Business goal
- Problem today: inbound leads wait for manual review, hot leads get slow replies, CRM data is inconsistent.
- Desired outcome and success metric: every lead is scored and routed within about a minute; hot leads alert the owner immediately. Metric for demo: time from submission to alert/CRM record.
- Time/cost saved (estimate): TBD — to be stated as a typical range only after the demo is tested.

## 2. Trigger
- Web-form submission via **n8n Webhook node** (assumed; owner did not choose a source), with header authentication. Demo volume is low and on demand.

## 3. Systems & access
| App | Role | n8n node exists? | Credential ready? | Notes |
|---|---|---|---|---|
| Webhook (n8n) | Lead intake | Yes (built-in) | n8n header-auth credential to create | Production URL needs the instance's public address set correctly |
| HubSpot | CRM contacts + tasks | To verify in design | TBD — owner to create in n8n | Carried over from the Make showcase: a DEMO contact property was planned; confirm whether it exists in HubSpot |
| Slack | Hot-lead and review alerts | To verify in design | TBD — owner to create in n8n | Channel TBD |
| Claude or OpenAI | Lead scoring | To verify in design (AI chat-model nodes) | TBD | Owner adds the API key in n8n, never in chat |

## 4. Data
- Fields in: name, email, company, role/title, company size, budget range, timeline, free-text message, source/UTM, consent flag.
- Fields out: HubSpot contact (with DEMO tag and AI score fields), task for hot leads, Slack alert, log row.
- Sensitive/personal data: contact details only. Send the model only the fields needed for scoring.
- Sample data available? No — use synthetic leads only.

## 5. Logic & rules
1. Receive lead, validate required fields (email, company), normalize (trim, lowercase email).
2. Dedupe by email against HubSpot; update the existing contact instead of creating a duplicate.
3. LLM scores fit with a **generic B2B rubric** (company size, role seniority, budget signal, urgency, service fit) and returns JSON: `score`, `tier` (hot/warm/cold), `reason`, `confidence`.
4. Validate the JSON. Route:
   - **Hot:** HubSpot contact + task, and instant Slack alert (owner-selected).
   - **Warm / Cold:** HubSpot contact with DEMO tag, no alert. *(Proposed default; confirm.)*
   - **Low confidence or invalid output:** Slack review message for owner decision. *(Required by AI guardrails.)*
5. All HubSpot records carry a **DEMO** tag so they can be filtered or deleted.
- Edge cases: missing fields, duplicates, spam/junk text, prompt-injection text in the message field, HubSpot or Slack outage.

## 6. AI / LLM step
- Task: classify and score a lead. Risk level: low (internal demo), but guardrails apply because this is a sellable template.
- Human-review rule: confidence below the threshold (value to set in design) or failed validation goes to Slack review.
- Acceptable error rate: to set after a 10-case test set.

## 7. Volume & cost
- Runs per month: demo only, assume up to 100.
- Estimated executions per month: about 100 (one per lead; sub-workflows would add more). LLM cost per run: TBD in design.
- Where it runs: owner's self-hosted n8n (no per-run fee; server and LLM tokens are the real cost).

## 8. Failure handling
- Owner alerted in Slack from the shared error workflow with workflow name, failing node and execution link. HubSpot or LLM errors retry (Retry On Fail), then go to the review path.

## 9. Delivery
- Deadline: none · Budget: n/a (internal) · Delivered inactive; owner activates.
- Showcase outputs after QA: workflow JSON export, Upwork gig draft, social posts, website blurb.

## 10. Open questions
- Which Slack channel for hot-lead alerts and for review items?
- Confirm Warm/Cold handling (HubSpot only, no alert).
- Which LLM (Claude or OpenAI) and who adds the key in n8n?
- Does the DEMO property already exist in HubSpot?
- Which n8n edition and version is the VPS running (see `docs/connect-n8n.md`)?
- Loom walkthrough: yes or no?

## Summary & readiness
A web-form lead is scored by an AI against a standard B2B rubric and routed: hot leads create a HubSpot task and a Slack alert, warm and cold leads are logged quietly, and uncertain results go to you for review. Everything is tagged DEMO and built inactive on your own n8n. **Ready for design? Yes**, once the open questions above are answered (the Slack channel and LLM choice are needed before build, not design). Showcase use only until the VPS is behind HTTPS.

**Gate 1 — Owner approval:** [ ] approved on ____
