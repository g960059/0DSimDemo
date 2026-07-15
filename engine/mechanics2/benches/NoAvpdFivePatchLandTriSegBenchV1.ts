import type { LandActivePassiveSlsTrialV1 } from "@/engine/mechanics2/constitutive/LandActivePassiveSlsV1";
import { summarizeFivePatchRawCycleDiagnosticsV1 } from "@/engine/mechanics2/diagnostics/FivePatchRawCycleDiagnosticsV1";
import {
  NO_AVPD_FIVE_PATCH_LAND_TRISEG_CLAIM_BOUNDARY_V1,
  NO_AVPD_FIVE_PATCH_LAND_TRISEG_EQUATIONS_VERSION_ID_V1,
  NO_AVPD_FIVE_PATCH_LAND_TRISEG_MODEL_ID_V1,
  NO_AVPD_FIVE_PATCH_LAND_TRISEG_RHYTHM_TOPOLOGY_ID_V1,
  NO_AVPD_FIVE_PATCH_LAND_TRISEG_STATE_LAYOUT_ID_V1,
  createDefaultNoAvpdFivePatchLandTriSegParamsV1,
  initialNoAvpdFivePatchLandTriSegStateV1,
  stepNoAvpdFivePatchLandTriSegV1,
  totalBloodVolumeMl,
  type NoAvpdFivePatchLandSlsVariantV1,
  type NoAvpdFivePatchLandTriSegParamsV1,
  type NoAvpdFivePatchLandTriSegStateV1,
  type NoAvpdFlowReadbackV1,
  type NoAvpdPressureReadbackV1,
  type NoAvpdWallIdV1,
} from "@/engine/mechanics2/subsystems/NoAvpdFivePatchLandTriSegV1";

export const NO_AVPD_FIVE_PATCH_LAND_TRISEG_BENCH_ID_V1 =
  "no-avpd-five-patch-land-triseg-structural-bench-v1" as const;

export const NO_AVPD_FIVE_PATCH_LAND_WALL_IDS_V1 = Object.freeze([
  "leftAtrium",
  "rightAtrium",
  "leftFreeWall",
  "septum",
  "rightFreeWall",
] as const satisfies readonly NoAvpdWallIdV1[]);

const LAND_POWER_RESIDUAL_TOLERANCE_W_PER_M3 = 1e-8;
const LAND_FINITE_DIFFERENCE_WORK_TOLERANCE_PA = 1e-5;
const LAND_STATE_CONSERVATION_TOLERANCE = 1e-10;
const LAND_MINIMUM_POPULATION_TOLERANCE = -1e-12;
const SLS_BALANCE_TOLERANCE_J_PER_M3 = 1e-8;

export type NoAvpdFivePatchLandBenchOptionsV1 = {
  readonly beats?: number;
  readonly dtSec?: number;
  readonly slsVariant?: NoAvpdFivePatchLandSlsVariantV1;
  readonly params?: NoAvpdFivePatchLandTriSegParamsV1;
  /**
   * Optional caller-owned threshold.  The return map remains report-only when
   * this is absent; this bench does not invent a limit-cycle tolerance.
   */
  readonly fullStateReturnMapMaxAbsDimensionlessTolerance?: number;
};

type LandStateLabel = "CaTRPN" | "B" | "W" | "S" | "zetaW" | "zetaS";

export type NoAvpdFivePatchLandWallBenchSampleV1 = {
  readonly freeCalciumUm: number;
  readonly activation01: number;
  readonly activeHomogenizationScale: number;
  readonly fiberLogStrain: number;
  readonly landStates: Readonly<Record<LandStateLabel, number>>;
  readonly acceptedSlsState: {
    readonly totalStrain: number;
    readonly overstressKPa: number;
  };
  readonly stressesKPa: {
    readonly sourceNominalCellularActive: number;
    readonly mappedCellularLandActive: number;
    readonly effectiveTransmittedActive: number;
    readonly passiveEquilibrium: number;
    readonly slsOverstress: number;
    readonly totalTransmitted: number;
  };
  readonly energiesJPerM3: {
    readonly passiveEquilibriumStorage: number;
    readonly slsStorage: number;
  };
  readonly activeWork: {
    readonly continuousTissueEquivalentSourcePowerDensityWPerM3: number;
    readonly continuousEffectiveWallPowerDensityWPerM3: number;
    readonly continuousResidualWPerM3: number;
    readonly discreteTissueEquivalentSourcePowerDensityWPerM3: number;
    readonly discreteEffectiveWallPowerDensityWPerM3: number;
    readonly discreteResidualWPerM3: number;
    readonly tissueEquivalentSourceReportedPowerDensityWPerM3: number;
    readonly sourceReportedResidualWPerM3: number;
    readonly finiteDifferenceWorkResidualPa: number;
  };
  readonly slsWorkBalance: {
    readonly workIncrementJPerM3: number;
    readonly storageIncrementJPerM3: number;
    readonly physicalRelaxationDissipationJPerM3: number;
    readonly backwardEulerNumericalDissipationJPerM3: number;
    readonly discreteBalanceResidualJPerM3: number;
  };
  readonly landHealth: {
    readonly minimumPopulation: number;
    readonly stateConservationResidual: number;
    readonly projectionUsed: boolean;
  };
  readonly landSolver: {
    readonly iterations: number;
    readonly residualNorm: number;
    readonly lineSearchSteps: number;
    readonly substeps: number;
  };
};

