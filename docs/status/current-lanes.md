# Development lane routing

Status: compact pointer index
Updated: 2026-07-31

This file does not record experiment history or merge ordering. GitHub pull
requests, Git history, and versioned evidence artifacts are the sources for
those facts.

## Studio

The active product lane is the pre-release Studio experiment architecture:

- [Studio index](../studio/README.md)
- [experiment data architecture](../studio/DESIGN-STUDIO-003-experiment-data-architecture.md)

The removed Workbench implementation is available in Git history. It is not a
persistence, ownership, or compatibility boundary for Studio V2.

## Model Platform

The host-neutral runtime and evidence boundaries remain canonical:

- [scientific runtime](../scientific-runtime/README.md)
- [myocardium lane](../myocardium/README.md)

Use the current implementation and current V3 tests to determine a model
claim. A status document must not promote an archived diagnostic result into
scientific acceptance.

Superseded lane diaries and implementation history live only in Git history.
