import type {
  RunArtifactRefV1,
  RuntimeExecutionIdentityV1,
  SimulationInputRefV1,
  SnapshotEnvelopeRefV1,
} from "./artifacts";
import type {
  ScenarioIdV1,
  Sha256HexV1,
  TargetGenerationV1,
} from "./ids";

/**
 * The only Studio state from which a scientific side analysis may start.
 *
 * This is deliberately an artifact-bound settled source, rather than a
 * presentation frame or a mutable live Worker session. The adapter must load
 * and validate the exact V4 snapshot before allocating/restoring analysis
 * state.
 */
export type StudioSettledAnalysisSourceV1 = Readonly<{
  scenarioId: ScenarioIdV1;
  targetGeneration: TargetGenerationV1;
  sourceRole:
    | "initial-settled-source"
    | "automatic-strict-candidate"
    | "promoted-settled-source";
  targetInputSha256: Sha256HexV1;
  sourceRunRef: RunArtifactRefV1;
  simulationInputRef: SimulationInputRefV1;
  snapshotRef: SnapshotEnvelopeRefV1;
  execution: RuntimeExecutionIdentityV1;
}>;
