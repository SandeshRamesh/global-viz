/**
 * Test 06 — Full Journey (Leak Detection)
 *
 * Run all major interactions end-to-end, then reset.
 * Compare heap to post-initial-load baseline. Delta > 30MB = fail (memory leak).
 */

import { test, expect } from '@playwright/test';
import { createCDPSession, enablePerformanceMetrics, measureHeap } from '../helpers/cdp';
import { getDOMNodeCount } from '../helpers/metrics';
import { loadExplore, expandAllRings, collapseAll, selectCountry, switchToLocalView, resetAppState } from '../helpers/scenarios';
import * as T from '../thresholds';

test.describe('06 — Full Journey (Leak Detection)', () => {
  test('memory leak detection across full user journey', async ({ page }) => {
    test.setTimeout(180_000); // 3 minutes for full journey

    const cdp = await createCDPSession(page);
    await enablePerformanceMetrics(cdp);

    // Phase 1: Initial load
    await loadExplore(page);
    const initialHeap = await measureHeap(cdp);
    const initialDom = await getDOMNodeCount(page);

    console.log('\n📊 Full Journey — Phase 1 (Initial Load):');
    console.log(`  Heap: ${initialHeap.usedHeapMB.toFixed(1)}MB`);
    console.log(`  DOM: ${initialDom}`);

    // Phase 2: Expand all
    await expandAllRings(page);
    const expandedHeap = await measureHeap(cdp);
    const expandedDom = await getDOMNodeCount(page);

    console.log('\n📊 Full Journey — Phase 2 (Full Expansion):');
    console.log(`  Heap: ${expandedHeap.usedHeapMB.toFixed(1)}MB`);
    console.log(`  DOM: ${expandedDom}`);

    // Phase 3: Collapse
    await collapseAll(page);
    await page.waitForTimeout(1000);
    const collapsedHeap = await measureHeap(cdp);
    const collapsedDom = await getDOMNodeCount(page);

    console.log('\n📊 Full Journey — Phase 3 (Collapsed):');
    console.log(`  Heap: ${collapsedHeap.usedHeapMB.toFixed(1)}MB`);
    console.log(`  DOM: ${collapsedDom}`);

    // Phase 4: Country selection
    await selectCountry(page, 'India');
    const countryHeap = await measureHeap(cdp);

    console.log('\n📊 Full Journey — Phase 4 (Country Selected):');
    console.log(`  Heap: ${countryHeap.usedHeapMB.toFixed(1)}MB`);

    // Phase 5: Local View
    await switchToLocalView(page);
    const localViewHeap = await measureHeap(cdp);

    console.log('\n📊 Full Journey — Phase 5 (Local View):');
    console.log(`  Heap: ${localViewHeap.usedHeapMB.toFixed(1)}MB`);

    // Phase 6: Expand again
    await expandAllRings(page);
    const peakHeap = await measureHeap(cdp);

    console.log('\n📊 Full Journey — Phase 6 (Second Expansion — Peak):');
    console.log(T.formatResult('Peak Heap', peakHeap.usedHeapMB, T.PEAK_HEAP));

    // Phase 7: Full reset
    await resetAppState(page);
    await page.waitForTimeout(2000);
    const resetHeap = await measureHeap(cdp);
    const resetDom = await getDOMNodeCount(page);

    const leakDelta = resetHeap.usedHeapMB - initialHeap.usedHeapMB;

    console.log('\n📊 Full Journey — Phase 7 (After Reset):');
    console.log(`  Heap: ${resetHeap.usedHeapMB.toFixed(1)}MB`);
    console.log(`  DOM: ${resetDom}`);
    console.log(T.formatResult('Heap Leak Delta', leakDelta, T.HEAP_LEAK));

    console.log('\n📊 Full Journey — Summary:');
    console.log(`  Initial → Peak: ${initialHeap.usedHeapMB.toFixed(1)}MB → ${peakHeap.usedHeapMB.toFixed(1)}MB (+${(peakHeap.usedHeapMB - initialHeap.usedHeapMB).toFixed(1)}MB)`);
    console.log(`  Peak → Reset: ${peakHeap.usedHeapMB.toFixed(1)}MB → ${resetHeap.usedHeapMB.toFixed(1)}MB (${(resetHeap.usedHeapMB - peakHeap.usedHeapMB).toFixed(1)}MB)`);
    console.log(`  Initial → Reset (leak): ${leakDelta > 0 ? '+' : ''}${leakDelta.toFixed(1)}MB`);
    console.log('');

    // Assertions
    expect(peakHeap.usedHeapMB, 'Peak heap during full journey exceeds fail threshold').toBeLessThan(T.PEAK_HEAP.fail);
    expect(leakDelta, `Memory leak detected: ${leakDelta.toFixed(1)}MB retained after reset`).toBeLessThan(T.HEAP_LEAK.fail);
  });
});
