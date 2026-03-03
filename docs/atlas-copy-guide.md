# Atlas — Copy & Content Guide

## Voice

Atlas speaks like a sharp researcher presenting at a TED talk — not reading a paper, not pitching investors. Every sentence earns its place.

### Principles

1. **Lead with the question, not the answer.** Atlas is driven by curiosity. "What actually drives human progress?" is the thesis — everything orbits it.

2. **Concrete over abstract.** Don't say "leveraging data-driven insights." Say "tracing how a country's education spending in 2003 shaped its GDP growth by 2015."

3. **Active voice, present tense.** "Atlas maps 94 development indicators across 178 countries" — not "94 indicators have been mapped."

4. **Short paragraphs.** Two to three sentences max. White space is part of the message.

5. **No hype words.** Banned: revolutionary, cutting-edge, game-changing, unlock, empower, leverage, synergy, holistic, robust, seamless. If it sounds like a pitch deck, rewrite it.

6. **Numbers are punctuation.** Use them frequently and precisely. "178 countries. 35 years. 94 indicators." Not "hundreds of countries and decades of data."

---

## Headline Style

Headlines are questions or declarative statements. Never exclamatory. Never more than 8-10 words.

**Good:**
- "What actually drives human progress?"
- "Cause and effect, mapped"
- "35 years of global development, connected"
- "Not correlation. Causation."

**Bad:**
- "The World's Most Advanced Development Analytics Platform!"
- "Empowering Policymakers with Data-Driven Insights"
- "Unlock the Future of Development Economics"
- "See How We're Changing the World"

---

## Section Labels

Uppercase, muted (`--atlas-text-muted`), wide letter-spacing. These orient the reader without shouting.

**Examples:**
- METHODOLOGY
- THE DATA
- CAPABILITIES
- WHO THIS IS FOR
- FINDINGS

---

## Describing the Tool

Atlas is a "causal discovery visualization" or "research instrument." Not a "platform," "solution," or "product."

| Use | Avoid |
|-----|-------|
| Research instrument | Platform / Solution |
| Causal map | Dashboard |
| Interactive visualization | Tool (acceptable in casual context) |
| Explores / reveals / traces | Leverages / unlocks / enables |
| Development indicators | KPIs / metrics |
| Countries | Markets / regions (unless literally discussing regions) |

---

## Describing the Research

The research behind Atlas uses **causal discovery** — algorithms that infer cause-and-effect relationships from observational data, not just correlations.

Key phrases to use:
- "Causal discovery, not just correlation"
- "Structural causal models"
- "178 countries, 35 years, 94 indicators"
- "What causes what — and how strongly"
- "Temporal causal graphs" (when being technical)
- "Year-specific causal structures" (the graphs change over time)

Key phrases to avoid:
- "AI-powered" (technically true but sounds like marketing)
- "Machine learning model" (undersells — this is causal inference, not prediction)
- "Big data" (dated)
- "Predictive analytics" (Atlas explains, it doesn't predict)

---

## Audience-Specific Framing

### Researchers / Academics
Emphasize methodology rigor. Mention PC algorithm, SHAP values, temporal stability. Use technical terms without over-explaining. They want to know *how* you know, not just *what* you found.

### Policymakers / Development Orgs
Emphasize actionable insight. "If you increase education spending, what downstream effects can you expect in 10 years?" They want causal chains that map to levers they can pull.

### General Smart Audience
Emphasize the "aha" moment. "You think GDP drives everything? The data shows education access has a stronger causal effect on life expectancy than income does." They want surprising, concrete findings.

---

## CTA Language

CTAs are invitations to explore, not commands to convert.

**Good:**
- "Explore the map"
- "See the data"
- "Start exploring"
- "Try a simulation"

**Bad:**
- "Get started free"
- "Request a demo"
- "Sign up now"
- "Learn more" (too generic — say what they'll learn)

---

## Stat Formatting

- Large number + muted label beneath
- Numbers use no comma for thousands in display context (use spacing: `178` not `178,`)
- Years are always four digits: `1990–2024`
- Use en-dash for ranges: `1990–2024`, not `1990-2024`
- Percentage precision: one decimal max in display, integers when possible

**Example stat block:**
```
178          35           94
countries    years        indicators
```

---

## Footer / Legal Tone

Minimal. No "All rights reserved" unless legally required. No lengthy disclaimers. Just the essentials:

```
Atlas — A research project by Argon Analytics
Data sources: World Bank, UN, WHO, UNESCO
```
