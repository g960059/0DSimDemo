import { describe, expect, it } from "vitest";
import { createHfrefRemodelingResearchFixtureV1 as fixture } from "@/tools/scientific/runHfrefRemodelingAblationV1";
import { MAIN_WIRE_FITTING_SEED_V1 as seed } from "@/analysis/registry/MainWireFittingSeedV1";
import { createMainWireIntegratedModelStandard71FixtureV1 as baseFixture } from "@/engine/myocardium/experiments/MainWireIntegratedModelStandard71FixtureV1";
import { evaluateMainWireCommonPericardiumBindingV1 as evaluateBag } from "@/engine/myocardium/mechanics/mainWireCommonPericardiumBindingV1";

describe("research remodeling construction (not a qualified preset/domain)", () => {
  it("reproduces the unchanged baseline cold construction through the shared assembly", async () => {
    const actual = await fixture({ active: 1, referenceArea: 1, wallVolume: 1 });
    const c = seed.candidateInputs;
    const base = baseFixture(c.hemodynamicResearchInputs, c.ventricularContractilityScale, c.mechanismResearchInputs);
    expect(actual.fixture.cold.acceptedState).toEqual(base.cold.acceptedState);
    expect(actual.fixture.pericardium).toEqual(base.pericardium);
  });

  it("accounts for added tissue before cold initialization without silently enlarging the bag", async () => {
    const old = await fixture({ active: .35, referenceArea: 1.15, wallVolume: 1 });
    const next = await fixture({ active: .35, referenceArea: 1.15, wallVolume: 1.25 });
    const oldBag = old.fixture.pericardium, nextBag = next.fixture.pericardium;
    const expectedAdded = (old.construction.trisegWalls.LVFW.wallMaterialVolumeM3
      + old.construction.trisegWalls.SEP.wallMaterialVolumeM3) * .25;
    expect(nextBag.parameters).toEqual(oldBag.parameters);
    expect(next.fixture.coronaryStepInput.pericardium).toBe(nextBag);
    const volume = { LA: 70, LV: 220, RA: 45, RV: 140 };
    const before = evaluateBag(oldBag, volume), after = evaluateBag(nextBag, volume);
    expect(after.totalOccupiedVolumeM3 - before.totalOccupiedVolumeM3).toBeCloseTo(expectedAdded, 14);
    expect(after.excessPressureMmHg).toBeGreaterThan(before.excessPressureMmHg);
    expect(next.construction.currentMechanicalWallMassG.LVFW).toBeCloseTo(old.construction.currentMechanicalWallMassG.LVFW! * 1.25, 10);
    expect(next.construction.currentMechanicalWallMassG.SEP).toBeCloseTo(old.construction.currentMechanicalWallMassG.SEP! * 1.25, 10);
    expect(next.construction.currentMechanicalWallMassG.RVFW).toBe(old.construction.currentMechanicalWallMassG.RVFW);
    expect(next.fixture.cold.acceptedState.coronary.mechanics.parameterIdentityHash)
      .not.toBe(old.fixture.cold.acceptedState.coronary.mechanics.parameterIdentityHash);
    expect(next.constructionSha256).not.toBe(old.constructionSha256);
    // A fixed reference vascular bed is an explicit control, not a claim that
    // its historical mass prior describes the remodeled candidate anatomy.
    expect(next.fixture.coronaryStepInput.coronaryPrior).toBe(old.fixture.coronaryStepInput.coronaryPrior);
    expect(next.construction.coronary.coronaryRemodelingClaimed).toBe(false);
    expect(next.construction.coronary.perGramPerfusionQualified).toBe(false);
    expect(next.construction.coronary.referenceBedWallMassG.LVFW)
      .not.toBe(next.construction.currentMechanicalWallMassG.LVFW);
  });

  it("does not admit an untested continuous geometry domain", async () => {
    await expect(fixture({ active: .35, referenceArea: 1.3, wallVolume: 1.25 })).rejects.toThrow(/preregistered/);
    await expect(fixture({ active: .35, referenceArea: 1.15, wallVolume: NaN })).rejects.toThrow(/preregistered/);
  });
});
