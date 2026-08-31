import { describe, expect, it } from "vitest";

import {
  MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3,
  type MainWireIntegratedModelHemodynamicResearchInputsV3,
} from "@/engine/myocardium/MainWireIntegratedModelHemodynamicResearchInputsV3";
import {
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD_66_OUTPUT_IDS_V1,
  type MainWireIntegratedModelStandard66OutputValueV1,
} from "@/engine/myocardium/MainWireIntegratedModelStandard66OutputRegistryV1";
import {
  MAIN_WIRE_NUMERICAL_BASE_TICK_SEC_V1,
  MAIN_WIRE_COUPLED_HEMODYNAMICS_SOLVE_GROUP_ID_V1,
  MAIN_WIRE_NUMERICAL_PRESENTATION_PERIOD_TICKS_V1,
} from "@/engine/executionPlan/MainWireNumericalClockV1";
import {
  bindMainWireFiveWallCoupledExecutionPlanRuntimeV1,
  MAIN_WIRE_FIVE_WALL_COUPLED_SYSTEM_KERNEL_V1_ID,
} from "@/engine/vnext/coupled/MainWireFiveWallCoupledNewtonShadowV1";
import {
  MainWireIntegratedModelStandard66TypedAuthoritySessionV1,
} from "@/engine/vnext/MainWireIntegratedModelStandard66TypedAuthoritySessionV1";
import {
  bindExecutionPlanSolveSystemRuntimeV1,
  executionPlanPresentationBaseTickV1,
  executionPlanTimeAtBaseTickV1,
  prepareBoundExecutionPlanSolveGroupV1,
  resolveBoundExecutionPlanUpdateScheduleV1,
} from "@/runtime/executionPlan/BoundExecutionPlanV1";
import type { ModelContractV2 } from "@/studio/contracts/v2/model";
import {
  STUDIO_COMMON_SNAPSHOT_ADMISSION_ID_V1,
} from "@/studio/contracts/v2/modelSurface";
import {
  MAIN_WIRE_INTEGRATED_STUDIO_SELECTED_AORTIC_OUTFLOW_DEFAULT_FIXTURE_V1,
  MainWireIntegratedStudioSelectedAorticOutflowRuntimeHostV1,
  bindMainWireIntegratedStudioSelectedAorticOutflowExecutionPlanV1,
  createMainWireIntegratedStudioSelectedAorticOutflowKernelV1,
} from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioSelectedAorticOutflowExactModelV1";
import {
  MAIN_WIRE_INTEGRATED_STUDIO_SELECTED_AORTIC_OUTFLOW_MODEL_ID_V1,
} from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioModelIdentityV1";

const ROUTE_PARITY_CASES_V1 = Object.freeze([
  Object.freeze({
    caseId: "default",
    inputs: MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3,
  }),
  Object.freeze({
    caseId: "heart-rate-50",
    inputs: Object.freeze({
      ...MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3,
      heartRateBpm: 50,
    }),
  }),
  Object.freeze({
    caseId: "heart-rate-90",
    inputs: Object.freeze({
      ...MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3,
      heartRateBpm: 90,
    }),
  }),
  Object.freeze({
    caseId: "held-out-coupled-load",
    inputs: Object.freeze({
      systemicResistance: 1.2,
      pulmonaryResistance: 0.75,
      venousTone: 0.5,
      arterialStiffness: 0.9,
      heartRateBpm: 75,
      totalBloodVolumeMl: 6_200,
      peepCmH2O: 10,
    }),
  }),
] satisfies readonly Readonly<{
  caseId: string;
  inputs: MainWireIntegratedModelHemodynamicResearchInputsV3;
}>[]);

