import {
  createScientificWorkbenchResearchControlStoreV0,
  SCIENTIFIC_WORKBENCH_OFFICIAL_BOOTSTRAP_REQUEST_COUNT_V0,
  SCIENTIFIC_WORKBENCH_REQUEST_CAPACITY_V0,
  type ScientificWorkbenchResearchControlDraftV0,
  type ScientificWorkbenchResearchControlSourceV0,
  type ScientificWorkbenchResearchControlStoreV0,
} from "@/components/scientificWorkbench/ScientificWorkbenchResearchControlV0";
import type {
  ScientificWorkbenchDisplayedEvidenceV0,
} from "@/components/scientificWorkbench/ScientificWorkbenchResearchControlStoreV0";
import {
  loadScientificWorkbenchOfficialCycleV1,
  type ScientificWorkbenchOfficialCycleV1,
} from "@/components/scientificWorkbench/scientificWorkbenchOfficialCycleV1";
import {
  loadScientificWorkbenchResearchCycleV1,
  type ScientificWorkbenchResearchCycleV1,
  type ScientificWorkbenchResearchProgressV1,
} from "@/components/scientificWorkbench/scientificWorkbenchResearchCycleV1";
import {
  SCIENTIFIC_WORKBENCH_TERMINAL_CYCLE_V1,
} from "@/components/scientificWorkbench/scientificWorkbenchTerminalCycleV1";
import type {
  MainWireScientificWorkspaceDocumentV1,
} from "@/engine/scientific/documents";
import type {
  MainWireScientificObservableFrameV1,
} from "@/engine/scientific/observables";
import type {
  MainWireScientificCompleteTransientBeatV1,
  MainWireScientificMetricCycleV1,
  MainWireScientificValidatedTerminalCycleV1,
} from "@/engine/scientific/metrics";
import {
  MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_SCALE_VALUES_V0,
  MainWireScientificResearchControlScaleV0,
} from "@/engine/scientific/controls/MainWireScientificResearchControlCatalogV0";
import {
  MainWireScientificWorkerClientV1,
} from "@/engine/scientificBrowser";
import { sameSimulationReleaseRef } from "@/engine/scientific/release";
import {
  SCIENTIFIC_COMMAND_PROTOCOL_V1_ID,
} from "@/engine/scientific/worker/scientificCommandProtocolV1";
import type {
  MainWireScientificGuytonStarlingProtocolResultV1,
  MainWireScientificPvRelationsProtocolResultV1,
} from "@/engine/scientific/protocols/MainWireScientificHemodynamicProtocolV1";
import type {
  MainWireScientificGuytonStarlingProtocolResultV2,
  MainWireScientificHemodynamicJobSnapshotV2,
} from "@/engine/scientific/protocols/MainWireScientificHemodynamicJobV2";

import {
  SCIENTIFIC_PRODUCT_RELEASE_REF_V1,
  scientificProductCaseByIdV1,
  type ScientificProductCaseIdV1,
  type ScientificProductCaseRouteResolutionV1,
  type ScientificProductCaseV1,
} from "./scientificProductCaseCatalogV1";

export type ScientificProductLoadedRuntimeV1 =
  | Readonly<{
    client: MainWireScientificWorkerClientV1;
    sessionId: string;
    result: ScientificWorkbenchOfficialCycleV1;
    kind: "official";
  }>
  | Readonly<{
    client: MainWireScientificWorkerClientV1;
    sessionId: string;
    result: ScientificWorkbenchResearchCycleV1;
    kind: "research";
  }>;

export type ScientificProductScenarioLifecycleV1 =
  | "loading"
  | "ready"
  | "failed";

export type ScientificProductScenarioDescriptorV1 = Readonly<{
  id: string;
  name: string;
  color: string;
  isVisible: boolean;
  lifecycle: ScientificProductScenarioLifecycleV1;
  statusMessage: string;
  source: Readonly<{
    caseId: ScientificProductCaseIdV1;
    releaseId: string;
    releaseVersion: string;
    releaseSha256: string;
  }>;
}>;

export type ScientificProductScenarioRuntimeV1 = Readonly<{
  descriptor: ScientificProductScenarioDescriptorV1;
  client: MainWireScientificWorkerClientV1;
  sessionId: string;
  kind: "official" | "research";
  result: ScientificWorkbenchOfficialCycleV1 | ScientificWorkbenchResearchCycleV1;
  workspaceDocument: MainWireScientificWorkspaceDocumentV1;
  initialSource: ScientificWorkbenchResearchControlSourceV0;
  controlStore: ScientificWorkbenchResearchControlStoreV0;
}>;

export type ScientificProductScenarioPresentationV1 = Readonly<{
  descriptor: ScientificProductScenarioDescriptorV1;
  frames: readonly MainWireScientificObservableFrameV1[];
  periodicCycleFrames: readonly MainWireScientificObservableFrameV1[] | null;
  cycleDurationSec: number | null;
  transientOriginAcceptedTimeSec: number | null;
  validatedCycle: MainWireScientificValidatedTerminalCycleV1 | null;
  metricCycle: MainWireScientificMetricCycleV1 | null;
  metricEvidence:
    | "validated-periodic-P1"
    | "retained-periodic-source"
    | "provisional-complete-transient-beat"
    | "unavailable";
  displayedEvidence: ScientificWorkbenchDisplayedEvidenceV0;
  workspaceDocument: MainWireScientificWorkspaceDocumentV1;
}>;

export type ScientificProductHemodynamicProtocolKindV1 =
  | "guyton-starling"
  | "pv-relations";

export type ScientificProductHemodynamicProtocolPresentationV1 = Readonly<{
  kind: ScientificProductHemodynamicProtocolKindV1;
  status: "idle" | "running" | "complete" | "error";
  sourceIdentity: Readonly<{
    revision: number;
    acceptedTimeSec: number;
    totalBloodVolumeMl: number;
  }> | null;
  result:
    | MainWireScientificGuytonStarlingProtocolResultV1
    | MainWireScientificGuytonStarlingProtocolResultV2
    | MainWireScientificPvRelationsProtocolResultV1
    | null;
  jobSnapshot: MainWireScientificHemodynamicJobSnapshotV2 | null;
  errorMessage: string | null;
}>;

