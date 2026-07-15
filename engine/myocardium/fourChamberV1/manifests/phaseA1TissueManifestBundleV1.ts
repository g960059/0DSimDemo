import {
  EXACT_EVENT_PRESCRIBED_CALCIUM_EQUATIONS_V1,
  EXACT_EVENT_PRESCRIBED_CALCIUM_V1_ID,
  validateExactEventCalciumParametersV1,
  type ExactEventCalciumParametersV1,
} from "@/engine/myocardium/fourChamberV1/calcium/exactEventPrescribedCalciumV1";
import {
  IDENTITY_ONE_FIBER_ORIENTATION_RULE_V1_ID,
  FOUR_CHAMBER_TISSUE_MANIFEST_SCHEMA_V1_ID,
  LAND_LENGTH_REFERENCE_ADAPTER_V1_ID,
  LAND_NOMINAL_TO_KIRCHHOFF_ADAPTER_V1_ID,
  NORMATIVE_MANIFEST_HASH_ALGORITHM,
  PHASE_A1_TISSUE_TO_LAND_WALL_CONTEXT_ADAPTER_V1_ID,
} from "@/engine/myocardium/fourChamberV1/ids";
import {
  assertCanonicalSha256,
  canonicalizeJson,
  computeCanonicalSha256,
  type CanonicalSha256HexProvider,
} from "@/engine/myocardium/fourChamberV1/manifests/canonicalJson";
import type { ManifestParameterV1 } from "@/engine/myocardium/fourChamberV1/manifests/contracts";
import {
  buildIsolatedLandTargetPackV1,
  validateIsolatedLandTargetPackV1,
  type IsolatedLandTargetPackV1,
  type TissueFamilyV1,
} from "@/engine/myocardium/fourChamberV1/land/isolatedLandTargetPackV1";
import { LAND_RATE_FREE_DISTORTION_TRANSFORM_V1_ID } from "@/engine/myocardium/fourChamberV1/land/rateFreeDistortionEquivalenceV1";
import {
  LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET,
  LAND2017_SOURCE_DOI,
  LAND2017_SOURCE_ID,
  deriveLand2017DerivedParameters,
  stableHash,
  type Land2017DerivedParameterName,
  type Land2017DerivedParameters,
  type Land2017RuntimeParameters,
  type Land2017SourceParameterName,
  type Land2017SourceParameterSet,
} from "@/engine/myocardium/myofilament/land2017/parameterSets";
import {
  LAND2017_EQUATIONS_VERSION,
  LAND2017_MYOFILAMENT_MODEL_ID,
} from "@/engine/myocardium/myofilament/land2017/types";
import {
  EQUILIBRIUM_PASSIVE_C2_LOGSTRAIN_V1_ID,
  PHASE_A1_ATRIAL_EFFECTIVE_ONE_FIBER_PASSIVE_PRIOR_V1,
  PHASE_A1_VENTRICULAR_EFFECTIVE_ONE_FIBER_PASSIVE_PRIOR_V1,
} from "@/engine/myocardium/fourChamberV1/passive/equilibriumPassiveEnergyC2V1";
import {
  ONE_STATE_ALPHA_V_SLS_V1_ID,
  PHASE_A1_ATRIAL_CLASS_SHARED_SLS_PRIOR_V1,
  PHASE_A1_VENTRICULAR_CLASS_SHARED_SLS_PRIOR_V1,
} from "@/engine/myocardium/fourChamberV1/passive/oneStateAlphaVSlsV1";

export const PHASE_A1_TISSUE_MANIFEST_SCHEMA_V1_ID =
  "four-chamber-tissue-manifest-phase-a1-v1" as const;
export const PHASE_A1_TISSUE_MANIFEST_BUNDLE_SCHEMA_V1_ID =
  "four-chamber-tissue-manifest-bundle-phase-a1-v1" as const;
export const ATRIAL_HUMAN_PRIOR_PARAMETER_SET_V1_ID =
  "atrial-human-prior-v1:land2017-equation-parameters" as const;
export const EQUILIBRIUM_PASSIVE_MODEL_V1_ID =
  EQUILIBRIUM_PASSIVE_C2_LOGSTRAIN_V1_ID;
export const ONE_STATE_SLS_MODEL_V1_ID = ONE_STATE_ALPHA_V_SLS_V1_ID;

export const PHASE_A1_TISSUE_MANIFEST_PINNED_HASHES_V1 = Object.freeze({
  bundle: "a39afa8363bb84b625111a15b5b392ed3bedf2369a4f6a92a784b8da2339d089",
  ventricularManifest: "35571bc60e61db248a6ab8dc78aa4cf05271087473562eabf634d6b853346867",
  atrialManifest: "ea47f876e5839a6b2dea78c9101ef1a0ead9fef5cf9c12851a06d4b7a21ec562",
  ventricularTargetPack: "ab4260ef7227fa7ae226dc1b7d51645fc9168566dcd92be5933618ffa60ab33e",
  atrialTargetPack: "c8235099d17709ec7001d906ffa0e983a3ab0eb58f7d5588ab3432dc16eb786e",
} as const);

