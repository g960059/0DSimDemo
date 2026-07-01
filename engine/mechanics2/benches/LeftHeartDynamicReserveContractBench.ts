import {
  buildLeftHeartArchitectureEnvelopeV1,
} from "@/engine/mechanics2/benches/LeftHeartArchitectureComparisonBench";
import { computeShapeQualityMetricsV1, type ShapeQualityMetricsV1 } from "@/engine/mechanics2/metrics/ShapeQualityMetricsV1";
import {
  runLeftHeartSubsystemV2,
  type LeftHeartSubsystemParamsV2,
  type LeftHeartSubsystemSampleV2,
} from "@/engine/mechanics2/subsystems/LeftHeartSubsystemV2";

export const LEFT_HEART_DYNAMIC_RESERVE_CONTRACT_REPORT_ID_V1 =
  "left-heart-dynamic-reserve-contract-report-v1" as const;

type LeftHeartDynamicReserveVariantIdV1 =
  | "static-output-reserve-broad5-reference"
  | "mv-state-closure-drive-wide"
  | "active-length-blend-plus-mv-closure"
  | "active-length-blend-plus-mv-closure-no-hard-floor"
  | "active-length-blend-plus-mv-closure-load3"
  | "active-length-blend-plus-mv-closure-root09"
  | "active-length-mv-closure-dynamic-root50"
  | "active-length-mv-closure-stateful-root05"
  | "active-length-mv-closure-stateful-root08"
  | "active-length-mv-closure-stateful-root04-slow";

type BeatSummaryV1 = {
  readonly beat: number;
  readonly strokeVolumeMl: number | null;
  readonly aovEjectedVolumeMl: number | null;
  readonly mvForwardVolumeMl: number | null;
  readonly lvpPeakMmHg: number | null;
  readonly lvpPositiveCurvatureBurden: number | null;
  readonly lvpC1ContinuityScore: number | null;
  readonly qMvPeakMlPerSec: number | null;
  readonly mvForwardPeakCount: number;
  readonly mvC1ContinuityScore: number;
  readonly lvpShape: ShapeQualityMetricsV1;
  readonly qMvShape: ShapeQualityMetricsV1;
  readonly clampCount: number;
  readonly laClampCount: number;
  readonly lvClampCount: number;
  readonly maxSafetyPressureMmHg: number | null;
  readonly maxMvClosureDrive01: number | null;
  readonly mvClosureDriveDutyFraction: number;
  readonly maxRootOutflowHighPressureDrive01: number | null;
  readonly maxRootOutflowStatefulDrive01: number | null;
  readonly maxRootOutResistanceEffectiveMmHgSecPerMl: number | null;
};

export type LeftHeartDynamicReservePointResultV1 = {
  readonly pointId: string;
  readonly status: "pass" | "fail" | "inconclusive";
  readonly finalBeat: BeatSummaryV1 | null;
  readonly previousBeat: BeatSummaryV1 | null;
  readonly dtHalfFinalBeat: BeatSummaryV1 | null;
  readonly repeatability: {
    readonly aovEjectionDeltaMl: number | null;
    readonly strokeVolumeDeltaMl: number | null;
    readonly clampDelta: number | null;
    readonly ok: boolean;
  };
  readonly dtSensitivity: {
    readonly aovEjectionDeltaMl: number | null;
    readonly strokeVolumeDeltaMl: number | null;
    readonly mvC1ContinuityDelta: number | null;
    readonly outputParityOk: boolean;
    readonly shapeParityOk: boolean;
    readonly ok: boolean;
  };
  readonly classifications: {
    readonly lvPvOk: boolean;
    readonly mvfOk: boolean;
    readonly outputOk: boolean;
    readonly flowCoupled: boolean;
    readonly clampFree: boolean;
    readonly safetyWorkBounded: boolean;
    readonly morphologyOk: boolean;
    readonly cleanLowOutputReserve: boolean;
    readonly highDriveArtifact: boolean;
  };
  readonly rawFailureReasons: readonly string[];
  readonly acceptedPhenotypeReasons: readonly string[];
  readonly failureReasons: readonly string[];
};

export type LeftHeartDynamicReserveVariantResultV1 = {
  readonly variantId: LeftHeartDynamicReserveVariantIdV1;
  readonly description: string;
  readonly intervention: {
    readonly lvPressureScaleMultiplier: number;
    readonly lvTrefMultiplier: number;
    readonly activeLengthExternalBlend01: number;
    readonly aovResistanceMultiplier: number;
    readonly aovInertanceMultiplier: number;
    readonly aovBernoulliMultiplier: number;
    readonly rootOutResistanceMultiplier: number;
    readonly minLvVolumeMl: number | null;
    readonly absoluteMinLvVolumeMl: number | null;
    readonly lvLowerSoftLimitGainMultiplier: number;
    readonly laAWaveMmHg: number | null;
    readonly laAWaveStartTheta: number | null;
    readonly laAWaveEndTheta: number | null;
    readonly mvSystolicClosureDriveGain01: number;
    readonly mvSystolicClosureDriveStartTheta: number;
    readonly mvSystolicClosureDriveEndTheta: number;
    readonly rootOutflowHighPressureDriveStartMmHg: number;
    readonly rootOutflowHighPressureDriveEndMmHg: number;
    readonly rootOutflowHighPressureResistanceGain: number;
    readonly rootOutflowStatefulDriveStartMmHg: number;
    readonly rootOutflowStatefulDriveEndMmHg: number;
    readonly rootOutflowStatefulResistanceGain: number;
    readonly rootOutflowStatefulRiseTauSec: number;
    readonly rootOutflowStatefulFallTauSec: number;
  };
  readonly pointResults: readonly LeftHeartDynamicReservePointResultV1[];
  readonly summary: {
    readonly total: number;
    readonly pass: number;
    readonly fail: number;
    readonly inconclusive: number;
    readonly lvPvOkCount: number;
    readonly mvfOkCount: number;
    readonly outputOkCount: number;
    readonly repeatabilityOkCount: number;
    readonly dtStableCount: number;
    readonly flowCoupledCount: number;
    readonly clampFreeCount: number;
    readonly lvClampFreeCount: number;
    readonly laClampFreeCount: number;
    readonly safetyWorkBoundedCount: number;
    readonly morphologyOkCount: number;
    readonly cleanLowOutputReserveCount: number;
    readonly phenotypeAcceptedCount: number;
    readonly highDriveArtifactCount: number;
    readonly maxMvClosureDrive01: number | null;
    readonly maxRootOutflowHighPressureDrive01: number | null;
    readonly maxRootOutflowStatefulDrive01: number | null;
  };
};

