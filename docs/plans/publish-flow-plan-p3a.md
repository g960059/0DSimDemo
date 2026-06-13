## P3a Implementation Plan

### File-By-File Changes

| File | Change | Decisions |
|---|---|---|
| [caseDoc.ts](/Users/hirakawa/ghq/github.com/g960059/0DSimDemo-publish/caseDoc.ts:50) | Add type-only import of `ReadExploreMode`; add `defaultEntry?: ReadExploreMode` to `CaseDocument` near publish/share fields; add `defaultEntry?: ReadExploreMode` to `simInstancesToCaseDocument` opts and preserve it in the returned document. Existing status/visibility/owner fields are already present at [caseDoc.ts:145](/Users/hirakawa/ghq/github.com/g960059/0DSimDemo-publish/caseDoc.ts:145). | D1, D5 |
| [features/workbench/readExplore.ts](/Users/hirakawa/ghq/github.com/g960059/0DSimDemo-publish/features/workbench/readExplore.ts:4) | Add `defaultEntry` to `ReadExploreDoc`; update `deriveReadExploreEntryMode` exactly per D2. | D2 |
| `features/workbench/casePublish.ts` | New pure domain module: `derivePublishDefaultEntry`, `PublishIssue`, `validatePublishableCase`, `isPublishable`, `PublishDraft`, `applyPublishDraft`. Uses `graphPanelsOnly` from [p1aStructuralHosts.ts:31](/Users/hirakawa/ghq/github.com/g960059/0DSimDemo-publish/features/workbench/p1aStructuralHosts.ts:31) and `collectNoteViewRefIds` from [noteViewRefs.ts:49](/Users/hirakawa/ghq/github.com/g960059/0DSimDemo-publish/features/workbench/noteViewRefs.ts:49). | D2b, D3, D4 |
| [features/workbench/WorkbenchRoute.tsx](/Users/hirakawa/ghq/github.com/g960059/0DSimDemo-publish/features/workbench/WorkbenchRoute.tsx:60) | Include `defaultEntry: scene.currentCaseDefaultEntry` in `readExploreDoc` and dependency list so loaded/published docs can affect the entry derivation. No UI changes. | D2 |
| [features/workbench/hooks/useWorkbenchScene.ts](/Users/hirakawa/ghq/github.com/g960059/0DSimDemo-publish/features/workbench/hooks/useWorkbenchScene.ts:46) | Add `defaultEntry?: CaseDocument["defaultEntry"]` to saved-case payloads, state, `replaceSceneFromDoc`, `applySavedCase`, and returned scene state. | D1, D5 |
| [features/workbench/hooks/useWorkbenchPersistence.ts](/Users/hirakawa/ghq/github.com/g960059/0DSimDemo-publish/features/workbench/hooks/useWorkbenchPersistence.ts:32) | Add `defaultEntry?: CaseDocument["defaultEntry"]` to build overrides; pass `overrides.defaultEntry ?? scene.currentCaseDefaultEntry` into `simInstancesToCaseDocument`; pass `nextDoc.defaultEntry` into `applySavedCase`. Do not wire validation into `saveCase`. | D5 |
| [casePersist.ts](/Users/hirakawa/ghq/github.com/g960059/0DSimDemo-publish/casePersist.ts:15) | No production change expected: parse returns the normalized object and serialize is `JSON.stringify` at [casePersist.ts:68](/Users/hirakawa/ghq/github.com/g960059/0DSimDemo-publish/casePersist.ts:68), so optional canonical fields pass through. Add test coverage. | D5 |
| [caseCloud.ts](/Users/hirakawa/ghq/github.com/g960059/0DSimDemo-publish/caseCloud.ts:126) | No production change expected: `caseDocFields` serializes full `content`; `docContentToCaseDocument` parses content at [caseCloud.ts:224](/Users/hirakawa/ghq/github.com/g960059/0DSimDemo-publish/caseCloud.ts:224); `caseDocumentWithTrustedCloudFields` spreads parsed content at [caseCloud.ts:244](/Users/hirakawa/ghq/github.com/g960059/0DSimDemo-publish/caseCloud.ts:244). Add test coverage. | D5 |
| [locales/en/translation.json](/Users/hirakawa/ghq/github.com/g960059/0DSimDemo-publish/locales/en/translation.json:56), [locales/ja/translation.json](/Users/hirakawa/ghq/github.com/g960059/0DSimDemo-publish/locales/ja/translation.json:56) | Add top-level `publish.blocker.*` and `publish.warning.*` keys. Parity is enforced by [__tests__/locales.test.ts:39](/Users/hirakawa/ghq/github.com/g960059/0DSimDemo-publish/__tests__/locales.test.ts:39). | D6 |
| [docs/adr/0007-workbench-ia-redesign.md](/Users/hirakawa/ghq/github.com/g960059/0DSimDemo-publish/docs/adr/0007-workbench-ia-redesign.md:179) | Update P3 bullet to record the 3-PR split, top-level `defaultEntry`, `validatePublishableCase`, and no runtime snapshot envelope. | D6 |
| [__tests__/readExplore.test.ts](/Users/hirakawa/ghq/github.com/g960059/0DSimDemo-publish/__tests__/readExplore.test.ts:38) | Add override cases; leave existing expectations unchanged. | D2, D6 |
| `__tests__/casePublish.test.ts` | New truth-table tests for validator, publish draft transition, default derivation, local/cloud round trip. | D2b-D6 |
| [__tests__/workbenchPersistence.test.ts](/Users/hirakawa/ghq/github.com/g960059/0DSimDemo-publish/__tests__/workbenchPersistence.test.ts:32) | Add `currentCaseDefaultEntry` fixture field and a focused assertion that `buildCurrentDoc` preserves it. | D5 |