const LAND_NIEDERER_ATRIAL_DOI = "10.1002/cnm.2931";
const LAND_NIEDERER_ATRIAL_SOURCE_ID = "land-niederer-human-atrial-candidate-2018";
const PROJECT_SYNTHETIC_PRIOR_SOURCE_ID = "four-chamber-v1-project-synthetic-verification-prior";

export const VENTRICULAR_EXACT_EVENT_CALCIUM_CANDIDATE_PRIOR_V1:
Readonly<ExactEventCalciumParametersV1> = deepFreeze({
  tauRiseSec: 0.03,
  tauDecaySec: 0.12,
  calciumDiastolicUM: 0.11,
  calciumAmplitudeUM: 0.89,
  electricalToCalciumDelaySec: 0.012,
  status: "candidate-prior",
  evidenceId: "ventricular-exact-event-calcium-project-synthetic-prior-v1",
});

export const ATRIAL_EXACT_EVENT_CALCIUM_CANDIDATE_PRIOR_V1:
Readonly<ExactEventCalciumParametersV1> = deepFreeze({
  tauRiseSec: 0.02,
  tauDecaySec: 0.08,
  calciumDiastolicUM: 0.1,
  calciumAmplitudeUM: 0.5,
  electricalToCalciumDelaySec: 0.012,
  status: "candidate-prior",
  evidenceId: "atrial-exact-event-calcium-land-niederer-context-plus-project-timing-prior-v1",
});

export type PhaseA1TissueManifestV1 = {
  readonly schemaId: typeof PHASE_A1_TISSUE_MANIFEST_SCHEMA_V1_ID;
  readonly supersedesSchemaId: typeof FOUR_CHAMBER_TISSUE_MANIFEST_SCHEMA_V1_ID;
  readonly landWallContextCompatibilityAdapterId:
    typeof PHASE_A1_TISSUE_TO_LAND_WALL_CONTEXT_ADAPTER_V1_ID;
  readonly familyId: TissueFamilyV1;
  readonly tissueClass: "ventricular" | "atrial";
  readonly status: "candidate-prior";
  readonly completeParameterInventory: true;
  readonly temperatureK: 310.15;
  readonly calciumUnitConvention: "uM";
  readonly land: {
    readonly modelId: typeof LAND2017_MYOFILAMENT_MODEL_ID;
    readonly equationsVersion: typeof LAND2017_EQUATIONS_VERSION;
    readonly parameterSetId: string;
    readonly activeOnly: true;
    readonly sourceStressConvention: "land2017-Ta";
    readonly stateCoordinateTransformId: typeof LAND_RATE_FREE_DISTORTION_TRANSFORM_V1_ID;
    readonly primitiveParameters: readonly ManifestParameterV1[];
    readonly derivedParameters: readonly ManifestParameterV1[];
  };
  readonly prescribedCalcium: {
    readonly modelId: typeof EXACT_EVENT_PRESCRIBED_CALCIUM_V1_ID;
    readonly equationsVersion: typeof EXACT_EVENT_PRESCRIBED_CALCIUM_EQUATIONS_V1;
    readonly parameters: readonly ManifestParameterV1[];
  };
  readonly passiveSls: {
    readonly equilibriumModelId: typeof EQUILIBRIUM_PASSIVE_MODEL_V1_ID;
    readonly slsModelId: typeof ONE_STATE_SLS_MODEL_V1_ID;
    readonly passivePriorId: string;
    readonly passivePriorSha256: string;
    readonly slsPriorId: string;
    readonly slsPriorSha256: string;
    readonly slsEnabled: true;
    readonly primitiveParameters: readonly ManifestParameterV1[];
    readonly derivedParameters: readonly ManifestParameterV1[];
  };
  readonly lengthReference: {
    readonly adapterId: typeof LAND_LENGTH_REFERENCE_ADAPTER_V1_ID;
    readonly lambdaLandSlack: 1;
    readonly evidenceId: "v1-default-no-independent-prestrain-evidence";
    readonly owner: "tissue-manifest";
  };
  readonly homogenization: {
    readonly orientationRuleId: typeof IDENTITY_ONE_FIBER_ORIENTATION_RULE_V1_ID;
    readonly stressWorkAdapterId: typeof LAND_NOMINAL_TO_KIRCHHOFF_ADAPTER_V1_ID;
    readonly chiOrient: 1;
    readonly allowFreeGain: false;
    readonly fitToPVLoop: false;
  };
  readonly viability: {
    readonly fViable: 1;
    readonly evidenceId: "healthy-default-no-scar-evidence-v1";
    readonly owner: "independent-scar-viability-evidence";
  };
  readonly provenance: {
    readonly sourceReferences: readonly string[];
    readonly transformationRules: readonly string[];
    readonly literatureContextOnly: readonly string[];
  };
  readonly targetPack: {
    readonly id: string;
    readonly sha256: string;
    readonly status: "source-regression-oracle-only";
  };
  readonly atrialDiff?: {
    readonly baseManifestSha256: string;
    readonly changedPrimitiveParameters: readonly string[];
    readonly recomputedDerivedParameters: readonly string[];
    readonly cyclingRateMultiplier: 3;
    readonly exactPrimitiveRateMapping: readonly ["land.kws"];
    readonly recomputationRuleId: "land2017-derived-equations-58-63-v1";
    readonly exactDiffVerified: true;
  };
  readonly releaseGate: {
    readonly closedLoopReleaseEligible: false;
    readonly runtimeAdopted: false;
    readonly blockers: readonly string[];
  };
  readonly hashAlgorithm: typeof NORMATIVE_MANIFEST_HASH_ALGORITHM;
  readonly contentSha256: string;
};

