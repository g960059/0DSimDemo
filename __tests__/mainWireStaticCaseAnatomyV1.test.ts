import { describe, expect, it } from "vitest";
import { resolveMainWireStaticCaseAnatomyV1 as anatomy } from "@/engine/myocardium/mechanics/MainWireStaticCaseAnatomyV1";
import { createMainWireIntegratedModelStaticCaseFixtureV1 as create } from "@/engine/myocardium/experiments/MainWireIntegratedModelStaticCaseFixtureV1";
import { createMainWireIntegratedModelStandard71FixtureV1 as original } from "@/engine/myocardium/experiments/MainWireIntegratedModelStandard71FixtureV1";
import { mainWireStaticCaseFittingSeedV1 as seed } from "@/tools/scientific/MainWireStaticCaseFittingSeedV1";
import { checkpointWholeHeartMechanicsStateV1 as checkpoint, restoreWholeHeartMechanicsStateV1 as restore } from "@/engine/myocardium/wholeHeartMechanicsContractV1";

describe("current finite static anatomy construction", () => {
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
    const c = seed("baseline");
    const next = create("baseline-v1", c.hemodynamicResearchInputs, c.ventricularContractilityScale, c.mechanismResearchInputs);
    const base = original(c.hemodynamicResearchInputs, c.ventricularContractilityScale, c.mechanismResearchInputs);
    expect(next.cold.acceptedState).toEqual(base.cold.acceptedState);
    expect(next.provider.parameterIdentityHash).toBe(base.provider.parameterIdentityHash);
    expect(next.pericardium).toEqual(base.pericardium);
    expect(next).not.toHaveProperty("standard71AssemblyId");
  });

  it("reconstructs the selected anatomy without changing its physical inputs or adding a hidden tension setting", async () => {
    const c = seed("hfref-chronic-dilated-v1");
    const next = create("dilated-lv-v1", c.hemodynamicResearchInputs, c.ventricularContractilityScale, c.mechanismResearchInputs);
    expect(next.mechanismResearchInputs).toEqual(c.mechanismResearchInputs);
    expect(next.staticAnatomy).toBe(anatomy("dilated-lv-v1"));
    expect(next.coronaryStepInput.pericardium).toBe(next.pericardium);
    expect(next.coronaryConstruction.referenceBedMassRepresentsCurrentAnatomy).toBe(false);
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

});
