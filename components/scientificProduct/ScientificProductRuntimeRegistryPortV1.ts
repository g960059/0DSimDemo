import type {
  ScientificWorkbenchResearchControlStoreV0,
} from "@/components/scientificWorkbench/ScientificWorkbenchResearchControlStoreV0";
import type {
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
import type {
  ScientificProductStudioScenarioStatusV1,
} from "./ScientificProductStudioScenarioControllerV1";

export type ScientificProductRuntimeViewV1 = Readonly<{
  controlStore: ScientificWorkbenchResearchControlStoreV0;
}>;

export type ScientificProductRuntimeCapabilitiesV1 = Readonly<{
  studioRuntime: boolean;
  guytonLoadSeries: boolean;
  pvRelations: boolean;
  vvReports: boolean;
}>;

/**
 * Presentation-facing registry boundary. The Workbench renderer depends on
 * this view only; Worker ownership and Studio coordination stay behind it.
 */
export interface ScientificProductRuntimeRegistryPortV1 {
  /**
   * Optional only while the pre-Studio registry remains in Git history and
   * unit fixtures. New product registries publish capabilities explicitly.
   */
  readonly capabilities?: ScientificProductRuntimeCapabilitiesV1;
  readonly subscribeDescriptors: (listener: () => void) => () => void;
  readonly getDescriptorSnapshot:
    () => readonly ScientificProductScenarioDescriptorV1[];
  readonly subscribeFrames: (listener: () => void) => () => void;
  readonly getFrameVersionSnapshot: () => number;
  readonly subscribeHemodynamicProtocols:
    (listener: () => void) => () => void;
  readonly getHemodynamicProtocolSeriesSnapshot:
    () => ScientificProductHemodynamicProtocolSeriesSnapshotV1;
  readonly getPvRelationProtocolSeriesSnapshot:
    () => ScientificProductPvRelationProtocolSeriesSnapshotV1;

  getRuntime(id: string): ScientificProductRuntimeViewV1 | null;
  getPresentation(id: string): ScientificProductScenarioPresentationV1 | null;
  getHemodynamicProtocolSeries(
    scenarioId: string,
    kind: ScientificProductHemodynamicProtocolKindV1,
  ): ScientificProductHemodynamicProtocolSeriesV1;
  getPvRelationProtocolSeries(
    scenarioId: string,
  ): ScientificProductPvRelationProtocolSeriesV1;
  setHemodynamicProtocolDemand(
    demandId: string,
    demand: ScientificProductHemodynamicProtocolDemandV1 | null,
  ): void;
  setPvRelationProtocolDemand(
    demandId: string,
    demand: ScientificProductPvRelationProtocolDemandV1 | null,
  ): void;
  getStudioStatus?(
    scenarioId: string,
  ): ScientificProductStudioScenarioStatusV1 | null;
  promoteStudioSteadyCandidate?(scenarioId: string): Promise<void>;
  pinStudioSteadyCandidate?(scenarioId: string): Promise<void>;
}
