/**
 * Test 07 — Bundle Size (Static)
 *
 * No browser needed. Reads dist/ after build.
 * Asserts JS < 700KB gzip, CSS < 15KB, total dist < 5MB.
 *
 * Can also run standalone: node perf/tests/07-bundle-size.spec.ts
 */

import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as T from '../thresholds';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_DIR = path.resolve(__dirname, '../../dist/explore');

/** Recursively get all files in a directory with sizes. */
function getFileSizes(dir: string): { path: string; size: number }[] {
  const results: { path: string; size: number }[] = [];
  if (!fs.existsSync(dir)) return results;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...getFileSizes(fullPath));
    } else {
      results.push({ path: fullPath, size: fs.statSync(fullPath).size });
    }
  }
  return results;
}

/** Get gzipped size of a file using gzip -c | wc -c. */
function getGzipSize(filePath: string): number {
  try {
    const result = execSync(`gzip -c "${filePath}" | wc -c`, { encoding: 'utf-8' });
    return parseInt(result.trim(), 10);
  } catch {
    return 0;
  }
}

test.describe('07 — Bundle Size', () => {
  test('JS bundle gzip size within budget', async () => {
    expect(fs.existsSync(DIST_DIR), `dist directory not found at ${DIST_DIR}. Run 'npm run build' first.`).toBe(true);

    const files = getFileSizes(DIST_DIR);
    const jsFiles = files.filter(f => f.path.endsWith('.js'));
    const cssFiles = files.filter(f => f.path.endsWith('.css'));

    // Calculate gzipped sizes for JS
    let totalJsGzip = 0;
    const jsDetails: { name: string; raw: number; gzip: number }[] = [];

    for (const file of jsFiles) {
      const gzipSize = getGzipSize(file.path);
      totalJsGzip += gzipSize;
      jsDetails.push({
        name: path.relative(DIST_DIR, file.path),
        raw: file.size,
        gzip: gzipSize,
      });
    }

    const totalJsGzipKB = totalJsGzip / 1024;

    // CSS sizes (raw, typically small enough not to need gzip measurement)
    const totalCssKB = cssFiles.reduce((sum, f) => sum + f.size, 0) / 1024;

    // Total dist size
    const totalDistKB = files.reduce((sum, f) => sum + f.size, 0) / 1024;

    console.log('\n📊 Bundle Size Results:');
    console.log(T.formatResult('JS (gzip total)', totalJsGzipKB, T.JS_BUNDLE_GZIP));
    console.log(T.formatResult('CSS (raw total)', totalCssKB, T.CSS_BUNDLE));
    console.log(T.formatResult('Total dist', totalDistKB, T.TOTAL_DIST));

    console.log('\n  JS files:');
    jsDetails
      .sort((a, b) => b.gzip - a.gzip)
      .forEach(f => {
        console.log(`    ${f.name}: ${(f.raw / 1024).toFixed(0)}KB raw, ${(f.gzip / 1024).toFixed(0)}KB gzip`);
      });

    console.log(`\n  CSS files: ${cssFiles.length}`);
    console.log(`  Total files in dist: ${files.length}`);
    console.log('');

    // Assertions
    expect(totalJsGzipKB, `JS bundle ${totalJsGzipKB.toFixed(0)}KB gzip exceeds fail threshold`).toBeLessThan(T.JS_BUNDLE_GZIP.fail);
    expect(totalCssKB, `CSS ${totalCssKB.toFixed(0)}KB exceeds fail threshold`).toBeLessThan(T.CSS_BUNDLE.fail);
    expect(totalDistKB, `Total dist ${totalDistKB.toFixed(0)}KB exceeds fail threshold`).toBeLessThan(T.TOTAL_DIST.fail);
  });
});
