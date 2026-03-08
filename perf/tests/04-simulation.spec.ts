/**
 * Test 04 — Simulation Playback
 *
 * With India selected, run simulation (GDP intervention), play back.
 * Measure: API response time, FPS during playback, peak heap, long tasks.
 */

import { test, expect } from '@playwright/test';
import { createCDPSession, enablePerformanceMetrics, measureHeap } from '../helpers/cdp';
import { sampleFPS, installLongTaskObserver, getLongTasks } from '../helpers/metrics';
import { loadExplore, selectCountry, enterSimulationMode } from '../helpers/scenarios';
import * as T from '../thresholds';

test.describe('04 — Simulation Playback', () => {
  test('simulation run and playback performance', async ({ page }) => {
    const cdp = await createCDPSession(page);
    await enablePerformanceMetrics(cdp);

    await loadExplore(page);
    await selectCountry(page, 'India');
    await enterSimulationMode(page);

    // Baseline after entering sim mode
    const baseHeap = await measureHeap(cdp);

    // Track simulation API timing
    let simApiTime = 0;
    const simRequestStarts = new Map<string, number>();

    page.on('request', (request) => {
      if (request.url().includes('/api/simulate/')) {
        simRequestStarts.set(request.url(), Date.now());
      }
    });
    page.on('response', (response) => {
      const start = simRequestStarts.get(response.url());
      if (start) {
        simApiTime = Date.now() - start;
      }
    });

    // Try to find and interact with simulation controls
    // Look for intervention builder / GDP slider
    const interventionInput = page.locator(
      'input[type="range"], input[type="number"], [data-testid*="intervention"], [data-testid*="slider"]'
    ).first();

    if (await interventionInput.isVisible({ timeout: 5000 })) {
      // Set an intervention value
      if (await interventionInput.getAttribute('type') === 'range') {
        await interventionInput.fill('10');
      } else {
        await interventionInput.fill('10');
      }
      await page.waitForTimeout(500);
    }

    // Look for run/play button
    const runButton = page.locator(
      'button:has-text("Run"), button:has-text("Play"), button:has-text("Simulate"), [data-testid*="run"], [data-testid*="play"]'
    ).first();

    await installLongTaskObserver(page);

    if (await runButton.isVisible({ timeout: 5000 })) {
      const simStart = Date.now();
      await runButton.click();

      // Wait for simulation to complete or playback to start
      await page.waitForTimeout(3000);
      const simTime = Date.now() - simStart;

      console.log(`  Simulation run time: ${simTime}ms`);
    }

    // Sample FPS during any ongoing animation/playback
    const fps = await sampleFPS(page, 3000);

    // Peak heap measurement
    const peakHeap = await measureHeap(cdp);
    const longTasks = await getLongTasks(page);
    const heapDelta = peakHeap.usedHeapMB - baseHeap.usedHeapMB;

    console.log('\n📊 Simulation Playback Results:');
    console.log(`  API response time: ${simApiTime > 0 ? simApiTime.toFixed(0) + 'ms' : 'N/A (no API call detected)'}`);
    console.log(T.formatResult('FPS during playback', fps.avg, T.FPS, true));
    console.log(`  Min FPS: ${fps.min}, P5 FPS: ${fps.p5}`);
    console.log(T.formatResult('Peak Heap', peakHeap.usedHeapMB, T.PEAK_HEAP));
    console.log(`  Heap delta from sim start: ${heapDelta > 0 ? '+' : ''}${heapDelta.toFixed(1)}MB`);
    console.log(T.formatResult('Long Tasks', longTasks.length, T.LONG_TASKS));

    // Assertions
    expect(peakHeap.usedHeapMB, 'Peak heap during simulation exceeds fail threshold').toBeLessThan(T.PEAK_HEAP.fail);
    expect(fps.avg, 'Average FPS during simulation below fail threshold').toBeGreaterThanOrEqual(T.FPS.fail);
  });
});