describe("Standard66 production route parity V1", () => {
  it.each(ROUTE_PARITY_CASES_V1)(
    "$caseId keeps the production host and direct typed authority byte-equivalent through a complete cycle",
    async ({ caseId, inputs }) => {
      const fixture = Object.freeze({
        ...MAIN_WIRE_INTEGRATED_STUDIO_SELECTED_AORTIC_OUTFLOW_DEFAULT_FIXTURE_V1,
        hemodynamicResearchInputs: inputs,
      });
      const runtimeSessionId = `route-parity/${caseId}`;
      const scenarioId = "scenario";
      const production =
        new MainWireIntegratedStudioSelectedAorticOutflowRuntimeHostV1();
      await production.createSession(runtimeSessionId, [{
        scenarioId,
        fixture,
      }]);
      const directRoute = directExecutionPlanRouteV1();
      const direct =
        await MainWireIntegratedModelStandard66TypedAuthoritySessionV1.create(
          inputs,
          1,
          directRoute.initialization,
          fixture.mechanismResearchInputs,
        );

      expect(production.currentFrame(runtimeSessionId, scenarioId).outputs)
        .toEqual(portableOutputsV1(
          direct.projectCurrentAcceptedStandard66ValuesV1(
            MAIN_WIRE_INTEGRATED_MODEL_STANDARD_66_OUTPUT_IDS_V1,
          ),
        ));

      const schedule = directRoute.updateSchedule;
      expect(schedule.baseTickSec).toBe(
        MAIN_WIRE_NUMERICAL_BASE_TICK_SEC_V1,
      );
      expect(schedule.presentationPeriodTicks).toBe(
        MAIN_WIRE_NUMERICAL_PRESENTATION_PERIOD_TICKS_V1,
      );
      expect(schedule.presentationStepSec).toBe(0.002);
      expect(schedule.groups).toHaveLength(1);
      const presentationStepSec = MAIN_WIRE_NUMERICAL_BASE_TICK_SEC_V1
        * MAIN_WIRE_NUMERICAL_PRESENTATION_PERIOD_TICKS_V1;
      const completeCycleStepCount = Math.ceil(
        (60 / inputs.heartRateBpm) / presentationStepSec,
      ) + 2;
      for (let ordinal = 1; ordinal <= completeCycleStepCount; ordinal += 1) {
        const productionFrame = production.advanceOnePresentationStep(
          runtimeSessionId,
          scenarioId,
        );
        const targetTimeSec = executionPlanTimeAtBaseTickV1(
          schedule,
          executionPlanPresentationBaseTickV1(schedule, 0, ordinal),
        );
        const directProjection = direct
          .advanceToPresentationTimeWithStandard66SelectedOutputProjectionV1(
            targetTimeSec,
            MAIN_WIRE_INTEGRATED_MODEL_STANDARD_66_OUTPUT_IDS_V1,
          );

        expect(directProjection.advance.status, `${caseId}/${ordinal}`)
          .toBe("advanced");
        expect(directProjection.projectedValues, `${caseId}/${ordinal}`)
          .not.toBeNull();
        expect(productionFrame.acceptedRevision, `${caseId}/${ordinal}`)
          .toBe(directProjection.advance.acceptedRevision);
        expect(productionFrame.acceptedTimeSec, `${caseId}/${ordinal}`)
          .toBe(directProjection.advance.acceptedTimeSec);
        expect(productionFrame.outputs, `${caseId}/${ordinal}`).toEqual(
          portableOutputsV1(directProjection.projectedValues!),
        );
      }

      const directCheckpoint = await direct.checkpointStandard66Exact();
      const productionCapture = await production.captureDesiredContent({
        experimentId: `experiment/${caseId}`,
        model: exactContractV1(),
        desiredContent: Object.freeze({
          modelId:
            MAIN_WIRE_INTEGRATED_STUDIO_SELECTED_AORTIC_OUTFLOW_MODEL_ID_V1,
          surfaceSeriesId: "route-parity-surface",
          scenarios: Object.freeze([Object.freeze({
            scenarioId,
            label: caseId,
            fixture,
          })]),
          surface: emptySurfaceV1(),
        }),
        correlation: Object.freeze({
          runtimeSessionId,
          scenarios: Object.freeze([Object.freeze({
            scenarioId,
            expectedInputEpoch: 0,
          })]),
        }),
      });
      expect(productionCapture.content.scenarios[0]!.capture.checkpoint.payload)
        .toEqual(directCheckpoint);
      production.closeSession(runtimeSessionId);
    },
    120_000,
  );
});

function directExecutionPlanRouteV1() {
  const boundExecutionPlan =
    bindMainWireIntegratedStudioSelectedAorticOutflowExecutionPlanV1();
  const schedule = resolveBoundExecutionPlanUpdateScheduleV1(
    boundExecutionPlan,
  );
  const updateGroup = schedule.groups[0];
  if (
    updateGroup === undefined
    || updateGroup.solveGroupId
      !== MAIN_WIRE_COUPLED_HEMODYNAMICS_SOLVE_GROUP_ID_V1
  ) {
    throw new Error("Standard66 route-parity solve group differs");
  }
  const prepared = prepareBoundExecutionPlanSolveGroupV1(
    boundExecutionPlan,
    updateGroup.solveGroupId,
  );
  return Object.freeze({
    updateSchedule: schedule,
    initialization: Object.freeze({
      boundExecutionPlan,
      coupledNewtonWorkspace: bindExecutionPlanSolveSystemRuntimeV1(
        boundExecutionPlan,
        updateGroup.solveGroupId,
        prepared,
        Object.freeze([Object.freeze({
          systemKernelId: MAIN_WIRE_FIVE_WALL_COUPLED_SYSTEM_KERNEL_V1_ID,
          bind: bindMainWireFiveWallCoupledExecutionPlanRuntimeV1,
        })]),
      ),
    }),
  });
}

function portableOutputsV1(
  values: Readonly<
    Record<string, MainWireIntegratedModelStandard66OutputValueV1>
  >,
) {
  return Object.freeze(Object.fromEntries(Object.values(values).map((value) => [
    value.outputId,
    Object.freeze({
      outputId: value.outputId,
      value: Object.is(value.value, -0) ? 0 : value.value,
      availability: value.availability,
      quality: value.quality,
    }),
  ])));
}

function exactContractV1(): ModelContractV2 {
  const kernel =
    createMainWireIntegratedStudioSelectedAorticOutflowKernelV1();
  return Object.freeze({
    modelId: kernel.modelId,
    modelFamilyId: kernel.modelFamilyId,
    displayName: "Selected aortic outflow Standard 66 route parity",
    fixtureSchemaId: kernel.fixtureSchema.fixtureSchemaId,
    checkpointCodecId: kernel.checkpointCodec.checkpointCodecId,
    snapshotGateId: STUDIO_COMMON_SNAPSHOT_ADMISSION_ID_V1,
    controlCatalog: kernel.primitiveControlCatalog,
    outputCatalog: Object.freeze([
      ...kernel.primitiveSignalCatalog,
      ...kernel.modelMetricCatalog,
    ]),
    graphCatalog: Object.freeze([]),
  });
}

function emptySurfaceV1() {
  return Object.freeze({
    graphPanes: Object.freeze([]),
    outputPanes: Object.freeze([]),
    controlPanes: Object.freeze([]),
    note: Object.freeze({ text: "" }),
  });
}
