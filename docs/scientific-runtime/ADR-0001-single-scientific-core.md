# ADR-0001: One scientific core and release-bound sessions

- Status: accepted for incremental implementation
- Date: 2026-07-18
- First implementation release (historical): `0.1.0`
- Current candidate release: `0.2.0`
- Current numerical-runtime ABI: `main-wire-accepted-state-transition-v2@2.0.0`
- Evidence status at inception: `verified-research`

## Decision

The current main-wire five-wall model is promoted into the foundation of the
only scientific computation core. Browser, command-line research, fitting, and
batch execution will host the same compiled scientific release. They will not
maintain independent equation implementations or silently fall back to the
legacy `ModelCore` path.

The first vertical slice reuses the already accepted main-wire transaction. It
does not rewrite Land, passive/SLS, membrane TriSeg, pericardium, valve, or
vascular equations. Its initial assembly is deliberately narrow:

- LA, RA, LV free wall, septum, and RV free wall;
- full Land active material;
- equilibrium passive material plus parallel one-state SLS;
- membrane-only TriSeg and common pericardium;
- prescribed calcium and sinus activation;
- quasi-steady atrioventricular valves and root-side semilunar dynamics;
- the current non-coronary closed-loop vascular graph and fixed TBV; and
- acute hydraulic valve-lesion configurations.

AVPD is not a core state in this release. Coronary circulation, devices,
regional conduction, and general MultiPatch mechanics are explicitly
`not-modeled`, not zero-valued normal findings.

## Accepted-state transaction and numerical decomposition

Each time step has one accepted-state transaction:

```text
previous accepted state
  -> pure coupled candidate evaluation
  -> convergence, finite, mass, and mechanics audits
  -> commit every owned state together, or commit nothing
```

This rule does not require one monolithic dense Newton solve. Constitutive
kernels may solve local Land/SLS history, mechanics may condense internal
TriSeg coordinates, and a global solver may use block structure and analytic
or semismooth tangents. The invariant is that subsystem trial states cannot be
independently accepted.

## Compile-time assembly, not runtime plugins

Scientific components expose typed contributions to state layout, residual,
tangent, ledgers, and observables. Approved assemblies are compiled and tested
at build time. A case cannot load arbitrary executable plugins or freely wire
ports at runtime. Topology-changing operations resolve a new approved assembly
and start or fork a session.

During the foundation phase, `engine/scientific` may directly depend on the
curated modules under `engine/myocardium`, `engine/core`, and the main-wire
valve kernel. This is a recorded transition dependency, not evidence that the
old browser runtime is adopted. Dependencies are pulled behind scientific
contracts and moved inward in later stacks without creating a second backend.

## Release identity

The single external root of scientific identity is a `SimulationReleaseRef`:

```ts
type SimulationReleaseRef = Readonly<{
  id: string;
  version: string;
  sha256: string;
}>;
```

The immutable manifest separately locks:

- scientific model and compiled assembly;
- numerical runtime and solver ABI;
- accepted-state/checkpoint schema;
- observable schema and capability catalog; and
- approved protocols and their schemas.

Canonical JSON plus SHA-256 is used for release identity. Existing short stable
hashes remain cache or diagnostic keys and are not release identities.

A published release is a checked-in, complete canonical `{ref, manifest}`
artifact. Browser, Worker, CLI, and tests load and digest-validate those same
resolved bytes; production hosts do not reconstruct the release manifest from
live constructors. The source builder remains an authoring and audit tool
behind an explicit generate/check command. This distinction is required
because standards-compliant JavaScript engines can differ in the last bit of
libm-derived values or accumulated sums even when they execute the same source.
Rounding those differences only at the hash boundary is rejected: it would let
different resolved numerical inputs share one exact-checkpoint identity.

The #478 Git commit recorded by the first release is the immutable source of
its oracle evidence, not the identity of every future executable. A manifest
cannot contain the Git commit that contains that same manifest without a
self-reference. Executable provenance therefore lives in an external build
artifact reference that binds the simulation release, numerical-runtime ABI,
Git commit/tree and clean/dirty status, and the Worker or native artifact
SHA-256. Run artifacts retain both references.

An optimization may keep the numerical-runtime ABI only after the locked suite
shows bitwise-equivalent accepted states and checkpoints. A change to
floating-point trajectories, Newton/Jacobian behavior, integration, equations,
parameters, schemas, topology, or protocols receives a new appropriate
runtime/release identity and repeats its evidence gates.

Release `0.2.0` is the first application of that rule. It retains the `0.1.0`
scientific equations, parameters, accepted-state schema, and topology, but
changes the accepted floating-point/Newton path through:

- a backward-Euler-consistent Land/material tangent that is exact on smooth
  branches and uses the declared Clarke midpoint at the `gamma_su` kinks
  `zetaS = 0` and `zetaS = -1`;
- a material-consistent TriSeg solve with geometry-only finite differences;
- a condensed same-candidate four-chamber pressure-volume tangent, including
  the common-pericardium coupling; and
