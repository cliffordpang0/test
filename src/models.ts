export type Confidence = "high" | "medium" | "low";
export type ObservationType =
  "observed" | "derived" | "assumption" | "assessment";
export type CriterionId =
  "cost" | "power" | "grid" | "risk" | "climate" | "logistics" | "readiness";
export type Weights = Record<CriterionId, number>;
export type PriceType =
  | "public industrial average"
  | "published tariff"
  | "wholesale-market observation"
  | "estimated all-in delivered price"
  | "analyst scenario"
  | "private or negotiated price";
export interface Criterion {
  id: CriterionId;
  name: string;
  description: string;
  defaultWeight: number;
  scoringGuide: { score: number; definition: string }[];
}
export interface Market {
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
  entryCondition: string;
  regulatoryEligibility: "eligible" | "ineligible" | "unverified";
  miningRegulatoryScore: number | null;
  legalCheckedAt: string | null;
  generalRisk: string;
  prices: { type: PriceType; optimistic: number; base: number; stress: number };
}
export interface Observation {
  id: string;
  marketId: string;
  criterionId: CriterionId;
  metric: string;
  value: number | string | null;
  unit?: string;
  observationType: ObservationType;
  periodStart?: string;
  periodEnd?: string;
  reportingPeriod?: string;
  score: number;
  confidence: Confidence;
  rationale: string;
  sourceIds: string[];
  notes?: string;
}
export interface Source {
  id: string;
  title: string;
  publisher: string;
  url: string;
  publishedAt?: string;
  accessedAt: string;
  geography: string;
  sourceType: "official" | "multilateral" | "company" | "industry" | "news";
}
export interface ScenarioPreset {
  id: string;
  name: string;
  description: string;
  weights: Weights;
}
export interface Dataset {
  version: string;
  snapshot: string;
  demonstration: boolean;
  markets: Market[];
  observations: Observation[];
  sources: Source[];
}
