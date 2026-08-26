import { describe, expect, it } from "vitest";

import {
  defineAnalysisMethodRegistryV1,
  resolveAnalysisMethodsForSurfaceV1,
} from "@/analysis/contracts/AnalysisMethodRegistryV1";
import surfaceValue from
  "@/studio/integrations/mainWireIntegratedV3/model-surface-workbench-analysis-v1.json";

const derivation = surfaceValue.derivedOutputCatalog[0]!;
const analysisId =
  "main-wire-integrated-v3-formal-fixed-tbv-pressure-volume-relations-v1";

describe("analysis method registry V1", () => {
  it("resolves only methods supplied by the injected registry", () => {
    const runtime = Object.freeze({ marker: "injected" as const });
    const registry = defineAnalysisMethodRegistryV1({
      analysisRequestIds: [analysisId],
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

  it("does not infer Main Wire methods when the registry is empty", () => {
    const resolved = resolveAnalysisMethodsForSurfaceV1({
      registry: defineAnalysisMethodRegistryV1({
        analysisRequestIds: [],
        derivations: [],
        resolveExecutionPlan: () => null,
      }),
      surfaceValue,
    });

    expect(resolved.capabilities).toEqual([]);
    expect(resolved.derivations).toEqual([]);
    expect(resolved.resolveExecutionPlan(analysisId)).toBeNull();
  });

  it("selects explicitly registered compatibility runtimes without inventing a Surface capability", () => {
    const runtime = Object.freeze({ marker: "legacy" as const });
    const registry = defineAnalysisMethodRegistryV1({
      analysisRequestIds: [analysisId],
      derivations: [{
        derivationId: derivation.derivationId,
        outputs: [],
        requiredAnalysisIds: [analysisId],
        runtime,
      }],
      legacyExactOutputBindings: [{
        exactOutputIds: ["legacy.output"],
        runtimeDerivationIds: [derivation.derivationId],
        analysisIds: [analysisId],
      }],
      resolveExecutionPlan: () => null,
    });

    const resolved = resolveAnalysisMethodsForSurfaceV1({
      registry,
      surfaceValue: {
        ...surfaceValue,
        derivedOutputCatalog: [],
        graphCatalog: [],
      },
      exactOutputs: [{ outputId: "legacy.output" }],
    });

    expect(resolved.capabilities).toEqual([`analysis/${analysisId}`]);
    expect(resolved.derivations).toEqual([{
      derivationId: derivation.derivationId,
      runtime,
    }]);
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
