# Development lane routing

Status: compact pointer index
Updated: 2026-07-24

This file does not record experiment history or merge ordering. GitHub pull
requests, Git history, and versioned evidence artifacts are the sources for
those facts.

## Studio

The active product lane is the greenfield Studio v1 architecture:

- [Studio index](../studio/README.md)
- [complete target architecture](../studio/DESIGN-STUDIO-002-cell-document-architecture.md)
- [first runtime vertical slice](../studio/specs/STUDIO-RUNTIME-001-foundation-vertical-slice.md)

The existing React Workbench is a source of reusable renderer and interaction
parts, not the persistence or ownership model for Studio v1.

## Model Platform

The host-neutral runtime and evidence boundaries remain canonical:

- [scientific runtime](../scientific-runtime/README.md)
- [myocardium lane](../myocardium/README.md)
- [MechanicsCore2 lane](../mechanics2/README.md)

Use the current implementation and immutable report artifacts to determine a
model claim. A status document must not promote a diagnostic result into
scientific acceptance.

## Historical routing

The [detailed lane diary through 2026-07-10](archive/current-lanes-through-2026-07-10.md)
is noncanonical. Git history and immutable artifacts remain the evidence
sources.

It no longer has any code consumer. Twenty-one myocardium verifiers used to
require specific wording in it; because the file is frozen, every requirement
added by a phase that landed after the archive date was unsatisfiable in
principle, and twenty verifiers were red for that reason alone. Those pins are
gone, and `tools/repository/checkRepositoryHygiene.mjs` now fails if any tool
under `tools/` reads `docs/status/archive/` again. The diary is kept as plain
history — chiefly the MechanicsCore2 / CircAdapt-lite sidecar record, which is
an active lane — so whether to keep it is now an ordinary editorial call rather
than something the verifiers force.
