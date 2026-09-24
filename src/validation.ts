import { criteria, defaultWeights, presets } from "./config";
import { eligible, rankMarkets, validWeights } from "./engine";
import type { Dataset } from "./models";
const dateValid = (s: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(s) &&
  !Number.isNaN(Date.parse(s)) &&
  new Date(s).toISOString().slice(0, 10) === s;
export function validateDataset(data: Dataset): string[] {
  const errors: string[] = [];
  const check = (ok: boolean, message: string) => {
    if (!ok) errors.push(message);
  };
  check(dateValid(data.snapshot), "Snapshot date invalid");
  check(Boolean(data.version), "Version missing");
  for (const [label, items] of [
    ["market", data.markets],
    ["observation", data.observations],
    ["source", data.sources],
    ["criterion", criteria],
    ["preset", presets],
  ] as const) {
    check(
      new Set(items.map((x) => x.id)).size === items.length,
      `Duplicate ${label} IDs`,
    );
  }
  check(
    new Set(data.markets.map((m) => m.slug)).size === data.markets.length,
    "Duplicate market slugs",
  );
  check(validWeights(defaultWeights), "Default weights invalid");
  for (const p of presets)
    check(validWeights(p.weights), `Preset ${p.id} weights invalid`);
  for (const m of data.markets) {
    check(
      ["eligible", "ineligible", "unverified"].includes(
        m.regulatoryEligibility,
      ),
      `${m.id}: invalid eligibility`,
    );
    check(
      m.miningRegulatoryScore === null ||
        (Number.isFinite(m.miningRegulatoryScore) &&
          m.miningRegulatoryScore >= 1 &&
          m.miningRegulatoryScore <= 5),
      `${m.id}: invalid mining score`,
    );
    check(
      m.legalCheckedAt === null || dateValid(m.legalCheckedAt),
      `${m.id}: invalid legal date`,
    );
    check(
      Object.values(m.prices)
        .filter((x) => typeof x === "number")
        .every((x) => Number.isFinite(x) && x >= 0),
      `${m.id}: invalid price`,
    );
    for (const c of criteria)
      check(
        data.observations.filter(
          (o) => o.marketId === m.id && o.criterionId === c.id,
        ).length === 1,
        `${m.id}/${c.id}: exactly one scored observation required`,
      );
  }
  for (const o of data.observations) {
    check(
      data.markets.some((m) => m.id === o.marketId),
      `${o.id}: missing market`,
    );
    check(
      criteria.some((c) => c.id === o.criterionId),
      `${o.id}: missing criterion`,
    );
    check(
      Number.isFinite(o.score) && o.score >= 1 && o.score <= 5,
      `${o.id}: score outside 1–5`,
    );
    check(
      ["high", "medium", "low"].includes(o.confidence),
      `${o.id}: invalid confidence`,
    );
    check(
      ["observed", "derived", "assumption", "assessment"].includes(
        o.observationType,
      ),
      `${o.id}: invalid classification`,
    );
    check(Boolean(o.rationale.trim()), `${o.id}: missing rationale`);
    check(
      Boolean(o.periodEnd || o.reportingPeriod),
      `${o.id}: missing reporting period`,
    );
    if (o.periodEnd)
      check(dateValid(o.periodEnd), `${o.id}: invalid period end`);
    if (o.periodStart)
      check(dateValid(o.periodStart), `${o.id}: invalid period start`);
    check(
      o.observationType === "assumption" || o.sourceIds.length > 0,
      `${o.id}: evidence requires a source`,
    );
    check(
      o.sourceIds.every((id) => data.sources.some((s) => s.id === id)),
      `${o.id}: source reference missing`,
    );
  }
  for (const s of data.sources) {
    let valid = false;
    try {
      const url = new URL(s.url);
      valid = ["http:", "https:"].includes(url.protocol);
    } catch {
      valid = false;
    }
    check(valid, `${s.id}: invalid URL`);
    check(dateValid(s.accessedAt), `${s.id}: invalid access date`);
    check(
      Boolean(s.title && s.publisher && s.geography),
      `${s.id}: source metadata missing`,
    );
    if (s.publishedAt)
      check(dateValid(s.publishedAt), `${s.id}: invalid publication date`);
  }
  if (!errors.length)
    for (const row of rankMarkets(data, defaultWeights))
      check(
        !row.recommendation ||
          eligible(row.market, data.demonstration, data.snapshot),
        `${row.market.id}: ineligible recommendation`,
      );
  return errors;
}
