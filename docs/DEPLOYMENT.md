# Portfolio Deployment

## Production model

- Source of truth: `kamisamatenshi/portfolio`
- Production hostname: `portfolio.tsecm.com`
- DNS/domain management: Hostinger
- Target server: existing shared Hostinger VPS used for public applications
- Production branch: `main`
- VPS web server: Nginx
- Build runtime: isolated Node.js 22 managed by NVM under `/var/www/portfolio/.nvm`
- TLS: Let's Encrypt via Certbot
- Deploy mechanism: VPS-side systemd timer checks `main` every two minutes and deploys only when the commit SHA changes.

The server already hosts other applications, including KOI Studio and OPTCG. Portfolio setup must not replace the system-wide Node.js runtime, stop unrelated services, remove other Nginx sites, or modify unrelated DNS records.

Because the repository is public, the VPS can pull it over HTTPS without storing a GitHub deploy credential.

## Remaining activation input

The server-specific value that still needs to be read from the selected VPS/Hostinger panel is its public IPv4 address. Do not guess it. The bootstrap script also attempts to print the current public IPv4 for convenience.

## DNS

Create or update only the portfolio subdomain record:

- record type: `A`
- host/name: `portfolio`
- value: selected Hostinger VPS public IPv4

Do not modify mail, root-domain, OPTCG, KOI Studio, or other unrelated records.

## Shared-VPS runtime isolation

The portfolio does not depend on `/usr/bin/node`. The bootstrap script creates a dedicated `portfolio` system user and installs NVM plus Node.js 22 inside `/var/www/portfolio/.nvm`.

The systemd deployment service exports:

```text
HOME=/var/www/portfolio
NVM_DIR=/var/www/portfolio/.nvm
```

The deploy script sources that NVM installation and explicitly activates Node 22 before installing or building dependencies. This keeps existing applications on their current runtime unless they are changed by their own deployment process.

## VPS bootstrap

After the latest infrastructure changes are merged to `main`, obtain a checkout of the repository on the VPS and run as root:

```bash
sudo bash infrastructure/bootstrap-vps.sh portfolio.tsecm.com
```

The bootstrap script:
- installs only missing prerequisites (Nginx, Git, rsync, Certbot, build tools and supporting packages), and skips APT entirely when they are already present;
- creates a dedicated `portfolio` system user;
- installs an isolated NVM + Node.js 22 runtime for that user;
- clones the public GitHub repository into `/var/www/portfolio/repo`;
- refuses to overwrite another enabled Nginx site that already owns `portfolio.tsecm.com`;
- backs up an existing portfolio Nginx file before replacing it;
- leaves unrelated Nginx sites and the default site untouched;
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
curl -i https://portfolio.tsecm.com/healthz
```

Expected health endpoint: HTTP 200 with body `ok`.

Also verify that the existing applications remain available after Nginx reload and portfolio deployment.

## Deployment behavior

Normal production updates are:

Issue -> branch -> PR -> review -> merge to `main` -> VPS detects new commit -> build -> replace production `current` directory.

The deploy script records the last deployed SHA under `/var/www/portfolio/state/deployed-sha` and appends deployment history to `/var/www/portfolio/state/deploy-history.log`.

If `package-lock.json` is present, deployment uses `npm ci`. Until the first lockfile is committed, it falls back to `npm install` rather than failing the initial bootstrap.

## Rollback

Normal rollback should be performed in GitHub by reverting the problematic merge/commit through a new Issue/PR. Once the revert reaches `main`, the VPS deploy timer will pick it up automatically.

For an urgent outage, the previous known-good commit may be checked out and built manually on the VPS, but the GitHub history must then be reconciled so production and `main` do not remain divergent.

## Security

Do not commit passwords, SSH private keys, GitHub tokens, DNS API tokens, VPS credentials, or control-panel exports containing secrets to this repository.
