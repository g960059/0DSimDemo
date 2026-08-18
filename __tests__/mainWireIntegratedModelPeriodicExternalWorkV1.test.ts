import { describe, expect, it } from "vitest";

import {
  MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_EXTERNAL_WORK_POLICY_V1,
  qualifyMainWireIntegratedModelPeriodicExternalWorkV1,
  type MainWireIntegratedModelPeriodicExternalWorkInputV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicExternalWorkV1";
import type {
  MainWireIntegratedModelPeriodicClassificationV3,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicClassifierV3";
import type {
  MainWireIntegratedModelPeriodicTerminalTraceSampleV3,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicSteadyV3";

type PvPoint = Readonly<{
  lvVolumeMl: number;
  lvPressureMmHg: number;
  rvVolumeMl?: number;
  rvPressureMmHg?: number;
}>;

describe("periodic ventricular external-work qualification V1", () => {
  it("qualifies an exact canonical P1 counter-clockwise path without adding a closing segment", () => {
    const result = qualifyMainWireIntegratedModelPeriodicExternalWorkV1(
      inputFromPath([
        point(0, 0),
        point(1, 0),
        point(1, 1),
        point(0, 1),
        point(0, 0),
      ]),
    );

    expect(result).toMatchObject({
      status: "qualified-biventricular",
      acceptedSegmentCount: 4,
      biventricularExternalWorkEstablished: true,
      syntheticEndToStartClosingSegmentApplied: false,
      physiologicalValidationEstablished: false,
      clinicalValidationClaimed: false,
      gates: {
        protocolIdentityValid: true,
        modelConditionIdentityValid: true,
        canonicalPeriod1Established: true,
        terminalCycleOwnsLatestPeriod1Evidence: true,
        terminalCycleIntegrityPassed: true,
        previousCycleTerminalBoundaryAvailable: true,
        acceptedPathTraceComplete: true,
      },
      leftVentricle: {
        pathWorkMmHgMl: 1,
        externalWorkMmHgMl: 1,
        direction: "net-work-by-ventricle",
        externalWorkEstablished: true,
        failureReasons: [],
        endpointClosure: { maximumNormalizedDelta: 0, withinTolerance: true },
      },
      rightVentricle: {
        pathWorkMmHgMl: 1,
        externalWorkMmHgMl: 1,
        direction: "net-work-by-ventricle",
        externalWorkEstablished: true,
      },
    });
    expect(result.policy).toBe(
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_EXTERNAL_WORK_POLICY_V1,
    );
  });

  it("preserves signed work and accepts a clockwise loop as net work on the ventricle", () => {
    const result = qualifyMainWireIntegratedModelPeriodicExternalWorkV1(
      inputFromPath([
        point(0, 0),
        point(0, 1),
        point(1, 1),
        point(1, 0),
        point(0, 0),
      ]),
    );

    expect(result.status).toBe("qualified-biventricular");
    expect(result.leftVentricle).toMatchObject({
      pathWorkMmHgMl: -1,
      externalWorkMmHgMl: -1,
      direction: "net-work-on-ventricle",
      externalWorkEstablished: true,
    });
  });

  it("is invariant to a constant pressure offset for an exactly closed path", () => {
    const base = [
      point(0, 0),
      point(1, 0),
      point(1, 1),
      point(0, 1),
      point(0, 0),
    ];
    const offset = base.map((value) => ({
      ...value,
      lvPressureMmHg: value.lvPressureMmHg + 50,
      rvPressureMmHg: (value.rvPressureMmHg ?? value.lvPressureMmHg) + 50,
    }));

    const baseResult = qualifyMainWireIntegratedModelPeriodicExternalWorkV1(
      inputFromPath(base),
    );
    const offsetResult = qualifyMainWireIntegratedModelPeriodicExternalWorkV1(
      inputFromPath(offset),
    );
    expect(offsetResult.leftVentricle.externalWorkMmHgMl).toBe(
      baseResult.leftVentricle.externalWorkMmHgMl,
    );
    expect(offsetResult.rightVentricle.externalWorkMmHgMl).toBe(
      baseResult.rightVentricle.externalWorkMmHgMl,
    );
  });

  it("keeps a self-intersecting closed path as a defined signed integral while reserving polygon rejection for PVA", () => {
    const result = qualifyMainWireIntegratedModelPeriodicExternalWorkV1(
      inputFromPath([
        point(0, 0),
        point(1, 1),
        point(0, 1),
        point(1, 0),
        point(0, 0),
      ]),
    );

    expect(result).toMatchObject({
      status: "qualified-biventricular",
      leftVentricle: {
        externalWorkMmHgMl: 0,
        direction: "zero-net-work",
        externalWorkEstablished: true,
      },
      rightVentricle: {
        externalWorkMmHgMl: 0,
        direction: "zero-net-work",
        externalWorkEstablished: true,
      },
      policy: {
        selfIntersectionPolicy:
          "signed-line-integral-remains-defined-self-intersection-is-a-later-pva-geometry-gate",
      },
    });
  });

  it("keeps raw path work but withholds EW independently for a chamber whose endpoints do not close", () => {
    const result = qualifyMainWireIntegratedModelPeriodicExternalWorkV1(
      inputFromPath([
        point(0, 0),
        point(1, 0),
        point(1, 1),
        point(0, 1),
        {
          lvVolumeMl: 0.2,
          lvPressureMmHg: 0,
          rvVolumeMl: 0.05,
          rvPressureMmHg: 0.05,
        },
      ]),
    );

    expect(result.status).toBe("qualified-right-ventricular-only");
    expect(result.leftVentricle.pathWorkMmHgMl).not.toBeNull();
    expect(result.leftVentricle).toMatchObject({
      externalWorkMmHgMl: null,
      externalWorkEstablished: false,
      failureReasons: ["pressure-volume-boundary-not-closed"],
      endpointClosure: {
        normalizedVolumeDelta: 0.002,
        withinTolerance: false,
      },
    });
    expect(result.rightVentricle).toMatchObject({
      externalWorkEstablished: true,
      endpointClosure: {
        normalizedVolumeDelta: 0.0005,
        normalizedPressureDelta: 0.0005,
        withinTolerance: true,
      },
    });
  });

  it("never promotes a closed exploratory path without canonical P1 evidence", () => {
    const candidate = inputFromPath([
      point(0, 0),
      point(1, 0),
      point(1, 1),
      point(0, 1),
      point(0, 0),
    ]);
    const result = qualifyMainWireIntegratedModelPeriodicExternalWorkV1({
      ...candidate,
      executionPurpose: "bounded-smoke",
      classification: classification("not-converged"),
    });

    expect(result.status).toBe("not-qualified");
    expect(result.gates).toMatchObject({
      canonicalPeriod1Established: false,
      terminalCycleOwnsLatestPeriod1Evidence: false,
      acceptedPathTraceComplete: true,
    });
    expect(result.leftVentricle).toMatchObject({
      pathWorkMmHgMl: 1,
      externalWorkMmHgMl: null,
      externalWorkEstablished: false,
      failureReasons: ["canonical-period1-not-established"],
    });
  });

  it("fails closed when the previous exact cycle boundary is unavailable", () => {
    const candidate = inputFromPath([
      point(0, 0),
      point(1, 0),
      point(1, 1),
      point(0, 1),
      point(0, 0),
    ]);
    const result = qualifyMainWireIntegratedModelPeriodicExternalWorkV1({
      ...candidate,
      startBoundary: null,
    });

    expect(result.status).toBe("not-qualified");
    expect(result.acceptedSegmentCount).toBe(0);
    expect(result.gates).toMatchObject({
      previousCycleTerminalBoundaryAvailable: false,
      acceptedPathTraceComplete: false,
    });
    expect(result.leftVentricle).toMatchObject({
      pathWorkMmHgMl: null,
      externalWorkMmHgMl: null,
      failureReasons: ["previous-cycle-terminal-boundary-unavailable"],
    });
  });

  it("fails closed on an invalid condition identity or a resampled path", () => {
    const candidate = inputFromPath([
      point(0, 0),
      point(1, 0),
      point(1, 1),
      point(0, 1),
      point(0, 0),
    ]);
    const result = qualifyMainWireIntegratedModelPeriodicExternalWorkV1({
      ...candidate,
      modelConditionIdentityHash: "invalid",
      terminalTrace: {
        ...candidate.terminalTrace,
        resamplingApplied: true,
      } as never,
    });

    expect(result.status).toBe("not-qualified");
    expect(result.gates).toMatchObject({
      protocolIdentityValid: true,
      modelConditionIdentityValid: false,
      acceptedPathTraceComplete: false,
    });
    expect(result.leftVentricle).toMatchObject({
      pathWorkMmHgMl: 1,
      externalWorkMmHgMl: null,
      failureReasons: [
        "model-condition-identity-invalid",
        "accepted-path-trace-incomplete",
      ],
    });
  });
});

function inputFromPath(
  points: readonly PvPoint[],
): MainWireIntegratedModelPeriodicExternalWorkInputV1 {
  if (points.length < 2) throw new Error("test path requires two points");
  const cycleIndex = 8;
  const startTimeSec = 10;
  const durationSec = 1;
  const segmentDurationSec = durationSec / (points.length - 1);
  const [start, ...acceptedPoints] = points;
  const samples = acceptedPoints.map((value, index) =>
    traceSample(
      cycleIndex,
      index + 1,
      startTimeSec + (index + 1) * segmentDurationSec,
      segmentDurationSec,
      value,
    )
  );
  return {
    executionPurpose: "canonical-evidence",
    protocolIdentityHash: "a".repeat(64),
    modelConditionIdentityHash: "b".repeat(64),
    classification: classification("period1-converged"),
    terminalObservation: {
      cycleIndex,
      evidenceRole: "canonical-periodic-protocol",
      protocolIdentityHash: "a".repeat(64),
    },
    terminalCycle: {
      cycleIndex,
      startTimeSec,
      endTimeSec: startTimeSec + durationSec,
      acceptedStepCount: samples.length,
      conservation: {
        maximumGlobalTotalBloodVolumeErrorMl: 0,
        maximumCoronaryBloodVolumeLedgerResidualMl: 0,
        maximumDynamicMcsConservationResidualMlPerSec: 0,
        withinInheritedConstructionTolerances: true,
      },
      finiteAndEventIdentityChecks: {
        allRawValuesFinite: true,
        exactlyOneAtrialCapture: true,
        exactlyOneVentricularCapture: true,
        exactlyTwoDeliveredCalciumDeposits: true,
        oneComposedCalciumOwnerOnly: true,
        allDynamicMcsAcceptedFlowsExactlyZero: true,
        passed: true,
      },
    },
    terminalTrace: {
      cycleIndex,
      startTimeSec,
      endTimeSec: startTimeSec + durationSec,
      sampleCount: samples.length,
      samples,
      retainedForGraphShapeInspection: true,
      resamplingApplied: false,
      shapeAcceptanceClaimed: false,
      interpretation:
        "raw-accepted-endpoint-samples-no-resampling-no-shape-acceptance",
    },
    startBoundary: {
      source: "previous-cycle-terminal-accepted-endpoint",
      acceptedTimeSec: startTimeSec,
      chamberVolumeMl: {
        LV: start!.lvVolumeMl,
        RV: start!.rvVolumeMl ?? start!.lvVolumeMl,
      },
      transmuralPressureMmHg: {
        LV: start!.lvPressureMmHg,
        RV: start!.rvPressureMmHg ?? start!.lvPressureMmHg,
      },
    },
  };
}

function classification(
  status: MainWireIntegratedModelPeriodicClassificationV3["status"],
): MainWireIntegratedModelPeriodicClassificationV3 {
  return {
    classifierId:
      "main-wire-integrated-composed-rhythm-periodic-classifier-v3",
    status,
    latestCycleIndex: 8,
    consecutiveCyclesRequired: 3,
    minimumConsecutiveCycles: 3,
    acceptedEvidenceRole: "canonical-periodic-protocol",
    evidenceCycleIndices: status === "not-converged" ? [] : [6, 7, 8],
    latestPeriod1MaximumNormalizedDelta: 0,
    latestPeriod2MaximumNormalizedDelta: null,
    physiologicalAcceptanceEstablished: false,
    independentValidationEstablished: false,
    releaseAcceptanceEstablished: false,
  };
}

function traceSample(
  cycleIndex: number,
  acceptedStepIndexWithinCycle: number,
  acceptedTimeSec: number,
  acceptedDtSec: number,
  value: PvPoint,
): MainWireIntegratedModelPeriodicTerminalTraceSampleV3 {
  return {
    cycleIndex,
    acceptedStepIndexWithinCycle,
    acceptedTimeSec,
    cyclePhase01: acceptedStepIndexWithinCycle * acceptedDtSec,
    acceptedDtSec,
    chamberVolumeMl: {
      LA: 10,
      LV: value.lvVolumeMl,
      RA: 10,
      RV: value.rvVolumeMl ?? value.lvVolumeMl,
    },
    absolutePressureMmHg: {
      LA: 5,
      LV: value.lvPressureMmHg,
      RA: 3,
      RV: value.rvPressureMmHg ?? value.lvPressureMmHg,
      Ao: 80,
      PA: 15,
      PVein: 5,
    },
    transmuralPressureMmHg: {
      LV: value.lvPressureMmHg,
      RV: value.rvPressureMmHg ?? value.lvPressureMmHg,
    },
    valveFlowMlPerSec: { MV: 0, AoV: 0, TV: 0, PV: 0 },
    coronary: {
      totalInletFlowMlPerSec: 1,
      ladSubendocardialQmFlowMlPerSec: 0.1,
    },
    freeCalciumUMByWall: { LA: 0, LVFW: 0, SEP: 0, RVFW: 0, RA: 0 },
    dynamicMcsAcceptedFlowMlPerSec: {
      LVAD: 0,
      IMPELLA: 0,
      VA_ECMO: 0,
      VV_ECMO: 0,
    },
    acceptedEventIdentity: {
      atrialCapturedActivationId: null,
      ventricularCapturedActivationId: null,
      deliveredCalciumDepositIds: [],
      scheduledCalciumDepositIds: [],
    },
    diagnostics: {
      mechanicsResidualNorm: 0,
      circulationScaledResidualInfinityNorm: 0,
      maximumContinuityResidualMl: 0,
      totalBloodVolumeErrorMl: 0,
      coronaryBloodVolumeLedgerResidualMl: 0,
      dynamicMcsConservationResidualMlPerSec: 0,
    },
  };
}

function point(volumeMl: number, pressureMmHg: number): PvPoint {
  return { lvVolumeMl: volumeMl, lvPressureMmHg: pressureMmHg };
}
