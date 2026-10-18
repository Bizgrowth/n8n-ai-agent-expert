// Builds the n8n Flow Stage from the real workflow JSON.
// Usage: node visualizer/build.mjs [path-for-publishable-fragment.html]
// Writes: visualizer/index.html (standalone page) and visualizer/SOP.md.
// Fails if any scenario path uses a connection that does not exist in the workflow.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PHASES, NODE_INFO, SCENARIOS, SAMPLE_MIX, CATEGORIES } from './scenarios.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const wfPath = path.join(here, '..', 'clients', 'showcase-ai-lead-qualifier', 'workflows', 'showcase-ai-lead-qualifier.json');
const wf = JSON.parse(fs.readFileSync(wfPath, 'utf8'));

const KINDS = {
  'n8n-nodes-base.webhook': ['trigger', 'webhook', 'Webhook trigger'],
  'n8n-nodes-base.set': ['core', 'set', 'Edit Fields'],
  'n8n-nodes-base.noOp': ['core', 'noop', 'No operation'],
  'n8n-nodes-base.if': ['logic', 'if', 'IF'],
  'n8n-nodes-base.switch': ['logic', 'switch', 'Switch'],
  'n8n-nodes-base.dataTable': ['data', 'dataTable', 'Data table'],
  'n8n-nodes-base.aggregate': ['data', 'aggregate', 'Aggregate'],
  '@n8n/n8n-nodes-langchain.chainLlm': ['ai', 'chain', 'Basic LLM Chain'],
  '@n8n/n8n-nodes-langchain.lmChatAnthropic': ['ai', 'model', 'Chat model (sub-node)'],
  '@n8n/n8n-nodes-langchain.outputParserStructured': ['ai', 'parser', 'Structured output (sub-node)'],
  'n8n-nodes-base.slack': ['chat', 'slack', 'Slack'],
  'n8n-nodes-base.hubspot': ['crm', 'hubspot', 'HubSpot'],
  'n8n-nodes-base.stopAndError': ['stop', 'stop', 'Stop and Error'],
};

const nodes = [];
const byName = {};
for (const n of wf.nodes) {
  if (n.type === 'n8n-nodes-base.stickyNote') continue;
  const k = KINDS[n.type];
  if (!k) throw new Error('No icon/category for node type ' + n.type);
  const o = { id: n.name, x: n.position[0], y: n.position[1], cat: k[0], icon: k[1], kindLabel: k[2], type: n.type === 'n8n-nodes-base.stopAndError' ? 'stop' : 'node', onError: n.onError || '' };
  nodes.push(o); byName[n.name] = o;
}

const edges = [];
const switchKeys = {};
for (const n of wf.nodes) if (n.type === 'n8n-nodes-base.switch') {
  const keys = n.parameters.rules.values.map(v => v.outputKey);
  keys.push(n.parameters.options.renameFallbackOutput || 'fallback');
  switchKeys[n.name] = keys;
}
for (const [src, c] of Object.entries(wf.connections)) {
  const s = wf.nodes.find(n => n.name === src);
  for (const [type, outs] of Object.entries(c)) {
    outs.forEach((targets, idx) => targets.forEach(t => {
      if (type !== 'main') {
        byName[src].sub = true; byName[src].parent = t.node;
        edges.push({ id: `${src}>${t.node}#sub`, from: src, to: t.node, sub: true, kind: 'sub', label: '' });
        return;
      }
      let kind = 'main', label = '';
      if (s.type === 'n8n-nodes-base.if') { kind = idx === 0 ? 'true' : 'false'; label = kind; }
      else if (s.type === 'n8n-nodes-base.switch') { kind = 'case'; label = switchKeys[src][idx]; }
      else if (s.onError === 'continueErrorOutput' && idx === 1) { kind = 'error'; label = 'error'; }
      edges.push({ id: `${src}>${t.node}#${idx}`, from: src, to: t.node, kind, label, sub: false });
    }));
  }
}

