import { useEffect, useRef, useState } from "react";
import { criteria, defaultWeights, presets } from "./config";
import { loadDataset } from "./data";
import {
  adjustScore,
  calculate,
  changeWeight,
  displayWeights,
  evidenceAge,
  rankMarkets,
} from "./engine";
import type { CalculatorInput } from "./engine";
import { downloadCsv, exportData } from "./downloads";
import { validateDataset } from "./validation";
import type { Dataset, Observation, Weights } from "./models";

const nav = [
  ["overview", "Overview"],
  ["compare", "Compare markets"],
  ["scenario", "Scenario lab"],
  ["calculator", "Power-cost calculator"],
  ["methodology", "Methodology & sources"],
];
const money = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
const number = (value: number) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value);
const disclaimer =
  "This project is an independent research exercise using public information and analyst assumptions. It is not affiliated with Bitdeer, does not constitute investment or legal advice, and does not represent an offer of electricity, hosting capacity, or mining equipment. Actual project economics depend on site-specific contracts, engineering, taxes, regulation, equipment performance, and market conditions.";
function Tag({ children }: { children: React.ReactNode }) {
  return <span className="tag">{children}</span>;
}
function Downloads({
  data,
  weights,
  adjusted,
}: {
  data: Dataset;
  weights: Weights;
  adjusted: boolean;
}) {
  return (
    <div className="downloads">
      {(["observations", "scores", "sources"] as const).map((kind) => (
        <button
          className="button secondary"
          key={kind}
          onClick={() =>
            downloadCsv(
              `${data.version}-${data.snapshot}-${kind}.csv`,
              exportData(
                kind,
                data,
                weights,
                adjusted,
                new Date().toISOString().slice(0, 10),
              ),
            )
          }
        >
          ↓{" "}
          {kind === "scores"
            ? "Scored summary"
            : kind === "sources"
              ? "Source register"
              : "Observations"}{" "}
          CSV
        </button>
      ))}
    </div>
  );
}
function Evidence({ o, data }: { o: Observation; data: Dataset }) {
  return (
    <article className="evidence" id={`evidence-${o.id}`}>
      <div className="section-head">
        <h3>{criteria.find((c) => c.id === o.criterionId)?.name}</h3>
        <strong>
          {o.score.toFixed(1)} / 5{" "}
          <Tag>
            {o.observationType === "assumption"
              ? "Assumed score"
              : "Assessment score"}
          </Tag>
        </strong>
      </div>
      <p>
        <Tag>{o.observationType}</Tag> <Tag>{o.confidence} confidence</Tag>{" "}
        <Tag>{evidenceAge(o, new Date().toISOString().slice(0, 10))}</Tag>
      </p>
      <p>
        <strong>{o.metric}:</strong>{" "}
        {o.value === null ? "Data unavailable" : o.value} {o.unit}
      </p>
      <p>{o.rationale}</p>
      <p className="muted">
        Period: {o.periodEnd ?? o.reportingPeriod} · {o.notes}
      </p>
      <details>
        <summary>Evidence & source details</summary>
        {o.sourceIds.length ? (
          o.sourceIds.map((id) => {
            const s = data.sources.find((s) => s.id === id)!;
            return (
              <p key={id}>
                <a href={s.url} target="_blank" rel="noopener noreferrer">
                  {s.title} ↗ (external)
                </a>{" "}
                · {s.publisher} · {s.geography} · Published:{" "}
                {s.publishedAt ?? "Not provided"} · Accessed: {s.accessedAt}
              </p>
            );
          })
        ) : (
          <p>
            No source collected. This is an explicit demonstration assumption,
            not observed evidence.
          </p>
        )}
      </details>
    </article>
  );
}
function Calculator() {
  const [inputs, setInputs] = useState<Record<keyof CalculatorInput, string>>({
    rigs: "1000",
    power: "3.5",
    price: "0.07",
    uptime: "95",
    other: "0",
  });
  let result: ReturnType<typeof calculate> | null = null;
  let error = "";
  try {
    if (Object.values(inputs).some((v) => v.trim() === ""))
      throw new Error(
        "Complete every input; use 0 for no other variable cost.",
      );
    result = calculate(
      Object.fromEntries(
        Object.entries(inputs).map(([k, v]) => [k, Number(v)]),
      ) as unknown as CalculatorInput,
    );
  } catch (e) {
    error = (e as Error).message;
  }
  const fields: [keyof CalculatorInput, string, string][] = [
    ["rigs", "Number of rigs", "1"],
    ["power", "Power per rig (kW)", "0.1"],
    ["price", "Electricity price (USD/kWh)", "0.01"],
    ["uptime", "Expected uptime (%)", "1"],
    ["other", "Other variable cost (USD/kWh)", "0.01"],
  ];
  return (
    <>
      <div className="page-heading">
        <span className="eyebrow">Deployment economics</span>
        <h1>What does power cost?</h1>
        <p>
          Test a hypothetical fleet. Every input is a user-selected assumption
          in nominal USD.
        </p>
      </div>
      <div className="two-column">
        <section className="panel">
          <h2>Fleet assumptions</h2>
          {fields.map(([id, label, step]) => (
            <label className="field" key={id}>
              {label}
              <input
                type="number"
                min="0"
                max={id === "uptime" ? 100 : id === "rigs" ? 1e9 : 1e6}
                step={step}
                value={inputs[id]}
                aria-describedby="calculator-help"
                onChange={(e) => setInputs({ ...inputs, [id]: e.target.value })}
              />
            </label>
          ))}
          <p id="calculator-help" className="muted">
            8760 hours per year. Uptime scales all variable costs. Hosting is
            optional: enter 0 to omit it.
          </p>
          {error && (
            <p role="alert" className="error">
              {error}
            </p>
          )}
        </section>
        <section className="panel dark" aria-live="polite">
          <Tag>Derived from your assumptions</Tag>
          <h2>Annual variable expenditure</h2>
          <div className="big-number">{result ? money(result.total) : "—"}</div>
          {result ? (
            <dl className="results">
              <dt>Electricity consumption</dt>
              <dd>
                {number(result.kwh)} kWh
                <br />
                {number(result.gwh)} GWh
              </dd>
              <dt>Energy expenditure</dt>
              <dd>{money(result.energy)}</dd>
              <dt>Hosting / other variable</dt>
              <dd>{money(result.other)}</dd>
              <dt>± USD 0.01/kWh</dt>
              <dd>± {money(result.sensitivity)} / year</dd>
            </dl>
          ) : (
            <p>Results unavailable until inputs are valid.</p>
          )}
          <p>
            Excludes capital expenditure, pool fees, repairs, taxes and mining
            revenue. This is not a profitability model.
          </p>
        </section>
      </div>
    </>
  );
}

