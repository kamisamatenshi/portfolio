#!/usr/bin/env bash
set -euo pipefail

if [[ "${EUID}" -ne 0 ]]; then
  echo "Run this script as root."
  exit 1
fi

DOMAIN="${1:-}"
if [[ -z "$DOMAIN" ]]; then
  echo "Usage: sudo bash infrastructure/bootstrap-vps.sh portfolio.tsecm.com"
  exit 1
fi

REPO_URL="https://github.com/kamisamatenshi/portfolio.git"
BASE_DIR="/var/www/portfolio"
REPO_DIR="$BASE_DIR/repo"
WEB_ROOT="$BASE_DIR/current"
STATE_DIR="$BASE_DIR/state"
NVM_DIR="$BASE_DIR/.nvm"
NVM_VERSION="v0.40.3"
NODE_MAJOR="22"
NGINX_SITE="/etc/nginx/sites-available/portfolio"
ESCAPED_DOMAIN="${DOMAIN//./\.}"

# This host can already run unrelated production applications. Installing a
# package that is already present may also upgrade it, so only invoke APT for
# prerequisites that are genuinely absent. In particular, do not upgrade an
# existing Nginx installation as a side effect of adding this site.
required_packages=(
  nginx
  git
  curl
  rsync
  ca-certificates
  certbot
  python3-certbot-nginx
  build-essential
)
missing_packages=()

for package in "${required_packages[@]}"; do
  if ! dpkg-query -W -f='${db:Status-Status}' "$package" 2>/dev/null | grep -qx 'installed'; then
    missing_packages+=("$package")
  fi
done

if (( ${#missing_packages[@]} > 0 )); then
  apt-get update
  DEBIAN_FRONTEND=noninteractive apt-get install -y --no-upgrade "${missing_packages[@]}"
else
  echo "All portfolio bootstrap prerequisites are already installed; skipping APT."
fi

if ! id portfolio >/dev/null 2>&1; then
  useradd --system --create-home --home-dir "$BASE_DIR" --shell /bin/bash portfolio
else
  usermod --home "$BASE_DIR" --shell /bin/bash portfolio
fi

mkdir -p "$BASE_DIR" "$WEB_ROOT" "$STATE_DIR"
chown -R portfolio:portfolio "$BASE_DIR"
# Nginx needs traversal, but not write access, to serve the static release.
chmod 711 "$BASE_DIR"

# Install an isolated Node.js runtime for this portfolio only.
# Do NOT replace /usr/bin/node because other applications on this VPS use it.
if [[ ! -s "$NVM_DIR/nvm.sh" ]]; then
  sudo -u portfolio env HOME="$BASE_DIR" NVM_DIR="$NVM_DIR" bash -c \
    "curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/${NVM_VERSION}/install.sh | bash"
fi

sudo -u portfolio env HOME="$BASE_DIR" NVM_DIR="$NVM_DIR" bash -lc \
  'source "$NVM_DIR/nvm.sh" && nvm install 22 && nvm alias default 22 && nvm use 22 >/dev/null && node --version && npm --version'

if [[ ! -d "$REPO_DIR/.git" ]]; then
  sudo -u portfolio git clone "$REPO_URL" "$REPO_DIR"
fi

sudo -u portfolio git -C "$REPO_DIR" fetch origin main
sudo -u portfolio git -C "$REPO_DIR" reset --hard origin/main

cp "$REPO_DIR/infrastructure/systemd/portfolio-deploy.service" /etc/systemd/system/portfolio-deploy.service
cp "$REPO_DIR/infrastructure/systemd/portfolio-deploy.timer" /etc/systemd/system/portfolio-deploy.timer

# Refuse to create a duplicate Nginx hostname in another enabled site.
if grep -RqsE --exclude=portfolio "server_name[^;]*${ESCAPED_DOMAIN}" /etc/nginx/sites-enabled; then
  echo "An existing enabled Nginx site already contains server_name ${DOMAIN}."
  echo "No Nginx changes were made. Review the existing configuration first."
  exit 1
fi

if [[ -f "$NGINX_SITE" ]]; then
  cp "$NGINX_SITE" "${NGINX_SITE}.bak.$(date -u +%Y%m%dT%H%M%SZ)"
fi

sed "s/__DOMAIN__/$DOMAIN/g" "$REPO_DIR/infrastructure/nginx/portfolio.conf.template" > "$NGINX_SITE"
ln -sfn "$NGINX_SITE" /etc/nginx/sites-enabled/portfolio

# Deliberately leave all unrelated Nginx sites and the default site untouched.
nginx -t
systemctl reload nginx
systemctl daemon-reload
systemctl enable --now portfolio-deploy.timer

PUBLIC_IPV4="$(curl -4fsS --max-time 8 https://api.ipify.org 2>/dev/null || true)"

cat <<EOF

Portfolio VPS bootstrap complete.

Domain configured in Nginx: $DOMAIN
Repository: $REPO_URL
Repository checkout: $REPO_DIR
Web root: $WEB_ROOT
Portfolio Node runtime: isolated under $NVM_DIR (Node major $NODE_MAJOR)
Public IPv4 detected: ${PUBLIC_IPV4:-unable to detect automatically}

NEXT:
1. In Hostinger DNS, set only the A record portfolio to this VPS public IPv4 address.
2. Wait for $DOMAIN to resolve to this VPS.
3. Run: certbot --nginx -d $DOMAIN
4. Run: systemctl start portfolio-deploy.service
5. Check: systemctl status portfolio-deploy.timer --no-pager
6. Check: curl -i https://$DOMAIN/healthz

EOF
