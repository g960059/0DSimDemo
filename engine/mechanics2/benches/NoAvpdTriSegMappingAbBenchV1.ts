import {
  runNoAvpdFourChamberHillTriSegBenchV1,
  type NoAvpdFourChamberBenchResultV1,
} from "@/engine/mechanics2/benches/NoAvpdFourChamberHillTriSegBenchV1";
import type {
  NoAvpdTriSegMappingAbClosedLoopV1,
  NoAvpdTriSegMappingAbPassiveReequilibrationV1,
  NoAvpdTriSegMappingModeV1,
} from "@/engine/mechanics2/diagnostics/NoAvpdTriSegMappingAbDiagnosticsV1";
import type {
  TriSegAlgebraicSolutionV1,
  TriSegFullFiberEnergyGradientSolutionV1,
  TriSegGeneralizedForceMappingV1,
} from "@/engine/mechanics2/geometry/TriSegGeometryV1";
import {
  DEFAULT_NO_AVPD_FOUR_CHAMBER_HILL_TRISEG_PARAMS_V1,
  solveNoAvpdPassiveTriSegEquilibriumV1,
  type NoAvpdBloodVolumesV1,
  type NoAvpdFourChamberHillTriSegParamsV1,
  type NoAvpdTriSegEquilibriumSolutionV1,
} from "@/engine/mechanics2/subsystems/NoAvpdFourChamberHillTriSegV1";

export const NO_AVPD_TRISEG_MAPPING_AB_BENCH_ID_V1 =
  "no-avpd-triseg-mapping-ab-bench-v1" as const;

export const NO_AVPD_TRISEG_MAPPING_AB_PROTOCOL_V1 = Object.freeze({
  protocolId: "no-avpd-triseg-mapping-ab-v1" as const,
  mappingOrder: [
    "lumens-2009-representative-tension-area-work",
    "full-fiber-energy-gradient",
  ] as const satisfies readonly TriSegGeneralizedForceMappingV1[],
  comparison:
    "literature-faithful-lumens-equation-16-mapping-vs-opt-in-full-fiber-energy-gradient-variational-interpretation" as const,
  parameterIsolation:
    "triSegGeneralizedForceMapping-only-all-other-parameters-byte-identical-after-removing-that-key" as const,
  passiveProtocol:
    "fixed-default-biventricular-blood-volumes-zero-activation-long-time-passive-wall-equilibrium" as const,
  passiveInitialCoordinates: {
    junctionRadiusCm: 3.3,
    septalCapVolumeMl: 0,
  } as const,
  closedLoopInitialization:
    "independent-passive-reequilibrated-cold-start-per-mapping-no-cross-mapping-warm-checkpoint" as const,
  closedLoopSampleRetention: "last-two-complete-beats" as const,
  bloodVolumeLedger:
    "unchanged-eight-compartment-ledger-no-geometry-owned-hidden-blood-volume" as const,
  mappingClosure:
    "selected-mapping-owns-left-and-right-ventricular-pressures-plus-septal-volume-and-junction-radius-residuals" as const,
  fullGradientResidualScaling:
    "per-coordinate-sum-absolute-wall-contributions" as const,
  stressMeasureBoundary:
    "constant-incompressible-wall-volume-J-equals-1-so-declared-one-dimensional-kirchhoff-stress-is-numerically-equal-to-cauchy-stress" as const,
  structuralNumericalStatusOnly: true as const,
  physiologyGateApplied: false as const,
  mitralEAUse: "retained-report-only-never-gate-or-ranking" as const,
  winnerSelected: false as const,
  defaultMappingChanged: false as const,
});

export const NO_AVPD_TRISEG_MAPPING_AB_FIXED_VOLUMES_V1 = Object.freeze({
  leftAtriumMl: 65,
  leftVentricleMl: 140,
  systemicArteryMl: 700,
  systemicVeinMl: 3_000,
  rightAtriumMl: 65,
  rightVentricleMl: 150,
  pulmonaryArteryMl: 180,
  pulmonaryVeinMl: 650,
}) satisfies NoAvpdBloodVolumesV1;

export type NoAvpdTriSegMappingAbBenchOptionsV1 = {
  readonly beats?: number;
  readonly dtSec?: number;
  readonly sampleEverySteps?: number;
};

