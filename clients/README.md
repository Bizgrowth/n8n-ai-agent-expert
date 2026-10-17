# Clients

One folder per client: `clients/<client-slug>/` containing `brief.md`, `design.md`, `build-log.md`, `review.md`, `test-report.md`, `process-doc.md` (and `loom-script.md` if requested), plus `workflows/` with the importable workflow JSON.

Rules:
- Slug is lowercase-with-dashes; no personal data in folder names.
- Store anonymized samples only. Never commit credentials, API keys, webhook secrets, `pinData` or real customer records.
- Workflow files must pass `node scripts/lint-workflow.mjs <file>` before Gate 2.

## Owner's n8n instance notes (fill in)
- n8n edition / projects available: TBD (see `docs/connect-n8n.md`, Step 1)
- Instance on HTTPS with a domain: **No** (as of 2026-10-17; Sandbox/Showcase only until fixed)
- n8n version: TBD
