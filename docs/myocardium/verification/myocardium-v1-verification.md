---
title: "Myocardium v1 — Verification, falsification, and acceptance plan"
status: "Proposed"
revision: 3
source_design_record: "../research/myocardial-contraction-rebuild-design-record.md"
---

# Myocardium v1 — Verification plan

## Objective

Land-first仮説を、単一FWHMではなくcell/tissue、prescribed shortening、複数afterload、production mechanics、closed loopのjoint evidenceで反証可能に評価する。

> **Traceability note:** 以下の節番号はdesign recordとの相互参照を保つため、元文書の番号を維持する。

# 16. 校正戦略

## 16.1 Level 0 — target definition and freeze

parameter fit前に、Ca、Land protocol、geometry、passive、loaded morphology、hemodynamics、performanceをversioned target packへ固定する。現行約92 ms FWHMはbaseline symptomでありtargetではない。

## 16.2 Calibration hierarchy

```text
Level 0: target / claim freeze
Level 1: activation timing + prescribed Ca waveform
Level 2: Land source cell/tissue protocols
Level 2.5: prescribed-shortening transfer
Level 3: low/normal/high-afterload minimal chamber joint-feasibility test
Level 4: homogenization + selected production mechanics + passive/generalized force
Level 5: closed loop
Level 6: pathology/intervention recipes
```

各level後に下位targetを再実行する。

## 16.3 Level 1 — activation and prescribed Ca

fit対象:

- activation delay / event timing
- diastolic Ca、peak、rise、decay
- cycle-length dependence knots

固定:

- Land parameters
- geometry
- circulation

## 16.4 Level 2 — Land source model

Caとstrain trajectoryを外部入力として固定し、force–Ca、twitch、length-step、force–velocity等へ合わせる。原著source setを変更する場合は派生IDを発行する。

## 16.5 Level 2.5 — prescribed-shortening transfer

同じCa＋Land setへ複数のstrain trajectoryを与え、shortening deactivation、shape、power、state conservationを評価する。generalized-force mapperは使わない。

## 16.6 Level 3 — minimal loaded joint feasibility

固定:

- Land kinetics
- prescribed Ca major timing
- source stress convention
- fixed early thick-sphere anatomy
- documented identityまたは事前固定homogenization
- simple afterload family

protocol:

```text
low afterload
normal afterload
high afterload
isotonic / afterload-clamp controls
```

禁止:

- free geometry/pressure gain
- dynamic valve / qDot clamp / TBV projection
- arbitrary tension filter
- morphologyだけに合わせるviscosity

単一FWHMではなく、cell/tissue targets、複数loaded shape、peak pressure、SV、work、strain domainのjoint scoreでfeasible regionを判定する。

## 16.7 Level 4 — production mechanics

Phase 4 owner decisionで選んだmechanics backendに対し、homogenization、wall mass、sarcomere anchor、passive material、generalized-force mapを独立dataで拘束する。source Land parameterは原則固定する。

## 16.8 Level 5 — closed loop

最後にvascular/valve/filling parametersを調整する。valve lossをTrefで、venous return不足をCa amplitudeで、qDot eventをmyofilament parameterで隠さない。

## 16.9 Cross-level back-check

```text
cell protocol
→ isometric twitch
→ prescribed shortening
→ minimal loaded afterload family
→ production single chamber
→ closed loop
```

同一parameter/provenanceでshape、amplitude、strain、source→wall stress変換を比較する。

## 16.10 Identifiability

最低限:

- scaled sensitivity / correlation
- singular values / numerical rank
- column cosine / condition number
- multi-start
- profile likelihood
- residual decomposition by target group

監査対象:

\[
T_{ref}\times f_{hom}\times V_{w0}\times\frac{\partial E_f}{\partial q}
\]

rank deficiencyはparameter追加で隠さず、固定、reparameterization、またはmechanics family見直しで解決する。

# 17. Verification hierarchy

## 17.1 Tier A — contracts/equations

- ActivationEvent consistency
- state layout/path/hash
- Land residual/Jacobian
- discrete strain-rate consistency
- algorithmic tangent with re-solve
- source→wall homogenization
- generalized-force units and virtual power
- deterministic initialization/replay

## 17.2 Tier B — Land source protocols

force–Ca、length dependence、isometric twitch、length step、force–velocity、conservation、dt convergenceをversioned fixturesで検証する。

## 17.3 Tier C1 — prescribed Ca + Land isometric

- time to peak、FWHM、width80/90
- relaxation tau/R²
- dT/dt
- peak/mean ratio

