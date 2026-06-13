# Workbench IA/UX Redesign — Current Implementation Pointer

Canonical references:

- [ADR-0007](adr/0007-workbench-ia-redesign.md) is the decision record.
- [Detailed plan](plans/workbench-ia-redesign-plan.md) is the phase/commit ledger.

Status as of 2026-06-12: P0, P1a-P1d, P2a, and P2b are done on
`ux/workbench-ia-redesign`. P2c remains: read-only interactive behavior, runtime
operation allowance, reset to author state, and Read/Explore runtime carry-over.

## Current Shape

- The main Graph Board is the only Dockview surface.
- Left note drawer, right scenario/inspector rail, and bottom metrics host are
  fixed hosts with local sizing in `WorkbenchLayoutState`.
- Header controls are inline visibility toggles plus a trimmed customize popover
  with metrics span.
- Controller and metrics views are live document `ViewSpec` content. Standard
  clinical-parameters and metrics sets are official seeds, editable/deletable,
  and restorable; saves always write `views`, including `[]`.
- View authoring uses the shared modal editor and supports curated clinical
  parameters plus raw scalar parameters from `rawParameterCatalog`.
- Notes and the reader support `view_ref` blocks against authored views.

## Main Code Map

- `features/workbench/WorkbenchRoute.tsx` composes the feature.
- `features/workbench/hooks/useWorkbenchScene.ts` owns scenarios, retained case
  metadata, authored views, graph board layout, and standard-view restore.
- `features/workbench/hooks/useWorkbenchPanels.ts` owns legacy panels, notes,
  local workspace state, and fixed-host layout state.
- `features/workbench/hooks/useWorkbenchPersistence.ts` owns load/save/export,
  id remapping, and current `CaseDocument` construction.
- `features/workbench/viewSpec.ts` holds the ViewSpec/GraphBoardLayout model.
- `features/workbench/authoredViews.ts` holds authored-view helpers, standard
  factories, seeding, migration, and serialization rules.
- `components/workbench/PanelGrid.tsx` is the desktop shell for the Graph Board,
  note drawer, two-tier right rail, and metrics host.

Quality gates remain `npm test` and `npm run build`.
