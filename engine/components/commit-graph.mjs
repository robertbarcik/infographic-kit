import { text, optText, list, obj, role, enumOf } from '../lib/schema.mjs';

// Parallel tracks with dots: Git history (fork, commits on both lanes, merge with two parents,
// branch tags, HEAD), or any timeline with parallel tracks. The spec names lanes, commits and
// parents; the engine places commit i in column i (time runs left to right) on its lane.

const LANE_ROLES = ['info', 'detail', 'action'];

export default {
  name: 'commit-graph',
  aliases: ['track-graph'],
  summary: 'lanes (1-3) with dots in time order; forks and joins by naming parents; branch tags and HEAD point at dots',
  labelRequired: true,
  fields: {
    lanes: list(obj({ id: text(16), name: text(16), role: role({ doc: 'default: blue, purple, orange' }) }), 1, 3, { doc: 'top lane first' }),
    commits: list(obj({
      id: text(12, { doc: 'short id used by parents/tags, e.g. "c3"' }),
      lane: text(16, { doc: 'lane id' }),
      label: optText(18, { lines: 2, doc: 'shown under the dot, e.g. "a3f9c soup"' }),
      parents: { ...list(text(12), 0, 2), required: false, doc: 'default: the previous dot on the same lane; two parents = merge' },
    }), 2, 9, { doc: 'in time order, left to right' }),
    tags: { ...list(obj({ name: text(16), at: text(12, { doc: 'commit id' }), was: optText(12, { doc: 'commit id where this pointer was before (drawn as a dashed ghost with an arrow to its new place, e.g. a fast-forward)' }), role: role() }), 1, 4), required: false, doc: 'branch names pointing at a commit' },
    head: optText(16, { doc: 'the tag name (or commit id) HEAD points at' }),
    arrows: enumOf(['none', 'to-parent'], { default: 'none', doc: 'to-parent: arrowheads point from each dot back to its parent, as Git stores it' }),
    text: optText(180, { doc: 'explanation under the graph' }),
  },
  defaultRole: () => 'info',
  check(sec, where, errs) {
    const lanes = new Set((sec.lanes || []).map((l) => l && l.id));
    const seen = new Set();
    (sec.commits || []).forEach((c, i) => {
      if (!c) return;
      const w = `${where}.commits[${i}]`;
      if (seen.has(c.id)) errs.push(`${w}.id: duplicate id "${c.id}"`);
      if (c.lane && !lanes.has(c.lane)) errs.push(`${w}.lane: no lane with id "${c.lane}"`);
      (c.parents || []).forEach((p) => { if (!seen.has(p)) errs.push(`${w}.parents: "${p}" must be an earlier commit`); });
      seen.add(c.id);
    });
    const tagNames = new Set();
    (sec.tags || []).forEach((t, i) => {
      if (!t) return;
      if (t.at && !seen.has(t.at)) errs.push(`${where}.tags[${i}].at: no commit with id "${t.at}"`);
      if (t.was && !seen.has(t.was)) errs.push(`${where}.tags[${i}].was: no commit with id "${t.was}"`);
      if (t.was && t.was === t.at) errs.push(`${where}.tags[${i}].was: must differ from "at"`);
      tagNames.add(t.name);
    });
    if (sec.head && !tagNames.has(sec.head) && !seen.has(sec.head)) errs.push(`${where}.head: "${sec.head}" is neither a tag name nor a commit id`);
  },
  example: {
    label: 'Branch and merge', component: 'commit-graph',
    lanes: [{ id: 'main', name: 'main' }, { id: 'feat', name: 'feature' }],
    commits: [
      { id: 'c1', lane: 'main', label: 'a1 start' },
      { id: 'c2', lane: 'feat', label: 'b2 chili', parents: ['c1'] },
      { id: 'c3', lane: 'main', label: 'a3 salt' },
      { id: 'c4', lane: 'main', label: 'm4 merge', parents: ['c3', 'c2'] },
    ],
    tags: [{ name: 'main', at: 'c4' }, { name: 'feature', at: 'c2' }],
    head: 'main',
  },
  render(sec, ctx) {
    const laneIdx = new Map(sec.lanes.map((l, i) => [l.id, i]));
    const laneRole = (i) => sec.lanes[i].role || LANE_ROLES[i];
    const n = sec.commits.length;
    const lastOnLane = new Map();
    const edges = [];
    sec.commits.forEach((c) => {
      const parents = c.parents || (lastOnLane.has(c.lane) ? [lastOnLane.get(c.lane)] : []);
      parents.forEach((p) => edges.push([p, c.id]));
      lastOnLane.set(c.lane, c.id);
    });
    const tagsAt = new Map();
    (sec.tags || []).forEach((t) => { if (!tagsAt.has(t.at)) tagsAt.set(t.at, []); tagsAt.get(t.at).push(t); });
    const ghostsAt = new Map();
    (sec.tags || []).forEach((t) => { if (t.was) { if (!ghostsAt.has(t.was)) ghostsAt.set(t.was, []); ghostsAt.get(t.was).push(t); } });
    // rows per lane: the upper lane keeps tags and labels ABOVE its dots, a lower lane BELOW, so the
    // band between two lanes stays free for fork/merge curves; a spacer row separates lanes
    const L = sec.lanes.length;
    const rowsOf = (li) => {
      const r0 = li * 4 + 1;
      if (L > 1 && li === 0) return { tags: r0, label: r0 + 1, dot: r0 + 2 };
      if (L > 1) return { dot: r0, label: r0 + 1, tags: r0 + 2 };
      return { tags: r0, dot: r0 + 1, label: r0 + 2 };
    };
    const cells = [];
    sec.lanes.forEach((l, li) => {
      cells.push(`<div class="cg-lane ${ctx.rc(laneRole(li))}" style="grid-row:${rowsOf(li).dot};grid-column:1">${ctx.t(l.name, 'cg-lane-t', `lanes[${li}].name`)}</div>`);
      if (li < L - 1) cells.push(`<div class="cg-spacer" style="grid-row:${li * 4 + 4};grid-column:1 / -1"></div>`);
    });
    sec.commits.forEach((c, i) => {
      const li = laneIdx.get(c.lane);
      const R = rowsOf(li);
      const col = i + 2;
      const merge = (c.parents || []).length > 1;
      const pos = L > 1 && li === 0 ? 'above' : 'below';
      const tags = (tagsAt.get(c.id) || []).map((t) => {
        const ti = sec.tags.indexOf(t);
        const head = sec.head === t.name ? `<span class="cg-head" data-rough="pill" data-box>${ctx.t('HEAD', 'cg-head-t', 'head')}</span>` : '';
        return `${head}<span class="cg-tag ${ctx.rc(t.role || 'example')}" data-rough="pill" data-box data-tag="${ctx.esc(t.name)}">${ctx.t(t.name, 'cg-tag-t', `tags[${ti}].name`)}</span>`;
      }).join('');
      const ghosts = (ghostsAt.get(c.id) || []).map((t) => {
        const ti = sec.tags.indexOf(t);
        return `<span class="cg-tag cg-ghost ${ctx.rc(t.role || 'example')}" data-rough="ghost" data-box data-ghost="${ctx.esc(t.name)}">${ctx.t(t.name, 'cg-tag-t', `tags[${ti}].was`)}</span>`;
      }).join('');
      const headOnCommit = sec.head === c.id ? `<span class="cg-head" data-rough="pill" data-box>${ctx.t('HEAD', 'cg-head-t', 'head')}</span>` : '';
      if (tags || headOnCommit || ghosts) cells.push(`<div class="cg-tags ${pos}" style="grid-row:${R.tags};grid-column:${col}">${ghosts}${headOnCommit}${tags}</div>`);
      cells.push(`<div class="cg-cell" style="grid-row:${R.dot};grid-column:${col}"><div class="cg-dot${merge ? ' merge' : ''} ${ctx.rc(laneRole(li))}" data-rough="circle" data-box data-commit="${ctx.esc(c.id)}"></div></div>`);
      if (c.label) cells.push(`<div class="cg-label ${pos}" style="grid-row:${R.label};grid-column:${col}">${ctx.t(c.label, 'cg-label-t', `commits[${i}].label`)}</div>`);
    });
    const edgeEls = edges.map(([p, c]) => {
      const ci = sec.commits.find((x) => x.id === c);
      return `<div class="cg-edge" hidden data-from="${ctx.esc(p)}" data-to="${ctx.esc(c)}" data-lane-role="${laneRole(laneIdx.get(ci.lane))}" data-arrows="${sec.arrows || 'none'}"></div>`;
    }).join('');
    return `<div class="cg">
      <div class="cg-grid" style="grid-template-columns:auto repeat(${n}, minmax(3rem, 1fr));grid-template-rows:repeat(${L * 4 - 1}, auto)">${cells.join('')}</div>
      ${edgeEls}
      ${sec.text ? ctx.t(sec.text, 'cg-text', 'text') : ''}
    </div>`;
  },
};
