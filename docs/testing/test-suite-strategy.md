# Test suite strategy

## Goal

The default test command is a development feedback loop, not a research replay
launcher. `npm test` must remain fast enough to run before every commit while
long physiological experiments, convergence studies, and artifact regeneration
remain available under explicit commands.

The previous fast configuration was fail-open: every new
`__tests__/*.test.ts` file entered the fast suite unless its prefix happened to
be excluded. More than ninety mechanics research benches were added after that
rule was written, including files with 90–600 second timeouts and full artifact
regeneration. The name `fast` therefore stopped describing the command.

## Suite ownership

Every `*.test.ts` file must belong to exactly one tier. The ownership test in
`__tests__/testSuiteManifest.test.ts` fails on unclassified files, stale
entries, and overlaps.

After the archived-research retirement, the 277 files divide into 119 fast, 68
engine regression, 87 canonical scientific, 2 heavy, and 1 rules-emulator file.
`npm run test:suites:inventory` prints the current split from the registry.
The archived-research tier no longer exists: the MechanicsCore2 / AV-plane
sidecar and the earlier ModelCore+Land boundary lane were removed from the
working tree and remain in git history.

| Command | Responsibility | Default CI path |
|---|---|---|
| `npm test` / `npm run test:fast` | Pure unit, schema, one-step contract, and lightweight SSR tests | Every main push; pull requests run the `test:pr` subset |
| `npm run test:related -- <source...>` | Fast tests statically related to edited sources | Local development |
| `npm run test:regression` | Longer legacy engine convergence and physiology regression | Nightly, 4 shards |
| `npm run test:scientific:canonical` | Current `mainWire*` scientific lane | Nightly, 4 shards |
| `npm run test:heavy` | Environment-gated Guyton/Starling and low-preload sweeps | Nightly, separate job |
| `npm run test:rules` | Firestore emulator test | Explicit emulator workflow/local run |

`test:all` runs all Node-based tiers, including heavy, but intentionally does
not start the Firestore emulator.

## Fast-suite contract

- Exact allowlist; no broad `__tests__/*.test.ts` include.
- 60 second wall-clock limit locally, raised to 90 seconds in CI via
  `CIRCLEHEART_FAST_TEST_BUDGET_MS` because shared runners are markedly slower
  than a development machine. Override it anywhere else only for diagnosis.
- 10 second per-test and per-hook timeout.
- `FAST_SUITE_FILE_BUDGET` in `vitest.suites.ts` is the ceiling the ownership
  test enforces; raising it is the explicit review. The wall-clock budget
  remains authoritative as lightweight kernel coverage grows.
- Files named as benches, calibration, envelope, replay, artifact, or
  attribution work cannot enter the fast allowlist.
- The current warm local baseline is expected to be roughly ten to twenty
  seconds, so both the 60 second local limit and the 90 second CI budget leave
  headroom without accepting suite creep.

To add a pure fast test, add its exact path to `fastTests` in
`vitest.suites.ts`. A new `mainWire*.test.ts` is conservatively classified as
canonical scientific unless explicitly promoted to fast. Every other tier is
fail-closed: an unregistered test file is unclassified and the ownership test
fails, so nothing leaks into fast automatically.

## Research-test migration rule

New work should separate three responsibilities that older bench files often
combine:

1. Put equations, state transitions, schema, conservation, and passivity checks
   against small synthetic fixtures in a fast unit/contract test.
2. Put closed-loop periodic runs, dt-halving, disease envelopes, sweeps, and
   calibration in a `vite-node` experiment tool or canonical scientific test.
3. Validate committed artifacts quickly by schema, provenance, hash, and
   internal consistency. Full regeneration parity belongs to canonical
   scientific verification, never to fast.

Preferred suffixes for new files are `.unit.test.ts`, `.contract.test.ts`,
`.regression.test.ts`, `.scientific.test.ts`, `.artifact.test.ts`, and
`.heavy.test.ts`. Existing files are registered without a mass rename so their
history and relative imports remain intact.

## Stacked main-wire adoption

When promoting work into this registry, put pure valve/material/prior kernels,
one-step transactions, and synthetic diagnostic fixtures by exact path into
`fastTests`. Keep periodic steady-state runs, multi-beat summaries,
mechanism-ledger replays, artifact parity, and structural-ablation reports in
`canonical-scientific`. The fast suite is at its `FAST_SUITE_FILE_BUDGET`
ceiling, so a promotion now means either raising that budget deliberately or
demoting something else; the 60-second measured wall budget still decides
whether any promoted file is truly fast.

## CI layout

The ordinary `Verify` workflow runs build, the fast suite, whitespace, and a
path-aware production browser E2E job. Pull requests run the `test:pr` smoke
subset; main pushes run the complete fast suite. Both run the same browser E2E
selection, which excludes the `@full-e2e` stress tests.

The separate `Scientific verification` workflow owns nightly work. Engine
regression, canonical scientific tests, heavy tests, and the full browser E2E
suite including `@full-e2e` run as independent jobs instead of sharing a
timeout.

The canonical file inventory is computed from the suite registry. If it is ever
zero the matrix is shown as skipped, which avoids treating an empty scientific
suite as positive evidence.

This split preserves scientific evidence without making historical phase
reproduction a blocking inner-loop test.
