/**
 * Test 01 — Initial Load (Cold)
 *
 * Navigate to /explore/, wait for D3 SVG init.
 * Measure: FCP, LCP, CLS, initial heap, DOM count, total transfer size.
 */

import { test, expect } from '@playwright/test';
import { createCDPSession, enablePerformanceMetrics, measureHeap } from '../helpers/cdp';
import { getDOMNodeCount, installCLSObserver, getCLS, getWebVitals, getTotalTransferSize, installLongTaskObserver, getLongTasks } from '../helpers/metrics';
import { getBaseURL } from '../helpers/scenarios';
import * as T from '../thresholds';

test.describe('01 — Initial Load', () => {
  test.beforeEach(async ({ page }) => {
    // Skip tutorial overlay — it adds extra DOM nodes and blocks events
    await page.addInitScript(() => {
      localStorage.setItem('atlas_tutorial_seen', 'true');
    });
  });

  test('cold load meets performance budgets', async ({ page }) => {
    const cdp = await createCDPSession(page);
    await enablePerformanceMetrics(cdp);

    // Navigate with timing
    const navStart = Date.now();
    await page.goto(`${getBaseURL()}/explore/`, { waitUntil: 'commit' });

    // Install observers immediately after commit
    await installCLSObserver(page);
    await installLongTaskObserver(page);

    // Wait for app to be interactive — SVG rendered
    await page.waitForSelector('svg', { timeout: 30000 });
    await page.waitForTimeout(2000); // Settle time for D3 layout

    const loadTime = Date.now() - navStart;

    // --- Measurements ---

    const vitals = await getWebVitals(page);
    const cls = await getCLS(page);
    const heap = await measureHeap(cdp);
    const domCount = await getDOMNodeCount(page);
    const transferBytes = await getTotalTransferSize(page);
    const transferKB = transferBytes / 1024;
    const longTasks = await getLongTasks(page);

    // --- Report ---

    console.log('\n📊 Initial Load Results:');
    console.log(`  Load time: ${loadTime}ms`);
    console.log(T.formatResult('FCP', vitals.fcp, T.FCP));
    console.log(T.formatResult('LCP', vitals.lcp, T.LCP));
    console.log(T.formatResult('CLS', cls, T.CLS));
    console.log(T.formatResult('Initial Heap', heap.usedHeapMB, T.INITIAL_HEAP));
    console.log(T.formatResult('DOM Nodes', domCount, T.DOM_NODES));
    console.log(T.formatResult('Transfer Size', transferKB, T.TOTAL_TRANSFER));
    console.log(`  Long tasks: ${longTasks.length}`);
    console.log('');

    // --- Assertions (fail-level only — warns are logged but don't block) ---

    expect(heap.usedHeapMB, `Initial heap ${heap.usedHeapMB.toFixed(1)}MB exceeds fail threshold`).toBeLessThan(T.INITIAL_HEAP.fail);
    expect(domCount, `DOM nodes ${domCount} exceeds fail threshold`).toBeLessThan(T.DOM_NODES.fail);
  });

  test('core web vitals are within budget', async ({ page }) => {
    const cdp = await createCDPSession(page);
    await enablePerformanceMetrics(cdp);

    await page.goto(`${getBaseURL()}/explore/`, { waitUntil: 'commit' });
    await installCLSObserver(page);

    // Wait for LCP candidate to settle
    await page.waitForSelector('svg', { timeout: 30000 });
    await page.waitForTimeout(3000);

    const vitals = await getWebVitals(page);
    const cls = await getCLS(page);

    // FCP and LCP assertions
    if (vitals.fcp > 0) {
      expect(vitals.fcp, `FCP ${vitals.fcp.toFixed(0)}ms exceeds fail threshold`).toBeLessThan(T.FCP.fail);
    }
    if (vitals.lcp > 0) {
      expect(vitals.lcp, `LCP ${vitals.lcp.toFixed(0)}ms exceeds fail threshold`).toBeLessThan(T.LCP.fail);
    }
    expect(cls, `CLS ${cls.toFixed(3)} exceeds fail threshold`).toBeLessThan(T.CLS.fail);
  });
});
