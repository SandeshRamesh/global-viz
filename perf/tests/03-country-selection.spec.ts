/**
 * Test 03 — Country Selection
 *
 * Select "India" via CountrySelector.
 * Measure: API response time (/api/graph/India), heap delta, render time.
 */

import { test, expect } from '@playwright/test';
import { createCDPSession, enablePerformanceMetrics, measureHeap } from '../helpers/cdp';
import { getDOMNodeCount, installLongTaskObserver, getLongTasks } from '../helpers/metrics';
import { loadExplore, selectCountry } from '../helpers/scenarios';
import * as T from '../thresholds';

test.describe('03 — Country Selection', () => {
  test('country selection API and render performance', async ({ page }) => {
    const cdp = await createCDPSession(page);
    await enablePerformanceMetrics(cdp);

    await loadExplore(page);

    // Baseline
    const baseHeap = await measureHeap(cdp);
    const baseDom = await getDOMNodeCount(page);

    // Track API call timing via request/response event pairs
    let apiResponseTime = 0;
    let apiResponseSize = 0;
    const apiRequestStarts = new Map<string, number>();

    page.on('request', (request) => {
      if (request.url().includes('/api/')) {
        apiRequestStarts.set(request.url(), Date.now());
      }
    });
    page.on('response', (response) => {
      const url = response.url();
      const start = apiRequestStarts.get(url);
      if (start && url.includes('/api/')) {
        apiResponseTime = Date.now() - start;
        const contentLength = response.headers()['content-length'];
        apiResponseSize = contentLength ? parseInt(contentLength, 10) / 1024 : 0;
      }
    });

    await installLongTaskObserver(page);

    // Select India
    const selectStart = Date.now();
    await selectCountry(page, 'India');
    const selectTime = Date.now() - selectStart;

    // Post-selection measurements
    const postHeap = await measureHeap(cdp);
    const postDom = await getDOMNodeCount(page);
    const longTasks = await getLongTasks(page);
    const heapDelta = postHeap.usedHeapMB - baseHeap.usedHeapMB;

    console.log('\n📊 Country Selection — India:');
    console.log(`  Total select time: ${selectTime}ms`);
    console.log(`  API response time: ${apiResponseTime.toFixed(0)}ms`);
    console.log(`  API response size: ${apiResponseSize.toFixed(1)}KB`);
    console.log(`  Heap delta: ${heapDelta > 0 ? '+' : ''}${heapDelta.toFixed(1)}MB`);
    console.log(`  DOM delta: ${postDom - baseDom > 0 ? '+' : ''}${postDom - baseDom}`);
    console.log(T.formatResult('Post-select Heap', postHeap.usedHeapMB, T.PEAK_HEAP));
    console.log(`  Long tasks: ${longTasks.length}`);

    // Assertions
    expect(postHeap.usedHeapMB, 'Heap after country selection exceeds fail threshold').toBeLessThan(T.PEAK_HEAP.fail);
    if (apiResponseTime > 0) {
      expect(apiResponseTime, `API response ${apiResponseTime.toFixed(0)}ms exceeds fail threshold`).toBeLessThan(T.API_RESPONSE.fail);
    }
  });
});
