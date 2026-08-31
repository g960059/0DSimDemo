import { canonicalCoronaryAutoregulationWindowStartTimeV3 } from "@/engine/coronary/acceptedAutoregulationWindowV3";
import {
  CORONARY_LAYER_IDS_V2,
  CORONARY_TERRITORY_IDS_V2,
} from "@/engine/coronary/typesV2";
import {
  mainWireFiveWallCoronaryBaseStateV2,
  validateMainWireFiveWallCoronaryAcceptedStateV3,
  type MainWireFiveWallCoronaryAcceptedStateV3,
} from "@/engine/myocardium/MainWireFiveWallCoronaryTransactionV3";
import {
  MAIN_WIRE_FIVE_WALL_CORONARY_PERIODIC_CLOSURE_CLAIM_V2,
  MAIN_WIRE_FIVE_WALL_CORONARY_PERIODIC_CLOSURE_V2_ID,
  MAIN_WIRE_FIVE_WALL_CORONARY_PERIODIC_REFERENCE_SCALES_V2,
  classifyMainWireFiveWallCoronaryPeriodicityV2,
  compareMainWireFiveWallCoronaryAcceptedStatesV2,
  type MainWireFiveWallCoronaryPeriodicBeatObservationV2,
  type MainWireFiveWallCoronaryPeriodicBooleanDeltaEntryV2,
  type MainWireFiveWallCoronaryPeriodicClassificationV2,
  type MainWireFiveWallCoronaryPeriodicClassifierOptionsV2,
  type MainWireFiveWallCoronaryPeriodicClosureGroupV2,
  type MainWireFiveWallCoronaryPeriodicClosureReportV2,
  type MainWireFiveWallCoronaryPeriodicEvidenceRoleV2,
  type MainWireFiveWallCoronaryPeriodicNumericDeltaEntryV2,
  type MainWireFiveWallCoronaryPeriodicQuantityV2,
  type MainWireFiveWallCoronaryPeriodicReferenceScalesV2,
  type MainWireFiveWallCoronaryPeriodicUnitV2,
} from "@/engine/myocardium/experiments/MainWireFiveWallCoronaryPeriodicClosureV2";
import type {
  MainWireFiveWallLandTriSegStateV1,
} from "@/engine/myocardium/mechanics/MainWireFiveWallLandTriSegProviderV1";
import type {
  LandSlsWallMaterialStateV1,
} from "@/engine/myocardium/mechanics/landSlsWallMaterialV1";
import { canonicalJsonStringify } from "@/engine/integrity";

export const MAIN_WIRE_FIVE_WALL_CORONARY_PERIODIC_CLOSURE_V3_ID =
  "main-wire-five-wall-coronary-full-accepted-state-periodic-closure-v3" as const;

export const MAIN_WIRE_FIVE_WALL_CORONARY_PERIODIC_CLOSURE_CLAIM_V3 =
  Object.freeze({
    baseComparatorId: MAIN_WIRE_FIVE_WALL_CORONARY_PERIODIC_CLOSURE_V2_ID,
    baseNumericStateCount:
      MAIN_WIRE_FIVE_WALL_CORONARY_PERIODIC_CLOSURE_CLAIM_V2
        .numericClosureEntryCount,
    baseBooleanStateCount:
      MAIN_WIRE_FIVE_WALL_CORONARY_PERIODIC_CLOSURE_CLAIM_V2
        .hiddenBooleanClosureEntryCount,
    autoregulationFlowIntegralStateCount: 6 as const,
    autoregulationPressureIntegralStateCount: 3 as const,
    autoregulationWindowScalarStateCount: 2 as const,
    autoregulationDesiredControlNumericStateCount: 18 as const,
    autoregulationNumericStateCount: 29 as const,
    autoregulationControlBoundBooleanStateCount: 2 as const,
    numericClosureEntryCount: 122 as const,
    hiddenBooleanClosureEntryCount: 3 as const,
    totalClosureEntryCount: 125 as const,
    compatibilityGates: Object.freeze([
      ...MAIN_WIRE_FIVE_WALL_CORONARY_PERIODIC_CLOSURE_CLAIM_V2
        .compatibilityGates,
      "coronary-autoregulation-binding-exact",
      "coronary-autoregulation-non-null-desired-control-id-exact",
      "periodic-sinus-autoregulation-accumulator-empty-at-both-boundaries",
      "coronary-autoregulation-window-provenance-monotonic-and-time-consistent",
    ] as const),
    comparisonBoundaryClock:
      "exact-binding-owned-empty-window-start" as const,
    periodicSinusBoundaryPolicy: "fail-closed-empty-accumulator" as const,
    irregularRhythmP1Applicability: "not-applicable" as const,
  });

/**
 * Fixed dimensional normalizers. They are neither fitting targets nor
 * physiological acceptance limits. At a valid sinus-cycle comparison
 * boundary every V3 accumulator entry is exactly zero; retaining the entries
 * in the closure schema prevents a future hidden owner from escaping the
 * accepted-state dimension contract.
 */
