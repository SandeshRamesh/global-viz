# Atlas: Causal Discovery and Scenario Simulation for Development Policy Under Mechanism Heterogeneity

---

## Abstract

Atlas presents a claim-traceable causal discovery and scenario simulation framework for development analysis. The current release analyzes 18,296,578 panel observations across 893 country entities and 3,122 indicators from 1990 to 2024. The discovery pipeline proceeds in three stages: 2,159,672 pairwise Granger causality tests yield 564,545 FDR-corrected candidates; PC-Stable structure learning reduces these to 58,837 directed edges; and bootstrap validation (100 iterations) retains 4,976 robust edges. Runtime assets include 5,054 temporal graphs and 5,053 SHAP importance files served through a multi-scope simulation engine.

We report four anchor findings from the full 140-graph, 35-year corpus, each representing a distinct mechaniss class: a development-stage reversal in education–fertility linkage (F02), a governance threshold dynamic for local election quality (F06), a complete mediation pathway from spending to agricultural income distribution (F08), and a stable upstream predictor for income accumulation (F01). Each finding is documented with stratum-level effect sizes, confidence intervals, and explicit uncertainty flags.

The main contribution is twofold. Methodologically, Atlas integrates evidence-governed narrative synthesis so that every published claim traces to a registered evidence anchor. Substantively, the findings demonstrate that mechanism heterogeneity—sign reversals, threshold effects, and mediated transmission—materially changes policy interpretation and renders one-size-fits-all intervention design unreliable.

**Keywords:** causal discovery, development economics, Granger causality, directed acyclic graphs, mechanism heterogeneity, policy simulation

---

## 1. Introduction

Development economics routinely faces causal questions under sparse interventions and noisy observational data. Standard panel methods provide useful estimates but can obscure mechanism heterogeneity when treatment effects vary by institutional context, income structure, or governance regime. Atlas addresses this by combining staged causal discovery with graph-based simulation and explicit uncertainty governance.

The central argument of this paper is that methodological rigor in discovery is necessary but not sufficient for policy impact. Public and policy value depends equally on how findings are translated: whether caveats survive narrative compression, whether evidence remains traceable, and whether contradictory artifacts are resolved before publication. Atlas was designed around that full-stack requirement, linking discovery outputs, serving artifacts, and narrative claims through registries and audit checks so that each policy-facing statement traces to an evidence anchor.

### 1.1 Contributions

First, Atlas demonstrates a scalable staged pipeline for temporal precedence screening, structural pruning, and bootstrap retention, with explicit artifact counts and validation checkpoints at each stage. Second, it produces a class-diverse findings set from complete 140-graph, 35-year coverage rather than a single-class leaderboard. Third, it operationalizes AI-assisted narrative synthesis with quantitative guardrails, making prose outputs auditable rather than purely generative. The contribution is therefore methodological and translational: Atlas provides a reproducible path from high-dimensional causal discovery to public-facing documents without dropping uncertainty or provenance.

### 1.2 Paper Structure

Section 2 positions Atlas within the causal discovery and development economics literature. Section 3 describes data sources, the three-stage pipeline, and validation architecture. Section 4 presents four anchor findings with full evidence and uncertainty structure. Section 5 discusses implications for research practice, policy design, and AI-assisted reporting. Section 6 concludes with deployment guidance and limitations.

---

## 2. Related Work

## 2. Related Work

Atlas sits at the intersection of three research streams: causal discovery in observational settings, mechanism heterogeneity in development economics, and interpretability governance in policy-facing models. This section positions the Atlas pipeline against each stream and identifies the integration gap that motivates the present contribution.

### 2.1 Causal Discovery in Observational Settings

The temporal precedence framework introduced by Granger (1969) remains the most widely deployed screening test for directed relationships in panel data. By conditioning on lagged values, Granger tests establish whether past values of one series improve prediction of another—a necessary but insufficient condition for causality. Atlas uses Granger tests as the first-stage filter precisely because they scale to millions of pairwise comparisons while providing a defensible temporal ordering prior.

