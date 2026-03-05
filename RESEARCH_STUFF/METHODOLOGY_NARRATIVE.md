# METHODOLOGY_NARRATIVE



## 1. Introduction

Atlas is a longitudinal causal-discovery and policy-simulation system built to move from large observational development panels to scenario guidance without hiding uncertainty. The system was developed over multiple generations (V1 through V3.1), and the current publication corpus is anchored to a production-certified runtime and a claim-level evidence ledger. The certification state is `CERTIFIED` and `PRODUCTION_READY`, meaning data artifacts, runtime interfaces, and validation checks all passed release criteria before narrative conversion began (Evidence: CLM-0001, CLM-0002).

The audited panel contains 18,296,578 rows, 893 country entities, and 3,122 indicators. Runtime serving assets include 5,054 temporal graph files, 5,053 temporal SHAP files, and 5,026 baseline files. Regional serving adds 286 graph files, 286 SHAP files, and 11 regional indicator-stat files, with country-to-region mapping validated at 178/178 canonical countries (Evidence: CLM-0005, CLM-0006, CLM-0007, CLM-0014, CLM-0015, CLM-0016, CLM-0017, CLM-0018, CLM-0019, CLM-0057).

The contribution is an integrated workflow where every numerical statement in public-facing documents traces to a registered claim, a concrete evidence anchor, and a known artifact path. Atlas treats provenance, contradiction handling, and uncertainty language as part of the scientific method, not as compliance afterthoughts.

### 1.1 Research Questions and Scope

Three research questions structure this work. First, methodological: can a multi-stage causal discovery pipeline preserve interpretability at Atlas scale while staying auditable end to end? Second, substantive: do high-coverage relationships reveal mechanism classes that matter for policy design—cross-strata reversals, threshold effects, mediated transmission chains? Third, operational: can those findings be translated into policy-ready prose without breaking evidence fidelity?

Atlas separates concerns accordingly. Discovery stages estimate directional structure under explicit assumptions. Runtime layers serve artifacts with scope-aware fallback. Narrative synthesis converts validated evidence into documents reviewable by technical and non-technical audiences without changing underlying numbers.

Scope boundaries are explicit: no new model training, no causal re-estimation, and no external claims not already represented in repository artifacts. The narrative documents are an evidence-grounded synthesis pass over validated outputs, not a new statistical experiment.

### 1.2 Origins and Early Failure Context

Atlas V1 targeted 174 countries across 65 years and 2,480 indicators. Early exports produced a combined graph with 162 nodes and 204 edges—the first complete ingestion-to-graph loop, but also the beginning of identified limits in sample retention and temporal coverage (Evidence: CLM-0023, CLM-0024).

The most consequential early failure was a data-coverage cascade. Under naive temporal-completeness handling, usable sample collapsed after filtering, making structure learning brittle. That failure (FAIL-0004) was resolved by reworking feature engineering around explicit panel-density constraints before causal estimation (Evidence: FAIL-0004).

Atlas documents pipeline changes as responses to specific breakages, not abstract improvements.

## 2. Data Sources and Integration

The active reproducibility registry contains 11 datasets with canonical and archival URLs, each linked to ingestion lineage. Only active rows (those with complete reproducibility metadata) are used for public claims, preventing citation drift between narrative text and fetchable source artifacts (Evidence: CLM-0054).

Atlas integrates institutional datasets with different definitions, update cycles, and country coverage conventions. Instead of forcing one universal source hierarchy, Atlas uses a controlled harmonization layer that preserves source identity while normalizing country keys, indicator IDs, and yearly indices for model compatibility.

### 2.1 Active Source Families

| Source | Provider | Indicators | Dataset ID |
|--------|----------|-----------|------------|
| International Comparison Program | World Bank | 91 | DS-0019 |
| Penn World Table 10.0 | U. of Groningen | 10 | DS-0023 |
| Quality of Government | QoG Institute | 85 | DS-0025 |
| UNESCO Institute for Statistics | UNESCO | 446 | DS-0033 |
| V-Dem Dataset | V-Dem Institute | 456 | DS-0039 |
| World Bank Open Data | World Bank | 68 | DS-0045 |
| World Development Indicators | World Bank | 169 | DS-0047 |
| Global Health Observatory | WHO | 2 | DS-0048 |
| World Inequality Database | WID | 296 | DS-0049 |
| Atlas Income Classifications | Atlas (internal) | — | DS-9001 |
| Atlas Regional Groups | Atlas (internal) | — | DS-9002 |

