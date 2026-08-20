import { describe, expect, it } from "vitest";

import {
  MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_TRANSMURAL_BOUNDARY_WORK_ENGINEERING_POLICY_V1,
  pressureVolumeBoundaryCandidateFromAcceptedTraceSampleV1,
  projectMainWireIntegratedModelPeriodicTransmuralBoundaryWorkEngineeringV1,
  type MainWireIntegratedModelPeriodicTransmuralBoundaryWorkEngineeringInputV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicTransmuralBoundaryWorkEngineeringV1";
import type { MainWireIntegratedModelPeriodicClassificationV3 } from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicClassifierV3";
import type { MainWireIntegratedModelPeriodicTerminalTraceSampleV3 } from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicSteadyV3";

type PvPoint = Readonly<{
  lvVolumeMl: number;
  lvPressureMmHg: number;
  rvVolumeMl?: number;
  rvPressureMmHg?: number;
}>;

describe("periodic ventricular transmural-boundary-work Engineering projection V1", () => {
  it("projects an input-declared P1 counter-clockwise path without adding a closing segment", () => {
    const result =
      projectMainWireIntegratedModelPeriodicTransmuralBoundaryWorkEngineeringV1(
        inputFromPath([
          point(0, 0),
          point(1, 0),
          point(1, 1),
          point(0, 1),
          point(0, 0),
        ]),
      );

    expect(result).toMatchObject({
      status: "input-gates-passed-biventricular",
      acceptedSegmentCount: 4,
      biventricularTransmuralBoundaryWorkComputed: true,
      syntheticEndToStartClosingSegmentApplied: false,
      engineeringProjectionOnly: true,
      sourceProvenanceVerified: false,
      historicalQualificationTransferred: false,
      officialQualificationEstablished: false,
      publicOutputEstablished: false,
      pvaEstablished: false,
      physiologicalValidationEstablished: false,
      clinicalValidationClaimed: false,
      gates: {
        protocolIdentityFormatValid: true,
        modelConditionIdentityFormatValid: true,
        canonicalPeriod1DeclaredByInput: true,
        terminalCycleMatchesDeclaredPeriod1Evidence: true,
        terminalCycleIntegrityDeclaredByInput: true,
        startBoundaryProvided: true,
        startBoundaryFinite: true,
        acceptedPathTraceComplete: true,
        sourceProvenanceVerified: false,
      },
      leftVentricle: {
        transmuralPathWorkMmHgMl: 1,
        transmuralBoundaryWorkMmHgMl: 1,
        pathWorkDirection: "net-work-by-ventricle",
        transmuralBoundaryWorkComputed: true,
        failureReasons: [],
        endpointClosure: { maximumNormalizedDelta: 0, withinTolerance: true },
      },
      rightVentricle: {
        transmuralPathWorkMmHgMl: 1,
        transmuralBoundaryWorkMmHgMl: 1,
        pathWorkDirection: "net-work-by-ventricle",
        transmuralBoundaryWorkComputed: true,
      },
    });
    expect(result.policy).toBe(
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_TRANSMURAL_BOUNDARY_WORK_ENGINEERING_POLICY_V1,
    );
    expect(result.policy.sourceProvenanceEstablishedByProjector).toBe(false);
  });

  it("preserves signed work and accepts a clockwise loop as net work on the ventricle", () => {
    const result =
      projectMainWireIntegratedModelPeriodicTransmuralBoundaryWorkEngineeringV1(
        inputFromPath([
          point(0, 0),
          point(0, 1),
          point(1, 1),
          point(1, 0),
          point(0, 0),
        ]),
      );

    expect(result.status).toBe("input-gates-passed-biventricular");
    expect(result.leftVentricle).toMatchObject({
      transmuralPathWorkMmHgMl: -1,
      transmuralBoundaryWorkMmHgMl: -1,
      pathWorkDirection: "net-work-on-ventricle",
      transmuralBoundaryWorkComputed: true,
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

    const baseResult =
      projectMainWireIntegratedModelPeriodicTransmuralBoundaryWorkEngineeringV1(
        inputFromPath(base),
      );
    const offsetResult =
      projectMainWireIntegratedModelPeriodicTransmuralBoundaryWorkEngineeringV1(
        inputFromPath(offset),
      );
    expect(offsetResult.leftVentricle.transmuralBoundaryWorkMmHgMl).toBe(
      baseResult.leftVentricle.transmuralBoundaryWorkMmHgMl,
    );
    expect(offsetResult.rightVentricle.transmuralBoundaryWorkMmHgMl).toBe(
      baseResult.rightVentricle.transmuralBoundaryWorkMmHgMl,
    );
  });

  it("keeps a self-intersecting closed path as a defined signed integral while reserving polygon rejection for PVA", () => {
    const result =
      projectMainWireIntegratedModelPeriodicTransmuralBoundaryWorkEngineeringV1(
        inputFromPath([
          point(0, 0),
          point(1, 1),
          point(0, 1),
          point(1, 0),
          point(0, 0),
        ]),
      );

    expect(result).toMatchObject({
      status: "input-gates-passed-biventricular",
      leftVentricle: {
        transmuralBoundaryWorkMmHgMl: 0,
        pathWorkDirection: "zero-net-work",
        transmuralBoundaryWorkComputed: true,
      },
      rightVentricle: {
        transmuralBoundaryWorkMmHgMl: 0,
        pathWorkDirection: "zero-net-work",
        transmuralBoundaryWorkComputed: true,
      },
      policy: {
        selfIntersectionPolicy:
          "signed-line-integral-remains-defined-self-intersection-is-a-later-pva-geometry-gate",
      },
    });
  });

  it("fails closed when finite pressure-volume inputs overflow the path-work reduction", () => {
    const result =
      projectMainWireIntegratedModelPeriodicTransmuralBoundaryWorkEngineeringV1(
        inputFromPath([
          point(0, Number.MAX_VALUE),
          point(Number.MAX_VALUE, Number.MAX_VALUE),
          point(0, Number.MAX_VALUE),
        ]),
      );

    expect(result.status).toBe("input-gates-not-passed");
    expect(result.biventricularTransmuralBoundaryWorkComputed).toBe(false);
    expect(result.leftVentricle).toMatchObject({
      transmuralPathWorkMmHgMl: null,
      transmuralBoundaryWorkMmHgMl: null,
      pathWorkDirection: null,
      transmuralBoundaryWorkComputed: false,
      failureReasons: ["path-work-non-finite"],
      endpointClosure: { withinTolerance: true },
    });
    expect(result.rightVentricle.failureReasons).toEqual([
      "path-work-non-finite",
    ]);
  });

  it("contains one-chamber overflow without withholding the finite chamber path", () => {
    const result =
      projectMainWireIntegratedModelPeriodicTransmuralBoundaryWorkEngineeringV1(
        inputFromPath([
          {
            lvVolumeMl: 0,
            lvPressureMmHg: 0,
            rvVolumeMl: 0,
            rvPressureMmHg: 0,
          },
          {
            lvVolumeMl: Number.MAX_VALUE,
            lvPressureMmHg: Number.MAX_VALUE,
            rvVolumeMl: 1,
            rvPressureMmHg: 0,
          },
          {
            lvVolumeMl: 0,
            lvPressureMmHg: 0,
            rvVolumeMl: 0,
            rvPressureMmHg: 0,
          },
        ]),
      );

    expect(result.status).toBe("input-gates-passed-right-ventricular-only");
    expect(result.leftVentricle).toMatchObject({
      transmuralPathWorkMmHgMl: null,
      transmuralBoundaryWorkMmHgMl: null,
      failureReasons: ["path-work-non-finite"],
    });
    expect(result.rightVentricle).toMatchObject({
      transmuralPathWorkMmHgMl: 0,
      transmuralBoundaryWorkMmHgMl: 0,
      transmuralBoundaryWorkComputed: true,
    });
  });

  it("keeps raw path work but withholds transmural boundary work independently for a chamber whose endpoints do not close", () => {
    const result =
      projectMainWireIntegratedModelPeriodicTransmuralBoundaryWorkEngineeringV1(
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

    expect(result.status).toBe("input-gates-passed-right-ventricular-only");
    expect(result.leftVentricle.transmuralPathWorkMmHgMl).not.toBeNull();
    expect(result.leftVentricle).toMatchObject({
      transmuralBoundaryWorkMmHgMl: null,
      transmuralBoundaryWorkComputed: false,
      failureReasons: ["pressure-volume-boundary-not-closed"],
      endpointClosure: {
        normalizedVolumeDelta: 0.002,
        withinTolerance: false,
      },
    });
    expect(result.rightVentricle).toMatchObject({
      transmuralBoundaryWorkComputed: true,
      endpointClosure: {
        normalizedVolumeDelta: 0.0005,
        normalizedPressureDelta: 0.0005,
        withinTolerance: true,
      },
    });
  });

  it("withholds gated boundary work when the input does not declare canonical P1", () => {
    const candidate = inputFromPath([
      point(0, 0),
      point(1, 0),
      point(1, 1),
      point(0, 1),
      point(0, 0),
    ]);
    const result =
      projectMainWireIntegratedModelPeriodicTransmuralBoundaryWorkEngineeringV1(
        {
          ...candidate,
          executionPurpose: "bounded-smoke",
          classification: classification("not-converged"),
        },
      );

    expect(result.status).toBe("input-gates-not-passed");
    expect(result.gates).toMatchObject({
      canonicalPeriod1DeclaredByInput: false,
      terminalCycleMatchesDeclaredPeriod1Evidence: false,
      acceptedPathTraceComplete: true,
    });
    expect(result.leftVentricle).toMatchObject({
      transmuralPathWorkMmHgMl: 1,
      transmuralBoundaryWorkMmHgMl: null,
      transmuralBoundaryWorkComputed: false,
      failureReasons: ["canonical-period1-not-declared-by-input"],
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
    const result =
      projectMainWireIntegratedModelPeriodicTransmuralBoundaryWorkEngineeringV1(
        {
          ...candidate,
          startBoundary: null,
        },
      );

    expect(result.status).toBe("input-gates-not-passed");
    expect(result.acceptedSegmentCount).toBe(0);
    expect(result.gates).toMatchObject({
      startBoundaryProvided: false,
      startBoundaryFinite: false,
      acceptedPathTraceComplete: false,
    });
    expect(result.leftVentricle).toMatchObject({
      transmuralPathWorkMmHgMl: null,
      transmuralBoundaryWorkMmHgMl: null,
      failureReasons: ["start-boundary-not-provided"],
    });
  });

  it("sanitizes a nonfinite start boundary instead of returning NaN closure fields", () => {
    const candidate = inputFromPath([point(0, 0), point(1, 0), point(0, 0)]);
    const result =
      projectMainWireIntegratedModelPeriodicTransmuralBoundaryWorkEngineeringV1(
        {
          ...candidate,
          startBoundary: {
            ...candidate.startBoundary!,
            chamberVolumeMl: {
              ...candidate.startBoundary!.chamberVolumeMl,
              LV: Number.NaN,
            },
          },
        },
      );

    expect(result.status).toBe("input-gates-not-passed");
    expect(result.gates).toMatchObject({
      startBoundaryProvided: true,
      startBoundaryFinite: false,
      acceptedPathTraceComplete: false,
    });
    expect(result.leftVentricle).toMatchObject({
      transmuralPathWorkMmHgMl: null,
      transmuralBoundaryWorkMmHgMl: null,
      pathWorkDirection: null,
      failureReasons: ["pressure-volume-boundary-non-finite"],
      endpointClosure: {
        start: null,
        absoluteVolumeDeltaMl: null,
        absolutePressureDeltaMmHg: null,
        normalizedVolumeDelta: null,
        normalizedPressureDelta: null,
        maximumNormalizedDelta: null,
        withinTolerance: false,
      },
    });
    expect(allNumberLeavesAreFinite(result)).toBe(true);
  });

  it("rejects a nonfinite trace sample when projecting a boundary candidate", () => {
    const sample = traceSample(8, 1, 11, 1, point(0, 0));

    expect(() =>
      pressureVolumeBoundaryCandidateFromAcceptedTraceSampleV1({
        ...sample,
        transmuralPressureMmHg: {
          ...sample.transmuralPressureMmHg,
          LV: Infinity,
        },
      }),
    ).toThrow("periodic PV boundary contains a nonfinite value");
  });

  it("sanitizes closure metrics when finite endpoint subtraction overflows", () => {
    const result =
      projectMainWireIntegratedModelPeriodicTransmuralBoundaryWorkEngineeringV1(
        inputFromPath([
          point(Number.MAX_VALUE, Number.MAX_VALUE),
          point(-Number.MAX_VALUE, -Number.MAX_VALUE),
        ]),
      );

    expect(result.status).toBe("input-gates-not-passed");
    expect(result.leftVentricle).toMatchObject({
      transmuralPathWorkMmHgMl: null,
      transmuralBoundaryWorkMmHgMl: null,
      failureReasons: [
        "pressure-volume-boundary-non-finite",
        "path-work-non-finite",
      ],
      endpointClosure: {
        start: {
          volumeMl: Number.MAX_VALUE,
          pressureMmHg: Number.MAX_VALUE,
        },
        end: {
          volumeMl: -Number.MAX_VALUE,
          pressureMmHg: -Number.MAX_VALUE,
        },
        absoluteVolumeDeltaMl: null,
        absolutePressureDeltaMmHg: null,
        normalizedVolumeDelta: null,
        normalizedPressureDelta: null,
        maximumNormalizedDelta: null,
        withinTolerance: false,
      },
    });
    expect(allNumberLeavesAreFinite(result)).toBe(true);
  });

  it("rejects a start boundary whose declared clock does not start the trace", () => {
    const candidate = inputFromPath([point(0, 0), point(1, 0), point(0, 0)]);
    const result =
      projectMainWireIntegratedModelPeriodicTransmuralBoundaryWorkEngineeringV1(
        {
          ...candidate,
          startBoundary: {
            ...candidate.startBoundary!,
            acceptedTimeSec: candidate.terminalTrace.startTimeSec + 0.1,
          },
        },
      );

    expect(result.status).toBe("input-gates-not-passed");
    expect(result.gates.acceptedPathTraceComplete).toBe(false);
    expect(result.leftVentricle.failureReasons).toContain(
      "accepted-path-trace-incomplete",
    );
  });

  it("fails closed on an invalid condition identity or a resampled path", () => {
    const candidate = inputFromPath([
      point(0, 0),
      point(1, 0),
      point(1, 1),
      point(0, 1),
      point(0, 0),
    ]);
    const result =
      projectMainWireIntegratedModelPeriodicTransmuralBoundaryWorkEngineeringV1(
        {
          ...candidate,
          modelConditionIdentityHash: "invalid",
          terminalTrace: {
            ...candidate.terminalTrace,
            resamplingApplied: true,
          } as never,
        },
      );

    expect(result.status).toBe("input-gates-not-passed");
    expect(result.gates).toMatchObject({
      protocolIdentityFormatValid: true,
      modelConditionIdentityFormatValid: false,
      acceptedPathTraceComplete: false,
    });
    expect(result.leftVentricle).toMatchObject({
      transmuralPathWorkMmHgMl: 1,
      transmuralBoundaryWorkMmHgMl: null,
      failureReasons: [
        "model-condition-identity-format-invalid",
        "accepted-path-trace-incomplete",
      ],
    });
  });
});

function inputFromPath(
  points: readonly PvPoint[],
): MainWireIntegratedModelPeriodicTransmuralBoundaryWorkEngineeringInputV1 {
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
    ),
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
      source: "caller-projected-trace-sample",
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
    classifierId: "main-wire-integrated-composed-rhythm-periodic-classifier-v3",
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

function allNumberLeavesAreFinite(value: unknown): boolean {
  if (typeof value === "number") return Number.isFinite(value);
  if (Array.isArray(value)) return value.every(allNumberLeavesAreFinite);
  if (value !== null && typeof value === "object") {
    return Object.values(value).every(allNumberLeavesAreFinite);
  }
  return true;
}
