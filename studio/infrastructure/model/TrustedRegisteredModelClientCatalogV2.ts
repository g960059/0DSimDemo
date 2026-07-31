import type {
  ModelContractV2,
  RegisteredModelPackageManifestV2,
  RegisteredModelResolverPortV2,
  ResolvedModelPackageV2,
} from "@/studio/contracts/v2/model";
import {
  assertModelContractV2,
  assertPortableModelIdentifierV2,
  assertRegisteredModelPackageManifestV2,
  deriveModelContractFromManifestV2,
} from "@/studio/contracts/v2/model";
import type {
  ExactModelRuntimeResolverPortV2,
  RegisteredModelExecutableBundleV2,
  ResolvedExactModelRuntimeV2,
} from "@/studio/contracts/v2/executable";
import {
  cloneAndFreezeStudioJson,
} from "@/studio/infrastructure/json/StudioCanonicalJson";
import {
  freezeExactRuntimeV2,
  RegisteredModelConflictErrorV2,
  RegisteredModelNotFoundErrorV2,
  validateExecutableBundleV2,
} from "@/studio/infrastructure/model/InMemoryRegisteredModelStoreV2";

export type TrustedRegisteredModelReleaseV2 = Readonly<{
  manifest: RegisteredModelPackageManifestV2;
  executables: RegisteredModelExecutableBundleV2;
}>;

type TrustedClientReleaseV2 = Readonly<{
  resolvedPackage: ResolvedModelPackageV2;
  exactRuntime: ResolvedExactModelRuntimeV2;
}>;

/**
 * Client-side projection of releases that already passed registry admission.
 *
 * It deliberately has no registration API, artifact bytes, digest, or hash
 * operation. The client validates only the delivered public schema and
 * executable identity binding, then trusts the authenticated registry result.
 */
export class TrustedRegisteredModelClientCatalogV2
implements RegisteredModelResolverPortV2, ExactModelRuntimeResolverPortV2 {
  readonly #releaseByModelId = new Map<string, TrustedClientReleaseV2>();

  constructor(releases: readonly TrustedRegisteredModelReleaseV2[]) {
    if (!Array.isArray(releases) || releases.length === 0) {
      throw new Error(
        "trusted registered model catalog requires at least one release",
      );
    }
    for (const release of releases) {
      const manifest = cloneAndFreezeStudioJson(release.manifest);
      assertRegisteredModelPackageManifestV2(manifest);
      const contract = deriveModelContractFromManifestV2(manifest);
      assertModelContractV2(contract);
      if (this.#releaseByModelId.has(contract.modelId)) {
        throw new RegisteredModelConflictErrorV2(contract.modelId);
      }
      validateExecutableBundleV2(release.executables, contract);
      this.#releaseByModelId.set(contract.modelId, Object.freeze({
        resolvedPackage: Object.freeze({ contract, manifest }),
        exactRuntime: freezeExactRuntimeV2(release.executables, contract),
      }));
    }
  }

  get modelCount(): number {
    return this.#releaseByModelId.size;
  }

  resolveContract(modelId: string): ModelContractV2 {
    return this.#requiredReleaseV2(modelId).resolvedPackage.contract;
  }

  resolvePackage(modelId: string): ResolvedModelPackageV2 {
    return this.#requiredReleaseV2(modelId).resolvedPackage;
  }

  resolveExactRuntime(modelId: string): ResolvedExactModelRuntimeV2 {
    return this.#requiredReleaseV2(modelId).exactRuntime;
  }

  #requiredReleaseV2(modelId: string): TrustedClientReleaseV2 {
    assertPortableModelIdentifierV2(modelId, "$.modelId");
    const release = this.#releaseByModelId.get(modelId);
    if (release === undefined) {
      throw new RegisteredModelNotFoundErrorV2(modelId);
    }
    return release;
  }
}
