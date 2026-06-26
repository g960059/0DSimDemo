---
title: "Myocardium Land v1 — Normative model and software specification"
status: "Proposed"
revision: 3
source_design_record: "../research/myocardial-contraction-rebuild-design-record.md"
---

# Myocardium Land v1 — Model specification

## Scope

本仕様はActivation Scheduler、PrescribedCalciumTransientV1、Land source model、source-to-wall homogenization、generalized-coordinate kinematics、passive material、generalized-force mapping、local couplingの規範contractを定める。

> **Traceability note:** 以下の節番号はdesign recordとの相互参照を保つため、元文書の番号を維持する。

# 5. 新アーキテクチャ

## 5.1 レイヤ構成

```text
engine/myocardium/
├── contracts.ts
├── units.ts
├── provenance.ts
├── registry.ts
├── activation/
│   ├── ActivationScheduler.ts
│   ├── periodicActivationSchedulerV1.ts
│   └── __tests__/
├── state/
│   ├── ModelInstancePath.ts
│   ├── StateBlockDescriptor.ts
│   ├── StateLayoutBuilder.ts
│   └── stateValidation.ts
├── calcium/
│   ├── PrescribedCalciumTransient.ts
│   ├── prescribedBiExponentialV1.ts
│   ├── parameterSets.ts
│   ├── limitations.ts
│   └── __tests__/
├── myofilament/
│   ├── land2017/
│   │   ├── equations.ts
│   │   ├── continuous.ts
│   │   ├── discreteStep.ts
│   │   ├── outputs.ts
│   │   ├── parameterSets.ts
│   │   ├── residual.ts
│   │   ├── jacobian.ts
│   │   └── __tests__/
│   └── bcs/                 # Phase 9以降。専用activation semantics
├── homogenization/
│   ├── MyocardiumHomogenizationAdapter.ts
│   ├── identityFiberNominalV1.ts
│   └── __tests__/
├── mechanics/
│   ├── GeneralizedCoordinates.ts
│   ├── MyocardialKinematicsModel.ts
│   ├── thickSphereSpikeV1.ts
│   ├── production/          # Phase 4 owner decision後
│   └── __tests__/
├── material/
│   ├── PassiveMaterialModel.ts
│   ├── passiveExponentialV1.ts
│   └── __tests__/
├── generalizedForces/
│   ├── GeneralizedForceMapper.ts
│   ├── virtualPowerNominalEngineeringV1.ts
│   └── __tests__/
├── coupling/
│   ├── MyocardialUnit.ts
│   ├── localMonolithicReference.ts
│   ├── activeStiffnessPartitioned.ts
│   └── __tests__/
└── diagnostics/
    ├── MyocardialDiagnostics.ts
    └── energyAudit.ts

tools/myocardium/
├── verifyActivationScheduler.ts
├── verifyLandProtocols.ts
├── verifyPrescribedCalcium.ts
├── replayPrescribedShortening.ts
├── verifyMinimalLoadedProtocols.ts
├── verifyGeneralizedForces.ts
├── compareCouplingSolvers.ts
├── fitLandBridge.ts
└── identifiabilityReport.ts
```

既存 `engine/chambers.ts` は最終的に、elastance controlを別ファイルへ移したうえで削除または大幅縮小する。

## 5.2 依存方向

依存は一方向にする。

```text
activation
    → prescribed calcium
    → Land source myofilament
    → tissue homogenization
    → material + kinematics
    → generalized-force mapping
    → coupling
    → ModelCore
```

禁止する依存:

- myofilamentからvalve状態またはchamber pressureを読む。
- prescribed Ca backendからwall geometryを読む。
- activation schedulerからCa amplitudeやLand parameterを変更する。
- homogenization adapterからclinical knobを読む。
- generalized-force mapperからclinical knobまたはvalve状態を読む。
- UI/domain case型をequations層へimportする。

## 5.3 Development configurationとproduction configuration

Phase 1–3のearly spikeでは、次を使用する。

```text
ActivationSchedulerV1
+ PrescribedCalciumTransientV1
+ Land source backend
+ identity/narrow-prior homogenization
+ thickSphereSpikeV1
+ one volume generalized coordinate
+ simple afterload family
```

Phase 4以降のproduction configurationは、ownerがmechanics backendを選んでから固定する。early spike geometryを、そのままproduction既定に昇格させない。

## 5.4 将来拡張の契約

初期runtimeで一心室一global unitだけを生成しても、各state blockとdiagnosticは `ModelInstancePath` を持つ。将来は同じcontractで、例えば次を表現できる。

```text
LV / free-wall / global / unit-1
RV / free-wall / global / unit-1
Septum / septal-wall / global / unit-1
LV / free-wall / anterior / patch-1
```

これはMultiPatch実装を意味しない。**二度目のstate-schema破壊を避けるためのnamespace設計**である。

# 6. 単位・命名規約

## 6.1 内部単位

| 量 | 内部単位 |
|---|---|
| time | s |
| Ca concentration | µM |
| source/wall generalized stress | Pa |
| stiffness / tangent | Pa |
| force conjugate to volume | Pa (= J/m³) |
| force conjugate to displacement | N |
| power / power density | W / W·m⁻³ |
| fiber stretch ratio / engineering strain | dimensionless |
| strain rate | s⁻¹ |
| sarcomere length | m（表示はµm可） |
| myocardium-layer volume | m³ |
| circulation public volume | mL |
| myocardium-layer pressure | Pa |
| public hemodynamic pressure | mmHg |
| temperature | K、parameter/provenanceで固定 |

## 6.2 API命名

ownerが推奨default（nominal stress＋engineering strain）を承認した場合、public fieldは次を用いる。

MUST:

```ts
freeCalciumUM
sourceActiveFiberStressPa
wallActiveNominalStressPa
stabilizationStiffnessPa
algorithmicTangentPa
fiberStretchRatio
fiberEngineeringStrain
sarcomereLengthM
wallReferenceVolumeM3
generalizedCoordinateIds
conjugateForcesSI
transmuralPressurePa
```

MUST NOT:

```ts
c
tension
stiffness
lambda
strain
volume
pressure
releaseFlux
removalFlux
```

のように、単位・measure・物理的保存性が不明なpublic fieldを新設する。

`activeTensionPa` は禁止する。`tension`が力か応力か曖昧だからである。

## 6.3 変換境界

- `mL ↔ m³` と `mmHg ↔ Pa` はchamber/circulation境界の1箇所に限定する。
- Land equation内部でmmHgまたはmLを使用しない。
- parameter fixtureには原著単位とruntime単位の両方を記録する。
- `temperatureK` は毎step入力にせず、初期版では `fixed-310.15K-v1` parameter/provenanceとして固定する。
- source stressからwall stressへの変換はhomogenization adapter外へ分散させない。
- generalized coordinateのunitとconjugate forceのunitをdescriptorへ保存する。

# 7. 共通インターフェース

以下のTypeScript例は、推奨defaultである `nominal fiber scalar stress + engineering fiber strain` を仮定する。owner sign-off前は **RECOMMENDED / PENDING OWNER SIGN-OFF** である。

## 7.1 Provenance

```ts
export type ModelProvenance = {
  equationsVersion: string;
  parameterSetId: string;
  parameterSetSha256: string;
  activationModelId: string;
  calciumModelId: string;
  homogenizationModelId: string;
  mechanicsModelId: string;
  generalizedForceModelId: string;
  calibrationDatasetIds: readonly string[];
  validationTargetPackIds: readonly string[];
  calibrationCodeVersion: string;
  solverVersion: string;
  stateSchemaVersion: number;
  temperatureModelId: "fixed-310.15K-v1" | string;
  decisionBaselineId: string;
  sourceReferences: readonly string[];
  modelLimitations: readonly string[];
};
```

simulation result、snapshot、verification artifactへ必ず埋め込む。

## 7.2 Patch-ready可変state block

```ts
export type ModelInstancePath = {
  chamber?: "LV" | "RV" | "LA" | "RA";
  wallId?: string;
  regionId?: string;
  patchId?: string;
  moduleId: string;
  instanceId: string;
};

export type StateBlockDescriptor = {
  blockId: string;
  owner: "activation" | "calcium" | "myofilament" | "mechanics";
  instance: ModelInstancePath;
  labels: readonly string[];
  size: number;
  equationsVersion: string;
};

export type StateBlockSlice = {
  descriptor: StateBlockDescriptor;
  offset: number;
  size: number;
};

export type DynamicStateLayout = {
  blocks: readonly StateBlockSlice[];
  size: number;
  layoutHash: string;
};
```

要件:

- state sizeはbackend instanceから取得する。
- `makeIndex()` にLand固有fieldを直書きしない。
- chamberとmyofilament unitを1対1と仮定しない。
- temporary atrial elastance bridgeはCa/myofilament blockを持たなくてよい。
- state labelsとinstance pathをsnapshot診断へ保存する。
- layout hashはblock ID、equation version、instance path、labels、offsetを含める。
- 新schemaでは `MODEL_STATE_SCHEMA_VERSION` と `MODEL_VERSION` を更新する。
- 旧schemaのunpackは明示的に拒否する。

## 7.3 Activation scheduler

```ts
export type ActivationTargetId = string;

export type ActivationEventInput = {
  targetId: ActivationTargetId;
  activationEventId: number;
  timeSinceActivationSec: number;
  cycleLengthSec: number;
  activationStrength01: number;
};

export type ActivationSchedulerOutput = {
  events: readonly ActivationEventInput[];
  rhythmCycleId: number;
};

export interface ActivationScheduler<Params> {
  readonly id: "periodic-activation-scheduler-v1" | string;
  reset(timeSec: number, params: Params): void;
  advance(previousTimeSec: number, nextTimeSec: number, params: Params): ActivationSchedulerOutput;
}
```

`heartRateBpm` は `cycleLengthSec` から導出する。Ca backendへ絶対時刻、phase、event、HRを重複して渡さない。

## 7.4 Prescribed calcium transient

```ts
export type PrescribedCalciumInput = ActivationEventInput & {
  dtSec: number;
};

export type PrescribedCalciumOutput = {
  freeCalciumUM: number;
  riseState01: number;
  decayState01: number;
  releaseDriveUMPerSec?: number;
  clearanceDriveUMPerSec?: number;
};

export interface PrescribedCalciumTransient<Params> {
  readonly id: "prescribed-calcium-transient-v1" | string;
  readonly state: StateBlockDescriptor;

  initialState(params: Params, out: Float64Array): void;

  residual(
    next: Float64Array,
    previous: Float64Array,
    input: PrescribedCalciumInput,
    params: Params,
    outResidual: Float64Array,
  ): void;

  evaluate(
    state: Float64Array,
    input: PrescribedCalciumInput,
    params: Params,
  ): PrescribedCalciumOutput;
}
```

`releaseDrive` / `clearanceDrive` は保存型SR/cytosol fluxではない。UIやcase recipeでSERCA/RyR fluxとして表示してはならない。

## 7.5 Myofilament continuous input

```ts
export type LandContinuousInput = {
  freeCalciumUM: number;
  fiberEngineeringStrain: number;
  fiberEngineeringStrainRatePerSec: number;
};
```

これはprotocol replay、diagnostic、continuous RHS評価にのみ使用する。

