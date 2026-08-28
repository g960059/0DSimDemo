import { describe, expect, it } from "vitest";

import {
  analyzeDimensionlessSensitivityMatrixSvdV1,
  measureMainWireVentricularCalciumSourceTraceFitRecalibrationSensitivityV1,
} from "@/analysis/methods/mainWire/MainWireVentricularCalciumSourceTraceFitRecalibrationSensitivityV1";
import {
  compareMainWireVentricularCalciumSourceTraceFitRecalibrationCandidatesV1,
} from "@/analysis/methods/mainWire/MainWireVentricularCalciumSourceTraceFitRecalibrationCandidateComparisonV1";
import {
  analyzeMainWireVentricularCalciumSourceTraceFitTrefPassiveParetoV1,
} from "@/analysis/methods/mainWire/MainWireVentricularCalciumSourceTraceFitTrefPassiveParetoV1";
import {
  compareMainWireVentricularCalciumSourceTraceFitTrefPassiveDistortionCandidatesV1,
} from "@/analysis/methods/mainWire/MainWireVentricularCalciumSourceTraceFitTrefPassiveDistortionComparisonV1";
import type {
  MainWireAorticValveObservationGeometryV1,
} from "@/analysis/methods/mainWire/MainWireAorticValveObservationStationsV1";
import {
  MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_RECALIBRATION_AXIS_IDS_V1,
  MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_RECALIBRATION_POINT_IDS_V1,
  MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_RECALIBRATION_POINTS_V1,
} from "@/engine/myocardium/experiments/MainWireVentricularCalciumSourceTraceFitRecalibrationPointsV1";
import {
  MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_RECALIBRATION_CANDIDATE_IDS_V1,
} from "@/engine/myocardium/experiments/MainWireVentricularCalciumSourceTraceFitRecalibrationCandidatesV1";
import {
  MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_PASSIVE_LEVELS_V1,
  MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_TREF_LEVELS_V1,
  MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_TREF_PASSIVE_PROFILES_V1,
  resolveMainWireVentricularCalciumSourceTraceFitTrefPassiveMechanicsInputV1,
} from "@/engine/myocardium/experiments/MainWireVentricularCalciumSourceTraceFitTrefPassiveGridV1";
import {
  MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_TREF_PASSIVE_DISTORTION_CANDIDATES_V1,
} from "@/engine/myocardium/experiments/MainWireVentricularCalciumSourceTraceFitTrefPassiveDistortionCandidatesV1";
import {
  runMainWireNormalAdultFiveWallVentricularCalciumSourceConstrainedResearchV1,
  runMainWireNormalAdultFiveWallVentricularCalciumSourceTraceFitResearchV1,
  runMainWireNormalAdultFiveWallVentricularCalciumSourceTraceFitRecalibrationCandidateResearchV1,
  runMainWireNormalAdultFiveWallVentricularCalciumSourceTraceFitRecalibrationResearchV1,
  runMainWireNormalAdultFiveWallVentricularCalciumSourceTraceFitTrefPassiveDistortionResearchV1,
  runMainWireNormalAdultFiveWallVentricularCalciumSourceTraceFitTrefPassiveResearchV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";

const GEOMETRY = Object.freeze({
  geometryId: "fixed-lvot-d2p3cm-aa-d3p0cm-v1",
  provenance: "fixed-research-bracket" as const,
  lvotCrossSectionalAreaCm2: Math.PI * (2.3 / 2) ** 2,
  ascendingAorticCrossSectionalAreaCm2: Math.PI * (3 / 2) ** 2,
}) satisfies MainWireAorticValveObservationGeometryV1;

describe("main-wire source-trace calcium recalibration sensitivity V1", () => {
  it("defines a bounded reciprocal one-factor grid without valve or Ca axes", () => {
    expect(MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_RECALIBRATION_POINTS_V1)
      .toHaveLength(13);
    expect(MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_RECALIBRATION_AXIS_IDS_V1)
      .toEqual([
        "systemic-resistance",
        "pulmonary-resistance",
        "arterial-stiffness",
        "stressed-venous-volume",
        "ventricular-tref",
        "ventricular-passive",
      ]);
    for (const axis of
      MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_RECALIBRATION_AXIS_IDS_V1) {
      const points =
        MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_RECALIBRATION_POINTS_V1
          .filter((point) => point.axis === axis);
      expect(points.map((point) => point.level)).toEqual(["low", "high"]);
      expect(points[0]!.axisScaleFromBaseline
        * points[1]!.axisScaleFromBaseline).toBe(1);
      expect(points.every((point) =>
        point.claim.ventricularCalciumProfileHeldFixed)).toBe(true);
      expect(points.every((point) =>
        point.claim.aorticValveAreaHeldFixed)).toBe(true);
    }
  });

  it("recovers known singular values and reconstructs a rectangular matrix", () => {
    const svd = analyzeDimensionlessSensitivityMatrixSvdV1([
      [3, 0],
      [0, 2],
      [0, 0],
    ]);
    expect(svd.singularValues[0]).toBeCloseTo(3, 12);
    expect(svd.singularValues[1]).toBeCloseTo(2, 12);
    expect(svd.numericalRank).toBe(2);
    expect(svd.conditionNumberAtNumericalRank).toBeCloseTo(1.5, 12);
    expect(svd.maximumAbsoluteReconstructionResidual).toBeLessThan(1e-12);
    expect(svd.maximumRightOrthogonalityResidual).toBeLessThan(1e-12);
    expect(svd.maximumLeftOrthogonalityResidualForNonzeroModes)
      .toBeLessThan(1e-12);
    expect(svd.jacobiConverged).toBe(true);
  });

  it("identifies a rank-one collinear sensitivity matrix", () => {
    const svd = analyzeDimensionlessSensitivityMatrixSvdV1([
      [1, 2],
      [2, 4],
      [3, 6],
    ]);
    expect(svd.relativeSingularValues[1]).toBeLessThan(1e-7);
    expect(svd.effectiveRankAtRelativeThreshold.p01).toBe(1);
    expect(svd.maximumAbsoluteReconstructionResidual).toBeLessThan(1e-10);
  });

  it("assembles every fixed point with one Ca identity and reports station-separated gradients", () => {
    const runs =
      MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_RECALIBRATION_POINT_IDS_V1
        .map((pointId) =>
          runMainWireNormalAdultFiveWallVentricularCalciumSourceTraceFitRecalibrationResearchV1(
            { dtSec: 0.02, maximumBeatCount: 1 },
            pointId,
          ));
    const measured =
      measureMainWireVentricularCalciumSourceTraceFitRecalibrationSensitivityV1(
        runs.map((run) => ({
          pointId: run.point.pointId,
          periodicResult: run.periodicResult,
        })),
        GEOMETRY,
      );

    expect(measured.arms).toHaveLength(13);
    expect(measured.axisSensitivities).toHaveLength(6);
    expect(measured.dimensionlessSensitivityMatrixByObservableThenAxis)
      .toHaveLength(10);
    expect(measured.dimensionlessSensitivityMatrixByObservableThenAxis
      .every((row) => row.length === 6 && row.every(Number.isFinite))).toBe(true);
    expect(measured.allArmsShareCalciumDriveIdentity).toBe(true);
    expect(measured.allArmsPeriod1AndIntegrated).toBe(false);
    expect(measured.interpretationEligible).toBe(false);
    expect(measured.svd.maximumAbsoluteReconstructionResidual)
      .toBeLessThan(1e-10);
    expect(measured.arms.every((arm) =>
      arm.observationStations.timeMeanGradientMmHg.simplifiedDoppler
        > arm.observationStations.timeMeanGradientMmHg
          .proximalVelocityCorrectedDoppler)).toBe(true);
    expect(measured.claim).toMatchObject({
      exactFrameMutation: false,
      clinicalTargetsApplied: false,
      parameterOptimizationOrFitApplied: false,
      gradientRowsExcludedFromSvdToAvoidDuplicatingFixedEoaFlowInformation: true,
    });
    expect(() =>
      measureMainWireVentricularCalciumSourceTraceFitRecalibrationSensitivityV1(
        runs.slice(1).map((run) => ({
          pointId: run.point.pointId,
          periodicResult: run.periodicResult,
        })),
        GEOMETRY,
      )).toThrow("requires 13 arms");
  }, 60_000);

  it("compares only the three fixed post-SVD corners without treating canonical as clinical truth", () => {
    const options = { dtSec: 0.02, maximumBeatCount: 1 } as const;
    const canonical =
      runMainWireNormalAdultFiveWallVentricularCalciumSourceConstrainedResearchV1(
        options,
        "canonical",
      );
    const source =
      runMainWireNormalAdultFiveWallVentricularCalciumSourceTraceFitResearchV1(
        options,
      );
    const candidates =
      MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_RECALIBRATION_CANDIDATE_IDS_V1
        .map((candidateId) =>
          runMainWireNormalAdultFiveWallVentricularCalciumSourceTraceFitRecalibrationCandidateResearchV1(
            options,
            candidateId,
          ));
    const comparison =
      compareMainWireVentricularCalciumSourceTraceFitRecalibrationCandidatesV1(
        canonical.periodicResult,
        source.periodicResult,
        candidates.map((run) => ({
          candidateId: run.candidate.candidateId,
          periodicResult: run.periodicResult,
        })),
        GEOMETRY,
      );

    expect(comparison.candidates).toHaveLength(3);
    expect(comparison.sourceAndCandidatesShareCalciumDriveIdentity).toBe(true);
    expect(comparison.allRunsPeriod1AndIntegrated).toBe(false);
    expect(comparison.rankByMacroRestorationDistance).toHaveLength(3);
    expect(comparison.rankByGuardrailDistance).toHaveLength(3);
    expect(comparison.claim).toMatchObject({
      clinicalTargetsApplied: false,
      parameterOptimizationOrFitApplied: false,
      candidateRankingIsClinicalValidation: false,
      canonicalAdoptionEstablished: false,
    });
    expect(candidates.every((run) =>
      run.claim.genericParameterPatchAccepted === false
      && run.claim.numericTargetOptimizationApplied === false)).toBe(true);
    expect(() =>
      compareMainWireVentricularCalciumSourceTraceFitRecalibrationCandidatesV1(
        canonical.periodicResult,
        source.periodicResult,
        [{
          candidateId: candidates[0]!.candidate.candidateId,
          periodicResult: candidates[0]!.periodicResult,
        }],
        GEOMETRY,
      )).toThrow("requires 3 candidates");
  }, 60_000);

  it("defines a complete fixed ventricular Tref/passive factorial", () => {
    expect(MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_TREF_PASSIVE_PROFILES_V1)
      .toHaveLength(
        MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_TREF_LEVELS_V1.length
        * MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_PASSIVE_LEVELS_V1.length,
      );
    expect(new Set(
      MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_TREF_PASSIVE_PROFILES_V1
        .map((profile) => `${profile.ventricularLandTrefScaleFromBaseline}/${
          profile.ventricularEquilibriumPassiveScaleFromBaseline}`),
    ).size).toBe(12);
    for (const profile of
      MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_TREF_PASSIVE_PROFILES_V1) {
      const input =
        resolveMainWireVentricularCalciumSourceTraceFitTrefPassiveMechanicsInputV1(
          profile.profileId,
        );
      expect(Object.isFrozen(profile)).toBe(true);
      expect(Object.isFrozen(input)).toBe(true);
      expect(input.activeTensionScaleByWall).toMatchObject({
        LA: 1,
        RA: 1,
        LVFW: profile.ventricularLandTrefScaleFromBaseline,
        SEP: profile.ventricularLandTrefScaleFromBaseline,
        RVFW: profile.ventricularLandTrefScaleFromBaseline,
      });
      expect(input.passiveStiffnessScaleByWall).toMatchObject({
        LA: 1,
        RA: 1,
        LVFW: profile.ventricularEquilibriumPassiveScaleFromBaseline,
        SEP: profile.ventricularEquilibriumPassiveScaleFromBaseline,
        RVFW: profile.ventricularEquilibriumPassiveScaleFromBaseline,
      });
      expect(Object.values(input.calciumDecayTimeScaleByWall)
        .every((scale) => scale === 1)).toBe(true);
      expect(profile.claim).toMatchObject({
        fixedProfileNotGenericPatch: true,
        ventricularCalciumDriveChanged: false,
        fixedTotalBloodVolumeChanged: false,
        aorticValveAreaOrLawChanged: false,
      });
    }
  });

  it("measures the fixed factorial as three separate Pareto objectives", () => {
    const options = { dtSec: 0.02, maximumBeatCount: 1 } as const;
    const canonical =
      runMainWireNormalAdultFiveWallVentricularCalciumSourceConstrainedResearchV1(
        options,
        "canonical",
      );
    const runs =
      MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_TREF_PASSIVE_PROFILES_V1
        .map((profile) =>
          runMainWireNormalAdultFiveWallVentricularCalciumSourceTraceFitTrefPassiveResearchV1(
            options,
            profile.profileId,
          ));
    const inputs = runs.map((run) => ({
      profileId: run.profile.profileId,
      periodicResult: run.periodicResult,
    }));
    const measured =
      analyzeMainWireVentricularCalciumSourceTraceFitTrefPassiveParetoV1(
        canonical.periodicResult,
        inputs,
        GEOMETRY,
      );

    expect(measured.arms).toHaveLength(12);
    expect(measured.sourceGridArmsShareCalciumDriveIdentity).toBe(true);
    expect(measured.canonicalAndSourceCalciumDriveIdentitiesAreDistinct)
      .toBe(true);
    expect(measured.allRunsPeriod1AndIntegrated).toBe(false);
    expect(measured.interpretationEligible).toBe(false);
    expect(measured.paretoProfileIds.length).toBeGreaterThan(0);
    expect(measured.rankByMacroRestorationDistance).toHaveLength(12);
    expect(measured.rankByFillingPressureDistance).toHaveLength(12);
    expect(measured.rankByOutflowShapeDistance).toHaveLength(12);
    expect(measured.arms.every((arm) =>
      Object.values(arm.objectives).every(Number.isFinite)
      && Number.isFinite(arm.ejectionConcentrationIndex)
      && arm.readback.observationStations.timeMeanGradientMmHg
        .simplifiedDoppler
        > arm.readback.observationStations.timeMeanGradientMmHg
          .proximalVelocityCorrectedDoppler)).toBe(true);
    expect(runs.every((run) =>
      run.claim.genericParameterPatchAccepted === false
      && run.claim.fixedTotalBloodVolumeChanged === false
      && run.claim.aorticValveAreaOrLawChanged === false)).toBe(true);
    expect(() =>
      analyzeMainWireVentricularCalciumSourceTraceFitTrefPassiveParetoV1(
        canonical.periodicResult,
        inputs.slice(1),
        GEOMETRY,
      )).toThrow("requires 12 arms");
    expect(() =>
      analyzeMainWireVentricularCalciumSourceTraceFitTrefPassiveParetoV1(
        canonical.periodicResult,
        [inputs[0]!, ...inputs.slice(0, -1)],
        GEOMETRY,
      )).toThrow("duplicate");
  }, 60_000);

  it("pairs each post-Pareto arm with only the existing Land distortion transient", () => {
    const options = { dtSec: 0.02, maximumBeatCount: 1 } as const;
    const canonical =
      runMainWireNormalAdultFiveWallVentricularCalciumSourceConstrainedResearchV1(
        options,
        "canonical",
      );
    const pairs =
      MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_TREF_PASSIVE_DISTORTION_CANDIDATES_V1
        .map((candidate) => ({
          candidate,
          baseline:
            runMainWireNormalAdultFiveWallVentricularCalciumSourceTraceFitTrefPassiveResearchV1(
              options,
              candidate.pairedBaselineProfileId,
            ),
          distortion:
            runMainWireNormalAdultFiveWallVentricularCalciumSourceTraceFitTrefPassiveDistortionResearchV1(
              options,
              candidate.candidateId,
            ),
        }));
    const measured =
      compareMainWireVentricularCalciumSourceTraceFitTrefPassiveDistortionCandidatesV1(
        canonical.periodicResult,
        pairs.map((pair) => ({
          candidateId: pair.candidate.candidateId,
          pairedBaselineResult: pair.baseline.periodicResult,
          distortionResult: pair.distortion.periodicResult,
        })),
        GEOMETRY,
      );

    expect(measured.arms).toHaveLength(6);
    expect(measured.allSourceRunsShareCalciumDriveIdentity).toBe(true);
    expect(measured.allPairsHaveDistinctMechanicsProviderIdentity).toBe(true);
    expect(measured.allPairsShareNonMechanicsProtocolComponents).toBe(true);
    expect(measured.allRunsPeriod1AndIntegrated).toBe(false);
    expect(measured.interpretationEligible).toBe(false);
    expect(measured.rankByDistortionEqualWeightThreeObjectiveDistance)
      .toHaveLength(6);
    expect(pairs.every((pair) =>
      pair.candidate.commonVentricularLandAeffScaleFromBaseline === 4 / 3
      && pair.candidate.commonVentricularLandPhiScaleFromBaseline === 4 / 3
      && pair.distortion.claim.genericParameterPatchAccepted === false
      && pair.distortion.claim.calciumOrMechanicsStateAdded === false
      && pair.baseline.periodicResult.protocolIdentity.mechanicsProvider
        .stateSchemaVersion
        === pair.distortion.periodicResult.protocolIdentity.mechanicsProvider
          .stateSchemaVersion)).toBe(true);
    expect(measured.arms.every((arm) =>
      Object.values(arm.objectiveAbsoluteDeltaFromPairedBaseline)
        .every(Number.isFinite)
      && arm.distortionEvaluation.ejectionConcentrationIndex
        < arm.pairedBaselineEvaluation.ejectionConcentrationIndex)).toBe(true);
    expect(measured.claim).toMatchObject({
      existingLandDistortionStateReused: true,
      newValveStateOrLocalInertanceAdded: false,
      parameterOptimizationOrFitApplied: false,
      candidateAdoptionEstablished: false,
    });
    expect(() =>
      compareMainWireVentricularCalciumSourceTraceFitTrefPassiveDistortionCandidatesV1(
        canonical.periodicResult,
        pairs.slice(1).map((pair) => ({
          candidateId: pair.candidate.candidateId,
          pairedBaselineResult: pair.baseline.periodicResult,
          distortionResult: pair.distortion.periodicResult,
        })),
        GEOMETRY,
      )).toThrow("requires 6 candidates");
  }, 60_000);
});
