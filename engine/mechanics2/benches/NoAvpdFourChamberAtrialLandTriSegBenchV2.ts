import {
  DEFAULT_NO_AVPD_FOUR_CHAMBER_ATRIAL_LAND_TRISEG_PARAMS_V2,
  NO_AVPD_FOUR_CHAMBER_ATRIAL_LAND_TRISEG_CLAIM_BOUNDARY_V2,
  NO_AVPD_FOUR_CHAMBER_ATRIAL_LAND_TRISEG_EQUATIONS_VERSION_ID_V2,
  NO_AVPD_FOUR_CHAMBER_ATRIAL_LAND_TRISEG_MODEL_ID_V2,
  NO_AVPD_FOUR_CHAMBER_ATRIAL_LAND_TRISEG_RHYTHM_TOPOLOGY_ID_V2,
  NO_AVPD_FOUR_CHAMBER_ATRIAL_LAND_TRISEG_STATE_LAYOUT_ID_V2,
  noAvpdFourChamberAtrialLandParameterIdentityV2,
  initialNoAvpdFourChamberAtrialLandTriSegStateV2,
  stepNoAvpdFourChamberAtrialLandTriSegV2,
  totalBloodVolumeMl,
  type NoAvpdFourChamberAtrialLandTriSegParamsV2,
  type NoAvpdFourChamberAtrialLandTriSegStateV2,
} from "@/engine/mechanics2/subsystems/NoAvpdFourChamberAtrialLandTriSegV2";

export const NO_AVPD_FOUR_CHAMBER_ATRIAL_LAND_TRISEG_BENCH_ID_V2 =
  "no-avpd-four-chamber-atrial-land-triseg-bench-v2" as const;

export type NoAvpdFourChamberAtrialLandWarmStartProvenanceV2 = {
  readonly resumeMode: "exact-same-parameter-checkpoint";
  readonly sourceArtifactId: string;
  readonly sourceNormalizedSha256: string;
  readonly sourceParameterSha256: string;
  readonly sourceImplementationSha256: string;
  readonly sourceHarnessSha256: string;
  readonly sourceCheckpointStateSha256: string;
  readonly sourceModelId: typeof NO_AVPD_FOUR_CHAMBER_ATRIAL_LAND_TRISEG_MODEL_ID_V2;
  readonly sourceEquationsVersionId: typeof NO_AVPD_FOUR_CHAMBER_ATRIAL_LAND_TRISEG_EQUATIONS_VERSION_ID_V2;
  readonly sourceStateLayoutId: typeof NO_AVPD_FOUR_CHAMBER_ATRIAL_LAND_TRISEG_STATE_LAYOUT_ID_V2;
  readonly sourceRhythmTopologyId: typeof NO_AVPD_FOUR_CHAMBER_ATRIAL_LAND_TRISEG_RHYTHM_TOPOLOGY_ID_V2;
  readonly sourceCycleLengthSec: number;
  readonly sourceDtSec: number;
  readonly sourceTotalBloodVolumeMl: number;
  readonly periodClassification:
    | "one-beat-return-within-caller-tolerance"
    | "unclassified";
};

export type NoAvpdFourChamberAtrialLandBenchOptionsV2 = {
  readonly beats?: number;
  readonly dtSec?: number;
  readonly params?: NoAvpdFourChamberAtrialLandTriSegParamsV2;
  /** Exact accepted state at a cardiac-cycle boundary; never a failed trial. */
  readonly initialState?: NoAvpdFourChamberAtrialLandTriSegStateV2;
  /** Required whenever initialState is supplied. */
  readonly warmStartProvenance?: NoAvpdFourChamberAtrialLandWarmStartProvenanceV2;
  /**
   * Optional caller-owned limit-cycle criterion.  The bench deliberately does
   * not provide a default because no normal-human or numerical tolerance has
   * yet been justified for this heterogeneous full-state return map.
   */
  readonly fullStateReturnMapMaxAbsDimensionlessTolerance?: number;
};

export type NoAvpdFourChamberAtrialLandBenchSampleV2 = {
  readonly timeSec: number;
  readonly beatIndex: number;
  readonly phase01: number;
  readonly volumesMl: NoAvpdFourChamberAtrialLandTriSegStateV2["volumes"];
  readonly pressuresMmHg: {
    readonly la: number;
    readonly lv: number;
    readonly ra: number;
    readonly rv: number;
    readonly systemicArtery: number;
    readonly pulmonaryArtery: number;
  };
  readonly flowsMlPerSec: {
    readonly mv: number;
    readonly aortic: number;
    readonly tricuspid: number;
    readonly pulmonaryValve: number;
    readonly pulmonaryVenous: number;
  };
  readonly freeCalciumUm: {
    readonly la: number;
    readonly ra: number;
    readonly lvFreeWall: number;
  };
  readonly leftAtrium: {
    readonly fiberLogStrain: number;
    readonly landStates: Readonly<Record<"CaTRPN" | "B" | "W" | "S" | "zetaW" | "zetaS", number>>;
    readonly sourceNominalActiveStressKPa: number;
    readonly activeKirchhoffStressKPa: number;
    readonly passiveStressKPa: number;
    readonly slsOverstressKPa: number;
    readonly totalStressKPa: number;
    readonly activeContinuousPowerResidualWPerM3: number;
    readonly activeDiscretePowerResidualWPerM3: number;
    readonly activeSourceReportedPowerResidualWPerM3: number;
    readonly activeFiniteDifferenceWorkResidualPa: number;
    readonly slsBalanceResidualJPerM3: number;
    readonly landMinimumPopulation: number;
    readonly landStateConservationResidual: number;
    readonly landProjectionUsed: boolean;
  };
  readonly numeric: {
    readonly globalIterations: number;
    readonly globalMaxScaledResidual: number;
    readonly globalLineSearchBacktracks: number;
    readonly triSegRelativeResidual: number;
    readonly totalBloodVolumeResidualMl: number;
  };
};

export type NoAvpdFourChamberAtrialLandBenchResultV2 = ReturnType<
  typeof runNoAvpdFourChamberAtrialLandTriSegBenchV2
>;

