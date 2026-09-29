// Dev tool: compare two PNGs pixel by pixel; prints count and bounding box of differences.
//   node engine/tools/pixdiff.mjs a.png b.png
import fs from 'node:fs';
import { launch } from '../lib/browser.mjs';

const [a, b] = process.argv.slice(2);
const browser = await launch();
try {
  const page = await browser.newPage();
  const res = await page.evaluate(async (ua, ub) => {
    const load = async (src) => { const i = new Image(); i.src = src; await i.decode(); const c = new OffscreenCanvas(i.naturalWidth, i.naturalHeight); const x = c.getContext('2d'); x.drawImage(i, 0, 0); return x.getImageData(0, 0, c.width, c.height); };
    const A = await load(ua), B = await load(ub);
    if (A.width !== B.width || A.height !== B.height) return { sizeDiff: [A.width, A.height, B.width, B.height] };
    let n = 0, minX = 1e9, minY = 1e9, maxX = -1, maxY = -1, maxD = 0;
    for (let i = 0; i < A.data.length; i += 4) {
      const d = Math.max(Math.abs(A.data[i] - B.data[i]), Math.abs(A.data[i + 1] - B.data[i + 1]), Math.abs(A.data[i + 2] - B.data[i + 2]));
      if (d) { n++; const p = i / 4, x = p % A.width, y = Math.floor(p / A.width); minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y); maxD = Math.max(maxD, d); }
    }
    return { n, box: n ? [minX, minY, maxX, maxY] : null, maxD };
  }, 'data:image/png;base64,' + fs.readFileSync(a).toString('base64'), 'data:image/png;base64,' + fs.readFileSync(b).toString('base64'));
  console.log(JSON.stringify(res));
} finally {
  await browser.close();
}