export type NoAvpdFivePatchLandBenchSampleV1 = {
  readonly timeSec: number;
  readonly beatIndex: number;
  readonly phase01: number;
  readonly volumesMl: NoAvpdFivePatchLandTriSegStateV1["volumes"];
  readonly pressuresMmHg: NoAvpdPressureReadbackV1;
  readonly flowsMlPerSec: NoAvpdFlowReadbackV1;
  readonly walls: Readonly<
    Record<NoAvpdWallIdV1, NoAvpdFivePatchLandWallBenchSampleV1>
  >;
  readonly numeric: {
    readonly globalIterations: number;
    readonly globalMaxScaledResidual: number;
    readonly globalLineSearchBacktracks: number;
    readonly triSegIterations: number;
    readonly triSegFunctionEvaluations: number;
    readonly triSegRelativeResidual: number;
    readonly totalBloodVolumeResidualMl: number;
  };
};

type MutableWallDiagnostics = {
  maximumAbsoluteContinuousPowerResidualWPerM3: number;
  maximumAbsoluteDiscretePowerResidualWPerM3: number;
  maximumAbsoluteSourceReportedPowerResidualWPerM3: number;
  maximumAbsoluteFiniteDifferenceWorkResidualPa: number;
  maximumAbsoluteSlsBalanceResidualJPerM3: number;
  maximumAbsoluteStateConservationResidual: number;
  minimumLandPopulation: number;
  landProjectionOccurred: boolean;
  maximumLandSolverIterations: number;
  maximumLandSolverResidualNorm: number;
  totalLandSolverIterations: number;
  totalLandSolverLineSearchSteps: number;
};

export type NoAvpdFivePatchLandBenchResultV1 = ReturnType<
  typeof runNoAvpdFivePatchLandTriSegBenchV1
>;

/**
 * Cold structural bench for the five-patch Land/TriSeg sidecar.
 *
 * It retains every raw endpoint from the final requested beat.  It performs no
 * smoothing, feature fitting, normal-human morphology scoring, or winner
 * selection.  The only hard gates are numerical/constitutive invariants.
 */
