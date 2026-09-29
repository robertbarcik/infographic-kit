// ==========================================================================
// Icon + illustration set. ONE visual language:
//   64x64 viewBox, dark ink outline 2.4 units, round caps/joins,
//   flat pastel fills from the palette below, a white glare on glass,
//   a darker side face on "boxy" hardware for a little depth.
// Every icon is a string of SVG elements drawn inside a <g> that already
// carries the ink stroke. Add new icons here; they become available to all
// pages at once (`node engine/list.mjs icons`).
// ==========================================================================

export const C = {
  ink: '#27303f', white: '#ffffff', paper: '#fdfcf6',
  screen: 'url(#ik-screen)', glass: '#d3e9fb',
  dark: '#4b576d', darker: '#353f52', slate: '#8e9cb2', metal: '#d0d8e3', metal2: '#aab6c7',
  blue: '#7ab5ea', lblue: '#d5e9fb', navy: '#3f70b4',
  green: '#7bc98e', lgreen: '#d5f0da', dgreen: '#3f9a5c',
  yellow: '#ffd45e', lyellow: '#fff1c0', gold: '#e9b43c',
  orange: '#f5a14f', lorange: '#fde0c5',
  red: '#e8645b', lred: '#fbd4d0', dred: '#c2413a',
  purple: '#b598e6', lpurple: '#e8ddf8',
  pink: '#f4a6ba', skin: '#f7cfa7', brown: '#c98b4c', lbrown: '#f0c98f', dbrown: '#a8692e',
};
const I = C.ink;

/** shared <defs>: must be present once per document that shows icons */
export const ICON_DEFS = `
<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
  <linearGradient id="ik-screen" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#bfe2fb"/><stop offset="1" stop-color="#5fa3e2"/>
  </linearGradient>
  <linearGradient id="ik-screen-dark" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#3d4a60"/><stop offset="1" stop-color="#2a3344"/>
  </linearGradient>
</defs></svg>`;

// ---- helpers --------------------------------------------------------------
const f = (fill) => `fill="${fill}"`;
/** outlined tube: an ink stroke with a coloured core (for handles, cables, shackles) */
const tube = (d, color, w = 4) =>
  `<path d="${d}" stroke="${I}" stroke-width="${w + 4.6}" fill="none"/>` +
  `<path d="${d}" stroke="${color}" stroke-width="${w}" fill="none"/>`;
/** white glare stripe on glass */
const glare = (pts) => `<polygon points="${pts}" fill="#ffffff" fill-opacity="0.38" stroke="none"/>`;
const dot = (cx, cy, r, fill) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" stroke="none"/>`;
const line = (x1, y1, x2, y2, w = 2.4, color = I) =>
  `<path d="M${x1} ${y1} L${x2} ${y2}" stroke="${color}" stroke-width="${w}"/>`;

function gearPath(cx, cy, rOuter, rInner, teeth) {
  const pts = [];
  const step = (Math.PI * 2) / teeth;
  for (let i = 0; i < teeth; i++) {
    const a = i * step - Math.PI / 2;
    const t = step * 0.22;
    pts.push([a - step / 2 + t * 0.5, rInner], [a - t, rOuter], [a + t, rOuter], [a + step / 2 - t * 0.5, rInner]);
  }
  return 'M' + pts.map(([a, r]) => `${(cx + r * Math.cos(a)).toFixed(2)} ${(cy + r * Math.sin(a)).toFixed(2)}`).join(' L') + 'Z';
}

/** clockwise circular arc (degrees, 0 = east, y down) drawn as a tube with a tangent arrowhead at the end */
function arcArrow(cx, cy, r, a0, a1, color) {
  const rad = (a) => (a * Math.PI) / 180;
  const pt = (a, rr = r) => [cx + rr * Math.cos(rad(a)), cy + rr * Math.sin(rad(a))];
  const [x0, y0] = pt(a0);
  const [x1, y1] = pt(a1 - 7);
  const large = (a1 - 7 - a0) > 180 ? 1 : 0;
  const arc = `M${x0.toFixed(2)} ${y0.toFixed(2)} A${r} ${r} 0 ${large} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`;
  // head: tip ahead along the tangent, base spread across the radius
  const [tx, ty] = pt(a1 + 6);
  const [o1x, o1y] = pt(a1 - 9, r + 8.5);
  const [o2x, o2y] = pt(a1 - 9, r - 8.5);
  const f2 = (n) => n.toFixed(2);
  return tube(arc, color, 4.2) + `<path d="M${f2(tx)} ${f2(ty)} L${f2(o1x)} ${f2(o1y)} L${f2(o2x)} ${f2(o2y)} Z" fill="${color}" stroke-width="2.4"/>`;
}

function windowFrame(fill = C.white, bar = C.lblue) {
  return `<rect x="6" y="10" width="52" height="44" rx="4" ${f(fill)}/>` +
    `<path d="M6 21 V14 a4 4 0 0 1 4 -4 h44 a4 4 0 0 1 4 4 v7 z" ${f(bar)}/>` +
    dot(12, 15.5, 1.9, C.red) + dot(17.5, 15.5, 1.9, C.yellow) + dot(23, 15.5, 1.9, C.green);
}

