import { describe, expect, it } from "vitest";

import { runNoAvpdFourChamberHillTriSegBenchV1 } from "@/engine/mechanics2/benches/NoAvpdFourChamberHillTriSegBenchV1";
import { buildNoAvpdPhysiologyMatrixParamsV1 } from "@/engine/mechanics2/benches/NoAvpdPhysiologyMatrixBenchV1";
import {
  NO_AVPD_PHYSIOLOGY_MATRIX_TRACE_COLUMNS_V1,
  summarizeNoAvpdPhysiologyMatrixDiagnosticsV1,
} from "@/engine/mechanics2/diagnostics/NoAvpdPhysiologyMatrixDiagnosticsV1";

describe("NoAvpdPhysiologyMatrixDiagnosticsV1", () => {
  it("extracts raw event, matched-volume, and LV-relaxation readbacks", () => {
    const report = runNoAvpdFourChamberHillTriSegBenchV1({
      beats: 3,
      dtSec: 0.005,
      sampleEverySteps: 1,
      sampleRetention: "last-two-complete-beats",
      params: buildNoAvpdPhysiologyMatrixParamsV1("lv-ca-decay-155ms-baseline"),
    });
    const diagnostics = summarizeNoAvpdPhysiologyMatrixDiagnosticsV1(report);
    expect(report.status).toBe("pass");
    expect(diagnostics.availability).toBe("available");
    expect(diagnostics.compactRawAnchorCycle).toHaveLength(201);
    expect(diagnostics.compactRawAnchorCycle[0]).toHaveLength(
      NO_AVPD_PHYSIOLOGY_MATRIX_TRACE_COLUMNS_V1.length,
    );
    expect(diagnostics.compactRawAnchorCycle[0]![0]).toBe(0);
    expect(diagnostics.compactRawAnchorCycle.at(-1)![0]).toBe(1);
    expect(NO_AVPD_PHYSIOLOGY_MATRIX_TRACE_COLUMNS_V1).toEqual(
      expect.arrayContaining([
        "leftAtriumSeriesTensionKPa",
        "leftAtriumThinFilament01",
        "leftAtriumForceVelocityFactor",
        "leftAtriumLengthFactor",
      ]),
    );
    expect(diagnostics.eaSeparation?.valleyOverE).toBeGreaterThan(0);
    expect(diagnostics.eaSeparation?.valleyOverE).toBeLessThan(1);
    expect(diagnostics.matchedVolume?.targetCount).toBe(41);
    expect(diagnostics.matchedVolume?.validTargetCount).toBeGreaterThan(35);
    expect(diagnostics.matchedVolume?.gapDefinition).toBe(
      "reservoir-minus-conduit",
    );
    const pumping = diagnostics.pumpingMorphology!;
    expect(pumping.evidenceStatus).toContain("report-only");
    expect(pumping.crossesCycleBoundary).toBe(true);
    expect(pumping.localExtrema.slice(0, 3).map((point) => point.type)).toEqual(
      ["maximum", "minimum", "maximum"],
    );
    expect(pumping.primaryPeak?.phase01).toBeCloseTo(0.825, 10);
    expect(pumping.interveningTrough?.phase01).toBeCloseTo(0.865, 10);
    expect(pumping.latePeak?.phase01).toBeGreaterThan(0.9);
    expect(pumping.latePeak?.phase01).toBeLessThan(1);
    expect(pumping.lateRebound.amplitudeMmHg).toBeGreaterThan(0);
    expect(pumping.lateRebound.durationSec).toBeGreaterThan(0);
    expect(pumping.boundaryCensoring.sequenceIncomplete).toBe(false);
    for (const extremum of pumping.localExtrema) {
      const component = extremum.componentReadback.pressureContributionMmHg;
      expect(
        component.passive + component.seriesTension + component.sls,
      ).toBeCloseTo(extremum.pressureMmHg, 10);
      expect(extremum.componentReadback.forceVelocityFactor).toBeGreaterThan(0);
      expect(extremum.componentReadback.lengthFactor).toBeGreaterThan(0);
    }
    const decomposition = diagnostics.matchedVolume!.componentDecomposition;
    expect(decomposition.availability).toBe("available");
    expect(decomposition.evidenceStatus).toContain("report-only");
    expect(decomposition.trace).toHaveLength(
      diagnostics.matchedVolume!.validTargetCount,
    );
    expect(decomposition.summary!.seriesTension.meanMmHg).toBeGreaterThan(
      decomposition.summary!.sls.meanMmHg,
    );
    expect(Math.abs(decomposition.summary!.passive.meanMmHg)).toBeLessThan(
      1e-3,
    );
    expect(decomposition.summary!.total.integratedMmHgMl).toBeCloseTo(
      diagnostics.matchedVolume!.integratedGapMmHgMl!,
      10,
    );
    expect(
      decomposition.reconstructionResidual!.maximumAbsoluteMmHg,
    ).toBeLessThan(2e-4);
    expect(
      diagnostics.lvRelaxation?.zeroAsymptoteFit.pointCount,
    ).toBeGreaterThan(3);
    expect(diagnostics.lvRelaxation?.zeroAsymptoteFit.tauSec).toBeGreaterThan(
      0,
    );
    expect(
      diagnostics.lvRelaxation?.freeAsymptoteFit.pointCount,
    ).toBeGreaterThan(3);
    expect(diagnostics.lvRelaxation?.pressureFall90To10Sec).toBeGreaterThan(0);
    expect(
      diagnostics.lvRelaxation?.earlyFillingPressureGradient.mvoToEPeakSec,
    ).toBeGreaterThan(0);
    expect(
      diagnostics.lvRelaxation?.earlyFillingPressureGradient
        .firstPostEPositiveToNegativeCrossoverPhase01,
    ).toBeNull();
    const effectiveHead =
      diagnostics.lvRelaxation!.earlyFillingPressureGradient;
    expect(
      effectiveHead.maximumPositiveValveAccelerationHeadMmHg,
    ).toBeGreaterThan(0);
    expect(
      effectiveHead.negativeAccelerationHeadAreaEToValleyMmHgSec,
    ).toBeGreaterThanOrEqual(0);
    if (effectiveHead.firstPostEAccelerationHeadCrossoverPhase01 !== null) {
      expect(
        effectiveHead.firstPostEAccelerationHeadCrossoverPhase01,
      ).toBeGreaterThan(0);
    }
    expect(
      diagnostics.lvRelaxation?.earlyFillingPressureGradient
        .reverseGradientAreaEToValleyMmHgSec,
    ).toBe(0);
    expect(diagnostics.dynamicFillingBoundary).toContain("not-edpvr");
    expect(diagnostics.lvRelaxationFitBoundary).toContain("not-clinical-tau");
  });

  it("keeps unavailable metrics separate from structural status", () => {
    const report = runNoAvpdFourChamberHillTriSegBenchV1({
      beats: 1,
      dtSec: 0.005,
      sampleEverySteps: 2,
      sampleRetention: "all",
      params: buildNoAvpdPhysiologyMatrixParamsV1("lv-ca-decay-155ms-baseline"),
    });
    const diagnostics = summarizeNoAvpdPhysiologyMatrixDiagnosticsV1(report);
    expect(report.status).toBe("pass");
    expect(diagnostics.availability).not.toBe("available");
    expect(diagnostics.eaSeparation).toBeNull();
    expect(diagnostics.pumpingMorphology).toBeNull();
    expect(diagnostics.compactRawAnchorCycle).toEqual([]);
    expect(diagnostics.changesStructuralStatus).toBe(false);
  });
});