Structural approaches emerged to recover richer causal graphs from conditional independence patterns. Spirtes, Glymour, and Scheines (2000) formalized constraint-based structure learning through the PC algorithm, and Pearl (2009) provided the theoretical foundation linking directed acyclic graphs to interventional reasoning. A practical limitation of the original PC algorithm is its sensitivity to variable ordering in high-dimensional settings. Colombo and Maathuis (2014) resolved this with the PC-Stable modification, which produces order-independent adjacency searches and orientation rules. Atlas adopts PC-Stable for its second-stage structural pruning because order-independence is essential when processing thousands of candidate edges derived from heterogeneous indicator sets.

Recent work has extended causal discovery to large-scale time series applications. Runge, Nowack, Kretschmer, Flaxman, and Sejdinovic (2019) introduced the PCMCI algorithm, which combines a modified PC adjacency search with momentary conditional independence tests to handle autocorrelation—a pervasive feature of climate and geophysical data. PCMCI demonstrated that staged discovery (condition selection followed by causal testing) outperforms full-conditioning approaches in detection power across hundreds of variables. Atlas shares this staged design philosophy but addresses a different domain: country-level socioeconomic panels where the number of entities (893) and indicators (3,122) is large, time horizons are short (35 years), and mechanism heterogeneity is the primary analytical concern rather than autocorrelation alone.

The distinctive feature of the Atlas pipeline relative to these methods is not a new estimator but a governed integration: Granger prefiltering controls the candidate space, PC-Stable provides structural pruning, and bootstrap retention (100 iterations) imposes stability requirements. Each stage produces auditable artifact counts, making the reduction from 2.1 million candidates to 4,976 retained edges transparent and reproducible.

### 2.2 Development Economics and Mechanism Heterogeneity

Development economics has a long tradition of seeking credible identification in observational data. Angrist and Pischke (2009) codified the modern identification toolkit—instrumental variables, regression discontinuity, and difference-in-differences—establishing standards for isolating causal effects from cross-sectional and panel variation. A foundational application is Acemoglu, Johnson, and Robinson (2001), who used historical settler mortality as an instrument for institutional quality, demonstrating that institutional differences account for large cross-country income gaps even after controlling for geography. This work established institutional context as a first-order determinant of development outcomes, a finding that Atlas corroborates structurally through governance-related edges in its causal graphs.

A central challenge these methods share is that estimated effects often assume homogeneity across units or strata. Vogl (2016) documented a striking reversal in the relationship between income and fertility across the demographic transition: before 1960, children from larger families in developing countries had richer, more educated parents; by century's end, the pattern had inverted. Roughly half of this reversal was attributable to rising aggregate parental education. This finding—that the sign of a fundamental development relationship depends on the stage of transition—directly parallels the education–fertility reversal that Atlas identifies as anchor finding F02, where the direction of the education–fertility linkage flips between income strata.

More recently, Chernozhukov, Demirer, Duflo, and Fernández-Val (2025) developed a generic framework for detecting heterogeneous treatment effects in randomized experiments using machine learning proxies. Their approach post-processes ML predictions into group-level average effects and best linear predictors without requiring consistency of the underlying ML method. The framework demonstrates that treatment effect heterogeneity is not a nuisance parameter but an object of primary scientific interest—a principle Atlas operationalizes by classifying findings into mechanism types (reversal, threshold, mediation, stable-upstream) rather than reporting pooled averages.

Atlas extends this heterogeneity concern from experimental to observational discovery settings. Where Vogl (2016) documents reversal in a single variable pair and Chernozhukov et al. (2025) provide inference tools for known treatments, Atlas applies stratified causal discovery across the full indicator space to identify which mechanism class governs each pathway. The finding that mechanism class varies systematically by development stratum—not just effect magnitude—has direct implications for policy transfer: interventions designed from pooled coefficients risk sign errors when transported across income regimes.

### 2.3 Interpretability and Evidence Governance in Policy-Facing Models

