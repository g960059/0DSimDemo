import { describe, expect, it } from "vitest";

import {
  MAIN_WIRE_AORTIC_VALVE_EXACT_DENSITY_VELOCITY_SQUARED_COEFFICIENT_MMHG_SEC2_PER_M2_V1,
  MAIN_WIRE_AORTIC_VALVE_LVOT_KINETIC_CORRECTION_PROFILE_IDS_V1,
  MAIN_WIRE_AORTIC_VALVE_LVOT_KINETIC_CORRECTION_PROFILES_V1,
  MAIN_WIRE_AORTIC_VALVE_LVOT_KINETIC_CORRECTION_PROVENANCE_V1,
  analyzeMainWireAorticValveLvotKineticCorrectionV1,
  type MainWireAorticValveLvotKineticCorrectionProfileIdV1,
  type MainWireAorticValveLvotKineticCorrectionSampleInputV1,
} from "@/analysis/methods/mainWire/MainWireAorticValveLvotKineticCorrectionV1";
import {
  MAIN_WIRE_VALVE_BLOOD_DENSITY_KG_PER_M3_V2,
  MAIN_WIRE_VALVE_PA_PER_MMHG_V2,
  idealBernoulliLossFromEffectiveOrificeAreaV2,
} from "@/engine/valves/MainWireQuasiSteadyOrificeValveV2";

const MAXIMUM_OPENING_EOA_CM2 = 3.5;
const COMMON_SAMPLE = Object.freeze({
  acceptedTimeSec: 1,
  episodeIntegrationWeightSec: 0.001,
  forwardFlowMlPerSec: 500,
  activeEoaCm2: MAXIMUM_OPENING_EOA_CM2,
});

