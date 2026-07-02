import {
  DEFAULT_ATRIAL_FIBER_CHAMBER_PARAMS_V1,
  initialAtrialFiberChamberStateV1,
  stepAtrialFiberChamberV1,
  type AtrialFiberChamberOutputV1,
  type AtrialFiberChamberStateV1,
} from "@/engine/mechanics2/atrial/AtrialFiberPackV1";
import {
  buildLeftHeartDynamicReserveVariantEnvelopeV1,
} from "@/engine/mechanics2/benches/LeftHeartDynamicReserveContractBench";
import { computeShapeQualityMetricsV1 } from "@/engine/mechanics2/metrics/ShapeQualityMetricsV1";
import {
  runLeftHeartSubsystemV2,
  type LeftHeartSubsystemSampleV2,
} from "@/engine/mechanics2/subsystems/LeftHeartSubsystemV2";
import type { FourChamberSubsystemProfileIdV1 } from "@/engine/mechanics2/subsystems/FourChamberSubsystemV1";
import {
  DEFAULT_FLOW_STATE_VALVE_PARAMS_V1,
  initialFlowStateValveStateV1,
  stepFlowStateValveV1,
  type FlowStateValveOutputV1,
  type FlowStateValveStateV1,
} from "@/engine/mechanics2/valve/FlowStateValveV1";

export const ISOLATED_LA_AVP_MV_PV_RESIDUAL_REPORT_ID_V1 =
  "isolated-la-avp-mv-pv-residual-report-v1" as const;

export type IsolatedLaAvpMvPvResidualVariantIdV1 =
  | "no-avp-reference"
  | "explicit-reference-volume-drive4-cap28"
  | "residual-drive4-cap28-hyd002"
  | "residual-drive6-cap32-hyd003"
  | "residual-drive8-cap36-hyd004"
  | "residual-drive8-cap40-hyd006-slow"
  | "residual-lowstiff-drive6-cap36-hyd004"
  | "normal-form-r4-b1-release08-cap32"
  | "normal-form-r7-b1-release06-cap36"
  | "normal-form-r10-b2-release045-cap40";

type VariantModeV1 =
  | "no-avp"
  | "explicit-reference-volume"
  | "la-avp-mv-pv-residual"
  | "normal-form-reservoir-booster";

export type IsolatedLaAvpMvPvResidualVariantV1 = {
  readonly variantId: IsolatedLaAvpMvPvResidualVariantIdV1;
  readonly mode: VariantModeV1;
  readonly capacityGainMl: number;
  readonly driveForceN: number;
  readonly hydraulicGain: number;
  readonly stiffnessNPerNorm: number;
  readonly dampingNsecPerNorm: number;
  readonly maxVelocityNormPerSec: number;
  readonly pvResistanceMmHgSecPerMl: number;
  readonly pvSourceResistanceMmHgSecPerMl: number;
  readonly pvComplianceMlPerMmHg: number;
  readonly residualIterations: number;
  readonly residualRelaxation: number;
  readonly reservoirPressureGainMmHg: number;
  readonly reservoirReleaseTauSec: number;
  readonly boosterPressureGainMmHg: number;
  readonly boosterTauSec: number;
};

export type IsolatedLaAvpMvPvResidualSampleV1 = {
  readonly tSec: number;
  readonly theta: number;
  readonly laBloodVolumeMl: number;
  readonly laEffectiveVolumeMl: number;
  readonly lapMmHg: number;
  readonly lvpMmHg: number;
  readonly pvPressureMmHg: number;
  readonly qPvMlPerSec: number;
  readonly qMvMlPerSec: number;
  readonly mvOpen01: number;
  readonly zAvNorm: number;
  readonly zAvDotNormPerSec: number;
  readonly driveForceN: number;
  readonly hydraulicForceN: number;
  readonly netForceN: number;
  readonly reservoirState01: number;
  readonly boosterState01: number;
  readonly normalFormPressureMmHg: number;
  readonly sPrimeProxyCmPerSec: number | null;
  readonly ePrimeProxyCmPerSec: number | null;
  readonly aPrimeProxyCmPerSec: number | null;
  readonly massResidualMl: number;
  readonly residualNorm: number;
  readonly laFiber: AtrialFiberChamberOutputV1;
  readonly mv: FlowStateValveOutputV1;
};

type VariantV1 = IsolatedLaAvpMvPvResidualVariantV1;
type SampleV1 = IsolatedLaAvpMvPvResidualSampleV1;

type FigureEightQualityV1 = {
  readonly pass: boolean;
  readonly selfIntersections: number;
  readonly opposedSignedLobes: boolean;
  readonly aLoopArea: number;
  readonly vLoopArea: number;
  readonly volumeSeparationMl: number;
  readonly postOpeningPressureDropMmHg: number;
  readonly postOpeningVolumeDropMl: number;
  readonly conduitBelowReservoirChordFraction: number;
  readonly meanConduitBelowReservoirChordMmHg: number;
  readonly maxPvTangentAngleJumpDeg: number;
  readonly mvOpeningTangentAngleJumpDeg: number;
  readonly lowerVLoopTangentAngleJumpDeg: number;
  readonly failureReasons: readonly string[];
};

type PrimeQualityV1 = {
  readonly pass: boolean;
  readonly sPrimePeakAbsCmPerSec: number;
  readonly ePrimePeakAbsCmPerSec: number;
  readonly aPrimePeakAbsCmPerSec: number;
  readonly maxC1ContinuityScore: number;
  readonly failureReasons: readonly string[];
};

type RowV1 = {
  readonly profileId: FourChamberSubsystemProfileIdV1;
  readonly variantId: IsolatedLaAvpMvPvResidualVariantIdV1;
  readonly figureEightPass: boolean;
  readonly mvfClean: boolean;
  readonly primePass: boolean;
  readonly hiddenVolumeClean: boolean;
  readonly sourceBoundaryClean: boolean;
  readonly sourcePreservingFigureEight: boolean;
  readonly mvForwardPeakCount: number;
  readonly mvC1ContinuityScore: number;
  readonly mvForwardVolumeMl: number;
  readonly baselineMvForwardVolumeMl: number;
  readonly maxMassResidualAbsMl: number;
  readonly maxResidualNorm: number;
  readonly maxZNorm: number;
  readonly maxZDotNormPerSec: number;
  readonly maxHydraulicForceN: number;
  readonly maxNetForceN: number;
  readonly maxPvPressureMmHg: number;
  readonly figureEight: FigureEightQualityV1;
  readonly prime: PrimeQualityV1;
  readonly failureReasons: readonly string[];
};

type VariantSummaryV1 = {
  readonly variantId: IsolatedLaAvpMvPvResidualVariantIdV1;
  readonly figureEightPass: number;
  readonly mvfClean: number;
  readonly primePass: number;
  readonly sourceBoundaryClean: number;
  readonly sourcePreservingFigureEight: number;
  readonly hiddenVolumeClean: number;
  readonly maxVLoopArea: number;
  readonly maxPostOpeningPressureDropMmHg: number;
  readonly maxPvTangentAngleJumpDeg: number;
  readonly maxPrimeC1ContinuityScore: number;
  readonly maxResidualNorm: number;
  readonly maxZNorm: number;
};

