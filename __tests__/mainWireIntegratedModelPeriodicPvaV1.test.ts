import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import type {
  MainWireIntegratedModelPressureVolumeLoopPointV3,
  MainWireIntegratedModelStarlingLocusV3,
  MainWireIntegratedModelStarlingPointV3,
} from "@/engine/myocardium/MainWireIntegratedModelGuytonStarlingOrientationV3";
import { buildMainWireIntegratedModelPeriodicPvaV1 } from "@/engine/myocardium/analysis/MainWireIntegratedModelPeriodicPvaV1";
import { evaluateMainWireIntegratedModelLvMvo2EstimateV1 } from "@/engine/myocardium/analysis/MainWireIntegratedModelMvo2ReferenceV1";
import {
  MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PV_HYPOVOLEMIC_TBV_SCALES_V3,
  mainWireIntegratedModelFormalPvaTargetGlobalTbvMlV3,
} from "@/engine/myocardium/MainWireIntegratedModelResponsiveStarlingProtocolV3";
import {
  MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3,
  MAIN_WIRE_INTEGRATED_MODEL_HEMODYNAMIC_RESEARCH_RANGES_V3,
} from "@/engine/myocardium/MainWireIntegratedModelHemodynamicResearchInputsV3";
import { PressureVolumeLoopCanvasV3 } from "@/components/workbench/v3/PressureVolumeLoopCanvasV3";
import { materializeWorkbenchOutputPresentationItemsV3 } from "@/components/WorkbenchV3Page";
import { createDefaultExperimentSurfaceV3 } from "@/components/workbench/WorkbenchSurfaceV3";
import { loadStudioDefaultClientCompositionV2 } from "@/studio/composition/StudioDefaultCompositionV2";
import { MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_PVA_OUTPUT_IDS_V1 } from "@/engine/myocardium/MainWireIntegratedModelOutputRegistryV3";

