import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { ModelDocumentationPage } from "@/components/model/ModelDocumentationPage";
import {
  MAIN_WIRE_INTEGRATED_STUDIO_ALGEBRAIC_PULMONARY_ROOT_MODEL_ID_V1,
  MAIN_WIRE_INTEGRATED_STUDIO_ALGEBRAIC_PROXIMAL_ROOTS_MODEL_ID_V1,
  MAIN_WIRE_INTEGRATED_STUDIO_QUALIFIED_BASELINE_MODEL_ID_V1,
  MAIN_WIRE_INTEGRATED_STUDIO_ROUNDED_EJECTION_MODEL_ID_V1,
  MAIN_WIRE_INTEGRATED_STUDIO_SELECTED_AORTIC_OUTFLOW_MODEL_ID_V1,
  MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_MODEL_ID_V1,
} from "@/domain/model/MainWireStandardIdentityV1";
import { modelDocumentationHref } from "@/homeLinks";
import surface from
  "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioAlgebraicPulmonaryRootSurfaceV1";
import {
  resolveMainWireStandard70DocumentationFactsV1,
} from "@/studio/presentation/modelDocumentation/MainWireStandard70DocumentationFactsV1";
import {
  resolveRegisteredModelDisclosureV1,
  resolveRegisteredModelDocumentationV1,
} from "@/studio/presentation/modelDocumentation/RegisteredModelDocumentationV1";
import {
  resolveRegisteredExactModelBaselineValidationV1,
} from "@/studio/registry/RegisteredExactModelBaselineValidationV1";

const MODEL_ID = MAIN_WIRE_INTEGRATED_STUDIO_ALGEBRAIC_PULMONARY_ROOT_MODEL_ID_V1;
const SURFACE_RELEASE_ID = surface.surfaceReleaseId;

