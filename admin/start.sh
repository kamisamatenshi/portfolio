#!/usr/bin/env bash
set -euo pipefail

export NVM_DIR="${NVM_DIR:-/var/www/portfolio/.nvm}"

# shellcheck disable=SC1090
source "$NVM_DIR/nvm.sh"
nvm use 22 >/dev/null

exec node /var/www/portfolio/repo/admin/server.mjs
