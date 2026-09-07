import { cloneAndFreezeStudioJson, studioCanonicalJsonStringify } from "@/domain/json/CanonicalJson";
import type { StudioJsonValueV2 } from "@/studio/contracts/v2/json";
import type { StudioSimulationScenarioInputV2 } from "@/studio/contracts/v2/simulation";
import { MAIN_WIRE_INTEGRATED_STUDIO_STANDARD72_MODEL_ID_V1 } from "./MainWireIntegratedStudioModelIdentityV1";
import { MAIN_WIRE_STANDARD71_BASELINE_HEMODYNAMIC_INPUTS_V1,
  MAIN_WIRE_STANDARD71_BASELINE_MECHANISM_INPUTS_V1 } from "@/engine/myocardium/experiments/MainWireIntegratedModelStandard71FixtureV1";
import type { MainWireIntegratedModelStandard72CheckpointV1 } from "@/engine/myocardium/MainWireIntegratedModelStandard72CheckpointV1";
import { createMainWireIntegratedStudioStandard72CoreReleaseV1,
  MAIN_WIRE_INTEGRATED_STUDIO_ROUNDED_EJECTION_DEFAULT_FIXTURE_V1 } from "./MainWireIntegratedStudioSelectedAorticOutflowExactModelV1";
import checkpointJson from "./standard72-settled-baseline-checkpoint.json";
import launchCheckpointJson from "./standard72-launch-checkpoint.json";
import bindingEvidence from "./standard72-baseline-binding-evidence.json";

export const MAIN_WIRE_STANDARD72_DEFAULT_FIXTURE_V1 = Object.freeze({
  ...MAIN_WIRE_INTEGRATED_STUDIO_ROUNDED_EJECTION_DEFAULT_FIXTURE_V1,
  hemodynamicResearchInputs: MAIN_WIRE_STANDARD71_BASELINE_HEMODYNAMIC_INPUTS_V1,
  mechanismResearchInputs: MAIN_WIRE_STANDARD71_BASELINE_MECHANISM_INPUTS_V1,
});
export const MAIN_WIRE_STANDARD72_QUALIFICATION_CHECKPOINT_V1 = cloneAndFreezeStudioJson(checkpointJson) as unknown as MainWireIntegratedModelStandard72CheckpointV1;
export const MAIN_WIRE_STANDARD72_SETTLED_CHECKPOINT_V1 = cloneAndFreezeStudioJson(launchCheckpointJson) as unknown as MainWireIntegratedModelStandard72CheckpointV1;
const checkpoint = MAIN_WIRE_STANDARD72_QUALIFICATION_CHECKPOINT_V1;
const launch = MAIN_WIRE_STANDARD72_SETTLED_CHECKPOINT_V1;
if (bindingEvidence.status !== "cold-replay-and-checkpoint-parity-passed"
  || bindingEvidence.modelId !== MAIN_WIRE_INTEGRATED_STUDIO_STANDARD72_MODEL_ID_V1
  || bindingEvidence.priorCheckpointImported !== false
  || bindingEvidence.physicalFixtureId !== checkpoint.modelIdentity.fixtureId
  || checkpoint.checkpointSha256 !== bindingEvidence.checkpoint.checkpointSha256
  || checkpoint.acceptedTimeSec !== bindingEvidence.checkpoint.acceptedTimeSec
  || checkpoint.revision !== bindingEvidence.checkpoint.revision
  || checkpoint.checkpointId !== bindingEvidence.checkpoint.checkpointId
  || bindingEvidence.launchPreparation.sourceCheckpointSha256 !== checkpoint.checkpointSha256
  || bindingEvidence.launchPreparation.sourceAcceptedTimeSec !== checkpoint.acceptedTimeSec
  || bindingEvidence.launchPreparation.targetCheckpointSha256 !== launch.checkpointSha256
  || bindingEvidence.launchPreparation.targetAcceptedTimeSec !== launch.acceptedTimeSec
  || bindingEvidence.launchPreparation.targetRevision !== launch.revision
  || bindingEvidence.launchPreparation.completedBeatUnchanged !== true
  || studioCanonicalJsonStringify(checkpoint.baseStandardCheckpointV2.completedBeatMetrics)
    !== studioCanonicalJsonStringify(launch.baseStandardCheckpointV2.completedBeatMetrics)) {
  throw new Error("Standard72 baseline binding evidence and checkpoint disagree");
}
const defaultCanonical = studioCanonicalJsonStringify(MAIN_WIRE_STANDARD72_DEFAULT_FIXTURE_V1);
const defaultCheckpoint = Object.freeze({ acceptedRevision: launch.revision, acceptedTimeSec: launch.acceptedTimeSec,
  payload: launch as unknown as StudioJsonValueV2 });

function installDefault(scenarios: readonly StudioSimulationScenarioInputV2[]): readonly StudioSimulationScenarioInputV2[] {
  return Object.freeze(scenarios.map(scenario => scenario.checkpoint === undefined
    && studioCanonicalJsonStringify(scenario.fixture) === defaultCanonical
    ? Object.freeze({ ...scenario, checkpoint: defaultCheckpoint }) : scenario));
}

/** Local candidate release: inherited exact outputs/controls/analysis seams,
 * own settled checkpoint. Registry and scientific publication are separate. */
export function createCircleHeartExactModelReleaseV1() {
  const core = createMainWireIntegratedStudioStandard72CoreReleaseV1();
  return Object.freeze({ ...core, executables: Object.freeze({ ...core.executables,
    simulationAdapter: Object.freeze({ ...core.executables.simulationAdapter,
      createSession: (input: Parameters<typeof core.executables.simulationAdapter.createSession>[0]) =>
        core.executables.simulationAdapter.createSession({ ...input, scenarios: installDefault(input.scenarios) }),
    }),
    executionPlan: Object.freeze({ ...core.executables.executionPlan,
      createSession: (input: Parameters<typeof core.executables.executionPlan.createSession>[0]) =>
        core.executables.executionPlan.createSession({ ...input, scenarios: installDefault(input.scenarios) }),
    }),
  }) });
}