export function runNoAvpdFourChamberAtrialLandTriSegBenchV2(
  options: NoAvpdFourChamberAtrialLandBenchOptionsV2 = {},
) {
  const beats = options.beats ?? 12;
  const dtSec = options.dtSec ?? 0.001;
  const params = options.params ??
    DEFAULT_NO_AVPD_FOUR_CHAMBER_ATRIAL_LAND_TRISEG_PARAMS_V2;
  const fullStateReturnMapTolerance =
    options.fullStateReturnMapMaxAbsDimensionlessTolerance;
  validateOptions(
    beats,
    dtSec,
    params.cycleLengthSec,
    fullStateReturnMapTolerance,
  );
  if (options.initialState == null && options.warmStartProvenance != null) {
    throw new Error("warmStartProvenance requires initialState");
  }
  const stepsPerCycle = Math.round(params.cycleLengthSec / dtSec);
  const stepCount = beats * stepsPerCycle;
  const retainFromAcceptedStep = Math.max(0, (beats - 2) * stepsPerCycle);
  const coldInitial = initialNoAvpdFourChamberAtrialLandTriSegStateV2(params);
  let state = options.initialState ?? coldInitial;
  validateBenchInitialization(
    state,
    coldInitial,
    params,
    dtSec,
    options.initialState == null ? null : options.warmStartProvenance ?? null,
    options.initialState != null,
  );
  const initialBloodVolumeMl = totalBloodVolumeMl(state.volumes);
  const initialTimeSec = state.timeSec;
  const samples: NoAvpdFourChamberAtrialLandBenchSampleV2[] = [];
  const boundaryStates: NoAvpdFourChamberAtrialLandTriSegStateV2[] = [state];
  let firstFailure: string | null = null;
  let stepsAccepted = 0;
  let maximumAbsoluteTotalBloodVolumeDriftMl = 0;
  let maximumAbsoluteStepBloodVolumeResidualMl = 0;
  let maximumGlobalScaledResidual = 0;
  let maximumTriSegRelativeResidual = 0;
  let maximumHillSerialEquilibriumResidualPa = 0;
  let maximumHillSlsBalanceResidualJPerM3 = 0;
  let maximumLaSlsBalanceResidualJPerM3 = 0;
  let maximumLandContinuousPowerResidualWPerM3 = 0;
  let maximumLandDiscretePowerResidualWPerM3 = 0;
  let maximumLandSourceReportedPowerResidualWPerM3 = 0;
  let maximumLandFiniteDifferenceWorkResidualPa = 0;
  let maximumLandStateConservationResidual = 0;
  let minimumLandPopulation = Number.POSITIVE_INFINITY;
  let landProjectionOccurred = false;
  let totalGlobalIterations = 0;
  let totalGlobalResidualEvaluations = 0;
  let totalGlobalJacobianEvaluations = 0;
  let totalGlobalLineSearchBacktracks = 0;
  let maximumGlobalIterationsPerStep = 0;
  let minimumCompartmentVolumeMl = Number.POSITIVE_INFINITY;
  let minimumCompartmentVolumePath = "";
  let minimumCompartmentVolumeTimeSec = state.timeSec;

  ({
    minimumCompartmentVolumeMl,
    minimumCompartmentVolumePath,
    minimumCompartmentVolumeTimeSec,
  } = updateMinimumCompartmentVolume(
    state,
    minimumCompartmentVolumeMl,
    minimumCompartmentVolumePath,
    minimumCompartmentVolumeTimeSec,
  ));

  for (let stepIndex = 0; stepIndex < stepCount; stepIndex += 1) {
    const output = stepNoAvpdFourChamberAtrialLandTriSegV2(
      state,
      dtSec,
      params,
    );
    totalGlobalIterations += output.solver.iterations;
    totalGlobalResidualEvaluations += output.solver.residualEvaluations;
    totalGlobalJacobianEvaluations += output.solver.jacobianEvaluations;
    totalGlobalLineSearchBacktracks += output.solver.lineSearchBacktracks;
    maximumGlobalIterationsPerStep = Math.max(
      maximumGlobalIterationsPerStep,
      output.solver.iterations,
    );
    if (!output.accepted || output.evaluation == null) {
      firstFailure = `step-${stepIndex}:${output.failureReasons.join(",")}`;
      break;
    }
    state = output.state;
    stepsAccepted += 1;
    ({
      minimumCompartmentVolumeMl,
      minimumCompartmentVolumePath,
      minimumCompartmentVolumeTimeSec,
    } = updateMinimumCompartmentVolume(
      state,
      minimumCompartmentVolumeMl,
      minimumCompartmentVolumePath,
      minimumCompartmentVolumeTimeSec,
    ));
    if ((stepIndex + 1) % stepsPerCycle === 0) {
      boundaryStates.push(state);
      if (boundaryStates.length > 3) boundaryStates.shift();
    }
    const evaluation = output.evaluation;
    const laTrial = evaluation.leftAtrium.materialTrial;
    const laActive = laTrial.activeTrial.readback!;
    const laPassive = laTrial.passiveSlsTrial.readback!;
    const hillTrials = [
      evaluation.rightAtrium.materialTrial,
      ...Object.values(evaluation.ventricles.materialTrials),
    ];
    const bloodVolumeDriftMl =
      totalBloodVolumeMl(state.volumes) - initialBloodVolumeMl;
    const stepBloodVolumeResidualMl =
      output.totalBloodVolumeResidualMl ?? Number.NaN;
    maximumAbsoluteTotalBloodVolumeDriftMl = Math.max(
      maximumAbsoluteTotalBloodVolumeDriftMl,
      Math.abs(bloodVolumeDriftMl),
    );
    maximumAbsoluteStepBloodVolumeResidualMl = Math.max(
      maximumAbsoluteStepBloodVolumeResidualMl,
      Math.abs(stepBloodVolumeResidualMl),
    );
    maximumGlobalScaledResidual = Math.max(
      maximumGlobalScaledResidual,
      output.solver.maxScaledResidual,
    );
    maximumTriSegRelativeResidual = Math.max(
      maximumTriSegRelativeResidual,
      evaluation.ventricles.triSeg.diagnostics.relativeResidualMagnitude,
    );
    maximumHillSerialEquilibriumResidualPa = Math.max(
      maximumHillSerialEquilibriumResidualPa,
      ...hillTrials.map((trial) =>
        Math.abs(trial.readback.stresses.serialEquilibriumResidualPa)
      ),
    );
    maximumHillSlsBalanceResidualJPerM3 = Math.max(
      maximumHillSlsBalanceResidualJPerM3,
      ...hillTrials.map((trial) =>
        Math.abs(trial.readback.slsBalance.discreteBalanceResidualJPerM3)
      ),
    );
    maximumLaSlsBalanceResidualJPerM3 = Math.max(
      maximumLaSlsBalanceResidualJPerM3,
      Math.abs(laPassive.slsBalance.discreteBalanceResidualJPerM3),
    );
    maximumLandContinuousPowerResidualWPerM3 = Math.max(
      maximumLandContinuousPowerResidualWPerM3,
      Math.abs(laActive.continuousPowerResidualWPerM3),
    );
    maximumLandDiscretePowerResidualWPerM3 = Math.max(
      maximumLandDiscretePowerResidualWPerM3,
      Math.abs(laActive.discretePowerResidualWPerM3),
    );
    maximumLandSourceReportedPowerResidualWPerM3 = Math.max(
      maximumLandSourceReportedPowerResidualWPerM3,
      Math.abs(laActive.sourceReportedPowerResidualWPerM3),
    );
    maximumLandFiniteDifferenceWorkResidualPa = Math.max(
      maximumLandFiniteDifferenceWorkResidualPa,
      Math.abs(laActive.finiteDifferenceWorkConjugacyResidualPa),
    );
    maximumLandStateConservationResidual = Math.max(
      maximumLandStateConservationResidual,
      Math.abs(laActive.health.stateConservationResidual),
    );
    minimumLandPopulation = Math.min(
      minimumLandPopulation,
      laActive.health.minimumPopulation,
    );
    landProjectionOccurred ||= laActive.health.projectionUsed;

    const acceptedStep = stepIndex + 1;
    if (acceptedStep >= retainFromAcceptedStep) {
      const beatIndex = Math.floor(acceptedStep / stepsPerCycle);
      const phase01 = (acceptedStep % stepsPerCycle) / stepsPerCycle;
      samples.push(Object.freeze({
        timeSec: state.timeSec,
        beatIndex,
        phase01,
        volumesMl: state.volumes,
        pressuresMmHg: Object.freeze({
          la: evaluation.pressures.leftAtriumMmHg,
          lv: evaluation.pressures.leftVentricleMmHg,
          ra: evaluation.pressures.rightAtriumMmHg,
          rv: evaluation.pressures.rightVentricleMmHg,
          systemicArtery: evaluation.pressures.systemicArteryMmHg,
          pulmonaryArtery: evaluation.pressures.pulmonaryArteryMmHg,
        }),
        flowsMlPerSec: Object.freeze({
          mv: evaluation.flowReadback.mitralMlPerSec,
          aortic: evaluation.flowReadback.aorticMlPerSec,
          tricuspid: evaluation.flowReadback.tricuspidMlPerSec,
          pulmonaryValve: evaluation.flowReadback.pulmonaryValveMlPerSec,
          pulmonaryVenous: evaluation.flowReadback.pulmonaryVenousMlPerSec,
        }),
        freeCalciumUm: Object.freeze({
          la: evaluation.freeCalciumUm.leftAtrium,
          ra: evaluation.freeCalciumUm.rightAtrium,
          lvFreeWall: evaluation.freeCalciumUm.leftFreeWall,
        }),
        leftAtrium: Object.freeze({
          fiberLogStrain: evaluation.leftAtrium.geometry.fiberNaturalStrain,
          landStates: laActive.state,
          sourceNominalActiveStressKPa:
            laActive.sourceNominalActiveStressPa / 1_000,
          activeKirchhoffStressKPa:
            laActive.wallActiveKirchhoffStressPa / 1_000,
          passiveStressKPa:
            laPassive.passiveEquilibriumStressPa / 1_000,
          slsOverstressKPa: laPassive.slsOverstressPa / 1_000,
          totalStressKPa:
            laTrial.readback!.stresses.totalTransmittedPa / 1_000,
          activeContinuousPowerResidualWPerM3:
            laActive.continuousPowerResidualWPerM3,
          activeDiscretePowerResidualWPerM3:
            laActive.discretePowerResidualWPerM3,
          activeSourceReportedPowerResidualWPerM3:
            laActive.sourceReportedPowerResidualWPerM3,
          activeFiniteDifferenceWorkResidualPa:
            laActive.finiteDifferenceWorkConjugacyResidualPa,
          slsBalanceResidualJPerM3:
            laPassive.slsBalance.discreteBalanceResidualJPerM3,
          landMinimumPopulation: laActive.health.minimumPopulation,
          landStateConservationResidual:
            laActive.health.stateConservationResidual,
          landProjectionUsed: laActive.health.projectionUsed,
        }),
        numeric: Object.freeze({
          globalIterations: output.solver.iterations,
          globalMaxScaledResidual: output.solver.maxScaledResidual,
          globalLineSearchBacktracks: output.solver.lineSearchBacktracks,
          triSegRelativeResidual:
            evaluation.ventricles.triSeg.diagnostics.relativeResidualMagnitude,
          totalBloodVolumeResidualMl: stepBloodVolumeResidualMl,
        }),
      }));
    }
  }

  const complete = stepsAccepted === stepCount;
  const expectedRetainedSampleCount = 2 * stepsPerCycle + 1;
  const finalCompleteBeatIndex = complete ? beats - 1 : null;
  const lastBeatSamples = finalCompleteBeatIndex == null
    ? []
    : samples
      .filter((sample) =>
        sample.beatIndex === finalCompleteBeatIndex ||
        (sample.beatIndex === beats && sample.phase01 === 0)
      )
      .map((sample, index, selected) =>
        index === selected.length - 1 && sample.phase01 === 0
          ? Object.freeze({ ...sample, phase01: 1 })
          : sample
      );
  const returnMap = boundaryStates.length >= 2
    ? normalizedStateDrift(
        boundaryStates[boundaryStates.length - 2]!,
        boundaryStates[boundaryStates.length - 1]!,
      )
    : null;
  const returnMapGate = Object.freeze({
    evidenceStatus: fullStateReturnMapTolerance == null
      ? "eligible-not-applied-caller-threshold-required" as const
      : "caller-threshold-applied" as const,
    eligible:
      returnMap != null &&
      returnMap.allComponentsFinite &&
      Number.isFinite(returnMap.maxAbsDimensionless) &&
      Number.isFinite(returnMap.rmsDimensionless),
    applied: fullStateReturnMapTolerance != null,
    callerSuppliedMaxAbsDimensionlessTolerance:
      fullStateReturnMapTolerance ?? null,
    pass: fullStateReturnMapTolerance == null
      ? null
      : returnMap != null &&
        returnMap.allComponentsFinite &&
        Number.isFinite(returnMap.maxAbsDimensionless) &&
        returnMap.maxAbsDimensionless <= fullStateReturnMapTolerance,
  });
  const numericalGates = Object.freeze({
    allRequestedStepsAccepted: complete,
    retainedEveryAcceptedEndpoint:
      complete && samples.length === expectedRetainedSampleCount,
    finalBeatHasEveryAcceptedEndpoint:
      complete && lastBeatSamples.length === stepsPerCycle + 1,
    bloodVolumeLedger:
      maximumAbsoluteTotalBloodVolumeDriftMl <=
        params.solver.totalBloodVolumeToleranceMl &&
      maximumAbsoluteStepBloodVolumeResidualMl <=
        params.solver.totalBloodVolumeToleranceMl,
    positiveCompartmentVolumes: minimumCompartmentVolumeMl > 0,
    globalNewton: maximumGlobalScaledResidual <= params.solver.residualTolerance,
    triSeg:
      maximumTriSegRelativeResidual <=
        params.solver.triSegRelativeResidualTolerance,
    hillSerialEquilibrium: maximumHillSerialEquilibriumResidualPa <= 1e-3,
    allSlsWorkBalance:
      maximumHillSlsBalanceResidualJPerM3 <= 1e-8 &&
      maximumLaSlsBalanceResidualJPerM3 <= 1e-8,
    landStateHealth:
      minimumLandPopulation >= -1e-12 &&
      maximumLandStateConservationResidual <= 1e-10 &&
      !landProjectionOccurred,
    landWorkMapping:
      maximumLandContinuousPowerResidualWPerM3 <= 1e-8 &&
      maximumLandDiscretePowerResidualWPerM3 <= 1e-8 &&
      maximumLandSourceReportedPowerResidualWPerM3 <= 1e-8 &&
      maximumLandFiniteDifferenceWorkResidualPa <= 1e-5,
    ...(fullStateReturnMapTolerance == null
      ? {}
      : { fullStateBeatReturnMap: returnMapGate.pass === true }),
  });
  const status = Object.values(numericalGates).every(Boolean)
    ? "pass" as const
    : "fail" as const;

  return Object.freeze({
    benchId: NO_AVPD_FOUR_CHAMBER_ATRIAL_LAND_TRISEG_BENCH_ID_V2,
    statusScope: "structural-numerical-only" as const,
    status,
    failureReason: firstFailure,
    model: Object.freeze({
      modelId: NO_AVPD_FOUR_CHAMBER_ATRIAL_LAND_TRISEG_MODEL_ID_V2,
      equationsVersionId:
        NO_AVPD_FOUR_CHAMBER_ATRIAL_LAND_TRISEG_EQUATIONS_VERSION_ID_V2,
      stateLayoutId:
        NO_AVPD_FOUR_CHAMBER_ATRIAL_LAND_TRISEG_STATE_LAYOUT_ID_V2,
      rhythmTopologyId:
        NO_AVPD_FOUR_CHAMBER_ATRIAL_LAND_TRISEG_RHYTHM_TOPOLOGY_ID_V2,
      claimBoundary:
        NO_AVPD_FOUR_CHAMBER_ATRIAL_LAND_TRISEG_CLAIM_BOUNDARY_V2,
    }),
    protocol: Object.freeze({
      beatsRequested: beats,
      dtSec,
      stepsPerCycle,
      heartRateBpm: 60 / params.cycleLengthSec,
      initialization: Object.freeze({
        mode: options.initialState == null
          ? "independent-cold-start" as const
          : "exact-cycle-boundary-warm-resume" as const,
        initialTimeSec,
        phaseAnchor: "cycle-boundary" as const,
        warmStartIsAcceptanceEvidence: false as const,
        provenanceVerification: "caller-owned-runner-may-verify" as const,
        provenance:
          options.initialState == null
            ? null
            : options.warmStartProvenance ?? null,
      }),
      retainedWindow: "last-two-complete-beats-plus-final-boundary" as const,
      sampling: "every-accepted-step-endpoint-no-smoothing" as const,
      physiologyGateApplied: false as const,
      limitCycleGateApplied: returnMapGate.applied,
      limitCycleGatePolicy: returnMapGate.evidenceStatus,
      runtimeAdoptionClaimed: false as const,
    }),
    parameterSnapshot: params,
    stepsAttempted: complete ? stepCount : stepsAccepted + 1,
    stepsAccepted,
    beatsCompleted: Math.floor(stepsAccepted / stepsPerCycle),
    finalState: state,
    numericalGates,
    hardDiagnostics: Object.freeze({
      maximumAbsoluteTotalBloodVolumeDriftMl,
      maximumAbsoluteStepBloodVolumeResidualMl,
      maximumGlobalScaledResidual,
      maximumTriSegRelativeResidual,
      maximumHillSerialEquilibriumResidualPa,
      maximumHillSlsBalanceResidualJPerM3,
      maximumLaSlsBalanceResidualJPerM3,
      maximumLandContinuousPowerResidualWPerM3,
      maximumLandDiscretePowerResidualWPerM3,
      maximumLandSourceReportedPowerResidualWPerM3,
      maximumLandFiniteDifferenceWorkResidualPa,
      maximumLandStateConservationResidual,
      minimumLandPopulation,
      landProjectionOccurred,
      minimumCompartmentVolumeMl,
      minimumCompartmentVolumePath,
      minimumCompartmentVolumeTimeSec,
      solverMinimumBloodVolumeMl: params.solver.minimumBloodVolumeMl,
    }),
    solverWork: Object.freeze({
      totalGlobalIterations,
      totalGlobalResidualEvaluations,
      totalGlobalJacobianEvaluations,
      totalGlobalLineSearchBacktracks,
      maximumGlobalIterationsPerStep,
    }),
    /** Backward-compatible raw readback; it remains report-only unless the caller supplies a gate tolerance. */
    reportOnlyExactOneBeatReturnMap: returnMap,
    exactOneBeatFullStateReturnMap: returnMap,
    fullStateReturnMapGate: returnMapGate,
    reportOnlyPhysiology:
      summarizeNoAvpdFourChamberAtrialLandBenchPhysiologyV2(
        lastBeatSamples,
        params.calciumDrivers.leftAtrium.eventOnsetSec / params.cycleLengthSec,
      ),
    samples: Object.freeze(samples),
    lastBeatSamples: Object.freeze(lastBeatSamples),
  });
}

