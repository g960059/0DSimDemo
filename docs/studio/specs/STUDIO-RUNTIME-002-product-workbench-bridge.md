# STUDIO-RUNTIME-002 — product Workbench bridge

Status: implemented transition vertical slice; the separate draft Reader
Preview is specified in STUDIO-CONTENT-001; final Studio product contexts and
aggregate multi-scenario session pending
Date: 2026-07-24

## Purpose

Connect the Studio runtime foundation to a real browser product surface while
the final Reader, Study Lab, and Document Editor are still being built. The
narrow, session-only Author → Reader Preview slice is specified separately in
[STUDIO-CONTENT-001](STUDIO-CONTENT-001-reader-preview-vertical-slice.md).

The bridge reuses the existing product Workbench shell, scenario controls,
panels, charts, and metrics presentation. Numerical ownership moves to the
Studio coordinator and MainWire runtime adapter:

```text
existing product Workbench shell
  → ScientificProductRuntimeRegistryPortV1
    → ScientificProductStudioScenarioRegistryV1
      → one Studio scenario controller per displayed scenario
        → one SimulationSessionCoordinatorV1 per scenario
          → MainWireSimulationRuntimeAdapterV1
            → dedicated live Worker
            → exclusive strict Worker lease
```

This is a product connection, not a mock and not a second numerical runtime.
It is also a transition bridge, not evidence that the target Studio product
architecture is complete.

## Implemented user-visible runtime semantics

### Open and one-point start

- A bundled official exact-periodic source or research source is restored and,
  when necessary, settled before it becomes the Studio source.
- Bootstrap materializes an exact V4 snapshot and exactly one same-revision,
  same-time accepted observable point.
- No canonical beat history is saved or passed into the product surface.
- The product opens that branch with live presentation suspended, commits the
  one-point state to the Workbench, and resumes fixed-1× presentation only
  after a double-`requestAnimationFrame` paint boundary.
- Charts, PV loops, and window metrics grow forward from that one settled
  point. The seed is identified as a settled one-point snapshot only while it
  remains one point; the first live append changes the display evidence to an
  open transient with no periodic claim. Metrics remain collecting until
  enough forward samples exist.

### Parameter intent

- Every committed parameter change automatically starts both paths:
  foreground live transition and background strict settlement.
- The live path runs at fixed 1× physiological time. The bridge exposes
  pause/resume for live playback; it does not expose a speed selector.
- Suspending live playback does not cancel the strict lane.
- Target generation and presentation revision remain Studio-owned.
  Superseded live events and strict results are rejected internally rather
  than exposed as durable user-facing stale jobs.
- The latest current-generation strict result becomes a candidate and never
  replaces the displayed trace automatically.

### Promotion and pinning

- **Use settled state** explicitly promotes the current candidate into the
  displayed branch.
- Promotion replaces the display with the candidate's one seed point, then
  grows a new 1× trace forward. It does not restore a saved beat.
- **Pin run** separately writes the immutable candidate run into the
  content-addressed artifact store.
- Pinning and promotion are independent operations. A pinned candidate is not
  automatically displayed, and displaying a candidate does not implicitly
  certify it.

### Product presentation

- Existing scenario add, duplicate, rename, recolor, visibility, active
  selection, panel layout, waveform, live PV-loop, controller, and provisional
  metric interactions remain available through the product Workbench.
- The bridge maintains a bounded 20-second presentation frame window; this is
  a UI buffer, not a canonical artifact.
- Portable Studio runtime points are projected into the existing MainWire
  observable-frame presentation shape. The projector is a presentation
  adapter and fails closed when required signal identity or values are absent.
- Leaving the Workbench or removing a loading scenario aborts bootstrap and
  an in-flight runtime open. Opening hosts are terminated and a cancelled
  session cannot attach later. Bootstrap exposes its dependent source
  artifacts through one atomic CAS batch, so cancellation before commit leaves
  no partial source graph. Each transition-bridge scenario owns its temporary
  in-memory CAS; removing a scenario releases that store instead of retaining
  unreachable bootstrap entries in a shared registry store.

## Explicitly unsupported product capabilities

Unsupported analysis is presented as unavailable. The bridge never silently
revives the old Worker/controller as a numerical fallback.

- **V&V / Quick Check reports:** not connected to the Studio assessment port.
  The product reports them as unavailable while live and strict runtime work
  continues.
- **Guyton / load-series analysis:** not connected. Relevant panels show an
  explicit unavailable state.
- **Advanced PV relation / load-series analysis:** not connected. The ordinary
  live PV loop remains available because it is drawn from the Studio live
  frames; ESPVR/EDPVR-style or load-series analysis is explicitly unavailable.

The following target capabilities are also outside this bridge:

- target Reset to the original certified one-point seed;
- viewport/offscreen runtime scheduling and browser performance budgets;
- the final Reader topology beyond the separate one-placement/one-scenario
  draft Preview inflow slice;
