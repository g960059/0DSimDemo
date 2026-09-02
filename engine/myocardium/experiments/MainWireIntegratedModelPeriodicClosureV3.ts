import { createMechanicalSupportConfigV1 } from "@/engine/devices/defaultsV1";
import {
  DYNAMIC_MECHANICAL_SUPPORT_ACCEPTED_STATE_V1_ID,
  DYNAMIC_MECHANICAL_SUPPORT_NETWORK_V1_ID,
  validateDynamicMechanicalSupportAcceptedStateV1,
} from "@/engine/devices/dynamicNetworkV1";
import { DYNAMIC_ROTARY_PUMP_UNIT_SYSTEM_V1_ID } from "@/engine/devices/dynamicRotaryPumpV1";
import {
  ROTARY_SUPPORT_DEVICE_IDS_V1,
  type MechanicalSupportConfigV1,
} from "@/engine/devices/typesV1";
import {
  MAIN_WIRE_INTEGRATED_MODEL_TRANSACTION_V3_ID,
  type MainWireIntegratedModelAcceptedStateV3,
} from "@/engine/myocardium/MainWireIntegratedModelTransactionV3";
import {
  MAIN_WIRE_FIVE_WALL_CORONARY_PERIODIC_REFERENCE_SCALES_V3,
  compareMainWireFiveWallCoronaryAcceptedStatesV3,
  type MainWireFiveWallCoronaryPeriodicClosureReportV3,
  type MainWireFiveWallCoronaryPeriodicDeltaEntryV3,
  type MainWireFiveWallCoronaryPeriodicReferenceScalesV3,
} from "@/engine/myocardium/experiments/MainWireFiveWallCoronaryPeriodicClosureV3";
import {
  MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_REFERENCE_SCALES_V3,
  type MainWireIntegratedModelPeriodicReferenceScalesV3,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelReferenceScalesV3";
import type { MainWireNormalAdultFiveWallMechanicsStateV1 } from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallClosedLoopV1";
import {
  COMPOSED_RHYTHM_WALL_IDS_V2,
  validateAcceptedComposedRhythmTransactionStateV2,
  type AcceptedComposedRhythmTransactionStateV2,
} from "@/engine/myocardium/rhythm/acceptedComposedRhythmTransactionV2";
import type { CapturedElectricalActivationV2 } from "@/engine/myocardium/rhythm/acceptedElectricalCaptureOwnerV2";
import { canonicalJsonStringify } from "@/engine/integrity";

export const MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_CLOSURE_V3_ID =
  "main-wire-integrated-composed-rhythm-full-accepted-state-periodic-closure-v3" as const;

export const MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_CLOSURE_CLAIM_V3 = deepFreeze({
  scope:
    "canonical-provider-main-v3-regular-sinus-composed-rhythm-and-all-off-dynamic-MCS" as const,
  rhythmApplicability: "regular-sinus-source-period-boundaries-only" as const,
  coronaryComparator:
    "main-wire-five-wall-coronary-full-accepted-state-periodic-closure-v3" as const,
  composedRhythmCoverage: Object.freeze([
    "regular-source-clock-and-lineage",
    "empty-authored-ectopy-owner",
    "absent-authored-ventricular-pacing-replay-owner",
    "atrial-and-ventricular-capture-gates",
    "proximal-AV-recovery-concealment-owner",
    "distal-conduction-owner",
    "ventricular-backup-owner",
    "ventricular-interval-strength-owner",
    "proximal-distal-and-calcium-pending-queues",
    "five-wall-exact-event-calcium-state",
  ] as const),
  absoluteClockTreatment:
    "absolute-owner-times-compared-relative-to-the-exact-cycle-boundary" as const,
  lineageTreatment:
    "within-state-lineage-must-be-internally-exact-and-P1-P2-counter-advances-must-match-period-lag" as const,
  initialHistoryTreatment:
    "nullable-history-presence-and-structure-are-reported-as-delta-not-silently-discarded" as const,
  dynamicMechanicalSupport:
    "four-explicit-all-off-zero-inertance-circuits-with-exact-zero-accepted-q" as const,
  predeclaredReferenceScaleSetOwnedByIntegratedV3: true as const,
  thresholdsOrScalesDerivedFromV3Output: false as const,
  completeAcceptedStateNumericalPeriodicityIsPhysiology: false as const,
  normalConstructionTargetIsIndependentValidation: false as const,
  releaseAcceptanceClaimed: false as const,
  clinicalValidationClaimed: false as const,
});

export type MainWireIntegratedModelPeriodicAcceptedStateV3 =
  MainWireIntegratedModelAcceptedStateV3<MainWireNormalAdultFiveWallMechanicsStateV1>;

export type MainWireIntegratedModelPeriodicClosureGroupV3 =
  | "coronary-v3"
  | "dynamic-mcs-q"
  | "regular-source"
  | "electrical-capture"
  | "proximal-av"
  | "distal-conduction"
  | "ventricular-backup"
  | "interval-strength"
  | "pending-events"
  | "five-wall-calcium";

export type MainWireIntegratedModelPeriodicNumericDeltaEntryV3 = Readonly<{
  kind: "numeric";
  group: Exclude<MainWireIntegratedModelPeriodicClosureGroupV3, "coronary-v3">;
  path: string;
  unit: "s" | "mL/s" | "drive" | "dimensionless";
  currentValue: number;
  referenceValue: number;
  absoluteDelta: number;
  referenceScale: number;
  normalizedDelta: number;
}>;

export type MainWireIntegratedModelPeriodicExactDeltaEntryV3 = Readonly<{
  kind: "exact";
  group: Exclude<MainWireIntegratedModelPeriodicClosureGroupV3, "coronary-v3">;
  path: string;
  currentCanonicalJson: string;
  referenceCanonicalJson: string;
  exact: boolean;
  normalizedDelta: 0 | 1;
}>;

export type MainWireIntegratedModelPeriodicDeltaEntryV3 =
  | MainWireFiveWallCoronaryPeriodicDeltaEntryV3
  | MainWireIntegratedModelPeriodicNumericDeltaEntryV3
  | MainWireIntegratedModelPeriodicExactDeltaEntryV3;

export type MainWireIntegratedModelPeriodicClosureGroupReportV3 = Readonly<{
  group: MainWireIntegratedModelPeriodicClosureGroupV3;
  numericEntryCount: number;
  exactEntryCount: number;
  booleanEntryCount: number;
  entryCount: number;
  maximumNormalizedDelta: number;
  worstPath: string | null;
  worstEntry: MainWireIntegratedModelPeriodicDeltaEntryV3 | null;
}>;

export type MainWireIntegratedModelPeriodicClosureReportV3 = Readonly<{
  closureId: typeof MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_CLOSURE_V3_ID;
  referenceScaleSetId: string;
  coronaryClosure: MainWireFiveWallCoronaryPeriodicClosureReportV3;
  compatibility: Readonly<{
    integratedTransactionId: typeof MAIN_WIRE_INTEGRATED_MODEL_TRANSACTION_V3_ID;
    composedRhythmConfigurationCanonicalJson: string;
    dynamicMcsInertanceProfileCanonicalJson: string;
    dynamicMcsStructuralConfigProjectionCanonicalJson: string;
    dynamicMcsAllOffConfigCanonicalJson: string;
    initializationCanonicalJson: string;
    sourceMode: "regular-sinus";
    authoredEctopyScheduleEmpty: true;
    authoredVentricularPacingReplayAbsent: true;
    allDynamicMcsDevicesOff: true;
    allDynamicMcsInertancesZero: true;
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
    currentRegularNextSourceSequence: number;
    referenceRegularNextSourceSequence: number;
    regularSourceSequenceAdvance: 1 | 2;
    atrialCaptureCountAdvance: 1 | 2;
    ventricularCaptureCountAdvance: 1 | 2;
    deliveredCalciumDepositCountAdvance: 2 | 4;
    proximalAvAcceptedCountAdvance: 1 | 2;
    distalAcceptedCountAdvance: 1 | 2;
    ventricularBackupFeedbackCountAdvance: 1 | 2;
    intervalStrengthCaptureCountAdvance: 1 | 2;
  }>;
  gates: Readonly<{
    ownerClocksAndRevisionsValid: true;
    modelConfigurationsExact: true;
    regularSinusLineageAdvancesByPeriodLag: true;
    captureAvDistalBackupAndIntervalCountersAdvanceByPeriodLag: true;
    withinStateVentricularLineageExact: true;
    pendingQueuesCompletelyPaired: true;
    dynamicMcsAllOffAndZero: true;
    coronaryV3CompatibilityAndEmptyWindowsSatisfied: true;
  }>;
  groups: Readonly<
    Record<
      MainWireIntegratedModelPeriodicClosureGroupV3,
      MainWireIntegratedModelPeriodicClosureGroupReportV3
    >
  >;
  overall: Readonly<{
    coronaryNumericEntryCount: number;
    coronaryBooleanEntryCount: number;
    integratedNumericEntryCount: number;
    integratedExactEntryCount: number;
    numericEntryCount: number;
    exactEntryCount: number;
    booleanEntryCount: number;
    entryCount: number;
    maximumNormalizedDelta: number;
    worstGroup: MainWireIntegratedModelPeriodicClosureGroupV3;
    worstPath: string;
    worstEntry: MainWireIntegratedModelPeriodicDeltaEntryV3;
  }>;
}>;

const GROUP_ORDER = Object.freeze([
  "coronary-v3",
  "dynamic-mcs-q",
  "regular-source",
  "electrical-capture",
  "proximal-av",
  "distal-conduction",
  "ventricular-backup",
  "interval-strength",
  "pending-events",
  "five-wall-calcium",
] as const satisfies readonly MainWireIntegratedModelPeriodicClosureGroupV3[]);

const ALL_OFF_CONFIG = createMechanicalSupportConfigV1();

export function compareMainWireIntegratedModelAcceptedStatesV3(
  current: MainWireIntegratedModelPeriodicAcceptedStateV3,
  reference: MainWireIntegratedModelPeriodicAcceptedStateV3,
  scales: MainWireIntegratedModelPeriodicReferenceScalesV3 = MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_REFERENCE_SCALES_V3,
  expectedAllOffConfig: MechanicalSupportConfigV1 = ALL_OFF_CONFIG,
): MainWireIntegratedModelPeriodicClosureReportV3 {
  validateScales(scales);
  assertAllOffConfig(expectedAllOffConfig);
  validateState(current, "current", expectedAllOffConfig);
  validateState(reference, "reference", expectedAllOffConfig);
  const compatibility = validateCompatibility(
    current,
    reference,
    expectedAllOffConfig,
  );
  const provenance = validateProvenance(current, reference);
  validateWithinStateLineage(current, "current");
  validateWithinStateLineage(reference, "reference");
  const coronaryClosure = compareMainWireFiveWallCoronaryAcceptedStatesV3(
    current.coronary,
    reference.coronary,
    projectCoronaryScales(scales),
  );
  const entries: Array<
    | MainWireIntegratedModelPeriodicNumericDeltaEntryV3
    | MainWireIntegratedModelPeriodicExactDeltaEntryV3
  > = [];

  for (const deviceId of ROTARY_SUPPORT_DEVICE_IDS_V1) {
    entries.push(
      numericEntry(
        "dynamic-mcs-q",
        `dynamicMechanicalSupport.acceptedFlowMlPerSec.${deviceId}`,
        "mL/s",
        current.dynamicMechanicalSupport.acceptedFlowMlPerSec[deviceId],
        reference.dynamicMechanicalSupport.acceptedFlowMlPerSec[deviceId],
        scales.dynamicMcsAcceptedFlowMlPerSecByDevice[deviceId],
      ),
    );
  }

  const currentRhythm = current.composedRhythm;
  const referenceRhythm = reference.composedRhythm;
  const currentRegular = currentRhythm.regularAtrialSourceState!;
  const referenceRegular = referenceRhythm.regularAtrialSourceState!;
  entries.push(
    numericEntry(
      "regular-source",
      "composedRhythm.regularAtrialSourceState.nextActivationTimeSecRelativeToBoundary",
      "s",
      currentRegular.nextActivationTimeSec - current.acceptedTimeSec,
      referenceRegular.nextActivationTimeSec - reference.acceptedTimeSec,
      scales.generatedNextSourceRelativeTimingSec,
    ),
  );
  entries.push(
    exactEntry(
      "regular-source",
      "composedRhythm.regularAndAuthoredSourceStructure",
      regularSourceStructure(currentRhythm),
      regularSourceStructure(referenceRhythm),
    ),
  );

  addCaptureEntries(entries, current, reference, scales);
  addProximalAvEntries(entries, current, reference, scales);
  addDistalEntries(entries, current, reference, scales);
  addBackupEntries(entries, current, reference, scales);
  addIntervalEntries(entries, current, reference, scales);
  addPendingEntries(entries, current, reference, scales, provenance.periodLag);

  for (const wallId of COMPOSED_RHYTHM_WALL_IDS_V2) {
    const currentCalcium = currentRhythm.calciumStateByWall[wallId];
    const referenceCalcium = referenceRhythm.calciumStateByWall[wallId];
    entries.push(
      numericEntry(
        "five-wall-calcium",
        `composedRhythm.calciumStateByWall.${wallId}.riseDrive`,
        "drive",
        currentCalcium[0],
        referenceCalcium[0],
        scales.generatedCalciumRiseDrive,
      ),
    );
    entries.push(
      numericEntry(
        "five-wall-calcium",
        `composedRhythm.calciumStateByWall.${wallId}.decayDrive`,
        "drive",
        currentCalcium[1],
        referenceCalcium[1],
        scales.generatedCalciumDecayDrive,
      ),
    );
  }

  const groups = Object.freeze(
    Object.fromEntries(
      GROUP_ORDER.map((group) =>
        group === "coronary-v3"
          ? [group, coronaryGroupReport(coronaryClosure)]
          : [
              group,
              integratedGroupReport(
                group,
                entries.filter((entry) => entry.group === group),
              ),
            ],
      ),
    ),
  ) as MainWireIntegratedModelPeriodicClosureReportV3["groups"];
  const worstGroup = maximumGroup(GROUP_ORDER.map((group) => groups[group]));
  if (worstGroup.worstEntry === null || worstGroup.worstPath === null) {
    throw new Error(
      "V3 integrated periodic closure unexpectedly has no entries",
    );
  }
  const integratedNumericEntryCount = entries.filter(
    (entry) => entry.kind === "numeric",
  ).length;
  const integratedExactEntryCount = entries.filter(
    (entry) => entry.kind === "exact",
  ).length;
  return deepFreeze({
    closureId: MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_CLOSURE_V3_ID,
    referenceScaleSetId: scales.scaleSetId,
    coronaryClosure,
    compatibility,
    provenance,
    gates: {
      ownerClocksAndRevisionsValid: true as const,
      modelConfigurationsExact: true as const,
      regularSinusLineageAdvancesByPeriodLag: true as const,
      captureAvDistalBackupAndIntervalCountersAdvanceByPeriodLag: true as const,
      withinStateVentricularLineageExact: true as const,
      pendingQueuesCompletelyPaired: true as const,
      dynamicMcsAllOffAndZero: true as const,
      coronaryV3CompatibilityAndEmptyWindowsSatisfied: true as const,
    },
    groups,
    overall: {
      coronaryNumericEntryCount: coronaryClosure.overall.numericEntryCount,
      coronaryBooleanEntryCount: coronaryClosure.overall.booleanEntryCount,
      integratedNumericEntryCount,
      integratedExactEntryCount,
      numericEntryCount:
        coronaryClosure.overall.numericEntryCount + integratedNumericEntryCount,
      exactEntryCount: integratedExactEntryCount,
      booleanEntryCount: coronaryClosure.overall.booleanEntryCount,
      entryCount: coronaryClosure.overall.entryCount + entries.length,
      maximumNormalizedDelta: worstGroup.maximumNormalizedDelta,
      worstGroup: worstGroup.group,
      worstPath: worstGroup.worstPath,
      worstEntry: worstGroup.worstEntry,
    },
  });
}

function validateState(
  state: MainWireIntegratedModelPeriodicAcceptedStateV3,
  label: string,
  expectedAllOffConfig: MechanicalSupportConfigV1,
): void {
  if (state.transactionId !== MAIN_WIRE_INTEGRATED_MODEL_TRANSACTION_V3_ID) {
    throw new Error(`${label} V3 integrated transaction identity differs`);
  }
  validateAcceptedComposedRhythmTransactionStateV2(state.composedRhythm);
  validateDynamicMechanicalSupportAcceptedStateV1(
    state.dynamicMechanicalSupport,
    state.dynamicMechanicalSupport.inertanceProfileSnapshot,
    expectedAllOffConfig,
  );
  if (
    state.revision !== state.coronary.revision ||
    state.revision !== state.composedRhythm.revision ||
    state.acceptedTimeSec !== state.coronary.acceptedTimeSec ||
    state.acceptedTimeSec !== state.composedRhythm.acceptedTimeSec
  ) {
    throw new Error(`${label} V3 integrated owner clocks or revisions differ`);
  }
  if (
    state.dynamicMechanicalSupport.stateSchemaId !==
      DYNAMIC_MECHANICAL_SUPPORT_ACCEPTED_STATE_V1_ID ||
    state.dynamicMechanicalSupport.networkId !==
      DYNAMIC_MECHANICAL_SUPPORT_NETWORK_V1_ID ||
    state.dynamicMechanicalSupport.unitSystemId !==
      DYNAMIC_ROTARY_PUMP_UNIT_SYSTEM_V1_ID
  ) {
    throw new Error(`${label} dynamic MCS accepted identity differs`);
  }
  for (const deviceId of ROTARY_SUPPORT_DEVICE_IDS_V1) {
    if (state.dynamicMechanicalSupport.acceptedFlowMlPerSec[deviceId] !== 0) {
      throw new Error(
        `${label} all-off ${deviceId} accepted q must be exactly zero`,
      );
    }
    const inertance =
      state.dynamicMechanicalSupport.inertanceProfileSnapshot.inertanceByDevice[
        deviceId
      ];
    if (
      inertance.pumpInternalMmHgSec2PerMl !== 0 ||
      inertance.drainageMmHgSec2PerMl !== 0 ||
      inertance.oxygenatorMmHgSec2PerMl !== 0 ||
      inertance.returnPathMmHgSec2PerMl !== 0
    ) {
      throw new Error(`${label} all-off ${deviceId} inertance must be zero`);
    }
  }
}

function validateCompatibility(
  current: MainWireIntegratedModelPeriodicAcceptedStateV3,
  reference: MainWireIntegratedModelPeriodicAcceptedStateV3,
  expectedAllOffConfig: MechanicalSupportConfigV1,
): MainWireIntegratedModelPeriodicClosureReportV3["compatibility"] {
  const currentRhythm = current.composedRhythm;
  const referenceRhythm = reference.composedRhythm;
  const configurationJson = canonicalJsonStringify(currentRhythm.configuration);
  if (
    configurationJson !== canonicalJsonStringify(referenceRhythm.configuration)
  ) {
    throw new Error("V3 periodic composed-rhythm configuration differs");
  }
  const source = currentRhythm.configuration.atrialSource;
  if (
    source.mode !== "regular" ||
    source.regularSourceConfiguration.rhythmClass !== "sinus" ||
    currentRhythm.regularAtrialSourceState === null ||
    referenceRhythm.regularAtrialSourceState === null
  ) {
    throw new Error("V3 periodic closure requires regular sinus source mode");
  }
  if (
    currentRhythm.configuration.authoredEctopySchedule.events.length !== 0 ||
    referenceRhythm.configuration.authoredEctopySchedule.events.length !== 0 ||
    currentRhythm.authoredEctopyState.cursor !== 0 ||
    referenceRhythm.authoredEctopyState.cursor !== 0 ||
    currentRhythm.authoredEctopyState.acceptedEmittedImpulseCount !== 0 ||
    referenceRhythm.authoredEctopyState.acceptedEmittedImpulseCount !== 0
  ) {
    throw new Error(
      "V3 baseline periodic closure requires empty authored ectopy",
    );
  }
  if (
    currentRhythm.configuration.authoredVentricularPacingReplay !== null ||
    referenceRhythm.configuration.authoredVentricularPacingReplay !== null ||
    currentRhythm.authoredVentricularPacingReplayState !== null ||
    referenceRhythm.authoredVentricularPacingReplayState !== null
  ) {
    throw new Error(
      "V3 baseline periodic closure requires absent pacing replay",
    );
  }
  const profileJson = canonicalJsonStringify(
    current.dynamicMechanicalSupport.inertanceProfileSnapshot,
  );
  if (
    profileJson !==
    canonicalJsonStringify(
      reference.dynamicMechanicalSupport.inertanceProfileSnapshot,
    )
  ) {
    throw new Error("V3 periodic dynamic MCS inertance profile differs");
  }
  const projectionJson = canonicalJsonStringify(
    current.dynamicMechanicalSupport.structuralHydraulicProjection,
  );
  if (
    projectionJson !==
    canonicalJsonStringify(
      reference.dynamicMechanicalSupport.structuralHydraulicProjection,
    )
  ) {
    throw new Error("V3 periodic dynamic MCS structural projection differs");
  }
  const initializationJson = canonicalJsonStringify(
    initializationProjection(currentRhythm),
  );
  if (
    initializationJson !==
    canonicalJsonStringify(initializationProjection(referenceRhythm))
  ) {
    throw new Error("V3 periodic composed-rhythm initialization differs");
  }
  const allOffConfigJson = canonicalJsonStringify(expectedAllOffConfig);
  return Object.freeze({
    integratedTransactionId: MAIN_WIRE_INTEGRATED_MODEL_TRANSACTION_V3_ID,
    composedRhythmConfigurationCanonicalJson: configurationJson,
    dynamicMcsInertanceProfileCanonicalJson: profileJson,
    dynamicMcsStructuralConfigProjectionCanonicalJson: projectionJson,
    dynamicMcsAllOffConfigCanonicalJson: allOffConfigJson,
    initializationCanonicalJson: initializationJson,
    sourceMode: "regular-sinus" as const,
    authoredEctopyScheduleEmpty: true as const,
    authoredVentricularPacingReplayAbsent: true as const,
    allDynamicMcsDevicesOff: true as const,
    allDynamicMcsInertancesZero: true as const,
  });
}

function validateProvenance(
  current: MainWireIntegratedModelPeriodicAcceptedStateV3,
  reference: MainWireIntegratedModelPeriodicAcceptedStateV3,
): MainWireIntegratedModelPeriodicClosureReportV3["provenance"] {
  const currentRhythm = current.composedRhythm;
  const referenceRhythm = reference.composedRhythm;
  const currentRegular = currentRhythm.regularAtrialSourceState!;
  const referenceRegular = referenceRhythm.regularAtrialSourceState!;
  const period = currentRegular.configuration.cycleLengthSec;
  const candidateLag =
    current.coronary.coronaryAutoregulation.windowIndex
    - reference.coronary.coronaryAutoregulation.windowIndex;
  const acceptedTimeAdvanceSec =
    current.acceptedTimeSec - reference.acceptedTimeSec;
  if (
    (candidateLag !== 1 && candidateLag !== 2) ||
    !acceptedClockAdvanceMatchesV3(
      current.acceptedTimeSec,
      reference.acceptedTimeSec,
      candidateLag * period,
    )
  ) {
    throw new Error("V3 periodic clock must advance by exactly P1 or P2");
  }
  const periodLag = candidateLag as 1 | 2;
  const revisionAdvance = current.revision - reference.revision;
  if (!Number.isSafeInteger(revisionAdvance) || revisionAdvance <= 0) {
    throw new Error("V3 periodic outer revision must strictly advance");
  }
  expectAdvance(
    currentRegular.nextSourceSequence,
    referenceRegular.nextSourceSequence,
    periodLag,
    "regular next source sequence",
  );
  expectAdvance(
    currentRegular.emittedSourceImpulseCount,
    referenceRegular.emittedSourceImpulseCount,
    periodLag,
    "regular emitted source count",
  );
  const counterPairs: readonly [number, number, number, string][] = [
    [
      currentRhythm.acceptedAtrialCaptureCount,
      referenceRhythm.acceptedAtrialCaptureCount,
      periodLag,
      "composed atrial capture count",
    ],
    [
      currentRhythm.acceptedVentricularCaptureCount,
      referenceRhythm.acceptedVentricularCaptureCount,
      periodLag,
      "composed ventricular capture count",
    ],
    [
      currentRhythm.deliveredCalciumDepositCount,
      referenceRhythm.deliveredCalciumDepositCount,
      2 * periodLag,
      "delivered calcium count",
    ],
    [
      currentRhythm.electricalCaptureState.revision,
      referenceRhythm.electricalCaptureState.revision,
      2 * periodLag,
      "capture owner revision",
    ],
    [
      currentRhythm.electricalCaptureState.acceptedImpulseBatchCount,
      referenceRhythm.electricalCaptureState.acceptedImpulseBatchCount,
      2 * periodLag,
      "capture batch count",
    ],
    [
      currentRhythm.electricalCaptureState.atrialGate.revision,
      referenceRhythm.electricalCaptureState.atrialGate.revision,
      periodLag,
      "atrial capture gate revision",
    ],
    [
      currentRhythm.electricalCaptureState.atrialGate.acceptedBatchCount,
      referenceRhythm.electricalCaptureState.atrialGate.acceptedBatchCount,
      periodLag,
      "atrial capture gate accepted batch count",
    ],
    [
      currentRhythm.electricalCaptureState.atrialGate.processedImpulseCount,
      referenceRhythm.electricalCaptureState.atrialGate.processedImpulseCount,
      periodLag,
      "atrial capture gate processed impulse count",
    ],
    [
      currentRhythm.electricalCaptureState.atrialGate.capturedActivationCount,
      referenceRhythm.electricalCaptureState.atrialGate.capturedActivationCount,
      periodLag,
      "atrial gate capture count",
    ],
    [
      currentRhythm.electricalCaptureState.ventricularGate.revision,
      referenceRhythm.electricalCaptureState.ventricularGate.revision,
      periodLag,
      "ventricular capture gate revision",
    ],
    [
      currentRhythm.electricalCaptureState.ventricularGate.acceptedBatchCount,
      referenceRhythm.electricalCaptureState.ventricularGate.acceptedBatchCount,
      periodLag,
      "ventricular capture gate accepted batch count",
    ],
    [
      currentRhythm.electricalCaptureState.ventricularGate
        .processedImpulseCount,
      referenceRhythm.electricalCaptureState.ventricularGate
        .processedImpulseCount,
      periodLag,
      "ventricular capture gate processed impulse count",
    ],
    [
      currentRhythm.electricalCaptureState.ventricularGate
        .capturedActivationCount,
      referenceRhythm.electricalCaptureState.ventricularGate
        .capturedActivationCount,
      periodLag,
      "ventricular gate capture count",
    ],
    [
      currentRhythm.proximalAvGateState.revision,
      referenceRhythm.proximalAvGateState.revision,
      periodLag,
      "proximal AV revision",
    ],
    [
      currentRhythm.proximalAvGateState.acceptedAtrialActivationCount,
      referenceRhythm.proximalAvGateState.acceptedAtrialActivationCount,
      periodLag,
      "proximal AV accepted count",
    ],
    [
      currentRhythm.proximalAvGateState.conductedAtrialActivationCount,
      referenceRhythm.proximalAvGateState.conductedAtrialActivationCount,
      periodLag,
      "proximal AV conducted count",
    ],
    [
      currentRhythm.proximalAvGateState.blockedAtrialActivationCount,
      referenceRhythm.proximalAvGateState.blockedAtrialActivationCount,
      0,
      "proximal AV blocked count",
    ],
    [
      currentRhythm.distalGateState.revision,
      referenceRhythm.distalGateState.revision,
      periodLag,
      "distal revision",
    ],
    [
      currentRhythm.distalGateState.acceptedProximalArrivalCount,
      referenceRhythm.distalGateState.acceptedProximalArrivalCount,
      periodLag,
      "distal accepted count",
    ],
    [
      currentRhythm.distalGateState.passedArrivalCount,
      referenceRhythm.distalGateState.passedArrivalCount,
      periodLag,
      "distal passed count",
    ],
    [
      currentRhythm.ventricularBackupState
        .acceptedVentricularCaptureFeedbackCount,
      referenceRhythm.ventricularBackupState
        .acceptedVentricularCaptureFeedbackCount,
      periodLag,
      "backup feedback count",
    ],
    [
      currentRhythm.ventricularIntervalStrengthState.revision,
      referenceRhythm.ventricularIntervalStrengthState.revision,
      periodLag,
      "interval-strength revision",
    ],
    [
      currentRhythm.ventricularIntervalStrengthState
        .acceptedVentricularCaptureCount,
      referenceRhythm.ventricularIntervalStrengthState
        .acceptedVentricularCaptureCount,
      periodLag,
      "interval capture count",
    ],
  ];
  for (const [currentValue, referenceValue, expected, label] of counterPairs) {
    expectAdvance(currentValue, referenceValue, expected, label);
  }
  const unchangedPairs: readonly [number, number, string][] = [
    [
      currentRegular.capturedPacResetCount,
      referenceRegular.capturedPacResetCount,
      "regular PAC reset count",
    ],
    [
      currentRegular.capturedPacPreserveCount,
      referenceRegular.capturedPacPreserveCount,
      "regular PAC preserve count",
    ],
    [
      currentRhythm.electricalCaptureState.atrialGate.coincidentSuppressedCount,
      referenceRhythm.electricalCaptureState.atrialGate
        .coincidentSuppressedCount,
      "atrial coincident suppression count",
    ],
    [
      currentRhythm.electricalCaptureState.atrialGate.refractoryBlockedCount,
      referenceRhythm.electricalCaptureState.atrialGate.refractoryBlockedCount,
      "atrial refractory block count",
    ],
    [
      currentRhythm.electricalCaptureState.ventricularGate
        .coincidentSuppressedCount,
      referenceRhythm.electricalCaptureState.ventricularGate
        .coincidentSuppressedCount,
      "ventricular coincident suppression count",
    ],
    [
      currentRhythm.electricalCaptureState.ventricularGate
        .refractoryBlockedCount,
      referenceRhythm.electricalCaptureState.ventricularGate
        .refractoryBlockedCount,
      "ventricular refractory block count",
    ],
    [
      currentRhythm.distalGateState.distalRefractoryDropCount,
      referenceRhythm.distalGateState.distalRefractoryDropCount,
      "distal refractory drop count",
    ],
    [
      currentRhythm.distalGateState.authoredMaskDropCount,
      referenceRhythm.distalGateState.authoredMaskDropCount,
      "distal mask drop count",
    ],
    [
      currentRhythm.distalGateState.authoredMaskExhaustedDropCount,
      referenceRhythm.distalGateState.authoredMaskExhaustedDropCount,
      "distal exhausted drop count",
    ],
    [
      currentRhythm.distalGateState.disconnectedDropCount,
      referenceRhythm.distalGateState.disconnectedDropCount,
      "distal disconnected count",
    ],
    [
      currentRhythm.ventricularBackupState.intrinsicEscapeAttemptCount,
      referenceRhythm.ventricularBackupState.intrinsicEscapeAttemptCount,
      "intrinsic escape attempt count",
    ],
    [
      currentRhythm.ventricularBackupState.vviPacingAttemptCount,
      referenceRhythm.ventricularBackupState.vviPacingAttemptCount,
      "VVI attempt count",
    ],
    [
      currentRhythm.ventricularBackupState.intrinsicEscapeCapturedCount,
      referenceRhythm.ventricularBackupState.intrinsicEscapeCapturedCount,
      "intrinsic escape captured count",
    ],
    [
      currentRhythm.ventricularBackupState.vviPacingCapturedCount,
      referenceRhythm.ventricularBackupState.vviPacingCapturedCount,
      "VVI captured count",
    ],
  ];
  for (const [currentValue, referenceValue, label] of unchangedPairs) {
    expectAdvance(currentValue, referenceValue, 0, label);
  }
  return Object.freeze({
    sourcePeriodSec: period,
    periodLag,
    currentAcceptedTimeSec: current.acceptedTimeSec,
    referenceAcceptedTimeSec: reference.acceptedTimeSec,
    acceptedTimeAdvanceSec,
    currentRevision: current.revision,
    referenceRevision: reference.revision,
    revisionAdvance,
    currentRegularNextSourceSequence: currentRegular.nextSourceSequence,
    referenceRegularNextSourceSequence: referenceRegular.nextSourceSequence,
    regularSourceSequenceAdvance: periodLag,
    atrialCaptureCountAdvance: periodLag,
    ventricularCaptureCountAdvance: periodLag,
    deliveredCalciumDepositCountAdvance: (2 * periodLag) as 2 | 4,
    proximalAvAcceptedCountAdvance: periodLag,
    distalAcceptedCountAdvance: periodLag,
    ventricularBackupFeedbackCountAdvance: periodLag,
    intervalStrengthCaptureCountAdvance: periodLag,
  });
}

type IntegratedEntry =
  | MainWireIntegratedModelPeriodicNumericDeltaEntryV3
  | MainWireIntegratedModelPeriodicExactDeltaEntryV3;

function addCaptureEntries(
  entries: IntegratedEntry[],
  current: MainWireIntegratedModelPeriodicAcceptedStateV3,
  reference: MainWireIntegratedModelPeriodicAcceptedStateV3,
  scales: MainWireIntegratedModelPeriodicReferenceScalesV3,
): void {
  const currentCapture = current.composedRhythm.electricalCaptureState;
  const referenceCapture = reference.composedRhythm.electricalCaptureState;
  addNullableRelativeTime(
    entries,
    "electrical-capture",
    "composedRhythm.electricalCaptureState.lastAcceptedImpulseBatchTimeSec",
    currentCapture.lastAcceptedImpulseBatchTimeSec,
    referenceCapture.lastAcceptedImpulseBatchTimeSec,
    current.acceptedTimeSec,
    reference.acceptedTimeSec,
    scales.generatedAvRelativeTimingSec,
  );
  for (const chamber of ["atrialGate", "ventricularGate"] as const) {
    const currentGate = currentCapture[chamber];
    const referenceGate = referenceCapture[chamber];
    addNullableRelativeTime(
      entries,
      "electrical-capture",
      `composedRhythm.electricalCaptureState.${chamber}.lastCapturedActivationTimeSec`,
      currentGate.lastCapturedActivationTimeSec,
      referenceGate.lastCapturedActivationTimeSec,
      current.acceptedTimeSec,
      reference.acceptedTimeSec,
      scales.generatedAvRelativeTimingSec,
    );
    entries.push(
      numericEntry(
        "electrical-capture",
        `composedRhythm.electricalCaptureState.${chamber}.refractoryUntilSecRelativeToBoundary`,
        "s",
        currentGate.refractoryUntilSec - current.acceptedTimeSec,
        referenceGate.refractoryUntilSec - reference.acceptedTimeSec,
        scales.generatedAvRelativeTimingSec,
      ),
    );
  }
  entries.push(
    exactEntry(
      "electrical-capture",
      "composedRhythm.electricalCaptureState.periodicStructure",
      captureStructure(current.composedRhythm),
      captureStructure(reference.composedRhythm),
    ),
  );
}

function addProximalAvEntries(
  entries: IntegratedEntry[],
  current: MainWireIntegratedModelPeriodicAcceptedStateV3,
  reference: MainWireIntegratedModelPeriodicAcceptedStateV3,
  scales: MainWireIntegratedModelPeriodicReferenceScalesV3,
): void {
  const currentAv = current.composedRhythm.proximalAvGateState;
  const referenceAv = reference.composedRhythm.proximalAvGateState;
  entries.push(
    numericEntry(
      "proximal-av",
      "composedRhythm.proximalAvGateState.acceptedAtrialActivationTimeSecRelativeToBoundary",
      "s",
      currentAv.acceptedAtrialActivationTimeSec - current.acceptedTimeSec,
      referenceAv.acceptedAtrialActivationTimeSec - reference.acceptedTimeSec,
      scales.generatedAvRelativeTimingSec,
    ),
  );
  entries.push(
    numericEntry(
      "proximal-av",
      "composedRhythm.proximalAvGateState.proximalAvRefractoryUntilSecRelativeToBoundary",
      "s",
      currentAv.proximalAvRefractoryUntilSec - current.acceptedTimeSec,
      referenceAv.proximalAvRefractoryUntilSec - reference.acceptedTimeSec,
      scales.generatedAvRelativeTimingSec,
    ),
  );
  addNullableRelativeTime(
    entries,
    "proximal-av",
    "composedRhythm.proximalAvGateState.lastConductedAtrialActivationTimeSec",
    currentAv.lastConductedAtrialActivationTimeSec,
    referenceAv.lastConductedAtrialActivationTimeSec,
    current.acceptedTimeSec,
    reference.acceptedTimeSec,
    scales.generatedAvRelativeTimingSec,
  );
  addNullableRelativeTime(
    entries,
    "proximal-av",
    "composedRhythm.proximalAvGateState.lastProximalAvOutputTimeSec",
    currentAv.lastProximalAvOutputTimeSec,
    referenceAv.lastProximalAvOutputTimeSec,
    current.acceptedTimeSec,
    reference.acceptedTimeSec,
    scales.generatedAvRelativeTimingSec,
  );
  entries.push(
    exactEntry(
      "proximal-av",
      "composedRhythm.proximalAvGateState.periodicStructure",
      { hasPriorProximalAvOutput: currentAv.hasPriorProximalAvOutput },
      { hasPriorProximalAvOutput: referenceAv.hasPriorProximalAvOutput },
    ),
  );
}

function addDistalEntries(
  entries: IntegratedEntry[],
  current: MainWireIntegratedModelPeriodicAcceptedStateV3,
  reference: MainWireIntegratedModelPeriodicAcceptedStateV3,
  scales: MainWireIntegratedModelPeriodicReferenceScalesV3,
): void {
  const currentDistal = current.composedRhythm.distalGateState;
  const referenceDistal = reference.composedRhythm.distalGateState;
  entries.push(
    numericEntry(
      "distal-conduction",
      "composedRhythm.distalGateState.acceptedTimeSecRelativeToBoundary",
      "s",
      currentDistal.acceptedTimeSec - current.acceptedTimeSec,
      referenceDistal.acceptedTimeSec - reference.acceptedTimeSec,
      scales.generatedAvRelativeTimingSec,
    ),
  );
  entries.push(
    numericEntry(
      "distal-conduction",
      "composedRhythm.distalGateState.distalReadyAtSecRelativeToBoundary",
      "s",
      currentDistal.distalReadyAtSec - current.acceptedTimeSec,
      referenceDistal.distalReadyAtSec - reference.acceptedTimeSec,
      scales.generatedAvRelativeTimingSec,
    ),
  );
  addNullableRelativeTime(
    entries,
    "distal-conduction",
    "composedRhythm.distalGateState.lastPassedProximalArrivalTimeSec",
    currentDistal.lastPassedProximalArrivalTimeSec,
    referenceDistal.lastPassedProximalArrivalTimeSec,
    current.acceptedTimeSec,
    reference.acceptedTimeSec,
    scales.generatedAvRelativeTimingSec,
  );
  addNullableRelativeTime(
    entries,
    "distal-conduction",
    "composedRhythm.distalGateState.lastVentricularImpulseTimeSec",
    currentDistal.lastVentricularImpulseTimeSec,
    referenceDistal.lastVentricularImpulseTimeSec,
    current.acceptedTimeSec,
    reference.acceptedTimeSec,
    scales.generatedAvRelativeTimingSec,
  );
  entries.push(
    exactEntry(
      "distal-conduction",
      "composedRhythm.distalGateState.periodicStructure",
      { authoredMaskPosition: currentDistal.authoredMaskPosition },
      { authoredMaskPosition: referenceDistal.authoredMaskPosition },
    ),
  );
}

function addBackupEntries(
  entries: IntegratedEntry[],
  current: MainWireIntegratedModelPeriodicAcceptedStateV3,
  reference: MainWireIntegratedModelPeriodicAcceptedStateV3,
  scales: MainWireIntegratedModelPeriodicReferenceScalesV3,
): void {
  const currentBackup = current.composedRhythm.ventricularBackupState;
  const referenceBackup = reference.composedRhythm.ventricularBackupState;
  entries.push(
    numericEntry(
      "ventricular-backup",
      "composedRhythm.ventricularBackupState.acceptedTimeSecRelativeToBoundary",
      "s",
      currentBackup.acceptedTimeSec - current.acceptedTimeSec,
      referenceBackup.acceptedTimeSec - reference.acceptedTimeSec,
      scales.generatedAvRelativeTimingSec,
    ),
  );
  entries.push(
    numericEntry(
      "ventricular-backup",
      "composedRhythm.ventricularBackupState.nextIntrinsicEscapeDueTimeSecRelativeToBoundary",
      "s",
      currentBackup.nextIntrinsicEscapeDueTimeSec - current.acceptedTimeSec,
      referenceBackup.nextIntrinsicEscapeDueTimeSec - reference.acceptedTimeSec,
      scales.generatedAvRelativeTimingSec,
    ),
  );
  entries.push(
    numericEntry(
      "ventricular-backup",
      "composedRhythm.ventricularBackupState.nextVviPaceDueTimeSecRelativeToBoundary",
      "s",
      currentBackup.nextVviPaceDueTimeSec - current.acceptedTimeSec,
      referenceBackup.nextVviPaceDueTimeSec - reference.acceptedTimeSec,
      scales.generatedAvRelativeTimingSec,
    ),
  );
  addNullableRelativeTime(
    entries,
    "ventricular-backup",
    "composedRhythm.ventricularBackupState.lastAcceptedVentricularActivation.activationTimeSec",
    currentBackup.lastAcceptedVentricularActivation?.activationTimeSec ?? null,
    referenceBackup.lastAcceptedVentricularActivation?.activationTimeSec ??
      null,
    current.acceptedTimeSec,
    reference.acceptedTimeSec,
    scales.generatedAvRelativeTimingSec,
  );
  addNullableRelativeTime(
    entries,
    "ventricular-backup",
    "composedRhythm.ventricularBackupState.lastIntrinsicEscapeAttemptResult.activationTimeSec",
    currentBackup.lastIntrinsicEscapeAttemptResult?.activationTimeSec ?? null,
    referenceBackup.lastIntrinsicEscapeAttemptResult?.activationTimeSec ?? null,
    current.acceptedTimeSec,
    reference.acceptedTimeSec,
    scales.generatedAvRelativeTimingSec,
  );
  addNullableRelativeTime(
    entries,
    "ventricular-backup",
    "composedRhythm.ventricularBackupState.lastVviPacingAttemptResult.activationTimeSec",
    currentBackup.lastVviPacingAttemptResult?.activationTimeSec ?? null,
    referenceBackup.lastVviPacingAttemptResult?.activationTimeSec ?? null,
    current.acceptedTimeSec,
    reference.acceptedTimeSec,
    scales.generatedAvRelativeTimingSec,
  );
  entries.push(
    exactEntry(
      "ventricular-backup",
      "composedRhythm.ventricularBackupState.periodicLineageStructure",
      backupStructure(currentBackup.lastAcceptedVentricularActivation),
      backupStructure(referenceBackup.lastAcceptedVentricularActivation),
    ),
  );
}

function addIntervalEntries(
  entries: IntegratedEntry[],
  current: MainWireIntegratedModelPeriodicAcceptedStateV3,
  reference: MainWireIntegratedModelPeriodicAcceptedStateV3,
  scales: MainWireIntegratedModelPeriodicReferenceScalesV3,
): void {
  const currentInterval =
    current.composedRhythm.ventricularIntervalStrengthState;
  const referenceInterval =
    reference.composedRhythm.ventricularIntervalStrengthState;
  entries.push(
    numericEntry(
      "interval-strength",
      "composedRhythm.ventricularIntervalStrengthState.acceptedTimeSecRelativeToBoundary",
      "s",
      currentInterval.acceptedTimeSec - current.acceptedTimeSec,
      referenceInterval.acceptedTimeSec - reference.acceptedTimeSec,
      scales.generatedAvRelativeTimingSec,
    ),
  );
  entries.push(
    numericEntry(
      "interval-strength",
      "composedRhythm.ventricularIntervalStrengthState.normalizedSrLoadState",
      "dimensionless",
      currentInterval.normalizedSrLoadState,
      referenceInterval.normalizedSrLoadState,
      scales.generatedPendingActivationStrength01,
    ),
  );
  entries.push(
    numericEntry(
      "interval-strength",
      "composedRhythm.ventricularIntervalStrengthState.lastAcceptedVentricularActivation.activationTimeSecRelativeToBoundary",
      "s",
      currentInterval.lastAcceptedVentricularActivation.activationTimeSec -
        current.acceptedTimeSec,
      referenceInterval.lastAcceptedVentricularActivation.activationTimeSec -
        reference.acceptedTimeSec,
      scales.generatedAvRelativeTimingSec,
    ),
  );
  const fields = [
    "intervalSec",
    "recoveryFractionA",
    "normalizedSrLoadBefore",
    "releasedRelativeStrengthR",
    "returnedReleasedRelativeLoad",
    "intervalInfluxRelativeLoad",
    "normalizedSrLoadAfter",
    "futureExactCalciumDepositRelativeStrength",
  ] as const;
  for (const field of fields) {
    addNullableMetadataNumber(
      entries,
      "interval-strength",
      `composedRhythm.ventricularIntervalStrengthState.lastDepositMetadata.${field}`,
      currentInterval.lastDepositMetadata?.[field] ?? null,
      referenceInterval.lastDepositMetadata?.[field] ?? null,
      scales.generatedPendingActivationStrength01,
    );
  }
  addNullableRelativeTime(
    entries,
    "interval-strength",
    "composedRhythm.ventricularIntervalStrengthState.lastDepositMetadata.previousCapturedActivationTimeSec",
    currentInterval.lastDepositMetadata?.previousCapturedActivationTimeSec ??
      null,
    referenceInterval.lastDepositMetadata?.previousCapturedActivationTimeSec ??
      null,
    current.acceptedTimeSec,
    reference.acceptedTimeSec,
    scales.generatedAvRelativeTimingSec,
  );
  entries.push(
    exactEntry(
      "interval-strength",
      "composedRhythm.ventricularIntervalStrengthState.periodicLineageStructure",
      intervalStructure(currentInterval.lastDepositMetadata),
      intervalStructure(referenceInterval.lastDepositMetadata),
    ),
  );
}

function addPendingEntries(
  entries: IntegratedEntry[],
  current: MainWireIntegratedModelPeriodicAcceptedStateV3,
  reference: MainWireIntegratedModelPeriodicAcceptedStateV3,
  scales: MainWireIntegratedModelPeriodicReferenceScalesV3,
  periodLag: 1 | 2,
): void {
  const currentRhythm = current.composedRhythm;
  const referenceRhythm = reference.composedRhythm;
  pairLength(
    currentRhythm.pendingProximalAvOutputs,
    referenceRhythm.pendingProximalAvOutputs,
    "pending proximal AV outputs",
  );
  pairLength(
    currentRhythm.pendingDistalVentricularImpulses,
    referenceRhythm.pendingDistalVentricularImpulses,
    "pending distal impulses",
  );
  pairLength(
    currentRhythm.pendingCalciumDeposits,
    referenceRhythm.pendingCalciumDeposits,
    "pending calcium deposits",
  );
  currentRhythm.pendingProximalAvOutputs.forEach((item, index) => {
    const prior = referenceRhythm.pendingProximalAvOutputs[index]!;
    entries.push(
      numericEntry(
        "pending-events",
        `composedRhythm.pendingProximalAvOutputs[${index}].proximalArrivalTimeSecRelativeToBoundary`,
        "s",
        item.proximalArrivalTimeSec - current.acceptedTimeSec,
        prior.proximalArrivalTimeSec - reference.acceptedTimeSec,
        scales.generatedPendingRelativeTimingSec,
      ),
    );
  });
  currentRhythm.pendingDistalVentricularImpulses.forEach((item, index) => {
    const prior = referenceRhythm.pendingDistalVentricularImpulses[index]!;
    if (item.sourceSequence - prior.sourceSequence !== periodLag) {
      throw new Error(
        "pending distal source lineage does not advance by period lag",
      );
    }
    entries.push(
      numericEntry(
        "pending-events",
        `composedRhythm.pendingDistalVentricularImpulses[${index}].activationTimeSecRelativeToBoundary`,
        "s",
        item.activationTimeSec - current.acceptedTimeSec,
        prior.activationTimeSec - reference.acceptedTimeSec,
        scales.generatedPendingRelativeTimingSec,
      ),
    );
  });
  currentRhythm.pendingCalciumDeposits.forEach((item, index) => {
    const prior = referenceRhythm.pendingCalciumDeposits[index]!;
    entries.push(
      numericEntry(
        "pending-events",
        `composedRhythm.pendingCalciumDeposits[${index}].depositTimeSecRelativeToBoundary`,
        "s",
        item.depositTimeSec - current.acceptedTimeSec,
        prior.depositTimeSec - reference.acceptedTimeSec,
        scales.generatedPendingRelativeTimingSec,
      ),
    );
    for (const wallId of COMPOSED_RHYTHM_WALL_IDS_V2) {
      entries.push(
        numericEntry(
          "pending-events",
          `composedRhythm.pendingCalciumDeposits[${index}].strengthByWall.${wallId}`,
          "dimensionless",
          item.strengthByWall[wallId],
          prior.strengthByWall[wallId],
          scales.generatedPendingActivationStrength01,
        ),
      );
    }
  });
  entries.push(
    exactEntry(
      "pending-events",
      "composedRhythm.pendingQueues.periodicStructure",
      pendingStructure(currentRhythm),
      pendingStructure(referenceRhythm),
    ),
  );
}

function validateWithinStateLineage(
  state: MainWireIntegratedModelPeriodicAcceptedStateV3,
  label: string,
): void {
  const rhythm = state.composedRhythm;
  const backup =
    rhythm.ventricularBackupState.lastAcceptedVentricularActivation;
  const interval = rhythm.ventricularIntervalStrengthState;
  const atrialGate = rhythm.electricalCaptureState.atrialGate;
  const gate = rhythm.electricalCaptureState.ventricularGate;
  if (
    gate.lastCapturedActivationId !==
      interval.lastAcceptedVentricularActivation.capturedActivationId ||
    gate.lastCapturedActivationTimeSec !==
      interval.lastAcceptedVentricularActivation.activationTimeSec ||
    (backup !== null &&
      canonicalJsonStringify(backup) !==
        canonicalJsonStringify(interval.lastAcceptedVentricularActivation))
  ) {
    throw new Error(`${label} V3 ventricular lineage owners are split`);
  }
  const activation = interval.lastAcceptedVentricularActivation;
  if (
    rhythm.acceptedVentricularCaptureCount > 0 &&
    (backup === null ||
      activation.upstreamCapturedActivationId !==
        atrialGate.lastCapturedActivationId ||
      activation.captureOrdinal !== gate.capturedActivationCount ||
      activation.ownerRevision !== rhythm.electricalCaptureState.revision ||
      activation.sourceSequence !== rhythm.distalGateState.passedArrivalCount ||
      rhythm.proximalAvGateState.lastConductedAtrialActivationTimeSec !==
        atrialGate.lastCapturedActivationTimeSec ||
      rhythm.proximalAvGateState.lastProximalAvOutputTimeSec !==
        rhythm.distalGateState.lastPassedProximalArrivalTimeSec ||
      rhythm.distalGateState.lastVentricularImpulseTimeSec !==
        gate.lastCapturedActivationTimeSec)
  ) {
    throw new Error(`${label} V3 atrial-AV-distal capture lineage is split`);
  }
  const metadata = interval.lastDepositMetadata;
  if (
    metadata !== null &&
    (canonicalJsonStringify(metadata.capturedVentricularActivation) !==
      canonicalJsonStringify(interval.lastAcceptedVentricularActivation) ||
      metadata.ownerRevision !== interval.revision ||
      metadata.acceptedVentricularCaptureOrdinal !==
        interval.acceptedVentricularCaptureCount)
  ) {
    throw new Error(`${label} V3 interval-strength metadata lineage is split`);
  }
}

function initializationProjection(
  state: AcceptedComposedRhythmTransactionStateV2,
) {
  const regular = state.regularAtrialSourceState!;
  const ectopy = state.authoredEctopyState;
  const av = state.proximalAvGateState;
  const distal = state.distalGateState;
  const backup = state.ventricularBackupState;
  const interval = state.ventricularIntervalStrengthState;
  return Object.freeze({
    composedInitialAcceptedTimeSec: state.initialAcceptedTimeSec,
    regular: {
      initialAcceptedTimeSec: regular.initialAcceptedTimeSec,
      initialFirstFutureActivationTimeSec:
        regular.initialFirstFutureActivationTimeSec,
      initialFirstSourceSequence: regular.initialFirstSourceSequence,
    },
    ectopy: {
      initializedAcceptedTimeSec: ectopy.initializedAcceptedTimeSec,
      initializedHistoryEventCount: ectopy.initializedHistoryEventCount,
    },
    proximalAvInitialAcceptedAtrialActivationTimeSec:
      av.initialAcceptedAtrialActivationTimeSec,
    distalInitialAcceptedTimeSec: distal.initialAcceptedTimeSec,
    backupInitialAcceptedTimeSec: backup.initialAcceptedTimeSec,
    backupInitialCaptureSeed: backup.initialCaptureSeed,
    intervalInitialAcceptedTimeSec: interval.initialAcceptedTimeSec,
    intervalInitialNormalizedSrLoadState: interval.initialNormalizedSrLoadState,
    intervalInitialPriorAcceptedVentricularActivation:
      interval.initialPriorAcceptedVentricularActivation,
  });
}

function regularSourceStructure(
  state: AcceptedComposedRhythmTransactionStateV2,
) {
  const regular = state.regularAtrialSourceState!;
  return Object.freeze({
    stateSchemaId: regular.stateSchemaId,
    rhythmClass: regular.configuration.rhythmClass,
    capturedPacResetCount: regular.capturedPacResetCount,
    capturedPacPreserveCount: regular.capturedPacPreserveCount,
    ectopyCursor: state.authoredEctopyState.cursor,
    ectopyEmittedCount: state.authoredEctopyState.acceptedEmittedImpulseCount,
    pacingReplayStateAbsent:
      state.authoredVentricularPacingReplayState === null,
  });
}

function captureStructure(state: AcceptedComposedRhythmTransactionStateV2) {
  const capture = state.electricalCaptureState;
  return Object.freeze({
    atrial: {
      chamber: capture.atrialGate.chamber,
      gateInstanceId: capture.atrialGate.gateInstanceId,
      lastCapturePresent: capture.atrialGate.lastCapturedActivationId !== null,
    },
    ventricular: {
      chamber: capture.ventricularGate.chamber,
      gateInstanceId: capture.ventricularGate.gateInstanceId,
      lastCapturePresent:
        capture.ventricularGate.lastCapturedActivationId !== null,
    },
  });
}

function backupStructure(activation: CapturedElectricalActivationV2 | null) {
  return activation === null
    ? null
    : Object.freeze({
        chamber: activation.chamber,
        gateInstanceId: activation.gateInstanceId,
        sourceKind: activation.sourceKind,
        sourceId: activation.sourceId,
        capturePriority: activation.capturePriority,
      });
}

function intervalStructure(
  metadata: AcceptedComposedRhythmTransactionStateV2["ventricularIntervalStrengthState"]["lastDepositMetadata"],
) {
  return metadata === null
    ? null
    : Object.freeze({
        calciumStateMutation: metadata.calciumStateMutation,
        previousCaptureLineagePresent:
          metadata.previousCapturedActivationId.length > 0,
        activation: backupStructure(metadata.capturedVentricularActivation),
      });
}

function pendingStructure(state: AcceptedComposedRhythmTransactionStateV2) {
  return Object.freeze({
    proximal: state.pendingProximalAvOutputs.map(() => "proximal-av-output"),
    distal: state.pendingDistalVentricularImpulses.map((impulse) => ({
      chamber: impulse.chamber,
      sourceKind: impulse.sourceKind,
      sourceId: impulse.sourceId,
      capturePriority: impulse.capturePriority,
      parentLineagePresent: impulse.parentCapturedActivationId !== null,
    })),
    calcium: state.pendingCalciumDeposits.map((deposit) => ({
      depositClass: deposit.depositClass,
      parentLineagePresent: deposit.parentCapturedActivationId.length > 0,
    })),
  });
}

function addNullableRelativeTime(
  entries: IntegratedEntry[],
  group: Exclude<MainWireIntegratedModelPeriodicClosureGroupV3, "coronary-v3">,
  path: string,
  currentValue: number | null,
  referenceValue: number | null,
  currentBoundarySec: number,
  referenceBoundarySec: number,
  scale: number,
): void {
  entries.push(
    numericEntry(
      group,
      `${path}.present01`,
      "dimensionless",
      currentValue === null ? 0 : 1,
      referenceValue === null ? 0 : 1,
      1,
    ),
  );
  entries.push(
    numericEntry(
      group,
      `${path}.relativeToBoundaryOrZero`,
      "s",
      currentValue === null ? 0 : currentValue - currentBoundarySec,
      referenceValue === null ? 0 : referenceValue - referenceBoundarySec,
      scale,
    ),
  );
}

function addNullableMetadataNumber(
  entries: IntegratedEntry[],
  group: Exclude<MainWireIntegratedModelPeriodicClosureGroupV3, "coronary-v3">,
  path: string,
  currentValue: number | null,
  referenceValue: number | null,
  scale: number,
): void {
  entries.push(
    numericEntry(
      group,
      `${path}.present01`,
      "dimensionless",
      currentValue === null ? 0 : 1,
      referenceValue === null ? 0 : 1,
      1,
    ),
  );
  entries.push(
    numericEntry(
      group,
      `${path}.valueOrZero`,
      "dimensionless",
      currentValue ?? 0,
      referenceValue ?? 0,
      scale,
    ),
  );
}

function numericEntry(
  group: Exclude<MainWireIntegratedModelPeriodicClosureGroupV3, "coronary-v3">,
  path: string,
  unit: MainWireIntegratedModelPeriodicNumericDeltaEntryV3["unit"],
  currentValue: number,
  referenceValue: number,
  referenceScale: number,
): MainWireIntegratedModelPeriodicNumericDeltaEntryV3 {
  requireFinite(currentValue, `${path} current`);
  requireFinite(referenceValue, `${path} reference`);
  requirePositiveFinite(referenceScale, `${path} scale`);
  const absoluteDelta = Math.abs(currentValue - referenceValue);
  return Object.freeze({
    kind: "numeric" as const,
    group,
    path,
    unit,
    currentValue,
    referenceValue,
    absoluteDelta,
    referenceScale,
    normalizedDelta: absoluteDelta / referenceScale,
  });
}

function exactEntry(
  group: Exclude<MainWireIntegratedModelPeriodicClosureGroupV3, "coronary-v3">,
  path: string,
  currentValue: unknown,
  referenceValue: unknown,
): MainWireIntegratedModelPeriodicExactDeltaEntryV3 {
  const currentCanonicalJson = canonicalJsonStringify(currentValue);
  const referenceCanonicalJson = canonicalJsonStringify(referenceValue);
  const exact = currentCanonicalJson === referenceCanonicalJson;
  return Object.freeze({
    kind: "exact" as const,
    group,
    path,
    currentCanonicalJson,
    referenceCanonicalJson,
    exact,
    normalizedDelta: exact ? (0 as const) : (1 as const),
  });
}

function coronaryGroupReport(
  closure: MainWireFiveWallCoronaryPeriodicClosureReportV3,
): MainWireIntegratedModelPeriodicClosureGroupReportV3 {
  return Object.freeze({
    group: "coronary-v3" as const,
    numericEntryCount: closure.overall.numericEntryCount,
    exactEntryCount: 0,
    booleanEntryCount: closure.overall.booleanEntryCount,
    entryCount: closure.overall.entryCount,
    maximumNormalizedDelta: closure.overall.maximumNormalizedDelta,
    worstPath: closure.overall.worstPath,
    worstEntry: closure.overall.worstEntry,
  });
}

function integratedGroupReport(
  group: Exclude<MainWireIntegratedModelPeriodicClosureGroupV3, "coronary-v3">,
  entries: readonly IntegratedEntry[],
): MainWireIntegratedModelPeriodicClosureGroupReportV3 {
  const worst =
    entries.length === 0
      ? null
      : entries.reduce((candidate, entry) =>
          entry.normalizedDelta > candidate.normalizedDelta ? entry : candidate,
        );
  return Object.freeze({
    group,
    numericEntryCount: entries.filter((entry) => entry.kind === "numeric")
      .length,
    exactEntryCount: entries.filter((entry) => entry.kind === "exact").length,
    booleanEntryCount: 0,
    entryCount: entries.length,
    maximumNormalizedDelta: worst?.normalizedDelta ?? 0,
    worstPath: worst?.path ?? null,
    worstEntry: worst,
  });
}

function maximumGroup(
  groups: readonly MainWireIntegratedModelPeriodicClosureGroupReportV3[],
): MainWireIntegratedModelPeriodicClosureGroupReportV3 {
  const first = groups.find((group) => group.worstEntry !== null);
  if (first === undefined)
    throw new Error("V3 periodic closure groups are empty");
  return groups.reduce(
    (candidate, group) =>
      group.worstEntry !== null &&
      group.maximumNormalizedDelta > candidate.maximumNormalizedDelta
        ? group
        : candidate,
    first,
  );
}

function projectCoronaryScales(
  scales: MainWireIntegratedModelPeriodicReferenceScalesV3,
): MainWireFiveWallCoronaryPeriodicReferenceScalesV3 {
  return Object.freeze(
    Object.fromEntries(
      Object.keys(
        MAIN_WIRE_FIVE_WALL_CORONARY_PERIODIC_REFERENCE_SCALES_V3,
      ).map((key) => [
        key,
        scales[key as keyof MainWireFiveWallCoronaryPeriodicReferenceScalesV3],
      ]),
    ),
  ) as unknown as MainWireFiveWallCoronaryPeriodicReferenceScalesV3;
}

function validateScales(
  scales: MainWireIntegratedModelPeriodicReferenceScalesV3,
): void {
  if (
    canonicalJsonStringify(scales) !==
    canonicalJsonStringify(
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_REFERENCE_SCALES_V3,
    )
  ) {
    throw new Error("V3 periodic closure requires the predeclared V3 scales");
  }
}

function assertAllOffConfig(config: MechanicalSupportConfigV1): void {
  if (
    config.lvad.enabled ||
    config.impella.enabled ||
    config.vaEcmo.enabled ||
    config.vvEcmo.enabled ||
    config.iabp.enabled
  ) {
    throw new Error("V3 periodic comparator requires an all-off MCS config");
  }
}

function pairLength(
  current: readonly unknown[],
  reference: readonly unknown[],
  label: string,
): void {
  if (current.length !== reference.length) {
    throw new Error(`V3 periodic ${label} count differs`);
  }
}

function expectAdvance(
  current: number,
  reference: number,
  expected: number,
  label: string,
): void {
  if (
    !Number.isSafeInteger(current) ||
    !Number.isSafeInteger(reference) ||
    current - reference !== expected
  ) {
    throw new Error(`V3 periodic ${label} does not advance by ${expected}`);
  }
}

function nearlyEqual(left: number, right: number): boolean {
  return (
    Math.abs(left - right) <=
    64 * Number.EPSILON * Math.max(1, Math.abs(left), Math.abs(right))
  );
}

function acceptedClockAdvanceMatchesV3(
  currentAcceptedTimeSec: number,
  referenceAcceptedTimeSec: number,
  expectedAdvanceSec: number,
): boolean {
  return Math.abs(
    (currentAcceptedTimeSec - referenceAcceptedTimeSec) - expectedAdvanceSec,
  ) <= 64 * Number.EPSILON * Math.max(
    1,
    Math.abs(currentAcceptedTimeSec),
    Math.abs(referenceAcceptedTimeSec),
  );
}

function requireFinite(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${label} must be finite`);
  }
  return value;
}

function requirePositiveFinite(value: unknown, label: string): number {
  const number = requireFinite(value, label);
  if (!(number > 0)) throw new Error(`${label} must be positive`);
  return number;
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreeze(child);
    }
    Object.freeze(value);
  }
  return value;
}
