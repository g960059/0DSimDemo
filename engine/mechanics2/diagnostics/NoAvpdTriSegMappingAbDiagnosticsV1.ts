export const NO_AVPD_TRISEG_MAPPING_AB_DIAGNOSTIC_ID_V1 =
  "no-avpd-triseg-mapping-ab-diagnostic-v1" as const;

export const NO_AVPD_TRISEG_MAPPING_AB_CLAIM_BOUNDARY_V1 = Object.freeze({
  evidenceStatus:
    "report-only-literature-vs-variational-work-mapping-structural-numerical-comparison" as const,
  researchSidecarOnly: true as const,
  runtimeReplacementAuthorized: false as const,
  physiologyPromotionAuthorized: false as const,
  parameterCalibrationAuthorized: false as const,
  winnerSelectionApplied: false as const,
  legacyInterpretation:
    "literature-faithful-lumens-2009-equation-16-representative-tension-area-work-with-stated-polynomial-approximation" as const,
  alternativeInterpretation:
    "full-fiber-energy-gradient-variational-interpretation-not-an-automatic-correction" as const,
  thisScreenCannotSelectDefault: true as const,
  mappingIsOnlyDeclaredParameterDifference: true as const,
  passiveReequilibrationRequiredBeforeClosedLoopInterpretation: true as const,
  coldStartFailureMustBeRetained: true as const,
  bloodVolumeLedgerOwner:
    "closed-loop-compartment-ledger-Qvenous-minus-QAV-no-hidden-geometry-volume" as const,
  mitralEAUse: "continuous-report-only-never-a-gate-or-ranking-term" as const,
  mappingClosure:
    "one-mapping-must-own-both-ventricular-pressures-and-both-algebraic-residuals-no-mixed-closure" as const,
  wallStressMeasureBoundary:
    "constant-incompressible-wall-volume-J-equals-1-makes-declared-one-dimensional-kirchhoff-stress-numerically-equal-cauchy-stress" as const,
  warmCheckpointCrossingMappingAllowed: false as const,
});

export type NoAvpdTriSegMappingModeV1 =
  "lumens-2009-representative-tension-area-work" | "full-fiber-energy-gradient";

export type NoAvpdTriSegMappingAbPassiveReequilibrationV1 = {
  readonly protocol: "fixed-default-biventricular-blood-volumes-zero-activation-long-time-passive-wall-equilibrium";
  readonly executionStatus: "pass" | "fail";
  readonly failureReason: string | null;
  readonly structuredFailure: {
    readonly stage:
      "input" | "geometry" | "fiber-stress" | "equilibrium-solver";
    readonly termination: string | null;
    readonly reason: string;
  } | null;
  readonly mappingClosure: {
    readonly pressureAndTwoResidualCoordinatesUseSameMapping: boolean;
    readonly residualScaling:
      | "lumens-line-tension-relative-magnitude"
      | "per-coordinate-sum-absolute-wall-contributions";
  };
  readonly fixedBloodVolumesMl: {
    readonly leftVentricle: number;
    readonly rightVentricle: number;
  };
  readonly initialCoordinates: {
    readonly junctionRadiusCm: number;
    readonly septalCapVolumeMl: number;
  };
  readonly equilibratedCoordinates: {
    readonly junctionRadiusCm: number;
    readonly septalCapVolumeMl: number;
  } | null;
  readonly coordinateShiftFromInitial: {
    readonly junctionRadiusCm: number;
    readonly septalCapVolumeMl: number;
  } | null;
  readonly equilibriumReadback: {
    readonly leftVentricleTransmuralMmHg: number;
    readonly rightVentricleTransmuralMmHg: number;
    readonly septalCapResidualPa: number;
    readonly junctionRadiusResidualN: number;
    readonly relativeResidual: number;
    readonly iterations: number;
    readonly functionEvaluations: number;
    readonly jacobianEvaluations: number | null;
    readonly termination: string;
    readonly initialCoordinatesWereClamped: boolean;
    readonly boundContact: {
      readonly junctionRadius: "lower" | "upper" | "none";
      readonly septalCapVolume: "lower" | "upper" | "none";
    };
  } | null;
};

