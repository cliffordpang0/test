import { confidenceFactors, criteria, defaultWeights } from "./config";
import type {
  Confidence,
  Dataset,
  Market,
  Observation,
  Weights,
} from "./models";
export const adjustScore = (score: number, confidence: Confidence) =>
  3 + (score - 3) * confidenceFactors[confidence];
export function validWeights(weights: Weights): boolean {
  return (
    criteria.every(
      (c) =>
        Number.isFinite(weights[c.id]) &&
        weights[c.id] >= 0 &&
        weights[c.id] <= 1,
    ) && Math.abs(Object.values(weights).reduce((a, b) => a + b, 0) - 1) < 1e-8
  );
}
export function normalizeWeights(weights: Weights): Weights {
  if (
    criteria.some((c) => !Number.isFinite(weights[c.id]) || weights[c.id] < 0)
  )
    throw new Error("Weights must be finite and non-negative.");
  const total = Object.values(weights).reduce((a, b) => a + b, 0);
  return total === 0
    ? { ...defaultWeights }
    : (Object.fromEntries(
        criteria.map((c) => [c.id, weights[c.id] / total]),
      ) as Weights);
}
export function changeWeight(
  weights: Weights,
  id: keyof Weights,
  value: number,
): Weights {
  if (!Number.isFinite(value) || value < 0 || value > 1)
    throw new Error("Enter a weight between 0 and 100%.");
  const others = criteria.filter((c) => c.id !== id);
  const total = others.reduce((s, c) => s + weights[c.id], 0);
  return Object.fromEntries(
    criteria.map((c) => [
      c.id,
      c.id === id
        ? value
        : (1 - value) * (total ? weights[c.id] / total : 1 / others.length),
    ]),
  ) as Weights;
}
// Integer tenths via largest remainder: displayed weights always sum to 100.0%.
export function displayWeights(weights: Weights): Weights {
  const result = Object.fromEntries(
    criteria.map((c) => [c.id, Math.floor(weights[c.id] * 1000)]),
  ) as Weights;
  let remaining = 1000 - Object.values(result).reduce((a, b) => a + b, 0);
  const order = [...criteria].sort(
    (a, b) =>
      weights[b.id] * 1000 -
      result[b.id] -
      (weights[a.id] * 1000 - result[a.id]),
  );
  for (const c of order) {
    if (remaining-- <= 0) break;
    result[c.id]++;
  }
  return Object.fromEntries(
    criteria.map((c) => [c.id, result[c.id] / 10]),
  ) as Weights;
}
export function weightedScore(
  observations: Observation[],
  weights: Weights,
  adjusted = false,
): number | null {
  if (!validWeights(weights)) throw new Error("Weights must total 100%.");
  if (
    criteria.some(
      (c) => observations.filter((o) => o.criterionId === c.id).length !== 1,
    )
  )
    return null;
  return (
    criteria.reduce((s, c) => {
      const o = observations.find((o) => o.criterionId === c.id)!;
      return (
        s +
        (adjusted ? adjustScore(o.score, o.confidence) : o.score) *
          weights[c.id]
      );
    }, 0) * 20
  );
}
export function ageDays(date: string, asOf: string): number {
  return (Date.parse(asOf) - Date.parse(date)) / 86400000;
}
export function eligible(
  market: Market,
  demonstration: boolean,
  asOf: string,
): boolean {
  return (
    market.regulatoryEligibility === "eligible" &&
    market.miningRegulatoryScore !== null &&
    market.miningRegulatoryScore >= 2 &&
    (demonstration ||
      (market.legalCheckedAt !== null &&
        ageDays(market.legalCheckedAt, asOf) >= 0 &&
        ageDays(market.legalCheckedAt, asOf) <= 90))
  );
}
export function rankMarkets(
  data: Dataset,
  weights: Weights,
  adjusted = false,
  asOf = data.snapshot,
) {
  const rows = data.markets
    .map((market) => ({
      market,
      score: weightedScore(
        data.observations.filter((o) => o.marketId === market.id),
        weights,
        adjusted,
      ),
      eligible: eligible(market, data.demonstration, asOf),
    }))
    .sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
  const candidates = rows.filter((r) => r.eligible && r.score !== null);
  const top = candidates[0]?.score;
  const second = candidates.find(
    (r) => r.score!.toFixed(1) !== top?.toFixed(1),
  )?.score;
  return rows.map((r, i) => ({
    ...r,
    rank:
      r.score === null
        ? null
        : rows.findIndex((x) => x.score?.toFixed(1) === r.score?.toFixed(1)) +
          1,
    tied:
      r.score !== null &&
      rows.some(
        (x, j) => i !== j && x.score?.toFixed(1) === r.score?.toFixed(1),
      ),
    recommendation:
      !r.eligible || r.score === null
        ? null
        : r.score.toFixed(1) === top?.toFixed(1)
          ? "Recommended"
          : r.score.toFixed(1) === second?.toFixed(1) &&
              candidates.filter((x) => x.score?.toFixed(1) === top?.toFixed(1))
                .length === 1
            ? "Secondary opportunity"
            : null,
  }));
}
export interface CalculatorInput {
  rigs: number;
  power: number;
  price: number;
  uptime: number;
  other: number;
}
export function calculate(input: CalculatorInput) {
  const { rigs, power, price, uptime, other } = input;
  if (
    [rigs, power, price, uptime, other].some(
      (v) => !Number.isFinite(v) || v < 0,
    ) ||
    !Number.isInteger(rigs) ||
    uptime > 100 ||
    rigs > 1e9 ||
    power > 1e6 ||
    price > 1e6 ||
    other > 1e6
  )
    throw new Error(
      "Use non-negative numbers, whole rigs (up to 1 billion), uptime 0–100%, and other inputs up to 1 million.",
    );
  const kwh = (rigs * power * 24 * 365 * uptime) / 100;
  return {
    kwh,
    gwh: kwh / 1e9,
    energy: kwh * price,
    other: kwh * other,
    total: kwh * (price + other),
    sensitivity: kwh * 0.01,
  };
}
export function evidenceAge(o: Observation, asOf: string) {
  return o.periodEnd && ageDays(o.periodEnd, asOf) > 730
    ? "Review age"
    : o.periodEnd
      ? "Within 24 months"
      : "Period: " + o.reportingPeriod;
}
