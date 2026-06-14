# P3b (re-architected) Publish dialog + isolated Review-as-reader — lead design brief (binding)

Branch `ux/publish-review` off main (bc61aa8, post P3a #144). This SUPERSEDES the earlier
`ux/publish-dialog` attempt (abandoned, not merged): an external review + an independent codex
post-impl review both showed the "mutate-the-live-scene + snapshot/restore" approach is fragile
(it leaked the metrics-dockview UI state on exit, and the restore burden grows with every piece of
mutable state). Owner decision: rebuild Review-as-reader on an **isolated preview runtime**, and
**defer cloud publish (saveCase) to P3c**.

Lead (Claude) owns ALL IA/UX/visual decisions; codex executes. codex 5.5 xhigh expands this into a
file-by-file plan; plan_review gate (codex 5.5 high + opus 4.8 high + lead) vets it; lead
browser-verifies Dark + Light before merge.

P3a (merged) provides the domain: `features/workbench/casePublish.ts` →
`validatePublishableCase(doc): PublishIssue[]` (`{severity,code,path}`), `isPublishable`,
`derivePublishDefaultEntry(doc)`, `applyPublishDraft(doc,{status,visibility,defaultEntry})`, plus
`CaseDocument.defaultEntry`. P3b is the UI layer over these. Add NO new domain rules.

## Feasibility (verified on this worktree)
- `useWorkbenchSimulation(instances, onAdded)` creates its OWN `PreviewController`
  (`controllerRef.current ??= new PreviewController()`), and each `PreviewController` constructor
  spawns its OWN web worker (`new Worker(new URL("./previewWorker.ts", ...))`). So a SECOND
  simulation can run, fully isolated from the author's. (engine/previewController.ts:353-366,
  features/workbench/hooks/useWorkbenchSimulation.ts:18-19.)
- `caseDocumentToSimInstances(doc)` (caseDoc.ts:412) builds SimInstances from a CaseDocument →
  the seed for the cloned preview runtime.
- `buildCurrentDoc({defaultEntry})` already accepts a defaultEntry override (presence-checked);
  `CaseDocument.defaultEntry` exists; `deriveReadExploreEntryMode(doc,{readOnly})` honors it.
- Reader render today: `ReadingPresenter` (Read) and `PanelGrid mode="learner"` (Explore) — both
  reusable, but in P3b they are mounted in the OVERLAY against the PREVIEW runtime, NOT the live scene.

## The core principle (do NOT violate)
**Review-as-reader MUST run on a runtime cloned from the document, never the author's live scene.**
The author's `scene.instances`, panels, workspace, dockview, and simulation are NOT touched while
previewing. Therefore there is NOTHING to snapshot or restore — Exit simply unmounts the overlay.
This is what makes the feature robust (it ends the whole "did I restore every piece of state?" class
of bug, incl. the metrics-dockview leak that sank the previous attempt).

## Scope (P3b — bounded)

IN:
- (A) Header **status badge** (sandbox/owner only) — display-only, opens the Publish dialog. Shows
  Draft / Unlisted / Public from the loaded doc's status/visibility (tracked in scene for DISPLAY).
- (B) **Publish dialog** — pre-publish settings + validation + entry into Review. Visibility
  (unlisted/public) + Opening view (Read/Explore) + a blocker/warning checks list + [Cancel]
  [Review as reader]. It produces a draft `{visibility, defaultEntry}` and exposes an internal
  `onConfirmDraft(draft)` seam wired to NOTHING in P3b (P3c connects it to saveCase). NO cloud save.
- (C) **usePreviewRuntime(doc)** — the isolated preview runtime: cloned instances + its OWN
  `useWorkbenchSimulation`, local active scenario / visibility / knob+volume updaters, and a reset to
  the doc-derived initial state. Pure-ish hook reusable by P3c public preview.
- (D) **PublishReviewOverlay** — full-surface overlay rendering the `applyPublishDraft`'d doc as a
  reader on the preview runtime: Read = `ReadingPresenter`, Explore = `PanelGrid mode="learner"`,
  with a Read|Explore switch, Reset, and Exit. Author scene untouched.
