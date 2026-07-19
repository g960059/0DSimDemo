import {
  NON_CORONARY_NODE_NAMES_V1,
} from "@/engine/core/nonCoronaryCirculationBackwardEulerV1";
import {
  CORONARY_CONSERVED_VOLUME_NODE_IDS_V2,
  CORONARY_LAYER_IDS_V2,
  CORONARY_TERRITORY_IDS_V2,
} from "@/engine/coronary/typesV2";
import {
  MAIN_WIRE_FIVE_WALL_CORONARY_TRANSACTION_V2_ID,
  type MainWireFiveWallCoronaryAcceptedStateV2,
} from "@/engine/myocardium/MainWireFiveWallCoronaryTransactionV2";
import {
  MAIN_WIRE_FIVE_WALL_NONCORONARY_TRANSACTION_V1_ID,
} from "@/engine/myocardium/MainWireFiveWallNonCoronaryTransactionV1";
import {
  MAIN_WIRE_FIVE_WALL_PERIODIC_CLOSURE_V1_ID,
  MAIN_WIRE_FIVE_WALL_PERIODIC_REFERENCE_SCALES_V1,
  compareMainWireFiveWallAcceptedStatesV1,
  type MainWireFiveWallPeriodicAcceptedStateV1,
  type MainWireFiveWallPeriodicClosureGroupV1,
  type MainWireFiveWallPeriodicClosureGroupReportV1,
  type MainWireFiveWallPeriodicDeltaEntryV1,
  type MainWireFiveWallPeriodicQuantityV1,
  type MainWireFiveWallPeriodicReferenceScalesV1,
  type MainWireFiveWallPeriodicUnitV1,
} from "@/engine/myocardium/experiments/MainWireFiveWallPeriodicClosureV1";
import {
  type MainWireFiveWallLandTriSegStateV1,
} from "@/engine/myocardium/mechanics/MainWireFiveWallLandTriSegProviderV1";
import type {
  LandSlsWallMaterialStateV1,
} from "@/engine/myocardium/mechanics/landSlsWallMaterialV1";
import { canonicalJsonStringify } from "@/engine/scientific/release";

export const MAIN_WIRE_FIVE_WALL_CORONARY_PERIODIC_CLOSURE_V2_ID =
  "main-wire-five-wall-coronary-full-accepted-state-periodic-closure-v2" as const;

export const MAIN_WIRE_FIVE_WALL_CORONARY_PERIODIC_CLOSURE_CLAIM_V2 =
  Object.freeze({
    legacyComparatorId: MAIN_WIRE_FIVE_WALL_PERIODIC_CLOSURE_V1_ID,
    legacyNumericStateCount: 68 as const,
    coronaryConservedVolumeStateCount: 16 as const,
    coronaryToneStateCount: 6 as const,
    mvcReferenceStrainStateCount: 3 as const,
    numericClosureEntryCount: 93 as const,
    hiddenBooleanClosureEntryCount: 1 as const,
    totalClosureEntryCount: 94 as const,
    compatibilityGates: Object.freeze([
      "coronary-binding-exact",
      "fixed-global-tbv-exact",
      "mechanics-provider-identity-exact",
    ] as const),
    metadataExcludedFromClosureDelta: Object.freeze([
      "accepted-time",
      "accepted-revision",
      "mvc-reference-accepted-time",
      "mvc-reference-revision",
      "accepted-mitral-closure-event-count",
    ] as const),
    metadataRequirement: "monotonic-provenance" as const,
    rapidSettlingBeatRange: Object.freeze([2, 5] as const),
    rapidSettlingEvidenceRole: "presentation-only" as const,
    rapidSettlingCanEstablishP1: false as const,
    classifierAcceptedEvidenceRole:
      "canonical-periodic-protocol" as const,
    classifierProtocolIdentityGate:
      "lowercase-sha256-consistency-preimage-bound-by-canonical-runner" as const,
    period1Period2CurrentProvenanceGate:
      "exact-within-each-observation" as const,
    consecutiveObservationProvenanceGate:
      "exact-p1-current-to-next-reference-and-p2-two-back-chain" as const,
    minimumConsecutiveClassificationBeats: 3 as const,
    p1EvidenceBoundary:
      "separate-consecutive-beat-classification-over-complete-v2-closure-reports" as const,
    singlePeriodComparisonCanEstablishP1: false as const,
  });

/**
 * Fixed dimensional normalizers, never instantaneous denominators, fitting
 * targets, or physiological acceptance limits. The 1 mL coronary-volume and
 * unit tone scales make their raw drift directly readable; 0.1 log-strain is
 * inherited from the wall-history scale. A boolean mismatch remains exactly
 * one normalized unit and therefore cannot be hidden by numeric averaging.
 */
export const MAIN_WIRE_FIVE_WALL_CORONARY_PERIODIC_REFERENCE_SCALES_V2 =
  Object.freeze({
    ...MAIN_WIRE_FIVE_WALL_PERIODIC_REFERENCE_SCALES_V1,
    scaleSetId:
      "normal-adult-fixed-dimensional-reference-scales-coronary-v2" as const,
    coronaryConservedNodeVolumeMl: 1,
    coronaryToneResistanceScale: 1,
    mvcReferenceFiberLogStrain: 0.1,
    mitralForwardFlowActiveMismatch01: 1,
  }) satisfies MainWireFiveWallCoronaryPeriodicReferenceScalesV2;