export type NoAvpdTriSegMappingAbBenchCandidateV1 = {
  readonly mappingMode: NoAvpdTriSegMappingModeV1;
  readonly params: NoAvpdFourChamberHillTriSegParamsV1;
  readonly passiveReequilibration: NoAvpdTriSegMappingAbPassiveReequilibrationV1;
  readonly closedLoop: NoAvpdTriSegMappingAbClosedLoopV1;
  /** Full evidence is retained by the artifact writer, normally as gzip. */
  readonly closedLoopSourceReport: NoAvpdFourChamberBenchResultV1 | null;
};

export type NoAvpdTriSegMappingAbBenchResultV1 = {
  readonly benchId: typeof NO_AVPD_TRISEG_MAPPING_AB_BENCH_ID_V1;
  readonly protocol: typeof NO_AVPD_TRISEG_MAPPING_AB_PROTOCOL_V1;
  readonly runOptions: {
    readonly beats: number;
    readonly dtSec: number;
    readonly sampleEverySteps: number;
  };
  readonly candidates: readonly NoAvpdTriSegMappingAbBenchCandidateV1[];
};

export function buildNoAvpdTriSegMappingParamsV1(
  mappingMode: NoAvpdTriSegMappingModeV1,
): NoAvpdFourChamberHillTriSegParamsV1 {
  return {
    ...DEFAULT_NO_AVPD_FOUR_CHAMBER_HILL_TRISEG_PARAMS_V1,
    triSegGeneralizedForceMapping: mappingMode,
    triSegColdInitialization: "passive-reequilibrated",
  };
}

export function runNoAvpdTriSegMappingAbBenchV1(
  options: NoAvpdTriSegMappingAbBenchOptionsV1 = {},
): NoAvpdTriSegMappingAbBenchResultV1 {
  const runOptions = {
    beats: options.beats ?? 32,
    dtSec: options.dtSec ?? 0.005,
    sampleEverySteps: options.sampleEverySteps ?? 1,
  };
  requireRunOptions(runOptions);
  return {
    benchId: NO_AVPD_TRISEG_MAPPING_AB_BENCH_ID_V1,
    protocol: NO_AVPD_TRISEG_MAPPING_AB_PROTOCOL_V1,
    runOptions,
    candidates: NO_AVPD_TRISEG_MAPPING_AB_PROTOCOL_V1.mappingOrder.map(
      (mappingMode) => runCandidate(mappingMode, runOptions),
    ),
  };
}

function runCandidate(
  mappingMode: NoAvpdTriSegMappingModeV1,
  options: {
    readonly beats: number;
    readonly dtSec: number;
    readonly sampleEverySteps: number;
  },
): NoAvpdTriSegMappingAbBenchCandidateV1 {
  const params = buildNoAvpdTriSegMappingParamsV1(mappingMode);
  const passiveReequilibration = runPassiveReequilibration(params);
  let closedLoopSourceReport: NoAvpdFourChamberBenchResultV1 | null = null;
  let closedLoop: NoAvpdTriSegMappingAbClosedLoopV1;
  try {
    closedLoopSourceReport = runNoAvpdFourChamberHillTriSegBenchV1({
      ...options,
      params,
      sampleRetention: "last-two-complete-beats",
    });
    closedLoop = closedLoopSummary(closedLoopSourceReport, mappingMode);
  } catch (error) {
    closedLoop = coldStartFailure(
      mappingMode,
      options,
      error instanceof Error ? error.message : String(error),
    );
  }
  return {
    mappingMode,
    params,
    passiveReequilibration,
    closedLoop,
    closedLoopSourceReport,
  };
}

