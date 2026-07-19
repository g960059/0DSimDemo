import type {
  NonCoronaryCirculationRuntimeParamsV1,
  NonCoronaryNodeNameV1,
} from "@/engine/core/nonCoronaryCirculationBackwardEulerV1";
import {
  NON_CORONARY_NODE_NAMES_V1,
} from "@/engine/core/nonCoronaryCirculationBackwardEulerV1";
import type {
  MainWireCommonPericardiumBindingV1,
} from "@/engine/myocardium/mechanics/mainWireCommonPericardiumBindingV1";
import {
  validateMainWireFourValveDiseasePresetV1,
  type MainWireFourValveDiseaseBracketIdV1,
  type MainWireFourValveDiseasePresetV1,
} from "@/engine/mechanics2/valve/MainWireFourValveDiseasePresetV1";
import {
  loadMainWireAdultFiveWallNonCoronaryReleaseV1,
  MAIN_WIRE_ADULT_FIVE_WALL_NONCORONARY_INITIALIZATION_PROTOCOL_V1_ID,
} from "@/engine/scientific/assembly";
import {
  canonicalJsonStringify,
  cloneAndFreezeCanonicalJson,
  loadSimulationReleaseV1,
  sameSimulationReleaseRef,
  SHA256_HEX_PATTERN,
  sha256CanonicalJsonHex,
  simulationReleaseRefIssuesV1,
  type CanonicalJsonObject,
  type SimulationReleaseRef,
  type SimulationReleaseV1,
} from "@/engine/scientific/release";

export const MAIN_WIRE_SCIENTIFIC_SESSION_INTENT_V1_SCHEMA_ID =
  "circleheart-main-wire-scientific-session-intent-v1" as const;
export const MAIN_WIRE_SCIENTIFIC_RESOLVED_SESSION_INPUT_V1_SCHEMA_ID =
  "circleheart-main-wire-resolved-session-input-v1" as const;
export const MAIN_WIRE_SCIENTIFIC_SESSION_INPUT_RESOLVER_V1_ID =
  "main-wire-five-wall-session-input-resolver-v1" as const;
export const MAIN_WIRE_SCIENTIFIC_SESSION_INPUT_V1_DIGEST_SEMANTICS =
  "sha256-canonical-json-payload-without-sessionInputSha256" as const;

export const MAIN_WIRE_SCIENTIFIC_SEVERE_VALVE_RESEARCH_BRACKET_IDS_V1 =
  Object.freeze([
    "AS-severe",
    "AR-severe",
    "MS-severe",
    "MR-severe",
    "TS-severe",
    "TR-severe",
    "PS-severe",
    "PR-severe",
  ] as const satisfies readonly MainWireFourValveDiseaseBracketIdV1[]);

export type MainWireScientificSevereValveResearchBracketIdV1 =
  typeof MAIN_WIRE_SCIENTIFIC_SEVERE_VALVE_RESEARCH_BRACKET_IDS_V1[number];

export type MainWireScientificValvePresetSelectionOperationV1 = Readonly<{
  kind: "select-valve-research-bracket";
  target: "circulation.valvePreset";
  compositionPolicy: "exclusive-component-selection";
  bracketId: MainWireScientificSevereValveResearchBracketIdV1;
}>;

export type MainWireScientificSessionIntentV1 = Readonly<{
  schemaId: typeof MAIN_WIRE_SCIENTIFIC_SESSION_INTENT_V1_SCHEMA_ID;
  schemaVersion: 1;
  releaseRef: SimulationReleaseRef;
  parameterOperations:
    readonly []
    | readonly [MainWireScientificValvePresetSelectionOperationV1];
  initialization: Readonly<{
    kind: "release-resolved-fixed-tbv-cold-start";
    protocolId:
      typeof MAIN_WIRE_ADULT_FIVE_WALL_NONCORONARY_INITIALIZATION_PROTOCOL_V1_ID;
    protocolVersion: "1.0.0";
  }>;
}>;

export type MainWireScientificResolvedNodeVolumesV1 = Readonly<
  Record<NonCoronaryNodeNameV1, number>
>;

