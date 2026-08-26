import type {
  ModelSurfaceDerivedOutputDefinitionV1,
  ModelSurfaceReleaseManifestV1,
} from "@/studio/contracts/v2/modelSurface";
import {
  analysisCapabilityV1,
  assertModelSurfaceReleaseManifestV1,
  derivationCapabilityV1,
} from "@/studio/contracts/v2/modelSurface";
import type {
  StudioSimulationAnalysisExecutionPlanResolverV2,
} from "@/studio/contracts/v2/simulation";

export type AnalysisCanonicalOutputDefinitionV1 = Readonly<{
  outputId: string;
  kind: "metric";
  unit: string;
  shape: "scalar" | "vector";
  scope: "instant" | "beat" | "window";
  dependencies: readonly string[];
}>;

export type AnalysisDerivationRegistrationV1<Runtime> = Readonly<{
  derivationId: string;
  outputs: readonly AnalysisCanonicalOutputDefinitionV1[];
  requiredAnalysisIds: readonly string[];
  runtime: Runtime;
}>;

/**
 * Temporary read compatibility for an immutable exact release that exposed
 * outputs before Surface-owned derivations existed. New releases must express
 * the same selection through a versioned Surface instead.
 */
export type AnalysisLegacyExactOutputBindingV1 = Readonly<{
  exactOutputIds: readonly string[];
  runtimeDerivationIds: readonly string[];
  analysisIds: readonly string[];
}>;

export type AnalysisMethodRegistryV1<Runtime> = Readonly<{
  analysisRequestIds: readonly string[];
  derivations: readonly AnalysisDerivationRegistrationV1<Runtime>[];
  legacyExactOutputBindings: readonly AnalysisLegacyExactOutputBindingV1[];
  resolveExecutionPlan: StudioSimulationAnalysisExecutionPlanResolverV2;
}>;

export type ResolvedAnalysisDerivationV1<Runtime> = Readonly<{
  derivationId: string;
  runtime: Runtime;
}>;

export type ResolvedAnalysisMethodsV1<Runtime> = Readonly<{
  capabilities: readonly string[];
  derivations: readonly ResolvedAnalysisDerivationV1<Runtime>[];
  resolveExecutionPlan: StudioSimulationAnalysisExecutionPlanResolverV2;
}>;

/** Defines one code-owned method registry without choosing a Model Surface. */
export function defineAnalysisMethodRegistryV1<Runtime>(
  input: Readonly<{
    analysisRequestIds: readonly string[];
    derivations: readonly AnalysisDerivationRegistrationV1<Runtime>[];
    legacyExactOutputBindings?: readonly AnalysisLegacyExactOutputBindingV1[];
    resolveExecutionPlan: StudioSimulationAnalysisExecutionPlanResolverV2;
  }>,
): AnalysisMethodRegistryV1<Runtime> {
  const analysisRequestIds = uniqueIdsV1(
    input.analysisRequestIds,
    "analysis request",
  );
  const derivationIds = uniqueIdsV1(
    input.derivations.map(({ derivationId }) => derivationId),
    "analysis derivation",
  );
  const analysisIdSet = new Set(analysisRequestIds);
  const derivationIdSet = new Set(derivationIds);
  for (const derivation of input.derivations) {
    for (const analysisId of derivation.requiredAnalysisIds) {
      if (!analysisIdSet.has(analysisId)) {
        throw new Error(
          `Analysis derivation ${derivation.derivationId} requires unregistered analysis ${analysisId}`,
        );
      }
    }
  }
  const legacyExactOutputBindings = input.legacyExactOutputBindings ?? [];
  for (const binding of legacyExactOutputBindings) {
    if (binding.exactOutputIds.length === 0) {
      throw new Error("Legacy exact-output binding must name an output");
    }
    for (const derivationId of binding.runtimeDerivationIds) {
      if (!derivationIdSet.has(derivationId)) {
        throw new Error(
          `Legacy exact-output binding names unregistered derivation ${derivationId}`,
        );
      }
    }
    for (const analysisId of binding.analysisIds) {
      if (!analysisIdSet.has(analysisId)) {
        throw new Error(
          `Legacy exact-output binding names unregistered analysis ${analysisId}`,
        );
      }
    }
  }
  return Object.freeze({
    analysisRequestIds,
    derivations: Object.freeze([...input.derivations]),
    legacyExactOutputBindings: Object.freeze([...legacyExactOutputBindings]),
    resolveExecutionPlan: input.resolveExecutionPlan,
  });
}

/**
 * Resolves only the registered analysis methods selected by one immutable
 * Surface. The resolver knows no model family, analysis ID, or derivation
 * implementation; those belong to an injected method registry.
 */
