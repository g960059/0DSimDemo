import type {
  ExperimentSurfaceV2,
  ExperimentSnapshotV2,
  ExperimentWorkspaceV2,
} from "@/studio/contracts/v2/content";
import type {
  StudioSimulationAnalysisV2,
  StudioSimulationFrameV2,
} from "@/studio/contracts/v2/simulation";
import {
  type StudioSimulationWorkerAddScenarioFromPresetInputV2,
  type StudioSimulationWorkerApplyControlInputV2,
  type StudioSimulationWorkerCreateSnapshotInputV2,
  type StudioSimulationWorkerDeleteScenarioInputV2,
  type StudioSimulationWorkerDuplicateScenarioInputV2,
  type StudioSimulationWorkerInitializeInputV2,
  type StudioSimulationWorkerReadScenariosInputV2,
  type StudioSimulationWorkerRenameScenarioInputV2,
  type StudioSimulationWorkerRequestAnalysisInputV2,
  type StudioSimulationWorkerRequestV2,
  type StudioSimulationWorkerResponseV2,
  type StudioSimulationWorkerSaveDraftInputV2,
  type StudioSimulationWorkerScenarioCapturesV2,
  type StudioSimulationWorkerScenarioStateV2,
  type StudioSimulationWorkerSelectScenarioInputV2,
  createStudioSimulationAddScenarioFromPresetRequestV2,
  createStudioSimulationApplyControlRequestV2,
  createStudioSimulationAdvanceRequestV2,
  createStudioSimulationCreateSnapshotRequestV2,
  createStudioSimulationDeleteScenarioRequestV2,
  createStudioSimulationDisposeRequestV2,
  createStudioSimulationDuplicateScenarioRequestV2,
  createStudioSimulationInitializeRequestV2,
  createStudioSimulationReadScenariosRequestV2,
  createStudioSimulationRenameScenarioRequestV2,
  createStudioSimulationRequestAnalysisRequestV2,
  createStudioSimulationSaveDraftRequestV2,
  createStudioSimulationSelectScenarioRequestV2,
  validateStudioSimulationWorkerResponseV2,
} from "@/studio/workers/StudioSimulationWorkerProtocolV2";

const WORKER_RESPONSE_TIMEOUT_MS_V2 = 30_000;
/**
 * Snapshot qualification executes the canonical, bounded periodic protocol for
 * every Scenario sequentially. It therefore has a deliberately separate,
 * user-configurable deadline instead of inheriting the interactive RPC budget.
 * A deadline remains finite so a wedged qualification always terminates the
 * Worker and rejects every pending request deterministically.
 */
const WORKER_SNAPSHOT_QUALIFICATION_TIMEOUT_MS_V2 = 15 * 60_000;

const QUALIFIED_SNAPSHOT_COMMIT_V2 = Symbol(
  "StudioSimulationWorkerQualifiedSnapshotCommitV2",
);
const qualifiedSnapshotCommitsV2 = new WeakSet<object>();

/**
 * Runtime authority minted only after one correlated response from the
 * persistent Worker's sealed Snapshot authoring path.
 *
 * The private symbol prevents ordinary structural construction in TypeScript;
 * the private WeakSet makes casts, clones, and hand-built JavaScript objects
 * fail at the browser persistence boundary as well.
 */
export type StudioSimulationWorkerQualifiedSnapshotCommitV2 = Readonly<{
  snapshot: ExperimentSnapshotV2;
  workspace: ExperimentWorkspaceV2;
  [QUALIFIED_SNAPSHOT_COMMIT_V2]: true;
}>;

export function assertStudioSimulationWorkerQualifiedSnapshotCommitV2(
  value: unknown,
): asserts value is StudioSimulationWorkerQualifiedSnapshotCommitV2 {
  if (
    value === null
    || typeof value !== "object"
    || !qualifiedSnapshotCommitsV2.has(value)
  ) {
    throw new Error(
      "Browser Snapshot persistence requires a sealed qualified Worker result",
    );
  }
}

export interface StudioSimulationWorkerTransportV2 {
  postMessage(message: unknown): void;
  terminate(): void;
  addEventListener(
    type: "message",
    listener: (event: MessageEvent<unknown>) => void,
  ): void;
  addEventListener(
    type: "error",
    listener: (event: ErrorEvent) => void,
  ): void;
  removeEventListener(
    type: "message",
    listener: (event: MessageEvent<unknown>) => void,
  ): void;
  removeEventListener(
    type: "error",
    listener: (event: ErrorEvent) => void,
  ): void;
}

export type StudioSimulationWorkerClientOptionsV2 = Readonly<{
  responseTimeoutMs?: number;
  snapshotQualificationTimeoutMs?: number;
}>;

type StudioSimulationWorkerClientTestOptionsV2 = Readonly<{
  transport: StudioSimulationWorkerTransportV2;
  responseTimeoutMs?: number;
  snapshotQualificationTimeoutMs?: number;
}>;

const TEST_CLIENT_CONSTRUCTION_AUTHORITY_V2 = Symbol(
  "StudioSimulationWorkerClientTestConstructionV2",
);

