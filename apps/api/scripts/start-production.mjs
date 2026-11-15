import { spawnSync } from "node:child_process";
const migration = spawnSync(
  "node",
  ["node_modules/prisma/build/index.js", "migrate", "deploy"],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      DATABASE_URL:
        process.env.MIGRATION_DATABASE_URL || process.env.DATABASE_URL,
    },
  },
);
if (migration.status !== 0) process.exit(migration.status || 1);
delete process.env.MIGRATION_DATABASE_URL;
if (process.env.SEED_CATALOG_ON_STARTUP === "true" || process.env.SEED_DEMO_ACCOUNTS === "true") {
  const seed = spawnSync("node", ["--import", "tsx", "prisma/seed.ts"], {
    stdio: "inherit",
    env: {
      ...process.env,
      SEED_IF_EMPTY: "true",
      SEED_DEMO_ACCOUNTS: process.env.SEED_DEMO_ACCOUNTS === "true" ? "true" : "false",
    },
  });
  if (seed.status !== 0) process.exit(seed.status || 1);
}
if (process.env.BOOTSTRAP_ADMIN_EMAIL || process.env.BOOTSTRAP_ADMIN_PASSWORD) {
  const bootstrap = spawnSync(
    "node",
    ["--import", "tsx", "prisma/bootstrap-admin.ts"],
    {
      stdio: "inherit",
      env: process.env,
    },
  );
  if (bootstrap.status !== 0) process.exit(bootstrap.status || 1);
}
delete process.env.BOOTSTRAP_ADMIN_EMAIL;
delete process.env.BOOTSTRAP_ADMIN_PASSWORD;
const app = spawnSync("node", ["dist/src/main.js"], {
  stdio: "inherit",
  env: process.env,
});
process.exit(app.status || (app.signal ? 1 : 0));