- the final multi-scenario Study Lab and Presentation Compose layer;
- ExperimentDraft/ExperimentRevision, RunArtifact browsing, and durable
  project workflow;
- Document Editor, CellPlacement, publication, certification, and official
  content re-authoring.

The existing lightweight saved-scenario/product UI remains presentation-shaped
and is not the target Experiment or Document persistence model.

## Deliberate topology limitation

The target design is:

```text
one SimulationSession
  └─ N ScenarioRuntimeBranch
       └─ one atomic session intent can target multiple branches
```

The current product bridge is:

```text
product scenario registry
  ├─ scenario A → coordinator A → SimulationSession A with one branch
  ├─ scenario B → coordinator B → SimulationSession B with one branch
  └─ scenario N → coordinator N → SimulationSession N with one branch
```

Therefore, adding multiple product scenarios does not yet exercise the
headless coordinator's aggregate N-branch ownership or atomic multi-scenario
intent. The registry coordinates presentation state only. This limitation is
accepted for the first browser vertical slice and must not be copied into the
final Study Lab architecture.

## Legacy presentation reuse

The greenfield cutover rejects backward-compatible data and numerical
fallbacks, but it does not require throwing away useful presentation code.
This bridge temporarily reuses:

- the existing product Workbench route, shell, panel grid, chart renderers,
  scenario manager, and authored layout/view types;
- `ScientificWorkbenchResearchControlStoreV0` as a UI-facing compatibility
  façade whose owner actions delegate to the Studio scenario controller;
- `ScientificProductScenarioPresentationV1` and related protocol-series
  shapes as presentation DTOs.

These types do not become Studio domain contracts. In particular, the V0
control store does not own a Worker or integrate the model; the Studio
controller is its sole owner. Empty protocol-series values are capability
gates for unsupported analysis, not synthetic scientific results.

This reuse is bridge debt. The final product should introduce Studio-native
presentation contracts where that improves clarity, then delete or rename
legacy-shaped DTOs without a compatibility migration.

## Role-workflow browser evidence

`e2e/scientificProductRoleWorkflowsV1.spec.ts` records three concrete product
workflows without treating transition UI as completed Studio architecture:

- **Author:** the initial greenfield content slice can edit the bundled
  afterload article, materialize a session-only draft preview, and inspect its
  one Reader inflow. Durable Experiment/Document save, publish, certification,
  and a shareable published link remain absent.
- **Resident:** the current lesson Reader supports reading and inline model
  adjustment, then the user can enter the Studio-backed Workbench. The inline
  lesson simulation still uses the legacy preview runtime; no hidden Studio
  host is claimed inside Reader.
- **Clinician:** Cases can open the Studio-backed Workbench directly. Parameter
  commit, automatic target-generation advance, live pause/resume, and the
  explicit unavailable V&V state are exercised as one browser workflow.

The Workbench browser test also records the initial
`settled-snapshot-one-point`, generation-0 DOM commit before it observes the
forward-growing live trace. This is DOM commit evidence, not a pixel capture;
the suspended open plus double-animation-frame boundary is the mechanism that
preserves paint-before-resume ordering.

These tests distinguish navigation continuity from runtime ownership. A user
can cross from an older presentation context into the Studio bridge, but that
does not make the older context a Studio consumer.

## Source locations

The main bridge boundaries are:

- `components/scientificProduct/ScientificProductStudioBootstrapV1.ts`
- `components/scientificProduct/ScientificProductStudioScenarioControllerV1.ts`
- `components/scientificProduct/ScientificProductStudioScenarioRegistryV1.ts`
- `components/scientificProduct/ScientificProductRuntimeRegistryPortV1.ts`
- `components/scientificProduct/ScientificProductStudioObservableFrameProjectionV1.ts`
- `components/scientificProduct/ScientificProductWorkbenchRouteV1.tsx`
- `components/scientificProduct/ScientificWorkbenchRuntimeRendererV1.tsx`

The numerical contract, coordinator, and adapter remain those specified by
[STUDIO-RUNTIME-001](STUDIO-RUNTIME-001-foundation-vertical-slice.md).

## Exit criteria for the transition bridge

The bridge stops defining the main Studio runtime topology when:

1. the product creates one aggregate `SimulationSession` with N scenario
   branches and issues atomic multi-branch intent through it;
2. viewport demand, suspend/resume, and target-device browser budgets are
   qualified;
3. target Reset is implemented and verified;
4. V&V, Guyton/load-series, and advanced PV analysis use explicit Studio
   capability ports or remain intentionally out of the final product;
5. Studio-native presentation contracts replace accidental legacy DTO
   coupling; and
6. the publication-grade Reader, Study Lab, and Document Editor are connected
   to the shared Studio application model.

Until those conditions hold, this specification is the honest implemented
boundary: a useful product Workbench vertical slice, not the completed Studio
v1 presentation architecture.