type TestClientConstructionV2 = Readonly<{
  authority: typeof TEST_CLIENT_CONSTRUCTION_AUTHORITY_V2;
  transport: StudioSimulationWorkerTransportV2;
}>;

type InternalClientConstructorV2 = new (
  options: StudioSimulationWorkerClientOptionsV2,
  construction: TestClientConstructionV2,
) => StudioSimulationWorkerClientV2;

type ExpectedResponseV2 =
  | Readonly<{
      kind: "initialized";
      modelId: string;
      runtimeSessionId: string;
      scenarioId: string;
    }>
  | Readonly<{
      kind: "advanced";
      modelId: string;
      runtimeSessionId: string;
      scenarioId: string;
      inputEpoch: number;
      minimumAcceptedRevision: number;
      minimumAcceptedTimeSec: number;
      stepCount: number;
    }>
  | Readonly<{
      kind: "control-applied";
      modelId: string;
      runtimeSessionId: string;
      scenarioId: string;
      expectedInputEpoch: number;
    }>
  | Readonly<{
      kind: "analysis-result";
      modelId: string;
      runtimeSessionId: string;
      scenarioId: string;
      analysisId: string;
      inputEpoch: number;
      sourceAcceptedRevision: number;
      sourceAcceptedTimeSec: number;
    }>
  | Readonly<{
      kind: "scenario-state";
      modelId: string;
      runtimeSessionId: string;
    }>
  | Readonly<{
      kind: "scenarios-captured";
      modelId: string;
      runtimeSessionId: string;
    }>
  | Readonly<{
      kind: "draft-saved";
      modelId: string;
      runtimeSessionId: string;
      experimentId: string;
      surface: ExperimentSurfaceV2;
      expectedDraftVersion: number | null;
      priorWorkspace: ExperimentWorkspaceV2 | undefined;
    }>
  | Readonly<{
      kind: "snapshot-created";
      modelId: string;
      experimentId: string;
      candidateWorkspace: ExperimentWorkspaceV2;
    }>
  | Readonly<{
      kind: "disposed";
    }>;

type PendingRequestV2 = Readonly<{
  resolve(response: StudioSimulationWorkerResponseV2): void;
  reject(error: Error): void;
  timeout: ReturnType<typeof setTimeout>;
  expected: ExpectedResponseV2;
}>;

type ClientStateV2 =
  | "new"
  | "initializing"
  | "active"
  | "disposing"
  | "terminated";

type ScenarioOperationV2 =
  | "read-scenarios"
  | "select-scenario"
  | "add-scenario-from-preset"
  | "duplicate-scenario"
  | "rename-scenario"
  | "delete-scenario";

export class StudioSimulationWorkerClientV2 {
  readonly #worker: StudioSimulationWorkerTransportV2;
  readonly #responseTimeoutMs: number;
  readonly #snapshotQualificationTimeoutMs: number;
  readonly #pending = new Map<number, PendingRequestV2>();
  #nextRequestId = 1;
  #state: ClientStateV2 = "new";
  #runtimeSessionId: string | undefined;
  #scenarioId: string | undefined;
  #modelId: string | undefined;
  #inputEpoch: number | undefined;
  #acceptedRevision: number | undefined;
  #acceptedTimeSec: number | undefined;
  #operationInFlight:
    | "advance"
    | "apply-control"
    | "request-analysis"
    | "read-scenarios"
    | "select-scenario"
    | "add-scenario-from-preset"
    | "duplicate-scenario"
    | "rename-scenario"
    | "delete-scenario"
    | "save-draft"
    | "create-snapshot"
    | undefined;
  #workspace: ExperimentWorkspaceV2 | undefined;
  #disposePromise: Promise<void> | undefined;

