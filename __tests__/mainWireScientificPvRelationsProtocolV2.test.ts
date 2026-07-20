import { describe, expect, it } from "vitest";

import type { MainWireScientificLvPressureVolumeAnalysisV1 } from
  "@/engine/scientific/protocols/MainWireScientificHemodynamicAnalysisV1";
import {
  MAIN_WIRE_FOUR_VALVE_DISEASE_PRESETS_V1,
  MAIN_WIRE_FOUR_VALVE_NORMAL_PRESET_V1,
} from "@/engine/mechanics2/valve/MainWireFourValveDiseasePresetV1";
import {
  buildMainWireScientificPvRelationOverlayCurvesV2,
  buildMainWireScientificPvRelationAnalysisPointsV2,
  canStopMainWireScientificPvRelationsProtocolEarlyV2,
  classifyMainWireScientificPvRelationRegurgitationSupportV2,
  extractMainWireScientificLvRelationEndpointsV2,
  MAIN_WIRE_SCIENTIFIC_PV_RELATIONS_PROTOCOL_POLICY_V2,
  nextMainWireScientificPvRelationResistanceScaleV2,
  resolveMainWireScientificPvRelationsProtocolPolicyV2,
  selectMainWireScientificPvRelationFitPointsV2,
  type MainWireScientificPvRelationBeatV2,
} from "@/engine/scientific/protocols/MainWireScientificPvRelationsProtocolV2";

