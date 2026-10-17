#!/usr/bin/env node
// Builds a single-file, read-only "Workflow Explorer" page from the exported
// workflow JSON files of one client folder. Re-run it whenever the workflows change.
// Usage: node scripts/build-explorer.mjs <client-folder> <output.html>
// Example: node scripts/build-explorer.mjs clients/showcase-ai-lead-qualifier /tmp/explorer.html
// Reads only local files. Nothing is sent anywhere. Credentials appear by NAME only.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const [clientDir, outFile] = process.argv.slice(2);
if (!clientDir || !outFile) {
  console.error('Usage: node scripts/build-explorer.mjs <client-folder> <output.html>');
  process.exit(2);
}
const here = dirname(fileURLToPath(import.meta.url));
const read = (p) => JSON.parse(readFileSync(p, 'utf8'));

const WORKFLOWS = [
  { key: 'main', tab: 'Lead qualifier', file: 'workflows/showcase-ai-lead-qualifier.json' },
  { key: 'alert', tab: 'Error alert', file: 'workflows/shared-error-alert.json' },
];

// Plain-English descriptions for non-technical readers, keyed by node name.
const DESC = {
  'Receive lead': 'Front door. Accepts a lead sent by your web form and checks the secret header. Replies "received" straight away.',
  'Settings': 'One control panel for the rules: AI confidence threshold, tier cutoffs, daily cap, message length and Slack channels.',
  'Clean the lead': 'Tidies the form data: trims text, lowercases the email, cuts the message to the length limit, adds a lead ID and a duplicate-check key.',
  'Is the lead usable?': 'Stops leads with no valid email, no company or no consent before any money is spent.',
  'Log rejected lead': 'Records why a lead was rejected (the reason only, no email or message).',
  'Ignore log failure': 'If writing the rejection log fails, the run ends quietly here.',
  'Seen this email recently?': 'Looks in the log for the same email in the last 24 hours.',
  'Is it a repeat?': 'Decides whether this lead is a repeat within 24 hours.',
  'Claim this lead': 'Writes a "processing" row before the AI call so a quick second submission is spotted.',
  'Log duplicate': 'Records the repeat and ends the run. No AI call, no second alert.',
  "Count today's AI calls": 'Counts how many leads the AI has already scored today.',
  "Combine today's rows": 'Packs those rows into one list so they can be counted.',
  'Daily AI limit reached?': "Compares today's count with the daily cap to limit AI spend.",
  'Prepare AI input': 'Builds the minimum text for the AI: role, company size, budget, timeline, source and the message. No name, email or phone.',
  'AI score, attempt 1': 'Asks the AI to score the lead against the rubric and answer in a fixed format.',
  'Chat model 1': 'The AI model behind attempt 1. Claude by default, swappable.',
  'Answer format 1': 'Forces the answer into score, tier, reason and confidence.',
  'Check AI answer 1': 'Seven checks on the answer: right format, score 0 to 100, allowed tier, tier matches score, confidence 0 to 1, short reason present.',
  'AI score, attempt 2 (repair)': 'One repair attempt if the first answer was invalid or the call failed.',
  'Chat model 2': 'The AI model behind the repair attempt.',
  'Answer format 2': 'Same fixed answer format for the repair attempt.',
  'Check AI answer 2': 'The same seven checks on the repair answer. If it fails, the lead goes to review.',
  'Accept answer 1': 'Keeps the validated answer from attempt 1.',
  'Accept answer 2': 'Keeps the validated answer from the repair attempt.',
  'Confident enough?': 'Sends the lead to human review if the AI confidence is below the threshold.',
  'Route by tier': 'Sends hot, warm and cold leads down their own path. Anything unexpected goes to review.',
  'Mark: hot': 'Labels the decision "auto-hot".',
  'Mark: warm': 'Labels the decision "auto-warm".',
  'Mark: cold': 'Labels the decision "auto-cold".',
  'Mark: low confidence or odd tier': 'Labels the lead for human review (low confidence or an unexpected tier).',
  'Mark: invalid AI answer': 'Labels the lead for human review because both AI attempts failed the checks.',
  'Mark: AI limit reached': 'Labels the lead for review because the daily cap was hit. No AI call was made.',
  'Decision record': 'Gathers the final facts about this lead for the log row.',
  'Needs a review message first?': 'Checks whether this lead needs a Slack review message.',
  'Slack: needs your review': 'Posts a review message: lead ID, company, role, the AI draft and why it was flagged. No email or raw message.',
  'Create or update contact': 'Saves the lead in HubSpot (creates or updates by email) with the DEMO tag and AI fields.',
  'Slack: HubSpot save failed': 'Tells you in Slack if HubSpot could not save the lead, so a lead is never lost.',
  'Is it a hot lead?': 'Hot leads get a task and an alert. Others stop here.',
  'Create follow-up task': 'Creates the HubSpot task "Call hot lead", due the next business day at 09:00.',
  'Slack: hot lead alert': 'Pings Slack with company, role, score and a cleaned reason.',
  'Log decision': 'Writes the final log row (the second row for this lead).',
  'Note: review Slack failed': 'Records that the review message failed so the run can finish and still be flagged.',
  'Note: Slack failed': 'Records that the hot-lead alert failed so the run can finish and still be flagged.',
  'Note: task not created': 'Records that the HubSpot task was not created.',
  'Got a HubSpot contact ID?': 'Checks the HubSpot save worked before creating a task.',
  'Did any step fail along the way?': 'Final check. If anything failed, the run ends as failed so the error alert fires.',
  'Alert owner: a step needs attention': 'Deliberately fails the run with a short message (no lead data) so the error workflow alerts you.',
  'All steps succeeded': 'Normal end of a clean run.',
  'Workflow failed': 'Starts whenever another workflow that points at this one fails.',
  'Prepare alert text': 'Builds a short alert: workflow name, failing step, link to the run, first line of the error. No lead data.',
  'Slack: tell the owner': 'Posts the alert to your Slack alert channel.',
};