export type MainWireScientificResolvedSessionInputV1 = Readonly<{
  schemaId: typeof MAIN_WIRE_SCIENTIFIC_RESOLVED_SESSION_INPUT_V1_SCHEMA_ID;
  schemaVersion: 1;
  releaseRef: SimulationReleaseRef;
  resolver: Readonly<{
    id: typeof MAIN_WIRE_SCIENTIFIC_SESSION_INPUT_RESOLVER_V1_ID;
    version: "1.0.0";
    digestSemantics:
      typeof MAIN_WIRE_SCIENTIFIC_SESSION_INPUT_V1_DIGEST_SEMANTICS;
  }>;
  sourceIntent: MainWireScientificSessionIntentV1;
  resolvedParameters: Readonly<{
    mechanics: Readonly<{
      providerId: string;
      parameterSetId: string;
      parameterIdentityHash: string;
      laSlsMode: "on";
    }>;
    calciumDrive: Readonly<{
      driveId: string;
      fixedPrior: CanonicalJsonObject;
    }>;
    commonPericardium: Readonly<{
      mode: "on";
      caseId: "healthy-slack";
      resolvedBinding: MainWireCommonPericardiumBindingV1;
    }>;
    circulationRuntime: NonCoronaryCirculationRuntimeParamsV1;
  }>;
  initialization: Readonly<{
    protocolId:
      typeof MAIN_WIRE_ADULT_FIVE_WALL_NONCORONARY_INITIALIZATION_PROTOCOL_V1_ID;
    protocolVersion: "1.0.0";
    initialTimeSec: 0;
    initialRevision: 0;
    fixedTotalBloodVolumeMl: number;
    resolvedNodeVolumesMl: MainWireScientificResolvedNodeVolumesV1;
  }>;
  claims: Readonly<{
    exactReleaseBound: true;
    completeResolvedRuntimeParameterization: true;
    releaseResolvedInitializationConsumedDirectly: true;
    implicitLastWriteWinsApplied: false;
    parameterSearchPerformed: false;
    parameterFittingPerformed: false;
    clinicalDiagnosisClaimed: false;
    patientSpecificFitClaimed: false;
  }>;
  sessionInputSha256: string;
}>;

type MainWireScientificResolvedSessionInputPayloadV1 = Omit<
  MainWireScientificResolvedSessionInputV1,
  "sessionInputSha256"
>;

export class MainWireScientificResolvedSessionInputValidationErrorV1
  extends Error {
  readonly issues: readonly string[];

  constructor(issues: readonly string[]) {
    const immutable = Object.freeze([...issues]);
    super(`main-wire resolved session input rejected: ${immutable.join("; ")}`);
    this.name = "MainWireScientificResolvedSessionInputValidationErrorV1";
    this.issues = immutable;
  }
}

export function mainWireScientificSessionIntentV1(
  releaseRef: SimulationReleaseRef,
  bracketId: MainWireScientificSevereValveResearchBracketIdV1 | null = null,
): MainWireScientificSessionIntentV1 {
  if (
    bracketId !== null
    && !MAIN_WIRE_SCIENTIFIC_SEVERE_VALVE_RESEARCH_BRACKET_IDS_V1.includes(
      bracketId as typeof MAIN_WIRE_SCIENTIFIC_SEVERE_VALVE_RESEARCH_BRACKET_IDS_V1[number],
    )
  ) {
    throw new MainWireScientificResolvedSessionInputValidationErrorV1([
      `unknown valve research bracket ${bracketId}`,
    ]);
  }
  const parameterOperations = bracketId === null
    ? []
    : [{
      kind: "select-valve-research-bracket" as const,
      target: "circulation.valvePreset" as const,
      compositionPolicy: "exclusive-component-selection" as const,
      bracketId,
    }];
  return loadMainWireScientificSessionIntentV1({
    schemaId: MAIN_WIRE_SCIENTIFIC_SESSION_INTENT_V1_SCHEMA_ID,
    schemaVersion: 1,
    releaseRef,
    parameterOperations,
    initialization: {
      kind: "release-resolved-fixed-tbv-cold-start",
      protocolId:
        MAIN_WIRE_ADULT_FIVE_WALL_NONCORONARY_INITIALIZATION_PROTOCOL_V1_ID,
      protocolVersion: "1.0.0",
    },
  });
}

