import {
  commitLand2017ActiveOnlyTrialV1,
  initialLand2017ActiveOnlyStateV1,
  trialLand2017ActiveOnlyV1,
} from "@/engine/mechanics2/activation/Land2017ActiveOnlyV1";
import {
  commitHillCeSeeSlsTrialV1,
  prepareHillCeSeeSlsParamsV1,
  trialHillCeSeeSlsV1,
  type HillCeSeeSlsParamsV1,
  type HillCeSeeSlsStateV1,
} from "@/engine/mechanics2/constitutive/HillCeSeeSlsV1";
import {
  evaluateOneFiberVolumeGeometryV1,
  oneFiberCavityPressurePaV1,
  type OneFiberVolumeGeometryParamsV1,
} from "@/engine/mechanics2/geometry/OneFiberVolumeGeometryV1";

const PA_PER_MMHG = 133.322;

export const PR467_LA_ACCEPTED_HISTORY_ACTIVE_REPLAY_BENCH_ID_V1 =
  "pr467-la-accepted-history-active-replay-v1" as const;

export const PR467_LA_ACCEPTED_HISTORY_ACTIVE_REPLAY_CLAIM_V1 = Object.freeze({
  evidenceRole:
    "component-replay-on-recorded-closed-loop-accepted-step-history" as const,
  sourceHistory:
    "tracked-pr467-no-avpd-four-chamber-hill-triseg-candidate-artifacts" as const,
  sourceHistoryMutationAllowed: false as const,
  sourceHillReplay:
    "recursive-replay-from-first-recorded-accepted-wall-state" as const,
  landReplay:
    "recursive-active-only-replay-initialized-at-first-recorded-history-point" as const,
  externalSeriesElasticElementAddedToLand: false as const,
  postHocForceVelocityMultiplierAddedToLand: false as const,
  activeStressGainAddedToLand: false as const,
  closedLoopFeedbackOfLandStress: false as const,
  physiologyCalibrationClaimed: false as const,
  winnerSelectionAllowed: false as const,
  plotVertices: "all-final-beat-accepted-step-endpoints-no-smoothing" as const,
});

export type Pr467LaAcceptedHistoryCandidateIdV1 =
  | "ALG_SLS4"
  | "ALG_SLS8"
  | "LAG25_SLS4"
  | "LAG25_SLS8";

export type Pr467LaAcceptedHistorySampleV1 = {
  readonly timeSec: number;
  readonly beatIndex: number;
  readonly phase01: number;
  readonly laVolumeMl: number;
  readonly lvVolumeMl: number;
  readonly laPressureMmHg: number;
  readonly lvPressureMmHg: number;
  readonly mitralFlowMlPerSec: number;
  readonly freeCalciumUm: number;
  readonly midpointFreeCalciumUm: number;
  readonly totalFiberLogStrain: number;
  readonly sourceAcceptedHillState: HillCeSeeSlsStateV1;
  readonly sourceHillTotalStressPa: number;
  readonly sourceHillActiveStressPa: number;
  readonly sourceHillPassiveStressPa: number;
  readonly sourceHillSlsOverstressPa: number;
  readonly sourceHillForceVelocityFactor: number;
};

export type Pr467LaAcceptedHistoryV1 = {
  readonly candidateId: Pr467LaAcceptedHistoryCandidateIdV1;
  readonly sourceArtifactPath: string;
  readonly sourceNormalizedSha256: string;
  readonly sourceCompressedSha256: string;
  readonly dtSec: number;
  readonly geometry: OneFiberVolumeGeometryParamsV1;
  readonly sourceHillMaterial: HillCeSeeSlsParamsV1;
  /** Two complete retained beats plus the following exact cycle boundary. */
  readonly samples: readonly Pr467LaAcceptedHistorySampleV1[];
};

export type Pr467LaAcceptedHistoryReplayTraceSampleV1 = {
  readonly sourceSampleIndex: number;
  readonly timeSec: number;
  readonly phase01: number;
  /** Final cycle boundary is represented at 1 rather than wrapping to 0. */
  readonly plotPhase01: number;
  readonly laVolumeMl: number;
  readonly lvVolumeMl: number;
  readonly laPressureMmHg: number;
  readonly lvPressureMmHg: number;
  readonly mitralFlowMlPerSec: number;
  readonly freeCalciumUm: number;
  readonly midpointFreeCalciumUm: number;
  readonly totalFiberLogStrain: number;
  readonly sourceHillActiveStressKPa: number;
  readonly replayHillActiveStressKPa: number;
  readonly landActiveStressKPa: number;
  readonly sourceHillProjectedActivePressureMmHg: number;
  readonly landProjectedActivePressureMmHg: number;
  readonly sourceHillPassiveStressKPa: number;
  readonly sourceHillSlsOverstressKPa: number;
  readonly sourceHillTotalStressKPa: number;
  readonly sourceHillForceVelocityFactor: number;
};