export type LeftHeartDynamicReserveContractReportV1 = {
  readonly reportId: typeof LEFT_HEART_DYNAMIC_RESERVE_CONTRACT_REPORT_ID_V1;
  readonly gateId: "leftHeartDynamicReserveContractGateV1";
  readonly sourceSurface: "static-output-reserve-broad5";
  readonly variantResults: readonly LeftHeartDynamicReserveVariantResultV1[];
  readonly decision: {
    readonly leftHeartGateBStatus:
      | "gate-b-pass-with-clean-low-output-phenotype"
      | "improved-but-blocked"
      | "no-broad-improvement";
    readonly bestStrictVariantId: LeftHeartDynamicReserveVariantIdV1;
    readonly bestStrictPassCount: number;
    readonly referencePassCount: number;
    readonly bestHighDriveVariantId: LeftHeartDynamicReserveVariantIdV1;
    readonly bestHighDriveStatus: "cleaned" | "still-artifact";
    readonly bestLowOutputClassificationCount: number;
    readonly bestAcceptedPhenotypeCount: number;
    readonly remainingBlockers: readonly string[];
    readonly nextAction: string;
  };
  readonly claimBoundary: {
    readonly runtimeWiring: false;
    readonly morphologyAcceptance: false;
    readonly outputReserveAcceptance: true;
    readonly outputReserveAcceptanceScope: "left-heart-gate-b-clean-low-contractility-phenotype-only";
    readonly rightHeartStrategicSmokeUnlock: boolean;
    readonly rightHeartRuntimeUnlock: false;
    readonly fourChamberUnlock: false;
    readonly LandAtrialUnlock: false;
  };
};

type VariantSpecV1 = LeftHeartDynamicReserveVariantResultV1["intervention"] & {
  readonly variantId: LeftHeartDynamicReserveVariantIdV1;
  readonly description: string;
};

const BASE_TRANSACTION = {
  transactionMode: "fixed-point",
  transactionIterations: 2,
  transactionRelaxation: 0.5,
  volumeSafetyMode: "soft-pressure",
} as const;

const STATIC_OUTPUT_RESERVE = {
  lvPressureScaleMultiplier: 1.05,
  lvTrefMultiplier: 1.1,
  activeLengthExternalBlend01: 0,
  aovResistanceMultiplier: 3,
  aovInertanceMultiplier: 6,
  aovBernoulliMultiplier: 4,
  rootOutResistanceMultiplier: 0.7,
  minLvVolumeMl: 30,
  absoluteMinLvVolumeMl: 20,
  lvLowerSoftLimitGainMultiplier: 0.05,
  laAWaveMmHg: null,
  laAWaveStartTheta: null,
  laAWaveEndTheta: null,
  mvSystolicClosureDriveGain01: 0,
  mvSystolicClosureDriveStartTheta: 0.02,
  mvSystolicClosureDriveEndTheta: 0.18,
  rootOutflowHighPressureDriveStartMmHg: 0,
  rootOutflowHighPressureDriveEndMmHg: 0,
  rootOutflowHighPressureResistanceGain: 0,
  rootOutflowStatefulDriveStartMmHg: 0,
  rootOutflowStatefulDriveEndMmHg: 0,
  rootOutflowStatefulResistanceGain: 0,
  rootOutflowStatefulRiseTauSec: 0.035,
  rootOutflowStatefulFallTauSec: 0.35,
} as const;

