/**
 * Reusable step sequences for performance test scenarios.
 * These encapsulate common user journeys in the Atlas app.
 *
 * Keyboard shortcuts (from App.tsx):
 *   R/Home = Reset view, G = Global, L = Local, S = Split, M = Map toggle
 *   C = Clear (targets/highlights/results, preserves country)
 *   +/= = Expand next ring, -/_ = Collapse outermost ring
 *   Space = Toggle timeline play/pause
 */

import type { Page } from '@playwright/test';

/** Base URL for the app. Uses env var or defaults to production. */
export function getBaseURL(): string {
  return process.env.PERF_BASE_URL ?? 'https://atlas.argonanalytics.org';
}

/** Navigate to /explore/ and wait for the D3 SVG to initialize. */
export async function loadExplore(page: Page): Promise<void> {
  // Skip the tutorial overlay — it blocks all keyboard/mouse events
  await page.addInitScript(() => {
    localStorage.setItem('atlas_tutorial_seen', 'true');
  });

  await page.goto(`${getBaseURL()}/explore/`, { waitUntil: 'networkidle' });
  // Wait for the main SVG and at least one rendered node
  await page.waitForSelector('svg circle.node', { timeout: 30000 });
  // Brief settle time for initial D3 layout
  await page.waitForTimeout(1000);
}

/**
 * Expand all rings sequentially using '+' key (expands one ring per press).
 * Rings go from 1 to 5, so 5 presses covers full expansion.
 */
export async function expandAllRings(page: Page): Promise<void> {
  for (let i = 0; i < 5; i++) {
    await page.keyboard.press('Equal'); // '+' key without shift = '='
    await page.waitForTimeout(800); // Wait for ring expansion animation
  }
}

/** Expand a single ring level using '+' key. */
export async function expandRing(page: Page): Promise<void> {
  await page.keyboard.press('Equal');
  await page.waitForTimeout(800);
}

/** Collapse all rings using '-' key (collapses one ring per press). */
export async function collapseAll(page: Page): Promise<void> {
  for (let i = 0; i < 5; i++) {
    await page.keyboard.press('Minus');
    await page.waitForTimeout(300);
  }
}

/** Reset view to initial state (R key). */
export async function resetView(page: Page): Promise<void> {
  await page.keyboard.press('r');
  await page.waitForTimeout(1000); // Phase 1 zoom + Phase 2 expand
}

/** Clear working context (C key) — clears targets/highlights/results. */
export async function clearContext(page: Page): Promise<void> {
  await page.keyboard.press('c');
  await page.waitForTimeout(500);
}

/** Open the country selector and pick a country. */
export async function selectCountry(page: Page, country: string): Promise<void> {
  // The CountrySelector is inside the simulation panel.
  // First, check if the sim panel is open. If not, we need to open it.
  // Look for the country selector input or the panel itself.
  const countryInput = page.locator('input[placeholder*="Search"], input[placeholder*="earch countr"]').first();

  if (!(await countryInput.isVisible({ timeout: 2000 }).catch(() => false))) {
    // Try opening the simulation panel by clicking a "Simulate" or sim button
    const simButton = page.locator('button:has-text("Simulation"), button:has-text("Simulate")').first();
    if (await simButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await simButton.click();
      await page.waitForTimeout(500);
    }
  }

  // Now fill the search input
  const input = page.locator('input[placeholder*="Search"], input[placeholder*="earch countr"]').first();
  if (await input.isVisible({ timeout: 5000 }).catch(() => false)) {
    await input.fill(country);
    await page.waitForTimeout(500);

    // Click the matching result option
    const option = page.locator(`[role="option"]:has-text("${country}"), li:has-text("${country}"), .country-option:has-text("${country}")`).first();
    if (await option.isVisible({ timeout: 3000 }).catch(() => false)) {
      await option.click();
    } else {
      // Fallback: click text match
      await page.locator(`text="${country}"`).first().click({ timeout: 5000 }).catch(() => {});
    }
  }

  // Wait for graph to re-render with country data
  await page.waitForTimeout(2000);
}

/** Switch to Local View using 'L' key. */
export async function switchToLocalView(page: Page): Promise<void> {
  // First need at least one target. Double-click a node to add it.
  const node = page.locator('circle.node').first();
  if (await node.isVisible({ timeout: 3000 }).catch(() => false)) {
    await node.dblclick();
    await page.waitForTimeout(500);
  }

  await page.keyboard.press('l');
  await page.waitForTimeout(1000);
}

/** Switch to Global View using 'G' key. */
export async function switchToGlobalView(page: Page): Promise<void> {
  await page.keyboard.press('g');
  await page.waitForTimeout(500);
}

/** Reset the app state fully (R key). */
export async function resetAppState(page: Page): Promise<void> {
  await page.keyboard.press('r');
  await page.waitForTimeout(1500); // Full reset with animation phases
}

/** Enter simulation mode by opening the simulation panel. */
export async function enterSimulationMode(page: Page): Promise<void> {
  const simButton = page.locator('button:has-text("Simulation"), button:has-text("Simulate")').first();
  if (await simButton.isVisible({ timeout: 5000 }).catch(() => false)) {
    await simButton.click();
    await page.waitForTimeout(1000);
  }
}

/**
 * Wait for network idle after an action.
 */
export async function waitForNetworkSettle(page: Page, timeoutMs = 5000): Promise<void> {
  try {
    await page.waitForLoadState('networkidle', { timeout: timeoutMs });
  } catch {
    // Network may not fully idle in some cases; continue
  }
}
