---
title: "Myocardial contraction rebuild — Implementation roadmap"
status: "Proposed"
revision: 3
source_design_record: "../research/myocardial-contraction-rebuild-design-record.md"
---

# Myocardial contraction rebuild — Roadmap

## Delivery principle

中心仮説を安価に反証してから、production mechanics、solver、closed loop、legacy removalへ進む。future extensionをPhase Aへ混在させない。

> **Traceability note:** 以下の節番号はdesign recordとの相互参照を保つため、元文書の番号を維持する。

## PR #166 review deltas

PR #166 proposes two additive roadmap changes:

1. Add **Phase 5.5 — atrial bridge shootout** before Phase 6. See [ADR-MYO-002](../adr/ADR-MYO-002-atrial-bridge.md) and [atrial-bridge-shootout-roadmap.md](atrial-bridge-shootout-roadmap.md).
2. Carry Phase 2B/Level 3 review deltas into future scripts and gates. See [phase2b-level3-review-deltas.md](../review-notes/phase2b-level3-review-deltas.md).

Until ADR-MYO-002 is accepted, existing `clean atrial elastance bridge` wording is treated as pending review rather than an active default.

# 19. 実装PhaseとPR分割

## Phase 0 — ADR、document split、target/claim freeze

成果物:

```text
docs/myocardium/adr/ADR-MYO-001.md
docs/myocardium/model-spec/myocardium-land-v1.md
docs/myocardium/verification/myocardium-v1-verification.md
docs/myocardium/roadmap/myocardium-rebuild-roadmap.md
docs/myocardium/research/myocardial-contraction-rebuild-design-record.md
data/myocardium/sources.json
data/myocardium/targets/*
```

owner sign-off:

- stress/strain convention
- ActivationEvent contract
- prescribed-Ca claim boundary
- morphology measurement
- early kill rule

## Phase 1 — contracts、state registry、standalone Land

### PR 1A — activation/state/contracts

- canonical ActivationEvent
- hierarchical ModelInstancePath
- state layout/hash
- units/provenance
- no ModelCore connection

### PR 1B — Land source equations

- immutable source parameter sets
- residual/Jacobian
- source output semantics

### PR 1C — Land protocol closure

- cell/tissue fixtures
- stabilization coefficient
- discrete algorithmic tangent
- dt/failure reporting

## Phase 2 — PrescribedCalciumTransient and transfer

### PR 2A — prescribed calcium

- renamed backend
- ActivationEvent input
- knot table
- claim-boundary tests

### PR 2B — isometric Ca + Land

- report source-stress timing, FWHM, TTP, relaxation, dT/dt
- additionally report the mechanistic fields in `data/myocardium/protocols/phase2b-mechanistic-report-fields-v1.json`
- clarify Ca amplitude vs absolute peak Ca: `peakAmplitudeUM=0.9` with `diastolicCaUM=0.12` implies `targetAbsolutePeakCaUM≈1.02 uM`
- report `CaT50AtFixedStrainUM` and `CaAtStressPeakUM`

### PR 2C — prescribed shortening

- consistent rate derivation
- morphology transfer
- no pressure/valve/qDot
- gate script: `npm run verify:myocardium-prescribed-shortening`
- standalone descriptor/report only; no generalized-force mapper

## Phase 3 — early thick-sphere loaded spike

### PR 3A — fixed early kinematics

Scope: kinematics-only fixed thick-sphere harness for the single
`cavity-volume` coordinate, arithmetic-mean midwall convention, analytic
`dE_f/dV`, coordinate-rate-derived strain-rate diagnostic, and candidate
parameter provenance.

- gate script: `npm run verify:myocardium-thick-sphere-kinematics`
- artifact: `data/myocardium/protocols/thick-sphere-phase3a-kinematics-protocols.json`
- boundary: does not decide production ventricular mechanics or owner acceptance

### PR 3B — identity/fixed homogenization + single-coordinate generalized force

Scope: standalone identity/fixed homogenization plus single-coordinate
virtual-power closure for the Phase 3A `cavity-volume` coordinate. Uses an
explicit zero passive/viscous fixture and does not run a loaded afterload
family or accept production homogenization/passive mechanics.

- gate script: `npm run verify:myocardium-generalized-forces`
- artifact: `data/myocardium/protocols/identity-force-phase3b-protocols.json`
- boundary: no ModelCore/chamber runtime wiring, afterload family, valve/qDot, or owner acceptance

### PR 3C — low/normal/high afterload family

Scope: standalone D0 minimal loaded afterload-family smoke gate for
low/normal/high synthetic afterload members. The artifact uses prescribed
synthetic Ca, the Land source solver, Phase 3A fixed thick-sphere kinematics,
Phase 3B identity homogenization/generalized force, and a bidirectional
linear resistor afterload pressure state: `flow=(P_internal-P_afterload)/R`,
`V -= flow*dt`, and `P_afterload += flow*dt/C`. Family members differ only in
resistance, compliance, and initial afterload pressure; any loaded update that
leaves the Phase 3A volume domain is a closure failure.

- gate script: `npm run verify:myocardium-minimal-loaded-chamber`
- artifact: `data/myocardium/protocols/minimal-loaded-phase3c-afterload-protocols.json`
- boundary: synthetic D0 smoke only; no ModelCore/chamber runtime wiring, schema/official-case wiring, production single-chamber solver, passive material-law acceptance, dynamic valve, qDot clamp, TBV projection, septal/pericardial coupling, closed-loop steady state, downstream pass claim, or Phase 3 owner GO

### Phase 3 owner gate

`GO / REVISE / NO-GO`。GOなしでPhase 4へ進まない。

- recorded GO artifact: `data/myocardium/gates/phase3-owner-go-v1.json`
- unlocks: Phase 4A Decision 19 decision-dossier work only
- boundary: does not authorize Phase 4B+, production mechanics integration, runtime/schema/official-case wiring, passive law acceptance, TriSeg adoption, or Decision 19 acceptance

### Level 3 source-stress transfer entry gate proposed in PR #166

Before treating Phase 3C/Level 3 as scale-consistent, verify:

```text
Phase 2B source stress peak around 37 kPa
→ chamber-realized stress around expected 10–16 kPa
→ approximately 120 mmHg-class loaded morphology
```

This gate must not rely on:

- `Tref` rescaling;
- free homogenization gain;
- geomChi-like pressure gain;
- arbitrary tension filter;
- morphology-only viscosity.

