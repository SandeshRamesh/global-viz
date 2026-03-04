# Landing Page — Current Copy Reference

All text content from `site/index.html`, organized by section. For the writing agent to review and revise.

---

## 1. Nav

- Logo: **Atlas** by Argon Analytics
- Links: What It Does · Methodology · Findings · Research
- CTA: **Launch Atlas →**

---

## 2. Hero

- Eyebrow: **A New Standard in Development Science**
- Headline: **We mapped what moves the *world.***
- Subhead: **Not what happened. What causes it. For every country. For the first time.**
- Primary CTA: **Explore Atlas**
- Secondary CTA: **How It Works**

---

## 3. Ticker Bar

Scrolling horizontal marquee with these items:

- **7,368** validated causal edges
- **178** countries
- **35** years of data · 1990–2024
- **1,962** development indicators
- **100×** bootstrap validation per edge
- **20 GB** of precomputed causal data
- **9** outcome domains
- **11** world regions with spillover modeling
- **6** years forward projection · 2025–2030

---

## 4. Problem Statement

- Section label: **The Problem**
- Headline: **Data tells us what happened. *We built something that tells you why.***
- Body:

> Development economics has spent decades accumulating numbers. The World Bank alone tracks thousands of indicators for every country on Earth, every year. These numbers answer one question: **what happened?**
>
> The question that actually matters — the one governments, NGOs, and international organizations are desperate to answer — is different: **what would happen if we did something?**
>
> If Rwanda increases its education budget, what changes? If Brazil expands its cash transfer program, does inequality drop, and does that improvement then feed into political stability, then into investment, then into growth? These are causal questions. And until now, answering them required either a team of economists building bespoke models, or intuition.
>
> Atlas makes those causal chains visible, explorable, and simulatable — for any country, any indicator, any time period.

- Question cards (right column):
  1. If India invests in renewable energy, what happens to respiratory disease rates — and labor productivity — a decade from now?
  2. Which indicators have the strongest causal influence on democratic participation in emerging economies?
  3. How did the causal drivers of quality of life in Sub-Saharan Africa change between 1995 and 2020?
  4. If we replicate Brazil's Bolsa Família in a different developing country, which effects transfer — and which don't?

---

## 5. Stats Grid

| Stat | Label |
|------|-------|
| 7,368 | Causal edges discovered |
| 178 | Countries with full causal graphs |
| 35 | Years of historical data · 1990–2024 |
| 1,962 | Development indicators |
| 100× | Bootstrap validation per edge |

---

## 6. Capabilities ("What Atlas Does")

- Section label: **What Atlas Does**
- Headline: **Three capabilities that don't exist anywhere else.**

### Card 1: 01 — EXPLORE
- Title: **The full causal web, made navigable**
- Body: A radial graph of 2,583 nodes — from the root "Quality of Life" outward through 9 domains, 45 categories, and 1,763 individual indicators. Every node sized by its measured causal importance. Click to expand any branch. The entire structure of how development works, in a single view.

### Card 2: 02 — SIMULATE
- Title: **Run policy interventions in real time**
- Body: Change an indicator — increase education spending by 20%, reduce carbon emissions by 15% — and watch the effects cascade through the causal graph, hop by hop, year by year. Green glows for improvements, red for tradeoffs. For any of 178 countries, with 6 years of forward projection.

### Card 3: 03 — COMPARE
- Title: **Context is not a footnote — it's everything**
- Body: The same policy produces opposite results in different countries. Filter by income stratum — Developing, Emerging, Advanced — to see how causal structures shift. Trace regional spillovers: a policy change in Washington ripples through trade networks to Sub-Saharan Africa at quantified, modeled strength.

---

## 7. Methodology

- Section label: **The Methodology**
- Headline: **These are not correlations.**
- Intro: The word "causal" carries a specific meaning here. Every edge in the Atlas graph has survived a rigorous multi-stage pipeline before appearing in the visualization.

### Pipeline Steps

1. **Granger Causality Prefiltering** — From ~6.2 million potential variable pairs, Granger tests identify where one variable's past values help predict another's future. Temporal precedence, not coincidence. Reduces candidates to ~200,000.

2. **PC-Stable Algorithm** — Conditional independence testing eliminates spurious correlations that survive because a hidden third variable drives both. Scales to thousands of variables. Establishes the skeleton of the true causal graph.