LVP targetをcell tensionへ流用しない。

## 17.4 Tier C2 — prescribed-shortening replay

low/physiologic/high shortening、lengthening、constant-velocity controlsを同一setで実行する。rateはtrajectory/timeからconsistentに導出する。

## 17.5 Tier D0 — minimal loaded afterload family

構成:

- early thick-sphere
- fixed homogenization
- two-element afterload at low/normal/high levels
- no dynamic valve、qDot clamp、TBV projection、septal/pericardial coupling

readouts:

- loaded pressure morphology
- peak pressure、SV、work
- shortening history
- source and wall stress
- generalized-force/virtual-power residual

## 17.6 Tier D1 — production single-chamber mechanics

owner-selected mechanics backendでisovolumic、preload、afterload clamp、isotonic、work-loop、passive filling、length perturbationを行う。

## 17.7 Tier E — solver comparison

local monolithicとproduction partitionedをHR、preload、afterload、Ca、dt matrixで比較する。coordinate vector、Land state、generalized force、phase errorを含める。

## 17.8 Tier F — closed loop

- Normal、HR100/re-arm
- preload/TBV、afterload、PVR
- hemorrhage/fluid
- global HFrEF-like、HFpEF-like
- valve/pericardial sanity

Phase 6はLV/RV Land＋clean atrial elastance bridgeとする。

## 17.9 Tier G — low-preload bifurcation

- dt refinement
- local reference agreement
- event/clamp crossing classification
- signed return map
- worst-delta clean coverage
- root-fix claim時のfull-state confirmation

## 17.10 Tier H — claim boundary

Prescribed-Ca versionのofficial casesに、SR load、RyR、SERCA等のmechanistic labelがないことをschema/testで検証する。

## 17.11 Tier I — performance

reference hardware上でmedian/p95、first-sample latency、allocation、Newton/substep、main-thread tasksを測る。

# 18. Acceptance gates

## 18.1 Common gate

implementation、tests、artifact、source/provenance、target IDs、failure cases、CI command、必要なowner decisionを揃える。

## 18.2 Target/claim freeze gate

- cell/intact target
- prescribed trajectories
- loaded morphology measurement
- low/normal/high afterload family
- baseline artifact
- performance hardware
- prescribed-Ca claim boundary

をcandidate結果前に固定する。

## 18.3 Land source gate

- finite/conservation/positivity
- no production projection
- force–Ca、length-step、force–velocity、twitch pass
- dt convergence
- algorithmic tangent re-solved FD pass

## 18.4 Early Land-first gate

### GO

- 同一admissible setでcell/tissue、prescribed shortening、複数afterload loaded protocolにfeasible regionがある。
- morphology改善がSV/pressure/ejection suppressionやfree gainによらない。
- source protocol、Ca domain、strain domainを壊さない。

### REVISE

- 単一protocolは外れるが、discrepancy sourceをactivation/Ca/Land/afterload/kinematicsに分離できる。
- 追加spikeと終了条件をownerが承認する。

### NO-GO

- 事前登録domain内でjoint feasible regionが存在しない。
- 改善にsource protocol破壊、非現実的Ca、hidden gain、output suppressionが必要。

## 18.5 Homogenization/mechanics/identifiability gate

- source stressとwall stressのboundaryが明示。
- generalized-coordinate virtual power pass。
- owner-selected mechanics backendがdocumented。
- free parameter Jacobianがpolicy上full rank。
- multi-start/profile likelihoodで実用的に識別可能。

## 18.6 Production single-chamber gate

- passive energy / multi-coordinate virtual-power pass
- coordinate contributionsの和がtotalと一致
- reference vs production solver within tolerance
- D0のshape improvementを保持
- anatomy/strain domain内

## 18.7 Closed-loop gate

- Normal/HR/preload/afterload periodic steady
- TBV/LV-RV balance
- loaded morphology target
- stage-to-stage transfer report
- qDot/valve contamination classification
- prescribed-Ca claim boundary遵守

## 18.8 Performance gate

承認済みbudgetを満たし、toleranceやphysiology gateを黙って緩めない。

## 18.9 Release gate

- legacy active-stress runtime削除
- old snapshot/case explicit rejection
- official cases再authoring
- provenance/limitations表示
- owner decisions accepted
- companion normative docsとdesign recordが同期
- final atrial configuration明示

# 22. Data and fixture governance

## 22.1 Directory layout