export type PhaseA1TissueManifestBundleV1 = {
  readonly schemaId: typeof PHASE_A1_TISSUE_MANIFEST_BUNDLE_SCHEMA_V1_ID;
  readonly phase: "Phase A1 component oracles";
  readonly ventricularTargetPack: IsolatedLandTargetPackV1;
  readonly atrialTargetPack: IsolatedLandTargetPackV1;
  readonly ventricularManifest: PhaseA1TissueManifestV1;
  readonly atrialManifest: PhaseA1TissueManifestV1;
  readonly exactAtrialDiff: {
    readonly changedPrimitiveParameters: readonly string[];
    readonly recomputedDerivedParameters: readonly string[];
    readonly exact: true;
  };
  readonly closedLoopReleaseEligible: false;
  readonly hashAlgorithm: typeof NORMATIVE_MANIFEST_HASH_ALGORITHM;
  readonly contentSha256: string;
};

export function buildPhaseA1TissueManifestBundleV1(
  sha256Hex: CanonicalSha256HexProvider,
): PhaseA1TissueManifestBundleV1 {
  const bundle = assemblePhaseA1TissueManifestBundleV1(sha256Hex);
  assertCanonicalSha256(
    phaseA1TissueManifestBundleHashPayloadV1(bundle),
    bundle.contentSha256,
    sha256Hex,
  );
  return bundle;
}

export function validatePhaseA1TissueManifestBundleV1(
  bundle: PhaseA1TissueManifestBundleV1,
  sha256Hex: CanonicalSha256HexProvider,
): PhaseA1TissueManifestBundleV1 {
  assertCanonicalSha256(
    phaseA1TissueManifestBundleHashPayloadV1(bundle),
    bundle.contentSha256,
    sha256Hex,
  );
  const atrialParameterSet = buildAtrialHumanPriorLandEquationParametersV1();
  validateIsolatedLandTargetPackV1(
    bundle.ventricularTargetPack,
    LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET,
    VENTRICULAR_EXACT_EVENT_CALCIUM_CANDIDATE_PRIOR_V1,
    sha256Hex,
  );
  validateIsolatedLandTargetPackV1(
    bundle.atrialTargetPack,
    atrialParameterSet,
    ATRIAL_EXACT_EVENT_CALCIUM_CANDIDATE_PRIOR_V1,
    sha256Hex,
  );
  assertCanonicalSha256(
    phaseA1TissueManifestHashPayloadV1(bundle.ventricularManifest),
    bundle.ventricularManifest.contentSha256,
    sha256Hex,
  );
  assertCanonicalSha256(
    phaseA1TissueManifestHashPayloadV1(bundle.atrialManifest),
    bundle.atrialManifest.contentSha256,
    sha256Hex,
  );
  const expected = assemblePhaseA1TissueManifestBundleV1(sha256Hex);
  if (canonicalizeJson(bundle) !== canonicalizeJson(expected)) {
    throw new Error("Phase A1 tissue manifest bundle differs from the canonical complete candidate bundle");
  }
  return bundle;
}

export function phaseA1TissueManifestHashPayloadV1(
  manifest: PhaseA1TissueManifestV1,
): Omit<PhaseA1TissueManifestV1, "contentSha256"> {
  const { contentSha256: _contentSha256, ...payload } = manifest;
  return payload;
}

export function phaseA1TissueManifestBundleHashPayloadV1(
  bundle: PhaseA1TissueManifestBundleV1,
): Omit<PhaseA1TissueManifestBundleV1, "contentSha256"> {
  const { contentSha256: _contentSha256, ...payload } = bundle;
  return payload;
}