type ScenarioEntryV1 = {
  descriptor: ScientificProductScenarioDescriptorV1;
  generation: number;
  loadingClient: MainWireScientificWorkerClientV1 | null;
  runtime: ScientificProductScenarioRuntimeV1 | null;
  unsubscribeStore: (() => void) | null;
  unsubscribeFrames: (() => void) | null;
  pendingDuplicateDraft: ScientificWorkbenchResearchControlDraftV0 | null;
  duplicateTransitionModeState:
    | "none"
    | "awaiting-start"
    | "awaiting-settlement";
};

export type AddScientificScenarioOptionsV1 = Readonly<{
  name?: string;
  color?: string;
  duplicateDraft?: ScientificWorkbenchResearchControlDraftV0;
  onProgress?: (progress: ScientificWorkbenchResearchProgressV1) => void;
}>;

const MAXIMUM_PRODUCT_SCENARIO_COUNT_V1 = 4;
const SCENARIO_COLORS_V1 = Object.freeze([
  "#38bdf8",
  "#fb923c",
  "#34d399",
  "#c084fc",
]);

let scenarioOrdinalV1 = 0;
let sessionOrdinalV1 = 0;
let hemodynamicProtocolRequestOrdinalV1 = 0;
const VALIDATED_CYCLE_BY_FRAME_ARRAY_V1 = new WeakMap<
  object,
  MainWireScientificValidatedTerminalCycleV1
>();

/**
 * Owns one isolated Worker and one control state machine per scenario. Mutable
 * Worker/store handles never enter the serializable Workbench document.
 */
export class ScientificProductScenarioRegistryV1 {
  private readonly entries = new Map<string, ScenarioEntryV1>();
  private readonly descriptorListeners = new Set<() => void>();
  private readonly frameListeners = new Set<() => void>();
  private readonly protocolListeners = new Set<() => void>();
  private readonly hemodynamicProtocols = new Map<
    string,
    ScientificProductHemodynamicProtocolPresentationV1
  >();
  private readonly hemodynamicProtocolPollTimers = new Map<
    string,
    ReturnType<typeof setTimeout>
  >();
  private descriptorSnapshot: readonly ScientificProductScenarioDescriptorV1[] = [];
  private frameVersion = 0;
  private disposed = false;
  private readonly transientMetricBeatCache = new Map<string,
    TransientMetricBeatCacheV1>();

  constructor(
    resolution: ScientificProductCaseRouteResolutionV1,
    runtime: ScientificProductLoadedRuntimeV1,
  ) {
    const id = nextScenarioIdV1();
    const descriptor = createDescriptorV1(
      id,
      resolution.caseEntry,
      resolution.caseEntry.displayName,
      SCENARIO_COLORS_V1[0],
      "ready",
      "Release-bound periodic cycle ready.",
    );
    const entry: ScenarioEntryV1 = {
      descriptor,
      generation: 0,
      loadingClient: null,
      runtime: null,
      unsubscribeStore: null,
      unsubscribeFrames: null,
      pendingDuplicateDraft: null,
      duplicateTransitionModeState: "none",
    };
    this.entries.set(id, entry);
    this.attachRuntime(entry, runtime);
    this.publishDescriptors();
  }

  readonly subscribeDescriptors = (listener: () => void): (() => void) => {
    this.descriptorListeners.add(listener);
    return () => this.descriptorListeners.delete(listener);
  };

  readonly getDescriptorSnapshot = () => this.descriptorSnapshot;

  readonly subscribeFrames = (listener: () => void): (() => void) => {
    this.frameListeners.add(listener);
    return () => this.frameListeners.delete(listener);
  };

  readonly getFrameVersionSnapshot = () => this.frameVersion;

  readonly subscribeHemodynamicProtocols = (
    listener: () => void,
  ): (() => void) => {
    this.protocolListeners.add(listener);
    return () => this.protocolListeners.delete(listener);
  };

  getHemodynamicProtocol(
    scenarioId: string,
    kind: ScientificProductHemodynamicProtocolKindV1,
  ): ScientificProductHemodynamicProtocolPresentationV1 {
    return this.hemodynamicProtocols.get(protocolCacheKey(scenarioId, kind))
      ?? EMPTY_HEMODYNAMIC_PROTOCOL_PRESENTATIONS_V1[kind];
  }