export function runNoAvpdFivePatchLandTriSegBenchV1(
  options: NoAvpdFivePatchLandBenchOptionsV1 = {},
) {
  const beats = options.beats ?? 1;
  const dtSec = options.dtSec ?? 0.005;
  const params =
    options.params ??
    createDefaultNoAvpdFivePatchLandTriSegParamsV1(
      options.slsVariant ?? "all-patch",
    );
  const inferredSlsVariant = inferSlsVariant(params);
  const slsVariant = options.slsVariant ?? inferredSlsVariant;
  if (slsVariant !== inferredSlsVariant) {
    throw new Error(
      `slsVariant ${slsVariant} does not match supplied params (${inferredSlsVariant})`,
    );
  }
  validateOptions(
    beats,
    dtSec,
    params.cycleLengthSec,
    options.fullStateReturnMapMaxAbsDimensionlessTolerance,
  );

  const stepsPerCycle = Math.round(params.cycleLengthSec / dtSec);
  const stepCount = beats * stepsPerCycle;
  const firstLastBeatStep = (beats - 1) * stepsPerCycle;
  let state = initialNoAvpdFivePatchLandTriSegStateV1(params);
  const initialBloodVolumeMl = totalBloodVolumeMl(state.volumes);
  const boundaryStates: NoAvpdFivePatchLandTriSegStateV1[] = [state];
  const lastBeatSamples: NoAvpdFivePatchLandBenchSampleV1[] = [];
  const wallDiagnostics = mapWalls(() => initialWallDiagnostics());

  let stepsAccepted = 0;
  let firstFailure: string | null = null;
  let maximumAbsoluteTotalBloodVolumeDriftMl = 0;
  let maximumAbsoluteStepBloodVolumeResidualMl = 0;
  let minimumCompartmentVolumeMl = minimumVolume(state);
  let minimumCompartmentVolumePath = minimumVolumePath(state);
  let minimumCompartmentVolumeTimeSec = state.timeSec;
  let maximumGlobalScaledResidual = 0;
  let maximumGlobalIterationsPerStep = 0;
  let totalGlobalIterations = 0;
  let totalGlobalResidualEvaluations = 0;
  let totalGlobalJacobianEvaluations = 0;
  let totalGlobalJacobianReusedIterations = 0;
  let totalGlobalFreshJacobianRetries = 0;
  let totalGlobalLineSearchBacktracks = 0;
  let maximumTriSegRelativeResidual = 0;
  let maximumTriSegIterationsPerStep = 0;
  let totalTriSegIterations = 0;
  let totalTriSegFunctionEvaluations = 0;
  let triSegInitialCoordinateClampOccurred = false;

  for (let stepIndex = 0; stepIndex < stepCount; stepIndex += 1) {
    const output = stepNoAvpdFivePatchLandTriSegV1(state, dtSec, params);
    totalGlobalIterations += output.solver.iterations;
    totalGlobalResidualEvaluations += output.solver.residualEvaluations;
    totalGlobalJacobianEvaluations += output.solver.jacobianEvaluations;
    totalGlobalJacobianReusedIterations +=
      output.solver.jacobianReusedIterations;
    totalGlobalFreshJacobianRetries += output.solver.freshJacobianRetries;
    totalGlobalLineSearchBacktracks += output.solver.lineSearchBacktracks;
    maximumGlobalIterationsPerStep = Math.max(
      maximumGlobalIterationsPerStep,
      output.solver.iterations,
    );
    maximumGlobalScaledResidual = Math.max(
      maximumGlobalScaledResidual,
      output.solver.maxScaledResidual,
    );

    if (!output.accepted || output.evaluation == null) {
      firstFailure = `step-${stepIndex}:${output.failureReasons.join(",")}`;
      break;
    }

    state = output.state;
    stepsAccepted += 1;
    const evaluation = output.evaluation;
    const triSegDiagnostics = evaluation.ventricles.triSeg.diagnostics;
    maximumTriSegRelativeResidual = Math.max(
      maximumTriSegRelativeResidual,
      triSegDiagnostics.relativeResidualMagnitude,
    );
    maximumTriSegIterationsPerStep = Math.max(
      maximumTriSegIterationsPerStep,
      triSegDiagnostics.iterations,
    );
    totalTriSegIterations += triSegDiagnostics.iterations;
    totalTriSegFunctionEvaluations += triSegDiagnostics.functionEvaluations;
    triSegInitialCoordinateClampOccurred ||=
      triSegDiagnostics.initialCoordinatesWereClamped;

    const volumeDriftMl =
      totalBloodVolumeMl(state.volumes) - initialBloodVolumeMl;
    const stepVolumeResidualMl =
      output.totalBloodVolumeResidualMl ?? Number.NaN;
    maximumAbsoluteTotalBloodVolumeDriftMl = Math.max(
      maximumAbsoluteTotalBloodVolumeDriftMl,
      Math.abs(volumeDriftMl),
    );
    maximumAbsoluteStepBloodVolumeResidualMl = Math.max(
      maximumAbsoluteStepBloodVolumeResidualMl,
      Math.abs(stepVolumeResidualMl),
    );
    const currentMinimumVolumeMl = minimumVolume(state);
    if (currentMinimumVolumeMl < minimumCompartmentVolumeMl) {
      minimumCompartmentVolumeMl = currentMinimumVolumeMl;
      minimumCompartmentVolumePath = minimumVolumePath(state);
      minimumCompartmentVolumeTimeSec = state.timeSec;
    }

    const trials = trialsByWall(evaluation);
    for (const wallId of NO_AVPD_FIVE_PATCH_LAND_WALL_IDS_V1) {
      accumulateWallDiagnostics(wallDiagnostics[wallId], trials[wallId]);
    }

    if (stepsAccepted % stepsPerCycle === 0) {
      boundaryStates.push(state);
      if (boundaryStates.length > 2) boundaryStates.shift();
    }
    if (stepIndex >= firstLastBeatStep) {
      const phaseStep = (stepsAccepted - firstLastBeatStep) / stepsPerCycle;
      lastBeatSamples.push(
        makeSample(
          state,
          beats - 1,
          phaseStep,
          evaluation,
          output.solver.iterations,
          output.solver.maxScaledResidual,
          output.solver.lineSearchBacktracks,
          stepVolumeResidualMl,
        ),
      );
    }
  }

  const complete = stepsAccepted === stepCount;
  const returnMap =
    boundaryStates.length >= 2
      ? normalizedStateDrift(boundaryStates[0]!, boundaryStates[1]!)
      : null;
  const returnMapTolerance =
    options.fullStateReturnMapMaxAbsDimensionlessTolerance;
  const returnMapGate = Object.freeze({
    evidenceStatus:
      returnMapTolerance == null
        ? ("report-only-caller-threshold-required" as const)
        : ("caller-threshold-applied" as const),
    applied: returnMapTolerance != null,
    callerSuppliedMaxAbsDimensionlessTolerance: returnMapTolerance ?? null,
    eligible:
      returnMap != null &&
      returnMap.allComponentsFinite &&
      Number.isFinite(returnMap.maxAbsDimensionless),
    pass:
      returnMapTolerance == null
        ? null
        : returnMap != null &&
          returnMap.allComponentsFinite &&
          returnMap.maxAbsDimensionless <= returnMapTolerance,
  });

  const perWallNumericalGates = mapWalls((wallId) => {
    const diagnostic = wallDiagnostics[wallId];
    return Object.freeze({
      landWorkMapping:
        stepsAccepted > 0 &&
        diagnostic.maximumAbsoluteContinuousPowerResidualWPerM3 <=
          LAND_POWER_RESIDUAL_TOLERANCE_W_PER_M3 &&
        diagnostic.maximumAbsoluteDiscretePowerResidualWPerM3 <=
          LAND_POWER_RESIDUAL_TOLERANCE_W_PER_M3 &&
        diagnostic.maximumAbsoluteSourceReportedPowerResidualWPerM3 <=
          LAND_POWER_RESIDUAL_TOLERANCE_W_PER_M3 &&
        diagnostic.maximumAbsoluteFiniteDifferenceWorkResidualPa <=
          LAND_FINITE_DIFFERENCE_WORK_TOLERANCE_PA,
      landPopulationAndConservation:
        stepsAccepted > 0 &&
        diagnostic.minimumLandPopulation >= LAND_MINIMUM_POPULATION_TOLERANCE &&
        diagnostic.maximumAbsoluteStateConservationResidual <=
          LAND_STATE_CONSERVATION_TOLERANCE &&
        !diagnostic.landProjectionOccurred,
      slsWorkBalance:
        stepsAccepted > 0 &&
        diagnostic.maximumAbsoluteSlsBalanceResidualJPerM3 <=
          SLS_BALANCE_TOLERANCE_J_PER_M3,
    });
  });
  const numericalGates = Object.freeze({
    allRequestedStepsAccepted: complete,
    rawLastCycleHasEveryAcceptedEndpoint:
      complete && lastBeatSamples.length === stepsPerCycle,
    bloodVolumeLedger:
      maximumAbsoluteTotalBloodVolumeDriftMl <=
        params.solver.totalBloodVolumeToleranceMl &&
      maximumAbsoluteStepBloodVolumeResidualMl <=
        params.solver.totalBloodVolumeToleranceMl,
    positiveCompartmentVolumes:
      minimumCompartmentVolumeMl >= params.solver.minimumBloodVolumeMl,
    globalNewton:
      complete &&
      maximumGlobalScaledResidual <= params.solver.residualTolerance,
    triSeg:
      complete &&
      maximumTriSegRelativeResidual <=
        params.solver.triSegRelativeResidualTolerance,
    allWallLandWorkMapping: NO_AVPD_FIVE_PATCH_LAND_WALL_IDS_V1.every(
      (wallId) => perWallNumericalGates[wallId].landWorkMapping,
    ),
    allWallLandPopulationAndConservation:
      NO_AVPD_FIVE_PATCH_LAND_WALL_IDS_V1.every(
        (wallId) => perWallNumericalGates[wallId].landPopulationAndConservation,
      ),
    allWallSlsWorkBalance: NO_AVPD_FIVE_PATCH_LAND_WALL_IDS_V1.every(
      (wallId) => perWallNumericalGates[wallId].slsWorkBalance,
    ),
    ...(returnMapTolerance == null
      ? {}
      : { fullStateBeatReturnMap: returnMapGate.pass === true }),
  });
  const status = Object.values(numericalGates).every(Boolean)
    ? ("pass" as const)
    : ("fail" as const);

  return Object.freeze({
    benchId: NO_AVPD_FIVE_PATCH_LAND_TRISEG_BENCH_ID_V1,
    statusScope: "structural-numerical-only" as const,
    status,
    failureReason: firstFailure,
    model: Object.freeze({
      modelId: NO_AVPD_FIVE_PATCH_LAND_TRISEG_MODEL_ID_V1,
      equationsVersionId:
        NO_AVPD_FIVE_PATCH_LAND_TRISEG_EQUATIONS_VERSION_ID_V1,
      stateLayoutId: NO_AVPD_FIVE_PATCH_LAND_TRISEG_STATE_LAYOUT_ID_V1,
      rhythmTopologyId: NO_AVPD_FIVE_PATCH_LAND_TRISEG_RHYTHM_TOPOLOGY_ID_V1,
      claimBoundary: NO_AVPD_FIVE_PATCH_LAND_TRISEG_CLAIM_BOUNDARY_V1,
    }),
    protocol: Object.freeze({
      beatsRequested: beats,
      dtSec,
      stepsPerCycle,
      heartRateBpm: 60 / params.cycleLengthSec,
      initialization: "independent-cold-start" as const,
      slsVariant,
      sampling: "every-final-beat-accepted-endpoint-no-smoothing" as const,
      physiologyGateApplied: false as const,
      morphologyWinnerSelectionApplied: false as const,
      limitCycleGateApplied: returnMapGate.applied,
      runtimeAdoptionClaimed: false as const,
    }),
    parameterSnapshot: params,
    gateThresholds: Object.freeze({
      landPowerResidualWPerM3: LAND_POWER_RESIDUAL_TOLERANCE_W_PER_M3,
      landFiniteDifferenceWorkResidualPa:
        LAND_FINITE_DIFFERENCE_WORK_TOLERANCE_PA,
      landStateConservationResidual: LAND_STATE_CONSERVATION_TOLERANCE,
      landMinimumPopulation: LAND_MINIMUM_POPULATION_TOLERANCE,
      slsBalanceResidualJPerM3: SLS_BALANCE_TOLERANCE_J_PER_M3,
    }),
    stepsAttempted: complete ? stepCount : stepsAccepted + 1,
    stepsAccepted,
    beatsCompleted: Math.floor(stepsAccepted / stepsPerCycle),
    finalState: state,
    numericalGates,
    perWallNumericalGates,
    hardDiagnostics: Object.freeze({
      bloodVolume: Object.freeze({
        initialTotalMl: initialBloodVolumeMl,
        finalTotalMl: totalBloodVolumeMl(state.volumes),
        maximumAbsoluteTotalDriftMl: maximumAbsoluteTotalBloodVolumeDriftMl,
        maximumAbsoluteStepResidualMl: maximumAbsoluteStepBloodVolumeResidualMl,
        minimumCompartmentVolumeMl,
        minimumCompartmentVolumePath,
        minimumCompartmentVolumeTimeSec,
      }),
      maximumGlobalScaledResidual: Number.isFinite(maximumGlobalScaledResidual)
        ? maximumGlobalScaledResidual
        : null,
      maximumTriSegRelativeResidual,
      triSegInitialCoordinateClampOccurred,
      walls: freezeWallDiagnostics(wallDiagnostics, stepsAccepted > 0),
    }),
    solverTelemetry: Object.freeze({
      global: Object.freeze({
        totalIterations: totalGlobalIterations,
        totalResidualEvaluations: totalGlobalResidualEvaluations,
        totalJacobianEvaluations: totalGlobalJacobianEvaluations,
        totalJacobianReusedIterations: totalGlobalJacobianReusedIterations,
        totalFreshJacobianRetries: totalGlobalFreshJacobianRetries,
        totalLineSearchBacktracks: totalGlobalLineSearchBacktracks,
        maximumIterationsPerStep: maximumGlobalIterationsPerStep,
      }),
      triSeg: Object.freeze({
        totalIterations: totalTriSegIterations,
        totalFunctionEvaluations: totalTriSegFunctionEvaluations,
        maximumIterationsPerStep: maximumTriSegIterationsPerStep,
      }),
      landByWall: mapWalls((wallId) =>
        Object.freeze({
          totalIterations: wallDiagnostics[wallId].totalLandSolverIterations,
          totalLineSearchSteps:
            wallDiagnostics[wallId].totalLandSolverLineSearchSteps,
          maximumIterationsPerStep:
            wallDiagnostics[wallId].maximumLandSolverIterations,
          maximumResidualNorm:
            wallDiagnostics[wallId].maximumLandSolverResidualNorm,
        }),
      ),
    }),
    exactOneBeatFullStateReturnMap: returnMap,
    fullStateReturnMapGate: returnMapGate,
    reportOnlyRawCycleDiagnostics: summarizeFivePatchRawCycleDiagnosticsV1(
      complete ? lastBeatSamples : [],
      params.calciumDrivers.leftAtrium.eventOnsetSec / params.cycleLengthSec,
      { periodicityEstablished: returnMapGate.pass === true },
    ),
    rawLastCycleSamples: Object.freeze(lastBeatSamples),
  });
}

