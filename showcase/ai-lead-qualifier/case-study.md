# Case study draft: AI Lead Qualifier

**Status: demo project.** Built on the owner's own n8n with synthetic data. Say "demo project" or "showcase build" everywhere this is shown. Do not call it a client result. Every `[MEASURE]` field must be filled from a real test run before publishing, and any number that is a modeled estimate must say "estimate".

## Short version (about 150 words, for Upwork, LinkedIn and proposals)
Small teams sort web-form leads by hand, so hot leads wait and duplicates slip in. I built a demo automation in n8n that cleans each lead, blocks repeats, scores it against a fixed rubric with an AI, and routes it. Hot leads get a CRM record, a follow-up task and a Slack alert. Anything the AI is unsure about goes to a person. Every lead gets one log row that says why it was ranked that way. The AI has a daily cap, one repair try and a human fallback, so cost and quality stay under control. It is delivered inactive until you sign off. This is a demo project on synthetic data. Time from form to CRM: [MEASURE]. Watch it run: [Flow Stage link]. Send me your form and CRM and I will tell you what I would automate first.

## Headline (pick one, keep it plain)
- "Every web-form lead scored, routed and in your CRM in under a minute, with a human check on anything unsure."
- "From a shared inbox nobody triages to a hot-lead alert in Slack."

## 1. The problem (about 60 words)
Small teams get leads from a web form and sort them by hand: read, guess who is serious, copy into the CRM, ping a colleague. Hot leads wait. Duplicates get entered twice. Nothing records why a lead was ranked the way it was.

## 2. Before and after

| | Before (manual) | After (this automation) | How measured (write this next to every number) |
|---|---|---|---|
| Who touches a lead | A person, every time | A person only for hot leads and for anything the AI is unsure about | Design fact, from the workflow |
| Time from form to CRM | [MEASURE: minutes] | [MEASURE: seconds] | Before: your own timed manual run of 5 leads, averaged. After: average run time of the same 5 leads in the n8n Executions list. |
| Time from form to "hot lead" alert | Next time someone checks the inbox | [MEASURE: seconds] | Run time of a hot-lead test in Executions |
| Duplicates | Found by luck | Blocked for 24 hours by an email fingerprint | Test run on the instance (repeat submission) |
| Why a lead got its rank | In someone's head | One log row per lead: score, tier, reason, confidence, road taken | Design fact, from the data table |
| AI cost control | n/a | Daily cap of 25 AI calls, one repair try, then a human | Design fact; cost per lead: [MEASURE from the model price and the token count in a run] |
| When something breaks | Unnoticed | The run is marked Failed on purpose and the owner is alerted | Test run of the failure path (needs credentials) |

Rows marked "design fact" describe how it is built. Rows with [MEASURE] stay blank until you have a real number and its method. Do not publish a blank [MEASURE].

How to fill the MEASURE fields honestly:
1. Time yourself doing five leads by hand, with the same steps (read, judge, enter in the CRM, message a colleague). Average it.
2. Run the five synthetic leads through the workflow and read the run time of each in Executions.
3. Show both numbers and say how you measured them.
4. For "hours saved per month", write the formula, not just the answer: leads per month × minutes saved per lead. Use the client's own lead count, never an invented one.

## 3. What was built (about 100 words)
A form posts to a protected web address. The workflow cleans the fields, rejects unusable leads with a reason, and checks the email against the last 24 hours. It counts today's AI calls and skips the AI if the daily cap is reached. Otherwise an AI scores the lead against a fixed rubric and returns a structured answer, which seven checks validate, with one repair try. Low confidence goes to a human in Slack. Everything else is saved to the CRM, hot leads also get a task and an alert, and every lead gets a log row.

## 4. How it stays safe
- The AI sees only role, company size, budget, timeline, source and message. No name, email or company name.
- Lead text is treated as untrusted. It is fenced in tags and stripped of angle brackets.
- Text sent to Slack has links, mentions and markdown removed.
- Built inactive. Only the owner activates, after sign-off.
- Credentials live in n8n and are never in the workflow file.

## 5. Proof to show
- The Flow Stage animation: nine scenarios from "warm lead" to "CRM call fails" (link when published).
- A screenshot of the n8n canvas.
- One screenshot each of: a hot-lead Slack alert, the CRM contact with its AI fields, the log table.
- The test report from `test-report.md` once the QA tester has signed it off. Do not show a test report that has not been signed off.

## 6. Results block (fill after real tests)
- Test cases run: [MEASURE] of [MEASURE] passed.
- Paths covered: [MEASURE]/9 scenarios.
- Average run time: [MEASURE].
- AI cost per scored lead: [MEASURE: from your model's price and the token count in the run].

## 6b. Testimonial (leave empty until a real client gives one)
> [EMPTY: a quote from a real client, in their words, with their name and role and their written permission. Do not write one yourself. Do not publish this section while it is empty.]

## 7. What it would take for your business
Intake call, a one-page brief, a design you approve, a build you can watch, a test report, and a short handover. Timeline and price from the quote template in `playbooks/pricing-scoping.md`. State the delivery model (your n8n or theirs) and the support window in the quote.

## 8. Call to action
"Send me your form and CRM. I will tell you in one message what I would automate first."