const SERVICE = {
  httpHeaderAuth: { type: 'Header Auth', service: 'Your web form to n8n (webhook password)' },
  hubspotAppToken: { type: 'HubSpot service key / app token', service: 'HubSpot' },
  slackApi: { type: 'Slack access token', service: 'Slack' },
  anthropicApi: { type: 'Anthropic API key', service: 'Anthropic (Claude)' },
};

const shortType = (t) => t.replace('n8n-nodes-base.', '').replace('@n8n/n8n-nodes-langchain.', '');
const isSub = (n) => /langchain\.(lmChat|outputParser|embeddings|memory|tool)/.test(n.type);
function category(n) {
  const t = shortType(n.type);
  if (t === 'webhook' || /trigger$/i.test(t)) return 'trigger';
  if (/^(chainLlm|agent|lmChat|outputParser)/.test(t)) return 'ai';
  if (['slack', 'hubspot'].includes(t)) return 'service';
  if (t === 'dataTable') return 'log';
  if (['if', 'switch'].includes(t)) return 'check';
  if (['noOp', 'stopAndError'].includes(t)) return 'end';
  return 'prep';
}
const KIND = {
  webhook: 'Webhook', set: 'Edit fields', if: 'Yes/no check', switch: 'Router', dataTable: 'Data table',
  aggregate: 'Combine', noOp: 'End', stopAndError: 'Stop and alert', slack: 'Slack', hubspot: 'HubSpot',
  chainLlm: 'AI chain', lmChatAnthropic: 'AI model', outputParserStructured: 'Answer format',
  errorTrigger: 'Error trigger', stickyNote: 'Note',
};

