# HFrEF domain and workbench reachability: consolidated review

Please form your own scientific and engineering view. Disagree freely; neither
the provisional proposal below nor earlier AI advice is a constraint. Inspect
code, traces, references, and other relevant files as you choose. Do not edit
code, run a new fitting batch, delegate, or approve a clinical use claim.

## User objective and authorization

One human plus AI builds this prerelease educational 0D circulation model.
Mathematical/physical/physiological validity, useful case expressivity, numerical
robustness, and low complexity take priority. HFrEF is the first case after
baseline. It must have a source-backed disease reference, and the same parameter
configuration must be reachable from baseline with workbench controls, not only
through hidden JSON. The user permits changes to exposed parameters, knobs, and
ranges with approval from at least one of two reviewers (Codex 6 Astra xhigh and
Claude Fable 5.1 xhigh); requests should be consolidated to avoid review cost.
Approval here concerns the concrete scope, not every future preset or mint.

## Independent evidence available

Implementation worktree (released 72 remains unchanged):
`/Users/hirakawa/.codex/worktrees/standard72-baseline-adoption/0DSimDemo`

Isolated, UNADOPTED research derivative:
`/Users/hirakawa/.codex/worktrees/hfref-domain-experiment/0DSimDemo`

Both start at commit `145430f41eee322acf7ca4cce9b641cb0a52d147`.

Important files in the implementation worktree:

- `data/physiology/main-wire-hfref-reference-v1.json`: source populations,
  measurements, construction bounds versus preferred targets and context.
- `analysis/policies/mainWire/MainWireHfrefReferenceV1.ts` and
  `analysis/methods/mainWire/MainWireHfrefObservationV1.ts`.
- `artifacts/hfref-registry-v1/REPORT.md`, `fit-002/report.json`,
  `diagnostics-001/report.json`: previous 39-point current-domain search. Minimum
  EF 45.684%, at LVFW+SEP scale .75, TBV5700, systemic resistance1.25. Cold/fine
  diagnostics retain that finding; this is not proof of global impossibility.
- `engine/myocardium/mechanics/MainWireFiveWallMechanicsResearchInputsV1.ts`:
  active multiplier applies to Land Tref, no kinetic state change. Current
  acceptance range .75–1.33, step .01 on controls but continuous exact inputs.
- `engine/myocardium/experiments/MainWireIntegratedModelStandard71FixtureV1.ts`
  and `engine/myocardium/mechanics/normalAdultFiveWallPriorV1.ts`: current72
  physical construction and fixed geometry.
- `studio/integrations/mainWireIntegratedV3/` controls, fixture projection,
  exact model and Surface; `studio/contracts/v2/control.ts`,
  `studio/contracts/v2/modelSurface.ts`, `components/workbench/WorkbenchSurfaceV3.ts`.

Research derivative:

- `artifacts/hfref-domain-v1/search-001/report.json` plus full `trial-*.json`,
  preregistered plan and source archive. 48 exact evaluations in411s with8workers;
  21 pass the disease rest screen, none meet every preferred target. Unchanged
  reference hash: `1ce40895065564b44560e32bed8cb8740eb3c3a1ccc37d807f7479557811ef7a`.
- Best preregistered ranking: LV active .3, TBV5122.5, Rsys1.00875; EF31.77%,
  EDVI96.35, CI2.143, meanLA24.69, meanAo node69.05. Not UI-grid representable.
- Simple baseline-load point: active .3, TBV4935, Rsys1.04 (trial004): EF31.44%,
  EDVI95.79, CI2.108, meanLA22.92, meanAo68.57. At active .45 (trial013):
  EF38.84%, EDVI92.87, CI2.525, meanLA16.66, meanAo80.71.
- `artifacts/hfref-domain-v1/diagnostics-001/`: currently running .35 active,
  baseline TBV4935/Rsys1.04 with independent cold2ms, cold1ms, warm2ms and
  baseline active1 cold2ms. See report if finished. These values were selected
  before diagnostics as a one-control reachable candidate, not a search winner.
- Exact derivative currently uses its own research model/checkpoint identities,
  initial grid starts cold, no released72 checkpoint import. Prototype changed
  accepted ventricular active range to .25–1.33, atria remain .75–1.33. Only
  LVFW+SEP actually explored; RVFW extension has NO direct evidence yet.
- No kinetics, Ca, passive stiffness, geometry, valves, circulation coefficients,
  solver, healthy gate, disease reference or production baseline was changed.

## Provisional bundled adoption scope (criticize or replace)

1. Support LVFW+SEP active amplitude .25–1.33 in a mutable research model, with
   .25 documented as a bounded engineering exploration domain, NOT a normal
   range, percentage viable myocardium, or universally safe Cartesian domain.
   Keep RVFW/atria .75–1.33 for now. Retain fixed calcium drive and geometry;
   do not introduce remodeling merely to hit the optional EDVI100–140 target.
2. Add one atomic grouped `LV収縮性` operation for LV free wall AND the shared
   septum. Show mixed when unequal; changing it must preserve RVFW/atria and
   all other inputs. Describe ventricular interaction and Tref scaling without
   suggesting it is a load-independent measured Ees. Retain individual wall
   controls for advanced use; the existing global ventricular control remains
   bounded by the intersection of target domains.
3. Existing Surface affine-knob schema is not executed by the workbench yet.
   Prefer a small implementation reusing existing multi-target control behavior
   or a minimal Surface mapping, not a new generic optimizer/UI framework.
   Please assess the ownership tradeoff. Default pane should show the LV group,
   not LVFW alone. Keep all compatible analysis, PV overlays and latest outputs.
4. Keep current numeric-input lattice semantics for now. Re-evaluate a preset
   at explicitly representable input values (active .01, TBV5mL, Rsys .01).
   Prove baseline→control operation→capture matches preset fixture/hash exactly;
   also verify return to baseline, cold/warm and dt concordance. Do not silently
   round saved fitting inputs. A disease package must not claim healthy gates.
5. Permit an explicitly scoped LV systolic-dysfunction DEMO candidate if its
   disease screen and numerical/trace checks pass, while recording missed
   preferred EDVI/other context. Do not portray it as the global optimum,
   remodeled chronic HFrEF, AMI or all HFrEF phenotypes. Whether such a candidate
   is adequate for a first development preset is part of this review.
6. Do not silently expand released72's accepted input/checkpoint semantics.
   Use a distinct mutable research derivative and inherit compatible Surface
   and analysis. Defer a new formal standard mint until the bundled changes and
   baseline/preset control-route verification are stable. No production
   publication or healthy-baseline retuning is included in this proposal.

Please return: independent overall assessment; serious scientific/numerical/UX
risks; smallest preferable alternative; and explicit APPROVE / CONDITIONAL
APPROVE / REJECT for the exposure/range scope, with concrete acceptance
conditions. Cite primary sources if they change your conclusion. Approval does
not require agreement with all provisional implementation details.
