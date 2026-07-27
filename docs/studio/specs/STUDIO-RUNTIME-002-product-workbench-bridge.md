# STUDIO-RUNTIME-002 — product Workbench bridge

Status: implemented Workbench transition plus session-only Document Editor,
Briefing capture, and draft Reader Preview vertical slices; durable
publication-grade contexts and aggregate multi-scenario session pending
Date: 2026-07-24
Updated: 2026-07-25

## Purpose

Connect the Studio runtime foundation to a real browser product surface while
the durable, publication-grade Reader, Study Lab, and Document application
remain under construction. A structured session-only Document Editor,
Workbench Briefing compose layer, and Reader Preview are now connected. Their
content and trust boundary is specified separately in
[STUDIO-CONTENT-001](STUDIO-CONTENT-001-reader-preview-vertical-slice.md).

The bridge reuses the existing product Workbench shell, scenario controls,
panels, charts, and metrics presentation. Numerical ownership moves to the
Studio coordinator and MainWire runtime adapter:

```text
existing product Workbench shell
  → ScientificProductRuntimeRegistryPortV1
    → ScientificProductStudioScenarioRegistryV1
      ├─ one Studio scenario controller per displayed scenario
      │   → one SimulationSessionCoordinatorV1 per scenario
      │     → MainWireSimulationRuntimeAdapterV1
      │       → dedicated live Worker
      │       → exclusive strict Worker lease
      └─ one demand-driven hemodynamic analysis coordinator per scenario
          → one persistent MainWire analysis Worker
            → exact settled-source V4 restore
            → bidirectional Guyton/Starling continuation Workers
```

This is a product connection, not a mock. The scenario controller remains the
only owner of the foreground live and background strict lanes. Guyton/Starling
uses a separate, explicitly bounded analysis path from an exact settled source;
it is not a fallback live controller. This remains a transition bridge, not
evidence that the target Studio product architecture is complete.

## Implemented user-visible runtime semantics

### Open and one-point start

- A bundled official exact-periodic source or research source is restored and,
  when necessary, settled before it becomes the Studio source.
- Bootstrap materializes an exact V4 snapshot and exactly one same-revision,
  same-time accepted observable point.
- No canonical beat history is saved or passed into the product surface.
- The product opens that branch with live presentation suspended, commits the
  one-point state to the Workbench, and resumes 1×-ceiling presentation only
  after a double-`requestAnimationFrame` paint boundary.
- Charts, PV loops, and window metrics grow forward from that one settled
  point. The seed is identified as a settled one-point snapshot only while it
  remains one point; the first live append changes the display evidence to an
  open transient with no periodic claim. Metrics remain collecting until
  enough forward samples exist.

### Parameter intent

- Every committed parameter change automatically starts both paths:
  foreground live transition and background strict settlement.
- The live path presents at 1× physiological time as its ceiling, never
  faster. When compute cannot sustain it the lane keeps running and reports
  degraded pacing rather than accelerating or failing. The bridge exposes
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
  selection, panel layout, waveform, live PV-loop, Guyton/Starling,
  controller, and provisional metric interactions remain available through
  the product Workbench.
- The bridge maintains a bounded 20-second presentation frame window; this is
  a UI buffer, not a canonical artifact.
- A parameter commit retains the preceding waveform quietly until the incoming
  generation fills the configured visible time window. The old and incoming
  values both participate in the temporary display domain, avoiding an empty
  graph and reducing autoscale movement during the transition.
- PV-loop parameter generations are separate from within-generation beat
  history. The pane can retain `0`, `1`, `3`, `5`, or `6` preceding parameter
  generations (default `6`); older generations fade with age and remain in
  the display domain until evicted by that bound.
- Portable Studio runtime points are projected into the existing MainWire
  observable-frame presentation shape. The projector is a presentation
  adapter and fails closed when required signal identity or values are absent.