const VARIANTS: readonly VariantSpecV1[] = [
  {
    variantId: "static-output-reserve-broad5-reference",
    description: "Reference static output-reserve surface from the previous Gate B frontier.",
    ...STATIC_OUTPUT_RESERVE,
  },
  {
    variantId: "mv-state-closure-drive-wide",
    description: "Wider early systolic MV closure-state drive for high-contractility kink attribution.",
    ...STATIC_OUTPUT_RESERVE,
    mvSystolicClosureDriveGain01: 0.85,
    mvSystolicClosureDriveStartTheta: 0.00,
    mvSystolicClosureDriveEndTheta: 0.28,
  },
  {
    variantId: "active-length-blend-plus-mv-closure",
    description: "Combines the LV7 active-length component signal with MV closure-state drive.",
    ...STATIC_OUTPUT_RESERVE,
    lvPressureScaleMultiplier: 1,
    lvTrefMultiplier: 1.05,
    activeLengthExternalBlend01: 0.15,
    aovResistanceMultiplier: 1,
    aovInertanceMultiplier: 3,
    aovBernoulliMultiplier: 4,
    mvSystolicClosureDriveGain01: 0.85,
    mvSystolicClosureDriveStartTheta: 0.00,
    mvSystolicClosureDriveEndTheta: 0.28,
  },
  {
    variantId: "active-length-blend-plus-mv-closure-no-hard-floor",
    description: "Diagnostic only: removes the lower hard floor after LV/MVF cleanup to classify whether high-drive failure is pure lower-bound clipping.",
    ...STATIC_OUTPUT_RESERVE,
    lvPressureScaleMultiplier: 1,
    lvTrefMultiplier: 1.05,
    activeLengthExternalBlend01: 0.15,
    aovResistanceMultiplier: 1,
    aovInertanceMultiplier: 3,
    aovBernoulliMultiplier: 4,
    minLvVolumeMl: 25,
    absoluteMinLvVolumeMl: 0,
    mvSystolicClosureDriveGain01: 0.85,
    mvSystolicClosureDriveStartTheta: 0.00,
    mvSystolicClosureDriveEndTheta: 0.28,
  },
  {
    variantId: "active-length-blend-plus-mv-closure-load3",
    description: "Adds stronger semilunar load to test whether high-drive clamp is outflow-limited.",
    ...STATIC_OUTPUT_RESERVE,
    lvPressureScaleMultiplier: 1,
    lvTrefMultiplier: 1.05,
    activeLengthExternalBlend01: 0.15,
    aovResistanceMultiplier: 3,
    aovInertanceMultiplier: 6,
    aovBernoulliMultiplier: 8,
    mvSystolicClosureDriveGain01: 0.85,
    mvSystolicClosureDriveStartTheta: 0.00,
    mvSystolicClosureDriveEndTheta: 0.28,
  },
  {
    variantId: "active-length-blend-plus-mv-closure-root09",
    description: "Raises root runoff resistance on the active-length plus MV closure signal.",
    ...STATIC_OUTPUT_RESERVE,
    lvPressureScaleMultiplier: 1,
    lvTrefMultiplier: 1.05,
    activeLengthExternalBlend01: 0.15,
    aovResistanceMultiplier: 1,
    aovInertanceMultiplier: 3,
    aovBernoulliMultiplier: 4,
    rootOutResistanceMultiplier: 0.9,
    mvSystolicClosureDriveGain01: 0.85,
    mvSystolicClosureDriveStartTheta: 0.00,
    mvSystolicClosureDriveEndTheta: 0.28,
  },
  {
    variantId: "active-length-mv-closure-dynamic-root50",
    description: "Stronger high-pressure root runoff resistance gate for high-drive clamp attribution.",
    ...STATIC_OUTPUT_RESERVE,
    lvPressureScaleMultiplier: 1,
    lvTrefMultiplier: 1.05,
    activeLengthExternalBlend01: 0.15,
    aovResistanceMultiplier: 1,
    aovInertanceMultiplier: 3,
    aovBernoulliMultiplier: 4,
    mvSystolicClosureDriveGain01: 0.85,
    mvSystolicClosureDriveStartTheta: 0.00,
    mvSystolicClosureDriveEndTheta: 0.28,
    rootOutflowHighPressureDriveStartMmHg: 170,
    rootOutflowHighPressureDriveEndMmHg: 190,
    rootOutflowHighPressureResistanceGain: 0.5,
  },
  {
    variantId: "active-length-mv-closure-stateful-root05",
    description: "Stateful root runoff retention driven by high LVP, intended to raise high-drive load without broad fixed root scaling.",
    ...STATIC_OUTPUT_RESERVE,
    lvPressureScaleMultiplier: 1,
    lvTrefMultiplier: 1.05,
    activeLengthExternalBlend01: 0.15,
    aovResistanceMultiplier: 1,
    aovInertanceMultiplier: 3,
    aovBernoulliMultiplier: 4,
    mvSystolicClosureDriveGain01: 0.85,
    mvSystolicClosureDriveStartTheta: 0.00,
    mvSystolicClosureDriveEndTheta: 0.28,
    rootOutflowStatefulDriveStartMmHg: 150,
    rootOutflowStatefulDriveEndMmHg: 175,
    rootOutflowStatefulResistanceGain: 0.5,
    rootOutflowStatefulRiseTauSec: 0.025,
    rootOutflowStatefulFallTauSec: 0.35,
  },
  {
    variantId: "active-length-mv-closure-stateful-root08",
    description: "Higher-gain stateful root runoff retention for high-drive load attribution.",
    ...STATIC_OUTPUT_RESERVE,
    lvPressureScaleMultiplier: 1,
    lvTrefMultiplier: 1.05,
    activeLengthExternalBlend01: 0.15,
    aovResistanceMultiplier: 1,
    aovInertanceMultiplier: 3,
    aovBernoulliMultiplier: 4,
    mvSystolicClosureDriveGain01: 0.85,
    mvSystolicClosureDriveStartTheta: 0.00,
    mvSystolicClosureDriveEndTheta: 0.28,
    rootOutflowStatefulDriveStartMmHg: 150,
    rootOutflowStatefulDriveEndMmHg: 175,
    rootOutflowStatefulResistanceGain: 0.8,
    rootOutflowStatefulRiseTauSec: 0.025,
    rootOutflowStatefulFallTauSec: 0.50,
  },
  {
    variantId: "active-length-mv-closure-stateful-root04-slow",
    description: "Lower-gain slower-release stateful root runoff retention for high-drive load attribution.",
    ...STATIC_OUTPUT_RESERVE,
    lvPressureScaleMultiplier: 1,
    lvTrefMultiplier: 1.05,
    activeLengthExternalBlend01: 0.15,
    aovResistanceMultiplier: 1,
    aovInertanceMultiplier: 3,
    aovBernoulliMultiplier: 4,
    mvSystolicClosureDriveGain01: 0.85,
    mvSystolicClosureDriveStartTheta: 0.00,
    mvSystolicClosureDriveEndTheta: 0.28,
    rootOutflowStatefulDriveStartMmHg: 145,
    rootOutflowStatefulDriveEndMmHg: 170,
    rootOutflowStatefulResistanceGain: 0.4,
    rootOutflowStatefulRiseTauSec: 0.035,
    rootOutflowStatefulFallTauSec: 0.70,
  },
];

