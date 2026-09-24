import { criteria } from "./config";
import type { Dataset, Market } from "./models";
const snapshot = "2026-09-24";
const rows: [
  string,
  string,
  string,
  string,
  number[],
  number,
  Market["regulatoryEligibility"],
][] = [
  [
    "texas",
    "Texas",
    "United States",
    "Texas power market",
    [3.5, 4, 4, 3.5, 2.5, 4.5, 4.5],
    0.07,
    "eligible",
  ],
  [
    "norway",
    "Northern Norway",
    "Norway",
    "Northern Norway",
    [3.2, 4.5, 4.5, 4, 5, 3.5, 4],
    0.08,
    "eligible",
  ],
  [
    "paraguay",
    "Itaipu-adjacent Paraguay",
    "Paraguay",
    "Itaipu-adjacent region",
    [4.8, 4.5, 2.5, 2.5, 2, 2.5, 2],
    0.04,
    "eligible",
  ],
  [
    "ethiopia",
    "Ethiopia",
    "Ethiopia",
    "National screening; site not selected",
    [5, 3.5, 2, 1.5, 3, 2, 1.5],
    0.03,
    "unverified",
  ],
  [
    "sarawak",
    "Sarawak",
    "Malaysia",
    "Sarawak",
    [4, 4, 3, 2, 2, 3, 3],
    0.06,
    "ineligible",
  ],
];
const markets: Market[] = rows.map(
  ([id, name, country, region, , price, status], i) => ({
    id,
    slug: id,
    name,
    country,
    region,
    summary:
      "Synthetic screening profile for workflow demonstration. These scores do not describe verified local conditions.",
    opportunity: [
      "Explore a hypothetical flexible-load deployment.",
      "Explore a hypothetical renewable-led, cooling-efficient deployment.",
      "Explore a hypothetical low-cost expansion.",
      "Explore a hypothetical early-stage power opportunity.",
      "Explore a hypothetical infrastructure partnership.",
    ][i],
    constraint:
      "No site-level contracts, capacity, engineering or legal diligence has been completed.",
    customerSegments: [
      "Illustrative: large-load developers",
      "Illustrative: hosting operators",
    ],
    valueProposition:
      "Illustrative proposition: compare modular deployment options against a verified power and operating envelope.",
    entryCondition:
      "Obtain current mining-specific legal advice, a site-level delivered-power quote and grid-connection confirmation.",
    regulatoryEligibility: status,
    miningRegulatoryScore:
      status === "unverified" ? null : status === "ineligible" ? 1.5 : 3,
    legalCheckedAt: null,
    generalRisk:
      "Assumption: the political and regulatory criterion is a synthetic operating-risk assessment, separate from the simulated mining gate.",
    prices: {
      type: "analyst scenario",
      optimistic: price * 0.8,
      base: price,
      stress: price * 1.3,
    },
  }),
);
export const dataset: Dataset = {
  version: "demo-1.0",
  snapshot,
  demonstration: true,
  markets,
  sources: [],
  observations: rows.flatMap(([id, , , , scores], i) =>
    criteria.map((c, j) => ({
      id: `${id}-${c.id}`,
      marketId: id,
      criterionId: c.id,
      metric:
        c.id === "cost"
          ? "Illustrative electricity price"
          : `${c.name} modelling input`,
      value:
        c.id === "cost"
          ? markets[i].prices.base
          : i === 3 && j === 2
            ? null
            : "Synthetic qualitative input",
      unit: c.id === "cost" ? "USD/kWh" : undefined,
      observationType: "assumption" as const,
      periodEnd: i === 3 && j === 2 ? "2023-01-01" : snapshot,
      score: scores[j],
      confidence: i === 1 ? ("medium" as const) : ("low" as const),
      rationale: `Analyst-selected demonstration score ${scores[j]}/5 for ${c.name.toLowerCase()}; no real-world inference is supported. ${i === 3 && j === 2 ? "Raw evidence is unavailable; this explicit low-confidence assumption exists only to exercise missing-data handling." : ""}`,
      sourceIds: [],
      notes:
        "No external evidence collected. Replace this assumption with sourced research before using the result.",
    })),
  ),
};
// Static repository boundary: replace this loader when adding a reviewed snapshot.
export function loadDataset(): Dataset {
  return dataset;
}
