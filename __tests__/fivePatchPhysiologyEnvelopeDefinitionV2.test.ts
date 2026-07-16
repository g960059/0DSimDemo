import { createHash } from "node:crypto";

import { describe, expect, it } from "vitest";

import {
  FIVE_PATCH_PHYSIOLOGY_ENVELOPE_DEFINITION_V2,
  FIVE_PATCH_PHYSIOLOGY_ENVELOPE_DIMENSION_IDS_V2,
  FIVE_PATCH_PHYSIOLOGY_ENVELOPE_DT_REFINEMENT_PLAN_V2,
  FIVE_PATCH_PHYSIOLOGY_ENVELOPE_ELIGIBILITY_POLICY_V2,
  FIVE_PATCH_PHYSIOLOGY_ENVELOPE_PARAMETER_DIMENSIONS_V2,
  FIVE_PATCH_PHYSIOLOGY_ENVELOPE_PROTOCOL_V2,
  FIVE_PATCH_PHYSIOLOGY_ENVELOPE_READINESS_PLAN_V2,
  FIVE_PATCH_PHYSIOLOGY_ENVELOPE_SCREENING_PLAN_V2,
  FIVE_PATCH_PHYSIOLOGY_ENVELOPE_STRESS_PLAN_V2,
  FIVE_PATCH_PHYSIOLOGY_ENVELOPE_UNIT_DESIGN_V2,
  fivePatchPhysiologyEnvelopeCandidateIdV2,
  fivePatchPhysiologyEnvelopeParametersAtIndexV2,
  mapFivePatchPhysiologyEnvelopeMitralHydraulicsV2,
  mapFivePatchPhysiologyEnvelopeUnitPointV2,
} from "@/engine/mechanics2/envelope/FivePatchPhysiologyEnvelopeDefinitionV2";

const PROTOCOL_SEMANTIC_SHA256 =
  "bcbda47dd56e36d44d1c92e2c212cab80037756e8dc31992520493d3b7ccaa74";
const DESIGN_POINTS_SHA256 =
  "a447b4ecdf0003ccce2207d2b4129ae286c6ae8277207fa7e3c391eaeef62120";