function trialsByWall(
  evaluation: NonNullable<
    ReturnType<typeof stepNoAvpdFivePatchLandTriSegV1>["evaluation"]
  >,
): Readonly<Record<NoAvpdWallIdV1, LandActivePassiveSlsTrialV1>> {
  return {
    leftAtrium: evaluation.leftAtrium.materialTrial,
    rightAtrium: evaluation.rightAtrium.materialTrial,
    leftFreeWall: evaluation.ventricles.materialTrials.leftFreeWall,
    septum: evaluation.ventricles.materialTrials.septum,
    rightFreeWall: evaluation.ventricles.materialTrials.rightFreeWall,
  };
}

function makeSample(
  state: NoAvpdFivePatchLandTriSegStateV1,
  beatIndex: number,
  phase01: number,
  evaluation: NonNullable<
    ReturnType<typeof stepNoAvpdFivePatchLandTriSegV1>["evaluation"]
  >,
  globalIterations: number,
  globalMaxScaledResidual: number,
  globalLineSearchBacktracks: number,
  totalBloodVolumeResidualMl: number,
): NoAvpdFivePatchLandBenchSampleV1 {
  const trials = trialsByWall(evaluation);
  return Object.freeze({
    timeSec: state.timeSec,
    beatIndex,
    phase01,
    volumesMl: Object.freeze({ ...state.volumes }),
    pressuresMmHg: Object.freeze({ ...evaluation.pressures }),
    flowsMlPerSec: Object.freeze({ ...evaluation.flowReadback }),
    walls: mapWalls((wallId) => wallSample(trials[wallId])),
    numeric: Object.freeze({
      globalIterations,
      globalMaxScaledResidual,
      globalLineSearchBacktracks,
      triSegIterations: evaluation.ventricles.triSeg.diagnostics.iterations,
      triSegFunctionEvaluations:
        evaluation.ventricles.triSeg.diagnostics.functionEvaluations,
      triSegRelativeResidual:
        evaluation.ventricles.triSeg.diagnostics.relativeResidualMagnitude,
      totalBloodVolumeResidualMl,
    }),
  });
}

