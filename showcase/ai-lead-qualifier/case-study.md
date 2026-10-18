# Case study draft: AI Lead Qualifier

**Status: demo project.** Built on the owner's own n8n with synthetic data. Say "demo project" or "showcase build" everywhere this is shown. Do not call it a client result. Every number is either measured on a real run or labelled "estimate" with its assumptions beside it.

## Short version (about 150 words, for Upwork, LinkedIn and proposals)
Small teams sort web-form leads by hand, so hot leads wait and duplicates slip in. I built a demo automation in n8n that cleans each lead, blocks repeats, scores it against a fixed rubric with an AI, and routes it. Hot leads get a CRM record, a follow-up task and a Slack alert. Anything the AI is unsure about goes to a person. Every lead gets one log row that says why it was ranked that way. The AI has a daily cap, one repair try and a human fallback, so cost and quality stay under control. It is delivered inactive until you sign off. This is a demo project on synthetic data. Time from form to CRM: about 5 minutes by hand versus roughly 5 to 10 seconds automated (estimates, method below). Watch it run: [Flow Stage link]. Send me your form and CRM and I will tell you what I would automate first.

## Headline (pick one, keep it plain)
- "Every web-form lead scored, routed and in your CRM in under a minute, with a human check on anything unsure."
- "From a shared inbox nobody triages to a hot-lead alert in Slack."

## 1. The problem (about 60 words)
Small teams get leads from a web form and sort them by hand: read, guess who is serious, copy into the CRM, ping a colleague. Hot leads wait. Duplicates get entered twice. Nothing records why a lead was ranked the way it was.

## 2. Before and after

| | Before (manual) | After (this automation) | How measured (write this next to every number) |
|---|---|---|---|
| Who touches a lead | A person, every time | A person only for hot leads and for anything the AI is unsure about | Design fact, from the workflow |
| Time from form to CRM | About 5 minutes (estimate) | About 5 to 10 seconds (estimate) | Estimate. Before: 1 min to read, 1 min to judge, 2 min to enter in the CRM, 1 min to message a colleague. After: AI call about 2 to 4 s, CRM about 0.5 s, Slack about 0.5 s, the rest under 1 s. Replace with your own timed run and the real run times once credentials are connected. |
| Time from form to "hot lead" alert | Next time someone checks the inbox | About 5 to 10 seconds (estimate) | Estimate from the same step times. Confirm with a hot-lead test run. |
| Duplicates | Found by luck | Blocked for 24 hours by an email fingerprint | Test run on the instance (repeat submission) |
| Why a lead got its rank | In someone's head | One log row per lead: score, tier, reason, confidence, road taken | Design fact, from the data table |
| AI cost control | n/a | Daily cap of 25 AI calls, one repair try, then a human | Design fact. Worst case 2 AI calls per lead and 25 leads a day on the AI, which is at most 50 calls a day. |
| AI cost per scored lead | n/a | About 500 input and 60 output tokens per attempt (estimate), times your chosen model's price | Estimate from the length of the prompt. Multiply by the price of the model you choose. Confirm from the token count in a real run. |
| When something breaks | Unnoticed | The run is marked Failed on purpose and the owner is alerted | Test run of the failure path (needs credentials) |

Rows marked "design fact" describe how it is built. Rows marked "estimate" are reasoned figures with the assumptions written next to them. Always keep the word "estimate" beside them until you replace them with measured numbers.

**Measured so far (real runs on the showcase instance, synthetic data, manual mode):**
- Unusable lead: whole run took 0.26 s (execution 1). It stops after the log write, so this is the shortest path, not the typical one.
- Repeat submission: whole run took 0.18 s (execution 2). Also an early-stop path.
- These two prove the front half works. They are not the form-to-CRM time, which needs the AI, Slack and HubSpot connected.

**Example of the monthly saving (inputs are made up, replace them):** 100 leads a month × about 5 minutes by hand ≈ 8 hours a month. With the automation, a person only handles hot and unsure leads. Use the client's real lead count.

How to replace the estimates with measured numbers:
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

## 6. Results block
- Builder smoke tests: 2 of 2 passed (unusable lead, repeat submission). The independent QA test report is still to come, so do not call this "fully tested".
- Paths run for real: 2 of 9 scenarios. The other 7 need the AI model, Slack and HubSpot credentials.
- Run time on the two paths run: 0.26 s and 0.18 s (early-stop paths).
- AI cost per scored lead: estimate only, until a run with a real model gives a token count.

## 6b. Testimonial (leave empty until a real client gives one)
> [EMPTY: a quote from a real client, in their words, with their name and role and their written permission. Do not write one yourself. Do not publish this section while it is empty.]

## 7. What it would take for your business
Intake call, a one-page brief, a design you approve, a build you can watch, a test report, and a short handover. Timeline and price from the quote template in `playbooks/pricing-scoping.md`. State the delivery model (your n8n or theirs) and the support window in the quote.

## 8. Call to action
"Send me your form and CRM. I will tell you in one message what I would automate first."
