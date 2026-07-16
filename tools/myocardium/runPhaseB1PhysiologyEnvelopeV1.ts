import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import {
  assertCanonicalSha256,
  computeCanonicalSha256,
  type CanonicalSha256HexProvider,
} from "@/engine/myocardium/fourChamberV1/manifests/canonicalJson";
import {
  buildPhaseB1BackwardEulerCommittedIntervalLedgerV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1BackwardEulerCommittedIntervalLedgerV1";
import {
  runPhaseB1BackwardEulerEventScheduleRunnerV1,
  type PhaseB1BackwardEulerEventScheduleRunnerSuccessV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1BackwardEulerEventScheduleRunnerV1";
import {
  evaluatePhaseB1CompleteEndpointMetricV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1CompleteEndpointMetricV1";
import {
  createPhaseB1EndpointStateV1,
  type PhaseB1EndpointStateV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1EndpointStateV1";
import {
  evaluatePhaseB1EventFreeEndpointV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/eventFreeMonolithicBackwardEulerV1";
import {
  buildPhaseB1NormalSinusCommittedSupercycleAuditV1,
  type PhaseB1NormalSinusCommittedSupercycleAuditV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1NormalSinusCommittedSupercycleAuditV1";
import {
  PHASE_B1_NORMAL_SINUS_BE_PERIODIC_SUPPORTED_DT_SEC_V1,
  buildPhaseB1NormalSinusBePeriodicConvergenceDefinitionV1,
  initializePhaseB1NormalSinusBePeriodicStateV1,
  recordPhaseB1NormalSinusBePeriodicCheckpointV1,
  type PhaseB1NormalSinusBePeriodicCommittedCycleObservationV1,
  type PhaseB1NormalSinusBePeriodicStateV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1NormalSinusBePeriodicConvergenceV1";
import {
  buildPhaseB1PhysiologyEnvelopeCaseV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1PhysiologyEnvelopeCaseV1";
import {
  PHASE_B1_PHYSIOLOGY_ENVELOPE_PROTOCOL_V1,
  buildPhaseB1PhysiologyEnvelopeCenterOverlayV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1PhysiologyEnvelopeProtocolV1";
import {
  buildPhaseB1ProjectSyntheticNormalSinusEventScheduleV1,
  generatePhaseB1ProjectSyntheticNormalSinusEventsInWindowV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1ProjectSyntheticNormalSinusEventScheduleV1";
import {
  assertCanonicalPhaseB1QuiescentReferenceEvidenceManifestV1,
  buildPhaseB1QuiescentReferenceEvidenceManifestV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1QuiescentReferenceEvidenceManifestV1";
import {
  assertCanonicalPhaseB1QuiescentReferenceNumericalEvidenceV1,
  buildPhaseB1QuiescentReferenceNumericalEvidenceV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1QuiescentReferenceNumericalEvidenceV1";
import {
  FOUR_CHAMBER_CLOSED_LOOP_FLOW_IDS_V1,
} from "@/engine/myocardium/fourChamberV1/hemodynamics/conservativeIncidenceLedgerV1";
import {
  NORMAL_ADULT_TARGET_PACK_V1,
} from "@/engine/myocardium/fourChamberV1/physiology/normalAdultTargetPackV1";
import {
  BLOOD_COMPARTMENT_IDS,
} from "@/engine/myocardium/fourChamberV1/topology/contracts";
import {
  buildPhaseB1PhysiologyEnvelopeNormalTargetSetV1,
  evaluatePhaseB1PhysiologyEnvelopeMetricsFromCommittedEvaluationsV1,
  phaseB1PhysiologyEnvelopeMetricSamplesFromCommittedEvaluationsV1,
} from "@/tools/myocardium/phaseB1PhysiologyEnvelopeMetricsV1";

const RUNNER_ID = "phase-b1-physiology-envelope-center-runner-v1" as const;
const DEFAULT_REPORT_PATH =
  "data/myocardium/reports/phase-b1-physiology-envelope-center-sls-on-v1.json";
const DEFAULT_WAVEFORM_PATH =
  "data/myocardium/visuals/phase-b1-physiology-envelope-center-sls-on-v1.waveform.json";
const DEFAULT_CHECKPOINT_PATH =
  "data/myocardium/checkpoints/phase-b1-physiology-envelope-center-sls-on-v1.checkpoint.json";

const SOURCE_EVIDENCE_FILES = Object.freeze({
  caseBuilder:
    "engine/myocardium/fourChamberV1/phaseB1/phaseB1PhysiologyEnvelopeCaseV1.ts",
  protocol:
    "engine/myocardium/fourChamberV1/phaseB1/phaseB1PhysiologyEnvelopeProtocolV1.ts",
  targetPack:
    "engine/myocardium/fourChamberV1/physiology/normalAdultTargetPackV1.ts",
  metrics: "tools/myocardium/phaseB1PhysiologyEnvelopeMetricsV1.ts",
  runner: "tools/myocardium/runPhaseB1PhysiologyEnvelopeV1.ts",
} as const);

type CycleSummary = Readonly<{
  cycleIndex: number;
  startTimeSec: number;
  endTimeSec: number;
  elapsedSec: number;
  maximumNormalizedEndpointDistance: number;
  maximizingScalarLabel: string;
  maximumRelativeTotalBloodVolumeDrift: number;
  acceptedTransactionCount: number;
  solverRetrySubdivisionCount: number;
  maximumRetryDepthUsed: number;
  formalPeriodicCheckpoint: null | Readonly<{
    consecutivePassingSupercycles: number;
    cycleLocalPass: boolean;
    streakWindowPass: boolean;
    terminalStatus: string;
    periodicConvergenceCriterionPass: boolean;
  }>;
}>;

type ExploratoryCheckpointPayload = Readonly<{
  checkpointId: "phase-b1-physiology-envelope-exploratory-checkpoint-v1";
  runnerId: typeof RUNNER_ID;
  protocolId: typeof PHASE_B1_PHYSIOLOGY_ENVELOPE_PROTOCOL_V1.protocolId;
  centerId: typeof PHASE_B1_PHYSIOLOGY_ENVELOPE_PROTOCOL_V1.centerId;
  modelId: string;
  parentManifestContentSha256: string;
  parentNumericalEvidenceContentSha256: string;
  scheduleContentSha256: string;
  wallMaterialBindingContentSha256: string;
  destinationRegistryContentSha256: string;
  overlayContentSha256: string;
  nominalDtSec: number;
  completedCycleCount: number;
  cycleSummaries: readonly CycleSummary[];
  finalEndpoint: PhaseB1EndpointStateV1;
  formalPeriodicEvidenceEligible: false;
  serializedObjectIdentityAndBuilderAuthenticationRetained: false;
  claimBoundary: Readonly<{
    exploratoryResumeOnly: true;
    formalPeriodicEvidence: false;
    physiologicalValidation: false;
  }>;
}>;

type ExploratoryCheckpoint = ExploratoryCheckpointPayload & Readonly<{
  contentSha256: string;
}>;

run();

function run(): void {
  const startedAtMs = performance.now();
  const nominalDtSec = parsePositiveNumberEnv(
    "PHASE_B1_PHYSIOLOGY_DT_MS",
    4,
  ) / 1000;
  const maximumCycles = parsePositiveIntegerEnv(
    "PHASE_B1_PHYSIOLOGY_MAX_CYCLES",
    12,
  );
  const reportPath = resolve(
    process.env.PHASE_B1_PHYSIOLOGY_REPORT_PATH ?? DEFAULT_REPORT_PATH,
  );
  const waveformPath = resolve(
    process.env.PHASE_B1_PHYSIOLOGY_WAVEFORM_PATH ?? DEFAULT_WAVEFORM_PATH,
  );
  const checkpointPath = resolve(
    process.env.PHASE_B1_PHYSIOLOGY_CHECKPOINT_PATH ?? DEFAULT_CHECKPOINT_PATH,
  );
  const resumeRequested = process.env.PHASE_B1_PHYSIOLOGY_RESUME === "1";
  const formalPeriodicProtocol = PHASE_B1_NORMAL_SINUS_BE_PERIODIC_SUPPORTED_DT_SEC_V1
    .some((supported) => Object.is(supported, nominalDtSec));

  print({
    stage: "start",
    runnerId: RUNNER_ID,
    nominalDtSec,
    maximumCycles,
    formalPeriodicProtocol,
    reportPath,
    waveformPath,
    checkpointPath,
    resumeRequested,
    claimBoundary: PHASE_B1_PHYSIOLOGY_ENVELOPE_PROTOCOL_V1.claimBoundary,
  });

  const parentStartedAtMs = performance.now();
  const manifest = assertCanonicalPhaseB1QuiescentReferenceEvidenceManifestV1(
    buildPhaseB1QuiescentReferenceEvidenceManifestV1(sha256),
  );
  const numerical = assertCanonicalPhaseB1QuiescentReferenceNumericalEvidenceV1(
    buildPhaseB1QuiescentReferenceNumericalEvidenceV1(manifest, sha256),
    manifest,
  );
  const sourceCase = numerical.results.on.eventFreeCase;
  const schedule = buildPhaseB1ProjectSyntheticNormalSinusEventScheduleV1(sha256);
  const physiologyCase = buildPhaseB1PhysiologyEnvelopeCaseV1({
    sourceCase,
    overlay: buildPhaseB1PhysiologyEnvelopeCenterOverlayV1(sourceCase),
    sha256Hex: sha256,
  });
  print({
    stage: "parent-and-case-ready",
    elapsedSec: secondsSince(parentStartedAtMs),
    totalElapsedSec: secondsSince(startedAtMs),
    manifestContentSha256: manifest.contentSha256,
    numericalContentSha256: numerical.certificate.contentSha256,
    overlayContentSha256: physiologyCase.overlayContentSha256,
    destinationRegistryContentSha256:
      physiologyCase.model.newtonScaleRegistry.registryContentSha256,
    totalBloodVolumeAudit: physiologyCase.totalBloodVolumeAudit,
    initialStationarityAudit: physiologyCase.initialStationarityAudit,
  });

  let endpoint = physiologyCase.initialEndpoint;
  let firstCycleIndex = 0;
  const cycleSummaries: CycleSummary[] = [];
  if (resumeRequested) {
    if (formalPeriodicProtocol) {
      throw new Error("serialized resume is exploratory-only and cannot authenticate a formal periodic state");
    }
    const checkpoint = readExploratoryCheckpoint(checkpointPath, sha256);
    if (
      checkpoint.runnerId !== RUNNER_ID
      || checkpoint.protocolId !== PHASE_B1_PHYSIOLOGY_ENVELOPE_PROTOCOL_V1.protocolId
      || checkpoint.centerId !== PHASE_B1_PHYSIOLOGY_ENVELOPE_PROTOCOL_V1.centerId
      || checkpoint.modelId !== physiologyCase.model.modelId
      || checkpoint.parentManifestContentSha256 !== manifest.contentSha256
      || checkpoint.parentNumericalEvidenceContentSha256
        !== numerical.certificate.contentSha256
      || checkpoint.scheduleContentSha256 !== schedule.contentSha256
      || checkpoint.wallMaterialBindingContentSha256
        !== physiologyCase.wallMaterialBinding.contentSha256
      || checkpoint.destinationRegistryContentSha256
        !== physiologyCase.model.newtonScaleRegistry.registryContentSha256
      || checkpoint.overlayContentSha256 !== physiologyCase.overlayContentSha256
      || !Object.is(checkpoint.nominalDtSec, nominalDtSec)
      || checkpoint.completedCycleCount !== checkpoint.cycleSummaries.length
      || !Object.is(
        checkpoint.finalEndpoint.timeSec,
        checkpoint.completedCycleCount * schedule.cycleLengthSec,
      )
    ) throw new Error("exploratory checkpoint provenance or configuration differs");
    endpoint = createPhaseB1EndpointStateV1({
      timeSec: checkpoint.finalEndpoint.timeSec,
      differentialState: checkpoint.finalEndpoint.differentialState,
      triSegCoordinates: checkpoint.finalEndpoint.triSegCoordinates,
    });
    firstCycleIndex = checkpoint.completedCycleCount;
    cycleSummaries.push(...checkpoint.cycleSummaries);
    print({
      stage: "checkpoint-resumed",
      checkpointPath,
      completedCycleCount: firstCycleIndex,
      endpointTimeSec: endpoint.timeSec,
    });
  }
  let formalState: PhaseB1NormalSinusBePeriodicStateV1 | null = null;
  if (formalPeriodicProtocol) {
    const definition = buildPhaseB1NormalSinusBePeriodicConvergenceDefinitionV1({
      schedule,
      sourceEndpoint: endpoint,
      registry: physiologyCase.model.newtonScaleRegistry,
      nominalDtSec,
      sha256Hex: sha256,
    });
    formalState = initializePhaseB1NormalSinusBePeriodicStateV1({
      definition,
      schedule,
      registry: physiologyCase.model.newtonScaleRegistry,
      initialEndpoint: endpoint,
      sha256Hex: sha256,
    });
  }

  let lastRun: PhaseB1BackwardEulerEventScheduleRunnerSuccessV1 | null = null;
  let lastPeriodDistance: number | null = null;
  let lastAudit: PhaseB1NormalSinusCommittedSupercycleAuditV1 | null = null;
  for (
    let cycleIndex = firstCycleIndex;
    cycleIndex < maximumCycles;
    cycleIndex += 1
  ) {
    const cycleStartedAtMs = performance.now();
    const startTimeSec = cycleIndex * schedule.cycleLengthSec;
    const endTimeSec = (cycleIndex + 1) * schedule.cycleLengthSec;
    if (!Object.is(endpoint.timeSec, startTimeSec)) {
      throw new Error(`cycle ${cycleIndex} initial time is not exact`);
    }
    const events = generatePhaseB1ProjectSyntheticNormalSinusEventsInWindowV1(
      schedule,
      startTimeSec,
      endTimeSec,
      sha256,
    );
    const scheduleRun = runPhaseB1BackwardEulerEventScheduleRunnerV1({
      model: physiologyCase.model,
      wallMaterialBinding: physiologyCase.wallMaterialBinding,
      previousEndpoint: endpoint,
      endTimeSec,
      nominalDtSec,
      orderedEvents: Object.freeze(events.map((event) => event.calciumDriveEvent)),
    });
    if (scheduleRun.completed === false) {
      print({
        stage: "cycle-failure",
        cycleIndex,
        failureStage: scheduleRun.failureStage,
        failureReason: scheduleRun.failureReason,
        lastAcceptedTimeSec: scheduleRun.lastAcceptedEndpoint.timeSec,
        elapsedSec: secondsSince(cycleStartedAtMs),
      });
      process.exitCode = 1;
      return;
    }
    const distance = evaluatePhaseB1CompleteEndpointMetricV1({
      referenceEndpoint: endpoint,
      candidateEndpoint: scheduleRun.finalEndpoint,
      registry: physiologyCase.model.newtonScaleRegistry,
      sha256Hex: sha256,
    });
    lastPeriodDistance = distance.maximumNormalizedDistance;
    const ledger = buildPhaseB1BackwardEulerCommittedIntervalLedgerV1({
      scheduleRun,
    });
    let checkpointSummary: CycleSummary["formalPeriodicCheckpoint"] = null;
    if (formalState !== null) {
      const audit = buildPhaseB1NormalSinusCommittedSupercycleAuditV1({
        definition: formalState.definition,
        schedule,
        cycleIndex,
        scheduleRun,
        sha256Hex: sha256,
      });
      lastAudit = audit;
      const recorded = recordPhaseB1NormalSinusBePeriodicCheckpointV1({
        state: formalState,
        observation: periodicObservationFromAudit(audit),
        sha256Hex: sha256,
      });
      formalState = recorded.state;
      checkpointSummary = Object.freeze({
        consecutivePassingSupercycles:
          recorded.checkpoint.consecutivePassingSupercycles,
        cycleLocalPass: recorded.checkpoint.gates.cycleLocalPass,
        streakWindowPass: recorded.checkpoint.gates.streakWindowPass,
        terminalStatus: recorded.checkpoint.terminalStatus,
        periodicConvergenceCriterionPass:
          recorded.checkpoint.periodicConvergenceCriterionPass,
      });
    }
    const summary: CycleSummary = Object.freeze({
      cycleIndex,
      startTimeSec,
      endTimeSec,
      elapsedSec: secondsSince(cycleStartedAtMs),
      maximumNormalizedEndpointDistance: distance.maximumNormalizedDistance,
      maximizingScalarLabel: distance.maximizingScalarLabel,
      maximumRelativeTotalBloodVolumeDrift:
        ledger.maximumRelativeTotalBloodVolumeDrift,
      acceptedTransactionCount: scheduleRun.acceptedTransactionCount,
      solverRetrySubdivisionCount: scheduleRun.solverRetrySubdivisionCount,
      maximumRetryDepthUsed: scheduleRun.maximumRetryDepthUsed,
      formalPeriodicCheckpoint: checkpointSummary,
    });
    cycleSummaries.push(summary);
    print({ stage: "cycle-complete", ...summary });
    endpoint = scheduleRun.finalEndpoint;
    lastRun = scheduleRun;
    const checkpointPayload: ExploratoryCheckpointPayload = Object.freeze({
      checkpointId: "phase-b1-physiology-envelope-exploratory-checkpoint-v1",
      runnerId: RUNNER_ID,
      protocolId: PHASE_B1_PHYSIOLOGY_ENVELOPE_PROTOCOL_V1.protocolId,
      centerId: PHASE_B1_PHYSIOLOGY_ENVELOPE_PROTOCOL_V1.centerId,
      modelId: physiologyCase.model.modelId,
      parentManifestContentSha256: manifest.contentSha256,
      parentNumericalEvidenceContentSha256:
        numerical.certificate.contentSha256,
      scheduleContentSha256: schedule.contentSha256,
      wallMaterialBindingContentSha256:
        physiologyCase.wallMaterialBinding.contentSha256,
      destinationRegistryContentSha256:
        physiologyCase.model.newtonScaleRegistry.registryContentSha256,
      overlayContentSha256: physiologyCase.overlayContentSha256,
      nominalDtSec,
      completedCycleCount: cycleIndex + 1,
      cycleSummaries: Object.freeze([...cycleSummaries]),
      finalEndpoint: endpoint,
      formalPeriodicEvidenceEligible: false as const,
      serializedObjectIdentityAndBuilderAuthenticationRetained: false as const,
      claimBoundary: Object.freeze({
        exploratoryResumeOnly: true as const,
        formalPeriodicEvidence: false as const,
        physiologicalValidation: false as const,
      }),
    });
    const checkpoint: ExploratoryCheckpoint = Object.freeze({
      ...checkpointPayload,
      contentSha256: computeCanonicalSha256(checkpointPayload, sha256),
    });
    writeJson(checkpointPath, checkpoint);
    if (formalState?.terminalStatus === "converged") break;
  }

  if (lastRun === null || lastPeriodDistance === null) {
    throw new Error("physiology-envelope runner completed no cycle");
  }
  const initialEvaluation = evaluatePhaseB1EventFreeEndpointV1(
    physiologyCase.model,
    physiologyCase.wallMaterialBinding,
    lastRun.initialEndpoint,
  );
  const acceptedEndLeftLimitEvaluations = Object.freeze(
    lastRun.acceptedTransactions.map((transaction) =>
      transaction.leftLimitStep.nextEvaluation),
  );
  const targetSet = buildPhaseB1PhysiologyEnvelopeNormalTargetSetV1({
    pack: NORMAL_ADULT_TARGET_PACK_V1,
    numericalPolicy: {
      maximumRelativeTotalBloodVolumeDrift: 1e-10,
      maximumPeriodEndpointNormalizedDistance: 1e-6,
    },
  });
  const metrics = evaluatePhaseB1PhysiologyEnvelopeMetricsFromCommittedEvaluationsV1({
    cycleStartTimeSec: lastRun.initialEndpoint.timeSec,
    cycleLengthSec: schedule.cycleLengthSec,
    initialEvaluation,
    acceptedEndLeftLimitEvaluations,
    phaseWindows: PHASE_B1_PHYSIOLOGY_ENVELOPE_PROTOCOL_V1.fillingPhaseWindows,
    periodEndpointMaximumNormalizedDistance: lastPeriodDistance,
    normalTargets: targetSet,
  });
  const samples = phaseB1PhysiologyEnvelopeMetricSamplesFromCommittedEvaluationsV1({
    cycleStartTimeSec: lastRun.initialEndpoint.timeSec,
    cycleLengthSec: schedule.cycleLengthSec,
    initialEvaluation,
    acceptedEndLeftLimitEvaluations,
  });
  const formalConvergencePass = formalState?.periodicConvergenceCriterionPass === true;
  const stageOneScreenEligibilityPass = formalPeriodicProtocol
    && formalConvergencePass
    && metrics.normalTargetGate.inputEligibilityPass;
  const stageOneScreenPass = stageOneScreenEligibilityPass
    && metrics.normalTargetGate.pass;
  const sourceCodeEvidence = Object.freeze({
    evidenceId: "phase-b1-physiology-envelope-source-code-evidence-v1" as const,
    canonicalObjectHashAlgorithm: "sha256-canonical-json-v1" as const,
    sourceFileHashAlgorithm: "sha256-file-bytes-v1" as const,
    targetPackCanonicalContentSha256: computeCanonicalSha256(
      NORMAL_ADULT_TARGET_PACK_V1,
      sha256,
    ),
    protocolCanonicalContentSha256: computeCanonicalSha256(
      PHASE_B1_PHYSIOLOGY_ENVELOPE_PROTOCOL_V1,
      sha256,
    ),
    sourceFileSha256: Object.freeze(Object.fromEntries(
      Object.entries(SOURCE_EVIDENCE_FILES).map(([id, relativePath]) => [
        id,
        sha256FileBytes(resolve(relativePath)),
      ]),
    )),
    repositoryCommitIdentityClaimed: false as const,
    evidenceScope:
      "exact attached source files plus authenticated numerical/model manifests; not whole-repository source closure" as const,
  });
  const reportPayload = {
    runnerId: RUNNER_ID,
    generatedAt: new Date().toISOString(),
    protocolId: PHASE_B1_PHYSIOLOGY_ENVELOPE_PROTOCOL_V1.protocolId,
    centerId: PHASE_B1_PHYSIOLOGY_ENVELOPE_PROTOCOL_V1.centerId,
    config: { nominalDtSec, maximumCycles, formalPeriodicProtocol },
    provenance: physiologyCase.provenance,
    overlay: physiologyCase.overlay,
    totalBloodVolumeAudit: physiologyCase.totalBloodVolumeAudit,
    registryAudit: physiologyCase.registryAudit,
    initialStationarityAudit: physiologyCase.initialStationarityAudit,
    sourceCodeEvidence,
    cycleSummaries,
    terminal: {
      completedCycleCount: cycleSummaries.length,
      formalPeriodicStatus: formalState?.terminalStatus ?? "not-run-exploratory-dt",
      formalPeriodicConvergencePass: formalConvergencePass,
      committedSupercycleAuditPass:
        lastAudit?.committedSupercycleAuditPass ?? false,
      stageOneGlobalHemodynamicsScreenEligibilityPass:
        stageOneScreenEligibilityPass,
      stageOneGlobalHemodynamicsScreenPass: stageOneScreenPass,
      completePhysiologyEnvelopeGateImplemented: false as const,
      physiologicalValidationPass: false,
    },
    metrics,
    claimBoundary: {
      ...PHASE_B1_PHYSIOLOGY_ENVELOPE_PROTOCOL_V1.claimBoundary,
      exploratoryTimeStep: !formalPeriodicProtocol,
      formalPeriodicEvidenceEligible: formalPeriodicProtocol,
      formalPeriodicConvergencePass: formalConvergencePass,
      stageOneGlobalHemodynamicsScreenIsProspectiveOnly: true,
      physiologyBandClassificationRequiresFormalPeriodOne: true,
      stageOneGlobalHemodynamicsScreenEligibilityPass:
        stageOneScreenEligibilityPass,
      completePhysiologyEnvelopeGateImplemented: false,
      physiologicalValidationPass: false,
      atrialPvLoopHeldOutFromSelection: true,
    },
  };
  const report = Object.freeze({
    ...reportPayload,
    contentSha256: computeCanonicalSha256(reportPayload, sha256),
  });
  const waveformPayload = {
    waveformId: "phase-b1-physiology-envelope-terminal-cycle-waveform-v1",
    generatedAt: report.generatedAt,
    cycleIndex: cycleSummaries.at(-1)!.cycleIndex,
    cycleStartTimeSec: lastRun.initialEndpoint.timeSec,
    cycleLengthSec: schedule.cycleLengthSec,
    nominalDtSec,
    compartmentIds: BLOOD_COMPARTMENT_IDS,
    flowIds: FOUR_CHAMBER_CLOSED_LOOP_FLOW_IDS_V1,
    samples,
    claimBoundary: report.claimBoundary,
    sourceReportContentSha256: report.contentSha256,
  };
  const waveform = Object.freeze({
    ...waveformPayload,
    contentSha256: computeCanonicalSha256(waveformPayload, sha256),
  });
  writeJson(reportPath, report);
  writeJson(waveformPath, waveform);
  print({
    stage: "complete",
    elapsedSec: secondsSince(startedAtMs),
    reportPath,
    waveformPath,
    completedCycleCount: cycleSummaries.length,
    formalPeriodicConvergencePass: formalConvergencePass,
    stageOneGlobalHemodynamicsScreenEligibilityPass:
      stageOneScreenEligibilityPass,
    stageOneGlobalHemodynamicsScreenPass: stageOneScreenPass,
    physiologyBandComparisonStatus:
      metrics.normalTargetGate.physiologyBandComparisonStatus,
    provisionalHardTargetReadbacksOutsideBand:
      metrics.normalTargetGate.targetResults
      .filter((target) => target.role === "hard" && !target.pass)
      .map((target) => ({
        gateId: target.gateId,
        observed: target.observed,
        unit: target.unit,
        lowerInclusive: target.lowerInclusive,
        upperInclusive: target.upperInclusive,
      })),
  });
}

function periodicObservationFromAudit(
  audit: PhaseB1NormalSinusCommittedSupercycleAuditV1,
): PhaseB1NormalSinusBePeriodicCommittedCycleObservationV1 {
  const ledger = audit.committedIntervalLedger;
  return Object.freeze({
    cycleIndex: audit.cycleIndex,
    initialEndpoint: ledger.initialEndpoint,
    finalEndpoint: ledger.finalEndpoint,
    integratedFlowVolumeByFlow: Object.freeze(Object.fromEntries(
      FOUR_CHAMBER_CLOSED_LOOP_FLOW_IDS_V1.map((flowId) => {
        const value = ledger.integratedEdgeVolumeByFlow[flowId];
        return [flowId, Object.freeze({
          signedVolumeM3: value.signedVolumeM3,
          forwardVolumeM3: value.forwardVolumeM3,
          regurgitantVolumeM3: value.regurgitantVolumeM3,
        })];
      }),
    )) as PhaseB1NormalSinusBePeriodicCommittedCycleObservationV1[
      "integratedFlowVolumeByFlow"
    ],
    maximumRelativeTotalBloodVolumeDrift:
      ledger.maximumRelativeTotalBloodVolumeDrift,
    exactOneScheduleSupercycleVerified:
      audit.committedSupercycleAuditPass,
    committedIntervalProvenanceVerified:
      audit.committedLedgerProvenanceVerified,
    structuralAndNumericalIntervalLedgerGatesPass:
      ledger.structuralAndNumericalIntervalLedgerGatesPass,
    projectionClippingClampAndFallbackFree:
      audit.projectionClippingClampAndFallbackFree,
  });
}

function sha256(canonicalJson: string): string {
  return createHash("sha256").update(canonicalJson).digest("hex");
}

function sha256FileBytes(path: string): string {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function writeJson(path: string, value: unknown): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function readExploratoryCheckpoint(
  path: string,
  sha256Hex: CanonicalSha256HexProvider,
): ExploratoryCheckpoint {
  if (!existsSync(path)) throw new Error(`exploratory checkpoint does not exist: ${path}`);
  const parsed = JSON.parse(readFileSync(path, "utf8")) as Record<string, unknown>;
  if (
    parsed === null
    || typeof parsed !== "object"
    || parsed.checkpointId !== "phase-b1-physiology-envelope-exploratory-checkpoint-v1"
    || parsed.formalPeriodicEvidenceEligible !== false
    || parsed.serializedObjectIdentityAndBuilderAuthenticationRetained !== false
    || typeof parsed.overlayContentSha256 !== "string"
    || typeof parsed.nominalDtSec !== "number"
    || !Number.isSafeInteger(parsed.completedCycleCount)
    || (parsed.completedCycleCount as number) < 0
    || !Array.isArray(parsed.cycleSummaries)
    || parsed.finalEndpoint === null
    || typeof parsed.finalEndpoint !== "object"
    || typeof parsed.contentSha256 !== "string"
  ) throw new Error("exploratory checkpoint schema is malformed");
  const { contentSha256, ...payload } = parsed;
  assertCanonicalSha256(
    payload,
    contentSha256,
    sha256Hex,
    "exploratoryCheckpoint.contentSha256",
  );
  return parsed as unknown as ExploratoryCheckpoint;
}

function parsePositiveNumberEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined) return fallback;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || !(parsed > 0)) {
    throw new Error(`${name} must be a positive finite number`);
  }
  return parsed;
}

function parsePositiveIntegerEnv(name: string, fallback: number): number {
  const parsed = parsePositiveNumberEnv(name, fallback);
  if (!Number.isSafeInteger(parsed)) {
    throw new Error(`${name} must be a positive safe integer`);
  }
  return parsed;
}

function secondsSince(startedAtMs: number): number {
  return Number(((performance.now() - startedAtMs) / 1000).toFixed(3));
}

function print(value: unknown): void {
  process.stdout.write(`${JSON.stringify(value)}\n`);
}
