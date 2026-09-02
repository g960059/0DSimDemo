import { describe, expect, it } from "vitest";

import normalReferenceEvidenceV1 from "@/data/physiology/main-wire-normal-reference-evidence-v1.json";
import {
  evaluateMainWireBaselineCalibrationCandidateV1,
} from "@/analysis/methods/mainWire/MainWireBaselineCalibrationEvaluatorV1";
import {
  buildMainWireBaselineNumericalFloorMetricV1,
} from "@/analysis/methods/mainWire/MainWireBaselineNumericalFloorAuditV1";
import {
  applyMainWireBaselineCalibrationParametersV1,
  readMainWireBaselineCalibrationParameterV1,
} from "@/analysis/policies/mainWire/MainWireBaselineCalibrationParametersV1";
import {
  MAIN_WIRE_BASELINE_CONDITIONING_STUDY_SOURCE_V1,
  compileMainWireBaselineConditioningStudyV1,
  lintMainWireBaselineConditioningStudyV1,
} from "@/analysis/policies/mainWire/MainWireBaselineConditioningStudyV1";
import {
  MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRELOAD_RESERVE_POLICY_V1,
  mainWireIntegratedModelFormalPreloadReserveDirectionalResponsePassedV1,
  type MainWireIntegratedModelFormalPreloadReserveDirectionalResponseV1,
} from "@/analysis/methods/mainWire/MainWirePressureVolumeProtocolsV3";
import { sha256CanonicalJsonHex } from "@/engine/integrity/sha256";
import {
  MAIN_WIRE_INTEGRATED_MODEL_BASELINE_VALIDATION_POLICY_V1,
  buildMainWireIntegratedModelBaselineValidationChecksV1,
  countMainWireIntegratedModelSignificantPressurePeaksV1,
  type MainWireIntegratedModelBaselineValidationMeasurementsV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelBaselineValidationV1";
import {
  MAIN_WIRE_INTEGRATED_MODEL_HEALTHY_REFERENCE_CONTEXT_V3,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelHealthyReferenceContextV3";
import {
  MAIN_WIRE_INTEGRATED_MODEL_ROUNDED_EJECTION_BASELINE_HEMODYNAMIC_INPUTS_V1,
  MAIN_WIRE_INTEGRATED_MODEL_ROUNDED_EJECTION_BASELINE_MECHANISM_INPUTS_V1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelRoundedEjectionBaselineV1";

const indexedCheckIds = Object.freeze([
  "left-ventricle.edv-index",
  "left-ventricle.esv-index",
  "left-ventricle.ejection-fraction",
  "right-ventricle.edv-index",
  "right-ventricle.esv-index",
  "right-ventricle.ejection-fraction",
  "systemic-forward-flow.cardiac-index",
  "systemic-forward-flow.stroke-volume-index",
] as const);

const pressureCheckIds = Object.freeze([
  "aortic-pressure.maximum",
  "aortic-pressure.minimum",
  "pulmonary-artery-pressure.maximum",
  "pulmonary-artery-pressure.minimum",
  "central-venous-pressure.mean",
  "pcwp-surrogate.mean",
] as const);

describe("Standard68 baseline mint gates", () => {
  it("binds every construction gate to explicit evidence roles and a revisioned policy digest", async () => {
    const sourceIds = normalReferenceEvidenceV1.sources.map(({ sourceId }) =>
      sourceId);
    expect(new Set(sourceIds).size).toBe(sourceIds.length);
    for (const source of normalReferenceEvidenceV1.sources) {
      expect(source.verification).toBe("primary-source-metadata-checked");
      expect(
        ("doi" in source.identifiers && source.identifiers.doi.length > 0)
          || ("pmid" in source.identifiers && source.identifiers.pmid.length > 0),
      ).toBe(true);
    }

    const evidenceIds = normalReferenceEvidenceV1.evidenceBindings.map(
      ({ evidenceId }) => evidenceId,
    );
    expect(new Set(evidenceIds).size).toBe(evidenceIds.length);
    for (const binding of normalReferenceEvidenceV1.evidenceBindings) {
      expect(binding.useRole).toBe("construction-context");
      expect(binding.measurementMeaning.trim()).not.toBe("");
      expect(binding.limitations.trim()).not.toBe("");
      for (const sourceId of binding.canonicalSourceIds) {
        expect(sourceIds).toContain(sourceId);
      }
    }
    for (const gate of
      MAIN_WIRE_INTEGRATED_MODEL_HEALTHY_REFERENCE_CONTEXT_V3.gates) {
      for (const evidenceId of gate.sourceIds) {
        expect(evidenceIds).toContain(evidenceId);
      }
    }

    const currentCheckIds = buildMainWireIntegratedModelBaselineValidationChecksV1(
      normalMeasurementsV1(),
      true,
    ).map(({ checkId }) => checkId);
    const coveredCheckIds = normalReferenceEvidenceV1.checkGroups.flatMap(
      ({ checkIds }) => checkIds,
    );
    expect(new Set(coveredCheckIds).size).toBe(coveredCheckIds.length);
    expect([...coveredCheckIds].sort()).toEqual([...currentCheckIds].sort());
    for (const group of normalReferenceEvidenceV1.checkGroups) {
      expect(group.evidenceRole).toBe("construction");
      expect(group.measurementMeaning.trim()).not.toBe("");
      expect(group.changeReason.trim()).not.toBe("");
      for (const evidenceId of group.contextEvidenceIds) {
        expect(evidenceIds).toContain(evidenceId);
      }
    }

    expect(normalReferenceEvidenceV1.claimScope).toEqual({
      currentBaselineEvidenceRole: "construction",
      finalConfirmationStatus: "unavailable",
      reason: expect.any(String),
    });
    expect(normalReferenceEvidenceV1.claimScope.reason.trim()).not.toBe("");

    const revisions = normalReferenceEvidenceV1.policyRevisions;
    expect(new Set(revisions.map(({ revisionId }) => revisionId)).size)
      .toBe(revisions.length);
    expect(new Set(revisions.map(({ policySha256 }) => policySha256)).size)
      .toBe(revisions.length);
    for (const revision of revisions) {
      expect(revision.evidenceRole).toBe("construction");
      expect(revision.changeReason.trim()).not.toBe("");
      expect(revision.policySha256).toMatch(/^[0-9a-f]{64}$/);
    }
    const currentPolicySha256 = await sha256CanonicalJsonHex({
      validationPolicy:
        MAIN_WIRE_INTEGRATED_MODEL_BASELINE_VALIDATION_POLICY_V1,
      healthyReferenceContext:
        MAIN_WIRE_INTEGRATED_MODEL_HEALTHY_REFERENCE_CONTEXT_V3,
    });
    expect(revisions.at(-1)?.policySha256).toBe(currentPolicySha256);
  });

  it("admits a coherent normal indexed size/function reference", () => {
    const checks = buildMainWireIntegratedModelBaselineValidationChecksV1(
      normalMeasurementsV1(),
      true,
    );

    expect(checks).toHaveLength(28);
    expect(checks.every(({ status }) => status === "passed")).toBe(true);
    expect(
      checks.filter(({ checkId }) =>
        indexedCheckIds.includes(checkId as typeof indexedCheckIds[number]))
        .map(({ checkId }) => checkId),
    ).toEqual(indexedCheckIds);
    expect(
      checks.filter(({ checkId }) =>
        pressureCheckIds.includes(checkId as typeof pressureCheckIds[number]))
        .map(({ checkId }) => checkId),
    ).toEqual(pressureCheckIds);
  });

  it("fails closed on every out-of-range systemic and pulmonary pressure metric", () => {
    const normal = normalMeasurementsV1();
    const measurements = Object.freeze({
      ...normal,
      hemodynamicPressure: Object.freeze({
        aortic: Object.freeze({ maximumMmHg: 89.9, minimumMmHg: 59.9 }),
        pulmonaryArtery: Object.freeze({
          maximumMmHg: 35.1,
          minimumMmHg: 15.1,
        }),
        centralVenousMeanMmHg: 8.1,
        pcwpSurrogateMeanMmHg: 13.1,
      }),
    });
    const failed = buildMainWireIntegratedModelBaselineValidationChecksV1(
      measurements,
      true,
    ).filter(({ status }) => status === "failed");

    expect(failed.map(({ checkId }) => checkId)).toEqual(pressureCheckIds);
  });

  it("fails closed on every out-of-range indexed size/function metric", () => {
    const normal = normalMeasurementsV1();
    const measurements = Object.freeze({
      ...normal,
      cardiacSizeAndFunction: Object.freeze({
        ...normal.cardiacSizeAndFunction,
        leftVentricle: Object.freeze({
          ...normal.cardiacSizeAndFunction.leftVentricle,
          endDiastolicVolumeIndexMlPerM2: 100,
          endSystolicVolumeIndexMlPerM2: 41,
          ejectionFraction01: 0.51,
        }),
        rightVentricle: Object.freeze({
          ...normal.cardiacSizeAndFunction.rightVentricle,
          endDiastolicVolumeIndexMlPerM2: 88,
          endSystolicVolumeIndexMlPerM2: 45,
          ejectionFraction01: 0.41,
        }),
        systemicForwardFlow: Object.freeze({
          ...normal.cardiacSizeAndFunction.systemicForwardFlow,
          cardiacIndexLPerMinPerM2: 2.49,
          strokeVolumeIndexMlPerM2: 34.9,
        }),
      }),
    });
    const failed = buildMainWireIntegratedModelBaselineValidationChecksV1(
      measurements,
      true,
    ).filter(({ status }) => status === "failed");

    expect(failed.map(({ checkId }) => checkId)).toEqual(indexedCheckIds);
  });

  it("requires flow, filling pressure, EDV, and ED transmural reserve in both directions", () => {
    const policy = MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRELOAD_RESERVE_POLICY_V1;
    const admitted = directionalResponseV1("hypervolemic");
    expect(
      mainWireIntegratedModelFormalPreloadReserveDirectionalResponsePassedV1(
        admitted,
      ),
    ).toBe(true);

    const failingMutations: readonly Partial<
      MainWireIntegratedModelFormalPreloadReserveDirectionalResponseV1
    >[] = [
      {
        directionalFillingPressureChangeMmHg:
          policy.minimumDirectionalFillingPressureChangeMmHg - 1e-3,
      },
      {
        directionalCardiacOutputChangeLPerMin:
          policy.minimumDirectionalCardiacOutputChangeLPerMin - 1e-3,
      },
      {
        directionalCardiacOutputChangeFraction01:
          policy.minimumDirectionalCardiacOutputChangeFraction01 - 1e-3,
      },
      {
        cardiacOutputSlopeLPerMinPerMmHg:
          policy.minimumCardiacOutputSlopeLPerMinPerMmHg - 1e-3,
      },
      {
        directionalEndDiastolicVolumeChangeMl:
          policy.minimumDirectionalEndDiastolicVolumeChangeMl - 1e-3,
      },
      {
        directionalEndDiastolicVolumeChangeFraction01:
          policy.minimumDirectionalEndDiastolicVolumeChangeFraction01 - 1e-3,
      },
      {
        directionalEndDiastolicTransmuralPressureChangeMmHg:
          policy.minimumDirectionalEndDiastolicTransmuralPressureChangeMmHg
          - 1e-3,
      },
      { endDiastolicVolumeResponseMlPerMmHg: 0 },
    ];
    for (const mutation of failingMutations) {
      expect(
        mainWireIntegratedModelFormalPreloadReserveDirectionalResponsePassedV1(
          Object.freeze({ ...admitted, ...mutation }),
        ),
      ).toBe(false);
    }

    expect(
      mainWireIntegratedModelFormalPreloadReserveDirectionalResponsePassedV1(
        directionalResponseV1("hypovolemic"),
      ),
    ).toBe(true);
  });

  it("counts a rippled broad summit as one peak but retains a true two-peak waveform", () => {
    expect(
      countMainWireIntegratedModelSignificantPressurePeaksV1(
        [0, 5, 9, 8.8, 9.1, 8.9, 8.8, 5, 0],
      ),
    ).toBe(1);
    expect(
      countMainWireIntegratedModelSignificantPressurePeaksV1(
        [0, 8, 4, 9, 0],
      ),
    ).toBe(2);
    expect(
      countMainWireIntegratedModelSignificantPressurePeaksV1(
        [0, 1, 2, 3],
      ),
    ).toBe(0);
  });

  it("separates calibration request rejection and interruption before exact execution", async () => {
    const invalidHeartRate = await evaluateMainWireBaselineCalibrationCandidateV1({
      hemodynamicResearchInputs: Object.freeze({
        ...MAIN_WIRE_INTEGRATED_MODEL_ROUNDED_EJECTION_BASELINE_HEMODYNAMIC_INPUTS_V1,
        heartRateBpm: 65,
      }),
    });
    expect(invalidHeartRate).toMatchObject({
      status: "invalid-or-physical",
      phase: "request-validation",
      requestIdentitySha256: null,
    });

    const controller = new AbortController();
    controller.abort();
    const interrupted = await evaluateMainWireBaselineCalibrationCandidateV1({
      abortSignal: controller.signal,
    });
    expect(interrupted).toMatchObject({
      status: "operational-interrupted",
      phase: "interruption",
      requestIdentitySha256: null,
    });
  });

  it("keeps numerical differences separate before applying any physiological threshold", () => {
    const check = (
      actual: number,
    ) => Object.freeze({
      checkId: "aortic-valve.mean-gradient" as const,
      status: "passed" as const,
      actual,
      minimum: 0,
      maximum: 5,
      unit: "mmHg",
    });
    expect(buildMainWireBaselineNumericalFloorMetricV1(
      check(3),
      check(3),
      check(3.125),
      check(3.25),
    )).toEqual({
      checkId: "aortic-valve.mean-gradient",
      unit: "mmHg",
      constructionMinimum: 0,
      constructionMaximum: 5,
      constructionCorridorWidth: 5,
      coldRepeatAbsoluteDifference: 0,
      coldCheckpointAbsoluteDifference: 0.125,
      dtHalvingAbsoluteDifference: 0.25,
      numericalFloorAbsolute: 0.25,
      numericalFloorFractionOfCorridor: 0.05,
    });
  });

  it("compiles the conditioning study deterministically and fails closed on confounded primary coordinates", async () => {
    expect(lintMainWireBaselineConditioningStudyV1(
      MAIN_WIRE_BASELINE_CONDITIONING_STUDY_SOURCE_V1,
    )).toEqual([]);

    const first = await compileMainWireBaselineConditioningStudyV1();
    const second = await compileMainWireBaselineConditioningStudyV1();
    expect(first.studyIdentitySha256).toMatch(/^[0-9a-f]{64}$/);
    expect(second).toEqual(first);

    const confounded = Object.freeze({
      ...MAIN_WIRE_BASELINE_CONDITIONING_STUDY_SOURCE_V1,
      primaryCoordinateIds: Object.freeze([
        ...MAIN_WIRE_BASELINE_CONDITIONING_STUDY_SOURCE_V1.primaryCoordinateIds,
        "hemodynamics.venous-tone" as const,
      ]),
    });
    expect(lintMainWireBaselineConditioningStudyV1(confounded)
      .map(({ code }) => code)).toEqual(expect.arrayContaining([
        "primary-role-mismatch",
        "confounded-primary-coordinates",
        "preload-owner-count",
      ]));
  });

  it("applies calibration coordinates independent of update ordering", () => {
    const base = Object.freeze({
      hemodynamicResearchInputs:
        MAIN_WIRE_INTEGRATED_MODEL_ROUNDED_EJECTION_BASELINE_HEMODYNAMIC_INPUTS_V1,
      mechanismResearchInputs:
        MAIN_WIRE_INTEGRATED_MODEL_ROUNDED_EJECTION_BASELINE_MECHANISM_INPUTS_V1,
      ventricularContractilityScale: 1,
    });
    const updates = Object.freeze([
      Object.freeze({
        parameterId: "hemodynamics.systemic-resistance" as const,
        value: 0.99,
      }),
      Object.freeze({
        parameterId:
          "myocardium.common-ventricular-active-tension-scale" as const,
        value: 1.01,
      }),
    ]);
    const forward = applyMainWireBaselineCalibrationParametersV1(base, updates);
    const reverse = applyMainWireBaselineCalibrationParametersV1(
      base,
      [...updates].reverse(),
    );

    expect(reverse).toEqual(forward);
    expect(readMainWireBaselineCalibrationParameterV1(
      forward,
      "hemodynamics.systemic-resistance",
    )).toBe(0.99);
    expect(readMainWireBaselineCalibrationParameterV1(
      forward,
      "myocardium.common-ventricular-active-tension-scale",
    )).toBe(1.01);
  });
});

function normalMeasurementsV1():
  MainWireIntegratedModelBaselineValidationMeasurementsV1 {
  return Object.freeze({
    LVP: Object.freeze({
      forwardEpisodeCount: 1,
      significantPeakCount: 1,
      totalVariationRatio: 1.2,
      centralRangeFraction: 0.2,
      peakPhase01: 0.5,
    }),
    RVP: Object.freeze({
      forwardEpisodeCount: 1,
      significantPeakCount: 1,
      totalVariationRatio: 1.2,
      centralRangeFraction: 0.2,
      peakPhase01: 0.5,
    }),
    aorticValve: Object.freeze({
      ejectionTimeSec: 0.28,
      meanGradientMmHg: 3,
      peakGradientMmHg: 6,
    }),
    leftVentricle: Object.freeze({
      maximumDpDtMmHgPerSec: 1_800,
      minimumDpDtMmHgPerSec: -900,
    }),
    mitralFlow: Object.freeze({
      peakEMlPerSec: 300,
      peakAMlPerSec: 250,
      peakEToA: 1.2,
    }),
    timing: Object.freeze({
      ictSec: 0.04,
      irtSec: 0.08,
      teiIndex: 0.42857142857142855,
    }),
    hemodynamicPressure: Object.freeze({
      aortic: Object.freeze({ maximumMmHg: 120, minimumMmHg: 75 }),
      pulmonaryArtery: Object.freeze({ maximumMmHg: 25, minimumMmHg: 9 }),
      centralVenousMeanMmHg: 4,
      pcwpSurrogateMeanMmHg: 9,
    }),
    cardiacSizeAndFunction: Object.freeze({
      bodySurfaceAreaM2: 1.9,
      leftVentricle: Object.freeze({
        endDiastolicVolumeMl: 114,
        endSystolicVolumeMl: 38,
        endDiastolicVolumeIndexMlPerM2: 60,
        endSystolicVolumeIndexMlPerM2: 20,
        ejectionFraction01: 2 / 3,
      }),
      rightVentricle: Object.freeze({
        endDiastolicVolumeMl: 133,
        endSystolicVolumeMl: 57,
        endDiastolicVolumeIndexMlPerM2: 70,
        endSystolicVolumeIndexMlPerM2: 30,
        ejectionFraction01: 76 / 133,
      }),
      systemicForwardFlow: Object.freeze({
        strokeVolumeMl: 76,
        strokeVolumeIndexMlPerM2: 40,
        cardiacOutputLPerMin: 5.7,
        cardiacIndexLPerMinPerM2: 3,
      }),
    }),
  });
}

function directionalResponseV1(
  endpointDirection: "hypovolemic" | "hypervolemic",
): MainWireIntegratedModelFormalPreloadReserveDirectionalResponseV1 {
  const sign = endpointDirection === "hypervolemic" ? 1 : -1;
  return Object.freeze({
    endpointDirection,
    baselineFillingPressureMmHg: 8,
    endpointFillingPressureMmHg: 8 + sign * 2,
    directionalFillingPressureChangeMmHg: 2,
    baselineCardiacOutputLPerMin: 5,
    endpointCardiacOutputLPerMin: 5 + sign * 0.25,
    directionalCardiacOutputChangeLPerMin: 0.25,
    directionalCardiacOutputChangeFraction01: 0.05,
    cardiacOutputSlopeLPerMinPerMmHg: 0.125,
    baselineEndDiastolicVolumeMl: 120,
    endpointEndDiastolicVolumeMl: 120 + sign * 8,
    directionalEndDiastolicVolumeChangeMl: 8,
    directionalEndDiastolicVolumeChangeFraction01: 8 / 120,
    baselineEndDiastolicTransmuralPressureMmHg: 10,
    endpointEndDiastolicTransmuralPressureMmHg: 10 + sign,
    directionalEndDiastolicTransmuralPressureChangeMmHg: 1,
    endDiastolicVolumeResponseMlPerMmHg: 8,
  });
}
