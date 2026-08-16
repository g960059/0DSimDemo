# Integrated V3 model: current state

Status: current pre-release exact model source; numerically executable, not
clinically validated

## Current source release

The checked-in exact release identity is:

```text
modelId:
  circleheart.main-wire-integrated-transaction-v3.regular-sinus-all-off.standard-60
surfaceReleaseId:
  circleheart.main-wire.surface.workbench-v1
```

Standard-60 contains one self-contained exact executable artifact plus a
build-time-generated `ExecutionPlanDescriptorV1`. The browser does not compile
the model and does not rehash the artifact during ordinary loading. Registry
admission, immutable model identity, manifest equality, exact content pins,
and the external active bundle pointer are the authority for deployed Sessions.

Changing numerical behavior, primitive semantics, or checkpoint continuation
requires a new `modelId`. Byte-only cleanup and optimization instead receive
an immutable artifact revision and may move the Standard-60 implementation
pointer only after byte-exact predecessor equivalence. Changing graphs,
derived presentation, controls that only map existing primitive controls, or
Article Briefing does not change `modelId`.

Current public Articles still include immutable Snapshot placements created on
earlier exact releases. Those artifacts remain loadable under their original
manifest and checkpoint contract until the content is deliberately re-created
and obsolete database revisions are pruned or reset. The active release never
decodes or reinterprets an older release’s checkpoint.

## Model boundary

The integrated model composes:

- five-wall Land/TriSeg cardiac mechanics;
- non-coronary systemic and pulmonary circulation;
- coronary V3 with accepted autoregulation state;
- event-driven regular-sinus rhythm and calcium;
- pericardial and respiratory pressure owners; and
- dynamic mechanical-support owners in the declared all-off configuration.

The public Standard scope is regular sinus, normal coronary configuration,
all support devices off, and bounded model-owned controls. It does not include
autonomic reflexes, oxygen transport/delivery, multipatch myocardium, AV-plane
displacement, Fontan circulation, or congenital bypass topology.

## Numerical authority

`MainWireIntegratedTypedAuthoritySessionV1` owns the live accepted state. Its
transactional typed image contains the current and inactive candidate storage
for all accepted owners. A numerical step stages every owner, validates the
complete candidate, and promotes once. Any failure leaves the previous
accepted tuple unchanged.

The live schedule is one integer-clock update group with a `2 ms` base tick,
period `1`, phase `0`, and presentation at every base tick. Seconds are derived
at API boundaries; the accepted clock is not driven by the visual scheduler.

The production solve retains 30 circulation volumes as active unknowns:

- 14 independent non-coronary volumes;
- 16 coronary volumes; and
- systemic venous volume as the total-blood-volume algebraic dependent state.

TriSeg internal coordinates remain statically condensed through the
model-owned mechanics solve. The rejected promoted 32-variable construction
experiment is retained in Git history rather than in the active source tree.
The current solve uses the existing component residuals, component-owned
convergence gates, deterministic globalization, and dense row-major LU
workspace.

The exact artifact carries the generated execution plan. During Scenario
initialization the Worker validates the descriptor, resolves exact component,
path, and solve-system kernel sets, binds accepted-state slots and the
31-node/37-path hydraulic topology, allocates one private Newton workspace, and
installs the integer schedule. The plan contains no executable functions and
no copy of accepted state. Each Scenario and every control warm-start candidate
receives nonaliasing plan storage.

The declarative compiler does not make the current equations topology-generic.
An unknown component, path, bypass, solve block, or schedule fails closed until
a compatible model-owned kernel is released.

## Worker and presentation

One persistent Scenario Worker owns one exact numerical Session. The hot path
advances accepted ticks in model-owned batches and writes selected scalar
outputs into a transferable typed page. The terminal exact frame remains
complete for controls, capture, authoring correlation, and latest-value reads.
Invalid output selection or page layout is rejected before numerical advance.

Presentation may reduce Canvas work, defer off-screen graphs, and pace accepted
samples. It may not change equations, step size, tolerances, event order,
checkpoint meaning, or derive scientific metrics from decimated UI frames.
All simultaneously live Scenarios share one group model-time clock and one
playback rate.

## Controls, outputs, and graphs

The exact release owns eight absolute numeric controls:

- systemic resistance;
- pulmonary resistance;
- venous tone;
- arterial stiffness;
- regular-sinus heart rate;
- total blood volume;
- PEEP; and
- ventricular contractility scale.

A control change rebuilds a complete fixture and atomically starts a new input
epoch from the current accepted clock. The durable value is the resulting
fixture plus exact checkpoint, not a log of slider actions.

The model exposes 49 primitive outputs: accepted-state/accepted-step signals
and complete-beat metrics. Beat metrics accumulate from every accepted
substep, including event-clipped substeps, and remain unavailable until a
complete capture-to-capture beat exists. Extrema-derived LV volumes, stroke
volume, and ejection fraction are intentionally not labelled EDV/ESV because
they are not yet tied to named valve events.

The Workbench Surface provides pressure and flow sweeps, a pressure-volume
graph, and on-demand bilateral Guyton/Starling orientation. Surface
presentation is independently versioned and does not mint a numerical model
ID.

## Checkpoint, capture, and Snapshot admission

The Standard exact checkpoint wraps the numerical checkpoint with in-progress
beat accumulation and exact accepted clock/revision. Canonical round-trip,
fixture binding, restore continuation, and malformed-input rejection are model
release gates.

Experiment Save captures the current accepted fixture and checkpoint. It does
not claim settlement. Snapshot sealing may reuse a correlated cycle-boundary
candidate already produced for analysis, but never waits for speculative work;
the click-time exact capture is the fallback. Common admission then restores a
detached candidate, verifies round-trip identity, advances the required cycle
window, and applies finite, conservation, event-identity, and all-devices-off
checks while preserving the selected checkpoint byte-for-byte.

The same admission policy applies to standalone publication and Article
placement. Admission is a numerical product policy, not clinical validation
and not part of `modelId` identity.

## Analysis

Guyton/Starling orientation and formal fixed-total-blood-volume pressure-volume
analysis run in disposable exact Workers initialized from one accepted
checkpoint. They never mutate the persistent live Session. Responsive
orientation is explicitly a short, unsettled structural aid. Formal PV
analysis admits only model-owned qualified branches and remains numerical
evidence, not independent physiological validation.

The detailed boundary is in
[INTEGRATED-MODEL-0003](INTEGRATED-MODEL-0003-guyton-starling-side-analysis.md).

## Scientific claim boundary

The active runtime passes its declared numerical, replay, and focused mechanism
gates. Its engine status remains `releaseReady: false` and
`simulationReady: false`. Snapshot admission does not change those flags.

Numerical convergence, conservation, exact replay, plausible morphology, and
literature-backed mechanisms do not establish clinical validity. Published
content must state omitted physiology and scenario-specific limitations. The
current mechanism sources and validation limits are recorded in
[INTEGRATED-MODEL-0002](INTEGRATED-MODEL-0002-literature-traceability.md); the
Studio catalog is recorded in
[INTEGRATED-MODEL-0004](INTEGRATED-MODEL-0004-studio-catalog.md).

## Retention rule

An older implementation remains in the working tree only when it is reached by
an immutable production pin or imported by a named scientific replacement
gate. Completed performance experiments and superseded bridge runtimes belong
in Git history.
