import {
  IDENTITY_ONE_FIBER_ORIENTATION_RULE_V1_ID,
  LAND_LENGTH_REFERENCE_ADAPTER_V1_ID,
  LAND_NOMINAL_TO_KIRCHHOFF_ADAPTER_V1_ID,
  PHASE_A1_TISSUE_TO_LAND_WALL_CONTEXT_ADAPTER_V1_ID,
} from "@/engine/myocardium/fourChamberV1/ids";
import type { CanonicalSha256HexProvider } from "@/engine/myocardium/fourChamberV1/manifests/canonicalJson";
import type { TissueManifestV1 } from "@/engine/myocardium/fourChamberV1/manifests/contracts";
import { finalizeTissueManifestV1 } from "@/engine/myocardium/fourChamberV1/manifests/validate";
import {
  validatePhaseA1TissueManifestBundleV1,
  type PhaseA1TissueManifestBundleV1,
  type PhaseA1TissueManifestV1,
} from "@/engine/myocardium/fourChamberV1/manifests/phaseA1TissueManifestBundleV1";

const LAND_WALL_ADAPTER_CONTEXT_V1_BRAND: unique symbol = Symbol("LandWallAdapterContextV1");
const COMPILED_LAND_WALL_CONTEXTS_V1 = new WeakSet<object>();

export type LandWallAdapterContextV1 = {
  readonly [LAND_WALL_ADAPTER_CONTEXT_V1_BRAND]: true;
  readonly tissueManifestSha256: string;
  readonly lengthReferenceAdapterId: typeof LAND_LENGTH_REFERENCE_ADAPTER_V1_ID;
  readonly stressWorkAdapterId: typeof LAND_NOMINAL_TO_KIRCHHOFF_ADAPTER_V1_ID;
  readonly lambdaLandSlack: number;
  readonly lambdaLandSlackEvidenceId: string;
  readonly orientationRuleId: typeof IDENTITY_ONE_FIBER_ORIENTATION_RULE_V1_ID;
  readonly chiOrient: 1;
  readonly fViable: number;
  readonly viabilityEvidenceId: string;
  readonly allowFreeGain: false;
  readonly fitToPVLoop: false;
};

export function compileLandWallAdapterContextV1(
  manifest: TissueManifestV1,
  sha256Hex: CanonicalSha256HexProvider,
): LandWallAdapterContextV1 {
  const tissue = finalizeTissueManifestV1(manifest, sha256Hex);
  return compileVerifiedLandWallAdapterContextV1(tissue);
}

/** Bridges the completed Phase A1 schema into the frozen A0 adapter contract. */
export function compilePhaseA1LandWallAdapterContextV1(
  bundle: PhaseA1TissueManifestBundleV1,
  tissueClass: "atrial" | "ventricular",
  sha256Hex: CanonicalSha256HexProvider,
): LandWallAdapterContextV1 {
  validatePhaseA1TissueManifestBundleV1(bundle, sha256Hex);
  if (tissueClass !== "atrial" && tissueClass !== "ventricular") {
    throw new Error("tissueClass must be atrial or ventricular");
  }
  const tissue = tissueClass === "atrial" ? bundle.atrialManifest : bundle.ventricularManifest;
  if (
    tissue.landWallContextCompatibilityAdapterId
    !== PHASE_A1_TISSUE_TO_LAND_WALL_CONTEXT_ADAPTER_V1_ID
  ) {
    throw new Error("Phase A1 tissue manifest declares an invalid Land-wall compatibility adapter");
  }
  return compileVerifiedLandWallAdapterContextV1(tissue);
}

function compileVerifiedLandWallAdapterContextV1(
  tissue: Pick<
    TissueManifestV1 | PhaseA1TissueManifestV1,
    "contentSha256" | "lengthReference" | "homogenization" | "viability"
  >,
): LandWallAdapterContextV1 {
  const context: LandWallAdapterContextV1 = {
    [LAND_WALL_ADAPTER_CONTEXT_V1_BRAND]: true,
    tissueManifestSha256: tissue.contentSha256,
    lengthReferenceAdapterId: LAND_LENGTH_REFERENCE_ADAPTER_V1_ID,
    stressWorkAdapterId: LAND_NOMINAL_TO_KIRCHHOFF_ADAPTER_V1_ID,
    lambdaLandSlack: tissue.lengthReference.lambdaLandSlack,
    lambdaLandSlackEvidenceId: tissue.lengthReference.evidenceId,
    orientationRuleId: tissue.homogenization.orientationRuleId,
    chiOrient: tissue.homogenization.chiOrient,
    fViable: tissue.viability.fViable,
    viabilityEvidenceId: tissue.viability.evidenceId,
    allowFreeGain: tissue.homogenization.allowFreeGain,
    fitToPVLoop: tissue.homogenization.fitToPVLoop,
  };
  COMPILED_LAND_WALL_CONTEXTS_V1.add(context);
  try {
    assertLandWallAdapterContextV1(context);
  } catch (error) {
    COMPILED_LAND_WALL_CONTEXTS_V1.delete(context);
    throw error;
  }
  const frozen = Object.freeze(context);
  COMPILED_LAND_WALL_CONTEXTS_V1.add(frozen);
  return frozen;
}

export function assertLandWallAdapterContextV1(
  context: LandWallAdapterContextV1,
): LandWallAdapterContextV1 {
  if (
    context[LAND_WALL_ADAPTER_CONTEXT_V1_BRAND] !== true
    || !COMPILED_LAND_WALL_CONTEXTS_V1.has(context)
  ) {
    throw new Error("Land wall adapter context must be compiled from a verified tissue manifest");
  }
  if (!/^[0-9a-f]{64}$/.test(context.tissueManifestSha256)) {
    throw new Error("tissueManifestSha256 must be a lowercase 64-hex SHA-256 digest");
  }
  if (context.lengthReferenceAdapterId !== LAND_LENGTH_REFERENCE_ADAPTER_V1_ID) {
    throw new Error("Land wall context has an invalid length-reference adapter ID");
  }
  if (context.stressWorkAdapterId !== LAND_NOMINAL_TO_KIRCHHOFF_ADAPTER_V1_ID) {
    throw new Error("Land wall context has an invalid stress/work adapter ID");
  }
  if (!Number.isFinite(context.lambdaLandSlack) || context.lambdaLandSlack <= 0) {
    throw new Error("lambdaLandSlack must be positive and finite");
  }
  requireNonEmpty(context.lambdaLandSlackEvidenceId, "lambdaLandSlackEvidenceId");
  if (context.orientationRuleId !== IDENTITY_ONE_FIBER_ORIENTATION_RULE_V1_ID) {
    throw new Error("four-chamber v1 only permits identity-one-fiber-orientation-v1");
  }
  if (context.chiOrient !== 1) {
    throw new Error("identity-one-fiber-orientation-v1 requires chiOrient=1");
  }
  if (!Number.isFinite(context.fViable) || context.fViable < 0 || context.fViable > 1) {
    throw new Error("fViable must be finite and within [0, 1]");
  }
  requireNonEmpty(context.viabilityEvidenceId, "viabilityEvidenceId");
  if (context.allowFreeGain !== false || context.fitToPVLoop !== false) {
    throw new Error("Land wall adapter v1 forbids free gain and PV-loop fitting");
  }
  return context;
}

function requireNonEmpty(value: string, field: string): void {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${field} must be a non-empty string`);
  }
}
