import { text, optText, icon, list, obj, role, enumOf } from '../lib/schema.mjs';

export default {
  name: 'card-grid',
  summary: 'N small cards (2-10) in one or two rows: heading, sub-tag, icon, text; "compact" puts the icon beside the heading for many small cards',
  labelRequired: true,
  fields: {
    variant: enumOf(['normal', 'compact'], { default: 'normal', doc: 'compact: icon beside the heading, less height per card (good for 7-10 cards)' }),
    items: list(obj({
      heading: text(16), tag: optText(22, { doc: 'small sub-tag under the heading, e.g. "(link layer)"' }),
      icon: icon(), text: text(84), role: role({ doc: 'default cycles purple, green, yellow, rose, blue, orange' }),
    }), 2, 10),
  },
  defaultRole: () => 'info',
  check(sec, where, errs) {
    const n = (sec.items || []).length;
    if (n > 8 && sec.variant !== 'compact') errs.push(`${where}: more than 8 cards need "variant": "compact"`);
    if (sec.variant === 'compact') (sec.items || []).forEach((it, i) => { if (it && it.text && it.text.length > 64) errs.push(`${where}.items[${i}].text: compact cards have a budget of 64 characters`); });
  },
  example: {
    label: 'Examples of common protocols', component: 'card-grid',
    items: [{ heading: 'TCP', tag: '(transport layer)', icon: 'arrows-lr', text: 'Reliable, ordered delivery.' }, { heading: 'DNS', tag: '(application layer)', icon: 'globe', text: 'Translates names to IP addresses.' }],
  },
  render(sec, ctx) {
    const n = sec.items.length;
    const compact = sec.variant === 'compact';
    const cols = n <= (compact ? 5 : 6) ? n : Math.ceil(n / 2);
    const cyc = ['detail', 'concept', 'example', 'accent', 'info', 'action'];
    return `<div class="cgrid${compact ? ' compact' : ''}" style="grid-template-columns:repeat(${cols},minmax(0,1fr))">${sec.items.map((it, i) => {
      const head = ctx.t(it.heading, 'gc-head', `items[${i}].heading`);
      const tag = it.tag ? ctx.t(it.tag, 'gc-tag', `items[${i}].tag`) : '';
      const ic = `<div class="gc-icon">${ctx.icon(it.icon)}</div>`;
      const body = compact
        ? `<div class="gc-top">${ic}<div class="gc-heads">${head}${tag}</div></div>`
        : `${head}${tag}${ic}`;
      return `<div class="gcard ${ctx.rc(it.role || cyc[i % cyc.length])}" data-rough="soft" data-box>${body}${ctx.t(it.text, 'gc-text', `items[${i}].text`)}</div>`;
    }).join('')}</div>`;
  },
};
