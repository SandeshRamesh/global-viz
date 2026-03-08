module.exports = {
  ci: {
    collect: {
      url: [
        'https://atlas.argonanalytics.org/explore/',
      ],
      numberOfRuns: 3,
      settings: {
        preset: 'desktop',
        // Skip network throttling — we measure against production
        throttlingMethod: 'provided',
        onlyCategories: ['performance', 'accessibility', 'best-practices'],
      },
    },
    assert: {
      assertions: {
        // Core Web Vitals
        'first-contentful-paint': ['warn', { maxNumericValue: 2500 }],
        'largest-contentful-paint': ['warn', { maxNumericValue: 4000 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'interactive': ['warn', { maxNumericValue: 5000 }],

        // Performance score
        'categories:performance': ['warn', { minScore: 0.7 }],
        'categories:accessibility': ['warn', { minScore: 0.8 }],
        'categories:best-practices': ['warn', { minScore: 0.8 }],

        // Resource budgets
        'total-byte-weight': ['warn', { maxNumericValue: 3000000 }], // 3MB
        'dom-size': ['warn', { maxNumericValue: 8000 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
