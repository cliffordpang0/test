import type { Criterion, CriterionId, ScenarioPreset, Weights } from "./models";
const definitions: [CriterionId, string, string, number, string[]][] = [
  [
    "cost",
    "Electricity cost",
    "All-in industrial electricity economics",
    0.3,
    [
      "Very high cost",
      "High cost",
      "Moderate cost",
      "Competitive cost",
      "Highly competitive cost",
    ],
  ],
  [
    "power",
    "Power availability",
    "Suitable power and renewable supply at scale",
    0.15,
    [
      "Severely constrained",
      "Limited capacity",
      "Conditional supply",
      "Good availability",
      "Strong scalable supply",
    ],
  ],
  [
    "grid",
    "Grid & flexibility",
    "Reliability, uptime and load flexibility",
    0.1,
    [
      "Frequent disruption",
      "Weak reliability",
      "Manageable constraints",
      "Reliable and flexible",
      "Strong reliability and flexibility",
    ],
  ],
  [
    "risk",
    "Political & regulatory",
    "General operating risk; mining legality is a separate gate",
    0.15,
    [
      "Prohibitive uncertainty",
      "High uncertainty",
      "Mixed predictability",
      "Predictable environment",
      "Strong predictability",
    ],
  ],
  [
    "climate",
    "Climate & cooling",
    "Cooling burden and environmental exposure",
    0.1,
    [
      "Severe burden",
      "High burden",
      "Moderate burden",
      "Favourable conditions",
      "Very favourable conditions",
    ],
  ],
  [
    "logistics",
    "Import & logistics",
    "Equipment delivery and import conditions",
    0.1,
    [
      "Severe barriers",
      "Significant barriers",
      "Manageable complexity",
      "Efficient delivery",
      "Very efficient delivery",
    ],
  ],
  [
    "readiness",
    "Data-centre readiness",
    "Construction, infrastructure and operational support",
    0.1,
    [
      "Minimal readiness",
      "Limited support",
      "Developing capability",
      "Established capability",
      "Deep deployment capability",
    ],
  ],
];
export const criteria: Criterion[] = definitions.map(
  ([id, name, description, defaultWeight, guide]) => ({
    id,
    name,
    description,
    defaultWeight,
    scoringGuide: guide.map((definition, i) => ({ score: i + 1, definition })),
  }),
);
export const defaultWeights = Object.fromEntries(
  criteria.map((c) => [c.id, c.defaultWeight]),
) as Weights;
export const confidenceFactors = { high: 1, medium: 0.75, low: 0.4 } as const;
export const presets: ScenarioPreset[] = [
  {
    id: "base",
    name: "Base case",
    description: "Balanced commercial screening.",
    weights: defaultWeights,
  },
  {
    id: "cost",
    name: "Cost-focused",
    description: "Prioritise electricity economics.",
    weights: {
      cost: 0.55,
      power: 0.1,
      grid: 0.1,
      risk: 0.1,
      climate: 0.05,
      logistics: 0.05,
      readiness: 0.05,
    },
  },
  {
    id: "risk",
    name: "Risk-conscious",
    description: "Prioritise predictability and reliability.",
    weights: {
      cost: 0.15,
      power: 0.1,
      grid: 0.2,
      risk: 0.3,
      climate: 0.05,
      logistics: 0.1,
      readiness: 0.1,
    },
  },
  {
    id: "sustainability",
    name: "Sustainability-focused",
    description: "Prioritise renewable supply and cooling.",
    weights: {
      cost: 0.15,
      power: 0.35,
      grid: 0.1,
      risk: 0.1,
      climate: 0.2,
      logistics: 0.05,
      readiness: 0.05,
    },
  },
];