// ---- the set ---------------------------------------------------------------
export const ICONS = {
  // ---------------- devices ----------------
  laptop: {
    tags: 'device computer notebook client host',
    svg: `<rect x="11" y="12" width="42" height="29" rx="3.5" ${f(C.dark)}/>
      <rect x="15" y="16" width="34" height="21" rx="1.5" ${f(C.screen)} stroke-width="1.6"/>
      ${glare('21,37 31,16 37,16 27,37')}
      <path d="M4 42 h56 l-3.2 6.6 a3 3 0 0 1 -2.7 1.7 H9.9 a3 3 0 0 1 -2.7 -1.7 z" ${f(C.metal)}/>
      <path d="M26 42 v1.6 a1 1 0 0 0 1 1 h10 a1 1 0 0 0 1 -1 V42" stroke-width="1.6" ${f(C.metal2)}/>`,
  },
  desktop: {
    tags: 'device computer pc monitor workstation',
    svg: `<rect x="7" y="9" width="50" height="35" rx="3.5" ${f(C.dark)}/>
      <rect x="11" y="13" width="42" height="26" rx="1.5" ${f(C.screen)} stroke-width="1.6"/>
      ${glare('18,39 30,13 36,13 24,39')}
      <path d="M27 44 l-2.5 8 h15 l-2.5 -8" ${f(C.metal2)}/>
      <rect x="18" y="52" width="28" height="5" rx="2.5" ${f(C.metal)}/>`,
  },
  phone: {
    tags: 'device mobile smartphone',
    svg: `<rect x="19" y="5" width="26" height="54" rx="5.5" ${f(C.dark)}/>
      <rect x="22.5" y="11" width="19" height="40" rx="1.8" ${f(C.screen)} stroke-width="1.6"/>
      ${glare('25,51 37,11 41,11 29,51')}
      ${line(29, 8, 35, 8, 1.8, C.metal)}
      ${dot(32, 55, 1.7, C.metal)}`,
  },
  tablet: {
    tags: 'device ipad',
    svg: `<rect x="9" y="7" width="46" height="50" rx="5" ${f(C.dark)}/>
      <rect x="13" y="12" width="38" height="38" rx="1.8" ${f(C.screen)} stroke-width="1.6"/>
      ${glare('17,50 33,12 39,12 23,50')}
      ${dot(32, 53.5, 1.6, C.metal)}`,
  },
  server: {
    tags: 'host machine web server backend',
    svg: `<path d="M44 9 L51 4.5 V53 L44 58 Z" ${f(C.darker)}/>
      <path d="M17 9 L24 4.5 H51 L44 9 Z" ${f(C.slate)}/>
      <rect x="17" y="9" width="27" height="49" rx="2.5" ${f(C.dark)}/>
      ${[14, 25, 36, 47].map((y) => `<rect x="21" y="${y}" width="19" height="7.5" rx="1.6" ${f(C.slate)} stroke-width="1.8"/>
        ${line(24, y + 3.75, 31, y + 3.75, 1.6, C.darker)}${dot(36.5, y + 3.75, 1.5, C.green)}`).join('')}`,
  },
  'server-rack': {
    tags: 'datacenter rack cluster servers',
    svg: `<rect x="11" y="4" width="42" height="54" rx="3" ${f(C.darker)}/>
      ${[9, 18.5, 28, 37.5].map((y, i) => `<rect x="15" y="${y}" width="34" height="7" rx="1.4" ${f(C.slate)} stroke-width="1.8"/>
        ${line(18, y + 3.5, 28, y + 3.5, 1.6, C.darker)}${dot(40, y + 3.5, 1.4, i === 2 ? C.yellow : C.green)}${dot(44.5, y + 3.5, 1.4, C.green)}`).join('')}
      <rect x="15" y="47" width="34" height="7" rx="1.4" ${f(C.dark)} stroke-width="1.8"/>
      <path d="M15 58 v3 M49 58 v3" stroke-width="3"/>`,
  },
  database: {
    tags: 'db storage sql data',
    svg: `<path d="M13 15 V49 a19 6.5 0 0 0 38 0 V15" ${f('#b9cbe0')}/>
      <path d="M13 26.5 a19 6.5 0 0 0 38 0" ${f('none')}/>
      <path d="M13 38 a19 6.5 0 0 0 38 0" ${f('none')}/>
      <ellipse cx="32" cy="15" rx="19" ry="6.5" ${f('#e3ebf5')}/>
      <path d="M17.5 30 v4 M17.5 41.5 v4 M17.5 53 v1.5" stroke="#ffffff" stroke-opacity=".7" stroke-width="2.4"/>`,
  },
  cloud: {
    tags: 'cloud internet hosting saas',
    svg: `<path d="M17 49 h31 a10.5 10.5 0 0 0 1.5 -20.9 a15 15 0 0 0 -28.6 -3.6 a11.5 11.5 0 0 0 -3.9 24.5 z" ${f('#c9e2f9')}/>
      <path d="M22 41 a6 6 0 0 1 3 -7" stroke="#ffffff" stroke-width="2.6"/>`,
  },
  globe: {
    tags: 'internet web world www',
    svg: `<circle cx="32" cy="32" r="23" ${f(C.blue)}/>
      <ellipse cx="32" cy="32" rx="10.5" ry="23" stroke-width="2"/>
      ${line(32, 9, 32, 55, 2)}${line(9, 32, 55, 32, 2)}
      <path d="M12.5 21 q19.5 6 39 0 M12.5 43 q19.5 -6 39 0" stroke-width="2"/>
      <path d="M17 16 a21 21 0 0 1 9 -5" stroke="#ffffff" stroke-opacity=".75" stroke-width="2.6"/>`,
  },
  router: {
    tags: 'network gateway routing',
    svg: `${tube('M20 32 L15 12', C.metal2, 2.6)}${tube('M44 32 L49 12', C.metal2, 2.6)}
      <rect x="6" y="31" width="52" height="19" rx="5" ${f(C.blue)}/>
      ${dot(15, 40.5, 2, C.green)}${dot(22, 40.5, 2, C.green)}${dot(29, 40.5, 2, C.yellow)}
      ${[38, 43, 48].map((x) => `<rect x="${x - 1.6}" y="37" width="3.4" height="7" rx="1" ${f(C.darker)} stroke="none"/>`).join('')}
      <path d="M10 55 v-5 M54 55 v-5" stroke-width="3"/>`,
  },
  switch: {
    tags: 'network switch ethernet lan ports',
    svg: `<path d="M6 26 L12 20 H58 L52 26 Z" ${f(C.slate)}/>
      <rect x="6" y="26" width="46" height="18" rx="2.5" ${f(C.metal)}/>
      <path d="M52 26 L58 20 V38 L52 44 Z" ${f(C.metal2)}/>
      ${[11, 18, 25, 32, 39, 46].map((x) => `<rect x="${x - 2.4}" y="33" width="5.4" height="6" rx="0.8" ${f(C.darker)} stroke-width="1.4"/>${dot(x + 0.3, 29.5, 1.1, C.green)}`).join('')}`,
  },
  'network-card': {
    tags: 'nic ethernet adapter interface link layer',
    svg: `<rect x="5" y="20" width="54" height="22" rx="4" ${f(C.navy)}/>
      ${[13, 22, 31, 40].map((x) => `<circle cx="${x}" cy="31" r="3.2" ${f(C.lblue)} stroke-width="1.6"/>`).join('')}
      <rect x="45" y="26" width="9" height="10" rx="1.5" ${f(C.green)} stroke-width="1.8"/>
      <path d="M11 42 v5 h6 v-5 M22 42 v5 h6 v-5 M33 42 v5 h6 v-5" ${f(C.gold)} stroke-width="1.8"/>`,
  },
  firewall: {
    tags: 'security wall filter block',
    svg: `<rect x="7" y="22" width="50" height="34" rx="2" ${f(C.red)}/>
      <path d="M7 33.3 H57 M7 44.6 H57 M20 22 v11.3 M40 22 v11.3 M12 33.3 v11.3 M30 33.3 v11.3 M48 33.3 v11.3 M20 44.6 V56 M40 44.6 V56" stroke-width="2"/>
      <path d="M32 4 c4 6 10 8 8 15 a8 8 0 0 1 -16 0 c0 -4 3 -5 3 -9 c2 2 3 3 3 5 c1 -3 2 -7 2 -11 z" ${f(C.orange)}/>
      <path d="M32 13 c2 3 4 4 3 7 a3.2 3.2 0 0 1 -6 0 c0 -2 2 -3 3 -7 z" ${f(C.yellow)} stroke-width="1.8"/>`,
  },
  wifi: {
    tags: 'wireless wlan signal radio',
    svg: `${tube('M10 27 a31 31 0 0 1 44 0', C.blue, 4)}
      ${tube('M18 36 a19.5 19.5 0 0 1 28 0', C.blue, 4)}
      ${tube('M25.5 44.5 a9 9 0 0 1 13 0', C.blue, 4)}
      <circle cx="32" cy="52" r="4" ${f(C.blue)}/>`,
  },
  // ---------------- security ----------------
  lock: {
    tags: 'security encryption private closed',
    svg: `${tube('M21 30 V21 a11 11 0 0 1 22 0 V30', C.metal2, 3.6)}
      <rect x="13" y="29" width="38" height="28" rx="4.5" ${f(C.yellow)}/>
      <circle cx="32" cy="40" r="4" ${f(C.darker)} stroke="none"/>
      <path d="M30.5 42 h3 l1 7 h-5 z" ${f(C.darker)} stroke="none"/>
      ${line(18, 33, 18, 52, 2.2, '#ffffff')}`,
  },
  key: {
    tags: 'secret credential password api key',
    svg: `${tube('M28 30 L52 54', C.yellow, 4.2)}
      ${tube('M44 46 L48.5 41.5', C.yellow, 3.6)}${tube('M49 51 L53 47', C.yellow, 3.6)}
      <circle cx="21" cy="23" r="13" ${f(C.yellow)}/>
      <circle cx="17.5" cy="19.5" r="3.6" ${f(C.paper)}/>`,
  },
  certificate: {
    tags: 'tls ssl cert trust diploma',
    svg: `<rect x="6" y="9" width="46" height="36" rx="2.5" ${f(C.paper)}/>
      <rect x="10" y="13" width="38" height="28" rx="1" fill="none" stroke="${C.gold}" stroke-width="1.6"/>
      ${line(15, 21, 38, 21, 2.2, C.slate)}${line(15, 27.5, 32, 27.5, 2.2, C.slate)}${line(15, 34, 27, 34, 2.2, C.slate)}
      <path d="M40 46 l-4 13 l5 -3 l3 5 l3 -13 M52 46 l3 12 l-5 -2 l-3 5" ${f(C.red)} stroke-width="2"/>
      <circle cx="46" cy="42" r="9" ${f(C.red)}/>
      <circle cx="46" cy="42" r="4.5" ${f(C.lred)} stroke-width="1.6"/>`,
  },
  shield: {
    tags: 'security protection safe defence',
    svg: `<path d="M32 5 L53 12.5 V29 C53 43.5 44 53 32 59 C20 53 11 43.5 11 29 V12.5 Z" ${f(C.green)}/>
      <path d="M32 5 V59 C44 53 53 43.5 53 29 V12.5 Z" ${f(C.dgreen)} fill-opacity=".35" stroke="none"/>
      <path d="M22 31 l7 7 l13 -14" stroke="#ffffff" stroke-width="7"/>
      <path d="M22 31 l7 7 l13 -14" stroke="${I}" stroke-width="3"/>`,
  },
  // ---------------- files / things ----------------
  document: {
    tags: 'file page text syntax',
    svg: `<path d="M15 5 H40 L51 16 V59 H15 Z" ${f(C.white)}/>
      <path d="M40 5 V16 H51" ${f(C.lblue)}/>
      ${line(21, 26, 44, 26, 2.4, C.slate)}${line(21, 33, 44, 33, 2.4, C.slate)}${line(21, 40, 44, 40, 2.4, C.slate)}${line(21, 47, 35, 47, 2.4, C.slate)}`,
  },
  folder: {
    tags: 'directory files',
    svg: `<path d="M6 15 a3 3 0 0 1 3 -3 h14 l5 5 h27 a3 3 0 0 1 3 3 v31 a3 3 0 0 1 -3 3 H9 a3 3 0 0 1 -3 -3 z" ${f(C.gold)}/>
      <path d="M6 26 a3 3 0 0 1 3 -3 h46 a3 3 0 0 1 3 3 v25 a3 3 0 0 1 -3 3 H9 a3 3 0 0 1 -3 -3 z" ${f(C.yellow)}/>
      ${line(11, 29, 22, 29, 2.2, '#ffffff')}`,
  },
  envelope: {
    tags: 'email mail message smtp',
    svg: `<rect x="7" y="15" width="50" height="35" rx="3.5" ${f(C.lyellow)}/>
      <path d="M8.5 17 L32 36 L55.5 17" ${f('#fff8dc')}/>
      <path d="M8.5 48 L25 31 M55.5 48 L39 31" stroke-width="2"/>`,
  },
  package: {
    tags: 'box parcel delivery bundle artifact',
    svg: `<path d="M32 7 L55 17.5 L32 28 L9 17.5 Z" ${f(C.lbrown)}/>
      <path d="M9 17.5 V45 L32 57 V28 Z" ${f(C.orange)}/>
      <path d="M55 17.5 V45 L32 57 V28 Z" ${f('#d98a3d')}/>
      <path d="M20.5 12.3 L43.5 22.8 V31" stroke-width="2.2" ${f('none')}/>`,
  },
  container: {
    tags: 'docker container image shipping',
    svg: `<path d="M6 20 L13 14 H58 L51 20 Z" ${f('#5f98cf')}/>
      <path d="M51 20 L58 14 V44 L51 50 Z" ${f('#3f72a8')}/>
      <rect x="6" y="20" width="45" height="30" rx="1.5" ${f(C.blue)}/>
      ${[13, 20, 27, 34, 41].map((x) => line(x, 24, x, 46, 2, '#3f72a8')).join('')}
      ${line(46, 30, 46, 40, 2.6)}`,
  },
  gear: {
    tags: 'settings config process service',
    svg: `<path d="${gearPath(32, 32, 25, 18.5, 9)}" ${f(C.metal2)}/>
      <circle cx="32" cy="32" r="8" ${f(C.paper)}/>`,
  },
  bug: {
    tags: 'error defect debug issue',
    svg: `<path d="M20 26 l-9 -5 M19 36 h-11 M20 46 l-9 6 M44 26 l9 -5 M45 36 h11 M44 46 l9 6 M27 11 l-4 -6 M37 11 l4 -6" stroke-width="2.6"/>
      <ellipse cx="32" cy="38" rx="13" ry="17" ${f(C.green)}/>
      <path d="M32 22 V55" stroke-width="2"/>
      <circle cx="32" cy="17" r="7.5" ${f(C.darker)}/>
      ${dot(26, 34, 2.6, C.dgreen)}${dot(38, 42, 2.6, C.dgreen)}${dot(26, 46, 2, C.dgreen)}`,
  },
  magnifier: {
    tags: 'search find inspect diagnose zoom',
    svg: `${tube('M38 38 L54 54', C.darker, 5)}
      <circle cx="26" cy="26" r="17" ${f(C.lblue)} stroke-width="3.4"/>
      <path d="M16 23 a10.5 10.5 0 0 1 8 -8" stroke="#ffffff" stroke-width="3.2"/>`,
  },
  target: {
    tags: 'goal aim objective',
    svg: `<circle cx="29" cy="35" r="23" ${f(C.red)}/>
      <circle cx="29" cy="35" r="16" ${f(C.white)}/>
      <circle cx="29" cy="35" r="9" ${f(C.red)}/>
      <circle cx="29" cy="35" r="3" ${f(C.white)} stroke-width="1.6"/>
      <path d="M29.5 34.5 L54 10" stroke-width="3"/>
      <path d="M47 8 L53.5 10.5 L56 17 L61 12 L58 6 L52 3.5 Z" ${f(C.blue)} stroke-width="2"/>`,
  },
  lightbulb: {
    tags: 'idea tip insight',
    svg: `<path d="M32 8 a16.5 16.5 0 0 0 -9.5 30 c2 1.5 3 3.5 3 6 v2.5 h13 V44 c0 -2.5 1 -4.5 3 -6 A16.5 16.5 0 0 0 32 8 z" ${f(C.yellow)}/>
      <rect x="25" y="46.5" width="14" height="9" rx="2" ${f(C.metal2)}/>
      ${line(25.5, 51, 38.5, 51, 1.8)}
      <path d="M29 58.5 h6" stroke-width="3"/>
      <path d="M24 25 a9 9 0 0 1 6 -8" stroke="#ffffff" stroke-width="3"/>
      <path d="M8 24 h-4 M56 24 h4 M12 9 l-3 -3 M52 9 l3 -3" stroke-width="2.4" stroke="${C.gold}"/>`,
  },
  // ---------------- status ----------------
  warning: {
    tags: 'alert caution danger remember',
    svg: `<path d="M32 7 L59 54 H5 Z" ${f(C.lred)} stroke="${C.dred}" stroke-width="3.6"/>
      <path d="M32 23 V39" stroke="${C.dred}" stroke-width="5"/>
      <circle cx="32" cy="47" r="3.1" ${f(C.dred)} stroke="none"/>`,
  },
  check: {
    tags: 'ok success done correct yes',
    svg: `<circle cx="32" cy="32" r="24" ${f(C.green)}/>
      <path d="M20 33 l8 8 l16 -17" stroke="#ffffff" stroke-width="8"/>
      <path d="M20 33 l8 8 l16 -17" stroke="${I}" stroke-width="3.4"/>`,
  },
  cross: {
    tags: 'error fail wrong no',
    svg: `<circle cx="32" cy="32" r="24" ${f(C.red)}/>
      <path d="M23 23 L41 41 M41 23 L23 41" stroke="#ffffff" stroke-width="8"/>
      <path d="M23 23 L41 41 M41 23 L23 41" stroke="${I}" stroke-width="3.4"/>`,
  },
  info: {
    tags: 'information note',
    svg: `<circle cx="32" cy="32" r="24" ${f(C.blue)}/>
      <path d="M32 29 V45" stroke="#ffffff" stroke-width="8"/><path d="M32 29 V45" stroke-width="3.6"/>
      <circle cx="32" cy="20" r="3.6" ${f(I)} stroke="#ffffff" stroke-width="1.6"/>`,
  },
  question: {
    tags: 'help faq unknown',
    svg: `<circle cx="32" cy="32" r="24" ${f(C.purple)}/>
      <path d="M24.5 25 a7.5 7.5 0 1 1 11 6.5 c-2.5 1.5 -3.5 3 -3.5 6" stroke="#ffffff" stroke-width="8"/>
      <path d="M24.5 25 a7.5 7.5 0 1 1 11 6.5 c-2.5 1.5 -3.5 3 -3.5 6" stroke-width="3.6"/>
      <circle cx="32" cy="45.5" r="3.4" ${f(I)} stroke="#ffffff" stroke-width="1.6"/>`,
  },
  clock: {
    tags: 'time timeout latency wait',
    svg: `<circle cx="32" cy="32" r="24" ${f(C.blue)}/>
      <circle cx="32" cy="32" r="18.5" ${f(C.white)}/>
      <path d="M32 17 v3 M32 44 v3 M17 32 h3 M44 32 h3" stroke-width="2"/>
      <path d="M32 32 V22.5 M32 32 L40 37" stroke-width="3"/>
      ${dot(32, 32, 2.4, C.red)}`,
  },
  hourglass: {
    tags: 'wait loading time',
    svg: `<path d="M18 9 h28 M18 55 h28" stroke-width="4"/>
      <path d="M21 10 h22 c0 11 -8 15 -8 22 c0 7 8 11 8 22 H21 c0 -11 8 -15 8 -22 c0 -7 -8 -11 -8 -22 z" ${f(C.lblue)}/>
      <path d="M25 18 h14 c-1 5 -5 7 -7 10 c-2 -3 -6 -5 -7 -10 z M24 51 c1 -5 5 -8 8 -9 c3 1 7 4 8 9 z" ${f(C.gold)} stroke="none"/>`,
  },
  // ---------------- people ----------------
  user: {
    tags: 'person account human',
    svg: `<path d="M11 58 a21 18 0 0 1 42 0 z" ${f(C.blue)}/>
      <circle cx="32" cy="24" r="11.5" ${f(C.skin)}/>
      <path d="M20.5 23 a11.5 11.5 0 0 1 23 -1 c-4 0 -9 -2 -12 -5 c-2 3 -6 5 -11 6 z" ${f(C.dbrown)}/>
      ${dot(28, 26, 1.4, I)}${dot(36, 26, 1.4, I)}
      <path d="M29 30.5 q3 2.2 6 0" stroke-width="1.8"/>`,
  },
  users: {
    tags: 'people team group',
    svg: `<path d="M26 50 a15.5 14 0 0 1 31 0 z" ${f(C.purple)}/>
      <circle cx="41.5" cy="25" r="9" ${f(C.skin)}/>
      <path d="M32.5 24 a9 9 0 0 1 18 -1 c-4 0 -7 -2 -9 -4 c-2 2 -5 4 -9 5 z" ${f(C.darker)}/>
      <path d="M7 58 a18 16 0 0 1 36 0 z" ${f(C.green)}/>
      <circle cx="25" cy="30" r="10.5" ${f(C.skin)}/>
      <path d="M14.5 29 a10.5 10.5 0 0 1 21 -1 c-4 0 -8 -2 -11 -5 c-2 3 -5 5 -10 6 z" ${f(C.dbrown)}/>
      ${dot(21.5, 32, 1.3, I)}${dot(28.5, 32, 1.3, I)}
      <path d="M22.5 36 q2.5 2 5 0" stroke-width="1.7"/>`,
  },
  handshake: {
    tags: 'agreement deal partner protocol',
    // right hand (green sleeve) underneath, left hand (blue sleeve) wraps over it with a thumb on top
    svg: `<path d="M61 26 L51 20 L42 34 L52 40 Z" ${f(C.green)}/>
      <path d="M45 24 C40 22 34 23 29 27 L20 36 C18 39 20 42 23 41 L31 35" ${f(C.skin)}/>
      <path d="M3 30 L13 24 L22 38 L12 44 Z" ${f(C.blue)}/>
      <path d="M18 31 C22 28 27 28 31 30 L45 38 C48 40 47 44 44 44 L41 43.5 C43 46 41 49 38 48 L36 47.5 C37 50 34 52 31 50.5 L28 49 C28 51.5 25 52.5 23 51 L17 46 Z" ${f(C.skin)}/>
      <path d="M41 43.5 L34 39.5 M36 47.5 L30 44 M28 49 L24 46.5" stroke-width="2"/>
      <path d="M31 30 C33 26 37 25 39 27" ${f('none')} stroke-width="2.2"/>`,
  },
  // ---------------- screens / software ----------------
  browser: {
    tags: 'web browser client window http',
    svg: `${windowFrame()}
      <rect x="29" y="12.8" width="25" height="5.4" rx="2.7" ${f(C.white)} stroke-width="1.5"/>
      <circle cx="32" cy="37" r="11" ${f(C.blue)} stroke-width="2"/>
      <ellipse cx="32" cy="37" rx="5" ry="11" stroke-width="1.6"/>
      <path d="M21 37 h22 M23 31.5 h18 M23 42.5 h18" stroke-width="1.6"/>`,
  },
  'web-page': {
    tags: 'html page website response content',
    svg: `${windowFrame()}
      <rect x="11" y="26" width="18" height="22" rx="1.5" ${f(C.lgreen)} stroke-width="1.8"/>
      <path d="M11.8 44 l6 -8 l4 5 l3 -3 l4 5 v2.2 H11.8 z" ${f(C.green)} stroke="none"/>
      ${dot(23.5, 31, 2.2, C.yellow)}
      ${line(34, 28, 52, 28, 2.6, C.blue)}${line(34, 34.5, 52, 34.5, 2.2, C.slate)}${line(34, 40.5, 52, 40.5, 2.2, C.slate)}${line(34, 46.5, 46, 46.5, 2.2, C.slate)}`,
  },
  terminal: {
    tags: 'shell console cli command bash',
    svg: `<rect x="6" y="10" width="52" height="44" rx="4" ${f('url(#ik-screen-dark)')}/>
      <path d="M6 21 V14 a4 4 0 0 1 4 -4 h44 a4 4 0 0 1 4 4 v7 z" ${f(C.slate)}/>
      ${dot(12, 15.5, 1.9, C.red)}${dot(17.5, 15.5, 1.9, C.yellow)}${dot(23, 15.5, 1.9, C.green)}
      <path d="M14 30 l7 5.5 l-7 5.5" stroke="${C.green}" stroke-width="3"/>
      ${line(25, 42, 36, 42, 3, '#e6edf6')}`,
  },
  code: {
    tags: 'source programming brackets developer',
    svg: `<rect x="6" y="10" width="52" height="44" rx="6" ${f(C.lpurple)}/>
      <path d="M22 22 l-9 10 l9 10 M42 22 l9 10 l-9 10" stroke="${I}" stroke-width="3.6"/>
      <path d="M36 19 L28 45" stroke="${C.purple}" stroke-width="3.6"/>`,
  },
  api: {
    tags: 'plug interface connect integration endpoint',
    svg: `${tube('M32 44 V50 c0 5 -4 8 -9 8 H8', C.darker, 2.4)}
      <path d="M26 6 v10 M38 6 v10" stroke-width="4.4"/>
      <path d="M26 6 v10 M38 6 v10" stroke="${C.metal}" stroke-width="1.6"/>
      <path d="M17 16 h30 v12 a15 15 0 0 1 -30 0 z" ${f(C.orange)}/>
      <path d="M22 20 v7" stroke="#ffffff" stroke-width="2.6"/>`,
  },
  'git-branch': {
    tags: 'git version control branch merge',
    svg: `<path d="M20 14 V50" stroke-width="3.2"/>
      <path d="M44 20 c0 12 -24 10 -24 24" stroke-width="3.2"/>
      <circle cx="20" cy="12" r="6.5" ${f(C.orange)}/>
      <circle cx="20" cy="52" r="6.5" ${f(C.orange)}/>
      <circle cx="44" cy="17" r="6.5" ${f(C.purple)}/>`,
  },
  // ---------------- hardware parts ----------------
  cpu: {
    tags: 'processor chip compute',
    svg: `${[23, 29, 35, 41].map((p) => `<path d="M${p} 8 v8 M${p} 48 v8 M8 ${p} h8 M48 ${p} h8" stroke-width="2.6"/>`).join('')}
      <rect x="15" y="15" width="34" height="34" rx="3.5" ${f(C.dark)}/>
      <rect x="23" y="23" width="18" height="18" rx="2" ${f(C.metal2)} stroke-width="2"/>
      ${dot(20, 20, 1.5, C.metal)}`,
  },
  memory: {
    tags: 'ram memory module',
    svg: `<path d="M4 18 h56 v22 h-26 v-3 h-4 v3 H4 z" ${f(C.green)}/>
      ${[9, 21, 33, 45].map((x) => `<rect x="${x}" y="22" width="9" height="12" rx="1" ${f(C.darker)} stroke-width="1.6"/>`).join('')}
      <path d="M4 40 v6 h56 v-6" ${f(C.lgreen)}/>
      ${[8, 13, 18, 23, 28, 38, 43, 48, 53].map((x) => `<path d="M${x} 42 v3" stroke="${C.gold}" stroke-width="2.6"/>`).join('')}`,
  },
  disk: {
    tags: 'hdd storage drive',
    svg: `<rect x="9" y="6" width="46" height="52" rx="4.5" ${f(C.metal)}/>
      <circle cx="32" cy="27" r="15" ${f('#eef2f7')}/>
      <circle cx="32" cy="27" r="3.4" ${f(C.metal2)} stroke-width="1.8"/>
      <path d="M46 48 L36 33" stroke-width="3"/>${dot(46, 48, 3, C.red)}
      ${dot(15, 52, 1.6, C.slate)}${dot(49, 11, 1.6, C.slate)}${dot(15, 11, 1.6, C.slate)}`,
  },
  // ---------------- abstract / diagram helpers ----------------
  speech: {
    tags: 'chat message meaning talk',
    svg: `<path d="M32 9 c-14.5 0 -26 9 -26 20.5 c0 6 3 11 8 14.5 l-3.5 11 l12.5 -7 c2.8 .7 5.8 1 9 1 c14.5 0 26 -9 26 -20.5 S46.5 9 32 9 z" ${f(C.lblue)}/>
      ${dot(21, 30, 3.2, I)}${dot(32, 30, 3.2, I)}${dot(43, 30, 3.2, I)}`,
  },
  pin: {
    tags: 'location address ip place map',
    svg: `<path d="M32 58 C23 45 13 36 13 25 a19 19 0 0 1 38 0 C51 36 41 45 32 58 z" ${f(C.blue)}/>
      <circle cx="32" cy="25" r="7.5" ${f(C.white)}/>
      <path d="M20 20 a13 13 0 0 1 6 -7" stroke="#ffffff" stroke-opacity=".8" stroke-width="2.6"/>`,
  },
  'arrows-lr': {
    tags: 'two-way bidirectional exchange transport',
    svg: `<path d="M14 32 H50" stroke="${I}" stroke-width="9"/>
      <path d="M14 32 H50" stroke="${C.blue}" stroke-width="4.2"/>
      <path d="M17 20 L4 32 L17 44 Z M47 20 L60 32 L47 44 Z" ${f(C.blue)} stroke-width="2.4"/>`,
  },
  sequence: {
    tags: 'order steps 123 numbered',
    svg: `<circle cx="12" cy="32" r="10" ${f(C.dgreen)}/><circle cx="32" cy="32" r="10" ${f(C.navy)}/><circle cx="52" cy="32" r="10" ${f(C.navy)}/>
      <path d="M10 28.5 l3 -2 v11.5" stroke="#ffffff" stroke-width="2.6"/>
      <path d="M28 29 a4 4 0 0 1 8 0.5 c0 3 -8 6 -8 8.5 h8.2" stroke="#ffffff" stroke-width="2.4"/>
      <path d="M48.2 27 h7.3 l-4 4.4 a3.6 3.6 0 1 1 -3.2 5.6" stroke="#ffffff" stroke-width="2.4"/>`,
  },
  cursor: {
    tags: 'click pointer mouse user action',
    svg: `<path d="M18 7 L48 35 L35 36.5 L42.5 51.5 L36 54.5 L28.5 39.5 L19 48 Z" ${f(C.white)} stroke-width="2.8"/>`,
  },
  link: {
    tags: 'url hyperlink chain connection',
    // two interlocking chain links; the first link is redrawn over the second on one side
    svg: `<g transform="rotate(-40 32 32)">
      ${tube('M14 25 H30 a7 7 0 0 1 0 14 H14 a7 7 0 0 1 0 -14 Z', C.blue, 4.4)}
      ${tube('M34 25 H50 a7 7 0 0 1 0 14 H34 a7 7 0 0 1 0 -14 Z', C.green, 4.4)}
      ${tube('M30 25 a7 7 0 0 1 7 7', C.blue, 4.4)}
    </g>`,
  },
  upload: {
    tags: 'send push put post',
    svg: `<path d="M8 40 v10 a4 4 0 0 0 4 4 h40 a4 4 0 0 0 4 -4 V40" stroke-width="3.4"/>
      <path d="M32 44 V16" stroke="${I}" stroke-width="9"/><path d="M32 44 V16" stroke="${C.green}" stroke-width="4.2"/>
      <path d="M19 22 L32 7 L45 22 Z" ${f(C.green)}/>`,
  },
  download: {
    tags: 'receive pull get fetch',
    svg: `<path d="M8 40 v10 a4 4 0 0 0 4 4 h40 a4 4 0 0 0 4 -4 V40" stroke-width="3.4"/>
      <path d="M32 7 V33" stroke="${I}" stroke-width="9"/><path d="M32 7 V33" stroke="${C.blue}" stroke-width="4.2"/>
      <path d="M19 30 L32 45 L45 30 Z" ${f(C.blue)}/>`,
  },
  sync: {
    tags: 'refresh retry retransmit repeat loop',
    svg: `${arcArrow(32, 32, 19, 196, 322, C.blue)}${arcArrow(32, 32, 19, 16, 142, C.green)}`,
  },
  chart: {
    tags: 'graph statistics metrics monitoring',
    svg: `<path d="M8 8 V56 H58" stroke-width="3"/>
      <rect x="15" y="34" width="9" height="18" rx="1.5" ${f(C.blue)}/>
      <rect x="29" y="22" width="9" height="30" rx="1.5" ${f(C.green)}/>
      <rect x="43" y="13" width="9" height="39" rx="1.5" ${f(C.orange)}/>`,
  },
  calendar: {
    tags: 'date schedule day meeting',
    svg: `<rect x="8" y="11" width="48" height="45" rx="4" ${f(C.white)}/>
      <path d="M8 24 V15 a4 4 0 0 1 4 -4 h40 a4 4 0 0 1 4 4 v9 z" ${f(C.red)}/>
      <path d="M20 6 v9 M44 6 v9" stroke-width="3.4"/>
      ${[16, 26, 36, 46].map((x) => dot(x, 33, 2.2, C.slate) + dot(x, 44, 2.2, x === 36 ? C.red : C.slate)).join('')}`,
  },
  book: {
    tags: 'docs manual documentation read learn',
    svg: `<path d="M32 16 C25 10 15 10 6 12 V52 c9 -2 19 -2 26 4 z" ${f(C.lblue)}/>
      <path d="M32 16 C39 10 49 10 58 12 V52 c-9 -2 -19 -2 -26 4 z" ${f(C.blue)}/>
      <path d="M32 16 V56" stroke-width="2.4"/>
      <path d="M12 22 c5 -1 10 -1 14 1 M12 30 c5 -1 10 -1 14 1 M12 38 c5 -1 10 -1 14 1" stroke="${C.slate}" stroke-width="2"/>`,
  },
  robot: {
    tags: 'ai bot automation agent llm',
    svg: `<path d="M32 13 V7" stroke-width="2.6"/>${`<circle cx="32" cy="6" r="3" fill="${C.red}"/>`}
      <rect x="12" y="13" width="40" height="30" rx="8" ${f(C.metal)}/>
      <rect x="6" y="22" width="6" height="12" rx="2" ${f(C.metal2)}/><rect x="52" y="22" width="6" height="12" rx="2" ${f(C.metal2)}/>
      <circle cx="24" cy="27" r="5" ${f(C.lblue)}/><circle cx="40" cy="27" r="5" ${f(C.lblue)}/>
      ${dot(24, 27, 2, I)}${dot(40, 27, 2, I)}
      <path d="M25 36 h14" stroke-width="2.6"/>
      <path d="M18 58 v-7 a4 4 0 0 1 4 -4 h20 a4 4 0 0 1 4 4 v7" ${f(C.blue)}/>`,
  },
  printer: {
    tags: 'print output device',
    svg: `<rect x="18" y="7" width="28" height="16" rx="1.5" ${f(C.white)}/>
      <rect x="7" y="21" width="50" height="23" rx="5" ${f(C.metal2)}/>
      ${dot(49, 29, 2.2, C.green)}
      <rect x="17" y="36" width="30" height="21" rx="1.5" ${f(C.white)}/>
      ${line(22, 43, 42, 43, 2, C.slate)}${line(22, 49, 36, 49, 2, C.slate)}`,
  },
  eye: {
    tags: 'view observe monitor visibility',
    svg: `<path d="M4 32 C12 18 22 13 32 13 S52 18 60 32 C52 46 42 51 32 51 S12 46 4 32 z" ${f(C.white)}/>
      <circle cx="32" cy="32" r="12" ${f(C.blue)}/>
      <circle cx="32" cy="32" r="5.5" ${f(I)}/>
      ${dot(35, 29, 2, '#ffffff')}`,
  },
  home: {
    tags: 'house local network lan',
    svg: `<path d="M12 29 V55 H52 V29" ${f(C.lyellow)}/>
      <path d="M5 32 L32 8 L59 32" ${f('none')} stroke-width="3.6"/>
      <path d="M8 30 L32 9 L56 30 L52 30 L32 13 L12 30 Z" ${f(C.red)} stroke-width="2"/>
      <rect x="26" y="37" width="12" height="18" rx="1.5" ${f(C.brown)}/>
      <rect x="15" y="35" width="8" height="8" rx="1" ${f(C.glass)} stroke-width="2"/>
      <rect x="41" y="35" width="8" height="8" rx="1" ${f(C.glass)} stroke-width="2"/>`,
  },
  checklist: {
    tags: 'list todo tasks rules',
    svg: `<rect x="10" y="6" width="44" height="52" rx="4" ${f(C.white)}/>
      <rect x="23" y="3" width="18" height="8" rx="3" ${f(C.metal2)}/>
      ${[20, 32, 44].map((y, i) => `<rect x="16" y="${y - 4}" width="8" height="8" rx="1.6" ${f(i < 2 ? C.lgreen : C.white)} stroke-width="2"/>
        ${i < 2 ? `<path d="M17.5 ${y} l2.3 2.3 l4.5 -5" stroke="${C.dgreen}" stroke-width="2.4"/>` : ''}${line(29, y, 46, y, 2.4, C.slate)}`).join('')}`,
  },
  star: {
    tags: 'favourite important highlight',
    svg: `<path d="M32 6 L39.6 22.6 L57.7 24.6 L44.2 36.8 L48 54.6 L32 45.6 L16 54.6 L19.8 36.8 L6.3 24.6 L24.4 22.6 Z" ${f(C.yellow)} stroke-width="2.6"/>`,
  },
  flag: {
    tags: 'milestone finish mark report',
    svg: `<path d="M14 58 V6" stroke-width="3.6"/>
      <path d="M14 9 c10 -4 16 4 26 0 c5 -2 8 -2 12 -1 v24 c-4 -1 -7 -1 -12 1 c-10 4 -16 -4 -26 0 z" ${f(C.red)}/>`,
  },
  puzzle: {
    tags: 'plugin module fit component',
    svg: `<path d="M10 20 h11 a5 5 0 1 1 10 0 h11 v11 a5 5 0 1 1 0 10 v11 H31 a5 5 0 1 0 -10 0 H10 V41 a5 5 0 1 0 0 -10 z" ${f(C.purple)}/>`,
  },
  trash: {
    tags: 'delete remove bin',
    svg: `<path d="M8 16 h48" stroke-width="3.4"/>
      <path d="M25 16 v-5 a2 2 0 0 1 2 -2 h10 a2 2 0 0 1 2 2 v5" stroke-width="2.6"/>
      <path d="M13 16 l3.5 38 a4 4 0 0 0 4 3.6 h23 a4 4 0 0 0 4 -3.6 L51 16 z" ${f(C.metal)}/>
      <path d="M25 26 l1 23 M39 26 l-1 23 M32 26 v23" stroke="${C.slate}" stroke-width="2.4"/>`,
  },
  'id-card': {
    tags: 'identity authentication badge login',
    svg: `<rect x="5" y="13" width="54" height="38" rx="4" ${f(C.lblue)}/>
      <rect x="11" y="21" width="16" height="20" rx="2" ${f(C.white)} stroke-width="2"/>
      <circle cx="19" cy="28" r="3.6" ${f(C.skin)} stroke-width="1.6"/>
      <path d="M13 40 a6 5 0 0 1 12 0" ${f(C.blue)} stroke-width="1.6"/>
      ${line(33, 25, 52, 25, 2.6, C.navy)}${line(33, 32, 50, 32, 2.2, C.slate)}${line(33, 39, 45, 39, 2.2, C.slate)}`,
  },
  network: {
    tags: 'topology nodes graph lan connections',
    svg: `<path d="M32 18 L14 44 M32 18 L50 44 M14 46 H50" stroke-width="2.6"/>
      <rect x="23" y="7" width="18" height="14" rx="3" ${f(C.blue)}/>
      <rect x="5" y="39" width="18" height="14" rx="3" ${f(C.green)}/>
      <rect x="41" y="39" width="18" height="14" rx="3" ${f(C.orange)}/>`,
  },
  // ---------------- round 2: mail, places, security ----------------
  postcard: {
    tags: 'postcard unencrypted plain message visible',
    svg: `<rect x="4" y="13" width="56" height="38" rx="2.5" ${f(C.paper)}/>
      <rect x="8.5" y="17.5" width="21" height="15" rx="1" ${f(C.lblue)} stroke-width="1.8"/>
      <path d="M9.3 31.7 l6 -7 l4 4.5 l3 -3 l6.4 5.5 z" ${f(C.green)} stroke="none"/>
      ${dot(24.5, 21.5, 2, C.yellow)}
      ${line(9, 38, 28, 38, 2, C.slate)}${line(9, 44, 24, 44, 2, C.slate)}
      ${line(34, 18, 34, 46, 1.8, C.metal2)}
      <rect x="46" y="17" width="9.5" height="11" rx="0.8" ${f(C.red)} stroke-width="1.8"/>
      <path d="M48.5 24 l2 -3 l2.5 3.5" stroke="#ffffff" stroke-width="1.4"/>
      ${line(38, 35, 55, 35, 2, C.slate)}${line(38, 41, 55, 41, 2, C.slate)}${line(38, 47, 50, 47, 2, C.slate)}`,
  },
  'sealed-envelope': {
    tags: 'encrypted private letter sealed confidential tls',
    svg: `<rect x="6" y="15" width="52" height="36" rx="3.5" ${f(C.lyellow)}/>
      <path d="M7.5 17 L32 36 L56.5 17" ${f('#fbe39c')}/>
      <circle cx="32" cy="35" r="8" ${f(C.dred)}/>
      <circle cx="32" cy="35" r="4.2" fill="none" stroke="${C.lred}" stroke-width="1.6"/>
      <path d="M26 41 l-2 6 l4 -1.5 M38 41 l2 6 l-4 -1.5" ${f(C.dred)} stroke-width="1.8"/>`,
  },
  'open-envelope': {
    tags: 'opened letter read message decrypted',
    svg: `<path d="M7 29 L32 9 L57 29 Z" ${f('#fbe39c')}/>
      <rect x="15" y="15" width="34" height="26" rx="1.5" ${f(C.white)}/>
      ${line(20, 22, 44, 22, 2.2, C.slate)}${line(20, 28, 44, 28, 2.2, C.slate)}${line(20, 34, 36, 34, 2.2, C.slate)}
      <path d="M7 29 L32 45 L57 29 V52 a3 3 0 0 1 -3 3 H10 a3 3 0 0 1 -3 -3 Z" ${f(C.lyellow)}/>
      <path d="M8 54 L27 41.5 M56 54 L37 41.5" stroke-width="2"/>`,
  },
  'address-book': {
    tags: 'phone book directory contacts lookup dns names',
    svg: `<rect x="13" y="5" width="40" height="54" rx="4" ${f(C.blue)}/>
      <path d="M53 12 h4 v9 h-4 M53 24 h4 v9 h-4 M53 36 h4 v9 h-4" stroke-width="2"/>
      <path d="M53.5 12.5 h3 v8 h-3 z" fill="${C.red}" stroke="none"/><path d="M53.5 24.5 h3 v8 h-3 z" fill="${C.yellow}" stroke="none"/><path d="M53.5 36.5 h3 v8 h-3 z" fill="${C.green}" stroke="none"/>
      ${[14, 24, 34, 44].map((y) => `<path d="M9 ${y} h8" stroke-width="3"/>`).join('')}
      <rect x="22" y="12" width="24" height="30" rx="2" ${f(C.white)} stroke-width="2"/>
      <circle cx="34" cy="22" r="4.5" ${f(C.skin)} stroke-width="1.8"/>
      <path d="M26.5 35 a7.5 6.5 0 0 1 15 0 z" ${f(C.lblue)} stroke-width="1.8"/>
      ${line(24, 50, 44, 50, 2.4, '#ffffff')}`,
  },
  signpost: {
    tags: 'direction routing way sign path',
    svg: `<rect x="29" y="8" width="6" height="50" rx="1.5" ${f(C.brown)}/>
      <path d="M13 12 H44 L51 18.5 L44 25 H13 Z" ${f(C.yellow)}/>
      <path d="M51 29 H20 L13 35.5 L20 42 H51 Z" ${f(C.green)}/>
      ${line(18, 18.5, 38, 18.5, 2, C.gold)}${line(24, 35.5, 45, 35.5, 2, C.dgreen)}
      <path d="M18 58 H46" stroke-width="3"/>`,
  },
  map: {
    tags: 'route navigation location plan',
    svg: `<path d="M5 14 L22 8 L42 14 L59 8 V50 L42 56 L22 50 L5 56 Z" ${f(C.lgreen)}/>
      <path d="M22 8 L42 14 V56 L22 50 Z" ${f('#bfe5c8')}/>
      <path d="M11 46 C18 40 24 44 30 36 S42 28 47 22" stroke="${C.red}" stroke-width="2.4" stroke-dasharray="4 4"/>
      <path d="M44 16 l7 7 M51 16 l-7 7" stroke="${C.dred}" stroke-width="3"/>`,
  },
  'padlock-open': {
    tags: 'unlocked open insecure unencrypted',
    svg: `${tube('M43 30 V19 a11 11 0 0 0 -22 0 V23', C.metal2, 3.6)}
      <rect x="13" y="29" width="38" height="28" rx="4.5" ${f(C.green)}/>
      <circle cx="32" cy="40" r="4" ${f(C.darker)} stroke="none"/>
      <path d="M30.5 42 h3 l1 7 h-5 z" ${f(C.darker)} stroke="none"/>
      ${line(18, 33, 18, 52, 2.2, '#ffffff')}`,
  },
  eavesdropper: {
    tags: 'spy attacker mitm snooping mask threat',
    svg: `<path d="M12 61 C13 51 21 47 32 48 C43 47 51 51 52 61 Z" ${f(C.slate)}/>
      <path d="M26 48 L32 56 L38 48" ${f(C.metal)} stroke-width="2"/>
      <circle cx="32" cy="34" r="15" ${f(C.skin)}/>
      <path d="M17 33 h30" stroke-width="2.2"/>
      <rect x="19" y="30" width="11" height="7" rx="3" ${f(C.darker)}/>
      <rect x="34" y="30" width="11" height="7" rx="3" ${f(C.darker)}/>
      <path d="M28 43 q4 -2 8 0" stroke-width="2"/>
      <ellipse cx="32" cy="23" rx="23" ry="4.5" ${f(C.darker)}/>
      <path d="M19 22 C19 9 45 9 45 22 Z" ${f(C.darker)}/>
      <path d="M19.6 18 C27 20 37 20 44.4 18" stroke="${C.red}" stroke-width="3"/>`,
  },
  passport: {
    tags: 'identity verify certificate authority travel document',
    svg: `<rect x="13" y="5" width="36" height="52" rx="4" ${f('#3f5f9e')}/>
      <circle cx="31" cy="24" r="8.5" fill="none" stroke="${C.gold}" stroke-width="2.2"/>
      <path d="M22.5 24 h17 M31 15.5 v17" stroke="${C.gold}" stroke-width="1.6"/>
      ${line(21, 40, 41, 40, 2.4, C.gold)}${line(24, 46, 38, 46, 2, C.gold)}
      <g transform="rotate(-14 47 47)"><circle cx="47" cy="47" r="10" ${f(C.lred)} fill-opacity=".85" stroke="${C.dred}" stroke-width="2.2"/>
      <circle cx="47" cy="47" r="6" fill="none" stroke="${C.dred}" stroke-width="1.4"/>
      <path d="M43.5 47 l2.4 2.4 l4.5 -5" stroke="${C.dred}" stroke-width="2"/></g>`,
  },
  stamp: {
    tags: 'seal approve sign official',
    svg: `<circle cx="32" cy="11" r="6.5" ${f(C.brown)}/>
      <path d="M28 17 h8 l2 11 h-12 z" ${f(C.lbrown)}/>
      <rect x="13" y="28" width="38" height="10" rx="2.5" ${f(C.dbrown)}/>
      <rect x="11" y="38" width="42" height="6" rx="1.5" ${f(C.red)}/>
      <path d="M13 53 h38" stroke="${C.red}" stroke-width="3" stroke-dasharray="6 4"/>`,
  },
  apartment: {
    tags: 'building flats many tenants shared hosting',
    svg: `<rect x="13" y="7" width="38" height="51" rx="2" ${f(C.lorange)}/>
      <path d="M11 7 h42" stroke-width="3"/>
      ${[13, 23, 33].map((y) => [18, 28.5, 39].map((x) => `<rect x="${x}" y="${y}" width="7" height="6.5" rx="1" ${f(C.glass)} stroke-width="1.8"/>`).join('')).join('')}
      <rect x="18" y="43" width="7" height="6.5" rx="1" ${f(C.glass)} stroke-width="1.8"/>
      <rect x="39" y="43" width="7" height="6.5" rx="1" ${f(C.glass)} stroke-width="1.8"/>
      <rect x="28" y="44" width="8" height="14" rx="1" ${f(C.brown)}/>
      <path d="M6 58 H58" stroke-width="3"/>`,
  },
  ship: {
    tags: 'container ship shipping transport docker',
    svg: `<rect x="17" y="27" width="9" height="10" ${f(C.blue)} stroke-width="1.8"/><rect x="26" y="27" width="9" height="10" ${f(C.orange)} stroke-width="1.8"/>
      <rect x="35" y="27" width="9" height="10" ${f(C.green)} stroke-width="1.8"/><rect x="44" y="27" width="9" height="10" ${f(C.red)} stroke-width="1.8"/>
      <rect x="26" y="18" width="9" height="9" ${f(C.yellow)} stroke-width="1.8"/><rect x="35" y="18" width="9" height="9" ${f(C.blue)} stroke-width="1.8"/>
      <rect x="7" y="21" width="9" height="16" rx="1" ${f(C.white)}/>
      <rect x="9.5" y="24" width="4" height="3.5" ${f(C.glass)} stroke-width="1.4"/>
      <path d="M3 37 H61 L54 50 H11 Z" ${f(C.dred)}/>
      ${line(8, 43, 57, 43, 2, '#ffffff')}
      <path d="M3 57 q4 -3 8 0 t8 0 t8 0 t8 0 t8 0 t8 0 t8 0" stroke="${C.blue}" stroke-width="2.6"/>`,
  },
  crane: {
    tags: 'deploy build lift construction orchestration',
    svg: `<path d="M20 12 V58 M26 12 V58 M20 18 L26 24 L20 30 L26 36 L20 42 L26 48 L20 54" stroke="${I}" stroke-width="2"/>
      <rect x="18.5" y="12" width="9" height="46" ${f('none')} stroke-width="2.4"/>
      <path d="M6 10 H58 V16 H6 Z" ${f(C.yellow)}/>
      <path d="M12 10 L14 16 M22 10 L24 16 M32 10 L34 16 M42 10 L44 16 M52 10 L54 16" stroke-width="1.6"/>
      <rect x="6" y="16" width="9" height="7" ${f(C.slate)}/>
      <path d="M48 16 V34" stroke-width="2"/>
      <path d="M44 34 h8 l-1 3 h-6 z" ${f(C.darker)} stroke-width="1.6"/>
      <rect x="38" y="37" width="20" height="12" rx="1" ${f(C.orange)}/>
      ${line(43, 39.5, 43, 46.5, 1.6)}${line(48, 39.5, 48, 46.5, 1.6)}${line(53, 39.5, 53, 46.5, 1.6)}
      <path d="M12 58 H34" stroke-width="3.4"/>`,
  },
  'virtual-machine': {
    tags: 'vm guest os virtualization computer in a box',
    svg: `<rect x="4" y="7" width="56" height="50" rx="5" ${f(C.lpurple)} stroke-dasharray="5 3.4"/>
      <rect x="4" y="7" width="15" height="7" rx="2" ${f(C.purple)} stroke-width="1.8"/>
      <rect x="13" y="19" width="38" height="25" rx="2.5" ${f(C.dark)}/>
      <rect x="16" y="22" width="32" height="19" rx="1" ${f(C.screen)} stroke-width="1.4"/>
      ${glare('21,41 30,22 35,22 26,41')}
      <path d="M28 44 l-2 5 h12 l-2 -5" ${f(C.metal2)} stroke-width="2"/>`,
  },
  hypervisor: {
    tags: 'virtualization layers host vms stack',
    svg: `<path d="M6 44 L32 56 L58 44 L32 32 Z" ${f(C.slate)}/>
      <path d="M6 44 V49 L32 61 V56 Z M58 44 V49 L32 61 V56 Z" ${f(C.dark)} stroke-width="2"/>
      <path d="M10 34 L32 44 L54 34 L32 24 Z" ${f(C.purple)}/>
      <path d="M10 34 V38 L32 48 V44 Z M54 34 V38 L32 48 V44 Z" ${f('#8d6fc4')} stroke-width="2"/>
      <path d="M14 20 L23 24 L32 20 L23 16 Z" ${f(C.lblue)} stroke-width="2"/><path d="M14 20 V28 L23 32 V24 Z" ${f(C.blue)} stroke-width="2"/><path d="M32 20 V28 L23 32 V24 Z" ${f(C.navy)} stroke-width="2"/>
      <path d="M32 20 L41 24 L50 20 L41 16 Z" ${f(C.lgreen)} stroke-width="2"/><path d="M32 20 V28 L41 32 V24 Z" ${f(C.green)} stroke-width="2"/><path d="M50 20 V28 L41 32 V24 Z" ${f(C.dgreen)} stroke-width="2"/>`,
  },
  layers: {
    tags: 'stack levels tiers osi',
    svg: `<path d="M5 44 L32 56 L59 44 L32 32 Z" ${f(C.yellow)}/>
      <path d="M5 32 L32 44 L59 32 L32 20 Z" ${f(C.green)}/>
      <path d="M5 20 L32 32 L59 20 L32 8 Z" ${f(C.blue)}/>`,
  },
  blueprint: {
    tags: 'image template plan container image design',
    svg: `<path d="M6 8 H50 L58 16 V56 H6 Z" ${f(C.navy)}/>
      <path d="M50 8 V16 H58" ${f('#6e95cf')}/>
      <path d="M12 20 H52 M12 30 H52 M12 40 H52 M22 12 V52 M32 12 V52 M42 12 V52" stroke="#ffffff" stroke-opacity=".22" stroke-width="1.2"/>
      <path d="M17 47 V31 L29 22 L41 31 V47 Z M25 47 V38 H33 V47" fill="none" stroke="#ffffff" stroke-width="2.2"/>
      <path d="M45 47 V31 M43.5 31 h3 M43.5 47 h3" stroke="#ffffff" stroke-width="1.6"/>`,
  },
  tree: {
    tags: 'branching hierarchy git branches growth',
    svg: `<path d="M29 58 V40 L22 33 M35 58 V38 L42 31 M32 44 V30" ${f('none')} stroke="${C.dbrown}" stroke-width="6.5"/>
      <path d="M29 58 V40 L22 33 M35 58 V38 L42 31 M32 44 V30" ${f('none')} stroke="${C.brown}" stroke-width="2.6"/>
      <path d="M32 5 C41 5 47 11 47 18 C54 19 58 25 56 31 C55 37 49 40 43 38 C40 42 35 43 32 41 C28 43 23 42 20 38 C13 40 7 35 8 29 C8 23 13 20 17 19 C17 11 23 5 32 5 Z" ${f(C.green)}/>
      <path d="M20 24 c2 -4 6 -6 10 -6 M38 15 c3 0 6 2 7 5" stroke="#ffffff" stroke-opacity=".7" stroke-width="2.4"/>
      <path d="M22 58 H42" stroke-width="3"/>`,
  },
  merge: {
    tags: 'git merge join combine branches',
    // main line with a feature branch that leaves and joins back (merge commit in green)
    svg: `<path d="M20 6 V58" stroke-width="3.2"/>
      ${tube('M20 17 C20 26 44 22 44 31 C44 40 20 38 20 47', C.purple, 3)}
      <circle cx="20" cy="12" r="5.5" ${f(C.orange)}/>
      <circle cx="44" cy="31" r="6" ${f(C.purple)}/>
      <circle cx="20" cy="49" r="7.5" ${f(C.green)}/>
      <path d="M16.5 49 l2.5 2.5 l4.5 -5" stroke="${I}" stroke-width="2"/>`,
  },
  commit: {
    tags: 'git commit snapshot save point history',
    svg: `<path d="M4 32 H22 M42 32 H60" stroke-width="3.4"/>
      <circle cx="32" cy="32" r="11" ${f(C.orange)}/>
      <circle cx="32" cy="32" r="4" ${f('#ffffff')} stroke-width="2"/>`,
  },
  tag: {
    tags: 'label version release price tag',
    svg: `<path d="M33 7 H54 a3 3 0 0 1 3 3 V31 L31 57 L7 33 Z" ${f(C.yellow)}/>
      <circle cx="46" cy="18" r="4.2" ${f(C.paper)}/>
      <path d="M46 18 C50 10 58 8 62 12" stroke-width="2"/>
      ${line(21, 33, 31, 23, 2.4, C.gold)}${line(26, 38, 36, 28, 2.4, C.gold)}`,
  },
  cloche: {
    tags: 'waiter serving tray dish api response deliver',
    svg: `<path d="M9 45 A23 21 0 0 1 55 45 Z" ${f(C.metal)}/>
      <circle cx="32" cy="21" r="3.6" ${f(C.metal2)}/>
      <path d="M17 38 a17 15 0 0 1 11 -11" stroke="#ffffff" stroke-width="3"/>
      <rect x="3" y="45" width="58" height="6" rx="3" ${f(C.metal2)}/>
      <path d="M22 51 v5 M42 51 v5 M18 56 h28" stroke-width="2.6"/>`,
  },
  menu: {
    tags: 'menu card options endpoints list documentation',
    svg: `<rect x="14" y="5" width="36" height="54" rx="3" ${f(C.paper)}/>
      <path d="M14 16 V8 a3 3 0 0 1 3 -3 h30 a3 3 0 0 1 3 3 v8 z" ${f(C.red)}/>
      ${line(24, 10.5, 40, 10.5, 2.2, '#ffffff')}
      ${[23, 31, 39, 47].map((y) => `${line(19, y, 34, y, 2.2, C.slate)}${dot(39, y, 1.2, C.slate)}${dot(42, y, 1.2, C.slate)}${line(44.5, y, 45.5, y, 2.4, C.dgreen)}`).join('')}`,
  },
  'chef-hat': {
    tags: 'kitchen chef cook server backend',
    svg: `<path d="M18 36 C9 35 6 25 12 20 C15 17 19 16 22 18 C23 11 28 7 33 8 C38 8 42 11 43 17 C47 15 53 17 55 22 C57 29 52 35 46 36 Z" ${f(C.white)}/>
      <rect x="18" y="36" width="28" height="18" rx="2" ${f(C.white)}/>
      <path d="M18 43 H46" stroke-width="2"/>
      <path d="M26 30 v6 M32 28 v8 M38 30 v6" stroke="${C.metal2}" stroke-width="2"/>`,
  },
  receipt: {
    tags: 'ticket bill order confirmation token',
    svg: `<path d="M14 5 H50 V58 l-4 -3 l-4 3 l-4 -3 l-4 3 l-4 -3 l-4 3 l-4 -3 l-4 3 l-4 -3 l-4 3 Z" ${f(C.white)}/>
      ${line(20, 14, 44, 14, 2.6, C.navy)}
      ${line(20, 23, 34, 23, 2, C.slate)}${line(39, 23, 44, 23, 2, C.slate)}
      ${line(20, 30, 32, 30, 2, C.slate)}${line(39, 30, 44, 30, 2, C.slate)}
      ${line(20, 37, 35, 37, 2, C.slate)}${line(39, 37, 44, 37, 2, C.slate)}
      <path d="M20 44 H44" stroke-width="1.6" stroke-dasharray="2.5 2.5"/>
      ${line(20, 50, 28, 50, 2.8)}${line(37, 50, 44, 50, 2.8)}`,
  },
  json: {
    tags: 'json data document braces api payload',
    svg: `<path d="M13 5 H40 L51 16 V59 H13 Z" ${f(C.white)}/>
      <path d="M40 5 V16 H51" ${f(C.lpurple)}/>
      <path d="M26 24 c-4 0 -4 2 -4 5 v4 c0 2 -1 3 -3 3 c2 0 3 1 3 3 v4 c0 3 0 5 4 5" stroke="${C.purple}" stroke-width="3"/>
      <path d="M38 24 c4 0 4 2 4 5 v4 c0 2 1 3 3 3 c-2 0 -3 1 -3 3 v4 c0 3 0 5 -4 5" stroke="${C.purple}" stroke-width="3"/>
      ${dot(29, 36, 1.8, C.slate)}${dot(35, 36, 1.8, C.slate)}`,
  },
  lightning: {
    tags: 'cache fast speed power instant',
    svg: `<path d="M37 4 L13 36 H29 L25 60 L51 25 H35 Z" ${f(C.yellow)} stroke-width="2.6"/>
      <path d="M33 11 L21 30" stroke="#ffffff" stroke-width="2.4" stroke-opacity=".8"/>`,
  },
  stopwatch: {
    tags: 'timer latency ttl timeout measure',
    svg: `<rect x="27" y="3" width="10" height="6" rx="1.5" ${f(C.metal2)}/>
      <path d="M32 9 v4" stroke-width="3"/>
      <path d="M49 13 l4 -4" stroke-width="3.4"/>
      <circle cx="32" cy="37" r="23" ${f(C.orange)}/>
      <circle cx="32" cy="37" r="18" ${f(C.white)}/>
      <path d="M32 37 V19 A18 18 0 0 1 47.6 28 Z" ${f(C.lorange)} stroke="none"/>
      <path d="M32 22 v3 M47 37 h-3 M32 52 v-3 M17 37 h3" stroke-width="2"/>
      <path d="M32 37 L42 29" stroke="${C.dred}" stroke-width="3"/>
      ${dot(32, 37, 2.6, I)}`,
  },
  cookie: {
    tags: 'cookie session browser state tracking',
    svg: `<path d="M55.6 29.8 A24 24 0 1 1 44 13.2 A8 8 0 0 0 51 18 A6 6 0 0 0 55.6 29.8 Z" ${f(C.lbrown)}/>
      ${dot(22, 26, 3, C.dbrown)}${dot(33, 22, 2.4, C.dbrown)}${dot(18, 40, 2.6, C.dbrown)}${dot(30, 36, 3.2, C.dbrown)}${dot(42, 42, 2.6, C.dbrown)}${dot(30, 49, 2.4, C.dbrown)}${dot(44, 30, 2, C.dbrown)}`,
  },
};

