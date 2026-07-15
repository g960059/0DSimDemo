import {
  FOUR_CHAMBER_CLOSED_LOOP_FLOW_IDS_V1,
} from "@/engine/myocardium/fourChamberV1/hemodynamics/conservativeIncidenceLedgerV1";
import {
  assertCanonicalSha256,
  computeCanonicalSha256,
  type CanonicalSha256HexProvider,
} from "@/engine/myocardium/fourChamberV1/manifests/canonicalJson";
import {
  assertBuilderIssuedPhaseB1NormalSinusBeTerminalTimestepObservationV1,
  type PhaseB1NormalSinusBeTerminalTimestepObservationSampleV1,
  type PhaseB1NormalSinusBeTerminalTimestepObservationV1,
  type PhaseB1TerminalTimestepValveFlowIdV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1NormalSinusBeTerminalTimestepObservationV1";
import {
  BLOOD_COMPARTMENT_IDS,
  type BloodCompartmentId,
  type FourChamberFlowId,
} from "@/engine/myocardium/fourChamberV1/topology/contracts";
import {
  assertExactPlainRecordV1,
} from "@/engine/myocardium/fourChamberV1/validation/strictClosedRecordV1";

export const PHASE_B1_TERMINAL_WAVEFORM_ARTIFACT_V1_ID =
  "phase-b1-normal-sinus-be-sls-on-terminal-waveform-artifact-v1" as const;

export const PHASE_B1_TERMINAL_WAVEFORM_CHAMBER_ORDER_V1 = Object.freeze([
  "LA",
  "LV",
  "RA",
  "RV",
] as const);

export const PHASE_B1_TERMINAL_WAVEFORM_VALVE_FLOW_ORDER_V1 = Object.freeze([
  "Q_MV",
  "Q_AoV",
  "Q_TV",
  "Q_PuV",
] as const);

export type PhaseB1TerminalWaveformChamberIdV1 =
  (typeof PHASE_B1_TERMINAL_WAVEFORM_CHAMBER_ORDER_V1)[number];

export type PhaseB1TerminalWaveformSeriesV1 = Readonly<{
  sampleIndex: readonly number[];
  phaseSec: readonly number[];
  nominalGridIndex: readonly (number | null)[];
  sourceKind: readonly (
    | "run-initial-endpoint"
    | "requested-segment-exit-endpoint"
  )[];
  eventKeysAtEnd: readonly (readonly string[])[];
  chamberBloodVolumeM3: Readonly<Record<
    PhaseB1TerminalWaveformChamberIdV1,
    readonly number[]
  >>;
  compartmentAbsolutePressurePa: Readonly<Record<
    BloodCompartmentId,
    readonly number[]
  >>;
  valveFlowM3PerSec: Readonly<Record<
    PhaseB1TerminalTimestepValveFlowIdV1,
    readonly number[]
  >>;
  allClosedLoopFlowM3PerSec: Readonly<Record<
    FourChamberFlowId,
    readonly number[]
  >>;
}>;

export type PhaseB1TerminalWaveformArtifactPayloadV1 = Readonly<{
  artifactId: typeof PHASE_B1_TERMINAL_WAVEFORM_ARTIFACT_V1_ID;
  status:
    "authenticated-in-process-terminal-observation-projection-for-visual-qa";
  sourceAuthentication: Readonly<{
    builderIssuedTerminalObservationAssertedInProcess: true;
    convergedTerminalCycleCapsuleAssertedInProcess: true;
    matchingCommittedCycleEnergyAuditAssertedInProcess: true;
    builderIssuedAuthenticationSurvivesSerialization: false;
  }>;
  units: Readonly<{
    phase: "s";
    volume: "m3";
    absolutePressure: "Pa";
    signedFlow: "m3/s";
    valuesConvertedForPresentation: false;
  }>;
  mode: Readonly<{
    slsMode: "on";
    physicalSlsEnabled: true;
    terminalStatus: "converged";
    liveSingleStartPeriodOneCriterionPass: true;
    terminalCycleConvergencePass: true;
    completedSupercycleCount: number;
    finalCycleIndex: number;
  }>;
  grid: Readonly<{
    role: "coarse";
    nominalDtSec: 0.001;
    canonicalCycleLengthSec: number;
    cycleStartTimeSec: number;
    cycleEndTimeSec: number;
    expectedNominalIntervalCount: number;
    expectedNominalSampleCountIncludingCycleStart: number;
    selectedSampleCount: number;
  }>;
  sourceHashes: Readonly<{
    comparisonManifestContentSha256: string;
    comparisonPolicyContentSha256: string;
    initialSourceParityAuditContentSha256: string;
    parentManifestContentSha256: string;
    parentNumericalEvidenceContentSha256: string;
    scheduleContentSha256: string;
    periodicDefinitionContentSha256: string;
    wallMaterialBindingContentSha256: string;
    newtonScaleRegistryContentSha256: string;
    terminalCycleCapsuleContentSha256: string;
    terminalResultContentSha256: string;
    finalCommittedSupercycleAuditContentSha256: string;
    finalPeriodicCheckpointContentSha256: string;
    finalCycleEvidenceContentSha256: string;
    runnerAttemptTraceContentSha256: string;
    committedIntervalLedgerSummaryContentSha256: string;
    committedCycleEnergyAuditContentSha256: string;
    terminalSampleTraceContentSha256: string;
    terminalTimestepObservationContentSha256: string;
  }>;
  sampleSetAudit:
    PhaseB1NormalSinusBeTerminalTimestepObservationV1["sampleSetAudit"];
  valveTimingScalars:
    PhaseB1NormalSinusBeTerminalTimestepObservationV1["valveTimingScalars"];
  valveObservationAudit:
    PhaseB1NormalSinusBeTerminalTimestepObservationV1["valveObservationAudit"];
  energyAuditSummary: Readonly<{
    scheme: "backward-Euler-endpoint-stage";
    transactionCount: number;
    cycleNormalizedResidual: number;
    cycleNormalizedResidualTolerance: 1e-3;
    cycleResidualWithinQuarterMillisecondTarget: boolean;
    maximumStageNormalizedResidual: number;
    stageNormalizedResidualTolerance: 1e-5;
    stageGatePass: boolean;
    quarterMillisecondSingleCycleEligibility: boolean;
    quarterMillisecondSingleCycleEnergyGatePass: boolean;
    oneOrHalfMillisecondOverallEnergyAcceptancePass: false;
    wholeHeartBackwardEulerEnergyAcceptancePass: false;
  }>;
  terminalObservationGatePass: boolean;
  authenticatedNegativeObservationIssued: boolean;
  waveform: PhaseB1TerminalWaveformSeriesV1;
  negativeClaims: Readonly<{
    numericalThreeGridComparisonPass: false;
    timestepConvergenceAcceptancePass: false;
    cycleEnergyAcceptancePass: false;
    wholeHeartBackwardEulerEnergyAcceptancePass: false;
    physiologicalValidationPass: false;
    phaseB1AcceptancePass: false;
    modelCoreIntegration: false;
    browserRuntimeAdopted: false;
    releaseRuntimeReachable: false;
  }>;
  claimBoundary:
    PhaseB1NormalSinusBeTerminalTimestepObservationV1["claimBoundary"];
  hashAlgorithm: "sha256-canonical-json-v1";
  testOnly: true;
}>;

export type PhaseB1TerminalWaveformArtifactV1 =
  PhaseB1TerminalWaveformArtifactPayloadV1 & Readonly<{
    contentSha256: string;
  }>;

/**
 * Creates a compact columnar projection. The input samples are already the
 * authenticated terminal-observation sample set; this function deliberately
 * performs no interpolation and no display-unit conversion.
 */
export function buildPhaseB1TerminalWaveformSeriesV1(
  samples: readonly PhaseB1NormalSinusBeTerminalTimestepObservationSampleV1[],
): PhaseB1TerminalWaveformSeriesV1 {
  if (!Array.isArray(samples) || samples.length === 0) {
    throw new Error("terminal waveform samples must be a non-empty plain array");
  }
  samples.forEach((sample, index) => {
    if (sample.sampleIndex !== index) {
      throw new Error("terminal waveform sample indices must be contiguous");
    }
    requireFinite(sample.phaseSec, `samples[${index}].phaseSec`);
    if (
      index > 0
      && !(sample.phaseSec > samples[index - 1].phaseSec)
    ) {
      throw new Error("terminal waveform sample phases must strictly increase");
    }
  });

  return Object.freeze({
    sampleIndex: freezeMap(samples, (sample) => sample.sampleIndex),
    phaseSec: freezeMap(samples, (sample) => sample.phaseSec),
    nominalGridIndex: freezeMap(samples, (sample) => sample.nominalGridIndex),
    sourceKind: freezeMap(samples, (sample) => sample.sourceKind),
    eventKeysAtEnd: Object.freeze(samples.map((sample) =>
      Object.freeze([...sample.eventKeysAtEnd]))),
    chamberBloodVolumeM3: buildSeriesRecord(
      PHASE_B1_TERMINAL_WAVEFORM_CHAMBER_ORDER_V1,
      (chamberId) => samples.map((sample) =>
        requireFinite(
          sample.bloodVolumesM3[chamberId],
          `bloodVolumesM3.${chamberId}`,
        )),
    ),
    compartmentAbsolutePressurePa: buildSeriesRecord(
      BLOOD_COMPARTMENT_IDS,
      (compartmentId) => samples.map((sample) =>
        requireFinite(
          sample.compartmentAbsolutePressurePa[compartmentId],
          `compartmentAbsolutePressurePa.${compartmentId}`,
        )),
    ),
    valveFlowM3PerSec: buildSeriesRecord(
      PHASE_B1_TERMINAL_WAVEFORM_VALVE_FLOW_ORDER_V1,
      (flowId) => samples.map((sample) =>
        requireFinite(
          sample.allFlowsM3PerSec[flowId],
          `allFlowsM3PerSec.${flowId}`,
        )),
    ),
    allClosedLoopFlowM3PerSec: buildSeriesRecord(
      FOUR_CHAMBER_CLOSED_LOOP_FLOW_IDS_V1,
      (flowId) => samples.map((sample) =>
        requireFinite(
          sample.allFlowsM3PerSec[flowId],
          `allFlowsM3PerSec.${flowId}`,
        )),
    ),
  });
}

export function buildPhaseB1TerminalWaveformArtifactV1(
  input: Readonly<{
    terminalObservation: PhaseB1NormalSinusBeTerminalTimestepObservationV1;
    sha256Hex: CanonicalSha256HexProvider;
  }>,
): PhaseB1TerminalWaveformArtifactV1 {
  assertExactPlainRecordV1(input, [
    "terminalObservation",
    "sha256Hex",
  ], "Phase B1 terminal waveform artifact input");
  if (typeof input.sha256Hex !== "function") {
    throw new Error("terminal waveform artifact requires a SHA-256 provider");
  }
  const observation =
    assertBuilderIssuedPhaseB1NormalSinusBeTerminalTimestepObservationV1(
      input.terminalObservation,
      input.sha256Hex,
    );
  const capsule = observation.terminalCycleCapsule;
  const energy = observation.committedCycleEnergyAudit;
  const trace = observation.sampleTrace;
  if (
    observation.slsMode !== "on"
    || capsule.slsMode !== "on"
    || observation.gridRole !== "coarse"
    || observation.nominalDtSec !== 0.001
    || capsule.nominalDtSec !== 0.001
    || capsule.terminalStatus !== "converged"
    || capsule.liveSingleStartPeriodOneCriterionPass !== true
    || capsule.terminalCycleConvergencePass !== true
    || !Object.is(energy.sourceTerminalCycleCapsule, capsule)
  ) {
    throw new Error(
      "terminal waveform artifact requires the converged SLS-on 1 ms capsule and matching energy audit",
    );
  }
  const waveform = buildPhaseB1TerminalWaveformSeriesV1(trace.samples);
  if (
    waveform.phaseSec.length !== observation.sampleSetAudit.selectedExtremaSampleCount
    || waveform.phaseSec.length !== trace.samples.length
  ) {
    throw new Error("terminal waveform sample count differs from its sample-set audit");
  }
  const aggregation = energy.aggregation;
  const payload = deepFreeze<PhaseB1TerminalWaveformArtifactPayloadV1>({
    artifactId: PHASE_B1_TERMINAL_WAVEFORM_ARTIFACT_V1_ID,
    status:
      "authenticated-in-process-terminal-observation-projection-for-visual-qa",
    sourceAuthentication: {
      builderIssuedTerminalObservationAssertedInProcess: true,
      convergedTerminalCycleCapsuleAssertedInProcess: true,
      matchingCommittedCycleEnergyAuditAssertedInProcess: true,
      builderIssuedAuthenticationSurvivesSerialization: false,
    },
    units: {
      phase: "s",
      volume: "m3",
      absolutePressure: "Pa",
      signedFlow: "m3/s",
      valuesConvertedForPresentation: false,
    },
    mode: {
      slsMode: "on",
      physicalSlsEnabled: true,
      terminalStatus: "converged",
      liveSingleStartPeriodOneCriterionPass: true,
      terminalCycleConvergencePass: true,
      completedSupercycleCount: capsule.completedSupercycleCount,
      finalCycleIndex: capsule.finalCycleIndex,
    },
    grid: {
      role: "coarse",
      nominalDtSec: 0.001,
      canonicalCycleLengthSec: observation.canonicalCycleLengthSec,
      cycleStartTimeSec: trace.cycleStartTimeSec,
      cycleEndTimeSec: trace.cycleEndTimeSec,
      expectedNominalIntervalCount:
        observation.sampleSetAudit.expectedNominalIntervalCount,
      expectedNominalSampleCountIncludingCycleStart:
        observation.sampleSetAudit.expectedNominalSampleCountIncludingCycleStart,
      selectedSampleCount: waveform.phaseSec.length,
    },
    sourceHashes: {
      comparisonManifestContentSha256:
        observation.sourceComparisonManifestContentSha256,
      comparisonPolicyContentSha256:
        observation.sourceComparisonPolicyContentSha256,
      initialSourceParityAuditContentSha256:
        observation.sourceInitialParityAuditContentSha256,
      parentManifestContentSha256:
        observation.sourceParentManifestContentSha256,
      parentNumericalEvidenceContentSha256:
        observation.sourceParentNumericalEvidenceContentSha256,
      scheduleContentSha256: observation.sourceScheduleContentSha256,
      periodicDefinitionContentSha256: capsule.definitionContentSha256,
      wallMaterialBindingContentSha256:
        capsule.sourceWallMaterialBindingContentSha256,
      newtonScaleRegistryContentSha256:
        observation.sourceNewtonScaleRegistryContentSha256,
      terminalCycleCapsuleContentSha256:
        observation.sourceTerminalCycleCapsuleContentSha256,
      terminalResultContentSha256: capsule.terminalResultContentSha256,
      finalCommittedSupercycleAuditContentSha256:
        capsule.finalCommittedSupercycleAuditContentSha256,
      finalPeriodicCheckpointContentSha256:
        capsule.finalPeriodicCheckpointContentSha256,
      finalCycleEvidenceContentSha256:
        capsule.finalCycleEvidenceContentSha256,
      runnerAttemptTraceContentSha256:
        observation.sourceRunnerAttemptTraceContentSha256,
      committedIntervalLedgerSummaryContentSha256:
        observation.sourceCommittedIntervalLedgerSummaryContentSha256,
      committedCycleEnergyAuditContentSha256:
        observation.sourceCommittedCycleEnergyAuditContentSha256,
      terminalSampleTraceContentSha256:
        observation.sourceSampleTraceContentSha256,
      terminalTimestepObservationContentSha256: observation.contentSha256,
    },
    sampleSetAudit: observation.sampleSetAudit,
    valveTimingScalars: observation.valveTimingScalars,
    valveObservationAudit: observation.valveObservationAudit,
    energyAuditSummary: {
      scheme: aggregation.scheme,
      transactionCount: aggregation.transactionCount,
      cycleNormalizedResidual:
        aggregation.officialCycleBalance.normalizedResidual,
      cycleNormalizedResidualTolerance:
        aggregation.officialCycleBalance.normalizedResidualTolerance,
      cycleResidualWithinQuarterMillisecondTarget:
        aggregation.officialCycleBalance
          .cycleResidualWithinQuarterMillisecondTarget,
      maximumStageNormalizedResidual:
        aggregation.stageAudit.maximumNormalizedResidual,
      stageNormalizedResidualTolerance:
        aggregation.stageAudit.normalizedResidualTolerance,
      stageGatePass: aggregation.stageAudit.stageGatePass,
      quarterMillisecondSingleCycleEligibility:
        aggregation.quarterMillisecondSingleCycleEligibility,
      quarterMillisecondSingleCycleEnergyGatePass:
        aggregation.quarterMillisecondSingleCycleEnergyGatePass,
      oneOrHalfMillisecondOverallEnergyAcceptancePass:
        aggregation.oneOrHalfMillisecondOverallEnergyAcceptancePass,
      wholeHeartBackwardEulerEnergyAcceptancePass:
        aggregation.wholeHeartBackwardEulerEnergyAcceptancePass,
    },
    terminalObservationGatePass: observation.terminalObservationGatePass,
    authenticatedNegativeObservationIssued:
      observation.authenticatedNegativeObservationIssued,
    waveform,
    negativeClaims: {
      numericalThreeGridComparisonPass:
        observation.numericalThreeGridComparisonPass,
      timestepConvergenceAcceptancePass:
        observation.timestepConvergenceAcceptancePass,
      cycleEnergyAcceptancePass: observation.cycleEnergyAcceptancePass,
      wholeHeartBackwardEulerEnergyAcceptancePass:
        observation.wholeHeartBackwardEulerEnergyAcceptancePass,
      physiologicalValidationPass: observation.physiologicalValidationPass,
      phaseB1AcceptancePass: observation.phaseB1AcceptancePass,
      modelCoreIntegration: observation.modelCoreIntegration,
      browserRuntimeAdopted: observation.browserRuntimeAdopted,
      releaseRuntimeReachable: observation.releaseRuntimeReachable,
    },
    claimBoundary: observation.claimBoundary,
    hashAlgorithm: "sha256-canonical-json-v1",
    testOnly: true,
  });
  return Object.freeze({
    ...payload,
    contentSha256: computeCanonicalSha256(payload, input.sha256Hex),
  });
}

export function phaseB1TerminalWaveformArtifactHashPayloadV1(
  artifact: PhaseB1TerminalWaveformArtifactV1,
): PhaseB1TerminalWaveformArtifactPayloadV1 {
  const { contentSha256: _contentSha256, ...payload } = artifact;
  return payload;
}

export function serializePhaseB1TerminalWaveformArtifactV1(
  artifact: PhaseB1TerminalWaveformArtifactV1,
  sha256Hex: CanonicalSha256HexProvider,
): string {
  if (artifact.artifactId !== PHASE_B1_TERMINAL_WAVEFORM_ARTIFACT_V1_ID) {
    throw new Error("terminal waveform artifact identity drifted");
  }
  assertCanonicalSha256(
    phaseB1TerminalWaveformArtifactHashPayloadV1(artifact),
    artifact.contentSha256,
    sha256Hex,
  );
  return `${JSON.stringify(artifact, null, 2)}\n`;
}

function buildSeriesRecord<Key extends string>(
  keys: readonly Key[],
  values: (key: Key) => readonly number[],
): Readonly<Record<Key, readonly number[]>> {
  return Object.freeze(Object.fromEntries(keys.map((key) => [
    key,
    Object.freeze(values(key).map((value, index) =>
      requireFinite(value, `${key}[${index}]`))),
  ])) as Record<Key, readonly number[]>);
}

function freezeMap<Input, Output>(
  values: readonly Input[],
  map: (value: Input, index: number) => Output,
): readonly Output[] {
  return Object.freeze(values.map(map));
}

function requireFinite(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${label} must be finite`);
  }
  return value;
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreeze(child);
    }
    Object.freeze(value);
  }
  return value;
}
