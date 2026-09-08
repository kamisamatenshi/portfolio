# Portfolio Source of Truth

## Purpose
This repository is the durable source of truth for Chung Man Tse's personal portfolio website: source code, content, project case studies, assets, deployment configuration, and infrastructure notes.

## Product direction
The site should feel authored and personal rather than template-driven or AI-generated.

Reference direction: https://zainabkabira.com/

Use the reference for principles, not duplication. The portfolio should have its own visual identity and copy.

### Visual principles
- Editorial, typography-led presentation.
- Strong hierarchy and generous whitespace.
- Fewer generic cards and pills.
- Projects presented as stories/case studies rather than equal-sized feature tiles.
- Intentional motion and interaction, used to support hierarchy rather than decorate every element.
- Personal voice and evidence of real work.
- Large project imagery and screenshots.
- Mix of engineering, product, client, research, and business work.
- Responsive and accessible.

### Current portfolio projects
Initial portfolio set:
- OPTCG Tracker
- KOI Studio
- Koh Seng B2B
- SmartDeskOS
- HomeMah
- HealthMate

Planned/possible additions as they mature:
- RagASTAR
- DigiTutor
- Probability Study Webapp
- Interactive 3D Product Configurator

## Technical direction
Preferred architecture for the rebuild:
- Astro + TypeScript for a fast, mostly-static portfolio.
- Custom CSS/design tokens rather than a generic component template.
- Small interactive scripts only where useful.
- Nginx on Ubuntu VPS.
- HTTPS via Let's Encrypt/Certbot.
- Production source: `main` branch.
- VPS-side deployment pulls and builds `main` automatically after merges.

The architecture may be revised by a later issue/PR if implementation evidence shows another stack is better.

## Repository workflow
After the initial repository bootstrap, substantive changes use:
1. GitHub Issue
2. Issue-linked branch
3. Pull Request
4. Review
5. Merge to `main`
6. Production deployment from `main`

Do not manually overwrite production files as the normal workflow.

## Production identity
- Production hostname: `portfolio.tsecm.com`
- DNS/domain management: Hostinger
- Target server: the existing shared Hostinger VPS already used for public applications, including KOI Studio and OPTCG
- Production branch: `main`

Do not commit the VPS public IP as a requirement for the application itself. Record non-secret host inventory only when needed for operations.

## Shared VPS safety rules
The portfolio shares a server with existing live applications. Portfolio infrastructure must therefore be additive and isolated:
- do not replace the system-wide Node.js runtime;
- do not stop or reconfigure KOI Studio, OPTCG or unrelated services;
- do not remove unrelated enabled Nginx sites;
- do not modify unrelated DNS records;
- validate Nginx before reload;
- keep portfolio files under `/var/www/portfolio`.

The portfolio runtime is Node.js 22 installed through NVM under `/var/www/portfolio/.nvm` for the dedicated `portfolio` system user. The deploy service exports that NVM location and the deploy script explicitly activates Node 22 before building. Existing applications can therefore continue using their own current runtimes.

## Infrastructure model
Target paths on the VPS:
- Repository checkout: `/var/www/portfolio/repo`
- Production web root: `/var/www/portfolio/current`
- Portfolio Node/NVM runtime: `/var/www/portfolio/.nvm`
- Deploy script: `/var/www/portfolio/repo/scripts/deploy.sh`

Deployment is intended to run through a systemd timer. Because the repository is public, the VPS can pull over HTTPS without storing a GitHub credential.

The intended production flow is:

Issue -> branch -> PR -> merge to `main` -> VPS detects new commit -> install/build -> atomically replace the production web root.

## Production activation still required
- Resolve the selected Hostinger VPS public IPv4 from the server itself or Hostinger panel.
- Point `portfolio.tsecm.com` to that IPv4 without changing unrelated DNS records.
- Run the VPS bootstrap for `portfolio.tsecm.com`.
- Verify Nginx, systemd deployment timer and HTTPS certificate.
- Confirm the production `/healthz` endpoint and current homepage.
- Confirm the existing KOI Studio and OPTCG sites remain healthy after activation.

Do not store passwords, private keys, tokens, DNS API credentials, or other secrets in this repository.

## Reviewed production host profile

Read-only inventory completed 2026-09-09 against the selected Hostinger VPS.

- Public IPv4: `187.127.219.53`
- Operating system: Ubuntu 24.04 LTS
- Capacity: 2 vCPU, 8 GB RAM, 96 GB root filesystem
- System Node.js: Node 18.19.1 / npm 9.2.0 (must remain untouched)
- Nginx: 1.24.0; configuration validated successfully before portfolio activation
- Existing public applications: KOI Studio and OPTCG, both served through the existing Nginx configuration
- Existing certificate automation: `certbot.timer` and `snap.certbot.renew.timer` are enabled and active

The portfolio site does not yet exist on this host: there is no `/var/www/portfolio` tree, `portfolio` system user, Nginx virtual host, or portfolio deployment unit. Bootstrap therefore remains an additive change. Its prerequisite check intentionally skips APT when required packages are already installed, avoiding a shared-service package upgrade during activation.

## Content rule
Portfolio text must distinguish between shipped/implemented functionality and planned/prototype functionality. Do not present unimplemented features as live production features.
