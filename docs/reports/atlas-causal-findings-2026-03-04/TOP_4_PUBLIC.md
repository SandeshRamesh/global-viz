# Atlas Causal Findings — Top 4 Public

| Rank | ID | Class | Finding | Graphs | Years | Score |
|---|---|---|---|---|---|---|
| 1 | F02 | reversal | College Enrollment Gender Gap changes direction across development strata for Birth Rate | 140/140 | 35/35 | 0.8291 |
| 2 | F08 | mediation | Average Spending per Person influences Agricultural Income Distribution via Average Pre-tax Government Income (All Groups) | 140/140 | 35/35 | 0.6394 |
| 3 | F06 | threshold | Elections: Local Government Power has robust threshold dynamics for Local Election Quality Index | 140/140 | 35/35 | 0.6983 |
| 4 | F01 | outcome_surprise | Strong upstream predictor for gdp_income: Average Adult Government Benefits -> Average Accumulated Income Per Person | 140/140 | 35/35 | 0.9313 |

## Raw Evidence

### F02 — College Enrollment Gender Gap changes direction across development strata for Birth Rate
- `class`: `reversal`
- `variables`: `{'source': {'code': 'GER.5T8.GPIA', 'label': 'College Enrollment Gender Gap'}, 'mediator': None, 'target': {'code': 'wdi_birth', 'label': 'Birth Rate'}}`
- `edge_type`: `threshold`
- `availability`: `{'years_active': '35/35', 'graphs_active': '140/140'}`
- `stratum_betas`: `{'unified': {'beta': -0.6740267225215214, 'ci_lower': -0.7040712119067075, 'ci_upper': -0.6430866643415515, 'years_active': 35}, 'developing': {'beta': -0.66474586023363, 'ci_lower': -0.7122052471437128, 'ci_upper': -0.6161043893373037, 'years_active': 35}, 'emerging': {'beta': -0.5536414415678012, 'ci_lower': -0.6494623533238985, 'ci_upper': -0.45873028275439826, 'years_active': 35}, 'advanced': {'beta': 0.25514157104566765, 'ci_lower': 0.12820724245759132, 'ci_upper': 0.360587820055119, 'years_active': 35}}`
- `lineage`: `{'v2_v21_status': 'confirmed_same_edge', 'notes': 'GER.5T8.GPIA->wdi_birth: Exact source/target codes found in v2.1 edge set.', 'edge_statuses': [{'source': 'GER.5T8.GPIA', 'target': 'wdi_birth', 'status': 'confirmed_same_edge'}]}`
- `uncertainty_flags`: `['cross_strata_sign_instability']`
- `plain_language`: College Enrollment Gender Gap is associated with opposite directional effects on Birth Rate depending on development stage.
- `academic_summary`: Edge GER.5T8.GPIA->wdi_birth exhibits cross-strata sign heterogeneity with means {'unified': -0.6740267225215214, 'developing': -0.66474586023363, 'emerging': -0.5536414415678012, 'advanced': 0.25514157104566765}.

### F08 — Average Spending per Person influences Agricultural Income Distribution via Average Pre-tax Government Income (All Groups)
- `class`: `mediation`
- `variables`: `{'source': {'code': 'acfcfci999', 'label': 'Average Spending per Person'}, 'mediator': {'code': 'aptxgoi999', 'label': 'Average Pre-tax Government Income (All Groups)'}, 'target': {'code': 'agninci999', 'label': 'Agricultural Income Distribution'}}`
- `edge_type`: `mixed`
- `availability`: `{'years_active': '35/35', 'graphs_active': '140/140'}`
- `stratum_betas`: `{'unified': {'beta_ab': 0.8186247578610527, 'beta_bc': 0.7055434602175795, 'indirect_beta_product': 0.5775753442810653}, 'developing': {'beta_ab': 0.8350227338014649, 'beta_bc': 0.8255631383838082, 'indirect_beta_product': 0.6893639887389647}, 'emerging': {'beta_ab': 0.8214516180769273, 'beta_bc': 0.7394283157942585, 'indirect_beta_product': 0.6074045864610909}, 'advanced': {'beta_ab': 0.9217171056372976, 'beta_bc': 0.9769131653597842, 'indirect_beta_product': 0.900437575234391}}`
- `direct_edge_availability`: `0/140`
- `indirect_path_availability`: `140/140`
- `indirect_path_years_by_stratum`: `{'unified': 35, 'developing': 35, 'emerging': 35, 'advanced': 35}`
- `outcome_priority`: `{'is_outcome_target': True, 'outcome_concept': 'gdp_income'}`
- `lineage`: `{'v2_v21_status': 'confirmed_same_edge', 'notes': 'acfcfci999->aptxgoi999: Exact source/target codes found in v2.1 edge set. | aptxgoi999->agninci999: Exact source/target codes found in v2.1 edge set.', 'edge_statuses': [{'source': 'acfcfci999', 'target': 'aptxgoi999', 'status': 'confirmed_same_edge'}, {'source': 'aptxgoi999', 'target': 'agninci999', 'status': 'confirmed_same_edge'}]}`
- `uncertainty_flags`: `['ci_missing_or_sparse']`
- `plain_language`: Changes in Average Spending per Person are linked to Agricultural Income Distribution through Average Pre-tax Government Income (All Groups), with most of the effect carried by the indirect path.
- `academic_summary`: Directed mediation path acfcfci999->aptxgoi999->agninci999 is active in 140/140 graphs; direct edge acfcfci999->agninci999 appears in 0/140 graphs.