export function runLeftHeartDynamicReserveContractBenchV1(): LeftHeartDynamicReserveContractReportV1 {
  const variantResults = VARIANTS.map(runVariant);
  const reference = requiredVariant(variantResults, "static-output-reserve-broad5-reference");
  const bestStrict = [...variantResults].sort((a, b) =>
    b.summary.pass - a.summary.pass
    || b.summary.mvfOkCount - a.summary.mvfOkCount
    || b.summary.outputOkCount - a.summary.outputOkCount
    || b.summary.clampFreeCount - a.summary.clampFreeCount,
  )[0]!;
  const highDriveCandidates = variantResults
    .map((variant) => ({
      variant,
      highPoint: variant.pointResults.find((point) => point.pointId === "left-heart-contractility-high"),
    }))
    .sort((a, b) => highDriveScore(b.highPoint) - highDriveScore(a.highPoint));
  const bestHighDrive = highDriveCandidates[0]!;
  const bestLowOutputClassificationCount = Math.max(
    ...variantResults.map((variant) => variant.summary.cleanLowOutputReserveCount),
  );
  const bestAcceptedPhenotypeCount = bestStrict.summary.phenotypeAcceptedCount;
  const leftHeartGateBStatus = bestStrict.summary.pass === bestStrict.summary.total
    ? "gate-b-pass-with-clean-low-output-phenotype"
    : bestStrict.summary.pass > reference.summary.pass
      ? "improved-but-blocked"
      : "no-broad-improvement";
  return {
    reportId: LEFT_HEART_DYNAMIC_RESERVE_CONTRACT_REPORT_ID_V1,
    gateId: "leftHeartDynamicReserveContractGateV1",
    sourceSurface: "static-output-reserve-broad5",
    variantResults,
    decision: {
      leftHeartGateBStatus,
      bestStrictVariantId: bestStrict.variantId,
      bestStrictPassCount: bestStrict.summary.pass,
      referencePassCount: reference.summary.pass,
      bestHighDriveVariantId: bestHighDrive.variant.variantId,
      bestHighDriveStatus: bestHighDrive.highPoint?.classifications.highDriveArtifact === false
        && bestHighDrive.highPoint?.classifications.outputOk === true
        ? "cleaned"
        : "still-artifact",
      bestLowOutputClassificationCount,
      bestAcceptedPhenotypeCount,
      remainingBlockers: leftHeartGateBStatus === "gate-b-pass-with-clean-low-output-phenotype"
        ? []
        : [
          "high-contractility must be clean output with no MVF kink, clamp, overpressure, or flow-volume decoupling",
          "contractility-low may only be accepted as low-output phenotype if morphology, mass, clamp, safety, repeatability, and dt parity remain clean",
        ],
      nextAction: leftHeartGateBStatus === "gate-b-pass-with-clean-low-output-phenotype"
        ? "Left-heart Gate B passes with one accepted clean low-contractility low-output phenotype. Proceed to MechanicsCore2 right-heart strategic smoke; keep runtime wiring, four-chamber, AV-plane, and LandAtrial locked."
        : "Keep MechanicsCore2 in left-heart Gate B. Do not expand to right-heart, four-chamber, AV-plane, or LandAtrial until the dynamic chamber-load contract clears high-drive artifacts and classifies low-output reserve cleanly.",
    },
    claimBoundary: {
      runtimeWiring: false,
      morphologyAcceptance: false,
      outputReserveAcceptance: true,
      outputReserveAcceptanceScope: "left-heart-gate-b-clean-low-contractility-phenotype-only",
      rightHeartStrategicSmokeUnlock: leftHeartGateBStatus === "gate-b-pass-with-clean-low-output-phenotype",
      rightHeartRuntimeUnlock: false,
      fourChamberUnlock: false,
      LandAtrialUnlock: false,
    },
  };
}

