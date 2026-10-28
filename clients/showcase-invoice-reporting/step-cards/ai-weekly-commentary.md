# Step card: AI weekly commentary (aggregates only, owner-facing)

**Workflow:** W1 · **Type:** AI · **Specialist:** ai · **n8n version assumed:** UNKNOWN
**Prepared:** 2026-10-28 by the architect in the AI-specialist role, from docs.n8n.io and `playbooks/ai-guardrails.md`. Specialist review pass recommended before build.

## What it does (plain English)
After the numbers are proven correct, an AI writes two or three plain sentences about what changed and what to watch. The AI never writes a number: the numbers in the report come from n8n, and the AI's sentences are checked so they cannot contain digits or contradict the direction of change.

## Fixed chain, not an agent
Basic LLM Chain + Structured Output Parser + chat model. No AI Agent node, no tools, no memory (guardrail 12: steps are known).

## Fields
| Direction | Field | Type | Rule or example (synthetic) |
|---|---|---|---|
| In (sent) | per currency: sales_change_pct band, overdue_change band, ageing shares (%), concentration (top-customer share %), counts | numbers | Aggregates only. No names, no emails, no invoice numbers, no customer ranking with names |
| Not sent | customer names, emails, invoice numbers, free text | | PII minimization |
| Out | `headline` | string | 1 to 160 chars, no digits |
| Out | `items` | array, 1 to 3 | each: `metric_key` (enum: sales, overdue_amount, overdue_count, concentration), `direction` (enum: up, down, flat), `note` (1 to 160 chars, no digits) |
| Out | `confidence` | number 0 to 1 | threshold 0.70 (proposal) |

## Validation (n8n, after the model; the parser alone is not trusted)
1. Valid object with all required fields, no extra fields.
2. `headline` and every `note` non-empty, within length, **no digit characters** (regex check). This keeps every figure out of model hands.
3. `metric_key` and `direction` in the allowed sets.
4. Each `direction` equals the workflow's own computed direction for that metric (flat if absolute change under 1%).
5. `confidence` is a number from 0 to 1 and >= threshold.
Fail: one repair attempt (second call with repair prompt), then **omit the commentary**. The report still goes out with the line "AI commentary not available this week", and `commentary_status` is logged as `omitted_invalid`, `omitted_low_confidence` or `omitted_error`. This is the review path: the owner sees the figures either way, and commentary never reaches a customer.

## Connection
- Nodes: Basic LLM Chain, Structured Output Parser (Define using JSON Schema), Anthropic Chat Model (default; swappable for OpenAI). typeVersions: verify on import.
- Credential: `LLM - Showcase` (existing Anthropic credential from SHOW-001; owner adds keys inside n8n only). Provider spend limit set by owner at the provider.
- Settings (proposal): temperature 0.2, max output tokens 400, prompt caching off (one call a week).

## If it fails
| Failure | What n8n does | What our design does | Alert |
|---|---|---|---|
| Provider error or timeout | Node errors | Retry On Fail 2 tries, then Continue (using error output) to "omit commentary" | None (logged). The report must not fail because of the AI |
| Invalid or low-confidence answer | n/a | Repair once, then omit | none (logged) |
| Prompt injection | Customer text is never sent | Nothing untrusted reaches the model; still delimited in the prompt as good practice | n/a |

## Limits and cost
At most 3 model calls per run (2 tries on the first call + 1 repair), usually 1. One run a week. Input about a few hundred tokens, output under 400. Cost = (input tokens x input price) + (output tokens x output price); owner reads prices from the provider page. No dollar figures are quoted here.

## Verified facts
| Fact | Source | Date | n8n version |
|---|---|---|---|
| Basic LLM Chain: Prompt (take from previous node or define below), Require Specific Output Format (Auto-fixing, Item List, Structured Output Parser), Chat Messages (AI/System/User) | https://docs.n8n.io/integrations/builtin/cluster-nodes/root-nodes/n8n-nodes-langchain.chainllm/ | 2026-10-28 | page current |
| Structured Output Parser: "Generate from JSON Example" (all fields mandatory) or "Define using JSON Schema"; `$ref` not supported | https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.outputparserstructured/ | 2026-10-28 | page current |
| Anthropic Chat Model options: Maximum Number of Tokens, Sampling Temperature, Top K, Top P, Prompt Caching | https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.lmchatanthropic/ | 2026-10-28 | page current |

## UNVERIFIED (never guessed)
- Current model names (that docs page lists only "Claude and Claude Instant", which is stale). Builder picks the cheapest model in the instance dropdown that passes the test set. No model ID is written here.
- Whether JSON Schema mode enforces required fields and `additionalProperties: false`; the n8n validation step covers it either way.
- Provider data-processing terms for the chosen provider (owner reviews; aggregates only are sent).

## How to prove it
Tests T11 to T13 plus the commentary part of T29. Evidence: model input shown in the execution (must contain no names or emails), validation branch taken, the report with and without commentary, and the 10-case commentary check below (design section 14). The Evaluations tab can run the set (hand-picked cases) if the owner wants it; not required for v1.

## Owner decisions needed
- Provider (default Anthropic, as in SHOW-001) and the model choice.
- Confirm "omit on failure" (recommended) instead of holding the whole report for review.
