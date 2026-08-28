import { describe, expect, it } from "vitest";

import { NON_CORONARY_NODE_NAMES_V1 } from "@/engine/core/nonCoronaryCirculationBackwardEulerV1";
import {
  resolveMainWireNormalAdultBloodVolumeResearchPointV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultBloodVolumeOperatingPointV1";
import {
  runMainWireNormalAdultFiveWallMacroPhysiologyEnvelopeV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallMacroPhysiologyEnvelopeV1";
import {
  MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_MACRO_PHYSIOLOGY_POINT_IDS_V1,
  MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_MACRO_PHYSIOLOGY_POINTS_V1,
  resolveMainWireNormalAdultFiveWallMacroPhysiologyPointV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallMacroPhysiologyPointsV1";
import {
  normalAdultMainWireRuntimeV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallClosedLoopV1";
import {
  createCanonicalMainWireNormalAdultFiveWallProviderV1,
  createFixedResearchMainWireNormalAdultFiveWallMaterialKernelsV1,
  createFixedResearchMainWireNormalAdultFiveWallProviderV1,
  resolveMainWireNormalAdultVentricularMaterialResearchPointV1,
  type MainWireNormalAdultWallMaterialReadbackV1,
} from "@/engine/myocardium/mechanics/MainWireNormalAdultFiveWallProviderV1";

describe("main-wire fixed macro physiology envelope V1", () => {
  it("exposes exactly seven sealed OFAT source-research points", () => {
    expect(MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_MACRO_PHYSIOLOGY_POINT_IDS_V1)
      .toEqual([
        "baseline",
        "ventricular-passive-low",
        "ventricular-passive-high",
        "ventricular-tref-low",
        "ventricular-tref-high",
        "stressed-venous-volume-low",
        "stressed-venous-volume-high",
      ]);
    expect(MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_MACRO_PHYSIOLOGY_POINTS_V1)
      .toHaveLength(7);
    for (const point of
      MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_MACRO_PHYSIOLOGY_POINTS_V1) {
      expect(point.claim).toMatchObject({
        sourceResearchRunnerOnly: true,
        fixedPointNotGenericPatch: true,
        oneFactorAtATime: true,
        warmStartAllowed: false,
      });
    }
    expect(() => resolveMainWireNormalAdultFiveWallMacroPhysiologyPointV1(
      "generic-patch" as never,
    )).toThrow(/unsupported fixed macro physiology point/i);
  });

  it("keeps the canonical provider byte-identical while resolving fixed research identities", () => {
    const canonical = createCanonicalMainWireNormalAdultFiveWallProviderV1();
    const researchBaseline =
      createFixedResearchMainWireNormalAdultFiveWallProviderV1("baseline");
    expect({
      providerId: researchBaseline.providerId,
      parameterSetId: researchBaseline.parameterSetId,
      parameterIdentityHash: researchBaseline.parameterIdentityHash,
      stateSchemaVersion: researchBaseline.stateSchemaVersion,
    }).toEqual({
      providerId: canonical.providerId,
      parameterSetId: canonical.parameterSetId,
      parameterIdentityHash: canonical.parameterIdentityHash,
      stateSchemaVersion: canonical.stateSchemaVersion,
    });

    const low = resolveMainWireNormalAdultVentricularMaterialResearchPointV1(
      "ventricular-tref-low",
    );
    const high = resolveMainWireNormalAdultVentricularMaterialResearchPointV1(
      "ventricular-tref-high",
    );
    expect(low.resolvedVentricularLandTrefPa).toBe(90_000);
    expect(high.resolvedVentricularLandTrefPa).toBe(160_000);
    expect(low.wallScope).toEqual(["LVFW", "SEP", "RVFW"]);
    expect(low.claim.independentLvAndRvEdpvrClaimed).toBe(false);

    const lengthDependence =
      resolveMainWireNormalAdultVentricularMaterialResearchPointV1(
        "ventricular-length-dependence-low",
      );
    expect(lengthDependence
      .ventricularLandLengthDependenceScaleFromBaseline).toBe(0.75);
    expect(lengthDependence.resolvedVentricularLandBeta0).toBeCloseTo(1.725);
    expect(lengthDependence.resolvedVentricularLandBeta1UM).toBeCloseTo(-1.8);
    expect(lengthDependence.resolvedVentricularLandTrefPa).toBe(120_000);
    expect(lengthDependence.claim.landBeta0AndBeta1ScaledTogether).toBe(true);
    expect(lengthDependence.claim.referenceLengthIsometricLandValuesUnchanged)
      .toBe(true);
    const halfLengthDependence =
      resolveMainWireNormalAdultVentricularMaterialResearchPointV1(
        "ventricular-length-dependence-half",
      );
    expect(halfLengthDependence
      .ventricularLandLengthDependenceScaleFromBaseline).toBe(0.5);
    expect(halfLengthDependence.resolvedVentricularLandBeta0).toBeCloseTo(1.15);
    expect(halfLengthDependence.resolvedVentricularLandBeta1UM).toBeCloseTo(-1.2);
    const quarterLengthDependence =
      resolveMainWireNormalAdultVentricularMaterialResearchPointV1(
        "ventricular-length-dependence-quarter",
      );
    expect(quarterLengthDependence
      .ventricularLandLengthDependenceScaleFromBaseline).toBe(0.25);
    expect(quarterLengthDependence.resolvedVentricularLandBeta0)
      .toBeCloseTo(0.575);
    expect(quarterLengthDependence.resolvedVentricularLandBeta1UM)
      .toBeCloseTo(-0.6);
    const lengthDependenceOff =
      resolveMainWireNormalAdultVentricularMaterialResearchPointV1(
        "ventricular-length-dependence-exact-off",
      );
    expect(lengthDependenceOff
      .ventricularLandLengthDependenceScaleFromBaseline).toBe(0);
    expect(lengthDependenceOff.resolvedVentricularLandBeta0).toBe(0);
    expect(lengthDependenceOff.resolvedVentricularLandBeta1UM).toBe(0);
    expect(lengthDependenceOff.resolvedVentricularLandTrefPa).toBe(120_000);
    const velocityDistortion =
      resolveMainWireNormalAdultVentricularMaterialResearchPointV1(
        "ventricular-velocity-distortion-high",
      );
    expect(velocityDistortion
      .ventricularLandVelocityDistortionScaleFromBaseline).toBe(4 / 3);
    expect(velocityDistortion.resolvedVentricularLandAeff)
      .toBeCloseTo(100 / 3);
    expect(velocityDistortion.resolvedVentricularLandBeta0).toBe(2.3);
    expect(velocityDistortion.claim.landAeffScaledWithDerivedAwAndAs)
      .toBe(true);
    const distortionRecovery =
      resolveMainWireNormalAdultVentricularMaterialResearchPointV1(
        "ventricular-distortion-recovery-high",
      );
    expect(distortionRecovery
      .ventricularLandDistortionRecoveryScaleFromBaseline).toBe(4 / 3);
    expect(distortionRecovery.resolvedVentricularLandPhi)
      .toBeCloseTo(2.23 * 4 / 3);
    expect(distortionRecovery.resolvedVentricularLandAeff).toBe(25);
    expect(distortionRecovery.claim.landPhiScaledWithDerivedCwAndCs)
      .toBe(true);
    const fastDistortionTransient =
      resolveMainWireNormalAdultVentricularMaterialResearchPointV1(
        "ventricular-distortion-transient-twofold",
      );
    expect(fastDistortionTransient
      .ventricularLandVelocityDistortionScaleFromBaseline).toBe(2);
    expect(fastDistortionTransient
      .ventricularLandDistortionRecoveryScaleFromBaseline).toBe(2);
    expect(fastDistortionTransient.resolvedVentricularLandAeff).toBe(50);
    expect(fastDistortionTransient.resolvedVentricularLandPhi).toBe(4.46);
    const combinedKinematics =
      resolveMainWireNormalAdultVentricularMaterialResearchPointV1(
        "ventricular-length-dependence-low-plus-velocity-distortion-high",
      );
    expect(combinedKinematics.resolvedVentricularLandBeta0)
      .toBeCloseTo(1.725);
    expect(combinedKinematics.resolvedVentricularLandAeff)
      .toBeCloseTo(100 / 3);
  });

  it("preserves fixed-length Land values at lambda one when beta0 and beta1 are scaled together", () => {
    const baseline =
      createFixedResearchMainWireNormalAdultFiveWallMaterialKernelsV1(
        "baseline",
      ).LVFW;
    const lowLengthDependence =
      createFixedResearchMainWireNormalAdultFiveWallMaterialKernelsV1(
        "ventricular-length-dependence-low",
      ).LVFW;
    const noLengthDependence =
      createFixedResearchMainWireNormalAdultFiveWallMaterialKernelsV1(
        "ventricular-length-dependence-exact-off",
      ).LVFW;
    const highVelocityDistortion =
      createFixedResearchMainWireNormalAdultFiveWallMaterialKernelsV1(
        "ventricular-velocity-distortion-high",
      ).LVFW;
    const combinedKinematics =
      createFixedResearchMainWireNormalAdultFiveWallMaterialKernelsV1(
        "ventricular-length-dependence-low-plus-velocity-distortion-high",
      ).LVFW;
    const fixedInput = Object.freeze({
      fiberLogStrain: 0,
      freeCalciumUM: 0.1,
    });
    const baselineCold = baseline.initializeColdAtFixedInput(fixedInput);
    const lowCold = lowLengthDependence.initializeColdAtFixedInput(fixedInput);
    const offCold = noLengthDependence.initializeColdAtFixedInput(fixedInput);
    const velocityCold =
      highVelocityDistortion.initializeColdAtFixedInput(fixedInput);
    const combinedCold = combinedKinematics.initializeColdAtFixedInput(
      fixedInput,
    );
    expect(lowCold.state.landState).toEqual(baselineCold.state.landState);
    expect(offCold.state.landState).toEqual(baselineCold.state.landState);
    expect(velocityCold.state.landState).toEqual(baselineCold.state.landState);
    expect(combinedCold.state.landState).toEqual(baselineCold.state.landState);
    expect(lowCold.activeFiberKirchhoffStressPa)
      .toBe(baselineCold.activeFiberKirchhoffStressPa);
    const trialInput = Object.freeze({
      candidateFiberLogStrain: 0,
      candidateFreeCalciumUM: 0.7,
      stepDtSec: 0.002,
    });
    const baselineTrial = baseline.evaluateTrialFromAccepted({
      ...trialInput,
      previousAcceptedState: baselineCold.state,
    });
    const lowTrial = lowLengthDependence.evaluateTrialFromAccepted({
      ...trialInput,
      previousAcceptedState: lowCold.state,
    });
    const offTrial = noLengthDependence.evaluateTrialFromAccepted({
      ...trialInput,
      previousAcceptedState: offCold.state,
    });
    const velocityTrial = highVelocityDistortion.evaluateTrialFromAccepted({
      ...trialInput,
      previousAcceptedState: velocityCold.state,
    });
    const combinedTrial = combinedKinematics.evaluateTrialFromAccepted({
      ...trialInput,
      previousAcceptedState: combinedCold.state,
    });
    expect(lowTrial.state.landState).toEqual(baselineTrial.state.landState);
    expect(offTrial.state.landState).toEqual(baselineTrial.state.landState);
    expect(velocityTrial.state.landState).toEqual(baselineTrial.state.landState);
    expect(combinedTrial.state.landState).toEqual(baselineTrial.state.landState);
    expect(lowTrial.activeFiberKirchhoffStressPa)
      .toBe(baselineTrial.activeFiberKirchhoffStressPa);
    expect(lowTrial.fiberKirchhoffStressPa)
      .toBe(baselineTrial.fiberKirchhoffStressPa);
    expect(offTrial.activeFiberKirchhoffStressPa)
      .toBe(baselineTrial.activeFiberKirchhoffStressPa);
    expect(offTrial.fiberKirchhoffStressPa)
      .toBe(baselineTrial.fiberKirchhoffStressPa);
    expect(velocityTrial.fiberKirchhoffStressPa)
      .toBe(baselineTrial.fiberKirchhoffStressPa);
    expect(combinedTrial.fiberKirchhoffStressPa)
      .toBe(baselineTrial.fiberKirchhoffStressPa);
  });

  it("hard-orders passive energy, stress, tangent, and Land Tref stress at fixed input", () => {
    const passiveLow = fixedInputTrial("ventricular-passive-low");
    const baseline = fixedInputTrial("baseline");
    const passiveHigh = fixedInputTrial("ventricular-passive-high");
    const trefLow = fixedInputTrial("ventricular-tref-low");
    const trefHigh = fixedInputTrial("ventricular-tref-high");

    const passiveEnergy = (trial: ReturnType<typeof fixedInputTrial>) =>
      trial.readback.energyLedger.equilibriumPassiveStoredEnergyDensityJPerM3;
    const equilibriumPassiveStress = (
      trial: ReturnType<typeof fixedInputTrial>,
    ) => trial.readback.totalKirchhoffStressPa
      - trial.readback.landActiveKirchhoffStressPa
      - trial.readback.slsOverstressPa;
    expect(passiveEnergy(passiveLow)).toBeLessThan(passiveEnergy(baseline));
    expect(passiveEnergy(baseline)).toBeLessThan(passiveEnergy(passiveHigh));
    expect(passiveEnergy(passiveLow) / passiveEnergy(baseline))
      .toBeCloseTo(0.75, 12);
    expect(passiveEnergy(passiveHigh) / passiveEnergy(baseline))
      .toBeCloseTo(4 / 3, 12);
    expect(equilibriumPassiveStress(passiveLow))
      .toBeLessThan(equilibriumPassiveStress(baseline));
    expect(equilibriumPassiveStress(baseline))
      .toBeLessThan(equilibriumPassiveStress(passiveHigh));
    expect(
      equilibriumPassiveStress(passiveLow)
        / equilibriumPassiveStress(baseline),
    ).toBeCloseTo(0.75, 12);
    expect(
      equilibriumPassiveStress(passiveHigh)
        / equilibriumPassiveStress(baseline),
    ).toBeCloseTo(4 / 3, 12);
    expect(passiveLow.algorithmicFiberTangentPa!)
      .toBeLessThan(baseline.algorithmicFiberTangentPa!);
    expect(baseline.algorithmicFiberTangentPa!)
      .toBeLessThan(passiveHigh.algorithmicFiberTangentPa!);
    expect(trefLow.readback.landActiveKirchhoffStressPa)
      .toBeLessThan(baseline.readback.landActiveKirchhoffStressPa);
    expect(baseline.readback.landActiveKirchhoffStressPa)
      .toBeLessThan(trefHigh.readback.landActiveKirchhoffStressPa);
    expect(trefLow.readback.landParameterSetStableHash)
      .not.toBe(baseline.readback.landParameterSetStableHash);
    expect(trefHigh.readback.landParameterSetStableHash)
      .not.toBe(baseline.readback.landParameterSetStableHash);
  });

  it("scales only the canonical additional SV/VC ledger at three exact fixed TBVs", () => {
    const runtime = normalAdultMainWireRuntimeV1();
    const low = resolveMainWireNormalAdultBloodVolumeResearchPointV1(
      runtime,
      "stressed-venous-volume-low",
    );
    const baseline = resolveMainWireNormalAdultBloodVolumeResearchPointV1(
      runtime,
      "baseline",
    );
    const high = resolveMainWireNormalAdultBloodVolumeResearchPointV1(
      runtime,
      "stressed-venous-volume-high",
    );
    expect(low.operatingPoint.fixedTotalBloodVolumeMl)
      .toBeCloseTo(5288.946892398469, 10);
    expect(baseline.operatingPoint.fixedTotalBloodVolumeMl).toBe(5522.11);
    expect(high.operatingPoint.fixedTotalBloodVolumeMl)
      .toBeCloseTo(5832.994143468708, 10);
    expect(low.point.canonicalAdditionalSvVcVolumeScale).toBe(0.75);
    expect(high.point.canonicalAdditionalSvVcVolumeScale).toBe(4 / 3);
    for (const node of NON_CORONARY_NODE_NAMES_V1) {
      if (node === "SV" || node === "VC") continue;
      expect(low.operatingPoint.nodeVolumesMl[node])
        .toBe(baseline.operatingPoint.nodeVolumesMl[node]);
      expect(high.operatingPoint.nodeVolumesMl[node])
        .toBe(baseline.operatingPoint.nodeVolumesMl[node]);
    }
    expect(low.operatingPoint.audit.fullGraphReferenceReconstructionResidualMl)
      .not.toBe(0);
    expect(high.operatingPoint.audit.fullGraphReferenceReconstructionResidualMl)
      .not.toBe(0);
    expect(() => resolveMainWireNormalAdultBloodVolumeResearchPointV1(
      runtime,
      "generic-patch" as never,
    )).toThrow(/unsupported fixed stressed venous volume research point/i);
  });

  it("runs all seven points from independent cold starts without hard-coding whole-loop direction", () => {
    const envelope = runMainWireNormalAdultFiveWallMacroPhysiologyEnvelopeV1({
      dtSec: 0.004,
      maximumBeatCount: 1,
    });
    expect(envelope.runs).toHaveLength(7);
    expect(envelope.claim).toMatchObject({
      sourceResearchRunnerOnly: true,
      oneFactorAtATime: true,
      parameterSearchOrFitting: false,
      terminalRetainedCycleTotalBloodVolumeConservationHardGate: true,
      wholeRunTotalBloodVolumeConservationClaimed: false,
      directionOrMagnitudeAcceptanceApplied: false,
    });
    for (const run of envelope.runs) {
      expect(run.configurationRole).toBe("fixed-research-point");
      expect(run.initializationEvidence).toMatchObject({
        initialization: "canonical",
        independentColdStart: true,
        warmStartApplied: false,
        totalBloodVolumeDifferenceMl: 0,
        chamberVolumesChangedFromPointColdState: false,
        mechanicsColdStateChangedFromPointColdState: false,
      });
      expect(run.outcome.integrationCompletedWithoutFailure).toBe(true);
      expect(run.numericalHardGates.identityMatched).toBe(true);
      expect(run.numericalHardGates.fixedTotalBloodVolumeConservationScope)
        .toBe("terminal-retained-complete-cycle");
      expect(run.numericalHardGates.fixedTotalBloodVolumeConserved).toBe(true);
      expect(run.descriptiveDeltaFromBaseline.directionOrMagnitudeAcceptanceApplied)
        .toBe(false);
    }
  }, 30_000);
});

function fixedInputTrial(
  pointId:
    | "baseline"
    | "ventricular-passive-low"
    | "ventricular-passive-high"
    | "ventricular-tref-low"
    | "ventricular-tref-high",
) {
  const kernel =
    createFixedResearchMainWireNormalAdultFiveWallMaterialKernelsV1(pointId)
      .LVFW;
  const cold = kernel.initializeColdAtFixedInput({
    fiberLogStrain: 0.08,
    freeCalciumUM: 0.7,
  });
  expect(cold.valid).toBe(true);
  const trial = kernel.evaluateTrialFromAccepted({
    previousAcceptedState: cold.state,
    candidateFiberLogStrain: 0.09,
    candidateFreeCalciumUM: 0.7,
    stepDtSec: 0.002,
  });
  expect(trial.valid).toBe(true);
  expect(trial.algorithmicFiberTangentPa).toBeTypeOf("number");
  return Object.freeze({
    ...trial,
    readback: trial.readback as unknown as
      MainWireNormalAdultWallMaterialReadbackV1,
  });
}