export type IsolatedLaAvpMvPvResidualReportV1 = {
  readonly reportId: typeof ISOLATED_LA_AVP_MV_PV_RESIDUAL_REPORT_ID_V1;
  readonly gateId: "isolatedLaAvpMvPvResidualV1";
  readonly mode: "isolated-left-atrium-avplane-mv-pv-residual-no-runtime";
  readonly variants: readonly VariantV1[];
  readonly rows: readonly RowV1[];
  readonly variantSummaries: readonly VariantSummaryV1[];
  readonly bestResidualVariant: VariantSummaryV1;
  readonly summary: {
    readonly totalProfiles: 7;
    readonly bestResidualVariantId: IsolatedLaAvpMvPvResidualVariantIdV1;
    readonly bestResidualFigureEightPass: number;
    readonly bestResidualSourcePreservingFigureEight: number;
    readonly bestResidualMvfClean: number;
    readonly bestResidualPrimePass: number;
    readonly variantsWithAnySourcePreservingFigureEight: number;
    readonly variantsWithCleanHiddenVolume: number;
    readonly reviewStatus: "la-avp-residual-positive-signal" | "la-avp-residual-mixed" | "la-avp-residual-no-go";
  };
  readonly decision: {
    readonly nextAction: string;
    readonly blockedClaims: readonly string[];
  };
  readonly claimBoundary: {
    readonly runtimeWiring: false;
    readonly morphologyAcceptance: false;
    readonly AVPlaneEnablement: false;
    readonly pressureSubstitution: false;
    readonly LandAtrialUnlock: false;
  };
};

export type IsolatedLaAvpMvPvResidualTrajectoryPanelV1 = {
  readonly profileId: FourChamberSubsystemProfileIdV1;
  readonly baseline: readonly IsolatedLaAvpMvPvResidualSampleV1[];
  readonly explicitReference: readonly IsolatedLaAvpMvPvResidualSampleV1[];
  readonly bestResidual: readonly IsolatedLaAvpMvPvResidualSampleV1[];
  readonly bestResidualVariantId: IsolatedLaAvpMvPvResidualVariantIdV1;
};

const LEFT_VARIANT_ID = "active-length-mv-closure-stateful-root08" as const;
const PRE_A_THETA = 0.74;

const PROFILE_IDS: readonly FourChamberSubsystemProfileIdV1[] = [
  "normal-hr75",
  "normal-hr90",
  "preload-low",
  "preload-high",
  "afterload-high",
  "contractility-low",
  "contractility-high",
];

export const ISOLATED_LA_AVP_MV_PV_RESIDUAL_VARIANTS_V1: readonly VariantV1[] = [
  variant("no-avp-reference", "no-avp", 0, 0, 0, 0.8, 0.35, 1.2, 0.060, 0.14, 16, 1, 1),
  variant("explicit-reference-volume-drive4-cap28", "explicit-reference-volume", 28, 4, 0.002, 1.2, 0.45, 0.7, 0.060, 0.14, 16, 1, 1),
  variant("residual-drive4-cap28-hyd002", "la-avp-mv-pv-residual", 28, 4, 0.002, 1.2, 0.45, 0.7, 0.060, 0.14, 16, 5, 0.55),
  variant("residual-drive6-cap32-hyd003", "la-avp-mv-pv-residual", 32, 6, 0.003, 1.5, 0.55, 0.8, 0.055, 0.13, 18, 5, 0.55),
  variant("residual-drive8-cap36-hyd004", "la-avp-mv-pv-residual", 36, 8, 0.004, 2.0, 0.70, 0.8, 0.050, 0.12, 20, 6, 0.50),
  variant("residual-drive8-cap40-hyd006-slow", "la-avp-mv-pv-residual", 40, 8, 0.006, 2.4, 0.95, 0.6, 0.050, 0.12, 22, 6, 0.45),
  variant("residual-lowstiff-drive6-cap36-hyd004", "la-avp-mv-pv-residual", 36, 6, 0.004, 0.7, 0.35, 0.8, 0.055, 0.13, 20, 6, 0.50),
  variant("normal-form-r4-b1-release08-cap32", "normal-form-reservoir-booster", 32, 6, 0.003, 1.5, 0.50, 0.8, 0.050, 0.12, 20, 6, 0.50, 4, 0.08, 1, 0.05),
  variant("normal-form-r7-b1-release06-cap36", "normal-form-reservoir-booster", 36, 7, 0.004, 1.8, 0.60, 0.8, 0.050, 0.12, 20, 6, 0.50, 7, 0.06, 1, 0.045),
  variant("normal-form-r10-b2-release045-cap40", "normal-form-reservoir-booster", 40, 8, 0.005, 2.2, 0.70, 0.75, 0.050, 0.12, 22, 6, 0.48, 10, 0.045, 2, 0.04),
];

export function runIsolatedLaAvpMvPvResidualBenchV1(): IsolatedLaAvpMvPvResidualReportV1 {
  const leftParams = buildLeftHeartDynamicReserveVariantEnvelopeV1(LEFT_VARIANT_ID);
  const boundaries = leftParams.map((params) => runLeftHeartSubsystemV2(params));
  const baselineRows = PROFILE_IDS.map((profileId, index) => {
    const boundary = boundaries[index]!;
    const run = runIsolatedResidual(boundary.finalBeatSamples, boundary.params.heartRateBpm, boundary.params.sampleRateHz, ISOLATED_LA_AVP_MV_PV_RESIDUAL_VARIANTS_V1[0]!);
    return rowForRun(profileId, ISOLATED_LA_AVP_MV_PV_RESIDUAL_VARIANTS_V1[0]!, run, run);
  });
  const rows = PROFILE_IDS.flatMap((profileId, index) => {
    const boundary = boundaries[index]!;
    const baselineRow = baselineRows[index]!;
    const baselineRun = runIsolatedResidual(boundary.finalBeatSamples, boundary.params.heartRateBpm, boundary.params.sampleRateHz, ISOLATED_LA_AVP_MV_PV_RESIDUAL_VARIANTS_V1[0]!);
    return ISOLATED_LA_AVP_MV_PV_RESIDUAL_VARIANTS_V1.map((variantConfig) => {
      const run = variantConfig.variantId === "no-avp-reference"
        ? baselineRun
        : runIsolatedResidual(boundary.finalBeatSamples, boundary.params.heartRateBpm, boundary.params.sampleRateHz, variantConfig);
      return rowForRun(profileId, variantConfig, run, baselineRun, baselineRow);
    });
  });
  const variantSummaries = ISOLATED_LA_AVP_MV_PV_RESIDUAL_VARIANTS_V1.map((variantConfig) =>
    summarizeVariant(variantConfig.variantId, rows.filter((row) => row.variantId === variantConfig.variantId))
  );
  const residualSummaries = variantSummaries.filter((summary) =>
    summary.variantId.startsWith("residual-") || summary.variantId.startsWith("normal-form-")
  );
  const bestResidualVariant = [...residualSummaries].sort((a, b) =>
    b.sourcePreservingFigureEight - a.sourcePreservingFigureEight
    || b.figureEightPass - a.figureEightPass
    || b.mvfClean - a.mvfClean
    || b.primePass - a.primePass
    || b.maxVLoopArea - a.maxVLoopArea
  )[0]!;
  const variantsWithAnySourcePreservingFigureEight = residualSummaries
    .filter((summary) => summary.sourcePreservingFigureEight > 0).length;
  const variantsWithCleanHiddenVolume = variantSummaries.filter((summary) => summary.hiddenVolumeClean === 7).length;
  const reviewStatus = bestResidualVariant.sourcePreservingFigureEight >= 3
    ? "la-avp-residual-positive-signal"
    : bestResidualVariant.figureEightPass > 0 || bestResidualVariant.mvfClean > 0
      ? "la-avp-residual-mixed"
      : "la-avp-residual-no-go";
  return {
    reportId: ISOLATED_LA_AVP_MV_PV_RESIDUAL_REPORT_ID_V1,
    gateId: "isolatedLaAvpMvPvResidualV1",
    mode: "isolated-left-atrium-avplane-mv-pv-residual-no-runtime",
    variants: ISOLATED_LA_AVP_MV_PV_RESIDUAL_VARIANTS_V1,
    rows,
    variantSummaries,
    bestResidualVariant,
    summary: {
      totalProfiles: 7,
      bestResidualVariantId: bestResidualVariant.variantId,
      bestResidualFigureEightPass: bestResidualVariant.figureEightPass,
      bestResidualSourcePreservingFigureEight: bestResidualVariant.sourcePreservingFigureEight,
      bestResidualMvfClean: bestResidualVariant.mvfClean,
      bestResidualPrimePass: bestResidualVariant.primePass,
      variantsWithAnySourcePreservingFigureEight,
      variantsWithCleanHiddenVolume,
      reviewStatus,
    },
    decision: {
      nextAction: reviewStatus === "la-avp-residual-positive-signal"
        ? "Promote the isolated LA-AV-plane residual into a full left-heart source-surface smoke while preserving the phase-oriented blood-volume PV gate."
        : "The isolated residual is not enough as configured. Keep runtime AV-plane blocked and move the next architecture step to a stronger implicit residual or normal-form reservoir/booster split, not scalar pressure or coordinate sweeps.",
      blockedClaims: [
        "runtime-wiring",
        "morphology-acceptance",
        "AV-plane-enable",
        "pressure-substitution",
        "LandAtrial-unlock",
      ],
    },
    claimBoundary: {
      runtimeWiring: false,
      morphologyAcceptance: false,
      AVPlaneEnablement: false,
      pressureSubstitution: false,
      LandAtrialUnlock: false,
    },
  };
}

