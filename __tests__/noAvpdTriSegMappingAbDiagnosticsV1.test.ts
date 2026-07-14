import { describe, expect, it } from "vitest";

import {
  NO_AVPD_TRISEG_MAPPING_AB_CLAIM_BOUNDARY_V1,
  summarizeNoAvpdTriSegMappingAbDiagnosticsV1,
  type NoAvpdTriSegMappingAbCandidateV1,
  type NoAvpdTriSegMappingModeV1,
} from "@/engine/mechanics2/diagnostics/NoAvpdTriSegMappingAbDiagnosticsV1";

describe("NoAvpdTriSegMappingAbDiagnosticsV1", () => {
  it("compares passive re-equilibration and closed-loop numerics without selecting a winner", () => {
    const report = summarizeNoAvpdTriSegMappingAbDiagnosticsV1([
      candidate("lumens-2009-representative-tension-area-work", 0),
      candidate("full-fiber-energy-gradient", 1),
    ]);

    expect(report.parameterIsolation.nonMappingParametersIdentical).toBe(true);
    expect(report.passiveComparison.availability).toBe("available");
    expect(
      report.passiveComparison.fullFiberEnergyGradientMinusLumens
        ?.junctionRadiusCm,
    ).toBeCloseTo(0.1, 14);
    expect(
      report.passiveComparison.fullFiberEnergyGradientMinusLumens,
    ).toMatchObject({
      septalCapVolumeMl: 1,
      leftVentricleTransmuralMmHg: 1,
      rightVentricleTransmuralMmHg: 1,
      iterations: 1,
    });
    expect(report.closedLoopComparison.availability).toBe("available");
    expect(
      report.closedLoopComparison.fullFiberEnergyGradientMinusLumens,
    ).toMatchObject({
      totalGlobalIterations: 1,
      totalGlobalResidualEvaluations: 1,
      totalGlobalJacobianEvaluations: 1,
      totalGlobalLineSearchBacktracks: 1,
    });
    expect(
      report.closedLoopComparison.fullFiberEnergyGradientMinusLumens
        ?.maxAbsNormalizedOneBeatStateDrift,
    ).toBeCloseTo(1, 14);
    expect(report.interpretation.fullFiberEnergyGradientPromoted).toBe(false);
    expect(report.interpretation.lumensMappingRejected).toBe(false);
    expect(report.interpretation.physiologyWinnerSelected).toBe(false);
    expect(report.interpretation.mitralEAUsedForDecision).toBe(false);
    expect(
      NO_AVPD_TRISEG_MAPPING_AB_CLAIM_BOUNDARY_V1.thisScreenCannotSelectDefault,
    ).toBe(true);
  });

  it("retains a full-gradient cold-start failure instead of fabricating a comparison", () => {
    const failed = candidate("full-fiber-energy-gradient", 1);
    const report = summarizeNoAvpdTriSegMappingAbDiagnosticsV1([
      candidate("lumens-2009-representative-tension-area-work", 0),
      {
        ...failed,
        passiveReequilibration: {
          ...failed.passiveReequilibration,
          executionStatus: "fail",
          failureReason: "no-finite-passive-root",
          structuredFailure: {
            stage: "equilibrium-solver",
            termination: "no-finite-trial",
            reason: "no-finite-passive-root",
          },
          equilibratedCoordinates: null,
          coordinateShiftFromInitial: null,
          equilibriumReadback: null,
        },
        closedLoop: {
          ...failed.closedLoop,
          coldStartExceptionCaptured: true,
          structuralStatus: "fail",
          failureReason: "cold-start:no-finite-passive-root",
          beatsCompleted: 0,
          allStepsAccepted: false,
          hardDiagnostics: null,
          solverWork: null,
          exactOneBeatReturnMap: null,
          reportOnlyMitralEA: null,
        },
      },
    ]);

    expect(report.passiveComparison.availability).toBe(
      "unavailable-candidate-failure",
    );
    expect(report.closedLoopComparison.availability).toBe(
      "unavailable-candidate-failure",
    );
    expect(
      report.closedLoopComparison.fullFiberEnergyGradientMinusLumens,
    ).toBeNull();
    expect(report.closedLoopComparison.failedCandidates).toEqual([
      {
        mappingMode: "full-fiber-energy-gradient",
        failureReason: "cold-start:no-finite-passive-root",
        beatsCompleted: 0,
        coldStartExceptionCaptured: true,
      },
    ]);
    expect(report.interpretation.comparisonComplete).toBe(false);
  });

  it("requires exactly one candidate for each mapping", () => {
    const legacy = candidate("lumens-2009-representative-tension-area-work", 0);
    expect(() =>
      summarizeNoAvpdTriSegMappingAbDiagnosticsV1([legacy, legacy]),
    ).toThrow(
      "expected exactly one lumens-2009-representative-tension-area-work candidate, found 2",
    );
  });
});

