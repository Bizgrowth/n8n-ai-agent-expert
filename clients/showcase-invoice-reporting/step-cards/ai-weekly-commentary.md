# Step card: AI weekly commentary (aggregates only, owner-facing)

**Workflow:** W1 (steps 16 to 21) · **Type:** AI · **Specialist:** ai · **n8n version assumed:** UNKNOWN
**Prepared:** 2026-10-28 by the architect in the AI-specialist role, from docs.n8n.io and `playbooks/ai-guardrails.md`. **Revised 2026-10-30** after `reviews/ai-review.md` (F1 to F4 and R1 to R7 applied; step numbers match design section 7).

## What it does (plain English)
After the numbers are proven correct, an AI writes a headline and up to four short notes about what changed. The AI never writes a number: the numbers in the report come from n8n, and the AI's sentences are checked so they cannot contain digits, links or odd characters, or contradict the direction of change n8n computed. The commentary goes in the owner's email, labelled AI-written, not in Slack and never to a customer.

## Fixed chain, not an agent
Basic LLM Chain + Structured Output Parser + chat model. No AI Agent node, no tools, no memory (guardrail 12: steps are known). **No Auto-fixing Output Parser** (it makes a hidden extra model call; the one explicit repair step is counted instead).

## What n8n computes first (step 14), per currency
| metric_key | Compared with | Direction | Not offered when |
|---|---|---|---|
| `sales` | prior-week sales total (controlled by rule 7) | `up`/`down` at 1% change or more, else `flat`; both zero = `flat` | prior is 0 and this week is not |
| `overdue_amount` | previous report's `overdue_balance` (read from `weekly_report`, step 7e) | same 1% rule | no previous report row, or previous 0 and this week not |
| `overdue_count` | previous report's `overdue_count` | `flat` only when equal | no previous report row |

`concentration` is **dropped** (no stored prior figure to compare with). If nothing is offered for any currency, there is no AI call (`commentary_status = off_no_metrics`).

## Fields
| Direction | Field | Type | Rule or example (synthetic) |
|---|---|---|---|
| In (sent) | per currency: currency code, change band for each offered metric, ageing shares (%), counts | numbers and codes | Aggregates only. Built by an Edit Fields step with **Include Selected Fields** listing exactly these fields, so a name cannot slip in later. Placed in a clearly marked data block; the prompt says the block is data, not instructions |
| Not sent | customer names, emails, invoice numbers, free text | | PII minimization |
| Out | `headline` | string | 1 to 160 chars |
| Out | `items` | array, 1 to 4 | each: `currency` (enum: allowed currencies), `metric_key` (enum: sales, overdue_amount, overdue_count), `direction` (enum: up, down, flat), `note` (1 to 160 chars) |
| Out | `confidence` | number 0 to 1 | threshold 0.70 (proposal) |
| Out | `reason` | string, 1 to 160 chars | Required by guardrail 1; stored for tuning in `report_runs.commentary_reason`, never shown in the report; same text checks as `note` |

## Validation (n8n, after the model; the parser alone is not trusted)
1. Valid object with all required fields, no extra fields.
2. `headline`, every `note` and `reason`: non-empty, within length, **no decimal digit of any script** (Unicode-aware test, for example `\p{Nd}` with the `u` flag, so full-width digits fail), and pass an **allow-list**: letters, spaces and basic punctuation only (period, comma, apostrophe, hyphen, colon, semicolon, parentheses). This blocks links, markdown, HTML and leading `=`, `+`, `-`, `@`.
3. **Banned words** for spelled-out magnitudes: double, triple, twice, half, third, quarter, percent, thousand, million. A start, not a complete list; other phrasings can still pass (known gap).
4. `currency`, `metric_key`, `direction` in the allowed sets; every (`currency`, `metric_key`) pair is one n8n offered; **no duplicate pair**; items may not use a metric n8n did not offer.
5. Each `direction` equals that pair's computed direction. This checks the field only, not the sentence ("sales rose" next to `direction: down` would pass). Mitigation: short notes and the prompt rule to use the direction field's own word. v2 option: the model picks fixed phrase codes and n8n writes the sentences.
6. `confidence` is a number from 0 to 1 and >= threshold.