function buildWorkflow(def) {
  const wf = read(join(clientDir, def.file));
  const byName = new Map(wf.nodes.map((n) => [n.name, n]));
  const real = wf.nodes.filter((n) => n.type !== 'n8n-nodes-base.stickyNote');
  const main = real.filter((n) => !isSub(n));
  const subs = {};
  const edges = [];
  for (const [from, outs] of Object.entries(wf.connections)) {
    for (const [kind, lists] of Object.entries(outs)) {
      lists.forEach((list, idx) => (list || []).forEach((c) => {
        if (kind === 'main') edges.push({ from, to: c.node, idx });
        else (subs[c.node] ||= []).push(from);
      }));
    }
  }
  // longest-path layering
  const incoming = new Map(main.map((n) => [n.name, []]));
  edges.forEach((e) => incoming.get(e.to)?.push(e.from));
  const layer = new Map();
  const visiting = new Set();
  const depth = (name) => {
    if (layer.has(name)) return layer.get(name);
    if (visiting.has(name)) return 0;
    visiting.add(name);
    const d = Math.max(-1, ...incoming.get(name).map(depth)) + 1;
    visiting.delete(name);
    layer.set(name, d);
    return d;
  };
  main.forEach((n) => depth(n.name));
  const cols = {};
  main.forEach((n) => (cols[layer.get(n.name)] ||= []).push(n.name));

  const outLabels = (n, idx) => {
    const t = shortType(n.type);
    if (t === 'if') return idx === 0 ? 'yes' : 'no';
    if (t === 'switch') {
      const rules = n.parameters?.rules?.values || [];
      if (idx < rules.length) return rules[idx].outputKey || `rule ${idx + 1}`;
      return 'other';
    }
    if (n.onError === 'continueErrorOutput' && idx === 1) return 'error';
    return '';
  };
  const nodes = main.map((n) => {
    const err = n.onError === 'continueErrorOutput' ? 'Continues on an error output' : n.onError === 'stopWorkflow' ? 'Stops the run on error' : n.onError ? n.onError : 'Default';
    const creds = Object.entries(n.credentials || {}).map(([type, c]) => ({ type, name: c.name }));
    const subList = (subs[n.name] || []).map((s) => ({ name: s, desc: DESC[s] || '', unverified: /UNVERIFIED/.test(byName.get(s)?.notes || '') }));
    return {
      name: n.name, type: shortType(n.type), typeVersion: n.typeVersion, cat: category(n),
      kind: KIND[shortType(n.type)] || shortType(n.type), desc: DESC[n.name] || '',
      credentials: creds, onError: err,
      retry: n.retryOnFail ? { tries: n.maxTries ?? null, wait: n.waitBetweenTries ?? null } : null,
      unverified: /UNVERIFIED/.test(n.notes || '') || subList.some((s) => s.unverified),
      note: (n.notes || '').trim(), subs: subList,
      layer: layer.get(n.name), row: cols[layer.get(n.name)].indexOf(n.name),
      next: edges.filter((e) => e.from === n.name).map((e) => e.to),
      prev: edges.filter((e) => e.to === n.name).map((e) => e.from),
    };
  });
  const outE = edges.map((e) => {
    const n = byName.get(e.from);
    const label = outLabels(n, e.idx);
    return { from: e.from, to: e.to, label, error: label === 'error' };
  });
  const webhook = wf.nodes.find((n) => n.type === 'n8n-nodes-base.webhook');
  const settingsNode = byName.get('Settings');
  return {
    key: def.key, tab: def.tab, name: wf.name, active: wf.active === true, settings: wf.settings || {},
    nodeCount: wf.nodes.length, nodes, edges: outE, maxRows: Math.max(...Object.values(cols).map((c) => c.length)),
    layers: Math.max(...Object.keys(cols).map(Number)) + 1,
    trigger: webhook ? {
      kind: 'Webhook', method: webhook.parameters?.httpMethod, path: webhook.parameters?.path,
      auth: webhook.parameters?.authentication, respond: webhook.parameters?.responseMode,
      credential: Object.values(webhook.credentials || {})[0]?.name,
    } : { kind: 'Error Trigger', note: 'Runs when a workflow that names this one as its Error Workflow fails.' },
    configValues: settingsNode ? settingsNode.parameters.assignments.assignments
      .filter((a) => a.name !== 'system_prompt').map((a) => ({ name: a.name, value: String(a.value) })) : [],
    raw: wf,
  };
}

const workflows = WORKFLOWS.filter((d) => existsSync(join(clientDir, d.file))).map(buildWorkflow);
const main = workflows.find((w) => w.key === 'main');

// placeholders
const placeholders = {};
for (const w of workflows) {
  const scan = (v, node) => {
    if (typeof v === 'string') (v.match(/PLACEHOLDER_[A-Z_]+/g) || []).forEach((t) => {
      const e = (placeholders[t] ||= { token: t, where: new Set() });
      e.where.add(`${w.key === 'main' ? 'Qualifier' : 'Alert'}: ${node || 'Workflow settings'}`);
    });
    else if (Array.isArray(v)) v.forEach((x) => scan(x, node));
    else if (v && typeof v === 'object') Object.values(v).forEach((x) => scan(x, node));
  };
  w.raw.nodes.forEach((n) => scan(n.parameters, n.name));
  scan(w.raw.settings, null);
}
const placeholderList = Object.values(placeholders).map((p) => ({ token: p.token, where: [...p.where] })).sort((a, b) => a.token.localeCompare(b.token));

