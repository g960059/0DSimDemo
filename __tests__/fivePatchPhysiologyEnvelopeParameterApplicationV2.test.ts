import { describe, expect, it } from "vitest";

import {
  FIVE_PATCH_PHYSIOLOGY_ENVELOPE_DIMENSION_IDS_V2,
  FIVE_PATCH_PHYSIOLOGY_ENVELOPE_PARAMETER_DIMENSIONS_V2,
  mapFivePatchPhysiologyEnvelopeUnitPointV2,
  type FivePatchPhysiologyEnvelopeParameterVectorV2,
  type FivePatchPhysiologyEnvelopeScenarioV2,
} from "@/engine/mechanics2/envelope/FivePatchPhysiologyEnvelopeDefinitionV2";
import {
  FIVE_PATCH_PHYSIOLOGY_ENVELOPE_BLOOD_VOLUME_ALLOCATION_V2,
  applyFivePatchPhysiologyEnvelopeScenarioV2,
  buildFivePatchPhysiologyEnvelopeConfigV2,
} from "@/engine/mechanics2/envelope/FivePatchPhysiologyEnvelopeParameterApplicationV2";
import {
  createDefaultNoAvpdFivePatchLandTriSegParamsV1,
  initialNoAvpdFivePatchLandTriSegStateV1,
  totalBloodVolumeMl,
} from "@/engine/mechanics2/subsystems/NoAvpdFivePatchLandTriSegV1";

const REFERENCE_SCENARIO: FivePatchPhysiologyEnvelopeScenarioV2 = {
  scenarioId: "hr60-reference-test",
  heartRateBpm: 60,
  bloodVolumeScale: 1,
  systemicResistanceScale: 1,
  pulmonaryResistanceScale: 1,
};

