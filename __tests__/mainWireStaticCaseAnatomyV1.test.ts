import { describe, expect, it } from "vitest";
import { resolveMainWireStaticCaseAnatomyV1 as anatomy } from "@/engine/myocardium/mechanics/MainWireStaticCaseAnatomyV1";
import { createMainWireIntegratedModelStaticCaseFixtureV1 as create } from "@/engine/myocardium/experiments/MainWireIntegratedModelStaticCaseFixtureV1";
import { createMainWireIntegratedModelStandard71FixtureV1 as original } from "@/engine/myocardium/experiments/MainWireIntegratedModelStandard71FixtureV1";
import { createHfrefRemodelingResearchFixtureV1 as research } from "@/tools/scientific/runHfrefRemodelingAblationV1";
import { MAIN_WIRE_FITTING_SEED_V1 as seed } from "@/analysis/registry/MainWireFittingSeedV1";
import { MainWireIntegratedTypedAuthoritySessionV1 as BaseSession } from "@/engine/vnext/MainWireIntegratedTypedAuthoritySessionV1";
import type { MainWireIntegratedModelRuntimeV3 } from "@/engine/myocardium/MainWireIntegratedModelRuntimeV3";
import { checkpointWholeHeartMechanicsStateV1 as checkpoint, restoreWholeHeartMechanicsStateV1 as restore } from "@/engine/myocardium/wholeHeartMechanicsContractV1";
import { withHotPathIntegrityTierV1 } from "@/engine/hotPathIntegrityTierV1";

class Session extends BaseSession {
  constructor(fixture: ReturnType<typeof create>) {
    super(fixture as unknown as MainWireIntegratedModelRuntimeV3, fixture.cold.acceptedState, "cold", null);
  }
}
const point = { active: .35, referenceArea: 1.15, wallVolume: 1.25 };

describe("finite static anatomy construction (public runtime not yet registered)", () => {
  it("owns two immutable geometries and rejects numeric patches or unknown choices", () => {
    const base = anatomy("baseline-v1"), next = anatomy("dilated-lv-v1");
    expect(base.lvMassG).toBeCloseTo(108.3, 10); expect(next.lvMassG).toBeCloseTo(135.375, 10);
    expect(next.trisegWalls.LVFW.referenceMidwallAreaM2).toBe(base.trisegWalls.LVFW.referenceMidwallAreaM2 * 1.15);
    expect(next.trisegWalls.SEP.wallMaterialVolumeM3).toBe(base.trisegWalls.SEP.wallMaterialVolumeM3 * 1.25);
    expect(next.trisegWalls.RVFW).toEqual(base.trisegWalls.RVFW); expect(next.atria).toEqual(base.atria);
    expect(next.anatomyFingerprint).not.toBe(base.anatomyFingerprint);
    expect(Object.isFrozen(next.trisegWalls.LVFW)).toBe(true); expect(Object.isFrozen(next.wallMassG)).toBe(true);
    for (const id of ["unknown", null, { caseId: "dilated-lv-v1", area: 1.3 }, 1.15]) expect(() => anatomy(id)).toThrow(/Unsupported/);
  });

  it("preserves the original baseline numerical construction exactly", () => {
    const c = seed.candidateInputs;
    const next = create("baseline-v1", c.hemodynamicResearchInputs, c.ventricularContractilityScale, c.mechanismResearchInputs);
    const base = original(c.hemodynamicResearchInputs, c.ventricularContractilityScale, c.mechanismResearchInputs);
    expect(next.cold.acceptedState).toEqual(base.cold.acceptedState);
    expect(next.provider.parameterIdentityHash).toBe(base.provider.parameterIdentityHash);
    expect(next.pericardium).toEqual(base.pericardium);
    expect(next).not.toHaveProperty("standard71AssemblyId");
  });

  it("reconstructs the selected anatomy without changing its physical inputs or adding a hidden tension setting", async () => {
    const old = await research(point, { totalBloodVolumeMl: 4935, systemicResistance: 1.2 });
    const c = old.candidate;
    const next = create("dilated-lv-v1", c.hemodynamicResearchInputs, c.ventricularContractilityScale, c.mechanismResearchInputs);
    expect(next.mechanismResearchInputs).toEqual(old.fixture.mechanismResearchInputs);
    expect(next.staticAnatomy.trisegWalls).toEqual(old.construction.trisegWalls);
    expect(next.pericardium.parameters).toEqual(old.fixture.pericardium.parameters);
    expect(next.pericardium.wallMaterialVolumesM3).toEqual(old.fixture.pericardium.wallMaterialVolumesM3);
    expect(next.coronaryStepInput.pericardium).toBe(next.pericardium);
    expect(next.coronaryStepInput.coronaryPrior).toBe(old.fixture.coronaryStepInput.coronaryPrior);
    expect(next.coronaryConstruction.referenceBedMassRepresentsCurrentAnatomy).toBe(false);
    expect(next.cold.acceptedState.coronary.mechanics.materialState).toEqual(old.fixture.cold.acceptedState.coronary.mechanics.materialState);
    expect(next.cold.acceptedState.coronary.circulation).toEqual(old.fixture.cold.acceptedState.coronary.circulation);
    const normalTension = create("dilated-lv-v1");
    expect(normalTension.mechanismResearchInputs.chamberMechanics.activeTensionScaleByWall.LVFW).toBe(1);
    expect(normalTension.staticAnatomy).toBe(next.staticAnatomy);
    const changedLoad = create("dilated-lv-v1", { ...c.hemodynamicResearchInputs, totalBloodVolumeMl: 5035 }, c.ventricularContractilityScale, c.mechanismResearchInputs);
    expect(changedLoad.provider.parameterIdentityHash).toBe(next.provider.parameterIdentityHash);
  });

  it("rejects a different anatomy at the existing mechanics checkpoint boundary", () => {
    const base = create("baseline-v1"), next = create("dilated-lv-v1");
    const saved = checkpoint(next.provider, next.cold.acceptedState.coronary.mechanics);
    expect(restore(next.provider, saved)).toEqual(next.cold.acceptedState.coronary.mechanics);
    expect(() => restore(base.provider, saved)).toThrow(/identity mismatch/);
    // Whole-model/worker checkpoints and anatomy-preserving analysis forks
    // require separate integration tests; this does not qualify those routes.
  });

  it("matches the research construction through a full transient cycle, without relabeling its state", async () => {
    const old = await research(point, { totalBloodVolumeMl: 4935, systemicResistance: 1.2 });
    const c = old.candidate;
    const next = create("dilated-lv-v1", c.hemodynamicResearchInputs, c.ventricularContractilityScale, c.mechanismResearchInputs);
    withHotPathIntegrityTierV1("hot-path-lean", () => {
      const source = new Session(old.fixture as ReturnType<typeof create>), target = new Session(next);
      const ids = ["hemodynamics.pressure.absolute.LV", "hemodynamics.pressure.absolute.RV", "hemodynamics.flow.valve.AoV", "hemodynamics.flow.valve.MV"] as const;
      for (let i = 1; i <= 500; i++) {
        const a = source.advanceToPresentationTimeWithSelectedOutputProjectionV1(i * .002, ids);
        const b = target.advanceToPresentationTimeWithSelectedOutputProjectionV1(i * .002, ids);
        expect(a.advance.status).toBe("advanced"); expect(b.advance.status).toBe("advanced");
        expect(b.projectedValues).toEqual(a.projectedValues);
        expect(target.currentAcceptedState().coronary.mechanics.materialState).toEqual(source.currentAcceptedState().coronary.mechanics.materialState);
      }
    });
  }, 15_000);
});
