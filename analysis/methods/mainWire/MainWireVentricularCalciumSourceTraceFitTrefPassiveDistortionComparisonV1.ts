import type {
  MainWireAorticValveObservationGeometryV1,
} from "@/analysis/methods/mainWire/MainWireAorticValveObservationStationsV1";
import {
  MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_RECALIBRATION_OBSERVABLE_IDS_V1,
  measureMainWireVentricularCalciumSourceTraceFitRecalibrationReadbackV1,
  type MainWireVentricularCalciumSourceTraceFitRecalibrationObservableRecordV1,
  type MainWireVentricularCalciumSourceTraceFitRecalibrationReadbackV1,
} from "@/analysis/methods/mainWire/MainWireVentricularCalciumSourceTraceFitRecalibrationSensitivityV1";
import {
  evaluateMainWireVentricularCalciumSourceTraceFitTrefPassiveObjectivesV1,
  type MainWireVentricularCalciumSourceTraceFitTrefPassiveObjectiveEvaluationV1,
  type MainWireVentricularCalciumSourceTraceFitTrefPassiveObjectivesV1,
} from "@/analysis/methods/mainWire/MainWireVentricularCalciumSourceTraceFitTrefPassiveParetoV1";
import {
  FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
} from "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";
import {
  resolveMainWireVentricularCalciumSourceTraceFitParamsV1,
} from "@/engine/myocardium/calcium/MainWireVentricularCalciumSourceTraceFitPriorV1";
import {
  MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_TREF_PASSIVE_DISTORTION_CANDIDATE_IDS_V1,
  resolveMainWireVentricularCalciumSourceTraceFitTrefPassiveDistortionCandidateV1,
  type MainWireVentricularCalciumSourceTraceFitTrefPassiveDistortionCandidateIdV1,
  type MainWireVentricularCalciumSourceTraceFitTrefPassiveDistortionCandidateV1,
} from "@/engine/myocardium/experiments/MainWireVentricularCalciumSourceTraceFitTrefPassiveDistortionCandidatesV1";
import type {
  MainWireNormalAdultFiveWallPeriodicResultV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";

export const MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_TREF_PASSIVE_DISTORTION_COMPARISON_V1_ID =
  "main-wire-ventricular-calcium-source-trace-fit-tref-passive-distortion-comparison-v1" as const;

const OBJECTIVE_KEYS = Object.freeze([
  "macroRestorationRmsRelativeDistanceToCanonical",
  "fillingPressureRmsRelativeDistanceToCanonical",
  "outflowShapeRmsRelativeDistanceToCanonical",
] as const);

type ParetoObjectiveKeyV1 = (typeof OBJECTIVE_KEYS)[number];

export const MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_TREF_PASSIVE_DISTORTION_COMPARISON_CLAIM_V1 =
  Object.freeze({
    source: "independent-cold-start-last-retained-complete-beat" as const,
    exactFrameMutation: false as const,
    exactModelFeedback: false as const,
    candidateSet:
      "six-predeclared-post-fixed-grid-pareto-arms" as const,
    pairedDifference:
      "proportional-four-thirds-Land-Aeff-and-phi-only" as const,
    existingLandDistortionStateReused: true as const,
    newValveStateOrLocalInertanceAdded: false as const,
    constantStrainRateZetaGainPreserved: true as const,
    quickTransientResponsePreserved: false as const,
    canonicalControlRole:
      "prior-macro-phenotype-reference-not-clinical-ground-truth" as const,
    threeObjectivesKeptSeparate: true as const,
    equalWeightCompositeIsDiagnosticNotClinicalUtility: true as const,
    measurementCovarianceApplied: false as const,
    clinicalTargetsApplied: false as const,
    parameterOptimizationOrFitApplied: false as const,
    gradientsExcludedFromObjectivesToAvoidDuplicateFixedEoaFlowWeighting:
      true as const,
    aorticGradientStationsKeptDistinct: true as const,
    pressureRecoveryFeedsBackIntoExactModel: false as const,
    smoothingApplied: false as const,
    interpolationApplied: false as const,
    candidateAdoptionEstablished: false as const,
  });

export type MainWireVentricularCalciumSourceTraceFitTrefPassiveDistortionComparisonInputV1 =
  Readonly<{
    candidateId:
      MainWireVentricularCalciumSourceTraceFitTrefPassiveDistortionCandidateIdV1;
    pairedBaselineResult: MainWireNormalAdultFiveWallPeriodicResultV1;
    distortionResult: MainWireNormalAdultFiveWallPeriodicResultV1;
  }>;

export type MainWireVentricularCalciumSourceTraceFitTrefPassiveDistortionObjectiveDeltaV1 =
  Readonly<Record<keyof MainWireVentricularCalciumSourceTraceFitTrefPassiveObjectivesV1, number>>;

export type MainWireVentricularCalciumSourceTraceFitTrefPassiveDistortionComparisonArmV1 =
  Readonly<{
    candidate:
      MainWireVentricularCalciumSourceTraceFitTrefPassiveDistortionCandidateV1;
    pairedBaselineReadback:
      MainWireVentricularCalciumSourceTraceFitRecalibrationReadbackV1;
    distortionReadback:
      MainWireVentricularCalciumSourceTraceFitRecalibrationReadbackV1;
    pairedBaselineEvaluation:
      MainWireVentricularCalciumSourceTraceFitTrefPassiveObjectiveEvaluationV1;
    distortionEvaluation:
      MainWireVentricularCalciumSourceTraceFitTrefPassiveObjectiveEvaluationV1;
    distortionRelativeDifferenceFromPairedBaseline:
      MainWireVentricularCalciumSourceTraceFitRecalibrationObservableRecordV1;
    distortionLeftVentricularEndDiastolicPressureRelativeDifferenceFromPairedBaseline:
      number;
    distortionEjectionConcentrationIndexRelativeDifferenceFromPairedBaseline:
      number;
    objectiveAbsoluteDeltaFromPairedBaseline:
      MainWireVentricularCalciumSourceTraceFitTrefPassiveDistortionObjectiveDeltaV1;
    objectiveFractionalDeltaFromPairedBaseline:
      MainWireVentricularCalciumSourceTraceFitTrefPassiveDistortionObjectiveDeltaV1;
    improvedObjectiveKeys: readonly ParetoObjectiveKeyV1[];
    worsenedObjectiveKeys: readonly ParetoObjectiveKeyV1[];
    dominatesPairedBaselineAcrossThreeObjectives: boolean;
  }>;

export type MainWireVentricularCalciumSourceTraceFitTrefPassiveDistortionComparisonV1 =
  Readonly<{
    methodId:
      typeof MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_TREF_PASSIVE_DISTORTION_COMPARISON_V1_ID;
    geometry: MainWireAorticValveObservationGeometryV1;
    canonicalControl:
      MainWireVentricularCalciumSourceTraceFitRecalibrationReadbackV1;
    arms:
      readonly MainWireVentricularCalciumSourceTraceFitTrefPassiveDistortionComparisonArmV1[];
    candidatesDominatingPairedBaseline:
      readonly MainWireVentricularCalciumSourceTraceFitTrefPassiveDistortionCandidateIdV1[];
    rankByDistortionEqualWeightThreeObjectiveDistance:
      readonly MainWireVentricularCalciumSourceTraceFitTrefPassiveDistortionCandidateIdV1[];
    allSourceRunsShareCalciumDriveIdentity: boolean;
    allPairsHaveDistinctMechanicsProviderIdentity: boolean;
    allPairsShareNonMechanicsProtocolComponents: boolean;
    allRunsPeriod1AndIntegrated: boolean;
    interpretationEligible: boolean;
    claim:
      typeof MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_TREF_PASSIVE_DISTORTION_COMPARISON_CLAIM_V1;
  }>;

export function compareMainWireVentricularCalciumSourceTraceFitTrefPassiveDistortionCandidatesV1(
  canonicalControlResult: MainWireNormalAdultFiveWallPeriodicResultV1,
  inputs:
    readonly MainWireVentricularCalciumSourceTraceFitTrefPassiveDistortionComparisonInputV1[],
  geometry: MainWireAorticValveObservationGeometryV1,
): MainWireVentricularCalciumSourceTraceFitTrefPassiveDistortionComparisonV1 {
  const byId = new Map<
    MainWireVentricularCalciumSourceTraceFitTrefPassiveDistortionCandidateIdV1,
    MainWireVentricularCalciumSourceTraceFitTrefPassiveDistortionComparisonInputV1
  >();
  for (const input of inputs) {
    if (byId.has(input.candidateId)) {
      throw new Error(`duplicate Tref/passive distortion candidate: ${input.candidateId}`);
    }
    byId.set(input.candidateId, input);
  }
  if (byId.size
    !== MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_TREF_PASSIVE_DISTORTION_CANDIDATE_IDS_V1.length) {
    throw new Error(
      `Tref/passive distortion comparison requires ${
        MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_TREF_PASSIVE_DISTORTION_CANDIDATE_IDS_V1.length
      } candidates`,
    );
  }
  const dtSec = canonicalControlResult.dtSec;
  if (inputs.some((input) => input.pairedBaselineResult.dtSec !== dtSec
    || input.distortionResult.dtSec !== dtSec)) {
    throw new Error("Tref/passive distortion comparison requires one common dt");
  }
  const canonicalControl =
    measureMainWireVentricularCalciumSourceTraceFitRecalibrationReadbackV1(
      canonicalControlResult,
      FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
      "canonical-control",
      geometry,
    );
  const sourceCalcium =
    resolveMainWireVentricularCalciumSourceTraceFitParamsV1();
  const arms = Object.freeze(
    MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_TREF_PASSIVE_DISTORTION_CANDIDATE_IDS_V1
      .map((candidateId) => {
        const input = byId.get(candidateId);
        if (input === undefined) {
          throw new Error(`missing Tref/passive distortion candidate: ${candidateId}`);
        }
        const candidate =
          resolveMainWireVentricularCalciumSourceTraceFitTrefPassiveDistortionCandidateV1(
            candidateId,
          );
        const pairedBaselineReadback =
          measureMainWireVentricularCalciumSourceTraceFitRecalibrationReadbackV1(
            input.pairedBaselineResult,
            sourceCalcium,
            candidate.pairedBaselineProfileId,
            geometry,
          );
        const distortionReadback =
          measureMainWireVentricularCalciumSourceTraceFitRecalibrationReadbackV1(
            input.distortionResult,
            sourceCalcium,
            candidateId,
            geometry,
          );
        const pairedBaselineEvaluation =
          evaluateMainWireVentricularCalciumSourceTraceFitTrefPassiveObjectivesV1(
            pairedBaselineReadback,
            canonicalControl,
            candidate.pairedBaselineProfileId,
          );
        const distortionEvaluation =
          evaluateMainWireVentricularCalciumSourceTraceFitTrefPassiveObjectivesV1(
            distortionReadback,
            canonicalControl,
            candidateId,
          );
        const objectiveAbsoluteDeltaFromPairedBaseline = objectiveDelta(
          distortionEvaluation.objectives,
          pairedBaselineEvaluation.objectives,
          false,
        );
        const objectiveFractionalDeltaFromPairedBaseline = objectiveDelta(
          distortionEvaluation.objectives,
          pairedBaselineEvaluation.objectives,
          true,
        );
        const improvedObjectiveKeys = Object.freeze(OBJECTIVE_KEYS.filter(
          (key) => objectiveAbsoluteDeltaFromPairedBaseline[key] < 0,
        ));
        const worsenedObjectiveKeys = Object.freeze(OBJECTIVE_KEYS.filter(
          (key) => objectiveAbsoluteDeltaFromPairedBaseline[key] > 0,
        ));
        return Object.freeze({
          candidate,
          pairedBaselineReadback,
          distortionReadback,
          pairedBaselineEvaluation,
          distortionEvaluation,
          distortionRelativeDifferenceFromPairedBaseline: relativeRecord(
            distortionReadback.svdObservableValues,
            pairedBaselineReadback.svdObservableValues,
          ),
          distortionLeftVentricularEndDiastolicPressureRelativeDifferenceFromPairedBaseline:
            relativeDifference(
              distortionReadback.fillingAndPressureReadback
                .leftVentricularEndDiastolicAbsolutePressureMmHg,
              pairedBaselineReadback.fillingAndPressureReadback
                .leftVentricularEndDiastolicAbsolutePressureMmHg,
              "paired LVEDP",
            ),
          distortionEjectionConcentrationIndexRelativeDifferenceFromPairedBaseline:
            distortionEvaluation.ejectionConcentrationIndex
              / pairedBaselineEvaluation.ejectionConcentrationIndex - 1,
          objectiveAbsoluteDeltaFromPairedBaseline,
          objectiveFractionalDeltaFromPairedBaseline,
          improvedObjectiveKeys,
          worsenedObjectiveKeys,
          dominatesPairedBaselineAcrossThreeObjectives:
            improvedObjectiveKeys.length > 0 && worsenedObjectiveKeys.length === 0,
        });
      }),
  );
  const allSourceReadbacks = arms.flatMap((arm) => [
    arm.pairedBaselineReadback,
    arm.distortionReadback,
  ]);
  const allSourceRunsShareCalciumDriveIdentity = new Set(
    allSourceReadbacks.map((readback) =>
      readback.calciumDriveFixedParamsStableHash),
  ).size === 1;
  const allPairsHaveDistinctMechanicsProviderIdentity = inputs.every((input) =>
    input.pairedBaselineResult.protocolIdentity.mechanicsProvider
      .parameterIdentityHash
      !== input.distortionResult.protocolIdentity.mechanicsProvider
        .parameterIdentityHash);
  const allPairsShareNonMechanicsProtocolComponents = inputs.every((input) =>
    sameNonMechanicsProtocol(input.pairedBaselineResult, input.distortionResult));
  const allRunsPeriod1AndIntegrated = [
    canonicalControl,
    ...allSourceReadbacks,
  ].every((readback) => readback.periodicSteadyStateClaimed
    && readback.integrationCompletedWithoutFailure);
  return Object.freeze({
    methodId:
      MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_TREF_PASSIVE_DISTORTION_COMPARISON_V1_ID,
    geometry: Object.freeze({ ...geometry }),
    canonicalControl,
    arms,
    candidatesDominatingPairedBaseline: Object.freeze(arms
      .filter((arm) => arm.dominatesPairedBaselineAcrossThreeObjectives)
      .map((arm) => arm.candidate.candidateId)),
    rankByDistortionEqualWeightThreeObjectiveDistance: Object.freeze([...arms]
      .sort((left, right) =>
        left.distortionEvaluation.objectives
          .equalWeightThreeObjectiveRmsDistanceToCanonical
        - right.distortionEvaluation.objectives
          .equalWeightThreeObjectiveRmsDistanceToCanonical)
      .map((arm) => arm.candidate.candidateId)),
    allSourceRunsShareCalciumDriveIdentity,
    allPairsHaveDistinctMechanicsProviderIdentity,
    allPairsShareNonMechanicsProtocolComponents,
    allRunsPeriod1AndIntegrated,
    interpretationEligible:
      allSourceRunsShareCalciumDriveIdentity
      && allPairsHaveDistinctMechanicsProviderIdentity
      && allPairsShareNonMechanicsProtocolComponents
      && allRunsPeriod1AndIntegrated,
    claim:
      MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_TREF_PASSIVE_DISTORTION_COMPARISON_CLAIM_V1,
  });
}

function objectiveDelta(
  value: MainWireVentricularCalciumSourceTraceFitTrefPassiveObjectivesV1,
  baseline: MainWireVentricularCalciumSourceTraceFitTrefPassiveObjectivesV1,
  fractional: boolean,
): MainWireVentricularCalciumSourceTraceFitTrefPassiveDistortionObjectiveDeltaV1 {
  return Object.freeze(Object.fromEntries(
    [...OBJECTIVE_KEYS, "equalWeightThreeObjectiveRmsDistanceToCanonical"]
      .map((key) => [
        key,
        fractional
          ? relativeDifference(value[key], baseline[key], key)
          : value[key] - baseline[key],
      ]),
  )) as MainWireVentricularCalciumSourceTraceFitTrefPassiveDistortionObjectiveDeltaV1;
}

function relativeRecord(
  value: MainWireVentricularCalciumSourceTraceFitRecalibrationObservableRecordV1,
  baseline: MainWireVentricularCalciumSourceTraceFitRecalibrationObservableRecordV1,
): MainWireVentricularCalciumSourceTraceFitRecalibrationObservableRecordV1 {
  return Object.freeze(Object.fromEntries(
    MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_RECALIBRATION_OBSERVABLE_IDS_V1
      .map((id) => [id, relativeDifference(value[id], baseline[id], id)]),
  )) as MainWireVentricularCalciumSourceTraceFitRecalibrationObservableRecordV1;
}

function relativeDifference(
  value: number,
  baseline: number,
  label: string,
): number {
  if (!Number.isFinite(value) || !Number.isFinite(baseline)
    || Math.abs(baseline) <= 1e-12) {
    throw new Error(`${label} requires finite values and a nonzero baseline`);
  }
  return value / baseline - 1;
}

function sameNonMechanicsProtocol(
  baseline: MainWireNormalAdultFiveWallPeriodicResultV1,
  distortion: MainWireNormalAdultFiveWallPeriodicResultV1,
): boolean {
  const left = baseline.protocolComponentHashes;
  const right = distortion.protocolComponentHashes;
  return left.calciumDriveFixedParamsStableHash
      === right.calciumDriveFixedParamsStableHash
    && left.circulationTopologyGraphStableHash
      === right.circulationTopologyGraphStableHash
    && left.circulationRuntimeStableHash === right.circulationRuntimeStableHash
    && left.bloodVolumeOperatingPointStableHash
      === right.bloodVolumeOperatingPointStableHash
    && left.commonPericardiumStableHash === right.commonPericardiumStableHash
    && left.periodicPolicyStableHash === right.periodicPolicyStableHash
    && baseline.protocolIdentity.circulation.valveResearchInputStableHash
      === distortion.protocolIdentity.circulation.valveResearchInputStableHash;
}
