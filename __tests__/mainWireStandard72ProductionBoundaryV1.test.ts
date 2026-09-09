import { beforeEach, afterEach, describe, expect, it } from "vitest";
import { hotPathIntegrityTierV1, selectHotPathIntegrityTierV1 } from "@/engine/hotPathIntegrityTierV1";
import { MainWireIntegratedModelStandard72TypedAuthoritySessionV1 as Production } from "@/engine/vnext/MainWireIntegratedModelStandard72TypedAuthoritySessionV1";
import { MainWireStaticCaseSessionV1 as Research } from "@/engine/vnext/MainWireStaticCaseSessionV1";
import { validateMainWireIntegratedModelStandard72CheckpointV1 as validateProduction } from "@/engine/myocardium/MainWireIntegratedModelStandard72CheckpointV1";
import { MAIN_WIRE_STANDARD71_BASELINE_HEMODYNAMIC_INPUTS_V1 as hemo, MAIN_WIRE_STANDARD71_BASELINE_MECHANISM_INPUTS_V1 as mechanism } from "@/engine/myocardium/experiments/MainWireIntegratedModelStandard71FixtureV1";
import productionCheckpoint from "@/studio/integrations/mainWireIntegratedV3/standard72-settled-baseline-checkpoint.json";
import { createMainWireIntegratedStudioStandard72CoreReleaseV1 as productionRelease,
  createMainWireIntegratedStudioStaticCaseCoreReleaseV1 as researchRelease,
  MAIN_WIRE_INTEGRATED_STUDIO_ROUNDED_EJECTION_DEFAULT_FIXTURE_V1 as template } from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioSelectedAorticOutflowExactModelV1";
import { MAIN_WIRE_INTEGRATED_STUDIO_STANDARD72_MODEL_ID_V1 as productionId } from "@/domain/model/MainWireStandardIdentityV1";
import { MAIN_WIRE_STATIC_CASE_MODEL_ID_V1 as researchId } from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioStaticCaseIdentityV1";

const tier = hotPathIntegrityTierV1();
beforeEach(() => selectHotPathIntegrityTierV1("hot-path-lean"));
afterEach(() => selectHotPathIntegrityTierV1(tier));
const withActive = (value: number) => ({ ...mechanism, chamberMechanics: { ...mechanism.chamberMechanics,
  activeTensionScaleByWall: { ...mechanism.chamberMechanics.activeTensionScaleByWall, LVFW: value, SEP: value } } });

describe("production72 retains its own identity and original input domain", () => {
  it("accepts the unchanged released checkpoint without relabeling or re-signing", async () => {
    expect(await validateProduction(productionCheckpoint)).toEqual(productionCheckpoint);
    const live = await Production.restoreStandard72ExactCheckpoint(productionCheckpoint);
    expect(await live.checkpointStandard72Exact()).toEqual(productionCheckpoint);
    expect(productionRelease().manifest.modelId).toBe(productionId);
    expect(researchRelease().manifest.modelId).toBe(researchId);
  });

  it("keeps the expanded primitive control ranges only in the research owner", () => {
    const production = productionRelease().manifest.primitiveControlCatalog;
    const research = researchRelease().manifest.primitiveControlCatalog;
    expect(production).toHaveLength(52); expect(research).toHaveLength(53);
    expect(production.some(c => c.controlId === "myocardium.lv-contractility")).toBe(false);
    for (const wall of ["LVFW", "SEP"]) {
      const id = `myocardium.active-tension-scale.${wall}`;
      expect(production.find(c => c.controlId === id)?.minimum).toBe(.75);
      expect(research.find(c => c.controlId === id)?.minimum).toBe(.25);
    }
  });

  it("rejects direct out-of-domain production construction and fixture replacement atomically", async () => {
    for (const value of [.25, .35, .74]) await expect(Production.create(hemo, 1, undefined, withActive(value))).rejects.toThrow(/Original mechanics domain/);
    expect(Research.create("dilated-lv-v1", hemo, 1, withActive(.25)).anatomy.caseId).toBe("dilated-lv-v1");
    const adapter = productionRelease().executables.simulationAdapter;
    const fixture = { ...template, hemodynamicResearchInputs: hemo, mechanismResearchInputs: mechanism };
    const id = { runtimeSessionId: "production-domain", scenarioId: "a" };
    await adapter.createSession({ runtimeSessionId: id.runtimeSessionId, scenarios: [{ scenarioId: id.scenarioId, fixture }] });
    const before = adapter.currentFrame(id);
    await expect(adapter.replaceFixture({ ...id, fixture: { ...fixture, mechanismResearchInputs: withActive(.35) } })).rejects.toThrow(/Original mechanics domain/);
    expect(adapter.currentFrame(id)).toEqual(before);
    await adapter.advanceOnePresentationStep(id);
    expect(adapter.currentFrame(id).acceptedTimeSec).toBeGreaterThan(before.acceptedTimeSec);
    adapter.disposeSession(id.runtimeSessionId);
  });

  it("rejects research warm inputs and cross-codec restores without damaging the source", async () => {
    const live = await Production.restoreStandard72ExactCheckpoint(productionCheckpoint);
    const before = await live.checkpointStandard72Exact();
    await expect(live.warmStartWithHemodynamicResearchInputs(hemo, 1, undefined, withActive(.35))).rejects.toThrow(/Original mechanics domain/);
    expect(await live.checkpointStandard72Exact()).toEqual(before);
    const research = Research.create("baseline-v1", hemo, 1, mechanism);
    await expect(Production.restoreStandard72ExactCheckpoint(await research.checkpoint())).rejects.toThrow(/checkpoint/);
    await expect(Research.restore(productionCheckpoint, "baseline-v1", hemo, 1, mechanism)).rejects.toThrow(/checkpoint/);
  });
});
