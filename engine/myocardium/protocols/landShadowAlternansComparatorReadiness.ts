import {
  PRESCRIBED_CALCIUM_SYNTHETIC_SMOKE_PARAMETER_SET,
  PRESCRIBED_CALCIUM_SYNTHETIC_SMOKE_PARAMETER_SET_ID,
  stepPrescribedCalciumTransientV1,
} from "@/engine/myocardium/calcium";
import {
  THICK_SPHERE_V2_SELECTED_BACKEND_ID,
  THICK_SPHERE_V2_SELECTED_CALIBRATION_CANDIDATE_ID,
  THICK_SPHERE_V2_SELECTED_LV_PARAMETER_SET,
  computeThickSphereV2SelectedParameterSetStableHash,
  evaluateThickSphereV2SelectedBackend,
} from "@/engine/myocardium/kinematics";
import { sanitizeForStableHash, stableHash } from "@/engine/myocardium/kinematics/stableHash";
import {
  LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET_ID,
  solveLand2017BackwardEulerSubsteps,
  type LandStepInput,
} from "@/engine/myocardium/myofilament/land2017";

export const LAND_SHADOW_ALTERNANS_COMPARATOR_PHASE5C_A_PROTOCOL_SET_ID =
  "land-shadow-alternans-comparator-readiness-phase5c-a-v1";
export const LAND_SHADOW_ALTERNANS_COMPARATOR_PHASE5C_A_PHASE = "Phase 5C-A";
export const LAND_SHADOW_ALTERNANS_COMPARATOR_PHASE5C_A_CLAIM_BOUNDARY =
  "feedforward-land-shadow-replay-readiness-only";
export const LAND_SHADOW_ALTERNANS_COMPARATOR_PHASE5C_A_SELECTED_CANDIDATE_ID =
  THICK_SPHERE_V2_SELECTED_CALIBRATION_CANDIDATE_ID;
export const LAND_SHADOW_ALTERNANS_COMPARATOR_PHASE5C_A_SELECTED_BACKEND_ID =
  THICK_SPHERE_V2_SELECTED_BACKEND_ID;

export const LAND_SHADOW_FIXED_LEGACY_PROTOCOL = Object.freeze({
  baselineTotalBloodVolumeMl: 5600,
  deltaTotalBloodVolumeMl: -1250,
  effectiveTotalBloodVolumeMl: 4350,
  heartModel: "activeStress",
  integrationDtSec: 0.001,
  sampleHz: 120,
  traceBeats: 4,
  returnMapAcceptance: "not-used",
} as const);

const LEGACY_ADJACENT_DELTA_MIN = 0.1;
const LEGACY_PERIOD_DELTA_MAX = 0.05;
const TBV_CLEAN_TOLERANCE_ML = 0.05;
const VALVE_REVERSE_NON_PROBLEMATIC_MAX_ML = 0.05;
const LAND_BRANCH_RELATIVE_DELTA_THRESHOLD = 0.01;
const DEFAULT_INITIAL_LAND_STATE = [0.18, 0.22, 0.04, 0.02, 0, 0] as const;
const DEFAULT_INITIAL_CALCIUM_STATE = [0, 0] as const;

export type LandShadowAlternansComparatorReadinessStatus =
  | "land-shadow-comparator-ready"
  | "land-shadow-comparator-review";

export type LandShadowAlternansComparatorSectionStatus =
  | "readiness-pass"
  | "readiness-fail";

export type LandShadowAlternansComparatorSection = {
  readonly id: string;
  readonly status: LandShadowAlternansComparatorSectionStatus;
  readonly metrics: Record<string, unknown>;
};

export type LandShadowLegacyProtocolEvidence = {
  readonly baselineTotalBloodVolumeMl: number;
  readonly deltaTotalBloodVolumeMl: number;
  readonly effectiveTotalBloodVolumeMl: number;
  readonly heartModel: string;
  readonly integrationDtSec: number;
  readonly sampleHz: number;
  readonly traceBeats: number;
  readonly returnMapAcceptance: string;
  readonly returnMapPointLimit: number;
  readonly settled: boolean;
  readonly periodBeats: number;
  readonly adjacentDelta: number;
  readonly periodDelta: number;
  readonly tbvClassification: string;
  readonly tbvSanitizeAbsMl: number;
  readonly tbvProjectionAppliedMl: number;
  readonly maxValveReverseMl: number;
};

export type LandShadowLegacyTrajectorySample = {
  readonly beat: number;
  readonly sampleIndex: number;
  readonly timeSec: number;
  readonly phase01: number;
  readonly vlvMl: number;
};

export type LandShadowPolicyDescriptor = {
  readonly id?: unknown;
  readonly alternansPolicy?: {
    readonly legacyReproduction?: { readonly required?: unknown };
    readonly newMyocardiumCheck?: { readonly required?: unknown };
    readonly secondOrderReferenceRequired?: { readonly required?: unknown };
    readonly beOnlyInterpretation?: unknown;
  };
};

