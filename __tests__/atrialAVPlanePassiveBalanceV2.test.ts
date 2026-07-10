import { describe, expect, it } from "vitest";

import { expectMechanics2ReportArtifactParity } from
  "@/__tests__/helpers/mechanics2ReportParity";
import passiveBalanceArtifact from
  "@/data/mechanics2/reports/atrial-av-plane-passive-balance-report-v2.json";
import passiveBalanceCalibrationArtifact from
  "@/data/mechanics2/reports/atrial-av-plane-passive-balance-calibration-v2.json";

import {
  ATRIAL_AV_PLANE_PASSIVE_BALANCE_ACCEPTANCE_V2,
  evaluateAtrialAVPlanePassiveBalanceAcceptanceV2,
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
    const baseline = variant("v1-baseline");
    const k0 = variant("k0-negative-control");
    const k0Diagnostics = report.negativeControlDiagnostics;
    const passiveFlags = evaluateAtrialAVPlanePassiveBalanceAcceptanceV2({
      profile: passive.profile,
      prime: passive.prime,
      lateDiastolicWindow: passive.lateDiastolicWindow,
      baselineProfile: baseline.profile,
      baselinePrime: baseline.prime,
    });

    expect(report.gates.numericalPass).toBe(true);
    expect(report.gates.conservationPass).toBe(true);
    expect(report.gates.dtParityPass).toBe(true);
    expect(report.gates.passiveCandidateObservationPass).toBe(false);
    expect(report.gates.passiveCandidateNonCollapsePass).toBe(true);
    expect(report.gates.passiveCandidateAPrimeMagnitudeNonCollapsePass).toBe(false);
    expect(
      report.supportingEvidence.activeForceProjectionWithinPublishedInputBracket,
    ).toBe(false);
    expect(report.gates.diastaticPassiveHydraulicOppositionPass).toBe(false);
    expect(report.gates.passiveCandidateBloodVolumeTopologyPass).toBe(false);
    expect(report.gates.passiveCandidateMitralWavePass).toBe(false);
    expect(report.gates.laContractilityBracketMitralPass).toBe(true);
    expect(report.gates.laContractilityBracketBloodVolumeTopologyPass).toBe(false);
    expect(report.gates.jointMechanisticCandidatePass).toBe(false);
    expect(report.gates.k0NegativeControlRetained).toBe(true);
    expect(report.gates.k0NegativeControlRetained).toBe(
      k0Diagnostics.k0ZeroStiffnessPass &&
      k0Diagnostics.k0ZeroSpringForcePass &&
      k0Diagnostics.k0NonPeriodicPass &&
      k0Diagnostics.k0ClosureDriftPass,
    );
    expect(report.gates.passiveNeutralIdentifiabilityWarningPresent).toBe(true);
    expect(passiveFlags.candidateObservationPass)
      .toBe(report.gates.passiveCandidateObservationPass);
    expect(passiveFlags.mechanicsPass)
      .toBe(report.gates.diastaticPassiveHydraulicOppositionPass);
    expect(passiveFlags.bloodVolumeTopologyEngineeringPass)
      .toBe(report.gates.passiveCandidateBloodVolumeTopologyPass);
    expect(passiveFlags.mitralWavePass)
      .toBe(report.gates.passiveCandidateMitralWavePass);
    expect(passiveFlags.jointCandidatePass)
      .toBe(report.gates.jointMechanisticCandidatePass);
    expect(passiveFlags.aPrimeMagnitudeNonCollapsePass).toBe(false);
    expect(passiveFlags.pressureSanityPass).toBe(true);
    expect(passiveFlags.lateDiastolicHydraulicMagnitudePass).toBe(true);
    expect(passiveFlags.trueLobeIntersectionAnglePass).toBe(
      passive.profile.lobeMeasurementStatus === "measurable" &&
      passive.profile.lobeSelfIntersectionAngleDeg >=
        ATRIAL_AV_PLANE_PASSIVE_BALANCE_ACCEPTANCE_V2
          .bloodVolumeTopologyEngineering.minimumTrueLobeIntersectionAngleDeg,
    );
    expect(passiveFlags.trueLobePhaseCrossingMatchPass)
      .toBe(passive.profile.lobePhaseCrossingMatchPass);
    expect(passive.profile.lobePhaseCrossingMatchDistance01)
      .toBeGreaterThanOrEqual(0);
    expect(passiveFlags.legacyPhaseCrossingWindowPass)
      .toBe(passive.profile.figureEightCrossingInPreferredWindow);

    expect(passive.diastasis.diagnosticRole).toBe("legacy-best-point-not-acceptance");
    expect(passive.diastasis.hydraulicForceN).toBeLessThan(-1);
    expect(passive.diastasis.springForceN).toBeGreaterThan(1);
    expect(passive.diastasis.quasiStaticAvPlanePass).toBe(true);
    expect(passive.diastasis.mitralFlowFractionOfPeak).toBeLessThanOrEqual(0.1);
    expect(Math.abs(passive.diastasis.dampingForceN)).toBeLessThanOrEqual(1);
    expect(Math.abs(passive.diastasis.inertialForceN)).toBeLessThanOrEqual(1);
    expect(Math.abs(passive.diastasis.fullDynamicResidualN)).toBeLessThan(1e-4);
    expect(passive.lateDiastolicWindow.applicability).toBe("measurable");
    expect(passive.lateDiastolicWindow.durationSec).toBeGreaterThanOrEqual(
      ATRIAL_AV_PLANE_PASSIVE_BALANCE_ACCEPTANCE_V2.lateDiastolicWindow
        .minimumDurationSec,
    );
    expect(passive.lateDiastolicWindow.durationSec).toBeLessThanOrEqual(
      ATRIAL_AV_PLANE_PASSIVE_BALANCE_ACCEPTANCE_V2.lateDiastolicWindow
        .maximumDurationSec,
    );
    expect(passive.lateDiastolicWindow.sampleCount).toBeGreaterThanOrEqual(
      ATRIAL_AV_PLANE_PASSIVE_BALANCE_ACCEPTANCE_V2.lateDiastolicWindow
        .minimumSampleCount,
    );
    expect(passive.lateDiastolicWindow.thetaEnd).toBeLessThan(
      passive.profile.events.preATheta,
    );
    expect(passive.lateDiastolicWindow.passiveHydraulicMedianOpposed).toBe(true);
    expect(passive.lateDiastolicWindow.passiveHydraulicOpposedSampleFraction)
      .toBeGreaterThanOrEqual(
        ATRIAL_AV_PLANE_PASSIVE_BALANCE_ACCEPTANCE_V2.lateDiastolicWindow
          .minimumPassiveHydraulicOpposedFraction,
      );
    expect(passiveFlags.lateDiastolicOpposedForcePass).toBe(
      passive.lateDiastolicWindow.passiveHydraulicOpposedSampleFraction >=
        ATRIAL_AV_PLANE_PASSIVE_BALANCE_ACCEPTANCE_V2.lateDiastolicWindow
          .minimumPassiveHydraulicOpposedFraction,
    );
    expect(passive.lateDiastolicWindow.hydraulicForceN.medianAbs)
      .toBeGreaterThanOrEqual(
        ATRIAL_AV_PLANE_PASSIVE_BALANCE_ACCEPTANCE_V2.lateDiastolicWindow
          .medianAbsHydraulicForceRangeN[0],
      );
    expect(passive.lateDiastolicWindow.hydraulicForceN.medianAbs)
      .toBeLessThanOrEqual(
        ATRIAL_AV_PLANE_PASSIVE_BALANCE_ACCEPTANCE_V2.lateDiastolicWindow
          .medianAbsHydraulicForceRangeN[1],
      );
    expect(passive.lateDiastolicWindow.quasiStaticAvPlanePass).toBe(false);
    expect(passive.lateDiastolicWindow.quasiStaticResidualAbsN.max)
      .toBeLessThanOrEqual(
        ATRIAL_AV_PLANE_PASSIVE_BALANCE_ACCEPTANCE_V2.lateDiastolicWindow
          .maxAbsQuasiStaticResidualN,
      );
    expect(passive.lateDiastolicWindow.dynamicToHydraulicForceRatio.p95)
      .toBeGreaterThan(
        ATRIAL_AV_PLANE_PASSIVE_BALANCE_ACCEPTANCE_V2.lateDiastolicWindow
          .maxDynamicToHydraulicForceRatioP95,
      );
    expect(passive.prime.aPrimeCmPerSec).toBe(Math.max(
      passive.prime.aPrimeBasewardCmPerSec,
      passive.prime.aPrimeApexwardCmPerSec,
    ));
    expect(report.comparisons.passiveCandidateAPrimeMagnitudeRatioToV1)
      .toBeLessThan(
        ATRIAL_AV_PLANE_PASSIVE_BALANCE_ACCEPTANCE_V2.observation
          .minimumAPrimeMagnitudeRatioToV1,
      );
    expect(["baseward", "apexward", "balanced"])
      .toContain(passive.prime.aPrimeDominantDirection);
    expect(passive.profile.avPlaneDisplacementCm).toBeGreaterThan(1);
    expect(bracket.profile.mitralPeakVelocityEToARatio).toBeGreaterThanOrEqual(0.69);
    expect(bracket.profile.mitralPeakVelocityEToARatio).toBeLessThanOrEqual(2.07);
    expect(k0.params.avPlane.stiffnessNPerCm).toBe(0);
    expect(k0.profile.periodicSteadyState).toBe(false);
    expect(k0.profile.allStepsConverged).toBe(false);
    expect(k0.profile.maxAbsAvPlaneForceResidualN).toBeGreaterThan(1);
    expect(report.negativeControlDiagnostics.k0ClosureDriftMl).toBeGreaterThanOrEqual(1);
    expect(k0Diagnostics.k0SolverFailureObserved).toBe(true);
    expect(k0Diagnostics.k0AllStepsConverged).toBe(k0.profile.allStepsConverged);
    expect("samples" in passive.profile).toBe(false);
    expect(report.envelopeDiagnostics.allNumerical).toBe(true);
    expect(report.decision.status).toBe("mechanistic-tradeoff-no-joint-candidate");
  });

  it("uses the shared acceptance predicate for all 288 calibration rows", () => {
    const rerun = buildAtrialAVPlanePassiveBalanceCalibrationV2();
    const definition = ATRIAL_AV_PLANE_PASSIVE_BALANCE_ACCEPTANCE_V2;

    expect(rerun.testedCount).toBe(288);
    expect(rerun.acceptanceDefinition)
      .toEqual(ATRIAL_AV_PLANE_PASSIVE_BALANCE_ACCEPTANCE_V2);
    expect(rerun.jointCandidateCount).toBe(
      rerun.candidates.filter((row) => row.passFlags.jointCandidatePass).length,
    );
    expect(rerun.jointCandidateCount).toBe(0);
    expect(rerun.candidates.every((row) =>
      row.passFlags.lobeMeasurementPass ===
        (row.lobeMeasurementStatus === "measurable")
    )).toBe(true);
    expect(rerun.candidates.every((row) =>
      row.passFlags.trueLobePhaseCrossingMatchPass === row.lobePhaseCrossingMatchPass &&
      typeof row.lobePhaseCrossingMatchDistance01 === "number"
    )).toBe(true);
    expect(rerun.candidates.every((row) =>
      row.passFlags.lateDiastolicWindowApplicablePass ===
        (row.lateDiastolicWindow.applicability === "measurable")
    )).toBe(true);
    expect(rerun.candidates.every((row) =>
      typeof row.lateDiastolicWindow.durationSec === "number" &&
      typeof row.lateDiastolicWindow.sampleCount === "number" &&
      typeof row.lateDiastolicWindow.hydraulicMedianAbsN === "number" &&
      typeof row.lateDiastolicWindow.passiveHydraulicOpposedSampleFraction ===
        "number" &&
      typeof row.lateDiastolicWindow.quasiStaticResidualMaxAbsN === "number" &&
      typeof row.lateDiastolicWindow.dynamicToHydraulicForceRatioP95 === "number" &&
      typeof row.lateDiastolicWindow.velocityMaxAbsCmPerSec === "number" &&
      typeof row.lateDiastolicWindow.mitralFlowFractionOfPeakMax === "number" &&
      !("hydraulicForceN" in row.lateDiastolicWindow) &&
      !("springForceN" in row.lateDiastolicWindow) &&
      !("dampingForceAbsN" in row.lateDiastolicWindow) &&
      !("inertialForceAbsN" in row.lateDiastolicWindow)
    )).toBe(true);
    expect(rerun.candidates.every((row) =>
      row.passFlags.pressureSanityPass ===
        (row.peakLaPressureMmHg <= definition.pressureSanity.peakLaPressureCeilingMmHg)
    )).toBe(true);
    expect(rerun.candidates.every((row) =>
      row.passFlags.aPrimeMagnitudeNonCollapsePass ===
        (
          row.aPrimeMagnitudeRatioToV1 >=
            definition.observation.minimumAPrimeMagnitudeRatioToV1
        )
    )).toBe(true);
    expect(rerun.candidates.every((row) =>
      row.passFlags.lateDiastolicHydraulicMagnitudePass ===
        (
          row.lateDiastolicWindow.hydraulicMedianAbsN >=
            definition.lateDiastolicWindow.medianAbsHydraulicForceRangeN[0] &&
          row.lateDiastolicWindow.hydraulicMedianAbsN <=
            definition.lateDiastolicWindow.medianAbsHydraulicForceRangeN[1]
        )
    )).toBe(true);
    expect(rerun.candidates.every((row) =>
      row.passFlags.lateDiastolicOpposedForcePass ===
        (
          row.lateDiastolicWindow.passiveHydraulicOpposedSampleFraction >=
            definition.lateDiastolicWindow.minimumPassiveHydraulicOpposedFraction
        )
    )).toBe(true);
    expect(rerun.candidates.every((row) =>
      row.passFlags.trueLobeIntersectionAnglePass ===
        (
          row.lobeMeasurementStatus === "measurable" &&
          row.lobeSelfIntersectionAngleDeg >=
            definition.bloodVolumeTopologyEngineering.minimumTrueLobeIntersectionAngleDeg
        )
    )).toBe(true);
    expect(rerun.candidates.every((row) =>
      row.passFlags.legacyPhaseCrossingWindowPass === row.figureEight
    )).toBe(true);
    expect(rerun.candidates.every((row) =>
      row.passFlags.bloodVolumeTopologyEngineeringPass ===
        (
          row.passFlags.lobeMeasurementPass &&
          row.passFlags.opposedLobeOrientationPass &&
          row.passFlags.trueLobeIntersectionAnglePass &&
          row.passFlags.trueLobePhaseCrossingMatchPass &&
          row.passFlags.legacyPhaseCrossingWindowPass &&
          row.passFlags.pathOrdering95Pass &&
          row.passFlags.loopAreaFloorPass &&
          row.passFlags.reservoirSecondaryPeakPass
        )
    )).toBe(true);
    expect(rerun.jointCandidates.every((row) =>
      row.passFlags.lobeMeasurementPass &&
      row.passFlags.opposedLobeOrientationPass &&
      row.passFlags.trueLobePhaseCrossingMatchPass &&
      row.passFlags.aPrimeMagnitudeNonCollapsePass &&
      row.passFlags.pressureSanityPass &&
      row.passFlags.lateDiastolicOpposedForcePass &&
      row.passFlags.lateDiastolicHydraulicMagnitudePass &&
      row.passFlags.mechanicsPass
    )).toBe(true);
  }, 120_000);

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
