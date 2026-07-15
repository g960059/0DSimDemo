import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  buildPhaseB1CompleteEndpointProjectionV1,
  buildPhaseB1CompleteEndpointScaleDescriptorV1,
  evaluatePhaseB1CompleteEndpointMetricV1,
  phaseB1CompleteEndpointProjectionHashPayloadV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1CompleteEndpointMetricV1";
import {
  createPhaseB1EndpointStateV1,
  type PhaseB1EndpointStateV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1EndpointStateV1";
import {
  buildPhaseB1SyntheticEventFreeMonolithicCaseV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/syntheticEventFreeMonolithicCaseV1";
import {
  computeCanonicalSha256,
} from "@/engine/myocardium/fourChamberV1/manifests/canonicalJson";

describe("four-chamber Phase B1 complete endpoint metric", () => {
  it.each([
    ["on", 61],
    ["off", 56],
  ] as const)(
    "exports the canonical SLS-%s projection and fixed scales over %i non-time scalars",
    (slsMode, scalarCount) => {
      const candidate = buildPhaseB1SyntheticEventFreeMonolithicCaseV1(
        slsMode,
        sha256,
      );
      const endpoint = candidate.warmStart.endpoint;
      const laterSameState = createPhaseB1EndpointStateV1({
        timeSec: endpoint.timeSec + 0.8,
        differentialState: endpoint.differentialState,
        triSegCoordinates: endpoint.triSegCoordinates,
      });
      const projection = buildPhaseB1CompleteEndpointProjectionV1({
        endpoint,
        sha256Hex: sha256,
      });
      const laterProjection = buildPhaseB1CompleteEndpointProjectionV1({
        endpoint: laterSameState,
        sha256Hex: sha256,
      });
      const descriptor = buildPhaseB1CompleteEndpointScaleDescriptorV1({
        slsMode,
        registry: candidate.model.newtonScaleRegistry,
        sha256Hex: sha256,
      });
      expect(projection.values).toHaveLength(scalarCount);
      expect(projection.labels).toHaveLength(scalarCount);
      expect(projection.scalarCount).toBe(scalarCount);
      expect(descriptor.scales).toHaveLength(scalarCount);
      expect(descriptor.labels).toEqual(projection.labels);
      expect(descriptor.scales.every((scale) => scale > 0)).toBe(true);
      expect(descriptor.sourceRegistryFixedBeforeRun).toBe(true);
      expect(descriptor.sourceRegistryAdaptiveRescaling).toBe(false);
      expect(projection.absoluteTimeExcluded).toBe(true);
      expect(laterProjection.values).toEqual(projection.values);
      expect(laterProjection.contentSha256).toBe(projection.contentSha256);
      expect(projection.contentSha256).toBe(computeCanonicalSha256(
        phaseB1CompleteEndpointProjectionHashPayloadV1(projection),
        sha256,
      ));
      expectRecursivelyFrozen(projection);
      expectRecursivelyFrozen(descriptor);

      const result = evaluatePhaseB1CompleteEndpointMetricV1({
        referenceEndpoint: endpoint,
        candidateEndpoint: laterSameState,
        registry: candidate.model.newtonScaleRegistry,
        sha256Hex: sha256,
      });
      expect(result.maximumNormalizedDistance).toBe(0);
      expect(result.absoluteTimeEqualityRequired).toBe(false);
      expect(result.oneSupercycleDistanceDiagnosticOnly).toBe(true);
      expect(result.periodicityAcceptanceEvaluated).toBe(false);
      expect(result.periodicityAcceptanceClaimed).toBe(false);
      expect(result.periodicityAcceptancePass).toBe(false);
      expectRecursivelyFrozen(result);
    },
  );

  it("uses s_j + abs(reference_j) for volume, flow, calcium, Land, SLS, and TriSeg perturbations", () => {
    const source = buildPhaseB1SyntheticEventFreeMonolithicCaseV1(
      "on",
      sha256,
    );
    const referenceEndpoint = source.warmStart.endpoint;
    const registry = source.model.newtonScaleRegistry;
    const descriptor = buildPhaseB1CompleteEndpointScaleDescriptorV1({
      slsMode: "on",
      registry,
      sha256Hex: sha256,
    });
    const projection = buildPhaseB1CompleteEndpointProjectionV1({
      endpoint: referenceEndpoint,
      sha256Hex: sha256,
    });
    const perturbations: readonly Readonly<{
      label: string;
      perturb: (copy: MutableEndpoint) => void;
    }>[] = [
      {
        label: "circulation.volume.V_LA",
        perturb: (copy) => {
          copy.differentialState.bloodVolumesM3.LA
            += registry.unknownScales.bloodVolumeM3.LA;
        },
      },
      {
        label: "circulation.flow.Q_AoV",
        perturb: (copy) => {
          copy.differentialState.inertialFlowsM3PerSec.Q_AoV
            += registry.unknownScales.inertialFlowM3PerSec;
        },
      },
      {
        label: "tissue.LVFW.patch-0.calcium.d",
        perturb: (copy) => {
          copy.differentialState.calciumByWall.LVFW.d
            += registry.unknownScales.calciumAndPopulation;
        },
      },
      {
        label: "tissue.LVFW.patch-0.land.xiW",
        perturb: (copy) => {
          copy.differentialState.landByWall.LVFW[4]
            += registry.unknownScales.landDistortionByWall.LVFW;
        },
      },
      {
        label: "tissue.LVFW.patch-0.sls.alphaV",
        perturb: (copy) => {
          if (copy.differentialState.slsMode !== "on") {
            throw new Error("test requires SLS-on topology");
          }
          copy.differentialState.slsAlphaVByWall.LVFW
            += registry.unknownScales.slsViscousStrain;
        },
      },
      {
        label: "algebraic.triseg.V_m_S",
        perturb: (copy) => {
          copy.triSegCoordinates.V_m_S
            += registry.unknownScales.septalMidwallVolumeM3;
        },
      },
    ];

    for (const { label, perturb } of perturbations) {
      const index = descriptor.labels.indexOf(label);
      expect(index, `missing canonical label ${label}`).toBeGreaterThanOrEqual(0);
      const copy = structuredClone(referenceEndpoint) as MutableEndpoint;
      perturb(copy);
      const candidateEndpoint = createPhaseB1EndpointStateV1({
        timeSec: referenceEndpoint.timeSec + 0.8,
        differentialState: copy.differentialState,
        triSegCoordinates: copy.triSegCoordinates,
      });
      const result = evaluatePhaseB1CompleteEndpointMetricV1({
        referenceEndpoint,
        candidateEndpoint,
        registry,
        sha256Hex: sha256,
      });
      const scale = descriptor.scales[index];
      const expected = scale / (scale + Math.abs(projection.values[index]));
      expect(result.maximumNormalizedDistance).toBeCloseTo(expected, 13);
      expect(result.maximizingScalarIndex).toBe(index);
      expect(result.maximizingScalarLabel).toBe(label);
      expect(result.components[index].absoluteDifference).toBeCloseTo(
        scale,
        13,
      );
      expect(result.components[index].denominator).toBe(
        scale + Math.abs(projection.values[index]),
      );
      expect(result.components[index].normalizedDistance).toBeCloseTo(
        expected,
        13,
      );
    }
  });

  it("preserves the physical SLS-off topology and rejects unlike modes", () => {
    const on = buildPhaseB1SyntheticEventFreeMonolithicCaseV1("on", sha256);
    const off = buildPhaseB1SyntheticEventFreeMonolithicCaseV1("off", sha256);
    const offDescriptor = buildPhaseB1CompleteEndpointScaleDescriptorV1({
      slsMode: "off",
      registry: off.model.newtonScaleRegistry,
      sha256Hex: sha256,
    });
    expect(offDescriptor.scalarCount).toBe(56);
    expect(offDescriptor.storedDifferentialStateCount).toBe(54);
    expect(offDescriptor.labels.some((label) => label.includes(".sls.")))
      .toBe(false);
    const offCopy = structuredClone(off.warmStart.endpoint) as MutableEndpoint;
    offCopy.differentialState.inertialFlowsM3PerSec.Q_PuV
      += off.model.newtonScaleRegistry.unknownScales.inertialFlowM3PerSec;
    const offPerturbed = createPhaseB1EndpointStateV1({
      timeSec: off.warmStart.endpoint.timeSec + 0.8,
      differentialState: offCopy.differentialState,
      triSegCoordinates: offCopy.triSegCoordinates,
    });
    const offResult = evaluatePhaseB1CompleteEndpointMetricV1({
      referenceEndpoint: off.warmStart.endpoint,
      candidateEndpoint: offPerturbed,
      registry: off.model.newtonScaleRegistry,
      sha256Hex: sha256,
    });
    const flowIndex = offDescriptor.labels.indexOf("circulation.flow.Q_PuV");
    const referenceProjection = buildPhaseB1CompleteEndpointProjectionV1({
      endpoint: off.warmStart.endpoint,
      sha256Hex: sha256,
    });
    const flowScale = offDescriptor.scales[flowIndex];
    expect(offResult.maximumNormalizedDistance).toBeCloseTo(
      flowScale
        / (flowScale + Math.abs(referenceProjection.values[flowIndex])),
      13,
    );
    expect(offResult.maximizingScalarIndex).toBe(flowIndex);
    expect(() => evaluatePhaseB1CompleteEndpointMetricV1({
      referenceEndpoint: off.warmStart.endpoint,
      candidateEndpoint: on.warmStart.endpoint,
      registry: off.model.newtonScaleRegistry,
      sha256Hex: sha256,
    })).toThrow(/unlike Phase B1 SLS topologies/);
  });

  it("rejects open inputs, non-finite endpoint coordinates, and non-fixed registries", () => {
    const source = buildPhaseB1SyntheticEventFreeMonolithicCaseV1(
      "on",
      sha256,
    );
    const endpoint = source.warmStart.endpoint;
    expect(() => evaluatePhaseB1CompleteEndpointMetricV1({
      referenceEndpoint: endpoint,
      candidateEndpoint: endpoint,
      registry: source.model.newtonScaleRegistry,
      sha256Hex: sha256,
      undeclared: true,
    } as never)).toThrow(/must contain exactly/);
    expect(() => buildPhaseB1CompleteEndpointProjectionV1({
      endpoint: {
        ...endpoint,
        triSegCoordinates: {
          ...endpoint.triSegCoordinates,
          V_m_S: Number.POSITIVE_INFINITY,
        },
      },
      sha256Hex: sha256,
    })).toThrow(/finite/);
    expect(() => buildPhaseB1CompleteEndpointScaleDescriptorV1({
      slsMode: "on",
      registry: {
        ...source.model.newtonScaleRegistry,
        fixedBeforeRun: false,
      } as never,
      sha256Hex: sha256,
    })).toThrow(/fixed before run/);
  });
});

type DeepMutable<Value> = Value extends object
  ? { -readonly [Key in keyof Value]: DeepMutable<Value[Key]> }
  : Value;

type MutableEndpoint = DeepMutable<PhaseB1EndpointStateV1>;

function sha256(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

function expectRecursivelyFrozen(
  value: unknown,
  visited = new WeakSet<object>(),
): void {
  if (
    value === null
    || (typeof value !== "object" && typeof value !== "function")
  ) return;
  const objectValue = value as object;
  if (visited.has(objectValue)) return;
  visited.add(objectValue);
  expect(Object.isFrozen(objectValue)).toBe(true);
  for (const key of Reflect.ownKeys(objectValue)) {
    const descriptor = Reflect.getOwnPropertyDescriptor(objectValue, key);
    if (descriptor !== undefined && "value" in descriptor) {
      expectRecursivelyFrozen(descriptor.value, visited);
    }
  }
}
