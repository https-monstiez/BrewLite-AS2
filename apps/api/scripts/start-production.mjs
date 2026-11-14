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
const app = spawnSync("node", ["dist/src/main.js"], {
  stdio: "inherit",
  env: process.env,
});
process.exit(app.status || (app.signal ? 1 : 0));
