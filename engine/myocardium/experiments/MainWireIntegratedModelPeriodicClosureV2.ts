import {
  DYNAMIC_MECHANICAL_SUPPORT_ACCEPTED_STATE_V1_ID,
  DYNAMIC_MECHANICAL_SUPPORT_NETWORK_V1_ID,
  validateDynamicMechanicalSupportInertanceProfileV1,
} from "@/engine/devices/dynamicNetworkV1";
import {
  DYNAMIC_ROTARY_PUMP_UNIT_SYSTEM_V1_ID,
} from "@/engine/devices/dynamicRotaryPumpV1";
import {
  ROTARY_SUPPORT_DEVICE_IDS_V1,
  type RotarySupportDeviceIdV1,
} from "@/engine/devices/typesV1";
import {
  MAIN_WIRE_INTEGRATED_MODEL_TRANSACTION_V2_ID,
  type MainWireIntegratedModelAcceptedStateV2,
} from "@/engine/myocardium/MainWireIntegratedModelTransactionV2";
import {
  GENERATED_FIVE_WALL_RHYTHM_CALCIUM_WALL_IDS_V1,
  validateAcceptedGeneratedFiveWallRhythmCalciumStateV1,
} from "@/engine/myocardium/rhythm/acceptedGeneratedFiveWallRhythmCalciumOwnerV1";
import type {
  AcceptedRhythmActivationEventV1,
} from "@/engine/myocardium/rhythm/acceptedRhythmEventScheduleV1";
import {
  MAIN_WIRE_FIVE_WALL_CORONARY_PERIODIC_REFERENCE_SCALES_V3,
  compareMainWireFiveWallCoronaryAcceptedStatesV3,
  type MainWireFiveWallCoronaryPeriodicClosureReportV3,
  type MainWireFiveWallCoronaryPeriodicDeltaEntryV3,
  type MainWireFiveWallCoronaryPeriodicReferenceScalesV3,
} from "@/engine/myocardium/experiments/MainWireFiveWallCoronaryPeriodicClosureV3";
import type {
  MainWireFiveWallLandTriSegStateV1,
} from "@/engine/myocardium/mechanics/MainWireFiveWallLandTriSegProviderV1";
import type {
  LandSlsWallMaterialStateV1,
} from "@/engine/myocardium/mechanics/landSlsWallMaterialV1";
import { canonicalJsonStringify } from "@/engine/scientific/release";

export const MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_CLOSURE_V2_ID =
  "main-wire-integrated-generated-rhythm-full-accepted-state-periodic-closure-v2" as const;

export const MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_CLOSURE_CLAIM_V2 =
  Object.freeze({
    rhythmApplicability: "regular-sinus-source-period-boundaries-only" as const,
    irregularOrFlutterApplicability: "not-applicable-fail-closed" as const,
    coronaryComparator:
      "main-wire-five-wall-coronary-full-accepted-state-periodic-closure-v3" as const,
    coronaryClosureEntryCount: 125 as const,
    dynamicMechanicalSupportAcceptedFlowStateCount: 4 as const,
    generatedCalciumStateCount: 10 as const,
    generatedAvRelativeTimingStateCount: 3 as const,
    generatedNextSourceRelativeTimingStateCount: 1 as const,
    fixedNumericClosureEntryCount: 140 as const,
    fixedBooleanClosureEntryCount: 3 as const,
    fixedClosureEntryCount: 143 as const,
    pendingEffectiveActivationNumericEntriesPerEvent: 2 as const,
    totalClosureEntryCountFormula:
      "143+2*reference-pending-effective-activation-count" as const,
    absoluteMetadataExcludedFromClosureDelta: Object.freeze([
      "accepted-time",
      "accepted-revision",
      "generator-revision",
      "av-gate-revision",
      "source-index",
      "av-accepted-conducted-blocked-counts",
      "absolute-effective-event-time",
      "absolute-event-id-and-beat-ordinal",
    ] as const),
    compatibilityGates: Object.freeze([
      "integrated-transaction-identity-exact",
      "generated-binding-and-generator-config-exact",
      "dynamic-mcs-inertance-profile-exact",
      "dynamic-mcs-structural-config-projection-exact",
      "coronary-v3-compatibility-and-empty-window-gates",
      "pending-effective-event-class-target-and-lineage-exact",
    ] as const),
    provenanceGates: Object.freeze([
      "exactly-one-or-two-source-periods-of-accepted-time",
      "all-accepted-owner-clocks-and-revisions-exact-within-each-state",
      "outer-accepted-revision-strictly-advances",
      "next-source-index-and-av-accepted-count-advance-by-period-lag",
      "conducted-plus-blocked-count-advance-by-period-lag",
      "pending-source-lineage-advances-by-period-lag",
    ] as const),
    fixedReferenceScalesAre:
      "dimensional-numerical-normalizers-not-fitting-targets" as const,
    normalizedTolerancePolicy:
      "caller-supplied-preregistered-numerical-policy-not-embedded-acceptance" as const,
    period1EvidenceEstablishedByOneComparison: false as const,
    physiologicalAcceptanceClaimed: false as const,
    releaseAcceptanceClaimed: false as const,
    clinicalValidationClaimed: false as const,
  });

