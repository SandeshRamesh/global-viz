# CLAUDE.md

## PRODUCTION MODE

**This project is LIVE at https://atlas.argonanalytics.org**

Before ANY commit/push:
1. **Review changes** - `git diff` and explain what changed
2. **Check for breaking changes** - API signatures, paths, imports
3. **Test locally first** - `curl` endpoints, check pages load
4. **Verify after deploy** - All health checks must pass

**If something breaks, notify user IMMEDIATELY.**

---

## Docker Architecture

**Atlas runs on Docker, NOT systemd. Do NOT use systemctl commands.**

Single container (`atlas`) runs:
- **nginx** (port 3005) - serves frontend + static files
- **uvicorn** (port 8000) - FastAPI backend
- **supervisord** - manages both processes

Key files:
```
Dockerfile                      # Multi-stage build (node -> python)
deploy/docker/nginx.conf        # nginx routing config (CRITICAL)
deploy/docker/supervisord.conf  # process manager config
docker-compose.yml              # in parent /home/sandesh/argon_primary/
```

**CRITICAL: Files are baked into Docker image at build time!**
- Changes to ANY file require `docker-compose build atlas`
- Just restarting container will NOT pick up changes
- Must use `down` then `up -d` for clean restart

---

## Deployment Workflow

```bash
# 1. Make changes, commit to live branch
git add . && git commit -m "message"

# 2. Push to both branches
git push origin live && git push origin live:master

# 3. Rebuild and restart Docker (MUST do all 3 steps)
cd /home/sandesh/argon_primary
docker-compose down atlas
docker-compose build atlas
docker-compose up -d atlas

# 4. Purge Cloudflare cache
curl -X POST "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/purge_cache" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{"purge_everything":true}'

# 5. Verify all endpoints
curl -I https://atlas.argonanalytics.org/
curl -I https://atlas.argonanalytics.org/explore/
curl -I https://atlas.argonanalytics.org/research/
curl -I https://api.argonanalytics.org/health
```

Live URLs to verify:
- Landing: https://atlas.argonanalytics.org
- App: https://atlas.argonanalytics.org/explore/
- Research: https://atlas.argonanalytics.org/research/
- Paper: https://atlas.argonanalytics.org/research/paper/
- Methodology: https://atlas.argonanalytics.org/research/methodology/
- API Health: https://api.argonanalytics.org/health

---

## Cloudflare Tunnels

Traffic flow:
```
Browser -> Cloudflare CDN -> cloudflared tunnel -> localhost:3005/8000 -> Docker (nginx/uvicorn)
```

Tunnel config: `/home/sandesh/.cloudflared/argon-analytics.yml`
```yaml
- atlas.argonanalytics.org -> localhost:3005
- api.argonanalytics.org -> localhost:8000
```

**CRITICAL nginx setting in `deploy/docker/nginx.conf`:**
```nginx
absolute_redirect off;
```
Without this, nginx redirects include internal port (`http://...:3005/`) which breaks through Cloudflare.

---

## Cloudflare Cache

Static assets (PDFs, images, HTML) are cached by Cloudflare.

After deploying changes to static files:
1. Deploy script auto-purges if env vars set
2. If not, manually purge from Cloudflare dashboard or API
3. **Always verify changes are live** - download file, don't trust browser

Env vars (in `/home/sandesh/argon_primary/.env`):
```bash
CLOUDFLARE_ZONE_ID=8514b32adc010aae325021fec9c85820
CLOUDFLARE_API_TOKEN=<token>
```

---

## Troubleshooting

### Site not loading
```bash
# 1. Check Docker container
docker ps | grep atlas

# 2. Check container logs
docker logs atlas --tail 50

# 3. Test local endpoints
curl -I http://localhost:3005/
curl -I http://localhost:8000/health

# 4. Test external
curl -I https://atlas.argonanalytics.org/

# 5. Check Cloudflare tunnel
sudo systemctl status cloudflared
```

### Redirects broken (infinite load, wrong URL with :3005)
1. Check `absolute_redirect off;` exists in `deploy/docker/nginx.conf`
2. Rebuild Docker: `docker-compose down atlas && docker-compose build atlas && docker-compose up -d atlas`
3. Purge Cloudflare cache
4. Test: `curl -I https://atlas.argonanalytics.org/explore` should show `location: /explore/` (relative, no port)

### Static files not updating
1. Files are baked into Docker image - MUST rebuild
2. Purge Cloudflare cache after rebuild
3. Verify inside container: `docker exec atlas cat /usr/share/nginx/html/index.html | head -5`

### Container won't start
```bash
# Check port conflicts
lsof -i :3005 -i :8000

# Force stop and remove
docker-compose down atlas

# Check logs
docker logs atlas
```

### API errors
```bash
# Check API logs
docker logs atlas 2>&1 | grep -i error

# Test API directly
curl http://localhost:8000/health
curl http://localhost:8000/api/countries
```

---

## Build & Dev (Local Development)

```bash
# Frontend dev server (localhost:5173)
npm run dev

# Backend API (localhost:8000)
source api/venv/bin/activate
python -m uvicorn api.main:app --port 8000
```

Toggle API endpoint in `src/services/api.ts`: `API_MODE = 'local' | 'public'`

---

## Project Overview

Interactive causal graph visualization for development economics research. React + TypeScript + Vite + D3.js with simulation mode for country-specific causal graphs.

**Tech Stack**: Zustand (state), D3 (viz), Fuse.js (search)

## Repository Structure

```
atlas/
├── src/                          # Frontend application code
│   ├── components/
│   │   ├── simulation/           # Simulation UI components
│   │   ├── LocalView/            # DAG flow view
│   │   └── ViewTabs.tsx          # View switcher
│   ├── stores/simulationStore.ts # Zustand state
│   ├── services/api.ts           # API client
│   └── App.tsx                   # Main app + D3 rendering
│
├── api/                          # FastAPI backend
│   ├── main.py                   # Entry point
│   ├── routers/                  # Route handlers
│   └── services/                 # Business logic
│
├── simulation/                   # V3.1 simulation engine
│
├── site/                         # Static pages (landing, research)
│   ├── index.html                # Landing page
│   └── research/                 # Research hub, paper, methodology
│
├── deploy/docker/                # Docker configs
│   ├── nginx.conf                # nginx routing (CRITICAL)
│   └── supervisord.conf          # Process manager
│
├── data/                         # Research data (~19GB, gitignored)
│
├── Dockerfile                    # Multi-stage Docker build
└── scripts/deploy.sh             # Deployment automation
```

## Key API Endpoints

| Endpoint | Purpose |
|----------|---------|
| `/health` | Health check |
| `/api/countries` | List 203 countries |
| `/api/graph/{country}` | Country graph + SHAP + baseline |
| `/api/simulate/v31` | V3.1 instant simulation |
| `/api/simulate/v31/temporal` | V3.1 temporal simulation |

## Backlog

See `docs/plans/roadmap.md` for full roadmap and backlog.
