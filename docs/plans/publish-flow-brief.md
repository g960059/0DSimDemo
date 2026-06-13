# P3 Publish Flow — lead design brief (binding decisions)

Branch `ux/publish-flow` off main (94c3851, post schema-consolidation #139).

Lead-locked design (Claude owns IA/UX/design; codex executes). codex 5.5 xhigh expands the
**P3a** section into a file-by-file plan; it does NOT re-decide locked decisions or change
scope. plan_review gate (codex 5.5 high + opus 4.8 high + lead) vets the plan before coding.

**Pre-alpha: ZERO users, ZERO saved docs.** The publish DOMAIN already exists from F10
cloud-share: `CaseDocument.{status,visibility,ownerId,source,derivedFrom}` (caseDoc.ts:145-150),
`saveCase(doc, ownerUid, {publish?,visibility?,kind?})` (caseCloud.ts:184), `fetchCase`
(caseCloud.ts:260), `listCaseSummaries` (caseCloud.ts:322), owner-based firestore.rules.
P3 fills the GAPS and wires the domain to the reader experience and a UI.

## ADR-0007 P3 (verbatim, L183)
"publish flow: visibility, ownership, default-entry transitions, and any explicit author
override for Read/Explore entry. No parallel runtime snapshot envelope."

## P3 is split into THREE small PRs (safer review, small blast radius)
- **P3a — publish domain + validator** (THIS brief / THIS PR). Pure functions, NO publish UI,
  NO cloud-save wiring. The semantics + validation land first.
- **P3b — Publish dialog + "Review as reader"** (next PR). The modal that selects visibility /
  default-entry and renders validator results, plus a read-only preview at the chosen entry.
- **P3c — cloud / public-route polish** (final PR). Wire `validatePublishableCase` into the
  `saveCase` publish path; unlisted/public route behavior; owner-opens-own-published; fork-vs-
  publish CTA disambiguation; public-route → learner-mode smoke.

This brief fully specifies **P3a**. P3b/P3c are sketched at the end as committed follow-ons
(their own briefs come later); do NOT build them now.

---

## P3a scope (bounded — do NOT exceed)

IN:
- (A) **Default-entry override field** + wiring into entry derivation (behavior-preserving when absent).
- (B) **`derivePublishDefaultEntry(doc)`** — the default the P3b dialog will preselect.
- (C) **Publish validator** — `validatePublishableCase(doc): PublishIssue[]`, a pure REFERENTIAL-
  INTEGRITY + required-field check. This is the heart of P3a.
- (D) **`applyPublishDraft(doc, draft): CaseDocument`** — pure transition (no cloud write).
- (E) `defaultEntry` round-trips local (`casePersist`) + cloud (`caseCloud` save/fetch); unit tests;
  ADR-0007 update; i18n keys registered (en+ja) for issue `code`s even though no modal renders yet.

OUT of P3a (P3b/P3c or later follow-ups, do NOT start now): the Publish modal/dialog; Review-as-
reader preview; wiring the validator into `saveCase`; route/CTA polish; pin UI; removing dead
`learnerLocked`; `publishedAt`; lesson publish parity; admin "official" promotion; raw-parameter-
exposed & mobile-heavy warnings (deferred — see D3 notes); any runtime-snapshot envelope (forbidden).

## Decisions (locked) — P3a

### D1 — Default-entry override is a top-level canonical field
`CaseDocument.defaultEntry?: "read" | "explore"` (reuse `ReadExploreMode` from readExplore.ts).
Optional; **omitted = derive as today.** Top-level (NOT nested in `reading`, NOT in the non-
canonical `workspace`) because the ADR frames default entry as a document-level SHARE property and
reading content can come from `reading` OR notes (`hasCaseReadingContent` checks both). The override
selects only among VALID modes; it can never manufacture a Read view with no reading content (D2).

### D2 — `deriveReadExploreEntryMode` honors the override, behavior-preserving when absent
Keep signature `(doc, { readOnly })`; add `defaultEntry` to the `ReadExploreDoc` Pick. New body:
```
if (!readOnly) return "explore";                 // author/sandbox edits in Explore
const canRead = canUseReadExplore(doc);
if (doc.defaultEntry === "explore") return "explore";
if (doc.defaultEntry === "read")   return canRead ? "read" : "explore";
return canRead ? "read" : "explore";             // derive — unchanged from today
```
When `defaultEntry` is undefined the output is byte-identical to today — EXISTING readExplore /
officialAfterloadCase tests must stay green UNCHANGED.

### D2b — `derivePublishDefaultEntry(doc): "read" | "explore"`
```
export function derivePublishDefaultEntry(doc: CaseDocument): ReadExploreMode {
  return canUseReadExplore(doc) ? "read" : "explore";
}
```
Pure; this is the value the P3b dialog preselects (author may then override → writes D1 field).

### D3 — Publish validator: pure referential-integrity + required-field check
New module `features/workbench/casePublish.ts`:
```ts
export type PublishIssueSeverity = "blocker" | "warning";
export interface PublishIssue {
  severity: PublishIssueSeverity;
  code: string;          // stable i18n KEY (UI maps code -> localized string), NOT prose
  path?: string;         // points at the offending ref, e.g. "graphBoardLayout.leaf:p7" / "reading.column[2]"
}
export function validatePublishableCase(doc: CaseDocument): PublishIssue[]
export const isPublishable = (issues: PublishIssue[]) => !issues.some(i => i.severity === "blocker");
```
The blocker set is the document's INTERNAL REFERENCE GRAPH resolving — i.e. promote the existing
test helper `expectInternalReferencesToResolve` (`__tests__/officialAfterloadCase.test.ts:17`) from
"throw on bad ref" into "return PublishIssue[]". This is exactly the #139 bug class (a ref the live
app silently drops), now blocked at publish.

