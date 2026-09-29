import { text, optText, enumOf, icon, list, role } from '../lib/schema.mjs';

const VARIANTS = {
  goal: { role: 'info', icon: 'target', lead: 'Goal:' },
  remember: { role: 'warning', icon: 'warning', lead: 'Remember:' },
  key: { role: 'concept', icon: null, lead: null },
  tip: { role: 'example', icon: 'lightbulb', lead: 'Tip:' },
  note: { role: 'info', icon: 'info', lead: null },
};

export default {
  name: 'callout',
  aliases: ['goal'],
  summary: 'icon + bold lead word + sentence: goal, remember strip, tip, key sentence, habit with bullets',
  labelRequired: false,
  fields: {
    variant: enumOf(Object.keys(VARIANTS), { default: 'note', doc: 'goal | remember (red, closing strip) | key (centred key sentence, no icon) | tip | note' }),
    lead: optText(22, { doc: 'bold lead word; defaults: "Goal:", "Remember:", "Tip:"' }),
    text: text(170),
    icon: { ...icon({ required: false }), doc: 'defaults by variant (target, warning, lightbulb, info)' },
    bullets: { ...list(text(64), 1, 5), required: false },
  },
  defaultRole(sec) {
    return VARIANTS[sec.variant || (sec.component === 'goal' ? 'goal' : 'note')].role;
  },
  check(sec, where, errs) {
    const v = sec.variant || (sec.component === 'goal' ? 'goal' : 'note');
    if (v === 'remember' && sec.role && sec.role !== 'warning') errs.push(`${where}: a "remember" callout is always role "warning"`);
    if (v !== 'remember' && sec.role === 'warning' && v !== 'note') errs.push(`${where}: role "warning" is reserved for warnings and the remember strip`);
    if (v === 'key' && sec.bullets) errs.push(`${where}: a "key" callout is one sentence; no bullets`);
    if (v === 'key' && sec.text && sec.text.length > 110) errs.push(`${where}: a "key" sentence has a budget of 110 characters`);
  },
  example: { component: 'callout', variant: 'remember', text: 'Protocols are agreements. Without them, devices could not understand each other.' },
  sectionClass(sec) {
    const v = sec.variant || (sec.component === 'goal' ? 'goal' : 'note');
    return `v-${v}`;
  },
  sectionAttrs(sec) {
    const v = sec.variant || (sec.component === 'goal' ? 'goal' : 'note');
    return v === 'key' ? 'data-rays="1"' : '';
  },
  render(sec, ctx) {
    const v = sec.variant || (sec.component === 'goal' ? 'goal' : 'note');
    const d = VARIANTS[v];
    if (v === 'key') {
      return `<div class="callout v-key">${sec.lead ? ctx.t(sec.lead, 'co-lead', 'lead') : ''}${ctx.t(sec.text, 'co-key', 'text')}</div>`;
    }
    const ic = sec.icon || d.icon;
    const lead = sec.lead || d.lead;
    const bullets = sec.bullets
      ? `<ul class="blist">${sec.bullets.map((b, i) => `<li>${ctx.t(b, '', `bullets[${i}]`)}</li>`).join('')}</ul>`
      : '';
    return `<div class="callout v-${v}${sec.bullets ? ' has-bullets' : ''}">
      ${ic ? `<div class="co-icon">${ctx.icon(ic)}</div>` : ''}
      <div class="co-main">
        ${lead ? ctx.t(lead, 'co-lead', 'lead') : ''}
        <div class="co-body">${ctx.t(sec.text, 'co-text', 'text')}${bullets}</div>
      </div>
    </div>`;
  },
};