function runVariant(spec: VariantSpecV1): LeftHeartDynamicReserveVariantResultV1 {
  const pointResults = buildLeftHeartArchitectureEnvelopeV1(BASE_TRANSACTION)
    .map((params) => applyVariant(params, spec))
    .map(runPoint);
  return {
    variantId: spec.variantId,
    description: spec.description,
    intervention: {
      lvPressureScaleMultiplier: spec.lvPressureScaleMultiplier,
      lvTrefMultiplier: spec.lvTrefMultiplier,
      activeLengthExternalBlend01: spec.activeLengthExternalBlend01,
      aovResistanceMultiplier: spec.aovResistanceMultiplier,
      aovInertanceMultiplier: spec.aovInertanceMultiplier,
      aovBernoulliMultiplier: spec.aovBernoulliMultiplier,
      rootOutResistanceMultiplier: spec.rootOutResistanceMultiplier,
      minLvVolumeMl: spec.minLvVolumeMl,
      absoluteMinLvVolumeMl: spec.absoluteMinLvVolumeMl,
      lvLowerSoftLimitGainMultiplier: spec.lvLowerSoftLimitGainMultiplier,
      laAWaveMmHg: spec.laAWaveMmHg,
      laAWaveStartTheta: spec.laAWaveStartTheta,
      laAWaveEndTheta: spec.laAWaveEndTheta,
      mvSystolicClosureDriveGain01: spec.mvSystolicClosureDriveGain01,
      mvSystolicClosureDriveStartTheta: spec.mvSystolicClosureDriveStartTheta,
      mvSystolicClosureDriveEndTheta: spec.mvSystolicClosureDriveEndTheta,
      rootOutflowHighPressureDriveStartMmHg: spec.rootOutflowHighPressureDriveStartMmHg,
      rootOutflowHighPressureDriveEndMmHg: spec.rootOutflowHighPressureDriveEndMmHg,
      rootOutflowHighPressureResistanceGain: spec.rootOutflowHighPressureResistanceGain,
      rootOutflowStatefulDriveStartMmHg: spec.rootOutflowStatefulDriveStartMmHg,
      rootOutflowStatefulDriveEndMmHg: spec.rootOutflowStatefulDriveEndMmHg,
      rootOutflowStatefulResistanceGain: spec.rootOutflowStatefulResistanceGain,
      rootOutflowStatefulRiseTauSec: spec.rootOutflowStatefulRiseTauSec,
      rootOutflowStatefulFallTauSec: spec.rootOutflowStatefulFallTauSec,
    },
    pointResults,
    summary: summarizeVariant(pointResults),
  };
}

function applyVariant(params: LeftHeartSubsystemParamsV2, spec: VariantSpecV1): LeftHeartSubsystemParamsV2 {
  return {
    ...params,
    rootOutResistanceMmHgSecPerMl: params.rootOutResistanceMmHgSecPerMl * spec.rootOutResistanceMultiplier,
    minLvVolumeMl: spec.minLvVolumeMl ?? params.minLvVolumeMl,
    absoluteMinLvVolumeMl: spec.absoluteMinLvVolumeMl ?? params.absoluteMinLvVolumeMl,
    lvLowerSoftLimitGainMmHgPerMl: params.lvLowerSoftLimitGainMmHgPerMl * spec.lvLowerSoftLimitGainMultiplier,
    laAWaveMmHg: spec.laAWaveMmHg ?? params.laAWaveMmHg,
    laAWaveStartTheta: spec.laAWaveStartTheta ?? params.laAWaveStartTheta,
    laAWaveEndTheta: spec.laAWaveEndTheta ?? params.laAWaveEndTheta,
    mvSystolicClosureDriveGain01: spec.mvSystolicClosureDriveGain01,
    mvSystolicClosureDriveStartTheta: spec.mvSystolicClosureDriveStartTheta,
    mvSystolicClosureDriveEndTheta: spec.mvSystolicClosureDriveEndTheta,
    rootOutflowHighPressureDriveStartMmHg: spec.rootOutflowHighPressureDriveStartMmHg,
    rootOutflowHighPressureDriveEndMmHg: spec.rootOutflowHighPressureDriveEndMmHg,
    rootOutflowHighPressureResistanceGain: spec.rootOutflowHighPressureResistanceGain,
    rootOutflowStatefulDriveStartMmHg: spec.rootOutflowStatefulDriveStartMmHg,
    rootOutflowStatefulDriveEndMmHg: spec.rootOutflowStatefulDriveEndMmHg,
    rootOutflowStatefulResistanceGain: spec.rootOutflowStatefulResistanceGain,
    rootOutflowStatefulRiseTauSec: spec.rootOutflowStatefulRiseTauSec,
    rootOutflowStatefulFallTauSec: spec.rootOutflowStatefulFallTauSec,
    lv: {
      ...params.lv,
      pressureScale: params.lv.pressureScale * spec.lvPressureScaleMultiplier,
      fiber: {
        ...params.lv.fiber,
        trefPa: params.lv.fiber.trefPa * spec.lvTrefMultiplier,
        activeLengthExternalBlend01: spec.activeLengthExternalBlend01,
      },
    },
    aov: {
      ...params.aov,
      resistanceMmHgSecPerMl: params.aov.resistanceMmHgSecPerMl * spec.aovResistanceMultiplier,
      inertanceMmHgSec2PerMl: params.aov.inertanceMmHgSec2PerMl * spec.aovInertanceMultiplier,
      bernoulliMmHgSec2PerMl2: params.aov.bernoulliMmHgSec2PerMl2 * spec.aovBernoulliMultiplier,
    },
  };
}