export type LandShadowAlternansComparatorReadinessInput = {
  readonly legacyProtocol: LandShadowLegacyProtocolEvidence;
  readonly legacyTrajectory: readonly LandShadowLegacyTrajectorySample[];
  readonly alternansPolicyDescriptor: LandShadowPolicyDescriptor;
};

export type LandShadowPolicyBoundaryEvidence = {
  readonly policyPath: "data/myocardium/protocols/layer-consistency-and-alternans-policy-v1.json";
  readonly policyId: "layer-consistency-and-alternans-policy-v1" | "missing-or-unexpected";
  readonly legacyReproductionRequired: boolean;
  readonly newMyocardiumCheckRequired: boolean;
  readonly secondOrderReferenceRequired: boolean;
  readonly beOnlyInterpretation: string;
  readonly newMyocardiumCheckStatus: "not-performed-not-satisfied";
  readonly feedforwardShadowReplayEvidenceStatus:
    "performed-distinct-from-new-myocardium-check";
  readonly finalNoAlternansClaim: "not-claimed";
  readonly pass: boolean;
};

export type LandShadowLegacyReproductionEvidence = {
  readonly fixedProtocolPass: boolean;
  readonly reproductionPass: boolean;
  readonly requiredSettled: true;
  readonly requiredPeriodBeats: 2;
  readonly requiredAdjacentDeltaGreaterThan: typeof LEGACY_ADJACENT_DELTA_MIN;
  readonly requiredPeriodDeltaLessThan: typeof LEGACY_PERIOD_DELTA_MAX;
  readonly requiredTbvCleanToleranceMl: typeof TBV_CLEAN_TOLERANCE_ML;
  readonly requiredValveReverseMaxMl: typeof VALVE_REVERSE_NON_PROBLEMATIC_MAX_ML;
  readonly observed: LandShadowLegacyProtocolEvidence;
};

export type LandShadowReplayBeatMetric = {
  readonly beat: number;
  readonly sampleCount: number;
  readonly minPrescribedLegacyVlvMl: number;
  readonly maxPrescribedLegacyVlvMl: number;
  readonly minPrescribedLegacyVlvM3: number;
  readonly maxPrescribedLegacyVlvM3: number;
  readonly peakSourceActiveFiberStressPa: number;
  readonly peakStressTimeSec: number;
  readonly peakStressPhase01: number;
  readonly finiteHealth: {
    readonly kinematicsFinite: boolean;
    readonly inCalibrationDomain: boolean;
    readonly calciumFinite: boolean;
    readonly landSolverOk: boolean;
    readonly landHealthFinite: boolean;
    readonly sourceStressFinite: boolean;
    readonly solverFiniteHealthPass: boolean;
    readonly pass: boolean;
  };
  readonly projectionUsed: false | true;
  readonly deterministicHash: string;
};

export type LandShadowFeedforwardReplayEvidence = {
  readonly replayStatus: "feedforward-shadow-replay-complete";
  readonly modelIds: {
    readonly selectedBackendId: typeof THICK_SPHERE_V2_SELECTED_BACKEND_ID;
    readonly selectedCandidateId: typeof THICK_SPHERE_V2_SELECTED_CALIBRATION_CANDIDATE_ID;
    readonly lvParameterSetId: typeof THICK_SPHERE_V2_SELECTED_LV_PARAMETER_SET.parameterSetId;
    readonly lvParameterSetStableHash: string;
    readonly calciumParameterSetId: typeof PRESCRIBED_CALCIUM_SYNTHETIC_SMOKE_PARAMETER_SET_ID;
    readonly landParameterSetId: typeof LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET_ID;
  };
  readonly volumeReplayPolicy: {
    readonly sourceVolume: "legacy-activeStress-VLV-mL";
    readonly conversion: "mL-to-m3";
    readonly clipping: false;
    readonly rescale: false;
    readonly freeGain: false;
    readonly sampleIntervalPolicy:
      "use-observed-120Hz-trace-intervals-with-Land-BE-substeps-at-legacy-dt-quantum";
  };
  readonly selectedLvCalibrationDomainM3: {
    readonly min: number;
    readonly max: number;
  };
  readonly calciumSource: {
    readonly source: "prescribed-calcium-transient-v1";
    readonly parameterSetId: typeof PRESCRIBED_CALCIUM_SYNTHETIC_SMOKE_PARAMETER_SET_ID;
    readonly phaseAlignment:
      "legacy-sample-phase-to-prescribed-calcium-time-since-activation";
    readonly calciumCyclingAlternans: "not-modeled-not-claimed";
  };
  readonly trajectorySampleCount: number;
  readonly replayBeatCount: number;
  readonly beats: readonly LandShadowReplayBeatMetric[];
  readonly allFiniteHealth: boolean;
  readonly allSamplesInCalibrationDomain: boolean;
  readonly projectionUsedAny: boolean;
  readonly maxLandSolverResidualNorm: number;
  readonly relativeBranchDelta: number;
  readonly branchDeltaDetected: boolean;
  readonly branchDeltaThreshold: typeof LAND_BRANCH_RELATIVE_DELTA_THRESHOLD;
  readonly branchDeltaInterpretation:
    "inherited-from-prescribed-alternating-legacy-volume-not-generated-by-Land";
  readonly officialMorphologyPassStatus: "not-evaluated";
  readonly robustNoAlternansClaim: "not-claimed";
  readonly replayPass: boolean;
  readonly replayStableHash: string;
};

