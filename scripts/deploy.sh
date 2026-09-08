#!/usr/bin/env bash
set -euo pipefail

REPO_URL="${PORTFOLIO_REPO_URL:-https://github.com/kamisamatenshi/portfolio.git}"
BRANCH="${PORTFOLIO_BRANCH:-main}"
BASE_DIR="${PORTFOLIO_BASE_DIR:-/var/www/portfolio}"
REPO_DIR="$BASE_DIR/repo"
WEB_ROOT="$BASE_DIR/current"
STATE_DIR="$BASE_DIR/state"
NVM_DIR="${NVM_DIR:-$BASE_DIR/.nvm}"

export HOME="${HOME:-$BASE_DIR}"
export NVM_DIR

if [[ ! -s "$NVM_DIR/nvm.sh" ]]; then
  echo "Portfolio Node runtime missing: $NVM_DIR/nvm.sh"
  echo "Run infrastructure/bootstrap-vps.sh first."
  exit 1
fi

# shellcheck disable=SC1090
source "$NVM_DIR/nvm.sh"
nvm use 22 >/dev/null

mkdir -p "$BASE_DIR" "$WEB_ROOT" "$STATE_DIR"

if [[ ! -d "$REPO_DIR/.git" ]]; then
  git clone --branch "$BRANCH" "$REPO_URL" "$REPO_DIR"
fi

cd "$REPO_DIR"
git fetch origin "$BRANCH"
REMOTE_SHA="$(git rev-parse "origin/$BRANCH")"
DEPLOYED_SHA="$(cat "$STATE_DIR/deployed-sha" 2>/dev/null || true)"

if [[ "$REMOTE_SHA" == "$DEPLOYED_SHA" ]]; then
  echo "Portfolio already deployed at $REMOTE_SHA"
  exit 0
fi

git reset --hard "origin/$BRANCH"

if [[ ! -f package.json ]]; then
  echo "No package.json yet; repository infrastructure is ready but there is no buildable portfolio app."
  exit 0
fi

if [[ -f package-lock.json ]]; then
  npm ci --no-audit --no-fund
else
  echo "package-lock.json not found; using npm install until the lockfile is committed."
  npm install --no-audit --no-fund
fi

npm run build

if [[ ! -d dist ]]; then
  echo "Build completed but dist/ was not created."
  exit 1
fi

TMP_DIR="$BASE_DIR/.next-release"
rm -rf "$TMP_DIR"
mkdir -p "$TMP_DIR"
cp -a dist/. "$TMP_DIR/"

rm -rf "$WEB_ROOT.old"
if [[ -d "$WEB_ROOT" ]]; then
  mv "$WEB_ROOT" "$WEB_ROOT.old"
fi
mv "$TMP_DIR" "$WEB_ROOT"
rm -rf "$WEB_ROOT.old"

printf '%s\n' "$REMOTE_SHA" > "$STATE_DIR/deployed-sha"
printf '%s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ) $REMOTE_SHA" >> "$STATE_DIR/deploy-history.log"

echo "Portfolio deployed: $REMOTE_SHA"