### F06 — Elections: Local Government Power has robust threshold dynamics for Local Election Quality Index
- `class`: `threshold`
- `variables`: `{'source': {'code': 'v2ellocpwr_ord', 'label': 'Elections: Local Government Power'}, 'mediator': None, 'target': {'code': 'e_v2xel_locelec_4C', 'label': 'Local Election Quality Index'}}`
- `edge_type`: `threshold`
- `availability`: `{'years_active': '35/35', 'graphs_active': '140/140'}`
- `stratum_betas`: `{'unified': {'beta': 0.8806117971191815, 'ci_lower': None, 'ci_upper': None, 'years_active': 35}, 'developing': {'beta': 0.8638473237332442, 'ci_lower': None, 'ci_upper': None, 'years_active': 14}, 'emerging': {'beta': 0.8478376365430251, 'ci_lower': None, 'ci_upper': None, 'years_active': 26}, 'advanced': {'beta': 0.8504013322948607, 'ci_lower': None, 'ci_upper': None, 'years_active': 35}}`
- `nonlinearity`: `{'threshold': 3.0, 'threshold_latest_year': 2024, 'threshold_latest_year_value': 3.0, 'beta_low': 0.2187008775621328, 'beta_high': 0.08726327695656574, 'flip_years': 0, 'primary_stratum': 'unified', 'threshold_years_by_stratum': {'unified': 35, 'developing': 14, 'emerging': 26, 'advanced': 35}, 'threshold_details_by_stratum': {'unified': {'years_threshold_active': 35, 'threshold': 3.0, 'beta_low': 0.2187008775621328, 'beta_high': 0.08726327695656574, 'flip_years': 0}, 'developing': {'years_threshold_active': 14, 'threshold': 3.0, 'beta_low': 0.2239771079737955, 'beta_high': 0.08525008702591406, 'flip_years': 1}, 'emerging': {'years_threshold_active': 26, 'threshold': 2.9524299408797887, 'beta_low': 0.25428934815971166, 'beta_high': 0.07683383922745834, 'flip_years': 1}, 'advanced': {'years_threshold_active': 35, 'threshold': 3.0, 'beta_low': 0.05870978575973159, 'beta_high': 0.012846379814651372, 'flip_years': 15}}, 'threshold_variable': 'v2ellocpwr_ord', 'reverted_recently': False, 'country_split_latest': {'year': 2024, 'threshold_variable': 'v2ellocpwr_ord', 'threshold_value': 3.0, 'coverage_countries': 174, 'below_count': 66, 'above_count': 108, 'missing_count': 4, 'below_countries': ['Afghanistan', 'Algeria', 'Angola', 'Armenia', 'Azerbaijan', 'Bahrain', 'Bangladesh', 'Belarus', 'Botswana', 'Burkina Faso', 'Burundi', 'Cambodia', 'Cameroon', 'Central African Republic', 'China', 'Cuba', 'Djibouti', 'Egypt, Arab Rep.', 'Equatorial Guinea', 'Eritrea', 'Ethiopia', 'German Democratic Republic', 'Ghana', 'Guinea', 'Guinea-Bissau', 'Guyana', 'Iran, Islamic Rep.', 'Jordan', 'Kazakhstan', 'Kenya', 'Kyrgyzstan', 'Lebanon', 'Libya', 'Luxembourg', 'Madagascar', 'Malaysia', 'Mali', 'Mauritania', 'Mongolia', 'Morocco', 'Namibia', 'Nicaragua', 'Niger', 'North Korea', 'Romania', 'Russia', 'Rwanda', 'Saudi Arabia', 'Seychelles', 'Singapore', 'Solomon Islands', 'Somalia', 'South Yemen', 'Sudan', 'Suriname', 'Swaziland', 'Syria', 'Tajikistan', 'Thailand', 'Turkmenistan', 'Türkiye', 'Uganda', 'United Arab Emirates', 'Uzbekistan', 'Yemen', 'Zanzibar'], 'above_countries': ['Albania', 'Argentina', 'Australia', 'Austria', 'Belgium', 'Benin', 'Bhutan', 'Bolivia', 'Bosnia and Herzegovina', 'Brazil', 'Bulgaria', 'Canada', 'Cape Verde', 'Chad', 'Chile', 'Colombia', 'Comoros', 'Congo, Dem. Rep.', 'Costa Rica', 'Croatia', 'Cyprus', 'Czech Republic', 'Denmark', 'Dominican Republic', 'Ecuador', 'El Salvador', 'Estonia', 'Fiji', 'Finland', 'France', 'Gabon', 'Georgia', 'Germany', 'Greece', 'Guatemala', 'Haiti', 'Honduras', 'Hungary', 'Iceland', 'India', 'Indonesia', 'Iraq', 'Ireland', 'Israel', 'Italy', 'Ivory Coast', 'Jamaica', 'Japan', 'Korea, Rep.', 'Kosovo', 'Laos', 'Latvia', 'Lesotho', 'Liberia', 'Lithuania', 'Malawi', 'Maldives', 'Malta', 'Mauritius', 'Mexico', 'Moldova', 'Montenegro', 'Mozambique', 'Nepal', 'Netherlands', 'New Zealand', 'Nigeria', 'North Macedonia', 'Norway', 'Oman', 'Pakistan', 'Panama', 'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines', 'Poland', 'Portugal', 'Republic of the Congo', 'Sao Tome and Principe', 'Senegal', 'Serbia', 'Sierra Leone', 'Slovakia', 'Slovenia', 'Somaliland', 'South Africa', 'South Sudan', 'Spain', 'Sri Lanka', 'Sweden', 'Switzerland', 'Taiwan', 'Tanzania', 'The Gambia', 'Timor-Leste', 'Togo', 'Trinidad and Tobago', 'Tunisia', 'Ukraine', 'United Kingdom', 'United States', 'Uruguay', 'Vanuatu', 'Venezuela, RB', 'Vietnam', 'Zambia', 'Zimbabwe'], 'missing_countries': ['Barbados', 'Hong Kong', 'Kuwait', 'Qatar'], 'below_count_by_income_stratum': {'Advanced': 9, 'Developing': 35, 'Emerging': 17, 'Unknown': 5}, 'above_count_by_income_stratum': {'Advanced': 42, 'Developing': 36, 'Emerging': 28, 'Unknown': 2}}}`
- `policy_relevance`: `{'is_policy_relevant_lever': True, 'lever_variable': {'code': 'v2ellocpwr_ord', 'label': 'Elections: Local Government Power'}}`
- `lineage`: `{'v2_v21_status': 'confirmed_same_edge', 'notes': 'v2ellocpwr_ord->e_v2xel_locelec_4C: Exact source/target codes found in v2.1 edge set.', 'edge_statuses': [{'source': 'v2ellocpwr_ord', 'target': 'e_v2xel_locelec_4C', 'status': 'confirmed_same_edge'}]}`
- `uncertainty_flags`: `['ci_missing_or_sparse']`
- `plain_language`: The effect of Elections: Local Government Power on Local Election Quality Index changes by regime around a learned threshold in unified.
- `academic_summary`: Edge v2ellocpwr_ord->e_v2xel_locelec_4C is classified as threshold in 35/35 years for unified; beta_low=0.2187008775621328, beta_high=0.08726327695656574.

