import { describe, expect, it } from "vitest";

import {
  evaluateFiveWallNormalCalciumDriveV1,
} from "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";
import type {
  MainWireFiveWallLandTriSegReadbackV1,
  MainWireFiveWallLandSlsMaterialKernelV1,
  MainWireFiveWallRecordV1,
} from "@/engine/myocardium/mechanics/MainWireFiveWallLandTriSegProviderV1";
import {
  createMainWireFiveWallLandTriSegProviderV1,
} from "@/engine/myocardium/mechanics/MainWireFiveWallLandTriSegProviderV1";
import {
  MAIN_WIRE_NORMAL_ADULT_MECHANICS_FIXTURE_VOLUMES_ML_V1,
  MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_ADAPTER_V1_CLAIM,
  asMainWireFiveWallFreeCalciumDriveV1,
  createCanonicalMainWireNormalAdultFiveWallProviderV1,
  createMainWireNormalAdultFiveWallMaterialKernelsWithVentricularLandEtRelaxationProfileAndMechanicsResearchInputsV1,
  createMainWireNormalAdultFiveWallMaterialKernelsWithVentricularLandEtRelaxationProfileV1,
  createMainWireNormalAdultFiveWallMaterialKernelsV1,
  createMainWireNormalAdultFiveWallMaterialKernelsWithVentricularContractilityScaleV1,
  createMainWireNormalAdultFiveWallProviderWithVentricularLandEtRelaxationProfileAndMechanicsResearchInputsV1,
  createMainWireNormalAdultFiveWallProviderWithVentricularLandEtRelaxationProfileV1,
  type MainWireNormalAdultWallMaterialReadbackV1,
} from "@/engine/myocardium/mechanics/MainWireNormalAdultFiveWallProviderV1";
import {
  MAIN_WIRE_FIVE_WALL_DEFAULT_MECHANICS_RESEARCH_INPUTS_V1,
  withCommonVentricularActiveTensionScaleV1,
} from "@/engine/myocardium/mechanics/MainWireFiveWallMechanicsResearchInputsV1";
import {
  initializeLandSlsWallAtFixedInputV1,
  type LandSlsWallMaterialStateV1,
} from "@/engine/myocardium/mechanics/landSlsWallMaterialV1";
import {
  NORMAL_ADULT_FIVE_WALL_PRIOR_V1,
} from "@/engine/myocardium/mechanics/normalAdultFiveWallPriorV1";
import {
  MAIN_WIRE_VENTRICULAR_LAND_ET_RELAXATION_COLD_MAXIMUM_ITERATIONS_V1,
  MAIN_WIRE_VENTRICULAR_LAND_ET_RELAXATION_PARAMETER_SET_V1,
  MAIN_WIRE_VENTRICULAR_LAND_ET_RELAXATION_PROFILE_V1_CLAIM,
  MAIN_WIRE_VENTRICULAR_LAND_ET_RELAXATION_WALL_MATERIAL_V1,
} from "@/engine/myocardium/mechanics/MainWireVentricularLandEtRelaxationProfileV1";
import {
  deriveLand2017DerivedParameters,
  land2017ParameterSetHashInput,
  stableHash as stableLandParameterHash,
} from "@/engine/myocardium/myofilament/land2017/parameterSets";
import {
  checkpointWholeHeartMechanicsStateV1,
  commitWholeHeartMechanicsTrialV1,
  evaluateWholeHeartMechanicsTrialV1,
  initializeWholeHeartMechanicsColdV1,
  restoreWholeHeartMechanicsStateV1,
  type WholeHeartMechanicsSerializableValueV1,
  type WholeHeartMechanicsPressureVolumeTangentMmHgPerMlV1,
} from "@/engine/myocardium/wholeHeartMechanicsContractV1";