export type LandShadowAlternansComparatorReadinessReport = {
  readonly protocolSetId: typeof LAND_SHADOW_ALTERNANS_COMPARATOR_PHASE5C_A_PROTOCOL_SET_ID;
  readonly phase: typeof LAND_SHADOW_ALTERNANS_COMPARATOR_PHASE5C_A_PHASE;
  readonly claimBoundary: typeof LAND_SHADOW_ALTERNANS_COMPARATOR_PHASE5C_A_CLAIM_BOUNDARY;
  readonly readinessStatus: LandShadowAlternansComparatorReadinessStatus;
  readonly productionRuntimeStatus: "not-live-runtime-replacement";
  readonly selectedBackendId: typeof LAND_SHADOW_ALTERNANS_COMPARATOR_PHASE5C_A_SELECTED_BACKEND_ID;
  readonly selectedCandidateId:
    typeof LAND_SHADOW_ALTERNANS_COMPARATOR_PHASE5C_A_SELECTED_CANDIDATE_ID;
  readonly futureScope: {
    readonly thickSphereV2Path: "thick-sphere-v2-explicit-external-septal-coupling";
    readonly triSegCompatiblePath: "future";
    readonly rvPressureOverloadCoverage: "not-covered";
    readonly ventricularInterdependenceCoverage: "not-covered";
    readonly rightHeartFailureCoverage: "not-covered";
  };
  readonly fixedLegacyProtocol: typeof LAND_SHADOW_FIXED_LEGACY_PROTOCOL;
  readonly policyBoundary: LandShadowPolicyBoundaryEvidence;
  readonly legacyReproduction: LandShadowLegacyReproductionEvidence;
  readonly landFeedforwardReplay: LandShadowFeedforwardReplayEvidence;
  readonly officialMorphologyPass: "not-claimed";
  readonly finalNoAlternansClaim: "not-claimed";
  readonly sections: readonly LandShadowAlternansComparatorSection[];
  readonly readinessPass: boolean;
  readonly stableSummaryHash: string;
};

type ReplaySampleMetric = {
  readonly beat: number;
  readonly timeSec: number;
  readonly phase01: number;
  readonly vlvMl: number;
  readonly vlvM3: number;
  readonly sourceActiveFiberStressPa: number;
  readonly kinematicsFinite: boolean;
  readonly inCalibrationDomain: boolean;
  readonly calciumFinite: boolean;
  readonly landSolverOk: boolean;
  readonly landHealthFinite: boolean;
  readonly sourceStressFinite: boolean;
  readonly projectionUsed: boolean;
  readonly solverResidualNorm: number;
};

export function runLandShadowAlternansComparatorReadinessReport(
  input: LandShadowAlternansComparatorReadinessInput,
): LandShadowAlternansComparatorReadinessReport {
  const policyBoundary = buildPolicyBoundary(input.alternansPolicyDescriptor);
  const legacyReproduction = buildLegacyReproduction(input.legacyProtocol);
  const landFeedforwardReplay = runLandFeedforwardReplay(input);
  const sections = [
    phase5CABoundarySection(),
    policyBoundarySection(policyBoundary),
    fixedLegacyProtocolSection(legacyReproduction),
    legacyReproductionSection(legacyReproduction),
    landFeedforwardReplaySection(landFeedforwardReplay),
    branchDeltaInterpretationSection(landFeedforwardReplay),
    deterministicReplaySection(input, landFeedforwardReplay),
  ] as const;
  const readinessPass = sections.every((candidate) => candidate.status === "readiness-pass");
  const reportWithoutHash = {
    protocolSetId: LAND_SHADOW_ALTERNANS_COMPARATOR_PHASE5C_A_PROTOCOL_SET_ID,
    phase: LAND_SHADOW_ALTERNANS_COMPARATOR_PHASE5C_A_PHASE,
    claimBoundary: LAND_SHADOW_ALTERNANS_COMPARATOR_PHASE5C_A_CLAIM_BOUNDARY,
    readinessStatus:
      readinessPass ? "land-shadow-comparator-ready" : "land-shadow-comparator-review",
    productionRuntimeStatus: "not-live-runtime-replacement",
    selectedBackendId: LAND_SHADOW_ALTERNANS_COMPARATOR_PHASE5C_A_SELECTED_BACKEND_ID,
    selectedCandidateId: LAND_SHADOW_ALTERNANS_COMPARATOR_PHASE5C_A_SELECTED_CANDIDATE_ID,
    futureScope: reportFutureScope(),
    fixedLegacyProtocol: LAND_SHADOW_FIXED_LEGACY_PROTOCOL,
    policyBoundary,
    legacyReproduction,
    landFeedforwardReplay,
    officialMorphologyPass: "not-claimed",
    finalNoAlternansClaim: "not-claimed",
    sections: sections.map((candidate) => ({
      id: candidate.id,
      status: candidate.status,
      metrics: candidate.metrics,
    })),
    readinessPass,
  } satisfies Omit<LandShadowAlternansComparatorReadinessReport, "stableSummaryHash">;

  return {
    ...reportWithoutHash,
    stableSummaryHash: stableHash(sanitizeForStableHash(reportWithoutHash)),
  };
}

