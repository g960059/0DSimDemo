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

### PR 4C — passive energy + generalized-force mapper

- multi-coordinate contract
- active/passive/viscous contribution tests

### PR 4D — selected production mechanics calibration

## Phase 5 — stable local coupling and performance

- local monolithic BE
- SDIRK2 reference
- active-stiffness partitioned
- performance smoke
- ModelCore registry integration

## Phase 6 — LV/RV closed loop with temporary atrial bridge

```text
LV/RV: new Land-based myocardium
LA/RA: clean atrial elastance bridge
```

- closed-loop validation
- morphology transfer
- qDot/valve controls
- claim-boundary validation

## Phase 7 — atrial research phase

human atrial data、activation timing、AV-plane、reservoir/conduit/boosterを専用に扱う。LV parameter縮小コピーは禁止する。

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

## `engine/core/params.ts` / `engine/knobs.ts`

- legacy scale knobs削除。
- prescribed Ca、myofilament、passive、viable fractionのversioned recipeへ変更。
- SERCA/RyR等のrecipeは保存型Ca backendなしに追加しない。

## `engine/stateContract.ts`

- state instance path、block metadata、model IDs、target/claim/temperatureをserialize。
- old snapshotを明示拒否。

## Existing low-preload tools

- pressure morphology、qDot、event diagnosticsを保持。
- legacy `c/a/Kd/fIso/gOver/lambdaAct`を新diagnosticsへ置換。
- source stress、wall stress、generalized forces、activation event、solver residualを追加。

## New files

```text
engine/myocardium/activation/*
engine/myocardium/state/*
engine/myocardium/calcium/*
engine/myocardium/myofilament/land2017/*
engine/myocardium/homogenization/*
engine/myocardium/kinematics/*
engine/myocardium/material/*
engine/myocardium/mechanics/*
engine/myocardium/coupling/*
engine/chambers/atrialElastanceBridge.ts
tools/myocardium/*
```

# 21. Suggested package scripts

```json
{
  "scripts": {
    "verify:myocardium-contracts": "vite-node tools/myocardium/verifyContracts.ts",
    "verify:myocardium-land-protocols": "vite-node tools/myocardium/verifyLandProtocols.ts",
    "verify:myocardium-prescribed-calcium": "vite-node tools/myocardium/verifyPrescribedCalcium.ts",
    "verify:myocardium-calcium-land-isometric": "vite-node tools/myocardium/verifyCalciumLandIsometric.ts",
    "verify:myocardium-prescribed-shortening": "vite-node tools/myocardium/verifyPrescribedShortening.ts",
    "verify:myocardium-thick-sphere-kinematics": "vite-node tools/myocardium/verifyThickSphereKinematics.ts",
    "verify:myocardium-generalized-forces": "vite-node tools/myocardium/verifyGeneralizedForces.ts",
    "verify:myocardium-minimal-loaded-chamber": "vite-node tools/myocardium/verifyMinimalLoadedChamber.ts",
    "verify:myocardium-land-active-stress-replacement": "vite-node tools/myocardium/verifyLandActiveStressReplacement.ts",
    "verify:generalized-forces": "vite-node tools/myocardium/verifyGeneralizedForces.ts",
    "verify:single-chamber": "vite-node tools/myocardium/verifySingleChamber.ts",
    "verify:myocardial-coupling": "vite-node tools/myocardium/compareCouplingSolvers.ts",
    "verify:morphology-transfer": "vite-node tools/myocardium/reportMorphologyTransfer.ts",
    "verify:claim-boundary": "vite-node tools/myocardium/verifyClaimBoundary.ts",
    "benchmark:myocardium-runtime": "vite-node tools/myocardium/benchmarkRuntime.ts",
    "report:myocardial-identifiability": "vite-node tools/myocardium/identifiabilityReport.ts"
  }
}
```

CI:

```text
fast PR: contracts + selected Land/Ca tests
hypothesis PR: isometric + prescribed shortening + afterload family
mechanics PR: generalized force + rank + single chamber
nightly: closed-loop + bifurcation + performance + claim-boundary
```

