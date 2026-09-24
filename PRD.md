# Product Requirements Document: Regional Power Opportunity Map

## 1. Document status

- Product: Regional Power Opportunity Map
- Version: 1.0
- Status: Build-ready MVP specification
- Primary artifact: Public portfolio web application
- Supporting artifact: Downloadable, source-attributed dataset
- Data model date convention: ISO 8601 (`YYYY-MM-DD`)

## 2. Product summary

The Regional Power Opportunity Map is an interactive decision-support dashboard for comparing potential Bitcoin-mining markets. It ranks five locations using electricity economics, renewable-power availability, grid reliability, political and mining-specific regulatory risk, climate and cooling conditions, import and logistics conditions, and data-centre readiness.

The product is designed as a portfolio project for a candidate pursuing a mining-infrastructure sales or business-development role. It must demonstrate three capabilities:

1. Researching power markets with traceable evidence.
2. Turning incomplete market information into a defensible commercial framework.
3. Communicating recommendations clearly to non-technical decision-makers.

The application is not an investment recommendation, a real-time electricity-price service, or a claim that a public industrial tariff is available to a particular mining project.

## 3. Problem statement

Mining-rig and infrastructure sales teams need to decide where commercially attractive customers and projects may exist. The cheapest headline electricity market is not automatically the best opportunity: a location can have inexpensive power but weak grid reliability, prohibitive import requirements, high regulatory uncertainty, unsuitable climate conditions, or insufficient infrastructure.

Public data is fragmented across regulators, utilities, grid operators, multilateral organisations, customs agencies, and climate datasets. Decision-makers need a transparent way to compare markets, change priorities, understand the evidence behind each score, and see how power costs affect a hypothetical deployment.

## 4. Goals

### 4.1 User goals

- Compare five candidate locations consistently.
- Understand why each market received its score.
- Change strategic priorities and see rankings recalculate immediately.
- Estimate annual electricity consumption and expenditure for a mining fleet.
- Distinguish observed data, derived values, analyst assumptions, and qualitative assessments.
- Download the data and review the sources independently.

### 4.2 Portfolio goals

- Demonstrate power-resource research relevant to mining sales.
- Demonstrate commercial reasoning rather than cryptocurrency enthusiasm alone.
- Show competence in data handling, scenario analysis, source evaluation, and executive communication.
- Produce a project that can be explained in five minutes during an interview.

### 4.3 Success measures

The MVP is successful when:

- A first-time visitor can identify the top two recommended markets within 30 seconds.
- Every visible score can be traced to evidence or an explicitly labelled assumption.
- Changing a weight updates rankings without reloading the page.
- All displayed weights always total 100%.
- The electricity calculator produces reproducible results from visible inputs.
- The full scored dataset and source register can be downloaded.
- The site works at mobile, tablet, and desktop widths and passes the defined quality checks.

## 5. Non-goals

The MVP will not:

- Recommend securities, cryptocurrencies, or investments.
- Forecast Bitcoin price, network difficulty, or hash price.
- Claim access to private power-purchase agreements.
- Ingest live regulatory or tariff data automatically.
- Provide a customer relationship management system.
- Provide authenticated accounts, collaboration, or saved cloud scenarios.
- Use an interactive geographic map unless it materially improves the comparison experience.
- Rank countries solely from national averages when the intended unit of analysis is a subnational power market.

## 6. Target users

### 6.1 Primary persona: regional sales or business-development manager

Needs to identify markets, client segments, and commercially relevant talking points. Values concise rankings, transparent risks, and actionable recommendations.

### 6.2 Secondary persona: mining-project developer

Needs to compare power cost, reliability, climate, logistics, and deployment readiness. Values assumptions, sensitivity analysis, and site-specific caveats.

### 6.3 Evaluator persona: recruiter or hiring manager

Needs to understand the candidate's thinking quickly. Values clarity, research discipline, business judgement, and the ability to explain limitations.

## 7. Core decisions and assumptions

### 7.1 Initial locations

The initial dataset should compare five geographically diverse power markets:

1. Texas, United States
2. Northern Norway
3. Itaipu-adjacent Paraguay
4. Ethiopia
5. Sarawak, Malaysia

The research phase may replace a location when reliable data cannot be found. Any replacement must preserve geographic and risk diversity and be documented in the data notes.

### 7.2 Evaluation criteria and default weights

| Criterion                          | Default weight | Decision question                                                     |
| ---------------------------------- | -------------: | --------------------------------------------------------------------- |
| All-in industrial electricity cost |            30% | Can a large load operate competitively?                               |
| Power and renewable availability   |            15% | Is suitable energy available at meaningful scale?                     |
| Grid reliability and flexibility   |            10% | Can the operation maintain acceptable uptime or monetise flexibility? |
| Political and regulatory risk      |            15% | Is the operating environment sufficiently predictable?                |
| Climate and cooling                |            10% | How favourable are ambient conditions and environmental risks?        |
| Import and logistics conditions    |            10% | How difficult and costly is equipment delivery?                       |
| Data-centre readiness              |            10% | Can the market support timely construction and operations?            |
| **Total**                          |       **100%** |                                                                       |

### 7.3 Scoring model

- Each criterion receives a score from 1.0 to 5.0.
- Weights are stored as decimals and must total 1.0.
- Base weighted score:

```text
weighted_score = sum(criterion_score * criterion_weight)
score_out_of_100 = weighted_score / 5 * 100
```

- Ranking is descending by score out of 100.
- Ties are displayed as ties; the application must not invent additional precision.
- Scores are rounded to one decimal only for display. Calculations use full stored precision.

### 7.4 Confidence adjustment

Every evidence item has a confidence rating:

| Rating | Factor | Definition                                                         |
| ------ | -----: | ------------------------------------------------------------------ |
| High   |   1.00 | Recent, authoritative, and directly relevant evidence              |
| Medium |   0.75 | Credible but indirect, older, or geographically broader evidence   |
| Low    |   0.40 | Secondary, incomplete, or materially assumption-dependent evidence |

Optional confidence-adjusted scoring uses a neutral anchor of 3:

```text
adjusted_score = 3 + (base_score - 3) * confidence_factor
```

The default dashboard shows unadjusted scores. Users can enable confidence adjustment. The UI must explain the formula and visually indicate low-confidence evidence.

### 7.5 Recommendation rules

- The two highest eligible markets are marked `Recommended` and `Secondary opportunity`.
- A market is ineligible when its mining-specific regulatory score is below 2.0 or when legality cannot be verified.
- An ineligible market can still appear in the ranking, but must display a prominent `Critical constraint` label and cannot receive a recommendation badge.
- Recommendations must include a commercial rationale and an entry condition, not only a score.

## 8. Data principles

### 8.1 Required evidence hierarchy

Prefer sources in this order:

1. Laws, regulators, grid operators, government agencies, and official utility tariffs.
2. Multilateral organisations and recognised public research institutions.
3. Audited company reports and operator publications.
4. Reputable industry research.
5. Reputable news reporting as corroboration only.

Search-result snippets, unattributed aggregators, promotional claims, and generated prose are not acceptable as sole evidence.

### 8.2 Observation types

Every material datum must be classified as one of:

- `observed`: reported directly by a source.
- `derived`: calculated from one or more observed values.
- `assumption`: selected by the analyst for modelling.
- `assessment`: qualitative judgement supported by cited evidence.

The UI must never present an assumption as an observed fact.

### 8.3 Data freshness

- Every record requires `period_end` or a human-readable reporting period.
- Every source requires `accessed_at`.
- Data older than 24 months is flagged `Review age` unless no newer authoritative observation exists.
- Mining-specific legal status must be checked within 90 days of publication or public demonstration.
- The application header displays the dataset snapshot date.

### 8.4 Electricity-price treatment

The product must distinguish:

- Public industrial average
- Published tariff
- Wholesale-market observation
- Estimated all-in delivered price
- Analyst scenario
- Private or negotiated price reported by a credible source

Public averages must not be labelled as mining tariffs or available PPAs. Where site-specific pricing is unavailable, show a benchmark and model at least base, optimistic, and stress scenarios.

