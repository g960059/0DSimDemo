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
safe documentation and repo-local skill changes, disposable `.DS_Store` files,
and migrated prompt history. Any other changed path runs it, including runtime
engine, verifier, package, config, myocardium data, and newly added code paths.
Editing the verify workflow itself always runs it. `engine/mechanics2` is no
longer exempt: the sidecar lane is retired and what remains under that path is
production valve and diagnostic code.

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

The archived-research suite is retired. The MechanicsCore2 / AV-plane sidecar
and the earlier ModelCore+Land boundary lane were removed from the working
tree, so there is no longer a manual-dispatch archive suite, a `run_archive`
input, or archive shards. Those experiments remain in git history and in the
pull requests that produced them.

The canonical lane is active. An inventory job counts the canonical scientific
files from the suite registry and skips the shards rather than reporting an
empty suite as a successful scientific result if that count is ever zero.

See `docs/testing/test-suite-strategy.md` for suite ownership and budgets.