export const MAIN_WIRE_FIVE_WALL_CORONARY_PERIODIC_REFERENCE_SCALES_V3 =
  Object.freeze({
    ...MAIN_WIRE_FIVE_WALL_CORONARY_PERIODIC_REFERENCE_SCALES_V2,
    scaleSetId:
      "normal-adult-fixed-dimensional-reference-scales-coronary-v3" as const,
    coronaryAutoregulationQmTimeIntegralMl: 1,
    coronaryAutoregulationPerfusionPressureTimeIntegralMmHgSec: 100,
    coronaryAutoregulationAcceptedDurationSec: 1,
    coronaryAutoregulationAcceptedStepCount: 1,
    coronaryAutoregulationWindowControlBoundMismatch01: 1,
    coronaryAutoregulationDesiredControlBoundMismatch01: 1,
    coronaryAutoregulationDesiredDemandScale: 1,
    coronaryAutoregulationDesiredHyperemia01: 1,
    coronaryAutoregulationDesiredMinimumToneScale: 1,
  }) satisfies MainWireFiveWallCoronaryPeriodicReferenceScalesV3;

export type MainWireFiveWallCoronaryPeriodicAcceptedStateV3 =
  MainWireFiveWallCoronaryAcceptedStateV3<
    MainWireFiveWallLandTriSegStateV1<LandSlsWallMaterialStateV1>
  >;

export type MainWireFiveWallCoronaryPeriodicClosureGroupV3 =
  | MainWireFiveWallCoronaryPeriodicClosureGroupV2
  | "coronary-autoregulation-window";

export type MainWireFiveWallCoronaryPeriodicQuantityV3 =
  | MainWireFiveWallCoronaryPeriodicQuantityV2
  | "coronary-autoregulation-qm-time-integral"
  | "coronary-autoregulation-perfusion-pressure-time-integral"
  | "coronary-autoregulation-accepted-duration"
  | "coronary-autoregulation-accepted-step-count"
  | "coronary-autoregulation-window-control-bound"
  | "coronary-autoregulation-desired-control-bound"
  | "coronary-autoregulation-desired-demand-scale"
  | "coronary-autoregulation-desired-hyperemia"
  | "coronary-autoregulation-desired-minimum-tone-scale";

export type MainWireFiveWallCoronaryPeriodicUnitV3 =
  | MainWireFiveWallCoronaryPeriodicUnitV2
  | "mmHg*s"
  | "s"
  | "count";

export type MainWireFiveWallCoronaryPeriodicReferenceScalesV3 =
  MainWireFiveWallCoronaryPeriodicReferenceScalesV2 & Readonly<{
    coronaryAutoregulationQmTimeIntegralMl: number;
    coronaryAutoregulationPerfusionPressureTimeIntegralMmHgSec: number;
    coronaryAutoregulationAcceptedDurationSec: number;
    coronaryAutoregulationAcceptedStepCount: number;
    coronaryAutoregulationWindowControlBoundMismatch01: number;
    coronaryAutoregulationDesiredControlBoundMismatch01: number;
    coronaryAutoregulationDesiredDemandScale: number;
    coronaryAutoregulationDesiredHyperemia01: number;
    coronaryAutoregulationDesiredMinimumToneScale: number;
  }>;

export type MainWireFiveWallCoronaryAutoregulationNumericDeltaEntryV3 =
  Readonly<{
    kind: "numeric";
    group: "coronary-autoregulation-window";
    quantity:
      | "coronary-autoregulation-qm-time-integral"
      | "coronary-autoregulation-perfusion-pressure-time-integral"
      | "coronary-autoregulation-accepted-duration"
      | "coronary-autoregulation-accepted-step-count"
      | "coronary-autoregulation-desired-demand-scale"
      | "coronary-autoregulation-desired-hyperemia"
      | "coronary-autoregulation-desired-minimum-tone-scale";
    unit:
      | "mL"
      | "mmHg*s"
      | "s"
      | "count"
      | "dimensionless"
      | "fraction";
    path: string;
    currentValue: number;
    referenceValue: number;
    absoluteDelta: number;
    referenceScale: number;
    normalizedDelta: number;
  }>;

export type MainWireFiveWallCoronaryAutoregulationBooleanDeltaEntryV3 =
  Readonly<{
    kind: "boolean";
    group: "coronary-autoregulation-window";
    quantity:
      | "coronary-autoregulation-window-control-bound"
      | "coronary-autoregulation-desired-control-bound";
    unit: "boolean";
    path:
      | "coronaryAutoregulation.windowControlBound"
      | "coronaryAutoregulation.desiredControlBound";
    currentValue: boolean;
    referenceValue: boolean;
    absoluteDelta: 0 | 1;
    referenceScale: number;
    normalizedDelta: number;
  }>;

export type MainWireFiveWallCoronaryPeriodicNumericDeltaEntryV3 =
  | MainWireFiveWallCoronaryPeriodicNumericDeltaEntryV2
  | MainWireFiveWallCoronaryAutoregulationNumericDeltaEntryV3;

export type MainWireFiveWallCoronaryPeriodicBooleanDeltaEntryV3 =
  | MainWireFiveWallCoronaryPeriodicBooleanDeltaEntryV2
  | MainWireFiveWallCoronaryAutoregulationBooleanDeltaEntryV3;

export type MainWireFiveWallCoronaryPeriodicDeltaEntryV3 =
  | MainWireFiveWallCoronaryPeriodicNumericDeltaEntryV3
  | MainWireFiveWallCoronaryPeriodicBooleanDeltaEntryV3;

