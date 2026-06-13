# Workbench IA/UX Redesign — Implementation Plan (P0–P4)

Status: ACTIVE work order. Branch: `ux/workbench-ia-redesign`.
Authored by team lead (plan), implemented by codex (CLI), reviewed by team lead.
Color design is OUT OF SCOPE entirely.

This plan operationalizes the final IA/UX direction. The full decision rationale
must be captured in **ADR-0007** (P0 deliverable); this file is the execution plan.

---

## Design principles (binding for all phases)

1. **Layout freedom is concentrated in the main area only.** Every other zone has a
   fixed, content-derived default. No exceptions.
2. Zones:
   - Left: **Note drawer** — default hidden, single pane, no split, **push** (not overlay).
     Opening shrinks ONLY the main area; the right rail keeps fixed width.
   - Center (**main**): **Graph Board** — the ONLY dockview. Free splitting, persisted as a
     semantic split tree.
   - Right (**rail**): Scenario list (top) + Inspector (bottom). Fixed position & width
     (invariants). Two-tier simultaneous stack with a draggable scenario/inspector sash.
     One pane each, no split. **No left/right swap.**
   - Bottom: **Metrics host** — document metrics view tabs. Tab switching only.
3. Header uses inline visibility toggles plus a trimmed customize popover for metrics span.
   Arrange UI was removed; one-click split covers composition.

## Canonical model split (the foundation)

```
ViewSpec            = WHAT to show (controller / metrics / graph view; includes
                      membership, aspect, binding)                       [document]
GraphBoardLayout    = main-area semantic split tree + ratios (canonical) [document]
WorkspaceViewState  = UI arrangement (active tab / zone open-closed / scroll etc.)
                      (non-canonical)                                    [local]
RuntimeState        = active scenario / global visibility / knob values /
                      transient edits                                    [runtime]
```

### GraphBoardLayout (replaces any preset-enumeration approach)

```ts
type GraphBoardLayout =
  | { type: "leaf"; graphViewId: string }
  | { type: "split"; direction: "row" | "column";
      children: GraphBoardLayout[]; sizes: number[] } // ratios, same length as children
```

- Canonical: the split tree + ratios, DERIVED from Dockview state on change.
  Dockview JSON itself is never canonical (existing ADR-0003 principle is kept).
- Non-canonical: active tab, scroll position, absolute pixels.
- Presets ("Arrange as 2x2" etc.) are command semantics that generate a tree in one shot;
  only the resulting tree is saved. The visible Arrange UI was removed; the helper remains
  unwired for future MCP/LLM/API use.
