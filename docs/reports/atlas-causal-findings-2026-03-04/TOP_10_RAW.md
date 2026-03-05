# Atlas Causal Findings — Top 10

| Rank | ID | Class | Finding | Graphs | Years | Score |
|---|---|---|---|---|---|---|
| 1 | F01 | outcome_surprise | Strong upstream predictor for gdp_income: Average Adult Government Benefits -> Average Accumulated Income Per Person | 140/140 | 35/35 | 0.9313 |
| 2 | F02 | reversal | College Enrollment Gender Gap changes direction across development strata for Birth Rate | 140/140 | 35/35 | 0.8291 |
| 3 | F03 | reversal | Household Income Distribution Index changes direction across development strata for Armed Conflict Minimum Severity | 140/140 | 35/35 | 0.8106 |
| 4 | F04 | reversal | Middle Class Income Share changes direction across development strata for Total Economic Output per Person | 140/140 | 35/35 | 0.8021 |
| 5 | F05 | reversal | Mixed Income Per Person changes direction across development strata for Child Soldiers - Warlord/Rebel Recruitment | 140/140 | 35/35 | 0.8020 |
| 6 | F06 | threshold | Elections: Local Government Power has robust threshold dynamics for Local Election Quality Index | 140/140 | 35/35 | 0.6983 |
| 7 | F07 | threshold | Environmental Civil Society Organizations has robust threshold dynamics for Freedom of Association Index | 140/140 | 35/35 | 0.6976 |
| 8 | F08 | mediation | Average Spending per Person influences Agricultural Income Distribution via Average Pre-tax Government Income (All Groups) | 140/140 | 35/35 | 0.6394 |
| 9 | F09 | mediation | Average Savings Income Per Adult influences Average Accumulated Income Per Person via Average Adult Government Benefits | 140/140 | 35/35 | 0.6342 |
| 10 | F10 | mediation | Average Social Income per Person influences Average Accumulated Income Per Person via Average Adult Government Benefits | 140/140 | 35/35 | 0.6331 |

## Raw Evidence

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

### F03 — Household Income Distribution Index changes direction across development strata for Armed Conflict Minimum Severity
- `class`: `reversal`
- `variables`: `{'source': {'code': 'gdiincj992', 'label': 'Household Income Distribution Index'}, 'mediator': None, 'target': {'code': 'warc_wmin', 'label': 'Armed Conflict Minimum Severity'}}`
- `edge_type`: `threshold`
- `availability`: `{'years_active': '35/35', 'graphs_active': '140/140'}`
- `stratum_betas`: `{'unified': {'beta': -0.1292292491448033, 'ci_lower': -0.1843599655818841, 'ci_upper': -0.07441171943290727, 'years_active': 35}, 'developing': {'beta': 0.32483094946480084, 'ci_lower': 0.25843699051967783, 'ci_upper': 0.39439178669058383, 'years_active': 35}, 'emerging': {'beta': 0.19361382074439323, 'ci_lower': 0.09472001477487495, 'ci_upper': 0.2923989126162696, 'years_active': 35}, 'advanced': {'beta': -0.5532038770634078, 'ci_lower': -0.6312476908616622, 'ci_upper': -0.47887522627788853, 'years_active': 35}}`
- `lineage`: `{'v2_v21_status': 'confirmed_same_edge', 'notes': 'gdiincj992->warc_wmin: Exact source/target codes found in v2.1 edge set.', 'edge_statuses': [{'source': 'gdiincj992', 'target': 'warc_wmin', 'status': 'confirmed_same_edge'}]}`
- `uncertainty_flags`: `['cross_strata_sign_instability']`
- `plain_language`: Household Income Distribution Index is associated with opposite directional effects on Armed Conflict Minimum Severity depending on development stage.
- `academic_summary`: Edge gdiincj992->warc_wmin exhibits cross-strata sign heterogeneity with means {'unified': -0.1292292491448033, 'developing': 0.32483094946480084, 'emerging': 0.19361382074439323, 'advanced': -0.5532038770634078}.

