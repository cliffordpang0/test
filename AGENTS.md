# Project instructions

Build and maintain the Regional Power Opportunity Map described in `PRD.md`.

## Product boundaries

- Treat `PRD.md` as the source of truth for product behaviour, data definitions, formulas, and acceptance criteria. Read the relevant section when changing those areas; do not reread the entire document for unrelated edits.
- Keep the MVP a client-side application backed by static, version-controlled data. Do not add a backend, authentication, database, live API dependency, or paid service unless the user explicitly expands the scope.
- This is an independent research portfolio project. Do not imply affiliation with Bitdeer or present outputs as investment, legal, tariff, or project-development advice.

## Data integrity

- Never fabricate facts, citations, prices, legal conclusions, or source metadata.
- Classify material data as `observed`, `derived`, `assumption`, or `assessment` and preserve that classification through the UI and downloads.
- Keep public industrial averages, tariffs, wholesale observations, modelled all-in prices, and private or negotiated prices distinct.
- Store source title, publisher, URL, publication date when available, access date, geography, and confidence with the relevant evidence.
- Represent missing data as null and label it clearly. Do not use zero as a missing-value substitute.
- Use dated static snapshots. The app must remain functional if external source sites are unavailable.
- When current external facts are needed, prefer official or primary sources and record the date accessed. Flag unresolved uncertainty rather than guessing.

## Implementation

- Use TypeScript strict mode. Keep scoring, confidence adjustment, eligibility, ranking, and calculator logic in pure functions separate from UI components.
- Keep criteria, scoring guides, weights, and scenario presets in one typed configuration source. Do not duplicate constants across components.
- Validate data references, score ranges, source requirements, and weight totals at build time or in a dedicated validation command.
- Avoid unnecessary dependencies. A map, global state library, server framework, or animation library requires a concrete product need.
- Prefer clear, maintainable components and semantic HTML over abstractions created for hypothetical future requirements.

## User experience

- Lead with the recommendation and progressively disclose methodology and evidence.
- Use a restrained infrastructure-and-energy visual style, not a cryptocurrency trading aesthetic.
- Do not encode meaning by colour alone. All controls must work by keyboard and have visible focus states and accessible labels.
- Every chart needs labelled units and an accessible textual or tabular equivalent.
- Preserve usability from 320px mobile width through large desktop screens.

## Verification

- Add or update focused tests whenever scoring, confidence, eligibility, presets, downloads, or calculator behaviour changes.
- Run affected tests and a production build before completing an implementation task. Fix failures caused by the requested change.
- Validate the content as well as the code: check source links, access dates, assumptions, units, and recommendation eligibility.
- Inspect material UI changes at desktop and mobile widths, including empty, invalid, and low-confidence states.
- A task is not complete while placeholder claims, fabricated examples presented as facts, broken downloads, failing tests, or relevant accessibility defects remain.
