#!/usr/bin/env node
// Prints what the engine offers, straight from the code (never out of step):
//   node engine/list.mjs                 everything
//   node engine/list.mjs components      components with fields + text budgets
//   node engine/list.mjs icons           icon names (+ search tags)
//   node engine/list.mjs roles           semantic roles
//   node engine/list.mjs characters      character options
//   node engine/list.mjs --authoring     regenerate AUTHORING.md from engine/authoring.template.md
import fs from 'node:fs';
import path from 'node:path';
import { COMPONENTS } from './components/index.mjs';
import { ICONS, ICON_ALIASES } from './icons/icons.mjs';
import { ROLES, describe } from './lib/schema.mjs';
import { CHARACTER_OPTIONS, CHARACTER_DEFAULTS } from './characters/character.mjs';
import { PAGE_RULES, TITLE_FIELDS, SECTION_COMMON } from './lib/validate.mjs';
import { KIT_DIR, ENGINE_DIR } from './lib/assets.mjs';

const uniq = [...new Set(Object.values(COMPONENTS))];

function componentsText(md = false) {
  const out = [];
  for (const c of uniq) {
    const fields = Object.entries(c.fields).map(([k, v]) => `    ${k}: ${describe(v, '    ')}`).join('\n');
    const head = md ? `### \`${c.name}\`${c.aliases ? ` (alias: ${c.aliases.map((a) => `\`${a}\``).join(', ')})` : ''}` : `${c.name}${c.aliases ? ` (alias ${c.aliases.join(', ')})` : ''}`;
    out.push(`${head}\n${md ? '' : '  '}${c.summary}${md ? '' : ''}\n${md ? '\n' : ''}${md ? '```text\n' : ''}  label: ${c.labelRequired ? 'required' : 'optional'}, default role: ${c.defaultRole({ component: c.name })}\n${fields}${md ? '\n```\n\nExample:\n\n```json\n' + JSON.stringify(c.example) + '\n```' + (c.example2 ? '\n\nExample (second form):\n\n```json\n' + JSON.stringify(c.example2) + '\n```' : '') : ''}\n`);
  }
  return out.join('\n');
}

function iconsText(md = false) {
  const names = Object.keys(ICONS);
  if (md) {
    return `${names.length} own icons (contact sheet: \`out/_icons.png\`):\n\n` +
      names.map((n) => `\`${n}\``).join(', ') +
      '\n\nAliases (same drawing): ' + Object.entries(ICON_ALIASES).map(([a, n]) => `\`${a}\` = \`${n}\``).join(', ') +
      '\n\nFallback: any [Lucide](https://lucide.dev/icons) name as `"lucide:<name>"` (e.g. `"lucide:rocket"`), drawn in the kit ink on a pastel disc. Prefer own icons; they carry colour.';
  }
  return names.map((n) => `  ${n.padEnd(16)} ${ICONS[n].tags}`).join('\n') +
    `\n  aliases: ${Object.entries(ICON_ALIASES).map(([a, n]) => `${a}=${n}`).join(', ')}` +
    `\n  (${names.length} icons; also "lucide:<name>" for any Lucide icon)`;
}

function rolesText(md = false) {
  return Object.entries(ROLES).map(([k, v]) => (md ? `- \`${k}\`: ${v}` : `  ${k.padEnd(9)} ${v}`)).join('\n');
}

function charactersText(md = false) {
  const lines = Object.entries(CHARACTER_OPTIONS).map(([k, v]) => (md ? `- \`${k}\`: ${v.join(' | ')} (default \`${CHARACTER_DEFAULTS[k]}\`)` : `  ${k.padEnd(10)} ${v.join(' | ')}   (default ${CHARACTER_DEFAULTS[k]})`));
  return lines.join('\n');
}

function pageText(md = false) {
  const t = Object.entries(TITLE_FIELDS).map(([k, v]) => `  ${k}: ${describe(v)}`).join('\n');
  const s = Object.entries(SECTION_COMMON).map(([k, v]) => `  ${k}: ${describe(v)}`).join('\n');
  const body = `title:\n${t}\nsection (every section):\n${s}\nrows: 2-${PAGE_RULES.maxRows}; sections per row: 1-${PAGE_RULES.maxSectionsPerRow}; sections per page: <= ${PAGE_RULES.maxSections}; ratio: one whole number 1-${PAGE_RULES.maxRatio} per section`;
  return md ? '```text\n' + body + '\n```' : body;
}

const arg = process.argv[2] || 'all';
if (arg === '--authoring') {
  const tpl = fs.readFileSync(path.join(ENGINE_DIR, 'authoring.template.md'), 'utf8');
  const outText = tpl
    .replace('{{PAGE}}', () => pageText(true))
    .replace('{{ROLES}}', () => rolesText(true))
    .replace('{{COMPONENTS}}', () => componentsText(true))
    .replace('{{ICONS}}', () => iconsText(true))
    .replace('{{CHARACTERS}}', () => charactersText(true));
  fs.writeFileSync(path.join(KIT_DIR, 'AUTHORING.md'), outText);
  console.log('wrote AUTHORING.md');
} else {
  if (arg === 'all' || arg === 'page') console.log(`PAGE\n${pageText()}\n`);
  if (arg === 'all' || arg === 'roles') console.log(`ROLES\n${rolesText()}\n`);
  if (arg === 'all' || arg === 'components' || arg === 'budgets') console.log(`COMPONENTS (text budgets = max visible characters)\n${componentsText()}`);
  if (arg === 'all' || arg === 'icons') console.log(`ICONS\n${iconsText()}\n`);
  if (arg === 'all' || arg === 'characters') console.log(`CHARACTERS (dialogue a.look / b.look)\n${charactersText()}\n`);
}