### F04 — Middle Class Income Share changes direction across development strata for Total Economic Output per Person
- `class`: `reversal`
- `variables`: `{'source': {'code': 'mprpfci999', 'label': 'Middle Class Income Share'}, 'mediator': None, 'target': {'code': 'mseccoi999', 'label': 'Total Economic Output per Person'}}`
- `edge_type`: `threshold`
- `availability`: `{'years_active': '35/35', 'graphs_active': '140/140'}`
- `stratum_betas`: `{'unified': {'beta': -0.14257828978597392, 'ci_lower': -0.4176542167980723, 'ci_upper': 0.1218481175278161, 'years_active': 35}, 'developing': {'beta': 0.5884273771162372, 'ci_lower': 0.4488080339148128, 'ci_upper': 0.7242363857078593, 'years_active': 35}, 'emerging': {'beta': -0.8240496660596126, 'ci_lower': -1.0593562232389455, 'ci_upper': -0.6293939756855178, 'years_active': 35}, 'advanced': {'beta': -0.48454590590128216, 'ci_lower': -0.7776455411836967, 'ci_upper': -0.13967158296259663, 'years_active': 35}}`
- `lineage`: `{'v2_v21_status': 'confirmed_same_edge', 'notes': 'mprpfci999->mseccoi999: Exact source/target codes found in v2.1 edge set.', 'edge_statuses': [{'source': 'mprpfci999', 'target': 'mseccoi999', 'status': 'confirmed_same_edge'}]}`
- `uncertainty_flags`: `['cross_strata_sign_instability']`
- `plain_language`: Middle Class Income Share is associated with opposite directional effects on Total Economic Output per Person depending on development stage.
- `academic_summary`: Edge mprpfci999->mseccoi999 exhibits cross-strata sign heterogeneity with means {'unified': -0.14257828978597392, 'developing': 0.5884273771162372, 'emerging': -0.8240496660596126, 'advanced': -0.48454590590128216}.

### F05 — Mixed Income Per Person changes direction across development strata for Child Soldiers - Warlord/Rebel Recruitment
- `class`: `reversal`
- `variables`: `{'source': {'code': 'ygmxhni999', 'label': 'Mixed Income Per Person'}, 'mediator': None, 'target': {'code': 'chisols_warlord', 'label': 'Child Soldiers - Warlord/Rebel Recruitment'}}`
- `edge_type`: `threshold`
- `availability`: `{'years_active': '35/35', 'graphs_active': '140/140'}`
- `stratum_betas`: `{'unified': {'beta': 0.38662852276715237, 'ci_lower': 0.3443501699501628, 'ci_upper': 0.4308027308701787, 'years_active': 35}, 'developing': {'beta': 0.2610213819301611, 'ci_lower': 0.2013073944960752, 'ci_upper': 0.3173665328218323, 'years_active': 35}, 'emerging': {'beta': 0.26568440644032226, 'ci_lower': 0.17487072346720378, 'ci_upper': 0.36646799333245444, 'years_active': 35}, 'advanced': {'beta': -0.4464661290746635, 'ci_lower': -0.5798915753376589, 'ci_upper': -0.34796984304569756, 'years_active': 35}}`
- `lineage`: `{'v2_v21_status': 'confirmed_same_edge', 'notes': 'ygmxhni999->chisols_warlord: Exact source/target codes found in v2.1 edge set.', 'edge_statuses': [{'source': 'ygmxhni999', 'target': 'chisols_warlord', 'status': 'confirmed_same_edge'}]}`
- `uncertainty_flags`: `['cross_strata_sign_instability']`
- `plain_language`: Mixed Income Per Person is associated with opposite directional effects on Child Soldiers - Warlord/Rebel Recruitment depending on development stage.
- `academic_summary`: Edge ygmxhni999->chisols_warlord exhibits cross-strata sign heterogeneity with means {'unified': 0.38662852276715237, 'developing': 0.2610213819301611, 'emerging': 0.26568440644032226, 'advanced': -0.4464661290746635}.

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

