# Portfolio Deployment

## Production model

- Source of truth: `kamisamatenshi/portfolio`
- Production branch: `main`
- VPS web server: Nginx
- Build runtime: Node.js 22
- TLS: Let's Encrypt via Certbot
- Deploy mechanism: VPS-side systemd timer checks `main` every two minutes and deploys only when the commit SHA changes.

This avoids storing a GitHub deploy credential on the VPS because the repository is public.

## Required inputs before production activation

1. Portfolio domain/subdomain.
2. Public IPv4 address of the selected VPS.
3. DNS provider/control panel.

## DNS

For an apex domain such as `example.com`:

- `A` record: host `@` -> VPS public IPv4
- `CNAME` record: host `www` -> `example.com`

If the portfolio is hosted on a subdomain, use the corresponding `A` record for that subdomain instead. Do not change unrelated DNS records.

## VPS bootstrap

After Issue #1 is merged to `main`, clone the repository or download it to the target VPS, then run:

```bash
sudo bash infrastructure/bootstrap-vps.sh example.com
```

The bootstrap script:
- installs Nginx, Git, rsync, Certbot, and Node.js 22 when required;
- creates a restricted `portfolio` system user;
- clones the public GitHub repository into `/var/www/portfolio/repo`;
- configures Nginx;
- installs the deployment systemd service/timer;
- enables automatic update checks.

## HTTPS

Only request the certificate after DNS resolves to the VPS:

```bash
sudo certbot --nginx -d example.com -d www.example.com
```

Verify renewal:

```bash
sudo certbot renew --dry-run
```

## Verification

```bash
systemctl status portfolio-deploy.timer --no-pager
systemctl start portfolio-deploy.service
journalctl -u portfolio-deploy.service -n 100 --no-pager
nginx -t
curl -I https://example.com/healthz
```

## Deployment behavior

Normal production updates are:

Issue -> branch -> PR -> review -> merge to `main` -> VPS detects new commit -> build -> replace production `current` directory.

The deploy script records the last deployed SHA under `/var/www/portfolio/state/deployed-sha` and appends deployment history to `/var/www/portfolio/state/deploy-history.log`.

## Rollback

Normal rollback should be performed in GitHub by reverting the problematic merge/commit through a new Issue/PR. Once the revert reaches `main`, the VPS deploy timer will pick it up automatically.

For an urgent outage, the previous known-good commit may be checked out and built manually on the VPS, but the GitHub history must then be reconciled so production and `main` do not remain divergent.

## Security

Do not commit passwords, SSH private keys, GitHub tokens, DNS API tokens, or VPS credentials to this repository.