All nine institutional sources and two internal classification datasets carry canonical and archival URLs. Indicator counts reflect v2.1 labels. Each source is treated as reproducible for public claims only when required provenance fields are complete (Evidence: CLM-0054).

### 2.2 Integration Workflow

Integration proceeds in four controlled passes. Pass 1 is structural normalization, parsing source files into a common schema with country, indicator, year, value, and source columns. Pass 2 is semantic normalization, reconciling indicator IDs to prevent duplicate semantics in causal neighborhoods. Pass 3 is temporal compatibility filtering, excluding trajectories failing minimum continuity constraints. Pass 4 is registry synchronization, linking ingest outputs to dataset and evidence registries before downstream use.

Atlas treats missingness handling as a causal-risk control, not a preprocessing convenience. Naive handling can overrepresent well-observed country-year pockets while suppressing structurally important low-coverage signals. The current policy filters with transparency and carries exclusions into audit logs.

Documentation drift checks are part of integration QC. In this cycle, one artifact reported 9,926 outputs while a table reported 9,928. The contradiction was resolved through structured audit policy: frozen release claims must use structured validation artifacts, not prose headers. The contradiction register is closed to zero unresolved items (Evidence: CLM-0021, CLM-0022, CLM-0051).

### 2.3 Data Governance and Reproducibility Controls

Atlas uses three linked registries: dataset registry (source identity and access links), ingestion registry (fetch/parse lineage and version alignment), and evidence ledger (claim-to-artifact binding). Narrative conversion is allowed only when claim-evidence linkage is complete. If a value cannot be traced to a registered claim, it is excluded—claims are removed, not softened, when traceability fails.

The same governance rule applies to contextual citations: only references already in repository artifacts are permitted. New external claims are prohibited in this narrative phase.

## 3. Causal Discovery Pipeline

Atlas uses a staged pipeline because each stage answers a different statistical question and failure mode. A2 tests temporal precedence at scale. A3 removes conditionally spurious edges under multivariate constraints. A4 estimates effect sizes with bootstrap retention and significance filters. Keeping stages separate enables targeted diagnosis when claims are challenged.

A single-stage approach at this dimensionality tends to produce either dense-uninterpretable or sparse-brittle graphs. Atlas avoids that by allowing A2 to be broad, A3 structurally selective, and A4 reliability-selective. Pipeline lineage is anchored to V2.1 A2/A3/A4 outputs carried into V3.1/v31 serving artifacts via standardized schemas (Evidence: CLM-0008, CLM-0009, CLM-0011, CLM-0012, CLM-0013).

### 3.1 Stage A2: Granger Causality Prefiltering

A2 ran 2,159,672 pairwise Granger causality tests (max lag 5 years), asking whether lagged history of candidate X improves prediction of target Y beyond Y's own history. FDR control at q<0.05 yielded 564,545 retained edges (26.1% retention, 73.9% pruning)—expected in high-dimensional settings where many pairwise correlations are weak or temporally non-predictive (Evidence: CLM-0008, CLM-0009, CLM-0010).

A2 is intentionally permissive. The goal is to avoid discarding plausible temporal candidates before structural testing. A2 output is a screened candidate pool, not publishable causal claims.

### 3.2 Stage A3: Structure Learning with PC-Stable

A3 applies PC-Stable conditional-independence logic to remove edges explainable by confounder structures, reducing to 58,837 edges (10.4% of A2 survivors). Where A2 asks temporal precedence, A3 asks whether X still contributes when candidate confounders are conditioned on (Evidence: CLM-0011).

The key limitation: conditional-independence decisions depend on observed variables. Unmeasured confounding can still distort orientation and adjacency. Atlas treats A3 as structural pruning, not final certainty, and requires A4 stability checks before narrative promotion.

### 3.3 Stage A4: Bootstrap Effect Estimation and Retention

A4 estimates effect sizes and stability using 100 bootstrap iterations, retaining 4,976 edges (8.5% of A3). Edges failing retention or interval-sign coherence criteria are removed. This favors edges persistent across resamples over those strong in a single fit but unstable under perturbation (Evidence: CLM-0012, CLM-0013).

Bootstrap output is not treated as absolute uncertainty truth. Atlas documents known miscalibration risks and applies conservative caveat policy where confidence intervals are sparse or missing.

### 3.4 Why Three Stages

