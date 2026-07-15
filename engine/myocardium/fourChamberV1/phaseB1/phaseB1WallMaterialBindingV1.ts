import {
  compilePhaseA1LandWallAdapterContextV1,
  type LandWallAdapterContextV1,
} from "@/engine/myocardium/fourChamberV1/adapters/landWallAdapterContextV1";
import type {
  ExactEventCalciumParametersV1,
} from "@/engine/myocardium/fourChamberV1/calcium/exactEventPrescribedCalciumV1";
import {
  computeCanonicalSha256,
  type CanonicalSha256HexProvider,
} from "@/engine/myocardium/fourChamberV1/manifests/canonicalJson";
import {
  bindPhaseA1PassiveSlsFromTissueManifestV1,
  type PhaseA1ManifestBoundPassiveSlsV1,
} from "@/engine/myocardium/fourChamberV1/manifests/phaseA1PassiveSlsBindingV1";
import {
  ATRIAL_EXACT_EVENT_CALCIUM_CANDIDATE_PRIOR_V1,
  VENTRICULAR_EXACT_EVENT_CALCIUM_CANDIDATE_PRIOR_V1,
  buildAtrialHumanPriorLandEquationParametersV1,
  validatePhaseA1TissueManifestBundleV1,
  type PhaseA1TissueManifestBundleV1,
} from "@/engine/myocardium/fourChamberV1/manifests/phaseA1TissueManifestBundleV1";
import {
  WALL_IDS,
  type FourChamberWallId,
} from "@/engine/myocardium/fourChamberV1/topology/contracts";
import {
  LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET,
  type Land2017SourceParameterSet,
} from "@/engine/myocardium/myofilament/land2017/parameterSets";

export const PHASE_B1_WALL_MATERIAL_BINDING_V1_ID =
  "four-chamber-phase-b1-wall-material-binding-v1" as const;

const PHASE_B1_WALL_RUNTIME_MATERIAL_V1_BRAND: unique symbol =
  Symbol("PhaseB1WallRuntimeMaterialV1");
const PHASE_B1_WALL_RUNTIME_MATERIALS_V1 = new WeakSet<object>();
const PHASE_B1_WALL_MATERIAL_BINDING_V1_BRAND: unique symbol =
  Symbol("PhaseB1WallMaterialBindingV1");
const PHASE_B1_WALL_MATERIAL_BINDINGS_V1 = new WeakSet<object>();

export type PhaseB1WallTissueClassV1 = "atrial" | "ventricular";

export type PhaseB1WallMaterialDescriptorV1 = Readonly<{
  wallId: FourChamberWallId;
  tissueClass: PhaseB1WallTissueClassV1;
  tissueManifestSha256: string;
  targetPackSha256: string;
  landParameterSetId: string;
  landParameterSetStableHash: string;
  prescribedCalciumEvidenceId: string;
  passivePriorId: string;
  slsPriorId: string;
  lambdaLandSlack: number;
  orientationRuleId: string;
  chiOrient: 1;
  fViable: number;
}>;

export type PhaseB1WallMaterialBindingDescriptorV1 = Readonly<{
  bindingId: typeof PHASE_B1_WALL_MATERIAL_BINDING_V1_ID;
  status: "candidate-prior-component-binding-not-phase-b1-acceptance";
  phaseA1TissueManifestBundleSha256: string;
  wallOrder: typeof WALL_IDS;
  wallBindings: readonly PhaseB1WallMaterialDescriptorV1[];
  atrialWalls: readonly ["LA", "RA"];
  ventricularWalls: readonly ["LVFW", "SEP", "RVFW"];
  activeModel: "Land-2017-active-only-rate-free-xi";
  passiveOwner: "independent-equilibrium-passive-plus-optional-one-state-SLS";
  wallWiseFreeGainAllowed: false;
  pvLoopShapeFittingAllowed: false;
  physiologicalValidationClaimed: false;
  phaseB1AcceptanceClaimed: false;
}>;

