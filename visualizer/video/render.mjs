// Renders the 30-second Flow Stage explainer as numbered JPEG frames.
// Usage: node visualizer/video/render.mjs <path-to-global-node_modules> <empty-frames-folder> [maxSeconds]
// Then encode: ffmpeg -framerate 25 -i <frames>/%05d.jpg -c:v libx264 -preset veryfast -crf 20 -pix_fmt yuv420p out.mp4
// The page's own clock is driven frame by frame, so the animation is smooth and repeatable.
import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';
const require = createRequire(import.meta.url);
const { chromium } = require(path.join(process.argv[2], 'playwright'));
const OUT = process.argv[3];
const FPS = 25, SECONDS = Number(process.argv[4] || 30), TOTAL = SECONDS * FPS;
const here = path.dirname(fileURLToPath(import.meta.url));
const PAGE = 'file://' + path.join(here, '..', 'index.html');

// Timeline in seconds
const T = { introFadeStart: 3.6, introFadeEnd: 4.4, hotStart: 3.8, hsStart: 17.8, outroStart: 25.6, outroEnd: 26.4 };

// Captions follow the phase the page is showing. [headline, subline]
const HOT = {
  'Start': ['A protected web address starts the run', 'One trigger, one Settings node'],
  'Clean and check': ['Clean it. Reject anything unusable.', 'Bad email or no consent stops here'],
  'Repeat check': ['Block repeats for 24 hours', 'A data table is the memory'],
  'Cost guard': ["Check today's AI budget", 'Daily cap: 25 AI calls'],
  'AI scoring': ['An AI scores it. Seven checks validate the answer.', 'One repair try, then a human'],
  'Route': ['Route it: hot, warm, cold or a human', 'Low confidence goes to a person'],
  'Act': ['Hot leads go to your CRM and Slack', 'Contact, follow-up task, alert'],
  'Record and finish': ['Every lead is logged', 'Score, reason, road taken'],
};
const FAIL = {
  'Start': ['When something breaks...', 'Same lead, but the CRM call fails'],
  'Clean and check': ['When something breaks...', 'Same lead, but the CRM call fails'],
  'Repeat check': ['When something breaks...', 'Same lead, but the CRM call fails'],
  'Cost guard': ['When something breaks...', 'Same lead, but the CRM call fails'],
  'AI scoring': ['When something breaks...', 'Same lead, but the CRM call fails'],
  'Route': ['When something breaks...', 'Same lead, but the CRM call fails'],
  'Act': ['The CRM call fails. A side road alerts you.', 'The lead is not lost'],
  'Record and finish': ['The run fails loudly. You are told.', 'Ended as Failed on purpose'],
};

const clamp = (x) => Math.max(0, Math.min(1, x));
function cards(t) {
  const intro = t < T.introFadeStart ? 1 : clamp(1 - (t - T.introFadeStart) / (T.introFadeEnd - T.introFadeStart));
  const outro = clamp((t - T.outroStart) / (T.outroEnd - T.outroStart));
  return { intro, outro };
}

const browser = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1.5, colorScheme: 'dark' });
const page = await ctx.newPage();
page.on('pageerror', (e) => console.log('pageerror', e.message));
await page.clock.install({ time: 0 });
await page.goto(PAGE);
await page.evaluate(() => document.fonts.ready);
await page.clock.pauseAt(2000);