export function resolveAnalysisMethodsForSurfaceV1<Runtime>(
  input: Readonly<{
    registry: AnalysisMethodRegistryV1<Runtime>;
    surfaceValue: unknown;
    exactOutputs?: readonly Readonly<{ outputId: string }>[];
  }>,
): ResolvedAnalysisMethodsV1<Runtime> {
  assertModelSurfaceReleaseManifestV1(input.surfaceValue);
  const surface: ModelSurfaceReleaseManifestV1 = input.surfaceValue;
  const registeredAnalysisIds = new Set(input.registry.analysisRequestIds);
  const derivationById = new Map(input.registry.derivations.map(
    (derivation) => [derivation.derivationId, derivation] as const,
  ));
  const selectedAnalysisIds = new Set<string>();
  const selectedDerivations = new Map<
    string,
    AnalysisDerivationRegistrationV1<Runtime>
  >();
  const capabilities = new Set<string>();
  const requestedDerivationIds = new Set<string>();

  for (const item of [
    ...surface.controlCatalog,
    ...surface.derivedOutputCatalog,
    ...surface.graphCatalog,
    ...surface.knobCatalog,
    ...surface.protocolCatalog,
  ]) {
    for (const capability of item.requiredCapabilities) {
      if (capability.startsWith("analysis/")) {
        selectAnalysisV1(
          capability.slice("analysis/".length),
          registeredAnalysisIds,
          selectedAnalysisIds,
          capabilities,
        );
      } else if (capability.startsWith("derivation/")) {
        requestedDerivationIds.add(capability.slice("derivation/".length));
      }
    }
  }
  for (const output of surface.derivedOutputCatalog) {
    requestedDerivationIds.add(output.derivationId);
  }

  for (const derivationId of requestedDerivationIds) {
    const method = derivationById.get(derivationId);
    if (method === undefined) continue;
    const declaredOutputs = surface.derivedOutputCatalog.filter(
      (output) => output.derivationId === derivationId,
    );
    if (!declaredOutputs.every((output) =>
      methodOwnsOutputSemanticsV1(method, output))) continue;
    selectedDerivations.set(derivationId, method);
    capabilities.add(derivationCapabilityV1(derivationId));
    for (const analysisId of method.requiredAnalysisIds) {
      selectAnalysisV1(
        analysisId,
        registeredAnalysisIds,
        selectedAnalysisIds,
        capabilities,
      );
    }
  }

  const exactOutputIds = new Set(
    (input.exactOutputs ?? []).map(({ outputId }) => outputId),
  );
  for (const binding of input.registry.legacyExactOutputBindings) {
    if (!binding.exactOutputIds.every((outputId) =>
      exactOutputIds.has(outputId))) continue;
    for (const derivationId of binding.runtimeDerivationIds) {
      const method = derivationById.get(derivationId);
      if (method !== undefined) selectedDerivations.set(derivationId, method);
    }
    for (const analysisId of binding.analysisIds) {
      selectAnalysisV1(
        analysisId,
        registeredAnalysisIds,
        selectedAnalysisIds,
        capabilities,
      );
    }
  }

  const resolveExecutionPlan: StudioSimulationAnalysisExecutionPlanResolverV2 =
    (analysisId) => selectedAnalysisIds.has(analysisId)
      ? input.registry.resolveExecutionPlan(analysisId)
      : null;
  return Object.freeze({
    capabilities: Object.freeze([...capabilities].sort()),
    derivations: Object.freeze([...selectedDerivations.values()].map(
      ({ derivationId, runtime }) => Object.freeze({ derivationId, runtime }),
    )),
    resolveExecutionPlan,
  });
}

function selectAnalysisV1(
  analysisId: string,
  registeredAnalysisIds: ReadonlySet<string>,
  selectedAnalysisIds: Set<string>,
  capabilities: Set<string>,
): void {
  if (!registeredAnalysisIds.has(analysisId)) return;
  selectedAnalysisIds.add(analysisId);
  capabilities.add(analysisCapabilityV1(analysisId));
}

function methodOwnsOutputSemanticsV1<Runtime>(
  method: AnalysisDerivationRegistrationV1<Runtime>,
  output: ModelSurfaceDerivedOutputDefinitionV1,
): boolean {
  const canonical = method.outputs.find(
    ({ outputId }) => outputId === output.outputId,
  );
  return canonical !== undefined
    && output.kind === canonical.kind
    && output.unit === canonical.unit
    && output.shape === canonical.shape
    && output.scope === canonical.scope
    && sameStringsV1(output.dependencies, canonical.dependencies);
}

function sameStringsV1(
  left: readonly string[],
  right: readonly string[],
): boolean {
  return left.length === right.length
    && left.every((value, index) => value === right[index]);
}

function uniqueIdsV1(values: readonly string[], label: string): readonly string[] {
  const result = new Set<string>();
  for (const value of values) {
    if (value.length === 0) throw new Error(`${label} ID must not be empty`);
    if (result.has(value)) throw new Error(`Duplicate ${label} ID ${value}`);
    result.add(value);
  }
  return Object.freeze([...result]);
}
