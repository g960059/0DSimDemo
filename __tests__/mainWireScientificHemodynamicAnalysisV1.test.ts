import { describe, expect, it } from "vitest";

import {
  analyzeMainWireScientificLvPressureVolumeProtocolV1,
  buildMainWireScientificPreloadOperatingLocusV1,
  type MainWireScientificHemodynamicMeasurementV1,
  type MainWireScientificHemodynamicOperatingPointV1,
} from "@/engine/scientific/protocols/MainWireScientificHemodynamicAnalysisV1";

const TBV_ML = 5_500;
const VREF_ML = 50;
const P0_MMHG = 0;
const EES = 2;
const V0_ML = 20;
const EDPVR_ALPHA_MMHG = 2;
const EDPVR_BETA_PER_ML = 0.03;
const PRSW_SLOPE_MMHG = 5;
const PRSW_V0_ML = 40;

describe("main-wire scientific hemodynamic analysis V1", () => {
  it("labels a TBV family as a one-dimensional preload locus and preserves both P2 branches", () => {
    const p1 = operatingPoint("locus-baseline", 0, "tbv-preload-operating-locus");
    const p2: MainWireScientificHemodynamicOperatingPointV1 = {
      pointId: "locus-low-p2",
      protocolKind: "tbv-preload-operating-locus",
      role: "operating-locus",
      totalBloodVolumeMl: TBV_ML - 1_000,
      periodicity: "P2",
      branches: [
        { branchId: "strong", measurement: measurement(0, 10) },
        { branchId: "weak", measurement: measurement(0, -10) },
      ],
    };

    const result = buildMainWireScientificPreloadOperatingLocusV1([p1, p2]);

    expect(result.physiologyLabel).toBe("closed-loop-TBV-preload-operating-locus");
    expect(result.claimBoundary).toEqual({
      independentVariable: "total-blood-volume",
      dimensionality: "one-dimensional-locus",
      isPumpClampedGuytonVenousReturnCurve: false,
      isTwoDimensionalSurface: false,
      isIntrinsicEspvrOrEdpvr: false,
    });
    expect(result.p1Points).toHaveLength(1);
    expect(result.period2Points).toHaveLength(1);
    expect(result.period2Points[0]).toMatchObject({
      fitPolicy: "excluded-never-averaged",
      branches: [
        { branchId: "strong", measurement: { cardiacOutputLPerMin: 15.3 } },
        { branchId: "weak", measurement: { cardiacOutputLPerMin: -4.7 } },
      ],
    });
  });

  it("recovers free-V0 linear ESPVR, fixed-reference exponential EDPVR, and PRSW", () => {
    const points = validProtocolPoints();

    const result = analyzeMainWireScientificLvPressureVolumeProtocolV1({
      points,
      edpvrReference: {
        referenceVolumeMl: VREF_ML,
        referencePressureMmHg: P0_MMHG,
      },
    });

    expect(result.overallStatus).toBe("accepted");
    expect(result.includedFitEligiblePointIds).toHaveLength(7);
    expect(result.espvr.fit).not.toBeNull();
    expect(result.espvr.fit!.endSystolicElastanceMmHgPerMl).toBeCloseTo(EES, 10);
    expect(result.espvr.fit!.volumeAxisInterceptMl).toBeCloseTo(V0_ML, 10);
    expect(result.espvr.fit!.diagnostics.adjustedR2).toBeCloseTo(1, 12);
    expect(result.quadraticEspvrSensitivity).toMatchObject({ nonlinear: false });

    expect(result.edpvr.fit).not.toBeNull();
    expect(result.edpvr.fit!.alphaMmHg).toBeCloseTo(EDPVR_ALPHA_MMHG, 5);
    expect(result.edpvr.fit!.betaPerMl).toBeCloseTo(EDPVR_BETA_PER_ML, 7);
    expect(result.edpvr.fit!.diagnostics.rmse).toBeLessThan(1e-7);

    expect(result.prsw.fit).not.toBeNull();
    expect(result.prsw.fit!.preloadRecruitableStrokeWorkSlopeMmHg).toBeCloseTo(
      PRSW_SLOPE_MMHG,
      10,
    );
    expect(result.prsw.fit!.volumeAxisInterceptMl).toBeCloseTo(PRSW_V0_ML, 10);
    expect(result.physiologyBoundary).toMatchObject({
      pressures: "transmural",
      tbvFamilyMaySubstituteForThisProtocol: false,
      period2AveragingPermitted: false,
    });
  });

  it("never averages P2 branches into a fit and rejects the protocol when alternans occurs", () => {
    const p2: MainWireScientificHemodynamicOperatingPointV1 = {
      pointId: "p2-outlier",
      protocolKind: "fixed-tbv-ivc-like-preload-reduction",
      role: "preload-reduction",
      totalBloodVolumeMl: TBV_ML,
      periodicity: "P2",
      branches: [
        { branchId: "strong", measurement: measurement(0, 10_000) },
        { branchId: "weak", measurement: measurement(0, -10_000) },
      ],
    };

    const result = analyzeMainWireScientificLvPressureVolumeProtocolV1({
      points: [...validProtocolPoints(), p2],
      edpvrReference: {
        referenceVolumeMl: VREF_ML,
        referencePressureMmHg: P0_MMHG,
      },
    });

    expect(result.includedFitEligiblePointIds).not.toContain("p2-outlier");
    expect(result.espvr.fit!.endSystolicElastanceMmHgPerMl).toBeCloseTo(EES, 10);
    expect(result.espvr.fit!.volumeAxisInterceptMl).toBeCloseTo(V0_ML, 10);
    expect(result.espvr.status).toBe("rejected");
    expect(result.espvr.rejectReasons.map(({ code }) => code)).toContain(
      "period-2-detected-protocol-rejected",
    );
    expect(result.exclusions).toEqual(expect.arrayContaining([
      expect.objectContaining({
        code: "period-2-excluded-never-averaged",
        pointIds: ["p2-outlier"],
      }),
    ]));
  });

  it("does not relabel a changing-load beat as a demonstrated P1 orbit", () => {
    const source = validProtocolPoints()[0]!;
    if (source.periodicity !== "transient-fit-eligible") {
      throw new Error("fixture invariant");
    }
    const wronglyPeriodic: MainWireScientificHemodynamicOperatingPointV1 = {
      ...source,
      periodicity: "P1",
    };
    const result = analyzeMainWireScientificLvPressureVolumeProtocolV1({
      points: [wronglyPeriodic, ...validProtocolPoints().slice(1)],
      edpvrReference: {
        referenceVolumeMl: VREF_ML,
        referencePressureMmHg: P0_MMHG,
      },
    });

    expect(result.overallStatus).toBe("rejected");
    expect(result.includedFitEligiblePointIds).not.toContain(
      wronglyPeriodic.pointId,
    );
    expect(result.exclusions.map(({ code }) => code)).toContain(
      "transient-classification-mismatch",
    );
    expect(result.espvr.rejectReasons.map(({ code }) => code)).toContain(
      "baseline-fit-eligible-missing",
    );
  });

  it("flags quadratic ESPVR sensitivity and reports explicit numeric QC failures", () => {
    const points = validProtocolPoints().map((point) => {
      if (point.periodicity !== "transient-fit-eligible" || point.measurement.lvPressureVolume === null) return point;
      const pv = point.measurement.lvPressureVolume;
      const nonlinearPressure =
        0.03 * pv.endSystolicVolumeMl ** 2
        - 0.5 * pv.endSystolicVolumeMl
        + 20;
      return {
        ...point,
        measurement: {
          ...point.measurement,
          lvPressureVolume: {
            ...pv,
            endSystolicTransmuralPressureMmHg: nonlinearPressure,
          },
        },
      } satisfies MainWireScientificHemodynamicOperatingPointV1;
    });

    const result = analyzeMainWireScientificLvPressureVolumeProtocolV1({
      points,
      edpvrReference: {
        referenceVolumeMl: VREF_ML,
        referencePressureMmHg: P0_MMHG,
      },
    });

    expect(result.quadraticEspvrSensitivity?.nonlinear).toBe(true);
    expect(result.quadraticEspvrSensitivity?.diagnostics.rmse).toBeLessThan(1e-8);
    expect(result.espvr.rejectReasons.map(({ code }) => code)).toContain(
      "espvr-nonlinearity-detected",
    );
    expect(result.overallStatus).toBe("rejected");
  });

  it("rejects a numerically clean but physiologically under-excited loading range", () => {
    const points = [0, 1, 2, 3, 4, 5].map((index) => {
      const point = operatingPoint(
        `under-excited-${index}`,
        index,
        "fixed-tbv-ivc-like-preload-reduction",
      );
      if (point.periodicity !== "transient-fit-eligible") throw new Error("fixture invariant");
      const edv = 120 - index * 0.2;
      const esv = 70 - index * 0.1;
      return {
        ...point,
        measurement: {
          ...point.measurement,
          lvPressureVolume: {
            endDiastolicVolumeMl: edv,
            endDiastolicTransmuralPressureMmHg:
              P0_MMHG
              + EDPVR_ALPHA_MMHG * Math.expm1(EDPVR_BETA_PER_ML * (edv - VREF_ML)),
            endSystolicVolumeMl: esv,
            endSystolicTransmuralPressureMmHg: EES * (esv - V0_ML),
            strokeWorkMmHgMl: PRSW_SLOPE_MMHG * (edv - PRSW_V0_ML),
          },
        },
      } satisfies MainWireScientificHemodynamicOperatingPointV1;
    });

    const result = analyzeMainWireScientificLvPressureVolumeProtocolV1({
      points,
      edpvrReference: {
        referenceVolumeMl: VREF_ML,
        referencePressureMmHg: P0_MMHG,
      },
    });

    expect(result.espvr.rejectReasons.map(({ code }) => code)).toContain(
      "insufficient-edv-span",
    );
    expect(result.edpvr.rejectReasons.map(({ code }) => code)).toContain(
      "edpvr-pressure-span-below-threshold",
    );
    expect(result.overallStatus).toBe("rejected");
  });

  it("rejects missing baseline, inadequate range, invalid events, mass error, and failure points", () => {
    const narrow = [0, 1, 2, 3, 4, 5].map((index) => {
      const point = operatingPoint(`narrow-${index}`, index, "fixed-tbv-ivc-like-preload-reduction");
      if (point.periodicity !== "transient-fit-eligible") throw new Error("fixture invariant");
      const pv = point.measurement.lvPressureVolume!;
      return {
        ...point,
        role: "preload-reduction" as const,
        measurement: {
          ...point.measurement,
          lvPressureVolume: {
            ...pv,
            endDiastolicVolumeMl: 120 - index * 0.2,
          },
          quality: index === 1
            ? { ...point.measurement.quality, lvEventStatus: "missing-end-systolic-event" as const }
            : index === 2
              ? { ...point.measurement.quality, totalBloodVolumeAbsoluteErrorMl: 1 }
              : point.measurement.quality,
        },
      } satisfies MainWireScientificHemodynamicOperatingPointV1;
    });
    const failure: MainWireScientificHemodynamicOperatingPointV1 = {
      pointId: "failed-load",
      protocolKind: "fixed-tbv-ivc-like-preload-reduction",
      role: "preload-reduction",
      totalBloodVolumeMl: TBV_ML,
      periodicity: "failure",
      failureReason: "Newton did not converge",
    };

    const result = analyzeMainWireScientificLvPressureVolumeProtocolV1({
      points: [...narrow, failure],
      edpvrReference: {
        referenceVolumeMl: VREF_ML,
        referencePressureMmHg: P0_MMHG,
      },
    });
    const allCodes = [
      ...result.exclusions,
      ...result.espvr.rejectReasons,
      ...result.edpvr.rejectReasons,
      ...result.prsw.rejectReasons,
    ].map(({ code }) => code);

    expect(allCodes).toEqual(expect.arrayContaining([
      "lv-event-invalid",
      "total-blood-volume-error-above-threshold",
      "solver-failure-excluded",
      "solver-failure-detected-protocol-rejected",
      "baseline-fit-eligible-missing",
      "insufficient-fit-eligible-points",
    ]));
    expect(result.overallStatus).toBe("rejected");
  });
});

