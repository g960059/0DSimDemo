import React from "react";
import { renderToPipeableStream } from "react-dom/server";
import { PassThrough } from "node:stream";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { ModelDocumentationPage } from "@/components/model/ModelDocumentationPage";
import { modelDocumentationHref } from "@/homeLinks";
import saved from "@/studio/presentation/modelDocumentation/packages/standard72-document-v1.json";
import historical from "@/studio/presentation/modelDocumentation/packages/standard71-document-v1.json";
import { MAIN_WIRE_MODEL_MODULES_V1, MAIN_WIRE_REFERENCE_CONSTRUCTION_MODULE_IDS_V1 } from "@/studio/presentation/modelDocumentation/MainWireModelModulesV1";
import { resolveRegisteredModelDisclosureV1, resolveRegisteredModelDocumentationV1, REGISTERED_MODEL_DOCUMENTATION_OPTIONS_V1 } from "@/studio/presentation/modelDocumentation/RegisteredModelDocumentationV1";
import surface from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioStandard72SurfaceV1";
import client from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioStandard72ExactModelV1.client.json";
import launch from "@/studio/integrations/mainWireIntegratedV3/standard72-launch-checkpoint.json";
import binding from "@/studio/integrations/mainWireIntegratedV3/standard72-baseline-binding-evidence.json";
import eligibility from "@/data/model-baselines/standard72-reviewed-eligibility-v1.json";
import { resolveRegisteredModelLaunchCheckpointV1 } from "@/studio/registry/RegisteredModelLaunchBaselineV1";
import { resolveSavedModelDocumentIndexV1 } from "@/studio/presentation/modelDocumentation/SavedModelDocumentCatalogV1";
import { fittedBaselineEquationDataV1, fittedBaselineSettingsV1 } from "@/tools/modelDocumentation/authoring/FittedBaselineDocumentCompositionV1";
import { MAIN_WIRE_FITTING_SEED_V1 } from "@/analysis/registry/MainWireFittingSeedV1";
import hfref from "@/studio/presentation/modelDocumentation/packages/hfref-static-case-document-v4.index.json";

function renderRoute(modelId: string, surfaceReleaseId: string, locale: "ja" | "en" = "ja") {
  return new Promise<string>((resolve, reject) => {
    const output = new PassThrough();
    let html = "";
    output.setEncoding("utf8");
    output.on("data", chunk => { html += chunk; });
    output.on("end", () => resolve(html));
    output.on("error", reject);
    const stream = renderToPipeableStream(<MemoryRouter initialEntries={[modelDocumentationHref({ locale, modelId, surfaceReleaseId })]}>
      <Routes><Route path="/:locale/models/:modelId" element={<ModelDocumentationPage />} /></Routes>
    </MemoryRouter>, { onAllReady: () => stream.pipe(output), onError: reject });
  });
}