export type Pr467LaAcceptedHistoryReplayResultV1 = ReturnType<
  typeof replayPr467LaAcceptedHistoryV1
>;

export function replayPr467LaAcceptedHistoryV1(
  history: Pr467LaAcceptedHistoryV1,
) {
  validateHistory(history);
  const preparedHill = prepareHillCeSeeSlsParamsV1(history.sourceHillMaterial);
  let hillState: HillCeSeeSlsStateV1 = Object.freeze({
    ...history.samples[0]!.sourceAcceptedHillState,
  });
  let landState = initialLand2017ActiveOnlyStateV1(
    history.samples[0]!.totalFiberLogStrain,
    history.samples[0]!.freeCalciumUm,
  );
  let firstFailure: string | null = null;
  let maximumAbsoluteHillStateClosureError = 0;
  let maximumAbsoluteHillTotalStressClosurePa = 0;
  let maximumAbsoluteHillActiveStressClosurePa = 0;
  let maximumAbsoluteGeometryStrainClosure = 0;
  let maximumAbsoluteLandContinuousPowerResidualWPerM3 = 0;
  let maximumAbsoluteLandDiscretePowerResidualWPerM3 = 0;
  let maximumAbsoluteLandSourceReportedPowerResidualWPerM3 = 0;
  let maximumAbsoluteLandFiniteDifferenceWorkResidualPa = 0;
  let maximumLandStateConservationResidual = 0;
  let minimumLandPopulation = Number.POSITIVE_INFINITY;
  let landProjectionOccurred = false;
  const allStepTrace: Pr467LaAcceptedHistoryReplayTraceSampleV1[] = [];

  for (let index = 1; index < history.samples.length; index += 1) {
    const sample = history.samples[index]!;
    const geometry = evaluateOneFiberVolumeGeometryV1(
      sample.laVolumeMl,
      history.geometry,
    );
    maximumAbsoluteGeometryStrainClosure = Math.max(
      maximumAbsoluteGeometryStrainClosure,
      Math.abs(geometry.fiberNaturalStrain - sample.totalFiberLogStrain),
    );
    const hillTrial = trialHillCeSeeSlsV1(
      hillState,
      {
        dtSec: history.dtSec,
        totalStrain: sample.totalFiberLogStrain,
        freeCalciumUm: sample.freeCalciumUm,
        midpointFreeCalciumUm: sample.midpointFreeCalciumUm,
      },
      preparedHill,
    );
    if (!hillTrial.valid || !hillTrial.finite || !hillTrial.solver.converged) {
      firstFailure = `hill-step-${index}:${hillTrial.issues.map((issue) => issue.code).join(",")}`;
      break;
    }
    maximumAbsoluteHillStateClosureError = Math.max(
      maximumAbsoluteHillStateClosureError,
      maximumStateDifference(
        hillTrial.nextState,
        sample.sourceAcceptedHillState,
      ),
    );
    maximumAbsoluteHillTotalStressClosurePa = Math.max(
      maximumAbsoluteHillTotalStressClosurePa,
      Math.abs(
        hillTrial.readback.stresses.totalTransmittedPa -
          sample.sourceHillTotalStressPa,
      ),
    );
    maximumAbsoluteHillActiveStressClosurePa = Math.max(
      maximumAbsoluteHillActiveStressClosurePa,
      Math.abs(
        hillTrial.readback.stresses.seriesElasticTensionPa -
          sample.sourceHillActiveStressPa,
      ),
    );

    const landTrial = trialLand2017ActiveOnlyV1(landState, {
      dtSec: history.dtSec,
      fiberLogStrain: sample.totalFiberLogStrain,
      freeCalciumUm: sample.freeCalciumUm,
    });
    if (
      !landTrial.valid ||
      !landTrial.finite ||
      landTrial.nextState == null ||
      landTrial.readback == null
    ) {
      firstFailure = `land-step-${index}:${landTrial.issues.join(",")}`;
      break;
    }
    const landReadback = landTrial.readback;
    maximumAbsoluteLandContinuousPowerResidualWPerM3 = Math.max(
      maximumAbsoluteLandContinuousPowerResidualWPerM3,
      Math.abs(landReadback.continuousPowerResidualWPerM3),
    );
    maximumAbsoluteLandDiscretePowerResidualWPerM3 = Math.max(
      maximumAbsoluteLandDiscretePowerResidualWPerM3,
      Math.abs(landReadback.discretePowerResidualWPerM3),
    );
    maximumAbsoluteLandSourceReportedPowerResidualWPerM3 = Math.max(
      maximumAbsoluteLandSourceReportedPowerResidualWPerM3,
      Math.abs(landReadback.sourceReportedPowerResidualWPerM3),
    );
    maximumAbsoluteLandFiniteDifferenceWorkResidualPa = Math.max(
      maximumAbsoluteLandFiniteDifferenceWorkResidualPa,
      Math.abs(landReadback.finiteDifferenceWorkConjugacyResidualPa),
    );
    maximumLandStateConservationResidual = Math.max(
      maximumLandStateConservationResidual,
      Math.abs(landReadback.health.stateConservationResidual),
    );
    minimumLandPopulation = Math.min(
      minimumLandPopulation,
      landReadback.health.minimumPopulation,
    );
    landProjectionOccurred ||= landReadback.health.projectionUsed;

    const sourceActivePressureMmHg =
      oneFiberCavityPressurePaV1(
        geometry,
        sample.sourceHillActiveStressPa,
      ) / PA_PER_MMHG;
    const landActivePressureMmHg =
      oneFiberCavityPressurePaV1(
        geometry,
        landReadback.wallActiveKirchhoffStressPa,
      ) / PA_PER_MMHG;
    allStepTrace.push(Object.freeze({
      sourceSampleIndex: index,
      timeSec: sample.timeSec,
      phase01: sample.phase01,
      plotPhase01: sample.phase01,
      laVolumeMl: sample.laVolumeMl,
      lvVolumeMl: sample.lvVolumeMl,
      laPressureMmHg: sample.laPressureMmHg,
      lvPressureMmHg: sample.lvPressureMmHg,
      mitralFlowMlPerSec: sample.mitralFlowMlPerSec,
      freeCalciumUm: sample.freeCalciumUm,
      midpointFreeCalciumUm: sample.midpointFreeCalciumUm,
      totalFiberLogStrain: sample.totalFiberLogStrain,
      sourceHillActiveStressKPa: sample.sourceHillActiveStressPa / 1_000,
      replayHillActiveStressKPa:
        hillTrial.readback.stresses.seriesElasticTensionPa / 1_000,
      landActiveStressKPa:
        landReadback.wallActiveKirchhoffStressPa / 1_000,
      sourceHillProjectedActivePressureMmHg: sourceActivePressureMmHg,
      landProjectedActivePressureMmHg: landActivePressureMmHg,
      sourceHillPassiveStressKPa: sample.sourceHillPassiveStressPa / 1_000,
      sourceHillSlsOverstressKPa: sample.sourceHillSlsOverstressPa / 1_000,
      sourceHillTotalStressKPa: sample.sourceHillTotalStressPa / 1_000,
      sourceHillForceVelocityFactor: sample.sourceHillForceVelocityFactor,
    }));
    hillState = commitHillCeSeeSlsTrialV1(hillTrial);
    landState = commitLand2017ActiveOnlyTrialV1(landTrial);
  }

  const finalBoundaryBeatIndex = Math.max(
    ...history.samples.map((sample) => sample.beatIndex),
  );
  const finalCompleteBeatIndex = finalBoundaryBeatIndex - 1;
  const trace = allStepTrace
    .filter((sample) =>
      sample.phase01 === 0
        ? sample.timeSec >=
          history.samples.find((source) =>
            source.beatIndex === finalCompleteBeatIndex && source.phase01 === 0
          )!.timeSec
        : history.samples[sample.sourceSampleIndex]!.beatIndex ===
          finalCompleteBeatIndex,
    )
    .map((sample, index, selected) =>
      index === selected.length - 1 && sample.phase01 === 0
        ? Object.freeze({ ...sample, plotPhase01: 1 })
        : sample,
    );
  const hillClosurePass =
    maximumAbsoluteHillStateClosureError <= 1e-12 &&
    maximumAbsoluteHillTotalStressClosurePa <= 1e-8 &&
    maximumAbsoluteHillActiveStressClosurePa <= 1e-8 &&
    maximumAbsoluteGeometryStrainClosure <= 1e-12;
  const landStateHealthPass =
    minimumLandPopulation >= -1e-12 &&
    maximumLandStateConservationResidual <= 1e-10 &&
    !landProjectionOccurred;
  const landWorkMappingPass =
    maximumAbsoluteLandContinuousPowerResidualWPerM3 <= 1e-8 &&
    maximumAbsoluteLandDiscretePowerResidualWPerM3 <= 1e-8 &&
    maximumAbsoluteLandSourceReportedPowerResidualWPerM3 <= 1e-8 &&
    maximumAbsoluteLandFiniteDifferenceWorkResidualPa <= 1e-5;
  const status =
    firstFailure == null &&
    trace.length === 201 &&
    hillClosurePass &&
    landStateHealthPass &&
    landWorkMappingPass
      ? "pass"
      : "fail";

  return Object.freeze({
    benchId: PR467_LA_ACCEPTED_HISTORY_ACTIVE_REPLAY_BENCH_ID_V1,
    claim: PR467_LA_ACCEPTED_HISTORY_ACTIVE_REPLAY_CLAIM_V1,
    status,
    candidateId: history.candidateId,
    sourceArtifactPath: history.sourceArtifactPath,
    sourceNormalizedSha256: history.sourceNormalizedSha256,
    sourceCompressedSha256: history.sourceCompressedSha256,
    dtSec: history.dtSec,
    sourceSampleCount: history.samples.length,
    replayedTransitionCount: allStepTrace.length,
    finalBeatRawVertexCount: trace.length,
    firstFailure,
    gates: Object.freeze({
      hillClosurePass,
      landStateHealthPass,
      landWorkMappingPass,
      finalBeatHasAllAcceptedStepEndpoints: trace.length === 201,
    }),
    diagnostics: Object.freeze({
      maximumAbsoluteHillStateClosureError,
      maximumAbsoluteHillTotalStressClosurePa,
      maximumAbsoluteHillActiveStressClosurePa,
      maximumAbsoluteGeometryStrainClosure,
      maximumAbsoluteLandContinuousPowerResidualWPerM3,
      maximumAbsoluteLandDiscretePowerResidualWPerM3,
      maximumAbsoluteLandSourceReportedPowerResidualWPerM3,
      maximumAbsoluteLandFiniteDifferenceWorkResidualPa,
      maximumLandStateConservationResidual,
      minimumLandPopulation,
      landProjectionOccurred,
    }),
    summary: summarizeTrace(trace),
    trace: Object.freeze(trace),
  });
}

