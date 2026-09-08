# Portfolio

Personal portfolio website for Chung Man Tse.

This repository is the durable source of truth for the website, portfolio content, project case studies, visual assets, deployment configuration, and infrastructure notes.

## Stack

- Astro
- TypeScript
- Custom CSS and lightweight client-side motion
- Static production output served by Nginx

## Local development

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
```

The generated site is written to `dist/`.

## Structure

```text
src/data/projects.ts          Project content and status
src/pages/index.astro         Homepage
src/pages/work/[slug].astro   Generated project case studies
src/styles/global.css         Visual system and layout
src/scripts/site.ts           Scroll/pointer motion
public/images/projects/       Real project imagery
infrastructure/               VPS, Nginx and systemd configuration
docs/                         Durable design/deployment source of truth
```

## Workflow

Substantive changes follow:

1. GitHub Issue
2. Issue-linked branch
3. Pull Request
4. Review and merge into `main`
5. Production deployment from `main`

Avoid routine manual edits on the production VPS.

## Design direction

The portfolio is intentionally editorial, project-first and motion-rich. It should not look like a generic AI-generated card-grid template. `zainabkabira.com` is used as a reference for ambition, storytelling and interaction polish, not as a visual identity to copy.

See `docs/DESIGN_SYSTEM.md` and `docs/SOURCE_OF_TRUTH.md` for the governing project decisions.

## Production

Target hostname: `portfolio.tsecm.com`.

Production activation is tracked separately from the visual rebuild so design work can continue without making manual production changes.
