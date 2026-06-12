# ADR-0007 — Workbench IA/UX redesign (main-only Graph Board + fixed hosts)

- Status: **Accepted** (P0 foundation)
- Date: 2026-06-11
- Builds on: [ADR-0003](0003-workbench-layout-engine.md), [ADR-0004](0004-case-workspace-canonical-schema.md), [ADR-0005](0005-case-presentation-modes.md), [ADR-0006](0006-controller-item-types.md)
- Partially supersedes: [ADR-0003](0003-workbench-layout-engine.md) (Dockview scope), [ADR-0004](0004-case-workspace-canonical-schema.md) (save responsibilities and binding), [ADR-0005](0005-case-presentation-modes.md) (Read / Explore shared read-only behavior)

## Context
The Workbench has accumulated several overlapping layout and state concepts: Dockview zones, semantic panels, reading mode, controller item authoring, pane-local instance visibility, and a partially typed `PanelDef.view` layer. That creates unclear ownership:

- layout freedom exists in too many zones;
- graph visibility mixes document config, global scenario visibility, and pane-local flags;
- "Compare" is treated as a mode even though comparison is just a visible-scenario state;
- reading and read-only exploration need one document model but different entrances;
- bindings must be explicit before authored controller and metrics views become durable content.

The redesign keeps the same CaseDocument family but gives each concern one home.

## Decision
Workbench IA has four zones with layout freedom concentrated in the center only:

- **Left:** Note drawer. It is hidden by default, single-pane, no split, and push-based rather than overlay. Opening it shrinks only the main area; the right rail width is fixed.
- **Center:** Graph Board. This is the only Dockview area. It supports free splitting, and the persisted canonical shape is a semantic split tree.
- **Right:** Scenario list above Inspector. The rail has fixed position and width, one pane per host, a simultaneous two-tier stack, no split, and no left/right swap.
- **Bottom:** Metrics host. It has document metrics view tabs. It supports tab switching only.

The header layout popover stays minimal: note open/close, metrics open/close, and metrics span.

**Update 2026-06-12 (owner decision):** the right rail is not an exclusive switcher. It is a simultaneous two-tier stack: a content-sized collapsible scenario list, an always-draggable scenario/inspector sash, and the Inspector below it with the selected controller view chip. The note/main, main/rail, main/metrics, and scenario/inspector sashes are local `WorkbenchLayoutState` sizing only; they do not become case document structure.

**Update 2026-06-12 (header):** the header evolved to inline VS Code-style visibility toggles plus a trimmed customize popover. Arrange UI was removed. One-click split covers composition; `arrangeGraphBoardLayout` remains as an unwired helper for future MCP/LLM/API commands.

### Canonical model split
The document/runtime split is:

```ts
ViewSpec            // what to show: graph / controller / metrics
GraphBoardLayout    // main-area semantic split tree + ratios
WorkspaceViewState  // non-canonical UI arrangement such as active tab and open zones
RuntimeState        // active scenario, global visibility, knob values, transient edits
```

`ViewSpec` is a new schema, not a promotion of `PanelDef.view` or `panelView.ts`.

`GraphBoardLayout` is the canonical Graph Board layout:

```ts
type GraphBoardLayout =
  | { type: "leaf"; graphViewId: string }
  | { type: "split"; direction: "row" | "column"; children: GraphBoardLayout[]; sizes: number[] };
```

Dockview JSON remains non-canonical display state. Presets such as "Arrange as 2x2" are commands that generate this tree; only the resulting tree is saved. Ratios are accepted as the degradation strategy across screen sizes.

### ViewSpec and aspect
Every zone is a view host whose tabs are derived from document ViewSpecs. Standard controller and metrics sets are official factory seeds, not a separate built-in runtime mode. Authored controller and metrics views are saved ViewSpecs and participate in document ops.

**Update 2026-06-12 (owner decision):** "built-in" is just a subset created by official seeding. New blank sessions seed the standard controller view plus four standard metrics views. Legacy documents with `views === undefined` seed those standards and also run legacy panel migration. Documents with `views` as an array, including `[]`, are respected exactly so deleted standards do not resurrect. Saves always write `views`, including an empty array.

Graph view aspect belongs on `GraphViewSpec` and is resolved by the pane content layer:

```ts
GraphViewSpec.aspect?: { ratio: number; fit: "lock" | "prefer" }
```

PV loops use `{ ratio: 1, fit: "lock" }`. Waveforms have no aspect constraint.

### View management and editing surface (update 2026-06-12)

- **Editing surface is a modal**, sharing one frame across graph / metrics /
  controller view editors (the graph pane settings modal idiom). Main-area
  editors are rejected: the Graph Board hosts graphs only, and composition
  editing is a selection task that does not need live charts beside it. Mobile
  degrades to a fullscreen sheet. (This supersedes any earlier wording that
  placed serious view editing in a main-area pane.)
- **No dedicated management screen.** Views are case-scoped document content;
  the rail inspector dropdown IS the list and management surface: controller
  views with rename / duplicate / delete, then "+ new" and "restore standard
  views". The metrics host tab strip plays the same role for metrics views.
  All views are editable document views; the editing chip opens any selected
  view's editor.
- **Catalog growth (assist devices, model refinement) is absorbed by the item
  picker** — search plus device/category sections, mirrored by collapsible
  sections in the standard clinical-parameters view — never by a separate screen. Item
  applicability may later become scenario-dependent (N/A state); the picker
  keys off the parameter catalog registry to allow that.
- **Creation paths:** curate from the Inspector's full catalog (primary),
  duplicate an existing view, or start blank.
