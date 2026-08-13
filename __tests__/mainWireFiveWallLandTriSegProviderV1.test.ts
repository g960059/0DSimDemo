import { describe, expect, it } from "vitest";

import {
  evaluateTriSegGeometryV1,
} from "@/engine/myocardium/mechanics/energyConjugateTriSegV1";
import {
  resolveMainWireCoronaryBoundaryV2,
} from "@/engine/coronary/mainWireCoronaryBoundaryV2";
import {
  evaluateAllCoronaryImpV1,
} from "@/engine/coronary/intramyocardialPressureV1";
import {
  CORONARY_LAYER_IDS_V2,
  CORONARY_TERRITORY_IDS_V2,
} from "@/engine/coronary/typesV2";
import {
  evaluateMainWireCoronaryMechanicsCouplingV1,
  evaluateMainWireCoronaryMechanicsCouplingVentricularDirectionV1,
} from "@/engine/coronary/mainWireMechanicsCouplingV1";
import {
  evaluateFiveWallNormalCalciumDriveV1,
} from "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";
import {
  MAIN_WIRE_FIVE_WALL_LAND_TRISEG_PROVIDER_V1_CLAIM,
  createMainWireFiveWallLandTriSegProviderV1,
  type MainWireFiveWallFreeCalciumDriveV1,
  type MainWireFiveWallIdV1,
  type MainWireFiveWallLandSlsMaterialKernelV1,
  type MainWireFiveWallLandTriSegProviderParamsV1,
  type MainWireFiveWallLandTriSegReadbackV1,
  type MainWireFiveWallRecordV1,
} from "@/engine/myocardium/mechanics/MainWireFiveWallLandTriSegProviderV1";
import {
  MAIN_WIRE_NORMAL_ADULT_MECHANICS_FIXTURE_VOLUMES_ML_V1,
  asMainWireFiveWallFreeCalciumDriveV1,
  createCanonicalMainWireNormalAdultFiveWallProviderV1,
  type MainWireNormalAdultWallMaterialReadbackV1,
} from "@/engine/myocardium/mechanics/MainWireNormalAdultFiveWallProviderV1";
import {
  createMainWireNormalAdultCommonPericardiumV1,
} from "@/engine/myocardium/mechanics/MainWireNormalAdultCommonPericardiumV1";
import {
  evaluateMainWireCommonPericardiumBindingV1,
} from "@/engine/myocardium/mechanics/mainWireCommonPericardiumBindingV1";
import {
  checkpointWholeHeartMechanicsStateV1,
  commitWholeHeartMechanicsTrialV1,
  evaluatePreparedWholeHeartMechanicsTrialV1,
  evaluateWholeHeartMechanicsTrialV1,
  initializeWholeHeartMechanicsColdV1,
  prepareWholeHeartMechanicsStepV1,
  restoreWholeHeartMechanicsStateV1,
  type WholeHeartMechanicsChamberValuesV1,
  type WholeHeartMechanicsPressureVolumeTangentMmHgPerMlV1,
  type WholeHeartMechanicsSerializableValueV1,
} from "@/engine/myocardium/wholeHeartMechanicsContractV1";
import {
  sanitizeForStableHash,
  stableHash,
} from "@/engine/integrity/stableHash";

type TestWallState = Readonly<{
  landState: Float64Array;
  parallelSlsState: Readonly<{ viscousLogStrain: number }>;
  previousFiberLogStrain: number;
  previousFreeCalciumUM: number;
}>;

const REFERENCE_VOLUMES: WholeHeartMechanicsChamberValuesV1 = Object.freeze({
  LA: 68,
  LV: 144.4,
  RA: 63,
  RV: 155.8,
});

const INITIAL_COORDINATES = Object.freeze({
  septalMidwallCapVolumeM3: 42e-6,
  junctionRadiusM: 0.033,
});

const TRISEG_WALLS = Object.freeze({
  LVFW: Object.freeze({
    wallMaterialVolumeM3: 67.07543664065403e-6,
    referenceMidwallAreaM2: 93.54352893865039e-4,
  }),
  SEP: Object.freeze({
    wallMaterialVolumeM3: 35.77356620834881e-6,
    referenceMidwallAreaM2: 39.65081992591075e-4,
  }),
  RVFW: Object.freeze({
    wallMaterialVolumeM3: 36.08736942070275e-6,
    referenceMidwallAreaM2: 129.11294586037828e-4,
  }),
});

const ATRIA = Object.freeze({
  LA: Object.freeze({
    wallMaterialVolumeM3: 20e-6,
    referenceCavityBloodVolumeM3: REFERENCE_VOLUMES.LA * 1e-6,
  }),
  RA: Object.freeze({
    wallMaterialVolumeM3: 17e-6,
    referenceCavityBloodVolumeM3: REFERENCE_VOLUMES.RA * 1e-6,
  }),
});

