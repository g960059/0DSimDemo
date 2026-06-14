# P3b Implementation Plan

## Verified Code Facts

- A second simulation runtime is feasible: `useWorkbenchSimulation` creates an instance-local `PreviewController` via `controllerRef.current ??= new PreviewController()` and owns its lifecycle ([useWorkbenchSimulation.ts](/Users/hirakawa/ghq/github.com/g960059/0DSimDemo-publish-review/features/workbench/hooks/useWorkbenchSimulation.ts:7), [useWorkbenchSimulation.ts](/Users/hirakawa/ghq/github.com/g960059/0DSimDemo-publish-review/features/workbench/hooks/useWorkbenchSimulation.ts:17), [useWorkbenchSimulation.ts](/Users/hirakawa/ghq/github.com/g960059/0DSimDemo-publish-review/features/workbench/hooks/useWorkbenchSimulation.ts:35)). `PreviewController` constructs its own worker ([previewController.ts](/Users/hirakawa/ghq/github.com/g960059/0DSimDemo-publish-review/engine/previewController.ts:353), [previewController.ts](/Users/hirakawa/ghq/github.com/g960059/0DSimDemo-publish-review/engine/previewController.ts:366)) and `stop()` terminates preview and steady workers ([previewController.ts](/Users/hirakawa/ghq/github.com/g960059/0DSimDemo-publish-review/engine/previewController.ts:1183)).
- `CaseDocument` already carries `status`, `visibility`, `defaultEntry`, `instances`, `panels`, `workspace`, `graphBoardLayout`, `notes`, and `reading` ([caseDoc.ts](/Users/hirakawa/ghq/github.com/g960059/0DSimDemo-publish-review/caseDoc.ts:137)). `caseDocumentToSimInstances` is the document-to-runtime seed ([caseDoc.ts](/Users/hirakawa/ghq/github.com/g960059/0DSimDemo-publish-review/caseDoc.ts:412)).
- `PanelGrid` has an explicit learner mode and a complete prop surface at [PanelGrid.tsx](/Users/hirakawa/ghq/github.com/g960059/0DSimDemo-publish-review/components/workbench/PanelGrid.tsx:72). Learner mode drives `isReadOnly` ([PanelGrid.tsx](/Users/hirakawa/ghq/github.com/g960059/0DSimDemo-publish-review/components/workbench/PanelGrid.tsx:2235)), disables config chrome ([PanelGrid.tsx](/Users/hirakawa/ghq/github.com/g960059/0DSimDemo-publish-review/components/workbench/PanelGrid.tsx:2331)), suppresses view/edit modals ([PanelGrid.tsx](/Users/hirakawa/ghq/github.com/g960059/0DSimDemo-publish-review/components/workbench/PanelGrid.tsx:2363)), scenario add/edit/delete ([PanelGrid.tsx](/Users/hirakawa/ghq/github.com/g960059/0DSimDemo-publish-review/components/workbench/PanelGrid.tsx:2760)), and Dockview edit/DnD actions ([WorkbenchDockview.tsx](/Users/hirakawa/ghq/github.com/g960059/0DSimDemo-publish-review/components/workbench/WorkbenchDockview.tsx:371), [WorkbenchDockview.tsx](/Users/hirakawa/ghq/github.com/g960059/0DSimDemo-publish-review/components/workbench/WorkbenchDockview.tsx:1195)).
- `ReadingPresenter` already accepts a runtime object with preview-scoped instances, physics refs, health, active id, and update handlers ([ReadingPresenter.tsx](/Users/hirakawa/ghq/github.com/g960059/0DSimDemo-publish-review/components/reading/ReadingPresenter.tsx:48)).
- `WorkbenchRoute` composes the author scene, panels, simulation, `ReadingPresenter`, `WorkbenchHeader`, and `PanelGrid` today ([WorkbenchRoute.tsx](/Users/hirakawa/ghq/github.com/g960059/0DSimDemo-publish-review/features/workbench/WorkbenchRoute.tsx:40), [WorkbenchRoute.tsx](/Users/hirakawa/ghq/github.com/g960059/0DSimDemo-publish-review/features/workbench/WorkbenchRoute.tsx:144), [WorkbenchRoute.tsx](/Users/hirakawa/ghq/github.com/g960059/0DSimDemo-publish-review/features/workbench/WorkbenchRoute.tsx:179)).