Artifact: `data/myocardium/protocols/level3-source-stress-transfer-gate-v1.json`.

## Phase 4 — production mechanics selection and integration

### PR 4A — production mechanics Decision 19 dossier

比較:

```text
thick-sphere-v2 + explicit external septal coupling
TriSeg-lite compatible backend
full TriSeg-compatible backend
```

比較項目はscientific scope、validation data、rank、virtual power、performance。

- gate script: `npm run verify:myocardium-mechanics-decision`
- artifact: `data/myocardium/decisions/production-mechanics-phase4a-dossier-v1.json`
- recommendation: conditional only; assumes first integration scope is global preload/afterload or normal/global LV/RV failure without RV pressure overload, septal bowing, or ventricular interdependence as the primary mechanism
- contingency: if RV pressure overload, septal bowing, or ventricular interdependence is primary, TriSeg-lite/full TriSeg becomes preferred
- boundary: not owner acceptance, not production validation, not Phase 4B+ authorization, and not runtime/schema/official-case wiring

Decision 19 owner selection is recorded separately in
`data/myocardium/decisions/production-mechanics-decision19-owner-selection-v1.json`.
The accepted initial backend is
`thick-sphere-v2-explicit-external-septal-coupling`
(`thick-sphere-v2`) for limited-scope immediate work: replace current active
stress with Land active stress, morphology gate pass/fail, and
beat-stability/no-alternans. This initial backend does not cover RV pressure
overload, septal bowing, ventricular interdependence, or right-heart failure as
primary/final scope. The future TriSeg path preserves
`triseg-lite-compatible`, `full-triseg-compatible`, and full TriSeg escalation
before those mechanisms are claimed.

Decision table row retained for owner-decision traceability:

| 19 | production ventricular mechanics | thick-sphere-v2-explicit-external-septal-coupling (initial thick-sphere-v2 backend) | before Phase 4B+ | ACCEPTED 2026-06-27 |

### PR 4B-A — Land active-stress replacement shadow readiness

Scope: first shadow readiness gate for the accepted Decision 19 Land
active-stress replacement path. Reuses Phase 3C minimal loaded afterload family
outputs to report Land pipeline finite/health/virtual-power readiness,
internal pressure/stroke/work/afterload ordering proxies, and a prescribed-Ca
beat-stability/no-alternans smoke with six state-carry preconditioning cycles
followed by one warm-up plus three evaluated cycles, with 5% drift tolerance
and a separate 1% alternans-pattern tolerance.

- gate script: `npm run verify:myocardium-land-active-stress-replacement`
- artifact: `data/myocardium/protocols/land-active-stress-replacement-phase4b-protocols.json`
- selected Decision 19 backend: `thick-sphere-v2-explicit-external-septal-coupling` / `thick-sphere-v2`
- executable coordinate path today: Phase 3 coordinate-family shadow readiness using `thick-sphere-spike-v1`, not completion of the selected v2 backend
- boundary: shadow readiness only; no live runtime replacement, no production validation, no official morphology acceptance, no completed Phase 4B tissue homogenization, no ModelCore/chamber/schema/official-case wiring, no RV pressure-overload/interdependence coverage, and no calcium-cycling alternans validation
- future TriSeg path remains preserved before RV pressure overload, septal bowing, ventricular interdependence, or right-heart failure are claimed

### PR 4B-B — tissue homogenization readiness audit

Scope: descriptor/report/verifier/test/docs gate only for tissue homogenization
readiness. This audits the locked shadow adapter candidate
`identity-fiber-nominal-v1`; it does not graduate, accept, or validate
production tissue homogenization.

- gate script: `npm run verify:myocardium-tissue-homogenization-readiness`
- artifact: `data/myocardium/protocols/land-tissue-homogenization-phase4b-protocols.json`
- direct adapter provenance: `data/myocardium/protocols/identity-force-phase3b-protocols.json`
- direct loaded-shadow provenance: `data/myocardium/protocols/minimal-loaded-phase3c-afterload-protocols.json`
- Phase 4B-A reuse: read-only context from `data/myocardium/protocols/land-active-stress-replacement-phase4b-protocols.json`
- boundary: `ownerAcceptanceStatus=not-owner-acceptance`, Decision 4 remains `PENDING OWNER`, `productionHomogenization=not-claimed`, `identifiabilityRankStatus=not-run`, no live runtime replacement, no official morphology acceptance, no calcium-cycling alternans validation, no ModelCore/chamber/schema/official-case wiring
- identity limitation: current identity adapter has activeTissueFraction=1 and identity orientation only; no fiber orientation, no dispersion, no transmural variation, no active tissue fraction<1 behavior, no independent data, and no independent identifiability rank run
- tangent boundary: `stabilizationStiffnessPa` and optional `algorithmicTangentPa` stay distinct fields
- non-coverage: RV pressure overload, septal bowing, ventricular interdependence, and right-heart failure are not covered by this gate
- future TriSeg path: preserve `triseg-lite-compatible`, `full-triseg-compatible`, and full TriSeg escalation before those mechanisms are claimed

### PR 4C-A — passive energy readiness candidate

- gate script: `npm run verify:myocardium-passive-energy-readiness`
- descriptor: `data/myocardium/protocols/passive-energy-phase4c-protocols.json`
- candidate implementation: `engine/myocardium/mechanics/passiveExponentialEnergyV1.ts`
- scope: engineering-strain convex exponential energy readiness candidate only
- checks: energy-derived passive stress, passive-stress-derived tangent, convexity sweep, smooth positive hinge continuity, slack/compression behavior, viscous dashpot dissipation sign, legacy passive parameter exclusion, and no pressure floor or stress clamp in the candidate implementation
- boundary: Decision 5, Decision 6, and Decision 8 remain `PENDING OWNER`; no production passive-law acceptance, no official morphology outcome, no live runtime replacement, no ModelCore/chamber/schema/official-case wiring, and no multi-coordinate generalized-force mapper
- prior gates: Phase 3B, Phase 4B-A, and Phase 4B-B reused read-only with pass/hash evidence
- non-coverage: RV pressure overload, septal bowing, ventricular interdependence, and right-heart failure are not covered by this gate
- future TriSeg path: preserve `triseg-lite-compatible`, `full-triseg-compatible`, and full TriSeg escalation before those mechanisms are claimed

### PR 4C-B — generalized-force mapper extension

