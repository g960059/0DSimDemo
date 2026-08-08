# Development lane routing

Status: compact pointer index
Updated: 2026-08-08

This file does not record experiment history or merge ordering. GitHub pull
requests, Git history, and versioned evidence artifacts are the sources for
those facts.

## Studio

The active product lane is the pre-release Studio experiment architecture:

- [Studio index](../studio/README.md)
- [experiment data architecture](../studio/DESIGN-STUDIO-003-experiment-data-architecture.md)
- [model release and Surface architecture](../studio/DESIGN-STUDIO-006-model-surface-release-and-model-lab.md)

The active acceptance milestone is content-first rather than another
standalone infrastructure lane:

- [CONTENT-0001: PV loop basics pilot](../content/CONTENT-0001-pv-loop-basics-pilot.md)
- source recipe: `content/official/pv-loop-basics-v1.experiment.json`

That article is the release test for the first Standard-ABI exact model,
compatible stable Surface, executable model-family assertions, common
Snapshot admission, Article placement, and Reader-to-Experiment-Session path.
No narrower infrastructure PR is complete unless it removes a named blocker
from that path.

The local numerical slice is now executable: the Standard exact model,
compatible Surface, four-Scenario recipe runner, three model-owned assertions,
and common Snapshot admission pass together. The remaining acceptance work is
stable registry publication, Article/Reader vertical QA, and the supervised
learner pilot.

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

## Deferred until CONTENT-0001 passes

Baroreflex, patient fitting, broad official-case generation, drop-in
succession, generalized migration UI, and further Workbench QoS work are not
on the critical path. They may not displace the first article without a newly
recorded product or scientific blocker.