**Blockers** (each emits a `path`):
- `publish.blocker.missing-title` — `meta.title` blank/whitespace.
- `publish.blocker.no-scenarios` — `instances.length < 1`.
- `publish.blocker.dangling-initial-active` — `initialActiveScenarioId` set but not an instance id.
- `publish.blocker.dangling-graph-leaf` — a `graphBoardLayout` leaf is not a graph panel id
  (`graphPanelsOnly(doc.panels)` ids) — the #139 check.
- `publish.blocker.dangling-reading-ref` — a `reading.column` `noteRef`/`paneRef`/`viewRef` does not
  resolve (note id / panel id / view id respectively).
- `publish.blocker.dangling-note-view-ref` — a note `view_ref` (`collectNoteViewRefIds`) points at a
  non-existent ViewSpec id.
- `publish.blocker.dangling-controller-pin` — a controller `binding.kind === "scenario"` whose
  `scenarioId` is not an instance id.
- `publish.blocker.dangling-membership` — a graph/metrics view `membership` key not an instance id.

**Warnings** (advisory; publish still allowed):
- `publish.warning.no-reading-content` — published doc has no note/reading → reader opens read-only
  Explore (informational).
- `publish.warning.active-scenario-hidden` — `initialActiveScenarioId`'s scenario is hidden by its
  visibility (reader's first view shows it greyed/absent).
- `publish.warning.empty-view` — a metrics view with no `metrics` or a controller view with no
  `items` (`path` names the view) — nothing renders.
- `publish.warning.model-limitations-empty` — `meta`/spec model limitations empty. WARNING not blocker
  (the save path fills `DEFAULT_MODEL_LIMITATIONS` when empty, so a blocker would nag without value).
- `publish.warning.pinned-binding-used` — a controller uses `{kind:"scenario"}` (advisory: the reader
  will not see active-following on that control).

DEFERRED (NOT in P3a — record as follow-ups): `raw-parameter-exposed` (needs a definition of which
controller item types are "raw" vs curated — ADR-0006), `graph-board-mobile-heavy` (no reliable
metric). Both were proposed by review; we defer rather than guess.

Validator is PURE (no I/O), unit-tested via a truth table (one crafted broken doc per code; a clean
official case → `[]`).

### D4 — `applyPublishDraft` is a pure transition (no cloud write in P3a)
```ts
export interface PublishDraft {
  status: "published";
  visibility: Extract<CaseVisibility, "unlisted" | "public">;  // NOT "private"/"official"
  defaultEntry: ReadExploreMode;
}
export function applyPublishDraft(doc: CaseDocument, draft: PublishDraft): CaseDocument
```
Returns a new doc with `status`/`visibility` set and `defaultEntry` written (or omitted when it
equals `derivePublishDefaultEntry(doc)` — keep omit-default idempotence like the schema-consolidation
work). No mutation, no `saveCase`. P3c later calls `saveCase` AFTER validating + applying.

### D5 — Persistence round-trip for `defaultEntry`
`defaultEntry` must survive local `casePersist` serialize→parse AND cloud `caseDocFields`→`fetchCase`
parse (it rides in `content`, NOT a new queryable column — it is reader presentation). Add parse-guard
coverage if `casePersist`/`caseCloud` validate optional fields; otherwise confirm it passes through.

### D6 — Tests + ADR
- `casePublish.test.ts`: truth table for every blocker + warning code (crafted broken docs), a clean
  official case → `[]`, `isPublishable` semantics, `applyPublishDraft` omit-default idempotence,
  `derivePublishDefaultEntry` for note vs no-note docs.
- `readExplore.test.ts`: ADD `defaultEntry` override cases (read honored w/ reading content; read→explore
  fallback w/o; explore override; undefined = derive unchanged). Existing cases untouched & green.
- Round-trip test: `defaultEntry` preserved local + cloud-shape.
- Update `docs/adr/0007-workbench-ia-redesign.md` P3 bullet to record the 3-PR split, the top-level
  `defaultEntry` field, and `validatePublishableCase`; restate the no-snapshot-envelope invariant.

## Constraints (P3a)
`npx tsc --noEmit` clean; full `npm test` green; `npm run build` green; `npm run verify:cases` stays
10/0; i18n keys registered en+ja (even with no modal yet); no UI changes that touch tokens (P3a is
domain-only). No header/route changes in P3a.

## Sequencing hint (codex refines) — P3a commits
1. D1 field + D2 wiring + readExplore tests (behavior-preserving).
2. D3 validator module + D2b derive + truth-table tests.
3. D4 applyPublishDraft + idempotence test.
4. D5 round-trip + D6 ADR/i18n keys.
Each commit independently green (tsc + test).

---

## Follow-on PRs (NOT this PR — sketch only, briefs come later)

**P3b — Publish dialog + Review as reader.** Owner/sandbox-only header control opening a modal:
Visibility (Unlisted/Public), Default entry (Read/Explore, Read disabled when `!canUseReadExplore`),
a Checks panel rendering `validatePublishableCase` (blockers disable Publish, warnings allow with ⚠),
and a **"Review as reader"** action that previews the current doc read-only at the chosen default
entry (reuse existing read-only + Read/Explore machinery — NO new mode). Reuse `signedInUserForCaseSave`.
Tokens-only, Dark+Light, i18n en+ja. A compact status badge (Draft / Published·Public…) in the header.

**P3c — cloud / public-route polish.** Run `validatePublishableCase` before any `saveCase({publish})`;
tidy unlisted/public route behavior; owner-opens-own-published edit path; disambiguate Fork vs Publish
CTAs; published-case → learner-mode smoke tests.