- gate script: `npm run verify:myocardium-generalized-force-mapper-readiness`
- descriptor: `data/myocardium/protocols/generalized-force-mapper-phase4c-protocols.json`
- mapper implementation: `engine/myocardium/mechanics/virtualPowerGeneralizedForceV1.ts`
- scope: synthetic multi-coordinate virtual-power closure artifact only, with no runtime/official-case/workbench wiring
- checks: active/passive/viscous contribution decomposition per coordinate as `Vw0*S*dE_f/dq_i`, explicit coordinate-rate virtual-power closure, scalar Phase 3B-compatible derived rate, zero-derivative exact zero contribution, m3-only `volumeCoordinatePressurePa`, deterministic summary hash, runtime leak scan, forbidden positive-claim scan, and mapper isolation from concrete kinematics engines or Land implementation
- boundary: Decisions 4, 5, 6, and 8 remain `PENDING OWNER`; accepted Decision 19 owner selection is reused read-only; `ownerAcceptanceStatus=not-owner-acceptance`; `evidenceStatus=synthetic-multi-coordinate-virtual-power-closure-only`; no production mechanics, production homogenization, production passive-law acceptance, official morphology outcome, atrial bridge selection, live runtime replacement, ModelCore/chamber/schema/official-case wiring, or workbench wiring
- prior gates: Phase 3B, Phase 4B-A, Phase 4B-B, and Phase 4C-A reused read-only with pass/hash evidence; Phase 4C-A must still have `enableMultiCoordinateGeneralizedForceMapper=false`
- non-coverage: official morphology, atrial bridge selection, RV pressure overload, septal bowing, ventricular interdependence, and right-heart failure are not covered by this gate
- future TriSeg path: preserve `triseg-lite-compatible`, `full-triseg-compatible`, and full TriSeg escalation before those mechanisms are claimed

### PR 4D — selected-mechanics calibration readiness

- gate script: `npm run verify:myocardium-selected-mechanics-calibration-readiness`
- descriptor: `data/myocardium/protocols/selected-mechanics-calibration-phase4d-protocols.json`
- selected candidate implementation: `engine/myocardium/kinematics/thickSphereV2SelectedBackend.ts`
- scope: `selected-mechanics-calibration-readiness-only`; this is a descriptor/report/verifier/test/docs gate and not runtime wiring
- selected candidate: `thick-sphere-v2-explicit-external-septal-coupling` / `thick-sphere-v2`
- candidate executable claim: `selected-thick-sphere-v2-calibration-candidate-executable`
- candidate identity: v2-owned LV/RV parameter set ids `kinematics-lv-thick-sphere-v2-calibration-candidate-v1` and `kinematics-rv-thick-sphere-v2-calibration-candidate-v1`, with stable hashes distinct from Phase 3 `thick-sphere-spike-v1`
- geometry checks: finite-strain LV/RV thick-sphere samples, calibration-domain coverage, analytic `dE_f/dV` vs finite difference, deterministic replay
- calibration freedom matrix: fixed Land source `Tref`, no free homogenization gain, no free pressure gain, no free geometry gain, target packs and measurement hooks only
- composition smoke: Land-style active source stress, Phase 4C-A passive candidate output, and Phase 4C-B generalized-force mapper are combined on synthetic selected-backend samples; virtual-power residual and `m3` pressure maps must be finite
- source boundary: Decisions 4, 5, 6, and 8 remain `PENDING OWNER`; accepted Decision 19 owner selection is reused read-only; Phase 4A dossier remains frozen/read-only
- prior evidence: Phase 4B-A, Phase 4B-B, Phase 4C-A, and Phase 4C-B pass/hash evidence reused read-only
- frozen Phase 4B-A evidence: the prior executable coordinate path was `thick-sphere-spike-v1`; PR 4D must not treat `thick-sphere-spike-v1` as the current selected v2 candidate identity
- morphology/no-alternans boundary: measurement hooks only; Phase 4B-A beat-stability smoke reused read-only; no official morphology pass, no robust calcium-cycling no-alternans validation
- non-coverage: no production mechanics completion, no production validation, no live runtime replacement, no ModelCore/chamber/schema/official-case/workbench wiring, no septal coordinate implementation, no septal coupling implementation, no RV pressure overload coverage, no septal bowing coverage, no ventricular interdependence coverage, and no right-heart failure coverage
- future TriSeg path: preserve `triseg-lite-compatible`, `full-triseg-compatible`, and full TriSeg escalation before RV pressure overload, septal bowing, ventricular interdependence, or right-heart failure are claimed

## Phase 5 — stable local coupling and performance

### Phase 5A — local monolithic BE reference readiness

- gate script: `npm run verify:myocardium-local-monolithic-coupling-readiness`
- descriptor: `data/myocardium/protocols/local-monolithic-coupling-phase5a-protocols.json`
- reference implementation: `engine/myocardium/coupling/localMonolithicBeV1.ts`
- reference model id: `local-monolithic-be-v1`
- scope: pure local monolithic BE reference only, side-effect-free and not wired to runtime
- checks: selected v2 LV/RV samples, prescribed calcium, Land BE residual convergence for the six Land states, identity homogenization, passive exponential energy, generalized-force pressure map, coupled 7-unknown Newton residual over cavity volume plus Land state, Newton finite-difference Jacobian evidence, line-search evidence, finite state health, derived Land strain-rate consistency, deterministic hash, and pinned Phase 4D read-only hash evidence
- pinned Phase 4D evidence: current recomputed `stableSummaryHash` must be in the descriptor's accepted runner hash set, and selected candidate hash, LV parameter hash, and RV parameter hash must match the descriptor pins or the verifier fails
- boundary: Phase 5A is not Phase 5 completion. SDIRK2 reference completion is Phase 5B work because current `deriveLand2017StepKinematics()` throws for SDIRK2. Production solver comparison is not claimed, performance acceptance is not claimed, active-stiffness production coupling is not claimed, active-stiffness partitioned production coupling is not claimed, runtime replacement, ModelCore wiring, chamber wiring, case wiring, official-case wiring, and workbench wiring are not claimed, official morphology pass and robust no-alternans are not claimed, septal coordinate/coupling implementation, RV pressure overload, septal bowing, ventricular interdependence, and right-heart failure coverage are not claimed, and TriSeg adoption is not claimed.
- future TriSeg path: preserve `triseg-lite-compatible`, `full-triseg-compatible`, and full TriSeg escalation before RV pressure overload, septal bowing, ventricular interdependence, or right-heart failure are claimed