Phase 3 gate artifactにはparameter/provenance、joint-feasibility summary、morphology transfer、commandsを含める。

# 25. Definition of Done

## Scientific

- Land source protocolsがversioned targetに合格。
- activation、prescribed Ca、Land、homogenization、mechanicsの責務が分離。
- prescribed shorteningと複数afterload loaded protocolにjoint feasible regionがある。
- loaded morphology targetを、SV/peak/ejection/clamp artifactなしに通過。
- source stress→wall stress→generalized forceの仮定とprovenanceが明示。
- selected production mechanics backendの適用範囲とlimitationsが明示。
- prescribed-Ca版がSR/RyR/SERCAをmechanisticに主張しない。

## Numerical

- BE/2次local referenceとproduction couplingが存在。
- strain/rate consistency、stabilization、algorithmic tangentを検証。
- multi-coordinate virtual-power test pass。
- silent clamp/projectionなし。

## Closed loop

- normal/HR/preload/afterload、TBV/LV-RV balance、morphology pass。
- qDot/valve event contaminationを分類。
- atrial configurationが明示。

## Performance

- approved realtime budgetを満たし、main threadをblockしない。

## Software/governance

- hierarchical patch-ready state layout。
- model/parameter/solver/target/claim/temperature provenance。
- legacy runtime/state/caseをsilent migrationしない。
- official casesをclaim-aware recipeで再authoring。
- ADR、model spec、verification plan、roadmap、design recordが同期。
- source registryの完全書誌がmerge gateを通る。

# 26. Open decisions requiring model-team sign-off

本節の推奨はowner判断用baselineである。

## 26.1 Decision summary

| # | Decision | Recommended default | Decide by | Status |
|---:|---|---|---|---|
| 1 | Land parameter variant | intact-human-37°C source set | Phase 0/1 | PENDING OWNER |
| 2 | Land source stress convention | fiber nominal / first-Piola scalar | Phase 0 | PENDING OWNER |
| 3 | fiber strain coordinate | engineering strain | Phase 0 | PENDING OWNER |
| 4 | source→wall homogenization | explicit adapter、fixed/independently constrained | Phase 4 | PENDING OWNER |
| 5 | sarcomere reference/anchor | source `Ls0` fixed、anchor fixed/narrow prior | Phase 3/4 | PENDING OWNER |
| 6 | passive law | convex exponential energy family | Phase 4 | PENDING OWNER |
| 7 | time integrator | BE bring-up、SDIRK2 reference、production benchmark | Phase 5 | PENDING OWNER |
| 8 | stiffness/tangent semantics | stabilization/algorithmic/frozenの3分離 | Phase 0/1 | PENDING OWNER |
| 9 | ActivationEvent contract | event ID＋time since event＋cycle length | Phase 0 | PENDING OWNER |
| 10 | prescribed Ca target/HR | paired Land＋human target、cycle-length knots | Phase 2 | PENDING OWNER |
| 11 | production Ca claim boundary | SERCA/RyR/SR-loadは保存型Caまで禁止 | Phase 0 | PENDING OWNER |
| 12 | closed-loop targets | versioned fit/validation/holdout packs | Phase 0 | PENDING OWNER |
| 13 | atrial progression gate | ventricular gates後 | Phase 6/7 | PENDING OWNER |
| 14 | loaded morphology target | composite pack、same measurement code | Phase 0 | ACCEPTED 2026-06-26 |
| 15 | early kill gate | joint feasibility後GO/REVISE/NO-GO | Phase 0/3 | ACCEPTED 2026-06-26 |
| 16 | realtime budget | 10× realtime等の暫定値 | Phase 0/5 | PENDING OWNER |
| 17 | temperature | fixed 310.15 K | Phase 0 | PENDING OWNER |
| 18 | first release atria | Land ventricles＋documented atrial bridge案 | release | PENDING OWNER |
| 19 | production ventricular mechanics | thick-sphere-v2-explicit-external-septal-coupling (initial thick-sphere-v2 backend) | before Phase 4B+ | ACCEPTED 2026-06-27 |
| 20 | regional runtime scope | schema only、MultiPatch runtimeは別ADR | Phase 0 | PENDING OWNER |

