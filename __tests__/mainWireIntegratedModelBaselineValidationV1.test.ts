import { describe, expect, it } from "vitest";

import {
  MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRELOAD_RESERVE_POLICY_V1,
  mainWireIntegratedModelFormalPreloadReserveDirectionalResponsePassedV1,
  type MainWireIntegratedModelFormalPreloadReserveDirectionalResponseV1,
} from "@/analysis/methods/mainWire/MainWirePressureVolumeProtocolsV3";
import {
  buildMainWireIntegratedModelBaselineValidationChecksV1,
  countMainWireIntegratedModelSignificantPressurePeaksV1,
  type MainWireIntegratedModelBaselineValidationMeasurementsV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelBaselineValidationV1";

const indexedCheckIds = Object.freeze([
  "left-ventricle.edv-index",
  "left-ventricle.esv-index",
  "left-ventricle.ejection-fraction",
  "right-ventricle.edv-index",
  "right-ventricle.esv-index",
  "right-ventricle.ejection-fraction",
  "systemic-forward-flow.cardiac-index",
  "systemic-forward-flow.stroke-volume-index",
] as const);

describe("Standard68 baseline mint gates", () => {
  it("admits a coherent normal indexed size/function reference", () => {
    const checks = buildMainWireIntegratedModelBaselineValidationChecksV1(
      normalMeasurementsV1(),
      true,
    );

    expect(checks).toHaveLength(22);
    expect(checks.every(({ status }) => status === "passed")).toBe(true);
    expect(
      checks.filter(({ checkId }) =>
        indexedCheckIds.includes(checkId as typeof indexedCheckIds[number]))
        .map(({ checkId }) => checkId),
    ).toEqual(indexedCheckIds);
  });

  it("fails closed on every out-of-range indexed size/function metric", () => {
    const normal = normalMeasurementsV1();
    const measurements = Object.freeze({
      ...normal,
      cardiacSizeAndFunction: Object.freeze({
        ...normal.cardiacSizeAndFunction,
        leftVentricle: Object.freeze({
          ...normal.cardiacSizeAndFunction.leftVentricle,
          endDiastolicVolumeIndexMlPerM2: 77,
          endSystolicVolumeIndexMlPerM2: 32,
          ejectionFraction01: 0.51,
        }),
        rightVentricle: Object.freeze({
          ...normal.cardiacSizeAndFunction.rightVentricle,
          endDiastolicVolumeIndexMlPerM2: 88,
          endSystolicVolumeIndexMlPerM2: 45,
          ejectionFraction01: 0.41,
        }),
        systemicForwardFlow: Object.freeze({
          ...normal.cardiacSizeAndFunction.systemicForwardFlow,
          cardiacIndexLPerMinPerM2: 2.49,
          strokeVolumeIndexMlPerM2: 34.9,
        }),
      }),
    });
    const failed = buildMainWireIntegratedModelBaselineValidationChecksV1(
      measurements,
      true,
    ).filter(({ status }) => status === "failed");

    expect(failed.map(({ checkId }) => checkId)).toEqual(indexedCheckIds);
  });

  it("requires flow, filling pressure, EDV, and ED transmural reserve in both directions", () => {
    const policy = MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRELOAD_RESERVE_POLICY_V1;
    const admitted = directionalResponseV1("hypervolemic");
    expect(
      mainWireIntegratedModelFormalPreloadReserveDirectionalResponsePassedV1(
        admitted,
      ),
    ).toBe(true);

    const failingMutations: readonly Partial<
      MainWireIntegratedModelFormalPreloadReserveDirectionalResponseV1
    >[] = [
      {
        directionalFillingPressureChangeMmHg:
          policy.minimumDirectionalFillingPressureChangeMmHg - 1e-3,
      },
      {
        directionalCardiacOutputChangeLPerMin:
          policy.minimumDirectionalCardiacOutputChangeLPerMin - 1e-3,
      },
      {
        directionalCardiacOutputChangeFraction01:
          policy.minimumDirectionalCardiacOutputChangeFraction01 - 1e-3,
      },
      {
        cardiacOutputSlopeLPerMinPerMmHg:
          policy.minimumCardiacOutputSlopeLPerMinPerMmHg - 1e-3,
      },
      {
        directionalEndDiastolicVolumeChangeMl:
          policy.minimumDirectionalEndDiastolicVolumeChangeMl - 1e-3,
      },
      {
        directionalEndDiastolicVolumeChangeFraction01:
          policy.minimumDirectionalEndDiastolicVolumeChangeFraction01 - 1e-3,
      },
      {
        directionalEndDiastolicTransmuralPressureChangeMmHg:
          policy.minimumDirectionalEndDiastolicTransmuralPressureChangeMmHg
          - 1e-3,
      },
      { endDiastolicVolumeResponseMlPerMmHg: 0 },
    ];
    for (const mutation of failingMutations) {
      expect(
        mainWireIntegratedModelFormalPreloadReserveDirectionalResponsePassedV1(
          Object.freeze({ ...admitted, ...mutation }),
        ),
      ).toBe(false);
    }

    expect(
      mainWireIntegratedModelFormalPreloadReserveDirectionalResponsePassedV1(
        directionalResponseV1("hypovolemic"),
      ),
    ).toBe(true);
  });

  it("counts a rippled broad summit as one peak but retains a true two-peak waveform", () => {
    expect(
      countMainWireIntegratedModelSignificantPressurePeaksV1(
        [0, 5, 9, 8.8, 9.1, 8.9, 8.8, 5, 0],
      ),
    ).toBe(1);
    expect(
      countMainWireIntegratedModelSignificantPressurePeaksV1(
        [0, 8, 4, 9, 0],
      ),
    ).toBe(2);
    expect(
      countMainWireIntegratedModelSignificantPressurePeaksV1(
        [0, 1, 2, 3],
      ),
    ).toBe(0);
  });
});

function normalMeasurementsV1():
  MainWireIntegratedModelBaselineValidationMeasurementsV1 {
  return Object.freeze({
    LVP: Object.freeze({
      forwardEpisodeCount: 1,
      significantPeakCount: 1,
      totalVariationRatio: 1.2,
      centralRangeFraction: 0.2,
      peakPhase01: 0.5,
    }),
    RVP: Object.freeze({
      forwardEpisodeCount: 1,
      significantPeakCount: 1,
      totalVariationRatio: 1.2,
      centralRangeFraction: 0.2,
      peakPhase01: 0.5,
    }),
    aorticValve: Object.freeze({
      ejectionTimeSec: 0.28,
      meanGradientMmHg: 3,
      peakGradientMmHg: 6,
    }),
    leftVentricle: Object.freeze({
      maximumDpDtMmHgPerSec: 1_800,
      minimumDpDtMmHgPerSec: -900,
    }),
    mitralFlow: Object.freeze({
      peakEMlPerSec: 300,
      peakAMlPerSec: 250,
      peakEToA: 1.2,
    }),
    timing: Object.freeze({
      ictSec: 0.04,
      irtSec: 0.08,
      teiIndex: 0.42857142857142855,
    }),
    cardiacSizeAndFunction: Object.freeze({
      bodySurfaceAreaM2: 1.9,
      leftVentricle: Object.freeze({
        endDiastolicVolumeMl: 114,
        endSystolicVolumeMl: 38,
        endDiastolicVolumeIndexMlPerM2: 60,
        endSystolicVolumeIndexMlPerM2: 20,
        ejectionFraction01: 2 / 3,
      }),
      rightVentricle: Object.freeze({
        endDiastolicVolumeMl: 133,
        endSystolicVolumeMl: 57,
        endDiastolicVolumeIndexMlPerM2: 70,
        endSystolicVolumeIndexMlPerM2: 30,
        ejectionFraction01: 76 / 133,
      }),
      systemicForwardFlow: Object.freeze({
        strokeVolumeMl: 76,
        strokeVolumeIndexMlPerM2: 40,
        cardiacOutputLPerMin: 5.7,
        cardiacIndexLPerMinPerM2: 3,
      }),
    }),
  });
}

function directionalResponseV1(
  endpointDirection: "hypovolemic" | "hypervolemic",
): MainWireIntegratedModelFormalPreloadReserveDirectionalResponseV1 {
  const sign = endpointDirection === "hypervolemic" ? 1 : -1;
  return Object.freeze({
    endpointDirection,
    baselineFillingPressureMmHg: 8,
    endpointFillingPressureMmHg: 8 + sign * 2,
    directionalFillingPressureChangeMmHg: 2,
    baselineCardiacOutputLPerMin: 5,
    endpointCardiacOutputLPerMin: 5 + sign * 0.25,
    directionalCardiacOutputChangeLPerMin: 0.25,
    directionalCardiacOutputChangeFraction01: 0.05,
    cardiacOutputSlopeLPerMinPerMmHg: 0.125,
    baselineEndDiastolicVolumeMl: 120,
    endpointEndDiastolicVolumeMl: 120 + sign * 8,
    directionalEndDiastolicVolumeChangeMl: 8,
    directionalEndDiastolicVolumeChangeFraction01: 8 / 120,
    baselineEndDiastolicTransmuralPressureMmHg: 10,
    endpointEndDiastolicTransmuralPressureMmHg: 10 + sign,
    directionalEndDiastolicTransmuralPressureChangeMmHg: 1,
    endDiastolicVolumeResponseMlPerMmHg: 8,
  });
}
