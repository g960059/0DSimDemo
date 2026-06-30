import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { DEFAULT_PARAMS } from "@/constants";
import phase5QArtifact from "@/data/myocardium/protocols/modelcore-land-calcium-unit-interface-audit-result-v1.json";
import { defaultParams } from "@/engine/core/params";
import type { ModelCoreExperimentalOptions } from "@/engine/ModelCore";
import {
  calciumScaledLand2017LvSourceOnlyProvider,
  calciumScaledLand2017RvSourceOnlyProvider,
  createModelCoreLand2017LvSourceProviderInstrumentation,
  MODELCORE_EXPERIMENTAL_LAND2017_LV_SOURCE_ONLY_PROVIDER_ID,
  MODELCORE_EXPERIMENTAL_LAND2017_RV_SOURCE_ONLY_PROVIDER_ID,
  type ModelCoreLand2017LvCommitScheme,
  type ModelCoreLand2017LvKinematicsMode,
  type ModelCoreLand2017LvSignalAudit,
  type ModelCoreLand2017LvSourceProviderInstrumentation,
} from "@/engine/myocardium/modelCoreLand2017LvSourceProvider";
import {
  LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET,
  type Land2017SourceParameterSet,
} from "@/engine/myocardium/myofilament/land2017/parameterSets";
import {
  MODELCORE_RUNTIME_ALL_CHAMBER_LANDATRIAL_DEFAULT_MODE,
  MODELCORE_RUNTIME_LEGACY_ACTIVE_STRESS_ROLLBACK_MODE,
  resolveModelCoreRuntimeActiveSource,
} from "@/engine/myocardium/runtimeActiveSource";
import {
  MODELCORE_RUNTIME_ROOT_ZC_SOURCED_BOUNDARY_ROOT_DEFAULT_MODE,
  resolveModelCoreRuntimeRootZc,
} from "@/engine/myocardium/runtimeRootZc";
import type { SimMetrics, SimSample, SimulationHealth } from "@/engine/protocol";
import type { SettleStatus } from "@/engine/settling";
import { measureSteady, settleToSteadyState, type SteadyMeasurement } from "@/engine/measure";
import {
  morphologyCheckSummaryFromSamples,
  type MorphologyBadgeSummary,
  type MorphologyCheckSummary,
} from "@/engine/verification/morphologyCheck";
import {
  lastCompleteBeat,
  localExtrema,
  phaseOf,
  positiveValvePeaksDetailed,
} from "@/engine/verification/shapeMetrics";
import { resolveVerificationProfile } from "@/engine/verification/profiles";

export const VENTRICULAR_LAND_MORPHOLOGY_PHASE5BP_ID =
  "ventricular-land-valve-load-morphology-phase5bp-result-v1" as const;
export const VENTRICULAR_LAND_MORPHOLOGY_PHASE5BP_RESULT_PATH =
  "data/myocardium/protocols/ventricular-land-valve-load-morphology-phase5bp-result-v1.json" as const;

type VariantId =
  | "legacy-frozen-reference"
  | "user0-default"
  | "lv-land-be"
  | "lv-land-sdirk2"
  | "lv-land-filtered-lambda-be"
  | "lv-land-no-zeta-drive-be"
  | "rv-land-be"
  | "rv-land-sdirk2"
  | "rv-land-filtered-lambda-be"
  | "rv-land-no-zeta-drive-be"
  | "lv-rv-land-be"
  | "lv-rv-land-sdirk2"
  | "lv-rv-land-filtered-lambda-be"
  | "lv-rv-land-no-zeta-drive-be";

type ChamberScope = "legacy" | "user0" | "LV" | "RV" | "LV+RV";
type LandParameterSetMode = "source" | "no-zeta-drive-diagnostic";
type VentricularSide = "LV" | "RV";
type ValveName = "MV" | "AoV" | "TV" | "PV";

type VariantSpec = {
  readonly id: VariantId;
  readonly label: string;
  readonly hypothesis: string;
  readonly chamberScope: ChamberScope;
  readonly commitScheme: ModelCoreLand2017LvCommitScheme | null;
  readonly kinematicsMode: ModelCoreLand2017LvKinematicsMode | null;
  readonly parameterSetMode: LandParameterSetMode | null;
  readonly experimentalOptions: ModelCoreExperimentalOptions;
  readonly instrumentationByChamber: Partial<Record<VentricularSide, ModelCoreLand2017LvSourceProviderInstrumentation>>;
};

type VariantResult = {
  readonly id: VariantId;
  readonly label: string;
  readonly hypothesis: string;
  readonly chamberScope: ChamberScope;
  readonly commitScheme: ModelCoreLand2017LvCommitScheme | null;
  readonly kinematicsMode: ModelCoreLand2017LvKinematicsMode | null;
  readonly parameterSetMode: LandParameterSetMode | null;
  readonly settled: boolean;
  readonly settleReason: SettleStatus["reason"];
  readonly actualSeconds: number | null;
  readonly healthStatus: SimulationHealth["status"] | null;
  readonly metrics: MetricDigest | null;
  readonly morphology: MorphologyCheckSummary | null;
  readonly failedLabels: readonly string[];
  readonly badges: MorphologyBadgeSummary | null;
  readonly ventricularSignals: Partial<Record<VentricularSide, VentricularSignalDigest>>;
  readonly valveDiagnostics: Record<ValveName, ValveDiagnosticDigest> | null;
  readonly landInstrumentation: Partial<Record<VentricularSide, LandInstrumentationDigest>>;
};

type MetricDigest = Pick<
  SimMetrics,
  "AoPMean" | "PAPMean" | "CO_L" | "CO_R" | "LAPMean" | "RAPMean" | "EF_LApprox" | "EF_RApprox"
>;