export function summarizeNoAvpdFourChamberAtrialLandBenchPhysiologyV2(
  samples: readonly NoAvpdFourChamberAtrialLandBenchSampleV2[],
  leftAtrialActivationOnsetPhase01: number,
) {
  if (samples.length === 0) return null;
  const min = (value: (sample: NoAvpdFourChamberAtrialLandBenchSampleV2) => number) =>
    samples.reduce((best, sample) => value(sample) < value(best) ? sample : best);
  const max = (value: (sample: NoAvpdFourChamberAtrialLandBenchSampleV2) => number) =>
    samples.reduce((best, sample) => value(sample) > value(best) ? sample : best);
  const laMin = min((sample) => sample.volumesMl.leftAtriumMl);
  const laMax = max((sample) => sample.volumesMl.leftAtriumMl);
  const lvMin = min((sample) => sample.volumesMl.leftVentricleMl);
  const lvMax = max((sample) => sample.volumesMl.leftVentricleMl);
  const lapMax = max((sample) => sample.pressuresMmHg.la);
  const activationPhase = normalizePhase(leftAtrialActivationOnsetPhase01);
  const openingCrossings = pressureGradientCrossings(samples, "up");
  const closureCrossings = pressureGradientCrossings(samples, "down");
  const mvoUnwrapped = latestCrossingBefore(openingCrossings, activationPhase);
  const mvcUnwrapped = earliestCrossingAfter(closureCrossings, activationPhase);
  const orderedEventsAvailable =
    mvoUnwrapped != null &&
    mvcUnwrapped != null &&
    mvoUnwrapped < activationPhase &&
    activationPhase < mvcUnwrapped &&
    activationPhase - mvoUnwrapped < 1 &&
    mvcUnwrapped - activationPhase < 1;
  const phaseSegmentation = orderedEventsAvailable
    ? Object.freeze({
        status: "identified-from-pressure-crossings-and-la-activation" as const,
        eventSources: Object.freeze({
          mitralOpening: "LAP-minus-LVP-up-crossing" as const,
          leftAtrialActivation: "prescribed-calcium-event-onset" as const,
          mitralClosure: "LAP-minus-LVP-down-crossing" as const,
        }),
        reservoir: phaseSegment(mvcUnwrapped! - 1, mvoUnwrapped!),
        conduitEarlyFilling: phaseSegment(mvoUnwrapped!, activationPhase),
        atrialPumping: phaseSegment(activationPhase, mvcUnwrapped!),
      })
    : Object.freeze({
        status: "not-identifiable-missing-ordered-events" as const,
        eventSources: Object.freeze({
          mitralOpening: "LAP-minus-LVP-up-crossing" as const,
          leftAtrialActivation: "prescribed-calcium-event-onset" as const,
          mitralClosure: "LAP-minus-LVP-down-crossing" as const,
        }),
        reservoir: null,
        conduitEarlyFilling: null,
        atrialPumping: null,
      });
  const inflow = orderedEventsAvailable
    ? identifyMitralInflow(
        samples,
        mvoUnwrapped!,
        activationPhase,
        mvcUnwrapped!,
      )
    : Object.freeze({
        status: "not-identifiable" as const,
        reason: "missing-ordered-MVO-LA-activation-MVC-events" as const,
        ePeak: null,
        aPeak: null,
        interpeakMinimum: null,
        eaPeakRatio: null,
      });
  return Object.freeze({
    evidenceStatus: "report-only-no-physiology-acceptance" as const,
    laVolumeRangeMl: Object.freeze({ minimum: laMin.volumesMl.leftAtriumMl, maximum: laMax.volumesMl.leftAtriumMl }),
    lvVolumeRangeMl: Object.freeze({ minimum: lvMin.volumesMl.leftVentricleMl, maximum: lvMax.volumesMl.leftVentricleMl }),
    lvEjectionFraction01:
      (lvMax.volumesMl.leftVentricleMl - lvMin.volumesMl.leftVentricleMl) /
      lvMax.volumesMl.leftVentricleMl,
    maximumLaPressureMmHg: lapMax.pressuresMmHg.la,
    maximumLaPressurePhase01: lapMax.phase01,
    mitralOpeningPhase01:
      mvoUnwrapped == null ? null : normalizePhase(mvoUnwrapped),
    leftAtrialActivationOnsetPhase01: activationPhase,
    mitralClosurePhase01:
      mvcUnwrapped == null ? null : normalizePhase(mvcUnwrapped),
    phaseSegmentation,
    mitralInflowIdentification: inflow,
    ePeak: inflow.ePeak,
    aPeak: inflow.aPeak,
    eaPeakRatio: inflow.eaPeakRatio,
  });
}

