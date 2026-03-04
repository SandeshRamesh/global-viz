# Landing Page Restructure Plan

## Target Section Order

```
1. Nav
2. Hero (globe + headline + CTA)
3. Stats Bar  ← moved up from after Problem
4. Problem Statement
5. Capabilities (with small visuals per card)
6. Product Demo / Screenshot  ← NEW section
7. Methodology (condensed inline, link to /methodology)
8. Findings
9. Pull Quote
10. Who It's For (replace emoji icons)
11. CTA (stronger visual treatment)
12. Footer
```

## Tasks

### Structure
- [x] Nav bar refinements (Inter font, flexbox logo, mobile compact, CTA weight)
- [x] Hero section (breathing radial graph, COBE globe, mobile polish, chevron, scroll jitter fix)
- [ ] Move Stats Bar directly below Hero (before Problem)
- [ ] Add Product Demo section after Capabilities (screenshot/animation of real Atlas UI)
- [ ] Condense Methodology to 2-3 sentences inline + "Read full methodology" link
- [ ] Strengthen CTA section visual treatment (distinct background)

### Visual Polish
- [ ] Add small visual per Capability card (screenshot crop or icon)
- [ ] Replace emoji icons in Who It's For with geometric/abstract marks
- [ ] Resolve Ticker vs Stats Bar redundancy (redesign ticker for outcome statements OR remove)

### Markup Cleanup
- [ ] Standardize all sections to use `<section>` elements (Findings + Quote currently use bare `<div>`)
- [ ] Group CSS by section with clear comment delimiters
- [ ] Group JS by section with labeled blocks

## Notes
- Copy is handled separately — do not change text content
- File stays single HTML — no build system
- Test at 1920px, 1024px, 768px, 375px after each change