### Phase 5B — local monolithic SDIRK2 reference readiness

- gate script: `npm run verify:myocardium-local-monolithic-sdirk2-readiness`
- descriptor: `data/myocardium/protocols/local-monolithic-coupling-phase5b-sdirk2-protocols.json`
- dedicated Land entrypoint: `engine/myocardium/myofilament/land2017/sdirk2.ts`
- reference implementation: `engine/myocardium/coupling/localMonolithicSdirk2V1.ts`
- reference model id: `local-monolithic-sdirk2-v1`
- scope: pure local monolithic SDIRK2 synthetic reference only, side-effect-free and not wired to runtime
- tableau: fixed `gamma = 1 - 1 / Math.sqrt(2)`, two-stage stiffly accurate SDIRK2, `a00=gamma`, `a10=1-gamma`, `a11=gamma`, `c0=gamma`, `c1=1`, final state `Y1`
- stage policy: solve stage0 then stage1 as sequential 7-unknown systems over cavity volume plus Land state; do not use a 14-unknown simultaneous solve
- checks: stage0/stage1 strain-rate formulas, stage0/stage1 cavity coordinate-rate formulas, selected v2 kinematics/passive/generalized-force `coordinateRatesSI`, sequential stage-increment prescribed-calcium `dtSec` semantics, Land SDIRK2 residual convergence, local force-balance residual, Newton finite-difference Jacobian evidence, line-search evidence, finite state health, BE-vs-SDIRK2 finite bounded discrepancy, deterministic hash, and pinned Phase 4D read-only hash evidence
- boundary: Phase 5B SDIRK2 reference completion is limited to the local monolithic synthetic reference. Phase 5 completion, production solver comparison, performance acceptance, active-stiffness production coupling, active-stiffness partitioned production coupling, runtime replacement, ModelCore wiring, chamber wiring, case wiring, official-case wiring, workbench wiring, official morphology pass, robust no-alternans, calcium-cycling alternans acceptance, septal coordinate/coupling implementation, RV pressure overload, septal bowing, ventricular interdependence, right-heart failure coverage, and TriSeg adoption are not claimed.
- future TriSeg path: preserve `triseg-lite-compatible`, `full-triseg-compatible`, and full TriSeg escalation before RV pressure overload, septal bowing, ventricular interdependence, or right-heart failure are claimed

### Phase 5C-A — Land shadow alternans comparator readiness

- gate script: `npm run verify:myocardium-land-shadow-alternans-comparator-readiness`
- scope: feedforward shadow replay artifact for the legacy fixed low-preload period-2 VLV trajectory, using selected thick-sphere-v2 LV kinematics, prescribed calcium, and Land source active stress
- differentiation from Phase 4B-A: Phase 4B-A synthetic prescribed protocol remains read-only prior evidence; Phase 5C-A replays the fixed legacy activeStress low-preload period-2 VLV trajectory as prescribed input and does not run a closed-loop new-myocardium verdict
- fixed legacy protocol: baseline 5600 mL, delta -1250 mL, effective 4350 mL, `heartModel=activeStress`, `dt=0.001`, `sampleHz=120`, `traceBeats=4`, and no return-map acceptance
- interpretation: any Land beat-to-beat delta is inherited from prescribed alternating legacy volume, not generated by Land and not calcium-cycling alternans
- policy boundary: legacy reproduction is checked, `newMyocardiumCheck.required` is not performed or satisfied, second-order reference policy is preserved, and final no-alternans is not claimed
- current outcome: validation PASS / artifactGate PASS means the verifier deterministically reports the evidence and Phase 5C-B's selected v2 LV 30 mL lower-domain extension covers the fixed legacy VLV trajectory inside the selected LV calibration domain
- boundary: no runtime replacement, no official morphology pass, no robust no-alternans, RV pressure overload not covered, ventricular interdependence not covered, right-heart failure not covered, and TriSeg future not covered by this gate

### Phase 5C-B — selected-v2 low-preload domain extension

- plan: [phase5c-low-preload-domain-plan.md](phase5c-low-preload-domain-plan.md)
- scope: lower the selected thick-sphere-v2 LV calibration-readiness domain floor from 50 mL to 30 mL so the fixed Phase 5C-A legacy low-preload VLV envelope is inside the selected LV domain
- checks: unchanged LV anchor/max, RV lower-domain parity, finite LV 30 mL geometry, in-domain finite-difference derivative closure, finite pressure-map composition smoke, deterministic hash updates, and Phase 4D/5A/5B/5C-A pin re-derivation
- outcome: Phase 5C-A artifactGate can pass for domain-covered feedforward shadow replay evidence only
- boundary: no runtime replacement, no official morphology pass, no final robust no-alternans, no calcium-cycling alternans acceptance, no RV pressure overload/interdependence/RHF coverage, and no TriSeg adoption

### Phase 5C-C — new-myocardium low-preload check

- plan: [phase5c-new-myocardium-check-plan.md](phase5c-new-myocardium-check-plan.md)
- scope: add a standalone selected-v2 + Land low-preload artifact that generates its own LV trajectory with a declared preload/afterload surrogate, rather than replaying the Phase 5C-A legacy VLV trace
- positive control: the same surrogate closure must reproduce period-2 branch behavior with a state-dependent legacy activeStress source provider before the Land run can be interpreted as BE smoke evidence
- morphology: report named LVP/AoP/QAo pressure morphology metrics as `reported-not-official`; do not call or claim the full ModelCore official morphology gate
- current outcome: validation PASS / artifactGate FAIL because the faithful same-closure legacy activeStress positive control is finite but settles to period-1, so the Land generated trajectory is not interpretable as no-alternans evidence
- boundary: no ModelCore/chamber/case/workbench wiring, no official morphology pass, `newMyocardiumCheckRequiredSatisfied=false`, `secondOrderSameProtocolStatus=not-performed`, no final robust no-alternans, no RV pressure overload/interdependence/RHF coverage, and no TriSeg adoption

### Phase 5C-D — positive-control fidelity audit

