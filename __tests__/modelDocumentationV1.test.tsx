import { createHash } from "node:crypto";
import hfrefArchive from "@/studio/presentation/modelDocumentation/packages/hfref-static-case-document-v4.json";
import reading from "@/studio/presentation/modelDocumentation/packages/standard72-document-v1.reading-v1.json";
import caseReading from "@/studio/presentation/modelDocumentation/packages/hfref-static-case-document-v4.reading-v1.json";
import { readingMatchesDocumentV1, savedReadingHtmlV1, type SavedModelReadingV1 } from "@/studio/presentation/modelDocumentation/SavedModelReadingV1";
import { savedDocumentHtmlV1, type SavedModelDocumentV1 } from "@/studio/presentation/modelDocumentation/SavedModelDocumentV1";
import { MODEL_READING_ENTRIES_V1, compatibleReadingEntriesV1, currentModelReadingEntryV1, modelReadingPresetLabelV1 } from "@/studio/presentation/modelDocumentation/ModelReadingCatalogV1";
import { workbenchReferencePresetsV1 } from "@/components/workbench/WorkbenchReferencePresetsV1";
import { STUDIO_SCENARIO_PRESET_V2_SCHEMA_ID, type ScenarioPresetV2 } from "@/studio/contracts/v2/content";
import { modelLibraryHref } from "@/homeLinks";
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
import baseline73 from "@/studio/presentation/modelDocumentation/packages/standard73-document-v2.index.json";
import hfref73 from "@/studio/presentation/modelDocumentation/packages/standard73-hfref-document-v2.index.json";