// Overlay and clean-up
await page.evaluate(() => {
  const css = `
  #vo{--u:calc(100vw / 1920);position:fixed;inset:0;pointer-events:none;z-index:99999;font-family:'Bricolage Grotesque','Segoe UI',system-ui,sans-serif;color:#fff}
  #vbar{position:absolute;left:0;top:0;height:calc(6 * var(--u));width:0;background:#ffb454}
  #vtag{position:absolute;right:calc(26 * var(--u));top:calc(16 * var(--u));padding:calc(7 * var(--u)) calc(14 * var(--u));border-radius:calc(999 * var(--u));background:rgba(8,12,22,.85);border:calc(1 * var(--u)) solid #3a4a6b;font:600 calc(17 * var(--u)) 'IBM Plex Sans',system-ui,sans-serif;letter-spacing:.04em;color:#c9d4ea}
  #vcap{position:absolute;left:50%;bottom:calc(34 * var(--u));transform:translateX(-50%);max-width:calc(1560 * var(--u));min-width:calc(760 * var(--u));padding:calc(20 * var(--u)) calc(36 * var(--u));border-radius:calc(18 * var(--u));background:rgba(8,12,22,.9);border:calc(1 * var(--u)) solid #3a4a6b;text-align:center;opacity:0}
  #vcap1{font-size:calc(44 * var(--u));font-weight:700;line-height:1.15}
  #vcap2{margin-top:calc(6 * var(--u));font:500 calc(25 * var(--u)) 'IBM Plex Sans',system-ui,sans-serif;color:#aab8d6}
  .vcard{position:absolute;inset:0;background:#0d1320;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:calc(22 * var(--u));opacity:0;padding:0 calc(120 * var(--u))}
  .vcard .k{font:600 calc(24 * var(--u)) 'IBM Plex Sans',system-ui,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#4fd6c6}
  .vcard .h{font-size:calc(92 * var(--u));font-weight:700;line-height:1.05;letter-spacing:-.01em;max-width:calc(1500 * var(--u))}
  .vcard .s{font:500 calc(36 * var(--u))/1.35 'IBM Plex Sans',system-ui,sans-serif;color:#aab8d6;max-width:calc(1300 * var(--u))}
  .vcard .u{font-size:calc(84 * var(--u));font-weight:700;color:#ffb454}
  .vcard .d{font:500 calc(24 * var(--u)) 'IBM Plex Sans',system-ui,sans-serif;color:#7f8fb0;margin-top:calc(14 * var(--u))}`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  const vo = document.createElement('div'); vo.id = 'vo';
  vo.innerHTML = '<div id="vbar"></div><div id="vtag">DEMO PROJECT · SYNTHETIC DATA</div>' +
    '<div id="vcap"><div id="vcap1"></div><div id="vcap2"></div></div>' +
    '<div class="vcard" id="vintro"><div class="k">n8n Flow Stage</div><div class="h">A web-form lead arrives.</div><div class="s">By hand, someone reads it, guesses, and types it into the CRM.</div></div>' +
    '<div class="vcard" id="voutro"><div class="k">See every step run</div><div class="u">n8n.aiopsexpert.com</div><div class="s">Nine scenarios. Real workflow. Sample data.</div><div class="d">Demo project · synthetic data</div></div>';
  document.body.appendChild(vo);
  // hide the real page's theme button so only footage and captions show
  const tb = document.getElementById('themebtn'); if (tb) tb.style.visibility = 'hidden';
  // hide the sample counters so they are not read as real results
  const kp = document.getElementById('kpis'); if (kp) kp.style.visibility = 'hidden';
  window.__setSpeed = (v) => { const s = document.getElementById('speed'); s.value = v; s.dispatchEvent(new Event('change', { bubbles: true })); };
  window.__scn = (id) => document.querySelector('.scn[data-s="' + id + '"]').click();
});

const started = { hot: false, hs: false };
const t0 = Date.now();
for (let f = 0; f < TOTAL; f++) {
  const t = f / FPS;
  if (!started.hot && t >= T.hotStart) { await page.evaluate(() => { window.__setSpeed('2'); window.__scn('hot'); }); started.hot = true; }
  if (!started.hs && t >= T.hsStart) { await page.evaluate(() => { window.__setSpeed('4'); window.__scn('hsfail'); }); started.hs = true; }
  await page.clock.runFor(1000 / FPS);
  const cap = await page.evaluate(() => document.getElementById('capstep').textContent);
  const parts = cap.split('·').map((s) => s.trim());
  const phase = parts[1] || '', scen = parts[2] || '';
  let line = null;
  if (t >= T.hotStart + 0.2 && t < T.outroStart + 0.4) {
    const table = (started.hs && /HubSpot save fails/i.test(scen)) ? FAIL : HOT;
    line = table[phase] || null;
    if (t >= T.hsStart - 0.6 && !started.hs && false) line = null;
  }
  const { intro, outro } = cards(t);
  await page.evaluate(([prog, l1, l2, a, b]) => {
    document.getElementById('vbar').style.width = (prog * 100) + '%';
    const c = document.getElementById('vcap');
    if (l1) { document.getElementById('vcap1').textContent = l1; document.getElementById('vcap2').textContent = l2; c.style.opacity = '1'; } else c.style.opacity = '0';
    document.getElementById('vintro').style.opacity = String(a);
    document.getElementById('voutro').style.opacity = String(b);
    document.getElementById('vcap').style.display = (a > 0.5 || b > 0.5) ? 'none' : 'block';
  }, [t / SECONDS, line ? line[0] : '', line ? line[1] : '', intro, outro]);
  await page.screenshot({ path: path.join(OUT, String(f).padStart(5, '0') + '.jpg'), type: 'jpeg', quality: 90 });
  if (f % 50 === 0) console.log(`frame ${f}/${TOTAL}  t=${t.toFixed(1)}s  phase="${phase}"  elapsed=${Math.round((Date.now() - t0) / 1000)}s`);
}
await browser.close();
console.log('done', TOTAL, 'frames');
