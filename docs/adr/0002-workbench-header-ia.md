# ADR-0002 — Workbench header IA (1-row, 3 provenance modes, right slide panel)

- Status: **Accepted** (updated implementation direction)
- Date: 2026-06-01
- Updated: 2026-06-02

## Context
The old Workbench showed **two** chrome rows (~112px before any chart): the global `Layout` nav/logo ([Layout.tsx](../../components/Layout.tsx)) + a Workbench bar with a dead `"Workbench Controls"` h1 and many undifferentiated buttons. The header was not bound to the loaded `CaseDocument`, had no contextual back, and exposed authoring/file actions to beginners. Reference model: Google AI Studio's own editor chrome (Back-to-start · centered title with ✎ · Remix/Share/Publish · right slide panel).

## Decision
Collapse to a **single contextual 1-row header**, suppress the global `Layout` chrome on `/workbench` and `/lesson/*`, and drive contents from **provenance-decided modes** (the mode is internal, not a user-visible label).

Slot grammar (positions constant across modes; only contents change):
```
[← contextual back] [ title ✎/ⓘ ]  ·····  [▶/⏸ 1×▾]  [ one primary CTA ]  [⋯/⚙]
```
- **Learner** (official case/lesson): `← Cases/Lesson · <title>(read) ⓘ · ▶ 1×▾ · **Edit a copy** · ⋯`. Hide Export/Load/Publish/Save-as-lesson/destructive pane chrome. Dirty state folds into the **Edit a copy** CTA. Internally this creates an owned private copy, then opens it in the editable sandbox/authoring surface.
- **Author** (owned/remixed): `← Cases · ✎<title>•dirty · ▶ 1×▾ · **Share** · ⚙`. Title ✎ → title/description/modelLimitations modal (AI-Studio "Rename app" pattern). Save = quiet auto local-first draft. Pane add/remove lives in the relevant Dockview region, not in the global header.
- **Sandbox** (blank, default Workbench): `← Home · ✎Untitled scene · ▶ 1×▾ · **Save case** · ⚙`. Pane add/remove lives in the relevant Dockview region.

Other rules:
- **Save ≠ Share ≠ Export**: header CTA = Save(cloud)/Share; **Export (`.hemosim.json`) and Load are demoted into the right slide panel / ⚙** (Load is destructive).
- **Right slide panel** (opened from Share or ⚙) houses the *details*: Share, Export, Versions/history, Details, Settings. **Only ship tabs with real content** — no dead/disabled tabs (they teach users to ignore the drawer).
- **Transport**: keep Play/Pause in header but as an **icon ▶/⏸** (not the alarming red/green text pill); Speed = compact **`1×▾`** chip/popover (drop 0.1× from the beginner default). Health badge stays inline, silent unless true instability.
- **Model limitations**: reachable via the title **ⓘ** (reuse existing `ModelLimitations`), not a banner.
- **Lesson-authoring chrome is a separate mode**: default Workbench = clean **Sandbox**; `Create lesson` explicitly enters Author/Lesson (Note|Stage + Capture step + filmstrip + Save-as-lesson/draft); Exit returns to a clean Sandbox. (Gating already implemented as AG-1; header must reflect it.)
- **Mobile**: top `← title ⓘ ⋯`; bottom thumb-zone transport `[◀ branches][⏸ 1×][CTA]`; `⋯` = mode action sheet.

## Consequences
- Recovers ~60–112px of chart height; removes the "two competing navs" confusion; one quiet primary action per mode reduces beginner overload.
- Mode is inferred from provenance (`meta.author` etc.); ambiguous → default to **Learner** (safer = less chrome). Learner→editable promotion (`Edit a copy` / remix) is **additive** (never removes controls) + a one-time toast explaining that an editable copy was created.
- New surface area: `WorkbenchHeader` component, a right `WorkbenchSidePanel`, contextual back via `?from=`.

## Alternatives
- Keep 2 rows / show all actions always — rejected (chrome tax, beginner overload).
- User-toggled mode — rejected (provenance is the honest signal; a label is jargon to a learner).
- Delete the slide panel entirely (one reviewer) — rejected: it is good IA for Share/Export/Versions detail; the real rule is "no dead tabs."

## Update (2026-06-05) — the slide panel is the "global settings" offload surface
Reframing the right slide panel as the canonical **global-settings / clutter-offload** surface, consistent with the reading/studio model ([ADR-0005](0005-case-presentation-modes.md)):
- **PC**: the right `WorkbenchSidePanel` is the global-settings drawer.
- **Mobile**: the **left drawer is itself the global settings** — the destination where secondary information is progressively offloaded so the primary surface stays clean.
- It houses **instance management (CRUD: add/remove/name/color)** in addition to Share / Export / Versions / Details / Settings. On the primary surface, the **graph legend** is the only instance affordance (identity + mute + edit-target) — there is no separate instance chip row.
- **Compare is removed as a feature** (ADR-0005): multiple instances overlay on every graph automatically; nothing in the header/drawer is a "compare mode." The "no dead tabs" rule still holds.

## Update (2026-06-12) — partially superseded by ADR-0007 P1c/P1d

ADR-0007 P1c/P1d partially supersedes the header customization details here:
the shipped Workbench header now uses inline VS Code-style visibility toggles,
a trimmed customize popover, and a metrics span option. The save/share/export
flow and provenance-derived modes from this ADR remain unchanged.
