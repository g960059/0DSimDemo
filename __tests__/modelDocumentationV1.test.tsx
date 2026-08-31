import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { ModelDocumentationPage } from
  "@/components/model/ModelDocumentationPage";
import { MainWireStandard66DocumentationV1 } from
  "@/components/model/MainWireStandard66DocumentationV1";
import {
  MAIN_WIRE_AORTIC_RECOVERED_ROOT_PROFILE_V1,
} from "@/engine/valves/MainWireAorticRecoveredRootProfileV1";
import {
  MAIN_WIRE_INTEGRATED_STUDIO_SELECTED_AORTIC_OUTFLOW_MODEL_ID_V1,
} from "@/domain/model/MainWireStandardIdentityV1";
import { modelDocumentationHref } from "@/homeLinks";
import selectedAorticOutflowStandard66SurfaceV1 from
  "@/studio/integrations/mainWireIntegratedV3/model-surface-selected-aortic-outflow-standard66-v1.json";
import selectedAorticOutflowStandard66SurfaceV2 from
  "@/studio/integrations/mainWireIntegratedV3/model-surface-selected-aortic-outflow-standard66-v2.json";
import {
  resolveMainWireStandard66DocumentationFactsV1,
} from "@/studio/presentation/modelDocumentation/MainWireStandard66DocumentationFactsV1";
import {
  resolveRegisteredModelDisclosureV1,
  resolveRegisteredModelDocumentationV1,
} from "@/studio/presentation/modelDocumentation/RegisteredModelDocumentationV1";

const MODEL_ID =
  MAIN_WIRE_INTEGRATED_STUDIO_SELECTED_AORTIC_OUTFLOW_MODEL_ID_V1;
const SURFACE_RELEASE_ID =
  selectedAorticOutflowStandard66SurfaceV1.surfaceReleaseId;