- (E) scene status/visibility tracking (DISPLAY only, for the badge); i18n en+ja; tokens
  (danger/warning); tests; ADR note. Tokens-only, Dark+Light.

OUT (P3c or later; do NOT start): `saveCase`/publish-to-cloud execution, Unpublish, public/unlisted
ROUTE behavior, copy-share-link, owner-opens-published edit path; pin UI; issue path→jump navigation;
runtime-snapshot envelope (forbidden by ADR D4). Visibility values: unlisted|public only.

## Decisions (locked)

### D1 — Header status badge (display + dialog entry; sandbox/owner only)
Render in the sandbox branch of `WorkbenchHeader` (left of the Save primary action), only when
`mode !== "learner"`. Pill: Draft (neutral `border-wb-line text-wb-subtle bg-wb-strip`) when no
status / `draft`; Unlisted/Public (accent `border-wb-accent/40 text-wb-accent bg-wb-accent-soft`)
when the loaded doc is `published`. Click → opens the Publish dialog. Tooltip "公開設定 / Publish
settings". In P3b the badge is DISPLAY-only (no save transitions it); a loaded already-published doc
shows published. This is the only new header element; Save primary stays unchanged.

### D2 — Publish dialog (mirror the meta-edit modal, `max-w-md`)
Sections:
1. Head: "公開前の確認 / Review for publishing" + subtitle ("読者にどう見えるかを確認します。 /
   Check how readers will see this.").
2. **公開範囲 / Visibility** — segmented unlisted|public (default current visibility if published, else
   unlisted). Captured into draft; a one-line hint that it applies when publishing (P3c). (Keep it in
   the publish-settings surface; it does not affect the reader view.)
3. **読者の最初の画面 / Opening view** — segmented Read / Explore. Initial =
   `doc.defaultEntry ?? derivePublishDefaultEntry(doc)`. Disable **Read** with an inline note when
   `!canUseReadExplore(doc)`. Copy: Read "読み物ノートがある場合に推奨 / Recommended when the case has
   a reading note"; Explore "Workbench から直接開始 / Start directly in the Workbench".
4. **チェック / Checks** — render `validatePublishableCase(reviewDoc)` where
   `reviewDoc = applyPublishDraft(buildCurrentDoc({defaultEntry}), {status:"published", visibility,
   defaultEntry})` (validate the draft-applied doc, so P3c can extend to status/visibility checks for
   free). Blockers in a `公開できません / Cannot publish yet` group (red, AlertCircle), warnings in a
   `警告 / Warnings` group (amber). `code`→`t(code)` (P3a keys); show `path` small/muted under each.
   When zero issues: subtle "✓ 公開できます / Ready to publish".
5. Footer: [キャンセル / Cancel] + primary **[読者として確認 / Review as reader]**. Review is enabled
   even with blockers (previewing a flawed case is useful); there is NO Publish CTA in P3b (saveCase =
   P3c). Pass the selected `{visibility, defaultEntry}` to `onReview(reviewDoc, defaultEntry)`.
Tokens-only; segmented like the metricsSpan buttons; Dark+Light.

### D3 — `usePreviewRuntime(doc)` is the isolated runtime
```
function usePreviewRuntime(doc: CaseDocument): {
  instances; activeInstanceId; setActive; toggleVisibility; updateKnobs; updateVolume; reset;
  simulation; // its own useWorkbenchSimulation(previewInstances)
}
```
- `instances` seeded once from `caseDocumentToSimInstances(doc)` (cloned); local active from
  `resolveAuthorActiveInstanceId(instances, instances[0]?.id, doc.initialActiveScenarioId)`.
- Its OWN `useWorkbenchSimulation(instances, noop)` → a separate PreviewController/worker driving live
  waveforms for the preview ONLY. Started on mount, stopped on unmount (the hook's existing cleanup).
- Local updaters mutate ONLY the preview `instances` state; they call NOTHING on the author scene and
  NEVER `markDocumentEdited`. `reset` re-derives instances+active from `doc`.
- Mounted only while the overlay is open, so the second worker exists only during review.

### D4 — `PublishReviewOverlay` (no live-scene mutation, Exit = unmount)
A full-surface overlay (above the workbench) driven by `usePreviewRuntime(reviewDoc)`:
- Header bar: "プレビュー中：読者ビュー / Preview: reader view" + Read|Explore switch (Read shown only
  when `canUseReadExplore(reviewDoc)`) + **リセット / Reset** + **編集に戻る / Exit**.
- Body: Read → `ReadingPresenter` over the preview runtime; Explore → `PanelGrid mode="learner"` over
  a PREVIEW-scoped panels/scene composition (build a preview panels state from `reviewDoc` so the board
  matches the doc; all document-op handlers are no-ops/hidden via `mode="learner"`; runtime handlers
  [active/visibility/knob] come from `usePreviewRuntime`).
- Initial presentation = `deriveReadExploreEntryMode(reviewDoc, {readOnly:true})` using the chosen entry.
- Exit unmounts the overlay (and its preview worker); the author's workbench is exactly as left because
  it was never touched. NO snapshot, NO restore, NO forceLearnerMode on the live scene.
- Tokens-only, Dark+Light. The reader model-limitations acknowledgment may show (existing reader behavior).

### D5 — Scene tracks status/visibility for the badge (display only)
Add `currentCaseStatus`/`currentCaseVisibility` to `useWorkbenchScene`, set in `replaceSceneFromDoc`
from `doc.status`/`doc.visibility`, returned in scene state. NO write path in P3b (no save). The badge
reads them. A fresh case = undefined = Draft.

### D6 — Tests + ADR
- `usePreviewRuntime` test (the CRITICAL one): mutating preview instances (knob/active/visibility) does
  NOT change the author's instances; `reset` returns to the doc-derived initial; entry derivation.
- `publishDialogState` pure helper test: blockers don't disable Review (Review always enabled), Read
  disabled when `!canUseReadExplore`, initial entry = `doc.defaultEntry ?? derive`, visibility default,
  the checks run on the `applyPublishDraft`'d doc.
- Badge state mapping test; i18n parity (en+ja).
- ADR-0007 P3 bullet: P3b shipped the publish dialog (settings + validation), an ISOLATED-runtime
  Review-as-reader, and the status badge; saveCase/publish-to-cloud + Unpublish + route polish remain P3c.

## Constraints
`npx tsc --noEmit` clean; full `npm test` green; `npm run build` green; `npm run verify:cases` 10/0;
tokens-only (no slate/sky/blue literals); i18n en+ja; Dark + Light verified. Lead browser-verifies on
the rebuild dev server (`dev-publish-review`, port 3018): owner sees the badge → dialog; Read disabled
without reading content; Review-as-reader opens the isolated overlay (live waveforms render via the
second worker); changing a slider INSIDE review does NOT change the author's workbench after Exit;
Reset returns the preview to initial; Exit returns to the untouched authoring view; learner mode shows
no badge. Verify Dark and Light.

## File layout (codex refines)
```
features/workbench/publish/
  PublishDialog.tsx          // settings + checks + [Cancel][Review as reader]
  PublishIssueList.tsx       // blockers/warnings, code->t(), small path
  publishDialogState.ts      // pure: derivePublishDialogState(doc,{status,visibility})
  PublishReviewOverlay.tsx   // isolated reader overlay
  usePreviewRuntime.ts       // cloned instances + own simulation + local updaters + reset
components/workbench/PublishStatusBadge.tsx   // header badge
components/workbench/WorkbenchHeader.tsx      // badge slot (sandbox only)
features/workbench/WorkbenchRoute.tsx         // dialog + overlay state wiring
features/workbench/hooks/useWorkbenchScene.ts // status/visibility (display)
index.css, locales/en|ja                      // tokens + keys
```

## Sequencing hint (codex refines)
1. D5 scene status/visibility + D1 badge (display) + dialog open/close.
2. D2 PublishDialog + PublishIssueList + publishDialogState + i18n + tokens.
3. D3 usePreviewRuntime (+ isolation test).
4. D4 PublishReviewOverlay + WorkbenchRoute wiring.
5. D6 remaining tests + ADR. Each commit independently green (tsc + npm test).
