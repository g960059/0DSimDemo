import { describe, expect, it } from "vitest";

import {
  defineAnalysisMethodRegistryV1,
  resolveAnalysisMethodsForSurfaceV1,
} from "@/analysis/contracts/AnalysisMethodRegistryV1";
import { resolveRegisteredAnalysisMethodsV1 } from
  "@/analysis/registry/RegisteredAnalysisMethodsV1";
import { assertModelSurfaceReleaseManifestV1 } from
  "@/studio/contracts/v2/modelSurface";
import surfaceValue from
  "@/studio/integrations/mainWireIntegratedV3/model-surface-workbench-analysis-v1.json";

const derivation = surfaceValue.derivedOutputCatalog[0]!;
const analysisId =
  "main-wire-integrated-v3-formal-fixed-tbv-pressure-volume-relations-v1";
const surfaceAnalysisIds = Object.freeze([...new Set([
  ...surfaceValue.controlCatalog,
  ...surfaceValue.derivedOutputCatalog,
  ...surfaceValue.graphCatalog,
  ...surfaceValue.knobCatalog,
  ...surfaceValue.protocolCatalog,
].flatMap(({ requiredCapabilities }) =>
  requiredCapabilities.flatMap((capability) =>
    capability.startsWith("analysis/")
      ? [capability.slice("analysis/".length)]
      : [])))]);

describe("analysis method registry V1", () => {
  it("resolves only methods supplied by the injected registry", () => {
    const runtime = Object.freeze({ marker: "injected" as const });
    const registry = defineAnalysisMethodRegistryV1({
      analysisRequestIds: surfaceAnalysisIds,
      derivations: [{
        derivationId: derivation.derivationId,
        outputs: surfaceValue.derivedOutputCatalog.map((output) => ({
          outputId: output.outputId,
          kind: "metric" as const,
          unit: output.unit,
          shape: output.shape as "scalar" | "vector",
          scope: output.scope as "instant" | "beat" | "window",
          dependencies: output.dependencies,
        })),
        requiredAnalysisIds: [analysisId],
        runtime,
      }],
      resolveExecutionPlan: () => null,
    });

    const resolved = resolveAnalysisMethodsForSurfaceV1({
      registry,
      surfaceValue,
    });

    expect(resolved.capabilities).toContain(`analysis/${analysisId}`);
    expect(resolved.capabilities).toContain(
      `derivation/${derivation.derivationId}`,
    );
    expect(resolved.derivations).toEqual([{
      derivationId: derivation.derivationId,
      runtime,
    }]);
  });

  it("fails explicitly when this client lacks a Surface-pinned method", () => {
    expect(() => resolveAnalysisMethodsForSurfaceV1({
      registry: defineAnalysisMethodRegistryV1({
        analysisRequestIds: [],
        derivations: [],
        resolveExecutionPlan: () => null,
      }),
      surfaceValue,
    })).toThrow(/Client does not support analysis/);
  });

  it("dispatches registered methods by model family", () => {
    const foreignSurface: unknown = {
      ...surfaceValue,
      modelFamilyId: "model-family/foreign-v1",
    };
    assertModelSurfaceReleaseManifestV1(foreignSurface);
    expect(() => resolveRegisteredAnalysisMethodsV1(
      foreignSurface,
    )).toThrow(/No analysis method registry is available/);
  });

  it("fails registry definition on duplicate or dangling identities", () => {
    expect(() => defineAnalysisMethodRegistryV1({
      analysisRequestIds: [analysisId, analysisId],
      derivations: [],
      resolveExecutionPlan: () => null,
    })).toThrow(/Duplicate analysis request ID/);

    expect(() => defineAnalysisMethodRegistryV1({
      analysisRequestIds: [],
      derivations: [{
        derivationId: "derivation/test-v1",
        outputs: [],
        requiredAnalysisIds: [analysisId],
        runtime: null,
      }],
      resolveExecutionPlan: () => null,
    })).toThrow(/requires unregistered analysis/);
  });
});
