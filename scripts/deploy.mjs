import { pathToFileURL } from "node:url";

const required = [
  "EXPECTED_VERSION", "RENDER_API_KEY", "RENDER_SERVICE_ID",
  "API_HEALTH_URL", "VERCEL_DEPLOY_HOOK", "WEB_URL",
];
const failedStates = new Set([
  "build_failed", "update_failed", "pre_deploy_failed", "canceled", "deactivated",
]);

export async function deploy(env, {
  fetch: request = globalThis.fetch,
  sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  attempts = 90,
} = {}) {
  for (const key of required) {
    if (!env[key]) throw new Error(`Missing deployment setting: ${key}`);
  }
  if (!/^[a-f0-9]{40}$/.test(env.EXPECTED_VERSION)) {
    throw new Error("EXPECTED_VERSION must be a full commit SHA");
  }
  for (const key of ["API_HEALTH_URL", "WEB_URL", "VERCEL_DEPLOY_HOOK"]) {
    const url = new URL(env[key]);
    if (url.protocol !== "https:" || url.username || url.password) {
      throw new Error(`${key} must be an HTTPS URL without credentials`);
    }
  }
  const hookUrl = new URL(env.VERCEL_DEPLOY_HOOK);
  if (hookUrl.hostname !== "api.vercel.com" || !hookUrl.pathname.startsWith("/v1/integrations/deploy/")) {
    throw new Error("VERCEL_DEPLOY_HOOK must be a Vercel deploy hook");
  }
  // Do not include request URLs/bodies in errors: deploy hooks contain secrets.
  async function fetchSafe(url, options = {}) {
    try {
      return await request(url, { ...options, signal: AbortSignal.timeout(30000) });
    } catch {
      throw new Error("Deployment HTTP request failed or timed out");
    }
  }
  async function poll(check, message) {
    for (let i = 0; i < attempts; i++) {
      if (await check()) return;
      if (i + 1 < attempts) await sleep(10000);
    }
    throw new Error(message);
  }
  const headers = {
    Authorization: `Bearer ${env.RENDER_API_KEY}`,
    "Content-Type": "application/json",
  };
  const service = `https://api.render.com/v1/services/${encodeURIComponent(env.RENDER_SERVICE_ID)}`;
  // Current Render service is Git-backed: pin the source commit, not a GHCR image.
  const created = await fetchSafe(`${service}/deploys`, {
    method: "POST", headers,
    body: JSON.stringify({ commitId: env.EXPECTED_VERSION }),
  });
  if (!created.ok) throw new Error(`Render deploy request failed (${created.status})`);
  const deployment = await created.json();
  if (!deployment.id) throw new Error("Render did not return a deployment id");
  await poll(async () => {
    const response = await fetchSafe(`${service}/deploys/${encodeURIComponent(deployment.id)}`, { headers });
    if (!response.ok) throw new Error(`Render status failed (${response.status})`);
    const state = await response.json();
    if (failedStates.has(state.status)) throw new Error(`Render deployment failed: ${state.status}`);
    return state.status === "live";
  }, "Render deployment timed out");

  async function jsonMatches(url, predicate) {
    try {
      const response = await fetchSafe(url, { cache: "no-store" });
      return response.ok && predicate(await response.json());
    } catch {
      return false; // Cold start or transient network error; bounded retries only.
    }
  }
  await poll(() => jsonMatches(env.API_HEALTH_URL, (status) =>
    status.status === "ok" && status.version === env.EXPECTED_VERSION),
  "API smoke/version check timed out");
  const menu = await fetchSafe(new URL("products", env.API_HEALTH_URL));
  if (!menu.ok || !Array.isArray(await menu.json())) throw new Error("API menu smoke test failed");

  // Hook must track production main. Hooks deploy the branch head; the SHA check
  // below rejects a concurrent newer commit instead of reporting false success.
  const hook = await fetchSafe(env.VERCEL_DEPLOY_HOOK, { method: "POST" });
  if (!hook.ok) throw new Error(`Vercel deploy hook failed (${hook.status})`);
  await poll(() => jsonMatches(new URL("/version", env.WEB_URL), (status) =>
    status.version === env.EXPECTED_VERSION), "Web smoke/version check timed out");
  const web = await fetchSafe(env.WEB_URL, { cache: "no-store" });
  if (!web.ok) throw new Error("Web page smoke test failed");
  // Detect API drift while Vercel was building.
  if (!await jsonMatches(env.API_HEALTH_URL, (status) =>
    status.status === "ok" && status.version === env.EXPECTED_VERSION)) {
    throw new Error("API version changed during web deployment");
  }
  return { version: env.EXPECTED_VERSION, renderDeployId: deployment.id };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const result = await deploy(process.env);
    console.log(`Deployment and smoke tests passed for ${result.version} (Render ${result.renderDeployId})`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