describe("settled hot-start PVA V1", () => {
  it("calculates accepted-step SW, isochronal Emax ESPVR, exponential EDPVR, PE, PVA, and LV MVO2", () => {
    const result = buildMainWireIntegratedModelPeriodicPvaV1(
      formalLocusV1(settledPointsV1()),
      "LV",
    );

    expect(result.status).toBe("available");
    if (result.status !== "available") throw new Error(result.reason);
    expect(result.source).toMatchObject({
      primaryLineage: "persistent-worker-settled-hot-start-chain",
      pointCount: 6,
      endDiastolicLandmark: "maximum-volume-proxy",
      endSystolicLandmark: "common-isochronal-maximum-elastance",
    });
    expect(result.espvr.primaryMethod).toBe(
      "linear-isochronal-maximum-elastance-fit",
    );
    expect(result.espvr.elastanceMmHgPerMl).toBeCloseTo(2, 10);
    expect(result.espvr.volumeAxisInterceptMl).toBeCloseTo(20, 10);
    expect(result.espvr.rSquared).toBeCloseTo(1, 10);
    expect(result.espvr.nonlinearComparator).not.toBeNull();
    expect(result.espvr.nonlinearComparator?.quadraticMmHgPerMl2).toBeCloseTo(
      0,
      10,
    );
    expect(result.edpvr.scaleMmHg).toBeGreaterThan(0);
    expect(result.edpvr.exponentPerMl).toBeCloseTo(0.02, 2);
    expect(result.edpvr.zeroPressureVolumeMl).toBeCloseTo(60, 0);
    expect(result.strokeWork).toMatchObject({
      method: "accepted-step-transmural-path-work",
      mmHgMl: 8_500,
    });
    expect(result.anchor.measuredHeartRateBpm).toBeCloseTo(75, 12);
    expect(result.potentialEnergy.joule).toBeGreaterThanOrEqual(0);
    expect(result.pva.joule).toBeCloseTo(
      result.strokeWork.joule + result.potentialEnergy.joule,
      12,
    );
    expect(result.estimatedMvo2).toMatchObject({
      status: "available",
      ventricleId: "LV",
      heartRateBpm: 75,
      massReference: {
        allocation: "LVFW-plus-SEP",
      },
      interpretation: {
        modelSpecificCalibrationEstablished: false,
        measuredOxygenConsumption: false,
      },
    });
  });

  it("retains a quadratic Emax comparator without silently replacing the primary fit", () => {
    const curved = settledPointsV1().map((point) => {
      return Object.freeze({
        ...point,
        ventricularPressureVolumeLoop: Object.freeze(
          point.ventricularPressureVolumeLoop.map((sample) =>
            sample.phase01 === 0.25
              ? Object.freeze({
                  ...sample,
                  pressureMmHg:
                    2.6 * (sample.volumeMl - 18) +
                    0.012 * (sample.volumeMl - 50) ** 2,
                })
              : sample,
          ),
        ),
      });
    });
    const result = buildMainWireIntegratedModelPeriodicPvaV1(
      formalLocusV1(curved),
      "LV",
    );

    expect(result.status).toBe("available");
    if (result.status !== "available") throw new Error(result.reason);
    expect(result.espvr.primaryMethod).toBe(
      "linear-isochronal-maximum-elastance-fit",
    );
    expect(result.espvr.nonlinearComparator).toMatchObject({
      method: "quadratic-isochronal-maximum-elastance-fit",
      monotonicallyIncreasingAcrossMeasuredRange: true,
    });
    expect(result.espvr.nonlinearComparator!.rSquared).toBeGreaterThan(
      result.espvr.rSquared,
    );
  });

  it("reports point progress until the formal hot-start chain completes", () => {
    const points = settledPointsV1().slice(0, 4);
    const partial = formalLocusV1(points, 6);

    expect(
      buildMainWireIntegratedModelPeriodicPvaV1(partial, "LV"),
    ).toMatchObject({
      status: "collecting",
      progress: { completedPointCount: 4, totalPointCount: 6 },
    });
  });

  it("runs only the low-volume chain down to the existing Starling TBV bound", () => {
    const sourceTbvMl =
      MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3.totalBloodVolumeMl;
    const range =
      MAIN_WIRE_INTEGRATED_MODEL_HEMODYNAMIC_RESEARCH_RANGES_V3.totalBloodVolumeMl;
    const targets = [
      1,
      ...MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PV_HYPOVOLEMIC_TBV_SCALES_V3,
    ].map((scale) =>
      mainWireIntegratedModelFormalPvaTargetGlobalTbvMlV3(sourceTbvMl, scale),
    );

    expect(targets).toHaveLength(6);
    expect(
      targets.slice(1).every((target, index) => target < targets[index]!),
    ).toBe(true);
    expect(Math.min(...targets)).toBeGreaterThanOrEqual(range.minimum);
    expect(Math.max(...targets)).toBeLessThanOrEqual(range.maximum);
    expect(Math.min(...targets)).toBe(range.minimum);
  });

  it("keeps semilunar closure as a diagnostic rather than the Emax owner", () => {
    const points = settledPointsV1().map((point) =>
      Object.freeze({
        ...point,
        ventricularPressureVolumeLandmarks: Object.freeze({
          ...point.ventricularPressureVolumeLandmarks,
          endSystolic: Object.freeze({
            ...point.ventricularPressureVolumeLandmarks.endSystolic,
            event: "minimum-volume-fallback" as const,
          }),
        }),
      }),
    );

    const result = buildMainWireIntegratedModelPeriodicPvaV1(
      formalLocusV1(points),
      "LV",
    );
    expect(result.status).toBe("available");
    if (result.status === "available") {
      expect(result.espvr.semilunarClosureComparator).toBeNull();
    }
  });

  it("fails closed when phased loops cannot define a common isochronal Emax", () => {
    const points = settledPointsV1().map((point) =>
      Object.freeze({
        ...point,
        ventricularPressureVolumeLoop: Object.freeze(
          point.ventricularPressureVolumeLoop.map(
            ({ phase01: _phase01, ...sample }) => Object.freeze(sample),
          ),
        ),
      }),
    );

    expect(
      buildMainWireIntegratedModelPeriodicPvaV1(formalLocusV1(points), "LV"),
    ).toMatchObject({ status: "unavailable" });
  });

  it("rejects PE geometry when EDPVR reaches or crosses Emax ESPVR", () => {
    const points = settledPointsV1().map((point, index) =>
      Object.freeze({
        ...point,
        ventricularPressureVolumeLandmarks: Object.freeze({
          ...point.ventricularPressureVolumeLandmarks,
          endDiastolic: Object.freeze({
            ...point.ventricularPressureVolumeLandmarks.endDiastolic,
            pressureMmHg: 180 + index * 20,
          }),
        }),
      }),
    );

    expect(
      buildMainWireIntegratedModelPeriodicPvaV1(formalLocusV1(points), "LV"),
    ).toMatchObject({
      status: "unavailable",
      reason: expect.stringContaining("ESPVR"),
    });
  });

  it("does not expose an RV oxygen estimate", () => {
    const result = buildMainWireIntegratedModelPeriodicPvaV1(
      formalLocusV1(settledPointsV1()),
      "RV",
    );
    expect(result.status).toBe("available");
    if (result.status === "available") expect(result.estimatedMvo2).toBeNull();
  });

  it("renders the scenario result inside the Workbench PV pane", () => {
    const periodicPva = buildMainWireIntegratedModelPeriodicPvaV1(
      formalLocusV1(settledPointsV1()),
      "LV",
    );
    const html = renderToStaticMarkup(
      React.createElement(PressureVolumeLoopCanvasV3, {
        analysisMode: "formal-periodic",
        traces: [
          {
            scenarioId: "scenario/current",
            scenarioLabel: "Current",
            samples: Object.freeze([]),
            volumeOutputId: "LV.volume",
            pressureOutputId: "LV.pressure",
            pressureBasis: "transmural" as const,
            cyclePhaseOutputId: "clock.phase",
            chamberId: "LV",
            chamberLabel: "LV",
            chamberColor: "#d9822b",
            periodicPva,
            rapidPressureVolumeRelationPending: false,
          },
        ],
      }),
    );

    expect(html).toContain('data-testid="workbench-pva-results"');
    expect(html).toContain("PVA ");
    expect(html).toContain("estimated MVO₂");
    expect(html).toContain("exponential EDPVR");
    expect(html).toContain("Emax 2.000 mmHg/mL");
    expect(html).toContain("quadratic comparator R²");
  });

  it("renders settled-point progress in the PV pane", () => {
    const periodicPva = buildMainWireIntegratedModelPeriodicPvaV1(
      formalLocusV1(settledPointsV1().slice(0, 5), 6),
      "LV",
    );
    const html = renderToStaticMarkup(
      React.createElement(PressureVolumeLoopCanvasV3, {
        analysisMode: "formal-periodic",
        traces: [
          {
            scenarioId: "scenario/current",
            scenarioLabel: "Current",
            samples: Object.freeze([]),
            volumeOutputId: "LV.volume",
            pressureOutputId: "LV.pressure",
            pressureBasis: "transmural" as const,
            cyclePhaseOutputId: "clock.phase",
            chamberId: "LV",
            chamberLabel: "LV",
            chamberColor: "#d9822b",
            periodicPva,
            rapidPressureVolumeRelationPending: true,
          },
        ],
      }),
    );

    expect(html).toContain("PVA analysis 5/6 points");
  });

  it("materializes SW, PE, PVA, and estimated MVO2 in Workbench Outputs", async () => {
    const { contract } = await loadStudioDefaultClientCompositionV2();
    const periodicPva = buildMainWireIntegratedModelPeriodicPvaV1(
      formalLocusV1(settledPointsV1()),
      "LV",
    );
    expect(periodicPva.status).toBe("available");
    if (periodicPva.status !== "available") throw new Error(periodicPva.reason);
    const defaultPane = createDefaultExperimentSurfaceV3(
      contract,
      "scenario/current",
    ).outputPanes[0]!;
    const outputIds = Object.values(
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_PVA_OUTPUT_IDS_V1,
    );
    const outputLabels = [
      "LV stroke work (SW)",
      "LV potential energy (PE)",
      "LV pressure–volume area (PVA)",
      "Estimated LV MVO₂ per beat",
      "Estimated LV MVO₂ per minute",
    ] as const;
    const pane = {
      ...defaultPane,
      items: outputIds.map((outputId, order) => ({
        outputId,
        label: outputLabels[order]!,
        order,
      })),
    };

    const items = materializeWorkbenchOutputPresentationItemsV3({
      contract,
      frame: null,
      locale: "en",
      notAssessedNotice: "Not assessed",
      pane,
      periodicPva,
    });

    expect(items).toEqual([
      expect.objectContaining({
        itemId: "myocardium.work.stroke.LV",
        label: "LV stroke work (SW)",
        value: periodicPva.strokeWork.joule * 1e3,
        unit: "mJ",
        availability: "available",
      }),
      expect.objectContaining({
        itemId: "myocardium.energy.potential.LV-pressure-volume-area",
        label: "LV potential energy (PE)",
        value: periodicPva.potentialEnergy.joule * 1e3,
        unit: "mJ",
        availability: "available",
      }),
      expect.objectContaining({
        itemId: "myocardium.energy.pressure-volume-area.LV",
        label: "LV pressure–volume area (PVA)",
        value: periodicPva.pva.joule * 1e3,
        unit: "mJ",
        availability: "available",
      }),
      expect.objectContaining({
        itemId: "oxygen.consumption.estimated-myocardial.LV-per-beat-per-100g",
        value:
          periodicPva.estimatedMvo2?.status === "available"
            ? periodicPva.estimatedMvo2.oxygenDemand.totalMlO2PerBeatPer100G
            : null,
        unit: "mL O2/beat/100g",
        availability: "available",
      }),
      expect.objectContaining({
        itemId: "oxygen.consumption.estimated-myocardial.LV-per-min-per-100g",
        value:
          periodicPva.estimatedMvo2?.status === "available"
            ? periodicPva.estimatedMvo2.oxygenDemand.totalMlO2PerMinPer100G
            : null,
        unit: "mL O2/min/100g",
        availability: "available",
      }),
    ]);

    const collecting = buildMainWireIntegratedModelPeriodicPvaV1(
      formalLocusV1(settledPointsV1().slice(0, 5), 6),
      "LV",
    );
    const progressItems = materializeWorkbenchOutputPresentationItemsV3({
      contract,
      frame: null,
      locale: "en",
      notAssessedNotice: "Not assessed",
      pane: {
        ...defaultPane,
        items: [
          {
            outputId:
              MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_PVA_OUTPUT_IDS_V1.pressureVolumeAreaMilliJoule,
            label: "PVA",
            order: 0,
          },
        ],
      },
      periodicPva: collecting,
    });
    expect(progressItems[0]).toMatchObject({
      availability: "unavailable",
      qualityNotice: "PVA analysis 5/6 points",
    });
  });

  it("renders a formal analysis failure instead of leaving an empty pane", () => {
    const html = renderToStaticMarkup(
      React.createElement(PressureVolumeLoopCanvasV3, {
        analysisMode: "formal-periodic",
        traces: [
          {
            scenarioId: "scenario/current",
            scenarioLabel: "Current",
            samples: Object.freeze([]),
            volumeOutputId: "LV.volume",
            pressureOutputId: "LV.pressure",
            pressureBasis: "transmural" as const,
            cyclePhaseOutputId: "clock.phase",
            chamberId: "LV",
            chamberLabel: "LV",
            chamberColor: "#d9822b",
            periodicPvaAnalysisError:
              "formal pressure-volume load 0.95 rejected: qualification failed",
            rapidPressureVolumeRelationPending: false,
          },
        ],
      }),
    );

    expect(html).toContain('data-testid="workbench-pva-analysis-error"');
    expect(html).toContain("PVA analysis unavailable");
    expect(html).toContain("formal pressure-volume load 0.95 rejected");
  });

  it("rejects non-finite and overflowing literature projections", () => {
    expect(
      evaluateMainWireIntegratedModelLvMvo2EstimateV1({
        pvaOutputId: "pva/test",
        pvaMethodId: "method/test",
        pvaEstimateJ: Number.MAX_VALUE,
        heartRateBpm: 60,
      }),
    ).toMatchObject({ status: "unavailable" });
    expect(
      evaluateMainWireIntegratedModelLvMvo2EstimateV1({
        pvaOutputId: "pva/test",
        pvaMethodId: "method/test",
        pvaEstimateJ: Number.NaN,
        heartRateBpm: 60,
      }),
    ).toMatchObject({ status: "unavailable" });
  });
});

