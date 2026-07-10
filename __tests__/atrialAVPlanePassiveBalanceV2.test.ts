import { describe, expect, it } from "vitest";

import { expectMechanics2ReportArtifactParity } from
  "@/__tests__/helpers/mechanics2ReportParity";
import passiveBalanceArtifact from
  "@/data/mechanics2/reports/atrial-av-plane-passive-balance-report-v2.json";
import passiveBalanceCalibrationArtifact from
  "@/data/mechanics2/reports/atrial-av-plane-passive-balance-calibration-v2.json";

import {
  PASSIVE_BALANCE_PARAMS_V2,
  runAtrialAVPlanePassiveBalanceBenchV2,
} from "@/engine/mechanics2/benches/AtrialAVPlanePassiveBalanceBenchV2";
import {
  evaluateSharedAVPlaneStateV1,
  type SharedAVPlaneInputV1,
  type SharedAVPlaneParamsV1,
} from "@/engine/mechanics2/core/SharedAVPlaneV1";
import { buildAtrialAVPlanePassiveBalanceCalibrationV2 } from
  "@/tools/mechanics2/calibrateAtrialAVPlanePassiveBalanceV2";

const input: SharedAVPlaneInputV1 = {
  dtSec: 0.01,
  atrialTransmuralPressureMmHg: 9,
  ventricularTransmuralPressureMmHg: 5,
  atrialActiveStressKPa: 2,
  ventricularActiveStressKPa: 25,
};

describe("AV-plane passive balance v2", () => {
  it("separates wall geometry from the passive spring neutral position", () => {
    const params = PASSIVE_BALANCE_PARAMS_V2.avPlane;
    const shiftedNeutral: SharedAVPlaneParamsV1 = {
      ...params,
      passiveNeutralPositionCm: 0.5,
    };
    const previous = { positionCm: 0.2, velocityCmPerSec: 1.1 };
    const state = { positionCm: 0.25, velocityCmPerSec: 1.3 };
    const base = evaluateSharedAVPlaneStateV1(previous, state, input, params);
    const shifted = evaluateSharedAVPlaneStateV1(previous, state, input, shiftedNeutral);

    expect(shifted.atrialDisplacedVolumeMl).toBe(base.atrialDisplacedVolumeMl);
    expect(shifted.ventricularDisplacedVolumeMl).toBe(base.ventricularDisplacedVolumeMl);
    expect(shifted.hydraulicForceN).toBe(base.hydraulicForceN);
    expect(shifted.springForceN - base.springForceN).toBeCloseTo(
      params.stiffnessNPerCm * 0.5,
      12,
    );
  });

  it("is invariant when position, geometry reference, and passive neutral share a coordinate shift", () => {
    const params: SharedAVPlaneParamsV1 = {
      ...PASSIVE_BALANCE_PARAMS_V2.avPlane,
      referencePositionCm: 0.1,
      passiveNeutralPositionCm: 0.2,
    };
    const previous = { positionCm: 0.3, velocityCmPerSec: -0.4 };
    const state = { positionCm: 0.35, velocityCmPerSec: -0.2 };
    const base = evaluateSharedAVPlaneStateV1(previous, state, input, params);
    const shiftCm = 1.25;
    const shifted = evaluateSharedAVPlaneStateV1(
      { ...previous, positionCm: previous.positionCm + shiftCm },
      { ...state, positionCm: state.positionCm + shiftCm },
      input,
      {
        ...params,
        referencePositionCm: params.referencePositionCm + shiftCm,
        passiveNeutralPositionCm: params.passiveNeutralPositionCm! + shiftCm,
      },
    );

    expect(shifted.positionCm - base.positionCm).toBeCloseTo(shiftCm, 12);
    expect(shifted.atrialDisplacedVolumeMl).toBeCloseTo(base.atrialDisplacedVolumeMl, 12);
    expect(shifted.ventricularDisplacedVolumeMl).toBeCloseTo(
      base.ventricularDisplacedVolumeMl,
      12,
    );
    expect(shifted.springForceN).toBeCloseTo(base.springForceN, 12);
    expect(shifted.forceBalanceResidualN).toBeCloseTo(base.forceBalanceResidualN, 12);
  });

  it("records the mechanistic improvement and the unresolved morphology tradeoff", () => {
    const report = runAtrialAVPlanePassiveBalanceBenchV2();
    const variant = (variantId: string) =>
      report.variants.find((row) => row.variantId === variantId)!;
    const passive = variant("passive-balance");
    const bracket = variant("passive-balance-la-contractility-bracket");

    expect(report.gates.numericalPass).toBe(true);
    expect(report.gates.conservationPass).toBe(true);
    expect(report.gates.dtParityPass).toBe(true);
    expect(report.gates.passiveCandidateObservationPass).toBe(true);
    expect(
      report.supportingEvidence.activeForceProjectionWithinPublishedInputBracket,
    ).toBe(false);
    expect(report.gates.diastaticPassiveHydraulicOppositionPass).toBe(true);
    expect(report.gates.passiveCandidateBloodVolumeTopologyPass).toBe(false);
    expect(report.gates.passiveCandidateMitralWavePass).toBe(false);
    expect(report.gates.laContractilityBracketMitralPass).toBe(true);
    expect(report.gates.laContractilityBracketBloodVolumeTopologyPass).toBe(false);
    expect(report.gates.jointMechanisticCandidatePass).toBe(false);
    expect(report.gates.k0NegativeControlRetained).toBe(true);
    expect(report.gates.passiveNeutralIdentifiabilityWarningPresent).toBe(true);

    expect(passive.diastasis.hydraulicForceN).toBeLessThan(-1);
    expect(passive.diastasis.springForceN).toBeGreaterThan(1);
    expect(passive.diastasis.quasiStaticAvPlanePass).toBe(true);
    expect(passive.diastasis.mitralFlowFractionOfPeak).toBeLessThanOrEqual(0.1);
    expect(Math.abs(passive.diastasis.dampingForceN)).toBeLessThanOrEqual(1);
    expect(Math.abs(passive.diastasis.inertialForceN)).toBeLessThanOrEqual(1);
    expect(Math.abs(passive.diastasis.fullDynamicResidualN)).toBeLessThan(1e-4);
    expect(passive.profile.avPlaneDisplacementCm).toBeGreaterThan(1);
    expect(bracket.profile.mitralPeakVelocityEToARatio).toBeGreaterThanOrEqual(0.69);
    expect(bracket.profile.mitralPeakVelocityEToARatio).toBeLessThanOrEqual(2.07);
    expect("samples" in passive.profile).toBe(false);
    expect(report.envelopeDiagnostics.allNumerical).toBe(true);
    expect(report.decision.status).toBe("mechanistic-tradeoff-no-joint-candidate");
  });

  it("keeps the committed main report and hash aligned with a clean rerun", () => {
    expectMechanics2ReportArtifactParity(
      passiveBalanceArtifact,
      runAtrialAVPlanePassiveBalanceBenchV2(),
    );
  });

  it("keeps the committed calibration and hash aligned with all 288 reruns", () => {
    const rerun = buildAtrialAVPlanePassiveBalanceCalibrationV2();

    expect(rerun.testedCount).toBe(288);
    expectMechanics2ReportArtifactParity(
      passiveBalanceCalibrationArtifact,
      rerun,
    );
  }, 120_000);
});