## 7.6 Myofilament discrete step input

```ts
export type IntegrationStageDescriptor =
  | { scheme: "BE"; stageIndex: 0 }
  | { scheme: "SDIRK2"; stageIndex: 0 | 1; gamma: number };

export type LandStepInput = {
  freeCalciumUM: number;
  previousFiberEngineeringStrain: number;
  stageFiberEngineeringStrain: number;
  dtSec: number;
  stage: IntegrationStageDescriptor;
};

export type LandStepKinematics = {
  stageFiberEngineeringStrainRatePerSec: number;
};
```

stage adapterが、採用schemeの離散関係からstrain rateを一意に構成する。callerがstage strainとrateを独立指定してはならない。

## 7.7 Land source output

```ts
export type LandSourceOutput = {
  sourceActiveFiberStressPa: number;
  sourceStressConvention: "land2017-Ta";

  stabilizationStiffnessPa: number;
  algorithmicTangentPa?: number;
  frozenStateTangentPa?: number;

  sourceActivePowerDensityWPerM3: number;

  health: {
    finite: boolean;
    stateConservationResidual: number;
    minimumPopulation: number;
    projectionUsed: boolean;
  };
};

export interface LandMyofilamentModel<Params> {
  readonly id: "land2017-myofilament-v1";
  readonly state: StateBlockDescriptor;

  initialState(
    input: LandContinuousInput,
    params: Params,
    out: Float64Array,
  ): void;

  residual(
    next: Float64Array,
    previous: Float64Array,
    input: LandStepInput,
    params: Params,
    outResidual: Float64Array,
  ): void;

  evaluateContinuous(
    state: Float64Array,
    input: LandContinuousInput,
    params: Params,
  ): LandSourceOutput;

  evaluateStep(
    state: Float64Array,
    input: LandStepInput,
    params: Params,
  ): LandSourceOutput;
}
```

初期版のbackend ID unionにBCSを含めない。

## 7.8 Tissue homogenization adapter

```ts
export type HomogenizationInput = {
  source: LandSourceOutput;
  instance: ModelInstancePath;
  wallReferenceVolumeM3: number;
};

export type HomogenizedActiveOutput = {
  wallActiveNominalStressPa: number;
  wallStabilizationStiffnessPa: number;
  wallAlgorithmicTangentPa?: number;
  homogenizationModelId: string;
  activeTissueFraction: number;
  orientationRuleId: string;
};

export interface MyocardiumHomogenizationAdapter<Params> {
  readonly id: string;
  evaluate(input: HomogenizationInput, params: Params): HomogenizedActiveOutput;
}
```

初期候補は、明示的なsource conventionを保つ `identity-fiber-nominal-v1` とする。active tissue fractionやorientation efficiencyを導入する場合は、独立データ・狭いprior・identifiability gateを要求する。

## 7.9 Generalized coordinatesとkinematics

```ts
export type GeneralizedCoordinateUnit = "m3" | "m";

export type GeneralizedCoordinateState = {
  id: string;
  valueSI: number;
  previousValueSI: number;
  rateSI: number;
  unit: GeneralizedCoordinateUnit;
};

export type MyocardialKinematicsInput = {
  coordinates: readonly GeneralizedCoordinateState[];
  instance: ModelInstancePath;
};

export type MyocardialKinematicsOutput = {
  sarcomereLengthM: number;
  fiberStretchRatio: number;
  fiberEngineeringStrain: number;
  fiberEngineeringStrainRatePerSec: number;
  coordinateIds: readonly string[];
  dStrainDCoordinate: Float64Array;
  wallReferenceVolumeM3: number;
  geometryHealth: {
    finite: boolean;
    inCalibrationDomain: boolean;
  };
};

export interface MyocardialKinematicsModel<Params> {
  readonly id: string;
  evaluate(input: MyocardialKinematicsInput, params: Params): MyocardialKinematicsOutput;
}
```

`dStrainDCoordinate[i] = ∂E_f/∂q_i` である。

## 7.10 Passive material

```ts
export type PassiveMaterialOutput = {
  passiveNominalStressPa: number;
  viscousNominalStressPa: number;
  dPassiveStressDStrainPa: number;
  storedEnergyDensityJPerM3: number;
  dissipationDensityWPerM3: number;
};
```

activeとpassiveは別モデルとして評価し、generalized-force mapperで一般化応力レベルに合成する。

## 7.11 Generalized-force mapper

```ts
export type GeneralizedForceInput = {
  kinematics: MyocardialKinematicsOutput;
  active: HomogenizedActiveOutput;
  passive: PassiveMaterialOutput;
};

export type GeneralizedForceOutput = {
  coordinateIds: readonly string[];
  conjugateForcesSI: Float64Array;
  activeContributionsSI: Float64Array;
  passiveContributionsSI: Float64Array;
  viscousContributionsSI: Float64Array;
  virtualPowerResidualW: number;
  volumeCoordinatePressurePa?: Readonly<Record<string, number>>;
};

export interface GeneralizedForceMapper {
  readonly id: "virtual-power-nominal-engineering-v1" | string;
  evaluate(input: GeneralizedForceInput): GeneralizedForceOutput;
}
```

volume coordinateのconjugate forceはPa、displacement coordinateのconjugate forceはNになる。external/pericardial pressureはmyocardial internal forceとは別レイヤで加算する。

## 7.12 De-risking harness contracts

```ts
export type PrescribedMyocardialTrajectory = {
  timeSec: Float64Array;
  freeCalciumUM: Float64Array;
  fiberEngineeringStrain: Float64Array;
};

export type MinimalLoadedProtocol = {
  id: "afterload-low" | "afterload-normal" | "afterload-high";
  anatomyParameterSetId: string;
  kinematicsModelId: "thick-sphere-spike-v1";
  generalizedForceDecisionId: string;
  afterloadModelId: "two-element-afterload-v1";
  useDynamicValve: false;
  useQDotClamp: false;
  allowFreeGeometryScale: false;
  allowFreeHomogenizationGain: false;
};
```

