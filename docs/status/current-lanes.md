# Development lane routing

Status: compact pointer index

Updated: 2026-08-09

This file does not record merge history. GitHub, Git history and versioned
evidence artifacts remain the authority for completed work.

## Studio

Active contracts:

- [Studio index](../studio/README.md)
- [Experiment data architecture](../studio/DESIGN-STUDIO-003-experiment-data-architecture.md)
- [Model/Surface and assisted authoring](../studio/DESIGN-STUDIO-006-model-surface-release-and-model-lab.md)
- [CONTENT-0001: PV loop basics pilot](../content/CONTENT-0001-pv-loop-basics-pilot.md)

The current product milestone is a real bounded Article made through the
ordinary Experiment Session and Article Editor, not another parallel content
pipeline. The active Standard model and Surface are selected atomically for
new Sessions. Existing Experiments and Snapshots retain their stored pins.

`/dev` remains one compact inventory. `/dev/model-lab` is one explicit local
Standard-bundle launch and is not a release stage or alternate Editor/Reader.
It is ephemeral and cannot Save, capture a Snapshot, Brief, or publish. Durable
content is authored only through the ordinary active-model Session.

The first Standard Surface is intentionally limited to the CONTENT-0001 PV
loop teaching slice. Activating that bundle is an explicit pilot acceptance
step, not a claim that the full legacy Workbench catalog has reached parity.

The Git official-recipe runner and generic launch channels were removed. AI
assistance starts with typed list/read (including exact Snapshot detail),
model-aware presentation/Article save, and publish commands against normal user
content. Numerical Scenario mutation, fitting and Snapshot capture are added
only after real authoring repetition defines their execution-host contract.

## Model platform

The host-neutral runtime and evidence boundaries remain canonical:

- [scientific runtime](../scientific-runtime/README.md)
- [myocardium lane](../myocardium/README.md)

Use current implementations and V3 tests to determine model claims. A status
document must not promote a diagnostic result into scientific acceptance.

## Deferred until CONTENT-0001 passes

Baroreflex, patient fitting, broad case generation, drop-in succession,
generalized migration UI and speculative authoring automation may not displace
the first Article without a newly recorded product or scientific blocker.
