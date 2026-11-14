import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/database/prisma.service";
import { VnpayService } from "../src/payments/vnpay.service";
import { signature } from "../src/payments/vnpay.service";

if (!process.env.TEST_DATABASE_URL)
  throw new Error("Set TEST_DATABASE_URL to an isolated test database");
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
process.env.JWT_SECRET = "integration-secret-at-least-32-characters";
process.env.PAYMENT_MODE = "simulation";
process.env.VNPAY_TMN_CODE = "TESTCODE";
process.env.VNPAY_HASH_SECRET = "integration-sandbox-secret";
process.env.VNPAY_RETURN_URL = "http://localhost/payment-return";

describe("PostgreSQL checkout integration", () => {
  let app: INestApplication,
    prisma: PrismaService,
    base: string,
    token: string,
    otherToken: string,
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
    method = "CARD_SIM",
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
  it("settles simulated payment once, records one ledger entry, and forbids customer status writes", async () => {
    const order = await createOrder(prefix + "-sim");
    const paymentResponses = await Promise.all([
      request('/payments', 'POST', { orderId: order.id, method: 'CARD_SIM' }, prefix + '-sim-pay'),
      request('/payments', 'POST', { orderId: order.id, method: 'CARD_SIM' }, prefix + '-sim-pay'),
    ]);
    expect(paymentResponses.map(r => r.status)).toEqual([201, 201]);
    const payments = await Promise.all(paymentResponses.map(r => r.json()));
    expect(payments[0].id).toBe(payments[1].id);
    const payment = payments[0];
    const repeated = await makePayment(order.id, prefix + "-sim-pay");
    expect(repeated.id).toBe(payment.id);
    await Promise.all([
      request(`/payments/${payment.id}/simulate`, "POST", {
        outcome: "success",
      }),
      request(`/payments/${payment.id}/simulate`, "POST", {
        outcome: "success",
      }),
    ]);
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
        { orderId: order.id, method: "WALLET_SIM" },
        prefix + "-race-a",
      ),
      request(
        "/payments",
        "POST",
        { orderId: order.id, method: "WALLET_SIM" },
        prefix + "-race-b",
      ),
    ]);
    expect(results.map((r) => r.status).sort()).toEqual([201, 409]);
    expect(await prisma.payment.count({ where: { orderId: order.id } })).toBe(
      1,
    );
  });
  it("restores product and ingredient inventory exactly once on declined payment", async () => {
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
    await request(`/payments/${payment.id}/simulate`, "POST", {
      outcome: "failure",
    });
    await request(`/payments/${payment.id}/simulate`, "POST", {
      outcome: "failure",
    });
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
    ).toBe("PAYMENT_FAILED");
    await prisma.recipeIngredient.deleteMany({ where: { productId } });
  });
  it("verifies VNPay signature, amount and duplicate Return/IPN using real transactions", async () => {
    const order = await createOrder(prefix + "-vnp");
    const payment = await makePayment(order.id, prefix + "-vnp-pay", "VNPAY");
    expect(payment.paymentUrl).toContain("vnp_SecureHash=");
    const params = {
      vnp_TmnCode: "TESTCODE",
      vnp_TxnRef: payment.id,
      vnp_Amount: String(order.total * 100),
      vnp_ResponseCode: "00",
      vnp_TransactionStatus: "00",
      vnp_TransactionNo: "12345",
    };
    const vnpay = app.get(VnpayService);
    expect(
      (await vnpay.callback({ ...params, vnp_SecureHash: "a".repeat(128) }))
        .RspCode,
    ).toBe("97");
    const wrong = { ...params, vnp_Amount: "100" };
    expect(
      (
        await vnpay.callback({
          ...wrong,
          vnp_SecureHash: signature(wrong, process.env.VNPAY_HASH_SECRET!),
        })
      ).RspCode,
    ).toBe("04");
    const signed = {
      ...params,
      vnp_SecureHash: signature(params, process.env.VNPAY_HASH_SECRET!),
    };
    const outcomes = await Promise.all([
      vnpay.callback(signed),
      vnpay.callback(signed),
    ]);
    expect(outcomes.map((o) => o.RspCode).sort()).toEqual(["00", "02"]);
    expect(
      await prisma.loyaltyTransaction.count({ where: { orderId: order.id } }),
    ).toBe(1);
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
    const payment = await makePayment(order.id, prefix + "-states-pay");
    await request(`/payments/${payment.id}/simulate`, "POST", {
      outcome: "success",
    });
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
