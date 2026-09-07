import { describe, expect, it } from "vitest";
import baseline from "@/data/model-baselines/standard70-launch-baseline.json";
import type { MainWireIntegratedModelMechanismResearchInputsV3 } from "@/engine/myocardium/MainWireIntegratedModelMechanismResearchInputsV3";
import { createMainWireBaselineReferenceResearchV1 } from "@/engine/myocardium/experiments/MainWireBaselineReferenceResearchV1";
import { createMainWirePopulationMomentResearchV1, populationMomentResearchCheckpointContextV1 } from "@/engine/myocardium/experiments/MainWirePopulationMomentResearchV1";
import { comparePopulationMomentPeriodicDiagnosticsV1 } from "@/engine/myocardium/experiments/PopulationMomentPeriodicDiagnosticsV1";
import { checkpointMainWireIntegratedModelV3, restoreMainWireIntegratedModelV3 } from "@/engine/myocardium/MainWireIntegratedModelCheckpointV3";
import { createMainWireIntegratedModelRegularSinusAllOffCheckpointContextV3,
  runMainWireIntegratedModelRegularSinusAllOffCycleV3 } from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicSteadyV3";
import { MainWireIntegratedModelBeatAccumulatorV3 } from "@/engine/myocardium/MainWireIntegratedModelBeatMetricsV3";
import { canonicalJsonStringify } from "@/engine/integrity";

const source = baseline.candidateInputs;
const request = {
  hemodynamicResearchInputs: { ...source.hemodynamicResearchInputs, heartRateBpm: 70, totalBloodVolumeMl: 5200, systemicResistance: 1.1 },
  mechanismResearchInputs: { ...source.mechanismResearchInputs, chamberMechanics: {
    ...source.mechanismResearchInputs.chamberMechanics,
    activeTensionScaleByWall: { LA: 1, LVFW: 1, SEP: 1, RVFW: 1, RA: 1 },
    passiveStiffnessScaleByWall: { ...source.mechanismResearchInputs.chamberMechanics.passiveStiffnessScaleByWall, LVFW: 1.248, SEP: 1.248, RVFW: 1.248 },
  } } as MainWireIntegratedModelMechanismResearchInputsV3,
  parameters: { ventricularTrefPa: 120000, systemicArterialComplianceScale: .6 },
  admissionRole: "intervention" as const, aorticRootInertanceScale: 0 as const,
  ventricularCalciumTimeScale: 1.1, ventricularAeff: 25 as const, ventricularLandSlackStretch: 1.06 as const,
  ventricularKineticRestoration: "both" as const, ventricularBridgeExit: "none" as const,
};