export type PhaseB1WallRuntimeMaterialV1 = Readonly<{
  [PHASE_B1_WALL_RUNTIME_MATERIAL_V1_BRAND]: true;
  wallId: FourChamberWallId;
  tissueClass: PhaseB1WallTissueClassV1;
  landEquationParameters: Land2017SourceParameterSet;
  prescribedCalciumParameters: Readonly<ExactEventCalciumParametersV1>;
  passiveSls: PhaseA1ManifestBoundPassiveSlsV1;
  landWallAdapterContext: LandWallAdapterContextV1;
}>;

export type PhaseB1WallMaterialBindingV1 = Readonly<{
  [PHASE_B1_WALL_MATERIAL_BINDING_V1_BRAND]: true;
  descriptor: PhaseB1WallMaterialBindingDescriptorV1;
  contentSha256: string;
  runtimeByWall: Readonly<Record<FourChamberWallId, PhaseB1WallRuntimeMaterialV1>>;
}>;

export function buildPhaseB1WallMaterialBindingV1(
  bundle: PhaseA1TissueManifestBundleV1,
  sha256Hex: CanonicalSha256HexProvider,
): PhaseB1WallMaterialBindingV1 {
  validatePhaseA1TissueManifestBundleV1(bundle, sha256Hex);
  const atrialLand = buildAtrialHumanPriorLandEquationParametersV1();
  const ventricularLand = LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET;
  const atrialPassiveSls = bindPhaseA1PassiveSlsFromTissueManifestV1(
    bundle,
    "atrial",
    sha256Hex,
  );
  const ventricularPassiveSls = bindPhaseA1PassiveSlsFromTissueManifestV1(
    bundle,
    "ventricular",
    sha256Hex,
  );
  const atrialAdapter = compilePhaseA1LandWallAdapterContextV1(
    bundle,
    "atrial",
    sha256Hex,
  );
  const ventricularAdapter = compilePhaseA1LandWallAdapterContextV1(
    bundle,
    "ventricular",
    sha256Hex,
  );

  const runtimeEntries = WALL_IDS.map((wallId) => {
    const tissueClass = tissueClassForWall(wallId);
    const atrial = tissueClass === "atrial";
    const runtime: PhaseB1WallRuntimeMaterialV1 = {
      [PHASE_B1_WALL_RUNTIME_MATERIAL_V1_BRAND]: true,
      wallId,
      tissueClass,
      landEquationParameters: atrial ? atrialLand : ventricularLand,
      prescribedCalciumParameters: atrial
        ? ATRIAL_EXACT_EVENT_CALCIUM_CANDIDATE_PRIOR_V1
        : VENTRICULAR_EXACT_EVENT_CALCIUM_CANDIDATE_PRIOR_V1,
      passiveSls: atrial ? atrialPassiveSls : ventricularPassiveSls,
      landWallAdapterContext: atrial ? atrialAdapter : ventricularAdapter,
    };
    PHASE_B1_WALL_RUNTIME_MATERIALS_V1.add(runtime);
    return [wallId, Object.freeze(runtime)] as const;
  });
  const runtimeByWall = Object.freeze(Object.fromEntries(runtimeEntries)) as
    Readonly<Record<FourChamberWallId, PhaseB1WallRuntimeMaterialV1>>;
  const wallBindings = Object.freeze(WALL_IDS.map((wallId) => {
    const runtime = runtimeByWall[wallId];
    return Object.freeze({
      wallId,
      tissueClass: runtime.tissueClass,
      tissueManifestSha256: runtime.passiveSls.tissueManifestSha256,
      targetPackSha256: runtime.passiveSls.targetPackSha256,
      landParameterSetId: runtime.landEquationParameters.parameterSetId,
      landParameterSetStableHash:
        runtime.landEquationParameters.parameterSetStableHash,
      prescribedCalciumEvidenceId:
        runtime.prescribedCalciumParameters.evidenceId,
      passivePriorId: runtime.passiveSls.compiledPassive.prior.priorId,
      slsPriorId: runtime.passiveSls.compiledSls.prior.priorId,
      lambdaLandSlack: runtime.landWallAdapterContext.lambdaLandSlack,
      orientationRuleId: runtime.landWallAdapterContext.orientationRuleId,
      chiOrient: runtime.landWallAdapterContext.chiOrient,
      fViable: runtime.landWallAdapterContext.fViable,
    });
  }));
  const descriptor: PhaseB1WallMaterialBindingDescriptorV1 = Object.freeze({
    bindingId: PHASE_B1_WALL_MATERIAL_BINDING_V1_ID,
    status: "candidate-prior-component-binding-not-phase-b1-acceptance",
    phaseA1TissueManifestBundleSha256: bundle.contentSha256,
    wallOrder: WALL_IDS,
    wallBindings,
    atrialWalls: Object.freeze(["LA", "RA"] as const),
    ventricularWalls: Object.freeze(["LVFW", "SEP", "RVFW"] as const),
    activeModel: "Land-2017-active-only-rate-free-xi",
    passiveOwner:
      "independent-equilibrium-passive-plus-optional-one-state-SLS",
    wallWiseFreeGainAllowed: false,
    pvLoopShapeFittingAllowed: false,
    physiologicalValidationClaimed: false,
    phaseB1AcceptanceClaimed: false,
  });
  const binding: PhaseB1WallMaterialBindingV1 = {
    [PHASE_B1_WALL_MATERIAL_BINDING_V1_BRAND]: true,
    descriptor,
    contentSha256: computeCanonicalSha256(descriptor, sha256Hex),
    runtimeByWall,
  };
  PHASE_B1_WALL_MATERIAL_BINDINGS_V1.add(binding);
  return Object.freeze(binding);
}