export type MainWireFiveWallCoronaryPeriodicAcceptedStateV2 =
  MainWireFiveWallCoronaryAcceptedStateV2<
    MainWireFiveWallLandTriSegStateV1<LandSlsWallMaterialStateV1>
  >;

export type MainWireFiveWallCoronaryPeriodicClosureGroupV2 =
  | MainWireFiveWallPeriodicClosureGroupV1
  | "coronary-node-volume"
  | "coronary-tone"
  | "mvc-reference-strain"
  | "mvc-phase-memory";

export type MainWireFiveWallCoronaryPeriodicQuantityV2 =
  | MainWireFiveWallPeriodicQuantityV1
  | "coronary-node-volume"
  | "coronary-tone-resistance-scale"
  | "mvc-reference-fiber-log-strain"
  | "mitral-forward-flow-active";

export type MainWireFiveWallCoronaryPeriodicUnitV2 =
  | MainWireFiveWallPeriodicUnitV1
  | "boolean";

export type MainWireFiveWallCoronaryPeriodicReferenceScalesV2 =
  MainWireFiveWallPeriodicReferenceScalesV1 & Readonly<{
    coronaryConservedNodeVolumeMl: number;
    coronaryToneResistanceScale: number;
    mvcReferenceFiberLogStrain: number;
    mitralForwardFlowActiveMismatch01: number;
  }>;

export type MainWireFiveWallCoronaryPeriodicNumericDeltaEntryV2 = Readonly<{
  kind: "numeric";
  group: MainWireFiveWallCoronaryPeriodicClosureGroupV2;
  quantity: MainWireFiveWallCoronaryPeriodicQuantityV2;
  unit: Exclude<MainWireFiveWallCoronaryPeriodicUnitV2, "boolean">;
  path: string;
  currentValue: number;
  referenceValue: number;
  absoluteDelta: number;
  referenceScale: number;
  normalizedDelta: number;
}>;

export type MainWireFiveWallCoronaryPeriodicBooleanDeltaEntryV2 = Readonly<{
  kind: "boolean";
  group: "mvc-phase-memory";
  quantity: "mitral-forward-flow-active";
  unit: "boolean";
  path: "mvcReferenceState.mitralForwardFlowActive";
  currentValue: boolean;
  referenceValue: boolean;
  absoluteDelta: 0 | 1;
  referenceScale: number;
  normalizedDelta: number;
}>;

export type MainWireFiveWallCoronaryPeriodicDeltaEntryV2 =
  | MainWireFiveWallCoronaryPeriodicNumericDeltaEntryV2
  | MainWireFiveWallCoronaryPeriodicBooleanDeltaEntryV2;

export type MainWireFiveWallCoronaryPeriodicClosureGroupReportV2 = Readonly<{
  group: MainWireFiveWallCoronaryPeriodicClosureGroupV2;
  numericEntryCount: number;
  booleanEntryCount: number;
  entryCount: number;
  maximumNormalizedDelta: number;
  worstPath: string;
  worstEntry: MainWireFiveWallCoronaryPeriodicDeltaEntryV2;
}>;

export type MainWireFiveWallCoronaryPeriodicClosureReportV2 = Readonly<{
  closureId: typeof MAIN_WIRE_FIVE_WALL_CORONARY_PERIODIC_CLOSURE_V2_ID;
  referenceScaleSetId: string;
  legacyClosure: ReturnType<typeof compareMainWireFiveWallAcceptedStatesV1>;
  provenance: Readonly<{
    currentRevision: number;
    referenceRevision: number;
    revisionAdvance: number;
    currentAcceptedTimeSec: number;
    referenceAcceptedTimeSec: number;
    elapsedTimeSec: number;
    currentMvcReferenceRevision: number;
    referenceMvcReferenceRevision: number;
    mvcReferenceRevisionAdvance: number;
    currentMvcReferenceAcceptedTimeSec: number;
    referenceMvcReferenceAcceptedTimeSec: number;
    mvcReferenceAcceptedTimeAdvanceSec: number;
    currentMitralClosureEventCount: number;
    referenceMitralClosureEventCount: number;
    mitralClosureEventCountAdvance: number;
  }>;
  compatibility: Readonly<{
    fixedGlobalTotalBloodVolumeMl: number;
    coronaryBindingCanonicalJson: string;
    mechanicsProviderIdentity: Readonly<{
      contractId: string;
      providerId: string;
      parameterSetId: string;
      parameterIdentityHash: string;
      stateSchemaVersion: number;
    }>;
  }>;
  groups: Readonly<Record<
    MainWireFiveWallCoronaryPeriodicClosureGroupV2,
    MainWireFiveWallCoronaryPeriodicClosureGroupReportV2
  >>;
  overall: Readonly<{
    legacyNumericEntryCount: 68;
    coronaryNumericEntryCount: 25;
    numericEntryCount: 93;
    booleanEntryCount: 1;
    entryCount: 94;
    maximumNormalizedDelta: number;
    worstGroup: MainWireFiveWallCoronaryPeriodicClosureGroupV2;
    worstPath: string;
    worstEntry: MainWireFiveWallCoronaryPeriodicDeltaEntryV2;
  }>;
}>;

export type MainWireFiveWallCoronarySinglePeriodAssessmentV2 = Readonly<{
  normalizedTolerance: number;
  withinFullAcceptedStateTolerance: boolean;
  period1EvidenceEstablished: false;
  reason:
    | "full-accepted-state-drift-exceeds-tolerance"
    | "single-period-comparison-requires-separate-consecutive-beat-evidence";
}>;