- **Deletion** warns when note `view_ref` blocks or the reading column
  reference the view and degrades those references to the established
  dangling-placeholder pattern; deletion is never hard-blocked.
- **Note embedding** generalizes `pane_ref` to `view_ref` (viewSpecId).
  Binding stays VIEW-level — `{ slot: "active" }` by default, explicit pin
  later; per-item binding is rejected.

**Terminology update 2026-06-12:** UI strings say "clinical parameters" (ja
`臨床パラメータ`). `ClinicalKnobs` remains a code-level name.

**Raw parameter update 2026-06-12:** controller authoring also exposes a
researcher-facing raw scalar catalog. Raw parameters are bounded by engine
`HARD_CLAMP` ranges; authors may edit min/max/step within those hard ranges.

### Scenario state
Scenario interaction has four independent states:

| state | meaning | layer |
|---|---|---|
| active | controller edit target; exactly one; initial is first; deletion selects a neighbor | runtime |
| visible | shown on graphs | runtime |
| pinned | a ViewSpec explicitly references a scenario | document |
| selected row | rename/delete/menu/keyboard focus target | UI |

Row click activates only. Eye click toggles visibility only. Double click renames inline. Row menu contains duplicate, delete, pin, and reset. Active-but-hidden is allowed: controllers still target it and graph legends mark it hidden.

### Visibility
Visibility is two-layer:

- **membership:** document-layer scenario x item membership per graph/metrics ViewSpec;
- **global visibility:** runtime eye state in the scenario list.

Effective display is `membership ∩ global visibility`. Pane-local visible flags are removed from the live model in P1. "Hide on this graph only" means edit membership.

### Compare and binding
Compare mode is removed. Comparison is a state produced by the visible scenario combination. `WorkbenchWorkspace.mode` and `COMPARE_PRESET` are cleanup targets. A future metrics "Differences" tab may exist, but it is not named Compare and is not initial scope.

Bindings use:

```ts
type ScenarioBinding = { slot: "active" } | { scenarioId: string };
```

The default is `{ slot: "active" }`. Pinning is explicit with `{ scenarioId }`. Publish does not freeze-resolve active bindings. Reproducibility comes from `initialActiveScenarioId` plus the authored runtime snapshot; "Reset to author's state" restores that snapshot. Pins are only for deliberate fixed lesson steps.

### Reading / Explore / Fork
"Reading mode" replaces "lesson mode" vocabulary. A solo case, note-attached shared case, and lesson are one document spectrum. One reader renderer handles them.

There are two entrances and one exit:

- **Reading mode:** document layout, read-only but interactive;
- **Workbench read-only:** the Workbench itself with document ops blocked;
- **Fork:** exit into an editable copy from anywhere.

At share time, a document with a note opens in Reading by default; one without a note opens in Workbench read-only. Authors may override. When a note exists, the header shows a `Read | Explore` switcher and a visually separated Fork action. Switching carries runtime state; it is not a reload.

Read-only means no document ops can be pushed. Runtime operation remains free. Active changes, sliders, visibility toggles, metrics tab switches, Read/Explore switches, and reset to author's state are allowed. ViewSpec creation/deletion, note edits, scenario CRUD, pane addition, and publish settings are forbidden.

Fork starts from the viewer's current runtime state. To fork the authored state, the viewer resets first and then forks.

### Mobile
Mobile remaps roles to form-factor conventions: scenario chips at the top, graph next, and controller as a bottom sheet. The sheet contains list then inspector as a vertical two-tier flow. Metrics live in sheet tabs or below the graph.

## Consequences
- Main area remains powerful; side/bottom hosts become predictable and teachable.
- Dockview remains useful without becoming canonical case data.
- `PanelDef[]` stays as the existing live P0 surface, while ViewSpec and GraphBoardLayout land as the new document schema for P1+ wiring.
- Graph and metrics visibility become mechanically testable because there is one intersection rule.
- The document can support read-only exploration and authored reset/fork semantics without freezing active bindings.
- Future work must migrate away from pane-local visibility and compare mode rather than layering new behavior on them.

## Implementation phases
- **P0:** ADR, supersede markers, new pure type layer, one-way PanelDef migration, additive CaseDocument fields, save-path preservation, tests, and roadmap rewrite. No runtime UI behavior change.
- **P1:** main-only Dockview, fixed right rail and metrics host, push note drawer, GraphBoardLayout wiring, compare cleanup, and pane-local visibility removal.
- **P2 (redefined 2026-06-12, reader-traffic-first):** P2a authored view management in the Workbench (live ControllerViewSpec / MetricsViewSpec, rail dropdown, shared modal editor, views persistence re-enabled); P2b note `view_ref` + reader curation (reader consumes authored views only); P2c read-only interactive operation blocking, runtime operation allowance, reset to author state, and Read/Explore state carry-over.
- **P3:** binding and publish flow: active-slot default, explicit pinning, `initialActiveScenarioId`, and author snapshot persistence.
- **P4:** aspect rendering at the pane-content layer.

## Alternatives
- **Dockview in every zone:** rejected because layout freedom leaks into hosts that should be fixed and predictable.
- **Dockview JSON as canonical layout:** rejected for the same reasons as ADR-0003/0004: it is brittle for mobile, API/LLM workflows, and migration.
- **Promote `PanelDef.view`:** rejected because it is a typed skeleton over the legacy panel config and not the new ViewSpec schema.
- **Keep pane-local visibility:** rejected because it creates a third visibility layer with unclear UX semantics.
- **Keep Compare as a mode:** rejected because comparison is already represented by scenario visibility.
- **Freeze active bindings on publish:** rejected because it makes active-following controllers surprising and duplicates the role of explicit pins.