  requestHemodynamicProtocol(
    scenarioId: string,
    kind: ScientificProductHemodynamicProtocolKindV1,
  ): void {
    const entry = this.entries.get(scenarioId);
    const runtime = entry?.runtime;
    if (entry === undefined || runtime === null || this.disposed) return;
    const source = runtime.controlStore.getSnapshot().source;
    const sourceIdentity = Object.freeze({
      revision: source.context.stateIdentity.revision,
      acceptedTimeSec: source.context.stateIdentity.acceptedTimeSec,
      totalBloodVolumeMl: source.context.stateIdentity.totalBloodVolumeMl,
    });
    const key = protocolCacheKey(scenarioId, kind);
    const current = this.hemodynamicProtocols.get(key);
    if (
      current?.status === "running"
      && sameProtocolSourceIdentity(current.sourceIdentity, sourceIdentity)
    ) return;
    if (
      current?.status === "complete"
      && sameProtocolSourceIdentity(current.sourceIdentity, sourceIdentity)
    ) return;
    // A new start atomically replaces the active job inside the worker pool.
    // Do not enqueue a separate cancel here: an in-flight poll plus cancel plus
    // start would exceed the client's bounded pending-request capacity.
    this.clearProtocolPollTimer(key);
    const generation = entry.generation;
    this.hemodynamicProtocols.set(key, Object.freeze({
      kind,
      status: "running" as const,
      sourceIdentity,
      result: null,
      jobSnapshot: null,
      errorMessage: null,
    }));
    this.publishProtocols();
    if (kind === "guyton-starling") {
      this.startGuytonStarlingJob({
        scenarioId,
        entry,
        runtime,
        sourceIdentity,
        sessionId: source.sessionId,
        key,
        generation,
      });
      return;
    }
    const requestId = `workbench-hemodynamic-${
      ++hemodynamicProtocolRequestOrdinalV1
    }`;
    const command = Object.freeze({
      protocolId: SCIENTIFIC_COMMAND_PROTOCOL_V1_ID,
      kind: "runPvRelationsProtocol" as const,
      requestId,
      sessionId: source.sessionId,
    });
    void runtime.client.request(command).then((response) => {
      if (
        this.disposed
        || this.entries.get(scenarioId) !== entry
        || entry.generation !== generation
      ) return;
      const latestSource = runtime.controlStore.getSnapshot().source.context
        .stateIdentity;
      if (!sameProtocolSourceIdentity(sourceIdentity, latestSource)) {
        this.hemodynamicProtocols.delete(key);
        this.publishProtocols();
        return;
      }
      if (!response.ok) {
        this.hemodynamicProtocols.set(key, Object.freeze({
          kind,
          status: "error" as const,
          sourceIdentity,
          result: null,
          jobSnapshot: null,
          errorMessage: response.error.message,
        }));
        this.publishProtocols();
        return;
      }
      const payload = response.payload;
      const result = response.commandKind === "runPvRelationsProtocol"
        && payload.kind === "pvRelationsProtocolCompleted"
        ? payload.result
        : null;
      const resultSourceIdentity = result === null
        ? null
        : Object.freeze({
          revision: result.source.revision,
          acceptedTimeSec: result.source.acceptedTimeSec,
          totalBloodVolumeMl: result.source.fixedTotalBloodVolumeMl,
        });
      if (
        result === null
        || !sameProtocolSourceIdentity(resultSourceIdentity, sourceIdentity)
      ) {
        this.hemodynamicProtocols.set(key, Object.freeze({
          kind,
          status: "error" as const,
          sourceIdentity,
          result: null,
          jobSnapshot: null,
          errorMessage: "Hemodynamic protocol response identity mismatch.",
        }));
      } else {
        this.hemodynamicProtocols.set(key, Object.freeze({
          kind,
          status: "complete" as const,
          sourceIdentity,
          result,
          jobSnapshot: null,
          errorMessage: null,
        }));
      }
      this.publishProtocols();
    }).catch((error: unknown) => {
      if (
        this.disposed
        || this.entries.get(scenarioId) !== entry
        || entry.generation !== generation
      ) return;
      this.hemodynamicProtocols.set(key, Object.freeze({
        kind,
        status: "error" as const,
        sourceIdentity,
        result: null,
        jobSnapshot: null,
        errorMessage: error instanceof Error ? error.message : String(error),
      }));
      this.publishProtocols();
    });
  }

  private startGuytonStarlingJob(input: Readonly<{
    scenarioId: string;
    entry: ScenarioEntryV1;
    runtime: ScientificProductScenarioRuntimeV1;
    sourceIdentity: Readonly<{
      revision: number;
      acceptedTimeSec: number;
      totalBloodVolumeMl: number;
    }>;
    sessionId: string;
    key: string;
    generation: number;
  }>): void {
    const requestId = `workbench-hemodynamic-${
      ++hemodynamicProtocolRequestOrdinalV1
    }`;
    void input.runtime.client.request(Object.freeze({
      protocolId: SCIENTIFIC_COMMAND_PROTOCOL_V1_ID,
      kind: "startGuytonStarlingProtocolJob" as const,
      requestId,
      sessionId: input.sessionId,
    })).then((response) => {
      if (!this.protocolRequestStillCurrent(input)) {
        if (
          this.protocolRequestOwnerStillCurrent(input)
          && response.ok
          && response.commandKind === "startGuytonStarlingProtocolJob"
          && response.payload.kind === "guytonStarlingProtocolJobStarted"
        ) {
          this.cancelAndDiscardStaleGuytonJob(
            input,
            response.payload.job.jobId,
          );
        }
        return;
      }
      if (!response.ok) {
        this.failProtocol(input.key, input.sourceIdentity, response.error.message);
        return;
      }
      if (
        response.commandKind !== "startGuytonStarlingProtocolJob"
        || response.payload.kind !== "guytonStarlingProtocolJobStarted"
      ) {
        this.failProtocol(
          input.key,
          input.sourceIdentity,
          "Guyton/Starling job start payload mismatch.",
        );
        return;
      }
      const started = response.payload.job;
      if (!sameProtocolJobSourceIdentity(
        started.snapshot.source,
        input.sourceIdentity,
      )) {
        this.failProtocol(
          input.key,
          input.sourceIdentity,
          "Guyton/Starling job source identity mismatch.",
        );
        return;
      }
      this.publishGuytonJobSnapshot(input, started.snapshot);
      if (started.snapshot.status === "running") {
        this.scheduleGuytonJobPoll(
          input,
          started.snapshot.jobId,
          started.suggestedPollIntervalMs,
        );
      }
    }).catch((error: unknown) => {
      if (!this.protocolRequestStillCurrent(input)) return;
      this.failProtocol(
        input.key,
        input.sourceIdentity,
        error instanceof Error ? error.message : String(error),
      );
    });
  }

  private scheduleGuytonJobPoll(
    input: Parameters<ScientificProductScenarioRegistryV1[
      "startGuytonStarlingJob"
    ]>[0],
    jobId: string,
    delayMs: number,
  ): void {
    this.clearProtocolPollTimer(input.key);
    const timer = globalThis.setTimeout(() => {
      this.hemodynamicProtocolPollTimers.delete(input.key);
      this.pollGuytonStarlingJob(input, jobId, delayMs);
    }, Math.max(100, Math.min(2_000, delayMs)));
    this.hemodynamicProtocolPollTimers.set(input.key, timer);
  }