function runPassiveReequilibration(
  params: NoAvpdFourChamberHillTriSegParamsV1,
): NoAvpdTriSegMappingAbPassiveReequilibrationV1 {
  const mappingMode = params.triSegGeneralizedForceMapping;
  const common = {
    protocol:
      "fixed-default-biventricular-blood-volumes-zero-activation-long-time-passive-wall-equilibrium" as const,
    fixedBloodVolumesMl: {
      leftVentricle: NO_AVPD_TRISEG_MAPPING_AB_FIXED_VOLUMES_V1.leftVentricleMl,
      rightVentricle:
        NO_AVPD_TRISEG_MAPPING_AB_FIXED_VOLUMES_V1.rightVentricleMl,
    },
    initialCoordinates:
      NO_AVPD_TRISEG_MAPPING_AB_PROTOCOL_V1.passiveInitialCoordinates,
    mappingClosure: {
      pressureAndTwoResidualCoordinatesUseSameMapping: true,
      residualScaling:
        mappingMode === "full-fiber-energy-gradient"
          ? ("per-coordinate-sum-absolute-wall-contributions" as const)
          : ("lumens-line-tension-relative-magnitude" as const),
    },
  };
  let solution: NoAvpdTriSegEquilibriumSolutionV1;
  try {
    solution = solveNoAvpdPassiveTriSegEquilibriumV1(
      NO_AVPD_TRISEG_MAPPING_AB_FIXED_VOLUMES_V1,
      params,
    );
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    return {
      ...common,
      mappingClosure: {
        ...common.mappingClosure,
        pressureAndTwoResidualCoordinatesUseSameMapping: false,
      },
      executionStatus: "fail",
      failureReason: reason,
      structuredFailure: {
        stage: "fiber-stress",
        termination: null,
        reason,
      },
      equilibratedCoordinates: null,
      coordinateShiftFromInitial: null,
      equilibriumReadback: null,
    };
  }
  const solutionUsesRequestedMapping =
    mappingMode === "full-fiber-energy-gradient"
      ? "generalizedForceMapping" in solution
      : !("generalizedForceMapping" in solution);
  if (
    !solutionUsesRequestedMapping ||
    !solution.converged ||
    !solution.geometry.valid ||
    !mappingReadbackAvailable(solution)
  ) {
    const reason =
      solution.diagnostics.failureReason ??
      (!solutionUsesRequestedMapping
        ? "passive solver returned the wrong generalized-force mapping"
        : null) ??
      (!solution.geometry.valid
        ? solution.geometry.failureReason
        : "mapping readback unavailable after passive solve");
    return {
      ...common,
      mappingClosure: {
        ...common.mappingClosure,
        pressureAndTwoResidualCoordinatesUseSameMapping:
          solutionUsesRequestedMapping,
      },
      executionStatus: "fail",
      failureReason: reason,
      structuredFailure: {
        stage: !solution.geometry.valid ? "geometry" : "equilibrium-solver",
        termination: solution.diagnostics.termination,
        reason,
      },
      equilibratedCoordinates: null,
      coordinateShiftFromInitial: null,
      equilibriumReadback: null,
    };
  }
  const readback = mappingReadback(solution);
  const bounds = solution.diagnostics.bounds;
  return {
    ...common,
    executionStatus: "pass",
    failureReason: null,
    structuredFailure: null,
    equilibratedCoordinates: solution.coordinates,
    coordinateShiftFromInitial: {
      junctionRadiusCm:
        solution.coordinates.junctionRadiusCm -
        common.initialCoordinates.junctionRadiusCm,
      septalCapVolumeMl:
        solution.coordinates.septalCapVolumeMl -
        common.initialCoordinates.septalCapVolumeMl,
    },
    equilibriumReadback: {
      ...readback,
      iterations: solution.diagnostics.iterations,
      functionEvaluations: solution.diagnostics.functionEvaluations,
      jacobianEvaluations: jacobianEvaluations(solution),
      termination: solution.diagnostics.termination,
      initialCoordinatesWereClamped:
        solution.diagnostics.initialCoordinatesWereClamped,
      boundContact: {
        junctionRadius: boundContact(
          solution.coordinates.junctionRadiusCm,
          bounds.junctionRadiusCm,
        ),
        septalCapVolume: boundContact(
          solution.coordinates.septalCapVolumeMl,
          bounds.septalCapVolumeMl,
        ),
      },
    },
  };
}

function mappingReadbackAvailable(
  solution: NoAvpdTriSegEquilibriumSolutionV1,
): boolean {
  return "generalizedForceMapping" in solution
    ? solution.fullFiberEnergyGradient !== null
    : solution.virtualWork !== null;
}

function mappingReadback(solution: NoAvpdTriSegEquilibriumSolutionV1) {
  if ("generalizedForceMapping" in solution) {
    const readback = solution.fullFiberEnergyGradient!;
    return {
      leftVentricleTransmuralMmHg:
        readback.pressures.leftVentricleTransmuralMmHg,
      rightVentricleTransmuralMmHg:
        readback.pressures.rightVentricleTransmuralMmHg,
      septalCapResidualPa: readback.residuals.septalCapPressurePa,
      junctionRadiusResidualN: readback.residuals.junctionRadiusForceN,
      relativeResidual: readback.residuals.relativeMagnitude,
    };
  }
  const readback = solution.virtualWork!;
  return {
    leftVentricleTransmuralMmHg: readback.pressures.leftVentricleTransmuralMmHg,
    rightVentricleTransmuralMmHg:
      readback.pressures.rightVentricleTransmuralMmHg,
    septalCapResidualPa: readback.residuals.septalCapPressurePa,
    junctionRadiusResidualN: readback.residuals.junctionRadiusForceN,
    relativeResidual: readback.residuals.relativeMagnitude,
  };
}

