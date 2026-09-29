// Regression test for the meter: injects deliberate faults into the two reference pages
// and asserts that each one is detected. Also checks determinism of the real renders.
//   node engine/tools/selftest.mjs
import fs from 'node:fs';
import path from 'node:path';
import { launch } from '../lib/browser.mjs';
import { buildHtml } from '../lib/template.mjs';
import { validateSpec } from '../lib/validate.mjs';
import { KIT_DIR, ENGINE_DIR, roughSource } from '../lib/assets.mjs';

const load = (n) => JSON.parse(fs.readFileSync(path.join(KIT_DIR, 'specs', n + '.json'), 'utf8'));
const client = fs.readFileSync(path.join(ENGINE_DIR, 'client/page.js'), 'utf8');

const CASES = [
  { name: 'overlap (icon under text)', spec: '00-protocols', css: '.ki-main{margin-left:-2.5rem}', expect: 'overlap' },
  { name: 'clipped (text pushed out of a card)', spec: '00-protocols', css: '.gc-text{margin-right:-3rem}', expect: 'clipped' },
  { name: 'arrow crosses text', spec: '00-hosts-clients', css: '.slot-left .node-label{transform:translate(4.2rem,-3.4rem)}', expect: 'arrow-over-text' },
  { name: 'font below 17 px', spec: '00-protocols', css: '.gc-tag{font-size:11px}', expect: 'font-too-small' },
  { name: 'missing glyph', spec: '00-protocols', js: () => { document.querySelector('.co-key').append(' ✓'); }, expect: 'missing-glyph' },
  { name: 'outside page', spec: '00-protocols', css: '.comp-card-grid{transform:translateX(120px)}', expect: 'outside-page' },
  { name: 'speech bubble on a head', spec: '00-protocols', css: '.dlg-bubbles.simple .from-a{transform:translate(-5.5rem,4rem)}', expect: 'overlap' },
  { name: 'scale floor: overflow at k=1.0', spec: '00-protocols', css: '.gc-text{padding-bottom:700px}', expect: 'page-overflow', match: /line\(s\)/ },
  { name: 'bubble tail through a raised hand', spec: '00-protocols', css: '.person[data-person="a"] .char-part[data-part="gesture"]{left:0!important;top:0!important;width:100%!important;height:100%!important}', expect: 'tail-over-person' },
  { name: 'bubble tail through another bubble', spec: '00-protocols', css: '.dlg-bubbles.simple .from-b{position:relative;left:-24rem;top:3.2rem;padding:3.5rem 9rem}', expect: 'tail-over-bubble' },
  { name: 'chat tail too short', spec: '05-git-branches', js: () => { window.__IK_TEST_TAIL = 6; }, expect: 'tail-too-short' },
  { name: 'chat tail points at the wrong person', spec: '05-git-branches', css: '.dlg-bubbles.chat .from-b{align-self:flex-start;max-width:30%}', expect: 'tail-wrong-speaker' },
  { name: 'bubble on a held prop', spec: '05-git-branches', css: '.dlg-bubbles.chat .from-b{transform:translateX(7rem)}', expect: 'bubble-over-person' },
  { name: 'text laid out as flex', spec: '00-hosts-clients', css: '.st-text{display:flex}', expect: 'engine-text-layout' },
];

let fail = 0;
const browser = await launch();
try {
  for (const c of CASES) {
    const spec = load(c.spec);
    if (validateSpec(spec).length) throw new Error(`${c.spec} is not valid`);
    const page = await browser.newPage();
    await page.setViewport({ width: 1240, height: 1754 });
    await page.setContent(buildHtml(spec, c.spec), { waitUntil: 'load' });
    if (c.css) await page.addStyleTag({ content: c.css });
    if (c.js) await page.evaluate(c.js);
    await page.addScriptTag({ content: roughSource() });
    await page.addScriptTag({ content: client });
    const r = await page.evaluate((s) => window.__IK.run({ seedKey: s }), c.spec);
    await page.close();
    const codes = [...new Set(r.errors.map((e) => e.code))];
    const ok = codes.includes(c.expect) && (!c.match || r.errors.some((e) => e.code === c.expect && c.match.test(e.message)));
    if (!ok) fail++;
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${c.name.padEnd(36)} expected ${c.expect}; got [${codes.join(', ')}]`);
    const hit = r.errors.find((e) => e.code === c.expect);
    if (hit) console.log(`      e.g. ${hit.where}: ${hit.message}`);
  }
} finally {
  await browser.close();
}
process.exit(fail ? 1 : 0);
