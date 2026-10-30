# n8n Flow Stage: phase SOP

A teaching script for the Showcase AI Lead Qualifier. Each scenario below is a real road through the workflow in `clients/showcase-ai-lead-qualifier/workflows/showcase-ai-lead-qualifier.json`. The Flow Stage page (`visualizer/index.html`) animates the same roads. All lead data is synthetic.

Frequency labels are planning labels for teaching order, not measurements.

## How to run a teaching session

1. Open the Flow Stage. Pick a scenario (the cards run from most to least common).
2. Press Play. The page follows the lead node by node. Use Step to pause on a node and talk.
3. Use the phase chips under the canvas to zoom to a phase.
4. Open "Scenario SOP" for the talk track and "Runs and charts" for the totals and the time chart.
5. To show a real run, paste an execution into "Replay a real run".

## The eight phases

| Phase | What happens | n8n idea | Say it like this |
|---|---|---|---|
| Start (Trigger and settings) | A webhook waits for a form post. Settings holds every rule in one place so nothing is buried in a node. | Trigger node, Edit Fields (Set) | Every n8n run starts with exactly one trigger. Here it is a web address that listens. The first thing I do after it is gather the rules into one Settings node so I can change a threshold without hunting. |
| Clean and check (Is this lead usable?) | Trim and shorten every field, check the email, company and consent, and reject anything unusable with a written reason. | Expressions, IF node, Data table | Data in n8n travels as items. This step shows expressions: the double curly braces that read and reshape fields. The IF node then splits the run into a true road and a false road. |
| Repeat check (Have we seen this email?) | Look up a one-way fingerprint of the email in the log for the last 24 hours. A repeat stops here. A new lead writes a short processing row to claim its spot. | Data table lookup, de-duplication | A data table is n8n's built-in spreadsheet. We use it as memory between runs, which is how a stateless workflow remembers who already came in. |
| Cost guard (Daily AI cap) | Count today's AI calls from the log. If the cap of 25 is reached, skip the AI and send the lead to a human. | Aggregate node, guardrail before an AI call | The cheapest AI call is the one you do not make. Before spending money I count how many calls were used today. The Aggregate node turns many rows into one item so a single check can count them. |
| AI scoring (Score, validate, repair once) | Send only the minimum fields to the model, force a JSON answer, then check it with seven rules. One repair try is allowed. After that a human decides. | AI chain with sub-nodes, structured output, validation | A chain is a fixed recipe: prompt in, answer out. The model and the answer format plug in underneath as sub-nodes. I never trust the answer. A checker node validates it, and a failed check gets exactly one repair attempt so the cost has a ceiling. |
| Route (Decide the road) | Low confidence goes to a human. Otherwise a Switch sends the lead down the hot, warm or cold road. Decision record builds one clean record for everything after it. | Switch node, branching, one record that later steps read | IF has two exits. Switch has as many as you need, plus a fallback for the unexpected. After routing, I merge everything into one Decision record so the rest of the workflow reads from a single source. |
| Act (Slack and HubSpot) | Post to Slack, save the contact to HubSpot (create or update by email), and for hot leads add a task and an alert. Each app call retries, and a failure takes its own road instead of killing the run. | App nodes, credentials, retries, error output | App nodes talk to real tools using credentials stored in n8n, never in the workflow. Each call can retry. If it still fails, its error output takes a side road, so one broken app does not lose the lead. |
| Record and finish (Log, then alert if needed) | Write one complete log row. If any side road was used, end the run as Failed on purpose so n8n's Executions list and the shared Error Workflow tell the owner. | Execution log, Stop and Error, Error Workflow | A run that quietly half-worked is the worst outcome. So we log everything first, then fail loudly if anything needed attention. That failure is what triggers the shared Error Workflow. |

## Scenarios, most common first

### Warm or cold lead (Most common)

A real lead that fits but is not urgent. It is scored, saved to HubSpot, and that is all. No task, no alert.

- Ends as: Success
- AI calls used: 1
- n8n ideas shown: Trigger, Expressions, IF, Data table, AI chain, Switch

