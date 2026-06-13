# ADR-0005 — One CaseDocument, two presentations (Reading / Studio)

- Status: **Accepted** (direction; revised 2026-06-05 after a 2-reviewer gate)
- Date: 2026-06-05
- Builds on: [ADR-0003](0003-workbench-layout-engine.md) (Dockview zones — **now scoped to Studio**, see "Supersedes" below), [ADR-0004](0004-case-workspace-canonical-schema.md) (canonical CaseDocument)
- Gate note: drafted, then both reviewers (opus + codex) returned REQUEST-CHANGES on the keystone (over-claimed "no drift", a factual conversion error, an under-specified net-new schema, an ADR-0003 contradiction, and a sequencing trap). This revision incorporates those findings.

> **Status note (2026-06-11):** Partially superseded by [ADR-0007](0007-workbench-ia-redesign.md). Shared read-only Explore is now the Workbench read-only entrance; note-backed documents use a Read | Explore switcher; Compare-as-state is confirmed.

## Context
The desktop workbench was rebuilt on Dockview with fixed role-region zones (ADR-0003). The lesson player is a **separate, hardcoded 2-column layout** (`components/LessonPlayer.tsx`) that recomputes its own panel configs and chart props and will permanently drift from the workbench renderer. Official/community cases that a learner only *reads* have no first-class home.

An earlier direction — mount the Dockview workbench in `mode="learner"` for lessons — carries a real risk: per-step panel masking changes the Dockview structure signature and causes relayout flicker / perf cost / chrome-leak, and it over-chromes what is fundamentally a *reading* experience.

The product is ~80% learners who **read** (lesson, official case, community case) and ~20% authors who **make** (sandbox, owned/remixed cases). Those are two different intents, not one layout with a flag.

## Decision
A single canonical **CaseDocument** has **two presentations**, chosen by intent/provenance.

### Reading presentation (consume: lesson, official case, community case)
- A **single-column vertical article** ("rich Medium-like" reading). Panes stack in a defined column order and render top-to-bottom.
- **Auto-ref**: the column order is converted to inline note pane-refs automatically (basic path; manual in-prose refs are a future power-feature). Multiple `note` panes may sit in the column so prose interleaves with panes (text → graph → text → graph).
- **No structural editing**: no add/remove pane, no graph-item editing, no rearrange.
- **Controller is collapsed by default and pulled out on demand** as a *partial* drawer so the relevant graph stays visible (preserves the "turn a knob → watch the waveform react" loop). **Discoverability rule:** the first exposed controller in a reading case (or the controller a section exposes) renders **expanded on first view** and collapses after the first interaction; thereafter it peeks/pulses when its section is in view. (Mitigates the "hidden behind a drawer" discovery risk for the 80% audience.)
- **PC and mobile reading are the same single column** → responsive-trivial, one renderer.
- Reading is **NOT** rendered through Dockview — so the docking flicker/perf/chrome-leak risk does not exist here.
- **No-prose fallback**: a reading case with no `reading.column` and no authored note renders a default column derived from `panels` in `PanelDef[]` **array order**, grouped by role (graph(s) → output → control), with notes (if any) first.
- **Lesson = the reading presentation of a CaseDocument that has a `lesson` layer (steps)**. This supersedes the bespoke `LessonPlayer` — *but only after the sequencing gate below is met*.

### Studio presentation (make: sandbox, owned/remixed cases, authoring)
- **Editable**; a somewhat denser IA is acceptable.
- **PC**: Dockview role-zones (ADR-0003) — add/remove/resize within zones, zone-local add.
- **Mobile**: graph splits become **persistent flattened tabs** (always one graph visible); `note` / `metrics` / `controller` live in drawers (global settings + the summoned controller). Studio mobile differs from reading mobile **only in editability** — nearly the same shell.

### Shared renderer — what is and is NOT drift-proof
The pane **content** renderer (`renderPanel` + Charts) is shared, so **pane content (chart options, signals drawn, axis/guide config) cannot drift** between presentations or form factors. This is the only structural guarantee. It is **not** a blanket "no drift" claim: the following are presentation-side and must be specified to avoid drift, not assumed safe:
- **Placement/order** (1-column flatten vs zones vs tabs) — different code paths; a chart correct in a wide `main` zone may clip at single-column width.
- **Masking/visibility** (per-step `visibleInstances` / `visiblePanels`) — today done by `maskConfig` in `LessonPlayer`; must be reproduced as a shared masking step over `PanelDef[]`, not re-implemented per presentation.
- **Per-pane signal config** (`PanelDef.config[...].selectedSignals`) — must be carried untouched through both conversions.
- **Legend behavior** (identity / mute / edit-target) — a new primary-surface affordance that must exist in Reading too.

### Conversion — a fidelity contract, not "lossless"
Conversion is **content-preserving and layout-regenerating**, NOT a lossless geometric round-trip. The zone for a pane is derived from its `PanelType` via `defaultZoneOf(panel.type)` (`paneZone.ts`; role→zone is *not* a function today — the key is `type`). Intra-role/intra-zone ordering uses `PanelDef[]` array order as the authoritative tiebreaker.

- **studio → reading**: emit `reading.column` from zone layout flattened in (role group, array order); drop Dockview view state.
- **reading → studio**: assign each pane a zone via `defaultZoneOf(panel.type)`; **regenerate** a default Dockview layout (author then re-arranges).
- **fork/remix** of a reading case = reading → studio. **publish-as-lesson** = studio → reading.

**Round-trip fidelity table:**

