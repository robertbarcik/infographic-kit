// Render context handed to every component: the only way components produce text,
// icons and people, so every text block is measurable (.t + data-where).
import { md, esc } from './markup.mjs';
import { iconSvg } from '../icons/icons.mjs';
import { characterSvg, characterParts } from '../characters/character.mjs';

export const CYCLES = {
  cards: ['accent', 'example', 'concept', 'info', 'detail', 'action'],
  layers: ['accent', 'example', 'concept', 'info', 'detail', 'action', 'neutral'],
  tags: ['example', 'info', 'accent', 'concept', 'detail', 'action'],
  scenarios: ['example', 'info', 'accent', 'concept', 'detail'],
  steps: ['example', 'action', 'info', 'concept', 'detail', 'accent'],
};

export function makeCtx(where) {
  const ctx = {
    where,
    md,
    esc,
    /** a measurable text block */
    t(text, cls = '', path = '', tag = 'div') {
      return `<${tag} class="t ${cls}" data-where="${esc(where + (path ? ' › ' + path : ''))}">${md(text)}</${tag}>`;
    },
    icon(name, cls = 'ico') {
      return iconSvg(name, cls);
    },
    char(opts) {
      return characterSvg(opts);
    },
    /** a character in a measurable frame: the svg itself is exempt from overlap checks,
     *  invisible part boxes (head, body, gesture) are measured instead */
    person(opts, cls = '', id = '') {
      const parts = characterParts(opts).map(([x, y, w, h, kind]) =>
        `<i class="char-part" data-part="${kind}" data-box style="left:${(x / 140 * 100).toFixed(2)}%;top:${(y / 160 * 100).toFixed(2)}%;width:${(w / 140 * 100).toFixed(2)}%;height:${(h / 160 * 100).toFixed(2)}%"></i>`).join('');
      return `<div class="person ${cls}"${id ? ` data-person="${esc(id)}"` : ''}>${characterSvg(opts).replace('<svg ', '<svg data-overlap-ok="1" ')}${parts}</div>`;
    },
    role(r, i, cycle) {
      return r || CYCLES[cycle][i % CYCLES[cycle].length];
    },
    rc(r) {
      return `role-${r}`;
    },
    sub(path) {
      return makeCtx(where + ' › ' + path);
    },
  };
  return ctx;
}