function buildPolicyBoundary(
  descriptor: LandShadowPolicyDescriptor,
): LandShadowPolicyBoundaryEvidence {
  const alternansPolicy = descriptor.alternansPolicy ?? {};
  const beOnlyInterpretation =
    typeof alternansPolicy.beOnlyInterpretation === "string"
      ? alternansPolicy.beOnlyInterpretation
      : "";
  const evidence = {
    policyPath: "data/myocardium/protocols/layer-consistency-and-alternans-policy-v1.json",
    policyId:
      descriptor.id === "layer-consistency-and-alternans-policy-v1"
        ? "layer-consistency-and-alternans-policy-v1"
        : "missing-or-unexpected",
    legacyReproductionRequired:
      alternansPolicy.legacyReproduction?.required === true,
    newMyocardiumCheckRequired:
      alternansPolicy.newMyocardiumCheck?.required === true,
    secondOrderReferenceRequired:
      alternansPolicy.secondOrderReferenceRequired?.required === true,
    beOnlyInterpretation,
    newMyocardiumCheckStatus: "not-performed-not-satisfied",
    feedforwardShadowReplayEvidenceStatus:
      "performed-distinct-from-new-myocardium-check",
    finalNoAlternansClaim: "not-claimed",
  } as const;
  return {
    ...evidence,
    pass:
      evidence.policyId === "layer-consistency-and-alternans-policy-v1"
      && evidence.legacyReproductionRequired
      && evidence.newMyocardiumCheckRequired
      && evidence.secondOrderReferenceRequired
      && /smoke evidence only/i.test(beOnlyInterpretation)
      && /not as a final robustness claim/i.test(beOnlyInterpretation),
  };
}

function buildLegacyReproduction(
  observed: LandShadowLegacyProtocolEvidence,
): LandShadowLegacyReproductionEvidence {
  const fixedProtocolPass =
    observed.baselineTotalBloodVolumeMl === LAND_SHADOW_FIXED_LEGACY_PROTOCOL.baselineTotalBloodVolumeMl
    && observed.deltaTotalBloodVolumeMl === LAND_SHADOW_FIXED_LEGACY_PROTOCOL.deltaTotalBloodVolumeMl
    && observed.effectiveTotalBloodVolumeMl === LAND_SHADOW_FIXED_LEGACY_PROTOCOL.effectiveTotalBloodVolumeMl
    && observed.heartModel === LAND_SHADOW_FIXED_LEGACY_PROTOCOL.heartModel
    && observed.integrationDtSec === LAND_SHADOW_FIXED_LEGACY_PROTOCOL.integrationDtSec
    && observed.sampleHz === LAND_SHADOW_FIXED_LEGACY_PROTOCOL.sampleHz
    && observed.traceBeats === LAND_SHADOW_FIXED_LEGACY_PROTOCOL.traceBeats
    && observed.returnMapAcceptance === LAND_SHADOW_FIXED_LEGACY_PROTOCOL.returnMapAcceptance
    && observed.returnMapPointLimit === 0;
  const reproductionPass =
    observed.settled === true
    && observed.periodBeats === 2
    && observed.adjacentDelta > LEGACY_ADJACENT_DELTA_MIN
    && observed.periodDelta < LEGACY_PERIOD_DELTA_MAX
    && observed.tbvClassification === "clean"
    && observed.tbvSanitizeAbsMl <= TBV_CLEAN_TOLERANCE_ML
    && observed.tbvProjectionAppliedMl <= TBV_CLEAN_TOLERANCE_ML
    && observed.maxValveReverseMl <= VALVE_REVERSE_NON_PROBLEMATIC_MAX_ML;

  return {
    fixedProtocolPass,
    reproductionPass,
    requiredSettled: true,
    requiredPeriodBeats: 2,
    requiredAdjacentDeltaGreaterThan: LEGACY_ADJACENT_DELTA_MIN,
    requiredPeriodDeltaLessThan: LEGACY_PERIOD_DELTA_MAX,
    requiredTbvCleanToleranceMl: TBV_CLEAN_TOLERANCE_ML,
    requiredValveReverseMaxMl: VALVE_REVERSE_NON_PROBLEMATIC_MAX_ML,
    observed,
  };
}