  private pollGuytonStarlingJob(
    input: Parameters<ScientificProductScenarioRegistryV1[
      "startGuytonStarlingJob"
    ]>[0],
    jobId: string,
    delayMs: number,
  ): void {
    if (!this.protocolRequestStillCurrent(input)) {
      if (this.protocolRequestOwnerStillCurrent(input)) {
        this.cancelAndDiscardStaleGuytonJob(input, jobId);
      }
      return;
    }
    const requestId = `workbench-hemodynamic-${
      ++hemodynamicProtocolRequestOrdinalV1
    }`;
    void input.runtime.client.request(Object.freeze({
      protocolId: SCIENTIFIC_COMMAND_PROTOCOL_V1_ID,
      kind: "pollGuytonStarlingProtocolJob" as const,
      requestId,
      sessionId: input.sessionId,
      jobId,
    })).then((response) => {
      if (!this.protocolRequestStillCurrent(input)) {
        if (this.protocolRequestOwnerStillCurrent(input)) {
          this.cancelAndDiscardStaleGuytonJob(input, jobId);
        }
        return;
      }
      if (!response.ok) {
        this.failProtocol(input.key, input.sourceIdentity, response.error.message);
        return;
      }
      if (
        response.commandKind !== "pollGuytonStarlingProtocolJob"
        || response.payload.kind !== "guytonStarlingProtocolJobProgress"
      ) {
        this.failProtocol(
          input.key,
          input.sourceIdentity,
          "Guyton/Starling job progress payload mismatch.",
        );
        return;
      }
      const snapshot = response.payload.snapshot;
      if (
        snapshot.jobId !== jobId
        || !sameProtocolJobSourceIdentity(snapshot.source, input.sourceIdentity)
      ) {
        this.failProtocol(
          input.key,
          input.sourceIdentity,
          "Guyton/Starling job progress identity mismatch.",
        );
        return;
      }
      this.publishGuytonJobSnapshot(input, snapshot);
      if (snapshot.status === "running") {
        this.scheduleGuytonJobPoll(input, jobId, delayMs);
      }
    }).catch((error: unknown) => {
      if (!this.protocolRequestStillCurrent(input)) {
        if (this.protocolRequestOwnerStillCurrent(input)) {
          this.cancelAndDiscardStaleGuytonJob(input, jobId);
        }
        return;
      }
      this.failProtocol(
        input.key,
        input.sourceIdentity,
        error instanceof Error ? error.message : String(error),
      );
    });
  }

  private publishGuytonJobSnapshot(
    input: Parameters<ScientificProductScenarioRegistryV1[
      "startGuytonStarlingJob"
    ]>[0],
    snapshot: MainWireScientificHemodynamicJobSnapshotV2,
  ): void {
    const status = snapshot.status === "running"
      ? "running" as const
      : snapshot.status === "complete"
        ? "complete" as const
        : "error" as const;
    this.hemodynamicProtocols.set(input.key, Object.freeze({
      kind: "guyton-starling" as const,
      status,
      sourceIdentity: input.sourceIdentity,
      result: snapshot.result,
      jobSnapshot: snapshot,
      errorMessage: snapshot.errorMessage,
    }));
    this.publishProtocols();
  }

  private protocolRequestOwnerStillCurrent(input: Readonly<{
    scenarioId: string;
    entry: ScenarioEntryV1;
    generation: number;
  }>): boolean {
    return !this.disposed
      && this.entries.get(input.scenarioId) === input.entry
      && input.entry.generation === input.generation;
  }

  private protocolRequestStillCurrent(input: Readonly<{
    scenarioId: string;
    entry: ScenarioEntryV1;
    runtime: ScientificProductScenarioRuntimeV1;
    sourceIdentity: Readonly<{
      revision: number;
      acceptedTimeSec: number;
      totalBloodVolumeMl: number;
    }>;
    generation: number;
  }>): boolean {
    if (!this.protocolRequestOwnerStillCurrent(input)) return false;
    return sameProtocolSourceIdentity(
      input.sourceIdentity,
      input.runtime.controlStore.getSnapshot().source.context.stateIdentity,
    );
  }

  private failProtocol(
    key: string,
    sourceIdentity: Readonly<{
      revision: number;
      acceptedTimeSec: number;
      totalBloodVolumeMl: number;
    }>,
    errorMessage: string,
  ): void {
    this.clearProtocolPollTimer(key);
    this.hemodynamicProtocols.set(key, Object.freeze({
      kind: "guyton-starling" as const,
      status: "error" as const,
      sourceIdentity,
      result: null,
      jobSnapshot: null,
      errorMessage,
    }));
    this.publishProtocols();
  }

  private cancelAndDiscardStaleGuytonJob(
    input: Readonly<{
      runtime: ScientificProductScenarioRuntimeV1;
      sourceIdentity: Readonly<{
        revision: number;
        acceptedTimeSec: number;
        totalBloodVolumeMl: number;
      }>;
      sessionId: string;
      key: string;
    }>,
    jobId: string,
  ): void {
    this.cancelGuytonStarlingJobBestEffort(
      input.runtime.client,
      input.sessionId,
      jobId,
    );
    const stale = this.hemodynamicProtocols.get(input.key);
    if (
      stale?.status === "running"
      && sameProtocolSourceIdentity(stale.sourceIdentity, input.sourceIdentity)
      && (stale.jobSnapshot === null || stale.jobSnapshot.jobId === jobId)
    ) {
      this.clearProtocolPollTimer(input.key);
      this.hemodynamicProtocols.delete(input.key);
      this.publishProtocols();
    }
  }

  private cancelGuytonStarlingJobBestEffort(
    client: MainWireScientificWorkerClientV1,
    sessionId: string,
    jobId: string,
  ): void {
    const requestId = `workbench-hemodynamic-${
      ++hemodynamicProtocolRequestOrdinalV1
    }`;
    void client.request(Object.freeze({
      protocolId: SCIENTIFIC_COMMAND_PROTOCOL_V1_ID,
      kind: "cancelGuytonStarlingProtocolJob" as const,
      requestId,
      sessionId,
      jobId,
    })).catch(() => undefined);
  }

  private clearProtocolPollTimer(key: string): void {
    const timer = this.hemodynamicProtocolPollTimers.get(key);
    if (timer !== undefined) globalThis.clearTimeout(timer);
    this.hemodynamicProtocolPollTimers.delete(key);
  }

  get maximumScenarioCount(): number {
    return MAXIMUM_PRODUCT_SCENARIO_COUNT_V1;
  }

  getRuntime(id: string): ScientificProductScenarioRuntimeV1 | null {
    return this.entries.get(id)?.runtime ?? null;
  }

