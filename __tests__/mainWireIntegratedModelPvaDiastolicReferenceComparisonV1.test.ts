import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import type { MainWireIntegratedModelMethodSpecificPvaResearchV1 } from "@/engine/myocardium/experiments/MainWireIntegratedModelMethodSpecificPvaResearchV1";
import {
  compareMainWireIntegratedModelPvaDiastolicReferencesV1,
  generateMainWireIntrinsicPassiveCenterSlicesForPvaV1,
  integrateMainWireIntrinsicPassivePotentialEnergyV1,
  integratePositivePiecewiseLinearReferenceV1,
  type MainWireIntrinsicPassiveCenterSliceV1,
  type MainWireIntrinsicPassiveSurfacePilotSourceV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPvaDiastolicReferenceComparisonV1";

describe("PVA diastolic-reference comparison V1", () => {
  it("integrates a zero-clamped piecewise-linear intrinsic reference", () => {
    const slice = manufacturedSliceV1();

    expect(integratePositivePiecewiseLinearReferenceV1(slice, 25)).toBe(25);
    const result = integrateMainWireIntrinsicPassivePotentialEnergyV1(
      {
        slopeMmHgPerMl: 10,
        interceptMmHg: -100,
        volumeAxisInterceptMl: 10,
        measuredVolumeRangeMl: [10, 25],
        residualSumOfSquaresMmHgSquared: 0,
        rSquared: 1,
      },
      slice,
      25,
    );

    expect(result).toEqual({
      status: "available",
      intersectionVolumeMl: 10,
      passivePressureAtEndpointMmHg: 4,
      passiveIntegralMmHgMl: 25,
      potentialEnergyMmHgMl: 1_100,
      contributionMode: "piecewise-linear-interpolation",
    });
  });

  it("uses zero pressure below the intrinsic crossing without extrapolating positive pressure", () => {
    const result = integrateMainWireIntrinsicPassivePotentialEnergyV1(
      {
        slopeMmHgPerMl: 2,
        interceptMmHg: 0,
        volumeAxisInterceptMl: 0,
        measuredVolumeRangeMl: [0, 8],
        residualSumOfSquaresMmHgSquared: 0,
        rSquared: 1,
      },
      manufacturedSliceV1(),
      8,
    );

    expect(result).toEqual({
      status: "available",
      intersectionVolumeMl: 0,
      passivePressureAtEndpointMmHg: 0,
      passiveIntegralMmHgMl: 0,
      potentialEnergyMmHgMl: 64,
      contributionMode: "zero-pressure-clamp",
    });
  });

  it("marks an endpoint above the sampled intrinsic curve unavailable", () => {
    expect(
      integrateMainWireIntrinsicPassivePotentialEnergyV1(
        {
          slopeMmHgPerMl: 10,
          interceptMmHg: -100,
          volumeAxisInterceptMl: 10,
          measuredVolumeRangeMl: [10, 31],
          residualSumOfSquaresMmHgSquared: 0,
          rSquared: 1,
        },
        manufacturedSliceV1(),
        31,
      ),
    ).toEqual({
      status: "unavailable",
      reason: "systolic endpoint lies outside the intrinsic reference domain",
    });
  });

  it("extends the retained center slices and compares every previously available PVA row", () => {
    const pva = JSON.parse(
      readFileSync(
        join(
          process.cwd(),
          "artifacts/transient-preload/method-specific-pva-research-v1.json",
        ),
        "utf8",
      ),
    ) as MainWireIntegratedModelMethodSpecificPvaResearchV1;
    const surfaceEnvelope = JSON.parse(
      readFileSync(
        join(
          process.cwd(),
          "artifacts/passive-equilibrium/intrinsic-ventricular-passive-reduced-surface-pilot-v1.json",
        ),
        "utf8",
      ),
    ) as Readonly<{ payload: MainWireIntrinsicPassiveSurfacePilotSourceV1 }>;

    const slices = generateMainWireIntrinsicPassiveCenterSlicesForPvaV1(
      surfaceEnvelope.payload,
    );
    expect(slices).toHaveLength(2);
    for (const slice of slices) {
      expect(slice.status).toBe("available");
      if (slice.status !== "available") continue;
      expect(slice.points).toHaveLength(37);
      expect(slice.zeroPressureVolumeMl).toBeGreaterThan(
        slice.modelMinimumVolumeMl,
      );
      expect(slice.zeroPressureVolumeMl).toBeLessThan(
        slice.maximumSampledVolumeMl,
      );
      expect(
        slice.points.every(
          (point) =>
            Number.isFinite(point.intrinsicPressureMmHg) &&
            point.scaledForceInfinityNorm <= 1e-10 &&
            point.minimumScaledInternalHessianEigenvalue > 1e-10,
        ),
      ).toBe(true);
    }

    const comparison = compareMainWireIntegratedModelPvaDiastolicReferencesV1(
      pva,
      slices,
    );
    expect(comparison.rows).toHaveLength(168);
    expect(comparison.summary.availableComparisonRowCount).toBe(105);
    expect(comparison.summary.unavailableComparisonRowCount).toBe(63);
    expect(
      comparison.summary.zeroPressureClampRowCount +
        comparison.summary.piecewiseLinearInterpolationRowCount,
    ).toBe(105);
    expect(
      comparison.rows.every((row) => {
        if (row.status === "unavailable") return true;
        return (
          row.intrinsicPassivePvaJ ===
            row.externalWorkJ + row.intrinsicPassivePotentialEnergyJ &&
          Number.isFinite(row.intrinsicMinusDynamicPvaJ) &&
          Number.isFinite(row.intrinsicMinusDynamicPvaPercent)
        );
      }),
    ).toBe(true);
    expect(comparison.interpretation).toEqual({
      externalWorkChanged: false,
      systolicRelationsChanged: false,
      genericPvaEstablished: false,
      clinicalEdpvrEstablished: false,
      fullBiventricularPassiveSurfaceEstablished: false,
      pericardiumIncluded: false,
      activeStressIncludedInPassiveReference: false,
      productionOutputEstablished: false,
      oxygenConsumptionEstablished: false,
    });
  });
});

function manufacturedSliceV1(): MainWireIntrinsicPassiveCenterSliceV1 {
  const point = (volumeMl: number, intrinsicPressureMmHg: number) =>
    Object.freeze({
      volumeMl,
      intrinsicPressureMmHg,
      source: "extended-continuation" as const,
      scaledForceInfinityNorm: 0,
      minimumScaledInternalHessianEigenvalue: 1,
      candidateEvaluations: 1,
      acceptedUpdates: 0,
      rejectedTrials: 0,
    });
  return Object.freeze({
    status: "available" as const,
    ventricleId: "LV" as const,
    fixedContralateralVentricleId: "RV" as const,
    fixedContralateralVolumeMl: 100,
    modelMinimumVolumeMl: 5,
    maximumSampledVolumeMl: 30,
    zeroPressureVolumeMl: 10,
    pressureRule:
      "piecewise-linear-positive-pressure-with-zero-clamp-below-crossing" as const,
    extensionIntervalCount: 2,
    points: Object.freeze([
      point(5, -1),
      point(10, 0),
      point(20, 2),
      point(30, 6),
    ]),
  });
}