## Failure path (step numbers from design section 7)
- Step 18 (try 1): Retry On Fail, 2 tries total. **Its error output goes to step 20 (repair)**, not to omit: a malformed reply is a node error (UNVERIFIED how the chain reports a rejected reply) and must reach the repair step. Where the error message allows, keep "provider outage" apart from "bad format" in `commentary_status`.
- Step 19: validation failure goes to step 20.
- Step 20 (repair): one call, repair prompt quoting the rejected reply and the rule broken, no retry. Step 20b validates again.
- Anything still failing: **omit the commentary**. The report still goes out with "AI commentary not available this week". `commentary_status`: `ok`, `omitted_invalid`, `omitted_low_confidence`, `omitted_error`, `off`, `off_no_metrics`. Logged in `report_runs`: status, confidence, reason, and the validated or rejected output text (no PII by design), model, prompt version.
- **Departure from `playbooks/ai-guardrails.md`.** Guardrails 2, 3 and 11 [must] say validation failures, low confidence and provider failures go to a human-review path. This design omits and logs instead, because the text is owner-facing, the figures are intact and nothing reaches a customer. It needs the owner's plain-words acceptance (design section 18, item 13); the alternative is to hold the whole report for review.

## Connection
- Nodes: Basic LLM Chain, Structured Output Parser (Define using JSON Schema), Anthropic Chat Model (default; swappable for OpenAI). typeVersions: verify on import.
- Credential: `LLM - Showcase` (existing Anthropic credential from SHOW-001; owner adds keys inside n8n only). Provider spend limit set by owner at the provider.
- Settings (proposal): temperature 0.2 (confirm the model accepts it), Maximum Number of Tokens 400, prompt caching off (one call a week).
- Parser and model sub-nodes resolve expressions against the first item only; fine with one item per run, but keep per-currency values in the chain prompt, not in sub-node expressions.

## If it fails
| Failure | What n8n does | What our design does | Alert |
|---|---|---|---|
| Provider error or timeout | Node errors | Retry (2 tries), then repair step, then omit | None (logged). The report must not fail because of the AI |
| Malformed reply (parser rejects) | Expected: node error | Error output to the repair step | none (logged) |
| Invalid or low-confidence answer | n/a | Repair once, then omit | none (logged) |
| Prompt injection | Customer text is never sent | Nothing untrusted reaches the model | n/a |

## Limits and cost
At most 3 model calls per run (2 tries on the first call + 1 repair), usually 1. One run a week (the run claim blocks a repeat week). Verify there are no hidden client retries in the Anthropic node (the OpenAI node has a "Max Retries" option; the Anthropic page lists none), which would raise the real count. Input a few hundred tokens, output capped at 400. Cost = (input tokens x input price) + (output tokens x output price); owner reads prices from the provider page. No dollar figures quoted. The provider spend limit is the hard backstop.

## Verified facts
| Fact | Source | Date | n8n version |
|---|---|---|---|
| Basic LLM Chain: Prompt, Require Specific Output Format (Auto-fixing, Item List, Structured Output Parser), Chat Messages; page says nothing on retries, error output or fallback model | https://docs.n8n.io/integrations/builtin/cluster-nodes/root-nodes/n8n-nodes-langchain.chainllm/ | 2026-10-30 | page current |
| Structured Output Parser: "Generate from JSON Example" (all fields mandatory) or "Define using JSON Schema"; `$ref` not supported; sub-nodes resolve expressions on the first item | https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.outputparserstructured/ | 2026-10-30 | page current |
| Auto-fixing Output Parser calls another LLM to fix errors (hidden extra call; not used) | https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.outputparserautofixing/ | 2026-10-30 | page current |
| Anthropic Chat Model options: Maximum Number of Tokens, Sampling Temperature, Top K, Top P, Prompt Caching | https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.lmchatanthropic/ | 2026-10-30 | page current |

## UNVERIFIED (never guessed)
- How the chain reports a rejected reply (node error or output) and what the error output carries.
- Current model names (the docs page lists only "Claude and Claude Instant", which is stale). Builder picks the cheapest model in the instance dropdown that passes the test set. No model ID is written here.
- Whether JSON Schema mode enforces required fields, enums, lengths and `additionalProperties: false`; the n8n validation step covers it either way.
- Hidden client retries in the Anthropic node; whether the chosen model accepts the temperature option.
- Evaluations availability on this instance and plan, and its node names.
- Provider data-processing terms (owner reviews; aggregates only are sent).

## How to prove it
Tests T11 to T13 plus the commentary part of T29, and the 13-case set in design section 14.4 (C1 to C7 real model with owner-labelled directions; C8 to C13 canned bad replies fed straight to the validation step on a test copy, never saved to the repo). Evidence: model input shown in the execution (field labels and numbers only), validation branch taken, the report with and without commentary, `report_runs` commentary fields. Re-run the set after any change to prompt, model or temperature and record the pass rate. Evaluations (if available) can run C1 to C7 on a copy that sends and writes nothing; optional for v1.

## Owner decisions needed
- Provider (default Anthropic, as in SHOW-001) and the model choice.
- **Plain-words acceptance of "omit on failure"** instead of holding the report for review (guardrail departure above).
