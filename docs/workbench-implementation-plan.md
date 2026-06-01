# Workbench Header + Layout — Implementation Plan (parallel)

Derived from [ADR-0002](adr/0002-workbench-header-ia.md) + [ADR-0003](adr/0003-workbench-layout-engine.md).
Team: `uiux` — lead `UIUXlead2`; implementers `codexUX1..4`.
Process per increment: lead spec → (plan-gate optional, decisions already triple-vetted) → codex implements on a branch off `origin/main` → **2-reviewer post-impl gate** (opus subagent + codex CLI, always ask for improvement proposals, 1/2 OK, adoption = lead) → lead merges via `gh pr merge <n> --merge`.
Verify: `npx vitest run --exclude '**/.claude/**'` + `tsc --noEmit` + `vite build`. Pre-merge: `git diff --name-only origin/main <branch>` (no forbidden/out-of-stream files).

## Strategy
`Workbench.tsx` is the contention hotspot. **Wave 1** parallelizes only **file-disjoint** work, and includes a behavior-preserving **component extraction** that unblocks **Wave 2** parallelism (header vs grid become separate files).

Shared type contract (fix now, so all streams build to it): `PanelDef.role: 'graph'|'output'|'control'|'note'` and optional `x?,y?:number` (ADR-0003).

## Wave 1 — parallel, file-disjoint (start now)

### codexUX1 — Charts visibility / rAF gate
- Gate `requestAnimationFrame` in `PVLoopPanel` & `WaveformPanel` ([components/Charts.tsx](../components/Charts.tsx)) on an `isOnscreen` signal (IntersectionObserver) + pause on `document.hidden`; resume cleanly.
- Files: `components/Charts.tsx` (+ optional `hooks/useOnscreen.ts`). Tests where feasible.
- Disjoint. Battery/perf win for long sessions and prerequisite for mobile unmount.

### codexUX2 — Layout doc model + op-stack + presets (the spine)
- `types.ts`: add `role` + optional `x,y` to `PanelDef` (additive, no break).
- New `layoutOps.ts`: pure named ops `applyPreset/addPane/removePane/movePane/resizePane/setPaneSignals` as `(panels)=>panels'`.
- New `layoutPresets.ts`: `Read/Compare/Tweak/Focus` as role-tagged `PanelDef[]` geometry + `flowPack(panels)` legacy x/y seeding.
- New `paneRole.ts`: `roleOf(type): Role`.
- Vitest for ops + presets + flow-pack. **No `Workbench.tsx` wiring yet.**
- Files: `types.ts` + 3 new modules + tests. Disjoint from UX1.

### codexUX3 — `Workbench.tsx` component extraction (Wave-2 enabler)
- Behavior-preserving refactor: extract `components/workbench/WorkbenchHeader.tsx` (current header JSX, props-threaded) and `components/workbench/PanelGrid.tsx` (current `panels.map` grid + existing drag/resize) out of `Workbench.tsx`. **No behavior change.**
- Files: `Workbench.tsx` + 2 new component files. Disjoint from UX1 (Charts) and UX2 (types/new layout modules).

### codexUX4 — Mobile role-flatten renderer (new file, contract-based)
- New `components/workbench/WorkbenchMobile.tsx` consuming `PanelDef[]` + `role` (ADR contract): sticky output strip (output-role) + chart segmented-tabs (graph-role, only active mounted) + Controls bottom-sheet (control-role) + Notes tab (note-role). Built standalone; **not wired into `Workbench.tsx` yet**.
- Files: new component(s) under `components/workbench/`. Soft-dep on UX2's `role` type → land UX2's `types.ts` first, others rebase.

## Wave 2 — after Wave 1 merges (now file-disjoint via extraction)
- **Header IA** (ADR-0002) on `WorkbenchHeader.tsx` + `Layout.tsx` global-chrome suppression on `/workbench`,`/lesson` + right `WorkbenchSidePanel.tsx`. (UX3)
- **Grid freeze + CSS presenter + RGL editor** (ADR-0003) on `PanelGrid.tsx`; learner = handle-free presenter, Author "Edit layout" = lazy RGL writing the doc. (UX4 + UX1)
- **Op-stack wiring**: route `Workbench` mutations through `layoutOps`; RGL `onLayoutChange` → debounced `move/resize` ops. (UX2)
- **Mobile wiring**: mount `WorkbenchMobile` on the phone branch; delete the `span 12` stack. (UX4)
- **Presets UI**: header preset switcher (Learner segmented / Author `Layout▾`). (UX3)

## Notes / risks
- Drift guard: Author Preview renders through the learner presenter (ADR-0003).
- Learner default = Compare; mode inferred from provenance, ambiguous → Learner.
- codex implementers do **not** auto-poll agmsg — the human wakes them after assignment.
