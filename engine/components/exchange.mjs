import { text, optText, enumOf, iconOrPair, list, obj, role, character } from '../lib/schema.mjs';

// One component for every "who sends what to whom" picture:
//   - classic exchange: a, b, arrows (A <-> B with request/response arrows)
//   - scene: actors (2-4, icons or drawn people with a speech bubble) + links (arrows between neighbours)
// Registered under the names "exchange" and "scene".

const actor = obj({
  icon: { ...iconOrPair({ doc: 'one icon, or two (e.g. ["laptop","database"]) drawn as one picture; use icon OR person' }), required: false },
  person: { ...character(), doc: 'draw a person instead of an icon; {} for the default look, or look enums' },
  says: optText(40, { doc: 'speech bubble above a person (person actors only)' }),
  name: text(20, { doc: 'e.g. "Laptop", "Sender"' }),
  tag: optText(12, { doc: 'role tag pill, e.g. "CLIENT"' }),
  tagRole: role({ doc: 'colour meaning of the tag; default: first actor yellow, others blue' }),
  caption: optText(46, { lines: 2, doc: 'process / software / what it does, e.g. "Web browser\\n(e.g. Chrome)"' }),
});

const arrow = obj({
  dir: enumOf(['right', 'left'], { doc: 'right = towards the next actor, left = back; omit for a plain note line' }),
  kind: enumOf(['request', 'response', 'neutral'], { doc: 'arrow colour meaning; default right=request, left=response' }),
  line: enumOf(['solid', 'dashed'], { default: 'solid' }),
  label: optText(40, { lines: 2 }),
  step: optText(2, { doc: 'number badge drawn on the arrow, e.g. "1"' }),
});

const scenario = obj({
  title: optText(40, { doc: 'scenario heading; numbered automatically when there are 2-3 scenarios' }),
  role: role({ doc: 'default cycles yellow, blue, rose' }),
  a: { ...actor, required: false, doc: 'classic form: left actor' },
  b: { ...actor, required: false, doc: 'classic form: right actor' },
  arrows: { ...list(arrow, 1, 4), required: false, doc: 'classic form: arrows between a and b' },
  actors: { ...list(actor, 2, 4), required: false, doc: 'scene form: 2-4 actors left to right' },
  links: { ...list(obj({ arrows: { ...list(arrow, 1, 3), required: false }, versus: optText(8, { doc: 'instead of arrows: a vs-divider with this word, e.g. "vs", "or"' }) }), 1, 3), required: false, doc: 'scene form: one entry per gap between neighbouring actors (actors - 1); each has arrows OR versus' },
});

const PERSON_LOOKS = [
  { hair: 'short', hairTone: 'dark', shirt: 'concept', pose: 'neutral' },
  { hair: 'long', hairTone: 'brown', shirt: 'detail', pose: 'neutral' },
  { hair: 'curly', hairTone: 'dark', skin: 'tan', shirt: 'action', pose: 'neutral' },
  { hair: 'bun', hairTone: 'blonde', skin: 'medium', shirt: 'info', pose: 'neutral' },
];

function normalise(s) {
  if (Array.isArray(s.actors)) return { actors: s.actors, gaps: (s.links || []).map((l) => (l.versus ? { versus: l.versus } : l.arrows)), scene: true };
  return { actors: [s.a, s.b], gaps: [s.arrows || []], scene: false };
}

