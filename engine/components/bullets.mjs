import { text, optText, icon, list, obj, oneOf } from '../lib/schema.mjs';

export default {
  name: 'bullets',
  summary: 'plain list, optional icon per item, optional intro sentence',
  labelRequired: true,
  fields: {
    intro: optText(100),
    items: list(oneOf([text(96), obj({ icon: icon(), text: text(96) })]), 1, 8, { doc: 'a string, or {icon, text}' }),
  },
  defaultRole: () => 'info',
  example: {
    label: 'Common ports', component: 'bullets',
    items: ['**22** SSH', { icon: 'lock', text: '**443** HTTPS' }],
  },
  render(sec, ctx) {
    const items = sec.items.map((it, i) => {
      const o = typeof it === 'string' ? { text: it } : it;
      return `<li class="${o.icon ? 'with-icon' : ''}">${o.icon ? ctx.icon(o.icon, 'ico li-ico') : ''}${ctx.t(o.text, '', `items[${i}]`)}</li>`;
    }).join('');
    return `<div class="bl">${sec.intro ? ctx.t(sec.intro, 'bl-intro', 'intro') : ''}<ul class="blist big">${items}</ul></div>`;
  },
};
