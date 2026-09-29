// ==========================================================================
// Tiny schema DSL + static spec validator ("the meter", static half).
// The dynamic half (overflow, overlap, font size, glyphs) runs in the page.
// ==========================================================================
import { iconExists } from '../icons/icons.mjs';
import { CHARACTER_OPTIONS } from '../characters/character.mjs';

export const ROLES = {
  info: 'blue - explanation, definitions, neutral technical content',
  concept: 'green - the key idea, the correct way, success',
  example: 'yellow - examples, analogies, "for instance"',
  action: 'orange - steps, actions, processes',
  accent: 'rose - a soft highlight (NOT a warning)',
  detail: 'purple - extra detail, side notes, deeper facts',
  warning: 'red - RESERVED for warnings, pitfalls and the REMEMBER strip',
  neutral: 'grey - plain containers',
};
export const ROLE_NAMES = Object.keys(ROLES);

/** keys that smuggle styling or markup into a spec */
export const FORBIDDEN_KEYS = [
  'color', 'colour', 'colors', 'colours', 'bg', 'background', 'fill', 'stroke', 'style', 'css', 'class', 'classname',
  'html', 'svg', 'raw', 'script', 'font', 'fontsize', 'font-size', 'fontfamily', 'size', 'width', 'height', 'x', 'y',
  'left', 'top', 'right-px', 'margin', 'padding', 'px', 'rotate', 'position', 'opacity', 'border', 'hex', 'rgb',
];

// ---- DSL -----------------------------------------------------------------
export const text = (max, o = {}) => ({ type: 'text', max, required: o.required !== false, min: o.min || 1, doc: o.doc, lines: o.lines });
export const optText = (max, o = {}) => text(max, { ...o, required: false });
export const enumOf = (values, o = {}) => ({ type: 'enum', values, required: !!o.required, default: o.default, doc: o.doc });
export const icon = (o = {}) => ({ type: 'icon', required: o.required !== false, doc: o.doc });
export const iconOrPair = (o = {}) => ({ type: 'iconOrPair', required: o.required !== false, doc: o.doc });
export const role = (o = {}) => ({ type: 'role', required: false, default: o.default, doc: o.doc });
export const list = (item, min, max, o = {}) => ({ type: 'list', item, min, max, required: o.required !== false, doc: o.doc });
export const obj = (fields, o = {}) => ({ type: 'obj', fields, required: o.required !== false, doc: o.doc });
export const oneOf = (variants, o = {}) => ({ type: 'oneOf', variants, required: o.required !== false, doc: o.doc });
export const character = () => ({
  type: 'obj', required: false, doc: 'appearance of the person (all optional enums)',
  fields: {
    ...Object.fromEntries(Object.entries(CHARACTER_OPTIONS).map(([k, v]) => [k, enumOf(v)])),
    holding: icon({ required: false, doc: 'a prop in the raised hand, any icon name (e.g. passport, cloche, envelope); with pose "waving" it is held up high; not with "thinking"' }),
  },
});

