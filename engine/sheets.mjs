// Contact sheets for visual QA: out/_icons.png and out/_characters.png
//   node engine/sheets.mjs            -> both
//   node engine/sheets.mjs icons      -> icons only
//   node engine/sheets.mjs characters -> characters only
import path from 'node:path';
import fs from 'node:fs';
import { launch, htmlToPng } from './lib/browser.mjs';
import { ICONS, ICON_DEFS, iconSvg } from './icons/icons.mjs';
import { characterSvg, CHARACTER_OPTIONS } from './characters/character.mjs';
import { fontFaceCss, readEngineFile, KIT_DIR } from './lib/assets.mjs';

const OUT = path.join(KIT_DIR, 'out');
fs.mkdirSync(OUT, { recursive: true });
const which = process.argv[2] || 'all';

const head = `<meta charset="utf-8"><style>${fontFaceCss()}${readEngineFile('styles/tokens.css')}
body{margin:0;padding:24px;background:var(--paper);font-family:var(--font-body);color:var(--ink)}
h1{font-family:var(--font-display);font-weight:400;font-size:40px;margin:0 0 16px;color:var(--ink-title)}
.grid{display:grid;gap:14px}
.cell{background:#fff;border:1.5px solid #d8dde6;border-radius:12px;padding:10px 6px 8px;text-align:center}
.cell svg{display:block;margin:0 auto}
.name{font-size:17px;margin-top:4px}
.small{display:flex;gap:6px;justify-content:center;align-items:flex-end;margin-top:6px}
</style>`;

const browser = await launch();
try {
  if (which === 'all' || which === 'icons') {
    const names = Object.keys(ICONS);
    const extra = ['lucide:rocket', 'lucide:cpu'];
    const cells = [...names, ...extra].map((n) => `<div class="cell">
      ${iconSvg(n).replace('class="ico"', 'width="96" height="96"')}
      <div class="small">${iconSvg(n).replace('class="ico"', 'width="48" height="48"')}${iconSvg(n).replace('class="ico"', 'width="32" height="32"')}</div>
      <div class="name">${n}</div></div>`).join('');
    const html = `<!doctype html><html><head>${head}</head><body>${ICON_DEFS}
      <h1>Icon set (${names.length} own + lucide fallback)</h1>
      <div class="grid" style="grid-template-columns:repeat(8,1fr)">${cells}</div></body></html>`;
    await htmlToPng(browser, html, path.join(OUT, '_icons.png'), { width: 1500, scale: 1 });
    console.log('wrote out/_icons.png');
  }
  if (which === 'all' || which === 'characters') {
    const combos = [];
    for (const pose of CHARACTER_OPTIONS.pose) combos.push({ pose, hair: 'short', shirt: 'concept', expression: 'happy' });
    for (const hair of CHARACTER_OPTIONS.hair) combos.push({ hair, pose: 'neutral', shirt: 'detail', expression: 'smile' });
    for (const expression of CHARACTER_OPTIONS.expression) combos.push({ expression, hair: 'long', hairTone: 'brown', shirt: 'info' });
    for (const skin of CHARACTER_OPTIONS.skin) combos.push({ skin, hair: 'curly', hairTone: 'dark', shirt: 'action', pose: 'neutral' });
    for (const hairTone of CHARACTER_OPTIONS.hairTone) combos.push({ hairTone, hair: 'bun', shirt: 'accent', pose: 'pointing' });
    combos.push({ pose: 'thinking', facing: 'left', hair: 'long', shirt: 'example' });
    combos.push({ pose: 'pointing', facing: 'left', hair: 'short', shirt: 'warning' });
    combos.push({ holding: 'passport', hair: 'short', shirt: 'info' });
    combos.push({ holding: 'cloche', hair: 'bun', shirt: 'neutral', facing: 'left' });
    combos.push({ holding: 'postcard', hair: 'curly', skin: 'tan', shirt: 'action' });
    combos.push({ holding: 'bookmark', hair: 'long', hairTone: 'red', shirt: 'detail' });
    combos.push({ holding: 'sealed-envelope', facing: 'left', hair: 'bald', skin: 'dark', shirt: 'concept' });
    const cells = combos.map((c) => `<div class="cell">${characterSvg(c).replace('<svg ', '<svg width="150" height="175" ')}
      <div class="name" style="font-size:15px">${Object.entries(c).map(([k, v]) => `${k}:${v}`).join(' ')}</div></div>`).join('');
    const html = `<!doctype html><html><head>${head}</head><body>${ICON_DEFS}
      <h1>Characters (hair × tone × skin × shirt role × expression × pose)</h1>
      <div class="grid" style="grid-template-columns:repeat(6,1fr)">${cells}</div></body></html>`;
    await htmlToPng(browser, html, path.join(OUT, '_characters.png'), { width: 1300, scale: 1 });
    console.log('wrote out/_characters.png');
  }
} finally {
  await browser.close();
}