Translating complex model outputs into actionable policy guidance requires interpretability infrastructure. Lundberg and Lee (2017) introduced SHAP (SHapley Additive exPlanations), which assigns each feature a contribution value for individual predictions grounded in cooperative game theory. Atlas generates SHAP importance files at runtime for each of its 5,053 scope-specific models, enabling decomposition of scenario simulations into driver-level contributions.

However, interpretability at the feature level does not address a more fundamental governance problem: whether published claims faithfully represent the underlying evidence. Kapoor and Narayanan (2023) documented a systemic reproducibility crisis in ML-based science, finding data leakage and methodological errors across 294 papers in 17 fields. Their proposed solution—model info sheets that make analytical choices auditable—shares the same design principle as Atlas's claim registry: every published statement should trace to a verifiable evidence anchor, and the path from data to claim should be inspectable by third parties.

Atlas operationalizes this principle through a claim-registry and human-gate system. AI-assisted narrative synthesis accelerates prose generation, but registered evidence anchors hold authority on quantitative truth. Contradiction closure is required before publication, and quality-control reports accompany all narrative outputs. This approach treats evidence governance not as an afterthought but as a structural requirement of the research-production pipeline.

### 2.4 Positioning

Atlas occupies the intersection of these three streams. Its causal discovery layer draws on Granger screening, PC-Stable structure learning, and bootstrap stability—established methods combined in a staged pipeline. Its findings contribute to the development economics literature on mechanism heterogeneity by demonstrating that sign reversals, threshold effects, and mediated transmission systematically vary by development context. Its evidence governance layer addresses the reproducibility concerns raised by Kapoor and Narayanan (2023) through claim-level traceability and uncertainty-preserving narrative rules. The novelty is not a new estimator but a disciplined, full-stack integration: from staged discovery through runtime serving to auditable, policy-facing narrative synthesis.

---

## 3. Data and Methods

### 3.1 Data Sources and Integration

The validated corpus contains 18,296,578 panel rows across 893 country entities and 3,122 indicators, spanning 1990–2024. Atlas integrates nine institutional source families and two internal classification datasets, summarized in Table 1.

**Table 1: Active Data Sources**

| Source | Provider | Indicators | Coverage |
|--------|----------|-----------|----------|
| World Development Indicators | World Bank | 169 | Global panel |
| V-Dem Dataset | V-Dem Institute | 456 | Political institutions |
| UNESCO Institute for Statistics | UNESCO | 446 | Education |
| World Inequality Database | WID | 296 | Income distribution |
| Quality of Government | QoG Institute | 85 | Governance |
| International Comparison Program | World Bank | 91 | Price levels |
| World Bank Open Data | World Bank | 68 | Development |
| Penn World Table 10.0 | U. of Groningen | 10 | National accounts |
| Global Health Observatory | WHO | 2 | Health |
| Atlas Income Classifications | Atlas (internal) | — | Stratum assignment |
| Atlas Regional Groups | Atlas (internal) | — | Region mapping |

Integration proceeds in four passes: structural normalization to a common schema; semantic reconciliation of indicator identities; temporal-completeness filtering with explicit exclusion logging; and registry synchronization linking ingest outputs to dataset and evidence registries. Atlas treats missingness handling as a causal-risk control: naive handling can overrepresent well-observed country-year pockets while suppressing structurally important low-coverage signals.

All active sources carry canonical and archival URLs in the dataset registry, and narrative claims are permitted only for sources with complete provenance fields.

### 3.2 Causal Discovery Pipeline

Atlas uses a three-stage pipeline because each stage answers a different statistical question and addresses a different failure mode. Table 2 summarizes the progressive contraction.

**Table 2: Pipeline Funnel — Progressive Edge Contraction**

| Stage | Method | Edges | Retention | Purpose |
|-------|--------|------:|----------:|---------|
| A2 | Granger causality (lag 5, FDR q<0.05) | 564,545 of 2,159,672 tested | 26.1% | Temporal precedence screening |
| A3 | PC-Stable conditional independence | 58,837 | 10.4% of A2 | Structural pruning |
| A4 | Bootstrap retention (100 iterations) | 4,976 | 8.5% of A3 | Stability validation |

