# CI Policy

## PR Path

Pull requests run the checks needed to catch integration breakage quickly:

- `Build`
- `Verify baseline` when runtime/model/case verification inputs changed
- `Verify official cases` when runtime/model/case verification inputs changed
- `Check diff whitespace`
- aggregate `Build, test, and verify`

The full Vitest shard matrix is skipped on the default PR path. This keeps
experiment-heavy myocardium PRs moving while avoiding a long queue for every
small iteration.

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

The full Vitest shard matrix still runs on:

- `push` to `main`
- `workflow_dispatch`
- scheduled runs

Heavy verification tests remain limited to `workflow_dispatch` and the nightly
schedule.

This is an intentional speed/safety tradeoff: PR CI is a fast integration
screen, while full regression coverage is retained on main and on demand.
