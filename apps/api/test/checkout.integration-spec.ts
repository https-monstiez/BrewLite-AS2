import { execFileSync } from "node:child_process";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/database/prisma.service";

if (!process.env.TEST_DATABASE_URL)
  throw new Error("Set TEST_DATABASE_URL to an isolated test database");
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
process.env.JWT_SECRET = "integration-secret-at-least-32-characters";
process.env.PAYMENT_MODE = "simulation";
process.env.BANK_BIN = "970436";
process.env.BANK_ACCOUNT_NUMBER = "1234567890";
process.env.BANK_ACCOUNT_NAME = "TEST RECEIVER";
process.env.VNPAY_TMN_CODE = "TESTCODE";
process.env.VNPAY_HASH_SECRET = "integration-sandbox-secret";
process.env.VNPAY_RETURN_URL = "http://localhost/payment-return";

describe("PostgreSQL checkout integration", () => {
  let app: INestApplication,
    prisma: PrismaService,
    base: string,
    token: string,
    otherToken: string,
    staffToken: string,
    _userId: string,
    productId: string;
  const prefix = `integration-${Date.now()}`;
  async function request(
    path: string,
    method = "GET",
    body?: unknown,
    key?: string,
    auth = token,
  ) {
    return fetch(base + path, {
      method,
      headers: {
        "content-type": "application/json",
        ...(auth ? { authorization: `Bearer ${auth}` } : {}),
        ...(key ? { "idempotency-key": key } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
  }
  const orderBody = () => ({
    items: [
      { productId, qty: 1, size: "M", toppings: [], sugar: "50", ice: "100" },
    ],
  });
  async function createOrder(key: string) {
    const response = await request("/orders", "POST", orderBody(), key);
    expect(response.status).toBe(201);
    return response.json();
  }
  async function makePayment(
    orderId: string,
    key: string,
    method = "BANK_TRANSFER",
  ) {
    const response = await request(
      "/payments",
      "POST",
      { orderId, method },
      key,
    );
    expect(response.status).toBe(201);
    return response.json();
  }
  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = module.createNestApplication();
    app.setGlobalPrefix("api");
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.listen(0, "127.0.0.1");
    base = (await app.getUrl()) + "/api";
    prisma = app.get(PrismaService);
    for (const [index, email] of [
      `${prefix}@test.invalid`,
      `${prefix}-other@test.invalid`,
    ].entries()) {
      const response = await request(
        "/auth/register",
        "POST",
        { email, password: "IntegrationTest123!", name: prefix },
        undefined,
        "",
      );
      expect(response.status).toBe(201);
      const data = await response.json();
      if (index === 0) {
        token = data.accessToken;
        _userId = data.user.id;
      } else otherToken = data.accessToken;
    }
    const staffResponse = await request("/auth/register", "POST", {
      email: `${prefix}-staff@test.invalid`, password: "StaffIntegration123!", name: "Test staff",
    }, undefined, "");
    expect(staffResponse.status).toBe(201);
    const staff = await staffResponse.json();
    await prisma.user.update({ where: { id: staff.user.id }, data: { role: "STAFF" } });
    staffToken = staff.accessToken;
    const product = await prisma.product.create({
      data: { name: prefix, price: 29000, stock: 30 },
    });
    productId = product.id;
  });
  afterAll(async () => {
    if (prisma) {
      const users = await prisma.user.findMany({
        where: { email: { startsWith: prefix } },
        select: { id: true },
      });
      const ids = users.map((u) => u.id);
      const orders = await prisma.order.findMany({
        where: { userId: { in: ids } },
        select: { id: true },
      });
      await prisma.loyaltyTransaction.deleteMany({
        where: { userId: { in: ids } },
      });
      await prisma.payment.deleteMany({
        where: { orderId: { in: orders.map((o) => o.id) } },
      });
      await prisma.order.deleteMany({ where: { userId: { in: ids } } });
      await prisma.activityLog.deleteMany({
        where: { actorUserId: { in: ids } },
      });
      await prisma.user.deleteMany({ where: { id: { in: ids } } });
      await prisma.stockMovement.deleteMany({
        where: { ingredient: { name: prefix } },
      });
      await prisma.recipeIngredient.deleteMany({ where: { productId } });
      await prisma.ingredient.deleteMany({ where: { name: prefix } });
      await prisma.product.deleteMany({
        where: { name: { startsWith: prefix } },
      });
    }
    await app?.close();
  });
  it("quotes server prices; rejects client prices and anonymous checkout", async () => {
    const quote = await request("/orders/quote", "POST", orderBody());
    expect(quote.status).toBe(201);
    expect((await quote.json()).total).toBe(34000);
    for (const sugar of ["25", "75"]) {
      const optionQuote = await request("/orders/quote", "POST", {
        items: [{ ...orderBody().items[0], sugar }],
      });
      expect(optionQuote.status).toBe(201);
      expect((await optionQuote.json()).total).toBe(34000);
    }
    expect(
      (
        await request(
          "/orders",
          "POST",
          { ...orderBody(), total: 1 },
          prefix + "-tamper",
        )
      ).status,
    ).toBe(400);
    expect(
      (await request("/orders", "POST", orderBody(), prefix + "-anon", ""))
        .status,
    ).toBe(401);
  });
  it("deduplicates concurrent create requests and rejects changed options", async () => {
    const key = prefix + "-same-order";
    const responses = await Promise.all([
      request("/orders", "POST", orderBody(), key),
      request("/orders", "POST", orderBody(), key),
    ]);
    expect(responses.map((r) => r.status)).toEqual([201, 201]);
    const orders = await Promise.all(responses.map((r) => r.json()));
    expect(orders[0].id).toBe(orders[1].id);
    expect(
      (
        await request(
          "/orders",
          "POST",
          { items: [{ ...orderBody().items[0], sugar: "0" }] },
          key,
        )
      ).status,
    ).toBe(409);
    expect(
      (
        await request(
          "/orders/" + orders[0].id,
          "GET",
          undefined,
          undefined,
          otherToken,
        )
      ).status,
    ).toBe(404);
  });
  it("reconciles a bank payment once, records one ledger entry, and forbids customer status writes", async () => {
    const order = await createOrder(prefix + "-sim");
    const paymentResponses = await Promise.all([
      request(
        "/payments",
        "POST",
        { orderId: order.id, method: "BANK_TRANSFER" },
        prefix + "-sim-pay",
      ),
      request(
        "/payments",
        "POST",
        { orderId: order.id, method: "BANK_TRANSFER" },
        prefix + "-sim-pay",
      ),
    ]);
    expect(paymentResponses.map((r) => r.status)).toEqual([201, 201]);
    const payments = await Promise.all(paymentResponses.map((r) => r.json()));
    expect(payments[0].id).toBe(payments[1].id);
    const payment = payments[0];
    const repeated = await makePayment(order.id, prefix + "-sim-pay");
    expect(repeated.id).toBe(payment.id);
    const reconciled = await Promise.all([
      request(`/payments/${order.id}/confirm`, "POST", undefined, undefined, staffToken),
      request(`/payments/${order.id}/confirm`, "POST", undefined, undefined, staffToken),
    ]);
    expect(reconciled.map((response) => response.status).sort()).toEqual([201, 409]);
    expect(
      (await prisma.order.findUniqueOrThrow({ where: { id: order.id } }))
        .status,
    ).toBe("PAID");
    expect(
      await prisma.loyaltyTransaction.count({
        where: { orderId: order.id, kind: "EARN" },
      }),
    ).toBe(1);
    expect(
      (
        await request(`/orders/${order.id}/status`, "PATCH", {
          status: "COMPLETED",
        })
      ).status,
    ).toBe(403);
  });
  it("serializes two different payment keys for the same order", async () => {
    const order = await createOrder(prefix + "-payment-race");
    const results = await Promise.all([
      request(
        "/payments",
        "POST",
        { orderId: order.id, method: "BANK_TRANSFER" },
        prefix + "-race-a",
      ),
      request(
        "/payments",
        "POST",
        { orderId: order.id, method: "BANK_TRANSFER" },
        prefix + "-race-b",
      ),
    ]);
    expect(results.map((r) => r.status).sort()).toEqual([201, 409]);
    expect(await prisma.payment.count({ where: { orderId: order.id } })).toBe(
      1,
    );
  });
  it("restores product and ingredient inventory exactly once when canceling a pending bank order", async () => {
    const ingredient = await prisma.ingredient.create({
      data: { name: prefix, unit: "g", stock: 100 },
    });
    await prisma.recipeIngredient.create({
      data: { productId, ingredientId: ingredient.id, quantity: 20 },
    });
    const before = await prisma.product.findUniqueOrThrow({
      where: { id: productId },
    });
    const order = await createOrder(prefix + "-decline");
    expect(
      (
        await prisma.ingredient.findUniqueOrThrow({
          where: { id: ingredient.id },
        })
      ).stock,
    ).toBe(75);
    const payment = await makePayment(order.id, prefix + "-decline-pay");
    expect(payment.method).toBe("BANK_TRANSFER");
    expect((await request(`/orders/${order.id}/cancel`, "POST", { reason: "Test cancellation" })).status).toBe(201);
    expect((await request(`/orders/${order.id}/cancel`, "POST", { reason: "Repeated cancellation" })).status).toBe(400);
    expect(
      (await prisma.product.findUniqueOrThrow({ where: { id: productId } }))
        .stock,
    ).toBe(before.stock);
    expect(
      (
        await prisma.ingredient.findUniqueOrThrow({
          where: { id: ingredient.id },
        })
      ).stock,
    ).toBe(100);
    expect(
      (await prisma.order.findUniqueOrThrow({ where: { id: order.id } }))
        .status,
    ).toBe("CANCELLED");
    await prisma.recipeIngredient.deleteMany({ where: { productId } });
  });
  it("exposes only bank/points and rejects retired methods without creating payments", async () => {
    const methods = await request("/payments/methods");
    expect((await methods.json()).available.sort()).toEqual(["BANK_TRANSFER", "LOYALTY_POINTS"]);
    const order = await createOrder(prefix + "-retired");
    for (const method of ["VNPAY", "MOMO", "WALLET_SIM", "CARD_SIM"]) {
      expect((await request("/payments", "POST", { orderId: order.id, method }, prefix + method)).status).toBe(400);
    }
    expect(await prisma.payment.count({ where: { orderId: order.id } })).toBe(0);
    expect((await request("/payments/retired/simulate", "POST", { outcome: "success" })).status).toBe(404);
    expect((await request("/payments/vnpay/return")).status).toBe(404);
  });
  it("enforces ADMIN inventory access, idempotent receipts and strict order transitions", async () => {
    expect((await request("/inventory")).status).toBe(403);
    const user = await prisma.user.findFirstOrThrow({
      where: { email: `${prefix}@test.invalid` },
    });
    await prisma.user.update({
      where: { id: user.id },
      data: { role: "ADMIN" },
    });
    const created = await request("/inventory", "POST", {
      name: prefix + "-receipt",
      unit: "ml",
    });
    expect(created.status).toBe(201);
    const ingredient = await created.json();
    for (let i = 0; i < 2; i++)
      expect(
        (
          await request(`/inventory/${ingredient.id}/receive`, "POST", {
            quantity: 100,
            reference: prefix + "-receipt",
          })
        ).status,
      ).toBe(201);
    expect(
      (
        await prisma.ingredient.findUniqueOrThrow({
          where: { id: ingredient.id },
        })
      ).stock,
    ).toBe(100);
    const order = await createOrder(prefix + "-states");
    expect(
      (await request(`/orders/${order.id}/status`, "PATCH", { status: "PAID" }))
        .status,
    ).toBe(409);
    await makePayment(order.id, prefix + "-states-pay");
    expect((await request(`/payments/${order.id}/confirm`, "POST", undefined, undefined, staffToken)).status).toBe(201);
    expect(
      (
        await request(`/orders/${order.id}/status`, "PATCH", {
          status: "COMPLETED",
        })
      ).status,
    ).toBe(409);
    for (const status of ["PREPARING", "READY", "COMPLETED"])
      expect(
        (await request(`/orders/${order.id}/status`, "PATCH", { status }))
          .status,
      ).toBe(200);
    await prisma.stockMovement.deleteMany({
      where: { ingredientId: ingredient.id },
    });
    await prisma.ingredient.delete({ where: { id: ingredient.id } });
    await prisma.user.update({
      where: { id: user.id },
      data: { role: "CUSTOMER" },
    });
  });
  it("measures warm menu p95 on 100 products with 20 concurrent clients", async () => {
    await prisma.product.createMany({
      data: Array.from({ length: 100 }, (_, i) => ({
        name: prefix + "-load-" + i,
        price: 29000,
        stock: 10,
      })),
    });
    await request("/products");
    const timings: number[] = [];
    for (let batch = 0; batch < 5; batch++)
      await Promise.all(
        Array.from({ length: 20 }, async () => {
          const start = performance.now();
          const response = await request("/products");
          expect(response.status).toBe(200);
          await response.text();
          timings.push(performance.now() - start);
        }),
      );
    const p95 = timings.sort((a, b) => a - b)[
      Math.ceil(timings.length * 0.95) - 1
    ];
    console.log(
      `MENU_PERFORMANCE samples=${timings.length} concurrency=20 products>=100 p95_ms=${p95.toFixed(1)}`,
    );
    expect(p95).toBeLessThan(1000);
  });
  it("creates owner-only bank instructions from server totals and waits for staff reconciliation", async () => {
    const methods = await request("/payments/methods");
    const available = (await methods.json()).available;
    expect(available).toContain("BANK_TRANSFER");
    expect(available).not.toContain("MOMO");
    const order = await createOrder(prefix + "-bank");
    const payment = await makePayment(
      order.id,
      prefix + "-bank-pay",
      "BANK_TRANSFER",
    );
    const instructionsResponse = await request(
      `/payments/bank-transfer/${order.id}?amount=1`,
    );
    expect(instructionsResponse.status).toBe(200);
    const instructions = await instructionsResponse.json();
    expect(instructions.amount).toBe(order.total);
    expect(instructions.accountNumber).toBe("1234567890");
    expect(instructions.confirmation).toBe("STAFF_RECONCILIATION");
    const qr = new URL(instructions.qrImageUrl);
    expect(qr.hostname).toBe("img.vietqr.io");
    expect(qr.searchParams.get("amount")).toBe(String(order.total));
    expect(qr.searchParams.get("addInfo")).toBe(payment.id.toUpperCase());
    expect(
      (await prisma.order.findUniqueOrThrow({ where: { id: order.id } }))
        .status,
    ).toBe("PENDING");
    expect(
      (
        await request(
          `/payments/bank-transfer/${order.id}`,
          "GET",
          undefined,
          undefined,
          otherToken,
        )
      ).status,
    ).toBe(404);
    expect(
      (await request(`/payments/${order.id}/confirm`, "POST")).status,
    ).toBe(403);
    const user = await prisma.user.findFirstOrThrow({
      where: { email: `${prefix}@test.invalid` },
    });
    await prisma.user.update({
      where: { id: user.id },
      data: { role: "STAFF" },
    });
    try {
      expect(
        (await request(`/payments/${order.id}/confirm`, "POST")).status,
      ).toBe(201);
      expect(
        (await request(`/payments/${order.id}/confirm`, "POST")).status,
      ).toBe(409);
    } finally {
      await prisma.user.update({
        where: { id: user.id },
        data: { role: "CUSTOMER" },
      });
    }
    expect(
      (await prisma.order.findUniqueOrThrow({ where: { id: order.id } }))
        .status,
    ).toBe("PAID");
    expect((await request(`/payments/bank-transfer/${order.id}`)).status).toBe(
      404,
    );
  });
  it("bootstraps a cloud administrator without resetting credentials or elevating an existing customer", async () => {
    const email = `${prefix}-bootstrap@test.invalid`;
    const password = "CloudBootstrapTest123!";
    const run = (targetEmail: string, targetPassword: string) =>
      execFileSync(
        process.execPath,
        ["--import", "tsx", "prisma/bootstrap-admin.ts"],
        {
          cwd: process.cwd(),
          env: {
            ...process.env,
            BOOTSTRAP_ADMIN_EMAIL: targetEmail,
            BOOTSTRAP_ADMIN_PASSWORD: targetPassword,
          },
          stdio: "pipe",
        },
      );
    run(email, password);
    const original = await prisma.user.findUniqueOrThrow({ where: { email } });
    expect(original.role).toBe("ADMIN");
    run(email, "DifferentBootstrapPassword123!");
    expect(
      (await prisma.user.findUniqueOrThrow({ where: { email } })).passwordHash,
    ).toBe(original.passwordHash);
    expect(() => run(`${prefix}@test.invalid`, password)).toThrow();
    expect(
      (
        await prisma.user.findUniqueOrThrow({
          where: { email: `${prefix}@test.invalid` },
        })
      ).role,
    ).toBe("CUSTOMER");
    const login = await request(
      "/auth/login",
      "POST",
      { email, password },
      undefined,
      "",
    );
    expect(login.status).toBe(201);
  });
  it("does not oversell the last product under concurrent orders", async () => {
    await prisma.product.update({
      where: { id: productId },
      data: { stock: 1 },
    });
    const results = await Promise.all([
      request("/orders", "POST", orderBody(), prefix + "-last-a"),
      request("/orders", "POST", orderBody(), prefix + "-last-b"),
    ]);
    expect(results.filter((r) => r.status === 201)).toHaveLength(1);
    expect(
      (await prisma.product.findUniqueOrThrow({ where: { id: productId } }))
        .stock,
    ).toBe(0);
  });
});
