# P3c FINAL plan — synthesized from codex 5.5 xhigh + opus 4.8 high (+ external proposal)

Lead synthesis of two independent plans. Where they agreed, that's the plan. Where they diverged,
the lead's decision + reasoning is given. This is the BINDING plan the implementer (codex 5.5 high)
executes. Branch `ux/publish-cloud` off main (P3a+P3b merged).

## Both planners converged on (= the plan)
- Extract ONE shared private `persistCaseToCloud(opts)` from `saveCurrentCaseToCloud`
  (useWorkbenchPersistence.ts ~L268-363: target resolution L274-295, saveCase L328, applySavedCase
  L336-357, navigate L359). `saveCurrentCaseToCloud`, `publishCurrentCase`, `unpublishCurrentCase`
  all call it. Preserve the EXACT current order (target→build→[draft]→saveCase→cacheCurrentDraft→
  applySavedCase→navigate). Do NOT rewrite caseCloud.ts; no firestore.rules change.
- `publishCurrentCase(draft)`: build fresh authoring doc `buildCurrentDoc({defaultEntry})` →
  `applyPublishDraft(doc,{status:"published",visibility:draft.visibility,defaultEntry})` → **D1 guard:
  `validatePublishableCase` + `isPublishable`; if blockers, abort BEFORE setIsSaving/saveCase, leave
  dialog open, return {ok:false,issues}** → `saveCase(publishedDoc, uid, {publish:true, visibility,
  kind:"case"})` → applySavedCase({...status:"published",visibility,defaultEntry}). Publish doc is built
  from AUTHORING state, never review-overlay runtime (D2).
- `PublishDialog`: wire the dead `onConfirmDraft` seam. Primary CTA label = `currentStatus==="published"
  ? Update : Publish`, `disabled = blockers>0 || isPublishing`, `onClick=onConfirmDraft(state.draft)`
  (the canonicalized draft from derivePublishDialogState, NOT reviewDoc). Review-as-reader stays enabled
  with blockers. Add `canPublish` to `publishDialogState` (= isPublishable(issues)).
- Copy-link: always render the share URL as selectable text; clipboard is an enhancement
  (`navigator.clipboard?.writeText` → graceful fallback, never block/throw). Absolute URL =
  `new URL(caseHref(caseId, locale), window.location.origin).toString()` (caseHref is relative).
- After publish: do NOT auto-redirect; stay; badge auto-updates (applySavedCase wrote status/visibility);
  show a success panel (Published·Unlisted/Public + URL + Copy link + Done). Reset success/copy state on
  dialog open/close and after Review-as-reader.
- Route/reader is the DERIVED experience (deriveReadExploreEntryMode honoring defaultEntry); no new route.
- Tests: dialog canPublish gating; persistence publish wiring with `saveCase` mocked (asserts args +
  D1-guard-skips-saveCase-on-blockers + applySavedCase status/visibility); route/header-mode resolver;
  copy-link absolute URL + clipboard fallback. tsc/test/build/verify:cases(10/0) green.

## Lead decisions on the divergences