function summarizeTrace(
  trace: readonly Pr467LaAcceptedHistoryReplayTraceSampleV1[],
) {
  if (trace.length === 0) {
    return Object.freeze({
      sourceHillPeakActiveStressKPa: null,
      sourceHillPeakPhase01: null,
      landPeakActiveStressKPa: null,
      landPeakPhase01: null,
      landMinusHillPeakPhase01: null,
      landToHillPeakActiveStressRatio: null,
    });
  }
  const hillPeak = maximumSample(
    trace,
    (sample) => sample.sourceHillActiveStressKPa,
  );
  const landPeak = maximumSample(trace, (sample) => sample.landActiveStressKPa);
  return Object.freeze({
    sourceHillPeakActiveStressKPa: hillPeak.sourceHillActiveStressKPa,
    sourceHillPeakPhase01: hillPeak.plotPhase01,
    landPeakActiveStressKPa: landPeak.landActiveStressKPa,
    landPeakPhase01: landPeak.plotPhase01,
    landMinusHillPeakPhase01:
      shortestSignedPhaseDifference01(
        landPeak.plotPhase01,
        hillPeak.plotPhase01,
      ),
    landToHillPeakActiveStressRatio:
      landPeak.landActiveStressKPa / hillPeak.sourceHillActiveStressKPa,
  });
}

