import {
  applyScientificHemodynamicCurveSnapshotV1,
  createScientificHemodynamicCurveHistoryStateV1,
  getScientificHemodynamicCurveScenarioStateV1,
  recordScientificHemodynamicCurveAcquisitionFailureV1,
  startScientificHemodynamicCurveGenerationV1,
} from "./ScientificHemodynamicCurveHistoryStateV1";
import type {
  ScientificWorkbenchResearchControlDraftV0,
  ScientificWorkbenchResearchControlStoreV0,
} from "@/components/scientificWorkbench/ScientificWorkbenchResearchControlStoreV0";
import type {
  MainWireScientificCompleteTransientBeatV1,
  MainWireScientificMetricCycleV1,
} from "@/engine/scientific/metrics";
import type {
  MainWireScientificObservableFrameV1,
} from "@/engine/scientific/observables";
import type {
  MainWireScientificHemodynamicJobSnapshotV2,
} from "@/engine/scientific/protocols/MainWireScientificHemodynamicJobV2";
import {
  sameSimulationReleaseRef,
} from "@/engine/scientific/release";
import {
  InMemoryContentAddressedArtifactStoreV1,
} from "@/studio/infrastructure/artifacts/InMemoryContentAddressedArtifactStoreV1";
import {
  MainWireSimulationRuntimeAdapterV1,
} from "@/studio/adapters/mainWire/MainWireSimulationRuntimeAdapterV1";
import {
  SimulationSessionCoordinatorV1,
} from "@/studio/application/runtime/SimulationSessionCoordinatorV1";
import type {
  StudioSettledAnalysisSourceV1,
} from "@/studio/contracts/v1";

import {
  bootstrapScientificProductStudioSourceV1,
  type ScientificProductStudioBootstrapProgressV1,
} from "./ScientificProductStudioBootstrapV1";
import {
  ScientificProductStudioScenarioControllerV1,
  type ScientificProductStudioScenarioStatusV1,
} from "./ScientificProductStudioScenarioControllerV1";
import {
  createScientificProductStudioHemodynamicAnalysisCoordinatorV1,
  studioSettledAnalysisSourceIdentityKeyV1,
  type ScientificProductStudioHemodynamicAnalysisCoordinatorV1,
  type ScientificProductStudioHemodynamicAnalysisErrorEventV1,
  type ScientificProductStudioHemodynamicAnalysisSnapshotEventV1,
} from "./ScientificProductStudioHemodynamicAnalysisCoordinatorV1";
import type {
  ScientificProductRuntimeRegistryPortV1,
} from "./ScientificProductRuntimeRegistryPortV1";
import type {
  AddScientificScenarioOptionsV1,
  ScientificProductHemodynamicProtocolDemandV1,
  ScientificProductHemodynamicProtocolKindV1,
  ScientificProductHemodynamicProtocolPresentationV1,
  ScientificProductHemodynamicProtocolSeriesSnapshotV1,
  ScientificProductHemodynamicProtocolSeriesV1,
  ScientificProductHemodynamicProtocolSourceIdentityV1,
  ScientificProductPvRelationProtocolDemandV1,
  ScientificProductPvRelationProtocolSeriesSnapshotV1,
  ScientificProductPvRelationProtocolSeriesV1,
  ScientificProductScenarioDescriptorV1,
  ScientificProductScenarioPresentationV1,
} from "./ScientificProductScenarioRegistryV1";
import {
  SCIENTIFIC_PRODUCT_RELEASE_REF_V1,
  scientificProductCaseByIdV1,
  type ScientificProductCaseV1,
  type ScientificProductCaseRouteResolutionV1,
} from "./scientificProductCaseCatalogV1";

const MAXIMUM_PRODUCT_SCENARIO_COUNT_V1 = 4;
const SCENARIO_COLORS_V1 = Object.freeze([
  "#38bdf8",
  "#fb923c",
  "#34d399",
  "#c084fc",
]);
const EMPTY_PROTOCOL_SERIES_V1 = Object.freeze({
  current: null,
  pending: null,
  history: Object.freeze([]),
  lastFailure: null,
});

let scenarioOrdinalV1 = 0;
let studioSessionOrdinalV1 = 0;
let hemodynamicGenerationOrdinalV1 = 0;

export type ScientificProductStudioScenarioRuntimeV1 = Readonly<{
  scenarioId: string;
  caseEntry: ScientificProductCaseV1;
  workspaceDocument:
    ScientificProductScenarioPresentationV1["workspaceDocument"];
  controlStore: ScientificWorkbenchResearchControlStoreV0;
  controller: ScientificProductStudioScenarioControllerV1;
  analysisArtifacts: InMemoryContentAddressedArtifactStoreV1;
}>;

type ScenarioEntryV1 = {
  descriptor: ScientificProductScenarioDescriptorV1;
  runtime: ScientificProductStudioScenarioRuntimeV1 | null;
  loadingGeneration: number;
  loadAbortController: AbortController | null;
  loadPromise: Promise<void> | null;
  unsubscribeStore: (() => void) | null;
  unsubscribeFrames: (() => void) | null;
  pendingDuplicateDraft: ScientificWorkbenchResearchControlDraftV0 | null;
  hemodynamicAnalysisCoordinator:
    ScientificProductStudioHemodynamicAnalysisCoordinatorV1 | null;
};