| Phase | What happens in this scenario |
|---|---|
| Start | The form posts. The webhook answers "received" right away, so the visitor never waits for the AI. |
| Clean and check | Fields are cleaned. Email, company and consent all pass, so the IF takes its true road. |
| Repeat check | Nothing in the log for this email, so it is new. A processing row claims it. |
| Cost guard | Fewer than 25 AI calls today, so the AI is allowed. |
| AI scoring | The model returns score 55, tier warm, confidence 0.8. All seven checks pass on the first try. |
| Route | Confidence is above 0.7. The Switch sends it down the warm road. |
| Act | No review message needed. HubSpot saves the contact. It is not hot, so no task and no alert. |
| Record and finish | One log row is written. No side road was used, so the run ends as a success. |

Nodes in order: Receive lead → Settings → Clean the lead → Is the lead usable? → Seen this email recently? → Is it a repeat? → Claim this lead → Count today's AI calls → Combine today's rows → Daily AI limit reached? → Prepare AI input → AI score, attempt 1 → Check AI answer 1 → Accept answer 1 → Confident enough? → Route by tier → Mark: warm → Decision record → Needs a review message first? → Create or update contact → Is it a hot lead? → Log decision → Did any step fail along the way? → All steps succeeded

Evidence to open in n8n: Executions list: status Success. Open it and click Create or update contact to show the saved fields. In the data table, one scored row.

### Hot lead (Common)

A strong lead: senior, budgeted, urgent. It gets a HubSpot contact, a follow-up task, and a Slack alert.

- Ends as: Success
- AI calls used: 1
- n8n ideas shown: Switch, App nodes, Credentials, Retries

| Phase | What happens in this scenario |
|---|---|
| Start | Same start as every lead. One trigger, one Settings node. |
| Clean and check | Clean and validate. This lead passes. |
| Repeat check | New email, so the repeat check lets it through. |
| Cost guard | Under the daily cap. |
| AI scoring | Score 82, tier hot, confidence 0.88. The tier matches the score, so the check passes. |
| Route | Confident, so the Switch takes the hot road. |
| Act | HubSpot saves the contact. Hot means two extra steps: a task due next business day and a Slack alert with a link to the contact. |
| Record and finish | Logged, no side road used, run ends as a success. |

Nodes in order: Receive lead → Settings → Clean the lead → Is the lead usable? → Seen this email recently? → Is it a repeat? → Claim this lead → Count today's AI calls → Combine today's rows → Daily AI limit reached? → Prepare AI input → AI score, attempt 1 → Check AI answer 1 → Accept answer 1 → Confident enough? → Route by tier → Mark: hot → Decision record → Needs a review message first? → Create or update contact → Is it a hot lead? → Got a HubSpot contact ID? → Create follow-up task → Slack: hot lead alert → Log decision → Did any step fail along the way? → All steps succeeded

Evidence to open in n8n: Executions: Success. Click Slack: hot lead alert to see the message text. In HubSpot, the contact with the DEMO tag and the task.

### Unusable lead rejected (Common)

A bad email, no company, or no consent. It is rejected at the front door with a reason. The AI is never called.

- Ends as: Success
- AI calls used: 0
- n8n ideas shown: IF, False branch, Data table, Cheap exits first

| Phase | What happens in this scenario |
|---|---|
| Start | The form still posts and the webhook still answers "received". |
| Clean and check | The email is not an email and consent is missing. The IF takes its false road and the reason is written to the log. The run ends here. |

Nodes in order: Receive lead → Settings → Clean the lead → Is the lead usable? → Log rejected lead

Evidence to open in n8n: Executions: Success (a reject is a normal outcome). Data table: one row, status rejected, with the reason. Also run for real in manual mode on the showcase instance (execution 1, synthetic data).

### Repeat submission (Occasional)

The same person submits twice within 24 hours. The second one is logged as a duplicate and stops.

- Ends as: Success
- AI calls used: 0
- n8n ideas shown: Data table lookup, De-duplication, Stateless to stateful

| Phase | What happens in this scenario |
|---|---|
| Start | Second post from the same person, 40 seconds after the first. |
| Clean and check | Still a valid lead, so it passes the cleaning step. |
| Repeat check | The log already has this email fingerprint from the last 24 hours. The IF takes its true road to Log duplicate. No AI, no CRM, no Slack. |

Nodes in order: Receive lead → Settings → Clean the lead → Is the lead usable? → Seen this email recently? → Is it a repeat? → Log duplicate

Evidence to open in n8n: Data table: the processing row from the first run, plus a duplicate row from this one. Also run for real in manual mode on the showcase instance (execution 2) against a seeded synthetic row.