export default function App({ data = loadDataset() }: { data?: Dataset }) {
  const [route, setRoute] = useState(
    () => window.location.hash.slice(1) || "overview",
  );
  const [weights, setWeights] = useState<Weights>({ ...defaultWeights });
  const [adjusted, setAdjusted] = useState(false);
  const [preset, setPreset] = useState("base");
  const [sort, setSort] = useState("total");
  const [weightError, setWeightError] = useState("");
  const mainRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const onHash = () => {
      setRoute(window.location.hash.slice(1) || "overview");
      window.scrollTo(0, 0);
      mainRef.current?.focus();
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  const errors = validateDataset(data);
  const ranked = errors.length
    ? []
    : rankMarkets(
        data,
        weights,
        adjusted,
        new Date().toISOString().slice(0, 10),
      );
  const scoreFor = (marketId: string, criterionId: string) => {
    const observation = data.observations.find(
      (o) => o.marketId === marketId && o.criterionId === criterionId,
    )!;
    return adjusted
      ? adjustScore(observation.score, observation.confidence)
      : observation.score;
  };
  const recommended = ranked.filter((r) => r.recommendation);
  const shownWeights = displayWeights(weights);
  const parts = route.split("/");
  const market =
    parts[0] === "markets"
      ? data.markets.find((m) => m.slug === parts[1])
      : undefined;
  useEffect(() => {
    document.title = `${market?.name ?? nav.find((n) => n[0] === route)?.[1] ?? "Page not found"} | Regional Power Opportunity Map`;
  }, [route, market]);
  const ranking = (
    <div className="rank-list">
      {ranked.map((r) => (
        <article className="rank-row" key={r.market.id}>
          <span className="rank-number">
            {r.rank ?? "—"}
            {r.tied ? " =" : ""}
          </span>
          <div className="rank-name">
            <a href={`#markets/${r.market.slug}`}>{r.market.name}</a>
            <small>
              {r.market.country} ·{" "}
              {data.observations
                .filter((o) => o.marketId === r.market.id)
                .some((o) => o.confidence === "low")
                ? "Low confidence"
                : "Medium confidence"}
              {r.tied ? " · Tied score" : ""}
            </small>
            <span className="status">
              {!r.eligible
                ? "Critical constraint"
                : r.recommendation
                  ? `${data.demonstration ? "Simulated · " : ""}${r.recommendation}`
                  : "Eligible in simulation"}
            </span>
          </div>
          <div className="score-track" aria-hidden="true">
            <span style={{ width: `${r.score ?? 0}%` }} />
          </div>
          <strong className="score">
            {r.score?.toFixed(1) ?? "—"}
            <small>/ 100</small>
          </strong>
        </article>
      ))}
    </div>
  );
  const confidenceControl = (
    <label className="toggle">
      <input
        type="checkbox"
        checked={adjusted}
        onChange={(e) => setAdjusted(e.target.checked)}
      />{" "}
      Enable confidence adjustment{" "}
      <span className="muted">{adjusted ? "On" : "Off"}</span>
    </label>
  );
  return (
    <>
      <a
        className="skip"
        href="#main-content"
        onClick={(e) => {
          e.preventDefault();
          mainRef.current?.focus();
        }}
      >
        Skip to content
      </a>
      <header>
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            ▥
          </span>
          <div>
            REGIONAL POWER<span>Opportunity Map</span>
          </div>
        </div>
        <div className="snapshot">
          STATIC RESEARCH SNAPSHOT
          <strong>
            {data.snapshot} · {data.version}
          </strong>
        </div>
      </header>
      <nav aria-label="Main navigation">
        {nav.map(([id, label]) => (
          <a
            key={id}
            href={`#${id}`}
            aria-current={route === id ? "page" : undefined}
          >
            {label}
          </a>
        ))}
      </nav>
      <div className="demo-notice">
        <strong>DEMONSTRATION DATA</strong>
        <span>
          All market values and eligibility states are synthetic assumptions. No
          actual mining legality has been verified.
        </span>
      </div>
      <main id="main-content" ref={mainRef} tabIndex={-1}>
        {errors.length ? (
          <section className="panel error" role="alert">
            <h1>Dataset could not be loaded</h1>
            <p>Correct the snapshot before using this analysis.</p>
            <ul>
              {errors.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          </section>
        ) : data.markets.length === 0 ? (
          <section className="panel">
            <h1>No markets available</h1>
            <p>Add a reviewed dataset to begin comparing opportunities.</p>
          </section>
        ) : route === "overview" ? (
          <>
            <div className="page-heading">
              <span className="eyebrow">
                An infrastructure screening workspace
              </span>
              <h1>
                Find the opportunity.
                <br />
                <em>Understand the conditions.</em>
              </h1>
              <p>
                Compare power economics and deployment readiness across five
                markets. Follow the evidence before moving from screening to a
                site decision.
              </p>
            </div>
            <div className="section-head">
              <h2>Where to look first</h2>
              <a href="#scenario">Explore the assumptions →</a>
            </div>
            <div className="recommendations">
              {recommended.length ? (
                recommended.map((r, i) => (
                  <article
                    className={`recommendation ${i === 0 ? "featured" : ""}`}
                    key={r.market.id}
                  >
                    <div className="section-head">
                      <span className="eyebrow">
                        {data.demonstration ? "Simulated · " : ""}
                        {r.recommendation}
                        {r.tied ? " (tie)" : ""}
                      </span>
                      <strong>
                        {r.score?.toFixed(1)} <small>/ 100</small>
                      </strong>
                    </div>
                    <h2>
                      <a href={`#markets/${r.market.slug}`}>
                        {r.market.name} ↗
                      </a>
                    </h2>
                    <p>{r.market.opportunity}</p>
                    <p>
                      <strong>Why this score:</strong> strongest weighted
                      contributions from{" "}
                      {[...criteria]
                        .sort(
                          (a, b) =>
                            scoreFor(r.market.id, b.id) * weights[b.id] -
                            scoreFor(r.market.id, a.id) * weights[a.id],
                        )
                        .slice(0, 2)
                        .map((c) => c.name.toLowerCase())
                        .join(" and ")}{" "}
                      under the current weights.
                    </p>
                    <div className="entry">
                      <strong>ENTRY CONDITION</strong>
                      <p>{r.market.entryCondition}</p>
                    </div>
                  </article>
                ))
              ) : (
                <p className="panel">
                  No eligible recommendation. Resolve legal and data constraints
                  first.
                </p>
              )}
            </div>
            <section className="panel">
              <div className="section-head">
                <div>
                  <h2>Five markets. One transparent framework.</h2>
                  <p className="muted">
                    Derived scores ·{" "}
                    {adjusted ? "Confidence-adjusted" : "Unadjusted"} · Current
                    scenario:{" "}
                    {presets.find((p) => p.id === preset)?.name ?? "Custom"}
                  </p>
                </div>
                <a href="#compare">Full comparison →</a>
              </div>
              {ranking}
              <p className="muted">
                Score out of 100. Ranking includes constrained markets;
                recommendation eligibility overrides numerical rank. Equal
                displayed scores share a rank.
              </p>
            </section>
            <div className="bottom-note">
              <span>07 criteria</span>
              <span>05 markets</span>
              <span>100% transparent assumptions</span>
              <a href="#methodology">Inspect the methodology →</a>
            </div>
          </>
        ) : route === "compare" ? (
          <>
            <div className="page-heading">
              <span className="eyebrow">Side by side</span>
              <h1>Compare markets</h1>
              <p>
                Every score links to its rationale. Values are demonstration
                assumptions; scores are on a 1–5 scale.
              </p>
            </div>
            <div className="toolbar">
              <label>
                Sort descending{" "}
                <select value={sort} onChange={(e) => setSort(e.target.value)}>
                  <option value="total">Total score</option>
                  {criteria.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              {confidenceControl}
            </div>
            <p className="muted">
              On smaller screens, scroll the table horizontally. Evidence age is
              checked against today.
            </p>
            <div
              className="table-scroll"
              tabIndex={0}
              role="region"
              aria-label="Market comparison, horizontally scrollable"
            >
              <table>
                <caption>Market scores, confidence and evidence age</caption>
                <thead>
                  <tr>
                    <th scope="col">Market / derived total</th>
                    {criteria.map((c) => (
                      <th scope="col" key={c.id}>
                        {c.name}
                        <small>{shownWeights[c.id].toFixed(1)}%</small>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...ranked]
                    .sort((a, b) =>
                      sort === "total"
                        ? 0
                        : scoreFor(b.market.id, sort) -
                          scoreFor(a.market.id, sort),
                    )
                    .map((r) => (
                      <tr key={r.market.id}>
                        <th scope="row">
                          <a href={`#markets/${r.market.slug}`}>
                            {r.market.name}
                          </a>
                          <strong>{r.score?.toFixed(1)} / 100</strong>
                          {!r.eligible && <small>Critical constraint</small>}
                        </th>
                        {criteria.map((c) => {
                          const o = data.observations.find(
                            (o) =>
                              o.marketId === r.market.id &&
                              o.criterionId === c.id,
                          )!;
                          return (
                            <td key={c.id}>
                              <a href={`#markets/${r.market.slug}/${c.id}`}>
                                {(adjusted
                                  ? adjustScore(o.score, o.confidence)
                                  : o.score
                                ).toFixed(1)}{" "}
                                / 5
                              </a>
                              <small>{o.confidence} confidence</small>
                              <small>
                                {evidenceAge(
                                  o,
                                  new Date().toISOString().slice(0, 10),
                                )}
                              </small>
                              {c.id === "cost" && (
                                <small>
                                  {o.value === null
                                    ? "Data unavailable"
                                    : `${o.value} ${o.unit}`}
                                  <br />
                                  Analyst scenario
                                </small>
                              )}
                              {o.value === null && c.id !== "cost" && (
                                <small>Data unavailable</small>
                              )}
                              <small>{o.observationType}</small>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            <Downloads data={data} weights={weights} adjusted={adjusted} />
          </>
        ) : route === "scenario" ? (
          <>
            <div className="page-heading">
              <span className="eyebrow">Priorities change the answer</span>
              <h1>Scenario lab</h1>
              <p>
                Rebalance your priorities and see which simulated opportunities
                rise to the top.
              </p>
            </div>
            <div className="presets">
              {presets.map((p) => (
                <button
                  key={p.id}
                  className={preset === p.id ? "selected" : ""}
                  aria-pressed={preset === p.id}
                  onClick={() => {
                    setWeights({ ...p.weights });
                    setPreset(p.id);
                    setWeightError("");
                  }}
                >
                  <strong>{p.name}</strong>
                  <span>{p.description}</span>
                </button>
              ))}
            </div>
            <div className="two-column">
              <section className="panel">
                <div className="section-head">
                  <h2>Criterion weights</h2>
                  <button
                    onClick={() => {
                      setWeights({ ...defaultWeights });
                      setPreset("base");
                      setWeightError("");
                    }}
                  >
                    Reset to default
                  </button>
                </div>
                <p className="muted">
                  Changing one weight redistributes the remainder
                  proportionally. Displayed values total 100.0%.
                </p>
                {criteria.map((c) => (
                  <label className="weight" key={c.id}>
                    <span>{c.name}</span>
                    <output>{shownWeights[c.id].toFixed(1)}%</output>
                    <input
                      aria-label={`${c.name} weight`}
                      type="range"
                      min="0"
                      max="100"
                      step="0.1"
                      value={weights[c.id] * 100}
                      onChange={(e) => {
                        try {
                          setWeights(
                            changeWeight(
                              weights,
                              c.id,
                              Number(e.target.value) / 100,
                            ),
                          );
                          setPreset("custom");
                          setWeightError("");
                        } catch (err) {
                          setWeightError((err as Error).message);
                        }
                      }}
                    />
                  </label>
                ))}
                <p className="weight-total">
                  Total <strong>100.0%</strong>
                </p>
                {weightError && <p role="alert">{weightError}</p>}
                {confidenceControl}
                <p className="muted">
                  Adjusted score = 3 + (base score − 3) × confidence factor.
                  Low-confidence scores move toward neutral, not always
                  downward.
                </p>
              </section>
              <section className="panel">
                <h2>Scenario ranking</h2>
                <div aria-live="polite">{ranking}</div>
                <p>
                  Critical constraints block recommendations even when the
                  numerical score is high. All eligibility states here are
                  simulated.
                </p>
              </section>
            </div>
            <Downloads data={data} weights={weights} adjusted={adjusted} />
          </>
        ) : route === "calculator" ? (
          <Calculator />
        ) : route === "methodology" ? (
          <>
            <div className="page-heading">
              <span className="eyebrow">Open methodology</span>
              <h1>The reasoning behind the ranking</h1>
              <p>
                Snapshot {data.snapshot}. A transparent screening model, ready
                for sourced research.
              </p>
            </div>
            <section className="panel">
              <h2>How the model works</h2>
              <p>
                <strong>Weighted score:</strong> Σ(criterion score × weight) ÷ 5
                × 100. Calculations retain full precision; displayed scores
                round to one decimal. Displayed ties share rank; a tie at the
                recommendation cutoff is retained rather than broken
                arbitrarily.
              </p>
              <p>
                <strong>Confidence adjustment:</strong> 3 + (score − 3) ×
                factor. High = 1.00; medium = 0.75; low = 0.40. High means
                recent, authoritative, directly relevant evidence; medium means
                indirect, older or broader evidence; low means incomplete or
                assumption-dependent evidence. Default is unadjusted.
              </p>
              <p>
                <strong>Eligibility:</strong> mining-specific score must be at
                least 2/5 and legality verified within 90 days of viewing.
                Ineligible or unverified markets remain ranked but cannot be
                recommended. Demonstration mode uses explicitly simulated legal
                gates; it never verifies actual legality.
              </p>
              <p>
                <strong>Freshness:</strong> observations older than 24 months
                show “Review age”. Dates are evidence periods, not claims of
                current availability. A new research snapshot requires a new
                legal review.
              </p>
              <h3>Data classifications</h3>
              <dl className="definitions">
                <dt>Observed</dt>
                <dd>Reported directly by a cited source.</dd>
                <dt>Derived</dt>
                <dd>
                  Calculated from other values; output inherits their
                  limitations.
                </dd>
                <dt>Assumption</dt>
                <dd>
                  Chosen for modelling, including every market input in this
                  demo.
                </dd>
                <dt>Assessment</dt>
                <dd>Analyst judgement with cited evidence and rationale.</dd>
              </dl>
              <p>
                Keep public industrial averages, published tariffs, wholesale
                observations, estimated all-in delivered prices, analyst
                scenarios, and reported private or negotiated prices distinct. A
                public benchmark is not an available mining tariff or PPA.
              </p>
            </section>
            <section className="panel">
              <h2>Criteria & scoring guides</h2>
              <p>
                Higher is more favourable. These qualitative rubrics guide
                assessment; no unsupported universal tariff thresholds are
                assumed.
              </p>
              {criteria.map((c) => (
                <details key={c.id}>
                  <summary>
                    {c.name} · default {c.defaultWeight * 100}%
                  </summary>
                  <p>{c.description}</p>
                  <ol>
                    {c.scoringGuide.map((g) => (
                      <li key={g.score}>{g.definition}</li>
                    ))}
                  </ol>
                </details>
              ))}
            </section>
            <section className="panel">
              <h2>Limitations & research gaps</h2>
              <p>
                All 35 scored observations are demonstration assumptions. No
                sourced research has been collected. Country labels establish
                the intended scope only; numerical profiles do not assert facts
                about those places. Model prices use nominal USD without an
                observed price year or FX conversion.
              </p>
              <p>
                Collect utility and regulator evidence, regional grid and
                renewable availability, climate observations, import rules,
                construction readiness, and separate political and
                mining-specific legal assessments. Obtain actual site-level
                power quotes and connection capacity. Prioritise official
                sources, then multilateral research, audited operators, industry
                research and corroborating news.
              </p>
              <p>
                Missing raw data is preserved as null. An explicit
                low-confidence score may still be assigned with rationale.
                Markets with missing criterion records do not receive a score.
              </p>
              <ul>
                {data.observations
                  .filter((o) => o.value === null)
                  .map((o) => (
                    <li key={o.id}>
                      {data.markets.find((m) => m.id === o.marketId)?.name} ·{" "}
                      {o.metric}: Data unavailable
                    </li>
                  ))}
              </ul>
            </section>
            <section className="panel">
              <h2>Source register</h2>
              {data.sources.length ? (
                data.sources.map((s) => (
                  <article className="evidence" key={s.id}>
                    <h3>
                      <a href={s.url} target="_blank" rel="noopener noreferrer">
                        {s.title} ↗ (external)
                      </a>
                    </h3>
                    <p>
                      {s.publisher} · {s.sourceType} · {s.geography}
                    </p>
                    <p>
                      Published: {s.publishedAt ?? "Not provided"} · Accessed:{" "}
                      {s.accessedAt}
                    </p>
                    <p>
                      Associated evidence:{" "}
                      {data.observations
                        .filter((o) => o.sourceIds.includes(s.id))
                        .map(
                          (o) =>
                            `${o.criterionId} (${o.confidence} confidence)`,
                        )
                        .join(", ")}
                    </p>
                  </article>
                ))
              ) : (
                <p className="empty">
                  No external sources yet. The source CSV contains the complete
                  column schema and no fabricated citations. Source URLs,
                  publishers and access dates must be added with actual
                  research.
                </p>
              )}
              <Downloads data={data} weights={weights} adjusted={adjusted} />
              <p>
                Scored summary uses your current weights and confidence setting.
                All exports retain snapshot and classification metadata; blank
                observation values mean unavailable, never zero.
              </p>
            </section>
            <section className="panel">
              <h2>Independent research notice</h2>
              <p>{disclaimer}</p>
            </section>
          </>
        ) : market ? (
          <>
            <a className="back" href="#compare">
              ← All markets
            </a>
            <div className="page-heading">
              <span className="eyebrow">
                {market.country} / {market.region}
              </span>
              <h1>{market.name}</h1>
              <p>{market.summary}</p>
              <Tag>Assumption profile</Tag>{" "}
              <Tag>
                {ranked.find((r) => r.market.id === market.id)?.eligible
                  ? "Simulated eligibility"
                  : "Critical constraint"}
              </Tag>
            </div>
            <div className="two-column">
              <section className="panel">
                <h2>Commercial perspective</h2>
                <h3>Key opportunity</h3>
                <p>{market.opportunity}</p>
                <h3>Primary constraint</h3>
                <p>{market.constraint}</p>
                <h3>Entry condition</h3>
                <p>{market.entryCondition}</p>
                <h3>Illustrative customer segments</h3>
                <ul>
                  {market.customerSegments.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
                <p>{market.valueProposition}</p>
              </section>
              <section className="panel">
                <h2>Power-price scenarios</h2>
                <Tag>Assumption · {market.prices.type}</Tag>
                <p>
                  No observed electricity benchmark available. These nominal USD
                  prices are synthetic and are not tariffs, quotes or PPAs.
                </p>
                <dl className="results">
                  {(["optimistic", "base", "stress"] as const).map((key) => (
                    <div className="result-pair" key={key}>
                      <dt>{key}</dt>
                      <dd>{market.prices[key].toFixed(3)} USD/kWh</dd>
                    </div>
                  ))}
                </dl>
                <h3>General country risk</h3>
                <p>{market.generalRisk}</p>
                <h3>Mining-specific regulation</h3>
                <p>
                  Simulated status:{" "}
                  <strong>{market.regulatoryEligibility}</strong> · Score:{" "}
                  {market.miningRegulatoryScore ?? "Data unavailable"} / 5.
                </p>
                <p>
                  Actual legal verification: <strong>Not performed</strong>.
                  Legal check date:{" "}
                  {market.legalCheckedAt ?? "Data unavailable"}.
                </p>
              </section>
            </div>
            <h2>Criterion evidence</h2>
            {parts[2] && (
              <p className="notice">
                Selected criterion:{" "}
                {criteria.find((c) => c.id === parts[2])?.name ??
                  "Unknown criterion"}
                . Listed first below.
              </p>
            )}
            {[...data.observations.filter((o) => o.marketId === market.id)]
              .sort(
                (a, b) =>
                  Number(b.criterionId === parts[2]) -
                  Number(a.criterionId === parts[2]),
              )
              .map((o) => (
                <Evidence key={o.id} o={o} data={data} />
              ))}
          </>
        ) : (
          <section className="panel">
            <h1>Page not found</h1>
            <p>This market or view is unavailable.</p>
            <a href="#overview">Return to overview</a>
          </section>
        )}
      </main>
      <footer>
        <strong>Regional Power Opportunity Map</strong>
        <p>
          Independent research exercise · Not investment or legal advice · No
          affiliation with Bitdeer.
        </p>
        <a href="#methodology">Methodology, limitations & full disclaimer</a>
      </footer>
    </>
  );
}
