import {
  assertCanonicalSha256,
  computeCanonicalSha256,
  type CanonicalSha256HexProvider,
} from "@/engine/myocardium/fourChamberV1/manifests/canonicalJson";
import {
  assertBuilderIssuedPhaseB1NormalSinusBeTerminalTimestepObservationV1,
  type PhaseB1NormalSinusBeTerminalTimestepObservationV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1NormalSinusBeTerminalTimestepObservationV1";
import {
  assertExactPlainRecordV1,
} from "@/engine/myocardium/fourChamberV1/validation/strictClosedRecordV1";
import {
  buildPhaseB1TerminalWaveformSeriesV1,
  type PhaseB1TerminalWaveformSeriesV1,
} from "@/tools/myocardium/phaseB1TerminalWaveformArtifactV1";

export const PHASE_B1_PAIRED_TERMINAL_WAVEFORM_ARTIFACT_V1_ID =
  "phase-b1-normal-sinus-be-sls-off-on-paired-terminal-waveform-artifact-v1" as const;

export const PHASE_B1_PAIRED_TERMINAL_WAVEFORM_MODE_ORDER_V1 = Object.freeze([
  "off",
  "on",
] as const);

type SlsModeV1 =
  (typeof PHASE_B1_PAIRED_TERMINAL_WAVEFORM_MODE_ORDER_V1)[number];

type ModeRecordV1<Value> = Readonly<Record<SlsModeV1, Value>>;

type ObservationV1 = PhaseB1NormalSinusBeTerminalTimestepObservationV1;

export type PhaseB1PairedTerminalWaveformArtifactPayloadV1 = Readonly<{
  artifactId: typeof PHASE_B1_PAIRED_TERMINAL_WAVEFORM_ARTIFACT_V1_ID;
  status:
    "authenticated-in-process-sls-off-on-terminal-waveform-pair-for-visual-qa";
  sourceAuthentication: Readonly<{
    bothTerminalObservationsBuilderIssuedInProcess: true;
    bothConvergedTerminalCapsulesAuthenticatedInProcess: true;
    bothMatchingCommittedCycleEnergyAuditsAuthenticatedInProcess: true;
    sameComparisonManifestObjectIdentity: true;
    sameInitialSourceParityAuditObjectIdentity: true;
    sameParentManifestObjectIdentity: true;
    sameParentNumericalEvidenceObjectIdentity: true;
    sameScheduleObjectIdentity: true;
    periodicDefinitionsAreModeSpecific: true;
    periodicDefinitionHashEqualityRequired: false;
    builderIssuedAuthenticationSurvivesSerialization: false;
  }>;
  units: Readonly<{
    phase: "s";
    volume: "m3";
    absolutePressure: "Pa";
    signedFlow: "m3/s";
    valuesConvertedForPresentation: false;
  }>;
  pair: Readonly<{
    modeOrder: typeof PHASE_B1_PAIRED_TERMINAL_WAVEFORM_MODE_ORDER_V1;
    gridRole: ObservationV1["gridRole"];
    nominalDtSec: number;
    canonicalCycleLengthSec: number;
    sameNominalGridAndCanonicalCycle: true;
    slsOffPhysicalSlsEnabled: false;
    slsOnPhysicalSlsEnabled: true;
  }>;
  modeDiagnostics: ModeRecordV1<Readonly<{
    slsMode: SlsModeV1;
    terminalStatus: ObservationV1["terminalCycleCapsule"]["terminalStatus"];
    liveSingleStartPeriodOneCriterionPass: boolean;
    terminalCycleConvergencePass: boolean;
    completedSupercycleCount: number;
    finalCycleIndex: number;
    terminalObservationGatePass: boolean;
    authenticatedNegativeObservationIssued: boolean;
    selectedSampleCount: number;
  }>>;
  commonSourceHashes: Readonly<{
    comparisonManifestContentSha256: string;
    comparisonPolicyContentSha256: string;
    initialSourceParityAuditContentSha256: string;
    parentManifestContentSha256: string;
    parentNumericalEvidenceContentSha256: string;
    scheduleContentSha256: string;
    wallMaterialBindingContentSha256: string;
  }>;
  modeSourceHashes: ModeRecordV1<Readonly<{
    periodicDefinitionContentSha256: string;
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
    newtonScaleRegistryContentSha256: string;
  }>>;
  waveforms: ModeRecordV1<PhaseB1TerminalWaveformSeriesV1>;
  interpretationBoundary: Readonly<{
    visualQaProjectionOnly: true;
    pairOutcomeUsedAsPassFailGate: false;
    atrialPvTopologyPreservationRequired: false;
    atrialPvTopologyGenerationOrErasurePreordained: false;
    matchedVolumeAttributionComputed: false;
    serializationReauthenticationSupported: false;
  }>;
  negativeClaims: Readonly<{
    causalEffectOfSlsEstablished: false;
    atrialPvFigureEightTopologyEvaluated: false;
    physiologicalValidationPass: false;
    numericalThreeGridComparisonPass: false;
    timestepConvergenceAcceptancePass: false;
    cycleEnergyAcceptancePass: false;
    wholeHeartBackwardEulerEnergyAcceptancePass: false;
    phaseB1AcceptancePass: false;
    modelCoreIntegration: false;
    browserRuntimeAdopted: false;
    releaseRuntimeReachable: false;
  }>;
  hashAlgorithm: "sha256-canonical-json-v1";
  testOnly: true;
}>;

export type PhaseB1PairedTerminalWaveformArtifactV1 =
  PhaseB1PairedTerminalWaveformArtifactPayloadV1 & Readonly<{
    contentSha256: string;
  }>;

export type BuildPhaseB1PairedTerminalWaveformArtifactInputV1 = Readonly<{
  slsOffTerminalObservation: ObservationV1;
  slsOnTerminalObservation: ObservationV1;
  sha256Hex: CanonicalSha256HexProvider;
}>;

/**
 * Projects one authenticated SLS-off/on terminal-observation pair into raw-SI
 * plotting columns.  This is intentionally not a physiology, morphology, or
 * causal-effect evaluator: topology can be generated, retained, or erased
 * without changing artifact eligibility.
 */
export function buildPhaseB1PairedTerminalWaveformArtifactV1(
  input: BuildPhaseB1PairedTerminalWaveformArtifactInputV1,
): PhaseB1PairedTerminalWaveformArtifactV1 {
  assertExactPlainRecordV1(input, [
    "slsOffTerminalObservation",
    "slsOnTerminalObservation",
    "sha256Hex",
  ], "Phase B1 paired terminal waveform artifact input");
  if (typeof input.sha256Hex !== "function") {
    throw new Error("paired terminal waveform artifact requires a SHA-256 provider");
  }
  const off =
    assertBuilderIssuedPhaseB1NormalSinusBeTerminalTimestepObservationV1(
      input.slsOffTerminalObservation,
      input.sha256Hex,
    );
  const on =
    assertBuilderIssuedPhaseB1NormalSinusBeTerminalTimestepObservationV1(
      input.slsOnTerminalObservation,
      input.sha256Hex,
    );
  assertPairedObservationLineage(off, on);

  const waveforms = deepFreeze<ModeRecordV1<PhaseB1TerminalWaveformSeriesV1>>({
    off: buildPhaseB1TerminalWaveformSeriesV1(off.sampleTrace.samples),
    on: buildPhaseB1TerminalWaveformSeriesV1(on.sampleTrace.samples),
  });
  const payload = deepFreeze<PhaseB1PairedTerminalWaveformArtifactPayloadV1>({
    artifactId: PHASE_B1_PAIRED_TERMINAL_WAVEFORM_ARTIFACT_V1_ID,
    status:
      "authenticated-in-process-sls-off-on-terminal-waveform-pair-for-visual-qa",
    sourceAuthentication: {
      bothTerminalObservationsBuilderIssuedInProcess: true,
      bothConvergedTerminalCapsulesAuthenticatedInProcess: true,
      bothMatchingCommittedCycleEnergyAuditsAuthenticatedInProcess: true,
      sameComparisonManifestObjectIdentity: true,
      sameInitialSourceParityAuditObjectIdentity: true,
      sameParentManifestObjectIdentity: true,
      sameParentNumericalEvidenceObjectIdentity: true,
      sameScheduleObjectIdentity: true,
      periodicDefinitionsAreModeSpecific: true,
      periodicDefinitionHashEqualityRequired: false,
      builderIssuedAuthenticationSurvivesSerialization: false,
    },
    units: {
      phase: "s",
      volume: "m3",
      absolutePressure: "Pa",
      signedFlow: "m3/s",
      valuesConvertedForPresentation: false,
    },
    pair: {
      modeOrder: PHASE_B1_PAIRED_TERMINAL_WAVEFORM_MODE_ORDER_V1,
      gridRole: off.gridRole,
      nominalDtSec: off.nominalDtSec,
      canonicalCycleLengthSec: off.canonicalCycleLengthSec,
      sameNominalGridAndCanonicalCycle: true,
      slsOffPhysicalSlsEnabled: false,
      slsOnPhysicalSlsEnabled: true,
    },
    modeDiagnostics: {
      off: buildModeDiagnostics(off, waveforms.off.phaseSec.length),
      on: buildModeDiagnostics(on, waveforms.on.phaseSec.length),
    },
    commonSourceHashes: {
      comparisonManifestContentSha256:
        off.sourceComparisonManifestContentSha256,
      comparisonPolicyContentSha256:
        off.sourceComparisonPolicyContentSha256,
      initialSourceParityAuditContentSha256:
        off.sourceInitialParityAuditContentSha256,
      parentManifestContentSha256: off.sourceParentManifestContentSha256,
      parentNumericalEvidenceContentSha256:
        off.sourceParentNumericalEvidenceContentSha256,
      scheduleContentSha256: off.sourceScheduleContentSha256,
      wallMaterialBindingContentSha256:
        off.terminalCycleCapsule.sourceWallMaterialBindingContentSha256,
    },
    modeSourceHashes: {
      off: buildModeSourceHashes(off),
      on: buildModeSourceHashes(on),
    },
    waveforms,
    interpretationBoundary: {
      visualQaProjectionOnly: true,
      pairOutcomeUsedAsPassFailGate: false,
      atrialPvTopologyPreservationRequired: false,
      atrialPvTopologyGenerationOrErasurePreordained: false,
      matchedVolumeAttributionComputed: false,
      serializationReauthenticationSupported: false,
    },
    negativeClaims: {
      causalEffectOfSlsEstablished: false,
      atrialPvFigureEightTopologyEvaluated: false,
      physiologicalValidationPass: false,
      numericalThreeGridComparisonPass: false,
      timestepConvergenceAcceptancePass: false,
      cycleEnergyAcceptancePass: false,
      wholeHeartBackwardEulerEnergyAcceptancePass: false,
      phaseB1AcceptancePass: false,
      modelCoreIntegration: false,
      browserRuntimeAdopted: false,
      releaseRuntimeReachable: false,
    },
    hashAlgorithm: "sha256-canonical-json-v1",
    testOnly: true,
  });
  return Object.freeze({
    ...payload,
    contentSha256: computeCanonicalSha256(payload, input.sha256Hex),
  });
}

export function phaseB1PairedTerminalWaveformArtifactHashPayloadV1(
  artifact: PhaseB1PairedTerminalWaveformArtifactV1,
): PhaseB1PairedTerminalWaveformArtifactPayloadV1 {
  const { contentSha256: _contentSha256, ...payload } = artifact;
  return payload;
}

export function serializePhaseB1PairedTerminalWaveformArtifactV1(
  artifact: PhaseB1PairedTerminalWaveformArtifactV1,
  sha256Hex: CanonicalSha256HexProvider,
): string {
  if (
    artifact.artifactId
      !== PHASE_B1_PAIRED_TERMINAL_WAVEFORM_ARTIFACT_V1_ID
  ) {
    throw new Error("paired terminal waveform artifact identity drifted");
  }
  assertCanonicalSha256(
    phaseB1PairedTerminalWaveformArtifactHashPayloadV1(artifact),
    artifact.contentSha256,
    sha256Hex,
  );
  return `${JSON.stringify(artifact, null, 2)}\n`;
}

function assertPairedObservationLineage(
  off: ObservationV1,
  on: ObservationV1,
): void {
  const offCapsule = off.terminalCycleCapsule;
  const onCapsule = on.terminalCycleCapsule;
  if (off.slsMode !== "off" || offCapsule.slsMode !== "off") {
    throw new Error("paired terminal waveform SLS-off observation mode drifted");
  }
  if (on.slsMode !== "on" || onCapsule.slsMode !== "on") {
    throw new Error("paired terminal waveform SLS-on observation mode drifted");
  }
  if (
    !Object.is(off.comparisonManifest, on.comparisonManifest)
    || off.sourceComparisonManifestContentSha256
      !== on.sourceComparisonManifestContentSha256
    || off.sourceComparisonPolicyContentSha256
      !== on.sourceComparisonPolicyContentSha256
  ) {
    throw new Error("paired terminal waveform comparison manifest differs across modes");
  }
  if (
    !Object.is(off.initialSourceParityAudit, on.initialSourceParityAudit)
    || off.sourceInitialParityAuditContentSha256
      !== on.sourceInitialParityAuditContentSha256
  ) {
    throw new Error("paired terminal waveform initial source parity differs across modes");
  }
  if (
    !Object.is(offCapsule.parentManifest, onCapsule.parentManifest)
    || off.sourceParentManifestContentSha256
      !== on.sourceParentManifestContentSha256
    || !Object.is(
      offCapsule.parentNumericalEvidence,
      onCapsule.parentNumericalEvidence,
    )
    || off.sourceParentNumericalEvidenceContentSha256
      !== on.sourceParentNumericalEvidenceContentSha256
  ) {
    throw new Error("paired terminal waveform parent evidence differs across modes");
  }
  if (
    !Object.is(offCapsule.schedule, onCapsule.schedule)
    || off.sourceScheduleContentSha256 !== on.sourceScheduleContentSha256
  ) {
    throw new Error("paired terminal waveform schedule differs across modes");
  }
  if (
    off.gridRole !== on.gridRole
    || !Object.is(off.nominalDtSec, on.nominalDtSec)
    || !Object.is(off.canonicalCycleLengthSec, on.canonicalCycleLengthSec)
    || offCapsule.sourceWallMaterialBindingContentSha256
      !== onCapsule.sourceWallMaterialBindingContentSha256
  ) {
    throw new Error("paired terminal waveform grid or common model binding differs across modes");
  }
  if (
    offCapsule.terminalStatus !== "converged"
    || onCapsule.terminalStatus !== "converged"
    || offCapsule.liveSingleStartPeriodOneCriterionPass !== true
    || onCapsule.liveSingleStartPeriodOneCriterionPass !== true
    || offCapsule.terminalCycleConvergencePass !== true
    || onCapsule.terminalCycleConvergencePass !== true
  ) {
    throw new Error("paired terminal waveform requires two converged terminal capsules");
  }
}

function buildModeDiagnostics(
  observation: ObservationV1,
  selectedSampleCount: number,
): PhaseB1PairedTerminalWaveformArtifactPayloadV1["modeDiagnostics"][SlsModeV1] {
  const capsule = observation.terminalCycleCapsule;
  return deepFreeze({
    slsMode: observation.slsMode,
    terminalStatus: capsule.terminalStatus,
    liveSingleStartPeriodOneCriterionPass:
      capsule.liveSingleStartPeriodOneCriterionPass,
    terminalCycleConvergencePass: capsule.terminalCycleConvergencePass,
    completedSupercycleCount: capsule.completedSupercycleCount,
    finalCycleIndex: capsule.finalCycleIndex,
    terminalObservationGatePass: observation.terminalObservationGatePass,
    authenticatedNegativeObservationIssued:
      observation.authenticatedNegativeObservationIssued,
    selectedSampleCount,
  });
}

function buildModeSourceHashes(
  observation: ObservationV1,
): PhaseB1PairedTerminalWaveformArtifactPayloadV1["modeSourceHashes"][SlsModeV1] {
  const capsule = observation.terminalCycleCapsule;
  return deepFreeze({
    periodicDefinitionContentSha256: capsule.definitionContentSha256,
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
    newtonScaleRegistryContentSha256:
      observation.sourceNewtonScaleRegistryContentSha256,
  });
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
