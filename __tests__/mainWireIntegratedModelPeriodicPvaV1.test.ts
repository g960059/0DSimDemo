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
  MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PVA_MINIMUM_POINT_COUNT_V3,
  MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PVA_MINIMUM_TBV_SCALE_V3,
  mainWireIntegratedModelFormalPvaTargetGlobalTbvMlV3,
} from "@/engine/myocardium/MainWireIntegratedModelResponsiveStarlingProtocolV3";
import { MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3 } from "@/engine/myocardium/MainWireIntegratedModelHemodynamicResearchInputsV3";
import { PressureVolumeLoopCanvasV3 } from "@/components/workbench/v3/PressureVolumeLoopCanvasV3";
import { materializeWorkbenchOutputPresentationItemsV3 } from "@/components/WorkbenchV3Page";
import { createDefaultExperimentSurfaceV3 } from "@/components/workbench/WorkbenchSurfaceV3";
import { loadStudioDefaultClientCompositionV2 } from "@/studio/composition/StudioDefaultCompositionV2";
import { MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_PVA_OUTPUT_IDS_V1 } from "@/engine/myocardium/MainWireIntegratedModelOutputRegistryV3";

describe("settled hot-start PVA V1", () => {
  it("calculates accepted-step SW, an area-max common-isochrone ESPVR, exponential EDPVR, PE, PVA, and LV MVO2", () => {
    const result = buildMainWireIntegratedModelPeriodicPvaV1(
      formalLocusV1(settledPointsV1()),
      "LV",
    );

    expect(result.status).toBe("available");
    if (result.status !== "available") throw new Error(result.reason);
    expect(result.source).toMatchObject({
      primaryLineage: "persistent-worker-settled-hot-start-chain",
      pointCount: 9,
      slowControllerPolicy: "active-source-period1-then-coronary-tone-frozen",
      endDiastolicLandmark: "maximum-volume-proxy",
      endSystolicLandmark: "active-pressure-area-max-common-isochrone",
    });
    expect(result.espvr.primaryMethod).toBe(
      "active-pressure-area-max-common-isochrone",
    );
    expect(result.espvr.selectedTimeSinceAtrialCaptureSec).toBeCloseTo(0.2, 12);
    expect(result.espvr.selectedPhase01AtAnchor).toBeCloseTo(0.25, 12);
    expect(result.espvr.activePressureAreaMmHgMl).toBeGreaterThan(0);
    expect(result.espvr.activePressureAreaVolumeRangeMl).toEqual([40, 56]);
    expect(result.espvr.elastanceMmHgPerMl).toBeCloseTo(2, 10);
    expect(result.espvr.volumeAxisInterceptMl).toBeCloseTo(20, 10);
    expect(result.espvr.localElastanceAtAnchorMmHgPerMl).toBeCloseTo(2, 10);
    expect(result.espvr.rSquared).toBeCloseTo(1, 10);
    expect(result.espvr.nonlinearCurve).not.toBeNull();
    expect(result.espvr.nonlinearCurve?.quadraticMmHgPerMl2).toBeCloseTo(0, 10);
    expect(result.espvr.pressureEnvelopeDiagnostic).toMatchObject({
      method: "phase-wise-maximum-pressure-envelope",
      excessAreaMmHgMl: 0,
      excessAreaFraction: 0,
    });
    expect(result.edpvr.scaleMmHg).toBeGreaterThan(0);
    expect(result.edpvr.exponentPerMl).toBeCloseTo(0.02, 2);
    expect(Math.abs(result.edpvr.zeroPressureVolumeMl - 60)).toBeLessThan(1);
    expect(result.strokeWork).toMatchObject({
      method: "accepted-step-transmural-path-work",
      mmHgMl: 8_500,
    });
    expect(result.anchor.measuredHeartRateBpm).toBeCloseTo(75, 12);
    expect(result.potentialEnergy).toMatchObject({
      method:
        "area-between-espvr-and-nonnegative-edpvr-from-left-intersection-to-anchor-esv",
    });
    expect(result.potentialEnergy.leftIntersectionVolumeMl).toBeCloseTo(
      result.espvr.volumeAxisInterceptMl,
      10,
    );
    expect(result.potentialEnergy.leftIntersectionVolumeMl).toBeLessThan(
      result.anchor.endSystolicVolumeMl,
    );
    for (let intervalOrdinal = 1; intervalOrdinal <= 64; intervalOrdinal += 1) {
      const volumeMl =
        result.potentialEnergy.leftIntersectionVolumeMl +
        ((result.anchor.endSystolicVolumeMl -
          result.potentialEnergy.leftIntersectionVolumeMl) *
          intervalOrdinal) /
          64;
      const endSystolicPressureMmHg =
        result.espvr.elastanceMmHgPerMl *
        (volumeMl - result.espvr.volumeAxisInterceptMl);
      const endDiastolicPressureMmHg = Math.max(
        0,
        result.edpvr.scaleMmHg *
          Math.expm1(
            result.edpvr.exponentPerMl *
              (volumeMl - result.edpvr.zeroPressureVolumeMl),
          ),
      );
      expect(endSystolicPressureMmHg).toBeGreaterThan(endDiastolicPressureMmHg);
    }
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

  it("uses a monotone density-weighted nonlinear law for a curved common isochrone", () => {
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
      "active-pressure-area-max-common-isochrone",
    );
    expect(result.espvr.primaryCurveLaw).toBe(
      "density-weighted-monotone-quadratic",
    );
    expect(result.espvr.nonlinearCurve).toMatchObject({
      method: "density-weighted-quadratic-common-isochrone-fit",
      monotonicallyIncreasingAcrossMeasuredRange: true,
    });
    expect(result.espvr.nonlinearCurve!.rSquared).toBeGreaterThan(
      result.espvr.rSquared,
    );
  });

  it("keeps the common-phase ESPVR separate from a volume-dependent pressure envelope", () => {
    const points = settledPointsV1().map((point, index) => {
      const peakPhase01 = 0.15 + index * 0.025;
      const endSystolicVolumeMl =
        point.ventricularPressureVolumeLandmarks.endSystolic.volumeMl;
      return Object.freeze({
        ...point,
        ventricularPressureVolumeLoop: Object.freeze(
          point.ventricularPressureVolumeLoop.map((sample) => {
            const normalizedActivation = Math.max(
              0,
              1 - Math.abs(sample.phase01! - peakPhase01) / 0.25,
            );
            return Object.freeze({
              ...sample,
              volumeMl: endSystolicVolumeMl,
              pressureMmHg:
                (1 + normalizedActivation) * (endSystolicVolumeMl - 20),
            });
          }),
        ),
      });
    });

    const result = buildMainWireIntegratedModelPeriodicPvaV1(
      formalLocusV1(points),
      "LV",
    );

    expect(result.status).toBe("available");
    if (result.status !== "available") throw new Error(result.reason);
    const diagnostic = result.espvr.pressureEnvelopeDiagnostic;
    expect(diagnostic.timeSinceAtrialCaptureRangeSec[1]).toBeGreaterThan(
      diagnostic.timeSinceAtrialCaptureRangeSec[0],
    );
    expect(diagnostic.phase01AtAnchorRange[1]).toBeGreaterThan(
      diagnostic.phase01AtAnchorRange[0],
    );
    expect(diagnostic.excessAreaMmHgMl).toBeGreaterThan(0);
    expect(diagnostic.excessAreaFraction).toBeGreaterThan(0);
    expect(
      new Set(
        diagnostic.winningTimeByVolume.map(
          ({ timeSinceAtrialCaptureSec }) => timeSinceAtrialCaptureSec,
        ),
      ).size,
    ).toBeGreaterThan(1);
    expect(result.espvr.selectedPhase01AtAnchor).toBeGreaterThanOrEqual(
      diagnostic.phase01AtAnchorRange[0],
    );
    expect(result.espvr.selectedPhase01AtAnchor).toBeLessThanOrEqual(
      diagnostic.phase01AtAnchorRange[1],
    );
  });

  it("is insensitive to adaptive point density over the same volume domain", () => {
    const uniform = buildMainWireIntegratedModelPeriodicPvaV1(
      formalLocusV1(settledPointsV1()),
      "LV",
    );
    const adaptive = buildMainWireIntegratedModelPeriodicPvaV1(
      formalLocusV1(
        settledPointsV1([1, 0.99, 0.965, 0.925, 0.86, 0.78, 0.7, 0.64, 0.6]),
      ),
      "LV",
    );

    expect(uniform.status).toBe("available");
    expect(adaptive.status).toBe("available");
    if (uniform.status !== "available" || adaptive.status !== "available") {
      throw new Error("synthetic PVA family was unavailable");
    }
    expect(adaptive.espvr.selectedTimeSinceAtrialCaptureSec).toBeCloseTo(
      uniform.espvr.selectedTimeSinceAtrialCaptureSec,
      12,
    );
    expect(adaptive.espvr.elastanceMmHgPerMl).toBeCloseTo(
      uniform.espvr.elastanceMmHgPerMl,
      10,
    );
    expect(adaptive.espvr.volumeAxisInterceptMl).toBeCloseTo(
      uniform.espvr.volumeAxisInterceptMl,
      10,
    );
    expect(
      Math.abs(
        adaptive.potentialEnergy.mmHgMl - uniform.potentialEnergy.mmHgMl,
      ) / uniform.potentialEnergy.mmHgMl,
    ).toBeLessThan(1e-7);
    expect(
      Math.abs(adaptive.pva.mmHgMl - uniform.pva.mmHgMl) / uniform.pva.mmHgMl,
    ).toBeLessThan(1e-7);
  });

  it("reports point progress until the formal hot-start chain completes", () => {
    const points = settledPointsV1().slice(0, 4);
    const partial = formalLocusV1(points, 21);

    expect(
      buildMainWireIntegratedModelPeriodicPvaV1(partial, "LV"),
    ).toMatchObject({
      status: "collecting",
      progress: { completedPointCount: 4, totalPointCount: 9 },
      preview: {
        stage: "relations",
        pointCount: 4,
      },
    });
  });

  it("progresses from three-point relation preview to five-point PVA preview", () => {
    const relations = buildMainWireIntegratedModelPeriodicPvaV1(
      formalLocusV1(settledPointsV1().slice(0, 3), 21),
      "LV",
    );
    const provisionalPva = buildMainWireIntegratedModelPeriodicPvaV1(
      formalLocusV1(settledPointsV1().slice(0, 5), 21),
      "LV",
    );

    expect(relations).toMatchObject({
      status: "collecting",
      preview: {
        stage: "relations",
        pointCount: 3,
        pva: null,
      },
    });
    if (relations.status === "collecting") {
      expect(relations.preview?.espvr?.fitPoints).toHaveLength(3);
      expect(relations.preview?.edpvr?.fitPoints).toHaveLength(3);
    }
    expect(provisionalPva).toMatchObject({
      status: "collecting",
      preview: {
        stage: "pva",
        pointCount: 5,
      },
    });
    if (provisionalPva.status === "collecting") {
      expect(provisionalPva.preview?.pva?.joule).toBeGreaterThan(0);
      expect(provisionalPva.preview?.estimatedMvo2).toMatchObject({
        status: "available",
      });
    }
  });

  it("publishes PVA after its core while the wider Starling family continues", () => {
    const result = buildMainWireIntegratedModelPeriodicPvaV1(
      formalLocusV1(settledPointsV1(), 21),
      "LV",
    );

    expect(result.status).toBe("available");
    if (result.status !== "available") throw new Error(result.reason);
    expect(result.progress).toEqual({
      completedPointCount: 9,
      totalPointCount: 9,
    });
    expect(result.source.familyProgress).toEqual({
      completedPointCount: 9,
      totalPointCount: 21,
    });
  });

  it("keeps wider Starling points outside the PVA fit", () => {
    const core = settledPointsV1();
    const anchor = core[0]!;
    const extensions = [
      Object.freeze({
        ...anchor,
        totalBloodVolumeMl: anchor.totalBloodVolumeMl * 1.2,
        role: "continuation" as const,
        fillingPressureMmHg: 30,
      }),
      Object.freeze({
        ...anchor,
        totalBloodVolumeMl: anchor.totalBloodVolumeMl * 0.5,
        role: "continuation" as const,
        fillingPressureMmHg: -2,
      }),
    ];
    const coreResult = buildMainWireIntegratedModelPeriodicPvaV1(
      formalLocusV1(core),
      "LV",
    );
    const extendedResult = buildMainWireIntegratedModelPeriodicPvaV1(
      formalLocusV1([...core, ...extensions]),
      "LV",
    );

    expect(coreResult.status).toBe("available");
    expect(extendedResult.status).toBe("available");
    if (
      coreResult.status !== "available" ||
      extendedResult.status !== "available"
    ) {
      throw new Error("synthetic PVA core was unavailable");
    }
    expect(extendedResult.espvr).toEqual(coreResult.espvr);
    expect(extendedResult.edpvr).toEqual(coreResult.edpvr);
    expect(extendedResult.strokeWork).toEqual(coreResult.strokeWork);
    expect(extendedResult.potentialEnergy).toEqual(coreResult.potentialEnergy);
    expect(extendedResult.pva).toEqual(coreResult.pva);
  });

  it("admits an adaptive low-volume point family down to 60% of source TBV", () => {
    const sourceTbvMl =
      MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3.totalBloodVolumeMl;
    const adaptiveRatios = [1, 0.96, 0.91, 0.855, 0.8, 0.75, 0.7, 0.65, 0.6];
    const adaptive = buildMainWireIntegratedModelPeriodicPvaV1(
      formalLocusV1(settledPointsV1(adaptiveRatios)),
      "LV",
    );

    expect(MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PVA_MINIMUM_POINT_COUNT_V3).toBe(
      9,
    );
    expect(
      mainWireIntegratedModelFormalPvaTargetGlobalTbvMlV3(
        sourceTbvMl,
        MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PVA_MINIMUM_TBV_SCALE_V3,
      ),
    ).toBe(sourceTbvMl * 0.6);
    expect(adaptive.status).toBe("available");
    if (adaptive.status === "available") {
      expect(adaptive.source.pointCount).toBe(adaptiveRatios.length);
      expect(adaptive.espvr.fitPoints).toHaveLength(adaptiveRatios.length);
      expect(adaptive.edpvr.fitPoints).toHaveLength(adaptiveRatios.length);
    }
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

  it("fails closed when phased loops cannot define a common isochrone", () => {
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

  it("rejects PE geometry when EDPVR reaches or crosses the selected ESPVR", () => {
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

  it("keeps the PV pane focused on curves instead of a numerical result card", () => {
    const periodicPva = buildMainWireIntegratedModelPeriodicPvaV1(
      formalLocusV1(settledPointsV1()),
      "LV",
    );
    const html = renderToStaticMarkup(
      React.createElement(PressureVolumeLoopCanvasV3, {
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
            periodicPvaAnalysisPending: false,
          },
        ],
      }),
    );

    expect(html).toContain('data-pva-result-count="1"');
    expect(html).not.toContain('data-testid="workbench-pva-results"');
  });

  it("renders settled-point progress in the PV pane", () => {
    const periodicPva = buildMainWireIntegratedModelPeriodicPvaV1(
      formalLocusV1(settledPointsV1().slice(0, 5), 21),
      "LV",
    );
    const html = renderToStaticMarkup(
      React.createElement(PressureVolumeLoopCanvasV3, {
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
            periodicPvaAnalysisPending: true,
          },
        ],
      }),
    );

    expect(html).toContain("PVA preview · 5 settled points · refining to ≥9");
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
      formalLocusV1(settledPointsV1().slice(0, 5), 21),
      "LV",
    );
    expect(collecting.status).toBe("collecting");
    if (
      collecting.status !== "collecting" ||
      collecting.preview?.pva === null
    ) {
      throw new Error("five-point provisional PVA was unavailable");
    }
    const provisionalPvaMilliJoule = collecting.preview.pva.joule * 1e3;
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
      availability: "available",
      value: provisionalPvaMilliJoule,
      qualityNotice:
        "Provisional PVA from 5 settled points; refining to at least 9",
    });
  });

  it("renders a formal analysis failure instead of leaving an empty pane", () => {
    const html = renderToStaticMarkup(
      React.createElement(PressureVolumeLoopCanvasV3, {
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
            periodicPvaAnalysisPending: false,
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
      "persistent-fixed-tone-preload-reduction-chain-with-complete-beat-period1-settlement" as const,
    minimumBeatCount: 3,
    maximumBeatCount: 20,
    completedPointCount: points.length,
    totalPointCount,
    slowControllerPolicy:
      "active-source-period1-then-coronary-tone-frozen" as const,
    convergencePolicy: "complete-beat-output-period1-closure" as const,
    points: Object.freeze(
      points.map((point) =>
        Object.freeze({
          ...point,
          quality: "locally-converged" as const,
          curveEligible: true as const,
          settled: true as const,
          evidence: "fixed-tone-periodic" as const,
          measurementWindowStatus: "fixed-tone-period1-settled" as const,
        }),
      ),
    ),
  });
}

function settledPointsV1(
  ratios: readonly number[] = [1, 0.95, 0.9, 0.85, 0.8, 0.75, 0.7, 0.65, 0.6],
): readonly MainWireIntegratedModelStarlingPointV3[] {
  return Object.freeze(
    ratios.map((ratio) => {
      const reductionOrdinal = (1 - ratio) / 0.05;
      const endSystolicVolumeMl = 56 - reductionOrdinal * 2;
      const endDiastolicVolumeMl = 121 - reductionOrdinal * 4;
      const endSystolicPressureMmHg = 2 * (endSystolicVolumeMl - 20);
      const endDiastolicPressureMmHg =
        2 * Math.expm1(0.02 * (endDiastolicVolumeMl - 60));
      return Object.freeze({
        totalBloodVolumeMl: 5_600 * ratio,
        fillingPressureMmHg: 11.5 - reductionOrdinal * 0.9,
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
        acceptedTransmuralPathWorkMmHgMl: 8_500 - reductionOrdinal * 75,
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