export type MainWireFiveWallCoronaryPeriodicClosureGroupReportV3 = Readonly<{
  group: MainWireFiveWallCoronaryPeriodicClosureGroupV3;
  numericEntryCount: number;
  booleanEntryCount: number;
  entryCount: number;
  maximumNormalizedDelta: number;
  worstPath: string;
  worstEntry: MainWireFiveWallCoronaryPeriodicDeltaEntryV3;
}>;

export type MainWireFiveWallCoronaryPeriodicClosureReportV3 = Readonly<{
  closureId: typeof MAIN_WIRE_FIVE_WALL_CORONARY_PERIODIC_CLOSURE_V3_ID;
  referenceScaleSetId: string;
  baseClosure: MainWireFiveWallCoronaryPeriodicClosureReportV2;
  provenance: MainWireFiveWallCoronaryPeriodicClosureReportV2["provenance"]
    & Readonly<{
      currentAutoregulationWindowIndex: number;
      referenceAutoregulationWindowIndex: number;
      autoregulationWindowIndexAdvance: number;
      currentAutoregulationWindowStartAcceptedTimeSec: number;
      referenceAutoregulationWindowStartAcceptedTimeSec: number;
      autoregulationWindowStartAcceptedTimeAdvanceSec: number;
      currentAutoregulationWindowStartRevision: number;
      referenceAutoregulationWindowStartRevision: number;
      autoregulationWindowStartRevisionAdvance: number;
    }>;
  compatibility: MainWireFiveWallCoronaryPeriodicClosureReportV2["compatibility"]
    & Readonly<{
      coronaryAutoregulationBindingCanonicalJson: string;
    }>;
  groups: Readonly<Record<
    MainWireFiveWallCoronaryPeriodicClosureGroupV3,
    MainWireFiveWallCoronaryPeriodicClosureGroupReportV3
  >>;
  overall: Readonly<{
    baseNumericEntryCount: 93;
    autoregulationNumericEntryCount: 29;
    numericEntryCount: 122;
    baseBooleanEntryCount: 1;
    autoregulationBooleanEntryCount: 2;
    booleanEntryCount: 3;
    entryCount: 125;
    maximumNormalizedDelta: number;
    worstGroup: MainWireFiveWallCoronaryPeriodicClosureGroupV3;
    worstPath: string;
    worstEntry: MainWireFiveWallCoronaryPeriodicDeltaEntryV3;
  }>;
}>;

export type MainWireFiveWallCoronarySinglePeriodAssessmentV3 = Readonly<{
  normalizedTolerance: number;
  withinFullAcceptedStateTolerance: boolean;
  period1EvidenceEstablished: false;
  reason:
    | "full-accepted-state-drift-exceeds-tolerance"
    | "single-period-comparison-requires-separate-consecutive-beat-evidence";
}>;

export type MainWireFiveWallCoronaryPeriodicBeatObservationV3 = Readonly<{
  beatIndex: number;
  evidenceRole: MainWireFiveWallCoronaryPeriodicEvidenceRoleV2;
  protocolIdentityHash: string;
  period1: MainWireFiveWallCoronaryPeriodicClosureReportV3 | null;
  period2: MainWireFiveWallCoronaryPeriodicClosureReportV3 | null;
}>;

export type MainWireFiveWallCoronaryPeriodicityInputV3 =
  | Readonly<{
    rhythmInterpretation: "irregular-rhythm-stationary";
  }>
  | Readonly<{
    rhythmInterpretation: "periodic-sinus-cycle-aligned";
    observations: readonly MainWireFiveWallCoronaryPeriodicBeatObservationV3[];
    options: MainWireFiveWallCoronaryPeriodicClassifierOptionsV2;
  }>;

export type MainWireFiveWallCoronaryPeriodicityResultV3 =
  | Readonly<{
    applicability: "not-applicable";
    rhythmInterpretation: "irregular-rhythm-stationary";
    reason: "beat-periodic-P1-classification-is-undefined-for-irregular-rhythm";
    classification: null;
  }>
  | Readonly<{
    applicability: "applicable";
    rhythmInterpretation: "periodic-sinus-cycle-aligned";
    reason: null;
    classification: MainWireFiveWallCoronaryPeriodicClassificationV2;
  }>;

