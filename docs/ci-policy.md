# CI Policy

## PR Path

Pull requests run the checks needed to catch integration breakage quickly, all
in the `Verify` workflow:

- `Classify changes`
- `Build`
- `Fast tests` — the fail-closed `test:pr` smoke suite
- `Production browser E2E` — `test:e2e:browser:pr`, i.e. everything except the
  `@full-e2e` stress tests
- `Check diff whitespace`
- aggregate `Build, test, and verify`

Fast Vitest is required on every PR. Research benches, artifact regeneration,
slow engine convergence, and environment-gated heavy tests are not part of that
suite. Suite ownership is itself a fast test, so an unclassified test file or a
new research file accidentally added to fast fails immediately.

`Production browser E2E` is path-aware on pull requests. It skips explicitly
safe documentation and repo-local skill changes, the mechanics2
research-sidecar code/tools/data/tests, disposable `.DS_Store` files, and
migrated prompt history. Any other changed path runs it, including runtime
engine, verifier, package, config, myocardium data, and newly added code paths.
Editing the verify workflow itself always runs it.

PR authors are still expected to run targeted local verification for touched
areas before opening or updating a PR. For current myocardium work, that means
focused fast unit/contract tests plus the relevant `mainWire` scientific test or
experiment artifact.

## Main and Scientific Paths

Pushes to `main` run the same jobs as a pull request, with two differences: the
complete `test:fast` suite instead of the PR smoke subset, and no path gating —
every job runs.

The browser E2E selection is deliberately the same on `main` as on a pull
request. The `@full-e2e` stress tests observe transient runtime states, such as
the open transient between a commit and its settlement, which a shared runner
races past; they ran only on `main`, so `main` was red on every push from
2026-07-20 onward while every pull request was green. They now run nightly
instead. Making them observable deterministically is runtime work, and until
that lands the per-push gate reports only what it can judge reliably.

Nightly work lives in the separate `Scientific verification` workflow, at
03:17 JST:

- engine regression in parallel shards
- current `mainWire` scientific tests in parallel shards
- the opt-in heavy engine files in their own job and timeout
- the full production browser E2E suite, including `@full-e2e`

Archived research runs only on a manual dispatch with `run_archive` set. It is
not part of any automatic run, so a test classified `archived-research` is
exercised only when someone asks for it explicitly.

The canonical lane is dormant on the current pre-mainWire `main` snapshot. An
inventory job reports zero files and skips the four canonical shards rather
than reporting an empty suite as a successful scientific result. The shards
activate automatically once `mainWire*.test.ts` files reach `main`.

Historical mechanics/myocardium phase benches and full artifact replay are
manual-only. A workflow dispatch can enable them in twelve independent shards.
They are retained as reproducibility evidence, but old local hypotheses are not
reapplied to current main on every PR or nightly run.

See `docs/testing/test-suite-strategy.md` for suite ownership and budgets.
