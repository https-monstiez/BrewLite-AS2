import { test, expect } from "../../apps/web/node_modules/@playwright/test";
test("FR-01–FR-07: mobile menu → options → persisted cart → registration → bank reconciliation → verified confirmation", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator('a[href^="/menu/"]').first().click();
  await page.getByRole("group", { name: "Lượng đường" }).getByRole("button", { name: "25%", exact: true }).click();
  await page.getByRole("group", { name: "Lượng đá" }).getByRole("button", { name: "50%", exact: true }).click();
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
  await page.getByRole("button", { name: /Chuyển khoản ngân hàng/ }).click();
  await page.getByRole("button", { name: /Tạo đơn và xem QR ngân hàng/ }).click();
  await expect(page).toHaveURL(/confirmation\?id=/);
  await expect(page.getByText("Chờ thanh toán / đối soát", { exact: true })).toBeVisible();
  const orderId = new URL(page.url()).searchParams.get("id");
  const api = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:3101/api";
  // Isolated test API and fake receiver only; no bank transfer is performed.
  const login = await page.request.post(`${api}/auth/login`, {
    data: { email: "browser-admin@test.invalid", password: "BrowserAdminTest123!" },
  });
  expect(login.ok()).toBeTruthy();
  const manager = await login.json();
  const confirmed = await page.request.post(`${api}/payments/${orderId}/confirm`, {
    headers: { Authorization: `Bearer ${manager.accessToken}` },
  });
  expect(confirmed.ok()).toBeTruthy();
  await page.reload();
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

test("Bank QR shows server instructions and stays pending without staff confirmation", async ({
  page,
}) => {
  await page.route("https://img.vietqr.io/**", (route) =>
    route.fulfill({
      contentType: "image/svg+xml",
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="white"/></svg>',
    }),
  );
  await page.goto("/");
  await page.locator('a[href^="/menu/"]').first().click();
  await page
    .getByRole("button", { name: "Thêm vào giỏ hàng", exact: true })
    .click();
  await page.getByRole("button", { name: "Xem giỏ hàng", exact: true }).click();
  await expect(page).toHaveURL(/\/cart$/);
  await page.goto("/register");
  await page.getByLabel("Tên hiển thị").fill("Bank checkout test");
  await page
    .getByLabel("Email", { exact: true })
    .fill(`e2e-bank-${Date.now()}@test.invalid`);
  await page
    .getByLabel("Mật khẩu", { exact: true })
    .fill("BrowserBankTest123!");
  await page.getByLabel("Xác nhận mật khẩu").fill("BrowserBankTest123!");
  await page
    .getByRole("button", { name: "Tạo tài khoản", exact: true })
    .click();
  await expect(page).toHaveURL(/checkout/);
  await page.getByRole("button", { name: /Chuyển khoản ngân hàng/ }).click();
  await page
    .getByRole("button", { name: /Tạo đơn và xem QR ngân hàng/ })
    .click();
  await expect(page).toHaveURL(/confirmation\?id=/);
  await expect(
    page.getByRole("region", { name: "Hướng dẫn chuyển khoản" }),
  ).toBeVisible();
  await expect(page.getByText("1234567890", { exact: true })).toBeVisible();
  await expect(page.getByText("TEST RECEIVER", { exact: true })).toBeVisible();
  await expect(
    page.getByText("Chờ thanh toán / đối soát", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Đã thanh toán", { exact: true })).toHaveCount(0);
  await page.reload();
  await expect(
    page.getByRole("region", { name: "Hướng dẫn chuyển khoản" }),
  ).toBeVisible();
  await expect(
    page.getByText("Chờ thanh toán / đối soát", { exact: true }),
  ).toBeVisible();
});


test('Cloud administrator can sign in and refresh a protected management page', async ({page}) => {
  await page.goto('/login');
  await page.getByLabel('Email',{exact:true}).fill('browser-admin@test.invalid');
  await page.getByLabel('Mật khẩu',{exact:true}).fill('BrowserAdminTest123!');
  await page.getByRole('button',{name:'Đăng nhập',exact:true}).click();
  await expect(page).toHaveURL('http://127.0.0.1:3100/');
  await page.goto('/admin/inventory');
  await expect(page.getByRole('heading',{name:'Tình trạng tồn kho',exact:true})).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading',{name:'Tình trạng tồn kho',exact:true})).toBeVisible();
  await expect(page).toHaveURL(/admin\/inventory/);
});
