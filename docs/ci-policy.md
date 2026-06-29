# CI Policy

## PR Path

Pull requests run the checks needed to catch integration breakage quickly:

- `Build`
- `Verify baseline` when runtime/model/case verification inputs changed
- `Verify official cases` when runtime/model/case verification inputs changed
- `Check diff whitespace`
- aggregate `Build, test, and verify`

The fast Vitest shard matrix is skipped on the default PR path but still runs on
main and on demand. Historical myocardium/PV-loop research phase tests and slow
engine convergence/regression tests are not part of the fast suite. Run
historical research tests explicitly by file when reviving a phase; run slow
engine regression tests with `test:regression`. The scheduled or manual
diagnostic/heavy workflow path runs the regression and heavy suites.

`Verify baseline` and `Verify official cases` are path-aware on pull requests.
They skip only for explicitly safe `docs/**` and repo-local `.codex/skills/**`
changes, plus disposable `.DS_Store` files and migrated prompt-history files.
Any other changed path runs model verification by default, including engine,
official-case, verifier, package, config, workflow, myocardium data, and newly
added code paths. Pushes to `main`, scheduled runs, and manual runs keep the
full verification path.

PR authors are still expected to run targeted local verification for touched
areas before opening or updating a PR. For myocardium work, that usually means
the phase-specific verifier plus its focused Vitest file.

## Full Path

The fast Vitest shard matrix still runs on:

- `push` to `main`
- `workflow_dispatch`
- scheduled runs

Slow engine regression tests and heavy verification tests remain limited to
`workflow_dispatch` and the nightly schedule. Historical myocardium/PV-loop
research phase tests are manual-only unless a phase PR explicitly opts into
them.

This is an intentional speed/safety tradeoff: PR CI is a fast integration
screen, while slow regression coverage is retained on schedule and on demand.