function runPoint(params: LeftHeartSubsystemParamsV2): LeftHeartDynamicReservePointResultV1 {
  const run = runLeftHeartSubsystemV2(params);
  const dtHalfRun = runLeftHeartSubsystemV2({ ...params, sampleRateHz: params.sampleRateHz * 2 });
  const finalBeatIndex = params.beats - 2;
  const previousBeatIndex = params.beats - 3;
  const finalBeat = summarizeBeat(finalBeatIndex, run.samples.filter((sample) => sample.beat === finalBeatIndex));
  const previousBeat = summarizeBeat(previousBeatIndex, run.samples.filter((sample) => sample.beat === previousBeatIndex));
  const dtHalfFinalBeat = summarizeBeat(finalBeatIndex, dtHalfRun.samples.filter((sample) => sample.beat === finalBeatIndex));
  if (finalBeat == null || previousBeat == null || dtHalfFinalBeat == null) {
    return emptyPoint(params.fixtureId, finalBeat, previousBeat, dtHalfFinalBeat);
  }
  const aovEjectionDeltaMl = Math.abs((finalBeat.aovEjectedVolumeMl ?? 0) - (previousBeat.aovEjectedVolumeMl ?? 0));
  const strokeVolumeDeltaMl = Math.abs((finalBeat.strokeVolumeMl ?? 0) - (previousBeat.strokeVolumeMl ?? 0));
  const clampDelta = Math.abs(finalBeat.clampCount - previousBeat.clampCount);
  const dtAovEjectionDeltaMl = Math.abs((finalBeat.aovEjectedVolumeMl ?? 0) - (dtHalfFinalBeat.aovEjectedVolumeMl ?? 0));
  const dtStrokeVolumeDeltaMl = Math.abs((finalBeat.strokeVolumeMl ?? 0) - (dtHalfFinalBeat.strokeVolumeMl ?? 0));
  const dtMvC1ContinuityDelta = Math.abs(finalBeat.mvC1ContinuityScore - dtHalfFinalBeat.mvC1ContinuityScore);
  const repeatabilityOk = aovEjectionDeltaMl <= 20 && strokeVolumeDeltaMl <= 20 && clampDelta === 0;
  const dtOutputParityOk = dtAovEjectionDeltaMl <= 12 && dtStrokeVolumeDeltaMl <= 12;
  const dtShapeParityOk = dtMvC1ContinuityDelta <= 0.18;
  const classifications = classify(params.fixtureId, finalBeat, repeatabilityOk, dtOutputParityOk && dtShapeParityOk);
  const rawFailureReasons = failureReasonsFor(classifications, finalBeat, repeatabilityOk, dtOutputParityOk, dtShapeParityOk);
  const acceptedPhenotypeReasons = acceptedPhenotypeReasonsFor(classifications);
  const failureReasons = acceptedPhenotypeReasons.length > 0 ? [] : rawFailureReasons;
  return {
    pointId: params.fixtureId,
    status: failureReasons.length === 0 ? "pass" : "fail",
    finalBeat,
    previousBeat,
    dtHalfFinalBeat,
    repeatability: {
      aovEjectionDeltaMl: round(aovEjectionDeltaMl),
      strokeVolumeDeltaMl: round(strokeVolumeDeltaMl),
      clampDelta,
      ok: repeatabilityOk,
    },
    dtSensitivity: {
      aovEjectionDeltaMl: round(dtAovEjectionDeltaMl),
      strokeVolumeDeltaMl: round(dtStrokeVolumeDeltaMl),
      mvC1ContinuityDelta: round(dtMvC1ContinuityDelta),
      outputParityOk: dtOutputParityOk,
      shapeParityOk: dtShapeParityOk,
      ok: dtOutputParityOk && dtShapeParityOk,
    },
    classifications,
    rawFailureReasons,
    acceptedPhenotypeReasons,
    failureReasons,
  };
}

function summarizeVariant(
  pointResults: readonly LeftHeartDynamicReservePointResultV1[],
): LeftHeartDynamicReserveVariantResultV1["summary"] {
  return {
    total: pointResults.length,
    pass: pointResults.filter((point) => point.status === "pass").length,
    fail: pointResults.filter((point) => point.status === "fail").length,
    inconclusive: pointResults.filter((point) => point.status === "inconclusive").length,
    lvPvOkCount: pointResults.filter((point) => point.classifications.lvPvOk).length,
    mvfOkCount: pointResults.filter((point) => point.classifications.mvfOk).length,
    outputOkCount: pointResults.filter((point) => point.classifications.outputOk).length,
    repeatabilityOkCount: pointResults.filter((point) => point.repeatability.ok).length,
    dtStableCount: pointResults.filter((point) => point.dtSensitivity.ok).length,
    flowCoupledCount: pointResults.filter((point) => point.classifications.flowCoupled).length,
    clampFreeCount: pointResults.filter((point) => point.classifications.clampFree).length,
    lvClampFreeCount: pointResults.filter((point) => (point.finalBeat?.lvClampCount ?? 999) === 0).length,
    laClampFreeCount: pointResults.filter((point) => (point.finalBeat?.laClampCount ?? 999) === 0).length,
    safetyWorkBoundedCount: pointResults.filter((point) => point.classifications.safetyWorkBounded).length,
    morphologyOkCount: pointResults.filter((point) => point.classifications.morphologyOk).length,
    cleanLowOutputReserveCount: pointResults.filter((point) => point.classifications.cleanLowOutputReserve).length,
    phenotypeAcceptedCount: pointResults.filter((point) => point.acceptedPhenotypeReasons.length > 0).length,
    highDriveArtifactCount: pointResults.filter((point) => point.classifications.highDriveArtifact).length,
    maxMvClosureDrive01: finiteMaxOrNull(pointResults.map((point) => point.finalBeat?.maxMvClosureDrive01 ?? Number.NaN)),
    maxRootOutflowHighPressureDrive01: finiteMaxOrNull(pointResults.map((point) => point.finalBeat?.maxRootOutflowHighPressureDrive01 ?? Number.NaN)),
    maxRootOutflowStatefulDrive01: finiteMaxOrNull(pointResults.map((point) => point.finalBeat?.maxRootOutflowStatefulDrive01 ?? Number.NaN)),
  };
}

