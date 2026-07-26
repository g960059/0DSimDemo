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
is noncanonical. It remains in the working tree only because historical
myocardium verifiers inspect its claim boundaries. Git history and immutable
artifacts remain the evidence sources.