/**
 * Fixed dimensional normalizers. They are not parameter-fitting targets,
 * physiological ranges, device performance specifications, or release
 * acceptance thresholds.
 */
export const MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_REFERENCE_SCALES_V2 =
  Object.freeze({
    ...MAIN_WIRE_FIVE_WALL_CORONARY_PERIODIC_REFERENCE_SCALES_V3,
    scaleSetId:
      "fixed-dimensional-reference-scales-integrated-generated-rhythm-v2" as const,
    dynamicMcsAcceptedFlowMlPerSecByDevice: Object.freeze({
      LVAD: 100,
      IMPELLA: 50,
      VA_ECMO: 100,
      VV_ECMO: 100,
    }),
    generatedCalciumRiseDrive: 1,
    generatedCalciumDecayDrive: 1,
    generatedAvRelativeTimingSec: 1,
    generatedNextSourceRelativeTimingSec: 1,
    generatedPendingRelativeTimingSec: 1,
    generatedPendingActivationStrength01: 1,
  }) satisfies MainWireIntegratedModelPeriodicReferenceScalesV2;

export type MainWireIntegratedModelPeriodicAcceptedStateV2 =
  MainWireIntegratedModelAcceptedStateV2<
    MainWireFiveWallLandTriSegStateV1<LandSlsWallMaterialStateV1>
  >;

export type MainWireIntegratedModelPeriodicClosureGroupV2 =
  | "coronary-v3"
  | "dynamic-mcs-accepted-flow"
  | "generated-calcium"
  | "generated-av-relative-timing"
  | "generated-next-source-relative-timing"
  | "generated-pending-effective-activation";

export type MainWireIntegratedModelPeriodicQuantityV2 =
  | "dynamic-mcs-accepted-flow"
  | "generated-calcium-rise-drive"
  | "generated-calcium-decay-drive"
  | "generated-av-refractory-until-relative-time"
  | "generated-av-last-conducted-atrial-relative-time"
  | "generated-av-last-ventricular-relative-time"
  | "generated-next-source-relative-time"
  | "generated-pending-effective-activation-relative-time"
  | "generated-pending-effective-activation-strength";

export type MainWireIntegratedModelPeriodicUnitV2 =
  | "mL/s"
  | "drive"
  | "s"
  | "dimensionless";

export type MainWireIntegratedModelPeriodicReferenceScalesV2 =
  MainWireFiveWallCoronaryPeriodicReferenceScalesV3 & Readonly<{
    dynamicMcsAcceptedFlowMlPerSecByDevice: Readonly<Record<
      RotarySupportDeviceIdV1,
      number
    >>;
    generatedCalciumRiseDrive: number;
    generatedCalciumDecayDrive: number;
    generatedAvRelativeTimingSec: number;
    generatedNextSourceRelativeTimingSec: number;
    generatedPendingRelativeTimingSec: number;
    generatedPendingActivationStrength01: number;
  }>;

export type MainWireIntegratedModelPeriodicNumericDeltaEntryV2 = Readonly<{
  kind: "numeric";
  group: Exclude<MainWireIntegratedModelPeriodicClosureGroupV2, "coronary-v3">;
  quantity: MainWireIntegratedModelPeriodicQuantityV2;
  unit: MainWireIntegratedModelPeriodicUnitV2;
  path: string;
  currentValue: number;
  referenceValue: number;
  absoluteDelta: number;
  referenceScale: number;
  normalizedDelta: number;
}>;

export type MainWireIntegratedModelPeriodicDeltaEntryV2 =
  | MainWireFiveWallCoronaryPeriodicDeltaEntryV3
  | MainWireIntegratedModelPeriodicNumericDeltaEntryV2;

export type MainWireIntegratedModelPeriodicClosureGroupReportV2 = Readonly<{
  group: MainWireIntegratedModelPeriodicClosureGroupV2;
  numericEntryCount: number;
  booleanEntryCount: number;
  entryCount: number;
  maximumNormalizedDelta: number;
  worstPath: string | null;
  worstEntry: MainWireIntegratedModelPeriodicDeltaEntryV2 | null;
}>;