### AI is not confident (Occasional)

The lead is vague, so the AI answers with low confidence. A human gets a Slack message, and the lead is still saved.

- Ends as: Success
- AI calls used: 1
- n8n ideas shown: Human in the loop, Confidence threshold, Guardrails

| Phase | What happens in this scenario |
|---|---|
| Start | A short, vague message arrives. |
| Clean and check | Valid email, company and consent. It passes. |
| Repeat check | New email. |
| Cost guard | Under the cap. |
| AI scoring | The answer is well-formed, so validation passes. But confidence is only 0.42. |
| Route | Below 0.7, so the Switch is skipped. The lead is marked for human review. |
| Act | A plain Slack message asks for a human look, then HubSpot still saves the contact. It is not hot, so no task. |
| Record and finish | Logged, run ends as a success. |

Nodes in order: Receive lead → Settings → Clean the lead → Is the lead usable? → Seen this email recently? → Is it a repeat? → Claim this lead → Count today's AI calls → Combine today's rows → Daily AI limit reached? → Prepare AI input → AI score, attempt 1 → Check AI answer 1 → Accept answer 1 → Confident enough? → Mark: low confidence or odd tier → Decision record → Needs a review message first? → Slack: needs your review → Create or update contact → Is it a hot lead? → Log decision → Did any step fail along the way? → All steps succeeded

Evidence to open in n8n: Slack review channel: the flagged message with "Low confidence or unexpected tier". Data table: status review.

### AI answer fixed on the second try (Rare)

The first AI answer breaks a rule: the tier does not match the score. One repair attempt returns a valid answer.

- Ends as: Success
- AI calls used: 2
- n8n ideas shown: Validate AI output, One repair try, Cost ceiling

| Phase | What happens in this scenario |
|---|---|
| Start | A normal lead arrives. |
| Clean and check | Passes. |
| Repeat check | New. |
| Cost guard | Under the cap. |
| AI scoring | Attempt 1 says score 75 but tier warm. Score 75 is hot territory, so the checker sends it to the repair attempt. Attempt 2 returns score 48, tier warm, which passes. Two AI calls are counted. |
| Route | Confident, so the Switch takes the warm road. |
| Act | HubSpot saves. Not hot, so nothing else. |
| Record and finish | Logged with ai_calls_used 2, run ends as a success. |

Nodes in order: Receive lead → Settings → Clean the lead → Is the lead usable? → Seen this email recently? → Is it a repeat? → Claim this lead → Count today's AI calls → Combine today's rows → Daily AI limit reached? → Prepare AI input → AI score, attempt 1 → Check AI answer 1 → AI score, attempt 2 (repair) → Check AI answer 2 → Accept answer 2 → Confident enough? → Route by tier → Mark: warm → Decision record → Needs a review message first? → Create or update contact → Is it a hot lead? → Log decision → Did any step fail along the way? → All steps succeeded

Evidence to open in n8n: Executions: Success. Open AI score, attempt 1 and Check AI answer 1 to see the bad answer, then attempt 2.

### AI answer unusable twice (Rare)

Both AI attempts break the rules. The system stops trying and asks a human, instead of guessing.

- Ends as: Success
- AI calls used: 2
- n8n ideas shown: Fail safe, Hard cost ceiling, Human fallback

| Phase | What happens in this scenario |
|---|---|
| Start | A normal lead arrives. |
| Clean and check | Passes. |
| Repeat check | New. |
| Cost guard | Under the cap. |
| AI scoring | Attempt 1 returns chatty text instead of JSON. Attempt 2 returns a tier of "maybe", which is not allowed. After two failures the run stops spending money. |
| Route | The lead is marked invalid AI answer and goes straight toward human review. |
| Act | A Slack review message goes out and HubSpot still saves the contact. |
| Record and finish | Logged with two AI calls used. The run is a success because the system handled it as designed. |

Nodes in order: Receive lead → Settings → Clean the lead → Is the lead usable? → Seen this email recently? → Is it a repeat? → Claim this lead → Count today's AI calls → Combine today's rows → Daily AI limit reached? → Prepare AI input → AI score, attempt 1 → Check AI answer 1 → AI score, attempt 2 (repair) → Check AI answer 2 → Mark: invalid AI answer → Decision record → Needs a review message first? → Slack: needs your review → Create or update contact → Is it a hot lead? → Log decision → Did any step fail along the way? → All steps succeeded

