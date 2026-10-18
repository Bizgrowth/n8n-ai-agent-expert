# Publishing the Flow Stage on a subdomain

**Live:** https://n8n.aiopsexpert.com (published 2026-10-18). Hosted on the aiopsexpert.com Hostinger plan in the folder `public_html/n8n`. The DNS record for `n8n` was created by Hostinger and points at its CDN; no existing record was changed. HTTPS is active with the redirect on.

**To update:** rebuild with `node visualizer/build.mjs`, then replace `public_html/n8n/index.html` (Hostinger file manager, or ask Claude to upload it).

**Note:** the name `n8n` is the usual name people give to a self-hosted n8n instance. If you later host n8n itself at `n8n.aiopsexpert.com`, move this page to another name first (for example `flow`).

The page is one static file: `visualizer/index.html` (about 100 KB). It needs no server code and no database. It loads two things from Google Fonts and falls back to system fonts if they are blocked.

Rebuild it any time with `node visualizer/build.mjs`. The build checks every scenario against the real workflow connections and refuses to write the page if one is wrong.

## Where it can go
aiopsexpert.com is registered and hosted at Hostinger. The main site and `www` point at Vercel. Other subdomains already in use: `notify`, `apps`, `agenthub`, `aicontentmultiplyr`, `clientimpactpro`, `aiopsworflow`. Choose a name that is not on that list, for example `flow.aiopsexpert.com`.

**Recommended: a Hostinger subdomain.** Same pattern as `notify.aiopsexpert.com`.
1. Create the subdomain under the aiopsexpert.com hosting plan.
2. Upload `index.html` to the subdomain's folder.
3. Make sure the DNS record for the subdomain points at the Hostinger server, then turn on SSL and the HTTPS redirect.
4. Open the address on a phone and a laptop and play two scenarios.

Do not touch the existing `@` and `www` records, the mail records (Titan MX, SPF, DKIM, DMARC) or the Resend records.

## After it is live
- Link it from the case study, the Upwork and Fiverr items, LinkedIn and the website.
- The page carries a title, description and share tags, so links preview cleanly.
- Everything on the page is synthetic. If you later add real execution data through "Replay a real run", anything pasted stays in the visitor's browser only, but do not show a real client's execution on a public page.