function validProtocolPoints(): MainWireScientificHemodynamicOperatingPointV1[] {
  return [0, 1, 2, 3, 4, 5, 6].map((index) =>
    operatingPoint(`load-${index}`, index, "fixed-tbv-ivc-like-preload-reduction"));
}

function operatingPoint(
  pointId: string,
  index: number,
  protocolKind: MainWireScientificHemodynamicOperatingPointV1["protocolKind"],
): MainWireScientificHemodynamicOperatingPointV1 {
  return {
    pointId,
    protocolKind,
    role: index === 0 ? "baseline" : protocolKind === "tbv-preload-operating-locus"
      ? "operating-locus"
      : "preload-reduction",
    totalBloodVolumeMl: protocolKind === "tbv-preload-operating-locus"
      ? TBV_ML - index * 100
      : TBV_ML,
    periodicity: protocolKind === "tbv-preload-operating-locus"
      ? "P1"
      : "transient-fit-eligible",
    measurement: measurement(index, 0),
  };
}

function measurement(
  index: number,
  cardiacOutputOffset: number,
): MainWireScientificHemodynamicMeasurementV1 {
  const edv = 120 - index * 5;
  const esv = 70 - index * 2.5;
  return {
    meanRightAtrialTransmuralPressureMmHg: 5 - index * 0.4,
    meanLeftAtrialTransmuralPressureMmHg: 10 - index * 0.5,
    cardiacOutputLPerMin: 5.3 - index * 0.15 + cardiacOutputOffset,
    lvPressureVolume: {
      endDiastolicVolumeMl: edv,
      endDiastolicTransmuralPressureMmHg:
        P0_MMHG + EDPVR_ALPHA_MMHG * Math.expm1(EDPVR_BETA_PER_ML * (edv - VREF_ML)),
      endSystolicVolumeMl: esv,
      endSystolicTransmuralPressureMmHg: EES * (esv - V0_ML),
      strokeWorkMmHgMl: PRSW_SLOPE_MMHG * (edv - PRSW_V0_ML),
    },
    quality: {
      lvEventStatus: "complete",
      totalBloodVolumeAbsoluteErrorMl: 1e-8,
      maximumContinuityAbsoluteResidualMl: 1e-8,
    },
  };
}
