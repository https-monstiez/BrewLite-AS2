# BrewLite API (AS2)

The API is a NestJS application backed by PostgreSQL and Prisma. For the full project setup, environment variables, Docker Compose, deployment and rollback instructions, see the [repository README](../../README.md) and [deployment guide](../../docs/deployment.md).

## Local development

Requirements: Node.js 22.12 or newer and PostgreSQL 16.

From the repository root, install both applications:

```sh
npm run install:apps
cp apps/api/.env.example apps/api/.env
```

Set `DATABASE_URL` and a private `JWT_SECRET` in `apps/api/.env`. With the database running, prepare the schema and seed the catalog:

```sh
npm run prisma:generate --prefix apps/api
npm run prisma:deploy --prefix apps/api
npm run db:seed --prefix apps/api
npm run start:dev --prefix apps/api
```

The API defaults to `http://localhost:3001/api`. `GET /health` checks the database connection at `/api/health`.

## Main endpoints

| Endpoint | Access | Purpose |
|---|---|---|
| `GET /products`, `GET /products/:id` | Public | Browse active products |
| `POST /auth/register`, `POST /auth/login` | Public | Register and obtain a JWT |
| `POST /orders/quote` | JWT | Get a server-calculated quote |
| `POST /orders` | JWT | Create an order; requires an `Idempotency-Key` |
| `GET /orders/me`, `GET /orders/:id` | JWT / owner | Read personal order history or an owned order |
| `GET /orders/management` | STAFF, ADMIN | Read the work queue |
| `PATCH /orders/:id/status` | STAFF, ADMIN | Advance a paid order through preparation |
| `GET /payments/methods` | JWT | List payment methods currently configured |
| `POST /payments` | JWT | Create a payment; requires an `Idempotency-Key` |
| `POST /payments/:orderId/confirm` | STAFF, ADMIN | Reconcile a pending bank transfer |

The API validates roles and order ownership; hiding controls in the web UI is not an authorization check. Staff order transitions are `PAID → PREPARING → READY → COMPLETED`.

## Payment configuration

`WALLET_SIM` and `CARD_SIM` are simulations and are available only when `PAYMENT_MODE=simulation`. They do not collect money. `BANK_TRANSFER` is exposed only when recipient details are configured in the API environment; a transfer remains pending until STAFF or ADMIN confirms receipt. `VNPAY` is exposed only when sandbox credentials are configured. MoMo is not enabled. Never put receiving-account details or payment secrets in source control or the web application's public environment.

## Validation

From the repository root, run `npm run lint`, `npm test` and `npm run build`. PostgreSQL integration tests use a separate test database; see [testing instructions](../../docs/testing.md) before running them.