### F07 — Environmental Civil Society Organizations has robust threshold dynamics for Freedom of Association Index
- `class`: `threshold`
- `variables`: `{'source': {'code': 'v2cseeorgs_ord', 'label': 'Environmental Civil Society Organizations'}, 'mediator': None, 'target': {'code': 'e_v2x_frassoc_thick_4C', 'label': 'Freedom of Association Index'}}`
- `edge_type`: `threshold`
- `availability`: `{'years_active': '35/35', 'graphs_active': '140/140'}`
- `stratum_betas`: `{'unified': {'beta': None, 'ci_lower': None, 'ci_upper': None, 'years_active': 0}, 'developing': {'beta': None, 'ci_lower': None, 'ci_upper': None, 'years_active': 0}, 'emerging': {'beta': 0.8388322506427559, 'ci_lower': None, 'ci_upper': None, 'years_active': 15}, 'advanced': {'beta': 0.8877573300619802, 'ci_lower': None, 'ci_upper': None, 'years_active': 35}}`
- `nonlinearity`: `{'threshold': 3.0, 'threshold_latest_year': 2024, 'threshold_latest_year_value': 3.0, 'beta_low': 0.22642751612050352, 'beta_high': 0.0112796314676371, 'flip_years': 0, 'primary_stratum': 'advanced', 'threshold_years_by_stratum': {'unified': 0, 'developing': 0, 'emerging': 15, 'advanced': 35}, 'threshold_details_by_stratum': {'unified': {'years_threshold_active': 0, 'threshold': None, 'beta_low': None, 'beta_high': None, 'flip_years': 0}, 'developing': {'years_threshold_active': 0, 'threshold': None, 'beta_low': None, 'beta_high': None, 'flip_years': 0}, 'emerging': {'years_threshold_active': 15, 'threshold': 2.15977304964539, 'beta_low': 0.4984113038013224, 'beta_high': 0.15168057382124359, 'flip_years': 0}, 'advanced': {'years_threshold_active': 35, 'threshold': 3.0, 'beta_low': 0.22642751612050352, 'beta_high': 0.0112796314676371, 'flip_years': 0}}, 'threshold_variable': 'v2cseeorgs_ord', 'reverted_recently': False, 'country_split_latest': {'year': 2024, 'threshold_variable': 'v2cseeorgs_ord', 'threshold_value': 3.0, 'coverage_countries': 178, 'below_count': 70, 'above_count': 108, 'missing_count': 0, 'below_countries': ['Afghanistan', 'Algeria', 'Angola', 'Azerbaijan', 'Bahrain', 'Belarus', 'Burkina Faso', 'Burundi', 'Cambodia', 'Cameroon', 'Central African Republic', 'Chad', 'China', 'Comoros', 'Cuba', 'Djibouti', 'Egypt, Arab Rep.', 'El Salvador', 'Equatorial Guinea', 'Eritrea', 'Ethiopia', 'German Democratic Republic', 'Guinea', 'Hong Kong', 'Hungary', 'India', 'Iran, Islamic Rep.', 'Israel', 'Jordan', 'Kazakhstan', 'Kuwait', 'Kyrgyzstan', 'Laos', 'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Mauritania', 'Morocco', 'Mozambique', 'Nicaragua', 'North Korea', 'Oman', 'Qatar', 'Republic of the Congo', 'Russia', 'Rwanda', 'Saudi Arabia', 'Singapore', 'Slovakia', 'Somalia', 'Somaliland', 'South Sudan', 'South Yemen', 'Sri Lanka', 'Sudan', 'Swaziland', 'Syria', 'Tajikistan', 'Tunisia', 'Turkmenistan', 'Türkiye', 'Uganda', 'United Arab Emirates', 'Uzbekistan', 'Venezuela, RB', 'Vietnam', 'Yemen', 'Zanzibar', 'Zimbabwe'], 'above_countries': ['Albania', 'Argentina', 'Armenia', 'Australia', 'Austria', 'Bangladesh', 'Barbados', 'Belgium', 'Benin', 'Bhutan', 'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Bulgaria', 'Canada', 'Cape Verde', 'Chile', 'Colombia', 'Congo, Dem. Rep.', 'Costa Rica', 'Croatia', 'Cyprus', 'Czech Republic', 'Denmark', 'Dominican Republic', 'Ecuador', 'Estonia', 'Fiji', 'Finland', 'France', 'Gabon', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Guatemala', 'Guinea-Bissau', 'Guyana', 'Haiti', 'Honduras', 'Iceland', 'Indonesia', 'Iraq', 'Ireland', 'Italy', 'Ivory Coast', 'Jamaica', 'Japan', 'Kenya', 'Korea, Rep.', 'Kosovo', 'Latvia', 'Lebanon', 'Lesotho', 'Liberia', 'Libya', 'Lithuania', 'Luxembourg', 'Madagascar', 'Malta', 'Mauritius', 'Mexico', 'Moldova', 'Mongolia', 'Montenegro', 'Namibia', 'Nepal', 'Netherlands', 'New Zealand', 'Niger', 'Nigeria', 'North Macedonia', 'Norway', 'Pakistan', 'Panama', 'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines', 'Poland', 'Portugal', 'Romania', 'Sao Tome and Principe', 'Senegal', 'Serbia', 'Seychelles', 'Sierra Leone', 'Slovenia', 'Solomon Islands', 'South Africa', 'Spain', 'Suriname', 'Sweden', 'Switzerland', 'Taiwan', 'Tanzania', 'Thailand', 'The Gambia', 'Timor-Leste', 'Togo', 'Trinidad and Tobago', 'Ukraine', 'United Kingdom', 'United States', 'Uruguay', 'Vanuatu', 'Zambia'], 'missing_countries': [], 'below_count_by_income_stratum': {'Advanced': 12, 'Developing': 39, 'Emerging': 13, 'Unknown': 6}, 'above_count_by_income_stratum': {'Advanced': 43, 'Developing': 32, 'Emerging': 32, 'Unknown': 1}}}`
- `policy_relevance`: `{'is_policy_relevant_lever': True, 'lever_variable': {'code': 'v2cseeorgs_ord', 'label': 'Environmental Civil Society Organizations'}}`
- `lineage`: `{'v2_v21_status': 'confirmed_same_edge', 'notes': 'v2cseeorgs_ord->e_v2x_frassoc_thick_4C: Exact source/target codes found in v2.1 edge set.', 'edge_statuses': [{'source': 'v2cseeorgs_ord', 'target': 'e_v2x_frassoc_thick_4C', 'status': 'confirmed_same_edge'}]}`
- `uncertainty_flags`: `['ci_missing_or_sparse']`
- `plain_language`: The effect of Environmental Civil Society Organizations on Freedom of Association Index changes by regime around a learned threshold in advanced.
- `academic_summary`: Edge v2cseeorgs_ord->e_v2x_frassoc_thick_4C is classified as threshold in 35/35 years for advanced; beta_low=0.22642751612050352, beta_high=0.0112796314676371.

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