describe("FivePatchPhysiologyEnvelopeDefinitionV2", () => {
  it("pins the independent V2 protocol and deterministic 64 x 12 design", () => {
    expect(sha256Json(FIVE_PATCH_PHYSIOLOGY_ENVELOPE_PROTOCOL_V2)).toBe(
      PROTOCOL_SEMANTIC_SHA256,
    );
    expect(sha256Json(FIVE_PATCH_PHYSIOLOGY_ENVELOPE_UNIT_DESIGN_V2.points))
      .toBe(DESIGN_POINTS_SHA256);
    expect(FIVE_PATCH_PHYSIOLOGY_ENVELOPE_UNIT_DESIGN_V2).toMatchObject({
      sampleCount: 64,
      dimensionCount: 12,
      selectedSeed: 19088743,
      selectedMinimumPairwiseDistance: 0.7190930420133193,
    });
    expect(FIVE_PATCH_PHYSIOLOGY_ENVELOPE_UNIT_DESIGN_V2.points).toHaveLength(64);
    expect(FIVE_PATCH_PHYSIOLOGY_ENVELOPE_UNIT_DESIGN_V2.points.every(
      (point) => point.length === 12,
    )).toBe(true);
    expect(Object.isFrozen(FIVE_PATCH_PHYSIOLOGY_ENVELOPE_DEFINITION_V2)).toBe(true);
    expect(Object.isFrozen(FIVE_PATCH_PHYSIOLOGY_ENVELOPE_PROTOCOL_V2)).toBe(true);
  });

  it("occupies every Latin stratum once in every committed dimension", () => {
    const design = FIVE_PATCH_PHYSIOLOGY_ENVELOPE_UNIT_DESIGN_V2;
    for (let dimension = 0; dimension < design.dimensionCount; dimension += 1) {
      const strata = design.points.map((point) =>
        Math.floor(point[dimension]! * design.sampleCount)
      ).sort((left, right) => left - right);
      expect(strata).toEqual(
        Array.from({ length: design.sampleCount }, (_, index) => index),
      );
    }
  });

  it("commits exactly the filling-relaxation and operating-point axes", () => {
    expect(FIVE_PATCH_PHYSIOLOGY_ENVELOPE_DIMENSION_IDS_V2).toEqual([
      "atrialActiveScale",
      "ventricularActiveScale",
      "atrialCalciumDecayScale",
      "ventricularCalciumDecayScale",
      "avDelaySec",
      "ventricularPassiveTangentScale",
      "mitralHydraulicAreaScale",
      "pulmonaryVenousResistanceScale",
      "pulmonaryVenousInertanceScale",
      "pulmonaryVeinComplianceScale",
      "bloodVolumeScale",
      "systemicResistanceScale",
    ]);
    expect(FIVE_PATCH_PHYSIOLOGY_ENVELOPE_PARAMETER_DIMENSIONS_V2.map(
      ({ dimensionId, transform, minimum, maximum }) =>
        [dimensionId, transform, minimum, maximum]
    )).toEqual([
      ["atrialActiveScale", "log", 0.15, 0.9],
      ["ventricularActiveScale", "log", 0.8, 2.5],
      ["atrialCalciumDecayScale", "log", 0.4, 1.2],
      ["ventricularCalciumDecayScale", "log", 0.45, 1.25],
      ["avDelaySec", "linear", 0.12, 0.22],
      ["ventricularPassiveTangentScale", "log", 0.6, 2.5],
      ["mitralHydraulicAreaScale", "log", 0.7, 1.5],
      ["pulmonaryVenousResistanceScale", "log", 0.5, 2],
      ["pulmonaryVenousInertanceScale", "log", 0.25, 4],
      ["pulmonaryVeinComplianceScale", "log", 0.5, 2],
      ["bloodVolumeScale", "linear", 0.85, 1.15],
      ["systemicResistanceScale", "log", 0.7, 1.4],
    ]);
    expect(FIVE_PATCH_PHYSIOLOGY_ENVELOPE_PROTOCOL_V2.modelClass).toMatchObject({
      slsTopology: "all-patch",
      slsParametersFixed: true,
      landCellularParametersFixed: true,
      calciumAmplitudeFixed: true,
      dynamicAvPlaneState: false,
      shapeCoordinate: false,
      pericardium: false,
    });
  });

  it("maps linear and logarithmic coordinates without touching the bounds", () => {
    const midpoint = mapFivePatchPhysiologyEnvelopeUnitPointV2(
      Array(12).fill(0.5),
    );
    expect(midpoint.atrialActiveScale).toBeCloseTo(Math.sqrt(0.15 * 0.9), 14);
    expect(midpoint.avDelaySec).toBeCloseTo(0.17, 14);
    expect(midpoint.bloodVolumeScale).toBeCloseTo(1, 14);
    expect(midpoint.mitralHydraulicAreaScale).toBeCloseTo(
      Math.sqrt(0.7 * 1.5),
      14,
    );
    for (let index = 0; index < 64; index += 1) {
      const mapped = fivePatchPhysiologyEnvelopeParametersAtIndexV2(index);
      for (const dimension of FIVE_PATCH_PHYSIOLOGY_ENVELOPE_PARAMETER_DIMENSIONS_V2) {
        expect(mapped[dimension.dimensionId]).toBeGreaterThan(dimension.minimum);
        expect(mapped[dimension.dimensionId]).toBeLessThan(dimension.maximum);
      }
    }
    expect(() => mapFivePatchPhysiologyEnvelopeUnitPointV2([0.5])).toThrow(
      /dimensions/,
    );
    expect(() => mapFivePatchPhysiologyEnvelopeUnitPointV2(Array(12).fill(0)))
      .toThrow(/strictly inside/);
  });

  it("applies one coupled MV area axis with the committed physical exponents", () => {
    const baseline = {
      valveId: "MV" as const,
      openAreaCm2: 4,
      leakAreaCm2: 0.04,
      openingMidpointMmHg: 0.1,
      openingWidthMmHg: 0.2,
      openResistanceMmHgSecPerMl: 0.08,
      openInertanceMmHgSec2PerMl: 0.006,
      openBernoulliMmHgSec2PerMl2: 0.004,
      flowSmoothingMlPerSec: 0.5,
      newtonIterations: 7,
    };
    const mapped = mapFivePatchPhysiologyEnvelopeMitralHydraulicsV2(
      baseline,
      2,
    );
    expect(mapped).toEqual({
      ...baseline,
      openAreaCm2: 8,
      leakAreaCm2: 0.08,
      openResistanceMmHgSecPerMl: 0.02,
      openInertanceMmHgSec2PerMl: 0.003,
      openBernoulliMmHgSec2PerMl2: 0.001,
    });
    expect(mapped.openingMidpointMmHg).toBe(baseline.openingMidpointMmHg);
    expect(mapped.openingWidthMmHg).toBe(baseline.openingWidthMmHg);
    expect(mapped.flowSmoothingMlPerSec).toBe(baseline.flowSmoothingMlPerSec);
    expect(mapped.newtonIterations).toBe(baseline.newtonIterations);
    expect(() => mapFivePatchPhysiologyEnvelopeMitralHydraulicsV2(
      { ...baseline, valveId: "AoV" },
      1,
    )).toThrow(/valveId MV/);
    expect(() => mapFivePatchPhysiologyEnvelopeMitralHydraulicsV2(baseline, 0))
      .toThrow(/positive/);
  });

  it("expands only the exact predeclared screening, readiness, stress, and dt plans", () => {
    expect(FIVE_PATCH_PHYSIOLOGY_ENVELOPE_READINESS_PLAN_V2).toEqual(
      [0, 16, 32, 48].map((candidateIndex) => ({
        phase: "arm-numerical-readiness",
        candidateIndex,
        scenarioId: "hr60-reference",
        beats: 1,
        dtSec: 0.002,
      })),
    );
    expect(FIVE_PATCH_PHYSIOLOGY_ENVELOPE_SCREENING_PLAN_V2).toHaveLength(64);
    expect(FIVE_PATCH_PHYSIOLOGY_ENVELOPE_SCREENING_PLAN_V2.every((point) =>
      point.phase === "screening" &&
      point.scenarioId === "hr60-reference" &&
      point.beats === 32 &&
      point.dtSec === 0.002
    )).toBe(true);
    expect(FIVE_PATCH_PHYSIOLOGY_ENVELOPE_SCREENING_PLAN_V2.map(
      (point) => point.candidateIndex
    )).toEqual(Array.from({ length: 64 }, (_, index) => index));

    expect(FIVE_PATCH_PHYSIOLOGY_ENVELOPE_STRESS_PLAN_V2).toHaveLength(160);
    expect(new Set(FIVE_PATCH_PHYSIOLOGY_ENVELOPE_STRESS_PLAN_V2.map(
      (point) => point.candidateIndex
    ))).toEqual(new Set(Array.from({ length: 16 }, (_, index) => index * 4)));
    expect(new Set(FIVE_PATCH_PHYSIOLOGY_ENVELOPE_STRESS_PLAN_V2.map(
      (point) => point.scenarioId
    ))).toEqual(new Set([
      "hr50-reference",
      "hr60-reference",
      "hr75-reference",
      "hr100-reference",
      "hr60-blood-volume-low",
      "hr60-blood-volume-high",
      "hr60-afterload-low",
      "hr60-afterload-high",
      "hr60-pvr-low",
      "hr60-pvr-high",
    ]));

    expect(FIVE_PATCH_PHYSIOLOGY_ENVELOPE_DT_REFINEMENT_PLAN_V2).toHaveLength(8);
    expect(new Set(FIVE_PATCH_PHYSIOLOGY_ENVELOPE_DT_REFINEMENT_PLAN_V2.map(
      (point) => point.candidateIndex
    ))).toEqual(new Set([0, 16, 32, 48]));
    expect(new Set(FIVE_PATCH_PHYSIOLOGY_ENVELOPE_DT_REFINEMENT_PLAN_V2.map(
      (point) => point.dtSec
    ))).toEqual(new Set([0.002, 0.001]));
  });

  it("pins numerical and broad plausibility eligibility before results", () => {
    expect(FIVE_PATCH_PHYSIOLOGY_ENVELOPE_ELIGIBILITY_POLICY_V2.numerical)
      .toEqual({
        requiresCompletedRun: true,
        requiresAllAcceptedOutputsFinite: true,
        requiresAllCompartmentVolumesPositive: true,
        maximumAbsoluteBloodVolumeResidualMl: 1e-6,
        periodicity: {
          requiredPhases: ["screening", "stress-validation", "dt-refinement"],
          notRequiredPhases: ["arm-numerical-readiness"],
          consecutiveFullStateReturnMapCount: 2,
          maximumAbsoluteDimensionlessResidual: 1e-4,
        },
        excludedMetrics: ["v-loop"],
      });
    expect(FIVE_PATCH_PHYSIOLOGY_ENVELOPE_ELIGIBILITY_POLICY_V2.broadOperatingPoint)
      .toEqual({
        role: "plausibility-screen-not-normal-human-calibration",
        assessmentSource: "raw-final-assessment-cycle",
        leftAtrialPressureMmHg: { minimum: -3, maximum: 30 },
        leftVentricularPeakPressureMmHg: { minimum: 80, maximum: 200 },
        aorticPressureMmHg: { minimum: 45, maximum: 180 },
        cardiacOutputLPerMin: { minimum: 3, maximum: 8 },
        leftVentricularEjectionFraction: { minimum: 0.4, maximum: 0.75 },
        pulmonaryVeinPressureMmHg: { minimum: 0.1, maximum: 40 },
        valveReverseFlow: {
          valveIds: ["MV", "AoV", "TV", "PV"],
          maximumReverseVolumeMl: {
            absoluteFloorMl: 1,
            forwardVolumeFraction: 0.05,
            combination: "maximum-of-absolute-floor-and-forward-fraction",
          },
          reverseFlowDuty: {
            status: "report-only",
            eligibilityThreshold: null,
          },
        },
        excludedMetrics: ["v-loop"],
      });
  });

  it("uses stable single-arm candidate identities", () => {
    expect(fivePatchPhysiologyEnvelopeCandidateIdV2(0)).toBe(
      "land-equilibrium-passive-sls-all-patch-fixed::lhs-00",
    );
    expect(fivePatchPhysiologyEnvelopeCandidateIdV2(63)).toBe(
      "land-equilibrium-passive-sls-all-patch-fixed::lhs-63",
    );
    expect(() => fivePatchPhysiologyEnvelopeCandidateIdV2(64)).toThrow(
      /outside/,
    );
  });
});

function sha256Json(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}
