# Deployment Layout

This directory is the reserved home for production deployment assets.

## Structure

- `deploy/docker/` — Dockerfiles, compose manifests, build args, health checks.
- `deploy/nginx/` — Nginx/ingress configs, cache headers, SPA routing rules.
- `deploy/env/` — non-secret env templates for each environment.

## Current Status

This scaffold is intentionally lightweight so feature work can continue without deployment files spreading across the repo.

## Next Additions

1. `deploy/docker/frontend.Dockerfile`
2. `deploy/docker/api.Dockerfile`
3. `deploy/docker/docker-compose.staging.yml`
4. `deploy/nginx/frontend.conf`
5. `deploy/env/.env.staging.example`
6. `deploy/env/.env.prod.example`
