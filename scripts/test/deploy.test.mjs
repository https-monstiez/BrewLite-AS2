import test from "node:test";
import assert from "node:assert/strict";
import { deploy } from "../deploy.mjs";

const sha = "a".repeat(40);
const env = {
  EXPECTED_VERSION: sha,
  RENDER_API_KEY: "test-key", RENDER_SERVICE_ID: "srv-test",
  API_HEALTH_URL: "https://api.example.test/api/health",
  VERCEL_DEPLOY_HOOK: "https://api.vercel.com/v1/integrations/deploy/test/main",
  WEB_URL: "https://web.example.test/",
};
const json = (body, status = 200) => new Response(JSON.stringify(body), { status });
function harness(overrides = {}) {
  const calls = [];
  const fetch = async (input, options = {}) => {
    const url = String(input);
    calls.push({ url, ...options });
    if (overrides[url]) return overrides[url](options);
    if (url.endsWith("/deploys")) return json({ id: "dep-test" }, 201);
    if (url.endsWith("/deploys/dep-test")) return json({ status: "live" });
    if (url === env.API_HEALTH_URL) return json({ status: "ok", version: sha });
    if (url.endsWith("/api/products")) return json([{ id: "p1" }]);
    if (url === env.VERCEL_DEPLOY_HOOK) return json({ job: { id: "test" } });
    if (url.endsWith("/version")) return json({ version: sha });
    if (url === env.WEB_URL) return new Response("<html>BrewLite</html>");
    throw new Error("Unexpected test request");
  };
  return { calls, options: { fetch, sleep: async () => {}, attempts: 2 } };
}
test("deploys pinned Git commit, then checks API/menu and web before success", async () => {
  const h = harness();
  assert.deepEqual(await deploy(env, h.options), { version: sha, renderDeployId: "dep-test" });
  const trigger = h.calls[0];
  assert.deepEqual(JSON.parse(trigger.body), { commitId: sha });
  assert.equal(trigger.headers.Authorization, "Bearer test-key");
  assert.equal(h.calls.filter((c) => c.url === env.VERCEL_DEPLOY_HOOK).length, 1);
  const hookIndex = h.calls.findIndex((c) => c.url === env.VERCEL_DEPLOY_HOOK);
  assert.ok(h.calls.slice(0, hookIndex).some((c) => c.url.endsWith("/api/products")));
});
test("missing settings and invalid SHA fail before any deployment", async () => {
  const h = harness();
  await assert.rejects(deploy({ ...env, RENDER_API_KEY: "" }, h.options), /Missing deployment setting/);
  await assert.rejects(deploy({ ...env, EXPECTED_VERSION: "main" }, h.options), /full commit SHA/);
  assert.equal(h.calls.length, 0);
});
test("rejects insecure URLs and non-Vercel hooks before sending secrets", async () => {
  const h = harness();
  await assert.rejects(deploy({ ...env, API_HEALTH_URL: "http://api.test/health" }, h.options), /HTTPS/);
  await assert.rejects(deploy({ ...env, VERCEL_DEPLOY_HOOK: "https://other.test/hook" }, h.options), /Vercel deploy hook/);
  assert.equal(h.calls.length, 0);
});
test("Render failure stops before Vercel is triggered", async () => {
  const h = harness({ "https://api.render.com/v1/services/srv-test/deploys/dep-test": () => json({ status: "build_failed" }) });
  await assert.rejects(deploy(env, h.options), /build_failed/);
  assert.ok(!h.calls.some((c) => c.url === env.VERCEL_DEPLOY_HOOK));
});
test("Render timeout is bounded", async () => {
  const h = harness({ "https://api.render.com/v1/services/srv-test/deploys/dep-test": () => json({ status: "build_in_progress" }) });
  await assert.rejects(deploy(env, h.options), /Render deployment timed out/);
});
test("cold-start health retries and eventually verifies expected SHA", async () => {
  let count = 0;
  const h = harness({ [env.API_HEALTH_URL]: () => ++count === 1 ? json({}, 503) : json({ status: "ok", version: sha }) });
  await deploy(env, h.options);
  assert.equal(count, 3);
});
test("stale API SHA prevents frontend deployment", async () => {
  const h = harness({ [env.API_HEALTH_URL]: () => json({ status: "ok", version: "old" }) });
  await assert.rejects(deploy(env, h.options), /API smoke\/version/);
  assert.ok(!h.calls.some((c) => c.url === env.VERCEL_DEPLOY_HOOK));
});
test("menu failure prevents frontend deployment", async () => {
  const h = harness({ "https://api.example.test/api/products": () => json({}, 500) });
  await assert.rejects(deploy(env, h.options), /menu smoke/);
  assert.ok(!h.calls.some((c) => c.url === env.VERCEL_DEPLOY_HOOK));
});
test("Vercel hook rejection fails delivery", async () => {
  const h = harness({ [env.VERCEL_DEPLOY_HOOK]: () => json({}, 403) });
  await assert.rejects(deploy(env, h.options), /Vercel deploy hook failed \(403\)/);
});
test("a different frontend SHA cannot pass smoke", async () => {
  const h = harness({ "https://web.example.test/version": () => json({ version: "other-commit" }) });
  await assert.rejects(deploy(env, h.options), /Web smoke\/version/);
});
test("API drift while building web fails the final check", async () => {
  let count = 0;
  const h = harness({ [env.API_HEALTH_URL]: () => json({ status: "ok", version: ++count === 1 ? sha : "newer" }) });
  await assert.rejects(deploy(env, h.options), /API version changed/);
});
test("transport errors do not expose deploy hook URL or credentials", async () => {
  const h = harness({ [env.VERCEL_DEPLOY_HOOK]: () => { throw new Error(env.VERCEL_DEPLOY_HOOK); } });
  await assert.rejects(deploy(env, h.options), (error) => {
    assert.ok(!error.message.includes(env.VERCEL_DEPLOY_HOOK));
    assert.ok(!error.message.includes(env.RENDER_API_KEY));
    return /HTTP request failed/.test(error.message);
  });
});