## 26.2 Recommended decisions

### Decision 1 — Land variant

`land2017-intact-human-37c-source-v1`から開始し、source setをimmutableに保つ。

### Decision 2 — source stress convention

Land `T_a`をengineering strainに共役なfiber nominal/first-Piola scalar stressと解釈する。

### Decision 3 — strain coordinate

\[
E_f=L_s/L_{s,0}-1
\]

### Decision 4 — homogenization

source Land outputをwall stressへ直結せず、active tissue fractionとorientation ruleを持つadapterを使う。初期値は固定/独立拘束し、PV loopだけでfitしない。

### Decision 5 — sarcomere anchor

`Ls0`はsource固定、`Ls,anchor`と`Vanchor`は独立data/狭いprior。rankが不足する場合は自由度を減らす。

### Decision 6 — passive law

旧parameterを移植せず、engineering strainに対するconvex exponential energy family。

### Decision 7 — integrator

BE bring-up、SDIRK2 release reference、productionはaccuracy/performanceで選ぶ。

### Decision 8 — tangent semantics

`stabilizationStiffnessPa`、`algorithmicTangentPa`、`frozenStateTangentPa`を別fieldにする。

### Decision 9 — ActivationEvent

`activationEventId`、`timeSinceActivationSec`、`cycleLengthSec`をsingle source of truthとし、HR/phase/event flagを重複させない。

### Decision 10 — prescribed Ca

Land paired target＋human experimental target、cycle-length knot table。backend名は `PrescribedCalciumTransientV1`。

### Decision 11 — Ca claim boundary

保存型Ca backendなしにSERCA/RyR/SR-loadをofficial mechanistic interventionとして出さない。

### Decision 12 — closed-loop targets

anatomy、hemodynamics、morphology、dynamic responseを分け、fit/validation/holdout/sanity roleを持たせる。

### Decision 13 — atrial progression

ventricular scientific/numerical/performance/identifiability gateとatrial data policy承認後。

### Decision 14 — morphology

FWHM単独でなくwidth、time-to-peak、relaxation、ejection、dP/dt、pressure-flow phase、peak/SV/COを一つのpackで扱う。

### Decision 15 — early kill

cell/tissue＋prescribed shortening＋複数loaded protocolのjoint feasible regionで判断する。

### Decision 16 — performance

暫定 `>=10x realtime`、`60 s <= 6 wall s`、first sample `<=150 ms`、no main-thread simulation。

### Decision 17 — temperature

`fixed-310.15K-v1`。低体温はQ10等を含む別ADR。

### Decision 18 — first release atria

推奨案AはLand LV/RV＋clean atrial elastance bridge。hybrid limitationをUI/provenanceへ表示する。

### Decision 19 — production ventricular mechanics

Phase 3 spikeではthick-sphereを固定利用する。Decision 19 owner selectionは`thick-sphere-v2-explicit-external-septal-coupling`（initial `thick-sphere-v2` backend）をACCEPTED 2026-06-27として別artifactに記録する。Phase 4A dossierはhistorical recommendation-onlyで、`selectedCandidateId: null`のまま保持する。limited-scope immediate priorityはcurrent active stressをLand active stressへreplaceし、morphology gate pass/failとbeat-stability/no-alternansを確認することに限る。RV pressure overload、septal bowing、ventricular interdependence、right-heart failureはprimary/final scopeとしてcoveredではない。future TriSeg pathとして`triseg-lite-compatible`、`full-triseg-compatible`、full TriSeg escalationを、これらのmechanismをclaimする前に保持する。TriSegを自動的な必須条件にしない。

### Decision 20 — regional runtime

state schemaはwall/region/patch-readyとするが、MultiPatch runtime、regional activation、AMI/LBBB/CRTは別ADRまで初期scopeへ含めない。

## Initial checklist

# Appendix A — Initial implementation checklist

