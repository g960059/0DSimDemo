# Workbench IA/UX Redesign — Implementation Plan

Derived from [ADR-0007](adr/0007-workbench-ia-redesign.md) and the active work order in [docs/plans/workbench-ia-redesign-plan.md](plans/workbench-ia-redesign-plan.md).

Status: P0 foundation in progress. Color design is out of scope.

## Current Code Structure

The Workbench is already split across route, hooks, model helpers, and presentation components:

- `features/workbench/WorkbenchRoute.tsx` composes the Workbench feature.
- `features/workbench/hooks/useWorkbenchScene.ts` owns scenarios, case metadata, active scenario, and retained document metadata.
- `features/workbench/hooks/useWorkbenchPanels.ts` owns `PanelDef[]`, notes, workspace state, and panel mutations.
- `features/workbench/hooks/useWorkbenchPersistence.ts` owns import/export, cloud save, case loading, id remapping, and `simInstancesToCaseDocument` save construction.
- `features/workbench/hooks/useLessonAuthoring.ts` owns legacy lesson draft/publish flow during the transition.
- `features/workbench/panelModel.ts` and `features/workbench/workbenchDefaults.ts` hold pure-ish panel/default helpers.
- `features/workbench/viewSpec.ts` is the P0 pure IA model layer for `ViewSpec`, `GraphBoardLayout`, runtime/workspace state definitions, visibility helpers, validation, normalization, migration, and remapping.
- `components/workbench/PanelGrid.tsx` is the current desktop layout shell.
- `components/workbench/WorkbenchDockview.tsx` wraps Dockview integration.
- `components/workbench/WorkbenchHeader.tsx`, `WorkbenchSidePanel.tsx`, `WorkbenchMobile.tsx`, `ScenarioPane.tsx`, `ControllerItemsBuilder.tsx`, and `renderPaneBody.tsx` are the present Workbench UI components.

## Invariants

- No P0 runtime UI behavior changes. P0 is types, docs, migration helpers, save-path preservation, and tests only.
- `PanelDef[]` remains the live UI surface until P1 wiring.
- `ViewSpec` is a new schema and must not be treated as a promotion of `PanelDef.view`.
- Dockview JSON is not canonical. The future canonical main-area layout is `GraphBoardLayout`.
- Effective graph display is `membership ∩ globalVisibility`.
- Compare is state, not a mode.

## P0 — ADR + Model Groundwork

Deliverables:

- Add ADR-0007 and mark ADR-0003, ADR-0004, and ADR-0005 as partially superseded.
- Fix `docs/adr/README.md` so ADR-0005, ADR-0006, and ADR-0007 are indexed.
- Add the pure type layer in `features/workbench/viewSpec.ts`:
  - `ViewSpec` union for graph, controller, and metrics views;
  - `ScenarioBinding`;
  - `GraphBoardLayout` split tree;
  - validation and normalization helpers;
  - `WorkspaceViewState` and `RuntimeState`;
  - visibility intersection helpers;
  - one-way `PanelDef[]` migration.
- Extend `CaseDocument` with optional `views`, `graphBoardLayout`, and `initialActiveScenarioId`.
- Preserve `reading`, `exposedControllers`, and P0 fields through `simInstancesToCaseDocument` rebuilds and Workbench retained-document save/export.
- Rewrite this implementation plan to match the current feature structure.
- Add focused Vitest coverage for migration, layout invariants, visibility, remapping, and CaseDocument round-trip.

Quality gate: `npm test` and `npm run build`.

## P1 — Main-Only Dockview

Goal: make the center Graph Board the only Dockview while keeping the surrounding hosts fixed.

Work:

- Refactor `components/workbench/PanelGrid.tsx` so Dockview exists only in the main Graph Board.
- Keep `components/workbench/WorkbenchDockview.tsx` responsible for Dockview mechanics and state extraction.
- Replace side/bottom Dockview zones with fixed hosts:
  - right rail: scenario list plus inspector switcher;
  - bottom: metrics category/authored-view tabs;
  - left: push note drawer.
- Wire `GraphBoardLayout` restore/derive behavior.
- Remove pane-local visible flags from live graph display paths and use `membership ∩ globalVisibility`.
- Remove `COMPARE_PRESET` and `WorkbenchWorkspace.mode` compare remnants.
- Reduce header layout controls to note toggle, metrics toggle, and arrange commands.

Checkpoint: human user testing for scenario-list discoverability, active/visible independence, and split-command discoverability.

## P2 — Read-Only Interactive

Goal: support Reading and Workbench read-only entrances with document ops blocked and runtime ops allowed.

Work:

- Centralize document-op blocking so read-only prevents ViewSpec edits, note edits, scenario CRUD, pane add/remove, and publish settings.
- Keep runtime operations free: active scenario, sliders, visibility, metrics tab, Read/Explore switch, and reset.
- Carry runtime state across Read/Explore switches.
- Integrate ReadingPresenter runtime with the Workbench simulation/runtime state instead of reloading on switch.
- Add persistent "changes won't be saved" affordance plus Fork.

## P3 — Binding + Publish Flow

Goal: make active-slot binding and explicit pins authorable and reproducible.

Work:

- Default controller and authored view bindings to `{ slot: "active" }`.
- Add explicit scenario pinning UI and persistence with `{ scenarioId }`.
- Persist `initialActiveScenarioId` and the author runtime snapshot for Reset to author's state.
- Ensure publish does not freeze-resolve active bindings.
- Fork from the viewer's current runtime state.

## P4 — Aspect Mechanism

Goal: render graph aspect constraints at the pane-content layer.

Work:

- Apply `GraphViewSpec.aspect` in graph pane content.
- Lock PV loops to square inside the cell with centered letterboxing.
- Let waveform views fill the cell without aspect constraint.
- Verify note drawer push, display size changes, and split-ratio changes do not distort locked graph content.

## Deferred

- Color design.
- Metrics-zone horizontal split.
- Selected-graph inspector in the right rail.
- Metrics "Differences" tab.
- Retiring legacy `PanelDef[]` live rendering before P1+ migration gates.
