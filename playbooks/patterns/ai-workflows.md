# Pattern Library: AI / LLM Workflows

All patterns must meet `playbooks/ai-guardrails.md`.

| Pattern | Flow | Key safeguards |
|---|---|---|
| Classify & route | Inbound text → Text Classifier or LLM labels (fixed label set + confidence) → Switch by label → action; low confidence → review queue | Fixed labels, low temperature, review path |
| Extract from documents | File/email → text/OCR → Information Extractor (JSON schema) → validate → write to Sheet/CRM/accounting | Schema validation, source link kept, human check on money fields |
| Summarize & brief | Calls/threads/tickets → LLM summary + action items → post to Slack/CRM note | PII minimization, length caps |
| Draft & approve | Trigger → LLM drafts reply/content → "Send and Wait for Response" approval (Slack/email) → send only after approval | Never auto-send high-stakes content |
| Enrich & research | Company/lead → fetch public data → LLM structures profile → CRM fields | Cite sources, flag uncertain fields |
| Agentic multi-step | AI Agent node with tools (and sub-workflows as tools); each tool call validated against allow-lists | Narrow tool scopes, step limits, cost caps, full logging |

Prefer deterministic nodes for anything a rule can decide; use the LLM only where judgment or language is required.