  getPresentation(id: string): ScientificProductScenarioPresentationV1 | null {
    const entry = this.entries.get(id);
    const runtime = entry?.runtime;
    if (entry === undefined || runtime === null) return null;
    const snapshot = runtime.controlStore.getSnapshot();
    const displayedEvidence = snapshot.provenance.displayedEvidence;
    const validatedCycle = validatedCycleForDisplayV1(
      displayedEvidence,
      snapshot.frames,
      runtime.result.terminalCycle as MainWireScientificValidatedTerminalCycleV1,
    );
    const sourceCycle = validatedCycleForDisplayV1(
      "retained-period1-source-cycle",
      snapshot.source.frames,
      runtime.result.terminalCycle as MainWireScientificValidatedTerminalCycleV1,
    );
    const metricSelection = metricCycleForDisplayV1({
      scenarioId: entry.descriptor.id,
      displayedEvidence,
      frames: snapshot.frames,
      transientOriginAcceptedTimeSec:
        snapshot.liveTransitionOriginAcceptedTimeSec,
      validatedCycle,
      sourceCycle,
      cache: this.transientMetricBeatCache,
    });
    return Object.freeze({
      descriptor: entry.descriptor,
      frames: snapshot.frames,
      periodicCycleFrames: validatedCycle?.frames ?? null,
      cycleDurationSec: validatedCycle?.durationSec
        ?? runtime.result.terminalCycle.durationSec,
      transientOriginAcceptedTimeSec:
        displayedEvidence === "open-transient-no-periodic-claim"
          ? snapshot.liveTransitionOriginAcceptedTimeSec
            ?? snapshot.frames[0]?.acceptedTimeSec
            ?? null
          : null,
      validatedCycle,
      metricCycle: metricSelection.cycle,
      metricEvidence: metricSelection.evidence,
      displayedEvidence,
      workspaceDocument: runtime.workspaceDocument,
    });
  }

  addPreset(
    caseId: string,
    options: AddScientificScenarioOptionsV1 = {},
  ): string | null {
    if (this.disposed || this.entries.size >= MAXIMUM_PRODUCT_SCENARIO_COUNT_V1) {
      return null;
    }
    const caseEntry = scientificProductCaseByIdV1(caseId);
    if (caseEntry === null) return null;
    const id = nextScenarioIdV1();
    const requestedName = options.name ?? caseEntry.displayName;
    const descriptor = createDescriptorV1(
      id,
      caseEntry,
      uniqueScenarioNameV1(
        requestedName,
        [...this.entries.values()].map(({ descriptor: existing }) => existing.name),
      ),
      options.color ?? SCENARIO_COLORS_V1[this.entries.size % SCENARIO_COLORS_V1.length],
      "loading",
      "Creating an independent scientific session…",
    );
    const entry: ScenarioEntryV1 = {
      descriptor,
      generation: 0,
      loadingClient: null,
      runtime: null,
      unsubscribeStore: null,
      unsubscribeFrames: null,
      pendingDuplicateDraft: options.duplicateDraft ?? null,
      duplicateTransitionModeState: "none",
    };
    this.entries.set(id, entry);
    this.publishDescriptors();
    try {
      entry.loadingClient = createScientificProductWorkerClientV1();
    } catch (error: unknown) {
      entry.descriptor = {
        ...entry.descriptor,
        lifecycle: "failed",
        statusMessage: error instanceof Error ? error.message : String(error),
      };
      this.publishDescriptors();
      return id;
    }
    const generation = entry.generation;
    void loadScientificProductScenarioRuntimeV1(
      caseEntry,
      options.onProgress,
      entry.loadingClient,
    )
      .then((runtime) => {
        if (
          this.disposed
          || this.entries.get(id) !== entry
          || entry.generation !== generation
        ) {
          runtime.client.terminate();
          return;
        }
        entry.loadingClient = null;
        entry.descriptor = {
          ...entry.descriptor,
          lifecycle: "ready",
          statusMessage: "Release-bound periodic cycle ready.",
        };
        this.attachRuntime(entry, runtime);
        this.publishDescriptors();
        this.publishFrames();
      })
      .catch((error: unknown) => {
        if (
          this.disposed
          || this.entries.get(id) !== entry
          || entry.generation !== generation
        ) return;
        entry.descriptor = {
          ...entry.descriptor,
          lifecycle: "failed",
          statusMessage: error instanceof Error ? error.message : String(error),
        };
        this.publishDescriptors();
      });
    return id;
  }

  duplicateStable(sourceId: string): string | null {
    const source = this.entries.get(sourceId);
    if (source === undefined) return null;
    const sourceSnapshot = source.runtime?.controlStore.getSnapshot();
    const committed = sourceSnapshot?.source.context.controlState.controls;
    const duplicateDraft = committed === undefined ? undefined : Object.freeze({
      systemic: committed[
        "circulation.systemic-vascular-resistance-scale"
      ],
      pulmonary: committed[
        "circulation.pulmonary-vascular-resistance-scale"
      ],
      venousTone: committed["circulation.venous-tone"],
      arterialStiffness: committed["circulation.arterial-stiffness"],
      peepCmH2O: committed["ventilation.peep-cm-h2o"],
      pericardialFluidVolumeMl:
        committed["pericardium.prescribed-fluid-volume-ml"],
    });
    return this.addPreset(source.descriptor.source.caseId, {
      name: `${source.descriptor.name} copy`,
      color: SCENARIO_COLORS_V1[this.entries.size % SCENARIO_COLORS_V1.length],
      duplicateDraft,
    });
  }

  remove(id: string): boolean {
    if (this.entries.size <= 1) return false;
    const entry = this.entries.get(id);
    if (entry === undefined) return false;
    entry.generation += 1;
    this.detachEntry(entry);
    this.entries.delete(id);
    this.transientMetricBeatCache.delete(id);
    for (const kind of ["guyton-starling", "pv-relations"] as const) {
      this.hemodynamicProtocols.delete(protocolCacheKey(id, kind));
    }
    this.publishDescriptors();
    this.publishFrames();
    return true;
  }

  rename(id: string, name: string): void {
    this.patchDescriptor(id, { name });
  }

  recolor(id: string, color: string): void {
    this.patchDescriptor(id, { color });
  }

  toggleGlobalVisibility(id: string): void {
    const descriptor = this.entries.get(id)?.descriptor;
    if (descriptor !== undefined) {
      this.patchDescriptor(id, { isVisible: !descriptor.isVisible });
    }
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    for (const entry of this.entries.values()) {
      entry.generation += 1;
      this.detachEntry(entry);
    }
    this.entries.clear();
    for (const timer of this.hemodynamicProtocolPollTimers.values()) {
      globalThis.clearTimeout(timer);
    }
    this.hemodynamicProtocolPollTimers.clear();
    this.transientMetricBeatCache.clear();
    this.hemodynamicProtocols.clear();
    this.publishDescriptors();
    this.publishFrames();
  }