### F09 — Average Savings Income Per Adult influences Average Accumulated Income Per Person via Average Adult Government Benefits
- `class`: `mediation`
- `variables`: `{'source': {'code': 'asavini992', 'label': 'Average Savings Income Per Adult'}, 'mediator': {'code': 'agmxhoi992', 'label': 'Average Adult Government Benefits'}, 'target': {'code': 'accmhoi999', 'label': 'Average Accumulated Income Per Person'}}`
- `edge_type`: `mixed`
- `availability`: `{'years_active': '35/35', 'graphs_active': '140/140'}`
- `stratum_betas`: `{'unified': {'beta_ab': 0.9751010383075033, 'beta_bc': 0.984133485461276, 'indirect_beta_product': 0.9596295835064724}, 'developing': {'beta_ab': 0.9490066067179888, 'beta_bc': 0.9843257287644913, 'indirect_beta_product': 0.9341316197600013}, 'emerging': {'beta_ab': 0.8752064151068779, 'beta_bc': 0.944641423920972, 'indirect_beta_product': 0.8267562341913304}, 'advanced': {'beta_ab': 0.7505324142526953, 'beta_bc': 0.9399200178455633, 'indirect_beta_product': 0.7054404401980672}}`
- `direct_edge_availability`: `0/140`
- `indirect_path_availability`: `140/140`
- `indirect_path_years_by_stratum`: `{'unified': 35, 'developing': 35, 'emerging': 35, 'advanced': 35}`
- `outcome_priority`: `{'is_outcome_target': True, 'outcome_concept': 'gdp_income'}`
- `lineage`: `{'v2_v21_status': 'confirmed_same_edge', 'notes': 'asavini992->agmxhoi992: Exact source/target codes found in v2.1 edge set. | agmxhoi992->accmhoi999: Exact source/target codes found in v2.1 edge set.', 'edge_statuses': [{'source': 'asavini992', 'target': 'agmxhoi992', 'status': 'confirmed_same_edge'}, {'source': 'agmxhoi992', 'target': 'accmhoi999', 'status': 'confirmed_same_edge'}]}`
- `uncertainty_flags`: `['ci_missing_or_sparse']`
- `plain_language`: Changes in Average Savings Income Per Adult are linked to Average Accumulated Income Per Person through Average Adult Government Benefits, with most of the effect carried by the indirect path.
- `academic_summary`: Directed mediation path asavini992->agmxhoi992->accmhoi999 is active in 140/140 graphs; direct edge asavini992->accmhoi999 appears in 0/140 graphs.