describe("main-wire normal-adult five-wall provider adapter V1", () => {
  it("owns the fixed effective ventricular Land profile and its provenance", () => {
    const material =
      MAIN_WIRE_VENTRICULAR_LAND_ET_RELAXATION_WALL_MATERIAL_V1;
    const parameterSet =
      MAIN_WIRE_VENTRICULAR_LAND_ET_RELAXATION_PARAMETER_SET_V1;
    const canonical =
      NORMAL_ADULT_FIVE_WALL_PRIOR_V1.active.ventricularWallMaterial;

    expect(parameterSet.values).toMatchObject({
      kuw: 104,
      kws: 4.8,
      nTm: 4,
      Tref: 151_951.88225014097,
      Aeff: 25,
      beta1: -2.4,
    });
    expect(parameterSet.derived).toEqual(
      deriveLand2017DerivedParameters(parameterSet.values),
    );
    expect(parameterSet.derived).toEqual({
      kb: 40.01666666666666,
      Aw: 10,
      As: 10,
      kwu: 99.2,
      ksu: 7.199999999999999,
      cw: 231.92,
      cs: 16.055999999999997,
    });
    expect(parameterSet.strongBridgeDeactivationExit).toMatchObject({
      maximumRatePerSec: 30,
      cooperativeGatePower: 8,
      deactivationDirectionGate: "none",
      strongPopulationGate:
        "positive-excess-over-zero-distortion-equilibrium",
      exitDestination: "unbound",
      sourceIdentityClaimed: false,
    });
    expect(stableLandParameterHash(
      land2017ParameterSetHashInput(parameterSet),
    )).toBe(parameterSet.parameterSetStableHash);
    expect(parameterSet.parameterSetStableHash).toBe("d4ceedc1");
    for (const entry of parameterSet.sourceParameters) {
      expect(entry.runtime.value).toBe(parameterSet.values[entry.parameter]);
    }
    for (const parameter of ["kuw", "kws", "nTm", "Tref"] as const) {
      expect(parameterSet.sourceParameters.find(
        (entry) => entry.parameter === parameter,
      )?.location).toMatch(/not |neither /i);
    }
    expect(material.landSlackStretch).toBe(1.05);
    expect(
      NORMAL_ADULT_FIVE_WALL_PRIOR_V1.anatomy.triSeg
        .targetFiberStretchAtLoadedReference * material.landSlackStretch,
    ).toBeCloseTo(1.155, 15);
    expect(material.sls).toBe(canonical.sls);
    expect(material.orientationFraction01)
      .toBe(canonical.orientationFraction01);
    expect(material.viableActiveFraction01)
      .toBe(canonical.viableActiveFraction01);
    expect(canonical.landEquationParameters.parameterSetStableHash)
      .toBe("b3d4e447");
    expect(Object.hasOwn(
      canonical.landEquationParameters,
      "strongBridgeDeactivationExit",
    )).toBe(false);
    expect(MAIN_WIRE_VENTRICULAR_LAND_ET_RELAXATION_PROFILE_V1_CLAIM)
      .toMatchObject({
        pureLand2017SourceParameterSetClaimed: false,
        changedPrimitiveParameters: ["kuw", "kws", "nTm", "Tref"],
        atrialMaterialChanged: false,
        ventricularPassiveOrSlsChanged: false,
        continuousStateCountChanged: false,
        coldInitializationMaximumIterations: 1600,
        coldInitializationPolicyRole:
          "numerical-initialization-only-not-constitutive-dynamics",
        numericOptimizerApplied: false,
        clinicalValidationClaimed: false,
      });
    expect(Object.isFrozen(parameterSet)).toBe(true);
    expect(Object.isFrozen(parameterSet.values)).toBe(true);
    expect(Object.isFrozen(parameterSet.sourceParameters)).toBe(true);
    expect(Object.isFrozen(material)).toBe(true);
  });

  it("cold-converges the selected material over its representative fixed-input grid", () => {
    const selectedPolicyIterations: number[] = [];
    const defaultPolicyFailures: string[] = [];
    for (const fiberLogStrain of [-0.3, -0.15, 0, 0.15, 0.3]) {
      for (const freeCalciumUM of [0.1, 0.164321, 0.592586, 1]) {
        const defaultPolicy = initializeLandSlsWallAtFixedInputV1(
          fiberLogStrain,
          freeCalciumUM,
          MAIN_WIRE_VENTRICULAR_LAND_ET_RELAXATION_WALL_MATERIAL_V1,
        );
        if (!defaultPolicy.converged) {
          defaultPolicyFailures.push(`${fiberLogStrain}/${freeCalciumUM}`);
        }
        const selectedPolicy = initializeLandSlsWallAtFixedInputV1(
          fiberLogStrain,
          freeCalciumUM,
          MAIN_WIRE_VENTRICULAR_LAND_ET_RELAXATION_WALL_MATERIAL_V1,
          {
            maximumIterations:
              MAIN_WIRE_VENTRICULAR_LAND_ET_RELAXATION_COLD_MAXIMUM_ITERATIONS_V1,
          },
        );
        expect(selectedPolicy.converged).toBe(true);
        expect(selectedPolicy.maximumStateUpdate).toBeLessThanOrEqual(1e-10);
        selectedPolicyIterations.push(selectedPolicy.fixedInputIterations);
      }
    }
    expect(defaultPolicyFailures).toContain("-0.15/0.592586");
    expect(defaultPolicyFailures).toHaveLength(11);
    expect(Math.max(...selectedPolicyIterations)).toBe(1024);
    expect(Math.max(...selectedPolicyIterations)).toBeLessThan(
      MAIN_WIRE_VENTRICULAR_LAND_ET_RELAXATION_COLD_MAXIMUM_ITERATIONS_V1,
    );
  });

  it("changes only ventricular material identities and cold-converges the selected profile", () => {
    const canonical = createMainWireNormalAdultFiveWallMaterialKernelsV1();
    const selected =
      createMainWireNormalAdultFiveWallMaterialKernelsWithVentricularLandEtRelaxationProfileV1();

    for (const atrium of ["LA", "RA"] as const) {
      expect(selected[atrium].parameterIdentityHash)
        .toBe(canonical[atrium].parameterIdentityHash);
    }
    for (const ventricle of ["LVFW", "SEP", "RVFW"] as const) {
      expect(selected[ventricle].parameterIdentityHash)
        .not.toBe(canonical[ventricle].parameterIdentityHash);
    }

    const fiberLogStrain = Math.log(
      1 / MAIN_WIRE_VENTRICULAR_LAND_ET_RELAXATION_WALL_MATERIAL_V1
        .landSlackStretch,
    );
    const selectedCold = selected.LVFW.initializeColdAtFixedInput({
      fiberLogStrain,
      freeCalciumUM: 0.164321,
    });
    const canonicalCold = canonical.LVFW.initializeColdAtFixedInput({
      fiberLogStrain,
      freeCalciumUM: 0.164321,
    });
    const selectedReadback = wallReadback(selectedCold.readback);
    const canonicalReadback = wallReadback(canonicalCold.readback);
    expect(selectedCold.valid).toBe(true);
    expect(selectedReadback.coldFixedInputIterations).not.toBeNull();
    expect(selectedReadback.coldFixedInputIterations!)
      .toBeLessThanOrEqual(
        MAIN_WIRE_VENTRICULAR_LAND_ET_RELAXATION_COLD_MAXIMUM_ITERATIONS_V1,
      );
    expect(selectedReadback.coldLandMaximumStateUpdate)
      .toBeLessThanOrEqual(1e-10);
    expect(selectedReadback.passiveParameterIdentityHash)
      .toBe(canonicalReadback.passiveParameterIdentityHash);

    const canonicalProvider =
      createCanonicalMainWireNormalAdultFiveWallProviderV1();
    const selectedProvider =
      createMainWireNormalAdultFiveWallProviderWithVentricularLandEtRelaxationProfileV1();
    expect(selectedProvider.parameterIdentityHash)
      .not.toBe(canonicalProvider.parameterIdentityHash);
    expect(selectedProvider.parameterSetId)
      .toContain("ventricular-land-et-relaxation-profile-v1");
  }, 60_000);

  it("composes active scaling over the selected base without dropping its extension", () => {
    const scaledInputs = withCommonVentricularActiveTensionScaleV1(
      MAIN_WIRE_FIVE_WALL_DEFAULT_MECHANICS_RESEARCH_INPUTS_V1,
      1.2,
    );
    const base =
      createMainWireNormalAdultFiveWallMaterialKernelsWithVentricularLandEtRelaxationProfileV1();
    const scaled =
      createMainWireNormalAdultFiveWallMaterialKernelsWithVentricularLandEtRelaxationProfileAndMechanicsResearchInputsV1(
        scaledInputs,
      );
    const fiberLogStrain = Math.log(
      1 / MAIN_WIRE_VENTRICULAR_LAND_ET_RELAXATION_WALL_MATERIAL_V1
        .landSlackStretch,
    );
    for (const ventricle of ["LVFW", "SEP", "RVFW"] as const) {
      const baseCold = base[ventricle].initializeColdAtFixedInput({
        fiberLogStrain,
        freeCalciumUM: 0.164321,
      });
      const scaledCold = scaled[ventricle].initializeColdAtFixedInput({
        fiberLogStrain,
        freeCalciumUM: 0.164321,
      });
      const baseReadback = wallReadback(baseCold.readback);
      const scaledReadback = wallReadback(scaledCold.readback);
      expect(Array.from(scaledCold.state.landState))
        .toEqual(Array.from(baseCold.state.landState));
      expect(scaledReadback.landActiveKirchhoffStressPa)
        .toBeCloseTo(1.2 * baseReadback.landActiveKirchhoffStressPa, 10);
      expect(scaledReadback.landParameterSetStableHash)
        .not.toBe(baseReadback.landParameterSetStableHash);
    }
    const baseCold = base.LVFW.initializeColdAtFixedInput({
      fiberLogStrain,
      freeCalciumUM: 0.8,
    });
    const strongPopulationExcessState = Object.freeze({
      ...baseCold.state,
      landState: Float64Array.from([0.3, 0.2, 0.04, 0.12, 0.01, -0.1]),
    });
    const trialInput = Object.freeze({
      previousAcceptedState: strongPopulationExcessState,
      candidateFiberLogStrain: fiberLogStrain,
      candidateFreeCalciumUM: 0.2,
      stepDtSec: 0.002,
    });
    const baseTrial = base.LVFW.evaluateTrialFromAccepted(trialInput);
    const scaledTrial = scaled.LVFW.evaluateTrialFromAccepted(trialInput);
    expect(Array.from(scaledTrial.state.landState))
      .toEqual(Array.from(baseTrial.state.landState));
    expect(wallReadback(scaledTrial.readback).landActiveKirchhoffStressPa)
      .toBeCloseTo(
        1.2 * wallReadback(baseTrial.readback).landActiveKirchhoffStressPa,
        10,
      );
    for (const atrium of ["LA", "RA"] as const) {
      expect(scaled[atrium].parameterIdentityHash)
        .toBe(base[atrium].parameterIdentityHash);
    }

    const baseProvider =
      createMainWireNormalAdultFiveWallProviderWithVentricularLandEtRelaxationProfileV1();
    const defaultInputProvider =
      createMainWireNormalAdultFiveWallProviderWithVentricularLandEtRelaxationProfileAndMechanicsResearchInputsV1(
        MAIN_WIRE_FIVE_WALL_DEFAULT_MECHANICS_RESEARCH_INPUTS_V1,
      );
    const scaledProvider =
      createMainWireNormalAdultFiveWallProviderWithVentricularLandEtRelaxationProfileAndMechanicsResearchInputsV1(
        scaledInputs,
      );
    expect(defaultInputProvider.parameterIdentityHash)
      .toBe(baseProvider.parameterIdentityHash);
    expect(scaledProvider.parameterIdentityHash)
      .not.toBe(baseProvider.parameterIdentityHash);
  }, 60_000);

  it("scales only the three ventricular Land materials through the bounded contractility seam", () => {
    const canonical = createMainWireNormalAdultFiveWallMaterialKernelsV1();
    const identity =
      createMainWireNormalAdultFiveWallMaterialKernelsWithVentricularContractilityScaleV1(1);
    const increased =
      createMainWireNormalAdultFiveWallMaterialKernelsWithVentricularContractilityScaleV1(1.2);

    for (const atrium of ["LA", "RA"] as const) {
      expect(identity[atrium].parameterIdentityHash)
        .toBe(canonical[atrium].parameterIdentityHash);
      expect(increased[atrium].parameterIdentityHash)
        .toBe(canonical[atrium].parameterIdentityHash);
    }
    for (const ventricle of ["LVFW", "SEP", "RVFW"] as const) {
      expect(identity[ventricle].parameterIdentityHash)
        .toBe(canonical[ventricle].parameterIdentityHash);
      expect(increased[ventricle].parameterIdentityHash)
        .not.toBe(canonical[ventricle].parameterIdentityHash);
      const baseline = canonical[ventricle].initializeColdAtFixedInput({
        fiberLogStrain: 0.08,
        freeCalciumUM: 0.8,
      });
      const stronger = increased[ventricle].initializeColdAtFixedInput({
        fiberLogStrain: 0.08,
        freeCalciumUM: 0.8,
      });
      expect(wallReadback(stronger.readback).landActiveKirchhoffStressPa)
        .toBeGreaterThan(
          wallReadback(baseline.readback).landActiveKirchhoffStressPa,
        );
    }
    expect(() =>
      createMainWireNormalAdultFiveWallMaterialKernelsWithVentricularContractilityScaleV1(2))
      .toThrow(/contractility scale/i);
  });

  it("cold-starts the canonical actual Land/SLS/Moyer/Klotz provider", () => {
    const provider = createCanonicalMainWireNormalAdultFiveWallProviderV1();
    const coldDrive = asMainWireFiveWallFreeCalciumDriveV1(
      evaluateFiveWallNormalCalciumDriveV1(0).freeCalciumUMByWall,
    );
    const cold = initializeWholeHeartMechanicsColdV1(provider, {
      timeSec: 0,
      volumesMl: MAIN_WIRE_NORMAL_ADULT_MECHANICS_FIXTURE_VOLUMES_ML_V1,
      drivingInputs: coldDrive,
    });
    const rb = providerReadback(cold.diagnostics.readback);

    expect(cold.diagnostics.converged).toBe(true);
    expect(cold.diagnostics.finite).toBe(true);
    expect(Object.keys(rb.internalCoordinates).sort())
      .toEqual(["junctionRadiusM", "septalMidwallCapVolumeM3"]);
    expect(rb.strictLocalStableEquilibrium).toBe(true);
    expect(rb.jacobianSymmetricWithinTolerance).toBe(true);
    expect(rb.totalAlgorithmicStressPrimitiveJ).toBeNull();
    expect(Object.values(cold.transmuralPressuresMmHg).every(Number.isFinite))
      .toBe(true);

    for (const wallId of ["LA", "RA", "LVFW", "SEP", "RVFW"] as const) {
      const wall = wallReadback(rb.wallMaterialReadbackByWall[wallId]);
      expect(wall.passiveModelId).toBe(
        wallId === "LA" || wallId === "RA"
          ? "moyer-2015-atrial-equibiaxial-passive-v1"
          : "equilibrium-one-fiber-passive-log-strain-v1",
      );
      expect(wall.energyLedger.equilibriumPassiveStoredEnergyDensityJPerM3)
        .toBeGreaterThanOrEqual(0);
      expect(wall.energyLedger.slsNextStoredEnergyDensityJPerM3).toBe(0);
      expect(wall.energyLedger.slsPassive).toBe(true);
      expect(wall.coldLandMaximumStateUpdate).not.toBeNull();
      expect(wall.coldLandMaximumStateUpdate!).toBeLessThanOrEqual(1e-10);
      expect(wall.energyLedger.landThermodynamicStoredEnergyClaimed).toBe(false);
      expect(wall.energyLedger.totalThermodynamicPotentialIncludingLandClaimed)
        .toBe(false);
    }

    const nextTimeSec = 0.005;
    const nextDrive = asMainWireFiveWallFreeCalciumDriveV1(
      evaluateFiveWallNormalCalciumDriveV1(nextTimeSec).freeCalciumUMByWall,
    );
    const acceptedBeforeTrial = provider.stateCodec.encode(
      cold.acceptedState.materialState,
    );
    const trial = evaluateWholeHeartMechanicsTrialV1(provider, {
      previousAcceptedState: cold.acceptedState,
      candidateTimeSec: nextTimeSec,
      stepDtSec: nextTimeSec,
      candidateVolumesMl: MAIN_WIRE_NORMAL_ADULT_MECHANICS_FIXTURE_VOLUMES_ML_V1,
      drivingInputs: nextDrive,
    });
    const repeatedTrial = evaluateWholeHeartMechanicsTrialV1(provider, {
      previousAcceptedState: cold.acceptedState,
      candidateTimeSec: nextTimeSec,
      stepDtSec: nextTimeSec,
      candidateVolumesMl: MAIN_WIRE_NORMAL_ADULT_MECHANICS_FIXTURE_VOLUMES_ML_V1,
      drivingInputs: nextDrive,
    });
    expect(trial.diagnostics.converged).toBe(true);
    expect(provider.stateCodec.encode(repeatedTrial.candidateMaterialState))
      .toEqual(provider.stateCodec.encode(trial.candidateMaterialState));
    expect(repeatedTrial.transmuralPressuresMmHg)
      .toEqual(trial.transmuralPressuresMmHg);
    expect(provider.stateCodec.encode(cold.acceptedState.materialState))
      .toEqual(acceptedBeforeTrial);
    const trialReadback = providerReadback(trial.diagnostics.readback);
    for (const wallId of ["LA", "RA", "LVFW", "SEP", "RVFW"] as const) {
      const ledger = wallReadback(
        trialReadback.wallMaterialReadbackByWall[wallId],
      ).energyLedger;
      expect(ledger.slsPreviousStoredEnergyDensityJPerM3).toBeGreaterThanOrEqual(0);
      expect(ledger.slsNextStoredEnergyDensityJPerM3).toBeGreaterThanOrEqual(0);
      expect(ledger.slsPhysicalDissipationIncrementDensityJPerM3)
        .toBeGreaterThanOrEqual(0);
      expect(ledger.slsBackwardEulerNumericalDissipationIncrementDensityJPerM3)
        .toBeGreaterThanOrEqual(0);
      expect(Math.abs(ledger.slsDiscreteEnergyBalanceResidualJPerM3))
        .toBeLessThan(1e-8);
      expect(ledger.slsPassive).toBe(true);
    }
    const accepted = commitWholeHeartMechanicsTrialV1(
      provider,
      cold.acceptedState,
      trial,
    );
    const checkpoint = checkpointWholeHeartMechanicsStateV1(provider, accepted);
    expect(restoreWholeHeartMechanicsStateV1(
      provider,
      JSON.parse(JSON.stringify(checkpoint)) as typeof checkpoint,
    )).toEqual(accepted);
    expect(MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_ADAPTER_V1_CLAIM
      .landThermodynamicStoredEnergyClaimed).toBe(false);
    expect(MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_ADAPTER_V1_CLAIM.providerTopology)
      .toBe("fixed-two-coordinate-TriSeg");
    expect(MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_ADAPTER_V1_CLAIM
      .fullLandKernelOnAllFiveWalls).toBe(true);
    expect(MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_ADAPTER_V1_CLAIM
      .atrialPopulationOnlyReductionApplied).toBe(false);
    expect(MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_ADAPTER_V1_CLAIM
      .externalSeriesElementApplied).toBe(false);
  }, 60_000);

  it("makes the paired LA-only SLS ablation mechanically exact-off", () => {
    const on = createMainWireNormalAdultFiveWallMaterialKernelsV1("on");
    const off = createMainWireNormalAdultFiveWallMaterialKernelsV1("exact-off");
    const cold = off.LA.initializeColdAtFixedInput({
      fiberLogStrain: 0,
      freeCalciumUM: 0.1,
    });
    const trial = off.LA.evaluateTrialFromAccepted({
      previousAcceptedState: cold.state,
      candidateFiberLogStrain: 0.08,
      candidateFreeCalciumUM: 0.1,
      stepDtSec: 0.002,
    });
    const rb = wallReadback(trial.readback);

    expect(Number.isFinite(trial.fiberKirchhoffStressPa)).toBe(true);
    expect(rb.slsOverstressPa).toBe(0);
    expect(rb.energyLedger.slsPreviousStoredEnergyDensityJPerM3).toBe(0);
    expect(rb.energyLedger.slsNextStoredEnergyDensityJPerM3).toBe(0);
    expect(rb.energyLedger.slsPhysicalDissipationIncrementDensityJPerM3).toBe(0);
    expect(rb.energyLedger.slsBackwardEulerNumericalDissipationIncrementDensityJPerM3)
      .toBe(0);
    expect(rb.energyLedger.slsDiscreteEnergyBalanceResidualJPerM3).toBe(0);
    expect(off.LA.parameterIdentityHash).not.toBe(on.LA.parameterIdentityHash);
    expect(off.RA.parameterIdentityHash).toBe(on.RA.parameterIdentityHash);
    expect(off.LVFW.parameterIdentityHash).toBe(on.LVFW.parameterIdentityHash);
  }, 60_000);

  it("matches the analytic canonical tangent to full resolved production-kernel probes", () => {
    const fast = createCanonicalMainWireNormalAdultFiveWallProviderV1();
    const coldDrive = asMainWireFiveWallFreeCalciumDriveV1(
      evaluateFiveWallNormalCalciumDriveV1(0).freeCalciumUMByWall,
    );
    const fastCold = initializeWholeHeartMechanicsColdV1(fast, {
      timeSec: 0,
      volumesMl: MAIN_WIRE_NORMAL_ADULT_MECHANICS_FIXTURE_VOLUMES_ML_V1,
      drivingInputs: coldDrive,
    });
    const candidateTimeSec = 0.005;
    const candidateDrive = asMainWireFiveWallFreeCalciumDriveV1(
      evaluateFiveWallNormalCalciumDriveV1(candidateTimeSec).freeCalciumUMByWall,
    );
    const fastTrial = evaluateWholeHeartMechanicsTrialV1(fast, {
      previousAcceptedState: fastCold.acceptedState,
      candidateTimeSec,
      stepDtSec: candidateTimeSec,
      candidateVolumesMl: MAIN_WIRE_NORMAL_ADULT_MECHANICS_FIXTURE_VOLUMES_ML_V1,
      drivingInputs: candidateDrive,
    });
    const fastReadback = providerReadback(fastTrial.diagnostics.readback);
    const pressureTangentShadow = fullResolvedCanonicalPressureVolumeTangent(
      fast,
      fastCold.acceptedState,
      candidateTimeSec,
      candidateDrive,
    );

    expect(fastTrial.diagnostics.converged).toBe(true);
    expect(fastReadback.jacobianDerivativeSource)
      .toBe("analytic-triseg-hessian");
    expect(fastReadback.jacobianAntisymmetricMaximumAbsoluteByOneJ).toBe(0);
    expect(fastTrial.transmuralPressureVolumeTangentMmHgPerMl).toBeDefined();
    expect(maximumPressureTangentAbsoluteError(
      fastTrial.transmuralPressureVolumeTangentMmHgPerMl!,
      pressureTangentShadow,
    )).toBeLessThan(2e-5);
    expect(maximumPressureTangentAntisymmetry(
      fastTrial.transmuralPressureVolumeTangentMmHgPerMl!,
    )).toBeLessThan(1e-8);
    expect(Math.abs(
      fastTrial.transmuralPressureVolumeTangentMmHgPerMl!.LV.RV,
    )).toBeGreaterThan(1e-3);
    expect(fastTrial.transmuralPressureVolumeTangentMmHgPerMl!.LA.LV).toBe(0);
    expect(fastTrial.transmuralPressureVolumeTangentMmHgPerMl!.LV.LA).toBe(0);
  }, 60_000);
});