export function compareMainWireFiveWallCoronaryAcceptedStatesV3(
  current: MainWireFiveWallCoronaryPeriodicAcceptedStateV3,
  reference: MainWireFiveWallCoronaryPeriodicAcceptedStateV3,
  scales: MainWireFiveWallCoronaryPeriodicReferenceScalesV3,
): MainWireFiveWallCoronaryPeriodicClosureReportV3 {
  validateScales(scales);
  validateCompatiblePeriodicStates(current, reference);

  const baseClosure = compareMainWireFiveWallCoronaryAcceptedStatesV2(
    mainWireFiveWallCoronaryBaseStateV2(current),
    mainWireFiveWallCoronaryBaseStateV2(reference),
    scales,
  );
  const entries: MainWireFiveWallCoronaryPeriodicDeltaEntryV3[] = [];
  for (const territoryId of CORONARY_TERRITORY_IDS_V2) {
    for (const layerId of CORONARY_LAYER_IDS_V2) {
      entries.push(numericEntry(
        "coronary-autoregulation-qm-time-integral",
        "mL",
        `coronaryAutoregulation.qmTimeIntegralMlByTerritoryLayer.${territoryId}.${layerId}`,
        current.coronaryAutoregulation
          .qmTimeIntegralMlByTerritoryLayer[territoryId][layerId],
        reference.coronaryAutoregulation
          .qmTimeIntegralMlByTerritoryLayer[territoryId][layerId],
        scales.coronaryAutoregulationQmTimeIntegralMl,
      ));
    }
  }
  for (const territoryId of CORONARY_TERRITORY_IDS_V2) {
    entries.push(numericEntry(
      "coronary-autoregulation-perfusion-pressure-time-integral",
      "mmHg*s",
      `coronaryAutoregulation.perfusionPressureTimeIntegralMmHgSecByTerritory.${territoryId}`,
      current.coronaryAutoregulation
        .perfusionPressureTimeIntegralMmHgSecByTerritory[territoryId],
      reference.coronaryAutoregulation
        .perfusionPressureTimeIntegralMmHgSecByTerritory[territoryId],
      scales.coronaryAutoregulationPerfusionPressureTimeIntegralMmHgSec,
    ));
  }
  entries.push(numericEntry(
    "coronary-autoregulation-accepted-duration",
    "s",
    "coronaryAutoregulation.acceptedDurationSec",
    current.coronaryAutoregulation.acceptedDurationSec,
    reference.coronaryAutoregulation.acceptedDurationSec,
    scales.coronaryAutoregulationAcceptedDurationSec,
  ));
  entries.push(numericEntry(
    "coronary-autoregulation-accepted-step-count",
    "count",
    "coronaryAutoregulation.acceptedStepCount",
    current.coronaryAutoregulation.acceptedStepCount,
    reference.coronaryAutoregulation.acceptedStepCount,
    scales.coronaryAutoregulationAcceptedStepCount,
  ));
  entries.push(booleanEntry(
    "coronary-autoregulation-window-control-bound",
    "coronaryAutoregulation.windowControlBound",
    current.coronaryAutoregulation.windowControl !== null,
    reference.coronaryAutoregulation.windowControl !== null,
    scales.coronaryAutoregulationWindowControlBoundMismatch01,
  ));
  const currentDesired = current.coronaryAutoregulation.desiredControl;
  const referenceDesired = reference.coronaryAutoregulation.desiredControl;
  entries.push(booleanEntry(
    "coronary-autoregulation-desired-control-bound",
    "coronaryAutoregulation.desiredControlBound",
    currentDesired !== null,
    referenceDesired !== null,
    scales.coronaryAutoregulationDesiredControlBoundMismatch01,
  ));
  for (const territoryId of CORONARY_TERRITORY_IDS_V2) {
    for (const layerId of CORONARY_LAYER_IDS_V2) {
      entries.push(numericEntry(
        "coronary-autoregulation-desired-demand-scale",
        "dimensionless",
        `coronaryAutoregulation.desiredControl.demandScaleByTerritoryLayer.${territoryId}.${layerId}`,
        currentDesired?.demandScaleByTerritoryLayer[territoryId][layerId] ?? 0,
        referenceDesired?.demandScaleByTerritoryLayer[territoryId][layerId]
          ?? 0,
        scales.coronaryAutoregulationDesiredDemandScale,
      ));
      entries.push(numericEntry(
        "coronary-autoregulation-desired-hyperemia",
        "fraction",
        `coronaryAutoregulation.desiredControl.hyperemia01ByTerritoryLayer.${territoryId}.${layerId}`,
        currentDesired?.hyperemia01ByTerritoryLayer[territoryId][layerId] ?? 0,
        referenceDesired?.hyperemia01ByTerritoryLayer[territoryId][layerId]
          ?? 0,
        scales.coronaryAutoregulationDesiredHyperemia01,
      ));
      entries.push(numericEntry(
        "coronary-autoregulation-desired-minimum-tone-scale",
        "dimensionless",
        `coronaryAutoregulation.desiredControl.effectiveMinimumToneScaleByTerritoryLayer.${territoryId}.${layerId}`,
        currentDesired
          ?.effectiveMinimumToneScaleByTerritoryLayer[territoryId][layerId]
          ?? 0,
        referenceDesired
          ?.effectiveMinimumToneScaleByTerritoryLayer[territoryId][layerId]
          ?? 0,
        scales.coronaryAutoregulationDesiredMinimumToneScale,
      ));
    }
  }

  const autoregulationGroup = groupReport(entries);
  const groups = Object.freeze({
    ...baseClosure.groups,
    "coronary-autoregulation-window": autoregulationGroup,
  }) as MainWireFiveWallCoronaryPeriodicClosureReportV3["groups"];
  const baseWorst = baseClosure.groups[baseClosure.overall.worstGroup];
  const worst = autoregulationGroup.maximumNormalizedDelta
      > baseWorst.maximumNormalizedDelta
    ? autoregulationGroup
    : baseWorst;
  const numericEntryCount = baseClosure.overall.numericEntryCount
    + autoregulationGroup.numericEntryCount;
  const booleanEntryCount = baseClosure.overall.booleanEntryCount
    + autoregulationGroup.booleanEntryCount;
  if (numericEntryCount !== 122 || booleanEntryCount !== 3) {
    throw new Error(
      "coronary V3 full accepted-state closure dimension changed",
    );
  }

  const currentAutoregulation = current.coronaryAutoregulation;
  const referenceAutoregulation = reference.coronaryAutoregulation;
  return Object.freeze({
    closureId: MAIN_WIRE_FIVE_WALL_CORONARY_PERIODIC_CLOSURE_V3_ID,
    referenceScaleSetId: scales.scaleSetId,
    baseClosure,
    provenance: Object.freeze({
      ...baseClosure.provenance,
      currentAutoregulationWindowIndex:
        currentAutoregulation.windowIndex,
      referenceAutoregulationWindowIndex:
        referenceAutoregulation.windowIndex,
      autoregulationWindowIndexAdvance:
        currentAutoregulation.windowIndex
        - referenceAutoregulation.windowIndex,
      currentAutoregulationWindowStartAcceptedTimeSec:
        currentAutoregulation.windowStartAcceptedTimeSec,
      referenceAutoregulationWindowStartAcceptedTimeSec:
        referenceAutoregulation.windowStartAcceptedTimeSec,
      autoregulationWindowStartAcceptedTimeAdvanceSec:
        currentAutoregulation.windowStartAcceptedTimeSec
        - referenceAutoregulation.windowStartAcceptedTimeSec,
      currentAutoregulationWindowStartRevision:
        currentAutoregulation.windowStartRevision,
      referenceAutoregulationWindowStartRevision:
        referenceAutoregulation.windowStartRevision,
      autoregulationWindowStartRevisionAdvance:
        currentAutoregulation.windowStartRevision
        - referenceAutoregulation.windowStartRevision,
    }),
    compatibility: Object.freeze({
      ...baseClosure.compatibility,
      coronaryAutoregulationBindingCanonicalJson:
        canonicalJsonStringify(current.coronaryAutoregulationBinding),
    }),
    groups,
    overall: Object.freeze({
      baseNumericEntryCount: 93 as const,
      autoregulationNumericEntryCount: 29 as const,
      numericEntryCount: 122 as const,
      baseBooleanEntryCount: 1 as const,
      autoregulationBooleanEntryCount: 2 as const,
      booleanEntryCount: 3 as const,
      entryCount: 125 as const,
      maximumNormalizedDelta: worst.maximumNormalizedDelta,
      worstGroup: worst.group,
      worstPath: worst.worstPath,
      worstEntry: worst.worstEntry,
    }),
  });
}

