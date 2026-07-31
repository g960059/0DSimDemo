# Test suite strategy

Every `*.test.ts` file belongs to exactly one suite in `vitest.suites.ts`.
`__tests__/testSuiteManifest.test.ts` enforces that ownership and rejects stale
explicit entries.

| Command | Purpose |
| --- | --- |
| `npm run test:pr` | Bounded pull-request smoke coverage for V3 runtime and Studio V2 boundaries |
| `npm run test:fast` | Fast unit and contract tests |
| `npm run test:regression` | Stateful engine and checkpoint regressions |
| `npm run test:scientific:canonical` | Current Main Wire and coronary scientific invariants |

Historical mechanics benches, readiness gates, artifact replays, and generated
snapshots are deleted; Git history is the archive. A new test must either be
listed explicitly or belong to the current Main Wire scientific family.

`npm run test:all` runs every current Node-based suite. There is no historical,
scientific-browser, or performance test lane.