### 8.5 Missing data

- Missing observations remain null; do not silently convert them to zero.
- A market with missing evidence may receive an assessment score only when the rationale and confidence are explicit.
- The UI displays `Data unavailable` for null values.
- Data gaps appear in the methodology and download.

## 9. Functional requirements

### FR-1: Executive overview

The landing page must show:

- Product purpose and dataset snapshot date.
- Ranked comparison of all five markets.
- Top two eligible recommendations.
- Score out of 100, confidence indicator, and critical-constraint status.
- A concise explanation of why the leading market ranks first.
- A notice that the analysis is a research exercise and not investment advice.

### FR-2: Comparison table

Users can compare all markets across all seven criteria. The table must:

- Support sorting by total score and criterion.
- Show raw values where they are comparable.
- Show score, confidence, and evidence age.
- Provide an accessible alternative to colour coding.
- Link each criterion score to its evidence drawer or detail section.

### FR-3: Market detail

Each market page or panel must contain:

- Executive summary.
- Key opportunity and primary constraint.
- Criterion scores with rationale.
- Electricity benchmarks and scenario range.
- Energy mix or renewable-availability evidence.
- Reliability and flexibility evidence.
- General country risk and mining-specific regulatory assessment shown separately.
- Climate and cooling observations.
- Import, logistics, and deployment-readiness notes.
- Target customer segments and an illustrative sales proposition.
- Source list, data dates, access dates, and confidence ratings.

### FR-4: Scenario laboratory

Users can change criterion weights with sliders or numeric inputs. The feature must:

- Enforce values between 0% and 100%.
- Keep or normalise the total to 100% with clear feedback.
- Recalculate scores and rankings immediately.
- Provide reset to default.
- Provide four presets: Base case, Cost-focused, Risk-conscious, and Sustainability-focused.
- Allow confidence adjustment to be enabled or disabled.
- Display when recommendation eligibility overrides numerical rank.

Preset weights must be stored in data or configuration, not duplicated in UI components.

### FR-5: Electricity-cost calculator

Inputs:

- Number of rigs
- Power draw per rig in kW
- Electricity price in USD/kWh
- Expected uptime as a percentage
- Optional hosting or other variable cost in USD/kWh

Outputs:

- Annual electricity consumption in kWh and GWh
- Annual energy expenditure
- Annual hosting/variable expenditure
- Combined annual variable expenditure
- Expenditure change for a USD 0.01/kWh price movement

Formula:

```text
annual_kwh = rig_count * power_kw * 24 * 365 * uptime
annual_energy_cost = annual_kwh * electricity_price
annual_other_variable_cost = annual_kwh * other_variable_cost
one_cent_sensitivity = annual_kwh * 0.01
```

Inputs must have sensible validation and the feature must state that it excludes capital expenditure, pool fees, repairs, taxes, and mining revenue.

### FR-6: Methodology and source register

The application must explain:

- Criteria, weights, thresholds, and formulas.
- Confidence-adjustment method.
- Recommendation eligibility rules.
- Observation classifications.
- Data limitations and update date.
- Full source register with title, publisher, URL, publication date when available, access date, geography, and associated criterion.

External links open safely and are visibly labelled.

### FR-7: Download

Users can download:

- Complete observation data as CSV.
- Scored market summary as CSV.
- Source register as CSV or JSON.

Downloaded data must match the application snapshot and include a version or snapshot date.

### FR-8: Deep-linkable state

Market detail routes must be linkable. Scenario weights may be encoded in the URL only if the implementation remains understandable and avoids excessively long URLs; this is not required for MVP.

## 10. Information architecture

Recommended navigation:

1. Overview
2. Compare markets
3. Scenario lab
4. Power-cost calculator
5. Methodology and sources

Market details may be routes under `/markets/:slug` or accessible drawers with valid deep links.

## 11. User experience requirements