Evidence to open in n8n: Slack review message with "AI answer invalid or the AI call failed". Data table: decision_path review-invalid.

### Daily AI cap reached (Rare)

The AI has already been used 25 times today. New leads skip the AI and go to a human, so a spike cannot run up the bill.

- Ends as: Success
- AI calls used: 0
- n8n ideas shown: Cost guard, Aggregate, Graceful degradation

| Phase | What happens in this scenario |
|---|---|
| Start | A lead arrives on a busy day. |
| Clean and check | Passes. |
| Repeat check | New. |
| Cost guard | The count reads 25 of 25. The IF takes its true road. The AI is skipped entirely. |
| Route | The lead is marked review-cap. |
| Act | A Slack message says the AI limit was reached, and HubSpot still saves the lead so nothing is lost. |
| Record and finish | Logged with zero AI calls, run ends as a success. |

Nodes in order: Receive lead → Settings → Clean the lead → Is the lead usable? → Seen this email recently? → Is it a repeat? → Claim this lead → Count today's AI calls → Combine today's rows → Daily AI limit reached? → Mark: AI limit reached → Decision record → Needs a review message first? → Slack: needs your review → Create or update contact → Is it a hot lead? → Log decision → Did any step fail along the way? → All steps succeeded

Evidence to open in n8n: Slack: "Daily AI limit reached; saved without AI scoring". Data table: status cap_reached.

### HubSpot save fails (Rare)

HubSpot rejects the call after retries. The owner is told in Slack, the lead is logged, and the run ends as Failed on purpose.

- Ends as: Failed (on purpose)
- AI calls used: 1
- n8n ideas shown: Retry on fail, Error output, Stop and Error, Error Workflow, Executions list

| Phase | What happens in this scenario |
|---|---|
| Start | A strong lead arrives. |
| Clean and check | Passes. |
| Repeat check | New. |
| Cost guard | Under the cap. |
| AI scoring | Valid answer, score 80. |
| Route | Hot road. |
| Act | The HubSpot call fails and retries three times. Its error output opens a side road: a Slack message tells the owner the contact was NOT saved and what to do by hand. |
| Record and finish | The lead is still logged. Then Stop and Error ends the run as Failed. That red mark in Executions is what triggers the shared Error Workflow. |

Nodes in order: Receive lead → Settings → Clean the lead → Is the lead usable? → Seen this email recently? → Is it a repeat? → Claim this lead → Count today's AI calls → Combine today's rows → Daily AI limit reached? → Prepare AI input → AI score, attempt 1 → Check AI answer 1 → Accept answer 1 → Confident enough? → Route by tier → Mark: hot → Decision record → Needs a review message first? → Create or update contact → Slack: HubSpot save failed → Log decision → Did any step fail along the way? → Alert owner: a step needs attention

Evidence to open in n8n: Executions list: status Error (red). Open it: the failing node is Create or update contact. Slack: the "NOT saved in HubSpot" message.

## Node cheat sheet

