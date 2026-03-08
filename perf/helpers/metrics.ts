/**
 * In-page metric collection helpers.
 * These functions run inside the browser via page.evaluate().
 */

import type { Page } from '@playwright/test';

export interface FPSSample {
  avg: number;
  min: number;
  p5: number;
  frames: number;
}

/** Sample FPS over a duration using requestAnimationFrame. */
export async function sampleFPS(page: Page, durationMs: number): Promise<FPSSample> {
  return page.evaluate((duration) => {
    return new Promise<{ avg: number; min: number; p5: number; frames: number }>((resolve) => {
      const frameTimes: number[] = [];
      let lastTime = performance.now();
      let animId: number;

      const measure = () => {
        const now = performance.now();
        frameTimes.push(now - lastTime);
        lastTime = now;

        if (frameTimes.length > 0 && (performance.now() - startTime) >= duration) {
          cancelAnimationFrame(animId);

          // Calculate FPS from frame durations
          const fpsList = frameTimes.map(dt => dt > 0 ? 1000 / dt : 60);
          fpsList.sort((a, b) => a - b);

          const avg = fpsList.reduce((s, v) => s + v, 0) / fpsList.length;
          const min = fpsList[0] ?? 0;
          const p5Index = Math.floor(fpsList.length * 0.05);
          const p5 = fpsList[p5Index] ?? min;

          resolve({ avg: Math.round(avg), min: Math.round(min), p5: Math.round(p5), frames: fpsList.length });
          return;
        }
        animId = requestAnimationFrame(measure);
      };

      const startTime = performance.now();
      animId = requestAnimationFrame(measure);
    });
  }, durationMs);
}

/** Count all DOM nodes on the page. */
export async function getDOMNodeCount(page: Page): Promise<number> {
  return page.evaluate(() => document.querySelectorAll('*').length);
}

/** Get DOM node count within a specific selector. */
export async function getDOMNodeCountIn(page: Page, selector: string): Promise<number> {
  return page.evaluate((sel) => {
    const root = document.querySelector(sel);
    return root ? root.querySelectorAll('*').length : 0;
  }, selector);
}

/**
 * Install a long task observer. Returns a function to retrieve collected entries.
 * Long tasks are those exceeding 50ms on the main thread.
 */
export async function installLongTaskObserver(page: Page): Promise<void> {
  await page.evaluate(() => {
    const w = window as unknown as Record<string, unknown>;
    w.__longTasks = [];
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        (w.__longTasks as { duration: number; startTime: number }[]).push({
          duration: entry.duration,
          startTime: entry.startTime,
        });
      }
    });
    observer.observe({ entryTypes: ['longtask'] });
    w.__longTaskObserver = observer;
  });
}

/** Retrieve collected long tasks. */
export async function getLongTasks(page: Page): Promise<{ duration: number; startTime: number }[]> {
  return page.evaluate(() => {
    const w = window as unknown as Record<string, unknown>;
    return (w.__longTasks as { duration: number; startTime: number }[]) ?? [];
  });
}

/** Clear collected long tasks. */
export async function clearLongTasks(page: Page): Promise<void> {
  await page.evaluate(() => {
    const w = window as unknown as Record<string, unknown>;
    w.__longTasks = [];
  });
}

/**
 * Install a CLS observer. Returns accumulated CLS value.
 */
export async function installCLSObserver(page: Page): Promise<void> {
  await page.evaluate(() => {
    const w = window as unknown as Record<string, unknown>;
    w.__clsValue = 0;
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const layoutShift = entry as PerformanceEntry & { hadRecentInput: boolean; value: number };
        if (!layoutShift.hadRecentInput) {
          w.__clsValue = (w.__clsValue as number) + layoutShift.value;
        }
      }
    });
    observer.observe({ type: 'layout-shift', buffered: true });
    w.__clsObserver = observer;
  });
}

/** Get accumulated CLS value. */
export async function getCLS(page: Page): Promise<number> {
  return page.evaluate(() => {
    const w = window as unknown as Record<string, unknown>;
    return (w.__clsValue as number) ?? 0;
  });
}

/** Get Core Web Vitals (FCP, LCP) from Performance API. */
export async function getWebVitals(page: Page): Promise<{ fcp: number; lcp: number }> {
  return page.evaluate(() => {
    const paintEntries = performance.getEntriesByType('paint');
    const fcp = paintEntries.find(e => e.name === 'first-contentful-paint')?.startTime ?? 0;

    // LCP from PerformanceObserver if available
    const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
    const lcp = lcpEntries.length > 0
      ? lcpEntries[lcpEntries.length - 1]!.startTime
      : 0;

    return { fcp, lcp };
  });
}

/** Get total bytes transferred via the Resource Timing API. */
export async function getTotalTransferSize(page: Page): Promise<number> {
  return page.evaluate(() => {
    const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    return entries.reduce((sum, e) => sum + (e.transferSize ?? 0), 0);
  });
}