function renderRoute(modelId: string, surfaceReleaseId: string, locale: "ja" | "en" = "ja", view?: "guide" | "presets") {
  return new Promise<string>((resolve, reject) => {
    const output = new PassThrough();
    let html = "";
    output.setEncoding("utf8");
    output.on("data", chunk => { html += chunk; });
    output.on("end", () => resolve(html));
    output.on("error", reject);
    const stream = renderToPipeableStream(<MemoryRouter initialEntries={[modelDocumentationHref({ locale, modelId, surfaceReleaseId, view })]}>
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
    expect(REGISTERED_MODEL_DOCUMENTATION_OPTIONS_V1.map(o => o.label)).toEqual(["Standard 73", "Standard 73 · HFrEF", "Standard 72", "Standard 71", "HFrEF · 慢性左室拡大型"]);
  });

  it.each(["ja", "en"] as const)("renders current and historical documents in %s without substituting identities", async locale => {
    for (const document of [saved, historical]) {
      const html = await renderRoute(document.identity.modelId, document.identity.surfaceReleaseId, locale);
      expect(html).toContain(`data-saved-document="${document.documentId}"`);
      expect(html).toContain(document === saved ? "Standard 72" : document.identity.title);
      expect(html).not.toContain('id="documentation-model-version"');
      expect(html).toContain("katex-mathml");
      expect(html).toContain('data-testid="equation-initial-state"');
      expect(html.match(/data-control-id=/g) ?? []).toHaveLength(document === saved ? 0 : 52);
    }
    const current = await renderRoute(saved.identity.modelId, saved.identity.surfaceReleaseId, locale, "presets");
    expect(current.match(/data-control-id=/g)).toHaveLength(52);
    expect(current).not.toContain('data-equation-block=');
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

describe("separate model and preset reader, bound to preserved records", () => {
  it.each([[saved, reading], [hfrefArchive, caseReading]])("retains the scientific archive and complete effective settings", (source, projection) => {
    const archive = source as SavedModelDocumentV1, view = projection as SavedModelReadingV1;
    const { contentSha256, ...body } = projection;
    expect(createHash("sha256").update(JSON.stringify(body)).digest("hex")).toBe(contentSha256);
    expect(readingMatchesDocumentV1(view, archive)).toBe(true);
    expect(readingMatchesDocumentV1({ ...view, source: { ...view.source, contentSha256: "wrong" } }, archive)).toBe(false);
    for (const locale of ["ja", "en"] as const) {
      const guide = savedReadingHtmlV1(view, locale, "guide");
      expect(guide).not.toContain("data-reading-parameters");
      expect(guide).not.toContain('data-stored-number=');
      expect(guide).not.toContain('id="baseline"');
      expect(guide).toContain("data-equation-block");
      const numbers = (html: string) => Array.from(html.matchAll(/data-stored-number="([^"]+)"/g), m => m[1]).sort();
      for (const [i, record] of view.views[locale].preset.records.entries()) {
        const html = savedReadingHtmlV1(view, locale, "presets", record.recordId);
        const priorNumbers = numbers(savedDocumentHtmlV1(archive, locale, i));
        // Standard72 retained these interval coefficients in JSON but omitted
        // their HTML table. The new reader exposes those same stored values.
        if (source.documentId === saved.documentId) {
          const interval = saved.scientificRecord.equations.rhythm.ventricularIntervalStrength;
          priorNumbers.push(...[interval.recoveryTimeConstantSec, interval.releaseFractionBeta,
            interval.releasedLoadReturnFractionR, interval.intervalInfluxInhibitionFractionH,
            interval.referenceCycleLengthSec, interval.referenceRecoveryFractionA,
            interval.referenceNormalizedSrLoadState, interval.normalizedIntervalInfluxGamma].map(String));
        }
        expect(numbers(html)).toEqual(priorNumbers.sort());
        expect(html).not.toContain("data-equation-block");
        expect(html).toContain("data-reading-parameters");
        expect(html).toContain('id="baseline"');
        for (const entry of view.views[locale].preset.contents) expect(html).toContain(`id="${entry.id}"`);
      }
      expect(() => savedReadingHtmlV1(view, locale, "presets", "missing-record")).toThrow();
    }
  });
  it("groups by exact model and Surface, not disease name or creation-time candidate status", () => {
    const current = currentModelReadingEntryV1()!;
    expect(current.identity.modelId).toBe(baseline73.identity.modelId);
    expect(current.state).toBe("current");
    expect(saved.identity.releaseStatus).toBe("local-candidate-not-registered");
    expect(compatibleReadingEntriesV1(current).map(e => e.presetLabel.ja)).toEqual(["baseline", "HFrEF · 慢性左室拡大型"]);
    expect(modelReadingPresetLabelV1(current, "ja")).toBe("baseline・プリセット");
    const disease = MODEL_READING_ENTRIES_V1.find(e => e.documentId === hfrefArchive.documentId)!;
    expect(disease.state).toBe("research");
    expect(modelReadingPresetLabelV1(disease, "ja")).toBe("プリセット");
    expect(compatibleReadingEntriesV1(disease).some(e => e.identity.modelId === current.identity.modelId)).toBe(false);
    expect(modelLibraryHref("ja")).toBe("/ja/models");
    expect(modelDocumentationHref({ locale: "en", ...current.identity, documentId: current.documentId, view: "presets" })).toContain("&view=presets");
  });
  it("does not relabel a loaded case as the registered baseline", () => {
    const baseline: ScenarioPresetV2 = { schemaId: STUDIO_SCENARIO_PRESET_V2_SCHEMA_ID, presetId: "baseline/registered", modelId: "model/current", title: "baseline", description: "",
      capture: { fixture: { tbv: 4935 }, checkpoint: { acceptedRevision: 1, acceptedTimeSec: 0, payload: {} } } };
    const startup = { ...baseline.capture, fixture: { tbv: 6000 } };
    const entries = workbenchReferencePresetsV1({ modelId: baseline.modelId, baseline, startup, supplied: [], loadedLabel: "読込時の状態", loadedDescription: "" });
    expect(entries.map(e => e.title)).toEqual(["baseline", "読込時の状態"]);
    expect(entries[0].capture).toBe(baseline.capture);
    expect(entries[1].capture).toBe(startup);
    expect(workbenchReferencePresetsV1({ modelId: baseline.modelId, baseline, startup: baseline.capture, supplied: [], loadedLabel: "loaded", loadedDescription: "" })).toEqual([baseline]);
    expect(workbenchReferencePresetsV1({ modelId: baseline.modelId, baseline, supplied: [baseline], loadedLabel: "loaded", loadedDescription: "" })).toEqual([baseline]);
    expect(() => workbenchReferencePresetsV1({ modelId: baseline.modelId, baseline,
      supplied: [{ ...baseline, capture: startup }], loadedLabel: "loaded", loadedDescription: "" })).toThrow(/Conflicting captures/);
    // A research composition supplies its own explicitly identified baseline,
    // not the selected production model's baseline or a relabeled loaded state.
    expect(workbenchReferencePresetsV1({ modelId: baseline.modelId, startup: baseline.capture, supplied: [baseline], loadedLabel: "loaded", loadedDescription: "" })).toEqual([baseline]);
  });
  it("groups the public baseline and HFrEF under the current model", () => {
    expect(currentModelReadingEntryV1()?.identity.modelId).toBe(baseline73.identity.modelId);
    const baseline = MODEL_READING_ENTRIES_V1.find(e => e.documentId === baseline73.documentId)!;
    const disease = MODEL_READING_ENTRIES_V1.find(e => e.documentId === hfref73.documentId)!;
    expect(baseline.presetKind).toBe("baseline"); expect(disease.presetKind).toBe("case");
    expect(baseline.state).toBe("current"); expect(disease.state).toBe("current");
    expect(baseline.modelLabel).toEqual(disease.modelLabel);
    expect(compatibleReadingEntriesV1(disease).map(e => e.documentId)).toEqual([baseline73.documentId, hfref73.documentId]);
    expect(resolveSavedModelDocumentIndexV1(baseline.identity.modelId, baseline.identity.surfaceReleaseId)?.documentId).toBe(baseline.documentId);
    expect(resolveSavedModelDocumentIndexV1(baseline.identity.modelId, baseline.identity.surfaceReleaseId, disease.documentId)?.documentId).toBe(disease.documentId);
  });
});