### Exact TypeScript Deltas

```ts
// caseDoc.ts
import type { ReadExploreMode } from "@/features/workbench/readExplore";

export interface CaseDocument {
  // ...
  source?: CaseSource;
  derivedFrom?: string;
  defaultEntry?: ReadExploreMode;
  spec: CaseSpec;
  // ...
}

export function simInstancesToCaseDocument(
  instances: SimInstance[],
  panels: PanelDef[],
  opts: {
    // ...
    defaultEntry?: ReadExploreMode;
    // ...
  },
): CaseDocument {
  return {
    // ...
    ...(opts.derivedFrom ? { derivedFrom: opts.derivedFrom } : {}),
    ...(opts.defaultEntry ? { defaultEntry: opts.defaultEntry } : {}),
    spec: opts.spec,
    // ...
  };
}
```

```ts
// features/workbench/readExplore.ts
type ReadExploreDoc = Pick<CaseDocument, "panels" | "notes" | "reading" | "defaultEntry">;

export function deriveReadExploreEntryMode(doc: ReadExploreDoc, opts: { readOnly: boolean }): ReadExploreMode {
  if (!opts.readOnly) return "explore";
  const canRead = canUseReadExplore(doc);
  if (doc.defaultEntry === "explore") return "explore";
  if (doc.defaultEntry === "read") return canRead ? "read" : "explore";
  return canRead ? "read" : "explore";
}
```

```ts
// features/workbench/casePublish.ts
export type PublishIssueSeverity = "blocker" | "warning";

export interface PublishIssue {
  severity: PublishIssueSeverity;
  code: string;
  path?: string;
}

export function derivePublishDefaultEntry(doc: CaseDocument): ReadExploreMode {
  return canUseReadExplore(doc) ? "read" : "explore";
}

export function validatePublishableCase(doc: CaseDocument): PublishIssue[] {
  // Pure set construction + predicates below.
}

export const isPublishable = (issues: PublishIssue[]) =>
  !issues.some((issue) => issue.severity === "blocker");

export interface PublishDraft {
  status: "published";
  visibility: Extract<CaseVisibility, "unlisted" | "public">;
  defaultEntry: ReadExploreMode;
}

export function applyPublishDraft(doc: CaseDocument, draft: PublishDraft): CaseDocument {
  const derivedDefaultEntry = derivePublishDefaultEntry(doc);
  const { defaultEntry: _defaultEntry, ...withoutDefaultEntry } = doc;
  return {
    ...withoutDefaultEntry,
    status: draft.status,
    visibility: draft.visibility,
    ...(draft.defaultEntry === derivedDefaultEntry ? {} : { defaultEntry: draft.defaultEntry }),
  };
}
```

### Validator Internals

Common id sets mirror [officialAfterloadCase.test.ts:18](/Users/hirakawa/ghq/github.com/g960059/0DSimDemo-publish/__tests__/officialAfterloadCase.test.ts:18): `panelIds`, `noteIds`, `viewIds`, `graphPanelIds = graphPanelsOnly(doc.panels).map(id)`, `instanceIds`.