export function assessMainWireFiveWallCoronarySinglePeriodClosureV3(
  report: MainWireFiveWallCoronaryPeriodicClosureReportV3,
  normalizedTolerance: number,
): MainWireFiveWallCoronarySinglePeriodAssessmentV3 {
  validateClosureReport(report);
  if (!Number.isFinite(normalizedTolerance) || normalizedTolerance < 0) {
    throw new Error(
      "normalized closure tolerance must be nonnegative and finite",
    );
  }
  const within = report.overall.maximumNormalizedDelta <= normalizedTolerance;
  return Object.freeze({
    normalizedTolerance,
    withinFullAcceptedStateTolerance: within,
    period1EvidenceEstablished: false as const,
    reason: within
      ? "single-period-comparison-requires-separate-consecutive-beat-evidence" as const
      : "full-accepted-state-drift-exceeds-tolerance" as const,
  });
}

/**
 * Irregular rhythm exits before observation or classifier-option validation:
 * beat-periodic P1/P2 is undefined there. Periodic sinus reuses the audited V2
 * classifier after validating V3 window provenance and projecting each full
 * V3 report to its V2 closure capsule.
 */
export function classifyMainWireFiveWallCoronaryPeriodicityV3(
  input: MainWireFiveWallCoronaryPeriodicityInputV3,
): MainWireFiveWallCoronaryPeriodicityResultV3 {
  if (input.rhythmInterpretation === "irregular-rhythm-stationary") {
    return Object.freeze({
      applicability: "not-applicable" as const,
      rhythmInterpretation: "irregular-rhythm-stationary" as const,
      reason:
        "beat-periodic-P1-classification-is-undefined-for-irregular-rhythm" as const,
      classification: null,
    });
  }
  validateObservations(input.observations);
  const projected = input.observations.map((observation) => Object.freeze({
    beatIndex: observation.beatIndex,
    evidenceRole: observation.evidenceRole,
    protocolIdentityHash: observation.protocolIdentityHash,
    period1: observation.period1 === null
      ? null
      : projectClosureReportV2(observation.period1),
    period2: observation.period2 === null
      ? null
      : projectClosureReportV2(observation.period2),
  }) satisfies MainWireFiveWallCoronaryPeriodicBeatObservationV2);
  return Object.freeze({
    applicability: "applicable" as const,
    rhythmInterpretation: "periodic-sinus-cycle-aligned" as const,
    reason: null,
    classification: classifyMainWireFiveWallCoronaryPeriodicityV2(
      projected,
      input.options,
    ),
  });
}

