import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
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
  PHASE_B1_NORMAL_SINUS_BE_PERIODIC_SUPPORTED_DT_SEC_V1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1NormalSinusBePeriodicConvergenceV1";
import {
  evaluatePhaseB1EventFreeEndpointV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/eventFreeMonolithicBackwardEulerV1";
import {
  buildPhaseB1MechanisticRebuildCaseV2,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1MechanisticRebuildCaseV2";
import {
  PHASE_B1_PHYSIOLOGY_ENVELOPE_PROTOCOL_V1,
  buildPhaseB1PhysiologyEnvelopeCenterOverlayV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1PhysiologyEnvelopeProtocolV1";
import {
  buildPhaseB1ProjectSyntheticNormalSinusEventScheduleV1,
  generatePhaseB1ProjectSyntheticNormalSinusEventsInWindowV1,
  type PhaseB1ProjectSyntheticNormalSinusScheduledEventV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1ProjectSyntheticNormalSinusEventScheduleV1";
import {
  buildPhaseB1QuiescentReferenceEvidenceManifestV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1QuiescentReferenceEvidenceManifestV1";
import {
  buildPhaseB1QuiescentReferenceNumericalEvidenceV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1QuiescentReferenceNumericalEvidenceV1";
import {
  computeCanonicalSha256,
} from "@/engine/myocardium/fourChamberV1/manifests/canonicalJson";
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
import {
  PHASE_B1_MECHANISTIC_PERIODIC_CONTINUATION_POLICY_V1,
  initializePhaseB1MechanisticPeriodicContinuationV1,
  recordPhaseB1MechanisticPeriodicContinuationCycleV1,
  type PhaseB1MechanisticPeriodicContinuationCheckpointV1,
} from "@/tools/myocardium/phaseB1MechanisticPeriodicContinuationV1";
import {
  buildPhaseB1AtrialPvReservoirConduitReadbackV1,
  type PhaseB1AtrialPvReadbackTraceV1,
} from "@/tools/myocardium/phaseB1AtrialPvReservoirConduitReadbackV1";

const RUNNER_ID =
  "phase-b1-mechanistic-rebuild-v2-periodic-fixed-point-runner" as const;
const DEFAULT_REPORT_PATH =
  "data/myocardium/reports/phase-b1-mechanistic-rebuild-v2-sls-on.json";
const DEFAULT_WAVEFORM_PATH =
  "data/myocardium/visuals/phase-b1-mechanistic-rebuild-v2-sls-on.waveform.json";

const SOURCE_EVIDENCE_FILES = Object.freeze({
  activeTissueClassPrior:
    "engine/myocardium/fourChamberV1/land/normalAdultActiveTissueClassPriorV1.ts",
  wallMaterialBinding:
    "engine/myocardium/fourChamberV1/phaseB1/phaseB1WallMaterialBindingV1.ts",
  caseBuilder:
    "engine/myocardium/fourChamberV1/phaseB1/phaseB1MechanisticRebuildCaseV2.ts",
  protocol:
    "engine/myocardium/fourChamberV1/phaseB1/phaseB1PhysiologyEnvelopeProtocolV1.ts",
  targetPack:
    "engine/myocardium/fourChamberV1/physiology/normalAdultTargetPackV1.ts",
  metrics: "tools/myocardium/phaseB1PhysiologyEnvelopeMetricsV1.ts",
  periodicContinuation:
    "tools/myocardium/phaseB1MechanisticPeriodicContinuationV1.ts",
  atrialPvReadback:
    "tools/myocardium/phaseB1AtrialPvReservoirConduitReadbackV1.ts",
  runner: "tools/myocardium/runPhaseB1MechanisticRebuildV2.ts",
} as const);
const WALL_IDS_FOR_DIAGNOSTIC = Object.freeze([
  "LA", "LVFW", "SEP", "RVFW", "RA",
] as const);
const VENTRICULAR_WALL_IDS_FOR_EVENT_LOCAL_LVEDP = Object.freeze([
  "LVFW", "SEP", "RVFW",
] as const);
const EVENT_LOCAL_LVEDP_AUDIT_ID =
  "phase-b1-first-ventricular-calcium-left-limit-lvedp-audit-v1" as const;
const PA_PER_MMHG = 133.322387415;

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
  signedMeanFlowM3PerSecByEdge: Readonly<Record<string, number>>;
  physiology: Readonly<{
    leftVentricularEndDiastolicVolumeMl: number;
    leftVentricularEndSystolicVolumeMl: number;
    systemicArterialMinimumPressureMmHg: number;
    systemicArterialMaximumPressureMmHg: number;
    systemicArterialMeanPressureMmHg: number;
    leftCardiacOutputLPerMin: number;
    rightCardiacOutputLPerMin: number;
    leftRightCardiacOutputMismatchFraction: number;
  }>;
  mechanicalEnergyDiagnostic: ReturnType<
    typeof summarizeCommittedCycleMechanicalEnergy
  >;
  eventLocalLeftVentricularEndDiastolicPressureAudit: ReturnType<
    typeof buildEventLocalLeftVentricularEndDiastolicPressureAudit
  >;
  periodicContinuationCheckpoint:
    PhaseB1MechanisticPeriodicContinuationCheckpointV1;
}>;

if (
  process.argv[1] !== undefined
  && import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) run();

function run(): void {
  const startedAtMs = performance.now();
  const nominalDtSec = parsePositiveNumberEnv(
    "PHASE_B1_MECHANISTIC_REBUILD_DT_MS",
    4,
  ) / 1000;
  const maximumCycles = parsePositiveIntegerEnv(
    "PHASE_B1_MECHANISTIC_REBUILD_MAX_CYCLES",
    PHASE_B1_MECHANISTIC_PERIODIC_CONTINUATION_POLICY_V1
      .defaultMaximumCycleCount,
  );
  const formalPeriodicProtocol =
    PHASE_B1_NORMAL_SINUS_BE_PERIODIC_SUPPORTED_DT_SEC_V1
      .some((supported) => Object.is(supported, nominalDtSec));
  const reportPath = resolve(
    process.env.PHASE_B1_MECHANISTIC_REBUILD_REPORT_PATH ?? DEFAULT_REPORT_PATH,
  );
  const waveformPath = resolve(
    process.env.PHASE_B1_MECHANISTIC_REBUILD_WAVEFORM_PATH ?? DEFAULT_WAVEFORM_PATH,
  );
  print({
    stage: "start",
    runnerId: RUNNER_ID,
    nominalDtSec,
    maximumCycles,
    formalPeriodicProtocol,
    reportPath,
    waveformPath,
    claimBoundary: {
      repeatedCycleFixedPointContinuation: true,
      singleCycleMayEstablishPeriodicOrbit: false,
      fullHighDimensionalNewtonShootingUsed: false,
      physiologicalValidation: false,
      runtimeAdoption: false,
    },
  });

  const parentStartedAtMs = performance.now();
  const manifest = buildPhaseB1QuiescentReferenceEvidenceManifestV1(sha256);
  const numerical = buildPhaseB1QuiescentReferenceNumericalEvidenceV1(
    manifest,
    sha256,
  );
  const sourceCase = numerical.results.on.eventFreeCase;
  const schedule = buildPhaseB1ProjectSyntheticNormalSinusEventScheduleV1(sha256);
  const candidate = buildPhaseB1MechanisticRebuildCaseV2({
    sourceCase,
    overlay: buildPhaseB1PhysiologyEnvelopeCenterOverlayV1(sourceCase),
    atrialLandKinematicClosure: "population-only",
    sha256Hex: sha256,
  });
  const scheduleCandidateCalciumTimingParityPass =
    WALL_IDS_FOR_DIAGNOSTIC.every((wallId) => {
      const scheduled = schedule.sourceBindings.timingByWall[wallId];
      const runtime = candidate.wallMaterialBinding.runtimeByWall[wallId];
      return scheduled.tissueClass === runtime.tissueClass
        && scheduled.tissueManifestSha256
          === runtime.passiveSls.tissueManifestSha256
        && Object.is(
          scheduled.electricalToCalciumDelaySec,
          runtime.prescribedCalciumParameters.electricalToCalciumDelaySec,
        );
    });
  const scheduleCandidateCalciumShapeEvidenceParityPass =
    WALL_IDS_FOR_DIAGNOSTIC.every((wallId) => {
      const scheduled = schedule.sourceBindings.timingByWall[wallId];
      const runtime = candidate.wallMaterialBinding.runtimeByWall[wallId];
      return scheduled.prescribedCalciumEvidenceId
        === runtime.prescribedCalciumParameters.evidenceId;
    });
  if (!scheduleCandidateCalciumTimingParityPass) {
    throw new Error(
      "normal-sinus schedule calcium timing drifted from the candidate wall binding",
    );
  }
  const initialCycleCalciumDriveOffsetSecByWall = Object.freeze(
    Object.fromEntries(schedule.events.map((event) => [
      event.wallId,
      event.calciumDriveOffsetWithinCycleSec,
    ])),
  );
  print({
    stage: "candidate-ready",
    elapsedSec: secondsSince(parentStartedAtMs),
    totalElapsedSec: secondsSince(startedAtMs),
    configurationContentSha256: candidate.configurationContentSha256,
    constructionAudit: candidate.audit,
    activeTissueClassPrior: candidate.activeTissueClassPrior,
    initializationAudit: candidate.initialization.audit,
    scheduleCandidateCalciumTimingParityPass,
    scheduleCandidateCalciumShapeEvidenceParityPass,
    scheduleShapeEvidenceOwnsEventTiming: false,
    initialCycleCalciumDriveOffsetSecByWall,
    ventricularWalls: candidate.ventricularMechanics.anatomy.walls,
    passiveFit: {
      sharedTensileEnergyScale:
        candidate.ventricularMechanics.passiveFit.sharedTensileEnergyScale,
      compressionScaleIdentified:
        candidate.ventricularMechanics.passiveFit.compressionScaleIdentified,
      slsScaleIdentified:
        candidate.ventricularMechanics.passiveFit.slsScaleIdentified,
      rootMeanSquarePressureErrorPa:
        candidate.ventricularMechanics.passiveFit.rootMeanSquarePressureErrorPa,
      maximumAbsolutePressureErrorPa:
        candidate.ventricularMechanics.passiveFit.maximumAbsolutePressureErrorPa,
    },
  });

  let endpoint = candidate.initialization.endpoint;
  const cycleBoundaryEndpoints = [endpoint];
  let lastRun: PhaseB1BackwardEulerEventScheduleRunnerSuccessV1 | null = null;
  let lastPeriodDistance: number | null = null;
  let periodicContinuation =
    initializePhaseB1MechanisticPeriodicContinuationV1(maximumCycles);
  const cycleSummaries: CycleSummary[] = [];
  const targetSet = buildPhaseB1PhysiologyEnvelopeNormalTargetSetV1({
    pack: NORMAL_ADULT_TARGET_PACK_V1,
    numericalPolicy: {
      maximumRelativeTotalBloodVolumeDrift: 1e-10,
      maximumPeriodEndpointNormalizedDistance: 1e-6,
    },
  });
  for (let cycleIndex = 0; cycleIndex < maximumCycles; cycleIndex += 1) {
    const cycleStartedAtMs = performance.now();
    const startTimeSec = cycleIndex * schedule.cycleLengthSec;
    const endTimeSec = (cycleIndex + 1) * schedule.cycleLengthSec;
    if (!Object.is(endpoint.timeSec, startTimeSec)) {
      throw new Error(`mechanistic-rebuild cycle ${cycleIndex} start time drifted`);
    }
    const events = generatePhaseB1ProjectSyntheticNormalSinusEventsInWindowV1(
      schedule,
      startTimeSec,
      endTimeSec,
      sha256,
    );
    const result = runPhaseB1BackwardEulerEventScheduleRunnerV1({
      model: candidate.model,
      wallMaterialBinding: candidate.wallMaterialBinding,
      previousEndpoint: endpoint,
      endTimeSec,
      nominalDtSec,
      orderedEvents: Object.freeze(events.map((event) =>
        event.calciumDriveEvent)),
    });
    if (result.completed === false) {
      const lastAcceptedEvaluation = evaluatePhaseB1EventFreeEndpointV1(
        candidate.model,
        candidate.wallMaterialBinding,
        result.lastAcceptedEndpoint,
      );
      print({
        stage: "cycle-failure",
        cycleIndex,
        failureStage: result.failureStage,
        failureReason: result.failureReason,
        lastAcceptedTimeSec: result.lastAcceptedEndpoint.timeSec,
        elapsedSec: secondsSince(cycleStartedAtMs),
        lastAcceptedDiagnostic: {
          bloodVolumesMl: Object.fromEntries(Object.entries(
            result.lastAcceptedEndpoint.differentialState.bloodVolumesM3,
          ).map(([id, volume]) => [id, volume * 1e6])),
          compartmentPressureMmHg: Object.fromEntries(Object.entries(
            lastAcceptedEvaluation.closedLoop.compartmentAbsolutePressurePa,
          ).map(([id, pressure]) => [id, pressure / 133.322387415])),
          triSegFiberLogStrain: Object.fromEntries(
            (["LVFW", "SEP", "RVFW"] as const).map((wallId) => [
              wallId,
              lastAcceptedEvaluation.closedLoop.triSegGeometry.walls[wallId]
                .fiberLogStrain,
            ]),
          ),
          wallStressKPa: Object.fromEntries(WALL_IDS_FOR_DIAGNOSTIC.map((wallId) => [
            wallId,
            lastAcceptedEvaluation.wallMaterialByWall[wallId]
              .totalWallKirchhoffStressPa / 1000,
          ])),
        },
      });
      process.exitCode = 1;
      return;
    }
    const eventLocalLeftVentricularEndDiastolicPressureAudit =
      buildEventLocalLeftVentricularEndDiastolicPressureAudit({
        cycleIndex,
        cycleStartTimeSec: startTimeSec,
        cycleLengthSec: schedule.cycleLengthSec,
        scheduledEvents: events,
        scheduleRun: result,
        periodicConvergencePass: false,
      });
    const distance = evaluatePhaseB1CompleteEndpointMetricV1({
      referenceEndpoint: endpoint,
      candidateEndpoint: result.finalEndpoint,
      registry: candidate.model.newtonScaleRegistry,
      sha256Hex: sha256,
    });
    const ledger = buildPhaseB1BackwardEulerCommittedIntervalLedgerV1({
      scheduleRun: result,
    });
    const signedMeanFlowM3PerSecByEdge = Object.freeze(Object.fromEntries(
      FOUR_CHAMBER_CLOSED_LOOP_FLOW_IDS_V1.map((flowId) => [
        flowId,
        ledger.integratedEdgeVolumeByFlow[flowId].signedVolumeM3
          / ledger.durationSec,
      ]),
    ));
    const signedMeanFlows = Object.values(signedMeanFlowM3PerSecByEdge);
    const allEdgeMeanFlow = signedMeanFlows.reduce(
      (sum, flow) => sum + flow,
      0,
    ) / signedMeanFlows.length;
    const maximumAllEdgeSignedMeanFlowMismatchFraction = Math.max(
      ...signedMeanFlows.map((flow) => Math.abs(flow - allEdgeMeanFlow)),
    ) / Math.max(
      1e-12,
      Math.abs(allEdgeMeanFlow),
      signedMeanFlows.reduce((sum, flow) => sum + Math.abs(flow), 0)
        / signedMeanFlows.length,
    );
    const everyEdgeSignedMeanFlowForward = signedMeanFlows.every(
      (flow) => flow > 0,
    );
    const streakReferenceBoundaryIndex = Math.max(
      0,
      cycleIndex + 1
        - PHASE_B1_MECHANISTIC_PERIODIC_CONTINUATION_POLICY_V1
          .requiredConsecutivePassingCycleCount,
    );
    const streakWindowDistance = evaluatePhaseB1CompleteEndpointMetricV1({
      referenceEndpoint:
        cycleBoundaryEndpoints[streakReferenceBoundaryIndex],
      candidateEndpoint: result.finalEndpoint,
      registry: candidate.model.newtonScaleRegistry,
      sha256Hex: sha256,
    });
    const cycleInitialEvaluation = evaluatePhaseB1EventFreeEndpointV1(
      candidate.model,
      candidate.wallMaterialBinding,
      result.initialEndpoint,
    );
    const cycleEndLeftLimitEvaluations = Object.freeze(
      result.acceptedTransactions.map((transaction) =>
        transaction.leftLimitStep.nextEvaluation),
    );
    const cycleMetrics =
      evaluatePhaseB1PhysiologyEnvelopeMetricsFromCommittedEvaluationsV1({
        cycleStartTimeSec: result.initialEndpoint.timeSec,
        cycleLengthSec: schedule.cycleLengthSec,
        initialEvaluation: cycleInitialEvaluation,
        acceptedEndLeftLimitEvaluations: cycleEndLeftLimitEvaluations,
        phaseWindows:
          PHASE_B1_PHYSIOLOGY_ENVELOPE_PROTOCOL_V1.fillingPhaseWindows,
        periodEndpointMaximumNormalizedDistance:
          distance.maximumNormalizedDistance,
        normalTargets: targetSet,
      });
    const physiology = Object.freeze({
      leftVentricularEndDiastolicVolumeMl:
        cycleMetrics.volumeByChamber.LV.maximumM3 * 1e6,
      leftVentricularEndSystolicVolumeMl:
        cycleMetrics.volumeByChamber.LV.minimumM3 * 1e6,
      systemicArterialMinimumPressureMmHg:
        cycleMetrics.pressureByCompartment.SA.minimumPa / 133.322387415,
      systemicArterialMaximumPressureMmHg:
        cycleMetrics.pressureByCompartment.SA.maximumPa / 133.322387415,
      systemicArterialMeanPressureMmHg:
        cycleMetrics.pressureByCompartment.SA.timeWeightedMeanPa
          / 133.322387415,
      leftCardiacOutputLPerMin:
        cycleMetrics.circulation.left.signedOutflowCardiacOutputLPerMin,
      rightCardiacOutputLPerMin:
        cycleMetrics.circulation.right.signedOutflowCardiacOutputLPerMin,
      leftRightCardiacOutputMismatchFraction:
        cycleMetrics.circulation.leftRightSignedOutputMismatchFraction,
    });
    const continuationRecord =
      recordPhaseB1MechanisticPeriodicContinuationCycleV1({
        state: periodicContinuation,
        readback: {
          cycleIndex,
          maximumNormalizedEndpointDistance:
            distance.maximumNormalizedDistance,
          streakWindowNormalizedEndpointDistance:
            streakWindowDistance.maximumNormalizedDistance,
          leftCardiacOutputLPerMin: physiology.leftCardiacOutputLPerMin,
          rightCardiacOutputLPerMin: physiology.rightCardiacOutputLPerMin,
          leftVentricularEndDiastolicVolumeMl:
            physiology.leftVentricularEndDiastolicVolumeMl,
          leftVentricularEndSystolicVolumeMl:
            physiology.leftVentricularEndSystolicVolumeMl,
          systemicArterialMinimumPressureMmHg:
            physiology.systemicArterialMinimumPressureMmHg,
          systemicArterialMaximumPressureMmHg:
            physiology.systemicArterialMaximumPressureMmHg,
          systemicArterialMeanPressureMmHg:
            physiology.systemicArterialMeanPressureMmHg,
          maximumAllEdgeSignedMeanFlowMismatchFraction,
          everyEdgeSignedMeanFlowForward,
          committedIntervalTotalBloodVolumeConservationGatePass:
            ledger.committedIntervalTotalBloodVolumeConservationGatePass,
          structuralAndNumericalIntervalLedgerGatesPass:
            ledger.structuralAndNumericalIntervalLedgerGatesPass,
        },
      });
    periodicContinuation = continuationRecord.state;
    const mechanicalEnergyDiagnostic =
      summarizeCommittedCycleMechanicalEnergy(result);
    const summary = Object.freeze({
      cycleIndex,
      startTimeSec,
      endTimeSec,
      elapsedSec: secondsSince(cycleStartedAtMs),
      maximumNormalizedEndpointDistance: distance.maximumNormalizedDistance,
      maximizingScalarLabel: distance.maximizingScalarLabel,
      maximumRelativeTotalBloodVolumeDrift:
        ledger.maximumRelativeTotalBloodVolumeDrift,
      acceptedTransactionCount: result.acceptedTransactionCount,
      solverRetrySubdivisionCount: result.solverRetrySubdivisionCount,
      maximumRetryDepthUsed: result.maximumRetryDepthUsed,
      signedMeanFlowM3PerSecByEdge,
      physiology,
      mechanicalEnergyDiagnostic,
      eventLocalLeftVentricularEndDiastolicPressureAudit,
      periodicContinuationCheckpoint: continuationRecord.checkpoint,
    });
    cycleSummaries.push(summary);
    print({ stage: "cycle-complete", ...summary });
    endpoint = result.finalEndpoint;
    cycleBoundaryEndpoints.push(endpoint);
    lastRun = result;
    lastPeriodDistance = distance.maximumNormalizedDistance;
    if (periodicContinuation.terminalStatus !== "running") break;
  }
  if (lastRun === null || lastPeriodDistance === null) {
    throw new Error("mechanistic-rebuild runner completed no cycles");
  }

  const initialEvaluation = evaluatePhaseB1EventFreeEndpointV1(
    candidate.model,
    candidate.wallMaterialBinding,
    lastRun.initialEndpoint,
  );
  const acceptedEndLeftLimitEvaluations = Object.freeze(
    lastRun.acceptedTransactions.map((transaction) =>
      transaction.leftLimitStep.nextEvaluation),
  );
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
  const repeatedCycleFixedPointConvergencePass =
    periodicContinuation.repeatedCycleFixedPointConvergencePass;
  const formalPeriodicConvergencePass = formalPeriodicProtocol
    && repeatedCycleFixedPointConvergencePass;
  const atrialPvReservoirConduitReadback =
    buildPhaseB1AtrialPvReservoirConduitReadbackV1({
      trace: atrialPvReadbackTraceFromCommittedTerminalCycle(
        schedule.cycleLengthSec,
        samples,
      ),
      formalPeriodOneConvergencePass: formalPeriodicConvergencePass,
      sha256Hex: sha256,
    });
  const eventLocalLeftVentricularEndDiastolicPressureAudit =
    applyPeriodicConvergenceGateToEventLocalLvedpAudit(
      cycleSummaries.at(-1)!
        .eventLocalLeftVentricularEndDiastolicPressureAudit,
      formalPeriodicConvergencePass,
    );
  const stageOneGlobalHemodynamicsScreenEligibilityPass =
    formalPeriodicConvergencePass
    && metrics.normalTargetGate.inputEligibilityPass
    && eventLocalLeftVentricularEndDiastolicPressureAudit
      .gate.periodicConvergenceEligibilityPass;
  const stageOneGlobalHemodynamicsScreenPass =
    stageOneGlobalHemodynamicsScreenEligibilityPass
    && metrics.normalTargetGate.pass
    && eventLocalLeftVentricularEndDiastolicPressureAudit.gate.pass === true;
  const generatedAt = new Date().toISOString();
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
      "exact attached source files plus authenticated parent evidence; not whole-repository source closure" as const,
  });
  const claimBoundary = Object.freeze({
    physiologyEnvelopeExplorationOnly: true,
    patientFit: false,
    normalHumanCalibrationAchieved: false,
    atrialActiveAmplitudeAnchoredToPrimaryHumanLaForceScale: true,
    atrialLandKineticsExperimentallyIdentified: false,
    rightAtrialActiveForceScaleDirectlyMeasured: false,
    measuredCalciumWaveformUsed: false,
    reconstructedVentricularCalciumAppliedInCanonicalV4: false,
    reconstructedVentricularCalciumAvailableOnlyAsNamedV5Ablation: true,
    moyerTmaxUsedAsLandTref: false,
    chamberSpecificActiveGainUsed: false,
    atrialPvMorphologyAcceptance: false,
    runtimeAdoption: false,
    releaseRuntimeReachable: false,
    exploratoryTimeStep: !formalPeriodicProtocol,
    periodicOrbitContinuationMethod:
      PHASE_B1_MECHANISTIC_PERIODIC_CONTINUATION_POLICY_V1.algorithm,
    minimumWarmupCycleCount:
      PHASE_B1_MECHANISTIC_PERIODIC_CONTINUATION_POLICY_V1
        .minimumWarmupCycleCount,
    requiredConsecutivePassingCycleCount:
      PHASE_B1_MECHANISTIC_PERIODIC_CONTINUATION_POLICY_V1
        .requiredConsecutivePassingCycleCount,
    completeStateEndpointDistanceTolerance:
      PHASE_B1_MECHANISTIC_PERIODIC_CONTINUATION_POLICY_V1
        .completeStateEndpointDistanceTolerance,
    streakWindowEndpointDistanceTolerance:
      PHASE_B1_MECHANISTIC_PERIODIC_CONTINUATION_POLICY_V1
        .streakWindowEndpointDistanceTolerance,
    maximumLeftRightCardiacOutputMismatchFraction:
      PHASE_B1_MECHANISTIC_PERIODIC_CONTINUATION_POLICY_V1
        .maximumLeftRightCardiacOutputMismatchFraction,
    maximumAllEdgeSignedMeanFlowMismatchFraction:
      PHASE_B1_MECHANISTIC_PERIODIC_CONTINUATION_POLICY_V1
        .maximumAllEdgeSignedMeanFlowMismatchFraction,
    committedIntervalStructuralAndNumericalLedgerRequired: true,
    repeatedCycleFixedPointConvergencePass,
    singleCycleMayEstablishPeriodicOrbit: false,
    fullHighDimensionalNewtonShootingUsed: false,
    futureShootingBoundary:
      PHASE_B1_MECHANISTIC_PERIODIC_CONTINUATION_POLICY_V1
        .futureShootingBoundary,
    formalPeriodicEvidenceEligible: formalPeriodicProtocol,
    formalPeriodicConvergencePass,
    eventLocalLvedpGateRequiresFormalPeriodicConvergence: true,
    eventLocalLvedpSampleUsesCommittedEventLeftLimit: true,
    eventLocalLvedpMaximumVolumeSubstitutionAllowed: false,
    stageOneGlobalHemodynamicsScreenIsProspectiveOnly: true,
    physiologyBandClassificationRequiresFormalPeriodOne: true,
    physiologyBandClassificationRequiresRepeatedCycleFixedPoint: true,
    stageOneGlobalHemodynamicsScreenEligibilityPass:
      stageOneGlobalHemodynamicsScreenEligibilityPass,
    completePhysiologyEnvelopeGateImplemented: false,
    physiologicalValidationPass: false,
    atrialPvLoopHeldOutFromSelection: true,
    settlingCyclesExcludedFromValidation: true,
  });
  const reportPayload = {
    runnerId: RUNNER_ID,
    generatedAt,
    config: {
      nominalDtSec,
      maximumCycles,
      formalPeriodicProtocol,
      periodicContinuationPolicy:
        PHASE_B1_MECHANISTIC_PERIODIC_CONTINUATION_POLICY_V1,
    },
    provenance: {
      configurationContentSha256: candidate.configurationContentSha256,
      sourceManifestContentSha256: manifest.contentSha256,
      sourceNumericalEvidenceContentSha256:
        numerical.certificate.contentSha256,
      scheduleContentSha256: schedule.contentSha256,
      wallMaterialBindingContentSha256:
        candidate.wallMaterialBinding.contentSha256,
      newtonRegistryContentSha256:
        candidate.model.newtonScaleRegistry.registryContentSha256,
      atrialPvReservoirConduitReadbackContentSha256:
        atrialPvReservoirConduitReadback.contentSha256,
      atrialPvReservoirConduitSourceTraceContentSha256:
        atrialPvReservoirConduitReadback.sourceTraceContentSha256,
    },
    constructionAudit: candidate.audit,
    activeTissueClassPrior: candidate.activeTissueClassPrior,
    initializationAudit: candidate.initialization.audit,
    scheduleAudit: {
      scheduleCandidateCalciumTimingParityPass,
      scheduleCandidateCalciumShapeEvidenceParityPass,
      scheduleShapeEvidenceOwnsEventTiming: false as const,
      scheduleTimingUsesOnlyElectricalToCalciumDelay: true as const,
      initialCycleCalciumDriveOffsetSecByWall,
      constructionSeedImmediatelyBeforeEitherAtrialCalciumDrive: false,
      constructionSeedToRightAtrialCalciumDriveSec:
        initialCycleCalciumDriveOffsetSecByWall.RA,
      constructionSeedToLeftAtrialCalciumDriveSec:
        initialCycleCalciumDriveOffsetSecByWall.LA,
    },
    eventLocalLeftVentricularEndDiastolicPressureAudit,
    ventricularMechanics: candidate.ventricularMechanics,
    sourceCodeEvidence,
    cycleSummaries,
    terminal: {
      completedCycleCount: cycleSummaries.length,
      periodicContinuationStatus: periodicContinuation.terminalStatus,
      repeatedCycleFixedPointConvergencePass,
      normalCandidatePeriodicOrbitEligibilityPass:
        formalPeriodicConvergencePass,
      normalCandidateIneligibilityFailClosed:
        !formalPeriodicConvergencePass,
      maximumCycleExhaustionMeansConvergence: false as const,
      nonConvergenceFailClosed: !repeatedCycleFixedPointConvergencePass,
      formalPeriodicStatus:
        formalPeriodicProtocol
          ? periodicContinuation.terminalStatus
          : "not-eligible-exploratory-time-step" as const,
      formalPeriodicConvergencePass,
      eventLocalLvedpGateApplied:
        eventLocalLeftVentricularEndDiastolicPressureAudit.gate.applied,
      eventLocalLvedpGatePass:
        eventLocalLeftVentricularEndDiastolicPressureAudit.gate.pass,
      stageOneGlobalHemodynamicsScreenEligibilityPass:
        stageOneGlobalHemodynamicsScreenEligibilityPass,
      stageOneGlobalHemodynamicsScreenPass:
        stageOneGlobalHemodynamicsScreenPass,
      completePhysiologyEnvelopeGateImplemented: false as const,
      physiologicalValidationPass: false as const,
    },
    metrics,
    atrialPvReservoirConduitReadback,
    claimBoundary,
  };
  const report = Object.freeze({
    ...reportPayload,
    contentSha256: computeCanonicalSha256(reportPayload, sha256),
  });
  const waveformPayload = {
    waveformId: "phase-b1-mechanistic-rebuild-v2-terminal-cycle-waveform",
    generatedAt,
    cycleIndex: cycleSummaries.at(-1)!.cycleIndex,
    cycleStartTimeSec: lastRun.initialEndpoint.timeSec,
    cycleLengthSec: schedule.cycleLengthSec,
    nominalDtSec,
    compartmentIds: BLOOD_COMPARTMENT_IDS,
    flowIds: FOUR_CHAMBER_CLOSED_LOOP_FLOW_IDS_V1,
    samples,
    claimBoundary,
    sourceReportContentSha256: report.contentSha256,
  };
  const waveform = Object.freeze({
    ...waveformPayload,
    contentSha256: computeCanonicalSha256(waveformPayload, sha256),
  });
  writeJson(reportPath, report);
  writeJson(waveformPath, waveform);
  print({
    stage: repeatedCycleFixedPointConvergencePass
      ? "complete-periodic-fixed-point"
      : "failed-periodic-fixed-point-exhausted",
    elapsedSec: secondsSince(startedAtMs),
    reportPath,
    waveformPath,
    completedCycleCount: cycleSummaries.length,
    maximumNormalizedEndpointDistance: lastPeriodDistance,
    periodicContinuationStatus: periodicContinuation.terminalStatus,
    repeatedCycleFixedPointConvergencePass,
    formalPeriodicConvergencePass,
    stageOneGlobalHemodynamicsScreenEligibilityPass,
    stageOneGlobalHemodynamicsScreenPass,
    eventLocalLeftVentricularEndDiastolicPressureMmHg:
      eventLocalLeftVentricularEndDiastolicPressureAudit
        .observation.leftVentricularPressureMmHg,
    eventLocalLeftVentricularEndDiastolicVolumeMl:
      eventLocalLeftVentricularEndDiastolicPressureAudit
        .observation.leftVentricularVolumeMl,
    eventLocalLvedpGateApplied:
      eventLocalLeftVentricularEndDiastolicPressureAudit.gate.applied,
    eventLocalLvedpGatePass:
      eventLocalLeftVentricularEndDiastolicPressureAudit.gate.pass,
    metrics: {
      leftCardiacOutputLPerMin:
        metrics.circulation.left.signedOutflowCardiacOutputLPerMin,
      rightCardiacOutputLPerMin:
        metrics.circulation.right.signedOutflowCardiacOutputLPerMin,
      meanSystemicArterialPressureMmHg:
        metrics.pressureByCompartment.SA.timeWeightedMeanPa / 133.322387415,
      leftVentricularEndDiastolicVolumeMl:
        metrics.volumeByChamber.LV.maximumM3 * 1e6,
      leftVentricularEndSystolicVolumeMl:
        metrics.volumeByChamber.LV.minimumM3 * 1e6,
      leftVentricularEjectionFraction:
        metrics.volumeByChamber.LV.ejectionFractionFromExtrema,
      leftAtrialMeanPressureMmHg:
        metrics.pressureByCompartment.LA.timeWeightedMeanPa / 133.322387415,
    },
  });
  if (!repeatedCycleFixedPointConvergencePass) process.exitCode = 1;
}

function atrialPvReadbackTraceFromCommittedTerminalCycle(
  cycleLengthSec: number,
  samples: readonly Readonly<{
    phaseSec: number;
    bloodVolumesM3: Readonly<Partial<Record<string, number>>>;
    compartmentAbsolutePressurePa: Readonly<Record<string, number>>;
    allFlowsM3PerSec: Readonly<Record<string, number>>;
  }>[],
): PhaseB1AtrialPvReadbackTraceV1 {
  return Object.freeze({
    cycleLengthSec,
    samples: Object.freeze(samples.map((sample, index) => Object.freeze({
      phaseSec: canonicalAtrialPvReadbackEndpointPhase(
        requireFiniteDiagnosticValue(
          sample.phaseSec,
          `terminal samples[${index}].phaseSec`,
        ),
        index,
        samples.length,
        cycleLengthSec,
      ),
      bloodVolumesM3: Object.freeze({
        LA: requireFiniteDiagnosticValue(
          sample.bloodVolumesM3.LA,
          `terminal samples[${index}].bloodVolumesM3.LA`,
        ),
        RA: requireFiniteDiagnosticValue(
          sample.bloodVolumesM3.RA,
          `terminal samples[${index}].bloodVolumesM3.RA`,
        ),
      }),
      pressuresPa: Object.freeze({
        LA: requireFiniteDiagnosticValue(
          sample.compartmentAbsolutePressurePa.LA,
          `terminal samples[${index}].compartmentAbsolutePressurePa.LA`,
        ),
        RA: requireFiniteDiagnosticValue(
          sample.compartmentAbsolutePressurePa.RA,
          `terminal samples[${index}].compartmentAbsolutePressurePa.RA`,
        ),
      }),
      allFlowsM3PerSec: Object.freeze({
        Q_MV: requireFiniteDiagnosticValue(
          sample.allFlowsM3PerSec.Q_MV,
          `terminal samples[${index}].allFlowsM3PerSec.Q_MV`,
        ),
        Q_TV: requireFiniteDiagnosticValue(
          sample.allFlowsM3PerSec.Q_TV,
          `terminal samples[${index}].allFlowsM3PerSec.Q_TV`,
        ),
      }),
    }))),
  });
}

function canonicalAtrialPvReadbackEndpointPhase(
  phaseSec: number,
  sampleIndex: number,
  sampleCount: number,
  cycleLengthSec: number,
): number {
  const endpoint = sampleIndex === 0
    ? 0
    : sampleIndex === sampleCount - 1
      ? cycleLengthSec
      : null;
  if (endpoint === null) return phaseSec;
  const scale = Math.max(1, Math.abs(phaseSec), Math.abs(endpoint));
  if (Math.abs(phaseSec - endpoint) > 64 * Number.EPSILON * scale) {
    throw new Error(
      `terminal atrial PV endpoint phase ${phaseSec} does not match ${endpoint}`,
    );
  }
  return endpoint;
}

function requireFiniteDiagnosticValue(
  value: number | undefined,
  field: string,
): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${field} must be finite for atrial PV readback`);
  }
  return value;
}

/**
 * Measures the LV pressure/volume at the committed t- state immediately before
 * the earliest ventricular calcium-drive event in one beat.  This deliberately
 * does not search for maximum LV volume: the event transaction already owns an
 * exact left-limit state at the declared activation time, so interpolation or
 * an extrema-based surrogate would discard stronger provenance.
 */
export function buildEventLocalLeftVentricularEndDiastolicPressureAudit(input: Readonly<{
  cycleIndex: number;
  cycleStartTimeSec: number;
  cycleLengthSec: number;
  scheduledEvents: readonly PhaseB1ProjectSyntheticNormalSinusScheduledEventV1[];
  scheduleRun: PhaseB1BackwardEulerEventScheduleRunnerSuccessV1;
  periodicConvergencePass: boolean;
}>) {
  const ventricularEvents = input.scheduledEvents.filter((event) =>
    VENTRICULAR_WALL_IDS_FOR_EVENT_LOCAL_LVEDP.includes(
      event.wallId as typeof VENTRICULAR_WALL_IDS_FOR_EVENT_LOCAL_LVEDP[number],
    ));
  if (ventricularEvents.length === 0) {
    throw new Error(
      `cycle ${input.cycleIndex} has no scheduled ventricular calcium event`,
    );
  }
  const earliestEventTimeSec = Math.min(...ventricularEvents.map((event) =>
    event.calciumDriveEvent.calciumDriveTimeSec));
  const firstVentricularEvents = ventricularEvents.filter((event) =>
    Object.is(
      event.calciumDriveEvent.calciumDriveTimeSec,
      earliestEventTimeSec,
    ));
  if (firstVentricularEvents.length !== 1) {
    throw new Error(
      `cycle ${input.cycleIndex} requires exactly one first ventricular calcium event`,
    );
  }
  const scheduledEvent = firstVentricularEvents[0]!;
  const matchingTransactions = input.scheduleRun.acceptedTransactions
    .map((transaction, acceptedTransactionIndex) => ({
      transaction,
      acceptedTransactionIndex,
    }))
    .filter(({ transaction }) =>
      transaction.coordinator.eventKeys.includes(scheduledEvent.eventKey));
  if (matchingTransactions.length !== 1) {
    throw new Error(
      `cycle ${input.cycleIndex} first ventricular event must occur in exactly one committed transaction`,
    );
  }
  const { transaction, acceptedTransactionIndex } = matchingTransactions[0]!;
  const leftLimitStep = transaction.leftLimitStep;
  const leftLimitEndpoint = leftLimitStep.nextEndpointLeftLimit;
  const leftLimitEvaluation = leftLimitStep.nextEvaluation;
  const calciumDriveTimeSec = scheduledEvent.calciumDriveEvent.calciumDriveTimeSec;
  const committedEventLeftLimitProvenancePass =
    transaction.coordinator.eventBatchCommitted
    && transaction.coordinator.eventCountByWall[scheduledEvent.wallId] === 1
    && transaction.coordinator.eventKeys.includes(scheduledEvent.eventKey)
    && Object.is(transaction.coordinator.endTimeSec, calciumDriveTimeSec)
    && Object.is(leftLimitEndpoint.timeSec, calciumDriveTimeSec)
    && Object.is(leftLimitEvaluation.endpoint.timeSec, leftLimitEndpoint.timeSec)
    && Object.is(transaction.nextEndpoint.timeSec, calciumDriveTimeSec);
  if (!committedEventLeftLimitProvenancePass) {
    throw new Error(
      `cycle ${input.cycleIndex} first ventricular event lacks an exact committed left limit`,
    );
  }

  const targetBand = NORMAL_ADULT_TARGET_PACK_V1.targets.globalHemodynamics
    .leftVentricularEndDiastolicPressureMmHg;
  const [lowerInclusiveMmHg, upperInclusiveMmHg] = targetBand.broadRange;
  const leftVentricularPressurePa =
    leftLimitEvaluation.closedLoop.compartmentAbsolutePressurePa.LV;
  const leftVentricularPressureMmHg = leftVentricularPressurePa / PA_PER_MMHG;
  const leftVentricularVolumeM3 =
    leftLimitEndpoint.differentialState.bloodVolumesM3.LV;
  const leftVentricularVolumeMl = leftVentricularVolumeM3 * 1e6;
  const withinTargetBand = leftVentricularPressureMmHg >= lowerInclusiveMmHg
    && leftVentricularPressureMmHg <= upperInclusiveMmHg;
  const gateApplied = input.periodicConvergencePass;

  return Object.freeze({
    auditId: EVENT_LOCAL_LVEDP_AUDIT_ID,
    measurementDefinition:
      "LV pressure and volume at the committed left limit immediately before the earliest ventricular calcium-drive event in the analyzed beat" as const,
    physiologicalInterpretation:
      "event-local pre-ventricular-activation LVEDP readback; not a maximum-volume pressure and not a valve-event substitute" as const,
    sampleSource:
      "committed-event-transaction-left-limit-evaluation" as const,
    continuitySide: "left-limit-before-calcium-jump" as const,
    interpolationApplied: false as const,
    maximumVolumeSampleUsed: false as const,
    cycleIndex: input.cycleIndex,
    cycleStartTimeSec: input.cycleStartTimeSec,
    cycleLengthSec: input.cycleLengthSec,
    cyclePhaseSec: calciumDriveTimeSec - input.cycleStartTimeSec,
    event: Object.freeze({
      eventKey: scheduledEvent.eventKey,
      eventId: scheduledEvent.calciumDriveEvent.eventId,
      eventOwnerWallId: scheduledEvent.wallId,
      tissueClass: scheduledEvent.tissueClass,
      timingOwner: scheduledEvent.calciumDriveEvent.timingOwner,
      electricalTimeSec: scheduledEvent.electricalEvent.electricalTimeSec,
      calciumDriveTimeSec,
      electricalOffsetWithinCycleSec:
        scheduledEvent.electricalOffsetWithinCycleSec,
      calciumDriveOffsetWithinCycleSec:
        scheduledEvent.calciumDriveOffsetWithinCycleSec,
    }),
    committedTransaction: Object.freeze({
      acceptedTransactionIndex,
      previousEndpointTimeSec: transaction.previousEndpoint.timeSec,
      leftLimitEndpointTimeSec: leftLimitEndpoint.timeSec,
      committedPostEventEndpointTimeSec: transaction.nextEndpoint.timeSec,
      coordinatorEventBatchMode: transaction.coordinator.eventBatchMode,
      coordinatorEventKeys: Object.freeze([...transaction.coordinator.eventKeys]),
      coordinatorEventCount: transaction.coordinator.eventCount,
      eventBatchCommitted: transaction.coordinator.eventBatchCommitted,
      committedEventLeftLimitProvenancePass,
    }),
    observation: Object.freeze({
      leftVentricularPressurePa,
      leftVentricularPressureMmHg,
      leftVentricularVolumeM3,
      leftVentricularVolumeMl,
    }),
    target: Object.freeze({
      targetPackId: NORMAL_ADULT_TARGET_PACK_V1.packId,
      targetPath:
        "targets.globalHemodynamics.leftVentricularEndDiastolicPressureMmHg" as const,
      unit: targetBand.unit,
      lowerInclusiveMmHg,
      upperInclusiveMmHg,
      preferredCenterMmHg: targetBand.preferredCenter,
      gateRole: targetBand.gateRole,
      sourceIds: Object.freeze([...targetBand.sourceIds]),
      measurementCaveats: Object.freeze([...targetBand.measurementCaveats]),
      withinTargetBand,
    }),
    gate: Object.freeze({
      requiresFormalPeriodicConvergence: true as const,
      periodicConvergenceEligibilityPass: gateApplied,
      applied: gateApplied,
      pass: gateApplied ? withinTargetBand : null,
      nonPeriodicReadbackIsDiagnosticOnly: !gateApplied,
    }),
  });
}

export function applyPeriodicConvergenceGateToEventLocalLvedpAudit(
  audit: ReturnType<
    typeof buildEventLocalLeftVentricularEndDiastolicPressureAudit
  >,
  formalPeriodicConvergencePass: boolean,
): ReturnType<typeof buildEventLocalLeftVentricularEndDiastolicPressureAudit> {
  return Object.freeze({
    ...audit,
    gate: Object.freeze({
      requiresFormalPeriodicConvergence: true as const,
      periodicConvergenceEligibilityPass: formalPeriodicConvergencePass,
      applied: formalPeriodicConvergencePass,
      pass: formalPeriodicConvergencePass
        ? audit.target.withinTargetBand
        : null,
      nonPeriodicReadbackIsDiagnosticOnly: !formalPeriodicConvergencePass,
    }),
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

function summarizeCommittedCycleMechanicalEnergy(
  run: PhaseB1BackwardEulerEventScheduleRunnerSuccessV1,
) {
  const entries = run.acceptedTransactions.map((transaction) => Object.freeze({
    durationSec: transaction.actualCommittedDurationSec,
    snapshot: transaction.mechanicalEnergyStageSnapshot,
  }));
  const first = entries[0].snapshot;
  const last = entries[entries.length - 1].snapshot;
  const integrate = (select: (snapshot: typeof first) => number) =>
    entries.reduce((sum, entry) =>
      sum + entry.durationSec * select(entry.snapshot), 0);
  const integratedSignedStageResidualJ = integrate(
    (snapshot) => snapshot.stage.continuousMechanicalEnergyResidualW,
  );
  const integratedStageNormalizationDenominatorJ = integrate(
    (snapshot) => snapshot.stage.normalizationDenominatorW,
  );
  const initialStoredEnergyJ = first.endpointStoredEnergy.previous.totalJ;
  const finalStoredEnergyJ = last.endpointStoredEnergy.nextLeftLimit.totalJ;
  const directStoredEnergyDeltaJ = finalStoredEnergyJ - initialStoredEnergyJ;
  return Object.freeze({
    scheme: "backward-Euler-endpoint-stage" as const,
    diagnosticOnlyAtCurrentTimeStep: true as const,
    transactionCount: entries.length,
    initialStoredEnergyJ,
    finalStoredEnergyJ,
    directStoredEnergyDeltaJ,
    integratedFlowDissipationJ: integrate(
      (snapshot) => snapshot.dissipationByBranchW.flowTotal,
    ),
    integratedSlsDissipationJ: integrate(
      (snapshot) => snapshot.dissipationByBranchW.sls,
    ),
    integratedActiveMechanicalOutputJ: integrate(
      (snapshot) => snapshot.stage.activeMechanicalOutputPowerW,
    ),
    integratedPrescribedExternalEnvironmentWorkJ: integrate(
      (snapshot) => snapshot.prescribedExternalEnvironmentPowerW,
    ),
    integratedTriSegBendingStoredEnergyRateJ: integrate(
      (snapshot) => snapshot.triSegGeometryPowerAccounting
        .triSegBendingStoredEnergyRateW,
    ),
    integratedSignedStageResidualJ,
    integratedStageNormalizationDenominatorJ,
    normalizedIntegratedSignedStageResidual: Math.abs(
      integratedSignedStageResidualJ,
    ) / Math.max(1e-12, integratedStageNormalizationDenominatorJ),
    maximumStageNormalizedResidual: Math.max(
      ...entries.map((entry) => entry.snapshot.stage.normalizedResidual),
    ),
    everyStageCorrectedLedgerAccepted: entries.every(
      (entry) => entry.snapshot.correctedStageLedgerAccepted,
    ),
    everyLandAdapterWorkClosureAccepted: entries.every(
      (entry) => entry.snapshot.landAdapterWorkClosure.accepted,
    ),
    everyTriSegGeometryWorkConjugacyAccepted: entries.every(
      (entry) => entry.snapshot.triSegGeometryPowerAccounting
        .workConjugacyAccepted,
    ),
    maximumTriSegNormalizedWorkConjugacyResidual: Math.max(
      ...entries.map((entry) => entry.snapshot.triSegGeometryPowerAccounting
        .normalizedWorkConjugacyResidual),
    ),
    energyConjugateFiniteThicknessStageCount: entries.filter(
      (entry) => entry.snapshot.triSegGeometryPowerAccounting.runtimeAssembly
        === "energy-conjugate-finite-thickness-triseg-v2",
    ).length,
    negativeFlowDissipationObserved: entries.some(
      (entry) => entry.snapshot.dissipationByBranchW.flowTotal < 0,
    ),
    negativeSlsDissipationObserved: entries.some(
      (entry) => entry.snapshot.dissipationByBranchW.sls < 0,
    ),
    officialCommittedCycleEnergyAcceptanceClaimed: false as const,
  });
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
