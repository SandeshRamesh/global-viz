# Deployment Security Runbook

This project is currently configured for active development (`API_ENV=development` by default).

Use this runbook when exposing the app publicly through Cloudflare Tunnel.

## Current Dev Mode (safe for local iteration)

- Keep `API_ENV=development`
- Keep docs enabled (`API_ENABLE_DOCS=true`)
- Keep detailed health enabled (`HEALTH_DETAILED_ENABLED=true`)
- You can keep simulation auth off while developing (`SIMULATION_AUTH_ENABLED=false`)

## Public Deployment Checklist

1. Set production env vars:

```bash
API_ENV=production
ENFORCE_PRODUCTION_ENV=true
CORS_ORIGINS=https://your-domain.example
CORS_ALLOW_WILDCARD=false
API_ENABLE_DOCS=false
HEALTH_DETAILED_ENABLED=false
SIMULATION_AUTH_ENABLED=true
```

2. Choose auth mode for `/api/simulate*`:

- API token mode:

```bash
SIMULATION_AUTH_TOKEN=<long-random-token>
```

- Cloudflare Access service token mode:

```bash
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
