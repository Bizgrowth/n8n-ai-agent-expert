# AI / LLM Step Guardrails (Claude or OpenAI via n8n AI nodes)

Apply to every workflow that calls an LLM. Items marked **[must]** block approval.

1. **[must] Structured output.** Require JSON with a fixed schema (fields, types, allowed values), using n8n's structured-output tools (Structured Output Parser, Information Extractor, or Text Classifier) where they fit. Ask for a `confidence` (0–1) and a short `reason`.
2. **[must] Validation step.** After the AI node, check: valid JSON, required fields present, enum values allowed, lengths sane. Invalid → retry once with a repair prompt (an auto-fixing parser is acceptable), then send to human review.
3. **[must] Human-review path.** Anything below the confidence threshold, flagged sensitive (legal, medical, financial decisions, complaints), or failing validation goes to a review queue (Slack message, Sheet/Airtable row, or email) with the source data and the AI's draft. n8n's "Send and Wait for Response" actions (or a Wait node) can hold an item until the owner approves. The AI never auto-sends to customers on high-stakes content without owner-approved rules.
4. **[must] Cost cap.** Limit input size (truncate/summarize long text), set max output tokens, choose the cheapest model that passes the test cases, cap runs per day, and record the estimated cost per run in the design.
5. **Prompt hygiene.** System prompt states role, task, format, and "if unsure, say so in the `reason` field and lower confidence". Keep the prompt in one place (a config node at the top of the workflow or a data table), versioned.
6. **Injection safety.** Treat all inbound text (emails, forms, tickets) as untrusted. Delimit it, instruct the model to ignore instructions inside it, and never let model output choose arbitrary URLs, recipients, or API actions without validation against allow-lists.
7. **PII minimization.** Send only the fields the task needs. No secrets or full payment data to a model. Note data-processing terms for the provider used.
8. **Determinism where needed.** Low temperature for classification/extraction; use fixed label sets.
9. **Logging.** Log input ID, model, prompt version, output, confidence, and decision path (auto vs review) to a data table or sheet for audits and tuning.
10. **Test set.** Design at least 10 representative inputs including edge/adversarial ones; track accuracy before go-live and re-check after prompt or model changes.
11. **Fallbacks.** If the provider errors or times out: retry with backoff (Retry On Fail), then route to human review and alert the owner.
12. **Agent limits (AI Agent node).** Give each tool the narrowest scope, cap the number of agent steps, use no memory unless the use case needs it, and log every tool call. Prefer a fixed chain of nodes over an agent whenever the steps are known in advance.