describe("MainWireFiveWallLandTriSegProviderV1", () => {
  it("cold-initializes five Land/SLS wall states at one finite stable joint root", () => {
    const provider = createProvider();
    const raw = provider.initializeCold({
      timeSec: 0,
      volumesMl: REFERENCE_VOLUMES,
      drivingInputs: zeroDrive(),
    });
    expect(
      raw.diagnostics.converged,
      raw.diagnostics.errors.join("; "),
    ).toBe(true);
    const cold = initializeWholeHeartMechanicsColdV1(provider, {
      timeSec: 0,
      volumesMl: REFERENCE_VOLUMES,
      drivingInputs: zeroDrive(),
    });
    const rb = readback(cold.diagnostics.readback);

    expect(cold.diagnostics.converged).toBe(true);
    expect(cold.diagnostics.finite).toBe(true);
    expect(cold.diagnostics.residualNorm).toBeLessThan(1e-9);
    expect(rb.strictLocalStableEquilibrium).toBe(true);
    expect(rb.jacobianSymmetricWithinTolerance).toBe(true);
    expect(rb.symmetricJacobianMinimumEigenvalueByOneJ).toBeGreaterThan(0);
    expect(rb.coldConsistencyIterations).toBeGreaterThanOrEqual(2);
    expect(rb.hiddenBloodVolumeMl).toBe(0);
    expect(rb.pistonVolumeApplied).toBe(false);
    expect(Object.keys(cold.acceptedState.materialState.wallStateByWall).sort())
      .toEqual(["LA", "LVFW", "RA", "RVFW", "SEP"]);
    for (const wallId of wallIds()) {
      expect(cold.acceptedState.materialState.wallStateByWall[wallId].landState)
        .toHaveLength(6);
      expect(Number.isFinite(
        cold.acceptedState.materialState.wallStateByWall[wallId]
          .parallelSlsState.viscousLogStrain,
      )).toBe(true);
    }
  });

  it("repeats pure trials from one accepted state without mutating it", () => {
    const provider = createProvider();
    const cold = coldStart(provider);
    const acceptedEncoding = provider.stateCodec.encode(cold.acceptedState.materialState);
    const first = trial(provider, cold.acceptedState, candidateVolumes(), activeDrive());
    const second = trial(provider, cold.acceptedState, candidateVolumes(), activeDrive());

    expect(first.diagnostics.converged).toBe(true);
    expect(second.diagnostics.converged).toBe(true);
    expect(provider.stateCodec.encode(first.candidateMaterialState))
      .toEqual(provider.stateCodec.encode(second.candidateMaterialState));
    expect(first.transmuralPressuresMmHg).toEqual(second.transmuralPressuresMmHg);
    expect(first.diagnostics.readback).toEqual(second.diagnostics.readback);
    expect(provider.stateCodec.encode(cold.acceptedState.materialState))
      .toEqual(acceptedEncoding);

    first.candidateMaterialState.wallStateByWall.LA.landState[0] = 999;
    first.candidateMaterialState.wallStateByWall.LVFW.landState[0] = 998;
    expect(cold.acceptedState.materialState.wallStateByWall.LA.landState[0])
      .not.toBe(999);
    expect(cold.acceptedState.materialState.wallStateByWall.LVFW.landState[0])
      .not.toBe(998);
    expect(second.candidateMaterialState.wallStateByWall.LA.landState[0])
      .not.toBe(999);
    expect(second.candidateMaterialState.wallStateByWall.LVFW.landState[0])
      .not.toBe(998);
    expect(() => commitWholeHeartMechanicsTrialV1(
      provider,
      cold.acceptedState,
      first,
    )).toThrow(/fingerprint mismatch/);
  });

  it("solves exactly the two declared TriSeg coordinates", () => {
    const provider = createProvider();
    const cold = coldStart(provider);
    const evaluated = trial(
      provider,
      cold.acceptedState,
      candidateVolumes(),
      activeDrive(),
    );
    const rb = readback(evaluated.diagnostics.readback);

    expect(evaluated.diagnostics.converged).toBe(true);
    expect(Object.keys(cold.acceptedState.materialState).sort())
      .toEqual(["trisegCoordinates", "wallStateByWall"]);
    expect(Object.keys(rb.internalCoordinates).sort())
      .toEqual(["junctionRadiusM", "septalMidwallCapVolumeM3"]);
    expect(rb.scaledAlgorithmicGeneralizedForceByOneJ).toHaveLength(2);
    expect(rb.scaledAlgorithmicJacobianByOneJ).toHaveLength(2);
    expect(MAIN_WIRE_FIVE_WALL_LAND_TRISEG_PROVIDER_V1_CLAIM.internalUnknowns)
      .toEqual(["V_m_S", "y_m"]);
    expect(MAIN_WIRE_FIVE_WALL_LAND_TRISEG_PROVIDER_V1_CLAIM
      .ventricularGeometryMechanics).toBe("finite-thickness-membrane-only");
    expect(MAIN_WIRE_FIVE_WALL_LAND_TRISEG_PROVIDER_V1_CLAIM
      .koiterBendingApplied).toBe(false);
    expect(MAIN_WIRE_FIVE_WALL_LAND_TRISEG_PROVIDER_V1_CLAIM
      .trialMaterialLinearization)
      .toBe(
        "smooth-branch-exact-one-step-BE-tangent-with-declared-Clarke-midpoints",
      );
    expect(MAIN_WIRE_FIVE_WALL_LAND_TRISEG_PROVIDER_V1_CLAIM
      .trialGeometryLinearization)
      .toBe(
        "analytic-spherical-cap-implicit-hessian-with-center-material-tangent",
      );
    expect(MAIN_WIRE_FIVE_WALL_LAND_TRISEG_PROVIDER_V1_CLAIM
      .trialTransmuralPressureVolumeTangent)
      .toBe(
        "analytic-center-material-consistent-four-chamber-Schur-complement",
      );
    expect(MAIN_WIRE_FIVE_WALL_LAND_TRISEG_PROVIDER_V1_CLAIM
      .trialTransmuralPressureVolumeTangentUnits).toBe("mmHg-per-mL");
    expect(MAIN_WIRE_FIVE_WALL_LAND_TRISEG_PROVIDER_V1_CLAIM
      .trialTransmuralPressureVolumeTangentIncludesPericardium).toBe(false);
    expect(MAIN_WIRE_FIVE_WALL_LAND_TRISEG_PROVIDER_V1_CLAIM
      .pressureVolumeTangentUnavailableWhen)
      .toBe("cold-solve-only-or-invalid-analytic-hessian");
  });

  it("matches chamber pressure and TriSeg generalized force to virtual work", () => {
    const provider = createProvider();
    const cold = coldStart(provider);
    const center = candidateVolumes();
    const hMl = 0.01;
    const lower = trial(
      provider,
      cold.acceptedState,
      { ...center, LA: center.LA - hMl },
      zeroDrive(),
    );
    const upper = trial(
      provider,
      cold.acceptedState,
      { ...center, LA: center.LA + hMl },
      zeroDrive(),
    );
    const middle = trial(provider, cold.acceptedState, center, zeroDrive());
    const lowerPrimitive = readback(lower.diagnostics.readback)
      .totalAlgorithmicStressPrimitiveJ;
    const upperPrimitive = readback(upper.diagnostics.readback)
      .totalAlgorithmicStressPrimitiveJ;
    if (lowerPrimitive === null || upperPrimitive === null) {
      throw new Error("test material must expose its algorithmic stress primitive");
    }
    const derivativePa = (upperPrimitive - lowerPrimitive) / (2 * hMl * 1e-6);
    const pressurePa = middle.transmuralPressuresMmHg.LA * 133.322;
    const rb = readback(middle.diagnostics.readback);

    expect(relativeError(derivativePa, pressurePa)).toBeLessThan(3e-4);
    expect(Object.keys(rb.rawAlgorithmicGeneralizedForce).sort())
      .toEqual(["junctionRadiusN", "septalMidwallCapVolumePa"]);
    expect(rb.scaledAlgorithmicGeneralizedForceByOneJ.every(
      (value) => Math.abs(value) < 1e-8,
    )).toBe(true);
    expect(rb.claim.thermodynamicPotentialForLandActiveClaimed).toBe(false);
  });

  it("rejects serialized states with undeclared internal coordinates", () => {
    const provider = createProvider();
    const cold = coldStart(provider);
    const encoded = provider.stateCodec.encode(cold.acceptedState.materialState);
    expect(() => provider.stateCodec.decode({
      ...(encoded as Record<string, unknown>),
      extraInternalCoordinate: 0,
    })).toThrow(/must contain exactly/);
  });

  it("round-trips codec/checkpoint identity and rejects cross-prior restore", () => {
    const provider = createProvider();
    const cold = coldStart(provider);
    const accepted = commitWholeHeartMechanicsTrialV1(
      provider,
      cold.acceptedState,
      trial(provider, cold.acceptedState, candidateVolumes(), activeDrive()),
    );
    const checkpoint = checkpointWholeHeartMechanicsStateV1(provider, accepted);
    const restored = restoreWholeHeartMechanicsStateV1(
      provider,
      JSON.parse(JSON.stringify(checkpoint)) as typeof checkpoint,
    );
    const alternate = createProvider("alternate");

    expect(restored).toEqual(accepted);
    expect(provider.parameterIdentityHash).not.toBe(alternate.parameterIdentityHash);
    expect(() => restoreWholeHeartMechanicsStateV1(alternate, checkpoint))
      .toThrow(/identity mismatch/);
  });

  it("retains the per-call identity audit for mutable custom parameters", () => {
    const frozen = providerParams();
    const mutable = {
      ...frozen,
      atria: {
        LA: { ...frozen.atria.LA },
        RA: { ...frozen.atria.RA },
      },
    };
    const provider = createMainWireFiveWallLandTriSegProviderV1(mutable);
    mutable.atria.LA.wallMaterialVolumeM3 *= 1.01;

    expect(() => coldStart(provider))
      .toThrow(/effective provider parameters changed after construction/);
  });

  it("keeps ventricular mechanics bit-identical under atrial volume probes", () => {
    const fixture = canonicalPreparedMechanicsFixture();
    const base = evaluatePreparedWholeHeartMechanicsTrialV1(
      fixture.preparedStep,
      fixture.baseVolumes,
    );
    const laStepMl = 2e-6 * Math.max(
      10,
      Math.abs(fixture.baseVolumes.LA),
    );
    const raStepMl = 2e-6 * Math.max(
      10,
      Math.abs(fixture.baseVolumes.RA),
    );
    const laPerturbed = evaluatePreparedWholeHeartMechanicsTrialV1(
      fixture.preparedStep,
      Object.freeze({
        ...fixture.baseVolumes,
        LA: fixture.baseVolumes.LA + laStepMl,
      }),
    );
    const raPerturbed = evaluatePreparedWholeHeartMechanicsTrialV1(
      fixture.preparedStep,
      Object.freeze({
        ...fixture.baseVolumes,
        RA: fixture.baseVolumes.RA + raStepMl,
      }),
    );
    const baseReadback = readback(base.diagnostics.readback);
    const laReadback = readback(laPerturbed.diagnostics.readback);
    const raReadback = readback(raPerturbed.diagnostics.readback);

    expect(laPerturbed.transmuralPressuresMmHg.LV)
      .toBe(base.transmuralPressuresMmHg.LV);
    expect(laPerturbed.transmuralPressuresMmHg.RV)
      .toBe(base.transmuralPressuresMmHg.RV);
    expect(laPerturbed.transmuralPressuresMmHg.RA)
      .toBe(base.transmuralPressuresMmHg.RA);
    expect(raPerturbed.transmuralPressuresMmHg.LV)
      .toBe(base.transmuralPressuresMmHg.LV);
    expect(raPerturbed.transmuralPressuresMmHg.RV)
      .toBe(base.transmuralPressuresMmHg.RV);
    expect(raPerturbed.transmuralPressuresMmHg.LA)
      .toBe(base.transmuralPressuresMmHg.LA);
    for (const wallId of ["LVFW", "SEP", "RVFW"] as const) {
      expect(laReadback.effectiveFiberLogStrainByWall[wallId])
        .toBe(baseReadback.effectiveFiberLogStrainByWall[wallId]);
      expect(raReadback.effectiveFiberLogStrainByWall[wallId])
        .toBe(baseReadback.effectiveFiberLogStrainByWall[wallId]);
      expect(normalAdultWallReadback(
        laReadback.wallMaterialReadbackByWall[wallId],
      ).landActiveKirchhoffStressPa).toBe(normalAdultWallReadback(
        baseReadback.wallMaterialReadbackByWall[wallId],
      ).landActiveKirchhoffStressPa);
      expect(normalAdultWallReadback(
        raReadback.wallMaterialReadbackByWall[wallId],
      ).landActiveKirchhoffStressPa).toBe(normalAdultWallReadback(
        baseReadback.wallMaterialReadbackByWall[wallId],
      ).landActiveKirchhoffStressPa);
    }
  }, 60_000);

  it("keeps atrial mechanics bit-identical under ventricular volume probes", () => {
    const fixture = canonicalPreparedMechanicsFixture();
    const base = evaluatePreparedWholeHeartMechanicsTrialV1(
      fixture.preparedStep,
      fixture.baseVolumes,
    );
    const baseReadback = readback(base.diagnostics.readback);
    for (const node of ["LV", "RV"] as const) {
      const volumeStepMl = 2e-6 * Math.max(
        10,
        Math.abs(fixture.baseVolumes[node]),
      );
      const perturbed = evaluatePreparedWholeHeartMechanicsTrialV1(
        fixture.preparedStep,
        Object.freeze({
          ...fixture.baseVolumes,
          [node]: fixture.baseVolumes[node] + volumeStepMl,
        }),
      );
      const perturbedReadback = readback(perturbed.diagnostics.readback);

      expect(perturbed.transmuralPressuresMmHg.LA)
        .toBe(base.transmuralPressuresMmHg.LA);
      expect(perturbed.transmuralPressuresMmHg.RA)
        .toBe(base.transmuralPressuresMmHg.RA);
      for (const wallId of ["LA", "RA"] as const) {
        expect(perturbedReadback.effectiveFiberLogStrainByWall[wallId])
          .toBe(baseReadback.effectiveFiberLogStrainByWall[wallId]);
        expect(normalAdultWallReadback(
          perturbedReadback.wallMaterialReadbackByWall[wallId],
        ).landActiveKirchhoffStressPa).toBe(normalAdultWallReadback(
          baseReadback.wallMaterialReadbackByWall[wallId],
        ).landActiveKirchhoffStressPa);
      }
    }
  }, 60_000);

  it("retains ventricular fibre-strain and active-stress rows from the pressure Schur solve", () => {
    const fixture = canonicalPreparedMechanicsFixture();
    const base = evaluatePreparedWholeHeartMechanicsTrialV1(
      fixture.preparedStep,
      fixture.baseVolumes,
    );
    const tangent = readback(base.diagnostics.readback)
      .ventricularCoronaryBoundaryTangent;
    expect(tangent).toBeDefined();
    let maximumActiveStressDerivativeMagnitude = 0;
    for (const node of ["LV", "RV"] as const) {
      const volumeStepMl = 2e-6 * Math.max(
        10,
        Math.abs(fixture.baseVolumes[node]),
      );
      const minus = evaluatePreparedWholeHeartMechanicsTrialV1(
        fixture.preparedStep,
        Object.freeze({
          ...fixture.baseVolumes,
          [node]: fixture.baseVolumes[node] - volumeStepMl,
        }),
      );
      const plus = evaluatePreparedWholeHeartMechanicsTrialV1(
        fixture.preparedStep,
        Object.freeze({
          ...fixture.baseVolumes,
          [node]: fixture.baseVolumes[node] + volumeStepMl,
        }),
      );
      const minusReadback = readback(minus.diagnostics.readback);
      const plusReadback = readback(plus.diagnostics.readback);
      for (const wallId of ["LVFW", "SEP", "RVFW"] as const) {
        const shadowStrainDerivative = (
          plusReadback.effectiveFiberLogStrainByWall[wallId]
          - minusReadback.effectiveFiberLogStrainByWall[wallId]
        ) / (2 * volumeStepMl);
        expect(Math.abs(
          tangent!.effectiveFiberLogStrainPerMlByWall[wallId][node]
          - shadowStrainDerivative,
        )).toBeLessThan(1e-8);

        const shadowActiveStressDerivative = (
          normalAdultWallReadback(
            plusReadback.wallMaterialReadbackByWall[wallId],
          ).landActiveKirchhoffStressPa
          - normalAdultWallReadback(
            minusReadback.wallMaterialReadbackByWall[wallId],
          ).landActiveKirchhoffStressPa
        ) / (2 * volumeStepMl);
        const analyticActiveStressDerivative =
          tangent!.landActiveKirchhoffStressPaPerMlByWall[wallId][node];
        maximumActiveStressDerivativeMagnitude = Math.max(
          maximumActiveStressDerivativeMagnitude,
          Math.abs(analyticActiveStressDerivative),
        );
        expect(Math.abs(
          analyticActiveStressDerivative - shadowActiveStressDerivative,
        )).toBeLessThan(1e-3);
      }
    }
    // This makes dropping the active-only row observable rather than allowing
    // the pressure and fibre rows to keep this guard accidentally green.
    expect(maximumActiveStressDerivativeMagnitude).toBeGreaterThan(1);
  }, 60_000);

  it("matches the pericardium-inclusive RA tangent to full atrial re-solves", () => {
    const fixture = canonicalPreparedMechanicsFixture();
    const base = evaluatePreparedWholeHeartMechanicsTrialV1(
      fixture.preparedStep,
      fixture.baseVolumes,
    );
    const raStepMl = 2e-6 * Math.max(
      10,
      Math.abs(fixture.baseVolumes.RA),
    );
    const minusVolumes = Object.freeze({
      ...fixture.baseVolumes,
      RA: fixture.baseVolumes.RA - raStepMl,
    });
    const plusVolumes = Object.freeze({
      ...fixture.baseVolumes,
      RA: fixture.baseVolumes.RA + raStepMl,
    });
    const minus = evaluatePreparedWholeHeartMechanicsTrialV1(
      fixture.preparedStep,
      minusVolumes,
    );
    const plus = evaluatePreparedWholeHeartMechanicsTrialV1(
      fixture.preparedStep,
      plusVolumes,
    );
    const pericardiumBinding = createMainWireNormalAdultCommonPericardiumV1(
      "on",
      "effusion-300ml-positive-control",
    );
    const basePericardium = evaluateMainWireCommonPericardiumBindingV1(
      pericardiumBinding,
      fixture.baseVolumes,
    );
    const minusPericardium = evaluateMainWireCommonPericardiumBindingV1(
      pericardiumBinding,
      minusVolumes,
    );
    const plusPericardium = evaluateMainWireCommonPericardiumBindingV1(
      pericardiumBinding,
      plusVolumes,
    );
    const tangent = base.transmuralPressureVolumeTangentMmHgPerMl;
    expect(tangent).toBeDefined();
    const pericardiumTangentMmHgPerMl =
      basePericardium.pressureDerivativePaPerM3 * 1e-6 / 133.322;
    const absoluteRaTangentMmHgPerMl =
      tangent!.RA.RA + pericardiumTangentMmHgPerMl;
    const commonIntrathoracicPressureMmHg = -3;
    const absoluteRa = (
      trialValue: typeof base,
      pericardium: typeof basePericardium,
    ) => trialValue.transmuralPressuresMmHg.RA
      + commonIntrathoracicPressureMmHg
      + pericardium.excessPressureMmHg;
    const baseAbsoluteRa = absoluteRa(base, basePericardium);
    const predictedMinus =
      baseAbsoluteRa - raStepMl * absoluteRaTangentMmHgPerMl;
    const predictedPlus =
      baseAbsoluteRa + raStepMl * absoluteRaTangentMmHgPerMl;

    expect(Math.abs(
      absoluteRa(minus, minusPericardium) - predictedMinus,
    // Match the pre-existing four-chamber tangent contract below (5e-6);
    // the measured RA discrepancy for this full re-solve is 1.1012e-6.
    )).toBeLessThan(5e-6);
    expect(Math.abs(
      absoluteRa(plus, plusPericardium) - predictedPlus,
    )).toBeLessThan(5e-6);
  }, 60_000);

  it("keeps the healthy common-pericardium slack tangent at positive zero", () => {
    const pericardium = evaluateMainWireCommonPericardiumBindingV1(
      createMainWireNormalAdultCommonPericardiumV1(),
      MAIN_WIRE_NORMAL_ADULT_MECHANICS_FIXTURE_VOLUMES_ML_V1,
    );

    expect(pericardium.smoothingBranch).toBe("zero");
    expect(pericardium.excessPressurePa).toBe(0);
    expect(pericardium.pressureDerivativePaPerM3).toBe(0);
    expect(Object.is(pericardium.pressureDerivativePaPerM3, -0)).toBe(false);
  });

  it("reconstructs every engaged atrial boundary field except absolute RA exactly", () => {
    const fixture = canonicalPreparedMechanicsFixture();
    const pericardiumBinding = createMainWireNormalAdultCommonPericardiumV1(
      "on",
      "effusion-300ml-positive-control",
    );
    const commonIntrathoracicPressureMmHg = -3;
    const base = evaluatePreparedWholeHeartMechanicsTrialV1(
      fixture.preparedStep,
      fixture.baseVolumes,
    );
    const basePericardium = evaluateMainWireCommonPericardiumBindingV1(
      pericardiumBinding,
      fixture.baseVolumes,
    );
    const baseCoupling = evaluateMainWireCoronaryMechanicsCouplingV1(
      base,
      Object.freeze({
        commonIntrathoracicPressureMmHg,
        commonPericardialExcessPressureMmHg:
          basePericardium.excessPressureMmHg,
      }),
    );
    const reference = Object.freeze({
      referenceFiberLogStrainByWall:
        baseCoupling.effectiveFiberLogStrainByWall,
    });
    const tangent = base.transmuralPressureVolumeTangentMmHgPerMl;
    expect(tangent).toBeDefined();
    expect(basePericardium.excessPressureMmHg).toBeGreaterThan(0);
    expect(basePericardium.pressureDerivativePaPerM3).toBeGreaterThan(0);

    for (const node of ["LA", "RA"] as const) {
      const volumeStepMl = 2e-6 * Math.max(
        10,
        Math.abs(fixture.baseVolumes[node]),
      );
      const perturbedVolumes = Object.freeze({
        ...fixture.baseVolumes,
        [node]: fixture.baseVolumes[node] + volumeStepMl,
      });
      const fullTrial = evaluatePreparedWholeHeartMechanicsTrialV1(
        fixture.preparedStep,
        perturbedVolumes,
      );
      const perturbedPericardium =
        evaluateMainWireCommonPericardiumBindingV1(
          pericardiumBinding,
          perturbedVolumes,
        );
      const fullCoupling = evaluateMainWireCoronaryMechanicsCouplingV1(
        fullTrial,
        Object.freeze({
          commonIntrathoracicPressureMmHg,
          commonPericardialExcessPressureMmHg:
            perturbedPericardium.excessPressureMmHg,
        }),
      );
      const reconstructedCoupling =
        evaluateMainWireCoronaryMechanicsCouplingV1(
          base,
          Object.freeze({
            commonIntrathoracicPressureMmHg,
            commonPericardialExcessPressureMmHg:
              perturbedPericardium.excessPressureMmHg,
          }),
        );
      const pericardiumTangentMmHgPerMl =
        basePericardium.pressureDerivativePaPerM3 * 1e-6 / 133.322;
      const baseAbsoluteRaMmHg =
        base.transmuralPressuresMmHg.RA
        + commonIntrathoracicPressureMmHg
        + basePericardium.excessPressureMmHg;
      const reconstructedAbsoluteRaMmHg = baseAbsoluteRaMmHg
        + volumeStepMl * (
          tangent!.RA[node] + pericardiumTangentMmHgPerMl
        );
      const fullAbsoluteRaMmHg =
        fullTrial.transmuralPressuresMmHg.RA
        + commonIntrathoracicPressureMmHg
        + perturbedPericardium.excessPressureMmHg;
      const fullBoundary = resolveMainWireCoronaryBoundaryV2(
        Object.freeze({
          absoluteAorticPressureMmHg: 95,
          absoluteRightAtrialPressureMmHg: fullAbsoluteRaMmHg,
          mechanicsInput: fullCoupling.input,
          effectiveFiberLogStrainByWall:
            fullCoupling.effectiveFiberLogStrainByWall,
        }),
        "cep-shortening-induced",
        reference,
      );
      const reconstructedBoundary = resolveMainWireCoronaryBoundaryV2(
        Object.freeze({
          absoluteAorticPressureMmHg: 95,
          absoluteRightAtrialPressureMmHg:
            reconstructedAbsoluteRaMmHg,
          mechanicsInput: reconstructedCoupling.input,
          effectiveFiberLogStrainByWall:
            reconstructedCoupling.effectiveFiberLogStrainByWall,
        }),
        "cep-shortening-induced",
        reference,
      );

      expect(reconstructedBoundary.absoluteAorticPressureMmHg)
        .toBe(fullBoundary.absoluteAorticPressureMmHg);
      expect(reconstructedBoundary.perivascularExternalPressureMmHg)
        .toBe(fullBoundary.perivascularExternalPressureMmHg);
      for (const territoryId of CORONARY_TERRITORY_IDS_V2) {
        for (const layerId of CORONARY_LAYER_IDS_V2) {
          expect(
            reconstructedBoundary
              .intramyocardialPressureMmHgByTerritoryLayer[territoryId][layerId],
          ).toBe(
            fullBoundary
              .intramyocardialPressureMmHgByTerritoryLayer[territoryId][layerId],
          );
        }
      }
      expect(reconstructedBoundary.absoluteRightAtrialPressureMmHg)
        .not.toBe(fullBoundary.absoluteRightAtrialPressureMmHg);
    }
  }, 60_000);

  it("reconstructs engaged ventricular boundary fields from the retained tangent rows", () => {
    const fixture = canonicalPreparedMechanicsFixture();
    const pericardiumBinding = createMainWireNormalAdultCommonPericardiumV1(
      "on",
      "effusion-300ml-positive-control",
    );
    const commonIntrathoracicPressureMmHg = -3;
    const base = evaluatePreparedWholeHeartMechanicsTrialV1(
      fixture.preparedStep,
      fixture.baseVolumes,
    );
    const basePericardium = evaluateMainWireCommonPericardiumBindingV1(
      pericardiumBinding,
      fixture.baseVolumes,
    );
    const baseCoupling = evaluateMainWireCoronaryMechanicsCouplingV1(
      base,
      Object.freeze({
        commonIntrathoracicPressureMmHg,
        commonPericardialExcessPressureMmHg:
          basePericardium.excessPressureMmHg,
      }),
    );
    const reference = Object.freeze({
      referenceFiberLogStrainByWall:
        baseCoupling.effectiveFiberLogStrainByWall,
    });
    let maximumDirectedActivePressureMovementMmHg = 0;

    for (const node of ["LV", "RV"] as const) {
      const volumeStepMl = 2e-6 * Math.max(
        10,
        Math.abs(fixture.baseVolumes[node]),
      );
      const perturbedVolumes = Object.freeze({
        ...fixture.baseVolumes,
        [node]: fixture.baseVolumes[node] + volumeStepMl,
      });
      const fullTrial = evaluatePreparedWholeHeartMechanicsTrialV1(
        fixture.preparedStep,
        perturbedVolumes,
      );
      const perturbedPericardium =
        evaluateMainWireCommonPericardiumBindingV1(
          pericardiumBinding,
          perturbedVolumes,
        );
      const commonPressureInput = Object.freeze({
        commonIntrathoracicPressureMmHg,
        commonPericardialExcessPressureMmHg:
          perturbedPericardium.excessPressureMmHg,
      });
      const fullCoupling = evaluateMainWireCoronaryMechanicsCouplingV1(
        fullTrial,
        commonPressureInput,
      );
      const reconstructedCoupling =
        evaluateMainWireCoronaryMechanicsCouplingVentricularDirectionV1(
          base,
          Object.freeze({
            ventricularVolume: node,
            signedVolumeDeltaMl: volumeStepMl,
            ...commonPressureInput,
          }),
        );
      if (reconstructedCoupling === null) {
        throw new Error("production mechanics trial omitted analytic rows");
      }

      expect(fullTrial.transmuralPressuresMmHg.LA)
        .toBe(base.transmuralPressuresMmHg.LA);
      expect(fullTrial.transmuralPressuresMmHg.RA)
        .toBe(base.transmuralPressuresMmHg.RA);
      expect(reconstructedCoupling.input.externalPressureMmHg)
        .toBe(fullCoupling.input.externalPressureMmHg);
      for (const chamber of ["LV", "RV"] as const) {
        expect(Math.abs(
          reconstructedCoupling.input.chamberTransmuralPressureMmHg[chamber]
          - fullCoupling.input.chamberTransmuralPressureMmHg[chamber],
        )).toBeLessThan(5e-6);
      }
      for (const wallId of ["LVFW", "SEP", "RVFW"] as const) {
        expect(Math.abs(
          reconstructedCoupling.effectiveFiberLogStrainByWall[wallId]
          - fullCoupling.effectiveFiberLogStrainByWall[wallId],
        )).toBeLessThan(1e-8);
        expect(Math.abs(
          reconstructedCoupling.input.landActiveFiberStressPaByWall[wallId]
          - fullCoupling.input.landActiveFiberStressPaByWall[wallId],
        )).toBeLessThan(1e-3);
      }

      const fullSourceImp = evaluateAllCoronaryImpV1(fullCoupling.input);
      const reconstructedSourceImp = evaluateAllCoronaryImpV1(
        reconstructedCoupling.input,
      );
      const baseSourceImp = evaluateAllCoronaryImpV1(baseCoupling.input);
      const fullAbsoluteRaMmHg =
        fullTrial.transmuralPressuresMmHg.RA
        + commonIntrathoracicPressureMmHg
        + perturbedPericardium.excessPressureMmHg;
      for (const mechanism of [
        "cep-shortening-induced",
        "source-cep-land-active",
      ] as const) {
        const fullBoundary = resolveMainWireCoronaryBoundaryV2(
          Object.freeze({
            absoluteAorticPressureMmHg: 95,
            absoluteRightAtrialPressureMmHg: fullAbsoluteRaMmHg,
            sourceIntramyocardialPressureMmHgByTerritoryLayer:
              sourceImpValues(fullSourceImp),
            mechanicsInput: fullCoupling.input,
            effectiveFiberLogStrainByWall:
              fullCoupling.effectiveFiberLogStrainByWall,
          }),
          mechanism,
          mechanism === "cep-shortening-induced" ? reference : null,
        );
        const reconstructedBoundary = resolveMainWireCoronaryBoundaryV2(
          Object.freeze({
            absoluteAorticPressureMmHg: 95,
            absoluteRightAtrialPressureMmHg: fullAbsoluteRaMmHg,
            sourceIntramyocardialPressureMmHgByTerritoryLayer:
              sourceImpValues(reconstructedSourceImp),
            mechanicsInput: reconstructedCoupling.input,
            effectiveFiberLogStrainByWall:
              reconstructedCoupling.effectiveFiberLogStrainByWall,
          }),
          mechanism,
          mechanism === "cep-shortening-induced" ? reference : null,
        );

        expect(reconstructedBoundary.absoluteAorticPressureMmHg)
          .toBe(fullBoundary.absoluteAorticPressureMmHg);
        expect(reconstructedBoundary.absoluteRightAtrialPressureMmHg)
          .toBe(fullBoundary.absoluteRightAtrialPressureMmHg);
        expect(reconstructedBoundary.perivascularExternalPressureMmHg)
          .toBe(fullBoundary.perivascularExternalPressureMmHg);
        for (const territoryId of CORONARY_TERRITORY_IDS_V2) {
          for (const layerId of CORONARY_LAYER_IDS_V2) {
            expect(Math.abs(
              reconstructedBoundary
                .intramyocardialPressureMmHgByTerritoryLayer[
                  territoryId
                ][layerId]
              - fullBoundary
                .intramyocardialPressureMmHgByTerritoryLayer[
                  territoryId
                ][layerId],
            )).toBeLessThan(5e-6);
          }
        }
      }
      for (const territoryId of CORONARY_TERRITORY_IDS_V2) {
        for (const layerId of CORONARY_LAYER_IDS_V2) {
          maximumDirectedActivePressureMovementMmHg = Math.max(
            maximumDirectedActivePressureMovementMmHg,
            Math.abs(
              reconstructedSourceImp[territoryId][layerId]
                .activeStressInducedPressureMmHg
              - baseSourceImp[territoryId][layerId]
                .activeStressInducedPressureMmHg,
            ),
          );
          expect(Math.abs(
            reconstructedSourceImp[territoryId][layerId]
              .activeStressInducedPressureMmHg
            - fullSourceImp[territoryId][layerId]
              .activeStressInducedPressureMmHg,
          )).toBeLessThan(1e-8);
        }
      }
    }
    // This source-mechanism assertion fails if the active-only material
    // tangent is omitted while the pressure and shortening paths remain live.
    expect(maximumDirectedActivePressureMovementMmHg)
      .toBeGreaterThan(1e-10);
  }, 60_000);

  it("returns a symmetric four-chamber mmHg/mL tangent matching full constitutive re-solves", () => {
    const provider = createProvider("pressure-tangent");
    const cold = coldStart(provider);
    const volumes = candidateVolumes();
    const drive = activeDrive();
    const center = trial(provider, cold.acceptedState, volumes, drive);
    const tangent = center.transmuralPressureVolumeTangentMmHgPerMl;
    const shadow = fullResolvedPressureVolumeTangent(
      provider,
      cold.acceptedState,
      volumes,
      drive,
    );

    expect(cold.transmuralPressureVolumeTangentMmHgPerMl).toBeUndefined();
    expect(tangent).toBeDefined();
    expect(maximumPressureTangentAbsoluteError(tangent!, shadow))
      .toBeLessThan(5e-6);
    expect(maximumPressureTangentAntisymmetry(tangent!)).toBeLessThan(1e-8);
    expect(Math.abs(tangent!.LV.RV)).toBeGreaterThan(1e-5);
    for (const chamber of ["LA", "LV", "RA", "RV"] as const) {
      expect(tangent![chamber][chamber]).toBeGreaterThan(0);
    }

  });

});

