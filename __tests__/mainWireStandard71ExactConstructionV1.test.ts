import { describe, expect, it } from "vitest";
import { createMainWireIntegratedModelStandard71FixtureV1 as createFixture,
  MAIN_WIRE_STANDARD71_BASELINE_HEMODYNAMIC_INPUTS_V1 as hemodynamics,
  MAIN_WIRE_STANDARD71_BASELINE_MECHANISM_INPUTS_V1 as mechanism,
  MAIN_WIRE_STANDARD71_LAND_PARAMETERS_V1 as land } from "@/engine/myocardium/experiments/MainWireIntegratedModelStandard71FixtureV1";
import { createMainWireBaselineReferenceResearchV1 } from "@/engine/myocardium/experiments/MainWireBaselineReferenceResearchV1";
import { MainWireIntegratedModelStandard71TypedAuthoritySessionV1 as Session } from "@/engine/vnext/MainWireIntegratedModelStandard71TypedAuthoritySessionV1";
import { MainWireIntegratedModelStandard70TypedAuthoritySessionV1 as OldSession } from "@/engine/vnext/MainWireIntegratedModelStandard70TypedAuthoritySessionV1";
import { runMainWireIntegratedModelRegularSinusAllOffCycleV3 as runCycle } from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicSteadyV3";
import { canonicalJsonStringify } from "@/engine/integrity";
import { MainWireBaselineReferenceResearchSessionV1 } from "@/engine/myocardium/experiments/MainWireBaselineReferenceResearchV1";
import { checkpointMainWireIntegratedModelStandard71V1 } from "@/engine/myocardium/MainWireIntegratedModelStandard71CheckpointV1";

function researchFixture() {
  return createMainWireBaselineReferenceResearchV1({ hemodynamicResearchInputs: hemodynamics, mechanismResearchInputs: mechanism,
    parameters: { ventricularTrefPa: 238816.54628141236, systemicArterialComplianceScale: .65 },
    admissionRole: "intervention", aorticRootInertanceScale: 0, ventricularCalciumTimeScale: 1.1,
    ventricularCalciumRiseFraction: .9, ventricularDiastolicCalciumUM: .13, ventricularLandSlackStretch: 1,
    ventricularAffinityCalibration: { caT50RefUM: .6, beta1UM: -1.2 } });
}