strain rateはtime/strain pathからharnessが整合的に計算する。このharnessはearly falsification専用であり、runtime fallbackにしてはならない。

# 8. Land 2017 backend実装仕様

## 8.1 Equation model ID、parameter sets、状態

equation model ID:

```text
land2017-myofilament-v1
```

source parameter setは混ぜずに別IDとする。

```text
land2017-skinned-human-37c-source-v1
land2017-intact-human-37c-source-v1
land2017-whole-organ-source-v1
```

初期候補は `land2017-intact-human-37c-source-v1` とする。値を1つでも変更した場合はsource setを上書きせず、派生IDとmachine-readable patchを発行する。

state labels:

```text
CaTRPN
B
W
S
zetaW
zetaS
```

`U = 1 - B - W - S` を導出状態として扱う場合、保存残差を毎評価で監査する。

## 8.2 実装原則

- 方程式は採用版の式番号と1対1でコメントする。
- parameter名は原著名を保ち、app aliasをequations層に入れない。
- skinned、intact、whole-organ parameterを混ぜない。
- LV/RVは初期段階で同じintact-human kineticsを共有する。
- source page/table/equationをparameter metadataへ残す。
- silent population clampを禁止する。
- positivity違反はline search、step rejection、substepで扱う。
- projectionはdebug fallbackに限定し、production acceptanceでは `projectionUsed=false` を要求する。

## 8.3 Source stress conventionとwall stressを分ける

**RECOMMENDED / PENDING OWNER SIGN-OFF**

Land `T_a` はsource model内で、engineering fiber strainに共役なfiber nominal / first-Piola scalar stressとして解釈する。この決定はequations、active-stiffness、tangentの内部整合を固定する。

ただし、Landのcell/tissue tensionを、そのままwall-average stressと同一視しない。

```text
Land T_a
  = sourceActiveFiberStressPa

TissueHomogenizationAdapter(sourceActiveFiberStressPa)
  = wallActiveNominalStressPa
```

homogenization adapterは、active tissue fraction、fiber orientation rule、wall averagingを明示し、provenanceを持つ。`Tref`、wall mass、homogenization gainの間で同じnormal pressureを自由に作れる構造は禁止する。

## 8.4 Discrete strain-rate consistencyとtangent

implicit schemeではrateを独立inputにしない。

BE:

\[
\dot E_f^{n+1}
=
\frac{E_f^{n+1}-E_f^n}{\Delta t}
\]

SDIRK2ではButcher tableauとstage historyからstage rateを導出する。algorithmic tangentの有限差分は、stage strainを摂動し、consistent rateを再計算し、stateを再solveして行う。

次の3量を分ける。

```text
stabilizationStiffnessPa
    partitioned stabilization用のmodel-defined coefficient。

algorithmicTangentPa
    discrete implicit mapの dT[n+1]/dE[n+1]。

frozenStateTangentPa
    state固定の診断用偏微分。
```

stabilization coefficientをalgorithmic tangentへ一致させることは要求しない。

## 8.5 Land単体の必須protocol

`ModelCore`へ接続する前に以下を通す。

1. steady-state force–Ca at multiple sarcomere lengths
2. isometric twitch
3. time to peak、FWHM、width80/90、relaxation
4. rapid positive/negative length step
5. constant-velocity shortening
6. force–velocity curve
7. length-dependent twitch prolongation
8. prescribed-shortening replay
9. state conservation / positivity
10. time-step convergence
11. stabilization coefficient source check
12. algorithmic tangent vs re-solved finite difference
13. deterministic reproducibility

各fixtureはsource、figure/table、digitization、unit conversion、tolerance rationale、fit/validation/holdout roleを持つ。

## 8.6 Homogenization acceptance

- identity adapter testではsource stressとwall stressが一致する。
- non-identity adapterは各係数の独立sourceを持つ。
- wall stress、wall mass、geometryを同一PV loopだけで同時fitしない。
- active tissue fractionとorientation ruleのsensitivityをidentifiability reportへ含める。
- adapterを使わずsource outputをgeneralized-force mapperへ直結することを禁止する。

# 9. PrescribedCalciumTransientV1

## 9.1 目的とclaim boundary

`PrescribedCalciumTransientV1` はfull ECCまたはCa cycling modelではない。canonical activation eventから、Land反証と初期production候補に用いるdimensional free-Ca waveformを生成する。

表現できるもの:

- diastolic/peak free Ca
- rise/decay timing
- activation delay
- rate-dependent waveform profile
- phenomenological Ca-amplitude / clearance-time intervention

表現しないもの:

- SR Ca inventory
- RyR availability / leak
- SERCA flux / PLB state
- post-rest potentiation
- Ca alternans arising from inventory dynamics
- troponin buffering feedback to free Ca

このbackendでSERCA、RyR、SR loadをmechanistic official caseとして表示してはならない。

## 9.2 推奨構造

\[
\dot y_r = \frac{s(t)-y_r}{\tau_r}
\]

\[
\dot y_d = \frac{y_r-y_d}{\tau_d}
\]

\[
[Ca^{2+}]_i
=
Ca_{dia}+A_{Ca}\frac{y_d}{N(\tau_r,\tau_d,w)}
\]

- `s(t)` はActivationEventから生成するC1 pulse。
- `N` は指定parameterでpeak amplitudeが `A_Ca` になるよう事前計算する。
- `tau_r < tau_d` をvalidationする。
- exact exponential updateまたはimplicit updateを使う。
- event IDが同じ間はphaseを外部から再指定しない。