3. **Bootstrap Validation** — Every surviving edge is quantified via ridge regression with 100 bootstrap iterations. Each produces a confidence interval, p-value, and standard error. Edges below p < 0.05 are discarded.

4. **Non-Linear Detection** — Every edge is tested for logarithmic, quadratic, saturation, and threshold patterns. The simulation engine evaluates marginal effects at country-specific percentiles — capturing diminishing returns that linear models miss entirely.

5. **Temporal Re-Estimation** — Causal edges are re-estimated for every year from 1990 to 2024. The relationships between indicators in 1995 may differ structurally from those in 2020. Atlas captures that drift.

### Edge Relationship Breakdown (7,368 Total)

| Type | Count | Description |
|------|-------|-------------|
| Linear | 4,098 | Direct proportional cause-and-effect relationships across the full dataset |
| Threshold | 2,456 | Relationships that activate or reverse beyond a critical value; common in governance and trade |
| Quadratic | 718 | Inverted-U or U-shaped dynamics; peak effects followed by reversal |
| Logarithmic | 81 | Rapid early effects that plateau; typical in health and literacy gains |
| Saturation | 15 | Strong early gains that asymptote toward a physical or social ceiling |

### Data Sources
World Bank WDI · V-Dem · UNESCO · WHO · World Inequality Database · and 6 additional authoritative sources

---

## 8. Findings

- Headline: **What 35 years of data reveals.**
- Intro:

> We did not impose a theory about how development works. We let the data reveal the causal structure — and several findings challenge textbook assumptions.
>
> These patterns emerge consistently across income groups and time periods, though the strength of each relationship varies by development stage. That variance is itself the insight.

### Finding 1: Governance
- Title: **Education drives GDP through institutions, not directly**
- Body: Education spending does not affect GDP via a simple human-capital channel. The causal chain runs through governance quality: investment in education builds institutional capacity, which creates the conditions for growth. The link "Education → Governance → GDP" is consistent across income groups — but its strength varies dramatically.

### Finding 2: Democracy
- Title: **Democracy is not a luxury — but the direction reverses**
- Body: Civil society participation and media freedom are causally upstream of economic outcomes in emerging economies. In advanced economies, the relationship reverses: economic stability deepens democratic institutions. The same policy implications do not hold across development stages.

### Finding 3: Environment
- Title: **Environmental degradation is a multi-hop economic shock**
- Body: CO₂ emissions, deforestation, and resource depletion feed through health costs, then into reduced labor productivity, then into economic contraction. These chains span 3–4 causal hops and are invisible to single-variable studies. Atlas traces every step.

### Finding 4: Trade
- Title: **Trade openness has a threshold — below it, vulnerability; above it, growth**
- Body: Below a critical level of institutional quality, increased trade exposure correlates with economic vulnerability. Above that threshold, the relationship turns strongly positive. This explains why identical trade policies produce opposite results in different countries — and why the IMF's one-size prescription has failed.

---

## 9. Pull Quote

> Development is not a ladder. It is a web of interconnected causes and effects, and pulling on one thread moves the entire fabric.

— Atlas · Causal Discovery in Development Economics

---

## 10. Who It's For

- Section label: **Who It's For**
- Headline: **Built for anyone who needs to understand what actually works.**

### Card 1: 🏛️ Policymakers & Governments
Test interventions before committing resources. Instead of asking "should we invest in education or health?" — ask "if we increase primary enrollment by 15% in our country, what happens to governance indicators, GDP, and health outcomes over the next five years?" Atlas gives you the causal answer.

### Card 2: 🔬 Researchers & Academics
Explore causal hypotheses across 178 countries and 35 years without building your own dataset. The temporal dimension reveals how relationships evolve — critical for understanding development transitions. Full methodology documentation and data provenance at every node.

### Card 3: 🌍 The Curious Public
No economics background required. Atlas is designed to be explored at any depth — from the broad shape of global development to the specific causal pathway between sanitation and school attendance in a single country. The data is for everyone.

---

## 11. Final CTA

- Headline: **See the web of *cause and effect.***
- Body: **178 countries. 35 years. 7,368 causal relationships. Atlas is free, open, and running now.**
- Primary CTA: **Launch Atlas →**
- Secondary CTA: **Read the Methodology**

---

## 12. Footer

- Logo: **Atlas** · Argon Analytics
- Links: Launch Tool · Methodology · Contact · hello@argonanalytics.com
- Copy: © 2026 Argon Analytics