export function buildAtrialHumanPriorLandEquationParametersV1(): Land2017SourceParameterSet {
  const base = LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET;
  const values: Land2017RuntimeParameters = {
    ...base.values,
    CaT50Ref: 0.86,
    kws: 3 * base.values.kws,
  };
  const derived = deriveLand2017DerivedParameters(values);
  const sourceParameters = base.sourceParameters.map((entry) => ({
    ...entry,
    location: entry.parameter === "CaT50Ref" || entry.parameter === "kws"
      ? `${entry.location}; runtime candidate override provenance is owned by atrial-human-prior-v1 manifest`
      : entry.location,
    runtime: {
      ...entry.runtime,
      value: values[entry.parameter],
    },
  }));
  const hashInput: Omit<Land2017SourceParameterSet, "parameterSetStableHash"> = {
    parameterSetId: ATRIAL_HUMAN_PRIOR_PARAMETER_SET_V1_ID,
    sourceId: LAND2017_SOURCE_ID,
    doi: LAND2017_SOURCE_DOI,
    values,
    derived,
    sourceParameters,
    derivedParameters: base.derivedParameters,
  };
  return deepFreeze({ ...hashInput, parameterSetStableHash: stableHash(hashInput) });
}

function assemblePhaseA1TissueManifestBundleV1(
  sha256Hex: CanonicalSha256HexProvider,
): PhaseA1TissueManifestBundleV1 {
  validateExactEventCalciumParametersV1(VENTRICULAR_EXACT_EVENT_CALCIUM_CANDIDATE_PRIOR_V1);
  validateExactEventCalciumParametersV1(ATRIAL_EXACT_EVENT_CALCIUM_CANDIDATE_PRIOR_V1);
  const atrialParameterSet = buildAtrialHumanPriorLandEquationParametersV1();
  const ventricularTargetPack = buildIsolatedLandTargetPackV1(
    "ventricular-human-37c-v1",
    LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET,
    VENTRICULAR_EXACT_EVENT_CALCIUM_CANDIDATE_PRIOR_V1,
    sha256Hex,
  );
  const atrialTargetPack = buildIsolatedLandTargetPackV1(
    "atrial-human-prior-v1",
    atrialParameterSet,
    ATRIAL_EXACT_EVENT_CALCIUM_CANDIDATE_PRIOR_V1,
    sha256Hex,
  );
  const ventricularPayload = createVentricularManifestPayload(ventricularTargetPack, sha256Hex);
  const ventricularManifest = deepFreeze({
    ...ventricularPayload,
    contentSha256: computeCanonicalSha256(ventricularPayload, sha256Hex),
  });
  const atrialWithoutDiff = createAtrialManifestCore(atrialTargetPack, atrialParameterSet, sha256Hex);
  const changedPrimitiveParameters = exactChangedParameterNames(ventricularPayload, atrialWithoutDiff, "primitive");
  const recomputedDerivedParameters = exactChangedParameterNames(ventricularPayload, atrialWithoutDiff, "derived");
  const atrialPayload: Omit<PhaseA1TissueManifestV1, "contentSha256"> = {
    ...atrialWithoutDiff,
    atrialDiff: {
      baseManifestSha256: ventricularManifest.contentSha256,
      changedPrimitiveParameters,
      recomputedDerivedParameters,
      cyclingRateMultiplier: 3,
      exactPrimitiveRateMapping: ["land.kws"],
      recomputationRuleId: "land2017-derived-equations-58-63-v1",
      exactDiffVerified: true,
    },
  };
  const atrialManifest = deepFreeze({
    ...atrialPayload,
    contentSha256: computeCanonicalSha256(atrialPayload, sha256Hex),
  });
  assertAtrialDiffSemantics(ventricularManifest, atrialManifest, atrialParameterSet);

  const bundlePayload: Omit<PhaseA1TissueManifestBundleV1, "contentSha256"> = {
    schemaId: PHASE_A1_TISSUE_MANIFEST_BUNDLE_SCHEMA_V1_ID,
    phase: "Phase A1 component oracles",
    ventricularTargetPack,
    atrialTargetPack,
    ventricularManifest,
    atrialManifest,
    exactAtrialDiff: {
      changedPrimitiveParameters,
      recomputedDerivedParameters,
      exact: true,
    },
    closedLoopReleaseEligible: false,
    hashAlgorithm: NORMATIVE_MANIFEST_HASH_ALGORITHM,
  };
  return deepFreeze({
    ...bundlePayload,
    contentSha256: computeCanonicalSha256(bundlePayload, sha256Hex),
  });
}

function createVentricularManifestPayload(
  targetPack: IsolatedLandTargetPackV1,
  sha256Hex: CanonicalSha256HexProvider,
): Omit<PhaseA1TissueManifestV1, "contentSha256"> {
  const source = LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET;
  return {
    ...commonManifestCore("ventricular-human-37c-v1", "ventricular", targetPack),
    land: {
      ...commonLandCore(source.parameterSetId),
      primitiveParameters: landPrimitiveParameters(source.values, "ventricular"),
      derivedParameters: landDerivedParameters(source.derived, "ventricular"),
    },
    prescribedCalcium: prescribedCalciumManifest(
      VENTRICULAR_EXACT_EVENT_CALCIUM_CANDIDATE_PRIOR_V1,
      "ventricular",
    ),
    passiveSls: passiveSlsManifest("ventricular", sha256Hex),
    provenance: {
      sourceReferences: [
        `Land et al. 2017 DOI ${LAND2017_SOURCE_DOI}`,
        "four-chamber model specification v1 sections 5-7",
      ],
      transformationRules: [
        "Land source units are converted to declared runtime seconds, pascals, kelvin, and micromolar interface units",
        "rate-free xi is exactly zeta minus A times lambdaLand",
        "passive and SLS values are project-synthetic implementation-verification priors, not calibrated human truth",
      ],
      literatureContextOnly: [
        "No digitized experimental target is claimed by the source-regression target pack",
      ],
    },
  };
}

