#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
requested="${1:?Usage: bash deploy.sh VERIFIED_COMMIT_SHA}"
[[ "$requested" =~ ^[a-f0-9]{40}$ ]] || { echo 'Expected a full commit SHA'; exit 1; }
[[ -f .env ]] || { echo 'Create private .env from env.example first'; exit 1; }
export IMAGE_TAG="$requested"
compose=(docker compose --env-file .env -f compose.yml)
"${compose[@]}" config --quiet
"${compose[@]}" pull
if ! "${compose[@]}" up -d --wait --wait-timeout 240; then
 echo 'Deployment failed. Previous verified SHA remains in .last-good-image; see VPS rollback runbook.'
 exit 1
fi
"${compose[@]}" exec -T api node -e 'fetch("http://localhost:3001/api/health").then(async r=>{const d=await r.json();if(!r.ok||d.status!=="ok"||d.version!==process.env.APP_VERSION)process.exit(1)}).catch(()=>process.exit(1))'
"${compose[@]}" exec -T web node -e 'fetch("http://localhost:3000/version").then(async r=>{const d=await r.json();if(!r.ok||d.version!==process.env.APP_VERSION)process.exit(1)}).catch(()=>process.exit(1))'
# Verify HTTPS from the host without evaluating the .env as shell code.
domain="$("${compose[@]}" config --format json | python3 -c 'import json,sys; print(json.load(sys.stdin)["services"]["proxy"]["environment"]["DOMAIN"])')"
[[ "$domain" =~ ^[a-zA-Z0-9.-]+$ ]] || { echo 'Invalid domain'; exit 1; }
for i in {1..30}; do
 if curl --fail --silent --show-error --max-time 10 "https://$domain/api/health" | python3 -c 'import json,os,sys; d=json.load(sys.stdin);sys.exit(0 if d.get("status")=="ok" and d.get("version")==os.environ["IMAGE_TAG"] else 1)' && curl --fail --silent --show-error --max-time 10 "https://$domain/version" | python3 -c 'import json,os,sys;sys.exit(0 if json.load(sys.stdin).get("version")==os.environ["IMAGE_TAG"] else 1)'; then
  if [[ -f .last-good-image ]]; then cp .last-good-image .previous-good-image; fi
  printf '%s\n' "$IMAGE_TAG" > .last-good-image
  echo "Deployment and HTTPS smoke passed for $IMAGE_TAG"
  exit 0
 fi
 sleep 5
done
echo 'HTTPS smoke failed. Follow rollback instructions; do not reset the database.'
exit 1