## File-by-File Changes

| Path | Change | Decision |
|---|---|---|
| `components/workbench/PublishStatusBadge.tsx` | New badge component plus exported pure mapper. `draft`/missing status maps to neutral `border-wb-line bg-wb-strip text-wb-subtle`; published `unlisted`/`public` maps to accent `border-wb-accent/40 bg-wb-accent-soft text-wb-accent`. Click calls `onClick`; title/aria uses `publish.badge.tooltip`. | D1 |
| `components/workbench/WorkbenchHeader.tsx` | Add props `publishStatus?: CaseStatus`, `publishVisibility?: CaseVisibility`, `onOpenPublishDialog?: () => void`. Render `PublishStatusBadge` only in the sandbox branch/action row, left of the Save primary action, never when `mode === "learner"` ([WorkbenchHeader.tsx](/Users/hirakawa/ghq/github.com/g960059/0DSimDemo-publish-review/components/workbench/WorkbenchHeader.tsx:110), [WorkbenchHeader.tsx](/Users/hirakawa/ghq/github.com/g960059/0DSimDemo-publish-review/components/workbench/WorkbenchHeader.tsx:283)). Save behavior remains unchanged. | D1 |
| `features/workbench/hooks/useWorkbenchScene.ts` | Add `currentCaseStatus`/`currentCaseVisibility` display state near the existing loaded-doc fields ([useWorkbenchScene.ts](/Users/hirakawa/ghq/github.com/g960059/0DSimDemo-publish-review/features/workbench/hooks/useWorkbenchScene.ts:131)). Set only in `replaceSceneFromDoc` from `doc.status`/`doc.visibility` ([useWorkbenchScene.ts](/Users/hirakawa/ghq/github.com/g960059/0DSimDemo-publish-review/features/workbench/hooks/useWorkbenchScene.ts:358)) and return them ([useWorkbenchScene.ts](/Users/hirakawa/ghq/github.com/g960059/0DSimDemo-publish-review/features/workbench/hooks/useWorkbenchScene.ts:413)). No save/write path in P3b. | D5 |
| `features/workbench/publish/publishDialogState.ts` | New pure helper module. Exports `PublishDialogDraft`, `deriveInitialPublishDialogDraft(doc,{status,visibility})`, and `derivePublishDialogState(baseDoc,draft)`. It defaults visibility to current published `public`/`unlisted`, otherwise `unlisted`; defaults entry to `doc.defaultEntry ?? derivePublishDefaultEntry(doc)`; disables Read when `!canUseReadExplore`; builds `reviewDoc = applyPublishDraft(baseDoc,{status:"published",visibility,defaultEntry})`; runs `validatePublishableCase(reviewDoc)`; returns blocker/warning groups and `reviewEnabled: true`. | D2, D6 |
| `features/workbench/publish/PublishIssueList.tsx` | New presentational issue list. Groups blockers under `publish.dialog.cannotPublish` with `AlertCircle` and warning rows under `publish.dialog.warnings` with warning token classes. Labels use `t(issue.code)` from existing P3a keys ([casePublish.ts](/Users/hirakawa/ghq/github.com/g960059/0DSimDemo-publish-review/features/workbench/casePublish.ts:29)); paths render muted/small. Empty state shows `publish.dialog.ready`. | D2 |
| `features/workbench/publish/PublishDialog.tsx` | New modal mirroring the meta modal structure and tokens ([WorkbenchHeader.tsx](/Users/hirakawa/ghq/github.com/g960059/0DSimDemo-publish-review/components/workbench/WorkbenchHeader.tsx:298)). Props: `isOpen`, `buildCurrentDoc`, `currentStatus`, `currentVisibility`, `onCancel`, `onReview(reviewDoc, entry)`, optional future `onConfirmDraft` seam not wired in P3b. Local draft drives segmented visibility and opening view. Review CTA is always enabled and never calls `saveCase`. | D2 |
| `features/workbench/publish/usePreviewRuntime.ts` | New isolated runtime hook. Seeds cloned preview instances from `caseDocumentToSimInstances(doc)` and active id via `resolveAuthorActiveInstanceId` ([caseDoc.ts](/Users/hirakawa/ghq/github.com/g960059/0DSimDemo-publish-review/caseDoc.ts:412), [useWorkbenchScene.ts](/Users/hirakawa/ghq/github.com/g960059/0DSimDemo-publish-review/features/workbench/hooks/useWorkbenchScene.ts:83)). Instantiates its own `useWorkbenchSimulation(previewInstances, noop)`. Local updaters mirror author runtime updaters but never call `markDocumentEdited` or author refs. Exports pure helper functions for isolation tests. | D3, D6 |
| `features/workbench/publish/PublishReviewOverlay.tsx` | New full-surface overlay. Calls `usePreviewRuntime(reviewDoc)`, builds preview-scoped panels from `reviewDoc`, renders overlay header with Read/Explore, Reset, Exit, and body with `ReadingPresenter` or `PanelGrid mode="learner"`. Exit unmounts overlay only. | D4 |
| `features/workbench/hooks/useWorkbenchPanels.ts` | Prefer no behavioral change. Reuse existing independent hook instance in overlay with `headerMode: "learner"` and `markUserEdited: noop`; initialize/reset via `replacePanelState`, which already builds layout from doc workspace ([useWorkbenchPanels.ts](/Users/hirakawa/ghq/github.com/g960059/0DSimDemo-publish-review/features/workbench/hooks/useWorkbenchPanels.ts:122)). If first-paint flicker appears, add an optional `initialPanelState` initializer without changing author call sites. | D4 |
| `components/reading/ReadingPresenter.tsx` | Add minimal optional `chrome.hideHeader?: boolean` so overlay can supply its own header instead of nesting the built-in back/fork header ([ReadingPresenter.tsx](/Users/hirakawa/ghq/github.com/g960059/0DSimDemo-publish-review/components/reading/ReadingPresenter.tsx:64), [ReadingPresenter.tsx](/Users/hirakawa/ghq/github.com/g960059/0DSimDemo-publish-review/components/reading/ReadingPresenter.tsx:113)). Default behavior unchanged. | D4 |
| `features/workbench/WorkbenchRoute.tsx` | Add dialog open state and review overlay state `{reviewDoc, entry}`. Pass badge props to `WorkbenchHeader`. Mount `PublishDialog` in sandbox mode. `onReview` closes dialog and sets overlay state. Mount `PublishReviewOverlay` above the untouched author workbench inside the existing themed root ([WorkbenchRoute.tsx](/Users/hirakawa/ghq/github.com/g960059/0DSimDemo-publish-review/features/workbench/WorkbenchRoute.tsx:103)). Do not call `saveCase`, `saveCurrentCaseToCloud`, snapshot, restore, or mutate live scene. | D1-D4 |
| `index.css` | Add missing warning and danger-soft tokens to dark and light themes near existing token declarations ([index.css](/Users/hirakawa/ghq/github.com/g960059/0DSimDemo-publish-review/index.css:17), [index.css](/Users/hirakawa/ghq/github.com/g960059/0DSimDemo-publish-review/index.css:47), [index.css](/Users/hirakawa/ghq/github.com/g960059/0DSimDemo-publish-review/index.css:68)). | D2, D4 |
| `locales/en/translation.json`, `locales/ja/translation.json` | Add dialog, badge, issue group, and overlay keys under existing `publish` object ([en](/Users/hirakawa/ghq/github.com/g960059/0DSimDemo-publish-review/locales/en/translation.json:776), [ja](/Users/hirakawa/ghq/github.com/g960059/0DSimDemo-publish-review/locales/ja/translation.json:776)). `i18n.ts` needs no registration change because resources already load both files ([i18n.ts](/Users/hirakawa/ghq/github.com/g960059/0DSimDemo-publish-review/i18n.ts:19)). | D2, D4, D6 |
| `docs/adr/0007-workbench-ia-redesign.md` | Update P3 bullet to record P3b dialog, isolated-runtime Review-as-reader, and status badge; P3c retains cloud publish/unpublish/route polish. Existing no-snapshot invariant is at [ADR-0007](/Users/hirakawa/ghq/github.com/g960059/0DSimDemo-publish-review/docs/adr/0007-workbench-ia-redesign.md:151). | D6 |
| `__tests__/publishDialogState.test.ts` | New pure tests for visibility default, entry default, Read disabled without reading, blockers not disabling Review, and checks running on the applied `reviewDoc`. | D6 |
| `__tests__/publishStatusBadge.test.ts` | New pure mapper/component SSR test for Draft, Unlisted, Public. | D6 |
| `__tests__/usePreviewRuntime.test.ts` | New isolation tests around exported pure runtime helpers: preview knob/visibility/active mutations do not mutate author instances or doc-derived source, reset returns to doc-derived initial, entry derivation falls back correctly. | D6 |
| `__tests__/locales.test.ts` | Existing parity test remains the gate for en/ja key parity ([locales.test.ts](/Users/hirakawa/ghq/github.com/g960059/0DSimDemo-publish-review/__tests__/locales.test.ts:39)). | D6 |