describe("model documentation V1", () => {
  it("builds a locale-scoped URL from the exact model and Surface release", () => {
    expect(modelDocumentationHref({
      locale: "ja",
      modelId: "model/selected:aortic",
      surfaceReleaseId: "surface/release:1",
    })).toBe("/ja/models/model%2Fselected%3Aaortic?surface=surface%2Frelease%3A1");
  });

  it("resolves only the current exact model and immutable Surface pair", () => {
    expect(resolveRegisteredModelDocumentationV1(MODEL_ID, SURFACE_RELEASE_ID))
      .toEqual({
        kind: "main-wire-algebraic-pulmonary-root-standard70",
        modelId: MODEL_ID,
        surfaceReleaseId: SURFACE_RELEASE_ID,
        surfaceSeriesId: surface.surfaceSeriesId,
      });
    expect(resolveRegisteredModelDocumentationV1("model/unknown", SURFACE_RELEASE_ID))
      .toBeNull();
    expect(resolveRegisteredModelDocumentationV1(MODEL_ID, "surface/unknown"))
      .toBeNull();
    expect(resolveRegisteredModelDocumentationV1(MODEL_ID, null)).toBeNull();
    expect(resolveRegisteredModelDisclosureV1(MODEL_ID, SURFACE_RELEASE_ID))
      .toMatchObject({
        badgeLabel: "MW 70",
        shortLabel: "Main Wire Standard 70",
        limitationsTranslationKey: "modelLimitations.standard70Items",
      });
    expect(resolveRegisteredModelDisclosureV1(MODEL_ID, "surface/unknown"))
      .toEqual({
        documentation: null,
        badgeLabel: "MW V3",
        shortLabel: null,
        limitationsTranslationKey: "modelLimitations.items",
      });
  });

  it.each([
    MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_MODEL_ID_V1,
    MAIN_WIRE_INTEGRATED_STUDIO_SELECTED_AORTIC_OUTFLOW_MODEL_ID_V1,
    MAIN_WIRE_INTEGRATED_STUDIO_ALGEBRAIC_PROXIMAL_ROOTS_MODEL_ID_V1,
    MAIN_WIRE_INTEGRATED_STUDIO_ROUNDED_EJECTION_MODEL_ID_V1,
    MAIN_WIRE_INTEGRATED_STUDIO_QUALIFIED_BASELINE_MODEL_ID_V1,
  ])("does not substitute current documentation or baseline evidence for retired %s", (modelId) => {
    expect(resolveRegisteredModelDocumentationV1(modelId, SURFACE_RELEASE_ID)).toBeNull();
    expect(resolveRegisteredModelDisclosureV1(modelId, SURFACE_RELEASE_ID).documentation)
      .toBeNull();
    expect(resolveRegisteredExactModelBaselineValidationV1(modelId)).toBeNull();
    expect(renderDocumentationRoute(modelDocumentationHref({
      locale: "ja", modelId, surfaceReleaseId: SURFACE_RELEASE_ID,
    }))).toContain('data-testid="model-documentation-unavailable-v1"');
  });

  it("derives current stations, dynamics, controls, analyses, and baseline evidence", () => {
    const identity = resolveRegisteredModelDocumentationV1(MODEL_ID, SURFACE_RELEASE_ID)!;
    const facts = resolveMainWireStandard70DocumentationFactsV1(identity);
    expect(facts).toMatchObject({
      generation: 70,
      stations: {
        aopOutputId: "hemodynamics.pressure.absolute.Ao",
        abpOutputId: "hemodynamics.pressure.absolute.SA",
        aopRole: "source-aortic-root-compliance-node",
        localPressureRecoveryModeled: false,
      },
      dynamics: {
        aorticOutflowCirculationProfileId: "main-wire-source-aortic-outflow-topology-v3",
        proximalArterialRootMomentum: "source-inertance",
        pulmonaryArterialRootMomentum: "algebraic-no-inertance",
        newContinuousStateAdded: false,
        valveOpeningStateAdded: false,
      },
      runtime: {
        heartRateControlId: "rhythm.heart-rate-bpm",
        heartRateChangeSemantics: "accepted-state-warm-start",
        fixtureChangeSemantics:
          "atomic-accepted-state-warm-start-bounded-tbv-continuation-new-fixture-epoch",
      },
      surface: {
        rawPressureVolumeLoop: true,
        formalPressureVolumeAnalysisExposed: true,
        structuralReturnAnalysisExposed: true,
        espvrLoadDomain: "preload-reduction-through-operating-anchor",
      },
      baseline: { passedCheckCount: 41 },
    });
    expect(resolveMainWireStandard70DocumentationFactsV1({
      ...identity, modelId: "model/unknown",
    })).toBeNull();
    expect(resolveMainWireStandard70DocumentationFactsV1({
      ...identity, surfaceReleaseId: "surface/unknown",
    })).toBeNull();
    expect(resolveMainWireStandard70DocumentationFactsV1({
      ...identity, surfaceSeriesId: "series/unknown",
    })).toBeNull();
  });

  it.each(["ja", "en"] as const)("renders the complete current explanation in %s", (locale) => {
    const valid = renderDocumentationRoute(modelDocumentationHref({
      locale, modelId: MODEL_ID, surfaceReleaseId: SURFACE_RELEASE_ID,
    }));
    expect(valid).toContain('data-testid="standard70-model-documentation-v1"');
    expect(valid).toContain("Main Wire Standard 70");
    expect(valid).toContain(MODEL_ID);
    expect(valid).toContain(SURFACE_RELEASE_ID);
    expect(valid).toContain("ESPVR");
    expect(valid).toContain("EDPVR");
    expect(valid).toContain("PVA/PE");
    expect(valid).toContain("Starling");
    expect(valid).toContain("PA–PArt");
    expect(valid).toContain(locale === "ja" ? "atomic warm start" : "atomically warm-start");
    expect(valid).toContain(locale === "ja" ? "pressure recoveryを適用していない" : "no local pressure-recovery correction");
    expect(valid).toContain(locale === "ja" ? "臨床的妥当性は未確立" : "not clinically validated");
    expect(valid).toContain(locale === "ja" ? "進行波" : "travelling waves");
  });

  it("refuses to substitute documentation for a different Surface", () => {
    const invalid = renderDocumentationRoute(modelDocumentationHref({
      locale: "ja", modelId: MODEL_ID, surfaceReleaseId: "surface/unknown",
    }));
    expect(invalid).toContain('data-testid="model-documentation-unavailable-v1"');
    expect(invalid).toContain("別のSurfaceの説明を代用することはありません");
  });
});

function renderDocumentationRoute(initialEntry: string): string {
  return renderToStaticMarkup(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/:locale/models/:modelId" element={<ModelDocumentationPage />} />
      </Routes>
    </MemoryRouter>,
  );
}
