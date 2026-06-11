# Architecture Decision Records (ADR)

Short, dated records of significant UI/UX & architecture decisions for CircleHeart.
Each ADR captures: Context · Decision · Consequences · Alternatives considered.

| # | Title | Status | Date |
|---|-------|--------|------|
| [0001](0001-firebase-project-migration.md) | Firebase project → `hemodynamics-studio` (default DB) | Accepted | 2026-06-01 |
| [0002](0002-workbench-header-ia.md) | Workbench header IA (1-row, 3 provenance modes, right slide panel) | Accepted | 2026-06-01 |
| [0003](0003-workbench-layout-engine.md) | Workbench layout engine (Dockview shell + semantic pane document) | Accepted | 2026-06-01 |
| [0004](0004-case-workspace-canonical-schema.md) | Canonical case workspace schema | Accepted | 2026-06-02 |
| [0005](0005-case-presentation-modes.md) | One CaseDocument, two presentations (Reading / Studio) | Accepted | 2026-06-05 |
| [0006](0006-controller-item-types.md) | Controller item representation types (slider / preset button-group / custom) + shipped defaults | Accepted | 2026-06-05 |
| [0007](0007-workbench-ia-redesign.md) | Workbench IA/UX redesign (main-only Graph Board + fixed hosts) | Accepted | 2026-06-11 |

Decision process: each was vetted by a multi-agent panel (external codex 5.x + Claude opus reviewers, distinct lenses) and the human product owner. See [workbench-implementation-plan.md](../workbench-implementation-plan.md) for the parallel build breakdown derived from 0002 + 0003.

Audience assumption (drives every trade-off): **~80% beginners** (junior/senior residents, students — open a case, watch, turn 1–3 knobs, read a note; will NOT arrange a dashboard) + **~20% power users** (detailed simulation / analysis / research).