function validateCompatiblePeriodicStates(
  current: MainWireFiveWallCoronaryPeriodicAcceptedStateV3,
  reference: MainWireFiveWallCoronaryPeriodicAcceptedStateV3,
): void {
  validateMainWireFiveWallCoronaryAcceptedStateV3(current);
  validateMainWireFiveWallCoronaryAcceptedStateV3(reference);
  const currentBinding = current.coronaryAutoregulationBinding;
  const referenceBinding = reference.coronaryAutoregulationBinding;
  if (currentBinding.windowPolicy.interpretation
      !== "periodic-sinus-cycle-aligned"
    || referenceBinding.windowPolicy.interpretation
      !== "periodic-sinus-cycle-aligned") {
    throw new Error(
      "coronary V3 beat-periodic closure is not applicable to irregular rhythm",
    );
  }
  if (canonicalJsonStringify(currentBinding)
      !== canonicalJsonStringify(referenceBinding)) {
    throw new Error(
      "coronary V3 periodic closure autoregulation binding compatibility differs",
    );
  }
  const currentDesired = current.coronaryAutoregulation.desiredControl;
  const referenceDesired = reference.coronaryAutoregulation.desiredControl;
  if (currentDesired !== null && referenceDesired !== null
    && currentDesired.controlId !== referenceDesired.controlId) {
    throw new Error(
      "coronary V3 periodic closure desired-control identity differs",
    );
  }
  validateAutoregulationSchema(current, "current");
  validateAutoregulationSchema(reference, "reference");
  requireEmptyPeriodicBoundary(current, "current");
  requireEmptyPeriodicBoundary(reference, "reference");

  const currentWindow = current.coronaryAutoregulation;
  const referenceWindow = reference.coronaryAutoregulation;
  if (currentWindow.windowStartRevision !== current.revision
    || referenceWindow.windowStartRevision !== reference.revision) {
    throw new Error(
      "coronary V3 periodic boundary window provenance does not own the accepted revision",
    );
  }
  const windowIndexAdvance = currentWindow.windowIndex
    - referenceWindow.windowIndex;
  const windowStartRevisionAdvance = currentWindow.windowStartRevision
    - referenceWindow.windowStartRevision;
  if (
    !Number.isSafeInteger(currentWindow.windowIndex)
    || !Number.isSafeInteger(referenceWindow.windowIndex)
    || !Number.isSafeInteger(windowIndexAdvance)
    || windowIndexAdvance <= 0
    || windowStartRevisionAdvance <= 0
  ) {
    throw new Error(
      "coronary V3 periodic closure window provenance is not strictly advancing",
    );
  }
  // Each state was already checked against the binding-owned absolute
  // window lattice. Subtracting two late absolute clocks to reconstruct the
  // short interval loses precision; the integer index advance is authoritative.
}

function requireEmptyPeriodicBoundary(
  state: MainWireFiveWallCoronaryPeriodicAcceptedStateV3,
  label: string,
): void {
  const window = state.coronaryAutoregulation;
  const ownedWindowStartAcceptedTimeSec =
    canonicalCoronaryAutoregulationWindowStartTimeV3(
      state.coronaryAutoregulationBinding,
      window.windowIndex,
    );
  const empty = nearlyEqual(
    state.acceptedTimeSec,
    ownedWindowStartAcceptedTimeSec,
  )
    && window.windowStartAcceptedTimeSec === ownedWindowStartAcceptedTimeSec
    && window.windowOriginAcceptedTimeSec
      === state.coronaryAutoregulationBinding.windowPolicy
        .originAcceptedTimeSec
    && window.acceptedDurationSec === 0
    && window.acceptedStepCount === 0
    && window.windowControl === null
    && CORONARY_TERRITORY_IDS_V2.every((territoryId) =>
      CORONARY_LAYER_IDS_V2.every((layerId) =>
        window.qmTimeIntegralMlByTerritoryLayer[territoryId][layerId] === 0)
      && window.perfusionPressureTimeIntegralMmHgSecByTerritory[territoryId]
        === 0);
  if (!empty) {
    throw new Error(
      `${label} coronary V3 periodic boundary autoregulation accumulator is not empty or not at its exact owned boundary`,
    );
  }
}

function validateAutoregulationSchema(
  state: MainWireFiveWallCoronaryPeriodicAcceptedStateV3,
  label: string,
): void {
  const window = state.coronaryAutoregulation;
  assertExactKeys(
    window.qmTimeIntegralMlByTerritoryLayer,
    CORONARY_TERRITORY_IDS_V2,
    `${label} autoregulation Qm territories`,
  );
  assertExactKeys(
    window.perfusionPressureTimeIntegralMmHgSecByTerritory,
    CORONARY_TERRITORY_IDS_V2,
    `${label} autoregulation pressure territories`,
  );
  for (const territoryId of CORONARY_TERRITORY_IDS_V2) {
    assertExactKeys(
      window.qmTimeIntegralMlByTerritoryLayer[territoryId],
      CORONARY_LAYER_IDS_V2,
      `${label} autoregulation Qm ${territoryId} layers`,
    );
  }
}

function numericEntry(
  quantity: MainWireFiveWallCoronaryAutoregulationNumericDeltaEntryV3["quantity"],
  unit: MainWireFiveWallCoronaryAutoregulationNumericDeltaEntryV3["unit"],
  path: string,
  currentValue: number,
  referenceValue: number,
  referenceScale: number,
): MainWireFiveWallCoronaryAutoregulationNumericDeltaEntryV3 {
  requireFinite(currentValue, `${path} current value`);
  requireFinite(referenceValue, `${path} reference value`);
  const absoluteDelta = Math.abs(currentValue - referenceValue);
  requireFinite(absoluteDelta, `${path} absolute delta`);
  return Object.freeze({
    kind: "numeric" as const,
    group: "coronary-autoregulation-window" as const,
    quantity,
    unit,
    path,
    currentValue,
    referenceValue,
    absoluteDelta,
    referenceScale,
    normalizedDelta: absoluteDelta / referenceScale,
  });
}