### L1 — FIX the silent-unpublish-on-Save footgun (codex caught; opus missed). REQUIRED.
Today's Save forces `status:"draft", visibility:"private"`. Once publish exists, an owner who edits a
PUBLISHED case and hits the header Save would silently demote it to draft/private. Fix: the shared
`persistCaseToCloud` SAVE path must PRESERVE the current publication state — pass
`status: scene.currentCaseStatus ?? "draft"`, `visibility: scene.currentCaseVisibility ?? "private"`
(a never-saved case → draft/private as before; a published case → stays published at its visibility).
This is carried by the HELPER's opts, NOT by changing `buildCurrentDoc`'s defaults (avoids the
export-metadata-leak that sank an earlier attempt — export keeps calling buildCurrentDoc directly).
Model: **Save = persist content + keep publication state; Publish/Update = transition to published;
Unpublish = transition to draft.** (Save does not re-run the publish validator; editing a live case is
the owner's call — same as any CMS. The validator gates the publish TRANSITION only.)

### L2 — INCLUDE Unpublish in P3c (codex; my brief). UI + helper.
`unpublishCurrentCase()` requires an existing owned cloud case; builds a fresh doc with `status:"draft"`,
keeps `scene.currentCaseVisibility` (when public|unlisted), `saveCase(draftDoc, uid, {visibility, kind})`
with NO publish flag → applySavedCase status:"draft". UI: a quiet secondary "Unpublish" text button in the
dialog footer, shown ONLY when `currentStatus==="published"`, muted styling, NO confirmation (non-destructive
— content retained, reversible by re-publishing). Rationale over opus's defer-UI: L1 already requires an
explicit publication-state model, so the published→draft path must exist; Unpublish completes the lifecycle
cheaply via the shared helper and avoids a "published with no way back" trap. (opus's concern about footer
density is handled by muted secondary placement; external's "P3d" deferral is rejected for the same
lifecycle-completeness reason.)

### L3 — FIX ownership-gating for missing-author non-owner (codex caught; opus assumed no gap). REQUIRED.
`resolveHeaderModeFromAuthor` returns "sandbox" when author is empty (workbenchDefaults ~L270-275). So a
NON-owner opening a cloud-owned published case whose `author` is unset would get sandbox (edit chrome)
instead of learner. Fix headerMode derivation (useWorkbenchScene ~L158-161): a case that is cloud-owned by
someone else (`currentCaseOwnerId` present && `currentCaseOwnerId !== user.uid`) is ALWAYS "learner",
independent of author. Keep: owner → sandbox; local/unsaved → sandbox; official → learner. Add a pure
header-mode resolver + unit test covering owner-sandbox / non-owner-cloud-learner / missing-author /
official. This is the core "route polish" of P3c.

### L4 — publish-from-fresh-sandbox is allowed (opus R1). Verify in browser.
Publishing an unsaved owned sandbox = create+publish in one saveCase (rules `allow create` permits
status:"published"). The shared helper's create-user-case-id path handles it; the post-save navigate
reflects the new id. No code gap; lead browser-verifies the new-id navigation + badge coherence.

## File-by-file (synthesized)
| File | Change | Decision |
|---|---|---|
| features/workbench/hooks/useWorkbenchPersistence.ts | Extract `persistCaseToCloud(opts)`; re-express `saveCurrentCaseToCloud` on it (SAVE path preserves scene status/visibility — L1); add `publishCurrentCase(draft)` (+ D1 guard), `unpublishCurrentCase()`; add `isSavingCase` reuse + return new fns + share-url result. | D1,D2,D3,D4,L1,L2 |
| features/workbench/hooks/useWorkbenchScene.ts | Fix headerMode: non-owner of a cloud-owned case → learner regardless of author (extract a pure resolver). | D6,L3 |
| features/workbench/publish/publishDialogState.ts | Add `canPublish = isPublishable(issues)`. | D1,D5 |
| features/workbench/publish/PublishDialog.tsx | Publish/Update primary CTA (label by status, disabled by canPublish/isPublishing), wire onConfirmDraft(state.draft), isPublishing labels, success panel (URL+copy-link+Done), quiet Unpublish (published only). | D1,D4,D5,L2 |
| features/workbench/publish/publishShareLink.ts (NEW) | `buildShareUrl(caseId, locale, origin)` + `copyTextToClipboard(text)` (clipboard→execCommand→visible-URL fallback). | D4 |
| features/workbench/WorkbenchRoute.tsx | Wire onConfirmDraft→publishCurrentCase, onUnpublish→unpublishCurrentCase, isPublishing, publishSuccess+copy state (reset on open/close/review). No new route. | D3,D4 |
| locales/en|ja/translation.json | publish.dialog.{publish,update,publishing,updating,unpublish}, publish.success.{title,shareUrlLabel,copyLink,copied} — en+ja, parity. | E |
| docs/adr/0007-workbench-ia-redesign.md | P3c note: cloud publish/update/unpublish + copy-link + ownership-gating fix; reader=derived. | E |
| .claude/launch.json (NEW, out of code scope) | dev-publish-cloud port 3020. | constraints |
| __tests__/* | publishDialogState canPublish; persistence publish/unpublish wiring + D1-guard-no-saveCase + applySavedCase status/visibility + Save-preserves-published (L1); pure header-mode resolver (L3); publishShareLink absolute URL + clipboard fallback. | E |

No change: casePublish.ts, caseCloud.ts, readExplore.ts, PublishReviewOverlay.tsx, PublishStatusBadge.tsx,
WorkbenchHeader.tsx, firestore.rules.

## Commit sequencing (each independently green; inert-prop safe)
1. publishShareLink helper + i18n keys + its test.
2. persistence: extract persistCaseToCloud (SAVE byte-identical EXCEPT L1 preserve-status) + publishCurrentCase/
   unpublishCurrentCase + D1 guard + persistence tests (mock saveCase). UI still unwired.
3. headerMode ownership-gating fix (L3) + pure resolver test.
4. publishDialogState canPublish + PublishDialog CTA/success/copy-link/Unpublish + dialog tests.
5. WorkbenchRoute wiring (feature live) — lead browser-verifies here.
6. ADR + launch.json.

## Lead browser verification (Dark+Light, port 3020)
owner draft → dialog → Publish → badge=Published·Unlisted/Public + copy-link works; empty-title cannot
Publish (blocker) but CAN Review; **owner edits published case + header Save → stays Published (L1, not
silently unpublished)**; Unpublish → badge back to Draft; owner re-opens published → sandbox + "Update";
**non-owner opens a published case → learner read-only honoring defaultEntry, NO publish badge (incl an
author-less case — L3)**; render-loop console check on the new success state/effect.
