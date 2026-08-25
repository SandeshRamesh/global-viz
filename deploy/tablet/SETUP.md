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
