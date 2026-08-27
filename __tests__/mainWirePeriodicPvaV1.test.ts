import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import type {
  MainWireIntegratedModelPressureVolumeLoopPointV3,
  MainWireIntegratedModelStarlingLocusV3,
  MainWireIntegratedModelStarlingPointV3,
} from "@/analysis/methods/mainWire/MainWireGuytonStarlingOrientationV3";
import {
  buildMainWirePeriodicPvaMethodV8,
  MAIN_WIRE_PERIODIC_PVA_METHOD_V8_ID,
} from "@/analysis/methods/mainWire/MainWirePeriodicPvaV1";
import { evaluateMainWireIntegratedModelLvMvo2EstimateV1 } from "@/analysis/methods/mainWire/MainWireMvo2ReferenceV1";
import {
  MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PVA_MINIMUM_ABSOLUTE_TBV_ML_V3,
  MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PVA_MINIMUM_POINT_COUNT_V3,
  MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PVA_MINIMUM_TBV_SCALE_V3,
  mainWireIntegratedModelFormalPvaMinimumGlobalTbvMlV3,
  mainWireIntegratedModelFormalPvaTargetGlobalTbvMlV3,
} from "@/analysis/methods/mainWire/MainWirePressureVolumeProtocolsV3";
import { MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3 } from "@/engine/myocardium/MainWireIntegratedModelHemodynamicResearchInputsV3";
import {
  PressureVolumeLoopCanvasV3,
  retainWorkbenchPvRelationDrawingV3,
} from "@/components/workbench/presentation/PressureVolumeLoopCanvasV3";
import {
  materializeWorkbenchOutputPresentationItemsV3,
  workbenchPeriodicPvaOutputValueV3,
} from "@/components/workbench/WorkbenchItemPresentation";
import { createDefaultExperimentSurfaceV3 } from "@/components/workbench/WorkbenchSurfaceV3";
import { loadStudioDefaultClientCompositionV2 } from "@/studio/composition/StudioDefaultCompositionV2";
import { MAIN_WIRE_PERIODIC_PVA_OUTPUT_IDS_V1 } from
  "@/analysis/methods/mainWire/MainWireAnalysisMethodRegistryV1";