type UnwrappedSample = {
  readonly phase: number;
  readonly sample: NoAvpdFourChamberAtrialLandBenchSampleV2;
};

function identifyMitralInflow(
  samples: readonly NoAvpdFourChamberAtrialLandBenchSampleV2[],
  mitralOpeningPhase: number,
  leftAtrialActivationPhase: number,
  mitralClosurePhase: number,
) {
  const unwrapped = unwrapSamples(samples);
  const ePeak = positiveLocalPeak(
    unwrapped,
    mitralOpeningPhase,
    leftAtrialActivationPhase,
  );
  const aPeak = positiveLocalPeak(
    unwrapped,
    leftAtrialActivationPhase,
    mitralClosurePhase,
  );
  const maximumEarlyFlow = maximumFlowInInterval(
    unwrapped,
    mitralOpeningPhase,
    leftAtrialActivationPhase,
  );
  const maximumAtrialFlow = maximumFlowInInterval(
    unwrapped,
    leftAtrialActivationPhase,
    mitralClosurePhase,
  );
  const flowAtActivation = interpolateFlow(
    unwrapped,
    leftAtrialActivationPhase,
  );
  const interpeakMinimum = ePeak != null && aPeak != null
    ? minimumFlowInInterval(unwrapped, ePeak.phase, aPeak.phase)
    : null;
  const separated =
    ePeak != null &&
    aPeak != null &&
    interpeakMinimum != null &&
    interpeakMinimum.flowMlPerSec <
      Math.min(ePeak.flowMlPerSec, aPeak.flowMlPerSec);
  const forwardFlowSpansActivation =
    maximumEarlyFlow > 0 &&
    maximumAtrialFlow > 0 &&
    flowAtActivation != null &&
    flowAtActivation > 0;
  const status = separated
    ? "separated" as const
    : forwardFlowSpansActivation
      ? "fused" as const
      : "not-identifiable" as const;
  const reason = separated
    ? "two-positive-local-maxima-with-an-intervening-lower-flow-minimum" as const
    : status === "fused"
      ? "forward-flow-spans-la-activation-without-two-resolved-maxima" as const
      : "no-positive-resolved-peak-in-one-or-both-event-derived-intervals" as const;
  return Object.freeze({
    status,
    reason,
    ePeak: peakReport(ePeak),
    aPeak: peakReport(aPeak),
    interpeakMinimum: interpeakMinimum == null
      ? null
      : Object.freeze({
          phase01: normalizePhase(interpeakMinimum.phase),
          flowMlPerSec: interpeakMinimum.flowMlPerSec,
        }),
    eaPeakRatio:
      separated && ePeak != null && aPeak != null && aPeak.flowMlPerSec > 0
        ? ePeak.flowMlPerSec / aPeak.flowMlPerSec
        : null,
  });
}

