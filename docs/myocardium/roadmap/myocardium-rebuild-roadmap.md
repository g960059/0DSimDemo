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

## Phase 3 — early thick-sphere loaded spike

### PR 3A — fixed early kinematics

### PR 3B — identity/fixed homogenization + single-coordinate generalized force

### PR 3C — low/normal/high afterload family

### Phase 3 owner gate

`GO / REVISE / NO-GO`。GOなしでPhase 4へ進まない。

## Phase 4 — production mechanics selection and integration

### PR 4A — owner decision 19 artifact

比較:

```text
thick-sphere-v2
TriSeg-lite candidate
full TriSeg-compatible candidate when justified
```

比較項目はscientific scope、validation data、rank、virtual power、performance。

### PR 4B — tissue homogenization

- source→wall adapter
- independent parameter sources
- identifiability

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
    "verify:land-protocols": "vite-node tools/myocardium/verifyLandProtocols.ts",
    "verify:prescribed-calcium": "vite-node tools/myocardium/verifyPrescribedCalcium.ts",
    "verify:prescribed-shortening": "vite-node tools/myocardium/verifyPrescribedShortening.ts",
    "verify:minimal-loaded-chamber": "vite-node tools/myocardium/verifyMinimalLoadedChamber.ts",
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
| 14 | loaded morphology target | composite pack、same measurement code | Phase 0 | PENDING OWNER |
| 15 | early kill gate | joint feasibility後GO/REVISE/NO-GO | Phase 0/3 | PENDING OWNER |
| 16 | realtime budget | 10× realtime等の暫定値 | Phase 0/5 | PENDING OWNER |
| 17 | temperature | fixed 310.15 K | Phase 0 | PENDING OWNER |
| 18 | first release atria | Land ventricles＋documented atrial bridge案 | release | PENDING OWNER |
| 19 | production ventricular mechanics | thick-sphere / TriSeg-lite / TriSeg-compatible | before Phase 4 | PENDING OWNER |
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

Phase 3 spikeではthick-sphereを固定利用する。Phase 4前にofficial case scope、data、rank、virtual-power、performanceからA/B/Cを選ぶ。TriSegを自動的な必須条件にしない。

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
[ ] prescribed-shortening transfer report passing
[ ] kinematics/sarcomere bridge derivation reviewed
[ ] minimal loaded chamber spike completed
[ ] Phase 3 owner GO/REVISE/NO-GO recorded
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
