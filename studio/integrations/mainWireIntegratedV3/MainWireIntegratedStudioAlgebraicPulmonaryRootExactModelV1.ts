import type {
  MainWireIntegratedModelStandard70CheckpointV1,
} from "@/engine/myocardium/MainWireIntegratedModelStandard70CheckpointV1";
import {
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_BASELINE_HEMODYNAMIC_INPUTS_V1,
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_BASELINE_MECHANISM_INPUTS_V1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelStandard70BaselineV1";
import {
  cloneAndFreezeStudioJson,
  studioCanonicalJsonStringify,
} from "@/domain/json/CanonicalJson";
import type { StudioJsonValueV2 } from "@/studio/contracts/v2/json";
import type {
  StudioSimulationScenarioInputV2,
} from "@/studio/contracts/v2/simulation";
import {
  assertExactModelKernelManifestV3,
} from "@/studio/contracts/v2/modelSurface";
import {
  createMainWireIntegratedStudioAlgebraicPulmonaryRootCoreReleaseV1,
  MAIN_WIRE_INTEGRATED_STUDIO_ROUNDED_EJECTION_DEFAULT_FIXTURE_V1,
  type MainWireIntegratedStudioSelectedAorticOutflowExactReleaseV1,
} from "./MainWireIntegratedStudioSelectedAorticOutflowExactModelV1";
import {
  validateMainWireIntegratedStudioStandard70BaselineValidationV1,
} from "./MainWireIntegratedStudioStandard70BaselineValidationV1";
import settledBaselineCheckpointJsonV1 from
  "./algebraic-pulmonary-root-standard70-settled-baseline-checkpoint.json";
import baselineValidationJsonV1 from
  "./algebraic-pulmonary-root-standard70-baseline-validation.json";

export const MAIN_WIRE_INTEGRATED_STUDIO_ALGEBRAIC_PULMONARY_ROOT_DEFAULT_FIXTURE_V1 =
  Object.freeze({
    ...MAIN_WIRE_INTEGRATED_STUDIO_ROUNDED_EJECTION_DEFAULT_FIXTURE_V1,
    hemodynamicResearchInputs:
      MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_BASELINE_HEMODYNAMIC_INPUTS_V1,
    mechanismResearchInputs:
      MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_BASELINE_MECHANISM_INPUTS_V1,
  });

export const MAIN_WIRE_INTEGRATED_STUDIO_ALGEBRAIC_PULMONARY_ROOT_SETTLED_CHECKPOINT_V1 =
  cloneAndFreezeStudioJson(
    settledBaselineCheckpointJsonV1,
  ) as unknown as MainWireIntegratedModelStandard70CheckpointV1;

export const MAIN_WIRE_INTEGRATED_STUDIO_ALGEBRAIC_PULMONARY_ROOT_VALIDATION_REPORT_V1 =
  validateMainWireIntegratedStudioStandard70BaselineValidationV1(
    cloneAndFreezeStudioJson(baselineValidationJsonV1),
  );

const checkpointClock =
  MAIN_WIRE_INTEGRATED_STUDIO_ALGEBRAIC_PULMONARY_ROOT_VALIDATION_REPORT_V1
    .checkpoint;
const settledCheckpoint =
  MAIN_WIRE_INTEGRATED_STUDIO_ALGEBRAIC_PULMONARY_ROOT_SETTLED_CHECKPOINT_V1;
if (
  settledCheckpoint.checkpointId !== checkpointClock.checkpointId
  || settledCheckpoint.revision !== checkpointClock.revision
  || settledCheckpoint.acceptedTimeSec !== checkpointClock.acceptedTimeSec
  || settledCheckpoint.checkpointSha256 !== checkpointClock.checkpointSha256
) {
  throw new Error(
    "Standard70 settled checkpoint and baseline validation report disagree",
  );
}

const defaultFixtureCanonical = studioCanonicalJsonStringify(
  MAIN_WIRE_INTEGRATED_STUDIO_ALGEBRAIC_PULMONARY_ROOT_DEFAULT_FIXTURE_V1,
);
const defaultScenarioCheckpoint = Object.freeze({
  acceptedRevision: settledCheckpoint.revision,
  acceptedTimeSec: settledCheckpoint.acceptedTimeSec,
  payload: settledCheckpoint as unknown as StudioJsonValueV2,
});

const STANDARD70_CONTROL_DEFAULTS = new Map<string, number>([
  [
    "hemodynamics.systemic-resistance",
    MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_BASELINE_HEMODYNAMIC_INPUTS_V1
      .systemicResistance,
  ],
  [
    "hemodynamics.arterial-stiffness",
    MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_BASELINE_HEMODYNAMIC_INPUTS_V1
      .arterialStiffness,
  ],
  [
    "myocardium.contractility",
    MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_BASELINE_MECHANISM_INPUTS_V1
      .chamberMechanics.activeTensionScaleByWall.LVFW,
  ],
  ...(["LVFW", "SEP", "RVFW"] as const).flatMap((wallId) => [
    [
      `myocardium.active-tension-scale.${wallId}`,
      MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_BASELINE_MECHANISM_INPUTS_V1
        .chamberMechanics.activeTensionScaleByWall[wallId],
    ] as const,
    [
      `myocardium.passive-stiffness-scale.${wallId}`,
      MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_BASELINE_MECHANISM_INPUTS_V1
        .chamberMechanics.passiveStiffnessScaleByWall[wallId],
    ] as const,
  ]),
]);

export function createCircleHeartExactModelReleaseV1():
  MainWireIntegratedStudioSelectedAorticOutflowExactReleaseV1 {
  const core =
    createMainWireIntegratedStudioAlgebraicPulmonaryRootCoreReleaseV1();
  const manifest = Object.freeze({
    ...core.manifest,
    primitiveControlCatalog: Object.freeze(
      core.manifest.primitiveControlCatalog.map((definition) => {
        const defaultValue = STANDARD70_CONTROL_DEFAULTS.get(
          definition.controlId,
        );
        return defaultValue === undefined
          ? definition
          : Object.freeze({ ...definition, defaultValue });
      }),
    ),
  });
  assertExactModelKernelManifestV3(manifest);
  const simulationAdapter = Object.freeze({
    ...core.executables.simulationAdapter,
    createSession: (input: Parameters<
      typeof core.executables.simulationAdapter.createSession
    >[0]) => core.executables.simulationAdapter.createSession({
      ...input,
      scenarios: installQualifiedDefaultCheckpointV1(input.scenarios),
    }),
  });
  const executionPlan = Object.freeze({
    ...core.executables.executionPlan,
    createSession: (input: Parameters<
      typeof core.executables.executionPlan.createSession
    >[0]) => core.executables.executionPlan.createSession({
      ...input,
      scenarios: installQualifiedDefaultCheckpointV1(input.scenarios),
    }),
  });
  return Object.freeze({
    manifest,
    executables: Object.freeze({
      ...core.executables,
      simulationAdapter,
      executionPlan,
    }),
  });
}

export const createMainWireIntegratedStudioAlgebraicPulmonaryRootSettledReleaseV1 =
  createCircleHeartExactModelReleaseV1;

function installQualifiedDefaultCheckpointV1(
  scenarios: readonly StudioSimulationScenarioInputV2[],
): readonly StudioSimulationScenarioInputV2[] {
  return Object.freeze(scenarios.map((scenario) =>
    scenario.checkpoint !== undefined
      || studioCanonicalJsonStringify(scenario.fixture)
        !== defaultFixtureCanonical
      ? scenario
      : Object.freeze({
          ...scenario,
          checkpoint: defaultScenarioCheckpoint,
        })));
}
