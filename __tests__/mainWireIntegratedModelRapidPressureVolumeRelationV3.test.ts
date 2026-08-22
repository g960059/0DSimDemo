import { describe, expect, it } from "vitest";

import type {
  MainWireIntegratedModelPressureVolumeLoopPointV3,
  MainWireIntegratedModelStarlingLocusV3,
  MainWireIntegratedModelStarlingPointV3,
} from "@/engine/myocardium/MainWireIntegratedModelGuytonStarlingOrientationV3";
import {
  buildMainWireIntegratedModelRapidPressureVolumeRelationV3,
} from "@/engine/myocardium/MainWireIntegratedModelRapidPressureVolumeRelationV3";

describe("rapid fixed-TBV pressure-volume relation V3", () => {
  it("fits a common support envelope to complete multi-load PV loops", () => {
    const points = [0.8, 0.9, 1, 1.1, 1.2].map((ratio, index) => {
      const contactVolumeMl = 45 + index * 7;
      const endDiastolicVolumeMl = 105 + index * 10;
      return starlingPointV3({
        ratio,
        role: ratio === 1 ? "operating-anchor" : "continuation",
        endSystolicVolumeMl: contactVolumeMl,
        endSystolicPressureMmHg: 2 * (contactVolumeMl - 20),
        endDiastolicVolumeMl,
        endDiastolicPressureMmHg:
          0.002 * Math.pow(endDiastolicVolumeMl - 60, 2.5),
      });
    });
    const relation = buildMainWireIntegratedModelRapidPressureVolumeRelationV3(
      responsiveLocusV3(points),
    );

    expect(relation.status).toBe("complete-preview");
    if (relation.status === "insufficient-data") {
      throw new Error(relation.reason);
    }
    expect(relation.sampledLoopCount).toBe(5);
    expect(relation.bilateralLoadCoverage).toBe(true);
    expect(relation.systolicEnvelope.method).toBe(
      "responsive-multi-load-pv-loop-support-envelope",
    );
    expect(relation.systolicEnvelope.elastanceMmHgPerMl).toBeCloseTo(2, 1);
    expect(
      relation.systolicEnvelope.extrapolatedVolumeAxisInterceptMl,
    ).toBeCloseTo(20, 0);
    expect(
      relation.systolicEnvelope.maximumInterLoopSupportGapMmHg,
    ).toBeLessThan(0.5);
    expect(relation.systolicEnvelope.maximumLoopPenetrationMmHg)
      .toBeLessThan(1e-8);
    expect(relation.maximumVolume.beta).toBeCloseTo(2.5, 1);
    expect(
      relation.maximumVolume.extrapolatedZeroPressureVolumeMl,
    ).toBeCloseTo(60, 0);
    expect(relation.systolicEnvelopeTrendCurve[0]).toEqual({
      volumeMl: expect.closeTo(20, 0),
      pressureMmHg: 0,
    });
    expect(relation.systolicEnvelopeLandmarks).toHaveLength(5);
    expect(relation.maximumVolumeLandmarks).toHaveLength(5);
  });

  it("never lets the fitted line cross any sampled load loop", () => {
    const points = [0.9, 1, 1.1].map((ratio, index) => {
      const contactVolumeMl = 52 + index * 9;
      return starlingPointV3({
        ratio,
        role: ratio === 1 ? "operating-anchor" : "continuation",
        endSystolicVolumeMl: 45 + index * 4,
        // Deliberately inconsistent closure landmarks: the fit must be loop-
        // owned rather than forced through the center closure point.
        endSystolicPressureMmHg: 45 + index * 7,
        supportContactVolumeMl: contactVolumeMl,
        supportContactPressureMmHg: 1.8 * (contactVolumeMl - 18),
        endDiastolicVolumeMl: 116 + index * 10,
        endDiastolicPressureMmHg: 6 + index * 3,
      });
    });
    const relation = buildMainWireIntegratedModelRapidPressureVolumeRelationV3(
      responsiveLocusV3(points),
    );
    if (relation.status === "insufficient-data") {
      throw new Error(relation.reason);
    }
    const slope = relation.systolicEnvelope.elastanceMmHgPerMl;
    const intercept = -slope *
      relation.systolicEnvelope.extrapolatedVolumeAxisInterceptMl;
    for (const point of points) {
      for (const sample of point.ventricularPressureVolumeLoop) {
        expect(slope * sample.volumeMl + intercept)
          .toBeGreaterThanOrEqual(sample.pressureMmHg - 1e-8);
      }
    }
    expect(relation.systolicEnvelope.maximumLoopPenetrationMmHg)
      .toBeLessThan(1e-8);
  });

  it("is provisional while a parallel preload direction is still running", () => {
    const points = [0.9, 1, 1.1].map((ratio, index) => starlingPointV3({
      ratio,
      role: ratio === 1 ? "operating-anchor" : "continuation",
      endSystolicVolumeMl: 50 + index * 5,
      endSystolicPressureMmHg: 70 + index * 10,
      endDiastolicVolumeMl: 110 + index * 8,
      endDiastolicPressureMmHg: 5 + index * 3,
    }));
    const relation = buildMainWireIntegratedModelRapidPressureVolumeRelationV3(
      responsiveLocusV3(points, points.length + 3),
    );

    expect(relation.status).toBe("collecting-preview");
  });

  it("keeps formal periodic loop envelopes distinct from responsive previews", () => {
    const points = [0.82, 0.9, 1, 1.1, 1.2].map((ratio, index) =>
      formalStarlingPointV3({
        ratio,
        role: ratio === 1 ? "operating-anchor" : "continuation",
        endSystolicVolumeMl: 46 + index * 7,
        endSystolicPressureMmHg: 2.1 * (46 + index * 7 - 18),
        endDiastolicVolumeMl: 104 + index * 9,
        endDiastolicPressureMmHg:
          0.0022 * Math.pow(104 + index * 9 - 58, 2.4),
      }));

    const relation = buildMainWireIntegratedModelRapidPressureVolumeRelationV3(
      formalLocusV3(points),
    );

    expect(relation).toMatchObject({
      status: "complete-formal",
      analysisMode: "formal-periodic",
      semantics:
        "periodic-fixed-tbv-multi-load-pv-loop-support-envelope-formal-analysis-not-clinical-validation",
    });
    if (relation.status === "insufficient-data") {
      throw new Error(relation.reason);
    }
    expect(relation.systolicEnvelope.method).toBe(
      "formal-periodic-multi-load-pv-loop-support-envelope",
    );
    expect(relation.systolicEnvelope.maximumLoopPenetrationMmHg)
      .toBeLessThan(1e-8);
  });

  it("excludes extreme hypovolemic loops from the local fit", () => {
    const local = [0.8, 0.9, 1, 1.1].map((ratio, index) => starlingPointV3({
      ratio,
      role: ratio === 1 ? "operating-anchor" : "continuation",
      endSystolicVolumeMl: 45 + index * 6,
      endSystolicPressureMmHg: 60 + index * 12,
      endDiastolicVolumeMl: 100 + index * 9,
      endDiastolicPressureMmHg: 4 + index * 2,
    }));
    const extreme = starlingPointV3({
      ratio: 0.4,
      role: "continuation",
      endSystolicVolumeMl: 5,
      endSystolicPressureMmHg: 500,
      endDiastolicVolumeMl: 10,
      endDiastolicPressureMmHg: 100,
    });
    const relation = buildMainWireIntegratedModelRapidPressureVolumeRelationV3(
      responsiveLocusV3([extreme, ...local]),
    );

    expect(relation.sampledPointCount).toBe(4);
    expect(relation.status).not.toBe("insufficient-data");
  });

  it("fails closed until complete loop coverage is bilateral", () => {
    const oneSided = [0.8, 0.9, 1].map((ratio, index) => starlingPointV3({
      ratio,
      role: ratio === 1 ? "operating-anchor" : "continuation",
      endSystolicVolumeMl: 45 + index * 6,
      endSystolicPressureMmHg: 60 + index * 12,
      endDiastolicVolumeMl: 100 + index * 9,
      endDiastolicPressureMmHg: 4 + index * 2,
    }));

    expect(buildMainWireIntegratedModelRapidPressureVolumeRelationV3(
      responsiveLocusV3(oneSided),
    )).toMatchObject({
      status: "insufficient-data",
      bilateralLoadCoverage: false,
    });
  });

  it("does not substitute a minimum-volume fallback for loop support", () => {
    const points = [0.9, 1, 1.1].map((ratio, index) => starlingPointV3({
      ratio,
      role: ratio === 1 ? "operating-anchor" : "continuation",
      endSystolicVolumeMl: 50 + index * 5,
      endSystolicPressureMmHg: 70 + index * 10,
      endDiastolicVolumeMl: 110 + index * 8,
      endDiastolicPressureMmHg: 5 + index * 3,
      endSystolicEvent: "minimum-volume-fallback",
    }));
    const relation = buildMainWireIntegratedModelRapidPressureVolumeRelationV3(
      responsiveLocusV3(points),
    );

    expect(relation.status).not.toBe("insufficient-data");
    if (relation.status !== "insufficient-data") {
      expect(relation.systolicEnvelopeLandmarks).toHaveLength(3);
      expect(relation.systolicEnvelopeLandmarks.every(({ event }) =>
        event === "pv-loop-support-contact")).toBe(true);
    }
  });
});