function runLandFeedforwardReplay(
  input: LandShadowAlternansComparatorReadinessInput,
): LandShadowFeedforwardReplayEvidence {
  const trajectory = sortedTrajectory(input.legacyTrajectory);
  const cycleLengthSec = estimateCycleLengthSec(trajectory);
  const sampleMetrics: ReplaySampleMetric[] = [];
  let landState = Float64Array.from(DEFAULT_INITIAL_LAND_STATE);
  let calciumState = Float64Array.from(DEFAULT_INITIAL_CALCIUM_STATE);
  let previousFreeCalciumUM: number | undefined;

  for (let index = 0; index < trajectory.length; index += 1) {
    const row = trajectory[index];
    const previousRow = trajectory[index - 1] ?? row;
    const dtSec = sampleDtSec(row, previousRow, input.legacyProtocol);
    const cavityVolumeM3 = mlToM3(row.vlvMl);
    const previousCavityVolumeM3 = mlToM3(previousRow.vlvMl);
    const kinematics = evaluateThickSphereV2SelectedBackend(
      {
        coordinates: [
          {
            id: THICK_SPHERE_V2_SELECTED_LV_PARAMETER_SET.coordinateId,
            valueSI: cavityVolumeM3,
            previousValueSI: previousCavityVolumeM3,
            rateSI: (cavityVolumeM3 - previousCavityVolumeM3) / dtSec,
            unit: "m3",
          },
        ],
        instance: { moduleId: "kinematics", instanceId: "phase5c-a-land-shadow-lv" },
      },
      THICK_SPHERE_V2_SELECTED_LV_PARAMETER_SET,
    );
    const previousKinematics = evaluateThickSphereV2SelectedBackend(
      {
        coordinates: [
          {
            id: THICK_SPHERE_V2_SELECTED_LV_PARAMETER_SET.coordinateId,
            valueSI: previousCavityVolumeM3,
            previousValueSI: previousCavityVolumeM3,
            rateSI: 0,
            unit: "m3",
          },
        ],
        instance: { moduleId: "kinematics", instanceId: "phase5c-a-land-shadow-lv-previous" },
      },
      THICK_SPHERE_V2_SELECTED_LV_PARAMETER_SET,
    );
    const calciumStep = stepPrescribedCalciumTransientV1(
      calciumState,
      {
        targetId: "phase5c-a-land-shadow-prescribed-ca",
        activationEventId: row.beat,
        timeSinceActivationSec: normalizedPhase(row.phase01) * cycleLengthSec,
        cycleLengthSec,
        activationStrength01: 1,
        dtSec,
      },
      PRESCRIBED_CALCIUM_SYNTHETIC_SMOKE_PARAMETER_SET,
    );
    calciumState = calciumStep.nextState;
    const landInput: LandStepInput = {
      freeCalciumUM: calciumStep.output.freeCalciumUM,
      previousFiberEngineeringStrain: previousKinematics.fiberEngineeringStrain,
      stageFiberEngineeringStrain: kinematics.fiberEngineeringStrain,
      dtSec,
      stage: { scheme: "BE", stageIndex: 0 },
    };
    const landSolved = solveLand2017BackwardEulerSubsteps(
      landState,
      landInput,
      {
        previousFreeCalciumUM,
        substeps: Math.max(
          1,
          Math.round(dtSec / LAND_SHADOW_FIXED_LEGACY_PROTOCOL.integrationDtSec),
        ),
      },
    );
    previousFreeCalciumUM = calciumStep.output.freeCalciumUM;
    if (landSolved.ok) {
      landState = landSolved.nextState;
    }

    sampleMetrics.push({
      beat: row.beat,
      timeSec: row.timeSec,
      phase01: normalizedPhase(row.phase01),
      vlvMl: row.vlvMl,
      vlvM3: cavityVolumeM3,
      sourceActiveFiberStressPa:
        landSolved.output?.sourceActiveFiberStressPa ?? Number.NaN,
      kinematicsFinite:
        kinematics.geometryHealth.finite && previousKinematics.geometryHealth.finite,
      inCalibrationDomain:
        kinematics.geometryHealth.inCalibrationDomain
        && previousKinematics.geometryHealth.inCalibrationDomain,
      calciumFinite: Number.isFinite(calciumStep.output.freeCalciumUM),
      landSolverOk: landSolved.ok,
      landHealthFinite: landSolved.output?.health.finite === true,
      sourceStressFinite:
        Number.isFinite(landSolved.output?.sourceActiveFiberStressPa),
      projectionUsed: landSolved.output?.health.projectionUsed === true,
      solverResidualNorm: landSolved.residualNorm,
    });
  }

  const beats = buildBeatMetrics(sampleMetrics);
  const allFiniteHealth =
    sampleMetrics.length > 0
    && sampleMetrics.every((sample) =>
      sample.kinematicsFinite
      && sample.calciumFinite
      && sample.landSolverOk
      && sample.landHealthFinite
      && sample.sourceStressFinite,
    );
  const allSamplesInCalibrationDomain =
    sampleMetrics.length > 0
    && sampleMetrics.every((sample) => sample.inCalibrationDomain);
  const projectionUsedAny = sampleMetrics.some((sample) => sample.projectionUsed);
  const maxLandSolverResidualNorm = maxOrNaN(sampleMetrics.map((sample) => sample.solverResidualNorm));
  const relativeBranchDelta = branchRelativeDelta(beats.map((beat) => beat.peakSourceActiveFiberStressPa));
  const replayWithoutHash = {
    replayStatus: "feedforward-shadow-replay-complete",
    modelIds: {
      selectedBackendId: THICK_SPHERE_V2_SELECTED_BACKEND_ID,
      selectedCandidateId: THICK_SPHERE_V2_SELECTED_CALIBRATION_CANDIDATE_ID,
      lvParameterSetId: THICK_SPHERE_V2_SELECTED_LV_PARAMETER_SET.parameterSetId,
      lvParameterSetStableHash:
        computeThickSphereV2SelectedParameterSetStableHash(
          THICK_SPHERE_V2_SELECTED_LV_PARAMETER_SET,
        ),
      calciumParameterSetId: PRESCRIBED_CALCIUM_SYNTHETIC_SMOKE_PARAMETER_SET_ID,
      landParameterSetId: LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET_ID,
    },
    volumeReplayPolicy: {
      sourceVolume: "legacy-activeStress-VLV-mL",
      conversion: "mL-to-m3",
      clipping: false,
      rescale: false,
      freeGain: false,
      sampleIntervalPolicy:
        "use-observed-120Hz-trace-intervals-with-Land-BE-substeps-at-legacy-dt-quantum",
    },
    selectedLvCalibrationDomainM3: {
      min: THICK_SPHERE_V2_SELECTED_LV_PARAMETER_SET.sweepCavityVolumeMinM3,
      max: THICK_SPHERE_V2_SELECTED_LV_PARAMETER_SET.sweepCavityVolumeMaxM3,
    },
    calciumSource: {
      source: "prescribed-calcium-transient-v1",
      parameterSetId: PRESCRIBED_CALCIUM_SYNTHETIC_SMOKE_PARAMETER_SET_ID,
      phaseAlignment:
        "legacy-sample-phase-to-prescribed-calcium-time-since-activation",
      calciumCyclingAlternans: "not-modeled-not-claimed",
    },
    trajectorySampleCount: trajectory.length,
    replayBeatCount: beats.length,
    beats,
    allFiniteHealth,
    allSamplesInCalibrationDomain,
    projectionUsedAny,
    maxLandSolverResidualNorm,
    relativeBranchDelta,
    branchDeltaDetected: relativeBranchDelta >= LAND_BRANCH_RELATIVE_DELTA_THRESHOLD,
    branchDeltaThreshold: LAND_BRANCH_RELATIVE_DELTA_THRESHOLD,
    branchDeltaInterpretation:
      "inherited-from-prescribed-alternating-legacy-volume-not-generated-by-Land",
    officialMorphologyPassStatus: "not-evaluated",
    robustNoAlternansClaim: "not-claimed",
    replayPass:
      beats.length === LAND_SHADOW_FIXED_LEGACY_PROTOCOL.traceBeats
      && allFiniteHealth
      && allSamplesInCalibrationDomain
      && !projectionUsedAny
      && beats.every((beat) => /^[0-9a-f]{8}$/.test(beat.deterministicHash)),
  } satisfies Omit<LandShadowFeedforwardReplayEvidence, "replayStableHash">;

  return {
    ...replayWithoutHash,
    replayStableHash: stableHash(sanitizeForStableHash(replayWithoutHash)),
  };
}

