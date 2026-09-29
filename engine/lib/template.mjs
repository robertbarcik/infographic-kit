// Assembles the page HTML from a validated spec. Pure function of (spec, name).
import { COMPONENTS } from '../components/index.mjs';
import { makeCtx } from './ctx.mjs';
import { esc, plain } from './markup.mjs';
import { ICON_DEFS } from '../icons/icons.mjs';
import { fontFaceCss, readEngineFile } from './assets.mjs';

/** seeded PRNG (mulberry32) */
export function prng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function seedOf(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

/** hand-lettered feel: every letter gets a tiny seeded tilt and baseline shift */
function letter(str, rnd, upper = true) {
  const s = plain(str);
  return (upper ? s.toUpperCase() : s).split(/(\s+)/).map((word) => {
    if (/^\s+$/.test(word)) return ' ';
    const chars = Array.from(word).map((c) => {
      const r = ((rnd() - 0.5) * 4.2).toFixed(2);
      const dy = ((rnd() - 0.5) * 2.6).toFixed(2);
      return `<span class="ch" style="transform:translateY(${dy}px) rotate(${r}deg)">${esc(c)}</span>`;
    }).join('');
    return `<span class="w">${chars}</span>`;
  }).join(' ');
}

function sectionHtml(sec, ri, si, sk, frac = 1) {
  if (Array.isArray(sec.stack)) {
    return `<div class="stack">${sec.stack.map((s, k) => sectionHtml(s, ri, si, k, frac)).join('')}</div>`;
  }
  const comp = COMPONENTS[sec.component];
  const role = sec.role || comp.defaultRole(sec);
  const where = `rows[${ri}].sections[${si}]${sk !== undefined ? `.stack[${sk}]` : ''}${sec.label ? ` "${plain(sec.label)}"` : ''} (${comp.name})`;
  const ctx = makeCtx(where);
  ctx.frac = frac; // share of the page width this section gets
  const extraCls = comp.sectionClass ? comp.sectionClass(sec) : '';
  const extraAttrs = comp.sectionAttrs ? comp.sectionAttrs(sec) : '';
  const tab = sec.label
    ? `<div class="tab" data-rough="tab" data-box>${ctx.t(sec.label, 'tab-t', 'label')}</div>`
    : '';
  return `<section class="sec role-${role} comp-${comp.name} ${extraCls}${sec.label ? '' : ' no-label'}" data-rough="box" data-box data-where="${esc(where)}" ${extraAttrs}>
    ${tab}
    <div class="sec-body">${comp.render(sec, ctx)}</div>
  </section>`;
}

export function buildHtml(spec, name) {
  const rnd = prng(seedOf(name + ':title'));
  const t = spec.title;
  const titleText = (t.number ? `${t.number}. ` : '') + t.text;
  const rows = spec.rows.map((row, ri) => {
    const ratio = row.ratio || row.sections.map(() => 1);
    const cols = ratio.map((r) => `minmax(0,${r}fr)`).join(' ');
    return `<div class="row" data-row="${ri}" style="grid-template-columns:${cols}">${row.sections.map((s, si) => sectionHtml(s, ri, si, undefined, ratio[si] / ratio.reduce((a, b) => a + b, 0))).join('')}</div>`;
  }).join('\n');

  const css = fontFaceCss() + readEngineFile('styles/tokens.css') + readEngineFile('styles/page.css') + readEngineFile('styles/components.css');
  return `<!doctype html>
<html lang="${esc((spec.meta && spec.meta.lang) || 'en')}">
<head>
<meta charset="utf-8">
<title>${esc(plain(titleText))}</title>
<meta name="generator" content="infographic-kit">
<style>${css}</style>
</head>
<body>
${ICON_DEFS}
<div id="page">
  <svg id="ink" xmlns="http://www.w3.org/2000/svg"></svg>
  <div id="content">
    <header class="title-block" data-box data-where="title">
      <h1 class="t title" data-where="title">${letter(titleText, rnd)}</h1>
      ${t.subtitle ? `<div class="t subtitle" data-where="title.subtitle">${letter(t.subtitle, rnd, false)}</div>` : ''}
    </header>
    <div id="rows">
${rows}
    </div>
  </div>
  <svg id="grain" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <filter id="ik-grain" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="7" stitchTiles="stitch"/>
      <feColorMatrix values="0 0 0 0 0.35  0 0 0 0 0.3  0 0 0 0 0.2  0 0 0 0.09 0"/>
    </filter>
    <rect width="100%" height="100%" filter="url(#ik-grain)"/>
  </svg>
</div>
</body>
</html>`;
}
