#!/usr/bin/env bash

set -euo pipefail

platform="$1"
shift

case "$platform" in
  node)
    vitest run integrations/node "$@"
    ;;
  bun)
    bun test integrations/bun "$@"
    ;;
  deno)
    DENO_NO_PACKAGE_JSON=1 deno test -P -c integrations/deno/deno.json integrations/deno "$@"
    ;;
  *)
    echo "Usage: test-integrations.sh <node|bun|deno> [args...]" >&2
    exit 1
    ;;
esac