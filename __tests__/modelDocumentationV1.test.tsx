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
  MAIN_WIRE_INTEGRATED_STUDIO_ALGEBRAIC_PROXIMAL_ROOTS_MODEL_ID_V1,
  MAIN_WIRE_INTEGRATED_STUDIO_ROUNDED_EJECTION_MODEL_ID_V1,
  MAIN_WIRE_INTEGRATED_STUDIO_SELECTED_AORTIC_OUTFLOW_MODEL_ID_V1,
} from "@/domain/model/MainWireStandardIdentityV1";
import { modelDocumentationHref } from "@/homeLinks";
import selectedAorticOutflowStandard66SurfaceV1 from
  "@/studio/integrations/mainWireIntegratedV3/model-surface-selected-aortic-outflow-standard66-v2.json";
import algebraicProximalRootsStandard67SurfaceV1 from
  "@/studio/integrations/mainWireIntegratedV3/model-surface-algebraic-proximal-roots-standard67-v1.json";
import roundedEjectionStandard68SurfaceV1 from
  "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioRoundedEjectionSurfaceV1";
import {
  resolveMainWireStandard66DocumentationFactsV1,
} from "@/studio/presentation/modelDocumentation/MainWireStandard66DocumentationFactsV1";
import {
  resolveMainWireStandard68DocumentationFactsV1,
} from "@/studio/presentation/modelDocumentation/MainWireStandard68DocumentationFactsV1";
import {
  resolveRegisteredModelDisclosureV1,
  resolveRegisteredModelDocumentationV1,
} from "@/studio/presentation/modelDocumentation/RegisteredModelDocumentationV1";

const MODEL_ID =
  MAIN_WIRE_INTEGRATED_STUDIO_SELECTED_AORTIC_OUTFLOW_MODEL_ID_V1;
const SURFACE_RELEASE_ID =
  selectedAorticOutflowStandard66SurfaceV1.surfaceReleaseId;
const STANDARD67_MODEL_ID =
  MAIN_WIRE_INTEGRATED_STUDIO_ALGEBRAIC_PROXIMAL_ROOTS_MODEL_ID_V1;
const STANDARD67_SURFACE_RELEASE_ID =
  algebraicProximalRootsStandard67SurfaceV1.surfaceReleaseId;
const STANDARD68_MODEL_ID =
  MAIN_WIRE_INTEGRATED_STUDIO_ROUNDED_EJECTION_MODEL_ID_V1;
