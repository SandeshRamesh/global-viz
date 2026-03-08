# Performance Baselines & System Requirements

## Current Resource Profile (March 2026)

| Metric | Measured Value | Budget (Pass) | Status |
|--------|---------------|---------------|--------|
| JS bundle (gzip) | 672KB | < 700KB | ✅ Pass |
| Initial JS heap | ~30MB | < 35MB | ✅ Pass |
| Peak heap (sim playback) | ~65-70MB | < 120MB | ✅ Pass |
| DOM nodes (full expansion) | ~8,000 | < 7,000 | ⚠️ Warn |
| Network per sim session | ~2.5-3MB | < 3MB | ✅ Pass |
| Temporal edges cache | ~8MB | N/A | Acceptable |

## Performance Budgets

### Core Web Vitals

| Metric | Pass | Warn | Fail |
|--------|------|------|------|
| LCP | < 2.5s | < 4.0s | >= 4.0s |
| FCP | < 1.8s | < 2.5s | >= 2.5s |
| CLS | < 0.05 | < 0.1 | >= 0.1 |
| INP | < 200ms | < 500ms | >= 800ms |

### Resource Budgets

| Metric | Pass | Warn | Fail |
|--------|------|------|------|
| JS bundle (gzip) | < 700KB | < 750KB | >= 1MB |
| CSS bundle | < 15KB | < 25KB | >= 50KB |
| Initial JS heap | < 35MB | < 50MB | >= 80MB |
| Peak heap (full journey) | < 120MB | < 150MB | >= 200MB |
| DOM nodes (full expand) | < 7,000 | < 8,000 | >= 10,000 |
| FPS during animations | >= 30fps | >= 20fps | < 15fps |
| Long tasks per interaction | < 3 | < 8 | >= 15 |
| Heap leak after reset | < 10MB | < 20MB | >= 30MB |

### Network

| Metric | Pass | Warn | Fail |
|--------|------|------|------|
| API response time | < 500ms | < 1s | >= 3s |
| Total transfer | < 3MB | < 5MB | >= 10MB |

## System Requirements

### Minimum

| Requirement | Value |
|-------------|-------|
| Browser | Chrome 100+, Firefox 115+, Safari 16+, Edge 100+ |
| RAM | 4 GB |
| CPU | Dual-core 1.5 GHz |
| Network | 3 Mbps |
| Screen | 1024×768 |

### Recommended

| Requirement | Value |
|-------------|-------|
| Browser | Latest Chrome or Firefox |
| RAM | 8 GB+ |
| CPU | Quad-core 2.0 GHz+ |
| Network | 10 Mbps+ |
| Screen | 1280×800+ |

## Device Tier Expectations

| Tier | Initial Load | Full Expansion | Simulation | Peak Heap |
|------|-------------|----------------|------------|-----------|
| Desktop (16GB RAM) | < 2s | < 1s, 60fps | 60fps | < 80MB |
| Chromebook (4GB RAM) | 3-5s | 2-4s, 20-30fps | 20-30fps | < 120MB |
| iPad (8GB RAM) | 2-3s | 1-2s, 30-45fps | 30-45fps | < 100MB |

## Test Suite

### Running Tests

```bash
# All performance tests (requires dev server or production URL)
npm run perf

# Bundle size only (requires npm run build first)
npm run perf:bundle

# Lighthouse CI
npm run perf:lighthouse

# Against local dev server
PERF_BASE_URL=http://localhost:5174 npm run perf
```

### Test Scenarios

| Test | What It Measures |
|------|-----------------|
| 01 — Initial Load | FCP, LCP, CLS, initial heap, DOM count, transfer size |
| 02 — Node Expansion | DOM growth, heap growth, FPS at full expansion |
| 03 — Country Selection | API response time, heap delta, render time |
| 04 — Simulation | API time, FPS during playback, peak heap, long tasks |
| 05 — LocalView | Render time, tooltip latency, DOM count |
| 06 — Full Journey | Peak memory, leak detection (heap delta after reset) |
| 07 — Bundle Size | JS gzip, CSS, total dist size |

### CI Integration

The `performance` job in `.github/workflows/ci.yml`:
1. Builds frontend
2. Runs bundle size check (Test 07)
3. Installs Playwright Chromium
4. Runs Lighthouse CI (3 runs, desktop preset)
5. Runs Playwright perf tests against production
6. Uploads reports as artifacts (30-day retention)

Warn-level issues produce GitHub annotations. Fail-level issues block the job.

## Notes

- DOM node count at full expansion (~8,000) exceeds Lighthouse's 1,400-node warning but is expected for a complex D3 visualization with ~99 indicators
- Peak heap during simulation stays well under Chromebook's practical limit (~150MB)
- No Web Workers are used — all computation runs on the main thread, which is a risk factor for low-end CPUs
- The temporal edges cache (~8MB) is acceptable and provides significant UX benefit