function responsiveLocusV3(
  points: readonly MainWireIntegratedModelStarlingPointV3[],
  totalPointCount = points.length,
): MainWireIntegratedModelStarlingLocusV3 {
  return Object.freeze({
    status: "responsive-fixed-tbv-preview" as const,
    protocolId: "protocol/test",
    warmupDurationSec: 0,
    measurementDurationSec: 36,
    minimumBeatCount: 3,
    maximumBeatCount: 20,
    slowControllerPolicy: "coronary-tone-frozen-at-branch-source" as const,
    completedPointCount: points.length,
    totalPointCount,
    points: Object.freeze(points),
  });
}

function formalLocusV3(
  points: readonly ReturnType<typeof formalStarlingPointV3>[],
): MainWireIntegratedModelStarlingLocusV3 {
  return Object.freeze({
    status: "measured-fixed-tbv-protocol" as const,
    protocolId: "protocol/formal-test",
    requirement:
      "persistent-fixed-tone-preload-reduction-chain-with-complete-beat-period1-settlement" as const,
    minimumBeatCount: 3,
    maximumBeatCount: 20,
    completedPointCount: points.length,
    totalPointCount: points.length,
    slowControllerPolicy: "coronary-tone-frozen-at-branch-source" as const,
    convergencePolicy: "complete-beat-output-period1-closure" as const,
    points: Object.freeze(points),
  });
}