Object.assign(ICONS, {
  bookmark: {
    tags: 'bookmark ribbon marker git branch pointer',
    svg: `<path d="M12 10 h26 v40 H12 z" ${f(C.white)}/>
      ${line(17, 18, 33, 18, 2, C.slate)}${line(17, 25, 33, 25, 2, C.slate)}${line(17, 32, 30, 32, 2, C.slate)}
      <path d="M31 4 H48 V58 L39.5 50 L31 58 Z" ${f(C.red)}/>
      <path d="M35 8 V46" stroke="#ffffff" stroke-opacity=".6" stroke-width="2.2"/>`,
  },
  port: {
    tags: 'port socket door network port number listen',
    svg: `<rect x="8" y="10" width="48" height="44" rx="6" ${f(C.metal)}/>
      <path d="M20 24 h24 v14 h-5 v5 h-14 v-5 h-5 z" ${f(C.darker)}/>
      ${[24, 28.5, 33, 37.5, 42].map((xx) => `<path d="M${xx - 1.2} 25.5 v4" stroke="${C.gold}" stroke-width="2"/>`).join('')}
      ${dot(15, 16, 2, C.green)}${dot(49, 16, 2, C.slate)}
      <rect x="21" y="46" width="22" height="5" rx="2" ${f(C.white)} stroke-width="1.6"/>`,
  },
  'key-pair': {
    tags: 'public private key pair asymmetric crypto',
    svg: `${tube('M22 33 L40 51', C.yellow, 3.6)}${tube('M34 45 L37.5 41.5', C.yellow, 3)}
      <circle cx="17" cy="27" r="10.5" ${f(C.yellow)}/><circle cx="14" cy="24" r="3" ${f(C.paper)}/>
      ${tube('M44 26 L58 40', C.blue, 3.6)}${tube('M53 35 L56 32', C.blue, 3)}
      <circle cx="40" cy="21" r="10.5" ${f(C.blue)}/><circle cx="37" cy="18" r="3" ${f(C.paper)}/>`,
  },
});

