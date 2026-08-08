import {
  assertExperimentCapturesMatchModelV2,
  assertExperimentDesiredFixturesMatchModelV2,
  createScenarioPresetCaptureClonerV2,
  validateExperimentCaptureConfirmationV2,
  validateExperimentCaptureCorrelationV2,
  validateExperimentContentForModelV2,
  validateExperimentDesiredContentForModelV2,
  validateExperimentSnapshotV2,
  validateExperimentV2,
} from "@/studio/application/authoring/StudioExperimentDataV2";
import {
  createStudioFixtureReducerV2,
  type StudioFixtureReducerFacadeV2,
} from "@/studio/application/runtime/StudioFixtureReducerV2";
import type {
  ExperimentCaptureCorrelationV2,
  ExperimentDesiredContentV2,
  ExperimentSnapshotIdFactoryPortV2,
  StudioClockPortV2,
} from "@/studio/contracts/v2/authoring";
import {
  STUDIO_EXPERIMENT_SCENARIO_LIMIT_V2,
  type ExperimentContentV2,
  type ExperimentScenarioV2,
  type ExperimentSnapshotV2,
  type ExperimentSurfaceV2,
  type ExperimentV2,
} from "@/studio/contracts/v2/content";
import type {
  ExactModelRuntimeResolverPortV2,
  ResolvedExactModelRuntimeV2,
} from "@/studio/contracts/v2/executable";
import type {
  StudioJsonValueV2,
} from "@/studio/contracts/v2/json";
import {
  assertCaptureAdapterMatchesModelV2,
  assertModelContractV2,
} from "@/studio/contracts/v2/model";
import type {
  RegisteredModelSimulationAdapterV2,
  StudioSimulationAnalysisV2,
  StudioSimulationFrameV2,
} from "@/studio/contracts/v2/simulation";
import {
  createInMemoryExperimentAuthoringV2,
  type StudioExperimentAuthoringFacadeV2,
} from "@/studio/infrastructure/experiments/InMemoryExperimentRepositoryV2";
import {
  validateStudioSimulationAnalysisV2,
  validateStudioSimulationFrameV2,
  validateStudioSimulationPortableIdV2,
} from "@/studio/contracts/v2/simulation";
import {
  STUDIO_SIMULATION_WORKER_PROTOCOL_V2,
  type StudioSimulationWorkerRequestV2,
  type StudioSimulationWorkerResponseV2,
  studioSimulationWorkerRequestIdFromUnknownV2,
  validateStudioSimulationWorkerRequestV2,
  validateStudioSimulationWorkerResponseFromTrustedRuntimeV2,
} from "@/studio/workers/StudioSimulationWorkerProtocolV2";

const DEFAULT_WORKER_QUEUE_CAPACITY_V2 = 2;
const EMPTY_WORKER_CAPTURE_SURFACE_V2: ExperimentSurfaceV2 = Object.freeze({
  graphPanes: Object.freeze([]),
  outputPanes: Object.freeze([]),
  controlPanes: Object.freeze([]),
  note: Object.freeze({ text: "" }),
});

export type StudioSimulationWorkerRuntimeStateV2 =
  | "uninitialized"
  | "initializing"
  | "active"
  | "disposing"
  | "closed"
  | "failed";

export type StudioSimulationWorkerPortV2 = Readonly<{
  postMessage(message: StudioSimulationWorkerResponseV2): void;
  close(): void;
}>;

export type StudioSimulationWorkerRuntimeDependenciesV2 = Readonly<{
  loadExactRuntime(input: Readonly<{
    expectedModelId: string;
    releaseTicket?: Extract<
      StudioSimulationWorkerRequestV2,
      { kind: "initialize" }
    >["releaseTicket"];
  }>): Promise<ResolvedExactModelRuntimeV2>;
  port: StudioSimulationWorkerPortV2;
  queueCapacity?: number;
  snapshotIds?: ExperimentSnapshotIdFactoryPortV2;
  clock?: StudioClockPortV2;
}>;

type StudioSimulationWorkerAuthoringContextV2 = Readonly<{
  runtime: ResolvedExactModelRuntimeV2;
  authoring: StudioExperimentAuthoringFacadeV2;
  fixture: StudioJsonValueV2;
  frame: StudioSimulationFrameV2;
}>;

/**
 * Single-session, bounded worker controller. Every message is decoded before
 * admission and every adapter-produced frame is decoded again before posting.
 */