type ActiveHemodynamicProtocolRequestV1 = Readonly<{
  requestToken: string;
  generationId: string;
  sourceIdentityKey: string;
  sourceRole: StudioSettledAnalysisSourceV1["sourceRole"];
  detailMode:
    ScientificProductHemodynamicProtocolDemandV1["detailMode"];
}>;

export async function loadScientificProductStudioScenarioRuntimeV1(
  input: Readonly<{
    scenarioId: string;
    caseEntry: ScientificProductCaseV1;
    artifacts: InMemoryContentAddressedArtifactStoreV1;
    onProgress?: (progress: ScientificProductStudioBootstrapProgressV1) => void;
    signal?: AbortSignal;
    deferInitialLivePresentation?: boolean;
  }>,
): Promise<ScientificProductStudioScenarioRuntimeV1> {
  assertRuntimeLoadNotAbortedV1(input.signal);
  const bootstrap = await bootstrapScientificProductStudioSourceV1({
    caseEntry: input.caseEntry,
    scenarioId: input.scenarioId,
    artifacts: input.artifacts,
    onProgress: input.onProgress,
    signal: input.signal,
  });
  assertRuntimeLoadNotAbortedV1(input.signal);
  const adapter = new MainWireSimulationRuntimeAdapterV1({
    artifacts: input.artifacts,
  });
  const coordinator = new SimulationSessionCoordinatorV1({
    runtime: adapter,
    artifacts: input.artifacts,
  });
  const controller = await ScientificProductStudioScenarioControllerV1.create({
    bootstrap,
    coordinator,
    sessionId:
      `product-studio-session-${++studioSessionOrdinalV1}-${input.scenarioId}`,
    deferInitialLivePresentation: input.deferInitialLivePresentation,
    signal: input.signal,
  });
  if (input.signal?.aborted) {
    await controller.dispose();
    throw new Error("scientific product Studio runtime load aborted");
  }
  return Object.freeze({
    scenarioId: input.scenarioId,
    caseEntry: input.caseEntry,
    workspaceDocument: bootstrap.workspaceDocument,
    controlStore: controller.controlStore,
    controller,
    analysisArtifacts: input.artifacts,
  });
}

function assertRuntimeLoadNotAbortedV1(
  signal: AbortSignal | undefined,
): void {
  if (signal?.aborted) {
    throw new Error("scientific product Studio runtime load aborted");
  }
}

export function nextScientificProductStudioScenarioIdV1(): string {
  scenarioOrdinalV1 += 1;
  return `scientific-scenario-${scenarioOrdinalV1}`;
}

/**
 * Product-facing Studio registry. It keeps shell/layout/scenario UX stable
 * while every numerical branch is owned exclusively by a Studio coordinator.
 */
