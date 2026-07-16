import { createHash, randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import {
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  MAIN_WIRE_NON_CORONARY_ALL_FLOW_NAMES_V1,
} from "@/engine/myocardium/fourChamberV1/hydromechanics/mainWireNonCoronarySameTimeLevelV1";
import {
  applyExactCalciumDriveEventV1,
  evaluateExactEventCalciumV1,
} from "@/engine/myocardium/fourChamberV1/calcium/exactEventPrescribedCalciumV1";
import {
  MAIN_WIRE_NON_CORONARY_CIRCULATION_NODE_NAMES_V1,
  mainWireDefaultHemodynamicRuntimeControlsV1,
  type MainWireNonCoronaryCirculationNodeNameV1,
} from "@/engine/core/mainWireHemodynamicGraphV1";
import {
  computeCanonicalSha256,
  type CanonicalSha256HexProvider,
} from "@/engine/myocardium/fourChamberV1/manifests/canonicalJson";
import {
  buildPhaseB1QuiescentReferenceEvidenceManifestV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1QuiescentReferenceEvidenceManifestV1";
import {
  buildPhaseB1QuiescentReferenceNumericalEvidenceV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1QuiescentReferenceNumericalEvidenceV1";
import {
  buildPhaseB1MechanisticRebuildCaseV2,
  type PhaseB1AtrialLandKinematicClosureV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1MechanisticRebuildCaseV2";
import {
  buildPhaseB1PhysiologyEnvelopeCenterOverlayV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1PhysiologyEnvelopeProtocolV1";
import {
  buildPhaseB1MainWireDistributedStoredLabelsV1,
  createPhaseB1MainWireDistributedEndpointV1,
  encodePhaseB1MainWireDistributedStoredStateV1,
  transformPhaseB1EndpointToMainWireDistributedV1,
  type PhaseB1MainWireDistributedEndpointV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1MainWireDistributedEndpointV1";
import {
  createPhaseB1MainWireDistributedResearchModelV1,
  evaluatePhaseB1MainWireDistributedEndpointV1,
  stepPhaseB1MainWireDistributedMonolithicBackwardEulerV1,
  type PhaseB1MainWireDistributedEndpointEvaluationV1,
  type PhaseB1MainWireDistributedResearchModelV1,
  type PhaseB1MainWireDistributedStepFailureV1,
  type PhaseB1MainWireDistributedStepSuccessV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1MainWireDistributedMonolithicBackwardEulerV1";
import {
  buildPhaseB1ProjectSyntheticNormalSinusEventScheduleV1,
  generatePhaseB1ProjectSyntheticNormalSinusEventsInWindowV1,
  type PhaseB1ProjectSyntheticNormalSinusScheduledEventV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1ProjectSyntheticNormalSinusEventScheduleV1";
import type {
  PhaseB1WallMaterialBindingV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1WallMaterialBindingV1";
import {
  WALL_IDS,
  type FourChamberWallId,
} from "@/engine/myocardium/fourChamberV1/topology/contracts";
import {
  initializeMainWireNonCoronaryVascularStateV1,
} from "@/engine/myocardium/fourChamberV1/vascular/mainWireNonCoronaryVascularInitializerV1";
import {
  buildPhaseB1AtrialPvReservoirConduitReadbackV1,
  validatePhaseB1AtrialPvReservoirConduitReadbackV1,
  type PhaseB1AtrialPvReadbackTraceV1,
  type PhaseB1AtrialPvReservoirConduitReadbackV1,
} from "@/tools/myocardium/phaseB1AtrialPvReservoirConduitReadbackV1";

export const PHASE_B1_MAIN_WIRE_DISTRIBUTED_RUNNER_V1_ID =
  "phase-b1-main-wire-distributed-exploratory-repeated-cycle-v1" as const;
export const PHASE_B1_MAIN_WIRE_DISTRIBUTED_WAVEFORM_V1_ID =
  "phase-b1-main-wire-distributed-terminal-cycle-waveform-v1" as const;
export const PHASE_B1_MAIN_WIRE_DISTRIBUTED_REPORT_V1_ID =
  "phase-b1-main-wire-distributed-exploratory-report-v1" as const;

const DEFAULT_REPORT_PATH =
  "data/myocardium/reports/phase-b1-main-wire-distributed-exploratory-v1.json";
const DEFAULT_WAVEFORM_PATH =
  "data/myocardium/visuals/phase-b1-main-wire-distributed-exploratory-v1.waveform.json";
const PA_PER_MMHG = 133.322387415;

export const PHASE_B1_MAIN_WIRE_DISTRIBUTED_DIRECT_NUMERICAL_OWNER_PATHS_V1 =
  Object.freeze({
    coreTopology: "engine/core/topology.ts",
    coreParams: "engine/core/params.ts",
    graphResolver: "engine/core/mainWireHemodynamicGraphV1.ts",
    vascularTopologyAdapter:
      "engine/myocardium/fourChamberV1/vascular/mainWireNonCoronaryVascularTopologyV1.ts",
    vascularPvLaw:
      "engine/myocardium/fourChamberV1/vascular/mainWireVascularPvLawSiV1.ts",
    sameTimeCirculationKernel:
      "engine/myocardium/fourChamberV1/hydromechanics/mainWireNonCoronarySameTimeLevelV1.ts",
    dynamicValveAperture:
      "engine/myocardium/fourChamberV1/hydromechanics/mainWireDynamicValveApertureV1.ts",
    vascularInitializer:
      "engine/myocardium/fourChamberV1/vascular/mainWireNonCoronaryVascularInitializerV1.ts",
    distributedEndpoint:
      "engine/myocardium/fourChamberV1/phaseB1/phaseB1MainWireDistributedEndpointV1.ts",
    distributedSolver:
      "engine/myocardium/fourChamberV1/phaseB1/phaseB1MainWireDistributedMonolithicBackwardEulerV1.ts",
    runner: "tools/myocardium/runPhaseB1MainWireDistributedV1.ts",
  } as const);

export type PhaseB1MainWireDistributedDirectNumericalOwnerSnapshotV1 =
  Readonly<Record<
    keyof typeof PHASE_B1_MAIN_WIRE_DISTRIBUTED_DIRECT_NUMERICAL_OWNER_PATHS_V1,
    Readonly<{ relativePath: string; contentSha256: string }>
  >>;

export type PhaseB1MainWireDistributedChamberPvClosedPolygonDiagnosticV1 =
  Readonly<{
    observedOpenPathIntegralPdvPaM3: number;
    closingChordContributionPdvPaM3: number;
    closedPolygonIntegralPdvPaM3: number;
    signedShoelaceAreaPaM3: number;
    absoluteShoelaceAreaPaM3: number;
    closingChordApplied: true;
    formalPeriodOne: false;
    physiologicalLoopWorkClaimed: false;
  }>;

export type PhaseB1MainWireDistributedWaveformSampleV1 = Readonly<{
  absoluteTimeSec: number;
  phaseSec: number;
  bloodVolumesM3: Readonly<
    Record<MainWireNonCoronaryCirculationNodeNameV1, number>
  >;
  absolutePressurePaByNode: Readonly<
    Record<MainWireNonCoronaryCirculationNodeNameV1, number>
  >;
  allFlowsM3PerSec: Readonly<
    Record<(typeof MAIN_WIRE_NON_CORONARY_ALL_FLOW_NAMES_V1)[number], number>
  >;
}>;

export type PhaseB1MainWireDistributedEndpointDistanceV1 = Readonly<{
  maximumNormalizedDistance: number;
  maximizingScalarLabel: string;
  rootMeanSquareNormalizedDistance: number;
  scalarCount: number;
  timeExcluded: true;
}>;

export type PhaseB1MainWireDistributedEventAuditV1 = Readonly<{
  eventKeys: readonly string[];
  eventCount: number;
  eventCountByWall: Readonly<Record<FourChamberWallId, number>>;
  maximumAbsoluteFreeCalciumJumpUM: number;
  freeCalciumContinuityToleranceUM: number;
  freeCalciumContinuityPass: true;
  nonCalciumDifferentialStateChanged: false;
  triSegCoordinatesChanged: false;
}>;

export type PhaseB1MainWireDistributedAcceptedIntervalV1 = Readonly<{
  startTimeSec: number;
  endTimeSec: number;
  durationSec: number;
  retryDepth: number;
  binaryPath: string;
  step: PhaseB1MainWireDistributedStepSuccessV1;
  endpointAfterEvents: PhaseB1MainWireDistributedEndpointV1;
  endpointEvaluationAfterEvents: PhaseB1MainWireDistributedEndpointEvaluationV1;
  eventAudit: PhaseB1MainWireDistributedEventAuditV1;
}>;

export type PhaseB1MainWireDistributedCycleRunSuccessV1 = Readonly<{
  completed: true;
  initialEndpoint: PhaseB1MainWireDistributedEndpointV1;
  finalEndpoint: PhaseB1MainWireDistributedEndpointV1;
  acceptedIntervals: readonly PhaseB1MainWireDistributedAcceptedIntervalV1[];
  samples: readonly PhaseB1MainWireDistributedWaveformSampleV1[];
  requestedSegmentCount: number;
  acceptedIntervalCount: number;
  solverRetrySubdivisionCount: number;
  maximumRetryDepthUsed: number;
  acceptedTimeStepSec: Readonly<{ minimum: number; maximum: number }>;
  adaptiveRetrySubdivisionApplied: boolean;
  minimumVascularPvDomainMarginM3: number;
  projectionApplied: false;
  clampApplied: false;
  modelOrConstitutiveFallbackApplied: false;
}>;

export type PhaseB1MainWireDistributedCycleRunFailureV1 = Readonly<{
  completed: false;
  initialEndpoint: PhaseB1MainWireDistributedEndpointV1;
  lastAcceptedEndpoint: PhaseB1MainWireDistributedEndpointV1;
  failedSegment: Readonly<{
    startTimeSec: number;
    endTimeSec: number;
    maximumRetryDepth: number;
    failure: PhaseB1MainWireDistributedStepFailureV1;
    rollbackEndpoint: PhaseB1MainWireDistributedEndpointV1;
  }>;
  acceptedIntervals: readonly PhaseB1MainWireDistributedAcceptedIntervalV1[];
  samples: readonly PhaseB1MainWireDistributedWaveformSampleV1[];
  requestedSegmentCount: number;
  solverRetrySubdivisionCount: number;
  maximumRetryDepthUsed: number;
  acceptedTimeStepSec: Readonly<{
    minimum: number | null;
    maximum: number | null;
  }>;
  adaptiveRetrySubdivisionApplied: boolean;
  minimumVascularPvDomainMarginM3: number | null;
  projectionApplied: false;
  clampApplied: false;
  modelOrConstitutiveFallbackApplied: false;
}>;

export type PhaseB1MainWireDistributedCycleRunResultV1 =
  | PhaseB1MainWireDistributedCycleRunSuccessV1
  | PhaseB1MainWireDistributedCycleRunFailureV1;

export function capturePhaseB1MainWireDistributedDirectNumericalOwnerSnapshotV1(
  repositoryRoot = resolve("."),
): PhaseB1MainWireDistributedDirectNumericalOwnerSnapshotV1 {
  return Object.freeze(Object.fromEntries(Object.entries(
    PHASE_B1_MAIN_WIRE_DISTRIBUTED_DIRECT_NUMERICAL_OWNER_PATHS_V1,
  ).map(([owner, relativePath]) => [owner, Object.freeze({
    relativePath,
    contentSha256: sha256FileAtRootV1(repositoryRoot, relativePath),
  })]))) as PhaseB1MainWireDistributedDirectNumericalOwnerSnapshotV1;
}

export function assertPhaseB1MainWireDistributedDirectNumericalOwnersUnchangedV1(
  start: PhaseB1MainWireDistributedDirectNumericalOwnerSnapshotV1,
  end: PhaseB1MainWireDistributedDirectNumericalOwnerSnapshotV1,
): void {
  const owners = Object.keys(
    PHASE_B1_MAIN_WIRE_DISTRIBUTED_DIRECT_NUMERICAL_OWNER_PATHS_V1,
  ) as Array<keyof typeof PHASE_B1_MAIN_WIRE_DISTRIBUTED_DIRECT_NUMERICAL_OWNER_PATHS_V1>;
  assertExactOwnKeysV1(start, owners, "direct numerical owner start snapshot");
  assertExactOwnKeysV1(end, owners, "direct numerical owner end snapshot");
  const changed: string[] = [];
  for (const owner of owners) {
    const expectedPath =
      PHASE_B1_MAIN_WIRE_DISTRIBUTED_DIRECT_NUMERICAL_OWNER_PATHS_V1[owner];
    if (start[owner].relativePath !== expectedPath
        || end[owner].relativePath !== expectedPath) {
      throw new Error(`direct numerical owner path drifted for ${owner}`);
    }
    if (start[owner].contentSha256 !== end[owner].contentSha256) {
      changed.push(`${owner}:${expectedPath}`);
    }
  }
  if (changed.length > 0) {
    throw new Error(
      `direct numerical owner source changed during run: ${changed.join(", ")}`,
    );
  }
}

export function capturePhaseB1MainWireDistributedGitSourceReproducibilityV1(
  repositoryRoot = resolve("."),
  outputPathsToExclude: readonly string[] = [],
): PhaseB1MainWireDistributedGitSourceReproducibilityV1 {
  const root = gitTextV1(repositoryRoot, ["rev-parse", "--show-toplevel"]);
  if (resolve(root) !== resolve(repositoryRoot)) {
    throw new Error(
      `main-wire runner must execute at the Git worktree root: ${root}`,
    );
  }
  const exclusions = outputPathsToExclude.flatMap((outputPath) => {
    const relativePath = relative(root, resolve(outputPath));
    return relativePath === ""
      || relativePath === ".."
      || relativePath.startsWith("../")
      || relativePath.startsWith("..\\")
      ? []
      : [`:(exclude)${relativePath}`];
  });
  const pathspec = ["--", ".", ...exclusions];
  const trackedWorktreePatch = execFileSync(
    "git",
    ["diff", "--binary", "--no-ext-diff", ...pathspec],
    { cwd: root },
  );
  const trackedIndexPatch = execFileSync(
    "git",
    ["diff", "--cached", "--binary", "--no-ext-diff", ...pathspec],
    { cwd: root },
  );
  return Object.freeze({
    repositoryHeadCommit: gitTextV1(root, ["rev-parse", "HEAD"]),
    repositoryHeadTree: gitTextV1(root, ["rev-parse", "HEAD^{tree}"]),
    trackedWorktreeClean:
      trackedWorktreePatch.byteLength === 0 && trackedIndexPatch.byteLength === 0,
    trackedWorktreePatchSha256: sha256BytesV1(trackedWorktreePatch),
    trackedIndexPatchSha256: sha256BytesV1(trackedIndexPatch),
    packageLockContentSha256: sha256FileAtRootV1(root, "package-lock.json"),
    nodeVersion: process.version,
    untrackedPathsExcludedFromCleanlinessCheck: true as const,
    hashAlgorithm: "sha256-file-or-bytes-v1" as const,
  });
}

export function assertPhaseB1MainWireDistributedGitSourceReproducibilityUnchangedV1(
  start: PhaseB1MainWireDistributedGitSourceReproducibilityV1,
  end: PhaseB1MainWireDistributedGitSourceReproducibilityV1,
): void {
  const changed = (Object.keys(start) as Array<keyof typeof start>)
    .filter((key) => start[key] !== end[key]);
  if (changed.length > 0) {
    throw new Error(
      `Git/source reproducibility state changed during run: ${changed.join(", ")}`,
    );
  }
}

export type PhaseB1MainWireDistributedWaveformV1 = Readonly<{
  waveformId: typeof PHASE_B1_MAIN_WIRE_DISTRIBUTED_WAVEFORM_V1_ID;
  schemaId: "phase-b1-main-wire-distributed-waveform-schema-v1";
  generatedAt: string;
  cycleIndex: number;
  cycleStartTimeSec: number;
  cycleLengthSec: number;
  nominalDtSec: number;
  slsMode: "on" | "off";
  nodeIds: typeof MAIN_WIRE_NON_CORONARY_CIRCULATION_NODE_NAMES_V1;
  flowIds: typeof MAIN_WIRE_NON_CORONARY_ALL_FLOW_NAMES_V1;
  samples: readonly PhaseB1MainWireDistributedWaveformSampleV1[];
  claimBoundary: typeof MAIN_WIRE_ARTIFACT_CLAIM_BOUNDARY_V1;
  sourceReportContentSha256: string;
  contentSha256: string;
}>;

export type PhaseB1MainWireDistributedGitSourceReproducibilityV1 = Readonly<{
  repositoryHeadCommit: string;
  repositoryHeadTree: string;
  trackedWorktreeClean: boolean;
  trackedWorktreePatchSha256: string;
  trackedIndexPatchSha256: string;
  packageLockContentSha256: string;
  nodeVersion: string;
  untrackedPathsExcludedFromCleanlinessCheck: true;
  hashAlgorithm: "sha256-file-or-bytes-v1";
}>;

export type PhaseB1MainWireDistributedReportV1 = Readonly<{
  reportId: typeof PHASE_B1_MAIN_WIRE_DISTRIBUTED_REPORT_V1_ID;
  schemaId: "phase-b1-main-wire-distributed-report-schema-v1";
  generatedAt: string;
  runnerId: typeof PHASE_B1_MAIN_WIRE_DISTRIBUTED_RUNNER_V1_ID;
  config: Readonly<{
    nominalDtSec: number;
    configuredCycleCount: number;
    maximumRetryDepth: number;
    maximumNewtonIterations: number;
    cycleLengthSec: number;
    intrathoracicPressurePa: number;
    alveolarPressurePa: number;
    slsMode: "on" | "off";
  }>;
  provenance: Readonly<Record<string, unknown>>;
  initialization: Readonly<Record<string, unknown>>;
  cycleSummaries: readonly Readonly<Record<string, unknown>>[];
  terminal: Readonly<Record<string, unknown>>;
  atrialPvReservoirConduitReadback:
    PhaseB1AtrialPvReservoirConduitReadbackV1;
  atrialConduitAndLaterRefill: Readonly<Record<"LA" | "RA", unknown>>;
  terminalAtrialPostOpeningMassBalanceDiagnostic: Readonly<
    Record<"LA" | "RA", unknown>
  >;
  chamberPvClosedPolygonDiagnosticPaM3: Readonly<Record<
    "LA" | "LV" | "RA" | "RV",
    PhaseB1MainWireDistributedChamberPvClosedPolygonDiagnosticV1
  >>;
  waveformSummary: Readonly<Record<string, unknown>>;
  claimBoundary: typeof MAIN_WIRE_ARTIFACT_CLAIM_BOUNDARY_V1;
  contentSha256: string;
}>;

export const MAIN_WIRE_ARTIFACT_CLAIM_BOUNDARY_V1 = Object.freeze({
  researchOnly: true as const,
  exploratoryRepeatedCycleReadback: true as const,
  configuredCyclesEstablishPeriodOne: false as const,
  physiologicalValidationClaimed: false as const,
  candidateSelectionPerformed: false as const,
  parameterFittingPerformed: false as const,
  postStepProjectionApplied: false as const,
  flowOrVolumeClampApplied: false as const,
  modelOrConstitutiveFallbackApplied: false as const,
  adaptiveRetrySubdivisionPermitted: true as const,
  adaptiveRetrySubdivisionUseReportedInArtifact: true as const,
  fixedTimeStepIntegrationClaimed: false as const,
  coronaryNetworkIncluded: false as const,
  dynamicValveApertureStoredAndCondensed: true as const,
  valvePhysicalParametersOwnedByEngineCore: true as const,
  mainWireNonCoronaryVascularGraphUsed: true as const,
  modelCoreNumericalRuntimeParityClaimed: false as const,
  browserRuntimeAdopted: false as const,
  releaseRuntimeReachable: false as const,
});

type RetryResultV1 = Readonly<{
  ok: true;
  endpoint: PhaseB1MainWireDistributedEndpointV1;
  accepted: readonly PhaseB1MainWireDistributedAcceptedIntervalV1[];
  subdivisions: number;
  maximumRetryDepthUsed: number;
}> | Readonly<{
  ok: false;
  failure: PhaseB1MainWireDistributedStepFailureV1;
  rollbackEndpoint: PhaseB1MainWireDistributedEndpointV1;
  subdivisions: number;
  maximumRetryDepthUsed: number;
}>;

if (
  process.argv[1] !== undefined
  && import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) runCli();

export function runPhaseB1MainWireDistributedCycleV1(input: Readonly<{
  model: PhaseB1MainWireDistributedResearchModelV1;
  wallMaterialBinding: PhaseB1WallMaterialBindingV1;
  previousEndpoint: PhaseB1MainWireDistributedEndpointV1;
  endTimeSec: number;
  nominalDtSec: number;
  maximumRetryDepth: number;
  orderedEvents: readonly PhaseB1ProjectSyntheticNormalSinusScheduledEventV1[];
}>): PhaseB1MainWireDistributedCycleRunResultV1 {
  requirePositiveFinite(input.nominalDtSec, "nominalDtSec");
  requirePositiveInteger(input.maximumRetryDepth + 1, "maximumRetryDepth + 1");
  const initialEndpoint = input.previousEndpoint;
  const startTimeSec = initialEndpoint.timeSec;
  if (!(input.endTimeSec > startTimeSec)) {
    throw new Error("distributed cycle endTimeSec must exceed endpoint time");
  }
  const orderedEvents = [...input.orderedEvents].sort((a, b) =>
    a.calciumDriveEvent.calciumDriveTimeSec
      - b.calciumDriveEvent.calciumDriveTimeSec);
  for (let index = 0; index < orderedEvents.length; index += 1) {
    const event = orderedEvents[index];
    const time = event.calciumDriveEvent.calciumDriveTimeSec;
    if (!(time > startTimeSec) || time > input.endTimeSec) {
      throw new Error("distributed cycle event must lie in (start,end]");
    }
    if (index > 0 && time < orderedEvents[index - 1].calciumDriveEvent.calciumDriveTimeSec) {
      throw new Error("distributed cycle events must be ordered");
    }
  }
  const boundaries = buildRequestedBoundariesV1(
    startTimeSec,
    input.endTimeSec,
    input.nominalDtSec,
    orderedEvents.map((event) => event.calciumDriveEvent.calciumDriveTimeSec),
  );
  let endpoint = initialEndpoint;
  const accepted: PhaseB1MainWireDistributedAcceptedIntervalV1[] = [];
  let subdivisions = 0;
  let maximumRetryDepthUsed = 0;
  for (let segmentIndex = 0; segmentIndex < boundaries.length; segmentIndex += 1) {
    const end = boundaries[segmentIndex];
    const eventsAtEnd = orderedEvents.filter((event) =>
      Object.is(event.calciumDriveEvent.calciumDriveTimeSec, end));
    const result = attemptWithRetryV1({
      model: input.model,
      wallMaterialBinding: input.wallMaterialBinding,
      entryEndpoint: endpoint,
      endTimeSec: end,
      eventsAtEnd,
      retryDepth: 0,
      maximumRetryDepth: input.maximumRetryDepth,
      binaryPath: "root",
    });
    subdivisions += result.subdivisions;
    maximumRetryDepthUsed = Math.max(
      maximumRetryDepthUsed,
      result.maximumRetryDepthUsed,
    );
    if (result.ok === false) {
      const acceptedTimeStepSec = summarizeAcceptedTimeStepSecV1(accepted);
      return Object.freeze({
        completed: false as const,
        initialEndpoint,
        lastAcceptedEndpoint: endpoint,
        failedSegment: Object.freeze({
          startTimeSec: endpoint.timeSec,
          endTimeSec: end,
          maximumRetryDepth: input.maximumRetryDepth,
          failure: result.failure,
          rollbackEndpoint: result.rollbackEndpoint,
        }),
        acceptedIntervals: Object.freeze(accepted.slice()),
        samples: samplesFromAcceptedIntervalsV1(
          input.model,
          input.wallMaterialBinding,
          initialEndpoint,
          accepted,
          startTimeSec,
        ),
        requestedSegmentCount: segmentIndex + 1,
        solverRetrySubdivisionCount: subdivisions,
        maximumRetryDepthUsed,
        acceptedTimeStepSec,
        adaptiveRetrySubdivisionApplied: subdivisions > 0,
        minimumVascularPvDomainMarginM3:
          summarizeMinimumVascularPvDomainMarginM3V1(accepted),
        projectionApplied: false as const,
        clampApplied: false as const,
        modelOrConstitutiveFallbackApplied: false as const,
      });
    }
    endpoint = result.endpoint;
    accepted.push(...result.accepted);
  }
  const samples = samplesFromAcceptedIntervalsV1(
    input.model,
    input.wallMaterialBinding,
    initialEndpoint,
    accepted,
    startTimeSec,
  );
  const acceptedTimeStepSec = summarizeAcceptedTimeStepSecV1(accepted);
  if (acceptedTimeStepSec.minimum === null
      || acceptedTimeStepSec.maximum === null) {
    throw new Error("completed distributed cycle has no accepted time step");
  }
  return Object.freeze({
    completed: true as const,
    initialEndpoint,
    finalEndpoint: endpoint,
    acceptedIntervals: Object.freeze(accepted.slice()),
    samples,
    requestedSegmentCount: boundaries.length,
    acceptedIntervalCount: accepted.length,
    solverRetrySubdivisionCount: subdivisions,
    maximumRetryDepthUsed,
    acceptedTimeStepSec: Object.freeze({
      minimum: acceptedTimeStepSec.minimum,
      maximum: acceptedTimeStepSec.maximum,
    }),
    adaptiveRetrySubdivisionApplied: subdivisions > 0,
    minimumVascularPvDomainMarginM3:
      summarizeMinimumVascularPvDomainMarginM3V1(accepted)!,
    projectionApplied: false as const,
    clampApplied: false as const,
    modelOrConstitutiveFallbackApplied: false as const,
  });
}

export function evaluatePhaseB1MainWireDistributedEndpointDistanceV1(
  referenceEndpoint: PhaseB1MainWireDistributedEndpointV1,
  candidateEndpoint: PhaseB1MainWireDistributedEndpointV1,
): PhaseB1MainWireDistributedEndpointDistanceV1 {
  if (referenceEndpoint.differentialState.slsMode
      !== candidateEndpoint.differentialState.slsMode) {
    throw new Error("distributed endpoint distance requires identical SLS topology");
  }
  const mode = referenceEndpoint.differentialState.slsMode;
  const labels = [
    ...buildPhaseB1MainWireDistributedStoredLabelsV1(mode),
    "algebraic.triseg.V_m_S",
    "algebraic.triseg.y_m",
  ];
  const reference = [
    ...encodePhaseB1MainWireDistributedStoredStateV1(
      referenceEndpoint.differentialState,
    ),
    referenceEndpoint.triSegCoordinates.V_m_S,
    referenceEndpoint.triSegCoordinates.y_m,
  ];
  const candidate = [
    ...encodePhaseB1MainWireDistributedStoredStateV1(
      candidateEndpoint.differentialState,
    ),
    candidateEndpoint.triSegCoordinates.V_m_S,
    candidateEndpoint.triSegCoordinates.y_m,
  ];
  if (labels.length !== reference.length || reference.length !== candidate.length) {
    throw new Error("distributed endpoint-distance layout drifted");
  }
  const normalized = labels.map((label, index) => Math.abs(
    candidate[index] - reference[index],
  ) / distanceScaleV1(label, reference[index], candidate[index]));
  const maximumNormalizedDistance = Math.max(...normalized);
  const maximizingIndex = normalized.indexOf(maximumNormalizedDistance);
  return Object.freeze({
    maximumNormalizedDistance,
    maximizingScalarLabel: labels[maximizingIndex],
    rootMeanSquareNormalizedDistance: Math.sqrt(
      normalized.reduce((sum, value) => sum + value * value, 0)
        / normalized.length,
    ),
    scalarCount: normalized.length,
    timeExcluded: true as const,
  });
}

export function buildPhaseB1MainWireDistributedArtifactBundleV1(input: Readonly<{
  generatedAt: string;
  nominalDtSec: number;
  configuredCycleCount: number;
  maximumRetryDepth: number;
  maximumNewtonIterations: number;
  cycleLengthSec: number;
  intrathoracicPressurePa: number;
  alveolarPressurePa: number;
  slsMode: "on" | "off";
  cycleIndex: number;
  cycleStartTimeSec: number;
  terminalCycleSamples: readonly PhaseB1MainWireDistributedWaveformSampleV1[];
  cycleSummaries: readonly Readonly<Record<string, unknown>>[];
  initialization: Readonly<Record<string, unknown>>;
  provenance: Readonly<Record<string, unknown>>;
  terminal: Readonly<Record<string, unknown>>;
  sha256Hex: CanonicalSha256HexProvider;
}>): Readonly<{
  report: PhaseB1MainWireDistributedReportV1;
  waveform: PhaseB1MainWireDistributedWaveformV1;
}> {
  const samples = validateAndCopySamplesV1(
    input.terminalCycleSamples,
    input.cycleStartTimeSec,
    input.cycleLengthSec,
  );
  const atrialTrace = atrialTraceFromSamplesV1(samples, input.cycleLengthSec);
  const atrialPvReservoirConduitReadback =
    buildPhaseB1AtrialPvReservoirConduitReadbackV1({
      trace: atrialTrace,
      formalPeriodOneConvergencePass: false,
      sha256Hex: input.sha256Hex,
    });
  const reportPayload = Object.freeze({
    reportId: PHASE_B1_MAIN_WIRE_DISTRIBUTED_REPORT_V1_ID,
    schemaId: "phase-b1-main-wire-distributed-report-schema-v1" as const,
    generatedAt: requireNonEmptyString(input.generatedAt, "generatedAt"),
    runnerId: PHASE_B1_MAIN_WIRE_DISTRIBUTED_RUNNER_V1_ID,
    config: Object.freeze({
      nominalDtSec: requirePositiveFinite(input.nominalDtSec, "nominalDtSec"),
      configuredCycleCount: requirePositiveInteger(
        input.configuredCycleCount,
        "configuredCycleCount",
      ),
      maximumRetryDepth: requireNonNegativeInteger(
        input.maximumRetryDepth,
        "maximumRetryDepth",
      ),
      maximumNewtonIterations: requirePositiveInteger(
        input.maximumNewtonIterations,
        "maximumNewtonIterations",
      ),
      cycleLengthSec: requirePositiveFinite(input.cycleLengthSec, "cycleLengthSec"),
      intrathoracicPressurePa: requireFinite(
        input.intrathoracicPressurePa,
        "intrathoracicPressurePa",
      ),
      alveolarPressurePa: requireFinite(
        input.alveolarPressurePa,
        "alveolarPressurePa",
      ),
      slsMode: requireSlsModeV1(input.slsMode, "slsMode"),
    }),
    provenance: Object.freeze({ ...input.provenance }),
    initialization: Object.freeze({ ...input.initialization }),
    cycleSummaries: Object.freeze(input.cycleSummaries.map((summary) =>
      Object.freeze({ ...summary }))),
    terminal: Object.freeze({ ...input.terminal }),
    atrialPvReservoirConduitReadback,
    atrialConduitAndLaterRefill: buildAtrialConduitAndLaterRefillV1(
      atrialPvReservoirConduitReadback,
      samples,
      input.cycleLengthSec,
    ),
    terminalAtrialPostOpeningMassBalanceDiagnostic:
      buildAtrialPostOpeningMassBalanceDiagnosticV1(
        atrialPvReservoirConduitReadback,
        samples,
        input.cycleLengthSec,
      ),
    chamberPvClosedPolygonDiagnosticPaM3:
      buildChamberPvClosedPolygonDiagnosticV1(samples),
    waveformSummary: buildWaveformSummaryV1(samples),
    claimBoundary: MAIN_WIRE_ARTIFACT_CLAIM_BOUNDARY_V1,
  });
  const report = Object.freeze({
    ...reportPayload,
    contentSha256: computeCanonicalSha256(reportPayload, input.sha256Hex),
  });
  const waveformPayload = Object.freeze({
    waveformId: PHASE_B1_MAIN_WIRE_DISTRIBUTED_WAVEFORM_V1_ID,
    schemaId: "phase-b1-main-wire-distributed-waveform-schema-v1" as const,
    generatedAt: input.generatedAt,
    cycleIndex: requireNonNegativeInteger(input.cycleIndex, "cycleIndex"),
    cycleStartTimeSec: requireNonNegativeFinite(
      input.cycleStartTimeSec,
      "cycleStartTimeSec",
    ),
    cycleLengthSec: input.cycleLengthSec,
    nominalDtSec: input.nominalDtSec,
    slsMode: input.slsMode,
    nodeIds: MAIN_WIRE_NON_CORONARY_CIRCULATION_NODE_NAMES_V1,
    flowIds: MAIN_WIRE_NON_CORONARY_ALL_FLOW_NAMES_V1,
    samples,
    claimBoundary: MAIN_WIRE_ARTIFACT_CLAIM_BOUNDARY_V1,
    sourceReportContentSha256: report.contentSha256,
  });
  const waveform = Object.freeze({
    ...waveformPayload,
    contentSha256: computeCanonicalSha256(waveformPayload, input.sha256Hex),
  });
  return Object.freeze({ report, waveform });
}

export function validatePhaseB1MainWireDistributedArtifactBundleV1(
  report: PhaseB1MainWireDistributedReportV1,
  waveform: PhaseB1MainWireDistributedWaveformV1,
  sha256Hex: CanonicalSha256HexProvider,
): Readonly<{
  report: PhaseB1MainWireDistributedReportV1;
  waveform: PhaseB1MainWireDistributedWaveformV1;
}> {
  assertExactOwnKeysV1(report, [
    "reportId",
    "schemaId",
    "generatedAt",
    "runnerId",
    "config",
    "provenance",
    "initialization",
    "cycleSummaries",
    "terminal",
    "atrialPvReservoirConduitReadback",
    "atrialConduitAndLaterRefill",
    "terminalAtrialPostOpeningMassBalanceDiagnostic",
    "chamberPvClosedPolygonDiagnosticPaM3",
    "waveformSummary",
    "claimBoundary",
    "contentSha256",
  ], "main-wire distributed report");
  assertExactOwnKeysV1(waveform, [
    "waveformId",
    "schemaId",
    "generatedAt",
    "cycleIndex",
    "cycleStartTimeSec",
    "cycleLengthSec",
    "nominalDtSec",
    "slsMode",
    "nodeIds",
    "flowIds",
    "samples",
    "claimBoundary",
    "sourceReportContentSha256",
    "contentSha256",
  ], "main-wire distributed waveform");
  assertExactOwnKeysV1(report.config, [
    "nominalDtSec",
    "configuredCycleCount",
    "maximumRetryDepth",
    "maximumNewtonIterations",
    "cycleLengthSec",
    "intrathoracicPressurePa",
    "alveolarPressurePa",
    "slsMode",
  ], "main-wire distributed report config");
  if (
    report.reportId !== PHASE_B1_MAIN_WIRE_DISTRIBUTED_REPORT_V1_ID
    || waveform.waveformId !== PHASE_B1_MAIN_WIRE_DISTRIBUTED_WAVEFORM_V1_ID
    || report.schemaId !== "phase-b1-main-wire-distributed-report-schema-v1"
    || waveform.schemaId !== "phase-b1-main-wire-distributed-waveform-schema-v1"
    || report.runnerId !== PHASE_B1_MAIN_WIRE_DISTRIBUTED_RUNNER_V1_ID
  ) throw new Error("main-wire distributed artifact identity or live claim boundary is invalid");
  assertExactOrderedStringArrayV1(
    waveform.nodeIds,
    MAIN_WIRE_NON_CORONARY_CIRCULATION_NODE_NAMES_V1,
    "main-wire distributed waveform nodeIds",
  );
  assertExactOrderedStringArrayV1(
    waveform.flowIds,
    MAIN_WIRE_NON_CORONARY_ALL_FLOW_NAMES_V1,
    "main-wire distributed waveform flowIds",
  );
  assertArtifactClaimBoundaryV1(report.claimBoundary, "report.claimBoundary");
  assertArtifactClaimBoundaryV1(waveform.claimBoundary, "waveform.claimBoundary");
  const { contentSha256: reportHash, ...reportPayload } = report;
  const { contentSha256: waveformHash, ...waveformPayload } = waveform;
  if (computeCanonicalSha256(reportPayload, sha256Hex) !== reportHash) {
    throw new Error("main-wire distributed report content hash is invalid");
  }
  if (computeCanonicalSha256(waveformPayload, sha256Hex) !== waveformHash) {
    throw new Error("main-wire distributed waveform content hash is invalid");
  }
  if (waveform.sourceReportContentSha256 !== report.contentSha256) {
    throw new Error("main-wire distributed waveform does not bind the report");
  }
  if (report.generatedAt !== waveform.generatedAt
      || !Object.is(report.config.nominalDtSec, waveform.nominalDtSec)
      || !Object.is(report.config.cycleLengthSec, waveform.cycleLengthSec)
      || report.config.slsMode !== waveform.slsMode) {
    throw new Error("main-wire distributed report and waveform config do not agree");
  }
  requireSlsModeV1(report.config.slsMode, "report.config.slsMode");
  requireSlsModeV1(waveform.slsMode, "waveform.slsMode");
  assertOwnKeysIncludeV1(
    report.provenance,
    ["gitSourceReproducibilityAtRunStart"],
    "main-wire distributed report provenance",
  );
  validateGitSourceReproducibilityV1(
    report.provenance.gitSourceReproducibilityAtRunStart,
  );
  validateAdaptiveIntegrationAuditV1(report, waveform.nominalDtSec);
  if (waveform.cycleIndex
      !== (report.terminal.completedCycleCount as number) - 1) {
    throw new Error("main-wire waveform is not the terminal completed cycle");
  }
  const expectedCycleStartTimeSec = waveform.cycleIndex * waveform.cycleLengthSec;
  const cycleTimeToleranceSec = 64 * Number.EPSILON * Math.max(
    1,
    Math.abs(expectedCycleStartTimeSec),
    Math.abs(waveform.cycleStartTimeSec),
  );
  if (Math.abs(waveform.cycleStartTimeSec - expectedCycleStartTimeSec)
      > cycleTimeToleranceSec) {
    throw new Error("main-wire distributed waveform cycle index and start disagree");
  }
  const validatedSamples = validateAndCopySamplesV1(
    waveform.samples,
    waveform.cycleStartTimeSec,
    waveform.cycleLengthSec,
  );
  const rebuilt = buildPhaseB1AtrialPvReservoirConduitReadbackV1({
    trace: atrialTraceFromSamplesV1(validatedSamples, waveform.cycleLengthSec),
    formalPeriodOneConvergencePass: false,
    sha256Hex,
  });
  validatePhaseB1AtrialPvReservoirConduitReadbackV1(
    report.atrialPvReservoirConduitReadback,
    sha256Hex,
  );
  assertCanonicalValueEqualV1(
    report.atrialPvReservoirConduitReadback,
    rebuilt,
    sha256Hex,
    "main-wire distributed atrial PV readback",
  );
  assertCanonicalValueEqualV1(
    report.atrialConduitAndLaterRefill,
    buildAtrialConduitAndLaterRefillV1(
      rebuilt,
      validatedSamples,
      waveform.cycleLengthSec,
    ),
    sha256Hex,
    "main-wire distributed atrial conduit/later-refill readback",
  );
  assertCanonicalValueEqualV1(
    report.terminalAtrialPostOpeningMassBalanceDiagnostic,
    buildAtrialPostOpeningMassBalanceDiagnosticV1(
      rebuilt,
      validatedSamples,
      waveform.cycleLengthSec,
    ),
    sha256Hex,
    "main-wire distributed terminal atrial post-opening mass balance diagnostic",
  );
  const terminalCycleSummary = report.cycleSummaries.at(-1);
  assertOwnKeysIncludeV1(
    terminalCycleSummary,
    ["trend"],
    "main-wire distributed terminal cycle summary",
  );
  const terminalCycleTrend = terminalCycleSummary.trend;
  assertOwnKeysIncludeV1(
    terminalCycleTrend,
    ["atrialPostOpeningMassBalanceDiagnostic"],
    "main-wire distributed terminal cycle trend",
  );
  assertCanonicalValueEqualV1(
    terminalCycleTrend.atrialPostOpeningMassBalanceDiagnostic,
    report.terminalAtrialPostOpeningMassBalanceDiagnostic,
    sha256Hex,
    "main-wire distributed terminal-cycle atrial mass balance diagnostic",
  );
  assertCanonicalValueEqualV1(
    report.chamberPvClosedPolygonDiagnosticPaM3,
    buildChamberPvClosedPolygonDiagnosticV1(validatedSamples),
    sha256Hex,
    "main-wire distributed chamber PV closed-polygon diagnostic",
  );
  assertCanonicalValueEqualV1(
    report.waveformSummary,
    buildWaveformSummaryV1(validatedSamples),
    sha256Hex,
    "main-wire distributed waveform summary",
  );
  return Object.freeze({ report, waveform });
}

function assertArtifactClaimBoundaryV1(
  value: Readonly<Record<string, unknown>>,
  field: string,
): void {
  const expected = MAIN_WIRE_ARTIFACT_CLAIM_BOUNDARY_V1;
  const keys = Object.keys(value);
  if (keys.length !== Object.keys(expected).length
      || keys.some((key) => !Object.hasOwn(expected, key))) {
    throw new Error(`${field} does not have the exact claim-boundary keys`);
  }
  for (const key of Object.keys(expected) as Array<keyof typeof expected>) {
    if (value[key] !== expected[key]) {
      throw new Error(`${field}.${key} is invalid`);
    }
  }
}

function assertExactOwnKeysV1(
  value: unknown,
  expectedKeys: readonly string[],
  field: string,
): asserts value is Readonly<Record<string, unknown>> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${field} must be a plain record`);
  }
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    throw new Error(`${field} must be a plain record`);
  }
  const actualKeys = Object.keys(value);
  if (actualKeys.length !== expectedKeys.length
      || actualKeys.some((key) => !expectedKeys.includes(key))) {
    throw new Error(`${field} does not contain its exact declared keys`);
  }
}

function assertOwnKeysIncludeV1(
  value: unknown,
  requiredKeys: readonly string[],
  field: string,
): asserts value is Readonly<Record<string, unknown>> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${field} must be a plain record`);
  }
  const actualKeys = Object.keys(value);
  if (requiredKeys.some((key) => !actualKeys.includes(key))) {
    throw new Error(`${field} lacks required keys`);
  }
}

function assertExactOrderedStringArrayV1(
  actual: readonly string[],
  expected: readonly string[],
  field: string,
): void {
  if (!Array.isArray(actual)
      || actual.length !== expected.length
      || actual.some((value, index) => value !== expected[index])) {
    throw new Error(`${field} does not match its exact ordered contract`);
  }
}

function assertCanonicalValueEqualV1(
  actual: unknown,
  expected: unknown,
  sha256Hex: CanonicalSha256HexProvider,
  field: string,
): void {
  if (computeCanonicalSha256(actual, sha256Hex)
      !== computeCanonicalSha256(expected, sha256Hex)) {
    throw new Error(`${field} does not bind the waveform`);
  }
}

function validateGitSourceReproducibilityV1(value: unknown): void {
  assertExactOwnKeysV1(value, [
    "repositoryHeadCommit",
    "repositoryHeadTree",
    "trackedWorktreeClean",
    "trackedWorktreePatchSha256",
    "trackedIndexPatchSha256",
    "packageLockContentSha256",
    "nodeVersion",
    "untrackedPathsExcludedFromCleanlinessCheck",
    "hashAlgorithm",
  ], "Git/source reproducibility metadata");
  for (const field of ["repositoryHeadCommit", "repositoryHeadTree"] as const) {
    if (typeof value[field] !== "string"
        || !/^[0-9a-f]{40,64}$/.test(value[field])) {
      throw new Error(`Git/source reproducibility ${field} is invalid`);
    }
  }
  for (const field of [
    "trackedWorktreePatchSha256",
    "trackedIndexPatchSha256",
    "packageLockContentSha256",
  ] as const) {
    if (typeof value[field] !== "string"
        || !/^[0-9a-f]{64}$/.test(value[field])) {
      throw new Error(`Git/source reproducibility ${field} is invalid`);
    }
  }
  if (typeof value.trackedWorktreeClean !== "boolean"
      || value.untrackedPathsExcludedFromCleanlinessCheck !== true
      || value.hashAlgorithm !== "sha256-file-or-bytes-v1"
      || typeof value.nodeVersion !== "string"
      || value.nodeVersion.length === 0) {
    throw new Error("Git/source reproducibility metadata is invalid");
  }
}

function validateAdaptiveIntegrationAuditV1(
  report: PhaseB1MainWireDistributedReportV1,
  nominalDtSec: number,
): void {
  if (!Array.isArray(report.cycleSummaries)
      || report.cycleSummaries.length === 0) {
    throw new Error("main-wire report requires at least one completed cycle summary");
  }
  const acceptedMinimums: number[] = [];
  const acceptedMaximums: number[] = [];
  const domainMargins: number[] = [];
  let subdivisionCount = 0;
  let maximumRetryDepthUsed = 0;
  for (const [index, summary] of report.cycleSummaries.entries()) {
    assertOwnKeysIncludeV1(summary, [
      "cycleIndex",
      "solverRetrySubdivisionCount",
      "maximumRetryDepthUsed",
      "acceptedTimeStepSec",
      "adaptiveRetrySubdivisionApplied",
      "modelOrConstitutiveFallbackApplied",
      "fixedTimeStepIntegrationClaimed",
      "minimumVascularPvDomainMarginM3",
    ], `main-wire cycleSummaries[${index}]`);
    if (summary.cycleIndex !== index) {
      throw new Error(`cycleSummaries[${index}] cycle index is invalid`);
    }
    const subdivisions = requireNonNegativeInteger(
      summary.solverRetrySubdivisionCount as number,
      `cycleSummaries[${index}].solverRetrySubdivisionCount`,
    );
    const retryDepth = requireNonNegativeInteger(
      summary.maximumRetryDepthUsed as number,
      `cycleSummaries[${index}].maximumRetryDepthUsed`,
    );
    assertOwnKeysIncludeV1(
      summary.acceptedTimeStepSec,
      ["minimum", "maximum"],
      `cycleSummaries[${index}].acceptedTimeStepSec`,
    );
    const minimum = requirePositiveFinite(
      summary.acceptedTimeStepSec.minimum as number,
      `cycleSummaries[${index}].acceptedTimeStepSec.minimum`,
    );
    const maximum = requirePositiveFinite(
      summary.acceptedTimeStepSec.maximum as number,
      `cycleSummaries[${index}].acceptedTimeStepSec.maximum`,
    );
    const dtTolerance = 64 * Number.EPSILON * Math.max(1, nominalDtSec);
    if (minimum > maximum || maximum > nominalDtSec + dtTolerance) {
      throw new Error(`cycleSummaries[${index}] accepted dt range is invalid`);
    }
    if (summary.adaptiveRetrySubdivisionApplied !== (subdivisions > 0)
        || summary.modelOrConstitutiveFallbackApplied !== false
        || summary.fixedTimeStepIntegrationClaimed !== false) {
      throw new Error(`cycleSummaries[${index}] integration claims are invalid`);
    }
    acceptedMinimums.push(minimum);
    acceptedMaximums.push(maximum);
    domainMargins.push(requirePositiveFinite(
      summary.minimumVascularPvDomainMarginM3 as number,
      `cycleSummaries[${index}].minimumVascularPvDomainMarginM3`,
    ));
    subdivisionCount += subdivisions;
    maximumRetryDepthUsed = Math.max(maximumRetryDepthUsed, retryDepth);
  }
  assertOwnKeysIncludeV1(report.terminal, [
    "completedCycleCount",
    "configuredCycleCount",
    "acceptedTimeStepSec",
    "solverRetrySubdivisionCount",
    "maximumRetryDepthUsed",
    "adaptiveRetrySubdivisionApplied",
    "modelOrConstitutiveFallbackApplied",
    "fixedTimeStepIntegrationClaimed",
    "minimumVascularPvDomainMarginM3",
  ], "main-wire terminal integration audit");
  if (report.terminal.completedCycleCount !== report.cycleSummaries.length
      || report.terminal.configuredCycleCount
        !== report.config.configuredCycleCount
      || report.terminal.completedCycleCount
        !== report.terminal.configuredCycleCount) {
    throw new Error("main-wire completed/configured cycle accounting is invalid");
  }
  assertOwnKeysIncludeV1(
    report.terminal.acceptedTimeStepSec,
    ["minimum", "maximum"],
    "main-wire terminal acceptedTimeStepSec",
  );
  const terminalExpected = Object.freeze({
    minimum: Math.min(...acceptedMinimums),
    maximum: Math.max(...acceptedMaximums),
    minimumVascularPvDomainMarginM3: Math.min(...domainMargins),
  });
  if (!Object.is(
        report.terminal.acceptedTimeStepSec.minimum,
        terminalExpected.minimum,
      )
      || !Object.is(
        report.terminal.acceptedTimeStepSec.maximum,
        terminalExpected.maximum,
      )
      || report.terminal.solverRetrySubdivisionCount !== subdivisionCount
      || report.terminal.maximumRetryDepthUsed !== maximumRetryDepthUsed
      || report.terminal.adaptiveRetrySubdivisionApplied !== (subdivisionCount > 0)
      || report.terminal.modelOrConstitutiveFallbackApplied !== false
      || report.terminal.fixedTimeStepIntegrationClaimed !== false
      || !Object.is(
        report.terminal.minimumVascularPvDomainMarginM3,
        terminalExpected.minimumVascularPvDomainMarginM3,
      )) {
    throw new Error("main-wire terminal integration audit is inconsistent");
  }
}

function runCli(): void {
  const reportPath = resolve(
    process.env.PHASE_B1_MAIN_WIRE_REPORT_PATH ?? DEFAULT_REPORT_PATH,
  );
  const waveformPath = resolve(
    process.env.PHASE_B1_MAIN_WIRE_WAVEFORM_PATH ?? DEFAULT_WAVEFORM_PATH,
  );
  assertDistinctArtifactPathsV1(reportPath, waveformPath);
  removePhaseB1MainWireDistributedCanonicalArtifactPairV1(
    reportPath,
    waveformPath,
  );
  try {
    runCliAfterCanonicalOutputResetV1(reportPath, waveformPath);
  } catch (error) {
    removePhaseB1MainWireDistributedCanonicalArtifactPairV1(
      reportPath,
      waveformPath,
    );
    process.stdout.write(`${JSON.stringify({
      stage: "failed-closed-no-artifact-written",
      error: error instanceof Error ? error.message : String(error),
      staleOutputReuseAuthorized: false,
      canonicalReportPresent: false,
      canonicalWaveformPresent: false,
    })}\n`);
    process.exitCode = 1;
  }
}

function runCliAfterCanonicalOutputResetV1(
  reportPath: string,
  waveformPath: string,
): void {
  const sourceFileSnapshotAtStart =
    capturePhaseB1MainWireDistributedDirectNumericalOwnerSnapshotV1();
  const gitSourceReproducibilityAtStart =
    capturePhaseB1MainWireDistributedGitSourceReproducibilityV1(
      resolve("."),
      [reportPath, waveformPath],
    );
  const nominalDtSec = parsePositiveEnv("PHASE_B1_MAIN_WIRE_DT_MS", 4) / 1000;
  const configuredCycleCount = parsePositiveIntegerEnv(
    "PHASE_B1_MAIN_WIRE_CYCLES",
    1,
  );
  const maximumRetryDepth = parseNonNegativeIntegerEnv(
    "PHASE_B1_MAIN_WIRE_MAX_RETRY_DEPTH",
    3,
  );
  const maximumNewtonIterations = parsePositiveIntegerEnv(
    "PHASE_B1_MAIN_WIRE_MAX_NEWTON_ITERATIONS",
    60,
  );
  const intrathoracicPressurePa = parseFiniteEnv(
    "PHASE_B1_MAIN_WIRE_PTH_MMHG",
    0,
  ) * PA_PER_MMHG;
  const alveolarPressurePa = parseFiniteEnv(
    "PHASE_B1_MAIN_WIRE_PALV_MMHG",
    0,
  ) * PA_PER_MMHG;
  const atrialLandKinematicClosure = parseAtrialLandKinematicClosureEnv(
    "PHASE_B1_MAIN_WIRE_ATRIAL_LAND_KINEMATICS",
    "population-only",
  );
  const requestedSlsMode = requireSlsModeV1(
    process.env.PHASE_B1_MAIN_WIRE_SLS_MODE ?? "on",
    "PHASE_B1_MAIN_WIRE_SLS_MODE",
  );
  const manifest = buildPhaseB1QuiescentReferenceEvidenceManifestV1(sha256);
  const numerical = buildPhaseB1QuiescentReferenceNumericalEvidenceV1(
    manifest,
    sha256,
  );
  const sourceCase = numerical.results[requestedSlsMode].eventFreeCase;
  // The physiology-envelope overlay is a shared hemodynamic parameter object.
  // Its constructor deliberately authenticates the canonical SLS-on warm start,
  // but the resulting overlay can be applied to either physical SLS topology.
  const physiologyEnvelopeOverlay = buildPhaseB1PhysiologyEnvelopeCenterOverlayV1(
    numerical.results.on.eventFreeCase,
  );
  const candidate = buildPhaseB1MechanisticRebuildCaseV2({
    sourceCase,
    overlay: physiologyEnvelopeOverlay,
    atrialLandKinematicClosure,
    sha256Hex: sha256,
  });
  const schedule = buildPhaseB1ProjectSyntheticNormalSinusEventScheduleV1(sha256);
  const controls = mainWireDefaultHemodynamicRuntimeControlsV1();
  const initialOldEndpoint = candidate.initialization.endpoint;
  const initialVascular = initializeMainWireNonCoronaryVascularStateV1({
    targetTotalBloodVolumeM3:
      candidate.sourcePhysiologyCase.overlay.totalBloodVolumeM3,
    chamberVolumeM3ByNode: Object.freeze({
      LV: initialOldEndpoint.differentialState.bloodVolumesM3.LV,
      LA: initialOldEndpoint.differentialState.bloodVolumesM3.LA,
      RV: initialOldEndpoint.differentialState.bloodVolumesM3.RV,
      RA: initialOldEndpoint.differentialState.bloodVolumesM3.RA,
    }),
    chamberAbsolutePressurePaByNode:
      candidate.initialEvaluation.closedLoop.chamberAbsolutePressurePa,
    mainWireRuntimeControls: controls,
    externalPressurePa: Object.freeze({
      pth: intrathoracicPressurePa,
      palv: alveolarPressurePa,
    }),
  });
  const transformed = transformPhaseB1EndpointToMainWireDistributedV1({
    sourceEndpoint: initialOldEndpoint,
    vascularBloodVolumesM3: initialVascular.vascularVolumeM3ByNode,
    chamberAbsolutePressurePaByNode:
      initialVascular.chamberAbsolutePressurePaByNode,
    vascularAbsolutePressurePaByNode:
      initialVascular.vascularAbsolutePressurePaByNode,
    rootDynamicFlowsM3PerSec:
      initialVascular.solverFlowPartition.dynamicRootFlowsM3PerSec,
  });
  const model = createPhaseB1MainWireDistributedResearchModelV1({
    mechanicsProxyModel: candidate.model,
    mainWireRuntimeControls: controls,
    vascularExternalPressurePa: Object.freeze({
      pth: intrathoracicPressurePa,
      palv: alveolarPressurePa,
    }),
    maximumNewtonIterations,
  });
  let endpoint = transformed.endpoint;
  const cycleSummaries: Readonly<Record<string, unknown>>[] = [];
  let terminalSamples: readonly PhaseB1MainWireDistributedWaveformSampleV1[] = [];
  let completedCycleCount = 0;
  let terminalFailure: Readonly<Record<string, unknown>> | null = null;
  let acceptedTimeStepMinimumSec = Number.POSITIVE_INFINITY;
  let acceptedTimeStepMaximumSec = 0;
  let totalSolverRetrySubdivisionCount = 0;
  let maximumRetryDepthUsedAcrossRun = 0;
  let minimumVascularPvDomainMarginM3 = Number.POSITIVE_INFINITY;
  for (let cycleIndex = 0; cycleIndex < configuredCycleCount; cycleIndex += 1) {
    const cycleStartTimeSec = cycleIndex * schedule.cycleLengthSec;
    const cycleEndTimeSec = (cycleIndex + 1) * schedule.cycleLengthSec;
    const cycleTimeToleranceSec = 64 * Number.EPSILON * Math.max(
      1,
      Math.abs(cycleStartTimeSec),
      Math.abs(endpoint.timeSec),
    );
    if (Math.abs(endpoint.timeSec - cycleStartTimeSec) > cycleTimeToleranceSec) {
      throw new Error(
        "distributed endpoint time does not match the scheduled cycle start",
      );
    }
    const events = generatePhaseB1ProjectSyntheticNormalSinusEventsInWindowV1(
      schedule,
      cycleStartTimeSec,
      cycleEndTimeSec,
      sha256,
    );
    const cycle = runPhaseB1MainWireDistributedCycleV1({
      model,
      wallMaterialBinding: candidate.wallMaterialBinding,
      previousEndpoint: endpoint,
      endTimeSec: cycleEndTimeSec,
      nominalDtSec,
      maximumRetryDepth,
      orderedEvents: events,
    });
    if (cycle.completed === false) {
      terminalFailure = Object.freeze({
        cycleIndex,
        lastAcceptedTimeSec: cycle.lastAcceptedEndpoint.timeSec,
        failedSegment: cycle.failedSegment,
        partialFailedCycleSampleCount: cycle.samples.length,
      });
      break;
    }
    terminalSamples = cycle.samples;
    const distance = evaluatePhaseB1MainWireDistributedEndpointDistanceV1(
      endpoint,
      cycle.finalEndpoint,
    );
    const tbv = summarizeTbvV1(cycle.samples);
    const trend = buildPhaseB1MainWireDistributedCycleTrendSummaryV1(
      cycle.samples,
      schedule.cycleLengthSec,
      sha256,
    );
    cycleSummaries.push(Object.freeze({
      cycleIndex,
      startTimeSec: cycleStartTimeSec,
      endTimeSec: cycleEndTimeSec,
      endpointDistance: distance,
      totalBloodVolume: tbv,
      acceptedIntervalCount: cycle.acceptedIntervalCount,
      requestedSegmentCount: cycle.requestedSegmentCount,
      solverRetrySubdivisionCount: cycle.solverRetrySubdivisionCount,
      maximumRetryDepthUsed: cycle.maximumRetryDepthUsed,
      acceptedTimeStepSec: cycle.acceptedTimeStepSec,
      adaptiveRetrySubdivisionApplied:
        cycle.adaptiveRetrySubdivisionApplied,
      modelOrConstitutiveFallbackApplied:
        cycle.modelOrConstitutiveFallbackApplied,
      fixedTimeStepIntegrationClaimed: false,
      minimumVascularPvDomainMarginM3:
        cycle.minimumVascularPvDomainMarginM3,
      trend,
    }));
    acceptedTimeStepMinimumSec = Math.min(
      acceptedTimeStepMinimumSec,
      cycle.acceptedTimeStepSec.minimum,
    );
    acceptedTimeStepMaximumSec = Math.max(
      acceptedTimeStepMaximumSec,
      cycle.acceptedTimeStepSec.maximum,
    );
    totalSolverRetrySubdivisionCount += cycle.solverRetrySubdivisionCount;
    maximumRetryDepthUsedAcrossRun = Math.max(
      maximumRetryDepthUsedAcrossRun,
      cycle.maximumRetryDepthUsed,
    );
    minimumVascularPvDomainMarginM3 = Math.min(
      minimumVascularPvDomainMarginM3,
      cycle.minimumVascularPvDomainMarginM3,
    );
    endpoint = cycle.finalEndpoint;
    completedCycleCount += 1;
    process.stdout.write(`${JSON.stringify({
      stage: "cycle-complete",
      cycleIndex,
      endpointDistance: distance.maximumNormalizedDistance,
      maximumRelativeTbvDrift: tbv.maximumRelativeDrift,
      retries: cycle.solverRetrySubdivisionCount,
      acceptedTimeStepSec: cycle.acceptedTimeStepSec,
      adaptiveRetrySubdivisionApplied:
        cycle.adaptiveRetrySubdivisionApplied,
      minimumVascularPvDomainMarginM3:
        cycle.minimumVascularPvDomainMarginM3,
    })}\n`);
  }
  if (terminalFailure !== null) {
    assertPhaseB1MainWireDistributedDirectNumericalOwnersUnchangedV1(
      sourceFileSnapshotAtStart,
      capturePhaseB1MainWireDistributedDirectNumericalOwnerSnapshotV1(),
    );
    assertPhaseB1MainWireDistributedGitSourceReproducibilityUnchangedV1(
      gitSourceReproducibilityAtStart,
      capturePhaseB1MainWireDistributedGitSourceReproducibilityV1(
        resolve("."),
        [reportPath, waveformPath],
      ),
    );
    process.stdout.write(`${JSON.stringify({
      stage: "failed-closed-no-artifact-written",
      terminalFailure,
      staleOutputReuseAuthorized: false,
    })}\n`);
    process.exitCode = 1;
    return;
  }
  if (terminalSamples.length < 2) {
    throw new Error(
      "distributed runner completed no full cycle; no full-cycle artifact was written",
    );
  }
  const generatedAt = new Date().toISOString();
  const terminalCycleIndex = Math.max(0, completedCycleCount - 1);
  const terminalCycleStartTimeSec =
    terminalCycleIndex * schedule.cycleLengthSec;
  const terminal = Object.freeze({
    completedCycleCount,
    configuredCycleCount,
    status: "completed-configured-exploratory-cycles",
    failure: null,
    formalPeriodOneConvergenceEvaluated: false,
    formalPeriodOneConvergencePass: false,
    physiologicalValidationPass: false,
    acceptedTimeStepSec: Object.freeze({
      minimum: acceptedTimeStepMinimumSec,
      maximum: acceptedTimeStepMaximumSec,
    }),
    solverRetrySubdivisionCount: totalSolverRetrySubdivisionCount,
    maximumRetryDepthUsed: maximumRetryDepthUsedAcrossRun,
    adaptiveRetrySubdivisionApplied:
      totalSolverRetrySubdivisionCount > 0,
    modelOrConstitutiveFallbackApplied: false,
    fixedTimeStepIntegrationClaimed: false,
    minimumVascularPvDomainMarginM3,
  });
  const bundle = buildPhaseB1MainWireDistributedArtifactBundleV1({
    generatedAt,
    nominalDtSec,
    configuredCycleCount,
    maximumRetryDepth,
    maximumNewtonIterations,
    cycleLengthSec: schedule.cycleLengthSec,
    intrathoracicPressurePa,
    alveolarPressurePa,
    slsMode: transformed.endpoint.differentialState.slsMode,
    cycleIndex: terminalCycleIndex,
    cycleStartTimeSec: terminalCycleStartTimeSec,
    terminalCycleSamples: terminalSamples,
    cycleSummaries,
    initialization: Object.freeze({
      oldCandidateBuiltOnce: true,
      oldCandidateConfigurationContentSha256:
        candidate.configurationContentSha256,
      vascular: initialVascular.audit,
      transform: transformed.audit,
    }),
    provenance: Object.freeze({
      sourceManifestContentSha256: manifest.contentSha256,
      sourceNumericalEvidenceContentSha256:
        numerical.certificate.contentSha256,
      scheduleContentSha256: schedule.contentSha256,
      wallMaterialBindingContentSha256:
        candidate.wallMaterialBinding.contentSha256,
      atrialLandKinematicClosure:
        candidate.atrialLandKinematicClosure,
      physiologyEnvelopeOverlayAuthenticatedFromSlsMode: "on",
      candidatePhysicalSlsMode:
        transformed.endpoint.differentialState.slsMode,
      atrialPvReadbackRoleForThisCandidate:
        "development-diagnostic-not-held-out-after-architecture-selection",
      directNumericalOwnerSourceSnapshotAtStart: sourceFileSnapshotAtStart,
      gitSourceReproducibilityAtRunStart:
        gitSourceReproducibilityAtStart,
      sourceFileHashAlgorithm: "sha256-file-bytes-v1",
      canonicalObjectHashAlgorithm: "sha256-canonical-json-v1",
    }),
    terminal,
    sha256Hex: sha256,
  });
  const sourceFileSnapshotAtEnd =
    capturePhaseB1MainWireDistributedDirectNumericalOwnerSnapshotV1();
  assertPhaseB1MainWireDistributedDirectNumericalOwnersUnchangedV1(
    sourceFileSnapshotAtStart,
    sourceFileSnapshotAtEnd,
  );
  assertPhaseB1MainWireDistributedGitSourceReproducibilityUnchangedV1(
    gitSourceReproducibilityAtStart,
    capturePhaseB1MainWireDistributedGitSourceReproducibilityV1(
      resolve("."),
      [reportPath, waveformPath],
    ),
  );
  publishPhaseB1MainWireDistributedArtifactBundleV1({
    reportPath,
    waveformPath,
    bundle,
    sha256Hex: sha256,
    integrityGateBeforeCanonicalRename: () => {
      assertPhaseB1MainWireDistributedDirectNumericalOwnersUnchangedV1(
        sourceFileSnapshotAtStart,
        capturePhaseB1MainWireDistributedDirectNumericalOwnerSnapshotV1(),
      );
      assertPhaseB1MainWireDistributedGitSourceReproducibilityUnchangedV1(
        gitSourceReproducibilityAtStart,
        capturePhaseB1MainWireDistributedGitSourceReproducibilityV1(
          resolve("."),
          [reportPath, waveformPath],
        ),
      );
    },
  });
  process.stdout.write(`${JSON.stringify({
    stage: "complete",
    reportPath,
    waveformPath,
    reportContentSha256: bundle.report.contentSha256,
    waveformContentSha256: bundle.waveform.contentSha256,
  })}\n`);
}

function attemptWithRetryV1(input: Readonly<{
  model: PhaseB1MainWireDistributedResearchModelV1;
  wallMaterialBinding: PhaseB1WallMaterialBindingV1;
  entryEndpoint: PhaseB1MainWireDistributedEndpointV1;
  endTimeSec: number;
  eventsAtEnd: readonly PhaseB1ProjectSyntheticNormalSinusScheduledEventV1[];
  retryDepth: number;
  maximumRetryDepth: number;
  binaryPath: string;
}>): RetryResultV1 {
  const durationSec = input.endTimeSec - input.entryEndpoint.timeSec;
  const step = stepPhaseB1MainWireDistributedMonolithicBackwardEulerV1({
    model: input.model,
    wallMaterialBinding: input.wallMaterialBinding,
    previousEndpoint: input.entryEndpoint,
    dtSec: durationSec,
  });
  if (step.converged === true) {
    const afterEvent = applyDistributedCalciumEventBatchV1(
      step.nextEndpointLeftLimit,
      input.eventsAtEnd,
      input.wallMaterialBinding,
    );
    const evaluation = evaluatePhaseB1MainWireDistributedEndpointV1({
      model: input.model,
      wallMaterialBinding: input.wallMaterialBinding,
      endpoint: afterEvent.endpoint,
    });
    return Object.freeze({
      ok: true as const,
      endpoint: afterEvent.endpoint,
      accepted: Object.freeze([Object.freeze({
        startTimeSec: input.entryEndpoint.timeSec,
        endTimeSec: input.endTimeSec,
        durationSec,
        retryDepth: input.retryDepth,
        binaryPath: input.binaryPath,
        step,
        endpointAfterEvents: afterEvent.endpoint,
        endpointEvaluationAfterEvents: evaluation,
        eventAudit: afterEvent.audit,
      })]),
      subdivisions: 0,
      maximumRetryDepthUsed: input.retryDepth,
    });
  }
  if (!step.retryableByStepSubdivision) {
    return Object.freeze({
      ok: false as const,
      failure: step,
      rollbackEndpoint: input.entryEndpoint,
      subdivisions: 0,
      maximumRetryDepthUsed: input.retryDepth,
    });
  }
  if (input.retryDepth >= input.maximumRetryDepth) {
    return Object.freeze({
      ok: false as const,
      failure: step,
      rollbackEndpoint: input.entryEndpoint,
      subdivisions: 0,
      maximumRetryDepthUsed: input.retryDepth,
    });
  }
  const midpointSec = 0.5 * (input.entryEndpoint.timeSec + input.endTimeSec);
  if (!(midpointSec > input.entryEndpoint.timeSec)
      || !(midpointSec < input.endTimeSec)) {
    return Object.freeze({
      ok: false as const,
      failure: step,
      rollbackEndpoint: input.entryEndpoint,
      subdivisions: 0,
      maximumRetryDepthUsed: input.retryDepth,
    });
  }
  const left = attemptWithRetryV1({
    ...input,
    endTimeSec: midpointSec,
    eventsAtEnd: Object.freeze([]),
    retryDepth: input.retryDepth + 1,
    binaryPath: `${input.binaryPath}L`,
  });
  if (left.ok === false) {
    return Object.freeze({
      ...left,
      rollbackEndpoint: input.entryEndpoint,
      subdivisions: left.subdivisions + 1,
    });
  }
  const right = attemptWithRetryV1({
    ...input,
    entryEndpoint: left.endpoint,
    retryDepth: input.retryDepth + 1,
    binaryPath: `${input.binaryPath}R`,
  });
  if (right.ok === false) {
    return Object.freeze({
      ...right,
      rollbackEndpoint: input.entryEndpoint,
      subdivisions: left.subdivisions + right.subdivisions + 1,
      maximumRetryDepthUsed: Math.max(
        left.maximumRetryDepthUsed,
        right.maximumRetryDepthUsed,
      ),
    });
  }
  return Object.freeze({
    ok: true as const,
    endpoint: right.endpoint,
    accepted: Object.freeze([...left.accepted, ...right.accepted]),
    subdivisions: left.subdivisions + right.subdivisions + 1,
    maximumRetryDepthUsed: Math.max(
      left.maximumRetryDepthUsed,
      right.maximumRetryDepthUsed,
    ),
  });
}

function applyDistributedCalciumEventBatchV1(
  leftLimitEndpoint: PhaseB1MainWireDistributedEndpointV1,
  events: readonly PhaseB1ProjectSyntheticNormalSinusScheduledEventV1[],
  binding: PhaseB1WallMaterialBindingV1,
): Readonly<{
  endpoint: PhaseB1MainWireDistributedEndpointV1;
  audit: PhaseB1MainWireDistributedEventAuditV1;
}> {
  const eventCountByWall = wallRecordV1((wallId) =>
    events.filter((event) => event.wallId === wallId).length);
  let maximumAbsoluteFreeCalciumJumpUM = 0;
  const calciumByWall = wallRecordV1((wallId) => {
    const left = leftLimitEndpoint.differentialState.calciumByWall[wallId];
    const parameters = binding.runtimeByWall[wallId].prescribedCalciumParameters;
    const before = evaluateExactEventCalciumV1([left.r, left.d], parameters)
      .freeCalciumUM;
    let state: readonly [number, number] = Object.freeze([left.r, left.d]);
    for (const scheduled of events.filter((event) => event.wallId === wallId)) {
      state = applyExactCalciumDriveEventV1(
        state,
        Object.freeze({
          eventId: scheduled.calciumDriveEvent.eventId,
          calciumDriveTimeSec:
            scheduled.calciumDriveEvent.calciumDriveTimeSec,
          strength: scheduled.calciumDriveEvent.strength,
          timingOwner: scheduled.calciumDriveEvent.timingOwner,
        }),
      );
    }
    const after = evaluateExactEventCalciumV1(state, parameters).freeCalciumUM;
    maximumAbsoluteFreeCalciumJumpUM = Math.max(
      maximumAbsoluteFreeCalciumJumpUM,
      Math.abs(after - before),
    );
    return Object.freeze({ r: state[0], d: state[1] });
  });
  const freeCalciumContinuityToleranceUM = 128 * Number.EPSILON * Math.max(
    1,
    ...WALL_IDS.map((wallId) => binding.runtimeByWall[wallId]
      .prescribedCalciumParameters.calciumAmplitudeUM),
  );
  if (maximumAbsoluteFreeCalciumJumpUM > freeCalciumContinuityToleranceUM) {
    throw new Error("equal calcium-drive event jump broke free-calcium continuity");
  }
  const source = leftLimitEndpoint.differentialState;
  const differentialState = source.slsMode === "on"
    ? Object.freeze({
        ...source,
        slsMode: "on" as const,
        calciumByWall,
      })
    : Object.freeze({
        ...source,
        slsMode: "off" as const,
        calciumByWall,
      });
  const endpoint = createPhaseB1MainWireDistributedEndpointV1({
    timeSec: leftLimitEndpoint.timeSec,
    differentialState,
    triSegCoordinates: leftLimitEndpoint.triSegCoordinates,
  });
  return Object.freeze({
    endpoint,
    audit: Object.freeze({
      eventKeys: Object.freeze(events.map((event) => event.eventKey)),
      eventCount: events.length,
      eventCountByWall,
      maximumAbsoluteFreeCalciumJumpUM,
      freeCalciumContinuityToleranceUM,
      freeCalciumContinuityPass: true as const,
      nonCalciumDifferentialStateChanged: false as const,
      triSegCoordinatesChanged: false as const,
    }),
  });
}

function buildRequestedBoundariesV1(
  startTimeSec: number,
  endTimeSec: number,
  nominalDtSec: number,
  eventTimesSec: readonly number[],
): readonly number[] {
  const values: number[] = [];
  const maximumNominalIndex = Math.ceil(
    (endTimeSec - startTimeSec) / nominalDtSec,
  );
  for (let index = 1; index <= maximumNominalIndex; index += 1) {
    const value = Math.min(endTimeSec, startTimeSec + index * nominalDtSec);
    if (value > startTimeSec) values.push(value);
  }
  values.push(...eventTimesSec, endTimeSec);
  values.sort((a, b) => a - b);
  const unique: number[] = [];
  for (const value of values) {
    if (value <= startTimeSec || value > endTimeSec) continue;
    if (unique.length === 0 || !Object.is(unique.at(-1), value)) unique.push(value);
  }
  if (!Object.is(unique.at(-1), endTimeSec)) unique.push(endTimeSec);
  for (let index = 1; index < unique.length; index += 1) {
    if (!(unique[index] > unique[index - 1])) {
      throw new Error("distributed requested boundaries are not strictly increasing");
    }
  }
  return Object.freeze(unique);
}

function samplesFromAcceptedIntervalsV1(
  model: PhaseB1MainWireDistributedResearchModelV1,
  binding: PhaseB1WallMaterialBindingV1,
  initialEndpoint: PhaseB1MainWireDistributedEndpointV1,
  accepted: readonly PhaseB1MainWireDistributedAcceptedIntervalV1[],
  cycleStartTimeSec: number,
): readonly PhaseB1MainWireDistributedWaveformSampleV1[] {
  const initialEvaluation = evaluatePhaseB1MainWireDistributedEndpointV1({
    model,
    wallMaterialBinding: binding,
    endpoint: initialEndpoint,
  });
  return Object.freeze([
    sampleFromEvaluationV1(initialEvaluation, cycleStartTimeSec),
    ...accepted.map((interval) => sampleFromEvaluationV1(
      interval.endpointEvaluationAfterEvents,
      cycleStartTimeSec,
    )),
  ]);
}

function sampleFromEvaluationV1(
  evaluation: PhaseB1MainWireDistributedEndpointEvaluationV1,
  cycleStartTimeSec: number,
): PhaseB1MainWireDistributedWaveformSampleV1 {
  return Object.freeze({
    absoluteTimeSec: evaluation.endpoint.timeSec,
    phaseSec: evaluation.endpoint.timeSec - cycleStartTimeSec,
    bloodVolumesM3: copyExactNumericRecordV1(
      evaluation.endpoint.differentialState.bloodVolumesM3,
      MAIN_WIRE_NON_CORONARY_CIRCULATION_NODE_NAMES_V1,
      "bloodVolumesM3",
      true,
    ),
    absolutePressurePaByNode: copyExactNumericRecordV1(
      evaluation.distributedCirculation.absolutePressurePaByNode,
      MAIN_WIRE_NON_CORONARY_CIRCULATION_NODE_NAMES_V1,
      "absolutePressurePaByNode",
      false,
    ),
    allFlowsM3PerSec: copyExactNumericRecordV1(
      evaluation.distributedCirculation.allFlowsM3PerSec,
      MAIN_WIRE_NON_CORONARY_ALL_FLOW_NAMES_V1,
      "allFlowsM3PerSec",
      false,
    ),
  });
}

function validateAndCopySamplesV1(
  samples: readonly PhaseB1MainWireDistributedWaveformSampleV1[],
  cycleStartTimeSec: number,
  cycleLengthSec: number,
): readonly PhaseB1MainWireDistributedWaveformSampleV1[] {
  if (!Array.isArray(samples) || samples.length < 2) {
    throw new Error("main-wire waveform requires at least two samples");
  }
  const expectedCycleEndTimeSec = cycleStartTimeSec + cycleLengthSec;
  const endpointToleranceSec = 64 * Number.EPSILON * Math.max(
    1,
    Math.abs(cycleStartTimeSec),
    Math.abs(expectedCycleEndTimeSec),
    Math.abs(cycleLengthSec),
  );
  const originalFirst = samples[0];
  const originalLast = samples.at(-1)!;
  requireFinite(originalFirst.absoluteTimeSec, "samples[0].absoluteTimeSec");
  requireFinite(originalFirst.phaseSec, "samples[0].phaseSec");
  requireFinite(
    originalLast.absoluteTimeSec,
    `samples[${samples.length - 1}].absoluteTimeSec`,
  );
  requireFinite(
    originalLast.phaseSec,
    `samples[${samples.length - 1}].phaseSec`,
  );
  if (Math.abs(originalFirst.absoluteTimeSec - cycleStartTimeSec)
        > endpointToleranceSec
      || Math.abs(originalFirst.phaseSec) > endpointToleranceSec) {
    throw new Error(
      "main-wire waveform original first sample does not match the declared cycle start",
    );
  }
  if (Math.abs(originalLast.absoluteTimeSec - expectedCycleEndTimeSec)
        > endpointToleranceSec
      || Math.abs(originalLast.phaseSec - cycleLengthSec)
        > endpointToleranceSec) {
    throw new Error(
      "main-wire waveform original last sample does not match the declared cycle end",
    );
  }
  const copy = samples.map((sample, index) => {
    requireFinite(sample.absoluteTimeSec, `samples[${index}].absoluteTimeSec`);
    requireFinite(sample.phaseSec, `samples[${index}].phaseSec`);
    const expectedPhaseSec = sample.absoluteTimeSec - cycleStartTimeSec;
    const phaseToleranceSec = 64 * Number.EPSILON * Math.max(
      1,
      Math.abs(sample.absoluteTimeSec),
      Math.abs(cycleStartTimeSec),
      Math.abs(sample.phaseSec),
    );
    if (Math.abs(sample.phaseSec - expectedPhaseSec) > phaseToleranceSec) {
      throw new Error(
        `samples[${index}] absolute time and phase are inconsistent`,
      );
    }
    if (index > 0 && !(sample.absoluteTimeSec > samples[index - 1].absoluteTimeSec)) {
      throw new Error("main-wire waveform sample times must be strictly increasing");
    }
    return Object.freeze({
      absoluteTimeSec: sample.absoluteTimeSec,
      phaseSec: index === 0
        ? 0
        : index === samples.length - 1
          ? cycleLengthSec
          : sample.phaseSec,
      bloodVolumesM3: copyExactNumericRecordV1(
        sample.bloodVolumesM3,
        MAIN_WIRE_NON_CORONARY_CIRCULATION_NODE_NAMES_V1,
        `samples[${index}].bloodVolumesM3`,
        true,
      ),
      absolutePressurePaByNode: copyExactNumericRecordV1(
        sample.absolutePressurePaByNode,
        MAIN_WIRE_NON_CORONARY_CIRCULATION_NODE_NAMES_V1,
        `samples[${index}].absolutePressurePaByNode`,
        false,
      ),
      allFlowsM3PerSec: copyExactNumericRecordV1(
        sample.allFlowsM3PerSec,
        MAIN_WIRE_NON_CORONARY_ALL_FLOW_NAMES_V1,
        `samples[${index}].allFlowsM3PerSec`,
        false,
      ),
    });
  });
  return Object.freeze(copy);
}

function atrialTraceFromSamplesV1(
  samples: readonly PhaseB1MainWireDistributedWaveformSampleV1[],
  cycleLengthSec: number,
): PhaseB1AtrialPvReadbackTraceV1 {
  return Object.freeze({
    cycleLengthSec,
    samples: Object.freeze(samples.map((sample, index) => Object.freeze({
      phaseSec: index === 0 ? 0 : index === samples.length - 1
        ? cycleLengthSec : sample.phaseSec,
      bloodVolumesM3: Object.freeze({
        LA: sample.bloodVolumesM3.LA,
        RA: sample.bloodVolumesM3.RA,
      }),
      pressuresPa: Object.freeze({
        LA: sample.absolutePressurePaByNode.LA,
        RA: sample.absolutePressurePaByNode.RA,
      }),
      allFlowsM3PerSec: Object.freeze({
        Q_MV: sample.allFlowsM3PerSec.Q_MV,
        Q_TV: sample.allFlowsM3PerSec.Q_TV,
      }),
    }))),
  });
}

function buildAtrialConduitAndLaterRefillV1(
  readback: PhaseB1AtrialPvReservoirConduitReadbackV1,
  samples: readonly PhaseB1MainWireDistributedWaveformSampleV1[],
  cycleLengthSec: number,
): Readonly<Record<"LA" | "RA", unknown>> {
  return Object.freeze(Object.fromEntries((["LA", "RA"] as const).map((atrium) => {
    const result = readback.byAtrium[atrium];
    const conduitMinimum = result.conduitBranch.points.at(-1) ?? null;
    const closure = result.functionalValveLobe.closure?.endpoint ?? null;
    if (conduitMinimum === null || closure === null) {
      return [atrium, Object.freeze({
        status: "unresolved",
        sourceReadbackStatus: result.status,
        sourceConduitBranchStatus: result.conduitBranch.status,
        sourceReasons: result.reasons,
        earlyConduitMinimum: null,
        maximumLaterRefill: null,
        laterRefillIncreaseM3: null,
        laterRefillVolumeIncreaseObserved: null,
      })];
    }
    const start = conduitMinimum.phaseSec;
    const closureWrapsCycle = closure.phaseSec <= start;
    const rightCensoredAtCycleEnd = closureWrapsCycle
      && !readback.periodicity.formalPeriodOneConvergencePass;
    const end = rightCensoredAtCycleEnd
      ? cycleLengthSec
      : unwrapPhaseAfterV1(start, closure.phaseSec, cycleLengthSec);
    const candidates = [conduitMinimum, ...samples.map((sample) => Object.freeze({
      phaseSec: rightCensoredAtCycleEnd
        ? sample.phaseSec
        : unwrapPhaseAfterOrEqualV1(start, sample.phaseSec, cycleLengthSec),
      volumeM3: sample.bloodVolumesM3[atrium],
      pressurePa: sample.absolutePressurePaByNode[atrium],
    })).filter((sample) => sample.phaseSec > start && sample.phaseSec <= end)];
    if (!rightCensoredAtCycleEnd) {
      candidates.push(Object.freeze({
        phaseSec: end,
        volumeM3: closure.volumeM3,
        pressurePa: closure.pressurePa,
      }));
    }
    const maximumLaterRefill = candidates.reduce((maximum, sample) =>
      sample.volumeM3 > maximum.volumeM3 ? sample : maximum);
    const increase = maximumLaterRefill.volumeM3 - conduitMinimum.volumeM3;
    const strictEarlyConduitDecreaseResolved =
      result.conduitBranch.status === "resolved"
      && result.conduitBranch.strictlyMonotone;
    return [atrium, Object.freeze({
      status: rightCensoredAtCycleEnd
        ? "diagnostic-right-censored"
        : strictEarlyConduitDecreaseResolved
          ? "resolved"
          : "diagnostic-ambiguous",
      sourceReadbackStatus: result.status,
      sourceConduitBranchStatus: result.conduitBranch.status,
      sourceReasons: result.reasons,
      strictEarlyConduitDecreaseResolved,
      earlyConduitMinimum: conduitMinimum,
      maximumLaterRefill,
      laterRefillIncreaseM3: increase,
      laterRefillVolumeIncreaseObserved: increase > 0,
      rightCensoredAtCycleEnd,
      observationEndPhaseSec: end,
      intervalDefinition: rightCensoredAtCycleEnd
        ? "first-post-opening-conduit-minimum-through-observed-cycle-end"
        : "first-post-opening-conduit-minimum-through-functional-av-closure",
      shapeFitOrGateUsed: false,
    })];
  }))) as Readonly<Record<"LA" | "RA", unknown>>;
}

function buildAtrialPostOpeningMassBalanceDiagnosticV1(
  readback: PhaseB1AtrialPvReservoirConduitReadbackV1,
  samples: readonly PhaseB1MainWireDistributedWaveformSampleV1[],
  cycleLengthSec: number,
): Readonly<Record<"LA" | "RA", unknown>> {
  return Object.freeze(Object.fromEntries(([
    Object.freeze({
      atrium: "LA" as const,
      venousFlowId: "PVein_LA" as const,
      avFlowId: "Q_MV" as const,
    }),
    Object.freeze({
      atrium: "RA" as const,
      venousFlowId: "VC_RA" as const,
      avFlowId: "Q_TV" as const,
    }),
  ] as const).map(({ atrium, venousFlowId, avFlowId }) => {
    const atrialReadback = readback.byAtrium[atrium];
    const opening = atrialReadback.functionalValveLobe.opening?.endpoint ?? null;
    if (opening === null || !(opening.phaseSec < cycleLengthSec)) {
      return [atrium, Object.freeze({
        status: "unresolved" as const,
        sourceReadbackStatus: atrialReadback.status,
        sourceReasons: atrialReadback.reasons,
        venousFlowId,
        avFlowId,
        intervalStartPhaseSec: null,
        intervalEndPhaseSec: cycleLengthSec,
        rightCensoredAtCycleEnd: true as const,
        formalPeriodOne: false as const,
      })];
    }
    const first = interpolateAtrialMassBalancePointV1(
      samples,
      opening.phaseSec,
      atrium,
      venousFlowId,
      avFlowId,
    );
    const points = [
      first,
      ...samples.filter((sample) =>
        sample.phaseSec > opening.phaseSec
          && sample.phaseSec <= cycleLengthSec).map((sample) => Object.freeze({
        phaseSec: sample.phaseSec,
        volumeM3: sample.bloodVolumesM3[atrium],
        venousFlowM3PerSec: sample.allFlowsM3PerSec[venousFlowId],
        avOutflowM3PerSec: sample.allFlowsM3PerSec[avFlowId],
      })),
    ];
    if (points.at(-1)!.phaseSec < cycleLengthSec) {
      points.push(interpolateAtrialMassBalancePointV1(
        samples,
        cycleLengthSec,
        atrium,
        venousFlowId,
        avFlowId,
      ));
    }
    let trapezoidalVenousInflowVolumeM3 = 0;
    let trapezoidalAvOutflowVolumeM3 = 0;
    for (let index = 0; index < points.length - 1; index += 1) {
      const left = points[index];
      const right = points[index + 1];
      const dtSec = right.phaseSec - left.phaseSec;
      trapezoidalVenousInflowVolumeM3 += 0.5 * (
        left.venousFlowM3PerSec + right.venousFlowM3PerSec
      ) * dtSec;
      trapezoidalAvOutflowVolumeM3 += 0.5 * (
        left.avOutflowM3PerSec + right.avOutflowM3PerSec
      ) * dtSec;
    }
    const observedAtrialVolumeChangeM3 =
      points.at(-1)!.volumeM3 - points[0].volumeM3;
    const netIntegratedInflowMinusOutflowM3 =
      trapezoidalVenousInflowVolumeM3 - trapezoidalAvOutflowVolumeM3;
    const trapezoidalDiscreteMassBalanceClosureErrorM3 =
      observedAtrialVolumeChangeM3 - netIntegratedInflowMinusOutflowM3;
    return [atrium, Object.freeze({
      status: "resolved-right-censored" as const,
      sourceReadbackStatus: atrialReadback.status,
      venousFlowId,
      avFlowId,
      intervalStartPhaseSec: opening.phaseSec,
      intervalEndPhaseSec: cycleLengthSec,
      intervalDurationSec: cycleLengthSec - opening.phaseSec,
      rightCensoredAtCycleEnd: true as const,
      formalPeriodOne: false as const,
      integrationRule: "piecewise-linear-trapezoidal-on-waveform-samples-v1",
      volumeBalanceConvention: "deltaV=integral(Qvenous-Qav)dt",
      trapezoidalVenousInflowVolumeM3,
      trapezoidalAvOutflowVolumeM3,
      netIntegratedInflowMinusOutflowM3,
      observedAtrialVolumeChangeM3,
      trapezoidalDiscreteMassBalanceClosureErrorM3,
      absoluteTrapezoidalDiscreteMassBalanceClosureErrorM3:
        Math.abs(trapezoidalDiscreteMassBalanceClosureErrorM3),
      shapeFitOrGateUsed: false as const,
    })];
  }))) as Readonly<Record<"LA" | "RA", unknown>>;
}

function interpolateAtrialMassBalancePointV1(
  samples: readonly PhaseB1MainWireDistributedWaveformSampleV1[],
  phaseSec: number,
  atrium: "LA" | "RA",
  venousFlowId: "PVein_LA" | "VC_RA",
  avFlowId: "Q_MV" | "Q_TV",
): Readonly<{
  phaseSec: number;
  volumeM3: number;
  venousFlowM3PerSec: number;
  avOutflowM3PerSec: number;
}> {
  const upperIndex = samples.findIndex((sample) => sample.phaseSec >= phaseSec);
  if (upperIndex < 0) {
    throw new Error("atrial mass-balance phase lies beyond the waveform");
  }
  const upper = samples[upperIndex];
  if (upperIndex === 0 || Object.is(upper.phaseSec, phaseSec)) {
    return Object.freeze({
      phaseSec,
      volumeM3: upper.bloodVolumesM3[atrium],
      venousFlowM3PerSec: upper.allFlowsM3PerSec[venousFlowId],
      avOutflowM3PerSec: upper.allFlowsM3PerSec[avFlowId],
    });
  }
  const lower = samples[upperIndex - 1];
  const fraction = (phaseSec - lower.phaseSec)
    / (upper.phaseSec - lower.phaseSec);
  const interpolate = (first: number, second: number) =>
    first + fraction * (second - first);
  return Object.freeze({
    phaseSec,
    volumeM3: interpolate(
      lower.bloodVolumesM3[atrium],
      upper.bloodVolumesM3[atrium],
    ),
    venousFlowM3PerSec: interpolate(
      lower.allFlowsM3PerSec[venousFlowId],
      upper.allFlowsM3PerSec[venousFlowId],
    ),
    avOutflowM3PerSec: interpolate(
      lower.allFlowsM3PerSec[avFlowId],
      upper.allFlowsM3PerSec[avFlowId],
    ),
  });
}

function buildChamberPvClosedPolygonDiagnosticV1(
  samples: readonly PhaseB1MainWireDistributedWaveformSampleV1[],
): Readonly<Record<
  "LA" | "LV" | "RA" | "RV",
  PhaseB1MainWireDistributedChamberPvClosedPolygonDiagnosticV1
>> {
  return Object.freeze(Object.fromEntries((["LA", "LV", "RA", "RV"] as const)
    .map((chamber) => {
      let observedOpenPathIntegralPdvPaM3 = 0;
      let observedOpenPathSignedShoelaceAreaPaM3 = 0;
      for (let index = 0; index < samples.length - 1; index += 1) {
        const first = samples[index];
        const second = samples[index + 1];
        observedOpenPathIntegralPdvPaM3 += 0.5 * (
          first.absolutePressurePaByNode[chamber]
            + second.absolutePressurePaByNode[chamber]
        ) * (
          second.bloodVolumesM3[chamber]
            - first.bloodVolumesM3[chamber]
        );
        observedOpenPathSignedShoelaceAreaPaM3 += 0.5 * (
          first.bloodVolumesM3[chamber]
            * second.absolutePressurePaByNode[chamber]
          - second.bloodVolumesM3[chamber]
            * first.absolutePressurePaByNode[chamber]
        );
      }
      const first = samples[0];
      const last = samples.at(-1)!;
      const closingChordContributionPdvPaM3 = 0.5 * (
        last.absolutePressurePaByNode[chamber]
          + first.absolutePressurePaByNode[chamber]
      ) * (
        first.bloodVolumesM3[chamber]
          - last.bloodVolumesM3[chamber]
      );
      const closingChordSignedShoelaceAreaPaM3 = 0.5 * (
        last.bloodVolumesM3[chamber]
          * first.absolutePressurePaByNode[chamber]
        - first.bloodVolumesM3[chamber]
          * last.absolutePressurePaByNode[chamber]
      );
      const signedShoelaceAreaPaM3 =
        observedOpenPathSignedShoelaceAreaPaM3
        + closingChordSignedShoelaceAreaPaM3;
      const closedPolygonIntegralPdvPaM3 =
        observedOpenPathIntegralPdvPaM3
        + closingChordContributionPdvPaM3;
      const identityTolerance = 256 * Number.EPSILON * Math.max(
        1,
        Math.abs(closedPolygonIntegralPdvPaM3),
        Math.abs(signedShoelaceAreaPaM3),
      );
      if (Math.abs(closedPolygonIntegralPdvPaM3 + signedShoelaceAreaPaM3)
          > identityTolerance) {
        throw new Error(
          `closed-polygon P-dV/shoelace identity drifted for ${chamber}`,
        );
      }
      return [chamber, Object.freeze({
        observedOpenPathIntegralPdvPaM3,
        closingChordContributionPdvPaM3,
        closedPolygonIntegralPdvPaM3,
        signedShoelaceAreaPaM3,
        absoluteShoelaceAreaPaM3: Math.abs(signedShoelaceAreaPaM3),
        closingChordApplied: true as const,
        formalPeriodOne: false as const,
        physiologicalLoopWorkClaimed: false as const,
      })];
    }))) as Readonly<Record<
      "LA" | "LV" | "RA" | "RV",
      PhaseB1MainWireDistributedChamberPvClosedPolygonDiagnosticV1
    >>;
}

function buildWaveformSummaryV1(
  samples: readonly PhaseB1MainWireDistributedWaveformSampleV1[],
): Readonly<Record<string, unknown>> {
  return Object.freeze({
    sampleCount: samples.length,
    totalBloodVolume: summarizeTbvV1(samples),
    volumeByNodeM3: summarizeRecordSeriesV1(
      MAIN_WIRE_NON_CORONARY_CIRCULATION_NODE_NAMES_V1,
      samples,
      (sample, key) => sample.bloodVolumesM3[key],
    ),
    absolutePressureByNodePa: summarizeRecordSeriesV1(
      MAIN_WIRE_NON_CORONARY_CIRCULATION_NODE_NAMES_V1,
      samples,
      (sample, key) => sample.absolutePressurePaByNode[key],
    ),
    flowByEdgeM3PerSec: summarizeRecordSeriesV1(
      MAIN_WIRE_NON_CORONARY_ALL_FLOW_NAMES_V1,
      samples,
      (sample, key) => sample.allFlowsM3PerSec[key],
    ),
  });
}

export function buildPhaseB1MainWireDistributedCycleTrendSummaryV1(
  samples: readonly PhaseB1MainWireDistributedWaveformSampleV1[],
  cycleLengthSec: number,
  sha256Hex: CanonicalSha256HexProvider,
): Readonly<Record<string, unknown>> {
  const canonicalSamples = validateAndCopySamplesV1(
    samples,
    samples[0]?.absoluteTimeSec ?? Number.NaN,
    cycleLengthSec,
  );
  const readback = buildPhaseB1AtrialPvReservoirConduitReadbackV1({
    trace: atrialTraceFromSamplesV1(canonicalSamples, cycleLengthSec),
    formalPeriodOneConvergencePass: false,
    sha256Hex,
  });
  const selectedVolumeNodes = Object.freeze(["LA", "LV", "RA", "RV"] as const);
  const selectedPressureNodes = Object.freeze([
    "LA", "LV", "Ao", "PVein", "RA", "RV", "PA", "VC",
  ] as const);
  const selectedFlows = Object.freeze([
    "Q_MV", "Q_AoV", "PVein_LA", "Q_TV", "Q_PuV", "VC_RA",
  ] as const);
  return Object.freeze({
    atrialRightCensoredConduitAndLaterRefill:
      buildAtrialConduitAndLaterRefillV1(
        readback,
        canonicalSamples,
        cycleLengthSec,
      ),
    atrialPostOpeningMassBalanceDiagnostic:
      buildAtrialPostOpeningMassBalanceDiagnosticV1(
        readback,
        canonicalSamples,
        cycleLengthSec,
      ),
    chamberPvClosedPolygonDiagnosticPaM3:
      buildChamberPvClosedPolygonDiagnosticV1(canonicalSamples),
    selectedWaveformSummary: Object.freeze({
      volumeByChamberM3: summarizeRecordSeriesV1(
        selectedVolumeNodes,
        canonicalSamples,
        (sample, key) => sample.bloodVolumesM3[key],
      ),
      absolutePressureBySelectedNodePa: summarizeRecordSeriesV1(
        selectedPressureNodes,
        canonicalSamples,
        (sample, key) => sample.absolutePressurePaByNode[key],
      ),
      flowBySelectedEdgeM3PerSec: summarizeRecordSeriesV1(
        selectedFlows,
        canonicalSamples,
        (sample, key) => sample.allFlowsM3PerSec[key],
      ),
    }),
  });
}

function summarizeTbvV1(
  samples: readonly PhaseB1MainWireDistributedWaveformSampleV1[],
): Readonly<{
  initialM3: number;
  minimumM3: number;
  maximumM3: number;
  maximumRelativeDrift: number;
}> {
  const totals = samples.map((sample) => MAIN_WIRE_NON_CORONARY_CIRCULATION_NODE_NAMES_V1
    .reduce((sum, node) => sum + sample.bloodVolumesM3[node], 0));
  const initialM3 = totals[0];
  return Object.freeze({
    initialM3,
    minimumM3: Math.min(...totals),
    maximumM3: Math.max(...totals),
    maximumRelativeDrift: Math.max(...totals.map((value) =>
      Math.abs(value - initialM3) / initialM3)),
  });
}

function summarizeAcceptedTimeStepSecV1(
  accepted: readonly PhaseB1MainWireDistributedAcceptedIntervalV1[],
): Readonly<{ minimum: number | null; maximum: number | null }> {
  if (accepted.length === 0) {
    return Object.freeze({ minimum: null, maximum: null });
  }
  const values = accepted.map((interval) => requirePositiveFinite(
    interval.durationSec,
    "accepted interval durationSec",
  ));
  return Object.freeze({
    minimum: Math.min(...values),
    maximum: Math.max(...values),
  });
}

function summarizeMinimumVascularPvDomainMarginM3V1(
  accepted: readonly PhaseB1MainWireDistributedAcceptedIntervalV1[],
): number | null {
  return accepted.length === 0
    ? null
    : Math.min(...accepted.map((interval) => requirePositiveFinite(
        interval.step.minimumVascularPvDomainMarginM3,
        "accepted interval minimum vascular PV-domain margin",
      )));
}

function summarizeRecordSeriesV1<Key extends string>(
  keys: readonly Key[],
  samples: readonly PhaseB1MainWireDistributedWaveformSampleV1[],
  read: (sample: PhaseB1MainWireDistributedWaveformSampleV1, key: Key) => number,
): Readonly<Record<Key, Readonly<{ minimum: number; maximum: number; mean: number }>>> {
  return Object.freeze(Object.fromEntries(keys.map((key) => {
    const values = samples.map((sample) => read(sample, key));
    let timeIntegral = 0;
    for (let index = 0; index < samples.length - 1; index += 1) {
      const dtSec = samples[index + 1].absoluteTimeSec
        - samples[index].absoluteTimeSec;
      timeIntegral += 0.5 * (values[index] + values[index + 1]) * dtSec;
    }
    const durationSec = samples.at(-1)!.absoluteTimeSec
      - samples[0].absoluteTimeSec;
    return [key, Object.freeze({
      minimum: Math.min(...values),
      maximum: Math.max(...values),
      mean: timeIntegral / durationSec,
    })];
  }))) as Readonly<Record<Key, Readonly<{
    minimum: number;
    maximum: number;
    mean: number;
  }>>>;
}

function distanceScaleV1(label: string, first: number, second: number): number {
  if (label.startsWith("circulation.main-wire.volume.")) {
    return Math.max(1e-6, Math.abs(first), Math.abs(second));
  }
  if (label.startsWith("circulation.main-wire.dynamic-flow.")) return 100e-6;
  if (label.startsWith("circulation.main-wire.valve-aperture.")) return 1;
  if (label.includes(".calcium.") || /\.land\.(CaTRPN|B|W|S)$/.test(label)) {
    return 1;
  }
  if (/\.land\.xi[WS]$/.test(label)) return 0.1;
  if (label.endsWith(".sls.alphaV")) return 0.1;
  if (label === "algebraic.triseg.V_m_S") return 10e-6;
  if (label === "algebraic.triseg.y_m") return 0.03;
  throw new Error(`distributed endpoint distance lacks a scale for ${label}`);
}

function copyExactNumericRecordV1<Key extends string>(
  record: Readonly<Record<Key, number>>,
  keys: readonly Key[],
  field: string,
  positive: boolean,
): Readonly<Record<Key, number>> {
  const actual = Object.keys(record);
  if (actual.length !== keys.length || actual.some((key) => !keys.includes(key as Key))) {
    throw new Error(`${field} does not contain its exact declared keys`);
  }
  return Object.freeze(Object.fromEntries(keys.map((key) => {
    const value = positive
      ? requirePositiveFinite(record[key], `${field}.${key}`)
      : requireFinite(record[key], `${field}.${key}`);
    return [key, value];
  }))) as Readonly<Record<Key, number>>;
}

function wallRecordV1<Value>(
  read: (wallId: FourChamberWallId) => Value,
): Readonly<Record<FourChamberWallId, Value>> {
  return Object.freeze(Object.fromEntries(WALL_IDS.map((wallId) => [
    wallId,
    read(wallId),
  ]))) as Readonly<Record<FourChamberWallId, Value>>;
}

function unwrapPhaseAfterV1(start: number, phase: number, cycle: number): number {
  return phase > start ? phase : phase + cycle;
}

function unwrapPhaseAfterOrEqualV1(start: number, phase: number, cycle: number): number {
  return phase >= start ? phase : phase + cycle;
}

export function removePhaseB1MainWireDistributedCanonicalArtifactPairV1(
  reportPath: string,
  waveformPath: string,
): void {
  assertDistinctArtifactPathsV1(reportPath, waveformPath);
  rmSync(reportPath, { force: true });
  rmSync(waveformPath, { force: true });
}

export function publishPhaseB1MainWireDistributedArtifactBundleV1(
  input: Readonly<{
    reportPath: string;
    waveformPath: string;
    bundle: Readonly<{
      report: PhaseB1MainWireDistributedReportV1;
      waveform: PhaseB1MainWireDistributedWaveformV1;
    }>;
    sha256Hex: CanonicalSha256HexProvider;
    integrityGateBeforeCanonicalRename?: () => void;
  }>,
): void {
  const reportPath = resolve(input.reportPath);
  const waveformPath = resolve(input.waveformPath);
  assertDistinctArtifactPathsV1(reportPath, waveformPath);
  removePhaseB1MainWireDistributedCanonicalArtifactPairV1(
    reportPath,
    waveformPath,
  );
  mkdirSync(dirname(reportPath), { recursive: true });
  mkdirSync(dirname(waveformPath), { recursive: true });
  const runId = `${process.pid}-${Date.now()}-${randomUUID()}`;
  const temporaryReportPath = `${reportPath}.${runId}.tmp`;
  const temporaryWaveformPath = `${waveformPath}.${runId}.tmp`;
  try {
    validatePhaseB1MainWireDistributedArtifactBundleV1(
      input.bundle.report,
      input.bundle.waveform,
      input.sha256Hex,
    );
    writeJson(temporaryReportPath, input.bundle.report, true);
    writeJson(temporaryWaveformPath, input.bundle.waveform, true);
    const temporaryReport = readJsonArtifactV1<PhaseB1MainWireDistributedReportV1>(
      temporaryReportPath,
    );
    const temporaryWaveform =
      readJsonArtifactV1<PhaseB1MainWireDistributedWaveformV1>(
        temporaryWaveformPath,
      );
    validatePhaseB1MainWireDistributedArtifactBundleV1(
      temporaryReport,
      temporaryWaveform,
      input.sha256Hex,
    );
    assertCanonicalValueEqualV1(
      temporaryReport,
      input.bundle.report,
      input.sha256Hex,
      "temporary main-wire distributed report readback",
    );
    assertCanonicalValueEqualV1(
      temporaryWaveform,
      input.bundle.waveform,
      input.sha256Hex,
      "temporary main-wire distributed waveform readback",
    );
    input.integrityGateBeforeCanonicalRename?.();
    renameSync(temporaryReportPath, reportPath);
    input.integrityGateBeforeCanonicalRename?.();
    renameSync(temporaryWaveformPath, waveformPath);
    const canonicalReport = readJsonArtifactV1<PhaseB1MainWireDistributedReportV1>(
      reportPath,
    );
    const canonicalWaveform =
      readJsonArtifactV1<PhaseB1MainWireDistributedWaveformV1>(waveformPath);
    validatePhaseB1MainWireDistributedArtifactBundleV1(
      canonicalReport,
      canonicalWaveform,
      input.sha256Hex,
    );
    assertCanonicalValueEqualV1(
      canonicalReport,
      input.bundle.report,
      input.sha256Hex,
      "canonical main-wire distributed report readback",
    );
    assertCanonicalValueEqualV1(
      canonicalWaveform,
      input.bundle.waveform,
      input.sha256Hex,
      "canonical main-wire distributed waveform readback",
    );
  } catch (error) {
    rmSync(temporaryReportPath, { force: true });
    rmSync(temporaryWaveformPath, { force: true });
    removePhaseB1MainWireDistributedCanonicalArtifactPairV1(
      reportPath,
      waveformPath,
    );
    throw error;
  }
}

function assertDistinctArtifactPathsV1(
  reportPath: string,
  waveformPath: string,
): void {
  if (resolve(reportPath) === resolve(waveformPath)) {
    throw new Error("report and waveform canonical paths must be distinct");
  }
}

function readJsonArtifactV1<Value>(path: string): Value {
  return JSON.parse(readFileSync(path, "utf8")) as Value;
}

function writeJson(path: string, value: unknown, exclusive = false): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(
    path,
    `${JSON.stringify(value, null, 2)}\n`,
    exclusive ? { encoding: "utf8", flag: "wx" } : "utf8",
  );
}

function sha256(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

function sha256FileAtRootV1(repositoryRoot: string, relativePath: string): string {
  return createHash("sha256")
    .update(readFileSync(resolve(repositoryRoot, relativePath)))
    .digest("hex");
}

function sha256BytesV1(input: Uint8Array): string {
  return createHash("sha256").update(input).digest("hex");
}

function gitTextV1(repositoryRoot: string, arguments_: readonly string[]): string {
  return execFileSync("git", arguments_, {
    cwd: repositoryRoot,
    encoding: "utf8",
  }).trim();
}

function parsePositiveEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  return raw === undefined ? fallback : requirePositiveFinite(Number(raw), name);
}

function parseFiniteEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  return raw === undefined ? fallback : requireFinite(Number(raw), name);
}

function parsePositiveIntegerEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  return raw === undefined ? fallback : requirePositiveInteger(Number(raw), name);
}

function parseNonNegativeIntegerEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  return raw === undefined ? fallback : requireNonNegativeInteger(Number(raw), name);
}

function parseAtrialLandKinematicClosureEnv(
  name: string,
  fallback: PhaseB1AtrialLandKinematicClosureV1,
): PhaseB1AtrialLandKinematicClosureV1 {
  const value = process.env[name] ?? fallback;
  if (value !== "population-only" && value !== "source-distortion-control") {
    throw new Error(`${name} must be population-only or source-distortion-control`);
  }
  return value;
}

function requireNonEmptyString(value: string, field: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${field} must be a non-empty string`);
  }
  return value;
}

function requireFinite(value: number, field: string): number {
  if (!Number.isFinite(value)) throw new Error(`${field} must be finite`);
  return value;
}

function requirePositiveFinite(value: number, field: string): number {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${field} must be positive and finite`);
  }
  return value;
}

function requireNonNegativeFinite(value: number, field: string): number {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${field} must be non-negative and finite`);
  }
  return value;
}

function requirePositiveInteger(value: number, field: string): number {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error(`${field} must be a positive safe integer`);
  }
  return value;
}

function requireNonNegativeInteger(value: number, field: string): number {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(`${field} must be a non-negative safe integer`);
  }
  return value;
}

function requireSlsModeV1(value: unknown, field: string): "on" | "off" {
  if (value !== "on" && value !== "off") {
    throw new Error(`${field} must be \"on\" or \"off\"`);
  }
  return value;
}
