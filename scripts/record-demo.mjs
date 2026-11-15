import { createRequire } from 'node:module';
import { mkdir, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
const require = createRequire(new URL('../apps/web/package.json', import.meta.url));
const { chromium, expect } = require('@playwright/test');
// Records one real UI checkout using simulated payment; creates a demo order.
const webUrl = process.env.DEMO_WEB_URL || 'https://brew-lite-as-2.vercel.app';
const output = resolve('docs/demo');
await mkdir(output, { recursive: true });
const temporary = await mkdtemp(join(tmpdir(), 'brewlite-demo-'));
const browser = await chromium.launch({ headless: true, slowMo: 500 });
const context = await browser.newContext({
 viewport: { width: 390, height: 844 }, deviceScaleFactor: 1,
 recordVideo: { dir: temporary, size: { width: 390, height: 844 } },
});
const page = await context.newPage();
const video = page.video();
let success = false;
try {
 await page.goto(new URL('/login', webUrl).href, { waitUntil: 'networkidle' });
 await page.getByLabel('Email', { exact: true }).fill(process.env.DEMO_EMAIL || 'khachhang@gmail.com');
 await page.getByLabel('Mật khẩu', { exact: true }).fill(process.env.DEMO_PASSWORD || 'khach123456');
 await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
 await expect(page).toHaveURL(new URL('/', webUrl).href);
 await page.locator('a[href^="/menu/"]').first().click();
 await page.getByLabel('Lượng đường').selectOption('50');
 await page.getByLabel('Lượng đá').selectOption('50');
 await page.getByRole('button', { name: /M.*5.000/ }).click();
 await page.getByRole('button', { name: 'Thêm vào giỏ hàng', exact: true }).click();
 await page.getByRole('button', { name: 'Xem giỏ hàng', exact: true }).click();
 await expect(page).toHaveURL(/\/cart$/);
 await page.reload({ waitUntil: 'networkidle' });
 await expect(page.getByText('Giỏ hàng đang trống.')).toHaveCount(0);
 await page.getByRole('link', { name: 'Tiếp tục thanh toán' }).click();
 await page.getByRole('button', { name: /Thẻ mô phỏng/ }).click();
 await page.getByRole('button', { name: /Đặt hàng và thanh toán mô phỏng/ }).click();
 await expect(page).toHaveURL(/confirmation\?id=/, { timeout: 30000 });
 await expect(page.getByRole('heading', { name: 'Đặt hàng thành công!' })).toBeVisible();
 await expect(page.getByText('Đã thanh toán', { exact: true })).toBeVisible();
 await page.waitForTimeout(2500);
 console.log('Production browser checkout passed; simulated payment only.');
 success = true;
} finally {
 await context.close();
 if (success) {
  await video.saveAs(join(output, 'checkout-mobile.webm'));
  console.log('Saved docs/demo/checkout-mobile.webm');
 }
 await browser.close();
 await rm(temporary, { recursive: true, force: true });
}
