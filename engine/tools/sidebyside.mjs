// Dev tool: put a reference image and a render side by side at the same height.
//   node engine/tools/sidebyside.mjs reference/ref.png out/page.png out/_compare.png [height=1400]
import fs from 'node:fs';
import { launch, htmlToPng } from '../lib/browser.mjs';

const [a, b, out, h = '1400'] = process.argv.slice(2);
const img = (p) => `data:image/png;base64,${fs.readFileSync(p).toString('base64')}`;
const H = Number(h);
const html = `<html><body style="margin:0;background:#888;display:flex;gap:16px;padding:16px;width:max-content">
  <div><div style="font:20px sans-serif;color:#fff">reference</div><img src="${img(a)}" style="height:${H}px;display:block"></div>
  <div><div style="font:20px sans-serif;color:#fff">engine render</div><img src="${img(b)}" style="height:${H}px;display:block"></div></body></html>`;
const browser = await launch();
try {
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'load' });
  const w = await page.evaluate(() => document.body.scrollWidth);
  await page.close();
  await htmlToPng(browser, html, out, { width: w, height: H + 64, scale: 1 });
} finally {
  await browser.close();
}
