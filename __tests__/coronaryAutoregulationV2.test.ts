import { describe, expect, it } from "vitest";

import {
  stepCoronaryAutoregulationByTerritoryLayerV2,
  unitCoronaryDemandScaleV2,
  zeroCoronaryHyperemiaDriveV2,
} from "@/engine/coronary/autoregulationV2";
import {
  initialCoronaryToneStateV2,
  NORMAL_ADULT_CORONARY_TOPOLOGY_PRIOR_V2,
} from "@/engine/coronary/topologyPriorV2";
import {
  CORONARY_LAYER_IDS_V2,
  CORONARY_TERRITORY_IDS_V2,
  type CoronaryTerritoryLayerRecordV2,
  type CoronaryTerritoryRecordV2,
} from "@/engine/coronary/typesV2";

const layerRecord = (
  value: (territory: string, layer: string) => number,
): CoronaryTerritoryLayerRecordV2<number> => Object.freeze(Object.fromEntries(
  CORONARY_TERRITORY_IDS_V2.map((territoryId) => [territoryId,
    Object.freeze(Object.fromEntries(CORONARY_LAYER_IDS_V2.map((layerId) => [
      layerId,
      value(territoryId, layerId),
    ]))),
  ]),
)) as CoronaryTerritoryLayerRecordV2<number>;

const pressure = Object.freeze({ LAD: 57.8, LCx: 57.8, RCA: 57.8 }) as
  CoronaryTerritoryRecordV2<number>;