function buildBeatMetrics(
  sampleMetrics: readonly ReplaySampleMetric[],
): readonly LandShadowReplayBeatMetric[] {
  const grouped = new Map<number, ReplaySampleMetric[]>();
  for (const sample of sampleMetrics) {
    const samples = grouped.get(sample.beat) ?? [];
    samples.push(sample);
    grouped.set(sample.beat, samples);
  }
  return Array.from(grouped.keys()).sort((a, b) => a - b).map((beat) => {
    const samples = grouped.get(beat) ?? [];
    const peak =
      samples.reduce(
        (best, sample) =>
          sample.sourceActiveFiberStressPa > best.sourceActiveFiberStressPa ? sample : best,
        samples[0] ?? failedReplaySample(beat),
      );
    const finiteHealth = {
      kinematicsFinite: samples.length > 0 && samples.every((sample) => sample.kinematicsFinite),
      inCalibrationDomain: samples.length > 0 && samples.every((sample) => sample.inCalibrationDomain),
      calciumFinite: samples.length > 0 && samples.every((sample) => sample.calciumFinite),
      landSolverOk: samples.length > 0 && samples.every((sample) => sample.landSolverOk),
      landHealthFinite: samples.length > 0 && samples.every((sample) => sample.landHealthFinite),
      sourceStressFinite: samples.length > 0 && samples.every((sample) => sample.sourceStressFinite),
    };
    const solverFiniteHealthPass =
      finiteHealth.kinematicsFinite
      && finiteHealth.calciumFinite
      && finiteHealth.landSolverOk
      && finiteHealth.landHealthFinite
      && finiteHealth.sourceStressFinite;
    const metricWithoutHash = {
      beat,
      sampleCount: samples.length,
      minPrescribedLegacyVlvMl: minOrNaN(samples.map((sample) => sample.vlvMl)),
      maxPrescribedLegacyVlvMl: maxOrNaN(samples.map((sample) => sample.vlvMl)),
      minPrescribedLegacyVlvM3: minOrNaN(samples.map((sample) => sample.vlvM3)),
      maxPrescribedLegacyVlvM3: maxOrNaN(samples.map((sample) => sample.vlvM3)),
      peakSourceActiveFiberStressPa: peak.sourceActiveFiberStressPa,
      peakStressTimeSec: peak.timeSec,
      peakStressPhase01: peak.phase01,
      finiteHealth: {
        ...finiteHealth,
        solverFiniteHealthPass,
        pass: solverFiniteHealthPass,
      },
      projectionUsed: samples.some((sample) => sample.projectionUsed),
    };
    return {
      ...metricWithoutHash,
      deterministicHash: stableHash(sanitizeForStableHash(metricWithoutHash)),
    };
  });
}

