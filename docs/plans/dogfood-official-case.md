# Dogfood: author one teaching case on the ADR-0007 model

Branch `ux/dogfood-and-fixtures` (off merged ADR-0007). Goal: author ONE complete
teaching case through the new model (ViewSpec controller/metrics views, `view_ref`
note embed, reading column, Read entry) to (a) prove the model holds end-to-end and
(b) surface the schema/authoring friction that drives the next consolidation PR.
Design content is the lead's; codex builds the mechanically-valid fixture + the
helper extension. This is NOT the schema-consolidation PR — that is separate.

## Dogfood findings so far (the point of this exercise)

- **F1 (content/ergonomics):** the scenario-add menu offers only one preset
  ("Normal adult"). Authoring "Normal vs disease" means duplicate-then-hand-edit +
  rename. No disease-preset library. Not a schema gap; a content/authoring-UX gap.
- **F2 (THE finding — schema/authoring):** `officialCases.ts` `makeCase()` /
  `CaseAuthor` predate ADR-0007. They build ONLY `panels` + `notes`; they accept no
  `views`, `graphBoardLayout`, `initialActiveScenarioId`, or `reading`. And the only
  note-embed vocabulary used by existing cases is the legacy `controller_ref`
  (paramKey+label), never the new `view_ref`. So the new ViewSpec / reading model is
  exercised by ZERO authored content — the official-case authoring surface still
  speaks the pre-redesign language. Authoring this case forces teaching the helper
  the new vocabulary, which is exactly the "legacy PanelDef as canonical authoring
  surface" debt flagged in the strategy review.
- These two findings (plus the controlsSide / region-position / host-state items from
  the strategy discussion) are the agenda for the SEPARATE schema-consolidation PR.
  Here we only need to make the new model authorable enough to ship one real case.
- **F3 (authoring/options):** `buttonOptionsFromRange()` is convenient for creating
  `buttonGroup` items, but for asymmetric hard ranges it labels the arithmetic
  midpoint as "Normal" rather than the neutral clinical baseline (1.0 for multiplier
  knobs). The case can still be authored mechanically, but beginner-facing
  Low/Normal/High presets need a clearer source than the raw catalog clamp range.

## The teaching case to author

**Afterload — normal vs acute hypertension** (PV-loop-first, the canonical demo).

- **Scenarios (2):**
  - `Normal` — neutral knobs, targetVolume 5600 (the standard normal).
  - `Hypertensive` — afterload knob raised (~1.6×) so the PV loop shows the classic
    taller/narrower loop and ESP shift; targetVolume 5600. Built by the
    duplicate-and-dial path (per F1). Distinct color.
- **Curated controller view** `Afterload demo`: ONLY two items so a beginner isn't
  overwhelmed — `afterload` and `contractility`, BOTH as `buttonGroup` (Low / Normal
  / High) so sliders don't invite aimless dragging (the ADR-0006 beginner intent).
  Binding `{ slot: "active" }`. This is the seeded standard view's curated sibling.
- **Curated metrics view** `Pressure & output`: `ABP`, `CO`, `SV`, `PCWP` only.
- **Graph board:** PV Loop and Waveforms side by side (a `split` row of two leaves);
  PV loop carries `aspect { ratio: 1, fit: "lock" }`.
- **Note (reading content):** short prose explaining the afterload effect, then a
  `view_ref` embedding the `Afterload demo` controller view (so the reader operates
  the curated control inline), then a `paneRef`/graph reference to the PV loop in the
  reading column. The note makes this case open in **Read** by default
  (`deriveReadExploreEntryMode` → read when reading content exists).
- **`initialActiveScenarioId`:** the `Normal` scenario (so the reader starts at the
  reference operating point; switching active to Hypertensive is a runtime op).
- **Reading column:** `[{ noteRef }, { viewRef: <controller view id> }, { paneRef:
  <pv loop panel/graph id> }]` — note prose, the live curated control, the PV loop.

## Implementation (codex builds; lead owns the teaching design above)