| Code | Predicate | Path format |
|---|---|---|
| `publish.blocker.missing-title` | `doc.meta.title.trim().length === 0` | `meta.title` |
| `publish.blocker.no-scenarios` | `doc.instances.length < 1` | `instances` |
| `publish.blocker.dangling-initial-active` | `doc.initialActiveScenarioId` exists and is not in `instanceIds` | `initialActiveScenarioId:${id}` |
| `publish.blocker.dangling-graph-leaf` | each recursive `graphBoardLayout` leaf id not in `graphPanelIds`; graph ids source is `graphPanelsOnly` at [p1aStructuralHosts.ts:31](/Users/hirakawa/ghq/github.com/g960059/0DSimDemo-publish/features/workbench/p1aStructuralHosts.ts:31) | `graphBoardLayout.leaf:${graphViewId}` |
| `publish.blocker.dangling-reading-ref` | reading `noteRef` not in `noteIds`, `paneRef` not in `panelIds`, or `viewRef` not in `viewIds` | `reading.column[${index}].noteRef:${id}`, `.paneRef:${id}`, `.viewRef:${id}` |
| `publish.blocker.dangling-note-view-ref` | each id from `collectNoteViewRefIds(doc.notes)` not in `viewIds` | `notes.view_ref:${viewId}` |
| `publish.blocker.dangling-controller-pin` | controller view `binding.kind === "scenario"` and `scenarioId` not in `instanceIds` | `views.${view.id}.binding:${scenarioId}` |
| `publish.blocker.dangling-membership` | graph or metrics view membership key not in `instanceIds` | `views.${view.id}.membership:${scenarioId}` |
| `publish.warning.no-reading-content` | `!hasCaseReadingContent(doc)` from [readExplore.ts:18](/Users/hirakawa/ghq/github.com/g960059/0DSimDemo-publish/features/workbench/readExplore.ts:18) | `reading` |
| `publish.warning.active-scenario-hidden` | `initialActiveScenarioId` resolves to an instance whose `isVisible === false` | `initialActiveScenarioId:${id}` |
| `publish.warning.empty-view` | metrics view has `metrics.length === 0`, or controller view has `items.length === 0` | `views.${view.id}` |
| `publish.warning.model-limitations-empty` | `doc.spec.modelLimitations.length === 0` or all entries are blank | `spec.modelLimitations` |
| `publish.warning.pinned-binding-used` | controller view uses `binding.kind === "scenario"`; emit even if also dangling | `views.${view.id}.binding:${scenarioId}` |

Mapping to `expectInternalReferencesToResolve`:
- Reading assertions at [officialAfterloadCase.test.ts:28](/Users/hirakawa/ghq/github.com/g960059/0DSimDemo-publish/__tests__/officialAfterloadCase.test.ts:28) map to `dangling-reading-ref`.
- Graph leaf assertion at [officialAfterloadCase.test.ts:34](/Users/hirakawa/ghq/github.com/g960059/0DSimDemo-publish/__tests__/officialAfterloadCase.test.ts:34) maps to `dangling-graph-leaf`.
- Note `view_ref` assertion at [officialAfterloadCase.test.ts:38](/Users/hirakawa/ghq/github.com/g960059/0DSimDemo-publish/__tests__/officialAfterloadCase.test.ts:38) maps to `dangling-note-view-ref`.
- Controller scenario binding assertion at [officialAfterloadCase.test.ts:42](/Users/hirakawa/ghq/github.com/g960059/0DSimDemo-publish/__tests__/officialAfterloadCase.test.ts:42) maps to `dangling-controller-pin`.
- View membership assertion at [officialAfterloadCase.test.ts:47](/Users/hirakawa/ghq/github.com/g960059/0DSimDemo-publish/__tests__/officialAfterloadCase.test.ts:47) maps to `dangling-membership`.
- `validateGraphBoardLayout(...)` at [officialAfterloadCase.test.ts:52](/Users/hirakawa/ghq/github.com/g960059/0DSimDemo-publish/__tests__/officialAfterloadCase.test.ts:52) partially overlaps `dangling-graph-leaf`, but also checks missing layout, duplicate leaves, split arity, and invalid sizes from [viewSpec.ts:142](/Users/hirakawa/ghq/github.com/g960059/0DSimDemo-publish/features/workbench/viewSpec.ts:142). Those extra structural checks have no brief code and should not become P3a issues without lead confirmation.
- Brief codes not covered by the helper: `missing-title`, `no-scenarios`, `dangling-initial-active`, and all warnings.