function phase5CABoundarySection(): LandShadowAlternansComparatorSection {
  return section("phase5c-a-boundary-v1", true, {
    protocolSetId: LAND_SHADOW_ALTERNANS_COMPARATOR_PHASE5C_A_PROTOCOL_SET_ID,
    phase: LAND_SHADOW_ALTERNANS_COMPARATOR_PHASE5C_A_PHASE,
    claimBoundary: LAND_SHADOW_ALTERNANS_COMPARATOR_PHASE5C_A_CLAIM_BOUNDARY,
    selectedBackendId: LAND_SHADOW_ALTERNANS_COMPARATOR_PHASE5C_A_SELECTED_BACKEND_ID,
    selectedCandidateId: LAND_SHADOW_ALTERNANS_COMPARATOR_PHASE5C_A_SELECTED_CANDIDATE_ID,
    productionRuntimeStatus: "not-live-runtime-replacement",
  });
}

function policyBoundarySection(
  evidence: LandShadowPolicyBoundaryEvidence,
): LandShadowAlternansComparatorSection {
  return section("alternans-policy-boundary-v1", evidence.pass, evidence);
}

function fixedLegacyProtocolSection(
  evidence: LandShadowLegacyReproductionEvidence,
): LandShadowAlternansComparatorSection {
  return section("fixed-legacy-protocol-v1", evidence.fixedProtocolPass, {
    expected: LAND_SHADOW_FIXED_LEGACY_PROTOCOL,
    observed: evidence.observed,
  });
}

function legacyReproductionSection(
  evidence: LandShadowLegacyReproductionEvidence,
): LandShadowAlternansComparatorSection {
  return section("legacy-period2-reproduction-v1", evidence.reproductionPass, evidence);
}

function landFeedforwardReplaySection(
  evidence: LandShadowFeedforwardReplayEvidence,
): LandShadowAlternansComparatorSection {
  return section("land-feedforward-shadow-replay-v1", evidence.replayPass, {
    replayPass: evidence.replayPass,
    trajectorySampleCount: evidence.trajectorySampleCount,
    replayBeatCount: evidence.replayBeatCount,
    allFiniteHealth: evidence.allFiniteHealth,
    allSamplesInCalibrationDomain: evidence.allSamplesInCalibrationDomain,
    projectionUsedAny: evidence.projectionUsedAny,
    maxLandSolverResidualNorm: evidence.maxLandSolverResidualNorm,
    selectedLvCalibrationDomainM3: evidence.selectedLvCalibrationDomainM3,
    volumeReplayPolicy: evidence.volumeReplayPolicy,
  });
}

function branchDeltaInterpretationSection(
  evidence: LandShadowFeedforwardReplayEvidence,
): LandShadowAlternansComparatorSection {
  return section(
    "land-branch-delta-interpretation-v1",
    Number.isFinite(evidence.relativeBranchDelta)
      && evidence.branchDeltaInterpretation
        === "inherited-from-prescribed-alternating-legacy-volume-not-generated-by-Land"
      && evidence.calciumSource.calciumCyclingAlternans === "not-modeled-not-claimed"
      && evidence.officialMorphologyPassStatus === "not-evaluated"
      && evidence.robustNoAlternansClaim === "not-claimed",
    {
      relativeBranchDelta: evidence.relativeBranchDelta,
      branchDeltaDetected: evidence.branchDeltaDetected,
      branchDeltaThreshold: evidence.branchDeltaThreshold,
      branchDeltaInterpretation: evidence.branchDeltaInterpretation,
      calciumCyclingAlternans: evidence.calciumSource.calciumCyclingAlternans,
      officialMorphologyPassStatus: evidence.officialMorphologyPassStatus,
      robustNoAlternansClaim: evidence.robustNoAlternansClaim,
    },
  );
}

