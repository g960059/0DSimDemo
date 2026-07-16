import type {
  PhaseB1QuiescentReferenceEventFreeCaseV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1QuiescentReferenceEventFreeCaseV1";
import type {
  PhaseB1PhysiologyEnvelopeOverlayV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1PhysiologyEnvelopeCaseV1";
import type {
  SignedFlowLossParametersV1,
  ValveLossParametersV1,
} from "@/engine/myocardium/fourChamberV1/flows/signedFlowLossV1";

type PhysiologyEnvelopePhaseWindowV1 = Readonly<{
  windowId: string;
  startPhaseSec: number;
  endPhaseSec: number;
}>;

export type PhaseB1PhysiologyEnvelopeProtocolFillingWindowsV1 = Readonly<{
  mitralEarly: PhysiologyEnvelopePhaseWindowV1;
  mitralAtrial: PhysiologyEnvelopePhaseWindowV1;
  pulmonaryVenousSystolic: PhysiologyEnvelopePhaseWindowV1;
  pulmonaryVenousDiastolic: PhysiologyEnvelopePhaseWindowV1;
  pulmonaryVenousAtrialReversal: PhysiologyEnvelopePhaseWindowV1;
}>;

export const PHASE_B1_PHYSIOLOGY_ENVELOPE_PROTOCOL_V1_ID =
  "phase-b1-four-chamber-physiology-envelope-protocol-v1" as const;

export const PHASE_B1_PHYSIOLOGY_ENVELOPE_CENTER_ID =
  "normal-adult-center-sls-on-v1" as const;

export const PHASE_B1_PHYSIOLOGY_ENVELOPE_PROTOCOL_V1 = deepFreeze({
  protocolId: PHASE_B1_PHYSIOLOGY_ENVELOPE_PROTOCOL_V1_ID,
  centerId: PHASE_B1_PHYSIOLOGY_ENVELOPE_CENTER_ID,
  status:
    "prospective-physiology-envelope-not-calibration-or-validation",
  rhythm: {
    heartRateBpm: 75,
    cycleLengthSec: 0.8,
    scheduleOwner: "phase-b1-project-synthetic-normal-sinus-schedule",
  },
  center: {
    totalBloodVolumeM3: 5.6e-3,
    vascularComplianceM3PerPaByCompartment: {
      SA: 11.25e-9,
      SV: 750e-9,
      PA: 30e-9,
      PV: 112.5e-9,
    },
    peripheralResistancePaSecPerM3ByFlow: {
      Q_sys: 1.25e8,
      Q_pul: 1.1e7,
    },
    valveOpenAreaM2ByFlow: {
      Q_MV: 5e-4,
      Q_AoV: 3.5e-4,
      Q_TV: 8e-4,
      Q_PuV: 4e-4,
    },
    inletLinearResistancePaSecPerM3ByFlow: {
      Q_VC: 5.33e6,
      Q_PV: 4.03e6,
    },
    inletInertancePaSec2PerM3: 2e4,
    inletQuadraticResistancePaSec2PerM6: 1e9,
  },
  fillingPhaseWindows: {
    mitralEarly: {
      windowId: "mitral-early-filling",
      startPhaseSec: 0.42,
      endPhaseSec: 0.66,
    },
    mitralAtrial: {
      windowId: "mitral-atrial-filling",
      startPhaseSec: 0,
      endPhaseSec: 0.18,
    },
    pulmonaryVenousSystolic: {
      windowId: "pulmonary-venous-systolic-forward",
      startPhaseSec: 0.20,
      endPhaseSec: 0.48,
    },
    pulmonaryVenousDiastolic: {
      windowId: "pulmonary-venous-diastolic-forward",
      startPhaseSec: 0.48,
      endPhaseSec: 0.74,
    },
    pulmonaryVenousAtrialReversal: {
      windowId: "pulmonary-venous-atrial-reversal",
      startPhaseSec: 0,
      endPhaseSec: 0.18,
    },
  } satisfies PhaseB1PhysiologyEnvelopeProtocolFillingWindowsV1,
  fillingPhaseWindowPolicy: {
    status: "exploratory-secondary-readback-only",
    clinicalDopplerMappingValidated: false,
    contributesToNormalAcceptanceGate: false,
    usedForParameterFit: false,
    usedForCandidateRanking: false,
    rationale:
      "fixed schedule-phase windows are diagnostic partitions, not validated mappings to clinical Doppler E/A or S/D/Ar events",
  },
  centerAssessment: {
    status: "failed-rejected-exploratory-candidate",
    eligibleAsNormalOperatingPoint: false,
    eligibleAsPeriodicEvidence: false,
    firstUnmetGateId: "blood-volume-conservation-and-period-1",
    nextOwner: {
      stage: 0,
      ownerId: "numerical-closure-and-initialization",
      action:
        "establish phase-consistent multicompartment initialization and periodic closure without post-run volume projection",
    },
  },
  ownerStages: [
    {
      stage: 0,
      ownerId: "numerical-closure-and-initialization",
      parameters: [
        "continuation-path",
        "Newton-scales-and-tolerances",
        "time-step-and-event-splitting",
        "phase-consistent-initial-state",
      ],
      purpose:
        "establish numerical integrity and period-1 closure before any physiological owner is changed",
    },
    {
      stage: 1,
      ownerId: "vascular-operating-point",
      parameters: [
        "totalBloodVolumeM3",
        "R_sys",
        "R_pul",
        "C_SA",
        "C_SV",
        "C_PA",
        "C_PV",
      ],
      purpose:
        "establish pressure, output, blood-volume, and left-right closure before waveform interpretation",
    },
    {
      stage: 2,
      ownerId: "anatomical-wall-geometry",
      parameters: [
        "LA-and-RA-wall-and-reference-cavity-volumes",
        "LVFW-SEP-and-RVFW-wall-volumes-and-reference-areas",
        "anatomy-owned-pericardial-reference-volume",
      ],
      purpose:
        "establish chamber-volume and wall-capacity plausibility while preserving the accepted vascular operating point",
    },
    {
      stage: 3,
      ownerId: "valve-hydraulics",
      parameters: [
        "A_MV",
        "A_AoV",
        "A_TV",
        "A_PuV",
        "R_VC",
        "R_PV",
      ],
      purpose:
        "establish forward gradients and filling-flow partition without wall retuning",
    },
    {
      stage: 4,
      ownerId: "activation-and-relaxation",
      parameters: [],
      purpose:
        "reserved: Land and calcium timing remain fixed until stages 1 through 3 pass",
    },
    {
      stage: 5,
      ownerId: "held-out-observers",
      parameters: [],
      purpose:
        "read back atrial PV loops, x/y descents, and venous-flow morphology without selecting a candidate",
    },
  ],
  oneAtATimeBrackets: {
    totalBloodVolumeM3: {
      status: "disabled-unavailable",
      valuesM3: null,
      prerequisite:
        "declared-multicompartment-stressed-volume-allocation-and-v0-policy",
      currentSvResidualBootstrapIsPreloadSweep: false,
      rationale:
        "changing TBV while cancelling the SV residual with the same V0 change preserves pressure and is a bootstrap null-space, not a preload perturbation",
    },
    systemicResistancePaSecPerM3: [1.0e8, 1.5e8],
    pulmonaryResistancePaSecPerM3: [0.8e7, 1.4e7],
    systemicArterialComplianceM3PerPa: [7.5e-9, 16.9e-9],
    systemicVenousComplianceM3PerPa: [560e-9, 940e-9],
    pulmonaryArterialComplianceM3PerPa: [22.5e-9, 45e-9],
    pulmonaryVenousComplianceM3PerPa: [75e-9, 150e-9],
    mitralOpenAreaM2: [4e-4, 6e-4],
    pulmonaryVenousInletResistancePaSecPerM3: [2.7e6, 5.4e6],
  },
  selectionPolicy: {
    simultaneousGridSearchAllowed: false,
    oneOwnerAtATimeRequired: true,
    scalarObjectiveAllowed: false,
    candidateRankingAllowed: false,
    atrialPvLoopMayGate: false,
    atrialPvLoopMaySelect: false,
  },
  fixedDuringCurrentCenterStage0And1Run: {
    wallGeometry: true,
    wallMaterialVolumes: true,
    LandCellularParameters: true,
    passiveEquilibriumMaterial: true,
    passiveSlsParameters: true,
    calciumEventSchedule: true,
    dynamicAvPlaneStateAbsent: true,
  },
  claimBoundary: {
    physiologyEnvelopeExplorationOnly: true,
    patientFit: false,
    normalHumanCalibrationAchieved: false,
    atrialPvMorphologyAcceptance: false,
    runtimeAdoption: false,
    releaseRuntimeReachable: false,
  },
});

export function buildPhaseB1PhysiologyEnvelopeCenterOverlayV1(
  sourceCase: PhaseB1QuiescentReferenceEventFreeCaseV1,
): PhaseB1PhysiologyEnvelopeOverlayV1 {
  if (sourceCase.slsMode !== "on") {
    throw new Error("the physiology-envelope center requires the SLS-on warm start");
  }
  const source = sourceCase.model.closedLoopParameters;
  const center = PHASE_B1_PHYSIOLOGY_ENVELOPE_PROTOCOL_V1.center;
  return deepFreeze({
    totalBloodVolumeM3: center.totalBloodVolumeM3,
    vascularComplianceM3PerPaByCompartment:
      center.vascularComplianceM3PerPaByCompartment,
    peripheralResistancePaSecPerM3ByFlow:
      center.peripheralResistancePaSecPerM3ByFlow,
    valveLossParametersByFlow: {
      Q_MV: valveWithArea(source.valveLossParametersByFlow.Q_MV, center.valveOpenAreaM2ByFlow.Q_MV),
      Q_AoV: valveWithArea(source.valveLossParametersByFlow.Q_AoV, center.valveOpenAreaM2ByFlow.Q_AoV),
      Q_TV: valveWithArea(source.valveLossParametersByFlow.Q_TV, center.valveOpenAreaM2ByFlow.Q_TV),
      Q_PuV: valveWithArea(source.valveLossParametersByFlow.Q_PuV, center.valveOpenAreaM2ByFlow.Q_PuV),
    },
    inletLossParametersByFlow: {
      Q_VC: inletWithResistance(
        source.inletLossParametersByFlow.Q_VC,
        center.inletLinearResistancePaSecPerM3ByFlow.Q_VC,
      ),
      Q_PV: inletWithResistance(
        source.inletLossParametersByFlow.Q_PV,
        center.inletLinearResistancePaSecPerM3ByFlow.Q_PV,
      ),
    },
  });
}

function valveWithArea(
  source: ValveLossParametersV1,
  areaM2: number,
): ValveLossParametersV1 {
  return Object.freeze({
    ...source,
    openAreaM2: areaM2,
    inertialReferenceAreaM2: areaM2,
  });
}

function inletWithResistance(
  source: SignedFlowLossParametersV1,
  linearResistancePaSecPerM3: number,
): SignedFlowLossParametersV1 {
  const center = PHASE_B1_PHYSIOLOGY_ENVELOPE_PROTOCOL_V1.center;
  return Object.freeze({
    ...source,
    inertancePaSec2PerM3: center.inletInertancePaSec2PerM3,
    linearResistancePaSecPerM3,
    quadraticResistancePaSec2PerM6:
      center.inletQuadraticResistancePaSec2PerM6,
  });
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const nested of Object.values(value as Record<string, unknown>)) {
      deepFreeze(nested);
    }
  }
  return value;
}