## PublishReviewOverlay Explore Composition

Full `PanelGrid` reuse is practical. The component already supports `mode="learner"` and suppresses document operations; the overlay only needs to provide preview-scoped state and no-op document handlers.

`PanelGrid` prop mapping:

| Prop group | Props | Preview source |
|---|---|---|
| Runtime data | `instances`, `activeInstanceId`, `setActiveInstanceId`, `updateInstanceParams`, `updateInstanceKnobs`, `updateInstanceVolume`, `toggleScenarioGlobalVisibility`, `resetInstanceKnobs` | `usePreviewRuntime(reviewDoc)` local state/updaters |
| Simulation | `physicsRefs`, `instanceHealth`, `steadyUpdateStatuses`, `timeScale`, `setTimeScale`, `isPlaying`, `togglePlay` | `preview.simulation` from its own `useWorkbenchSimulation` |
| Panel state | `panels`, `layoutState`, `onLayoutStateChange`, `mainDockviewViewState`, `onDockviewViewStateChange`, `noteModes`, `setNoteModes`, `noteCaseKey`, `notes` | Preview-local `useWorkbenchPanels({ instances: preview.instances, headerMode: "learner", markUserEdited: noop })`, initialized via `replacePanelState({ panels: clone(reviewDoc.panels), workspace: reviewDoc.workspace, notes: clone(reviewDoc.notes ?? {}), noteCaseKey: reviewDoc.meta.id })` |
| Layout identity | `dockviewLayoutKey`, `graphBoardLayout`, `onGraphBoardLayoutChange`, `workbenchTheme`, `isMobile` | `publish-review:${reviewDoc.meta.id}:${previewPanels.noteCaseKey}:${previewPanels.dockviewLayoutVersion}`, `reviewDoc.graphBoardLayout`, noop/local-only callback, route theme/mobile |
| Authored views | `authoredViews`, `reading`, `createControllerView`, `createMetricsView`, `updateAuthoredView`, `renameAuthoredView`, `restoreStandardViews`, `duplicateAuthoredView`, `deleteAuthoredView` | `authoredViewsForLoad(reviewDoc.views, reviewDoc.panels,{idFactory,instances:preview.instances,locale:reviewDoc.defaultLocale})`; create/update/delete handlers are no-op factories because `mode="learner"` hides callers |
| Hidden document ops | `updateInstanceColor`, `updateInstanceName`, `addInstance`, `removeInstance`, `addPanel`, `duplicatePanel`, `removePanel`, `updatePanelTitle`, `toggleShowLegend`, `updatePanelInstanceColor`, `updatePanelInstanceName`, `updatePanelSignalColor`, `updatePanelSignalName`, `toggleSettings`, `togglePaneMembership`, `updateInstanceSignals`, `toggleGuides`, `updateTimeWindow`, `updatePanelControllerItems`, `updatePanelLegendPosition`, `onNoteChange` | No-op or local-only handlers; learner mode prevents doc-op UI from invoking them |
| Catalogs | `chambers`, `signals`, `metrics`, `controlGroups` | Existing `ALL_CHAMBERS`, `ALL_SIGNALS`, `ALL_METRICS`, `ALL_CONTROL_GROUPS` from workbench defaults ([workbenchDefaults.ts](/Users/hirakawa/ghq/github.com/g960059/0DSimDemo-publish-review/features/workbench/workbenchDefaults.ts:78)) |
| Mode | `mode` | Hard-coded `"learner"` |

