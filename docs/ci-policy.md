# CI Policy

## PR Path

Pull requests run the checks needed to catch integration breakage quickly:

- `Build`
- the complete fail-closed `test:fast` suite
- `Verify baseline` when runtime/model/case verification inputs changed
- a three-case official-case smoke verification when those inputs changed
- `Check diff whitespace`
- aggregate `Build, test, and verify`

Fast Vitest is required on every PR. Research benches, artifact regeneration,
slow engine convergence, and environment-gated heavy tests are not part of that
suite. Suite ownership is itself a fast test, so an unclassified test file or a
new research file accidentally added to fast fails immediately.

`Verify baseline` and `Verify official cases` are path-aware on pull requests.
They skip explicitly safe documentation and repo-local skill changes, the
mechanics2 research-sidecar code/tools/data/tests, the ordinary verify workflow
itself, disposable `.DS_Store` files, and migrated prompt history. Any other
changed path runs legacy model verification by default, including runtime
engine, official-case, verifier, package, config, myocardium data, and newly
added code paths. Pushes to `main` and manual ordinary runs keep the full
verification path.

PR authors are still expected to run targeted local verification for touched
areas before opening or updating a PR. For current myocardium work, that means
focused fast unit/contract tests plus the relevant `mainWire` scientific test or
experiment artifact.

## Main and Scientific Paths

Main pushes and ordinary manual verification run the full baseline and all
official cases in addition to build and fast tests.

Nightly work lives in the separate `Scientific verification` workflow:

- engine regression in four parallel shards
- current `mainWire` scientific tests in four parallel shards
- the two opt-in heavy engine files in their own job and timeout

The canonical lane is dormant on the current pre-mainWire `main` snapshot. An
inventory job reports zero files and skips the four canonical shards rather
than reporting an empty suite as a successful scientific result. The shards
activate automatically once `mainWire*.test.ts` files reach `main`.

Historical mechanics/myocardium phase benches and full artifact replay are
manual-only. A workflow dispatch can enable them in twelve independent shards.
They are retained as reproducibility evidence, but old local hypotheses are not
reapplied to current main on every PR or nightly run.

See `docs/testing/test-suite-strategy.md` for suite ownership and budgets.