- Workbench and Reader graph panes invoke the same
  `ScientificProductGraphPaneV1` implementation. Reader does not maintain a
  separate waveform, PV-loop, or Guyton/Starling chart implementation.
- Leaving the Workbench or removing a loading scenario aborts bootstrap and
  an in-flight runtime open. Opening hosts are terminated and a cancelled
  session cannot attach later. Bootstrap exposes its dependent source
  artifacts through one atomic CAS batch, so cancellation before commit leaves
  no partial source graph. Each transition-bridge scenario owns its temporary
  in-memory CAS; removing a scenario releases that store instead of retaining
  unreachable bootstrap entries in a shared registry store.
- Route disposal force-closes the runtime before waiting for queued UI
  operations. A delayed signal activation therefore cannot keep a Worker alive
  or make unmount wait indefinitely; the ordinary non-forced close path still
  fences activation cleanup before closing.
- Domain scenario ids remain unchanged in content and provenance. Worker
  request/session host ids are a separate transport identity and normalize
  characters outside the kernel identifier grammar (for example `/`) before
  crossing the Worker boundary.

## Hemodynamic analysis and remaining capability gates

The bridge never silently revives the old Worker/controller as a numerical
fallback. Connected analysis is sourced from Studio-owned settled artifacts;
remaining unsupported analysis is presented as unavailable.

- **Guyton / Starling load-series analysis:** connected. Visible left/right
  panels create demand against the latest exact settled source. One
  scenario-owned parent MainWire Worker persists across accepted generations;
  its exact V4 source sessions and superseded jobs are short-lived. Requests
  are serialized latest-only, left/right demand is coalesced to the required
  detail, superseded results cannot publish, and the last usable presentation
  is retained while a replacement is running or fails. Every rendered
  generation keeps its calculation-source and parameter-state role; a retained
  previous curve is labelled as previous/waiting rather than reported as a
  completed result for the new controls.

- **V&V / Quick Check reports:** not connected to the Studio assessment port.
  The product reports them as unavailable while live and strict runtime work
  continues.
- **Advanced PV relation / load-series analysis:** not connected. The ordinary
  live PV loop remains available because it is drawn from the Studio live
  frames; ESPVR/EDPVR-style or load-series analysis is explicitly unavailable.

The following target capabilities are also outside this bridge:

- target Reset to the original certified one-point seed;
- viewport/offscreen runtime scheduling and browser performance budgets;
- the final Reader topology beyond the one-placement/one-scenario draft
  Preview slice;
- one aggregate multi-scenario Study Lab session and the complete per-extent
  Presentation Compose model;
- durable project-backed Experiment/Document persistence, RunArtifact
  browsing, and conflict recovery across clients;
- multi-placement CellPlacement authoring, publication, certification, and
  official content re-authoring.

The existing lightweight saved-scenario/product UI remains presentation-shaped
and is not the target Experiment or Document persistence model.

## Session-only Document and Briefing connection

The initial content connection is deliberately smaller than the final
publication model, but it is no longer a placeholder:

- `StudioDocumentBlockEditorV1` edits the canonical Studio Document AST
  directly: title, ordered H2/H3 headings, and paragraphs; it orders the
  Experiment placement as an atomic structured reference. It does not use
  BlockNote JSON, legacy Notes, or `CaseDocument` as an intermediate
  persistence format.
- One successful editor transaction atomically replaces title and ordered
  blocks, advances the draft and Document revision once, and rejects a stale
  expected revision without partial mutation.
- The explicit Workbench **Briefing** layer captures, updates, removes, or
  captures all supported graph panes. Closing it removes the compose surface
  and leaves the normal clinical Workbench free of pane-level authoring
  controls.
- Capture produces a detached `StudioGraphPaneSpecV1`, not a pointer to the
  live pane. It freezes effective scenario/item labels and colors, waveform
  window, legend visibility and position, PV settings including both history
  dimensions, and Guyton/Starling detail/history settings. Dock geometry,
  live frames, jobs, and open-settings state are excluded.