type VentricularSignalDigest = {
  readonly ejectionSampleCount: number;
  readonly ejectionDurationTheta: number | null;
  readonly ejectionPressurePeaks: readonly PeakDigest[];
  readonly ejectionPressureTroughs: readonly PeakDigest[];
  readonly semilunarFlowPeaks: readonly PeakDigest[];
  readonly avInflowPeaks: readonly PeakDigest[];
  readonly activeStatePeaks: readonly PeakDigest[];
  readonly activeStressPeaks: readonly PeakDigest[];
  readonly activePressurePeaks: readonly PeakDigest[];
  readonly activeStressRange: RangeDigest;
  readonly activePressureRange: RangeDigest;
  readonly semilunarXiRange: RangeDigest;
  readonly avXiRange: RangeDigest;
};

type ValveDiagnosticDigest = {
  readonly qDotClampHitFraction: number;
  readonly diodeHitFraction: number;
  readonly maxAbsQDotRaw: number | null;
  readonly maxAbsQDotPost: number | null;
  readonly maxAbsClampImpulse: number | null;
  readonly maxAbsDiodeImpulse: number | null;
  readonly qDotRawRange: RangeDigest;
  readonly qDotPostRange: RangeDigest;
};

type LandInstrumentationDigest = {
  readonly landSolveFailureCount: number;
  readonly landSolveOkCount: number;
  readonly maxSolverResidualNorm: number;
  readonly maxPreviousFreeCalciumMismatchUM: number;
  readonly lastFailureReason: string | null;
  readonly sourcePathAudit: LandSignalAuditDigest;
  readonly commitPathAudit: LandSignalAuditDigest;
};

type LandSignalAuditDigest = {
  readonly sampleCount: number;
  readonly freeCalciumUM: RangeDigest;
  readonly fiberEngineeringStrain: RangeDigest;
  readonly fiberEngineeringStrainRatePerSec: RangeDigest;
  readonly sourceActiveFiberStressPa: RangeDigest;
  readonly boundFraction: RangeDigest;
  readonly finiteHealthAllSamples: boolean;
};

type PeakDigest = {
  readonly theta: number;
  readonly value: number;
};

type RangeDigest = {
  readonly min: number | null;
  readonly max: number | null;
};

type Classification = {
  readonly lvPv:
    | "legacy-ok-land-be-and-sdirk2-fail"
    | "land-be-only"
    | "not-reproduced"
    | "unclassified";
  readonly rvPv:
    | "legacy-ok-land-be-and-sdirk2-fail"
    | "land-be-only"
    | "not-reproduced"
    | "unclassified";
  readonly mvf:
    | "lv-land-associated"
    | "land-commit-scheme-associated"
    | "not-reproduced"
    | "unclassified";
  readonly tvf:
    | "rv-land-associated"
    | "land-commit-scheme-associated"
    | "not-reproduced"
    | "unclassified";
  readonly sdirk2Commit: "not-effective-with-solver-failures" | "not-effective" | "possible-fix" | "unclassified";
  readonly filteredLambdaKinematics: "not-effective" | "possible-fix" | "unclassified";
  readonly zetaVelocityDrive:
    | "pv-double-dome-contributor-but-zeroing-breaks-av-inflow-output"
    | "not-diagnostic"
    | "unclassified";
  readonly notes: readonly string[];
};

type Evidence = {
  readonly schemaVersion: 1;
  readonly id: typeof VENTRICULAR_LAND_MORPHOLOGY_PHASE5BP_ID;
  readonly phase: "Phase 5BP";
  readonly generatedAt: string;
  readonly claimBoundary: "ventricular-land-valve-load-diagnostic-no-runtime-default-change";
  readonly protocol: {
    readonly profile: "fitFast";
    readonly gateSet: "normalBaseline";
    readonly rootZcMode: typeof MODELCORE_RUNTIME_ROOT_ZC_SOURCED_BOUNDARY_ROOT_DEFAULT_MODE;
    readonly morphologyCheckVersion: "morphology-check-v1";
    readonly comparedVariants: readonly VariantId[];
    readonly noLandAtrialParameterTuning: true;
    readonly noRootZcRetuning: true;
    readonly noValveThresholdTuning: true;
    readonly noQDotClampTuning: true;
    readonly noTrefOrSourceStressTuning: true;
    readonly noRuntimeDefaultChange: true;
    readonly noPermanentNpmScriptAdded: true;
  };
  readonly variants: readonly VariantResult[];
  readonly classification: Classification;
  readonly summary: {
    readonly diagnosticStatus: "diagnostic-recorded" | "diagnostic-incomplete-settle-blocked";
    readonly currentInterpretation: string;
    readonly recommendedNext: readonly string[];
    readonly blockers: readonly string[];
  };
  readonly boundary: {
    readonly noOfficialMorphologyAcceptance: true;
    readonly noAtrialPhysiologyAcceptance: true;
    readonly noValveLoadTimingAcceptance: true;
    readonly noQDotClampRemovalClaim: true;
    readonly noRuntimeDefaultChange: true;
    readonly noClinicalScientificValidation: true;
  };
  readonly normalizedSha256: string;
};

const profile = resolveVerificationProfile("fitFast");