Each stage adds a specific evidence layer: temporal order, structural plausibility, and stability under perturbation. This layered logic is easier to explain and audit than one opaque end-to-end estimator. For policy audiences, each finding can be framed with mechanism class and uncertainty class. For researchers, replication can proceed stage by stage rather than only checking final outputs.

## 4. SHAP Importance Analysis

Atlas uses SHAP (SHapley Additive exPlanations) as contribution diagnostics for model interpretation. A SHAP value measures how much a feature contributes to a prediction relative to a baseline. Atlas uses these values for explanatory ranking, not policy causation claims.

The serving corpus includes 5,053 temporal SHAP files and 286 regional SHAP files, near parity with graph files (Evidence: CLM-0014, CLM-0015, CLM-0017, CLM-0018).

SHAP and causal edges are interpreted jointly. When concentration and edge stability align, mechanism confidence improves. When they diverge, Atlas elevates uncertainty language—preventing misrepresentation of feature importance as intervention effect size.

### 4.1 SHAP in Policy Context

Policy teams ask which variables "matter most." SHAP answers in a model-relative way through two checks: persistence (do high-contribution signals remain across years?) and concentration (is contribution narrowly focused or distributed?). A concentrated profile aids prioritization but risks overfitting interpretation; a distributed profile indicates resilient multi-factor dynamics but complicates targeting.

SHAP-based statements must be paired with causal-stage context and uncertainty statements when promoted into findings.

## 5. Simulation Engine

Atlas simulation propagates interventions through validated directed graphs with damping, horizon control, and optional nonlinear handling. Output is comparative scenario movement, not absolute point forecasts—a distinction learned through failure when V3.0 forecasting framing failed validation (Evidence: FAIL-0001).

### 5.1 Scope Modes and Regional Capability

Runtime supports unified, stratified, country, and regional scopes. Regional capability includes dedicated graphs, SHAP files, and regional statistics. Mapping coverage is 178/178 canonical countries, with North America mapped as Canada and United States (Mexico assigned to Latin America and Caribbean) (Evidence: CLM-0017, CLM-0018, CLM-0019, CLM-0057, CLM-0058).

Regional analysis introduces aggregation risk: edge union can inflate graph density. Atlas mitigates this with explicit warnings, year-scope fallbacks, and contributor coverage reporting. A regional audit counted 1,093,922 edges, confirming large-scale nonlinearity while requiring per-finding caveat checks for CI sparsity (Evidence: CLM-0056).

### 5.2 Uncertainty Handling in Simulation Outputs

Simulation uncertainty is represented through bootstrap-informed intervals, edge-level confidence metadata, and scenario caveats. Atlas does not collapse to a single confidence score because uncertainty sources are heterogeneous: coverage gaps, directional instability, nonlinear regime shifts, and sparse interval fields affect interpretation differently.

Direction-only claims are blocked from high-confidence framing without corroboration (FAIL-0002). Overly narrow intervals are treated as potentially miscalibrated (FAIL-0003). Scenario outputs are structured hypotheses for local validation, not standalone policy guarantees.

## 6. Validation and Robustness

Validation is anchored to `CERTIFIED` / `PRODUCTION_READY` status: Phase 2A validated 4,749/4,767 files (99.6%) and Phase 2B validated 4,680/4,768 files (98.2%). These are system-level readiness checks spanning data integrity, artifact structure, and serving consistency (Evidence: CLM-0001, CLM-0002, CLM-0003, CLM-0004).

Robustness is evaluated on cross-layer coherence: panel-level (scale and coverage), runtime-level (file presence and schema compliance), findings-level (robustness across years and scopes), and contradiction-level (conflicts resolved before publication). Contradiction closure reached zero unresolved items; citation audits reported zero missing and zero unknown evidence links (Evidence: CLM-0051, CLM-0054).

### 6.1 Findings Robustness Layer

The findings package evaluated 11,632 candidates across 140 graphs and 35 years. The ranked top-10 was diversified by class: 4 reversals, 3 mediations, 2 thresholds, and 1 outcome-surprise. The public top-4 preserved one per class family to avoid overrepresenting a single mechanism pattern (Evidence: CLM-0026 through CLM-0032).

Anchor findings F01, F02, F06, and F08 were selected for full temporal and graph availability while representing different interpretive risks and policy use cases.

## 7. Limitations and Failure Modes

Atlas documents limitations as first-class outputs because omission of known failure modes misleads readers more than model error itself. Four failures are maintained in the failure registry:

- **FAIL-0001:** Absolute forecasting framing failed predictive checks → replaced by comparative scenario framing.
- **FAIL-0002:** Direction-only claims unstable under resampling → now require corroboration.
- **FAIL-0003:** Confidence intervals showed miscalibration risk → conservative caveat policy adopted.
- **FAIL-0004:** V1 coverage handling caused sample-dropout cascades → stricter panel-density filtering implemented.

A separate archival limitation remains: a v2.1 prefilter survivor artifact is absent in the current snapshot while a v2.0 counterpart exists. Atlas prohibits asserting exact v2.1 survivor counts as artifact-verified until recovery (Evidence: CLM-0059).

### 7.1 Practical Interpretation Limits

High availability does not imply universal transportability. Threshold findings are sensitive to institutional history and measurement. Mediation findings are sensitive to omitted mediators and data sparsity. Reversal findings are sensitive to stratification boundaries and within-stratum heterogeneity. Atlas recommends using findings for hypothesis prioritization, then validating with local data before high-cost deployment.

## 8. AI-Assisted Workflow and Validation Safeguards

This narrative used AI assistance for prose drafting, restructuring, and readability editing. AI was not used to rerun discovery stages, compute new coefficients, or modify the causal corpus. All quantitative statements originate from registered claims and findings artifacts.

AI use is bounded by five safeguards: evidence-linkage checks, numeric integrity checks, uncertainty-caveat checks, failure-transparency checks, and cross-document consistency checks. Any claim failing these checks is revised or removed.

Human review remains final authority through three gates: H1 (findings-strength), H2 (scientific framing), and H3 (publication-readiness with fresh-reader check). Declaring AI assistance is a scientific integrity requirement: prose quality does not raise evidence quality, and Atlas documents this boundary so readers evaluate conclusions on evidence strength rather than rhetorical fluency.

## 9. Reproducibility and Artifact Map

Reproducibility depends on seven linked files: claim registry, evidence ledger, dataset registry, ingestion registry, failure registry, contradiction log, and open questions. Generated outputs add an evidence-map file and QA reports so reviewers can move from paragraph-level claims to source anchors.

Unresolved contradictions: 0. Orchestrated task closure: 8 tasks. API surface: router=45, app=2, total=47 (Evidence: CLM-0051, CLM-0052, CLM-0060).

## 10. Statistical Formulation and Assumption Register

### 10.1 Stage A2 Test Formulation

A2 uses a vector-autoregressive framing of pairwise Granger causality: comparing a restricted model (Y on its own lags) with an unrestricted model (adding lagged X). FDR control via Benjamini-Hochberg at q<0.05 protects against noise-dominated candidate pools while preserving medium-strength signals (Evidence: CLM-0008, CLM-0009, CLM-0010).

A2 assumptions: (1) lagged dependence captures useful temporal ordering; (2) the lag horizon captures medium-run dependencies without collapsing sparse series; (3) unobserved confounding does not fully explain all observed predictive gains.

### 10.2 Stage A3 Structural Testing Logic

A3 applies conditional-independence reasoning: if X and Y are no longer associated conditioning on separator set S, the direct edge is less plausible. PC-Stable controls orientation updates to reduce order dependence. A3 bridges predictive precedence and graph structure—removing edges that are predictive but not structurally direct (Evidence: CLM-0011).

A3 assumptions: adequate confounder representation in observed variables and stable partial-correlation behavior under finite samples. When these fail, A3 can retain spurious edges or remove weak true edges—addressed by A4 resampling and uncertainty-class reporting.

### 10.3 Stage A4 Bootstrap Retention

A4 estimates coefficients over bootstrap samples and computes retention and interval summaries. Bootstrap captures variability from finite sample composition but does not add information about unobserved confounding, measurement error, or implementation shocks (Evidence: CLM-0012, CLM-0013).

Atlas documents CI miscalibration history: earlier phases produced intervals too narrow for deployment-grade confidence. Interval claims must now be conservative when findings carry CI sparsity flags (Evidence: FAIL-0003).

### 10.4 Assumption Register

Every major stage has assumptions that can fail. Instead of burying these in code, Atlas presents them in prose so reviewers can evaluate whether claims overreach support. The most important guardrail is the comparative-use rule: simulation outputs are not absolute forecasts (Evidence: FAIL-0001).

## 11. Validation Protocol Catalog

### 11.1 System Certification Checks