// credentials
const credMap = {};
for (const w of workflows) for (const n of w.nodes) for (const c of n.credentials) {
  const e = (credMap[c.name] ||= { name: c.name, type: c.type, ...SERVICE[c.type], nodes: [] });
  e.nodes.push(`${w.key === 'main' ? 'Qualifier' : 'Alert'}: ${n.name}`);
}
for (const n of main.nodes) for (const s of n.subs) {
  const sub = main.raw.nodes.find((x) => x.name === s.name);
  for (const [type, c] of Object.entries(sub?.credentials || {})) {
    const e = (credMap[c.name] ||= { name: c.name, type, ...SERVICE[type], nodes: [] });
    e.nodes.push(`Qualifier: ${s.name}`);
  }
}

// fields
const clean = main.raw.nodes.find((n) => n.name === 'Clean the lead');
const incoming = clean.parameters.assignments.assignments.map((a) => {
  const m = String(a.value).match(/\$json\.body\?\.(\w+)|\.json\.body\?\.(\w+)|body\?\.(\w+)/);
  const v = String(a.value);
  const how = [];
  if (/trim\(\)/.test(v)) how.push('trimmed');
  if (/toLowerCase\(\)/.test(v)) how.push('lowercased');
  const sl = v.match(/slice\(0,\s*(\d+)\)/);
  if (sl) how.push(`cut to ${sl[1]} characters`);
  return { name: a.name, form: m ? (m[1] || m[2] || m[3]) : '', how: how.join(', ') || (m ? 'copied' : 'generated'), expression: v };
});
let logColumns = [], hubspot = [];
const logPath = join(clientDir, 'build-log.md');
if (existsSync(logPath)) {
  const log = readFileSync(logPath, 'utf8');
  const l3 = log.split('\n').find((l) => /create the data table/i.test(l)) || '';
  logColumns = [...l3.matchAll(/`(\w+)` (text|date|number)/g)].map((m) => ({ name: m[1], type: m[2] }));
  const l4 = log.split('\n').find((l) => /In HubSpot, create contact properties/i.test(l)) || '';
  hubspot = [...new Set([...l4.matchAll(/`(\w+)`/g)].map((m) => m[1]).filter((x) => /^(demo_record|ai_\w+)$/.test(x)))];
}
const aiSchema = [
  { name: 'score', type: 'whole number', rule: '0 to 100' },
  { name: 'tier', type: 'text', rule: 'hot, warm or cold; must match the score (hot 70+, warm 40 to 69, cold below 40)' },
  { name: 'reason', type: 'text', rule: '1 to 300 characters, plain text' },
  { name: 'confidence', type: 'number', rule: '0 to 1; below the threshold goes to human review' },
];

const data = {
  generated: new Date().toISOString().slice(0, 10),
  status: {
    asOf: '2026-10-17',
    stages: [
      { name: 'Brief', state: 'done', note: 'Gate 1 approved' },
      { name: 'Design', state: 'done', note: 'Gate 1b approved' },
      { name: 'Build', state: 'done', note: 'Built, revised once' },
      { name: 'Review', state: 'done', note: 'Round 2: approved for testing' },
      { name: 'Test', state: 'active', note: 'Smoke test passed (owner-reported). 21 cases not verified, case 21 skipped.' },
      { name: 'Handoff', state: 'todo', note: 'After Gate 2' },
    ],
  },
  workflows: workflows.map(({ raw, ...w }) => w),
  placeholders: placeholderList,
  credentials: Object.values(credMap),
  fields: { incoming, aiSchema, logColumns, hubspot },
  unverifiedTotal: workflows.flatMap((w) => w.raw.nodes).filter((n) => /UNVERIFIED/.test(n.notes || '')).length,
  unverified: workflows.flatMap((w) => w.nodes.filter((n) => n.unverified).map((n) => ({ wf: w.key, name: n.name, note: n.note }))),
};

const tpl = readFileSync(join(here, 'explorer-template.html'), 'utf8');
// escape "</" so the data cannot close the script tag
const json = JSON.stringify(data).replace(/</g, '\\u003c');
writeFileSync(outFile, tpl.replace('/*__DATA__*/null', json));
console.log(`Wrote ${outFile}: ${workflows.map((w) => `${w.name} (${w.nodes.length} drawn nodes)`).join('; ')}; ${placeholderList.length} placeholders; ${data.unverifiedTotal} unverified nodes (${data.unverified.length} steps on the map).`);
