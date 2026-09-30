// ==========================================================================
// Parametrised person (bust) in the kit's ink + pastel language.
// All options are named enums; a spec never passes colours.
//   hair:       short | long | curly | bun | bald
//   hairTone:   dark | brown | blonde | red | grey
//   skin:       light | medium | tan | dark
//   shirt:      any role name (info, concept, example, action, accent, detail, warning, neutral)
//   expression: happy | smile | neutral | surprised | thinking
//   pose:       neutral | pointing | thinking
//   facing:     right | left      (which side the gesture/gaze goes to)
//   holding:    any icon name: a prop held in one hand (not with thinking)
// ==========================================================================
import { iconInner } from '../icons/icons.mjs';

const INK = '#27303f';

/** the pose actually drawn: a prop turns neutral/pointing into "holding" */
function effectivePose(o) {
  return o.holding ? 'holding' : o.pose;
}
// prop placement per pose, in viewBox units: [centre x, centre y, size]
const PROP_AT = { holding: [120, 84, 42] };
const SKIN = { light: '#fad8b8', medium: '#efc095', tan: '#d39b69', dark: '#9b6845' };
const SKIN_SHADE = { light: '#f0bf98', medium: '#dea577', tan: '#bb8152', dark: '#835535' };
const HAIR = { dark: '#35302f', brown: '#7b4a2a', blonde: '#e3b453', red: '#c0582f', grey: '#a9adb4' };
const SHIRT = {
  info: '#6ea9e6', concept: '#6cc085', example: '#f2c94c', action: '#f39c50',
  accent: '#ec8ca7', detail: '#a888de', warning: '#e46559', neutral: '#9ba8ba',
};

export const CHARACTER_OPTIONS = {
  hair: ['short', 'long', 'curly', 'bun', 'bald'],
  hairTone: Object.keys(HAIR),
  skin: Object.keys(SKIN),
  shirt: Object.keys(SHIRT),
  expression: ['happy', 'smile', 'neutral', 'surprised', 'thinking'],
  pose: ['neutral', 'pointing', 'thinking'],
  facing: ['right', 'left'],
};

export const CHARACTER_DEFAULTS = {
  hair: 'short', hairTone: 'dark', skin: 'light', shirt: 'concept', expression: 'happy', pose: 'neutral', facing: 'right',
};

const tube = (d, color, w) =>
  `<path d="${d}" stroke="${INK}" stroke-width="${w + 4.4}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>` +
  `<path d="${d}" stroke="${color}" stroke-width="${w}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;

function hairBack(style, c) {
  if (style === 'long') {
    return `<path d="M44 58 C40 26 100 26 96 58 C97 80 101 98 111 111 C98 117 86 110 83 98 L57 98 C54 110 42 117 29 111 C39 98 43 80 44 58 Z" fill="${c}"/>`;
  }
  if (style === 'curly') {
    const pts = [[46, 44], [52, 34], [62, 28], [74, 27], [85, 31], [93, 40], [97, 51], [44, 56], [97, 62], [43, 66]];
    return pts.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="10" fill="${c}"/>`).join('');
  }
  if (style === 'bun') return `<circle cx="70" cy="27" r="11" fill="${c}"/>`;
  return '';
}