function deterministicReplaySection(
  input: LandShadowAlternansComparatorReadinessInput,
  first: LandShadowFeedforwardReplayEvidence,
): LandShadowAlternansComparatorSection {
  const second = runLandFeedforwardReplay(input);
  const beatHashesStable =
    first.beats.length === second.beats.length
    && first.beats.every((beat, index) =>
      beat.deterministicHash === second.beats[index]?.deterministicHash
      && /^[0-9a-f]{8}$/.test(beat.deterministicHash),
    );
  const pass = first.replayStableHash === second.replayStableHash && beatHashesStable;
  return section("deterministic-replay-v1", pass, {
    firstReplayHash: first.replayStableHash,
    secondReplayHash: second.replayStableHash,
    beatHashes: first.beats.map((beat) => beat.deterministicHash),
    beatHashesStable,
  });
}

function reportFutureScope(): LandShadowAlternansComparatorReadinessReport["futureScope"] {
  return {
    thickSphereV2Path: "thick-sphere-v2-explicit-external-septal-coupling",
    triSegCompatiblePath: "future",
    rvPressureOverloadCoverage: "not-covered",
    ventricularInterdependenceCoverage: "not-covered",
    rightHeartFailureCoverage: "not-covered",
  };
}

function section(
  id: string,
  pass: boolean,
  metrics: Record<string, unknown>,
): LandShadowAlternansComparatorSection {
  return {
    id,
    status: pass ? "readiness-pass" : "readiness-fail",
    metrics,
  };
}

function sortedTrajectory(
  samples: readonly LandShadowLegacyTrajectorySample[],
): readonly LandShadowLegacyTrajectorySample[] {
  return [...samples]
    .filter((sample) =>
      Number.isFinite(sample.beat)
      && Number.isFinite(sample.sampleIndex)
      && Number.isFinite(sample.timeSec)
      && Number.isFinite(sample.phase01)
      && Number.isFinite(sample.vlvMl),
    )
    .sort((left, right) =>
      left.timeSec - right.timeSec
      || left.beat - right.beat
      || left.sampleIndex - right.sampleIndex,
    );
}

function estimateCycleLengthSec(
  trajectory: readonly LandShadowLegacyTrajectorySample[],
): number {
  const startsByBeat = new Map<number, number>();
  for (const sample of trajectory) {
    const current = startsByBeat.get(sample.beat);
    if (current === undefined || sample.timeSec < current) {
      startsByBeat.set(sample.beat, sample.timeSec);
    }
  }
  const starts = Array.from(startsByBeat.entries()).sort((a, b) => a[0] - b[0]);
  const deltas: number[] = [];
  for (let index = 1; index < starts.length; index += 1) {
    const delta = starts[index][1] - starts[index - 1][1];
    if (Number.isFinite(delta) && delta > 0) deltas.push(delta);
  }
  if (deltas.length === 0) return 0.8;
  return median(deltas);
}

function sampleDtSec(
  row: LandShadowLegacyTrajectorySample,
  previousRow: LandShadowLegacyTrajectorySample,
  protocol: LandShadowLegacyProtocolEvidence,
): number {
  const observed = row.timeSec - previousRow.timeSec;
  if (Number.isFinite(observed) && observed > 0) return observed;
  return 1 / Math.max(protocol.sampleHz, 1);
}

function branchRelativeDelta(values: readonly number[]): number {
  if (values.length < 2) return Number.NaN;
  const branchA = values.filter((_, index) => index % 2 === 0);
  const branchB = values.filter((_, index) => index % 2 === 1);
  const a = mean(branchA);
  const b = mean(branchB);
  return Math.abs(a - b) / Math.max(Math.abs(a), Math.abs(b), 1);
}

function failedReplaySample(beat: number): ReplaySampleMetric {
  return {
    beat,
    timeSec: Number.NaN,
    phase01: Number.NaN,
    vlvMl: Number.NaN,
    vlvM3: Number.NaN,
    sourceActiveFiberStressPa: Number.NaN,
    kinematicsFinite: false,
    inCalibrationDomain: false,
    calciumFinite: false,
    landSolverOk: false,
    landHealthFinite: false,
    sourceStressFinite: false,
    projectionUsed: true,
    solverResidualNorm: Number.NaN,
  };
}

function mlToM3(valueMl: number): number {
  return valueMl * 1e-6;
}

function normalizedPhase(value: number): number {
  return value - Math.floor(value);
}

function minOrNaN(values: readonly number[]): number {
  const finite = values.filter(Number.isFinite);
  return finite.length > 0 ? Math.min(...finite) : Number.NaN;
}

function maxOrNaN(values: readonly number[]): number {
  const finite = values.filter(Number.isFinite);
  return finite.length > 0 ? Math.max(...finite) : Number.NaN;
}

function mean(values: readonly number[]): number {
  const finite = values.filter(Number.isFinite);
  if (finite.length === 0) return Number.NaN;
  return finite.reduce((sum, value) => sum + value, 0) / finite.length;
}

function median(values: readonly number[]): number {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (sorted.length === 0) return Number.NaN;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}