## 9.3 Parameter setとHR dependence

```ts
export type CalciumRateTarget = {
  cycleLengthSec: number;
  diastolicCalciumUM: number;
  peakAmplitudeUM: number;
  riseTimeSec: number;
  decayHalfTimeSec: number;
  releaseWidthSec: number;
};

export type PrescribedCalciumParams = {
  rateTargets: readonly CalciumRateTarget[];
  interpolation: "monotone-cubic" | "piecewise-linear";
  activationDelaySec: number;
  parameterSetId: string;
  temperatureModelId: "fixed-310.15K-v1";
};
```

HRはcycle lengthから導出し、APIへ重複入力しない。knot外の外挿方針を明示する。

## 9.4 Target strategy

1. `ca-land2017-intact-paired-v1`: intact-human Landと組み合わせてintact twitchを再現するpaired target。
2. `ca-human-ventricular-37c-rate-v1`: human ventricular myocyteのdiastolic/peak/time-to-peak/decay/rate target。

cell model outputはinterpolation aidまたはnegative controlとして扱い、experimental targetの代替にしない。

## 9.5 禁止事項

- Ca amplitudeとLand `Tref`を一つの`contractility`で同時変更しない。
- Ca backendにfiber stretchを入力しない。
- 任意単位 `[0,1]` CaをLandへ渡さない。
- LVPだけでCa decayとcrossbridge detachmentを同時fitしない。
- `releaseFlux` / `removalFlux` と呼ぶ物理fluxを保存式なしで公開しない。
- `temperatureK` をruntime knobとして露出しない。

## 9.6 Validation

- waveform peak、time to peak、decay half-time
- event/cycle continuity
- knot interpolation / extrapolation policy
- dt convergence
- no negative Ca
- activation event consistency
- deterministic replay

## 9.7 Future ConservativeCalciumCyclingV1 gate

次のいずれかをofficial caseで機序的に扱う前に、保存型Ca backendを別ADRで実装する。

```text
SERCA depression
RyR leak / availability
SR Ca depletion or loading
post-rest potentiation
Ca alternans
beta/PLB pathway
CaTRPN buffering feedback
```

必要最小状態、保存則、flux balance、Landとの双方向couplingはそのADRで定義する。

# 10. Chamber kinematics、reference configuration、production mechanics decision

## 10.1 分離すべき量

```text
cavity reference / anchor volume
wall reference volume or mass
Land slack/reference sarcomere length
absolute sarcomere length at geometry anchor
passive slack configuration
geometry shape parameters
mechanics backend coordinates
```

## 10.2 Early thick-sphere kinematics

Phase 3のLand-first spikeでは、thick-sphere geometryを固定harnessとして使う。

\[
\rho_g(V)=\frac{r_m(V)}{r_m(V_{anchor})}
\]

\[
L_s(V)=L_{s,anchor}\rho_g(V)
\]

\[
E_f(V)=\frac{L_s(V)}{L_{s,0}}-1
\]

ここでthick-sphereはearly hypothesisを安価に検証するための選択であり、production ventricular mechanicsを自動的に確定しない。

## 10.3 Generalized-coordinate kinematics

一般形では、

\[
E_f=E_f(q_1,\ldots,q_m)
\]

とし、outputは

\[
\frac{\partial E_f}{\partial q_i}
\]

を全coordinateについて返す。

Phase 3:

```text
q = [cavity-volume]
```

将来例:

```text
q = [LV-volume, RV-volume, septal-coordinate, AV-plane-displacement]
```

## 10.4 Parameter freedom policy

- `Ls0`: Land source setから固定。
- `Ls,anchor`: 独立dataから固定または狭いprior。
- `Vanchor`: imaging/anatomyから固定。
- `Vw0`: myocardial mass/volume targetから固定。
- `Tref`: source valueを基本固定。変更時は派生parameter set。
- homogenization parameterは独立sourceを持つ。

これらを同一PV loopへ自由fitしない。

## 10.5 Identifiability gate

MUST:

- scaled sensitivity matrixとnumerical rankを保存する。
- `Vanchor`、`Ls,anchor`、`Vw0`、`Tref`、homogenization列の共線性を報告する。
- rank deficientならparameterを固定・統合・再parameterizeする。
- profile likelihoodが開くparameterをproduction free parameterにしない。
- geometry familyを変えた場合、target、rank、morphologyを再評価する。

## 10.6 Production ventricular mechanics backend

Phase 4前にownerが次を選ぶ。

```text
A. thick-sphere-v2 + explicit external septal coupling
B. TriSeg-lite compatible backend
C. full TriSeg-compatible backend
```

選択基準:

- first official casesで必要なventricular interaction
- geometry/strain validation data
- parameter identifiability
- realtime performance
- generalized-force/virtual-power closure

TriSegはRV pressure overload、septal bowing、ventricular interdependenceを中核機序として扱う場合に優先候補となる。一方、正常morphology、global preload/afterload、global LV/RV failureの初期releaseではthick-sphereを採る余地を残す。

## 10.7 AV-plane、septum、regional extension

- AV-plane、septumはmyofilament stateへ入れない。
- coordinateを追加する場合、対応するconjugate forceとvirtual-power testを同時に追加する。
- patch-ready state schemaを使うが、regional runtimeは別ADRまで実装しない。

# 11. Work-conjugate generalized-force mapping

## 11.1 基本原理

active、passive、viscousを同じwall generalized stress measureで合成する。

\[
S_{total}=T_{active}+S_{passive}+S_{viscous}
\]

passiveのみがstored energyから得られる。

\[
S_{passive}=\frac{\partial\Psi_{passive}}{\partial E_f}
\]

