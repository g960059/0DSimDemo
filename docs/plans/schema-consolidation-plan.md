# Schema Consolidation Implementation Plan

## 1. **Exact Target Types**

In `types.ts`, keep `WorkbenchZoneId` and `DockviewViewState`; they are still used by `PanelDef.zone` and `WorkbenchDockview`.

Final workspace types:

```ts
export type WorkbenchMetricsSpan = "main" | "full";

export interface WorkbenchNoteHostState {
  open: boolean;
}

export interface WorkbenchRightRailHostState {
  open: boolean;
  scenarioListCollapsed?: boolean;
}

export interface WorkbenchMetricsHostState {
  open: boolean;
  span?: WorkbenchMetricsSpan;
}

export interface WorkbenchMainHostState {
  dockviewState?: DockviewViewState;
}

export interface WorkbenchWorkspaceHosts {
  note: WorkbenchNoteHostState;
  rightRail: WorkbenchRightRailHostState;
  metrics: WorkbenchMetricsHostState;
  main: WorkbenchMainHostState;
}

export interface WorkbenchWorkspace {
  schemaVersion: 2;
  hosts: WorkbenchWorkspaceHosts;
  learnerLocked?: boolean;
}
```

Final `ScenarioBinding` in `features/workbench/viewSpec.ts`:

```ts
export type ScenarioBinding =
  | { kind: "active" }
  | { kind: "scenario"; scenarioId: string };
```

Delete from `types.ts`: `WorkbenchRegionId`, `WorkbenchRegionPosition`, `WorkbenchRegionVisibility`, `WorkbenchSplitMode`, `WorkbenchRegionState`, and all `regions`, `position`, `viewState`, `viewStates` workspace fields.

Delete from `WorkbenchLayoutState`: `controlsSide`. Keep local sash/state fields: `controlsWidth`, `caseRailWidth`, `outputHeight`, `scenarioListMaxRatio`, `scenarioListHeightPx`, etc.

## 2. **Ordered Change List, File By File**

`caseDoc.ts`

- Bump `WORKSPACE_SCHEMA_VERSION` to `2`.
- Remove `WorkbenchRegionId` / `WorkbenchRegionPosition` imports.
- Delete `mergeRegionState`.
- Delete `normalizeWorkspaceForAdr0007`.
- Rewrite `defaultWorkspaceForPanels(panels)` to return host state:
  - `hosts.note.open = panelsForRole("note").length > 0`
  - `hosts.metrics.open = panelsForRole("output").length > 0`
  - `hosts.rightRail.open = scenarioPanelIds.length > 0 || controlPanelIds.length > 0`
  - `hosts.main = {}`
  - `learnerLocked: true`
- Add a small workspace guard, e.g. `isWorkbenchWorkspaceV2(value): value is WorkbenchWorkspace`.
- Rewrite `workspaceForPanels(panels, previous?)`:
  - If `previous?.schemaVersion !== 2` or no `hosts`, treat as absent and return defaults.
  - Merge only valid host state.
  - Preserve `learnerLocked`.
  - Preserve `hosts.main.dockviewState`.
  - Clamp host opens back to panel-derived defaults when the corresponding host has no panels, matching current stale-region cleanup behavior.
- Rewrite `simInstancesToCaseDocument` to always write `workspace: workspaceForPanels(panels, opts.workspace)` instead of passing `opts.workspace` through verbatim.

`casePersist.ts`

- In `parseCaseDocument`, after basic document validation, treat invalid workspace as non-canonical:
  - If `workspace` exists but is not schemaVersion `2`, delete it.
  - Do not reject the whole case document.
- Keep `CASE_SCHEMA_VERSION` behavior unchanged.

`features/workbench/workbenchDefaults.ts`