const variants: readonly VariantSpec[] = [
  legacyVariant(),
  user0Variant(),
  customLandVariant("lv-land-be", "LV-only Land BE", "Tests whether the current LV Land commit path reproduces LV dome and MVF failures.", "LV", "BE"),
  customLandVariant("lv-land-sdirk2", "LV-only Land SDIRK2", "Tests whether the LV failure is a first-order Land commit artifact.", "LV", "SDIRK2"),
  customLandVariant("lv-land-filtered-lambda-be", "LV-only Land BE with filtered lambdaAct kinematics", "Tests whether the LV failure is a chamber-to-sarcomere kinematics adapter artifact.", "LV", "BE", "filtered-lambda-act"),
  customLandVariant("lv-land-no-zeta-drive-be", "LV-only Land BE with zeta velocity drive disabled", "Diagnostic ablation for Land zeta velocity-state feedback; not a sourced physiology candidate.", "LV", "BE", "raw-wall-lambda", "no-zeta-drive-diagnostic"),
  customLandVariant("rv-land-be", "RV-only Land BE", "Tests whether RV Land alone reproduces the RV dome and TVF failures.", "RV", "BE"),
  customLandVariant("rv-land-sdirk2", "RV-only Land SDIRK2", "Tests whether the RV failure is a first-order Land commit artifact.", "RV", "SDIRK2"),
  customLandVariant("rv-land-filtered-lambda-be", "RV-only Land BE with filtered lambdaAct kinematics", "Tests whether the RV failure is a chamber-to-sarcomere kinematics adapter artifact.", "RV", "BE", "filtered-lambda-act"),
  customLandVariant("rv-land-no-zeta-drive-be", "RV-only Land BE with zeta velocity drive disabled", "Diagnostic ablation for Land zeta velocity-state feedback; not a sourced physiology candidate.", "RV", "BE", "raw-wall-lambda", "no-zeta-drive-diagnostic"),
  customLandVariant("lv-rv-land-be", "LV+RV Land BE", "Records bilateral ventricular Land behavior with legacy atria.", "LV+RV", "BE"),
  customLandVariant("lv-rv-land-sdirk2", "LV+RV Land SDIRK2", "Tests whether the bilateral failure is reduced by second-order Land commit.", "LV+RV", "SDIRK2"),
  customLandVariant("lv-rv-land-filtered-lambda-be", "LV+RV Land BE with filtered lambdaAct kinematics", "Tests whether bilateral failures improve under the same kinematics adapter candidate.", "LV+RV", "BE", "filtered-lambda-act"),
  customLandVariant("lv-rv-land-no-zeta-drive-be", "LV+RV Land BE with zeta velocity drive disabled", "Diagnostic bilateral ablation for Land zeta velocity-state feedback; not a sourced physiology candidate.", "LV+RV", "BE", "raw-wall-lambda", "no-zeta-drive-diagnostic"),
];

export function buildVentricularLandMorphologyPhase5BPEvidence(): Evidence {
  const results = variants.map(runVariant);
  const classification = classify(results);
  const incomplete = results.some((result) => !result.settled || result.morphology == null);
  const evidenceWithoutHash: Omit<Evidence, "normalizedSha256"> = {
    schemaVersion: 1,
    id: VENTRICULAR_LAND_MORPHOLOGY_PHASE5BP_ID,
    phase: "Phase 5BP",
    generatedAt: new Date().toISOString(),
    claimBoundary: "ventricular-land-valve-load-diagnostic-no-runtime-default-change",
    protocol: {
      profile: "fitFast",
      gateSet: "normalBaseline",
      rootZcMode: MODELCORE_RUNTIME_ROOT_ZC_SOURCED_BOUNDARY_ROOT_DEFAULT_MODE,
      morphologyCheckVersion: "morphology-check-v1",
      comparedVariants: variants.map((variant) => variant.id),
      noLandAtrialParameterTuning: true,
      noRootZcRetuning: true,
      noValveThresholdTuning: true,
      noQDotClampTuning: true,
      noTrefOrSourceStressTuning: true,
      noRuntimeDefaultChange: true,
      noPermanentNpmScriptAdded: true,
    },
    variants: results,
    classification,
    summary: {
      diagnosticStatus: incomplete ? "diagnostic-incomplete-settle-blocked" : "diagnostic-recorded",
      currentInterpretation: interpretation(results, classification),
      recommendedNext: recommendedNext(results, classification),
      blockers: [
        "This phase diagnoses the gross LV/RV PV-loop and AV inflow failures; it does not accept morphology.",
        "Do not resume closed-loop LandAtrial parameter tuning until the ventricular Land valve/load/filling failure is fixed or bounded.",
        "Any follow-up fix must preserve the Phase 5BN reusable morphology-check-v1 surface and rerun this normal baseline comparison.",
      ],
    },
    boundary: {
      noOfficialMorphologyAcceptance: true,
      noAtrialPhysiologyAcceptance: true,
      noValveLoadTimingAcceptance: true,
      noQDotClampRemovalClaim: true,
      noRuntimeDefaultChange: true,
      noClinicalScientificValidation: true,
    },
  };
  return {
    ...evidenceWithoutHash,
    normalizedSha256: hashStable(evidenceWithoutHash),
  };
}

function legacyVariant(): VariantSpec {
  const resolved = resolveModelCoreRuntimeActiveSource({
    mode: MODELCORE_RUNTIME_LEGACY_ACTIVE_STRESS_ROLLBACK_MODE,
  });
  return {
    id: "legacy-frozen-reference",
    label: "Frozen legacy active-stress rollback/reference",
    hypothesis: "Reference morphology under the same fitFast normal baseline.",
    chamberScope: "legacy",
    commitScheme: null,
    kinematicsMode: null,
    parameterSetMode: null,
    experimentalOptions: resolved.experimentalOptions,
    instrumentationByChamber: {},
  };
}

function user0Variant(): VariantSpec {
  const resolved = resolveModelCoreRuntimeActiveSource({
    mode: MODELCORE_RUNTIME_ALL_CHAMBER_LANDATRIAL_DEFAULT_MODE,
    rootZcMode: MODELCORE_RUNTIME_ROOT_ZC_SOURCED_BOUNDARY_ROOT_DEFAULT_MODE,
    runtimeParams: DEFAULT_PARAMS,
  });
  const ventricularInstrumentation = resolved.instrumentationByChamber as Partial<
    Record<VentricularSide, ModelCoreLand2017LvSourceProviderInstrumentation>
  >;
  return {
    id: "user0-default",
    label: "User-0 staged default",
    hypothesis: "Records the live default failure surface with LV+RV+LA+RA LandAtrial.",
    chamberScope: "user0",
    commitScheme: "BE",
    kinematicsMode: "raw-wall-lambda",
    parameterSetMode: "source",
    experimentalOptions: resolved.experimentalOptions,
    instrumentationByChamber: {
      LV: ventricularInstrumentation.LV,
      RV: ventricularInstrumentation.RV,
    },
  };
}