export type MainWireFiveWallCoronaryPeriodicEvidenceRoleV2 =
  | "canonical-periodic-protocol"
  | "rapid-presentation-only";

export type MainWireFiveWallCoronaryPeriodicBeatObservationV2 = Readonly<{
  beatIndex: number;
  evidenceRole: MainWireFiveWallCoronaryPeriodicEvidenceRoleV2;
  /** Stable digest of runtime, disease, pericardium, calcium, and valve inputs. */
  protocolIdentityHash: string;
  period1: MainWireFiveWallCoronaryPeriodicClosureReportV2 | null;
  period2: MainWireFiveWallCoronaryPeriodicClosureReportV2 | null;
}>;

export type MainWireFiveWallCoronaryPeriodicClassificationStatusV2 =
  | "period1-converged"
  | "period2-suspect"
  | "not-converged";

export type MainWireFiveWallCoronaryPeriodicClassifierOptionsV2 = Readonly<{
  period1NormalizedTolerance: number;
  period2NormalizedTolerance: number;
  /** Alternating endpoints must remain at least this far apart over P1. */
  period2MinimumPeriod1NormalizedDelta: number;
  /** Must be at least three; rapid-presentation observations never qualify. */
  consecutiveBeats: number;
}>;

export type MainWireFiveWallCoronaryPeriodicClassificationV2 = Readonly<{
  status: MainWireFiveWallCoronaryPeriodicClassificationStatusV2;
  latestBeatIndex: number | null;
  consecutiveBeatsRequired: number;
  minimumConsecutiveBeats: 3;
  acceptedEvidenceRole: "canonical-periodic-protocol";
  evidenceBeatIndices: readonly number[];
  latestPeriod1MaximumNormalizedDelta: number | null;
  latestPeriod2MaximumNormalizedDelta: number | null;
}>;

const LEGACY_GROUP_ORDER = Object.freeze([
  "circulation-node-volume",
  "dynamic-edge-flow",
  "valve-opening",
  "triseg-coordinate",
  "land-state",
  "sls-viscous-strain",
  "wall-input-history",
] as const satisfies readonly MainWireFiveWallPeriodicClosureGroupV1[]);

const CORONARY_GROUP_ORDER = Object.freeze([
  "coronary-node-volume",
  "coronary-tone",
  "mvc-reference-strain",
  "mvc-phase-memory",
] as const satisfies readonly MainWireFiveWallCoronaryPeriodicClosureGroupV2[]);

const GROUP_ORDER = Object.freeze([
  ...LEGACY_GROUP_ORDER,
  ...CORONARY_GROUP_ORDER,
] as const satisfies readonly MainWireFiveWallCoronaryPeriodicClosureGroupV2[]);