function booleanEntry(
  quantity: MainWireFiveWallCoronaryAutoregulationBooleanDeltaEntryV3[
    "quantity"
  ],
  path: MainWireFiveWallCoronaryAutoregulationBooleanDeltaEntryV3["path"],
  currentValue: boolean,
  referenceValue: boolean,
  referenceScale: number,
): MainWireFiveWallCoronaryAutoregulationBooleanDeltaEntryV3 {
  const absoluteDelta = currentValue === referenceValue
    ? 0 as const
    : 1 as const;
  return Object.freeze({
    kind: "boolean" as const,
    group: "coronary-autoregulation-window" as const,
    quantity,
    unit: "boolean" as const,
    path,
    currentValue,
    referenceValue,
    absoluteDelta,
    referenceScale,
    normalizedDelta: absoluteDelta / referenceScale,
  });
}

function groupReport(
  entries: readonly MainWireFiveWallCoronaryPeriodicDeltaEntryV3[],
): MainWireFiveWallCoronaryPeriodicClosureGroupReportV3 {
  const first = entries[0];
  if (first === undefined) {
    throw new Error("coronary V3 autoregulation closure group is empty");
  }
  const worst = entries.reduce((candidate, entry) =>
    entry.normalizedDelta > candidate.normalizedDelta ? entry : candidate,
  first);
  const numericEntryCount = entries.filter((entry) =>
    entry.kind === "numeric").length;
  const booleanEntryCount = entries.length - numericEntryCount;
  if (numericEntryCount !== 29 || booleanEntryCount !== 2) {
    throw new Error("coronary V3 autoregulation closure dimension changed");
  }
  return Object.freeze({
    group: "coronary-autoregulation-window" as const,
    numericEntryCount,
    booleanEntryCount,
    entryCount: entries.length,
    maximumNormalizedDelta: worst.normalizedDelta,
    worstPath: worst.path,
    worstEntry: worst,
  });
}

function validateScales(
  scales: MainWireFiveWallCoronaryPeriodicReferenceScalesV3,
): void {
  if (typeof scales.scaleSetId !== "string" || scales.scaleSetId.length === 0) {
    throw new Error("coronary V3 periodic scaleSetId must be non-empty");
  }
  for (const [name, value] of Object.entries(scales)) {
    if (name !== "scaleSetId") {
      requirePositiveFinite(
        value as number,
        `coronary V3 periodic reference scale ${name}`,
      );
    }
  }
}

function validateClosureReport(
  report: MainWireFiveWallCoronaryPeriodicClosureReportV3,
): void {
  if (report.closureId
      !== MAIN_WIRE_FIVE_WALL_CORONARY_PERIODIC_CLOSURE_V3_ID
    || report.baseClosure.closureId
      !== MAIN_WIRE_FIVE_WALL_CORONARY_PERIODIC_CLOSURE_V2_ID) {
    throw new Error("unsupported coronary V3 periodic closure report");
  }
  if (report.referenceScaleSetId !== report.baseClosure.referenceScaleSetId) {
    throw new Error("coronary V3 closure reference scale identity differs");
  }
  const group = report.groups["coronary-autoregulation-window"];
  if (report.overall.baseNumericEntryCount !== 93
    || report.overall.autoregulationNumericEntryCount !== 29
    || report.overall.numericEntryCount !== 122
    || report.overall.baseBooleanEntryCount !== 1
    || report.overall.autoregulationBooleanEntryCount !== 2
    || report.overall.booleanEntryCount !== 3
    || report.overall.entryCount !== 125
    || group.numericEntryCount !== 29
    || group.booleanEntryCount !== 2
    || group.entryCount !== 31) {
    throw new Error("coronary V3 closure report state dimension is invalid");
  }
  requireFinite(
    report.overall.maximumNormalizedDelta,
    "coronary V3 closure delta",
  );
  if (report.overall.maximumNormalizedDelta < 0) {
    throw new Error(
      "coronary V3 periodic closure report contains a negative delta",
    );
  }
  if (report.provenance.autoregulationWindowIndexAdvance <= 0
    || report.provenance.autoregulationWindowStartRevisionAdvance <= 0) {
    throw new Error(
      "coronary V3 closure report window provenance is not strictly advancing",
    );
  }
  const provenance = report.provenance;
  if (!Number.isInteger(provenance.currentAutoregulationWindowIndex)
    || !Number.isInteger(provenance.referenceAutoregulationWindowIndex)
    || !Number.isInteger(
      provenance.currentAutoregulationWindowStartRevision,
    )
    || !Number.isInteger(
      provenance.referenceAutoregulationWindowStartRevision,
    )
    || provenance.currentAutoregulationWindowIndex
      - provenance.referenceAutoregulationWindowIndex
      !== provenance.autoregulationWindowIndexAdvance
    || provenance.currentAutoregulationWindowStartRevision
      - provenance.referenceAutoregulationWindowStartRevision
      !== provenance.autoregulationWindowStartRevisionAdvance
    || !nearlyEqual(
      provenance.currentAutoregulationWindowStartAcceptedTimeSec
        - provenance.referenceAutoregulationWindowStartAcceptedTimeSec,
      provenance.autoregulationWindowStartAcceptedTimeAdvanceSec,
    )
    || provenance.currentAutoregulationWindowStartRevision
      !== provenance.currentRevision
    || provenance.referenceAutoregulationWindowStartRevision
      !== provenance.referenceRevision
    || !nearlyEqual(
      provenance.currentAutoregulationWindowStartAcceptedTimeSec,
      provenance.currentAcceptedTimeSec,
    )
    || !nearlyEqual(
      provenance.referenceAutoregulationWindowStartAcceptedTimeSec,
      provenance.referenceAcceptedTimeSec,
    )) {
    throw new Error(
      "coronary V3 closure report window provenance is internally inconsistent",
    );
  }
  if (report.compatibility.coronaryAutoregulationBindingCanonicalJson
      .length === 0) {
    throw new Error("coronary V3 closure autoregulation binding is missing");
  }
}