function hairFront(style, c) {
  switch (style) {
    case 'short':
      return `<path d="M44.5 63 C40 38 54 28 70 29 C86 29 100 38 95.5 63 C93 54 90 49 86 46 C80 50 71 50 64 46 C66 43 67 41 66 38 C60 44 53 48 48 50 C46 54 45 58 44.5 63 Z" fill="${c}"/>
        <path d="M66 38 C69 36 73 36 76 38" stroke="${INK}" stroke-width="1.6" fill="none"/>`;
    case 'long':
      return `<path d="M44.5 64 C41 38 56 30 71 30.5 C87 31 99 42 95.5 64 C91 53 84 46 74 43 C67 50 56 55 44.5 64 Z" fill="${c}"/>`;
    case 'curly': {
      const pts = [[50, 44], [58, 38], [67, 36], [76, 36], [85, 40], [91, 47]];
      return pts.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="7.5" fill="${c}"/>`).join('');
    }
    case 'bun':
      return `<path d="M44.5 62 C42 38 56 32 70 32 C84 32 98 38 95.5 62 C92 52 84 45 70 44 C58 45 48 52 44.5 62 Z" fill="${c}"/>`;
    case 'bald':
      return `<path d="M45.5 66 C44 58 46 54 49 51" stroke="${INK}" stroke-width="2" fill="${c}"/><path d="M94.5 66 C96 58 94 54 91 51" stroke="${INK}" stroke-width="2" fill="${c}"/>`;
    default:
      return '';
  }
}

function face(expression) {
  const lookUp = expression === 'thinking';
  const eye = (x) => `<ellipse cx="${x}" cy="64" rx="3.1" ry="3.9" fill="${INK}" stroke="none"/>` +
    `<circle cx="${x + (lookUp ? 1.1 : 0.9)}" cy="${lookUp ? 62.2 : 62.8}" r="1.1" fill="#fff" stroke="none"/>`;
  let brows = `<path d="M55 55.5 q5 -3 10 -0.5 M75 55 q5 -2.5 10 0.5" stroke="${INK}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`;
  if (expression === 'surprised') brows = `<path d="M55 53 q5 -4 10 -1.5 M75 51.5 q5 -2.5 10 1.5" stroke="${INK}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`;
  if (expression === 'thinking') brows = `<path d="M55 55 q5 -1.5 10 0.5 M75 52 q5 -3.5 10 -0.5" stroke="${INK}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`;
  const mouths = {
    happy: `<path d="M60.5 76 Q70 88 79.5 76 Q70 79.5 60.5 76 Z" fill="#b9444d" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/><path d="M65 81.5 q5 2.6 10 0" fill="#ef8f94" stroke="none"/>`,
    smile: `<path d="M62 77.5 Q70 84.5 78 77.5" stroke="${INK}" stroke-width="2.3" fill="none" stroke-linecap="round"/>`,
    neutral: `<path d="M64.5 79.5 Q70 80.5 75.5 79" stroke="${INK}" stroke-width="2.3" fill="none" stroke-linecap="round"/>`,
    surprised: `<ellipse cx="70" cy="80" rx="3.8" ry="4.8" fill="#b9444d" stroke="${INK}" stroke-width="2"/>`,
    thinking: `<path d="M64 80.5 Q69 78 76 79.5" stroke="${INK}" stroke-width="2.3" fill="none" stroke-linecap="round"/>`,
  };
  return eye(60) + eye(80) + brows +
    `<path d="M70.5 67 q2.4 4.2 -1.6 5.2" stroke="${INK}" stroke-width="1.8" fill="none" stroke-linecap="round"/>` +
    `<circle cx="54.5" cy="73.5" r="4.4" fill="#f39a9a" fill-opacity=".45" stroke="none"/>` +
    `<circle cx="85.5" cy="73.5" r="4.4" fill="#f39a9a" fill-opacity=".45" stroke="none"/>` +
    (mouths[expression] || mouths.smile);
}

function arm(pose, shirt, skin) {
  // drawn for a figure gesturing to the viewer's right; mirrored for facing:left
  switch (pose) {
    case 'pointing':
      return tube('M101 134 L118 124', shirt, 12) + tube('M118 124 L128 112', skin, 8.5) +
        `<path d="M123 116 c-2 -5 1 -9 5 -9.5 l8.5 -1.5 c2.8 -.4 3.3 3.6 .5 4 l-6 1.2 c3 1 4 3.5 3 6.5 c-1 3.4 -4.4 4.8 -7.6 3.8 z" fill="${skin}" stroke="${INK}" stroke-width="2.1" stroke-linejoin="round"/>`;
    case 'holding':
      return tube('M101 134 L112 124', shirt, 12) + tube('M112 124 L118 108', skin, 8.5);
    case 'thinking':
      return tube('M117 166 Q112 146 97 139', shirt, 12.5) + tube('M94 139 L83 99', skin, 8.5) +
        `<path d="M92 133.5 L96.5 145" stroke="${INK}" stroke-width="2" fill="none"/>` +
        `<path d="M76 99 c-1 -5 2 -9 6.5 -9 c4 0 6.5 3 6 7 c-.6 4 -4 6 -7.5 5.5 c-2.5 -.3 -4.5 -1.5 -5 -3.5 z" fill="${skin}" stroke="${INK}" stroke-width="2.1"/>` +
        `<path d="M79 91.5 c-.5 -3 0 -6 1.5 -8.5" stroke="${INK}" stroke-width="2.1" fill="none" stroke-linecap="round"/>`;
    default:
      return '';
  }
}

/** Solid parts of the drawing in viewBox units (140 x 160), used by the validator instead of
 *  the whole rectangle, so a speech bubble may use the empty corner beside the head. */
export function characterParts(opts = {}) {
  const o = { ...CHARACTER_DEFAULTS, ...opts };
  const parts = [
    [37, 24, 66, 72], // head, ears, hair
    [20, 97, 100, 63], // shoulders + torso
  ];
  if (o.hair === 'long') parts.push([28, 30, 84, 86]);
  if (o.hair === 'curly') parts.push([35, 17, 72, 60]);
  if (o.hair === 'bun') parts.push([58, 15, 24, 20]);
  const pose = effectivePose(o);
  const gesture = [];
  if (pose === 'pointing') gesture.push([98, 104, 42, 36]);
  if (pose === 'thinking') gesture.push([74, 88, 48, 72]);
  if (pose === 'holding') gesture.push([100, 100, 28, 40]);
  if (PROP_AT[pose]) { const [cx, cy, s] = PROP_AT[pose]; gesture.push([cx - s / 2, cy - s / 2, s, s]); }
  const all = parts.map((p) => [...p, 'body']).concat(gesture.map((p) => [...p, 'gesture']));
  return o.facing === 'left' ? all.map(([x, y, w, h, k]) => [140 - x - w, y, w, h, k]) : all;
}
/** mouth position in viewBox units */
export const MOUTH = [70, 80];

export function characterSvg(opts = {}) {
  const o = { ...CHARACTER_DEFAULTS, ...opts };
  const skin = SKIN[o.skin] || SKIN.light;
  const shade = SKIN_SHADE[o.skin] || SKIN_SHADE.light;
  const hair = HAIR[o.hairTone] || HAIR.dark;
  const shirt = SHIRT[o.shirt] || SHIRT.concept;
  const flip = o.facing === 'left' ? ' transform="translate(140 0) scale(-1 1)"' : '';
  const pose = effectivePose(o);
  // arm seams on the torso: only the arm hanging at the side gets one; the gesturing arm
  // (drawn separately below) replaces the seam on its side, otherwise it reads as a second arm
  const seams = pose === 'neutral' ? 'M42 136 L44 160 M98 136 L96 160' : 'M42 136 L44 160';
  // thinking pose: arm is part of the pose, the face is always drawn un-mirrored-looking
  return `<svg class="char" viewBox="0 0 140 160" aria-hidden="true"><g${flip} stroke="${INK}" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round">
    ${hairBack(o.hair, hair)}
    <path d="M61.5 86 V100 a8.5 5 0 0 0 17 0 V86 Z" fill="${shade}"/>
    <path d="M22 160 C22 124 36 106 57 100.5 Q70 111 83 100.5 C104 106 118 124 118 160 Z" fill="${shirt}"/>

    <path d="${seams}" stroke-width="1.8" fill="none"/>
    <circle cx="45.5" cy="66" r="5.5" fill="${skin}"/><circle cx="94.5" cy="66" r="5.5" fill="${skin}"/>
    <ellipse cx="70" cy="62" rx="25" ry="28" fill="${skin}"/>
    ${hairFront(o.hair, hair)}
    ${face(o.expression)}
    ${arm(pose, shirt, skin)}
    ${prop(o, skin)}
  </g></svg>`;
}

/** a prop (any kit icon) held in the raised hand; fingers are drawn over its lower edge.
 *  Drawn un-mirrored so text-like details on the prop never appear flipped. */
function prop(o, skin) {
  const pose = effectivePose(o);
  if (!PROP_AT[pose]) return '';
  const [cx, cy, s] = PROP_AT[pose];
  const k = s / 64;
  const flip = o.facing === 'left';
  // inside the mirrored group: undo the mirror around the prop centre
  const t = flip ? `translate(${cx + s / 2} ${cy - s / 2}) scale(${-k} ${k})` : `translate(${cx - s / 2} ${cy - s / 2}) scale(${k})`;
  const hy = cy + s / 2 - 3;
  return `<g transform="${t}" fill="none" stroke="${INK}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">${iconInner(o.holding)}</g>
    <path d="M${cx - 7} ${hy + 1} c0 -4 3 -6 7 -6 c4 0 7 2 7 6 c0 4 -3 7 -7 7 c-4 0 -7 -3 -7 -7 z" fill="${skin}" stroke="${INK}" stroke-width="2.1"/>
    <path d="M${cx - 5} ${hy - 3} v3 M${cx - 1} ${hy - 4.5} v3.5 M${cx + 3} ${hy - 4} v3.5" stroke="${INK}" stroke-width="1.6" fill="none" stroke-linecap="round"/>`;
}