Read view uses `ReadingPresenter` with `chrome.hideHeader: true`, `caseDoc={meta,panels,notes,views,exposedControllers}` from `reviewDoc`, `column` from `resolveReadingColumn(reviewDoc)`, and the same preview runtime. The overlay’s own header controls `presentation`, reset, and exit.

If full `PanelGrid` reuse breaks in browser due to Dockview or perf, the minimal faithful fallback is a preview-only Explore renderer using `renderPaneBody` for graph/control/note panels plus `ScenarioPane readOnly`; this keeps runtime interactivity but loses Dockview graph-board layout, metrics host mirrors, and authored-view rail, so it is a fallback only.

## usePreviewRuntime API

```ts
type PreviewRuntime = {
  instances: SimInstance[];
  activeInstanceId: string;
  setActiveInstanceId: (id: string) => void;
  setActive: (id: string) => void;
  toggleVisibility: (id: string) => void;
  toggleScenarioGlobalVisibility: (id: string) => void;
  updateInstanceParams: (id: string, params: Partial<SimulationParams>) => void;
  updateInstanceKnobs: (id: string, knobs: ClinicalKnobs) => void;
  updateInstanceVolume: (id: string, volume: number) => void;
  resetInstanceKnobs: (id: string) => void;
  reset: () => void;
  simulation: WorkbenchSimulationState;
};
```