- an analytic/semismooth 14-volume circulation Jacobian with the dependent-SV
  fixed-TBV chain rule.

That is a breaking numerical-ABI transition, not a bitwise-preserving
optimization. `0.2.0` therefore uses runtime version `0.2.0`, solver version
`2.0.0`, and numerical ABI `main-wire-accepted-state-transition-v2@2.0.0`.
Exact `0.1.0` checkpoints fail closed under `0.2.0`; only an identical full
`SimulationReleaseRef` can be restored as an exact checkpoint.

The deterministic, content-addressed numerical record is
`data/scientific/releases/0.2.0/numerical-validation-v1.json`. It records a
bounded shadow suite and one local performance smoke measurement. It is not an
executable build identity. The source commit at `f229143...` remains only the
lineage of the #478 scientific oracle pack. Exact executable commit/tree and
artifact hashes remain external in `BuildArtifactRefV1` and `RunArtifactV1`,
avoiding source-commit self-reference in the release manifest.

Release lifecycle and evidence are separate axes. The first manifest records
`lifecycleStatus: candidate` and `evidenceStatus: verified-research`, with a
reference to its curated oracle pack. Version `0.1.0` does not make the model
clinically validated.

## Replay, audit, and checkpoints

Exact replay resolves the exact release and uses its resolved parameter
snapshot, protocol, initialization, and optional exact initial checkpoint.
Semantic re-resolution is a separate audit that asks whether the saved intent
still resolves to the same parameters under a newer catalog. A semantic
mismatch does not invalidate exact replay, but it can block editing, upgrading,
or publication as a new official preset.

Two checkpoint roles remain distinct:

- **exact resume checkpoint**: restores only under the identical release and
  checkpoint schema and fails closed on identity mismatch;
- **warm-start seed**: carries declared physical seed fields into an approved
  initialization protocol and is never presented as an exact resume.

Generic exact resume uses checkpoint V3. V3 binds the complete
`SimulationReleaseRef` and the SHA-256 of a separately verified resolved
session input, in addition to accepted state and periodic-settlement tracker.
The bundled healthy checkpoint V2 remains immutable and is accepted only by a
separately named, fixed-canonical official-preset path. A session restored from
that V2 asset emits V3 for every new generic checkpoint; V2 is not accepted by
the generic Worker restore command.

Exact resume means that the stored accepted state is restored bit-for-bit under
the identical release and state schema. It does not claim that future
continuation is bitwise-identical across different JavaScript engines or build
artifacts. Cross-engine continuation is an acceptance-envelope claim; bitwise
continuation requires an independently locked executable build and engine.

Numerical-ABI changes may still permit a separately declared warm-start import,
but they never imply exact-checkpoint compatibility. No such `0.1.0` to `0.2.0`
warm-start importer is claimed by this release.

## Documents and composition

The rewrite separates scientific and presentation documents:

- `PresetDocument`: immutable typed intent and evidence;
- `CaseDocument`: exact release, composed operations, resolved parameters,
  protocol, and initialization;
- `RunArtifact`: exact execution inputs, checkpoints, results, and audits;
- `CalibrationRecord`: data identity, priors, objective, optimizer, and result;
- `WorkspaceDocument`: panels, signals, layout, and notes only.

The first implemented document schemas make `PresetDocumentV1` an immutable,
content-addressed release-bound intent and `CaseDocumentV1` an immutable,
content-addressed revision containing the exact release, intent, verified
resolved session input, approved protocol selection, start identity, and
lineage. `WorkspaceDocumentV1` is a separate content-addressed presentation
revision that references one case and contains only ordered panels, strict
observable-backed views, grid layout, and notes. Its pressure-volume view binds
each trajectory to one catalogued volume observable and one catalogued pressure
observable; hosts do not infer those pairings from chart names. None of these
documents can assert official trust. Official status comes only from an
independently pinned catalog-to-document SHA chain. Editing or forking an
official preset creates a user case revision that retains source lineage
without inheriting official trust. Checkpoint bytes and run outputs are not
case or workspace content; workspace layout and notes are not case content.

Preset operations declare a composition policy. Supported policies begin with
exclusive-set, commutative scale/add, bundle-owned, and replace-component.
Implicit last-write-wins mutation is rejected. Validation and physical bounds
are applied to the composed result, not independently to each patch.

## Workbench presentation boundary

The single-core decision does not replace the user-facing Workbench with the
research page. The product routes retain the existing freeform presentation
shell: users can add, delete, rearrange, and split graph panes; create and
manage controller and metrics views; edit notes; and compose Reading content
that references graph, controller, and metrics views.

The shell owns pane placement, Dockview state, semantic authored-view identity,
notes, and Reading composition. The scientific runtime is injected below that
presentation boundary and owns frames, availability, derived values, controls,
accepted-state transitions, and release identity. A graph pane is a placement;
its `sourceViewId` is the stable semantic view that a note or Reading reference
targets. Splitting or rearranging a pane must therefore not create a different
scientific definition accidentally.