/** visible length of a text after removing inline markup */
export function visibleLength(s) {
  return String(s).replace(/\*\*/g, '').replace(/`/g, '').replace(/->/g, '→').length;
}

// ---- validation ----------------------------------------------------------
function typeName(v) {
  if (Array.isArray(v)) return 'array';
  if (v === null) return 'null';
  return typeof v;
}

export function validateValue(spec, value, where, errs) {
  const err = (msg) => errs.push(`${where}: ${msg}`);
  switch (spec.type) {
    case 'text': {
      if (typeof value !== 'string') return err(`must be text (a string), got ${typeName(value)}`);
      if (value.trim().length < spec.min) return err('is empty');
      if (/<\s*[a-zA-Z\/!]/.test(value)) return err('contains raw HTML/SVG; only **bold** and `code` markup are allowed');
      if (/#[0-9a-fA-F]{3,6}\b/.test(value) && /\b(color|colour)\b/i.test(value)) return err('looks like it carries a colour value');
      const n = visibleLength(value);
      if (n > spec.max) err(`text is ${n} characters, budget is ${spec.max}: "${value.slice(0, 60)}${value.length > 60 ? '…' : ''}"`);
      if (spec.lines && value.split('\n').length > spec.lines) err(`at most ${spec.lines} line(s) allowed`);
      if ((value.match(/\*\*/g) || []).length % 2) err('unbalanced ** bold markers');
      if ((value.match(/`/g) || []).length % 2) err('unbalanced ` code markers');
      return;
    }
    case 'enum':
      if (!spec.values.includes(value)) err(`must be one of ${spec.values.join(' | ')}, got ${JSON.stringify(value)}`);
      return;
    case 'role':
      if (!ROLE_NAMES.includes(value)) err(`unknown role ${JSON.stringify(value)}; roles: ${ROLE_NAMES.join(', ')}`);
      return;
    case 'icon':
      if (!iconExists(value)) err(`unknown icon ${JSON.stringify(value)} (run: node engine/list.mjs icons; or use "lucide:<name>")`);
      return;
    case 'iconOrPair': {
      const arr = Array.isArray(value) ? value : [value];
      if (arr.length < 1 || arr.length > 2) return err('must be one icon name or a list of 2 icon names');
      arr.forEach((v, i) => { if (!iconExists(v)) err(`unknown icon ${JSON.stringify(v)}${arr.length > 1 ? ` (#${i + 1})` : ''} (run: node engine/list.mjs icons)`); });
      return;
    }
    case 'list':
      if (!Array.isArray(value)) return err(`must be a list, got ${typeName(value)}`);
      if (value.length < spec.min) err(`needs at least ${spec.min} item(s), has ${value.length}`);
      if (value.length > spec.max) err(`allows at most ${spec.max} item(s), has ${value.length}`);
      value.forEach((v, i) => validateValue(spec.item, v, `${where}[${i}]`, errs));
      return;
    case 'obj':
      if (typeName(value) !== 'object') return err(`must be an object, got ${typeName(value)}`);
      validateFields(spec.fields, value, where, errs);
      return;
    case 'oneOf': {
      const tries = spec.variants.map((v) => { const e = []; validateValue(v, value, where, e); return e; });
      const ok = tries.find((e) => e.length === 0);
      if (!ok) {
        // report errors of the variant whose type matches best
        const idx = spec.variants.findIndex((v) => (v.type === 'text' ? typeof value === 'string' : typeName(value) === 'object'));
        (tries[idx >= 0 ? idx : 0]).forEach((e) => errs.push(e));
      }
      return;
    }
    default:
      err(`internal: unknown schema type ${spec.type}`);
  }
}

export function checkForbidden(value, where, errs) {
  if (Array.isArray(value)) value.forEach((v, i) => checkForbidden(v, `${where}[${i}]`, errs));
  else if (value && typeof value === 'object') {
    for (const k of Object.keys(value)) {
      if (FORBIDDEN_KEYS.includes(k.toLowerCase())) {
        errs.push(`${where}: forbidden key "${k}" - specs contain content only; the engine decides colours, sizes, fonts and positions (use "role" for meaning)`);
      }
      checkForbidden(value[k], `${where}.${k}`, errs);
    }
  }
}

export function validateFields(fields, value, where, errs) {
  for (const k of Object.keys(value)) {
    if (FORBIDDEN_KEYS.includes(k.toLowerCase())) continue; // reported by checkForbidden
    if (!(k in fields)) errs.push(`${where}: unknown key "${k}" (allowed: ${Object.keys(fields).join(', ')})`);
  }
  for (const [k, spec] of Object.entries(fields)) {
    if (value[k] === undefined || value[k] === null) {
      if (spec.required) errs.push(`${where}: missing required "${k}"`);
      continue;
    }
    validateValue(spec, value[k], `${where}.${k}`, errs);
  }
}

/** Human-readable description of a field spec (used by list.mjs and AUTHORING.md) */
export function describe(spec, indent = '') {
  const req = spec.required ? '' : ' (optional)';
  const doc = spec.doc ? ` - ${spec.doc}` : '';
  switch (spec.type) {
    case 'text': return `text <= ${spec.max} chars${spec.lines ? `, <= ${spec.lines} lines` : ''}${req}${doc}`;
    case 'enum': return `${spec.values.join(' | ')}${spec.default ? ` (default ${spec.default})` : ''}${req}${doc}`;
    case 'role': return `role${spec.default ? ` (default ${spec.default})` : ''} (optional)${doc}`;
    case 'icon': return `icon name${req}${doc}`;
    case 'iconOrPair': return `icon name, or [icon, icon] for a combined picture${req}${doc}`;
    case 'list': {
      const inner = describe(spec.item, indent + '    ');
      return `list of ${spec.min}-${spec.max}${req}${doc}, each: ${inner}`;
    }
    case 'obj': {
      const lines = Object.entries(spec.fields).map(([k, v]) => `${indent}    ${k}: ${describe(v, indent + '    ')}`);
      return `{${req}${doc}\n${lines.join('\n')}\n${indent}  }`;
    }
    case 'oneOf': return spec.variants.map((v) => describe(v, indent)).join('  OR  ');
    default: return spec.type;
  }
}
