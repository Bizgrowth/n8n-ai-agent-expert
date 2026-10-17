#!/usr/bin/env node
// Checks an exported n8n workflow JSON against the mechanical rules in
// playbooks/n8n-best-practices.md. No installs needed (Node 18+).
// Usage: node scripts/lint-workflow.mjs <workflow.json> [more.json ...]
// Exit code 1 if any [must] rule fails, so a failed check blocks Gate 2.

import { readFileSync } from 'node:fs';

const NAME_PATTERN = /^.+ \| .+ \| .+ → .+ \| v\d+$/;

const DEFAULT_NODE_NAME = /^(HTTP Request|Edit Fields|Set|IF|Switch|Code|Merge|Filter|Loop Over Items|Wait|Webhook|Schedule Trigger|Slack|Gmail|HubSpot|Google Sheets|AI Agent|Basic LLM Chain)\d*$/;

const SECRET_PATTERNS = [
  [/sk-[A-Za-z0-9_-]{20,}/, 'looks like an OpenAI/Anthropic-style API key'],
  [/Bearer\s+[A-Za-z0-9._~+/-]{20,}/, 'contains a Bearer token'],
  [/xox[abprs]-[A-Za-z0-9-]{10,}/, 'looks like a Slack token'],
  [/AKIA[0-9A-Z]{16}/, 'looks like an AWS access key'],
  [/ghp_[A-Za-z0-9]{30,}/, 'looks like a GitHub token'],
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----/, 'contains a private key'],
];

// Node types that only move or shape data and never call an outside service.
const LOCAL_NODES = new Set([
  'set', 'if', 'switch', 'merge', 'filter', 'code', 'noOp', 'stickyNote',
  'splitInBatches', 'splitOut', 'aggregate', 'removeDuplicates', 'sort', 'limit',
  'summarize', 'dateTime', 'wait', 'stopAndError', 'executeWorkflow',
  'respondToWebhook', 'manualTrigger', 'convertToFile', 'extractFromFile',
  'itemLists', 'crypto', 'compareDatasets', 'renameKeys',
]);

const AI_ROOT_NODE = /@n8n\/n8n-nodes-langchain\.(agent|chainLlm|chainSummarization|informationExtractor|textClassifier|sentimentAnalysis)$/;

const shortType = (t = '') => t.split('.').pop();
const isTrigger = (n) => /trigger$/i.test(n.type || '') || n.type === 'n8n-nodes-base.webhook';
const isAiSubNode = (n) => /@n8n\/n8n-nodes-langchain\./.test(n.type || '') && !AI_ROOT_NODE.test(n.type || '');

function callsExternalService(node) {
  if (isTrigger(node) || isAiSubNode(node)) return false;
  if (AI_ROOT_NODE.test(node.type || '')) return true;
  if (node.type === 'n8n-nodes-base.httpRequest') return true;
  if (node.credentials && Object.keys(node.credentials).length) return true;
  return !LOCAL_NODES.has(shortType(node.type));
}

function walkStrings(value, path, visit) {
  if (typeof value === 'string') visit(value, path);
  else if (Array.isArray(value)) value.forEach((v, i) => walkStrings(v, `${path}[${i}]`, visit));
  else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) walkStrings(v, path ? `${path}.${k}` : k, visit);
  }
}

