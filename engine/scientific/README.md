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
assembly   typed source builders plus digest-validated published artifacts
runtime    accepted-state session, protocols, checkpoints, observables
host       worker/CLI/fitting adapters outside this directory
```

Production hosts load the checked-in complete release artifact. Rebuilding a
release from source is reserved for the explicit generator/audit path because
host math-library differences must not mint different identities for one
published version.

See `docs/scientific-runtime/ADR-0001-single-scientific-core.md` for the
decision, evidence boundary, and cutover gates.