export type MainWireIntegratedModelPeriodicClosureReportV2 = Readonly<{
  closureId: typeof MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_CLOSURE_V2_ID;
  referenceScaleSetId: string;
  coronaryClosure: MainWireFiveWallCoronaryPeriodicClosureReportV3;
  compatibility: Readonly<{
    integratedTransactionId:
      typeof MAIN_WIRE_INTEGRATED_MODEL_TRANSACTION_V2_ID;
    generatedBindingCanonicalJson: string;
    generatorConfigCanonicalJson: string;
    dynamicMcsInertanceProfileCanonicalJson: string;
    dynamicMcsStructuralConfigProjectionCanonicalJson: string;
    sourceMode: "regular-sinus";
    generatedInitialization: string;
    pendingEventClassAndTargetCompatibilityExact: true;
  }>;
  provenance: Readonly<{
    sourcePeriodSec: number;
    periodLag: 1 | 2;
    currentAcceptedTimeSec: number;
    referenceAcceptedTimeSec: number;
    acceptedTimeAdvanceSec: number;
    currentRevision: number;
    referenceRevision: number;
    revisionAdvance: number;
    currentNextSourceIndex: number;
    referenceNextSourceIndex: number;
    nextSourceIndexAdvance: 1 | 2;
    currentAvAcceptedActivationCount: number;
    referenceAvAcceptedActivationCount: number;
    avAcceptedActivationCountAdvance: 1 | 2;
    avConductedActivationCountAdvance: 0 | 1 | 2;
    avBlockedActivationCountAdvance: 0 | 1 | 2;
    pendingEffectiveActivationCount: number;
    pendingLineageAdvanceByPeriodLag: true;
  }>;
  compatibilityGates: Readonly<{
    integratedTransactionIdentityExact: true;
    generatedBindingAndConfigExact: true;
    dynamicMcsInertanceProfileExact: true;
    dynamicMcsStructuralConfigProjectionExact: true;
    coronaryV3CompatibilityAndEmptyWindowsSatisfied: true;
    pendingEventClassTargetsAndLineageExact: true;
  }>;
  provenanceGates: Readonly<{
    oneOrTwoSourcePeriodAcceptedTimeAdvance: true;
    ownerClocksAndRevisionsExactWithinEachState: true;
    outerRevisionStrictlyAdvances: true;
    nextSourceIndexAdvancesByPeriodLag: true;
    avAcceptedCountAdvancesByPeriodLag: true;
    avOutcomeCountsAdvanceByPeriodLag: true;
    pendingLineageAdvancesByPeriodLag: true;
  }>;
  groups: Readonly<Record<
    MainWireIntegratedModelPeriodicClosureGroupV2,
    MainWireIntegratedModelPeriodicClosureGroupReportV2
  >>;
  overall: Readonly<{
    coronaryNumericEntryCount: 122;
    integratedNumericEntryCount: number;
    numericEntryCount: number;
    booleanEntryCount: 3;
    entryCount: number;
    pendingEffectiveActivationCount: number;
    maximumNormalizedDelta: number;
    worstGroup: MainWireIntegratedModelPeriodicClosureGroupV2;
    worstPath: string;
    worstEntry: MainWireIntegratedModelPeriodicDeltaEntryV2;
  }>;
}>;

export type MainWireIntegratedModelSinglePeriodNumericalAssessmentV2 =
  Readonly<{
    normalizedTolerance: number;
    withinFullAcceptedStateNumericalTolerance: boolean;
    period1EvidenceEstablished: false;
    physiologicalAcceptanceEstablished: false;
    releaseAcceptanceEstablished: false;
    reason:
      | "full-accepted-state-numerical-drift-exceeds-fixed-tolerance"
      | "single-period-numerical-closure-requires-separate-consecutive-period-evidence";
  }>;

const GROUP_ORDER = Object.freeze([
  "coronary-v3",
  "dynamic-mcs-accepted-flow",
  "generated-calcium",
  "generated-av-relative-timing",
  "generated-next-source-relative-timing",
  "generated-pending-effective-activation",
] as const satisfies readonly MainWireIntegratedModelPeriodicClosureGroupV2[]);

