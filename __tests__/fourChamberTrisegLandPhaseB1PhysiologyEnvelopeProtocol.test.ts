import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  evaluateSignedFlowMomentumV1,
  evaluateValveMomentumV1,
} from "@/engine/myocardium/fourChamberV1/flows/signedFlowLossV1";
import {
  PHASE_B1_PHYSIOLOGY_ENVELOPE_CASE_POLICY_V1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1PhysiologyEnvelopeCaseV1";
import {
  PHASE_B1_PHYSIOLOGY_ENVELOPE_PROTOCOL_V1,
  buildPhaseB1PhysiologyEnvelopeCenterOverlayV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1PhysiologyEnvelopeProtocolV1";
import type {
  PhaseB1QuiescentReferenceEventFreeCaseV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1QuiescentReferenceEventFreeCaseV1";
import {
  buildPhaseB1SyntheticEventFreeMonolithicCaseV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/syntheticEventFreeMonolithicCaseV1";

const VALVE_IDS = ["Q_MV", "Q_AoV", "Q_TV", "Q_PuV"] as const;
const INLET_IDS = ["Q_VC", "Q_PV"] as const;

describe("Phase B1 physiology-envelope center protocol", () => {
  const syntheticOn = buildPhaseB1SyntheticEventFreeMonolithicCaseV1(
    "on",
    sha256,
  );
  const sourceOn = syntheticOn as unknown as
    PhaseB1QuiescentReferenceEventFreeCaseV1;

  it("emits the exact case-overlay key topology and pins SI center values", () => {
    const overlay = buildPhaseB1PhysiologyEnvelopeCenterOverlayV1(sourceOn);
    expect(Object.keys(overlay)).toEqual([
      "totalBloodVolumeM3",
      "vascularComplianceM3PerPaByCompartment",
      "peripheralResistancePaSecPerM3ByFlow",
      "valveLossParametersByFlow",
      "inletLossParametersByFlow",
    ]);
    expect(Object.keys(overlay.vascularComplianceM3PerPaByCompartment))
      .toEqual(["SA", "SV", "PA", "PV"]);
    expect(Object.keys(overlay.peripheralResistancePaSecPerM3ByFlow))
      .toEqual(["Q_sys", "Q_pul"]);
    expect(Object.keys(overlay.valveLossParametersByFlow)).toEqual(VALVE_IDS);
    expect(Object.keys(overlay.inletLossParametersByFlow)).toEqual(INLET_IDS);
    expect(overlay.totalBloodVolumeM3).toBe(5.6e-3);
    expect(overlay.vascularComplianceM3PerPaByCompartment).toEqual({
      SA: 11.25e-9,
      SV: 750e-9,
      PA: 30e-9,
      PV: 112.5e-9,
    });
    expect(overlay.peripheralResistancePaSecPerM3ByFlow).toEqual({
      Q_sys: 1.25e8,
      Q_pul: 1.1e7,
    });
    expect(Object.isFrozen(overlay)).toBe(true);
  });

  it("treats the SV residual as an initialization bootstrap, not an accepted physiological distribution", () => {
    expect(PHASE_B1_PHYSIOLOGY_ENVELOPE_CASE_POLICY_V1).toMatchObject({
      totalBloodVolumeResidualOwner: "SV",
      totalBloodVolumeResidualRole:
        "initial-pressure-preserving-bootstrap-only",
      failedPressureOrVolumeGateAction:
        "reject-candidate-and-rebuild-declared-multicompartment-initial-allocation",
      physiologicalDistributionEstablishedBySvResidual: false,
      projectionAllowed: false,
    });
  });

  it("executes the declared Stage 0 through Stage 5 owner order", () => {
    expect(PHASE_B1_PHYSIOLOGY_ENVELOPE_PROTOCOL_V1.ownerStages.map((owner) => [
      owner.stage,
      owner.ownerId,
    ])).toEqual([
      [0, "numerical-closure-and-initialization"],
      [1, "vascular-operating-point"],
      [2, "anatomical-wall-geometry"],
      [3, "valve-hydraulics"],
      [4, "activation-and-relaxation"],
      [5, "held-out-observers"],
    ]);
  });

  it("rejects the exploratory center back to Stage 0 and exposes no false preload sweep", () => {
    expect(PHASE_B1_PHYSIOLOGY_ENVELOPE_PROTOCOL_V1.centerAssessment)
      .toMatchObject({
        status: "failed-rejected-exploratory-candidate",
        eligibleAsNormalOperatingPoint: false,
        eligibleAsPeriodicEvidence: false,
        firstUnmetGateId: "blood-volume-conservation-and-period-1",
        nextOwner: {
          stage: 0,
          ownerId: "numerical-closure-and-initialization",
        },
      });
    expect(PHASE_B1_PHYSIOLOGY_ENVELOPE_PROTOCOL_V1.oneAtATimeBrackets
      .totalBloodVolumeM3).toEqual({
        status: "disabled-unavailable",
        valuesM3: null,
        prerequisite:
          "declared-multicompartment-stressed-volume-allocation-and-v0-policy",
        currentSvResidualBootstrapIsPreloadSweep: false,
        rationale:
          "changing TBV while cancelling the SV residual with the same V0 change preserves pressure and is a bootstrap null-space, not a preload perturbation",
      });
  });

  it("keeps fixed phase windows outside acceptance and Doppler claims", () => {
    expect(PHASE_B1_PHYSIOLOGY_ENVELOPE_PROTOCOL_V1.fillingPhaseWindowPolicy)
      .toMatchObject({
        status: "exploratory-secondary-readback-only",
        clinicalDopplerMappingValidated: false,
        contributesToNormalAcceptanceGate: false,
        usedForParameterFit: false,
        usedForCandidateRanking: false,
      });
  });

  it("updates both valve loss area and inertial reference area without drifting other fields", () => {
    const overlay = buildPhaseB1PhysiologyEnvelopeCenterOverlayV1(sourceOn);
    const centerAreas = PHASE_B1_PHYSIOLOGY_ENVELOPE_PROTOCOL_V1.center
      .valveOpenAreaM2ByFlow;
    for (const flowId of VALVE_IDS) {
      const source = syntheticOn.model.closedLoopParameters
        .valveLossParametersByFlow[flowId];
      const destination = overlay.valveLossParametersByFlow[flowId];
      expect(Object.keys(destination)).toEqual(Object.keys(source));
      expect(destination.openAreaM2).toBe(centerAreas[flowId]);
      expect(destination.inertialReferenceAreaM2).toBe(centerAreas[flowId]);
      for (const key of Object.keys(source) as (keyof typeof source)[]) {
        if (key === "openAreaM2" || key === "inertialReferenceAreaM2") continue;
        expect(destination[key]).toBe(source[key]);
      }
      expect(() => evaluateValveMomentumV1(destination, 0, 0)).not.toThrow();
    }
  });

  it("overlays inlet L/R/B in SI units, retains smoothing, and rejects SLS-off", () => {
    const overlay = buildPhaseB1PhysiologyEnvelopeCenterOverlayV1(sourceOn);
    const expectedLinearResistance = { Q_VC: 5.33e6, Q_PV: 4.03e6 } as const;
    for (const flowId of INLET_IDS) {
      const source = syntheticOn.model.closedLoopParameters
        .inletLossParametersByFlow[flowId];
      const destination = overlay.inletLossParametersByFlow[flowId];
      expect(Object.keys(destination)).toEqual(Object.keys(source));
      expect(destination.inertancePaSec2PerM3).toBe(2e4);
      expect(destination.linearResistancePaSecPerM3)
        .toBe(expectedLinearResistance[flowId]);
      expect(destination.quadraticResistancePaSec2PerM6).toBe(1e9);
      expect(destination.flowSmoothingM3PerSec).toBe(
        source.flowSmoothingM3PerSec,
      );
      expect(() => evaluateSignedFlowMomentumV1(destination, 0, 0)).not.toThrow();
    }

    const sourceOff = buildPhaseB1SyntheticEventFreeMonolithicCaseV1(
      "off",
      sha256,
    ) as unknown as PhaseB1QuiescentReferenceEventFreeCaseV1;
    expect(() => buildPhaseB1PhysiologyEnvelopeCenterOverlayV1(sourceOff))
      .toThrow(/SLS-on warm start/);
  });
});

function sha256(canonicalJsonUtf8: string): string {
  return createHash("sha256").update(canonicalJsonUtf8).digest("hex");
}
