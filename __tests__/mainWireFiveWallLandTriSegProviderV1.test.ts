import { describe, expect, it } from "vitest";

import {
  evaluateTriSegGeometryV1,
} from "@/engine/myocardium/mechanics/energyConjugateTriSegV1";
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
  checkpointWholeHeartMechanicsStateV1,
  commitWholeHeartMechanicsTrialV1,
  evaluateWholeHeartMechanicsTrialV1,
  initializeWholeHeartMechanicsColdV1,
  restoreWholeHeartMechanicsStateV1,
  type WholeHeartMechanicsChamberValuesV1,
  type WholeHeartMechanicsPressureVolumeTangentMmHgPerMlV1,
  type WholeHeartMechanicsSerializableValueV1,
} from "@/engine/myocardium/wholeHeartMechanicsContractV1";
import {
  sanitizeForStableHash,
  stableHash,
} from "@/engine/myocardium/kinematics/stableHash";

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
    expect(cold.acceptedState.materialState.wallStateByWall.LA.landState[0])
      .not.toBe(999);
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