function customLandVariant(
  id: VariantId,
  label: string,
  hypothesis: string,
  chamberScope: Extract<ChamberScope, "LV" | "RV" | "LV+RV">,
  commitScheme: ModelCoreLand2017LvCommitScheme,
  kinematicsMode: ModelCoreLand2017LvKinematicsMode = "raw-wall-lambda",
  parameterSetMode: LandParameterSetMode = "source",
): VariantSpec {
  const calciumScale = phase5QArtifact.calibration.phase2bAbsolutePeakScale;
  const parameterSet = landParameterSet(parameterSetMode);
  const rootZc = resolveModelCoreRuntimeRootZc({
    mode: MODELCORE_RUNTIME_ROOT_ZC_SOURCED_BOUNDARY_ROOT_DEFAULT_MODE,
    baseAoVInertanceMmHgSec2PerMl: DEFAULT_PARAMS.AoV_L,
  });
  const instrumentationByChamber: Partial<Record<VentricularSide, ModelCoreLand2017LvSourceProviderInstrumentation>> = {};
  const activeSourceProviders: NonNullable<ModelCoreExperimentalOptions["activeSourceProviders"]> = {};
  if (chamberScope === "LV" || chamberScope === "LV+RV") {
    const instrumentation = createModelCoreLand2017LvSourceProviderInstrumentation();
    instrumentationByChamber.LV = instrumentation;
    activeSourceProviders.LV = calciumScaledLand2017LvSourceOnlyProvider(instrumentation, {
      commitScheme,
      kinematicsMode,
      parameterSet,
      sourceProviderId: providerId(MODELCORE_EXPERIMENTAL_LAND2017_LV_SOURCE_ONLY_PROVIDER_ID, commitScheme, kinematicsMode, parameterSetMode),
      calciumScale,
      calciumInputMultiplier: "tmax-contractility-user-control",
      calciumInputMultiplierReference: defaultParams().lvTmaxScale * defaultParams().contractility,
    });
  }
  if (chamberScope === "RV" || chamberScope === "LV+RV") {
    const instrumentation = createModelCoreLand2017LvSourceProviderInstrumentation();
    instrumentationByChamber.RV = instrumentation;
    activeSourceProviders.RV = calciumScaledLand2017RvSourceOnlyProvider(instrumentation, {
      commitScheme,
      kinematicsMode,
      parameterSet,
      sourceProviderId: providerId(MODELCORE_EXPERIMENTAL_LAND2017_RV_SOURCE_ONLY_PROVIDER_ID, commitScheme, kinematicsMode, parameterSetMode),
      calciumScale,
      calciumInputMultiplier: "tmax-contractility-user-control",
      calciumInputMultiplierReference: defaultParams().rvTmaxScale * defaultParams().contractility,
    });
  }
  return {
    id,
    label,
    hypothesis,
    chamberScope,
    commitScheme,
    kinematicsMode,
    parameterSetMode,
    experimentalOptions: {
      ...rootZc.experimentalOptions,
      activeSourceProviders,
    },
    instrumentationByChamber,
  };
}

function providerId(
  baseId: string,
  commitScheme: ModelCoreLand2017LvCommitScheme,
  kinematicsMode: ModelCoreLand2017LvKinematicsMode,
  parameterSetMode: LandParameterSetMode,
): string {
  return `${baseId}:phase5bp-${commitScheme.toLowerCase()}-${kinematicsMode}-${parameterSetMode}`;
}

function landParameterSet(mode: LandParameterSetMode): Land2017SourceParameterSet {
  if (mode === "source") return LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET;
  return {
    ...LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET,
    parameterSetId: `${LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET.parameterSetId}:phase5bp-no-zeta-drive-diagnostic`,
    parameterSetStableHash: "phase5bp-no-zeta-drive-diagnostic-not-sourced",
    derived: {
      ...LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET.derived,
      Aw: 0,
      As: 0,
    },
  };
}

function runVariant(spec: VariantSpec): VariantResult {
  const settle = settleToSteadyState(DEFAULT_PARAMS, {
    targetTBV: profile.targetTBV,
    dt: profile.dt,
    sampleHz: profile.sampleHz,
    settlePolicy: profile.settlePolicy,
    measureBeats: profile.measureBeats,
    requireProjectorQuiet: profile.requireProjectorQuiet,
    experimentalOptions: spec.experimentalOptions,
  });
  const measurement = settle.ok
    ? measureSteady(settle.core, settle.settleStatus, {
      targetTBV: profile.targetTBV,
      dt: profile.dt,
      sampleHz: profile.sampleHz,
      settlePolicy: profile.settlePolicy,
      measureBeats: profile.measureBeats,
      requireProjectorQuiet: profile.requireProjectorQuiet,
      experimentalOptions: spec.experimentalOptions,
    })
    : null;
  const morphology = measurement ? morphologyCheckSummaryFromSamples(measurement.samples) : null;
  return {
    id: spec.id,
    label: spec.label,
    hypothesis: spec.hypothesis,
    chamberScope: spec.chamberScope,
    commitScheme: spec.commitScheme,
    kinematicsMode: spec.kinematicsMode,
    parameterSetMode: spec.parameterSetMode,
    settled: settle.settleStatus.settled,
    settleReason: settle.settleStatus.reason,
    actualSeconds: "actualSeconds" in settle.settleStatus ? settle.settleStatus.actualSeconds : null,
    healthStatus: measurement?.health.status ?? settle.core.health().status,
    metrics: measurement ? metricDigest(measurement.metrics) : null,
    morphology,
    failedLabels: morphology
      ? morphology.results.filter((result) => result.status === "failed").map((result) => result.label)
      : [],
    badges: morphology?.badges ?? null,
    ventricularSignals: measurement ? {
      LV: ventricularSignalDigest(measurement, "LV"),
      RV: ventricularSignalDigest(measurement, "RV"),
    } : {},
    valveDiagnostics: measurement ? valveDiagnosticDigest(measurement) : null,
    landInstrumentation: {
      LV: spec.instrumentationByChamber.LV ? landInstrumentationDigest(spec.instrumentationByChamber.LV) : undefined,
      RV: spec.instrumentationByChamber.RV ? landInstrumentationDigest(spec.instrumentationByChamber.RV) : undefined,
    },
  };
}