The product runtime renderer consumes native
`MainWireScientificObservableFrameV1` values. It must not reconstruct legacy
`SimSample`, `PhysicsRefState`, or `PreviewCoreFacade` objects merely to reuse a
chart. Legacy presentation components may remain during migration, but they
must not become a reachable alternate scientific execution path.

The current product Workbench can place up to four scientific scenarios in one
presentation. This is a comparison layer, not a coupled multi-model solve:
each scenario owns an independent Worker client, accepted-state session,
control store, command owner, frame stream, and release-bound identity. Global
scenario visibility and per-pane membership determine which independent frame
streams are overlaid in graphs and metrics. Removing a scenario disposes its
runtime and removes its presentation membership. Duplicating a stable scenario
creates another independent release-bound session and carries the committed
SVR/PVR control target into that session; it does not share mutable numerical
state with the source.

This in-memory scenario registry is intentionally not encoded as a new
multi-case `WorkspaceDocumentV1`. The current release-bound workspace still
describes one case's initial presentation, while the product shell owns the
additional comparison membership for the lifetime of the page. Durable
multi-scenario Case/Workspace revisions remain follow-up work.

The localized `/scientific-workbench` route remains the research/development
surface for provenance and numerical evidence. It and `/workbench` may own
independent sessions, but both must resolve the same release-bound scientific
contracts.

## Observables

Hosts receive stable observable IDs, units, availability, and quality rather
than internal model objects. Availability distinguishes:

- `available`;
- `not-modeled`;
- `not-measurable`; and
- `not-converged`.

An exact checkpoint may additionally report
`not-evaluated-at-accepted-state` for an algebraic readback that is
intentionally not part of accepted state and has not yet been recomputed. This
is distinct from claiming that the signal is absent from the model.

Quality metadata is separate from availability. The browser must not fabricate
zeroes for unavailable quantities.

## MultiPatch boundary

Five-wall and future MultiPatch configurations use the same constitutive and
mechanics backend. A patch definition must keep material, activation,
territory/coupling, and geometry ownership separate. Merely adding a patch
count or geometry weight is insufficient. The first release can remain one
patch per wall while the compiled layout and ownership contracts are prepared
for multiple patches.

## Browser and performance

The browser runs scientific sessions in a worker and never on the UI thread.
Worker isolation prevents UI blocking but does not make the model faster, so
performance is a cutover gate. No worker command can silently retry with
`ModelCore` or another scientific backend.

Within each controllable product scenario, exactly one headless controller
owns that scenario's Worker command stream. Controller panes and controller
references embedded in notes or Reading are mirrors over the selected
scenario's shared immutable store; they do not create competing session
owners. An authored controller may follow the active scenario or be bound to
one specific scenario. Graphs subscribe to the corresponding accepted frame
snapshots. An unavailable observable or derived metric remains unavailable
(`null` plus its reason) and is never filled with a synthetic zero.

The browser alpha may begin before all physiology gates pass. The explicit
user0 product-route cutover is recorded in
`BROWSER-CUTOVER-0001-product-workbench.md`; it is a fail-closed pre-release
integration decision and is not a clinical or generally supported production
claim. Public production qualification and final legacy-code deletion still
require both:

- a healthy/load envelope with periodicity, conservation, waveform, and
  morphology acceptance; and
- a measured interactive performance envelope on supported hardware.

The `0.2.0` candidate exceeds 500 step/s in one local 500-step smoke run, but
that result is neither a supported-hardware distribution nor a browser
end-to-end measurement. It does not by itself authorize production cutover.

## Delivery sequence

1. Freeze a curated #478 oracle and negative-evidence record.
2. Add release identity and a headless session around the accepted transaction.
3. Add lockstep, rollback, checkpoint, conservation, and performance gates.
4. Add the release-bound worker and observable protocol for browser alpha.
5. Replace case, preset, control, and workspace documents.
6. Inject the scientific runtime beneath the preserved user-facing Workbench
   shell without fallback, then delete unreachable legacy scientific execution
   paths after the cutover suite remains green.
7. Extend the same assembly system with coronary circulation, devices,
   MultiPatch/conduction, and fitting.

Historical search artifacts are not retained as production runtime code.
Curated failed hypotheses and acceptance boundaries are preserved in ADRs,
reports, golden data, tags, and Git history.

## Non-goals of this foundation stack

- No detailed parameter fitting.
- No promise of compatibility with old cases or presets.
- No claim of publicly supported production cutover before required physiology
  and measured browser performance evidence exists.
- No coupled multi-scenario scientific solve, durable multi-scenario document,
  or user-case/workspace persistence in the current product slice. The current
  multi-scenario feature is an in-memory comparison of isolated sessions.
- No coronary, assist-device, or full MultiPatch implementation yet.
- No general-purpose runtime plugin framework.
