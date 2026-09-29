/* ==========================================================================
   In-page runtime (runs inside headless Chrome, never in the final HTML):
     1. auto-fit: pick the scale --k so the content fills the page
     2. distribute the small remainder over the rows
     3. draw every hand-drawn outline / arrow with rough.js (seeded)
     4. measure: overflow, clipping, overlap, out-of-page, font size, glyphs
   Returns a report object to render.mjs.
   ========================================================================== */
(function () {
  // type scale floor 1.0: body >= 19 px, smallest text >= 17 px (reference density)
  const K_MIN = 1.0, K_MAX = 1.4;
  const VS_MAX = 1.3; // vertical spacing may stretch at most 30 %: boxes hug their content
  const MIN_FONT_PX = 17;
  const EMPTY_LIMIT = 0.08;
  const SVGNS = 'http://www.w3.org/2000/svg';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const cssVar = (el, name) => getComputedStyle(el).getPropertyValue(name).trim();

  function hashStr(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return (h >>> 0) % 2147483000 + 1;
  }

  // --------------------------------------------------------------- fit ----
  const page = () => $('#page');
  const content = () => $('#content');

  function fitTitle() {
    const t = $('.title');
    if (!t) return;
    const base = parseFloat(getComputedStyle(document.documentElement).fontSize) * 4.1;
    const parts = [t, $('.subtitle')].filter(Boolean);
    const textW = (el) => { const r = document.createRange(); r.selectNodeContents(el); return r.getBoundingClientRect().width; };
    for (const el of parts) {
      const b = el === t ? base : base * 0.58; // subtitle clearly secondary
      let fs = b;
      el.style.fontSize = fs + 'px';
      el.style.whiteSpace = 'nowrap';
      // 10 px safety: the per-letter tilt makes glyph boxes a little wider than the layout box
      while (textW(el) > el.clientWidth - 10 && fs > b * 0.62) {
        fs -= 1;
        el.style.fontSize = fs + 'px';
      }
      if (textW(el) > el.clientWidth - 10) {
        el.style.whiteSpace = 'normal';
        el.style.fontSize = b * 0.8 + 'px';
      }
    }
  }

  /** dialogue: grow both people (up to 1.15x) until they match the centre column's height */
  function balanceDialogues() {
    for (const d of $$('.dlg')) {
      d.style.removeProperty('--cw');
      const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
      const base = (d.classList.contains("is-chat") ? 9.6 : 12.2) * rem;
      let cw = base;
      for (let i = 0; i < 4; i++) {
        const center = d.querySelector('.dlg-center').getBoundingClientRect().height;
        const name = d.querySelector('.dlg-name').getBoundingClientRect().height;
        const want = Math.max(base, Math.min(base * 1.15, (center - name - 4) / 1.1429));
        if (Math.abs(want - cw) < 1) break;
        cw = want;
        d.style.setProperty('--cw', cw.toFixed(1) + 'px');
      }
    }
  }

  function naturalHeight(k) {
    document.documentElement.style.setProperty('--k', String(k));
    fitTitle();
    balanceDialogues();
    const c = content();
    const r = $('#rows').getBoundingClientRect();
    return r.bottom - c.getBoundingClientRect().top;
  }

  function fit(report) {
    const pg = page();
    const avail = content().getBoundingClientRect().height; // fixed-height box before going natural
    pg.classList.add('natural');
    let lo = K_MIN, hi = K_MAX, k;
    const hMin = naturalHeight(K_MIN);
    const hMax = naturalHeight(K_MAX);
    if (hMax <= avail) {
      k = K_MAX;
    } else if (hMin > avail) {
      k = K_MIN;
    } else {
      for (let i = 0; i < 18; i++) {
        const mid = (lo + hi) / 2;
        if (naturalHeight(mid) <= avail) lo = mid; else hi = mid;
      }
      k = lo;
    }
    // stage 2: line wrapping makes height jump with k; take up the rest with vertical
    // spacing only (gaps + vertical padding), which cannot change any wrapping
    const setVs = (v) => document.documentElement.style.setProperty('--vs', String(v));
    let vs = 1;
    if (naturalHeight(k) < avail) {
      let vlo = 1, vhi = VS_MAX;
      setVs(VS_MAX);
      if (naturalHeight(k) <= avail) vlo = VS_MAX;
      else {
        for (let i = 0; i < 14; i++) {
          const mid = (vlo + vhi) / 2;
          setVs(mid);
          if (naturalHeight(k) <= avail) vlo = mid; else vhi = mid;
        }
      }
      vs = vlo;
    }
    setVs(vs);
    const used = naturalHeight(k);
    const leftover = avail - used;
    const pageH = pg.getBoundingClientRect().height;
    report.fit = {
      k: +k.toFixed(4),
      vs: +vs.toFixed(3),
      bodyPx: +(parseFloat(getComputedStyle(document.documentElement).fontSize) * 1.06).toFixed(2),
      usedPx: Math.round(used), availPx: Math.round(avail),
      emptyPct: +((Math.max(0, leftover) / pageH) * 100).toFixed(2),
    };
    if (leftover < -0.5) {
      // name the biggest rows so the author knows what to cut
      const rows = $$('.row').map((r, i) => ({ i, h: Math.round(r.getBoundingClientRect().height), what: $$('.sec', r).map((s) => s.dataset.where.replace(/^rows\[\d+\]\.sections\[\d+\](\.stack\[\d+\])?\s*/, '')).join(' + ') })).sort((a, b) => b.h - a.h);
      const linePx = parseFloat(getComputedStyle(document.documentElement).fontSize) * 1.06 * 1.17;
      const cut = Math.ceil(-leftover);
      report.errors.push({ code: 'page-overflow', where: 'page', message: `page overflow: content is ${cut} px too tall at the smallest type scale (k=${K_MIN}, body ${(linePx / 1.17).toFixed(0)} px). Cut about ${Math.ceil(cut / linePx)} line(s) of body text, or drop an item/section. Tallest rows: ${rows.slice(0, 3).map((r) => `rows[${r.i}] ${r.h} px (${r.what})`).join('; ')}.` });
    } else if (leftover / pageH > EMPTY_LIMIT) {
      report.errors.push({ code: 'page-underfilled', where: 'page', message: `page under-filled: ${(leftover / pageH * 100).toFixed(1)} % of the page stays empty at the largest type scale (k=${K_MAX}) and spacing cap (vs=${VS_MAX}); limit ${EMPTY_LIMIT * 100} %. Add content (a section, an example, a key sentence); boxes are never inflated to fill.` });
    }

    // unbalanced rows (measured in natural state, before stretching)
    $$('.row').forEach((row, ri) => {
      const secs = $$(':scope > .sec, :scope > .stack', row);
      if (secs.length < 2) return;
      row.style.alignItems = 'start';
      const hs = secs.map((s) => s.getBoundingClientRect().height);
      row.style.alignItems = '';
      const max = Math.max(...hs);
      secs.forEach((s, si) => {
        const gap = max - hs[si];
        if (gap / max > 0.3 && gap > 90) {
          const w = s.dataset.where || s.querySelector('[data-where]').dataset.where;
          report.warnings.push({ code: 'unbalanced-row', where: w, message: `section is ${Math.round(gap)} px shorter than the tallest in its row; it will be stretched with empty space inside. Balance the content or change the ratio.` });
        }
      });
    });

    // distribute the small remainder: only rows with real content grow (in proportion to their
    // height); rows made only of callouts keep their natural height and hug their text
    const rows = $$('.row');
    const nat = rows.map((r) => r.getBoundingClientRect().height);
    const hugs = rows.map((r) => $$('.sec', r).every((s) => s.classList.contains('comp-callout')));
    const anyGrow = hugs.some((h) => !h);
    pg.classList.remove('natural');
    // on overflow rows keep their natural height (no squeezing -> no misleading "clipped" errors)
    const shrink = leftover < -0.5 ? 0 : 1;
    report.overflow = leftover < -0.5;
    rows.forEach((r, i) => { r.style.flex = `${hugs[i] && anyGrow ? 0 : Math.max(0, nat[i])} ${shrink} ${nat[i]}px`; });
    return k;
  }

  // ------------------------------------------------------------ drawing ----
  function roundedRectPath(x, y, w, h, r) {
    r = Math.max(0, Math.min(r, w / 2, h / 2));
    return `M${x + r} ${y} H${x + w - r} Q${x + w} ${y} ${x + w} ${y + r} V${y + h - r} Q${x + w} ${y + h} ${x + w - r} ${y + h} H${x + r} Q${x} ${y + h} ${x} ${y + h - r} V${y + r} Q${x} ${y} ${x + r} ${y} Z`;
  }

  /** rounded rect with a tail whose tip is (tx, ty); the tail leaves the edge that faces the tip */
  function bubbleToPath(x, y, w, h, r, tx, ty) {
    const hw = Math.min(10, w * 0.12, h * 0.28);
    let edge;
    if (ty > y + h) edge = (tx < x - 4 && ty < y + h + 30) ? 'left' : (tx > x + w + 4 && ty < y + h + 30) ? 'right' : 'bottom';
    else if (ty < y) edge = 'top';
    else edge = tx < x ? 'left' : 'right';
    const cl = (v, a, b) => Math.max(a, Math.min(b, v));
    const ax = cl(tx, x + r + hw + 2, x + w - r - hw - 2);
    const ay = cl(ty, y + r + hw + 2, y + h - r - hw - 2);
    let d = `M${x + r} ${y}`;
    if (edge === 'top') d += ` H${ax - hw} L${tx} ${ty} L${ax + hw} ${y}`;
    d += ` H${x + w - r} Q${x + w} ${y} ${x + w} ${y + r}`;
    if (edge === 'right') d += ` V${ay - hw} L${tx} ${ty} L${x + w} ${ay + hw}`;
    d += ` V${y + h - r} Q${x + w} ${y + h} ${x + w - r} ${y + h}`;
    if (edge === 'bottom') d += ` H${ax + hw} L${tx} ${ty} L${ax - hw} ${y + h}`;
    d += ` H${x + r} Q${x} ${y + h} ${x} ${y + h - r}`;
    if (edge === 'left') d += ` V${ay + hw} L${tx} ${ty} L${x} ${ay - hw}`;
    d += ` V${y + r} Q${x} ${y} ${x + r} ${y} Z`;
    return d;
  }

  /** tail tip for a bubble: points at the speaker's mouth, stops short of it */
  function tailTip(el, x, y, w, h, pr) {
    const sec = el.closest('.sec') || document;
    const who = el.dataset.mouth;
    const svg = who && sec.querySelector(`.person[data-person="${CSS.escape(who)}"] svg.char`);
    if (!svg) return [x + w * 0.3, y + h + 16];
    const b = svg.getBoundingClientRect();
    // obstacles a tail must avoid: the speaker's raised arm/hand/prop, and every other bubble
    const person = svg.closest('.person');
    const avoid = [
      ...$$('.char-part[data-part="gesture"]', person).map((p) => toPage(p.getBoundingClientRect(), pr)),
      ...$$('.bubble', sec).filter((o) => o !== el).map((o) => toPage(o.getBoundingClientRect(), pr)),
    ];
    if (el.dataset.chat) {
      // chat: a normal-length tail leaves the side facing the speaker, points at the head,
      // and slides along that side until it clears raised hands, props and other bubbles
      const hx = b.left - pr.left + b.width * 0.5, hy = b.top - pr.top + b.height * (60 / 160);
      const leftSide = hx < x;
      const ex = leftSide ? x : x + w;
      const LEN = window.__IK_TEST_TAIL || 28; // test hook: selftest shortens it
      const fr = [0.5, 0.3, 0.7, 0.18, 0.82];
      let best = null;
      for (const f of fr) {
        const sy = y + 12 + (h - 24) * f;
        let dx = hx - ex, dy = hy - sy;
        // keep the tail readable: at most ~50 degrees off horizontal
        if (Math.abs(dy) > Math.abs(dx) * 1.2) dy = Math.sign(dy) * Math.abs(dx) * 1.2;
        const d = Math.hypot(dx, dy) || 1;
        const cand = { sx: ex, sy, tx: ex + (dx / d) * LEN, ty: sy + (dy / d) * LEN };
        const seg = { x1: cand.sx, y1: cand.sy, x2: cand.tx, y2: cand.ty };
        const bad = avoid.filter((r) => segHitsRectG(seg, inflate(r, 3))).length;
        if (!best || bad < best.bad) best = { ...cand, bad };
        if (!bad) break;
      }
      TAILS.push({ el, who, person, x1: best.sx, y1: best.sy, x2: best.tx, y2: best.ty });
      return [best.tx, best.ty];
    }
    // aim at the mouth; if that path is blocked, at the middle, then the top of the head
    const aims = [[0.5, 80 / 160], [0.5, 60 / 160], [0.5, 40 / 160]];
    const cap = el.dataset.shortTail ? 20 : 46; // chat: short stub; single bubble: reaches towards the mouth
    let pick = null;
    for (const [fx, fy] of aims) {
      const mx = b.left - pr.left + b.width * fx, my = b.top - pr.top + b.height * fy;
      const sx = Math.max(x + 10, Math.min(x + w - 10, mx)), sy = Math.max(y, Math.min(y + h, my));
      const dx = mx - sx, dy = my - sy, dist = Math.hypot(dx, dy) || 1;
      const len = Math.max(14, Math.min(dist - b.width * 0.2, cap));
      const cand = { sx, sy, tx: sx + (dx / dist) * len, ty: sy + (dy / dist) * len };
      const seg = { x1: cand.sx, y1: cand.sy, x2: cand.tx, y2: cand.ty };
      const clear = avoid.every((r) => !segHitsRectG(seg, inflate(r, 3)));
      if (!pick) pick = cand;
      if (clear) { pick = cand; break; }
    }
    TAILS.push({ el, who, person, x1: pick.sx, y1: pick.sy, x2: pick.tx, y2: pick.ty });
    return [pick.tx, pick.ty];
  }
  const TAILS = [];

  function bubblePath(x, y, w, h, r, tail) {
    // tail on the bottom edge: bl = near the left, going down-left; br = near the right, going down-right
    const tw = Math.min(22, w * 0.18);
    const th = 16;
    let d = `M${x + r} ${y} H${x + w - r} Q${x + w} ${y} ${x + w} ${y + r} V${y + h - r} Q${x + w} ${y + h} ${x + w - r} ${y + h}`;
    if (tail === 'br') {
      const tx = x + w * 0.72;
      d += ` H${tx + tw} L${tx + tw + 12} ${y + h + th} L${tx} ${y + h}`;
    }
    if (tail === 'bl') {
      const tx = x + w * 0.28;
      d += ` H${tx} L${tx - tw - 12} ${y + h + th} L${tx - tw} ${y + h}`;
    }
    d += ` H${x + r} Q${x} ${y + h} ${x} ${y + h - r} V${y + r} Q${x} ${y} ${x + r} ${y} Z`;
    return d;
  }

  // ------------------------------------------------ edge geometry + label placement ----
  const toPage = (r, pr) => ({ left: r.left - pr.left, top: r.top - pr.top, right: r.right - pr.left, bottom: r.bottom - pr.top });
  const inflate = (r, d) => ({ left: r.left - d, top: r.top - d, right: r.right + d, bottom: r.bottom + d });
  const rectsHit = (a, b) => Math.min(a.right, b.right) - Math.max(a.left, b.left) > 0 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 0;

  function segHitsRectG(s, r) {
    let t0 = 0, t1 = 1;
    const dx = s.x2 - s.x1, dy = s.y2 - s.y1;
    for (const [p, q] of [[-dx, s.x1 - r.left], [dx, r.right - s.x1], [-dy, s.y1 - r.top], [dy, r.bottom - s.y1]]) {
      if (p === 0) { if (q < 0) return false; continue; }
      const t = q / p;
      if (p < 0) { if (t > t1) return false; if (t > t0) t0 = t; } else { if (t < t0) return false; if (t < t1) t1 = t; }
    }
    return t1 - t0 > 0.001;
  }

  /** place an absolutely positioned element (label/badge) near a segment, clear of obstacles */
  /** unit normal of a segment that points "up" on the page (or left for near-vertical segments) */
  function upNormal(seg) {
    const len = Math.hypot(seg.x2 - seg.x1, seg.y2 - seg.y1) || 1;
    let nx = -(seg.y2 - seg.y1) / len, ny = (seg.x2 - seg.x1) / len;
    if (ny > 0.2 || (Math.abs(ny) <= 0.2 && nx > 0)) { nx = -nx; ny = -ny; }
    return [nx, ny];
  }

  function placeAt(el, host, cx, cy, pr) {
    const hr = toPage(host.getBoundingClientRect(), pr);
    const er = el.getBoundingClientRect();
    el.style.left = (cx - er.width / 2 - hr.left) + 'px';
    el.style.top = (cy - er.height / 2 - hr.top) + 'px';
    return { left: cx - er.width / 2, top: cy - er.height / 2, right: cx + er.width / 2, bottom: cy + er.height / 2 };
  }

  /** place a label beside a segment. `normals`: [[nx, ny, penalty], ...] - the preferred side has
   *  penalty 0; the other side is only used when the preferred one collides everywhere */
  function placeNear(el, host, seg, ts, normals, obstacles, pr) {
    const hr = toPage(host.getBoundingClientRect(), pr);
    const er = el.getBoundingClientRect();
    const w = er.width, h = er.height;
    let best = null;
    const cands = [];
    for (const far of [1, 1.7]) for (const nrm of normals) for (const t of ts) cands.push([nrm, t, far]);
    for (const [[nx, ny, pen], t, far] of cands) {
      {
        const ext = Math.abs(nx) * w / 2 + Math.abs(ny) * h / 2 + 7;
        const cx = seg.x1 + (seg.x2 - seg.x1) * t + nx * (ext + (far - 1) * 14);
        const cy = seg.y1 + (seg.y2 - seg.y1) * t + ny * (ext + (far - 1) * 14);
        const r = { left: cx - w / 2, top: cy - h / 2, right: cx + w / 2, bottom: cy + h / 2 };
        // score: hard collisions dominate; then prefer spots with some breathing room
        let hits = 0, near = 0;
        if (r.left < hr.left + 3 || r.right > hr.right - 3 || r.top < hr.top + 3 || r.bottom > hr.bottom - 3) hits += 5;
        for (const o of obstacles) {
          if (o.seg ? segHitsRectG(o.seg, inflate(r, 3)) : rectsHit(inflate(r, 2), o.rect)) hits++;
          else if (o.seg ? segHitsRectG(o.seg, inflate(r, 12)) : rectsHit(inflate(r, 12), o.rect)) near++;
        }
        const score = hits * 100 + (pen || 0) + near + (far > 1 ? 0.5 : 0);
        if (!best || score < best.score) best = { score, hits, r };
      }
    }
    if (window.__IK_DEBUG) window.__IK_DEBUG.push({ txt: el.textContent.trim(), score: best.score, n: cands.length });
    el.style.left = (best.r.left - hr.left) + 'px';
    el.style.top = (best.r.top - hr.top) + 'px';
    return best.r;
  }

  /** compute all illustration edges; position their labels and number badges; return draw ops */
  function layoutIllustrationEdges(pr) {
    const ops = [];
    for (const stage of $$('.ill-stage')) {
      const inset = (r) => { const dx = r.width * 0.1, dy = r.height * 0.14; return { left: r.left + dx, right: r.right - dx, top: r.top + dy, bottom: r.bottom - dy, width: r.width - 2 * dx, height: r.height - 2 * dy }; };
      const GAP = 8;
      const lines = [];
      // 1. each edge leaves its source on the side facing the target and enters the target on the
      //    side facing the source; edges sharing a side are spread along it (no single crowded point)
      const pg = (r) => ({ left: r.left - pr.left, top: r.top - pr.top, right: r.right - pr.left, bottom: r.bottom - pr.top, width: r.width, height: r.height });
      const raw = [];
      for (const e of $$('.edge', stage)) {
        const fromN = stage.querySelector(`[data-node="${CSS.escape(e.dataset.from)}"]`);
        const toN = stage.querySelector(`[data-node="${CSS.escape(e.dataset.to)}"]`);
        if (!fromN || !toN) continue;
        const a = pg(inset(fromN.querySelector('.node-icon').getBoundingClientRect()));
        const b = pg(inset(toN.querySelector('.node-icon').getBoundingClientRect()));
        const aBox = pg(fromN.getBoundingClientRect()), bBox = pg(toN.getBoundingClientRect());
        const ac = [(a.left + a.right) / 2, (a.top + a.bottom) / 2], bc = [(b.left + b.right) / 2, (b.top + b.bottom) / 2];
        const dx = bc[0] - ac[0], dy = bc[1] - ac[1];
        const horiz = Math.abs(dx) >= Math.abs(dy) * 0.6;
        const out = horiz ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'bottom' : 'top');
        const inn = horiz ? (dx > 0 ? 'left' : 'right') : (dy > 0 ? 'top' : 'bottom');
        raw.push({ e, a, b, aBox, bBox, ac, bc, out, inn });
      }
      const spread = (keyFn, sideKey, ordFn) => {
        const groups = new Map();
        raw.forEach((r) => { const k = keyFn(r); if (!groups.has(k)) groups.set(k, []); groups.get(k).push(r); });
        for (const g of groups.values()) {
          g.sort((p, q) => ordFn(p) - ordFn(q));
          g.forEach((r, i) => { r[sideKey] = g.length === 1 ? 0.5 : 0.25 + (0.5 * i) / (g.length - 1); });
        }
      };
      spread((r) => r.e.dataset.from + '|' + r.out, 'fo', (r) => (r.out === 'left' || r.out === 'right' ? r.bc[1] : r.bc[0]));
      spread((r) => r.e.dataset.to + '|' + r.inn, 'fi', (r) => (r.inn === 'left' || r.inn === 'right' ? r.ac[1] : r.ac[0]));
      const port = (rect, box, side, f, gap) => {
        if (side === 'right') return [rect.right + gap, rect.top + rect.height * f];
        if (side === 'left') return [rect.left - gap, rect.top + rect.height * f];
        if (side === 'top') return [rect.left + rect.width * f, rect.top - gap];
        return [rect.left + rect.width * f, box.bottom + gap]; // bottom: below the node label
      };
      for (const r of raw) {
        const e = r.e;
        const [x1, y1] = port(r.a, r.aBox, r.out, r.fo, GAP);
        const [x2, y2] = port(r.b, r.bBox, r.inn, r.fi, GAP);
        const len = Math.hypot(x2 - x1, y2 - y1) || 1;
        const nx = -(y2 - y1) / len, ny = (x2 - x1) / len;
        // two-way pair: the forward arrow runs on the upper side, the answer on the lower side
        const two = e.dataset.back === '1';
        const base = { x1, y1, x2, y2 };
        const [ux2, uy2] = upNormal(base);
        const off = two ? 6 : 0;
        const fwd = { x1: x1 + ux2 * off, y1: y1 + uy2 * off, x2: x2 + ux2 * off, y2: y2 + uy2 * off };
        lines.push({ e, seg: fwd, base, up: [ux2, uy2], color: toneColor(e.dataset.tone), dash: e.dataset.dash === '1' });
        if (two) lines.push({ e, seg: { x1: x2 - ux2 * off, y1: y2 - uy2 * off, x2: x1 - ux2 * off, y2: y1 - uy2 * off }, base, up: [ux2, uy2], color: toneColor('response'), dash: false, back: true });
      }
      // obstacles: every arrow of this stage and every node (icon + label)
      const obstacles = lines.map((l) => ({ seg: l.seg }));
      for (const nd of $$('.node', stage)) obstacles.push({ rect: toPage(nd.getBoundingClientRect(), pr) });
      // number badges sit ON their own edge (the middle of the pair), drawn over the arrows
      const hasStep = new Set();
      for (const l of lines) {
        if (l.back) continue;
        const st = stage.querySelector(`.edge-step[data-for="${l.e.dataset.i}s"]`);
        if (!st) continue;
        hasStep.add(l.e.dataset.i);
        const b = l.base;
        obstacles.push({ rect: placeAt(st, stage, (b.x1 + b.x2) / 2, (b.y1 + b.y2) / 2, pr) });
      }
      // labels: forward label always on the upper side, answer label always on the lower side
      for (const l of lines) {
        const i = l.e.dataset.i;
        const lbl = stage.querySelector(`.edge-label[data-for="${l.back ? i + 'b' : i}"]`);
        if (lbl) {
          const [ux2, uy2] = l.up;
          const pref = l.back ? [-ux2, -uy2, 0] : [ux2, uy2, 0];
          const other = [-pref[0], -pref[1], 60];
          const ts = hasStep.has(i) ? [0.72, 0.3, 0.8, 0.22] : [0.5, 0.6, 0.4, 0.7, 0.3];
          const r = placeNear(lbl, stage, l.back ? { x1: l.seg.x2, y1: l.seg.y2, x2: l.seg.x1, y2: l.seg.y1 } : l.seg, ts, [pref, other], obstacles, pr);
          obstacles.push({ rect: r });
        }
        ops.push(l);
      }
    }
    return ops;
  }

  /** commit-graph connections between dots */
  function layoutCommitEdges(pr) {
    const ops = [];
    for (const e of $$('.cg-edge')) {
      const g = e.closest('.cg');
      const a = g.querySelector(`.cg-dot[data-commit="${CSS.escape(e.dataset.from)}"]`);
      const b = g.querySelector(`.cg-dot[data-commit="${CSS.escape(e.dataset.to)}"]`);
      if (!a || !b) continue;
      const ra = toPage(a.getBoundingClientRect(), pr), rb = toPage(b.getBoundingClientRect(), pr);
      const ax = (ra.left + ra.right) / 2, ay = (ra.top + ra.bottom) / 2, bx = (rb.left + rb.right) / 2, by = (rb.top + rb.bottom) / 2;
      const rA = (ra.right - ra.left) / 2 + 3, rB = (rb.right - rb.left) / 2 + 3;
      const color = cssVar(document.documentElement, `--${e.dataset.laneRole}-stroke`);
      ops.push({ e, a: [ax + rA, ay], b: [bx - rB, by], color, head: e.dataset.arrows === 'to-parent' });
    }
    return ops;
  }

  function draw(seedBase) {
    const svg = $('#ink');
    svg.innerHTML = '';
    const pr = page().getBoundingClientRect();
    const rc = rough.svg(svg);
    let n = 0;
    const seed = () => ((seedBase + (n++) * 7919) % 2147483000) + 1;
    const add = (node) => svg.appendChild(node);
    const strokeW = parseFloat(cssVar(document.documentElement, '--stroke-w')) || 2;
    // geometry first: labels and badges must be in place before their outlines are drawn
    const illOps = layoutIllustrationEdges(pr);
    const cgOps = layoutCommitEdges(pr);

    const drawList = (list) => { for (const el of list) {
      const b = el.getBoundingClientRect();
      const x = b.left - pr.left, y = b.top - pr.top, w = b.width, h = b.height;
      if (w < 1 || h < 1) continue;
      const kind = el.dataset.rough;
      const stroke = cssVar(el, '--stroke') || '#27303f';
      const common = { seed: seed(), stroke, strokeWidth: strokeW, roughness: 1.05, bowing: 0.8, disableMultiStroke: false, preserveVertices: false };
      const solid = (fill) => ({ fill, fillStyle: 'solid' });
      if (kind === 'box' || kind === 'card' || kind === 'soft' || kind === 'panel' || kind === 'tab' || kind === 'pill' || kind === 'term') {
        const fill = {
          box: cssVar(el, '--wash'), panel: cssVar(el, '--wash'), soft: cssVar(el, '--soft'),
          card: cssVar(el, '--pastel'), tab: cssVar(el, '--pastel'), pill: cssVar(el, '--pastel'),
          term: '#2f3a4d',
        }[kind];
        const r = kind === 'pill' ? h / 2 : kind === 'box' ? 16 : kind === 'tab' ? 9 : kind === 'term' ? 10 : 11;
        const sw = kind === 'box' ? strokeW : strokeW * 0.9;
        const rough1 = kind === 'box' ? 1.0 : 0.85;
        // fill pass (slightly mis-registered, like marker colouring) then ink pass
        add(rc.path(roundedRectPath(x + 1, y + 1, w - 2, h - 2, r), { ...solid(fill), stroke: 'none', seed: seed(), roughness: 0.6 }));
        add(rc.path(roundedRectPath(x, y, w, h, r), { ...common, strokeWidth: sw, roughness: rough1, fill: undefined }));
      } else if (kind === 'circle') {
        add(rc.ellipse(x + w / 2, y + h / 2, w, h, { ...common, ...solid(cssVar(el, '--pastel')), fillWeight: 1 }));
      } else if (kind === 'bubble') {
        const [tx, ty] = tailTip(el, x, y, w, h, pr);
        const d = el.dataset.mouth ? bubbleToPath(x, y, w, h, 14, tx, ty) : bubblePath(x, y, w, h, 14, el.dataset.tail);
        add(rc.path(d, { ...solid('#fffefa'), stroke: 'none', seed: seed(), roughness: 0.4 }));
        add(rc.path(d, { ...common, stroke: cssVar(el, '--stroke'), roughness: 0.9 }));
      } else if (kind === 'arrow') {
        drawArrow(rc, add, seed, el, x, y, w, h);
      } else if (kind === 'vsline') {
        // a hand-drawn zigzag divider between two alternatives
        const cx = x + w / 2, n = Math.max(4, Math.round(h / 22)), pts = [];
        for (let k = 0; k <= n; k++) pts.push([cx + (k % 2 ? w / 2 : -w / 2) * 0.7, y + (h * k) / n]);
        add(rc.linearPath(pts, { seed: seed(), stroke: cssVar(document.documentElement, '--neutral-stroke'), strokeWidth: 2.6, roughness: 0.7 }));
      } else if (kind === 'ghost') {
        // where a pointer used to be: dashed outline, paper fill
        add(rc.path(roundedRectPath(x, y, w, h, h / 2), { seed: seed(), stroke, strokeWidth: strokeW * 0.8, roughness: 0.6, fill: cssVar(document.documentElement, '--paper'), fillStyle: 'solid', strokeLineDash: [6, 5], disableMultiStroke: true }));
      } else if (kind === 'bracket') {
        // "]" opening towards the layers, with a small tick pointing at the label
        const ink = cssVar(document.documentElement, '--ink');
        const xm = x + w * 0.55;
        add(rc.path(`M${x + 2} ${y + 3} H${xm} V${y + h - 3} H${x + 2}`, { seed: seed(), stroke: ink, strokeWidth: 2.6, roughness: 0.8, bowing: 0.6, fill: undefined }));
        add(rc.line(xm, y + h / 2, x + w - 1, y + h / 2, { seed: seed(), stroke: ink, strokeWidth: 2.6, roughness: 0.6 }));
      }
    } };
    // badges that sit ON a line (.on-line) are drawn last, over their arrows
    drawList($$('[data-rough]:not(.on-line)'));
    // decorative rays beside key sentences
    for (const el of $$('[data-rays]')) {
      const b = el.getBoundingClientRect();
      const x = b.left - pr.left, y = b.top - pr.top, w = b.width, h = b.height;
      const stroke = cssVar(el, '--stroke');
      const cy = y + h / 2;
      const o = { seed: seed(), stroke, strokeWidth: 3, roughness: 0.9 };
      [[-1, x - 8], [1, x + w + 8]].forEach(([s, ex]) => {
        add(rc.line(ex, cy, ex + s * 20, cy, { ...o, seed: seed() }));
        add(rc.line(ex, cy - 9, ex + s * 16, cy - 20, { ...o, seed: seed() }));
        add(rc.line(ex, cy + 9, ex + s * 16, cy + 20, { ...o, seed: seed() }));
      });
    }
    // illustration edges (geometry computed above)
    for (const l of illOps) arrowLine(rc, add, seed, l.seg.x1, l.seg.y1, l.seg.x2, l.seg.y2, l.color, l.dash, 'end', l.e);
    // commit-graph connections: straight on a lane, an S-curve between lanes
    for (const o of cgOps) {
      const [x1, y1] = o.a, [x2, y2] = o.b;
      const opt = { seed: seed(), stroke: o.color, strokeWidth: 3.4, roughness: 0.7, bowing: 0.8 };
      let pts;
      if (Math.abs(y2 - y1) < 2) {
        add(rc.line(x1, y1, x2, y2, opt));
        pts = [[x1, y1], [x2, y2]];
      } else {
        const mx = (x1 + x2) / 2;
        add(rc.path(`M${x1} ${y1} C${mx} ${y1} ${mx} ${y2} ${x2} ${y2}`, { ...opt, fill: undefined }));
        pts = [];
        for (let k = 0; k <= 12; k++) {
          const t = k / 12, u = 1 - t;
          pts.push([u * u * u * x1 + 3 * u * u * t * mx + 3 * u * t * t * mx + t * t * t * x2, u * u * u * y1 + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * y2]);
        }
      }
      for (let k = 1; k < pts.length; k++) SEGMENTS.push({ x1: pts[k - 1][0], y1: pts[k - 1][1], x2: pts[k][0], y2: pts[k][1], owner: o.e });
      if (o.head) arrowHead(rc, add, seed, x1 - 1, y1, -1, 0, o.color, 12);
    }
    drawList($$('[data-rough].on-line'));
    // commit-graph: a dashed "moved to" arrow from each ghost tag to its tag now
    for (const g of $$('.cg-ghost')) {
      const t = g.closest('.cg').querySelector(`.cg-tag[data-tag="${CSS.escape(g.dataset.ghost)}"]`);
      if (!t) continue;
      const a = toPage(g.getBoundingClientRect(), pr), b = toPage(t.getBoundingClientRect(), pr);
      const ac = [(a.left + a.right) / 2, (a.top + a.bottom) / 2], bc = [(b.left + b.right) / 2, (b.top + b.bottom) / 2];
      const clip = (r, from, to, gap) => {
        const dx = to[0] - from[0], dy = to[1] - from[1];
        const hw = (r.right - r.left) / 2 + gap, hh = (r.bottom - r.top) / 2 + gap;
        const s1 = Math.min(Math.abs(dx) > 0 ? hw / Math.abs(dx) : 1e9, Math.abs(dy) > 0 ? hh / Math.abs(dy) : 1e9);
        return [from[0] + dx * s1, from[1] + dy * s1];
      };
      // elbow route that stays clear of dots and labels: out of the ghost along its row, down the
      // outer side of the target's column, then into the tag from the side
      const grid = t.closest('.cg-grid');
      const col = getComputedStyle(t.closest('.cg-tags')).gridColumnStart;
      let colRight = b.right;
      for (const c of grid.children) if (getComputedStyle(c).gridColumnStart === col) colRight = Math.max(colRight, toPage(c.getBoundingClientRect(), pr).right);
      const gx = a.right + 5, gy = ac[1], rx = colRight + 10, ty = bc[1];
      const color = cssVar(document.documentElement, '--arrow-neutral');
      const dashOpt = { seed: seed(), stroke: color, strokeWidth: 3, roughness: 0.6, strokeLineDash: [8, 6], disableMultiStroke: true };
      add(rc.line(gx, gy, rx, gy, dashOpt));
      add(rc.line(rx, gy, rx, ty, { ...dashOpt, seed: seed() }));
      SEGMENTS.push({ x1: gx, y1: gy, x2: rx, y2: gy, owner: g }, { x1: rx, y1: gy, x2: rx, y2: ty, owner: g });
      arrowLine(rc, add, seed, rx, ty, b.right + 6, ty, color, true, 'end', g);
    }
  }

  function toneColor(t) {
    const root = document.documentElement;
    return {
      request: cssVar(root, '--arrow-request'), response: cssVar(root, '--arrow-response'),
      neutral: cssVar(root, '--arrow-neutral'), action: cssVar(root, '--action-stroke'),
    }[t] || cssVar(root, '--arrow-neutral');
  }

  function arrowHead(rc, add, seed, tx, ty, ux, uy, color, size) {
    const px = -uy, py = ux;
    const bx = tx - ux * size, by = ty - uy * size;
    const pts = [[tx, ty], [bx + px * size * 0.55, by + py * size * 0.55], [bx - px * size * 0.55, by - py * size * 0.55]];
    add(rc.polygon(pts, { seed: seed(), fill: color, fillStyle: 'solid', stroke: color, strokeWidth: 1.6, roughness: 0.5 }));
  }

  const SEGMENTS = [];
  function arrowLine(rc, add, seed, x1, y1, x2, y2, color, dash, heads, owner) {
    SEGMENTS.push({ x1, y1, x2, y2, owner: owner || null });
    const len = Math.hypot(x2 - x1, y2 - y1);
    const ux = (x2 - x1) / len, uy = (y2 - y1) / len;
    const size = Math.min(15, len * 0.3);
    const sx = heads === 'both' ? x1 + ux * size * 0.7 : x1, sy = heads === 'both' ? y1 + uy * size * 0.7 : y1;
    const ex = x2 - ux * size * 0.7, ey = y2 - uy * size * 0.7;
    add(rc.line(sx, sy, ex, ey, { seed: seed(), stroke: color, strokeWidth: 3.2, roughness: 0.9, bowing: 1.2, strokeLineDash: dash ? [9, 7] : undefined, disableMultiStroke: dash }));
    arrowHead(rc, add, seed, x2, y2, ux, uy, color, size);
    if (heads === 'both') arrowHead(rc, add, seed, x1, y1, -ux, -uy, color, size);
  }

  function drawArrow(rc, add, seed, el, x, y, w, h) {
    const color = toneColor(el.dataset.tone);
    const dash = el.dataset.dash === '1';
    const dir = el.dataset.dir;
    const cy = y + h / 2, cx = x + w / 2;
    if (dir === 'right') arrowLine(rc, add, seed, x + 2, cy, x + w - 2, cy, color, dash, 'end', el);
    else if (dir === 'left') arrowLine(rc, add, seed, x + w - 2, cy, x + 2, cy, color, dash, 'end', el);
    else if (dir === 'down') arrowLine(rc, add, seed, cx, y + 2, cx, y + h - 2, color, dash, 'end', el);
    else if (dir === 'up') arrowLine(rc, add, seed, cx, y + h - 2, cx, y + 2, color, dash, 'end', el);
    else if (dir === 'both-v') arrowLine(rc, add, seed, cx, y + h - 2, cx, y + 2, cssVar(document.documentElement, '--ink'), dash, 'both', el);
    else if (dir === 'both-h') arrowLine(rc, add, seed, x + 2, cy, x + w - 2, cy, color, dash, 'both', el);
  }

  // ------------------------------------------------------------- checks ----
  function inkRect(el) {
    // actual extent of the text (line boxes), not only the element box
    const r = document.createRange();
    r.selectNodeContents(el);
    const rects = Array.from(r.getClientRects()).filter((q) => q.width > 0 && q.height > 0);
    if (!rects.length) return el.getBoundingClientRect();
    const box = el.getBoundingClientRect();
    return {
      left: Math.min(...rects.map((q) => q.left), box.left), top: Math.min(...rects.map((q) => q.top)),
      right: Math.max(...rects.map((q) => q.right)), bottom: Math.max(...rects.map((q) => q.bottom)),
    };
  }

  function rectOf(el) {
    const b = el.getBoundingClientRect();
    if (el.classList && el.classList.contains('t')) {
      // horizontal: real text extent (catches long words); vertical: the line boxes
      // (glyph boxes of tight handwriting fonts overlap by design between lines)
      const ink = inkRect(el);
      return { left: Math.min(ink.left, b.left), top: b.top, right: Math.max(ink.right, b.right), bottom: b.bottom };
    }
    return { left: b.left, top: b.top, right: b.right, bottom: b.bottom };
  }

  function whereOf(el) {
    const w = el.closest('[data-where]');
    return w ? w.dataset.where : 'page';
  }

  function snippet(el) {
    const s = (el.innerText || el.textContent || '').trim().replace(/\s+/g, ' ');
    return s.length > 50 ? s.slice(0, 50) + '…' : s;
  }

  function label(el) {
    if (el.classList.contains('t')) return `text "${snippet(el)}"`;
    if (el.matches('svg.ico')) return 'icon';
    if (el.matches('svg.char') || el.classList.contains('char-part')) return 'drawn person';
    if (el.classList.contains('sec')) return 'section';
    return `${el.className && typeof el.className === 'string' ? el.className.split(' ')[0] : el.tagName.toLowerCase()} box${snippet(el) ? ` "${snippet(el)}"` : ''}`;
  }

  async function checks(report) {
    const pr = page().getBoundingClientRect();
    const TOL = 1.5;
    const blocks = $$('#content [data-box], #content .t, #content svg.ico, #content svg.char');
    const parentOf = (el) => (el.parentElement && el.parentElement.closest('[data-box]')) || null;
    const seen = new Set();
    const push = (level, code, el, message) => {
      const key = code + '|' + whereOf(el) + '|' + message;
      if (seen.has(key)) return;
      seen.add(key);
      report[level === 'error' ? 'errors' : 'warnings'].push({ code, where: whereOf(el), message });
    };

    // 0. engine guard: a text block must flow as text (flex/grid would tear inline markup apart)
    for (const t of $$('#content .t')) {
      const d = getComputedStyle(t).display;
      if (/flex|grid/.test(d)) push('error', 'engine-text-layout', t, `${label(t)} is laid out as ${d}; inline bold/code would split (engine CSS bug)`);
    }
    // 1. text overflowing its own box horizontally (long words / URLs)
    for (const t of $$('#content .t')) {
      if (t.scrollWidth > t.clientWidth + 1) push('error', 'text-overflow', t, `${label(t)} is ${t.scrollWidth - t.clientWidth}px wider than its box (a word or code that cannot wrap)`);
    }
    // 2. containment in parent box / page
    for (const el of blocks) {
      const r = rectOf(el);
      if (r.left < pr.left - TOL || r.top < pr.top - TOL || r.right > pr.right + TOL || r.bottom > pr.bottom + TOL) {
        // content pushed below the page by an overflow is already reported as page-overflow
        if (!(report.overflow && r.bottom > pr.bottom && r.left >= pr.left - TOL && r.right <= pr.right + TOL)) {
          push('error', 'outside-page', el, `${label(el)} lies (partly) outside the page`);
        }
        continue;
      }
      const p = parentOf(el);
      if (!p) continue;
      const q = p.getBoundingClientRect();
      const out = Math.max(q.left - r.left, q.top - r.top, r.right - q.right, r.bottom - q.bottom);
      if (out > TOL) push('error', 'clipped', el, `${label(el)} sticks out of its ${label(p)} by ${Math.round(out)}px`);
    }
    // 3. overlap between siblings (same parent box)
    const groups = new Map();
    for (const el of blocks) {
      if (el.hasAttribute('data-overlap-ok')) continue;
      const p = parentOf(el) || page();
      if (!groups.has(p)) groups.set(p, []);
      groups.get(p).push(el);
    }
    for (const [, els] of groups) {
      const rs = els.map(rectOf);
      for (let i = 0; i < els.length; i++) {
        for (let j = i + 1; j < els.length; j++) {
          if (els[i].contains(els[j]) || els[j].contains(els[i])) continue;
          // parts of one drawn person overlap each other by design
          if (els[i].classList.contains('char-part') && els[j].classList.contains('char-part') && els[i].parentElement === els[j].parentElement) continue;
          const a = rs[i], b = rs[j];
          const ox = Math.min(a.right, b.right) - Math.max(a.left, b.left);
          const oy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
          if (ox > TOL && oy > TOL) push('error', 'overlap', els[i], `${label(els[i])} overlaps ${label(els[j])} (${Math.round(ox)}×${Math.round(oy)}px)`);
        }
      }
    }
    // 3b. drawn arrows must not cross text (lines are not DOM boxes, so test geometry)
    const segHitsRect = (s, r) => {
      // Liang-Barsky clip of segment against rect
      let t0 = 0, t1 = 1;
      const dx = s.x2 - s.x1, dy = s.y2 - s.y1;
      for (const [p, q] of [[-dx, s.x1 - r.left], [dx, r.right - s.x1], [-dy, s.y1 - r.top], [dy, r.bottom - s.y1]]) {
        if (p === 0) { if (q < 0) return false; continue; }
        const t = q / p;
        if (p < 0) { if (t > t1) return false; if (t > t0) t0 = t; } else { if (t < t0) return false; if (t < t1) t1 = t; }
      }
      return t1 - t0 > 0.02;
    };
    for (const s of SEGMENTS) {
      const scope = (s.owner && s.owner.closest('.sec')) || document;
      for (const t of $$('.t', scope)) {
        if (s.owner && s.owner.contains(t)) continue;
        { const st = t.closest('.edge-step'); if (st && s.owner && s.owner.dataset && st.dataset.for === s.owner.dataset.i + 's') continue; }
        const range = document.createRange();
        range.selectNodeContents(t);
        for (const r of range.getClientRects()) {
          const rr = { left: r.left - pr.left + 1, right: r.right - pr.left - 1, top: r.top - pr.top + 3, bottom: r.bottom - pr.top - 3 };
          if (rr.right > rr.left && rr.bottom > rr.top && segHitsRect(s, rr)) { push('error', 'arrow-over-text', t, `a drawn arrow crosses ${label(t)}`); break; }
        }
      }
    }
    // 3c. speech-bubble tails: must clear gesture arms, hands and props, other people and other bubbles
    for (const tl of TAILS) {
      const sec = tl.el.closest('.sec') || document;
      const seg = { x1: tl.x1, y1: tl.y1, x2: tl.x2, y2: tl.y2 };
      const rel = (el) => toPage(el.getBoundingClientRect(), pr);
      for (const other of $$('.bubble', sec)) {
        if (other === tl.el) continue;
        if (segHitsRectG(seg, inflate(rel(other), 2))) push('error', 'tail-over-bubble', tl.el, `the tail of bubble "${snippet(tl.el)}" crosses bubble "${snippet(other)}"`);
      }
      for (const part of $$('.char-part', sec)) {
        const person = part.closest('.person');
        const own = person && person.dataset.person === tl.who;
        if (own && part.dataset.part !== 'gesture') continue; // pointing at the own head/body is the point
        if (segHitsRectG(seg, inflate(rel(part), 1))) push('error', 'tail-over-person', tl.el, `the tail of bubble "${snippet(tl.el)}" touches ${own ? 'the speaker\'s raised arm, hand or prop' : 'another person'}`);
      }
    }
    // 3d. tails must be visible and point at their own speaker
    const headOf = (person) => {
      const r = toPage(person.querySelector('svg.char').getBoundingClientRect(), pr);
      return [(r.left + r.right) / 2, r.top + (r.bottom - r.top) * (60 / 160)];
    };
    for (const tl of TAILS) {
      const len = Math.hypot(tl.x2 - tl.x1, tl.y2 - tl.y1);
      if (len < 14) push('error', 'tail-too-short', tl.el, `the tail of bubble "${snippet(tl.el)}" is only ${Math.round(len)} px long (min 14)`);
      if (!tl.person) continue;
      const sec = tl.el.closest('.sec') || document;
      const others = $$('.person', sec).filter((p) => p !== tl.person);
      if (!others.length) continue;
      const d = (p) => { const [hx, hy] = headOf(p); return Math.hypot(hx - tl.x2, hy - tl.y2); };
      const own = d(tl.person);
      const near = others.find((p) => d(p) <= own);
      if (near) push('error', 'tail-wrong-speaker', tl.el, `the tail of bubble "${snippet(tl.el)}" ends nearer to another person than to its own speaker`);
    }
    // 3e. bubbles never touch a person (arm, hand, prop) that is laid out in another box
    for (const bub of $$('#content .bubble')) {
      const sec = bub.closest('.sec') || document;
      const br = inflate(toPage(bub.getBoundingClientRect(), pr), 1);
      for (const part of $$('.char-part', sec)) {
        if (rectsHit(br, toPage(part.getBoundingClientRect(), pr))) { push('error', 'bubble-over-person', bub, `bubble "${snippet(bub)}" touches a drawn person (${part.dataset.part === 'gesture' ? 'arm, hand or prop' : 'head or body'})`); break; }
      }
    }
    // 4. minimum font size
    for (const el of $$('#content *')) {
      const own = Array.from(el.childNodes).some((n) => n.nodeType === 3 && n.textContent.trim());
      if (!own) continue;
      const fs = parseFloat(getComputedStyle(el).fontSize);
      if (fs < MIN_FONT_PX - 0.01) push('error', 'font-too-small', el, `text "${snippet(el)}" is ${fs.toFixed(1)}px, minimum is ${MIN_FONT_PX}px`);
    }
    // 5. glyph coverage in the actual font of each text block
    const cv = document.createElement('canvas').getContext('2d');
    const perFamily = new Map();
    for (const t of $$('#content .t')) {
      const fam = getComputedStyle(t).fontFamily.split(',')[0].trim().replace(/['"]/g, '');
      if (!perFamily.has(fam)) perFamily.set(fam, new Map());
      const m = perFamily.get(fam);
      for (const ch of t.textContent) if (ch.trim() && !m.has(ch)) m.set(ch, t);
    }
    for (const [fam, chars] of perFamily) {
      await document.fonts.load(`40px "${fam}"`, Array.from(chars.keys()).join(''));
      for (const [ch, el] of chars) {
        cv.font = `40px "${fam}", monospace`; const w1 = cv.measureText(ch).width;
        cv.font = `40px "${fam}", serif`; const w2 = cv.measureText(ch).width;
        if (Math.abs(w1 - w2) > 0.01) push('error', 'missing-glyph', el, `character "${ch}" has no glyph in font ${fam} (fallback font would be used)`);
      }
    }
    // 6. text size stats
    report.stats = {
      textBlocks: $$('#content .t').length,
      minFontPx: +Math.min(...$$('#content .t').map((t) => parseFloat(getComputedStyle(t).fontSize))).toFixed(2),
      icons: $$('#content svg.ico').length,
      sections: $$('.sec').length,
    };
  }

  window.__IK = {
    /** debug: row heights at a given k (natural state) */
    probe(ks) {
      page().classList.add('natural');
      const out = ks.map((k) => { const h = naturalHeight(k); return { k, h: Math.round(h), title: Math.round($('.title-block').getBoundingClientRect().height), rows: $$('.row').map((r) => Math.round(r.getBoundingClientRect().height)) }; });
      page().classList.remove('natural');
      return out;
    },
    async run({ seedKey }) {
      await document.fonts.ready;
      const report = { errors: [], warnings: [] };
      fit(report);
      await new Promise((r) => requestAnimationFrame(() => r()));
      draw(hashStr(seedKey));
      await checks(report);
      return report;
    },
  };
})();
