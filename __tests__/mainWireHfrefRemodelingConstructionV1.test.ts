import { describe, expect, it } from "vitest";
import { createHfrefRemodelingResearchFixtureV1 as fixture } from "@/tools/scientific/runHfrefRemodelingAblationV1";
import { MAIN_WIRE_FITTING_SEED_V1 as seed } from "@/analysis/registry/MainWireFittingSeedV1";
import { createMainWireIntegratedModelStandard71FixtureV1 as baseFixture } from "@/engine/myocardium/experiments/MainWireIntegratedModelStandard71FixtureV1";
import { evaluateMainWireCommonPericardiumBindingV1 as evaluateBag } from "@/engine/myocardium/mechanics/mainWireCommonPericardiumBindingV1";
import { createHfrefPassiveConstructionV1 as passive,
  observeHfrefPassivePointV1 as observePassive,
  matchHfrefPassivePressureV1 as matchPressure } from "@/tools/scientific/runHfrefPassiveAuditV1";

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

  it("changes only the two requested hemodynamic inputs under a distinct research identity", async () => {
    const point = { active: .35, referenceArea: 1.15, wallVolume: 1.25 };
    const original = await fixture(point);
    const explicitControl = await fixture(point, { totalBloodVolumeMl: 4935, systemicResistance: 1.04 });
    const changed = await fixture(point, { totalBloodVolumeMl: 5035, systemicResistance: 1.12 });
    expect(explicitControl.candidate).toEqual(original.candidate);
    expect(explicitControl.protocol).not.toBe(original.protocol);
    expect(explicitControl.constructionSha256).not.toBe(original.constructionSha256);
    expect(changed.candidate).toEqual({ ...original.candidate, hemodynamicResearchInputs: {
      ...original.candidate.hemodynamicResearchInputs, totalBloodVolumeMl: 5035, systemicResistance: 1.12 } });
    expect(changed.construction.trisegWalls).toEqual(original.construction.trisegWalls);
    expect(changed.fixture.pericardium.parameters).toEqual(original.fixture.pericardium.parameters);
    expect(changed.fixture.pericardium.wallMaterialVolumesM3).toEqual(original.fixture.pericardium.wallMaterialVolumesM3);
    expect(changed.fixture.coronaryStepInput.coronaryPrior).toBe(original.fixture.coronaryStepInput.coronaryPrior);
    await expect(fixture(point, { totalBloodVolumeMl: 5035, systemicResistance: 1.26 })).rejects.toThrow(/systemicResistance/);
    await expect(fixture(point, { totalBloodVolumeMl: NaN, systemicResistance: 1.12 })).rejects.toThrow(/totalBloodVolume/);
    await expect(fixture(point, { totalBloodVolumeMl: 5035, systemicResistance: 1.12, venousTone: .5 } as never)).rejects.toThrow(/exactly/);
  });

  it("isolates the relaxed passive ventricular law without replacing the source candidate", async () => {
    const a = await passive({ active: .35, referenceArea: 1.15, wallVolume: 1.25 });
    const b = await passive({ active: 1, referenceArea: 1.15, wallVolume: 1.25 });
    const original = await fixture({ active: .35, referenceArea: 1.15, wallVolume: 1.25 });
    const pa = observePassive(a, 200, 140), pb = observePassive(b, 200, 140);
    expect(a.candidate).toEqual(original.candidate);
    expect(a.construction).toEqual(original.construction);
    expect(a.fixture.provider.parameterIdentityHash).not.toBe(original.fixture.provider.parameterIdentityHash);
    expect(pa.maximumActivePa).toBe(0); expect(pa.maximumSlsPa).toBe(0);
    expect(pa.pressuresMmHg).toEqual(pb.pressuresMmHg);
    expect(pa.passiveParameterHashes).toEqual(pb.passiveParameterHashes);
    expect(pa.residualNorm).toBeLessThan(1e-8);
    expect(pa.internalMinimumEigenvalue).toBeGreaterThan(0);
    expect(pa.formalDynamicEdpvrClaimed).toBe(false);
  });

  it("releases pericardial pressure, energy and stiffness as a separate mechanistic control", async () => {
    const point = { active: .35, referenceArea: 1.15, wallVolume: 1.25 };
    const condition = { totalBloodVolumeMl: 4935, systemicResistance: 1.2 };
    const on = await fixture(point, condition);
    const off = await fixture(point, condition, { pericardiumMode: "exact-off" });
    expect(off.candidate).toEqual(on.candidate);
    expect(off.construction.trisegWalls).toEqual(on.construction.trisegWalls);
    expect(off.protocol).not.toBe(on.protocol);
    expect(off.constructionSha256).not.toBe(on.constructionSha256);
    expect(off.fixture.pericardium.mode).toBe("exact-off");
    expect(on.fixture.pericardium.mode).toBe("on");
    expect(off.fixture.coronaryStepInput.pericardium).toBe(off.fixture.pericardium);
    expect(off.fixture.pericardium.parameters).toEqual(on.fixture.pericardium.parameters);
    expect(off.fixture.pericardium.wallMaterialVolumesM3).toEqual(on.fixture.pericardium.wallMaterialVolumesM3);
    expect(off.fixture.coronaryStepInput.coronaryPrior).toBe(on.fixture.coronaryStepInput.coronaryPrior);
    const volumes = { LA: 70, LV: 220, RA: 45, RV: 140 };
    const a = evaluateBag(on.fixture.pericardium, volumes), b = evaluateBag(off.fixture.pericardium, volumes);
    expect(a.excessPressureMmHg).toBeGreaterThan(0);
    expect(b.totalOccupiedVolumeM3).toBe(a.totalOccupiedVolumeM3);
    expect(b.excessPressureMmHg).toBe(0); expect(b.storedEnergyJ).toBe(0); expect(b.pressureDerivativePaPerM3).toBe(0);
    await expect(fixture(point, condition, { pericardiumMode: "on" } as never)).rejects.toThrow(/explicit/);
    await expect(fixture(point, condition, { pericardiumMode: "exact-off", capacityScale: 2 } as never)).rejects.toThrow(/explicit/);
  });

  it("matches transmural pressure at fixed RV volume and keeps bag pressure separate", async () => {
    const base = await passive({ active: .35, referenceArea: 1, wallVolume: 1 });
    const enlarged = await passive({ active: .35, referenceArea: 1.15, wallVolume: 1.25 });
    const a = matchPressure(base, 140, 10, 140, 160), b = matchPressure(enlarged, 140, 10, 180, 190);
    expect(Math.abs(a.pressuresMmHg.LV - 10)).toBeLessThan(1e-7);
    expect(Math.abs(b.pressuresMmHg.LV - 10)).toBeLessThan(1e-7);
    expect(b.volumes.LV).toBeGreaterThan(a.volumes.LV);
    expect(b.volumes.RV).toBe(a.volumes.RV);
    expect(b.pressuresMmHg.RV).not.toBe(a.pressuresMmHg.RV); // not pressure-matched RV
    expect(b.cavityPressureWithoutPleuralOffsetMmHg.LV).toBeCloseTo(b.pressuresMmHg.LV + b.pericardium.excessPressureMmHg, 12);
    expect(() => matchPressure(base, 140, 10, 200, 220)).toThrow(/not bracketed/);
  });
});