function wallSample(
  trial: LandActivePassiveSlsTrialV1,
): NoAvpdFivePatchLandWallBenchSampleV1 {
  const active = trial.activeTrial.readback;
  const passive = trial.passiveSlsTrial.readback;
  const combined = trial.readback;
  if (
    active == null ||
    passive == null ||
    combined == null ||
    trial.nextState == null
  ) {
    throw new Error("accepted bench sample is missing a wall readback");
  }
  return Object.freeze({
    freeCalciumUm: combined.freeCalciumUm,
    activation01: combined.activation01,
    activeHomogenizationScale: combined.activeMapping.activeHomogenizationScale,
    fiberLogStrain: combined.fiberLogStrain,
    landStates: Object.freeze({ ...active.state }),
    acceptedSlsState: Object.freeze({
      totalStrain: trial.nextState.passiveSls.totalStrain,
      overstressKPa: trial.nextState.passiveSls.slsOverstressPa / 1_000,
    }),
    stressesKPa: Object.freeze({
      sourceNominalCellularActive: active.sourceNominalActiveStressPa / 1_000,
      mappedCellularLandActive:
        combined.stresses.mappedCellularLandActivePa / 1_000,
      effectiveTransmittedActive:
        combined.stresses.effectiveTransmittedActivePa / 1_000,
      passiveEquilibrium: combined.stresses.passiveEquilibriumPa / 1_000,
      slsOverstress: combined.stresses.slsOverstressPa / 1_000,
      totalTransmitted: combined.stresses.totalTransmittedPa / 1_000,
    }),
    energiesJPerM3: Object.freeze({
      passiveEquilibriumStorage:
        combined.energies.passiveEquilibriumStorageJPerM3,
      slsStorage: combined.energies.slsStorageJPerM3,
    }),
    activeWork: Object.freeze({
      continuousTissueEquivalentSourcePowerDensityWPerM3:
        combined.activeWork.continuousTissueEquivalentSourcePowerDensityWPerM3,
      continuousEffectiveWallPowerDensityWPerM3:
        combined.activeWork.continuousEffectiveWallPowerDensityWPerM3,
      continuousResidualWPerM3:
        combined.activeWork.continuousPowerResidualWPerM3,
      discreteTissueEquivalentSourcePowerDensityWPerM3:
        combined.activeWork.discreteTissueEquivalentSourcePowerDensityWPerM3,
      discreteEffectiveWallPowerDensityWPerM3:
        combined.activeWork.discreteEffectiveWallPowerDensityWPerM3,
      discreteResidualWPerM3: combined.activeWork.discretePowerResidualWPerM3,
      tissueEquivalentSourceReportedPowerDensityWPerM3:
        combined.activeWork.tissueEquivalentSourceReportedPowerDensityWPerM3,
      sourceReportedResidualWPerM3:
        combined.activeWork.sourceReportedPowerResidualWPerM3,
      finiteDifferenceWorkResidualPa:
        combined.activeWork.finiteDifferenceWorkConjugacyResidualPa,
    }),
    slsWorkBalance: Object.freeze({
      workIncrementJPerM3: passive.slsBalance.workIncrementJPerM3,
      storageIncrementJPerM3: passive.slsBalance.storageIncrementJPerM3,
      physicalRelaxationDissipationJPerM3:
        passive.slsBalance.physicalRelaxationDissipationJPerM3,
      backwardEulerNumericalDissipationJPerM3:
        passive.slsBalance.backwardEulerNumericalDissipationJPerM3,
      discreteBalanceResidualJPerM3:
        passive.slsBalance.discreteBalanceResidualJPerM3,
    }),
    landHealth: Object.freeze({ ...active.health }),
    landSolver: Object.freeze({ ...active.solver }),
  });
}