export type NoAvpdTriSegMappingAbClosedLoopV1 = {
  readonly initialization: "independent-passive-reequilibrated-cold-start";
  readonly coldStartExceptionCaptured: boolean;
  readonly structuralStatus: "pass" | "fail";
  readonly failureReason: string | null;
  readonly beatsRequested: number;
  readonly beatsCompleted: number;
  readonly dtSec: number;
  readonly allStepsAccepted: boolean;
  readonly hardDiagnostics: {
    readonly maxAbsTotalBloodVolumeDriftMl: number;
    readonly maxAbsStepBloodVolumeResidualMl: number;
    readonly maxGlobalScaledResidual: number;
    readonly maxTriSegRelativeResidual: number;
    readonly maxSerialEquilibriumResidualPa: number;
    readonly maxSlsBalanceResidualJPerM3: number;
    readonly maxSerialWorkBalanceResidualJPerM3: number;
  } | null;
  readonly solverWork: {
    readonly stepsAttempted: number;
    readonly stepsAccepted: number;
    readonly totalGlobalIterations: number;
    readonly totalGlobalResidualEvaluations: number;
    readonly totalGlobalJacobianEvaluations: number;
    readonly totalGlobalLineSearchBacktracks: number;
    readonly maximumGlobalIterationsPerStep: number;
    readonly meanGlobalIterationsPerAcceptedStep: number | null;
  } | null;
  readonly exactOneBeatReturnMap: {
    readonly availability:
      | "available-exact-integer-step-boundaries"
      | "unavailable-cycle-length-not-integer-multiple-of-dt";
    readonly maxAbsNormalizedStateDrift: number | null;
  } | null;
  readonly reportOnlyMitralEA: {
    readonly ePeakMlPerSec: number | null;
    readonly aPeakMlPerSec: number | null;
    readonly eToA: number | null;
    readonly usedForGateOrRanking: false;
  } | null;
  readonly mappingClosureVerifiedAtEveryAcceptedStep: boolean;
  readonly warmCheckpointCrossedMapping: false;
};

export type NoAvpdTriSegMappingAbCandidateV1 = {
  readonly mappingMode: NoAvpdTriSegMappingModeV1;
  readonly parameterSha256: string;
  readonly nonMappingParameterSha256: string;
  readonly passiveReequilibration: NoAvpdTriSegMappingAbPassiveReequilibrationV1;
  readonly closedLoop: NoAvpdTriSegMappingAbClosedLoopV1;
};

export type NoAvpdTriSegMappingAbDiagnosticV1 = ReturnType<
  typeof summarizeNoAvpdTriSegMappingAbDiagnosticsV1
>;