function createAtrialManifestCore(
  targetPack: IsolatedLandTargetPackV1,
  parameterSet: Land2017SourceParameterSet,
  sha256Hex: CanonicalSha256HexProvider,
): Omit<PhaseA1TissueManifestV1, "contentSha256" | "atrialDiff"> {
  return {
    ...commonManifestCore("atrial-human-prior-v1", "atrial", targetPack),
    land: {
      ...commonLandCore(parameterSet.parameterSetId),
      primitiveParameters: landPrimitiveParameters(parameterSet.values, "atrial"),
      derivedParameters: landDerivedParameters(parameterSet.derived, "atrial"),
    },
    prescribedCalcium: prescribedCalciumManifest(
      ATRIAL_EXACT_EVENT_CALCIUM_CANDIDATE_PRIOR_V1,
      "atrial",
    ),
    passiveSls: passiveSlsManifest("atrial", sha256Hex),
    provenance: {
      sourceReferences: [
        `Land et al. 2017 DOI ${LAND2017_SOURCE_DOI}`,
        `Land and Niederer 2018 DOI ${LAND_NIEDERER_ATRIAL_DOI}`,
        "four-chamber model specification v1 sections 5-7",
      ],
      transformationRules: [
        "atrial primitive kws equals three times ventricular kws; no unrelated Land rate is scaled",
        "kwu, ksu, and cs are recomputed from the complete atrial primitive inventory",
        "rate-free xi is exactly zeta minus A times lambdaLand",
        "calcium timing and passive/SLS values are project-synthetic candidate priors where literature does not identify this reduced model",
      ],
      literatureContextOnly: [
        "Land and Niederer reported adjusted-model TPT about 82 ms and RT50 about 75 ms; these are context, not an acceptance assertion for this generated pack",
        "Human atrial data were explicitly limited; this family remains candidate-prior",
      ],
    },
  };
}

function commonManifestCore(
  familyId: TissueFamilyV1,
  tissueClass: "ventricular" | "atrial",
  targetPack: IsolatedLandTargetPackV1,
): Pick<
  Omit<PhaseA1TissueManifestV1, "contentSha256">,
  | "schemaId" | "supersedesSchemaId" | "landWallContextCompatibilityAdapterId"
  | "familyId" | "tissueClass" | "status" | "completeParameterInventory"
  | "temperatureK" | "calciumUnitConvention" | "lengthReference" | "homogenization"
  | "viability" | "targetPack" | "releaseGate" | "hashAlgorithm"
> {
  return {
    schemaId: PHASE_A1_TISSUE_MANIFEST_SCHEMA_V1_ID,
    supersedesSchemaId: FOUR_CHAMBER_TISSUE_MANIFEST_SCHEMA_V1_ID,
    landWallContextCompatibilityAdapterId:
      PHASE_A1_TISSUE_TO_LAND_WALL_CONTEXT_ADAPTER_V1_ID,
    familyId,
    tissueClass,
    status: "candidate-prior",
    completeParameterInventory: true,
    temperatureK: 310.15,
    calciumUnitConvention: "uM",
    lengthReference: {
      adapterId: LAND_LENGTH_REFERENCE_ADAPTER_V1_ID,
      lambdaLandSlack: 1,
      evidenceId: "v1-default-no-independent-prestrain-evidence",
      owner: "tissue-manifest",
    },
    homogenization: {
      orientationRuleId: IDENTITY_ONE_FIBER_ORIENTATION_RULE_V1_ID,
      stressWorkAdapterId: LAND_NOMINAL_TO_KIRCHHOFF_ADAPTER_V1_ID,
      chiOrient: 1,
      allowFreeGain: false,
      fitToPVLoop: false,
    },
    viability: {
      fViable: 1,
      evidenceId: "healthy-default-no-scar-evidence-v1",
      owner: "independent-scar-viability-evidence",
    },
    targetPack: {
      id: targetPack.packId,
      sha256: targetPack.contentSha256,
      status: "source-regression-oracle-only",
    },
    releaseGate: {
      closedLoopReleaseEligible: false,
      runtimeAdopted: false,
      blockers: [
        "candidate priors are not calibrated human release values",
        "source-regression target packs do not replace digitized experimental acceptance",
        "component evidence is verified outside this tissue bundle and does not itself authorize closed-loop release",
        "Phase B and C closed-loop and numerical acceptance",
      ],
    },
    hashAlgorithm: NORMATIVE_MANIFEST_HASH_ALGORITHM,
  };
}