function metricDigest(metrics: SimMetrics): MetricDigest {
  return {
    AoPMean: round(metrics.AoPMean),
    PAPMean: round(metrics.PAPMean),
    CO_L: round(metrics.CO_L),
    CO_R: round(metrics.CO_R),
    LAPMean: round(metrics.LAPMean),
    RAPMean: round(metrics.RAPMean),
    EF_LApprox: round(metrics.EF_LApprox),
    EF_RApprox: round(metrics.EF_RApprox),
  };
}

function ventricularSignalDigest(measurement: SteadyMeasurement, side: VentricularSide): VentricularSignalDigest {
  const beat = lastCompleteBeat([...measurement.samples]);
  const pressureKey = side === "LV" ? "LVP" : "RVP";
  const flowKey = side === "LV" ? "QAo" : "QPV";
  const avFlowKey = side === "LV" ? "QMV" : "QTV";
  const activeKey = side === "LV" ? "aLV" : "aRV";
  const activePressureKey = side === "LV" ? "LVActivePressureMmHg" : "RVActivePressureMmHg";
  const activeStressKey = side === "LV" ? "LVActiveFiberStressPa" : "RVActiveFiberStressPa";
  const semilunarXiKey = side === "LV" ? "xiAoV" : "xiPV";
  const avXiKey = side === "LV" ? "xiMV" : "xiTV";
  const flowMax = Math.max(0, ...beat.map((sample) => numberAt(sample, flowKey)));
  const ejectionThreshold = Math.max(10, 0.08 * flowMax);
  const ejection = beat.filter((sample) => numberAt(sample, flowKey) > ejectionThreshold);
  const pressureRange = range(ejection.map((sample) => numberAt(sample, pressureKey)));
  const activeRange = range(beat.map((sample) => numberAt(sample, activeKey)));
  const activePressureValues = beat.map((sample) => numberAt(sample, activePressureKey));
  const activeStressValues = beat.map((sample) => numberAt(sample, activeStressKey));
  const activePressureRange = range(activePressureValues);
  const activeStressRange = range(activeStressValues);
  return {
    ejectionSampleCount: ejection.length,
    ejectionDurationTheta: durationTheta(ejection),
    ejectionPressurePeaks: extremaDigest(localExtrema([...ejection], pressureKey, "max", Math.max(side === "LV" ? 4 : 1.2, 0.10 * pressureRange))),
    ejectionPressureTroughs: extremaDigest(localExtrema([...ejection], pressureKey, "min", Math.max(side === "LV" ? 4 : 1.2, 0.10 * pressureRange))),
    semilunarFlowPeaks: extremaDigest(positiveFlowPeaksDetailed(beat, flowKey, 0.05, side === "LV" ? 20 : 10)),
    avInflowPeaks: extremaDigest(positiveValvePeaksDetailed([...beat], avFlowKey, 0.12, side === "LV" ? 20 : 10)),
    activeStatePeaks: extremaDigest(localExtrema([...beat], activeKey, "max", Math.max(0.02, 0.08 * activeRange))),
    activeStressPeaks: extremaDigest(tracePeaksDetailed(beat, activeStressKey, 0.05, 50)),
    activePressurePeaks: extremaDigest(tracePeaksDetailed(beat, activePressureKey, 0.05, 0.2)),
    activeStressRange: valueRange(activeStressValues),
    activePressureRange: valueRange(activePressureValues),
    semilunarXiRange: valueRange(beat.map((sample) => numberAt(sample, semilunarXiKey))),
    avXiRange: valueRange(beat.map((sample) => numberAt(sample, avXiKey))),
  };
}

function valveDiagnosticDigest(measurement: SteadyMeasurement): Record<ValveName, ValveDiagnosticDigest> {
  const beat = lastCompleteBeat([...measurement.samples]);
  return {
    MV: singleValveDiagnosticDigest(beat, "MV"),
    AoV: singleValveDiagnosticDigest(beat, "AoV"),
    TV: singleValveDiagnosticDigest(beat, "TV"),
    PV: singleValveDiagnosticDigest(beat, "PV"),
  };
}

function singleValveDiagnosticDigest(samples: readonly SimSample[], valve: ValveName): ValveDiagnosticDigest {
  const raw = samples.map((sample) => numberAt(sample, `${valve}_qDotRaw`));
  const post = samples.map((sample) => numberAt(sample, `${valve}_qDotPost`));
  const clampImpulse = samples.map((sample) => numberAt(sample, `${valve}_qDotClampImpulse`));
  const diodeImpulse = samples.map((sample) => numberAt(sample, `${valve}_diodeImpulse`));
  const clampHits = samples.filter((sample) => numberAt(sample, `${valve}_qDotClampHit01`) > 0.5).length;
  const diodeHits = diodeImpulse.filter((value) => Math.abs(value) > 1e-9).length;
  return {
    qDotClampHitFraction: round(clampHits / Math.max(samples.length, 1)),
    diodeHitFraction: round(diodeHits / Math.max(samples.length, 1)),
    maxAbsQDotRaw: nullableRound(maxAbs(raw)),
    maxAbsQDotPost: nullableRound(maxAbs(post)),
    maxAbsClampImpulse: nullableRound(maxAbs(clampImpulse)),
    maxAbsDiodeImpulse: nullableRound(maxAbs(diodeImpulse)),
    qDotRawRange: valueRange(raw),
    qDotPostRange: valueRange(post),
  };
}

