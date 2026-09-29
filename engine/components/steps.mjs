import { text, icon, list, obj, role } from '../lib/schema.mjs';

export default {
  name: 'steps',
  summary: 'numbered horizontal flow with arrows; each step: heading, text, icon',
  labelRequired: true,
  fields: {
    items: list(obj({ heading: text(24), text: text(72), icon: { ...icon({ required: false }) }, role: role({ doc: 'default cycles yellow, orange, blue, green, purple' }) }), 2, 6),
  },
  defaultRole: () => 'info',
  example: {
    label: 'Worked example: follow one exchange', component: 'steps',
    items: [{ heading: 'User action', text: 'You open a web page', icon: 'cursor' }, { heading: 'Client process', text: 'Web browser (e.g. Chrome)', icon: 'browser' }],
  },
  render(sec, ctx) {
    const n = sec.items.length;
    return `<div class="steps n${n}">${sec.items.map((it, i) => `${i ? '<div class="st-arrow" data-rough="arrow" data-dir="right" data-tone="action"></div>' : ''}
      <div class="step ${ctx.rc(ctx.role(it.role, i, 'steps'))}" data-rough="panel" data-box>
        <div class="st-head" data-rough="tab" data-box>${ctx.t(`${i + 1}. ${it.heading}`, 'st-head-t', `items[${i}].heading`)}</div>
        ${ctx.t(it.text, 'st-text', `items[${i}].text`)}
        ${it.icon ? `<div class="st-icon">${ctx.icon(it.icon)}</div>` : ''}
      </div>`).join('')}</div>`;
  },
};