| State | studio→reading | reading→studio | survives round-trip? |
|---|---|---|---|
| pane set (`panels` ids/types) | preserved | preserved | ✅ |
| per-pane `config.selectedSignals` & chart options | preserved | preserved | ✅ (must be carried untouched) |
| notes / prose & interleave (`reading.column` + note panes) | preserved | preserved | ✅ |
| instances | preserved | preserved | ✅ |
| `reading.column` order | authored/derived | preserved | ✅ |
| Dockview `workspace.viewStates` (geometry, splits, active tab) | **dropped** (non-canonical, ADR-0004) | **regenerated** (default) | ❌ by design |
| exact zone geometry / pixel sizes | dropped | regenerated | ❌ by design |

The contract: **content (panes, signals, notes, instances, reading order) is idempotent across round-trips; layout geometry is regenerated, not restored.** This is acceptable because Dockview JSON is already declared non-canonical (ADR-0004).

### New canonical schema (net-new — this ADR introduces it)
Add a presentation-agnostic Reading manifest to `CaseDocument`:

```ts
reading?: {
  schemaVersion: 1;
  column: Array<
    | { kind: 'paneRef'; panelId: string; generated?: boolean }
    | { kind: 'noteRef'; noteId: string }
  >;
};
exposedControllers?: Array<{
  paramKeys: string[];                 // or controllerItem ids
  targetPolicy: 'fixedInstance' | 'legendEditTarget';
  instanceId?: string;                 // when fixedInstance (== authored knobInstanceId)
  defaultOpen?: boolean;               // first-view expansion (discoverability rule)
}>;
```

- `reading.column` is canonical (lives in `CaseDocument`, presentation-agnostic). `workspace.viewStates` stays non-canonical.
- **BlockNote pane-ref block**: generalize today's dead decorative `controller_ref` (`components/NotePanel.tsx`) into a live **`pane_ref`** block whose target is a stable **`panelId`**; a dangling ref (pane deleted in Studio) renders an inert placeholder, never a crash.
- **exposed-controller target**: in a lesson, `targetPolicy: 'fixedInstance'` honors the authored `knobInstanceId` (`lessonDoc.ts`). `legendEditTarget` (learner re-targets via legend tap) is opt-in; default for lessons = `fixedInstance` (authored binding wins).

### Instances & Compare
- **Compare is removed as a feature.** Multiple instances overlay automatically on every graph; the **legend is the only instance affordance on the primary surface** (identity + per-instance **mute** + **edit-target**). N-instance comparison (3–4+) is supported; legibility is managed by legend mute and per-graph signal selection (PV-loops stay readable at N). "Separate axes" = just add another graph pane.
- **Deprecation/migration required** (not just declared): remove the dead `WorkbenchWorkspace.mode: 'compare'` enum value (`types.ts`) and the `COMPARE_PRESET` (`layoutPresets.ts`); migrate any persisted `mode: 'compare'` to the default.
- **Instance CRUD** (add/remove/name/color) lives in **global settings** (PC right drawer / mobile left drawer); see the [ADR-0002 addendum](0002-workbench-header-ia.md).

## Supersedes ADR-0003 (scoping)
ADR-0003 states "the Dockview shell is **always** the desktop renderer," including learner official/lesson cases. **This ADR narrows that: Dockview is the desktop renderer for the Studio presentation only.** The Reading presentation (lesson/official/community) is a single-column article and is **not** Dockview on any form factor. (ADR-0003 carries a one-line addendum pointing here.)

## Sequencing gate (do not retire the working path early)
The bespoke `LessonPlayer` is **not** retired until ALL of:
1. the Reading renderer (`ReadingPresenter`, built on the shared `renderPanel`) ships;
2. `/lesson/:id` is routed through it **behind a fallback** to `LessonPlayer`;
3. a **golden test** renders every legacy `LESSONS` entry (`lessonDoc.ts`) and a published `lessons/{id}` through Reading and matches/▲-reviews against `LessonPlayer` output;
4. any future lesson publishing targets `cases/{caseId}` (per ADR-0004), with legacy `lessons/{id}` kept on the read fallback during transition.

## Consequences
- Lessons + case-reading **unify into one reading presentation** → one renderer, no content drift, trivially responsive.
- The hardest prior risk (Dockview-in-learner flicker/perf/chrome-leak) is **eliminated** (reading is a prose-scroll).
- **Irreversible/expensive bits** (write rigor required before shipping to published `cases/{id}`): the net-new canonical fields `reading.column`, `exposedControllers`, and the saved `pane_ref` note blocks. Once authors publish cases carrying these, removal needs a migration.
- New presentation-side modules needed: a shared **masking step** over `PanelDef[]`, the `ReadingPresenter`, the `pane_ref` BlockNote block, and the legend edit-target affordance.

## Alternatives
- **Mount Dockview in `mode="learner"` for lessons** — rejected: flicker/perf/chrome-leak under per-step masking; over-chromed for reading.
- **Keep the bespoke `LessonPlayer`** — rejected: permanent drift from the workbench renderer.
- **A dedicated Compare mode / small-multiples** — rejected: redundant with multi-instance overlay + legend; "another axis" = another graph pane.
- **Two separate documents (lesson vs case)** — rejected: fork/remix consistency wants one CaseDocument with two presentations.
- **One layout with a read-only flag** — rejected: read vs make are different intents with different IA.
- **Claiming a lossless geometric round-trip** — rejected as dishonest: layout geometry is regenerated; only content is idempotent (see fidelity table).