export function compareMainWireIntegratedModelAcceptedStatesV2(
  current: MainWireIntegratedModelPeriodicAcceptedStateV2,
  reference: MainWireIntegratedModelPeriodicAcceptedStateV2,
  scales: MainWireIntegratedModelPeriodicReferenceScalesV2,
): MainWireIntegratedModelPeriodicClosureReportV2 {
  validateScales(scales);
  validateIntegratedStateShape(current, "current");
  validateIntegratedStateShape(reference, "reference");
  const compatibility = validateCompatibility(current, reference);
  const provenance = validatePeriodicProvenance(current, reference);

  const coronaryClosure = compareMainWireFiveWallCoronaryAcceptedStatesV3(
    current.coronary,
    reference.coronary,
    projectCoronaryScales(scales),
  );

  const entries: MainWireIntegratedModelPeriodicNumericDeltaEntryV2[] = [];
  for (const deviceId of ROTARY_SUPPORT_DEVICE_IDS_V1) {
    entries.push(numericEntry(
      "dynamic-mcs-accepted-flow",
      "dynamic-mcs-accepted-flow",
      "mL/s",
      `dynamicMechanicalSupport.acceptedFlowMlPerSec.${deviceId}`,
      current.dynamicMechanicalSupport.acceptedFlowMlPerSec[deviceId],
      reference.dynamicMechanicalSupport.acceptedFlowMlPerSec[deviceId],
      scales.dynamicMcsAcceptedFlowMlPerSecByDevice[deviceId],
    ));
  }

  for (const wallId of GENERATED_FIVE_WALL_RHYTHM_CALCIUM_WALL_IDS_V1) {
    const currentState = current.generatedRhythmCalcium.calciumStateByWall[wallId];
    const referenceState =
      reference.generatedRhythmCalcium.calciumStateByWall[wallId];
    entries.push(numericEntry(
      "generated-calcium",
      "generated-calcium-rise-drive",
      "drive",
      `generatedRhythmCalcium.calciumStateByWall.${wallId}.riseDrive`,
      currentState[0],
      referenceState[0],
      scales.generatedCalciumRiseDrive,
    ));
    entries.push(numericEntry(
      "generated-calcium",
      "generated-calcium-decay-drive",
      "drive",
      `generatedRhythmCalcium.calciumStateByWall.${wallId}.decayDrive`,
      currentState[1],
      referenceState[1],
      scales.generatedCalciumDecayDrive,
    ));
  }

  const currentGenerator = current.generatedRhythmCalcium.generatorState;
  const referenceGenerator = reference.generatedRhythmCalcium.generatorState;
  const currentAv = currentGenerator.avGateState;
  const referenceAv = referenceGenerator.avGateState;
  const avRelativeEntries = [
    [
      "generated-av-refractory-until-relative-time",
      "refractoryUntilSec",
      requireFinite(currentAv.refractoryUntilSec, "current AV refractoryUntilSec"),
      requireFinite(referenceAv.refractoryUntilSec, "reference AV refractoryUntilSec"),
    ],
    [
      "generated-av-last-conducted-atrial-relative-time",
      "lastConductedAtrialActivationTimeSec",
      requireNonNullFinite(
        currentAv.lastConductedAtrialActivationTimeSec,
        "current AV last conducted atrial activation",
      ),
      requireNonNullFinite(
        referenceAv.lastConductedAtrialActivationTimeSec,
        "reference AV last conducted atrial activation",
      ),
    ],
    [
      "generated-av-last-ventricular-relative-time",
      "lastVentricularActivationTimeSec",
      requireNonNullFinite(
        currentAv.lastVentricularActivationTimeSec,
        "current AV last ventricular activation",
      ),
      requireNonNullFinite(
        referenceAv.lastVentricularActivationTimeSec,
        "reference AV last ventricular activation",
      ),
    ],
  ] as const;
  for (const [quantity, field, currentAbsolute, referenceAbsolute] of
    avRelativeEntries) {
    entries.push(numericEntry(
      "generated-av-relative-timing",
      quantity,
      "s",
      `generatedRhythmCalcium.generatorState.avGateState.${field}RelativeToAcceptedBoundary`,
      currentAbsolute - current.acceptedTimeSec,
      referenceAbsolute - reference.acceptedTimeSec,
      scales.generatedAvRelativeTimingSec,
    ));
  }

  entries.push(numericEntry(
    "generated-next-source-relative-timing",
    "generated-next-source-relative-time",
    "s",
    "generatedRhythmCalcium.generatorState.nextSourceActivationTimeSecRelativeToAcceptedBoundary",
    currentGenerator.nextSourceActivationTimeSec - current.acceptedTimeSec,
    referenceGenerator.nextSourceActivationTimeSec - reference.acceptedTimeSec,
    scales.generatedNextSourceRelativeTimingSec,
  ));

  const pendingPairs = pairPendingLineage(
    current,
    reference,
    provenance.periodLag,
  );
  pendingPairs.forEach(({ currentEvent, referenceEvent, lineageKey }, index) => {
    const path =
      `generatedRhythmCalcium.generatorState.pendingActivationEvents[${index}:${lineageKey}]`;
    entries.push(numericEntry(
      "generated-pending-effective-activation",
      "generated-pending-effective-activation-relative-time",
      "s",
      `${path}.activationTimeSecRelativeToAcceptedBoundary`,
      currentEvent.activationTimeSec - current.acceptedTimeSec,
      referenceEvent.activationTimeSec - reference.acceptedTimeSec,
      scales.generatedPendingRelativeTimingSec,
    ));
    entries.push(numericEntry(
      "generated-pending-effective-activation",
      "generated-pending-effective-activation-strength",
      "dimensionless",
      `${path}.activationStrength01`,
      currentEvent.activationStrength01,
      referenceEvent.activationStrength01,
      scales.generatedPendingActivationStrength01,
    ));
  });

  const groups = Object.freeze(Object.fromEntries(GROUP_ORDER.map((group) =>
    group === "coronary-v3"
      ? [group, coronaryGroupReport(coronaryClosure)]
      : [group, numericGroupReport(
        group,
        entries.filter((entry) => entry.group === group),
      )],
  ))) as MainWireIntegratedModelPeriodicClosureReportV2["groups"];
  const worstGroup = maximumGroup(GROUP_ORDER.map((group) => groups[group]));
  if (worstGroup.worstEntry === null || worstGroup.worstPath === null) {
    throw new Error("integrated periodic closure unexpectedly has no entries");
  }
  const integratedNumericEntryCount = entries.length;
  const numericEntryCount = coronaryClosure.overall.numericEntryCount
    + integratedNumericEntryCount;
  const booleanEntryCount = coronaryClosure.overall.booleanEntryCount;
  const expectedIntegratedNumeric = 18 + pendingPairs.length * 2;
  if (integratedNumericEntryCount !== expectedIntegratedNumeric
    || numericEntryCount !== 140 + pendingPairs.length * 2
    || booleanEntryCount !== 3) {
    throw new Error("integrated periodic closure state dimension changed");
  }

  return Object.freeze({
    closureId: MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_CLOSURE_V2_ID,
    referenceScaleSetId: scales.scaleSetId,
    coronaryClosure,
    compatibility,
    provenance,
    compatibilityGates: Object.freeze({
      integratedTransactionIdentityExact: true as const,
      generatedBindingAndConfigExact: true as const,
      dynamicMcsInertanceProfileExact: true as const,
      dynamicMcsStructuralConfigProjectionExact: true as const,
      coronaryV3CompatibilityAndEmptyWindowsSatisfied: true as const,
      pendingEventClassTargetsAndLineageExact: true as const,
    }),
    provenanceGates: Object.freeze({
      oneOrTwoSourcePeriodAcceptedTimeAdvance: true as const,
      ownerClocksAndRevisionsExactWithinEachState: true as const,
      outerRevisionStrictlyAdvances: true as const,
      nextSourceIndexAdvancesByPeriodLag: true as const,
      avAcceptedCountAdvancesByPeriodLag: true as const,
      avOutcomeCountsAdvanceByPeriodLag: true as const,
      pendingLineageAdvancesByPeriodLag: true as const,
    }),
    groups,
    overall: Object.freeze({
      coronaryNumericEntryCount: 122 as const,
      integratedNumericEntryCount,
      numericEntryCount,
      booleanEntryCount: 3 as const,
      entryCount: numericEntryCount + booleanEntryCount,
      pendingEffectiveActivationCount: pendingPairs.length,
      maximumNormalizedDelta: worstGroup.maximumNormalizedDelta,
      worstGroup: worstGroup.group,
      worstPath: worstGroup.worstPath,
      worstEntry: worstGroup.worstEntry,
    }),
  });
}