  /** Production construction always owns the real module Worker. */
  constructor(options?: StudioSimulationWorkerClientOptionsV2);
  constructor(
    options: StudioSimulationWorkerClientOptionsV2 = {},
    testConstruction?: TestClientConstructionV2,
  ) {
    const responseTimeoutMs = options.responseTimeoutMs
      ?? WORKER_RESPONSE_TIMEOUT_MS_V2;
    if (
      !Number.isSafeInteger(responseTimeoutMs)
      || responseTimeoutMs < 1
      || responseTimeoutMs > 300_000
    ) {
      throw new Error("simulation worker response timeout must be within [1, 300000]");
    }
    this.#responseTimeoutMs = responseTimeoutMs;
    const snapshotQualificationTimeoutMs =
      options.snapshotQualificationTimeoutMs
      ?? WORKER_SNAPSHOT_QUALIFICATION_TIMEOUT_MS_V2;
    if (
      !Number.isSafeInteger(snapshotQualificationTimeoutMs)
      || snapshotQualificationTimeoutMs < 1
      || snapshotQualificationTimeoutMs > 86_400_000
    ) {
      throw new Error(
        "simulation worker Snapshot qualification timeout must be within [1, 86400000]",
      );
    }
    this.#snapshotQualificationTimeoutMs = snapshotQualificationTimeoutMs;
    if (import.meta.env.PROD) {
      if (testConstruction !== undefined) {
        throw new Error(
          "production simulation worker construction rejects injected transport",
        );
      }
      this.#worker = new Worker(
        new URL("./StudioSimulationWorkerV2.ts", import.meta.url),
        { type: "module", name: "circleheart-studio-v2-simulation" },
      );
    } else {
      if (
        testConstruction !== undefined
        && testConstruction.authority !== TEST_CLIENT_CONSTRUCTION_AUTHORITY_V2
      ) {
        throw new Error("simulation worker test construction authority is invalid");
      }
      this.#worker = testConstruction?.transport ?? new Worker(
          new URL("./StudioSimulationWorkerV2.ts", import.meta.url),
          { type: "module", name: "circleheart-studio-v2-simulation" },
        );
    }
    this.#worker.addEventListener("message", this.#onMessage);
    this.#worker.addEventListener("error", this.#onWorkerError);
  }

  async initialize(
    input: StudioSimulationWorkerInitializeInputV2,
  ): Promise<StudioSimulationFrameV2> {
    if (this.#state !== "new") {
      throw new Error("simulation worker client cannot initialize twice");
    }
    const request = createStudioSimulationInitializeRequestV2(
      this.#allocateRequestId(),
      input,
    );
    this.#state = "initializing";
    try {
      const response = await this.#postRequest(request, {
        kind: "initialized",
        modelId: request.expectedModelId,
        runtimeSessionId: request.runtimeSessionId,
        scenarioId: request.scenarioId,
      });
      if (response.status !== "ok" || response.kind !== "initialized") {
        throw new Error("simulation worker returned another initialize response");
      }
      this.#runtimeSessionId = request.runtimeSessionId;
      this.#scenarioId = request.scenarioId;
      this.#modelId = request.expectedModelId;
      this.#inputEpoch = response.frame.inputEpoch;
      this.#acceptedRevision = response.frame.acceptedRevision;
      this.#acceptedTimeSec = response.frame.acceptedTimeSec;
      this.#workspace = request.authoringSeed?.workspace;
      this.#state = "active";
      return response.frame;
    } catch (error) {
      this.#terminateWith(errorAsErrorV2(error));
      throw error;
    }
  }

  async advance(input: Readonly<{
    runtimeSessionId: string;
    scenarioId: string;
    stepCount: number;
  }>): Promise<readonly StudioSimulationFrameV2[]> {
    if (
      this.#state !== "active"
      || this.#runtimeSessionId === undefined
      || this.#scenarioId === undefined
      || this.#modelId === undefined
      || this.#inputEpoch === undefined
      || this.#acceptedRevision === undefined
      || this.#acceptedTimeSec === undefined
    ) {
      throw new Error("simulation worker client is not active");
    }
    if (this.#operationInFlight !== undefined) {
      throw new Error("simulation worker client already has an operation in flight");
    }
    const request = createStudioSimulationAdvanceRequestV2(
      this.#allocateRequestId(),
      input,
    );
    if (
      request.runtimeSessionId !== this.#runtimeSessionId
      || request.scenarioId !== this.#scenarioId
    ) {
      throw new Error("simulation worker client session identity mismatch");
    }

    this.#operationInFlight = "advance";
    try {
      const response = await this.#postRequest(request, {
        kind: "advanced",
        modelId: this.#modelId,
        runtimeSessionId: this.#runtimeSessionId,
        scenarioId: this.#scenarioId,
        inputEpoch: this.#inputEpoch,
        minimumAcceptedRevision: this.#acceptedRevision,
        minimumAcceptedTimeSec: this.#acceptedTimeSec,
        stepCount: request.stepCount,
      });
      if (response.status !== "ok" || response.kind !== "advanced") {
        throw new Error("simulation worker returned another advance response");
      }
      const last = response.frames[response.frames.length - 1]!;
      this.#inputEpoch = last.inputEpoch;
      this.#acceptedRevision = last.acceptedRevision;
      this.#acceptedTimeSec = last.acceptedTimeSec;
      return response.frames;
    } catch (error) {
      this.#terminateWith(errorAsErrorV2(error));
      throw error;
    } finally {
      this.#operationInFlight = undefined;
    }
  }

  async applyControl(
    input: StudioSimulationWorkerApplyControlInputV2,
  ): Promise<StudioSimulationFrameV2> {
    if (
      this.#state !== "active"
      || this.#runtimeSessionId === undefined
      || this.#scenarioId === undefined
      || this.#modelId === undefined
      || this.#inputEpoch === undefined
      || this.#acceptedRevision === undefined
      || this.#acceptedTimeSec === undefined
    ) {
      throw new Error("simulation worker client is not active");
    }
    if (this.#operationInFlight !== undefined) {
      throw new Error("simulation worker client already has an operation in flight");
    }
    const request = createStudioSimulationApplyControlRequestV2(
      this.#allocateRequestId(),
      input,
    );
    if (
      request.runtimeSessionId !== this.#runtimeSessionId
      || request.scenarioId !== this.#scenarioId
    ) {
      throw new Error("simulation worker client session identity mismatch");
    }
    if (request.expectedInputEpoch !== this.#inputEpoch) {
      throw new Error("simulation worker client input epoch is stale");
    }

    this.#operationInFlight = "apply-control";
    try {
      const response = await this.#postRequest(request, {
        kind: "control-applied",
        modelId: this.#modelId,
        runtimeSessionId: this.#runtimeSessionId,
        scenarioId: this.#scenarioId,
        expectedInputEpoch: request.expectedInputEpoch,
      });
      if (response.status !== "ok" || response.kind !== "control-applied") {
        throw new Error("simulation worker returned another control response");
      }
      this.#inputEpoch = response.frame.inputEpoch;
      this.#acceptedRevision = response.frame.acceptedRevision;
      this.#acceptedTimeSec = response.frame.acceptedTimeSec;
      return response.frame;
    } finally {
      this.#operationInFlight = undefined;
    }
  }

  async requestAnalysis(
    input: StudioSimulationWorkerRequestAnalysisInputV2,
  ): Promise<StudioSimulationAnalysisV2> {
    if (
      this.#state !== "active"
      || this.#runtimeSessionId === undefined
      || this.#scenarioId === undefined
      || this.#modelId === undefined
      || this.#inputEpoch === undefined
      || this.#acceptedRevision === undefined
      || this.#acceptedTimeSec === undefined
    ) {
      throw new Error("simulation worker client is not active");
    }
    if (this.#operationInFlight !== undefined) {
      throw new Error("simulation worker client already has an operation in flight");
    }
    const request = createStudioSimulationRequestAnalysisRequestV2(
      this.#allocateRequestId(),
      input,
    );
    if (
      request.runtimeSessionId !== this.#runtimeSessionId
      || request.scenarioId !== this.#scenarioId
    ) {
      throw new Error("simulation worker client session identity mismatch");
    }
    if (
      request.expectedInputEpoch !== this.#inputEpoch
      || request.expectedAcceptedRevision !== this.#acceptedRevision
      || request.expectedAcceptedTimeSec !== this.#acceptedTimeSec
    ) {
      throw new Error("simulation worker client analysis clocks are stale");
    }

    this.#operationInFlight = "request-analysis";
    try {
      const response = await this.#postRequest(request, {
        kind: "analysis-result",
        modelId: this.#modelId,
        runtimeSessionId: this.#runtimeSessionId,
        scenarioId: this.#scenarioId,
        analysisId: request.analysisId,
        inputEpoch: this.#inputEpoch,
        sourceAcceptedRevision: this.#acceptedRevision,
        sourceAcceptedTimeSec: this.#acceptedTimeSec,
      });
      if (response.status !== "ok" || response.kind !== "analysis-result") {
        throw new Error("simulation worker returned another analysis response");
      }
      return response.analysis;
    } finally {
      this.#operationInFlight = undefined;
    }
  }

  async readScenarios(
    input: StudioSimulationWorkerReadScenariosInputV2,
  ): Promise<StudioSimulationWorkerScenarioCapturesV2> {
    const boundary = this.#requiredActiveBoundary(input.runtimeSessionId);
    const request = createStudioSimulationReadScenariosRequestV2(
      this.#allocateRequestId(),
      { runtimeSessionId: input.runtimeSessionId, ...boundary },
    );
    return this.#runScenarioOperation(
      "read-scenarios",
      request,
      "scenarios-captured",
    );
  }

  async selectScenario(
    input: StudioSimulationWorkerSelectScenarioInputV2,
  ): Promise<StudioSimulationWorkerScenarioStateV2> {
    const boundary = this.#requiredActiveBoundary(input.runtimeSessionId);
    const request = createStudioSimulationSelectScenarioRequestV2(
      this.#allocateRequestId(),
      { ...input, ...boundary },
    );
    return this.#runScenarioOperation(
      "select-scenario",
      request,
      "scenario-state",
    );
  }

  async addScenarioFromPreset(
    input: StudioSimulationWorkerAddScenarioFromPresetInputV2,
  ): Promise<StudioSimulationWorkerScenarioStateV2> {
    const boundary = this.#requiredActiveBoundary(input.runtimeSessionId);
    const request = createStudioSimulationAddScenarioFromPresetRequestV2(
      this.#allocateRequestId(),
      { ...input, ...boundary },
    );
    return this.#runScenarioOperation(
      "add-scenario-from-preset",
      request,
      "scenario-state",
    );
  }

  async duplicateScenario(
    input: StudioSimulationWorkerDuplicateScenarioInputV2,
  ): Promise<StudioSimulationWorkerScenarioStateV2> {
    const boundary = this.#requiredActiveBoundary(input.runtimeSessionId);
    const request = createStudioSimulationDuplicateScenarioRequestV2(
      this.#allocateRequestId(),
      { ...input, ...boundary },
    );
    return this.#runScenarioOperation(
      "duplicate-scenario",
      request,
      "scenario-state",
    );
  }

  async renameScenario(
    input: StudioSimulationWorkerRenameScenarioInputV2,
  ): Promise<StudioSimulationWorkerScenarioStateV2> {
    this.#requiredActiveBoundary(input.runtimeSessionId);
    const request = createStudioSimulationRenameScenarioRequestV2(
      this.#allocateRequestId(),
      input,
    );
    return this.#runScenarioOperation(
      "rename-scenario",
      request,
      "scenario-state",
    );
  }

  async deleteScenario(
    input: StudioSimulationWorkerDeleteScenarioInputV2,
  ): Promise<StudioSimulationWorkerScenarioStateV2> {
    const boundary = this.#requiredActiveBoundary(input.runtimeSessionId);
    const request = createStudioSimulationDeleteScenarioRequestV2(
      this.#allocateRequestId(),
      { ...input, ...boundary },
    );
    return this.#runScenarioOperation(
      "delete-scenario",
      request,
      "scenario-state",
    );
  }

  async saveDraft(
    input: StudioSimulationWorkerSaveDraftInputV2,
  ): Promise<ExperimentWorkspaceV2> {
    if (
      this.#state !== "active"
      || this.#runtimeSessionId === undefined
      || this.#scenarioId === undefined
      || this.#modelId === undefined
    ) {
      throw new Error("simulation worker client is not active");
    }
    if (this.#operationInFlight !== undefined) {
      throw new Error("simulation worker client already has an operation in flight");
    }
    const boundary = this.#requiredActiveBoundary(input.runtimeSessionId);
    const request = createStudioSimulationSaveDraftRequestV2(
      this.#allocateRequestId(),
      {
        ...input,
        expectedInputEpoch: boundary.expectedInputEpoch,
        expectedAcceptedRevision: boundary.expectedAcceptedRevision,
        expectedAcceptedTimeSec: boundary.expectedAcceptedTimeSec,
      },
    );
    if (
      request.runtimeSessionId !== this.#runtimeSessionId
      || request.scenarioId !== this.#scenarioId
    ) {
      throw new Error("simulation worker client session identity mismatch");
    }
    const priorWorkspace = this.#workspace;
    if (priorWorkspace === undefined) {
      if (request.expectedDraftVersion !== null) {
        throw new Error(
          "simulation worker client first Save requires a null draft version",
        );
      }
    } else if (
      request.experimentId !== priorWorkspace.experimentId
      || request.expectedDraftVersion !== priorWorkspace.draftVersion
    ) {
      throw new Error(
        "simulation worker client Draft identity or version is stale",
      );
    }

    this.#operationInFlight = "save-draft";
    try {
      const response = await this.#postRequest(request, {
        kind: "draft-saved",
        modelId: this.#modelId,
        runtimeSessionId: this.#runtimeSessionId,
        experimentId: request.experimentId,
        surface: request.surface,
        expectedDraftVersion: request.expectedDraftVersion,
        priorWorkspace,
      });
      if (response.status !== "ok" || response.kind !== "draft-saved") {
        throw new Error("simulation worker returned another Draft response");
      }
      this.#workspace = response.workspace;
      return response.workspace;
    } finally {
      this.#operationInFlight = undefined;
    }
  }

  #requiredActiveBoundary(runtimeSessionId: string): Readonly<{
    expectedActiveScenarioId: string;
    expectedInputEpoch: number;
    expectedAcceptedRevision: number;
    expectedAcceptedTimeSec: number;
  }> {
    if (
      this.#state !== "active"
      || this.#runtimeSessionId !== runtimeSessionId
      || this.#scenarioId === undefined
      || this.#inputEpoch === undefined
      || this.#acceptedRevision === undefined
      || this.#acceptedTimeSec === undefined
    ) {
      throw new Error("simulation worker client is not active");
    }
    if (this.#operationInFlight !== undefined) {
      throw new Error("simulation worker client already has an operation in flight");
    }
    return Object.freeze({
      expectedActiveScenarioId: this.#scenarioId,
      expectedInputEpoch: this.#inputEpoch,
      expectedAcceptedRevision: this.#acceptedRevision,
      expectedAcceptedTimeSec: this.#acceptedTimeSec,
    });
  }

  async #runScenarioOperation(
    operation: ScenarioOperationV2,
    request: StudioSimulationWorkerRequestV2,
    expectedKind: "scenario-state",
  ): Promise<StudioSimulationWorkerScenarioStateV2>;
  async #runScenarioOperation(
    operation: ScenarioOperationV2,
    request: StudioSimulationWorkerRequestV2,
    expectedKind: "scenarios-captured",
  ): Promise<StudioSimulationWorkerScenarioCapturesV2>;
  async #runScenarioOperation(
    operation: ScenarioOperationV2,
    request: StudioSimulationWorkerRequestV2,
    expectedKind: "scenario-state" | "scenarios-captured",
  ): Promise<StudioSimulationWorkerScenarioStateV2 | StudioSimulationWorkerScenarioCapturesV2> {
    if (this.#modelId === undefined || this.#runtimeSessionId === undefined) {
      throw new Error("simulation worker client is not active");
    }
    this.#operationInFlight = operation;
    try {
      const response = await this.#postRequest(request, {
        kind: expectedKind,
        modelId: this.#modelId,
        runtimeSessionId: this.#runtimeSessionId,
      });
      if (response.status !== "ok" || response.kind !== expectedKind) {
        throw new Error("simulation worker returned another Scenario response");
      }
      if (response.kind === "scenario-state") {
        this.#scenarioId = response.state.activeScenarioId;
        this.#inputEpoch = response.state.frame.inputEpoch;
        this.#acceptedRevision = response.state.frame.acceptedRevision;
        this.#acceptedTimeSec = response.state.frame.acceptedTimeSec;
        return response.state;
      }
      return response.captures;
    } finally {
      this.#operationInFlight = undefined;
    }
  }

  async createSnapshot(
    input: StudioSimulationWorkerCreateSnapshotInputV2,
  ): Promise<StudioSimulationWorkerQualifiedSnapshotCommitV2> {
    if (
      this.#state !== "active"
      || this.#runtimeSessionId === undefined
      || this.#scenarioId === undefined
      || this.#modelId === undefined
    ) {
      throw new Error("simulation worker client is not active");
    }
    if (this.#operationInFlight !== undefined) {
      throw new Error("simulation worker client already has an operation in flight");
    }
    const request = createStudioSimulationCreateSnapshotRequestV2(
      this.#allocateRequestId(),
      input,
    );
    if (
      request.runtimeSessionId !== this.#runtimeSessionId
      || request.scenarioId !== this.#scenarioId
    ) {
      throw new Error("simulation worker client session identity mismatch");
    }
    const candidateWorkspace = this.#workspace;
    if (
      candidateWorkspace === undefined
      || request.experimentId !== candidateWorkspace.experimentId
      || request.expectedDraftVersion !== candidateWorkspace.draftVersion
      || request.expectedHeadSnapshotId
        !== candidateWorkspace.headSnapshotId
    ) {
      throw new Error(
        "simulation worker client Snapshot identity or version is stale",
      );
    }

    this.#operationInFlight = "create-snapshot";
    try {
      const response = await this.#postRequest(request, {
        kind: "snapshot-created",
        modelId: this.#modelId,
        experimentId: request.experimentId,
        candidateWorkspace,
      }, this.#snapshotQualificationTimeoutMs);
      if (response.status !== "ok" || response.kind !== "snapshot-created") {
        throw new Error("simulation worker returned another Snapshot response");
      }
      this.#workspace = response.workspace;
      const qualifiedCommit = {
        snapshot: response.snapshot,
        workspace: response.workspace,
      } as StudioSimulationWorkerQualifiedSnapshotCommitV2;
      Object.defineProperty(qualifiedCommit, QUALIFIED_SNAPSHOT_COMMIT_V2, {
        value: true,
        enumerable: false,
        configurable: false,
        writable: false,
      });
      Object.freeze(qualifiedCommit);
      qualifiedSnapshotCommitsV2.add(qualifiedCommit);
      return qualifiedCommit;
    } finally {
      this.#operationInFlight = undefined;
    }
  }

  dispose(runtimeSessionId: string): Promise<void> {
    if (this.#disposePromise !== undefined) return this.#disposePromise;
    if (this.#state === "terminated") return Promise.resolve();
    if (this.#state === "new" || this.#state === "initializing") {
      this.#terminateWith(new Error("simulation worker client disposed before activation"));
      return Promise.resolve();
    }
    if (this.#operationInFlight !== undefined) {
      this.#terminateWith(new Error("simulation worker client disposed during an operation"));
      return Promise.resolve();
    }
    if (
      this.#state !== "active"
      || this.#runtimeSessionId !== runtimeSessionId
    ) {
      return Promise.reject(
        new Error("simulation worker client dispose identity mismatch"),
      );
    }
    const request = createStudioSimulationDisposeRequestV2(
      this.#allocateRequestId(),
      runtimeSessionId,
    );
    this.#state = "disposing";
    const disposePromise = this.#postRequest(request, { kind: "disposed" })
      .then((response) => {
        if (response.status !== "ok" || response.kind !== "disposed") {
          throw new Error("simulation worker returned another dispose response");
        }
      })
      .finally(() => {
        this.#terminateWith(new Error("simulation worker client disposed"));
      });
    this.#disposePromise = disposePromise;
    return disposePromise;
  }

  terminate(): void {
    this.#terminateWith(new Error("simulation worker client terminated"));
  }

  #allocateRequestId(): number {
    if (!Number.isSafeInteger(this.#nextRequestId)) {
      this.#terminateWith(new Error("simulation worker requestId space exhausted"));
      throw new Error("simulation worker requestId space exhausted");
    }
    const requestId = this.#nextRequestId;
    this.#nextRequestId += 1;
    return requestId;
  }

  #postRequest(
    request: StudioSimulationWorkerRequestV2,
    expected: ExpectedResponseV2,
    timeoutMs = this.#responseTimeoutMs,
  ): Promise<StudioSimulationWorkerResponseV2> {
    if (this.#state === "terminated") {
      return Promise.reject(new Error("simulation worker client is terminated"));
    }
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        if (!this.#pending.has(request.requestId)) return;
        this.#terminateWith(new Error(
          `simulation worker request ${request.requestId} timed out`,
        ));
      }, timeoutMs);
      this.#pending.set(request.requestId, {
        resolve,
        reject,
        timeout,
        expected,
      });
      try {
        this.#worker.postMessage(request);
      } catch (error) {
        this.#terminateWith(errorAsErrorV2(error));
      }
    });
  }

  readonly #onMessage = (event: MessageEvent<unknown>): void => {
    let response: StudioSimulationWorkerResponseV2;
    try {
      response = validateStudioSimulationWorkerResponseV2(event.data);
    } catch (error) {
      this.#terminateWith(errorAsErrorV2(error));
      return;
    }
    const pending = this.#pending.get(response.requestId);
    if (pending === undefined) {
      this.#terminateWith(new Error(
        `simulation worker response ${response.requestId} has no pending request`,
      ));
      return;
    }
    if (response.status === "error") {
      const error = new Error(response.message);
      this.#settlePending(response.requestId);
      pending.reject(error);
      if (response.fatal) this.#terminateWith(error);
      return;
    }
    try {
      assertExpectedResponseV2(response, pending.expected);
    } catch (error) {
      this.#terminateWith(errorAsErrorV2(error));
      return;
    }
    this.#settlePending(response.requestId);
    pending.resolve(response);
  };

  readonly #onWorkerError = (event: ErrorEvent): void => {
    let message = "simulation worker terminated with an error";
    try {
      if (typeof event.message === "string" && event.message.length > 0) {
        message = event.message;
      }
    } catch {
      // An invalid transport event is still terminal.
    }
    this.#terminateWith(new Error(message));
  };

  #settlePending(requestId: number): void {
    const pending = this.#pending.get(requestId);
    if (pending === undefined) return;
    this.#pending.delete(requestId);
    clearTimeout(pending.timeout);
  }

  #terminateWith(error: Error): void {
    if (this.#state === "terminated") return;
    this.#state = "terminated";
    try {
      this.#worker.removeEventListener("message", this.#onMessage);
    } catch {
      // Continue terminal cleanup even if an injected transport is malformed.
    }
    try {
      this.#worker.removeEventListener("error", this.#onWorkerError);
    } catch {
      // Continue terminal cleanup even if an injected transport is malformed.
    }
    try {
      this.#worker.terminate();
    } finally {
      for (const pending of this.#pending.values()) {
        clearTimeout(pending.timeout);
        pending.reject(error);
      }
      this.#pending.clear();
    }
  }
}