function commonLandCore(parameterSetId: string): Omit<PhaseA1TissueManifestV1["land"], "primitiveParameters" | "derivedParameters"> {
  return {
    modelId: LAND2017_MYOFILAMENT_MODEL_ID,
    equationsVersion: LAND2017_EQUATIONS_VERSION,
    parameterSetId,
    activeOnly: true,
    sourceStressConvention: "land2017-Ta",
    stateCoordinateTransformId: LAND_RATE_FREE_DISTORTION_TRANSFORM_V1_ID,
  };
}

function landPrimitiveParameters(
  values: Land2017RuntimeParameters,
  tissueClass: "ventricular" | "atrial",
): readonly ManifestParameterV1[] {
  const base = LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET;
  return base.sourceParameters.map((entry) => {
    const parameter = entry.parameter;
    if (tissueClass === "atrial" && parameter === "CaT50Ref") {
      return manifestParameter(
        "land.CaT50Ref", "primitive", values.CaT50Ref, "uM", 0.86, "uM",
        LAND_NIEDERER_ATRIAL_SOURCE_ID,
        "Land and Niederer 2018 section 2.7, adjusted atrial candidate",
        "direct atrial candidate prior; limited atrial data",
      );
    }
    if (tissueClass === "atrial" && parameter === "kws") {
      return manifestParameter(
        "land.kws", "primitive", values.kws, "1/s", 3, "dimensionless multiplier",
        LAND_NIEDERER_ATRIAL_SOURCE_ID,
        "Land and Niederer 2018 section 2.7: kws_atr = xi * kws, xi = 3",
        "runtime = 3 * ventricular land.kws; ksu is derived, not independently scaled",
      );
    }
    return manifestParameter(
      `land.${parameter}`,
      "primitive",
      values[parameter],
      entry.runtime.unit,
      entry.original.value,
      entry.original.unit,
      entry.sourceId,
      entry.location,
      entry.runtime.value === entry.original.value && entry.runtime.unit === entry.original.unit
        ? "identity source-to-runtime"
        : `declared unit conversion from ${entry.original.unit} to ${entry.runtime.unit}`,
    );
  });
}

function landDerivedParameters(
  derived: Land2017DerivedParameters,
  tissueClass: "ventricular" | "atrial",
): readonly ManifestParameterV1[] {
  return LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET.derivedParameters.map((entry) => {
    const changedByAtrialKws = tissueClass === "atrial"
      && (["kwu", "ksu", "cs"] as Land2017DerivedParameterName[]).includes(entry.parameter);
    return manifestParameter(
      `land.${entry.parameter}`,
      "derived",
      derived[entry.parameter],
      entry.runtimeUnit,
      "computed",
      "derived",
      changedByAtrialKws ? LAND_NIEDERER_ATRIAL_SOURCE_ID : entry.sourceId,
      changedByAtrialKws
        ? `${entry.location}; recomputed after the exact primitive kws atrial diff`
        : entry.location,
      "recompute from the complete primitive inventory using Land 2017 Eqs 58-63",
    );
  });
}

function prescribedCalciumManifest(
  parameters: ExactEventCalciumParametersV1,
  tissueClass: "ventricular" | "atrial",
): PhaseA1TissueManifestV1["prescribedCalcium"] {
  const atrialAmplitudeLocation =
    "Land and Niederer 2018 section 2.7 assumes atrial peak 0.6 uM and diastolic 0.1 uM";
  const projectLocation =
    "Four-chamber v1 exact-event component implementation-verification prior; no human calibration claim";
  return {
    modelId: EXACT_EVENT_PRESCRIBED_CALCIUM_V1_ID,
    equationsVersion: EXACT_EVENT_PRESCRIBED_CALCIUM_EQUATIONS_V1,
    parameters: [
      manifestParameter(
        "calcium.tauRiseSec", "primitive", parameters.tauRiseSec, "s", parameters.tauRiseSec, "s",
        PROJECT_SYNTHETIC_PRIOR_SOURCE_ID, projectLocation, "identity project candidate prior",
      ),
      manifestParameter(
        "calcium.tauDecaySec", "primitive", parameters.tauDecaySec, "s", parameters.tauDecaySec, "s",
        PROJECT_SYNTHETIC_PRIOR_SOURCE_ID, projectLocation, "identity project candidate prior",
      ),
      manifestParameter(
        "calcium.calciumDiastolicUM", "primitive", parameters.calciumDiastolicUM, "uM",
        parameters.calciumDiastolicUM, "uM",
        tissueClass === "atrial" ? LAND_NIEDERER_ATRIAL_SOURCE_ID : PROJECT_SYNTHETIC_PRIOR_SOURCE_ID,
        tissueClass === "atrial" ? atrialAmplitudeLocation : projectLocation,
        "identity candidate prior",
      ),
      manifestParameter(
        "calcium.calciumAmplitudeUM", "primitive", parameters.calciumAmplitudeUM, "uM",
        tissueClass === "atrial" ? 0.6 : parameters.calciumAmplitudeUM,
        tissueClass === "atrial" ? "uM peak total" : "uM",
        tissueClass === "atrial" ? LAND_NIEDERER_ATRIAL_SOURCE_ID : PROJECT_SYNTHETIC_PRIOR_SOURCE_ID,
        tissueClass === "atrial" ? atrialAmplitudeLocation : projectLocation,
        tissueClass === "atrial"
          ? "normalized transient amplitude = reported peak total 0.6 uM - diastolic 0.1 uM"
          : "identity project candidate prior",
      ),
      manifestParameter(
        "calcium.electricalToCalciumDelaySec", "primitive", parameters.electricalToCalciumDelaySec, "s",
        parameters.electricalToCalciumDelaySec, "s", PROJECT_SYNTHETIC_PRIOR_SOURCE_ID,
        projectLocation,
        "single timing owner in tissue manifest; scheduler must not duplicate this delay",
      ),
    ],
  };
}

