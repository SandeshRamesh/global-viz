"""
Offline static serving (tablet / air-gapped kiosk).

In production the SPA and the landing/research pages are served by nginx, and
this process only answers /api/*. On the offline tablet there is no nginx: a
single uvicorn bound to 127.0.0.1 must serve both, so the app and the API are
same-origin. That removes CORS from the picture entirely, leaves one process to
supervise, and lets the kiosk WebView point at a plain http://127.0.0.1:8000.

This module is opt-in and inert unless SERVE_STATIC=true, so importing it has no
effect on the production deployment.

Layout served (mirrors the nginx routing in deploy/docker/nginx.conf):

    /explore/...   -> dist/explore/     built Vite SPA
    /research/...  -> site/research/    research hub, paper, methodology
    /              -> site/index.html   landing page
    /<anything>    -> site/...          favicon.svg and other landing assets
"""

from __future__ import annotations

import logging
import os
from pathlib import Path

from fastapi import FastAPI
from fastapi.responses import FileResponse, JSONResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.routing import Route

logger = logging.getLogger("api.offline_static")

SERVE_STATIC = os.getenv("SERVE_STATIC", "false").strip().lower() == "true"


def _apply_cache_policy(response, path: str) -> None:
    """
    Mirror the nginx caching rules this module replaces (deploy/docker/nginx.conf).

    HTML entry points must NEVER be cached: they reference hashed asset bundles
    (index-<hash>.js) that change on every build, so a stale cached index.html
    points at a file that no longer exists. Starlette's StaticFiles sends only
    etag/last-modified, and with no Cache-Control a WebView falls back to
    *heuristic* caching — it will happily serve the page from cache for hours
    without ever revalidating, so a redeploy appears to do nothing.

    Hashed assets are content-addressed, so they can be cached hard.
    """
    # Key off the response content type, not the path. StaticFiles resolves a
    # directory request like "/explore/" to the path "." and "/research/paper/"
    # to "paper" — neither ends in ".html", so a path-based test silently misses
    # exactly the entry points that must not be cached.
    content_type = response.headers.get("content-type", "").lower()
    if content_type.startswith("text/html"):
        response.headers["Cache-Control"] = "no-cache, must-revalidate"
    elif "assets/" in path.lower().replace("\\", "/"):
        response.headers["Cache-Control"] = "public, max-age=31536000, immutable"


class CachePolicyStaticFiles(StaticFiles):
    """StaticFiles that applies the cache policy above."""

    async def get_response(self, path: str, scope):
        response = await super().get_response(path, scope)
        _apply_cache_policy(response, path)
        return response


class SPAStaticFiles(CachePolicyStaticFiles):
    """
    StaticFiles with an HTML5-history fallback.

    The SPA uses client-side routing, so a deep link such as /explore/foo has no
    file behind it and must still return index.html. This mirrors nginx's
    `try_files $uri $uri/ /index.html`.
    """

    async def get_response(self, path: str, scope):
        # StaticFiles raises rather than returning a 404, so the fallback has to
        # catch. It raises starlette's HTTPException — fastapi's is a subclass,
        # so catching that one would never match.
        try:
            response = await super().get_response(path, scope)
        except StarletteHTTPException as exc:
            if exc.status_code != 404:
                raise
            response = await super().get_response("index.html", scope)
            _apply_cache_policy(response, "index.html")
            return response
        if response.status_code == 404:
            response = await super().get_response("index.html", scope)
            _apply_cache_policy(response, "index.html")
        return response


def mount_offline_static(app: FastAPI, root: Path) -> bool:
    """
    Mount the built frontend and static pages onto *app*.

    `root` is the repo root (the directory holding dist/ and site/).
    Returns True if anything was mounted.

    Mount order matters. All /api/* routes and /health are registered before
    this runs, so they keep winning; the catch-all mount at "/" is appended
    last and only sees what nothing else matched. The one exception is the
    exact path "/", which main.py already claims with a JSON API-info route —
    that route is replaced in place so the landing page wins on the tablet
    while staying untouched in production.
    """
    if not SERVE_STATIC:
        return False

    dist_explore = root / "dist" / "explore"
    site_dir = root / "site"
    mounted = False

    if dist_explore.is_dir():
        # The research pages link back to "/explore" with no trailing slash.
        # The mount below does not answer that form, so without this redirect a
        # researcher who opens the methodology and taps "back to the app" hits a
        # 404 — a dead end in a kiosk with no browser chrome. nginx did this for
        # us in production via try_files.
        async def explore_redirect(request):
            return RedirectResponse("/explore/", status_code=308)

        app.router.routes.append(
            Route("/explore", explore_redirect, methods=["GET", "HEAD"], name="explore_redirect")
        )
        app.mount("/explore", SPAStaticFiles(directory=dist_explore, html=True), name="explore")
        logger.info("offline: serving SPA from %s", dist_explore)
        mounted = True
    else:
        logger.warning("offline: SPA not found at %s — run `npm run build`", dist_explore)

    if site_dir.is_dir():
        research_dir = site_dir / "research"
        if research_dir.is_dir():
            app.mount("/research", CachePolicyStaticFiles(directory=research_dir, html=True), name="research")

        index_html = site_dir / "index.html"
        if index_html.is_file():
            _replace_root_route(app, index_html)

        # Catch-all for the remaining landing assets (favicon.svg, 404.html, ...).
        # Appended last so it never shadows an API route.
        app.mount("/", CachePolicyStaticFiles(directory=site_dir, html=True), name="site")
        logger.info("offline: serving landing/research from %s", site_dir)
        mounted = True
    else:
        logger.warning("offline: site/ not found at %s", site_dir)

    return mounted


def _replace_root_route(app: FastAPI, index_html: Path) -> None:
    """
    Swap the JSON API-info handler registered for exact "/" so the landing page
    is served instead. The API info stays reachable at /api-info.
    """

    async def serve_index(request):
        # Same no-cache rule as every other HTML entry point.
        return FileResponse(
            index_html,
            headers={"Cache-Control": "no-cache, must-revalidate"},
        )

    for i, route in enumerate(app.router.routes):
        if isinstance(route, Route) and route.path == "/" and "GET" in (route.methods or set()):
            original = route.endpoint

            async def api_info(request, _original=original):
                result = await _original()
                return JSONResponse(result)

            app.router.routes[i] = Route("/", serve_index, methods=["GET"], name="landing")
            app.router.routes.insert(i + 1, Route("/api-info", api_info, methods=["GET"], name="api_info"))
            logger.info("offline: '/' now serves the landing page; API info moved to /api-info")
            return

    app.router.routes.insert(0, Route("/", serve_index, methods=["GET"], name="landing"))
