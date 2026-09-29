import { text, optText, enumOf, icon, list, obj } from '../lib/schema.mjs';

// Icons + arrows laid out by the engine (no coordinates in specs):
//   hub : nodes[0] in the centre, others around it; "side" picks left/right/top/bottom
//   fan : nodes[0] asks on the left, nodes[1] is the hub, the rest fan out on the right in order
//   row : left to right, edges only between neighbours
const MAX = { hub: 6, fan: 6, row: 5 };
const SIDES = ['left', 'right', 'top', 'bottom'];

export default {
  name: 'illustration',
  summary: 'picture from icons + arrows: hub (centre + satellites by side), fan (asker -> hub -> numbered targets), row; two-way and numbered edges, optional legend',
  labelRequired: true,
  fields: {
    layout: enumOf(['hub', 'fan', 'row'], { default: 'hub', doc: 'hub: nodes[0] centre; fan: nodes[0] asker left, nodes[1] hub, rest fanned right top-to-bottom; row: left to right' }),
    nodes: list(obj({
      id: text(16, { doc: 'short id used by edges (letters, digits, -)' }),
      icon: icon(),
      label: optText(30, { lines: 2 }),
      side: enumOf(SIDES, { doc: 'hub only: where this satellite sits (default alternates left, right)' }),
    }), 2, 6),
    edges: { ...list(obj({
      from: text(16), to: text(16),
      label: optText(18, { doc: 'placed by the engine clear of arrows and labels' }),
      kind: enumOf(['request', 'response', 'neutral'], { doc: 'colour meaning (default: request if "back" is given, else neutral)' }),
      line: enumOf(['solid', 'dashed'], { default: 'solid' }),
      back: optText(18, { doc: 'draws a second arrow back along the same edge (a response), with this label' }),
      step: optText(2, { doc: 'number badge, e.g. "1"; placed near the start, clear of the arrowhead' }),
    }), 1, 6), required: false },
    legend: { ...list(obj({ kind: enumOf(['request', 'response', 'neutral'], { required: true }), line: enumOf(['solid', 'dashed'], { default: 'solid' }), text: text(28) }), 1, 3), required: false, doc: 'tiny key explaining the arrow styles' },
    text: optText(200, { doc: 'explanation under the picture' }),
  },
  defaultRole: () => 'accent',
  check(sec, where, errs) {
    const lay = sec.layout || 'hub';
    const ids = new Set();
    const nodes = sec.nodes || [];
    nodes.forEach((n, i) => {
      if (!n || typeof n.id !== 'string') return;
      if (!/^[A-Za-z0-9-]+$/.test(n.id)) errs.push(`${where}.nodes[${i}].id: use letters, digits and - only`);
      if (ids.has(n.id)) errs.push(`${where}.nodes[${i}].id: duplicate id "${n.id}"`);
      ids.add(n.id);
      if (n.side && lay !== 'hub') errs.push(`${where}.nodes[${i}].side: "side" only applies to layout "hub"`);
      if (n.side && i === 0) errs.push(`${where}.nodes[0].side: the first node is the centre of the hub`);
    });
    if (nodes.length > MAX[lay]) errs.push(`${where}: layout "${lay}" allows at most ${MAX[lay]} nodes`);
    if (lay === 'fan' && nodes.length < 3) errs.push(`${where}: layout "fan" needs an asker, a hub and at least one target`);
    if (lay === 'hub') {
      const bySide = {};
      nodes.slice(1).forEach((n, i) => { const s = (n && n.side) || (i % 2 ? 'right' : 'left'); bySide[s] = (bySide[s] || 0) + 1; });
      for (const [s, c] of Object.entries(bySide)) if (c > ((s === 'top' || s === 'bottom') ? 3 : 2)) errs.push(`${where}: too many nodes on side "${s}" (max ${(s === 'top' || s === 'bottom') ? 3 : 2})`);
    }
    const order = nodes.map((n) => n && n.id);
    (sec.edges || []).forEach((e, i) => {
      if (!e) return;
      for (const k of ['from', 'to']) if (e[k] && !ids.has(e[k])) errs.push(`${where}.edges[${i}].${k}: no node with id "${e[k]}"`);
      if (e.from && e.from === e.to) errs.push(`${where}.edges[${i}]: from and to are the same node`);
      if (e.step && !/^[0-9]{1,2}$/.test(e.step)) errs.push(`${where}.edges[${i}].step: a number such as "1"`);
      if (lay === 'row' && e.from && e.to && Math.abs(order.indexOf(e.from) - order.indexOf(e.to)) !== 1) errs.push(`${where}.edges[${i}]: in a "row" layout edges may only join neighbouring nodes`);
      if (lay === 'hub' && e.from && e.to && e.from !== order[0] && e.to !== order[0]) errs.push(`${where}.edges[${i}]: in a "hub" layout every edge touches the centre node "${order[0]}"`);
      if (lay === 'fan' && e.from && e.to && e.from !== order[1] && e.to !== order[1]) errs.push(`${where}.edges[${i}]: in a "fan" layout every edge touches the hub "${order[1]}"`);
    });
  },
  example: {
    label: 'Who does the walking', component: 'illustration', layout: 'fan',
    nodes: [
      { id: 'laptop', icon: 'laptop', label: 'Your laptop' }, { id: 'resolver', icon: 'server-rack', label: 'Resolver' },
      { id: 'root', icon: 'globe', label: 'Root' }, { id: 'tld', icon: 'address-book', label: '.com TLD' }, { id: 'auth', icon: 'server', label: 'Authoritative' },
    ],
    edges: [
      { from: 'laptop', to: 'resolver', label: 'name?', back: 'address' },
      { from: 'resolver', to: 'root', step: '1', back: 'ask .com' }, { from: 'resolver', to: 'tld', step: '2' }, { from: 'resolver', to: 'auth', step: '3' },
    ],
  },
  render(sec, ctx) {
    const lay = sec.layout || 'hub';
    const nodeHtml = (n, i, extra = '') => `<div class="node${extra}" data-node="${ctx.esc(n.id)}" data-box>
        <div class="node-icon">${ctx.icon(n.icon)}</div>
        ${n.label ? ctx.t(n.label, 'node-label', `nodes[${i}].label`) : ''}
      </div>`;
    let stage;
    if (lay === 'hub') {
      const slots = { left: [], right: [], top: [], bottom: [] };
      sec.nodes.slice(1).forEach((n, k) => slots[n.side || (k % 2 ? 'right' : 'left')].push(nodeHtml(n, k + 1)));
      const used = Object.fromEntries(Object.entries(slots).map(([s, a]) => [s, a.length > 0]));
      stage = `<div class="ill-stage lay-hub${used.top ? ' has-top' : ''}${used.bottom ? ' has-bottom' : ''}${used.left ? ' has-left' : ''}${used.right ? ' has-right' : ''} role-example" data-rough="soft" data-box>
        ${Object.entries(slots).map(([s, a]) => (a.length ? `<div class="slot slot-${s}">${a.join('')}</div>` : '')).join('')}
        <div class="slot slot-centre">${nodeHtml(sec.nodes[0], 0, ' centre')}</div>
        ${edges(sec, ctx)}</div>`;
    } else if (lay === 'fan') {
      stage = `<div class="ill-stage lay-fan role-example" data-rough="soft" data-box>
        <div class="slot slot-asker">${nodeHtml(sec.nodes[0], 0)}</div>
        <div class="slot slot-centre">${nodeHtml(sec.nodes[1], 1, ' centre')}</div>
        <div class="slot slot-targets">${sec.nodes.slice(2).map((n, k) => nodeHtml(n, k + 2)).join('')}</div>
        ${edges(sec, ctx)}</div>`;
    } else {
      stage = `<div class="ill-stage lay-row role-example" data-rough="soft" data-box>${sec.nodes.map((n, i) => nodeHtml(n, i)).join('')}${edges(sec, ctx)}</div>`;
    }
    const legend = sec.legend
      ? `<div class="ill-legend">${sec.legend.map((l, i) => `<div class="lg-item"><div class="lg-line" data-rough="arrow" data-dir="right" data-tone="${l.kind}" data-dash="${l.line === 'dashed' ? 1 : 0}"></div>${ctx.t(l.text, 'lg-t', `legend[${i}].text`)}</div>`).join('')}</div>`
      : '';
    return `<div class="ill">${stage}${legend}${sec.text ? ctx.t(sec.text, 'ill-text', 'text') : ''}</div>`;
  },
};

function edges(sec, ctx) {
  return (sec.edges || []).map((e, i) => {
    const kind = e.kind || (e.back ? 'request' : 'neutral');
    return `<div class="edge" hidden data-from="${ctx.esc(e.from)}" data-to="${ctx.esc(e.to)}" data-tone="${kind}" data-dash="${e.line === 'dashed' ? 1 : 0}" data-i="${i}"${e.back !== undefined ? ' data-back="1"' : ''}></div>
      ${e.label ? `<div class="edge-label" data-for="${i}" data-box>${ctx.t(e.label, 'edge-label-t', `edges[${i}].label`)}</div>` : ''}
      ${e.back ? `<div class="edge-label back" data-for="${i}b" data-box>${ctx.t(e.back, 'edge-label-t', `edges[${i}].back`)}</div>` : ''}
      ${e.step ? `<div class="edge-step on-line role-example" data-for="${i}s" data-rough="circle" data-box>${ctx.t(e.step, 'edge-step-t', `edges[${i}].step`)}</div>` : ''}`;
  }).join('');
}
