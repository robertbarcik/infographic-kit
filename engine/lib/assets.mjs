// Loads static engine assets (fonts as base64 @font-face, CSS files, rough.js source).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ENGINE_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const KIT_DIR = path.resolve(ENGINE_DIR, '..');

// unicode ranges copied from the fontsource subsets
const LATIN = 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD';
const LATIN_EXT = 'U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF';

export const FONTS = {
  'IK Display': 'caveat-brush',
  'IK Body': 'patrick-hand',
};

let fontCssCache = null;
export function fontFaceCss() {
  if (fontCssCache) return fontCssCache;
  let css = '';
  for (const [family, file] of Object.entries(FONTS)) {
    for (const [sub, range] of [['latin', LATIN], ['latin-ext', LATIN_EXT]]) {
      const p = path.join(ENGINE_DIR, 'fonts', `${file}-${sub}-400-normal.woff2`);
      const b64 = fs.readFileSync(p).toString('base64');
      css += `@font-face{font-family:'${family}';font-style:normal;font-weight:400;font-display:block;` +
        `src:url(data:font/woff2;base64,${b64}) format('woff2');unicode-range:${range};}\n`;
    }
  }
  fontCssCache = css;
  return css;
}

export function readEngineFile(rel) {
  return fs.readFileSync(path.join(ENGINE_DIR, rel), 'utf8');
}

export function roughSource() {
  return fs.readFileSync(path.join(KIT_DIR, 'node_modules/roughjs/bundled/rough.js'), 'utf8');
}