describe("population moment research closed-loop construction", () => {
  it("isolates the ventricular law while retaining circulation, Ca, anatomy and atrial equations", () => {
    const land = createMainWireBaselineReferenceResearchV1(request), moment = createMainWirePopulationMomentResearchV1(request);
    expect(moment.researchParameterIdentity).not.toBe(land.researchParameterIdentity);
    expect(moment.provider.parameterIdentityHash).not.toBe(land.provider.parameterIdentityHash);
    for (const field of ["runtime", "rhythm", "pericardium", "mechanismResearchInputs", "researchLandParameters"] as const) {
      expect(moment[field]).toEqual(land[field]);
    }
    expect(moment.researchClaim).toMatchObject({ productionModel: false, coldOnlyNoLandCheckpointMigration: true });
    const walls = moment.cold.acceptedState.coronary.mechanics.materialState.wallStateByWall;
    expect(walls.LA.law).toBe("atrial-land");
    expect(walls.LVFW.law).toBe("ventricular-moment");
    expect(() => createMainWirePopulationMomentResearchV1({ ...request, ventricularBridgeExit: undefined })).toThrow(/no added bridge exit/);
  });
  it("round-trips a complete exact state and deterministically replays a cycle without mutating its anchor", async () => {
    const f = createMainWirePopulationMomentResearchV1(request), context = populationMomentResearchCheckpointContextV1(f);
    const first = runMainWireIntegratedModelRegularSinusAllOffCycleV3(f, f.cold.acceptedState, 1, .002);
    const checkpoint = await checkpointMainWireIntegratedModelV3(context, first.terminalAcceptedState);
    const restored = await restoreMainWireIntegratedModelV3(context, checkpoint);
    expect(await checkpointMainWireIntegratedModelV3(context, restored)).toEqual(checkpoint);
    expect(canonicalJsonStringify(await checkpointMainWireIntegratedModelV3(context, restored))).toBe(canonicalJsonStringify(checkpoint));
    const beat = new MainWireIntegratedModelBeatAccumulatorV3();
    let materialClaim: unknown;
    let atrialClaim: unknown;
    const a = runMainWireIntegratedModelRegularSinusAllOffCycleV3(f, first.terminalAcceptedState, 2, .002, s => {
      beat.accept(s);
      materialClaim ??= (s.coronaryStep.baseStep.mechanicsTrial.diagnostics.readback as { claim: unknown }).claim;
      atrialClaim ??= (s.coronaryStep.baseStep.mechanicsTrial.diagnostics.readback as {
        wallMaterialReadbackByWall: { LA: { claim: unknown } } }).wallMaterialReadbackByWall.LA.claim;
    });
    expect(materialClaim).toMatchObject({
      wallTopology: "Land-atria-and-population-moment-ventricles-plus-equilibrium-passive-and-SLS",
      trialMaterialLinearization: "analytic-consistent-mixed-Land-BE-and-frozen-detachment-moment-step",
      thermodynamicPotentialForLandActiveClaimed: false,
    });
    expect(atrialClaim).toMatchObject({ fullLandKernelOnAllFiveWalls: false, reuseScope: "unchanged-atrial-Land-only" });
    const b = runMainWireIntegratedModelRegularSinusAllOffCycleV3(f, restored, 2, .002);
    expect(b.traceSamples).toEqual(a.traceSamples);
    expect(await checkpointMainWireIntegratedModelV3(context, first.terminalAcceptedState)).toEqual(checkpoint);
    const diagnostics = comparePopulationMomentPeriodicDiagnosticsV1(a.terminalAcceptedState, first.terminalAcceptedState, f.config);
    expect(Number.isFinite(diagnostics.maximumNormalizedDelta)).toBe(true);
    expect(diagnostics.inheritedCompatibilityGates.modelConfigurationsExact).toBe(true);
    const original = a.terminalAcceptedState;
    const changed = { ...original, coronary: { ...original.coronary, mechanics: { ...original.coronary.mechanics,
      materialState: { ...original.coronary.mechanics.materialState, wallStateByWall: {
        ...original.coronary.mechanics.materialState.wallStateByWall,
        LVFW: structuredClone(original.coronary.mechanics.materialState.wallStateByWall.LVFW) } } } } };
    const lv = changed.coronary.mechanics.materialState.wallStateByWall.LVFW;
    if (lv.law !== "ventricular-moment") throw new Error("wrong law");
    Object.assign(lv.body.moment, { weakMoment: lv.body.moment.weakMoment + .001 });
    const detected = comparePopulationMomentPeriodicDiagnosticsV1(changed, first.terminalAcceptedState, f.config);
    expect(detected.directMomentEntries[0]!.currentValue - diagnostics.directMomentEntries[0]!.currentValue).toBeCloseTo(.001, 12);
    const flux = createMainWirePopulationMomentResearchV1(request, "flux-only");
    await expect(restoreMainWireIntegratedModelV3(populationMomentResearchCheckpointContextV1(flux), checkpoint)).rejects.toThrow();
    const land = createMainWireBaselineReferenceResearchV1(request);
    await expect(restoreMainWireIntegratedModelV3(createMainWireIntegratedModelRegularSinusAllOffCheckpointContextV3(land), checkpoint)).rejects.toThrow();
  }, 60_000);
});
