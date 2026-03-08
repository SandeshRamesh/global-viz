/**
 * Test 02 — Node Expansion
 *
 * Expand Ring 1 → Ring 5 sequentially.
 * Measure per-ring: expand time, DOM count, heap.
 * At full expansion: FPS sampling over 2 seconds.
 */

import { test, expect } from '@playwright/test';
import { createCDPSession, enablePerformanceMetrics, measureHeap } from '../helpers/cdp';
import { getDOMNodeCount, sampleFPS, installLongTaskObserver, getLongTasks } from '../helpers/metrics';
import { loadExplore, expandAllRings } from '../helpers/scenarios';
import * as T from '../thresholds';

test.describe('02 — Node Expansion', () => {
  test('full expansion stays within DOM and heap budgets', async ({ page }) => {
    const cdp = await createCDPSession(page);
    await enablePerformanceMetrics(cdp);

    await loadExplore(page);

    // Baseline measurements
    const baseHeap = await measureHeap(cdp);
    const baseDom = await getDOMNodeCount(page);

    console.log('\n📊 Node Expansion — Baseline:');
    console.log(`  DOM nodes: ${baseDom}`);
    console.log(`  Heap: ${baseHeap.usedHeapMB.toFixed(1)}MB`);

    // Install long task observer before expansion
    await installLongTaskObserver(page);

    // Expand all rings
    const expandStart = Date.now();
    await expandAllRings(page);
    const expandTime = Date.now() - expandStart;

    // Post-expansion measurements
    const expandedHeap = await measureHeap(cdp);
    const expandedDom = await getDOMNodeCount(page);
    const longTasks = await getLongTasks(page);

    console.log('\n📊 Node Expansion — Full Expansion:');
    console.log(`  Expand time: ${expandTime}ms`);
    console.log(T.formatResult('DOM Nodes', expandedDom, T.DOM_NODES));
    console.log(T.formatResult('Heap', expandedHeap.usedHeapMB, T.PEAK_HEAP));
    console.log(`  DOM delta: +${expandedDom - baseDom}`);
    console.log(`  Heap delta: +${(expandedHeap.usedHeapMB - baseHeap.usedHeapMB).toFixed(1)}MB`);
    console.log(`  Long tasks during expansion: ${longTasks.length}`);

    // Assertions
    expect(expandedDom, `DOM nodes ${expandedDom} exceeds fail threshold`).toBeLessThan(T.DOM_NODES.fail);
    expect(expandedHeap.usedHeapMB, `Heap ${expandedHeap.usedHeapMB.toFixed(1)}MB exceeds fail threshold`).toBeLessThan(T.PEAK_HEAP.fail);
  });

  test('FPS during idle after full expansion', async ({ page }) => {
    const cdp = await createCDPSession(page);
    await enablePerformanceMetrics(cdp);

    await loadExplore(page);
    await expandAllRings(page);

    // Sample FPS for 2 seconds while fully expanded
    const fps = await sampleFPS(page, 2000);

    console.log('\n📊 Node Expansion — FPS at full expansion:');
    console.log(T.formatResult('Avg FPS', fps.avg, T.FPS, true));
    console.log(`  Min FPS: ${fps.min}`);
    console.log(`  P5 FPS: ${fps.p5}`);
    console.log(`  Frames sampled: ${fps.frames}`);

    expect(fps.avg, `Avg FPS ${fps.avg} below fail threshold`).toBeGreaterThanOrEqual(T.FPS.fail);
  });
});