export function runIsolatedLaAvpMvPvResidualTrajectoryPanelsV1(
  bestResidualVariantId?: IsolatedLaAvpMvPvResidualVariantIdV1,
): readonly IsolatedLaAvpMvPvResidualTrajectoryPanelV1[] {
  const report = runIsolatedLaAvpMvPvResidualBenchV1();
  const selectedResidualId = bestResidualVariantId ?? report.summary.bestResidualVariantId;
  const leftParams = buildLeftHeartDynamicReserveVariantEnvelopeV1(LEFT_VARIANT_ID);
  const baseline = getVariant("no-avp-reference");
  const explicitReference = getVariant("explicit-reference-volume-drive4-cap28");
  const bestResidual = getVariant(selectedResidualId);
  return PROFILE_IDS.map((profileId, index) => {
    const boundary = runLeftHeartSubsystemV2(leftParams[index]!);
    return {
      profileId,
      baseline: runIsolatedResidual(boundary.finalBeatSamples, boundary.params.heartRateBpm, boundary.params.sampleRateHz, baseline),
      explicitReference: runIsolatedResidual(boundary.finalBeatSamples, boundary.params.heartRateBpm, boundary.params.sampleRateHz, explicitReference),
      bestResidual: runIsolatedResidual(boundary.finalBeatSamples, boundary.params.heartRateBpm, boundary.params.sampleRateHz, bestResidual),
      bestResidualVariantId: selectedResidualId,
    };
  });
}

function getVariant(variantId: IsolatedLaAvpMvPvResidualVariantIdV1): VariantV1 {
  const variantConfig = ISOLATED_LA_AVP_MV_PV_RESIDUAL_VARIANTS_V1.find((candidate) =>
    candidate.variantId === variantId
  );
  if (variantConfig == null) throw new Error(`Unknown isolated LA-AVP residual variant: ${variantId}`);
  return variantConfig;
}

function runIsolatedResidual(
  boundary: readonly LeftHeartSubsystemSampleV2[],
  heartRateBpm: number,
  sampleRateHz: number,
  variantConfig: VariantV1,
): readonly SampleV1[] {
  const cycleLengthSec = 60 / heartRateBpm;
  const dtSec = 1 / sampleRateHz;
  const beats = 9;
  const samplesPerBeat = boundary.length;
  let state = initialState(boundary, variantConfig);
  const out: SampleV1[] = [];
  for (let beat = 0; beat < beats; beat++) {
    for (let i = 0; i < samplesPerBeat; i++) {
      const boundarySample = boundary[i]!;
      const tSec = beat * cycleLengthSec + boundarySample.theta * cycleLengthSec;
      const next = stepResidualState(state, {
        tSec,
        theta: boundarySample.theta,
        dtSec,
        cycleLengthSec,
        lvpMmHg: boundarySample.lvpMmHg,
        variantConfig,
      });
      state = next.state;
      if (beat === beats - 2) out.push(next.sample);
    }
  }
  return out;
}

function initialState(boundary: readonly LeftHeartSubsystemSampleV2[], variantConfig: VariantV1): ResidualStateV1 {
  const first = boundary[0]!;
  const laVolumeMl = clamp(first.acceptedLaVolumeMl, 28, 92);
  return {
    laBloodVolumeMl: laVolumeMl,
    pvPressureMmHg: Math.max(8, first.lapMmHg + 1.5),
    mv: initialFlowStateValveStateV1(0, first.mvOpen01),
    laFiber: initialAtrialFiberChamberStateV1(laVolumeMl, DEFAULT_ATRIAL_FIBER_CHAMBER_PARAMS_V1.LA),
    zAvNorm: variantConfig.mode === "no-avp" ? 0 : 0.12,
    zAvDotNormPerSec: 0,
    reservoirState01: 0,
    boosterState01: 0,
  };
}

type ResidualStateV1 = {
  readonly laBloodVolumeMl: number;
  readonly pvPressureMmHg: number;
  readonly mv: FlowStateValveStateV1;
  readonly laFiber: AtrialFiberChamberStateV1;
  readonly zAvNorm: number;
  readonly zAvDotNormPerSec: number;
  readonly reservoirState01: number;
  readonly boosterState01: number;
};

