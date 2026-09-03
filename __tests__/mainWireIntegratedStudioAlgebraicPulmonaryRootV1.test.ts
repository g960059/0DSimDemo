import { describe, expect, it } from "vitest";

import {
  mainWireStandard70PreloadReserveDirectionalResponsePassedV1,
} from "@/analysis/policies/mainWire/MainWireStandard70PreloadReservePolicyV1";
import {
  MAIN_WIRE_INTEGRATED_STUDIO_ALGEBRAIC_PULMONARY_ROOT_MODEL_ID_V1,
} from "@/domain/model/MainWireStandardIdentityV1";
import {
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_PV_FORWARD_FLOW_DURATION_OUTPUT_ID_V1,
} from "@/engine/myocardium/MainWireIntegratedModelStandard70OutputRegistryV1";
import {
  evaluateMainWireIntegratedModelStandard70CandidateV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelStandard70BaselineQualificationV1";
import {
  MAIN_WIRE_INTEGRATED_STUDIO_ALGEBRAIC_PULMONARY_ROOT_DEFAULT_FIXTURE_V1,
  MAIN_WIRE_INTEGRATED_STUDIO_ALGEBRAIC_PULMONARY_ROOT_SETTLED_CHECKPOINT_V1,
  MAIN_WIRE_INTEGRATED_STUDIO_ALGEBRAIC_PULMONARY_ROOT_VALIDATION_REPORT_V1,
  createMainWireIntegratedStudioAlgebraicPulmonaryRootSettledReleaseV1,
} from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioAlgebraicPulmonaryRootExactModelV1";
import algebraicPulmonaryRootSurfaceV1 from
  "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioAlgebraicPulmonaryRootSurfaceV1";
import qualifiedBaselineSurfaceV1 from
  "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioQualifiedBaselineSurfaceV1";
import {
  resolveRegisteredExactModelBaselineValidationV1,
} from "@/studio/registry/RegisteredExactModelBaselineValidationV1";

const PV_ET =
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_PV_FORWARD_FLOW_DURATION_OUTPUT_ID_V1;

describe("algebraic-pulmonary-root Standard70 exact Workbench release", () => {
  it("changes only the pulmonary root and inherits the complete latest Surface", () => {
    const release =
      createMainWireIntegratedStudioAlgebraicPulmonaryRootSettledReleaseV1();
    expect(release.manifest).toMatchObject({
      modelId:
        MAIN_WIRE_INTEGRATED_STUDIO_ALGEBRAIC_PULMONARY_ROOT_MODEL_ID_V1,
      equations: {
        aorticOutflowCirculationProfileId:
          "main-wire-source-aortic-outflow-topology-v3",
        pulmonaryArterialRootProfileId:
          "main-wire-algebraic-pulmonary-arterial-root-profile-v1",
      },
    });
    expect(algebraicPulmonaryRootSurfaceV1).toMatchObject({
      predecessorSurfaceReleaseId: qualifiedBaselineSurfaceV1.surfaceReleaseId,
      derivedOutputCatalog: qualifiedBaselineSurfaceV1.derivedOutputCatalog,
      graphCatalog: qualifiedBaselineSurfaceV1.graphCatalog,
      controlCatalog: qualifiedBaselineSurfaceV1.controlCatalog,
      knobCatalog: qualifiedBaselineSurfaceV1.knobCatalog,
      protocolCatalog: qualifiedBaselineSurfaceV1.protocolCatalog,
    });
    expect(algebraicPulmonaryRootSurfaceV1.exposedExactOutputIds).toEqual([
      ...qualifiedBaselineSurfaceV1.exposedExactOutputIds,
      PV_ET,
    ]);
  });

  it("starts at the settled qualified baseline with every left and right gate passed", async () => {
    const release =
      createMainWireIntegratedStudioAlgebraicPulmonaryRootSettledReleaseV1();
    const validation =
      MAIN_WIRE_INTEGRATED_STUDIO_ALGEBRAIC_PULMONARY_ROOT_VALIDATION_REPORT_V1;
    expect(resolveRegisteredExactModelBaselineValidationV1(
      MAIN_WIRE_INTEGRATED_STUDIO_ALGEBRAIC_PULMONARY_ROOT_MODEL_ID_V1,
    )).toEqual(validation);
    expect(validation.checks).toHaveLength(37);
    expect(validation.checks.every(({ status }) => status === "passed"))
      .toBe(true);
    expect(validation.measurements.LVP.significantPeakCount).toBe(1);
    expect(validation.measurements.RVP.significantPeakCount).toBe(1);
    expect(validation.measurements.pulmonaryValve).toMatchObject({
      ejectionTimeSec: expect.any(Number),
      meanGradientMmHg: expect.any(Number),
      peakGradientMmHg: expect.any(Number),
    });
    for (const side of [
      validation.preloadReserve.left,
      validation.preloadReserve.right,
    ]) {
      expect([
        side.hypovolemic,
        side.hypervolemic,
      ].every(mainWireStandard70PreloadReserveDirectionalResponsePassedV1))
        .toBe(true);
    }

    const runtimeSessionId = "standard70/settled-default";
    const scenarioId = "baseline";
    await release.executables.simulationAdapter.createSession({
      runtimeSessionId,
      scenarios: [{
        scenarioId,
        fixture:
          MAIN_WIRE_INTEGRATED_STUDIO_ALGEBRAIC_PULMONARY_ROOT_DEFAULT_FIXTURE_V1,
      }],
    });
    try {
      const frame = release.executables.simulationAdapter.currentFrame({
        runtimeSessionId,
        scenarioId,
      });
      expect(frame).toMatchObject({
        modelId:
          MAIN_WIRE_INTEGRATED_STUDIO_ALGEBRAIC_PULMONARY_ROOT_MODEL_ID_V1,
        acceptedRevision: validation.checkpoint.revision,
        acceptedTimeSec: validation.checkpoint.acceptedTimeSec,
      });
      expect(frame.outputs[PV_ET]?.value).toBeCloseTo(
        validation.measurements.pulmonaryValve.ejectionTimeSec,
        8,
      );
    } finally {
      release.executables.simulationAdapter.disposeSession(runtimeSessionId);
    }
  });

  it("keeps the runtime usable after the previously failing minimum-TBV edit", async () => {
    const release =
      createMainWireIntegratedStudioAlgebraicPulmonaryRootSettledReleaseV1();
    const runtimeSessionId = "standard70/tbv-minimum";
    const scenarioId = "baseline";
    await release.executables.simulationAdapter.createSession({
      runtimeSessionId,
      scenarios: [{
        scenarioId,
        fixture:
          MAIN_WIRE_INTEGRATED_STUDIO_ALGEBRAIC_PULMONARY_ROOT_DEFAULT_FIXTURE_V1,
      }],
    });
    try {
      const source = release.executables.simulationAdapter.currentFrame({
        runtimeSessionId,
        scenarioId,
      });
      const changed = await release.executables.simulationAdapter.applyControl({
        runtimeSessionId,
        scenarioId,
        controlId: "hemodynamics.total-blood-volume-ml",
        value: 4_200,
        expectedInputEpoch: source.inputEpoch,
      });
      expect(changed.inputEpoch).toBe(source.inputEpoch + 1);
      const advanced =
        await release.executables.simulationAdapter.advancePresentationBatch!({
          runtimeSessionId,
          scenarioId,
          stepCount: 8,
          presentationOutputIds: [
            "hemodynamics.pressure.absolute.LV",
            "hemodynamics.pressure.absolute.RV",
          ],
        });
      expect(advanced.terminalFrame.acceptedTimeSec)
        .toBeGreaterThan(changed.acceptedTimeSec);
      expect(Object.values(advanced.terminalFrame.outputs).every(
        ({ value }) => value === null || Number.isFinite(value),
      )).toBe(true);
    } finally {
      release.executables.simulationAdapter.disposeSession(runtimeSessionId);
    }
  }, 60_000);

  it("reconfirms a verified fitting checkpoint in exactly three cycles", async () => {
    const qualification =
      await evaluateMainWireIntegratedModelStandard70CandidateV1({
        initialization: Object.freeze({
          kind: "standard70-exact-checkpoint" as const,
          checkpoint:
            MAIN_WIRE_INTEGRATED_STUDIO_ALGEBRAIC_PULMONARY_ROOT_SETTLED_CHECKPOINT_V1,
        }),
      });
    expect(qualification.completedCycleCount).toBe(3);
    expect(qualification.classification.status).toBe("period1-converged");
    expect(qualification.checks.every(({ status }) => status === "passed"))
      .toBe(true);
  }, 30_000);
});
