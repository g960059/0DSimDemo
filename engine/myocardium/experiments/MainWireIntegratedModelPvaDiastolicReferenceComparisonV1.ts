import {
  evaluateMainWireNormalAdultPassiveEquilibriumVentricularCandidateEngineeringV1,
  type MainWireNormalAdultPassiveEquilibriumVentricularCandidateEngineeringV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultPassiveEquilibriumCandidateEngineeringV1";
import {
  MMHG_ML_TO_JOULE_V1,
  type MainWireIntegratedModelMethodSpecificPvaResearchV1,
  type MainWireIntegratedModelPvaLinearRelationV1,
  type MainWireIntegratedModelPvaSystolicMethodV1,
  type MainWireIntegratedModelPvaVentricleV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelMethodSpecificPvaResearchV1";
import {
  MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_MINIMUM_VOLUMES_M3_V3,
  type MainWireNormalAdultPassiveEquilibriumCoordinatesV3,
} from "@/engine/myocardium/experiments/MainWirePassiveEquilibriumPointSolverComparisonDefinitionV1";
import {
  MAIN_WIRE_PASSIVE_EQUILIBRIUM_RESIDUAL_ARMIJO_NEWTON_V3_ID,
  solveMainWirePassiveEquilibriumPointEngineeringV3,
  type MainWirePassiveEquilibriumCandidateEvaluatorV3,
} from "@/engine/myocardium/experiments/MainWirePassiveEquilibriumPointSolverComparisonEngineeringV1";
import { MMHG_TO_PA } from "@/engine/chambers";

export const MAIN_WIRE_INTEGRATED_MODEL_PVA_DIASTOLIC_REFERENCE_COMPARISON_V1_ID =
  "main-wire-integrated-model-pva-diastolic-reference-comparison-v1" as const;

export const MAIN_WIRE_INTRINSIC_PASSIVE_CENTER_SLICE_EXTENSION_INTERVALS_V1 =
  32 as const;

const VENTRICLES_V1 = Object.freeze(["LV", "RV"] as const);

export type MainWireIntrinsicPassiveCenterSlicePointV1 = Readonly<{
  volumeMl: number;
  intrinsicPressureMmHg: number;
  source: "surface-pilot" | "extended-continuation";
  scaledForceInfinityNorm: number;
  minimumScaledInternalHessianEigenvalue: number;
  candidateEvaluations: number | null;
  acceptedUpdates: number | null;
  rejectedTrials: number | null;
}>;

export type MainWireIntrinsicPassiveCenterSliceV1 = Readonly<{
  status: "available";
  ventricleId: MainWireIntegratedModelPvaVentricleV1;
  fixedContralateralVentricleId: MainWireIntegratedModelPvaVentricleV1;
  fixedContralateralVolumeMl: number;
  modelMinimumVolumeMl: number;
  maximumSampledVolumeMl: number;
  zeroPressureVolumeMl: number;
  pressureRule: "piecewise-linear-positive-pressure-with-zero-clamp-below-crossing";
  extensionIntervalCount: number;
  points: readonly MainWireIntrinsicPassiveCenterSlicePointV1[];
}>;

export type MainWireIntrinsicPassiveCenterSliceFailureV1 = Readonly<{
  status: "unavailable";
  ventricleId: MainWireIntegratedModelPvaVentricleV1;
  fixedContralateralVentricleId: MainWireIntegratedModelPvaVentricleV1;
  fixedContralateralVolumeMl: number | null;
  reason: string;
}>;

export type MainWireIntrinsicPassiveCenterSliceOutcomeV1 =
  | MainWireIntrinsicPassiveCenterSliceV1
  | MainWireIntrinsicPassiveCenterSliceFailureV1;

export type MainWireIntrinsicPassiveSurfacePilotPointSourceV1 = Readonly<{
  pointId: string;
  leftVentricularIndex: number;
  rightVentricularIndex: number;
  chamberVolumesM3: Readonly<{ LV: number; RV: number }>;
  status: "primary-point-established" | "primary-point-failed";
  terminal: Readonly<{
    internalCoordinates: MainWireNormalAdultPassiveEquilibriumCoordinatesV3;
    intrinsicPressuresPa: Readonly<{ LV: number; RV: number }>;
    scaledForceInfinityNorm: number;
    minimumScaledInternalHessianEigenvalue: number;
  }> | null;
}>;

export type MainWireIntrinsicPassiveSurfacePilotSourceV1 = Readonly<{
  status: string;
  primaryGrid: readonly MainWireIntrinsicPassiveSurfacePilotPointSourceV1[];
}>;

export type MainWirePvaDiastolicReferenceComparisonRowV1 =
  | Readonly<{
      status: "available";
      ventricleId: MainWireIntegratedModelPvaVentricleV1;
      beatOrdinal: number;
      directionId: "occlusion" | "release";
      systolicMethodId: MainWireIntegratedModelPvaSystolicMethodV1;
      systolicEndpointVolumeMl: number;
      systolicEndpointPressureMmHg: number;
      systolicVolumeAxisInterceptMl: number;
      externalWorkJ: number;
      dynamicMaximumVolumePotentialEnergyJ: number;
      intrinsicPassivePotentialEnergyJ: number;
      dynamicMaximumVolumePvaJ: number;
      intrinsicPassivePvaJ: number;
      intrinsicMinusDynamicPvaJ: number;
      intrinsicMinusDynamicPvaPercent: number;
      intrinsicPassivePressureAtEndpointMmHg: number;
      intrinsicPassiveContributionMode:
        "zero-pressure-clamp" | "piecewise-linear-interpolation";
    }>
  | Readonly<{
      status: "unavailable";
      ventricleId: MainWireIntegratedModelPvaVentricleV1;
      beatOrdinal: number;
      directionId: "occlusion" | "release";
      systolicMethodId: MainWireIntegratedModelPvaSystolicMethodV1;
      reason: string;
    }>;

export type MainWireIntegratedModelPvaDiastolicReferenceComparisonV1 =
  Readonly<{
    studyId: typeof MAIN_WIRE_INTEGRATED_MODEL_PVA_DIASTOLIC_REFERENCE_COMPARISON_V1_ID;
    status: "completed";
    scope: "research-only-diastolic-reference-method-comparison";
    pressureBasis: "ventricular-transmural";
    externalWorkRule: "retained-accepted-trapezoidal-path-plus-straight-endpoint-closure";
    systolicRelationRule: "retained-method-specific-linear-relations";
    dynamicReferenceRule: "retained-dynamic-maximum-volume-positive-pressure-offset-power";
    intrinsicReferenceRule: "fixed-contralateral-center-slice-piecewise-linear-positive-pressure-zero-clamped";
    intrinsicSlices: readonly MainWireIntrinsicPassiveCenterSliceOutcomeV1[];
    rows: readonly MainWirePvaDiastolicReferenceComparisonRowV1[];
    summary: Readonly<{
      attemptedRowCount: number;
      availableComparisonRowCount: number;
      unavailableComparisonRowCount: number;
      zeroPressureClampRowCount: number;
      piecewiseLinearInterpolationRowCount: number;
      byVentricle: readonly Readonly<{
        ventricleId: MainWireIntegratedModelPvaVentricleV1;
        availableComparisonRowCount: number;
        minimumIntrinsicMinusDynamicPvaJ: number | null;
        maximumIntrinsicMinusDynamicPvaJ: number | null;
        medianIntrinsicMinusDynamicPvaJ: number | null;
        minimumIntrinsicMinusDynamicPvaPercent: number | null;
        maximumIntrinsicMinusDynamicPvaPercent: number | null;
        medianIntrinsicMinusDynamicPvaPercent: number | null;
      }>[];
      selectedRows: readonly Readonly<{
        ventricleId: MainWireIntegratedModelPvaVentricleV1;
        beatOrdinal: 1 | 10 | 21;
        systolicMethodId: MainWireIntegratedModelPvaSystolicMethodV1;
        dynamicMaximumVolumePvaJ: number;
        intrinsicPassivePvaJ: number;
        intrinsicMinusDynamicPvaJ: number;
        intrinsicMinusDynamicPvaPercent: number;
      }>[];
    }>;
    interpretation: Readonly<{
      externalWorkChanged: false;
      systolicRelationsChanged: false;
      genericPvaEstablished: false;
      clinicalEdpvrEstablished: false;
      fullBiventricularPassiveSurfaceEstablished: false;
      pericardiumIncluded: false;
      activeStressIncludedInPassiveReference: false;
      productionOutputEstablished: false;
      oxygenConsumptionEstablished: false;
    }>;
  }>;

export function generateMainWireIntrinsicPassiveCenterSlicesForPvaV1(
  surface: MainWireIntrinsicPassiveSurfacePilotSourceV1,
): readonly MainWireIntrinsicPassiveCenterSliceOutcomeV1[] {
  return Object.freeze(
    VENTRICLES_V1.map((ventricleId) =>
      generateCenterSliceV1(surface, ventricleId),
    ),
  );
}

export function compareMainWireIntegratedModelPvaDiastolicReferencesV1(
  pva: MainWireIntegratedModelMethodSpecificPvaResearchV1,
  intrinsicSlices: readonly MainWireIntrinsicPassiveCenterSliceOutcomeV1[],
): MainWireIntegratedModelPvaDiastolicReferenceComparisonV1 {
  if (pva.status !== "completed")
    throw new Error("method-specific PVA input must be completed");
  const sliceByVentricle = new Map(
    intrinsicSlices.map((slice) => [slice.ventricleId, slice]),
  );
  const relationByKey = new Map(
    pva.systolicRelations.flatMap((outcome) =>
      outcome.status === "available"
        ? [
            [
              relationKeyV1(
                outcome.ventricleId,
                outcome.directionId,
                outcome.methodId,
              ),
              outcome.relation,
            ] as const,
          ]
        : [],
    ),
  );

  const rows = Object.freeze(
    pva.pvaRows.map(
      (dynamicRow): MainWirePvaDiastolicReferenceComparisonRowV1 => {
        if (dynamicRow.status === "unavailable") {
          return Object.freeze({
            status: "unavailable" as const,
            ventricleId: dynamicRow.ventricleId,
            beatOrdinal: dynamicRow.beatOrdinal,
            directionId: dynamicRow.directionId,
            systolicMethodId: dynamicRow.systolicMethodId,
            reason: `dynamic PVA unavailable: ${dynamicRow.reason}`,
          });
        }
        const relation = relationByKey.get(
          relationKeyV1(
            dynamicRow.ventricleId,
            dynamicRow.directionId,
            dynamicRow.systolicMethodId,
          ),
        );
        if (relation === undefined) {
          return unavailableComparisonRowV1(
            dynamicRow,
            "retained systolic relation is unavailable",
          );
        }
        const slice = sliceByVentricle.get(dynamicRow.ventricleId);
        if (slice === undefined) {
          return unavailableComparisonRowV1(
            dynamicRow,
            "intrinsic passive slice is missing",
          );
        }
        if (slice.status === "unavailable")
          return unavailableComparisonRowV1(dynamicRow, slice.reason);
        const intrinsic = integrateMainWireIntrinsicPassivePotentialEnergyV1(
          relation,
          slice,
          dynamicRow.systolicEndpoint.volumeMl,
        );
        if (intrinsic.status === "unavailable") {
          return unavailableComparisonRowV1(dynamicRow, intrinsic.reason);
        }
        const externalWorkJ =
          dynamicRow.externalWorkMmHgMl * MMHG_ML_TO_JOULE_V1;
        const intrinsicPassivePotentialEnergyJ =
          intrinsic.potentialEnergyMmHgMl * MMHG_ML_TO_JOULE_V1;
        const intrinsicPassivePvaJ =
          externalWorkJ + intrinsicPassivePotentialEnergyJ;
        const intrinsicMinusDynamicPvaJ =
          intrinsicPassivePvaJ - dynamicRow.pressureVolumeAreaJ;
        const intrinsicMinusDynamicPvaPercent =
          (100 * intrinsicMinusDynamicPvaJ) / dynamicRow.pressureVolumeAreaJ;
        const row = Object.freeze({
          status: "available" as const,
          ventricleId: dynamicRow.ventricleId,
          beatOrdinal: dynamicRow.beatOrdinal,
          directionId: dynamicRow.directionId,
          systolicMethodId: dynamicRow.systolicMethodId,
          systolicEndpointVolumeMl: dynamicRow.systolicEndpoint.volumeMl,
          systolicEndpointPressureMmHg:
            dynamicRow.systolicEndpoint.pressureMmHg,
          systolicVolumeAxisInterceptMl: relation.volumeAxisInterceptMl,
          externalWorkJ,
          dynamicMaximumVolumePotentialEnergyJ:
            dynamicRow.potentialEnergyMmHgMl * MMHG_ML_TO_JOULE_V1,
          intrinsicPassivePotentialEnergyJ,
          dynamicMaximumVolumePvaJ: dynamicRow.pressureVolumeAreaJ,
          intrinsicPassivePvaJ,
          intrinsicMinusDynamicPvaJ,
          intrinsicMinusDynamicPvaPercent,
          intrinsicPassivePressureAtEndpointMmHg:
            intrinsic.passivePressureAtEndpointMmHg,
          intrinsicPassiveContributionMode: intrinsic.contributionMode,
        });
        requireFiniteNumericLeavesV1(row, "available comparison row");
        return row;
      },
    ),
  );

  const availableRows = rows.filter(
    (
      row,
    ): row is Extract<
      MainWirePvaDiastolicReferenceComparisonRowV1,
      { status: "available" }
    > => row.status === "available",
  );
  const selectedBeatOrdinals = new Set([1, 10, 21]);
  const result = Object.freeze({
    studyId:
      MAIN_WIRE_INTEGRATED_MODEL_PVA_DIASTOLIC_REFERENCE_COMPARISON_V1_ID,
    status: "completed" as const,
    scope: "research-only-diastolic-reference-method-comparison" as const,
    pressureBasis: "ventricular-transmural" as const,
    externalWorkRule:
      "retained-accepted-trapezoidal-path-plus-straight-endpoint-closure" as const,
    systolicRelationRule: "retained-method-specific-linear-relations" as const,
    dynamicReferenceRule:
      "retained-dynamic-maximum-volume-positive-pressure-offset-power" as const,
    intrinsicReferenceRule:
      "fixed-contralateral-center-slice-piecewise-linear-positive-pressure-zero-clamped" as const,
    intrinsicSlices: Object.freeze([...intrinsicSlices]),
    rows,
    summary: Object.freeze({
      attemptedRowCount: rows.length,
      availableComparisonRowCount: availableRows.length,
      unavailableComparisonRowCount: rows.length - availableRows.length,
      zeroPressureClampRowCount: availableRows.filter(
        (row) => row.intrinsicPassiveContributionMode === "zero-pressure-clamp",
      ).length,
      piecewiseLinearInterpolationRowCount: availableRows.filter(
        (row) =>
          row.intrinsicPassiveContributionMode ===
          "piecewise-linear-interpolation",
      ).length,
      byVentricle: Object.freeze(
        VENTRICLES_V1.map((ventricleId) => {
          const selected = availableRows.filter(
            (row) => row.ventricleId === ventricleId,
          );
          return Object.freeze({
            ventricleId,
            availableComparisonRowCount: selected.length,
            minimumIntrinsicMinusDynamicPvaJ: minimumOrNullV1(
              selected.map((row) => row.intrinsicMinusDynamicPvaJ),
            ),
            maximumIntrinsicMinusDynamicPvaJ: maximumOrNullV1(
              selected.map((row) => row.intrinsicMinusDynamicPvaJ),
            ),
            medianIntrinsicMinusDynamicPvaJ: medianOrNullV1(
              selected.map((row) => row.intrinsicMinusDynamicPvaJ),
            ),
            minimumIntrinsicMinusDynamicPvaPercent: minimumOrNullV1(
              selected.map((row) => row.intrinsicMinusDynamicPvaPercent),
            ),
            maximumIntrinsicMinusDynamicPvaPercent: maximumOrNullV1(
              selected.map((row) => row.intrinsicMinusDynamicPvaPercent),
            ),
            medianIntrinsicMinusDynamicPvaPercent: medianOrNullV1(
              selected.map((row) => row.intrinsicMinusDynamicPvaPercent),
            ),
          });
        }),
      ),
      selectedRows: Object.freeze(
        availableRows
          .filter((row) => selectedBeatOrdinals.has(row.beatOrdinal))
          .map((row) =>
            Object.freeze({
              ventricleId: row.ventricleId,
              beatOrdinal: row.beatOrdinal as 1 | 10 | 21,
              systolicMethodId: row.systolicMethodId,
              dynamicMaximumVolumePvaJ: row.dynamicMaximumVolumePvaJ,
              intrinsicPassivePvaJ: row.intrinsicPassivePvaJ,
              intrinsicMinusDynamicPvaJ: row.intrinsicMinusDynamicPvaJ,
              intrinsicMinusDynamicPvaPercent:
                row.intrinsicMinusDynamicPvaPercent,
            }),
          ),
      ),
    }),
    interpretation: Object.freeze({
      externalWorkChanged: false as const,
      systolicRelationsChanged: false as const,
      genericPvaEstablished: false as const,
      clinicalEdpvrEstablished: false as const,
      fullBiventricularPassiveSurfaceEstablished: false as const,
      pericardiumIncluded: false as const,
      activeStressIncludedInPassiveReference: false as const,
      productionOutputEstablished: false as const,
      oxygenConsumptionEstablished: false as const,
    }),
  });
  requireFiniteNumericLeavesV1(result, "PVA diastolic-reference comparison");
  return result;
}

export function integrateMainWireIntrinsicPassivePotentialEnergyV1(
  systolic: MainWireIntegratedModelPvaLinearRelationV1,
  slice: MainWireIntrinsicPassiveCenterSliceV1,
  systolicEndpointVolumeMl: number,
):
  | Readonly<{
      status: "available";
      intersectionVolumeMl: number;
      passivePressureAtEndpointMmHg: number;
      passiveIntegralMmHgMl: number;
      potentialEnergyMmHgMl: number;
      contributionMode:
        "zero-pressure-clamp" | "piecewise-linear-interpolation";
    }>
  | Readonly<{ status: "unavailable"; reason: string }> {
  if (!(systolic.slopeMmHgPerMl > 0)) {
    return Object.freeze({
      status: "unavailable" as const,
      reason: "systolic relation does not have positive slope",
    });
  }
  requireFiniteV1(systolicEndpointVolumeMl, "systolic endpoint volume");
  if (
    !(systolicEndpointVolumeMl > systolic.volumeAxisInterceptMl) ||
    systolicEndpointVolumeMl > slice.maximumSampledVolumeMl
  ) {
    return Object.freeze({
      status: "unavailable" as const,
      reason: "systolic endpoint lies outside the intrinsic reference domain",
    });
  }
  const passivePressureAtEndpointMmHg = intrinsicPassivePressureV1(
    slice,
    systolicEndpointVolumeMl,
  );
  const systolicPressureAtEndpointMmHg =
    systolic.slopeMmHgPerMl * systolicEndpointVolumeMl + systolic.interceptMmHg;
  if (
    passivePressureAtEndpointMmHg === null ||
    !(systolicPressureAtEndpointMmHg > passivePressureAtEndpointMmHg)
  ) {
    return Object.freeze({
      status: "unavailable" as const,
      reason: "systolic endpoint does not lie above the intrinsic reference",
    });
  }
  const relevantPoints = slice.points.filter(
    ({ volumeMl }) =>
      volumeMl > slice.zeroPressureVolumeMl &&
      volumeMl <= systolicEndpointVolumeMl,
  );
  for (const point of relevantPoints) {
    const systolicPressure =
      systolic.slopeMmHgPerMl * point.volumeMl + systolic.interceptMmHg;
    if (systolicPressure < point.intrinsicPressureMmHg - 1e-10) {
      return Object.freeze({
        status: "unavailable" as const,
        reason: "systolic and intrinsic passive references cross again",
      });
    }
  }
  const passiveIntegralMmHgMl = integratePositivePiecewiseLinearReferenceV1(
    slice,
    systolicEndpointVolumeMl,
  );
  const systolicIntegralMmHgMl =
    0.5 *
    systolic.slopeMmHgPerMl *
    (systolicEndpointVolumeMl - systolic.volumeAxisInterceptMl) ** 2;
  const potentialEnergyMmHgMl = systolicIntegralMmHgMl - passiveIntegralMmHgMl;
  if (!Number.isFinite(potentialEnergyMmHgMl) || potentialEnergyMmHgMl < 0) {
    return Object.freeze({
      status: "unavailable" as const,
      reason: "intrinsic potential-energy integral is invalid",
    });
  }
  return Object.freeze({
    status: "available" as const,
    intersectionVolumeMl: systolic.volumeAxisInterceptMl,
    passivePressureAtEndpointMmHg,
    passiveIntegralMmHgMl,
    potentialEnergyMmHgMl,
    contributionMode:
      systolicEndpointVolumeMl <= slice.zeroPressureVolumeMl
        ? ("zero-pressure-clamp" as const)
        : ("piecewise-linear-interpolation" as const),
  });
}

export function integratePositivePiecewiseLinearReferenceV1(
  slice: MainWireIntrinsicPassiveCenterSliceV1,
  upperVolumeMl: number,
): number {
  requireFiniteV1(upperVolumeMl, "piecewise-linear integral upper volume");
  if (upperVolumeMl <= slice.zeroPressureVolumeMl) return 0;
  if (upperVolumeMl > slice.maximumSampledVolumeMl)
    throw new Error("piecewise-linear integral would extrapolate above data");
  const positivePoints = slice.points.filter(
    ({ volumeMl, intrinsicPressureMmHg }) =>
      volumeMl > slice.zeroPressureVolumeMl && intrinsicPressureMmHg > 0,
  );
  const knots = [
    Object.freeze({
      volumeMl: slice.zeroPressureVolumeMl,
      intrinsicPressureMmHg: 0,
    }),
    ...positivePoints,
  ];
  let integral = 0;
  for (let index = 1; index < knots.length; index += 1) {
    const left = knots[index - 1]!;
    const right = knots[index]!;
    if (upperVolumeMl <= left.volumeMl) break;
    const segmentUpper = Math.min(upperVolumeMl, right.volumeMl);
    const fraction =
      (segmentUpper - left.volumeMl) / (right.volumeMl - left.volumeMl);
    const upperPressure =
      left.intrinsicPressureMmHg +
      fraction * (right.intrinsicPressureMmHg - left.intrinsicPressureMmHg);
    integral +=
      0.5 *
      (left.intrinsicPressureMmHg + upperPressure) *
      (segmentUpper - left.volumeMl);
    if (segmentUpper === upperVolumeMl) break;
  }
  if (!Number.isFinite(integral) || integral < 0)
    throw new Error("piecewise-linear pressure integral is invalid");
  return integral;
}

function generateCenterSliceV1(
  surface: MainWireIntrinsicPassiveSurfacePilotSourceV1,
  ventricleId: MainWireIntegratedModelPvaVentricleV1,
): MainWireIntrinsicPassiveCenterSliceOutcomeV1 {
  const fixedContralateralVentricleId = ventricleId === "LV" ? "RV" : "LV";
  const pilotPoints = surface.primaryGrid
    .filter((point) =>
      ventricleId === "LV"
        ? point.rightVentricularIndex === 2
        : point.leftVentricularIndex === 2,
    )
    .sort(
      (left, right) =>
        left.chamberVolumesM3[ventricleId] -
        right.chamberVolumesM3[ventricleId],
    );
  if (
    pilotPoints.length !== 5 ||
    pilotPoints.some(
      (point) =>
        point.status !== "primary-point-established" || point.terminal === null,
    )
  ) {
    return Object.freeze({
      status: "unavailable" as const,
      ventricleId,
      fixedContralateralVentricleId,
      fixedContralateralVolumeMl: null,
      reason: "the five center-slice pilot points are not all available",
    });
  }
  const lowestPilotPoint = pilotPoints[0]!;
  const fixedContralateralVolumeM3 =
    lowestPilotPoint.chamberVolumesM3[fixedContralateralVentricleId];
  const modelMinimumVolumeM3 =
    MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_MINIMUM_VOLUMES_M3_V3[
      ventricleId
    ];
  let coordinates = lowestPilotPoint.terminal!.internalCoordinates;
  const extensionPoints: MainWireIntrinsicPassiveCenterSlicePointV1[] = [];
  for (
    let ordinal = 1;
    ordinal <= MAIN_WIRE_INTRINSIC_PASSIVE_CENTER_SLICE_EXTENSION_INTERVALS_V1;
    ordinal += 1
  ) {
    const chamberVolumeM3 =
      lowestPilotPoint.chamberVolumesM3[ventricleId] +
      (ordinal /
        MAIN_WIRE_INTRINSIC_PASSIVE_CENTER_SLICE_EXTENSION_INTERVALS_V1) *
        (modelMinimumVolumeM3 - lowestPilotPoint.chamberVolumesM3[ventricleId]);
    const chamberVolumesM3 =
      ventricleId === "LV"
        ? Object.freeze({
            LV: chamberVolumeM3,
            RV: fixedContralateralVolumeM3,
          })
        : Object.freeze({
            LV: fixedContralateralVolumeM3,
            RV: chamberVolumeM3,
          });
    const result = solveMainWirePassiveEquilibriumPointEngineeringV3({
      policyId: MAIN_WIRE_PASSIVE_EQUILIBRIUM_RESIDUAL_ARMIJO_NEWTON_V3_ID,
      stageIndex: ordinal,
      initialCoordinates: coordinates,
      evaluateCandidate: normalAdultCandidateEvaluatorV1(chamberVolumesM3),
    });
    if (result.status !== "point-local-stable-root-established") {
      return Object.freeze({
        status: "unavailable" as const,
        ventricleId,
        fixedContralateralVentricleId,
        fixedContralateralVolumeMl: fixedContralateralVolumeM3 * 1e6,
        reason: `extended continuation failed at interval ${ordinal}: ${result.failureReason}`,
      });
    }
    coordinates = result.terminalCandidate.internalCoordinates;
    const candidate =
      evaluateMainWireNormalAdultPassiveEquilibriumVentricularCandidateEngineeringV1(
        { chamberVolumesM3, internalCoordinates: coordinates },
      );
    extensionPoints.push(
      pointFromCandidateV1(
        ventricleId,
        candidate,
        result.candidateEvaluations,
        result.acceptedUpdates,
        result.rejectedTrials,
      ),
    );
  }
  const retainedPilotPoints = pilotPoints.map((point) =>
    Object.freeze({
      volumeMl: point.chamberVolumesM3[ventricleId] * 1e6,
      intrinsicPressureMmHg:
        point.terminal!.intrinsicPressuresPa[ventricleId] / MMHG_TO_PA,
      source: "surface-pilot" as const,
      scaledForceInfinityNorm: point.terminal!.scaledForceInfinityNorm,
      minimumScaledInternalHessianEigenvalue:
        point.terminal!.minimumScaledInternalHessianEigenvalue,
      candidateEvaluations: null,
      acceptedUpdates: null,
      rejectedTrials: null,
    }),
  );
  const points = Object.freeze(
    [...retainedPilotPoints, ...extensionPoints].sort(
      (left, right) => left.volumeMl - right.volumeMl,
    ),
  );
  const zeroPressureVolumeMl = zeroPressureCrossingV1(points);
  if (zeroPressureVolumeMl === null) {
    return Object.freeze({
      status: "unavailable" as const,
      ventricleId,
      fixedContralateralVentricleId,
      fixedContralateralVolumeMl: fixedContralateralVolumeM3 * 1e6,
      reason: "the center slice does not bracket a zero-pressure crossing",
    });
  }
  const positivePressures = points.filter(
    ({ volumeMl }) => volumeMl > zeroPressureVolumeMl,
  );
  if (
    positivePressures.some(
      (point, index) =>
        !(point.intrinsicPressureMmHg > 0) ||
        (index > 0 &&
          point.intrinsicPressureMmHg <
            positivePressures[index - 1]!.intrinsicPressureMmHg),
    )
  ) {
    return Object.freeze({
      status: "unavailable" as const,
      ventricleId,
      fixedContralateralVentricleId,
      fixedContralateralVolumeMl: fixedContralateralVolumeM3 * 1e6,
      reason: "positive-pressure center slice is not monotone",
    });
  }
  return Object.freeze({
    status: "available" as const,
    ventricleId,
    fixedContralateralVentricleId,
    fixedContralateralVolumeMl: fixedContralateralVolumeM3 * 1e6,
    modelMinimumVolumeMl: modelMinimumVolumeM3 * 1e6,
    maximumSampledVolumeMl: points.at(-1)!.volumeMl,
    zeroPressureVolumeMl,
    pressureRule:
      "piecewise-linear-positive-pressure-with-zero-clamp-below-crossing" as const,
    extensionIntervalCount:
      MAIN_WIRE_INTRINSIC_PASSIVE_CENTER_SLICE_EXTENSION_INTERVALS_V1,
    points,
  });
}

function normalAdultCandidateEvaluatorV1(
  chamberVolumesM3: Readonly<{ LV: number; RV: number }>,
): MainWirePassiveEquilibriumCandidateEvaluatorV3 {
  return (internalCoordinates) => {
    const candidate =
      evaluateMainWireNormalAdultPassiveEquilibriumVentricularCandidateEngineeringV1(
        { chamberVolumesM3, internalCoordinates },
      );
    return Object.freeze({
      internalCoordinates: candidate.internalCoordinates,
      wallStoredEnergyJ: Object.freeze({
        LVFW: candidate.wallEquilibriumPassiveByWall.LVFW.storedEnergyJ,
        SEP: candidate.wallEquilibriumPassiveByWall.SEP.storedEnergyJ,
        RVFW: candidate.wallEquilibriumPassiveByWall.RVFW.storedEnergyJ,
      }),
      scaledGradient: candidate.scaledGradient,
      scaledInternalHessian: candidate.scaledInternalHessian,
    });
  };
}

function pointFromCandidateV1(
  ventricleId: MainWireIntegratedModelPvaVentricleV1,
  candidate: MainWireNormalAdultPassiveEquilibriumVentricularCandidateEngineeringV1,
  candidateEvaluations: number,
  acceptedUpdates: number,
  rejectedTrials: number,
): MainWireIntrinsicPassiveCenterSlicePointV1 {
  return Object.freeze({
    volumeMl: candidate.chamberVolumesM3[ventricleId] * 1e6,
    intrinsicPressureMmHg:
      candidate.intrinsicPressuresPa[ventricleId] / MMHG_TO_PA,
    source: "extended-continuation" as const,
    scaledForceInfinityNorm: candidate.scaledForceInfinityNorm,
    minimumScaledInternalHessianEigenvalue:
      candidate.minimumScaledInternalHessianEigenvalue,
    candidateEvaluations,
    acceptedUpdates,
    rejectedTrials,
  });
}

function zeroPressureCrossingV1(
  points: readonly MainWireIntrinsicPassiveCenterSlicePointV1[],
): number | null {
  for (let index = 1; index < points.length; index += 1) {
    const left = points[index - 1]!;
    const right = points[index]!;
    if (left.intrinsicPressureMmHg === 0) return left.volumeMl;
    if (left.intrinsicPressureMmHg < 0 && right.intrinsicPressureMmHg >= 0) {
      const fraction =
        -left.intrinsicPressureMmHg /
        (right.intrinsicPressureMmHg - left.intrinsicPressureMmHg);
      return left.volumeMl + fraction * (right.volumeMl - left.volumeMl);
    }
  }
  return points.at(-1)?.intrinsicPressureMmHg === 0
    ? points.at(-1)!.volumeMl
    : null;
}

function intrinsicPassivePressureV1(
  slice: MainWireIntrinsicPassiveCenterSliceV1,
  volumeMl: number,
): number | null {
  if (volumeMl <= slice.zeroPressureVolumeMl) return 0;
  if (volumeMl > slice.maximumSampledVolumeMl) return null;
  const positivePoints = slice.points.filter(
    ({ volumeMl: pointVolumeMl, intrinsicPressureMmHg }) =>
      pointVolumeMl > slice.zeroPressureVolumeMl && intrinsicPressureMmHg > 0,
  );
  const knots = [
    Object.freeze({
      volumeMl: slice.zeroPressureVolumeMl,
      intrinsicPressureMmHg: 0,
    }),
    ...positivePoints,
  ];
  for (let index = 1; index < knots.length; index += 1) {
    const left = knots[index - 1]!;
    const right = knots[index]!;
    if (volumeMl > right.volumeMl) continue;
    const fraction =
      (volumeMl - left.volumeMl) / (right.volumeMl - left.volumeMl);
    return (
      left.intrinsicPressureMmHg +
      fraction * (right.intrinsicPressureMmHg - left.intrinsicPressureMmHg)
    );
  }
  return null;
}

function unavailableComparisonRowV1(
  row: Extract<
    MainWireIntegratedModelMethodSpecificPvaResearchV1["pvaRows"][number],
    { status: "available" }
  >,
  reason: string,
): Extract<
  MainWirePvaDiastolicReferenceComparisonRowV1,
  { status: "unavailable" }
> {
  return Object.freeze({
    status: "unavailable" as const,
    ventricleId: row.ventricleId,
    beatOrdinal: row.beatOrdinal,
    directionId: row.directionId,
    systolicMethodId: row.systolicMethodId,
    reason,
  });
}

function relationKeyV1(
  ventricleId: MainWireIntegratedModelPvaVentricleV1,
  directionId: "occlusion" | "release",
  methodId: MainWireIntegratedModelPvaSystolicMethodV1,
): string {
  return `${ventricleId}:${directionId}:${methodId}`;
}

function minimumOrNullV1(values: readonly number[]): number | null {
  return values.length === 0 ? null : Math.min(...values);
}

function maximumOrNullV1(values: readonly number[]): number | null {
  return values.length === 0 ? null : Math.max(...values);
}

function medianOrNullV1(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1
    ? sorted[middle]!
    : 0.5 * (sorted[middle - 1]! + sorted[middle]!);
}

function requireFiniteNumericLeavesV1(value: unknown, label: string): void {
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error(`${label} must be finite`);
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) requireFiniteNumericLeavesV1(item, label);
    return;
  }
  if (value !== null && typeof value === "object") {
    for (const item of Object.values(value))
      requireFiniteNumericLeavesV1(item, label);
  }
}

function requireFiniteV1(value: number, label: string): void {
  if (!Number.isFinite(value)) throw new Error(`${label} must be finite`);
}