**Stage A2: Granger Causality Prefiltering.** Stage A2 tests whether lagged history of a candidate source variable X improves prediction of target Y beyond Y's own history. This is a temporal precedence filter—necessary evidence for directional plausibility, not sufficient evidence for causal identification. The 73.9% pruning rate is expected in high-dimensional observational settings where many pairwise correlations are weak or temporally non-predictive. A2 is intentionally permissive: the goal is to avoid discarding plausible temporal candidates before structural testing.

**Stage A3: PC-Stable Structure Learning.** Stage A3 applies conditional-independence logic to remove edges explainable by confounder structures. Where A2 asks whether X temporally precedes Y, A3 asks whether X still contributes when candidate confounders are conditioned on. The key limitation is that conditional-independence decisions depend on observed variables; unmeasured confounding can still distort orientation and adjacency.

**Stage A4: Bootstrap Effect Estimation.** Stage A4 estimates edge effect sizes and stability using 100 bootstrap iterations, retaining edges that satisfy retention and interval-sign coherence criteria. The 8.5% retention rate relative to A3 reflects a conservative reliability posture that favors persistent edges over edges that appear strong in a single fit but are unstable under perturbation. Bootstrap output is treated as a robustness filter and uncertainty proxy, not complete uncertainty characterization—Atlas documents known CI miscalibration risks from earlier phases.

**Why Three Stages.** A single-stage approach at this dimensionality tends to produce either dense and uninterpretable or sparse and brittle graphs. The staged design allows A2 to be broad, A3 to be structurally selective, and A4 to be reliability-selective. For policy audiences, the practical benefit is that each finding can be framed with both a mechanism class and an uncertainty class. For replication, each stage produces independent diagnostics.

### 3.3 SHAP Importance Analysis

Atlas uses TreeSHAP feature attribution (Lundberg & Lee, 2017 [CITE]) as a contribution diagnostic alongside causal edges. The serving corpus includes 5,053 temporal SHAP files and 286 regional SHAP files. SHAP and causal edges are interpreted jointly: when SHAP concentration and edge stability align, confidence in mechanism framing improves; when they diverge, Atlas elevates uncertainty language. SHAP-based statements are always paired with causal-stage context to prevent misrepresentation of feature importance as intervention effect size.

### 3.4 Simulation Engine

The simulation engine propagates user-defined interventions through validated directed graphs with damping, horizon control, and optional nonlinear handling. Output is interpreted as comparative scenario movement, not absolute point forecasts. This distinction was learned through failure: V3.0 attempts to use propagation as an absolute forecaster were documented as a failure (FAIL-0001) and replaced with comparative framing.

The runtime supports unified, stratified (by income tier), country, and regional scopes, with 178/178 canonical countries mapped to regions. Regional analysis introduces aggregation risk from edge-union density inflation, which Atlas mitigates with explicit warnings, year-scope fallbacks, and contributor coverage reporting.

### 3.5 Validation Architecture

System validation is anchored to certified production status, with Phase 2A passing 4,749/4,767 files (99.6%) and Phase 2B passing 4,680/4,768 files (98.2%). Validation operates at four levels: panel integrity (row/entity/indicator counts), runtime coherence (graph/SHAP/baseline alignment by scope), findings robustness (coverage across years and strata), and contradiction closure (zero unresolved conflicts at package freeze). Citation-link audits report zero missing and zero unknown evidence links.

### 3.6 Failure-Aware Framing

Atlas carries four documented failures into current methodology:

- **FAIL-0001:** Absolute forecasting framing failed validation; replaced by comparative scenario framing.
- **FAIL-0002:** Direction-only claims were unstable under resampling; now require corroboration.
- **FAIL-0003:** Confidence intervals showed miscalibration risk; conservative caveat policy adopted.
- **FAIL-0004:** V1 coverage handling caused sample-dropout cascades; stricter panel-density filtering implemented.