function formalStarlingPointV3(
  input: Parameters<typeof starlingPointV3>[0],
) {
  return Object.freeze({
    ...starlingPointV3(input),
    quality: "locally-converged" as const,
    curveEligible: true as const,
    completedBeatCount: 8,
    settled: true as const,
    evidence: "fixed-tone-periodic" as const,
    measurementWindowStatus: "fixed-tone-period1-settled" as const,
  });
}

function starlingPointV3(input: Readonly<{
  ratio: number;
  role: MainWireIntegratedModelStarlingPointV3["role"];
  endSystolicVolumeMl: number;
  endSystolicPressureMmHg: number;
  endDiastolicVolumeMl: number;
  endDiastolicPressureMmHg: number;
  supportContactVolumeMl?: number;
  supportContactPressureMmHg?: number;
  endSystolicEvent?:
    | "semilunar-valve-closure"
    | "minimum-volume-fallback";
}>): MainWireIntegratedModelStarlingPointV3 {
  const settledAnchor = input.role === "operating-anchor";
  const contactVolumeMl = input.supportContactVolumeMl ??
    input.endSystolicVolumeMl;
  const contactPressureMmHg = input.supportContactPressureMmHg ??
    input.endSystolicPressureMmHg;
  return Object.freeze({
    totalBloodVolumeMl: 4_000 * input.ratio,
    fillingPressureMmHg: 8 + 10 * (input.ratio - 1),
    cardiacOutputLPerMin: 5.5,
    role: input.role,
    quality: "locally-converged" as const,
    curveEligible: true,
    completedBeatCount: 4,
    maximumNormalizedBeatDelta: 0.4,
    settled: settledAnchor,
    finiteAndFixedTbvPassed: true as const,
    evidence: settledAnchor
      ? ("responsive-settled-anchor" as const)
      : ("responsive-preview" as const),
    measurementWindowStatus: settledAnchor
      ? ("responsive-period1-settled" as const)
      : ("complete-beat-converged" as const),
    acceptedMeasurementDurationSec: 4,
    ventricularPressureVolumeLoop: syntheticPressureVolumeLoopV3({
      contactVolumeMl,
      contactPressureMmHg,
      endDiastolicVolumeMl: input.endDiastolicVolumeMl,
      endDiastolicPressureMmHg: input.endDiastolicPressureMmHg,
    }),
    ventricularPressureVolumeLandmarks: Object.freeze({
      pressureBasis: "transmural" as const,
      endSystolic: Object.freeze({
        volumeMl: input.endSystolicVolumeMl,
        pressureMmHg: input.endSystolicPressureMmHg,
        event: input.endSystolicEvent ?? "semilunar-valve-closure",
      }),
      endDiastolic: Object.freeze({
        volumeMl: input.endDiastolicVolumeMl,
        pressureMmHg: input.endDiastolicPressureMmHg,
        event: "maximum-volume" as const,
      }),
    }),
  });
}