function createProvider(
  parameterSetSuffix = "canonical",
) {
  return createMainWireFiveWallLandTriSegProviderV1(
    providerParams(parameterSetSuffix),
  );
}

function canonicalPreparedMechanicsFixture() {
  const provider = createCanonicalMainWireNormalAdultFiveWallProviderV1();
  const baseVolumes = MAIN_WIRE_NORMAL_ADULT_MECHANICS_FIXTURE_VOLUMES_ML_V1;
  const cold = initializeWholeHeartMechanicsColdV1(provider, {
    timeSec: 0,
    volumesMl: baseVolumes,
    drivingInputs: asMainWireFiveWallFreeCalciumDriveV1(
      evaluateFiveWallNormalCalciumDriveV1(0).freeCalciumUMByWall,
    ),
  });
  const candidateTimeSec = 0.002;
  const preparedStep = prepareWholeHeartMechanicsStepV1(provider, {
    previousAcceptedState: cold.acceptedState,
    candidateTimeSec,
    stepDtSec: candidateTimeSec,
    drivingInputs: asMainWireFiveWallFreeCalciumDriveV1(
      evaluateFiveWallNormalCalciumDriveV1(candidateTimeSec)
        .freeCalciumUMByWall,
    ),
  });
  return Object.freeze({ baseVolumes, preparedStep });
}