Internals:

- `createPreviewRuntimeInitialState(doc)` clones doc-derived instances via `caseDocumentToSimInstances(doc)` and active id via `resolveAuthorActiveInstanceId(instances, instances[0]?.id ?? "", doc.initialActiveScenarioId)`.
- Hook state is initialized from that helper and reset from it; no author scene references are accepted.
- `updateInstanceParams`, `updateInstanceKnobs`, `updateInstanceVolume`, `toggleVisibility`, and `resetInstanceKnobs` mirror the logic in `useWorkbenchScene` runtime updaters ([useWorkbenchScene.ts](/Users/hirakawa/ghq/github.com/g960059/0DSimDemo-publish-review/features/workbench/hooks/useWorkbenchScene.ts:162), [useWorkbenchScene.ts](/Users/hirakawa/ghq/github.com/g960059/0DSimDemo-publish-review/features/workbench/hooks/useWorkbenchScene.ts:171), [useWorkbenchScene.ts](/Users/hirakawa/ghq/github.com/g960059/0DSimDemo-publish-review/features/workbench/hooks/useWorkbenchScene.ts:184), [useWorkbenchScene.ts](/Users/hirakawa/ghq/github.com/g960059/0DSimDemo-publish-review/features/workbench/hooks/useWorkbenchScene.ts:211)) but never call `markDocumentEdited`.
- `updateInstanceKnobs`, `updateInstanceVolume`, and `resetInstanceKnobs` call the preview simulation’s `requestSteadyTransition`, not the author ref.
- Lifecycle is inherited from `useWorkbenchSimulation`: mount starts the preview controller, unmount cleanup calls `controller.stop()` ([useWorkbenchSimulation.ts](/Users/hirakawa/ghq/github.com/g960059/0DSimDemo-publish-review/features/workbench/hooks/useWorkbenchSimulation.ts:41), [useWorkbenchSimulation.ts](/Users/hirakawa/ghq/github.com/g960059/0DSimDemo-publish-review/features/workbench/hooks/useWorkbenchSimulation.ts:47)).

## Dialog State and Wiring

