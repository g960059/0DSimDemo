import { describe, expect, it } from "vitest";

import {
  buildMainWireBaselineConditioningSpectrumV1,
  type MainWireBaselineConditioningSensitivityV1,
  type MainWireBaselineConditioningTaskResultV1,
} from "@/analysis/methods/mainWire/MainWireBaselineConditioningAuditV1";
import {
  assertMainWireBaselineConditioningResolutionDtCompatibilityV1,
  buildMainWireBaselineConditioningResolutionSpectrumV1,
} from "@/analysis/methods/mainWire/MainWireBaselineConditioningResolutionAuditV1";
import type {
  MainWireBaselineNumericalFloorMetricV1,
} from "@/analysis/methods/mainWire/MainWireBaselineNumericalFloorAuditV1";

const coordinates = [
  "hemodynamics.total-blood-volume-ml",
  "hemodynamics.systemic-resistance",
] as const;
const checks = [
  "aortic-valve.mean-gradient",
  "aortic-pressure.maximum",
] as const;

describe("baseline conditioning resolution spectrum", () => {
  it("requires the numerical-floor dt pair pinned by conditioning", () => {
    expect(() =>
      assertMainWireBaselineConditioningResolutionDtCompatibilityV1({
        coarseDtSec: 0.002,
        fineDtSec: 0.001,
      })).not.toThrow();
    expect(() =>
      assertMainWireBaselineConditioningResolutionDtCompatibilityV1({
        coarseDtSec: 0.004,
        fineDtSec: 0.002,
      })).toThrow(/dt differs from conditioning policy/);
  });

  it("keeps step-halving rank separate from a baseline-floor reference", () => {
    const sensitivities = diagonalSensitivitiesV1();
    const stepStableSpectrum = buildMainWireBaselineConditioningSpectrumV1(
      sensitivities,
      coordinates,
    )!;
    const spectrum = buildMainWireBaselineConditioningResolutionSpectrumV1({
      sensitivities,
      evaluations: halfStepEvaluationsV1(),
      numericalFloors: floorMapV1(0.1),
      coordinateIds: coordinates,
      stepStableSpectrum,
    });

    expect(spectrum.stepStablePracticalRank).toBe(2);
    expect(spectrum.observedStepHalvingPerturbationFrobeniusNorm).toBe(0);
    expect(spectrum.baselineFloorStressPerturbationFrobeniusNorm)
      .toBeCloseTo(0.4);
    expect(spectrum.baselineFloorStressRankTolerance).toBeCloseTo(0.4);
    expect(spectrum.baselineFloorStressRank).toBe(2);
    expect(spectrum.baselineFloorStressDominatesStepHalving).toBe(true);
    expect(spectrum.baselineFloorStressNormsByCheckId[checks[0]])
      .toBeCloseTo(Math.sqrt(0.08));
  });

  it("reports, but does not silently rewrite, rank below the floor reference", () => {
    const sensitivities = diagonalSensitivitiesV1();
    const stepStableSpectrum = buildMainWireBaselineConditioningSpectrumV1(
      sensitivities,
      coordinates,
    )!;
    const spectrum = buildMainWireBaselineConditioningResolutionSpectrumV1({
      sensitivities,
      evaluations: halfStepEvaluationsV1(),
      numericalFloors: floorMapV1(0.3),
      coordinateIds: coordinates,
      stepStableSpectrum,
    });

    expect(spectrum.stepStablePracticalRank).toBe(2);
    expect(spectrum.baselineFloorStressRankTolerance).toBeCloseTo(1.2);
    expect(spectrum.baselineFloorStressRank).toBe(0);
    expect(spectrum.baselineFloorStressConditionNumber).toBeNull();
  });

  it("fails if the supplied step-halving spectrum is not reproduced", () => {
    const sensitivities = diagonalSensitivitiesV1();
    const stepStableSpectrum = buildMainWireBaselineConditioningSpectrumV1(
      sensitivities,
      coordinates,
    )!;

    expect(() => buildMainWireBaselineConditioningResolutionSpectrumV1({
      sensitivities,
      evaluations: halfStepEvaluationsV1(),
      numericalFloors: floorMapV1(0.1),
      coordinateIds: coordinates,
      stepStableSpectrum: {
        ...stepStableSpectrum,
        practicalRank: 1,
      },
    })).toThrow(/does not reproduce step-stable spectrum/);
  });

  it("rejects missing or coordinate-inconsistent floor contracts", () => {
    const sensitivities = diagonalSensitivitiesV1();
    const stepStableSpectrum = buildMainWireBaselineConditioningSpectrumV1(
      sensitivities,
      coordinates,
    )!;
    const missing = floorMapV1(0.1);
    missing.delete(checks[1]);
    expect(() => buildMainWireBaselineConditioningResolutionSpectrumV1({
      sensitivities,
      evaluations: halfStepEvaluationsV1(),
      numericalFloors: missing,
      coordinateIds: coordinates,
      stepStableSpectrum,
    })).toThrow(/floor is missing/);

    const inconsistent = diagonalSensitivitiesV1().map((sensitivity) =>
      sensitivity.coordinateId === coordinates[1]
        && sensitivity.checkId === checks[0]
        ? { ...sensitivity, unit: "other-unit" }
        : sensitivity);
    expect(() => buildMainWireBaselineConditioningResolutionSpectrumV1({
      sensitivities: inconsistent,
      evaluations: halfStepEvaluationsV1(),
      numericalFloors: floorMapV1(0.1),
      coordinateIds: coordinates,
      stepStableSpectrum,
    })).toThrow(/sensitivity row contract differs/);

    const wrongFloor = floorMapV1(0.1);
    wrongFloor.set(checks[0], {
      ...wrongFloor.get(checks[0])!,
      unit: "other-unit",
    });
    expect(() => buildMainWireBaselineConditioningResolutionSpectrumV1({
      sensitivities,
      evaluations: halfStepEvaluationsV1(),
      numericalFloors: wrongFloor,
      coordinateIds: coordinates,
      stepStableSpectrum,
    })).toThrow(/floor contract differs/);
  });
});

