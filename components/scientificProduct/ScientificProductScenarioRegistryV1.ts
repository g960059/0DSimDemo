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
import type {
  RuntimePresentationBeatEstimateV1,
} from "@/studio/contracts/v1";
import {
  MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_SCALE_VALUES_V0,
  MainWireScientificResearchControlScaleV0,
} from "@/engine/scientific/controls/MainWireScientificResearchControlCatalogV0";
import type {
  MainWireScientificResearchControlTargetStateV0,
} from "@/engine/scientific/controls/MainWireScientificResearchControlTargetStateV0";
import {
  MainWireScientificWorkerClientV1,
} from "@/engine/scientificBrowser";
import { sameSimulationReleaseRef } from "@/engine/scientific/release";
import {
  SCIENTIFIC_COMMAND_PROTOCOL_V1_ID,
} from "@/engine/scientific/worker/scientificCommandProtocolV1";
import type {
  MainWireScientificGuytonStarlingProtocolResultV1,
} from "@/engine/scientific/protocols/MainWireScientificHemodynamicProtocolV1";
import type {
  MainWireScientificHemodynamicCalculationDetailV2,
  MainWireScientificGuytonStarlingProtocolResultV2,
  MainWireScientificHemodynamicJobSnapshotV2,
} from "@/engine/scientific/protocols/MainWireScientificHemodynamicJobV2";
import type {
  MainWireScientificPvRelationJobSnapshotV1,
} from "@/engine/scientific/protocols/MainWireScientificPvRelationJobV1";
import type {
  MainWireScientificPvRelationsProtocolResultV2,
} from "@/engine/scientific/protocols/MainWireScientificPvRelationsProtocolV2";
import type {
  MainWireScientificPvRelationsProtocolResultV3,
} from "@/engine/scientific/protocols/MainWireScientificPvRelationsProtocolV3";
import {
  MAIN_WIRE_SCIENTIFIC_PV_RELATIONS_PROTOCOL_V3_CACHE_IDENTITY,
} from "@/engine/scientific/protocols/MainWireScientificPvRelationsProtocolV3";

import {
  applyScientificHemodynamicCurveSnapshotV1,
  createScientificHemodynamicCurveHistoryStateV1,
  getScientificHemodynamicCurveScenarioStateV1,
  startScientificHemodynamicCurveGenerationV1,
  type ScientificHemodynamicCurveGenerationSourceV1,
  type ScientificHemodynamicCurveGenerationV1,
  type ScientificHemodynamicCurveHistoryStateV1,
  type ScientificHemodynamicCurveScenarioStateV1,
} from "./ScientificHemodynamicCurveHistoryStateV1";
import {
  SCIENTIFIC_PRODUCT_HEMODYNAMIC_ANALYSIS_PROVENANCE_V1,
  ScientificProductHemodynamicAnalysisCoordinatorV1,
  type ScientificProductHemodynamicAnalysisErrorEventV1,
  type ScientificProductHemodynamicAnalysisSnapshotEventV1,
} from "./ScientificProductHemodynamicAnalysisCoordinatorV1";
import {
  SCIENTIFIC_PRODUCT_PV_RELATION_ANALYSIS_PROVENANCE_V1,
  ScientificProductPvRelationAnalysisCoordinatorV1,
  type ScientificProductPvRelationAnalysisErrorEventV1,
  type ScientificProductPvRelationAnalysisSnapshotEventV1,
} from "./ScientificProductPvRelationAnalysisCoordinatorV1";

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

export type ScientificProductParameterGenerationPresentationV1 = Readonly<{
  targetGeneration: number;
  parameterEpoch: number;
  controlStateSha256: string;
  frames: readonly MainWireScientificObservableFrameV1[];
  presentationBeatEstimate: RuntimePresentationBeatEstimateV1 | null;
  periodicCycleFrames: readonly MainWireScientificObservableFrameV1[] | null;
  cycleDurationSec: number | null;
  transientOriginAcceptedTimeSec: number | null;
  displayedEvidence: ScientificWorkbenchDisplayedEvidenceV0;
}>;

export type ScientificProductScenarioPresentationV1 = Readonly<{
  descriptor: ScientificProductScenarioDescriptorV1;
  frames: readonly MainWireScientificObservableFrameV1[];
  parameterGenerationHistory:
    readonly ScientificProductParameterGenerationPresentationV1[];
  periodicCycleFrames: readonly MainWireScientificObservableFrameV1[] | null;
  cycleDurationSec: number | null;
  transientOriginAcceptedTimeSec: number | null;
  validatedCycle: MainWireScientificValidatedTerminalCycleV1 | null;
  metricCycle: MainWireScientificMetricCycleV1 | null;
  presentationBeatEstimate: RuntimePresentationBeatEstimateV1 | null;
  metricEvidence:
    | "validated-periodic-P1"
    | "retained-periodic-source"
    | "provisional-complete-transient-beat"
    | "presentation-beat-estimate"
    | "unavailable";
  displayedEvidence: ScientificWorkbenchDisplayedEvidenceV0;
  workspaceDocument: MainWireScientificWorkspaceDocumentV1;
}>;

export type ScientificProductHemodynamicProtocolKindV1 = "guyton-starling";

export type ScientificProductHemodynamicProtocolDetailModeV1 =
  MainWireScientificHemodynamicCalculationDetailV2;

export type ScientificProductHemodynamicProtocolCalculationSourceV1 =
  | "visible-period1-source"
  | "automatic-strict-candidate"
  | typeof SCIENTIFIC_PRODUCT_HEMODYNAMIC_ANALYSIS_PROVENANCE_V1;

export type ScientificProductHemodynamicProtocolSourceIdentityV1 = Readonly<{
  revision: number;
  acceptedTimeSec: number;
  totalBloodVolumeMl: number;
  parameterEpoch: number;
  controlStateSha256: string;
  calculationSource: ScientificProductHemodynamicProtocolCalculationSourceV1;
}>;

export type ScientificProductHemodynamicProtocolPresentationV1 = Readonly<{
  kind: ScientificProductHemodynamicProtocolKindV1;
  detailMode: ScientificProductHemodynamicProtocolDetailModeV1;
  status: "idle" | "running" | "complete" | "error";
  calculationSource:
    | ScientificProductHemodynamicProtocolCalculationSourceV1
    | null;
  sourceIdentity: ScientificProductHemodynamicProtocolSourceIdentityV1 | null;
  result:
    | MainWireScientificGuytonStarlingProtocolResultV1
    | MainWireScientificGuytonStarlingProtocolResultV2
    | null;
  jobSnapshot: MainWireScientificHemodynamicJobSnapshotV2 | null;
  errorMessage: string | null;
}>;

export type ScientificProductHemodynamicProtocolGenerationV1 =
  ScientificHemodynamicCurveGenerationV1<
    ScientificProductHemodynamicProtocolSourceIdentityV1,
    ScientificProductHemodynamicProtocolPresentationV1
  >;

export type ScientificProductHemodynamicProtocolSeriesV1 =
  ScientificHemodynamicCurveScenarioStateV1<
    ScientificProductHemodynamicProtocolSourceIdentityV1,
    ScientificProductHemodynamicProtocolPresentationV1
  >;

export type ScientificProductHemodynamicProtocolSeriesSnapshotV1 =
  ScientificHemodynamicCurveHistoryStateV1<
    ScientificProductHemodynamicProtocolSourceIdentityV1,
    ScientificProductHemodynamicProtocolPresentationV1
  >;

export type ScientificProductHemodynamicProtocolDemandV1 = Readonly<{
  scenarioId: string;
  kind: ScientificProductHemodynamicProtocolKindV1;
  detailMode: ScientificProductHemodynamicProtocolDetailModeV1;
}>;

export type ScientificProductPvRelationProtocolPresentationV1 = Readonly<{
  kind: "pv-relations";
  status: "idle" | "running" | "complete" | "error";
  calculationSource:
    | ScientificProductHemodynamicProtocolCalculationSourceV1
    | null;
  sourceIdentity: ScientificProductHemodynamicProtocolSourceIdentityV1 | null;
  result: MainWireScientificPvRelationsProtocolResultV2 | null;
  researchResultV3?: MainWireScientificPvRelationsProtocolResultV3 | null;
  jobSnapshot: MainWireScientificPvRelationJobSnapshotV1 | null;
  errorMessage: string | null;
}>;

export type ScientificProductPvRelationProtocolSeriesV1 =
  ScientificHemodynamicCurveScenarioStateV1<
    ScientificProductHemodynamicProtocolSourceIdentityV1,
    ScientificProductPvRelationProtocolPresentationV1
  >;

export type ScientificProductPvRelationProtocolSeriesSnapshotV1 =
  ScientificHemodynamicCurveHistoryStateV1<
    ScientificProductHemodynamicProtocolSourceIdentityV1,
    ScientificProductPvRelationProtocolPresentationV1
  >;

export type ScientificProductPvRelationProtocolDemandV1 = Readonly<{
  scenarioId: string;
}>;

type ActivePvRelationProtocolRequestV1 = Readonly<{
  generationId: string;
  calculationSource: ScientificProductHemodynamicProtocolCalculationSourceV1;
  sessionId: string | null;
  source: ScientificHemodynamicCurveGenerationSourceV1<
    ScientificProductHemodynamicProtocolSourceIdentityV1
  >;
}>;

