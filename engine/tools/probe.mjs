// Dev tool: print natural row heights of a spec across a range of scale factors k,
// to find components whose height jumps (wrapping switches) and defeat the auto-fit.
//   node engine/tools/probe.mjs specs/<name>.json [kFrom kTo steps]
import fs from 'node:fs';
import path from 'node:path';
import { launch } from '../lib/browser.mjs';
import { buildHtml } from '../lib/template.mjs';
import { ENGINE_DIR, roughSource } from '../lib/assets.mjs';

const [file, a = '0.9', b = '1.4', n = '26'] = process.argv.slice(2);
const spec = JSON.parse(fs.readFileSync(file, 'utf8'));
const name = path.basename(file, '.json');
const browser = await launch();
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1240, height: 1754 });
  await page.setContent(buildHtml(spec, name), { waitUntil: 'load' });
  await page.addScriptTag({ content: roughSource() });
  await page.addScriptTag({ content: fs.readFileSync(path.join(ENGINE_DIR, 'client/page.js'), 'utf8') });
  await page.evaluate(() => document.fonts.ready);
  const ks = Array.from({ length: +n }, (_, i) => +(+a + ((+b - +a) * i) / (+n - 1)).toFixed(4));
  const res = await page.evaluate((ks) => window.__IK.probe(ks), ks);
  for (const r of res) console.log(`k=${r.k.toFixed(3)} total=${r.h} title=${r.title} rows=${r.rows.join(' ')}`);
} finally {
  await browser.close();
}