### F01 — Strong upstream predictor for gdp_income: Average Adult Government Benefits -> Average Accumulated Income Per Person
- `class`: `outcome_surprise`
- `variables`: `{'source': {'code': 'agmxhoi992', 'label': 'Average Adult Government Benefits'}, 'mediator': None, 'target': {'code': 'accmhoi999', 'label': 'Average Accumulated Income Per Person'}}`
- `edge_type`: `linear`
- `availability`: `{'years_active': '35/35', 'graphs_active': '140/140'}`
- `stratum_betas`: `{'unified': {'beta': 0.984133485461276, 'ci_lower': 0.9201213491571344, 'ci_upper': 1.0545694666788854, 'years_active': 35}, 'developing': {'beta': 0.9843257287644913, 'ci_lower': 0.9309103081987437, 'ci_upper': 1.0418340736556573, 'years_active': 35}, 'emerging': {'beta': 0.944641423920972, 'ci_lower': 0.8473390006120024, 'ci_upper': 1.0504541540095087, 'years_active': 35}, 'advanced': {'beta': 0.9399200178455633, 'ci_lower': 0.8434986569562934, 'ci_upper': 1.034566205847073, 'years_active': 35}}`
- `lineage`: `{'v2_v21_status': 'confirmed_same_edge', 'notes': 'agmxhoi992->accmhoi999: Exact source/target codes found in v2.1 edge set.', 'edge_statuses': [{'source': 'agmxhoi992', 'target': 'accmhoi999', 'status': 'confirmed_same_edge'}]}`
- `uncertainty_flags`: `[]`
- `plain_language`: Average Adult Government Benefits is one of the strongest consistent upstream predictors of Average Accumulated Income Per Person in this corpus.
- `academic_summary`: For outcome concept gdp_income, edge agmxhoi992->accmhoi999 ranks highest by coverage/effect composite (graphs=140/140, min_years=35/35).
