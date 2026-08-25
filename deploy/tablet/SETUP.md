# Atlas offline tablet — environment stand-up (verified)

Device: OnePlus Pad (OPD2415), Android 16, Snapdragon 8 Elite, 8 cores,
11.7 GB RAM, 205 GB free, Magisk root, Fully Kiosk installed.

## Outcome

The real Python engine runs on-device. No JS port needed.

| Check | Result |
|---|---|
| `GET /health` | `{"status":"healthy","version":"3.1.0"}` |
| `POST /api/simulate/v31/temporal` (cold) | HTTP 200, **0.65 s**, 1.77 MB |
| same, warm ×3 | **0.59 / 0.66 / 0.64 s** |
| same, `n_ensemble_runs=100` (Monte Carlo) | HTTP 200, **66 s**, 1.82 MB |
| uvicorn RSS, 1 country loaded | **224 MB** |

## Stack

- Termux 0.118.3 (arm64, GitHub release, sha256 verified)
- proot-distro 5.8.0 -> Debian 12 bookworm (arm64)
- Debian Python **3.11.2**, venv at `/opt/atlas-venv`
- numpy 2.4.6, pandas 3.0.5, fastapi 0.141.1, pyarrow 25.0.1 — all binary wheels

## Why proot-Debian, not native Termux

Termux has no `python-pandas` package, and pandas is a **top-level import** in four
runtime modules (`api/services/graph_service.py:8`, `api/services/map_service.py:13`,
`simulation/simulation_runner_v31.py:15`, `simulation/indicator_stats.py:22`).
Termux also ships only Python 3.14, which the scientific stack has barely caught up to.
Debian gives glibc manylinux wheels on Python 3.11 — everything installs in seconds.

## Gotchas hit (and fixes)

1. **`pm install` from `/sdcard` fails** — SELinux denies system_server reading the
   fuse mount. Use `adb install` (streamed) instead. APK still archived on /sdcard.
2. **`su <uid>` drops group 3003 (AID_INET)** — that group gates *all* AF_INET
   sockets, so DNS and any loopback bind fail. Use `run-as com.termux` for dev.
   proot launched from Termux inherits 3003 correctly (verified inside container).
3. **IPv6 is broken on this network.** `proot-distro install debian` hung in
   TCP `SYN_SENT` to an IPv6 registry address — Python's urllib has no Happy Eyeballs.
   Fixes: fetch the rootfs on the desktop and `proot-distro install <file>`; and
   inside Debian set `precedence ::ffff:0:0/96 100` in /etc/gai.conf plus
   `Acquire::ForceIPv4 "true"` for apt.
4. **Files copied in as real root are unreadable by proot's fake root.**
   `chown 10352:10352` (the Termux uid) after any `su`-side copy.

## Run

    proot-distro login debian -- bash -lc '
      cd /opt/atlas
      export DATA_ROOT=/opt/atlas/data
      exec /opt/atlas-venv/bin/python -m uvicorn api.main:app --host 127.0.0.1 --port 8000'

Leave `API_ENV` unset — it defaults to `development`, which keeps
`SIMULATION_AUTH_ENABLED` and `RATE_LIMIT_ENABLED` off. Setting it to `production`
would put the Run button behind auth.

Port **8000**, health path **/health** (accepts GET and HEAD).

## Open items

- `qol_timeline` returns `None` even though all three QoL metadata files are present.
  Needs a look — may require `mode=absolute` or a flag.
- pandas **3.0.5** / numpy **2.4.6** are majors ahead of what the code targets
  (`pandas>=2.0.0`, `numpy>=1.24.0`). Pin to match production before trusting
  numbers for parity with the live site.
- Monte Carlo at 66 s is not interactive. Leave `n_ensemble_runs=0` (matches live)
  or precompute.
- Data currently one country (Afghanistan, 114 MB). Full set is ~20 GB.

---

## Frontend (added)

