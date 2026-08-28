import type {
  MainWireAorticValveObservationGeometryV1,
} from "@/analysis/methods/mainWire/MainWireAorticValveObservationStationsV1";
import {
  MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_RECALIBRATION_OBSERVABLE_IDS_V1,
  measureMainWireVentricularCalciumSourceTraceFitRecalibrationReadbackV1,
  type MainWireVentricularCalciumSourceTraceFitRecalibrationObservableIdV1,
  type MainWireVentricularCalciumSourceTraceFitRecalibrationObservableRecordV1,
  type MainWireVentricularCalciumSourceTraceFitRecalibrationReadbackV1,
} from "@/analysis/methods/mainWire/MainWireVentricularCalciumSourceTraceFitRecalibrationSensitivityV1";
import {
  FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
} from "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";
import {
  resolveMainWireVentricularCalciumSourceTraceFitParamsV1,
} from "@/engine/myocardium/calcium/MainWireVentricularCalciumSourceTraceFitPriorV1";
import {
  MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_RECALIBRATION_CANDIDATE_IDS_V1,
  resolveMainWireVentricularCalciumSourceTraceFitRecalibrationCandidateV1,
  type MainWireVentricularCalciumSourceTraceFitRecalibrationCandidateIdV1,
  type MainWireVentricularCalciumSourceTraceFitRecalibrationCandidateV1,
} from "@/engine/myocardium/experiments/MainWireVentricularCalciumSourceTraceFitRecalibrationCandidatesV1";
import type {
  MainWireNormalAdultFiveWallPeriodicResultV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";

export const MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_RECALIBRATION_CANDIDATE_COMPARISON_V1_ID =
  "main-wire-ventricular-calcium-source-trace-fit-recalibration-candidate-comparison-v1" as const;

export const MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_RECALIBRATION_MACRO_RESTORATION_OBSERVABLE_IDS_V1 =
  Object.freeze([
    "aortic-forward-volume",
    "mean-aortic-pressure",
    "left-ventricular-ejection-fraction",
    "peak-left-ventricular-pressure",
    "left-ventricular-end-diastolic-volume",
  ] as const satisfies readonly MainWireVentricularCalciumSourceTraceFitRecalibrationObservableIdV1[]);

export const MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_RECALIBRATION_GUARDRAIL_OBSERVABLE_IDS_V1 =
  Object.freeze([
    "aortic-ejection-time",
    "aortic-maximum-flow",
    "mean-left-atrial-absolute-pressure",
    "mean-pulmonary-vein-absolute-pressure",
    "mean-central-venous-absolute-pressure",
  ] as const satisfies readonly MainWireVentricularCalciumSourceTraceFitRecalibrationObservableIdV1[]);

export const MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_RECALIBRATION_CANDIDATE_COMPARISON_CLAIM_V1 =
  Object.freeze({
    source: "independent-cold-start-last-retained-complete-beat" as const,
    exactFrameMutation: false as const,
    exactModelFeedback: false as const,
    candidateGrid:
      "three-predeclared-post-SVD-corners-no-continuous-search" as const,
    canonicalControlRole:
      "prior-macro-phenotype-reference-not-clinical-ground-truth" as const,
    distanceDefinition:
      "unweighted-rms-relative-to-canonical-control" as const,
    macroAndGuardrailDistancesReportedSeparately: true as const,
    measurementCovarianceApplied: false as const,
    clinicalTargetsApplied: false as const,
    parameterOptimizationOrFitApplied: false as const,
    candidateRankingIsClinicalValidation: false as const,
    aorticGradientStationsKeptDistinct: true as const,
    pressureRecoveryFeedsBackIntoExactModel: false as const,
    smoothingApplied: false as const,
    interpolationApplied: false as const,
    canonicalAdoptionEstablished: false as const,
  });

export type MainWireVentricularCalciumSourceTraceFitRecalibrationCandidateInputV1 =
  Readonly<{
    candidateId:
      MainWireVentricularCalciumSourceTraceFitRecalibrationCandidateIdV1;
    periodicResult: MainWireNormalAdultFiveWallPeriodicResultV1;
  }>;

export type MainWireVentricularCalciumSourceTraceFitRecalibrationCandidateArmV1 =
  Readonly<{
    candidate:
      MainWireVentricularCalciumSourceTraceFitRecalibrationCandidateV1;
    readback:
      MainWireVentricularCalciumSourceTraceFitRecalibrationReadbackV1;
    relativeDifferenceFromCanonical:
      MainWireVentricularCalciumSourceTraceFitRecalibrationObservableRecordV1;
    relativeDifferenceFromSourceBaseline:
      MainWireVentricularCalciumSourceTraceFitRecalibrationObservableRecordV1;
    absoluteCanonicalErrorReductionFractionByObservable:
      Readonly<Record<
        MainWireVentricularCalciumSourceTraceFitRecalibrationObservableIdV1,
        number | null
      >>;
    observableCountCloserToCanonicalThanSourceBaseline: number;
    macroRestorationRmsRelativeDistanceToCanonical: number;
    guardrailRmsRelativeDistanceToCanonical: number;
    allObservableRmsRelativeDistanceToCanonical: number;
  }>;

export type MainWireVentricularCalciumSourceTraceFitRecalibrationCandidateComparisonV1 =
  Readonly<{
    methodId:
      typeof MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_RECALIBRATION_CANDIDATE_COMPARISON_V1_ID;
    geometry: MainWireAorticValveObservationGeometryV1;
    canonicalControl:
      MainWireVentricularCalciumSourceTraceFitRecalibrationReadbackV1;
    sourceBaseline:
      MainWireVentricularCalciumSourceTraceFitRecalibrationReadbackV1;
    sourceBaselineRelativeDifferenceFromCanonical:
      MainWireVentricularCalciumSourceTraceFitRecalibrationObservableRecordV1;
    sourceBaselineDistance: Readonly<{
      macroRestorationRmsRelativeDistanceToCanonical: number;
      guardrailRmsRelativeDistanceToCanonical: number;
      allObservableRmsRelativeDistanceToCanonical: number;
    }>;
    candidates:
      readonly MainWireVentricularCalciumSourceTraceFitRecalibrationCandidateArmV1[];
    sourceAndCandidatesShareCalciumDriveIdentity: boolean;
    allRunsPeriod1AndIntegrated: boolean;
    interpretationEligible: boolean;
    rankByMacroRestorationDistance:
      readonly MainWireVentricularCalciumSourceTraceFitRecalibrationCandidateIdV1[];
    rankByGuardrailDistance:
      readonly MainWireVentricularCalciumSourceTraceFitRecalibrationCandidateIdV1[];
    claim:
      typeof MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_RECALIBRATION_CANDIDATE_COMPARISON_CLAIM_V1;
  }>;

export function compareMainWireVentricularCalciumSourceTraceFitRecalibrationCandidatesV1(
  canonicalControlResult: MainWireNormalAdultFiveWallPeriodicResultV1,
  sourceBaselineResult: MainWireNormalAdultFiveWallPeriodicResultV1,
  candidateInputs:
    readonly MainWireVentricularCalciumSourceTraceFitRecalibrationCandidateInputV1[],
  geometry: MainWireAorticValveObservationGeometryV1,
): MainWireVentricularCalciumSourceTraceFitRecalibrationCandidateComparisonV1 {
  const byId = new Map<
    MainWireVentricularCalciumSourceTraceFitRecalibrationCandidateIdV1,
    MainWireVentricularCalciumSourceTraceFitRecalibrationCandidateInputV1
  >();
  for (const input of candidateInputs) {
    if (byId.has(input.candidateId)) {
      throw new Error(`duplicate recalibration candidate: ${input.candidateId}`);
    }
    byId.set(input.candidateId, input);
  }
  if (byId.size !==
    MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_RECALIBRATION_CANDIDATE_IDS_V1.length) {
    throw new Error(
      `recalibration candidate comparison requires ${
        MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_RECALIBRATION_CANDIDATE_IDS_V1.length
      } candidates`,
    );
  }
  const dtSec = canonicalControlResult.dtSec;
  if (sourceBaselineResult.dtSec !== dtSec
    || candidateInputs.some((input) => input.periodicResult.dtSec !== dtSec)) {
    throw new Error("recalibration candidate comparison requires one common dt");
  }
  const canonicalControl =
    measureMainWireVentricularCalciumSourceTraceFitRecalibrationReadbackV1(
      canonicalControlResult,
      FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
      "canonical-control",
      geometry,
    );
  const sourceBaseline =
    measureMainWireVentricularCalciumSourceTraceFitRecalibrationReadbackV1(
      sourceBaselineResult,
      resolveMainWireVentricularCalciumSourceTraceFitParamsV1(),
      "source-whole-trace-alpha-fit-baseline",
      geometry,
    );
  const sourceBaselineRelativeDifferenceFromCanonical = relativeRecord(
    sourceBaseline.svdObservableValues,
    canonicalControl.svdObservableValues,
  );
  const sourceBaselineDistance = distances(
    sourceBaselineRelativeDifferenceFromCanonical,
  );
  const candidates = Object.freeze(
    MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_RECALIBRATION_CANDIDATE_IDS_V1
      .map((candidateId) => {
        const input = byId.get(candidateId);
        if (input === undefined) {
          throw new Error(`missing recalibration candidate: ${candidateId}`);
        }
        const candidate =
          resolveMainWireVentricularCalciumSourceTraceFitRecalibrationCandidateV1(
            candidateId,
          );
        const readback =
          measureMainWireVentricularCalciumSourceTraceFitRecalibrationReadbackV1(
            input.periodicResult,
            resolveMainWireVentricularCalciumSourceTraceFitParamsV1(),
            candidateId,
            geometry,
          );
        const relativeDifferenceFromCanonical = relativeRecord(
          readback.svdObservableValues,
          canonicalControl.svdObservableValues,
        );
        const relativeDifferenceFromSourceBaseline = relativeRecord(
          readback.svdObservableValues,
          sourceBaseline.svdObservableValues,
        );
        const absoluteCanonicalErrorReductionFractionByObservable =
          Object.freeze(Object.fromEntries(
            MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_RECALIBRATION_OBSERVABLE_IDS_V1
              .map((observableId) => {
                const sourceError = Math.abs(
                  sourceBaselineRelativeDifferenceFromCanonical[observableId],
                );
                const candidateError = Math.abs(
                  relativeDifferenceFromCanonical[observableId],
                );
                return [observableId, sourceError === 0
                  ? null
                  : 1 - candidateError / sourceError];
              }),
          )) as Readonly<Record<
            MainWireVentricularCalciumSourceTraceFitRecalibrationObservableIdV1,
            number | null
          >>;
        const distance = distances(relativeDifferenceFromCanonical);
        return Object.freeze({
          candidate,
          readback,
          relativeDifferenceFromCanonical,
          relativeDifferenceFromSourceBaseline,
          absoluteCanonicalErrorReductionFractionByObservable,
          observableCountCloserToCanonicalThanSourceBaseline:
            MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_RECALIBRATION_OBSERVABLE_IDS_V1
              .filter((observableId) =>
                Math.abs(relativeDifferenceFromCanonical[observableId])
                  < Math.abs(
                    sourceBaselineRelativeDifferenceFromCanonical[observableId],
                  )).length,
          ...distance,
        });
      }),
  );
  const sourceAndCandidatesShareCalciumDriveIdentity = new Set([
    sourceBaseline.calciumDriveFixedParamsStableHash,
    ...candidates.map((candidate) =>
      candidate.readback.calciumDriveFixedParamsStableHash),
  ]).size === 1;
  const allReadbacks = [
    canonicalControl,
    sourceBaseline,
    ...candidates.map((candidate) => candidate.readback),
  ];
  const allRunsPeriod1AndIntegrated = allReadbacks.every((readback) =>
    readback.periodicSteadyStateClaimed
    && readback.integrationCompletedWithoutFailure);
  const rank = (
    select: (
      candidate:
        MainWireVentricularCalciumSourceTraceFitRecalibrationCandidateArmV1,
    ) => number,
  ) => Object.freeze([...candidates]
    .sort((left, right) => select(left) - select(right))
    .map((candidate) => candidate.candidate.candidateId));
  return Object.freeze({
    methodId:
      MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_RECALIBRATION_CANDIDATE_COMPARISON_V1_ID,
    geometry: Object.freeze({ ...geometry }),
    canonicalControl,
    sourceBaseline,
    sourceBaselineRelativeDifferenceFromCanonical,
    sourceBaselineDistance,
    candidates,
    sourceAndCandidatesShareCalciumDriveIdentity,
    allRunsPeriod1AndIntegrated,
    interpretationEligible:
      sourceAndCandidatesShareCalciumDriveIdentity
      && allRunsPeriod1AndIntegrated,
    rankByMacroRestorationDistance: rank((candidate) =>
      candidate.macroRestorationRmsRelativeDistanceToCanonical),
    rankByGuardrailDistance: rank((candidate) =>
      candidate.guardrailRmsRelativeDistanceToCanonical),
    claim:
      MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_RECALIBRATION_CANDIDATE_COMPARISON_CLAIM_V1,
  });
}

function relativeRecord(
  value: MainWireVentricularCalciumSourceTraceFitRecalibrationObservableRecordV1,
  reference: MainWireVentricularCalciumSourceTraceFitRecalibrationObservableRecordV1,
): MainWireVentricularCalciumSourceTraceFitRecalibrationObservableRecordV1 {
  return Object.freeze(Object.fromEntries(
    MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_RECALIBRATION_OBSERVABLE_IDS_V1
      .map((observableId) => {
        const denominator = reference[observableId];
        if (denominator === 0) {
          throw new Error(`${observableId} reference is zero`);
        }
        return [observableId, value[observableId] / denominator - 1];
      }),
  )) as MainWireVentricularCalciumSourceTraceFitRecalibrationObservableRecordV1;
}

function distances(
  relative:
    MainWireVentricularCalciumSourceTraceFitRecalibrationObservableRecordV1,
): Readonly<{
  macroRestorationRmsRelativeDistanceToCanonical: number;
  guardrailRmsRelativeDistanceToCanonical: number;
  allObservableRmsRelativeDistanceToCanonical: number;
}> {
  const rms = (
    ids: readonly MainWireVentricularCalciumSourceTraceFitRecalibrationObservableIdV1[],
  ): number => Math.sqrt(ids.reduce((sum, id) =>
    sum + relative[id] ** 2, 0) / ids.length);
  return Object.freeze({
    macroRestorationRmsRelativeDistanceToCanonical: rms(
      MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_RECALIBRATION_MACRO_RESTORATION_OBSERVABLE_IDS_V1,
    ),
    guardrailRmsRelativeDistanceToCanonical: rms(
      MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_RECALIBRATION_GUARDRAIL_OBSERVABLE_IDS_V1,
    ),
    allObservableRmsRelativeDistanceToCanonical: rms(
      MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_RECALIBRATION_OBSERVABLE_IDS_V1,
    ),
  });
}