describe("territory-layer accepted coronary autoregulation V2", () => {
  it("dilates only the under-supplied layer while preserving six-state ownership", () => {
    const initial = initialCoronaryToneStateV2();
    const targetLikeFlow = layerRecord((territoryId, layerId) => {
      const territory = NORMAL_ADULT_CORONARY_TOPOLOGY_PRIOR_V2
        .territories[territoryId as keyof typeof NORMAL_ADULT_CORONARY_TOPOLOGY_PRIOR_V2.territories];
      const layer = territory.layers[
        layerId as keyof typeof territory.layers
      ];
      return territory.targetRestingFlowMlPerMin / 60
        * layer.restingFlowFractionWithinTerritory01;
    });
    const achieved = layerRecord((territoryId, layerId) =>
      territoryId === "LAD" && layerId === "subendocardial"
        ? targetLikeFlow[territoryId][layerId] * 0.5
        : targetLikeFlow[territoryId][layerId]);
    const step = stepCoronaryAutoregulationByTerritoryLayerV2(initial, {
      meanTissueFlowMlPerSecByTerritoryLayer: achieved,
      meanPerfusionPressureMmHgByTerritory: pressure,
      demandScaleByTerritoryLayer: unitCoronaryDemandScaleV2(),
      hyperemia01ByTerritoryLayer: zeroCoronaryHyperemiaDriveV2(),
      acceptedWindowDurationSec: 1,
    });

    expect(step.nextToneResistanceScaleByTerritoryLayer.LAD.subendocardial)
      .toBeLessThan(1);
    expect(step.nextToneResistanceScaleByTerritoryLayer.LAD.subepicardial)
      .toBeCloseTo(1, 3);
    expect(step.nextToneResistanceScaleByTerritoryLayer.LCx.subendocardial)
      .toBeCloseTo(1, 3);
    expect(Object.values(step.layerStepByTerritoryLayer)).toHaveLength(3);
    expect(initial.LAD.subendocardial).toBe(1);
  });

  it("uses Qm rather than phasic inlet data and advances only after a nonzero accepted window", () => {
    const initial = initialCoronaryToneStateV2();
    const noTime = stepCoronaryAutoregulationByTerritoryLayerV2(initial, {
      meanTissueFlowMlPerSecByTerritoryLayer: layerRecord(() => 0.1),
      meanPerfusionPressureMmHgByTerritory: pressure,
      demandScaleByTerritoryLayer: unitCoronaryDemandScaleV2(),
      hyperemia01ByTerritoryLayer: zeroCoronaryHyperemiaDriveV2(),
      acceptedWindowDurationSec: 0,
    });
    expect(noTime.nextToneResistanceScaleByTerritoryLayer).toEqual(initial);
    expect(noTime.maximumAbsoluteLogToneChange).toBe(0);
  });

  it("moves every layer toward the pharmacologic dilation floor without crossing it", () => {
    let tone = initialCoronaryToneStateV2();
    const hyperemia = layerRecord(() => 1);
    for (let beat = 0; beat < 400; beat += 1) {
      tone = stepCoronaryAutoregulationByTerritoryLayerV2(tone, {
        meanTissueFlowMlPerSecByTerritoryLayer: layerRecord(() => 1),
        meanPerfusionPressureMmHgByTerritory: pressure,
        demandScaleByTerritoryLayer: unitCoronaryDemandScaleV2(),
        hyperemia01ByTerritoryLayer: hyperemia,
        acceptedWindowDurationSec: 1,
      }).nextToneResistanceScaleByTerritoryLayer;
    }
    for (const territoryId of CORONARY_TERRITORY_IDS_V2) {
      for (const layerId of CORONARY_LAYER_IDS_V2) {
        expect(tone[territoryId][layerId]).toBeGreaterThanOrEqual(4 / 45);
        expect(tone[territoryId][layerId]).toBeCloseTo(4 / 45, 5);
      }
    }
  });

  it("projects a saturated log-space step onto the exact resistance floor", () => {
    const aggregate = Object.freeze({
      meanTissueFlowMlPerSecByTerritoryLayer: layerRecord(() => 0),
      meanPerfusionPressureMmHgByTerritory: pressure,
      demandScaleByTerritoryLayer: unitCoronaryDemandScaleV2(),
      hyperemia01ByTerritoryLayer: zeroCoronaryHyperemiaDriveV2(),
      acceptedWindowDurationSec: 2_500,
    });
    const first = stepCoronaryAutoregulationByTerritoryLayerV2(
      initialCoronaryToneStateV2(),
      aggregate,
    );
    const floor = 4 / 45;
    expect(first.nextToneResistanceScaleByTerritoryLayer.LAD.subendocardial)
      .toBe(floor);
    expect(first.layerStepByTerritoryLayer.LAD.subendocardial.boundedAt)
      .toBe("minimum");

    const second = stepCoronaryAutoregulationByTerritoryLayerV2(
      first.nextToneResistanceScaleByTerritoryLayer,
      aggregate,
    );
    expect(second.nextToneResistanceScaleByTerritoryLayer.LAD.subendocardial)
      .toBe(floor);
  });

  it("integrates a held supply deficit until the layer recruits more reserve", () => {
    const initial = initialCoronaryToneStateV2();
    const targetLikeFlow = layerRecord((territoryId, layerId) => {
      const territory = NORMAL_ADULT_CORONARY_TOPOLOGY_PRIOR_V2
        .territories[territoryId as keyof typeof NORMAL_ADULT_CORONARY_TOPOLOGY_PRIOR_V2.territories];
      return territory.targetRestingFlowMlPerMin / 60
        * territory.layers[layerId as keyof typeof territory.layers]
          .restingFlowFractionWithinTerritory01;
    });
    let tone = initial;
    for (let beat = 0; beat < 5; beat += 1) {
      tone = stepCoronaryAutoregulationByTerritoryLayerV2(tone, {
        meanTissueFlowMlPerSecByTerritoryLayer: layerRecord(
          (territoryId, layerId) => targetLikeFlow[territoryId as keyof typeof targetLikeFlow][layerId as "subepicardial" | "subendocardial"] * 0.5,
        ),
        meanPerfusionPressureMmHgByTerritory: Object.freeze({
          LAD: 57.8,
          LCx: 57.8,
          RCA: 57.8,
        }),
        demandScaleByTerritoryLayer: unitCoronaryDemandScaleV2(),
        hyperemia01ByTerritoryLayer: zeroCoronaryHyperemiaDriveV2(),
        acceptedWindowDurationSec: 1,
      }).nextToneResistanceScaleByTerritoryLayer;
    }
    expect(tone.LAD.subendocardial).toBeLessThan(tone.LAD.subepicardial + 1e-12);
    expect(tone.LAD.subendocardial).toBeLessThan(0.9);
  });

  it("keeps Qm equal to demand as the unique interior equilibrium at off-reference pressure", () => {
    const initial = initialCoronaryToneStateV2();
    const targetLikeFlow = layerRecord((territoryId, layerId) => {
      const territory = NORMAL_ADULT_CORONARY_TOPOLOGY_PRIOR_V2
        .territories[territoryId as keyof typeof NORMAL_ADULT_CORONARY_TOPOLOGY_PRIOR_V2.territories];
      return territory.targetRestingFlowMlPerMin / 60
        * territory.layers[layerId as keyof typeof territory.layers]
          .restingFlowFractionWithinTerritory01;
    });
    for (const perfusionPressureMmHg of [28.9, 115.6]) {
      const step = stepCoronaryAutoregulationByTerritoryLayerV2(initial, {
        meanTissueFlowMlPerSecByTerritoryLayer: targetLikeFlow,
        meanPerfusionPressureMmHgByTerritory: Object.freeze({
          LAD: perfusionPressureMmHg,
          LCx: perfusionPressureMmHg,
          RCA: perfusionPressureMmHg,
        }),
        demandScaleByTerritoryLayer: unitCoronaryDemandScaleV2(),
        hyperemia01ByTerritoryLayer: zeroCoronaryHyperemiaDriveV2(),
        acceptedWindowDurationSec: 25,
      });
      expect(step.nextToneResistanceScaleByTerritoryLayer).toEqual(initial);
      expect(step.maximumAbsoluteLogToneChange).toBe(0);
    }
  });
});
