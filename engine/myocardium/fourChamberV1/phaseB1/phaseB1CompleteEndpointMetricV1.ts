import {
  computeCanonicalSha256,
  type CanonicalSha256HexProvider,
} from "@/engine/myocardium/fourChamberV1/manifests/canonicalJson";
import {
  assertCanonicalFourChamberNewtonScaleRegistryV1,
  validateFourChamberNewtonScaleRegistryV1,
  type FourChamberNewtonScaleRegistryV1,
} from "@/engine/myocardium/fourChamberV1/numerics/newtonScaleRegistryV1";
import {
  createPhaseB1EndpointStateV1,
  PHASE_B1_ENDPOINT_STATE_V1_ID,
  type PhaseB1EndpointStateV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1EndpointStateV1";
import {
  buildPhaseB1StoredDifferentialLabelsV1,
  encodePhaseB1StoredDifferentialStateV1,
  type PhaseB1SlsModeV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1StoredStateNewtonTopologyV1";
import {
  buildPhaseB1ProjectSyntheticEndpointScaleDescriptorV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/projectSyntheticShortHorizonProtocolV1";
import {
  NORMATIVE_MANIFEST_HASH_ALGORITHM,
} from "@/engine/myocardium/fourChamberV1/ids";
import {
  assertExactPlainRecordV1,
} from "@/engine/myocardium/fourChamberV1/validation/strictClosedRecordV1";

export const PHASE_B1_COMPLETE_ENDPOINT_PROJECTION_V1_ID =
  "phase-b1-complete-endpoint-projection-v1" as const;

export const PHASE_B1_COMPLETE_ENDPOINT_SCALE_DESCRIPTOR_V1_ID =
  "phase-b1-complete-endpoint-scale-descriptor-v1" as const;

export const PHASE_B1_COMPLETE_ENDPOINT_METRIC_V1_ID =
  "phase-b1-complete-endpoint-metric-v1" as const;

const TRISEG_ENDPOINT_LABELS = Object.freeze([
  "algebraic.triseg.V_m_S",
  "algebraic.triseg.y_m",
] as const);

export type PhaseB1CompleteEndpointProjectionHashPayloadV1 = Readonly<{
  schemaId: typeof PHASE_B1_COMPLETE_ENDPOINT_PROJECTION_V1_ID;
  slsMode: PhaseB1SlsModeV1;
  coordinateOrder:
    "stored-differential-state-followed-by-two-triseg-algebraic-coordinates";
  absoluteTimeExcluded: true;
  scalarCount: 61 | 56;
  labels: readonly string[];
  values: readonly number[];
}>;

export type PhaseB1CompleteEndpointProjectionV1 =
  PhaseB1CompleteEndpointProjectionHashPayloadV1 & Readonly<{
    hashAlgorithm: typeof NORMATIVE_MANIFEST_HASH_ALGORITHM;
    contentSha256: string;
  }>;

export type PhaseB1CompleteEndpointScaleDescriptorV1 = Readonly<{
  schemaId: typeof PHASE_B1_COMPLETE_ENDPOINT_SCALE_DESCRIPTOR_V1_ID;
  slsMode: PhaseB1SlsModeV1;
  scalarCount: 61 | 56;
  storedDifferentialStateCount: 59 | 54;
  triSegAlgebraicStateCount: 2;
  labels: readonly string[];
  scales: readonly number[];
  sourceNewtonScaleRegistryContentSha256: string;
  sourceRegistryFixedBeforeRun: true;
  sourceRegistryAdaptiveRescaling: false;
  metric:
    "max-abs-candidate-minus-reference-over-scale-plus-abs-reference";
  absoluteTimeExcluded: true;
}>;

export type PhaseB1CompleteEndpointMetricComponentV1 = Readonly<{
  index: number;
  label: string;
  referenceValue: number;
  candidateValue: number;
  scale: number;
  denominator: number;
  absoluteDifference: number;
  normalizedDistance: number;
}>;

export type PhaseB1CompleteEndpointMetricResultV1 = Readonly<{
  schemaId: typeof PHASE_B1_COMPLETE_ENDPOINT_METRIC_V1_ID;
  slsMode: PhaseB1SlsModeV1;
  scalarCount: 61 | 56;
  referenceProjection: PhaseB1CompleteEndpointProjectionV1;
  candidateProjection: PhaseB1CompleteEndpointProjectionV1;
  scaleDescriptor: PhaseB1CompleteEndpointScaleDescriptorV1;
  components: readonly PhaseB1CompleteEndpointMetricComponentV1[];
  maximumNormalizedDistance: number;
  maximizingScalarIndex: number;
  maximizingScalarLabel: string;
  absoluteTimeEqualityRequired: false;
  oneSupercycleDistanceDiagnosticOnly: true;
  periodicityAcceptanceEvaluated: false;
  periodicityAcceptanceClaimed: false;
  periodicityAcceptancePass: false;
}>;

export type BuildPhaseB1CompleteEndpointProjectionInputV1 = Readonly<{
  endpoint: PhaseB1EndpointStateV1;
  sha256Hex: CanonicalSha256HexProvider;
}>;

export type BuildPhaseB1CompleteEndpointScaleDescriptorInputV1 = Readonly<{
  slsMode: PhaseB1SlsModeV1;
  registry: FourChamberNewtonScaleRegistryV1;
  sha256Hex: CanonicalSha256HexProvider;
}>;

export type EvaluatePhaseB1CompleteEndpointMetricInputV1 = Readonly<{
  referenceEndpoint: PhaseB1EndpointStateV1;
  candidateEndpoint: PhaseB1EndpointStateV1;
  registry: FourChamberNewtonScaleRegistryV1;
  sha256Hex: CanonicalSha256HexProvider;
}>;

/**
 * Projects the complete non-time endpoint state in the canonical 61/56-scalar
 * order. Absolute time is deliberately absent from both the projection and
 * its normative content hash, so same-phase states from successive event
 * supercycles can be compared even though their absolute times differ.
 */
export function buildPhaseB1CompleteEndpointProjectionV1(
  input: BuildPhaseB1CompleteEndpointProjectionInputV1,
): PhaseB1CompleteEndpointProjectionV1 {
  assertExactPlainRecordV1(
    input,
    ["endpoint", "sha256Hex"],
    "Phase B1 complete endpoint projection input",
  );
  requireSha256Provider(input.sha256Hex);
  const endpoint = canonicalEndpoint(input.endpoint, "endpoint");
  const slsMode = endpoint.differentialState.slsMode;
  const labels = canonicalEndpointLabels(slsMode);
  const values = Object.freeze([
    ...encodePhaseB1StoredDifferentialStateV1(endpoint.differentialState),
    endpoint.triSegCoordinates.V_m_S,
    endpoint.triSegCoordinates.y_m,
  ]);
  const scalarCount = expectedScalarCount(slsMode);
  if (values.length !== scalarCount || labels.length !== scalarCount) {
    throw new Error("Phase B1 complete endpoint projection topology drifted");
  }
  values.forEach((value, index) => requireFinite(
    value,
    `complete endpoint projection values[${index}]`,
  ));
  const payload = deepFreeze<PhaseB1CompleteEndpointProjectionHashPayloadV1>({
    schemaId: PHASE_B1_COMPLETE_ENDPOINT_PROJECTION_V1_ID,
    slsMode,
    coordinateOrder:
      "stored-differential-state-followed-by-two-triseg-algebraic-coordinates",
    absoluteTimeExcluded: true,
    scalarCount,
    labels,
    values,
  });
  return deepFreeze({
    ...payload,
    hashAlgorithm: NORMATIVE_MANIFEST_HASH_ALGORITHM,
    contentSha256: computeCanonicalSha256(payload, input.sha256Hex),
  });
}

/**
 * Reuses the pre-existing project-synthetic endpoint scale mapping verbatim,
 * after authenticating that its registry is canonical, fixed before the run,
 * and non-adaptive.
 */
export function buildPhaseB1CompleteEndpointScaleDescriptorV1(
  input: BuildPhaseB1CompleteEndpointScaleDescriptorInputV1,
): PhaseB1CompleteEndpointScaleDescriptorV1 {
  assertExactPlainRecordV1(
    input,
    ["slsMode", "registry", "sha256Hex"],
    "Phase B1 complete endpoint scale input",
  );
  requireSlsMode(input.slsMode, "slsMode");
  requireSha256Provider(input.sha256Hex);
  const registry = validateFourChamberNewtonScaleRegistryV1(
    input.registry,
    input.sha256Hex,
  );
  assertCanonicalFourChamberNewtonScaleRegistryV1(registry);
  if (registry.fixedBeforeRun !== true || registry.adaptiveRescaling !== false) {
    throw new Error(
      "Phase B1 complete endpoint scales require a fixed non-adaptive registry",
    );
  }
  const source = buildPhaseB1ProjectSyntheticEndpointScaleDescriptorV1(
    input.slsMode,
    registry,
  );
  const labels = canonicalEndpointLabels(input.slsMode);
  if (
    source.endpointLabels.length !== labels.length
    || source.endpointLabels.some((label, index) => label !== labels[index])
  ) {
    throw new Error("Phase B1 complete endpoint label order drifted");
  }
  const scales = Object.freeze([...source.endpointScales]);
  scales.forEach((scale, index) => requirePositiveFinite(
    scale,
    `complete endpoint scales[${index}]`,
  ));
  const scalarCount = expectedScalarCount(input.slsMode);
  if (scales.length !== scalarCount) {
    throw new Error("Phase B1 complete endpoint scale topology drifted");
  }
  return deepFreeze({
    schemaId: PHASE_B1_COMPLETE_ENDPOINT_SCALE_DESCRIPTOR_V1_ID,
    slsMode: input.slsMode,
    scalarCount,
    storedDifferentialStateCount: source.storedDifferentialStateCount,
    triSegAlgebraicStateCount: 2 as const,
    labels,
    scales,
    sourceNewtonScaleRegistryContentSha256:
      source.sourceNewtonScaleRegistryContentSha256,
    sourceRegistryFixedBeforeRun: true as const,
    sourceRegistryAdaptiveRescaling: false as const,
    metric:
      "max-abs-candidate-minus-reference-over-scale-plus-abs-reference" as const,
    absoluteTimeExcluded: true as const,
  });
}

/**
 * Evaluates the model-spec periodic-state coordinate expression over every
 * stored differential scalar and both TriSeg algebraic coordinates. This
 * primitive is intentionally only a one-supercycle diagnostic: it cannot by
 * itself satisfy the consecutive-cycle, signed-flow, or tissue-drift gates.
 */
export function evaluatePhaseB1CompleteEndpointMetricV1(
  input: EvaluatePhaseB1CompleteEndpointMetricInputV1,
): PhaseB1CompleteEndpointMetricResultV1 {
  assertExactPlainRecordV1(
    input,
    ["referenceEndpoint", "candidateEndpoint", "registry", "sha256Hex"],
    "Phase B1 complete endpoint metric input",
  );
  requireSha256Provider(input.sha256Hex);
  const referenceProjection = buildPhaseB1CompleteEndpointProjectionV1({
    endpoint: input.referenceEndpoint,
    sha256Hex: input.sha256Hex,
  });
  const candidateProjection = buildPhaseB1CompleteEndpointProjectionV1({
    endpoint: input.candidateEndpoint,
    sha256Hex: input.sha256Hex,
  });
  if (referenceProjection.slsMode !== candidateProjection.slsMode) {
    throw new Error("cannot compare unlike Phase B1 SLS topologies");
  }
  const slsMode = referenceProjection.slsMode;
  const scaleDescriptor = buildPhaseB1CompleteEndpointScaleDescriptorV1({
    slsMode,
    registry: input.registry,
    sha256Hex: input.sha256Hex,
  });
  const components = deepFreeze(referenceProjection.values.map(
    (referenceValue, index): PhaseB1CompleteEndpointMetricComponentV1 => {
      const candidateValue = candidateProjection.values[index];
      const scale = scaleDescriptor.scales[index];
      const denominator = requirePositiveFinite(
        scale + Math.abs(referenceValue),
        `complete endpoint denominator[${index}]`,
      );
      const absoluteDifference = requireNonNegativeFinite(
        Math.abs(candidateValue - referenceValue),
        `complete endpoint absolute difference[${index}]`,
      );
      const normalizedDistance = requireNonNegativeFinite(
        absoluteDifference / denominator,
        `complete endpoint normalized distance[${index}]`,
      );
      return deepFreeze({
        index,
        label: scaleDescriptor.labels[index],
        referenceValue,
        candidateValue,
        scale,
        denominator,
        absoluteDifference,
        normalizedDistance,
      });
    },
  ));
  if (components.length !== scaleDescriptor.scalarCount) {
    throw new Error("Phase B1 complete endpoint metric topology drifted");
  }
  let maximizingScalarIndex = 0;
  for (let index = 1; index < components.length; index += 1) {
    if (
      components[index].normalizedDistance
        > components[maximizingScalarIndex].normalizedDistance
    ) maximizingScalarIndex = index;
  }
  const maximumNormalizedDistance = requireNonNegativeFinite(
    components[maximizingScalarIndex].normalizedDistance,
    "maximumNormalizedDistance",
  );
  return deepFreeze({
    schemaId: PHASE_B1_COMPLETE_ENDPOINT_METRIC_V1_ID,
    slsMode,
    scalarCount: scaleDescriptor.scalarCount,
    referenceProjection,
    candidateProjection,
    scaleDescriptor,
    components,
    maximumNormalizedDistance,
    maximizingScalarIndex,
    maximizingScalarLabel: components[maximizingScalarIndex].label,
    absoluteTimeEqualityRequired: false as const,
    oneSupercycleDistanceDiagnosticOnly: true as const,
    periodicityAcceptanceEvaluated: false as const,
    periodicityAcceptanceClaimed: false as const,
    periodicityAcceptancePass: false as const,
  });
}

export function phaseB1CompleteEndpointProjectionHashPayloadV1(
  projection: PhaseB1CompleteEndpointProjectionV1,
): PhaseB1CompleteEndpointProjectionHashPayloadV1 {
  assertExactPlainRecordV1(projection, [
    "schemaId",
    "slsMode",
    "coordinateOrder",
    "absoluteTimeExcluded",
    "scalarCount",
    "labels",
    "values",
    "hashAlgorithm",
    "contentSha256",
  ], "Phase B1 complete endpoint projection");
  const {
    hashAlgorithm: _hashAlgorithm,
    contentSha256: _contentSha256,
    ...payload
  } = projection;
  return deepFreeze(payload);
}

function canonicalEndpoint(
  endpoint: PhaseB1EndpointStateV1,
  field: string,
): PhaseB1EndpointStateV1 {
  assertExactPlainRecordV1(endpoint, [
    "stateId",
    "timeSec",
    "differentialState",
    "triSegCoordinates",
  ], `Phase B1 complete ${field}`);
  if (endpoint.stateId !== PHASE_B1_ENDPOINT_STATE_V1_ID) {
    throw new Error(`Phase B1 complete ${field} has an invalid stateId`);
  }
  return createPhaseB1EndpointStateV1({
    timeSec: endpoint.timeSec,
    differentialState: endpoint.differentialState,
    triSegCoordinates: endpoint.triSegCoordinates,
  });
}

function canonicalEndpointLabels(
  slsMode: PhaseB1SlsModeV1,
): readonly string[] {
  requireSlsMode(slsMode, "slsMode");
  const labels = Object.freeze([
    ...buildPhaseB1StoredDifferentialLabelsV1(slsMode),
    ...TRISEG_ENDPOINT_LABELS,
  ]);
  if (labels.length !== expectedScalarCount(slsMode)) {
    throw new Error("Phase B1 complete endpoint labels drifted");
  }
  return labels;
}

function expectedScalarCount(slsMode: PhaseB1SlsModeV1): 61 | 56 {
  return slsMode === "on" ? 61 : 56;
}

function requireSlsMode(
  value: unknown,
  field: string,
): asserts value is PhaseB1SlsModeV1 {
  if (value !== "on" && value !== "off") {
    throw new Error(`${field} must be on or off`);
  }
}

function requireSha256Provider(
  value: unknown,
): asserts value is CanonicalSha256HexProvider {
  if (typeof value !== "function") {
    throw new Error("sha256Hex must be a SHA-256 provider function");
  }
}

function requireFinite(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${field} must be finite`);
  }
  return value;
}

function requirePositiveFinite(value: unknown, field: string): number {
  const finite = requireFinite(value, field);
  if (finite <= 0) throw new Error(`${field} must be positive`);
  return finite;
}

function requireNonNegativeFinite(value: unknown, field: string): number {
  const finite = requireFinite(value, field);
  if (finite < 0) throw new Error(`${field} must be non-negative`);
  return finite;
}

function deepFreeze<T>(value: T, visited = new WeakSet<object>()): T {
  if (
    value === null
    || (typeof value !== "object" && typeof value !== "function")
  ) return value;
  const objectValue = value as object;
  if (visited.has(objectValue)) return value;
  visited.add(objectValue);
  for (const key of Reflect.ownKeys(objectValue)) {
    const descriptor = Reflect.getOwnPropertyDescriptor(objectValue, key);
    if (descriptor !== undefined && "value" in descriptor) {
      deepFreeze(descriptor.value, visited);
    }
  }
  return Object.freeze(value);
}
