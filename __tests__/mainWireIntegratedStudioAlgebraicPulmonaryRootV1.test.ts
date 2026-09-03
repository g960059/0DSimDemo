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
  restoreMainWireIntegratedModelStandard68V1,
  type MainWireIntegratedModelStandard68CheckpointV1,
} from "@/engine/myocardium/MainWireIntegratedModelStandard68CheckpointV1";
import {
  evaluateMainWireIntegratedModelStandard70CandidateV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelStandard70BaselineQualificationV1";
import {
  measureMainWireIntegratedModelPulmonaryRootMorphologyV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelStandard70BaselineValidationV1";
import {
  createMainWireIntegratedModelRegularSinusAllOffCheckpointContextV3,
  runMainWireIntegratedModelRegularSinusAllOffCycleV3,
  type MainWireIntegratedModelRegularSinusAllOffFixtureV3,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicSteadyV3";
import {
  createMainWireIntegratedModelRoundedEjectionFixtureV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelRoundedEjectionFixtureV1";
import {
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD69_BASELINE_HEMODYNAMIC_INPUTS_V1,
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD69_BASELINE_MECHANISM_INPUTS_V1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelStandard69BaselineV1";
import {
  cloneAndFreezeStudioJson,
} from "@/domain/json/CanonicalJson";
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
import standard69CheckpointJsonV1 from
  "@/studio/integrations/mainWireIntegratedV3/qualified-baseline-standard69-settled-baseline-checkpoint.json";
import {
  resolveRegisteredExactModelBaselineValidationV1,
} from "@/studio/registry/RegisteredExactModelBaselineValidationV1";
import {
  validateMainWireIntegratedStudioStandard70BaselineValidationV1,
} from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioStandard70BaselineValidationV1";

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
      predecessorSurfaceReleaseId: null,
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
    expect(validation.checks).toHaveLength(41);
    expect(validation.checks.every(({ status }) => status === "passed"))
      .toBe(true);
    expect(validation.measurements.LVP.significantPeakCount).toBe(1);
    expect(validation.measurements.RVP.significantPeakCount).toBe(1);
    expect(validation.measurements.pulmonaryRootMorphology).toMatchObject({
      papSignificantPeakCount: 1,
      pvForwardEpisodeCount: 1,
      pvFlowSignificantPeakCount: 1,
      maximumPostClosurePapReboundMmHg: expect.any(Number),
    });
    expect(validation.measurements.pulmonaryRootMorphology
      .maximumPostClosurePapReboundMmHg).toBeLessThanOrEqual(0.5);
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

  it("rejects the predecessor pulmonary-root ringing phenotype", async () => {
    const fixture = createMainWireIntegratedModelRoundedEjectionFixtureV1(
      MAIN_WIRE_INTEGRATED_MODEL_STANDARD69_BASELINE_HEMODYNAMIC_INPUTS_V1,
      1,
      MAIN_WIRE_INTEGRATED_MODEL_STANDARD69_BASELINE_MECHANISM_INPUTS_V1,
    );
    const restored = await restoreMainWireIntegratedModelStandard68V1(
      Object.freeze({
        base: Object.freeze({
          ...createMainWireIntegratedModelRegularSinusAllOffCheckpointContextV3(
            fixture,
          ),
          mechanismResearchInputs: fixture.mechanismResearchInputs,
        }),
        roundedEjectionAssemblyId: fixture.roundedEjectionAssemblyId,
      }),
      cloneAndFreezeStudioJson(
        standard69CheckpointJsonV1,
      ) as unknown as MainWireIntegratedModelStandard68CheckpointV1,
    );
    const cycle = runMainWireIntegratedModelRegularSinusAllOffCycleV3(
      fixture as unknown as MainWireIntegratedModelRegularSinusAllOffFixtureV3,
      restored.acceptedState,
      1,
      0.002,
    );
    const morphology =
      measureMainWireIntegratedModelPulmonaryRootMorphologyV1(
        cycle.traceSamples,
      );
    expect(morphology.papSignificantPeakCount).toBeGreaterThan(1);
    expect(morphology.pvFlowSignificantPeakCount).toBeGreaterThan(1);
    expect(morphology.maximumPostClosurePapReboundMmHg)
      .toBeGreaterThan(0.5);
  }, 30_000);

  it("rejects a baseline report without pulmonary-root morphology evidence", () => {
    const report =
      MAIN_WIRE_INTEGRATED_STUDIO_ALGEBRAIC_PULMONARY_ROOT_VALIDATION_REPORT_V1;
    expect(() =>
      validateMainWireIntegratedStudioStandard70BaselineValidationV1({
        ...report,
        measurements: {
          ...report.measurements,
          pulmonaryRootMorphology: undefined,
        },
      })).toThrow(/Standard70 baseline validation report is invalid/);
  });

  it("rejects incomplete, duplicate, or unknown Standard70 gate evidence", () => {
    const report =
      MAIN_WIRE_INTEGRATED_STUDIO_ALGEBRAIC_PULMONARY_ROOT_VALIDATION_REPORT_V1;
    const missingInheritedGate = report.checks.slice(1);
    const missingStandard70Gate = report.checks.slice(0, -1);
    const duplicateGate = [
      ...report.checks.slice(0, -1),
      report.checks[0],
    ];
    const unknownGate = [
      ...report.checks.slice(0, -1),
      {
        ...report.checks.at(-1),
        checkId: "waveform.unknown",
      },
    ];
    for (const checks of [
      missingInheritedGate,
      missingStandard70Gate,
      duplicateGate,
      unknownGate,
    ]) {
      expect(() =>
        validateMainWireIntegratedStudioStandard70BaselineValidationV1({
          ...report,
          checks,
        })).toThrow(/Standard70 baseline validation report is invalid/);
    }
  });

  it("rejects right-heart field substitution and an unknown initialization", () => {
    const report =
      MAIN_WIRE_INTEGRATED_STUDIO_ALGEBRAIC_PULMONARY_ROOT_VALIDATION_REPORT_V1;
    const { ejectionTimeSec, ...pulmonaryValveWithoutEt } =
      report.measurements.pulmonaryValve;
    expect(() =>
      validateMainWireIntegratedStudioStandard70BaselineValidationV1({
        ...report,
        measurements: {
          ...report.measurements,
          pulmonaryValve: {
            ...pulmonaryValveWithoutEt,
            substitutedField: ejectionTimeSec,
          },
        },
      })).toThrow(/Standard70 baseline validation report is invalid/);
    expect(() =>
      validateMainWireIntegratedStudioStandard70BaselineValidationV1({
        ...report,
        initializationKind: "unverified-warm-start",
      })).toThrow(/Standard70 baseline validation report is invalid/);
  });

  it("rejects extra pulmonary-root morphology fields", () => {
    const report =
      MAIN_WIRE_INTEGRATED_STUDIO_ALGEBRAIC_PULMONARY_ROOT_VALIDATION_REPORT_V1;
    expect(() =>
      validateMainWireIntegratedStudioStandard70BaselineValidationV1({
        ...report,
        measurements: {
          ...report.measurements,
          pulmonaryRootMorphology: {
            ...report.measurements.pulmonaryRootMorphology,
            unregisteredPeakCount: 1,
          },
        },
      })).toThrow(/Standard70 baseline validation report is invalid/);
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