function providerParams(
  parameterSetSuffix = "canonical",
): MainWireFiveWallLandTriSegProviderParamsV1<TestWallState> {
  const geometry = evaluateTriSegGeometryV1({
    leftVentricularCavityVolumeM3: REFERENCE_VOLUMES.LV * 1e-6,
    rightVentricularCavityVolumeM3: REFERENCE_VOLUMES.RV * 1e-6,
    coordinates: INITIAL_COORDINATES,
    walls: TRISEG_WALLS,
  });
  const targetStrain: MainWireFiveWallRecordV1<number> = Object.freeze({
    LA: 0,
    LVFW: geometry.walls.LVFW.fiberLogStrain,
    SEP: geometry.walls.SEP.fiberLogStrain,
    RVFW: geometry.walls.RVFW.fiberLogStrain,
    RA: 0,
  });
  const stiffnessPa: MainWireFiveWallRecordV1<number> = Object.freeze({
    LA: 120_000,
    LVFW: 320_000,
    SEP: 260_000,
    RVFW: 220_000,
    RA: 100_000,
  });
  const activeGainPaPerUM: MainWireFiveWallRecordV1<number> = Object.freeze({
    LA: 20_000,
    LVFW: 55_000,
    SEP: 35_000,
    RVFW: 42_000,
    RA: 16_000,
  });
  const materialByWall = fiveWallRecord((wallId) => testMaterialKernel({
    wallId,
    targetStrain: targetStrain[wallId],
    stiffnessPa: stiffnessPa[wallId],
    activeGainPaPerUM: activeGainPaPerUM[wallId],
    slsBranchModulusPa: 18_000,
    slsRelaxationTimeSec: 0.08,
  }));
  return Object.freeze({
    parameterSetId: `five-wall-test-${parameterSetSuffix}`,
    materialByWall,
    atria: ATRIA,
    trisegWalls: TRISEG_WALLS,
    initialTriSegCoordinates: INITIAL_COORDINATES,
    internalCoordinateScales: Object.freeze({
      septalMidwallCapVolumeM3: 40e-6,
      junctionRadiusM: 0.033,
    }),
    solver: Object.freeze({
      maximumIterations: 48,
      scaledResidualInfinityTolerance: 1e-9,
      strictStabilityEigenvalueByOneJ: 1e-10,
    }),
  });
}

