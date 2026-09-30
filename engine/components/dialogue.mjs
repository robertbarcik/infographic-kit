import { text, optText, list, obj, enumOf, character } from '../lib/schema.mjs';

const person = (doc) => obj({ name: text(18), says: optText(42, { doc: 'one line of speech; omit when using "turns"' }), look: character() }, { doc });

const DEFAULT_LOOK = {
  a: { hair: 'short', hairTone: 'dark', skin: 'light', shirt: 'concept', expression: 'happy', pose: 'neutral', facing: 'right' },
  b: { hair: 'long', hairTone: 'brown', skin: 'light', shirt: 'detail', expression: 'happy', pose: 'neutral', facing: 'left' },
};

export default {
  name: 'dialogue',
  summary: 'the everyday analogy: two people with speech bubbles (one line each, or 2-4 numbered turns) and a centred box of rules',
  labelRequired: true,
  fields: {
    a: person('person on the left'),
    b: person('person on the right'),
    turns: { ...list(obj({ who: enumOf(['a', 'b'], { required: true }), says: text(42) }), 2, 4), required: false, doc: 'a short exchange instead of a.says/b.says; shown as numbered bubbles in order' },
    intro: optText(70, { doc: 'sentence directly above the rules box' }),
    rules: list(text(52), 2, 5, { doc: 'what the two people implicitly agree on' }),
  },
  defaultRole: () => 'info',
  check(sec, where, errs) {
    const simple = sec.a && sec.b && (sec.a.says || sec.b.says);
    if (sec.turns && simple) errs.push(`${where}: use either a.says + b.says, or "turns" - not both`);
    if (!sec.turns && sec.a && sec.b && !(sec.a.says && sec.b.says)) errs.push(`${where}: a.says and b.says are both required (or use "turns")`);
    if (Array.isArray(sec.turns) && sec.turns.length && !(sec.turns.some((t) => t && t.who === 'a') && sec.turns.some((t) => t && t.who === 'b'))) {
      errs.push(`${where}.turns: both people must speak at least once`);
    }
  },
  example: {
    label: 'A conversation analogy', component: 'dialogue',
    a: { name: 'Person A', says: 'Shall we meet at 3 pm?' },
    b: { name: 'Person B', says: 'Yes, at 3 pm!' },
    intro: 'We both understand because we agree on rules:',
    rules: ['use the same language (syntax)', 'take turns in the right order (order)'],
  },
  render(sec, ctx) {
    const look = (k) => ({ ...DEFAULT_LOOK[k], ...((sec[k] && sec[k].look) || {}) });
    const simple = !sec.turns;
    const turns = simple ? [{ who: 'a', says: sec.a.says }, { who: 'b', says: sec.b.says }] : sec.turns;
    // every bubble has a tail towards its speaker; the outline takes the speaker's shirt colour
    const bubble = (t, i) => `<div class="bubble from-${t.who}${simple ? '' : ' numbered'} role-${look(t.who).shirt}" data-rough="bubble" data-mouth="${t.who}"${simple ? '' : ' data-chat="1"'} data-box>
        ${simple ? '' : `<span class="turn-n" data-rough="circle" data-box>${ctx.t(String(i + 1), 'turn-n-t', `turns[${i}].number`)}</span>`}
        ${ctx.t(t.says, 'bubble-t', simple ? `${t.who}.says` : `turns[${i}].says`)}
      </div>`;
    const bubbles = simple
      ? `<div class="dlg-bubbles simple">${bubble(turns[0], 0)}${bubble(turns[1], 1)}</div>`
      : `<div class="dlg-bubbles chat">${turns.map(bubble).join('')}</div>`;
    // chat: the intro becomes the heading line inside the full-width rules box (saves a row)
    const mid = `<div class="dlg-mid${sec.rules.length > 2 ? ' many' : ''}">
          ${sec.intro && simple ? ctx.t(sec.intro, 'dlg-intro', 'intro') : ''}
          <div class="dlg-rules role-example" data-rough="panel" data-box>
            ${sec.intro && !simple ? ctx.t(sec.intro, 'dlg-intro-in', 'intro') : ''}
            <ul class="blist">${sec.rules.map((r, i) => `<li>${ctx.t(r, '', `rules[${i}]`)}</li>`).join('')}</ul>
          </div>
        </div>`;
    // simple: rules centred between the people. chat: the conversation sits between the people
    // (tails in the gutters next to each speaker), the rules run full width underneath.
    return `<div class="dlg${simple ? ' is-simple' : ' is-chat'}">
      <div class="dlg-side p-a">${ctx.person(look('a'), 'dlg-person', 'a')}${ctx.t(sec.a.name, 'dlg-name', 'a.name')}</div>
      <div class="dlg-center">
        ${bubbles}
        ${simple ? mid : ''}
      </div>
      <div class="dlg-side p-b">${ctx.person(look('b'), 'dlg-person', 'b')}${ctx.t(sec.b.name, 'dlg-name', 'b.name')}</div>
      ${simple ? '' : mid}
    </div>`;
  },
};
