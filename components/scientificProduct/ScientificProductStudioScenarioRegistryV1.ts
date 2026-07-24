import {
  createScientificHemodynamicCurveHistoryStateV1,
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

import {
  bootstrapScientificProductStudioSourceV1,
  type ScientificProductStudioBootstrapProgressV1,
} from "./ScientificProductStudioBootstrapV1";
import {
  ScientificProductStudioScenarioControllerV1,
  type ScientificProductStudioScenarioStatusV1,
} from "./ScientificProductStudioScenarioControllerV1";
import type {
  ScientificProductRuntimeRegistryPortV1,
} from "./ScientificProductRuntimeRegistryPortV1";
import type {
  AddScientificScenarioOptionsV1,
  ScientificProductHemodynamicProtocolDemandV1,
  ScientificProductHemodynamicProtocolKindV1,
  ScientificProductHemodynamicProtocolSeriesSnapshotV1,
  ScientificProductHemodynamicProtocolSeriesV1,
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

export type ScientificProductStudioScenarioRuntimeV1 = Readonly<{
  scenarioId: string;
  caseEntry: ScientificProductCaseV1;
  workspaceDocument:
    ScientificProductScenarioPresentationV1["workspaceDocument"];
  controlStore: ScientificWorkbenchResearchControlStoreV0;
  controller: ScientificProductStudioScenarioControllerV1;
}>;

type ScenarioEntryV1 = {
  descriptor: ScientificProductScenarioDescriptorV1;
  runtime: ScientificProductStudioScenarioRuntimeV1 | null;
  loadingGeneration: number;
  loadAbortController: AbortController | null;
  unsubscribeFrames: (() => void) | null;
  pendingDuplicateDraft: ScientificWorkbenchResearchControlDraftV0 | null;
};

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
    guytonLoadSeries: false,
    pvRelations: false,
    vvReports: false,
  });
  private readonly entries = new Map<string, ScenarioEntryV1>();
  private readonly descriptorListeners = new Set<() => void>();
  private readonly frameListeners = new Set<() => void>();
  private descriptorSnapshot: readonly ScientificProductScenarioDescriptorV1[] =
    Object.freeze([]);
  private frameVersion = 0;
  private connected = false;
  private disposed = false;
  private readonly emptyHemodynamicSnapshot:
    ScientificProductHemodynamicProtocolSeriesSnapshotV1 =
      createScientificHemodynamicCurveHistoryStateV1();
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
      unsubscribeFrames: null,
      pendingDuplicateDraft: null,
    };
    this.entries.set(descriptor.id, entry);
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
    _listener: () => void,
  ): (() => void) => () => undefined;

  readonly getHemodynamicProtocolSeriesSnapshot = () =>
    this.emptyHemodynamicSnapshot;

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
    return Object.freeze({
      descriptor: entry.descriptor,
      frames: snapshot.frames,
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
      unsubscribeFrames: null,
      pendingDuplicateDraft: options.duplicateDraft ?? null,
    };
    this.entries.set(id, entry);
    this.publishDescriptorsV1();
    const generation = entry.loadingGeneration;
    const artifacts = new InMemoryContentAddressedArtifactStoreV1();
    void loadScientificProductStudioScenarioRuntimeV1({
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
    }).then((runtime) => {
      if (!this.entryIsCurrentV1(id, entry, generation)) {
        void runtime.controller.dispose();
        return;
      }
      entry.loadAbortController = null;
      entry.runtime = runtime;
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
    });
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
    entry.loadAbortController?.abort();
    entry.loadAbortController = null;
    entry.unsubscribeFrames?.();
    if (entry.runtime !== null) void entry.runtime.controller.dispose();
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
    _scenarioId: string,
    _kind: ScientificProductHemodynamicProtocolKindV1,
  ): ScientificProductHemodynamicProtocolSeriesV1 {
    return EMPTY_PROTOCOL_SERIES_V1;
  }

  getPvRelationProtocolSeries(
    _scenarioId: string,
  ): ScientificProductPvRelationProtocolSeriesV1 {
    return EMPTY_PROTOCOL_SERIES_V1;
  }

  setHemodynamicProtocolDemand(
    _demandId: string,
    _demand: ScientificProductHemodynamicProtocolDemandV1 | null,
  ): void {
    // A Studio analysis port is intentionally not emulated with a stale
    // bootstrap Worker.
  }

  setPvRelationProtocolDemand(
    _demandId: string,
    _demand: ScientificProductPvRelationProtocolDemandV1 | null,
  ): void {
    // A Studio analysis port is intentionally not emulated with a stale
    // bootstrap Worker.
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.connected = false;
    for (const entry of this.entries.values()) {
      entry.loadingGeneration += 1;
      entry.loadAbortController?.abort();
      entry.loadAbortController = null;
      entry.unsubscribeFrames?.();
      if (entry.runtime !== null) void entry.runtime.controller.dispose();
    }
    this.entries.clear();
    this.publishDescriptorsV1();
    this.publishFramesV1();
    this.descriptorListeners.clear();
    this.frameListeners.clear();
  }

  private attachFrameSubscriptionV1(entry: ScenarioEntryV1): void {
    entry.unsubscribeFrames?.();
    if (!this.connected) {
      entry.unsubscribeFrames = null;
      return;
    }
    entry.unsubscribeFrames = entry.runtime?.controlStore.subscribeFrames(
      () => this.publishFramesV1(),
    ) ?? null;
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
