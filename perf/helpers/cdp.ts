/**
 * Chrome DevTools Protocol helpers for performance measurement.
 * Provides heap measurement, GC triggering, and CPU throttling.
 */

import type { Page, CDPSession } from '@playwright/test';

export interface HeapMetrics {
  usedHeapMB: number;
  totalHeapMB: number;
}

/** Create a CDP session for the given page. */
export async function createCDPSession(page: Page): Promise<CDPSession> {
  return page.context().newCDPSession(page);
}

/** Force garbage collection twice and return heap metrics. */
export async function measureHeap(cdp: CDPSession): Promise<HeapMetrics> {
  // Two GC passes to clean up weak references
  await cdp.send('HeapProfiler.collectGarbage');
  await cdp.send('HeapProfiler.collectGarbage');

  // Small delay for GC to settle
  await new Promise(r => setTimeout(r, 100));

  const { metrics } = await cdp.send('Performance.getMetrics');

  const usedHeap = metrics.find(m => m.name === 'JSHeapUsedSize');
  const totalHeap = metrics.find(m => m.name === 'JSHeapTotalSize');

  return {
    usedHeapMB: (usedHeap?.value ?? 0) / (1024 * 1024),
    totalHeapMB: (totalHeap?.value ?? 0) / (1024 * 1024),
  };
}

/** Enable Performance domain metrics collection. */
export async function enablePerformanceMetrics(cdp: CDPSession): Promise<void> {
  await cdp.send('Performance.enable');
}

/** Set CPU throttling rate (1 = no throttle, 4 = 4x slowdown). */
export async function setCPUThrottle(cdp: CDPSession, rate: number): Promise<void> {
  await cdp.send('Emulation.setCPUThrottlingRate', { rate });
}

/** Reset CPU throttle to normal. */
export async function resetCPUThrottle(cdp: CDPSession): Promise<void> {
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
}

/** Get all Performance.getMetrics as a map. */
export async function getAllMetrics(cdp: CDPSession): Promise<Map<string, number>> {
  const { metrics } = await cdp.send('Performance.getMetrics');
  return new Map(metrics.map(m => [m.name, m.value]));
}
