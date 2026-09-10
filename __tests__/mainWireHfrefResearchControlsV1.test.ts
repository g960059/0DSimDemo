import { describe, expect, it } from "vitest";
import { MAIN_WIRE_STATIC_CASE_CONTROL_CATALOG_V1 as catalog, MAIN_WIRE_STATIC_CASE_CONTROL_BY_ID_V1 as controls } from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioStaticCaseControlsV1";
import { applyMainWireIntegratedStudioRoundedEjectionControlV1 as apply, reduceMainWireIntegratedStudioRoundedEjectionControlV1 as patch } from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioRoundedEjectionControlsV1";
import { mainWireIntegratedStudioControlValueFromFixtureV3 as project } from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioFixtureControlProjectionV3";
import { MAIN_WIRE_INTEGRATED_STUDIO_ROUNDED_EJECTION_DEFAULT_FIXTURE_V1 as template, createMainWireIntegratedStudioStaticCaseCoreReleaseV1 as release } from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioSelectedAorticOutflowExactModelV1";
import { MAIN_WIRE_STANDARD71_BASELINE_HEMODYNAMIC_INPUTS_V1 as hemodynamicResearchInputs, MAIN_WIRE_STANDARD71_BASELINE_MECHANISM_INPUTS_V1 as mechanismResearchInputs } from "@/engine/myocardium/experiments/MainWireIntegratedModelStandard71FixtureV1";
import { validateAndOwnMainWireFiveWallMechanicsResearchInputsV1 as validate } from "@/engine/myocardium/mechanics/MainWireFiveWallMechanicsResearchInputsV1";
import { MainWireStaticCaseSessionV1 as StaticSession } from "@/engine/vnext/MainWireStaticCaseSessionV1";
const oldCheckpoint = { checkpointId: "circleheart.main-wire-integrated-model-standard72-exact-checkpoint.v1" };
import surface from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioStaticCaseSurfaceV1";
import inherited from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioStandard72SurfaceV1";
import { composeStandardModelContractV1 } from "@/studio/contracts/v2/modelSurface";
import { resolveMainWireAnalysisMethodsForSurfaceV1 as analyses } from "@/analysis/methods/mainWire/MainWireAnalysisMethodRegistryV1";
import { createDefaultExperimentSurfaceV3 } from "@/components/workbench/WorkbenchSurfaceV3";

const baseline = { ...template, hemodynamicResearchInputs, mechanismResearchInputs };
const group = "myocardium.lv-contractility";

describe("bounded research LV domain and atomic workbench operation", () => {
  it("limits the extended exact domain to LVFW and SEP", () => {
    for (const wall of ["LVFW", "SEP", "RVFW", "LA", "RA"] as const) {
      const make = (value: number) => ({ ...mechanismResearchInputs.chamberMechanics,
        activeTensionScaleByWall: { ...mechanismResearchInputs.chamberMechanics.activeTensionScaleByWall, [wall]: value } });
      if (wall === "LVFW" || wall === "SEP") expect(() => validate(make(.25))).not.toThrow();
      else expect(() => validate(make(.25))).toThrow(/\[0.75, 1.33\]/);
      expect(() => validate(make(.24))).toThrow();
      expect(() => validate(make(1.34))).toThrow();
    }
    expect(controls.get("myocardium.contractility")!.minimum).toBe(.75);
    expect(() => apply(baseline, "myocardium.contractility", .35, controls)).toThrow();
  });
  it("sets two material values with one patch and preserves every other input", () => {
    const target = apply(baseline, group, .35, controls);
    expect(target).toEqual({ ...baseline, mechanismResearchInputs: { ...mechanismResearchInputs,
      chamberMechanics: { ...mechanismResearchInputs.chamberMechanics,
        activeTensionScaleByWall: { ...mechanismResearchInputs.chamberMechanics.activeTensionScaleByWall, LVFW: .35, SEP: .35 } } } });
    expect(patch(baseline, group, .35, controls).changes.map(c => c.path.at(-1))).toEqual(["LVFW", "SEP"]);
    expect(apply(target, group, 1, controls)).toEqual(baseline);
    expect(apply(target, group, .35, controls)).toEqual(target);
    expect(project(target, group)).toEqual({ status: "value", value: .35 });
    expect(project(target, "myocardium.contractility")).toEqual({ status: "mixed" });
  });
  it("reports unequal walls as mixed without inventing an averaged coordinate", () => {
    const target = apply(baseline, "myocardium.active-tension-scale.LVFW", .4, controls);
    expect(project(target, group)).toEqual({ status: "mixed" });
    expect(project(JSON.parse(JSON.stringify(target)), group)).toEqual({ status: "mixed" });
    expect(project(apply(target, group, .35, controls), group)).toEqual({ status: "value", value: .35 });
  });
  it("parses declared research endpoints and rejects malformed or off-lattice operations", () => {
    for (const value of [.25, 1.33]) expect(() => apply(baseline, group, value, controls)).not.toThrow();
    for (const value of [.24, 1.34, .355, NaN, Infinity]) expect(() => apply(baseline, group, value, controls)).toThrow();
    expect(catalog).toHaveLength(53);
  });
  it("rejects the released model checkpoint, without a legacy-label bypass", async () => {
    await expect(StaticSession.restore(oldCheckpoint, "baseline-v1", hemodynamicResearchInputs, 1, mechanismResearchInputs)).rejects.toThrow(/identity|checkpoint/);
  });
  it("inherits all analysis and graph items, with the LV group in the default pane", () => {
    for (const key of ["exposedExactOutputIds", "graphCatalog"] as const)
      expect(surface[key]).toEqual(inherited[key]);
    expect(surface.derivedOutputCatalog.map(o => o.outputId)).toEqual(inherited.derivedOutputCatalog.map(o => o.outputId));
    expect(surface.surfaceReleaseId).not.toEqual(inherited.surfaceReleaseId);
    const contract = composeStandardModelContractV1(release().manifest, surface, analyses(surface).capabilities).contract;
    expect(contract.controlCatalog).toHaveLength(53);
    const defaults = createDefaultExperimentSurfaceV3(contract, "baseline", { periodicPvaSupported: true });
    const ids = defaults.controlPanes.flatMap(p => p.items.map(i => i.controlId));
    expect(ids).toContain(group); expect(ids).not.toContain("myocardium.active-tension-scale.LVFW");
  });
});