### Persistence Wiring

`defaultEntry` rides inside canonical document `content`, not a Firestore query field.

- Local write: `serializeCaseDocument` JSON stringifies the full doc at [casePersist.ts:68](/Users/hirakawa/ghq/github.com/g960059/0DSimDemo-publish/casePersist.ts:68).
- Local read: `parseCaseDocument` only guards core shape and returns normalized `CaseDocument` at [casePersist.ts:15](/Users/hirakawa/ghq/github.com/g960059/0DSimDemo-publish/casePersist.ts:15), so no parse-guard change is needed.
- Cloud write: `caseDocFields` serializes normalized content at [caseCloud.ts:126](/Users/hirakawa/ghq/github.com/g960059/0DSimDemo-publish/caseCloud.ts:126). No `CaseDocFields` column is needed.
- Cloud read: `docContentToCaseDocument` parses content at [caseCloud.ts:224](/Users/hirakawa/ghq/github.com/g960059/0DSimDemo-publish/caseCloud.ts:224), and `caseDocumentWithTrustedCloudFields` preserves parsed fields by spreading at [caseCloud.ts:244](/Users/hirakawa/ghq/github.com/g960059/0DSimDemo-publish/caseCloud.ts:244).
- Cloud normalization is safe: `normalizeCaseForCloud` spreads resolved content at [caseCloud.ts:102](/Users/hirakawa/ghq/github.com/g960059/0DSimDemo-publish/caseCloud.ts:102), and `resolveLocalizedCaseDocument` spreads `normalized` at [contentI18n.ts:254](/Users/hirakawa/ghq/github.com/g960059/0DSimDemo-publish/contentI18n.ts:254).

### I18n Keys

Add a top-level `publish` object to both locale JSON files. `i18n.ts` registers those files directly at [i18n.ts:16](/Users/hirakawa/ghq/github.com/g960059/0DSimDemo-publish/i18n.ts:16).

```json
{
  "publish": {
    "blocker": {
      "missing-title": "Add a title before publishing.",
      "no-scenarios": "Add at least one scenario.",
      "dangling-initial-active": "The initial active scenario no longer exists.",
      "dangling-graph-leaf": "A graph board panel reference no longer exists.",
      "dangling-reading-ref": "A reading column reference no longer exists.",
      "dangling-note-view-ref": "A note embeds a view that no longer exists.",
      "dangling-controller-pin": "A pinned controller scenario no longer exists.",
      "dangling-membership": "A view references a scenario that no longer exists."
    },
    "warning": {
      "no-reading-content": "No reading content is available; readers will open Explore.",
      "active-scenario-hidden": "The initial scenario is hidden for readers.",
      "empty-view": "An authored view has no visible content.",
      "model-limitations-empty": "Model limitations are empty.",
      "pinned-binding-used": "A controller is pinned to one scenario."
    }
  }
}
```

Japanese strings:
- `missing-title`: `公開前にタイトルを入力してください。`
- `no-scenarios`: `シナリオを1つ以上追加してください。`
- `dangling-initial-active`: `初期アクティブシナリオが存在しません。`
- `dangling-graph-leaf`: `グラフボードのパネル参照が存在しません。`
- `dangling-reading-ref`: `Reading列の参照が存在しません。`
- `dangling-note-view-ref`: `ノート内の埋め込みビューが存在しません。`
- `dangling-controller-pin`: `ピン留めされたコントローラのシナリオが存在しません。`
- `dangling-membership`: `ビューが存在しないシナリオを参照しています。`
- `no-reading-content`: `Readingコンテンツがないため、読者はExploreで開きます。`
- `active-scenario-hidden`: `初期シナリオが読者には非表示です。`
- `empty-view`: `作成済みビューに表示内容がありません。`
- `model-limitations-empty`: `モデルの制約が空です。`
- `pinned-binding-used`: `コントローラが1つのシナリオにピン留めされています。`

### Test Plan