// Checks
const problems = [];
const inPhase = new Set(PHASES.flatMap(p => p.nodes));
for (const n of nodes) {
  if (!NODE_INFO[n.id]) problems.push('No explanation for node: ' + n.id);
  if (!inPhase.has(n.id)) problems.push('Node not in any phase: ' + n.id);
}
for (const nm of inPhase) if (!byName[nm]) problems.push('Phase lists unknown node: ' + nm);
for (const sc of SCENARIOS) {
  sc.path.forEach((nm, i) => {
    if (!byName[nm]) problems.push(`${sc.id}: unknown node ${nm}`);
    const nx = sc.path[i + 1];
    if (nx && !edges.some(e => !e.sub && e.from === nm && e.to === nx)) problems.push(`${sc.id}: no connection ${nm} -> ${nx}`);
  });
  if (byName[sc.path[0]].cat !== 'trigger') problems.push(`${sc.id}: path does not start at the trigger`);
  for (const ph of Object.keys(sc.beats)) if (!PHASES.some(p => p.id === ph)) problems.push(`${sc.id}: unknown phase ${ph}`);
}
if (problems.length) { console.error(problems.join('\n')); process.exit(1); }

const data = { nodes, edges, phases: PHASES, info: NODE_INFO, scenarios: SCENARIOS, mix: SAMPLE_MIX, categories: CATEGORIES };
const json = JSON.stringify(data).replace(/</g, '\\u003c');
const fragment = fs.readFileSync(path.join(here, 'template.html'), 'utf8').replace('__DATA__', () => json);
const standalone = `<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n<style>html{color-scheme:dark}body{margin:0}[hidden]{display:none!important}</style>\n</head>\n<body>\n${fragment}\n</body>\n</html>\n`;
fs.writeFileSync(path.join(here, 'index.html'), standalone);
if (process.argv[2]) fs.writeFileSync(process.argv[2], fragment);

// SOP.md
const phaseOf = {}; PHASES.forEach(p => p.nodes.forEach(n => phaseOf[n] = p));
let md = `# n8n Flow Stage: phase SOP\n\nA teaching script for the Showcase AI Lead Qualifier. Each scenario below is a real road through the workflow in \`clients/showcase-ai-lead-qualifier/workflows/showcase-ai-lead-qualifier.json\`. The Flow Stage page (\`visualizer/index.html\`) animates the same roads. All lead data is synthetic.\n\nFrequency labels are planning labels for teaching order, not measurements.\n\n`;
md += `## How to run a teaching session\n\n1. Open the Flow Stage. Pick a scenario (the cards run from most to least common).\n2. Press Play. The page follows the lead node by node. Use Step to pause on a node and talk.\n3. Use the phase chips under the canvas to zoom to a phase.\n4. Open "Scenario SOP" for the talk track and "Runs and charts" for the totals and the time chart.\n5. To show a real run, paste an execution into "Replay a real run".\n\n`;
md += `## The eight phases\n\n| Phase | What happens | n8n idea | Say it like this |\n|---|---|---|---|\n`;
PHASES.forEach(p => { md += `| ${p.name} (${p.sub}) | ${p.what} | ${p.concept} | ${p.say} |\n`; });
md += `\n## Scenarios, most common first\n`;
const order = ['Most common', 'Common', 'Occasional', 'Rare'];
[...SCENARIOS].sort((a, b) => order.indexOf(a.freq) - order.indexOf(b.freq)).forEach(sc => {
  md += `\n### ${sc.title} (${sc.freq})\n\n${sc.blurb}\n\n- Ends as: ${sc.status === 'failed' ? 'Failed (on purpose)' : 'Success'}\n- AI calls used: ${sc.calls}\n- n8n ideas shown: ${sc.concepts.join(', ')}\n\n| Phase | What happens in this scenario |\n|---|---|\n`;
  const seen = [];
  sc.path.forEach(nm => { const p = phaseOf[nm]; if (p && !seen.includes(p.id)) seen.push(p.id); });
  seen.forEach(id => { const p = PHASES.find(x => x.id === id); md += `| ${p.name} | ${sc.beats[id] || p.what} |\n`; });
  md += `\nNodes in order: ${sc.path.join(' → ')}\n\nEvidence to open in n8n: ${sc.evidence}\n`;
});
md += `\n## Node cheat sheet\n\n| Node | Phase | What it does |\n|---|---|---|\n`;
nodes.forEach(n => { md += `| ${n.id} | ${phaseOf[n.id].name} | ${NODE_INFO[n.id]} |\n`; });
md += `\n## Notes\n\n- Timings in the page are illustrative, set by node type. They show where time goes, not measured speeds.\n- The sample history is synthetic. Runs you play add to the totals for the session only.\n- The icons are drawn for this tool. Official app icons can be swapped in by editing the ICONS table in \`visualizer/template.html\`.\n`;
fs.writeFileSync(path.join(here, 'SOP.md'), md);
console.log(`ok: ${nodes.length} nodes, ${edges.length} edges, ${SCENARIOS.length} scenarios, index.html ${Math.round(standalone.length / 1024)} KB`);