function testMaterialKernel(input: Readonly<{
  wallId: MainWireFiveWallIdV1;
  targetStrain: number;
  stiffnessPa: number;
  activeGainPaPerUM: number;
  slsBranchModulusPa: number;
  slsRelaxationTimeSec: number;
}>): MainWireFiveWallLandSlsMaterialKernelV1<TestWallState> {
  const parameterSetId = `test-land-sls-${input.wallId}-v1`;
  const parameterIdentityHash = stableHash(sanitizeForStableHash(input));
  const stateCodec = Object.freeze({
    clone: cloneTestWallState,
    encode: encodeTestWallState,
    decode: decodeTestWallState,
  });
  const evaluate = (
    fiberLogStrain: number,
    freeCalciumUM: number,
    previous: TestWallState | null,
    dtSec: number | null,
  ) => {
    const activeStressPa = input.activeGainPaPerUM * freeCalciumUM;
    const equilibriumElasticStrain = fiberLogStrain - input.targetStrain;
    const equilibriumStressPa = input.stiffnessPa * equilibriumElasticStrain;
    let viscousLogStrain = fiberLogStrain;
    let slsStressPa = 0;
    let slsPrimitiveDensity = 0;
    let algorithmicFiberTangentPa = input.stiffnessPa;
    if (previous !== null && dtSec !== null) {
      const ratio = dtSec / input.slsRelaxationTimeSec;
      viscousLogStrain = (
        previous.parallelSlsState.viscousLogStrain + ratio * fiberLogStrain
      ) / (1 + ratio);
      const algorithmicBranchModulusPa = input.slsBranchModulusPa / (1 + ratio);
      const algorithmicElasticStrain =
        fiberLogStrain - previous.parallelSlsState.viscousLogStrain;
      slsStressPa = algorithmicBranchModulusPa * algorithmicElasticStrain;
      slsPrimitiveDensity = 0.5 * algorithmicBranchModulusPa
        * algorithmicElasticStrain ** 2;
      algorithmicFiberTangentPa =
        input.stiffnessPa + algorithmicBranchModulusPa;
    }
    const stressPa = equilibriumStressPa + activeStressPa + slsStressPa;
    const state: TestWallState = Object.freeze({
      landState: Float64Array.from([
        fiberLogStrain,
        freeCalciumUM,
        activeStressPa,
        0,
        0,
        0,
      ]),
      parallelSlsState: Object.freeze({ viscousLogStrain }),
      previousFiberLogStrain: fiberLogStrain,
      previousFreeCalciumUM: freeCalciumUM,
    });
    return Object.freeze({
      state,
      fiberLogStrain,
      fiberKirchhoffStressPa: stressPa,
      algorithmicFiberTangentPa,
      activeFiberAlgorithmicTangentPa: 0,
      algorithmicStressPrimitiveDensityJPerM3:
        0.5 * input.stiffnessPa * equilibriumElasticStrain ** 2
        + activeStressPa * fiberLogStrain
        + slsPrimitiveDensity,
      iterationCount: 1,
      residualNorm: 0,
      finite: true,
      valid: true,
      errors: Object.freeze([]),
      warnings: Object.freeze([]),
      readback: Object.freeze({
        mockOnly: true,
        activeStressPa,
        equilibriumStressPa,
        slsStressPa,
      }),
    });
  };
  return Object.freeze({
    modelId: "test-land-active-passive-parallel-sls-v1",
    parameterSetId,
    parameterIdentityHash,
    topology:
      "Land-active-plus-equilibrium-passive-plus-parallel-one-state-SLS" as const,
    stateCodec,
    acceptedStateInputMode: "defensive-clone" as const,
    evaluationStateOwnershipMode: "defensive-clone" as const,
    initializeColdAtFixedInput: ({ fiberLogStrain, freeCalciumUM }) =>
      evaluate(fiberLogStrain, freeCalciumUM, null, null),
    evaluateTrialFromAccepted: ({
      previousAcceptedState,
      candidateFiberLogStrain,
      candidateFreeCalciumUM,
      stepDtSec,
    }) => evaluate(
      candidateFiberLogStrain,
      candidateFreeCalciumUM,
      previousAcceptedState,
      stepDtSec,
    ),
  });
}