export function loadMainWireScientificSessionIntentV1(
  value: unknown,
): MainWireScientificSessionIntentV1 {
  const safe = cloneCanonicalObject(value, "session intent");
  const issues = sessionIntentIssues(safe);
  if (issues.length > 0) {
    throw new MainWireScientificResolvedSessionInputValidationErrorV1(issues);
  }
  return safe as unknown as MainWireScientificSessionIntentV1;
}

export async function resolveMainWireScientificSessionInputV1(
  untrustedRelease: unknown,
  untrustedIntent: unknown,
): Promise<MainWireScientificResolvedSessionInputV1> {
  const release = await loadFixedMainWireRelease(untrustedRelease);
  const intent = loadMainWireScientificSessionIntentV1(untrustedIntent);
  if (!sameSimulationReleaseRef(release.ref, intent.releaseRef)) {
    throw new MainWireScientificResolvedSessionInputValidationErrorV1([
      "session intent releaseRef does not match the resolved release",
    ]);
  }
  const payload = resolvedPayload(release, intent);
  return cloneAndFreezeCanonicalJson<CanonicalJsonObject>({
    ...payload,
    sessionInputSha256: await sha256CanonicalJsonHex(payload),
  }) as unknown as MainWireScientificResolvedSessionInputV1;
}

export async function loadMainWireScientificResolvedSessionInputV1(
  untrustedRelease: unknown,
  value: unknown,
): Promise<MainWireScientificResolvedSessionInputV1> {
  const safe = cloneCanonicalObject(value, "resolved session input");
  const issues = resolvedEnvelopeIssues(safe);
  if (issues.length > 0) {
    throw new MainWireScientificResolvedSessionInputValidationErrorV1(issues);
  }
  const typed = safe as unknown as MainWireScientificResolvedSessionInputV1;
  const { sessionInputSha256, ...payload } = typed;
  const expectedSha256 = await sha256CanonicalJsonHex(payload);
  if (sessionInputSha256 !== expectedSha256) {
    throw new MainWireScientificResolvedSessionInputValidationErrorV1([
      "sessionInputSha256 does not match the canonical resolved payload",
    ]);
  }
  const expected = await resolveMainWireScientificSessionInputV1(
    untrustedRelease,
    typed.sourceIntent,
  );
  if (canonicalJsonStringify(expected) !== canonicalJsonStringify(typed)) {
    throw new MainWireScientificResolvedSessionInputValidationErrorV1([
      "resolved session input does not match release-bound re-resolution",
    ]);
  }
  return expected;
}

