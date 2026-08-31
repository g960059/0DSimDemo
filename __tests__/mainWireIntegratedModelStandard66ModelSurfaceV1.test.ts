import { describe, expect, it } from "vitest";

import {
  createDefaultExperimentSurfaceV3,
  graphSeriesLabelV3,
} from "@/components/workbench/WorkbenchSurfaceV3";
import {
  MAIN_WIRE_AORTIC_RECOVERED_ROOT_PORT_OUTPUT_IDS_V1,
} from "@/engine/myocardium/MainWireAorticRecoveredRootPortOutputOverlayV1";
import {
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD_66_OUTPUT_IDS_V1,
} from "@/engine/myocardium/MainWireIntegratedModelStandard66OutputRegistryV1";
import type { ModelContractV2 } from "@/studio/contracts/v2/model";
import {
  assertModelSurfaceReleaseManifestV1,
  composeStandardModelContractV1,
} from "@/studio/contracts/v2/modelSurface";
import {
  createMainWireIntegratedStudioSelectedAorticOutflowKernelV1,
} from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioSelectedAorticOutflowExactModelV1";
import selectedStandard66SurfaceV1 from "@/studio/integrations/mainWireIntegratedV3/model-surface-selected-aortic-outflow-standard66-v1.json";
import {
  STUDIO_OUTPUT_PRESSURE_SUMMARIES_V1,
  resolveStudioItemPresentationV1,
} from "@/studio/presentation/StudioItemPresentationCatalogV1";

const PROXIMAL_AORTIC_PRESSURE_OUTPUT_ID_V1 =
  "hemodynamics.pressure.absolute.aortic-proximal-constitutive-port";
const SYSTEMIC_ARTERIAL_PRESSURE_OUTPUT_ID_V1 =
  "hemodynamics.pressure.absolute.SA";
const SYSTEMIC_ARTERIAL_PRESSURE_SUMMARY_IDS_V1 = Object.freeze([
  "hemodynamics.pressure.systolic.SA",
  "hemodynamics.pressure.diastolic.SA",
  "hemodynamics.pressure.mean.SA",
] as const);
const HIDDEN_AMBIGUOUS_OUTPUT_IDS_V1 = Object.freeze([
  "hemodynamics.pressure.absolute.Ao",
  "hemodynamics.pressure.mean.Ao",
  "hemodynamics.pressure.systolic.Ao",
  "hemodynamics.pressure.diastolic.Ao",
  "hemodynamics.pressure.pulse.Ao",
  "hemodynamics.pressure-gradient.valve.mean-hydraulic-forward.AoV",
  "hemodynamics.pressure-gradient.valve.peak-hydraulic-forward.AoV",
  "coronary.pressure-perfusion.surrogate.Ao-diastolic-minus-LVEDP",
] as const);
const STANDARD_66_EXACT_OUTPUT_ID_SET_V1 = new Set<string>(
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD_66_OUTPUT_IDS_V1,
);
const HIDDEN_AMBIGUOUS_OUTPUT_ID_SET_V1 = new Set<string>(
  HIDDEN_AMBIGUOUS_OUTPUT_IDS_V1,
);