Built with `VITE_API_BASE=http://127.0.0.1:8000 npm run build` and served by the
same uvicorn via `api/offline_static.py` (opt-in, `SERVE_STATIC=true`), so app
and API are same-origin on one port — no CORS, one process to supervise.

Routes verified on-device:

| Path | Result |
|---|---|
| `/` | 200 — landing page |
| `/explore/` | 200 — SPA |
| `/explore/<deep/route>` | 200 — history fallback to index.html |
| `/research/`, `/research/paper/`, `/research/methodology/` | 200 |
| `/favicon.svg` | 200 |
| `/health`, `/api/countries` | 200 |
| `/api-info` | 200 — the JSON root that `/` used to serve |

Gotcha: `StaticFiles` *raises* `starlette.exceptions.HTTPException` on a miss
rather than returning a 404. `fastapi.HTTPException` is a subclass, so catching
that one silently never matches and the SPA fallback dies. Catch starlette's.

Run:

    proot-distro login debian -- bash -lc '
      cd /opt/atlas
      export DATA_ROOT=/opt/atlas/data SERVE_STATIC=true
      exec /opt/atlas-venv/bin/python -m uvicorn api.main:app --host 127.0.0.1 --port 8000'

---

## Full data transfer (complete)

20 GB / 178 countries on device. Built as 11 parallel gzip chunks (3.2 GB, 6.25:1),
pushed to /sdcard, extracted natively with toybox tar via `su`, then a single
`chown -R 10352:10352`. Scripts: `/home/sandesh/atlas-transfer/{build-chunks,push-extract}.sh`.

Device after transfer: 40 GB used, 184 GB free.

**Restart is mandatory after a data change.** `AVAILABLE_COUNTRY_GRAPH_COUNT` and
`TEMPORAL_TARGETS` are evaluated at import time (`api/config.py:82,87`), so the API
keeps reporting the old country count until uvicorn is restarted.

### Verified with full data

| Endpoint | Result |
|---|---|
| `/api/countries` | 200 — **178 countries** |
| `/api/graph/{c}/timeline` | 200 — 11 years (2014-2024) — **play button works** |
| `/api/temporal/shap/quality_of_life/timeline` | 200 — 8.1 MB |
| `/api/map/qol-scores/all` | 200 |
| `/api/simulate/v31/temporal` (Kenya) | 200 — 1.22 s, **qol_timeline active** |
| `/api/simulate/v31/temporal` (India, after stress) | 200 — 1.36 s |
| `/explore/` | 200 — 0.05 s |

### Root cause of the two "dormant" features

Both the missing play button and `qol_timeline: None` came from the same gap:
**`data/raw/` was absent** from the smoke slice.

- The play button's gate is `historicalTimeline.years.length > 0`
  (`TimelinePlayer.tsx:371`), fed by `/api/graph/{c}/timeline`, which reads the panel parquet.
- QoL needs `data/raw/v21_nodes.csv` (`qol_definition.py:136`). The failure was
  swallowed by the `try:` around the QoL block (`temporal_simulation_v31.py:1055`),
  so it returned `None` silently instead of erroring.

This corrects the backend hand-off twice: it said QoL was dormant because three
metadata files were missing (they are present), and it advised skipping `raw/`
as "not required" — doing so silently disables QoL *and* the historical timeline.

### Memory (the thing to watch)

RSS climbs as the LRU caches fill: 224 MB (1 country) -> 1647 MB (5) -> **1876 MB (30)**.
Device: 11.7 GB total, ~4.0 GB available, 11.3 GB swap free. Comfortable, but the
default bounds are generous for a tablet also running a WebView. All five are
env-tunable if it needs trimming:

    TEMPORAL_SERVICE_GRAPH_CACHE_MAX=96   # default 192, ~6.9 MiB per cached year-graph
    GRAPH_SERVICE_GRAPH_CACHE_MAX=32      # default 64
    TEMPORAL_SERVICE_SHAP_CACHE_MAX=128   # default 256