function resolvedPayload(
  release: SimulationReleaseV1,
  intent: MainWireScientificSessionIntentV1,
): MainWireScientificResolvedSessionInputPayloadV1 {
  const scientific = requiredObject(
    release.manifest.scientificModel.snapshot,
    "release scientificModel.snapshot",
  );
  const mechanics = requiredObject(scientific.mechanics, "release mechanics");
  const providerMetadata = requiredObject(
    mechanics.providerMetadata,
    "release mechanics.providerMetadata",
  );
  const activation = requiredObject(scientific.activation, "release activation");
  const pericardium = requiredObject(
    scientific.commonPericardium,
    "release commonPericardium",
  );
  const initialization = requiredObject(
    scientific.initialization,
    "release initialization",
  );
  const bloodVolume = requiredObject(
    initialization.bloodVolumeOperatingPoint,
    "release bloodVolumeOperatingPoint",
  );
  const valve = requiredObject(scientific.valve, "release valve");
  const numerical = requiredObject(
    release.manifest.numericalRuntime.snapshot,
    "release numericalRuntime.snapshot",
  );
  const fixedRuntime = requiredObject(
    numerical.fixedHealthyRuntime,
    "release fixedHealthyRuntime",
  );
  const selectedValvePreset = valvePresetForIntent(valve, intent);
  const circulationRuntime = cloneAndFreezeCanonicalJson<CanonicalJsonObject>({
    ...fixedRuntime,
    valvePreset: selectedValvePreset,
  }) as unknown as NonCoronaryCirculationRuntimeParamsV1;
  const resolvedBinding = cloneAndFreezeCanonicalJson<CanonicalJsonObject>(
    pericardium.resolvedBinding,
  ) as unknown as MainWireCommonPericardiumBindingV1;

  const payload = {
    schemaId: MAIN_WIRE_SCIENTIFIC_RESOLVED_SESSION_INPUT_V1_SCHEMA_ID,
    schemaVersion: 1 as const,
    releaseRef: release.ref,
    resolver: {
      id: MAIN_WIRE_SCIENTIFIC_SESSION_INPUT_RESOLVER_V1_ID,
      version: "1.0.0" as const,
      digestSemantics:
        MAIN_WIRE_SCIENTIFIC_SESSION_INPUT_V1_DIGEST_SEMANTICS,
    },
    sourceIntent: intent,
    resolvedParameters: {
      mechanics: {
        providerId: requiredString(providerMetadata.providerId, "providerId"),
        parameterSetId: requiredString(
          providerMetadata.parameterSetId,
          "parameterSetId",
        ),
        parameterIdentityHash: requiredString(
          providerMetadata.parameterIdentityHash,
          "parameterIdentityHash",
        ),
        laSlsMode: "on" as const,
      },
      calciumDrive: {
        driveId: requiredString(activation.driveId, "activation.driveId"),
        fixedPrior: requiredObject(
          activation.fixedPrior,
          "activation.fixedPrior",
        ),
      },
      commonPericardium: {
        mode: requiredLiteral(pericardium.mode, "on", "pericardium.mode"),
        caseId: requiredLiteral(
          pericardium.caseId,
          "healthy-slack",
          "pericardium.caseId",
        ),
        resolvedBinding,
      },
      circulationRuntime,
    },
    initialization: {
      protocolId:
        MAIN_WIRE_ADULT_FIVE_WALL_NONCORONARY_INITIALIZATION_PROTOCOL_V1_ID,
      protocolVersion: "1.0.0" as const,
      initialTimeSec: 0 as const,
      initialRevision: 0 as const,
      fixedTotalBloodVolumeMl: requiredFiniteNumber(
        bloodVolume.fixedTotalBloodVolumeMl,
        "fixedTotalBloodVolumeMl",
      ),
      resolvedNodeVolumesMl: requiredNodeVolumes(
        bloodVolume.resolvedNodeVolumesMl,
        "resolvedNodeVolumesMl",
      ),
    },
    claims: {
      exactReleaseBound: true as const,
      completeResolvedRuntimeParameterization: true as const,
      releaseResolvedInitializationConsumedDirectly: true as const,
      implicitLastWriteWinsApplied: false as const,
      parameterSearchPerformed: false as const,
      parameterFittingPerformed: false as const,
      clinicalDiagnosisClaimed: false as const,
      patientSpecificFitClaimed: false as const,
    },
  } satisfies MainWireScientificResolvedSessionInputPayloadV1;
  return cloneAndFreezeCanonicalJson<CanonicalJsonObject>(payload) as unknown as
    MainWireScientificResolvedSessionInputPayloadV1;
}

function valvePresetForIntent(
  valveSnapshot: CanonicalJsonObject,
  intent: MainWireScientificSessionIntentV1,
): MainWireFourValveDiseasePresetV1 {
  const operation = intent.parameterOperations[0];
  const rawPreset = operation === undefined
    ? valveSnapshot.healthyPreset
    : requiredObject(
      valveSnapshot.researchPresetCatalog,
      "release valve.researchPresetCatalog",
    )[operation.bracketId];
  const preset = cloneAndFreezeCanonicalJson<CanonicalJsonObject>(rawPreset) as
    unknown as MainWireFourValveDiseasePresetV1;
  const issues = validateMainWireFourValveDiseasePresetV1(preset);
  if (issues.length > 0) {
    throw new MainWireScientificResolvedSessionInputValidationErrorV1(
      issues.map((issue) => `release valve preset: ${issue}`),
    );
  }
  const expectedBracketIds = operation === undefined
    ? []
    : [operation.bracketId];
  if (canonicalJsonStringify(preset.bracketIds)
    !== canonicalJsonStringify(expectedBracketIds)) {
    throw new MainWireScientificResolvedSessionInputValidationErrorV1([
      "release valve preset does not match the selected bracket",
    ]);
  }
  return preset;
}

