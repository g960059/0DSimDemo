import { createHash } from "node:crypto";
import hfrefArchive from "@/studio/presentation/modelDocumentation/packages/hfref-static-case-document-v4.json";
import reading from "@/studio/presentation/modelDocumentation/packages/standard73-document-v2.reading-v1.json";
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
import saved from "@/studio/presentation/modelDocumentation/packages/standard73-document-v2.json";
import historical from "@/studio/presentation/modelDocumentation/packages/standard71-document-v1.json";
import { MAIN_WIRE_MODEL_MODULES_V1, MAIN_WIRE_REFERENCE_CONSTRUCTION_MODULE_IDS_V1 } from "@/studio/presentation/modelDocumentation/MainWireModelModulesV1";
import { resolveRegisteredModelDisclosureV1, resolveRegisteredModelDocumentationV1, resolveRegisteredPresetDocumentationV1, REGISTERED_MODEL_DOCUMENTATION_OPTIONS_V1 } from "@/studio/presentation/modelDocumentation/RegisteredModelDocumentationV1";
import surface from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioStaticCaseSurfaceV1";
import beatSurface from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioStaticCaseSurfaceV2";
import boundedSurface from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioStaticCaseSurfaceV5";
import pressureSurface from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioStaticCaseSurfaceV4";
import asHigh from "@/studio/presentation/modelDocumentation/packages/standard73-as-high-gradient-document-v1.json";
import asLow from "@/studio/presentation/modelDocumentation/packages/standard73-as-low-flow-document-v1.json";
import { assertAdditiveModelSurfaceUpgradeV1 } from "@/studio/contracts/v2/modelSurface";
import client from "@/data/model-releases/CurrentModelReleaseV1";
import { resolveRegisteredModelLaunchCheckpointV1 } from "@/studio/registry/RegisteredModelLaunchBaselineV1";
import { resolveSavedModelDocumentIndexV1 } from "@/studio/presentation/modelDocumentation/SavedModelDocumentCatalogV1";
import { resolvedMainWireEquationDataV1 } from "@/tools/modelDocumentation/authoring/ResolvedMainWireEquationDataV1";
import { createMainWireIntegratedModelStaticCaseFixtureV1 as fixtureFor } from "@/engine/myocardium/experiments/MainWireIntegratedModelStaticCaseFixtureV1";
import { mainWireIntegratedStudioFixtureProjectionV3 as projection } from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioFixtureControlProjectionV3";
import type { MainWireStaticCaseCheckpointV1 } from "@/engine/myocardium/MainWireStaticCaseCheckpointV1";
import bundle from "@/data/model-releases/standard73/bundle.json";
import { mainWireStaticCaseFittingSeedV1 } from "@/tools/scientific/MainWireStaticCaseFittingSeedV1";
import { MAIN_WIRE_PERIODIC_PVA_METHOD_V14_ID } from "@/analysis/methods/mainWire/MainWirePeriodicPvaV1";
import hfref from "@/studio/presentation/modelDocumentation/packages/hfref-static-case-document-v4.index.json";
import baseline73 from "@/studio/presentation/modelDocumentation/packages/standard73-document-v2.index.json";
import hfref73 from "@/studio/presentation/modelDocumentation/packages/standard73-hfref-document-v2.index.json";

