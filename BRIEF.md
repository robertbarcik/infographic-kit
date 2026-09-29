# Infographic Kit — architecture brief

## Why this exists

This is the original brief the engine-building agent received, kept as a record of the
method. The two reference images it mentions were private inputs and are not part of
this repository (see `reference/README.md`).

A student builds large sets of study materials as one-page "sketchnote"
infographics. Image models gave him exactly the look he wants (see `reference/`), but:

- raster generation drifts after ~4 pages (style and depth both degrade),
- his SVG/component-registry attempt collapsed because the agent kept patching single
  pages by hand instead of fixing the mechanism,
- the text started to sound machine-written.

Goal: a pipeline that produces this kind of page **any time, on any IT topic, with the same
look**, with no external image/LLM API. Only a coding agent + local tools.

## The core idea

**Style lives in code, content lives in data, and the two never mix.**

```
specs/<name>.json      content only: texts, component choices, icon names, semantic roles
        │
        ▼
engine/ (fixed)        template + CSS tokens + component library + icon/illustration set
        │
        ▼
out/<name>.html/.png/.pdf   + out/<name>.report.json (validator findings)
```

- A spec NEVER contains colours, pixel sizes, coordinates, font names, raw SVG or HTML.
  It names things: `"role": "warning"`, `"icon": "server"`, `"component": "layer-stack"`.
- The engine decides how every named thing looks. Same spec in → same pixels out
  (seeded randomness only).
- If a page needs something the engine cannot do, the fix is a new/extended engine
  component or icon, available to all pages. Never a one-off hack inside a page.

## Target look (from `reference/ref-protocols.png`, `reference/ref-hosts-clients.png`)

Study both images closely before designing. What makes the style:

- Portrait page, lined/graph notebook paper background, slightly off-white.
- Big hand-lettered uppercase title with a number prefix ("10. PROTOCOLS: AGREED RULES").
- Sections are rounded boxes with a hand-drawn ink outline (slightly wobbly, not
  perfectly straight) and a pastel fill; each has a small uppercase label tab at top-left.
- Colour carries meaning (blue, green, yellow/orange, red, purple families); red is
  reserved for warning/"remember".
- Handwriting-style font everywhere, dark ink colour (not pure black).
- Small coloured illustrations: laptop, phone, server, database, globe, document, people
  with speech bubbles, arrows between actors with request/response labels.
- Dense but airy: lots of small blocks, short text, every block has an icon or picture.
- Fixed bottom strip: "REMEMBER: ..." in a red box with warning triangle.
- An everyday analogy carries the explanation (two people agreeing on a meeting time =
  protocol).

We are not copying pixels; we are building a vector system that lands in the same family
and is at least as pleasant to read.

## Technical decisions (already made)

- Location: the kit folder (this repository)
- Node.js (v25 available). Rendering through the installed Google Chrome
  (`/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`) via `puppeteer-core`.
  No downloaded Chromium, no external APIs, no network needed at render time.
- Page = HTML + CSS + inline SVG. Fixed page size 1240 x 1754 px (A4 portrait at 150 dpi),
  PNG exported at deviceScaleFactor 2, PDF exported as a single A4 page.
- Hand-drawn outlines: `roughjs` (seeded, so output is deterministic), drawn into SVG
  overlays after layout is measured. Text stays real text (selectable in the PDF).
- Fonts: open-licence handwriting fonts stored locally in `engine/fonts/` as woff2
  (download once from Google Fonts / the fontsource npm packages). Must cover Latin Extended
  (Slovak diacritics: ľ š č ť ž ý á í é ú ä ô ň ď ŕ ĺ). Pick one display font for titles and
  one highly legible handwriting font for body. Legibility at small size beats charm.