export function assessMainWireIntegratedModelSinglePeriodNumericalClosureV2(
  report: MainWireIntegratedModelPeriodicClosureReportV2,
  normalizedTolerance: number,
): MainWireIntegratedModelSinglePeriodNumericalAssessmentV2 {
  if (report.closureId !== MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_CLOSURE_V2_ID) {
    throw new Error("unsupported integrated periodic closure report");
  }
  requireFinite(
    report.overall.maximumNormalizedDelta,
    "integrated periodic maximum normalized delta",
  );
  requireNonnegativeFinite(
    normalizedTolerance,
    "integrated periodic normalized tolerance",
  );
  const within = report.overall.maximumNormalizedDelta <= normalizedTolerance;
  return Object.freeze({
    normalizedTolerance,
    withinFullAcceptedStateNumericalTolerance: within,
    period1EvidenceEstablished: false as const,
    physiologicalAcceptanceEstablished: false as const,
    releaseAcceptanceEstablished: false as const,
    reason: within
      ? "single-period-numerical-closure-requires-separate-consecutive-period-evidence" as const
      : "full-accepted-state-numerical-drift-exceeds-fixed-tolerance" as const,
  });
}

function validateIntegratedStateShape(
  state: MainWireIntegratedModelPeriodicAcceptedStateV2,
  label: string,
): void {
  if (state.transactionId !== MAIN_WIRE_INTEGRATED_MODEL_TRANSACTION_V2_ID) {
    throw new Error(`${label} integrated transaction identity differs`);
  }
  requireNonnegativeSafeInteger(state.revision, `${label} revision`);
  requireNonnegativeFinite(state.acceptedTimeSec, `${label} acceptedTimeSec`);
  const generated = state.generatedRhythmCalcium;
  validateAcceptedGeneratedFiveWallRhythmCalciumStateV1(
    generated,
    generated.binding,
  );
  if (state.coronary.revision !== state.revision
    || generated.revision !== state.revision
    || generated.generatorState.revision !== state.revision
    || state.coronary.acceptedTimeSec !== state.acceptedTimeSec
    || generated.acceptedTimeSec !== state.acceptedTimeSec
    || generated.generatorState.acceptedTimeSec !== state.acceptedTimeSec) {
    throw new Error(`${label} integrated accepted owner clocks differ`);
  }
  const dynamic = state.dynamicMechanicalSupport;
  if (dynamic.stateSchemaId
      !== DYNAMIC_MECHANICAL_SUPPORT_ACCEPTED_STATE_V1_ID
    || dynamic.schemaVersion !== 1
    || dynamic.networkId !== DYNAMIC_MECHANICAL_SUPPORT_NETWORK_V1_ID
    || dynamic.unitSystemId !== DYNAMIC_ROTARY_PUMP_UNIT_SYSTEM_V1_ID) {
    throw new Error(`${label} dynamic MCS accepted-state identity differs`);
  }
  validateDynamicMechanicalSupportInertanceProfileV1(
    dynamic.inertanceProfileSnapshot,
  );
  assertExactKeys(
    dynamic.acceptedFlowMlPerSec,
    ROTARY_SUPPORT_DEVICE_IDS_V1,
    `${label} dynamic MCS accepted flows`,
  );
  for (const deviceId of ROTARY_SUPPORT_DEVICE_IDS_V1) {
    requireFinite(
      dynamic.acceptedFlowMlPerSec[deviceId],
      `${label} dynamic MCS ${deviceId} accepted flow`,
    );
  }
}