export class StudioSimulationWorkerRuntimeV2 {
  readonly #loadExactRuntime: StudioSimulationWorkerRuntimeDependenciesV2[
    "loadExactRuntime"
  ];
  readonly #port: StudioSimulationWorkerPortV2;
  readonly #queueCapacity: number;
  readonly #snapshotIds: ExperimentSnapshotIdFactoryPortV2;
  readonly #clock: StudioClockPortV2;
  readonly #queue: StudioSimulationWorkerRequestV2[] = [];
  readonly #idleWaiters: Array<() => void> = [];
  #state: StudioSimulationWorkerRuntimeStateV2 = "uninitialized";
  #processing = false;
  #disposeEnqueued = false;
  #highestRequestId = 0;
  #exactRuntime: ResolvedExactModelRuntimeV2 | undefined;
  #adapter: RegisteredModelSimulationAdapterV2 | undefined;
  #fixtureReducer: StudioFixtureReducerFacadeV2 | undefined;
  #authoring: StudioExperimentAuthoringFacadeV2 | undefined;
  #authoringExperimentId: string | undefined;
  #runtimeSessionId: string | undefined;
  #physicalRuntimeSessionId: string | undefined;
  #scenarioId: string | undefined;
  #scenarioOrder: string[] = [];
  readonly #scenarioLabels = new Map<string, string>();
  readonly #scenarioFixtures = new Map<string, StudioJsonValueV2>();
  readonly #scenarioFrames = new Map<string, StudioSimulationFrameV2>();
  #sessionGeneration = 0;
  #currentFixture: StudioJsonValueV2 | undefined;
  #lastFrame: StudioSimulationFrameV2 | undefined;
  #portClosed = false;

  constructor(dependencies: StudioSimulationWorkerRuntimeDependenciesV2) {
    if (typeof dependencies.loadExactRuntime !== "function") {
      throw new Error("simulation worker exact runtime loader is required");
    }
    if (
      dependencies.port === null
      || typeof dependencies.port !== "object"
      || typeof dependencies.port.postMessage !== "function"
      || typeof dependencies.port.close !== "function"
    ) {
      throw new Error("simulation worker port is invalid");
    }
    const queueCapacity = dependencies.queueCapacity
      ?? DEFAULT_WORKER_QUEUE_CAPACITY_V2;
    if (
      !Number.isSafeInteger(queueCapacity)
      || queueCapacity < 1
      || queueCapacity > 32
    ) {
      throw new Error("simulation worker queue capacity must be within [1, 32]");
    }
    if (
      dependencies.snapshotIds !== undefined
      && typeof dependencies.snapshotIds.nextSnapshotId !== "function"
    ) {
      throw new Error("simulation worker Snapshot ID factory is invalid");
    }
    if (
      dependencies.clock !== undefined
      && typeof dependencies.clock.nowIso !== "function"
    ) {
      throw new Error("simulation worker clock is invalid");
    }
    this.#loadExactRuntime = dependencies.loadExactRuntime;
    this.#port = dependencies.port;
    this.#queueCapacity = queueCapacity;
    this.#snapshotIds = dependencies.snapshotIds
      ?? createWorkerSnapshotIdFactoryV2();
    this.#clock = dependencies.clock ?? Object.freeze({
      nowIso() {
        return new Date().toISOString();
      },
    });
  }

  get state(): StudioSimulationWorkerRuntimeStateV2 {
    return this.#state;
  }

  enqueue(value: unknown): void {
    if (this.#portClosed) return;
    const correlationId = studioSimulationWorkerRequestIdFromUnknownV2(value);
    let request: StudioSimulationWorkerRequestV2;
    try {
      request = validateStudioSimulationWorkerRequestV2(value);
    } catch (error) {
      if (correlationId > this.#highestRequestId) {
        this.#highestRequestId = correlationId;
      }
      this.#safePostError(correlationId, errorMessageV2(error));
      return;
    }

    if (request.requestId <= this.#highestRequestId) {
      this.#safePostError(
        request.requestId,
        "simulation worker requestId must increase strictly",
      );
      return;
    }
    this.#highestRequestId = request.requestId;
    if (this.#disposeEnqueued) {
      this.#safePostError(
        request.requestId,
        "simulation worker is disposing and accepts no further requests",
      );
      return;
    }
    const outstanding = (this.#processing ? 1 : 0) + this.#queue.length;
    if (outstanding >= this.#queueCapacity) {
      this.#safePostError(
        request.requestId,
        "simulation worker queue capacity exceeded",
      );
      return;
    }
    if (request.kind === "dispose") this.#disposeEnqueued = true;
    this.#queue.push(request);
    void this.#drain();
  }

  async whenIdle(): Promise<void> {
    if (!this.#processing && this.#queue.length === 0) return;
    await new Promise<void>((resolve) => this.#idleWaiters.push(resolve));
  }

  terminate(): void {
    if (this.#portClosed) return;
    this.#failClosed("simulation worker terminated", "closed");
  }

  async #drain(): Promise<void> {
    if (this.#processing || this.#portClosed) return;
    this.#processing = true;
    try {
      while (this.#queue.length > 0 && !this.#portClosed) {
        const request = this.#queue.shift()!;
        try {
          await this.#handleRequest(request);
        } catch (error) {
          const fatal = error instanceof FatalWorkerStateErrorV2;
          this.#safePostError(
            request.requestId,
            errorMessageV2(error),
            fatal,
          );
          if (fatal) {
            this.#failClosed(errorMessageV2(error), "failed");
          }
        }
      }
    } finally {
      this.#processing = false;
      if (this.#queue.length === 0 || this.#portClosed) this.#resolveIdle();
    }
  }

  async #handleRequest(request: StudioSimulationWorkerRequestV2): Promise<void> {
    switch (request.kind) {
      case "initialize":
        await this.#initialize(request);
        return;
      case "advance":
        await this.#advance(request);
        return;
      case "apply-control":
        await this.#applyControl(request);
        return;
      case "request-analysis":
        await this.#requestAnalysis(request);
        return;
      case "read-scenarios":
        await this.#readScenarios(request);
        return;
      case "select-scenario":
        this.#selectScenario(request);
        return;
      case "add-scenario-from-preset":
        await this.#addScenarioFromPreset(request);
        return;
      case "duplicate-scenario":
        await this.#duplicateScenario(request);
        return;
      case "rename-scenario":
        this.#renameScenario(request);
        return;
      case "delete-scenario":
        await this.#deleteScenario(request);
        return;
      case "save-experiment":
        await this.#saveExperiment(request);
        return;
      case "create-snapshot":
        await this.#createSnapshot(request);
        return;
      case "dispose":
        this.#dispose(request);
    }
  }

  async #initialize(
    request: Extract<StudioSimulationWorkerRequestV2, { kind: "initialize" }>,
  ): Promise<void> {
    if (this.#state !== "uninitialized") {
      throw new Error("simulation worker is already initialized");
    }
    this.#state = "initializing";
    let exactRuntime: ResolvedExactModelRuntimeV2 | undefined;
    let adapter: RegisteredModelSimulationAdapterV2 | undefined;
    let sessionCreationAttempted = false;
    try {
      exactRuntime = await this.#loadExactRuntime(Object.freeze({
        expectedModelId: request.expectedModelId,
        ...(request.releaseTicket === undefined
          ? {}
          : { releaseTicket: request.releaseTicket }),
      }));
      if (this.#portClosed || this.#state !== "initializing") return;
      assertExactRuntimeV2(exactRuntime);
      if (exactRuntime.contract.modelId !== request.expectedModelId) {
        throw new Error(
          "simulation worker loaded runtime modelId does not match the requested model",
        );
      }
      const models = exactRuntimeResolverV2(exactRuntime);
      const fixtureValidation = exactRuntime.fixtureAdapter
        .validateCompleteFixture(Object.freeze({
          context: Object.freeze({
            modelId: exactRuntime.contract.modelId,
            scenarioId: request.scenarioId,
          }),
          fixture: request.fixture,
        }));
      if (fixtureValidation !== undefined) {
        throw new Error("fixture validator must complete synchronously");
      }
      const authoringStack = createInMemoryExperimentAuthoringV2({
        models,
        snapshotIds: this.#snapshotIds,
        clock: this.#clock,
        ...(request.authoringSeed === undefined
          ? {}
          : { seed: request.authoringSeed }),
      });
      await validateAuthoringSeedAgainstRuntimeV2(
        authoringStack.application,
        request.authoringSeed,
      );
      assertSeedMatchesInitializationV2(request, request.authoringSeed);
      if (this.#portClosed || this.#state !== "initializing") return;

      adapter = exactRuntime.simulationAdapter;
      const seededScenarios = request.authoringSeed?.experiment?.content.scenarios;
      const scenarioInputs = seededScenarios === undefined
        ? [Object.freeze({
            scenarioId: request.scenarioId,
            label: request.scenarioLabel,
            fixture: request.fixture,
            ...(request.checkpoint === undefined
              ? {}
              : { checkpoint: request.checkpoint }),
          })]
        : seededScenarios.map((scenario) => Object.freeze({
            scenarioId: scenario.scenarioId,
            label: scenario.label,
            fixture: scenario.capture.fixture,
            checkpoint: scenario.capture.checkpoint,
          }));
      sessionCreationAttempted = true;
      await adapter.createSession(Object.freeze({
        runtimeSessionId: request.runtimeSessionId,
        scenarios: Object.freeze(scenarioInputs.map((scenario) => Object.freeze({
          scenarioId: scenario.scenarioId,
          fixture: scenario.fixture,
          ...(scenario.checkpoint === undefined
            ? {}
            : { checkpoint: scenario.checkpoint }),
        }))),
      }));
      if (this.#portClosed || this.#state !== "initializing") {
        bestEffortDisposeV2(adapter, request.runtimeSessionId);
        return;
      }
      this.#exactRuntime = exactRuntime;
      this.#adapter = adapter;
      this.#fixtureReducer = createStudioFixtureReducerV2(models);
      this.#authoring = authoringStack.application;
      this.#authoringExperimentId = request.authoringSeed?.experiment
        ?.experimentId;
      this.#runtimeSessionId = request.runtimeSessionId;
      this.#physicalRuntimeSessionId = request.runtimeSessionId;
      this.#scenarioId = request.scenarioId;
      this.#scenarioOrder = scenarioInputs.map(({ scenarioId }) => scenarioId);
      for (const scenario of scenarioInputs) {
        this.#scenarioLabels.set(scenario.scenarioId, scenario.label);
        this.#scenarioFixtures.set(scenario.scenarioId, scenario.fixture);
      }
      this.#currentFixture = this.#scenarioFixtures.get(request.scenarioId);
      this.#state = "active";
      for (const scenario of scenarioInputs) {
        const scenarioFrame = this.#validateAdapterFrame(adapter.currentFrame({
          runtimeSessionId: request.runtimeSessionId,
          scenarioId: scenario.scenarioId,
        }), scenario.scenarioId);
        this.#scenarioFrames.set(scenario.scenarioId, scenarioFrame);
      }
      const frame = this.#scenarioFrames.get(request.scenarioId)!;
      this.#lastFrame = frame;
      this.#postResponse({
        protocol: STUDIO_SIMULATION_WORKER_PROTOCOL_V2,
        requestId: request.requestId,
        status: "ok",
        kind: "initialized",
        frame,
      });
    } catch (error) {
      if (adapter !== undefined && sessionCreationAttempted) {
        bestEffortDisposeV2(adapter, request.runtimeSessionId);
      }
      if (this.#portClosed) return;
      this.#clearSession();
      this.#state = "failed";
      throw new FatalWorkerStateErrorV2(
        `simulation worker initialization failed: ${errorMessageV2(error)}`,
      );
    }
  }

  async #advance(
    request: Extract<StudioSimulationWorkerRequestV2, { kind: "advance" }>,
  ): Promise<void> {
    const adapter = this.#requiredActiveAdapter(
      request.runtimeSessionId,
      request.scenarioId,
    );
    const physicalRuntimeSessionId = this.#requiredPhysicalRuntimeSessionId();
    try {
      const frames: StudioSimulationFrameV2[] = [];
      for (let index = 0; index < request.stepCount; index += 1) {
        const frame = this.#validateAdapterFrame(
          await adapter.advanceOnePresentationStep({
            runtimeSessionId: physicalRuntimeSessionId,
            scenarioId: request.scenarioId,
          }),
        );
        assertNonRegressingFrameV2(this.#lastFrame, frame);
        this.#lastFrame = frame;
        this.#scenarioFrames.set(request.scenarioId, frame);
        frames.push(frame);
      }
      this.#postResponse({
        protocol: STUDIO_SIMULATION_WORKER_PROTOCOL_V2,
        requestId: request.requestId,
        status: "ok",
        kind: "advanced",
        frames: Object.freeze(frames),
      });
    } catch (error) {
      throw new FatalWorkerStateErrorV2(
        `simulation worker advance failed: ${errorMessageV2(error)}`,
      );
    }
  }

  async #applyControl(
    request: Extract<
      StudioSimulationWorkerRequestV2,
      { kind: "apply-control" }
    >,
  ): Promise<void> {
    const adapter = this.#requiredActiveAdapter(
      request.runtimeSessionId,
      request.scenarioId,
    );
    const physicalRuntimeSessionId = this.#requiredPhysicalRuntimeSessionId();
    const priorFrame = this.#lastFrame;
    if (priorFrame === undefined) {
      throw new FatalWorkerStateErrorV2(
        "simulation worker control failed: no accepted frame is active",
      );
    }
    const priorFixture = this.#currentFixture;
    const fixtureReducer = this.#fixtureReducer;
    if (priorFixture === undefined || fixtureReducer === undefined) {
      throw new FatalWorkerStateErrorV2(
        "simulation worker control failed: no exact fixture is active",
      );
    }
    let currentInputEpoch: number;
    try {
      currentInputEpoch = adapter.currentInputEpoch({
        runtimeSessionId: physicalRuntimeSessionId,
        scenarioId: request.scenarioId,
      });
    } catch (error) {
      throw new FatalWorkerStateErrorV2(
        `simulation worker control failed: ${errorMessageV2(error)}`,
      );
    }
    if (currentInputEpoch !== priorFrame.inputEpoch) {
      throw new FatalWorkerStateErrorV2(
        "simulation worker control failed: adapter input epoch drifted",
      );
    }
    if (request.expectedInputEpoch !== currentInputEpoch) {
      throw new Error(
        "simulation worker control rejected a stale expected input epoch",
      );
    }
    if (currentInputEpoch === Number.MAX_SAFE_INTEGER) {
      throw new Error("simulation worker control input epoch is exhausted");
    }

    let proposedFrame: unknown;
    try {
      proposedFrame = await adapter.applyControl({
        runtimeSessionId: physicalRuntimeSessionId,
        scenarioId: request.scenarioId,
        controlId: request.controlId,
        value: request.value,
        expectedInputEpoch: request.expectedInputEpoch,
      });
    } catch (error) {
      this.#assertRejectedControlWasAtomic(priorFrame, error);
      throw new Error(
        `simulation worker control rejected: ${errorMessageV2(error)}`,
      );
    }

    let frame: StudioSimulationFrameV2;
    try {
      frame = this.#validateAdapterFrame(proposedFrame);
      if (frame.inputEpoch !== request.expectedInputEpoch + 1) {
        throw new Error("control frame must advance input epoch exactly once");
      }
      const committedFrame = this.#validateAdapterFrame(adapter.currentFrame({
        runtimeSessionId: physicalRuntimeSessionId,
        scenarioId: request.scenarioId,
      }));
      if (!sameStudioSimulationFrameV2(frame, committedFrame)) {
        throw new Error("control result is not the committed current frame");
      }
    } catch (error) {
      this.#assertRejectedControlWasAtomic(priorFrame, error);
      throw new Error(
        `simulation worker control rejected: ${errorMessageV2(error)}`,
      );
    }

    let nextFixture: StudioJsonValueV2;
    try {
      nextFixture = fixtureReducer.reduce(Object.freeze({
        desiredFixture: priorFixture,
        action: Object.freeze({
          kind: "control",
          controlId: request.controlId,
          value: request.value,
        }),
        context: Object.freeze({
          modelId: adapter.modelId,
          scenarioId: request.scenarioId,
        }),
      }));
    } catch (error) {
      throw new FatalWorkerStateErrorV2(
        "simulation worker accepted a control that its exact fixture reducer "
          + `could not reproduce: ${errorMessageV2(error)}`,
      );
    }

    this.#currentFixture = nextFixture;
    this.#scenarioFixtures.set(request.scenarioId, nextFixture);
    this.#lastFrame = frame;
    this.#scenarioFrames.set(request.scenarioId, frame);
    this.#postResponse({
      protocol: STUDIO_SIMULATION_WORKER_PROTOCOL_V2,
      requestId: request.requestId,
      status: "ok",
      kind: "control-applied",
      frame,
    });
  }

  async #requestAnalysis(
    request: Extract<
      StudioSimulationWorkerRequestV2,
      { kind: "request-analysis" }
    >,
  ): Promise<void> {
    const adapter = this.#requiredActiveAdapter(
      request.runtimeSessionId,
      request.scenarioId,
    );
    const physicalRuntimeSessionId = this.#requiredPhysicalRuntimeSessionId();
    const priorFrame = this.#lastFrame;
    if (priorFrame === undefined) {
      throw new FatalWorkerStateErrorV2(
        "simulation worker analysis failed: no accepted frame is active",
      );
    }
    let currentFrame: StudioSimulationFrameV2;
    try {
      currentFrame = this.#validateAdapterFrame(adapter.currentFrame({
        runtimeSessionId: physicalRuntimeSessionId,
        scenarioId: request.scenarioId,
      }));
    } catch (error) {
      throw new FatalWorkerStateErrorV2(
        `simulation worker analysis failed: ${errorMessageV2(error)}`,
      );
    }
    if (!sameStudioSimulationFrameV2(priorFrame, currentFrame)) {
      throw new FatalWorkerStateErrorV2(
        "simulation worker analysis failed: adapter frame drifted",
      );
    }
    if (
      request.expectedInputEpoch !== priorFrame.inputEpoch
      || request.expectedAcceptedRevision !== priorFrame.acceptedRevision
      || request.expectedAcceptedTimeSec !== priorFrame.acceptedTimeSec
    ) {
      throw new Error(
        "simulation worker analysis rejected stale expected clocks",
      );
    }

    const validateProposedAnalysis = (
      proposedAnalysis: unknown,
    ): StudioSimulationAnalysisV2 => {
      const physicalAnalysis = validateStudioSimulationAnalysisV2(
        proposedAnalysis,
      );
      if (
        physicalAnalysis.runtimeSessionId !== physicalRuntimeSessionId
        || physicalAnalysis.modelId !== adapter.modelId
        || physicalAnalysis.scenarioId !== request.scenarioId
      ) {
        throw new Error(
          "analysis result physical runtime identity does not match the request",
        );
      }
      const analysis = physicalAnalysis.runtimeSessionId
        === request.runtimeSessionId
        ? physicalAnalysis
        : validateStudioSimulationAnalysisV2({
            ...physicalAnalysis,
            runtimeSessionId: request.runtimeSessionId,
          });
      if (
        analysis.modelId !== adapter.modelId
        || analysis.runtimeSessionId !== request.runtimeSessionId
        || analysis.scenarioId !== request.scenarioId
        || analysis.analysisId !== request.analysisId
        || analysis.inputEpoch !== priorFrame.inputEpoch
        || analysis.sourceAcceptedRevision !== priorFrame.acceptedRevision
        || analysis.sourceAcceptedTimeSec !== priorFrame.acceptedTimeSec
      ) {
        throw new Error(
          "analysis result identity or source clocks do not match the request",
        );
      }
      this.#assertAnalysisDidNotMutate(priorFrame, analysis);
      return analysis;
    };

    let proposedAnalysis: unknown;
    try {
      proposedAnalysis = await adapter.requestAnalysis({
        runtimeSessionId: physicalRuntimeSessionId,
        scenarioId: request.scenarioId,
        analysisId: request.analysisId,
        expectedInputEpoch: request.expectedInputEpoch,
        expectedAcceptedRevision: request.expectedAcceptedRevision,
        expectedAcceptedTimeSec: request.expectedAcceptedTimeSec,
        ...(request.analysisPartition === undefined
          ? {}
          : { analysisPartition: request.analysisPartition }),
        onProgress: (proposedProgress) => {
          const analysis = validateProposedAnalysis(proposedProgress);
          this.#postResponse({
            protocol: STUDIO_SIMULATION_WORKER_PROTOCOL_V2,
            requestId: request.requestId,
            status: "ok",
            kind: "analysis-progress",
            analysis,
          });
        },
      });
    } catch (error) {
      this.#assertAnalysisDidNotMutate(priorFrame, error);
      throw new Error(
        `simulation worker analysis rejected: ${errorMessageV2(error)}`,
      );
    }

    let analysis: StudioSimulationAnalysisV2;
    try {
      analysis = validateProposedAnalysis(proposedAnalysis);
    } catch (error) {
      if (error instanceof FatalWorkerStateErrorV2) throw error;
      this.#assertAnalysisDidNotMutate(priorFrame, error);
      throw new Error(
        `simulation worker analysis rejected: ${errorMessageV2(error)}`,
      );
    }

    this.#postResponse({
      protocol: STUDIO_SIMULATION_WORKER_PROTOCOL_V2,
      requestId: request.requestId,
      status: "ok",
      kind: "analysis-result",
      analysis,
    });
  }

  async #readScenarios(
    request: Extract<
      StudioSimulationWorkerRequestV2,
      { kind: "read-scenarios" }
    >,
  ): Promise<void> {
    this.#requiredActiveAdapter(request.runtimeSessionId);
    this.#assertExpectedActiveBoundary(request);
    const content = await this.#captureAllScenarios(
      "experiment/worker-scenario-capture",
      EMPTY_WORKER_CAPTURE_SURFACE_V2,
    );
    this.#assertExpectedActiveBoundary(request);
    this.#postResponse({
      protocol: STUDIO_SIMULATION_WORKER_PROTOCOL_V2,
      requestId: request.requestId,
      status: "ok",
      kind: "scenarios-captured",
      captures: {
        activeScenarioId: this.#requiredActiveScenarioId(),
        scenarios: content.scenarios,
      },
    });
  }

  #selectScenario(
    request: Extract<
      StudioSimulationWorkerRequestV2,
      { kind: "select-scenario" }
    >,
  ): void {
    const adapter = this.#requiredActiveAdapter(request.runtimeSessionId);
    this.#assertExpectedActiveBoundary(request);
    if (!this.#scenarioLabels.has(request.scenarioId)) {
      throw new Error(`simulation worker Scenario not found: ${request.scenarioId}`);
    }
    const frame = this.#validateAdapterFrame(adapter.currentFrame({
      runtimeSessionId: this.#requiredPhysicalRuntimeSessionId(),
      scenarioId: request.scenarioId,
    }), request.scenarioId);
    this.#scenarioId = request.scenarioId;
    this.#currentFixture = this.#requiredScenarioFixture(request.scenarioId);
    this.#lastFrame = frame;
    this.#scenarioFrames.set(request.scenarioId, frame);
    this.#postScenarioState(request.requestId);
  }

  #assertScenarioCapacity(): void {
    if (this.#scenarioOrder.length >= STUDIO_EXPERIMENT_SCENARIO_LIMIT_V2) {
      throw new Error(
        `simulation worker supports at most ${STUDIO_EXPERIMENT_SCENARIO_LIMIT_V2} Scenarios`,
      );
    }
  }

  async #addScenarioFromPreset(
    request: Extract<
      StudioSimulationWorkerRequestV2,
      { kind: "add-scenario-from-preset" }
    >,
  ): Promise<void> {
    this.#requiredActiveAdapter(request.runtimeSessionId);
    this.#assertExpectedActiveBoundary(request);
    if (this.#scenarioLabels.has(request.scenarioId)) {
      throw new Error(`simulation worker Scenario already exists: ${request.scenarioId}`);
    }
    this.#assertScenarioCapacity();
    const runtime = this.#requiredExactRuntime();
    const capture = await createScenarioPresetCaptureClonerV2(
      exactRuntimeResolverV2(runtime),
    ).clone(request.preset);
    if (request.preset.modelId !== runtime.contract.modelId) {
      throw new Error("simulation worker Preset modelId mismatch");
    }
    this.#assertExpectedActiveBoundary(request);
    const current = await this.#captureAllScenarios(
      "experiment/worker-scenario-rebuild",
      EMPTY_WORKER_CAPTURE_SURFACE_V2,
    );
    await this.#rebuildScenarioSession([
      ...current.scenarios,
      Object.freeze({
        scenarioId: request.scenarioId,
        label: request.label,
        capture,
      }),
    ], request.scenarioId);
    this.#postScenarioState(request.requestId);
  }

  async #duplicateScenario(
    request: Extract<
      StudioSimulationWorkerRequestV2,
      { kind: "duplicate-scenario" }
    >,
  ): Promise<void> {
    this.#requiredActiveAdapter(request.runtimeSessionId);
    this.#assertExpectedActiveBoundary(request);
    if (this.#scenarioLabels.has(request.scenarioId)) {
      throw new Error(`simulation worker Scenario already exists: ${request.scenarioId}`);
    }
    this.#assertScenarioCapacity();
    const current = await this.#captureAllScenarios(
      "experiment/worker-scenario-rebuild",
      EMPTY_WORKER_CAPTURE_SURFACE_V2,
    );
    const source = current.scenarios.find(
      ({ scenarioId }) => scenarioId === request.sourceScenarioId,
    );
    if (source === undefined) {
      throw new Error(
        `simulation worker source Scenario not found: ${request.sourceScenarioId}`,
      );
    }
    await this.#rebuildScenarioSession([
      ...current.scenarios,
      Object.freeze({
        scenarioId: request.scenarioId,
        label: request.label,
        capture: source.capture,
      }),
    ], request.scenarioId);
    this.#postScenarioState(request.requestId);
  }

  #renameScenario(
    request: Extract<
      StudioSimulationWorkerRequestV2,
      { kind: "rename-scenario" }
    >,
  ): void {
    this.#requiredActiveAdapter(request.runtimeSessionId);
    if (!this.#scenarioLabels.has(request.scenarioId)) {
      throw new Error(`simulation worker Scenario not found: ${request.scenarioId}`);
    }
    this.#scenarioLabels.set(request.scenarioId, request.label);
    this.#postScenarioState(request.requestId);
  }

  async #deleteScenario(
    request: Extract<
      StudioSimulationWorkerRequestV2,
      { kind: "delete-scenario" }
    >,
  ): Promise<void> {
    this.#requiredActiveAdapter(request.runtimeSessionId);
    this.#assertExpectedActiveBoundary(request);
    const deletedIndex = this.#scenarioOrder.indexOf(request.scenarioId);
    if (deletedIndex < 0) {
      throw new Error(`simulation worker Scenario not found: ${request.scenarioId}`);
    }
    if (this.#scenarioOrder.length === 1) {
      throw new Error("simulation worker cannot delete its last Scenario");
    }
    const activeScenarioId = this.#requiredActiveScenarioId();
    const current = await this.#captureAllScenarios(
      "experiment/worker-scenario-rebuild",
      EMPTY_WORKER_CAPTURE_SURFACE_V2,
    );
    const retained = current.scenarios.filter(
      ({ scenarioId }) => scenarioId !== request.scenarioId,
    );
    const nextActiveScenarioId = request.scenarioId !== activeScenarioId
      ? activeScenarioId
      : retained[Math.min(deletedIndex, retained.length - 1)]!.scenarioId;
    await this.#rebuildScenarioSession(retained, nextActiveScenarioId);
    this.#postScenarioState(request.requestId);
  }

  async #captureAllScenarios(
    experimentId: string,
    surface: ExperimentSurfaceV2,
    surfaceSeriesId?: string,
  ): Promise<ExperimentContentV2> {
    const runtime = this.#requiredExactRuntime();
    const physicalRuntimeSessionId = this.#requiredPhysicalRuntimeSessionId();
    const desiredContent = validateExperimentDesiredContentForModelV2({
      modelId: runtime.contract.modelId,
      ...(surfaceSeriesId === undefined ? {} : { surfaceSeriesId }),
      scenarios: this.#scenarioOrder.map((scenarioId) => ({
        scenarioId,
        label: this.#requiredScenarioLabel(scenarioId),
        fixture: this.#requiredScenarioFixture(scenarioId),
      })),
      surface,
    }, runtime.contract);
    const correlation = validateExperimentCaptureCorrelationV2({
      runtimeSessionId: physicalRuntimeSessionId,
      scenarios: this.#scenarioOrder.map((scenarioId) => ({
        scenarioId,
        expectedInputEpoch: runtime.simulationAdapter.currentInputEpoch({
          runtimeSessionId: physicalRuntimeSessionId,
          scenarioId,
        }),
      })),
    }, desiredContent);
    return captureFirstExperimentContentV2({
      runtime,
      experimentId,
      desiredContent,
      correlation,
      frames: this.#scenarioFrames,
    });
  }

  async #rebuildScenarioSession(
    scenarios: readonly ExperimentScenarioV2[],
    activeScenarioId: string,
  ): Promise<void> {
    const adapter = this.#requiredActiveAdapter(
      this.#requiredLogicalRuntimeSessionId(),
    );
    if (!scenarios.some(({ scenarioId }) => scenarioId === activeScenarioId)) {
      throw new Error("simulation worker rebuilt active Scenario is missing");
    }
    const oldPhysicalRuntimeSessionId = this.#requiredPhysicalRuntimeSessionId();
    const nextGeneration = this.#sessionGeneration + 1;
    const nextPhysicalRuntimeSessionId = physicalSessionIdV2(
      this.#requiredLogicalRuntimeSessionId(),
      nextGeneration,
    );
    let created = false;
    try {
      await adapter.createSession({
        runtimeSessionId: nextPhysicalRuntimeSessionId,
        scenarios: scenarios.map((scenario) => ({
          scenarioId: scenario.scenarioId,
          fixture: scenario.capture.fixture,
          checkpoint: scenario.capture.checkpoint,
        })),
      });
      created = true;
      const frames = new Map<string, StudioSimulationFrameV2>();
      for (const scenario of scenarios) {
        frames.set(scenario.scenarioId, this.#validateAdapterFrame(
          adapter.currentFrame({
            runtimeSessionId: nextPhysicalRuntimeSessionId,
            scenarioId: scenario.scenarioId,
          }),
          scenario.scenarioId,
          nextPhysicalRuntimeSessionId,
        ));
      }
      try {
        adapter.disposeSession(oldPhysicalRuntimeSessionId);
      } catch (error) {
        bestEffortDisposeV2(adapter, nextPhysicalRuntimeSessionId);
        throw new FatalWorkerStateErrorV2(
          `simulation worker could not retire its prior exact session: ${errorMessageV2(error)}`,
        );
      }
      this.#physicalRuntimeSessionId = nextPhysicalRuntimeSessionId;
      this.#sessionGeneration = nextGeneration;
      this.#scenarioOrder = scenarios.map(({ scenarioId }) => scenarioId);
      this.#scenarioLabels.clear();
      this.#scenarioFixtures.clear();
      this.#scenarioFrames.clear();
      for (const scenario of scenarios) {
        this.#scenarioLabels.set(scenario.scenarioId, scenario.label);
        this.#scenarioFixtures.set(
          scenario.scenarioId,
          scenario.capture.fixture,
        );
        this.#scenarioFrames.set(scenario.scenarioId, frames.get(
          scenario.scenarioId,
        )!);
      }
      this.#scenarioId = activeScenarioId;
      this.#currentFixture = this.#requiredScenarioFixture(activeScenarioId);
      this.#lastFrame = this.#scenarioFrames.get(activeScenarioId)!;
    } catch (error) {
      if (created) bestEffortDisposeV2(adapter, nextPhysicalRuntimeSessionId);
      throw error;
    }
  }

  #postScenarioState(requestId: number): void {
    this.#postResponse({
      protocol: STUDIO_SIMULATION_WORKER_PROTOCOL_V2,
      requestId,
      status: "ok",
      kind: "scenario-state",
      state: {
        activeScenarioId: this.#requiredActiveScenarioId(),
        scenarios: this.#scenarioOrder.map((scenarioId) => ({
          scenarioId,
          label: this.#requiredScenarioLabel(scenarioId),
        })),
        frame: this.#requiredActiveFrame(),
      },
    });
  }

  async #saveExperiment(
    request: Extract<
      StudioSimulationWorkerRequestV2,
      { kind: "save-experiment" }
    >,
  ): Promise<void> {
    const context = this.#requiredAuthoringContext(
      request.runtimeSessionId,
      request.scenarioId,
    );
    if (
      this.#authoringExperimentId !== undefined
      && this.#authoringExperimentId !== request.experimentId
    ) {
      throw new Error("simulation worker authoring Experiment identity mismatch");
    }
    this.#assertExpectedActiveBoundary(request);
    if (
      request.scenarioIds.length !== this.#scenarioOrder.length
      || request.scenarioIds.some((scenarioId, index) =>
        scenarioId !== this.#scenarioOrder[index])
    ) {
      throw new Error(
        "simulation worker Save Surface Scenario identities are stale",
      );
    }
    const desiredContent = validateExperimentDesiredContentForModelV2({
      modelId: context.runtime.contract.modelId,
      ...(request.surfaceSeriesId === undefined
        ? {}
        : { surfaceSeriesId: request.surfaceSeriesId }),
      scenarios: this.#scenarioOrder.map((scenarioId) => ({
        scenarioId,
        label: this.#requiredScenarioLabel(scenarioId),
        fixture: this.#requiredScenarioFixture(scenarioId),
      })),
      surface: request.surface,
    }, context.runtime.contract);
    assertExperimentDesiredFixturesMatchModelV2(
      desiredContent,
      context.runtime.contract,
      context.runtime.captureAdapter,
    );
    const correlation = validateExperimentCaptureCorrelationV2({
      runtimeSessionId: this.#requiredPhysicalRuntimeSessionId(),
      scenarios: this.#scenarioOrder.map((scenarioId) => ({
        scenarioId,
        expectedInputEpoch: context.runtime.simulationAdapter.currentInputEpoch({
          runtimeSessionId: this.#requiredPhysicalRuntimeSessionId(),
          scenarioId,
        }),
      })),
    }, desiredContent);

    let experiment: ExperimentV2;
    try {
      const current = await context.authoring.readExperiment(
        request.experimentId,
      );
      if (current === null) {
        if (request.expectedVersion !== null) {
          throw new Error(
            "first Experiment Save requires expectedVersion null",
          );
        }
        const capturedContent = await captureFirstExperimentContentV2({
          runtime: context.runtime,
          experimentId: request.experimentId,
          desiredContent,
          correlation,
          frames: this.#scenarioFrames,
        });
        experiment = await context.authoring.createExperiment({
          experimentId: request.experimentId,
          content: capturedContent,
        });
      } else {
        if (request.expectedVersion === null) {
          throw new Error(
            "existing Experiment Save requires an expected version",
          );
        }
        experiment = await context.authoring.saveExperiment({
          experimentId: request.experimentId,
          expectedVersion: request.expectedVersion,
          desiredContent,
          captureCorrelation: correlation,
        });
      }
      experiment = validateExperimentV2(experiment);
      assertSavedExperimentAtBoundaryV2({
        experiment,
        experimentId: request.experimentId,
        expectedVersion: request.expectedVersion,
        desiredContent,
        frames: this.#scenarioFrames,
        priorExperiment: current,
      });
      this.#assertAcceptedFrameUnchanged(
        context.frame,
        "Experiment Save",
      );
    } catch (error) {
      if (error instanceof FatalWorkerStateErrorV2) throw error;
      this.#assertAcceptedFrameUnchanged(context.frame, "Experiment Save");
      throw new Error(
        `simulation worker Experiment Save rejected: ${errorMessageV2(error)}`,
      );
    }

    this.#authoringExperimentId = request.experimentId;
    this.#postResponse({
      protocol: STUDIO_SIMULATION_WORKER_PROTOCOL_V2,
      requestId: request.requestId,
      status: "ok",
      kind: "experiment-saved",
      experiment,
    });
  }

  async #createSnapshot(
    request: Extract<
      StudioSimulationWorkerRequestV2,
      { kind: "create-snapshot" }
    >,
  ): Promise<void> {
    const context = this.#requiredAuthoringContext(
      request.runtimeSessionId,
      request.scenarioId,
    );
    this.#assertExpectedActiveBoundary(request);
    if (
      request.scenarioIds.length !== this.#scenarioOrder.length
      || request.scenarioIds.some((scenarioId, index) =>
        scenarioId !== this.#scenarioOrder[index])
    ) {
      throw new Error(
        "simulation worker Snapshot Surface Scenario identities are stale",
      );
    }

    let snapshot: ExperimentSnapshotV2;
    try {
      const candidateContent = await this.#captureAllScenarios(
        `experiment/session/${request.runtimeSessionId}`,
        request.surface,
        request.surfaceSeriesId,
      );
      const created = request.snapshotSource === "session"
        ? await context.authoring.createSnapshot({
            content: candidateContent,
            ...(request.surfaceReleaseId === undefined
              ? {}
              : { surfaceReleaseId: request.surfaceReleaseId }),
          })
        : await this.#createPublicationSnapshotFromSavedHead(
            context,
            candidateContent,
            request.surfaceReleaseId,
          );
      snapshot = validateExperimentSnapshotV2(created);
      if (
        snapshot.content.modelId !== context.runtime.contract.modelId
      ) {
        throw new FatalWorkerStateErrorV2(
          "simulation worker Snapshot commit returned inconsistent identity",
        );
      }
      if (!samePortableValueV2(candidateContent, snapshot.content)) {
        throw new FatalWorkerStateErrorV2(
          "simulation worker Snapshot admission changed captured content",
        );
      }
      this.#assertAcceptedFrameUnchanged(
        context.frame,
        "Snapshot creation",
      );
    } catch (error) {
      if (error instanceof FatalWorkerStateErrorV2) throw error;
      this.#assertAcceptedFrameUnchanged(
        context.frame,
        "Snapshot creation",
      );
      throw new Error(
        `simulation worker Snapshot creation rejected: ${errorMessageV2(error)}`,
      );
    }

    this.#postResponse({
      protocol: STUDIO_SIMULATION_WORKER_PROTOCOL_V2,
      requestId: request.requestId,
      status: "ok",
      kind: "snapshot-created",
      snapshot,
    });
  }

  async #createPublicationSnapshotFromSavedHead(
    context: StudioSimulationWorkerAuthoringContextV2,
    candidateContent: ExperimentContentV2,
    surfaceReleaseId?: string,
  ): Promise<ExperimentSnapshotV2> {
    const experimentId = this.#authoringExperimentId;
    if (experimentId === undefined) {
      throw new Error(
        "Publishing requires a saved Experiment authoring seed",
      );
    }
    const experiment = await context.authoring.readExperiment(experimentId);
    if (experiment === null) {
      throw new Error(
        "The saved Experiment required for publishing is no longer available",
      );
    }
    return context.authoring.createSnapshot({
      content: candidateContent,
      ...(surfaceReleaseId === undefined ? {} : { surfaceReleaseId }),
      savedExperiment: {
        experimentId,
        expectedVersion: experiment.version,
      },
    });
  }

  #dispose(
    request: Extract<StudioSimulationWorkerRequestV2, { kind: "dispose" }>,
  ): void {
    let adapter: RegisteredModelSimulationAdapterV2;
    try {
      adapter = this.#requiredActiveAdapter(request.runtimeSessionId);
    } catch (error) {
      throw new FatalWorkerStateErrorV2(
        `simulation worker disposal failed: ${errorMessageV2(error)}`,
      );
    }
    this.#state = "disposing";
    try {
      adapter.disposeSession(this.#requiredPhysicalRuntimeSessionId());
      this.#clearSession();
      this.#postResponse({
        protocol: STUDIO_SIMULATION_WORKER_PROTOCOL_V2,
        requestId: request.requestId,
        status: "ok",
        kind: "disposed",
      });
      this.#state = "closed";
      this.#closePort();
    } catch (error) {
      this.#clearSession();
      this.#state = "failed";
      throw new FatalWorkerStateErrorV2(
        `simulation worker disposal failed: ${errorMessageV2(error)}`,
      );
    }
  }

  #requiredActiveAdapter(
    runtimeSessionId: string,
    scenarioId?: string,
  ): RegisteredModelSimulationAdapterV2 {
    if (
      this.#state !== "active"
      || this.#adapter === undefined
      || this.#runtimeSessionId !== runtimeSessionId
      || (scenarioId !== undefined && this.#scenarioId !== scenarioId)
    ) {
      throw new Error("simulation worker session identity mismatch");
    }
    return this.#adapter;
  }

  #requiredLogicalRuntimeSessionId(): string {
    if (this.#runtimeSessionId === undefined) {
      throw new FatalWorkerStateErrorV2(
        "simulation worker has no logical runtime session",
      );
    }
    return this.#runtimeSessionId;
  }

  #requiredPhysicalRuntimeSessionId(): string {
    if (this.#physicalRuntimeSessionId === undefined) {
      throw new FatalWorkerStateErrorV2(
        "simulation worker has no exact runtime session",
      );
    }
    return this.#physicalRuntimeSessionId;
  }

  #requiredExactRuntime(): ResolvedExactModelRuntimeV2 {
    if (this.#exactRuntime === undefined) {
      throw new FatalWorkerStateErrorV2(
        "simulation worker has no exact model runtime",
      );
    }
    return this.#exactRuntime;
  }

  #requiredActiveScenarioId(): string {
    if (this.#scenarioId === undefined) {
      throw new FatalWorkerStateErrorV2(
        "simulation worker has no active Scenario",
      );
    }
    return this.#scenarioId;
  }

  #requiredScenarioLabel(scenarioId: string): string {
    const label = this.#scenarioLabels.get(scenarioId);
    if (label === undefined) {
      throw new FatalWorkerStateErrorV2(
        `simulation worker lost Scenario label: ${scenarioId}`,
      );
    }
    return label;
  }

  #requiredScenarioFixture(scenarioId: string): StudioJsonValueV2 {
    const fixture = this.#scenarioFixtures.get(scenarioId);
    if (fixture === undefined) {
      throw new FatalWorkerStateErrorV2(
        `simulation worker lost Scenario fixture: ${scenarioId}`,
      );
    }
    return fixture;
  }

  #requiredActiveFrame(): StudioSimulationFrameV2 {
    if (this.#lastFrame === undefined) {
      throw new FatalWorkerStateErrorV2(
        "simulation worker has no active accepted frame",
      );
    }
    return this.#lastFrame;
  }

  #assertExpectedActiveBoundary(input: Readonly<{
    expectedActiveScenarioId?: string;
    scenarioId?: string;
    expectedInputEpoch: number;
    expectedAcceptedRevision: number;
    expectedAcceptedTimeSec: number;
  }>): void {
    const frame = this.#requiredActiveFrame();
    const expectedScenarioId = input.expectedActiveScenarioId
      ?? input.scenarioId;
    if (
      expectedScenarioId !== this.#requiredActiveScenarioId()
      || input.expectedInputEpoch !== frame.inputEpoch
      || input.expectedAcceptedRevision !== frame.acceptedRevision
      || input.expectedAcceptedTimeSec !== frame.acceptedTimeSec
    ) {
      throw new Error(
        "simulation worker rejected a stale active Scenario boundary",
      );
    }
    this.#assertAcceptedFrameUnchanged(frame, "Scenario boundary admission");
  }

  #requiredAuthoringContext(
    runtimeSessionId: string,
    scenarioId: string,
  ): StudioSimulationWorkerAuthoringContextV2 {
    this.#requiredActiveAdapter(runtimeSessionId, scenarioId);
    if (
      this.#exactRuntime === undefined
      || this.#authoring === undefined
      || this.#currentFixture === undefined
      || this.#lastFrame === undefined
    ) {
      throw new FatalWorkerStateErrorV2(
        "simulation worker has no active exact authoring boundary",
      );
    }
    this.#assertAcceptedFrameUnchanged(
      this.#lastFrame,
      "authoring admission",
    );
    return Object.freeze({
      runtime: this.#exactRuntime,
      authoring: this.#authoring,
      fixture: this.#currentFixture,
      frame: this.#lastFrame,
    });
  }

  #assertAcceptedFrameUnchanged(
    expected: StudioSimulationFrameV2,
    operation: string,
  ): void {
    const adapter = this.#adapter;
    const runtimeSessionId = this.#runtimeSessionId;
    const scenarioId = this.#scenarioId;
    if (
      adapter === undefined
      || runtimeSessionId === undefined
      || scenarioId === undefined
      || this.#lastFrame === undefined
      || !sameStudioSimulationFrameV2(expected, this.#lastFrame)
    ) {
      throw new FatalWorkerStateErrorV2(
        `simulation worker ${operation} detected accepted frame drift`,
      );
    }
    try {
      const current = this.#validateAdapterFrame(adapter.currentFrame({
        runtimeSessionId: this.#requiredPhysicalRuntimeSessionId(),
        scenarioId,
      }));
      if (!sameStudioSimulationFrameV2(expected, current)) {
        throw new Error("adapter current frame changed");
      }
    } catch (error) {
      throw new FatalWorkerStateErrorV2(
        `simulation worker ${operation} detected accepted frame drift: `
          + errorMessageV2(error),
      );
    }
  }

  #validateAdapterFrame(
    value: unknown,
    expectedScenarioId = this.#scenarioId,
    expectedPhysicalRuntimeSessionId = this.#physicalRuntimeSessionId,
  ): StudioSimulationFrameV2 {
    const adapter = this.#adapter;
    const logicalRuntimeSessionId = this.#runtimeSessionId;
    if (
      adapter === undefined
      || logicalRuntimeSessionId === undefined
      || expectedPhysicalRuntimeSessionId === undefined
      || expectedScenarioId === undefined
    ) {
      throw new Error("simulation worker has no active frame identity");
    }
    const frame = validateStudioSimulationFrameV2(value);
    if (
      frame.modelId !== adapter.modelId
      || frame.runtimeSessionId !== expectedPhysicalRuntimeSessionId
      || frame.scenarioId !== expectedScenarioId
      || frame.inputEpoch !== adapter.currentInputEpoch({
        runtimeSessionId: expectedPhysicalRuntimeSessionId,
        scenarioId: expectedScenarioId,
      })
    ) {
      throw new Error("simulation worker adapter frame identity mismatch");
    }
    return frame.runtimeSessionId === logicalRuntimeSessionId
      ? frame
      : validateStudioSimulationFrameV2({
          ...frame,
          runtimeSessionId: logicalRuntimeSessionId,
        });
  }

  #assertRejectedControlWasAtomic(
    priorFrame: StudioSimulationFrameV2,
    originalError: unknown,
  ): void {
    const adapter = this.#adapter;
    const runtimeSessionId = this.#runtimeSessionId;
    const scenarioId = this.#scenarioId;
    if (
      adapter === undefined
      || runtimeSessionId === undefined
      || scenarioId === undefined
    ) {
      throw new FatalWorkerStateErrorV2(
        `simulation worker control violated atomicity after: ${errorMessageV2(originalError)}`,
      );
    }
    try {
      const currentFrame = this.#validateAdapterFrame(adapter.currentFrame({
        runtimeSessionId: this.#requiredPhysicalRuntimeSessionId(),
        scenarioId,
      }));
      if (!sameStudioSimulationFrameV2(priorFrame, currentFrame)) {
        throw new Error("adapter frame changed after a rejected control");
      }
    } catch (error) {
      throw new FatalWorkerStateErrorV2(
        "simulation worker control violated atomicity: "
          + errorMessageV2(error),
      );
    }
  }

  #assertAnalysisDidNotMutate(
    priorFrame: StudioSimulationFrameV2,
    originalResult: unknown,
  ): void {
    const adapter = this.#adapter;
    const runtimeSessionId = this.#runtimeSessionId;
    const scenarioId = this.#scenarioId;
    if (
      adapter === undefined
      || runtimeSessionId === undefined
      || scenarioId === undefined
    ) {
      throw new FatalWorkerStateErrorV2(
        `simulation worker analysis violated read-only semantics after: ${errorMessageV2(originalResult)}`,
      );
    }
    try {
      const currentFrame = this.#validateAdapterFrame(adapter.currentFrame({
        runtimeSessionId: this.#requiredPhysicalRuntimeSessionId(),
        scenarioId,
      }));
      if (!sameStudioSimulationFrameV2(priorFrame, currentFrame)) {
        throw new Error("adapter frame changed while computing an analysis");
      }
    } catch (error) {
      throw new FatalWorkerStateErrorV2(
        "simulation worker analysis violated read-only semantics: "
          + errorMessageV2(error),
      );
    }
  }

  #postResponse(value: unknown): void {
    const response =
      validateStudioSimulationWorkerResponseFromTrustedRuntimeV2(value);
    this.#port.postMessage(response);
  }

  #safePostError(
    requestId: number,
    message: string,
    fatal = false,
  ): void {
    if (this.#portClosed) return;
    try {
      this.#postResponse({
        protocol: STUDIO_SIMULATION_WORKER_PROTOCOL_V2,
        requestId,
        status: "error",
        fatal,
        message: portableErrorMessageV2(message),
      });
    } catch {
      this.#failClosed("simulation worker could not post an error", "failed");
    }
  }

  #failClosed(
    message: string,
    state: "closed" | "failed",
  ): void {
    if (this.#portClosed) return;
    const adapter = this.#adapter;
    const runtimeSessionId = this.#physicalRuntimeSessionId;
    if (adapter !== undefined && runtimeSessionId !== undefined) {
      bestEffortDisposeV2(adapter, runtimeSessionId);
    }
    this.#clearSession();
    this.#state = state;
    while (this.#queue.length > 0) {
      const request = this.#queue.shift()!;
      try {
        const response =
          validateStudioSimulationWorkerResponseFromTrustedRuntimeV2({
            protocol: STUDIO_SIMULATION_WORKER_PROTOCOL_V2,
            requestId: request.requestId,
            status: "error",
            fatal: true,
            message: portableErrorMessageV2(message),
          });
        this.#port.postMessage(response);
      } catch {
        break;
      }
    }
    this.#closePort();
    if (!this.#processing) this.#resolveIdle();
  }

  #clearSession(): void {
    this.#exactRuntime = undefined;
    this.#adapter = undefined;
    this.#fixtureReducer = undefined;
    this.#authoring = undefined;
    this.#authoringExperimentId = undefined;
    this.#runtimeSessionId = undefined;
    this.#physicalRuntimeSessionId = undefined;
    this.#scenarioId = undefined;
    this.#scenarioOrder = [];
    this.#scenarioLabels.clear();
    this.#scenarioFixtures.clear();
    this.#scenarioFrames.clear();
    this.#sessionGeneration = 0;
    this.#currentFixture = undefined;
    this.#lastFrame = undefined;
  }

  #closePort(): void {
    if (this.#portClosed) return;
    this.#portClosed = true;
    try {
      this.#port.close();
    } catch {
      // The port is already terminal from the controller's perspective.
    }
  }

  #resolveIdle(): void {
    while (this.#idleWaiters.length > 0) this.#idleWaiters.shift()!();
  }
}

