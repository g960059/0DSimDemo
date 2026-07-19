import {
  buildCoronaryCollapseHydraulicsPriorV2,
  type CoronaryCollapseHydraulicsPriorV2,
} from "@/engine/coronary/backwardEulerCoronaryNetworkV2";
import {
  NORMAL_ADULT_CORONARY_TOPOLOGY_PRIOR_V2,
  applyBeatingReferenceR1CalibrationV2,
  buildCoronaryTopologyV2,
  coronaryTopologyPriorFingerprintV2,
  scaleCoronaryIntramyocardialComplianceV2,
  scaleCoronaryLargeArterialComplianceV2,
  type CoronaryBeatingReferenceR1CalibrationV2,
  type CoronaryTopologyPriorV2,
} from "@/engine/coronary/topologyPriorV2";
import type {
  CoronaryTerritoryLayerRecordV2,
} from "@/engine/coronary/typesV2";

export const MAIN_WIRE_PROVISIONAL_NORMAL_ADULT_CORONARY_V2_ID =
  "main-wire-provisional-normal-adult-coronary-v2" as const;

/**
 * Versioned construction evidence for the fixed-boundary candidate selected
 * before atomic closed-loop validation. These are not user fitting knobs.
 */
export const MAIN_WIRE_PROVISIONAL_NORMAL_ADULT_CORONARY_EVIDENCE_V2 =
  Object.freeze({
    candidateId: MAIN_WIRE_PROVISIONAL_NORMAL_ADULT_CORONARY_V2_ID,
    evidenceArtifact:
      "data/myocardium/reports/mainwire-coronary-v2-lad-measurement-site-factorial-v1.json" as const,
    beatingReferenceSourceSha256:
      "c8c83bacb46db3b3c7395fef8c14330a29b4c47019050aa664825c018e7e40ec" as const,
    boundaryFingerprint:
      "d2d5b991ae94330905cbb60db1ffc44623b7e753affbeced838e7b15807fe325" as const,
    largeArterialComplianceScale: 0.4 as const,
    c1ProximalComplianceScale: 2 / 3,
    c2DistalComplianceScale: 1 as const,
    collapseResidualHydraulicAreaFraction: 0.67 as const,
    pressureDropPlacement:
      "retain-original-25-percent-construction-ledger" as const,
    selectionOwner:
      "fixed-boundary-mechanism-factorial-not-parameter-fit" as const,
    simulationReady: false as const,
  });

export const MAIN_WIRE_PROVISIONAL_NORMAL_ADULT_R1_CALIBRATION_V2 =
  Object.freeze({
    calibrationId: "beating-reference-r1-mean-qm-v1" as const,
    proximalArteriolarScaleByTerritoryLayer: Object.freeze({
      LAD: Object.freeze({
        subepicardial: 0.8117444902172969,
        subendocardial: 0.6568420600153214,
      }),
      LCx: Object.freeze({
        subepicardial: 0.8852105335411105,
        subendocardial: 0.6651932366461948,
      }),
      RCA: Object.freeze({
        subepicardial: 0.891153816566061,
        subendocardial: 0.821858218431945,
      }),
    }) as CoronaryTerritoryLayerRecordV2<number>,
    boundaryFingerprint:
      MAIN_WIRE_PROVISIONAL_NORMAL_ADULT_CORONARY_EVIDENCE_V2
        .boundaryFingerprint,
    calibrationToneResistanceScale: 1 as const,
    targetOwner: "mass-territory-layer-resting-flow-prior" as const,
    objective: "accepted-cycle-mean-qm-only" as const,
    waveformObjectiveUsed: false as const,
  }) satisfies CoronaryBeatingReferenceR1CalibrationV2;

export function createMainWireProvisionalNormalAdultCoronaryPriorV2():
CoronaryTopologyPriorV2 {
  const compliancePrior = scaleCoronaryLargeArterialComplianceV2(
    scaleCoronaryIntramyocardialComplianceV2(
      NORMAL_ADULT_CORONARY_TOPOLOGY_PRIOR_V2,
      Object.freeze({
        c1Proximal:
          MAIN_WIRE_PROVISIONAL_NORMAL_ADULT_CORONARY_EVIDENCE_V2
            .c1ProximalComplianceScale,
        c2Distal:
          MAIN_WIRE_PROVISIONAL_NORMAL_ADULT_CORONARY_EVIDENCE_V2
            .c2DistalComplianceScale,
      }),
    ),
    MAIN_WIRE_PROVISIONAL_NORMAL_ADULT_CORONARY_EVIDENCE_V2
      .largeArterialComplianceScale,
  );
  return applyBeatingReferenceR1CalibrationV2(
    compliancePrior,
    MAIN_WIRE_PROVISIONAL_NORMAL_ADULT_R1_CALIBRATION_V2,
  );
}

export const MAIN_WIRE_PROVISIONAL_NORMAL_ADULT_CORONARY_PRIOR_V2 =
  createMainWireProvisionalNormalAdultCoronaryPriorV2();

export const MAIN_WIRE_PROVISIONAL_NORMAL_ADULT_CORONARY_COLLAPSE_V2:
CoronaryCollapseHydraulicsPriorV2 = buildCoronaryCollapseHydraulicsPriorV2(
  buildCoronaryTopologyV2(
    MAIN_WIRE_PROVISIONAL_NORMAL_ADULT_CORONARY_PRIOR_V2,
  ),
  MAIN_WIRE_PROVISIONAL_NORMAL_ADULT_CORONARY_EVIDENCE_V2
    .collapseResidualHydraulicAreaFraction,
);

export const MAIN_WIRE_PROVISIONAL_NORMAL_ADULT_CORONARY_PRIOR_FINGERPRINT_V2 =
  coronaryTopologyPriorFingerprintV2(
    MAIN_WIRE_PROVISIONAL_NORMAL_ADULT_CORONARY_PRIOR_V2,
  );
