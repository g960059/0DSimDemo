# ADR-0006 — Controller item representation types (slider / preset button-group / custom) + shipped defaults

- Status: **Accepted** (revised 2026-06-05 after a 2-reviewer gate; both reviewers APPROVE-WITH-NITS)
- Date: 2026-06-05
- Builds on: [ADR-0004](0004-case-workspace-canonical-schema.md) (canonical CaseDocument), [ADR-0005](0005-case-presentation-modes.md) (reading/studio)

## Context
Controllers today are **sliders**. For the target audience (medical trainees / beginners) and for mobile, raw sliders are weak:
- On touch they are fiddly — precise values are hard to hit.
- A numeric value is **not interpretable** to a learner: "Ees = 1.7" means nothing; "Contractility: Low / Normal / High" is immediately meaningful and closer to the *concept* the parameter encodes.
- Big tap targets (a 3-button group) are far better one-handed than a thin slider.

But the **continuum still matters**: "sweep afterload and watch the waveform shape change" is sometimes the entire lesson, and gradients are volume-dependent. Sliders cannot be removed wholesale.

## Decision
A controller item gains a **representation type** in the canonical CaseDocument, so it persists, exports, and renders identically across reading/studio and PC/mobile:

```ts
type ControllerItem = {
  paramKey: string;            // the underlying model parameter
  kind: 'slider' | 'buttonGroup' | 'knob' | 'custom';
  label?: string;              // beginner-facing name (overrides raw param name)
  // kind === 'slider' | 'knob'
  min?: number; max?: number; step?: number;
  // kind === 'buttonGroup'
  options?: { label: string; value: number }[];   // named operating points, e.g. 低/正常/高
  // kind === 'custom' — author-defined generalization of the above
}
```

- **`slider`** — default for continuous params (existing behavior: min/max/step).
- **`buttonGroup` (preset)** — an ordered list of `{ label, value }` operating points (e.g. 低 / 正常 / 高 → numbers), rendered as a segmented button group. Thumb-friendly, beginner-legible, closer to the knob *concept*.
- **`knob`** — a rotary continuous control (continuum where a dial reads better than a track).
- **`custom`** — the author-defined generalization (custom button group / custom slider / custom knob).

### Canonical vs view (what actually belongs in the document)
What is **canonical** (must travel with the doc, expresses authored pedagogy): the **data contract** — `discrete` (named operating points: `options[]`) vs `continuous` (`min/max/step`) — plus `label` and the operating-point labels/values. What is a **non-load-bearing presentation hint**: the *widget* for a continuous param (`slider` vs `knob`) — these carry identical data and differ only in rendering. So the schema is honest if read as: `kind` distinguishes the **contract** (discrete `buttonGroup` vs continuous `slider`/`knob` vs `custom`), and `slider`↔`knob` is a render preference, not a different contract. Renderers may fall back `knob`→`slider` without data loss.

### Shipped defaults + curation
- **Each parameter ships with a sensible default representation.** **Default-selection principle:** ship `buttonGroup` **only for parameters that are conceptually discrete operating points**; ship `slider`/`knob` for any parameter the curated "Clinical Knobs" group treats as a **sweep/gradient axis** (where the continuum is the teaching point). Don't default a param a lesson is likely to sweep (e.g. afterload, volume) to `buttonGroup`. Authors **only override when they care** — no obligation to configure every knob.
- A continuum lesson can always **force `slider`** for a parameter even if it ships a `buttonGroup` default — the per-case/`ControllerItem.kind` override wins over the shipped default.
- **Fewer controller items surfaced**: authors curate the *few* exposed controllers. This ties to the existing curated "Clinical Knobs" beginner group and the lesson `exposedKnobs` (≤3) concept — a reading section / lesson step typically exposes 1–3 controller items.

### Authoring UI (studio / settings)
- A compact editor to pick the `kind` and edit its config: label→value rows for a `buttonGroup`, min/max/step for a `slider`/`knob`.
- Lives in studio settings; reading consumes the result.

## Update (2026-06-12) — raw engine scalar parameters

`ControllerItem.paramKey` now also accepts entries from `rawParameterCatalog`,
not only curated clinical knobs. Raw controller items are researcher-facing
scalars bounded by the engine hard range (`HARD_CLAMP`). Author min/max/step
settings override catalog defaults but are clamped to that hard engine range.
The authoring editor shows translated catalog labels until the author edits the
label; if untouched, `labelKey` is preserved so localization continues to apply.

## Consequences
- Beginners get **meaningful, tappable** controls; mobile UX improves markedly (big targets, no fiddly drag).
- Reading/lesson **exposed knobs render as button groups inline** — and the live note pane-ref (ADR-0005) can host a button-group controller in prose ("try **Low / Normal / High** contractility").
- **Data-model change (net-new type, named migration)**: `ControllerItem[]` is a *new* array type, not an extension of an existing config object. It **replaces two existing bare key-array fields**: `ControlPanelView.knobs: KnobKey[]` (`types.ts`) and `StageManifest.exposedKnobs: NumericKnobKey[]` (`lessonDoc.ts`). Migration on read: map each `KnobKey` → `ControllerItem{ paramKey, kind: 'slider' }` using the param's existing min/max/step; lesson `exposedKnobs` → `ControllerItem[]` likewise. This is irreversible once written to published `cases/{id}`, so it must be normalized through one converter (with a round-trip test) before shipping.
- The authoring surface grows (type picker + preset editor) — kept behind "override default" so the common path stays one click.
- Preset values are **named operating points**, so authoring must support label+value pairs (and validation: ordered, non-empty, value within param range).

## Alternatives
- **Slider-only (today)** — rejected: poor for beginners and touch.
- **Preset-only (kill sliders)** — rejected: loses the continuum/sweep pedagogy and gradient exploration.
- **Hard-coded presets per parameter (no custom)** — rejected: authors need scenario-specific operating points and labels.
- **A separate "beginner vs advanced" global toggle that swaps all controls** — rejected: representation is a per-item authored decision (some params are inherently discrete, others continuous), not a global mode.