function providerReadback(
  value: WholeHeartMechanicsSerializableValueV1 | null,
): MainWireFiveWallLandTriSegReadbackV1 {
  return value as unknown as MainWireFiveWallLandTriSegReadbackV1;
}

function wallReadback(
  value: WholeHeartMechanicsSerializableValueV1 | null,
): MainWireNormalAdultWallMaterialReadbackV1 {
  return value as unknown as MainWireNormalAdultWallMaterialReadbackV1;
}

function maximumMatrixRelativeError(
  left: readonly (readonly number[])[],
  right: readonly (readonly number[])[],
): number {
  return Math.max(...left.flatMap((row, rowIndex) =>
    row.map((value, columnIndex) =>
      relativeError(value, right[rowIndex]![columnIndex]!))));
}

function relativeError(left: number, right: number): number {
  return Math.abs(left - right) / Math.max(1, Math.abs(left), Math.abs(right));
}

function fullResolvedCanonicalPressureVolumeTangent(
  provider: ReturnType<typeof createCanonicalMainWireNormalAdultFiveWallProviderV1>,
  acceptedState: Parameters<
    ReturnType<
      typeof createCanonicalMainWireNormalAdultFiveWallProviderV1
    >["evaluateTrial"]
  >[0]["previousAcceptedState"],
  candidateTimeSec: number,
  drivingInputs: ReturnType<typeof asMainWireFiveWallFreeCalciumDriveV1>,
): WholeHeartMechanicsPressureVolumeTangentMmHgPerMlV1 {
  const chambers = ["LA", "LV", "RA", "RV"] as const;
  const stepMl = 0.001;
  return Object.fromEntries(chambers.map((row) => [
    row,
    Object.fromEntries(chambers.map((column) => {
      const lowerVolumes = {
        ...MAIN_WIRE_NORMAL_ADULT_MECHANICS_FIXTURE_VOLUMES_ML_V1,
        [column]:
          MAIN_WIRE_NORMAL_ADULT_MECHANICS_FIXTURE_VOLUMES_ML_V1[column]
          - stepMl,
      };
      const upperVolumes = {
        ...MAIN_WIRE_NORMAL_ADULT_MECHANICS_FIXTURE_VOLUMES_ML_V1,
        [column]:
          MAIN_WIRE_NORMAL_ADULT_MECHANICS_FIXTURE_VOLUMES_ML_V1[column]
          + stepMl,
      };
      const lower = evaluateWholeHeartMechanicsTrialV1(provider, {
        previousAcceptedState: acceptedState,
        candidateTimeSec,
        stepDtSec: candidateTimeSec - acceptedState.acceptedTimeSec,
        candidateVolumesMl: lowerVolumes,
        drivingInputs,
      });
      const upper = evaluateWholeHeartMechanicsTrialV1(provider, {
        previousAcceptedState: acceptedState,
        candidateTimeSec,
        stepDtSec: candidateTimeSec - acceptedState.acceptedTimeSec,
        candidateVolumesMl: upperVolumes,
        drivingInputs,
      });
      return [column, (
        upper.transmuralPressuresMmHg[row]
        - lower.transmuralPressuresMmHg[row]
      ) / (2 * stepMl)];
    })),
  ])) as WholeHeartMechanicsPressureVolumeTangentMmHgPerMlV1;
}

function maximumPressureTangentAbsoluteError(
  left: WholeHeartMechanicsPressureVolumeTangentMmHgPerMlV1,
  right: WholeHeartMechanicsPressureVolumeTangentMmHgPerMlV1,
): number {
  const chambers = ["LA", "LV", "RA", "RV"] as const;
  return Math.max(...chambers.flatMap((row) => chambers.map((column) =>
    Math.abs(left[row][column] - right[row][column]))));
}

function maximumPressureTangentAntisymmetry(
  tangent: WholeHeartMechanicsPressureVolumeTangentMmHgPerMlV1,
): number {
  const chambers = ["LA", "LV", "RA", "RV"] as const;
  return Math.max(...chambers.flatMap((row) => chambers.map((column) =>
    Math.abs(tangent[row][column] - tangent[column][row]))));
}
