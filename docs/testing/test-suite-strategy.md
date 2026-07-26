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

At the 2026-07-17 migration snapshot, the 260 files divide into 69 fast, 27
engine regression, 161 archived research, 2 heavy, and 1 rules-emulator file.
The previous fast command selected 164 files, so 96 long research files left
the inner loop without being deleted.

| Command | Responsibility | Default CI path |
|---|---|---|
| `npm test` / `npm run test:fast` | Pure unit, schema, one-step contract, and lightweight SSR tests | Every PR and main push |
| `npm run test:related -- <source...>` | Fast tests statically related to edited sources | Local development |
| `npm run test:regression` | Longer legacy engine convergence and physiology regression | Nightly, 4 shards |
| `npm run test:scientific:canonical` | Current `mainWire*` scientific lane | Nightly, 4 shards |
| `npm run test:scientific:archive` | Historical mechanics/myocardium benches and artifact replay | Manual only, 12 shards in Actions |
| `npm run test:heavy` | Environment-gated Guyton/Starling and low-preload sweeps | Nightly, separate job |
| `npm run test:rules` | Firestore emulator test | Explicit emulator workflow/local run |

`test:research` is an alias for `test:scientific:archive`. `test:all` runs all
Node-based tiers, including archive and heavy, but intentionally does not start
the Firestore emulator.

## Fast-suite contract

- Exact allowlist; no broad `__tests__/*.test.ts` include.
- 60 second wall-clock hard limit, overrideable only for diagnosis with
  `CIRCLEHEART_FAST_TEST_BUDGET_MS`.
- 10 second per-test and per-hook timeout.
- At most 120 files before the ownership test forces an explicit review. The
  wall-clock budget remains authoritative as lightweight kernel coverage grows.
- Files named as benches, calibration, envelope, replay, artifact, or
  attribution work cannot enter the fast allowlist.
- The current warm local baseline is expected to be roughly ten seconds; the
  60 second limit leaves CI and slower-machine headroom without accepting suite
  creep.

To add a pure fast test, add its exact path to `fastTests` in
`vitest.suites.ts`. A new `mainWire*.test.ts` is conservatively classified as
canonical scientific unless explicitly promoted to fast. Historical
`mechanics2*`, `myocardium*`, and related research prefixes are conservatively
classified as archive unless an exact lightweight test is deliberately
promoted, so they cannot leak into fast automatically.

## Research-test migration rule

New work should separate three responsibilities that older bench files often
combine:

1. Put equations, state transitions, schema, conservation, and passivity checks
   against small synthetic fixtures in a fast unit/contract test.
2. Put closed-loop periodic runs, dt-halving, disease envelopes, sweeps, and
   calibration in a `vite-node` experiment tool or canonical scientific test.
3. Validate committed artifacts quickly by schema, provenance, hash, and
   internal consistency. Full regeneration parity belongs to canonical or
   archived scientific verification, never to fast.

Preferred suffixes for new files are `.unit.test.ts`, `.contract.test.ts`,
`.regression.test.ts`, `.scientific.test.ts`, `.artifact.test.ts`, and
`.heavy.test.ts`. Existing files are registered without a mass rename so their
history and relative imports remain intact.

## Stacked main-wire adoption

When the current stacked main-wire branches rebase onto this registry, promote
pure valve/material/prior kernels, one-step transactions, and synthetic
diagnostic fixtures by exact path into `fastTests`. Keep periodic steady-state
runs, multi-beat summaries, mechanism-ledger replays, artifact parity, and
structural-ablation reports in `canonical-scientific`. The anticipated first
integration is about 97 fast files, which fits the 120-file review ceiling; the
60-second measured wall budget still decides whether any promoted file is truly
fast.

## CI layout

The ordinary `Verify` workflow runs build, the fast suite, whitespace, and a
path-aware production browser E2E job. Pull requests run the `test:pr` smoke
subset; main pushes run the complete fast suite. Both run the same browser E2E
selection, which excludes the `@full-e2e` stress tests.

The separate `Scientific verification` workflow owns nightly work. Engine
regression, canonical scientific tests, heavy tests, and the full browser E2E
suite including `@full-e2e` run as independent jobs instead of sharing a
timeout. Archived research is disabled nightly and can be enabled explicitly
from `workflow_dispatch`, so a test classified `archived-research` runs only
when someone asks for it.

Until the stacked main-wire branches reach `main`, the canonical file inventory
is zero and that matrix is shown as skipped. This avoids treating an empty
scientific suite as positive evidence; it activates automatically when
`mainWire*.test.ts` files are present.

This split preserves scientific evidence without making historical phase
reproduction a blocking inner-loop test.