function validateCompatibility(
  current: MainWireIntegratedModelPeriodicAcceptedStateV2,
  reference: MainWireIntegratedModelPeriodicAcceptedStateV2,
): MainWireIntegratedModelPeriodicClosureReportV2["compatibility"] {
  const currentGenerated = current.generatedRhythmCalcium;
  const referenceGenerated = reference.generatedRhythmCalcium;
  const currentBindingJson = canonicalJsonStringify(currentGenerated.binding);
  const referenceBindingJson = canonicalJsonStringify(referenceGenerated.binding);
  if (currentBindingJson !== referenceBindingJson) {
    throw new Error("integrated periodic generated binding compatibility differs");
  }
  const currentConfigJson = canonicalJsonStringify(
    currentGenerated.generatorState.configuration,
  );
  const referenceConfigJson = canonicalJsonStringify(
    referenceGenerated.generatorState.configuration,
  );
  if (currentConfigJson !== referenceConfigJson) {
    throw new Error("integrated periodic generator config compatibility differs");
  }
  if (currentGenerated.initialization !== referenceGenerated.initialization) {
    throw new Error("integrated periodic generated initialization differs");
  }
  const sourceMode = currentGenerated.binding.generatorConfig.sourceMode;
  if (sourceMode !== "regular-sinus") {
    throw new Error(
      "integrated beat-periodic closure is not applicable to irregular rhythm or atrial flutter",
    );
  }
  const currentDynamic = current.dynamicMechanicalSupport;
  const referenceDynamic = reference.dynamicMechanicalSupport;
  const currentProfileJson = canonicalJsonStringify(
    currentDynamic.inertanceProfileSnapshot,
  );
  const referenceProfileJson = canonicalJsonStringify(
    referenceDynamic.inertanceProfileSnapshot,
  );
  if (currentProfileJson !== referenceProfileJson) {
    throw new Error("integrated periodic dynamic MCS inertance profile differs");
  }
  const currentProjectionJson = canonicalJsonStringify(
    currentDynamic.structuralHydraulicProjection,
  );
  const referenceProjectionJson = canonicalJsonStringify(
    referenceDynamic.structuralHydraulicProjection,
  );
  if (currentProjectionJson !== referenceProjectionJson) {
    throw new Error("integrated periodic dynamic MCS structural config differs");
  }
  return Object.freeze({
    integratedTransactionId: MAIN_WIRE_INTEGRATED_MODEL_TRANSACTION_V2_ID,
    generatedBindingCanonicalJson: currentBindingJson,
    generatorConfigCanonicalJson: currentConfigJson,
    dynamicMcsInertanceProfileCanonicalJson: currentProfileJson,
    dynamicMcsStructuralConfigProjectionCanonicalJson: currentProjectionJson,
    sourceMode,
    generatedInitialization: currentGenerated.initialization,
    pendingEventClassAndTargetCompatibilityExact: true as const,
  });
}

function validatePeriodicProvenance(
  current: MainWireIntegratedModelPeriodicAcceptedStateV2,
  reference: MainWireIntegratedModelPeriodicAcceptedStateV2,
): MainWireIntegratedModelPeriodicClosureReportV2["provenance"] {
  const currentGenerator = current.generatedRhythmCalcium.generatorState;
  const referenceGenerator = reference.generatedRhythmCalcium.generatorState;
  const period = currentGenerator.configuration.sourcePeriodSec;
  const timeAdvance = current.acceptedTimeSec - reference.acceptedTimeSec;
  const candidatePeriodLag = Math.round(timeAdvance / period);
  if ((candidatePeriodLag !== 1 && candidatePeriodLag !== 2)
    || !nearlyEqual(timeAdvance, candidatePeriodLag * period)) {
    throw new Error(
      "integrated periodic accepted clock must advance by exactly one or two source periods",
    );
  }
  const periodLag = candidatePeriodLag as 1 | 2;
  const revisionAdvance = current.revision - reference.revision;
  if (!Number.isSafeInteger(revisionAdvance) || revisionAdvance <= 0) {
    throw new Error("integrated periodic accepted revision must strictly advance");
  }
  const sourceIndexAdvance = currentGenerator.nextSourceIndex
    - referenceGenerator.nextSourceIndex;
  if (sourceIndexAdvance !== periodLag) {
    throw new Error(
      "integrated periodic next source index must advance by the period lag",
    );
  }
  const currentAv = currentGenerator.avGateState;
  const referenceAv = referenceGenerator.avGateState;
  const acceptedAdvance = currentAv.acceptedActivationCount
    - referenceAv.acceptedActivationCount;
  if (acceptedAdvance !== periodLag) {
    throw new Error(
      "integrated periodic AV accepted count must advance by the period lag",
    );
  }
  const conductedAdvance = currentAv.conductedActivationCount
    - referenceAv.conductedActivationCount;
  const blockedAdvance = currentAv.blockedActivationCount
    - referenceAv.blockedActivationCount;
  if (!Number.isInteger(conductedAdvance) || conductedAdvance < 0
    || conductedAdvance > periodLag
    || !Number.isInteger(blockedAdvance) || blockedAdvance < 0
    || blockedAdvance > periodLag
    || conductedAdvance + blockedAdvance !== periodLag) {
    throw new Error(
      "integrated periodic AV outcome counts must advance by the period lag",
    );
  }
  if (currentAv.hasPriorConduction !== referenceAv.hasPriorConduction) {
    throw new Error("integrated periodic AV prior-conduction state differs");
  }
  const coronaryDuration = current.coronary.coronaryAutoregulationBinding
    .windowPolicy.durationSec;
  if (!nearlyEqual(coronaryDuration, period)) {
    throw new Error("integrated periodic coronary window duration differs from source period");
  }
  return Object.freeze({
    sourcePeriodSec: period,
    periodLag,
    currentAcceptedTimeSec: current.acceptedTimeSec,
    referenceAcceptedTimeSec: reference.acceptedTimeSec,
    acceptedTimeAdvanceSec: timeAdvance,
    currentRevision: current.revision,
    referenceRevision: reference.revision,
    revisionAdvance,
    currentNextSourceIndex: currentGenerator.nextSourceIndex,
    referenceNextSourceIndex: referenceGenerator.nextSourceIndex,
    nextSourceIndexAdvance: periodLag,
    currentAvAcceptedActivationCount: currentAv.acceptedActivationCount,
    referenceAvAcceptedActivationCount: referenceAv.acceptedActivationCount,
    avAcceptedActivationCountAdvance: periodLag,
    avConductedActivationCountAdvance:
      conductedAdvance as 0 | 1 | 2,
    avBlockedActivationCountAdvance: blockedAdvance as 0 | 1 | 2,
    pendingEffectiveActivationCount:
      referenceGenerator.pendingActivationEvents.length,
    pendingLineageAdvanceByPeriodLag: true as const,
  });
}