function landInstrumentationDigest(
  instrumentation: ModelCoreLand2017LvSourceProviderInstrumentation,
): LandInstrumentationDigest {
  return {
    landSolveFailureCount: instrumentation.landSolveFailureCount,
    landSolveOkCount: instrumentation.landSolveOkCount,
    maxSolverResidualNorm: round(instrumentation.maxSolverResidualNorm),
    maxPreviousFreeCalciumMismatchUM: round(instrumentation.maxPreviousFreeCalciumMismatchUM),
    lastFailureReason: instrumentation.lastFailureReason,
    sourcePathAudit: landSignalAuditDigest(instrumentation.sourcePathAudit),
    commitPathAudit: landSignalAuditDigest(instrumentation.commitPathAudit),
  };
}

function landSignalAuditDigest(audit: ModelCoreLand2017LvSignalAudit): LandSignalAuditDigest {
  return {
    sampleCount: audit.sampleCount,
    freeCalciumUM: roundRange(audit.freeCalciumUM),
    fiberEngineeringStrain: roundRange(audit.fiberEngineeringStrain),
    fiberEngineeringStrainRatePerSec: roundRange(audit.fiberEngineeringStrainRatePerSec),
    sourceActiveFiberStressPa: roundRange(audit.sourceActiveFiberStressPa),
    boundFraction: roundRange(audit.boundFraction),
    finiteHealthAllSamples: audit.finiteHealthAllSamples,
  };
}

function classify(results: readonly VariantResult[]): Classification {
  const legacy = requiredResult(results, "legacy-frozen-reference");
  const lvBe = requiredResult(results, "lv-land-be");
  const lvSdirk2 = requiredResult(results, "lv-land-sdirk2");
  const rvBe = requiredResult(results, "rv-land-be");
  const rvSdirk2 = requiredResult(results, "rv-land-sdirk2");
  const lvFiltered = requiredResult(results, "lv-land-filtered-lambda-be");
  const rvFiltered = requiredResult(results, "rv-land-filtered-lambda-be");
  const lvNoZeta = requiredResult(results, "lv-land-no-zeta-drive-be");
  const rvNoZeta = requiredResult(results, "rv-land-no-zeta-drive-be");
  const lvRvBe = requiredResult(results, "lv-rv-land-be");
  const lvRvSdirk2 = requiredResult(results, "lv-rv-land-sdirk2");
  const lvRvFiltered = requiredResult(results, "lv-rv-land-filtered-lambda-be");
  const lvRvNoZeta = requiredResult(results, "lv-rv-land-no-zeta-drive-be");

  const lvPv = !failed(legacy, "lvPv") && failed(lvBe, "lvPv") && failed(lvSdirk2, "lvPv")
    ? "legacy-ok-land-be-and-sdirk2-fail"
    : !failed(legacy, "lvPv") && failed(lvBe, "lvPv") && !failed(lvSdirk2, "lvPv")
      ? "land-be-only"
      : !failed(lvBe, "lvPv") && !failed(lvSdirk2, "lvPv")
        ? "not-reproduced"
        : "unclassified";
  const rvPv = !failed(legacy, "rvPv") && failed(rvBe, "rvPv") && failed(rvSdirk2, "rvPv")
    ? "legacy-ok-land-be-and-sdirk2-fail"
    : !failed(legacy, "rvPv") && failed(rvBe, "rvPv") && !failed(rvSdirk2, "rvPv")
      ? "land-be-only"
      : !failed(rvBe, "rvPv") && !failed(rvSdirk2, "rvPv")
        ? "not-reproduced"
        : "unclassified";
  const mvf = failed(lvBe, "mvf") && !failed(lvSdirk2, "mvf")
    ? "land-commit-scheme-associated"
    : failed(lvBe, "mvf") && failed(lvSdirk2, "mvf") && !failed(legacy, "mvf")
      ? "lv-land-associated"
      : !failed(lvBe, "mvf") && !failed(lvRvBe, "mvf")
        ? "not-reproduced"
        : "unclassified";
  const tvf = failed(rvBe, "tvf") && !failed(rvSdirk2, "tvf")
    ? "land-commit-scheme-associated"
    : failed(rvBe, "tvf") && failed(rvSdirk2, "tvf") && !failed(legacy, "tvf")
      ? "rv-land-associated"
      : !failed(rvBe, "tvf") && !failed(lvRvBe, "tvf")
        ? "not-reproduced"
        : "unclassified";
  const sdirk2SolvesFail = landSolveFailures(lvSdirk2, "LV") > 0
    || landSolveFailures(rvSdirk2, "RV") > 0
    || landSolveFailures(lvRvSdirk2, "LV") > 0
    || landSolveFailures(lvRvSdirk2, "RV") > 0;
  const sdirk2StillFails = failed(lvSdirk2, "lvPv")
    && failed(rvSdirk2, "rvPv")
    && failed(lvRvSdirk2, "lvPv")
    && failed(lvRvSdirk2, "rvPv");
  const sdirk2Commit = sdirk2StillFails && sdirk2SolvesFail
    ? "not-effective-with-solver-failures"
    : sdirk2StillFails
      ? "not-effective"
      : !failed(lvSdirk2, "lvPv") || !failed(rvSdirk2, "rvPv")
        ? "possible-fix"
        : "unclassified";
  const filteredLambdaKinematics = failed(lvFiltered, "lvPv")
    && failed(rvFiltered, "rvPv")
    && failed(lvRvFiltered, "lvPv")
    && failed(lvRvFiltered, "rvPv")
    ? "not-effective"
    : !failed(lvFiltered, "lvPv") || !failed(rvFiltered, "rvPv")
      ? "possible-fix"
      : "unclassified";
  const zetaVelocityDrive = failed(lvBe, "lvPv")
    && failed(rvBe, "rvPv")
    && !failed(lvNoZeta, "lvPv")
    && !failed(rvNoZeta, "rvPv")
    && !failed(lvRvNoZeta, "lvPv")
    && !failed(lvRvNoZeta, "rvPv")
    && (failed(lvNoZeta, "mvf") || failed(rvNoZeta, "tvf") || failed(lvRvNoZeta, "mvf") || failed(lvRvNoZeta, "tvf"))
    ? "pv-double-dome-contributor-but-zeroing-breaks-av-inflow-output"
    : "not-diagnostic";
  return {
    lvPv,
    rvPv,
    mvf,
    tvf,
    sdirk2Commit,
    filteredLambdaKinematics,
    zetaVelocityDrive,
    notes: [
      `LV PV legacy/LV-BE/LV-SDIRK2/LV+RV-BE/LV+RV-SDIRK2 failures=${failed(legacy, "lvPv")}/${failed(lvBe, "lvPv")}/${failed(lvSdirk2, "lvPv")}/${failed(lvRvBe, "lvPv")}/${failed(lvRvSdirk2, "lvPv")}.`,
      `RV PV legacy/RV-BE/RV-SDIRK2/LV+RV-BE/LV+RV-SDIRK2 failures=${failed(legacy, "rvPv")}/${failed(rvBe, "rvPv")}/${failed(rvSdirk2, "rvPv")}/${failed(lvRvBe, "rvPv")}/${failed(lvRvSdirk2, "rvPv")}.`,
      `MVF legacy/LV-BE/LV-SDIRK2/LV+RV-BE/LV+RV-SDIRK2 failures=${failed(legacy, "mvf")}/${failed(lvBe, "mvf")}/${failed(lvSdirk2, "mvf")}/${failed(lvRvBe, "mvf")}/${failed(lvRvSdirk2, "mvf")}.`,
      `TVF legacy/RV-BE/RV-SDIRK2/LV+RV-BE/LV+RV-SDIRK2 failures=${failed(legacy, "tvf")}/${failed(rvBe, "tvf")}/${failed(rvSdirk2, "tvf")}/${failed(lvRvBe, "tvf")}/${failed(lvRvSdirk2, "tvf")}.`,
      `Filtered lambdaAct kinematics failures LV/RV/LV+RV=${failed(lvFiltered, "lvPv")}/${failed(rvFiltered, "rvPv")}/${failed(lvRvFiltered, "lvPv") || failed(lvRvFiltered, "rvPv")}.`,
      `No-zeta diagnostic failures LV-PV/RV-PV/MVF/TVF=${failed(lvRvNoZeta, "lvPv")}/${failed(lvRvNoZeta, "rvPv")}/${failed(lvRvNoZeta, "mvf")}/${failed(lvRvNoZeta, "tvf")}.`,
    ],
  };
}

