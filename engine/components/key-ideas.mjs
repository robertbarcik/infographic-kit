import { text, icon, list, obj, role } from '../lib/schema.mjs';

export default {
  name: 'key-ideas',
  summary: 'icon + heading + two-line text cards (stacked; two columns when the section is wide)',
  labelRequired: true,
  fields: {
    items: list(obj({ icon: icon(), heading: text(22), text: text(110), role: role({ doc: 'default cycles rose, yellow, green, blue, purple' }) }), 2, 6),
  },
  defaultRole: () => 'info',
  example: {
    label: 'Key ideas', component: 'key-ideas',
    items: [{ icon: 'document', heading: 'Syntax', text: 'Format of the data. E.g. message fields, headers.' }, { icon: 'speech', heading: 'Meaning', text: 'What the data represents.' }],
  },
  render(sec, ctx) {
    return `<div class="kideas n${sec.items.length}">${sec.items.map((it, i) => `<div class="kidea ${ctx.rc(ctx.role(it.role, i, 'cards'))}" data-rough="soft" data-box>
        <div class="ki-icon">${ctx.icon(it.icon)}</div>
        <div class="ki-main">${ctx.t(it.heading, 'ki-head', `items[${i}].heading`)}${ctx.t(it.text, 'ki-text', `items[${i}].text`)}</div>
      </div>`).join('')}</div>`;
  },
};