describe("settled hot-start PVA V1", () => {
  it("calculates accepted-step SW, an area-max common-isochrone ESPVR, exponential EDPVR, PE, PVA, and LV MVO2", () => {
    const result = buildMainWirePeriodicPvaMethodV8(
      formalLocusV1(settledPointsV1()),
      "LV",
    );

    expect(result.status).toBe("available");
    if (result.status !== "available") throw new Error(result.reason);
    expect(result.methodId).toBe(MAIN_WIRE_PERIODIC_PVA_METHOD_V8_ID);
    expect(result.completionStatus).toBe("complete");
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
    expect(result.espvr.selectedTimeSinceAtrialCaptureSec).toBeCloseTo(
      0.4375,
      12,
    );
    expect(result.espvr.selectedPhase01AtAnchor).toBeCloseTo(0.546875, 12);
    expect(result.espvr.phaseSelectionScoreMmHgMl).toBeGreaterThan(0);
    expect(
      result.espvr.phaseSelectionIntegrationVolumeRangeMl[1],
    ).toBeGreaterThan(result.espvr.phaseSelectionIntegrationVolumeRangeMl[0]);
    expect(result.espvr.phaseSelectionIntegrationVolumeRangeMl[0]).toBeCloseTo(
      50.4,
      12,
    );
    expect(result.espvr.phaseSelectionIntegrationVolumeRangeMl[1]).toBeCloseTo(
      61.6,
      12,
    );
    expect(result.espvr.phaseSelectionCandidatePhaseRange01[0]).toBeCloseTo(
      0.521875,
      12,
    );
    expect(result.espvr.phaseSelectionCandidatePhaseRange01[1]).toBeCloseTo(
      0.571875,
      12,
    );
    expect(result.espvr.phaseSelectionCandidateTimeRangeSec[0]).toBeCloseTo(
      0.4175,
      12,
    );
    expect(result.espvr.phaseSelectionCandidateTimeRangeSec[1]).toBeCloseTo(
      0.4575,
      12,
    );
    expect(result.espvr.phaseSelectionAnchorLandmarks).toEqual({
      maximumPressurePhase01: 0.546875,
      endSystolicPhase01: 0.546875,
    });
    expect(result.espvr.phaseSelectionPolicy).toBe(
      "all-settled-loads-over-fixed-anchor-esv-neighborhood-within-anchor-late-systolic-window",
    );
    expect(result.espvr.phaseSelectionStatus).toBe("complete");
    expect(result.espvr.phaseSelectionPointCount).toBe(9);
    expect(result.espvr).toMatchObject({
      phaseSelectionObjective:
        "positive-active-pressure-area-over-fixed-anchor-esv-neighborhood",
      phaseSelectionCoarseTimeSampleCount: 32,
      phaseSelectionLocalRefinementIntervalCount: 32,
    });
    expect(result.espvr.primaryCurveLaw).toBe(
      "measured-domain-shape-preserving-locus",
    );
    expect(result.espvr.fitPoints).toHaveLength(9);
    expect(result.espvr).toMatchObject({
      interpolation: "shape-preserving-cubic-hermite",
      continuity: "C1",
      displayExtrapolation: "none",
    });
    expect(result.espvr.curve).toHaveLength(65);
    expect(result.espvr.pressureEnvelopeDiagnostic).toMatchObject({
      method: "phase-wise-maximum-pressure-envelope",
      use: "optional-display-and-single-phase-adequacy-diagnostic-not-pva-owner",
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
        "area-between-nonlinear-espvr-and-nonnegative-edpvr-from-left-intersection-to-anchor-esv",
      measuredEspvrStartVolumeMl: result.espvr.measuredVolumeRangeMl[0],
      lowVolumeTangentExtensionUsed: true,
    });
    expect(result.potentialEnergy.leftIntersectionVolumeMl).toBeGreaterThan(0);
    expect(result.potentialEnergy.leftIntersectionVolumeMl).toBeLessThan(
      result.anchor.endSystolicVolumeMl,
    );
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
        pvaDefinitionReproducesCoefficientSourceProtocol: false,
        modelSpecificCalibrationEstablished: false,
        measuredOxygenConsumption: false,
      },
    });
  });

  it("uses a curved measured common isochrone as the non-extrapolated C1 PVA boundary", () => {
    const curved = settledPointsV1().map((point) => {
      return Object.freeze({
        ...point,
        ventricularPressureVolumeLoop: Object.freeze(
          point.ventricularPressureVolumeLoop.map((sample) =>
            sample.phase01! >= 0.4 && sample.phase01! <= 0.6
              ? Object.freeze({
                  ...sample,
                  pressureMmHg:
                    sample.pressureMmHg + 0.012 * (sample.volumeMl - 50) ** 2,
                })
              : sample,
          ),
        ),
      });
    });
    const result = buildMainWirePeriodicPvaMethodV8(
      formalLocusV1(curved),
      "LV",
    );

    expect(result.status).toBe("available");
    if (result.status !== "available") throw new Error(result.reason);
    expect(result.espvr.primaryMethod).toBe(
      "active-pressure-area-max-common-isochrone",
    );
    expect(result.espvr.primaryCurveLaw).toBe(
      "measured-domain-shape-preserving-locus",
    );
    expect(result.espvr).toMatchObject({
      interpolation: "shape-preserving-cubic-hermite",
      continuity: "C1",
      displayExtrapolation: "none",
    });
    expect(result.espvr.fitPoints).toHaveLength(curved.length);
    expect(result.espvr.curve[0]!.volumeMl).toBe(
      result.espvr.measuredVolumeRangeMl[0],
    );
    expect(result.espvr.curve.at(-1)!.volumeMl).toBe(
      result.espvr.measuredVolumeRangeMl[1],
    );
    expect(result.potentialEnergy.method).toContain("nonlinear-espvr");
    expect(result.potentialEnergy.lowVolumeTangentExtensionUsed).toBe(true);
    const endpointSecantPeMmHgMl = endpointSecantPotentialEnergyV1(result);
    expect(
      Math.abs(result.potentialEnergy.mmHgMl - endpointSecantPeMmHgMl) /
        result.potentialEnergy.mmHgMl,
    ).toBeGreaterThan(1e-3);
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

    const result = buildMainWirePeriodicPvaMethodV8(
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
    const uniform = buildMainWirePeriodicPvaMethodV8(
      formalLocusV1(settledPointsV1()),
      "LV",
    );
    const adaptive = buildMainWirePeriodicPvaMethodV8(
      formalLocusV1(
        settledPointsV1([
          1.16, 1.08, 1, 0.99, 0.965, 0.925, 0.86, 0.78, 0.7, 0.64, 0.6,
        ]),
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
    expect(adaptive.espvr.phaseSelectionPointCount).toBe(11);
    expect(uniform.espvr.phaseSelectionPointCount).toBe(9);
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
    const points = settledPointsV1([1.08, 1, 0.92, 0.84]);
    const partial = formalLocusV1(points, 21);

    expect(
      buildMainWirePeriodicPvaMethodV8(partial, "LV"),
    ).toMatchObject({
      status: "collecting",
      progress: { completedPointCount: 4, totalPointCount: 5 },
      preview: {
        stage: "anchor",
        pointCount: 4,
      },
    });
  });

  it("progresses from a narrow three-point preview to a bilateral five-point PVA", () => {
    const relations = buildMainWirePeriodicPvaMethodV8(
      formalLocusV1(settledPointsV1([1.08, 1, 0.92]), 21),
      "LV",
    );
    const provisionalPva = buildMainWirePeriodicPvaMethodV8(
      formalLocusV1(settledPointsV1([1.16, 1, 0.92, 0.84, 0.76]), 21),
      "LV",
    );

    expect(relations).toMatchObject({
      status: "collecting",
      preview: {
        stage: "anchor",
        pointCount: 3,
        pva: null,
      },
    });
    if (relations.status === "collecting") {
      expect(relations.preview?.espvr).toBeNull();
      expect(relations.preview?.edpvr).toBeNull();
    }
    expect(provisionalPva).toMatchObject({
      status: "available",
      completionStatus: "progressive",
      progress: { completedPointCount: 5, totalPointCount: 5 },
    });
    if (provisionalPva.status === "available") {
      expect(provisionalPva.espvr.phaseSelectionStatus).toBe("progressive");
      expect(provisionalPva.espvr.phaseSelectionPointCount).toBe(5);
      expect(provisionalPva.pva.joule).toBeGreaterThan(0);
      expect(provisionalPva.estimatedMvo2).toMatchObject({
        status: "available",
      });
    }
  });

  it("publishes PVA after five bidirectional points while the wider family continues", () => {
    const result = buildMainWirePeriodicPvaMethodV8(
      formalLocusV1(settledPointsV1([1.16, 1, 0.92, 0.84, 0.76]), 21),
      "LV",
    );

    expect(result.status).toBe("available");
    if (result.status !== "available") throw new Error(result.reason);
    expect(result.completionStatus).toBe("progressive");
    expect(result.progress).toEqual({
      completedPointCount: 5,
      totalPointCount: 5,
    });
    expect(result.source.familyProgress).toEqual({
      completedPointCount: 5,
      totalPointCount: 21,
    });
  });

  it("uses every settled load for preview but keeps the five-load PVA admission minimum", () => {
    const result = buildMainWirePeriodicPvaMethodV8(
      formalLocusV1(settledPointsV1([1.16, 1.08, 1, 0.92, 0.84]), 21),
      "LV",
    );

    expect(result).toMatchObject({
      status: "collecting",
      progress: { completedPointCount: 4, totalPointCount: 5 },
      preview: {
        stage: "relations",
        espvr: {
          phaseSelectionStatus: "progressive",
          phaseSelectionPointCount: 5,
        },
      },
    });
  });

  it("allows additional settled loads to update the common time over the fixed anchor-ESV domain", () => {
    const phaseAdaptiveRatios = [1.16, 1, 0.92, 0.84, 0.76, 1.08, 0.68, 0.6];
    const phaseAdaptiveFamily = settledPointsV1(phaseAdaptiveRatios).map(
      (point, pointIndex) => {
        const addedLoad = pointIndex >= 5;
        const peakPhase01 = addedLoad ? 0.52 : 0.45;
        return Object.freeze({
          ...point,
          ventricularPressureVolumeLoop: Object.freeze(
            point.ventricularPressureVolumeLoop.map((sample) => {
              const normalizedActivation = Math.max(
                0,
                1 - Math.abs(sample.phase01! - peakPhase01) / 0.18,
              );
              return Object.freeze({
                ...sample,
                pressureMmHg:
                  (1.6 + 0.4 * normalizedActivation) *
                  Math.max(1, sample.volumeMl - 20),
              });
            }),
          ),
        });
      },
    );
    const core = phaseAdaptiveFamily.slice(0, 5);
    const coreResult = buildMainWirePeriodicPvaMethodV8(
      formalLocusV1(core, phaseAdaptiveFamily.length),
      "LV",
    );
    const extendedResult = buildMainWirePeriodicPvaMethodV8(
      formalLocusV1(phaseAdaptiveFamily),
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
    expect(extendedResult.espvr.selectedTimeSinceAtrialCaptureSec).not.toBe(
      coreResult.espvr.selectedTimeSinceAtrialCaptureSec,
    );
    expect(extendedResult.espvr.phaseSelectionIntegrationVolumeRangeMl).toEqual(
      coreResult.espvr.phaseSelectionIntegrationVolumeRangeMl,
    );
    expect(coreResult.espvr.phaseSelectionPointCount).toBe(5);
    expect(extendedResult.espvr.phaseSelectionPointCount).toBe(8);
    expect(coreResult.espvr.phaseSelectionStatus).toBe("progressive");
    expect(extendedResult.espvr.phaseSelectionStatus).toBe("complete");
    expect(extendedResult.espvr.fitPoints.length).toBeGreaterThan(
      coreResult.espvr.fitPoints.length,
    );
    expect(extendedResult.edpvr.fitPoints.length).toBeGreaterThan(
      coreResult.edpvr.fitPoints.length,
    );
    expect(extendedResult.strokeWork).toEqual(coreResult.strokeWork);
  });

  it("uses a relative baseline span without pushing low-TBV Scenarios below the absolute floor", () => {
    const sourceTbvMl =
      MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3.totalBloodVolumeMl;
    const adaptiveRatios = [
      1.16, 1.08, 1, 0.96, 0.91, 0.855, 0.8, 0.75, 0.7, 0.65, 0.6,
    ];
    const adaptive = buildMainWirePeriodicPvaMethodV8(
      formalLocusV1(settledPointsV1(adaptiveRatios)),
      "LV",
    );

    expect(MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PVA_MINIMUM_POINT_COUNT_V3).toBe(
      5,
    );
    expect(
      mainWireIntegratedModelFormalPvaTargetGlobalTbvMlV3(
        sourceTbvMl,
        MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PVA_MINIMUM_TBV_SCALE_V3,
      ),
    ).toBe(sourceTbvMl * 0.7);
    expect(
      MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PVA_MINIMUM_ABSOLUTE_TBV_ML_V3,
    ).toBe(3_360);
    expect(
      mainWireIntegratedModelFormalPvaMinimumGlobalTbvMlV3(sourceTbvMl),
    ).toBeCloseTo(3_920, 10);
    expect(mainWireIntegratedModelFormalPvaMinimumGlobalTbvMlV3(4_400)).toBe(
      3_360,
    );
    expect(mainWireIntegratedModelFormalPvaMinimumGlobalTbvMlV3(4_200)).toBe(
      3_360,
    );
    expect(mainWireIntegratedModelFormalPvaMinimumGlobalTbvMlV3(7_000)).toBe(
      4_900,
    );
    expect(adaptive.status).toBe("available");
    if (adaptive.status === "available") {
      expect(adaptive.source.pointCount).toBe(adaptiveRatios.length);
      expect(adaptive.espvr.fitPoints.length).toBeGreaterThanOrEqual(5);
      expect(adaptive.espvr.fitPoints).toHaveLength(adaptiveRatios.length);
      expect(adaptive.edpvr.fitPoints).toHaveLength(adaptiveRatios.length);
    }
  });

  it("does not expose a separate semilunar-closure or classical Ees/V0 owner", () => {
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

    const result = buildMainWirePeriodicPvaMethodV8(
      formalLocusV1(points),
      "LV",
    );
    expect(result.status).toBe("available");
    if (result.status === "available") {
      expect(result.espvr.primaryMethod).toBe(
        "active-pressure-area-max-common-isochrone",
      );
      expect("semilunarClosureComparator" in result.espvr).toBe(false);
      expect("educationalLinearApproximation" in result.espvr).toBe(false);
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
      buildMainWirePeriodicPvaMethodV8(formalLocusV1(points), "LV"),
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
      buildMainWirePeriodicPvaMethodV8(formalLocusV1(points), "LV"),
    ).toMatchObject({
      status: "unavailable",
      reason: expect.stringContaining("fixed anchor-ESV neighborhood"),
    });
  });

  it("does not expose an RV oxygen estimate", () => {
    const result = buildMainWirePeriodicPvaMethodV8(
      formalLocusV1(settledPointsV1()),
      "RV",
    );
    expect(result.status).toBe("available");
    if (result.status === "available") expect(result.estimatedMvo2).toBeNull();
  });

  it("keeps the PV pane focused on curves instead of a numerical result card", () => {
    const periodicPva = buildMainWirePeriodicPvaMethodV8(
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
    expect(html).toContain('data-pva-drawing-count="1"');
    expect(html).toContain('data-pva-retained-drawing-count="0"');
    expect(html).toContain(
      'data-pv-relation-model="all-settled-shape-preserving-locus"',
    );
    expect(html).toContain('data-pv-pressure-envelope-visible="false"');
    expect(html).not.toContain('data-testid="workbench-pva-results"');

    const envelopeHtml = renderToStaticMarkup(
      React.createElement(PressureVolumeLoopCanvasV3, {
        showPressureEnvelope: true,
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
    expect(envelopeHtml).toContain('data-pv-pressure-envelope-visible="true"');
  });

  it("renders settled-point progress in the PV pane", () => {
    const periodicPva = buildMainWirePeriodicPvaMethodV8(
      formalLocusV1(settledPointsV1([1.16, 1, 0.92, 0.84, 0.76]), 21),
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

    expect(html).toContain("PVA ready · Starling extension 5 settled points");
  });

  it("retains the last valid relation drawing only while an update is pending", () => {
    const previous: Readonly<{ relationId: string }> = Object.freeze({
      relationId: "settled/five-points",
    });

    expect(retainWorkbenchPvRelationDrawingV3(null, previous, true)).toEqual({
      drawing: previous,
      retainedFromPriorUpdate: true,
    });
    expect(
      retainWorkbenchPvRelationDrawingV3(
        Object.freeze({ relationId: "settled/six-points" }),
        previous,
        true,
      ),
    ).toMatchObject({
      drawing: { relationId: "settled/six-points" },
      retainedFromPriorUpdate: false,
    });
    expect(retainWorkbenchPvRelationDrawingV3(null, previous, false)).toEqual({
      drawing: null,
      retainedFromPriorUpdate: false,
    });
  });

  it("keeps live SW separate while materializing PE, PVA, and estimated MVO2", async () => {
    const { contract } = (await loadStudioDefaultClientCompositionV2())
      .modelSurface;
    const analysisOutputIds = Object.values(
      MAIN_WIRE_PERIODIC_PVA_OUTPUT_IDS_V1,
    );
    expect(
      contract.outputCatalog.some(({ outputId }) =>
        analysisOutputIds.includes(
          outputId as (typeof analysisOutputIds)[number],
        )),
    ).toBe(true);
    const periodicPva = buildMainWirePeriodicPvaMethodV8(
      formalLocusV1(settledPointsV1()),
      "LV",
    );
    expect(periodicPva.status).toBe("available");
    if (periodicPva.status !== "available") throw new Error(periodicPva.reason);
    const defaultPane = createDefaultExperimentSurfaceV3(
      contract,
      "scenario/current",
    ).outputPanes[0]!;
    const outputIds = analysisOutputIds;
    const outputLabels = [
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
    expect(
      workbenchPeriodicPvaOutputValueV3(
        periodicPva,
        "myocardium.work.stroke.LV",
      ),
    ).toBeUndefined();

    const early = buildMainWirePeriodicPvaMethodV8(
      formalLocusV1(settledPointsV1([1.16, 1, 0.92, 0.84, 0.76]), 21),
      "LV",
    );
    expect(early.status).toBe("available");
    if (early.status !== "available") {
      throw new Error("five-point bidirectional PVA was unavailable");
    }
    const earlyPvaMilliJoule = early.pva.joule * 1e3;
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
              MAIN_WIRE_PERIODIC_PVA_OUTPUT_IDS_V1.pressureVolumeAreaMilliJoule,
            label: "PVA",
            order: 0,
          },
        ],
      },
      periodicPva: early,
    });
    expect(progressItems[0]).toMatchObject({
      availability: "available",
      value: earlyPvaMilliJoule,
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
    expect(html).not.toContain("formal pressure-volume load 0.95 rejected");
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

function endpointSecantPotentialEnergyV1(
  result: Extract<
    ReturnType<typeof buildMainWirePeriodicPvaMethodV8>,
    Readonly<{ status: "available" }>
  >,
): number {
  const first = result.espvr.fitPoints[0]!;
  const last = result.espvr.fitPoints.at(-1)!;
  const slope =
    (last.pressureMmHg - first.pressureMmHg) / (last.volumeMl - first.volumeMl);
  const intercept = first.pressureMmHg - slope * first.volumeMl;
  const pressureDifference = (volumeMl: number) =>
    slope * volumeMl +
    intercept -
    Math.max(
      0,
      result.edpvr.scaleMmHg *
        Math.expm1(
          result.edpvr.exponentPerMl *
            (volumeMl - result.edpvr.zeroPressureVolumeMl),
        ),
    );
  let leftVolumeMl = 0;
  let leftDifferenceMmHg = pressureDifference(leftVolumeMl);
  let rightVolumeMl = Number.NaN;
  for (let index = 1; index <= 512; index += 1) {
    const volumeMl = (index / 512) * result.anchor.endSystolicVolumeMl;
    const differenceMmHg = pressureDifference(volumeMl);
    if (leftDifferenceMmHg <= 0 && differenceMmHg > 0) {
      rightVolumeMl = volumeMl;
      break;
    }
    leftVolumeMl = volumeMl;
    leftDifferenceMmHg = differenceMmHg;
  }
  if (!Number.isFinite(rightVolumeMl)) {
    throw new Error("endpoint secant did not cross the fitted EDPVR");
  }
  for (let iteration = 0; iteration < 80; iteration += 1) {
    const midpointVolumeMl = 0.5 * (leftVolumeMl + rightVolumeMl);
    if (pressureDifference(midpointVolumeMl) > 0) {
      rightVolumeMl = midpointVolumeMl;
    } else {
      leftVolumeMl = midpointVolumeMl;
    }
  }
  const intersectionVolumeMl = 0.5 * (leftVolumeMl + rightVolumeMl);
  const intervalCount = 4_096;
  const widthMl =
    (result.anchor.endSystolicVolumeMl - intersectionVolumeMl) / intervalCount;
  let areaMmHgMl = 0;
  let previousDifferenceMmHg = pressureDifference(intersectionVolumeMl);
  for (let index = 1; index <= intervalCount; index += 1) {
    const volumeMl = intersectionVolumeMl + index * widthMl;
    const differenceMmHg = pressureDifference(volumeMl);
    areaMmHgMl += 0.5 * (previousDifferenceMmHg + differenceMmHg) * widthMl;
    previousDifferenceMmHg = differenceMmHg;
  }
  return areaMmHgMl;
}

function settledPointsV1(
  ratios: readonly number[] = [
    1.16, 1.08, 1, 0.92, 0.84, 0.76, 0.68, 0.64, 0.6,
  ],
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
        1 - Math.abs(phase01 - 0.55) / 0.25,
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