- Remove imports of `noteOpenFromWorkspace`, `metricsOpenFromWorkspace`, and `rightRailVisibleFromWorkspace`.
- Remove `controlsSide` from `DEFAULT_WORKBENCH_LAYOUT`.
- Rewrite `layoutStateFromWorkspace` with direct host reads:
  - `noteOpen: workspace?.hosts.note.open ?? false`
  - `metricsOpen: workspace?.hosts.metrics.open ?? true`
  - `rightRailVisible: workspace?.hosts.rightRail.open ?? true`
  - `scenarioListCollapsed: workspace?.hosts.rightRail.scenarioListCollapsed ?? false`
  - `metricsSpan: workspace?.hosts.metrics.span ?? "main"`

`features/workbench/p1aStructuralHosts.ts`

- Remove `WorkbenchRegionState` import.
- Delete `visibleFromRegion`.
- Delete `noteOpenFromWorkspace`, `metricsOpenFromWorkspace`, and `rightRailVisibleFromWorkspace` unless another caller remains.
- Delete `mainDockviewViewStatesOnly`; the type now guarantees only `hosts.main.dockviewState` can be persisted.
- Keep graph/metrics helpers such as `graphPanelsOnly`, `effectiveGlobalConfig`, `metricsHostTabs`.

`features/workbench/hooks/useWorkbenchPanels.ts`

- Remove `mainDockviewViewStatesOnly` import.
- In `setWorkbenchLayout`, replace region writes with host writes:
  - `noteOpen -> hosts.note.open`
  - `metricsOpen -> hosts.metrics.open`
  - `metricsSpan -> hosts.metrics.span`
  - `rightRailVisible -> hosts.rightRail.open`
  - `scenarioListCollapsed -> hosts.rightRail.scenarioListCollapsed`
- Do not persist `scenarioListHeightPx`, ratios, widths, or heights.
- Rewrite `updateDockviewViewState`:
  - Ignore non-`main` zones.
  - Write `hosts.main.dockviewState = viewState`.
- Rewrite `replacePanelState` to use `workspaceForPanels(next.panels, next.workspace)` directly.
- Rewrite `resetWorkbenchLayout`:
  - Reset local layout to `DEFAULT_WORKBENCH_LAYOUT`.
  - Rebuild host state through `workspaceForPanels`.
  - Clear `hosts.main.dockviewState`.

`features/workbench/hooks/useWorkbenchPersistence.ts`

- Remove `mainDockviewViewStatesOnly` import.
- In `buildCurrentDoc`, write:
  - `workspace: workspaceForPanels(panels.panels, panels.workspace)`
- Keep graphBoardLayout, views, notes, reading, and `initialActiveScenarioId` behavior unchanged.
- In load path, continue passing `localized.workspace` to `replacePanelState`; `workspaceForPanels` handles absent/old-shaped workspace.

`features/workbench/panelModel.ts`

- Remove `mainDockviewViewStatesOnly` import.
- `workspaceAfterPanelsChanged` becomes `workspaceForPanels(panels, workspace)`.

`features/workbench/WorkbenchRoute.tsx`

- Replace `dockviewViewStates={panels.workspace.viewStates}` with a singular main state prop:
  - `mainDockviewViewState={panels.workspace.hosts.main.dockviewState}`

`components/workbench/PanelGrid.tsx`

- Delete `WorkbenchControlsSide`.
- Delete `controlsSide` from `WorkbenchLayoutState`.
- Replace prop `dockviewViewStates?: Partial<Record<WorkbenchZoneId, DockviewViewState>>` with `mainDockviewViewState?: DockviewViewState`.
- Pass `mainDockviewViewState` to the main `ZoneShell`.
- Leave metrics span and rail visibility consumers intact; their persistence is handled by `useWorkbenchPanels`.

`caseCloud.ts`

- No structural logic change beyond the version bump: `workspaceSchemaVersion` will now serialize as `2` via `WORKSPACE_SCHEMA_VERSION`.
- Update tests expecting `1`.

`docs/adr/0007-workbench-ia-redesign.md`

