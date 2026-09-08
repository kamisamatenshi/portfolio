#!/usr/bin/env bash
set -euo pipefail

if [[ "${EUID}" -ne 0 ]]; then
  echo "Run this script as root."
  exit 1
fi

DOMAIN="${1:-}"
if [[ -z "$DOMAIN" ]]; then
  echo "Usage: sudo bash infrastructure/bootstrap-vps.sh your-domain.com"
  exit 1
fi

REPO_URL="https://github.com/kamisamatenshi/portfolio.git"
BASE_DIR="/var/www/portfolio"
REPO_DIR="$BASE_DIR/repo"
WEB_ROOT="$BASE_DIR/current"

apt-get update
DEBIAN_FRONTEND=noninteractive apt-get install -y nginx git curl rsync ca-certificates certbot python3-certbot-nginx

if ! command -v node >/dev/null 2>&1 || [[ "$(node -p 'process.versions.node.split(`.`)[0]' 2>/dev/null || echo 0)" -lt 20 ]]; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  DEBIAN_FRONTEND=noninteractive apt-get install -y nodejs
fi

if ! id portfolio >/dev/null 2>&1; then
  useradd --system --create-home --home-dir "$BASE_DIR" --shell /usr/sbin/nologin portfolio
fi

mkdir -p "$BASE_DIR" "$WEB_ROOT"
chown -R portfolio:portfolio "$BASE_DIR"

if [[ ! -d "$REPO_DIR/.git" ]]; then
  sudo -u portfolio git clone "$REPO_URL" "$REPO_DIR"
fi

sudo -u portfolio git -C "$REPO_DIR" fetch origin main
sudo -u portfolio git -C "$REPO_DIR" reset --hard origin/main
chmod +x "$REPO_DIR/scripts/deploy.sh"

cp "$REPO_DIR/infrastructure/systemd/portfolio-deploy.service" /etc/systemd/system/portfolio-deploy.service
cp "$REPO_DIR/infrastructure/systemd/portfolio-deploy.timer" /etc/systemd/system/portfolio-deploy.timer

sed "s/__DOMAIN__/$DOMAIN/g" "$REPO_DIR/infrastructure/nginx/portfolio.conf.template" > /etc/nginx/sites-available/portfolio
ln -sfn /etc/nginx/sites-available/portfolio /etc/nginx/sites-enabled/portfolio
rm -f /etc/nginx/sites-enabled/default

nginx -t
systemctl reload nginx
systemctl daemon-reload
systemctl enable --now portfolio-deploy.timer

cat <<EOF

Portfolio VPS bootstrap complete.

Domain configured in Nginx: $DOMAIN
Repository: $REPO_URL
Repository checkout: $REPO_DIR
Web root: $WEB_ROOT

NEXT:
1. Point DNS A records for the domain to this VPS public IPv4 address.
2. Wait for DNS to resolve.
3. Run: certbot --nginx -d $DOMAIN -d www.$DOMAIN
4. Run: systemctl start portfolio-deploy.service
5. Check: systemctl status portfolio-deploy.timer --no-pager
6. Check: curl -I http://$DOMAIN/healthz

EOF
