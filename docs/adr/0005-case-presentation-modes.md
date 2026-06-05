# ADR-0005 — One CaseDocument, two presentations (Reading / Studio) + deterministic conversion

- Status: **Proposed**
- Date: 2026-06-05
- Builds on: [ADR-0003](0003-workbench-layout-engine.md) (Dockview zones), [ADR-0004](0004-case-workspace-canonical-schema.md) (canonical CaseDocument)

## Context
The desktop workbench was rebuilt on Dockview with fixed role-region zones (ADR-0003). The lesson player, however, is a **separate, hardcoded 2-column layout** that recomputes its own panel configs and will permanently drift from the workbench renderer (different chart options, metric sets, PV-loop guides). Official/community cases that a learner only *reads* have no first-class home either.

An earlier direction — mount the Dockview workbench in a `mode="learner"` for lessons — carries a real risk: per-step panel masking changes the Dockview structure signature and causes relayout flicker / perf cost / chrome-leak, and it over-chromes what is fundamentally a *reading* experience.

The product is ~80% learners who **read** (lesson, official case, community case) and ~20% authors who **make** (sandbox, owned/remixed cases). Those are two different intents, not one layout with a flag.

## Decision
A single canonical **CaseDocument** (instances + `panels: PanelDef[]` + `note` + optional `lesson` layer) has **two presentations**, chosen by intent/provenance:

### Reading presentation (consume: lesson, official case, community case)
- A **single-column vertical article** ("rich Medium-like" reading). Panes (graph / note / metrics / controller) stack in **column order** and render top-to-bottom.
- **Auto-ref**: the column order is converted to inline note pane-refs automatically — authors do not hand-place refs in prose for the basic path (manual in-prose refs remain a future power-feature). Multiple `note` panes may sit in the column so prose can interleave (text → graph → text → graph).
- **No structural editing**: no add/remove pane, no graph-item editing, no layout rearrange.
- **Controller is collapsed by default and pulled out on demand** as a *partial* drawer so the relevant graph stays visible (preserves the "turn a knob → watch the waveform react" loop). When a section exposes a controller, it **peeks/pulses** so beginners notice they can interact.
- **PC and mobile reading are the same single column** → responsive-trivial, one renderer.
- Reading is **NOT** rendered through Dockview — so the docking flicker/perf/chrome-leak risk does not exist here.
- **No-prose fallback**: a reading case with no authored note renders a default column (graph → metrics → controller).
- **Lesson = the reading presentation of a CaseDocument that has a `lesson` layer (steps)**. This supersedes the bespoke `LessonPlayer`; lessons stop being a separate render path.

### Studio presentation (make: sandbox, owned/remixed cases, authoring)
- **Editable**, somewhat denser IA is acceptable.
- **PC**: Dockview role-zones (ADR-0003) — add/remove/resize within zones, zone-local add.
- **Mobile**: graph splits become **persistent flattened tabs** (always one graph visible); `note` / `metrics` / `controller` live in drawers (global settings + the summoned controller). Studio mobile differs from reading mobile **only in editability** — nearly the same shell.

### Shared renderer (no drift)
The pane **content** renderer (`renderPanel` + Charts) is shared across both presentations and both form factors. Only **placement** differs (1-column order vs zones/tabs). Chart drift is therefore structurally impossible.

### Deterministic conversion (the keystone)
- Conversion uses `paneZone.ts` role→zone defaults (`defaultZoneOf(role)`).
- **studio → reading**: flatten zone layout to a column order (graph → … → controller), emit auto-refs.
- **reading → studio**: assign each pane a zone from its `role` via `defaultZoneOf`.
- **fork/remix** of a reading case = reading → studio (now editable). **publish-as-lesson** = studio → reading.
- Round-trips are stable because the mapping is deterministic and role-driven.

### Instances & Compare
- **Compare is not a feature.** Multiple instances overlay automatically on every graph; the **legend is the only instance affordance on the primary surface** and carries identity + per-instance **mute** (clutter control) + **edit-target** selection (tap a legend entry to choose which instance a controller edits). N-instance comparison (3–4+) is supported; legibility is managed by legend mute and per-graph signal selection (and PV-loops, which stay readable at N). "See it side-by-side on separate axes" = just add another graph pane — no special mode.
- **Instance CRUD (add/remove/name/color) lives in global settings** (PC right drawer / mobile left drawer), not on the primary surface (see ADR-0002 addendum).

## Consequences
- Lessons and case-reading **unify into one reading presentation** → one renderer, no drift, trivially responsive (one column on every screen).
- The hardest prior risk (Dockview-in-learner flicker/perf/chrome-leak) is **eliminated** because reading is a prose-scroll, not a docking shell.
- BlockNote needs a **live pane-ref block** (generalizing today's dead decorative `controller_ref` chip).
- Authoring builds panes in studio; publishing flattens to a reading column.
- **Open data-model work**: how column order / auto-ref placement is persisted; the auto-ref conversion; the no-prose fallback; exposed-controller peek; round-trip fidelity tests. Dockview JSON stays non-canonical studio display state (ADR-0004).
- `LessonPlayer` is retired in favor of the reading presentation; existing legacy `lessons/{id}` continue to resolve via the read fallback (ADR-0004) during transition.

## Alternatives
- **Mount Dockview in `mode="learner"` for lessons** — rejected: flicker/perf/chrome-leak under per-step masking; over-chromed for a reading experience.
- **Keep the bespoke `LessonPlayer`** — rejected: permanent drift from the workbench renderer.
- **A dedicated Compare mode / small-multiples** — rejected: redundant with multi-instance graph overlay + legend; "another axis" = another graph pane.
- **Two separate documents (lesson vs case)** — rejected: fork/remix consistency wants one CaseDocument with two presentations.
- **One layout with a read-only flag** — rejected: read vs make are different intents with different IA; a flag would either over-chrome reading or under-power studio.