- `PublishDialog` receives `buildCurrentDoc` from persistence, plus display-only `scene.currentCaseStatus`/`scene.currentCaseVisibility`.
- Initial draft:
  - `visibility`: if current status is `published` and visibility is `public` or `unlisted`, use it; otherwise `unlisted`.
  - `defaultEntry`: `doc.defaultEntry ?? derivePublishDefaultEntry(doc)` using existing domain logic ([casePublish.ts](/Users/hirakawa/ghq/github.com/g960059/0DSimDemo-publish-review/features/workbench/casePublish.ts:25)).
- On every draft change:
  - `baseDoc = buildCurrentDoc({ defaultEntry })`.
  - `reviewDoc = applyPublishDraft(baseDoc,{ status:"published", visibility, defaultEntry })` ([casePublish.ts](/Users/hirakawa/ghq/github.com/g960059/0DSimDemo-publish-review/features/workbench/casePublish.ts:127)).
  - `issues = validatePublishableCase(reviewDoc)`.
- Read segment is disabled when `!canUseReadExplore(baseDoc)` ([readExplore.ts](/Users/hirakawa/ghq/github.com/g960059/0DSimDemo-publish-review/features/workbench/readExplore.ts:23)). Review remains enabled even with blockers.
- Footer has Cancel and Review as reader only. `onConfirmDraft` exists as an internal future seam but is not rendered or wired to cloud publish in P3b.

## WorkbenchRoute Wiring

- Add:
  - `const [isPublishDialogOpen, setPublishDialogOpen] = useState(false)`.
  - `const [reviewOverlay, setReviewOverlay] = useState<{ reviewDoc: CaseDocument; entry: ReadExploreMode } | null>(null)`.
- Header receives `publishStatus={scene.currentCaseStatus}`, `publishVisibility={scene.currentCaseVisibility}`, `onOpenPublishDialog={() => setPublishDialogOpen(true)}`.
- Dialog mounts only when `scene.headerMode !== "learner"`.
- `onReview(reviewDoc, entry)` closes the dialog and sets `reviewOverlay`.
- Overlay mounts after the existing workbench subtree inside `.workbench-root`, with fixed/full inset and higher z-index. The author `scene`, author `panels`, author `simulation`, workspace, and dockview state are never passed into overlay runtime.
- Exit is `setReviewOverlay(null)`, causing preview panels and preview simulation worker to unmount.

## Tokens and i18n

Add CSS tokens:

| Token | Dark | Light |
|---|---|---|
| `--wb-danger-soft` | `rgba(248, 113, 113, 0.14)` | `rgba(220, 38, 38, 0.10)` |
| `--wb-warning` | `#fbbf24` | `#92400e` |
| `--wb-warning-soft` | `rgba(251, 191, 36, 0.16)` | `rgba(146, 64, 14, 0.12)` |

Expose `--color-wb-danger-soft`, `--color-wb-warning`, `--color-wb-warning-soft` in `@theme inline`.

New i18n keys:

| Key | en | ja |
|---|---|---|
| `publish.badge.draft` | `Draft` | `下書き` |
| `publish.badge.unlisted` | `Unlisted` | `限定公開` |
| `publish.badge.public` | `Public` | `公開` |
| `publish.badge.tooltip` | `Publish settings` | `公開設定` |
| `publish.dialog.title` | `Review for publishing` | `公開前の確認` |
| `publish.dialog.subtitle` | `Check how readers will see this.` | `読者にどう見えるかを確認します。` |
| `publish.dialog.visibility` | `Visibility` | `公開範囲` |
| `publish.dialog.unlisted` | `Unlisted` | `限定公開` |
| `publish.dialog.public` | `Public` | `公開` |
| `publish.dialog.visibilityHint` | `Applies when publishing is enabled.` | `公開処理を有効にしたときに適用されます。` |
| `publish.dialog.openingView` | `Opening view` | `読者の最初の画面` |
| `publish.dialog.readHelp` | `Recommended when the case has a reading note` | `読み物ノートがある場合に推奨` |
| `publish.dialog.exploreHelp` | `Start directly in the Workbench` | `Workbench から直接開始` |
| `publish.dialog.readDisabled` | `Read is available after adding reading content.` | `読み物コンテンツを追加すると Read を選べます。` |
| `publish.dialog.checks` | `Checks` | `チェック` |
| `publish.dialog.cannotPublish` | `Cannot publish yet` | `公開できません` |
| `publish.dialog.warnings` | `Warnings` | `警告` |
| `publish.dialog.ready` | `Ready to publish` | `公開できます` |
| `publish.dialog.reviewAsReader` | `Review as reader` | `読者として確認` |
| `publish.review.title` | `Preview: reader view` | `プレビュー中：読者ビュー` |
| `publish.review.reset` | `Reset` | `リセット` |
| `publish.review.exit` | `Exit` | `編集に戻る` |