function stepResidualState(
  previous: ResidualStateV1,
  input: {
    readonly tSec: number;
    readonly theta: number;
    readonly dtSec: number;
    readonly cycleLengthSec: number;
    readonly lvpMmHg: number;
    readonly variantConfig: VariantV1;
  },
): { readonly state: ResidualStateV1; readonly sample: SampleV1 } {
  let guessVolume = previous.laBloodVolumeMl;
  let guessPvPressure = previous.pvPressureMmHg;
  let guessZ = previous.zAvNorm;
  let guessZDot = previous.zAvDotNormPerSec;
  let accepted = evaluateAccepted(previous, input, guessVolume, guessPvPressure, guessZ, guessZDot);
  const iterations = Math.max(1, input.variantConfig.residualIterations);
  for (let iteration = 0; iteration < iterations; iteration++) {
    accepted = evaluateAccepted(previous, input, guessVolume, guessPvPressure, guessZ, guessZDot);
    const relax = input.variantConfig.mode === "la-avp-mv-pv-residual"
      ? input.variantConfig.residualRelaxation
      : 1;
    guessVolume = lerp(guessVolume, accepted.nextVolumeMl, relax);
    guessPvPressure = lerp(guessPvPressure, accepted.nextPvPressureMmHg, relax);
    guessZ = lerp(guessZ, accepted.nextZNorm, relax);
    guessZDot = lerp(guessZDot, accepted.nextZDotNormPerSec, relax);
  }
  accepted = evaluateAccepted(previous, input, guessVolume, guessPvPressure, guessZ, guessZDot);
  const massResidualMl = accepted.nextVolumeMl - previous.laBloodVolumeMl
    - input.dtSec * (accepted.qPvMlPerSec - accepted.mv.qMlPerSec);
  const residualNorm = Math.max(
    Math.abs(accepted.nextVolumeMl - guessVolume),
    Math.abs(accepted.nextPvPressureMmHg - guessPvPressure),
    Math.abs(accepted.nextZNorm - guessZ) * 10,
  );
  const state: ResidualStateV1 = {
    laBloodVolumeMl: accepted.nextVolumeMl,
    pvPressureMmHg: accepted.nextPvPressureMmHg,
    mv: accepted.mv.state,
    laFiber: accepted.laFiber.state,
    zAvNorm: accepted.nextZNorm,
    zAvDotNormPerSec: accepted.nextZDotNormPerSec,
    reservoirState01: accepted.nextReservoirState01,
    boosterState01: accepted.nextBoosterState01,
  };
  const sample: SampleV1 = {
    tSec: input.tSec,
    theta: input.theta,
    laBloodVolumeMl: accepted.nextVolumeMl,
    laEffectiveVolumeMl: accepted.effectiveVolumeMl,
    lapMmHg: accepted.lapMmHg,
    lvpMmHg: input.lvpMmHg,
    pvPressureMmHg: accepted.nextPvPressureMmHg,
    qPvMlPerSec: accepted.qPvMlPerSec,
    qMvMlPerSec: accepted.mv.qMlPerSec,
    mvOpen01: accepted.mv.open01,
    zAvNorm: accepted.nextZNorm,
    zAvDotNormPerSec: accepted.nextZDotNormPerSec,
    driveForceN: accepted.driveForceN,
    hydraulicForceN: accepted.hydraulicForceN,
    netForceN: accepted.netForceN,
    reservoirState01: accepted.nextReservoirState01,
    boosterState01: accepted.nextBoosterState01,
    normalFormPressureMmHg: accepted.normalFormPressureMmHg,
    sPrimeProxyCmPerSec: primeProxy(input.theta, accepted.nextZDotNormPerSec, "s"),
    ePrimeProxyCmPerSec: primeProxy(input.theta, accepted.nextZDotNormPerSec, "e"),
    aPrimeProxyCmPerSec: primeProxy(input.theta, accepted.nextZDotNormPerSec, "a"),
    massResidualMl,
    residualNorm,
    laFiber: accepted.laFiber,
    mv: accepted.mv,
  };
  return { state, sample };
}

function evaluateAccepted(
  previous: ResidualStateV1,
  input: {
    readonly tSec: number;
    readonly theta: number;
    readonly dtSec: number;
    readonly cycleLengthSec: number;
    readonly lvpMmHg: number;
    readonly variantConfig: VariantV1;
  },
  guessVolumeMl: number,
  guessPvPressureMmHg: number,
  guessZNorm: number,
  guessZDotNormPerSec: number,
): {
  readonly nextVolumeMl: number;
  readonly nextPvPressureMmHg: number;
  readonly nextZNorm: number;
  readonly nextZDotNormPerSec: number;
  readonly effectiveVolumeMl: number;
  readonly lapMmHg: number;
  readonly qPvMlPerSec: number;
  readonly mv: FlowStateValveOutputV1;
  readonly laFiber: AtrialFiberChamberOutputV1;
  readonly driveForceN: number;
  readonly hydraulicForceN: number;
  readonly netForceN: number;
  readonly nextReservoirState01: number;
  readonly nextBoosterState01: number;
  readonly normalFormPressureMmHg: number;
} {
  const avp = nextAvPlaneCoordinate(previous, input, guessZNorm, guessZDotNormPerSec, 0);
  const normalForm = nextNormalFormStates(previous, input, avp.zNorm);
  const geometryDeltaMl = input.variantConfig.mode === "no-avp" ? 0 : input.variantConfig.capacityGainMl * avp.zNorm;
  const effectiveVolumeMl = Math.max(1e-6, guessVolumeMl - geometryDeltaMl);
  const previousEffectiveVolumeMl =
    Math.max(1e-6, previous.laBloodVolumeMl - input.variantConfig.capacityGainMl * previous.zAvNorm);
  const laFiber = stepAtrialFiberChamberV1(previous.laFiber, {
    tSec: input.tSec,
    dtSec: input.dtSec,
    cycleLengthSec: input.cycleLengthSec,
    activationTimeSec: input.tSec - input.theta * input.cycleLengthSec + positiveModulo(0.84 - 0.10, 1) * input.cycleLengthSec,
    cavityVolumeMl: effectiveVolumeMl,
    previousCavityVolumeMl: previousEffectiveVolumeMl,
  }, DEFAULT_ATRIAL_FIBER_CHAMBER_PARAMS_V1.LA);
  const lapMmHg = Math.max(0, laFiber.pressureRawMmHg + normalForm.pressureMmHg);
  const avpWithPressure = input.variantConfig.mode === "la-avp-mv-pv-residual"
    || input.variantConfig.mode === "normal-form-reservoir-booster"
    ? nextAvPlaneCoordinate(previous, input, guessZNorm, guessZDotNormPerSec, lapMmHg)
    : avp;
  const acceptedNormalForm = nextNormalFormStates(previous, input, avpWithPressure.zNorm);
  const acceptedGeometryDeltaMl =
    input.variantConfig.mode === "no-avp" ? 0 : input.variantConfig.capacityGainMl * avpWithPressure.zNorm;
  const acceptedEffectiveVolumeMl = Math.max(1e-6, guessVolumeMl - acceptedGeometryDeltaMl);
  const acceptedLaFiber = acceptedEffectiveVolumeMl === effectiveVolumeMl
    ? laFiber
    : stepAtrialFiberChamberV1(previous.laFiber, {
      tSec: input.tSec,
      dtSec: input.dtSec,
      cycleLengthSec: input.cycleLengthSec,
      activationTimeSec: input.tSec - input.theta * input.cycleLengthSec + positiveModulo(0.84 - 0.10, 1) * input.cycleLengthSec,
      cavityVolumeMl: acceptedEffectiveVolumeMl,
      previousCavityVolumeMl: previousEffectiveVolumeMl,
    }, DEFAULT_ATRIAL_FIBER_CHAMBER_PARAMS_V1.LA);
  const acceptedLapMmHg = Math.max(0, acceptedLaFiber.pressureRawMmHg + acceptedNormalForm.pressureMmHg);
  const qPvSourceMlPerSec = Math.max(
    0,
    (13 - guessPvPressureMmHg) / Math.max(input.variantConfig.pvSourceResistanceMmHgSecPerMl, 1e-9),
  );
  const qPvMlPerSec = Math.max(
    0,
    (guessPvPressureMmHg - acceptedLapMmHg) / Math.max(input.variantConfig.pvResistanceMmHgSecPerMl, 1e-9),
  );
  const mv = stepFlowStateValveV1(previous.mv, {
    dtSec: input.dtSec,
    upstreamPressureMmHg: acceptedLapMmHg,
    downstreamPressureMmHg: input.lvpMmHg,
  }, {
    ...DEFAULT_FLOW_STATE_VALVE_PARAMS_V1.MV,
    inertanceMmHgSec2PerMl: 0.00065,
    tauOpenSec: 0.026,
    tauCloseSec: 0.020,
    maxOpenStepPerStep: 0.16,
  });
  const nextVolumeMl = Math.max(
    1e-6,
    previous.laBloodVolumeMl + input.dtSec * (qPvMlPerSec - mv.qMlPerSec),
  );
  const nextPvPressureMmHg = Math.max(
    0,
    previous.pvPressureMmHg
      + input.dtSec * (qPvSourceMlPerSec - qPvMlPerSec) / Math.max(input.variantConfig.pvComplianceMlPerMmHg, 1e-9),
  );
  return {
    nextVolumeMl,
    nextPvPressureMmHg,
    nextZNorm: avpWithPressure.zNorm,
    nextZDotNormPerSec: avpWithPressure.zDotNormPerSec,
    effectiveVolumeMl: acceptedEffectiveVolumeMl,
    lapMmHg: acceptedLapMmHg,
    qPvMlPerSec,
    mv,
    laFiber: acceptedLaFiber,
    driveForceN: avpWithPressure.driveForceN,
    hydraulicForceN: avpWithPressure.hydraulicForceN,
    netForceN: avpWithPressure.netForceN,
    nextReservoirState01: acceptedNormalForm.reservoirState01,
    nextBoosterState01: acceptedNormalForm.boosterState01,
    normalFormPressureMmHg: acceptedNormalForm.pressureMmHg,
  };
}