  private attachRuntime(
    entry: ScenarioEntryV1,
    loaded: ScientificProductLoadedRuntimeV1,
  ): void {
    const initialSource = sourceFromLoadedRuntimeV1(loaded);
    const consumedRequestCount = loaded.kind === "official"
      ? SCIENTIFIC_WORKBENCH_OFFICIAL_BOOTSTRAP_REQUEST_COUNT_V0
      : 1 + loaded.result.completedBeatCount
        + SCIENTIFIC_WORKBENCH_TERMINAL_CYCLE_V1.workerCommandCount;
    const controlStore = createScientificWorkbenchResearchControlStoreV0(
      initialSource,
      Math.max(0, SCIENTIFIC_WORKBENCH_REQUEST_CAPACITY_V0 - consumedRequestCount),
    );
    entry.runtime = Object.freeze({
      descriptor: entry.descriptor,
      client: loaded.client,
      sessionId: loaded.sessionId,
      kind: loaded.kind,
      result: loaded.result,
      workspaceDocument: loaded.result.workspaceDocument,
      initialSource,
      controlStore,
    });
    entry.unsubscribeStore = controlStore.subscribe(() => {
      this.tryApplyDuplicateDraft(entry);
    });
    entry.unsubscribeFrames = controlStore.subscribeFrames(() => {
      this.publishFrames();
    });
  }

  private tryApplyDuplicateDraft(entry: ScenarioEntryV1): void {
    const runtime = entry.runtime;
    if (runtime === null) return;
    const snapshot = runtime.controlStore.getSnapshot();

    // Duplicates settle with the periodic path, but that is an internal
    // initialization detail. Once the promoted source is idle, restore the
    // product default so the first user interaction is a live transition.
    if (entry.duplicateTransitionModeState === "awaiting-settlement") {
      if (!snapshot.ownerConnected || snapshot.busy) return;
      entry.duplicateTransitionModeState = "none";
      if (snapshot.mode !== "live") {
        runtime.controlStore.actions.setMode("live");
      }
      return;
    }
    if (entry.duplicateTransitionModeState === "awaiting-start") return;

    const draft = entry.pendingDuplicateDraft;
    if (draft === null) return;
    if (!snapshot.ownerConnected || snapshot.busy) return;
    entry.pendingDuplicateDraft = null;
    const controls = snapshot.source.context.controlState.controls;
    const systemic = controls[
      "circulation.systemic-vascular-resistance-scale"
    ];
    const pulmonary = controls[
      "circulation.pulmonary-vascular-resistance-scale"
    ];
    if (
      draft.systemic === systemic
      && draft.pulmonary === pulmonary
      && draft.venousTone === controls["circulation.venous-tone"]
      && draft.arterialStiffness
        === controls["circulation.arterial-stiffness"]
      && draft.peepCmH2O === controls["ventilation.peep-cm-h2o"]
      && draft.pericardialFluidVolumeMl
        === controls["pericardium.prescribed-fluid-volume-ml"]
    ) return;
    runtime.controlStore.actions.setSystemicScale(draft.systemic);
    runtime.controlStore.actions.setPulmonaryScale(draft.pulmonary);
    runtime.controlStore.actions.setControlValue(
      "circulation.venous-tone",
      draft.venousTone,
    );
    runtime.controlStore.actions.setControlValue(
      "circulation.arterial-stiffness",
      draft.arterialStiffness,
    );
    runtime.controlStore.actions.setControlValue(
      "ventilation.peep-cm-h2o",
      draft.peepCmH2O,
    );
    runtime.controlStore.actions.setControlValue(
      "pericardium.prescribed-fluid-volume-ml",
      draft.pericardialFluidVolumeMl,
    );
    runtime.controlStore.actions.setMode("steady");
    entry.duplicateTransitionModeState = "awaiting-start";
    globalThis.setTimeout(() => {
      if (this.entries.get(entry.descriptor.id) !== entry) return;
      const next = runtime.controlStore.getSnapshot();
      if (next.ownerConnected && !next.busy && !next.noChange) {
        entry.duplicateTransitionModeState = "awaiting-settlement";
        runtime.controlStore.actions.applyTransition();
      } else {
        entry.duplicateTransitionModeState = "none";
        if (next.ownerConnected && next.mode !== "live") {
          runtime.controlStore.actions.setMode("live");
        }
      }
    }, 0);
  }

  private patchDescriptor(
    id: string,
    patch: Partial<Pick<ScientificProductScenarioDescriptorV1,
      "name" | "color" | "isVisible">>,
  ): void {
    const entry = this.entries.get(id);
    if (entry === undefined) return;
    entry.descriptor = { ...entry.descriptor, ...patch };
    if (entry.runtime !== null) {
      entry.runtime = Object.freeze({
        ...entry.runtime,
        descriptor: entry.descriptor,
      });
    }
    this.publishDescriptors();
    this.publishFrames();
  }

  private detachEntry(entry: ScenarioEntryV1): void {
    const guytonKey = protocolCacheKey(entry.descriptor.id, "guyton-starling");
    const activeGuyton = this.hemodynamicProtocols.get(guytonKey);
    if (
      entry.runtime !== null
      && activeGuyton?.status === "running"
      && activeGuyton.jobSnapshot !== null
    ) {
      this.cancelGuytonStarlingJobBestEffort(
        entry.runtime.client,
        entry.runtime.controlStore.getSnapshot().source.sessionId,
        activeGuyton.jobSnapshot.jobId,
      );
    }
    this.clearProtocolPollTimer(guytonKey);
    this.clearProtocolPollTimer(protocolCacheKey(
      entry.descriptor.id,
      "pv-relations",
    ));
    entry.duplicateTransitionModeState = "none";
    entry.unsubscribeStore?.();
    entry.unsubscribeStore = null;
    entry.unsubscribeFrames?.();
    entry.unsubscribeFrames = null;
    entry.loadingClient?.terminate();
    entry.loadingClient = null;
    entry.runtime?.client.terminate();
    entry.runtime = null;
  }

  private publishDescriptors(): void {
    this.descriptorSnapshot = Object.freeze(
      [...this.entries.values()].map((entry) => entry.descriptor),
    );
    for (const listener of [...this.descriptorListeners]) listener();
  }

  private publishFrames(): void {
    this.frameVersion += 1;
    for (const listener of [...this.frameListeners]) listener();
  }

