import { describe, expect, it } from "vitest";

import {
  buildMainWireBaselineConditioningAlternativeSubsetSpectraV1,
  buildMainWireBaselineConditioningSpectrumV1,
  type MainWireBaselineConditioningSensitivityV1,
} from "@/analysis/methods/mainWire/MainWireBaselineConditioningAuditV1";

const coordinates = [
  "hemodynamics.total-blood-volume-ml",
  "hemodynamics.systemic-resistance",
] as const;

describe("baseline conditioning spectrum", () => {
  it("uses observed step-halving perturbation as a practical rank tolerance", () => {
    const spectrum = buildMainWireBaselineConditioningSpectrumV1([
      sensitivityV1("aortic-valve.mean-gradient", coordinates[0], 3, 3),
      sensitivityV1("aortic-valve.mean-gradient", coordinates[1], 0, 0),
      sensitivityV1("aortic-pressure.maximum", coordinates[0], 0, 0),
      sensitivityV1("aortic-pressure.maximum", coordinates[1], 0.03, 0.01),
    ], coordinates)!;

    expect(spectrum.candidateRowCount).toBe(2);
    expect(spectrum.rowCount).toBe(2);
    expect(spectrum.rowAdmissionPolicy).toBe(
      "complete-and-step-sign-stable",
    );
    expect(spectrum.excludedRows).toEqual([]);
    expect(spectrum.singularValues[0]).toBeCloseTo(3);
    expect(spectrum.singularValues[1]).toBeCloseTo(0.01);
    expect(spectrum.numericalRank).toBe(2);
    expect(spectrum.observedStepHalvingPerturbationFrobeniusNorm)
      .toBeCloseTo(0.02);
    expect(spectrum.practicalRankTolerance).toBeCloseTo(0.02);
    expect(spectrum.practicalRankToleranceComposition).toBe(
      "maximum-of-machine-and-observed-step-halving-frobenius",
    );
    expect(spectrum.practicalRank).toBe(1);
    expect(spectrum.conditionNumber).toBeCloseTo(300);
    expect(spectrum.practicalConditionNumber).toBeNull();
  });

  it("excludes a whole observation row when any coordinate changes sign", () => {
    const spectrum = buildMainWireBaselineConditioningSpectrumV1([
      sensitivityV1("aortic-valve.mean-gradient", coordinates[0], 3, 3),
      sensitivityV1("aortic-valve.mean-gradient", coordinates[1], 0, 0),
      sensitivityV1("aortic-pressure.maximum", coordinates[0], 0, 0),
      sensitivityV1("aortic-pressure.maximum", coordinates[1], 1, 1),
      sensitivityV1("aortic-pressure.minimum", coordinates[0], 1, -1),
      sensitivityV1("aortic-pressure.minimum", coordinates[1], 1, 1),
    ], coordinates)!;

    expect(spectrum.candidateRowCount).toBe(3);
    expect(spectrum.rowCount).toBe(2);
    expect(spectrum.excludedRows).toEqual([{
      conditionId: "rest-hr60",
      checkId: "aortic-pressure.minimum",
      reason: "step-sign-unstable",
    }]);
  });

  it("rejects duplicate coordinates or sensitivity identities", () => {
    const sensitivity = sensitivityV1(
      "aortic-pressure.maximum",
      coordinates[0],
      1,
      1,
    );
    expect(() => buildMainWireBaselineConditioningSpectrumV1(
      [sensitivity],
      [coordinates[0], coordinates[0]],
    )).toThrow(/coordinate IDs are duplicated/);
    expect(() => buildMainWireBaselineConditioningSpectrumV1(
      [sensitivity, sensitivity],
      [coordinates[0]],
    )).toThrow(/sensitivity is duplicated/);
  });

  it("reports every proper coordinate subset without selecting one", () => {
    const sensitivities = [
      sensitivityV1("aortic-valve.mean-gradient", coordinates[0], 3, 3),
      sensitivityV1("aortic-valve.mean-gradient", coordinates[1], 0, 0),
      sensitivityV1("aortic-pressure.maximum", coordinates[0], 0, 0),
      sensitivityV1("aortic-pressure.maximum", coordinates[1], 1, 1),
    ];
    const subsets =
      buildMainWireBaselineConditioningAlternativeSubsetSpectraV1(
        sensitivities,
        coordinates,
        2,
      );

    expect(subsets.map(({ coordinateIds }) => coordinateIds)).toEqual([
      [coordinates[0]],
      [coordinates[1]],
    ]);
    expect(subsets.map(({ practicalRankStatus }) => practicalRankStatus))
      .toEqual(["full", "full"]);
    expect(() =>
      buildMainWireBaselineConditioningAlternativeSubsetSpectraV1(
        sensitivities,
        coordinates,
        3,
      )).toThrow(/subset request is invalid/);
  });
});

function sensitivityV1(
  checkId: MainWireBaselineConditioningSensitivityV1["checkId"],
  coordinateId: MainWireBaselineConditioningSensitivityV1["coordinateId"],
  fullStepNormalizedDerivative: number,
  halfStepNormalizedDerivative: number,
): MainWireBaselineConditioningSensitivityV1 {
  const difference = Math.abs(
    fullStepNormalizedDerivative - halfStepNormalizedDerivative,
  );
  const magnitude = Math.max(
    Math.abs(fullStepNormalizedDerivative),
    Math.abs(halfStepNormalizedDerivative),
  );
  return Object.freeze({
    conditionId: "rest-hr60",
    coordinateId,
    checkId,
    unit: "test-unit",
    constructionCorridorWidth: 1,
    fullStepNormalizedDerivative,
    halfStepNormalizedDerivative,
    fullToHalfAbsoluteDifference: difference,
    fullToHalfRelativeDifference: magnitude === 0 ? null : difference / magnitude,
    signStable: Math.sign(fullStepNormalizedDerivative)
      === Math.sign(halfStepNormalizedDerivative),
    status: "resolved",
  });
}
