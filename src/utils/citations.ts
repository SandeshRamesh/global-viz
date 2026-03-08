/**
 * Citation generators for Atlas research tool
 *
 * Generates APA and BibTeX formatted citations with embedded view-state URLs
 * so each citation points to the exact graph state the researcher was viewing.
 */

export function generateAPACitation(url: string): string {
  return `Argon Analytics Research Team. (2026). Atlas: Causal discovery and scenario simulation for development policy under mechanism heterogeneity. Argon Analytics. ${url}`
}

export function generateBibTeXCitation(url: string): string {
  return `@techreport{atlas2026,
  author = {{Argon Analytics Research Team}},
  title = {Atlas: Causal Discovery and Scenario Simulation for Development Policy Under Mechanism Heterogeneity},
  institution = {Argon Analytics},
  year = {2026},
  month = {March},
  url = {${url}}
}`
}