function pressureGradientCrossings(
  samples: readonly NoAvpdFourChamberAtrialLandBenchSampleV2[],
  direction: "up" | "down",
): readonly number[] {
  const crossings: number[] = [];
  for (let index = 1; index < samples.length; index += 1) {
    const left = samples[index - 1]!;
    const right = samples[index]!;
    const a = left.pressuresMmHg.la - left.pressuresMmHg.lv;
    const b = right.pressuresMmHg.la - right.pressuresMmHg.lv;
    const crosses = direction === "up" ? a <= 0 && b > 0 : a >= 0 && b < 0;
    if (crosses) {
      const fraction = Math.abs(b - a) <= 1e-14 ? 0 : -a / (b - a);
      crossings.push(
        left.phase01 + fraction * (right.phase01 - left.phase01),
      );
    }
  }
  return Object.freeze(crossings);
}

function latestCrossingBefore(
  crossings: readonly number[],
  referencePhase: number,
): number | null {
  if (crossings.length === 0) return null;
  return Math.max(
    ...crossings.map((phase) => phase < referencePhase ? phase : phase - 1),
  );
}

function earliestCrossingAfter(
  crossings: readonly number[],
  referencePhase: number,
): number | null {
  if (crossings.length === 0) return null;
  return Math.min(
    ...crossings.map((phase) => phase > referencePhase ? phase : phase + 1),
  );
}