function emptyPoint(
  pointId: string,
  finalBeat: BeatSummaryV1 | null,
  previousBeat: BeatSummaryV1 | null,
  dtHalfFinalBeat: BeatSummaryV1 | null,
): LeftHeartDynamicReservePointResultV1 {
  return {
    pointId,
    status: "inconclusive",
    finalBeat,
    previousBeat,
    dtHalfFinalBeat,
    repeatability: {
      aovEjectionDeltaMl: null,
      strokeVolumeDeltaMl: null,
      clampDelta: null,
      ok: false,
    },
    dtSensitivity: {
      aovEjectionDeltaMl: null,
      strokeVolumeDeltaMl: null,
      mvC1ContinuityDelta: null,
      outputParityOk: false,
      shapeParityOk: false,
      ok: false,
    },
    classifications: {
      lvPvOk: false,
      mvfOk: false,
      outputOk: false,
      flowCoupled: false,
      clampFree: false,
      safetyWorkBounded: false,
      morphologyOk: false,
      cleanLowOutputReserve: false,
      highDriveArtifact: true,
    },
    rawFailureReasons: ["too-few-beat-samples"],
    acceptedPhenotypeReasons: [],
    failureReasons: ["too-few-beat-samples"],
  };
}

function summarizeBeat(beat: number, samples: readonly LeftHeartSubsystemSampleV2[]): BeatSummaryV1 | null {
  if (samples.length < 16) return null;
  const lvp = samples.map((sample) => sample.lvpMmHg);
  const qMv = samples.map((sample) => sample.qMvMlPerSec);
  const volumes = samples.map((sample) => sample.lvVolumeMl);
  const lvpShape = computeShapeQualityMetricsV1(lvp);
  const qMvShape = computeShapeQualityMetricsV1(qMv);
  return {
    beat,
    strokeVolumeMl: finiteRangeOrNull(volumes),
    aovEjectedVolumeMl: flowIntegral(samples, (sample) => sample.qAovMlPerSec),
    mvForwardVolumeMl: flowIntegral(samples, (sample) => sample.qMvMlPerSec),
    lvpPeakMmHg: finiteMaxOrNull(lvp),
    lvpPositiveCurvatureBurden: round(lvpShape.positiveCurvatureBurden),
    lvpC1ContinuityScore: round(lvpShape.c1ContinuityScore),
    qMvPeakMlPerSec: finiteMaxOrNull(qMv),
    mvForwardPeakCount: positivePeakCount(qMv),
    mvC1ContinuityScore: round(qMvShape.c1ContinuityScore),
    lvpShape,
    qMvShape,
    clampCount: samples.reduce((sum, sample) => sum + sample.volumeClampHit01, 0),
    laClampCount: samples.reduce((sum, sample) => sum + sample.laVolumeClampHit01, 0),
    lvClampCount: samples.reduce((sum, sample) => sum + sample.lvVolumeClampHit01, 0),
    maxSafetyPressureMmHg: finiteMaxOrNull(samples.map((sample) => Math.max(
      Math.abs(sample.lvpSafetyMmHg),
      Math.abs(sample.lapSafetyMmHg),
    ))),
    maxMvClosureDrive01: finiteMaxOrNull(samples.map((sample) => sample.mv.closureDrive01)),
    mvClosureDriveDutyFraction: round(
      samples.filter((sample) => sample.mv.closureDrive01 > 0.05).length / Math.max(samples.length, 1),
    ),
    maxRootOutflowHighPressureDrive01: finiteMaxOrNull(samples.map((sample) => sample.rootOutflowHighPressureDrive01)),
    maxRootOutflowStatefulDrive01: finiteMaxOrNull(samples.map((sample) => sample.rootOutflowStatefulDrive01)),
    maxRootOutResistanceEffectiveMmHgSecPerMl: finiteMaxOrNull(samples.map((sample) => sample.rootOutResistanceEffectiveMmHgSecPerMl)),
  };
}

function classify(
  pointId: string,
  beat: BeatSummaryV1,
  repeatabilityOk: boolean,
  dtStable: boolean,
): LeftHeartDynamicReservePointResultV1["classifications"] {
  const strokeVolume = beat.strokeVolumeMl ?? 0;
  const aovEjected = beat.aovEjectedVolumeMl ?? 0;
  const lvPvOk =
    (beat.lvpPeakMmHg ?? 0) >= 70
    && (beat.lvpPeakMmHg ?? 999) <= 190
    && beat.lvpShape.dominantPeakCount <= 1
    && (beat.lvpShape.fwhmFractionOfWindow ?? 0) >= 0.08
    && beat.lvpShape.c1ContinuityScore <= 0.35
    && beat.lvpShape.positiveCurvatureBurden <= 0.22;
  const mvfOk = beat.mvForwardPeakCount === 2 && beat.mvC1ContinuityScore <= 0.38;
  const outputOk = strokeVolume >= 35 && strokeVolume <= 110 && aovEjected >= 35;
  const flowCoupled = Math.abs(strokeVolume - aovEjected) <= 20;
  const clampFree = beat.clampCount === 0;
  const safetyWorkBounded = (beat.maxSafetyPressureMmHg ?? 999) <= 3.5;
  const morphologyOk = lvPvOk && mvfOk && dtStable && flowCoupled && clampFree && safetyWorkBounded;
  const cleanLowOutputReserve =
    pointId === "left-heart-contractility-low"
    && morphologyOk
    && repeatabilityOk
    && !outputOk
    && aovEjected >= 8;
  const highDriveArtifact =
    pointId === "left-heart-contractility-high"
    && (!lvPvOk || !mvfOk || !flowCoupled || !clampFree || !safetyWorkBounded || !dtStable);
  return {
    lvPvOk,
    mvfOk,
    outputOk,
    flowCoupled,
    clampFree,
    safetyWorkBounded,
    morphologyOk,
    cleanLowOutputReserve,
    highDriveArtifact,
  };
}

