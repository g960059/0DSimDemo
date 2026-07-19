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
inputs     semantic intent plus complete release-resolved session input
runtime    accepted-state session, protocols, and exact checkpoints
observables stable IDs, units, availability, and quality
documents  content-addressed preset, case, and presentation workspace records
validation deterministic physiology-reference and numerical-integrity reports
host       worker/CLI/fitting adapters outside this directory
```

Production hosts load the checked-in complete release artifact. Rebuilding a
release from source is reserved for the explicit generator/audit path because
host math-library differences must not mint different identities for one
published version.

The first validation slice measures one complete accepted terminal cycle from
the checked-in official healthy checkpoint. Literature-informed physiology
ranges and runtime-owned numerical tolerances are evaluated and reported as
separate domains. A physiology miss must never be hidden by a numerically clean
solve, and an unavailable signal must never be converted to zero. The current
report intentionally remains a broad reference screen rather than a patient
fit or clinical validation claim. See
`docs/scientific-runtime/VALIDATION-0001-healthy-reference-screen.md`.

See `docs/scientific-runtime/ADR-0001-single-scientific-core.md` for the
decision, evidence boundary, and cutover gates.