export function compareMainWireFiveWallCoronaryAcceptedStatesV2(
  current: MainWireFiveWallCoronaryPeriodicAcceptedStateV2,
  reference: MainWireFiveWallCoronaryPeriodicAcceptedStateV2,
  scales: MainWireFiveWallCoronaryPeriodicReferenceScalesV2,
): MainWireFiveWallCoronaryPeriodicClosureReportV2 {
  validateScales(scales);
  validateCompatibleStates(current, reference);
  const legacyClosure = compareMainWireFiveWallAcceptedStatesV1(
    projectLegacyAcceptedState(current),
    projectLegacyAcceptedState(reference),
    projectLegacyScales(scales),
  );
  if (
    legacyClosure.overall.entryCount
    !== MAIN_WIRE_FIVE_WALL_CORONARY_PERIODIC_CLOSURE_CLAIM_V2
      .legacyNumericStateCount
  ) {
    throw new Error(
      "legacy closure dimension changed; review the coronary V2 closure contract",
    );
  }

  const newEntries: MainWireFiveWallCoronaryPeriodicDeltaEntryV2[] = [];
  for (const nodeId of CORONARY_CONSERVED_VOLUME_NODE_IDS_V2) {
    newEntries.push(numericEntry(
      "coronary-node-volume",
      "coronary-node-volume",
      "mL",
      `coronary.volumeMlByNode.${nodeId}`,
      current.coronary.volumeMlByNode[nodeId],
      reference.coronary.volumeMlByNode[nodeId],
      scales.coronaryConservedNodeVolumeMl,
    ));
  }
  for (const territoryId of CORONARY_TERRITORY_IDS_V2) {
    for (const layerId of CORONARY_LAYER_IDS_V2) {
      newEntries.push(numericEntry(
        "coronary-tone",
        "coronary-tone-resistance-scale",
        "dimensionless",
        `coronary.toneResistanceScaleByTerritoryLayer.${territoryId}.${layerId}`,
        current.coronary
          .toneResistanceScaleByTerritoryLayer[territoryId][layerId],
        reference.coronary
          .toneResistanceScaleByTerritoryLayer[territoryId][layerId],
        scales.coronaryToneResistanceScale,
      ));
    }
  }
  for (const wallId of ["LVFW", "SEP", "RVFW"] as const) {
    newEntries.push(numericEntry(
      "mvc-reference-strain",
      "mvc-reference-fiber-log-strain",
      "log-strain",
      `mvcReferenceState.reference.referenceFiberLogStrainByWall.${wallId}`,
      current.mvcReferenceState.reference.referenceFiberLogStrainByWall[wallId],
      reference.mvcReferenceState.reference.referenceFiberLogStrainByWall[wallId],
      scales.mvcReferenceFiberLogStrain,
    ));
  }
  newEntries.push(booleanEntry(
    current.mvcReferenceState.mitralForwardFlowActive,
    reference.mvcReferenceState.mitralForwardFlowActive,
    scales.mitralForwardFlowActiveMismatch01,
  ));

  const groups = Object.freeze(Object.fromEntries(GROUP_ORDER.map((group) => {
    if (isLegacyGroup(group)) {
      return [group, legacyGroupReport(
        group,
        legacyClosure.groups[group],
      )];
    }
    return [group, newGroupReport(
      group,
      newEntries.filter((entry) => entry.group === group),
    )];
  }))) as MainWireFiveWallCoronaryPeriodicClosureReportV2["groups"];
  const groupReports = GROUP_ORDER.map((group) => groups[group]);
  const worstGroup = maximumNormalizedGroup(groupReports);
  const numericEntryCount = groupReports.reduce(
    (sum, group) => sum + group.numericEntryCount,
    0,
  );
  const booleanEntryCount = groupReports.reduce(
    (sum, group) => sum + group.booleanEntryCount,
    0,
  );
  if (numericEntryCount !== 93 || booleanEntryCount !== 1) {
    throw new Error("coronary V2 full accepted-state closure dimension changed");
  }

  return Object.freeze({
    closureId: MAIN_WIRE_FIVE_WALL_CORONARY_PERIODIC_CLOSURE_V2_ID,
    referenceScaleSetId: scales.scaleSetId,
    legacyClosure,
    provenance: Object.freeze({
      currentRevision: current.revision,
      referenceRevision: reference.revision,
      revisionAdvance: current.revision - reference.revision,
      currentAcceptedTimeSec: current.acceptedTimeSec,
      referenceAcceptedTimeSec: reference.acceptedTimeSec,
      elapsedTimeSec: current.acceptedTimeSec - reference.acceptedTimeSec,
      currentMvcReferenceRevision:
        current.mvcReferenceState.referenceRevision,
      referenceMvcReferenceRevision:
        reference.mvcReferenceState.referenceRevision,
      mvcReferenceRevisionAdvance:
        current.mvcReferenceState.referenceRevision
        - reference.mvcReferenceState.referenceRevision,
      currentMvcReferenceAcceptedTimeSec:
        current.mvcReferenceState.referenceAcceptedTimeSec,
      referenceMvcReferenceAcceptedTimeSec:
        reference.mvcReferenceState.referenceAcceptedTimeSec,
      mvcReferenceAcceptedTimeAdvanceSec:
        current.mvcReferenceState.referenceAcceptedTimeSec
        - reference.mvcReferenceState.referenceAcceptedTimeSec,
      currentMitralClosureEventCount:
        current.mvcReferenceState.acceptedMitralClosureEventCount,
      referenceMitralClosureEventCount:
        reference.mvcReferenceState.acceptedMitralClosureEventCount,
      mitralClosureEventCountAdvance:
        current.mvcReferenceState.acceptedMitralClosureEventCount
        - reference.mvcReferenceState.acceptedMitralClosureEventCount,
    }),
    compatibility: Object.freeze({
      fixedGlobalTotalBloodVolumeMl:
        current.fixedGlobalTotalBloodVolumeMl,
      coronaryBindingCanonicalJson:
        canonicalJsonStringify(current.coronaryBinding),
      mechanicsProviderIdentity: Object.freeze({
        contractId: current.mechanics.contractId,
        providerId: current.mechanics.providerId,
        parameterSetId: current.mechanics.parameterSetId,
        parameterIdentityHash: current.mechanics.parameterIdentityHash,
        stateSchemaVersion: current.mechanics.stateSchemaVersion,
      }),
    }),
    groups,
    overall: Object.freeze({
      legacyNumericEntryCount: 68 as const,
      coronaryNumericEntryCount: 25 as const,
      numericEntryCount: 93 as const,
      booleanEntryCount: 1 as const,
      entryCount: 94 as const,
      maximumNormalizedDelta: worstGroup.maximumNormalizedDelta,
      worstGroup: worstGroup.group,
      worstPath: worstGroup.worstPath,
      worstEntry: worstGroup.worstEntry,
    }),
  });
}

/**
 * A single one-period comparison is a drift check only. Even a zero result
 * cannot establish P1 without a separate consecutive-beat protocol.
 */