function phaseSegment(startPhase: number, endPhase: number) {
  const start = normalizePhase(startPhase);
  const end = normalizePhase(endPhase);
  return Object.freeze({
    startPhase01: start,
    endPhase01: end,
    wrapsCycleBoundary: start > end,
    durationFraction: endPhase - startPhase,
  });
}

function unwrapSamples(
  samples: readonly NoAvpdFourChamberAtrialLandBenchSampleV2[],
): readonly UnwrappedSample[] {
  const base = samples.filter((sample) => sample.phase01 < 1);
  return Object.freeze(
    [-1, 0, 1].flatMap((offset) =>
      base.map((sample) => Object.freeze({
        phase: sample.phase01 + offset,
        sample,
      }))
    ),
  );
}

function positiveLocalPeak(
  samples: readonly UnwrappedSample[],
  startPhase: number,
  endPhase: number,
) {
  const candidates: { phase: number; flowMlPerSec: number }[] = [];
  for (let index = 1; index < samples.length - 1; index += 1) {
    const left = samples[index - 1]!;
    const centre = samples[index]!;
    const right = samples[index + 1]!;
    if (!(centre.phase > startPhase && centre.phase < endPhase)) continue;
    const leftFlow = left.sample.flowsMlPerSec.mv;
    const flow = centre.sample.flowsMlPerSec.mv;
    const rightFlow = right.sample.flowsMlPerSec.mv;
    if (
      flow > 0 &&
      ((flow >= leftFlow && flow > rightFlow) ||
        (flow > leftFlow && flow >= rightFlow))
    ) {
      candidates.push({ phase: centre.phase, flowMlPerSec: flow });
    }
  }
  if (candidates.length === 0) return null;
  return candidates.reduce((best, candidate) =>
    candidate.flowMlPerSec > best.flowMlPerSec ? candidate : best
  );
}

function maximumFlowInInterval(
  samples: readonly UnwrappedSample[],
  startPhase: number,
  endPhase: number,
): number {
  const flows = samples
    .filter((entry) => entry.phase > startPhase && entry.phase < endPhase)
    .map((entry) => entry.sample.flowsMlPerSec.mv);
  return flows.length === 0 ? Number.NEGATIVE_INFINITY : Math.max(...flows);
}