  private publishProtocols(): void {
    for (const listener of [...this.protocolListeners]) listener();
  }
}

function protocolCacheKey(
  scenarioId: string,
  kind: ScientificProductHemodynamicProtocolKindV1,
): string {
  return `${scenarioId}:${kind}`;
}

const EMPTY_HEMODYNAMIC_PROTOCOL_PRESENTATIONS_V1 = Object.freeze({
  "guyton-starling": Object.freeze({
    kind: "guyton-starling" as const,
    status: "idle" as const,
    sourceIdentity: null,
    result: null,
    jobSnapshot: null,
    errorMessage: null,
  }),
  "pv-relations": Object.freeze({
    kind: "pv-relations" as const,
    status: "idle" as const,
    sourceIdentity: null,
    result: null,
    jobSnapshot: null,
    errorMessage: null,
  }),
}) satisfies Readonly<Record<
  ScientificProductHemodynamicProtocolKindV1,
  ScientificProductHemodynamicProtocolPresentationV1
>>;

function sameProtocolSourceIdentity(
  left: Readonly<{
    revision: number;
    acceptedTimeSec: number;
    totalBloodVolumeMl: number;
  }> | null,
  right: Readonly<{
    revision: number;
    acceptedTimeSec: number;
    totalBloodVolumeMl: number;
  }> | null,
): boolean {
  return left !== null && right !== null
    && left.revision === right.revision
    && left.acceptedTimeSec === right.acceptedTimeSec
    && left.totalBloodVolumeMl === right.totalBloodVolumeMl;
}

function sameProtocolJobSourceIdentity(
  left: Readonly<{
    revision: number;
    acceptedTimeSec: number;
    fixedTotalBloodVolumeMl: number;
  }>,
  right: Readonly<{
    revision: number;
    acceptedTimeSec: number;
    totalBloodVolumeMl: number;
  }>,
): boolean {
  return left.revision === right.revision
    && left.acceptedTimeSec === right.acceptedTimeSec
    && left.fixedTotalBloodVolumeMl === right.totalBloodVolumeMl;
}

export async function loadScientificProductScenarioRuntimeV1(
  caseEntry: ScientificProductCaseV1,
  onProgress?: (progress: ScientificWorkbenchResearchProgressV1) => void,
  providedClient?: MainWireScientificWorkerClientV1,
): Promise<ScientificProductLoadedRuntimeV1> {
  const client = providedClient ?? createScientificProductWorkerClientV1();
  const sessionId = `product-workbench-v1-${++sessionOrdinalV1}`;
  try {
    if (caseEntry.kind === "official-exact-periodic") {
      const result = await loadScientificWorkbenchOfficialCycleV1(client, {
        sessionId,
      });
      return Object.freeze({ client, sessionId, result, kind: "official" });
    }
    const result = await loadScientificWorkbenchResearchCycleV1(client, {
      sessionId,
      presetId: caseEntry.source.presetId,
      onProgress,
    });
    return Object.freeze({ client, sessionId, result, kind: "research" });
  } catch (error) {
    client.terminate();
    throw error;
  }
}

export function createScientificProductWorkerClientV1(): MainWireScientificWorkerClientV1 {
  return new MainWireScientificWorkerClientV1({
    maximumPendingRequestCount: 2,
    maximumRequestCountPerClientLifetime: SCIENTIFIC_WORKBENCH_REQUEST_CAPACITY_V0,
    requestTimeoutMs: 3 * 60_000,
  });
}

function createDescriptorV1(
  id: string,
  caseEntry: ScientificProductCaseV1,
  name: string,
  color: string,
  lifecycle: ScientificProductScenarioLifecycleV1,
  statusMessage: string,
): ScientificProductScenarioDescriptorV1 {
  return Object.freeze({
    id,
    name,
    color,
    isVisible: true,
    lifecycle,
    statusMessage,
    source: Object.freeze({
      caseId: caseEntry.caseId,
      releaseId: SCIENTIFIC_PRODUCT_RELEASE_REF_V1.id,
      releaseVersion: SCIENTIFIC_PRODUCT_RELEASE_REF_V1.version,
      releaseSha256: SCIENTIFIC_PRODUCT_RELEASE_REF_V1.sha256,
    }),
  });
}

function sourceFromLoadedRuntimeV1(
  runtime: ScientificProductLoadedRuntimeV1,
): ScientificWorkbenchResearchControlSourceV0 {
  return Object.freeze({
    sessionId: runtime.sessionId,
    context: runtime.result.researchControlContext,
    frames: runtime.result.terminalCycle.frames,
  });
}

function validatedCycleForDisplayV1(
  displayedEvidence: ScientificWorkbenchDisplayedEvidenceV0,
  frames: readonly MainWireScientificObservableFrameV1[],
  initialCycle: MainWireScientificValidatedTerminalCycleV1,
): MainWireScientificValidatedTerminalCycleV1 | null {
  if (displayedEvidence === "open-transient-no-periodic-claim") return null;
  if (frames === initialCycle.frames) return initialCycle;
  const cached = VALIDATED_CYCLE_BY_FRAME_ARRAY_V1.get(frames as object);
  if (cached !== undefined) return cached;
  const first = frames[0];
  const last = frames.at(-1);
  if (first === undefined || last === undefined || frames.length !== 501) return null;
  const durationSec = last.acceptedTimeSec - first.acceptedTimeSec;
  if (!Number.isFinite(durationSec) || Math.abs(durationSec - 1) > 1e-10) {
    return null;
  }
  const cycle = Object.freeze({
    frames,
    releaseRef: first.releaseRef,
    durationSec,
    evidence: Object.freeze({
      exactReleaseRefUniform: true as const,
      revisionsContiguous: true as const,
      cadenceUniform: true as const,
      bothCycleBoundariesRetained: true as const,
      periodicOrbitClassifiedP1: true as const,
      smoothingOrInterpolationApplied: false as const,
    }),
  });
  VALIDATED_CYCLE_BY_FRAME_ARRAY_V1.set(frames as object, cycle);
  return cycle;
}

type TransientMetricBeatCacheV1 = Readonly<{
  originAcceptedTimeSec: number;
  anchorAcceptedTimeSec: number;
  completedBeatIndex: number;
  beat: MainWireScientificCompleteTransientBeatV1 | null;
}>;

