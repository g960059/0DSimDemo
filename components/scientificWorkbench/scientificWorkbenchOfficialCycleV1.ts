import type {
  MainWireScientificWorkspaceDocumentV1,
} from "@/engine/scientific/documents";
import {
  OFFICIAL_HEALTHY_PERIODIC_CHECKPOINT_PRESET_V1_ID,
  OFFICIAL_HEALTHY_PERIODIC_CHECKPOINT_PRESET_V1_VERSION,
  type BundledOfficialHealthyPeriodicPresetIdentityV1,
} from "@/engine/scientific/presets";
import {
  canonicalJsonStringify,
  sameSimulationReleaseRef,
  type SimulationReleaseRef,
} from "@/engine/scientific/release";
import type {
  ScientificSessionOriginV1,
} from "@/engine/scientific/worker";
import {
  SCIENTIFIC_COMMAND_PROTOCOL_V1_ID,
} from "@/engine/scientific/worker";
import {
  MainWireScientificWorkerClientV1,
  loadBundledOfficialHealthyPeriodicWorkspaceDocumentV1,
  type LoadedBundledOfficialHealthyPeriodicWorkspaceDocumentV1,
} from "@/engine/scientificBrowser";

import {
  SCIENTIFIC_WORKBENCH_TERMINAL_CYCLE_V1,
  assembleScientificWorkbenchTerminalCycleV1,
  type ScientificWorkbenchTerminalCycleV1,
} from "./scientificWorkbenchTerminalCycleV1";

type OfficialDocumentCaseOriginV1 = Extract<
  ScientificSessionOriginV1,
  Readonly<{
    kind: "official-document-case-v3-exact-checkpoint-restore";
  }>
>;

export type ScientificWorkbenchOfficialCycleV1 = Readonly<{
  workspaceDocument: MainWireScientificWorkspaceDocumentV1;
  terminalCycle: ScientificWorkbenchTerminalCycleV1;
  sessionOrigin: OfficialDocumentCaseOriginV1;
  evidence: Readonly<{
    bundledDocumentChainVerified: true;
    workerRestoredExactV3Case: true;
    workerAndPageDocumentRefsMatch: true;
    terminalPeriod1ConfirmedWithoutAdvancingState: true;
    followingCompleteCycleCaptured: true;
    clinicalValidationClaimed: false;
  }>;
}>;

export type ScientificWorkbenchOfficialCycleLoaderOptionsV1 = Readonly<{
  sessionId: string;
  bundleLoader?: (
    identity: BundledOfficialHealthyPeriodicPresetIdentityV1,
  ) => Promise<LoadedBundledOfficialHealthyPeriodicWorkspaceDocumentV1>;
}>;

export class ScientificWorkbenchOfficialCycleLoadErrorV1 extends Error {
  readonly stage:
    | "bundle-verification"
    | "worker-restore"
    | "period1-confirmation"
    | "terminal-cycle-capture";

  constructor(
    stage: ScientificWorkbenchOfficialCycleLoadErrorV1["stage"],
    message: string,
  ) {
    super(`scientific workbench ${stage} failed: ${message}`);
    this.name = "ScientificWorkbenchOfficialCycleLoadErrorV1";
    this.stage = stage;
  }
}

/**
 * Loads one immutable WorkspaceDocument and captures exactly one cycle from
 * the matching Worker-restored V3 state. The browser never supplies release,
 * case, checkpoint, or parameter bytes to the Worker command.
 */