function jacobianEvaluations(
  solution: TriSegAlgebraicSolutionV1 | TriSegFullFiberEnergyGradientSolutionV1,
): number | null {
  const diagnostics = solution.diagnostics as typeof solution.diagnostics & {
    readonly jacobianEvaluations?: number;
  };
  return diagnostics.jacobianEvaluations ?? null;
}

function boundContact(
  value: number,
  bounds: readonly [number, number],
): "lower" | "upper" | "none" {
  const tolerance =
    1e-9 * Math.max(1, Math.abs(bounds[0]), Math.abs(bounds[1]));
  if (Math.abs(value - bounds[0]) <= tolerance) return "lower";
  if (Math.abs(value - bounds[1]) <= tolerance) return "upper";
  return "none";
}

function closedLoopSummary(
  report: NoAvpdFourChamberBenchResultV1,
  mappingMode: NoAvpdTriSegMappingModeV1,
): NoAvpdTriSegMappingAbClosedLoopV1 {
  const oneBeat =
    report.reportOnlyExactBeatBoundaryReturnMap.oneBeatMapResidual;
  return {
    initialization: "independent-passive-reequilibrated-cold-start",
    coldStartExceptionCaptured: false,
    structuralStatus: report.status,
    failureReason: report.failureReason,
    beatsRequested: report.beatsRequested,
    beatsCompleted: report.beatsCompleted,
    dtSec: report.dtSec,
    allStepsAccepted: report.hardDiagnostics.allStepsAccepted,
    hardDiagnostics: report.hardDiagnostics,
    solverWork: report.solverWork,
    exactOneBeatReturnMap: {
      availability: report.reportOnlyExactBeatBoundaryReturnMap.availability,
      maxAbsNormalizedStateDrift:
        oneBeat?.normalizedFullStateDrift.maxAbsDimensionless ?? null,
    },
    reportOnlyMitralEA: {
      ePeakMlPerSec: report.reportOnlyPhysiology.mitralEPeakMlPerSec,
      aPeakMlPerSec: report.reportOnlyPhysiology.mitralAPeakMlPerSec,
      eToA: report.reportOnlyPhysiology.mitralEToA,
      usedForGateOrRanking: false,
    },
    mappingClosureVerifiedAtEveryAcceptedStep:
      report.parameterSnapshot.triSegGeneralizedForceMapping === mappingMode &&
      report.finalState.triSegGeneralizedForceMapping === mappingMode,
    warmCheckpointCrossedMapping: false,
  };
}

function coldStartFailure(
  _mappingMode: NoAvpdTriSegMappingModeV1,
  options: {
    readonly beats: number;
    readonly dtSec: number;
    readonly sampleEverySteps: number;
  },
  reason: string,
): NoAvpdTriSegMappingAbClosedLoopV1 {
  return {
    initialization: "independent-passive-reequilibrated-cold-start",
    coldStartExceptionCaptured: true,
    structuralStatus: "fail",
    failureReason: `cold-start:${reason}`,
    beatsRequested: options.beats,
    beatsCompleted: 0,
    dtSec: options.dtSec,
    allStepsAccepted: false,
    hardDiagnostics: null,
    solverWork: null,
    exactOneBeatReturnMap: null,
    reportOnlyMitralEA: null,
    mappingClosureVerifiedAtEveryAcceptedStep: false,
    warmCheckpointCrossedMapping: false,
  };
}

function requireRunOptions(options: {
  readonly beats: number;
  readonly dtSec: number;
  readonly sampleEverySteps: number;
}): void {
  if (!Number.isInteger(options.beats) || options.beats <= 0) {
    throw new Error("beats must be a positive integer");
  }
  if (!Number.isFinite(options.dtSec) || options.dtSec <= 0) {
    throw new Error("dtSec must be positive and finite");
  }
  if (
    !Number.isInteger(options.sampleEverySteps) ||
    options.sampleEverySteps <= 0
  ) {
    throw new Error("sampleEverySteps must be a positive integer");
  }
}
