#!/usr/bin/env bash
set -euo pipefail

if [[ "${EUID}" -ne 0 ]]; then
  echo "Run this script as root."
  exit 1
fi

BASE_DIR="/var/www/portfolio"
REPO_DIR="$BASE_DIR/repo"
ENV_FILE="/etc/portfolio-admin.env"
NGINX_SITE="/etc/nginx/sites-available/portfolio"
NGINX_SNIPPET="/etc/nginx/snippets/portfolio-admincontrol.conf"
UPLOAD_DIR="$BASE_DIR/state/uploads"
INCLUDE_LINE="    include /etc/nginx/snippets/portfolio-admincontrol.conf;"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE. Create the root-owned environment file first."
  exit 1
fi

if ! grep -q '^PORTFOLIO_ADMIN_PASSWORD_HASH=scrypt\$' "$ENV_FILE" || ! grep -q '^PORTFOLIO_ADMIN_SESSION_SECRET=.' "$ENV_FILE"; then
  echo "$ENV_FILE must contain a scrypt password hash and a session secret."
  exit 1
fi

if [[ ! -f "$NGINX_SITE" ]]; then
  echo "Missing $NGINX_SITE. The portfolio Nginx site has not been bootstrapped."
  exit 1
fi

install -D -o root -g root -m 0644 "$REPO_DIR/infrastructure/nginx/portfolio-admincontrol.conf" "$NGINX_SNIPPET"
install -d -o portfolio -g www-data -m 2750 "$UPLOAD_DIR"
install -o root -g root -m 0644 "$REPO_DIR/infrastructure/systemd/portfolio-admin.service" /etc/systemd/system/portfolio-admin.service
chmod 0600 "$ENV_FILE"

if ! grep -Fqx "$INCLUDE_LINE" "$NGINX_SITE"; then
  sed -i "/^[[:space:]]*index index\.html;$/a\\$INCLUDE_LINE" "$NGINX_SITE"
fi

nginx -t
systemctl daemon-reload
systemctl reload nginx
systemctl enable --now portfolio-admin.service
systemctl restart portfolio-admin.service

echo "Portfolio admin control enabled."