/**
 * Test-only composition seam for protocol/client adversarial tests. Production
 * builds replace these environment values with constants. Requiring test mode
 * and a non-production build also fails closed for an accidental
 * `vite build --mode test` release.
 */
export function createStudioSimulationWorkerClientForTestV2(
  options: StudioSimulationWorkerClientTestOptionsV2,
): StudioSimulationWorkerClientV2 {
  if (import.meta.env.MODE !== "test" || import.meta.env.PROD) {
    throw new Error(
      "simulation worker transport injection is available only in test mode",
    );
  }
  const { transport, ...timeouts } = options;
  return new (
    StudioSimulationWorkerClientV2 as unknown as InternalClientConstructorV2
  )(timeouts, {
    authority: TEST_CLIENT_CONSTRUCTION_AUTHORITY_V2,
    transport,
  });
}

function assertExpectedResponseV2(
  response: Exclude<StudioSimulationWorkerResponseV2, { status: "error" }>,
  expected: ExpectedResponseV2,
): void {
  if (response.kind !== expected.kind) {
    throw new Error(
      `simulation worker response kind mismatch: expected ${expected.kind}`,
    );
  }
  if (response.kind === "initialized" && expected.kind === "initialized") {
    assertFrameIdentityV2(
      response.frame,
      expected.runtimeSessionId,
      expected.scenarioId,
      expected.modelId,
    );
    return;
  }
  if (response.kind === "advanced" && expected.kind === "advanced") {
    if (response.frames.length !== expected.stepCount) {
      throw new Error("simulation worker advance frame count mismatch");
    }
    let acceptedRevision = expected.minimumAcceptedRevision;
    let acceptedTimeSec = expected.minimumAcceptedTimeSec;
    for (const frame of response.frames) {
      assertFrameIdentityV2(
        frame,
        expected.runtimeSessionId,
        expected.scenarioId,
        expected.modelId,
      );
      if (
        frame.inputEpoch !== expected.inputEpoch
        || frame.acceptedRevision < acceptedRevision
        || frame.acceptedTimeSec < acceptedTimeSec
      ) {
        throw new Error("simulation worker advance frame sequence regressed");
      }
      acceptedRevision = frame.acceptedRevision;
      acceptedTimeSec = frame.acceptedTimeSec;
    }
    return;
  }
  if (
    response.kind === "control-applied"
    && expected.kind === "control-applied"
  ) {
    assertFrameIdentityV2(
      response.frame,
      expected.runtimeSessionId,
      expected.scenarioId,
      expected.modelId,
    );
    if (
      response.frame.inputEpoch !== expected.expectedInputEpoch + 1
    ) {
      throw new Error("simulation worker control frame sequence is invalid");
    }
    return;
  }
  if (
    response.kind === "analysis-result"
    && expected.kind === "analysis-result"
  ) {
    const analysis = response.analysis;
    if (
      analysis.modelId !== expected.modelId
      || analysis.runtimeSessionId !== expected.runtimeSessionId
      || analysis.scenarioId !== expected.scenarioId
      || analysis.analysisId !== expected.analysisId
      || analysis.inputEpoch !== expected.inputEpoch
      || analysis.sourceAcceptedRevision
        !== expected.sourceAcceptedRevision
      || analysis.sourceAcceptedTimeSec !== expected.sourceAcceptedTimeSec
    ) {
      throw new Error(
        "simulation worker analysis result identity or clocks mismatch",
      );
    }
    return;
  }
  if (
    response.kind === "draft-saved"
    && expected.kind === "draft-saved"
  ) {
    const workspace = response.workspace;
    const expectedVersion = expected.expectedDraftVersion === null
      ? 0
      : expected.expectedDraftVersion + 1;
    if (
      workspace.experimentId !== expected.experimentId
      || workspace.draftVersion !== expectedVersion
      || workspace.content.modelId !== expected.modelId
      || workspace.content.scenarios.length < 1
      || !samePortableValueV2(workspace.content.surface, expected.surface)
    ) {
      throw new Error(
        "simulation worker saved Draft response correlation mismatch",
      );
    }
    if (expected.priorWorkspace === undefined) {
      if (
        workspace.headSnapshotId !== null
        || workspace.basedOnSnapshotId !== null
      ) {
        throw new Error(
          "simulation worker first Draft response has invalid lineage",
        );
      }
    } else if (
      workspace.headSnapshotId !== expected.priorWorkspace.headSnapshotId
      || workspace.basedOnSnapshotId
        !== expected.priorWorkspace.basedOnSnapshotId
    ) {
      throw new Error(
        "simulation worker saved Draft response changed lineage",
      );
    }
    return;
  }
  if (
    response.kind === "scenario-state"
    && expected.kind === "scenario-state"
  ) {
    assertFrameIdentityV2(
      response.state.frame,
      expected.runtimeSessionId,
      response.state.activeScenarioId,
      expected.modelId,
    );
    return;
  }
  if (
    response.kind === "scenarios-captured"
    && expected.kind === "scenarios-captured"
  ) {
    if (
      response.captures.scenarios.length < 1
      || !response.captures.scenarios.some(
        ({ scenarioId }) =>
          scenarioId === response.captures.activeScenarioId,
      )
    ) {
      throw new Error(
        "simulation worker captured Scenario response correlation mismatch",
      );
    }
    return;
  }
  if (
    response.kind === "snapshot-created"
    && expected.kind === "snapshot-created"
  ) {
    const { snapshot, workspace } = response;
    const candidate = expected.candidateWorkspace;
    if (
      snapshot.experimentId !== expected.experimentId
      || snapshot.content.modelId !== expected.modelId
      || snapshot.parentSnapshotId !== candidate.basedOnSnapshotId
      || workspace.experimentId !== expected.experimentId
      || workspace.draftVersion !== candidate.draftVersion + 1
      || workspace.headSnapshotId !== snapshot.snapshotId
      || workspace.basedOnSnapshotId !== snapshot.snapshotId
      || !samePortableValueV2(workspace.content, snapshot.content)
      || !sameAuthoredContentExceptCheckpointsV2(
        candidate.content,
        snapshot.content,
      )
    ) {
      throw new Error(
        "simulation worker Snapshot response correlation mismatch",
      );
    }
  }
}

