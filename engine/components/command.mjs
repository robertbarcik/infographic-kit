import { text, optText, list, obj } from '../lib/schema.mjs';
import { esc } from '../lib/markup.mjs';

// Terminal strip: 1-4 command lines (first with a prompt, the rest as continuation lines),
// optional output line and a one-line explanation beside it. Command text is shown verbatim
// (no markup), wraps only after spaces and / . ? & = , _
const breakable = (s) => esc(s).replace(/(&(?:amp|lt|gt|quot);)|([\/.?=,_])(?=[^\s<])/g, (m, ent, ch) => (ent ? (ent === '&amp;' ? ent + '<wbr>' : ent) : ch + '<wbr>'));

export default {
  name: 'command',
  summary: 'terminal strip(s): a real command on 1-4 lines, optional output line, one-line explanation',
  labelRequired: true,
  fields: {
    intro: optText(90),
    items: list(obj({
      lines: list(text(64, { doc: 'verbatim; end a line with \\ to continue it' }), 1, 4),
      output: optText(120, { lines: 3, doc: 'what the terminal prints (shown dimmer); \\n starts a new output line' }),
      note: optText(100, { doc: 'what the command does' }),
    }), 1, 3),
  },
  defaultRole: () => 'action',
  example: {
    label: 'Order from a terminal', component: 'command',
    items: [{
      lines: ['curl -X POST https://api.example.com/orders \\', '  -H "Content-Type: application/json" \\', "  -d '{\"dish\":\"soup\"}'"],
      output: 'HTTP/1.1 201 Created',
      note: 'creates a new order; the answer says where it lives',
    }],
  },
  render(sec, ctx) {
    // one terminal window per section: each command with its output, its note underneath in a
    // muted hand, a dashed rule between commands
    const items = sec.items.map((it, i) => {
      const lines = it.lines.map((l, j) => `<div class="t term-line${j ? ' cont' : ''}" data-where="${esc(ctx.where)} › items[${i}].lines[${j}]">${j ? '' : '<span class="prompt">$</span>'}${breakable(l)}</div>`).join('');
      const out = it.output ? `<div class="term-out">${it.output.split('\n').map((o, j) => `<div class="t term-out-l" data-where="${esc(ctx.where)} › items[${i}].output[${j}]">${breakable(o)}</div>`).join('')}</div>` : '';
      return `<div class="term-item">${lines}${out}${it.note ? ctx.t(it.note, 'term-note', `items[${i}].note`) : ''}</div>`;
    }).join('');
    return `<div class="cmds n${sec.items.length}">${sec.intro ? ctx.t(sec.intro, 'cmd-intro', 'intro') : ''}
      <div class="term" data-rough="term" data-box>
        <div class="term-bar" aria-hidden="true"><i></i><i></i><i></i></div>
        <div class="term-body">${items}</div>
      </div></div>`;
  },
};
