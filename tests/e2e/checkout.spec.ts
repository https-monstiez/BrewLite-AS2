import { test, expect } from "../../apps/web/node_modules/@playwright/test";
test("FR-01–FR-07: mobile menu → options → persisted cart → registration → card simulation → verified confirmation", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator('a[href^="/menu/"]').first().click();
  await page.getByLabel("Lượng đường").selectOption("50");
  await page
    .getByRole("button", { name: "Thêm vào giỏ hàng", exact: true })
    .click();
  await page.getByRole("button", { name: "Xem giỏ hàng", exact: true }).click();
  await expect(page).toHaveURL(/\/cart$/);
  await page.reload();
  await expect(page.getByText("Giỏ hàng đang trống.")).toHaveCount(0);
  await page.getByRole("link", { name: "Tiếp tục thanh toán" }).click();
  await page.goto("/register");
  await page.getByLabel("Tên hiển thị").fill("AS2 browser customer");
  await page
    .getByLabel("Email", { exact: true })
    .fill(`e2e-${Date.now()}@test.invalid`);
  await page.getByLabel("Mật khẩu", { exact: true }).fill("BrowserTest123!");
  await page.getByLabel("Xác nhận mật khẩu").fill("BrowserTest123!");
  await page
    .getByRole("button", { name: "Tạo tài khoản", exact: true })
    .click();
  await expect(page).toHaveURL(/checkout/);
  await page.getByRole("button", { name: /Thẻ mô phỏng/ }).click();
  await page
    .getByRole("button", { name: /Đặt hàng và thanh toán mô phỏng/ })
    .click();
  await expect(page).toHaveURL(/confirmation\?id=/);
  await expect(
    page.getByRole("heading", { name: "Đặt hàng thành công!" }),
  ).toBeVisible();
  await expect(page.getByText("Đã thanh toán", { exact: true })).toBeVisible();
});

test("NFR-03: production PWA installs its service worker and serves an offline page", async ({
  page,
  context,
}) => {
  await page.goto("/");
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  await context.setOffline(true);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Bạn đang ngoại tuyến" }),
  ).toBeVisible();
  await context.setOffline(false);
});