describe("main-wire scientific PV relations protocol V2 pure policy", () => {
  it("retains absolute and transmural pressures at valve-defined ED and ES events", () => {
    const result = extractMainWireScientificLvRelationEndpointsV2([
      sample(0.00, 120, 14, 9, 12, 0),
      sample(0.10, 125, 15, 10, 0.5, 0),
      sample(0.20, 125, 30, 25, 0, 2),
      sample(0.45, 90, 110, 105, 0, 10),
      sample(0.60, 80, 105, 100, 0, 0),
      sample(0.80, 90, 20, 15, 4, 0),
    ]);

    expect(result.endDiastolic).toEqual({
      sampleIndex: 1,
      phase01: 0.1,
      volumeMl: 125,
      absolutePressureMmHg: 15,
      transmuralPressureMmHg: 10,
      externalPressureMmHg: 5,
    });
    expect(result.endSystolic).toEqual({
      sampleIndex: 4,
      phase01: 0.6,
      volumeMl: 80,
      absolutePressureMmHg: 105,
      transmuralPressureMmHg: 100,
      externalPressureMmHg: 5,
    });
  });

  it("fails closed when forward aortic opening is absent", () => {
    const result = extractMainWireScientificLvRelationEndpointsV2([
      sample(0.00, 120, 14, 9, 12, 0),
      sample(0.10, 125, 15, 10, 0, 0),
      sample(0.20, 125, 30, 25, 0, 0),
      sample(0.45, 90, 110, 105, 0, -2),
    ]);

    expect(result).toEqual({ endDiastolic: null, endSystolic: null });
  });

  it("fails closed instead of wrapping an out-of-order transient window", () => {
    const canonical = [
      sample(0.00, 120, 14, 9, 12, 0),
      sample(0.10, 125, 15, 10, 0.5, 0),
      sample(0.20, 125, 30, 25, 0, 2),
      sample(0.45, 90, 110, 105, 0, 10),
      sample(0.60, 80, 105, 100, 0, 0),
      sample(0.80, 90, 20, 15, 4, 0),
    ];
    const rotated = [...canonical.slice(3), ...canonical.slice(0, 3)];

    const result = extractMainWireScientificLvRelationEndpointsV2(rotated);

    expect(result).toEqual({ endDiastolic: null, endSystolic: null });
  });

  it("accepts negative regurgitant flow while rejecting ongoing forward filling", () => {
    const regurgitant = extractMainWireScientificLvRelationEndpointsV2([
      sample(0.00, 120, 14, 9, 12, -3),
      sample(0.10, 125, 15, 10, -4, -3),
      sample(0.20, 125, 30, 25, -6, 2),
      sample(0.45, 90, 110, 105, -12, 10),
      sample(0.60, 80, 105, 100, -8, -2),
      sample(0.80, 90, 20, 15, 4, -3),
    ]);
    expect(regurgitant.endDiastolic).toMatchObject({
      phase01: 0.1,
      volumeMl: 125,
    });

    const ongoingForwardFilling = extractMainWireScientificLvRelationEndpointsV2([
      sample(0.00, 120, 14, 9, 12, 0),
      sample(0.10, 125, 15, 10, 4, 0),
      sample(0.20, 125, 30, 25, 0, 2),
      sample(0.45, 90, 110, 105, 0, 10),
      sample(0.60, 80, 105, 100, 0, 0),
      sample(0.80, 90, 20, 15, 4, 0),
    ]);
    expect(ongoingForwardFilling).toEqual({
      endDiastolic: null,
      endSystolic: null,
    });
  });

  it("enforces the bounded event-locked 6-8 beat default policy", () => {
    expect(MAIN_WIRE_SCIENTIFIC_PV_RELATIONS_PROTOCOL_POLICY_V2).toMatchObject({
      integrationTimeStepSec: 0.002,
      maximumEventLockDurationSec: 2,
      resistanceRampDurationSec: 0.25,
      sustainedValveEventDurationSec: 0.004,
      minimumTotalBeatCount: 6,
      maximumTotalBeatCount: 8,
      maximumVcRaResistanceScale: 16,
      minimumFitPointCount: 6,
    });
    expect(() => resolveMainWireScientificPvRelationsProtocolPolicyV2({
      minimumTotalBeatCount: 8,
      maximumTotalBeatCount: 6,
    })).toThrow(/minimum beat count <= maximum beat count/);
    expect(() => resolveMainWireScientificPvRelationsProtocolPolicyV2({
      maximumTotalBeatCount: 17,
    })).toThrow(/must not exceed 16/);
  });

  it("fails closed only for unvalidated left-sided regurgitation", () => {
    expect(classifyMainWireScientificPvRelationRegurgitationSupportV2(
      MAIN_WIRE_FOUR_VALVE_NORMAL_PRESET_V1,
    )).toMatchObject({ supported: true });
    expect(classifyMainWireScientificPvRelationRegurgitationSupportV2(
      MAIN_WIRE_FOUR_VALVE_DISEASE_PRESETS_V1["TR-moderate"],
    )).toMatchObject({ supported: true });
    expect(classifyMainWireScientificPvRelationRegurgitationSupportV2(
      MAIN_WIRE_FOUR_VALVE_DISEASE_PRESETS_V1["MR-moderate"],
    )).toMatchObject({
      supported: false,
      unsupportedBracketIds: ["MR-moderate"],
    });
    expect(classifyMainWireScientificPvRelationRegurgitationSupportV2(
      MAIN_WIRE_FOUR_VALVE_DISEASE_PRESETS_V1["AR-moderate"],
    )).toMatchObject({
      supported: false,
      unsupportedBracketIds: ["AR-moderate"],
    });

    const unbracketed = {
      ...MAIN_WIRE_FOUR_VALVE_NORMAL_PRESET_V1,
      valves: {
        ...MAIN_WIRE_FOUR_VALVE_NORMAL_PRESET_V1.valves,
        MV: {
          ...MAIN_WIRE_FOUR_VALVE_NORMAL_PRESET_V1.valves.MV,
          closedReverseEroaCm2: 0.1,
        },
      },
    };
    expect(classifyMainWireScientificPvRelationRegurgitationSupportV2(
      unbracketed,
    )).toMatchObject({
      supported: false,
      unsupportedBracketIds: [],
      hasUnbracketedLeftValveRegurgitation: true,
    });
  });

  it("accelerates the monotone log-resistance ramp when EDV span lags", () => {
    const policy = MAIN_WIRE_SCIENTIFIC_PV_RELATIONS_PROTOCOL_POLICY_V2;
    const geometricNext = Math.exp(
      Math.log(policy.maximumVcRaResistanceScale) /
        (policy.maximumTotalBeatCount - 1),
    );
    const lagging = nextMainWireScientificPvRelationResistanceScaleV2({
      beats: [beat(0, 150, 95, 12, 115), beat(1, 149, 94, 11.8, 113)],
      currentResistanceScale: 1,
      policy,
    });
    const ahead = nextMainWireScientificPvRelationResistanceScaleV2({
      beats: [beat(0, 150, 95, 12, 115), beat(1, 120, 80, 5, 90)],
      currentResistanceScale: 1,
      policy,
    });

    expect(lagging).toBeGreaterThan(geometricNext);
    expect(ahead).toBeLessThan(geometricNext);
    expect(lagging).toBeLessThanOrEqual(policy.maximumVcRaResistanceScale);
    expect(ahead).toBeGreaterThanOrEqual(1);
  });

  it("uses only monotonic, separated loading beats and keeps transmural pressure as the fit basis", () => {
    const beats = [
      beat(0, 150, 95, 12, 115),
      beat(1, 149.5, 94.5, 11.5, 113),
      beat(2, 145, 92, 10, 110),
      beat(3, 140, 89, 8.5, 106),
      beat(4, 135, 86, 7, 102),
      beat(5, 130, 83, 5.5, 98),
      beat(6, 125, 80, 4, 94),
    ];
    const selection = selectMainWireScientificPvRelationFitPointsV2(
      beats,
      MAIN_WIRE_SCIENTIFIC_PV_RELATIONS_PROTOCOL_POLICY_V2,
    );
    const points = buildMainWireScientificPvRelationAnalysisPointsV2(
      beats,
      selection,
      "period1-converged",
    );

    expect(selection.includedBeatIds).toEqual([
      "ivc-beat-0",
      "ivc-beat-2",
      "ivc-beat-3",
      "ivc-beat-4",
      "ivc-beat-5",
      "ivc-beat-6",
    ]);
    expect(selection.excludedRedundantBeatIds).toEqual(["ivc-beat-1"]);
    const baseline = points[0];
    if (baseline?.periodicity !== "transient-fit-eligible") {
      throw new Error("expected a fit-eligible baseline");
    }
    expect(baseline.measurement.lvPressureVolume).toMatchObject({
      endDiastolicTransmuralPressureMmHg: 12,
      endSystolicTransmuralPressureMmHg: 115,
    });
    expect(beats[0]!.endDiastolic).toMatchObject({
      absolutePressureMmHg: 17,
      transmuralPressureMmHg: 12,
    });
  });

  it("permits early stop only after the predeclared count and EDV-span gates", () => {
    const selected = [
      beat(0, 150, 95, 12, 115),
      beat(1, 145, 92, 10, 110),
      beat(2, 140, 89, 8.5, 106),
      beat(3, 135, 86, 7, 102),
      beat(4, 130, 83, 5.5, 98),
      beat(5, 125, 80, 4, 94),
    ];

    expect(canStopMainWireScientificPvRelationsProtocolEarlyV2({
      completedBeatCount: 5,
      beats: selected,
      policy: MAIN_WIRE_SCIENTIFIC_PV_RELATIONS_PROTOCOL_POLICY_V2,
    })).toBe(false);
    expect(canStopMainWireScientificPvRelationsProtocolEarlyV2({
      completedBeatCount: 6,
      beats: selected,
      policy: MAIN_WIRE_SCIENTIFIC_PV_RELATIONS_PROTOCOL_POLICY_V2,
    })).toBe(true);
  });

  it("projects the formal transmural fits to intracavitary pressure without changing accepted beat IDs", () => {
    const beats = [
      beat(0, 150, 95, 12, 115),
      beat(1, 145, 92, 10, 110),
      beat(2, 140, 89, 8.5, 106),
      beat(3, 135, 86, 7, 102),
      beat(4, 130, 83, 5.5, 98),
      beat(5, 125, 80, 4, 94),
    ];
    const selection = selectMainWireScientificPvRelationFitPointsV2(
      beats,
      MAIN_WIRE_SCIENTIFIC_PV_RELATIONS_PROTOCOL_POLICY_V2,
    );
    const analysis = {
      espvr: {
        status: "accepted",
        fit: {
          endSystolicElastanceMmHgPerMl: 2,
          volumeAxisInterceptMl: 30,
        },
      },
      edpvr: {
        status: "accepted",
        fit: {
          referenceVolumeMl: 60,
          referencePressureMmHg: 0,
          alphaMmHg: 1,
          betaPerMl: 0.02,
        },
      },
    } as MainWireScientificLvPressureVolumeAnalysisV1;

    const overlay = buildMainWireScientificPvRelationOverlayCurvesV2({
      beats,
      fitPointSelection: selection,
      analysis,
      sampleCount: 4,
    });

    expect(overlay.claim).toMatchObject({
      sameAcceptedBeatIdsForBothPressureBases: true,
      formalAnalysisPressureBasis: "transmural",
      intracavitaryCurveIsIndependentScientificRefit: false,
    });
    expect(overlay.transmural.espvr?.sourceBeatIds).toEqual(
      overlay.intracavitaryAbsolute.espvr?.sourceBeatIds,
    );
    expect(overlay.transmural.espvr?.relationModel).toBe("linear-ESPVR");
    expect(overlay.transmural.edpvr?.sourceBeatIds).toEqual(
      overlay.intracavitaryAbsolute.edpvr?.sourceBeatIds,
    );
    const tmEspvr = overlay.transmural.espvr?.points ?? [];
    const absoluteEspvr = overlay.intracavitaryAbsolute.espvr?.points ?? [];
    expect(absoluteEspvr).toHaveLength(tmEspvr.length);
    absoluteEspvr.forEach((point, index) => {
      expect(point.volumeMl).toBe(tmEspvr[index]!.volumeMl);
      expect(point.pressureMmHg - tmEspvr[index]!.pressureMmHg).toBeCloseTo(5);
    });
  });
});