function assertFrameIdentityV2(
  frame: StudioSimulationFrameV2,
  runtimeSessionId: string,
  scenarioId: string,
  modelId?: string,
): void {
  if (
    frame.runtimeSessionId !== runtimeSessionId
    || frame.scenarioId !== scenarioId
    || (modelId !== undefined && frame.modelId !== modelId)
  ) {
    throw new Error("simulation worker response frame identity mismatch");
  }
}

function sameAuthoredContentExceptCheckpointsV2(
  before: ExperimentWorkspaceV2["content"],
  after: ExperimentWorkspaceV2["content"],
): boolean {
  if (
    before.modelId !== after.modelId
    || !samePortableValueV2(before.surface, after.surface)
    || before.scenarios.length !== after.scenarios.length
  ) {
    return false;
  }
  return before.scenarios.every((scenario, index) => {
    const qualified = after.scenarios[index];
    return qualified !== undefined
      && qualified.scenarioId === scenario.scenarioId
      && qualified.label === scenario.label
      && samePortableValueV2(
        qualified.capture.fixture,
        scenario.capture.fixture,
      );
  });
}

function samePortableValueV2(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) return true;
  if (
    left === null
    || right === null
    || typeof left !== "object"
    || typeof right !== "object"
  ) {
    return false;
  }
  if (Array.isArray(left) || Array.isArray(right)) {
    return Array.isArray(left)
      && Array.isArray(right)
      && left.length === right.length
      && left.every((value, index) =>
        samePortableValueV2(value, right[index]));
  }
  const leftRecord = left as Record<string, unknown>;
  const rightRecord = right as Record<string, unknown>;
  const leftKeys = Object.keys(leftRecord).sort();
  const rightKeys = Object.keys(rightRecord).sort();
  return leftKeys.length === rightKeys.length
    && leftKeys.every((key, index) =>
      key === rightKeys[index]
      && samePortableValueV2(leftRecord[key], rightRecord[key]));
}

function errorAsErrorV2(error: unknown): Error {
  try {
    if (error instanceof Error) return error;
    if (typeof error === "string") return new Error(error);
  } catch {
    // Hostile thrown values must not interrupt terminal cleanup.
  }
  return new Error("simulation worker request failed");
}
