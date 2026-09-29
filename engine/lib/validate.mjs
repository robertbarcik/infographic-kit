// Static spec validation: schema, forbidden keys, budgets, page-level rules.
import { COMPONENTS, COMPONENT_NAMES } from '../components/index.mjs';
import { text, optText, role, validateFields, checkForbidden, ROLE_NAMES } from './schema.mjs';

export const PAGE_RULES = {
  maxRows: 7,
  maxSectionsPerRow: 3,
  maxSections: 12,
  maxRatio: 5,
  labelMax: 44,
};

export const TITLE_FIELDS = {
  number: optText(4, { doc: 'page number, e.g. "10"' }),
  text: text(46, { doc: 'the idea of the page, not only the topic' }),
  subtitle: optText(52),
};

export const SECTION_COMMON = {
  component: text(20),
  label: optText(PAGE_RULES.labelMax, { doc: 'section label tab (shown in capitals)' }),
  role: role({ doc: 'semantic colour' }),
};

// characters the fonts can draw: Latin-1 + Latin Extended-A/B + general punctuation; "→" is drawn by the engine
const ALLOWED_CHAR = /^[ -~ -ɏ‐-‧‰-⁞€™→\n]$/;

function where(ri, si, sec) {
  const lbl = sec && typeof sec.label === 'string' ? ` "${sec.label}"` : '';
  const comp = sec && typeof sec.component === 'string' ? ` (${sec.component})` : '';
  return `rows[${ri}].sections[${si}]${lbl}${comp}`;
}

let WARNINGS = [];
/** warnings of the last validateSpec() call (non-fatal advice for the author) */
export function specWarnings() { return WARNINGS; }