- plan: [phase5c-positive-control-fidelity-audit-plan.md](phase5c-positive-control-fidelity-audit-plan.md)
- audit evidence: `data/myocardium/protocols/land-new-myocardium-low-preload-phase5c-fidelity-audit-v1.json`
- scope: encode the Phase 5C-C positive-control no-go as a fidelity audit over the existing artifact, not as a duplicated surrogate or parallel verifier
- gate script: `npm run verify:myocardium-land-new-myocardium-low-preload-check`
- current branch: Phase 5C-A read-only legacy reproduction remains period-2 and pinned; Phase 5C-C same-closure legacy activeStress positive control remains `settled-period-1`; Phase 5C-C artifactGate is expected to remain failed while that positive control fails period-2 thresholds
- advancement block: the Land generated run is not interpretable as no-alternans evidence, same-protocol second-order advancement remains blocked, and final no-alternans remains not claimed until the same closure reproduces the legacy period-2 positive control or a later owner-approved replacement criterion supersedes it
- boundary: no new engine closure, no ModelCore/chamber/case/workbench wiring, no qDot/valve/arterial-load tuning, no official morphology pass, no robust no-alternans, no RV pressure overload/interdependence/RHF coverage, and no TriSeg adoption

### Phase 5C-E — post-fidelity entry gate

- plan: [phase5c-post-fidelity-entry-gate.md](phase5c-post-fidelity-entry-gate.md)
- entry gate: `data/myocardium/gates/phase5c-post-fidelity-entry-gate-v1.json`
- gate script: `npm run verify:myocardium-phase5c-post-fidelity-entry-gate`
- source audit evidence: `land-new-myocardium-low-preload-phase5c-fidelity-audit-v1`
- current outcome: entry remains blocked by `blocked-until-positive-control-period2`, with the Land run `not-interpretable-positive-control-failed` and final no-alternans not claimed
- entry route ids: `same-closure-period2-positive-control`, requiring period-2 positive-control reproduction under the pinned Phase 5C-C same-closure thresholds; `modelcore-equivalent-closure-positive-control`, with `status=defined-not-satisfied`; or `owner-approved-replacement-criterion`, requiring a later owner approval artifact with explicit owner provenance that supersedes the current criterion
- Phase 5C-I owner decision: no production ModelCore wiring is authorized. Current partial evidence uses an artifact-only source-provider constructor hook and reproduces the legacy activeStress period-2 positive control through that hook, but Land pairing has not yet run and the route remains unsatisfied.
- boundary: no runtime replacement, no chamber/case/workbench/state-schema wiring, no production ModelCore adoption beyond the artifact-only constructor hook, no qDot/valve/afterload tuning, no official morphology acceptance, no final no-alternans, no RV pressure-overload/interdependence/RHF coverage, and no TriSeg adoption

### Phase 5C-F — positive-control triage audit

- plan: [phase5c-positive-control-triage-audit.md](phase5c-positive-control-triage-audit.md)
- triage gate: `data/myocardium/gates/phase5c-positive-control-triage-audit-v1.json`
- gate script: `npm run verify:myocardium-phase5c-positive-control-triage-audit`
- source entry gate: `phase5c-post-fidelity-entry-gate-v1`
- current outcome: plan-only triage; Phase 5C-E entry remains `entry-blocked-until-route-satisfied`, with same-closure advancement still `blocked-until-positive-control-period2`
- diagnostic lanes: `same-closure-source-provider-audit`, `closure-event-surface-diagnostic`, and `owner-replacement-criterion-prep`
- boundary: report-only or owner-pending triage; no runtime replacement, no ModelCore/chamber/case/workbench/state-schema wiring, no qDot/valve/afterload tuning, no official morphology acceptance, no final no-alternans, no RV pressure-overload coverage, no ventricular interdependence coverage, no right-heart failure coverage, and no TriSeg adoption

### Phase 5C-G — same-closure source-provider audit

- plan: [phase5c-same-closure-source-provider-audit.md](phase5c-same-closure-source-provider-audit.md)
- audit snapshot: `data/myocardium/gates/phase5c-same-closure-source-provider-audit-v1.json`
- gate script: `npm run verify:myocardium-phase5c-same-closure-source-provider-audit`
- source triage gate: `phase5c-positive-control-triage-audit-v1`
- current outcome: source-provider audit only; Phase 5C-E entry remains `entry-blocked-until-route-satisfied`, with the positive control still `positive-control-failed`, `settled-period-1`, and `blocked-until-positive-control-period2`
- PR #193 handoff: `modelcore-equivalent-closure-positive-control` remains `proposed-next-route-not-implemented` in this historical snapshot; Phase 5C-G does not implement or satisfy that route
- boundary: report-only same-closure provenance snapshot; no runtime replacement, no ModelCore/chamber/case/workbench/state-schema wiring, no ModelCore-equivalent closure implementation, no qDot/valve/afterload tuning, no official morphology acceptance, no final no-alternans, no RV pressure-overload coverage, no ventricular interdependence coverage, no right-heart failure coverage, and no TriSeg adoption

### Phase 5C-H — ModelCore-equivalent positive-control route definition

- plan: [phase5c-modelcore-equivalent-route-gate.md](phase5c-modelcore-equivalent-route-gate.md)
- route id: `modelcore-equivalent-closure-positive-control`
- closure protocol descriptor: `data/myocardium/protocols/modelcore-equivalent-positive-control-closure-v1.json`
- gate script: `npm run verify:myocardium-phase5c-post-fidelity-entry-gate`
- current outcome: route definition plus Phase 5C-I partial evidence; the route remains `defined-not-satisfied`, with `closureImplementationStatus=experimental-source-provider-hook-implemented`, `routeSatisfactionStatus=partial-legacy-positive-control-pass-land-pairing-not-run`, and advancement still `blocked-until-positive-control-period2`
- evidence boundary: paired Land source-provider evidence is still required, event-surface preservation or explicit matching is still required, source-provider-difference-only is still required, and second-order reference evidence is still required before interpretation can advance
- boundary: no runtime replacement, no chamber/case/workbench/state-schema wiring, no production ModelCore adoption beyond the artifact-only constructor hook, no qDot/valve/afterload tuning, no official morphology acceptance, no final no-alternans, no RV pressure-overload coverage, no ventricular interdependence coverage, no right-heart failure coverage, and no TriSeg adoption

### Phase 5C-J — ModelCore active-provider state lifecycle