function initialWallDiagnostics(): MutableWallDiagnostics {
  return {
    maximumAbsoluteContinuousPowerResidualWPerM3: 0,
    maximumAbsoluteDiscretePowerResidualWPerM3: 0,
    maximumAbsoluteSourceReportedPowerResidualWPerM3: 0,
    maximumAbsoluteFiniteDifferenceWorkResidualPa: 0,
    maximumAbsoluteSlsBalanceResidualJPerM3: 0,
    maximumAbsoluteStateConservationResidual: 0,
    minimumLandPopulation: Number.POSITIVE_INFINITY,
    landProjectionOccurred: false,
    maximumLandSolverIterations: 0,
    maximumLandSolverResidualNorm: 0,
    totalLandSolverIterations: 0,
    totalLandSolverLineSearchSteps: 0,
  };
}

function accumulateWallDiagnostics(
  diagnostic: MutableWallDiagnostics,
  trial: LandActivePassiveSlsTrialV1,
): void {
  const active = trial.activeTrial.readback;
  const passive = trial.passiveSlsTrial.readback;
  const combined = trial.readback;
  if (active == null || passive == null || combined == null) {
    throw new Error("accepted wall trial is missing diagnostics");
  }
  diagnostic.maximumAbsoluteContinuousPowerResidualWPerM3 = Math.max(
    diagnostic.maximumAbsoluteContinuousPowerResidualWPerM3,
    Math.abs(combined.activeWork.continuousPowerResidualWPerM3),
  );
  diagnostic.maximumAbsoluteDiscretePowerResidualWPerM3 = Math.max(
    diagnostic.maximumAbsoluteDiscretePowerResidualWPerM3,
    Math.abs(combined.activeWork.discretePowerResidualWPerM3),
  );
  diagnostic.maximumAbsoluteSourceReportedPowerResidualWPerM3 = Math.max(
    diagnostic.maximumAbsoluteSourceReportedPowerResidualWPerM3,
    Math.abs(combined.activeWork.sourceReportedPowerResidualWPerM3),
  );
  diagnostic.maximumAbsoluteFiniteDifferenceWorkResidualPa = Math.max(
    diagnostic.maximumAbsoluteFiniteDifferenceWorkResidualPa,
    Math.abs(combined.activeWork.finiteDifferenceWorkConjugacyResidualPa),
  );
  diagnostic.maximumAbsoluteSlsBalanceResidualJPerM3 = Math.max(
    diagnostic.maximumAbsoluteSlsBalanceResidualJPerM3,
    Math.abs(passive.slsBalance.discreteBalanceResidualJPerM3),
  );
  diagnostic.maximumAbsoluteStateConservationResidual = Math.max(
    diagnostic.maximumAbsoluteStateConservationResidual,
    Math.abs(active.health.stateConservationResidual),
  );
  diagnostic.minimumLandPopulation = Math.min(
    diagnostic.minimumLandPopulation,
    active.health.minimumPopulation,
  );
  diagnostic.landProjectionOccurred ||= active.health.projectionUsed;
  diagnostic.maximumLandSolverIterations = Math.max(
    diagnostic.maximumLandSolverIterations,
    active.solver.iterations,
  );
  diagnostic.maximumLandSolverResidualNorm = Math.max(
    diagnostic.maximumLandSolverResidualNorm,
    active.solver.residualNorm,
  );
  diagnostic.totalLandSolverIterations += active.solver.iterations;
  diagnostic.totalLandSolverLineSearchSteps += active.solver.lineSearchSteps;
}

