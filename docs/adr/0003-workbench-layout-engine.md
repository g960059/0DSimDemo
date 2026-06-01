# ADR-0003 — Workbench layout engine (declarative preset-grid doc + RGL editor; op-stack)

- Status: **Accepted** (design); implementation pending (see plan)
- Date: 2026-06-01

## Context
The Workbench renders panes via a dense CSS grid (`grid-cols-12 auto-rows-[50px] grid-flow-dense`) where position = array order; "move" is broken HTML5 `draggable` reorder, "resize" is a mouse-only 50px-step handle, and mobile is a forced `span 12` 1-column stack ([Workbench.tsx](../../Workbench.tsx) grid region). `PanelDef` carries only `w/h`, **no `x/y` or `role`** ([types.ts](../../types.ts)). Charts run `requestAnimationFrame` unconditionally — offscreen panes keep painting ([components/Charts.tsx](../../components/Charts.tsx)). Audience is 80% beginners / 20% power users. North star: an **op-stack** (every edit a serializable named op) to later drive the app from an LLM / MCP / API.

A multi-agent panel (codex 5.x high + opus ×2, beginner / power-user / feasibility lenses) **unanimously** converged on the decision below.

## Decision
**Hybrid: a declarative, serializable `PanelDef[]` document is the canonical model; `react-grid-layout` (RGL) is a mode-gated, lazy-loaded *editor* over that document — not the render substrate.**

Canonical model:
```ts
PanelDef = { id, type, title,
  role: 'graph' | 'output' | 'control' | 'note',   // NEW — mobile-flatten key + preset/op key
  x, y, w, h,                                       // NEW x,y (optional; legacy flow-packed)
  config, ... }                                     // persisted as CaseDocument.panels
```
- **Presets** = named, role-tagged **arrangements of separate pane cards** (NOT one mega-pane). The "simultaneous power view" (PV loop + AoP/LVP/LAP waveform + MV flow + Guyton/Starling + output + controller) = a preset placing those as distinct panes; multi-series (AoP/LVP/LAP) live **within one** waveform pane. Default learner set: `Read / Compare / Tweak / Focus`.
- **Two editing axes, kept separate**: *layout geometry* (which panes / positions) vs *pane content* (which knobs/series/metrics inside a pane). **Pane content is editable in-pane in every mode, including Learner**; layout geometry is frozen for Learner.
- **Render paths (one doc, multiple renderers):**
  - **Learner / read (desktop)** → thin **CSS-grid presenter**, geometry frozen, **drag/resize handles absent from the DOM** (not merely `disabled`). No RGL in this path.
  - **Author / Sandbox (desktop)** → presenter + **"Edit layout"** mounts RGL (lazy) for **grid-snapped** drag/resize/add/remove/swap, writing back to the doc. **No free-pixel** placement (snapped geometry serializes cleanly and is op-legible).
  - **Mobile (all users)** → **separate role-flatten renderer** (output strip + chart segmented-tabs + Controls bottom-sheet + Notes tab); ignores `x/y`, bins by `role`; **offscreen charts unmount** (rAF stops). RGL is never mounted on mobile.
- **Op-stack**: every layout mutation is a pure named op over the doc — `applyPreset · addPane · removePane · movePane · resizePane · setPaneSignals · setKnob`. RGL is an adapter (`PanelDef[] ⇄ RGLLayout[]`) emitting `move/resize` ops **once on drag-end** (debounced). This makes layouts scriptable/replayable now and LLM/MCP/API-drivable later.
- **`react-grid-layout` is the editor for the dense Workbench dashboard only.** `allotment`/split-panes is **rejected for the dashboard** (nested splits → divider proliferation, no true 2D for 6–8 panes) and is the right tool only for the **Lesson Note|Stage** coarse split (already settled, react-resizable-panels).

## Consequences
- 80% never load RGL (lazy, author-gated) and never see drag affordances → "did I break the layout?" anxiety is structurally removed; mobile (where most beginners are) never runs the grid engine.
- 20% get real arranging/comparison/export; multi-branch overlay stays a *pane-content* concern (per-instance config), not a layout concern.
- **Drift guard (hard rule)**: the Author **"Preview" must render through the same frozen presenter the Learner sees** (mirror Note `Preview === read`). RGL edits, the presenter renders.
- Requires additive `PanelDef.{x?,y?,role?}` (data-model lock is lifted → in-scope for UX) + a legacy flow-pack to seed `x/y` from array order so existing official cases don't stack.

## Alternatives
- **Full RGL everywhere** (spec F5's literal reading, the runner-up): rejected as the *primary architecture* — ships drag mechanics + library onto the 80% critical path and onto mobile (whose responsive 1-col stack is explicitly banned), and free-pixel is hard to express as clean ops. Adopted only as the *editor*.
- **allotment/split-panes for the dashboard**: rejected (see above).
- **Keep the bespoke HTML5 drag + 50px resize**: rejected (broken, mouse-only → unusable on tablets).
