import {
  loadMainWireScientificWorkspaceDocumentV1,
  type MainWireScientificWorkspaceDocumentV1,
} from "@/engine/scientific/documents";
import type {
  MainWireScientificObservableFrameV1,
} from "@/engine/scientific/observables";
import {
  MAIN_WIRE_SCIENTIFIC_RESEARCH_PRESET_CATALOG_V1,
  MAIN_WIRE_SCIENTIFIC_RESEARCH_PRESET_V1_VERSION,
  type MainWireScientificResearchPresetIdV1,
} from "@/engine/scientific/presets";
import {
  canonicalJsonStringify,
  sameSimulationReleaseRef,
} from "@/engine/scientific/release";
import {
  SCIENTIFIC_COMMAND_PROTOCOL_V1_ID,
  type ScientificPeriodicSettlementProgressV1,
  type ScientificResearchControlContextV0,
  type ScientificSessionOriginV1,
} from "@/engine/scientific/worker";
import type {
  MainWireScientificWorkerClientV1,
} from "@/engine/scientificBrowser";

import {
  SCIENTIFIC_WORKBENCH_TERMINAL_CYCLE_V1,
  assembleScientificWorkbenchResearchTerminalCycleV1,
  type ScientificWorkbenchResearchTerminalCycleV1,
} from "./scientificWorkbenchTerminalCycleV1";

type ResearchDocumentCaseOriginV1 = Extract<
  ScientificSessionOriginV1,
  Readonly<{ kind: "research-document-case-cold-start" }>
>;

export type ScientificWorkbenchResearchProgressV1 = Readonly<{
  status: "tracking" | "period1-converged";
  completedBeatCount: number;
  maximumBeatCount: number;
}>;

export type ScientificWorkbenchResearchCycleV1 = Readonly<{
  presetId: MainWireScientificResearchPresetIdV1;
  presetDisplayName: string;
  workspaceDocument: MainWireScientificWorkspaceDocumentV1;
  terminalCycle: ScientificWorkbenchResearchTerminalCycleV1;
  sessionOrigin: ResearchDocumentCaseOriginV1;
  completedBeatCount: number;
  researchControlContext: ScientificResearchControlContextV0;
  evidence: Readonly<{
    browserCatalogReleasePinned: true;
    workerDocumentChainVerified: true;
    workerAndPageDocumentRefsMatch: true;
    exactResolvedCaseInputUsedBySession: true;
    independentColdStart: true;
    terminalPeriod1Confirmed: true;
    followingCompleteCycleCaptured: true;
    officialTrustClaimed: false;
    clinicalDiagnosisClaimed: false;
    clinicalValidationClaimed: false;
  }>;
}>;

export type ScientificWorkbenchResearchCycleLoaderOptionsV1 = Readonly<{
  sessionId: string;
  presetId: MainWireScientificResearchPresetIdV1;
  onProgress?: (progress: ScientificWorkbenchResearchProgressV1) => void;
}>;

export class ScientificWorkbenchResearchCycleLoadErrorV1 extends Error {
  readonly stage:
    | "worker-document-case"
    | "workspace-verification"
    | "periodic-settlement"
    | "terminal-cycle-capture";

  constructor(
    stage: ScientificWorkbenchResearchCycleLoadErrorV1["stage"],
    message: string,
  ) {
    super(`scientific research workbench ${stage} failed: ${message}`);
    this.name = "ScientificWorkbenchResearchCycleLoadErrorV1";
    this.stage = stage;
  }
}

/**
 * Resolves a browser-safe research identity inside the Worker, verifies the
 * returned content-addressed Workspace, settles from that Case's exact cold
 * input, and exposes plots only after a numerical P1 classification.
 */
