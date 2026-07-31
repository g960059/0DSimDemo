import type {
  MainWireIntegratedModelCheckpointContextV3,
} from "@/engine/myocardium/MainWireIntegratedModelCheckpointV3";
import type {
  MainWireIntegratedModelAcceptedStateV3,
} from "@/engine/myocardium/MainWireIntegratedModelTransactionV3";
import {
  createMainWireIntegratedModelRegularSinusAllOffCheckpointContextV3,
  createMainWireIntegratedModelRegularSinusAllOffFixtureV3,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicSteadyV3";
import type {
  MainWireNormalAdultFiveWallMechanicsStateV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallClosedLoopV1";
type WallState = MainWireNormalAdultFiveWallMechanicsStateV1;

export type MainWireIntegratedModelRuntimeV3 = ReturnType<
  typeof createMainWireIntegratedModelRegularSinusAllOffFixtureV3
>;

/**
 * Canonical V3 numerical runtime constructor.
 *
 * Studio runtime, exact restore, periodic qualification, and Snapshot
 * checkpointing all use this one regular-sinus / all-off / zero-inertance
 * fixture.
 */
export async function createMainWireIntegratedModelRuntimeV3(
): Promise<MainWireIntegratedModelRuntimeV3> {
  return createMainWireIntegratedModelRegularSinusAllOffFixtureV3();
}

export function mainWireIntegratedModelCheckpointContextV3(
  runtime: MainWireIntegratedModelRuntimeV3,
  _state: MainWireIntegratedModelAcceptedStateV3<WallState>,
): MainWireIntegratedModelCheckpointContextV3<WallState> {
  return createMainWireIntegratedModelRegularSinusAllOffCheckpointContextV3(
    runtime,
  );
}
