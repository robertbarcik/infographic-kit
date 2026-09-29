import { text, list, obj, role } from '../lib/schema.mjs';

export default {
  name: 'definitions',
  summary: 'term tag + explanation list',
  labelRequired: true,
  fields: {
    items: list(obj({ term: text(14), text: text(96), role: role({ doc: 'default cycles yellow, blue, rose, green' }) }), 2, 6),
  },
  defaultRole: () => 'concept',
  example: {
    label: 'Quick definitions', component: 'definitions',
    items: [{ term: 'HOST', text: 'A network-connected system with one or more interfaces.' }, { term: 'CLIENT', text: 'Starts a request for a service.' }],
  },
  render(sec, ctx) {
    return `<div class="defs">${sec.items.map((it, i) => `<div class="def-row">
        <div class="def-term ${ctx.rc(ctx.role(it.role, i, 'tags'))}" data-rough="card" data-box>${ctx.t(it.term, 'def-term-t', `items[${i}].term`)}</div>
        <div class="def-text"><span class="dot"></span>${ctx.t(it.text, 'def-text-t', `items[${i}].text`)}</div>
      </div>`).join('')}</div>`;
  },
};