These failures are not rhetorical disclaimers—they change what Atlas considers publishable and how policy implications are phrased.

### 3.7 Findings Extraction Governance

The extraction pipeline evaluated 11,632 candidates across the 140-graph, 35-year frame. The ranked top-10 was diversified by mechanism class: 4 reversals, 3 mediations, 2 thresholds, and 1 outcome-surprise. The public top-4 preserves one finding from each class to communicate the true mechanism heterogeneity in the corpus and prevent readers from overgeneralizing a single pattern. Each public finding carries four minimum evidence fields: availability, effect summary, uncertainty flags, and caveat language.

### 3.8 Statistical Interpretation Rules

This paper applies four interpretation rules. First, availability precedes novelty: a surprising claim with weak coverage is treated as exploratory, not anchor-grade. Second, mechanism class precedes policy implication: recommendations differ by finding type. Third, uncertainty flags are mandatory narrative elements, not optional footnotes. Fourth, policy language cannot exceed method framing: comparative scenario framing is preserved throughout.

---

## 4. Findings

### 4.1 Education–Fertility Reversal (F02)

**What we found.** The edge from College Enrollment Gender Gap to Birth Rate is active in all 140 graphs and all 35 years, but its direction reverses by development stratum. In unified, developing, and emerging strata the relationship is negative; in the advanced stratum it is positive. This is a full-coverage heterogeneity signal, not a sparse anomaly.

**Table 3: F02 — Stratum-Level Effect Sizes**

| Stratum | β | 95% CI | Positive Years | Negative Years |
|---------|----:|--------|---------------:|---------------:|
| Unified | −0.674 | [−0.704, −0.643] | 0 | 35 |
| Developing | −0.665 | [−0.712, −0.616] | 0 | 35 |
| Emerging | −0.554 | [−0.649, −0.459] | 0 | 35 |
| Advanced | +0.255 | [+0.128, +0.361] | 34 | 1 |

The directional reversal does not depend on missing years because availability is complete. This shifts interpretation toward genuine heterogeneity in mechanism structure across development regimes rather than artifact of data gaps.

**Mechanistic interpretation.** F02 challenges pooled-effect reasoning. A pooled model would compress this edge into one average sign and suppress the policy-relevant fact that direction inverts by stratum. A plausible interpretation is that the indicator reflects different social processes across development stages—educational access expansion associated with lower fertility in one regime, and labor-market or demographic structures producing a different association in another. Atlas does not claim unique mechanism identification; it claims the reversal is empirically robust and policy-relevant.

**Policy implications.** Interventions should be scoped with stratum diagnostics and tested under local scenario runs before scale-up. Evaluation design should use stratified impact reporting rather than pooled headline averages. Comparative pilots should include explicit directional checks before national rollout.

**Uncertainty.** F02 carries the flag `cross_strata_sign_instability`. The finding is strong on coverage but still requires local validation because stratum-level averages do not capture all within-stratum heterogeneity.

---

### 4.2 Governance Threshold Dynamics (F06)

**What we found.** The edge from Local Government Power to Local Election Quality exhibits threshold behavior at score 3.0, active in 140/140 graphs and 35/35 years. Below and above threshold, countries show different response profiles.

**Table 4: F06 — Threshold Slopes by Stratum**

| Stratum | β below | β above | Threshold Years Active |
|---------|--------:|--------:|-----------------------:|
| Unified | 0.219 | 0.087 | 35/35 |
| Developing | 0.224 | 0.085 | 14/35 |
| Emerging | 0.254 | 0.077 | 26/35 |
| Advanced | 0.059 | 0.013 | 35/35 |

In 2024, 66 countries fall below the threshold and 108 above (174 total with coverage; 4 missing).

**Mechanistic interpretation.** F06 suggests regime-dependent marginal returns. Below the threshold, increments in local government power are associated with larger election-quality gains; above threshold, incremental response is smaller. The key policy insight is sequencing: below-threshold countries may unlock larger gains from capacity investments, while above-threshold countries may need complementary quality and enforcement reforms.