function assertExactRuntimeV2(
  runtime: ResolvedExactModelRuntimeV2,
): void {
  if (runtime === null || typeof runtime !== "object") {
    throw new Error("registered exact runtime is invalid");
  }
  assertModelContractV2(runtime.contract);
  assertCaptureAdapterMatchesModelV2(
    runtime.captureAdapter,
    runtime.contract,
  );
  const modelId = runtime.contract.modelId;
  if (
    runtime.experimentCapture?.modelId !== modelId
    || runtime.experimentCapture.fixtureSchemaId
      !== runtime.contract.fixtureSchemaId
    || runtime.experimentCapture.checkpointCodecId
      !== runtime.contract.checkpointCodecId
    || typeof runtime.experimentCapture.captureAcceptedCandidate !== "function"
    || runtime.snapshotGate?.modelId !== modelId
    || runtime.snapshotGate.snapshotGateId
      !== runtime.contract.snapshotGateId
    || typeof runtime.snapshotGate.admitFrozenCandidate !== "function"
    || runtime.fixtureAdapter?.modelId !== modelId
    || runtime.fixtureAdapter.fixtureSchemaId
      !== runtime.contract.fixtureSchemaId
    || typeof runtime.fixtureAdapter.validateCompleteFixture !== "function"
    || (
      runtime.contract.controlCatalog.length > 0
      && typeof runtime.fixtureAdapter.reduceControlAction !== "function"
    )
  ) {
    throw new Error(
      `registered executable bundle does not exactly match model ${modelId}`,
    );
  }
  assertSimulationAdapterV2(runtime.simulationAdapter);
  if (
    runtime.simulationAdapter.modelId !== modelId
    || runtime.simulationAdapter.fixtureSchemaId
      !== runtime.contract.fixtureSchemaId
    || runtime.simulationAdapter.checkpointCodecId
      !== runtime.contract.checkpointCodecId
  ) {
    throw new Error(
      `registered simulation adapter does not exactly match model ${modelId}`,
    );
  }
}