export function assertPhaseB1WallMaterialBindingV1(
  binding: PhaseB1WallMaterialBindingV1,
): PhaseB1WallMaterialBindingV1 {
  if (
    binding === null
    || typeof binding !== "object"
    || binding[PHASE_B1_WALL_MATERIAL_BINDING_V1_BRAND] !== true
    || !PHASE_B1_WALL_MATERIAL_BINDINGS_V1.has(binding)
  ) {
    throw new Error(
      "Phase B1 wall material binding must be the canonical compiled binding",
    );
  }
  for (const wallId of WALL_IDS) {
    const material = assertPhaseB1WallRuntimeMaterialV1(
      binding.runtimeByWall[wallId],
    );
    if (material.wallId !== wallId) {
      throw new Error(
        `Phase B1 wall binding key ${wallId} contains material ${material.wallId}`,
      );
    }
  }
  return binding;
}

export function assertPhaseB1WallRuntimeMaterialV1(
  material: PhaseB1WallRuntimeMaterialV1,
): PhaseB1WallRuntimeMaterialV1 {
  if (
    material === null
    || typeof material !== "object"
    || material[PHASE_B1_WALL_RUNTIME_MATERIAL_V1_BRAND] !== true
    || !PHASE_B1_WALL_RUNTIME_MATERIALS_V1.has(material)
  ) {
    throw new Error(
      "Phase B1 wall material must be compiled from the canonical Phase A1 binding",
    );
  }
  if (material.tissueClass !== tissueClassForWall(material.wallId)) {
    throw new Error("Phase B1 wall material tissue class does not match its wall");
  }
  if (
    material.passiveSls.tissueManifestSha256
      !== material.landWallAdapterContext.tissueManifestSha256
  ) {
    throw new Error("Phase B1 wall material manifest bindings disagree");
  }
  return material;
}

export function tissueClassForWall(
  wallId: FourChamberWallId,
): PhaseB1WallTissueClassV1 {
  if (wallId === "LA" || wallId === "RA") return "atrial";
  if (wallId === "LVFW" || wallId === "SEP" || wallId === "RVFW") {
    return "ventricular";
  }
  throw new Error("Unknown four-chamber wall ID " + String(wallId));
}
