import { describe, expect, it } from "vitest";
import { dataset } from "./data";
import { criteria, defaultWeights, presets } from "./config";
import {
  adjustScore,
  calculate,
  changeWeight,
  displayWeights,
  eligible,
  evidenceAge,
  normalizeWeights,
  rankMarkets,
  validWeights,
  weightedScore,
} from "./engine";
import { validateDataset } from "./validation";
import { csv, exportData } from "./downloads";
describe("analytical core", () => {
  it("calculates all seven weighted inputs at full precision", () => {
    const obs = dataset.observations.filter((o) => o.marketId === "texas");
    expect(weightedScore(obs, defaultWeights)).toBeCloseTo(74.5);
    expect(
      weightedScore(
        obs.map((o) => ({ ...o, score: 5 })),
        defaultWeights,
      ),
    ).toBeCloseTo(100);
    expect(
      weightedScore(
        obs.map((o) => ({ ...o, score: 1 })),
        defaultWeights,
      ),
    ).toBeCloseTo(20);
  });
  it("adjusts toward neutral in both directions", () => {
    expect(adjustScore(5, "low")).toBe(3.8);
    expect(adjustScore(1, "low")).toBe(2.2);
    expect(adjustScore(4, "medium")).toBe(3.75);
    expect(adjustScore(3, "high")).toBe(3);
  });
  it("keeps null raw data distinct from a justified score", () => {
    const obs = dataset.observations.filter((o) => o.marketId === "ethiopia");
    expect(obs.some((o) => o.value === null)).toBe(true);
    expect(weightedScore(obs, defaultWeights)).not.toBeNull();
    expect(weightedScore(obs.slice(1), defaultWeights)).toBeNull();
  });
  it("normalizes and redistributes zero and full weights", () => {
    const zero = Object.fromEntries(
      criteria.map((c) => [c.id, 0]),
    ) as typeof defaultWeights;
    expect(normalizeWeights(zero)).toEqual(defaultWeights);
    const all = changeWeight(defaultWeights, "cost", 1);
    expect(all.cost).toBe(1);
    expect(validWeights(changeWeight(all, "cost", 0))).toBe(true);
    expect(() => changeWeight(all, "cost", -1)).toThrow();
    expect(() => normalizeWeights({ ...zero, cost: NaN })).toThrow();
    for (let i = 0; i <= 100; i++) {
      const w = changeWeight(defaultWeights, "cost", i / 100);
      expect(validWeights(w)).toBe(true);
      expect(
        Object.values(displayWeights(w)).reduce((a, b) => a + b, 0),
      ).toBeCloseTo(100);
    }
  });
  it("implements all presets and changes rankings", () => {
    expect(presets).toHaveLength(4);
    presets.forEach((p) => expect(validWeights(p.weights)).toBe(true));
    expect(rankMarkets(dataset, defaultWeights)[0].market.id).toBe("norway");
    expect(rankMarkets(dataset, presets[1].weights)[0].market.id).toBe(
      "paraguay",
    );
  });
  it("blocks unverified, prohibited and stale legal status", () => {
    const m = dataset.markets[0];
    expect(eligible(m, true, dataset.snapshot)).toBe(true);
    expect(eligible(m, false, dataset.snapshot)).toBe(false);
    expect(
      eligible(
        { ...m, legalCheckedAt: dataset.snapshot },
        false,
        dataset.snapshot,
      ),
    ).toBe(true);
    expect(
      eligible({ ...m, miningRegulatoryScore: 1.99 }, true, dataset.snapshot),
    ).toBe(false);
    expect(
      eligible({ ...m, miningRegulatoryScore: 2 }, true, dataset.snapshot),
    ).toBe(true);
    expect(
      eligible(
        { ...m, regulatoryEligibility: "unverified" },
        true,
        dataset.snapshot,
      ),
    ).toBe(false);
    expect(
      eligible({ ...m, legalCheckedAt: "2026-01-01" }, false, dataset.snapshot),
    ).toBe(false);
    expect(
      rankMarkets(dataset, defaultWeights)
        .filter((r) => r.recommendation)
        .every((r) => r.eligible),
    ).toBe(true);
  });
  it("retains visible ties, including recommendation boundary", () => {
    const data = structuredClone(dataset);
    data.observations = data.observations.map((o) => ({ ...o, score: 4 }));
    const ranks = rankMarkets(data, defaultWeights);
    expect(ranks.every((r) => r.rank === 1 && r.tied)).toBe(true);
    expect(ranks.filter((r) => r.recommendation)).toHaveLength(3);
    expect(
      ranks.filter((r) => !r.eligible).every((r) => !r.recommendation),
    ).toBe(true);
  });
  it("flags older evidence", () => {
    expect(
      evidenceAge(
        dataset.observations.find((o) => o.value === null)!,
        dataset.snapshot,
      ),
    ).toBe("Review age");
  });
  it("reproduces annual energy and sensitivity including zero", () => {
    expect(
      calculate({
        rigs: 1000,
        power: 3.5,
        price: 0.07,
        uptime: 95,
        other: 0.01,
      }),
    ).toEqual({
      kwh: 29127000,
      gwh: 0.029127,
      energy: 2038890.0000000002,
      other: 291270,
      total: 2330160,
      sensitivity: 291270,
    });
    expect(
      calculate({ rigs: 0, power: 3, price: 0, uptime: 0, other: 0 }).total,
    ).toBe(0);
    for (const patch of [
      { rigs: 1.5 },
      { power: -1 },
      { uptime: 101 },
      { price: NaN },
      { other: Infinity },
    ])
      expect(() =>
        calculate({
          rigs: 1,
          power: 3,
          price: 0.1,
          uptime: 100,
          other: 0,
          ...patch,
        }),
      ).toThrow();
  });
});
describe("data and downloads", () => {
  it("validates the demonstration without invented citations", () => {
    expect(validateDataset(dataset)).toEqual([]);
    expect(dataset.sources).toEqual([]);
    expect(
      dataset.observations.every((o) => o.observationType === "assumption"),
    ).toBe(true);
  });
  it("rejects duplicate IDs, missing sources, invalid scores and dates", () => {
    const data = structuredClone(dataset);
    data.observations[0] = {
      ...data.observations[0],
      score: 6,
      observationType: "observed",
      rationale: "",
      periodEnd: "2026-02-30",
    };
    data.markets[1].id = data.markets[0].id;
    const errors = validateDataset(data);
    expect(errors.some((e) => e.includes("Duplicate"))).toBe(true);
    expect(errors.some((e) => e.includes("score outside"))).toBe(true);
    expect(errors.some((e) => e.includes("requires a source"))).toBe(true);
    expect(errors.some((e) => e.includes("missing rationale"))).toBe(true);
    expect(errors.some((e) => e.includes("invalid period"))).toBe(true);
  });
  it("escapes CSV and guards spreadsheet formulas", () => {
    expect(
      csv(["value"], [['a,"b"\nc'], [null], ['=HYPERLINK("bad")']]),
    ).toContain('"a,""b""\nc"');
    expect(csv(["value"], [[null]])).toContain('""');
    expect(csv(["value"], [["=1+1"]])).toContain("'=1+1");
  });
  it("exports full snapshot, classification, missing values and current scenario", () => {
    const out = exportData("observations", dataset, defaultWeights, false);
    expect(out).toContain("demo-1.0");
    expect(out).toContain("assumption");
    expect(out).toContain("ethiopia-grid");
    const scores = exportData("scores", dataset, presets[1].weights, true);
    expect(scores).toContain('"0.55"');
    expect(scores).toContain('"true"');
    expect(scores).toContain("derived");
    expect(scores).toContain('"optimistic_price"');
    expect(scores).toContain('"analyst scenario"');
    expect(scores).toContain('"USD/kWh"');
    expect(exportData("sources", dataset, defaultWeights, false)).toContain(
      "accessed_at",
    );
  });
});