function exactRuntimeResolverV2(
  runtime: ResolvedExactModelRuntimeV2,
): ExactModelRuntimeResolverPortV2 {
  return Object.freeze({
    resolveExactRuntime(modelId: string) {
      if (modelId !== runtime.contract.modelId) {
        throw new Error(`registered exact runtime not found: ${modelId}`);
      }
      return runtime;
    },
  });
}

async function validateAuthoringSeedAgainstRuntimeV2(
  authoring: StudioExperimentAuthoringFacadeV2,
  seed: Extract<
    StudioSimulationWorkerRequestV2,
    { kind: "initialize" }
  >["authoringSeed"],
): Promise<void> {
  if (seed?.experiment !== undefined) {
    const experiment = await authoring.readExperiment(
      seed.experiment.experimentId,
    );
    if (experiment === null) {
      throw new Error("authoring seed experiment was not admitted");
    }
  }
}

function assertSeedMatchesInitializationV2(
  request: Extract<
    StudioSimulationWorkerRequestV2,
    { kind: "initialize" }
  >,
  seed: Extract<
    StudioSimulationWorkerRequestV2,
    { kind: "initialize" }
  >["authoringSeed"],
): void {
  const experiment = seed?.experiment;
  if (experiment === undefined) return;
  if (experiment.content.modelId !== request.expectedModelId) {
    throw new Error(
      "authoring seed experiment does not use the active exact model",
    );
  }
  const scenario = experiment.content.scenarios.find(
    ({ scenarioId }) => scenarioId === request.scenarioId,
  );
  if (scenario === undefined) {
    throw new Error(
      "authoring seed experiment does not contain the active Scenario",
    );
  }
  if (scenario.label !== request.scenarioLabel) {
    throw new Error(
      "simulation Scenario label does not match the seeded active Scenario",
    );
  }
  if (!samePortableValueV2(scenario.capture.fixture, request.fixture)) {
    throw new Error(
      "simulation fixture does not match the seeded active Scenario",
    );
  }
  if (
    request.checkpoint === undefined
    || !samePortableValueV2(
      scenario.capture.checkpoint,
      request.checkpoint,
    )
  ) {
    throw new Error(
      "simulation checkpoint does not match the seeded active Scenario",
    );
  }
}