Phase 2A and 2B pass rates exceed 98%, covering schema validity, file integrity, cross-reference completeness, and value-range sanity. Discovery pipelines can fail silently at scale; structural checks serve as hard gates with auditable outcomes (Evidence: CLM-0003, CLM-0004).

### 11.2 Panel Integrity Checks

Panel checks verify row, entity, and indicator counts against frozen expectations—detecting sample shifts that change model behavior. Panel integrity must be monitored after every major transformation, not only at ingest (Evidence: CLM-0005, CLM-0006, CLM-0007).

### 11.3 Runtime Asset Coherence Checks

Coherence checks ensure graph, SHAP, and baseline assets align by scope and year. If exact-year assets are unavailable, runtime uses nearest-year fallback with warnings (Evidence: CLM-0014 through CLM-0019).

### 11.4 Citation and Contradiction Checks

Citation checks verify narrative claims map to registered evidence IDs—zero missing and zero unknown in this cycle. Contradiction checks compare values across artifacts; current unresolved count is zero (Evidence: CLM-0051, CLM-0054).

## 12. Findings Extraction Governance

### 12.1 Candidate Generation and Coverage

Extraction evaluated 11,632 candidates over a 140-graph, 35-year frame under robustness-first scoring. Coverage is strict: a surprising finding is demoted if coverage is weak (Evidence: CLM-0026, CLM-0028, CLM-0029).

### 12.2 Diversity Constraint and Public Subset Policy

Top-10 composition: 4 reversals, 3 mediations, 2 thresholds, 1 outcome-surprise. The public top-4 preserves one per class: F02 reversal, F08 mediation, F06 threshold, F01 outcome-surprise (Evidence: CLM-0030, CLM-0031, CLM-0032).

### 12.3 Finding-Level Reliability Practices

Each public finding includes four minimum evidence fields: availability, effect summary, uncertainty flags, and caveat language. Without availability, readers overgeneralize. Without uncertainty flags, readers overtrust fluent prose. Without caveats, policy translation becomes headline-driven.

## 13. Replication Workflow

### 13.1 What a Reproducer Needs

An independent reproducer needs the registry set, findings package JSON, and runtime validation artifacts. Narrative numbers can be validated without recomputing the causal pipeline. For full computational replication, stage-level scripts from V2.1/V3.1 lineage are provided.

### 13.2 Replication Sequence

First, validate claim registry metrics against evidence IDs. Second, verify F01/F02/F06/F08 values from findings package against narrative sections. Third, run cross-document consistency checks. Fourth, complete human gate reviews before publication.

### 13.3 Reproducibility Boundaries

Reproducibility here is document-reproducibility: regenerating narrative outputs from frozen claims. If model reruns are performed later, Atlas recommends new claim snapshots rather than editing historical values.

## 14. Extended Validity Threats

### 14.1 Internal Validity

Threats include unmeasured confounding, measurement noise, and finite-sample instability. Atlas mitigates through staged filtering, bootstrap retention, and uncertainty-forward reporting, but does not claim elimination. A critical threat is interpretation drift when predictive contribution signals are treated as direct intervention effects.

### 14.2 External Validity

Even high-coverage findings can change behavior across institutional systems. Threshold and reversal findings are especially sensitive—their value lies in identifying where linear transfer assumptions are unsafe, not in supplying universal constants.

### 14.3 Construct Validity

Construct risk appears when indicator codes are treated as direct proxies for complex social constructs. Policy teams should validate construct meaning with local domain knowledge before implementation.

### 14.4 Conclusion on Validity

Atlas presents layered evidence state: robust where coverage and persistence are high, cautious where uncertainty flags exist, explicit where known failures constrain interpretation.

## 15. Stage-by-Stage Decision Rationale

A2 is kept broad because early over-pruning creates irreversible information loss. A3 and A4 are separated because combining structure and stability filters hides failure origin—reviewers should know whether an edge failed conditional-independence logic or bootstrap stability. Class diversity in findings is enforced because robustness-only ranking over-selects reversals, reducing the policy utility of outputs.

## 16. Documentation and Publication Controls

Narrative conversion follows strict controls: section-bounded drafting, evidence-bounded claims, and caveat-completeness review. Three human gates serve distinct purposes: H1 (finding strength), H2 (scientific framing and caveat adequacy), H3 (publication readiness and fresh-reader trust).

Freeze policy requires contradiction closure, citation integrity, and stable claim snapshots before publication. If claims change after freeze, a new snapshot and rerun are required—preventing silent drift where prose stays fixed but underlying numbers change.
