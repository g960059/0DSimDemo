import {
  evaluateLandLengthStateV1,
} from "@/engine/myocardium/fourChamberV1/adapters/landLengthReferenceV1";
import {
  evaluateAtrialOneFiberGeometryV1,
  type AtrialOneFiberGeometryPriorV1,
} from "@/engine/myocardium/fourChamberV1/atria/atrialOneFiberGeometryV1";
import {
  evaluateExactEventCalciumV1,
} from "@/engine/myocardium/fourChamberV1/calcium/exactEventPrescribedCalciumV1";
import {
  initializeLand2017IsometricSteadyStateV1,
} from "@/engine/myocardium/fourChamberV1/land/isolatedLandTargetPackV1";
import {
  sourceLand2017StateToRateFreeV1,
  writeRateFreeLand2017RhsV1,
  type RateFreeLand2017StateV1,
} from "@/engine/myocardium/fourChamberV1/land/rateFreeLand2017V1";
import {
  createPhaseB1EndpointStateV1,
  type PhaseB1EndpointStateV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1EndpointStateV1";
import type {
  PhaseB1SlsModeV1,
  PhaseB1StoredDifferentialStateV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1StoredStateNewtonTopologyV1";
import type {
  PhaseB1WallMaterialBindingV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1WallMaterialBindingV1";
import {
  evaluatePhaseB1WallMaterialStateV1,
  type PhaseB1WallMaterialStateEvaluationV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1WallMaterialKernelV1";
import {
  evaluatePublishedTriSegGeometryV1,
  type PublishedTriSegGeometryV1,
  type PublishedTriSegWallGeometryParametersV1,
} from "@/engine/myocardium/fourChamberV1/triseg/publishedTriSegGeometryV1";
import {
  solvePublishedTriSegRootV1,
  type PublishedTriSegRootSuccessV1,
  type PublishedTriSegWallStressEvaluationV1,
} from "@/engine/myocardium/fourChamberV1/triseg/publishedTriSegRootV1";
import {
  BLOOD_COMPARTMENT_IDS,
  INERTIAL_FLOW_IDS,
  TRISEG_WALL_IDS,
  WALL_IDS,
  type BloodCompartmentId,
  type FourChamberWallId,
  type InertialFlowId,
  type TriSegWallId,
} from "@/engine/myocardium/fourChamberV1/topology/contracts";
import {
  assertExactPlainRecordV1,
} from "@/engine/myocardium/fourChamberV1/validation/strictClosedRecordV1";

export const PHASE_B1_MECHANISTIC_REBUILD_INITIALIZATION_V2_ID =
  "four-chamber-phase-b1-mechanistic-rebuild-initialization-v2" as const;

export const PHASE_B1_MECHANISTIC_REBUILD_INITIALIZATION_V2_POLICY =
  Object.freeze({
    policyId: "four-chamber-phase-b1-mechanistic-rebuild-initialization-policy-v2",
    landRule:
      "analytic-isometric-diastolic-steady-state-at-new-wall-specific-stretch" as const,
    slsRule: "alpha-v-equals-fiber-log-strain-zero-overstress" as const,
    triSegRule:
      "solve-published-two-coordinate-equilibrium-with-reequilibrated-material-at-every-iterate" as const,
    importedOldLandHistoryAllowed: false as const,
    importedOldSlsHistoryAllowed: false as const,
    importedOldTriSegCoordinatesAllowed: false as const,
    chamberPressureStationarityClaimed: false as const,
    physiologicalValidationClaimed: false as const,
  } as const);

type WallRecord<T> = Readonly<Record<FourChamberWallId, T>>;
type TriSegRecord<T> = Readonly<Record<TriSegWallId, T>>;

export type PhaseB1MechanisticRebuildInitializationInputV2 = Readonly<{
  timeSec: number;
  slsMode: PhaseB1SlsModeV1;
  bloodVolumesM3: Readonly<Record<BloodCompartmentId, number>>;
  inertialFlowsM3PerSec: Readonly<Record<InertialFlowId, number>>;
  atrialGeometryPriorByChamber: Readonly<{
    LA: AtrialOneFiberGeometryPriorV1;
    RA: AtrialOneFiberGeometryPriorV1;
  }>;
  triSegWalls: TriSegRecord<PublishedTriSegWallGeometryParametersV1>;
  wallMaterialBinding: PhaseB1WallMaterialBindingV1;
  initialTriSegCoordinates: Readonly<{
    V_m_S: number;
    y_m: number;
  }>;
}>;

export type PhaseB1MechanisticRebuildInitializationV2 = Readonly<{
  initializationId: typeof PHASE_B1_MECHANISTIC_REBUILD_INITIALIZATION_V2_ID;
  endpoint: PhaseB1EndpointStateV1;
  triSegRoot: PublishedTriSegRootSuccessV1;
  wallMaterialAtRootByWall: WallRecord<PhaseB1WallMaterialStateEvaluationV1>;
  audit: Readonly<{
    landRule:
      typeof PHASE_B1_MECHANISTIC_REBUILD_INITIALIZATION_V2_POLICY.landRule;
    slsRule:
      typeof PHASE_B1_MECHANISTIC_REBUILD_INITIALIZATION_V2_POLICY.slsRule;
    triSegRule:
      typeof PHASE_B1_MECHANISTIC_REBUILD_INITIALIZATION_V2_POLICY.triSegRule;
    freeCalciumUMByWall: WallRecord<number>;
    fiberLogStrainByWall: WallRecord<number>;
    landStretchByWall: WallRecord<number>;
    maximumAbsoluteLandRhsPerSecByWall: WallRecord<number>;
    maximumAbsoluteLandRhsPerSec: number;
    landSimplexMarginByWall: WallRecord<number>;
    minimumLandSimplexMargin: number;
    maximumAbsoluteSlsOverstressPa: number;
    triSegResidualNPerM: Readonly<{
      axial: number;
      radial: number;
      infinityNorm: number;
      scaledInfinityNorm: number;
    }>;
    publishedTaylorTwoPercentTensionErrorDomainEligible: true;
    importedOldLandHistory: false;
    importedOldSlsHistory: false;
    importedOldTriSegCoordinates: false;
    chamberPressureStationarityClaimed: false;
    physiologicalValidationClaimed: false;
    pass: true;
  }>;
}>;

export type PhaseB1RelaxedEndpointAtDeclaredCoordinatesV2 = Readonly<{
  endpoint: PhaseB1EndpointStateV1;
  geometry: PublishedTriSegGeometryV1;
  wallMaterialByWall: WallRecord<PhaseB1WallMaterialStateEvaluationV1>;
  audit: Readonly<{
    fiberLogStrainByWall: WallRecord<number>;
    landStretchByWall: WallRecord<number>;
    maximumAbsoluteLandRhsPerSecByWall: WallRecord<number>;
    maximumAbsoluteLandRhsPerSec: number;
    maximumAbsoluteSlsOverstressPa: number;
    minimumLandSimplexMargin: number;
    importedOldLandHistory: false;
    importedOldSlsHistory: false;
    triSegEquilibriumClaimedByThisBuilder: false;
    pass: true;
  }>;
}>;

/**
 * Rebuilds every geometry-dependent internal state after changing Vw, Aref, or
 * wall material.  No old active or viscoelastic history is copied across the
 * structural boundary.  The two TriSeg coordinates are solved while Land is
 * re-equilibrated at each candidate wall stretch; SLS starts with zero
 * overstress.  This is a mechanically consistent diastolic warm start, not a
 * claim that the complete circulation is at a stationary operating point.
 */
export function buildPhaseB1MechanisticRebuildInitializationV2(
  input: PhaseB1MechanisticRebuildInitializationInputV2,
): PhaseB1MechanisticRebuildInitializationV2 {
  validateInput(input);
  const calciumByWall = wallRecord(() => Object.freeze({ r: 0, d: 0 }));
  const freeCalciumUMByWall = wallRecord((wallId) =>
    evaluateExactEventCalciumV1(
      [0, 0],
      input.wallMaterialBinding.runtimeByWall[wallId]
        .prescribedCalciumParameters,
    ).freeCalciumUM);

  const evaluateTriSegWallStress = (
    geometry: PublishedTriSegGeometryV1,
  ): PublishedTriSegWallStressEvaluationV1 => {
    const material = triSegRecord((wallId) => geometryConsistentWallState(
      input.wallMaterialBinding,
      wallId,
      geometry.walls[wallId].fiberLogStrain,
      freeCalciumUMByWall[wallId],
      input.slsMode,
    ).evaluation);
    return Object.freeze({
      fiberKirchhoffStressPa: triSegRecord((wallId) =>
        material[wallId].totalWallKirchhoffStressPa),
      diagnostic: material,
    });
  };

  const initialGeometry = evaluatePublishedTriSegGeometryV1({
    leftVentricularCavityVolumeM3: input.bloodVolumesM3.LV,
    rightVentricularCavityVolumeM3: input.bloodVolumesM3.RV,
    septalMidwallCapVolumeM3: input.initialTriSegCoordinates.V_m_S,
    junctionRadiusM: input.initialTriSegCoordinates.y_m,
    walls: input.triSegWalls,
  });
  const initialStress = evaluateTriSegWallStress(initialGeometry)
    .fiberKirchhoffStressPa;
  const representativeTensionScaleNPerM = Math.max(
    ...TRISEG_WALL_IDS.map((wallId) => {
      const wall = initialGeometry.walls[wallId];
      return Math.abs(initialStress[wallId])
        * wall.parameters.wallMaterialVolumeM3
        / (2 * wall.midwallAreaM2);
    }),
    1e-6,
  );
  const triSegRoot = solvePublishedTriSegRootV1({
    leftVentricularCavityVolumeM3: input.bloodVolumesM3.LV,
    rightVentricularCavityVolumeM3: input.bloodVolumesM3.RV,
    walls: input.triSegWalls,
    initialCoordinates: Object.freeze({
      septalMidwallCapVolumeM3: input.initialTriSegCoordinates.V_m_S,
      junctionRadiusM: input.initialTriSegCoordinates.y_m,
    }),
    evaluateWallStress: evaluateTriSegWallStress,
    unknownScales: Object.freeze({
      septalMidwallCapVolumeM3: Math.max(
        Math.abs(input.initialTriSegCoordinates.V_m_S),
        20e-6,
      ),
      junctionRadiusM: Math.max(input.initialTriSegCoordinates.y_m, 0.02),
    }),
    equilibriumResidualScaleNPerM: representativeTensionScaleNPerM,
    junctionRadiusLowerBoundM: 1e-5,
    algorithmicJacobianScaledStep: 2 ** -19,
  });
  if (triSegRoot.converged === false) {
    throw new Error(
      `mechanistic-rebuild TriSeg initialization failed: ${triSegRoot.reason}: ${triSegRoot.message}`,
    );
  }

  const fiberLogStrainByWall = wallRecord((wallId) => {
    if (wallId === "LA" || wallId === "RA") {
      return evaluateAtrialOneFiberGeometryV1(
        input.bloodVolumesM3[wallId],
        input.atrialGeometryPriorByChamber[wallId],
      ).fiberLogStrain;
    }
    return triSegRoot.geometry.walls[wallId].fiberLogStrain;
  });
  const finalStateByWall = wallRecord((wallId) => geometryConsistentWallState(
    input.wallMaterialBinding,
    wallId,
    fiberLogStrainByWall[wallId],
    freeCalciumUMByWall[wallId],
    input.slsMode,
  ));
  const landByWall = wallRecord((wallId) => finalStateByWall[wallId].landState);
  const commonState = Object.freeze({
    bloodVolumesM3: Object.freeze({ ...input.bloodVolumesM3 }),
    inertialFlowsM3PerSec: Object.freeze({ ...input.inertialFlowsM3PerSec }),
    calciumByWall,
    landByWall,
  });
  const differentialState: PhaseB1StoredDifferentialStateV1 =
    input.slsMode === "on"
      ? Object.freeze({
        ...commonState,
        slsMode: "on" as const,
        slsAlphaVByWall: wallRecord((wallId) =>
          fiberLogStrainByWall[wallId]),
      })
      : Object.freeze({ ...commonState, slsMode: "off" as const });
  const endpoint = createPhaseB1EndpointStateV1({
    timeSec: input.timeSec,
    differentialState,
    triSegCoordinates: Object.freeze({
      V_m_S: triSegRoot.coordinates.septalMidwallCapVolumeM3,
      y_m: triSegRoot.coordinates.junctionRadiusM,
    }),
  });

  const landStretchByWall = wallRecord((wallId) =>
    finalStateByWall[wallId].evaluation.length.landStretch);
  const maximumAbsoluteLandRhsPerSecByWall = wallRecord((wallId) => Math.max(
    ...Array.from(writeRateFreeLand2017RhsV1(
      landByWall[wallId],
      {
        freeCalciumUM: freeCalciumUMByWall[wallId],
        landStretch: landStretchByWall[wallId],
      },
      input.wallMaterialBinding.runtimeByWall[wallId].landEquationParameters,
    ), Math.abs),
  ));
  const maximumAbsoluteLandRhsPerSec = Math.max(
    ...WALL_IDS.map((wallId) => maximumAbsoluteLandRhsPerSecByWall[wallId]),
  );
  const landSimplexMarginByWall = wallRecord((wallId) =>
    landSimplexMargin(landByWall[wallId]));
  const minimumLandSimplexMargin = Math.min(
    ...WALL_IDS.map((wallId) => landSimplexMarginByWall[wallId]),
  );
  const maximumAbsoluteSlsOverstressPa = Math.max(
    ...WALL_IDS.map((wallId) =>
      Math.abs(finalStateByWall[wallId].evaluation.sls.overstressPa)),
  );
  const axial = triSegRoot.oracle.equilibriumResidual.axialNPerM;
  const radial = triSegRoot.oracle.equilibriumResidual.radialNPerM;
  if (
    !(minimumLandSimplexMargin > 0)
    || maximumAbsoluteLandRhsPerSec > 1e-10
    || maximumAbsoluteSlsOverstressPa > 1e-9
    || triSegRoot.scaledResidualInfinityNorm > 1e-8
    || !triSegRoot.oracle.taylorTensionErrorDomainEligible
  ) {
    throw new Error("mechanistic-rebuild initialization consistency audit failed");
  }

  return Object.freeze({
    initializationId: PHASE_B1_MECHANISTIC_REBUILD_INITIALIZATION_V2_ID,
    endpoint,
    triSegRoot,
    wallMaterialAtRootByWall: wallRecord((wallId) =>
      finalStateByWall[wallId].evaluation),
    audit: Object.freeze({
      landRule: PHASE_B1_MECHANISTIC_REBUILD_INITIALIZATION_V2_POLICY.landRule,
      slsRule: PHASE_B1_MECHANISTIC_REBUILD_INITIALIZATION_V2_POLICY.slsRule,
      triSegRule: PHASE_B1_MECHANISTIC_REBUILD_INITIALIZATION_V2_POLICY.triSegRule,
      freeCalciumUMByWall,
      fiberLogStrainByWall,
      landStretchByWall,
      maximumAbsoluteLandRhsPerSecByWall,
      maximumAbsoluteLandRhsPerSec,
      landSimplexMarginByWall,
      minimumLandSimplexMargin,
      maximumAbsoluteSlsOverstressPa,
      triSegResidualNPerM: Object.freeze({
        axial,
        radial,
        infinityNorm: Math.max(Math.abs(axial), Math.abs(radial)),
        scaledInfinityNorm: triSegRoot.scaledResidualInfinityNorm,
      }),
      publishedTaylorTwoPercentTensionErrorDomainEligible: true as const,
      importedOldLandHistory: false as const,
      importedOldSlsHistory: false as const,
      importedOldTriSegCoordinates: false as const,
      chamberPressureStationarityClaimed: false as const,
      physiologicalValidationClaimed: false as const,
      pass: true as const,
    }),
  });
}

/**
 * Rebuilds material state at an externally solved geometry.  This is the
 * state-construction half of the 7D pre-A operating-point solve: the caller,
 * not this function, owns the two TriSeg equilibrium equations.
 */
export function buildPhaseB1RelaxedEndpointAtDeclaredCoordinatesV2(
  input: Readonly<{
    timeSec: number;
    slsMode: PhaseB1SlsModeV1;
    bloodVolumesM3: Readonly<Record<BloodCompartmentId, number>>;
    inertialFlowsM3PerSec: Readonly<Record<InertialFlowId, number>>;
    atrialGeometryPriorByChamber: Readonly<{
      LA: AtrialOneFiberGeometryPriorV1;
      RA: AtrialOneFiberGeometryPriorV1;
    }>;
    triSegWalls: TriSegRecord<PublishedTriSegWallGeometryParametersV1>;
    wallMaterialBinding: PhaseB1WallMaterialBindingV1;
    triSegCoordinates: Readonly<{ V_m_S: number; y_m: number }>;
  }>,
): PhaseB1RelaxedEndpointAtDeclaredCoordinatesV2 {
  assertExactPlainRecordV1(input, [
    "timeSec",
    "slsMode",
    "bloodVolumesM3",
    "inertialFlowsM3PerSec",
    "atrialGeometryPriorByChamber",
    "triSegWalls",
    "wallMaterialBinding",
    "triSegCoordinates",
  ], "relaxed endpoint at declared coordinates input");
  validateInput({
    timeSec: input.timeSec,
    slsMode: input.slsMode,
    bloodVolumesM3: input.bloodVolumesM3,
    inertialFlowsM3PerSec: input.inertialFlowsM3PerSec,
    atrialGeometryPriorByChamber: input.atrialGeometryPriorByChamber,
    triSegWalls: input.triSegWalls,
    wallMaterialBinding: input.wallMaterialBinding,
    initialTriSegCoordinates: input.triSegCoordinates,
  });
  const geometry = evaluatePublishedTriSegGeometryV1({
    leftVentricularCavityVolumeM3: input.bloodVolumesM3.LV,
    rightVentricularCavityVolumeM3: input.bloodVolumesM3.RV,
    septalMidwallCapVolumeM3: input.triSegCoordinates.V_m_S,
    junctionRadiusM: input.triSegCoordinates.y_m,
    walls: input.triSegWalls,
  });
  const freeCalciumUMByWall = wallRecord((wallId) =>
    evaluateExactEventCalciumV1(
      [0, 0],
      input.wallMaterialBinding.runtimeByWall[wallId]
        .prescribedCalciumParameters,
    ).freeCalciumUM);
  const fiberLogStrainByWall = wallRecord((wallId) => {
    if (wallId === "LA" || wallId === "RA") {
      return evaluateAtrialOneFiberGeometryV1(
        input.bloodVolumesM3[wallId],
        input.atrialGeometryPriorByChamber[wallId],
      ).fiberLogStrain;
    }
    return geometry.walls[wallId].fiberLogStrain;
  });
  const stateByWall = wallRecord((wallId) => geometryConsistentWallState(
    input.wallMaterialBinding,
    wallId,
    fiberLogStrainByWall[wallId],
    freeCalciumUMByWall[wallId],
    input.slsMode,
  ));
  const landByWall = wallRecord((wallId) => stateByWall[wallId].landState);
  const commonState = Object.freeze({
    bloodVolumesM3: Object.freeze({ ...input.bloodVolumesM3 }),
    inertialFlowsM3PerSec: Object.freeze({ ...input.inertialFlowsM3PerSec }),
    calciumByWall: wallRecord(() => Object.freeze({ r: 0, d: 0 })),
    landByWall,
  });
  const differentialState: PhaseB1StoredDifferentialStateV1 = input.slsMode === "on"
    ? Object.freeze({
      ...commonState,
      slsMode: "on" as const,
      slsAlphaVByWall: wallRecord((wallId) => fiberLogStrainByWall[wallId]),
    })
    : Object.freeze({ ...commonState, slsMode: "off" as const });
  const endpoint = createPhaseB1EndpointStateV1({
    timeSec: input.timeSec,
    differentialState,
    triSegCoordinates: Object.freeze({ ...input.triSegCoordinates }),
  });
  const landStretchByWall = wallRecord((wallId) =>
    stateByWall[wallId].evaluation.length.landStretch);
  const maximumAbsoluteLandRhsPerSecByWall = wallRecord((wallId) => Math.max(
    ...Array.from(writeRateFreeLand2017RhsV1(
      landByWall[wallId],
      {
        freeCalciumUM: freeCalciumUMByWall[wallId],
        landStretch: landStretchByWall[wallId],
      },
      input.wallMaterialBinding.runtimeByWall[wallId].landEquationParameters,
    ), Math.abs),
  ));
  const maximumAbsoluteLandRhsPerSec = Math.max(
    ...WALL_IDS.map((wallId) => maximumAbsoluteLandRhsPerSecByWall[wallId]),
  );
  const maximumAbsoluteSlsOverstressPa = Math.max(...WALL_IDS.map((wallId) =>
    Math.abs(stateByWall[wallId].evaluation.sls.overstressPa)));
  const minimumLandSimplexMargin = Math.min(...WALL_IDS.map((wallId) =>
    landSimplexMargin(landByWall[wallId])));
  if (
    !(minimumLandSimplexMargin > 0)
    || maximumAbsoluteLandRhsPerSec > 1e-10
    || maximumAbsoluteSlsOverstressPa > 1e-9
  ) {
    throw new Error("declared-coordinate relaxed material consistency audit failed");
  }
  return Object.freeze({
    endpoint,
    geometry,
    wallMaterialByWall: wallRecord((wallId) =>
      stateByWall[wallId].evaluation),
    audit: Object.freeze({
      fiberLogStrainByWall,
      landStretchByWall,
      maximumAbsoluteLandRhsPerSecByWall,
      maximumAbsoluteLandRhsPerSec,
      maximumAbsoluteSlsOverstressPa,
      minimumLandSimplexMargin,
      importedOldLandHistory: false as const,
      importedOldSlsHistory: false as const,
      triSegEquilibriumClaimedByThisBuilder: false as const,
      pass: true as const,
    }),
  });
}

function geometryConsistentWallState(
  binding: PhaseB1WallMaterialBindingV1,
  wallId: FourChamberWallId,
  fiberLogStrain: number,
  freeCalciumUM: number,
  slsMode: PhaseB1SlsModeV1,
): Readonly<{
  landState: RateFreeLand2017StateV1;
  evaluation: PhaseB1WallMaterialStateEvaluationV1;
}> {
  const material = binding.runtimeByWall[wallId];
  const length = evaluateLandLengthStateV1(
    material.landWallAdapterContext,
    { fiberLogStrain },
  );
  const sourceState = initializeLand2017IsometricSteadyStateV1(
    length.landStretch,
    freeCalciumUM,
    material.landEquationParameters,
  );
  const landState = sourceLand2017StateToRateFreeV1(
    sourceState,
    length.landStretch,
    material.landEquationParameters,
  );
  return Object.freeze({
    landState,
    evaluation: evaluatePhaseB1WallMaterialStateV1({
      wallMaterial: material,
      fiberLogStrain,
      freeCalciumUM,
      landState,
      slsMode,
      alphaV: slsMode === "on" ? fiberLogStrain : null,
    }),
  });
}

function landSimplexMargin(state: RateFreeLand2017StateV1): number {
  const [caTrpn, blocked, weak, strong] = state;
  return Math.min(
    caTrpn,
    1 - caTrpn,
    blocked,
    weak,
    strong,
    1 - blocked - weak - strong,
  );
}

function validateInput(input: PhaseB1MechanisticRebuildInitializationInputV2): void {
  assertExactPlainRecordV1(input, [
    "timeSec",
    "slsMode",
    "bloodVolumesM3",
    "inertialFlowsM3PerSec",
    "atrialGeometryPriorByChamber",
    "triSegWalls",
    "wallMaterialBinding",
    "initialTriSegCoordinates",
  ], "mechanistic-rebuild initialization input");
  if (!Number.isFinite(input.timeSec) || input.timeSec < 0) {
    throw new Error("mechanistic-rebuild timeSec must be finite and nonnegative");
  }
  if (input.slsMode !== "on" && input.slsMode !== "off") {
    throw new Error("mechanistic-rebuild slsMode must be on or off");
  }
  assertExactPlainRecordV1(
    input.bloodVolumesM3,
    BLOOD_COMPARTMENT_IDS,
    "mechanistic-rebuild blood volumes",
  );
  BLOOD_COMPARTMENT_IDS.forEach((id) => requirePositiveFinite(
    input.bloodVolumesM3[id],
    `bloodVolumesM3.${id}`,
  ));
  assertExactPlainRecordV1(
    input.inertialFlowsM3PerSec,
    INERTIAL_FLOW_IDS,
    "mechanistic-rebuild inertial flows",
  );
  INERTIAL_FLOW_IDS.forEach((id) => requireFinite(
    input.inertialFlowsM3PerSec[id],
    `inertialFlowsM3PerSec.${id}`,
  ));
  assertExactPlainRecordV1(
    input.atrialGeometryPriorByChamber,
    ["LA", "RA"],
    "mechanistic-rebuild atrial geometry",
  );
  assertExactPlainRecordV1(
    input.triSegWalls,
    TRISEG_WALL_IDS,
    "mechanistic-rebuild TriSeg walls",
  );
  assertExactPlainRecordV1(
    input.initialTriSegCoordinates,
    ["V_m_S", "y_m"],
    "mechanistic-rebuild initial TriSeg coordinates",
  );
  requireFinite(input.initialTriSegCoordinates.V_m_S, "initialTriSegCoordinates.V_m_S");
  requirePositiveFinite(input.initialTriSegCoordinates.y_m, "initialTriSegCoordinates.y_m");
}

function wallRecord<T>(
  build: (wallId: FourChamberWallId) => T,
): WallRecord<T> {
  return Object.freeze(Object.fromEntries(
    WALL_IDS.map((wallId) => [wallId, build(wallId)]),
  )) as WallRecord<T>;
}

function triSegRecord<T>(
  build: (wallId: TriSegWallId) => T,
): TriSegRecord<T> {
  return Object.freeze(Object.fromEntries(
    TRISEG_WALL_IDS.map((wallId) => [wallId, build(wallId)]),
  )) as TriSegRecord<T>;
}

function requireFinite(value: number, label: string): number {
  if (!Number.isFinite(value)) throw new Error(`${label} must be finite`);
  return value;
}

function requirePositiveFinite(value: number, label: string): number {
  if (!Number.isFinite(value) || !(value > 0)) {
    throw new Error(`${label} must be finite and positive`);
  }
  return value;
}
