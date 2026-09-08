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
- Target server: the existing Hostinger VPS already used for public applications, including the OPTCG deployment
- Production branch: `main`

Do not commit the VPS public IP as a requirement for the application itself. Record non-secret host inventory only when needed for operations.

## Infrastructure model
Target paths on the VPS:
- Repository checkout: `/var/www/portfolio/repo`
- Production web root: `/var/www/portfolio/current`
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

Do not store passwords, private keys, tokens, DNS API credentials, or other secrets in this repository.

## Content rule
Portfolio text must distinguish between shipped/implemented functionality and planned/prototype functionality. Do not present unimplemented features as live production features.