function formalLocusV1(
  points: readonly MainWireIntegratedModelStarlingPointV3[],
  totalPointCount = points.length,
): MainWireIntegratedModelStarlingLocusV3 {
  return Object.freeze({
    status: "measured-fixed-tbv-protocol" as const,
    protocolId: "formal-pv/test",
    requirement:
      "independent-fixed-tbv-fixture-forks-with-per-point-settlement-and-numerical-qualification" as const,
    minimumBeatCount: 3,
    maximumBeatCount: 250,
    completedPointCount: points.length,
    totalPointCount,
    slowControllerPolicy: "fully-active" as const,
    convergencePolicy: "canonical-full-accepted-state-period1-closure" as const,
    points: Object.freeze(
      points.map((point) =>
        Object.freeze({
          ...point,
          quality: "locally-converged" as const,
          curveEligible: true as const,
          settled: true as const,
          evidence: "qualified-periodic" as const,
          measurementWindowStatus: "canonical-period1-qualified" as const,
        }),
      ),
    ),
  });
}

function settledPointsV1(): readonly MainWireIntegratedModelStarlingPointV3[] {
  return Object.freeze(
    [0.75, 0.8, 0.85, 0.9, 0.95, 1].map((ratio, index) => {
      const endSystolicVolumeMl = 41 + index * 3;
      const endDiastolicVolumeMl = 96 + index * 5;
      const endSystolicPressureMmHg = 2 * (endSystolicVolumeMl - 20);
      const endDiastolicPressureMmHg =
        2 * Math.expm1(0.02 * (endDiastolicVolumeMl - 60));
      return Object.freeze({
        totalBloodVolumeMl: 5_600 * ratio,
        fillingPressureMmHg: 4 + index * 1.5,
        cardiacOutputLPerMin: 5.5,
        role:
          ratio === 1
            ? ("operating-anchor" as const)
            : ("continuation" as const),
        quality: "locally-converged" as const,
        curveEligible: true,
        completedBeatCount: 8,
        maximumNormalizedBeatDelta: 1e-8,
        settled: true,
        finiteAndFixedTbvPassed: true as const,
        evidence: "qualified-periodic" as const,
        measurementWindowStatus: "canonical-period1-qualified" as const,
        acceptedMeasurementDurationSec: 8,
        acceptedTransmuralPathWorkMmHgMl: 8_000 + index * 100,
        acceptedBeatDurationSec: 0.8,
        ventricularPressureVolumeLoop: syntheticLoopV1({
          endSystolicVolumeMl,
          endSystolicPressureMmHg,
          endDiastolicVolumeMl,
          endDiastolicPressureMmHg,
        }),
        ventricularPressureVolumeLandmarks: Object.freeze({
          pressureBasis: "transmural" as const,
          endSystolic: Object.freeze({
            volumeMl: endSystolicVolumeMl,
            pressureMmHg: endSystolicPressureMmHg,
            event: "semilunar-valve-closure" as const,
          }),
          endDiastolic: Object.freeze({
            volumeMl: endDiastolicVolumeMl,
            pressureMmHg: endDiastolicPressureMmHg,
            event: "maximum-volume" as const,
          }),
        }),
      });
    }),
  );
}

