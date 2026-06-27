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

### Phase 5B+ — deferred stable-coupling work

- SDIRK2 reference completion
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
