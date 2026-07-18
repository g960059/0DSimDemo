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
  MainWireScientificValidatedTerminalCycleV1,
} from "@/engine/scientific/metrics";
import type {
  MainWireScientificResearchControlScaleV0,
} from "@/engine/scientific/controls/MainWireScientificResearchControlCatalogV0";
import {
  MainWireScientificWorkerClientV1,
} from "@/engine/scientificBrowser";

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
  displayedEvidence: ScientificWorkbenchDisplayedEvidenceV0;
  workspaceDocument: MainWireScientificWorkspaceDocumentV1;
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

/**
 * Owns one isolated Worker and one control state machine per scenario. Mutable
 * Worker/store handles never enter the serializable Workbench document.
 */
export class ScientificProductScenarioRegistryV1 {
  private readonly entries = new Map<string, ScenarioEntryV1>();
  private readonly descriptorListeners = new Set<() => void>();
  private readonly frameListeners = new Set<() => void>();
  private descriptorSnapshot: readonly ScientificProductScenarioDescriptorV1[] = [];
  private frameVersion = 0;
  private disposed = false;

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
    return Object.freeze({
      descriptor: entry.descriptor,
      frames: snapshot.frames,
      periodicCycleFrames: validatedCycle?.frames ?? null,
      cycleDurationSec: validatedCycle?.durationSec ?? null,
      transientOriginAcceptedTimeSec:
        displayedEvidence === "open-transient-no-periodic-claim"
          ? snapshot.candidate?.boundaryFrame.acceptedTimeSec
            ?? snapshot.frames[0]?.acceptedTimeSec
            ?? null
          : null,
      validatedCycle,
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
    if (draft.systemic === systemic && draft.pulmonary === pulmonary) return;
    runtime.controlStore.actions.setSystemicScale(draft.systemic);
    runtime.controlStore.actions.setPulmonaryScale(draft.pulmonary);
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
    maximumPendingRequestCount: 1,
    maximumRequestCountPerClientLifetime: SCIENTIFIC_WORKBENCH_REQUEST_CAPACITY_V0,
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
  const first = frames[0];
  const last = frames.at(-1);
  if (first === undefined || last === undefined || frames.length !== 501) return null;
  const durationSec = last.acceptedTimeSec - first.acceptedTimeSec;
  if (!Number.isFinite(durationSec) || Math.abs(durationSec - 1) > 1e-10) {
    return null;
  }
  return Object.freeze({
    frames,
    releaseRef: first.releaseRef,
    durationSec,
    evidence: Object.freeze({
      exactReleaseRefUniform: true as const,
      revisionsContiguous: true as const,
      cadenceUniform: true as const,
      bothCycleBoundariesRetained: true as const,
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
  return value === 0.75 || value === 1 || value === 4 / 3;
}