**Policy implications.** Governance programs should classify current threshold position before setting implementation sequence. Monitoring plans should include threshold position and transition metrics as primary indicators, not only outcome-level scores.

**Uncertainty.** F06 carries `ci_missing_or_sparse`. Note that all stratum-level CIs are null in the findings package. Atlas treats threshold topology as high-confidence but avoids over-precision in magnitude statements.

---

### 4.3 Fiscal Mediation Pathway (F08)

**What we found.** The directed path from Average Spending per Person through Average Pre-tax Government Income to Agricultural Income Distribution is active in all 140 graphs and all 35 years. The direct edge (spending → agricultural income) is absent in all 140 graphs. This satisfies Atlas mediation criteria with clean topology: transmission runs entirely through the fiscal mediator.

**Table 5: F08 — Mediation Hop Coefficients by Stratum**

| Stratum | β_ab (Source→Mediator) | β_bc (Mediator→Target) | Indirect Product | Direct β_ac |
|---------|--------:|--------:|---------:|---:|
| Unified | 0.819 | 0.706 | 0.578 | absent |
| Developing | 0.835 | 0.826 | 0.689 | absent |
| Emerging | 0.821 | 0.739 | 0.607 | absent |
| Advanced | 0.922 | 0.977 | 0.900 | absent |

**Mechanistic interpretation.** F08 implies that spending-side changes transmit through fiscal income structure before affecting agricultural distribution outcomes. This is stronger than a "both direct and indirect" finding—the direct edge is structurally absent, making this a mediated-channel finding by construction. Endpoint-only interventions can underperform when mediator dynamics are not addressed.

**Policy implications.** Programs targeting agricultural distribution should track the fiscal-income mediator explicitly. Dashboards should include hop-level metrics. If the source-to-mediator hop fails to move, endpoint expectations should be revised before scaling. Funding architecture should consider tranche release conditions tied to mediator movement rather than endpoint-only thresholds.

**Uncertainty.** F08 carries `ci_missing_or_sparse`. Topology confidence is high (complete coverage); magnitude confidence is moderate.

---

### 4.4 Stable Upstream Predictor (F01)

**What we found.** The edge from Average Adult Government Benefits to Average Accumulated Income Per Person is one of the most stable links in the corpus: active in 140/140 graphs and 35/35 years with strongly positive coefficients across all strata.

**Table 6: F01 — Stratum-Level Stability**

| Stratum | β | 95% CI | Decade Means |
|---------|----:|--------|-------------|
| Unified | 0.984 | [0.920, 1.055] | 1990s: 0.977, 2000s: 0.959, 2010s: 0.969, 2020s: 0.933 |
| Developing | 0.984 | [0.931, 1.042] | — |
| Emerging | 0.945 | [0.847, 1.050] | — |
| Advanced | 0.940 | [0.843, 1.035] | — |

**Mechanistic interpretation.** F01 is an outcome-surprise finding: it ranks highest on stability and effect-size composite for income accumulation. Its value is less about novelty and more about reliability as a benchmark edge. When scenario settings or preprocessing choices materially alter this edge, analysts have a clear diagnostic signal that something in the pipeline changed.

**Policy implications.** F01 can serve as a baseline lever in early scenario design because of its cross-strata stability. Stable does not mean universal—administrative feasibility, transfer design quality, and governance constraints still determine real-world performance.

**Uncertainty.** F01 has no explicit uncertainty flag, but Atlas still applies conservative interpretation: even highly stable edges do not justify deterministic point forecasting.

---

### 4.5 Cross-Finding Synthesis

The four anchor findings provide the mechanism classes needed for policy-grade interpretation: reversal, threshold, mediation, and stable-upstream. The combination matters because each class carries a different failure mode and demands a different policy response.

**Table 7: Mechanism Class Comparison**