- plan: [phase5c-modelcore-equivalent-route-gate.md](phase5c-modelcore-equivalent-route-gate.md)
- lifecycle descriptor: `data/myocardium/protocols/modelcore-active-provider-state-lifecycle-v1.json`
- verifier: `npm run verify:myocardium-modelcore-active-provider-state-lifecycle`
- current outcome: experimental provider state is owned by ModelCore, cloned before RHS/pressure/debug calls, restored into read-only measurement clones, and committed only through `commitProviderStateAfterStep` once per `step()`
- route status: prerequisite implemented, but `modelcore-equivalent-closure-positive-control` remains unsatisfied with `routeSatisfactionStatus=partial-legacy-positive-control-pass-land-pairing-not-run`; paired Land evidence and `sourceProviderDifferenceOnly=true` are still not evaluated
- boundary: no runtime replacement, no official morphology acceptance, no final no-alternans, no qDot/valve/afterload tuning, no Land parameter tuning, no chamber/case/workbench/state-schema production adoption, and no TriSeg adoption

### Phase 5C-K — ModelCore source-only pressure adapter

- plan: [phase5c-modelcore-equivalent-route-gate.md](phase5c-modelcore-equivalent-route-gate.md)
- adapter descriptor: `data/myocardium/protocols/modelcore-active-source-pressure-adapter-v1.json`
- verifier: `npm run verify:myocardium-modelcore-active-source-pressure-adapter`
- current outcome: the legacy LV source-only adapter supplies `sourceActiveStressPa` only, while ModelCore routes that source stress through the existing active-stress pressure assembly; selected low-preload trace/metric evidence matches the legacy full-pressure provider with zero numeric difference
- source-provider contract: source-only providers cannot also define pressure overrides, must provide source-specific debug active-stress terms, and must keep mutable solver state in `providerState` rather than provider-object closures
- route status: adapter prerequisite recorded, but `modelcore-equivalent-closure-positive-control` remains unsatisfied with `routeSatisfactionStatus=partial-legacy-positive-control-pass-land-pairing-not-run`; paired Land evidence and `sourceProviderDifferenceOnly=true` are still not evaluated
- boundary: no runtime replacement, no official morphology acceptance, no final no-alternans, no qDot/valve/afterload tuning, no Land parameter tuning, no chamber/case/workbench/state-schema production adoption, and no TriSeg adoption

### Phase 5C-L — paired Land source-provider run under ModelCore closure

- plan: [phase5c-modelcore-equivalent-route-gate.md](phase5c-modelcore-equivalent-route-gate.md)
- paired run descriptor: `data/myocardium/protocols/modelcore-paired-land-source-provider-run-v1.json`
- paired run result artifact: `data/myocardium/protocols/modelcore-paired-land-source-provider-run-result-v1.json`
- verifier: `npm run verify:myocardium-modelcore-paired-land-source-provider`
- current outcome: the paired LV source-provider experiment runs under the same pinned low-preload ModelCore closure. The legacy source-only positive control remains period-2, the Land 2017 LV source-only provider runs finite with zero Land solver failures and settles to period-1, and `sourceProviderDifferenceOnly=true` is satisfied for the experimental LV source-only pair.
- interpretation: Phase 5C-L records outcome class A, a positive interpretable signal for this experimental closure. It is not final no-alternans acceptance and not official morphology acceptance.
- boundary: no runtime replacement, no official morphology acceptance, no final no-alternans, no qDot/valve/afterload/preload tuning, no Land parameter tuning, no chamber/case/workbench/state-schema production adoption, and no TriSeg adoption.
- next: interpret qDot clamp-threshold attribution, then add output-matched and second-order/reference robustness evidence without changing the closure or source parameters.

### Phase 5C-M — paired Land qDot clamp-threshold attribution

- result artifact: `data/myocardium/protocols/modelcore-paired-land-qdot-clamp-attribution-result-v1.json`
- verifier: `npm run verify:myocardium-modelcore-paired-land-qdot-clamp-attribution`
- current outcome: the same Phase 5C-L paired closure is reused. The legacy trace records AoV qDot clamp hit fraction 0.0521, peak raw qDot 404765 mL/s^2, and QAo cap ratio 0.997. The Land trace records AoV qDot clamp hit fraction 0, peak raw qDot 9600 mL/s^2, and QAo cap ratio 0.112 while also running with lower SV/CO/QAo peak.
- interpretation: `clamp-threshold-avoidance-risk-supported`. Land period-1 remains a positive interpretable signal, but the evidence does not establish that Land structurally removed alternans; the measured Land trace is below the AoV qDot clamp-engaged regime.
- boundary: no runtime replacement, no official morphology acceptance, no final no-alternans, no qDot/valve/afterload/preload tuning, no Land parameter tuning, no chamber/case/workbench/state-schema production adoption, and no TriSeg adoption.
- next: run output-matched paired evidence, SDIRK2 reference evidence, and a preload-domain sweep before any structural no-alternans interpretation.

### Phase 5C-N — paired Land output-match qDot attribution diagnostic

- result artifact: `data/myocardium/protocols/modelcore-paired-land-output-matched-qdot-attribution-result-v1.json`
- verifier: `npm run verify:myocardium-modelcore-paired-land-output-matched-qdot-attribution`
- current outcome: a predeclared TBV-axis matrix `[-1250, -1000, -750, -500, 0, 500, 1000]` runs legacy and Land source-only providers at each same effective-TBV point. Every point is independently initialized, converges before the 45s cap, has clean TBV/health, and preserves source-provider-only comparison within the point.
- interpretation: output-match `not-overlapped`. The best Land diagnostic point reaches only 0.376 of pinned legacy CO/SV and 0.091 of pinned legacy QAo peak, so the predeclared preload/TBV axis does not place Land into the pinned legacy qDot clamp-engaged regime. Clamp-threshold avoidance remains unresolved; structural alternans removal is not established.
- boundary: no runtime replacement, no official morphology acceptance, no final no-alternans, no qDot/valve/afterload/preload tuning, no Land parameter tuning, no chamber/case/workbench/state-schema production adoption, and no TriSeg adoption.
- next: run SDIRK2 reference evidence and decide whether an explicit output-forcing or other owner-approved match axis is scientifically warranted before structural attribution.

### Phase 5C-O — Land activation/source-interface audit

