import {
  defineConfig,
  devices,
} from "../apps/web/node_modules/@playwright/test";
import path from "node:path";
const root = path.resolve(__dirname, "..");
export default defineConfig({
  testDir: "./e2e",
  workers: 1,
  timeout: 60000,
  reporter: [
    ["list"],
    [
      "html",
      { open: "never", outputFolder: path.join(root, "playwright-report") },
    ],
  ],
  use: {
    baseURL: "http://127.0.0.1:3100",
    trace: "retain-on-failure",
    ...devices["iPhone 13"],
    defaultBrowserType: "chromium",
  },
  projects: [{ name: "chromium", use: { browserName: "chromium" } }],
  webServer: [
    {
      command: "node scripts/start-production.mjs",
      cwd: path.join(root, "apps/api"),
      url: "http://127.0.0.1:3101/api/health",
      env: {
        PORT: "3101",
        DATABASE_URL: process.env.TEST_DATABASE_URL || "",
        JWT_SECRET: "browser-test-secret-at-least-32-characters",
        FRONTEND_ORIGIN: "http://127.0.0.1:3100",
        PAYMENT_MODE: "simulation",
        SEED_CATALOG_ON_STARTUP: "true",
        BOOTSTRAP_ADMIN_EMAIL: "browser-admin@test.invalid",
        BOOTSTRAP_ADMIN_PASSWORD: "BrowserAdminTest123!",
        BANK_BIN: "970436",
        BANK_ACCOUNT_NUMBER: "1234567890",
        BANK_ACCOUNT_NAME: "TEST RECEIVER",
      },
      reuseExistingServer: false,
    },
    {
      command: "npm run start -- --hostname 127.0.0.1 --port 3100",
      cwd: path.join(root, "apps/web"),
      url: "http://127.0.0.1:3100",
      reuseExistingServer: false,
    },
  ],
});