function lint(wf) {
  const results = []; // { level: 'must' | 'warn', ok, rule, detail }
  const add = (level, ok, rule, detail = '') => results.push({ level, ok, rule, detail });
  const nodes = Array.isArray(wf.nodes) ? wf.nodes : [];

  add('must', wf.active !== true, 'Workflow is inactive', 'active is true: only the owner activates, after sign-off');

  add('must', NAME_PATTERN.test(wf.name || ''), 'Name follows "<CLIENT> | <Process> | <Trigger> → <Outcome> | vN"', `found: "${wf.name || ''}"`);

  const isErrorHandler = nodes.some((n) => n.type === 'n8n-nodes-base.errorTrigger');
  add('must', isErrorHandler || Boolean(wf.settings?.errorWorkflow), 'Error Workflow is set (or this is the error handler)', 'set Settings → Error Workflow to the shared alert workflow');

  const pin = wf.pinData && Object.keys(wf.pinData).length;
  add('must', !pin, 'No pinData (test data) saved in the file', `pinData present on: ${pin ? Object.keys(wf.pinData).join(', ') : ''}`);

  const secretHits = [];
  walkStrings({ nodes, settings: wf.settings, staticData: wf.staticData }, '', (s, p) => {
    for (const [re, why] of SECRET_PATTERNS) if (re.test(s)) secretHits.push(`${p}: ${why}`);
  });
  add('must', secretHits.length === 0, 'No secrets in node parameters or notes', secretHits.join('; '));

  const unsafe = nodes.filter((n) => callsExternalService(n) && !n.retryOnFail && !['continueErrorOutput', 'continueRegularOutput'].includes(n.onError));
  add('must', unsafe.length === 0, 'Every external-call node sets Retry On Fail or On Error', `missing on: ${unsafe.map((n) => n.name).join(', ')}`);

  const defaults = nodes.filter((n) => n.type !== 'n8n-nodes-base.stickyNote' && DEFAULT_NODE_NAME.test(n.name || ''));
  add('warn', defaults.length === 0, 'Nodes have plain-English names', `default names: ${defaults.map((n) => n.name).join(', ')}`);

  add('warn', nodes.some((n) => n.type === 'n8n-nodes-base.stickyNote'), 'A sticky note documents purpose, owner, trigger', 'add one on the canvas');

  const openHooks = nodes.filter((n) => n.type === 'n8n-nodes-base.webhook' && (!n.parameters?.authentication || n.parameters.authentication === 'none'));
  add('warn', openHooks.length === 0, 'Webhooks use authentication', `no auth on: ${openHooks.map((n) => n.name).join(', ')}`);

  const code = nodes.filter((n) => n.type === 'n8n-nodes-base.code');
  add('warn', code.length === 0, 'No Code nodes (or each one is justified)', `Code nodes: ${code.map((n) => n.name).join(', ')}`);

  add('warn', Boolean(wf.settings?.timezone), 'Workflow time zone is set', 'Settings → Timezone');
  add('warn', Boolean(wf.settings?.executionTimeout) && wf.settings.executionTimeout > 0, 'Workflow timeout is set', 'Settings → Timeout Workflow');
  add('warn', wf.settings?.saveDataErrorExecution !== 'none', 'Failed executions are saved', 'Settings → Save failed production executions');

  return results;
}

let failed = false;
const files = process.argv.slice(2);
if (!files.length) {
  console.error('Usage: node scripts/lint-workflow.mjs <workflow.json> [more.json ...]');
  process.exit(2);
}

for (const file of files) {
  let wf;
  try {
    wf = JSON.parse(readFileSync(file, 'utf8'));
  } catch (e) {
    console.error(`\n${file}\n  ERROR: cannot read as JSON (${e.message})`);
    failed = true;
    continue;
  }
  const results = lint(wf);
  const mustFails = results.filter((r) => r.level === 'must' && !r.ok);
  const warns = results.filter((r) => r.level === 'warn' && !r.ok);
  console.log(`\n${file}`);
  for (const r of results) {
    const mark = r.ok ? 'PASS' : r.level === 'must' ? 'FAIL' : 'WARN';
    console.log(`  [${mark}] ${r.level === 'must' ? '[must] ' : ''}${r.rule}${r.ok || !r.detail ? '' : `\n         → ${r.detail}`}`);
  }
  console.log(`  Result: ${mustFails.length ? 'BLOCKED' : 'OK'} — ${mustFails.length} must-fix, ${warns.length} warning(s)`);
  if (mustFails.length) failed = true;
}
process.exit(failed ? 1 : 0);