describe("Standard71 fixed construction and exact ownership", () => {
  it("retains qualified physical primitives and event history, with distinct identities", () => {
    const fixed = createFixture(), research = researchFixture();
    expect(fixed.hemodynamicResearchInputs).toEqual(research.hemodynamicResearchInputs);
    expect(fixed.mechanismResearchInputs).toEqual(research.mechanismResearchInputs);
    expect(fixed.runtime).toEqual(research.runtime);
    expect(land.values).toEqual(research.researchLandParameters.values);
    expect(land.derived).toEqual(research.researchLandParameters.derived);
    expect(land.strongBridgeDeactivationExit).toEqual(research.researchLandParameters.strongBridgeDeactivationExit);
    expect(fixed.rhythm.configuration.calciumParametersByWall).toEqual(research.rhythm.configuration.calciumParametersByWall);
    const { parameterSetId: fixedId, ...fixedCa } = fixed.coronaryStepInput.calciumDriveParams;
    const { parameterSetId: researchId, ...researchCa } = research.coronaryStepInput.calciumDriveParams;
    expect(fixedCa).toEqual(researchCa);
    expect(fixedId).not.toBe(researchId);
    expect(fixed.provider.parameterIdentityHash).not.toBe(research.provider.parameterIdentityHash);
    expect(land.parameterSetStableHash).not.toBe(research.researchLandParameters.parameterSetStableHash);
    expect(fixed.standard71AssemblyClaim.clinicalValidationClaimed).toBe(false);
  });

  it("reproduces an independently initialized research cycle without importing its checkpoint", () => {
    const fixed = createFixture(), research = researchFixture();
    const actual = runCycle(fixed, fixed.cold.acceptedState, 1, .002);
    const expected = runCycle(research, research.cold.acceptedState, 1, .002);
    expect(actual.traceSamples).toEqual(expected.traceSamples);
    expect(actual.maximumGlobalTotalBloodVolumeErrorMl).toBe(expected.maximumGlobalTotalBloodVolumeErrorMl);
    expect(actual.allDynamicMcsAcceptedFlowsExactlyZero).toBe(true);
  }, 30_000);

  it("roundtrips physical state and deterministic restarts, but rejects another model or fixture", async () => {
    const session = await Session.create();
    expect(session.advanceStructuralAnalysisToPresentationTimeV1(.01).status).toBe("advanced");
    const checkpoint = await session.checkpointStandard71Exact();
    const restored = await Session.restoreStandard71ExactCheckpoint(checkpoint);
    const secondRestart = await Session.restoreStandard71ExactCheckpoint(checkpoint);
    expect(restored.currentAcceptedState()).toEqual(session.currentAcceptedState());
    expect(canonicalJsonStringify(await restored.checkpointStandard71Exact())).toBe(canonicalJsonStringify(checkpoint));
    //71 stores no predictor history: two restarts are deterministic, but the
    // uninterrupted warm solver is not promised bit-identical continuation.
    //72's separate history-preserving checkpoint tests retain that stronger gate.
    expect(secondRestart.advanceStructuralAnalysisToPresentationTimeV1(.02).status).toBe("advanced");
    expect(restored.advanceStructuralAnalysisToPresentationTimeV1(.02).status).toBe("advanced");
    expect(restored.currentAcceptedState()).toEqual(secondRestart.currentAcceptedState());
    await expect(Session.restoreStandard71ExactCheckpoint(checkpoint, { ...hemodynamics, totalBloodVolumeMl: 5000 }))
      .rejects.toThrow();
    await expect(OldSession.restoreStandard70ExactCheckpoint(checkpoint, hemodynamics, 1, undefined, mechanism))
      .rejects.toThrow(/schema|identity/);
    const old = await OldSession.create(hemodynamics, 1, undefined, mechanism);
    await expect(Session.restoreStandard71ExactCheckpoint(await old.checkpointStandard70Exact()))
      .rejects.toThrow(/schema|identity/);
  }, 30_000);

  it("keeps the fixed owner through volume control and both analysis forks", async () => {
    const source = await Session.create();
    source.advanceStructuralAnalysisToPresentationTimeV1(.01);
    const snapshot = canonicalJsonStringify(await source.checkpointStandard71Exact());
    const controlled = await source.warmStartWithHemodynamicResearchInputs({ ...hemodynamics, totalBloodVolumeMl: 5000 }, 1, undefined, mechanism);
    for (const copy of [controlled, source.forkAtFixedGlobalTotalBloodVolume(5000),
      source.forkResponsiveStarlingAtFixedGlobalTotalBloodVolume(5000)]) {
      expect(copy).toBeInstanceOf(Session);
      expect(copy.advanceStructuralAnalysisToPresentationTimeV1(.02).status).toBe("advanced");
      expect((await copy.checkpointStandard71Exact()).modelIdentity).toEqual((await source.checkpointStandard71Exact()).modelIdentity);
    }
    expect(canonicalJsonStringify(await source.checkpointStandard71Exact())).toBe(snapshot);
  }, 30_000);

  it("retains contractility headroom rather than forcing the research unit-amplitude constraint", () => {
    const baseline = createFixture();
    const increased = createFixture(hemodynamics, 1.1);
    expect(increased.provider.parameterIdentityHash).not.toBe(baseline.provider.parameterIdentityHash);
    expect(increased.rhythm).toEqual(baseline.rhythm);
    expect(() => createFixture(hemodynamics, 1, { ...mechanism,
      chamberMechanics: { ...mechanism.chamberMechanics,
        calciumDecayTimeScaleByWall: { ...mechanism.chamberMechanics.calciumDecayTimeScaleByWall, LVFW: 1.1 } } }))
      .toThrow(/fixed calcium law/);
  });

  it("rejects research numerical state even when its valid base is wrapped in a71 envelope", async () => {
    const research = researchFixture();
    const session = new MainWireBaselineReferenceResearchSessionV1(research, research.cold.acceptedState);
    const base = await session.checkpointStandardExact();
    await expect(Session.restoreStandard71ExactCheckpoint(base.numericalCheckpoint)).rejects.toThrow();
    const wrapped = await checkpointMainWireIntegratedModelStandard71V1(createFixture().standard71AssemblyId, base);
    await expect(Session.restoreStandard71ExactCheckpoint(wrapped)).rejects.toThrow(/identity|configuration|parameter/i);
  });
});
