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
import { PressureVolumeLoopCanvasV3 } from "@/components/workbench/v3/PressureVolumeLoopCanvasV3";

describe("settled hot-start PVA V1", () => {
  it("calculates SW, linear ESPVR, exponential EDPVR, PE, PVA, and LV MVO2", () => {
    const result = buildMainWireIntegratedModelPeriodicPvaV1(
      formalLocusV1(settledPointsV1()),
      "LV",
    );

    expect(result.status).toBe("available");
    if (result.status !== "available") throw new Error(result.reason);
    expect(result.source).toMatchObject({
      primaryLineage: "persistent-worker-settled-hot-start-chain",
      pointCount: 7,
      endDiastolicLandmark: "maximum-volume-proxy",
    });
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
    expect(result.strokeWork.joule).toBeGreaterThan(0);
    expect(result.potentialEnergy.joule).toBeGreaterThanOrEqual(0);
    expect(result.pva.joule).toBeCloseTo(
      result.strokeWork.joule + result.potentialEnergy.joule,
      12,
    );
    expect(result.estimatedMvo2).toMatchObject({
      status: "available",
      ventricleId: "LV",
      interpretation: {
        modelSpecificCalibrationEstablished: false,
        measuredOxygenConsumption: false,
      },
    });
  });

  it("retains a quadratic ESPVR comparator without silently replacing the primary fit", () => {
    const curved = settledPointsV1().map((point, index) => {
      const es = point.ventricularPressureVolumeLandmarks.endSystolic;
      const pressureMmHg =
        1.6 * (es.volumeMl - 18) + 0.012 * (es.volumeMl - 50) ** 2;
      return Object.freeze({
        ...point,
        ventricularPressureVolumeLandmarks: Object.freeze({
          ...point.ventricularPressureVolumeLandmarks,
          endSystolic: Object.freeze({ ...es, pressureMmHg }),
        }),
      });
    });
    const result = buildMainWireIntegratedModelPeriodicPvaV1(
      formalLocusV1(curved),
      "LV",
    );

    expect(result.status).toBe("available");
    if (result.status !== "available") throw new Error(result.reason);
    expect(result.espvr.primaryMethod).toBe("linear-semilunar-closure-fit");
    expect(result.espvr.nonlinearComparator).toMatchObject({
      method: "quadratic-semilunar-closure-fit",
      monotonicallyIncreasingAcrossMeasuredRange: true,
    });
    expect(result.espvr.nonlinearComparator!.rSquared).toBeGreaterThan(
      result.espvr.rSquared,
    );
  });

  it("reports point progress until the formal hot-start chain completes", () => {
    const points = settledPointsV1().slice(0, 4);
    const partial = formalLocusV1(points, 9);

    expect(
      buildMainWireIntegratedModelPeriodicPvaV1(partial, "LV"),
    ).toMatchObject({
      status: "collecting",
      progress: { completedPointCount: 4, totalPointCount: 9 },
    });
  });

  it("fails closed when semilunar closure landmarks are unavailable", () => {
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

    expect(
      buildMainWireIntegratedModelPeriodicPvaV1(formalLocusV1(points), "LV"),
    ).toMatchObject({ status: "unavailable" });
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
  });

  it("renders settled-point progress in the PV pane", () => {
    const periodicPva = buildMainWireIntegratedModelPeriodicPvaV1(
      formalLocusV1(settledPointsV1().slice(0, 5), 9),
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

    expect(html).toContain("PVA analysis 5/9 points");
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
    [0.82, 0.9, 0.96, 1, 1.06, 1.12, 1.2].map((ratio, index) => {
      const endSystolicVolumeMl = 41 + index * 3;
      const endDiastolicVolumeMl = 96 + index * 5;
      const endSystolicPressureMmHg = 2 * (endSystolicVolumeMl - 20);
      const endDiastolicPressureMmHg =
        2 * Math.expm1(0.02 * (endDiastolicVolumeMl - 60));
      return Object.freeze({
        totalBloodVolumeMl: 4_000 * ratio,
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
  const points: MainWireIntegratedModelPressureVolumeLoopPointV3[] = [];
  for (let index = 0; index <= 6; index += 1) {
    points.push(
      Object.freeze({
        volumeMl: input.endDiastolicVolumeMl,
        pressureMmHg:
          input.endDiastolicPressureMmHg +
          (index / 6) *
            (input.endSystolicPressureMmHg - input.endDiastolicPressureMmHg),
      }),
    );
  }
  for (let index = 1; index <= 16; index += 1) {
    const fraction = index / 16;
    points.push(
      Object.freeze({
        volumeMl:
          input.endDiastolicVolumeMl -
          fraction * (input.endDiastolicVolumeMl - input.endSystolicVolumeMl),
        pressureMmHg:
          input.endSystolicPressureMmHg + 18 * Math.sin(Math.PI * fraction),
      }),
    );
  }
  for (let index = 1; index <= 6; index += 1) {
    points.push(
      Object.freeze({
        volumeMl: input.endSystolicVolumeMl,
        pressureMmHg: input.endSystolicPressureMmHg * (1 - index / 6),
      }),
    );
  }
  for (let index = 1; index <= 16; index += 1) {
    const fraction = index / 16;
    points.push(
      Object.freeze({
        volumeMl:
          input.endSystolicVolumeMl +
          fraction * (input.endDiastolicVolumeMl - input.endSystolicVolumeMl),
        pressureMmHg: input.endDiastolicPressureMmHg * fraction ** 2,
      }),
    );
  }
  return Object.freeze(points);
}
