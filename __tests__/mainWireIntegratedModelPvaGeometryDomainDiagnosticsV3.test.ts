import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import type { MainWireIntegratedModelMethodSpecificPvaResearchV1 } from "@/engine/myocardium/experiments/MainWireIntegratedModelMethodSpecificPvaResearchV1";
import type { MainWireIntegratedModelPvaDiastolicReferenceComparisonV1 } from "@/engine/myocardium/experiments/MainWireIntegratedModelPvaDiastolicReferenceComparisonV1";
import {
  diagnoseMainWireIntegratedModelPvaGeometryDomainsV3,
  verifyMainWireIntegratedModelSingleSupportedIntersectionV3,
  type MainWireIntegratedModelPvaGeometryDomainDiagnosticsV3,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPvaGeometryDomainDiagnosticsV3";

describe("PVA geometry/domain diagnostics V3", () => {
  it("retains corrected closure and unavailable-relation semantics", () => {
    const result = committedV3();

    expect(result.summary).toMatchObject({
      attemptedRowCount: 168,
      semanticRowBindingEstablished: true,
      exactEndpointClosureCount: 0,
      numericallyPeriodicClosureQualifiedCount: 0,
      transientOpenPathCount: 42,
      relationInadmissibleRowCount: 21,
      methodUnavailableRowCount: 42,
    });
    expect(
      result.closureDiagnostics.every((row) => row.transientOpenPath),
    ).toBe(true);
    expect(
      result.rows.filter((row) => row.status === "relation-inadmissible"),
    ).toHaveLength(21);
    expect(
      result.rows.filter((row) => row.status === "method-unavailable"),
    ).toHaveLength(42);
  });

  it("requires the systolic line to remain above the passive reference", () => {
    const relation = {
      slopeMmHgPerMl: 1,
      interceptMmHg: 0,
      volumeAxisInterceptMl: 0,
      measuredVolumeRangeMl: [0, 10] as const,
      residualSumOfSquaresMmHgSquared: 0,
      rSquared: 1,
    };
    expect(
      verifyMainWireIntegratedModelSingleSupportedIntersectionV3(
        relation,
        2,
        8,
        (volumeMl) => (volumeMl <= 5 ? volumeMl - 1 : volumeMl + 1),
      ),
    ).toBe(false);
    expect(
      verifyMainWireIntegratedModelSingleSupportedIntersectionV3(
        relation,
        2,
        8,
        (volumeMl) => volumeMl - 1,
      ),
    ).toBe(true);
  });

  it("rejects a row-wise source mismatch without hashes or certification", () => {
    const pva = sourcePvaV3();
    const comparison = structuredClone(sourceComparisonV3()) as unknown as {
      rows: Array<
        | { status: "unavailable" }
        | { status: "available"; systolicEndpointPressureMmHg: number }
      >;
    };
    const first = comparison.rows.find((row) => row.status === "available");
    if (first?.status !== "available") throw new Error("available row missing");
    first.systolicEndpointPressureMmHg += 1;

    expect(() =>
      diagnoseMainWireIntegratedModelPvaGeometryDomainsV3(
        pva,
        comparison as unknown as MainWireIntegratedModelPvaDiastolicReferenceComparisonV1,
      ),
    ).toThrow("numerical row mismatch");
  });
});

function committedV3(): MainWireIntegratedModelPvaGeometryDomainDiagnosticsV3 {
  return JSON.parse(
    readFileSync(
      join(
        process.cwd(),
        "artifacts/transient-preload/pva-geometry-domain-diagnostics-v3.json",
      ),
      "utf8",
    ),
  ) as MainWireIntegratedModelPvaGeometryDomainDiagnosticsV3;
}

function sourcePvaV3(): MainWireIntegratedModelMethodSpecificPvaResearchV1 {
  return JSON.parse(
    readFileSync(
      join(
        process.cwd(),
        "artifacts/transient-preload/method-specific-pva-research-v1.json",
      ),
      "utf8",
    ),
  ) as MainWireIntegratedModelMethodSpecificPvaResearchV1;
}

function sourceComparisonV3(): MainWireIntegratedModelPvaDiastolicReferenceComparisonV1 {
  return JSON.parse(
    readFileSync(
      join(
        process.cwd(),
        "artifacts/transient-preload/pva-diastolic-reference-comparison-v1.json",
      ),
      "utf8",
    ),
  ) as MainWireIntegratedModelPvaDiastolicReferenceComparisonV1;
}