export async function loadScientificWorkbenchOfficialCycleV1(
  client: Pick<MainWireScientificWorkerClientV1, "request">,
  options: ScientificWorkbenchOfficialCycleLoaderOptionsV1,
): Promise<ScientificWorkbenchOfficialCycleV1> {
  assertPortableSessionId(options.sessionId);
  const identity = Object.freeze({
    presetId: OFFICIAL_HEALTHY_PERIODIC_CHECKPOINT_PRESET_V1_ID,
    presetVersion: OFFICIAL_HEALTHY_PERIODIC_CHECKPOINT_PRESET_V1_VERSION,
  });
  let bundle: LoadedBundledOfficialHealthyPeriodicWorkspaceDocumentV1;
  try {
    bundle = await (options.bundleLoader
      ?? loadBundledOfficialHealthyPeriodicWorkspaceDocumentV1)(identity);
  } catch (error) {
    throw new ScientificWorkbenchOfficialCycleLoadErrorV1(
      "bundle-verification",
      errorMessage(error),
    );
  }

  const created = await client.request({
    protocolId: SCIENTIFIC_COMMAND_PROTOCOL_V1_ID,
    kind: "createOfficialDocumentCaseSession",
    requestId: `${options.sessionId}:create`,
    sessionId: options.sessionId,
    ...identity,
  });
  if (!created.ok) {
    throw new ScientificWorkbenchOfficialCycleLoadErrorV1(
      "worker-restore",
      `${created.error.code}: ${created.error.message}`,
    );
  }
  if (
    created.commandKind !== "createOfficialDocumentCaseSession"
    || created.payload.kind !== "officialDocumentCaseSessionCreated"
    || created.sessionOrigin.kind
      !== "official-document-case-v3-exact-checkpoint-restore"
  ) {
    throw new ScientificWorkbenchOfficialCycleLoadErrorV1(
      "worker-restore",
      "Worker returned a different command, payload, or session origin",
    );
  }
  const origin = created.sessionOrigin;
  try {
    assertWorkerBundleIdentity(
      bundle,
      created.releaseRef,
      created.payload,
      origin,
    );
  } catch (error) {
    throw new ScientificWorkbenchOfficialCycleLoadErrorV1(
      "worker-restore",
      errorMessage(error),
    );
  }

  const settled = await client.request({
    protocolId: SCIENTIFIC_COMMAND_PROTOCOL_V1_ID,
    kind: "settlePeriodic",
    requestId: `${options.sessionId}:confirm-p1`,
    sessionId: options.sessionId,
  });
  if (!settled.ok) {
    throw new ScientificWorkbenchOfficialCycleLoadErrorV1(
      "period1-confirmation",
      `${settled.error.code}: ${settled.error.message}`,
    );
  }
  if (
    settled.commandKind !== "settlePeriodic"
    || settled.payload.kind !== "periodic-settlement-progress"
    || settled.payload.status !== "period1-converged"
    || !settled.payload.periodicSteadyStateClaimed
    || settled.payload.period2OrbitSuspected
    || settled.payload.beatCompletedThisCall
    || settled.payload.completedStepCountThisCall !== 0
    || settled.payload.anchorPhase01 !== 0
    || settled.payload.executionProtocol.cycleLengthSec
      !== SCIENTIFIC_WORKBENCH_TERMINAL_CYCLE_V1.cycleLengthSec
    || settled.payload.executionProtocol.dtSec
      !== SCIENTIFIC_WORKBENCH_TERMINAL_CYCLE_V1.dtSec
    || settled.payload.executionProtocol.stepsPerBeat
      !== SCIENTIFIC_WORKBENCH_TERMINAL_CYCLE_V1.stepCount
    || !sameFrameIdentity(
      created.payload.observableFrame,
      settled.payload.finalObservableFrame,
    )
  ) {
    throw new ScientificWorkbenchOfficialCycleLoadErrorV1(
      "period1-confirmation",
      "exact V3 restore was not a terminal P1 boundary without state advance",
    );
  }

  const acceptedStepFrames: Array<
    ScientificWorkbenchTerminalCycleV1["frames"][number]
  > = [];
  let capturedFinalFrame = created.payload.observableFrame;
  for (
    let commandIndex = 0;
    commandIndex
      < SCIENTIFIC_WORKBENCH_TERMINAL_CYCLE_V1.workerCommandCount;
    commandIndex += 1
  ) {
    const captured = await client.request({
      protocolId: SCIENTIFIC_COMMAND_PROTOCOL_V1_ID,
      kind: "runTransient",
      requestId:
        `${options.sessionId}:capture-${String(commandIndex + 1).padStart(3, "0")}`,
      sessionId: options.sessionId,
      dtSec: SCIENTIFIC_WORKBENCH_TERMINAL_CYCLE_V1.dtSec,
      stepCount:
        SCIENTIFIC_WORKBENCH_TERMINAL_CYCLE_V1.stepsPerWorkerCommand,
      observationStride:
        SCIENTIFIC_WORKBENCH_TERMINAL_CYCLE_V1.observationStride,
    });
    if (!captured.ok) {
      throw new ScientificWorkbenchOfficialCycleLoadErrorV1(
        "terminal-cycle-capture",
        `${captured.error.code}: ${captured.error.message}`,
      );
    }
    if (
      captured.commandKind !== "runTransient"
      || captured.payload.kind !== "transientCompleted"
      || captured.payload.requestedStepCount
        !== SCIENTIFIC_WORKBENCH_TERMINAL_CYCLE_V1.stepsPerWorkerCommand
      || captured.payload.completedStepCount
        !== SCIENTIFIC_WORKBENCH_TERMINAL_CYCLE_V1.stepsPerWorkerCommand
      || captured.payload.observableFrames.length
        !== SCIENTIFIC_WORKBENCH_TERMINAL_CYCLE_V1.stepsPerWorkerCommand
      || captured.payload.executionProtocol.dtSec
        !== SCIENTIFIC_WORKBENCH_TERMINAL_CYCLE_V1.dtSec
      || captured.payload.executionProtocol.observationPolicy.stride
        !== SCIENTIFIC_WORKBENCH_TERMINAL_CYCLE_V1.observationStride
    ) {
      throw new ScientificWorkbenchOfficialCycleLoadErrorV1(
        "terminal-cycle-capture",
        `Worker did not complete terminal-cycle chunk ${commandIndex + 1}`,
      );
    }
    acceptedStepFrames.push(...captured.payload.observableFrames);
    capturedFinalFrame = captured.payload.finalObservableFrame;
  }

  let terminalCycle: ScientificWorkbenchTerminalCycleV1;
  try {
    terminalCycle = assembleScientificWorkbenchTerminalCycleV1(
      created.payload.observableFrame,
      acceptedStepFrames,
    );
  } catch (error) {
    throw new ScientificWorkbenchOfficialCycleLoadErrorV1(
      "terminal-cycle-capture",
      errorMessage(error),
    );
  }
  if (
    !sameFrameIdentity(
      terminalCycle.frames.at(-1)!,
      capturedFinalFrame,
    )
  ) {
    throw new ScientificWorkbenchOfficialCycleLoadErrorV1(
      "terminal-cycle-capture",
      "captured final frame does not match the committed Worker state",
    );
  }

  return Object.freeze({
    workspaceDocument: bundle.workspaceDocument,
    terminalCycle,
    sessionOrigin: origin,
    evidence: Object.freeze({
      bundledDocumentChainVerified: true as const,
      workerRestoredExactV3Case: true as const,
      workerAndPageDocumentRefsMatch: true as const,
      terminalPeriod1ConfirmedWithoutAdvancingState: true as const,
      followingCompleteCycleCaptured: true as const,
      clinicalValidationClaimed: false as const,
    }),
  });
}

