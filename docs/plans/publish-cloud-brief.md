# P3c Cloud publish wiring + route polish — lead design brief (binding scope + decisions)

Branch `ux/publish-cloud` off main (P3a #144 + P3b #148 merged). Final PR of the 3-PR P3 split
(P3a domain/validator → P3b dialog + isolated review → **P3c cloud publish + route polish**).

This brief is the LEAD's locked scope + product/UX decisions. It is given to TWO INDEPENDENT
PLANNERS (codex 5.5 xhigh and opus 4.8 high); each expands it into a file-by-file implementation
plan. The lead then compares the two plans and synthesizes the final. Planners: do NOT change the
locked decisions; DO propose the HOW (files, sequencing, the shared-helper question, route handling,
tests, risks). Read the actual code to ground every claim.

## What already exists (verified on this main; planners re-verify)
- P3a domain: `features/workbench/casePublish.ts` → `validatePublishableCase(doc): PublishIssue[]`,
  `isPublishable(issues)`, `derivePublishDefaultEntry(doc)`, `applyPublishDraft(doc,{status,visibility,
  defaultEntry})` (omits defaultEntry when == derived). `CaseDocument.defaultEntry`.
- P3b UI: `features/workbench/publish/PublishDialog.tsx` has an **UNWIRED `onConfirmDraft?: (draft:
  PublishDialogDraft) => void` seam** (currently `_onConfirmDraft`); active CTAs are `[Cancel][Review
  as reader]`. `publishDialogState.ts` `derivePublishDialogState(baseDoc, draft)` → `reviewDoc =
  applyPublishDraft'd doc`, blockers/warnings, `reviewEnabled:true`. `PublishReviewOverlay` (isolated
  runtime — do NOT touch). `PublishStatusBadge` (draft/unlisted/public from status/visibility).
- Scene (`useWorkbenchScene`): tracks `currentCaseStatus`/`currentCaseVisibility` (set in
  replaceSceneFromDoc AND applySavedCase; `SavedCasePayload` carries status/visibility) — so a save
  that returns published status updates the badge.
- Cloud (`caseCloud.ts`): `saveCase(doc, uid, {publish?,visibility?,kind?})` — `publish:true` sets
  status:"published"; visibility from opts/doc. `fetchCase` returns published|draft + merges trusted
  status/visibility/ownerId. `listCaseSummaries({ownerUid})` = all owner cases; `({visibility:"public"})`
  = published+public only (UNLISTED excluded from listing by `canListCase`, but readable by direct link
  via `canReadCase`). firestore.rules ALREADY permit owner publish/unpublish via update (createdAt/ownerId
  immutable; non-admin can't set official). `publishedAt` is an optional rules field, NOT yet captured.
- Save path (`useWorkbenchPersistence.saveCurrentCaseToCloud`): resolves target (update-owner-case vs
  `createUserCaseId`), source/derivedFrom, currently ALWAYS `saveCase(nextDoc, uid, {visibility:"private",
  kind:"case"})` with status:"draft" — NO publish wiring. Then `scene.applySavedCase({...status,visibility})`
  + `navigate(caseHref(caseId, locale))`. `signedInUserForCaseSave()` signs in if needed. `runHeaderPrimaryAction`:
  learner→fork(copy), sandbox→save. NOTE: the abandoned ux/publish-dialog branch had extracted a shared
  `persistCaseToCloud` helper for Save/Publish/Unpublish — that refactor was NOT merged; main still has only
  `saveCurrentCaseToCloud`.
- Route: single `/workbench/:caseId` (index.tsx) for owner-edit AND reader; mode derived from ownership.
  Non-owner of a published user case → headerMode "learner" (read-only reader; Read|Explore if reading
  content). Owner of own published case → "sandbox" (edit, badge shown). Official → learner+trusted.
  `caseHref(id, locale)` builds the share URL. NO copy-link UI anywhere.

## P3c goal (completion criteria)
Author opens the Publish dialog → picks visibility + opening view → if no blockers, **Publish** →
`saveCase({publish:true})` persists status:"published" + chosen visibility + defaultEntry → afterward the
badge / status / visibility / share URL are consistent → opening the published case as a reader starts in
Read/Explore per `defaultEntry` → the owner re-opening their published case keeps a working edit path.

## Scope (P3c — bounded)

IN:
- (A) **Publish CTA wiring**: wire `PublishDialog`'s `onConfirmDraft` to a real publish. Add the Publish
  button (draft→"Publish", already-published→"Update"), disabled when blockers exist; Review-as-reader
  stays enabled with blockers. Double-submit guarded.
- (B) **`publishCurrentCase(draft)` (+ `unpublishCurrentCase()`) in `useWorkbenchPersistence`**: build the
  publish doc FRESH from authoring state (`buildCurrentDoc({defaultEntry})`) → `applyPublishDraft(...,
  {status:"published", visibility, defaultEntry})` → **re-run `validatePublishableCase` and DO NOT call
  saveCase if blockers** → `saveCase(publishedDoc, uid, {publish:true, visibility, kind})` →
  `applySavedCase({...status:"published", visibility, defaultEntry})` so the badge updates. Reuse
  `signedInUserForCaseSave`. The publish doc MUST NOT include any Review-overlay runtime state (review is
  isolated; publish builds from the authoring scene). Unpublish = save with status:"draft" (keep current
  visibility), NO publish flag.
- (C) **Publish-success affordance**: do NOT auto-navigate to the reader; stay in place. Update the header
  badge (via the applySavedCase status/visibility), show a success indication, and a **copy-link** for the
  share URL (`caseHref` → absolute URL; clipboard with a visible-URL fallback). Owner stays in sandbox.
- (D) **Route/behavior verification + fixes**: confirm (and fix any gap) that a non-owner opening a
  published public/unlisted case lands in learner read-only with `defaultEntry` honored; the owner opening
  their own published case is sandbox/edit; official is unchanged; fork-vs-publish CTAs are not confusing
  (learner sees Fork, owner sees Save + the publish badge). Lead browser-verifies this.
- (E) tests (dialog canPublish gating; persistence publish/unpublish wiring incl the re-validate-blocker
  guard + applySavedCase status/visibility + no-saveCase-on-blocker; route/entry behavior); i18n en+ja for
  new strings (publish / update / unpublish / copy-link / published-success); Dark+Light; ADR-0007 P3 note.

OUT (do NOT build): pin UI; public-gallery/community redesign; permission-model changes; archive;
surfacing/using `publishedAt` (optional — a planner may note it but it is not required); re-designing the
isolated review runtime; large `saveCase` rewrites; any publication runtime-snapshot envelope (forbidden by
ADR D4). Visibility values remain unlisted|public only ("official" is admin, never in this UI; "private" =
not published). firestore.rules deployment is owner-side (out of code scope) — the rules already permit the
transitions; just note if a rules change is needed (it should not be).

## Decisions (locked) — the WHAT; planners propose the HOW

### D1 — Validator runs at the SAVE boundary, not just in the UI
`publishCurrentCase` MUST re-run `validatePublishableCase` on the freshly-built publish doc and refuse to
call `saveCase` if `!isPublishable`. The dialog's disabled-Publish-on-blockers is a UX nicety; the
save-boundary guard is the real invariant (the doc can change between dialog open and click). This includes
the P3a `model-limitations-empty` blocker.

### D2 — Publish builds from authoring state, never review-runtime state
The published document is `applyPublishDraft(buildCurrentDoc({defaultEntry}), {...})`. Review-as-reader is
an isolated preview; nothing the reviewer touched leaks into the publish payload. (Same buildCurrentDoc the
dialog already uses to derive its reviewDoc.)

### D3 — Reuse a single cloud-persist path for Save/Publish/Unpublish (no duplicated target logic)
`saveCurrentCaseToCloud` already encodes target resolution (update-owner vs create-user-case-id),
source/derivedFrom, applySavedCase, navigate. Publish/Unpublish MUST share that logic (extract a common
internal helper like the abandoned branch's `persistCaseToCloud({status,visibility,publish?,applyDraft?})`),
NOT reimplement it. Each planner proposes the exact factoring; duplication is a defect.

### D4 — After publish: stay, update badge, offer copy-link; do NOT auto-redirect
The author may keep editing. On success: close/transition the dialog, badge reflects Published·Unlisted/Public,
a success state offers Copy link (+ optionally Review-as-reader). No route change beyond the existing
post-save `navigate(caseHref(...))` that reflects the (possibly new) case id — keep that as save does today.

### D5 — Draft→Publish / Published→Update / Unpublish; visibility unlisted|public; entry preselect = derived
Dialog opened on a published case preselects current visibility + current/derived defaultEntry, primary CTA
label = "Update"; on a draft, primary = "Publish". Unpublish (published→draft) is a quiet secondary action.
Entry initial = `doc.defaultEntry ?? derivePublishDefaultEntry(doc)`; Read disabled when `!canUseReadExplore`.

### D6 — Reader experience is the DERIVED one (no new reader chrome required)
Opening a published case as a reader uses the EXISTING learner read-only + Read|Explore machinery with
`deriveReadExploreEntryMode(doc,{readOnly:true})` honoring `defaultEntry`. P3c verifies this end-to-end; it
does NOT add a new reader route or reader-only UI. (A small "published" indicator for the reader is OPTIONAL,
not required.)

## Constraints
`npx tsc --noEmit` clean; full `npm test` green; `npm run build` green; `npm run verify:cases` 10/0;
tokens-only (no slate/sky/blue literals); i18n en+ja; Dark+Light verified. Lead browser-verifies (dev
`dev-publish-cloud`, port 3020 — add to .claude/launch.json): owner draft → Publish dialog → Publish →
badge becomes Published·Unlisted/Public + copy-link works; an empty-title doc cannot Publish (blocker) but
CAN Review; owner re-opens published → edit + "Update"; (auth: publishing requires sign-in via the existing
Google flow). Render-loop console check on any new hook/effect (P3b lesson: node tests miss render loops).

## Each planner must deliver
1. File-by-file change list (path, change, which decision D1-D6 it serves) incl any new helper.
2. The exact publish/unpublish action sequence (function calls + args) and the shared-helper factoring (D3).
3. PublishDialog changes (CTA, isPublishing, onConfirmDraft, published-vs-draft labels, success/copy-link).
4. WorkbenchRoute wiring (onConfirmDraft → persistence.publishCurrentCase; success state; copy-link).
5. The save-boundary re-validation guard (D1) + how blockers abort without saveCase.
6. Route/owner-vs-reader verification points (what to assert/fix) (D4/D6).
7. i18n keys (en+ja) + token usage for any new UI (success state, copy-link, unpublish).
8. Test plan (dialog gating, persistence wiring + guard, applySavedCase status/visibility, route/entry).
9. Commit sequencing, each independently green.
10. Risks/ambiguities + recommended resolutions (esp. the shared-helper factoring, copy-link clipboard
    fallback, and whether Unpublish belongs in P3c or should be deferred — give a clear recommendation).