- Replacing the captured graph-pane list advances the draft and Experiment
  revision while leaving the Document revision unchanged. Later Workbench
  edits do not alter an existing brief until the author explicitly updates
  the capture.
- Reader reconstructs a read-only `PanelDef` from each portable graph-pane
  snapshot and sends it to the shared graph renderer. Settings, legend drag,
  graph addition, and layout mutation remain unavailable in reading mode.

All of this state remains session-only and uncertified. It proves the
application and presentation seams; it does not provide durable save,
publication, or sharing.

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
controller is its sole owner. Empty V&V and advanced PV-relation values are
capability gates for unsupported analysis, not synthetic scientific results.
Guyton/Starling is no longer represented by an intentionally empty protocol
series in this bridge.

This reuse is bridge debt. The final product should introduce Studio-native
presentation contracts where that improves clarity, then delete or rename
legacy-shaped DTOs without a compatibility migration.

## Role-workflow browser evidence

`e2e/scientificProductRoleWorkflowsV1.spec.ts` records three concrete product
workflows without treating transition UI as completed Studio architecture:

- **Author:** the initial greenfield content slice can edit the bundled
  afterload article through the structured Document Editor, materialize a
  session-only draft preview, and inspect the shared waveform/PV/Guyton
  renderers in its one Reader inflow. Durable Experiment/Document save,
  publish, certification, and a shareable published link remain absent.
- **Resident:** the current lesson Reader supports reading and inline model
  adjustment, then the user can enter the Studio-backed Workbench. The inline
  lesson simulation still uses the legacy preview runtime; no hidden Studio
  host is claimed inside Reader.
- **Clinician:** Cases can open the Studio-backed Workbench directly. Parameter
  commit, automatic target-generation advance, live pause/resume, parameter
  history, and the explicit unavailable V&V state are exercised. The compose
  workflow then opens Briefing explicitly, captures the configured window,
  color, label, and legend position, returns through Document Editor, and
  verifies the same waveform/PV/Guyton panes in Reader. Guyton/Starling uses
  the Studio settled-analysis path rather than an unavailable placeholder.

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
- `components/scientificProduct/ScientificProductStudioHemodynamicAnalysisCoordinatorV1.ts`
- `studio/adapters/mainWire/MainWireStudioHemodynamicAnalysisHostV1.ts`
- `components/scientificProduct/ScientificProductRuntimeRegistryPortV1.ts`
- `components/scientificProduct/ScientificProductStudioObservableFrameProjectionV1.ts`
- `components/scientificProduct/ScientificProductWorkbenchRouteV1.tsx`
- `components/scientificProduct/ScientificWorkbenchRuntimeRendererV1.tsx`
- `components/scientificProduct/ScientificWorkbenchBriefingComposerV1.tsx`
- `components/studio/StudioGraphPaneProjectionV1.ts`
- `components/studio/author/StudioDocumentBlockEditorV1.tsx`
- `components/studio/reader/StudioDocumentReaderV1.tsx`

The numerical contract, coordinator, and adapter remain those specified by
[STUDIO-RUNTIME-001](STUDIO-RUNTIME-001-foundation-vertical-slice.md).

## Exit criteria for the transition bridge

The bridge stops defining the main Studio runtime topology when:

1. the product creates one aggregate `SimulationSession` with N scenario
   branches and issues atomic multi-branch intent through it;
2. viewport demand, suspend/resume, and target-device browser budgets are
   qualified;
3. target Reset is implemented and verified;
4. V&V and advanced PV analysis use explicit Studio capability ports or
   remain intentionally out of the final product;
5. Studio-native presentation contracts replace accidental legacy DTO
   coupling; and
6. the durable publication-grade Reader, aggregate Study Lab, Document
   Editor, and per-extent compose model are connected to the shared Studio
   application and persistence model.

Until those conditions hold, this specification is the honest implemented
boundary: a useful product Workbench plus session-only content vertical slice,
not the completed Studio v1 presentation architecture.