- Degradation across screen sizes is accepted by spec (ratios don't break).

### Aspect ratio — property of GraphViewSpec, resolved at pane-content layer

```ts
GraphViewSpec.aspect?: { ratio: number; fit: "lock" | "prefer" }
```

- PV loop: `{ ratio: 1, fit: "lock" }` — keep square inside the cell (letterbox, centered).
- Waveform: no constraint — follows the cell.
- This single mechanism absorbs note-drawer push, display differences, and split-ratio changes.

### Scenario 4-state model (strict separation, model invariants)

| state        | meaning                                                            | layer    |
|--------------|--------------------------------------------------------------------|----------|
| active       | controller edit target (always exactly 1; initial = first; on delete = neighbor) | runtime  |
| visible      | shown on graphs (independent of active)                            | runtime  |
| pinned       | a specific ViewSpec references it fixedly                          | document |
| selected row | rename/delete/menu/keyboard focus target                           | UI       |

Confirmed behaviors: row click → activate only / eye click → visibility toggle only /
double click → inline rename / row menu → duplicate, delete, pin, reset /
active-but-hidden → controller still shows it + graph legend marks "hidden".

### Visibility: 2-layer model (eliminates the current 3-layer mix)

- **membership (document layer)**: the set of scenario×item each graph view can show.
  Part of ViewSpec, author-edited.
- **global visibility (runtime layer)**: the eye icon in the scenario list; cross-graph on/off.
- **Effective display = membership ∩ global visibility.**
- Pane-local visible flags (`PanelInstanceConfig.visible`) are ABOLISHED (P1).
  "Hide on this graph only" = edit membership (remove the item). No third toggle layer.

### Compare mode: fully removed

Comparison is a STATE (visibility combination), not a mode. `WorkbenchWorkspace.mode`
and `COMPARE_PRESET` are cleanup targets (P1). A future metrics "Differences" tab
(do NOT name it "Compare") is a possible built-in view — out of initial scope.

### View host / ViewSpec

- Every zone is a view host; its controller/metrics views are document ViewSpecs.
- The standard controller set and four standard metrics sets are official factory seeds,
  not a separate built-in runtime mode. They are editable, duplicable, deletable, and
  restorable.
- Controller / metrics views are **ViewSpec** document content saved in CaseDocument.
- **(REVISED 2026-06-12)** Creation/serious editing happens in a MODAL (shared
  frame with the graph pane settings modal), NOT as a main-area pane. Rationale:
  the main area is the Graph Board (graphs only — hosting editors there would
  break the zone semantics); composition editing (which items, labels, ranges)
  is a selection task that does not need live graphs; one editing idiom across
  graph/metrics/controller views; mobile degrades naturally to a fullscreen
  sheet. Light edits (+item) may still be offered inline at the host.

### View management (decided 2026-06-12)

- **No dedicated management screen.** Authored views are case-scoped document
  content; the per-case count stays small (2-5). What grows is the parameter
  CATALOG (assist devices, model refinement) — absorbed by the item PICKER
  (search + device/category sections) and by collapsible sections + search in
  the standard clinical-parameters view, never by a separate screen.
- **The rail dropdown IS the list and the management UI.** The inspector tier
  header becomes a dropdown: document controller views + "+ new controller" +
  "restore standard views". Row hover actions: edit / rename / duplicate / delete.
  The "Editing: ● scenario" chip opens the selected view's editor.
- **Creation paths, primary first:** (1) from the Inspector — curate by
  selecting from the full catalog ("+ add to custom" affordance or the modal
  picker showing the same catalog tree); (2) duplicate an existing view (A→B);
  (3) from blank.
- **Deletion:** allowed with a warning when the view is referenced (note
  view_ref / reading column); references degrade to the existing dangling-ref
  placeholder pattern (same as pane_ref). Never hard-block deletion.
- **Note embedding:** extend pane_ref to a `view_ref` block referencing a
  viewSpecId. Binding is VIEW-level only ({ slot: "active" } default, pin
  opt-in in P3) — per-item binding is explicitly rejected.
- **Metrics views follow the identical pattern:** the metrics host tab strip is
  the list of MetricsViewSpecs, "+" opens the same modal frame with a metric
  picker, restore standard views re-adds missing seeded sets, and tab context
  menu offers edit / rename / duplicate / delete.
- **Future (not now):** item applicability may become scenario-dependent
  (e.g. no ECMO attached). The picker/renderer should key off the catalog
  registry (paramKey + device grouping) so an N/A state can be added later.
- Switcher/tab choices are DERIVED from in-document ViewSpecs (users don't create tabs).
- **Schema is NEW — not a promotion of `PanelDef.view`.** Write a one-way migration
  from existing PanelDef. Do not lift the "typed but not live" layer.

### Binding

```
default: { slot: "active" }   — follows active scenario (same mental model as inspector)
opt-in:  { scenarioId: ... }  — per item/view pin (explicit pin icon)
```

Publish does NOT freeze-resolve bindings. Reproducibility comes from initial state:
binding stays `{ slot: "active" }`; save `initialActiveScenarioId` + author runtime
snapshot (initial visibility / knob values / graph state) = "Reset to author's state".
Pins are only for deliberate fixing (e.g. lesson steps).

### Reading / Explore / Fork

- "Reading mode", not "lesson mode". Solo case → note-attached shared case → lesson
  is a spectrum of the SAME document type; one reader renderer handles all.
- Viewing structure = 2 entrances + 1 exit: Reading mode (document layout, read-only
  but interactive) / Workbench read-only (the workbench itself with op dispatch blocked)
  / Fork (exit, from anywhere).
- Initial view derived at share time: has note → Reading; no note → Workbench read-only.
  Author may only override.
- Only when a note exists: header segmented switcher (Read | Explore). Fork is the
  right-edge primary, visually separated.
- Switching carries runtime state over (switch ≠ reload).
- Fork initial values = the viewer's CURRENT runtime state. Author state is obtained
  via Reset → Fork (2 operations).
- During read-only: persistent "changes won't be saved" badge + Fork button.

### read-only definition

read-only = no ops can be pushed to the document. Runtime operation is free.

```
allowed:   active change / sliders / visibility toggles / metrics tab switch /
           Read·Explore switch / Reset to author's state
forbidden: ViewSpec create·delete / note edit / scenario CRUD / pane add / publish settings
```

### Mobile

Re-map roles to form-factor conventions: top scenario chips (horizontal scroll) →
graph → controller as bottom sheet (list → inspector vertical 2-tier inside the sheet).
Metrics in-sheet tabs or below graph.

---

## Phases

### P0 — ADR-0007 + model groundwork  ← DONE

Commit: `79ff6ea` (plus ADR seed `1dc4344`).

Deliverables (no runtime UI behavior change in P0):

1. **`docs/adr/0007-workbench-ia-redesign.md`** — record ALL decisions above with
   context/rationale/consequences, following the existing ADR format and language style.
2. **Supersede markers (do NOT rewrite bodies):**
   - ADR-0003: Partially superseded by 0007 (4-zone dockview → main-only dockview;
     other zones fixed).
   - ADR-0004: Partially superseded by 0007 (save responsibilities for reading /
     exposedControllers / author snapshot / binding).
   - ADR-0005: Partially superseded by 0007 (shared read-only Explore = Workbench
     read-only entrance; Read|Explore switcher; Compare-as-state confirmed).
   - `docs/adr/README.md` index: ensure 0005 and 0006 are listed; add 0007.
3. **New type layer** (new module(s) at repo-convention location, e.g. alongside
   `types.ts` / `caseDoc.ts`):
   - `ViewSpec` union: `GraphViewSpec` (graphType, membership, `aspect?`, presentation),
     `ControllerViewSpec` (ControllerItem[], binding), `MetricsViewSpec` (metrics, membership).
   - `ScenarioBinding = { slot: 'active' } | { scenarioId: string }`.
   - `GraphBoardLayout` as above + validation/normalization helpers
     (sizes.length === children.length, positive ratios, ≥2 children per split,
     leaf graphViewIds resolvable & unique; collapse single-child splits).
   - `WorkspaceViewState`, `RuntimeState` type definitions with explicit
     canonical/non-canonical documentation.
   - Visibility helpers: `effectiveVisibility(membership, globalVisibility)` etc.
   - **One-way migration** `PanelDef[] (+ workspace) → { views: ViewSpec[];
     graphBoardLayout: GraphBoardLayout }`: graph panels → GraphViewSpec with
     membership derived from `config[instanceId].visible` × `selectedSignals`;
     METRICS → MetricsViewSpec; CONTROLS → ControllerViewSpec (authored);
     SCENARIOS/NOTE are NOT ViewSpecs (scenario list & note are fixed zones).
     Layout tree derived from grid x/y/w/h with a simple row/column heuristic.
   - `CaseDocument` additive optional fields: `views?: ViewSpec[]`,
     `graphBoardLayout?: GraphBoardLayout`, `initialActiveScenarioId?: string`
     (types land now; UI wiring in P1/P3). Keep schemaVersion policy consistent
     with repo conventions (additive fields should not require a version bump if
     loaders tolerate absence — follow existing practice).
   - Thorough unit tests (vitest): migration, invariants, visibility intersection,
     serialization round-trip through CaseDocument.
4. **Save-path fix:** `reading` and `exposedControllers` (and the new fields above)
   must survive `simInstancesToCaseDocument` round-trips. Add regression tests
   proving doc → workbench state → doc preserves them.
5. **`docs/workbench-implementation-plan.md`** — rewrite to match the current
   `features/workbench/*` structure and this P0–P4 roadmap.

### P1 — main-only dockview  ← DONE

Commits: P1a `7068e1b`, `5a03df0`; P1b `4096e23`, `7420e16`, `349be4b`; P1c `f387c91`, `2fc22a9`; P1d `a846ef4`.

- Remove dockview from sideRail/bottomPanel/caseRail; main Graph Board is the only dockview.
- Right rail = scenario list + inspector two-tier stack (fixed). Scenario list rows:
  color swatch, eye toggle, hover "…" menu; behaviors per the 4-state table.
- Metrics host = fixed category tabs (+ authored view tabs).
- Note = push drawer (main shrinks; rail fixed).
- Remove `COMPARE_PRESET` and `WorkbenchWorkspace.mode` remnants.
- Shrink header layout popover; split command UI (pane-header split icon +
  right-click Split Right / Split Down; dnd remains but UI teaches commands).
- Wire GraphBoardLayout: derive from Dockview on change, restore on load.
- Remove pane-local visible flag from live paths (effective = membership ∩ global).
- After P1: human user testing checkpoint (scenario list discoverability,
  active/visible independence comprehension, split command discoverability).

### P2 — reading curation + read-only interactive (REDEFINED 2026-06-12)

Premise (product owner): top-page traffic ≈ lessons 50% / official cases 30% /
community 10% / workbench 10%. Reader mode is note-primary; graphs / metrics /
controllers are author-CURATED subsets. So P2's center of gravity is the
curation path: author creates curated views → embeds them in the note →
learners operate them in the reader. Built-in hosts (full Inspector, metrics
category tabs) are workbench-only affordances and do not appear in the reader.

**P2a — authored view management in the Workbench (view management spec above): DONE**

Commits: `bd7f771`, `f49019b`, `cb1cb3f`, `bfd4314`, `f0bc599`, `65eae01`, plus the current P2a-5 cleanup (uncommitted).

- ControllerViewSpec and MetricsViewSpec become LIVE document content:
  rail-dropdown list, shared modal editor
  (create / rename / duplicate / delete; item picker = catalog tree with
  search + category sections), metrics host "+" tab via the same modal frame.
- Custom controller views render against the active scenario (binding
  { slot: "active" }), reusing the shipped ControllerItem renderers
  (slider / buttonGroup, beginner labels — ADR-0006).
- `views` persistence is RE-ENABLED for authored controller/metrics views (the
  dormant-blob objection no longer applies: the views are now live state) and
  always writes an array, including `[]`.
  Load tolerates and ignores graph-kind entries; id remapping already exists.
- Standard controller/metrics views are official seeds: blank sessions seed them;
  legacy `views === undefined` documents seed them plus migrate legacy panels;
  `views` arrays, including empty arrays, are authoritative.
- One-way migration on load: legacy CONTROLS panels with controllerItems and
  METRICS panels become authored views (existing migratePanelsToViewSpecs
  mapping) only for documents without a `views` array; the metrics host then
  lists MetricsViewSpecs (no more panel-backed tabs).

**P2b — note embedding + reader curation: DONE**

Commit: `acf8caa`.

- `view_ref` note block (pane_ref generalization) referencing viewSpecId;
  renders the authored view inline (interactive) in note and reader;
  dangling refs degrade to placeholder.
- Reading presentation consumes authored views only (graphs via reading
  column / pane refs as today; controllers and metrics via view_refs and the
  reading manifest), unifying with exposedControllers where they overlap.

**P2c — read-only interactive (original P2): REMAINING**
- Document-op blocking / runtime-op allowing; Reset to author's state;
  Read|Explore switcher; runtime state carried across the switch
  (integrate ReadingPresenter's own `PreviewController`/`liveInstances` with the
  workbench runtime).

### P3 — binding & publish flow

- `{ slot: "active" }` default, pin opt-in, `initialActiveScenarioId` + author
  snapshot persistence.

### P4 — aspect mechanism

- `GraphViewSpec.aspect` (lock/prefer, letterbox rendering).

## Out of scope / deferred

- Color design entirely; metrics-zone horizontal split (demand-driven);
  selected-graph inspector in right rail (explicitly deferred — graph settings stay
  pane-local); metrics "Differences" tab (demand-driven).

## Quality gates (every phase)

- `npm test` green (vitest; `.claude/**` excluded by config).
- `npm run build` green (tsc + vite).
- Logical, reviewable commits on `ux/workbench-ia-redesign`.
- Lead review before the next phase starts.
