import {
  computeCanonicalSha256,
  type CanonicalSha256HexProvider,
} from
  "@/engine/myocardium/fourChamberV1/manifests/canonicalJson";
import {
  validatePhaseA1TissueManifestBundleV1,
  type PhaseA1TissueManifestBundleV1,
  type PhaseA1TissueManifestV1,
} from "@/engine/myocardium/fourChamberV1/manifests/phaseA1TissueManifestBundleV1";
import {
  PHASE_A1_ATRIAL_EFFECTIVE_ONE_FIBER_PASSIVE_PRIOR_V1,
  PHASE_A1_VENTRICULAR_EFFECTIVE_ONE_FIBER_PASSIVE_PRIOR_V1,
  compileEquilibriumPassivePriorV1,
  type CompiledEquilibriumPassivePriorV1,
  type EffectiveOneFiberPassivePriorV1,
} from "@/engine/myocardium/fourChamberV1/passive/equilibriumPassiveEnergyC2V1";
import {
  PHASE_A1_ATRIAL_CLASS_SHARED_SLS_PRIOR_V1,
  PHASE_A1_VENTRICULAR_CLASS_SHARED_SLS_PRIOR_V1,
  compileOneStateAlphaVSlsV1,
  type ClassSharedPassiveSlsPriorV1,
  type CompiledOneStateAlphaVSlsV1,
} from "@/engine/myocardium/fourChamberV1/passive/oneStateAlphaVSlsV1";

export const PHASE_A1_PASSIVE_SLS_MANIFEST_BINDING_V1_ID =
  "phase-a1-passive-sls-manifest-binding-v1" as const;

export type PhaseA1ManifestBoundPassiveSlsV1 = Readonly<{
  bindingId: typeof PHASE_A1_PASSIVE_SLS_MANIFEST_BINDING_V1_ID;
  tissueClass: "atrial" | "ventricular";
  tissueManifestSha256: string;
  tissueBundleSha256: string;
  targetPackSha256: string;
  completeParameterParity: true;
  compiledPassive: CompiledEquilibriumPassivePriorV1;
  compiledSls: CompiledOneStateAlphaVSlsV1;
  candidatePrior: true;
  closedLoopReleaseEligible: false;
}>;

/**
 * Canonical Phase A1 entrypoint: raw component compilers remain useful for
 * negative controls, but a whole-model material block must be bound to a
 * validated, content-hashed tissue manifest through this adapter.
 */
export function bindPhaseA1PassiveSlsFromTissueManifestV1(
  bundle: PhaseA1TissueManifestBundleV1,
  tissueClass: "atrial" | "ventricular",
  sha256Hex: CanonicalSha256HexProvider,
): PhaseA1ManifestBoundPassiveSlsV1 {
  validatePhaseA1TissueManifestBundleV1(bundle, sha256Hex);
  if (tissueClass !== "atrial" && tissueClass !== "ventricular") {
    throw new Error("tissueClass must be atrial or ventricular");
  }
  const manifest = tissueClass === "atrial" ? bundle.atrialManifest : bundle.ventricularManifest;
  const targetPack = tissueClass === "atrial" ? bundle.atrialTargetPack : bundle.ventricularTargetPack;
  const passivePrior = tissueClass === "atrial"
    ? PHASE_A1_ATRIAL_EFFECTIVE_ONE_FIBER_PASSIVE_PRIOR_V1
    : PHASE_A1_VENTRICULAR_EFFECTIVE_ONE_FIBER_PASSIVE_PRIOR_V1;
  const slsPrior = tissueClass === "atrial"
    ? PHASE_A1_ATRIAL_CLASS_SHARED_SLS_PRIOR_V1
    : PHASE_A1_VENTRICULAR_CLASS_SHARED_SLS_PRIOR_V1;

  assertManifestPriorParity(manifest, passivePrior, slsPrior, sha256Hex);
  const compiledPassive = compileEquilibriumPassivePriorV1(passivePrior);
  const compiledSls = compileOneStateAlphaVSlsV1(compiledPassive, slsPrior);
  const derived = parameterValueMap(manifest.passiveSls.derivedParameters);
  assertExactNumber(derived, "passive.K0", compiledPassive.centralTangentPa);
  assertExactNumber(derived, "sls.E_v", compiledSls.EVPa);

  return Object.freeze({
    bindingId: PHASE_A1_PASSIVE_SLS_MANIFEST_BINDING_V1_ID,
    tissueClass,
    tissueManifestSha256: manifest.contentSha256,
    tissueBundleSha256: bundle.contentSha256,
    targetPackSha256: targetPack.contentSha256,
    completeParameterParity: true,
    compiledPassive,
    compiledSls,
    candidatePrior: true,
    closedLoopReleaseEligible: false,
  });
}

function assertManifestPriorParity(
  manifest: PhaseA1TissueManifestV1,
  passive: EffectiveOneFiberPassivePriorV1,
  sls: ClassSharedPassiveSlsPriorV1,
  sha256Hex: CanonicalSha256HexProvider,
): void {
  if (manifest.tissueClass !== passive.tissueClass || manifest.tissueClass !== sls.tissueClass) {
    throw new Error("Tissue manifest and passive/SLS tissue classes disagree");
  }
  if (
    manifest.passiveSls.passivePriorId !== passive.priorId
    || manifest.passiveSls.passivePriorSha256 !== computeCanonicalSha256(passive, sha256Hex)
    || manifest.passiveSls.slsPriorId !== sls.priorId
    || manifest.passiveSls.slsPriorSha256 !== computeCanonicalSha256(sls, sha256Hex)
  ) {
    throw new Error("Passive/SLS manifest does not hash the complete executed prior contracts");
  }
  const primitive = parameterValueMap(manifest.passiveSls.primitiveParameters);
  assertExactNumber(primitive, "passive.A", passive.APa);
  assertExactNumber(primitive, "passive.B", passive.B);
  assertExactNumber(primitive, "passive.K_comp_eff", passive.KCompEffPa);
  assertExactNumber(primitive, "passive.delta_e", passive.transitionHalfWidthStrain);
  assertExactNumber(primitive, "sls.r_class", sls.rClass);
  assertExactNumber(primitive, "sls.tau_class", sls.tauSec);
}

function parameterValueMap(
  entries: readonly { readonly name: string; readonly runtimeValue: number }[],
): ReadonlyMap<string, number> {
  const result = new Map<string, number>();
  for (const entry of entries) {
    if (result.has(entry.name)) throw new Error(`Duplicate passive/SLS manifest parameter ${entry.name}`);
    if (!Number.isFinite(entry.runtimeValue)) {
      throw new Error(`Passive/SLS manifest parameter ${entry.name} must be finite`);
    }
    result.set(entry.name, entry.runtimeValue);
  }
  return result;
}

function assertExactNumber(values: ReadonlyMap<string, number>, name: string, expected: number): void {
  if (!values.has(name)) throw new Error(`Passive/SLS manifest is missing ${name}`);
  if (!Object.is(values.get(name), expected)) {
    throw new Error(`Passive/SLS manifest parameter ${name} does not match its compiled prior`);
  }
}