const launch = bundle.baseline.capture.checkpoint.payload as unknown as MainWireStaticCaseCheckpointV1;

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
  it("reuses unchanged model/case qualification without relabelling it as beat-analysis validation", () => {
    expect(() => assertAdditiveModelSurfaceUpgradeV1(surface, beatSurface)).not.toThrow();
    expect({ ...beatSurface, surfaceReleaseId: surface.surfaceReleaseId,
      predecessorSurfaceReleaseId: surface.predecessorSurfaceReleaseId,
      derivedOutputCatalog: surface.derivedOutputCatalog }).toEqual(surface);
    const reference = resolveRegisteredModelDocumentationV1(client.manifest.modelId, beatSurface.surfaceReleaseId)!;
    expect(reference.surfaceReleaseId).toBe(surface.surfaceReleaseId);
    expect(reference.documentId).toBe(saved.documentId);
    // An archived package still never claims the new pair or new measurement definitions.
    expect(resolveSavedModelDocumentIndexV1(client.manifest.modelId, beatSurface.surfaceReleaseId)).toBeNull();
    expect(resolveRegisteredModelDisclosureV1(client.manifest.modelId, beatSurface.surfaceReleaseId).badgeLabel).toBe("MW 73");
    for (const doc of [baseline73, hfref73]) {
      const link = resolveRegisteredPresetDocumentationV1(client.manifest.modelId, beatSurface.surfaceReleaseId, doc.identity.baselineId)!;
      expect(link).toMatchObject({ documentId: doc.documentId, surfaceReleaseId: doc.identity.surfaceReleaseId });
      expect(resolveSavedModelDocumentIndexV1(link.modelId, link.surfaceReleaseId, link.documentId)?.contentSha256).toBe(doc.contentSha256);
    }
    expect(resolveRegisteredPresetDocumentationV1(client.manifest.modelId, beatSurface.surfaceReleaseId, "unknown")).toBeNull();
    expect(resolveRegisteredModelDocumentationV1("model/unknown", beatSurface.surfaceReleaseId)).toBeNull();
  });
  it("reuses the qualified exact-model document under V16 without relabelling its historical assessment", () => {
    const old = resolveRegisteredModelDocumentationV1(client.manifest.modelId, pressureSurface.surfaceReleaseId);
    expect(resolveRegisteredModelDocumentationV1(client.manifest.modelId, boundedSurface.surfaceReleaseId)).toEqual(old);
    expect(old?.surfaceReleaseId).toBe(surface.surfaceReleaseId);
    expect(resolveRegisteredModelDisclosureV1(client.manifest.modelId, boundedSurface.surfaceReleaseId).badgeLabel).toBe("MW 73");
  });
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
      badgeLabel: "MW 73", shortLabel: "Standard 73", limitationsTranslationKey: "modelLimitations.staticAnatomyItems",
    });
    for (const unsupported of [null, "surface/unknown", surface.surfaceReleaseId + ".next"])
      expect(resolveRegisteredModelDocumentationV1(client.manifest.modelId, unsupported)).toBeNull();
    expect(resolveRegisteredModelDocumentationV1("model/unknown", surface.surfaceReleaseId)).toBeNull();
  });

  it("pins the inherited complete Surface and the current exact checkpoints, controls and assessment", () => {
    const m = saved.scientificRecord.measurements;
    expect(saved.identity.modelId).toBe(client.manifest.modelId);
    expect(saved.identity.releaseStatus).toBe("reviewed-release-package");
    expect(m.surfaceDefinition).toEqual(surface);
    expect(m.fixtureIdentity).toEqual(client.defaultFixture);
    expect(m.settings).toEqual(client.manifest.primitiveControlCatalog);
    expect(m.qualification.launchPreparation.targetCheckpointSha256).toBe(launch.checkpointSha256);
    expect(m.construction).toEqual(launch.construction);
    expect(m.admission.reserve.status).toBe("passed");
    const base = launch.base.numericalCheckpoint.coronary.baseCheckpointV2;
    expect(saved.scientificRecord.equations.initial.volumesMl).toEqual(base.circulation.state.nodeVolumesMl);
    expect(saved.scientificRecord.equations.initial.mechanics).toEqual(base.mechanics.materialState);
    expect(m.qualification.checkpoint.checkpointSha256).not.toBe(historical.scientificRecord.measurements.qualification.checkpoint.checkpointSha256);
  });

  it("composes the shared physical modules, with separately identified historical evidence", () => {
    expect(saved.scientificRecord.modules).toEqual(MAIN_WIRE_REFERENCE_CONSTRUCTION_MODULE_IDS_V1.map(id => MAIN_WIRE_MODEL_MODULES_V1.find(m => m.id === id)));
    expect(saved.scientificRecord.equations.nodes).toEqual(historical.scientificRecord.equations.nodes);
    expect(saved.scientificRecord.equations.land).toEqual(historical.scientificRecord.equations.land);
    expect(saved.views.en.records[0].label).toContain("independent cold");
    expect(saved.views.en.records[1].label).toContain("independent cold");
    expect(historical.identity.releaseStatus).toBe("local-candidate-not-registered");
    expect(resolveRegisteredModelLaunchCheckpointV1(historical.identity.modelId, historical.scientificRecord.measurements.fixtureIdentity)).toBeUndefined();
    expect(REGISTERED_MODEL_DOCUMENTATION_OPTIONS_V1.map(o => o.label)).toEqual(["Standard 73", "Standard 73 · HFrEF", "Standard 73 · AS high gradient", "Standard 73 · AS low flow", "Standard 72", "Standard 71", "HFrEF · 慢性左室拡大型"]);
  });

  it.each(["ja", "en"] as const)("renders current and historical documents in %s without substituting identities", async locale => {
    for (const document of [saved, historical]) {
      const html = await renderRoute(document.identity.modelId, document.identity.surfaceReleaseId, locale);
      expect(html).toContain(`data-saved-document="${document.documentId}"`);
      expect(html).toContain(document === saved ? "Standard 73" : document.identity.title);
      expect(html).not.toContain('id="documentation-model-version"');
      expect(html).toContain("katex-mathml");
      expect(html).toContain('data-testid="equation-initial-state"');
      expect(html.match(/data-control-id=/g) ?? []).toHaveLength(document === saved ? 0 : 52);
    }
    const current = await renderRoute(saved.identity.modelId, saved.identity.surfaceReleaseId, locale, "presets");
    expect(current.match(/data-control-id=/g)).toHaveLength(53);
    expect(current).not.toContain('data-equation-block=');
    expect(current).toContain(launch.checkpointSha256);
    expect(current.includes(MAIN_WIRE_PERIODIC_PVA_METHOD_V14_ID)).toBe(true);
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
      .toContain("&document=standard73-document-v2");
  });
  it("rematerializes candidate-dependent coefficients without copying baseline values into shared equations", () => {
    const seed = mainWireStaticCaseFittingSeedV1("baseline");
    const equations = (input: typeof seed) => resolvedMainWireEquationDataV1(input, launch.base,
      fixtureFor(input.anatomyId, input.hemodynamicResearchInputs, 1, input.mechanismResearchInputs));
    const a = equations(seed);
    expect(a.nodes).toEqual(saved.scientificRecord.equations.nodes);
    expect(a.edges).toEqual(saved.scientificRecord.equations.edges);
    expect(a.initial).toEqual(saved.scientificRecord.equations.initial);
    expect(a.calcium).toEqual(saved.scientificRecord.equations.calcium);
    // Coefficient-only probe, not a qualified state/candidate or an adoption.
    const input = JSON.parse(JSON.stringify(seed));
    input.hemodynamicResearchInputs.systemicResistance = 1.12;
    input.hemodynamicResearchInputs.arterialStiffness = 1.1;
    input.hemodynamicResearchInputs.venousTone = .2;
    input.hemodynamicResearchInputs.heartRateBpm = 60;
    input.mechanismResearchInputs.chamberMechanics.activeTensionScaleByWall.LVFW = 1.1;
    input.mechanismResearchInputs.chamberMechanics.passiveStiffnessScaleByWall.SEP = 1.2;
    const b = equations(input);
    const updatedFixture = { ...client.defaultFixture,
      hemodynamicResearchInputs: input.hemodynamicResearchInputs, mechanismResearchInputs: input.mechanismResearchInputs };
    expect(projection.controlValue(updatedFixture, "myocardium.contractility")).toEqual({ status: "mixed" });
    expect(projection.controlValue(updatedFixture, "myocardium.active-tension-scale.LVFW")).toEqual({ status: "value", value: 1.1 });
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
        expect(numbers(html)).toEqual(priorNumbers.sort());
        expect(html).not.toContain("data-equation-block");
        expect(html).toContain("data-reading-parameters");
        expect(html).toContain('id="baseline"');
        for (const entry of view.views[locale].preset.contents) expect(html).toContain(`id="${entry.id}"`);
      }
      expect(() => savedReadingHtmlV1(view, locale, "presets", "missing-record")).toThrow();
    }
  });
  it("groups by exact model while retaining each document's measurement-time Surface", () => {
    const current = currentModelReadingEntryV1()!;
    expect(current.identity.modelId).toBe(baseline73.identity.modelId);
    expect(current.state).toBe("current");
    expect(saved.identity.releaseStatus).toBe("reviewed-release-package");
    expect(compatibleReadingEntriesV1(current).map(e => e.presetLabel.ja)).toEqual(["baseline", "HFrEF · 慢性左室拡大型",
      "AS · 弁狭窄のみ・高勾配", "AS · 低EF・低流量・低勾配"]);
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
    expect(compatibleReadingEntriesV1(disease).map(e => e.documentId)).toEqual([baseline73.documentId, hfref73.documentId, asHigh.documentId, asLow.documentId]);
    expect(resolveSavedModelDocumentIndexV1(baseline.identity.modelId, baseline.identity.surfaceReleaseId)?.documentId).toBe(baseline.documentId);
    expect(resolveSavedModelDocumentIndexV1(baseline.identity.modelId, baseline.identity.surfaceReleaseId, disease.documentId)?.documentId).toBe(disease.documentId);
  });
  it("links every current preset from the new Surface to its own saved assessment, not a relabelled qualification", () => {
    expect(resolveRegisteredModelDisclosureV1(client.manifest.modelId, pressureSurface.surfaceReleaseId).badgeLabel).toBe("MW 73");
    for (const doc of [baseline73, hfref73, asHigh, asLow]) {
      const link = resolveRegisteredPresetDocumentationV1(client.manifest.modelId, pressureSurface.surfaceReleaseId, doc.identity.baselineId)!;
      expect(link.documentId).toBe(doc.documentId);
      expect(link.surfaceReleaseId).toBe(doc.identity.surfaceReleaseId);
      expect(link.surfaceReleaseId).not.toBe(pressureSurface.surfaceReleaseId);
    }
    for (const doc of [asHigh, asLow]) {
      expect(doc.scientificRecord.measurements.formalReview.status).toBe("accepted");
      expect(doc.scientificRecord.measurements.qualification.status).toBe("review-pending");
      expect(MODEL_READING_ENTRIES_V1.find(e => e.documentId === doc.documentId)?.state).toBe("current");
    }
    expect(resolveRegisteredPresetDocumentationV1(client.manifest.modelId, "unrelated-surface", asHigh.identity.baselineId)).toBeNull();
  });
  it("preserves loaded checkpoints that differ from a preset with the same fixture", () => {
    const baseline = { ...bundle.baseline, schemaId: STUDIO_SCENARIO_PRESET_V2_SCHEMA_ID } satisfies ScenarioPresetV2;
    const startup = { ...baseline.capture, checkpoint: { ...baseline.capture.checkpoint,
      payload: { ...baseline.capture.checkpoint.payload, checkpointSha256: "distinct-loaded-checkpoint" } } };
    const entries = workbenchReferencePresetsV1({ modelId: baseline.modelId, baseline, startup,
      supplied: [], loadedLabel: "読込時の状態", loadedDescription: "" });
    expect(startup.fixture).toBe(baseline.capture.fixture);
    expect(entries.map(e => e.presetId)).toEqual([baseline.presetId, "preset/workbench-loaded-state"]);
    expect(entries[0].capture).toBe(baseline.capture);
    expect(entries[1].capture).toBe(startup);
    expect(workbenchReferencePresetsV1({ modelId: baseline.modelId, baseline,
      startup: structuredClone(baseline.capture), supplied: [], loadedLabel: "loaded", loadedDescription: "" })).toEqual([baseline]);
  });
});