function coldStart(provider: ReturnType<typeof createProvider>) {
  return initializeWholeHeartMechanicsColdV1(provider, {
    timeSec: 0,
    volumesMl: REFERENCE_VOLUMES,
    drivingInputs: zeroDrive(),
  });
}

function trial(
  provider: ReturnType<typeof createProvider>,
  acceptedState: ReturnType<typeof coldStart>["acceptedState"],
  candidateVolumesMl: WholeHeartMechanicsChamberValuesV1,
  drivingInputs: MainWireFiveWallFreeCalciumDriveV1,
) {
  return evaluateWholeHeartMechanicsTrialV1(provider, {
    previousAcceptedState: acceptedState,
    candidateTimeSec: acceptedState.acceptedTimeSec + 0.005,
    stepDtSec: 0.005,
    candidateVolumesMl,
    drivingInputs,
  });
}

function candidateVolumes(): WholeHeartMechanicsChamberValuesV1 {
  return Object.freeze({ LA: 72, LV: 150, RA: 66, RV: 160 });
}

function zeroDrive(): MainWireFiveWallFreeCalciumDriveV1 {
  return Object.freeze({ freeCalciumUMByWall: fiveWallRecord(() => 0) });
}

function activeDrive(): MainWireFiveWallFreeCalciumDriveV1 {
  return Object.freeze({
    freeCalciumUMByWall: Object.freeze({
      LA: 0.2,
      LVFW: 0.3,
      SEP: 0.25,
      RVFW: 0.2,
      RA: 0.15,
    }),
  });
}