1. **Extend the authoring helper** in `officialCases.ts` so `CaseAuthor` (or a new
   richer author type used only by this case) can carry: `views?: ViewSpec[]`,
   `graphBoardLayout?: GraphBoardLayout`, `initialActiveScenarioId?: string`,
   `reading?: CaseReadingManifest`, and `exposedControllers?` if trivially needed.
   Thread them through `makeCase()` into the returned `CaseDocument` (the doc already
   has these optional fields; the helper just needs to pass them). Keep existing
   cases unchanged (the new author fields are optional).
2. **Author the case fixture** per the design above with mechanically valid pieces:
   - 2 `CaseInstance`s via the existing `instance()` path; the Hypertensive one
     carries the afterload knob delta (use the real knob key + a value that visibly
     shifts the PV loop; verify against `engine/knobs` ranges).
   - `views`: one `ControllerViewSpec` (`Afterload demo`, 2 buttonGroup items with
     sensible Low/Normal/High option values from the catalog range) + one
     `MetricsViewSpec` (`Pressure & output`) + the graph views the board references.
     Use real `MetricType` ids and valid `membership` (both scenario ids).
   - `graphBoardLayout`: the row split with the two graph view leaf ids.
   - `reading`: the 3-entry column referencing the real note id, controller view id,
     and pv-loop graph/panel id.
   - `notes`: BlockNote content with a heading + paragraph(s) + a `view_ref` block
     (`{ type: "view_ref", props: { viewId } }`) pointing at the controller view.
   - `initialActiveScenarioId`: the Normal instance id.
3. **Register** the case in `OFFICIAL_CASES`.
4. **Test:** a unit test loading the new case asserts it is a structurally valid
   CaseDocument that survives `caseDocumentToSimInstances` → `simInstancesToCaseDocument`
   for the parts that round-trip (views/reading/graphBoardLayout/initialActiveScenarioId
   preserved), and that `deriveReadExploreEntryMode(doc, {readOnly:true})` returns
   `"read"`. Keep existing official-case tests green.

## Constraints

- `npx tsc --noEmit` clean; `npm test` green; `npm run build` green; i18n en (this is
  an official English case; ja optional, follow existing official-case i18n pattern).
- Do NOT start the schema-consolidation (controlsSide/position/host-state) here — only
  the minimal helper extension to make the new model authorable. Record anything else
  awkward you hit as a friction note appended to this file's findings.
- Lead verifies the rendered result in-browser (Read entry, the curated control in the
  note operates the active scenario, switch to Hypertensive updates the PV loop,
  Read↔Explore carries state) before commit.

## Validation result (lead, in-browser 2026-06-13)

The case was authored ENTIRELY on the ADR-0007 model and renders correctly end to end:

- **Read entry by default** (reading content present) — title, prose, ToC, and the
  embedded curated controller render as a reading article; read-only badge + Read|Explore
  switcher + Fork + "reset to author's state" all present.
- **`view_ref` embed is live and interactive in BOTH presentations.** Clicking
  `Afterload → High` inside the NOTE embed raised the ACTIVE (Normal) scenario's afterload;
  ABP moved 121/79 → 141/113 while Hypertensive stayed 137/97 — binding `{slot:"active"}`
  correctly targets the active scenario; the custom metrics view updated live.
- **Explore** shows the full board: PV Loop overlays Normal (taller/narrower hypertensive
  loop visibly shifted), the curated "Afterload demo" controller in the inspector, and the
  "Pressure & output" custom metrics view (Normal CO 5.4 / Hypertensive CO 4.6, SV 72/61,
  PCWP 7/11 — pedagogically correct).
- **Shared runtime carries across Read↔Explore:** the `High` selection made in Explore was
  still selected after switching to Read (no reload, no re-seed).
- **F4 (NOT a bug):** the Read-mode PV-loop pane looked blank at first; it renders once the
  document is visible + a layout tick occurs. This is the headless-tab `useDocumentVisible`
  gate (a test-env artifact), not a reading-render defect — the same canvas draws in Explore
  and in Read after settling.

**Conclusion:** the ViewSpec / binding / reading / read-only / Read|Explore model is proven
by real authored content, not just unit tests. The remaining work is the SEPARATE
schema-consolidation PR (F2 authoring-surface debt, controlsSide/position/host-state) — not
a model correctness gap.
