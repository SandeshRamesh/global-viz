# Claude Code Repository Reference (Production Readiness)

## Purpose

This document defines how this repository should stay organized while features are still evolving, so production deployment can be added cleanly without rework.

## Repository Lanes

### Product Code
- `src/` — frontend app code only.
- `api/` — backend API code only.
- `public/` — static assets consumed by frontend.

### Operational Lanes
- `deploy/` — all deployment-related assets.
- `.github/workflows/` — CI/CD pipelines.
- `scripts/` — repeatable automation scripts.

### Documentation Lanes
- `docs/architecture/` — architecture and engineering decisions.
- `docs/runbooks/` — operational runbooks (incidents, recovery, release).
- `docs/plans/` — plans and RFC-style implementation outlines.
- `docs/reports/` — progress/status reports, postmortems, audits.
- `docs/phases/` — phase-by-phase historical implementation notes.

## What Goes Where

### New feature implementation plan
Put in `docs/plans/`.

### Feature implementation status/progress
Put in `docs/reports/`.

### One-off analysis scripts
Put in `scripts/dev/`.

### Scripts that CI should execute
Put in `scripts/ci/`.

### Deployment manifests, Dockerfiles, ingress
Put in `deploy/docker/` and `deploy/nginx/`.

### Environment variable templates
Put in `deploy/env/` (non-secret examples only).

## Current Canonical Paths

- Roadmap: `docs/plans/roadmap.md`
- Phase 4 plan: `docs/plans/phase4-cinematic-plan.md`
- Phase 4 progress: `docs/reports/phase4-progress.md`
- Performance report: `docs/reports/performance-report.md`
- 3D sandbox spec: `docs/plans/3d-sandbox-spec.md`
- Claude phase 3 plan: `docs/plans/claude-phase3-plan.md`

## Production Readiness Rules

1. Keep root clean.
Only keep entrypoint files at root (`README.md`, `package.json`, config files, top-level app folders).

2. No deployment files mixed into app code folders.
All runtime/infrastructure artifacts live under `deploy/`.

3. No ad-hoc docs at root.
Plans/reports must go into `docs/plans` or `docs/reports`.

4. CI must prove baseline health on every PR.
Frontend: lint + build.
Backend: tests.

5. Environment-specific values must be template-driven.
Use `deploy/env/*.example`; never commit secrets.

6. Keep feature and infra changes separable.
Prefer separate PRs/commits for product logic vs deployment/CI scaffolding.

## PR/Commit Hygiene

### Branching
- Feature branches: `feat/...`
- Fix branches: `fix/...`
- Codex branches: `codex/...`

### Commit scope guidance
- `feat(ui): ...`
- `feat(sim): ...`
- `fix(api): ...`
- `chore(repo): ...`
- `chore(ci): ...`

### PR checklist
- [ ] `npm run lint`
- [ ] `npm run build`
- [ ] `api` tests pass (`pytest tests -q`)
- [ ] docs updated for behavior changes
- [ ] no root-level clutter introduced

## Deployment Scaffold Expectations

### `deploy/docker/`
- `frontend.Dockerfile`
- `api.Dockerfile`
- optional compose manifests (`docker-compose.staging.yml`)

### `deploy/nginx/`
- `frontend.conf` (SPA routing + caching)
- optional API reverse-proxy snippets

### `deploy/env/`
- `.env.staging.example`
- `.env.prod.example`

## CI/CD Expectations

### CI (`.github/workflows/ci.yml`)
- On push/PR:
  - frontend lint/build
  - backend tests

### Deploy (`.github/workflows/deploy.yml`)
- Manual trigger initially.
- Promote to environment-specific deployment once infra target is finalized.

## Guardrails for Claude Code

When editing this repository:
1. Do not create new top-level docs unless explicitly requested.
2. Place plans/reports under `docs/plans` or `docs/reports`.
3. Place utility scripts under `scripts/dev` or `scripts/ci`.
4. Place deploy/infrastructure artifacts only under `deploy/`.
5. If a file path must change, update references in `README.md` and related docs in the same PR.

## Next Suggested Follow-up

1. Add a `docs/runbooks/release.md` with exact release commands.
2. Pin backend dependencies with a lock workflow.
3. Add container build + smoke-test steps to `deploy.yml` once deployment target is chosen.
