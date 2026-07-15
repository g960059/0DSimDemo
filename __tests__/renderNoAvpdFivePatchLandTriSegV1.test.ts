import { describe, expect, it } from "vitest";

import type {
  NoAvpdFivePatchLandBenchResultV1,
  NoAvpdFivePatchLandBenchSampleV1,
} from "@/engine/mechanics2/benches/NoAvpdFivePatchLandTriSegBenchV1";
import { summarizeFivePatchRawCycleDiagnosticsV1 } from
  "@/engine/mechanics2/diagnostics/FivePatchRawCycleDiagnosticsV1";
import { renderNoAvpdFivePatchLandTriSegHtmlV1 } from
  "@/tools/mechanics2/renderNoAvpdFivePatchLandTriSegV1";

describe("renderNoAvpdFivePatchLandTriSegV1", () => {
  it("embeds raw vertices in static SVG without a client-side plotting dependency", () => {
    const samples = syntheticSamples();
    const report = {
      status: "pass",
      model: {
        modelId: "no-avpd-five-patch-land-triseg-v1",
        equationsVersionId: "test-equations",
      },
      parameterSnapshot: {
        triSegGeneralizedForceMapping: "full-fiber-energy-gradient",
      },
      protocol: {
        slsVariant: "all-patch",
        heartRateBpm: 60,
        dtSec: 0.1,
        stepsPerCycle: 10,
        beatsRequested: 1,
      },
      beatsCompleted: 1,
      exactOneBeatFullStateReturnMap: {
        maxAbsDimensionless: 0.01,
      },
      fullStateReturnMapGate: {
        applied: false,
        pass: null,
      },
      reportOnlyRawCycleDiagnostics:
        summarizeFivePatchRawCycleDiagnosticsV1(samples, 0.6),
      rawLastCycleSamples: samples,
    } as unknown as NoAvpdFivePatchLandBenchResultV1;

    const html = renderNoAvpdFivePatchLandTriSegHtmlV1(report);

    expect(html).toContain("LA blood-volume PV");
    expect(html).toContain("Mitral and pulmonary-venous flow");
    expect(html).toContain("Reservoir gradient proxy");
    expect(html).toContain("raw vertices</span>10");
    expect(html).toContain("Periodicity is not established.");
    expect(html).toContain("raw early/post-Ca local-max ratio");
    expect(html).toContain("<svg");
    expect(html).toContain("<path class=\"series");
    expect(html).not.toMatch(/d="[^"]*(?:NaN|Infinity)/);
    expect(html).not.toContain("<script");
    expect(html).not.toContain("fetch(");
  });

  it("renders a failed partial trace only with an explicit non-morphology warning", () => {
    const samples = syntheticSamples().slice(0, 8);
    const report = {
      status: "fail",
      model: {
        modelId: "no-avpd-five-patch-land-triseg-v1",
        equationsVersionId: "test-equations",
      },
      parameterSnapshot: {
        triSegGeneralizedForceMapping: "full-fiber-energy-gradient",
      },
      protocol: {
        slsVariant: "all-patch",
        heartRateBpm: 60,
        dtSec: 0.1,
        stepsPerCycle: 10,
        beatsRequested: 1,
      },
      beatsCompleted: 0,
      exactOneBeatFullStateReturnMap: null,
      fullStateReturnMapGate: {
        applied: false,
        pass: null,
      },
      reportOnlyRawCycleDiagnostics:
        summarizeFivePatchRawCycleDiagnosticsV1([], 0.6),
      rawLastCycleSamples: samples,
    } as unknown as NoAvpdFivePatchLandBenchResultV1;

    const html = renderNoAvpdFivePatchLandTriSegHtmlV1(report);
    expect(html).toContain("Incomplete cycle.");
    expect(html).toContain("not be interpreted as a closed PV loop");
    expect(html).toContain("partial raw trace; not morphology evidence");
  });

  it("keeps a complete finite cycle visible when a declared structural gate fails", () => {
    const samples = syntheticSamples();
    const report = {
      status: "fail",
      model: {
        modelId: "no-avpd-five-patch-land-triseg-v1",
        equationsVersionId: "test-equations",
      },
      parameterSnapshot: {
        triSegGeneralizedForceMapping: "full-fiber-energy-gradient",
      },
      protocol: {
        slsVariant: "all-patch",
        heartRateBpm: 60,
        dtSec: 0.1,
        stepsPerCycle: 10,
        beatsRequested: 1,
      },
      beatsCompleted: 1,
      exactOneBeatFullStateReturnMap: {
        maxAbsDimensionless: 0.02,
      },
      fullStateReturnMapGate: {
        applied: true,
        pass: false,
      },
      reportOnlyRawCycleDiagnostics:
        summarizeFivePatchRawCycleDiagnosticsV1(samples, 0.6),
      rawLastCycleSamples: samples,
    } as unknown as NoAvpdFivePatchLandBenchResultV1;

    const html = renderNoAvpdFivePatchLandTriSegHtmlV1(report);
    expect(html).toContain("Structural gates failed.");
    expect(html).not.toContain("Incomplete cycle.");
    expect(html).toContain("LA blood-volume PV");
  });
});

function syntheticSamples(): readonly NoAvpdFivePatchLandBenchSampleV1[] {
  const flow = [0, 1, 6, 3, 1, 2, 5, 2, 0, 0];
  const gradient = [-1, 1, 2, 2, 2, 2, 2, 1, -1, -1];
  return flow.map((mitralMlPerSec, index) => {
    const phase01 = (index + 1) / flow.length;
    const la = [7.2, 6.2, 6.8, 7.5, 8.3, 9, 10.5, 9.2, 7.5, 8.5][index]!;
    const wall = {
      stressesKPa: {
        effectiveTransmittedActive: 1 + phase01,
        passiveEquilibrium: 0.5 + phase01,
        slsOverstress: 0.1 * phase01,
        totalTransmitted: 1.5 + 2.1 * phase01,
      },
    };
    return {
      timeSec: phase01,
      beatIndex: 0,
      phase01,
      volumesMl: {
        leftAtriumMl: 65 + 8 * Math.cos(2 * Math.PI * phase01),
        leftVentricleMl: 120 - 30 * Math.cos(2 * Math.PI * phase01),
        systemicArteryMl: 700,
        systemicVeinMl: 3_000,
        rightAtriumMl: 60 + 4 * Math.cos(2 * Math.PI * phase01),
        rightVentricleMl: 120 - 20 * Math.cos(2 * Math.PI * phase01),
        pulmonaryArteryMl: 180,
        pulmonaryVeinMl: 650,
      },
      pressuresMmHg: {
        leftAtriumMmHg: la,
        leftVentricleMmHg: la - gradient[index]!,
        systemicArteryMmHg: 90,
        systemicVeinMmHg: 5,
        rightAtriumMmHg: 3,
        rightVentricleMmHg: 10 + 5 * phase01,
        pulmonaryArteryMmHg: 15,
        pulmonaryVeinMmHg: 9,
      },
      flowsMlPerSec: {
        mitralMlPerSec,
        pulmonaryVenousMlPerSec: 70 + 5 * phase01,
      },
      walls: {
        leftAtrium: wall,
      },
    } as unknown as NoAvpdFivePatchLandBenchSampleV1;
  });
}