- result artifact: `data/myocardium/protocols/modelcore-land-activation-interface-audit-result-v1.json`
- verifier: `npm run verify:myocardium-modelcore-land-activation-interface-audit`
- current outcome: the pinned low-preload point and the Phase 5C-N best-Land point are rerun under the same source-provider-only closure. All points converge, Land has zero solve failures, and source/commit path audit samples are recorded.
- interpretation: `land-source-interface-underactivation-gap-observed`. The settled Land trace active-stress target is only 0.00119 of pinned legacy at `delta=-1250` and 0.000892 at `delta=1000`. Provider source/commit path transients can be higher, so the next question is the settled activation/source interface rather than a larger TBV sweep.
- boundary: no runtime replacement, no official morphology acceptance, no final no-alternans, no structural alternans removal claim, no qDot/valve/afterload/preload tuning, no Land parameter tuning, no chamber/case/workbench/state-schema production adoption, and no TriSeg adoption.
- next: run calcium input scale/unit audit and an explicit source/output-forcing bracket, plus SDIRK2 reference evidence before any structural attribution.

### Phase 5C-P — Land calcium/source forcing bracket

- result artifact: `data/myocardium/protocols/modelcore-land-calcium-source-forcing-bracket-result-v1.json`
- verifier: `npm run verify:myocardium-modelcore-land-calcium-source-forcing-bracket`
- current outcome: the pinned low-preload point and the Phase 5C-N best-Land point are rerun with predeclared calcium-input and source-stress forcing scenarios inside the experimental source provider only. All 18 forced points converge, have zero Land solve failures, and record source/commit/forcing audit samples.
- interpretation: `calcium-input-scaling-reaches-legacy-regime`. The best calcium-input forcing candidate (`calcium-scale-30` at `delta=-1250`) matches the legacy output regime and recovers AoV qDot clamp engagement while remaining period-1. This weakens the pure clamp-avoidance explanation, but remains explicit forcing attribution evidence and a calcium-unit/source-interface audit target.
- boundary: no runtime replacement, no official morphology acceptance, no final no-alternans, no structural alternans removal claim, no qDot/valve/afterload/preload tuning, no Land parameter tuning, no chamber/case/workbench/state-schema production adoption, and no TriSeg adoption.
- next: audit the legacy active internal `c` to Land free-calcium unit/source mapping, then run SDIRK2 reference evidence before any final no-alternans interpretation.

### Phase 5C-Q — Land calcium unit/source-interface audit

- result artifact: `data/myocardium/protocols/modelcore-land-calcium-unit-interface-audit-result-v1.json`
- verifier: `npm run verify:myocardium-modelcore-land-calcium-unit-interface-audit`
- current outcome: the pinned low-preload point and the Phase 5C-N best-Land point are rerun under the same non-provider closure with direct, fixed unit-style, activation-equivalent diagnostic, and Phase 5C-P reference calcium mappings. All 14 mapped Land points converge, have zero Land solve failures, and record source/commit/calcium mapping audit samples.
- interpretation: `simple-unit-mapping-sufficient`. The pinned legacy LV `c` peak is 0.1523, so the Phase 2B absolute peak free-calcium mapping uses scale 6.70 and the Land CaT50Ref peak mapping uses scale 5.28. The `phase2b-absolute-peak-ca` simple unit-style calcium mapping reaches the coarse legacy output/qDot regime at `delta=-1250` while Land remains period-1. Phase 5C-P scale 30 remains a positive-control reference, not a required scale.
- boundary: no runtime replacement, no official morphology acceptance, no final no-alternans, no structural alternans removal claim, no qDot/valve/afterload/preload tuning, no Land parameter tuning, no source-stress scaling, no chamber/case/workbench/state-schema production adoption, and no TriSeg adoption.
- next: run SDIRK2 reference evidence for the legacy pinned/raw Land/audited calcium mapping candidate before final no-alternans interpretation, then stop extending alternans mechanism subphases and move toward Level 1-4 operating-point calibration plus an education-tool Definition of Done checkpoint.

### Phase 5C-R — Land provider-local SDIRK2 commit-solver reference

- result artifact: `data/myocardium/protocols/modelcore-land-sdirk2-reference-result-v1.json`
- verifier: `npm run verify:myocardium-modelcore-land-sdirk2-reference`
- current outcome: the pinned low-preload point and the Phase 5C-N best-Land point are rerun with legacy source-only, raw Land BE/SDIRK2, and Phase 5C-Q `phase2b-absolute-peak-ca` Land BE/SDIRK2 cells. All points settle with clean health and source/commit audit samples. This is provider-local commit-solver evidence only; ModelCore's global stepper and non-provider closure are unchanged.
- interpretation: `sdirk2-reference-inconclusive`. At the pinned mapped point, provider-local SDIRK2 preserves period-1 and the coarse legacy output/qDot regime with score delta 0.0017 vs BE. However SDIRK2 stage1 solve failures remain high, so this cannot be used as final no-alternans or structural alternans-removal evidence.
- boundary: no global ModelCore SDIRK2 claim, no runtime replacement, no official morphology acceptance, no final no-alternans, no structural alternans removal claim, no qDot/valve/afterload/preload tuning, no Land parameter tuning, no source-stress scaling, no chamber/case/workbench/state-schema production adoption, and no TriSeg adoption.
- next: move the myocardium lane toward Level 1-4 operating-point calibration and an education-tool Definition of Done checkpoint. Treat further SDIRK2 solver hardening as a narrow technical blocker only if final no-alternans acceptance becomes explicit scope.

### Phase 5S — closed-loop operating-point calibration diagnostic

- result artifact: `data/myocardium/protocols/modelcore-land-operating-point-calibration-result-v1.json`
- verifier: `npm run verify:myocardium-modelcore-land-operating-point-calibration`
- current outcome: legacy LV source-only and Phase 5C-Q `phase2b-absolute-peak-ca` Land BE source-only are rerun at fixed diagnostic points `-1250`, `0`, and `1000` mL. All points settle with clean health. Land has zero BE solve failures and source/commit/calcium audit samples are present.
- interpretation: `main-domain-calibration-signal-low-preload-edge-report-only`. The main-domain points `0` and `1000` mL sit in a coarse legacy output/stress regime and remain period-1. The pinned low-preload point remains report-only edge evidence. The education-tool DoD checkpoint is `draft-do-d-ready-for-owner-review`, not accepted.
- boundary: operating-point-calibration-diagnostic-only; no Level 3/4 acceptance, no global ModelCore SDIRK2 claim, no runtime replacement, no official morphology acceptance, no final no-alternans, no structural alternans removal claim, no qDot/valve/afterload/preload tuning, no Land parameter tuning, no source-stress scaling, no chamber/case/workbench/state-schema production adoption, and no TriSeg adoption.
- next: owner-review the education-tool Definition of Done checkpoint, then decide whether a developer-only LV Land runtime flag design is warranted before any case/workbench/official runtime wiring.