function diagonalSensitivitiesV1():
  readonly MainWireBaselineConditioningSensitivityV1[] {
  return Object.freeze([
    sensitivityV1(checks[0], coordinates[0], 1),
    sensitivityV1(checks[0], coordinates[1], 0),
    sensitivityV1(checks[1], coordinates[0], 0),
    sensitivityV1(checks[1], coordinates[1], 1),
  ]);
}

function sensitivityV1(
  checkId: MainWireBaselineConditioningSensitivityV1["checkId"],
  coordinateId: MainWireBaselineConditioningSensitivityV1["coordinateId"],
  derivative: number,
): MainWireBaselineConditioningSensitivityV1 {
  return Object.freeze({
    conditionId: "rest-hr60",
    coordinateId,
    checkId,
    unit: "test-unit",
    constructionCorridorWidth: 1,
    fullStepNormalizedDerivative: derivative,
    halfStepNormalizedDerivative: derivative,
    fullToHalfAbsoluteDifference: 0,
    fullToHalfRelativeDifference: derivative === 0 ? null : 0,
    signStable: true,
    status: "resolved",
  });
}

function halfStepEvaluationsV1():
  readonly MainWireBaselineConditioningTaskResultV1[] {
  return Object.freeze(coordinates.flatMap((coordinateId) => [
    taskResultV1(coordinateId, -1, -0.5),
    taskResultV1(coordinateId, 1, 0.5),
  ]));
}

function taskResultV1(
  coordinateId: typeof coordinates[number],
  direction: -1 | 1,
  transformedCoordinateValue: number,
): MainWireBaselineConditioningTaskResultV1 {
  return Object.freeze({
    task: Object.freeze({
      taskId: `rest-hr60::${coordinateId}::${direction}::0.5`,
      conditionId: "rest-hr60",
      coordinateId,
      direction,
      stepFraction: 0.5 as const,
    }),
    sourceAnchorKind: "condition-center" as const,
    sourceCheckpointSha256: null,
    targetCoordinateValue: 1,
    transformedCoordinateValue,
    evaluationStatus: "accepted" as const,
    evaluationPhase: null,
    requestIdentitySha256: null,
    initializationKind: "standard70-exact-checkpoint",
    wallTimeMs: 1,
    completedCycleCount: 3,
    classificationStatus: "periodic",
    constructionGateStatus: "passed",
    objectiveGateStatus: "passed",
    safetySentinelStatus: "passed",
    failedConstructionCheckIds: Object.freeze([]),
    failedObjectiveCheckIds: Object.freeze([]),
    failedSafetySentinelCheckIds: Object.freeze([]),
    checks: Object.freeze([]),
    message: null,
  });
}

function floorMapV1(
  numericalFloorAbsolute: number,
): Map<
  typeof checks[number],
  MainWireBaselineNumericalFloorMetricV1
> {
  return new Map(checks.map((checkId) => [checkId, Object.freeze({
    checkId,
    unit: "test-unit",
    constructionMinimum: 0,
    constructionMaximum: 1,
    constructionCorridorWidth: 1,
    coldRepeatAbsoluteDifference: 0,
    coldCheckpointAbsoluteDifference: 0,
    dtHalvingAbsoluteDifference: numericalFloorAbsolute,
    numericalFloorAbsolute,
    numericalFloorFractionOfCorridor: numericalFloorAbsolute,
  })] as const));
}