New `__tests__/casePublish.test.ts`:
- `returns no issues for the afterload official case`: `validatePublishableCase(officialCaseById("afterload-acute-hypertension")!)` equals `[]`.
- One crafted doc per blocker code: missing title, no scenarios, dangling initial active, dangling graph leaf against `graphPanelsOnly`, dangling reading refs for note/pane/view, dangling note `view_ref`, dangling controller pin, dangling graph/metrics membership.
- One crafted doc per warning code: no reading content, hidden initial scenario, empty metrics/controller views, empty model limitations, valid pinned controller binding.
- `isPublishable returns false for blockers and true for warnings only`.
- `derivePublishDefaultEntry returns read with usable note/reading content and explore without it`.
- `applyPublishDraft publishes visibility and omits defaultEntry when it equals the derived default`.
- `applyPublishDraft writes defaultEntry when author override differs from derived default and does not mutate input`.
- `preserves defaultEntry through local serialize/parse and cloud content shape`: assert `parseCaseDocument(serializeCaseDocument(doc)).defaultEntry`, `docContentToCaseDocument(caseDocFields(doc, "u1").content, doc.meta.id)?.defaultEntry`, and `caseDocumentWithTrustedCloudFields(...).defaultEntry`.

Update `__tests__/readExplore.test.ts`:
- `honors defaultEntry read when reading is available`.
- `falls back to explore for defaultEntry read when reading is unavailable`.
- `honors defaultEntry explore even when reading is available`.
- `keeps undefined defaultEntry behavior unchanged`.

Update `__tests__/workbenchPersistence.test.ts`:
- `persists the current default entry on current-doc builds`.

Existing tests that must remain green unchanged:
- [__tests__/officialAfterloadCase.test.ts](/Users/hirakawa/ghq/github.com/g960059/0DSimDemo-publish/__tests__/officialAfterloadCase.test.ts:55)
- Existing cases in [__tests__/readExplore.test.ts](/Users/hirakawa/ghq/github.com/g960059/0DSimDemo-publish/__tests__/readExplore.test.ts:38)
- [engine/__tests__/casePersist.test.ts](/Users/hirakawa/ghq/github.com/g960059/0DSimDemo-publish/engine/__tests__/casePersist.test.ts:18)
- [__tests__/caseCloud.test.ts](/Users/hirakawa/ghq/github.com/g960059/0DSimDemo-publish/__tests__/caseCloud.test.ts:37)
- [__tests__/locales.test.ts](/Users/hirakawa/ghq/github.com/g960059/0DSimDemo-publish/__tests__/locales.test.ts:39)

Verification commands:
- `npx tsc --noEmit`
- `npm test`
- Final full check also runs `npm run build` and `npm run verify:cases` per [package.json:8](/Users/hirakawa/ghq/github.com/g960059/0DSimDemo-publish/package.json:8) and [package.json:16](/Users/hirakawa/ghq/github.com/g960059/0DSimDemo-publish/package.json:16).

### Commit Sequencing

1. **D1/D2 default-entry schema and entry derivation**  
   Change `caseDoc.ts`, `readExplore.ts`, minimal route/scene carry for `defaultEntry`, and `readExplore.test.ts`. Green: `npx tsc --noEmit && npm test`.

2. **D2b/D3 publish validator**  
   Add `features/workbench/casePublish.ts` with `derivePublishDefaultEntry`, issue types, `validatePublishableCase`, `isPublishable`, and validator truth-table tests. Green: `npx tsc --noEmit && npm test`.

3. **D4 publish draft transition**  
   Add `PublishDraft` and `applyPublishDraft`, plus idempotence/no-mutation tests. Green: `npx tsc --noEmit && npm test`.

4. **D5/D6 persistence, i18n, ADR**  
   Add round-trip coverage, workbench current-doc preservation, locale keys, and ADR update. Green: `npx tsc --noEmit && npm test`; final PR verification also `npm run build && npm run verify:cases`.

### Risks And Ambiguities