```text
[ ] legacy tag created
[ ] ADR merged
[ ] owner decision log created
[ ] stress measure accepted
[ ] strain coordinate accepted
[ ] Land source variant policy accepted
[ ] morphology measurement definition frozen
[ ] current ~92 ms baseline artifact archived
[ ] human morphology target pack versioned
[ ] performance reference hardware benchmarked
[ ] model IDs fixed
[ ] units contract merged
[ ] dynamic state block merged
[ ] Land equations transcribed with equation references
[ ] source parameter sets immutable
[ ] Land parameter provenance checked
[ ] Land protocol fixtures committed
[ ] stabilization/tangent semantics fixed
[ ] algorithmic tangent re-solved FD test passing
[ ] prescribed Ca backend implemented and validated
[ ] HR knot table validated
[ ] Ca/Land hierarchical fit tooling available
[ ] isometric twitch gate passing
[x] prescribed-shortening transfer report passing (`verify:myocardium-prescribed-shortening`)
[x] fixed thick-sphere kinematics report passing (`verify:myocardium-thick-sphere-kinematics`)
[x] identity homogenization/generalized-force report passing (`verify:myocardium-generalized-forces`)
[ ] kinematics/sarcomere bridge derivation reviewed for production mechanics
[x] minimal loaded chamber spike completed (`verify:myocardium-minimal-loaded-chamber`)
[x] Phase 3 owner GO/REVISE/NO-GO recorded (`data/myocardium/gates/phase3-owner-go-v1.json`)
[x] Phase 4A mechanics decision dossier created (`verify:myocardium-mechanics-decision`)
[ ] geometry identifiability rank gate passing
[ ] virtual-power tests passing
[ ] passive energy law passing
[ ] local monolithic BE reference passing
[ ] local monolithic SDIRK2 reference passing
[ ] partitioned solver converges to reference
[ ] production performance gate passing
[ ] temporary atrial elastance bridge isolated
[ ] LV closed-loop matrix passing
[ ] RV closed-loop matrix passing
[ ] loaded LVP/RVP morphology target passing
[ ] morphology transfer report attached
[ ] qDot/valve confounder report attached
[ ] state schema broken intentionally
[ ] old loader rejects explicitly
[ ] official cases re-authored
[ ] final atrial release policy recorded
[ ] legacy active-stress code removed
[ ] model limitations shown in result/UI
```

## PR review template

# Appendix B — PR review template

```markdown
## Scientific scope
- Model/equations version:
- Parameter set:
- Data/fixture provenance:
- Target pack IDs:
- Decision baseline ID:
- Which assumptions changed:
- Which assumptions did not change:

## Central hypothesis
- Current gate: C1 / C2 / D0 / D1 / closed loop
- Does this PR move the loaded morphology hypothesis toward GO, REVISE, or NO-GO?
- Is the same parameter set used across levels?
- Could improvement be explained by pressure/SV/ejection suppression?

## Numerical method
- Solver/coupling:
- dt matrix:
- Reference comparison:
- Stabilization stiffness definition:
- Algorithmic tangent test:
- Failure policy:

## Validation
- Cell protocol result:
- Isometric morphology:
- Prescribed-shortening result:
- Minimal loaded chamber result:
- Production single-chamber result:
- Closed-loop result:
- Morphology transfer summary:
- qDot/valve/clamp contamination:
- Known failures:

## Identifiability
- Free parameters:
- Fixed parameters:
- Priors/anchors:
- Numerical rank:
- Condition/correlation result:
- Multi-start result:
- Profile likelihood result:

## Performance
- Reference hardware:
- Simulated seconds / wall second:
- First sample latency:
- Median / p95:
- Main-thread long tasks:
- Allocation / GC:

## Compatibility
- State schema impact:
- Case impact:
- Snapshot impact:
- Silent fallback present: MUST be no

## Owner decisions
- Decision(s) required:
- Recommended option:
- Alternatives:
- Owner outcome:

## Artifacts
- JSON:
- CSV:
- plots:
- command:
```