function candidate(
  mappingMode: NoAvpdTriSegMappingModeV1,
  offset: number,
): NoAvpdTriSegMappingAbCandidateV1 {
  return {
    mappingMode,
    parameterSha256: `parameters-${mappingMode}`,
    nonMappingParameterSha256: "shared-non-mapping-parameters",
    passiveReequilibration: {
      protocol:
        "fixed-default-biventricular-blood-volumes-zero-activation-long-time-passive-wall-equilibrium",
      executionStatus: "pass",
      failureReason: null,
      structuredFailure: null,
      mappingClosure: {
        pressureAndTwoResidualCoordinatesUseSameMapping: true,
        residualScaling:
          mappingMode === "full-fiber-energy-gradient"
            ? "per-coordinate-sum-absolute-wall-contributions"
            : "lumens-line-tension-relative-magnitude",
      },
      fixedBloodVolumesMl: {
        leftVentricle: 140,
        rightVentricle: 150,
      },
      initialCoordinates: {
        junctionRadiusCm: 3.3,
        septalCapVolumeMl: 0,
      },
      equilibratedCoordinates: {
        junctionRadiusCm: 3.3 + offset * 0.1,
        septalCapVolumeMl: offset,
      },
      coordinateShiftFromInitial: {
        junctionRadiusCm: offset * 0.1,
        septalCapVolumeMl: offset,
      },
      equilibriumReadback: {
        leftVentricleTransmuralMmHg: 5 + offset,
        rightVentricleTransmuralMmHg: 2 + offset,
        septalCapResidualPa: 1e-8 + offset,
        junctionRadiusResidualN: 1e-9 + offset,
        relativeResidual: 1e-10 + offset,
        iterations: 4 + offset,
        functionEvaluations: 20 + offset,
        jacobianEvaluations: 4 + offset,
        termination: "converged",
        initialCoordinatesWereClamped: false,
        boundContact: {
          junctionRadius: "none",
          septalCapVolume: "none",
        },
      },
    },
    closedLoop: {
      initialization: "independent-passive-reequilibrated-cold-start",
      coldStartExceptionCaptured: false,
      structuralStatus: "pass",
      failureReason: null,
      beatsRequested: 32,
      beatsCompleted: 32,
      dtSec: 0.005,
      allStepsAccepted: true,
      hardDiagnostics: {
        maxAbsTotalBloodVolumeDriftMl: 1e-9 + offset,
        maxAbsStepBloodVolumeResidualMl: 1e-10 + offset,
        maxGlobalScaledResidual: 1e-8 + offset,
        maxTriSegRelativeResidual: 1e-8 + offset,
        maxSerialEquilibriumResidualPa: 1e-5 + offset,
        maxSlsBalanceResidualJPerM3: 1e-5 + offset,
        maxSerialWorkBalanceResidualJPerM3: 1e-5 + offset,
      },
      solverWork: {
        stepsAttempted: 6_400,
        stepsAccepted: 6_400,
        totalGlobalIterations: 10_000 + offset,
        totalGlobalResidualEvaluations: 20_000 + offset,
        totalGlobalJacobianEvaluations: 3_000 + offset,
        totalGlobalLineSearchBacktracks: 10 + offset,
        maximumGlobalIterationsPerStep: 8,
        meanGlobalIterationsPerAcceptedStep: 1.5 + offset,
      },
      exactOneBeatReturnMap: {
        availability: "available-exact-integer-step-boundaries",
        maxAbsNormalizedStateDrift: 0.001 + offset,
      },
      reportOnlyMitralEA: {
        ePeakMlPerSec: 300 + offset,
        aPeakMlPerSec: 200 + offset,
        eToA: 1.5 + offset,
        usedForGateOrRanking: false,
      },
      mappingClosureVerifiedAtEveryAcceptedStep: true,
      warmCheckpointCrossedMapping: false,
    },
  };
}