function freezeWallDiagnostics(
  diagnostics: Readonly<Record<NoAvpdWallIdV1, MutableWallDiagnostics>>,
  hasAcceptedStep: boolean,
) {
  return mapWalls((wallId) => {
    const diagnostic = diagnostics[wallId];
    return Object.freeze({
      ...diagnostic,
      minimumLandPopulation: hasAcceptedStep
        ? diagnostic.minimumLandPopulation
        : null,
    });
  });
}

function inferSlsVariant(
  params: NoAvpdFivePatchLandTriSegParamsV1,
): NoAvpdFivePatchLandSlsVariantV1 {
  const enabled = mapWalls(
    (wallId) => materialAt(params, wallId).passiveSls.sls.enabled,
  );
  if (NO_AVPD_FIVE_PATCH_LAND_WALL_IDS_V1.every((wallId) => !enabled[wallId])) {
    return "off";
  }
  if (
    enabled.leftAtrium &&
    enabled.rightAtrium &&
    !enabled.leftFreeWall &&
    !enabled.septum &&
    !enabled.rightFreeWall
  ) {
    return "atrial-only";
  }
  if (NO_AVPD_FIVE_PATCH_LAND_WALL_IDS_V1.every((wallId) => enabled[wallId])) {
    return "all-patch";
  }
  throw new Error(
    "supplied params do not match an off, atrial-only, or all-patch SLS variant",
  );
}