### Phase 5T — education-tool Definition of Done checkpoint

- result artifact: `data/myocardium/protocols/myocardium-education-tool-dod-checkpoint-v1.json`
- verifier: `npm run verify:myocardium-education-tool-dod-checkpoint`
- current outcome: Phase 5S evidence plus official-case teaching metadata and Studio MVP surface requirements classify the education-tool DoD as `owner-review-ready-not-accepted`. The artifact records `accepted: false`, `runtimeWiring: absent`, `caseWiring: absent`, and `workbenchWiring: absent`.
- boundary: education-tool-report-only; no runtime replacement, no official case wiring, no Workbench runtime wiring, no Level 3/4 acceptance, no official morphology acceptance, no final no-alternans, no structural alternans removal, and no qDot/valve/afterload/preload/Land-parameter tuning.
- next: decide whether this checkpoint is sufficient to authorize a developer-only LV Land runtime-flag design RFC before any case/workbench/official runtime wiring.

### Phase 5U — developer-only LV Land runtime-flag RFC

- result artifact: `data/myocardium/protocols/myocardium-developer-only-lv-land-runtime-flag-rfc-v1.json`
- verifier: `npm run verify:myocardium-developer-only-lv-land-runtime-flag-rfc`
- current outcome: the RFC defines a tool-only helper that creates LV-only experimental ModelCore active-source provider options from the Phase 5C-Q `phase2b-absolute-peak-ca` mapping after an explicit developer-only acknowledgement, then smoke-checks that ModelCore exposes the provider through debug state. The artifact is `rfc-draft-owner-decision-needed` and `accepted: false`.
- boundary: developer-only-runtime-flag-rfc-no-runtime-wiring; no runtime replacement, no production registry integration, no official case wiring, no Workbench runtime wiring, no runtime flag UI, no state-schema migration, no Level 3/4 acceptance, no official morphology acceptance, no final no-alternans, and no structural alternans-removal claim.
- next: owner GO/NO-GO on implementing a non-production developer-only LV Land runtime flag. A GO still must keep official cases, Workbench, production registries, and state schema blocked until separately accepted.

### Phase 5C+ — deferred stable-coupling work

- production solver comparison
- active-stiffness partitioned production coupling
- performance smoke and acceptance
- ModelCore registry integration

### Layer consistency and alternans policy proposed in PR #166

Future Phase 5/6 reports must recheck Phase 2B shape/timing through later layers:

```text
FWHM
time-to-peak
relaxation tau
Ca-to-stress peak delay
```

They must also reproduce legacy activeStress alternans under a fixed protocol and check the new myocardium under the same protocol. Final no-alternans interpretation must not rely on BE alone; SDIRK2 or an equivalent second-order reference is required.

Artifact: `data/myocardium/protocols/layer-consistency-and-alternans-policy-v1.json`.

## Phase 5.5 — atrial bridge shootout proposed in PR #166

See:

```text
docs/myocardium/adr/ADR-MYO-002-atrial-bridge.md
docs/myocardium/model-spec/atrial-bridge-v1.md
docs/myocardium/verification/atrial-bridge-v1-verification.md
docs/myocardium/roadmap/atrial-bridge-shootout-roadmap.md
```

Candidates:

```text
E0: atrial-elastance-negative-control-v0
A0: legacy-atrial-active-bridge-v0
A1: atrial-reservoir-booster-bridge-v1
```

This phase must run before Phase 6 if ADR-MYO-002 is accepted.

## Phase 6 — LV/RV closed loop with selected atrial bridge

Previous text assumed:

```text
LV/RV: new Land-based myocardium
LA/RA: clean atrial elastance bridge
```

PR #166 proposes replacing that assumption with:

```text
LV/RV: new Land-based myocardium
LA/RA: selected validated atrial bridge from Phase 5.5
```

- closed-loop validation
- morphology transfer
- qDot/valve controls
- claim-boundary validation
- atrial bridge contamination report

## Phase 7 — atrial research phase

human atrial data、activation timing、AV-plane、reservoir/conduit/boosterを専用に扱う。LV parameter縮小コピーは禁止する。

Land/RDQ atrial work should be judged against the frozen legacy atrial-active baseline and AtrialReservoirBoosterBridgeV1, not adopted only because it is more mechanistic.

## Phase 8 — legacy removal and case re-authoring

- ActiveStressChamberModel、fixed 5-state slots、old knob resolver削除
- old state/case explicit rejection
- mechanism/claim-aware official case再authoring

## Phase 9 — optional extensions, each requiring a separate ADR

```text
BCS adapter/backend
ConservativeCalciumCyclingV1
TriSeg upgrade when not selected in Phase 4
MultiPatch/regional heterogeneity
regional activation / pacing / dyssynchrony
RDQ20 research backend
LandAtrialV1 / RDQAtrialV1
```

これらを一つのPhaseとしてまとめて実装しない。

# 20. 既存ファイル別変更マップ

## `engine/chambers.ts`

- Land equationsを置かない。
- elastance control/atrial bridgeを別ファイルへ分離。
- legacy active-stress codeを最終削除。

## `engine/core/stateLayout.ts`

- fixed `{c,a,r,tensionPa,lambdaAct}` slotsを削除。
- hierarchical instance registry-driven layoutへ変更。
- path、block version、labelsをhashへ含める。

## `engine/ModelCore.ts`

- `myocardialUnits` とexplicit atrial bridgeへ置換。
- activation eventsをschedulerから配布。
- generalized forcesをcoordinate ownerへ戻す。
- local solver/virtual-power healthを収集。

## `engine/protocol.ts`

- legacy `HeartModelMode`とscale fieldsを廃止。
- typed myocardium instance specs、claim level、solver/provenanceを追加。
- Phase 6 atrial bridge selection is read from the accepted Decision 21 artifact if ADR-MYO-002 is accepted.

## `engine/core/params.ts` / `engine/knobs.ts`

- old active-stress resolverをnew runtimeで使用しない。
- mechanism-based intervention resolverを追加。
- prescribed-Ca claim boundaryをUI/recipeへ伝播。

## New tools expected later

```text
tools/myocardium/verifyAtrialBridgeShootout.ts
tools/myocardium/verifyLayerConsistency.ts
tools/myocardium/verifyAlternansPolicy.ts
tools/myocardium/verifyPassiveEnergyReadiness.ts
```