function minimumFlowInInterval(
  samples: readonly UnwrappedSample[],
  startPhase: number,
  endPhase: number,
) {
  const selected = samples.filter((entry) =>
    entry.phase > startPhase && entry.phase < endPhase
  );
  if (selected.length === 0) return null;
  const minimum = selected.reduce((best, entry) =>
    entry.sample.flowsMlPerSec.mv < best.sample.flowsMlPerSec.mv
      ? entry
      : best
  );
  return {
    phase: minimum.phase,
    flowMlPerSec: minimum.sample.flowsMlPerSec.mv,
  };
}

function interpolateFlow(
  samples: readonly UnwrappedSample[],
  phase: number,
): number | null {
  for (let index = 1; index < samples.length; index += 1) {
    const left = samples[index - 1]!;
    const right = samples[index]!;
    if (left.phase <= phase && phase <= right.phase) {
      const width = right.phase - left.phase;
      const fraction = width <= 1e-14 ? 0 : (phase - left.phase) / width;
      return left.sample.flowsMlPerSec.mv + fraction *
        (right.sample.flowsMlPerSec.mv - left.sample.flowsMlPerSec.mv);
    }
  }
  return null;
}

function peakReport(
  peak: { readonly phase: number; readonly flowMlPerSec: number } | null,
) {
  return peak == null
    ? null
    : Object.freeze({
        phase01: normalizePhase(peak.phase),
        flowMlPerSec: peak.flowMlPerSec,
      });
}

function normalizePhase(phase: number): number {
  const wrapped = phase - Math.floor(phase);
  return wrapped === 1 ? 0 : wrapped;
}

function normalizedStateDrift(
  earlier: NoAvpdFourChamberAtrialLandTriSegStateV2,
  later: NoAvpdFourChamberAtrialLandTriSegStateV2,
) {
  const left = flattenNumbers(earlier).filter((entry) => entry.path !== "timeSec");
  const right = new Map(
    flattenNumbers(later)
      .filter((entry) => entry.path !== "timeSec")
      .map((entry) => [entry.path, entry.value]),
  );
  let maximum = 0;
  let rmsSum = 0;
  let maximumPath = "";
  let allComponentsFinite = true;
  for (const entry of left) {
    const other = right.get(entry.path);
    if (other == null) throw new Error(`return-map state path missing: ${entry.path}`);
    if (!Number.isFinite(entry.value) || !Number.isFinite(other)) {
      allComponentsFinite = false;
      continue;
    }
    const normalized = Math.abs(other - entry.value) /
      Math.max(1, Math.abs(entry.value), Math.abs(other));
    rmsSum += normalized * normalized;
    if (normalized > maximum) {
      maximum = normalized;
      maximumPath = entry.path;
    }
  }
  return Object.freeze({
    componentCount: left.length,
    maxAbsDimensionless: maximum,
    rmsDimensionless: Math.sqrt(rmsSum / left.length),
    maximumComponentPath: maximumPath,
    allComponentsFinite,
  });
}

function flattenNumbers(value: unknown, path = ""): { path: string; value: number }[] {
  if (typeof value === "number") return [{ path, value }];
  if (value == null || typeof value !== "object") return [];
  if (Array.isArray(value)) {
    return value.flatMap((entry, index) =>
      flattenNumbers(entry, path ? `${path}.${index}` : String(index))
    );
  }
  return Object.entries(value).flatMap(([key, entry]) =>
    flattenNumbers(entry, path ? `${path}.${key}` : key)
  );
}

function updateMinimumCompartmentVolume(
  state: NoAvpdFourChamberAtrialLandTriSegStateV2,
  previousMinimumMl: number,
  previousPath: string,
  previousTimeSec: number,
) {
  let minimumMl = previousMinimumMl;
  let path = previousPath;
  let timeSec = previousTimeSec;
  for (const [key, volumeMl] of Object.entries(state.volumes)) {
    if (volumeMl < minimumMl) {
      minimumMl = volumeMl;
      path = `volumes.${key}`;
      timeSec = state.timeSec;
    }
  }
  return {
    minimumCompartmentVolumeMl: minimumMl,
    minimumCompartmentVolumePath: path,
    minimumCompartmentVolumeTimeSec: timeSec,
  };
}

