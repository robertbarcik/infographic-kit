import { text, optText, list, obj, role } from '../lib/schema.mjs';

export default {
  name: 'layer-stack',
  summary: 'coloured stacked layers (top to bottom), one description per layer, side axis label, optional bracket over a range of layers',
  labelRequired: true,
  fields: {
    layers: list(obj({ name: text(14), text: text(64, { lines: 2 }), role: role({ doc: 'default cycles rose, yellow, green, blue, purple' }) }), 2, 7, { doc: 'top layer first' }),
    axis: obj({ upper: optText(36), lower: optText(36) }, { required: false, doc: 'labels at the upper and lower end of the side arrow' }),
    bracket: obj({ from: text(14, { doc: 'name of the first layer in the range' }), to: text(14, { doc: 'name of the last layer' }), label: text(40) }, { required: false, doc: 'a bracket on the right over a range of layers, e.g. "each VM repeats these"' }),
  },
  defaultRole: () => 'info',
  check(sec, where, errs) {
    if (!sec.bracket || !Array.isArray(sec.layers)) return;
    const names = sec.layers.map((l) => l && l.name);
    const a = names.indexOf(sec.bracket.from), b = names.indexOf(sec.bracket.to);
    if (a < 0) errs.push(`${where}.bracket.from: no layer named "${sec.bracket.from}"`);
    if (b < 0) errs.push(`${where}.bracket.to: no layer named "${sec.bracket.to}"`);
    if (a >= 0 && b >= 0 && b < a) errs.push(`${where}.bracket: "from" must be above "to"`);
  },
  example: {
    label: 'A layered protocol stack', component: 'layer-stack',
    axis: { upper: 'Higher layers (closer to users)', lower: 'Lower layers (closer to hardware)' },
    layers: [{ name: 'Application', text: 'network applications (e.g. HTTP, DNS)' }, { name: 'Transport', text: 'end-to-end communication (e.g. TCP, UDP)' }],
    bracket: { from: 'Application', to: 'Transport', label: 'in the operating system and apps' },
  },
  render(sec, ctx) {
    const axis = sec.axis
      ? `<div class="ls-axis">
          ${sec.axis.upper ? ctx.t(sec.axis.upper, 'ls-axis-t', 'axis.upper') : ''}
          <div class="ls-axis-arrow" data-rough="arrow" data-dir="both-v" data-tone="neutral"></div>
          ${sec.axis.lower ? ctx.t(sec.axis.lower, 'ls-axis-t', 'axis.lower') : ''}
        </div>`
      : '';
    const rows = sec.layers.map((l, i) => `
        <div class="ls-name ${ctx.rc(ctx.role(l.role, i, 'layers'))}" style="grid-row:${i + 1}" data-rough="card" data-box>${ctx.t(l.name, 'ls-name-t', `layers[${i}].name`)}</div>
        <div class="ls-desc" style="grid-row:${i + 1}"><span class="ls-dash"></span>${ctx.t(l.text, 'ls-desc-t', `layers[${i}].text`)}</div>`).join('');
    let bracket = '';
    let mode = '';
    let shift = 0;
    if (sec.bracket) {
      const names = sec.layers.map((l) => l.name);
      const a = names.indexOf(sec.bracket.from), b = names.indexOf(sec.bracket.to);
      // wide section: label beside the bracket. Narrow section: a slim bracket, the label above
      // it (range starts at the top layer) or below it (range ends at the bottom layer)
      const narrow = (ctx.frac || 1) < 0.7;
      mode = !narrow ? 'side' : a === 0 ? 'top' : b === names.length - 1 ? 'bottom' : 'side';
      shift = mode === 'top' ? 1 : 0;
      const lbl = ctx.t(sec.bracket.label, 'ls-br-t', 'bracket.label');
      if (mode === 'side') {
        bracket = `<div class="ls-bracket" style="grid-row:${a + 1} / ${b + 2}"><div class="ls-br-line" data-rough="bracket"></div>${lbl}</div>`;
      } else {
        const lr = mode === 'top' ? 1 : names.length + 1;
        bracket = `<div class="ls-bracket slim" style="grid-row:${a + 1 + shift} / ${b + 2 + shift}"><div class="ls-br-line" data-rough="bracket"></div></div>
          <div class="ls-br-label ${mode}" style="grid-row:${lr}">${lbl}</div>`;
      }
    }
    const rowsShifted = shift ? rows.replace(/grid-row:(\d+)/g, (m, r) => `grid-row:${Number(r) + shift}`) : rows;
    return `<div class="lstack${axis ? ' has-axis' : ''}">${axis}<div class="ls-layers${bracket ? ` has-bracket br-${mode}` : ''}">${rowsShifted}${bracket}</div></div>`;
  },
};
