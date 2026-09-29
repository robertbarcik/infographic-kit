// Component registry. A new component = a new file here + styles in styles/components.css.
import callout from './callout.mjs';
import dialogue from './dialogue.mjs';
import exchange from './exchange.mjs';
import layerStack from './layer-stack.mjs';
import definitions from './definitions.mjs';
import keyIdeas from './key-ideas.mjs';
import steps from './steps.mjs';
import cardGrid from './card-grid.mjs';
import compare from './compare.mjs';
import bullets from './bullets.mjs';
import illustration from './illustration.mjs';
import command from './command.mjs';
import commitGraph from './commit-graph.mjs';

export const COMPONENTS = {};
for (const c of [callout, dialogue, exchange, layerStack, definitions, keyIdeas, steps, cardGrid, compare, bullets, illustration, command, commitGraph]) {
  COMPONENTS[c.name] = c;
  for (const a of c.aliases || []) COMPONENTS[a] = c;
}
export const COMPONENT_NAMES = Object.keys(COMPONENTS);
