import {
  INTEGRATED_V3_LANE_KIND_V1,
} from "@/engine/myocardium/MainWireIntegratedLaneIdentityV1";
import {
  MainWireIntegratedV3LiveLaneDriverV1,
  type MainWireIntegratedV3LiveLaneDriverOptionsV1,
} from "@/studio/adapters/mainWire/MainWireIntegratedV3LiveLaneDriverV1";
import {
  MainWireNonCoronaryLiveLaneDriverV1,
} from "@/studio/adapters/mainWire/MainWireNonCoronaryLiveLaneDriverV1";
import {
  STUDIO_NONCORONARY_LANE_KIND_V1,
  type StudioIntegratedV3LiveLaneDriverV1,
  type StudioLiveLaneDriverV1,
  type StudioNonCoronaryLiveLaneDriverV1,
} from "@/studio/adapters/mainWire/StudioLiveLaneV1";
import type {
  SimulationRuntimePortV1,
} from "@/studio/contracts/v1/ports";

export type MainWireStudioLiveLaneFactoryRequestV1 =
  | Readonly<{
      laneKind: typeof STUDIO_NONCORONARY_LANE_KIND_V1;
      runtimePort: SimulationRuntimePortV1;
    }>
  | Readonly<{
      laneKind: typeof INTEGRATED_V3_LANE_KIND_V1;
      options?: MainWireIntegratedV3LiveLaneDriverOptionsV1;
    }>;

export function createMainWireStudioLiveLaneDriverV1(
  request: Extract<
    MainWireStudioLiveLaneFactoryRequestV1,
    { laneKind: typeof STUDIO_NONCORONARY_LANE_KIND_V1 }
  >,
): StudioNonCoronaryLiveLaneDriverV1;
export function createMainWireStudioLiveLaneDriverV1(
  request: Extract<
    MainWireStudioLiveLaneFactoryRequestV1,
    { laneKind: typeof INTEGRATED_V3_LANE_KIND_V1 }
  >,
): StudioIntegratedV3LiveLaneDriverV1;
export function createMainWireStudioLiveLaneDriverV1(
  request: MainWireStudioLiveLaneFactoryRequestV1,
): StudioLiveLaneDriverV1 {
  switch (request.laneKind) {
    case STUDIO_NONCORONARY_LANE_KIND_V1:
      return new MainWireNonCoronaryLiveLaneDriverV1(
        request.runtimePort,
      );
    case INTEGRATED_V3_LANE_KIND_V1:
      return new MainWireIntegratedV3LiveLaneDriverV1(
        request.options,
      );
  }
}