## Test Plan

- `usePreviewRuntime`: pure isolation test proves preview mutations do not mutate author instances or the source document, reset re-derives from doc, active id follows `initialActiveScenarioId`, and entry fallback uses `deriveReadExploreEntryMode` ([readExplore.ts](/Users/hirakawa/ghq/github.com/g960059/0DSimDemo-publish-review/features/workbench/readExplore.ts:28)). Browser-only worker/RAF teardown is left to lead verification.
- `publishDialogState`: blockers do not disable Review; Read is disabled without reading content; initial entry and visibility defaults are correct; checks run on the draft-applied doc.
- `PublishStatusBadge`: Draft/Unlisted/Public class and label mapping.
- i18n parity remains covered by existing test.
- Existing suites expected to stay green: `casePublish`, `readExplore`, `panelGrid`, `readingPresenter`, `workbenchPersistence`, `workbenchGraphBoardLayout`, `workbenchAuthoredViews`.
- Required local gates per commit: `npx tsc --noEmit`, `npm test`, `npm run build`, `npm run verify:cases`.

## Commit Sequencing

1. D5 + D1: scene display status/visibility, `PublishStatusBadge`, header badge slot, route dialog open/close state. Green: `tsc`, badge tests.
2. D2: `publishDialogState`, `PublishIssueList`, `PublishDialog`, i18n keys, CSS tokens. Green: `tsc`, dialog state tests, locale parity.
3. D3: `usePreviewRuntime` with pure helpers and isolation tests. Green: `tsc`, runtime tests.
4. D4: `PublishReviewOverlay`, preview panel composition, `ReadingPresenter` hide-header prop, WorkbenchRoute overlay mount. Green: `tsc`, existing panel/reading tests.
5. D6: ADR update, final test/build/verify pass, fix integration fallout only.

## Risks and Resolutions

- Second worker plus second `PanelGrid` can be heavier because the author simulation keeps running behind the overlay. P3b should not pause or mutate author runtime; mount preview only while overlay is open and let lead browser-check perf.
- No code-read global singleton blocks two simulations: `PreviewController.refs` and `useWorkbenchSimulation` controller refs are instance-local, and Dockview state is component-local. Watch BlockNote/NotePanel globals in browser because existing tests already stub NotePanel for shared-worker stability.
- Dockview may emit layout callbacks on preview mount. Route must pass preview-local/no-op callbacks, never `scene.updateGraphBoardLayout`.
- `ReadingPresenter` currently always renders its own header; add `chrome.hideHeader` to avoid a double header in the overlay.
- If a stale doc has `defaultEntry: "read"` but no readable content, disable Read and coerce the selected review entry to Explore before `onReview`; `deriveReadExploreEntryMode` also guards the overlay.
- Full Explore preview should include rail, metrics host, graph board layout, authored views, and live waveforms. A reduced renderer is acceptable only as a fallback if Dockview reuse fails in browser.
---

## Lead plan_review decisions (BINDING — OVERRIDE the plan above)

Reviewers: opus 4.8 high = approve-to-code; codex 5.5 high = approve-with-changes (2 blocking plan
gaps). Lead adopts these; they OVERRIDE the corresponding plan parts. Apply ALL.