- Replace workspace schema text with host-based schema.
- Replace binding examples with `{ kind: "active" }` / `{ kind: "scenario"; scenarioId }`.
- Add the D4 note: reproducibility stays in document scenario state, `initialActiveScenarioId`, and visibility; no publication snapshot envelope.

## 3. **Binding Migration**

Touch every `{ slot: "active" } | { scenarioId }` site.

`features/workbench/viewSpec.ts`

- Change `ScenarioBinding`.
- `controllerViewSpecFromPanel` uses `binding: { kind: "active" }`.
- `remapViewSpecIds`:
  - If `view.binding.kind === "scenario"`, remap `scenarioId`.
  - If `kind === "active"`, preserve as-is.

`features/workbench/controllerBinding.ts`

- Resolve pinned target only when `binding?.kind === "scenario"`.
- Otherwise use active target fallback.

`features/workbench/authoredViews.ts`

- `createControllerViewSpec` uses `{ kind: "active" }`.
- `standardControllerView` inherits that shape.

Fixtures/tests/docs

- Replace all test fixtures in `panelGrid.test.ts`, `controllerBinding.test.ts`, `workbenchViewSpec.test.ts`, `noteViewRefs.test.ts`, `readingPresenter*.test.ts`, and `engine/__tests__/caseDoc.test.ts`.
- Update `officialCases.ts` afterload controller view.
- Update `officialAfterloadCase.test.ts` binding validation.
- Update ADR-0007 binding prose.

## 4. **Content Regeneration**

`officialCases.ts`

- Import `defaultWorkspaceForPanels`.
- In `makeCase`, compute `const panels = buildPanels(instanceIds)` once.
- Return `panels` and `workspace: defaultWorkspaceForPanels(panels)` for every case.
- Reuse the same `panels` when building `i18n.en.panels`.
- Update the afterload dogfood controller binding to `{ kind: "active" }`.
- Ensure all official cases emit:
  - `workspace.schemaVersion === 2`
  - `workspace.hosts.note.open === true`
  - `workspace.hosts.metrics.open === true`
  - `workspace.hosts.rightRail.open === true`
  - no `regions`, `viewState`, or `viewStates`

Dogfood fixture

- In the current tree, the dogfood fixture appears to be `afterload-acute-hypertension` in `officialCases.ts`.
- If reviewers identify a separate fixture file, apply the same host workspace and `{ kind: ... }` binding updates there.

## 5. **Test Plan**

`__tests__/caseWorkspace.test.ts`

- Remove `normalizeWorkspaceForAdr0007` import/tests.
- Assert `defaultWorkspaceForPanels` returns schema `2`, `hosts`, and no `regions`.
- Repoint stale panel cleanup assertions to host `open` flags.
- Add old-shaped workspace test: schemaVersion `1` / `regions` input returns default v2 workspace without crashing.
- Repoint Dockview preservation to `hosts.main.dockviewState`.

`__tests__/workbenchDefaults.test.ts`

- Build test workspaces through `hosts`.
- Assert note/metrics/rightRail flags round-trip.
- Add assertions for `metrics.span: "full"` and `rightRail.scenarioListCollapsed: true`.
- Replace compact/missing-region tests with `layoutStateFromWorkspace(undefined)` defaults.

`__tests__/panelGrid.test.ts`

- Remove `controlsSide` from layout fixtures.
- Rename `dockviewViewStates` prop fixture to `mainDockviewViewState`.
- Update controller binding fixtures to `{ kind: "active" }`.

`__tests__/controllerBinding.test.ts`

- Active case: `{ kind: "active" }`.
- Pinned case: `{ kind: "scenario", scenarioId: "a" }`.
- Missing pinned scenario falls back to active.

`__tests__/officialAfterloadCase.test.ts`

- Assert afterload controller binding is `{ kind: "active" }`.
- Assert `doc.workspace` is schema `2` host state.
- In internal reference validation, check pinned bindings only when `view.binding.kind === "scenario"`.
- Round-trip assertion adds `workspace`.

D5 golden idempotence test