function assertWorkerBundleIdentity(
  bundle: LoadedBundledOfficialHealthyPeriodicWorkspaceDocumentV1,
  responseReleaseRef: SimulationReleaseRef,
  payload: Readonly<{
    checkpointSha256: string;
    sessionInputSha256: string;
    caseRef: unknown;
    workspaceRef: unknown;
  }>,
  origin: OfficialDocumentCaseOriginV1,
): void {
  const provenance = bundle.provenance;
  if (
    !sameSimulationReleaseRef(bundle.releaseRef, responseReleaseRef)
    || payload.checkpointSha256 !== origin.checkpointSha256
    || payload.sessionInputSha256 !== origin.sessionInputSha256
    || canonicalJsonStringify(payload.caseRef)
      !== canonicalJsonStringify(provenance.caseRef)
    || canonicalJsonStringify(payload.workspaceRef)
      !== canonicalJsonStringify(provenance.workspaceRef)
    || canonicalJsonStringify(origin.caseRef)
      !== canonicalJsonStringify(provenance.caseRef)
    || canonicalJsonStringify(origin.workspaceRef)
      !== canonicalJsonStringify(provenance.workspaceRef)
    || origin.catalogRawFileSha256
      !== provenance.catalogRawFileSha256
  ) throw new Error("Worker identity does not match the verified document bundle");
}

function sameFrameIdentity(
  left: Readonly<{
    releaseRef: SimulationReleaseRef;
    revision: number;
    acceptedTimeSec: number;
  }>,
  right: Readonly<{
    releaseRef: SimulationReleaseRef;
    revision: number;
    acceptedTimeSec: number;
  }>,
): boolean {
  return sameSimulationReleaseRef(left.releaseRef, right.releaseRef)
    && left.revision === right.revision
    && left.acceptedTimeSec === right.acceptedTimeSec;
}

function assertPortableSessionId(sessionId: string): void {
  // Keep 12 bytes of headroom for the longest ":capture-125" request suffix.
  if (!/^[A-Za-z0-9][A-Za-z0-9:._-]{0,115}$/.test(sessionId)) {
    throw new ScientificWorkbenchOfficialCycleLoadErrorV1(
      "worker-restore",
      "sessionId must be a portable identifier of at most 116 bytes",
    );
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