1. **Badge must stay correct after a Save (codex blocking #1).** Extend `SavedCasePayload` with
   `status?: CaseStatus` / `visibility?: CaseVisibility`; set `currentCaseStatus`/`currentCaseVisibility`
   in `applySavedCase` from the payload; and pass `nextDoc.status`/`nextDoc.visibility` at the existing
   `scene.applySavedCase({...})` call site in `useWorkbenchPersistence` (the normal Save path). So after
   an owner saves a previously-published case (Save writes draft/private), the badge updates to Draft.
   This is the ONLY persistence touch — still NO publish/saveCase wiring.

2. **No first-paint flicker in the preview board (codex blocking #2) — MANDATORY, not "if it appears".**
   The overlay's 2nd `useWorkbenchPanels` initializes to INITIAL_PANELS before `replacePanelState` lands.
   Either (a) gate the overlay's `PanelGrid` render behind a `previewReady` flag set after the preview
   panels reflect `reviewDoc`, or (b) add an `initialPanelState` initializer to `useWorkbenchPanels`
   (additive, author call sites unchanged) seeded from `reviewDoc`. Pick one; the board must NEVER paint
   default panels.

3. **No-op vs preview-runtime handler split is explicit at the overlay PanelGrid mount.** Handlers that
   ARE invoked in learner mode (ScenarioPane active-selection / visibility-toggle / reset —
   ScenarioPane.tsx:200/251/312 — plus active/knob/volume/timeScale/play) MUST be the LIVE
   `usePreviewRuntime`/preview-simulation handlers. All document-op handlers (instance CRUD, panel/view
   CRUD, `onNoteChange`, `onDockviewViewStateChange`, `onGraphBoardLayoutChange`, `onLayoutStateChange`)
   are no-op or preview-LOCAL only and MUST NOT reach the author scene/persistence. Make this split
   explicit (a small `noop`-factory block + the preview-runtime wiring) so it is intentional, not accidental.

4. **Extract shared pure instance-update helpers (both reviewers).** Pull the core runtime mutation logic
   (updateInstanceParams/Knobs/Volume, toggle visibility, resetInstanceKnobs) out of `useWorkbenchScene`
   into a pure module that takes `(instances, ...)` and an injected `requestSteadyTransition`. `usePreviewRuntime`
   consumes it (injecting its OWN preview `requestSteadyTransition`). Refactor `useWorkbenchScene` to consume
   the same helpers too IF behavior is identical (gated green by existing scene/persistence tests); if that
   refactor is at all risky, leave the author path untouched and have only `usePreviewRuntime` use the
   helpers. Goal: no logic drift + node-testable isolation.

5. **Keep BOTH simulations running while the overlay is open (lead adjudication; opus over codex).** Do NOT
   pause/resume the author simulation in P3b — that would reintroduce a capture/restore (isPlaying), and the
   whole point of this rebuild is ZERO capture/restore. The author sim runs (hidden) behind the overlay;
   the preview sim is mounted only for the overlay's lifetime. The lead measures perf in browser; an
   author-pause optimization is a P3c follow-up ONLY if perf is bad.

6. **Tests**: the `usePreviewRuntime` isolation test MUST assert that after preview mutations BOTH (a) the
   source `CaseDocument` and (b) a separate author-`instances` array are byte-unchanged; structure the
   updaters with an injected `requestSteadyTransition` so this is node-testable without a worker. Add a
   `PublishReviewOverlay` smoke/SSR test (minimal `reviewDoc`, mocked `NotePanel`) that mounts the full
   `PanelGrid` learner composition to catch wrong no-op/runtime wiring (tsc catches prop-shape drift but
   not wiring). `ReadingPresenter` `chrome.hideHeader` defaults to visible (guard the existing
   unconditional `<header>`).

Everything else in the plan is approved (full PanelGrid reuse confirmed feasible; prop list complete;
requestSteadyTransition is exposed by useWorkbenchSimulation; no singleton blocks two sims). Proceed to code
the 5 commits; each independently green (tsc + npm test); run build + verify:cases (10/0) before PR. Lead
browser-verifies Dark+Light: badge→dialog; Read disabled w/o reading; Review opens the isolated overlay with
LIVE waveforms; a slider moved INSIDE review leaves the author workbench unchanged after Exit; Reset re-derives
the preview; Exit returns to the untouched authoring view; learner mode shows no badge; and PERF of two
simulations is acceptable.