- `expectInternalReferencesToResolve` includes `validateGraphBoardLayout` at [officialAfterloadCase.test.ts:52](/Users/hirakawa/ghq/github.com/g960059/0DSimDemo-publish/__tests__/officialAfterloadCase.test.ts:52), but the brief only assigns a code for dangling graph leaves. Recommended resolution: P3a implements only `dangling-graph-leaf`; structural layout errors remain unreported unless the lead adds issue codes.
- The phrase “NO cloud-save wiring” conflicts slightly with D5 if interpreted as “do not touch save helpers at all.” Recommended resolution: allow passive field preservation through existing build/serialize/content paths, but do not call `validatePublishableCase` or `applyPublishDraft` from `saveCase`.
- `collectNoteViewRefIds` returns only a `Set<string>` at [noteViewRefs.ts:49](/Users/hirakawa/ghq/github.com/g960059/0DSimDemo-publish/features/workbench/noteViewRefs.ts:49), so note/block-level paths are unavailable without new traversal logic. Recommended resolution: keep path `notes.view_ref:${viewId}` for P3a to stay aligned with the existing helper.
- `publish.warning.pinned-binding-used` can co-occur with `publish.blocker.dangling-controller-pin` for the same controller. Recommended resolution: emit both because one reports advisory pin semantics and the other reports broken referential integrity.
---

## Lead plan_review decisions (BINDING — apply these on top of the plan above)

Both reviewers (codex 5.5 high + opus 4.8 high) returned approve-with-changes. The lead adopts
these 5 changes; they OVERRIDE the corresponding parts of the plan above.

1. **Graph-layout blocker uses `validateGraphBoardLayout`, not a hand-rolled leaf check.**
   The brief mandates promoting `expectInternalReferencesToResolve`, which includes
   `validateGraphBoardLayout(layout, { graphViewIds }) === []` (officialAfterloadCase.test.ts:52).
   So source the graph-layout blocker from
   `validateGraphBoardLayout(doc.graphBoardLayout, { graphViewIds: graphPanelIds })`
   (graphPanelIds = `graphPanelsOnly(doc.panels).map(p => p.id)`). If it returns a non-empty error
   list, emit ONE blocker. RENAME the code `publish.blocker.dangling-graph-leaf` →
   `publish.blocker.invalid-graph-layout` (it now also covers missing layout / duplicate leaves /
   split arity / bad sizes, so the leaf-only name would mislead). `path: "graphBoardLayout"`.
   Skip only the graphless case (`graphPanelIds.length === 0 && !doc.graphBoardLayout`).
   i18n: en "The graph board layout is invalid or references a panel that no longer exists." /
   ja "グラフボードのレイアウトが無効か、存在しないパネルを参照しています。"
   (Drop the `dangling-graph-leaf` key; use `invalid-graph-layout` in both locale files + the test.)

2. **Make the defaultEntry carry-through concrete (not just named).** Implement, explicitly:
   - `useWorkbenchScene.ts`: a `currentCaseDefaultEntry` state (`useState<CaseDocument["defaultEntry"]>()`),
     set in `replaceSceneFromDoc` (`setCurrentCaseDefaultEntry(doc.defaultEntry)`) and in
     `applySavedCase` (`setCurrentCaseDefaultEntry(payload.defaultEntry)`), and returned in scene state.
   - `SavedCasePayload` type: add `defaultEntry?: CaseDocument["defaultEntry"]`; pass
     `defaultEntry: nextDoc.defaultEntry` at the `applySavedCase` call site in useWorkbenchPersistence.
   - `BuildCurrentDocOverrides` type: add `defaultEntry?: CaseDocument["defaultEntry"]`.

3. **WorkbenchRoute read-entry effect key includes defaultEntry.** Change the guard key from
   `` `${scene.currentCaseId}:${panels.noteCaseKey}` `` to include
   `` `:${scene.currentCaseDefaultEntry ?? "derive"}` `` so a defaultEntry change re-derives the
   entry mode. Behavior-preserving when defaultEntry is undefined.

4. **buildCurrentDoc override uses presence check, not `??`.**
   `const nextDefaultEntry = "defaultEntry" in overrides ? overrides.defaultEntry : scene.currentCaseDefaultEntry;`
   then pass `nextDefaultEntry` into `simInstancesToCaseDocument`. (Allows P3b to clear an override.)

5. **`active-scenario-hidden` stays a conservative `isVisible === false` check.** Do NOT compute
   membership-based effective visibility in P3a. Add one line to the ADR-0007 P3 update noting this
   warning is conservative (instance global visibility only; membership-based hiding is a follow-up).

Everything else in the plan is approved as written. Proceed to code the 4 commits; keep each
independently green (`npx tsc --noEmit && npm test`), and run `npm run build` + `npm run verify:cases`
(must stay 10/0) before declaring the PR ready.
