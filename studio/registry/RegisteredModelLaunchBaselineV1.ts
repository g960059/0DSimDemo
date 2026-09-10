import type { ScenarioCheckpointV2 } from "@/studio/contracts/v2/content";
import type { StudioJsonValueV2, StudioJsonObjectV2 } from "@/studio/contracts/v2/json";
import type { StudioModelWorkerReleaseTicketV2 } from "@/studio/contracts/v2/release";
import { REGISTERED_CURRENT_MODEL_BASELINE_V1, isRegisteredCurrentBaselineFixtureV1,
  resolveRegisteredCurrentModelLaunchV1 } from "./RegisteredCurrentModelBaselineV1";

/** Saved content supplies its own capture; only new sessions use this baseline. */
export function resolveRegisteredModelLaunchDefaultsV1<TFixture extends StudioJsonValueV2>(input: Readonly<{
  ticket: Pick<StudioModelWorkerReleaseTicketV2, "modelId" | "manifest" | "surfaceRelease">;
  defaultFixture: TFixture;
}>): Readonly<{ defaultFixture: TFixture | StudioJsonObjectV2; defaultCheckpoint?: ScenarioCheckpointV2 }> {
  return resolveRegisteredCurrentModelLaunchV1(input)
    ?? Object.freeze({ defaultFixture: input.defaultFixture });
}

export function resolveRegisteredModelLaunchCheckpointV1(
  modelId: string, defaultFixture: StudioJsonValueV2,
): ScenarioCheckpointV2 | undefined {
  return isRegisteredCurrentBaselineFixtureV1(modelId, defaultFixture)
    ? REGISTERED_CURRENT_MODEL_BASELINE_V1.checkpoint : undefined;
}
