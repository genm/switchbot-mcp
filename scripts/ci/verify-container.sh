#!/usr/bin/env bash
set -euo pipefail

image_name="switchbot-mcp:ci-smoke"
container_name="switchbot-mcp-ci-smoke-${GITHUB_RUN_ID:-local}-$$"
verification_tmp_dir="$(mktemp -d)"

cleanup() {
  docker stop "${container_name}" >/dev/null 2>&1 || true
  docker image rm "${image_name}" >/dev/null 2>&1 || true
  rm -rf -- "${verification_tmp_dir}"
}
trap cleanup EXIT

docker build --tag "${image_name}" .

docker run --rm --entrypoint sh "${image_name}" -c \
  'for file in LICENSE README.md SECURITY.md SUPPORT.md docs/security-model.md; do test -r "/app/$file"; done'

image_source="$(docker image inspect "${image_name}" --format '{{ index .Config.Labels "org.opencontainers.image.source" }}')"
image_license="$(docker image inspect "${image_name}" --format '{{ index .Config.Labels "org.opencontainers.image.licenses" }}')"
if [[ "${image_source}" != "https://github.com/genm/switchbot-mcp" ]]; then
  echo "Container source label is missing or incorrect." >&2
  exit 1
fi
if [[ "${image_license}" != "ISC" ]]; then
  echo "Container license label is missing or incorrect." >&2
  exit 1
fi

set +e
docker run --rm "${image_name}" \
  >"${verification_tmp_dir}/missing-config.stdout" \
  2>"${verification_tmp_dir}/missing-config.stderr"
missing_config_exit_code=$?
set -e

if [[ "${missing_config_exit_code}" -ne 1 ]]; then
  echo "Expected missing configuration to exit 1, received ${missing_config_exit_code}" >&2
  exit 1
fi

grep -q "SWITCHBOT_TOKEN" "${verification_tmp_dir}/missing-config.stderr"
grep -q "SWITCHBOT_SECRET" "${verification_tmp_dir}/missing-config.stderr"

docker run \
  --detach \
  --rm \
  --name "${container_name}" \
  --publish "127.0.0.1::8787" \
  --env SWITCHBOT_TOKEN=test-token \
  --env SWITCHBOT_SECRET=test-secret \
  --env MCP_TRANSPORT=http \
  --env MCP_SERVER_API_KEY=test-api-key \
  --env MCP_HTTP_HOST=0.0.0.0 \
  "${image_name}" >/dev/null

published_address="$(docker port "${container_name}" 8787/tcp)"
published_port="${published_address##*:}"
mcp_url="http://127.0.0.1:${published_port}/mcp"
unauthorized_http_code=000

for _attempt in {1..50}; do
  unauthorized_http_code="$(
    curl \
      --silent \
      --output "${verification_tmp_dir}/unauthorized.json" \
      --write-out "%{http_code}" \
      --request POST \
      --header "Content-Type: application/json" \
      --data '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"container-smoke","version":"1.0.0"}}}' \
      "${mcp_url}" || true
  )"

  if [[ "${unauthorized_http_code}" == "401" ]]; then
    break
  fi
  sleep 0.1
done

if [[ "${unauthorized_http_code}" != "401" ]]; then
  docker logs "${container_name}" >&2
  echo "Container did not reach the authenticated HTTP boundary" >&2
  exit 1
fi

authorized_http_code="$(
  curl \
    --silent \
    --show-error \
    --output "${verification_tmp_dir}/authorized.json" \
    --write-out "%{http_code}" \
    --request POST \
    --header "Authorization: Bearer test-api-key" \
    --header "Content-Type: application/json" \
    --header "Accept: application/json, text/event-stream" \
    --data '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"container-smoke","version":"1.0.0"}}}' \
    "${mcp_url}"
)"

if [[ "${authorized_http_code}" != "200" ]]; then
  echo "Expected authenticated initialize to return 200, received ${authorized_http_code}" >&2
  exit 1
fi

node - "${verification_tmp_dir}/authorized.json" <<'NODE'
const fs = require("node:fs");
const packageJson = require("./package.json");
const response = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));

if (response.result?.serverInfo?.name !== "switchbot-mcp") {
  throw new Error("Container returned unexpected MCP server name");
}
if (response.result?.serverInfo?.version !== packageJson.version) {
  throw new Error("Container MCP version differs from package.json");
}
NODE

container_user="$(docker inspect "${container_name}" --format "{{.Config.User}}")"
if [[ "${container_user}" != "node" ]]; then
  echo "Expected non-root node user, received ${container_user}" >&2
  exit 1
fi

printf '{"missingConfigExit":%s,"unauthorizedStatus":%s,"authorizedStatus":%s,"containerUser":"%s","policyFiles":true,"ociLabels":true}\n' \
  "${missing_config_exit_code}" \
  "${unauthorized_http_code}" \
  "${authorized_http_code}" \
  "${container_user}"