function pairPendingLineage(
  current: MainWireIntegratedModelPeriodicAcceptedStateV2,
  reference: MainWireIntegratedModelPeriodicAcceptedStateV2,
  periodLag: 1 | 2,
): readonly Readonly<{
  currentEvent: AcceptedRhythmActivationEventV1;
  referenceEvent: AcceptedRhythmActivationEventV1;
  lineageKey: string;
}>[] {
  const currentEvents = current.generatedRhythmCalcium.generatorState
    .pendingActivationEvents;
  const referenceEvents = reference.generatedRhythmCalcium.generatorState
    .pendingActivationEvents;
  if (currentEvents.length !== referenceEvents.length) {
    throw new Error("integrated periodic pending effective-event lineage is incomplete or extra");
  }
  const pairs = referenceEvents.map((referenceEvent, index) => {
    const currentEvent = currentEvents[index];
    if (currentEvent === undefined) {
      throw new Error("integrated periodic pending effective-event lineage is incomplete");
    }
    const referenceSourceIndex = Math.floor(referenceEvent.sourceSequence / 2);
    const currentSourceIndex = Math.floor(currentEvent.sourceSequence / 2);
    const referenceClass = pendingEventClass(referenceEvent);
    const currentClass = pendingEventClass(currentEvent);
    if (currentSourceIndex !== referenceSourceIndex + periodLag
      || currentEvent.sourceSequence
        !== referenceEvent.sourceSequence + 2 * periodLag
      || currentEvent.beatOrdinal
        !== referenceEvent.beatOrdinal + periodLag
      || currentClass !== referenceClass
      || currentEvent.morphology !== referenceEvent.morphology
      || currentEvent.priority !== referenceEvent.priority
      || currentEvent.sourceId !== referenceEvent.sourceId
      || !arraysExactlyEqual(currentEvent.targetIds, referenceEvent.targetIds)) {
      throw new Error(
        "integrated periodic pending effective-event class, targets, or source lineage differs",
      );
    }
    const referenceOffset = referenceSourceIndex
      - reference.generatedRhythmCalcium.generatorState.nextSourceIndex;
    const currentOffset = currentSourceIndex
      - current.generatedRhythmCalcium.generatorState.nextSourceIndex;
    if (currentOffset !== referenceOffset) {
      throw new Error("integrated periodic normalized pending source lineage differs");
    }
    return Object.freeze({
      currentEvent,
      referenceEvent,
      lineageKey: `source-offset-${referenceOffset}:${referenceClass}`,
    });
  });
  return Object.freeze(pairs);
}

function pendingEventClass(
  event: AcceptedRhythmActivationEventV1,
): "atria" | "ventricles" {
  return event.sourceSequence % 2 === 0 ? "atria" : "ventricles";
}

