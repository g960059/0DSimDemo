import {
  evaluateExactEventCalciumV1,
} from
  "@/engine/myocardium/fourChamberV1/calcium/exactEventPrescribedCalciumV1";
import {
  initializeLand2017IsometricSteadyStateV1,
} from "@/engine/myocardium/fourChamberV1/land/isolatedLandTargetPackV1";
import {
  sourceLand2017StateToRateFreeV1,
  writeRateFreeLand2017RhsV1,
  type RateFreeLand2017StateV1,
} from "@/engine/myocardium/fourChamberV1/land/rateFreeLand2017V1";
import type {
  CanonicalSha256HexProvider,
} from "@/engine/myocardium/fourChamberV1/manifests/canonicalJson";
import {
  buildPhaseB1SyntheticClosedLoopScaffoldV1,
  phaseB1SyntheticClosedLoopScaffoldConfigurationSha256V1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/syntheticClosedLoopScaffoldV1";
import {
  createPhaseB1EndpointStateV1,
  type PhaseB1EndpointStateV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1EndpointStateV1";
import {
  type PhaseB1SlsModeV1,
  type PhaseB1StoredDifferentialStateV1,
} from
  "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1StoredStateNewtonTopologyV1";
import {
  buildPhaseB1WallMaterialBindingV1,
  type PhaseB1WallMaterialBindingV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1WallMaterialBindingV1";
import {
  PHASE_B1_WALL_MATERIAL_KERNEL_V1_ID,
  evaluatePhaseB1WallMaterialStateV1,
  type PhaseB1WallMaterialStateEvaluationV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1WallMaterialKernelV1";
import type { PublishedTriSegGeometryV1 } from
  "@/engine/myocardium/fourChamberV1/triseg/publishedTriSegGeometryV1";
import {
  solvePublishedTriSegRootV1,
  type PublishedTriSegRootSuccessV1,
  type PublishedTriSegWallStressEvaluationV1,
} from "@/engine/myocardium/fourChamberV1/triseg/publishedTriSegRootV1";
import {
  TRISEG_WALL_IDS,
  WALL_IDS,
  type FourChamberWallId,
  type TriSegWallId,
} from "@/engine/myocardium/fourChamberV1/topology/contracts";

export const PHASE_B1_SYNTHETIC_GEOMETRY_WARM_START_V1_ID =
  "four-chamber-phase-b1-synthetic-geometry-warm-start-v1" as const;

export type PhaseB1SyntheticTriSegStressDiagnosticV1 = Readonly<{
  stressSource: typeof PHASE_B1_WALL_MATERIAL_KERNEL_V1_ID;
  wallMaterialByWall: Readonly<
    Record<TriSegWallId, PhaseB1WallMaterialStateEvaluationV1>
  >;
}>;

export type PhaseB1SyntheticGeometryWarmStartV1 = Readonly<{
  initializationId: typeof PHASE_B1_SYNTHETIC_GEOMETRY_WARM_START_V1_ID;
  slsMode: PhaseB1SlsModeV1;
  endpoint: PhaseB1EndpointStateV1;
  triSegRoot: PublishedTriSegRootSuccessV1;
  triSegWallMaterialAtRootByWall: Readonly<
    Record<TriSegWallId, PhaseB1WallMaterialStateEvaluationV1>
  >;
  audit: Readonly<{
    calciumStateRule: "zero-drive-pair-yields-wall-specific-diastolic-calcium";
    evaluatedFreeCalciumUMByWall: Readonly<Record<FourChamberWallId, number>>;
    fiberLogStrainByWall: Readonly<Record<FourChamberWallId, number>>;
    landStretchByWall: Readonly<Record<FourChamberWallId, number>>;
    maximumAbsoluteLandRhsPerSecByWall:
      Readonly<Record<FourChamberWallId, number>>;
    landSimplexMarginByWall: Readonly<Record<FourChamberWallId, number>>;
    minimumLandSimplexMargin: number;
    landStatesStrictlyInsidePopulationSimplex: true;
    geometryConsistentIsometricSteadyStateByWall: true;
    slsAlphaVEqualsFiberLogStrainWhenPresent: true;
    triSegRawResidualNPerM: Readonly<{
      axial: number;
      radial: number;
      infinityNorm: number;
    }>;
    triSegScaledResidualInfinityNorm: number;
    activeStressStateSource:
      "analytic-isometric-steady-source-state-at-candidate-geometry-transformed-to-rate-free-v1";
    sourceSteadyInitializer:
      "initializeLand2017IsometricSteadyStateV1";
    activeStressEvaluator: typeof PHASE_B1_WALL_MATERIAL_KERNEL_V1_ID;
    surrogateInstantaneousEquilibriumActiveStressReused: false;
  }>;
  provenance: Readonly<{
    symmetricClosedLoopScaffoldConfigurationSha256: string;
    phaseA1TissueManifestBundleSha256: string;
    phaseB1WallMaterialBindingSha256: string;
    atrialTissueManifestSha256: string;
    ventricularTissueManifestSha256: string;
    atrialTargetPackSha256: string;
    ventricularTargetPackSha256: string;
  }>;
  testOnly: true;
  fullColdInitializationComplete: false;
  atrialEquilibriumClaimed: false;
  closedLoopEquilibriumClaimed: false;
}>;

/**
 * Builds a deterministic Phase B1 test warm start. The neutral scaffold
 * contributes only synthetic V/Q and reference geometry. At every candidate TriSeg
 * geometry, active stress is recomputed from the analytic isometric Land
 * steady state at that wall's own stretch and diastolic calcium. The final
 * stored Land and SLS coordinates are then rebuilt at the converged geometry.
 */
export function buildPhaseB1SyntheticGeometryWarmStartV1(
  slsMode: PhaseB1SlsModeV1,
  sha256Hex: CanonicalSha256HexProvider,
): PhaseB1SyntheticGeometryWarmStartV1 {
  if (slsMode !== "on" && slsMode !== "off") {
    throw new Error("Phase B1 synthetic warm start slsMode must be on or off");
  }
  const scaffold = buildPhaseB1SyntheticClosedLoopScaffoldV1(sha256Hex);
  const bundle = scaffold.phaseA1TissueManifestBundle;
  const binding = buildPhaseB1WallMaterialBindingV1(bundle, sha256Hex);

  const evaluateWallStress = (
    geometry: PublishedTriSegGeometryV1,
  ): PublishedTriSegWallStressEvaluationV1 => {
    const wallMaterialByWall = triSegWallRecord((wallId) =>
      geometryConsistentWallState(
        binding,
        wallId,
        geometry.walls[wallId].fiberLogStrain,
        slsMode,
      ).evaluation);
    const diagnostic: PhaseB1SyntheticTriSegStressDiagnosticV1 = Object.freeze({
      stressSource: PHASE_B1_WALL_MATERIAL_KERNEL_V1_ID,
      wallMaterialByWall,
    });
    return Object.freeze({
      fiberKirchhoffStressPa: triSegWallRecord((wallId) =>
        wallMaterialByWall[wallId].totalWallKirchhoffStressPa),
      diagnostic,
    });
  };

  const root = solvePublishedTriSegRootV1({
    leftVentricularCavityVolumeM3:
      scaffold.initialState.bloodVolumesM3.LV,
    rightVentricularCavityVolumeM3:
      scaffold.initialState.bloodVolumesM3.RV,
    walls: scaffold.triSegReference.walls,
    initialCoordinates: Object.freeze({
      septalMidwallCapVolumeM3:
        scaffold.initialState.triSegCoordinates.V_m_S,
      junctionRadiusM: scaffold.initialState.triSegCoordinates.y_m,
    }),
    evaluateWallStress,
    unknownScales: Object.freeze({
      septalMidwallCapVolumeM3:
        scaffold.newtonScaleRegistry.unknownScales.septalMidwallVolumeM3,
      junctionRadiusM:
        scaffold.newtonScaleRegistry.unknownScales.junctionRadiusM,
    }),
    equilibriumResidualScaleNPerM:
      scaffold.newtonScaleRegistry.residualScales
        .publishedTriSegEquilibriumNPerM,
    junctionRadiusLowerBoundM: 1e-6,
    algorithmicJacobianScaledStep: 2 ** -19,
  });
  if (root.converged === false) {
    throw new Error(
      `Phase B1 synthetic TriSeg warm-start root failed: ${root.reason}: ${root.message}`,
    );
  }

  const fiberLogStrainByWall = wallRecord((wallId) => {
    if (wallId === "LA" || wallId === "RA") return 0;
    return root.geometry.walls[wallId].fiberLogStrain;
  });
  const finalMaterialByWall = wallRecord((wallId) =>
    geometryConsistentWallState(
      binding,
      wallId,
      fiberLogStrainByWall[wallId],
      slsMode,
    ));
  const calciumByWall = wallRecord(() => Object.freeze({ r: 0, d: 0 }));
  const landByWall = wallRecord((wallId) =>
    finalMaterialByWall[wallId].landState);
  const commonState = Object.freeze({
    bloodVolumesM3: Object.freeze({ ...scaffold.initialState.bloodVolumesM3 }),
    inertialFlowsM3PerSec: Object.freeze({
      ...scaffold.initialState.inertialFlowsM3PerSec,
    }),
    calciumByWall,
    landByWall,
  });
  const differentialState: PhaseB1StoredDifferentialStateV1 = slsMode === "on"
    ? Object.freeze({
      ...commonState,
      slsMode: "on" as const,
      slsAlphaVByWall: wallRecord((wallId) =>
        fiberLogStrainByWall[wallId]),
    })
    : Object.freeze({
      ...commonState,
      slsMode: "off" as const,
    });
  const endpoint = createPhaseB1EndpointStateV1({
    timeSec: scaffold.initialState.timeSec,
    differentialState,
    triSegCoordinates: Object.freeze({
      V_m_S: root.coordinates.septalMidwallCapVolumeM3,
      y_m: root.coordinates.junctionRadiusM,
    }),
  });
  const rootDiagnostic = requireStressDiagnostic(root.wallStress.diagnostic);
  const evaluatedFreeCalciumUMByWall = wallRecord((wallId) => {
    const state = endpoint.differentialState.calciumByWall[wallId];
    return evaluateExactEventCalciumV1(
      [state.r, state.d],
      binding.runtimeByWall[wallId].prescribedCalciumParameters,
    ).freeCalciumUM;
  });
  const landStretchByWall = wallRecord((wallId) =>
    finalMaterialByWall[wallId].evaluation.length.landStretch);
  const maximumAbsoluteLandRhsPerSecByWall = wallRecord((wallId) => {
    const rhs = writeRateFreeLand2017RhsV1(
      endpoint.differentialState.landByWall[wallId],
      {
        freeCalciumUM: evaluatedFreeCalciumUMByWall[wallId],
        landStretch: landStretchByWall[wallId],
      },
      binding.runtimeByWall[wallId].landEquationParameters,
    );
    return Math.max(...Array.from(rhs, Math.abs));
  });
  const landSimplexMarginByWall = wallRecord((wallId) =>
    landSimplexMargin(endpoint.differentialState.landByWall[wallId]));
  const minimumLandSimplexMargin = Math.min(
    ...WALL_IDS.map((wallId) => landSimplexMarginByWall[wallId]),
  );
  if (!(minimumLandSimplexMargin > 0)) {
    throw new Error(
      "Phase B1 synthetic warm-start Land states must be strictly inside the population simplex",
    );
  }
  const axialResidual = root.oracle.equilibriumResidual.axialNPerM;
  const radialResidual = root.oracle.equilibriumResidual.radialNPerM;

  return Object.freeze({
    initializationId: PHASE_B1_SYNTHETIC_GEOMETRY_WARM_START_V1_ID,
    slsMode,
    endpoint,
    triSegRoot: root,
    triSegWallMaterialAtRootByWall: rootDiagnostic.wallMaterialByWall,
    audit: Object.freeze({
      calciumStateRule:
        "zero-drive-pair-yields-wall-specific-diastolic-calcium" as const,
      evaluatedFreeCalciumUMByWall,
      fiberLogStrainByWall,
      landStretchByWall,
      maximumAbsoluteLandRhsPerSecByWall,
      landSimplexMarginByWall,
      minimumLandSimplexMargin,
      landStatesStrictlyInsidePopulationSimplex: true as const,
      geometryConsistentIsometricSteadyStateByWall: true as const,
      slsAlphaVEqualsFiberLogStrainWhenPresent: true as const,
      triSegRawResidualNPerM: Object.freeze({
        axial: axialResidual,
        radial: radialResidual,
        infinityNorm: Math.max(
          Math.abs(axialResidual),
          Math.abs(radialResidual),
        ),
      }),
      triSegScaledResidualInfinityNorm: root.scaledResidualInfinityNorm,
      activeStressStateSource:
        "analytic-isometric-steady-source-state-at-candidate-geometry-transformed-to-rate-free-v1" as const,
      sourceSteadyInitializer:
        "initializeLand2017IsometricSteadyStateV1" as const,
      activeStressEvaluator: PHASE_B1_WALL_MATERIAL_KERNEL_V1_ID,
      surrogateInstantaneousEquilibriumActiveStressReused: false as const,
    }),
    provenance: Object.freeze({
      symmetricClosedLoopScaffoldConfigurationSha256:
        phaseB1SyntheticClosedLoopScaffoldConfigurationSha256V1(sha256Hex),
      phaseA1TissueManifestBundleSha256: bundle.contentSha256,
      phaseB1WallMaterialBindingSha256: binding.contentSha256,
      atrialTissueManifestSha256: bundle.atrialManifest.contentSha256,
      ventricularTissueManifestSha256:
        bundle.ventricularManifest.contentSha256,
      atrialTargetPackSha256: bundle.atrialTargetPack.contentSha256,
      ventricularTargetPackSha256:
        bundle.ventricularTargetPack.contentSha256,
    }),
    testOnly: true,
    fullColdInitializationComplete: false,
    atrialEquilibriumClaimed: false,
    closedLoopEquilibriumClaimed: false,
  });
}

function geometryConsistentWallState(
  binding: PhaseB1WallMaterialBindingV1,
  wallId: FourChamberWallId,
  fiberLogStrain: number,
  slsMode: PhaseB1SlsModeV1,
): Readonly<{
  landState: RateFreeLand2017StateV1;
  evaluation: PhaseB1WallMaterialStateEvaluationV1;
}> {
  const material = binding.runtimeByWall[wallId];
  const landStretch = material.landWallAdapterContext.lambdaLandSlack
    * Math.exp(fiberLogStrain);
  const freeCalciumUM =
    material.prescribedCalciumParameters.calciumDiastolicUM;
  const sourceState = initializeLand2017IsometricSteadyStateV1(
    landStretch,
    freeCalciumUM,
    material.landEquationParameters,
  );
  const landState = sourceLand2017StateToRateFreeV1(
    sourceState,
    landStretch,
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

function requireStressDiagnostic(
  diagnostic: unknown,
): PhaseB1SyntheticTriSegStressDiagnosticV1 {
  if (
    diagnostic === null
    || typeof diagnostic !== "object"
    || !("stressSource" in diagnostic)
    || diagnostic.stressSource !== PHASE_B1_WALL_MATERIAL_KERNEL_V1_ID
    || !("wallMaterialByWall" in diagnostic)
  ) {
    throw new Error("Phase B1 synthetic TriSeg root lost its real-material diagnostic");
  }
  return diagnostic as PhaseB1SyntheticTriSegStressDiagnosticV1;
}

function wallRecord<T>(
  evaluate: (wallId: FourChamberWallId) => T,
): Readonly<Record<FourChamberWallId, T>> {
  return Object.freeze(Object.fromEntries(
    WALL_IDS.map((wallId) => [wallId, evaluate(wallId)]),
  )) as Readonly<Record<FourChamberWallId, T>>;
}

function triSegWallRecord<T>(
  evaluate: (wallId: TriSegWallId) => T,
): Readonly<Record<TriSegWallId, T>> {
  return Object.freeze(Object.fromEntries(
    TRISEG_WALL_IDS.map((wallId) => [wallId, evaluate(wallId)]),
  )) as Readonly<Record<TriSegWallId, T>>;
}
