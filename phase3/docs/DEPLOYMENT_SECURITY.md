# Deployment Security Runbook

This project is currently configured for active development (`API_ENV=development` by default).

Use this runbook when exposing the app publicly through Cloudflare Tunnel.

## Current Production Deployment (atlas.argonanalytics.org)

**Deployed:** 2026-02-21

| Component | URL | Port |
|-----------|-----|------|
| Frontend | https://atlas.argonanalytics.org | 3005 (local) |
| API | https://api.argonanalytics.org | 8000 (local) |

**Security model:** Rate limiting + CORS (no token auth)

- CORS locked to `https://atlas.argonanalytics.org`
- Rate limits: 100 req/min, 1000 req/hr per IP
- API on localhost only; Cloudflare Tunnel handles external access
- Swagger docs disabled in production

**Services (systemd):**
- `global-causal-api.service` - API server
- `atlas-frontend.service` - Static file server
- `cloudflared-argon.service` - Cloudflare Tunnel

## Current Dev Mode (safe for local iteration)

- Keep `API_ENV=development`
- Keep docs enabled (`API_ENABLE_DOCS=true`)
- Keep detailed health enabled (`HEALTH_DETAILED_ENABLED=true`)
- Keep simulation auth off (`SIMULATION_AUTH_ENABLED=false`)

## Public Deployment Checklist

1. Set production env vars:

```bash
API_ENV=production
CORS_ORIGINS=https://atlas.argonanalytics.org
CORS_ALLOW_WILDCARD=false
API_ENABLE_DOCS=false
HEALTH_DETAILED_ENABLED=false
SIMULATION_AUTH_ENABLED=false  # Rate limiting is sufficient for public research tools
```

2. (Optional) Enable auth for `/api/simulate*` if needed:

- API token mode:

```bash
SIMULATION_AUTH_ENABLED=true
SIMULATION_AUTH_TOKEN=<long-random-token>
```

- Cloudflare Access service token mode:

```bash
SIMULATION_AUTH_ENABLED=true
CF_ACCESS_CLIENT_ID=<client-id>
CF_ACCESS_CLIENT_SECRET=<client-secret>
```

3. Keep the quick bounded in-memory rate limiter settings:

```bash
RATE_LIMIT_ENABLED=true
RATE_LIMIT_PER_MINUTE=100
RATE_LIMIT_PER_HOUR=1000
RATE_LIMIT_MAX_TRACKED_IPS=10000
RATE_LIMIT_EVICT_FRACTION=0.10
GRAPH_SERVICE_GRAPH_CACHE_MAX=64
GRAPH_SERVICE_SHAP_CACHE_MAX=128
TEMPORAL_SERVICE_SHAP_CACHE_MAX=256
TEMPORAL_SERVICE_GRAPH_CACHE_MAX=192
TEMPORAL_SERVICE_CLUSTER_CACHE_MAX=128
TRUST_PROXY_IPS=127.0.0.1,::1
```

4. Run a single API worker (required for in-memory limiter consistency):

```bash
uvicorn main:app --host 127.0.0.1 --port 8000
```

5. Tunnel only to loopback origin (`http://127.0.0.1:8000`) and do not expose origin directly.

## Notes

- Error responses are now generic on internal failures.
- `/health/detailed` can be disabled for production to reduce information exposure.
- If `ENFORCE_PRODUCTION_ENV=true`, startup will fail when unsafe production settings are detected.
