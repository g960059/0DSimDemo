# ADR-0003 — Workbench layout engine (Dockview shell + semantic pane document)

- Status: **Accepted** (updated implementation direction)
- Date: 2026-06-01
- Updated: 2026-06-02; **2026-06-05 scoped to Studio**

> **Status note (2026-06-11):** Partially superseded by [ADR-0007](0007-workbench-ia-redesign.md). The four-zone Dockview direction is narrowed: Dockview is now main Graph Board only; note, right rail, and metrics are fixed hosts.

> **Update (2026-06-05):** "the Dockview shell is **always** the desktop renderer" below is now **scoped to the Studio presentation only**. The Reading presentation (lesson / official / community case) is a single-column article and is **not** Dockview on any form factor. See [ADR-0005](0005-case-presentation-modes.md).

## Context
The Workbench needs to serve two audiences: roughly 80% learners who should see a predictable clinical simulator, and 20% author/research users who need comparison, rearrangement, and pane-level customization.

The important product constraint is that future LLM/MCP/API actions must be able to say things like "show the PV loop and generated note for normal vs AMI" without depending on fragile pixel layout data.

## Decision
Use Dockview as the desktop layout shell, but keep the canonical case/workbench model semantic:

```ts
PanelDef = {
  id,
  type,
  title,
  role: 'graph' | 'output' | 'control' | 'note',
  zone: 'caseRail' | 'main' | 'sideRail' | 'bottomPanel',
  config,
  ...
}
```

`PanelDef[]` and each pane's semantic `config` are the source of truth. `role` is the pane's functional meaning; `zone` is the layout constraint. Dockview's serialized JSON is display state only, stored alongside the semantic document as zone-specific `workspace.viewStates`. It is not the canonical case schema.

Desktop Workbench:
- No separate layout edit mode. The Dockview shell is always the desktop renderer.
- The desktop shell is split into constrained zones: `caseRail`, `main`, `sideRail`, and `bottomPanel`.
- Pane additions are zone-local through Dockview tab-bar actions. Empty editable zones keep an in-Dockview empty-state add affordance so closing the last pane does not strand the zone.
- Blank Workbench and owned user cases are editable: DnD/split within the same zone, zone-local add, and close are allowed.
- Cross-zone movement is not implicit DnD; when added later, it should be an explicit pane menu operation such as `Move to Main`.
- Learner-facing official/lesson cases allow splitter resize, but restrict DnD, close, floating/popout, and add actions.
- Author/research users can add/remove/rearrange panes through the Dockview shell.

Default blank Workbench:
- Starts with Waveforms, PV Loop, Controls, and Metrics.
- Does not include Notes by default. Notes are added explicitly when an author wants to write or share interpretation.

Mobile Workbench:
- Uses the role-flattened mobile presenter. It ignores desktop geometry and groups panes by semantic role.

## Consequences
- The desktop layout can feel like a professional workbench without exposing a raw IDE to learners.
- Case sharing, official cases, mobile rendering, and LLM-driven pane creation remain based on stable medical semantics rather than vendor-specific layout JSON.
- Dockview view state can be discarded or regenerated when incompatible with the semantic pane list or zone.
- The old bespoke grid editor and grid-layout dependency are removed from the Workbench path.

## Alternatives
- **Bespoke grid editor:** rejected because it requires maintaining tabs, drag/drop, resize, persistence, and responsive fallbacks by hand.
- **Split-pane-only dashboard:** rejected because dense comparison views become divider-heavy and awkward for graph/control/output/note mixes.
- **Vendor layout JSON as canonical case data:** rejected because it makes LLM/API workflows, mobile conversion, and community case evolution too brittle.