export default {
  name: 'exchange',
  aliases: ['scene'],
  summary: 'who sends what to whom: 2-4 actors (icons or drawn people with speech bubbles) in a row with labelled arrows between neighbours; 1-3 stacked numbered scenarios. "scene" is the same component.',
  labelRequired: true,
  fields: { scenarios: list(scenario, 1, 3) },
  defaultRole: () => 'concept',
  check(sec, where, errs) {
    (sec.scenarios || []).forEach((s, i) => {
      if (!s || typeof s !== 'object') return;
      const w = `${where}.scenarios[${i}]`;
      const classic = s.a || s.b || s.arrows;
      const scene = s.actors || s.links;
      if (classic && scene) errs.push(`${w}: use either a/b/arrows or actors/links, not both`);
      else if (!classic && !scene) errs.push(`${w}: needs a, b and arrows (or actors and links)`);
      else if (classic) {
        for (const k of ['a', 'b', 'arrows']) if (!s[k]) errs.push(`${w}: missing "${k}"`);
      } else {
        if (!Array.isArray(s.actors)) errs.push(`${w}: missing "actors"`);
        if (!Array.isArray(s.links)) errs.push(`${w}: missing "links"`);
        (s.links || []).forEach((l, li) => { if (l && !!l.arrows === !!l.versus) errs.push(`${w}.links[${li}]: give exactly one of "arrows" or "versus"`); });
        if (Array.isArray(s.actors) && Array.isArray(s.links) && s.links.length !== s.actors.length - 1) {
          errs.push(`${w}.links: ${s.actors.length} actors need exactly ${s.actors.length - 1} link(s), got ${s.links.length}`);
        }
      }
      const acts = classic ? [['a', s.a], ['b', s.b]] : (s.actors || []).map((a, k) => [`actors[${k}]`, a]);
      for (const [p, a] of acts) {
        if (!a || typeof a !== 'object') continue;
        if (!!a.icon === !!a.person) errs.push(`${w}.${p}: give exactly one of "icon" or "person"`);
        if (a.says && !a.person) errs.push(`${w}.${p}: "says" needs a "person" actor`);
      }
      const gaps = classic ? [s.arrows || []] : (s.links || []).map((l) => (l && l.arrows) || []);
      gaps.forEach((g, gi) => (Array.isArray(g) ? g : []).forEach((a, j) => {
        const aw = classic ? `${w}.arrows[${j}]` : `${w}.links[${gi}].arrows[${j}]`;
        if (a && !a.dir && !a.label) errs.push(`${aw}: needs "dir" (an arrow) or "label" (a note line)`);
        if (a && !a.dir && (a.kind || a.line || a.step)) errs.push(`${aw}: "kind"/"line"/"step" need a "dir"`);
        if (a && a.step && !/^[0-9]{1,2}$/.test(a.step)) errs.push(`${aw}.step: a number such as "1"`);
      }));
    });
    if (sec.scenarios && sec.scenarios.length > 1) sec.scenarios.forEach((s, i) => {
      if (s && !s.title) errs.push(`${where}.scenarios[${i}]: stacked scenarios need a "title"`);
    });
  },
  example: {
    label: 'Who asks, who answers', component: 'exchange',
    scenarios: [{
      a: { icon: 'laptop', name: 'Laptop', tag: 'CLIENT', caption: 'Web browser' },
      b: { icon: 'server', name: 'Web server', tag: 'SERVER', caption: 'nginx' },
      arrows: [{ dir: 'right', label: 'Request:\nGET /index.html' }, { dir: 'left', label: 'Response:\nweb page (HTML)' }],
    }],
  },
  example2: {
    label: 'A registered letter', component: 'scene',
    scenarios: [{
      actors: [
        { person: {}, says: 'Registered, please.', name: 'Sender' },
        { icon: 'stamp', name: 'Post office', caption: 'records the letter' },
        { person: { hair: 'long' }, says: 'Signed, received.', name: 'Recipient' },
      ],
      links: [
        { arrows: [{ dir: 'right', label: 'letter' }] },
        { arrows: [{ dir: 'right', label: 'delivery' }, { dir: 'left', line: 'dashed', label: 'signed receipt' }] },
      ],
    }],
  },
  render(sec, ctx) {
    const multi = sec.scenarios.length > 1;
    return `<div class="xch${multi ? ' multi' : ''}">${sec.scenarios.map((s, i) => {
      const r = ctx.role(s.role, i, 'scenarios');
      const sp = `scenarios[${i}]`;
      const { actors, gaps, scene } = normalise(s);
      const n = actors.length;
      const actorHtml = (a, k) => {
        const path = scene ? `${sp}.actors[${k}]` : `${sp}.${k === 0 ? 'a' : 'b'}`;
        const tagRole = a.tagRole || (k === 0 ? 'example' : 'info');
        let pic;
        if (a.person) {
          const look = { ...PERSON_LOOKS[k % PERSON_LOOKS.length], facing: k < n / 2 ? 'right' : 'left', ...a.person };
          const id = `x${i}-${k}`;
          pic = `${a.says ? `<div class="bubble actor-bubble" data-rough="bubble" data-mouth="${id}" data-box>${ctx.t(a.says, 'bubble-t', `${path}.says`)}</div>` : ''}
            ${ctx.person(look, 'actor-person', id)}`;
        } else {
          const icons = Array.isArray(a.icon) ? a.icon : [a.icon];
          pic = `<div class="actor-icons n${icons.length}">${icons.map((nm, j) => ctx.icon(nm, `ico i${j}`).replace('<svg ', j ? '<svg data-overlap-ok="1" ' : '<svg ')).join('')}</div>`;
        }
        return `<div class="actor${a.person ? ' has-person' : ''}">
          ${pic}
          ${ctx.t(a.name, 'actor-name', `${path}.name`)}
          ${a.tag ? `<div class="tag ${ctx.rc(tagRole)}" data-rough="pill" data-box>${ctx.t(a.tag, 'tag-t', `${path}.tag`)}</div>` : ''}
          ${a.caption ? ctx.t(a.caption, 'actor-cap', `${path}.caption`) : ''}
        </div>`;
      };
      const gapHtml = (arrows, g) => {
        if (arrows && arrows.versus) {
          return `<div class="arws versus"><div class="vs-line" data-rough="vsline"></div><div class="vs-badge on-line role-neutral" data-rough="pill" data-box>${ctx.t(arrows.versus, 'vs-t', `${sp}.links[${g}].versus`)}</div></div>`;
        }
        const m = arrows.length;
        return `<div class="arws n${m}">${arrows.map((a, j) => {
          const below = m === 2 && j === 1 && arrows[0].label && a.dir;
          const kind = a.kind || (a.dir === 'left' ? 'response' : 'request');
          const ap = scene ? `${sp}.links[${g}].arrows[${j}]` : `${sp}.arrows[${j}]`;
          const lbl = a.label ? ctx.t(a.label, `arw-label${a.dir ? '' : ' arw-note'}`, `${ap}.label`) : '';
          const step = a.step ? `<span class="arw-step on-line role-example" data-rough="circle" data-box>${ctx.t(a.step, 'arw-step-t', `${ap}.step`)}</span>` : '';
          const line = a.dir ? `<div class="arw-line${a.step ? ' has-step' : ''}" data-rough="arrow" data-dir="${a.dir}" data-tone="${kind}" data-dash="${a.line === 'dashed' ? 1 : 0}">${step}</div>` : '';
          return `<div class="arw${below ? ' below' : ''}">${below ? line + lbl : lbl + line}</div>`;
        }).join('')}</div>`;
      };
      const cols = Array.from({ length: 2 * n - 1 }, (_, c) => (c % 2 ? `minmax(0,${n > 2 ? 0.9 : 1.2}fr)` : 'minmax(0,1fr)')).join(' ');
      const body = actors.map((a, k) => actorHtml(a, k) + (k < n - 1 ? gapHtml(gaps[k] || [], k) : '')).join('');
      const head = s.title
        ? `<div class="scn-head">${multi ? `<div class="badge role-example" data-rough="circle" data-box>${ctx.t(String(i + 1), 'badge-t', `${sp}.number`)}</div>` : ''}
           <div class="scn-title ${ctx.rc(r)}" data-rough="tab" data-box>${ctx.t(s.title, 'scn-title-t', `${sp}.title`)}</div></div>`
        : '';
      return `<div class="scn ${ctx.rc(r)}${multi ? ' framed' : ''}" ${multi ? 'data-rough="soft" data-box' : ''}>
        ${head}
        <div class="scn-body${actors.some((a) => a.person) ? ' has-people' : ''}" style="grid-template-columns:${cols}">${body}</div>
      </div>`;
    }).join('')}</div>`;
  },
};