- Lead with the recommendation, then expose supporting detail progressively.
- Use neutral, professional visual language suitable for an infrastructure or energy presentation.
- Do not imitate cryptocurrency trading dashboards.
- Avoid decorative animations, glowing coin imagery, and misleading live-market styling.
- Use charts only when they improve comparison: ranked bars, criterion profiles, sensitivity comparison, and cost breakdown.
- Every chart requires a textual title, labelled units, tooltip or data labels, and an accessible table or equivalent text.
- Colour cannot be the only indicator of status.
- The interface must remain usable at 320 CSS pixels wide.
- Desktop tables may become cards or horizontally scroll with clear affordance on small screens.
- Format currencies and percentages consistently and identify nominal currency assumptions.

## 12. Data model

The exact storage format may be JSON, CSV, or TypeScript data modules, but it must represent these entities.

### 12.1 Market

```ts
type Market = {
  id: string;
  slug: string;
  name: string;
  country: string;
  region: string;
  latitude?: number;
  longitude?: number;
  summary: string;
  opportunity: string;
  constraint: string;
  customerSegments: string[];
  valueProposition: string;
  regulatoryEligibility: "eligible" | "ineligible" | "unverified";
};
```

### 12.2 Criterion

```ts
type Criterion = {
  id: string;
  name: string;
  description: string;
  defaultWeight: number;
  scoringGuide: Array<{ score: number; definition: string }>;
};
```

### 12.3 Observation

```ts
type Observation = {
  id: string;
  marketId: string;
  criterionId: string;
  metric: string;
  value: number | string | null;
  unit?: string;
  observationType: "observed" | "derived" | "assumption" | "assessment";
  periodStart?: string;
  periodEnd?: string;
  score: number;
  confidence: "high" | "medium" | "low";
  rationale: string;
  sourceIds: string[];
  notes?: string;
};
```

### 12.4 Source

```ts
type Source = {
  id: string;
  title: string;
  publisher: string;
  url: string;
  publishedAt?: string;
  accessedAt: string;
  geography: string;
  sourceType: "official" | "multilateral" | "company" | "industry" | "news";
};
```

### 12.5 Scenario preset

```ts
type ScenarioPreset = {
  id: string;
  name: string;
  description: string;
  weights: Record<string, number>;
};
```

## 13. Technical requirements

### 13.1 Architecture

- Client-side web application with static, version-controlled data.
- No backend is required for MVP.
- No secret keys or paid APIs are required to view or build the site.
- Data access is abstracted behind a small repository or loader layer so static files can later be replaced without rewriting presentation components.
- Scoring and calculator logic live in pure functions independent of UI components.

### 13.2 Recommended stack

- React
- TypeScript with strict type checking
- Vite
- A lightweight, accessible charting library
- Vitest for unit tests
- React Testing Library for critical interaction tests
- Playwright for one end-to-end smoke path if setup remains proportionate

The implementation may use an equivalent stack if repository constraints later dictate one. Avoid adding a database, server framework, authentication system, or state-management library without a demonstrated requirement.

### 13.3 Performance

- Target Lighthouse performance score of at least 90 on a production build under normal local test conditions.
- Avoid shipping large map libraries when the MVP does not require a geographic map.
- Lazy-load non-critical market-detail or chart code when it materially reduces the initial bundle.
- The application must remain functional when third-party source sites are unavailable.

### 13.4 Accessibility

- Target WCAG 2.2 AA for implemented components.
- Full keyboard navigation for controls.
- Visible focus states.
- Proper headings, labels, and error messages.
- Sufficient text and UI contrast.
- Reduced-motion preference respected.

### 13.5 Browser support

Support current stable versions of Chrome, Edge, Firefox, and Safari. Mobile Safari and Chrome must support the principal workflows.

## 14. Analytics and privacy

No analytics are required for MVP. If analytics are added later, use privacy-conscious, cookieless page-view measurement and document it. Do not collect personal information.

## 15. Testing and quality plan

### 15.1 Unit tests

Cover:

- Weighted-score calculation.
- Confidence adjustment.
- Weight normalisation or validation.
- Recommendation eligibility.
- Tie handling.
- Electricity calculator formulas.
- Null and boundary inputs.

### 15.2 Component tests

Cover:

- Changing a weight updates displayed rankings.
- Reset and preset actions work.
- Confidence toggle updates scores.
- Invalid calculator inputs show useful feedback.
- Source and evidence details can be opened by keyboard.

### 15.3 End-to-end smoke test

At minimum:

1. Open the overview.
2. Identify the leading market.
3. Open its detail page.
4. Navigate to the scenario lab.
5. Apply the cost-focused preset.
6. Confirm the ranking is recalculated.
7. Use the power calculator.
8. Download one dataset.

### 15.4 Data validation

A validation script or build-time check must fail when:

- IDs are duplicated or references are missing.
- Scores fall outside 1–5.
- Confidence values are invalid.
- Default or preset weights do not total 1 within a small floating-point tolerance.
- A scored observation has no rationale.
- An observed value has no source.
- A source lacks a valid URL or access date.
- A recommendation is assigned to an ineligible or unverified market.

## 16. MVP acceptance criteria

The MVP is complete only when:

- Five locations and seven criteria are present.
- Default rankings calculate from the version-controlled dataset.
- The top two eligible recommendations are visible and justified.
- Users can apply all four scenario presets and create a custom weighting.
- Confidence adjustment can be toggled.
- The power-cost calculator implements the specified formulas.
- Each market has a complete detail view and evidence list.
- Methodology and limitations are visible without downloading files.
- CSV downloads work and match the current snapshot.
- Automated scoring and calculator tests pass.
- The production build succeeds without warnings that affect correctness.
- Keyboard navigation, mobile layout, loading, empty, and error states have been manually checked.
- No placeholder claims, fabricated citations, or unlabeled assumptions remain.

## 17. Delivery phases

### Phase 1: Research design and data skeleton

- Finalise locations and scoring rubrics.
- Create schemas and example records.
- Add source register and confidence rules.
- Implement data validation before collecting the complete dataset.

### Phase 2: Analytical core

- Implement pure scoring, confidence, ranking, eligibility, and calculator functions.
- Add unit tests.
- Populate a clearly labelled demonstration dataset if research is incomplete.

### Phase 3: Core interface

- Build overview, comparison, market detail, and methodology views.
- Add scenario lab and calculator.
- Add downloads.

### Phase 4: Research completion

- Replace demonstration records with sourced observations.
- Review electricity-price classifications and legal status.
- Add analyst commentary, customer segments, and market-entry conditions.

### Phase 5: Verification and portfolio polish

- Run automated tests and production build.
- Inspect desktop and mobile layouts.
- Review every source link and date.
- Add concise README instructions and project screenshots.

## 18. Future enhancements

- User-selectable markets.
- Saved scenarios in local storage.
- Historical score snapshots.
- Site-level grid and substation data.
- Optional mining-revenue assumptions with explicit market-data dates.
- Automated source-age alerts.
- Exportable executive summary or PDF.
- Compare a mining deployment with an AI/HPC data-centre weighting model.

## 19. Key risks and mitigations

| Risk                                                             | Mitigation                                                            |
| ---------------------------------------------------------------- | --------------------------------------------------------------------- |
| Public electricity prices do not reflect negotiated mining rates | Label price type and model ranges rather than false point estimates   |
| National averages hide site differences                          | Use regional units of analysis and explain geographic scope           |
| Regulation changes quickly                                       | Add recent legal checks, access dates, and eligibility gates          |
| Weighted scores imply false objectivity                          | Publish rubrics, confidence, sensitivity, and qualitative constraints |
| Low-quality data dominates the result                            | Use evidence hierarchy, confidence adjustment, and age flags          |
| UI polish overshadows analysis                                   | Make sources, assumptions, and downloads first-class features         |
| Project scope expands into live-data engineering                 | Keep the MVP static and versioned                                     |

## 20. Required disclaimer

Display a concise version in the application and the full version in the methodology:

> This project is an independent research exercise using public information and analyst assumptions. It is not affiliated with Bitdeer, does not constitute investment or legal advice, and does not represent an offer of electricity, hosting capacity, or mining equipment. Actual project economics depend on site-specific contracts, engineering, taxes, regulation, equipment performance, and market conditions.
