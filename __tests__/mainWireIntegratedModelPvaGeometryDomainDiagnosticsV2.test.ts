import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import type { MainWireIntegratedModelMethodSpecificPvaResearchV1 } from "@/engine/myocardium/experiments/MainWireIntegratedModelMethodSpecificPvaResearchV1";
import type { MainWireIntegratedModelPvaDiastolicReferenceComparisonV1 } from "@/engine/myocardium/experiments/MainWireIntegratedModelPvaDiastolicReferenceComparisonV1";
import {
  decomposeMainWireIntegratedModelSystolicLineAreaV2,
  diagnoseMainWireIntegratedModelPvaGeometryDomainsV2,
  findMainWireIntegratedModelSupportedIntersectionV2,
  type MainWireIntegratedModelPvaGeometryDomainDiagnosticsV2,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPvaGeometryDomainDiagnosticsV2";

describe("PVA geometry and domain diagnostics V2", () => {
  it("separates systolic line area inside and outside the measured volume range", () => {
    const decomposition = decomposeMainWireIntegratedModelSystolicLineAreaV2(
      {
        slopeMmHgPerMl: 10,
        interceptMmHg: -100,
        volumeAxisInterceptMl: 10,
        measuredVolumeRangeMl: [15, 20],
        residualSumOfSquaresMmHgSquared: 0,
        rSquared: 1,
      },
      [15, 20],
      10,
      20,
    );

    expect(decomposition).toEqual({
      totalAreaMmHgMl: 500,
      insideMeasuredAreaMmHgMl: 375,
      outsideMeasuredAreaMmHgMl: 125,
      outsideMeasuredAreaFraction: 0.25,
    });
  });

  it("finds only an intersection inside the common supported domain", () => {
    const relation = {
      slopeMmHgPerMl: 10,
      interceptMmHg: -100,
      volumeAxisInterceptMl: 10,
      measuredVolumeRangeMl: [10, 20] as const,
      residualSumOfSquaresMmHgSquared: 0,
      rSquared: 1,
    };

    expect(
      findMainWireIntegratedModelSupportedIntersectionV2(
        relation,
        [10, 20],
        20,
        () => 20,
      ),
    ).toBeCloseTo(12, 12);
    expect(
      findMainWireIntegratedModelSupportedIntersectionV2(
        relation,
        [13, 20],
        20,
        () => 20,
      ),
    ).toBeNull();
  });

  it("reclassifies the retained V1 values without rerunning the transient model", () => {
    const { pva, comparison, committed } = retainedInputsV2();
    const result = diagnoseMainWireIntegratedModelPvaGeometryDomainsV2(
      pva,
      comparison,
    );

    expect(result).toEqual(committed);
    expect(result.summary).toMatchObject({
      attemptedRowCount: 168,
      sourceAvailableRowCount: 105,
      sourceUnavailableRowCount: 63,
      uniqueBeatWorkCount: 42,
      exactlyClosedBeatWorkCount: 0,
      intrinsicEndpointBelowModelMinimumCount: 44,
      intrinsicEndpointAboveSampledMaximumCount: 0,
      dynamicFitBoundaryCount: 4,
    });
    expect(result.summary.byReference).toEqual([
      {
        referenceId: "dynamic-maximum-volume",
        domainSupportedPvaRowCount: 0,
        transientPvaLikeAreaRowCount: 21,
        outOfDomainRowCount: 84,
        methodUnavailableRowCount: 63,
        observedDomainAreaStripRowCount: 21,
        supportedIntersectionRowCount: 0,
      },
      {
        referenceId: "intrinsic-passive-center-slice",
        domainSupportedPvaRowCount: 0,
        transientPvaLikeAreaRowCount: 61,
        outOfDomainRowCount: 44,
        methodUnavailableRowCount: 63,
        observedDomainAreaStripRowCount: 59,
        supportedIntersectionRowCount: 0,
      },
    ]);
  });

  it("makes synthetic closure and large systolic extrapolation visible", () => {
    const { committed } = retainedInputsV2();
    const closure = committed.summary.syntheticClosureFraction;
    const extrapolation =
      committed.summary.systolicLineOutsideMeasuredRangeFraction;

    expect(closure.minimum).toBeCloseTo(6.104349819614962e-7, 18);
    expect(closure.median).toBeCloseTo(0.10152996130772557, 15);
    expect(closure.maximum).toBeCloseTo(0.2698791115427374, 15);
    expect(closure.aboveOnePercentCount).toBe(36);
    expect(closure.aboveFivePercentCount).toBe(31);
    expect(extrapolation.minimum).toBeCloseTo(0.15722654420344978, 15);
    expect(extrapolation.median).toBeCloseTo(0.8180472441317581, 15);
    expect(extrapolation.maximum).toBe(1);
    expect(extrapolation.aboveHalfCount).toBe(81);
    expect(extrapolation.aboveThreeQuartersCount).toBe(70);
  });

  it("uses support contacts rather than the whole raw loop as the measured relation range", () => {
    const { committed } = retainedInputsV2();
    const support = committed.systolicRelationDiagnostics.filter(
      (diagnostic) =>
        diagnostic.status === "available" &&
        diagnostic.systolicMethodId === "sampled-common-support-envelope",
    );

    expect(support).toHaveLength(4);
    expect(
      support.every(
        (diagnostic) =>
          diagnostic.reportedRangeMatchesLandmarkContactRange === false,
      ),
    ).toBe(true);
    expect(
      support.every(
        (diagnostic) => diagnostic.slopeSearchBoundary === "interior",
      ),
    ).toBe(true);
  });

  it("retains search-boundary diagnostics instead of calling the dynamic fit identified", () => {
    const { committed } = retainedInputsV2();
    expect(committed.dynamicReferenceDiagnostics).toHaveLength(4);
    expect(
      committed.dynamicReferenceDiagnostics.every(
        (diagnostic) =>
          diagnostic.status === "available" &&
          diagnostic.fitInteriorToDeclaredSearchGrid === false,
      ),
    ).toBe(true);
    expect(
      committed.dynamicReferenceDiagnostics.map((diagnostic) => ({
        ventricleId: diagnostic.ventricleId,
        directionId: diagnostic.directionId,
        betaSearchBoundary: diagnostic.betaSearchBoundary,
        offsetSearchBoundary: diagnostic.offsetSearchBoundary,
      })),
    ).toEqual([
      {
        ventricleId: "LV",
        directionId: "occlusion",
        betaSearchBoundary: "interior",
        offsetSearchBoundary: "lower-bound",
      },
      {
        ventricleId: "RV",
        directionId: "occlusion",
        betaSearchBoundary: "upper-bound",
        offsetSearchBoundary: "interior",
      },
      {
        ventricleId: "LV",
        directionId: "release",
        betaSearchBoundary: "interior",
        offsetSearchBoundary: "lower-bound",
      },
      {
        ventricleId: "RV",
        directionId: "release",
        betaSearchBoundary: "upper-bound",
        offsetSearchBoundary: "interior",
      },
    ]);
  });

  it("keeps all absolute PVA promotion claims false", () => {
    const { committed } = retainedInputsV2();
    expect(committed.interpretation).toEqual({
      existingAbsolutePvaReadyForProductDisplay: false,
      genericPvaEstablished: false,
      closedPeriodicLoopEstablishedForTransientRows: false,
      domainSupportedSystolicPassiveIntersectionEstablishedForEveryRow: false,
      clinicalPvaEstablished: false,
      oxygenConsumptionEstablished: false,
    });
  });
});

function retainedInputsV2(): Readonly<{
  pva: MainWireIntegratedModelMethodSpecificPvaResearchV1;
  comparison: MainWireIntegratedModelPvaDiastolicReferenceComparisonV1;
  committed: MainWireIntegratedModelPvaGeometryDomainDiagnosticsV2;
}> {
  const read = <T>(path: string): T =>
    JSON.parse(readFileSync(join(process.cwd(), path), "utf8")) as T;
  return Object.freeze({
    pva: read<MainWireIntegratedModelMethodSpecificPvaResearchV1>(
      "artifacts/transient-preload/method-specific-pva-research-v1.json",
    ),
    comparison: read<MainWireIntegratedModelPvaDiastolicReferenceComparisonV1>(
      "artifacts/transient-preload/pva-diastolic-reference-comparison-v1.json",
    ),
    committed: read<MainWireIntegratedModelPvaGeometryDomainDiagnosticsV2>(
      "artifacts/transient-preload/pva-geometry-domain-diagnostics-v2.json",
    ),
  });
}