async function captureFirstExperimentContentV2(input: Readonly<{
  runtime: ResolvedExactModelRuntimeV2;
  experimentId: string;
  desiredContent: ExperimentDesiredContentV2;
  correlation: ExperimentCaptureCorrelationV2;
  frames: ReadonlyMap<string, StudioSimulationFrameV2>;
}>): Promise<ExperimentContentV2> {
  const result = exactDataResultV2(
    await input.runtime.experimentCapture.captureAcceptedCandidate({
      experimentId: input.experimentId,
      model: input.runtime.contract,
      desiredContent: input.desiredContent,
      correlation: input.correlation,
    }),
    ["confirmation", "content"],
    "Experiment capture",
  );
  validateExperimentCaptureConfirmationV2(result.confirmation, {
    experimentId: input.experimentId,
    correlation: input.correlation,
  });
  const capturedContent = validateExperimentContentForModelV2(
    result.content,
    input.runtime.contract,
  );
  if (
    capturedContent.surfaceSeriesId !== undefined
    && capturedContent.surfaceSeriesId
      !== input.desiredContent.surfaceSeriesId
  ) {
    throw new Error(
      "Experiment capture changed the Studio-owned Surface series",
    );
  }
  // Exact-model capture adapters own numerical state only. Reattach the
  // Studio-owned mutable Surface-series pin after validating that an adapter
  // did not try to substitute a different series. This mirrors the main
  // authoring application boundary and keeps first Save / Snapshot assembly
  // from silently degrading Standard-ABI content to the historical V2 shape.
  const content = validateExperimentContentForModelV2({
    ...capturedContent,
    ...(input.desiredContent.surfaceSeriesId === undefined
      ? {}
      : { surfaceSeriesId: input.desiredContent.surfaceSeriesId }),
  }, input.runtime.contract);
  assertCapturedDesiredContentAtBoundaryV2(
    input.desiredContent,
    content,
    input.frames,
  );
  await assertExperimentCapturesMatchModelV2(
    content,
    input.runtime.contract,
    input.runtime.captureAdapter,
  );
  return content;
}