| Finding | Class | Primary Failure Mode | Policy Response |
|---------|-------|---------------------|-----------------|
| F02 | Reversal | Pooled-sign transfer error | Stratified design, directional pilots |
| F06 | Threshold | Bad sequencing / regime mismatch | Classify position before intervention |
| F08 | Mediation | Endpoint-only targeting | Track mediator, gate on intermediate movement |
| F01 | Stable upstream | Transportability overconfidence | Use for baseline calibration, validate locally |

Six additional shortlisted findings (F03–F05, F07, F09–F10) reinforce this diversity: three additional reversals confirm that sign inversion is not unique to one variable pair; one additional threshold finding shows regime-dependent behavior is not limited to governance variables; and two additional mediation pathways into income accumulation strengthen the view that mediated transmission is a recurring structural pattern.

### 4.6 What the Findings Do Not Prove

Atlas findings are directional and structural signals in observational data, not proofs of intervention invariance. F08 shows a persistent mediated path topology but does not prove that any spending intervention will reproduce the same effect under all implementation designs. F06 identifies threshold behavior but does not guarantee that crossing the threshold by policy design yields specific gains without complementary institutional factors. F02 demonstrates sign reversal but does not imply every country within a stratum follows the same sign at all times. F01 demonstrates stable association but does not guarantee deterministic response to policy changes.

These non-claims are necessary boundaries for honest use. Atlas is most valuable when these boundaries are explicit because they help teams avoid policy overconfidence while still making evidence-informed decisions.

---

## 5. Discussion

### 5.1 Mechanism Heterogeneity as a First-Order Concern

The anchor findings support a broad conclusion: mechanism heterogeneity is not a peripheral detail in development analysis—it directly changes intervention strategy. F02 shows that directional assumptions can reverse by stratum. F06 shows that regime position determines marginal returns. F08 shows that endpoint effects operate through intermediaries even when direct edges are absent. F01 shows that some edges remain stable enough to anchor scenario baselines.

For development research, this implies that evaluation design should avoid overreliance on pooled coefficients and report mechanism class explicitly. For policy practice, it implies staged planning: diagnose stratum and threshold position, validate mediator movement, and prioritize robust edges for early scenario exploration.

### 5.2 Implications for Development-Economics Practice

Three operational shifts follow from these findings. The first is stratified design by default: if sign reversal is common among high-coverage findings, pooled-effect policy transfer should be treated as risky unless validated locally. The second is mechanism-aware sequencing: threshold and mediation findings indicate that policy order can matter as much as policy content. The third is uncertainty-forward publication: decision memos should include caveats as standard fields, not appendices.

### 5.3 What Atlas Does Not Claim

Atlas does not claim experimental identification for all pathways. Mediation findings are path-persistence findings under observational structure, not randomized causal proofs. Threshold values are empirical regime markers, not universal constants. Stable edges are robust in this dataset, not guaranteed across all future data-generating processes. These limits define appropriate use: comparative scenario design with explicit local validation and transparent uncertainty handling.

### 5.4 Implications for AI-Assisted Research Reporting

Atlas offers a template for AI-assisted reporting under high-accuracy requirements. Three rules govern the approach: separate generation from validation (AI accelerates drafting but registries hold authority on quantitative truth); require contradiction closure before publication (AI can produce internally coherent text that conflicts with source artifacts); and publish quality-control reports alongside narratives so readers can inspect whether constraints were enforced.

### 5.5 Future Work

Within current evidence constraints, next steps include deeper finding-level diagnostics, expanded mediator robustness checks, clearer reporting of year-specific regime shifts, and improved mapping between legacy v2/v2.1 artifacts and v31 identifiers. Systematic falsification tests—defining one plausible null pathway per anchor finding and testing whether it remains absent—would further strengthen confidence. Any extension should preserve the same governance principle: no numeric claim without traceable evidence linkage and no confidence framing without uncertainty disclosure.

---

## 6. Conclusion

Atlas demonstrates that research-grade synthesis of large causal corpora requires evidence governance, failure transparency, and uncertainty-preserving writing rules alongside statistical methodology. The current release provides all three while maintaining full-coverage anchor findings across four mechanism classes.

