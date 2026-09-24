# MVP verification — 2026-09-24

Snapshot: `demo-1.0`, dated 2026-09-24. This report covers software behavior with synthetic data, not validation of real market conditions.

| Check | Result |
| --- | --- |
| Data validation | Pass: five markets, seven criteria, 35 labelled assumptions, no fabricated source records |
| Strict TypeScript / production build | Pass; production JavaScript about 81.3 kB gzip, CSS about 2.6 kB gzip |
| Unit and component tests | 17 passed |
| Playwright browser tests | 4 passed using Microsoft Edge |
| ESLint | Pass |
| Dependency audit at installation | Zero reported vulnerabilities |
| Automated accessibility | No axe violations in tested main views at 768px and 1440px |
| Responsive behavior | No page overflow at 320px, 768px and 1440px; comparison table scrolls inside its region |
| Lighthouse production preview | Performance 100, accessibility 100; FCP/LCP 1.4s, TBT 0ms, CLS 0 |

The browser suite exercises overview → leading market → keyboard evidence disclosure → cost preset → confidence adjustment → keyboard slider → CSV download → calculator. It also checks unknown-market routes, missing observations, review-age flags, critical constraints, skip navigation, and injected empty/invalid snapshots. Unit tests verify formulas, zero and invalid inputs, ties, missing observations, legal gates, weight redistribution, presets and CSV escaping/metadata.

Desktop and mobile screenshots were visually reviewed, including empty/invalid states and low-confidence profiles. [Desktop overview](overview.png) and [mobile overview](mobile.png) are retained here. Other screenshots and the Lighthouse JSON are generated in ignored `test-results/`.

Lighthouse produced a complete report with no runtime error or audit warnings. Its command returned an error afterward because Windows denied deletion of its temporary browser profile. This cleanup issue did not affect the saved results. Performance scores are one local run, not a guarantee across devices or hosting providers.

No asynchronous loading screen is needed: the static snapshot is bundled synchronously. External sources are not fetched at runtime. Safari/Firefox, assistive-technology review, and verification of real source URLs and legal status remain release/research work. The current source register contains zero sources by design.