A large one-off is `graph_service._panel_df` — the 68 MB parquet held resident.

---

## Fully offline (verified in airplane mode)

### Vendored external assets

The SPA was already self-contained. The landing/research pages were not — they
pulled Google Fonts and the globe library from the network. Both are now local:

- `site/fonts/` — 17 woff2 files + `fonts.css` (400 KB). Instrument Serif, DM Mono, Inter.
- `site/vendor/cobe.js` — cobe 0.6.3, self-contained ESM bundle (11.5 KB).
  Note `https://esm.sh/cobe@0.6.3?bundle` returns a *re-export shim*, not the code.
  The real bundle is at `/cobe@0.6.3/es2020/cobe.bundle.mjs`.

Remaining `atlas.argonanalytics.org` URLs are `og:`/`canonical` metadata and
citation text — never fetched by a browser, and correct for the published site.

### Storage layout — everything on the SD-card partition

`/sdcard` on this device is not a removable card: it is a FUSE view of
`/data/media/0`, the *same f2fs partition* as `/data/data`. So the move was an
instant same-filesystem rename (20 GB in 0 s), not a copy.

    /data/media/0/atlas-offline/atlas   <- app + 20 GB data   (= /sdcard/atlas-offline/atlas)
    /data/media/0/atlas-offline/venv    <- Python venv, 332 MB

Termux's uid cannot traverse `/data/media/0` (it is `media_rw`-only), so these are
bind-mounted into the container at the paths the venv was built against:

    mount --bind /data/media/0/atlas-offline/atlas $RFS/opt/atlas
    mount --bind /data/media/0/atlas-offline/venv  $RFS/opt/atlas-venv

This keeps native f2fs speed — binding the FUSE path instead would add
translation overhead on every one of the 15,885 files. **These mounts do not
survive reboot and must be re-established at boot.**

Launcher: `~/start-atlas.sh` in Termux home.

### CRITICAL: OnePlus HANS silently kills localhost

The single worst failure mode found. OxygenOS's HANS (Hybrid App Network
Scheduler) freezes networking for backgrounded apps via eBPF:

    -A oplus_fw_INPUT  -m bpf --object-pinned .../skfilter_ingress_hans -j DROP
    -A oplus_fw_OUTPUT -m bpf --object-pinned .../skfilter_egress_hans  -j DROP

**It drops loopback too.** The symptom is vicious: uvicorn stays alive, the
socket stays in LISTEN, the process sits in `do_epoll_wait` — and every
connection times out with no SYN-ACK, including from root. Nothing in any log.
A kiosk WebView would just hang forever with no error.

Two fixes applied, both needed:

    cmd deviceidle whitelist +com.termux          # persistent
    appops set com.termux RUN_ANY_IN_BACKGROUND allow

    # surgical: exempt loopback ahead of the HANS drop. NOT persistent —
    # must be re-applied at boot. Does not disable HANS for real traffic.
    iptables -I oplus_fw_INPUT  1 -i lo -j RETURN
    iptables -I oplus_fw_OUTPUT 1 -o lo -j RETURN

Diagnosis trick: if the socket is LISTENing and the process is epoll-waiting but
connections time out even as root, it is the firewall, not the app.

### Verified: airplane mode ON, wlan0 DOWN, no adb forward

| Path | Result |
|---|---|
| `/`, `/explore/`, `/research/`, `/research/paper/`, `/research/methodology/` | all 200 |
| `/fonts/fonts.css`, `/vendor/cobe.js`, `/favicon.svg` | all 200 |
| `/explore/assets/index-*.js` (673 KB), `/explore/data/world-110m.json` | 200 |
| `/health` | 200 — 0.004 s |
| `/api/countries` | 200 — 178 countries |
| `/api/graph/Kenya/timeline` | 200 — 757 KB, 0.95 s |
| `/api/map/qol-scores/all` | 200 |
| `POST /api/simulate/v31/temporal` | 200 — **1.02 / 1.12 s**, qol_timeline active |