type ActiveHemodynamicProtocolRequestV1 = Readonly<{
  generationId: string;
  detailMode: ScientificProductHemodynamicProtocolDetailModeV1;
  calculationSource: ScientificProductHemodynamicProtocolCalculationSourceV1;
  sessionId: string | null;
  source: ScientificHemodynamicCurveGenerationSourceV1<
    ScientificProductHemodynamicProtocolSourceIdentityV1
  >;
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
  hemodynamicAnalysisCoordinator:
    | ScientificProductHemodynamicAnalysisCoordinatorV1
    | null;
  pvRelationAnalysisCoordinator:
    | ScientificProductPvRelationAnalysisCoordinatorV1
    | null;
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
let hemodynamicProtocolGenerationOrdinalV1 = 0;
let pvRelationProtocolRequestOrdinalV1 = 0;
let pvRelationProtocolGenerationOrdinalV1 = 0;
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
  private readonly activeHemodynamicProtocolRequests = new Map<
    string,
    ActiveHemodynamicProtocolRequestV1
  >();
  private readonly hemodynamicProtocolDemands = new Map<
    string,
    ScientificProductHemodynamicProtocolDemandV1
  >();
  private hemodynamicProtocolSeriesSnapshot:
    ScientificProductHemodynamicProtocolSeriesSnapshotV1 =
      createScientificHemodynamicCurveHistoryStateV1();
  private readonly hemodynamicProtocolPollTimers = new Map<
    string,
    ReturnType<typeof setTimeout>
  >();
  private readonly hemodynamicProtocolStopTimers = new Map<
    string,
    ReturnType<typeof setTimeout>
  >();
  private readonly pvRelationProtocols = new Map<
    string,
    ScientificProductPvRelationProtocolPresentationV1
  >();
  private readonly activePvRelationProtocolRequests = new Map<
    string,
    ActivePvRelationProtocolRequestV1
  >();
  private readonly pvRelationProtocolDemands = new Map<
    string,
    ScientificProductPvRelationProtocolDemandV1
  >();
  private pvRelationProtocolSeriesSnapshot:
    ScientificProductPvRelationProtocolSeriesSnapshotV1 =
      createScientificHemodynamicCurveHistoryStateV1();
  private readonly pvRelationProtocolPollTimers = new Map<
    string,
    ReturnType<typeof setTimeout>
  >();
  private readonly pvRelationProtocolStopTimers = new Map<
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
      hemodynamicAnalysisCoordinator: null,
      pvRelationAnalysisCoordinator: null,
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

  /**
   * One immutable snapshot for all scenarios. React consumers can subscribe
   * once with `subscribeHemodynamicProtocols` and derive every visible series
   * without a variable number of hooks.
   */
  readonly getHemodynamicProtocolSeriesSnapshot = () =>
    this.hemodynamicProtocolSeriesSnapshot;

  getHemodynamicProtocolSeries(
    scenarioId: string,
    kind: ScientificProductHemodynamicProtocolKindV1,
  ): ScientificProductHemodynamicProtocolSeriesV1 {
    return getScientificHemodynamicCurveScenarioStateV1(
      this.hemodynamicProtocolSeriesSnapshot,
      protocolCacheKey(scenarioId, kind),
    ) ?? EMPTY_HEMODYNAMIC_PROTOCOL_SERIES_V1;
  }

  /**
   * Registers one pane's calculation demand. All panes for a scenario share a
   * single job: compare wins, and standard + settled-reference also resolves
   * to compare. Passing null removes the demand and cancels work when no pane
   * needs the protocol anymore.
   */
  setHemodynamicProtocolDemand(
    demandId: string,
    demand: ScientificProductHemodynamicProtocolDemandV1 | null,
  ): void {
    if (this.disposed || demandId.trim().length === 0) return;
    const previous = this.hemodynamicProtocolDemands.get(demandId) ?? null;
    if (sameHemodynamicProtocolDemand(previous, demand)) return;
    if (demand === null) {
      this.hemodynamicProtocolDemands.delete(demandId);
    } else {
      this.hemodynamicProtocolDemands.set(demandId, Object.freeze({ ...demand }));
    }
    if (previous !== null) this.reconcileHemodynamicProtocolDemands(previous);
    if (
      demand !== null
      && (previous === null
        || protocolCacheKey(previous.scenarioId, previous.kind)
          !== protocolCacheKey(demand.scenarioId, demand.kind))
    ) {
      this.reconcileHemodynamicProtocolDemands(demand);
    }
  }

  getHemodynamicProtocol(
    scenarioId: string,
    kind: ScientificProductHemodynamicProtocolKindV1,
  ): ScientificProductHemodynamicProtocolPresentationV1 {
    return this.hemodynamicProtocols.get(protocolCacheKey(scenarioId, kind))
      ?? EMPTY_HEMODYNAMIC_PROTOCOL_PRESENTATIONS_V1[kind];
  }

  /**
   * A PV-loop pane registers this demand only while its relation overlay is
   * enabled. The source scenario Worker stays interactive; the expensive
   * fixed-TBV protocol runs in its dedicated nested Worker.
   */
  setPvRelationProtocolDemand(
    demandId: string,
    demand: ScientificProductPvRelationProtocolDemandV1 | null,
  ): void {
    if (this.disposed || demandId.trim().length === 0) return;
    const previous = this.pvRelationProtocolDemands.get(demandId) ?? null;
    if (previous?.scenarioId === demand?.scenarioId) return;
    if (demand === null) this.pvRelationProtocolDemands.delete(demandId);
    else this.pvRelationProtocolDemands.set(
      demandId,
      Object.freeze({ ...demand }),
    );
    if (previous !== null) {
      this.reconcilePvRelationProtocolDemand(previous.scenarioId);
    }
    if (demand !== null && previous?.scenarioId !== demand.scenarioId) {
      this.reconcilePvRelationProtocolDemand(demand.scenarioId);
    }
  }

  readonly getPvRelationProtocolSeriesSnapshot = () =>
    this.pvRelationProtocolSeriesSnapshot;

  getPvRelationProtocolSeries(
    scenarioId: string,
  ): ScientificProductPvRelationProtocolSeriesV1 {
    return getScientificHemodynamicCurveScenarioStateV1(
      this.pvRelationProtocolSeriesSnapshot,
      scenarioId,
    ) ?? EMPTY_PV_RELATION_PROTOCOL_SERIES_V1;
  }

  getPvRelationProtocol(
    scenarioId: string,
  ): ScientificProductPvRelationProtocolPresentationV1 {
    return this.pvRelationProtocols.get(scenarioId)
      ?? EMPTY_PV_RELATION_PROTOCOL_PRESENTATION_V1;
  }

  requestPvRelationProtocol(scenarioId: string): void {
    const entry = this.entries.get(scenarioId);
    const runtime = entry?.runtime;
    if (entry === undefined || runtime === null || this.disposed) return;
    this.clearPvRelationProtocolStopTimer(scenarioId);
    const snapshot = runtime.controlStore.getSnapshot();
    if (
      snapshot.provenance.displayedEvidence
        === "open-transient-no-periodic-claim"
    ) {
      const candidate = snapshot.candidate;
      if (
        candidate === null
        || snapshot.targetControlStateSha256 === null
        || candidate.context.controlState.targetStateSha256
          !== snapshot.targetControlStateSha256
      ) return;
      this.requestHiddenPvRelationProtocol({
        scenarioId,
        entry,
        sourceIdentity: protocolSourceIdentityFromLiveCandidate(candidate),
        targetControlState: candidate.context.controlState,
      });
      return;
    }
    this.requestVisiblePvRelationProtocol({
      scenarioId,
      entry,
      runtime,
      source: snapshot.source,
    });
  }

  private requestVisiblePvRelationProtocol(input: Readonly<{
    scenarioId: string;
    entry: ScenarioEntryV1;
    runtime: ScientificProductScenarioRuntimeV1;
    source: ScientificWorkbenchResearchControlSourceV0;
  }>): void {
    const sourceIdentity = protocolSourceIdentityFromSource(input.source);
    const current = this.pvRelationProtocols.get(input.scenarioId);
    if (
      (current?.status === "running" || current?.status === "complete")
      && samePvRelationParameterSourceV1(
        input.entry.descriptor,
        current.sourceIdentity,
        sourceIdentity,
      )
    ) return;
    this.retirePvRelationRequestForRouteChange(
      input.scenarioId,
      input.entry,
      "visible-period1-source",
    );
    this.disposePvRelationAnalysisCoordinator(input.entry);
    this.clearPvRelationProtocolPollTimer(input.scenarioId);
    const generation = input.entry.generation;
    const activeRequest = this.beginPvRelationProtocolGeneration({
      scenarioId: input.scenarioId,
      descriptor: input.entry.descriptor,
      sourceIdentity,
      calculationSource: "visible-period1-source",
      sessionId: input.source.sessionId,
    });
    this.startPvRelationJob({
      scenarioId: input.scenarioId,
      entry: input.entry,
      runtime: input.runtime,
      sessionId: input.source.sessionId,
      generation,
      sourceIdentity,
      activeRequest,
    });
  }

  private requestHiddenPvRelationProtocol(input: Readonly<{
    scenarioId: string;
    entry: ScenarioEntryV1;
    sourceIdentity: ScientificProductHemodynamicProtocolSourceIdentityV1;
    targetControlState: MainWireScientificResearchControlTargetStateV0;
  }>): void {
    const current = this.pvRelationProtocols.get(input.scenarioId);
    if (
      current?.calculationSource
        === SCIENTIFIC_PRODUCT_PV_RELATION_ANALYSIS_PROVENANCE_V1
      && (current.status === "running" || current.status === "complete")
      && samePvRelationParameterSourceV1(
        input.entry.descriptor,
        current.sourceIdentity,
        input.sourceIdentity,
      )
    ) return;
    this.retirePvRelationRequestForRouteChange(
      input.scenarioId,
      input.entry,
      SCIENTIFIC_PRODUCT_PV_RELATION_ANALYSIS_PROVENANCE_V1,
    );
    const activeRequest = this.beginPvRelationProtocolGeneration({
      scenarioId: input.scenarioId,
      descriptor: input.entry.descriptor,
      sourceIdentity: input.sourceIdentity,
      calculationSource:
        SCIENTIFIC_PRODUCT_PV_RELATION_ANALYSIS_PROVENANCE_V1,
      sessionId: null,
    });
    this.getOrCreatePvRelationAnalysisCoordinator(
      input.scenarioId,
      input.entry,
    ).requestLatest(Object.freeze({
      requestToken: activeRequest.generationId,
      targetControlState: input.targetControlState,
      visibleParameterEpoch: input.sourceIdentity.parameterEpoch,
      visibleControlStateSha256: input.sourceIdentity.controlStateSha256,
    }));
  }

  private beginPvRelationProtocolGeneration(input: Readonly<{
    scenarioId: string;
    descriptor: ScientificProductScenarioDescriptorV1;
    sourceIdentity: ScientificProductHemodynamicProtocolSourceIdentityV1;
    calculationSource: ScientificProductHemodynamicProtocolCalculationSourceV1;
    sessionId: string | null;
  }>): ActivePvRelationProtocolRequestV1 {
    const generationId = `pv-relation-generation-${
      ++pvRelationProtocolGenerationOrdinalV1
    }`;
    const source = Object.freeze({
      sourceIdentityKey: pvRelationSourceIdentityKey(
        input.descriptor,
        input.sourceIdentity,
      ),
      sourceIdentity: input.sourceIdentity,
      jobId: generationId,
    });
    const activeRequest = Object.freeze({
      generationId,
      calculationSource: input.calculationSource,
      sessionId: input.sessionId,
      source,
    });
    this.activePvRelationProtocolRequests.set(input.scenarioId, activeRequest);
    this.pvRelationProtocolSeriesSnapshot =
      startScientificHemodynamicCurveGenerationV1(
        this.pvRelationProtocolSeriesSnapshot,
        Object.freeze({
          scenarioId: input.scenarioId,
          generationId,
          source,
        }),
      );
    this.pvRelationProtocols.set(input.scenarioId, Object.freeze({
      kind: "pv-relations" as const,
      status: "running" as const,
      calculationSource: input.calculationSource,
      sourceIdentity: input.sourceIdentity,
      result: null,
      researchResultV3: null,
      jobSnapshot: null,
      errorMessage: null,
    }));
    this.publishProtocols();
    return activeRequest;
  }

  private retirePvRelationRequestForRouteChange(
    scenarioId: string,
    entry: ScenarioEntryV1,
    nextCalculationSource:
      ScientificProductHemodynamicProtocolCalculationSourceV1,
  ): void {
    const active = this.activePvRelationProtocolRequests.get(scenarioId);
    if (
      active === undefined
      || active.calculationSource === nextCalculationSource
    ) return;
    const presentation = this.pvRelationProtocols.get(scenarioId);
    this.clearPvRelationProtocolPollTimer(scenarioId);
    if (
      active.calculationSource === "visible-period1-source"
      && active.sessionId !== null
      && entry.runtime !== null
      && presentation?.status === "running"
      && presentation.jobSnapshot !== null
    ) {
      this.cancelPvRelationJobBestEffort(
        entry.runtime.client,
        active.sessionId,
        presentation.jobSnapshot.jobId,
      );
    }
    this.discardPendingPvRelationGeneration(
      scenarioId,
      active.generationId,
    );
    this.activePvRelationProtocolRequests.delete(scenarioId);
    if (nextCalculationSource === "visible-period1-source") {
      this.disposePvRelationAnalysisCoordinator(entry);
    }
  }

  private getOrCreatePvRelationAnalysisCoordinator(
    scenarioId: string,
    entry: ScenarioEntryV1,
  ): ScientificProductPvRelationAnalysisCoordinatorV1 {
    const existing = entry.pvRelationAnalysisCoordinator;
    if (existing !== null) return existing;
    const caseEntry = scientificProductCaseByIdV1(
      entry.descriptor.source.caseId,
    );
    if (caseEntry === null) {
      throw new Error(
        `Unknown scientific product Case ${entry.descriptor.source.caseId}.`,
      );
    }
    const coordinator = new ScientificProductPvRelationAnalysisCoordinatorV1({
      caseEntry,
      createClient: () => createScientificProductWorkerClientV1(),
      loadBootstrapSource: async (bootstrapCase, client) => {
        const loaded = await loadScientificProductScenarioRuntimeV1(
          bootstrapCase,
          undefined,
          client as MainWireScientificWorkerClientV1,
        );
        return Object.freeze({
          sessionId: loaded.sessionId,
          context: loaded.result.researchControlContext,
        });
      },
      onJobSnapshot: (event) => {
        this.publishHiddenPvRelationJobSnapshot(scenarioId, entry, event);
      },
      onError: (event) => {
        this.publishHiddenPvRelationError(scenarioId, entry, event);
      },
    });
    entry.pvRelationAnalysisCoordinator = coordinator;
    return coordinator;
  }

  private publishHiddenPvRelationJobSnapshot(
    scenarioId: string,
    entry: ScenarioEntryV1,
    event: ScientificProductPvRelationAnalysisSnapshotEventV1,
  ): void {
    const active = this.activePvRelationProtocolRequests.get(scenarioId);
    if (
      this.disposed
      || this.entries.get(scenarioId) !== entry
      || active?.calculationSource
        !== SCIENTIFIC_PRODUCT_PV_RELATION_ANALYSIS_PROVENANCE_V1
      || active.generationId !== event.requestToken
      || event.provenance
        !== SCIENTIFIC_PRODUCT_PV_RELATION_ANALYSIS_PROVENANCE_V1
      || active.source.sourceIdentity.parameterEpoch
        !== event.visibleParameterEpoch
      || active.source.sourceIdentity.controlStateSha256
        !== event.visibleControlStateSha256
    ) return;
    const snapshot = event.snapshot;
    const status = snapshot.status === "running"
      ? "running" as const
      : snapshot.status === "complete"
        ? "complete" as const
        : "error" as const;
    const presentation = Object.freeze({
      kind: "pv-relations" as const,
      status,
      calculationSource: event.provenance,
      // The presentation is correlated to the visible target. The numerical
      // source revision/time intentionally belongs to the independent worker.
      sourceIdentity: active.source.sourceIdentity,
      result: snapshot.result,
      researchResultV3: snapshot.researchResultV3 ?? null,
      jobSnapshot: snapshot,
      errorMessage: snapshot.errorMessage,
    });
    this.pvRelationProtocols.set(scenarioId, presentation);
    if (status === "error") {
      this.applyHiddenPvRelationFailure(
        scenarioId,
        active,
        snapshot.errorMessage ?? `PV relation job ${snapshot.status}.`,
        snapshot.sequence,
      );
    } else {
      this.pvRelationProtocolSeriesSnapshot =
        applyScientificHemodynamicCurveSnapshotV1(
          this.pvRelationProtocolSeriesSnapshot,
          Object.freeze({
            scenarioId,
            generationId: active.generationId,
            source: active.source,
            update: Object.freeze({
              kind: "snapshot" as const,
              sequence: snapshot.sequence,
              status,
              snapshot: presentation,
              renderable: isRenderablePvRelationJobSnapshot(snapshot),
            }),
          }),
        );
      if (
        status === "complete"
        && this.activePvRelationProtocolRequests.get(scenarioId)?.generationId
          === active.generationId
      ) this.activePvRelationProtocolRequests.delete(scenarioId);
    }
    this.publishProtocols();
  }

  private publishHiddenPvRelationError(
    scenarioId: string,
    entry: ScenarioEntryV1,
    event: ScientificProductPvRelationAnalysisErrorEventV1,
  ): void {
    const active = this.activePvRelationProtocolRequests.get(scenarioId);
    if (
      this.disposed
      || this.entries.get(scenarioId) !== entry
      || active?.calculationSource
        !== SCIENTIFIC_PRODUCT_PV_RELATION_ANALYSIS_PROVENANCE_V1
      || active.generationId !== event.requestToken
      || event.provenance
        !== SCIENTIFIC_PRODUCT_PV_RELATION_ANALYSIS_PROVENANCE_V1
      || active.source.sourceIdentity.parameterEpoch
        !== event.visibleParameterEpoch
      || active.source.sourceIdentity.controlStateSha256
        !== event.visibleControlStateSha256
    ) return;
    this.pvRelationProtocols.set(scenarioId, Object.freeze({
      kind: "pv-relations" as const,
      status: "error" as const,
      calculationSource: event.provenance,
      sourceIdentity: active.source.sourceIdentity,
      result: null,
      researchResultV3: null,
      jobSnapshot: null,
      errorMessage: event.message,
    }));
    this.applyHiddenPvRelationFailure(
      scenarioId,
      active,
      event.message,
    );
    this.publishProtocols();
  }

  private applyHiddenPvRelationFailure(
    scenarioId: string,
    active: ActivePvRelationProtocolRequestV1,
    errorMessage: string,
    sequence = nextPvRelationGenerationSequence(
      this.getPvRelationProtocolSeries(scenarioId),
      active.generationId,
    ),
  ): void {
    this.pvRelationProtocolSeriesSnapshot =
      applyScientificHemodynamicCurveSnapshotV1(
        this.pvRelationProtocolSeriesSnapshot,
        Object.freeze({
          scenarioId,
          generationId: active.generationId,
          source: active.source,
          update: Object.freeze({
            kind: "error" as const,
            sequence,
            errorMessage,
          }),
        }),
      );
    if (
      this.activePvRelationProtocolRequests.get(scenarioId)?.generationId
        === active.generationId
    ) this.activePvRelationProtocolRequests.delete(scenarioId);
  }

  private disposePvRelationAnalysisCoordinator(entry: ScenarioEntryV1): void {
    const coordinator = entry.pvRelationAnalysisCoordinator;
    if (coordinator === null) return;
    entry.pvRelationAnalysisCoordinator = null;
    void coordinator.dispose().catch(() => undefined);
  }

  private startPvRelationJob(input: Readonly<{
    scenarioId: string;
    entry: ScenarioEntryV1;
    runtime: ScientificProductScenarioRuntimeV1;
    sessionId: string;
    generation: number;
    sourceIdentity: ScientificProductHemodynamicProtocolSourceIdentityV1;
    activeRequest: ActivePvRelationProtocolRequestV1;
  }>): void {
    const requestId = `workbench-pv-relation-${
      ++pvRelationProtocolRequestOrdinalV1
    }`;
    void input.runtime.client.request(Object.freeze({
      protocolId: SCIENTIFIC_COMMAND_PROTOCOL_V1_ID,
      kind: "startPvRelationsProtocolJob" as const,
      requestId,
      sessionId: input.sessionId,
    })).then((response) => {
      if (!this.pvRelationRequestStillCurrent(input)) {
        if (
          this.pvRelationRequestOwnerStillCurrent(input)
          && response.ok
          && response.commandKind === "startPvRelationsProtocolJob"
          && response.payload.kind === "pvRelationsProtocolJobStarted"
        ) {
          this.cancelAndDiscardStalePvRelationJob(
            input,
            response.payload.job.jobId,
          );
        }
        return;
      }
      if (!response.ok) {
        this.failPvRelationProtocol(input, response.error.message);
        return;
      }
      if (
        response.commandKind !== "startPvRelationsProtocolJob"
        || response.payload.kind !== "pvRelationsProtocolJobStarted"
      ) {
        this.failPvRelationProtocol(
          input,
          "PV relation job start payload mismatch.",
        );
        return;
      }
      const started = response.payload.job;
      if (!sameProtocolJobSourceIdentity(
        started.snapshot.source,
        input.sourceIdentity,
      )) {
        this.failPvRelationProtocol(
          input,
          "PV relation job source identity mismatch.",
        );
        return;
      }
      this.publishPvRelationJobSnapshot(input, started.snapshot);
      if (started.snapshot.status === "running") {
        this.schedulePvRelationJobPoll(
          input,
          started.snapshot.jobId,
          started.suggestedPollIntervalMs,
        );
      }
    }).catch((error: unknown) => {
      if (!this.pvRelationRequestStillCurrent(input)) return;
      this.failPvRelationProtocol(
        input,
        error instanceof Error ? error.message : String(error),
      );
    });
  }

  private schedulePvRelationJobPoll(
    input: Parameters<ScientificProductScenarioRegistryV1[
      "startPvRelationJob"
    ]>[0],
    jobId: string,
    delayMs: number,
  ): void {
    this.clearPvRelationProtocolPollTimer(input.scenarioId);
    const timer = globalThis.setTimeout(() => {
      this.pvRelationProtocolPollTimers.delete(input.scenarioId);
      this.pollPvRelationJob(input, jobId, delayMs);
    }, Math.max(50, Math.min(2_000, delayMs)));
    this.pvRelationProtocolPollTimers.set(input.scenarioId, timer);
  }

  private pollPvRelationJob(
    input: Parameters<ScientificProductScenarioRegistryV1[
      "startPvRelationJob"
    ]>[0],
    jobId: string,
    delayMs: number,
  ): void {
    if (!this.pvRelationRequestStillCurrent(input)) {
      if (this.pvRelationRequestOwnerStillCurrent(input)) {
        this.cancelAndDiscardStalePvRelationJob(input, jobId);
      }
      return;
    }
    const requestId = `workbench-pv-relation-${
      ++pvRelationProtocolRequestOrdinalV1
    }`;
    void input.runtime.client.request(Object.freeze({
      protocolId: SCIENTIFIC_COMMAND_PROTOCOL_V1_ID,
      kind: "pollPvRelationsProtocolJob" as const,
      requestId,
      sessionId: input.sessionId,
      jobId,
    })).then((response) => {
      if (!this.pvRelationRequestStillCurrent(input)) {
        if (this.pvRelationRequestOwnerStillCurrent(input)) {
          this.cancelAndDiscardStalePvRelationJob(input, jobId);
        }
        return;
      }
      if (!response.ok) {
        this.failPvRelationProtocol(input, response.error.message);
        return;
      }
      if (
        response.commandKind !== "pollPvRelationsProtocolJob"
        || response.payload.kind !== "pvRelationsProtocolJobProgress"
      ) {
        this.failPvRelationProtocol(
          input,
          "PV relation job progress payload mismatch.",
        );
        return;
      }
      const snapshot = response.payload.snapshot;
      if (
        snapshot.jobId !== jobId
        || !sameProtocolJobSourceIdentity(
          snapshot.source,
          input.sourceIdentity,
        )
      ) {
        this.failPvRelationProtocol(
          input,
          "PV relation job progress identity mismatch.",
        );
        return;
      }
      this.publishPvRelationJobSnapshot(input, snapshot);
      if (snapshot.status === "running") {
        this.schedulePvRelationJobPoll(input, jobId, delayMs);
      }
    }).catch((error: unknown) => {
      if (!this.pvRelationRequestStillCurrent(input)) return;
      this.failPvRelationProtocol(
        input,
        error instanceof Error ? error.message : String(error),
      );
    });
  }

  private publishPvRelationJobSnapshot(
    input: Parameters<ScientificProductScenarioRegistryV1[
      "startPvRelationJob"
    ]>[0],
    snapshot: MainWireScientificPvRelationJobSnapshotV1,
  ): void {
    const status = snapshot.status === "running"
      ? "running" as const
      : snapshot.status === "complete"
        ? "complete" as const
        : "error" as const;
    const presentation = Object.freeze({
      kind: "pv-relations" as const,
      status,
      calculationSource: "visible-period1-source" as const,
      sourceIdentity: input.sourceIdentity,
      result: snapshot.result,
      researchResultV3: snapshot.researchResultV3 ?? null,
      jobSnapshot: snapshot,
      errorMessage: snapshot.errorMessage,
    });
    this.pvRelationProtocols.set(input.scenarioId, presentation);
    if (status === "error") {
      this.applyPvRelationProtocolFailure(
        input,
        snapshot.errorMessage ?? `PV relation job ${snapshot.status}.`,
        snapshot.sequence,
      );
    } else {
      this.pvRelationProtocolSeriesSnapshot =
        applyScientificHemodynamicCurveSnapshotV1(
          this.pvRelationProtocolSeriesSnapshot,
          Object.freeze({
            scenarioId: input.scenarioId,
            generationId: input.activeRequest.generationId,
            source: input.activeRequest.source,
            update: Object.freeze({
              kind: "snapshot" as const,
              sequence: snapshot.sequence,
              status,
              snapshot: presentation,
              renderable: isRenderablePvRelationJobSnapshot(snapshot),
            }),
          }),
        );
      if (
        status === "complete"
        && this.activePvRelationProtocolRequests.get(input.scenarioId)
          ?.generationId === input.activeRequest.generationId
      ) {
        this.activePvRelationProtocolRequests.delete(input.scenarioId);
      }
    }
    this.publishProtocols();
  }

  private pvRelationRequestOwnerStillCurrent(input: Readonly<{
    scenarioId: string;
    entry: ScenarioEntryV1;
    generation: number;
  }>): boolean {
    return !this.disposed
      && this.entries.get(input.scenarioId) === input.entry
      && input.entry.generation === input.generation;
  }

  private pvRelationRequestStillCurrent(input: Readonly<{
    scenarioId: string;
    entry: ScenarioEntryV1;
    runtime: ScientificProductScenarioRuntimeV1;
    generation: number;
    sourceIdentity: ScientificProductHemodynamicProtocolSourceIdentityV1;
    activeRequest: ActivePvRelationProtocolRequestV1;
  }>): boolean {
    if (!this.pvRelationRequestOwnerStillCurrent(input)) return false;
    const active = this.activePvRelationProtocolRequests.get(input.scenarioId);
    const controlSnapshot = input.runtime.controlStore.getSnapshot();
    return active?.generationId === input.activeRequest.generationId
      && controlSnapshot.provenance.displayedEvidence
        !== "open-transient-no-periodic-claim"
      && sameProtocolSourceIdentity(
        input.sourceIdentity,
        protocolSourceIdentityFromSource(controlSnapshot.source),
      );
  }

  private failPvRelationProtocol(
    input: Parameters<ScientificProductScenarioRegistryV1[
      "startPvRelationJob"
    ]>[0],
    errorMessage: string,
  ): void {
    this.clearPvRelationProtocolPollTimer(input.scenarioId);
    this.pvRelationProtocols.set(input.scenarioId, Object.freeze({
      kind: "pv-relations" as const,
      status: "error" as const,
      calculationSource: "visible-period1-source" as const,
      sourceIdentity: input.sourceIdentity,
      result: null,
      jobSnapshot: null,
      errorMessage,
    }));
    this.applyPvRelationProtocolFailure(input, errorMessage);
    this.publishProtocols();
  }

  private applyPvRelationProtocolFailure(
    input: Parameters<ScientificProductScenarioRegistryV1[
      "startPvRelationJob"
    ]>[0],
    errorMessage: string,
    sequence = nextPvRelationGenerationSequence(
      this.getPvRelationProtocolSeries(input.scenarioId),
      input.activeRequest.generationId,
    ),
  ): void {
    this.pvRelationProtocolSeriesSnapshot =
      applyScientificHemodynamicCurveSnapshotV1(
        this.pvRelationProtocolSeriesSnapshot,
        Object.freeze({
          scenarioId: input.scenarioId,
          generationId: input.activeRequest.generationId,
          source: input.activeRequest.source,
          update: Object.freeze({
            kind: "error" as const,
            sequence,
            errorMessage,
          }),
        }),
      );
    if (
      this.activePvRelationProtocolRequests.get(input.scenarioId)?.generationId
        === input.activeRequest.generationId
    ) {
      this.activePvRelationProtocolRequests.delete(input.scenarioId);
    }
  }

  requestHemodynamicProtocol(
    scenarioId: string,
    kind: ScientificProductHemodynamicProtocolKindV1,
    detailMode: ScientificProductHemodynamicProtocolDetailModeV1 = "compare",
  ): void {
    const entry = this.entries.get(scenarioId);
    const runtime = entry?.runtime;
    if (entry === undefined || runtime === null || this.disposed) return;
    this.clearHemodynamicProtocolStopTimer(
      protocolCacheKey(scenarioId, kind),
    );
    const snapshot = runtime.controlStore.getSnapshot();
    if (snapshot.provenance.displayedEvidence
      === "open-transient-no-periodic-claim") {
      const candidate = snapshot.candidate;
      if (
        candidate === null
        || snapshot.targetControlStateSha256 === null
        || candidate.context.controlState.targetStateSha256
          !== snapshot.targetControlStateSha256
      ) {
        // During a retarget the visible boundary and cumulative target are
        // briefly owned by different candidates. Waiting for the correlated
        // candidate avoids calculating a curve for an identity the UI never
        // displayed.
        return;
      }
      this.requestHiddenHemodynamicProtocol({
        scenarioId,
        kind,
        detailMode,
        entry,
        runtime,
        sourceIdentity: protocolSourceIdentityFromLiveCandidate(candidate),
        targetControlState: candidate.context.controlState,
      });
      return;
    }
    this.requestVisibleHemodynamicProtocol({
      scenarioId,
      kind,
      detailMode,
      entry,
      runtime,
      source: snapshot.source,
    });
  }

  private requestVisibleHemodynamicProtocol(input: Readonly<{
    scenarioId: string;
    kind: ScientificProductHemodynamicProtocolKindV1;
    detailMode: ScientificProductHemodynamicProtocolDetailModeV1;
    entry: ScenarioEntryV1;
    runtime: ScientificProductScenarioRuntimeV1;
    source: ScientificWorkbenchResearchControlSourceV0;
  }>): void {
    const sourceIdentity = protocolSourceIdentityFromSource(input.source);
    const key = protocolCacheKey(input.scenarioId, input.kind);
    const current = this.hemodynamicProtocols.get(key);
    if (
      current?.calculationSource === "visible-period1-source"
      && current.status === "running"
      && hemodynamicDetailModeSatisfies(
        current.detailMode,
        input.detailMode,
      )
      && sameProtocolSourceIdentity(current.sourceIdentity, sourceIdentity)
    ) return;
    if (
      current?.calculationSource === "visible-period1-source"
      && current.status === "complete"
      && hemodynamicDetailModeSatisfies(
        current.detailMode,
        input.detailMode,
      )
      && sameProtocolSourceIdentity(current.sourceIdentity, sourceIdentity)
    ) return;
    this.retireProtocolRequestForRouteChange(
      input.scenarioId,
      input.entry,
      key,
      "visible-period1-source",
    );
    this.disposeHemodynamicAnalysisCoordinator(input.entry);
    // A new start atomically replaces the active job inside the visible
    // worker pool. Do not enqueue a separate same-route cancel: an in-flight
    // poll plus cancel plus start would exceed its bounded request capacity.
    this.clearProtocolPollTimer(key);
    const generation = input.entry.generation;
    const activeRequest = this.beginHemodynamicProtocolGeneration({
      key,
      kind: input.kind,
      detailMode: input.detailMode,
      sourceIdentity,
      calculationSource: "visible-period1-source",
      sessionId: input.source.sessionId,
    });
    this.startGuytonStarlingJob({
      scenarioId: input.scenarioId,
      entry: input.entry,
      runtime: input.runtime,
      sourceIdentity,
      sessionId: input.source.sessionId,
      key,
      generation,
      activeRequest,
    });
  }

  private requestHiddenHemodynamicProtocol(input: Readonly<{
    scenarioId: string;
    kind: ScientificProductHemodynamicProtocolKindV1;
    detailMode: ScientificProductHemodynamicProtocolDetailModeV1;
    entry: ScenarioEntryV1;
    runtime: ScientificProductScenarioRuntimeV1;
    sourceIdentity: ScientificProductHemodynamicProtocolSourceIdentityV1;
    targetControlState: MainWireScientificResearchControlTargetStateV0;
  }>): void {
    const key = protocolCacheKey(input.scenarioId, input.kind);
    const current = this.hemodynamicProtocols.get(key);
    if (
      current?.calculationSource
        === SCIENTIFIC_PRODUCT_HEMODYNAMIC_ANALYSIS_PROVENANCE_V1
      && current.status === "running"
      && hemodynamicDetailModeSatisfies(
        current.detailMode,
        input.detailMode,
      )
      && sameProtocolSourceIdentity(current.sourceIdentity, input.sourceIdentity)
    ) return;
    if (
      current?.calculationSource
        === SCIENTIFIC_PRODUCT_HEMODYNAMIC_ANALYSIS_PROVENANCE_V1
      && current.status === "complete"
      && hemodynamicDetailModeSatisfies(
        current.detailMode,
        input.detailMode,
      )
      && sameProtocolSourceIdentity(current.sourceIdentity, input.sourceIdentity)
    ) return;
    this.retireProtocolRequestForRouteChange(
      input.scenarioId,
      input.entry,
      key,
      SCIENTIFIC_PRODUCT_HEMODYNAMIC_ANALYSIS_PROVENANCE_V1,
    );
    const activeRequest = this.beginHemodynamicProtocolGeneration({
      key,
      kind: input.kind,
      detailMode: input.detailMode,
      sourceIdentity: input.sourceIdentity,
      calculationSource:
        SCIENTIFIC_PRODUCT_HEMODYNAMIC_ANALYSIS_PROVENANCE_V1,
      sessionId: null,
    });
    const coordinator = this.getOrCreateHemodynamicAnalysisCoordinator(
      input.scenarioId,
      input.entry,
    );
    coordinator.requestLatest(Object.freeze({
      requestToken: activeRequest.generationId,
      targetControlState: input.targetControlState,
      visibleParameterEpoch: input.sourceIdentity.parameterEpoch,
      visibleControlStateSha256: input.sourceIdentity.controlStateSha256,
      detailMode: input.detailMode,
    }));
  }

  private beginHemodynamicProtocolGeneration(input: Readonly<{
    key: string;
    kind: ScientificProductHemodynamicProtocolKindV1;
    detailMode: ScientificProductHemodynamicProtocolDetailModeV1;
    sourceIdentity: ScientificProductHemodynamicProtocolSourceIdentityV1;
    calculationSource: ScientificProductHemodynamicProtocolCalculationSourceV1;
    sessionId: string | null;
  }>): ActiveHemodynamicProtocolRequestV1 {
    const generationId = `hemodynamic-generation-${
      ++hemodynamicProtocolGenerationOrdinalV1
    }`;
    const generationSource = Object.freeze({
      sourceIdentityKey: protocolParameterSourceIdentityKey(
        input.sourceIdentity,
      ),
      sourceIdentity: input.sourceIdentity,
      jobId: generationId,
    });
    const activeRequest = Object.freeze({
      generationId,
      detailMode: input.detailMode,
      calculationSource: input.calculationSource,
      sessionId: input.sessionId,
      source: generationSource,
    });
    this.activeHemodynamicProtocolRequests.set(input.key, activeRequest);
    this.hemodynamicProtocolSeriesSnapshot =
      startScientificHemodynamicCurveGenerationV1(
        this.hemodynamicProtocolSeriesSnapshot,
        Object.freeze({
          scenarioId: input.key,
          generationId,
          source: generationSource,
        }),
      );
    this.hemodynamicProtocols.set(input.key, Object.freeze({
      kind: input.kind,
      detailMode: input.detailMode,
      status: "running" as const,
      calculationSource: input.calculationSource,
      sourceIdentity: input.sourceIdentity,
      result: null,
      jobSnapshot: null,
      errorMessage: null,
    }));
    this.publishProtocols();
    return activeRequest;
  }

  private retireProtocolRequestForRouteChange(
    scenarioId: string,
    entry: ScenarioEntryV1,
    key: string,
    nextCalculationSource:
      ScientificProductHemodynamicProtocolCalculationSourceV1,
  ): void {
    const active = this.activeHemodynamicProtocolRequests.get(key);
    if (
      active === undefined
      || active.calculationSource === nextCalculationSource
    ) return;
    const presentation = this.hemodynamicProtocols.get(key);
    this.clearProtocolPollTimer(key);
    if (
      active.calculationSource === "visible-period1-source"
      && active.sessionId !== null
      && entry.runtime !== null
      && presentation?.status === "running"
      && presentation.jobSnapshot !== null
    ) {
      this.cancelGuytonStarlingJobBestEffort(
        entry.runtime.client,
        active.sessionId,
        presentation.jobSnapshot.jobId,
      );
    }
    this.discardPendingProtocolGeneration(key, active.generationId);
    this.activeHemodynamicProtocolRequests.delete(key);
    if (
      nextCalculationSource === "visible-period1-source"
      && this.entries.get(scenarioId) === entry
    ) {
      this.disposeHemodynamicAnalysisCoordinator(entry);
    }
  }

  private getOrCreateHemodynamicAnalysisCoordinator(
    scenarioId: string,
    entry: ScenarioEntryV1,
  ): ScientificProductHemodynamicAnalysisCoordinatorV1 {
    const existing = entry.hemodynamicAnalysisCoordinator;
    if (existing !== null) return existing;
    const caseEntry = scientificProductCaseByIdV1(
      entry.descriptor.source.caseId,
    );
    if (caseEntry === null) {
      throw new Error(
        `Unknown scientific product Case ${entry.descriptor.source.caseId}.`,
      );
    }
    const coordinator = new ScientificProductHemodynamicAnalysisCoordinatorV1({
      caseEntry,
      createClient: () => createScientificProductWorkerClientV1(),
      loadBootstrapSource: async (bootstrapCase, client) => {
        const loaded = await loadScientificProductScenarioRuntimeV1(
          bootstrapCase,
          undefined,
          client as MainWireScientificWorkerClientV1,
        );
        return Object.freeze({
          sessionId: loaded.sessionId,
          context: loaded.result.researchControlContext,
        });
      },
      onJobSnapshot: (event) => {
        this.publishHiddenHemodynamicJobSnapshot(
          scenarioId,
          entry,
          event,
        );
      },
      onError: (event) => {
        this.publishHiddenHemodynamicError(scenarioId, entry, event);
      },
    });
    entry.hemodynamicAnalysisCoordinator = coordinator;
    return coordinator;
  }

  private publishHiddenHemodynamicJobSnapshot(
    scenarioId: string,
    entry: ScenarioEntryV1,
    event: ScientificProductHemodynamicAnalysisSnapshotEventV1,
  ): void {
    const key = protocolCacheKey(scenarioId, "guyton-starling");
    const active = this.activeHemodynamicProtocolRequests.get(key);
    if (
      this.disposed
      || this.entries.get(scenarioId) !== entry
      || active?.calculationSource
        !== SCIENTIFIC_PRODUCT_HEMODYNAMIC_ANALYSIS_PROVENANCE_V1
      || active.generationId !== event.requestToken
      || event.provenance
        !== SCIENTIFIC_PRODUCT_HEMODYNAMIC_ANALYSIS_PROVENANCE_V1
      || active.source.sourceIdentity.parameterEpoch
        !== event.visibleParameterEpoch
      || active.source.sourceIdentity.controlStateSha256
        !== event.visibleControlStateSha256
    ) return;
    const snapshot = event.snapshot;
    const status = snapshot.status === "running"
      ? "running" as const
      : snapshot.status === "complete"
        ? "complete" as const
        : "error" as const;
    const presentation = Object.freeze({
      kind: "guyton-starling" as const,
      detailMode: event.detailMode,
      status,
      calculationSource: event.provenance,
      // This identity intentionally describes the visible target boundary.
      // The snapshot's accepted numerical source belongs to the independent
      // analysis Worker and may legitimately differ in revision/time.
      sourceIdentity: active.source.sourceIdentity,
      result: snapshot.result,
      jobSnapshot: snapshot,
      errorMessage: snapshot.errorMessage,
    });
    this.hemodynamicProtocols.set(key, presentation);
    if (status === "error") {
      this.applyHiddenHemodynamicFailure(
        key,
        active,
        snapshot.errorMessage ?? `Hemodynamic job ${snapshot.status}.`,
        snapshot.sequence,
      );
    } else {
      this.hemodynamicProtocolSeriesSnapshot =
        applyScientificHemodynamicCurveSnapshotV1(
          this.hemodynamicProtocolSeriesSnapshot,
          Object.freeze({
            scenarioId: key,
            generationId: active.generationId,
            source: active.source,
            update: Object.freeze({
              kind: "snapshot" as const,
              sequence: snapshot.sequence,
              status,
              snapshot: presentation,
              renderable: isRenderableHemodynamicJobSnapshot(snapshot),
            }),
          }),
        );
    }
    this.publishProtocols();
  }

  private publishHiddenHemodynamicError(
    scenarioId: string,
    entry: ScenarioEntryV1,
    event: ScientificProductHemodynamicAnalysisErrorEventV1,
  ): void {
    const key = protocolCacheKey(scenarioId, "guyton-starling");
    const active = this.activeHemodynamicProtocolRequests.get(key);
    if (
      this.disposed
      || this.entries.get(scenarioId) !== entry
      || active?.calculationSource
        !== SCIENTIFIC_PRODUCT_HEMODYNAMIC_ANALYSIS_PROVENANCE_V1
      || active.generationId !== event.requestToken
      || event.provenance
        !== SCIENTIFIC_PRODUCT_HEMODYNAMIC_ANALYSIS_PROVENANCE_V1
      || active.source.sourceIdentity.parameterEpoch
        !== event.visibleParameterEpoch
      || active.source.sourceIdentity.controlStateSha256
        !== event.visibleControlStateSha256
    ) return;
    this.hemodynamicProtocols.set(key, Object.freeze({
      kind: "guyton-starling" as const,
      detailMode: event.detailMode,
      status: "error" as const,
      calculationSource: event.provenance,
      sourceIdentity: active.source.sourceIdentity,
      result: null,
      jobSnapshot: null,
      errorMessage: event.message,
    }));
    this.applyHiddenHemodynamicFailure(key, active, event.message);
    this.publishProtocols();
  }

  private applyHiddenHemodynamicFailure(
    key: string,
    active: ActiveHemodynamicProtocolRequestV1,
    errorMessage: string,
    sequence = nextProtocolGenerationSequence(
      this.getHemodynamicProtocolSeriesByKey(key),
      active.generationId,
    ),
  ): void {
    this.hemodynamicProtocolSeriesSnapshot =
      applyScientificHemodynamicCurveSnapshotV1(
        this.hemodynamicProtocolSeriesSnapshot,
        Object.freeze({
          scenarioId: key,
          generationId: active.generationId,
          source: active.source,
          update: Object.freeze({
            kind: "error" as const,
            sequence,
            errorMessage,
          }),
        }),
      );
    if (
      this.activeHemodynamicProtocolRequests.get(key)?.generationId
        === active.generationId
    ) {
      this.activeHemodynamicProtocolRequests.delete(key);
    }
  }

  private disposeHemodynamicAnalysisCoordinator(entry: ScenarioEntryV1): void {
    const coordinator = entry.hemodynamicAnalysisCoordinator;
    if (coordinator === null) return;
    entry.hemodynamicAnalysisCoordinator = null;
    void coordinator.dispose().catch(() => undefined);
  }

  private startGuytonStarlingJob(input: Readonly<{
    scenarioId: string;
    entry: ScenarioEntryV1;
    runtime: ScientificProductScenarioRuntimeV1;
    sourceIdentity: ScientificProductHemodynamicProtocolSourceIdentityV1;
    sessionId: string;
    key: string;
    generation: number;
    activeRequest: ActiveHemodynamicProtocolRequestV1;
  }>): void {
    const requestId = `workbench-hemodynamic-${
      ++hemodynamicProtocolRequestOrdinalV1
    }`;
    void input.runtime.client.request(Object.freeze({
      protocolId: SCIENTIFIC_COMMAND_PROTOCOL_V1_ID,
      kind: "startGuytonStarlingProtocolJob" as const,
      requestId,
      sessionId: input.sessionId,
      detailMode: input.activeRequest.detailMode,
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
        this.failProtocol(input, response.error.message);
        return;
      }
      if (
        response.commandKind !== "startGuytonStarlingProtocolJob"
        || response.payload.kind !== "guytonStarlingProtocolJobStarted"
      ) {
        this.failProtocol(
          input,
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
          input,
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
        input,
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
        this.failProtocol(input, response.error.message);
        return;
      }
      if (
        response.commandKind !== "pollGuytonStarlingProtocolJob"
        || response.payload.kind !== "guytonStarlingProtocolJobProgress"
      ) {
        this.failProtocol(
          input,
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
          input,
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
        input,
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
    const presentation = Object.freeze({
      kind: "guyton-starling" as const,
      detailMode: input.activeRequest.detailMode,
      status,
      calculationSource: "visible-period1-source" as const,
      sourceIdentity: input.sourceIdentity,
      result: snapshot.result,
      jobSnapshot: snapshot,
      errorMessage: snapshot.errorMessage,
    });
    this.hemodynamicProtocols.set(input.key, presentation);
    if (status === "error") {
      this.applyProtocolFailure(
        input,
        snapshot.errorMessage ?? `Hemodynamic job ${snapshot.status}.`,
        snapshot.sequence,
      );
    } else {
      this.hemodynamicProtocolSeriesSnapshot =
        applyScientificHemodynamicCurveSnapshotV1(
          this.hemodynamicProtocolSeriesSnapshot,
          Object.freeze({
            scenarioId: input.key,
            generationId: input.activeRequest.generationId,
            source: input.activeRequest.source,
            update: Object.freeze({
              kind: "snapshot" as const,
              sequence: snapshot.sequence,
              status,
              snapshot: presentation,
              renderable: isRenderableHemodynamicJobSnapshot(snapshot),
            }),
          }),
        );
    }
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
    sourceIdentity: ScientificProductHemodynamicProtocolSourceIdentityV1;
    generation: number;
    key: string;
    activeRequest: ActiveHemodynamicProtocolRequestV1;
  }>): boolean {
    if (!this.protocolRequestOwnerStillCurrent(input)) return false;
    const active = this.activeHemodynamicProtocolRequests.get(input.key);
    return active?.generationId === input.activeRequest.generationId
      && active.calculationSource === "visible-period1-source"
      && active.sessionId === input.activeRequest.sessionId
      && sameProtocolSourceIdentity(
        input.sourceIdentity,
        protocolSourceIdentityFromSource(
          input.runtime.controlStore.getSnapshot().source,
        ),
      );
  }

  private failProtocol(
    input: Parameters<ScientificProductScenarioRegistryV1[
      "startGuytonStarlingJob"
    ]>[0],
    errorMessage: string,
  ): void {
    this.clearProtocolPollTimer(input.key);
    this.hemodynamicProtocols.set(input.key, Object.freeze({
      kind: "guyton-starling" as const,
      detailMode: input.activeRequest.detailMode,
      status: "error" as const,
      calculationSource: "visible-period1-source" as const,
      sourceIdentity: input.sourceIdentity,
      result: null,
      jobSnapshot: null,
      errorMessage,
    }));
    this.applyProtocolFailure(input, errorMessage);
    this.publishProtocols();
  }

  private applyProtocolFailure(
    input: Parameters<ScientificProductScenarioRegistryV1[
      "startGuytonStarlingJob"
    ]>[0],
    errorMessage: string,
    sequence = nextProtocolGenerationSequence(
      this.getHemodynamicProtocolSeriesByKey(input.key),
      input.activeRequest.generationId,
    ),
  ): void {
    this.hemodynamicProtocolSeriesSnapshot =
      applyScientificHemodynamicCurveSnapshotV1(
        this.hemodynamicProtocolSeriesSnapshot,
        Object.freeze({
          scenarioId: input.key,
          generationId: input.activeRequest.generationId,
          source: input.activeRequest.source,
          update: Object.freeze({
            kind: "error" as const,
            sequence,
            errorMessage,
          }),
        }),
      );
    if (
      this.activeHemodynamicProtocolRequests.get(input.key)?.generationId
        === input.activeRequest.generationId
    ) {
      this.activeHemodynamicProtocolRequests.delete(input.key);
    }
  }

  private getHemodynamicProtocolSeriesByKey(
    key: string,
  ): ScientificProductHemodynamicProtocolSeriesV1 | null {
    return getScientificHemodynamicCurveScenarioStateV1(
      this.hemodynamicProtocolSeriesSnapshot,
      key,
    );
  }

  private cancelAndDiscardStaleGuytonJob(
    input: Readonly<{
      runtime: ScientificProductScenarioRuntimeV1;
      sourceIdentity: ScientificProductHemodynamicProtocolSourceIdentityV1;
      sessionId: string;
      key: string;
      activeRequest: ActiveHemodynamicProtocolRequestV1;
    }>,
    jobId: string,
  ): void {
    this.cancelGuytonStarlingJobBestEffort(
      input.runtime.client,
      input.sessionId,
      jobId,
    );
    const stale = this.hemodynamicProtocols.get(input.key);
    const requestStillOwnsLegacyPresentation =
      this.activeHemodynamicProtocolRequests.get(input.key)?.generationId
        === input.activeRequest.generationId;
    if (
      requestStillOwnsLegacyPresentation
      && stale?.status === "running"
      && sameProtocolSourceIdentity(stale.sourceIdentity, input.sourceIdentity)
      && (stale.jobSnapshot === null || stale.jobSnapshot.jobId === jobId)
    ) {
      this.clearProtocolPollTimer(input.key);
      this.hemodynamicProtocols.delete(input.key);
    }
    if (
      this.activeHemodynamicProtocolRequests.get(input.key)?.generationId
        === input.activeRequest.generationId
    ) {
      this.activeHemodynamicProtocolRequests.delete(input.key);
    }
    this.discardPendingProtocolGeneration(
      input.key,
      input.activeRequest.generationId,
    );
    this.publishProtocols();
  }

  private discardPendingProtocolGeneration(
    key: string,
    generationId: string,
  ): void {
    const series = this.getHemodynamicProtocolSeriesByKey(key);
    if (series?.pending?.generationId !== generationId) return;
    this.hemodynamicProtocolSeriesSnapshot = Object.freeze({
      historyLimit: this.hemodynamicProtocolSeriesSnapshot.historyLimit,
      scenarios: Object.freeze({
        ...this.hemodynamicProtocolSeriesSnapshot.scenarios,
        [key]: Object.freeze({ ...series, pending: null }),
      }),
    });
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

  private reconcileHemodynamicProtocolDemands(
    target: Pick<ScientificProductHemodynamicProtocolDemandV1,
      "scenarioId" | "kind">,
  ): void {
    const key = protocolCacheKey(target.scenarioId, target.kind);
    const modes = [...this.hemodynamicProtocolDemands.values()]
      .filter((demand) =>
        protocolCacheKey(demand.scenarioId, demand.kind) === key)
      .map(({ detailMode }) => detailMode);
    if (modes.length === 0) {
      this.scheduleHemodynamicProtocolDemandStop(
        target.scenarioId,
        target.kind,
      );
      return;
    }
    this.clearHemodynamicProtocolStopTimer(key);
    const detailMode = effectiveHemodynamicProtocolDetailMode(modes);
    this.requestHemodynamicProtocol(target.scenarioId, target.kind, detailMode);
  }

  private scheduleHemodynamicProtocolDemandStop(
    scenarioId: string,
    kind: ScientificProductHemodynamicProtocolKindV1,
  ): void {
    const key = protocolCacheKey(scenarioId, kind);
    if (this.hemodynamicProtocolStopTimers.has(key)) return;
    const timer = globalThis.setTimeout(() => {
      this.hemodynamicProtocolStopTimers.delete(key);
      if (this.disposed) return;
      const stillDemanded = [...this.hemodynamicProtocolDemands.values()]
        .some((demand) =>
          protocolCacheKey(demand.scenarioId, demand.kind) === key);
      if (!stillDemanded) {
        this.stopHemodynamicProtocolDemand(scenarioId, kind);
      }
    }, 0);
    this.hemodynamicProtocolStopTimers.set(key, timer);
  }

  private clearHemodynamicProtocolStopTimer(key: string): void {
    const timer = this.hemodynamicProtocolStopTimers.get(key);
    if (timer !== undefined) globalThis.clearTimeout(timer);
    this.hemodynamicProtocolStopTimers.delete(key);
  }

  private stopHemodynamicProtocolDemand(
    scenarioId: string,
    kind: ScientificProductHemodynamicProtocolKindV1,
  ): void {
    const key = protocolCacheKey(scenarioId, kind);
    const active = this.activeHemodynamicProtocolRequests.get(key);
    const presentation = this.hemodynamicProtocols.get(key);
    const entry = this.entries.get(scenarioId);
    const runtime = entry?.runtime;
    if (
      active !== undefined
      && active.calculationSource === "visible-period1-source"
      && active.sessionId !== null
      && runtime !== null
      && runtime !== undefined
      && presentation?.status === "running"
      && presentation.jobSnapshot !== null
    ) {
      this.cancelGuytonStarlingJobBestEffort(
        runtime.client,
        active.sessionId,
        presentation.jobSnapshot.jobId,
      );
    }
    this.clearProtocolPollTimer(key);
    if (active !== undefined) {
      this.discardPendingProtocolGeneration(key, active.generationId);
      this.activeHemodynamicProtocolRequests.delete(key);
    }
    if (presentation?.status === "running") {
      this.hemodynamicProtocols.delete(key);
    }
    if (entry !== undefined) {
      this.disposeHemodynamicAnalysisCoordinator(entry);
    }
    this.publishProtocols();
  }

  private reconcileHemodynamicProtocolDemandsForScenario(
    scenarioId: string,
  ): void {
    const kinds = new Set<ScientificProductHemodynamicProtocolKindV1>();
    for (const demand of this.hemodynamicProtocolDemands.values()) {
      if (demand.scenarioId === scenarioId) kinds.add(demand.kind);
    }
    for (const kind of kinds) {
      this.reconcileHemodynamicProtocolDemands({ scenarioId, kind });
    }
  }

  private reconcilePvRelationProtocolDemand(scenarioId: string): void {
    const demanded = [...this.pvRelationProtocolDemands.values()]
      .some((demand) => demand.scenarioId === scenarioId);
    if (!demanded) {
      this.schedulePvRelationProtocolDemandStop(scenarioId);
      return;
    }
    this.clearPvRelationProtocolStopTimer(scenarioId);
    this.requestPvRelationProtocol(scenarioId);
  }

  private reconcilePvRelationProtocolDemandForScenario(
    scenarioId: string,
  ): void {
    if ([...this.pvRelationProtocolDemands.values()]
      .some((demand) => demand.scenarioId === scenarioId)) {
      this.reconcilePvRelationProtocolDemand(scenarioId);
    }
  }

  private schedulePvRelationProtocolDemandStop(scenarioId: string): void {
    if (this.pvRelationProtocolStopTimers.has(scenarioId)) return;
    const timer = globalThis.setTimeout(() => {
      this.pvRelationProtocolStopTimers.delete(scenarioId);
      if (this.disposed) return;
      const stillDemanded = [...this.pvRelationProtocolDemands.values()]
        .some((demand) => demand.scenarioId === scenarioId);
      if (!stillDemanded) this.stopPvRelationProtocolDemand(scenarioId);
    }, 0);
    this.pvRelationProtocolStopTimers.set(scenarioId, timer);
  }

  private stopPvRelationProtocolDemand(scenarioId: string): void {
    const active = this.activePvRelationProtocolRequests.get(scenarioId);
    const presentation = this.pvRelationProtocols.get(scenarioId);
    const runtime = this.entries.get(scenarioId)?.runtime;
    if (
      active !== undefined
      && active.calculationSource === "visible-period1-source"
      && active.sessionId !== null
      && runtime !== null
      && runtime !== undefined
      && presentation?.status === "running"
      && presentation.jobSnapshot !== null
    ) {
      this.cancelPvRelationJobBestEffort(
        runtime.client,
        active.sessionId,
        presentation.jobSnapshot.jobId,
      );
    }
    this.clearPvRelationProtocolPollTimer(scenarioId);
    if (active !== undefined) {
      this.discardPendingPvRelationGeneration(
        scenarioId,
        active.generationId,
      );
      this.activePvRelationProtocolRequests.delete(scenarioId);
    }
    if (presentation?.status === "running") {
      this.pvRelationProtocols.delete(scenarioId);
    }
    const entry = this.entries.get(scenarioId);
    if (entry !== undefined) this.disposePvRelationAnalysisCoordinator(entry);
    this.publishProtocols();
  }

  private discardPendingPvRelationGeneration(
    scenarioId: string,
    generationId: string,
  ): void {
    const series = this.getPvRelationProtocolSeries(scenarioId);
    if (series.pending?.generationId !== generationId) return;
    this.pvRelationProtocolSeriesSnapshot = Object.freeze({
      historyLimit: this.pvRelationProtocolSeriesSnapshot.historyLimit,
      scenarios: Object.freeze({
        ...this.pvRelationProtocolSeriesSnapshot.scenarios,
        [scenarioId]: Object.freeze({ ...series, pending: null }),
      }),
    });
  }

  private cancelPvRelationJobBestEffort(
    client: MainWireScientificWorkerClientV1,
    sessionId: string,
    jobId: string,
  ): void {
    const requestId = `workbench-pv-relation-${
      ++pvRelationProtocolRequestOrdinalV1
    }`;
    void client.request(Object.freeze({
      protocolId: SCIENTIFIC_COMMAND_PROTOCOL_V1_ID,
      kind: "cancelPvRelationsProtocolJob" as const,
      requestId,
      sessionId,
      jobId,
    })).catch(() => undefined);
  }

  private cancelAndDiscardStalePvRelationJob(
    input: Parameters<ScientificProductScenarioRegistryV1[
      "startPvRelationJob"
    ]>[0],
    jobId: string,
  ): void {
    this.cancelPvRelationJobBestEffort(
      input.runtime.client,
      input.sessionId,
      jobId,
    );
    const active = this.activePvRelationProtocolRequests.get(
      input.scenarioId,
    );
    if (active?.generationId !== input.activeRequest.generationId) return;

    this.clearPvRelationProtocolPollTimer(input.scenarioId);
    this.discardPendingPvRelationGeneration(
      input.scenarioId,
      input.activeRequest.generationId,
    );
    const presentation = this.pvRelationProtocols.get(input.scenarioId);
    if (
      presentation?.status === "running"
      && sameProtocolSourceIdentity(
        presentation.sourceIdentity,
        input.sourceIdentity,
      )
      && (
        presentation.jobSnapshot === null
        || presentation.jobSnapshot.jobId === jobId
      )
    ) {
      this.pvRelationProtocols.delete(input.scenarioId);
    }
    this.activePvRelationProtocolRequests.delete(input.scenarioId);
    this.publishProtocols();
  }

  private clearPvRelationProtocolPollTimer(scenarioId: string): void {
    const timer = this.pvRelationProtocolPollTimers.get(scenarioId);
    if (timer !== undefined) globalThis.clearTimeout(timer);
    this.pvRelationProtocolPollTimers.delete(scenarioId);
  }

  private clearPvRelationProtocolStopTimer(scenarioId: string): void {
    const timer = this.pvRelationProtocolStopTimers.get(scenarioId);
    if (timer !== undefined) globalThis.clearTimeout(timer);
    this.pvRelationProtocolStopTimers.delete(scenarioId);
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
      parameterGenerationHistory: Object.freeze([]),
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
      presentationBeatEstimate: null,
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
      hemodynamicAnalysisCoordinator: null,
      pvRelationAnalysisCoordinator: null,
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
    const protocolKey = protocolCacheKey(id, "guyton-starling");
    this.clearHemodynamicProtocolStopTimer(protocolKey);
    for (const [demandId, demand] of this.hemodynamicProtocolDemands) {
      if (demand.scenarioId === id) {
        this.hemodynamicProtocolDemands.delete(demandId);
      }
    }
    this.hemodynamicProtocols.delete(protocolKey);
    this.activeHemodynamicProtocolRequests.delete(protocolKey);
    this.removeProtocolSeriesKey(protocolKey);
    this.clearPvRelationProtocolPollTimer(id);
    this.clearPvRelationProtocolStopTimer(id);
    for (const [demandId, demand] of this.pvRelationProtocolDemands) {
      if (demand.scenarioId === id) {
        this.pvRelationProtocolDemands.delete(demandId);
      }
    }
    this.pvRelationProtocols.delete(id);
    this.activePvRelationProtocolRequests.delete(id);
    this.removePvRelationProtocolSeriesKey(id);
    this.publishDescriptors();
    this.publishFrames();
    this.publishProtocols();
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
    for (const timer of this.hemodynamicProtocolStopTimers.values()) {
      globalThis.clearTimeout(timer);
    }
    this.hemodynamicProtocolStopTimers.clear();
    for (const timer of this.pvRelationProtocolPollTimers.values()) {
      globalThis.clearTimeout(timer);
    }
    this.pvRelationProtocolPollTimers.clear();
    for (const timer of this.pvRelationProtocolStopTimers.values()) {
      globalThis.clearTimeout(timer);
    }
    this.pvRelationProtocolStopTimers.clear();
    this.transientMetricBeatCache.clear();
    this.hemodynamicProtocols.clear();
    this.activeHemodynamicProtocolRequests.clear();
    this.hemodynamicProtocolDemands.clear();
    this.hemodynamicProtocolSeriesSnapshot =
      createScientificHemodynamicCurveHistoryStateV1();
    this.pvRelationProtocols.clear();
    this.activePvRelationProtocolRequests.clear();
    this.pvRelationProtocolDemands.clear();
    this.pvRelationProtocolSeriesSnapshot =
      createScientificHemodynamicCurveHistoryStateV1();
    this.publishDescriptors();
    this.publishFrames();
    this.publishProtocols();
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
      this.reconcileHemodynamicProtocolDemandsForScenario(
        entry.descriptor.id,
      );
      this.reconcilePvRelationProtocolDemandForScenario(entry.descriptor.id);
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
    const activeRequest = this.activeHemodynamicProtocolRequests.get(guytonKey);
    if (
      entry.runtime !== null
      && activeRequest?.calculationSource === "visible-period1-source"
      && activeRequest.sessionId !== null
      && activeGuyton?.status === "running"
      && activeGuyton.jobSnapshot !== null
    ) {
      this.cancelGuytonStarlingJobBestEffort(
        entry.runtime.client,
        activeRequest.sessionId,
        activeGuyton.jobSnapshot.jobId,
      );
    }
    this.clearProtocolPollTimer(guytonKey);
    this.clearHemodynamicProtocolStopTimer(guytonKey);
    this.activeHemodynamicProtocolRequests.delete(guytonKey);
    const pvRelationActive = this.activePvRelationProtocolRequests.get(
      entry.descriptor.id,
    );
    const pvRelationPresentation = this.pvRelationProtocols.get(
      entry.descriptor.id,
    );
    if (
      entry.runtime !== null
      && pvRelationActive !== undefined
      && pvRelationActive.calculationSource === "visible-period1-source"
      && pvRelationActive.sessionId !== null
      && pvRelationPresentation?.status === "running"
      && pvRelationPresentation.jobSnapshot !== null
    ) {
      this.cancelPvRelationJobBestEffort(
        entry.runtime.client,
        pvRelationActive.sessionId,
        pvRelationPresentation.jobSnapshot.jobId,
      );
    }
    this.clearPvRelationProtocolPollTimer(entry.descriptor.id);
    this.clearPvRelationProtocolStopTimer(entry.descriptor.id);
    this.activePvRelationProtocolRequests.delete(entry.descriptor.id);
    this.disposeHemodynamicAnalysisCoordinator(entry);
    this.disposePvRelationAnalysisCoordinator(entry);
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

  private removeProtocolSeriesKey(key: string): void {
    if (!(key in this.hemodynamicProtocolSeriesSnapshot.scenarios)) return;
    const { [key]: _removed, ...scenarios } =
      this.hemodynamicProtocolSeriesSnapshot.scenarios;
    this.hemodynamicProtocolSeriesSnapshot = Object.freeze({
      historyLimit: this.hemodynamicProtocolSeriesSnapshot.historyLimit,
      scenarios: Object.freeze(scenarios),
    });
  }

  private removePvRelationProtocolSeriesKey(scenarioId: string): void {
    if (!(scenarioId in this.pvRelationProtocolSeriesSnapshot.scenarios)) return;
    const { [scenarioId]: _removed, ...scenarios } =
      this.pvRelationProtocolSeriesSnapshot.scenarios;
    this.pvRelationProtocolSeriesSnapshot = Object.freeze({
      historyLimit: this.pvRelationProtocolSeriesSnapshot.historyLimit,
      scenarios: Object.freeze(scenarios),
    });
  }
}

function protocolCacheKey(
  scenarioId: string,
  kind: ScientificProductHemodynamicProtocolKindV1,
): string {
  return `${scenarioId}:${kind}`;
}

function sameHemodynamicProtocolDemand(
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

function effectiveHemodynamicProtocolDetailMode(
  modes: readonly ScientificProductHemodynamicProtocolDetailModeV1[],
): ScientificProductHemodynamicProtocolDetailModeV1 {
  const hasStandard = modes.includes("standard");
  const hasSettledReference = modes.includes("settled-reference");
  if (
    modes.includes("compare")
    || (hasStandard && hasSettledReference)
  ) return "compare";
  return hasSettledReference ? "settled-reference" : "standard";
}

function hemodynamicDetailModeSatisfies(
  available: ScientificProductHemodynamicProtocolDetailModeV1,
  requested: ScientificProductHemodynamicProtocolDetailModeV1,
): boolean {
  return available === requested || available === "compare";
}

const EMPTY_HEMODYNAMIC_PROTOCOL_PRESENTATIONS_V1 = Object.freeze({
  "guyton-starling": Object.freeze({
    kind: "guyton-starling" as const,
    detailMode: "compare" as const,
    status: "idle" as const,
    calculationSource: null,
    sourceIdentity: null,
    result: null,
    jobSnapshot: null,
    errorMessage: null,
  }),
}) satisfies Readonly<Record<
  ScientificProductHemodynamicProtocolKindV1,
  ScientificProductHemodynamicProtocolPresentationV1
>>;

const EMPTY_HEMODYNAMIC_PROTOCOL_SERIES_V1: ScientificProductHemodynamicProtocolSeriesV1 =
  Object.freeze({
    current: null,
    pending: null,
    history: Object.freeze([]),
    lastFailure: null,
  });

const EMPTY_PV_RELATION_PROTOCOL_PRESENTATION_V1:
  ScientificProductPvRelationProtocolPresentationV1 = Object.freeze({
    kind: "pv-relations" as const,
    status: "idle" as const,
    calculationSource: null,
    sourceIdentity: null,
    result: null,
    jobSnapshot: null,
    errorMessage: null,
  });

const EMPTY_PV_RELATION_PROTOCOL_SERIES_V1:
  ScientificProductPvRelationProtocolSeriesV1 = Object.freeze({
    current: null,
    pending: null,
    history: Object.freeze([]),
    lastFailure: null,
  });

function protocolSourceIdentityFromSource(
  source: ScientificWorkbenchResearchControlSourceV0,
): ScientificProductHemodynamicProtocolSourceIdentityV1 {
  return Object.freeze({
    revision: source.context.stateIdentity.revision,
    acceptedTimeSec: source.context.stateIdentity.acceptedTimeSec,
    totalBloodVolumeMl: source.context.stateIdentity.totalBloodVolumeMl,
    parameterEpoch: source.context.parameterEpoch,
    controlStateSha256: source.context.controlState.targetStateSha256,
    calculationSource: "visible-period1-source",
  });
}

function protocolSourceIdentityFromLiveCandidate(
  candidate: NonNullable<
    ReturnType<ScientificWorkbenchResearchControlStoreV0["getSnapshot"]>["candidate"]
  >,
): ScientificProductHemodynamicProtocolSourceIdentityV1 {
  return Object.freeze({
    revision: candidate.boundaryFrame.revision,
    acceptedTimeSec: candidate.boundaryFrame.acceptedTimeSec,
    totalBloodVolumeMl: candidate.context.stateIdentity.totalBloodVolumeMl,
    parameterEpoch: candidate.context.parameterEpoch,
    controlStateSha256: candidate.context.controlState.targetStateSha256,
    calculationSource:
      SCIENTIFIC_PRODUCT_HEMODYNAMIC_ANALYSIS_PROVENANCE_V1,
  });
}

function protocolParameterSourceIdentityKey(
  source: ScientificProductHemodynamicProtocolSourceIdentityV1,
): string {
  return [
    source.parameterEpoch,
    source.controlStateSha256,
    source.totalBloodVolumeMl,
    source.calculationSource,
  ].join(":");
}

function pvRelationSourceIdentityKey(
  descriptor: ScientificProductScenarioDescriptorV1,
  source: ScientificProductHemodynamicProtocolSourceIdentityV1,
): string {
  return [
    descriptor.source.releaseSha256,
    descriptor.source.caseId,
    source.controlStateSha256,
    source.totalBloodVolumeMl,
    MAIN_WIRE_SCIENTIFIC_PV_RELATIONS_PROTOCOL_V3_CACHE_IDENTITY,
  ].join(":");
}

function samePvRelationParameterSourceV1(
  descriptor: ScientificProductScenarioDescriptorV1,
  left: ScientificProductHemodynamicProtocolSourceIdentityV1 | null,
  right: ScientificProductHemodynamicProtocolSourceIdentityV1 | null,
): boolean {
  return left !== null
    && right !== null
    && pvRelationSourceIdentityKey(descriptor, left)
      === pvRelationSourceIdentityKey(descriptor, right);
}

function sameProtocolSourceIdentity(
  left: ScientificProductHemodynamicProtocolSourceIdentityV1 | null,
  right: ScientificProductHemodynamicProtocolSourceIdentityV1 | null,
): boolean {
  return left !== null && right !== null
    && left.revision === right.revision
    && left.acceptedTimeSec === right.acceptedTimeSec
    && left.totalBloodVolumeMl === right.totalBloodVolumeMl
    && left.parameterEpoch === right.parameterEpoch
    && left.controlStateSha256 === right.controlStateSha256
    && left.calculationSource === right.calculationSource;
}

function sameProtocolJobSourceIdentity(
  left: Readonly<{
    revision: number;
    acceptedTimeSec: number;
    fixedTotalBloodVolumeMl: number;
  }>,
  right: ScientificProductHemodynamicProtocolSourceIdentityV1,
): boolean {
  return left.revision === right.revision
    && left.acceptedTimeSec === right.acceptedTimeSec
    && left.fixedTotalBloodVolumeMl === right.totalBloodVolumeMl;
}

function isRenderableHemodynamicJobSnapshot(
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

function isRenderablePvRelationJobSnapshot(
  snapshot: MainWireScientificPvRelationJobSnapshotV1,
): boolean {
  return snapshot.beats.filter((beat) =>
    beat.valid
    && beat.endDiastolic !== null
    && beat.endSystolic !== null).length >= 2;
}

function nextProtocolGenerationSequence(
  series: ScientificProductHemodynamicProtocolSeriesV1 | null,
  generationId: string,
): number {
  const generation = series?.pending?.generationId === generationId
    ? series.pending
    : series?.current?.generationId === generationId
      ? series.current
      : null;
  return (generation?.sequence ?? -1) + 1;
}

function nextPvRelationGenerationSequence(
  series: ScientificProductPvRelationProtocolSeriesV1,
  generationId: string,
): number {
  const generation = series.pending?.generationId === generationId
    ? series.pending
    : series.current?.generationId === generationId
      ? series.current
      : null;
  return (generation?.sequence ?? -1) + 1;
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