const STANDARD68_SURFACE_RELEASE_ID =
  roundedEjectionStandard68SurfaceV1.surfaceReleaseId;

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
      formalPressureVolumeAnalysisExposed: true,
      structuralReturnAnalysisExposed: true,
    });
  });

  it("binds Standard67 documentation to its algebraic-root exact identity", () => {
    const identity = resolveRegisteredModelDocumentationV1(
      STANDARD67_MODEL_ID,
      STANDARD67_SURFACE_RELEASE_ID,
    );
    expect(identity).toEqual({
      kind: "main-wire-algebraic-proximal-roots-standard67",
      modelId: STANDARD67_MODEL_ID,
      surfaceReleaseId: STANDARD67_SURFACE_RELEASE_ID,
      surfaceSeriesId:
        algebraicProximalRootsStandard67SurfaceV1.surfaceSeriesId,
    });
    expect(resolveRegisteredModelDisclosureV1(
      STANDARD67_MODEL_ID,
      STANDARD67_SURFACE_RELEASE_ID,
    )).toMatchObject({
      badgeLabel: "MW 67",
      shortLabel: "Main Wire Standard 67",
      limitationsTranslationKey: "modelLimitations.standard67Items",
    });

    const facts = resolveMainWireStandard66DocumentationFactsV1(identity!);
    expect(facts).toMatchObject({
      generation: 67,
      proximalArterialRoots: {
        aorticRootEdgeId: "Ao_SA",
        pulmonaryRootEdgeId: "PA_PArt",
        flowLaw: "same-candidate-algebraic-linear-quadratic",
        inertanceMmHgSec2PerMl: 0,
        acceptedRootFlowRecordRole:
          "exact-accepted-algebraic-flow-readback-not-continuation-memory",
      },
    });
    expect(resolveRegisteredModelDocumentationV1(
      STANDARD67_MODEL_ID,
      SURFACE_RELEASE_ID,
    )).toBeNull();
  });

  it("binds Standard68 documentation to its rounded-ejection Surface", () => {
    const identity = resolveRegisteredModelDocumentationV1(
      STANDARD68_MODEL_ID,
      STANDARD68_SURFACE_RELEASE_ID,
    );
    expect(identity).toEqual({
      kind: "main-wire-rounded-ejection-standard68",
      modelId: STANDARD68_MODEL_ID,
      surfaceReleaseId: STANDARD68_SURFACE_RELEASE_ID,
      surfaceSeriesId: roundedEjectionStandard68SurfaceV1.surfaceSeriesId,
    });
    expect(resolveRegisteredModelDisclosureV1(
      STANDARD68_MODEL_ID,
      STANDARD68_SURFACE_RELEASE_ID,
    )).toMatchObject({
      badgeLabel: "MW 68",
      shortLabel: "Main Wire Standard 68",
      limitationsTranslationKey: "modelLimitations.standard68Items",
    });

    const facts = resolveMainWireStandard68DocumentationFactsV1(identity!);
    expect(facts).toMatchObject({
      generation: 68,
      stations: {
        aopRole: "source-aortic-root-compliance-node",
        localPressureRecoveryModeled: false,
      },
      dynamics: {
        aorticOutflowCirculationProfileId:
          "main-wire-source-aortic-outflow-topology-v3",
        proximalArterialRootMomentum: "source-inertance",
        newContinuousStateAdded: false,
        valveOpeningStateAdded: false,
      },
      runtime: {
        heartRateChangeSemantics: "accepted-state-warm-start",
        fixtureChangeSemantics:
          "atomic-accepted-state-warm-start-bounded-tbv-continuation-new-fixture-epoch",
      },
      surface: {
        rawPressureVolumeLoop: true,
        formalPressureVolumeAnalysisExposed: true,
        structuralReturnAnalysisExposed: true,
      },
    });
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
    expect(ja).toContain("raw orbit");
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
    expect(en).toContain("raw PV orbit");
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

  it("renders Standard67 root semantics without substituting Standard66 copy", () => {
    const validUrl = modelDocumentationHref({
      locale: "ja",
      modelId: STANDARD67_MODEL_ID,
      surfaceReleaseId: STANDARD67_SURFACE_RELEASE_ID,
    });
    const valid = renderDocumentationRoute(validUrl);
    expect(valid).toContain('data-testid="standard67-model-documentation-v1"');
    expect(valid).toContain("Main Wire Standard 67");
    expect(valid).toContain("Ao–SAとPA–PArt");
    expect(valid).toContain("momentum memory");
    expect(valid).toContain(STANDARD67_MODEL_ID);
    expect(valid).not.toContain("Standard 67そのものの臨床validation evidenceではありません。Standard 66");
  });

  it("renders Standard68 rounded-ejection and warm-start boundaries", () => {
    const validUrl = modelDocumentationHref({
      locale: "ja",
      modelId: STANDARD68_MODEL_ID,
      surfaceReleaseId: STANDARD68_SURFACE_RELEASE_ID,
    });
    const valid = renderDocumentationRoute(validUrl);
    expect(valid).toContain('data-testid="standard68-model-documentation-v1"');
    expect(valid).toContain("Main Wire Standard 68");
    expect(valid).toContain("rounded-ejection assembly");
    expect(valid).toContain("atomic warm start");
    expect(valid).toContain(STANDARD68_MODEL_ID);
    expect(valid).not.toContain("新しいexact trajectoryを開始します");
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
