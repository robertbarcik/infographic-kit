import { text, optText, icon, list, obj, role } from '../lib/schema.mjs';

const side = (doc, def) => obj({ heading: text(24), icon: { ...icon({ required: false }) }, role: role({ doc: `default ${def}` }) }, { doc });

export default {
  name: 'compare',
  summary: 'two columns side by side (A vs B) with matching rows',
  labelRequired: true,
  fields: {
    a: side('left column', 'info (blue)'),
    b: side('right column', 'action (orange)'),
    rows: list(obj({ aspect: optText(18, { doc: 'row label shown on the left, e.g. "Delivery"' }), a: text(70), b: text(70) }), 2, 6),
  },
  defaultRole: () => 'neutral',
  example: {
    label: 'TCP vs UDP', component: 'compare',
    a: { heading: 'TCP', icon: 'check' }, b: { heading: 'UDP', icon: 'clock' },
    rows: [{ aspect: 'Delivery', a: 'guaranteed, in order', b: 'best effort' }, { aspect: 'Used by', a: 'HTTP, SSH', b: 'DNS, video calls' }],
  },
  render(sec, ctx) {
    const ra = sec.a.role || 'info';
    const rb = sec.b.role || 'action';
    const hasAspect = sec.rows.some((r) => r.aspect);
    const head = (s, r, k) => `<div class="cmp-head ${ctx.rc(r)}" data-rough="card" data-box>${s.icon ? ctx.icon(s.icon) : ''}${ctx.t(s.heading, 'cmp-head-t', `${k}.heading`)}</div>`;
    const cells = sec.rows.map((row, i) => `
      ${hasAspect ? `<div class="cmp-aspect">${row.aspect ? ctx.t(row.aspect, 'cmp-aspect-t', `rows[${i}].aspect`) : ''}</div>` : ''}
      <div class="cmp-cell ${ctx.rc(ra)}" data-rough="soft" data-box>${ctx.t(row.a, 'cmp-t', `rows[${i}].a`)}</div>
      <div class="cmp-cell ${ctx.rc(rb)}" data-rough="soft" data-box>${ctx.t(row.b, 'cmp-t', `rows[${i}].b`)}</div>`).join('');
    return `<div class="cmp${hasAspect ? ' has-aspect' : ''}">
      ${hasAspect ? '<div></div>' : ''}${head(sec.a, ra, 'a')}${head(sec.b, rb, 'b')}${cells}</div>`;
  },
};