describe("FivePatchPhysiologyEnvelopeParameterApplicationV2", () => {
  it("maps only the declared myocardial owners and preserves Land, SLS, and calcium amplitudes", () => {
    const base = createDefaultNoAvpdFivePatchLandTriSegParamsV1("all-patch");
    const vector = vectorWith({
      atrialActiveScale: 0.42,
      ventricularActiveScale: 1.8,
      atrialCalciumDecayScale: 0.65,
      ventricularCalciumDecayScale: 0.75,
      ventricularPassiveTangentScale: 1.7,
    });
    const { params } = buildFivePatchPhysiologyEnvelopeConfigV2(vector);

    for (const side of ["left", "right"] as const) {
      expect(params.atria[side].material.activeHomogenizationScale).toBe(
        base.atria[side].material.activeHomogenizationScale *
          vector.atrialActiveScale,
      );
      expect(params.atria[side].material.active).toEqual(
        base.atria[side].material.active,
      );
      expect(params.atria[side].material.passiveSls).toEqual(
        base.atria[side].material.passiveSls,
      );
    }
    for (
      const wall of ["leftFreeWall", "septum", "rightFreeWall"] as const
    ) {
      expect(params.triSeg[wall].material.activeHomogenizationScale).toBe(
        base.triSeg[wall].material.activeHomogenizationScale *
          vector.ventricularActiveScale,
      );
      expect(params.triSeg[wall].material.active).toEqual(
        base.triSeg[wall].material.active,
      );
      expect(params.triSeg[wall].material.passiveSls.passive)
        .toEqual({
          ...base.triSeg[wall].material.passiveSls.passive,
          tangentModulusPa:
            base.triSeg[wall].material.passiveSls.passive.tangentModulusPa *
            vector.ventricularPassiveTangentScale,
        });
      expect(params.triSeg[wall].material.passiveSls.sls).toEqual(
        base.triSeg[wall].material.passiveSls.sls,
      );
    }

    const atrialWalls = ["leftAtrium", "rightAtrium"] as const;
    const ventricularWalls = [
      "leftFreeWall",
      "septum",
      "rightFreeWall",
    ] as const;
    for (const wall of [...atrialWalls, ...ventricularWalls] as const) {
      const scale = atrialWalls.includes(wall as never)
        ? vector.atrialCalciumDecayScale
        : vector.ventricularCalciumDecayScale;
      const actualTargets = params.calciumDrivers[wall].calcium.rateTargets;
      const baseTargets = base.calciumDrivers[wall].calcium.rateTargets;
      expect(actualTargets).toHaveLength(baseTargets.length);
      actualTargets.forEach((target, index) => {
        expect(target.peakAmplitudeUM).toBe(
          baseTargets[index]!.peakAmplitudeUM,
        );
        expect(target.diastolicCalciumUM).toBe(
          baseTargets[index]!.diastolicCalciumUM,
        );
        expect(target.decayHalfTimeSec).toBeCloseTo(
          baseTargets[index]!.decayHalfTimeSec * scale,
          14,
        );
      });
    }
  });

  it("has no dead or cross-wired axis in effective subsystem readback", () => {
    const midpoint = Array(12).fill(0.5);
    expect(FIVE_PATCH_PHYSIOLOGY_ENVELOPE_DIMENSION_IDS_V2).toHaveLength(12);
    for (
      let index = 0;
      index < FIVE_PATCH_PHYSIOLOGY_ENVELOPE_PARAMETER_DIMENSIONS_V2.length;
      index += 1
    ) {
      const dimension =
        FIVE_PATCH_PHYSIOLOGY_ENVELOPE_PARAMETER_DIMENSIONS_V2[index]!;
      const lowPoint = midpoint.slice();
      const highPoint = midpoint.slice();
      lowPoint[index] = 0.25;
      highPoint[index] = 0.75;
      const low = buildFivePatchPhysiologyEnvelopeConfigV2(
        mapFivePatchPhysiologyEnvelopeUnitPointV2(lowPoint),
      ).effectiveAxisReadback;
      const high = buildFivePatchPhysiologyEnvelopeConfigV2(
        mapFivePatchPhysiologyEnvelopeUnitPointV2(highPoint),
      ).effectiveAxisReadback;
      expect(
        high[dimension.dimensionId],
        `dead physiology axis: ${dimension.dimensionId}`,
      ).not.toBe(low[dimension.dimensionId]);
      for (const other of FIVE_PATCH_PHYSIOLOGY_ENVELOPE_PARAMETER_DIMENSIONS_V2) {
        if (other.dimensionId === dimension.dimensionId) continue;
        expect(
          high[other.dimensionId],
          `${dimension.dimensionId} leaked into ${other.dimensionId}`,
        ).toBeCloseTo(low[other.dimensionId], 12);
      }
    }
  });

  it("couples the mitral area, leak, resistance, inertance, and Bernoulli axes", () => {
    const base = createDefaultNoAvpdFivePatchLandTriSegParamsV1("all-patch");
    const scale = 1.4;
    const { params, effectiveAxisReadback } =
      buildFivePatchPhysiologyEnvelopeConfigV2(
        vectorWith({ mitralHydraulicAreaScale: scale }),
      );
    const actual = params.valves.mitral;
    const baseline = base.valves.mitral;
    expect(actual.openAreaCm2).toBe(baseline.openAreaCm2 * scale);
    expect(actual.leakAreaCm2).toBe(baseline.leakAreaCm2 * scale);
    expect(actual.openResistanceMmHgSecPerMl).toBeCloseTo(
      baseline.openResistanceMmHgSecPerMl / scale ** 2,
      14,
    );
    expect(actual.openInertanceMmHgSec2PerMl).toBeCloseTo(
      baseline.openInertanceMmHgSec2PerMl / scale,
      14,
    );
    expect(actual.openBernoulliMmHgSec2PerMl2).toBeCloseTo(
      baseline.openBernoulliMmHgSec2PerMl2 / scale ** 2,
      14,
    );
    expect(actual.openingMidpointMmHg).toBe(baseline.openingMidpointMmHg);
    expect(actual.openingWidthMmHg).toBe(baseline.openingWidthMmHg);
    expect(actual.flowSmoothingMlPerSec).toBe(
      baseline.flowSmoothingMlPerSec,
    );
    expect(effectiveAxisReadback.mitralHydraulicAreaScale).toBeCloseTo(
      scale,
      14,
    );
  });

  it("holds AV delay in physical seconds across HR and preserves group offsets", () => {
    const avDelaySec = 0.17;
    const config = buildFivePatchPhysiologyEnvelopeConfigV2(
      vectorWith({ avDelaySec }),
    );
    const base = createDefaultNoAvpdFivePatchLandTriSegParamsV1("all-patch");
    expect(forwardDelta(
      config.params.calciumDrivers.leftAtrium.eventOnsetSec,
      config.params.calciumDrivers.leftFreeWall.eventOnsetSec,
      config.params.cycleLengthSec,
    )).toBeCloseTo(avDelaySec, 14);
    expect(signedDelta(
      config.params.calciumDrivers.rightAtrium.eventOnsetSec,
      config.params.calciumDrivers.leftAtrium.eventOnsetSec,
      config.params.cycleLengthSec,
    )).toBeCloseTo(signedDelta(
      base.calciumDrivers.rightAtrium.eventOnsetSec,
      base.calciumDrivers.leftAtrium.eventOnsetSec,
      base.cycleLengthSec,
    ), 14);

    const hr100 = applyFivePatchPhysiologyEnvelopeScenarioV2(config, {
      ...REFERENCE_SCENARIO,
      scenarioId: "hr100-test",
      heartRateBpm: 100,
    });
    expect(hr100.params.cycleLengthSec).toBe(0.6);
    expect(Object.values(hr100.params.calciumDrivers).every(
      (driver) => driver.cycleLengthSec === 0.6,
    )).toBe(true);
    expect(forwardDelta(
      hr100.params.calciumDrivers.leftAtrium.eventOnsetSec,
      hr100.params.calciumDrivers.leftFreeWall.eventOnsetSec,
      hr100.params.cycleLengthSec,
    )).toBeCloseTo(avDelaySec, 14);
    expect(signedDelta(
      hr100.params.calciumDrivers.rightFreeWall.eventOnsetSec,
      hr100.params.calciumDrivers.leftFreeWall.eventOnsetSec,
      hr100.params.cycleLengthSec,
    )).toBeCloseTo(0.01, 14);
    expect(hr100.effectiveAxisReadback.avDelaySec).toBeCloseTo(
      avDelaySec,
      14,
    );
  });

  it("composes scenario scales and conserves exact blood volume with 60:13 venous allocation", () => {
    const candidateBloodScale = 1.1;
    const candidateSystemicResistanceScale = 1.2;
    const config = buildFivePatchPhysiologyEnvelopeConfigV2(vectorWith({
      bloodVolumeScale: candidateBloodScale,
      systemicResistanceScale: candidateSystemicResistanceScale,
    }));
    const scenario = {
      ...REFERENCE_SCENARIO,
      scenarioId: "combined-load-test",
      bloodVolumeScale: 0.85,
      systemicResistanceScale: 1.35,
      pulmonaryResistanceScale: 1.5,
    };
    const applied = applyFivePatchPhysiologyEnvelopeScenarioV2(
      config,
      scenario,
    );
    const baseParams = createDefaultNoAvpdFivePatchLandTriSegParamsV1(
      "all-patch",
    );
    const baseState = initialNoAvpdFivePatchLandTriSegStateV1(baseParams);
    const state = initialNoAvpdFivePatchLandTriSegStateV1(
      applied.params,
      applied.initialVolumeOverridesMl,
    );
    const combinedBloodScale = candidateBloodScale *
      scenario.bloodVolumeScale;
    expect(totalBloodVolumeMl(state.volumes)).toBeCloseTo(
      totalBloodVolumeMl(baseState.volumes) * combinedBloodScale,
      12,
    );
    for (const compartment of
      FIVE_PATCH_PHYSIOLOGY_ENVELOPE_BLOOD_VOLUME_ALLOCATION_V2
        .preservedCompartments) {
      expect(state.volumes[compartment]).toBe(
        baseState.volumes[compartment],
      );
    }
    const systemicDelta = state.volumes.systemicVeinMl -
      baseState.volumes.systemicVeinMl;
    const pulmonaryDelta = state.volumes.pulmonaryVeinMl -
      baseState.volumes.pulmonaryVeinMl;
    expect(systemicDelta / pulmonaryDelta).toBeCloseTo(60 / 13, 12);
    expect(applied.params.vascular.systemicResistanceMmHgSecPerMl).toBe(
      baseParams.vascular.systemicResistanceMmHgSecPerMl *
        candidateSystemicResistanceScale * scenario.systemicResistanceScale,
    );
    expect(applied.params.vascular.pulmonaryResistanceMmHgSecPerMl).toBe(
      baseParams.vascular.pulmonaryResistanceMmHgSecPerMl *
        scenario.pulmonaryResistanceScale,
    );
    expect(applied.effectiveAxisReadback.bloodVolumeScale).toBeCloseTo(
      combinedBloodScale,
      12,
    );
    expect(applied.effectiveAxisReadback.systemicResistanceScale).toBeCloseTo(
      candidateSystemicResistanceScale * scenario.systemicResistanceScale,
      12,
    );
  });
});

function vectorWith(
  overrides: Partial<FivePatchPhysiologyEnvelopeParameterVectorV2>,
): FivePatchPhysiologyEnvelopeParameterVectorV2 {
  return Object.freeze({
    atrialActiveScale: 0.5,
    ventricularActiveScale: 1.5,
    atrialCalciumDecayScale: 0.8,
    ventricularCalciumDecayScale: 0.8,
    avDelaySec: 0.18,
    ventricularPassiveTangentScale: 1.2,
    mitralHydraulicAreaScale: 1.1,
    pulmonaryVenousResistanceScale: 1.1,
    pulmonaryVenousInertanceScale: 1.2,
    pulmonaryVeinComplianceScale: 1.1,
    bloodVolumeScale: 1,
    systemicResistanceScale: 1.1,
    ...overrides,
  });
}

function forwardDelta(from: number, to: number, cycle: number): number {
  const value = (to - from) % cycle;
  return value < 0 ? value + cycle : value;
}

function signedDelta(target: number, source: number, cycle: number): number {
  const forward = forwardDelta(source, target, cycle);
  return forward > cycle / 2 ? forward - cycle : forward;
}