function numericEntry(
  group: MainWireIntegratedModelPeriodicNumericDeltaEntryV2["group"],
  quantity: MainWireIntegratedModelPeriodicQuantityV2,
  unit: MainWireIntegratedModelPeriodicUnitV2,
  path: string,
  currentValue: number,
  referenceValue: number,
  referenceScale: number,
): MainWireIntegratedModelPeriodicNumericDeltaEntryV2 {
  requireFinite(currentValue, `${path} current value`);
  requireFinite(referenceValue, `${path} reference value`);
  requirePositiveFinite(referenceScale, `${path} reference scale`);
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

function coronaryGroupReport(
  closure: MainWireFiveWallCoronaryPeriodicClosureReportV3,
): MainWireIntegratedModelPeriodicClosureGroupReportV2 {
  return Object.freeze({
    group: "coronary-v3" as const,
    numericEntryCount: closure.overall.numericEntryCount,
    booleanEntryCount: closure.overall.booleanEntryCount,
    entryCount: closure.overall.entryCount,
    maximumNormalizedDelta: closure.overall.maximumNormalizedDelta,
    worstPath: closure.overall.worstPath,
    worstEntry: closure.overall.worstEntry,
  });
}

function numericGroupReport(
  group: Exclude<MainWireIntegratedModelPeriodicClosureGroupV2, "coronary-v3">,
  entries: readonly MainWireIntegratedModelPeriodicNumericDeltaEntryV2[],
): MainWireIntegratedModelPeriodicClosureGroupReportV2 {
  const first = entries[0] ?? null;
  const worst = first === null
    ? null
    : entries.reduce((candidate, entry) =>
      entry.normalizedDelta > candidate.normalizedDelta ? entry : candidate,
    first);
  return Object.freeze({
    group,
    numericEntryCount: entries.length,
    booleanEntryCount: 0,
    entryCount: entries.length,
    maximumNormalizedDelta: worst?.normalizedDelta ?? 0,
    worstPath: worst?.path ?? null,
    worstEntry: worst,
  });
}

function maximumGroup(
  groups: readonly MainWireIntegratedModelPeriodicClosureGroupReportV2[],
): MainWireIntegratedModelPeriodicClosureGroupReportV2 {
  const first = groups.find((group) => group.worstEntry !== null);
  if (first === undefined) {
    throw new Error("integrated periodic closure groups are empty");
  }
  return groups.reduce((candidate, group) =>
    group.worstEntry !== null
      && group.maximumNormalizedDelta > candidate.maximumNormalizedDelta
      ? group
      : candidate,
  first);
}

function validateScales(
  scales: MainWireIntegratedModelPeriodicReferenceScalesV2,
): void {
  if (typeof scales.scaleSetId !== "string" || scales.scaleSetId.length === 0) {
    throw new Error("integrated periodic scaleSetId must be non-empty");
  }
  assertExactKeys(
    scales.dynamicMcsAcceptedFlowMlPerSecByDevice,
    ROTARY_SUPPORT_DEVICE_IDS_V1,
    "integrated periodic dynamic MCS flow reference scales",
  );
  for (const [name, value] of Object.entries(scales)) {
    if (name === "scaleSetId") continue;
    if (name === "dynamicMcsAcceptedFlowMlPerSecByDevice") {
      for (const [deviceId, deviceScale] of Object.entries(
        value as Readonly<Record<string, number>>,
      )) requirePositiveFinite(deviceScale, `dynamic MCS ${deviceId} scale`);
    } else {
      requirePositiveFinite(value as number, `integrated periodic scale ${name}`);
    }
  }
}

function projectCoronaryScales(
  scales: MainWireIntegratedModelPeriodicReferenceScalesV2,
): MainWireFiveWallCoronaryPeriodicReferenceScalesV3 {
  return Object.freeze(Object.fromEntries(Object.keys(
    MAIN_WIRE_FIVE_WALL_CORONARY_PERIODIC_REFERENCE_SCALES_V3,
  ).map((key) => [
    key,
    scales[key as keyof MainWireFiveWallCoronaryPeriodicReferenceScalesV3],
  ]))) as unknown as MainWireFiveWallCoronaryPeriodicReferenceScalesV3;
}

function arraysExactlyEqual(
  left: readonly string[],
  right: readonly string[],
): boolean {
  return left.length === right.length
    && left.every((value, index) => value === right[index]);
}

function assertExactKeys(
  value: object,
  expected: readonly string[],
  label: string,
): void {
  const actual = Object.keys(value).sort();
  const required = [...expected].sort();
  if (actual.length !== required.length
    || actual.some((key, index) => key !== required[index])) {
    throw new Error(`${label} must contain exactly: ${required.join(", ")}`);
  }
}

function requireNonNullFinite(value: number | null, label: string): number {
  if (value === null) {
    throw new Error(
      `${label} is absent; regular-sinus periodic closure requires prior conduction`,
    );
  }
  return requireFinite(value, label);
}

function requireFinite(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${label} must be finite`);
  }
  return value;
}

function requireNonnegativeFinite(value: unknown, label: string): number {
  const number = requireFinite(value, label);
  if (number < 0) throw new Error(`${label} must be nonnegative`);
  return number;
}

function requirePositiveFinite(value: unknown, label: string): number {
  const number = requireFinite(value, label);
  if (!(number > 0)) throw new Error(`${label} must be positive`);
  return number;
}

function requireNonnegativeSafeInteger(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) {
    throw new Error(`${label} must be a nonnegative safe integer`);
  }
  return value;
}

function nearlyEqual(left: number, right: number): boolean {
  const scale = Math.max(1, Math.abs(left), Math.abs(right));
  return Math.abs(left - right) <= 64 * Number.EPSILON * scale;
}