function fiveWallRecord<T>(
  build: (wallId: MainWireFiveWallIdV1) => T,
): MainWireFiveWallRecordV1<T> {
  return Object.freeze(Object.fromEntries(
    wallIds().map((wallId) => [wallId, build(wallId)]),
  )) as MainWireFiveWallRecordV1<T>;
}

function wallIds(): readonly MainWireFiveWallIdV1[] {
  return ["LA", "LVFW", "SEP", "RVFW", "RA"];
}

function cloneTestWallState(state: TestWallState): TestWallState {
  return Object.freeze({
    landState: Float64Array.from(state.landState),
    parallelSlsState: Object.freeze({ ...state.parallelSlsState }),
    previousFiberLogStrain: state.previousFiberLogStrain,
    previousFreeCalciumUM: state.previousFreeCalciumUM,
  });
}

function encodeTestWallState(
  state: TestWallState,
): WholeHeartMechanicsSerializableValueV1 {
  return Object.freeze({
    landState: Object.freeze(Array.from(state.landState)),
    parallelSlsState: Object.freeze({ ...state.parallelSlsState }),
    previousFiberLogStrain: state.previousFiberLogStrain,
    previousFreeCalciumUM: state.previousFreeCalciumUM,
  });
}

function decodeTestWallState(
  encoded: WholeHeartMechanicsSerializableValueV1,
): TestWallState {
  const value = encoded as {
    landState: readonly number[];
    parallelSlsState: { viscousLogStrain: number };
    previousFiberLogStrain: number;
    previousFreeCalciumUM: number;
  };
  return Object.freeze({
    landState: Float64Array.from(value.landState),
    parallelSlsState: Object.freeze({ ...value.parallelSlsState }),
    previousFiberLogStrain: value.previousFiberLogStrain,
    previousFreeCalciumUM: value.previousFreeCalciumUM,
  });
}