function syntheticPressureVolumeLoopV3(input: Readonly<{
  contactVolumeMl: number;
  contactPressureMmHg: number;
  endDiastolicVolumeMl: number;
  endDiastolicPressureMmHg: number;
}>): readonly MainWireIntegratedModelPressureVolumeLoopPointV3[] {
  const points: MainWireIntegratedModelPressureVolumeLoopPointV3[] = [];
  for (let index = 0; index < 5; index += 1) {
    points.push(Object.freeze({
      volumeMl: input.endDiastolicVolumeMl,
      pressureMmHg: input.endDiastolicPressureMmHg + index *
        (input.contactPressureMmHg - input.endDiastolicPressureMmHg) / 6,
    }));
  }
  for (let index = 0; index <= 12; index += 1) {
    const fraction = index / 12;
    const volumeMl = input.endDiastolicVolumeMl - fraction *
      (input.endDiastolicVolumeMl - input.contactVolumeMl);
    const pressureMmHg = input.contactPressureMmHg +
      20 * Math.sin(Math.PI * fraction) * (1 - 0.25 * fraction);
    points.push(Object.freeze({ volumeMl, pressureMmHg }));
  }
  for (let index = 1; index <= 5; index += 1) {
    points.push(Object.freeze({
      volumeMl: input.contactVolumeMl,
      pressureMmHg: input.contactPressureMmHg * (1 - index / 6),
    }));
  }
  for (let index = 1; index <= 12; index += 1) {
    const fraction = index / 12;
    points.push(Object.freeze({
      volumeMl: input.contactVolumeMl + fraction *
        (input.endDiastolicVolumeMl - input.contactVolumeMl),
      pressureMmHg: input.endDiastolicPressureMmHg * Math.pow(fraction, 2.2),
    }));
  }
  return Object.freeze(points);
}
