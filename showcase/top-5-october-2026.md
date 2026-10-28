# Top 5 SMB n8n Automations to Sell: October 2026 Lineup

**Purpose:** the five showcase templates to build, demo and market first (Upwork, Fiverr, social, website).
**Status:** Proposed. Needs owner approval (see "Decisions needed").
**Honest note:** the ranking is a judgment call based on the repo's pattern libraries and common SMB pain points. It is not market data. Validate against live Upwork/Fiverr demand before spending build time.

## The lineup
| # | Showcase | Business pain it kills | Tier (see pricing guide) | Status |
|---|---|---|---|---|
| 1 | AI Lead Qualifier → CRM (`ai-lead-qualifier`) | Leads answered late or lost; no one knows which are hot | Advanced | Built, inactive, in QA (SHOW-001) |
| 2 | Invoice & Reporting (`invoice-reporting`) | Chasing unpaid invoices; manual weekly reports | Standard | Spec only |
| 3 | Order → Support Flow (`order-to-support`) | "Where is my order?" tickets; problems found by angry customers | Advanced | Spec only |
| 4 | Inbox & Inquiry Triage (`inbox-triage`) | Shared inbox buried; slow replies; staff time on routine questions | Advanced | Spec only (new) |
| 5 | Booking & Follow-up (`booking-followup`) | No-shows; no reminders; no review requests after the job | Standard | Spec only (new) |

## Why this order
- **1 first:** already built and furthest along. Finishing QA gives you a real proof point fastest.
- **2 next:** lowest risk (mostly no AI), easy to explain in money terms (cash collected sooner), and it is a natural upsell after the lead qualifier.
- **3, 4:** the AI-heavy pair. They show off guardrails (human approval, review queue), which is your differentiator against cheap "AI chatbot" sellers.
- **5 last:** simple and broadly applicable (clinics, salons, trades, consultants), good for quick Fiverr-style fixed-price offers.

## How the five fit together
A small business can buy them as a path: win leads (1) → serve and communicate (4, 5) → fulfil (3) → get paid and see the numbers (2). Use this as the bundle story on your website.

## Build plan (each one follows the normal gates)
Intake → Gate 1 → Design → Gate 1b → Build (inactive, Sandbox only, synthetic data) → Review → QA → Gate 2 → Showcase assets. Build one at a time, in the order above.

## Decisions needed from you
1. Approve this lineup, or swap any item (runner-ups: document/receipt capture to Sheets with AI extraction; review and reputation requests).
2. For each showcase, pick the demo apps (CRM, accounting source, store/helpdesk). Defaults are in each spec's "Open decisions".
3. Do you want me to check live Upwork demand first (read-only search) before we commit build time?

## Next step
On your approval, I start intake for #2 (Invoice & Reporting) while #1 finishes QA.