function passiveSlsManifest(
  tissueClass: "ventricular" | "atrial",
  sha256Hex: CanonicalSha256HexProvider,
): PhaseA1TissueManifestV1["passiveSls"] {
  const ventricular = tissueClass === "ventricular";
  const passivePrior = ventricular
    ? PHASE_A1_VENTRICULAR_EFFECTIVE_ONE_FIBER_PASSIVE_PRIOR_V1
    : PHASE_A1_ATRIAL_EFFECTIVE_ONE_FIBER_PASSIVE_PRIOR_V1;
  const slsPrior = ventricular
    ? PHASE_A1_VENTRICULAR_CLASS_SHARED_SLS_PRIOR_V1
    : PHASE_A1_ATRIAL_CLASS_SHARED_SLS_PRIOR_V1;
  const APa = passivePrior.APa;
  const B = passivePrior.B;
  const KCompEffPa = passivePrior.KCompEffPa;
  const rClass = slsPrior.rClass;
  const tauClassSec = slsPrior.tauSec;
  const K0Pa = 2 * KCompEffPa * APa / (KCompEffPa + APa);
  const EvPa = rClass * K0Pa;
  const location =
    "Four-chamber v1 passive/SLS implementation-verification prior; synthetic, not calibrated human tissue truth";
  return {
    equilibriumModelId: EQUILIBRIUM_PASSIVE_MODEL_V1_ID,
    slsModelId: ONE_STATE_SLS_MODEL_V1_ID,
    passivePriorId: passivePrior.priorId,
    passivePriorSha256: computeCanonicalSha256(passivePrior, sha256Hex),
    slsPriorId: slsPrior.priorId,
    slsPriorSha256: computeCanonicalSha256(slsPrior, sha256Hex),
    slsEnabled: true,
    primitiveParameters: [
      projectPrior("passive.A", APa, "Pa", location),
      projectPrior("passive.B", B, "1", location),
      projectPrior("passive.K_comp_eff", KCompEffPa, "Pa", location),
      projectPrior(
        "passive.delta_e",
        passivePrior.transitionHalfWidthStrain,
        "1",
        "Normative fixed C2 transition half-width",
      ),
      projectPrior("sls.r_class", rClass, "1", location),
      projectPrior("sls.tau_class", tauClassSec, "s", location),
    ],
    derivedParameters: [
      manifestParameter(
        "passive.K0", "derived", K0Pa, "Pa", "computed", "derived",
        PROJECT_SYNTHETIC_PRIOR_SOURCE_ID, location,
        "K0 = 2*K_comp_eff*A/(K_comp_eff+A)",
      ),
      manifestParameter(
        "sls.E_v", "derived", EvPa, "Pa", "computed", "derived",
        PROJECT_SYNTHETIC_PRIOR_SOURCE_ID, location,
        "E_v = r_class*K0",
      ),
    ],
  };
}

function projectPrior(name: string, runtimeValue: number, runtimeUnit: string, sourceLocation: string): ManifestParameterV1 {
  return manifestParameter(
    name, "primitive", runtimeValue, runtimeUnit, runtimeValue, runtimeUnit,
    PROJECT_SYNTHETIC_PRIOR_SOURCE_ID, sourceLocation, "identity project candidate prior",
  );
}

function manifestParameter(
  name: string,
  kind: ManifestParameterV1["kind"],
  runtimeValue: number,
  runtimeUnit: string,
  sourceValue: number | string,
  sourceUnit: string,
  sourceId: string,
  sourceLocation: string,
  transformationRule: string,
): ManifestParameterV1 {
  if (!Number.isFinite(runtimeValue)) throw new Error(`${name} runtimeValue must be finite`);
  return {
    name,
    kind,
    runtimeValue,
    runtimeUnit,
    sourceValue,
    sourceUnit,
    sourceId,
    sourceLocation,
    transformationRule,
  };
}

