import type {
  SimulationRuntimePortV1,
} from "@/studio/contracts/v1/ports";
import type {
  RuntimePresentationSignalChannelRefV1,
  RuntimePresentationSignalEventV1,
} from "@/studio/contracts/v1/runtime";
import {
  STUDIO_NONCORONARY_EXECUTION_IDENTITY_V1,
  STUDIO_NONCORONARY_LANE_DESCRIPTOR_V1,
  STUDIO_NONCORONARY_LANE_KIND_V1,
  type OpenStudioNonCoronaryLiveLaneCommandV1,
  type StudioNonCoronaryLiveLaneDriverV1,
  type StudioNonCoronaryLiveLaneOpenedV1,
} from "@/studio/adapters/mainWire/StudioLiveLaneV1";

/**
 * Additive stream-shaped view over SimulationRuntimePortV1. Every operation is
 * a direct delegation; the existing adapter remains the numerical and
 * lifecycle owner.
 */
export class MainWireNonCoronaryLiveLaneDriverV1
implements StudioNonCoronaryLiveLaneDriverV1 {
  readonly laneKind = STUDIO_NONCORONARY_LANE_KIND_V1;
  readonly laneDescriptor = STUDIO_NONCORONARY_LANE_DESCRIPTOR_V1;
  readonly executionIdentity = STUDIO_NONCORONARY_EXECUTION_IDENTITY_V1;
  readonly runtimePort: SimulationRuntimePortV1;
  readonly presentationScheduling;
  readonly researchTransitions;

  constructor(runtimePort: SimulationRuntimePortV1) {
    this.runtimePort = runtimePort;
    this.presentationScheduling = Object.freeze({
      suspendPresentationSignalChannel: (
        channel: RuntimePresentationSignalChannelRefV1,
      ) => this.runtimePort.suspendPresentationSignalChannel(channel),
      resumePresentationSignalChannel: (
        channel: RuntimePresentationSignalChannelRefV1,
        expectedStreamEpoch: number,
      ) => this.runtimePort.resumePresentationSignalChannel(
        channel,
        expectedStreamEpoch,
      ),
    });
    this.researchTransitions = Object.freeze({
      startTargetIntent: (
        command: Parameters<
          SimulationRuntimePortV1["startTargetIntent"]
        >[0],
      ) => this.runtimePort.startTargetIntent(command),
      promoteSteadyCandidate: (
        command: Parameters<
          SimulationRuntimePortV1["promoteSteadyCandidate"]
        >[0],
      ) => this.runtimePort.promoteSteadyCandidate(command),
    });
  }

  async openSession(
    command: OpenStudioNonCoronaryLiveLaneCommandV1,
  ): Promise<StudioNonCoronaryLiveLaneOpenedV1> {
    const session = await this.runtimePort.openSession(command.command);
    return Object.freeze({
      laneKind: this.laneKind,
      laneDescriptor: this.laneDescriptor,
      executionIdentity: this.executionIdentity,
      session,
    });
  }

  subscribePresentationSignalChannel(
    channel: RuntimePresentationSignalChannelRefV1,
    observer: (event: RuntimePresentationSignalEventV1) => void,
  ) {
    return this.runtimePort.subscribePresentationSignalChannel(
      channel,
      observer,
    );
  }

  closeSession(sessionId: string): Promise<void> {
    return this.runtimePort.closeSession(sessionId);
  }
}