export function summarizeNoAvpdTriSegMappingAbDiagnosticsV1(
  candidates: readonly NoAvpdTriSegMappingAbCandidateV1[],
) {
  const legacy = requireUniqueCandidate(
    candidates,
    "lumens-2009-representative-tension-area-work",
  );
  const fullGradient = requireUniqueCandidate(
    candidates,
    "full-fiber-energy-gradient",
  );
  const nonMappingParametersIdentical =
    legacy.nonMappingParameterSha256 === fullGradient.nonMappingParameterSha256;
  const mappingClosureVerified = candidates.every(
    (candidate) =>
      candidate.passiveReequilibration.mappingClosure
        .pressureAndTwoResidualCoordinatesUseSameMapping &&
      candidate.closedLoop.mappingClosureVerifiedAtEveryAcceptedStep &&
      !candidate.closedLoop.warmCheckpointCrossedMapping,
  );
  const bothPassiveReequilibrated =
    legacy.passiveReequilibration.executionStatus === "pass" &&
    fullGradient.passiveReequilibration.executionStatus === "pass";
  const bothClosedLoopStructuralPass =
    legacy.closedLoop.structuralStatus === "pass" &&
    fullGradient.closedLoop.structuralStatus === "pass";
  const structuralNumericalDelta = bothClosedLoopStructuralPass
    ? closedLoopDelta(fullGradient.closedLoop, legacy.closedLoop)
    : null;
  const passiveCoordinateDelta = bothPassiveReequilibrated
    ? passiveDelta(
        fullGradient.passiveReequilibration,
        legacy.passiveReequilibration,
      )
    : null;

  return {
    diagnosticId: NO_AVPD_TRISEG_MAPPING_AB_DIAGNOSTIC_ID_V1,
    claimBoundary: NO_AVPD_TRISEG_MAPPING_AB_CLAIM_BOUNDARY_V1,
    statusScope:
      "execution-availability-and-structural-numerical-comparison-only" as const,
    candidates,
    parameterIsolation: {
      nonMappingParametersIdentical,
      legacyParameterSha256: legacy.parameterSha256,
      fullFiberEnergyGradientParameterSha256: fullGradient.parameterSha256,
      sharedNonMappingParameterSha256: nonMappingParametersIdentical
        ? legacy.nonMappingParameterSha256
        : null,
    },
    mappingClosureVerification: {
      verified: mappingClosureVerified,
      allFourGeneralizedCoordinatesRequired: true as const,
      mixedPressureResidualMappingAllowed: false as const,
      crossMappingWarmResumeAllowed: false as const,
    },
    passiveComparison: {
      availability: bothPassiveReequilibrated
        ? ("available" as const)
        : ("unavailable-candidate-failure" as const),
      bothCandidatesReequilibrated: bothPassiveReequilibrated,
      fullFiberEnergyGradientMinusLumens: passiveCoordinateDelta,
    },
    closedLoopComparison: {
      availability: bothClosedLoopStructuralPass
        ? ("available" as const)
        : ("unavailable-candidate-failure" as const),
      bothCandidatesStructuralPass: bothClosedLoopStructuralPass,
      fullFiberEnergyGradientMinusLumens: structuralNumericalDelta,
      failedCandidates: candidates
        .filter((candidate) => candidate.closedLoop.structuralStatus === "fail")
        .map((candidate) => ({
          mappingMode: candidate.mappingMode,
          failureReason: candidate.closedLoop.failureReason,
          beatsCompleted: candidate.closedLoop.beatsCompleted,
          coldStartExceptionCaptured:
            candidate.closedLoop.coldStartExceptionCaptured,
        })),
    },
    interpretation: {
      comparisonComplete:
        nonMappingParametersIdentical &&
        mappingClosureVerified &&
        bothPassiveReequilibrated &&
        bothClosedLoopStructuralPass,
      fullFiberEnergyGradientPromoted: false as const,
      lumensMappingRejected: false as const,
      physiologyWinnerSelected: false as const,
      mitralEAUsedForDecision: false as const,
      mixedMappingClosureAccepted: false as const,
      warmCheckpointCrossingMappingAccepted: false as const,
      nextDecision:
        "inspect-structural-numerical-differences-and-dt-refinement-before-any-physiology-or-default-change" as const,
    },
  };
}

function requireUniqueCandidate(
  candidates: readonly NoAvpdTriSegMappingAbCandidateV1[],
  mappingMode: NoAvpdTriSegMappingModeV1,
): NoAvpdTriSegMappingAbCandidateV1 {
  const matching = candidates.filter(
    (candidate) => candidate.mappingMode === mappingMode,
  );
  if (matching.length !== 1) {
    throw new Error(
      `expected exactly one ${mappingMode} candidate, found ${matching.length}`,
    );
  }
  return matching[0]!;
}