describe("main-wire algebraic LVOT kinetic correction V1", () => {
  it("owns exactly the three prespecified diameter-derived LVOT profiles", () => {
    expect(
      MAIN_WIRE_AORTIC_VALVE_LVOT_KINETIC_CORRECTION_PROFILE_IDS_V1,
    ).toEqual(["lvot-d2p2cm", "lvot-d2p3cm", "lvot-d2p5cm"]);

    const expected = [
      ["lvot-d2p2cm", 2.2, 0.152],
      ["lvot-d2p3cm", 2.3, 0.29],
      ["lvot-d2p5cm", 2.5, 0.492],
    ] as const;
    for (const [
      profileId,
      diameterCm,
      approximateRetainedFraction,
    ] of expected) {
      const profile =
        MAIN_WIRE_AORTIC_VALVE_LVOT_KINETIC_CORRECTION_PROFILES_V1[profileId];
      expect(profile.lvotAreaCm2).toBeCloseTo(
        Math.PI * (diameterCm / 2) ** 2,
        15,
      );
      const result = analyze(profileId, [COMMON_SAMPLE]);
      const retained = 1 - (MAXIMUM_OPENING_EOA_CM2 / profile.lvotAreaCm2) ** 2;
      expect(
        result.points[0]!.retainedCorrectedFractionOfSimplified01,
      ).toBeCloseTo(retained, 14);
      expect(retained).toBeCloseTo(approximateRetainedFraction, 3);
      expect(result.profile.provenance).toBe(
        "prespecified-fixed-lvot-diameter-research-bracket-not-subject-measured",
      );
      expect(profile.lvotAreaCm2).toBeGreaterThan(
        MAIN_WIRE_AORTIC_VALVE_LVOT_KINETIC_CORRECTION_PROVENANCE_V1.bracket
          .configuredAorticValveMaximumEoaCm2,
      );
    }
    const provenance =
      MAIN_WIRE_AORTIC_VALVE_LVOT_KINETIC_CORRECTION_PROVENANCE_V1;
    expect(Object.isFrozen(provenance)).toBe(true);
    expect(Object.isFrozen(provenance.literature)).toBe(true);
    expect(Object.isFrozen(provenance.literature.healthyAdultLvotContext)).toBe(
      true,
    );
    expect(
      Object.isFrozen(provenance.literature.proximalVelocityCorrectionMethod),
    ).toBe(true);
    expect(Object.isFrozen(provenance.bracket)).toBe(true);
    expect(Object.isFrozen(provenance.bracket.lvotDiameterSubsetCm)).toBe(true);
    expect(provenance.literature.healthyAdultLvotContext.doi).toBe(
      "10.1093/ehjci/jeac220",
    );
    expect(provenance.literature.proximalVelocityCorrectionMethod.doi).toBe(
      "10.1016/j.echo.2017.02.009",
    );
    expect(provenance.bracket.lvotDiameterSubsetCm).toEqual([2.2, 2.3, 2.5]);
    expect(provenance.bracket.configuredAorticValveMaximumEoaCm2).toBe(3.5);
    expect(provenance.bracket.populationIntervalClaimed).toBe(false);
    expect(analyze("lvot-d2p3cm", [COMMON_SAMPLE]).provenance).toBe(provenance);
  });

  it("preserves units, bounds, fractions, and the exact-density identity", () => {
    const result = analyze("lvot-d2p3cm", [COMMON_SAMPLE]);
    const point = result.points[0]!;
    const q = COMMON_SAMPLE.forwardFlowMlPerSec;
    const eoa = COMMON_SAMPLE.activeEoaCm2;
    const lvotArea = result.profile.lvotAreaCm2;

    expect(point.jetVelocityMPerSec).toBeCloseTo(q / (100 * eoa), 15);
    expect(point.lvotVelocityMPerSec).toBeCloseTo(q / (100 * lvotArea), 15);
    expect(point.simplifiedBernoulliGradientMmHg).toBeCloseTo(
      4 * point.jetVelocityMPerSec ** 2,
      14,
    );
    expect(point.lvotCorrectedSimplifiedBernoulliGradientMmHg).toBeCloseTo(
      4 * (point.jetVelocityMPerSec ** 2 - point.lvotVelocityMPerSec ** 2),
      14,
    );
    expect(point.exactDensityJetCoefficientMmHgSec2PerMl2).toBe(
      idealBernoulliLossFromEffectiveOrificeAreaV2(eoa),
    );
    expect(point.exactDensityLvotCoefficientMmHgSec2PerMl2).toBe(
      idealBernoulliLossFromEffectiveOrificeAreaV2(lvotArea),
    );
    expect(point.exactDensityLvotCorrectedGradientMmHg).toBeCloseTo(
      (idealBernoulliLossFromEffectiveOrificeAreaV2(eoa) -
        idealBernoulliLossFromEffectiveOrificeAreaV2(lvotArea)) *
        q ** 2,
      14,
    );
    expect(
      MAIN_WIRE_AORTIC_VALVE_EXACT_DENSITY_VELOCITY_SQUARED_COEFFICIENT_MMHG_SEC2_PER_M2_V1,
    ).toBe(
      MAIN_WIRE_VALVE_BLOOD_DENSITY_KG_PER_M3_V2 /
        (2 * MAIN_WIRE_VALVE_PA_PER_MMHG_V2),
    );
    expect(point.exactDensityLvotCorrectedGradientMmHg).toBeCloseTo(
      MAIN_WIRE_AORTIC_VALVE_EXACT_DENSITY_VELOCITY_SQUARED_COEFFICIENT_MMHG_SEC2_PER_M2_V1 *
        (point.jetVelocityMPerSec ** 2 - point.lvotVelocityMPerSec ** 2),
      14,
    );
    expect(
      point.lvotCorrectedSimplifiedBernoulliGradientMmHg,
    ).toBeGreaterThanOrEqual(0);
    expect(
      point.lvotCorrectedSimplifiedBernoulliGradientMmHg,
    ).toBeLessThanOrEqual(point.simplifiedBernoulliGradientMmHg);
    expect(point.exactDensityLvotCorrectedGradientMmHg).toBeGreaterThanOrEqual(
      0,
    );
    expect(point.exactDensityLvotCorrectedGradientMmHg).toBeLessThanOrEqual(
      point.exactDensityJetGradientMmHg,
    );
    expect(
      point.lvotCorrectedSimplifiedGradientDerivativeMmHgPerCm2,
    ).toBeGreaterThan(0);
    expect(
      point.exactDensityLvotCorrectedGradientDerivativeMmHgPerCm2,
    ).toBeGreaterThan(0);
    expect(
      point.retainedCorrectedFractionOfSimplified01 +
        point.removedLvotKineticFractionOfSimplified01,
    ).toBeCloseTo(1, 15);
    expect(result.allExactDensityDimensionalIdentitiesWithinTolerance).toBe(
      true,
    );
    expect(result.allCorrectedGradientBoundsInvariantsPassed).toBe(true);
    expect(result.allCorrectedGradientMonotonicityInvariantsPassed).toBe(true);
    expect(result.claim.clinicalNormalityGateApplied).toBe(false);
    expect(result.claim.hardPhysiologyGateApplied).toBe(false);
    expect(result.claim.correctedMeanRole).toBe("research-readout-only");
  });

  it("increases the corrected gradient monotonically with fixed LVOT area", () => {
    const results =
      MAIN_WIRE_AORTIC_VALVE_LVOT_KINETIC_CORRECTION_PROFILE_IDS_V1.map(
        (profileId) => analyze(profileId, [COMMON_SAMPLE]),
      );
    const points = results.map((result) => result.points[0]!);

    expect(points[0]!.simplifiedBernoulliGradientMmHg).toBe(
      points[1]!.simplifiedBernoulliGradientMmHg,
    );
    expect(points[1]!.simplifiedBernoulliGradientMmHg).toBe(
      points[2]!.simplifiedBernoulliGradientMmHg,
    );
    expect(
      points[0]!.lvotCorrectedSimplifiedBernoulliGradientMmHg,
    ).toBeLessThan(points[1]!.lvotCorrectedSimplifiedBernoulliGradientMmHg);
    expect(
      points[1]!.lvotCorrectedSimplifiedBernoulliGradientMmHg,
    ).toBeLessThan(points[2]!.lvotCorrectedSimplifiedBernoulliGradientMmHg);
    expect(points[0]!.exactDensityLvotCorrectedGradientMmHg).toBeLessThan(
      points[1]!.exactDensityLvotCorrectedGradientMmHg,
    );
    expect(points[1]!.exactDensityLvotCorrectedGradientMmHg).toBeLessThan(
      points[2]!.exactDensityLvotCorrectedGradientMmHg,
    );
  });

  it("separates the maximum corrected gradient from the maximum-jet readout and applies caller-owned episode weights", () => {
    const samples = Object.freeze([
      Object.freeze({
        acceptedTimeSec: 10,
        episodeIntegrationWeightSec: 0.01,
        forwardFlowMlPerSec: 100,
        activeEoaCm2: 3,
      }),
      Object.freeze({
        acceptedTimeSec: 10.01,
        episodeIntegrationWeightSec: 0.02,
        forwardFlowMlPerSec: 500,
        activeEoaCm2: 3.5,
      }),
      Object.freeze({
        acceptedTimeSec: 10.03,
        episodeIntegrationWeightSec: 0.07,
        forwardFlowMlPerSec: 200,
        activeEoaCm2: 2.5,
      }),
    ] as const);
    const result = analyze("lvot-d2p3cm", samples);

    expect(result.episode.episodeIntegrationDurationSec).toBeCloseTo(0.1, 15);
    expect(result.maximumLvotCorrectedGradientInstantaneous).toBe(
      result.points[1],
    );
    expect(
      result.maximumLvotCorrectedGradientInstantaneous.sourceSampleIndex,
    ).toBe(1);
    expect(
      result.maximumLvotCorrectedGradientInstantaneous.acceptedTimeSec,
    ).toBe(10.01);
    expect(result.atMaximumJetVelocityInstantaneous).toBe(result.points[1]);
    for (const field of [
      "simplifiedBernoulliGradientMmHg",
      "simplifiedLvotKineticGradientMmHg",
      "lvotCorrectedSimplifiedBernoulliGradientMmHg",
      "exactDensityJetGradientMmHg",
      "exactDensityLvotKineticGradientMmHg",
      "exactDensityLvotCorrectedGradientMmHg",
    ] as const) {
      const expected =
        result.points.reduce(
          (sum, point) =>
            sum + point[field] * point.episodeIntegrationWeightSec,
          0,
        ) / result.episode.episodeIntegrationDurationSec;
      expect(result.timeWeightedMean[field]).toBeCloseTo(expected, 14);
    }
    expect(result.timeWeightedMean.forwardFlowMlPerSec).toBeCloseTo(250, 14);
  });

  it("retains both instantaneous readouts when their source samples differ", () => {
    const result = analyze("lvot-d2p2cm", [
      Object.freeze({
        acceptedTimeSec: 10,
        episodeIntegrationWeightSec: 0.01,
        forwardFlowMlPerSec: 100,
        activeEoaCm2: 1,
      }),
      Object.freeze({
        acceptedTimeSec: 10.01,
        episodeIntegrationWeightSec: 0.01,
        forwardFlowMlPerSec: 400,
        activeEoaCm2: 3.5,
      }),
    ]);

    expect(result.maximumLvotCorrectedGradientInstantaneous).toBe(
      result.points[0],
    );
    expect(result.atMaximumJetVelocityInstantaneous).toBe(result.points[1]);
    expect(
      result.maximumLvotCorrectedGradientInstantaneous
        .lvotCorrectedSimplifiedBernoulliGradientMmHg,
    ).toBeGreaterThan(
      result.atMaximumJetVelocityInstantaneous
        .lvotCorrectedSimplifiedBernoulliGradientMmHg,
    );
    expect(
      result.atMaximumJetVelocityInstantaneous.jetVelocityMPerSec,
    ).toBeGreaterThan(
      result.maximumLvotCorrectedGradientInstantaneous.jetVelocityMPerSec,
    );
    expect(
      result.claim
        .maximumCorrectedGradientAndMaximumJetVelocityMayOccurAtDifferentSamples,
    ).toBe(true);
  });

  it("fails closed on malformed episodes without clamping geometry or flow", () => {
    expect(() => analyze("lvot-d2p3cm", [])).toThrow(/non-empty episode/);
    expect(() =>
      analyze(
        "unsupported" as MainWireAorticValveLvotKineticCorrectionProfileIdV1,
        [COMMON_SAMPLE],
      ),
    ).toThrow(/unsupported fixed LVOT profile/);

    const invalidSamples: readonly MainWireAorticValveLvotKineticCorrectionSampleInputV1[] =
      [
        { ...COMMON_SAMPLE, acceptedTimeSec: Number.NaN },
        { ...COMMON_SAMPLE, episodeIntegrationWeightSec: 0 },
        {
          ...COMMON_SAMPLE,
          episodeIntegrationWeightSec: Number.POSITIVE_INFINITY,
        },
        { ...COMMON_SAMPLE, forwardFlowMlPerSec: 0 },
        { ...COMMON_SAMPLE, forwardFlowMlPerSec: -1 },
        { ...COMMON_SAMPLE, forwardFlowMlPerSec: Number.NaN },
        { ...COMMON_SAMPLE, forwardFlowMlPerSec: Number.MAX_VALUE },
        { ...COMMON_SAMPLE, activeEoaCm2: 0 },
        { ...COMMON_SAMPLE, activeEoaCm2: Number.POSITIVE_INFINITY },
        {
          ...COMMON_SAMPLE,
          activeEoaCm2:
            MAIN_WIRE_AORTIC_VALVE_LVOT_KINETIC_CORRECTION_PROFILES_V1[
              "lvot-d2p3cm"
            ].lvotAreaCm2,
        },
        {
          ...COMMON_SAMPLE,
          activeEoaCm2:
            MAIN_WIRE_AORTIC_VALVE_LVOT_KINETIC_CORRECTION_PROFILES_V1[
              "lvot-d2p3cm"
            ].lvotAreaCm2 + 0.01,
        },
      ];
    for (const sample of invalidSamples) {
      expect(() => analyze("lvot-d2p3cm", [sample])).toThrow();
    }
    expect(() =>
      analyze("lvot-d2p3cm", [
        COMMON_SAMPLE,
        { ...COMMON_SAMPLE, acceptedTimeSec: COMMON_SAMPLE.acceptedTimeSec },
      ]),
    ).toThrow(/strictly increasing/);
  });
});

function analyze(
  profileId: MainWireAorticValveLvotKineticCorrectionProfileIdV1,
  samples: readonly MainWireAorticValveLvotKineticCorrectionSampleInputV1[],
) {
  return analyzeMainWireAorticValveLvotKineticCorrectionV1({
    profileId,
    samples,
  });
}