| Node | Phase | What it does |
|---|---|---|
| Receive lead | Start | Webhook. A web address that waits for a form post and starts the run. Protected by a secret header. |
| Settings | Start | Edit Fields node holding every rule: score cut-offs, daily cap, channel IDs, the AI instructions. |
| Clean the lead | Clean and check | Trims, lowercases and shortens each field, checks consent, and makes a one-way fingerprint of the email. |
| Is the lead usable? | Clean and check | IF node. True when the email looks real, a company is present and consent is true. |
| Log rejected lead | Clean and check | Data table insert. Writes a rejected row with the reason. Its error output goes to a harmless no-op. |
| Ignore log failure | Clean and check | No-operation node. If a log write fails, do nothing so the demo never breaks. |
| Seen this email recently? | Repeat check | Data table lookup for the same email fingerprint in the last 24 hours. |
| Is it a repeat? | Repeat check | IF node. Double-checks the row found is really this email and really recent. |
| Claim this lead | Repeat check | Data table insert. Writes a short processing row before the AI call so a fast second submit is caught. |
| Log duplicate | Repeat check | Data table insert. Writes a duplicate row. The run ends here: no AI, no CRM. |
| Count today's AI calls | Cost guard | Data table lookup of today's rows that used the AI. |
| Combine today's rows | Cost guard | Aggregate node. Packs many rows into one item so one check can count them. |
| Daily AI limit reached? | Cost guard | IF node. True when today's AI calls have reached the cap of 25. |
| Prepare AI input | AI scoring | Edit Fields. Builds the prompt text from the minimum fields. No name, email or company is sent to the model. |
| AI score, attempt 1 | AI scoring | Basic LLM Chain. Sends the rubric and the lead text to the model and expects a JSON answer. |
| Chat model 1 | AI scoring | Sub-node. The language model plugged into the chain. Swappable for another provider. |
| Answer format 1 | AI scoring | Sub-node. Structured output parser that asks for score, tier, reason and confidence. |
| Check AI answer 1 | AI scoring | IF node with seven rules: object, score 0 to 100, valid tier, tier matches score, confidence 0 to 1, short reason, no extra fields. |
| AI score, attempt 2 (repair) | AI scoring | Basic LLM Chain. The one allowed repair try with a stricter reminder. No retry after this. |
| Chat model 2 | AI scoring | Sub-node. The model for the repair attempt. |
| Answer format 2 | AI scoring | Sub-node. Same answer format for the repair attempt. |
| Check AI answer 2 | AI scoring | IF node. The same seven rules, applied to the repair answer. |
| Accept answer 1 | AI scoring | Edit Fields. Copies the validated answer into the ai_ fields and records one AI call used. |
| Accept answer 2 | AI scoring | Edit Fields. Copies the repaired answer into the ai_ fields and records two AI calls used. |
| Confident enough? | Route | IF node. A confidence below 0.7 sends the lead to a human instead. |
| Route by tier | Route | Switch node. Separate roads for hot, warm and cold, plus a fallback for anything unexpected. |
| Mark: hot | Route | Edit Fields. Stamps the decision path auto-hot. |
| Mark: warm | Route | Edit Fields. Stamps the decision path auto-warm. |
| Mark: cold | Route | Edit Fields. Stamps the decision path auto-cold. |
| Mark: low confidence or odd tier | Route | Edit Fields. Stamps this lead for human review. |
| Mark: invalid AI answer | AI scoring | Edit Fields. Stamps this lead for human review because the AI answer failed both checks. |
| Mark: AI limit reached | Cost guard | Edit Fields. Stamps this lead as sent to human review because of the cap. |
| Decision record | Route | Edit Fields. Builds the single record every later step reads. Text going to Slack is stripped of links, mentions and markdown. |
| Needs a review message first? | Act | IF node. Anything not cleanly scored gets a Slack review post first. |
| Slack: needs your review | Act | Slack node. Posts a plain review message with the AI's draft and why it was flagged. |
| Create or update contact | Act | HubSpot node. Upsert by email, so no duplicate contacts. Tagged DEMO. |
| Slack: HubSpot save failed | Act | Slack node. Tells the owner that HubSpot did not save the contact after retries. |
| Is it a hot lead? | Act | IF node. Only hot leads get a follow-up task and a hot alert. |
| Create follow-up task | Act | HubSpot node. A call task due the next business day at 09:00. |
| Slack: hot lead alert | Act | Slack node. Posts the hot-lead alert with score, reason and a HubSpot link. |
| Log decision | Record and finish | Data table insert. One complete row per lead: score, road taken, and whether Slack and HubSpot worked. |
| Note: review Slack failed | Act | Edit Fields. Remembers that Slack failed so the run can warn at the end but still save the lead. |
| Note: Slack failed | Act | Edit Fields. Remembers that a Slack post failed. |
| Note: task not created | Act | Edit Fields. Remembers the task failed so the Slack alert can say so. |
| Got a HubSpot contact ID? | Act | IF node. A task needs a contact to attach to. |
| Did any step fail along the way? | Record and finish | IF node. Looks back at the Note nodes to see whether any side road was used. |
| Alert owner: a step needs attention | Record and finish | Stop and Error node. Ends the run as Failed on purpose so the shared Error Workflow alerts the owner. |
| All steps succeeded | Record and finish | No-operation node. The normal end of the run. |

## Notes

- Timings in the page are illustrative, set by node type. They show where time goes, not measured speeds.
- The sample history is synthetic. Runs you play add to the totals for the session only.
- The icons are drawn for this tool. Official app icons can be swapped in by editing the ICONS table in `visualizer/template.html`.