describe("model documentation V1", () => {
  it("builds a locale-scoped URL from the exact model and Surface release", () => {
    expect(modelDocumentationHref({
      locale: "ja",
      modelId: "model/selected:aortic",
      surfaceReleaseId: "surface/release:1",
    })).toBe(
      "/ja/models/model%2Fselected%3Aaortic?surface=surface%2Frelease%3A1",
    );
  });

  it("resolves only the registered exact model and immutable Surface pair", () => {
    const resolved = resolveRegisteredModelDocumentationV1(
      MODEL_ID,
      SURFACE_RELEASE_ID,
    );
    expect(resolved).toEqual({
      kind: "main-wire-selected-aortic-outflow-standard66",
      modelId: MODEL_ID,
      surfaceReleaseId: SURFACE_RELEASE_ID,
      surfaceSeriesId:
        selectedAorticOutflowStandard66SurfaceV1.surfaceSeriesId,
    });
    expect(resolveRegisteredModelDocumentationV1(
      `${MODEL_ID}.other`,
      SURFACE_RELEASE_ID,
    )).toBeNull();
    expect(resolveRegisteredModelDocumentationV1(
      MODEL_ID,
      `${SURFACE_RELEASE_ID}.other`,
    )).toBeNull();
    expect(resolveRegisteredModelDocumentationV1(MODEL_ID, null)).toBeNull();

    expect(resolveRegisteredModelDisclosureV1(
      MODEL_ID,
      SURFACE_RELEASE_ID,
    )).toMatchObject({
      badgeLabel: "MW 66",
      shortLabel: "Main Wire Standard 66",
      limitationsTranslationKey: "modelLimitations.standard66Items",
    });
    expect(resolveRegisteredModelDisclosureV1(
      MODEL_ID,
      `${SURFACE_RELEASE_ID}.other`,
    )).toEqual({
      documentation: null,
      badgeLabel: "MW V3",
      shortLabel: null,
      limitationsTranslationKey: "modelLimitations.items",
    });
  });

  it("derives fixed aortic facts from exact owners and labels from the Surface", () => {
    const identity = resolveRegisteredModelDocumentationV1(
      MODEL_ID,
      SURFACE_RELEASE_ID,
    );
    expect(identity).not.toBeNull();
    const facts = resolveMainWireStandard66DocumentationFactsV1(identity!);
    expect(facts).not.toBeNull();

    const profile = MAIN_WIRE_AORTIC_RECOVERED_ROOT_PROFILE_V1;
    expect(facts?.aortic).toMatchObject({
      referenceMaximumForwardEoaCm2:
        profile.referenceMaximumForwardEoaCm2,
      ascendingAorticDiameterCm: profile.ascendingAorticDiameterCm,
      ascendingAorticAreaCm2: profile.ascendingAorticAreaCm2,
      characteristicImpedanceResistanceMmHgSecPerMl:
        profile.characteristicImpedanceResistanceMmHgSecPerMl,
      residualDownstreamResistanceMmHgSecPerMl:
        profile.residualDownstreamResistanceMmHgSecPerMl,
      sourceTopologyResistanceMmHgSecPerMl:
        profile.sourceTopologyResistanceMmHgSecPerMl,
    });
    expect(facts?.stations).toEqual({
      aopOutputId:
        "hemodynamics.pressure.absolute.aortic-proximal-constitutive-port",
      abpOutputId: "hemodynamics.pressure.absolute.SA",
      rawAoNodeOutputId: "hemodynamics.pressure.absolute.Ao",
      localHydraulicGradientOutputId:
        "hemodynamics.pressure-gradient.valve.local-hydraulic.AoV",
      venaContractaGradientOutputId:
        "hemodynamics.pressure-gradient.valve.vena-contracta-bernoulli.AoV",
    });
    expect(facts?.runtime).toMatchObject({
      heartRateControlId: "rhythm.heart-rate-bpm",
      heartRateChangeSemantics: "cold-restart",
      fixtureChangeSemantics:
        "atomic-cold-restart-at-zero-clock-new-fixture-epoch",
    });
    expect(facts?.surface).toEqual({
      rawPressureVolumeLoop: true,
      formalPressureVolumeAnalysisExposed: false,
      structuralReturnAnalysisExposed: false,
      cardiacCycleAnalysis: null,
    });
  });

  it("keeps the same station documentation available for the additive analysis Surface", () => {
    const identity = resolveRegisteredModelDocumentationV1(
      MODEL_ID,
      selectedAorticOutflowStandard66SurfaceV2.surfaceReleaseId,
    );
    expect(identity).toMatchObject({
      surfaceReleaseId:
        selectedAorticOutflowStandard66SurfaceV2.surfaceReleaseId,
      surfaceSeriesId:
        selectedAorticOutflowStandard66SurfaceV2.surfaceSeriesId,
    });
    expect(resolveMainWireStandard66DocumentationFactsV1(identity!)).toMatchObject({
      surface: {
        rawPressureVolumeLoop: true,
        formalPressureVolumeAnalysisExposed: false,
        structuralReturnAnalysisExposed: false,
        cardiacCycleAnalysis: {
          methodId:
            "main-wire-regular-sinus-station-aware-flow-event-cardiac-cycle-v1",
          exactPresentationIntervalMs: 2,
        },
      },
    });
    const facts = resolveMainWireStandard66DocumentationFactsV1(identity!);
    const ja = renderToStaticMarkup(
      <MemoryRouter initialEntries={["/ja"]}>
        <MainWireStandard66DocumentationV1 facts={facts!} locale="ja" />
      </MemoryRouter>,
    );
    expect(ja).toContain("心周期derived outputs");
    expect(ja).toContain("内部accepted solver substep");
    expect(ja).toContain("2 ms");
    expect(ja).toContain(
      "main-wire-regular-sinus-station-aware-flow-event-cardiac-cycle-v1",
    );
  });

  it("renders the station, measurement, wave, raw-PV, restart, and validation boundaries in both locales", () => {
    const identity = resolveRegisteredModelDocumentationV1(
      MODEL_ID,
      SURFACE_RELEASE_ID,
    )!;
    const facts = resolveMainWireStandard66DocumentationFactsV1(identity)!;

    const ja = renderToStaticMarkup(
      <MemoryRouter initialEntries={["/ja"]}>
        <MainWireStandard66DocumentationV1 facts={facts} locale="ja" />
      </MemoryRouter>,
    );
    expect(ja).toContain("局所static pressure recovery");
    expect(ja).toContain("特定距離のcatheter tip");
    expect(ja).toContain("進行波");
    expect(ja).toContain("raw loop");
    expect(ja).toContain("atomic cold restart");
    expect(ja).toContain("臨床的validation");
    expect(ja).toContain(MODEL_ID);
    expect(ja).toContain(SURFACE_RELEASE_ID);

    const en = renderToStaticMarkup(
      <MemoryRouter initialEntries={["/en"]}>
        <MainWireStandard66DocumentationV1 facts={facts} locale="en" />
      </MemoryRouter>,
    );
    expect(en).toContain("after the valve law accounts for local static recovery");
    expect(en).toContain("catheter tip at a specified distance");
    expect(en).toContain("travelling wave");
    expect(en).toContain("raw loop");
    expect(en).toContain("atomically replaces the accepted clock");
    expect(en).toContain("not physiological or clinical validation");
    expect(en).toContain(
      "hemodynamics.pressure-gradient.valve.local-hydraulic.AoV",
    );
    expect(en).toContain(
      "hemodynamics.pressure-gradient.valve.vena-contracta-bernoulli.AoV",
    );
    expect(en).not.toContain("Pprox =");
    expect(en).not.toContain("ΔPlocal");
  });

  it("routes the registered pair and refuses to substitute a different Surface", () => {
    const validUrl = modelDocumentationHref({
      locale: "ja",
      modelId: MODEL_ID,
      surfaceReleaseId: SURFACE_RELEASE_ID,
    });
    const valid = renderDocumentationRoute(validUrl);
    expect(valid).toContain('data-testid="standard66-model-documentation-v1"');
    expect(valid).toContain("Main Wire Standard 66");

    const invalid = renderDocumentationRoute(
      `/ja/models/${encodeURIComponent(MODEL_ID)}?surface=other-surface`,
    );
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
