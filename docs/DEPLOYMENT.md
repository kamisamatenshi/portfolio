# Portfolio Deployment

## Production model

- Source of truth: `kamisamatenshi/portfolio`
- Production hostname: `portfolio.tsecm.com`
- DNS/domain management: Hostinger
- Target server: existing Hostinger VPS used for public applications
- Production branch: `main`
- VPS web server: Nginx
- Build runtime: Node.js 22
- TLS: Let's Encrypt via Certbot
- Deploy mechanism: VPS-side systemd timer checks `main` every two minutes and deploys only when the commit SHA changes.

This avoids storing a GitHub deploy credential on the VPS because the repository is public.

## Remaining activation input

The only server-specific value that still needs to be read from the selected VPS/Hostinger panel is its public IPv4 address. Do not guess it and do not change unrelated DNS records.

## DNS

Create or update only the portfolio subdomain record:

- record type: `A`
- host/name: `portfolio`
- value: selected Hostinger VPS public IPv4

Do not modify mail, root-domain, OPTCG, KOI Studio, or other unrelated records.

## VPS bootstrap

Once `portfolio.tsecm.com` resolves to the selected VPS, run from the checked-out repository as root:

```bash
sudo bash infrastructure/bootstrap-vps.sh portfolio.tsecm.com
```

The bootstrap script:
- installs Nginx, Git, rsync, Certbot, and Node.js 22 when required;
- creates a restricted `portfolio` system user;
- clones the public GitHub repository into `/var/www/portfolio/repo`;
- configures Nginx for `portfolio.tsecm.com`;
- installs the deployment systemd service/timer;
- enables automatic update checks.

## HTTPS

Request the certificate only after DNS resolves to the VPS:

```bash
sudo certbot --nginx -d portfolio.tsecm.com
```

`www.portfolio.tsecm.com` is intentionally not required.

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
curl -I https://portfolio.tsecm.com/healthz
```

Expected health endpoint: HTTP 200 with body `ok`.

## Deployment behavior

Normal production updates are:

Issue -> branch -> PR -> review -> merge to `main` -> VPS detects new commit -> build -> replace production `current` directory.

The deploy script records the last deployed SHA under `/var/www/portfolio/state/deployed-sha` and appends deployment history to `/var/www/portfolio/state/deploy-history.log`.

## Rollback

Normal rollback should be performed in GitHub by reverting the problematic merge/commit through a new Issue/PR. Once the revert reaches `main`, the VPS deploy timer will pick it up automatically.

For an urgent outage, the previous known-good commit may be checked out and built manually on the VPS, but the GitHub history must then be reconciled so production and `main` do not remain divergent.

## Security

Do not commit passwords, SSH private keys, GitHub tokens, DNS API tokens, VPS credentials, or control-panel exports containing secrets to this repository.