function nextNormalFormStates(
  previous: ResidualStateV1,
  input: {
    readonly theta: number;
    readonly dtSec: number;
    readonly variantConfig: VariantV1;
  },
  zNorm: number,
): {
  readonly reservoirState01: number;
  readonly boosterState01: number;
  readonly pressureMmHg: number;
} {
  if (input.variantConfig.mode !== "normal-form-reservoir-booster") {
    return { reservoirState01: 0, boosterState01: 0, pressureMmHg: 0 };
  }
  const mvOpenRelease01 = previous.mv.open01 > 0.20 ? 1 : raisedCosineWindow(input.theta, 0.54, 0.76);
  const systolicReservoirTarget = clamp(zNorm * raisedCosineWindow(input.theta, 0.04, 0.56) * 1.18, 0, 1);
  const reservoirTarget = mvOpenRelease01 > 0 ? 0 : systolicReservoirTarget;
  const reservoirTau = reservoirTarget < previous.reservoirState01
    ? input.variantConfig.reservoirReleaseTauSec
    : 0.12;
  const reservoirState01 = relaxToward(previous.reservoirState01, reservoirTarget, input.dtSec, reservoirTau);
  const boosterTarget = raisedCosineWindow(input.theta, 0.82, 0.99);
  const boosterState01 = relaxToward(previous.boosterState01, boosterTarget, input.dtSec, input.variantConfig.boosterTauSec);
  const pressureMmHg =
    input.variantConfig.reservoirPressureGainMmHg * reservoirState01
    + input.variantConfig.boosterPressureGainMmHg * boosterState01;
  return { reservoirState01, boosterState01, pressureMmHg };
}

function nextAvPlaneCoordinate(
  previous: ResidualStateV1,
  input: {
    readonly theta: number;
    readonly dtSec: number;
    readonly lvpMmHg: number;
    readonly variantConfig: VariantV1;
  },
  _guessZNorm: number,
  _guessZDotNormPerSec: number,
  lapMmHg: number,
): {
  readonly zNorm: number;
  readonly zDotNormPerSec: number;
  readonly driveForceN: number;
  readonly hydraulicForceN: number;
  readonly netForceN: number;
} {
  if (input.variantConfig.mode === "no-avp") {
    return { zNorm: 0, zDotNormPerSec: 0, driveForceN: 0, hydraulicForceN: 0, netForceN: 0 };
  }
  const systolicDrive01 = raisedCosineWindow(input.theta, 0.04, 0.52)
    * smoothstep01((input.lvpMmHg - 18) / 58);
  const atrialKickRelease01 = raisedCosineWindow(input.theta, 0.82, 0.98);
  const targetNorm = clamp(0.08 + 0.72 * systolicDrive01 - 0.16 * atrialKickRelease01, 0, 1);
  const targetForceN = input.variantConfig.driveForceN * (targetNorm - previous.zAvNorm);
  const areaM2 = 7.8e-4;
  const hydraulicForceN =
    input.variantConfig.mode === "la-avp-mv-pv-residual"
      ? Math.max(0, input.lvpMmHg - lapMmHg) * 133.322368 * areaM2 * input.variantConfig.hydraulicGain
      : 0;
  const springForceN = input.variantConfig.stiffnessNPerNorm * previous.zAvNorm;
  const dampingForceN = input.variantConfig.dampingNsecPerNorm * previous.zAvDotNormPerSec;
  const netForceN = targetForceN - hydraulicForceN - springForceN - dampingForceN;
  const massKg = 0.030;
  const zDot = clamp(
    previous.zAvDotNormPerSec + netForceN / massKg * input.dtSec,
    -input.variantConfig.maxVelocityNormPerSec,
    input.variantConfig.maxVelocityNormPerSec,
  );
  let z = clamp(previous.zAvNorm + zDot * input.dtSec, 0, 1);
  let zDotAccepted = zDot;
  if ((z <= 0 && zDotAccepted < 0) || (z >= 1 && zDotAccepted > 0)) zDotAccepted = 0;
  z = clamp(previous.zAvNorm + zDotAccepted * input.dtSec, 0, 1);
  return { zNorm: z, zDotNormPerSec: zDotAccepted, driveForceN: targetForceN, hydraulicForceN, netForceN };
}