一般化coordinateを `q_i` とすると、virtual powerは

\[
V_{w0}S_{total}\dot E_f
=
\sum_i Q_i\dot q_i
\]

であり、

\[
Q_i
=
V_{w0}S_{total}\frac{\partial E_f}{\partial q_i}
\]

となる。

volume coordinateの `Q_i` はPaであり、sign conventionによりtransmural pressureへ解釈する。septal/AV-plane displacement coordinateの `Q_i` はNである。

## 11.2 Powerとenergy

\[
\dot W_{passive}=V_{w0}S_{passive}\dot E_f
\]

\[
\mathcal P_{active}=V_{w0}T_{active}\dot E_f
\]

\[
\mathcal D_{viscous}=V_{w0}S_{viscous}\dot E_f\ge 0
\]

active potentialの存在を仮定しない。

## 11.3 Phase 0/4で固定する事項

- source stress convention
- wall stress convention
- strain measure
- reference configuration
- wall reference volume
- homogenization rule
- generalized coordinate IDs、units、signs
- active/passive/viscous composition
- pressure/external pressure sign convention

## 11.4 Virtual-power tests

単一coordinate:

\[
Q\,\delta q
\approx
V_{w0}S\,\delta E_f
\]

複数coordinate:

\[
\sum_i Q_i\dot q_i
\approx
V_{w0}S_{total}\dot E_f
\]

MUST:

- coordinateごとのactive/passive/viscous contributionを検証する。
- random direction vectorでmulti-coordinate directional derivativeを検証する。
- near-zero powerはabsolute toleranceを使う。
- unitsをcoordinate別に検証する。
- coordinate追加PRはvirtual-power test追加なしにmergeしない。

## 11.5 削除する自由倍率

```text
geomChi
lvGeomScale
rvGeomScale
```

を新モデルへ設けない。homogenization parameterを導入する場合は物理的名称、単位/範囲、独立source、identifiability evidenceを持たせる。

# 12. Passive material

## 12.1 activeと分離

Land backendは初期版でactive myofilament responseを担当する。chamber passive responseは別backendとする。

```text
active nominal stress   ← Land
passive nominal stress  ← PassiveMaterialModel
viscous nominal stress  ← PassiveMaterialModel または独立dashpot
pressure mapping        ← GeneralizedForceMapper
```

Land原著の細胞passive/viscoelastic部分を使用する場合、chamber passive lawと二重加算しない。採用は別ADRとする。

## 12.2 推奨初期passive law

**RECOMMENDED / PENDING OWNER SIGN-OFF**

旧stress parameterを再利用せず、engineering strainに対するconvex exponential energy familyを新規実装する。

概念例:

\[
x=h_\epsilon(E_f-E_{slack})
\]

\[
\Psi_{passive}(x)
=
\frac{A}{B^2}
\left(e^{Bx}-1-Bx\right)
\]

\[
S_{passive}
=
\frac{\partial \Psi_{passive}}{\partial E_f}
\]

ここで `h_epsilon` はC1/C2 smooth positive hingeである。

要件:

- `A` はPa、`B` はdimensionlessとする。
- slack strainとsmooth widthを明示する。
- zero strain/zero extension近傍でenergy、stress、tangentを検証する。
- compression側の挙動を定義する。
- stress/tangentをenergy derivativeから生成する。
- `sigmaPas0/bPas/lambdaPas0` の旧値を移植しない。
- pressure floorでpassive lawの問題を隠さない。

## 12.3 Viscosity

初期候補は、同じengineering strainに共役なdashpotとする。

\[
S_{viscous}=\eta_f\dot E_f
\]

\[
S_{viscous}\dot E_f\ge 0
\]

ただし、viscosityはLVP幅を合わせるための自由な波形filterにしてはならない。独立protocolまたは狭いpriorで拘束する。

# 13. 数値積分・結合

## 13.1 方針

Reference:

```text
Land states + local generalized coordinates + generalized forces
```

を同一非線形solveで解く局所monolithic solver。

Production:

Landを局所implicitに解き、active-stiffness stabilizationを使って既存循環outer stepへ接続するpartitioned/IMEX solver。

## 13.2 DiscreteKinematicsAdapter

callerはimplicit residualへstrainとstrain rateを別々に渡さない。

```ts
export interface DiscreteKinematicsAdapter {
  stageStrainRate(
    previousStrain: number,
    stageStrain: number,
    dtSec: number,
    scheme: "BE" | "SDIRK2",
    stageIndex: number,
  ): number;
}
```

同じadapterをresidual、algorithmic tangent、FD test、diagnosticsに使う。

## 13.3 局所monolithic reference

未知量の例:

```text
next Land states
next generalized coordinate vector
next conjugate-force vector
```

要件:

- BE bring-upとSDIRK2 release reference。
- residual norm、iteration、line searchを記録。
- FD Jacobianとの照合。
- full circulation、valve diode、TBV projectionまでmonolithic化しない。
- multi-coordinate backend選択時は全coordinateを同一virtual-power systemへ含める。

## 13.4 Production coupling

1. circulation/mechanics predictorから `q*` を得る。
2. kinematicsからstage strainと`dE/dq`を得る。
3. DiscreteKinematicsAdapterがconsistent stage strain rateを作る。
4. activation→prescribed Ca→Land stateをimplicit更新する。
5. Land source outputをhomogenizationする。
6. passive/viscous stressと合成し、generalized forcesを得る。
7. active-stiffness stabilizationを含めcoordinate/flowをcorrectする。
8. local convergence、event、failureを判定する。

## 13.5 Active-stiffness stabilization

schematic form:

\[
T_a^{n+1}+K_a^{n+1}(E_f^{n+1}-E_f^n)
\]

