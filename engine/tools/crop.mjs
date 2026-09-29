// Dev tool: crop (and optionally zoom) a region of a PNG for close inspection.
//   node engine/tools/crop.mjs <in.png> <out.png> <x> <y> <w> <h> [zoom=1]
// Coordinates are in source-image pixels.
import fs from 'node:fs';
import { launch } from '../lib/browser.mjs';

const [inp, out, x, y, w, h, zoom = '1'] = process.argv.slice(2);
if (!inp || !out || h === undefined) {
  console.error('usage: node engine/tools/crop.mjs <in.png> <out.png> <x> <y> <w> <h> [zoom]');
  process.exit(2);
}
const z = Number(zoom);
const b64 = fs.readFileSync(inp).toString('base64');
const browser = await launch();
try {
  const page = await browser.newPage();
  const W = Math.round(w * z), H = Math.round(h * z);
  await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
  await page.setContent(`<html><body style="margin:0;overflow:hidden">
    <div style="width:${W}px;height:${H}px;overflow:hidden;position:relative">
    <img src="data:image/png;base64,${b64}" style="position:absolute;left:${-x * z}px;top:${-y * z}px;transform-origin:0 0;image-rendering:auto" id="i"></div></body></html>`);
  await page.evaluate(async (z) => {
    const i = document.getElementById('i');
    await i.decode();
    i.style.width = i.naturalWidth * z + 'px';
  }, z);
  await page.screenshot({ path: out, clip: { x: 0, y: 0, width: W, height: H } });
} finally {
  await browser.close();
}
