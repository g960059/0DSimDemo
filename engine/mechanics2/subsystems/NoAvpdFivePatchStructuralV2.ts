import {
  prepareEquilibriumPassiveSlsParallelParamsV1,
} from "@/engine/mechanics2/constitutive/EquilibriumPassiveSlsParallelV1";
import {
  prepareLandActivePassiveSlsParamsV1,
} from "@/engine/mechanics2/constitutive/LandActivePassiveSlsV1";
import {
  DEFAULT_NO_AVPD_FIVE_PATCH_LAND_STEP_CONTROLS_V1,
  createDefaultNoAvpdFivePatchLandTriSegParamsV1,
  initialNoAvpdFivePatchLandTriSegStateV1,
  stepNoAvpdFivePatchLandTriSegV1,
  type NoAvpdBloodVolumesV1,
  type NoAvpdFivePatchLandStepControlsV1,
  type NoAvpdFivePatchLandStepOutputV1,
  type NoAvpdFivePatchLandTriSegParamsV1,
  type NoAvpdFivePatchLandTriSegStateV1,
} from "@/engine/mechanics2/subsystems/NoAvpdFivePatchLandTriSegV1";
import {
  type DynamicInertialValveParamsV1,
} from "@/engine/mechanics2/valve/DynamicInertialValveV1";

export const NO_AVPD_FIVE_PATCH_STRUCTURAL_MODEL_ID_V2 =
  "no-avpd-five-patch-structural-v2" as const;

export const NO_AVPD_FIVE_PATCH_STRUCTURAL_CLAIM_BOUNDARY_V2 = Object.freeze({
  adoption: "research-sidecar-only" as const,
  runtimeReplacement: false,
  structuralComparison:
    "single-LA-wall-versus-common-pressure-LA-body-plus-LAA-by-common-pericardium-off-versus-on" as const,
  laBloodVolumeStateCount: 1,
  hiddenBloodReservoirAdded: false,
  leftAtrialAppendagePressureNode:
    "shared-instantaneous-LA-cavity-pressure" as const,
  leftAtrialAppendageOstialFlowOrStasisClaimed: false,
  leftAtrialAppendageParameterStatus:
    "fixed-causal-direction-informed-engineering-prior-not-normal-human-calibration" as const,
  commonPericardium:
    "energy-derived-algebraic-shared-pressure-no-dashpot-no-hidden-volume" as const,
  valveAreaDynamics:
    "four-independent-first-order-bounded-opening-states-with-geometry-derived-inertance-and-bernoulli-loss" as const,
  legacyV1ComparatorKeptSeparate: true,
  valveParameterStatus:
    "literature-and-geometry-informed-engineering-prior-not-normal-human-calibration" as const,
  vLoopMetrics: "report-only-not-used-to-fit-either-structural-factor" as const,
  patientFit: false,
  normalHumanCalibration: false,
} as const);

export type NoAvpdFivePatchStructuralArmIdV2 =
  | "single-wall__no-pericardium"
  | "single-wall__common-pericardium"
  | "body-laa-parallel__no-pericardium"
  | "body-laa-parallel__common-pericardium";

export const NO_AVPD_FIVE_PATCH_STRUCTURAL_ARM_IDS_V2 = Object.freeze([
  "single-wall__no-pericardium",
  "single-wall__common-pericardium",
  "body-laa-parallel__no-pericardium",
  "body-laa-parallel__common-pericardium",
] as const satisfies readonly NoAvpdFivePatchStructuralArmIdV2[]);

export type NoAvpdFivePatchStructuralStepOutputV2 = Omit<
  NoAvpdFivePatchLandStepOutputV1,
  "modelId"
> & {
  readonly modelId: typeof NO_AVPD_FIVE_PATCH_STRUCTURAL_MODEL_ID_V2;
  readonly structuralArmId: NoAvpdFivePatchStructuralArmIdV2;
};

/**
 * Fixed structural transformation.  No result-dependent range or parameter
 * update is permitted: all four arms share the same circulation, calcium,
 * Land, passive law family, and total LA wall/reference volumes.
 */
