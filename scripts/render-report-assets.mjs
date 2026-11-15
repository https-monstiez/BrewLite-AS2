import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
const require = createRequire(new URL('../apps/web/package.json', import.meta.url));
const { chromium } = require('@playwright/test');
const manifest = JSON.parse(await readFile(process.argv[2], 'utf8'));
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ deviceScaleFactor: 2 });
  for (const figure of manifest.figures) {
    const svg = await readFile(figure.svg);
    await page.setContent(`<html><body style="margin:0;background:white"><img src="data:image/svg+xml;base64,${svg.toString('base64')}"></body></html>`);
    await page.locator('img').evaluate(image => image.decode());
    await page.locator('img').screenshot({ path: figure.png });
  }
  await page.goto(new URL(`file://${manifest.html}`).href, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.pdf({
    path: manifest.pdf, format: 'A4', printBackground: true,
    margin: { top: '18mm', right: '18mm', bottom: '20mm', left: '24mm' },
    displayHeaderFooter: true, headerTemplate: '<span></span>',
    footerTemplate: '<div style="font-family:Arial;font-size:8px;width:100%;text-align:center;color:#777">BrewLite — Assignment 2 · <span class="pageNumber"></span> / <span class="totalPages"></span></div>',
  });
  await page.screenshot({ path: manifest.preview, fullPage: false });
} finally { await browser.close(); }