function assertSavedExperimentAtBoundaryV2(input: Readonly<{
  experiment: ExperimentV2;
  experimentId: string;
  expectedVersion: number | null;
  desiredContent: ExperimentDesiredContentV2;
  frames: ReadonlyMap<string, StudioSimulationFrameV2>;
  priorExperiment: ExperimentV2 | null;
}>): void {
  const expectedVersion = input.expectedVersion === null
    ? 0
    : input.expectedVersion + 1;
  if (
    input.experiment.experimentId !== input.experimentId
    || input.experiment.version !== expectedVersion
  ) {
    throw new Error("saved Experiment experiment identity or version mismatch");
  }
  if (
    input.priorExperiment !== null
    && input.experiment.content.modelId
      !== input.priorExperiment.content.modelId
  ) {
    throw new Error("saved Experiment changed exact modelId");
  }
  assertCapturedDesiredContentAtBoundaryV2(
    input.desiredContent,
    input.experiment.content,
    input.frames,
  );
}

function assertCapturedDesiredContentAtBoundaryV2(
  desired: ExperimentDesiredContentV2,
  captured: ExperimentContentV2,
  frames: ReadonlyMap<string, StudioSimulationFrameV2>,
): void {
  if (
    captured.modelId !== desired.modelId
    || !samePortableValueV2(captured.surface, desired.surface)
    || captured.scenarios.length !== desired.scenarios.length
  ) {
    throw new Error("accepted-boundary capture changed authored content");
  }
  for (let index = 0; index < desired.scenarios.length; index += 1) {
    const requested = desired.scenarios[index]!;
    const admitted = captured.scenarios[index]!;
    const frame = frames.get(requested.scenarioId);
    if (
      frame === undefined
      ||
      admitted.scenarioId !== requested.scenarioId
      || admitted.label !== requested.label
      || !samePortableValueV2(admitted.capture.fixture, requested.fixture)
      || admitted.capture.checkpoint.acceptedRevision
        !== frame.acceptedRevision
      || admitted.capture.checkpoint.acceptedTimeSec
        !== frame.acceptedTimeSec
    ) {
      throw new Error(
        "accepted-boundary capture changed Scenario identity, fixture, or clocks",
      );
    }
  }
}

