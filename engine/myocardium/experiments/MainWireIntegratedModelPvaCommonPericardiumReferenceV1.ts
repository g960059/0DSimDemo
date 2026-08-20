import { MMHG_TO_PA } from "@/engine/chambers";
import {
  MMHG_ML_TO_JOULE_V1,
  type MainWireIntegratedModelMethodSpecificPvaResearchV1,
  type MainWireIntegratedModelPvaSystolicMethodV1,
  type MainWireIntegratedModelPvaVentricleV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelMethodSpecificPvaResearchV1";
import {
  integrateMainWireIntrinsicPassivePotentialEnergyV1,
  type MainWireIntegratedModelPvaDiastolicReferenceComparisonV1,
  type MainWireIntrinsicPassiveCenterSliceV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPvaDiastolicReferenceComparisonV1";
import { COMMON_PERICARDIUM_TRANSITION_HALF_WIDTH_V1 } from "@/engine/myocardium/mechanics/commonPericardiumV1";
import { createMainWireNormalAdultCommonPericardiumV1 } from "@/engine/myocardium/mechanics/MainWireNormalAdultCommonPericardiumV1";
import { evaluateMainWireCommonPericardiumBindingV1 } from "@/engine/myocardium/mechanics/mainWireCommonPericardiumBindingV1";
import { NORMAL_ADULT_FIVE_WALL_PRIOR_V1 } from "@/engine/myocardium/mechanics/normalAdultFiveWallPriorV1";

export const MAIN_WIRE_INTEGRATED_MODEL_PVA_COMMON_PERICARDIUM_REFERENCE_V1_ID =
  "main-wire-integrated-model-pva-common-pericardium-reference-v1" as const;

const VENTRICLES_V1 = Object.freeze(["LV", "RV"] as const);

export type MainWirePvaCommonPericardiumSlicePointV1 = Readonly<{
  volumeMl: number;
  intrinsicPressureMmHg: number;
  commonPericardialExcessPressureMmHg: number;
  constrainedPressureMmHg: number;
  totalOccupiedVolumeMl: number;
  commonPericardialStoredEnergyJ: number;
  commonPericardialTangentMmHgPerMl: number;
  smoothingBranch: "off" | "zero" | "transition" | "linear";
}>;

export type MainWirePvaCommonPericardiumSliceV1 = Readonly<{
  status: "available";
  ventricleId: MainWireIntegratedModelPvaVentricleV1;
  fixedContralateralVentricleId: MainWireIntegratedModelPvaVentricleV1;
  fixedContralateralVolumeMl: number;
  fixedLeftAtrialVolumeMl: number;
  fixedRightAtrialVolumeMl: number;
  commonIntrathoracicPressureMmHg: 0;
  commonPericardiumParameterSetId: string;
  zeroPressureVolumeMl: number;
  maximumSampledVolumeMl: number;
  zeroBranchUpperOccupiedVolumeMl: number;
  minimumSlackMarginMl: number;
  allSampledPointsInExactZeroBranch: boolean;
  maximumCommonPericardialExcessPressureMmHg: number;
  points: readonly MainWirePvaCommonPericardiumSlicePointV1[];
}>;

export type MainWirePvaCommonPericardiumSliceFailureV1 = Readonly<{
  status: "unavailable";
  ventricleId: MainWireIntegratedModelPvaVentricleV1;
  reason: string;
}>;

export type MainWirePvaCommonPericardiumSliceOutcomeV1 =
  | MainWirePvaCommonPericardiumSliceV1
  | MainWirePvaCommonPericardiumSliceFailureV1;

export type MainWirePvaCommonPericardiumComparisonRowV1 =
  | Readonly<{
      status: "available";
      ventricleId: MainWireIntegratedModelPvaVentricleV1;
      beatOrdinal: number;
      directionId: "occlusion" | "release";
      systolicMethodId: MainWireIntegratedModelPvaSystolicMethodV1;
      dynamicMaximumVolumePvaJ: number;
      intrinsicPassivePvaJ: number;
      commonPericardiumConstrainedPvaJ: number;
      constrainedMinusIntrinsicPvaJ: number;
      constrainedMinusIntrinsicPvaPercent: number;
      commonPericardialExcessPressureAtEndpointMmHg: 0;
      constrainedReferenceContributionMode:
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

export type MainWireIntegratedModelPvaCommonPericardiumReferenceV1 = Readonly<{
  studyId: typeof MAIN_WIRE_INTEGRATED_MODEL_PVA_COMMON_PERICARDIUM_REFERENCE_V1_ID;
  status: "completed";
  scope: "research-only-fixed-condition-common-pericardium-reference-check";
  sourceStudies: readonly [
    "main-wire-integrated-model-method-specific-pva-research-v1",
    "main-wire-integrated-model-pva-diastolic-reference-comparison-v1",
  ];
  fixedCondition: Readonly<{
    atrialVolumeSource: "normal-adult-prior-minimum-cavity-volumes";
    leftAtrialVolumeMl: number;
    rightAtrialVolumeMl: number;
    commonIntrathoracicPressureMmHg: 0;
    commonPericardiumCaseId: "healthy-slack";
    prescribedPericardialFluidVolumeMl: 0;
    referenceHeartVolumeMl: number;
  }>;
  pressureAccounting: Readonly<{
    retainedLoopAndSystolicPressureBasis: "ventricular-transmural";
    constrainedReferencePressureBasis: "relative-to-common-intrathoracic";
    comparisonAllowedOnlyWhereCommonPericardialExcessPressureIsExactlyZero: true;
    fullIntrathoracicPressureBasisRefitPerformed: false;
  }>;
  constrainedSlices: readonly MainWirePvaCommonPericardiumSliceOutcomeV1[];
  rows: readonly MainWirePvaCommonPericardiumComparisonRowV1[];
  positiveControl: Readonly<{
    caseId: "effusion-300ml-positive-control";
    role: "mechanism-response-check-not-used-in-pva-rows";
    byVentricle: readonly Readonly<{
      ventricleId: MainWireIntegratedModelPvaVentricleV1;
      evaluatedPointCount: number;
      engagedPointCount: number;
      minimumExcessPressureMmHg: number;
      maximumExcessPressureMmHg: number;
    }>[];
  }>;
  summary: Readonly<{
    attemptedRowCount: number;
    availableComparisonRowCount: number;
    unavailableComparisonRowCount: number;
    pressureBasisMatchedRowCount: number;
    changedPvaRowCount: number;
    maximumAbsoluteConstrainedMinusIntrinsicPvaJ: number;
    byVentricle: readonly Readonly<{
      ventricleId: MainWireIntegratedModelPvaVentricleV1;
      availableComparisonRowCount: number;
      minimumSlackMarginMl: number | null;
      maximumCommonPericardialExcessPressureMmHg: number | null;
      minimumConstrainedMinusIntrinsicPvaJ: number | null;
      maximumConstrainedMinusIntrinsicPvaJ: number | null;
      medianConstrainedMinusIntrinsicPvaJ: number | null;
    }>[];
    selectedRows: readonly Readonly<{
      ventricleId: MainWireIntegratedModelPvaVentricleV1;
      beatOrdinal: 1 | 10 | 21;
      systolicMethodId: MainWireIntegratedModelPvaSystolicMethodV1;
      intrinsicPassivePvaJ: number;
      commonPericardiumConstrainedPvaJ: number;
      constrainedMinusIntrinsicPvaJ: number;
    }>[];
  }>;
  interpretation: Readonly<{
    defaultHealthyPericardiumEngagedOnSampledSlices: false;
    externalWorkChanged: false;
    systolicRelationsChanged: false;
    dynamicPericardialContributionEstablished: false;
    fullPressureBasisMatchedPericardialPvaEstablished: false;
    genericPvaEstablished: false;
    clinicalEdpvrEstablished: false;
    productionOutputEstablished: false;
    oxygenConsumptionEstablished: false;
  }>;
}>;

type ConstructedSliceV1 = Readonly<{
  outcome: MainWirePvaCommonPericardiumSliceOutcomeV1;
  integrationSlice: MainWireIntrinsicPassiveCenterSliceV1 | null;
}>;

export function compareMainWireIntegratedModelPvaCommonPericardiumReferenceV1(
  pva: MainWireIntegratedModelMethodSpecificPvaResearchV1,
  intrinsicComparison: MainWireIntegratedModelPvaDiastolicReferenceComparisonV1,
): MainWireIntegratedModelPvaCommonPericardiumReferenceV1 {
  if (
    pva.studyId !==
      "main-wire-integrated-model-method-specific-pva-research-v1" ||
    pva.status !== "completed" ||
    intrinsicComparison.studyId !==
      "main-wire-integrated-model-pva-diastolic-reference-comparison-v1" ||
    intrinsicComparison.status !== "completed"
  ) {
    throw new Error("both PVA source studies must be completed");
  }
  const prior = NORMAL_ADULT_FIVE_WALL_PRIOR_V1;
  const leftAtrialVolumeMl = prior.anatomy.atria.LA.cavityBloodVolumeMl.minimum;
  const rightAtrialVolumeMl =
    prior.anatomy.atria.RA.cavityBloodVolumeMl.minimum;
  const binding = createMainWireNormalAdultCommonPericardiumV1(
    "on",
    "healthy-slack",
  );
  const constructed = intrinsicComparison.intrinsicSlices.map((slice) =>
    constructSliceV1(slice, binding, leftAtrialVolumeMl, rightAtrialVolumeMl),
  );
  const constructedByVentricle = new Map(
    constructed.map((slice) => [slice.outcome.ventricleId, slice]),
  );
  if (
    constructed.some(
      ({ outcome }) =>
        outcome.status !== "available" ||
        !outcome.allSampledPointsInExactZeroBranch,
    )
  ) {
    throw new Error(
      "the fixed healthy condition must remain in the exact pericardial zero branch",
    );
  }
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
    intrinsicComparison.rows.map(
      (sourceRow): MainWirePvaCommonPericardiumComparisonRowV1 => {
        if (sourceRow.status === "unavailable") {
          return Object.freeze({ ...sourceRow });
        }
        const slice = constructedByVentricle.get(sourceRow.ventricleId);
        if (slice?.integrationSlice === null || slice === undefined) {
          return unavailableRowV1(
            sourceRow,
            slice?.outcome.status === "unavailable"
              ? slice.outcome.reason
              : "constrained passive slice is unavailable",
          );
        }
        const relation = relationByKey.get(
          relationKeyV1(
            sourceRow.ventricleId,
            sourceRow.directionId,
            sourceRow.systolicMethodId,
          ),
        );
        if (relation === undefined) {
          return unavailableRowV1(
            sourceRow,
            "retained systolic relation is unavailable",
          );
        }
        const endpointEvaluation = evaluateMainWireCommonPericardiumBindingV1(
          binding,
          chamberVolumesV1(
            sourceRow.ventricleId,
            sourceRow.systolicEndpointVolumeMl,
            slice.outcome.status === "available"
              ? slice.outcome.fixedContralateralVolumeMl
              : 0,
            leftAtrialVolumeMl,
            rightAtrialVolumeMl,
          ),
        );
        if (endpointEvaluation.excessPressureMmHg !== 0) {
          return unavailableRowV1(
            sourceRow,
            "common pericardial pressure is nonzero, so the retained transmural systolic basis is not comparable",
          );
        }
        const integrated = integrateMainWireIntrinsicPassivePotentialEnergyV1(
          relation,
          slice.integrationSlice,
          sourceRow.systolicEndpointVolumeMl,
        );
        if (integrated.status === "unavailable") {
          return unavailableRowV1(sourceRow, integrated.reason);
        }
        const potentialEnergyJ =
          integrated.potentialEnergyMmHgMl * MMHG_ML_TO_JOULE_V1;
        const constrainedPvaJ = sourceRow.externalWorkJ + potentialEnergyJ;
        const constrainedMinusIntrinsicPvaJ =
          constrainedPvaJ - sourceRow.intrinsicPassivePvaJ;
        const row = Object.freeze({
          status: "available" as const,
          ventricleId: sourceRow.ventricleId,
          beatOrdinal: sourceRow.beatOrdinal,
          directionId: sourceRow.directionId,
          systolicMethodId: sourceRow.systolicMethodId,
          dynamicMaximumVolumePvaJ: sourceRow.dynamicMaximumVolumePvaJ,
          intrinsicPassivePvaJ: sourceRow.intrinsicPassivePvaJ,
          commonPericardiumConstrainedPvaJ: constrainedPvaJ,
          constrainedMinusIntrinsicPvaJ,
          constrainedMinusIntrinsicPvaPercent:
            (100 * constrainedMinusIntrinsicPvaJ) /
            sourceRow.intrinsicPassivePvaJ,
          commonPericardialExcessPressureAtEndpointMmHg: 0 as const,
          constrainedReferenceContributionMode: integrated.contributionMode,
        });
        requireFiniteNumericLeavesV1(row, "common-pericardium comparison row");
        return row;
      },
    ),
  );
  const availableRows = rows.filter(
    (
      row,
    ): row is Extract<
      MainWirePvaCommonPericardiumComparisonRowV1,
      { status: "available" }
    > => row.status === "available",
  );
  const positiveControl = positiveControlSummaryV1(
    intrinsicComparison,
    leftAtrialVolumeMl,
    rightAtrialVolumeMl,
  );
  const selectedBeatOrdinals = new Set([1, 10, 21]);
  const result = Object.freeze({
    studyId: MAIN_WIRE_INTEGRATED_MODEL_PVA_COMMON_PERICARDIUM_REFERENCE_V1_ID,
    status: "completed" as const,
    scope:
      "research-only-fixed-condition-common-pericardium-reference-check" as const,
    sourceStudies: Object.freeze([
      "main-wire-integrated-model-method-specific-pva-research-v1" as const,
      "main-wire-integrated-model-pva-diastolic-reference-comparison-v1" as const,
    ] as const),
    fixedCondition: Object.freeze({
      atrialVolumeSource: "normal-adult-prior-minimum-cavity-volumes" as const,
      leftAtrialVolumeMl,
      rightAtrialVolumeMl,
      commonIntrathoracicPressureMmHg: 0 as const,
      commonPericardiumCaseId: "healthy-slack" as const,
      prescribedPericardialFluidVolumeMl: 0 as const,
      referenceHeartVolumeMl: binding.parameters.referenceHeartVolumeM3 * 1e6,
    }),
    pressureAccounting: Object.freeze({
      retainedLoopAndSystolicPressureBasis: "ventricular-transmural" as const,
      constrainedReferencePressureBasis:
        "relative-to-common-intrathoracic" as const,
      comparisonAllowedOnlyWhereCommonPericardialExcessPressureIsExactlyZero:
        true as const,
      fullIntrathoracicPressureBasisRefitPerformed: false as const,
    }),
    constrainedSlices: Object.freeze(constructed.map(({ outcome }) => outcome)),
    rows,
    positiveControl,
    summary: Object.freeze({
      attemptedRowCount: rows.length,
      availableComparisonRowCount: availableRows.length,
      unavailableComparisonRowCount: rows.length - availableRows.length,
      pressureBasisMatchedRowCount: availableRows.length,
      changedPvaRowCount: availableRows.filter(
        (row) => row.constrainedMinusIntrinsicPvaJ !== 0,
      ).length,
      maximumAbsoluteConstrainedMinusIntrinsicPvaJ: maximumOrZeroV1(
        availableRows.map((row) => Math.abs(row.constrainedMinusIntrinsicPvaJ)),
      ),
      byVentricle: Object.freeze(
        VENTRICLES_V1.map((ventricleId) => {
          const selected = availableRows.filter(
            (row) => row.ventricleId === ventricleId,
          );
          const slice = constructedByVentricle.get(ventricleId)?.outcome;
          return Object.freeze({
            ventricleId,
            availableComparisonRowCount: selected.length,
            minimumSlackMarginMl:
              slice?.status === "available" ? slice.minimumSlackMarginMl : null,
            maximumCommonPericardialExcessPressureMmHg:
              slice?.status === "available"
                ? slice.maximumCommonPericardialExcessPressureMmHg
                : null,
            minimumConstrainedMinusIntrinsicPvaJ: minimumOrNullV1(
              selected.map((row) => row.constrainedMinusIntrinsicPvaJ),
            ),
            maximumConstrainedMinusIntrinsicPvaJ: maximumOrNullV1(
              selected.map((row) => row.constrainedMinusIntrinsicPvaJ),
            ),
            medianConstrainedMinusIntrinsicPvaJ: medianOrNullV1(
              selected.map((row) => row.constrainedMinusIntrinsicPvaJ),
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
              intrinsicPassivePvaJ: row.intrinsicPassivePvaJ,
              commonPericardiumConstrainedPvaJ:
                row.commonPericardiumConstrainedPvaJ,
              constrainedMinusIntrinsicPvaJ: row.constrainedMinusIntrinsicPvaJ,
            }),
          ),
      ),
    }),
    interpretation: Object.freeze({
      defaultHealthyPericardiumEngagedOnSampledSlices: false as const,
      externalWorkChanged: false as const,
      systolicRelationsChanged: false as const,
      dynamicPericardialContributionEstablished: false as const,
      fullPressureBasisMatchedPericardialPvaEstablished: false as const,
      genericPvaEstablished: false as const,
      clinicalEdpvrEstablished: false as const,
      productionOutputEstablished: false as const,
      oxygenConsumptionEstablished: false as const,
    }),
  });
  requireFiniteNumericLeavesV1(result, "common-pericardium PVA result");
  return result;
}

function constructSliceV1(
  source: MainWireIntegratedModelPvaDiastolicReferenceComparisonV1["intrinsicSlices"][number],
  binding: ReturnType<typeof createMainWireNormalAdultCommonPericardiumV1>,
  leftAtrialVolumeMl: number,
  rightAtrialVolumeMl: number,
): ConstructedSliceV1 {
  if (source.status === "unavailable") {
    return Object.freeze({
      outcome: Object.freeze({
        status: "unavailable" as const,
        ventricleId: source.ventricleId,
        reason: source.reason,
      }),
      integrationSlice: null,
    });
  }
  const points = Object.freeze(
    source.points.map((point) => {
      const evaluated = evaluateMainWireCommonPericardiumBindingV1(
        binding,
        chamberVolumesV1(
          source.ventricleId,
          point.volumeMl,
          source.fixedContralateralVolumeMl,
          leftAtrialVolumeMl,
          rightAtrialVolumeMl,
        ),
      );
      const constrainedPressureMmHg =
        point.intrinsicPressureMmHg + evaluated.excessPressureMmHg;
      const result = Object.freeze({
        volumeMl: point.volumeMl,
        intrinsicPressureMmHg: point.intrinsicPressureMmHg,
        commonPericardialExcessPressureMmHg: evaluated.excessPressureMmHg,
        constrainedPressureMmHg,
        totalOccupiedVolumeMl: evaluated.totalOccupiedVolumeM3 * 1e6,
        commonPericardialStoredEnergyJ: evaluated.storedEnergyJ,
        commonPericardialTangentMmHgPerMl:
          (evaluated.pressureDerivativePaPerM3 * 1e-6) / MMHG_TO_PA,
        smoothingBranch: evaluated.smoothingBranch,
      });
      requireFiniteNumericLeavesV1(result, "constrained slice point");
      return result;
    }),
  );
  const zeroPressureVolumeMl = zeroPressureCrossingV1(points);
  if (zeroPressureVolumeMl === null) {
    return Object.freeze({
      outcome: Object.freeze({
        status: "unavailable" as const,
        ventricleId: source.ventricleId,
        reason: "constrained slice does not bracket a zero-pressure crossing",
      }),
      integrationSlice: null,
    });
  }
  const positive = points.filter(
    (point) => point.volumeMl > zeroPressureVolumeMl,
  );
  if (
    positive.some(
      (point, index) =>
        !(point.constrainedPressureMmHg > 0) ||
        (index > 0 &&
          point.constrainedPressureMmHg <
            positive[index - 1]!.constrainedPressureMmHg),
    )
  ) {
    return Object.freeze({
      outcome: Object.freeze({
        status: "unavailable" as const,
        ventricleId: source.ventricleId,
        reason: "positive constrained slice is not monotone",
      }),
      integrationSlice: null,
    });
  }
  const zeroBranchUpperOccupiedVolumeMl =
    binding.parameters.referenceHeartVolumeM3 *
    (1 - COMMON_PERICARDIUM_TRANSITION_HALF_WIDTH_V1) *
    1e6;
  const maximumOccupiedVolumeMl = Math.max(
    ...points.map((point) => point.totalOccupiedVolumeMl),
  );
  const outcome = Object.freeze({
    status: "available" as const,
    ventricleId: source.ventricleId,
    fixedContralateralVentricleId: source.fixedContralateralVentricleId,
    fixedContralateralVolumeMl: source.fixedContralateralVolumeMl,
    fixedLeftAtrialVolumeMl: leftAtrialVolumeMl,
    fixedRightAtrialVolumeMl: rightAtrialVolumeMl,
    commonIntrathoracicPressureMmHg: 0 as const,
    commonPericardiumParameterSetId: binding.parameterSetId,
    zeroPressureVolumeMl,
    maximumSampledVolumeMl: source.maximumSampledVolumeMl,
    zeroBranchUpperOccupiedVolumeMl,
    minimumSlackMarginMl:
      zeroBranchUpperOccupiedVolumeMl - maximumOccupiedVolumeMl,
    allSampledPointsInExactZeroBranch: points.every(
      (point) =>
        point.smoothingBranch === "zero" &&
        point.commonPericardialExcessPressureMmHg === 0,
    ),
    maximumCommonPericardialExcessPressureMmHg: Math.max(
      ...points.map((point) => point.commonPericardialExcessPressureMmHg),
    ),
    points,
  });
  const integrationSlice = Object.freeze({
    ...source,
    zeroPressureVolumeMl,
    points: Object.freeze(
      source.points.map((point, index) =>
        Object.freeze({
          ...point,
          intrinsicPressureMmHg: points[index]!.constrainedPressureMmHg,
        }),
      ),
    ),
  }) satisfies MainWireIntrinsicPassiveCenterSliceV1;
  return Object.freeze({ outcome, integrationSlice });
}

function positiveControlSummaryV1(
  intrinsicComparison: MainWireIntegratedModelPvaDiastolicReferenceComparisonV1,
  leftAtrialVolumeMl: number,
  rightAtrialVolumeMl: number,
): MainWireIntegratedModelPvaCommonPericardiumReferenceV1["positiveControl"] {
  const binding = createMainWireNormalAdultCommonPericardiumV1(
    "on",
    "effusion-300ml-positive-control",
  );
  return Object.freeze({
    caseId: "effusion-300ml-positive-control" as const,
    role: "mechanism-response-check-not-used-in-pva-rows" as const,
    byVentricle: Object.freeze(
      VENTRICLES_V1.map((ventricleId) => {
        const slice = intrinsicComparison.intrinsicSlices.find(
          (candidate) => candidate.ventricleId === ventricleId,
        );
        if (slice?.status !== "available") {
          return Object.freeze({
            ventricleId,
            evaluatedPointCount: 0,
            engagedPointCount: 0,
            minimumExcessPressureMmHg: 0,
            maximumExcessPressureMmHg: 0,
          });
        }
        const pressures = slice.points.map(
          (point) =>
            evaluateMainWireCommonPericardiumBindingV1(
              binding,
              chamberVolumesV1(
                ventricleId,
                point.volumeMl,
                slice.fixedContralateralVolumeMl,
                leftAtrialVolumeMl,
                rightAtrialVolumeMl,
              ),
            ).excessPressureMmHg,
        );
        return Object.freeze({
          ventricleId,
          evaluatedPointCount: pressures.length,
          engagedPointCount: pressures.filter((pressure) => pressure > 0)
            .length,
          minimumExcessPressureMmHg: Math.min(...pressures),
          maximumExcessPressureMmHg: Math.max(...pressures),
        });
      }),
    ),
  });
}

function chamberVolumesV1(
  ventricleId: MainWireIntegratedModelPvaVentricleV1,
  variedVolumeMl: number,
  fixedContralateralVolumeMl: number,
  leftAtrialVolumeMl: number,
  rightAtrialVolumeMl: number,
): Readonly<{ LA: number; LV: number; RA: number; RV: number }> {
  return Object.freeze({
    LA: leftAtrialVolumeMl,
    LV: ventricleId === "LV" ? variedVolumeMl : fixedContralateralVolumeMl,
    RA: rightAtrialVolumeMl,
    RV: ventricleId === "RV" ? variedVolumeMl : fixedContralateralVolumeMl,
  });
}

function zeroPressureCrossingV1(
  points: readonly MainWirePvaCommonPericardiumSlicePointV1[],
): number | null {
  for (let index = 1; index < points.length; index += 1) {
    const left = points[index - 1]!;
    const right = points[index]!;
    if (left.constrainedPressureMmHg === 0) return left.volumeMl;
    if (
      left.constrainedPressureMmHg < 0 &&
      right.constrainedPressureMmHg >= 0
    ) {
      const fraction =
        -left.constrainedPressureMmHg /
        (right.constrainedPressureMmHg - left.constrainedPressureMmHg);
      return left.volumeMl + fraction * (right.volumeMl - left.volumeMl);
    }
  }
  return points.at(-1)?.constrainedPressureMmHg === 0
    ? points.at(-1)!.volumeMl
    : null;
}

function unavailableRowV1(
  source: Extract<
    MainWireIntegratedModelPvaDiastolicReferenceComparisonV1["rows"][number],
    { status: "available" }
  >,
  reason: string,
): MainWirePvaCommonPericardiumComparisonRowV1 {
  return Object.freeze({
    status: "unavailable" as const,
    ventricleId: source.ventricleId,
    beatOrdinal: source.beatOrdinal,
    directionId: source.directionId,
    systolicMethodId: source.systolicMethodId,
    reason,
  });
}

function relationKeyV1(
  ventricleId: MainWireIntegratedModelPvaVentricleV1,
  directionId: "occlusion" | "release",
  methodId: MainWireIntegratedModelPvaSystolicMethodV1,
): string {
  return `${ventricleId}/${directionId}/${methodId}`;
}

function minimumOrNullV1(values: readonly number[]): number | null {
  return values.length === 0 ? null : Math.min(...values);
}

function maximumOrNullV1(values: readonly number[]): number | null {
  return values.length === 0 ? null : Math.max(...values);
}

function maximumOrZeroV1(values: readonly number[]): number {
  return values.length === 0 ? 0 : Math.max(...values);
}

function medianOrNullV1(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1]! + sorted[middle]!) / 2
    : sorted[middle]!;
}

function requireFiniteNumericLeavesV1(value: unknown, label: string): void {
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error(`${label} must be finite`);
    return;
  }
  if (Array.isArray(value)) {
    for (const member of value) requireFiniteNumericLeavesV1(member, label);
    return;
  }
  if (value !== null && typeof value === "object") {
    for (const member of Object.values(value)) {
      requireFiniteNumericLeavesV1(member, label);
    }
  }
}
