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

- [scientific runtime](../scientific-runtime/ADR-0001-single-scientific-core.md)
- [myocardium lane](../myocardium/README.md)

Use the current implementation and immutable report artifacts to determine a
model claim. A status document must not promote a diagnostic result into
scientific acceptance.

## Historical routing

The detailed lane diary through 2026-07-10 was removed from the working tree,
together with the retired MechanicsCore2 / AV-plane lane it chiefly recorded.
Git history and immutable artifacts remain the evidence sources.

Its last code consumers are gone too. Twenty-one myocardium verifiers used to
require specific wording in the diary; because the file was frozen, every
requirement added by a phase that landed after the archive date was
unsatisfiable in principle, and twenty verifiers were red for that reason
alone. Those pins were retired first, and the verifiers themselves are retired
with the lane. `tools/repository/checkRepositoryHygiene.mjs` still fails if any
tool under `tools/` reads `docs/status/archive/` again.