export function createNoAvpdFivePatchStructuralParamsV2(
  structuralArmId: NoAvpdFivePatchStructuralArmIdV2,
  base: NoAvpdFivePatchLandTriSegParamsV1 =
    createDefaultNoAvpdFivePatchLandTriSegParamsV1("all-patch"),
): NoAvpdFivePatchLandTriSegParamsV1 {
  requireStructuralArm(structuralArmId);
  const parallelEnabled = structuralArmId.startsWith("body-laa-parallel");
  const pericardiumEnabled = structuralArmId.endsWith("common-pericardium");
  const aggregate = base.atria.left;
  const appendageFraction01 = 0.15;
  const bodyFraction01 = 1 - appendageFraction01;
  const appendagePassiveScale = 0.4;
  const appendagePassiveSls = prepareEquilibriumPassiveSlsParallelParamsV1({
    parameterSetId:
      `${aggregate.material.passiveSls.parameterSetId}` +
      "::laa-more-compliant-fixed-structural-prior-v1",
    passive: {
      ...aggregate.material.passiveSls.passive,
      tangentModulusPa:
        aggregate.material.passiveSls.passive.tangentModulusPa *
        appendagePassiveScale,
    },
    sls: {
      ...aggregate.material.passiveSls.sls,
      modulusPa:
        aggregate.material.passiveSls.sls.modulusPa *
        appendagePassiveScale,
    },
  });
  const appendageMaterial = prepareLandActivePassiveSlsParamsV1({
    materialId:
      `${aggregate.material.materialId}` +
      "::laa-more-compliant-fixed-structural-prior-v1",
    active: aggregate.material.active,
    passiveSls: appendagePassiveSls,
    activeHomogenizationScale:
      aggregate.material.activeHomogenizationScale,
  });
  const leftAtrialParallelWall = parallelEnabled
    ? Object.freeze({
        body: Object.freeze({
          geometry: Object.freeze({
            ...aggregate.geometry,
            wallVolumeMl:
              aggregate.geometry.wallVolumeMl * bodyFraction01,
            referenceCavityVolumeMl:
              aggregate.geometry.referenceCavityVolumeMl * bodyFraction01,
          }),
          material: aggregate.material,
        }),
        appendage: Object.freeze({
          geometry: Object.freeze({
            ...aggregate.geometry,
            wallVolumeMl:
              aggregate.geometry.wallVolumeMl * appendageFraction01,
            referenceCavityVolumeMl:
              aggregate.geometry.referenceCavityVolumeMl *
              appendageFraction01,
          }),
          material: appendageMaterial,
        }),
        initialAppendageFraction01: appendageFraction01,
        minimumAppendageFraction01: 0.05,
        maximumAppendageFraction01: 0.3,
        solver: Object.freeze({
          scanIntervals: 8,
          maxBracketedIterations: 64,
          // The local pressure closure is nested inside a global finite-
          // difference Newton solve.  Its numerical noise must therefore sit
          // well below the global 1e-7 residual tolerance; these are solver
          // accuracies, not physiological parameters.
          pressureToleranceMmHg: 1e-9,
          volumeToleranceMl: 1e-11,
          monotonicityToleranceMmHg: 1e-10,
        }),
      })
    : undefined;

  // 606 mL is the fresh V1 four-chamber blood plus five-wall material volume.
  // A 5% reserve engages the bag at a low positive pressure.  This fixed arm
  // is a structural prior, not a pressure fit to the resulting PV loop.
  const commonPericardium = pericardiumEnabled
    ? Object.freeze({
        referenceHeartVolumeMl: 0.95 * 606,
        exponentialPressureScaleMmHg: 500 / 133.322,
        exponentialStiffness: 8,
        biasPressureMmHg: 0,
      })
    : undefined;
  const dynamicValves = Object.freeze({
    mitral: dynamicValveParamsFromLegacy(base.valves.mitral),
    aortic: dynamicValveParamsFromLegacy(base.valves.aortic),
    tricuspid: dynamicValveParamsFromLegacy(base.valves.tricuspid),
    pulmonary: dynamicValveParamsFromLegacy(base.valves.pulmonary),
  });

  return Object.freeze({
    ...base,
    structuralExtension: Object.freeze({
      ...(leftAtrialParallelWall === undefined
        ? {}
        : { leftAtrialParallelWall }),
      ...(commonPericardium === undefined ? {} : { commonPericardium }),
      dynamicValves,
      intrathoracicPressureMmHg: 0,
    }),
  });
}

