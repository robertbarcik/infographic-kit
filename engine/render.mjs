#!/usr/bin/env node
// ==========================================================================
// Render + measure specs.
//   node engine/render.mjs specs/<name>.json [more.json ...]
//   node engine/render.mjs --all
// Writes out/<name>.html (static snapshot), .png (2480x3508), .pdf (A4, 1 page),
// .report.json (validator findings). Exit code 1 if any spec has errors.
// ==========================================================================
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { launch } from './lib/browser.mjs';
import { validateSpec, specWarnings } from './lib/validate.mjs';
import { buildHtml } from './lib/template.mjs';
import { KIT_DIR, ENGINE_DIR, roughSource } from './lib/assets.mjs';

const OUT = path.join(KIT_DIR, 'out');
const SPECS = path.join(KIT_DIR, 'specs');
const PAGE_W = 1240, PAGE_H = 1754;

function usage() {
  console.error('usage: node engine/render.mjs specs/<name>.json [...]   |   node engine/render.mjs --all');
  process.exit(2);
}

const args = process.argv.slice(2);
if (!args.length) usage();
let files;
if (args.includes('--all')) {
  files = fs.readdirSync(SPECS).filter((f) => f.endsWith('.json') && !f.startsWith('_')).sort().map((f) => path.join(SPECS, f));
} else {
  files = args.map((a) => path.resolve(a));
}
fs.mkdirSync(OUT, { recursive: true });

const clientJs = fs.readFileSync(path.join(ENGINE_DIR, 'client/page.js'), 'utf8');
const roughJs = roughSource();

function printFindings(list, prefix) {
  for (const f of list) console.error(`  ${prefix} ${typeof f === 'string' ? f : `[${f.code}] ${f.where}: ${f.message}`}`);
}

let failed = 0;
let browser = null;
try {
  for (const file of files) {
    const name = path.basename(file, '.json');
    const report = { spec: path.relative(KIT_DIR, file), name, ok: false, stage: 'schema', errors: [], warnings: [] };
    const reportPath = path.join(OUT, `${name}.report.json`);
    let spec;
    try {
      spec = JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch (e) {
      report.errors.push({ code: 'json', where: 'spec', message: `cannot read/parse ${file}: ${e.message}` });
    }
    if (spec) {
      const errs = validateSpec(spec);
      for (const e of errs) report.errors.push({ code: 'schema', where: e.split(':')[0], message: e.slice(e.indexOf(':') + 1).trim() });
      for (const w of specWarnings()) report.warnings.push({ code: 'lucide-fallback', where: 'spec', message: w });
    }
    if (report.errors.length) {
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
      console.error(`FAIL ${name}: ${report.errors.length} spec error(s) - nothing rendered`);
      printFindings(report.errors, '✗');
      failed++;
      continue;
    }

    browser = browser || (await launch());
    const page = await browser.newPage();
    const consoleErrors = [];
    page.on('pageerror', (e) => consoleErrors.push(String(e)));
    page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
    await page.setViewport({ width: PAGE_W, height: PAGE_H, deviceScaleFactor: 2 });
    await page.setContent(buildHtml(spec, name), { waitUntil: 'load' });
    await page.addScriptTag({ content: roughJs });
    await page.addScriptTag({ content: clientJs });
    report.stage = 'layout';
    const res = await page.evaluate((seedKey) => window.__IK.run({ seedKey }), name);
    Object.assign(report, { fit: res.fit, stats: res.stats });
    report.errors.push(...res.errors);
    report.warnings.push(...res.warnings);
    for (const c of consoleErrors) report.errors.push({ code: 'browser', where: 'page', message: c });

    // static snapshot: drop the runtime scripts, keep the drawn SVG
    await page.evaluate(() => document.querySelectorAll('script').forEach((s) => s.remove()));
    const html = await page.content();
    fs.writeFileSync(path.join(OUT, `${name}.html`), html);
    const pngPath = path.join(OUT, `${name}.png`);
    await page.screenshot({ path: pngPath, clip: { x: 0, y: 0, width: PAGE_W, height: PAGE_H } });
    const pdfPath = path.join(OUT, `${name}.pdf`);
    await page.addStyleTag({ content: '@page { size: A4; margin: 0 } html,body{ -webkit-print-color-adjust: exact; print-color-adjust: exact; }' });
    await page.pdf({ path: pdfPath, format: 'A4', printBackground: true, scale: 0.6398, margin: { top: 0, right: 0, bottom: 0, left: 0 }, pageRanges: '1' });
    // determinism: pin the creation/mod timestamps (same byte length, so xref offsets stay valid)
    const pdf = fs.readFileSync(pdfPath, 'latin1').replace(/\((D:\d{14}[^)]*)\)/g, (m, d) => `(${'D:20000101000000Z'.padEnd(d.length, ' ')})`);
    fs.writeFileSync(pdfPath, pdf, 'latin1');
    await page.close();

    report.stage = 'done';
    report.ok = report.errors.length === 0;
    report.outputs = { html: `out/${name}.html`, png: `out/${name}.png`, pdf: `out/${name}.pdf` };
    report.pngSha256 = crypto.createHash('sha256').update(fs.readFileSync(pngPath)).digest('hex');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    const f = report.fit;
    const summary = `k=${f.k}, body ${f.bodyPx}px, min text ${report.stats.minFontPx}px, empty ${f.emptyPct}%, ${report.warnings.length} warning(s)`;
    if (report.ok) {
      console.log(`OK   ${name}: ${summary}`);
      printFindings(report.warnings, '!');
    } else {
      failed++;
      console.error(`FAIL ${name}: ${report.errors.length} layout error(s); ${summary} (outputs written for inspection)`);
      printFindings(report.errors, '✗');
      printFindings(report.warnings, '!');
    }
  }
} finally {
  if (browser) await browser.close();
}
process.exit(failed ? 1 : 0);
