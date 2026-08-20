import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import type { MainWireIntegratedModelMethodSpecificPvaResearchV1 } from "@/engine/myocardium/experiments/MainWireIntegratedModelMethodSpecificPvaResearchV1";
import {
  compareMainWireIntegratedModelPvaCommonPericardiumReferenceV1,
  type MainWireIntegratedModelPvaCommonPericardiumReferenceV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPvaCommonPericardiumReferenceV1";
import type { MainWireIntegratedModelPvaDiastolicReferenceComparisonV1 } from "@/engine/myocardium/experiments/MainWireIntegratedModelPvaDiastolicReferenceComparisonV1";

describe("PVA common-pericardium reference V1", () => {
  it("keeps the healthy fixed-condition slice in the exact slack branch", () => {
    const result = deriveResultV1();

    expect(result.constrainedSlices).toHaveLength(2);
    for (const slice of result.constrainedSlices) {
      expect(slice.status).toBe("available");
      if (slice.status !== "available") continue;
      expect(slice.points).toHaveLength(37);
      expect(slice.allSampledPointsInExactZeroBranch).toBe(true);
      expect(slice.maximumCommonPericardialExcessPressureMmHg).toBe(0);
      expect(slice.minimumSlackMarginMl).toBeGreaterThan(30);
      expect(
        slice.points.every(
          (point) =>
            point.smoothingBranch === "zero" &&
            point.commonPericardialExcessPressureMmHg === 0 &&
            point.commonPericardialStoredEnergyJ === 0 &&
            point.commonPericardialTangentMmHgPerMl === 0 &&
            point.constrainedPressureMmHg === point.intrinsicPressureMmHg,
        ),
      ).toBe(true);
    }
  });

  it("preserves all comparable PVA rows and keeps the positive control responsive", () => {
    const result = deriveResultV1();

    expect(result.rows).toHaveLength(168);
    expect(result.summary.availableComparisonRowCount).toBe(105);
    expect(result.summary.unavailableComparisonRowCount).toBe(63);
    expect(result.summary.changedPvaRowCount).toBe(0);
    expect(result.summary.maximumAbsoluteConstrainedMinusIntrinsicPvaJ).toBe(0);
    expect(
      result.rows.every(
        (row) =>
          row.status === "unavailable" ||
          (row.commonPericardiumConstrainedPvaJ === row.intrinsicPassivePvaJ &&
            row.constrainedMinusIntrinsicPvaJ === 0 &&
            row.commonPericardialExcessPressureAtEndpointMmHg === 0),
      ),
    ).toBe(true);
    for (const control of result.positiveControl.byVentricle) {
      expect(control.evaluatedPointCount).toBe(37);
      expect(control.engagedPointCount).toBe(37);
      expect(control.minimumExcessPressureMmHg).toBeGreaterThan(0);
      expect(control.maximumExcessPressureMmHg).toBeGreaterThan(
        control.minimumExcessPressureMmHg,
      );
    }
    expect(result.interpretation).toEqual({
      defaultHealthyPericardiumEngagedOnSampledSlices: false,
      externalWorkChanged: false,
      systolicRelationsChanged: false,
      dynamicPericardialContributionEstablished: false,
      fullPressureBasisMatchedPericardialPvaEstablished: false,
      genericPvaEstablished: false,
      clinicalEdpvrEstablished: false,
      productionOutputEstablished: false,
      oxygenConsumptionEstablished: false,
    });
  });

  it("replays the compact committed result from the two retained PVA studies", () => {
    const committed = JSON.parse(
      readFileSync(
        join(
          process.cwd(),
          "artifacts/transient-preload/pva-common-pericardium-reference-v1.json",
        ),
        "utf8",
      ),
    ) as MainWireIntegratedModelPvaCommonPericardiumReferenceV1;

    expect(committed).toEqual(deriveResultV1());
  });
});

function deriveResultV1(): MainWireIntegratedModelPvaCommonPericardiumReferenceV1 {
  const methodSpecific = JSON.parse(
    readFileSync(
      join(
        process.cwd(),
        "artifacts/transient-preload/method-specific-pva-research-v1.json",
      ),
      "utf8",
    ),
  ) as MainWireIntegratedModelMethodSpecificPvaResearchV1;
  const intrinsic = JSON.parse(
    readFileSync(
      join(
        process.cwd(),
        "artifacts/transient-preload/pva-diastolic-reference-comparison-v1.json",
      ),
      "utf8",
    ),
  ) as MainWireIntegratedModelPvaDiastolicReferenceComparisonV1;

  return compareMainWireIntegratedModelPvaCommonPericardiumReferenceV1(
    methodSpecific,
    intrinsic,
  );
}