### F10 — Average Social Income per Person influences Average Accumulated Income Per Person via Average Adult Government Benefits
- `class`: `mediation`
- `variables`: `{'source': {'code': 'asavini999', 'label': 'Average Social Income per Person'}, 'mediator': {'code': 'agmxhoi992', 'label': 'Average Adult Government Benefits'}, 'target': {'code': 'accmhoi999', 'label': 'Average Accumulated Income Per Person'}}`
- `edge_type`: `mixed`
- `availability`: `{'years_active': '35/35', 'graphs_active': '140/140'}`
- `stratum_betas`: `{'unified': {'beta_ab': 0.9597451116767786, 'beta_bc': 0.984133485461276, 'indirect_beta_product': 0.9445173019088896}, 'developing': {'beta_ab': 0.9441653479429368, 'beta_bc': 0.9843257287644913, 'indirect_beta_product': 0.9293662441881108}, 'emerging': {'beta_ab': 0.8600459163233692, 'beta_bc': 0.944641423920972, 'indirect_beta_product': 0.8124349990331247}, 'advanced': {'beta_ab': 0.7399591063361287, 'beta_bc': 0.9399200178455633, 'indirect_beta_product': 0.6955023764324412}}`
- `direct_edge_availability`: `0/140`
- `indirect_path_availability`: `140/140`
- `indirect_path_years_by_stratum`: `{'unified': 35, 'developing': 35, 'emerging': 35, 'advanced': 35}`
- `outcome_priority`: `{'is_outcome_target': True, 'outcome_concept': 'gdp_income'}`
- `lineage`: `{'v2_v21_status': 'confirmed_same_edge', 'notes': 'asavini999->agmxhoi992: Exact source/target codes found in v2.1 edge set. | agmxhoi992->accmhoi999: Exact source/target codes found in v2.1 edge set.', 'edge_statuses': [{'source': 'asavini999', 'target': 'agmxhoi992', 'status': 'confirmed_same_edge'}, {'source': 'agmxhoi992', 'target': 'accmhoi999', 'status': 'confirmed_same_edge'}]}`
- `uncertainty_flags`: `['ci_missing_or_sparse']`
- `plain_language`: Changes in Average Social Income per Person are linked to Average Accumulated Income Per Person through Average Adult Government Benefits, with most of the effect carried by the indirect path.
- `academic_summary`: Directed mediation path asavini999->agmxhoi992->accmhoi999 is active in 140/140 graphs; direct edge asavini999->accmhoi999 appears in 0/140 graphs.