function validateBenchInitialization(
  initial: NoAvpdFourChamberAtrialLandTriSegStateV2,
  coldInitial: NoAvpdFourChamberAtrialLandTriSegStateV2,
  params: NoAvpdFourChamberAtrialLandTriSegParamsV2,
  dtSec: number,
  provenance: NoAvpdFourChamberAtrialLandWarmStartProvenanceV2 | null,
  warm: boolean,
): void {
  if (warm && provenance == null) {
    throw new Error("warm initialState requires warmStartProvenance");
  }
  const actualEntries = flattenNumbers(initial);
  const referenceEntries = flattenNumbers(coldInitial);
  const actualPaths = new Set(actualEntries.map((entry) => entry.path));
  if (
    actualEntries.length !== referenceEntries.length ||
    referenceEntries.some((entry) => !actualPaths.has(entry.path))
  ) {
    throw new Error(
      "initialState numerical layout is incompatible with the V2 state layout",
    );
  }
  if (actualEntries.some((entry) => !Number.isFinite(entry.value))) {
    throw new Error("initialState contains a non-finite value");
  }
  if (initial.timeSec < 0) {
    throw new Error("initialState.timeSec must be nonnegative");
  }
  if (
    initial.triSegGeneralizedForceMapping !==
    params.triSegGeneralizedForceMapping
  ) {
    throw new Error("initialState TriSeg mapping is incompatible");
  }
  if (
    initial.walls.leftAtrium.kind !==
    "land-active-parallel-passive-sls-v1"
  ) {
    throw new Error("initialState left-atrial material layout is incompatible");
  }
  if (
    initial.parameterIdentityCanonicalJson !==
      noAvpdFourChamberAtrialLandParameterIdentityV2(params)
  ) {
    throw new Error("initialState effective parameter identity is incompatible");
  }
  if (
    initial.walls.leftAtrium.materialIdentity.landEffectiveParamsCanonicalJson !==
      coldInitial.walls.leftAtrium.materialIdentity.landEffectiveParamsCanonicalJson ||
    initial.walls.leftAtrium.materialIdentity.passiveSlsEffectiveParamsCanonicalJson !==
      coldInitial.walls.leftAtrium.materialIdentity.passiveSlsEffectiveParamsCanonicalJson
  ) {
    throw new Error("initialState left-atrial material identity is incompatible");
  }
  if (
    Object.values(initial.volumes).some(
      (volume) => volume < params.solver.minimumBloodVolumeMl,
    )
  ) {
    throw new Error(
      "initialState contains a blood volume below the admissible minimum",
    );
  }
  if (
    Object.values(initial.calciumDrivers).some(
      (driver) => driver.riseState01 < 0 || driver.decayState01 < 0,
    ) || initial.walls.leftAtrium.active.previousFreeCalciumUm < 0
  ) {
    throw new Error(
      "initialState contains a negative prescribed-calcium state",
    );
  }
  const hillWalls = [
    initial.walls.rightAtrium,
    initial.walls.leftFreeWall,
    initial.walls.septum,
    initial.walls.rightFreeWall,
  ];
  if (
    hillWalls.some((wall) =>
      wall.caTroponin01 < 0 ||
      wall.caTroponin01 > 1 ||
      (wall.thinFilamentAvailability01 != null &&
        (wall.thinFilamentAvailability01 < 0 ||
          wall.thinFilamentAvailability01 > 1))
    )
  ) {
    throw new Error(
      "initialState contains a Hill regulatory state outside [0,1]",
    );
  }
  const phaseSec = positiveModulo(initial.timeSec, params.cycleLengthSec);
  const phaseDistanceSec = Math.min(
    phaseSec,
    params.cycleLengthSec - phaseSec,
  );
  if (phaseDistanceSec > Math.max(1e-9, params.cycleLengthSec * 1e-9)) {
    throw new Error(
      "initialState must be anchored at a cardiac-cycle boundary",
    );
  }

  const initialBloodVolumeMl = totalBloodVolumeMl(initial.volumes);
  const referenceBloodVolumeMl = totalBloodVolumeMl(coldInitial.volumes);
  const bloodToleranceMl = Math.max(
    params.solver.totalBloodVolumeToleranceMl,
    1e-6,
  );
  if (
    Math.abs(initialBloodVolumeMl - referenceBloodVolumeMl) > bloodToleranceMl
  ) {
    throw new Error(
      "initialState belongs to a different total-blood-volume class",
    );
  }
  if (provenance == null) return;
  if (provenance.resumeMode !== "exact-same-parameter-checkpoint") {
    throw new Error("warm-start resume mode is incompatible");
  }
  if (
    provenance.sourceModelId !==
    NO_AVPD_FOUR_CHAMBER_ATRIAL_LAND_TRISEG_MODEL_ID_V2
  ) {
    throw new Error("warm-start model id is incompatible");
  }
  if (
    provenance.sourceEquationsVersionId !==
    NO_AVPD_FOUR_CHAMBER_ATRIAL_LAND_TRISEG_EQUATIONS_VERSION_ID_V2
  ) {
    throw new Error("warm-start equations version is incompatible");
  }
  if (
    provenance.sourceStateLayoutId !==
    NO_AVPD_FOUR_CHAMBER_ATRIAL_LAND_TRISEG_STATE_LAYOUT_ID_V2
  ) {
    throw new Error("warm-start state layout is incompatible");
  }
  if (
    provenance.sourceRhythmTopologyId !==
    NO_AVPD_FOUR_CHAMBER_ATRIAL_LAND_TRISEG_RHYTHM_TOPOLOGY_ID_V2
  ) {
    throw new Error("warm-start rhythm topology is incompatible");
  }
  if (
    !Number.isFinite(provenance.sourceCycleLengthSec) ||
    Math.abs(provenance.sourceCycleLengthSec - params.cycleLengthSec) > 1e-12
  ) {
    throw new Error("warm-start cycle length is incompatible");
  }
  if (
    !Number.isFinite(provenance.sourceDtSec) ||
    Math.abs(provenance.sourceDtSec - dtSec) > 1e-15
  ) {
    throw new Error("warm-start time step is incompatible with exact resume");
  }
  if (
    !Number.isFinite(provenance.sourceTotalBloodVolumeMl) ||
    Math.abs(provenance.sourceTotalBloodVolumeMl - initialBloodVolumeMl) >
      bloodToleranceMl
  ) {
    throw new Error(
      "warm-start total-blood-volume provenance does not match its state",
    );
  }
  for (const [field, value] of [
    ["sourceArtifactId", provenance.sourceArtifactId],
    ["sourceNormalizedSha256", provenance.sourceNormalizedSha256],
    ["sourceParameterSha256", provenance.sourceParameterSha256],
    ["sourceImplementationSha256", provenance.sourceImplementationSha256],
    ["sourceHarnessSha256", provenance.sourceHarnessSha256],
    ["sourceCheckpointStateSha256", provenance.sourceCheckpointStateSha256],
  ] as const) {
    if (value.trim().length === 0) {
      throw new Error(`warm-start ${field} must be nonempty`);
    }
  }
}

function positiveModulo(value: number, modulus: number): number {
  const remainder = value % modulus;
  return remainder < 0 ? remainder + modulus : remainder;
}

function validateOptions(
  beats: number,
  dtSec: number,
  cycleLengthSec: number,
  fullStateReturnMapTolerance: number | undefined,
): void {
  if (!Number.isInteger(beats) || beats < 3) {
    throw new Error("beats must be an integer >= 3 so the retained window has a measured start boundary");
  }
  if (!(dtSec > 0) || !Number.isFinite(dtSec)) {
    throw new Error("dtSec must be positive and finite");
  }
  const steps = cycleLengthSec / dtSec;
  if (Math.abs(steps - Math.round(steps)) > 1e-10) {
    throw new Error("cycleLengthSec must be an integer multiple of dtSec");
  }
  if (
    fullStateReturnMapTolerance != null &&
    (!Number.isFinite(fullStateReturnMapTolerance) ||
      fullStateReturnMapTolerance < 0)
  ) {
    throw new Error(
      "fullStateReturnMapMaxAbsDimensionlessTolerance must be finite and non-negative when supplied",
    );
  }
}
