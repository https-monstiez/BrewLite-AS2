import { createRequire } from 'node:module';
import { mkdir, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
const require = createRequire(new URL('../apps/web/package.json', import.meta.url));
const { chromium, expect } = require('@playwright/test');
// Creates one pending bank-transfer demo order. Does not send or confirm funds.
const webUrl = process.env.DEMO_WEB_URL || 'https://brew-lite-as-2.vercel.app';
const output = resolve('docs/demo');
await mkdir(output, { recursive: true });
const temporary = await mkdtemp(join(tmpdir(), 'brewlite-demo-'));
const browser = await chromium.launch({ headless: true, slowMo: 650 });
const context = await browser.newContext({
  viewport: { width: 390, height: 844 }, deviceScaleFactor: 1,
  recordVideo: { dir: temporary, size: { width: 390, height: 844 } },
});
// Redaction affects recording only. API responses and order state stay real.
await context.addInitScript(() => {
  const install = () => {
    if (!document.documentElement) return false;
    const style = document.createElement('style');
    style.textContent = `.bank-transfer-panel dl,.bank-transfer-panel .bank-qr-image,.bank-transfer-panel a,.bank-transfer-panel [role="alert"] {display:none!important}
      .bank-transfer-panel::before {content:'Video demo: QR và thông tin tài khoản đã được che.';display:block;padding:14px;background:#eee9df;color:#254b38}`;
    document.documentElement.appendChild(style);
    return true;
  };
  if (!install()) {
    const observer = new MutationObserver(() => { if (install()) observer.disconnect(); });
    observer.observe(document, { childList: true, subtree: true });
  }
});
const page = await context.newPage();
await page.route('https://img.vietqr.io/**', (route) => route.abort());
const video = page.video();
let success = false;
try {
  await page.goto(new URL('/login', webUrl).href, { waitUntil: 'networkidle' });
  await page.getByLabel('Email', { exact: true }).fill(process.env.DEMO_EMAIL || 'khachhang@gmail.com');
  await page.getByLabel('Mật khẩu', { exact: true }).fill(process.env.DEMO_PASSWORD || 'khach123456');
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  await expect(page).toHaveURL(new URL('/', webUrl).href);
  await page.locator('a[href^="/menu/"]').first().click();
  await page.getByRole('group', { name: 'Lượng đường' }).getByRole('button', { name: '25%', exact: true }).click();
  await page.getByRole('group', { name: 'Lượng đá' }).getByRole('button', { name: '50%', exact: true }).click();
  await page.getByRole('button', { name: /M.*5.000/ }).click();
  await page.getByRole('button', { name: 'Thêm vào giỏ hàng', exact: true }).click();
  await page.getByRole('button', { name: 'Xem giỏ hàng', exact: true }).click();
  await expect(page).toHaveURL(/\/cart$/);
  await page.reload({ waitUntil: 'networkidle' });
  await expect(page.getByText('Giỏ hàng đang trống.')).toHaveCount(0);
  await page.getByRole('link', { name: 'Tiếp tục thanh toán' }).click();
  await page.getByRole('button', { name: /Chuyển khoản ngân hàng/ }).click();
  await page.getByRole('button', { name: /Tạo đơn và xem QR ngân hàng/ }).click();
  await expect(page).toHaveURL(/confirmation\?id=/, { timeout: 30000 });
  const orderId = new URL(page.url()).searchParams.get('id');
  await expect(page.getByText('Chờ thanh toán / đối soát', { exact: true })).toBeVisible();
  await expect(page.getByText('Đã thanh toán', { exact: true })).toHaveCount(0);
  await page.waitForTimeout(2500);
  await page.getByRole('link', { name: /Xem lịch sử đơn/ }).click();
  const card = page.locator('article.order-card').filter({ has: page.getByRole('heading', { name: `#${orderId}`, exact: true }) });
  await expect(card).toBeVisible();
  await card.scrollIntoViewIfNeeded();
  await expect(card.getByText('Chờ thanh toán', { exact: true })).toBeVisible();
  await page.waitForTimeout(2500);
  console.log('Recorded bank checkout and history: pending reconciliation; no funds sent or confirmed.');
  success = true;
} finally {
  await context.close();
  if (success) {
    await video.saveAs(join(output, 'checkout-mobile.webm'));
    console.log('Overwrote docs/demo/checkout-mobile.webm (bank details redacted).');
  }
  await browser.close();
  await rm(temporary, { recursive: true, force: true });
}