実装式は採用論文定義と選択したmeasure pairへ合わせて導出する。`K_a` はalgorithmic tangentではない。

## 13.6 BEからSDIRK2

- equation bring-up: BE
- initial reference: BE
- release reference: SDIRK2または同等2次法
- production: accuracy/performance benchmarkで決定

比較matrixは `dt = 1.0, 0.5, 0.25 ms` を最低限含める。production BEを許す誤差閾値はversioned policyに保存する。

## 13.7 Time steppingとfailure

- prescribed Ca linear stateはexact exponentialまたはimplicit update。
- outer circulationは初期段階で既存Heunを維持してよい。
- non-finite stateを0へ置換しない。
- Newton failure時にlegacy active-stressへfallbackしない。
- step rejection/substepとfailure reasonをhealthへ出す。

## 13.8 Realtime performance budget

**RECOMMENDED / PENDING OWNER SIGN-OFF**

```text
normal four-chamber workload:
- >= 10 simulated seconds / wall second
- 60 simulated seconds <= 6 wall seconds
- parameter change -> first updated sample <= 150 ms
- no main-thread simulation
- no main-thread long task > 50 ms attributable to simulation
```

reference solverはperformance gate対象外。production geometry backendごとにmedian/p95、allocation、Newton/substep distributionを報告する。

# 14. 診断・observability

```ts
export type MyocardialDiagnostics = {
  path: ModelInstancePath;

  activation?: {
    activationEventId: number;
    timeSinceActivationSec: number;
    cycleLengthSec: number;
  };

  freeCalciumUM?: number;
  sarcomereLengthM?: number;
  fiberStretchRatio?: number;
  fiberEngineeringStrain?: number;
  fiberEngineeringStrainRatePerSec?: number;

  land?: {
    CaTRPN: number;
    B: number;
    U: number;
    W: number;
    S: number;
    zetaW: number;
    zetaS: number;
  };

  sourceActiveFiberStressPa?: number;
  wallActiveNominalStressPa?: number;
  passiveNominalStressPa: number;
  viscousNominalStressPa: number;
  stabilizationStiffnessPa?: number;
  algorithmicTangentPa?: number;
  frozenStateTangentPa?: number;

  generalizedForces?: {
    coordinateIds: readonly string[];
    conjugateForcesSI: readonly number[];
    activeContributionsSI: readonly number[];
    passiveContributionsSI: readonly number[];
    viscousContributionsSI: readonly number[];
  };

  activePowerDensityWPerM3?: number;
  passiveStoredEnergyJ: number;
  viscousDissipationW: number;
  virtualPowerResidualW: number;

  morphology?: {
    isometricTensionFwhmMs?: number;
    prescribedShorteningTensionFwhmMs?: number;
    loadedPressureFwhmMs?: number;
    loadedPressureTimeToPeakMs?: number;
    relaxationTauMs?: number;
    ejectionDurationMs?: number;
  };

  solver: {
    kind: string;
    iterations: number;
    residualNorm: number;
    substeps: number;
    stepRejected: boolean;
  };

  health: {
    finite: boolean;
    stateConservationResidual: number;
    minimumPopulation?: number;
    projectionUsed: boolean;
    kinematicsInDomain: boolean;
    targetPackIds: readonly string[];
  };
};
```

旧active-stress診断名とのcompatibility aliasは作らない。

stage-to-stage morphology report:

```text
isometric tension
→ prescribed-shortening tension
→ low/normal/high-afterload minimal chamber
→ production single chamber
→ full closed-loop LVP
```

source stress→wall stress→generalized forceの各段で、振幅とshapeがどのように変化したかも追跡する。

# 15. Parameter schema

## 15.1 Myocardium instance spec

```ts
export type MyocardiumInstanceSpec = {
  path: ModelInstancePath;

  activation: {
    modelId: "activation-scheduler-v1";
    parameterSetId: string;
  };

  calcium?: {
    modelId: "prescribed-calcium-transient-v1";
    parameterSetId: string;
  };

  myofilament?: {
    modelId: "land2017-myofilament-v1";
    parameterSetId: string;
  };

  homogenization?: {
    modelId: string;
    parameterSetId: string;
  };

  kinematics: {
    modelId: string;
    parameterSetId: string;
  };

  passiveMaterial: {
    modelId: "passive-exponential-energy-v1";
    parameterSetId: string;
  };

  generalizedForceMapper: {
    modelId: "virtual-power-generalized-force-v1";
  };

  coupling: {
    modelId: "active-stiffness-partitioned-v1" | "atrial-elastance-bridge-v1";
    referenceModelId?: "local-monolithic-be-v1" | "local-monolithic-sdirk2-v1";
  };

  temperatureModelId: "fixed-310.15K-v1";
};
```

## 15.2 Parameter set IDs

```text
activation-sinus-av-v1
prescribed-calcium-lv-human-rest-rate-v1
prescribed-calcium-rv-human-rest-rate-v1
land2017-intact-human-37c-source-v1
land2017-intact-human-37c-0dsim-v1
homogenization-global-fiber-v1
kinematics-lv-thick-sphere-v2
kinematics-rv-thick-sphere-v2
passive-lv-exponential-energy-v1
passive-rv-exponential-energy-v1
atrial-elastance-bridge-la-v1
atrial-elastance-bridge-ra-v1
```

## 15.3 Clinical intervention and claim policy

Prescribed-Ca版で許されるintervention ID:

