# CI Policy

## PR Path

Pull requests run the checks needed to catch integration breakage quickly:

- `Build`
- `Verify baseline`
- `Verify official cases`
- `Check diff whitespace`
- aggregate `Build, test, and verify`

The full Vitest shard matrix is skipped on the default PR path. This keeps
experiment-heavy myocardium PRs moving while avoiding a long queue for every
small iteration.

PR authors are still expected to run targeted local verification for touched
areas before opening or updating a PR. For myocardium work, that usually means
the phase-specific verifier plus its focused Vitest file.

## Full Path

The full Vitest shard matrix still runs on:

- `push` to `main`
- `workflow_dispatch`

Heavy verification tests remain limited to `workflow_dispatch` and the nightly
schedule.

This is an intentional speed/safety tradeoff: PR CI is a fast integration
screen, while full regression coverage is retained on main and on demand.