export function assessMainWireFiveWallCoronarySinglePeriodClosureV2(
  report: MainWireFiveWallCoronaryPeriodicClosureReportV2,
  normalizedTolerance: number,
): MainWireFiveWallCoronarySinglePeriodAssessmentV2 {
  if (report.closureId
      !== MAIN_WIRE_FIVE_WALL_CORONARY_PERIODIC_CLOSURE_V2_ID) {
    throw new Error("unsupported coronary V2 periodic closure report");
  }
  if (!Number.isFinite(normalizedTolerance) || normalizedTolerance < 0) {
    throw new Error("normalized closure tolerance must be nonnegative and finite");
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
 * Classify complete V2 beat-boundary closures. Unlike the standalone drift
 * assessment, this can establish P1, but only from at least three consecutive
 * canonical-periodic observations. Rapid presentation beats are deliberately
 * ineligible even when their numerical deltas happen to be small.
 */
export function classifyMainWireFiveWallCoronaryPeriodicityV2(
  observations: readonly MainWireFiveWallCoronaryPeriodicBeatObservationV2[],
  options: MainWireFiveWallCoronaryPeriodicClassifierOptionsV2,
): MainWireFiveWallCoronaryPeriodicClassificationV2 {
  validateClassifierOptions(options);
  validateObservations(observations);
  const latest = observations.at(-1);
  const suffix = observations.slice(-options.consecutiveBeats);
  const enough = suffix.length === options.consecutiveBeats
    && suffix.every((observation, index) => index === 0
      || observation.beatIndex === suffix[index - 1]!.beatIndex + 1)
    && suffix.every((observation) => observation.evidenceRole
      === "canonical-periodic-protocol");
  const period1 = enough && suffix.every((observation) =>
    observation.period1 !== null
    && observation.period1.overall.maximumNormalizedDelta
      <= options.period1NormalizedTolerance);
  const period2 = !period1 && enough && suffix.every((observation) =>
    observation.period1 !== null
    && observation.period2 !== null
    && observation.period1.overall.maximumNormalizedDelta
      >= options.period2MinimumPeriod1NormalizedDelta
    && observation.period2.overall.maximumNormalizedDelta
      <= options.period2NormalizedTolerance);
  const status: MainWireFiveWallCoronaryPeriodicClassificationStatusV2 =
    period1
      ? "period1-converged"
      : period2 ? "period2-suspect" : "not-converged";
  return Object.freeze({
    status,
    latestBeatIndex: latest?.beatIndex ?? null,
    consecutiveBeatsRequired: options.consecutiveBeats,
    minimumConsecutiveBeats: 3 as const,
    acceptedEvidenceRole: "canonical-periodic-protocol" as const,
    evidenceBeatIndices: status === "not-converged"
      ? Object.freeze([])
      : Object.freeze(suffix.map((observation) => observation.beatIndex)),
    latestPeriod1MaximumNormalizedDelta:
      latest?.period1?.overall.maximumNormalizedDelta ?? null,
    latestPeriod2MaximumNormalizedDelta:
      latest?.period2?.overall.maximumNormalizedDelta ?? null,
  });
}

function projectLegacyAcceptedState(
  state: MainWireFiveWallCoronaryPeriodicAcceptedStateV2,
): MainWireFiveWallPeriodicAcceptedStateV1 {
  return Object.freeze({
    transactionId: MAIN_WIRE_FIVE_WALL_NONCORONARY_TRANSACTION_V1_ID,
    revision: state.revision,
    acceptedTimeSec: state.acceptedTimeSec,
    circulation: state.circulation,
    mechanics: state.mechanics,
  });
}

function projectLegacyScales(
  scales: MainWireFiveWallCoronaryPeriodicReferenceScalesV2,
): MainWireFiveWallPeriodicReferenceScalesV1 {
  return Object.freeze({
    scaleSetId: scales.scaleSetId,
    circulationNodeVolumeMl: scales.circulationNodeVolumeMl,
    dynamicEdgeFlowMlPerSec: scales.dynamicEdgeFlowMlPerSec,
    valveOpeningFraction01: scales.valveOpeningFraction01,
    trisegSeptalMidwallCapVolumeM3:
      scales.trisegSeptalMidwallCapVolumeM3,
    trisegJunctionRadiusM: scales.trisegJunctionRadiusM,
    landState01: scales.landState01,
    slsViscousLogStrain: scales.slsViscousLogStrain,
    wallFiberLogStrain: scales.wallFiberLogStrain,
    wallFreeCalciumUM: scales.wallFreeCalciumUM,
  });
}

function numericEntry(
  group: MainWireFiveWallCoronaryPeriodicClosureGroupV2,
  quantity: MainWireFiveWallCoronaryPeriodicQuantityV2,
  unit: Exclude<MainWireFiveWallCoronaryPeriodicUnitV2, "boolean">,
  path: string,
  currentValue: number,
  referenceValue: number,
  referenceScale: number,
): MainWireFiveWallCoronaryPeriodicNumericDeltaEntryV2 {
  requireFinite(currentValue, `${path} current value`);
  requireFinite(referenceValue, `${path} reference value`);
  const absoluteDelta = Math.abs(currentValue - referenceValue);
  requireFinite(absoluteDelta, `${path} absolute delta`);
  return Object.freeze({
    kind: "numeric" as const,
    group,
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
  currentValue: boolean,
  referenceValue: boolean,
  referenceScale: number,
): MainWireFiveWallCoronaryPeriodicBooleanDeltaEntryV2 {
  const absoluteDelta = currentValue === referenceValue ? 0 as const : 1 as const;
  return Object.freeze({
    kind: "boolean" as const,
    group: "mvc-phase-memory" as const,
    quantity: "mitral-forward-flow-active" as const,
    unit: "boolean" as const,
    path: "mvcReferenceState.mitralForwardFlowActive" as const,
    currentValue,
    referenceValue,
    absoluteDelta,
    referenceScale,
    normalizedDelta: absoluteDelta / referenceScale,
  });
}

function legacyGroupReport(
  group: MainWireFiveWallPeriodicClosureGroupV1,
  report: MainWireFiveWallPeriodicClosureGroupReportV1,
): MainWireFiveWallCoronaryPeriodicClosureGroupReportV2 {
  return Object.freeze({
    group,
    numericEntryCount: report.entryCount,
    booleanEntryCount: 0,
    entryCount: report.entryCount,
    maximumNormalizedDelta: report.maximumNormalizedDelta,
    worstPath: report.worstPath,
    worstEntry: legacyEntry(report.worstEntry),
  });
}

function legacyEntry(
  entry: MainWireFiveWallPeriodicDeltaEntryV1,
): MainWireFiveWallCoronaryPeriodicNumericDeltaEntryV2 {
  return Object.freeze({
    kind: "numeric" as const,
    group: entry.group,
    quantity: entry.quantity,
    unit: entry.unit,
    path: entry.path,
    currentValue: entry.currentValue,
    referenceValue: entry.referenceValue,
    absoluteDelta: entry.absoluteDelta,
    referenceScale: entry.referenceScale,
    normalizedDelta: entry.normalizedDelta,
  });
}

function newGroupReport(
  group: MainWireFiveWallCoronaryPeriodicClosureGroupV2,
  entries: readonly MainWireFiveWallCoronaryPeriodicDeltaEntryV2[],
): MainWireFiveWallCoronaryPeriodicClosureGroupReportV2 {
  if (entries.length === 0) throw new Error(`${group} closure group is empty`);
  const worstEntry = maximumNormalizedEntry(entries);
  const numericEntryCount = entries.filter((entry) => entry.kind === "numeric")
    .length;
  const booleanEntryCount = entries.length - numericEntryCount;
  return Object.freeze({
    group,
    numericEntryCount,
    booleanEntryCount,
    entryCount: entries.length,
    maximumNormalizedDelta: worstEntry.normalizedDelta,
    worstPath: worstEntry.path,
    worstEntry,
  });
}

function maximumNormalizedEntry(
  entries: readonly MainWireFiveWallCoronaryPeriodicDeltaEntryV2[],
): MainWireFiveWallCoronaryPeriodicDeltaEntryV2 {
  const first = entries[0];
  if (first === undefined) throw new Error("periodic closure entry set is empty");
  return entries.reduce((worst, entry) =>
    entry.normalizedDelta > worst.normalizedDelta ? entry : worst, first);
}

function maximumNormalizedGroup(
  groups: readonly MainWireFiveWallCoronaryPeriodicClosureGroupReportV2[],
): MainWireFiveWallCoronaryPeriodicClosureGroupReportV2 {
  const first = groups[0];
  if (first === undefined) throw new Error("periodic closure group set is empty");
  return groups.reduce((worst, group) =>
    group.maximumNormalizedDelta > worst.maximumNormalizedDelta
      ? group
      : worst, first);
}

function isLegacyGroup(
  group: MainWireFiveWallCoronaryPeriodicClosureGroupV2,
): group is MainWireFiveWallPeriodicClosureGroupV1 {
  return (LEGACY_GROUP_ORDER as readonly string[]).includes(group);
}

function validateCompatibleStates(
  current: MainWireFiveWallCoronaryPeriodicAcceptedStateV2,
  reference: MainWireFiveWallCoronaryPeriodicAcceptedStateV2,
): void {
  validateAcceptedState(current, "current");
  validateAcceptedState(reference, "reference");
  if (canonicalJsonStringify(current.coronaryBinding)
      !== canonicalJsonStringify(reference.coronaryBinding)) {
    throw new Error("coronary V2 periodic closure binding compatibility differs");
  }
  if (!Object.is(
    current.fixedGlobalTotalBloodVolumeMl,
    reference.fixedGlobalTotalBloodVolumeMl,
  )) {
    throw new Error("coronary V2 periodic closure fixed global TBV differs");
  }
  const providerCompatible = current.mechanics.contractId
      === reference.mechanics.contractId
    && current.mechanics.providerId === reference.mechanics.providerId
    && current.mechanics.parameterSetId === reference.mechanics.parameterSetId
    && current.mechanics.parameterIdentityHash
      === reference.mechanics.parameterIdentityHash
    && current.mechanics.stateSchemaVersion
      === reference.mechanics.stateSchemaVersion;
  if (!providerCompatible) {
    throw new Error("coronary V2 periodic closure provider identity differs");
  }
  if (
    current.revision < reference.revision
    || current.acceptedTimeSec < reference.acceptedTimeSec
    || current.mvcReferenceState.referenceRevision
      < reference.mvcReferenceState.referenceRevision
    || current.mvcReferenceState.referenceAcceptedTimeSec
      < reference.mvcReferenceState.referenceAcceptedTimeSec
    || current.mvcReferenceState.acceptedMitralClosureEventCount
      < reference.mvcReferenceState.acceptedMitralClosureEventCount
  ) {
    throw new Error("coronary V2 periodic closure provenance is not monotonic");
  }
}

function validateAcceptedState(
  state: MainWireFiveWallCoronaryPeriodicAcceptedStateV2,
  label: string,
): void {
  if (state.transactionId !== MAIN_WIRE_FIVE_WALL_CORONARY_TRANSACTION_V2_ID) {
    throw new Error(`${label} coronary V2 periodic transaction id is invalid`);
  }
  if (
    !Number.isInteger(state.revision)
    || state.revision < 0
    || !Number.isFinite(state.acceptedTimeSec)
    || state.acceptedTimeSec < 0
    || state.circulation.revision !== state.revision
    || state.coronary.revision !== state.revision
    || state.mechanics.revision !== state.revision
    || state.circulation.acceptedTimeSec !== state.acceptedTimeSec
    || state.coronary.acceptedTimeSec !== state.acceptedTimeSec
    || state.mechanics.acceptedTimeSec !== state.acceptedTimeSec
  ) throw new Error(`${label} coronary V2 periodic tuple clocks differ`);
  requirePositiveFinite(
    state.fixedGlobalTotalBloodVolumeMl,
    `${label}.fixedGlobalTotalBloodVolumeMl`,
  );
  assertExactKeys(
    state.circulation.nodeVolumesMl,
    NON_CORONARY_NODE_NAMES_V1,
    `${label} noncoronary volumes`,
  );
  assertExactKeys(
    state.coronary.volumeMlByNode,
    CORONARY_CONSERVED_VOLUME_NODE_IDS_V2,
    `${label} coronary volumes`,
  );
  assertExactKeys(
    state.coronary.toneResistanceScaleByTerritoryLayer,
    CORONARY_TERRITORY_IDS_V2,
    `${label} coronary tone territories`,
  );
  for (const territoryId of CORONARY_TERRITORY_IDS_V2) {
    assertExactKeys(
      state.coronary.toneResistanceScaleByTerritoryLayer[territoryId],
      CORONARY_LAYER_IDS_V2,
      `${label}.${territoryId} coronary tone layers`,
    );
  }
  const nonCoronaryVolumeMl = NON_CORONARY_NODE_NAMES_V1.reduce(
    (sum, nodeId) => {
      requirePositiveFinite(
        state.circulation.nodeVolumesMl[nodeId],
        `${label}.circulation.nodeVolumesMl.${nodeId}`,
      );
      return sum + state.circulation.nodeVolumesMl[nodeId];
    },
    0,
  );
  const coronaryVolumeMl = CORONARY_CONSERVED_VOLUME_NODE_IDS_V2.reduce(
    (sum, nodeId) => {
      requirePositiveFinite(
        state.coronary.volumeMlByNode[nodeId],
        `${label}.coronary.volumeMlByNode.${nodeId}`,
      );
      return sum + state.coronary.volumeMlByNode[nodeId];
    },
    0,
  );
  if (Math.abs(
    nonCoronaryVolumeMl + coronaryVolumeMl
      - state.fixedGlobalTotalBloodVolumeMl,
  ) > 1e-8) {
    throw new Error(`${label} coronary V2 periodic tuple violates global TBV`);
  }
  for (const territoryId of CORONARY_TERRITORY_IDS_V2) {
    for (const layerId of CORONARY_LAYER_IDS_V2) {
      requirePositiveFinite(
        state.coronary.toneResistanceScaleByTerritoryLayer[territoryId][layerId],
        `${label}.${territoryId}.${layerId} coronary tone`,
      );
    }
  }
  for (const wallId of ["LVFW", "SEP", "RVFW"] as const) {
    requireFinite(
      state.mvcReferenceState.reference.referenceFiberLogStrainByWall[wallId],
      `${label}.mvcReferenceState.${wallId}`,
    );
  }
  if (typeof state.mvcReferenceState.mitralForwardFlowActive !== "boolean") {
    throw new Error(`${label} MVC phase memory must be boolean`);
  }
  if (
    !Number.isInteger(state.mvcReferenceState.referenceRevision)
    || state.mvcReferenceState.referenceRevision < 0
    || state.mvcReferenceState.referenceRevision > state.revision
    || !Number.isFinite(state.mvcReferenceState.referenceAcceptedTimeSec)
    || state.mvcReferenceState.referenceAcceptedTimeSec < 0
    || state.mvcReferenceState.referenceAcceptedTimeSec > state.acceptedTimeSec
    || !Number.isInteger(
      state.mvcReferenceState.acceptedMitralClosureEventCount,
    )
    || state.mvcReferenceState.acceptedMitralClosureEventCount < 0
  ) throw new Error(`${label} MVC provenance is invalid`);
}

function validateScales(
  scales: MainWireFiveWallCoronaryPeriodicReferenceScalesV2,
): void {
  if (typeof scales.scaleSetId !== "string" || scales.scaleSetId.length === 0) {
    throw new Error("coronary V2 periodic scaleSetId must be non-empty");
  }
  for (const [name, value] of Object.entries(scales)) {
    if (name !== "scaleSetId") {
      requirePositiveFinite(value as number, `periodic reference scale ${name}`);
    }
  }
}

function validateClassifierOptions(
  options: MainWireFiveWallCoronaryPeriodicClassifierOptionsV2,
): void {
  for (const [name, value] of Object.entries({
    period1NormalizedTolerance: options.period1NormalizedTolerance,
    period2NormalizedTolerance: options.period2NormalizedTolerance,
    period2MinimumPeriod1NormalizedDelta:
      options.period2MinimumPeriod1NormalizedDelta,
  })) {
    if (!Number.isFinite(value) || value < 0) {
      throw new Error(`${name} must be nonnegative and finite`);
    }
  }
  if (
    !Number.isInteger(options.consecutiveBeats)
    || options.consecutiveBeats
      < MAIN_WIRE_FIVE_WALL_CORONARY_PERIODIC_CLOSURE_CLAIM_V2
        .minimumConsecutiveClassificationBeats
  ) {
    throw new Error("coronary V2 classifier requires at least 3 consecutive beats");
  }
  if (
    options.period2MinimumPeriod1NormalizedDelta
    <= options.period1NormalizedTolerance
  ) {
    throw new Error(
      "period2MinimumPeriod1NormalizedDelta must exceed period1NormalizedTolerance",
    );
  }
}

function validateObservations(
  observations: readonly MainWireFiveWallCoronaryPeriodicBeatObservationV2[],
): void {
  let previousBeatIndex = -1;
  let previousObservation:
    MainWireFiveWallCoronaryPeriodicBeatObservationV2 | null = null;
  let referenceScaleSetId: string | null = null;
  let compatibilityCanonicalJson: string | null = null;
  let protocolIdentityHash: string | null = null;
  for (const observation of observations) {
    if (!Number.isInteger(observation.beatIndex) || observation.beatIndex < 0) {
      throw new Error("coronary V2 beatIndex must be a nonnegative integer");
    }
    if (observation.beatIndex <= previousBeatIndex) {
      throw new Error(
        "coronary V2 observations must have strictly increasing beatIndex",
      );
    }
    previousBeatIndex = observation.beatIndex;
    if (
      observation.evidenceRole !== "canonical-periodic-protocol"
      && observation.evidenceRole !== "rapid-presentation-only"
    ) throw new Error("unsupported coronary V2 periodic evidence role");
    if (!/^[0-9a-f]{64}$/.test(observation.protocolIdentityHash)) {
      throw new Error(
        "coronary V2 protocolIdentityHash must be lowercase SHA-256",
      );
    }
    protocolIdentityHash ??= observation.protocolIdentityHash;
    if (observation.protocolIdentityHash !== protocolIdentityHash) {
      throw new Error(
        "coronary V2 observations use different protocol identity hashes",
      );
    }
    for (const report of [observation.period1, observation.period2]) {
      if (report === null) continue;
      validateClosureReport(report);
      referenceScaleSetId ??= report.referenceScaleSetId;
      if (report.referenceScaleSetId !== referenceScaleSetId) {
        throw new Error(
          "coronary V2 observations use different reference scale sets",
        );
      }
      const reportCompatibility = canonicalJsonStringify(report.compatibility);
      compatibilityCanonicalJson ??= reportCompatibility;
      if (reportCompatibility !== compatibilityCanonicalJson) {
        throw new Error(
          "coronary V2 observations use incompatible model identities",
        );
      }
    }
    if (
      observation.period1 !== null
      && observation.period2 !== null
      && currentProvenanceCanonicalJson(observation.period1)
        !== currentProvenanceCanonicalJson(observation.period2)
    ) {
      throw new Error(
        "coronary V2 period1 and period2 current provenance differs",
      );
    }
    if (observation.period1 === null && observation.period2 !== null) {
      throw new Error(
        "coronary V2 period2 report requires the same-boundary period1 report",
      );
    }
    if (
      previousObservation !== null
      && observation.beatIndex === previousObservation.beatIndex + 1
    ) {
      validateConsecutiveObservationProvenanceV2(
        previousObservation,
        observation,
      );
    }
    previousObservation = observation;
  }
}

function validateConsecutiveObservationProvenanceV2(
  previous: MainWireFiveWallCoronaryPeriodicBeatObservationV2,
  current: MainWireFiveWallCoronaryPeriodicBeatObservationV2,
): void {
  if (previous.period1 !== null && current.period1 !== null
      && currentProvenanceCanonicalJson(previous.period1)
        !== referenceProvenanceCanonicalJson(current.period1)) {
    throw new Error(
      "coronary V2 consecutive P1 provenance chain is discontinuous",
    );
  }
  if (previous.period1 !== null && current.period2 !== null
      && referenceProvenanceCanonicalJson(previous.period1)
        !== referenceProvenanceCanonicalJson(current.period2)) {
    throw new Error(
      "coronary V2 P2 provenance does not reference the two-back boundary",
    );
  }
}

function currentProvenanceCanonicalJson(
  report: MainWireFiveWallCoronaryPeriodicClosureReportV2,
): string {
  return canonicalJsonStringify(Object.freeze({
    currentRevision: report.provenance.currentRevision,
    currentAcceptedTimeSec: report.provenance.currentAcceptedTimeSec,
    currentMvcReferenceRevision:
      report.provenance.currentMvcReferenceRevision,
    currentMvcReferenceAcceptedTimeSec:
      report.provenance.currentMvcReferenceAcceptedTimeSec,
    currentMitralClosureEventCount:
      report.provenance.currentMitralClosureEventCount,
  }));
}

function referenceProvenanceCanonicalJson(
  report: MainWireFiveWallCoronaryPeriodicClosureReportV2,
): string {
  return canonicalJsonStringify(Object.freeze({
    currentRevision: report.provenance.referenceRevision,
    currentAcceptedTimeSec: report.provenance.referenceAcceptedTimeSec,
    currentMvcReferenceRevision:
      report.provenance.referenceMvcReferenceRevision,
    currentMvcReferenceAcceptedTimeSec:
      report.provenance.referenceMvcReferenceAcceptedTimeSec,
    currentMitralClosureEventCount:
      report.provenance.referenceMitralClosureEventCount,
  }));
}

function validateClosureReport(
  report: MainWireFiveWallCoronaryPeriodicClosureReportV2,
): void {
  if (report.closureId
      !== MAIN_WIRE_FIVE_WALL_CORONARY_PERIODIC_CLOSURE_V2_ID) {
    throw new Error("unsupported coronary V2 periodic closure report");
  }
  if (
    report.overall.legacyNumericEntryCount !== 68
    || report.overall.coronaryNumericEntryCount !== 25
    || report.overall.numericEntryCount !== 93
    || report.overall.booleanEntryCount !== 1
    || report.overall.entryCount !== 94
  ) throw new Error("coronary V2 closure report state dimension is invalid");
  if (
    !Number.isFinite(report.overall.maximumNormalizedDelta)
    || report.overall.maximumNormalizedDelta < 0
  ) throw new Error("coronary V2 closure delta must be nonnegative and finite");
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

function requirePositiveFinite(value: number, label: string): void {
  requireFinite(value, label);
  if (!(value > 0)) throw new Error(`${label} must be positive`);
}

function requireFinite(value: number, label: string): void {
  if (!Number.isFinite(value)) throw new Error(`${label} must be finite`);
}