function shortestSignedPhaseDifference01(left: number, right: number): number {
  const raw = left - right;
  return raw - Math.round(raw);
}

function maximumSample<T>(
  samples: readonly T[],
  value: (sample: T) => number,
): T {
  return samples.reduce((best, sample) =>
    value(sample) > value(best) ? sample : best
  );
}

function maximumStateDifference(
  left: HillCeSeeSlsStateV1,
  right: HillCeSeeSlsStateV1,
): number {
  return Math.max(
    Math.abs(left.totalStrain - right.totalStrain),
    Math.abs(left.ceStrain - right.ceStrain),
    Math.abs(left.slsOverstressPa - right.slsOverstressPa),
    Math.abs(left.caTroponin01 - right.caTroponin01),
    Math.abs(
      (left.thinFilamentAvailability01 ?? 0) -
        (right.thinFilamentAvailability01 ?? 0),
    ),
  );
}

function validateHistory(history: Pr467LaAcceptedHistoryV1): void {
  if (history.samples.length < 3) {
    throw new Error("accepted history must contain at least three samples");
  }
  if (!(history.dtSec > 0) || !Number.isFinite(history.dtSec)) {
    throw new Error("history dtSec must be positive and finite");
  }
  for (let index = 1; index < history.samples.length; index += 1) {
    const delta =
      history.samples[index]!.timeSec - history.samples[index - 1]!.timeSec;
    if (Math.abs(delta - history.dtSec) > 1e-10) {
      throw new Error(`accepted history has a time-step gap at sample ${index}`);
    }
  }
}