function dynamicValveParamsFromLegacy(
  legacy: NoAvpdFivePatchLandTriSegParamsV1["valves"]["mitral"],
): DynamicInertialValveParamsV1 {
  const bloodDensityKgPerM3 = 1_060;
  const effectiveLengthCm =
    legacy.openInertanceMmHgSec2PerMl * 133.322 * legacy.openAreaCm2 /
    (bloodDensityKgPerM3 * 1e-4);
  return Object.freeze({
    valveId: legacy.valveId,
    openAreaCm2: legacy.openAreaCm2,
    minimumAreaCm2: legacy.leakAreaCm2,
    bloodDensityKgPerM3,
    effectiveLengthCm,
    openLinearResistanceMmHgSecPerMl:
      legacy.openResistanceMmHgSecPerMl,
    openingRatePerMmHgSec: 26.7,
    closingRatePerMmHgSec: 26.7,
    openingThresholdMmHg: 0,
    closingThresholdMmHg: 0,
    driveTransitionWidthMmHg: 0.05,
    flowSmoothingMlPerSec: legacy.flowSmoothingMlPerSec,
  });
}

export function initialNoAvpdFivePatchStructuralStateV2(
  structuralArmId: NoAvpdFivePatchStructuralArmIdV2,
  params: NoAvpdFivePatchLandTriSegParamsV1 =
    createNoAvpdFivePatchStructuralParamsV2(structuralArmId),
  volumeOverrides: Partial<NoAvpdBloodVolumesV1> = {},
): NoAvpdFivePatchLandTriSegStateV1 {
  assertStructuralParamsMatchArm(structuralArmId, params);
  return initialNoAvpdFivePatchLandTriSegStateV1(params, volumeOverrides);
}

export function stepNoAvpdFivePatchStructuralV2(
  structuralArmId: NoAvpdFivePatchStructuralArmIdV2,
  previous: NoAvpdFivePatchLandTriSegStateV1,
  dtSec: number,
  params: NoAvpdFivePatchLandTriSegParamsV1 =
    createNoAvpdFivePatchStructuralParamsV2(structuralArmId),
  controls: NoAvpdFivePatchLandStepControlsV1 =
    DEFAULT_NO_AVPD_FIVE_PATCH_LAND_STEP_CONTROLS_V1,
): NoAvpdFivePatchStructuralStepOutputV2 {
  assertStructuralParamsMatchArm(structuralArmId, params);
  const output = stepNoAvpdFivePatchLandTriSegV1(
    previous,
    dtSec,
    params,
    controls,
  );
  return Object.freeze({
    ...output,
    modelId: NO_AVPD_FIVE_PATCH_STRUCTURAL_MODEL_ID_V2,
    structuralArmId,
  });
}

function assertStructuralParamsMatchArm(
  armId: NoAvpdFivePatchStructuralArmIdV2,
  params: NoAvpdFivePatchLandTriSegParamsV1,
): void {
  requireStructuralArm(armId);
  const expectsParallel = armId.startsWith("body-laa-parallel");
  const expectsPericardium = armId.endsWith("common-pericardium");
  const actualParallel =
    params.structuralExtension?.leftAtrialParallelWall !== undefined;
  const actualPericardium =
    params.structuralExtension?.commonPericardium !== undefined;
  if (
    expectsParallel !== actualParallel ||
    expectsPericardium !== actualPericardium
  ) {
    throw new Error(
      `structural arm ${armId} does not match supplied LAA/pericardium topology`,
    );
  }
  if (params.structuralExtension?.dynamicValves === undefined) {
    throw new Error("structural V2 requires the shared four-valve dynamic topology");
  }
}

function requireStructuralArm(
  armId: NoAvpdFivePatchStructuralArmIdV2,
): void {
  if (!NO_AVPD_FIVE_PATCH_STRUCTURAL_ARM_IDS_V2.includes(armId)) {
    throw new Error(`unsupported structural arm: ${String(armId)}`);
  }
}