function exactDataResultV2(
  value: unknown,
  keys: readonly string[],
  label: string,
): Record<string, unknown> {
  if (
    value === null
    || typeof value !== "object"
    || Array.isArray(value)
    || Object.getPrototypeOf(value) !== Object.prototype
  ) {
    throw new Error(`${label} result must be a plain data object`);
  }
  const actual = Reflect.ownKeys(value);
  const expected = [...keys].sort();
  if (
    actual.some((key) => typeof key !== "string")
    || actual.length !== expected.length
    || (actual as string[]).sort().some((key, index) => key !== expected[index])
  ) {
    throw new Error(`${label} result fields must match exactly`);
  }
  for (const key of expected) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (
      descriptor === undefined
      || !descriptor.enumerable
      || !("value" in descriptor)
    ) {
      throw new Error(`${label} result fields must be enumerable data`);
    }
  }
  return value as Record<string, unknown>;
}

function createWorkerSnapshotIdFactoryV2():
ExperimentSnapshotIdFactoryPortV2 {
  let prefix: string;
  try {
    prefix = globalThis.crypto.randomUUID();
  } catch {
    prefix = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  }
  let ordinal = 0;
  return Object.freeze({
    nextSnapshotId() {
      if (ordinal === Number.MAX_SAFE_INTEGER) {
        throw new Error("simulation worker Snapshot ID space is exhausted");
      }
      ordinal += 1;
      // Snapshot IDs are also canonical route segments. Keep generated
      // identities slash-free so a hard refresh cannot depend on a host or
      // proxy preserving an encoded path separator.
      return `snapshot-worker-${prefix}-${ordinal}`;
    },
  });
}

