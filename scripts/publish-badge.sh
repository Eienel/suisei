#!/usr/bin/env bash
#
# Publish the Suisei badge Move package to a Sui network and print the
# package id to paste into VITE_BADGE_PACKAGE_ID.
#
# Prereqs:
#   - Sui CLI installed:  https://docs.sui.io/guides/developer/getting-started/sui-install
#   - An active address with gas:  sui client active-address
#                                   sui client faucet   (testnet/devnet)
#
# Usage:
#   ./scripts/publish-badge.sh                 # publish to current `sui client` env
#   ./scripts/publish-badge.sh --gas-budget 200000000
#
# After it prints "Published package: 0x...", set that value as
# VITE_BADGE_PACKAGE_ID in .env (local) and in the Vercel project env,
# then redeploy. Every quest's badge mint becomes a real on-chain tx.

set -euo pipefail

PKG_DIR="$(cd "$(dirname "$0")/.." && pwd)/move/suisei_badge"
GAS_BUDGET="100000000"

while [ $# -gt 0 ]; do
  case "$1" in
    --gas-budget) GAS_BUDGET="$2"; shift 2 ;;
    *) echo "unknown arg: $1" >&2; exit 1 ;;
  esac
done

if ! command -v sui >/dev/null 2>&1; then
  echo "error: sui CLI not found. Install it first:" >&2
  echo "  https://docs.sui.io/guides/developer/getting-started/sui-install" >&2
  exit 1
fi

echo "Active env:     $(sui client active-env 2>/dev/null || echo '?')"
echo "Active address: $(sui client active-address 2>/dev/null || echo '?')"
echo "Package:        $PKG_DIR"
echo

# --json keeps the output machine-parseable; we extract the published
# package id from objectChanges.
OUT="$(sui client publish "$PKG_DIR" --gas-budget "$GAS_BUDGET" --json)"

PACKAGE_ID="$(echo "$OUT" | node -e '
  let s = "";
  process.stdin.on("data", d => s += d);
  process.stdin.on("end", () => {
    const r = JSON.parse(s);
    const pub = (r.objectChanges || []).find(c => c.type === "published");
    if (!pub) { console.error("no published package in objectChanges"); process.exit(1); }
    console.log(pub.packageId);
  });
')"

echo
echo "Published package: $PACKAGE_ID"
echo
echo "Next:"
echo "  1. echo 'VITE_BADGE_PACKAGE_ID=$PACKAGE_ID' >> .env"
echo "  2. Add the same value to the Vercel project env, then redeploy."
