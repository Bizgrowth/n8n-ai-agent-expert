# Automation Brief — Invoice & Reporting (Showcase)

**Client:** Internal showcase (AI Ops Expert) · **n8n instance/project:** Owner's n8n, Sandbox/Showcase only (synthetic data, built inactive) · **Gig ID:** SHOW-002 · **Source:** Website / Upwork / Fiverr / Social (marketing template)
**Date:** 2026-10-28 · **Loom walkthrough?** [ ] yes [x] no (not ticked at intake)
**Delivery model:** Showcase only. Template is exported as workflow JSON; no hosting for clients. (Per owner decision 2026-10-17, work stays on the owner's instance; HTTP/token risk accepted, not re-raised.)
**Pricing tier:** Standard (per `showcase/top-5-october-2026.md`)

## 1. Business goal
- Problem today: owners chase unpaid invoices by hand and rebuild weekly cash and sales reports manually.
- Desired outcome and success metric: the weekly report builds itself and overdue invoices get reminder drafts that the owner approves with one click. Demo metrics: report ready with no manual work, totals match the source exactly, zero reminders sent without approval.
- Time/cost saved (estimate): TBD. State a typical range only after the demo is tested.

## 2. Trigger
- Schedule Trigger: weekly for the report (day/time TBD in design) and a separate daily overdue scan (owner decision 2026-10-28). Time zone set explicitly on the workflow.

## 3. Systems & access
| App | Role (source/destination) | n8n node exists? | Credential ready? | Notes |
|---|---|---|---|---|
| Accounting source | Invoices and sales (source) | Google Sheets stand-in (owner decision) | TBD, owner creates in n8n | Source tab kept in the same shape as a QuickBooks/Xero export so it can be swapped when selling |
| Google Sheets | Report output / log (destination) | Yes (verify version in design) | TBD, owner creates in n8n | Also holds reminder log for dedupe |
| Gmail | Reminder drafts and "Send and Wait" approval; report email | Yes (verify) | TBD, owner creates in n8n | Demo recipients only (owner's own addresses) |
| Slack | Summary message (optional) | Yes (verify) | TBD, owner creates in n8n | Channel TBD |
| Claude or OpenAI | Optional report commentary | To verify in design | TBD | Included (owner decision); owner-facing only. Key added in n8n, never in chat |

## 4. Data
- Fields in: invoice number, customer name, customer email (synthetic), issue date, due date, amount, currency, status (open/paid), paid date, sales line totals.
- Fields out: weekly report (totals, overdue amount and count, top customers, trend vs prior week), email/Slack summary, reminder drafts, reminder log row (invoice no., tier, date, approver decision).
- Sensitive/personal data: customer names and emails and financial amounts. Synthetic data only; nothing real in repo or Sandbox. If AI commentary is included, send only aggregated figures, not customer emails.
- Sample data available? No. Create a synthetic invoice set that covers every tier, paid-after-reminder, multi-currency and a deliberate total mismatch.

## 5. Logic & rules
1. Schedule fires. Pull invoices and sales for the period from the chosen source.
2. Aggregate: totals, overdue (by days past due), top customers.
3. Cross-check totals against the source (control total). If they differ, stop, flag the owner, and do not publish the report.
4. Build report (Google Sheet plus email and Slack summary), then send the email/Slack summary.
5. Overdue branch: classify by tier (3 tiers, scanned daily: friendly nudge 1 to 7 days past due, firm reminder 8 to 30 days, final notice over 30 days). Draft one reminder per invoice per tier.
6. Check the reminder log (no duplicate for same invoice and tier) and re-check payment status just before sending (stop on payment).
7. "Send and Wait for Response" to the owner: approve / edit / skip. Only on approval is the message sent to the customer (demo: to a test address).
8. Log the outcome.
- Decision rules: one reminder per invoice per tier; a paid invoice drops out immediately; every customer-facing message needs human approval (no auto-send path).
- Edge cases: currency mix (report per currency or convert, TBD), time zone and due-date boundaries, partial payments, credit notes, missing customer email, source outage, approval never answered (timeout, then skip and log), duplicate runs.

## 6. AI / LLM step (if any)
- Task: optional short plain-English commentary on the weekly report (what changed, what to watch). Included (owner decision).
- Risk level and human-review rule: low if limited to aggregated numbers and shown only in the owner-facing report. Numbers come from the workflow, never computed by the model. Commentary is not added to anything sent to customers. Reminder text is template-based (no LLM) by default, which keeps the customer-facing path deterministic. Follows `playbooks/ai-guardrails.md`.
- Acceptable error rate: zero tolerance on figures (cross-checked); commentary checked against the numbers in QA.

## 7. Volume & cost
- Runs per month: demo only, about 4 weekly runs plus up to 30 daily overdue scans.
- Estimated executions per month: about 5 to 35 (sub-workflows add more). LLM cost per run: negligible if commentary is on (one short call per week), none if off.
- Where it runs: owner's self-hosted n8n (no per-run fee).

## 8. Failure handling
- Owner alerted in Slack/email from the shared error workflow with workflow name, failing node and execution link. Source or Gmail errors use Retry On Fail, then alert. Total mismatch stops the run and alerts. No reminder is ever sent when the check or approval fails.

## 9. Delivery
- Deadline: none · Budget: n/a (internal) · Delivered inactive; owner activates.
- Showcase outputs after QA: workflow JSON export, Upwork/Fiverr gig draft, social posts, website blurb, sample report image (synthetic).

## 10. Open questions
Decisions answered by the owner on 2026-10-28:
1. Accounting source: **Google Sheets stand-in**.
2. Report: **Google Sheet plus email and Slack summary** (totals, overdue, top customers, trend vs prior week). Recipients: owner's own address and a Slack channel.
3. Reminders: **3 tiers, daily scan**, every message approved by the owner.
4. AI commentary: **included**, aggregates only, owner-facing.
5. Loom walkthrough: **no** (not selected).
Still open (smaller, can be settled in design):
- Slack channel for the summary.
- Which LLM, if commentary is included, and who adds the key in n8n.
- Report currency: single currency demo or multi-currency?
- Which n8n edition and version is the instance running (see `docs/connect-n8n.md`)?

## Summary & readiness
A weekly schedule pulls invoices and sales from a demo accounting source, builds a report with totals, overdue amounts and top customers, checks the totals against the source, and sends a summary. A second branch finds overdue invoices, drafts tiered reminders, skips anything already reminded or already paid, and asks you to approve each message before it goes out. Everything uses synthetic data and is built inactive on your own n8n. **Ready for design? Yes, once you approve Gate 1.** The five main decisions are recorded above. The remaining small items (Slack channel, LLM and key, single or multi-currency, n8n version) can be settled in design.

**Gate 1 — Owner approval:** [x] approved on 2026-10-28