function sample(
  cyclePhase01: number,
  volumeMl: number,
  absolutePressureMmHg: number,
  transmuralPressureMmHg: number,
  mitralFlowMlPerSec: number,
  aorticFlowMlPerSec: number,
) {
  return Object.freeze({
    cyclePhase01,
    nodeVolumeMl: Object.freeze({ LV: volumeMl }),
    nodeAbsolutePressureMmHg: Object.freeze({ LV: absolutePressureMmHg }),
    chamberTransmuralPressureMmHg: Object.freeze({
      LV: transmuralPressureMmHg,
    }),
    flowMlPerSec: Object.freeze({
      MV: mitralFlowMlPerSec,
      AoV: aorticFlowMlPerSec,
    }),
  });
}

function beat(
  beatIndex: number,
  edvMl: number,
  esvMl: number,
  edpTransmuralMmHg: number,
  espTransmuralMmHg: number,
): MainWireScientificPvRelationBeatV2 {
  return Object.freeze({
    beatIndex,
    role: beatIndex === 0 ? "baseline" as const : "preload-reduction" as const,
    vcRaResistanceScaleStart: beatIndex === 0 ? 1 : beatIndex,
    vcRaResistanceScaleEnd: beatIndex === 0 ? 1 : beatIndex + 1,
    resistanceScaleAtEndDiastole: beatIndex === 0 ? 1 : beatIndex + 1,
    resistanceScaleAtEndSystole: beatIndex === 0 ? 1 : beatIndex + 1,
    interventionRampCompletedBeforeEndDiastole: true,
    fixedTotalBloodVolumeMl: 5_522.11,
    samples: Object.freeze([]),
    endDiastolic: endpoint(edvMl, edpTransmuralMmHg),
    endSystolic: endpoint(esvMl, espTransmuralMmHg),
    strokeWorkTransmuralMmHgMl: 8_000 - beatIndex * 500,
    meanRapTransmuralMmHg: 5,
    meanLapTransmuralMmHg: 10,
    netCardiacOutputLMin: 5,
    totalBloodVolumeAbsoluteErrorMl: 0,
    maximumContinuityAbsoluteResidualMl: 0,
    classification: "fit-eligible" as const,
    valid: true,
    rejectionReason: null,
  });
}

function endpoint(
  volumeMl: number,
  transmuralPressureMmHg: number,
) {
  return Object.freeze({
    sampleIndex: 0,
    phase01: 0,
    volumeMl,
    absolutePressureMmHg: transmuralPressureMmHg + 5,
    transmuralPressureMmHg,
    externalPressureMmHg: 5,
  });
}