- Add to `officialAfterloadCase.test.ts` or a new `caseWorkspaceRoundtrip.test.ts`.
- Construct a new-format doc from the dogfood case plus:
  - `workspace.hosts.rightRail.scenarioListCollapsed: true`
  - `workspace.hosts.metrics.span: "full"`
  - fixed `hosts.main.dockviewState`
  - a controller binding `{ kind: "scenario", scenarioId: "2" }`
  - existing `views`, `graphBoardLayout`, `reading`, note `view_ref`, and `initialActiveScenarioId`
- Run `load -> save -> load -> save` via `caseDocumentToSimInstances` and `simInstancesToCaseDocument`.
- Pick canonical parts: `views`, `graphBoardLayout`, `initialActiveScenarioId`, `reading`, `notes`, `workspace`.
- Assert `JSON.stringify(pickedOnce, null, 2) === JSON.stringify(pickedTwice, null, 2)`.

Other tests to repoint

- `engine/__tests__/caseDoc.test.ts`: binding shape.
- `__tests__/workbenchViewSpec.test.ts`: migrated controller binding.
- `__tests__/noteViewRefs.test.ts`, `readingPresenter*.test.ts`: binding fixtures.
- `__tests__/contentI18n.test.ts`: expected workspace shape.
- `__tests__/workbenchPersistence.test.ts`: workspace remains schema `2`.
- `__tests__/workbenchP1aStructuralHosts.test.ts`: remove obsolete `viewStates` tests.
- `__tests__/caseCloud.test.ts` and `firestoreRules.emulator.test.ts`: `workspaceSchemaVersion: 2`.
- `engine/__tests__/officialCases.test.ts`: optionally assert every official case has v2 workspace.

## 6. **Risk/Sequencing**

Safest commit order:

1. Types and binding migration: `types.ts`, `viewSpec.ts`, `controllerBinding.ts`, `authoredViews.ts`, binding-only tests.
2. Workspace core: `caseDoc.ts`, `casePersist.ts`, `workbenchDefaults.ts`, `p1aStructuralHosts.ts`.
3. Runtime consumers: `useWorkbenchPanels.ts`, `useWorkbenchPersistence.ts`, `panelModel.ts`, `WorkbenchRoute.tsx`, `PanelGrid.tsx`.
4. Content regeneration: `officialCases.ts` and dogfood fixture.
5. Test repointing plus D5 golden.
6. ADR update.
7. Verification: `npx tsc --noEmit`, `npm test`, `npm run build`.

Non-canonical workspace must be rebuilt, not read, when:

- workspace is absent;
- workspace has `schemaVersion !== 2`;
- workspace contains old `regions`, `position`, `viewState`, or `viewStates`;
- a host has no backing panels after panel deletion.

## 7. **Open Questions For Plan Review**

1. Optional defaults: should canonical saves omit `metrics.span: "main"` and `scenarioListCollapsed: false`, or always write them? Plan assumes omit-defaults and preserve non-defaults.

2. Right rail default derivation: should `rightRail.open` default true when either `SCENARIOS` or `CONTROLS` panels exist, or only when `CONTROLS` exists? Plan assumes either right-rail panel opens the rail.

3. Dogfood fixture path: current tree shows the dogfood case as `afterload-acute-hypertension` in `officialCases.ts`; if there is a separate fixture file, reviewers should name it before coding.

---

## Plan-review resolutions (BINDING — supersede §7; from opus 4.8 + codex 5.5 + lead)

Both reviewers returned REVISE; the union of findings is now binding. The 3 open
questions are CLOSED:

- **Q1 — omit-defaults, WITH explicit symmetry.** Save (`defaultWorkspaceForPanels` /
  `workspaceForPanels`) MUST drop `hosts.metrics.span` when it equals `"main"` and drop
  `hosts.rightRail.scenarioListCollapsed` when `false` — never emit the default. Load
  supplies `?? "main"` / `?? false`. D5 must include a toggle-to-`"full"`-then-back-to-
  `"main"` case and assert the resaved doc has NO `span` key (proves idempotent strip).
