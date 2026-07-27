import { describe, expect, it } from "vitest";

import {
  SCIENTIFIC_WORKBENCH_METRIC_PRESENTATION_CATALOG_V1,
  SCIENTIFIC_WORKBENCH_OVERVIEW_METRICS_V1,
  SCIENTIFIC_WORKBENCH_PUMP_METRICS_V1,
  SCIENTIFIC_WORKBENCH_VALVE_METRICS_V1,
  scientificWorkbenchMetricPresentationV1,
} from "@/components/scientificProduct/ScientificWorkbenchMetricPresentationV1";
import {
  metricEvaluationForPresentationV1,
} from "@/components/scientificProduct/ScientificWorkbenchRuntimeRendererV1";
import type {
  ScientificProductScenarioPresentationV1,
} from "@/components/scientificProduct/ScientificProductScenarioRegistryV1";
import {
  MAIN_WIRE_SCIENTIFIC_DERIVED_METRIC_CATALOG_V1,
} from "@/engine/scientific/metrics";

describe("scientific Workbench metric presentation V1", () => {
  it("covers every release-bound metric exactly once", () => {
    const scientificIds = MAIN_WIRE_SCIENTIFIC_DERIVED_METRIC_CATALOG_V1
      .map(({ metricId }) => metricId);
    const presentationIds = SCIENTIFIC_WORKBENCH_METRIC_PRESENTATION_CATALOG_V1
      .map(({ metricId }) => metricId);

    expect(presentationIds).toHaveLength(44);
    expect(new Set(presentationIds).size).toBe(44);
    expect(new Set(presentationIds)).toEqual(new Set(scientificIds));
    expect(SCIENTIFIC_WORKBENCH_METRIC_PRESENTATION_CATALOG_V1.every((entry) => (
      entry.label.trim().length > 0
      && entry.shortLabel.trim().length > 0
      && Number.isSafeInteger(entry.decimals)
      && entry.decimals >= 0
    ))).toBe(true);
  });

  it("provides clinically legible labels, units, and metric-specific precision", () => {
    expect(scientificWorkbenchMetricPresentationV1(
      "hemodynamics.pressure.systolic.Ao",
    )).toMatchObject({
      label: "Systolic aortic pressure",
      shortLabel: "SBP",
      category: "pressure",
      unit: "mmHg",
      decimals: 0,
    });
    expect(scientificWorkbenchMetricPresentationV1(
      "hemodynamics.pressure.mean.LA",
    )).toMatchObject({ shortLabel: "Mean LAP", decimals: 1 });
    expect(scientificWorkbenchMetricPresentationV1(
      "hemodynamics.volume.end_diastolic.LV",
    )).toMatchObject({
      label: "Left ventricular cycle maximum volume",
      shortLabel: "LV Vmax",
    });
    expect(scientificWorkbenchMetricPresentationV1(
      "hemodynamics.volume.end_systolic.RV",
    )).toMatchObject({
      label: "Right ventricular cycle minimum volume",
      shortLabel: "RV Vmin",
    });
    expect(scientificWorkbenchMetricPresentationV1(
      "valve.AoV.cardiac_output.net",
    )).toMatchObject({
      label: "Effective aortic cardiac output",
      shortLabel: "Cardiac output",
      unit: "L/min",
      decimals: 1,
    });
    expect(scientificWorkbenchMetricPresentationV1(
      "valve.MV.gradient.forward_mean",
    )).toMatchObject({
      label: "Mitral mean invasive forward gradient",
      shortLabel: "Mitral mean gradient",
      category: "valve",
      unit: "mmHg",
      decimals: 1,
    });
    expect(scientificWorkbenchMetricPresentationV1(
      "valve.AoV.gradient.forward_peak",
    )).toMatchObject({
      label: "Aortic maximum instantaneous invasive forward gradient",
      shortLabel: "AoV max instant ΔP",
    });
    expect(scientificWorkbenchMetricPresentationV1(
      "valve.MV.regurgitant_fraction",
    )).toMatchObject({
      label: "Mitral same-valve regurgitant fraction",
      shortLabel: "MV same-valve RF",
    });
  });

  it("keeps the default profiles compact and free of legacy surrogate IDs", () => {
    expect(SCIENTIFIC_WORKBENCH_OVERVIEW_METRICS_V1).toHaveLength(7);
    expect(SCIENTIFIC_WORKBENCH_PUMP_METRICS_V1).toHaveLength(8);
    expect(SCIENTIFIC_WORKBENCH_VALVE_METRICS_V1).toHaveLength(12);

    const allDefaults = [
      ...SCIENTIFIC_WORKBENCH_OVERVIEW_METRICS_V1,
      ...SCIENTIFIC_WORKBENCH_PUMP_METRICS_V1,
      ...SCIENTIFIC_WORKBENCH_VALVE_METRICS_V1,
    ];
    expect(allDefaults).not.toContain("ABP");
    expect(allDefaults).not.toContain("PCWP");
    expect(allDefaults.some((metricId) => metricId.startsWith("coronary.")))
      .toBe(false);
    expect(new Set(SCIENTIFIC_WORKBENCH_VALVE_METRICS_V1)).toEqual(new Set(
      (["MV", "AoV", "TV", "PV"] as const).flatMap((valveId) => [
        `valve.${valveId}.gradient.forward_peak`,
        `valve.${valveId}.gradient.forward_mean`,
        `valve.${valveId}.regurgitant_fraction`,
      ]),
    ));
  });

  it("presents branch-accumulated live values as estimates", () => {
    const presentation = {
      presentationBeatEstimate: {
        coverage: "decimated-presentation",
        startPresentationOrdinal: 0,
        endPresentationOrdinal: 500,
        startAcceptedRevision: 10,
        endAcceptedRevision: 510,
        startAcceptedTimeSec: 2,
        endAcceptedTimeSec: 3,
        durationSec: 1,
        retainedSampleCount: 501,
        values: {
          "hemodynamics.pressure.mean.Ao": {
            metricId: "hemodynamics.pressure.mean.Ao",
            value: 91.25,
            availability: "available",
            unavailableReason: null,
            unavailableDependency: null,
          },
        },
        evidence: {
          bothCanonicalBeatBoundariesRetained: true,
          transientBeatFullyMeasured: false,
          revisionsContiguous: false,
          cadenceUniform: false,
          exportEquivalent: false,
        },
      },
      metricCycle: null,
    } as unknown as ScientificProductScenarioPresentationV1;

    const evaluation = metricEvaluationForPresentationV1(presentation);

    expect(evaluation).toMatchObject({
      registryId: "main-wire-presentation-estimator-registry-v1",
      inputCycleContractId: "main-wire-presentation-beat-estimate-v1",
      cycleAvailability: "estimate",
      cycleInterpretation: "presentation-beat-estimate",
      releaseRef: null,
      firstRevision: 10,
      finalRevision: 510,
      values: {
        "hemodynamics.pressure.mean.Ao": {
          value: 91.25,
          availability: "available",
          periodicBoundaryCompletionApplied: false,
        },
      },
    });
  });
});
