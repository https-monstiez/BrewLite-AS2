const required = [
  "IMAGE_URL",
  "EXPECTED_VERSION",
  "RENDER_API_KEY",
  "RENDER_SERVICE_ID",
  "API_HEALTH_URL",
  "VERCEL_DEPLOY_HOOK",
  "WEB_URL",
];
for (const key of required)
  if (!process.env[key]) throw new Error(`Missing deployment setting: ${key}`);
const env = process.env;
const headers = {
  Authorization: `Bearer ${env.RENDER_API_KEY}`,
  "Content-Type": "application/json",
};
const service = `https://api.render.com/v1/services/${encodeURIComponent(env.RENDER_SERVICE_ID)}`;
const created = await fetch(`${service}/deploys`, {
  method: "POST",
  headers,
  body: JSON.stringify({ imageUrl: env.IMAGE_URL }),
});
if (!created.ok)
  throw new Error(`Render deploy request failed (${created.status})`);
const deploy = await created.json();
if (!deploy.id) throw new Error("Render did not return a deployment id");
let ready = false;
for (let i = 0; i < 90; i++) {
  const response = await fetch(
    `${service}/deploys/${encodeURIComponent(deploy.id)}`,
    { headers },
  );
  if (!response.ok)
    throw new Error(`Render status failed (${response.status})`);
  const state = await response.json();
  if (
    [
      "build_failed",
      "update_failed",
      "pre_deploy_failed",
      "canceled",
      "deactivated",
    ].includes(state.status)
  )
    throw new Error(`Render deployment failed: ${state.status}`);
  if (state.status === "live") {
    ready = true;
    break;
  }
  await new Promise((resolve) => setTimeout(resolve, 10000));
}
if (!ready) throw new Error("Render deployment timed out");
const health = await fetch(env.API_HEALTH_URL, {
  signal: AbortSignal.timeout(15000),
});
if (!health.ok) throw new Error("API smoke test failed");
const status = await health.json();
if (status.status !== "ok" || status.version !== env.EXPECTED_VERSION)
  throw new Error("API version does not match deployed SHA");
const hook = await fetch(env.VERCEL_DEPLOY_HOOK, {
  method: "POST",
  signal: AbortSignal.timeout(15000),
});
if (!hook.ok) throw new Error("Vercel deploy hook failed");
let webReady = false;
for (let i = 0; i < 60; i++) {
  try {
    const response = await fetch(new URL("/version", env.WEB_URL), {
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });
    if (
      response.ok &&
      (await response.json()).version === env.EXPECTED_VERSION
    ) {
      webReady = true;
      break;
    }
  } catch {}
  await new Promise((resolve) => setTimeout(resolve, 10000));
}
if (!webReady) throw new Error("Web smoke/version check timed out");
console.log("Deployment and smoke tests passed for " + env.EXPECTED_VERSION);