export class ScientificProductStudioScenarioRegistryV1
implements ScientificProductRuntimeRegistryPortV1 {
  readonly capabilities = Object.freeze({
    studioRuntime: true,
    guytonLoadSeries: true,
    pvRelations: false,
    vvReports: false,
  });
  private readonly entries = new Map<string, ScenarioEntryV1>();
  private readonly descriptorListeners = new Set<() => void>();
  private readonly frameListeners = new Set<() => void>();
  private readonly protocolListeners = new Set<() => void>();
  private readonly hemodynamicProtocolDemands = new Map<
    string,
    ScientificProductHemodynamicProtocolDemandV1
  >();
  private readonly activeHemodynamicProtocolRequests = new Map<
    string,
    ActiveHemodynamicProtocolRequestV1
  >();
  private hemodynamicProtocolSeriesSnapshot:
    ScientificProductHemodynamicProtocolSeriesSnapshotV1 =
      createScientificHemodynamicCurveHistoryStateV1();
  private descriptorSnapshot: readonly ScientificProductScenarioDescriptorV1[] =
    Object.freeze([]);
  private frameVersion = 0;
  private connected = false;
  private readonly disposalTasks = new Set<Promise<void>>();
  private disposePromise: Promise<void> | null = null;
  private disposed = false;
  private readonly emptyPvSnapshot:
    ScientificProductPvRelationProtocolSeriesSnapshotV1 =
      createScientificHemodynamicCurveHistoryStateV1();

  constructor(
    resolution: ScientificProductCaseRouteResolutionV1,
    initialRuntime: ScientificProductStudioScenarioRuntimeV1,
  ) {
    const descriptor = createDescriptorV1(
      initialRuntime.scenarioId,
      resolution.caseEntry,
      resolution.caseEntry.displayName,
      SCENARIO_COLORS_V1[0],
      "ready",
      "Studio live and strict lanes are active.",
    );
    const entry: ScenarioEntryV1 = {
      descriptor,
      runtime: initialRuntime,
      loadingGeneration: 0,
      loadAbortController: null,
      loadPromise: null,
      unsubscribeStore: null,
      unsubscribeFrames: null,
      pendingDuplicateDraft: null,
      hemodynamicAnalysisCoordinator: null,
    };
    this.entries.set(descriptor.id, entry);
    this.attachHemodynamicAnalysisCoordinatorV1(entry);
    this.publishDescriptorsV1();
  }

  /**
   * Connects external frame subscriptions only after the React owner commits.
   * Keeping construction side-effect-free prevents StrictMode from leaking a
   * subscription from a discarded state initializer.
   */
  connect(): void {
    if (this.disposed || this.connected) return;
    this.connected = true;
    for (const entry of this.entries.values()) {
      this.attachFrameSubscriptionV1(entry);
    }
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

  readonly getHemodynamicProtocolSeriesSnapshot = () =>
    this.hemodynamicProtocolSeriesSnapshot;

  readonly getPvRelationProtocolSeriesSnapshot = () => this.emptyPvSnapshot;

  get maximumScenarioCount(): number {
    return MAXIMUM_PRODUCT_SCENARIO_COUNT_V1;
  }

  getRuntime(id: string): ScientificProductStudioScenarioRuntimeV1 | null {
    return this.entries.get(id)?.runtime ?? null;
  }

  getPresentation(id: string): ScientificProductScenarioPresentationV1 | null {
    const entry = this.entries.get(id);
    const runtime = entry?.runtime;
    if (entry === undefined || runtime === null) return null;
    const snapshot = runtime.controlStore.getSnapshot();
    const metricCycle = completeLatestTransientBeatV1(snapshot.frames);
    const parameterGenerationHistory = Object.freeze(
      (snapshot.parameterGenerationHistory ?? []).map((generation) => {
        const generationCycle =
          completeLatestTransientBeatV1(generation.frames);
        return Object.freeze({
          targetGeneration: generation.targetGeneration,
          parameterEpoch: generation.parameterEpoch,
          controlStateSha256: generation.controlStateSha256,
          frames: generation.frames,
          periodicCycleFrames: generationCycle?.frames ?? null,
          cycleDurationSec: generationCycle?.durationSec ?? null,
          transientOriginAcceptedTimeSec:
            generation.displayedEvidence
              === "open-transient-no-periodic-claim"
              ? generation.liveTransitionOriginAcceptedTimeSec
                ?? generation.frames[0]?.acceptedTimeSec
                ?? null
              : null,
          displayedEvidence: generation.displayedEvidence,
        });
      }),
    );
    return Object.freeze({
      descriptor: entry.descriptor,
      frames: snapshot.frames,
      parameterGenerationHistory,
      periodicCycleFrames: null,
      cycleDurationSec: metricCycle?.durationSec ?? null,
      transientOriginAcceptedTimeSec:
        snapshot.liveTransitionOriginAcceptedTimeSec
          ?? snapshot.frames[0]?.acceptedTimeSec
          ?? null,
      validatedCycle: null,
      metricCycle,
      metricEvidence: metricCycle === null
        ? "unavailable" as const
        : "provisional-complete-transient-beat" as const,
      displayedEvidence: snapshot.provenance.displayedEvidence,
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
    const id = nextScientificProductStudioScenarioIdV1();
    const entry: ScenarioEntryV1 = {
      descriptor: createDescriptorV1(
        id,
        caseEntry,
        uniqueScenarioNameV1(
          options.name ?? caseEntry.displayName,
          [...this.entries.values()].map(({ descriptor }) => descriptor.name),
        ),
        options.color ??
          SCENARIO_COLORS_V1[this.entries.size % SCENARIO_COLORS_V1.length],
        "loading",
        "Creating a one-point Studio source…",
      ),
      runtime: null,
      loadingGeneration: 1,
      loadAbortController: new AbortController(),
      loadPromise: null,
      unsubscribeStore: null,
      unsubscribeFrames: null,
      pendingDuplicateDraft: options.duplicateDraft ?? null,
      hemodynamicAnalysisCoordinator: null,
    };
    this.entries.set(id, entry);
    this.publishDescriptorsV1();
    const generation = entry.loadingGeneration;
    const artifacts = new InMemoryContentAddressedArtifactStoreV1();
    const loadPromise = loadScientificProductStudioScenarioRuntimeV1({
      scenarioId: id,
      caseEntry,
      artifacts,
      onProgress: (progress) => {
        if (!this.entryIsCurrentV1(id, entry, generation)) return;
        entry.descriptor = Object.freeze({
          ...entry.descriptor,
          statusMessage: progress.message,
        });
        this.publishDescriptorsV1();
      },
      signal: entry.loadAbortController.signal,
      deferInitialLivePresentation: true,
    }).then(async (runtime) => {
      if (!this.entryIsCurrentV1(id, entry, generation)) {
        await runtime.controller.dispose();
        return;
      }
      entry.loadAbortController = null;
      entry.runtime = runtime;
      this.attachHemodynamicAnalysisCoordinatorV1(entry);
      entry.descriptor = Object.freeze({
        ...entry.descriptor,
        lifecycle: "ready" as const,
        statusMessage: "Studio live and strict lanes are active.",
      });
      this.attachFrameSubscriptionV1(entry);
      const duplicateDraft = entry.pendingDuplicateDraft;
      entry.pendingDuplicateDraft = null;
      if (duplicateDraft !== null) {
        applyDraftToStoreV1(runtime.controlStore, duplicateDraft);
      }
      this.publishDescriptorsV1();
      this.publishFramesV1();
    }).catch((error) => {
      if (!this.entryIsCurrentV1(id, entry, generation)) return;
      entry.loadAbortController = null;
      entry.descriptor = Object.freeze({
        ...entry.descriptor,
        lifecycle: "failed" as const,
        statusMessage: errorMessageV1(error),
      });
      this.publishDescriptorsV1();
    }).finally(() => {
      if (entry.loadPromise === loadPromise) entry.loadPromise = null;
    });
    entry.loadPromise = loadPromise;
    return id;
  }

  duplicateStable(id: string): string | null {
    const source = this.entries.get(id);
    const runtime = source?.runtime;
    if (source === undefined || runtime === null) return null;
    return this.addPreset(source.descriptor.source.caseId, {
      name: `${source.descriptor.name} copy`,
      color:
        SCENARIO_COLORS_V1[this.entries.size % SCENARIO_COLORS_V1.length],
      duplicateDraft: runtime.controlStore.getSnapshot().draft,
    });
  }

  remove(id: string): boolean {
    const entry = this.entries.get(id);
    if (
      entry === undefined
      || this.entries.size <= 1
      || this.disposed
    ) return false;
    this.entries.delete(id);
    entry.loadingGeneration += 1;
    void this.disposeEntryV1(entry);
    this.removeHemodynamicProtocolScenarioV1(id);
    for (const [demandId, demand] of this.hemodynamicProtocolDemands) {
      if (demand.scenarioId === id) {
        this.hemodynamicProtocolDemands.delete(demandId);
      }
    }
    this.publishDescriptorsV1();
    this.publishFramesV1();
    return true;
  }

  rename(id: string, name: string): void {
    const entry = this.entries.get(id);
    const trimmed = name.trim();
    if (entry === undefined || trimmed.length === 0) return;
    entry.descriptor = Object.freeze({
      ...entry.descriptor,
      name: uniqueScenarioNameV1(
        trimmed,
        [...this.entries.entries()]
          .filter(([otherId]) => otherId !== id)
          .map(([, other]) => other.descriptor.name),
      ),
    });
    this.publishDescriptorsV1();
  }

  recolor(id: string, color: string): void {
    const entry = this.entries.get(id);
    const trimmed = color.trim();
    if (entry === undefined || trimmed.length === 0) return;
    entry.descriptor = Object.freeze({
      ...entry.descriptor,
      color: trimmed,
    });
    this.publishDescriptorsV1();
  }

  toggleGlobalVisibility(id: string): void {
    const entry = this.entries.get(id);
    if (entry === undefined) return;
    entry.descriptor = Object.freeze({
      ...entry.descriptor,
      isVisible: !entry.descriptor.isVisible,
    });
    this.publishDescriptorsV1();
    this.publishFramesV1();
  }

  getStudioStatus(
    scenarioId: string,
  ): ScientificProductStudioScenarioStatusV1 | null {
    return this.entries.get(scenarioId)?.runtime?.controller.status ?? null;
  }

  async promoteStudioSteadyCandidate(scenarioId: string): Promise<void> {
    await this.entries.get(scenarioId)?.runtime?.controller
      .promoteSteadyCandidate();
  }

  async pinStudioSteadyCandidate(scenarioId: string): Promise<void> {
    await this.entries.get(scenarioId)?.runtime?.controller
      .pinSteadyCandidate();
  }

  getHemodynamicProtocolSeries(
    scenarioId: string,
    kind: ScientificProductHemodynamicProtocolKindV1,
  ): ScientificProductHemodynamicProtocolSeriesV1 {
    return getScientificHemodynamicCurveScenarioStateV1(
      this.hemodynamicProtocolSeriesSnapshot,
      protocolCacheKeyV1(scenarioId, kind),
    ) ?? EMPTY_PROTOCOL_SERIES_V1;
  }

  getPvRelationProtocolSeries(
    _scenarioId: string,
  ): ScientificProductPvRelationProtocolSeriesV1 {
    return EMPTY_PROTOCOL_SERIES_V1;
  }

  setHemodynamicProtocolDemand(
    demandId: string,
    demand: ScientificProductHemodynamicProtocolDemandV1 | null,
  ): void {
    if (this.disposed || demandId.trim().length === 0) return;
    const previous = this.hemodynamicProtocolDemands.get(demandId) ?? null;
    if (sameHemodynamicProtocolDemandV1(previous, demand)) return;
    if (demand === null) {
      this.hemodynamicProtocolDemands.delete(demandId);
    } else {
      this.hemodynamicProtocolDemands.set(
        demandId,
        Object.freeze({ ...demand }),
      );
    }
    if (previous !== null) {
      this.reconcileHemodynamicProtocolDemandV1(
        previous.scenarioId,
        previous.kind,
      );
    }
    if (
      demand !== null
      && (
        previous === null
        || protocolCacheKeyV1(previous.scenarioId, previous.kind)
          !== protocolCacheKeyV1(demand.scenarioId, demand.kind)
      )
    ) {
      this.reconcileHemodynamicProtocolDemandV1(
        demand.scenarioId,
        demand.kind,
      );
    }
  }

  setPvRelationProtocolDemand(
    _demandId: string,
    _demand: ScientificProductPvRelationProtocolDemandV1 | null,
  ): void {
    // A Studio analysis port is intentionally not emulated with a stale
    // bootstrap Worker.
  }

  dispose(): Promise<void> {
    if (this.disposePromise !== null) return this.disposePromise;
    this.disposed = true;
    this.connected = false;
    const disposals: Promise<void>[] = [];
    for (const entry of this.entries.values()) {
      disposals.push(this.disposeEntryV1(entry));
    }
    this.entries.clear();
    this.publishDescriptorsV1();
    this.publishFramesV1();
    this.descriptorListeners.clear();
    this.frameListeners.clear();
    this.protocolListeners.clear();
    this.hemodynamicProtocolDemands.clear();
    this.activeHemodynamicProtocolRequests.clear();
    this.disposePromise = Promise.all([
      ...this.disposalTasks,
      ...disposals,
    ]).then(() => undefined);
    return this.disposePromise;
  }

  private attachFrameSubscriptionV1(entry: ScenarioEntryV1): void {
    entry.unsubscribeStore?.();
    entry.unsubscribeFrames?.();
    if (!this.connected) {
      entry.unsubscribeStore = null;
      entry.unsubscribeFrames = null;
      return;
    }
    entry.unsubscribeStore = entry.runtime?.controlStore.subscribe(() => {
      this.reconcileHemodynamicProtocolDemandsForScenarioV1(
        entry.descriptor.id,
      );
    }) ?? null;
    entry.unsubscribeFrames = entry.runtime?.controlStore.subscribeFrames(
      () => this.publishFramesV1(),
    ) ?? null;
    this.reconcileHemodynamicProtocolDemandsForScenarioV1(
      entry.descriptor.id,
    );
  }

  private attachHemodynamicAnalysisCoordinatorV1(
    entry: ScenarioEntryV1,
  ): void {
    const previous = entry.hemodynamicAnalysisCoordinator;
    if (previous !== null) {
      entry.hemodynamicAnalysisCoordinator = null;
      void this.trackDisposalV1(previous.dispose()).then(() => {
        if (
          !this.disposed
          && this.entries.get(entry.descriptor.id) === entry
        ) this.attachHemodynamicAnalysisCoordinatorV1(entry);
      });
      return;
    }
    const runtime = entry.runtime;
    if (runtime === null || this.disposed) return;
    entry.hemodynamicAnalysisCoordinator =
      createScientificProductStudioHemodynamicAnalysisCoordinatorV1({
        hostOptions: Object.freeze({
          artifacts: runtime.analysisArtifacts,
          hostId: `product-studio-analysis:${entry.descriptor.id}`,
        }),
        onSnapshot: (event) => {
          if (
            !this.disposed
            && this.entries.get(entry.descriptor.id) === entry
          ) this.acceptHemodynamicSnapshotV1(event);
        },
        onError: (event) => {
          if (
            !this.disposed
            && this.entries.get(entry.descriptor.id) === entry
          ) this.acceptHemodynamicErrorV1(event);
        },
      });
  }

  private disposeEntryV1(entry: ScenarioEntryV1): Promise<void> {
    entry.loadingGeneration += 1;
    entry.loadAbortController?.abort();
    entry.loadAbortController = null;
    entry.unsubscribeStore?.();
    entry.unsubscribeStore = null;
    entry.unsubscribeFrames?.();
    entry.unsubscribeFrames = null;
    const loadPromise = entry.loadPromise;
    entry.loadPromise = null;
    const coordinator = entry.hemodynamicAnalysisCoordinator;
    entry.hemodynamicAnalysisCoordinator = null;
    const runtime = entry.runtime;
    entry.runtime = null;
    return this.trackDisposalV1(Promise.all([
      loadPromise?.catch(() => undefined) ?? Promise.resolve(),
      coordinator?.dispose().catch(() => undefined) ?? Promise.resolve(),
      runtime?.controller.dispose().catch(() => undefined)
        ?? Promise.resolve(),
    ]).then(() => undefined));
  }

  private trackDisposalV1(operation: Promise<void>): Promise<void> {
    const guarded = operation.catch(() => undefined);
    this.disposalTasks.add(guarded);
    void guarded.finally(() => this.disposalTasks.delete(guarded));
    return guarded;
  }

  private reconcileHemodynamicProtocolDemandsForScenarioV1(
    scenarioId: string,
  ): void {
    const kinds = new Set<ScientificProductHemodynamicProtocolKindV1>();
    for (const demand of this.hemodynamicProtocolDemands.values()) {
      if (demand.scenarioId === scenarioId) kinds.add(demand.kind);
    }
    const active = this.activeHemodynamicProtocolRequests.get(
      protocolCacheKeyV1(scenarioId, "guyton-starling"),
    );
    if (active !== undefined) kinds.add("guyton-starling");
    for (const kind of kinds) {
      this.reconcileHemodynamicProtocolDemandV1(scenarioId, kind);
    }
  }

  private reconcileHemodynamicProtocolDemandV1(
    scenarioId: string,
    kind: ScientificProductHemodynamicProtocolKindV1,
  ): void {
    const key = protocolCacheKeyV1(scenarioId, kind);
    const entry = this.entries.get(scenarioId);
    const coordinator = entry?.hemodynamicAnalysisCoordinator ?? null;
    const runtime = entry?.runtime ?? null;
    const modes = [...this.hemodynamicProtocolDemands.values()]
      .filter((demand) =>
        demand.scenarioId === scenarioId && demand.kind === kind
      )
      .map(({ detailMode }) => detailMode);
    if (
      modes.length === 0
      || entry === undefined
      || coordinator === null
      || runtime === null
    ) {
      this.activeHemodynamicProtocolRequests.delete(key);
      coordinator?.clearDemand();
      return;
    }
    const source = runtime.controller.settledAnalysisSource;
    if (source === null) {
      this.activeHemodynamicProtocolRequests.delete(key);
      coordinator.clearDemand();
      return;
    }
    const detailMode = effectiveHemodynamicProtocolDetailModeV1(modes);
    const sourceIdentityKey =
      studioSettledAnalysisSourceIdentityKeyV1(source);
    const calculationSource =
      hemodynamicCalculationSourceForSettledSourceV1(source.sourceRole);
    const current = this.getHemodynamicProtocolSeries(scenarioId, kind)
      .current;
    if (
      current !== null
      && current.status === "complete"
      && current.source.sourceIdentityKey === sourceIdentityKey
      && current.snapshot !== null
      && hemodynamicDetailModeSatisfiesV1(
        current.snapshot.detailMode,
        detailMode,
      )
    ) {
      this.relabelCurrentHemodynamicProtocolSourceV1(
        key,
        calculationSource,
      );
      this.activeHemodynamicProtocolRequests.delete(key);
      coordinator.clearDemand();
      return;
    }
    const active = this.activeHemodynamicProtocolRequests.get(key);
    if (
      active !== undefined
      && active.sourceIdentityKey === sourceIdentityKey
      && active.sourceRole === source.sourceRole
      && hemodynamicDetailModeSatisfiesV1(active.detailMode, detailMode)
    ) return;
    const generationId =
      `studio-hemodynamic-generation-${++hemodynamicGenerationOrdinalV1}`;
    const requestToken =
      `${generationId}:${source.snapshotRef.sha256}`;
    this.activeHemodynamicProtocolRequests.set(key, Object.freeze({
      requestToken,
      generationId,
      sourceIdentityKey,
      sourceRole: source.sourceRole,
      detailMode,
    }));
    coordinator.requestLatest(Object.freeze({
      requestToken,
      source,
      detailMode,
    }));
  }

  private acceptHemodynamicSnapshotV1(
    event: ScientificProductStudioHemodynamicAnalysisSnapshotEventV1,
  ): void {
    const key = protocolCacheKeyV1(
      event.source.scenarioId,
      "guyton-starling",
    );
    const active = this.activeHemodynamicProtocolRequests.get(key);
    if (
      active === undefined
      || active.requestToken !== event.requestToken
      || active.sourceIdentityKey
        !== studioSettledAnalysisSourceIdentityKeyV1(event.source)
    ) return;
    const sourceIdentity: ScientificProductHemodynamicProtocolSourceIdentityV1 =
      Object.freeze({
        revision: event.sourceIdentity.revision,
        acceptedTimeSec: event.sourceIdentity.acceptedTimeSec,
        totalBloodVolumeMl: event.sourceIdentity.totalBloodVolumeMl,
        parameterEpoch: event.sourceIdentity.parameterEpoch,
        controlStateSha256: event.sourceIdentity.controlStateSha256,
        calculationSource:
          event.source.sourceRole === "automatic-strict-candidate"
            ? "automatic-strict-candidate" as const
            : "visible-period1-source" as const,
      });
    const generationSource = Object.freeze({
      sourceIdentityKey: active.sourceIdentityKey,
      sourceIdentity,
      jobId: event.snapshot.jobId,
    });
    let next = startScientificHemodynamicCurveGenerationV1(
      this.hemodynamicProtocolSeriesSnapshot,
      Object.freeze({
        scenarioId: key,
        generationId: active.generationId,
        source: generationSource,
      }),
    );
    const terminalFailure =
      event.snapshot.status === "error"
      || event.snapshot.status === "cancelled";
    if (terminalFailure) {
      next = applyScientificHemodynamicCurveSnapshotV1(next, Object.freeze({
        scenarioId: key,
        generationId: active.generationId,
        source: generationSource,
        update: Object.freeze({
          kind: "error" as const,
          sequence: event.snapshot.sequence,
          errorMessage: event.snapshot.errorMessage
            ?? "Studio Guyton/Starling analysis stopped before completion.",
        }),
      }));
    } else {
      const presentation: ScientificProductHemodynamicProtocolPresentationV1 =
        Object.freeze({
          kind: "guyton-starling" as const,
          detailMode: event.detailMode,
          status: event.snapshot.status === "complete"
            ? "complete" as const
            : "running" as const,
          calculationSource:
            event.source.sourceRole === "automatic-strict-candidate"
              ? "automatic-strict-candidate" as const
              : "visible-period1-source" as const,
          sourceIdentity,
          result: event.snapshot.result,
          jobSnapshot: event.snapshot,
          errorMessage: null,
        });
      next = applyScientificHemodynamicCurveSnapshotV1(next, Object.freeze({
        scenarioId: key,
        generationId: active.generationId,
        source: generationSource,
        update: Object.freeze({
          kind: "snapshot" as const,
          sequence: event.snapshot.sequence,
          status: event.snapshot.status === "complete"
            ? "complete" as const
            : "running" as const,
          snapshot: presentation,
          renderable: isRenderableHemodynamicJobSnapshotV1(event.snapshot),
        }),
      }));
    }
    if (next !== this.hemodynamicProtocolSeriesSnapshot) {
      this.hemodynamicProtocolSeriesSnapshot = next;
      this.publishHemodynamicProtocolsV1();
    }
    if (event.snapshot.status !== "running") {
      this.activeHemodynamicProtocolRequests.delete(key);
      this.entries.get(event.source.scenarioId)
        ?.hemodynamicAnalysisCoordinator?.clearDemand();
    }
  }

  private acceptHemodynamicErrorV1(
    event: ScientificProductStudioHemodynamicAnalysisErrorEventV1,
  ): void {
    const key = protocolCacheKeyV1(
      event.source.scenarioId,
      "guyton-starling",
    );
    const active = this.activeHemodynamicProtocolRequests.get(key);
    if (
      active === undefined
      || active.requestToken !== event.requestToken
    ) return;
    const series = this.getHemodynamicProtocolSeries(
      event.source.scenarioId,
      "guyton-starling",
    );
    const generation = series.pending?.generationId === active.generationId
      ? series.pending
      : series.current?.generationId === active.generationId
        ? series.current
        : null;
    if (generation !== null) {
      const next = applyScientificHemodynamicCurveSnapshotV1(
        this.hemodynamicProtocolSeriesSnapshot,
        Object.freeze({
          scenarioId: key,
          generationId: active.generationId,
          source: generation.source,
          update: Object.freeze({
            kind: "error" as const,
            sequence: generation.sequence + 1,
            errorMessage: event.message,
          }),
        }),
      );
      if (next !== this.hemodynamicProtocolSeriesSnapshot) {
        this.hemodynamicProtocolSeriesSnapshot = next;
        this.publishHemodynamicProtocolsV1();
      }
    } else {
      const next = recordScientificHemodynamicCurveAcquisitionFailureV1(
        this.hemodynamicProtocolSeriesSnapshot,
        Object.freeze({
          scenarioId: key,
          generationId: active.generationId,
          sequence: 0,
          errorMessage: event.message,
        }),
      );
      if (next !== this.hemodynamicProtocolSeriesSnapshot) {
        this.hemodynamicProtocolSeriesSnapshot = next;
        this.publishHemodynamicProtocolsV1();
      }
    }
    this.activeHemodynamicProtocolRequests.delete(key);
    this.entries.get(event.source.scenarioId)
      ?.hemodynamicAnalysisCoordinator?.clearDemand();
  }

  private removeHemodynamicProtocolScenarioV1(scenarioId: string): void {
    const key = protocolCacheKeyV1(scenarioId, "guyton-starling");
    this.activeHemodynamicProtocolRequests.delete(key);
    if (!(key in this.hemodynamicProtocolSeriesSnapshot.scenarios)) return;
    const { [key]: _removed, ...scenarios } =
      this.hemodynamicProtocolSeriesSnapshot.scenarios;
    this.hemodynamicProtocolSeriesSnapshot = Object.freeze({
      historyLimit: this.hemodynamicProtocolSeriesSnapshot.historyLimit,
      scenarios: Object.freeze(scenarios),
    });
    this.publishHemodynamicProtocolsV1();
  }

  private relabelCurrentHemodynamicProtocolSourceV1(
    key: string,
    calculationSource:
      ScientificProductHemodynamicProtocolPresentationV1["calculationSource"],
  ): void {
    if (calculationSource === null) return;
    const scenario = this.hemodynamicProtocolSeriesSnapshot.scenarios[key];
    const current = scenario?.current ?? null;
    if (
      scenario === undefined
      || current === null
      || current.snapshot === null
      || current.snapshot.calculationSource === calculationSource
    ) return;
    const sourceIdentity = Object.freeze({
      ...current.source.sourceIdentity,
      calculationSource,
    });
    const nextCurrent = Object.freeze({
      ...current,
      source: Object.freeze({
        ...current.source,
        sourceIdentity,
      }),
      snapshot: Object.freeze({
        ...current.snapshot,
        calculationSource,
        sourceIdentity,
      }),
    });
    this.hemodynamicProtocolSeriesSnapshot = Object.freeze({
      historyLimit: this.hemodynamicProtocolSeriesSnapshot.historyLimit,
      scenarios: Object.freeze({
        ...this.hemodynamicProtocolSeriesSnapshot.scenarios,
        [key]: Object.freeze({
          ...scenario,
          current: nextCurrent,
        }),
      }),
    });
    this.publishHemodynamicProtocolsV1();
  }

  private publishHemodynamicProtocolsV1(): void {
    for (const listener of [...this.protocolListeners]) listener();
  }

  private entryIsCurrentV1(
    id: string,
    entry: ScenarioEntryV1,
    generation: number,
  ): boolean {
    return !this.disposed
      && this.entries.get(id) === entry
      && entry.loadingGeneration === generation;
  }

  private publishDescriptorsV1(): void {
    this.descriptorSnapshot = Object.freeze(
      [...this.entries.values()].map(({ descriptor }) => descriptor),
    );
    for (const listener of [...this.descriptorListeners]) listener();
  }

  private publishFramesV1(): void {
    this.frameVersion += 1;
    for (const listener of [...this.frameListeners]) listener();
  }
}

function protocolCacheKeyV1(
  scenarioId: string,
  kind: ScientificProductHemodynamicProtocolKindV1,
): string {
  return `${scenarioId}:${kind}`;
}

function sameHemodynamicProtocolDemandV1(
  left: ScientificProductHemodynamicProtocolDemandV1 | null,
  right: ScientificProductHemodynamicProtocolDemandV1 | null,
): boolean {
  return left === right || (
    left !== null
    && right !== null
    && left.scenarioId === right.scenarioId
    && left.kind === right.kind
    && left.detailMode === right.detailMode
  );
}

function effectiveHemodynamicProtocolDetailModeV1(
  modes: readonly ScientificProductHemodynamicProtocolDemandV1[
    "detailMode"
  ][],
): ScientificProductHemodynamicProtocolDemandV1["detailMode"] {
  const hasStandard = modes.includes("standard");
  const hasSettledReference = modes.includes("settled-reference");
  if (
    modes.includes("compare")
    || (hasStandard && hasSettledReference)
  ) return "compare";
  return hasSettledReference ? "settled-reference" : "standard";
}

function hemodynamicDetailModeSatisfiesV1(
  available: ScientificProductHemodynamicProtocolDemandV1["detailMode"],
  requested: ScientificProductHemodynamicProtocolDemandV1["detailMode"],
): boolean {
  return available === requested || available === "compare";
}

function hemodynamicCalculationSourceForSettledSourceV1(
  sourceRole: StudioSettledAnalysisSourceV1["sourceRole"],
): ScientificProductHemodynamicProtocolSourceIdentityV1[
  "calculationSource"
] {
  return sourceRole === "automatic-strict-candidate"
    ? "automatic-strict-candidate"
    : "visible-period1-source";
}

function isRenderableHemodynamicJobSnapshotV1(
  snapshot: MainWireScientificHemodynamicJobSnapshotV2,
): boolean {
  const vascularPointCount = Math.max(
    snapshot.rightVascularFunction?.points?.length ?? 0,
    snapshot.leftVascularFunction?.points?.length ?? 0,
  );
  const previewPointCount = snapshot.fastPreloadPreview?.evidence.filter(
    (evidence) => evidence.evidenceClass !== "failure"
      && evidence.eligibility.hemodynamicPreview,
  ).length ?? snapshot.progress.fastPreviewCompletedPointCount ?? 0;
  return vascularPointCount >= 2 || previewPointCount >= 2;
}

function createDescriptorV1(
  id: string,
  caseEntry: ScientificProductCaseV1,
  name: string,
  color: string,
  lifecycle: ScientificProductScenarioDescriptorV1["lifecycle"],
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

function applyDraftToStoreV1(
  store: ScientificWorkbenchResearchControlStoreV0,
  draft: ScientificWorkbenchResearchControlDraftV0,
): void {
  store.actions.setSystemicScale(draft.systemic);
  store.actions.setPulmonaryScale(draft.pulmonary);
  store.actions.setControlValue("circulation.venous-tone", draft.venousTone);
  store.actions.setControlValue(
    "circulation.arterial-stiffness",
    draft.arterialStiffness,
  );
  store.actions.setControlValue("ventilation.peep-cm-h2o", draft.peepCmH2O);
  store.actions.setControlValue(
    "pericardium.prescribed-fluid-volume-ml",
    draft.pericardialFluidVolumeMl,
  );
  store.actions.applyTransition();
}

function completeLatestTransientBeatV1(
  frames: readonly MainWireScientificObservableFrameV1[],
): MainWireScientificCompleteTransientBeatV1 | null {
  if (frames.length < 501) return null;
  const beat = frames.slice(-501);
  const first = beat[0]!;
  const last = beat.at(-1)!;
  if (
    first.source !== "accepted-step"
    || last.source !== "accepted-step"
    || Math.abs(last.acceptedTimeSec - first.acceptedTimeSec - 1) > 1e-10
  ) return null;
  for (let index = 1; index < beat.length; index += 1) {
    const previous = beat[index - 1]!;
    const current = beat[index]!;
    if (
      current.source !== "accepted-step"
      || current.revision !== previous.revision + 1
      || Math.abs(current.acceptedTimeSec - previous.acceptedTimeSec - 0.002)
        > 1e-10
      || !sameSimulationReleaseRef(first.releaseRef, current.releaseRef)
    ) return null;
  }
  return Object.freeze({
    frames: Object.freeze(beat),
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

function uniqueScenarioNameV1(
  requested: string,
  existing: readonly string[],
): string {
  const base = requested.trim() || "Scenario";
  const names = new Set(existing);
  if (!names.has(base)) return base;
  for (let ordinal = 2; ordinal < 10_000; ordinal += 1) {
    const candidate = `${base} ${ordinal}`;
    if (!names.has(candidate)) return candidate;
  }
  return `${base} ${Date.now()}`;
}

function errorMessageV1(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
