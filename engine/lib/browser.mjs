// Shared headless-Chrome helper. Uses the locally installed Google Chrome only (no download).
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';

// Override with the CHROME_PATH environment variable on Windows/Linux or for another Chromium.
export const CHROME_PATH =
  process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

export async function launch() {
  if (!fs.existsSync(CHROME_PATH)) {
    throw new Error(
      `Google Chrome not found at ${CHROME_PATH}. Set the CHROME_PATH environment variable to your Chrome/Chromium executable.`
    );
  }
  return puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: [
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-extensions',
      '--disable-background-networking',
      '--font-render-hinting=none',
      '--force-color-profile=srgb',
      '--disable-lcd-text',
      '--hide-scrollbars',
      // determinism: same DOM must give the same pixels; GPU/threaded raster can vary by a few pixels
      '--disable-gpu',
      '--disable-gpu-compositing',
      '--disable-gpu-rasterization',
      '--num-raster-threads=1',
      '--disable-partial-raster',
      '--run-all-compositor-stages-before-draw',
      '--disable-threaded-animation',
      '--disable-threaded-scrolling',
      '--disable-checker-imaging',
      '--disable-image-animation-resync',
    ],
  });
}

/** Render a standalone HTML string to PNG (used by contact sheets and tests). */
export async function htmlToPng(browser, html, outPng, { width, height, scale = 2 } = {}) {
  const page = await browser.newPage();
  await page.setViewport({ width, height: height || 800, deviceScaleFactor: scale });
  await page.setContent(html, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  const h = height || (await page.evaluate(() => Math.ceil(document.documentElement.scrollHeight)));
  await page.setViewport({ width, height: h, deviceScaleFactor: scale });
  await page.screenshot({ path: outPng, clip: { x: 0, y: 0, width, height: h } });
  await page.close();
}
