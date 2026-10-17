# App cards

One file per application the agent builds with, for example `hubspot.md`, `slack.md`, `anthropic.md`, `google-sheets.md`. An app card is the reference the connections specialist keeps current so every step that touches that app is built by someone who has read the facts.

## Rules
- A card contains only facts with a source (docs URL or a screen on the owner's instance) and the date checked. Everything else goes under UNVERIFIED.
- Cards are created when a design first uses an app, from `templates/step-card.md` plus these headings: Auth and scopes, Nodes and operations used, Fields and gotchas, Rate and size limits, Errors and retry advice, Data sent (PII), Test setup (sandbox account).
- A card is never copied from memory. If n8n's node docs and the app's own API docs disagree, note both.
- No credentials, tokens or customer data.

## Cards to create next (used by SHOW-001)
HubSpot, Slack, Anthropic. Facts already learned during the build are in `clients/showcase-ai-lead-qualifier/build-log.md` (for example the custom-property parameter name and task due date) and should be moved into these cards with their sources.