export function validateSpec(spec) {
  const errs = [];
  WARNINGS = [];
  if (!spec || typeof spec !== 'object' || Array.isArray(spec)) return ['spec: must be a JSON object'];
  checkForbidden(spec, 'spec', errs);
  for (const k of Object.keys(spec)) {
    if (!['title', 'rows', 'meta', '$comment'].includes(k) && !errs.some((e) => e.includes(`"${k}"`))) {
      errs.push(`spec: unknown top-level key "${k}" (allowed: title, rows, meta, $comment)`);
    }
  }
  if (!spec.title) errs.push('spec: missing "title"');
  else if (typeof spec.title !== 'object') errs.push('spec.title: must be an object {number, text, subtitle}');
  else validateFields(TITLE_FIELDS, spec.title, 'title', errs);
  if (spec.meta !== undefined) {
    if (typeof spec.meta !== 'object') errs.push('spec.meta: must be an object');
    else for (const k of Object.keys(spec.meta)) if (!['lang', 'author', 'source', 'notes'].includes(k)) errs.push(`spec.meta: unknown key "${k}" (allowed: lang, author, source, notes)`);
  }

  if (!Array.isArray(spec.rows)) {
    errs.push('spec: "rows" must be a list of rows');
    return errs;
  }
  if (spec.rows.length < 2) errs.push('spec.rows: a page needs at least 2 rows (content + remember strip)');
  if (spec.rows.length > PAGE_RULES.maxRows) errs.push(`spec.rows: ${spec.rows.length} rows, at most ${PAGE_RULES.maxRows} fit a page`);
  let total = 0;
  spec.rows.forEach((row, ri) => {
    const rw = `rows[${ri}]`;
    if (!row || typeof row !== 'object' || Array.isArray(row)) return errs.push(`${rw}: must be an object {sections, ratio}`);
    for (const k of Object.keys(row)) if (!['sections', 'ratio'].includes(k) && !errs.some((e) => e.startsWith(rw) && e.includes(`"${k}"`))) errs.push(`${rw}: unknown key "${k}" (allowed: sections, ratio)`);
    if (!Array.isArray(row.sections) || row.sections.length === 0) return errs.push(`${rw}: "sections" must be a non-empty list`);
    if (row.sections.length > PAGE_RULES.maxSectionsPerRow) errs.push(`${rw}: ${row.sections.length} sections, at most ${PAGE_RULES.maxSectionsPerRow} per row`);
    total += row.sections.length;
    if (row.ratio !== undefined) {
      if (!Array.isArray(row.ratio) || row.ratio.length !== row.sections.length || !row.ratio.every((n) => Number.isInteger(n) && n >= 1 && n <= PAGE_RULES.maxRatio)) {
        errs.push(`${rw}.ratio: must list one whole number 1-${PAGE_RULES.maxRatio} per section (e.g. [3, 2]), got ${JSON.stringify(row.ratio)}`);
      }
    }
    const cells = [];
    row.sections.forEach((sec, si) => {
      if (sec && typeof sec === 'object' && !Array.isArray(sec) && 'stack' in sec) {
        const w = `rows[${ri}].sections[${si}]`;
        for (const k of Object.keys(sec)) if (k !== 'stack') errs.push(`${w}: a stack cell holds only "stack" (got "${k}")`);
        if (!Array.isArray(sec.stack) || sec.stack.length < 2 || sec.stack.length > 3) return errs.push(`${w}.stack: must be a list of 2-3 sections stacked vertically`);
        total += sec.stack.length - 1;
        sec.stack.forEach((s, k) => {
          if (s && typeof s === 'object' && 'stack' in s) return errs.push(`${w}.stack[${k}]: stacks cannot be nested`);
          cells.push([s, `${w}.stack[${k}]${s && s.label ? ` "${s.label}"` : ''}${s && s.component ? ` (${s.component})` : ''}`]);
        });
      } else cells.push([sec, where(ri, si, sec)]);
    });
    cells.forEach(([sec, w]) => {
      if (!sec || typeof sec !== 'object' || Array.isArray(sec)) return errs.push(`${w}: must be an object`);
      if (!sec.component) return errs.push(`${w}: missing "component" (one of ${[...new Set(Object.values(COMPONENTS).map((c) => c.name))].join(', ')})`);
      const comp = COMPONENTS[sec.component];
      if (!comp) return errs.push(`${w}: unknown component "${sec.component}" (known: ${COMPONENT_NAMES.join(', ')})`);
      validateFields({ ...SECTION_COMMON, ...comp.fields }, sec, w, errs);
      if (comp.labelRequired && !sec.label) errs.push(`${w}: component "${comp.name}" needs a "label"`);
      if (sec.role === 'warning' && comp.name !== 'callout' && comp.name !== 'bullets') {
        errs.push(`${w}: role "warning" (red) is reserved for warnings and the remember strip`);
      }
      if (comp.check) comp.check(sec, w, errs);
    });
  });
  if (total > PAGE_RULES.maxSections) errs.push(`spec.rows: ${total} sections in total, at most ${PAGE_RULES.maxSections}`);

  // closing strip rule
  const flat = (r) => (r && Array.isArray(r.sections) ? r.sections.flatMap((s) => (s && Array.isArray(s.stack) ? s.stack : [s])) : []);
  const last = spec.rows[spec.rows.length - 1];
  const hasRemember = flat(last).some((s) => s && (s.component === 'callout') && s.variant === 'remember');
  if (!hasRemember) errs.push('rows[last]: the last row must contain the closing strip { "component": "callout", "variant": "remember", ... }');
  const remCount = spec.rows.flatMap(flat).filter((s) => s && s.variant === 'remember').length;
  if (remCount > 1) errs.push(`spec: ${remCount} remember strips; a page keeps exactly one sentence to remember`);

  // lucide fallback: allowed, but it never matches the kit style exactly -> tell the author
  const lucide = new Set();
  JSON.stringify(spec).replace(/"lucide:([a-z0-9-]+)"/g, (m, n) => lucide.add(n));
  if (lucide.size) WARNINGS.push(`spec uses Lucide fallback icon(s) ${[...lucide].map((n) => `lucide:${n}`).join(', ')}: they are line icons on a pastel disc and look lighter than kit icons; request a kit icon for anything prominent`);

  // people: a prop needs a free hand
  const walkLooks = (v, p) => {
    if (Array.isArray(v)) v.forEach((x, i) => walkLooks(x, `${p}[${i}]`));
    else if (v && typeof v === 'object') {
      if (v.holding && v.pose === 'thinking') errs.push(`${p}: "holding" needs a free hand; pose "thinking" keeps the hand at the chin`);
      for (const [k, x] of Object.entries(v)) walkLooks(x, `${p}.${k}`);
    }
  };
  walkLooks(spec.rows, 'rows');

  // glyph coverage (static): every character must be drawable by the kit fonts
  const bad = new Map();
  const walk = (v, p) => {
    if (typeof v === 'string') { for (const ch of v) if (!ALLOWED_CHAR.test(ch)) bad.set(ch, p); }
    else if (Array.isArray(v)) v.forEach((x, i) => walk(x, `${p}[${i}]`));
    else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) if (k !== '$comment' && k !== 'meta') walk(x, `${p}.${k}`);
  };
  walk(spec, 'spec');
  for (const [ch, p] of bad) errs.push(`${p}: character "${ch}" (U+${ch.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')}) is not covered by the kit fonts; use plain punctuation or "->" for an arrow`);
  return errs;
}

export { ROLE_NAMES };