/** alternative names that resolve to an existing drawing */
export const ICON_ALIASES = {
  'phone-book': 'address-book',
  spy: 'eavesdropper',
  mask: 'eavesdropper',
  house: 'home',
  vm: 'virtual-machine',
  'container-image': 'blueprint',
  waiter: 'cloche',
  'serving-tray': 'cloche',
  kitchen: 'chef-hat',
  ticket: 'receipt',
  cache: 'lightning',
  'id-badge': 'id-card',
  'padlock': 'lock',
  'unlock': 'padlock-open',
  'sealed-letter': 'sealed-envelope',
  socket: 'port',
  ribbon: 'bookmark',
  keys: 'key-pair',
};

/** Lucide fallback: authors may write "lucide:<name>". The line icon is restyled to the
 *  kit's ink stroke and set on a soft pastel disc so it sits in the same family. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const LUCIDE_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../node_modules/lucide-static/icons');

export function lucideExists(name) {
  return /^[a-z0-9-]+$/.test(name) && fs.existsSync(path.join(LUCIDE_DIR, `${name}.svg`));
}

function lucideInner(name) {
  const raw = fs.readFileSync(path.join(LUCIDE_DIR, `${name}.svg`), 'utf8');
  const m = raw.match(/<svg[^>]*>([\s\S]*)<\/svg>/);
  return m ? m[1] : '';
}

export function iconExists(name) {
  if (typeof name !== 'string') return false;
  if (name.startsWith('lucide:')) return lucideExists(name.slice(7));
  return Object.prototype.hasOwnProperty.call(ICONS, name) || Object.prototype.hasOwnProperty.call(ICON_ALIASES, name);
}

/** returns the inner markup for a 64x64 viewBox */
export function iconInner(name) {
  if (name.startsWith('lucide:')) {
    const inner = lucideInner(name.slice(7));
    return `<circle cx="32" cy="32" r="28" fill="${C.lblue}" stroke="none"/>
      <g transform="translate(12 12) scale(1.6667)" fill="none" stroke="${I}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${inner}</g>`;
  }
  return ICONS[ICON_ALIASES[name] || name].svg;
}

/** full <svg> for an icon */
export function iconSvg(name, cls = 'ico') {
  return `<svg class="${cls}" viewBox="0 0 64 64" aria-hidden="true"><g fill="none" stroke="${I}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${iconInner(name)}</g></svg>`;
}

export const ICON_NAMES = Object.keys(ICONS);