describe("current and historical model documentation", () => {
  it("requires explicit case selection instead of substituting HFrEF for the static model baseline", () => {
    const { modelId, surfaceReleaseId } = hfref.identity;
    expect(resolveSavedModelDocumentIndexV1(modelId, surfaceReleaseId)).toBeNull();
    expect(resolveSavedModelDocumentIndexV1(modelId, surfaceReleaseId, hfref.documentId)?.contentSha256).toBe(hfref.contentSha256);
    expect(resolveSavedModelDocumentIndexV1(client.manifest.modelId, surface.surfaceReleaseId, hfref.documentId)).toBeNull();
  });
  it("resolves the exact current model/Surface pair through a compact document index", () => {
    expect(resolveRegisteredModelDocumentationV1(client.manifest.modelId, surface.surfaceReleaseId)).toEqual({
      kind: "saved-model-document", modelId: client.manifest.modelId,
      surfaceReleaseId: surface.surfaceReleaseId, surfaceSeriesId: surface.surfaceSeriesId,
      documentId: saved.documentId,
    });
    expect(resolveRegisteredModelDisclosureV1(client.manifest.modelId, surface.surfaceReleaseId)).toMatchObject({
      badgeLabel: "MW 72", shortLabel: "Main Wire Standard 72", limitationsTranslationKey: "modelLimitations.standard72Items",
    });
    for (const unsupported of [null, "surface/unknown", surface.surfaceReleaseId + ".next"])
      expect(resolveRegisteredModelDocumentationV1(client.manifest.modelId, unsupported)).toBeNull();
    expect(resolveRegisteredModelDocumentationV1("model/unknown", surface.surfaceReleaseId)).toBeNull();
  });

  it("pins the inherited complete Surface and the current exact checkpoints, controls and assessment", () => {
    const m = saved.scientificRecord.measurements;
    expect(saved.identity.modelId).toBe(client.manifest.modelId);
    expect(saved.identity.releaseStatus).toBe("local-candidate-not-registered");
    expect(m.surfaceDefinition).toEqual(surface);
    expect(m.fixtureIdentity).toEqual(client.defaultFixture);
    expect(m.settings).toEqual(client.manifest.primitiveControlCatalog);
    expect(m.qualification.checkpoint).toEqual(binding.checkpoint);
    expect(m.qualification.launchPreparation.targetCheckpointSha256).toBe(launch.checkpointSha256);
    expect(m.checkpointSemantics.coupledPredictor).toEqual(launch.coupledPredictor);
    expect(m.checkpointSemantics.checkpointId).toBe(launch.checkpointId);
    expect(m.observations[0].rest).toEqual(binding.rest);
    expect(m.observations[1].rest).toEqual(eligibility.observations[1].rest);
    expect(m.admission.referenceFlags).toEqual(eligibility.referenceFlags);
    expect(m.admission.reserve).toEqual(eligibility.reserve);
    const base = launch.baseStandardCheckpointV2.numericalCheckpoint.coronary.baseCheckpointV2;
    expect(saved.scientificRecord.equations.initial.volumesMl).toEqual(base.circulation.state.nodeVolumesMl);
    expect(saved.scientificRecord.equations.initial.mechanics).toEqual(base.mechanics.materialState);
    expect(m.provenance.inheritedScientificDocumentId).toBe(historical.documentId);
    expect(m.provenance.inheritedScientificDocumentSha256).toBe(historical.contentSha256);
    expect(m.provenance.reuseScope).toContain("No new fine-grid or reserve experiment");
    expect(m.qualification.checkpoint.checkpointSha256).not.toBe(historical.scientificRecord.measurements.qualification.checkpoint.checkpointSha256);
  });

  it("composes the shared physical modules, with separately identified historical evidence", () => {
    expect(saved.scientificRecord.modules).toEqual(MAIN_WIRE_REFERENCE_CONSTRUCTION_MODULE_IDS_V1.map(id => MAIN_WIRE_MODEL_MODULES_V1.find(m => m.id === id)));
    expect(saved.scientificRecord.equations.nodes).toEqual(historical.scientificRecord.equations.nodes);
    expect(saved.scientificRecord.equations.land).toEqual(historical.scientificRecord.equations.land);
    expect(saved.scientificRecord.measurements.admission.constructionSha256).toBe(historical.scientificRecord.measurements.admission.constructionSha256);
    expect(saved.views.en.records[0].label).toContain("Standard72");
    expect(saved.views.en.records[1].label).toContain("inherited");
    expect(historical.identity.releaseStatus).toBe("local-candidate-not-registered");
    expect(resolveRegisteredModelLaunchCheckpointV1(historical.identity.modelId, historical.scientificRecord.measurements.fixtureIdentity)).toBeUndefined();
    expect(REGISTERED_MODEL_DOCUMENTATION_OPTIONS_V1.map(o => o.label)).toEqual(["Standard 72", "Standard 71", "HFrEF · 慢性左室拡大型"]);
  });

  it.each(["ja", "en"] as const)("renders current and historical documents in %s without substituting identities", async locale => {
    for (const document of [saved, historical]) {
      const html = await renderRoute(document.identity.modelId, document.identity.surfaceReleaseId, locale);
      expect(html).toContain(`data-saved-document="${document.documentId}"`);
      expect(html).toContain(document.identity.title);
      expect(html).toContain('id="documentation-model-version"');
      expect(html).toContain("katex-mathml");
      expect(html).toContain('data-testid="equation-initial-state"');
      expect(html.match(/data-control-id=/g)).toHaveLength(52);
    }
    const current = await renderRoute(saved.identity.modelId, saved.identity.surfaceReleaseId, locale);
    expect(current).toContain(launch.checkpointSha256);
    expect(current).toContain("suga-pva-common-isochrone-owner-with-measured-diastolic-load-display-v13");
    expect(current).toContain(locale === "ja" ? "予測履歴" : "predictor history");
    expect(current).not.toContain(historical.scientificRecord.measurements.qualification.launchPreparation.targetCheckpointSha256);
    expect(await renderRoute(saved.identity.modelId, "surface/unknown", locale)).toContain('data-testid="model-documentation-unavailable-v1"');
  });

  it("does not expose retired per-mint documents and preserves URL encoding", async () => {
    expect(modelDocumentationHref({ locale: "ja", modelId: "model/selected:aortic", surfaceReleaseId: "surface/release:1" }))
      .toBe("/ja/models/model%2Fselected%3Aaortic?surface=surface%2Frelease%3A1");
    expect(await renderRoute("circleheart.main-wire-integrated-transaction-v3.algebraic-pulmonary-root.standard-70", surface.surfaceReleaseId))
      .toContain('data-testid="model-documentation-unavailable-v1"');
  });
  it("pins a particular saved document and never falls back for a missing or cross-model archive", () => {
    const { modelId, surfaceReleaseId } = saved.identity;
    expect(resolveSavedModelDocumentIndexV1(modelId, surfaceReleaseId, saved.documentId)?.contentSha256).toBe(saved.contentSha256);
    expect(resolveSavedModelDocumentIndexV1(modelId, surfaceReleaseId, "not-registered")).toBeNull();
    expect(resolveSavedModelDocumentIndexV1(modelId, surfaceReleaseId, historical.documentId)).toBeNull();
    expect(modelDocumentationHref({ locale: "ja", modelId, surfaceReleaseId, documentId: saved.documentId }))
      .toContain("&document=standard72-document-v1");
  });
  it("rematerializes candidate-dependent coefficients without copying baseline values into shared equations", () => {
    const seed = MAIN_WIRE_FITTING_SEED_V1, a = fittedBaselineEquationDataV1(seed.candidateInputs, seed.checkpoint);
    expect(a.nodes).toEqual(saved.scientificRecord.equations.nodes);
    expect(a.edges).toEqual(saved.scientificRecord.equations.edges);
    expect(a.initial).toEqual(saved.scientificRecord.equations.initial);
    expect(a.calcium).toEqual(saved.scientificRecord.equations.calcium);
    // Coefficient-only probe, not a qualified state/candidate or an adoption.
    const input = JSON.parse(JSON.stringify(seed.candidateInputs));
    input.hemodynamicResearchInputs.systemicResistance = 1.12;
    input.hemodynamicResearchInputs.arterialStiffness = 1.1;
    input.hemodynamicResearchInputs.venousTone = .2;
    input.hemodynamicResearchInputs.heartRateBpm = 60;
    input.mechanismResearchInputs.chamberMechanics.activeTensionScaleByWall.LVFW = 1.1;
    input.mechanismResearchInputs.chamberMechanics.passiveStiffnessScaleByWall.SEP = 1.2;
    const b = fittedBaselineEquationDataV1(input, seed.checkpoint);
    const settings = fittedBaselineSettingsV1({ ...client.defaultFixture,
      hemodynamicResearchInputs: input.hemodynamicResearchInputs, mechanismResearchInputs: input.mechanismResearchInputs });
    expect(settings.find(c => c.controlId === "myocardium.contractility")!.defaultValue).toBeNull();
    expect(settings.find(c => c.controlId === "myocardium.active-tension-scale.LVFW")!.defaultValue).toBe(1.1);
    expect(b.land).toEqual(a.land);
    expect(b.nodes.find(n => n.id === "Ao")!.law).not.toEqual(a.nodes.find(n => n.id === "Ao")!.law);
    expect(b.nodes.find(n => n.id === "SV")!.law).not.toEqual(a.nodes.find(n => n.id === "SV")!.law);
    expect(b.edges.filter(e => e.resistanceGroup === "systemic" && !e.valve)).not.toEqual(a.edges.filter(e => e.resistanceGroup === "systemic" && !e.valve));
    expect(b.rhythm.ventricularIntervalStrength.referenceCycleLengthSec).toBe(1);
    expect(b.calcium.LVFW).not.toEqual(a.calcium.LVFW);
    expect(b.effectiveWalls!.find(w => w.wallId === "LVFW")!.trefPa).toBe(a.land.ventricular.values.Tref * 1.1);
    expect(b.effectiveWalls!.find(w => w.wallId === "SEP")!.slsModulusPa).toBe(b.sls.ventricular.branchModulusPa * 1.2);
    expect(saved.scientificRecord.measurements.fixtureIdentity.hemodynamicResearchInputs.heartRateBpm).toBe(70);
  });
});
