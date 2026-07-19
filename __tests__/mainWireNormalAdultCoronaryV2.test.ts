import { describe, expect, it } from "vitest";

import {
  MAIN_WIRE_PROVISIONAL_NORMAL_ADULT_CORONARY_COLLAPSE_V2,
  MAIN_WIRE_PROVISIONAL_NORMAL_ADULT_CORONARY_EVIDENCE_V2,
  MAIN_WIRE_PROVISIONAL_NORMAL_ADULT_CORONARY_PRIOR_FINGERPRINT_V2,
  MAIN_WIRE_PROVISIONAL_NORMAL_ADULT_CORONARY_PRIOR_V2,
  MAIN_WIRE_PROVISIONAL_NORMAL_ADULT_R1_CALIBRATION_V2,
  createMainWireProvisionalNormalAdultCoronaryPriorV2,
} from "@/engine/coronary/mainWireNormalAdultCoronaryV2";
import {
  coronaryTopologyPriorFingerprintV2,
} from "@/engine/coronary/topologyPriorV2";
import {
  CORONARY_LAYER_IDS_V2,
  CORONARY_TERRITORY_IDS_V2,
} from "@/engine/coronary/typesV2";

describe("main-wire provisional normal-adult coronary prior V2", () => {
  it("reconstructs one deterministic evidence-bound prior", () => {
    const rebuilt = createMainWireProvisionalNormalAdultCoronaryPriorV2();
    expect(coronaryTopologyPriorFingerprintV2(rebuilt)).toBe(
      MAIN_WIRE_PROVISIONAL_NORMAL_ADULT_CORONARY_PRIOR_FINGERPRINT_V2,
    );
    expect(coronaryTopologyPriorFingerprintV2(rebuilt)).toBe(
      coronaryTopologyPriorFingerprintV2(
        MAIN_WIRE_PROVISIONAL_NORMAL_ADULT_CORONARY_PRIOR_V2,
      ),
    );
    expect(rebuilt.claims.simulationReady).toBe(false);
    expect(rebuilt.construction.intramyocardialComplianceScale)
      .toEqual({ c1Proximal: 2 / 3, c2Distal: 1 });
    expect(rebuilt.construction.beatingReferenceR1Calibration)
      .toEqual(MAIN_WIRE_PROVISIONAL_NORMAL_ADULT_R1_CALIBRATION_V2);
    expect(rebuilt.construction.baselineResistancePartition
      .macroPathPressureDropFraction01.largeArterial).toBe(0.25);
  });

  it("owns only the prespecified compliance, collapse, and R1 evidence", () => {
    expect(MAIN_WIRE_PROVISIONAL_NORMAL_ADULT_CORONARY_EVIDENCE_V2
      .largeArterialComplianceScale).toBe(0.4);
    expect(MAIN_WIRE_PROVISIONAL_NORMAL_ADULT_CORONARY_COLLAPSE_V2
      .residualHydraulicAreaFraction).toBe(0.67);
    expect(MAIN_WIRE_PROVISIONAL_NORMAL_ADULT_CORONARY_EVIDENCE_V2
      .simulationReady).toBe(false);
    for (const territoryId of CORONARY_TERRITORY_IDS_V2) {
      for (const layerId of CORONARY_LAYER_IDS_V2) {
        const expected = MAIN_WIRE_PROVISIONAL_NORMAL_ADULT_R1_CALIBRATION_V2
          .proximalArteriolarScaleByTerritoryLayer[territoryId][layerId];
        expect(expected).toBeGreaterThan(0);
        expect(expected).toBeLessThan(1);
      }
    }
  });
});