export async function loadScientificWorkbenchResearchCycleV1(
  client: Pick<MainWireScientificWorkerClientV1, "request">,
  options: ScientificWorkbenchResearchCycleLoaderOptionsV1,
): Promise<ScientificWorkbenchResearchCycleV1> {
  assertPortableSessionId(options.sessionId);
  const catalogEntry = MAIN_WIRE_SCIENTIFIC_RESEARCH_PRESET_CATALOG_V1.entries
    .find((entry) => entry.presetId === options.presetId);
  if (catalogEntry === undefined) {
    throw new ScientificWorkbenchResearchCycleLoadErrorV1(
      "worker-document-case",
      `preset ${String(options.presetId)} is absent from the pinned catalog`,
    );
  }

  const created = await client.request({
    protocolId: SCIENTIFIC_COMMAND_PROTOCOL_V1_ID,
    kind: "createResearchDocumentCaseSession",
    requestId: `${options.sessionId}:create`,
    sessionId: options.sessionId,
    presetId: options.presetId,
    presetVersion: MAIN_WIRE_SCIENTIFIC_RESEARCH_PRESET_V1_VERSION,
  });
  if (!created.ok) {
    throw new ScientificWorkbenchResearchCycleLoadErrorV1(
      "worker-document-case",
      `${created.error.code}: ${created.error.message}`,
    );
  }
  if (
    created.commandKind !== "createResearchDocumentCaseSession"
    || created.payload.kind !== "researchDocumentCaseSessionCreated"
    || created.sessionOrigin.kind !== "research-document-case-cold-start"
    || created.payload.researchControlContext.stateIdentity.revision
      !== created.payload.observableFrame.revision
    || created.payload.researchControlContext.stateIdentity.acceptedTimeSec
      !== created.payload.observableFrame.acceptedTimeSec
  ) {
    throw new ScientificWorkbenchResearchCycleLoadErrorV1(
      "worker-document-case",
      "Worker returned a different command, payload, or session origin",
    );
  }

  const origin = created.sessionOrigin;
  assertCreatedResearchIdentity(
    options.presetId,
    created.releaseRef,
    created.payload,
    origin,
  );

  let workspaceDocument: MainWireScientificWorkspaceDocumentV1;
  try {
    workspaceDocument = await loadMainWireScientificWorkspaceDocumentV1(
      created.payload.workspaceDocument,
    );
    if (
      canonicalJsonStringify(workspaceDocument.ref)
        !== canonicalJsonStringify(origin.workspaceRef)
      || canonicalJsonStringify(workspaceDocument.content.caseDocumentRef)
        !== canonicalJsonStringify(origin.caseRef)
    ) throw new Error("Workspace ref links do not match the Worker session origin");
  } catch (error) {
    throw new ScientificWorkbenchResearchCycleLoadErrorV1(
      "workspace-verification",
      errorMessage(error),
    );
  }

  let period1Boundary: MainWireScientificObservableFrameV1 | null = null;
  let completedBeatCount = 0;
  const maximumBeatCount = 32;
  for (let callIndex = 0; callIndex < maximumBeatCount; callIndex += 1) {
    const settled = await client.request({
      protocolId: SCIENTIFIC_COMMAND_PROTOCOL_V1_ID,
      kind: "settlePeriodic",
      requestId:
        `${options.sessionId}:settle-${String(callIndex + 1).padStart(2, "0")}`,
      sessionId: options.sessionId,
    });
    if (!settled.ok) {
      throw new ScientificWorkbenchResearchCycleLoadErrorV1(
        "periodic-settlement",
        `${settled.error.code}: ${settled.error.message}`,
      );
    }
    if (
      settled.commandKind !== "settlePeriodic"
      || settled.payload.kind !== "periodic-settlement-progress"
    ) {
      throw new ScientificWorkbenchResearchCycleLoadErrorV1(
        "periodic-settlement",
        "Worker returned a different periodic-settlement payload",
      );
    }
    assertResponseRemainsBoundToResearchCase(
      settled.releaseRef,
      settled.sessionOrigin,
      origin,
      [settled.payload.finalObservableFrame],
      "periodic-settlement",
    );
    const progress = settled.payload;
    assertScientificWorkbenchResearchSettlementProgressV1(
      progress,
      callIndex + 1,
      created.payload.observableFrame,
    );
    completedBeatCount = progress.completedBeatCount;

    if (progress.status === "period1-converged") {
      options.onProgress?.(Object.freeze({
        status: "period1-converged" as const,
        completedBeatCount,
        maximumBeatCount,
      }));
      period1Boundary = progress.finalObservableFrame;
      break;
    }
    if (progress.status !== "tracking") {
      throw new ScientificWorkbenchResearchCycleLoadErrorV1(
        "periodic-settlement",
        progress.status === "period2-suspect"
          ? "P2 orbit suspected; no steady-state plot is claimed"
          : "32-beat limit reached without P1 convergence; no steady-state plot is claimed",
      );
    }
    options.onProgress?.(Object.freeze({
      status: "tracking" as const,
      completedBeatCount,
      maximumBeatCount,
    }));
  }
  if (period1Boundary === null) {
    throw new ScientificWorkbenchResearchCycleLoadErrorV1(
      "periodic-settlement",
      "bounded settlement ended without a P1 boundary; no plot is exposed",
    );
  }

  const acceptedStepFrames: MainWireScientificObservableFrameV1[] = [];
  let capturedFinalFrame = period1Boundary;
  for (
    let commandIndex = 0;
    commandIndex < SCIENTIFIC_WORKBENCH_TERMINAL_CYCLE_V1.workerCommandCount;
    commandIndex += 1
  ) {
    const captured = await client.request({
      protocolId: SCIENTIFIC_COMMAND_PROTOCOL_V1_ID,
      kind: "runTransient",
      requestId:
        `${options.sessionId}:capture-${String(commandIndex + 1).padStart(3, "0")}`,
      sessionId: options.sessionId,
      dtSec: SCIENTIFIC_WORKBENCH_TERMINAL_CYCLE_V1.dtSec,
      stepCount: SCIENTIFIC_WORKBENCH_TERMINAL_CYCLE_V1.stepsPerWorkerCommand,
      observationStride: SCIENTIFIC_WORKBENCH_TERMINAL_CYCLE_V1.observationStride,
    });
    if (!captured.ok) {
      throw new ScientificWorkbenchResearchCycleLoadErrorV1(
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
      || captured.payload.executionProtocol.observationPolicy.kind
        !== "accepted-step-stride"
      || captured.payload.executionProtocol.observationPolicy.stride
        !== SCIENTIFIC_WORKBENCH_TERMINAL_CYCLE_V1.observationStride
    ) {
      throw new ScientificWorkbenchResearchCycleLoadErrorV1(
        "terminal-cycle-capture",
        `Worker did not complete terminal-cycle chunk ${commandIndex + 1}`,
      );
    }
    assertResponseRemainsBoundToResearchCase(
      captured.releaseRef,
      captured.sessionOrigin,
      origin,
      [
        ...captured.payload.observableFrames,
        captured.payload.finalObservableFrame,
      ],
      "terminal-cycle-capture",
    );
    acceptedStepFrames.push(...captured.payload.observableFrames);
    capturedFinalFrame = captured.payload.finalObservableFrame;
  }

  let terminalCycle: ScientificWorkbenchResearchTerminalCycleV1;
  try {
    terminalCycle = assembleScientificWorkbenchResearchTerminalCycleV1(
      period1Boundary,
      acceptedStepFrames,
    );
  } catch (error) {
    throw new ScientificWorkbenchResearchCycleLoadErrorV1(
      "terminal-cycle-capture",
      errorMessage(error),
    );
  }
  if (!sameFrameIdentity(terminalCycle.frames.at(-1)!, capturedFinalFrame)) {
    throw new ScientificWorkbenchResearchCycleLoadErrorV1(
      "terminal-cycle-capture",
      "captured final frame does not match the committed Worker state",
    );
  }
  if (!sameSimulationReleaseRef(
    terminalCycle.releaseRef,
    MAIN_WIRE_SCIENTIFIC_RESEARCH_PRESET_CATALOG_V1.releaseRef,
  )) {
    throw new ScientificWorkbenchResearchCycleLoadErrorV1(
      "terminal-cycle-capture",
      "captured cycle escaped the catalog-pinned simulation release",
    );
  }

  return Object.freeze({
    presetId: options.presetId,
    presetDisplayName: catalogEntry.displayName,
    workspaceDocument,
    terminalCycle,
    sessionOrigin: origin,
    completedBeatCount,
    researchControlContext: Object.freeze({
      ...created.payload.researchControlContext,
      stateIdentity: Object.freeze({
        revision: capturedFinalFrame.revision,
        acceptedTimeSec: capturedFinalFrame.acceptedTimeSec,
        totalBloodVolumeMl:
          created.payload.researchControlContext.stateIdentity.totalBloodVolumeMl,
      }),
    }),
    evidence: Object.freeze({
      browserCatalogReleasePinned: true as const,
      workerDocumentChainVerified: true as const,
      workerAndPageDocumentRefsMatch: true as const,
      exactResolvedCaseInputUsedBySession: true as const,
      independentColdStart: true as const,
      terminalPeriod1Confirmed: true as const,
      followingCompleteCycleCaptured: true as const,
      officialTrustClaimed: false as const,
      clinicalDiagnosisClaimed: false as const,
      clinicalValidationClaimed: false as const,
    }),
  });
}

function assertCreatedResearchIdentity(
  presetId: MainWireScientificResearchPresetIdV1,
  responseReleaseRef: ResearchDocumentCaseOriginV1["releaseRef"],
  payload: Readonly<{
    presetId: MainWireScientificResearchPresetIdV1;
    presetVersion: string;
    classification: string;
    officialTrustClaimed: boolean;
    clinicalDiagnosisClaimed: boolean;
    periodicSteadyStateClaimed: boolean;
    sessionInputSha256: string;
    presetRef: unknown;
    caseRef: unknown;
    workspaceRef: unknown;
    researchControlContext: ScientificResearchControlContextV0;
    observableFrame: MainWireScientificObservableFrameV1;
  }>,
  origin: ResearchDocumentCaseOriginV1,
): void {
  const catalogEntry =
    MAIN_WIRE_SCIENTIFIC_RESEARCH_PRESET_CATALOG_V1.entries.find(
      (entry) => entry.presetId === presetId,
    );
  const documentBinding = catalogEntry?.documentChainBinding;
  if (
    documentBinding === undefined
    || payload.presetId !== presetId
    || payload.presetVersion
      !== MAIN_WIRE_SCIENTIFIC_RESEARCH_PRESET_V1_VERSION
    || origin.presetId !== presetId
    || origin.presetVersion
      !== MAIN_WIRE_SCIENTIFIC_RESEARCH_PRESET_V1_VERSION
    || payload.classification !== "research-bracket-not-clinical"
    || payload.officialTrustClaimed
    || payload.clinicalDiagnosisClaimed
    || payload.periodicSteadyStateClaimed
    || origin.officialTrustClaimed
    || origin.clinicalDiagnosisClaimed
    || origin.periodicSteadyStateClaimed
    || payload.sessionInputSha256 !== origin.sessionInputSha256
    || !sameSimulationReleaseRef(
      responseReleaseRef,
      MAIN_WIRE_SCIENTIFIC_RESEARCH_PRESET_CATALOG_V1.releaseRef,
    )
    || !sameSimulationReleaseRef(responseReleaseRef, origin.releaseRef)
    || !sameSimulationReleaseRef(
      responseReleaseRef,
      payload.observableFrame.releaseRef,
    )
    || payload.observableFrame.source !== "cold-initialization"
    || payload.researchControlContext.stateIdentity.revision
      !== payload.observableFrame.revision
    || payload.researchControlContext.stateIdentity.acceptedTimeSec
      !== payload.observableFrame.acceptedTimeSec
    || payload.researchControlContext.parameterEpoch !== 0
    || canonicalJsonStringify(payload.presetRef)
      !== canonicalJsonStringify(origin.presetRef)
    || canonicalJsonStringify(payload.caseRef)
      !== canonicalJsonStringify(origin.caseRef)
    || canonicalJsonStringify(payload.workspaceRef)
      !== canonicalJsonStringify(origin.workspaceRef)
    || origin.sessionInputSha256 !== documentBinding.sessionInputSha256
    || origin.presetRef.sha256 !== documentBinding.presetDocumentSha256
    || origin.caseRef.sha256 !== documentBinding.caseDocumentSha256
    || origin.workspaceRef.sha256 !== documentBinding.workspaceDocumentSha256
  ) {
    throw new ScientificWorkbenchResearchCycleLoadErrorV1(
      "worker-document-case",
      "Worker identity does not match the pinned research catalog and document chain",
    );
  }
}

/**
 * Shared fail-closed P1/P2 tracker-evidence gate for both cold research Cases
 * and state-preserving control forks. A fork may legitimately anchor at 1^-
 * after many accepted 2 ms steps, so phase validity is tied to anchor time
 * rather than requiring the decimal representation to be exactly zero.
 */
export function assertScientificWorkbenchResearchSettlementProgressV1(
  progress: ScientificPeriodicSettlementProgressV1<
    MainWireScientificObservableFrameV1
  >,
  expectedCompletedBeatCount: number,
  settlementBoundary: Pick<
    MainWireScientificObservableFrameV1,
    "releaseRef" | "revision" | "acceptedTimeSec"
  >,
): void {
  const terminalP1 = progress.status === "period1-converged";
  const terminalP2 = progress.status === "period2-suspect";
  const expectedClassifierStatus = terminalP1
    ? "period1-converged"
    : terminalP2 ? "period2-suspect" : "not-converged";
  const classification = progress.periodicity;
  const closure = progress.retainedBeatClosure;
  const latestClosure = closure.at(-1) ?? null;
  const expectedClosureCount = Math.min(
    expectedCompletedBeatCount,
    progress.executionProtocol.retainedClosureCount,
  );
  const classifiedClosure = closure.slice(
    -classification.consecutiveBeatsRequired,
  );
  const classificationEvidenceValid = expectedClassifierStatus === "not-converged"
    ? classification.evidenceBeatIndices.length === 0
    : classification.evidenceBeatIndices.length
        === classification.consecutiveBeatsRequired
      && contiguousBeatIndicesEndingAt(
        classification.evidenceBeatIndices,
        expectedCompletedBeatCount,
      )
      && sameBeatIndices(
        classification.evidenceBeatIndices,
        classifiedClosure.map((entry) => entry.beatIndex),
      )
      && (terminalP1 || classifiedClosure.every((entry) =>
        entry.period2 !== null));
  const closureEvidenceValid = closure.length === expectedClosureCount
    && contiguousBeatIndicesEndingAt(
      closure.map((entry) => entry.beatIndex),
      expectedCompletedBeatCount,
    )
    && closure.every(validBeatClosureSummary);
  const expectedFinalAcceptedTimeSec = progress.anchorAcceptedTimeSec
    + expectedCompletedBeatCount * progress.executionProtocol.cycleLengthSec;
  const expectedFinalRevision = settlementBoundary.revision
    + expectedCompletedBeatCount
      * SCIENTIFIC_WORKBENCH_TERMINAL_CYCLE_V1.stepCount;
  const anchorPhaseValid = Number.isFinite(progress.anchorPhase01)
    && progress.anchorPhase01 >= 0
    && progress.anchorPhase01 < 1
    && Number.isFinite(progress.anchorAcceptedTimeSec)
    && cyclePhaseDistanceV1(
      progress.anchorPhase01,
      cyclePhase01V1(
        progress.anchorAcceptedTimeSec,
        progress.executionProtocol.cycleLengthSec,
      ),
    ) <= 1e-12;
  if (
    progress.completedBeatCount !== expectedCompletedBeatCount
    || progress.anchorAcceptedTimeSec !== settlementBoundary.acceptedTimeSec
    || progress.trackerStartedThisCall
      !== (expectedCompletedBeatCount === 1)
    || !progress.beatCompletedThisCall
    || progress.completedStepCountThisCall
      !== SCIENTIFIC_WORKBENCH_TERMINAL_CYCLE_V1.stepCount
    || !Number.isFinite(progress.anchorAcceptedTimeSec)
    || !anchorPhaseValid
    || progress.executionProtocol.cycleLengthSec
      !== SCIENTIFIC_WORKBENCH_TERMINAL_CYCLE_V1.cycleLengthSec
    || progress.executionProtocol.dtSec
      !== SCIENTIFIC_WORKBENCH_TERMINAL_CYCLE_V1.dtSec
    || progress.executionProtocol.stepsPerBeat
      !== SCIENTIFIC_WORKBENCH_TERMINAL_CYCLE_V1.stepCount
    || progress.executionProtocol.maximumBeatCount !== 32
    || progress.executionProtocol.maximumStepsPerCall
      !== SCIENTIFIC_WORKBENCH_TERMINAL_CYCLE_V1.stepCount
    || progress.executionProtocol.maximumBeatCountPerCall !== 1
    || progress.periodicSteadyStateClaimed !== terminalP1
    || progress.period2OrbitSuspected !== terminalP2
    || classification.status !== expectedClassifierStatus
    || classification.latestBeatIndex !== expectedCompletedBeatCount
    || !Number.isInteger(classification.consecutiveBeatsRequired)
    || classification.consecutiveBeatsRequired <= 0
    || classification.consecutiveBeatsRequired
      > progress.executionProtocol.retainedClosureCount
    || !classificationEvidenceValid
    || !closureEvidenceValid
    || latestClosure === null
    || !sameNullableFiniteNumber(
      classification.latestPeriod1MaximumNormalizedDelta,
      latestClosure.period1?.maximumNormalizedDelta ?? null,
    )
    || !sameNullableFiniteNumber(
      classification.latestPeriod2MaximumNormalizedDelta,
      latestClosure.period2?.maximumNormalizedDelta ?? null,
    )
    || progress.finalObservableFrame.source !== "accepted-step"
    || !sameSimulationReleaseRef(
      progress.finalObservableFrame.releaseRef,
      settlementBoundary.releaseRef,
    )
    || progress.finalObservableFrame.revision !== expectedFinalRevision
    || !Number.isFinite(progress.finalObservableFrame.acceptedTimeSec)
    || Math.abs(
      progress.finalObservableFrame.acceptedTimeSec
        - expectedFinalAcceptedTimeSec,
    ) > 1e-9
  ) {
    throw new ScientificWorkbenchResearchCycleLoadErrorV1(
      "periodic-settlement",
      `invalid settlement evidence at beat ${expectedCompletedBeatCount}`,
    );
  }
}

function cyclePhase01V1(timeSec: number, cycleLengthSec: number): number {
  const raw = timeSec / cycleLengthSec;
  const phase = raw - Math.floor(raw);
  return phase >= 1 - 1e-12 || phase < 1e-12 ? 0 : phase;
}

function cyclePhaseDistanceV1(left: number, right: number): number {
  const direct = Math.abs(left - right);
  return Math.min(direct, 1 - direct);
}

function contiguousBeatIndicesEndingAt(
  beatIndices: readonly number[],
  finalBeatIndex: number,
): boolean {
  if (beatIndices.length === 0) return false;
  return beatIndices.at(-1) === finalBeatIndex
    && beatIndices.every((beatIndex, index) =>
      Number.isInteger(beatIndex)
      && beatIndex > 0
      && (index === 0 || beatIndex === beatIndices[index - 1]! + 1));
}

function validBeatClosureSummary(
  summary: ScientificPeriodicSettlementProgressV1<
    MainWireScientificObservableFrameV1
  >["retainedBeatClosure"][number],
): boolean {
  return Number.isInteger(summary.beatIndex)
    && summary.beatIndex > 0
    && summary.period1 !== null
    && validClosureSummary(summary.period1)
    && validClosureSummary(summary.period2);
}

function sameBeatIndices(
  left: readonly number[],
  right: readonly number[],
): boolean {
  return left.length === right.length
    && left.every((value, index) => value === right[index]);
}

function validClosureSummary(
  summary: ScientificPeriodicSettlementProgressV1<
    MainWireScientificObservableFrameV1
  >["retainedBeatClosure"][number]["period1"],
): boolean {
  return summary === null || (
    Number.isFinite(summary.maximumNormalizedDelta)
    && summary.maximumNormalizedDelta >= 0
    && Number.isFinite(summary.elapsedTimeSec)
    && summary.elapsedTimeSec > 0
    && typeof summary.worstGroup === "string"
    && summary.worstGroup.length > 0
    && typeof summary.worstPath === "string"
    && summary.worstPath.length > 0
  );
}

function sameNullableFiniteNumber(
  left: number | null,
  right: number | null,
): boolean {
  if (left === null || right === null) return left === right;
  return Number.isFinite(left) && Number.isFinite(right) && left === right;
}

function assertResponseRemainsBoundToResearchCase(
  responseReleaseRef: ResearchDocumentCaseOriginV1["releaseRef"],
  responseOrigin: ScientificSessionOriginV1,
  expectedOrigin: ResearchDocumentCaseOriginV1,
  frames: readonly MainWireScientificObservableFrameV1[],
  stage: "periodic-settlement" | "terminal-cycle-capture",
): void {
  if (
    !sameSimulationReleaseRef(responseReleaseRef, expectedOrigin.releaseRef)
    || canonicalJsonStringify(responseOrigin)
      !== canonicalJsonStringify(expectedOrigin)
    || frames.some((frame) => !sameSimulationReleaseRef(
      frame.releaseRef,
      expectedOrigin.releaseRef,
    ))
  ) {
    throw new ScientificWorkbenchResearchCycleLoadErrorV1(
      stage,
      "Worker response escaped the created release/input/document-chain binding",
    );
  }
}

function sameFrameIdentity(
  left: MainWireScientificObservableFrameV1,
  right: MainWireScientificObservableFrameV1,
): boolean {
  return left.revision === right.revision
    && left.acceptedTimeSec === right.acceptedTimeSec
    && left.source === right.source
    && sameSimulationReleaseRef(left.releaseRef, right.releaseRef);
}

function assertPortableSessionId(value: string): void {
  // Keep 12 bytes of headroom for the longest ":capture-125" request suffix.
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,115}$/.test(value)) {
    throw new ScientificWorkbenchResearchCycleLoadErrorV1(
      "worker-document-case",
      "sessionId must be a portable identifier of at most 116 bytes",
    );
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