function validateObservations(
  observations: readonly MainWireFiveWallCoronaryPeriodicBeatObservationV3[],
): void {
  let bindingCanonicalJson: string | null = null;
  let previous:
    MainWireFiveWallCoronaryPeriodicBeatObservationV3 | null = null;
  for (const observation of observations) {
    for (const report of [observation.period1, observation.period2]) {
      if (report === null) continue;
      validateClosureReport(report);
      bindingCanonicalJson ??=
        report.compatibility.coronaryAutoregulationBindingCanonicalJson;
      if (report.compatibility.coronaryAutoregulationBindingCanonicalJson
          !== bindingCanonicalJson) {
        throw new Error(
          "coronary V3 observations use different autoregulation bindings",
        );
      }
    }
    if (observation.period1 !== null && observation.period2 !== null
      && currentAutoregulationProvenance(observation.period1)
        !== currentAutoregulationProvenance(observation.period2)) {
      throw new Error(
        "coronary V3 period1 and period2 current window provenance differs",
      );
    }
    if (previous !== null
      && observation.beatIndex === previous.beatIndex + 1) {
      validateConsecutiveAutoregulationProvenance(previous, observation);
    }
    previous = observation;
  }
}

function validateConsecutiveAutoregulationProvenance(
  previous: MainWireFiveWallCoronaryPeriodicBeatObservationV3,
  current: MainWireFiveWallCoronaryPeriodicBeatObservationV3,
): void {
  if (previous.period1 !== null && current.period1 !== null
    && currentAutoregulationProvenance(previous.period1)
      !== referenceAutoregulationProvenance(current.period1)) {
    throw new Error(
      "coronary V3 consecutive P1 window provenance chain is discontinuous",
    );
  }
  if (previous.period1 !== null && current.period2 !== null
    && referenceAutoregulationProvenance(previous.period1)
      !== referenceAutoregulationProvenance(current.period2)) {
    throw new Error(
      "coronary V3 P2 window provenance does not reference the two-back boundary",
    );
  }
}

function currentAutoregulationProvenance(
  report: MainWireFiveWallCoronaryPeriodicClosureReportV3,
): string {
  return canonicalJsonStringify(Object.freeze({
    windowIndex: report.provenance.currentAutoregulationWindowIndex,
    windowStartAcceptedTimeSec:
      report.provenance.currentAutoregulationWindowStartAcceptedTimeSec,
    windowStartRevision:
      report.provenance.currentAutoregulationWindowStartRevision,
  }));
}

function referenceAutoregulationProvenance(
  report: MainWireFiveWallCoronaryPeriodicClosureReportV3,
): string {
  return canonicalJsonStringify(Object.freeze({
    windowIndex: report.provenance.referenceAutoregulationWindowIndex,
    windowStartAcceptedTimeSec:
      report.provenance.referenceAutoregulationWindowStartAcceptedTimeSec,
    windowStartRevision:
      report.provenance.referenceAutoregulationWindowStartRevision,
  }));
}

function projectClosureReportV2(
  report: MainWireFiveWallCoronaryPeriodicClosureReportV3,
): MainWireFiveWallCoronaryPeriodicClosureReportV2 {
  return Object.freeze({
    ...report.baseClosure,
    overall: Object.freeze({
      ...report.baseClosure.overall,
      maximumNormalizedDelta: report.overall.maximumNormalizedDelta,
    }),
  });
}

function assertExactKeys(
  value: object,
  keys: readonly string[],
  label: string,
): void {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  if (actual.length !== expected.length
    || actual.some((key, index) => key !== expected[index])) {
    throw new Error(`${label} keys differ from the accepted schema`);
  }
}

function nearlyEqual(left: number, right: number): boolean {
  return Math.abs(left - right) <= 64 * Number.EPSILON
    * Math.max(1, Math.abs(left), Math.abs(right));
}

function requirePositiveFinite(value: number, label: string): void {
  requireFinite(value, label);
  if (!(value > 0)) throw new Error(`${label} must be positive`);
}

function requireFinite(value: number, label: string): void {
  if (!Number.isFinite(value)) throw new Error(`${label} must be finite`);
}