```ts
export type MyocardialIntervention =
  | { id: "prescribed-calcium-amplitude-v1"; target: ModelInstancePath; multiplier: number }
  | { id: "prescribed-calcium-decay-time-v1"; target: ModelInstancePath; multiplier: number }
  | { id: "myofilament-ca-sensitivity-v1"; target: ModelInstancePath; shift: number }
  | { id: "crossbridge-cycling-v1"; target: ModelInstancePath; multiplier: number }
  | { id: "viable-contractile-fraction-v1"; target: ModelInstancePath; fraction01: number }
  | { id: "passive-stiffness-v1"; target: ModelInstancePath; multiplier: number };
```

`serca-depression`、`ryr-leak`、`sr-load`等は、保存型Ca backendなしに定義しない。UIのinotropy/lusitropyはversioned recipeへ解決し、mechanistic claim levelを表示する。

## 15.4 Target packs

```text
land2017-cell-protocols-v1
prescribed-ca-human-ventricular-37c-rate-v1
myocardial-morphology-human-v1
normal-adult-rest-bsa1p8-v1
myocardial-performance-reference-hardware-v1
```

各targetは `fit | validation | holdout | sanity` の役割を持つ。

## Model limitations

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

## Source requirements

# 28. References and source registry

`data/myocardium/sources.json` をbibliographyと実装来歴のsource of truthとする。各entryは、完全title、全authors、venue/repository、year、volume/issue/pages、DOIまたはpersistent ID、使用版、verification status、実装上のroleを持つ。

**規範:** `verificationStatus != "verified"` のsourceを、方程式転記、parameter fixture、target pack、またはacceptance thresholdの根拠へ使用してはならない。略記、PMIDだけ、二次引用だけのsourceは、完全書誌と使用箇所を確定するまで実装sourceから除外する。

## 28.1 Phase A normative sources

1. Land S, Park-Holohan SJ, Smith NP, dos Remedios CG, Kentish JC, Niederer SA. **A model of cardiac contraction based on novel measurements of tension development in human cardiomyocytes.** *Journal of Molecular and Cellular Cardiology*. 2017;106:68–83. DOI: `10.1016/j.yjmcc.2017.03.008`.
   **Role:** Land equations、source parameter variants、cell/tissue protocol definitions.

2. Regazzoni F, Quarteroni A. **An oscillation-free fully partitioned scheme for the numerical modeling of cardiac active mechanics.** arXiv:`2007.15714`, 2020.
   **Role:** stabilization coefficient、partitioned coupling、monolithic/reference comparison.

3. Regazzoni F, Salvador M, Africa PC, Fedele M, Dedè L, Quarteroni A. **A cardiac electromechanical model coupled with a lumped-parameter model for closed-loop blood circulation.** *Journal of Computational Physics*. 2022;457:111083. DOI: `10.1016/j.jcp.2022.111083`.
   **Role:** closed-loop energy accounting、model-layer separation、reference configuration and coupling context.

## 28.2 Verified comparison and future-backend sources

4. Marchesseau S, Delingette H, Sermesant M, Sorine M, Rhode K, Duckett SG, Rinaldi CA, Razavi R, Ayache N. **Preliminary Specificity Study of the Bestel-Clément-Sorine Electromechanical Model of the Heart using Parameter Calibration from Medical Images.** *Journal of the Mechanical Behavior of Biomedical Materials*. 2013;20:259–271. DOI: `10.1016/j.jmbbm.2012.11.021`.
   **Role:** future BCS comparison、organ-level calibration and identifiability context. It is not a Phase A Land equation source.

5. Caruel M, Chabiniok R, Moireau P, Lecarpentier Y, Chapelle D. **Dimensional reductions of a cardiac model for effective validation and calibration.** *Biomechanics and Modeling in Mechanobiology*. 2014;13(4):897–914. DOI: `10.1007/s10237-013-0544-6`.
   **Role:** model reduction、validation/calibration methodology、cross-scale interpretation.

6. Regazzoni F, Dedè L, Quarteroni A. **Biophysically detailed mathematical models of multiscale cardiac active mechanics.** arXiv:`2004.07910`, 2020.
   **Role:** RDQ20-MF research comparison and future high-fidelity backend evaluation. It is not a Phase A runtime dependency.

7. Chapelle D, Le Tallec P, Moireau P, Sorine M. **An energy-preserving muscle tissue model: formulation and compatible discretizations.** *International Journal for Multiscale Computational Engineering*. 2012;10(2):189–211.
   **Role:** BCS energy structure. Before a BCS implementation PR, the exact publisher record and persistent identifier MUST be verified and locked in `sources.json`.

## 28.3 Ventricular-mechanics candidate source

8. CircAdapt Framework documentation. **TriSeg — ventricles including interaction.** Documentation version 2407.
   **Role:** Phase 4 candidate definition and comparison criteria only. Citing this source does not adopt TriSeg automatically.

## 28.4 Explicitly excluded unresolved shorthand

Earlier discussion used the shorthand **“Caruel–Moireau–Chapelle 2019 / PMID 30607642”**. Its exact bibliographic identity and its relation to the intended equations were not established reliably during preparation of this revision. Therefore:

- it is **not** a normative reference;
- it MUST NOT appear as an equation or parameter source in `sources.json`;
- it MUST NOT be used to justify implementation choices;
- it MAY be restored only after full title、authors、venue、DOI/persistent ID、version、and exact implementation role are independently verified.

This exclusion is preferable to attaching a convincing but potentially incorrect citation to the implementation.

## 28.5 Repository baseline

9. `engine/chambers.ts`, `engine/core/stateLayout.ts`, `engine/protocol.ts`, `engine/knobs.ts`, `engine/stateContract.ts` at baseline commit `228bef96e5f522de2cfe352de5d6d4d2f017c550`.
10. historical low-preload research notes recoverable from the baseline commit at the same baseline.
11. `tools/verifyStarlingLowPreloadMatrix.ts` at the same baseline.