```text
data/myocardium/
├── sources.json
├── activation/
├── land2017/
│   ├── raw/
│   ├── digitized/
│   ├── processed/
│   └── README.md
├── prescribed-calcium/
├── homogenization/
├── morphology/
├── geometry/
├── mechanics-comparison/
├── performance/
└── policies/
```

## 22.2 Source registry

各sourceは次を必須とする。

```text
id
fullTitle
authors
journalOrRepository
year
volumeIssuePages
doiOrPersistentId
versionUsed
licenseOrRedistributionNote
usedForEquations
usedForParameters
usedForTargets
verifiedBy
verifiedAt
```

不完全な略記、PMIDだけ、曖昧な「2019 work」をnormative sourceにしてはならない。完全書誌を確定できないsourceは `bibliographyStatus: unresolved` とし、equation/parameter実装へ使用しない。

## 22.3 Parameter / target files

parameterにはsource variant、units、parent、patch、sha256を持たせる。targetにはpopulation、measurement definition、fit/validation/holdout/sanity roleを持たせる。

## 22.4 Morphology measurement

beat selection、baseline subtraction、normalization、threshold interpolation、multi-peak、smoothing、sampling、relaxation fitを固定し、current baselineとhuman targetに同じcodeを使う。

## 22.5 Target freeze and licensing

candidate結果を見てtargetをin-place変更しない。論文図digitizationは手順、担当、再配布可否を記録する。

# 23. Risk register

| Risk | 兆候 | Mitigation / gate |
|---|---|---|
| Landがloaded morphologyを解決しない | cell passだが複数loaded protocolでjoint feasible regionなし | C2/D0 owner gate、NO-GO |
| scope creep to full-heart platform | Phase 1前にTriSeg/ionic/MultiPatch実装開始 | Non-goals、separate ADR |
| Activation/Ca input inconsistency | HR、phase、eventが不一致 | canonical ActivationEvent、duplicate input禁止 |
| prescribed Caをcycling modelと誤称 | SERCA/RyR等のofficial claim | naming/claim-boundary schema test |
| Land transcription error | protocol一部不一致 | equation mapping、independent review、FD Jacobian |
| source stressとwall stress混同 | Tref/geometryで圧を自由調整 | explicit homogenization adapter、source registry |
| homogenizationがhidden gain化 | active fraction/orientationがPV fitだけで決まる | independent data、rank/profile gate |
| strain/rate離散不整合 | tangent testがcaller依存 | DiscreteKinematicsAdapter、single source of rate |
| scalar mapperでseptal/AV powerが欠落 | pressureは合うがenergy residual | generalized coordinates/forces |
| geometry–stress積縮退 | stress/strainが非現実的 | rank、wall/strain data、mechanics comparison |
| TriSegを早期必須化して仮説が混ざる | Land効果とgeometry効果が分離不能 | Phase 3 fixed thick-sphere、Phase 4 decision |
| thick-sphereを無検証でproduction固定 | RV/septal casesが説明不能 | production mechanics owner decision |
| patch-ready schemaがruntime scope creepを誘発 | 空のMultiPatch abstractionが増える | schema only、runtimeはseparate ADR |
| Ca–kinetics同時fit非同定 | 多解・強相関 | hierarchy、holdout、profile |
| partitioned instability | dt依存振動 | local reference、active stiffness |
| qDot clampが改善を偽装 | FWHM改善とclamp増加 | qDot/event controls |
| waveform flatteningが改善を偽装 | peak/SV/ejection低下 | composite output gate |
| atrial data scarcity | LV scaleコピー | research phase、hybrid limitation |
| reference bibliography不完全 | equation sourceが追跡不能 | source registry merge gate |
| performance regression | 正しいが教材で遅い | Phase 5 benchmark、Worker |
| temperature scope creep | Q10なしで低体温 | fixed 310.15 K、separate ADR |

# 24. Model limitations表示

初期版では次をUI/provenanceへ表示可能にする。

- representative/global myocardial unitsであり、regional runtimeではない。
- spatial electrical propagationを解かない。
- Activation Schedulerはelectrophysiology modelではない。
- `PrescribedCalciumTransientV1` は保存型Ca cyclingではない。
- SERCA、RyR、SR load、Ca alternansを機序的に表現しない。
- source Land stressからwall stressへのhomogenization仮定を持つ。
- production ventricular mechanics backendとその適用範囲を表示する。
- thick-sphere版ではseptal bowing/ventricular interactionの限界がある。
- temperatureは310.15 K固定。
- population-level parameter setでありpatient-specificではない。
- Phase 6のLA/RAはtemporary elastance bridge。
- clinical decision supportではなく教育・研究モデルである。

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