- Icons and illustrations: own SVG set in `engine/icons/`, one visual language (ink outline
  + flat pastel fills, same stroke width, round caps). Needs at least: laptop, desktop,
  phone, server, server-rack, database, cloud, globe, router, switch, firewall, lock, key,
  certificate, shield, document, folder, envelope, package/box, container, gear, bug,
  magnifier, target, lightbulb, warning, check, cross, clock, user, users, browser window,
  terminal window, code brackets, git-branch, api/plug, chip/cpu, memory, disk, wifi.
  Optional fallback to an open-licence icon package (e.g. `lucide-static`) addressed as
  `lucide:<name>`, restyled to the same ink stroke, so authors are never blocked.
- People: a parametrised SVG character component (skin, hair style/colour, shirt colour,
  expression, pose: neutral / waving / pointing / thinking) with speech bubbles.
- Deterministic: a seed derived from the spec name; no `Math.random()` without the seed.

## Components the engine must offer (minimum)

Layout is a vertical stack of rows; a row holds 1–3 sections with width ratios. Each section
has `label`, `role` (semantic colour) and one `component` body:

| component | what it is |
|---|---|
| `title` | number + title + optional subtitle |
| `goal` / `callout` | icon + bold lead word + sentence (goal, remember, tip, key sentence) |
| `dialogue` | two characters, speech bubbles, a middle box with bullet rules (the analogy) |
| `exchange` | actor A — labelled arrows (request/response, solid/dashed) — actor B, each actor with icon, name, role tag, caption; can be stacked as numbered scenarios |
| `layer-stack` | coloured stacked layers with a description per layer and a side axis label |
| `definitions` | term tag + explanation list |
| `key-ideas` | icon + heading + two-line text cards |
| `steps` | numbered horizontal flow with arrows, each step: heading, text, icon |
| `card-grid` | N small cards: heading, sub-tag, icon, text |
| `compare` | two columns side by side (A vs B) with matching rows |
| `bullets` | plain list with optional icon |
| `illustration` | a picture built from icons + arrows + labels (nodes and edges by name, laid out by the engine, e.g. centre node with satellites) |

Text supports minimal inline markup only: `**bold**` and `` `code` ``.

## The validator ("the meter") — as important as the renderer

`node engine/render.mjs specs/x.json` must render AND measure, and write
`out/x.report.json`. It fails loudly (non-zero exit, readable messages naming the section
and the component) on:

- spec schema errors (unknown component, unknown icon, unknown role, missing field, forbidden
  keys such as colours/styles/raw html),
- page overflow (content taller than the page) or large unused space (> ~8 % empty at bottom),
- any text box clipped or overflowing its container, any element overlapping another
  element it should not overlap, any element outside the page,
- text below the minimum font size (body must stay >= 15 px at 1240 px width),
- per-component text budgets exceeded (e.g. card text max N characters) — budgets are
  documented so the author knows them before writing.

The engine may shrink/grow spacing and font size within a small documented range to fit
(auto-fit), but must never clip or overlap silently.

## Authoring guide

`AUTHORING.md` = the single document an author (human or LLM) needs to write a spec:
schema, components with a tiny example each, icon list, roles, text budgets, and the content
rules below. Keep it exact and short. It must be generated from / kept in step with the
engine (an `engine/list.mjs` that prints components, icons and budgets is welcome).

Content rules for every page:

1. One page = one idea. Title says the idea, not just the topic.
2. An everyday analogy carries the page (top section), and the technical part maps back to
   it explicitly.
3. Beginner can follow it; a practitioner still learns a precise fact (real commands, port
   numbers, real tool names in the examples).
4. Short, spoken sentences. No filler, no marketing tone, no "leverage/seamless/robust".
5. Every fact must be true. Simplify, never falsify.
6. Closing strip: "REMEMBER:" with the one sentence to keep.

## Working rules for agents

- Absolute paths in every shell command; never a bare `cd`. macOS has no `timeout` command.
- Never discard stderr when a render fails.
- Inspect the artifact, not the exit code: after rendering, open the PNG with the Read tool
  and look at it. Zoom into regions by cropping (e.g. with `sips` or a small node script)
  when text is small.
- Stay inside the kit folder. Do not touch anything
  else in `TEMP/` or elsewhere. Do not use git.
- Spec authors do not edit `engine/`. Engine maintainers do not hand-tune single pages.