function rowForRun(
  profileId: FourChamberSubsystemProfileIdV1,
  variantConfig: VariantV1,
  run: readonly SampleV1[],
  baselineRun: readonly SampleV1[],
  _baselineRow?: RowV1,
): RowV1 {
  const dtSec = run.length > 1 ? run[1]!.tSec - run[0]!.tSec : 1 / 240;
  const qMv = run.map((sample) => sample.qMvMlPerSec);
  const mvShape = computeShapeQualityMetricsV1(qMv);
  const mvForwardPeakCount = positivePeakCount(qMv);
  const mvForwardVolumeMl = forwardFlowVolume(qMv, dtSec);
  const baselineMvForwardVolumeMl = forwardFlowVolume(baselineRun.map((sample) => sample.qMvMlPerSec), dtSec);
  const figureEight = figureEightQualityFor(run);
  const prime = primeQualityFor(run);
  const maxMassResidualAbsMl = round(maxAbs(run.map((sample) => sample.massResidualMl)));
  const maxResidualNorm = round(maxAbs(run.map((sample) => sample.residualNorm)));
  const mvC1ContinuityScore = round(mvShape.c1ContinuityScore);
  const mvfClean = mvForwardPeakCount === 2 && mvC1ContinuityScore <= 0.48;
  const sourceBoundaryClean = maxResidualNorm <= 2.4 && mvForwardVolumeMl >= 0.62 * Math.max(baselineMvForwardVolumeMl, 1e-9);
  const hiddenVolumeClean = maxMassResidualAbsMl <= 0.000001;
  const failureReasons: string[] = [];
  if (!figureEight.pass) failureReasons.push("phase-oriented-figure-eight-fail");
  if (!mvfClean) failureReasons.push("mvf-not-clean");
  if (!prime.pass) failureReasons.push("prime-waveform-fail");
  if (!hiddenVolumeClean) failureReasons.push("mass-ledger-residual");
  if (!sourceBoundaryClean) failureReasons.push("source-boundary-not-clean");
  return {
    profileId,
    variantId: variantConfig.variantId,
    figureEightPass: figureEight.pass,
    mvfClean,
    primePass: prime.pass,
    hiddenVolumeClean,
    sourceBoundaryClean,
    sourcePreservingFigureEight: figureEight.pass && sourceBoundaryClean && mvfClean && hiddenVolumeClean,
    mvForwardPeakCount,
    mvC1ContinuityScore,
    mvForwardVolumeMl: round(mvForwardVolumeMl),
    baselineMvForwardVolumeMl: round(baselineMvForwardVolumeMl),
    maxMassResidualAbsMl,
    maxResidualNorm,
    maxZNorm: round(Math.max(0, ...run.map((sample) => sample.zAvNorm))),
    maxZDotNormPerSec: round(maxAbs(run.map((sample) => sample.zAvDotNormPerSec))),
    maxHydraulicForceN: round(Math.max(0, ...run.map((sample) => sample.hydraulicForceN))),
    maxNetForceN: round(maxAbs(run.map((sample) => sample.netForceN))),
    maxPvPressureMmHg: round(Math.max(0, ...run.map((sample) => sample.pvPressureMmHg))),
    figureEight,
    prime,
    failureReasons,
  };
}

function summarizeVariant(
  variantId: IsolatedLaAvpMvPvResidualVariantIdV1,
  rows: readonly RowV1[],
): VariantSummaryV1 {
  return {
    variantId,
    figureEightPass: rows.filter((row) => row.figureEightPass).length,
    mvfClean: rows.filter((row) => row.mvfClean).length,
    primePass: rows.filter((row) => row.primePass).length,
    sourceBoundaryClean: rows.filter((row) => row.sourceBoundaryClean).length,
    sourcePreservingFigureEight: rows.filter((row) => row.sourcePreservingFigureEight).length,
    hiddenVolumeClean: rows.filter((row) => row.hiddenVolumeClean).length,
    maxVLoopArea: round(Math.max(0, ...rows.map((row) => row.figureEight.vLoopArea))),
    maxPostOpeningPressureDropMmHg:
      round(Math.max(0, ...rows.map((row) => row.figureEight.postOpeningPressureDropMmHg))),
    maxPvTangentAngleJumpDeg: round(Math.max(0, ...rows.map((row) => row.figureEight.maxPvTangentAngleJumpDeg))),
    maxPrimeC1ContinuityScore: round(Math.max(0, ...rows.map((row) => row.prime.maxC1ContinuityScore))),
    maxResidualNorm: round(Math.max(0, ...rows.map((row) => row.maxResidualNorm))),
    maxZNorm: round(Math.max(0, ...rows.map((row) => row.maxZNorm))),
  };
}

function figureEightQualityFor(samples: readonly SampleV1[]): FigureEightQualityV1 {
  const volumes = samples.map((sample) => sample.laBloodVolumeMl);
  const pressures = samples.map((sample) => sample.lapMmHg);
  const theta = samples.map((sample) => sample.theta);
  const mvOpen = samples.map((sample) => sample.mvOpen01);
  const selfIntersections = countSelfIntersections(volumes, pressures);
  const aIndices = theta.map((value, index) => value >= PRE_A_THETA ? index : -1).filter((index) => index >= 0);
  const vIndices = theta.map((value, index) => value < PRE_A_THETA ? index : -1).filter((index) => index >= 0);
  const aLoop = sliceByIndices(volumes, pressures, aIndices);
  const vLoop = sliceByIndices(volumes, pressures, vIndices);
  const signedALoop = signedPolygonArea(aLoop.x, aLoop.y);
  const signedVLoop = signedPolygonArea(vLoop.x, vLoop.y);
  const aLoopArea = Math.abs(signedALoop);
  const vLoopArea = Math.abs(signedVLoop);
  const opposedSignedLobes = signedALoop * signedVLoop < 0;
  const volumeSeparation = mean(vLoop.x) - mean(aLoop.x);
  const phase = phaseOrientationFor(volumes, pressures, theta, mvOpen);
  const tangent = pvTangentContinuityFor(volumes, pressures, theta, phase.mvOpeningIndex);
  const failures: string[] = [];
  if (selfIntersections < 1) failures.push("missing-pv-self-intersection");
  if (aLoopArea < 1.8) failures.push("a-loop-area-too-small");
  if (vLoopArea < 1.8) failures.push("v-loop-area-too-small");
  if (!opposedSignedLobes) failures.push("a-v-lobes-not-opposed");
  if (volumeSeparation < 1.2) failures.push("v-loop-not-higher-volume-than-a-loop");
  failures.push(...phase.failureReasons, ...tangent.failureReasons);
  return {
    pass: failures.length === 0,
    selfIntersections,
    opposedSignedLobes,
    aLoopArea: round(aLoopArea),
    vLoopArea: round(vLoopArea),
    volumeSeparationMl: round(volumeSeparation),
    postOpeningPressureDropMmHg: round(phase.postOpeningPressureDropMmHg),
    postOpeningVolumeDropMl: round(phase.postOpeningVolumeDropMl),
    conduitBelowReservoirChordFraction: round(phase.conduitBelowReservoirChordFraction),
    meanConduitBelowReservoirChordMmHg: round(phase.meanConduitBelowReservoirChordMmHg),
    maxPvTangentAngleJumpDeg: round(tangent.maxPvTangentAngleJumpDeg),
    mvOpeningTangentAngleJumpDeg: round(tangent.mvOpeningTangentAngleJumpDeg),
    lowerVLoopTangentAngleJumpDeg: round(tangent.lowerVLoopTangentAngleJumpDeg),
    failureReasons: failures,
  };
}