function syntheticLoopV1(
  input: Readonly<{
    endSystolicVolumeMl: number;
    endSystolicPressureMmHg: number;
    endDiastolicVolumeMl: number;
    endDiastolicPressureMmHg: number;
  }>,
): readonly MainWireIntegratedModelPressureVolumeLoopPointV3[] {
  return Object.freeze(
    Array.from({ length: 64 }, (_, index) => {
      const phase01 = index / 64;
      const ejectionFraction =
        phase01 <= 0.1 ? 0 : phase01 <= 0.55 ? (phase01 - 0.1) / 0.45 : 1;
      const fillingFraction = phase01 <= 0.65 ? 0 : (phase01 - 0.65) / 0.35;
      const volumeMl =
        phase01 <= 0.55
          ? input.endDiastolicVolumeMl -
            ejectionFraction *
              (input.endDiastolicVolumeMl - input.endSystolicVolumeMl)
          : input.endSystolicVolumeMl +
            fillingFraction *
              (input.endDiastolicVolumeMl - input.endSystolicVolumeMl);
      const normalizedActivation = Math.max(
        0,
        1 - Math.abs(phase01 - 0.25) / 0.25,
      );
      const elastanceMmHgPerMl = 0.05 + 1.95 * normalizedActivation;
      const passivePressureMmHg =
        input.endDiastolicPressureMmHg * fillingFraction ** 2;
      return Object.freeze({
        phase01,
        volumeMl,
        pressureMmHg: Math.max(
          passivePressureMmHg,
          elastanceMmHgPerMl * (volumeMl - 20),
        ),
      });
    }),
  );
}