function readback(
  value: WholeHeartMechanicsSerializableValueV1 | null,
): MainWireFiveWallLandTriSegReadbackV1 {
  return value as unknown as MainWireFiveWallLandTriSegReadbackV1;
}

function normalAdultWallReadback(
  value: WholeHeartMechanicsSerializableValueV1 | null,
): MainWireNormalAdultWallMaterialReadbackV1 {
  return value as unknown as MainWireNormalAdultWallMaterialReadbackV1;
}

function sourceImpValues(
  value: ReturnType<typeof evaluateAllCoronaryImpV1>,
) {
  const layers = (territoryId: "LAD" | "LCx" | "RCA") => Object.freeze({
    subepicardial:
      value[territoryId].subepicardial.intramyocardialPressureMmHg,
    subendocardial:
      value[territoryId].subendocardial.intramyocardialPressureMmHg,
  });
  return Object.freeze({
    LAD: layers("LAD"),
    LCx: layers("LCx"),
    RCA: layers("RCA"),
  });
}

function centralDifferenceForTest(
  evaluate: (scaled: readonly number[]) => readonly number[],
  center: readonly number[],
  step: number,
): readonly (readonly number[])[] {
  const columns = center.map((_, column) => {
    const lower = [...center];
    const upper = [...center];
    lower[column] -= step;
    upper[column] += step;
    const lowerValue = evaluate(lower);
    const upperValue = evaluate(upper);
    return upperValue.map((value, row) =>
      (value - lowerValue[row]!) / (2 * step));
  });
  return center.map((_, row) =>
    center.map((__, column) => columns[column]![row]!));
}

function relativeAntisymmetryForTest(
  jacobian: readonly (readonly number[])[],
): number {
  let maximumAntisymmetry = 0;
  let infinityNorm = 0;
  for (let row = 0; row < jacobian.length; row += 1) {
    let rowSum = 0;
    for (let column = 0; column < jacobian.length; column += 1) {
      maximumAntisymmetry = Math.max(
        maximumAntisymmetry,
        0.5 * Math.abs(
          jacobian[row]![column]! - jacobian[column]![row]!,
        ),
      );
      rowSum += Math.abs(jacobian[row]![column]!);
    }
    infinityNorm = Math.max(infinityNorm, rowSum);
  }
  return maximumAntisymmetry / infinityNorm;
}

function relativeError(left: number, right: number): number {
  return Math.abs(left - right) / Math.max(1, Math.abs(left), Math.abs(right));
}

function maximumMatrixRelativeError(
  left: readonly (readonly number[])[],
  right: readonly (readonly number[])[],
): number {
  return Math.max(...left.flatMap((row, rowIndex) =>
    row.map((value, columnIndex) =>
      relativeError(value, right[rowIndex]![columnIndex]!))));
}

function fullResolvedPressureVolumeTangent(
  provider: ReturnType<typeof createProvider>,
  acceptedState: ReturnType<typeof coldStart>["acceptedState"],
  centerVolumesMl: WholeHeartMechanicsChamberValuesV1,
  drive: MainWireFiveWallFreeCalciumDriveV1,
): WholeHeartMechanicsPressureVolumeTangentMmHgPerMlV1 {
  const chambers = ["LA", "LV", "RA", "RV"] as const;
  const stepMl = 0.001;
  const rows = Object.fromEntries(chambers.map((row) => [
    row,
    Object.fromEntries(chambers.map((column) => {
      const lower = { ...centerVolumesMl, [column]: centerVolumesMl[column] - stepMl };
      const upper = { ...centerVolumesMl, [column]: centerVolumesMl[column] + stepMl };
      const lowerTrial = trial(provider, acceptedState, lower, drive);
      const upperTrial = trial(provider, acceptedState, upper, drive);
      return [column, (
        upperTrial.transmuralPressuresMmHg[row]
        - lowerTrial.transmuralPressuresMmHg[row]
      ) / (2 * stepMl)];
    })),
  ]));
  return rows as WholeHeartMechanicsPressureVolumeTangentMmHgPerMlV1;
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