async function loadFixedMainWireRelease(
  untrustedRelease: unknown,
): Promise<SimulationReleaseV1> {
  const [loaded, canonical] = await Promise.all([
    loadSimulationReleaseV1(untrustedRelease),
    loadMainWireAdultFiveWallNonCoronaryReleaseV1(),
  ]);
  if (!sameSimulationReleaseRef(loaded.ref, canonical.ref)) {
    throw new MainWireScientificResolvedSessionInputValidationErrorV1([
      "release does not identify the fixed main-wire assembly",
    ]);
  }
  return loaded;
}

function sessionIntentIssues(value: unknown): string[] {
  const issues = exactObjectIssues(value, [
    "schemaId",
    "schemaVersion",
    "releaseRef",
    "parameterOperations",
    "initialization",
  ], "session intent");
  if (!isRecord(value)) return issues;
  if (value.schemaId !== MAIN_WIRE_SCIENTIFIC_SESSION_INTENT_V1_SCHEMA_ID) {
    issues.push("session intent schemaId is unsupported");
  }
  if (value.schemaVersion !== 1) {
    issues.push("session intent schemaVersion must be 1");
  }
  issues.push(...simulationReleaseRefIssuesV1(value.releaseRef));
  if (!Array.isArray(value.parameterOperations)
    || value.parameterOperations.length > 1) {
    issues.push(
      "parameterOperations must contain zero or one exclusive component selection",
    );
  } else if (value.parameterOperations.length === 1) {
    const operation = value.parameterOperations[0];
    issues.push(...exactObjectIssues(operation, [
      "kind",
      "target",
      "compositionPolicy",
      "bracketId",
    ], "session intent.parameterOperations[0]"));
    if (isRecord(operation)) {
      if (operation.kind !== "select-valve-research-bracket") {
        issues.push("valve operation kind is unsupported");
      }
      if (operation.target !== "circulation.valvePreset") {
        issues.push("valve operation target is unsupported");
      }
      if (operation.compositionPolicy !== "exclusive-component-selection") {
        issues.push("valve operation compositionPolicy is unsupported");
      }
      if (
        typeof operation.bracketId !== "string"
        || !MAIN_WIRE_SCIENTIFIC_SEVERE_VALVE_RESEARCH_BRACKET_IDS_V1.includes(
          operation.bracketId as
            MainWireScientificSevereValveResearchBracketIdV1,
        )
      ) issues.push("valve operation bracketId is unsupported");
    }
  }
  issues.push(...fixedObjectIssues(value.initialization, {
    kind: "release-resolved-fixed-tbv-cold-start",
    protocolId:
      MAIN_WIRE_ADULT_FIVE_WALL_NONCORONARY_INITIALIZATION_PROTOCOL_V1_ID,
    protocolVersion: "1.0.0",
  }, "session intent.initialization"));
  return issues;
}