function interpretation(results: readonly VariantResult[], classification: Classification): string {
  const user0 = requiredResult(results, "user0-default");
  return [
    `User-0 failed labels: ${user0.failedLabels.join(", ") || "none"}.`,
    `LV PV classification: ${classification.lvPv}.`,
    `RV PV classification: ${classification.rvPv}.`,
    `MVF classification: ${classification.mvf}.`,
    `TVF classification: ${classification.tvf}.`,
    `SDIRK2 classification: ${classification.sdirk2Commit}.`,
    `Filtered lambdaAct classification: ${classification.filteredLambdaKinematics}.`,
    `Zeta velocity-drive classification: ${classification.zetaVelocityDrive}.`,
  ].join(" ");
}

function recommendedNext(results: readonly VariantResult[], classification: Classification): readonly string[] {
  const next = [
    "do not tune LandAtrial or A1/A2 while LV/RV PV-loop and AV inflow gross morphology badges fail",
    "use the valve/qDot and Land source audit fields in this artifact to decide whether the next implementation fix belongs in Land commit semantics, valve-load timing, or chamber pressure-adapter coupling",
  ];
  if (classification.lvPv === "land-be-only" || classification.rvPv === "land-be-only") {
    next.push("evaluate SDIRK2 or substepped Land source commit as a runtime candidate only if it preserves health/output and removes gross PV-loop artifacts");
  }
  if (classification.lvPv === "legacy-ok-land-be-and-sdirk2-fail" || classification.rvPv === "legacy-ok-land-be-and-sdirk2-fail") {
    next.push("inspect Land source stress and pressure-adapter/valve-load coupling rather than treating the failure as a first-order commit artifact");
  }
  if (classification.sdirk2Commit === "not-effective-with-solver-failures") {
    next.push("do not promote SDIRK2 as a quick runtime fix; it preserves the gross PV/MVF failures here and records Land domain solver failures");
  }
  if (classification.filteredLambdaKinematics === "not-effective") {
    next.push("do not pursue a simple raw-wall-lambda to lambdaAct readback swap as the fix; the filtered-lambda diagnostic reproduces the same gross failures");
  }
  if (classification.zetaVelocityDrive === "pv-double-dome-contributor-but-zeroing-breaks-av-inflow-output") {
    next.push("treat Land zeta velocity-state feedback as a necessary contributor to the LV/RV double-dome artifact, but do not disable it globally because the no-zeta ablation breaks AV inflow morphology and shifts output");
    next.push("next implementation should bound or stage ventricular Land velocity/length coupling under valve-load transitions, not zero sourced zeta drive or tune valves/qDot/root/Zc to hide the artifact");
  }
  const lvBe = requiredResult(results, "lv-land-be");
  const rvBe = requiredResult(results, "rv-land-be");
  if ((lvBe.ventricularSignals.LV?.semilunarFlowPeaks.length ?? 0) > 1) {
    next.push("LV-only Land produces multiple QAo peaks; inspect AoV flow state, qDot clamp/diode, and LV relaxation/load handoff before atrial work");
  }
  if ((rvBe.ventricularSignals.RV?.semilunarFlowPeaks.length ?? 0) > 1) {
    next.push("RV-only Land produces multiple QPV peaks; inspect PV flow state and RV pressure-adapter/load handoff separately from LV root/Zc");
  }
  return next;
}

