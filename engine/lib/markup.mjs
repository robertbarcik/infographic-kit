// Inline markup: **bold**, `code`, "->" (drawn arrow), newline -> line break. Nothing else.
export function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// the fonts have no "→" glyph, so arrows are drawn as a tiny inline SVG in ink
const ARROW = '<svg class="inl-arrow" viewBox="0 0 24 12" aria-label="→"><path d="M2 6.3 C8 5.6 14 6.4 20 6 M15.5 2.2 L20.6 6 L15.8 9.8" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

export function md(s) {
  let out = esc(s);
  // `code` first so ** inside code stays literal
  const codes = [];
  out = out.replace(/`([^`]+)`/g, (_, c) => { codes.push(c); return `\u0000${codes.length - 1}\u0000`; });
  // keep hyphenated words whole ("Wi-Fi", "end-to-end") instead of breaking after the hyphen
  out = out.replace(/([0-9A-Za-zÀ-ɏ]+(?:-[0-9A-Za-zÀ-ɏ]+)+)/g, '<span class="nw">$1</span>');
  out = out.replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');
  out = out.replace(/\s*(-&gt;|→)\s*/g, ` ${ARROW} `);
  // code wraps only at sensible points: spaces, and after / . ? & = , _ (never inside a flag like -c,
  // never inside an HTML entity)
  const breakable = (c) => c.replace(/(&(?:amp|lt|gt|quot);)|([\/.?=,_])(?=[^\s<])/g, (m, ent, ch) => {
    if (ent) return ent === '&amp;' ? ent + '<wbr>' : ent;
    return ch + '<wbr>';
  });
  // short code (<= 24 chars) never breaks; longer code wraps only at the sensible points
  out = out.replace(/\u0000(\d+)\u0000/g, (_, i) => { const c = codes[Number(i)]; return c.replace(/&[a-z]+;/g, '_').length <= 24 ? `<code class="nw">${c}</code>` : `<code>${breakable(c)}</code>`; });
  out = out.replace(/\n/g, '<br>');
  return out;
}

/** plain text (for alt/labels/ids) */
export function plain(s) {
  return String(s).replace(/\*\*/g, '').replace(/`/g, '').replace(/->/g, '→');
}