function materialAt(
  params: NoAvpdFivePatchLandTriSegParamsV1,
  wallId: NoAvpdWallIdV1,
) {
  switch (wallId) {
    case "leftAtrium":
      return params.atria.left.material;
    case "rightAtrium":
      return params.atria.right.material;
    case "leftFreeWall":
      return params.triSeg.leftFreeWall.material;
    case "septum":
      return params.triSeg.septum.material;
    case "rightFreeWall":
      return params.triSeg.rightFreeWall.material;
  }
}

function normalizedStateDrift(
  earlier: NoAvpdFivePatchLandTriSegStateV1,
  later: NoAvpdFivePatchLandTriSegStateV1,
) {
  const left = flattenNumbers(earlier).filter(
    (entry) => entry.path !== "timeSec",
  );
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
    if (other == null) {
      throw new Error(`return-map state path missing: ${entry.path}`);
    }
    if (!Number.isFinite(entry.value) || !Number.isFinite(other)) {
      allComponentsFinite = false;
      continue;
    }
    const normalized =
      Math.abs(other - entry.value) /
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

function flattenNumbers(
  value: unknown,
  path = "",
): { path: string; value: number }[] {
  if (typeof value === "number") return [{ path, value }];
  if (value == null || typeof value !== "object") return [];
  if (Array.isArray(value)) {
    return value.flatMap((entry, index) =>
      flattenNumbers(entry, path ? `${path}.${index}` : String(index)),
    );
  }
  return Object.entries(value).flatMap(([key, entry]) =>
    flattenNumbers(entry, path ? `${path}.${key}` : key),
  );
}

function minimumVolume(state: NoAvpdFivePatchLandTriSegStateV1): number {
  return Math.min(...Object.values(state.volumes));
}

function minimumVolumePath(state: NoAvpdFivePatchLandTriSegStateV1): string {
  const [key] = Object.entries(state.volumes).reduce((best, candidate) =>
    candidate[1] < best[1] ? candidate : best,
  );
  return `volumes.${key}`;
}

function mapWalls<T>(
  mapper: (wallId: NoAvpdWallIdV1) => T,
): Readonly<Record<NoAvpdWallIdV1, T>> {
  return Object.freeze(
    Object.fromEntries(
      NO_AVPD_FIVE_PATCH_LAND_WALL_IDS_V1.map((wallId) => [
        wallId,
        mapper(wallId),
      ]),
    ) as Record<NoAvpdWallIdV1, T>,
  );
}

function validateOptions(
  beats: number,
  dtSec: number,
  cycleLengthSec: number,
  returnMapTolerance: number | undefined,
): void {
  if (!Number.isInteger(beats) || beats < 1) {
    throw new Error("beats must be an integer >= 1");
  }
  if (!(dtSec > 0) || !Number.isFinite(dtSec)) {
    throw new Error("dtSec must be positive and finite");
  }
  const steps = cycleLengthSec / dtSec;
  if (Math.abs(steps - Math.round(steps)) > 1e-10) {
    throw new Error("cycleLengthSec must be an integer multiple of dtSec");
  }
  if (
    returnMapTolerance != null &&
    (!Number.isFinite(returnMapTolerance) || returnMapTolerance < 0)
  ) {
    throw new Error(
      "fullStateReturnMapMaxAbsDimensionlessTolerance must be finite and non-negative when supplied",
    );
  }
}
