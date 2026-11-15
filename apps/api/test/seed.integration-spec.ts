import { execFileSync } from "node:child_process";
import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";

if (!process.env.TEST_DATABASE_URL) throw new Error("Set TEST_DATABASE_URL to an isolated test database");

it("opts into demo accounts with an existing catalog and preserves existing credentials, roles and stock", async () => {
  // Dedicated schema avoids touching users/catalog used by checkout tests.
  const schema = `seed_test_${Date.now()}`;
  const url = new URL(process.env.TEST_DATABASE_URL!);
  url.searchParams.set("schema", schema);
  const databaseUrl = url.toString();
  const env = { ...process.env, DATABASE_URL: databaseUrl };
  const prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
  const cleanup = new PrismaClient({ datasources: { db: { url: process.env.TEST_DATABASE_URL } } });
  const runSeed = (enabled: boolean) => execFileSync(process.execPath,
    ["--import", "tsx", "prisma/seed.ts"], {
      cwd: process.cwd(), stdio: "pipe",
      env: { ...env, SEED_IF_EMPTY: "true", SEED_DEMO_ACCOUNTS: String(enabled) },
    });
  try {
    execFileSync(process.execPath, ["node_modules/prisma/build/index.js", "migrate", "deploy"], {
      cwd: process.cwd(), env, stdio: "pipe",
    });
    await prisma.product.create({ data: { id: "existing", name: "Existing menu", price: 12345, stock: 7 } });
    runSeed(false);
    expect(await prisma.user.count()).toBe(0);
    runSeed(true);
    const admin = await prisma.user.findUniqueOrThrow({ where: { email: "admin@gmail.com" } });
    expect(admin.role).toBe("ADMIN");
    expect(await bcrypt.compare("admin123456", admin.passwordHash)).toBe(true);
    expect((await prisma.user.findUniqueOrThrow({ where: { email: "nhanvien@gmail.com" } })).role).toBe("STAFF");
    expect((await prisma.user.findUniqueOrThrow({ where: { email: "khachhang@gmail.com" } })).role).toBe("CUSTOMER");
    const changedHash = await bcrypt.hash("ChangedPrivatePassword123!", 4);
    await prisma.user.update({ where: { id: admin.id }, data: { passwordHash: changedHash, role: "CUSTOMER" } });
    runSeed(true);
    const preserved = await prisma.user.findUniqueOrThrow({ where: { id: admin.id } });
    expect(preserved.passwordHash).toBe(changedHash);
    expect(preserved.role).toBe("CUSTOMER");
    expect(await prisma.user.count()).toBe(3);
    expect(await prisma.product.count()).toBe(1);
    expect(await prisma.product.findUniqueOrThrow({ where: { id: "existing" } })).toMatchObject({ price: 12345, stock: 7 });
  } finally {
    await prisma.$disconnect();
    await cleanup.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
    await cleanup.$disconnect();
  }
});