function phaseOrientationFor(
  volumes: readonly number[],
  pressures: readonly number[],
  theta: readonly number[],
  mvOpen: readonly number[],
): {
  readonly mvOpeningIndex: number | null;
  readonly postOpeningPressureDropMmHg: number;
  readonly postOpeningVolumeDropMl: number;
  readonly conduitBelowReservoirChordFraction: number;
  readonly meanConduitBelowReservoirChordMmHg: number;
  readonly failureReasons: readonly string[];
} {
  const failures: string[] = [];
  const mvOpeningIndex = findMvOpeningIndex(mvOpen);
  const mvClosureIndex = mvOpeningIndex == null ? null : findMvClosureIndexAfter(mvOpen, mvOpeningIndex);
  if (mvOpeningIndex == null) failures.push("missing-mv-opening-point");
  if (mvClosureIndex == null) failures.push("missing-mv-closure-point");
  if (mvOpeningIndex == null || mvClosureIndex == null) {
    return {
      mvOpeningIndex,
      postOpeningPressureDropMmHg: 0,
      postOpeningVolumeDropMl: 0,
      conduitBelowReservoirChordFraction: 0,
      meanConduitBelowReservoirChordMmHg: 0,
      failureReasons: failures,
    };
  }
  const conduitIndices = conduitIndicesAfterOpening(theta, mvOpeningIndex);
  const openingPressure = pressures[mvOpeningIndex]!;
  const openingVolume = volumes[mvOpeningIndex]!;
  const conduitPressures = conduitIndices.map((index) => pressures[index]!);
  const conduitVolumes = conduitIndices.map((index) => volumes[index]!);
  const postOpeningPressureDrop = openingPressure - Math.min(openingPressure, ...conduitPressures);
  const postOpeningVolumeDrop = openingVolume - Math.min(openingVolume, ...conduitVolumes);
  const belowChordMargins = conduitIndices
    .filter((index) => index !== mvOpeningIndex)
    .map((index) => reservoirChordPressureAtVolume(
      volumes[index]!,
      volumes[mvClosureIndex]!,
      pressures[mvClosureIndex]!,
      openingVolume,
      openingPressure,
    ) - pressures[index]!);
  const belowChordFraction =
    belowChordMargins.length === 0 ? 0 : belowChordMargins.filter((margin) => margin >= 0.2).length / belowChordMargins.length;
  const meanBelowChord = mean(belowChordMargins);
  if (conduitIndices.length < 6) failures.push("conduit-window-too-short");
  if (postOpeningPressureDrop < 0.8) failures.push("mv-opening-conduit-not-pressure-downward");
  if (postOpeningVolumeDrop < 0.8) failures.push("mv-opening-conduit-not-volume-leftward");
  if (belowChordFraction < 0.55) failures.push("conduit-not-below-reservoir-chord");
  if (meanBelowChord < 0.25) failures.push("conduit-mean-not-below-reservoir-chord");
  return {
    mvOpeningIndex,
    postOpeningPressureDropMmHg: postOpeningPressureDrop,
    postOpeningVolumeDropMl: postOpeningVolumeDrop,
    conduitBelowReservoirChordFraction: belowChordFraction,
    meanConduitBelowReservoirChordMmHg: meanBelowChord,
    failureReasons: failures,
  };
}

function primeQualityFor(samples: readonly SampleV1[]): PrimeQualityV1 {
  const s = finitePrimeValues(samples.map((sample) => sample.sPrimeProxyCmPerSec));
  const e = finitePrimeValues(samples.map((sample) => sample.ePrimeProxyCmPerSec));
  const a = finitePrimeValues(samples.map((sample) => sample.aPrimeProxyCmPerSec));
  const maxC1 = Math.max(c1ContinuityForTrace(s), c1ContinuityForTrace(e), c1ContinuityForTrace(a));
  const failures: string[] = [];
  if (maxAbs(s) < 0.35) failures.push("s-prime-too-small");
  if (maxAbs(e) < 0.35) failures.push("e-prime-too-small");
  if (maxAbs(a) < 0.35) failures.push("a-prime-too-small");
  if (maxC1 > 0.78) failures.push("prime-c1-kink");
  return {
    pass: failures.length === 0,
    sPrimePeakAbsCmPerSec: round(maxAbs(s)),
    ePrimePeakAbsCmPerSec: round(maxAbs(e)),
    aPrimePeakAbsCmPerSec: round(maxAbs(a)),
    maxC1ContinuityScore: round(maxC1),
    failureReasons: failures,
  };
}

function primeProxy(theta: number, zDotNormPerSec: number, kind: "s" | "e" | "a"): number | null {
  const velocityCmPerSec = 2.4 * zDotNormPerSec;
  if (kind === "s") return theta >= 0.08 && theta <= 0.52 ? velocityCmPerSec : null;
  if (kind === "e") return theta >= 0.53 && theta <= 0.74 ? velocityCmPerSec : null;
  return theta >= 0.82 || theta <= 0.02 ? velocityCmPerSec : null;
}

function variant(
  variantId: IsolatedLaAvpMvPvResidualVariantIdV1,
  mode: VariantModeV1,
  capacityGainMl: number,
  driveForceN: number,
  hydraulicGain: number,
  stiffnessNPerNorm: number,
  dampingNsecPerNorm: number,
  maxVelocityNormPerSec: number,
  pvResistanceMmHgSecPerMl: number,
  pvSourceResistanceMmHgSecPerMl: number,
  pvComplianceMlPerMmHg: number,
  residualIterations: number,
  residualRelaxation: number,
  reservoirPressureGainMmHg = 0,
  reservoirReleaseTauSec = 0.08,
  boosterPressureGainMmHg = 0,
  boosterTauSec = 0.05,
): VariantV1 {
  return {
    variantId,
    mode,
    capacityGainMl,
    driveForceN,
    hydraulicGain,
    stiffnessNPerNorm,
    dampingNsecPerNorm,
    maxVelocityNormPerSec,
    pvResistanceMmHgSecPerMl,
    pvSourceResistanceMmHgSecPerMl,
    pvComplianceMlPerMmHg,
    residualIterations,
    residualRelaxation,
    reservoirPressureGainMmHg,
    reservoirReleaseTauSec,
    boosterPressureGainMmHg,
    boosterTauSec,
  };
}

function positiveModulo(value: number, divisor: number): number {
  return ((value % divisor) + divisor) % divisor;
}

function raisedCosineWindow(theta: number, start: number, end: number): number {
  if (start <= end) {
    if (theta < start || theta > end) return 0;
    const phase = (theta - start) / Math.max(end - start, 1e-9);
    return 0.5 - 0.5 * Math.cos(2 * Math.PI * phase);
  }
  if (theta >= start) return raisedCosineWindow(theta, start, 1);
  if (theta <= end) return raisedCosineWindow(theta + 1, start, end + 1);
  return 0;
}

function smoothstep01(value: number): number {
  const x = clamp(value, 0, 1);
  return x * x * (3 - 2 * x);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * clamp(t, 0, 1);
}