function resolvedEnvelopeIssues(value: unknown): string[] {
  const issues = exactObjectIssues(value, [
    "schemaId",
    "schemaVersion",
    "releaseRef",
    "resolver",
    "sourceIntent",
    "resolvedParameters",
    "initialization",
    "claims",
    "sessionInputSha256",
  ], "resolved session input");
  if (!isRecord(value)) return issues;
  if (value.schemaId
    !== MAIN_WIRE_SCIENTIFIC_RESOLVED_SESSION_INPUT_V1_SCHEMA_ID) {
    issues.push("resolved session input schemaId is unsupported");
  }
  if (value.schemaVersion !== 1) {
    issues.push("resolved session input schemaVersion must be 1");
  }
  issues.push(...simulationReleaseRefIssuesV1(value.releaseRef));
  issues.push(...fixedObjectIssues(value.resolver, {
    id: MAIN_WIRE_SCIENTIFIC_SESSION_INPUT_RESOLVER_V1_ID,
    version: "1.0.0",
    digestSemantics:
      MAIN_WIRE_SCIENTIFIC_SESSION_INPUT_V1_DIGEST_SEMANTICS,
  }, "resolved session input.resolver"));
  issues.push(...sessionIntentIssues(value.sourceIntent));
  if (typeof value.sessionInputSha256 !== "string"
    || !SHA256_HEX_PATTERN.test(value.sessionInputSha256)) {
    issues.push("sessionInputSha256 must be a SHA-256 digest");
  }
  if (isRecord(value.releaseRef)
    && isRecord(value.sourceIntent)
    && !sameSimulationReleaseRef(
      value.releaseRef as unknown as SimulationReleaseRef,
      value.sourceIntent.releaseRef as unknown as SimulationReleaseRef,
    )) {
    issues.push("resolved releaseRef must match source intent releaseRef");
  }
  return issues;
}

function fixedObjectIssues(
  value: unknown,
  expected: Readonly<Record<string, string | number>>,
  path: string,
): string[] {
  const issues = exactObjectIssues(value, Object.keys(expected), path);
  if (!isRecord(value)) return issues;
  for (const [key, expectedValue] of Object.entries(expected)) {
    if (value[key] !== expectedValue) {
      issues.push(`${path}.${key} is unsupported`);
    }
  }
  return issues;
}

function exactObjectIssues(
  value: unknown,
  expectedKeys: readonly string[],
  path: string,
): string[] {
  if (!isRecord(value)) return [`${path} must be an object`];
  const actual = Object.keys(value).sort();
  const expected = [...expectedKeys].sort();
  return canonicalJsonStringify(actual) === canonicalJsonStringify(expected)
    ? []
    : [`${path} must contain exactly keys ${expected.join(", ")}`];
}

function cloneCanonicalObject(value: unknown, path: string): CanonicalJsonObject {
  try {
    return cloneAndFreezeCanonicalJson<CanonicalJsonObject>(value);
  } catch (error) {
    throw new MainWireScientificResolvedSessionInputValidationErrorV1([
      `${path}: ${error instanceof Error ? error.message : String(error)}`,
    ]);
  }
}

function requiredObject(value: unknown, path: string): CanonicalJsonObject {
  if (!isRecord(value)) {
    throw new MainWireScientificResolvedSessionInputValidationErrorV1([
      `${path} must be an object in the release artifact`,
    ]);
  }
  return value as CanonicalJsonObject;
}

function requiredString(value: unknown, path: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new MainWireScientificResolvedSessionInputValidationErrorV1([
      `${path} must be a non-empty string in the release artifact`,
    ]);
  }
  return value;
}

function requiredFiniteNumber(value: unknown, path: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new MainWireScientificResolvedSessionInputValidationErrorV1([
      `${path} must be finite in the release artifact`,
    ]);
  }
  return value;
}

function requiredNodeVolumes(
  value: unknown,
  path: string,
): MainWireScientificResolvedNodeVolumesV1 {
  const issues = exactObjectIssues(value, NON_CORONARY_NODE_NAMES_V1, path);
  if (isRecord(value)) {
    for (const node of NON_CORONARY_NODE_NAMES_V1) {
      const volume = value[node];
      if (typeof volume !== "number" || !Number.isFinite(volume) || volume <= 0) {
        issues.push(`${path}.${node} must be finite and positive`);
      }
    }
  }
  if (issues.length > 0) {
    throw new MainWireScientificResolvedSessionInputValidationErrorV1(issues);
  }
  return cloneAndFreezeCanonicalJson<CanonicalJsonObject>(value) as unknown as
    MainWireScientificResolvedNodeVolumesV1;
}

function requiredLiteral<T extends string>(
  value: unknown,
  expected: T,
  path: string,
): T {
  if (value !== expected) {
    throw new MainWireScientificResolvedSessionInputValidationErrorV1([
      `${path} must be ${expected} in the release artifact`,
    ]);
  }
  return expected;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