function exactChangedParameterNames(
  ventricular: Omit<PhaseA1TissueManifestV1, "contentSha256">,
  atrial: Omit<PhaseA1TissueManifestV1, "contentSha256" | "atrialDiff">,
  kind: ManifestParameterV1["kind"],
): readonly string[] {
  const base = parameterMap(ventricular, kind);
  const candidate = parameterMap(atrial, kind);
  const baseNames = [...base.keys()].sort(compareStrings);
  const candidateNames = [...candidate.keys()].sort(compareStrings);
  if (canonicalizeJson(baseNames) !== canonicalizeJson(candidateNames)) {
    throw new Error(`Atrial ${kind} parameter inventory must exactly match its ventricular base`);
  }
  return Object.freeze(baseNames.filter((name) =>
    canonicalizeJson(base.get(name)) !== canonicalizeJson(candidate.get(name))));
}

function parameterMap(
  manifest: Omit<PhaseA1TissueManifestV1, "contentSha256" | "atrialDiff">,
  kind: ManifestParameterV1["kind"],
): Map<string, ManifestParameterV1 | { readonly runtimeValue: number; readonly evidenceId: string }> {
  const groups = kind === "primitive"
    ? [manifest.land.primitiveParameters, manifest.prescribedCalcium.parameters, manifest.passiveSls.primitiveParameters]
    : [manifest.land.derivedParameters, manifest.passiveSls.derivedParameters];
  const entries: Array<readonly [
    string,
    ManifestParameterV1 | { readonly runtimeValue: number; readonly evidenceId: string },
  ]> = groups.flat().map((parameter) => [parameter.name, parameter] as const);
  if (kind === "primitive") {
    entries.push(["lengthReference.lambdaLandSlack", {
      runtimeValue: manifest.lengthReference.lambdaLandSlack,
      evidenceId: manifest.lengthReference.evidenceId,
    }] as const);
    entries.push(["viability.fViable", {
      runtimeValue: manifest.viability.fViable,
      evidenceId: manifest.viability.evidenceId,
    }] as const);
  }
  const map = new Map(entries);
  if (map.size !== entries.length) throw new Error(`Duplicate ${kind} parameter name in tissue manifest`);
  return map;
}

function assertAtrialDiffSemantics(
  ventricular: PhaseA1TissueManifestV1,
  atrial: PhaseA1TissueManifestV1,
  atrialParameterSet: Land2017SourceParameterSet,
): void {
  if (atrial.atrialDiff === undefined) throw new Error("Atrial Phase A1 manifest requires atrialDiff");
  if (atrial.atrialDiff.baseManifestSha256 !== ventricular.contentSha256) {
    throw new Error("Atrial Phase A1 manifest identifies the wrong ventricular base hash");
  }
  const actualPrimitives = exactChangedParameterNames(
    phaseA1TissueManifestHashPayloadV1(ventricular),
    phaseA1TissueManifestHashPayloadV1(atrial),
    "primitive",
  );
  const actualDerived = exactChangedParameterNames(
    phaseA1TissueManifestHashPayloadV1(ventricular),
    phaseA1TissueManifestHashPayloadV1(atrial),
    "derived",
  );
  if (canonicalizeJson(actualPrimitives) !== canonicalizeJson(atrial.atrialDiff.changedPrimitiveParameters)) {
    throw new Error("Atrial changedPrimitiveParameters is not the exact immutable base diff");
  }
  if (canonicalizeJson(actualDerived) !== canonicalizeJson(atrial.atrialDiff.recomputedDerivedParameters)) {
    throw new Error("Atrial recomputedDerivedParameters is not the exact derived diff");
  }
  const baseValues = LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET.values;
  const values = atrialParameterSet.values;
  const changedRuntimeLandPrimitives = (Object.keys(baseValues) as Land2017SourceParameterName[])
    .filter((name) => values[name] !== baseValues[name]).sort(compareStrings);
  if (canonicalizeJson(changedRuntimeLandPrimitives) !== canonicalizeJson(["CaT50Ref", "kws"])) {
    throw new Error("Atrial Land runtime primitive diff must be exactly CaT50Ref and kws");
  }
  const recomputed = deriveLand2017DerivedParameters(values);
  if (canonicalizeJson(recomputed) !== canonicalizeJson(atrialParameterSet.derived)) {
    throw new Error("Atrial Land derived values were not recomputed from its primitive inventory");
  }
  const changedLandDerived = (Object.keys(recomputed) as Land2017DerivedParameterName[])
    .filter((name) => recomputed[name] !== LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET.derived[name])
    .sort(compareStrings);
  if (canonicalizeJson(changedLandDerived) !== canonicalizeJson(["cs", "ksu", "kwu"])) {
    throw new Error("Atrial kws diff must change exactly derived kwu, ksu, and cs");
  }
}

function compareStrings(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}