function passiveDelta(
  fullGradient: NoAvpdTriSegMappingAbPassiveReequilibrationV1,
  legacy: NoAvpdTriSegMappingAbPassiveReequilibrationV1,
) {
  const fullGradientCoordinates = fullGradient.equilibratedCoordinates!;
  const legacyCoordinates = legacy.equilibratedCoordinates!;
  const fullGradientReadback = fullGradient.equilibriumReadback!;
  const legacyReadback = legacy.equilibriumReadback!;
  return {
    junctionRadiusCm:
      fullGradientCoordinates.junctionRadiusCm -
      legacyCoordinates.junctionRadiusCm,
    septalCapVolumeMl:
      fullGradientCoordinates.septalCapVolumeMl -
      legacyCoordinates.septalCapVolumeMl,
    leftVentricleTransmuralMmHg:
      fullGradientReadback.leftVentricleTransmuralMmHg -
      legacyReadback.leftVentricleTransmuralMmHg,
    rightVentricleTransmuralMmHg:
      fullGradientReadback.rightVentricleTransmuralMmHg -
      legacyReadback.rightVentricleTransmuralMmHg,
    iterations: fullGradientReadback.iterations - legacyReadback.iterations,
  };
}

function closedLoopDelta(
  fullGradient: NoAvpdTriSegMappingAbClosedLoopV1,
  legacy: NoAvpdTriSegMappingAbClosedLoopV1,
) {
  const fullGradientHard = fullGradient.hardDiagnostics!;
  const legacyHard = legacy.hardDiagnostics!;
  const fullGradientWork = fullGradient.solverWork!;
  const legacyWork = legacy.solverWork!;
  return {
    maxAbsTotalBloodVolumeDriftMl:
      fullGradientHard.maxAbsTotalBloodVolumeDriftMl -
      legacyHard.maxAbsTotalBloodVolumeDriftMl,
    maxAbsStepBloodVolumeResidualMl:
      fullGradientHard.maxAbsStepBloodVolumeResidualMl -
      legacyHard.maxAbsStepBloodVolumeResidualMl,
    maxGlobalScaledResidual:
      fullGradientHard.maxGlobalScaledResidual -
      legacyHard.maxGlobalScaledResidual,
    maxTriSegRelativeResidual:
      fullGradientHard.maxTriSegRelativeResidual -
      legacyHard.maxTriSegRelativeResidual,
    maxSerialEquilibriumResidualPa:
      fullGradientHard.maxSerialEquilibriumResidualPa -
      legacyHard.maxSerialEquilibriumResidualPa,
    maxSlsBalanceResidualJPerM3:
      fullGradientHard.maxSlsBalanceResidualJPerM3 -
      legacyHard.maxSlsBalanceResidualJPerM3,
    maxSerialWorkBalanceResidualJPerM3:
      fullGradientHard.maxSerialWorkBalanceResidualJPerM3 -
      legacyHard.maxSerialWorkBalanceResidualJPerM3,
    totalGlobalIterations:
      fullGradientWork.totalGlobalIterations - legacyWork.totalGlobalIterations,
    totalGlobalResidualEvaluations:
      fullGradientWork.totalGlobalResidualEvaluations -
      legacyWork.totalGlobalResidualEvaluations,
    totalGlobalJacobianEvaluations:
      fullGradientWork.totalGlobalJacobianEvaluations -
      legacyWork.totalGlobalJacobianEvaluations,
    totalGlobalLineSearchBacktracks:
      fullGradientWork.totalGlobalLineSearchBacktracks -
      legacyWork.totalGlobalLineSearchBacktracks,
    meanGlobalIterationsPerAcceptedStep:
      fullGradientWork.meanGlobalIterationsPerAcceptedStep == null ||
      legacyWork.meanGlobalIterationsPerAcceptedStep == null
        ? null
        : fullGradientWork.meanGlobalIterationsPerAcceptedStep -
          legacyWork.meanGlobalIterationsPerAcceptedStep,
    maxAbsNormalizedOneBeatStateDrift:
      fullGradient.exactOneBeatReturnMap?.maxAbsNormalizedStateDrift == null ||
      legacy.exactOneBeatReturnMap?.maxAbsNormalizedStateDrift == null
        ? null
        : fullGradient.exactOneBeatReturnMap.maxAbsNormalizedStateDrift -
          legacy.exactOneBeatReturnMap.maxAbsNormalizedStateDrift,
  };
}