function requiredResult(results: readonly VariantResult[], id: VariantId): VariantResult {
  const result = results.find((entry) => entry.id === id);
  if (!result) throw new Error(`Missing Phase 5BP result ${id}.`);
  return result;
}

function failed(result: VariantResult, badge: keyof MorphologyBadgeSummary): boolean {
  return result.badges?.[badge] === "failed";
}

function landSolveFailures(result: VariantResult, side: VentricularSide): number {
  return result.landInstrumentation[side]?.landSolveFailureCount ?? 0;
}

function extremaDigest(peaks: readonly { readonly theta: number; readonly value: number }[]): readonly PeakDigest[] {
  return peaks.map((peak) => ({ theta: round(peak.theta), value: round(peak.value) }));
}

function positiveFlowPeaksDetailed(
  samples: readonly SimSample[],
  key: "QAo" | "QPV",
  relativeThreshold: number,
  absoluteThreshold: number,
): readonly PeakDigest[] {
  return tracePeaksDetailed(samples, key, relativeThreshold, absoluteThreshold);
}

function tracePeaksDetailed(
  samples: readonly SimSample[],
  key: string,
  relativeThreshold: number,
  absoluteThreshold: number,
): readonly PeakDigest[] {
  const maxFlow = Math.max(0, ...samples.map((sample) => numberAt(sample, key)));
  const threshold = Math.max(absoluteThreshold, relativeThreshold * maxFlow);
  const raw: PeakDigest[] = [];
  for (let i = 1; i < samples.length - 1; i++) {
    const prev = numberAt(samples[i - 1], key);
    const cur = numberAt(samples[i], key);
    const next = numberAt(samples[i + 1], key);
    if (cur <= threshold || cur < prev || cur <= next) continue;
    raw.push({ theta: phaseOf(samples[i]), value: cur });
  }
  return mergeNearbyPeaks(raw, 0.045);
}

function mergeNearbyPeaks(peaks: readonly PeakDigest[], minSeparationTheta: number): readonly PeakDigest[] {
  const out: PeakDigest[] = [];
  for (const peak of [...peaks].sort((a, b) => a.theta - b.theta)) {
    const last = out.at(-1);
    if (!last || peak.theta - last.theta > minSeparationTheta) {
      out.push(peak);
    } else if (peak.value > last.value) {
      out[out.length - 1] = peak;
    }
  }
  return out;
}

function durationTheta(samples: readonly SimSample[]): number | null {
  if (samples.length < 2) return null;
  return round(Math.max(0, phaseOf(samples.at(-1)!) - phaseOf(samples[0])));
}

function numberAt(sample: SimSample, key: string): number {
  const value = (sample as unknown as Record<string, unknown>)[key];
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function valueRange(values: readonly number[]): RangeDigest {
  const finite = values.filter(Number.isFinite);
  if (finite.length === 0) return { min: null, max: null };
  return { min: round(Math.min(...finite)), max: round(Math.max(...finite)) };
}

function roundRange(range: { readonly min: number | null; readonly max: number | null }): RangeDigest {
  return {
    min: nullableRound(range.min),
    max: nullableRound(range.max),
  };
}

function range(values: readonly number[]): number {
  const finite = values.filter(Number.isFinite);
  if (finite.length === 0) return 0;
  return Math.max(...finite) - Math.min(...finite);
}

function maxAbs(values: readonly number[]): number | null {
  const finite = values.filter(Number.isFinite);
  if (finite.length === 0) return null;
  return Math.max(...finite.map((value) => Math.abs(value)));
}

function round(value: number): number {
  return Number.isFinite(value) ? Number(value.toFixed(6)) : value;
}

function nullableRound(value: number | null): number | null {
  return value == null ? null : round(value);
}

function hashStable(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(sortForHash(value))).digest("hex");
}

function sortForHash(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortForHash);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, sortForHash(entry)]),
  );
}

function writeEvidence(): Evidence {
  const evidence = buildVentricularLandMorphologyPhase5BPEvidence();
  const outPath = path.resolve(process.cwd(), VENTRICULAR_LAND_MORPHOLOGY_PHASE5BP_RESULT_PATH);
  mkdirSync(path.dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(evidence, null, 2)}\n`);
  return evidence;
}

const isDirectRun = process.argv[1] != null
  && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
  const evidence = writeEvidence();
  console.log(JSON.stringify({
    id: evidence.id,
    hash: evidence.normalizedSha256,
    status: evidence.summary.diagnosticStatus,
    classification: evidence.classification,
    variants: evidence.variants.map((variant) => ({
      id: variant.id,
      settled: variant.settled,
      healthStatus: variant.healthStatus,
      failedLabels: variant.failedLabels,
      badges: variant.badges,
      lvSignals: variant.ventricularSignals.LV,
      rvSignals: variant.ventricularSignals.RV,
      valves: variant.valveDiagnostics,
      land: variant.landInstrumentation,
    })),
  }, null, 2));
}
