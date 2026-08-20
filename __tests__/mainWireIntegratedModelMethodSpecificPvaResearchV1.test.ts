import { describe, expect, it } from "vitest";

import {
  analyzeMainWireIntegratedModelMethodSpecificPvaResearchV1,
  integrateMainWireIntegratedModelClosedPvPathWorkV1,
  integrateMainWireIntegratedModelPotentialEnergyV1,
  type MainWireIntegratedModelPvaDiastolicReferenceV1,
  type MainWireIntegratedModelPvaLinearRelationV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelMethodSpecificPvaResearchV1";
import type { MainWireIntegratedModelTransientPvRawBeatV1 } from "@/engine/myocardium/experiments/MainWireIntegratedModelTransientVenousReturnReductionPureV1";

describe("method-specific PVA research V1", () => {
  it("computes four systolic-method families without promoting a generic PVA", () => {
    const result = analyzeMainWireIntegratedModelMethodSpecificPvaResearchV1(
      manufacturedBeatFamilyV1(),
    );

    expect(result.status).toBe("completed");
    expect(result.systolicRelations).toHaveLength(16);
    expect(
      result.systolicRelations.every(({ status }) => status === "available"),
    ).toBe(true);
    expect(result.diastolicReferences).toHaveLength(4);
    expect(
      result.diastolicReferences.every(({ status }) => status === "available"),
    ).toBe(true);
    expect(result.pvaRows).toHaveLength(168);
    expect(result.summary.availableRowCount).toBeGreaterThan(0);
    expect(
      result.summary.availableRowCount + result.summary.unavailableRowCount,
    ).toBe(168);
    expect(result.interpretation).toEqual({
      genericPvaEstablished: false,
      espvrEstablished: false,
      edpvrEstablished: false,
      periodicOrbitPerTransientBeatEstablished: false,
      oxygenConsumptionEstablished: false,
    });
    for (const row of result.pvaRows) {
      if (row.status !== "available") continue;
      expect(row.pressureVolumeAreaMmHgMl).toBe(
        row.externalWorkMmHgMl + row.potentialEnergyMmHgMl,
      );
      expect(Number.isFinite(row.pressureVolumeAreaJ)).toBe(true);
    }
  });

  it("keeps closure unavailable on one beat while other methods and the closure fit survive", () => {
    const result = analyzeMainWireIntegratedModelMethodSpecificPvaResearchV1(
      manufacturedBeatFamilyV1({ missingLvClosureBeatOrdinal: 1 }),
    );
    const closureFit = result.systolicRelations.find(
      (relation) =>
        relation.ventricleId === "LV" &&
        relation.directionId === "occlusion" &&
        relation.methodId === "semilunar-closure",
    );
    expect(closureFit).toMatchObject({
      status: "available",
      pointCount: 10,
      unavailablePointCount: 1,
    });
    expect(
      result.pvaRows.find(
        (row) =>
          row.ventricleId === "LV" &&
          row.beatOrdinal === 1 &&
          row.systolicMethodId === "semilunar-closure",
      ),
    ).toMatchObject({
      status: "unavailable",
      reason: "beat-specific systolic landmark is unavailable",
    });
    for (const methodId of [
      "baseline-anchored-isochronal",
      "minimum-volume",
      "sampled-common-support-envelope",
    ] as const) {
      expect(
        result.pvaRows.find(
          (row) =>
            row.ventricleId === "LV" &&
            row.beatOrdinal === 1 &&
            row.systolicMethodId === methodId,
        )?.status,
      ).not.toBe("unavailable");
    }
  });

  it("integrates a known line-minus-power potential-energy region", () => {
    const systolic = Object.freeze({
      slopeMmHgPerMl: 10,
      interceptMmHg: -100,
      volumeAxisInterceptMl: 10,
      measuredVolumeRangeMl: Object.freeze([10, 12] as const),
      residualSumOfSquaresMmHgSquared: 0,
      rSquared: 1,
    }) satisfies MainWireIntegratedModelPvaLinearRelationV1;
    const diastolic = Object.freeze({
      method: "dynamic-maximum-volume-positive-pressure-offset-power" as const,
      pointCount: 3,
      alphaMmHgPerMlPower: 1,
      beta: 2,
      volumeOffsetMl: 10,
      measuredVolumeRangeMl: Object.freeze([10, 12] as const),
      rSquared: 1,
    }) satisfies MainWireIntegratedModelPvaDiastolicReferenceV1;
    const result = integrateMainWireIntegratedModelPotentialEnergyV1(
      systolic,
      diastolic,
      12,
    );

    expect(result.status).toBe("available");
    if (result.status !== "available") return;
    expect(result.intersectionVolumeMl).toBe(10);
    expect(result.potentialEnergyMmHgMl).toBeCloseTo(20 - 8 / 3, 12);
  });

  it("computes positive work for a counter-clockwise rectangle", () => {
    const result = integrateMainWireIntegratedModelClosedPvPathWorkV1([
      { volumeMl: 100, pressureMmHg: 0 },
      { volumeMl: 100, pressureMmHg: 10 },
      { volumeMl: 50, pressureMmHg: 10 },
      { volumeMl: 50, pressureMmHg: 0 },
      { volumeMl: 100, pressureMmHg: 0 },
    ]);
    expect(result.acceptedOpenPathMmHgMl).toBe(500);
    expect(result.straightClosureSegmentMmHgMl).toBe(0);
    expect(result.closedLoopMmHgMl).toBe(500);
  });

  it("rejects an incomplete transient family", () => {
    expect(() =>
      analyzeMainWireIntegratedModelMethodSpecificPvaResearchV1(
        manufacturedBeatFamilyV1().slice(0, 20),
      ),
    ).toThrow("exactly 21 beats");
  });
});

function manufacturedBeatFamilyV1(
  options: Readonly<{ missingLvClosureBeatOrdinal?: number }> = {},
): readonly MainWireIntegratedModelTransientPvRawBeatV1[] {
  return Object.freeze(
    Array.from({ length: 21 }, (_, beatIndex) => {
      const beatOrdinal = beatIndex + 1;
      const load =
        beatOrdinal <= 11 ? (beatOrdinal - 1) / 10 : (21 - beatOrdinal) / 10;
      const startTimeSec = beatIndex;
      const samples = Object.freeze(
        Array.from({ length: 129 }, (_, sampleIndex) => {
          const phase = sampleIndex / 128;
          return Object.freeze({
            timeSec: startTimeSec + phase,
            LV: manufacturedVentricleV1(
              "LV",
              phase,
              load,
              options.missingLvClosureBeatOrdinal === beatOrdinal,
            ),
            RV: manufacturedVentricleV1("RV", phase, load, false),
          });
        }),
      );
      return Object.freeze({
        beatOrdinal,
        startTimeSec,
        endTimeSec: startTimeSec + 1,
        samples,
      });
    }),
  );
}

function manufacturedVentricleV1(
  ventricleId: "LV" | "RV",
  phase: number,
  load: number,
  missingClosure: boolean,
) {
  const scale = ventricleId === "LV" ? 1 : 0.42;
  const endDiastolicVolumeMl = scale * (145 - 24 * load);
  const endSystolicVolumeMl = scale * (72 - 14 * load);
  const center = (endDiastolicVolumeMl + endSystolicVolumeMl) / 2;
  const amplitude = (endDiastolicVolumeMl - endSystolicVolumeMl) / 2;
  const volumeMl = center + amplitude * Math.cos(2 * Math.PI * phase);
  const passivePressureMmHg =
    (ventricleId === "LV" ? 0.0025 : 0.006) *
    Math.max(0, volumeMl - scale * 70) ** 2;
  const activePressureMmHg =
    scale * (105 - 42 * load) * Math.sin(Math.PI * phase) ** 2;
  const transmuralPressureMmHg = passivePressureMmHg + activePressureMmHg;
  const semilunarFlowMlPerSec = missingClosure
    ? 1
    : 60 * scale * Math.sin(2 * Math.PI * (phase - 0.1));
  return Object.freeze({
    volumeMl,
    transmuralPressureMmHg,
    absolutePressureMmHg: transmuralPressureMmHg + 3,
    semilunarFlowMlPerSec,
  });
}
