# 30-second explainer: n8n Flow Stage

Hand-off brief for the Video creation project. Everything here is true of the built workflow. Nothing invented.

## Source code (pick one)
| Option | Where | Use it for |
|---|---|---|
| Live page | https://n8n.aiopsexpert.com | Record the real page with Playwright |
| One-file page | `visualizer/index.html` in the repo (Bizgrowth/n8n-ai-agent-expert, branch `claude/affectionate-johnson-ls9jvq`), about 112 KB, fonts load from Google Fonts | Offline capture, or copy into the video project |
| Source parts | `visualizer/template.html` (page), `visualizer/scenarios.mjs` (scenarios, narration lines, node text), `visualizer/build.mjs` (build and checks) | Reuse the scenario data and node text as on-screen copy |

Rebuild: `node visualizer/build.mjs`. It checks every scenario against the real workflow connections.

## Voiceover (about 80 words, about 28 to 30 seconds)
1. (0:00 to 0:05) "A web-form lead arrives. Normally, a person reads it, guesses, and types it into the CRM."
2. (0:05 to 0:12) "Here, an n8n workflow cleans it, blocks repeats, and has an AI score it against a fixed rubric."
3. (0:12 to 0:20) "Seven checks validate the answer. One repair try, a daily cost cap, and a human fallback keep it safe."
4. (0:20 to 0:27) "Hot leads go straight to Slack and your CRM. If something breaks, the run fails loudly and you're told."
5. (0:27 to 0:30) "Watch it run: n8n dot aiopsexpert dot com."

Spoken pace for planning: about 2.6 to 2.9 words per second. If the voice runs long, cut "Normally," and "Here,".

## Scene plan and what to show
| Scene | Screen | Real source |
|---|---|---|
| 1 Problem, 0 to 5 s | A form card drops in, then a person icon and a CRM icon with a slow arrow. Burst: "by hand" | Concept only; no numbers |
| 2 Approach, 5 to 12 s | Flow Stage canvas, zoomed to phases 2 to 5. Token travels Receive lead, Clean the lead, Is it a repeat?, AI score | Scenario "Hot lead", Flow Stage nodes |
| 3 Safety, 12 to 20 s | Zoom to the AI sub-nodes (Chat model, Answer format, Check AI answer), then the cap gauge filling toward 25 | Phase 5 and the Cost guard phase; cap is 25 AI calls a day; checker has 7 rules |
| 4 Result, 20 to 27 s | Hot road: Create or update contact, Create follow-up task, Slack: hot lead alert. Then a quick cut to the failure scenario ending on the red Stop and Error node | Scenarios "Hot lead" and "HubSpot fails" |
| 5 Ask, 27 to 30 s | Logo area and "n8n.aiopsexpert.com". Small caption: "Demo on synthetic data" | Required label, see below |

## Facts you may show
- 48 nodes, 9 scenarios, 8 phases.
- Daily AI cap: 25 calls. One repair try. Answer checker: 7 rules.
- Repeat check window: 24 hours.
- Hot leads get a CRM contact, a follow-up task and a Slack alert.
- Delivered inactive until the owner signs off.
- Two scenarios were run for real on the showcase instance (unusable lead 0.26 s, repeat submission 0.18 s). Both stop early, so do not present them as the form-to-CRM time.

## Do not show or say
- Any time-saved, cost or conversion number. The form-to-CRM time and cost per lead are labelled estimates in the case study and are not measurements.
- Client names, logos or quotes. There is no client yet.
- "Fully tested". Only 2 of 9 paths have run for real; the independent QA report is still to come.
- Any real email, token or channel name.

## Required label on screen
"Demo project, synthetic data" on at least the last scene.

## Look and feel
The Flow Stage uses its own dark palette (navy background, amber accent, cyan and pink node colors). The video project's brand file (`docs/brand_aiopsexpert.md`: cyan for operations, purple for AI, amber for risk only) should win for the intro and outro scenes. Keep the Flow Stage node colors inside the canvas so the footage still matches the real page. Official app logos are not used; the node icons are drawn for the tool.

## If you record the live page with Playwright
Stable hooks in the page:
- Scenario buttons: `.scn[data-s="hot"]`, also `warm`, `reject`, `dup`, `lowconf`, `repair`, `invalid`, `cap`, `hsfail`. Clicking one starts it playing.
- Speed: `#speed` (values 0.5, 1, 2, 4). Play/pause: `#play`. Scrub: `#scrub` (0 to 1000).
- Phase buttons under the canvas: `.pchip[data-p="p1"]` to `p8`.
- Zoom: `#zin`, `#zout`, `#zfit`. Follow mode keeps the camera on the active node.
- Tabs: `#tabs button[data-tab="now|sop|runs|replay|clients"]`.
- A run lasts about 25 to 27 seconds at 1x. For a 30-second video, record at 2x to 4x and cut, or use the Step button.
- Viewport 1920 x 1080 gives the most readable nodes. Wait for `document.fonts.ready` before the first frame.

## Voice
The skill `video-voice-sync` generates narration in the cloned ElevenLabs voice and retimes scenes to the real audio. Run it after the scenes exist, then adjust scene lengths to the audio.
