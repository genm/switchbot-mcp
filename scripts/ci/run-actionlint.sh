#!/usr/bin/env bash
set -euo pipefail

readonly actionlint_version="1.7.12"
readonly temporary_directory="$(mktemp -d)"
readonly archive="${temporary_directory}/actionlint.tar.gz"

case "$(uname -s)-$(uname -m)" in
  Darwin-arm64)
    readonly platform="darwin_arm64"
    readonly archive_sha256="aba9ced2dee8d27fecca3dc7feb1a7f9a52caefa1eb46f3271ea66b6e0e6953f"
    ;;
  Darwin-x86_64)
    readonly platform="darwin_amd64"
    readonly archive_sha256="5b44c3bc2255115c9b69e30efc0fecdf498fdb63c5d58e17084fd5f16324c644"
    ;;
  Linux-aarch64 | Linux-arm64)
    readonly platform="linux_arm64"
    readonly archive_sha256="325e971b6ba9bfa504672e29be93c24981eeb1c07576d730e9f7c8805afff0c6"
    ;;
  Linux-x86_64)
    readonly platform="linux_amd64"
    readonly archive_sha256="8aca8db96f1b94770f1b0d72b6dddcb1ebb8123cb3712530b08cc387b349a3d8"
    ;;
  *)
    echo "Unsupported actionlint platform: $(uname -s)-$(uname -m)" >&2
    exit 1
    ;;
esac

cleanup() {
  rm -rf -- "${temporary_directory}"
}
trap cleanup EXIT

curl \
  --fail \
  --location \
  --proto '=https' \
  --retry 3 \
  --retry-all-errors \
  --show-error \
  --silent \
  --tlsv1.2 \
  --output "${archive}" \
  "https://github.com/rhysd/actionlint/releases/download/v${actionlint_version}/actionlint_${actionlint_version}_${platform}.tar.gz"

if command -v sha256sum >/dev/null 2>&1 && [[ "$(uname -s)" != "Darwin" ]]; then
  printf '%s  %s\n' "${archive_sha256}" "${archive}" | sha256sum --check
else
  printf '%s  %s\n' "${archive_sha256}" "${archive}" | shasum -a 256 --check
fi
tar -xzf "${archive}" -C "${temporary_directory}" actionlint
"${temporary_directory}/actionlint" "$@"
