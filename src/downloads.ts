import { criteria } from "./config";
import { rankMarkets } from "./engine";
import type { Dataset, Weights } from "./models";
export function csv(headers: string[], rows: unknown[][]): string {
  const cell = (v: unknown) => {
    const raw = v == null ? "" : String(v);
    const safe = /^[=+@\-\t\r]/.test(raw) ? `'${raw}` : raw;
    return '"' + safe.replaceAll('"', '""') + '"';
  };
  return (
    "\uFEFF" + [headers, ...rows].map((r) => r.map(cell).join(",")).join("\r\n")
  );
}
export function exportData(
  kind: "observations" | "scores" | "sources",
  data: Dataset,
  weights: Weights,
  adjusted: boolean,
  asOf = data.snapshot,
): string {
  const meta = [
    data.version,
    data.snapshot,
    data.demonstration ? "demonstration assumptions" : "research snapshot",
  ];
  const prefix = ["version", "snapshot", "dataset_mode"];
  if (kind === "observations")
    return csv(
      [
        ...prefix,
        "id",
        "market",
        "criterion",
        "metric",
        "value",
        "unit",
        "classification",
        "period_start",
        "period_end",
        "reporting_period",
        "score",
        "confidence",
        "rationale",
        "source_ids",
        "notes",
      ],
      data.observations.map((o) => [
        ...meta,
        o.id,
        o.marketId,
        o.criterionId,
        o.metric,
        o.value,
        o.unit,
        o.observationType,
        o.periodStart,
        o.periodEnd,
        o.reportingPeriod,
        o.score,
        o.confidence,
        o.rationale,
        o.sourceIds.join(";"),
        o.notes,
      ]),
    );
  if (kind === "sources")
    return csv(
      [
        ...prefix,
        "id",
        "title",
        "publisher",
        "url",
        "published_at",
        "accessed_at",
        "geography",
        "source_type",
        "associated_criteria",
        "evidence_confidence",
      ],
      data.sources.map((s) => [
        ...meta,
        s.id,
        s.title,
        s.publisher,
        s.url,
        s.publishedAt,
        s.accessedAt,
        s.geography,
        s.sourceType,
        [
          ...new Set(
            data.observations
              .filter((o) => o.sourceIds.includes(s.id))
              .map((o) => o.criterionId),
          ),
        ].join(";"),
        [
          ...new Set(
            data.observations
              .filter((o) => o.sourceIds.includes(s.id))
              .map((o) => o.confidence),
          ),
        ].join(";"),
      ]),
    );
  return csv(
    [
      ...prefix,
      "market",
      "score_out_of_100",
      "classification",
      "rank",
      "tied",
      "recommendation",
      "eligible",
      "mining_status",
      "mining_score",
      "legal_checked_at",
      "confidence_adjusted",
      "assumptions",
      "entry_condition",
      "eligibility_evaluated_at",
      "price_type",
      "price_classification",
      "price_unit",
      "optimistic_price",
      "base_price",
      "stress_price",
      "country",
      "region",
      "commercial_rationale",
      "primary_constraint",
      ...criteria.flatMap((c) => [c.id + "_score", c.id + "_weight"]),
    ],
    rankMarkets(data, weights, adjusted, asOf).map((r) => [
      ...meta,
      r.market.name,
      r.score,
      "derived",
      r.rank,
      r.tied,
      r.recommendation,
      r.eligible,
      r.market.regulatoryEligibility,
      r.market.miningRegulatoryScore,
      r.market.legalCheckedAt,
      adjusted,
      data.demonstration
        ? "All demo scores and eligibility inputs are assumptions; no actual legality verified."
        : "See observation classifications and source evidence.",
      r.market.entryCondition,
      asOf,
      r.market.prices.type,
      "assumption",
      "USD/kWh",
      r.market.prices.optimistic,
      r.market.prices.base,
      r.market.prices.stress,
      r.market.country,
      r.market.region,
      r.market.opportunity,
      r.market.constraint,
      ...criteria.flatMap((c) => [
        data.observations.find(
          (o) => o.marketId === r.market.id && o.criterionId === c.id,
        )?.score,
        weights[c.id],
      ]),
    ]),
  );
}
export function downloadCsv(name: string, content: string) {
  const url = URL.createObjectURL(
    new Blob([content], { type: "text/csv;charset=utf-8;" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