function physicalSessionIdV2(
  logicalRuntimeSessionId: string,
  generation: number,
): string {
  const suffix = `@branch-${generation}`;
  const prefix = logicalRuntimeSessionId.slice(0, 256 - suffix.length);
  return validateStudioSimulationPortableIdV2(
    `${prefix}${suffix}`,
    "$.physicalRuntimeSessionId",
  );
}

function assertSimulationAdapterV2(
  adapter: RegisteredModelSimulationAdapterV2,
): void {
  if (
    adapter === null
    || typeof adapter !== "object"
    || typeof adapter.createSession !== "function"
    || typeof adapter.disposeSession !== "function"
    || typeof adapter.currentFrame !== "function"
    || typeof adapter.advanceOnePresentationStep !== "function"
    || typeof adapter.applyControl !== "function"
    || typeof adapter.requestAnalysis !== "function"
    || typeof adapter.replaceFixture !== "function"
    || typeof adapter.currentInputEpoch !== "function"
  ) {
    throw new Error("registered simulation adapter is invalid");
  }
  validateStudioSimulationPortableIdV2(adapter.modelId, "$.adapter.modelId");
  validateStudioSimulationPortableIdV2(
    adapter.fixtureSchemaId,
    "$.adapter.fixtureSchemaId",
  );
  validateStudioSimulationPortableIdV2(
    adapter.checkpointCodecId,
    "$.adapter.checkpointCodecId",
  );
}

function assertNonRegressingFrameV2(
  prior: StudioSimulationFrameV2 | undefined,
  next: StudioSimulationFrameV2,
): void {
  if (
    prior !== undefined
    && (
      next.acceptedRevision < prior.acceptedRevision
      || next.acceptedTimeSec < prior.acceptedTimeSec
      || next.inputEpoch < prior.inputEpoch
    )
  ) {
    throw new Error("simulation worker frame clock regressed");
  }
}

function sameStudioSimulationFrameV2(
  left: StudioSimulationFrameV2,
  right: StudioSimulationFrameV2,
): boolean {
  if (
    left.modelId !== right.modelId
    || left.runtimeSessionId !== right.runtimeSessionId
    || left.scenarioId !== right.scenarioId
    || left.inputEpoch !== right.inputEpoch
    || left.acceptedRevision !== right.acceptedRevision
    || left.acceptedTimeSec !== right.acceptedTimeSec
  ) {
    return false;
  }
  const leftIds = Object.keys(left.outputs);
  const rightIds = Object.keys(right.outputs);
  if (leftIds.length !== rightIds.length) return false;
  for (const outputId of leftIds) {
    const leftOutput = left.outputs[outputId];
    const rightOutput = right.outputs[outputId];
    if (
      leftOutput === undefined
      || rightOutput === undefined
      || leftOutput.outputId !== rightOutput.outputId
      || leftOutput.availability !== rightOutput.availability
      || leftOutput.quality !== rightOutput.quality
      || !sameOutputValueV2(leftOutput.value, rightOutput.value)
    ) {
      return false;
    }
  }
  return true;
}

function sameOutputValueV2(
  left: number | readonly number[] | null,
  right: number | readonly number[] | null,
): boolean {
  if (Array.isArray(left)) {
    return Array.isArray(right)
      && left.length === right.length
      && left.every((value, index) => value === right[index]);
  }
  return !Array.isArray(right) && left === right;
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

function bestEffortDisposeV2(
  adapter: RegisteredModelSimulationAdapterV2,
  runtimeSessionId: string,
): void {
  try {
    adapter.disposeSession(runtimeSessionId);
  } catch {
    // A fatal path still closes the worker even if model cleanup itself fails.
  }
}

function portableErrorMessageV2(message: string): string {
  if (message.length === 0 || message.length > 4_096 || hasUnpairedSurrogateV2(message)) {
    return "simulation worker request failed";
  }
  return message;
}

function hasUnpairedSurrogateV2(value: string): boolean {
  for (let index = 0; index < value.length; index += 1) {
    const codeUnit = value.charCodeAt(index);
    if (codeUnit >= 0xd800 && codeUnit <= 0xdbff) {
      const next = value.charCodeAt(index + 1);
      if (!(next >= 0xdc00 && next <= 0xdfff)) return true;
      index += 1;
    } else if (codeUnit >= 0xdc00 && codeUnit <= 0xdfff) {
      return true;
    }
  }
  return false;
}

function errorMessageV2(error: unknown): string {
  try {
    if (error instanceof Error) {
      const descriptor = Object.getOwnPropertyDescriptor(error, "message");
      if (
        descriptor !== undefined
        && "value" in descriptor
        && typeof descriptor.value === "string"
      ) {
        return descriptor.value;
      }
    }
    if (typeof error === "string") return error;
  } catch {
    // Hostile thrown values must not interrupt terminal cleanup.
  }
  return "simulation worker request failed";
}

class FatalWorkerStateErrorV2 extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FatalWorkerStateErrorV2";
  }
}
