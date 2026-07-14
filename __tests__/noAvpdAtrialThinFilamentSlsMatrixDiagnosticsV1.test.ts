import { describe, expect, it } from "vitest";

import {
  noAvpdAtrialThinFilamentSlsCandidateV1,
  type NoAvpdAtrialThinFilamentSlsCandidateIdV1,
} from "@/engine/mechanics2/benches/NoAvpdAtrialThinFilamentSlsMatrixV1";
import {
  NO_AVPD_ATRIAL_THIN_FILAMENT_SLS_MATRIX_METRIC_IDS_V1,
  summarizeNoAvpdAtrialThinFilamentSlsMatrixDiagnosticsV1,
  type NoAvpdAtrialThinFilamentSlsCandidateDiagnosticsV1,
  type NoAvpdAtrialThinFilamentSlsMatrixMetricIdV1,
  type NoAvpdAtrialThinFilamentSlsMatrixMetricVectorV1,
} from "@/engine/mechanics2/diagnostics/NoAvpdAtrialThinFilamentSlsMatrixDiagnosticsV1";

describe("NoAvpdAtrialThinFilamentSlsMatrixDiagnosticsV1", () => {
  it("reports the predeclared 2x2 contrasts without ranking a candidate", () => {
    const metric = "matchedVolumeGapAreaMmHgMl" as const;
    const report = summarizeNoAvpdAtrialThinFilamentSlsMatrixDiagnosticsV1([
      candidate("ALG_SLS4", metricVector({ [metric]: 1 })),
      candidate("ALG_SLS8", metricVector({ [metric]: 3 })),
      candidate("LAG25_SLS4", metricVector({ [metric]: 4 })),
      candidate("LAG25_SLS8", metricVector({ [metric]: 10 })),
    ]);

    expect(report.factorContrasts[metric]).toEqual({
      availability: "available",
      slsEffectWithinAlgebraic: 2,
      slsEffectWithinLag25: 6,
      lag25EffectAtSls4: 3,
      lag25EffectAtSls8: 7,
      interaction: 4,
    });
    expect(report.eaTreatment.includedInFactorContrasts).toBe(false);
    expect(Object.keys(report.factorContrasts)).not.toContain("eToA");
    expect(report.decision).toMatchObject({
      winnerSelected: false,
      automaticPromotionAllowed: false,
      calibrationClaimed: false,
      physiologyAcceptanceApplied: false,
    });
  });

  it("marks a contrast unavailable when any arm lacks that metric", () => {
    const metric = "aLoopPrimaryCornerDeg" as const;
    const report = summarizeNoAvpdAtrialThinFilamentSlsMatrixDiagnosticsV1([
      candidate("ALG_SLS4", metricVector({ [metric]: 30 })),
      candidate("ALG_SLS8", metricVector({ [metric]: 35 })),
      candidate("LAG25_SLS4", metricVector({ [metric]: null })),
      candidate("LAG25_SLS8", metricVector({ [metric]: 40 })),
    ]);

    expect(report.factorContrasts[metric]).toEqual({
      availability: "unavailable-missing-candidate-metric",
      slsEffectWithinAlgebraic: null,
      slsEffectWithinLag25: null,
      lag25EffectAtSls4: null,
      lag25EffectAtSls8: null,
      interaction: null,
    });
  });
});

function candidate(
  candidateId: NoAvpdAtrialThinFilamentSlsCandidateIdV1,
  metricVectorValue: NoAvpdAtrialThinFilamentSlsMatrixMetricVectorV1,
) {
  return {
    spec: noAvpdAtrialThinFilamentSlsCandidateV1(candidateId),
    diagnostics: {
      structuralStatus: "pass",
      orbitReadback: {
        status: "ready-for-between-candidate-description",
      },
      metricVector: metricVectorValue,
    } as unknown as NoAvpdAtrialThinFilamentSlsCandidateDiagnosticsV1,
  };
}

function metricVector(
  overrides: Partial<
    Readonly<Record<NoAvpdAtrialThinFilamentSlsMatrixMetricIdV1, number | null>>
  >,
): NoAvpdAtrialThinFilamentSlsMatrixMetricVectorV1 {
  return Object.fromEntries(
    NO_AVPD_ATRIAL_THIN_FILAMENT_SLS_MATRIX_METRIC_IDS_V1.map((metricId) => [
      metricId,
      Object.prototype.hasOwnProperty.call(overrides, metricId)
        ? overrides[metricId]!
        : 0,
    ]),
  ) as NoAvpdAtrialThinFilamentSlsMatrixMetricVectorV1;
}
