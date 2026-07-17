# Scientific runtime boundary

This directory is the host-neutral boundary for the single scientific core.
Code here may be called by browser workers, command-line tools, fitting jobs,
and tests, but it must not import UI, persistence, React, Firebase, or a
host-specific API.

The foundation release intentionally delegates equations and the atomic
accepted-state transaction to the curated main-wire modules. Direct imports
from `@/engine/myocardium`, `@/engine/core`, and the main-wire valve kernel are
temporary, explicit migration dependencies. They do not authorize a second
backend and they must not point through `ModelCore`, preview controllers, case
persistence, or application code.

The intended layers are:

```text
release    immutable identity and capability locks
assembly   typed, build-time approved scientific configurations
runtime    accepted-state session, protocols, checkpoints, observables
host       worker/CLI/fitting adapters outside this directory
```

See `docs/scientific-runtime/ADR-0001-single-scientific-core.md` for the
decision, evidence boundary, and cutover gates.

