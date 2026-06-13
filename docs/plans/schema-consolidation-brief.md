# Schema consolidation — lead design brief (binding decisions)

Branch `ux/dogfood-and-fixtures` (already carries the dogfood teaching-case fixture +
the author-helper extension, commit 5b79687, off merged ADR-0007 main).

This brief is the LEAD's locked design. codex 5.5 xhigh expands it into an
implementation plan (file-by-file, sequencing, test list, risks); it does NOT
re-decide these. **Pre-alpha context: ZERO users, ZERO saved documents** — we may
break the saved-document schema freely, with NO migration of legacy docs. The only
docs in-repo are `officialCases.ts` (+ the new fixture); they get regenerated to the
new schema in this same PR.

## Scope (bounded — do NOT exceed)

IN: (1) reshape `WorkbenchWorkspace` to a host-based schema and drop dead/positional
state; (2) make `ScenarioBinding` a `kind`-discriminated union; (3) delete the
zero-value legacy-compat scaffolding; (4) a save→load→resave idempotence golden test;
(5) ADR-0007 updates recording these; (6) regenerate official cases + the fixture to
the new schema.

OUT (explicitly NOT this PR): full PanelDef dissolution / engine CaseDocument-bridge
rework (gated, large, later); publish domain/validator and publish/pin UI (later P3
PRs); the F1 disease-preset library (content work); the F3 button-option labeling fix
(small, separate). Record these as follow-ups, do not start them.

## Decisions (locked)

### D1 — Workspace becomes host-based; positions and controlsSide are deleted
`WorkbenchWorkspace.regions[].position` is an ADR-0003 four-zone-dockview leftover.
Under ADR-0007 zone position is an IA INVARIANT, not document state, so it must not be
persisted. `controlsSide` (already hardcoded `'right'`, the left/right swap was removed
in P1c) is dead. Target shape (bump `WORKSPACE_SCHEMA_VERSION` to 2):

```ts
interface WorkbenchWorkspace {
  schemaVersion: 2;
  hosts: {
    note:      { open: boolean };
    rightRail: { open: boolean; scenarioListCollapsed?: boolean };
    metrics:   { open: boolean; span?: "main" | "full" };
    main:      { dockviewState?: DockviewViewState };   // was viewStates.main
  };
  learnerLocked?: boolean;
}
```

- Drop `regions`, `WorkbenchRegionState`, `WorkbenchRegionPosition`, `position`,
  `viewState`/`viewStates`, and `controlsSide` from the canonical model and from
  `WorkbenchLayoutState` where they only proxied positions. Keep the LOCAL
  `WorkbenchLayoutState` sash sizes (note/rail/metrics/scenarioList px + ratios) —
  those are local non-canonical UI state and stay (they are not in the document).
- `rightRail.open` replaces the `regions.control.visible` proxy AND fixes the
  reviewer's note in one move (rail visibility is now a first-class rail host flag, not
  a CONTROLS-region proxy — no scenario/control ambiguity).
- `mainDockviewViewStatesOnly` collapses into "only `hosts.main.dockviewState` is
  persisted" (graph board state only; side/bottom/rail never were canonical).
- Save path (`simInstancesToCaseDocument` / `buildCurrentDoc`) writes the new shape;
  `layoutStateFromWorkspace` reads `hosts.*`. No legacy fallback.

### D2 — Delete the legacy-compat scaffolding (no users to protect)
- Remove `normalizeWorkspaceForAdr0007` and the legacy-position mapping entirely.
- Loading a document whose `workspace` is absent → derive a fresh default host state
  from panels (as today's `defaultWorkspaceForPanels` does, minus positions).
- Loading a document with an OLD-shaped workspace (schemaVersion 1 / `regions`) is NOT
  supported — there are none. If `caseDoc` validation sees `workspace.schemaVersion`
  other than 2, treat workspace as absent and rebuild default (do NOT crash the whole
  doc load; workspace is non-canonical). Keep the CASE_SCHEMA_VERSION load guard as is.

### D3 — `ScenarioBinding` becomes a `kind`-discriminated union
```ts
type ScenarioBinding = { kind: "active" } | { kind: "scenario"; scenarioId: string };
```
Replace `{ slot: "active" } | { scenarioId }` everywhere: `viewSpec.ts`,
`remapViewSpecIds`, `controllerBinding.ts` (`resolveControllerTargetId`), the seed
factories (`authoredViews.ts` `standardControllerView`), the fixture's controller view,
and any tests. Behavior is unchanged; this is a shape/readability change taken now
because it's free (zero stored docs). Default everywhere remains `{ kind: "active" }`.

### D4 — Reproducibility stays in the document's own state (NO snapshot envelope)
Lock this as an explicit ADR note so the later publish PR doesn't reintroduce
duplication: reproducibility = the document's scenario state (`instances` params/knobs)
+ `initialActiveScenarioId` + per-scenario visibility. There is NO separate
`publication.initialRuntime` / `PublishedRuntimeSnapshot` envelope — that would
duplicate `instances` and recreate the semi-canonical state we just removed.
Reset-to-author already derives its snapshot from the loaded doc at load time; keep it.
Publish (future PR) is a visibility/ownership/default-entry TRANSITION on the same
document, not a frozen parallel copy. (Read|Explore default entry stays DERIVED via
`deriveReadExploreEntryMode`; an explicit author override is a future publish-PR field,
not this PR.)

### D5 — Golden idempotence test (the one test everyone agrees on)
Add a test that builds a NEW-format doc (use the dogfood fixture or a hand doc with
views / graphBoardLayout / reading / view_ref note / initialActiveScenarioId /
host-state workspace / a `{kind:"scenario"}` pinned binding), runs
load → save → load → save, and asserts the canonical parts are byte-stable across the
second round-trip (no drift): views, graphBoardLayout, initialActiveScenarioId,
reading, notes (incl. view_ref viewId), workspace host state, binding shape.

### D6 — Regenerate the in-repo content to the new schema
Update `officialCases.ts` (helper + every case) and the dogfood fixture so they emit
the new workspace host shape and `{kind:...}` bindings. Existing official-case tests
and `officialAfterloadCase.test.ts` updated to the new shapes (do not weaken their
assertions; re-point them).

## Constraints
`npx tsc --noEmit` clean; `npm test` green; `npm run build` green; tokens-only for any
incidental UI; i18n en+ja if any string changes; no new slate/sky/blue literals. The
lead browser-re-verifies the dogfood case still opens (Read entry, live view_ref
control, Explore board, Read↔Explore carry) after the reshape, before merge.
