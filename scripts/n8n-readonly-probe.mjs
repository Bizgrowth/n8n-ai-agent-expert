#!/usr/bin/env node
// Read-only n8n probe. Sends GET requests only. Never changes anything in n8n.
// Reads N8N_BASE_URL (for example https://your-n8n.example.com) and N8N_API_KEY from the environment.
// The key is never printed. Usage: node scripts/n8n-readonly-probe.mjs [client-folder] [report.md]
// With a client folder, it checks that each workflow file in <folder>/workflows exists in n8n by exact name,
// and reports whether it is active.

import { readFileSync, readdirSync, existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const base = (process.env.N8N_BASE_URL || '').replace(/\/+$/, '');
const key = process.env.N8N_API_KEY;
if (!base || !key) {
  console.error('Set N8N_BASE_URL and N8N_API_KEY in the environment first. Never paste the key into chat.');
  process.exit(2);
}
const [clientDir, reportPath] = process.argv.slice(2);

// GET only: the method is fixed here on purpose.
async function get(path) {
  try {
    const res = await fetch(`${base}/api/v1${path}`, { method: 'GET', headers: { 'X-N8N-API-KEY': key, accept: 'application/json' } });
    const text = await res.text();
    let body = null;
    try { body = JSON.parse(text); } catch { /* not JSON */ }
    return { status: res.status, body };
  } catch (e) {
    return { status: 0, error: e.cause?.code || e.message };
  }
}
const list = (r) => (Array.isArray(r.body?.data) ? r.body.data : Array.isArray(r.body) ? r.body : []);
const lines = [];
const out = (s = '') => { lines.push(s); console.log(s); };

out('# n8n read-only probe');
out(`Instance: ${base}  (key not shown)  ·  ${new Date().toISOString()}`);
out('');

const wf = await get('/workflows?limit=250');
out('## Workflows');
if (wf.status !== 200) out(`Could not read workflows (HTTP ${wf.status}${wf.error ? ', ' + wf.error : ''}). Check the base address, the key and its scopes.`);
const workflows = list(wf);
workflows.forEach((w) => out(`- ${w.name}  ·  id ${w.id}  ·  ${w.active ? 'ACTIVE' : 'inactive'}  ·  ${Array.isArray(w.nodes) ? w.nodes.length + ' nodes' : 'nodes not listed'}`));
if (wf.body?.nextCursor) out('- (more workflows exist; only the first page was read)');

if (clientDir && existsSync(join(clientDir, 'workflows'))) {
  out('');
  out(`## Import check against ${clientDir}/workflows`);
  for (const f of readdirSync(join(clientDir, 'workflows')).filter((x) => x.endsWith('.json'))) {
    const expected = JSON.parse(readFileSync(join(clientDir, 'workflows', f), 'utf8')).name;
    const found = workflows.filter((w) => w.name === expected);
    const state = found.length === 0 ? 'NOT FOUND in n8n' : found.length > 1 ? `FOUND ${found.length} times (duplicate imports)` : found[0].active ? 'found but ACTIVE (should be inactive before sign-off)' : 'found, inactive';
    out(`- ${f}: "${expected}" -> ${state}`);
  }
}

const ex = await get('/executions?limit=20');
out('');
out('## Latest executions (status only, no data)');
if (ex.status !== 200) out(`Could not read executions (HTTP ${ex.status}${ex.error ? ', ' + ex.error : ''}).`);
const byId = new Map(workflows.map((w) => [String(w.id), w.name]));
list(ex).forEach((e) => out(`- #${e.id}  ·  ${byId.get(String(e.workflowId)) || 'workflow ' + e.workflowId}  ·  ${e.status ?? (e.finished ? 'success' : 'unknown')}  ·  ${e.mode ?? ''}  ·  ${e.startedAt ?? ''}`));

for (const [title, path, show] of [
  ['Tags', '/tags', (t) => t.name],
  ['Variables (key names only, values never read)', '/variables', (v) => v.key],
  ['Projects', '/projects', (p) => `${p.name} (${p.type ?? 'project'})`],
]) {
  const r = await get(path);
  out('');
  out(`## ${title}`);
  if (r.status !== 200) { out(`Not available (HTTP ${r.status}${r.error ? ', ' + r.error : ''}). May need a different scope, plan or n8n version.`); continue; }
  const items = list(r);
  out(items.length ? items.map((i) => `- ${show(i)}`).join('\n') : '- none');
}

if (reportPath) writeFileSync(reportPath, lines.join('\n') + '\n');
