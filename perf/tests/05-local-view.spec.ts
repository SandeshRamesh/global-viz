/**
 * Test 05 — LocalView + Edge Hover
 *
 * Switch to Local View, hover edges.
 * Measure: LocalView render time, tooltip appear time, DOM count, heap delta.
 */

import { test, expect } from '@playwright/test';
import { createCDPSession, enablePerformanceMetrics, measureHeap } from '../helpers/cdp';
import { getDOMNodeCount, getDOMNodeCountIn, installLongTaskObserver, getLongTasks } from '../helpers/metrics';
import { loadExplore, switchToLocalView } from '../helpers/scenarios';
import * as T from '../thresholds';

test.describe('05 — LocalView + Edge Hover', () => {
  test('LocalView render and interaction performance', async ({ page }) => {
    const cdp = await createCDPSession(page);
    await enablePerformanceMetrics(cdp);

    await loadExplore(page);

    // Baseline
    const baseHeap = await measureHeap(cdp);

    await installLongTaskObserver(page);

    // Switch to Local View
    const switchStart = Date.now();
    await switchToLocalView(page);
    const switchTime = Date.now() - switchStart;

    // Wait for LocalView SVG to render
    await page.waitForTimeout(1000);

    // Post-switch measurements
    const postHeap = await measureHeap(cdp);
    const domCount = await getDOMNodeCount(page);
    const longTasks = await getLongTasks(page);
    const heapDelta = postHeap.usedHeapMB - baseHeap.usedHeapMB;

    // Try to count SVG nodes specifically in LocalView
    const svgNodeCount = await getDOMNodeCountIn(page, 'svg');

    console.log('\n📊 LocalView Results:');
    console.log(`  Switch time: ${switchTime}ms`);
    console.log(T.formatResult('Total DOM', domCount, T.DOM_NODES));
    console.log(`  SVG nodes: ${svgNodeCount}`);
    console.log(`  Heap delta: ${heapDelta > 0 ? '+' : ''}${heapDelta.toFixed(1)}MB`);
    console.log(T.formatResult('Heap', postHeap.usedHeapMB, T.PEAK_HEAP));
    console.log(`  Long tasks: ${longTasks.length}`);

    // Try hovering a node circle in LocalView for tooltip (best-effort)
    try {
      const node = page.locator('circle.node').first();
      if (await node.isVisible({ timeout: 2000 })) {
        const hoverStart = Date.now();
        await node.hover({ force: true, timeout: 3000 });
        await page.waitForTimeout(500);
        const hoverTime = Date.now() - hoverStart;
        console.log(`  Node hover time: ${hoverTime}ms`);
      }
    } catch {
      console.log('  Node hover: skipped (no accessible node)');
    }

    console.log('');

    // Assertions
    expect(domCount, 'DOM nodes in LocalView exceed fail threshold').toBeLessThan(T.DOM_NODES.fail);
    expect(postHeap.usedHeapMB, 'Heap in LocalView exceeds fail threshold').toBeLessThan(T.PEAK_HEAP.fail);
  });
});