function acceptedPhenotypeReasonsFor(
  classifications: LeftHeartDynamicReservePointResultV1["classifications"],
): readonly string[] {
  return classifications.cleanLowOutputReserve
    ? ["clean-low-contractility-low-output-phenotype"]
    : [];
}

function failureReasonsFor(
  classifications: LeftHeartDynamicReservePointResultV1["classifications"],
  beat: BeatSummaryV1,
  repeatabilityOk: boolean,
  dtOutputParityOk: boolean,
  dtShapeParityOk: boolean,
): readonly string[] {
  const failures: string[] = [];
  if (!classifications.lvPvOk) failures.push("lv-pv-shape-or-pressure");
  if (!classifications.mvfOk) failures.push("mvf-shape");
  if (!classifications.outputOk) {
    if ((beat.strokeVolumeMl ?? 0) < 35) failures.push("output-stroke-volume-too-low");
    if ((beat.aovEjectedVolumeMl ?? 0) < 35) failures.push("output-aov-ejected-volume-too-low");
    if ((beat.strokeVolumeMl ?? 999) > 110) failures.push("output-stroke-volume-too-high");
  }
  if (!repeatabilityOk) failures.push("beat-repeatability-failed");
  if (!dtOutputParityOk) failures.push("dt-half-output-parity-failed");
  if (!dtShapeParityOk) failures.push("dt-half-shape-parity-failed");
  if (!classifications.flowCoupled) failures.push("volume-stroke-aov-flow-decoupled");
  if (!classifications.clampFree) failures.push("volume-clamp-hit");
  if (!classifications.safetyWorkBounded) failures.push("safety-pressure-dominant");
  return failures;
}

function highDriveScore(point: LeftHeartDynamicReservePointResultV1 | undefined): number {
  if (point == null || point.finalBeat == null) return -999;
  return (
    (point.classifications.outputOk ? 100 : 0)
    + (point.classifications.lvPvOk ? 30 : 0)
    + (point.classifications.mvfOk ? 30 : 0)
    + (point.classifications.flowCoupled ? 20 : 0)
    + (point.classifications.clampFree ? 20 : 0)
    + (point.classifications.safetyWorkBounded ? 10 : 0)
    - point.finalBeat.mvC1ContinuityScore
    - Math.max(0, (point.finalBeat.lvpPeakMmHg ?? 999) - 190)
  );
}

function positivePeakCount(values: readonly number[]): number {
  const maxValue = Math.max(0, ...values);
  const threshold = Math.max(8, 0.12 * maxValue);
  const peaks: number[] = [];
  for (let i = 1; i < values.length - 1; i++) {
    const cur = values[i]!;
    if (cur > threshold && cur > values[i - 1]! && cur >= values[i + 1]!) peaks.push(i);
  }
  return mergeNearbyPeaks(peaks, 10).length;
}

function mergeNearbyPeaks(indices: readonly number[], minSeparation: number): readonly number[] {
  const out: number[] = [];
  for (const index of indices) {
    const last = out.at(-1);
    if (last == null || index - last > minSeparation) out.push(index);
    else if (index > last) out[out.length - 1] = index;
  }
  return out;
}

function flowIntegral(samples: readonly LeftHeartSubsystemSampleV2[], accessor: (sample: LeftHeartSubsystemSampleV2) => number): number | null {
  if (samples.length < 2) return null;
  let total = 0;
  for (let i = 1; i < samples.length; i++) {
    const dt = samples[i]!.tSec - samples[i - 1]!.tSec;
    total += Math.max(0, accessor(samples[i]!)) * Math.max(0, dt);
  }
  return round(total);
}

function requiredVariant(
  variants: readonly LeftHeartDynamicReserveVariantResultV1[],
  variantId: LeftHeartDynamicReserveVariantIdV1,
): LeftHeartDynamicReserveVariantResultV1 {
  const variant = variants.find((candidate) => candidate.variantId === variantId);
  if (variant == null) throw new Error(`Missing dynamic-reserve variant: ${variantId}`);
  return variant;
}

function finiteMaxOrNull(values: readonly number[]): number | null {
  const finite = values.filter(Number.isFinite);
  return finite.length > 0 ? round(Math.max(...finite)) : null;
}

function finiteRangeOrNull(values: readonly number[]): number | null {
  const finite = values.filter(Number.isFinite);
  return finite.length > 0 ? round(Math.max(...finite) - Math.min(...finite)) : null;
}

function round(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}