For researchers, the result is a reproducible and auditable findings package where every narrative claim traces to a registered evidence anchor. For policymakers, it is a structured scenario tool with explicit limits and actionable interpretation guidance. The central credibility claim is procedural: Atlas makes evidence traceability and uncertainty transparency operational requirements rather than optional annotations.

The practical recommendation for teams applying these findings is a five-step checklist: identify mechanism class before interpreting magnitude; verify availability and uncertainty flags; map findings to local policy levers; run local validation before scaling; and document one explicit caveat in every recommendation memo.

Atlas is positioned as a comparative decision-support system, not an absolute forecaster. That positioning reflects both the statistical limitations of observational causal analysis and the documented failures that shaped current methodology. The framework is most effective when teams treat it as a structured hypothesis engine—narrowing intervention search spaces and improving monitoring design—while preserving the institutional judgment and field evidence needed for durable outcomes.

---

## Appendix A: Practical Guidance for Applied Researchers

Applied researchers should treat Atlas findings as hypothesis accelerators. For behavior-change interventions where context heterogeneity is suspected, begin with reversal findings. For institutional sequencing questions, begin with threshold findings. For complex systems where endpoint outcomes lag, begin with mediation findings. For baseline sensitivity analysis, begin with stable-upstream findings.

To build a replicable case study: select one anchor finding, choose two comparator countries with different mechanism risk profiles, define the same intervention scenario for both, run scope-consistent simulations, and record divergence in pathway behavior mapped to mechanism class assumptions. Publishing this structure alongside findings improves external trust.

## Appendix B: AI-Assisted Workflow Disclosure

This paper used AI assistance for prose drafting, restructuring, and readability editing. AI was not used to rerun discovery stages, compute new coefficients, or modify the underlying causal corpus. All quantitative statements originate from registered claims and findings artifacts. AI use is bounded by evidence-linkage checks, numeric integrity checks, uncertainty-caveat checks, failure-transparency checks, and cross-document consistency checks. Human review gates (H1 findings-strength, H2 scientific framing, H3 publication-readiness) retain final authority.

---

## References

Acemoglu, D., Johnson, S., & Robinson, J. A. (2001). The colonial origins of comparative development: An empirical investigation. *American Economic Review*, 91(5), 1369–1401.

Angrist, J. D., & Pischke, J.-S. (2009). *Mostly Harmless Econometrics: An Empiricist's Companion*. Princeton University Press.

Chernozhukov, V., Demirer, M., Duflo, E., & Fernández-Val, I. (2025). Generic machine learning inference on heterogeneous treatment effects in randomized experiments, with an application to immunization in India. *Econometrica*, 93(4), 1103–1164.

Colombo, D., & Maathuis, M. H. (2014). Order-independent constraint-based causal structure learning. *Journal of Machine Learning Research*, 15(116), 3921–3962.

Granger, C. W. J. (1969). Investigating causal relations by econometric models and cross-spectral methods. *Econometrica*, 37(3), 424–438.

Kapoor, S., & Narayanan, A. (2023). Leakage and the reproducibility crisis in machine-learning-based science. *Patterns*, 4(9), 100804.

Lundberg, S. M., & Lee, S.-I. (2017). A unified approach to interpreting model predictions. In *Advances in Neural Information Processing Systems 30* (pp. 4766–4777).

Pearl, J. (2009). *Causality: Models, Reasoning, and Inference* (2nd ed.). Cambridge University Press.

Runge, J., Nowack, P., Kretschmer, M., Flaxman, S., & Sejdinovic, D. (2019). Detecting and quantifying causal associations in large nonlinear time series datasets. *Science Advances*, 5(11), eaau4996.

Spirtes, P., Glymour, C., & Scheines, R. (2000). *Causation, Prediction, and Search* (2nd ed.). MIT Press.

Vogl, T. S. (2016). Differential fertility, human capital, and development. *Review of Economic Studies*, 83(1), 365–401.
