import { stableHash, sanitizeForStableHash } from "@/engine/integrity/stableHash";
import { initializeMainWireIntegratedModelV3 } from "@/engine/myocardium/MainWireIntegratedModelTransactionV3";
import { createMaterialKernelsWithMechanicsResearchInputsV1 } from "@/engine/myocardium/mechanics/MainWireNormalAdultFiveWallProviderV1";
import { createMainWireFiveWallLandTriSegProviderV1, type MainWireFiveWallLandTriSegStateV1 } from "@/engine/myocardium/mechanics/MainWireFiveWallLandTriSegProviderV1";
import { NORMAL_ADULT_FIVE_WALL_PRIOR_V1 as prior } from "@/engine/myocardium/mechanics/normalAdultFiveWallPriorV1";
import { MAIN_WIRE_VENTRICULAR_ROUNDED_EJECTION_WALL_MATERIAL_V1 as baseMaterial,
  MAIN_WIRE_VENTRICULAR_ROUNDED_EJECTION_COLD_MAXIMUM_ITERATIONS_V1 as coldIterations } from "@/engine/myocardium/mechanics/MainWireVentricularRoundedEjectionProfileV1";
import { createPopulationMomentWallKernelV1, wrapAtrialLandKernelForMomentResearchV1,
  POPULATION_MOMENT_WALL_RESEARCH_V1, type PopulationMomentResearchWallStateV1 } from "./PopulationMomentWallResearchV1";
import { createMainWireBaselineReferenceResearchV1 } from "./MainWireBaselineReferenceResearchV1";
import type { PopulationMomentRecoveryV1 } from "./LandPopulationMomentResearchV1";

export const MAIN_WIRE_POPULATION_MOMENT_RESEARCH_V1 = "main-wire-population-moment-research-v1";
export type MainWirePopulationMomentMechanicsStateV1 = MainWireFiveWallLandTriSegStateV1<PopulationMomentResearchWallStateV1>;

/** Explicit research construction, not a published identity or a Land-state
 * migration. Reuses circulation, geometry, Ca, atria, passive/SLS and observers.
 * All three ventricular walls change together because the septum is shared. */
export function createMainWirePopulationMomentResearchV1(
  request: Parameters<typeof createMainWireBaselineReferenceResearchV1>[0],
  recovery: PopulationMomentRecoveryV1 = "source-phi-turnover-closure",
) {
  if (request.admissionRole !== "intervention" || request.ventricularBridgeExit !== "none") {
    throw new Error("population-moment fixture requires research intervention and no added bridge exit");
  }
  const source = createMainWireBaselineReferenceResearchV1(request);
  const material = Object.freeze({ ...baseMaterial, landSlackStretch: source.researchLandSlackStretch,
    landEquationParameters: source.researchLandParameters });
  const mechanics = source.mechanismResearchInputs.chamberMechanics;
  const kernels = createMaterialKernelsWithMechanicsResearchInputsV1(mechanics, material, coldIterations);
  const moment = (wallId: "LVFW" | "SEP" | "RVFW") => createPopulationMomentWallKernelV1({
    wallId, material, passiveScale: mechanics.passiveStiffnessScaleByWall[wallId], recovery });
  const atrialGeometry = (id: "LA" | "RA") => ({
    wallMaterialVolumeM3: prior.anatomy.atria[id].wallMaterialVolumeMl * 1e-6,
    referenceCavityBloodVolumeM3: prior.anatomy.atria[id].inverseUnloadedReferenceCavityVolumeMl * 1e-6,
  });
  const researchParameterIdentity = stableHash(sanitizeForStableHash({
    constructionId: MAIN_WIRE_POPULATION_MOMENT_RESEARCH_V1, sourceParameterIdentity: source.researchParameterIdentity,
    materialId: POPULATION_MOMENT_WALL_RESEARCH_V1, recovery, initialization: "own-cold-equilibrium" }));
  const provider = createMainWireFiveWallLandTriSegProviderV1<PopulationMomentResearchWallStateV1>({
    parameterSetId: `${MAIN_WIRE_POPULATION_MOMENT_RESEARCH_V1}-${researchParameterIdentity}`,
    materialByWall: { LA: wrapAtrialLandKernelForMomentResearchV1(kernels.LA),
      RA: wrapAtrialLandKernelForMomentResearchV1(kernels.RA), LVFW: moment("LVFW"), SEP: moment("SEP"), RVFW: moment("RVFW") },
    atria: { LA: atrialGeometry("LA"), RA: atrialGeometry("RA") },
    trisegWalls: prior.anatomy.triSeg.wallGeometryParameters,
    initialTriSegCoordinates: prior.anatomy.triSeg.loadedCoordinates,
    internalCoordinateScales: {
      septalMidwallCapVolumeM3: Math.abs(prior.anatomy.triSeg.loadedCoordinates.septalMidwallCapVolumeM3),
      junctionRadiusM: prior.anatomy.triSeg.loadedCoordinates.junctionRadiusM,
    },
  });
  // No source accepted state is copied into the new material law.
  const { circulationNewtonOptions: _stepOnly, ...coldCoronaryInput } = source.coronaryStepInput;
  const cold = initializeMainWireIntegratedModelV3({
    coronary: { ...coldCoronaryInput, provider,
      fixedGlobalTotalBloodVolumeMl: source.hemodynamicResearchInputs.totalBloodVolumeMl,
      autoregulationWindow: { durationSec: source.cycleLengthSec, interpretation: "periodic-sinus-cycle-aligned" } },
    rhythm: { configuration: source.rhythm.configuration, acceptedState: source.rhythm.state },
    dynamicMechanicalSupport: source.dynamicMechanicalSupport,
  });
  const researchClaim = Object.freeze({ ...source.researchClaim, newContinuousState: true,
    calciumOrKineticsChanged: true, materialLawChanged: true,
    componentSourceLandParameterIdentity: source.researchLandParameters.parameterSetStableHash,
    recovery, stateDimensionPerWallUnchanged: true,
    sourceLandCounterpartIdentity: source.researchParameterIdentity,
    coldOnlyNoLandCheckpointMigration: true, pressureClippingOrValveFeedback: false,
    unchangedGeometryAtriaPassiveSlsAndCirculation: true });
  return Object.freeze({ ...source, provider, cold, researchParameterIdentity, researchClaim,
    researchConstructionId: MAIN_WIRE_POPULATION_MOMENT_RESEARCH_V1, researchRecovery: recovery });
}

export type MainWirePopulationMomentResearchFixtureV1 = ReturnType<typeof createMainWirePopulationMomentResearchV1>;

export function populationMomentResearchCheckpointContextV1(f: MainWirePopulationMomentResearchFixtureV1) {
  return { provider: f.provider, coronaryPrior: f.coronaryStepInput.coronaryPrior,
    collapseHydraulics: f.coronaryStepInput.collapseHydraulics, impMechanism: f.coronaryStepInput.impMechanism,
    shorteningImpPrior: f.coronaryStepInput.shorteningImpPrior,
    coronaryAutoregulationBinding: f.cold.acceptedState.coronary.coronaryAutoregulationBinding,
    rhythm: { configuration: f.rhythm.configuration }, dynamicMechanicalSupportProfile: f.profile,
    dynamicMechanicalSupportConfig: f.config, hemodynamicResearchInputs: f.hemodynamicResearchInputs };
}