function relaxToward(previous: number, target: number, dtSec: number, tauSec: number): number {
  return previous + (target - previous) * clamp(dtSec / Math.max(tauSec, 1e-9), 0, 1);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function forwardFlowVolume(values: readonly number[], dtSec: number): number {
  return values.reduce((sum, value) => sum + Math.max(0, value) * dtSec, 0);
}

function positivePeakCount(values: readonly number[]): number {
  let count = 0;
  const maxValue = Math.max(0, ...values);
  const threshold = Math.max(maxValue * 0.18, 1e-6);
  for (let i = 1; i < values.length - 1; i++) {
    if (values[i]! > threshold && values[i]! >= values[i - 1]! && values[i]! > values[i + 1]!) count++;
  }
  return count;
}

function finitePrimeValues(values: readonly (number | null)[]): readonly number[] {
  return values.filter((value): value is number => value != null && Number.isFinite(value));
}

function c1ContinuityForTrace(values: readonly number[]): number {
  if (values.length < 4) return Number.POSITIVE_INFINITY;
  const slopes: number[] = [];
  for (let i = 1; i < values.length; i++) slopes.push(values[i]! - values[i - 1]!);
  const maxSlope = maxAbs(slopes);
  if (maxSlope <= 1e-12) return 0;
  let maxJump = 0;
  for (let i = 1; i < slopes.length; i++) maxJump = Math.max(maxJump, Math.abs(slopes[i]! - slopes[i - 1]!));
  return maxJump / maxSlope;
}

function pvTangentContinuityFor(
  volumes: readonly number[],
  pressures: readonly number[],
  theta: readonly number[],
  openingIndex: number | null,
): {
  readonly maxPvTangentAngleJumpDeg: number;
  readonly mvOpeningTangentAngleJumpDeg: number;
  readonly lowerVLoopTangentAngleJumpDeg: number;
  readonly failureReasons: readonly string[];
} {
  const angleJumps = tangentAngleJumpsDeg(volumes, pressures);
  const maxPvTangentAngleJumpDeg = Math.max(0, ...angleJumps.map((entry) => entry.angleJumpDeg));
  const mvOpeningTangentAngleJumpDeg = openingIndex == null ? 0 : localAngleJumpAt(angleJumps, openingIndex);
  const lowerIndex = openingIndex == null ? null : lowerConduitPressureIndex(pressures, theta, openingIndex);
  const lowerVLoopTangentAngleJumpDeg = lowerIndex == null ? 0 : localAngleJumpAt(angleJumps, lowerIndex);
  const failures: string[] = [];
  if (mvOpeningTangentAngleJumpDeg > 58) failures.push("mv-opening-pv-c1-kink");
  if (lowerVLoopTangentAngleJumpDeg > 58) failures.push("lower-v-loop-pv-c1-kink");
  if (maxPvTangentAngleJumpDeg > 122) failures.push("pv-global-c1-kink");
  return { maxPvTangentAngleJumpDeg, mvOpeningTangentAngleJumpDeg, lowerVLoopTangentAngleJumpDeg, failureReasons: failures };
}

function tangentAngleJumpsDeg(x: readonly number[], y: readonly number[]): readonly { readonly index: number; readonly angleJumpDeg: number }[] {
  const out: { index: number; angleJumpDeg: number }[] = [];
  if (x.length < 5 || y.length < 5) return out;
  const xScale = Math.max(Math.max(...x) - Math.min(...x), 1e-9);
  const yScale = Math.max(Math.max(...y) - Math.min(...y), 1e-9);
  for (let i = 1; i < x.length - 1; i++) {
    const prevAngle = Math.atan2((y[i]! - y[i - 1]!) / yScale, (x[i]! - x[i - 1]!) / xScale);
    const nextAngle = Math.atan2((y[i + 1]! - y[i]!) / yScale, (x[i + 1]! - x[i]!) / xScale);
    out.push({ index: i, angleJumpDeg: Math.abs(wrapAngleRad(nextAngle - prevAngle)) * 180 / Math.PI });
  }
  return out;
}

function localAngleJumpAt(angleJumps: readonly { readonly index: number; readonly angleJumpDeg: number }[], index: number): number {
  return Math.max(0, ...angleJumps.filter((entry) => Math.abs(entry.index - index) <= 1).map((entry) => entry.angleJumpDeg));
}

function lowerConduitPressureIndex(pressures: readonly number[], theta: readonly number[], openingIndex: number): number | null {
  const indices = conduitIndicesAfterOpening(theta, openingIndex);
  let selected: number | null = null;
  let minPressure = Number.POSITIVE_INFINITY;
  for (const index of indices) {
    if (pressures[index]! < minPressure) {
      minPressure = pressures[index]!;
      selected = index;
    }
  }
  return selected;
}

function wrapAngleRad(value: number): number {
  let out = value;
  while (out > Math.PI) out -= 2 * Math.PI;
  while (out < -Math.PI) out += 2 * Math.PI;
  return out;
}

function findMvOpeningIndex(mvOpen: readonly number[]): number | null {
  const threshold = 0.45;
  for (let i = 0; i < mvOpen.length; i++) {
    const previous = mvOpen[(i + mvOpen.length - 1) % mvOpen.length]!;
    if (previous < threshold && mvOpen[i]! >= threshold) return i;
  }
  return null;
}

function findMvClosureIndexAfter(mvOpen: readonly number[], openingIndex: number): number | null {
  const threshold = 0.45;
  for (let step = 1; step <= mvOpen.length; step++) {
    const index = (openingIndex + step) % mvOpen.length;
    const previous = mvOpen[(index + mvOpen.length - 1) % mvOpen.length]!;
    if (previous >= threshold && mvOpen[index]! < threshold) return index;
  }
  return null;
}

function conduitIndicesAfterOpening(theta: readonly number[], openingIndex: number): readonly number[] {
  const indices: number[] = [];
  for (let step = 0; step < theta.length; step++) {
    const index = (openingIndex + step) % theta.length;
    indices.push(index);
    if (step > 0 && theta[index]! >= PRE_A_THETA) break;
  }
  return indices;
}

function reservoirChordPressureAtVolume(
  volume: number,
  closureVolume: number,
  closurePressure: number,
  openingVolume: number,
  openingPressure: number,
): number {
  const denom = openingVolume - closureVolume;
  if (Math.abs(denom) < 1e-9) return Math.max(closurePressure, openingPressure);
  const t = clamp((volume - closureVolume) / denom, 0, 1);
  return closurePressure + t * (openingPressure - closurePressure);
}

function countSelfIntersections(x: readonly number[], y: readonly number[]): number {
  let count = 0;
  for (let i = 0; i < x.length - 1; i++) {
    for (let j = i + 2; j < x.length - 1; j++) {
      if (Math.abs(i - j) <= 1) continue;
      if (i === 0 && j === x.length - 2) continue;
      if (segmentsIntersect(x[i]!, y[i]!, x[i + 1]!, y[i + 1]!, x[j]!, y[j]!, x[j + 1]!, y[j + 1]!)) count++;
    }
  }
  return count;
}

function segmentsIntersect(ax: number, ay: number, bx: number, by: number, cx: number, cy: number, dx: number, dy: number): boolean {
  const d1 = orientation(ax, ay, bx, by, cx, cy);
  const d2 = orientation(ax, ay, bx, by, dx, dy);
  const d3 = orientation(cx, cy, dx, dy, ax, ay);
  const d4 = orientation(cx, cy, dx, dy, bx, by);
  return d1 * d2 < 0 && d3 * d4 < 0;
}

function orientation(ax: number, ay: number, bx: number, by: number, cx: number, cy: number): number {
  return (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
}

function sliceByIndices(x: readonly number[], y: readonly number[], indices: readonly number[]): { readonly x: readonly number[]; readonly y: readonly number[] } {
  return { x: indices.map((index) => x[index]!), y: indices.map((index) => y[index]!) };
}

function signedPolygonArea(x: readonly number[], y: readonly number[]): number {
  if (x.length < 3 || y.length < 3) return 0;
  let area = 0;
  for (let i = 0; i < x.length; i++) {
    const j = (i + 1) % x.length;
    area += x[i]! * y[j]! - x[j]! * y[i]!;
  }
  return area / 2;
}

function mean(values: readonly number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function maxAbs(values: readonly number[]): number {
  return Math.max(0, ...values.map((value) => Math.abs(value)));
}

function round(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}