- **Q2 — `hosts.rightRail.open` defaults `true` UNCONDITIONALLY.** Remove the
  `scenarioPanelIds.length>0 || controlPanelIds.length>0` proxy in
  `defaultWorkspaceForPanels`; the rail is a first-class host, not a panel-existence
  proxy (D1). Same for any stale-host cleanup.
- **Q3 — fixture lives in `officialCases.ts`** as `afterload-acute-hypertension`. No
  separate fixture file. Apply the v2-host-workspace + `{kind:...}` regeneration there.

Required revisions to the plan before/while coding:

1. **Total `controlsSide` + region removal.** Add explicitly: `useWorkbenchPanels.ts:343`
   (`position: DEFAULT_WORKBENCH_LAYOUT.controlsSide`) and the `prev.regions.control/note/
   output` reads in `resetWorkbenchLayout` (≈334-348). After `controlsSide` leaves
   `DEFAULT_WORKBENCH_LAYOUT`, these are compile errors unless rewritten — the rewrite
   must be total.
2. **`setWorkbenchLayout` write trigger.** The existing region-write block
   (`useWorkbenchPanels.ts:~62-91`) persists only on `workspaceVisibilityChanged`. The
   NET-NEW `metrics.span → hosts.metrics.span` and `scenarioListCollapsed →
   hosts.rightRail.scenarioListCollapsed` persistence must ALSO trigger on span-only /
   collapsed-only changes (not gated solely on visibility change), or a span/collapse
   toggle won't save.
3. **Omit-defaults strip stated in the write helpers** (per Q1) so the document never
   contains `span:"main"` / `scenarioListCollapsed:false`.
4. **Fix the D5 harness.** Do NOT route the golden through `caseDocumentToSimInstances`
   (caseDoc.ts:444-456 maps ONLY `doc.instances` — it drops workspace/views/reading/
   graphBoardLayout, so the assertions would pass vacuously). Instead exercise the real
   round-trip: build via `simInstancesToCaseDocument` with explicit `workspace` (v2 host)
   / `views` / `graphBoardLayout` / `reading` / `notes` opts, load via the
   `workspaceForPanels` + `replacePanelState` pass-throughs, and assert byte-stability of
   workspace host state, views, graphBoardLayout, initialActiveScenarioId, reading, and
   note view_ref viewIds across the SECOND round-trip.
5. **Binding test consumers.** Add `__tests__/workbenchAuthoredViews.test.ts`
   (`createControllerViewSpec`/`standardControllerView`/`standardAuthoredViews`) to the
   `{kind}` migration list and assert seeded bindings are `{ kind: "active" }`. (opus
   confirmed all 11 binding sites otherwise covered.)
6. **Dual D2 gate explicit.** Rebuild-default-on-bad-workspace must hold on BOTH the
   file-import path (`parseCaseDocument`) AND the in-app path
   (`workspaceForPanels(next.panels, next.workspace)` via `replacePanelState`): a
   v1/`regions` blob arriving either way rebuilds default rather than throwing.
7. **Build-safe sequencing.** Workspace TYPES + their core/runtime consumers
   (`useWorkbenchPanels`, `workbenchDefaults`, `panelModel`, `useWorkbenchPersistence`,
   `PanelGrid`, `WorkbenchRoute`) land in ONE buildable commit; binding `{kind}` migration
   + all callsites/tests land in one buildable commit. `tsc` must be green at every commit
   boundary.
8. **Minor:** repoint `firestoreRules.emulator.test.ts` inline `workspace:{viewState}` /
   `workspaceSchemaVersion:1` fixture to v2; `makeCase` currently emits NO `workspace` —
   adding `workspace: defaultWorkspaceForPanels(panels)` is net-new content, and
   `contentI18n.test.ts` (round-trips `workspaceForPanels`) must be re-pointed to the v2
   host shape, NOT weakened.
