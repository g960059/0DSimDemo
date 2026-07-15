import { NORMATIVE_MANIFEST_HASH_ALGORITHM } from
  "@/engine/myocardium/fourChamberV1/ids";
import {
  FOUR_CHAMBER_CLOSED_LOOP_FLOW_IDS_V1,
} from "@/engine/myocardium/fourChamberV1/hemodynamics/conservativeIncidenceLedgerV1";
import {
  computeCanonicalSha256,
  type CanonicalSha256HexProvider,
} from "@/engine/myocardium/fourChamberV1/manifests/canonicalJson";
import {
  evaluatePhaseB1EventFreeEndpointV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/eventFreeMonolithicBackwardEulerV1";
import {
  assertBuilderIssuedPhaseB1NormalSinusBeCommittedCycleMechanicalEnergyAuditV1,
  type PhaseB1BackwardEulerCommittedCycleMechanicalEnergyAggregationDiagnosticV1,
  type PhaseB1NormalSinusBeCommittedCycleMechanicalEnergyAuditV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1NormalSinusBeCommittedCycleMechanicalEnergyAuditV1";
import {
  assertBuilderIssuedPhaseB1NormalSinusBePairedSourceParityAuditV1,
  assertBuilderIssuedPhaseB1NormalSinusBeTerminalCycleCapsuleV1,
  type PhaseB1NormalSinusBePairedSourceParityAuditV1,
  type PhaseB1NormalSinusBeTerminalCycleCapsuleV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1NormalSinusBeTerminalCycleCapsuleV1";
import {
  validatePhaseB1NormalSinusBeThreeGridTimestepComparisonManifestV1,
  type PhaseB1NormalSinusBeThreeGridTimestepComparisonManifestV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1NormalSinusBeThreeGridTimestepComparisonManifestV1";
import {
  BLOOD_COMPARTMENT_IDS,
  WALL_IDS,
  type BloodCompartmentId,
  type FourChamberFlowId,
  type FourChamberWallId,
} from "@/engine/myocardium/fourChamberV1/topology/contracts";
import {
  assertDensePlainArrayV1,
  assertExactPlainRecordV1,
} from "@/engine/myocardium/fourChamberV1/validation/strictClosedRecordV1";

export const PHASE_B1_NORMAL_SINUS_BE_TERMINAL_TIMESTEP_OBSERVATION_V1_ID =
  "phase-b1-normal-sinus-be-terminal-timestep-observation-v1" as const;

export const PHASE_B1_NORMAL_SINUS_BE_TERMINAL_TIMESTEP_SAMPLE_TRACE_V1_ID =
  "phase-b1-normal-sinus-be-terminal-timestep-sample-trace-v1" as const;

const VALVE_FLOW_IDS = Object.freeze([
  "Q_MV",
  "Q_AoV",
  "Q_TV",
  "Q_PuV",
] as const);

export type PhaseB1TerminalTimestepGridRoleV1 =
  | "coarse"
  | "medium"
  | "fine";

export type PhaseB1TerminalTimestepValveFlowIdV1 =
  (typeof VALVE_FLOW_IDS)[number];

export type PhaseB1TerminalTimestepExtremaV1 = Readonly<{
  minimum: number;
  maximum: number;
  minimumSampleIndex: number;
  maximumSampleIndex: number;
}>;

export type PhaseB1TerminalTimestepVentricularVolumeDerivedV1 = Readonly<{
  endDiastolicVolumeM3: number;
  endSystolicVolumeM3: number;
  strokeVolumeM3: number;
  ejectionFraction: number;
}>;

export type PhaseB1TerminalTimestepNominalCoverageAuditV1 = Readonly<{
  expectedMaximumNominalIndex: number;
  observedNominalIndices: readonly number[];
  missingNominalIndices: readonly number[];
  duplicateNominalIndices: readonly number[];
  unexpectedNominalIndices: readonly number[];
  everyExpectedNominalIndexPresentExactlyOnce: boolean;
}>;

export type PhaseB1TerminalTimestepHiddenSignTopologyAuditV1 = Readonly<{
  requestedEndpointTransitionCount: 0 | 1;
  expandedTransitionCount: number;
  hiddenAdditionalPositiveLobe: boolean;
  hiddenSignReversal: boolean;
  pass: boolean;
}>;

export type PhaseB1TerminalTimestepCircularSignedFlowSampleV1 = Readonly<{
  phaseSec: number;
  signedFlowM3PerSec: number;
  sourceRequestedSegmentIndex: number;
}>;

export type PhaseB1TerminalTimestepMainPositiveFlowLobeStatusV1 =
  | "resolved"
  | "insufficient-samples"
  | "duplicate-phase"
  | "no-positive-flow"
  | "unbracketed-all-positive"
  | "ambiguous-main-lobe";

export type PhaseB1TerminalTimestepMainPositiveFlowLobeV1 = Readonly<{
  status: PhaseB1TerminalTimestepMainPositiveFlowLobeStatusV1;
  resolved: boolean;
  positiveLobeCount: number;
  maximumPositiveFlowM3PerSec: number | null;
  peakPhaseSec: number | null;
  peakSourceRequestedSegmentIndex: number | null;
  openingPhaseSec: number | null;
  closingPhaseSec: number | null;
  openingBracketSourceRequestedSegmentIndices:
    readonly [left: number, right: number] | null;
  closingBracketSourceRequestedSegmentIndices:
    readonly [left: number, right: number] | null;
  crossingInterpolation: "linear-chord";
}>;

export type PhaseB1NormalSinusBeTerminalTimestepObservationSampleV1 =
  Readonly<{
    sampleIndex: number;
    sourceKind: "run-initial-endpoint" | "requested-segment-exit-endpoint";
    requestedSegmentIndex: number | null;
    absoluteTimeSec: number;
    phaseSec: number;
    nominalGridIndex: number | null;
    runnerNominalGridIndex: number | null;
    eventKeysAtEnd: readonly string[];
    endedAtNominalGridBoundary: boolean;
    endedAtRunBoundary: boolean;
    endedAtEventBoundary: boolean;
    eventOnlyExtraEndpoint: boolean;
    oneUlpNominalGridBoundaryCoalesced: boolean;
    oneUlpRunEndNominalGridBoundaryCoalesced: boolean;
    rightContinuousSameTimeLevelReevaluation: true;
    bloodVolumesM3: Readonly<Record<BloodCompartmentId, number>>;
    compartmentAbsolutePressurePa:
      Readonly<Record<BloodCompartmentId, number>>;
    allFlowsM3PerSec: Readonly<Record<FourChamberFlowId, number>>;
    wallFiberLogStrain: Readonly<Record<FourChamberWallId, number>>;
    wallActiveKirchhoffStressPa:
      Readonly<Record<FourChamberWallId, number>>;
    septalSignedMidwallCurvaturePerM: number;
    septalMidwallVolumeM3: number;
    junctionRadiusM: number;
    pericardialExcessPressurePa: number;
  }>;

export type PhaseB1NormalSinusBeTerminalTimestepSampleTracePayloadV1 =
  Readonly<{
    traceId:
      typeof PHASE_B1_NORMAL_SINUS_BE_TERMINAL_TIMESTEP_SAMPLE_TRACE_V1_ID;
    sourceTerminalCycleCapsuleContentSha256: string;
    slsMode: "off" | "on";
    gridRole: PhaseB1TerminalTimestepGridRoleV1;
    nominalDtSec: number;
    cycleStartTimeSec: number;
    cycleEndTimeSec: number;
    canonicalCycleLengthSec: number;
    samples:
      readonly PhaseB1NormalSinusBeTerminalTimestepObservationSampleV1[];
    acceptedRetryChildEndpointsExcludedFromTrace: true;
    everySelectedEndpointReevaluatedRightContinuously: true;
  }>;

export type PhaseB1NormalSinusBeTerminalTimestepSampleTraceV1 =
  PhaseB1NormalSinusBeTerminalTimestepSampleTracePayloadV1 & Readonly<{
    contentSha256: string;
  }>;

export type PhaseB1TerminalTimestepSampleSetAuditV1 = Readonly<{
  expectedNominalIntervalCount: number;
  expectedNominalSampleCountIncludingCycleStart: number;
  requestedSegmentExitCount: number;
  selectedExtremaSampleCount: number;
  acceptedTransactionCount: number;
  acceptedRetryChildEndpointCountExcluded: number;
  eventOnlyExtraEndpointCount: number;
  nonEventNonNominalExtraEndpointCount: number;
  nominalCoverage: PhaseB1TerminalTimestepNominalCoverageAuditV1;
  selectedSampleCountMatchesNominalPlusEventOnlyExtras: boolean;
  everyNonNominalExtraIsAnEventEndpoint: boolean;
  samplePhaseOrderStrictlyIncreasing: boolean;
  cycleStartAndEndSamplePresent: boolean;
  acceptedTransactionsUsedForExtremaOrPeakFlow: false;
  acceptedTransactionEndpointsUsedOnlyForHiddenValveSignAudit: true;
  sampleSetGatePass: boolean;
}>;

export type PhaseB1TerminalTimestepMajorScalarUnitV1 =
  | "m3"
  | "Pa"
  | "m3/s"
  | "m3/beat"
  | "1"
  | "1/m"
  | "m";

export type PhaseB1TerminalTimestepMajorScalarV1 = Readonly<{
  index: number;
  label: string;
  category: string;
  subjectId: string;
  component: string;
  value: number;
  unit: PhaseB1TerminalTimestepMajorScalarUnitV1;
  normalizationScale: number;
  normalizationScaleSource: string;
  valueSource:
    | "authenticated-extrema-sample-trace"
    | "authenticated-committed-interval-ledger";
}>;

export type PhaseB1TerminalTimestepValveTimingScalarV1 = Readonly<{
  index: number;
  label: string;
  valveFlowId: PhaseB1TerminalTimestepValveFlowIdV1;
  event:
    | "main-signed-forward-flow-lobe-opening"
    | "main-signed-forward-flow-lobe-closing";
  phaseSec: number | null;
  unit: "s";
  available: boolean;
  sourceStatus: PhaseB1TerminalTimestepMainPositiveFlowLobeStatusV1;
}>;

export type PhaseB1TerminalTimestepValveHiddenRetryAuditByValveV1 =
  Readonly<{
    valveFlowId: PhaseB1TerminalTimestepValveFlowIdV1;
    retryChildEndpointCountInspected: number;
    hiddenAdditionalPositiveLobeRequestedSegmentIndices: readonly number[];
    hiddenSignReversalRequestedSegmentIndices: readonly number[];
    pass: boolean;
  }>;

export type PhaseB1TerminalTimestepValveObservationAuditV1 = Readonly<{
  circularTraceSource:
    "requested-segment-exit-endpoints-with-final-exit-rephased-to-zero";
  circularTraceSampleCount: number;
  initialEndpointExcluded: true;
  retryChildEndpointsExcludedFromTimingAndInterpolation: true;
  mainPositiveFlowLobeByValve: Readonly<Record<
    PhaseB1TerminalTimestepValveFlowIdV1,
    PhaseB1TerminalTimestepMainPositiveFlowLobeV1
  >>;
  hiddenRetrySignTopologyByValve: Readonly<Record<
    PhaseB1TerminalTimestepValveFlowIdV1,
    PhaseB1TerminalTimestepValveHiddenRetryAuditByValveV1
  >>;
  everyMainPositiveFlowLobeResolved: boolean;
  noAmbiguousMainLobe: boolean;
  noHiddenRetryChildSignTopology: boolean;
  valveObservationGatePass: boolean;
}>;

const CLAIM_BOUNDARY = deepFreeze({
  canonicalComparisonManifestRequired: true as const,
  builderIssuedInitialSourceParityAuditRequired: true as const,
  builderIssuedConvergedTerminalCycleCapsuleRequired: true as const,
  matchingBuilderIssuedCommittedCycleEnergyAuditRequired: true as const,
  sameProcessObjectIdentityProvenanceRequired: true as const,
  authenticatedNegativeObservationMayBeIssued: true as const,
  callerSuppliedPassBooleanAccepted: false as const,
  terminalObservationImplemented: true as const,
  numericalThreeGridComparisonExecuted: false as const,
  timestepConvergenceEstablished: false as const,
  limitedProjectSyntheticThreeGridEnergyConvergenceEstablished: false as const,
  cycleEnergyAcceptanceEstablished: false as const,
  wholeHeartBackwardEulerEnergyAcceptanceEstablished: false as const,
  multiStartAcceptanceEstablished: false as const,
  perturbationAcceptanceEstablished: false as const,
  physiologicalValidationEstablished: false as const,
  phaseB1AcceptanceEstablished: false as const,
  modelCoreIntegrationEstablished: false as const,
  browserRuntimeAdoptionEstablished: false as const,
  releaseRuntimeReachable: false as const,
  serializationReauthenticationSupported: false as const,
  testOnly: true as const,
});

export type PhaseB1NormalSinusBeTerminalTimestepObservationPayloadV1 =
  Readonly<{
    observationId:
      typeof PHASE_B1_NORMAL_SINUS_BE_TERMINAL_TIMESTEP_OBSERVATION_V1_ID;
    sourceComparisonManifestContentSha256: string;
    sourceComparisonPolicyContentSha256: string;
    sourceInitialParityAuditContentSha256: string;
    sourceTerminalCycleCapsuleContentSha256: string;
    sourceCommittedCycleEnergyAuditContentSha256: string;
    sourceSampleTraceContentSha256: string;
    sourceParentManifestContentSha256: string;
    sourceParentNumericalEvidenceContentSha256: string;
    sourceScheduleContentSha256: string;
    sourceRunnerAttemptTraceContentSha256: string;
    sourceCommittedIntervalLedgerSummaryContentSha256: string;
    sourceNewtonScaleRegistryContentSha256: string;
    slsMode: "off" | "on";
    gridRole: PhaseB1TerminalTimestepGridRoleV1;
    nominalDtSec: number;
    canonicalCycleLengthSec: number;
    finalCycleIndex: number;
    sourceObjectsAuthenticatedInProcess: true;
    sourceParentScheduleAndModeSourceObjectIdentityRetained: true;
    sourceModelWallBindingAndRegistryObjectIdentityRetained: true;
    selectedEndpointsReevaluatedWithOneRetainedModelAndBinding: true;
    terminalLedgerCoversOneCanonicalCycle: true;
    flowIntegrationSource: "authenticated-committed-interval-ledger-only";
    cycleMeanSignedFlowDenominator:
      "comparison-policy-canonical-cycle-length-sec";
    sampleSetAudit: PhaseB1TerminalTimestepSampleSetAuditV1;
    majorScalarExpectedCount: 100;
    majorScalarCount: number;
    majorScalars: readonly PhaseB1TerminalTimestepMajorScalarV1[];
    majorScalarInventoryCompleteAndOrdered: boolean;
    valveTimingExpectedCount: 8;
    valveTimingCount: number;
    valveTimingScalars: readonly PhaseB1TerminalTimestepValveTimingScalarV1[];
    valveTimingInventoryCompleteAndOrdered: boolean;
    everyValveTimingScalarAvailable: boolean;
    valveObservationAudit: PhaseB1TerminalTimestepValveObservationAuditV1;
    energyDiagnosticsRetained: true;
    energyDiagnostics:
      PhaseB1BackwardEulerCommittedCycleMechanicalEnergyAggregationDiagnosticV1;
    terminalObservationGatePass: boolean;
    authenticatedNegativeObservationIssued: boolean;
    numericalThreeGridComparisonPass: false;
    timestepConvergenceAcceptancePass: false;
    projectSyntheticNormalSinusSingleStartBeThreeGridEnergyConvergencePass:
      false;
    cycleEnergyAcceptancePass: false;
    wholeHeartBackwardEulerEnergyAcceptancePass: false;
    physiologicalValidationPass: false;
    phaseB1AcceptancePass: false;
    modelCoreIntegration: false;
    browserRuntimeAdopted: false;
    releaseRuntimeReachable: false;
    hashAlgorithm: typeof NORMATIVE_MANIFEST_HASH_ALGORITHM;
    claimBoundary: typeof CLAIM_BOUNDARY;
  }>;

export type PhaseB1NormalSinusBeTerminalTimestepObservationV1 =
  PhaseB1NormalSinusBeTerminalTimestepObservationPayloadV1 & Readonly<{
    contentSha256: string;
    comparisonManifest:
      PhaseB1NormalSinusBeThreeGridTimestepComparisonManifestV1;
    initialSourceParityAudit:
      PhaseB1NormalSinusBePairedSourceParityAuditV1;
    terminalCycleCapsule: PhaseB1NormalSinusBeTerminalCycleCapsuleV1;
    committedCycleEnergyAudit:
      PhaseB1NormalSinusBeCommittedCycleMechanicalEnergyAuditV1;
    sampleTrace: PhaseB1NormalSinusBeTerminalTimestepSampleTraceV1;
  }>;

export type BuildPhaseB1NormalSinusBeTerminalTimestepObservationInputV1 =
  Readonly<{
    comparisonManifest:
      PhaseB1NormalSinusBeThreeGridTimestepComparisonManifestV1;
    initialSourceParityAudit:
      PhaseB1NormalSinusBePairedSourceParityAuditV1;
    terminalCycleCapsule: PhaseB1NormalSinusBeTerminalCycleCapsuleV1;
    committedCycleEnergyAudit:
      PhaseB1NormalSinusBeCommittedCycleMechanicalEnergyAuditV1;
    sha256Hex: CanonicalSha256HexProvider;
  }>;

type ObservationProvenanceV1 = Readonly<{
  comparisonManifest:
    PhaseB1NormalSinusBeThreeGridTimestepComparisonManifestV1;
  initialSourceParityAudit: PhaseB1NormalSinusBePairedSourceParityAuditV1;
  terminalCycleCapsule: PhaseB1NormalSinusBeTerminalCycleCapsuleV1;
  committedCycleEnergyAudit:
    PhaseB1NormalSinusBeCommittedCycleMechanicalEnergyAuditV1;
  model: PhaseB1NormalSinusBeTerminalCycleCapsuleV1["sourceCase"]["model"];
  wallMaterialBinding:
    PhaseB1NormalSinusBeTerminalCycleCapsuleV1["sourceCase"]["wallMaterialBinding"];
  registry:
    PhaseB1NormalSinusBeTerminalCycleCapsuleV1["sourceCase"]["destinationRegistry"];
}>;

const BUILDER_ISSUED_OBSERVATIONS = new WeakSet<object>();
const OBSERVATION_PROVENANCE = new WeakMap<object, ObservationProvenanceV1>();

export function evaluatePhaseB1TerminalTimestepExtremaV1(
  values: readonly number[],
): PhaseB1TerminalTimestepExtremaV1 {
  assertDensePlainArrayV1(values, undefined, "extrema values");
  if (values.length === 0) throw new Error("extrema values must not be empty");
  let minimumSampleIndex = 0;
  let maximumSampleIndex = 0;
  values.forEach((raw, index) => {
    const value = requireFinite(raw, `extrema values[${index}]`);
    if (value < values[minimumSampleIndex]) minimumSampleIndex = index;
    if (value > values[maximumSampleIndex]) maximumSampleIndex = index;
  });
  return Object.freeze({
    minimum: values[minimumSampleIndex],
    maximum: values[maximumSampleIndex],
    minimumSampleIndex,
    maximumSampleIndex,
  });
}

export function evaluatePhaseB1TerminalTimestepVentricularVolumeDerivedV1(
  valuesM3: readonly number[],
): PhaseB1TerminalTimestepVentricularVolumeDerivedV1 {
  const extrema = evaluatePhaseB1TerminalTimestepExtremaV1(valuesM3);
  const endDiastolicVolumeM3 = requirePositiveFinite(
    extrema.maximum,
    "endDiastolicVolumeM3",
  );
  const endSystolicVolumeM3 = requirePositiveFinite(
    extrema.minimum,
    "endSystolicVolumeM3",
  );
  const strokeVolumeM3 = requireNonNegativeFinite(
    endDiastolicVolumeM3 - endSystolicVolumeM3,
    "strokeVolumeM3",
  );
  return Object.freeze({
    endDiastolicVolumeM3,
    endSystolicVolumeM3,
    strokeVolumeM3,
    ejectionFraction: requireNonNegativeFinite(
      strokeVolumeM3 / endDiastolicVolumeM3,
      "ejectionFraction",
    ),
  });
}

export function evaluatePhaseB1TerminalTimestepNominalCoverageV1(
  input: Readonly<{
    expectedMaximumNominalIndex: number;
    observedNominalIndices: readonly number[];
  }>,
): PhaseB1TerminalTimestepNominalCoverageAuditV1 {
  assertExactPlainRecordV1(input, [
    "expectedMaximumNominalIndex",
    "observedNominalIndices",
  ], "nominal coverage input");
  const maximum = requireNonNegativeSafeInteger(
    input.expectedMaximumNominalIndex,
    "expectedMaximumNominalIndex",
  );
  assertDensePlainArrayV1(
    input.observedNominalIndices,
    undefined,
    "observedNominalIndices",
  );
  const observed = input.observedNominalIndices.map((value, index) =>
    requireNonNegativeSafeInteger(value, `observedNominalIndices[${index}]`));
  const counts = new Map<number, number>();
  observed.forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1));
  const missing = [] as number[];
  for (let index = 0; index <= maximum; index += 1) {
    if (!counts.has(index)) missing.push(index);
  }
  const duplicate = [...counts.entries()]
    .filter(([, count]) => count > 1)
    .map(([index]) => index)
    .sort((left, right) => left - right);
  const unexpected = [...counts.keys()]
    .filter((index) => index > maximum)
    .sort((left, right) => left - right);
  return deepFreeze({
    expectedMaximumNominalIndex: maximum,
    observedNominalIndices: observed,
    missingNominalIndices: missing,
    duplicateNominalIndices: duplicate,
    unexpectedNominalIndices: unexpected,
    everyExpectedNominalIndexPresentExactlyOnce:
      missing.length === 0 && duplicate.length === 0 && unexpected.length === 0,
  });
}

export function evaluatePhaseB1TerminalTimestepHiddenSignTopologyV1(
  input: Readonly<{
    requestedLeftFlowM3PerSec: number;
    acceptedRetryChildFlowsM3PerSec: readonly number[];
    requestedRightFlowM3PerSec: number;
  }>,
): PhaseB1TerminalTimestepHiddenSignTopologyAuditV1 {
  assertExactPlainRecordV1(input, [
    "requestedLeftFlowM3PerSec",
    "acceptedRetryChildFlowsM3PerSec",
    "requestedRightFlowM3PerSec",
  ], "hidden sign topology input");
  const left = requireFinite(
    input.requestedLeftFlowM3PerSec,
    "requestedLeftFlowM3PerSec",
  );
  const right = requireFinite(
    input.requestedRightFlowM3PerSec,
    "requestedRightFlowM3PerSec",
  );
  assertDensePlainArrayV1(
    input.acceptedRetryChildFlowsM3PerSec,
    undefined,
    "acceptedRetryChildFlowsM3PerSec",
  );
  const hidden = input.acceptedRetryChildFlowsM3PerSec.map((value, index) =>
    requireFinite(value, `acceptedRetryChildFlowsM3PerSec[${index}]`));
  const requestedEndpointTransitionCount = ((left > 0) !== (right > 0)
    ? 1
    : 0) as 0 | 1;
  const sequence = [left, ...hidden, right];
  let expandedTransitionCount = 0;
  for (let index = 1; index < sequence.length; index += 1) {
    if ((sequence[index - 1] > 0) !== (sequence[index] > 0)) {
      expandedTransitionCount += 1;
    }
  }
  const hiddenAdditionalPositiveLobe = left <= 0
    && right <= 0
    && hidden.some((value) => value > 0);
  const hiddenSignReversal = expandedTransitionCount
    > requestedEndpointTransitionCount;
  return Object.freeze({
    requestedEndpointTransitionCount,
    expandedTransitionCount,
    hiddenAdditionalPositiveLobe,
    hiddenSignReversal,
    pass: !hiddenAdditionalPositiveLobe && !hiddenSignReversal,
  });
}

export function evaluatePhaseB1TerminalTimestepMainPositiveFlowLobeV1(
  input: Readonly<{
    cycleLengthSec: number;
    samples: readonly PhaseB1TerminalTimestepCircularSignedFlowSampleV1[];
  }>,
): PhaseB1TerminalTimestepMainPositiveFlowLobeV1 {
  assertExactPlainRecordV1(input, [
    "cycleLengthSec",
    "samples",
  ], "main positive flow lobe input");
  const cycleLengthSec = requirePositiveFinite(
    input.cycleLengthSec,
    "cycleLengthSec",
  );
  assertDensePlainArrayV1(input.samples, undefined, "samples");
  const samples = input.samples.map((sample, index) => {
    assertExactPlainRecordV1(sample, [
      "phaseSec",
      "signedFlowM3PerSec",
      "sourceRequestedSegmentIndex",
    ], `samples[${index}]`);
    const rawPhaseSec = requireFinite(
      sample.phaseSec,
      `samples[${index}].phaseSec`,
    );
    if (rawPhaseSec < 0 || !(rawPhaseSec < cycleLengthSec)) {
      throw new Error(`samples[${index}].phaseSec must lie in [0,cycleLengthSec)`);
    }
    const phaseSec = Object.is(rawPhaseSec, -0) ? 0 : rawPhaseSec;
    return Object.freeze({
      phaseSec,
      signedFlowM3PerSec: requireFinite(
        sample.signedFlowM3PerSec,
        `samples[${index}].signedFlowM3PerSec`,
      ),
      sourceRequestedSegmentIndex: requireNonNegativeSafeInteger(
        sample.sourceRequestedSegmentIndex,
        `samples[${index}].sourceRequestedSegmentIndex`,
      ),
    });
  }).sort((left, right) => left.phaseSec - right.phaseSec);
  const negative = (
    status: Exclude<PhaseB1TerminalTimestepMainPositiveFlowLobeStatusV1, "resolved">,
    positiveLobeCount: number,
    maximumPositiveFlowM3PerSec: number | null,
  ): PhaseB1TerminalTimestepMainPositiveFlowLobeV1 => Object.freeze({
    status,
    resolved: false,
    positiveLobeCount,
    maximumPositiveFlowM3PerSec,
    peakPhaseSec: null,
    peakSourceRequestedSegmentIndex: null,
    openingPhaseSec: null,
    closingPhaseSec: null,
    openingBracketSourceRequestedSegmentIndices: null,
    closingBracketSourceRequestedSegmentIndices: null,
    crossingInterpolation: "linear-chord",
  });
  if (samples.length < 2) return negative("insufficient-samples", 0, null);
  if (samples.some((sample, index) =>
    index > 0 && sample.phaseSec === samples[index - 1].phaseSec)) {
    return negative("duplicate-phase", 0, null);
  }
  const positive = samples.map((sample) => sample.signedFlowM3PerSec > 0);
  if (!positive.some(Boolean)) return negative("no-positive-flow", 0, null);
  const maximumPositiveFlowM3PerSec = Math.max(
    ...samples.filter((_, index) => positive[index])
      .map((sample) => sample.signedFlowM3PerSec),
  );
  if (positive.every(Boolean)) {
    return negative(
      "unbracketed-all-positive",
      1,
      maximumPositiveFlowM3PerSec,
    );
  }

  type Lobe = Readonly<{
    openingLeftIndex: number;
    positiveIndices: readonly number[];
    closingRightIndex: number;
  }>;
  const lobes: Lobe[] = [];
  for (let leftIndex = 0; leftIndex < samples.length; leftIndex += 1) {
    const firstPositiveIndex = (leftIndex + 1) % samples.length;
    if (positive[leftIndex] || !positive[firstPositiveIndex]) continue;
    const positiveIndices = [] as number[];
    let cursor = firstPositiveIndex;
    while (positive[cursor]) {
      positiveIndices.push(cursor);
      cursor = (cursor + 1) % samples.length;
    }
    lobes.push(Object.freeze({
      openingLeftIndex: leftIndex,
      positiveIndices: Object.freeze(positiveIndices),
      closingRightIndex: cursor,
    }));
  }
  const maximizingLobeIndices = lobes.flatMap((lobe, lobeIndex) =>
    lobe.positiveIndices.some((sampleIndex) =>
      Object.is(
        samples[sampleIndex].signedFlowM3PerSec,
        maximumPositiveFlowM3PerSec,
      ))
      ? [lobeIndex]
      : []);
  if (maximizingLobeIndices.length !== 1) {
    return negative(
      "ambiguous-main-lobe",
      lobes.length,
      maximumPositiveFlowM3PerSec,
    );
  }
  const selected = lobes[maximizingLobeIndices[0]];
  const peakSampleIndex = selected.positiveIndices
    .filter((index) => Object.is(
      samples[index].signedFlowM3PerSec,
      maximumPositiveFlowM3PerSec,
    ))
    .reduce((earliest, index) =>
      samples[index].phaseSec < samples[earliest].phaseSec ? index : earliest);
  const openingRightIndex = selected.positiveIndices[0];
  const closingLeftIndex = selected.positiveIndices[
    selected.positiveIndices.length - 1
  ];
  const openingPhaseSec = interpolateCircularZeroCrossing(
    samples[selected.openingLeftIndex],
    samples[openingRightIndex],
    cycleLengthSec,
  );
  const closingPhaseSec = interpolateCircularZeroCrossing(
    samples[closingLeftIndex],
    samples[selected.closingRightIndex],
    cycleLengthSec,
  );
  return deepFreeze({
    status: "resolved",
    resolved: true,
    positiveLobeCount: lobes.length,
    maximumPositiveFlowM3PerSec,
    peakPhaseSec: samples[peakSampleIndex].phaseSec,
    peakSourceRequestedSegmentIndex:
      samples[peakSampleIndex].sourceRequestedSegmentIndex,
    openingPhaseSec,
    closingPhaseSec,
    openingBracketSourceRequestedSegmentIndices: [
      samples[selected.openingLeftIndex].sourceRequestedSegmentIndex,
      samples[openingRightIndex].sourceRequestedSegmentIndex,
    ],
    closingBracketSourceRequestedSegmentIndices: [
      samples[closingLeftIndex].sourceRequestedSegmentIndex,
      samples[selected.closingRightIndex].sourceRequestedSegmentIndex,
    ],
    crossingInterpolation: "linear-chord",
  });
}

export function buildPhaseB1NormalSinusBeTerminalTimestepObservationV1(
  input: BuildPhaseB1NormalSinusBeTerminalTimestepObservationInputV1,
): PhaseB1NormalSinusBeTerminalTimestepObservationV1 {
  assertExactPlainRecordV1(input, [
    "comparisonManifest",
    "initialSourceParityAudit",
    "terminalCycleCapsule",
    "committedCycleEnergyAudit",
    "sha256Hex",
  ], "Phase B1 terminal timestep observation input");
  requireSha256Provider(input.sha256Hex);
  const manifest =
    validatePhaseB1NormalSinusBeThreeGridTimestepComparisonManifestV1(
      input.comparisonManifest,
      input.sha256Hex,
    );
  const parity =
    assertBuilderIssuedPhaseB1NormalSinusBePairedSourceParityAuditV1(
      input.initialSourceParityAudit,
      input.sha256Hex,
    );
  const capsule =
    assertBuilderIssuedPhaseB1NormalSinusBeTerminalCycleCapsuleV1(
      input.terminalCycleCapsule,
      input.sha256Hex,
    );
  const energy =
    assertBuilderIssuedPhaseB1NormalSinusBeCommittedCycleMechanicalEnergyAuditV1(
      input.committedCycleEnergyAudit,
      input.sha256Hex,
    );
  assertObservationSourceBindings(manifest, parity, capsule, energy);

  const grid = manifest.comparisonPolicy.gridInventory.find((candidate) =>
    Object.is(candidate.nominalDtSec, capsule.nominalDtSec));
  if (grid === undefined) {
    throw new Error("terminal capsule timestep is absent from the comparison grid inventory");
  }
  const model = capsule.sourceCase.model;
  const binding = capsule.sourceCase.wallMaterialBinding;
  const registry = capsule.sourceCase.destinationRegistry;
  const trace = buildSampleTrace(
    capsule,
    grid.role,
    manifest.comparisonPolicy.cycleLengthSec,
    input.sha256Hex,
  );
  const sampleSetAudit = buildSampleSetAudit(
    capsule,
    trace,
    grid.nominalIntervalCountPerCycle,
    grid.nominalSampleCountIncludingCycleStart,
  );
  const majorScalars = buildMajorScalars(manifest, capsule, trace.samples);
  const expectedMajorScalarDescriptors = buildExpectedMajorScalarDescriptors(
    manifest,
    registry,
  );
  const majorScalarInventoryCompleteAndOrdered = majorScalars.length
      === manifest.comparisonPolicy.majorScalarComparison.inventory
        .expectedScalarCount
    && expectedMajorScalarDescriptors.length === majorScalars.length
    && majorScalars.every((scalar, index) => {
      const expected = expectedMajorScalarDescriptors[index];
      return scalar.index === index
        && scalar.label === expected.label
        && scalar.category === expected.category
        && scalar.subjectId === expected.subjectId
        && scalar.component === expected.component
        && scalar.unit === expected.unit
        && Object.is(
          scalar.normalizationScale,
          expected.normalizationScale,
        )
        && scalar.normalizationScaleSource
          === expected.normalizationScaleSource
        && scalar.valueSource === expected.valueSource;
    })
    && new Set(majorScalars.map((scalar) => scalar.label)).size
      === majorScalars.length;
  if (!majorScalarInventoryCompleteAndOrdered || majorScalars.length !== 100) {
    throw new Error("terminal observation major scalar inventory drifted from 100");
  }
  const valve = buildValveObservation(capsule, trace.samples);
  const expectedValveTiming = manifest.comparisonPolicy
    .emergentValveTimingComparison.valveFlowOrder.flatMap((valveFlowId) =>
      manifest.comparisonPolicy.emergentValveTimingComparison
        .eventOrderWithinValve.map((event) => ({
          label: `valve-timing.${valveFlowId}.${event}`,
          valveFlowId,
          event,
        })));
  const valveTimingInventoryCompleteAndOrdered = valve.timingScalars.length
      === manifest.comparisonPolicy.emergentValveTimingComparison
        .expectedTimingScalarCount
    && valve.timingScalars.length === expectedValveTiming.length
    && valve.timingScalars.every((scalar, index) =>
      scalar.index === index
      && scalar.label === expectedValveTiming[index].label
      && scalar.valveFlowId === expectedValveTiming[index].valveFlowId
      && scalar.event === expectedValveTiming[index].event
      && scalar.unit === "s"
      && scalar.available === (scalar.phaseSec !== null));
  if (!valveTimingInventoryCompleteAndOrdered
    || valve.timingScalars.length !== 8) {
    throw new Error("terminal observation valve timing inventory drifted from 8");
  }
  const everyValveTimingScalarAvailable = valve.timingScalars.every((scalar) =>
    scalar.available);
  const terminalObservationGatePass = sampleSetAudit.sampleSetGatePass
    && majorScalarInventoryCompleteAndOrdered
    && valveTimingInventoryCompleteAndOrdered
    && everyValveTimingScalarAvailable
    && valve.audit.valveObservationGatePass;
  const payload = deepFreeze<
    PhaseB1NormalSinusBeTerminalTimestepObservationPayloadV1
  >({
    observationId:
      PHASE_B1_NORMAL_SINUS_BE_TERMINAL_TIMESTEP_OBSERVATION_V1_ID,
    sourceComparisonManifestContentSha256: manifest.contentSha256,
    sourceComparisonPolicyContentSha256:
      manifest.bindings.comparisonPolicyContentSha256,
    sourceInitialParityAuditContentSha256: parity.contentSha256,
    sourceTerminalCycleCapsuleContentSha256: capsule.contentSha256,
    sourceCommittedCycleEnergyAuditContentSha256: energy.contentSha256,
    sourceSampleTraceContentSha256: trace.contentSha256,
    sourceParentManifestContentSha256: capsule.parentManifestContentSha256,
    sourceParentNumericalEvidenceContentSha256:
      capsule.parentNumericalEvidenceContentSha256,
    sourceScheduleContentSha256: capsule.scheduleContentSha256,
    sourceRunnerAttemptTraceContentSha256:
      capsule.sourceScheduleRunnerAttemptTraceContentSha256,
    sourceCommittedIntervalLedgerSummaryContentSha256:
      capsule.committedIntervalLedgerSummaryContentSha256,
    sourceNewtonScaleRegistryContentSha256: registry.registryContentSha256,
    slsMode: capsule.slsMode,
    gridRole: grid.role,
    nominalDtSec: capsule.nominalDtSec,
    canonicalCycleLengthSec: manifest.comparisonPolicy.cycleLengthSec,
    finalCycleIndex: capsule.finalCycleIndex,
    sourceObjectsAuthenticatedInProcess: true,
    sourceParentScheduleAndModeSourceObjectIdentityRetained: true,
    sourceModelWallBindingAndRegistryObjectIdentityRetained: true,
    selectedEndpointsReevaluatedWithOneRetainedModelAndBinding: true,
    terminalLedgerCoversOneCanonicalCycle: true,
    flowIntegrationSource: "authenticated-committed-interval-ledger-only",
    cycleMeanSignedFlowDenominator:
      "comparison-policy-canonical-cycle-length-sec",
    sampleSetAudit,
    majorScalarExpectedCount: 100,
    majorScalarCount: majorScalars.length,
    majorScalars,
    majorScalarInventoryCompleteAndOrdered,
    valveTimingExpectedCount: 8,
    valveTimingCount: valve.timingScalars.length,
    valveTimingScalars: valve.timingScalars,
    valveTimingInventoryCompleteAndOrdered,
    everyValveTimingScalarAvailable,
    valveObservationAudit: valve.audit,
    energyDiagnosticsRetained: true,
    energyDiagnostics: energy.aggregation,
    terminalObservationGatePass,
    authenticatedNegativeObservationIssued: !terminalObservationGatePass,
    numericalThreeGridComparisonPass: false,
    timestepConvergenceAcceptancePass: false,
    projectSyntheticNormalSinusSingleStartBeThreeGridEnergyConvergencePass:
      false,
    cycleEnergyAcceptancePass: false,
    wholeHeartBackwardEulerEnergyAcceptancePass: false,
    physiologicalValidationPass: false,
    phaseB1AcceptancePass: false,
    modelCoreIntegration: false,
    browserRuntimeAdopted: false,
    releaseRuntimeReachable: false,
    hashAlgorithm: NORMATIVE_MANIFEST_HASH_ALGORITHM,
    claimBoundary: CLAIM_BOUNDARY,
  });
  const observation = Object.freeze({
    ...payload,
    contentSha256: computeCanonicalSha256(payload, input.sha256Hex),
    comparisonManifest: manifest,
    initialSourceParityAudit: parity,
    terminalCycleCapsule: capsule,
    committedCycleEnergyAudit: energy,
    sampleTrace: trace,
  });
  const provenance = Object.freeze({
    comparisonManifest: manifest,
    initialSourceParityAudit: parity,
    terminalCycleCapsule: capsule,
    committedCycleEnergyAudit: energy,
    model,
    wallMaterialBinding: binding,
    registry,
  });
  OBSERVATION_PROVENANCE.set(observation, provenance);
  BUILDER_ISSUED_OBSERVATIONS.add(observation);
  return observation;
}

export function assertBuilderIssuedPhaseB1NormalSinusBeTerminalTimestepObservationV1(
  value: PhaseB1NormalSinusBeTerminalTimestepObservationV1,
  sha256Hex: CanonicalSha256HexProvider,
): PhaseB1NormalSinusBeTerminalTimestepObservationV1 {
  requireSha256Provider(sha256Hex);
  const provenance = value !== null && typeof value === "object"
    ? OBSERVATION_PROVENANCE.get(value)
    : undefined;
  if (
    value === null
    || typeof value !== "object"
    || !BUILDER_ISSUED_OBSERVATIONS.has(value)
    || provenance === undefined
    || value.observationId
      !== PHASE_B1_NORMAL_SINUS_BE_TERMINAL_TIMESTEP_OBSERVATION_V1_ID
  ) {
    throw new Error("terminal timestep observation is not builder-issued in this process");
  }
  const manifest =
    validatePhaseB1NormalSinusBeThreeGridTimestepComparisonManifestV1(
      value.comparisonManifest,
      sha256Hex,
    );
  const parity =
    assertBuilderIssuedPhaseB1NormalSinusBePairedSourceParityAuditV1(
      value.initialSourceParityAudit,
      sha256Hex,
    );
  const capsule =
    assertBuilderIssuedPhaseB1NormalSinusBeTerminalCycleCapsuleV1(
      value.terminalCycleCapsule,
      sha256Hex,
    );
  const energy =
    assertBuilderIssuedPhaseB1NormalSinusBeCommittedCycleMechanicalEnergyAuditV1(
      value.committedCycleEnergyAudit,
      sha256Hex,
    );
  if (
    !Object.is(provenance.comparisonManifest, manifest)
    || !Object.is(provenance.initialSourceParityAudit, parity)
    || !Object.is(provenance.terminalCycleCapsule, capsule)
    || !Object.is(provenance.committedCycleEnergyAudit, energy)
    || !Object.is(provenance.model, capsule.sourceCase.model)
    || !Object.is(
      provenance.wallMaterialBinding,
      capsule.sourceCase.wallMaterialBinding,
    )
    || !Object.is(provenance.registry, capsule.sourceCase.destinationRegistry)
  ) throw new Error("terminal timestep observation provenance object identity drifted");
  assertObservationSourceBindings(manifest, parity, capsule, energy);
  const { contentSha256: traceHash, ...tracePayload } = value.sampleTrace;
  if (
    computeCanonicalSha256(tracePayload, sha256Hex) !== traceHash
    || value.sourceSampleTraceContentSha256 !== traceHash
  ) throw new Error("terminal timestep observation sample trace hash drifted");
  const {
    contentSha256,
    comparisonManifest: _manifest,
    initialSourceParityAudit: _parity,
    terminalCycleCapsule: _capsule,
    committedCycleEnergyAudit: _energy,
    sampleTrace: _trace,
    ...payload
  } = value;
  if (computeCanonicalSha256(payload, sha256Hex) !== contentSha256) {
    throw new Error("terminal timestep observation content hash drifted");
  }
  return value;
}

function assertObservationSourceBindings(
  manifest: PhaseB1NormalSinusBeThreeGridTimestepComparisonManifestV1,
  parity: PhaseB1NormalSinusBePairedSourceParityAuditV1,
  capsule: PhaseB1NormalSinusBeTerminalCycleCapsuleV1,
  energy: PhaseB1NormalSinusBeCommittedCycleMechanicalEnergyAuditV1,
): void {
  const modeSource = capsule.slsMode === "off"
    ? parity.slsOffSourceCase
    : parity.slsOnSourceCase;
  const run = capsule.sourceScheduleRun;
  const ledger = capsule.committedIntervalLedger;
  if (
    capsule.terminalStatus !== "converged"
    || capsule.terminalCycleConvergencePass !== true
    || capsule.liveSingleStartPeriodOneCriterionPass !== true
    || parity.initialCommonCoordinateParityPass !== true
    || !Object.is(capsule.parentManifest, parity.parentManifest)
    || !Object.is(capsule.parentNumericalEvidence, parity.parentNumericalEvidence)
    || !Object.is(capsule.schedule, parity.schedule)
    // The live controller deliberately rebuilds the event-free source-case
    // wrapper from its authenticated inverse.  The wrapper identity therefore
    // differs from the parent parity wrapper on the canonical path, while the
    // authenticated inverse and retained reference endpoint identities remain
    // the lineage boundary shared by both wrappers.
    || !Object.is(capsule.sourceCase.inverse, modeSource.inverse)
    || !Object.is(
      capsule.sourceCase.referenceEndpoint,
      modeSource.referenceEndpoint,
    )
    || !Object.is(
      capsule.schedule.cycleLengthSec,
      manifest.comparisonPolicy.cycleLengthSec,
    )
    || !Object.is(energy.sourceTerminalCycleCapsule, capsule)
    || energy.sourceTerminalCycleCapsuleContentSha256 !== capsule.contentSha256
    || energy.slsMode !== capsule.slsMode
    || !Object.is(energy.nominalDtSec, capsule.nominalDtSec)
    || energy.finalCycleIndex !== capsule.finalCycleIndex
    || energy.policyId
      !== manifest.comparisonPolicy.energyResidualConvergenceComparison
        .sourceAuditPolicyId
    || !Object.is(run.modelObjectAtRunStart, capsule.sourceCase.model)
    || !Object.is(
      run.wallMaterialBindingObjectAtRunStart,
      capsule.sourceCase.wallMaterialBinding,
    )
    || !Object.is(
      run.newtonScaleRegistryObjectAtRunStart,
      capsule.sourceCase.destinationRegistry,
    )
    || !Object.is(ledger.initialEndpoint.timeSec, run.initialEndpoint.timeSec)
    || !Object.is(ledger.finalEndpoint.timeSec, run.finalEndpoint.timeSec)
    || ledger.committedTransactionCount !== run.acceptedTransactionCount
    || energy.aggregation.transactionCount !== run.acceptedTransactionCount
    || energy.stageTrace.stages.length !== run.acceptedTransactionCount
    || !capsule.finalCommittedSupercycleAudit.exactCycleTimesVerified
    || !capsule.finalCommittedSupercycleAudit.committedSupercycleAuditPass
  ) throw new Error("terminal timestep observation source provenance is malformed");
  if (
    manifest.comparisonPolicy.majorScalarComparison.inventory
      .expectedScalarCount !== 100
    || manifest.comparisonPolicy.emergentValveTimingComparison
      .expectedTimingScalarCount !== 8
  ) throw new Error("terminal timestep comparison policy inventory drifted");
}

function buildSampleTrace(
  capsule: PhaseB1NormalSinusBeTerminalCycleCapsuleV1,
  gridRole: PhaseB1TerminalTimestepGridRoleV1,
  canonicalCycleLengthSec: number,
  sha256Hex: CanonicalSha256HexProvider,
): PhaseB1NormalSinusBeTerminalTimestepSampleTraceV1 {
  const run = capsule.sourceScheduleRun;
  const model = run.modelObjectAtRunStart;
  const binding = run.wallMaterialBindingObjectAtRunStart;
  const startTimeSec = run.initialEndpoint.timeSec;
  const buildSample = (
    endpoint: typeof run.initialEndpoint,
    metadata: Omit<
      PhaseB1NormalSinusBeTerminalTimestepObservationSampleV1,
      | "bloodVolumesM3"
      | "compartmentAbsolutePressurePa"
      | "allFlowsM3PerSec"
      | "wallFiberLogStrain"
      | "wallActiveKirchhoffStressPa"
      | "septalSignedMidwallCurvaturePerM"
      | "septalMidwallVolumeM3"
      | "junctionRadiusM"
      | "pericardialExcessPressurePa"
      | "rightContinuousSameTimeLevelReevaluation"
    >,
  ): PhaseB1NormalSinusBeTerminalTimestepObservationSampleV1 => {
    const evaluation = evaluatePhaseB1EventFreeEndpointV1(
      model,
      binding,
      endpoint,
    );
    return deepFreeze({
      ...metadata,
      rightContinuousSameTimeLevelReevaluation: true as const,
      bloodVolumesM3: compartmentRecord((id) =>
        requirePositiveFinite(
          endpoint.differentialState.bloodVolumesM3[id],
          `${metadata.sampleIndex}.bloodVolumesM3.${id}`,
        )),
      compartmentAbsolutePressurePa: compartmentRecord((id) =>
        requireFinite(
          evaluation.closedLoop.compartmentAbsolutePressurePa[id],
          `${metadata.sampleIndex}.compartmentAbsolutePressurePa.${id}`,
        )),
      allFlowsM3PerSec: flowRecord((id) =>
        requireFinite(
          evaluation.closedLoop.allFlowsM3PerSec[id],
          `${metadata.sampleIndex}.allFlowsM3PerSec.${id}`,
        )),
      wallFiberLogStrain: wallRecord((id) =>
        requireFinite(
          evaluation.wallMaterialByWall[id].fiberLogStrain,
          `${metadata.sampleIndex}.wallFiberLogStrain.${id}`,
        )),
      wallActiveKirchhoffStressPa: wallRecord((id) =>
        requireFinite(
          evaluation.wallMaterialByWall[id].wallActiveKirchhoffStressPa,
          `${metadata.sampleIndex}.wallActiveKirchhoffStressPa.${id}`,
        )),
      septalSignedMidwallCurvaturePerM: requireFinite(
        evaluation.closedLoop.triSegGeometry.walls.SEP
          .signedMidwallCurvaturePerM,
        `${metadata.sampleIndex}.septalSignedMidwallCurvaturePerM`,
      ),
      septalMidwallVolumeM3: requireFinite(
        endpoint.triSegCoordinates.V_m_S,
        `${metadata.sampleIndex}.septalMidwallVolumeM3`,
      ),
      junctionRadiusM: requirePositiveFinite(
        endpoint.triSegCoordinates.y_m,
        `${metadata.sampleIndex}.junctionRadiusM`,
      ),
      pericardialExcessPressurePa: requireFinite(
        evaluation.closedLoop.pericardium.excessPressurePa,
        `${metadata.sampleIndex}.pericardialExcessPressurePa`,
      ),
    });
  };
  const samples: PhaseB1NormalSinusBeTerminalTimestepObservationSampleV1[] = [];
  samples.push(buildSample(run.initialEndpoint, {
    sampleIndex: 0,
    sourceKind: "run-initial-endpoint",
    requestedSegmentIndex: null,
    absoluteTimeSec: startTimeSec,
    phaseSec: 0,
    nominalGridIndex: 0,
    runnerNominalGridIndex: null,
    eventKeysAtEnd: Object.freeze([]),
    endedAtNominalGridBoundary: false,
    endedAtRunBoundary: false,
    endedAtEventBoundary: false,
    eventOnlyExtraEndpoint: false,
    oneUlpNominalGridBoundaryCoalesced: false,
    oneUlpRunEndNominalGridBoundaryCoalesced: false,
  }));
  let previousEndpoint = run.initialEndpoint;
  run.requestedSegments.forEach((segment, index) => {
    if (
      segment.requestedSegmentIndex !== index
      || !Object.is(segment.entryEndpoint, previousEndpoint)
      || !(segment.exitEndpoint.timeSec > previousEndpoint.timeSec)
      || !Object.is(segment.exitEndpoint.timeSec, segment.endTimeSec)
      || segment.acceptedTransactions.length === 0
      || !Object.is(
        segment.acceptedTransactions[segment.acceptedTransactions.length - 1]
          .nextEndpoint,
        segment.exitEndpoint,
      )
    ) throw new Error("requested-segment endpoint provenance chain drifted");
    const ownsNominalIndex = segment.endedAtNominalGridBoundary
      || segment.oneUlpNominalGridBoundaryCoalesced
      || segment.oneUlpRunEndNominalGridBoundaryCoalesced;
    const nominalGridIndex = ownsNominalIndex
      ? segment.nominalGridIndex + 1
      : null;
    const eventOnlyExtraEndpoint = segment.endedAtEventBoundary
      && nominalGridIndex === null;
    const phaseSec = nominalGridIndex !== null
      ? nominalGridIndex * run.nominalDtSec
      : eventOnlyExtraEndpoint
        ? canonicalEventPhase(capsule, segment.eventKeysAtEnd)
        : segment.exitEndpoint.timeSec - startTimeSec;
    samples.push(buildSample(segment.exitEndpoint, {
      sampleIndex: index + 1,
      sourceKind: "requested-segment-exit-endpoint",
      requestedSegmentIndex: index,
      absoluteTimeSec: segment.exitEndpoint.timeSec,
      phaseSec: requireFinite(phaseSec, `requestedSegments[${index}].phaseSec`),
      nominalGridIndex,
      runnerNominalGridIndex: segment.nominalGridIndex,
      eventKeysAtEnd: Object.freeze([...segment.eventKeysAtEnd]),
      endedAtNominalGridBoundary: segment.endedAtNominalGridBoundary,
      endedAtRunBoundary: segment.endedAtRunBoundary,
      endedAtEventBoundary: segment.endedAtEventBoundary,
      eventOnlyExtraEndpoint,
      oneUlpNominalGridBoundaryCoalesced:
        segment.oneUlpNominalGridBoundaryCoalesced,
      oneUlpRunEndNominalGridBoundaryCoalesced:
        segment.oneUlpRunEndNominalGridBoundaryCoalesced,
    }));
    previousEndpoint = segment.exitEndpoint;
  });
  if (!Object.is(previousEndpoint, run.finalEndpoint)) {
    throw new Error("requested-segment sample trace lost the runner final endpoint");
  }
  const tracePayload = deepFreeze<
    PhaseB1NormalSinusBeTerminalTimestepSampleTracePayloadV1
  >({
    traceId: PHASE_B1_NORMAL_SINUS_BE_TERMINAL_TIMESTEP_SAMPLE_TRACE_V1_ID,
    sourceTerminalCycleCapsuleContentSha256: capsule.contentSha256,
    slsMode: capsule.slsMode,
    gridRole,
    nominalDtSec: capsule.nominalDtSec,
    cycleStartTimeSec: startTimeSec,
    cycleEndTimeSec: run.finalEndpoint.timeSec,
    canonicalCycleLengthSec,
    samples,
    acceptedRetryChildEndpointsExcludedFromTrace: true,
    everySelectedEndpointReevaluatedRightContinuously: true,
  });
  return Object.freeze({
    ...tracePayload,
    contentSha256: computeCanonicalSha256(tracePayload, sha256Hex),
  });
}

function buildSampleSetAudit(
  capsule: PhaseB1NormalSinusBeTerminalCycleCapsuleV1,
  trace: PhaseB1NormalSinusBeTerminalTimestepSampleTraceV1,
  expectedNominalIntervalCount: number,
  expectedNominalSampleCountIncludingCycleStart: number,
): PhaseB1TerminalTimestepSampleSetAuditV1 {
  const run = capsule.sourceScheduleRun;
  const nominalCoverage = evaluatePhaseB1TerminalTimestepNominalCoverageV1({
    expectedMaximumNominalIndex: expectedNominalIntervalCount,
    observedNominalIndices: trace.samples.flatMap((sample) =>
      sample.nominalGridIndex === null
        ? []
        : [sample.nominalGridIndex]),
  });
  const eventOnlyExtraEndpointCount = trace.samples.filter((sample) =>
    sample.eventOnlyExtraEndpoint).length;
  const nonEventNonNominalExtraEndpointCount = trace.samples.filter((sample) =>
    sample.nominalGridIndex === null
    && sample.sourceKind === "requested-segment-exit-endpoint"
    && !sample.eventOnlyExtraEndpoint).length;
  const acceptedRetryChildEndpointCountExcluded = run.requestedSegments.reduce(
    (sum, segment) => sum + Math.max(0, segment.acceptedTransactions.length - 1),
    0,
  );
  const selectedSampleCountMatchesNominalPlusEventOnlyExtras =
    trace.samples.length
      === expectedNominalSampleCountIncludingCycleStart
        + eventOnlyExtraEndpointCount;
  const everyNonNominalExtraIsAnEventEndpoint =
    nonEventNonNominalExtraEndpointCount === 0;
  const samplePhaseOrderStrictlyIncreasing = trace.samples.every(
    (sample, index) => index === 0
      || sample.phaseSec > trace.samples[index - 1].phaseSec,
  );
  const cycleStartAndEndSamplePresent = trace.samples.length > 1
    && Object.is(trace.samples[0].absoluteTimeSec, run.initialEndpoint.timeSec)
    && Object.is(
      trace.samples[trace.samples.length - 1].absoluteTimeSec,
      run.finalEndpoint.timeSec,
    );
  const sampleSetGatePass =
    nominalCoverage.everyExpectedNominalIndexPresentExactlyOnce
    && selectedSampleCountMatchesNominalPlusEventOnlyExtras
    && everyNonNominalExtraIsAnEventEndpoint
    && samplePhaseOrderStrictlyIncreasing
    && cycleStartAndEndSamplePresent;
  return deepFreeze({
    expectedNominalIntervalCount,
    expectedNominalSampleCountIncludingCycleStart,
    requestedSegmentExitCount: run.requestedSegments.length,
    selectedExtremaSampleCount: trace.samples.length,
    acceptedTransactionCount: run.acceptedTransactionCount,
    acceptedRetryChildEndpointCountExcluded,
    eventOnlyExtraEndpointCount,
    nonEventNonNominalExtraEndpointCount,
    nominalCoverage,
    selectedSampleCountMatchesNominalPlusEventOnlyExtras,
    everyNonNominalExtraIsAnEventEndpoint,
    samplePhaseOrderStrictlyIncreasing,
    cycleStartAndEndSamplePresent,
    acceptedTransactionsUsedForExtremaOrPeakFlow: false,
    acceptedTransactionEndpointsUsedOnlyForHiddenValveSignAudit: true,
    sampleSetGatePass,
  });
}

function buildMajorScalars(
  manifest: PhaseB1NormalSinusBeThreeGridTimestepComparisonManifestV1,
  capsule: PhaseB1NormalSinusBeTerminalCycleCapsuleV1,
  samples: readonly PhaseB1NormalSinusBeTerminalTimestepObservationSampleV1[],
): readonly PhaseB1TerminalTimestepMajorScalarV1[] {
  const inventory = manifest.comparisonPolicy.majorScalarComparison.inventory;
  const registry = capsule.sourceCase.destinationRegistry;
  const cycleLengthSec = manifest.comparisonPolicy.cycleLengthSec;
  const scalars: PhaseB1TerminalTimestepMajorScalarV1[] = [];
  const push = (input: Omit<PhaseB1TerminalTimestepMajorScalarV1, "index">) => {
    scalars.push(Object.freeze({
      index: scalars.length,
      ...input,
      value: requireFinite(input.value, `${input.label}.value`),
      normalizationScale: requirePositiveFinite(
        input.normalizationScale,
        `${input.label}.normalizationScale`,
      ),
    }));
  };
  const pushExtrema = (
    category: string,
    subjectId: string,
    values: readonly number[],
    unit: PhaseB1TerminalTimestepMajorScalarUnitV1,
    scale: number,
    scaleSource: string,
  ) => {
    const extrema = evaluatePhaseB1TerminalTimestepExtremaV1(values);
    for (const component of ["minimum", "maximum"] as const) {
      push({
        label: `${category}.${subjectId}.${component}`,
        category,
        subjectId,
        component,
        value: extrema[component],
        unit,
        normalizationScale: scale,
        normalizationScaleSource: scaleSource,
        valueSource: "authenticated-extrema-sample-trace",
      });
    }
  };

  for (const compartmentId of inventory.compartmentVolumeExtrema.compartmentOrder) {
    pushExtrema(
      "compartment-volume",
      compartmentId,
      samples.map((sample) => sample.bloodVolumesM3[compartmentId]),
      "m3",
      registry.unknownScales.bloodVolumeM3[compartmentId],
      inventory.compartmentVolumeExtrema.normalizationScaleSource,
    );
  }
  for (const compartmentId of inventory.compartmentAbsolutePressureExtrema.compartmentOrder) {
    pushExtrema(
      "compartment-absolute-pressure",
      compartmentId,
      samples.map((sample) =>
        sample.compartmentAbsolutePressurePa[compartmentId]),
      "Pa",
      registry.residualScales.pressurePa,
      inventory.compartmentAbsolutePressureExtrema.normalizationScaleSource,
    );
  }
  for (const flowId of inventory.closedLoopEdgeIntegratedFlow.edgeOrder) {
    const integrated = capsule.committedIntervalLedger
      .integratedEdgeVolumeByFlow[flowId];
    for (const component of inventory.closedLoopEdgeIntegratedFlow.componentOrder) {
      const isMean = component === "cycle-mean-signed-flow";
      const value = isMean
        ? integrated.signedVolumeM3 / cycleLengthSec
        : component === "forward-volume"
          ? integrated.forwardVolumeM3
          : integrated.regurgitantVolumeM3;
      push({
        label: `closed-loop-edge.${flowId}.${component}`,
        category: "closed-loop-edge",
        subjectId: flowId,
        component,
        value,
        unit: isMean ? "m3/s" : "m3/beat",
        normalizationScale: registry.unknownScales.inertialFlowM3PerSec
          * (isMean ? 1 : cycleLengthSec),
        normalizationScaleSource: isMean
          ? inventory.closedLoopEdgeIntegratedFlow
            .meanSignedFlowNormalizationScaleSource
          : inventory.closedLoopEdgeIntegratedFlow
            .integratedVolumeNormalizationScaleSource,
        valueSource: "authenticated-committed-interval-ledger",
      });
    }
  }
  for (const flowId of inventory.valvePeakFlow.valveFlowOrder) {
    const flows = samples.map((sample) => sample.allFlowsM3PerSec[flowId]);
    const peakForward = Math.max(0, ...flows);
    const peakReverse = Math.max(0, ...flows.map((value) => -value));
    for (const component of inventory.valvePeakFlow.componentOrder) {
      push({
        label: `valve-flow.${flowId}.${component}`,
        category: "valve-flow",
        subjectId: flowId,
        component,
        value: component === "peak-forward-flow" ? peakForward : peakReverse,
        unit: "m3/s",
        normalizationScale: registry.unknownScales.inertialFlowM3PerSec,
        normalizationScaleSource:
          inventory.valvePeakFlow.normalizationScaleSource,
        valueSource: "authenticated-extrema-sample-trace",
      });
    }
  }
  for (const chamberId of inventory.ventricularVolumeDerived.chamberOrder) {
    const derived = evaluatePhaseB1TerminalTimestepVentricularVolumeDerivedV1(
      samples.map((sample) => sample.bloodVolumesM3[chamberId]),
    );
    const values = {
      "end-diastolic-volume": derived.endDiastolicVolumeM3,
      "end-systolic-volume": derived.endSystolicVolumeM3,
      "stroke-volume": derived.strokeVolumeM3,
      "ejection-fraction": derived.ejectionFraction,
    } as const;
    for (const component of inventory.ventricularVolumeDerived.scalarOrder) {
      const isEf = component === "ejection-fraction";
      push({
        label: `ventricular-volume.${chamberId}.${component}`,
        category: "ventricular-volume",
        subjectId: chamberId,
        component,
        value: values[component],
        unit: isEf ? "1" : "m3",
        normalizationScale: isEf
          ? inventory.ventricularVolumeDerived.ejectionFractionNormalizationScale
          : registry.unknownScales.bloodVolumeM3[chamberId],
        normalizationScaleSource: isEf
          ? "comparison-policy.ejectionFractionNormalizationScale"
          : inventory.ventricularVolumeDerived.volumeNormalizationScaleSource,
        valueSource: "authenticated-extrema-sample-trace",
      });
    }
  }
  for (const wallId of inventory.wallFiberLogStrainExtrema.wallOrder) {
    pushExtrema(
      "wall-fiber-log-strain",
      wallId,
      samples.map((sample) => sample.wallFiberLogStrain[wallId]),
      "1",
      registry.unknownScales.fiberLogStrain,
      inventory.wallFiberLogStrainExtrema.normalizationScaleSource,
    );
  }
  for (const wallId of inventory.wallActiveKirchhoffStressExtrema.wallOrder) {
    pushExtrema(
      "wall-active-kirchhoff-stress",
      wallId,
      samples.map((sample) => sample.wallActiveKirchhoffStressPa[wallId]),
      "Pa",
      registry.residualScales.tissueStressByWallPa[wallId],
      inventory.wallActiveKirchhoffStressExtrema.normalizationScaleSource,
    );
  }
  pushExtrema(
    "triseg-septal-signed-curvature",
    inventory.septalSignedCurvatureExtrema.wallId,
    samples.map((sample) => sample.septalSignedMidwallCurvaturePerM),
    "1/m",
    1 / registry.unknownScales.junctionRadiusM,
    inventory.septalSignedCurvatureExtrema.normalizationScaleSource,
  );
  pushExtrema(
    "triseg-septal-midwall-volume",
    inventory.septalMidwallVolumeExtrema.coordinateId,
    samples.map((sample) => sample.septalMidwallVolumeM3),
    "m3",
    registry.unknownScales.septalMidwallVolumeM3,
    inventory.septalMidwallVolumeExtrema.normalizationScaleSource,
  );
  pushExtrema(
    "triseg-junction-radius",
    inventory.junctionRadiusExtrema.coordinateId,
    samples.map((sample) => sample.junctionRadiusM),
    "m",
    registry.unknownScales.junctionRadiusM,
    inventory.junctionRadiusExtrema.normalizationScaleSource,
  );
  pushExtrema(
    "pericardial-excess-pressure",
    inventory.pericardialExcessPressureExtrema.scalarId,
    samples.map((sample) => sample.pericardialExcessPressurePa),
    "Pa",
    registry.residualScales.pressurePa,
    inventory.pericardialExcessPressureExtrema.normalizationScaleSource,
  );
  return Object.freeze(scalars);
}

type ExpectedMajorScalarDescriptorV1 = Readonly<Omit<
  PhaseB1TerminalTimestepMajorScalarV1,
  "index" | "value"
>>;
type PhaseB1TerminalTimestepDestinationRegistryV1 =
  PhaseB1NormalSinusBeTerminalCycleCapsuleV1["sourceCase"]["destinationRegistry"];

function buildExpectedMajorScalarDescriptors(
  manifest: PhaseB1NormalSinusBeThreeGridTimestepComparisonManifestV1,
  registry: PhaseB1TerminalTimestepDestinationRegistryV1,
): readonly ExpectedMajorScalarDescriptorV1[] {
  const inventory = manifest.comparisonPolicy.majorScalarComparison.inventory;
  const descriptors: ExpectedMajorScalarDescriptorV1[] = [];
  const appendExtrema = (
    category: string,
    subjects: readonly string[],
    extremaOrder: readonly ("minimum" | "maximum")[],
    unit: PhaseB1TerminalTimestepMajorScalarUnitV1,
    scaleFor: (subject: string) => number,
    normalizationScaleSource: string,
  ) => {
    for (const subject of subjects) {
      for (const extrema of extremaOrder) {
        descriptors.push(Object.freeze({
          label: `${category}.${subject}.${extrema}`,
          category,
          subjectId: subject,
          component: extrema,
          unit,
          normalizationScale: scaleFor(subject),
          normalizationScaleSource,
          valueSource: "authenticated-extrema-sample-trace",
        }));
      }
    }
  };
  appendExtrema(
    "compartment-volume",
    inventory.compartmentVolumeExtrema.compartmentOrder,
    inventory.compartmentVolumeExtrema.extremaOrder,
    "m3",
    (subject) => registry.unknownScales.bloodVolumeM3[
      subject as BloodCompartmentId
    ],
    inventory.compartmentVolumeExtrema.normalizationScaleSource,
  );
  appendExtrema(
    "compartment-absolute-pressure",
    inventory.compartmentAbsolutePressureExtrema.compartmentOrder,
    inventory.compartmentAbsolutePressureExtrema.extremaOrder,
    "Pa",
    () => registry.residualScales.pressurePa,
    inventory.compartmentAbsolutePressureExtrema.normalizationScaleSource,
  );
  for (const flowId of inventory.closedLoopEdgeIntegratedFlow.edgeOrder) {
    for (const component of inventory.closedLoopEdgeIntegratedFlow.componentOrder) {
      const mean = component === "cycle-mean-signed-flow";
      descriptors.push(Object.freeze({
        label: `closed-loop-edge.${flowId}.${component}`,
        category: "closed-loop-edge",
        subjectId: flowId,
        component,
        unit: mean ? "m3/s" : "m3/beat",
        normalizationScale: registry.unknownScales.inertialFlowM3PerSec
          * (mean ? 1 : manifest.comparisonPolicy.cycleLengthSec),
        normalizationScaleSource: mean
          ? inventory.closedLoopEdgeIntegratedFlow
            .meanSignedFlowNormalizationScaleSource
          : inventory.closedLoopEdgeIntegratedFlow
            .integratedVolumeNormalizationScaleSource,
        valueSource: "authenticated-committed-interval-ledger",
      }));
    }
  }
  for (const flowId of inventory.valvePeakFlow.valveFlowOrder) {
    for (const component of inventory.valvePeakFlow.componentOrder) {
      descriptors.push(Object.freeze({
        label: `valve-flow.${flowId}.${component}`,
        category: "valve-flow",
        subjectId: flowId,
        component,
        unit: "m3/s",
        normalizationScale: registry.unknownScales.inertialFlowM3PerSec,
        normalizationScaleSource:
          inventory.valvePeakFlow.normalizationScaleSource,
        valueSource: "authenticated-extrema-sample-trace",
      }));
    }
  }
  for (const chamberId of inventory.ventricularVolumeDerived.chamberOrder) {
    for (const component of inventory.ventricularVolumeDerived.scalarOrder) {
      const ef = component === "ejection-fraction";
      descriptors.push(Object.freeze({
        label: `ventricular-volume.${chamberId}.${component}`,
        category: "ventricular-volume",
        subjectId: chamberId,
        component,
        unit: ef ? "1" : "m3",
        normalizationScale: ef
          ? inventory.ventricularVolumeDerived
            .ejectionFractionNormalizationScale
          : registry.unknownScales.bloodVolumeM3[chamberId],
        normalizationScaleSource: ef
          ? "comparison-policy.ejectionFractionNormalizationScale"
          : inventory.ventricularVolumeDerived.volumeNormalizationScaleSource,
        valueSource: "authenticated-extrema-sample-trace",
      }));
    }
  }
  appendExtrema(
    "wall-fiber-log-strain",
    inventory.wallFiberLogStrainExtrema.wallOrder,
    inventory.wallFiberLogStrainExtrema.extremaOrder,
    "1",
    () => registry.unknownScales.fiberLogStrain,
    inventory.wallFiberLogStrainExtrema.normalizationScaleSource,
  );
  appendExtrema(
    "wall-active-kirchhoff-stress",
    inventory.wallActiveKirchhoffStressExtrema.wallOrder,
    inventory.wallActiveKirchhoffStressExtrema.extremaOrder,
    "Pa",
    (subject) => registry.residualScales.tissueStressByWallPa[
      subject as FourChamberWallId
    ],
    inventory.wallActiveKirchhoffStressExtrema.normalizationScaleSource,
  );
  appendExtrema(
    "triseg-septal-signed-curvature",
    [inventory.septalSignedCurvatureExtrema.wallId],
    inventory.septalSignedCurvatureExtrema.extremaOrder,
    "1/m",
    () => 1 / registry.unknownScales.junctionRadiusM,
    inventory.septalSignedCurvatureExtrema.normalizationScaleSource,
  );
  appendExtrema(
    "triseg-septal-midwall-volume",
    [inventory.septalMidwallVolumeExtrema.coordinateId],
    inventory.septalMidwallVolumeExtrema.extremaOrder,
    "m3",
    () => registry.unknownScales.septalMidwallVolumeM3,
    inventory.septalMidwallVolumeExtrema.normalizationScaleSource,
  );
  appendExtrema(
    "triseg-junction-radius",
    [inventory.junctionRadiusExtrema.coordinateId],
    inventory.junctionRadiusExtrema.extremaOrder,
    "m",
    () => registry.unknownScales.junctionRadiusM,
    inventory.junctionRadiusExtrema.normalizationScaleSource,
  );
  appendExtrema(
    "pericardial-excess-pressure",
    [inventory.pericardialExcessPressureExtrema.scalarId],
    inventory.pericardialExcessPressureExtrema.extremaOrder,
    "Pa",
    () => registry.residualScales.pressurePa,
    inventory.pericardialExcessPressureExtrema.normalizationScaleSource,
  );
  return Object.freeze(descriptors);
}

function buildValveObservation(
  capsule: PhaseB1NormalSinusBeTerminalCycleCapsuleV1,
  samples: readonly PhaseB1NormalSinusBeTerminalTimestepObservationSampleV1[],
): Readonly<{
  timingScalars: readonly PhaseB1TerminalTimestepValveTimingScalarV1[];
  audit: PhaseB1TerminalTimestepValveObservationAuditV1;
}> {
  const cycleLengthSec = capsule.schedule.cycleLengthSec;
  const requestedExitSamples = samples.filter((sample) =>
    sample.sourceKind === "requested-segment-exit-endpoint");
  const finalRequestedSegmentIndex = capsule.sourceScheduleRun
    .requestedSegments.length - 1;
  const circularByValve = valveRecord((valveFlowId) => {
    const circularSamples = requestedExitSamples.map((sample) => ({
      phaseSec: sample.requestedSegmentIndex === finalRequestedSegmentIndex
        ? 0
        : sample.phaseSec,
      signedFlowM3PerSec: sample.allFlowsM3PerSec[valveFlowId],
      sourceRequestedSegmentIndex: sample.requestedSegmentIndex!,
    }));
    return evaluatePhaseB1TerminalTimestepMainPositiveFlowLobeV1({
      cycleLengthSec,
      samples: circularSamples,
    });
  });
  const hiddenByValve = valveRecord((valveFlowId) => {
    const additionalLobes = [] as number[];
    const signReversals = [] as number[];
    let retryChildEndpointCountInspected = 0;
    capsule.sourceScheduleRun.requestedSegments.forEach((segment) => {
      const hiddenEndpoints = segment.acceptedTransactions.slice(0, -1)
        .map((transaction) => transaction.nextEndpoint);
      retryChildEndpointCountInspected += hiddenEndpoints.length;
      const result = evaluatePhaseB1TerminalTimestepHiddenSignTopologyV1({
        requestedLeftFlowM3PerSec:
          segment.entryEndpoint.differentialState.inertialFlowsM3PerSec[
            valveFlowId
          ],
        acceptedRetryChildFlowsM3PerSec: hiddenEndpoints.map((endpoint) =>
          endpoint.differentialState.inertialFlowsM3PerSec[valveFlowId]),
        requestedRightFlowM3PerSec:
          segment.exitEndpoint.differentialState.inertialFlowsM3PerSec[
            valveFlowId
          ],
      });
      if (result.hiddenAdditionalPositiveLobe) {
        additionalLobes.push(segment.requestedSegmentIndex);
      }
      if (result.hiddenSignReversal) {
        signReversals.push(segment.requestedSegmentIndex);
      }
    });
    return deepFreeze({
      valveFlowId,
      retryChildEndpointCountInspected,
      hiddenAdditionalPositiveLobeRequestedSegmentIndices: additionalLobes,
      hiddenSignReversalRequestedSegmentIndices: signReversals,
      pass: additionalLobes.length === 0 && signReversals.length === 0,
    });
  });
  const timingScalars: PhaseB1TerminalTimestepValveTimingScalarV1[] = [];
  for (const valveFlowId of VALVE_FLOW_IDS) {
    const lobe = circularByValve[valveFlowId];
    for (const event of [
      "main-signed-forward-flow-lobe-opening",
      "main-signed-forward-flow-lobe-closing",
    ] as const) {
      const phaseSec = event.endsWith("opening")
        ? lobe.openingPhaseSec
        : lobe.closingPhaseSec;
      timingScalars.push(Object.freeze({
        index: timingScalars.length,
        label: `valve-timing.${valveFlowId}.${event}`,
        valveFlowId,
        event,
        phaseSec,
        unit: "s",
        available: phaseSec !== null,
        sourceStatus: lobe.status,
      }));
    }
  }
  const everyMainPositiveFlowLobeResolved = VALVE_FLOW_IDS.every((id) =>
    circularByValve[id].resolved);
  const noAmbiguousMainLobe = VALVE_FLOW_IDS.every((id) =>
    circularByValve[id].status !== "ambiguous-main-lobe");
  const noHiddenRetryChildSignTopology = VALVE_FLOW_IDS.every((id) =>
    hiddenByValve[id].pass);
  const audit = deepFreeze<PhaseB1TerminalTimestepValveObservationAuditV1>({
    circularTraceSource:
      "requested-segment-exit-endpoints-with-final-exit-rephased-to-zero",
    circularTraceSampleCount: requestedExitSamples.length,
    initialEndpointExcluded: true,
    retryChildEndpointsExcludedFromTimingAndInterpolation: true,
    mainPositiveFlowLobeByValve: circularByValve,
    hiddenRetrySignTopologyByValve: hiddenByValve,
    everyMainPositiveFlowLobeResolved,
    noAmbiguousMainLobe,
    noHiddenRetryChildSignTopology,
    valveObservationGatePass: everyMainPositiveFlowLobeResolved
      && noAmbiguousMainLobe
      && noHiddenRetryChildSignTopology,
  });
  return Object.freeze({
    timingScalars: Object.freeze(timingScalars),
    audit,
  });
}

function canonicalEventPhase(
  capsule: PhaseB1NormalSinusBeTerminalCycleCapsuleV1,
  eventKeys: readonly string[],
): number {
  if (eventKeys.length === 0) {
    throw new Error("event-only endpoint has no event keys");
  }
  const runEvents = eventKeys.map((key) => {
    const event = capsule.sourceScheduleRun.orderedEvents.find((candidate) =>
      `${candidate.wallId}:${candidate.eventId}` === key);
    if (event === undefined) throw new Error(`event key ${key} is absent from runner`);
    return event;
  });
  const phases = runEvents.map((runEvent) => {
    const canonical = capsule.schedule.events.find((event) =>
      event.wallId === runEvent.wallId);
    if (canonical === undefined) {
      throw new Error(`canonical event phase absent for ${runEvent.wallId}`);
    }
    return canonical.calciumDriveOffsetWithinCycleSec;
  });
  if (!phases.every((phase) => Object.is(phase, phases[0]))) {
    throw new Error("coincident event batch has noncoincident canonical phases");
  }
  return requireFinite(phases[0], "canonical event phase");
}

function interpolateCircularZeroCrossing(
  left: PhaseB1TerminalTimestepCircularSignedFlowSampleV1,
  right: PhaseB1TerminalTimestepCircularSignedFlowSampleV1,
  cycleLengthSec: number,
): number {
  let rightPhase = right.phaseSec;
  if (!(rightPhase > left.phaseSec)) rightPhase += cycleLengthSec;
  const denominator = right.signedFlowM3PerSec - left.signedFlowM3PerSec;
  if (denominator === 0) {
    throw new Error("zero-crossing chord has equal endpoint flows");
  }
  const unwrapped = left.phaseSec
    - left.signedFlowM3PerSec * (rightPhase - left.phaseSec) / denominator;
  const wrapped = ((unwrapped % cycleLengthSec) + cycleLengthSec)
    % cycleLengthSec;
  return Object.is(wrapped, -0) ? 0 : requireFinite(wrapped, "zero crossing");
}

function compartmentRecord<Value>(
  build: (id: BloodCompartmentId) => Value,
): Readonly<Record<BloodCompartmentId, Value>> {
  return Object.freeze(Object.fromEntries(
    BLOOD_COMPARTMENT_IDS.map((id) => [id, build(id)]),
  )) as Readonly<Record<BloodCompartmentId, Value>>;
}

function flowRecord<Value>(
  build: (id: FourChamberFlowId) => Value,
): Readonly<Record<FourChamberFlowId, Value>> {
  return Object.freeze(Object.fromEntries(
    FOUR_CHAMBER_CLOSED_LOOP_FLOW_IDS_V1.map((id) => [id, build(id)]),
  )) as Readonly<Record<FourChamberFlowId, Value>>;
}

function wallRecord<Value>(
  build: (id: FourChamberWallId) => Value,
): Readonly<Record<FourChamberWallId, Value>> {
  return Object.freeze(Object.fromEntries(
    WALL_IDS.map((id) => [id, build(id)]),
  )) as Readonly<Record<FourChamberWallId, Value>>;
}

function valveRecord<Value>(
  build: (id: PhaseB1TerminalTimestepValveFlowIdV1) => Value,
): Readonly<Record<PhaseB1TerminalTimestepValveFlowIdV1, Value>> {
  return Object.freeze(Object.fromEntries(
    VALVE_FLOW_IDS.map((id) => [id, build(id)]),
  )) as Readonly<Record<PhaseB1TerminalTimestepValveFlowIdV1, Value>>;
}

function requireSha256Provider(
  value: CanonicalSha256HexProvider,
): asserts value is CanonicalSha256HexProvider {
  if (typeof value !== "function") throw new Error("sha256Hex must be a function");
}

function requireFinite(value: number, field: string): number {
  if (!Number.isFinite(value)) throw new Error(`${field} must be finite`);
  return value;
}

function requirePositiveFinite(value: number, field: string): number {
  requireFinite(value, field);
  if (!(value > 0)) throw new Error(`${field} must be positive`);
  return value;
}

function requireNonNegativeFinite(value: number, field: string): number {
  requireFinite(value, field);
  if (value < 0) throw new Error(`${field} must be nonnegative`);
  return value;
}

function requireNonNegativeSafeInteger(value: number, field: string): number {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(`${field} must be a nonnegative safe integer`);
  }
  return value;
}

function deepFreeze<Value>(value: Value, visited = new WeakSet<object>()): Value {
  if (value === null || typeof value !== "object") return value;
  const objectValue = value as object;
  if (visited.has(objectValue)) return value;
  visited.add(objectValue);
  for (const child of Object.values(objectValue)) deepFreeze(child, visited);
  return Object.freeze(value);
}