describe("Main Wire Standard66 selected-aortic Model Surface V1", () => {
  it("exposes exactly 168 of 176 exact outputs by hiding only the eight ambiguous historical outputs", () => {
    expect(selectedStandard66SurfaceV1.surfaceReleaseId).toBe(
      "circleheart.main-wire.surface.selected-aortic-outflow.standard-66.workbench-v1",
    );
    expect(selectedStandard66SurfaceV1.surfaceSeriesId).toBe(
      "circleheart.main-wire.surface.selected-aortic-outflow.standard-66.workbench",
    );
    assertModelSurfaceReleaseManifestV1(selectedStandard66SurfaceV1);

    expect(MAIN_WIRE_INTEGRATED_MODEL_STANDARD_66_OUTPUT_IDS_V1).toHaveLength(
      176,
    );
    expect(selectedStandard66SurfaceV1.exposedExactOutputIds).toHaveLength(168);
    expect(
      new Set(selectedStandard66SurfaceV1.exposedExactOutputIds).size,
    ).toBe(168);

    const exposed = new Set(
      selectedStandard66SurfaceV1.exposedExactOutputIds,
    );
    expect(
      MAIN_WIRE_INTEGRATED_MODEL_STANDARD_66_OUTPUT_IDS_V1.filter(
        (outputId) => !exposed.has(outputId),
      ),
    ).toEqual(HIDDEN_AMBIGUOUS_OUTPUT_IDS_V1);
    expect(
      selectedStandard66SurfaceV1.exposedExactOutputIds.filter(
        (outputId) =>
          !STANDARD_66_EXACT_OUTPUT_ID_SET_V1.has(outputId),
      ),
    ).toEqual([]);

    for (const graph of selectedStandard66SurfaceV1.graphCatalog) {
      for (const series of graph.seriesCatalog) {
        const referencedOutputIds = "outputId" in series
          ? [series.outputId]
          : [
              series.volumeOutputId,
              series.pressureOutputId,
              series.cyclePhaseOutputId,
            ];
        for (const outputId of referencedOutputIds) {
          expect(exposed.has(outputId)).toBe(true);
        }
      }
    }
  });

  it("maps clinical AoP and ABP to the selected physical stations without leaking raw Ao", () => {
    for (const graphId of [
      "hemodynamics.pressure.waveform",
      "hemodynamics.pressure.waveform.comprehensive-v1",
    ]) {
      const graph = selectedStandard66SurfaceV1.graphCatalog.find(
        (candidate) => candidate.graphId === graphId,
      );
      expect(graph).toBeDefined();
      expect(graph?.defaultSeriesIds).toEqual(["AoP", "LVP", "LAP"]);
      expect(graph?.seriesCatalog).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            seriesId: "AoP",
            outputId: PROXIMAL_AORTIC_PRESSURE_OUTPUT_ID_V1,
          }),
          expect.objectContaining({
            seriesId: "ABP",
            outputId: SYSTEMIC_ARTERIAL_PRESSURE_OUTPUT_ID_V1,
          }),
        ]),
      );
      expect(
        graph?.seriesCatalog.some(
          (series) =>
            "outputId" in series
            && HIDDEN_AMBIGUOUS_OUTPUT_ID_SET_V1.has(series.outputId),
        ),
      ).toBe(false);
    }
    expect(graphSeriesLabelV3("AoP")).toBe("AoP");
    expect(graphSeriesLabelV3("ABP")).toBe("ABP");
  });

  it("publishes only implemented capabilities while retaining the exact raw LV PV loop", () => {
    expect(selectedStandard66SurfaceV1.controlCatalog).toEqual([
      {
        controlId: "rhythm.heart-rate-bpm",
        preferredPresentation: "slider",
        requiredCapabilities: ["control/rhythm.heart-rate-bpm"],
      },
    ]);
    expect(selectedStandard66SurfaceV1.derivedOutputCatalog).toEqual([]);
    expect(
      selectedStandard66SurfaceV1.graphCatalog.some(
        ({ graphId }) => graphId === "hemodynamics.guyton-starling",
      ),
    ).toBe(false);
    expect(
      selectedStandard66SurfaceV1.graphCatalog.flatMap(
        ({ requiredCapabilities }) =>
          requiredCapabilities.filter((capability) =>
            capability.startsWith("analysis/"),
          ),
      ),
    ).toEqual([]);

    const pressureVolume = selectedStandard66SurfaceV1.graphCatalog.find(
      ({ graphId }) => graphId === "hemodynamics.pressure-volume",
    );
    expect(pressureVolume).toMatchObject({
      renderer: "pressure-volume",
      defaultSeriesIds: ["LV"],
    });
    expect(pressureVolume?.requiredCapabilities).toEqual(
      expect.arrayContaining([
        "output/hemodynamics.volume.LV",
        "output/hemodynamics.pressure.transmural.LV",
        "output/rhythm.phase.regular-sinus",
      ]),
    );

    const composed = composeStandardModelContractV1(
      createMainWireIntegratedStudioSelectedAorticOutflowKernelV1(),
      selectedStandard66SurfaceV1,
    );
    expect(composed.contract.outputCatalog).toHaveLength(168);
    expect(composed.contract.controlCatalog).toHaveLength(1);
    expect(composed.contract.graphCatalog).toHaveLength(5);
    expect(composed.surface.derivedOutputCatalog).toEqual([]);
  });

  it("selects the existing ABP summary and familiar waveform defaults in Workbench", () => {
    const contract = {
      graphCatalog: selectedStandard66SurfaceV1.graphCatalog,
      outputCatalog: selectedStandard66SurfaceV1.exposedExactOutputIds.map(
        (outputId) => ({ outputId }),
      ),
      controlCatalog: [{ controlId: "rhythm.heart-rate-bpm" }],
    } as unknown as ModelContractV2;
    const surface = createDefaultExperimentSurfaceV3(
      contract,
      undefined,
      { periodicPvaSupported: false },
    );

    expect(surface.graphPanes.map(({ graphId }) => graphId)).toEqual([
      "hemodynamics.pressure-volume",
      "hemodynamics.pressure.waveform.comprehensive-v1",
    ]);
    const pressureVolumePane = surface.graphPanes.find(
      ({ graphId }) => graphId === "hemodynamics.pressure-volume",
    )!;
    expect(pressureVolumePane.pressureVolumeAnalysisMode).toBe(
      "raw-exact-orbit",
    );
    expect("showPressureEnvelope" in pressureVolumePane).toBe(false);
    const pressurePane = surface.graphPanes.find(
      ({ graphId }) =>
        graphId === "hemodynamics.pressure.waveform.comprehensive-v1",
    );
    expect(pressurePane?.series.map(({ seriesId }) => seriesId)).toEqual([
      "AoP",
      "LVP",
      "LAP",
    ]);
    expect(
      surface.outputPanes[0]?.items
        .slice(1, 4)
        .map(({ outputId }) => outputId),
    ).toEqual(SYSTEMIC_ARTERIAL_PRESSURE_SUMMARY_IDS_V1);
    expect(
      surface.outputPanes[0]?.items.some(({ outputId }) =>
        HIDDEN_AMBIGUOUS_OUTPUT_ID_SET_V1.has(outputId),
      ),
    ).toBe(false);
    expect(
      surface.controlPanes[0]?.items.map(({ controlId }) => controlId),
    ).toEqual(["rhythm.heart-rate-bpm"]);
  });

  it("keeps clinical labels short and puts station limitations in localized second-layer copy", () => {
    const aopEn = resolveStudioItemPresentationV1({
      kind: "output",
      itemId: PROXIMAL_AORTIC_PRESSURE_OUTPUT_ID_V1,
      fallbackEnglishLabel: "AoP",
      locale: "en",
      catalogFacts: { outputKind: "signal" },
    });
    const aopJa = resolveStudioItemPresentationV1({
      kind: "output",
      itemId: PROXIMAL_AORTIC_PRESSURE_OUTPUT_ID_V1,
      fallbackEnglishLabel: "AoP",
      locale: "ja",
      catalogFacts: { outputKind: "signal" },
    });
    const abpEn = resolveStudioItemPresentationV1({
      kind: "output",
      itemId: SYSTEMIC_ARTERIAL_PRESSURE_OUTPUT_ID_V1,
      fallbackEnglishLabel: "ABP",
      locale: "en",
      catalogFacts: { outputKind: "signal" },
    });
    const localGradient = resolveStudioItemPresentationV1({
      kind: "output",
      itemId: "hemodynamics.pressure-gradient.valve.local-hydraulic.AoV",
      fallbackEnglishLabel: "AV local pressure gradient",
      locale: "en",
      catalogFacts: { outputKind: "signal" },
    });
    const venaContractaGradient = resolveStudioItemPresentationV1({
      kind: "output",
      itemId:
        "hemodynamics.pressure-gradient.valve.vena-contracta-bernoulli.AoV",
      fallbackEnglishLabel: "AV vena-contracta Bernoulli gradient",
      locale: "en",
      catalogFacts: { outputKind: "signal" },
    });

    expect(aopEn.label).toBe("Aortic pressure (AoP)");
    expect(aopEn.description).toContain("static pressure recovery");
    expect(aopEn.description).toContain("not a specific catheter-site pressure");
    expect(aopEn.description).toContain("wave travel or reflection is not modeled");
    expect(aopEn.description).not.toContain("Ao compliance node + Zc");
    expect(aopEn.inlineDisclosure).toBe(true);
    expect(aopJa.label).toBe("大動脈圧 (AoP)");
    expect(aopJa.description).toContain("圧波の伝播・反射はモデル化していない");
    expect(abpEn.label).toBe("Arterial blood pressure (ABP)");
    expect(abpEn.description).toContain("systemic-arterial (SA) compartment");
    expect(abpEn.description).toContain("cuff or arterial-line site");
    expect(abpEn.inlineDisclosure).toBe(true);
    expect(localGradient.description).toContain("LV − proximal AoP");
    expect(localGradient.description).not.toContain("pressure recovery before");
    expect(localGradient.inlineDisclosure).toBe(true);
    expect(venaContractaGradient.description).toContain(
      "pressure recovery acts downstream",
    );
    expect(venaContractaGradient.inlineDisclosure).toBe(true);

    expect(
      STUDIO_OUTPUT_PRESSURE_SUMMARIES_V1.find(
        ({ presentationId }) =>
          presentationId
          === "presentation.pressure-summary.SA",
      ),
    ).toMatchObject({
      memberOutputIds: SYSTEMIC_ARTERIAL_PRESSURE_SUMMARY_IDS_V1,
    });
    expect(STUDIO_OUTPUT_PRESSURE_SUMMARIES_V1.some(
      ({ presentationId }) =>
        presentationId
        === "presentation.pressure-summary.aortic-proximal-constitutive-port",
    )).toBe(false);

    for (const itemId of
      MAIN_WIRE_AORTIC_RECOVERED_ROOT_PORT_OUTPUT_IDS_V1) {
      for (const locale of ["en", "ja"] as const) {
        const presentation = resolveStudioItemPresentationV1({
          kind: "output",
          itemId,
          fallbackEnglishLabel: itemId,
          locale,
        });
        expect(presentation.label).not.toBe(itemId);
        expect(presentation.description.length).toBeGreaterThan(20);
        expect(presentation.description).not.toMatch(/[。.!]$/u);
      }
    }
  });
});