type MetricCycleSelectionV1 = Readonly<{
  cycle: MainWireScientificMetricCycleV1 | null;
  evidence:
    | "validated-periodic-P1"
    | "retained-periodic-source"
    | "provisional-complete-transient-beat"
    | "unavailable";
}>;

function metricCycleForDisplayV1({
  scenarioId,
  displayedEvidence,
  frames,
  transientOriginAcceptedTimeSec,
  validatedCycle,
  sourceCycle,
  cache,
}: Readonly<{
  scenarioId: string;
  displayedEvidence: ScientificWorkbenchDisplayedEvidenceV0;
  frames: readonly MainWireScientificObservableFrameV1[];
  transientOriginAcceptedTimeSec: number | null;
  validatedCycle: MainWireScientificValidatedTerminalCycleV1 | null;
  sourceCycle: MainWireScientificValidatedTerminalCycleV1 | null;
  cache: Map<string, TransientMetricBeatCacheV1>;
}>): MetricCycleSelectionV1 {
  if (displayedEvidence !== "open-transient-no-periodic-claim") {
    cache.delete(scenarioId);
    return validatedCycle === null
      ? Object.freeze({ cycle: null, evidence: "unavailable" as const })
      : Object.freeze({
        cycle: validatedCycle,
        evidence: "validated-periodic-P1" as const,
      });
  }

  const retainedSourceSelection = sourceCycle === null
    ? Object.freeze({ cycle: null, evidence: "unavailable" as const })
    : Object.freeze({
      cycle: sourceCycle,
      evidence: "retained-periodic-source" as const,
    });
  const origin = transientOriginAcceptedTimeSec;
  const last = frames.at(-1);
  if (origin === null || last === undefined) return retainedSourceSelection;

  const previous = cache.get(scenarioId);
  const anchor = previous?.originAcceptedTimeSec === origin
    ? previous.anchorAcceptedTimeSec
    : firstAcceptedStepTimeAtOrAfterV1(frames, origin);
  if (anchor === null) return retainedSourceSelection;

  const completedBeatIndex = Math.floor(
    last.acceptedTimeSec - anchor + 1e-10,
  );
  if (completedBeatIndex < 1) {
    cache.set(scenarioId, Object.freeze({
      originAcceptedTimeSec: origin,
      anchorAcceptedTimeSec: anchor,
      completedBeatIndex: 0,
      beat: null,
    }));
    return retainedSourceSelection;
  }
  if (
    previous?.originAcceptedTimeSec === origin
    && previous.completedBeatIndex === completedBeatIndex
    && previous.beat !== null
  ) {
    return Object.freeze({
      cycle: previous.beat,
      evidence: "provisional-complete-transient-beat" as const,
    });
  }

  const startAcceptedTimeSec = anchor + completedBeatIndex - 1;
  const beat = completeTransientMetricBeatV1(
    frames,
    startAcceptedTimeSec,
  );
  cache.set(scenarioId, Object.freeze({
    originAcceptedTimeSec: origin,
    anchorAcceptedTimeSec: anchor,
    completedBeatIndex,
    beat,
  }));
  return beat === null
    ? retainedSourceSelection
    : Object.freeze({
      cycle: beat,
      evidence: "provisional-complete-transient-beat" as const,
    });
}

function firstAcceptedStepTimeAtOrAfterV1(
  frames: readonly MainWireScientificObservableFrameV1[],
  originAcceptedTimeSec: number,
): number | null {
  for (const frame of frames) {
    if (
      frame.source === "accepted-step"
      && frame.acceptedTimeSec >= originAcceptedTimeSec - 1e-10
    ) {
      return frame.acceptedTimeSec;
    }
  }
  return null;
}

/**
 * Extracts one exact, complete, accepted-step beat. Partial live histories are
 * rejected so metric cards update only at a beat boundary rather than on each
 * render frame.
 */
export function completeTransientMetricBeatV1(
  frames: readonly MainWireScientificObservableFrameV1[],
  startAcceptedTimeSec: number,
): MainWireScientificCompleteTransientBeatV1 | null {
  const startIndex = frames.findIndex((frame) => (
    frame.source === "accepted-step"
    && Math.abs(frame.acceptedTimeSec - startAcceptedTimeSec) <= 1e-10
  ));
  if (startIndex < 0) return null;
  const beatFrames = frames.slice(startIndex, startIndex + 501);
  if (beatFrames.length !== 501) return null;
  const first = beatFrames[0]!;
  const last = beatFrames.at(-1)!;
  if (
    first.source !== "accepted-step"
    || last.source !== "accepted-step"
    || Math.abs(last.acceptedTimeSec - first.acceptedTimeSec - 1) > 1e-10
  ) {
    return null;
  }
  for (let index = 1; index < beatFrames.length; index += 1) {
    const previous = beatFrames[index - 1]!;
    const current = beatFrames[index]!;
    if (
      current.source !== "accepted-step"
      || current.revision !== previous.revision + 1
      || !sameSimulationReleaseRef(first.releaseRef, current.releaseRef)
      || Math.abs(current.acceptedTimeSec - previous.acceptedTimeSec - 0.002)
        > 1e-10
    ) {
      return null;
    }
  }
  return Object.freeze({
    frames: Object.freeze(beatFrames),
    releaseRef: first.releaseRef,
    durationSec: 1,
    evidence: Object.freeze({
      exactReleaseRefUniform: true as const,
      revisionsContiguous: true as const,
      cadenceUniform: true as const,
      bothBeatBoundariesMeasured: true as const,
      transientBeatFullyMeasured: true as const,
      smoothingOrInterpolationApplied: false as const,
    }),
  });
}

function nextScenarioIdV1(): string {
  scenarioOrdinalV1 += 1;
  return `scientific-scenario-${scenarioOrdinalV1}`;
}

export function uniqueScenarioNameV1(
  requestedName: string,
  existingNames: readonly string[],
): string {
  const base = requestedName.trim() || "Scenario";
  const occupied = new Set(existingNames.map((name) => name.trim()));
  if (!occupied.has(base)) return base;
  let suffix = 2;
  while (occupied.has(`${base} ${suffix}`)) suffix += 1;
  return `${base} ${suffix}`;
}

export function isScientificControlScaleV1(
  value: number,
): value is MainWireScientificResearchControlScaleV0 {
  return (MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_SCALE_VALUES_V0 as
    readonly number[]).includes(value);
}
